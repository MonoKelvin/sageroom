"""本地中文闲聊风格校准训练器。

从外部公开汇总的多来源人聊语料中流式抽样人类回复，训练一个只输出数值参数的
轻量判别器，并产出长度/句式统计画像，供 Rust 运行时设置输出预算。

不联网、不导出语料原文；产物只含数值参数。语料来源与许可见 agent/README.md。
"""

import argparse
import hashlib
import json
import math
import os
import random
import re
import sqlite3
import statistics
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

FEATURE_VERSION = 2
FEATURE_COUNT = 12
MAX_LINE_BYTES = 16_384
# 单来源的读取预算：超过即停止并标记 truncated，保证内存与耗时有上界。
MAX_ROWS_PER_SOURCE = 8_000_000
MAX_BYTES_PER_SOURCE = 400 * 1024 * 1024
MAX_UNIQUE_PER_SOURCE = 500_000
# 文件本身的硬上限，防止误读超大文件或压缩炸弹。
MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024
MAX_ARCHIVE_ENTRIES = 10_000
CLAUSE_PATTERN = re.compile(r"[。！？!?，,；;\n]")
PRIVATE_PATTERN = re.compile(
    r"https?://|www\.|_url_|[\w.+%-]+@[\w.-]+\.[a-z]{2,}|\d{7,}|(?:\+?86)?1[3-9]\d{9}|微信|群号|加我|vx[:：]|qq[:：]",
    re.IGNORECASE,
)
UNSUITABLE_PATTERN = re.compile(
    r"代购|刷单|兼职|贷款|博彩|赌博|裸聊|陪睡|约炮|做爱|色情|傻逼|傻b|操你|草泥马|日你|我操|妈的|机器人|人工智能|小黄鸡|菲菲|chatterbot|(?:\bAI\s*助手\b)"
    r"|点击下载|扫码|加群|推广链接|无法理解您的话|请输入\s*help",
    re.IGNORECASE,
)
SOCIAL_PATTERN = re.compile(r"@[^\s:：]+|#[^#]{1,40}#|//@[^\s]+")
FILLERS = ("诶", "啊啊", "呀", "啦", "嘛", "哈哈")
EVALUATIONS = ("有画面感", "这个比喻", "这个形容", "你这配置", "岁月静好", "体验感拉满", "属实是", "属于那种", "选手")
EMPATHY = ("听起来", "我理解你的", "我能理解", "感受到你的", "很重要", "很有意义", "太好了", "照顾好自己")
METAPHORS = ("仿佛", "宛如", "犹如", "就像", "简直是", "不只是", "更像是")
# 真实库里 29% 的 AI 消息是在评价别人的措辞/比喻，而不是说自己想说的话。
COMMENTARY = ("绝了", "这个比喻", "这个形容", "你这配置", "有画面感", "体验感拉满", "说得对", "确实很", "挺合理", "属实是", "太文艺", "不愧是", "好家伙", "妙啊")
# 无主观的附和/追问：跟着别人情绪走，本身不提供任何信息。
HOLLOW = ("哈哈哈哈", "哈哈哈", "确实", "对啊", "对对", "真的假的", "是吗", "然后呢", "我超", "超好奇", "不是吧", "啊这", "哈哈")


def features(text):
    clauses = [clause for clause in CLAUSE_PATTERN.split(text) if clause.strip()]
    longest_run = 0
    run = 0
    previous = None
    for char in text:
        run = run + 1 if char == previous else 1
        longest_run = max(longest_run, run)
        previous = char
    return [
        math.log1p(len(text)),
        float(len(clauses)),
        math.log1p(max((len(clause) for clause in clauses), default=0)),
        float(sum(text.count(value) for value in FILLERS)),
        float(text.count("…") + text.count("...") + text.count("~") + text.count("～")),
        float(sum(text.count(value) for value in EVALUATIONS)),
        float(sum(text.count(value) for value in EMPATHY)),
        float(sum(text.count(value) for value in METAPHORS)),
        float(max(0, longest_run - 2)),
        float(text.count("\n") + 1),
        float(sum(text.count(value) for value in COMMENTARY)),
        float(sum(text.count(value) for value in HOLLOW)),
    ]


