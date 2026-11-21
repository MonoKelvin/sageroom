use super::*;
use std::{
    collections::BTreeMap,
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    sync::{Mutex, atomic::AtomicBool},
    thread::{self, JoinHandle},
};

use crate::domain::contracts::{DecimalString, ModelParameters, ModelProtocol, ReasoningMode};
use serde_json::{Value, json};
use tokio::sync::oneshot;

const KEY: &str = "synthetic-fixture-key-not-a-real-secret";

struct Request {
    path: String,
    headers: BTreeMap<String, String>,
    body: Value,
}

struct Fixture {
    url: String,
    request: Option<oneshot::Receiver<Request>>,
    hits: Arc<AtomicU32>,
    stop: Arc<AtomicBool>,
    thread: Option<JoinHandle<()>>,
}

impl Fixture {
    fn new(status: &str, body: String, delay: Duration, extra_headers: &str) -> Self {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        listener.set_nonblocking(true).unwrap();
        let url = format!("http://{}/proxy/v1", listener.local_addr().unwrap());
        let (sender, receiver) = oneshot::channel();
        let stop = Arc::new(AtomicBool::new(false));
        let hits = Arc::new(AtomicU32::new(0));
        let stop_worker = stop.clone();
        let hits_worker = hits.clone();
        let response = format!(
            "HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n{extra_headers}\r\n{body}",
            body.len(),
        );
        let worker = thread::spawn(move || {
            let mut sender = Some(sender);
            while !stop_worker.load(Ordering::Relaxed) {
                match listener.accept() {
                    Ok((mut socket, _)) => {
                        socket.set_nonblocking(false).unwrap();
                        socket
                            .set_read_timeout(Some(Duration::from_secs(2)))
                            .unwrap();
                        socket
                            .set_write_timeout(Some(Duration::from_secs(2)))
                            .unwrap();
                        if let Some(request) = read_request(&mut socket) {
                            hits_worker.fetch_add(1, Ordering::Relaxed);
                            if let Some(sender) = sender.take() {
                                let _ = sender.send(request);
                            }
                            thread::sleep(delay);
                            let _ = socket.write_all(response.as_bytes());
                        }
                    }
                    Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                        thread::sleep(Duration::from_millis(2));
                    }
                    Err(_) => break,
                }
            }
        });
        Self {
            url,
            request: Some(receiver),
            hits,
            stop,
            thread: Some(worker),
        }
    }

    async fn received(&mut self) -> Request {
        tokio::time::timeout(Duration::from_secs(3), self.request.take().unwrap())
            .await
            .unwrap()
            .unwrap()
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Relaxed);
        if let Some(worker) = self.thread.take() {
            worker.join().unwrap();
        }
    }
}

fn read_request(socket: &mut TcpStream) -> Option<Request> {
    let mut bytes = Vec::new();
    let mut chunk = [0; 1024];
    let header_end = loop {
        let count = socket.read(&mut chunk).ok()?;
        if count == 0 || bytes.len() + count > 32768 {
            return None;
        }
        bytes.extend_from_slice(&chunk[..count]);
        if let Some(index) = bytes.windows(4).position(|value| value == b"\r\n\r\n") {
            break index + 4;
        }
    };
    let header = std::str::from_utf8(&bytes[..header_end]).ok()?;
    let mut lines = header.split("\r\n");
    let first = lines.next()?;
    if !first.starts_with("POST ") {
        return None;
    }
    let path = first.split_whitespace().nth(1)?.to_owned();
    let headers: BTreeMap<_, _> = lines
        .filter_map(|line| {
            line.split_once(':')
                .map(|(key, value)| (key.to_ascii_lowercase(), value.trim().to_owned()))
        })
        .collect();
    let length: usize = headers.get("content-length")?.parse().ok()?;
    if length > 16384 {
        return None;
    }
    while bytes.len() < header_end + length {
        let count = socket.read(&mut chunk).ok()?;
        if count == 0 {
            return None;
        }
        bytes.extend_from_slice(&chunk[..count]);
    }
    let body = serde_json::from_slice(&bytes[header_end..header_end + length]).ok()?;
    Some(Request {
        path,
        headers,
        body,
    })
}

fn profile(protocol: ModelProtocol, base_url: String) -> ModelProfile {
    ModelProfile {
        id: "fixture-profile".into(),
        name: "private profile name must not be sent".into(),
        protocol,
        base_url,
        model_name: "unrecognized-test-model".into(),
        parameters: ModelParameters {
            temperature: 0.4,
            top_p: 0.8,
            max_output_tokens: 4096,
            input_budget: 2048,
            reasoning: ReasoningMode::Off,
        },
        revision: DecimalString("7".into()),
        credential_configured: true,
    }
}

fn test_gateway(deadline: Duration) -> ModelGateway {
    ModelGateway::build(deadline, Arc::new(Limits::new())).unwrap()
}

fn protocols() -> [ModelProtocol; 3] {
    [
        ModelProtocol::OpenaiChatCompletions,
        ModelProtocol::AnthropicMessages,
        ModelProtocol::OpenaiResponses,
    ]
}

fn success(protocol: &ModelProtocol, text: &str) -> String {
    match protocol {
        ModelProtocol::OpenaiChatCompletions => json!({
            "model": "unrecognized-test-model",
            "choices": [{"message": {"role": "assistant", "content": text}, "finish_reason": "stop"}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 2, "total_tokens": 12},
        }),
        ModelProtocol::AnthropicMessages => json!({
            "model": "unrecognized-test-model", "stop_reason": "end_turn",
            "content": [{"type": "text", "text": text}],
            "usage": {"input_tokens": 5, "cache_creation_input_tokens": 2, "cache_read_input_tokens": 3, "output_tokens": 2},
        }),
        ModelProtocol::OpenaiResponses => json!({
            "id": "fixture-response", "status": "completed", "model": "unrecognized-test-model",
            "output": [{"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": text}]}],
            "usage": {"input_tokens": 10, "output_tokens": 2, "total_tokens": 12},
        }),
    }.to_string()
}

