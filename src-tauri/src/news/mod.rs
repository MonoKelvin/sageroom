//! 联网新闻：固定公开端点、可选系统凭据、免费来源回退；外部数据不能覆盖模型指令。
use std::{
    collections::{HashSet, VecDeque},
    sync::{Arc, OnceLock, atomic::{AtomicU64, Ordering}},
    time::{Duration, Instant},
};

use crate::{
    domain::{contracts::{AppError, NewsConfiguration, NewsItem, NewsPreviewResponse, NewsProvider, NewsProxyMode, NewsSourceDiagnostic}, error::{AppResult, now_ms}},
    secrets::store::SecretStore,
};
use reqwest::Client;
use serde::Deserialize;
use tokio::sync::Mutex;

const BODY_LIMIT: usize = 2_000_000;
const FETCH_BUDGET: Duration = Duration::from_secs(20);
const STALE_LIMIT: Duration = Duration::from_secs(6 * 60 * 60);

struct Cache {
    key: String,
    attempted_at: Instant,
    succeeded_at: Option<Instant>,
    result: NewsPreviewResponse,
}

// 抓取期间共用异步锁，避免多个成员同时请求相同免费接口。
static CACHE: OnceLock<Mutex<VecDeque<Cache>>> = OnceLock::new();
static CREDENTIAL_EPOCH: AtomicU64 = AtomicU64::new(0);

pub fn invalidate_credentials() {
    CREDENTIAL_EPOCH.fetch_add(1, Ordering::Relaxed);
}

pub fn validate_configuration(config: &NewsConfiguration) -> AppResult<()> {
    if !(5..=720).contains(&config.refresh_minutes) {
        return Err(AppError::invalid("refresh_minutes", "刷新间隔必须在 5 到 720 分钟之间。"));
    }
    if !(1..=8).contains(&config.max_items) {
        return Err(AppError::invalid("max_items", "新闻条数必须在 1 到 8 之间。"));
    }
    if !config.proxy_url.is_empty() {
        let url = reqwest::Url::parse(&config.proxy_url).map_err(|_| AppError::invalid("proxy_url", "请输入有效的本地 HTTP 代理地址。"))?;
        if config.proxy_url.len() > 200 || url.scheme() != "http"
            || !matches!(url.host_str(), Some("127.0.0.1" | "localhost" | "[::1]"))
            || url.port().is_none() || !url.username().is_empty() || url.password().is_some()
            || url.query().is_some() || url.fragment().is_some() || url.path() != "/"
        {
            return Err(AppError::invalid("proxy_url", "代理只接受无凭据的本机 HTTP 地址，请填写实际端口。"));
        }
    }
    Ok(())
}

fn config_key(config: &NewsConfiguration, query: &str) -> String {
    format!("{}|{}|{query}", CREDENTIAL_EPOCH.load(Ordering::Relaxed), serde_json::to_string(config).unwrap_or_default())
}

fn empty(config: &NewsConfiguration) -> NewsPreviewResponse {
    NewsPreviewResponse { provider: config.provider.clone(), items: Vec::new(), fetched_at: String::new(), cached: false, stale: false, diagnostics: Vec::new() }
}

/// 只执行模型明确给出的查询，不猜测关键词，也不在每轮聊天前自动抓新闻。
pub async fn search(config: &NewsConfiguration, query: &str, secrets: Option<Arc<SecretStore>>) -> NewsPreviewResponse {
    if !config.enabled || validate_configuration(config).is_err() { return empty(config); }
    read(config, query, secrets, false, false).await
}

pub(crate) async fn search_for_task(config: &NewsConfiguration, query: &str, secrets: Option<Arc<SecretStore>>) -> NewsPreviewResponse {
    if !config.enabled || validate_configuration(config).is_err() { return empty(config); }
    read(config, query, secrets, false, true).await
}

/// 设置页用固定探测词检查接口，不调用模型、不保存关键词。
pub async fn preview(config: &NewsConfiguration, secrets: Option<Arc<SecretStore>>) -> NewsPreviewResponse {
    read(config, "news", secrets, true, false).await
}

fn cached_result(entry: &Cache, ttl: Duration) -> Option<NewsPreviewResponse> {
    let successful = !entry.result.stale && !entry.result.items.is_empty();
    let age = entry.attempted_at.elapsed();
    if age >= if successful { ttl.min(STALE_LIMIT) } else { Duration::from_secs(60) } { return None; }
    let mut result = entry.result.clone();
    if entry.succeeded_at.is_some_and(|at| at.elapsed() >= STALE_LIMIT) { result.items.clear(); }
    result.cached = true;
    Some(result)
}

