use serde::Deserialize;
use std::{
    fs,
    io::{self, Write},
    path::Path,
};
use tokio_util::sync::CancellationToken;

const WORKSPACE: &str = "workspace";
const MAX_TEXT_BYTES: usize = 16 * 1024;

#[derive(Debug, Deserialize)]
#[serde(tag = "operation", rename_all = "snake_case", deny_unknown_fields)]
pub(super) enum LocalAction {
    SystemInfo,
    ListWorkspace,
    WriteText { name: String, text: String },
}

fn safe_name(name: &str) -> bool {
    let Some((stem, extension)) = name.split_once('.') else {
        return false;
    };
    name.len() <= 72
        && stem
            .as_bytes()
            .first()
            .is_some_and(u8::is_ascii_alphanumeric)
        && stem
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, b'-' | b'_'))
        && matches!(extension, "txt" | "md" | "json" | "csv")
        && !matches!(
            stem.to_ascii_uppercase().as_str(),
            "CON"
                | "PRN"
                | "AUX"
                | "NUL"
                | "COM1"
                | "COM2"
                | "COM3"
                | "COM4"
                | "COM5"
                | "COM6"
                | "COM7"
                | "COM8"
                | "COM9"
                | "LPT1"
                | "LPT2"
                | "LPT3"
                | "LPT4"
                | "LPT5"
                | "LPT6"
                | "LPT7"
                | "LPT8"
                | "LPT9"
        )
}

fn inspect(path: &Path, directory: bool) -> io::Result<Option<fs::Metadata>> {
    match fs::symlink_metadata(path) {
        Ok(meta) => {
            #[cfg(windows)]
            {
                use std::os::windows::fs::MetadataExt;
                if meta.file_attributes() & 0x400 != 0 {
                    return Err(io::ErrorKind::PermissionDenied.into());
                }
            }
            if meta.file_type().is_symlink()
                || (if directory {
                    !meta.is_dir()
                } else {
                    !meta.is_file()
                })
            {
                return Err(io::ErrorKind::PermissionDenied.into());
            }
            Ok(Some(meta))
        }
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error),
    }
}

pub(crate) fn workspace_directory(data_root: &Path, agent_id: &str, create: bool) -> io::Result<Option<std::path::PathBuf>> {
    crate::storage::experience::validate_agent_id(agent_id).map_err(|_| io::ErrorKind::InvalidInput)?;
    let agents = data_root.join("agents");
    let agent = agents.join(agent_id);
    let workspace = agent.join(WORKSPACE);
    for directory in [&agents, &agent, &workspace] {
        if inspect(directory, true)?.is_none() {
            if !create {
                return Ok(None);
            }
            fs::create_dir(directory)?;
        }
    }
    Ok(Some(workspace))
}

impl LocalAction {
    pub(super) fn operation(&self) -> &'static str {
        match self {
            Self::SystemInfo => "system_info",
            Self::ListWorkspace => "list_workspace",
            Self::WriteText { .. } => "write_text",
        }
    }

    pub(super) fn execute(
        self,
        data_root: &Path,
        agent_id: &str,
        cancellation: &CancellationToken,
    ) -> io::Result<String> {
        if cancellation.is_cancelled() {
            return Err(io::ErrorKind::Interrupted.into());
        }
        if matches!(self, Self::SystemInfo) {
            return Ok(format!(
                "操作系统：{}；程序架构：{}。",
                std::env::consts::OS,
                std::env::consts::ARCH
            ));
        }
        crate::storage::experience::validate_agent_id(agent_id)
            .map_err(|_| io::ErrorKind::InvalidInput)?;
        if let Self::WriteText { name, text } = &self
            && (!safe_name(name) || text.len() > MAX_TEXT_BYTES || text.chars().any(|c| {
                (c.is_control() && !matches!(c, '\n' | '\r' | '\t'))
                    || matches!(c, '\u{061c}' | '\u{200e}'..='\u{200f}' | '\u{202a}'..='\u{202e}' | '\u{2066}'..='\u{2069}')
            }))
        {
            return Err(io::ErrorKind::InvalidInput.into());
        }
        let root = data_root.canonicalize()?;
        let Some(workspace) = workspace_directory(&root, agent_id, matches!(self, Self::WriteText { .. }))? else {
            return Ok("我的工作区现在没有文件。".into());
        };
        match self {
            Self::SystemInfo => unreachable!(),
            Self::ListWorkspace => {
                let mut names = Vec::new();
                for entry in fs::read_dir(workspace)?.take(50) {
                    let entry = entry?;
                    if let Some(name) = entry.file_name().to_str()
                        && safe_name(name)
                        && inspect(&entry.path(), false).is_ok_and(|item| item.is_some())
                    {
                        names.push(name.to_owned());
                    }
                }
                names.sort_unstable();
                if names.is_empty() {
                    return Ok("我的工作区没有可列出的文本文件。".into());
                }
                Ok(format!(
                    "我的工作区文件（最多查看 50 个条目）：\n{}",
                    names.join("\n")
                ))
            }
            Self::WriteText { name, text } => {
                let path = workspace.join(&name);
                let existing = inspect(&path, false)?;
                if existing
                    .as_ref()
                    .is_some_and(|meta| meta.len() > MAX_TEXT_BYTES as u64)
                {
                    return Err(io::ErrorKind::PermissionDenied.into());
                }
                let mut draft = tempfile::NamedTempFile::new_in(workspace)?;
                draft.write_all(text.as_bytes())?;
                draft.as_file().sync_all()?;
                if cancellation.is_cancelled() {
                    return Err(io::ErrorKind::Interrupted.into());
                }
                if existing.is_some() {
                    draft.persist(path).map_err(|error| error.error)?;
                } else {
                    draft.persist_noclobber(path).map_err(|error| error.error)?;
                }
                Ok(format!(
                    "已{}我的工作区文件：{WORKSPACE}/{name}。",
                    if existing.is_some() {
                        "更新"
                    } else {
                        "创建"
                    }
                ))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn writes_are_confined_to_each_agents_workspace() {
        let root = tempfile::tempdir().unwrap();
        let agent_dir = root.path().join("agents").join("tool-a");
        fs::create_dir_all(&agent_dir).unwrap();
        let write = |name: &str, text: &str, cancellation: &CancellationToken| {
            LocalAction::WriteText {
                name: name.into(),
                text: text.into(),
            }
            .execute(root.path(), "tool-a", cancellation)
        };
        let cancellation = CancellationToken::new();
        for name in [
            "../chat.txt",
            "a/b.txt",
            "C:\tmp.txt",
            "con.txt",
            "example.ps1",
            "test.txt:stream",
            ".hidden.txt",
        ] {
            assert!(write(name, "内容", &cancellation).is_err(), "{name}");
        }
        let cancelled = CancellationToken::new();
        cancelled.cancel();
        assert!(write("result.txt", "结果", &cancelled).is_err());
        assert!(!agent_dir.join(WORKSPACE).exists());
        write("result.txt", "结果", &cancellation).unwrap();
        write("result.txt", "修改", &cancellation).unwrap();
        assert_eq!(
            fs::read_to_string(agent_dir.join(WORKSPACE).join("result.txt")).unwrap(),
            "修改"
        );
        assert!(
            LocalAction::ListWorkspace
                .execute(root.path(), "tool-a", &cancellation)
                .unwrap()
                .contains("result.txt")
        );
        assert!(
            LocalAction::ListWorkspace
                .execute(root.path(), "../tool-a", &cancellation)
                .is_err()
        );
    }
}
