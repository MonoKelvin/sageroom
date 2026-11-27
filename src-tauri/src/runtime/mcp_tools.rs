use std::{
    collections::{BTreeMap, HashSet},
    fs::{self, File},
    io::{self, Read},
    path::Path,
    time::Duration,
};

use reqwest::{
    Client, Response,
    header::{ACCEPT, CONTENT_TYPE, HeaderValue},
};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

const MANIFEST: &str = "mcp-tools.json";
const MAX_MANIFEST: usize = 16 * 1024;
const MAX_RESPONSE: usize = 64 * 1024;
const PROTOCOL: &str = "2025-06-18";

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub(super) struct ToolCall {
    pub name: String,
    pub arguments: BTreeMap<String, Value>,
}

#[derive(Debug, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub(super) struct Catalog {
    port: u16,
    pub tools: Vec<Tool>,
}

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub(super) struct Tool {
    name: String,
    description: String,
    arguments: BTreeMap<String, Argument>,
}

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(tag = "type", rename_all = "snake_case", deny_unknown_fields)]
enum Argument {
    Identifier,
    Boolean,
    Unsigned { max: u32 },
    Choice { values: Vec<String> },
}

fn identifier(value: &str) -> bool {
    value.len() <= 64
        && value
            .as_bytes()
            .first()
            .is_some_and(u8::is_ascii_alphanumeric)
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-' | b'.'))
}

impl Catalog {
    fn valid(&self) -> bool {
        let mut names = HashSet::new();
        self.port >= 1024
            && (1..=8).contains(&self.tools.len())
            && self.tools.iter().all(|tool| {
                identifier(&tool.name)
                    && names.insert(&tool.name)
                    && !tool.description.trim().is_empty()
                    && tool.description.len() <= 768
                    && tool.arguments.len() <= 8
                    && tool.arguments.iter().all(|(key, argument)| {
                        identifier(key)
                            && match argument {
                                Argument::Choice { values } => {
                                    (1..=16).contains(&values.len())
                                        && values.iter().all(|value| identifier(value))
                                }
                                _ => true,
                            }
                    })
            })
    }

    fn permits(&self, call: &ToolCall) -> bool {
        let Some(tool) = self.tools.iter().find(|tool| tool.name == call.name) else {
            return false;
        };
        tool.arguments.len() == call.arguments.len()
            && tool.arguments.iter().all(|(key, rule)| {
                call.arguments.get(key).is_some_and(|value| match rule {
                    Argument::Identifier => value.as_str().is_some_and(identifier),
                    Argument::Boolean => value.is_boolean(),
                    Argument::Unsigned { max } => value
                        .as_u64()
                        .is_some_and(|number| number <= u64::from(*max)),
                    Argument::Choice { values } => value
                        .as_str()
                        .is_some_and(|value| values.iter().any(|item| item == value)),
                })
            })
    }

    pub(super) async fn call(&self, call: &ToolCall) -> Result<String, &'static str> {
        if !self.permits(call) {
            return Err("工具未注册，或参数不符合本地工具目录。未发起连接。");
        }
        tokio::time::timeout(Duration::from_secs(8), self.invoke(call))
            .await
            .unwrap_or(Err("本机 MCP 工具调用超时。"))
    }

    async fn invoke(&self, call: &ToolCall) -> Result<String, &'static str> {
        let client = Client::builder()
            .no_proxy()
            .redirect(reqwest::redirect::Policy::none())
            .timeout(Duration::from_secs(3))
            .build()
            .map_err(|_| "无法初始化本机 MCP 连接。")?;
        let endpoint = format!("http://127.0.0.1:{}/mcp", self.port);
        let request = client
            .post(&endpoint)
            .header(ACCEPT, "application/json, text/event-stream");
        let init = request.try_clone().expect("未设置请求体时可复制").json(&json!({
            "jsonrpc":"2.0", "id":1, "method":"initialize", "params":{
                "protocolVersion":PROTOCOL, "capabilities":{}, "clientInfo":{"name":"local-tool-client","version":"1"}
            }
        })).send().await.map_err(|_| "无法连接已配置的本机 MCP 服务。")?;
        let session = init.headers().get("mcp-session-id").cloned();
        let initial = rpc_result(init, 1).await?;
        let version = initial["protocolVersion"]
            .as_str()
            .filter(|v| matches!(*v, "2025-03-26" | "2025-06-18" | "2025-11-25"))
            .ok_or("本机 MCP 服务的协议版本不受支持。")?;
        if !initial["capabilities"]["tools"].is_object() {
            return Err("本机 MCP 服务没有提供工具能力。");
        }
        let request = || {
            let mut request = client
                .post(&endpoint)
                .header(ACCEPT, "application/json, text/event-stream")
                .header("mcp-protocol-version", version);
            if let Some(session) = &session {
                request = request.header("mcp-session-id", session.clone());
            }
            request
        };
        let notify = request()
            .json(&json!({"jsonrpc":"2.0","method":"notifications/initialized"}))
            .send()
            .await
            .map_err(|_| "无法初始化本机 MCP 会话。")?;
        if !notify.status().is_success() {
            return Err("本机 MCP 服务拒绝初始化通知。");
        }
        let listed = request()
            .json(&json!({"jsonrpc":"2.0","id":2,"method":"tools/list"}))
            .send()
            .await
            .map_err(|_| "无法核对本机 MCP 工具目录。")?;
        let tools = rpc_result(listed, 2).await?;
        if !tools["tools"].as_array().is_some_and(|items| {
            items.iter().any(|item| {
                item["name"].as_str() == Some(call.name.as_str())
                    && item["annotations"]["readOnlyHint"] == true
                    && item["annotations"]["openWorldHint"] == false
            })
        }) {
            return Err("该工具未出现在服务的只读工具目录中，未调用。");
        }
        let response = request()
            .json(&json!({"jsonrpc":"2.0","id":3,"method":"tools/call",
            "params":{"name":call.name,"arguments":call.arguments}}))
            .send()
            .await
            .map_err(|_| "本机 MCP 工具调用未完成。")?;
        let result = rpc_result(response, 3).await?;
        if result["isError"] == true {
            return Err("本机 MCP 工具报告操作失败。");
        }
        if let Some(text) = result["content"].as_array().and_then(|items| {
            let text = items
                .iter()
                .filter(|item| item["type"] == "text")
                .filter_map(|item| item["text"].as_str())
                .collect::<Vec<_>>()
                .join("\n");
            (!text.trim().is_empty()).then_some(text)
        }) {
            return Ok(text);
        }
        if let Some(value) = result.get("structuredContent") {
            return Ok(value.to_string());
        }
        Err("本机 MCP 工具没有返回可用的文本或结构化数据。")
    }
}

