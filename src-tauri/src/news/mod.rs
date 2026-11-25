//! 联网新闻：只读取配置指定的公开来源，失败静默降级，不阻断聊天。
//! 数据作为外部资料进入模型上下文，不属于指令，也不能覆盖人格或权限。
use std::{
    sync::{Mutex, OnceLock},
    time::{Duration, Instant},
};

use crate::domain::contracts::{NewsConfiguration, NewsProvider};
use serde::Deserialize;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct NewsItem {
    pub title: String,
    pub url: String,
    pub source: String,
    pub published: String,
    pub summary: String,
}

struct Cache {
    key: String,
    fetched_at: Instant,
    items: Vec<NewsItem>,
}

static CACHE: OnceLock<Mutex<Option<Cache>>> = OnceLock::new();

fn cache() -> &'static Mutex<Option<Cache>> {
    CACHE.get_or_init(|| Mutex::new(None))
}

fn config_key(config: &NewsConfiguration) -> String {
    format!(
        "{:?}|{}|{}",
        config.provider, config.query, config.max_items
    )
}

/// 取新闻简报。禁用时返回空；缓存命中或拉取失败都不抛错给聊天链路。
pub async fn brief(config: &NewsConfiguration) -> Vec<NewsItem> {
    if !config.enabled {
        return Vec::new();
    }
    let key = config_key(config);
    let ttl = Duration::from_secs(u64::from(config.refresh_minutes) * 60);
    if let Ok(guard) = cache().lock()
        && let Some(cached) = guard.as_ref()
        && cached.key == key
        && cached.fetched_at.elapsed() < ttl
    {
        return cached.items.clone();
    }
    let Some(items) = fetch(config).await else {
        return Vec::new();
    };
    if let Ok(mut guard) = cache().lock() {
        *guard = Some(Cache {
            key,
            fetched_at: Instant::now(),
            items: items.clone(),
        });
    }
    items
}

async fn fetch(config: &NewsConfiguration) -> Option<Vec<NewsItem>> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(8))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .ok()?;
    let body = match config.provider {
        NewsProvider::GoogleNewsRss => {
            let mut url = reqwest::Url::parse("https://news.google.com/rss/search")
                .ok()?;
            url.query_pairs_mut()
                .append_pair("q", &config.query)
                .append_pair("hl", "zh-CN")
                .append_pair("gl", "CN")
                .append_pair("ceid", "CN:zh-Hans");
            client.get(url).send().await.ok()?.text().await.ok()?
        }
        NewsProvider::FreeNewsTrending => {
            client
                .get("https://ethos6.github.io/free-news-api/v1/trending.json")
                .send()
                .await
                .ok()?
                .text()
                .await
                .ok()?
        }
    };
    if body.len() > 2_000_000 {
        return None;
    }
    let items = match config.provider {
        NewsProvider::GoogleNewsRss => parse_rss(&body, usize::from(config.max_items)),
        NewsProvider::FreeNewsTrending => parse_trending(&body, usize::from(config.max_items)),
    };
    (!items.is_empty()).then_some(items)
}

#[derive(Deserialize)]
struct TrendingResponse {
    stories: Vec<TrendingStory>,
}

#[derive(Deserialize)]
struct TrendingStory {
    title: String,
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
            url: bound(story.url.trim().to_owned(), 512),
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

fn parse_rss(xml: &str, limit: usize) -> Vec<NewsItem> {
    let mut rest = xml;
    let mut items = Vec::new();
    while let Some(start) = rest.find("<item>") {
        rest = &rest[start + "<item>".len()..];
        let end = rest.find("</item>").unwrap_or(rest.len());
        let block = &rest[..end];
        rest = &rest[end..];
        let title = bound(clean(&tag(block, "title")), 140);
        let url = bound(tag(block, "link").trim().to_owned(), 512);
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
}