#[tokio::test]
async fn three_sdk_protocols_preserve_routes_auth_parameters_and_usage() {
    for protocol in protocols() {
        let mut fixture = Fixture::new(
            "200 OK",
            success(&protocol, "not returned to UI"),
            Duration::ZERO,
            "",
        );
        let result = test_gateway(DEADLINE)
            .test(
                profile(protocol.clone(), fixture.url.clone()),
                KEY.into(),
                CancellationToken::new(),
            )
            .await
            .unwrap();
        let request = fixture.received().await;
        let (suffix, tokens_key) = match protocol {
            ModelProtocol::OpenaiChatCompletions => ("chat/completions", "max_tokens"),
            ModelProtocol::AnthropicMessages => ("messages", "max_tokens"),
            ModelProtocol::OpenaiResponses => ("responses", "max_output_tokens"),
        };
        assert_eq!(request.path, format!("/proxy/v1/{suffix}"));
        if protocol == ModelProtocol::AnthropicMessages {
            assert!(
                request
                    .headers
                    .get("x-api-key")
                    .is_some_and(|value| value == KEY)
            );
            assert_eq!(
                request.headers.get("anthropic-version").map(String::as_str),
                Some("2023-06-01")
            );
            assert!(!request.headers.contains_key("authorization"));
        } else {
            assert!(
                request
                    .headers
                    .get("authorization")
                    .is_some_and(|value| value == &format!("Bearer {KEY}"))
            );
            assert!(!request.headers.contains_key("x-api-key"));
        }
        assert_eq!(request.body["model"], "unrecognized-test-model");
        assert_eq!(request.body[tokens_key], 64);
        assert_eq!(request.body["temperature"], 0.4);
        assert_eq!(request.body["top_p"], 0.8);
        assert_eq!(request.body["stream"], false);
        for key in [
            "tools",
            "tool_choice",
            "thinking",
            "reasoning",
            "reasoning_effort",
            "previous_response_id",
        ] {
            assert!(request.body.get(key).is_none());
        }
        if protocol == ModelProtocol::OpenaiResponses {
            assert_eq!(request.body["store"], false);
            assert_eq!(request.body["input"][0]["content"], TEST_PROMPT);
        } else {
            assert_eq!(request.body["messages"][0]["content"], TEST_PROMPT);
        }
        let body = request.body.to_string();
        assert!(!body.contains(KEY));
        assert!(!body.contains("private profile name"));
        assert!(result.available);
        assert_eq!(result.profile_id, "fixture-profile");
        assert_eq!(result.revision.0, "7");
        assert_eq!(result.protocol, protocol);
        assert_eq!(result.usage_input_tokens, Some(10));
        assert_eq!(result.usage_output_tokens, Some(2));
        let returned = serde_json::to_string(&result).unwrap();
        assert!(!returned.contains(KEY));
        assert!(!returned.contains("not returned to UI"));
        assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
    }
}

#[tokio::test]
async fn configured_output_limit_is_not_increased() {
    let protocol = ModelProtocol::OpenaiChatCompletions;
    let mut fixture = Fixture::new("200 OK", success(&protocol, "OK"), Duration::ZERO, "");
    let mut p = profile(protocol, fixture.url.clone());
    p.parameters.max_output_tokens = 1;
    test_gateway(DEADLINE)
        .test(p, KEY.into(), CancellationToken::new())
        .await
        .unwrap();
    assert_eq!(fixture.received().await.body["max_tokens"], 1);
}

#[tokio::test]
async fn unsupported_reasoning_and_invalid_inputs_never_consume_budget() {
    let gateway = test_gateway(DEADLINE);
    for protocol in protocols() {
        let mut p = profile(protocol, "http://127.0.0.1:1/v1".into());
        p.parameters.reasoning = ReasoningMode::Enabled;
        let error = gateway
            .test(p, KEY.into(), CancellationToken::new())
            .await
            .unwrap_err();
        assert_eq!(error.code, ErrorCode::CapabilityUnsupported);
        assert!(!error.may_have_been_charged);
    }
    for name in ["openai::gpt-4o", "unrecognized-high", "unrecognized-none"] {
        let mut p = profile(
            ModelProtocol::OpenaiChatCompletions,
            "http://127.0.0.1:1/v1".into(),
        );
        p.model_name = name.into();
        assert!(
            gateway
                .test(p, KEY.into(), CancellationToken::new())
                .await
                .is_err()
        );
    }
    for key in ["", "invalid\r\nheader", "invalid key"] {
        let p = profile(
            ModelProtocol::OpenaiChatCompletions,
            "http://127.0.0.1:1/v1".into(),
        );
        let error = gateway
            .test(p, key.into(), CancellationToken::new())
            .await
            .unwrap_err();
        assert_eq!(error.field_path.as_deref(), Some("api_key"));
    }
    let mut p = profile(
        ModelProtocol::OpenaiChatCompletions,
        "http://127.0.0.1:1/v1".into(),
    );
    p.parameters.input_budget = 1;
    assert!(
        gateway
            .test(p, KEY.into(), CancellationToken::new())
            .await
            .is_err()
    );
    assert_eq!(gateway.limits.calls.load(Ordering::Relaxed), 0);
    assert_eq!(gateway.limits.permits.available_permits(), 2);
}