async fn read(config: &NewsConfiguration, query: &str, secrets: Option<Arc<SecretStore>>, force: bool, query_only: bool) -> NewsPreviewResponse {
    let mut entries = CACHE.get_or_init(|| Mutex::new(VecDeque::new())).lock().await;
    let key = format!("{query_only}:{}", config_key(config, query));
    let previous = entries.iter().position(|entry| entry.key == key).and_then(|index| entries.remove(index));
    if !force && let Some(entry) = previous.as_ref()
        && let Some(result) = cached_result(entry, Duration::from_secs(u64::from(config.refresh_minutes) * 60))
    {
        entries.push_back(previous.unwrap());
        return result;
    }
    let mut result = fetch_with_fallback(config, query, secrets, query_only).await;
    let succeeded_at = if result.items.is_empty() {
        if let Some(entry) = previous.as_ref()
            && entry.succeeded_at.is_some_and(|at| at.elapsed() < STALE_LIMIT)
        {
            result.items = entry.result.items.clone();
            result.provider = entry.result.provider.clone();
            result.fetched_at = entry.result.fetched_at.clone();
            result.stale = true;
        }
        previous.and_then(|entry| entry.succeeded_at)
    } else { Some(Instant::now()) };
    entries.push_back(Cache { key, attempted_at: Instant::now(), succeeded_at, result: result.clone() });
    while entries.len() > 8 { entries.pop_front(); }
    result
}

fn fallback_order(preferred: &NewsProvider) -> Vec<NewsProvider> {
    let mut providers = if *preferred == NewsProvider::Auto { Vec::new() } else { vec![preferred.clone()] };
    // 不把其他需要 Key 的来源放进回退池，避免隐式消耗收费账户额度。
    // 自动模式先按 AI 查询搜索，再回退到不支持搜索的热点源。
    for provider in [NewsProvider::GoogleNewsRss, NewsProvider::AnySearch, NewsProvider::AiHot, NewsProvider::FreeNewsTrending, NewsProvider::BbcTechnology, NewsProvider::Gdelt] {
        if &provider != preferred { providers.push(provider); }
    }
    providers
}

async fn provider_key(provider: &NewsProvider, secrets: Option<Arc<SecretStore>>) -> Result<Option<String>, String> {
    if !matches!(provider, NewsProvider::Tavily | NewsProvider::Serper) { return Ok(None); }
    let Some(secrets) = secrets else { return Ok(None); };
    let provider = provider.clone();
    tauri::async_runtime::spawn_blocking(move || secrets.read_news(&provider)).await
        .map_err(|_| "无法读取系统新闻凭据".to_owned())?
        .map_err(|_| "无法读取系统新闻凭据".to_owned())
}

fn task_source_order(preferred: &NewsProvider) -> Vec<NewsProvider> {
    let mut sources = fallback_order(preferred);
    sources.retain(|provider| !matches!(provider, NewsProvider::AiHot | NewsProvider::FreeNewsTrending | NewsProvider::BbcTechnology));
    if *preferred == NewsProvider::Auto {
        sources.swap(0, 1);
    }
    sources
}

async fn fetch_with_fallback(config: &NewsConfiguration, query: &str, secrets: Option<Arc<SecretStore>>, query_only: bool) -> NewsPreviewResponse {
    let mut result = empty(config);
    let client = match client(config) {
        Ok(client) => client,
        Err(message) => { result.diagnostics.push(NewsSourceDiagnostic { provider: config.provider.clone(), message }); return result; }
    };
    let started = Instant::now();
    let sources = if query_only { task_source_order(&config.provider) } else { fallback_order(&config.provider) };
    for provider in sources {
        let remaining = FETCH_BUDGET.saturating_sub(started.elapsed());
        if remaining.is_zero() {
            result.diagnostics.push(NewsSourceDiagnostic { provider, message: "本次抓取已达到 20 秒上限，未继续请求".into() });
            break;
        }
        let fetch = async {
            let key = provider_key(&provider, secrets.clone()).await?;
            fetch_one(&client, config, query, &provider, key.as_deref()).await
        };
        let fetched = tokio::time::timeout(remaining, fetch).await.unwrap_or_else(|_| Err("请求超时，请检查网络或本地代理".into()));
        match fetched {
            Ok(items) if !items.is_empty() => {
                result.provider = provider;
                result.items = items;
                result.fetched_at = now_ms().to_string();
                return result;
            }
            Ok(_) => result.diagnostics.push(NewsSourceDiagnostic { provider, message: "来源没有返回匹配新闻".into() }),
            Err(message) => result.diagnostics.push(NewsSourceDiagnostic { provider, message }),
        }
    }
    result
}

