use std::{io::{self, Write}, path::{Path, PathBuf}, process::Stdio, time::Duration};

use serde::{Deserialize, Serialize};
use tokio::{io::{AsyncRead, AsyncReadExt, AsyncWriteExt}, process::Command};
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

pub(super) const IMAGE: &str = "python:3.12-alpine";
const MAX_SOURCE: usize = 16 * 1024;
const MAX_STREAM: usize = 1200;

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct Script {
    language: Language,
    source: String,
}

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
enum Language {
    Shell,
    Python,
    #[cfg(windows)]
    Sql,
}

pub(super) fn available_languages(windows_inventory: bool) -> Vec<&'static str> {
    let mut languages = Vec::new();
    if cfg!(windows) && windows_inventory {
        languages.push("sql");
    }
    if docker_path().is_some() {
        languages.extend(["shell", "python"]);
    }
    languages
}

pub(super) fn workspace_label(path: &Path) -> String {
    format!("workspace/{}", path.file_name().expect("归档必须有文件名").to_string_lossy())
}

#[derive(Debug, Serialize)]
pub(super) struct Execution {
    pub archive: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result_archive: Option<String>,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub truncated: bool,
}

impl Script {
    pub(super) fn valid(&self) -> bool {
        self.source.len() <= MAX_SOURCE && !self.source.trim().is_empty() && !self.source.contains('\0')
    }

    pub(super) fn requires_windows_inventory(&self) -> bool {
        #[cfg(windows)]
        { matches!(self.language, Language::Sql) }
        #[cfg(not(windows))]
        { false }
    }

    pub(super) fn archive(&self, root: &Path, agent_id: &str) -> io::Result<PathBuf> {
        let workspace = super::local_tools::workspace_directory(&root.canonicalize()?, agent_id, true)?
            .expect("创建工作区成功后必须存在");
        let extension = match self.language {
            Language::Shell => "sh",
            Language::Python => "py",
            #[cfg(windows)]
            Language::Sql => "sql",
        };
        let path = workspace.join(format!("script-{}.{extension}", Uuid::now_v7()));
        let mut draft = tempfile::NamedTempFile::new_in(&workspace)?;
        draft.write_all(self.source.as_bytes())?;
        draft.persist_noclobber(&path).map_err(|error| error.error)?;
        Ok(path)
    }

    pub(super) async fn execute(&self, path: PathBuf, token: &CancellationToken) -> Result<Execution, String> {
        if token.is_cancelled() { return Err("脚本执行已取消。".into()); }
        let archive = workspace_label(&path);
        #[cfg(windows)]
        if matches!(self.language, Language::Sql) {
            let source = self.source.clone();
            let token = token.clone();
            return tokio::task::spawn_blocking(move || {
                let output = super::windows_sql::execute(&source, token.clone())?;
                if token.is_cancelled() { return Err("脚本执行已取消。".into()); }
                let result = path.with_extension("result.json");
                let mut draft = tempfile::NamedTempFile::new_in(path.parent().expect("归档必须在工作区中"))
                    .map_err(|_| "未能创建 Windows 查询结果文件。")?;
                draft.write_all(&output.file).map_err(|_| "未能写入 Windows 查询结果。")?;
                draft.persist_noclobber(&result).map_err(|_| "未能归档 Windows 查询结果。")?;
                Ok(Execution { archive, result_archive: Some(workspace_label(&result)), exit_code: Some(0),
                    stdout: output.preview, stderr: String::new(), truncated: output.truncated })
            }).await.map_err(|_| "Windows 只读脚本未完成。")?;
        }
        self.execute_docker(archive, token).await.map_err(str::to_owned)
    }

    async fn execute_docker(&self, archive: String, token: &CancellationToken) -> Result<Execution, &'static str> {
        let config = tempfile::tempdir().map_err(|_| "无法创建临时 Docker 客户端配置目录。")?;
        let mut command = docker_command(config.path())?;
        let name = format!("sageroom-script-{}", Uuid::now_v7());
        let mut child = command.args(run_arguments(&name, self.language))
            .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped()).kill_on_drop(true).spawn()
            .map_err(|_| "无法启动本机 Docker。")?;
        let mut stdin = child.stdin.take().expect("已为脚本创建输入管道");
        let stdout = child.stdout.take().expect("已为脚本创建输出管道");
        let stderr = child.stderr.take().expect("已为脚本创建错误管道");
        let monitor = async {
            tokio::join!(async {
                let _ = stdin.write_all(self.source.as_bytes()).await;
                drop(stdin);
            }, capture(stdout), capture(stderr), child.wait())
        };
        let result = tokio::select! {
            biased;
            _ = token.cancelled() => Err("脚本执行已取消。"),
            result = tokio::time::timeout(Duration::from_secs(25), monitor) => result.map_err(|_| "Docker 脚本执行超时。"),
        };
        if result.is_err() {
            let _ = child.start_kill();
            if let Ok(mut cleanup) = docker_command(config.path()) {
                cleanup.args(["rm", "--force", &name]).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).kill_on_drop(true);
                let _ = tokio::time::timeout(Duration::from_secs(3), cleanup.status()).await;
            }
        }
        let (_, stdout, stderr, status) = result?;
        let (stdout, stdout_truncated) = stdout.map_err(|_| "读取脚本输出失败。")?;
        let (stderr, stderr_truncated) = stderr.map_err(|_| "读取脚本错误输出失败。")?;
        let exit_code = status.map_err(|_| "无法读取 Docker 退出状态。")?.code();
        Ok(Execution { archive, result_archive: None, exit_code, stdout, stderr, truncated: stdout_truncated || stderr_truncated })
    }
}