#[tokio::test]
async fn deadlines_and_shutdown_release_permits_without_retry() {
    for protocol in protocols() {
        let mut fixture = Fixture::new(
            "200 OK",
            success(&protocol, "OK"),
            Duration::from_millis(200),
            "",
        );
        let gateway = test_gateway(Duration::from_millis(60));
        let error = gateway
            .test(
                profile(protocol.clone(), fixture.url.clone()),
                KEY.into(),
                CancellationToken::new(),
            )
            .await
            .unwrap_err();
        fixture.received().await;
        assert_eq!(error.code, ErrorCode::IoError);
        assert!(error.may_have_been_charged);
        assert_eq!(gateway.limits.permits.available_permits(), 2);
        assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);

        let mut fixture = Fixture::new(
            "200 OK",
            success(&protocol, "OK"),
            Duration::from_millis(200),
            "",
        );
        let gateway = Arc::new(test_gateway(DEADLINE));
        let shutdown = CancellationToken::new();
        let p = profile(protocol, fixture.url.clone());
        let worker_gateway = gateway.clone();
        let worker_shutdown = shutdown.clone();
        let worker =
            tokio::spawn(async move { worker_gateway.test(p, KEY.into(), worker_shutdown).await });
        fixture.received().await;
        shutdown.cancel();
        let error = worker.await.unwrap().unwrap_err();
        assert_eq!(error.code, ErrorCode::ShuttingDown);
        assert!(error.may_have_been_charged);
        assert_eq!(gateway.limits.permits.available_permits(), 2);
        assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
    }
}

#[tokio::test]
async fn pre_cancel_concurrency_and_process_call_cap_are_enforced() {
    let shared = Arc::new(Limits::new());
    let first = ModelGateway::build(DEADLINE, shared.clone()).unwrap();
    let second = ModelGateway::build(DEADLINE, shared.clone()).unwrap();
    let p = profile(
        ModelProtocol::OpenaiChatCompletions,
        "http://127.0.0.1:1/v1".into(),
    );
    let shutdown = CancellationToken::new();
    shutdown.cancel();
    let error = first
        .test(p.clone(), KEY.into(), shutdown)
        .await
        .unwrap_err();
    assert_eq!(error.code, ErrorCode::ShuttingDown);
    assert!(!error.may_have_been_charged);
    let permits = [
        shared.permits.try_acquire().unwrap(),
        shared.permits.try_acquire().unwrap(),
    ];
    let error = second
        .test(p.clone(), KEY.into(), CancellationToken::new())
        .await
        .unwrap_err();
    assert_eq!(error.code, ErrorCode::Backpressure);
    assert!(!error.may_have_been_charged);
    assert_eq!(shared.calls.load(Ordering::Relaxed), 0);
    drop(permits);
    shared.calls.store(MAX_PROCESS_CALLS, Ordering::Relaxed);
    for gateway in [first, second] {
        let error = gateway
            .test(p.clone(), KEY.into(), CancellationToken::new())
            .await
            .unwrap_err();
        assert_eq!(error.code, ErrorCode::Backpressure);
        assert!(!error.may_have_been_charged);
        assert_eq!(error.retryability, Retryability::Never);
    }
    assert_eq!(shared.calls.load(Ordering::Relaxed), MAX_PROCESS_CALLS);
}

#[derive(Clone)]
struct LogCapture(Arc<Mutex<Vec<String>>>);