fn effective_proxy_mode(config: &NewsConfiguration) -> NewsProxyMode {
    if config.proxy_enabled { config.proxy_mode.clone() } else { NewsProxyMode::Direct }
}

fn client(config: &NewsConfiguration) -> Result<Client, String> {
    let mut builder = Client::builder().timeout(Duration::from_secs(5))
        .redirect(reqwest::redirect::Policy::none())
        .user_agent("local-news-reader/1.0");
    builder = match effective_proxy_mode(config) {
        NewsProxyMode::Direct => builder.no_proxy(),
        // reqwest 的 system-proxy feature 读取系统设置和代理环境变量，不写系统配置。
        NewsProxyMode::System => builder,
        NewsProxyMode::Manual if config.proxy_url.trim().is_empty() => return Err("手动代理模式需要填写本机 HTTP 代理地址".into()),
        NewsProxyMode::Manual => builder.no_proxy().proxy(reqwest::Proxy::all(&config.proxy_url).map_err(|_| "本地代理地址无效".to_owned())?),
    };
    builder.build().map_err(|_| "无法创建新闻网络客户端".into())
}

fn http_error(status: reqwest::StatusCode) -> String {
    match status.as_u16() {
        401 | 403 => format!("HTTP {status}：来源拒绝访问，请检查 API Key 或匿名访问限制"),
        402 | 429 => format!("HTTP {status}：免费额度已用完或来源限流，请稍后重试"),
        300..=399 => format!("HTTP {status}：来源发生重定向，本次未跟随"),
        _ => format!("来源返回 HTTP {status}"),
    }
}

async fn body(request: reqwest::RequestBuilder) -> Result<String, String> {
    let mut response = request.send().await.map_err(|error| if error.is_timeout() { "请求超时，请检查网络或本地代理" } else { "无法连接来源，请检查网络或本地代理" }.to_owned())?;
    if !response.status().is_success() { return Err(http_error(response.status())); }
    if response.content_length().is_some_and(|length| length > BODY_LIMIT as u64) { return Err("新闻响应超过大小上限".into()); }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(|_| "新闻响应读取失败".to_owned())? {
        if bytes.len() + chunk.len() > BODY_LIMIT { return Err("新闻响应超过大小上限".into()); }
        bytes.extend_from_slice(&chunk);
    }
    String::from_utf8(bytes).map_err(|_| "新闻响应编码无效".into())
}

fn query_url(base: &str, pairs: &[(&str, &str)]) -> reqwest::Url {
    let mut url = reqwest::Url::parse(base).expect("固定新闻端点应为有效 URL");
    url.query_pairs_mut().extend_pairs(pairs.iter().copied());
    url
}