fn docker_path() -> Option<PathBuf> {
    #[cfg(windows)]
    let path = PathBuf::from(std::env::var_os("ProgramFiles")?).join(r"Docker\Docker\resources\bin\docker.exe");
    #[cfg(target_os = "linux")]
    let path = PathBuf::from("/usr/bin/docker");
    #[cfg(not(any(windows, target_os = "linux")))]
    let path = PathBuf::from("/usr/local/bin/docker");
    path.is_file().then_some(path)
}

fn docker_command(config: &Path) -> Result<Command, &'static str> {
    #[cfg(windows)]
    let host = "npipe:////./pipe/docker_engine";
    #[cfg(not(windows))]
    let host = "unix:///var/run/docker.sock";
    let path = docker_path().ok_or("未找到本机 Docker，请先安装并启动 Docker，准备好 python:3.12-alpine 镜像；不会在宿主机直接执行脚本。")?;
    let mut command = Command::new(path);
    command.arg("--config").arg(config).args(["--host", host]).env_clear();
    #[cfg(windows)]
    {
        if let Some(root) = std::env::var_os("SystemRoot") {
            command.env("SystemRoot", root);
        }
        command.creation_flags(0x0800_0000);
    }
    Ok(command)
}

fn run_arguments(name: &str, language: Language) -> Vec<&str> {
    let bootstrap = match language {
        Language::Shell => "umask 077; cat > ./task.sh && exec /bin/sh ./task.sh",
        Language::Python => "umask 077; cat > ./task.py && exec /usr/local/bin/python -I -B ./task.py",
        #[cfg(windows)]
        Language::Sql => unreachable!("SQL 只在内存数据库中运行"),
    };
    vec!["run", "--rm", "--interactive", "--init", "--name", name, "--pull=never", "--platform=linux",
        "--network=none", "--read-only", "--user=65534:65534", "--cap-drop=ALL", "--security-opt=no-new-privileges:true",
        "--cpus=0.5", "--memory=128m", "--memory-swap=128m", "--pids-limit=32", "--ulimit=nofile=64:64",
        "--tmpfs=/work:rw,noexec,nosuid,nodev,size=8m,mode=1777", "--workdir=/work", "--log-driver=none",
        "--entrypoint=/bin/busybox", IMAGE, "timeout", "-k", "1", "12", "/bin/sh", "-c", bootstrap]
}

async fn capture(mut reader: impl AsyncRead + Unpin) -> io::Result<(String, bool)> {
    let mut bytes = Vec::new();
    let mut truncated = false;
    let mut chunk = [0; 4096];
    loop {
        let count = reader.read(&mut chunk).await?;
        if count == 0 { break; }
        let retained = count.min(MAX_STREAM - bytes.len());
        bytes.extend_from_slice(&chunk[..retained]);
        truncated |= retained != count;
    }
    Ok((String::from_utf8_lossy(&bytes).into_owned(), truncated))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scripts_are_saved_with_host_generated_names_and_never_interpolated_into_docker_arguments() {
        let root = tempfile::tempdir().unwrap();
        let script = Script { language: Language::Python, source: "print('hello')".into() };
        let archive = script.archive(root.path(), "assistant").unwrap();
        assert!(workspace_label(&archive).starts_with("workspace/script-") && archive.extension().is_some_and(|extension| extension == "py"));
        assert_eq!(std::fs::read_to_string(archive).unwrap(), script.source);
        let arguments = run_arguments("sageroom-test", script.language);
        for flag in ["--network=none", "--read-only", "--cap-drop=ALL", "--user=65534:65534", "--pull=never"] {
            assert!(arguments.contains(&flag));
        }
        assert!(arguments.iter().all(|arg| !arg.contains(&script.source) && !arg.starts_with("--mount") && !arg.starts_with("--volume")));
    }

    #[tokio::test]
    async fn output_is_bounded_without_blocking_the_process_pipe() {
        let large = vec![b'a'; MAX_STREAM * 3];
        let (output, truncated) = capture(large.as_slice()).await.unwrap();
        assert_eq!(output.len(), MAX_STREAM);
        assert!(truncated);
    }

    #[cfg(windows)]
    #[tokio::test]
    async fn windows_script_archives_the_real_device_result() {
        let root = tempfile::tempdir().unwrap();
        let script = Script { language: Language::Sql, source: "SELECT name, class FROM windows_devices ORDER BY name".into() };
        let path = script.archive(root.path(), "assistant").unwrap();
        let result_path = path.with_extension("result.json");
        let result = script.execute(path, &CancellationToken::new()).await.unwrap();
        assert_eq!(result.exit_code, Some(0));
        assert_eq!(result.result_archive, Some(workspace_label(&result_path)));
        let archived: serde_json::Value = serde_json::from_slice(&std::fs::read(result_path).unwrap()).unwrap();
        assert_eq!(archived["columns"], serde_json::json!(["name", "class"]));
        assert!(!archived["rows"].as_array().unwrap().is_empty());
    }

    #[tokio::test]
    #[ignore = "需要运行中的本机 Docker 和预先拉取的 python:3.12-alpine 镜像"]
    async fn docker_executes_a_python_script_with_no_host_mount() {
        let script = Script { language: Language::Python, source: "import os\nassert not os.path.exists('/mnt/c')\nassert os.getuid() != 0\nprint(sum(range(5)))".into() };
        let result = script.execute(PathBuf::from("test.py"), &CancellationToken::new()).await.unwrap();
        assert_eq!(result.exit_code, Some(0), "{}", result.stderr);
        assert_eq!(result.stdout.trim(), "10");
    }
}