impl tracing::Subscriber for LogCapture {
    fn enabled(&self, _: &tracing::Metadata<'_>) -> bool {
        true
    }
    fn new_span(&self, _: &tracing::span::Attributes<'_>) -> tracing::span::Id {
        tracing::span::Id::from_u64(1)
    }
    fn record(&self, _: &tracing::span::Id, _: &tracing::span::Record<'_>) {}
    fn record_follows_from(&self, _: &tracing::span::Id, _: &tracing::span::Id) {}
    fn event(&self, event: &tracing::Event<'_>) {
        struct Fields(String);
        impl tracing::field::Visit for Fields {
            fn record_debug(&mut self, _: &tracing::field::Field, value: &dyn std::fmt::Debug) {
                self.0.push_str(&format!("{value:?}"));
            }
        }
        let mut fields = Fields(String::new());
        event.record(&mut fields);
        self.0.lock().unwrap().push(fields.0);
    }
    fn enter(&self, _: &tracing::span::Id) {}
    fn exit(&self, _: &tracing::span::Id) {}
}

#[tokio::test]
async fn sdk_errors_and_echoed_secrets_are_not_exposed_or_logged() {
    for protocol in protocols() {
        for (status, body) in [
            (
                "401 Unauthorized",
                json!({"error": {"message": KEY}}).to_string(),
            ),
            (
                "429 Too Many Requests",
                json!({"error": {"message": KEY}}).to_string(),
            ),
            (
                "500 Internal Server Error",
                json!({"error": {"message": KEY}}).to_string(),
            ),
            ("200 OK", format!("invalid json {KEY}")),
            ("200 OK", json!({"echo": KEY}).to_string()),
        ] {
            let mut fixture = Fixture::new(status, body, Duration::ZERO, "");
            let gateway = test_gateway(DEADLINE);
            let logs = Arc::new(Mutex::new(Vec::new()));
            let dispatch = tracing::Dispatch::new(LogCapture(logs.clone()));
            tracing::dispatcher::with_default(&dispatch, || tracing::trace!("capture active"));
            assert!(!logs.lock().unwrap().is_empty());
            let mut test = pin!(gateway.test(
                profile(protocol.clone(), fixture.url.clone()),
                KEY.into(),
                CancellationToken::new(),
            ));
            let error = poll_fn(|cx| {
                tracing::dispatcher::with_default(&dispatch, || test.as_mut().poll(cx))
            })
            .await
            .unwrap_err();
            fixture.received().await;
            let returned = serde_json::to_string(&error).unwrap();
            assert!(!returned.contains(KEY));
            assert!(!returned.contains("request_payload"));
            assert!(!returned.contains("proxy/v1"));
            assert!(error.may_have_been_charged);
            assert!(!error.trace_id.is_empty());
            assert_eq!(error.retryability, Retryability::Never);
            assert!(logs.lock().unwrap().iter().all(|line| !line.contains(KEY)));
            assert_eq!(gateway.limits.permits.available_permits(), 2);
            assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
        }
    }
}

#[tokio::test]
async fn successful_echo_is_private_and_missing_usage_stays_nullable() {
    for protocol in protocols() {
        let mut body: Value = serde_json::from_str(&success(&protocol, KEY)).unwrap();
        body.as_object_mut().unwrap().remove("usage");
        let mut fixture = Fixture::new("200 OK", body.to_string(), Duration::ZERO, "");
        let gateway = test_gateway(DEADLINE);
        let logs = Arc::new(Mutex::new(Vec::new()));
        let dispatch = tracing::Dispatch::new(LogCapture(logs.clone()));
        tracing::dispatcher::with_default(&dispatch, || tracing::trace!("capture active"));
        assert!(!logs.lock().unwrap().is_empty());
        let mut test = pin!(gateway.test(
            profile(protocol, fixture.url.clone()),
            KEY.into(),
            CancellationToken::new(),
        ));
        let result =
            poll_fn(|cx| tracing::dispatcher::with_default(&dispatch, || test.as_mut().poll(cx)))
                .await
                .unwrap();
        fixture.received().await;
        assert!(result.available);
        assert_eq!(result.usage_input_tokens, None);
        assert_eq!(result.usage_output_tokens, None);
        assert!(!serde_json::to_string(&result).unwrap().contains(KEY));
        assert!(logs.lock().unwrap().iter().all(|line| !line.contains(KEY)));
    }
}

#[tokio::test]
async fn redirect_is_not_followed() {
    let protocol = ModelProtocol::OpenaiChatCompletions;
    let target = Fixture::new("200 OK", success(&protocol, "OK"), Duration::ZERO, "");
    let mut fixture = Fixture::new(
        "307 Temporary Redirect",
        "{}".into(),
        Duration::ZERO,
        &format!("Location: {}/chat/completions\r\n", target.url),
    );
    let gateway = test_gateway(DEADLINE);
    let error = gateway
        .test(
            profile(protocol, fixture.url.clone()),
            KEY.into(),
            CancellationToken::new(),
        )
        .await
        .unwrap_err();
    fixture.received().await;
    assert!(error.may_have_been_charged);
    assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
    assert_eq!(target.hits.load(Ordering::Relaxed), 0);
}

#[tokio::test]
async fn failed_responses_and_tool_calls_do_not_report_available() {
    let protocol = ModelProtocol::OpenaiResponses;
    let mut fixture = Fixture::new(
        "200 OK",
        json!({
            "id": "failed", "model": "unrecognized-test-model", "status": "failed", "output": [],
            "error": {"message": KEY},
        })
        .to_string(),
        Duration::ZERO,
        "",
    );
    let error = test_gateway(DEADLINE)
        .test(
            profile(protocol, fixture.url.clone()),
            KEY.into(),
            CancellationToken::new(),
        )
        .await
        .unwrap_err();
    fixture.received().await;
    assert!(error.may_have_been_charged);
    assert!(!error.message.contains(KEY));

    let protocol = ModelProtocol::OpenaiChatCompletions;
    let mut fixture = Fixture::new("200 OK", json!({
        "model": "unrecognized-test-model",
        "choices": [{"message": {"role": "assistant", "content": null, "tool_calls": [{
            "id": "tool", "type": "function", "function": {"name": "never_execute", "arguments": "{}"},
        }]}, "finish_reason": "tool_calls"}],
    }).to_string(), Duration::ZERO, "");
    let error = test_gateway(DEADLINE)
        .test(
            profile(protocol, fixture.url.clone()),
            KEY.into(),
            CancellationToken::new(),
        )
        .await
        .unwrap_err();
    fixture.received().await;
    assert_eq!(error.code, ErrorCode::CapabilityUnsupported);
    assert!(error.may_have_been_charged);
    assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
}

#[test]
fn unknown_and_invalid_usage_are_nullable() {
    assert_eq!(usage_counter(None), None);
    assert_eq!(usage_counter(Some(-1)), None);
    assert_eq!(usage_counter(Some(0)), Some(0));
    assert_eq!(usage_counter(Some(2)), Some(2));
}

const CHAT_SYSTEM: &str = "Return the internal decision as JSON, with at most three messages.";
const CHAT_CONTEXT: &str = "Group context: this is assembled by the runtime, not the fixed connection-test OK prompt. 用户说：请开始讨论。";
const CHAT_JSON: &str = r#"{"action":"send","messages":[{"text":"第一条内部消息"},{"text":"第二条内部消息"},{"text":"第三条内部消息"}]}"#;

#[tokio::test]
async fn chat_three_protocols_send_system_and_context_and_keep_internal_text() {
    for protocol in protocols() {
        let mut fixture = Fixture::new("200 OK", success(&protocol, CHAT_JSON), Duration::ZERO, "");
        let gateway = test_gateway(DEADLINE);
        let logs = Arc::new(Mutex::new(Vec::new()));
        let dispatch = tracing::Dispatch::new(LogCapture(logs.clone()));
        let mut call = pin!(gateway.chat(
            profile(protocol.clone(), fixture.url.clone()),
            KEY.into(),
            CHAT_SYSTEM.into(),
            CHAT_CONTEXT.into(),
            CancellationToken::new(),
        ));
        let reply =
            poll_fn(|cx| tracing::dispatcher::with_default(&dispatch, || call.as_mut().poll(cx)))
                .await
                .unwrap();
        let request = fixture.received().await;
        let (suffix, tokens_key) = match protocol {
            ModelProtocol::OpenaiChatCompletions => ("chat/completions", "max_tokens"),
            ModelProtocol::AnthropicMessages => ("messages", "max_tokens"),
            ModelProtocol::OpenaiResponses => ("responses", "max_output_tokens"),
        };
        assert_eq!(request.path, format!("/proxy/v1/{suffix}"));
        assert_eq!(request.body["model"], "unrecognized-test-model");
        assert_eq!(request.body[tokens_key], 4096);
        assert_eq!(request.body["temperature"], 0.4);
        assert_eq!(request.body["top_p"], 0.8);
        assert_eq!(request.body["stream"], false);
        match protocol {
            ModelProtocol::AnthropicMessages => {
                assert_eq!(
                    request.headers.get("x-api-key").map(String::as_str),
                    Some(KEY)
                );
                assert_eq!(request.body["system"], CHAT_SYSTEM);
                assert_eq!(request.body["messages"][0]["role"], "user");
                assert_eq!(request.body["messages"][0]["content"], CHAT_CONTEXT);
                assert_eq!(request.body["messages"].as_array().unwrap().len(), 1);
            }
            ModelProtocol::OpenaiChatCompletions | ModelProtocol::OpenaiResponses => {
                assert_eq!(
                    request.headers.get("authorization"),
                    Some(&format!("Bearer {KEY}"))
                );
                let messages = if protocol == ModelProtocol::OpenaiResponses {
                    assert_eq!(request.body["store"], false);
                    &request.body["input"]
                } else {
                    &request.body["messages"]
                };
                assert_eq!(messages.as_array().unwrap().len(), 2);
                assert_eq!(messages[0]["role"], "system");
                assert_eq!(messages[0]["content"], CHAT_SYSTEM);
                assert_eq!(messages[1]["role"], "user");
                assert_eq!(messages[1]["content"], CHAT_CONTEXT);
            }
        }
        for key in [
            "tools",
            "tool_choice",
            "thinking",
            "reasoning",
            "reasoning_effort",
            "previous_response_id",
            "response_format",
        ] {
            assert!(request.body.get(key).is_none());
        }
        assert!(!request.body.to_string().contains(TEST_PROMPT));
        assert!(!request.body.to_string().contains(KEY));
        assert!(!request.body.to_string().contains("private profile name"));
        assert_eq!(reply.text, CHAT_JSON);
        assert_eq!(reply.usage_input_tokens, Some(10));
        assert_eq!(reply.usage_output_tokens, Some(2));
        assert!(!format!("{reply:?}").contains(CHAT_JSON));
        assert!(logs.lock().unwrap().iter().all(|line| !line.contains(KEY)
            && !line.contains(CHAT_CONTEXT)
            && !line.contains(CHAT_JSON)));
        assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
        assert_eq!(gateway.limits.calls.load(Ordering::Relaxed), 0);
        assert_eq!(
            gateway.limits.chat_permits.available_permits(),
            MAX_CHAT_CONCURRENT
        );
    }
}

#[tokio::test]
async fn chat_output_limits_follow_configuration_without_the_test_64_token_cap() {
    for protocol in protocols() {
        for limit in [1, 96, 1024, 4096, 32768] {
            let mut fixture =
                Fixture::new("200 OK", success(&protocol, CHAT_JSON), Duration::ZERO, "");
            let mut p = profile(protocol.clone(), fixture.url.clone());
            p.parameters.max_output_tokens = limit;
            test_gateway(DEADLINE)
                .chat(
                    p,
                    KEY.into(),
                    CHAT_SYSTEM.into(),
                    CHAT_CONTEXT.into(),
                    CancellationToken::new(),
                )
                .await
                .unwrap();
            let key = if protocol == ModelProtocol::OpenaiResponses {
                "max_output_tokens"
            } else {
                "max_tokens"
            };
            assert_eq!(fixture.received().await.body[key], limit.min(4096));
        }
    }
}

#[tokio::test]
async fn chat_rejects_unsupported_reasoning_and_out_of_budget_utf8_before_a_request() {
    let gateway = test_gateway(DEADLINE);
    for protocol in protocols() {
        let mut fixture = Fixture::new("200 OK", success(&protocol, CHAT_JSON), Duration::ZERO, "");
        let mut p = profile(protocol.clone(), fixture.url.clone());
        p.parameters.reasoning = ReasoningMode::Enabled;
        let error = gateway
            .chat(
                p,
                KEY.into(),
                CHAT_SYSTEM.into(),
                CHAT_CONTEXT.into(),
                CancellationToken::new(),
            )
            .await
            .unwrap_err();
        assert_eq!(error.code, ErrorCode::CapabilityUnsupported);
        assert!(!error.may_have_been_charged);
        assert!(!error.message.contains("连接测试"));
        assert_eq!(fixture.hits.load(Ordering::Relaxed), 0);
        let mut p = profile(protocol, fixture.url.clone());
        p.parameters.input_budget = 256;
        // 171 Chinese characters are 513 UTF-8 bytes: byte budgeting, not chars.
        let error = gateway
            .chat(
                p.clone(),
                KEY.into(),
                "s".into(),
                "中".repeat(171),
                CancellationToken::new(),
            )
            .await
            .unwrap_err();
        assert_eq!(error.field_path.as_deref(), Some("context"));
        assert!(!error.may_have_been_charged);
        assert_eq!(fixture.hits.load(Ordering::Relaxed), 0);
        let reply = gateway
            .chat(
                p,
                KEY.into(),
                "s".into(),
                "x".repeat(511),
                CancellationToken::new(),
            )
            .await
            .unwrap();
        assert_eq!(reply.text, CHAT_JSON);
        fixture.received().await;
    }
    for (system, context) in [("", "context"), ("system", " \n")] {
        let error = gateway
            .chat(
                profile(
                    ModelProtocol::OpenaiChatCompletions,
                    "http://127.0.0.1:1/v1".into(),
                ),
                KEY.into(),
                system.into(),
                context.into(),
                CancellationToken::new(),
            )
            .await
            .unwrap_err();
        assert_eq!(error.code, ErrorCode::InvalidInput);
        assert!(!error.may_have_been_charged);
    }
    assert_eq!(gateway.limits.calls.load(Ordering::Relaxed), 0);
    assert_eq!(
        gateway.limits.chat_permits.available_permits(),
        MAX_CHAT_CONCURRENT
    );
}

#[tokio::test]
async fn chat_cancellable_waiting_and_inflight_requests_release_separate_four_slot_limit() {
    let shared = Arc::new(Limits::new());
    let first = Arc::new(ModelGateway::build(DEADLINE, shared.clone()).unwrap());
    let second = ModelGateway::build(DEADLINE, shared.clone()).unwrap();
    let held = shared
        .chat_permits
        .acquire_many(MAX_CHAT_CONCURRENT as u32)
        .await
        .unwrap();
    let protocol = ModelProtocol::OpenaiChatCompletions;
    let fixture = Fixture::new("200 OK", success(&protocol, CHAT_JSON), Duration::ZERO, "");
    let cancellation = CancellationToken::new();
    let mut waiting = pin!(second.chat(
        profile(protocol.clone(), fixture.url.clone()),
        KEY.into(),
        CHAT_SYSTEM.into(),
        CHAT_CONTEXT.into(),
        cancellation.clone()
    ));
    assert!(poll_fn(|cx| std::task::Poll::Ready(waiting.as_mut().poll(cx).is_pending())).await);
    assert_eq!(shared.chat_permits.available_permits(), 0);
    cancellation.cancel();
    let error = waiting.await.unwrap_err();
    assert_eq!(error.code, ErrorCode::ShuttingDown);
    assert!(!error.may_have_been_charged);
    assert_eq!(fixture.hits.load(Ordering::Relaxed), 0);
    drop(held);
    assert_eq!(shared.chat_permits.available_permits(), MAX_CHAT_CONCURRENT);

    let mut fixture = Fixture::new(
        "200 OK",
        success(&protocol, CHAT_JSON),
        Duration::from_millis(200),
        "",
    );
    let cancellation = CancellationToken::new();
    let worker_gateway = first.clone();
    let worker_cancellation = cancellation.clone();
    let p = profile(protocol.clone(), fixture.url.clone());
    let worker = tokio::spawn(async move {
        worker_gateway
            .chat(
                p,
                KEY.into(),
                CHAT_SYSTEM.into(),
                CHAT_CONTEXT.into(),
                worker_cancellation,
            )
            .await
    });
    fixture.received().await;
    assert_eq!(
        shared.chat_permits.available_permits(),
        MAX_CHAT_CONCURRENT - 1
    );
    cancellation.cancel();
    let error = worker.await.unwrap().unwrap_err();
    assert_eq!(error.code, ErrorCode::ShuttingDown);
    assert!(error.may_have_been_charged);
    assert_eq!(shared.chat_permits.available_permits(), MAX_CHAT_CONCURRENT);
    assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
    assert_eq!(shared.calls.load(Ordering::Relaxed), 0);
    let mut next = Fixture::new("200 OK", success(&protocol, CHAT_JSON), Duration::ZERO, "");
    second
        .chat(
            profile(protocol, next.url.clone()),
            KEY.into(),
            CHAT_SYSTEM.into(),
            CHAT_CONTEXT.into(),
            CancellationToken::new(),
        )
        .await
        .unwrap();
    next.received().await;
    let cancellation = CancellationToken::new();
    cancellation.cancel();
    let error = first
        .chat(
            profile(
                ModelProtocol::OpenaiChatCompletions,
                "http://127.0.0.1:1/v1".into(),
            ),
            KEY.into(),
            CHAT_SYSTEM.into(),
            CHAT_CONTEXT.into(),
            cancellation,
        )
        .await
        .unwrap_err();
    assert!(!error.may_have_been_charged);
    assert_eq!(shared.chat_permits.available_permits(), MAX_CHAT_CONCURRENT);
}

#[tokio::test]
async fn chat_is_independent_of_test_process_budget_concurrency_and_short_deadline() {
    let shared = Arc::new(Limits::new());
    shared.calls.store(MAX_PROCESS_CALLS, Ordering::Relaxed);
    let _test_permits = shared
        .permits
        .acquire_many(MAX_CONCURRENT as u32)
        .await
        .unwrap();
    let protocol = ModelProtocol::OpenaiChatCompletions;
    let mut fixture = Fixture::new(
        "200 OK",
        success(&protocol, CHAT_JSON),
        Duration::from_millis(100),
        "",
    );
    let gateway = ModelGateway::build(Duration::from_millis(20), shared.clone()).unwrap();
    assert_eq!(gateway.chat_deadline, CHAT_DEADLINE);
    let reply = gateway
        .chat(
            profile(protocol, fixture.url.clone()),
            KEY.into(),
            CHAT_SYSTEM.into(),
            CHAT_CONTEXT.into(),
            CancellationToken::new(),
        )
        .await
        .unwrap();
    assert_eq!(reply.text, CHAT_JSON);
    assert_eq!(fixture.received().await.body["max_tokens"], 4096);
    assert_eq!(shared.calls.load(Ordering::Relaxed), MAX_PROCESS_CALLS);
    assert_eq!(shared.permits.available_permits(), 0);
    assert_eq!(shared.chat_permits.available_permits(), MAX_CHAT_CONCURRENT);
}

#[tokio::test]
async fn chat_errors_are_redacted_unlogged_and_not_retried() {
    for protocol in protocols() {
        for (status, body, expected) in [
            (
                "401 Unauthorized",
                json!({"error": {"message": KEY}}).to_string(),
                ErrorCode::PermissionDenied,
            ),
            (
                "429 Too Many Requests",
                json!({"error": {"message": KEY}}).to_string(),
                ErrorCode::Backpressure,
            ),
            (
                "500 Internal Server Error",
                json!({"error": {"message": KEY}}).to_string(),
                ErrorCode::IoError,
            ),
            ("200 OK", format!("invalid json {KEY}"), ErrorCode::IoError),
            (
                "200 OK",
                json!({"echo": KEY}).to_string(),
                ErrorCode::IoError,
            ),
            ("200 OK", success(&protocol, KEY), ErrorCode::IoError),
        ] {
            let mut fixture = Fixture::new(status, body, Duration::ZERO, "");
            let gateway = test_gateway(DEADLINE);
            let logs = Arc::new(Mutex::new(Vec::new()));
            let dispatch = tracing::Dispatch::new(LogCapture(logs.clone()));
            tracing::dispatcher::with_default(&dispatch, || tracing::trace!("capture active"));
            assert!(!logs.lock().unwrap().is_empty());
            let mut call = pin!(gateway.chat(
                profile(protocol.clone(), fixture.url.clone()),
                KEY.into(),
                CHAT_SYSTEM.into(),
                CHAT_CONTEXT.into(),
                CancellationToken::new()
            ));
            let error = poll_fn(|cx| {
                tracing::dispatcher::with_default(&dispatch, || call.as_mut().poll(cx))
            })
            .await
            .unwrap_err();
            fixture.received().await;
            let returned = serde_json::to_string(&error).unwrap();
            assert_eq!(error.code, expected);
            assert!(error.may_have_been_charged);
            assert!(!error.trace_id.is_empty());
            assert_eq!(error.retryability, Retryability::Never);
            assert!(!returned.contains(KEY));
            assert!(!returned.contains("request_payload"));
            assert!(!returned.contains("proxy/v1"));
            assert!(!returned.contains("连接测试"));
            assert!(
                logs.lock()
                    .unwrap()
                    .iter()
                    .all(|line| !line.contains(KEY) && !line.contains(CHAT_CONTEXT))
            );
            assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
            assert_eq!(
                gateway.limits.chat_permits.available_permits(),
                MAX_CHAT_CONCURRENT
            );
        }
    }
}

#[tokio::test]
async fn chat_rejects_tools_empty_truncated_filtered_and_failed_responses() {
    for protocol in protocols() {
        let mut truncated: Value = serde_json::from_str(&success(&protocol, CHAT_JSON)).unwrap();
        let mut filtered = truncated.clone();
        let mut failed = truncated.clone();
        let mut tools = truncated.clone();
        let mut missing_completion = truncated.clone();
        match protocol {
            ModelProtocol::OpenaiChatCompletions => {
                missing_completion["choices"][0]["finish_reason"] = Value::Null;
                truncated["choices"][0]["finish_reason"] = json!("length");
                filtered["choices"][0]["finish_reason"] = json!("content_filter");
                failed["choices"][0]["finish_reason"] = json!("failed");
                tools["choices"][0]["message"]["tool_calls"] = json!([{
                    "id": "tool", "type": "function", "function": {"name": "never_execute", "arguments": "{}"},
                }]);
                tools["choices"][0]["finish_reason"] = json!("tool_calls");
            }
            ModelProtocol::AnthropicMessages => {
                missing_completion["stop_reason"] = Value::Null;
                truncated["stop_reason"] = json!("max_tokens");
                filtered["stop_reason"] = json!("refusal");
                failed["stop_reason"] = json!("failed");
                tools["stop_reason"] = json!("tool_use");
                tools["content"].as_array_mut().unwrap().push(json!({
                    "type": "tool_use", "id": "tool", "name": "never_execute", "input": {},
                }));
            }
            ModelProtocol::OpenaiResponses => {
                missing_completion["status"] = Value::Null;
                truncated["status"] = json!("incomplete");
                truncated["incomplete_details"] = json!({"reason": "max_output_tokens"});
                filtered["status"] = json!("incomplete");
                filtered["incomplete_details"] = json!({"reason": "content_filter"});
                failed["status"] = json!("failed");
                tools["output"].as_array_mut().unwrap().push(json!({
                    "type": "function_call", "id": "tool", "call_id": "call", "name": "never_execute", "arguments": "{}",
                }));
            }
        }
        for (body, expected) in [
            (truncated.to_string(), ErrorCode::IoError),
            (filtered.to_string(), ErrorCode::IoError),
            (failed.to_string(), ErrorCode::IoError),
            (missing_completion.to_string(), ErrorCode::IoError),
            (tools.to_string(), ErrorCode::CapabilityUnsupported),
            (success(&protocol, " \n "), ErrorCode::IoError),
        ] {
            let mut fixture = Fixture::new("200 OK", body, Duration::ZERO, "");
            let gateway = test_gateway(DEADLINE);
            let error = gateway
                .chat(
                    profile(protocol.clone(), fixture.url.clone()),
                    KEY.into(),
                    CHAT_SYSTEM.into(),
                    CHAT_CONTEXT.into(),
                    CancellationToken::new(),
                )
                .await
                .unwrap_err();
            fixture.received().await;
            assert_eq!(error.code, expected);
            assert!(error.may_have_been_charged);
            assert!(!error.message.contains("连接测试"));
            assert_eq!(error.retryability, Retryability::Never);
            assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
            assert_eq!(
                gateway.limits.chat_permits.available_permits(),
                MAX_CHAT_CONCURRENT
            );
        }
    }
}

#[tokio::test]
async fn chat_missing_usage_is_nullable_redirect_is_not_followed_and_network_failure_is_safe() {
    for protocol in protocols() {
        let mut body: Value = serde_json::from_str(&success(&protocol, CHAT_JSON)).unwrap();
        body.as_object_mut().unwrap().remove("usage");
        let mut fixture = Fixture::new("200 OK", body.to_string(), Duration::ZERO, "");
        let reply = test_gateway(DEADLINE)
            .chat(
                profile(protocol.clone(), fixture.url.clone()),
                KEY.into(),
                CHAT_SYSTEM.into(),
                CHAT_CONTEXT.into(),
                CancellationToken::new(),
            )
            .await
            .unwrap();
        fixture.received().await;
        assert_eq!(reply.text, CHAT_JSON);
        assert_eq!(reply.usage_input_tokens, None);
        assert_eq!(reply.usage_output_tokens, None);
        let target = Fixture::new("200 OK", success(&protocol, CHAT_JSON), Duration::ZERO, "");
        let mut fixture = Fixture::new(
            "307 Temporary Redirect",
            "{}".into(),
            Duration::ZERO,
            &format!("Location: {}/chat/completions\r\n", target.url),
        );
        let error = test_gateway(DEADLINE)
            .chat(
                profile(protocol, fixture.url.clone()),
                KEY.into(),
                CHAT_SYSTEM.into(),
                CHAT_CONTEXT.into(),
                CancellationToken::new(),
            )
            .await
            .unwrap_err();
        fixture.received().await;
        assert!(error.may_have_been_charged);
        assert!(!error.message.contains(KEY));
        assert!(!error.message.contains("连接测试"));
        assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
        assert_eq!(target.hits.load(Ordering::Relaxed), 0);
    }
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let url = format!("http://{}/v1", listener.local_addr().unwrap());
    drop(listener);
    let error = test_gateway(DEADLINE)
        .chat(
            profile(ModelProtocol::OpenaiChatCompletions, url.clone()),
            KEY.into(),
            CHAT_SYSTEM.into(),
            CHAT_CONTEXT.into(),
            CancellationToken::new(),
        )
        .await
        .unwrap_err();
    assert_eq!(error.code, ErrorCode::IoError);
    assert!(error.may_have_been_charged);
    assert_eq!(error.retryability, Retryability::Never);
    assert!(!error.message.contains(KEY));
    assert!(!error.message.contains(&url));
    assert!(!error.message.contains("连接测试"));
}

#[tokio::test]
async fn chat_deadline_begins_after_acquiring_capacity_and_timeout_never_retries() {
    let protocol = ModelProtocol::OpenaiChatCompletions;
    let mut fixture = Fixture::new("200 OK", success(&protocol, CHAT_JSON), Duration::ZERO, "");
    let mut gateway = test_gateway(DEADLINE);
    gateway.chat_deadline = Duration::from_millis(50);
    let held = gateway
        .limits
        .chat_permits
        .acquire_many(MAX_CHAT_CONCURRENT as u32)
        .await
        .unwrap();
    let mut waiting = pin!(gateway.chat(
        profile(protocol.clone(), fixture.url.clone()),
        KEY.into(),
        CHAT_SYSTEM.into(),
        CHAT_CONTEXT.into(),
        CancellationToken::new()
    ));
    assert!(poll_fn(|cx| std::task::Poll::Ready(waiting.as_mut().poll(cx).is_pending())).await);
    tokio::time::sleep(Duration::from_millis(70)).await;
    drop(held);
    assert_eq!(waiting.await.unwrap().text, CHAT_JSON);
    fixture.received().await;
    assert_eq!(
        gateway.limits.chat_permits.available_permits(),
        MAX_CHAT_CONCURRENT
    );

    for protocol in protocols() {
        let mut fixture = Fixture::new(
            "200 OK",
            success(&protocol, CHAT_JSON),
            Duration::from_millis(200),
            "",
        );
        let mut gateway = test_gateway(DEADLINE);
        gateway.chat_deadline = Duration::from_millis(60);
        let error = gateway
            .chat(
                profile(protocol, fixture.url.clone()),
                KEY.into(),
                CHAT_SYSTEM.into(),
                CHAT_CONTEXT.into(),
                CancellationToken::new(),
            )
            .await
            .unwrap_err();
        fixture.received().await;
        assert_eq!(error.code, ErrorCode::IoError);
        assert!(error.may_have_been_charged);
        assert_eq!(error.retryability, Retryability::Never);
        assert!(!error.message.contains("连接测试"));
        assert_eq!(
            gateway.limits.chat_permits.available_permits(),
            MAX_CHAT_CONCURRENT
        );
        assert_eq!(fixture.hits.load(Ordering::Relaxed), 1);
    }
}