async fn rpc_result(mut response: Response, id: u64) -> Result<Value, &'static str> {
    if !response.status().is_success() {
        return Err("本机 MCP 服务拒绝请求。");
    }
    if !response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|value: &HeaderValue| value.to_str().ok())
        .is_some_and(|value| {
            value
                .split(';')
                .next()
                .is_some_and(|kind| kind.trim().eq_ignore_ascii_case("application/json"))
        })
    {
        return Err("当前仅支持返回 JSON 的本机 Streamable HTTP MCP 服务。");
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|_| "无法读取本机 MCP 结果。")?
    {
        if bytes.len() + chunk.len() > MAX_RESPONSE {
            return Err("本机 MCP 结果超过大小限制。");
        }
        bytes.extend_from_slice(&chunk);
    }
    let response: Value =
        serde_json::from_slice(&bytes).map_err(|_| "本机 MCP 返回了无效 JSON。")?;
    if response["jsonrpc"] != "2.0"
        || response["id"].as_u64() != Some(id)
        || response.get("error").is_some()
    {
        return Err("本机 MCP 返回了错误或不匹配的响应。");
    }
    response
        .get("result")
        .cloned()
        .ok_or("本机 MCP 响应缺少结果。")
}

pub(super) fn load(root: &Path, agent_id: &str) -> io::Result<Option<Catalog>> {
    crate::storage::experience::validate_agent_id(agent_id)
        .map_err(|_| io::ErrorKind::InvalidInput)?;
    let agents = root.join("agents");
    let agent = agents.join(agent_id);
    let file = agent.join(MANIFEST);
    for (path, directory) in [(&agents, true), (&agent, true), (&file, false)] {
        let metadata = match fs::symlink_metadata(path) {
            Ok(metadata) => metadata,
            Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
            Err(error) => return Err(error),
        };
        #[cfg(windows)]
        {
            use std::os::windows::fs::MetadataExt;
            if metadata.file_attributes() & 0x400 != 0 {
                return Err(io::ErrorKind::PermissionDenied.into());
            }
        }
        if metadata.file_type().is_symlink()
            || (if directory {
                !metadata.is_dir()
            } else {
                !metadata.is_file()
            })
        {
            return Err(io::ErrorKind::PermissionDenied.into());
        }
    }
    let mut bytes = Vec::new();
    File::open(file)?
        .take((MAX_MANIFEST + 1) as u64)
        .read_to_end(&mut bytes)?;
    if bytes.len() > MAX_MANIFEST {
        return Err(io::ErrorKind::InvalidData.into());
    }
    let catalog: Catalog =
        serde_json::from_slice(&bytes).map_err(|_| io::ErrorKind::InvalidData)?;
    if !catalog.valid() {
        return Err(io::ErrorKind::InvalidData.into());
    }
    Ok(Some(catalog))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn approved_signatures_do_not_accept_command_strings_or_unregistered_names() {
        let catalog: Catalog = serde_json::from_value(json!({"port":40123,"tools":[{
            "name":"program_location","description":"读取程序位置","arguments":{"program":{"type":"identifier"}}
        }]})).unwrap();
        assert!(catalog.valid());
        for (name, program, expected) in [
            ("program_location", "git.exe", true),
            ("program_location", "git.exe & other", false),
            ("program_location", "../git.exe", false),
            ("program_location", "-flag", false),
            ("other", "git.exe", false),
        ] {
            let call = ToolCall {
                name: name.into(),
                arguments: BTreeMap::from([("program".into(), json!(program))]),
            };
            assert_eq!(catalog.permits(&call), expected);
        }
    }

    #[test]
    fn streamable_http_calls_only_read_only_registered_tools_and_returns_results() {
        use std::{
            io::{BufRead, BufReader, Write},
            net::TcpListener,
            thread,
            time::Instant,
        };
        for (read_only, open_world) in [(true, false), (false, false), (true, true)] {
            let allowed = read_only && !open_world;
            let listener = TcpListener::bind("127.0.0.1:0").unwrap();
            listener.set_nonblocking(true).unwrap();
            let port = listener.local_addr().unwrap().port();
            let server = thread::spawn(move || {
                let deadline = Instant::now() + Duration::from_secs(8);
                let methods = [
                    "initialize",
                    "notifications/initialized",
                    "tools/list",
                    "tools/call",
                ];
                for (index, method) in methods
                    .into_iter()
                    .take(if allowed { 4 } else { 3 })
                    .enumerate()
                {
                    let mut socket = loop {
                        match listener.accept() {
                            Ok((socket, _)) => break socket,
                            Err(error)
                                if error.kind() == io::ErrorKind::WouldBlock
                                    && Instant::now() < deadline =>
                            {
                                thread::sleep(Duration::from_millis(5))
                            }
                            Err(error) => panic!("等待 {method} 失败：{error}"),
                        }
                    };
                    socket.set_nonblocking(false).unwrap();
                    socket
                        .set_read_timeout(Some(Duration::from_secs(3)))
                        .unwrap();
                    let mut reader = BufReader::new(&mut socket);
                    let mut header = String::new();
                    let mut line = String::new();
                    loop {
                        line.clear();
                        assert_ne!(reader.read_line(&mut line).unwrap(), 0);
                        if line == "\r\n" {
                            break;
                        }
                        header.push_str(&line);
                    }
                    assert!(header.starts_with("POST /mcp HTTP/1.1"));
                    let length: usize = header
                        .lines()
                        .find_map(|line| {
                            let (name, value) = line.split_once(':')?;
                            name.eq_ignore_ascii_case("content-length")
                                .then(|| value.trim().parse().unwrap())
                        })
                        .unwrap();
                    let mut bytes = vec![0; length];
                    reader.read_exact(&mut bytes).unwrap();
                    let request: Value = serde_json::from_slice(&bytes).unwrap();
                    assert_eq!(request["method"], method);
                    if index > 0 {
                        assert!(
                            header
                                .to_ascii_lowercase()
                                .contains("mcp-session-id: fixture")
                        );
                    }
                    if index == 1 {
                        socket.write_all(b"HTTP/1.1 202 Accepted\r\nContent-Length: 0\r\nConnection: close\r\n\r\n").unwrap();
                        continue;
                    }
                    let result = match index {
                        0 => json!({"protocolVersion":PROTOCOL,"capabilities":{"tools":{}}}),
                        2 => {
                            json!({"tools":[{"name":"inventory","annotations":{"readOnlyHint":read_only,"openWorldHint":open_world}}]})
                        }
                        3 => {
                            assert_eq!(
                                request["params"],
                                json!({"name":"inventory","arguments":{"program":"git"}})
                            );
                            json!({"content":[{"type":"text","text":"C:\\Fixture\\Program\\git.exe"}]})
                        }
                        _ => unreachable!(),
                    };
                    let body =
                        json!({"jsonrpc":"2.0","id":request["id"],"result":result}).to_string();
                    write!(socket, "HTTP/1.1 200 OK\r\nContent-Type: application/json; charset=utf-8\r\nMcp-Session-Id: fixture\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).unwrap();
                }
            });
            let catalog: Catalog = serde_json::from_value(json!({"port":port,"tools":[{
                "name":"inventory","description":"Read inventory","arguments":{"program":{"type":"identifier"}}
            }]})).unwrap();
            let call = ToolCall {
                name: "inventory".into(),
                arguments: BTreeMap::from([("program".into(), json!("git"))]),
            };
            let result = tauri::async_runtime::block_on(catalog.call(&call));
            server.join().unwrap();
            if allowed {
                assert_eq!(result.unwrap(), r"C:\Fixture\Program\git.exe");
            } else {
                assert!(result.unwrap_err().contains("未调用"));
            }
        }
    }

    #[test]
    fn workspace_files_do_not_register_external_tools() {
        let root = tempfile::tempdir().unwrap();
        let agent = root.path().join("agents").join("tool-a");
        fs::create_dir_all(agent.join("workspace")).unwrap();
        fs::write(agent.join("workspace").join(MANIFEST), b"{}").unwrap();
        assert!(load(root.path(), "tool-a").unwrap().is_none());
        fs::write(agent.join(MANIFEST), br#"{"port":43123,"tools":[{"name":"inventory","description":"Read inventory","arguments":{}}]}"#).unwrap();
        assert_eq!(
            load(root.path(), "tool-a").unwrap().unwrap().tools[0].name,
            "inventory"
        );
    }
}