async fn fetch_one(client: &Client, config: &NewsConfiguration, query: &str, provider: &NewsProvider, key: Option<&str>) -> Result<Vec<NewsItem>, String> {
    let limit = usize::from(config.max_items);
    let request = match provider {
        NewsProvider::Auto => return Err("自动来源不能作为单个请求".into()),
        NewsProvider::GoogleNewsRss => client.get(query_url("https://news.google.com/rss/search", &[("q", &format!("{query} when:7d")), ("hl", "zh-CN"), ("gl", "CN"), ("ceid", "CN:zh-Hans")])),
        NewsProvider::AiHot => {
            let mut url = query_url("https://aihot.news/api/v1/items", &[("mode", "selected"), ("window", "7d"), ("limit", &limit.to_string())]);
            // AIHOT 本身只覆盖 AI 行业，作为回退来源时保留热点供模型判断相关性。
            if config.provider == NewsProvider::AiHot { url.query_pairs_mut().append_pair("q", query); }
            client.get(url)
        }
        NewsProvider::FreeNewsTrending => client.get("https://ethos6.github.io/free-news-api/v1/trending.json"),
        NewsProvider::BbcTechnology => client.get("https://feeds.bbci.co.uk/news/technology/rss.xml"),
        NewsProvider::Gdelt => client.get(query_url("https://api.gdeltproject.org/api/v2/doc/doc", &[("query", query), ("mode", "artlist"), ("format", "json"), ("sort", "datedesc"), ("timespan", "7d"), ("maxrecords", &limit.max(10).to_string())])),
        NewsProvider::AnySearch => client.post("https://api.anysearch.com/v1/search").json(&serde_json::json!({"query":query,"max_results":limit})),
        NewsProvider::Tavily => {
            let request = client.post("https://api.tavily.com/search").json(&serde_json::json!({"query":query,"topic":"news","time_range":"week","max_results":limit,"search_depth":"basic","include_answer":false}));
            match key { Some(key) => request.bearer_auth(key), None => request.header("x-tavily-access-mode", "keyless") }
        }
        NewsProvider::Serper => client.post("https://google.serper.dev/news")
            .header("X-API-KEY", key.ok_or_else(|| "尚未配置 Serper API Key，可先使用免费来源".to_owned())?)
            .json(&serde_json::json!({"q":query,"num":limit,"hl":"zh-cn","gl":"cn","tbs":"qdr:w"})),
    };
    let text = body(request).await?;
    let rss = matches!(provider, NewsProvider::GoogleNewsRss | NewsProvider::BbcTechnology);
    if rss {
        if !text.contains("<rss") { return Err("来源没有返回 RSS，可能是访问验证页面".into()); }
    } else if serde_json::from_str::<serde_json::Value>(&text).is_err() {
        return Err("来源没有返回有效 JSON，可能是限流或访问验证页面".into());
    }
    let items = match provider {
        NewsProvider::GoogleNewsRss | NewsProvider::BbcTechnology => parse_rss(&text, limit),
        NewsProvider::AiHot => parse_aihot(&text, limit),
        NewsProvider::FreeNewsTrending => parse_trending(&text, limit),
        NewsProvider::Gdelt => parse_gdelt(&text, limit),
        NewsProvider::AnySearch | NewsProvider::Tavily | NewsProvider::Serper => parse_search(&text, provider, limit)?,
        NewsProvider::Auto => Vec::new(),
    };
    Ok(normalize(items, provider, limit))
}

fn parse_search(json: &str, provider: &NewsProvider, limit: usize) -> Result<Vec<NewsItem>, String> {
    let data: serde_json::Value = serde_json::from_str(json).map_err(|_| "搜索响应格式无效".to_owned())?;
    let rows = match provider {
        NewsProvider::AnySearch => {
            if data.get("code").and_then(|value| value.as_i64()) != Some(0) { return Err("AnySearch 返回服务错误".into()); }
            data.pointer("/data/results")
        }
        NewsProvider::Tavily => data.get("results"),
        NewsProvider::Serper => data.get("news"),
        _ => None,
    }.and_then(|value| value.as_array()).ok_or_else(|| "搜索响应缺少新闻结果列表".to_owned())?;
    let field = |row: &serde_json::Value, name: &str| row.get(name).and_then(|value| value.as_str()).unwrap_or("").to_owned();
    Ok(rows.iter().take(limit).map(|row| NewsItem {
        title: field(row, "title"),
        url: field(row, if *provider == NewsProvider::Serper { "link" } else { "url" }),
        source: field(row, "source"),
        published: field(row, if *provider == NewsProvider::Serper { "date" } else { "published_date" }),
        summary: field(row, if *provider == NewsProvider::Tavily { "content" } else { "snippet" }),
    }).collect())
}

fn normalize(items: Vec<NewsItem>, provider: &NewsProvider, limit: usize) -> Vec<NewsItem> {
    let mut seen = HashSet::new();
    items.into_iter().filter_map(|mut item| {
        let url = reqwest::Url::parse(item.url.trim()).ok()?;
        if !matches!(url.scheme(), "http" | "https") || !url.username().is_empty() || url.password().is_some() || item.url.len() > 2048 { return None; }
        item.title = bound(clean(&item.title), 140);
        if item.title.is_empty() || !seen.insert(url.to_string()) { return None; }
        item.url = url.to_string();
        item.summary = bound(clean(&item.summary), 160);
        item.published = bound(clean(&item.published), 60);
        item.source = bound(clean(&item.source), 80);
        if item.source.is_empty() { item.source = if *provider == NewsProvider::BbcTechnology { "BBC".into() } else { url.host_str().unwrap_or_default().to_owned() }; }
        Some(item)
    }).take(limit).collect()
}

#[derive(Deserialize)]
struct TrendingResponse {
    #[serde(default)]
    stories: Vec<TrendingStory>,
}

#[derive(Deserialize)]
struct TrendingStory {
    #[serde(default)]
    title: String,
    #[serde(default)]
    url: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    sources: Vec<String>,
    #[serde(default)]
    latest: String,
    #[serde(default)]
    category: String,
}