def clean_response(text):
    if SOCIAL_PATTERN.search(text):
        text = SOCIAL_PATTERN.sub("", text)
    text = text.strip()
    if PRIVATE_PATTERN.search(text) or UNSUITABLE_PATTERN.search(text):
        return None
    text = re.sub(r"\s+", "", text)
    if not 4 <= len(text) <= 80:
        return None
    chinese = sum("㐀" <= char <= "鿿" for char in text)
    if chinese / len(text) < 0.6:
        return None
    if PRIVATE_PATTERN.search(text) or UNSUITABLE_PATTERN.search(text):
        return None
    return text


def _decode(raw):
    try:
        return raw.decode("utf-8").rstrip("\r\n")
    except UnicodeDecodeError:
        return None


def parse_douban(raw):
    fields = raw.rstrip(b"\r\n").split(b"\t")
    if len(fields) < 3 or fields[0] != b"1":
        return None
    text = _decode(fields[-1])
    return text


def parse_tab_answer(raw):
    fields = raw.rstrip(b"\r\n").split(b"\t")
    if len(fields) < 2:
        return None
    return _decode(fields[-1])


def parse_pipe_answer(raw):
    text = _decode(raw)
    if text is None:
        return None
    fields = text.split("|")
    if len(fields) < 2:
        return None
    return fields[-1].strip().strip('"')


def parse_plain(raw):
    return _decode(raw)


class Source:
    def __init__(self, name, directory, patterns, weight, parser, split_by_file=False):
        self.name = name
        self.directory = directory
        self.patterns = patterns
        self.weight = weight
        self.parser = parser
        self.split_by_file = split_by_file

    def matches(self, filename):
        for pattern in self.patterns:
            if pattern.startswith("*"):
                if filename.endswith(pattern[1:]):
                    return True
            elif filename == pattern:
                return True
        return False


SOURCES = (
    Source("douban", "douban-multiturn-100w", ("train.txt", "dev.txt", "test.txt"), 45, parse_douban, split_by_file=True),
    Source("tieba", "tieba-305w", ("tieba.dialogues",), 25, parse_tab_answer),
    Source("weibo", "weibo-400w", ("stc_weibo_train_response",), 15, parse_plain),
    Source("ptt", "ptt-42w", ("Gossiping-QA-Dataset.txt",), 8, parse_tab_answer),
    Source("qingyun", "qingyun-11w", ("*.csv",), 7, parse_pipe_answer),
)


def fingerprint(text):
    return hashlib.blake2b(text.encode("utf-8"), digest_size=8).digest()


class Corpus:
    def __init__(self, path):
        self.path = Path(path)
        self.archive = None
        self.root = None
        self.entries = []

    def __enter__(self):
        if self.path.is_file():
            self.archive = zipfile.ZipFile(self.path)
            self.entries = self.archive.infolist()
            if len(self.entries) > MAX_ARCHIVE_ENTRIES:
                self.archive.close()
                raise ValueError("压缩包条目过多。")
        elif self.path.is_dir():
            self.root = self.path.resolve()
        else:
            raise ValueError("语料路径不是压缩包或目录。")
        return self

    def __exit__(self, *_):
        if self.archive:
            self.archive.close()

    def streams(self, source):
        found = []
        if self.archive:
            for entry in self.entries:
                path = PurePosixPath(entry.filename)
                if path.parent.name != source.directory or not source.matches(path.name):
                    continue
                if entry.file_size > MAX_FILE_BYTES or entry.flag_bits & 1:
                    raise ValueError(f"{entry.filename} 过大或已加密。")
                if entry.compress_size and entry.file_size / entry.compress_size > 300:
                    raise ValueError(f"{entry.filename} 压缩比例异常。")
                label = path.stem if source.split_by_file else "all"
                found.append((label, self.archive.open(entry)))
        else:
            base = self.root / "raw_chat_corpus" / source.directory
            for child in sorted(base.iterdir()) if base.is_dir() else []:
                if not child.is_file() or not source.matches(child.name):
                    continue
                if child.stat().st_size > MAX_FILE_BYTES:
                    raise ValueError(f"{child.name} 超过单文件读取上限。")
                label = child.stem if source.split_by_file else "all"
                found.append((label, child.open("rb")))
        return found


def split_for(key, label):
    if label in ("train", "dev", "test"):
        return label
    bucket = int.from_bytes(key[:4], "big") % 100
    return "train" if bucket < 94 else "dev" if bucket < 97 else "test"


def reservoir_add(reservoir, item, accepted, quota, rng):
    if len(reservoir) < quota:
        reservoir.append(item)
    else:
        index = rng.randrange(accepted)
        if index < quota:
            reservoir[index] = item