fn parse_trending(json: &str, limit: usize) -> Vec<NewsItem> {
    let Ok(response) = serde_json::from_str::<TrendingResponse>(json) else {
        return Vec::new();
    };
    response
        .stories
        .into_iter()
        .filter(|story| !story.title.trim().is_empty() && !story.url.trim().is_empty())
        .take(limit)
        .map(|story| NewsItem {
            title: bound(clean(&story.title), 140),
            url: story.url.trim().to_owned(),
            source: {
                let source = if story.sources.is_empty() {
                    story.category.clone()
                } else {
                    story.sources.join("、")
                };
                bound(clean(&source), 80)
            },
            published: bound(story.latest, 40),
            summary: bound(clean(&story.description), 160),
        })
        .collect()
}

/// AIHOT 的 summary 是服务端生成的摘要，按外部资料对待，不当作原文正文。
#[derive(Deserialize)]
struct AiHotResponse {
    #[serde(default)]
    items: Vec<AiHotItem>,
}

#[derive(Deserialize, Default)]
struct AiHotItem {
    #[serde(default)]
    title: String,
    #[serde(default, rename = "originalTitle")]
    original_title: String,
    #[serde(default)]
    summary: String,
    #[serde(default)]
    links: AiHotLinks,
    #[serde(default)]
    source: AiHotSource,
    #[serde(default, rename = "publishedAt")]
    published_at: String,
}

#[derive(Deserialize, Default)]
struct AiHotLinks {
    #[serde(default)]
    original: String,
    #[serde(default)]
    aihot: String,
}

#[derive(Deserialize, Default)]
struct AiHotSource {
    #[serde(default)]
    name: String,
}

fn parse_aihot(json: &str, limit: usize) -> Vec<NewsItem> {
    let Ok(response) = serde_json::from_str::<AiHotResponse>(json) else {
        return Vec::new();
    };
    response
        .items
        .into_iter()
        .map(|item| {
            let url = if item.links.original.trim().is_empty() {
                item.links.aihot.trim().to_owned()
            } else {
                item.links.original.trim().to_owned()
            };
            let title = if item.title.trim().is_empty() {
                item.original_title
            } else {
                item.title
            };
            NewsItem {
                title: bound(clean(&title), 140),
                url,
                source: bound(clean(&item.source.name), 80),
                published: bound(item.published_at, 40),
                summary: bound(clean(&item.summary), 160),
            }
        })
        .filter(|item| !item.title.is_empty() && !item.url.is_empty())
        .take(limit)
        .collect()
}

#[derive(Deserialize)]
struct GdeltResponse {
    #[serde(default)]
    articles: Vec<GdeltArticle>,
}

#[derive(Deserialize, Default)]
struct GdeltArticle {
    #[serde(default)]
    title: String,
    #[serde(default)]
    url: String,
    #[serde(default)]
    domain: String,
    #[serde(default)]
    sourcecountry: String,
    #[serde(default)]
    seendate: String,
}

fn parse_gdelt(json: &str, limit: usize) -> Vec<NewsItem> {
    let Ok(response) = serde_json::from_str::<GdeltResponse>(json) else {
        return Vec::new();
    };
    response
        .articles
        .into_iter()
        .filter(|article| !article.title.trim().is_empty() && !article.url.trim().is_empty())
        .take(limit)
        .map(|article| NewsItem {
            title: bound(clean(&article.title), 140),
            url: article.url.trim().to_owned(),
            source: bound(
                clean(&format!(
                    "{}{}",
                    article.domain,
                    if article.sourcecountry.is_empty() {
                        String::new()
                    } else {
                        format!(" · {}", article.sourcecountry)
                    }
                )),
                80,
            ),
            published: bound(gdelt_date(&article.seendate), 40),
            summary: String::new(),
        })
        .collect()
}

fn gdelt_date(raw: &str) -> String {
    let digits: String = raw.chars().filter(|ch| ch.is_ascii_digit()).collect();
    if digits.len() < 8 {
        return String::new();
    }
    format!(
        "{}-{}-{}",
        &digits[0..4],
        &digits[4..6],
        &digits[6..8]
    )
}

fn parse_rss(xml: &str, limit: usize) -> Vec<NewsItem> {
    let mut rest = xml;
    let mut items = Vec::new();
    while let Some(start) = rest.find("<item>") {
        rest = &rest[start + "<item>".len()..];
        let end = rest.find("</item>").unwrap_or(rest.len());
        let block = &rest[..end];
        rest = &rest[end..];
        let title = bound(clean(&tag(block, "title")), 140);
        let url = tag(block, "link").trim().replace("&amp;", "&");
        if title.is_empty() || url.is_empty() {
            continue;
        }
        items.push(NewsItem {
            title,
            url,
            source: bound(clean(&tag(block, "source")), 80),
            published: bound(tag(block, "pubDate").trim().to_owned(), 40),
            summary: bound(clean(&tag(block, "description")), 160),
        });
        if items.len() >= limit {
            break;
        }
    }
    items
}

fn tag(block: &str, name: &str) -> String {
    let Some(start) = block.find(&format!("<{name}")) else {
        return String::new();
    };
    let Some(greater) = block[start..].find('>') else {
        return String::new();
    };
    let from = start + greater + 1;
    let close = format!("</{name}>");
    let Some(length) = block[from..].find(&close) else {
        return String::new();
    };
    block[from..from + length]
        .trim()
        .trim_start_matches("<![CDATA[")
        .trim_end_matches("]]>")
        .to_owned()
}