def sample_source(corpus, source, budgets, seed, seen):
    rng = random.Random(f"{seed}:{source.name}")
    reservoirs = {split: [] for split in budgets}
    accepted = {split: 0 for split in budgets}
    stats = {
        "rows": 0,
        "parsed_rows": 0,
        "filtered_rows": 0,
        "duplicate_rows": 0,
        "accepted_unique": 0,
        "bytes_read": 0,
        "files": [],
        "missing": False,
        "truncated": False,
    }
    streams = corpus.streams(source)
    if not streams:
        stats["missing"] = True
        return reservoirs, seen, stats
    truncated = False
    for label, stream in streams:
        stats["files"].append(label)
        try:
            while True:
                raw = stream.readline(MAX_LINE_BYTES + 1)
                if not raw:
                    break
                stats["bytes_read"] += len(raw)
                oversized = len(raw) > MAX_LINE_BYTES
                if oversized:
                    while raw and not raw.endswith(b"\n"):
                        raw = stream.readline(MAX_LINE_BYTES + 1)
                        stats["bytes_read"] += len(raw)
                stats["rows"] += 1
                if stats["rows"] > MAX_ROWS_PER_SOURCE or stats["bytes_read"] > MAX_BYTES_PER_SOURCE:
                    truncated = True
                    break
                if oversized:
                    stats["filtered_rows"] += 1
                    continue
                parsed = source.parser(raw)
                if parsed is None:
                    continue
                stats["parsed_rows"] += 1
                text = clean_response(parsed)
                if text is None:
                    stats["filtered_rows"] += 1
                    continue
                key = fingerprint(text)
                if key in seen:
                    stats["duplicate_rows"] += 1
                    continue
                seen.add(key)
                stats["accepted_unique"] += 1
                split = split_for(key, label)
                accepted[split] += 1
                reservoir_add(reservoirs[split], text, accepted[split], budgets[split], rng)
                if stats["accepted_unique"] >= MAX_UNIQUE_PER_SOURCE:
                    truncated = True
                    break
        finally:
            stream.close()
        if truncated:
            break
    stats["truncated"] = truncated
    stats["sampled"] = {split: len(items) for split, items in reservoirs.items()}
    return reservoirs, seen, stats