fn clean(raw: &str) -> String {
    let mut text = String::with_capacity(raw.len());
    let mut inside_tag = false;
    for ch in raw.chars() {
        match ch {
            '<' => inside_tag = true,
            '>' => inside_tag = false,
            _ if !inside_tag => text.push(ch),
            _ => {}
        }
    }
    text.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&nbsp;", " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn bound(value: String, limit: usize) -> String {
    if value.chars().count() <= limit {
        return value;
    }
    value.chars().take(limit).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rss_items_are_bounded_and_html_is_stripped() {
        let xml = "<?xml version=\"1.0\"?><channel><item><title>  A &amp; B  </title><link>https://example.com/1</link><pubDate>Wed, 25 Nov 2026</pubDate><source>BBC</source><description><![CDATA[<p>Hello   &quot;world&quot;</p>]]></description></item><item><title>Second</title><link>https://example.com/2</link></item></channel>";
        let items = parse_rss(xml, 2);
        assert_eq!(items.len(), 2);
        assert_eq!(items[0].title, "A & B");
        assert_eq!(items[0].source, "BBC");
        assert_eq!(items[0].summary, "Hello \"world\"");
        assert_eq!(items[1].title, "Second");
        assert!(parse_rss(xml, 1).len() == 1);
    }

    #[test]
    fn trending_stories_are_bounded_and_empty_titles_are_skipped() {
        let json = r#"{"stories":[{"title":"  headline  ","url":"https://example.com/a","description":"Some text","sources":["BBC","CNBC"],"latest":"2026-11-25","category":"tech"},{"title":"   ","url":"https://example.com/b"}]}"#;
        let items = parse_trending(json, 4);
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].title, "headline");
        assert_eq!(items[0].source, "BBC、CNBC");
        assert_eq!(items[0].published, "2026-11-25");
    }

    #[test]
    fn aihot_items_use_original_link_and_bounded_summary() {
        let json = r#"{"items":[{"title":" AI 新闻 ","summary":"  摘要  ","links":{"original":"https://example.com/a"},"source":{"name":"站点"},"publishedAt":"2026-11-25T03:29:13.877Z"},{"title":"无链接","links":{}}]}"#;
        let items = parse_aihot(json, 4);
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].title, "AI 新闻");
        assert_eq!(items[0].url, "https://example.com/a");
        assert_eq!(items[0].source, "站点");
        assert_eq!(items[0].summary, "摘要");
    }

    #[test]
    fn gdelt_rate_limit_text_is_not_mistaken_for_news() {
        let json = r#"{"articles":[{"title":"World headline","url":"https://example.com/w","domain":"example.com","sourcecountry":"US","seendate":"20261125033000"}]}"#;
        let items = parse_gdelt(json, 2);
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].published, "2026-11-25");
        assert_eq!(items[0].source, "example.com · US");
        assert!(parse_gdelt("Please limit requests to one every 5 seconds", 2).is_empty());
    }

    #[test]
    fn news_commands_are_registered_and_granted_to_main_window() {
        let manifest = include_str!("../../build.rs");
        let handlers = include_str!("../lib.rs");
        let permissions = include_str!("../../permissions/app.toml");
        let capability: serde_json::Value = serde_json::from_str(include_str!("../../capabilities/main.json")).unwrap();
        for command in ["news_configuration_get", "news_configuration_save", "news_preview", "news_secret_status", "news_secret_set"] {
            assert!(manifest.contains(&format!("\"{command}\"")), "命令必须进入 AppManifest：{command}");
            assert!(handlers.contains(&format!("app::commands::{command}")), "命令必须注册 handler：{command}");
            assert!(permissions.contains(&format!("\"{command}\"")), "命令必须获得权限：{command}");
        }
        let granted = capability["permissions"].as_array().unwrap();
        for permission in ["configuration-read", "configuration-write", "credentials-manage", "news-preview"] {
            assert!(granted.iter().any(|value| value.as_str() == Some(permission)));
        }
    }

    #[test]
    fn automatic_fallback_never_uses_paid_accounts() {
        let order = fallback_order(&NewsProvider::Auto);
        assert_eq!(order[0], NewsProvider::GoogleNewsRss);
        assert!(!order.contains(&NewsProvider::Tavily));
        assert!(!order.contains(&NewsProvider::Serper));
        assert!(!order.contains(&NewsProvider::Auto));
        let paid = fallback_order(&NewsProvider::Serper);
        assert_eq!(paid[0], NewsProvider::Serper);
        assert!(!paid.contains(&NewsProvider::Tavily));
    }

    #[test]
    fn configuration_bounds_and_local_proxy_are_shared_by_save_and_preview() {
        let mut config = NewsConfiguration::default();
        for proxy in ["", "http://127.0.0.1:7897", "http://localhost:7897", "http://[::1]:7897"] {
            config.proxy_url = proxy.into();
            assert!(validate_configuration(&config).is_ok(), "{proxy}");
        }
        for proxy in ["http://example.com:7897", "https://127.0.0.1:7897", "http://key@localhost:7897", "http://localhost:7897/?key=secret", "http://localhost", "http://localhost:7897/path"] {
            config.proxy_url = proxy.into();
            assert!(validate_configuration(&config).is_err(), "{proxy}");
        }
        config.proxy_url.clear();
        config.max_items = 0;
        assert!(validate_configuration(&config).is_err());
        config.max_items = 3;
        config.refresh_minutes = 0;
        assert!(validate_configuration(&config).is_err());
    }

    #[test]
    fn disabled_and_direct_modes_never_follow_system_proxy() {
        let mut config = NewsConfiguration::default();
        assert_eq!(effective_proxy_mode(&config), NewsProxyMode::Direct);
        config.proxy_url = "http://127.0.0.1:8765".into();
        config.proxy_mode = NewsProxyMode::Manual;
        assert_eq!(effective_proxy_mode(&config), NewsProxyMode::Direct);
        config.proxy_enabled = true;
        assert_eq!(effective_proxy_mode(&config), NewsProxyMode::Manual);
        config.proxy_mode = NewsProxyMode::System;
        assert_eq!(effective_proxy_mode(&config), NewsProxyMode::System);
        config.proxy_mode = NewsProxyMode::Direct;
        assert_eq!(effective_proxy_mode(&config), NewsProxyMode::Direct);
        config.proxy_mode = NewsProxyMode::Manual;
        config.proxy_url.clear();
        assert!(validate_configuration(&config).is_ok());
        assert!(client(&config).is_err());
        config.proxy_enabled = false;
        assert!(validate_configuration(&config).is_ok());
        assert!(client(&config).is_ok());
    }

    #[test]
    fn old_configuration_without_proxy_remains_readable() {
        let config: NewsConfiguration = serde_json::from_str(r#"{"enabled":true,"provider":"google_news_rss","refresh_minutes":30,"max_items":3}"#).unwrap();
        assert!(config.proxy_url.is_empty());
        assert!(!config.proxy_enabled);
        assert_eq!(effective_proxy_mode(&config), NewsProxyMode::Direct);
        assert_eq!(config.provider, NewsProvider::GoogleNewsRss);
    }

    #[test]
    fn search_providers_map_news_and_reject_service_errors() {
        let tavily = r#"{"results":[{"title":"标题","url":"https://example.com/a","content":"摘要","published_date":"2026-11-25"}]}"#;
        let items = parse_search(tavily, &NewsProvider::Tavily, 3).unwrap();
        assert_eq!(items[0].summary, "摘要");
        assert_eq!(items[0].published, "2026-11-25");
        let serper = r#"{"news":[{"title":"新闻","link":"https://example.com/a","snippet":"摘要","source":"媒体","date":"1 hour ago"}]}"#;
        let items = parse_search(serper, &NewsProvider::Serper, 3).unwrap();
        assert_eq!(items[0].source, "媒体");
        let any = r#"{"code":0,"data":{"results":[{"title":"新闻","url":"https://example.com/a","snippet":"摘要"}]}}"#;
        assert_eq!(parse_search(any, &NewsProvider::AnySearch, 3).unwrap().len(), 1);
        assert!(parse_search(r#"{"code":403,"message":"secret-value"}"#, &NewsProvider::AnySearch, 3).unwrap_err().find("secret-value").is_none());
        assert!(parse_search("{}", &NewsProvider::Serper, 3).is_err());
    }

    #[test]
    fn news_urls_are_validated_and_deduplicated_without_truncating_links() {
        let item = |url: &str| NewsItem { title: "<b>新闻</b>".into(), url: url.into(), source: "".into(), published: "".into(), summary: "".into() };
        let long_url = format!("https://example.com/{}", "a".repeat(600));
        let items = normalize(vec![item("javascript:alert(1)"), item("https://key@example.com/a"), item(&long_url), item(&long_url)], &NewsProvider::AnySearch, 8);
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].url, long_url);
        assert_eq!(items[0].source, "example.com");
        assert_eq!(items[0].title, "新闻");
    }

    #[test]
    fn model_queries_have_separate_cache_entries() {
        let config = NewsConfiguration::default();
        assert_ne!(config_key(&config, "月球"), config_key(&config, "足球"));
        assert_eq!(config_key(&config, "月球"), config_key(&config, "月球"));
    }

    #[test]
    fn failures_have_short_cache_and_old_results_expire() {
        let config = NewsConfiguration::default();
        let entry = Cache { key: config_key(&config, "test"), attempted_at: Instant::now() - Duration::from_secs(61), succeeded_at: None, result: empty(&config) };
        assert!(cached_result(&entry, Duration::from_secs(1800)).is_none());
        let mut result = empty(&config);
        result.items = vec![NewsItem { title: "旧新闻".into(), url: "https://example.com".into(), source: "".into(), published: "".into(), summary: "".into() }];
        result.stale = true;
        let entry = Cache { key: config_key(&config, "test"), attempted_at: Instant::now(), succeeded_at: Some(Instant::now() - STALE_LIMIT), result };
        assert!(cached_result(&entry, Duration::from_secs(1800)).unwrap().items.is_empty());
    }

    #[tokio::test]
    async fn disabled_news_never_contacts_sources() {
        let config = NewsConfiguration { enabled: false, proxy_url: "http://127.0.0.1:1".into(), ..NewsConfiguration::default() };
        assert!(search(&config, "test", None).await.items.is_empty());
    }

    // 显式运行才访问公网；普通测试不依赖外部来源。
    #[tokio::test]
    #[ignore = "需要外网，可用 NEWS_TEST_PROXY 指定本地测试代理"]
    async fn live_free_sources_return_news() {
        let proxy_url = std::env::var("NEWS_TEST_PROXY").unwrap_or_default();
        for provider in [NewsProvider::Auto, NewsProvider::AnySearch, NewsProvider::BbcTechnology, NewsProvider::FreeNewsTrending, NewsProvider::Tavily] {
            let config = NewsConfiguration { provider, proxy_enabled: true, proxy_mode: if proxy_url.is_empty() { NewsProxyMode::System } else { NewsProxyMode::Manual }, proxy_url: proxy_url.clone(), ..NewsConfiguration::default() };
            let result = search(&config, "technology news", None).await;
            println!("来源：{:?}，条数：{}，诊断：{:?}", result.provider, result.items.len(), result.diagnostics);
            if config.provider != NewsProvider::Auto && config.provider != NewsProvider::Tavily {
                assert_eq!(result.provider, config.provider, "应验收指定来源而非回退结果");
            }
            assert!(!result.items.is_empty());
            assert!(!result.cached);
        }
    }

    #[test]
    fn direct_task_search_never_replaces_the_query_with_trending_feeds() {
        let auto = task_source_order(&NewsProvider::Auto);
        assert_eq!(auto, vec![NewsProvider::AnySearch, NewsProvider::GoogleNewsRss, NewsProvider::Gdelt]);
        assert_eq!(task_source_order(&NewsProvider::Serper).first(), Some(&NewsProvider::Serper));
        assert!(!task_source_order(&NewsProvider::AiHot).contains(&NewsProvider::AiHot));
    }

    #[test]
    fn fallback_order_keeps_preferred_source_first() {
        let order = fallback_order(&NewsProvider::AiHot);
        assert_eq!(order.first(), Some(&NewsProvider::AiHot));
        assert_eq!(order.len(), 6);
        assert!(order.iter().filter(|item| *item == &NewsProvider::AiHot).count() == 1);
    }
}