def source_budgets(samples, weight, total_weight):
    total_weight = total_weight or 1
    return {
        split: max(1, total * weight // total_weight)
        for split, total in (("train", samples), ("dev", max(200, samples // 8)), ("test", max(200, samples // 8)))
    }


def quantile(values, fraction):
    ordered = sorted(values)
    return ordered[math.ceil((len(ordered) - 1) * fraction)]


def style_profile(texts):
    lengths = [len(text) for text in texts]
    clauses = [[clause for clause in CLAUSE_PATTERN.split(text) if clause.strip()] for text in texts]
    clause_counts = [len(row) for row in clauses]
    longest_clauses = [max((len(clause) for clause in row), default=0) for row in clauses]
    punctuation = sum(sum(text.count(char) for char in "，。！？!?、；;：:") for text in texts)
    characters = sum(lengths) or 1
    return {
        "samples": len(texts),
        "length_p50": quantile(lengths, 0.5),
        "length_p75": quantile(lengths, 0.75),
        "length_p90": quantile(lengths, 0.90),
        "length_p95": quantile(lengths, 0.95),
        "share_within_20": round(sum(length <= 20 for length in lengths) / len(lengths), 4),
        "share_within_30": round(sum(length <= 30 for length in lengths) / len(lengths), 4),
        "single_clause_share": round(sum(count <= 1 for count in clause_counts) / len(texts), 4),
        "longest_clause_p90": quantile(longest_clauses, 0.90),
        "punctuation_per_100": round(punctuation * 100 / characters, 3),
        "filler_per_100": round(sum(features(text)[3] for text in texts) * 100 / characters, 3),
        "question_share": round(sum("？" in text or "?" in text for text in texts) / len(texts), 4),
        "newline_share": round(sum("\n" in text for text in texts) / len(texts), 4),
    }


def natural_variant(text, rng):
    if text[-1] not in "。！？!?" and rng.random() < 0.5:
        return text + "。"
    return text


def synthetic_negative(text, rng):
    variants = [
        f"{text}说到底，{text}我觉得这件事还是需要认真看待，不能只看表面。",
        f"这个形容真有画面感。{text}你这配置简直是岁月静好，体验感拉满了。",
        f"{text}这不只是一次普通的经历，仿佛生活中的小小仪式，更像是对内心世界的温柔回应。",
        f"听起来你有自己的想法，我能理解。{text}这很重要，也很有意义，记得照顾好自己。",
        f"诶啊啊，{text}哈哈哈哈，真的呀～就是这样啦哈哈。",
        f"属实是属于那种特别有想法的选手。{text}这个比喻让我感受到你的认真和细腻。",
        f"首先，{text}其次，这件事还要从整体上看。总的来说，保持平常心就好，希望对你有帮助。",
        f"{text}不得不说，这种感觉很微妙，像是某种意义上的治愈。愿我们都能被生活温柔以待。",
        f"确实，说得对，你这个形容绝了。{text}真的假的，我超好奇。",
        f"哈哈哈哈，{text}这配置太文艺了，体验感拉满，属实是有点东西。",
    ]
    return variants[rng.randrange(len(variants))]


def standardize(vector, means, scales):
    return [max(-8.0, min(8.0, (value - mean) / scale)) for value, mean, scale in zip(vector, means, scales)]


def sigmoid(value):
    return 1.0 / (1.0 + math.exp(-max(-60.0, min(60.0, value))))


def score(model, text):
    vector = standardize(features(text), model["means"], model["scales"])
    return sigmoid(model["bias"] + sum(weight * value for weight, value in zip(model["weights"], vector)))


def evaluation(model, texts, seed):
    rng = random.Random(seed)
    positives = [natural_variant(text, rng) for text in texts]
    negatives = [synthetic_negative(text, rng) for text in positives]
    return {
        "natural_samples": len(positives),
        "synthetic_samples": len(negatives),
        "natural_false_positive_rate": sum(score(model, text) >= model["threshold"] for text in positives) / len(positives),
        "synthetic_detection_rate": sum(score(model, text) >= model["threshold"] for text in negatives) / len(negatives),
    }


def fit_model(train, dev, test, seed):
    if len(train) < 100 or not dev or not test:
        raise ValueError("需要至少 100 条独立训练正例及非空的独立 dev/test 分割。")
    rng = random.Random(seed)
    natural = [natural_variant(text, rng) for text in train]
    rows = [(features(text), 0.0) for text in natural]
    rows.extend((features(synthetic_negative(text, rng)), 1.0) for text in natural)
    means = [statistics.fmean(row[0][index] for row in rows) for index in range(FEATURE_COUNT)]
    scales = [max(0.01, math.sqrt(statistics.fmean((row[0][index] - means[index]) ** 2 for row in rows))) for index in range(FEATURE_COUNT)]
    normalized = [(standardize(vector, means, scales), label) for vector, label in rows]
    weights = [0.0] * FEATURE_COUNT
    bias = 0.0
    for epoch in range(12):
        rng.shuffle(normalized)
        rate = 0.04 / (1 + epoch * 0.25)
        for vector, label in normalized:
            error = sigmoid(bias + sum(weight * value for weight, value in zip(weights, vector))) - label
            weights = [weight - rate * (error * value + 0.001 * weight) for weight, value in zip(weights, vector)]
            bias -= rate * error
    model = {
        "format_version": 1,
        "feature_version": FEATURE_VERSION,
        "training_samples": len(train),
        "means": means,
        "scales": scales,
        "weights": weights,
        "bias": bias,
        "threshold": 0.6,
        "length_chars": {
            "median": quantile([len(text) for text in natural], 0.5),
            "p75": quantile([len(text) for text in natural], 0.75),
            "p90": quantile([len(text) for text in natural], 0.90),
        },
    }
    dev_rng = random.Random(seed + 1)
    dev_scores = [score(model, natural_variant(text, dev_rng)) for text in dev]
    model["threshold"] = min(0.999999, max(0.6, quantile(dev_scores, 0.98)))
    return model, {"dev": evaluation(model, dev, seed + 1), "test": evaluation(model, test, seed + 2)}


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, prefix=".chat-style-", suffix=".json", delete=False) as stream:
            temporary = Path(stream.name)
            json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        if temporary and temporary.exists():
            temporary.unlink()


def evaluate_database(model, path):
    connection = sqlite3.connect(Path(path).resolve().as_uri() + "?mode=ro", uri=True)
    try:
        connection.execute("PRAGMA query_only=ON")
        connection.execute("PRAGMA trusted_schema=OFF")
        rows = connection.execute(
            "SELECT m.seq, group_concat(mp.text, char(10)) FROM messages m "
            "JOIN participants p ON p.id=m.sender_id JOIN message_parts mp ON mp.message_id=m.id "
            "WHERE p.kind='agent' AND m.state='visible' GROUP BY m.id ORDER BY m.seq"
        ).fetchall()
    finally:
        connection.close()
    texts = [row[1] for row in rows]
    def summary(items):
        lengths = [len(text) for text in items]
        openings = [text[:2] for text in items]
        repeated = sum(openings.count(opening) > 1 for opening in set(openings))
        return {
            "ai_messages": len(items),
            "mean_characters": statistics.fmean(lengths) if lengths else 0,
            "over_30_characters": sum(length > 30 for length in lengths),
            "over_40_characters": sum(length > 40 for length in lengths),
            "over_48_characters": sum(length > 48 for length in lengths),
            "style_flagged": sum(score(model, text) >= model["threshold"] for text in items),
            "repeated_opening_groups": repeated,
            "filler_occurrences": sum(features(text)[3] for text in items),
            "evaluation_occurrences": sum(features(text)[5] for text in items),
            "empathy_occurrences": sum(features(text)[6] for text in items),
            "metaphor_occurrences": sum(features(text)[7] for text in items),
        }
    return {"visible_ai_only": summary(texts), "latest_12_ai_only": summary(texts[-12:])}


def train(corpus_path, output, samples=20_000, seed=42, evaluate_db=None, enabled_sources=None):
    if not 100 <= samples <= 20_000:
        raise ValueError("训练正例数量必须在 100～20000 之间。")
    sources = [source for source in SOURCES if not enabled_sources or source.name in enabled_sources]
    if not sources:
        raise ValueError("没有可用的语料来源。")
    total_weight = sum(source.weight for source in sources)
    seen = set()
    collected = {split: [] for split in ("train", "dev", "test")}
    reports = {}
    with Corpus(corpus_path) as corpus:
        for source in sources:
            budgets = source_budgets(samples, source.weight, total_weight)
            reservoirs, seen, stats = sample_source(corpus, source, budgets, seed, seen)
            reports[source.name] = stats
            for split, items in reservoirs.items():
                collected[split].extend(items)
    if not collected["train"]:
        raise ValueError("语料中没有可用的训练正例。")
    model, metrics = fit_model(collected["train"], collected["dev"], collected["test"], seed)
    profile = style_profile(collected["train"] + collected["dev"] + collected["test"])
    report = {
        "sources": reports,
        "seed": seed,
        "metrics": metrics,
        "style_profile": profile,
        "sampled": {split: len(items) for split, items in collected.items()},
        "limitations": [
            "负例由本地规则合成；检出率不是实际 AI 识别准确率，也不能证明对话已达到真人风格。",
            "语料、个人聊天和训练样本不外发；模型产物只含数值参数，不含例句、词表或源路径。",
            "原始语料授权未完整核实；仅用于用户本地分析，不自动分发语料或训练产物。",
            "长度和风格分数只适用于普通闲聊，不替代相关性、事实与完整语义的人工评估。",
        ],
    }
    if evaluate_db:
        report["local_database_evaluation"] = evaluate_database(model, evaluate_db)
    atomic_json(output, model)
    atomic_json(Path(output).parent / "report.json", report)
    return model, report


def main(argv=None):
    parser = argparse.ArgumentParser(description="本地训练中文闲聊风格判别器，不联网、不导出语料原文。")
    parser.add_argument("--corpus", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--samples", type=int, default=20_000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--evaluate-db", type=Path)
    parser.add_argument("--sources", default="", help="逗号分隔的来源名，默认使用全部可用来源")
    args = parser.parse_args(argv)
    enabled = {name.strip() for name in args.sources.split(",") if name.strip()} or None
    try:
        model, report = train(args.corpus, args.output, args.samples, args.seed, args.evaluate_db, enabled)
    except (OSError, ValueError, zipfile.BadZipFile, sqlite3.DatabaseError) as error:
        parser.exit(1, f"本地风格训练未完成（{type(error).__name__}）；请检查语料格式、权限与输出目录。\n")
    print(json.dumps({
        "training_samples": model["training_samples"],
        "length_chars": model["length_chars"],
        "style_profile": report["style_profile"],
        "metrics": report["metrics"],
        "local_database_evaluation": report.get("local_database_evaluation"),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
