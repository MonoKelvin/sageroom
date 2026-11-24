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

FEATURE_VERSION = 1
FEATURE_COUNT = 10
MAX_LINE_BYTES = 16_384
MAX_ROWS = 2_000_000
SPLIT_LIMITS = {"train": 1024 * 1024 * 1024, "dev": 128 * 1024 * 1024, "test": 128 * 1024 * 1024}
CLAUSE_PATTERN = re.compile(r"[。！？!?，,；;\n]")
PRIVATE_PATTERN = re.compile(
    r"https?://|www\.|_url_|[\w.+%-]+@[\w.-]+\.[a-z]{2,}|\d{7,}|(?:\+?86)?1[3-9]\d{9}|微信|群号|加我|vx[:：]|qq[:：]",
    re.IGNORECASE,
)
UNSUITABLE_PATTERN = re.compile(
    r"代购|刷单|兼职|贷款|博彩|赌博|裸聊|陪睡|约炮|做爱|色情|傻逼|傻b|操你|草泥马|日你|我操|妈的|机器人|人工智能|小黄鸡|菲菲|chatterbot|(?:\bAI\s*助手\b)",
    re.IGNORECASE,
)
FILLERS = ("诶", "啊啊", "呀", "啦", "嘛", "哈哈")
EVALUATIONS = ("有画面感", "这个比喻", "这个形容", "你这配置", "岁月静好", "体验感拉满", "属实是", "属于那种", "选手")
EMPATHY = ("听起来", "我理解你的", "我能理解", "感受到你的", "很重要", "很有意义", "太好了", "照顾好自己")
METAPHORS = ("仿佛", "宛如", "犹如", "就像", "简直是", "不只是", "更像是")


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
    ]


def clean_response(text):
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


def response_from_line(raw):
    try:
        fields = raw.decode("utf-8").rstrip("\r\n").split("\t")
    except UnicodeDecodeError:
        return None, False
    if len(fields) < 3 or fields[0] != "1":
        return None, False
    return clean_response(fields[-1]), True


def fingerprint(text):
    return hashlib.blake2b(text.encode("utf-8"), digest_size=16).digest()


class Corpus:
    def __init__(self, path):
        self.path = Path(path)
        self.archive = None
        self.files = {}

    def __enter__(self):
        if self.path.is_file():
            self.archive = zipfile.ZipFile(self.path)
            entries = self.archive.infolist()
            if len(entries) > 10_000:
                raise ValueError("压缩包条目过多。")
            for split, limit in SPLIT_LIMITS.items():
                matches = [entry for entry in entries if PurePosixPath(entry.filename).name == f"{split}.txt" and PurePosixPath(entry.filename).parent.name == "douban-multiturn-100w"]
                if len(matches) != 1:
                    raise ValueError(f"未找到唯一的豆瓣 {split} 分割。")
                entry = matches[0]
                if entry.file_size > limit or entry.flag_bits & 1 or entry.file_size / max(1, entry.compress_size) > 300:
                    raise ValueError("语料条目过大、压缩比例异常或已加密。")
                self.files[split] = entry
        elif self.path.is_dir():
            root = self.path.resolve()
            for split, limit in SPLIT_LIMITS.items():
                candidates = [root / f"{split}.txt", root / "douban-multiturn-100w" / f"{split}.txt", root / "raw_chat_corpus" / "douban-multiturn-100w" / f"{split}.txt"]
                matches = [path for path in candidates if path.is_file()]
                if len(matches) != 1 or not matches[0].resolve().is_relative_to(root):
                    raise ValueError(f"未找到唯一的本地豆瓣 {split} 分割。")
                if matches[0].stat().st_size > limit:
                    raise ValueError("语料文件超过本地读取上限。")
                self.files[split] = matches[0]
        else:
            raise ValueError("语料路径不是压缩包或目录。")
        return self

    def __exit__(self, *_):
        if self.archive:
            self.archive.close()

    def open(self, split):
        return self.archive.open(self.files[split]) if self.archive else self.files[split].open("rb")


def sample_split(corpus, split, size, seed, excluded):
    rng = random.Random(seed)
    sampled = []
    seen = set()
    digest = hashlib.sha256()
    stats = {"rows": 0, "positive_rows": 0, "filtered_rows": 0, "duplicate_rows": 0, "accepted_unique": 0, "bytes_read": 0}
    with corpus.open(split) as stream:
        while True:
            raw = stream.readline(MAX_LINE_BYTES + 1)
            if not raw:
                break
            digest.update(raw)
            stats["bytes_read"] += len(raw)
            oversized = len(raw) > MAX_LINE_BYTES
            if oversized:
                while raw and not raw.endswith(b"\n"):
                    raw = stream.readline(MAX_LINE_BYTES + 1)
                    digest.update(raw)
                    stats["bytes_read"] += len(raw)
                    if stats["bytes_read"] > SPLIT_LIMITS[split]:
                        raise ValueError("语料读取字节数超过上限。")
            stats["rows"] += 1
            if stats["rows"] > MAX_ROWS or stats["bytes_read"] > SPLIT_LIMITS[split]:
                raise ValueError("语料读取量超过上限。")
            if oversized:
                stats["filtered_rows"] += 1
                continue
            response, positive = response_from_line(raw)
            stats["positive_rows"] += int(positive)
            if response is None:
                stats["filtered_rows"] += int(positive)
                continue
            key = fingerprint(response)
            if key in seen or key in excluded:
                stats["duplicate_rows"] += 1
                continue
            seen.add(key)
            stats["accepted_unique"] += 1
            if len(sampled) < size:
                sampled.append(response)
            else:
                index = rng.randrange(stats["accepted_unique"])
                if index < size:
                    sampled[index] = response
    stats["sha256"] = digest.hexdigest()
    stats["sampled"] = len(sampled)
    return sampled, seen, stats


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
    ]
    return variants[rng.randrange(len(variants))]


def quantile(values, fraction):
    ordered = sorted(values)
    return ordered[math.ceil((len(ordered) - 1) * fraction)]


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
        "length_chars": {"median": quantile([len(text) for text in natural], 0.5), "p75": quantile([len(text) for text in natural], 0.75), "p90": quantile([len(text) for text in natural], 0.9)},
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
        return {
            "ai_messages": len(items),
            "mean_characters": statistics.fmean(lengths) if lengths else 0,
            "over_40_characters": sum(length > 40 for length in lengths),
            "over_48_characters": sum(length > 48 for length in lengths),
            "style_flagged": sum(score(model, text) >= model["threshold"] for text in items),
            "filler_occurrences": sum(features(text)[3] for text in items),
            "evaluation_occurrences": sum(features(text)[5] for text in items),
            "empathy_occurrences": sum(features(text)[6] for text in items),
            "metaphor_occurrences": sum(features(text)[7] for text in items),
        }
    return {"visible_ai_only": summary(texts), "latest_12_ai_only": summary(texts[-12:])}


def train(corpus_path, output, samples=20_000, seed=42, evaluate_db=None):
    if not 100 <= samples <= 20_000:
        raise ValueError("训练正例数量必须在 100～20000 之间。")
    with Corpus(corpus_path) as corpus:
        training, train_seen, train_stats = sample_split(corpus, "train", samples, seed, set())
        dev, dev_seen, dev_stats = sample_split(corpus, "dev", 2000, seed + 1, train_seen)
        test, _, test_stats = sample_split(corpus, "test", 2000, seed + 2, train_seen | dev_seen)
    model, metrics = fit_model(training, dev, test, seed)
    report = {
        "sources": {"train": train_stats, "dev": dev_stats, "test": test_stats},
        "seed": seed,
        "metrics": metrics,
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
    args = parser.parse_args(argv)
    try:
        model, report = train(args.corpus, args.output, args.samples, args.seed, args.evaluate_db)
    except (OSError, ValueError, zipfile.BadZipFile, sqlite3.DatabaseError) as error:
        parser.exit(1, f"本地风格训练未完成（{type(error).__name__}）；请检查语料格式、权限与输出目录。\n")
    print(json.dumps({"training_samples": model["training_samples"], "length_chars": model["length_chars"], "metrics": report["metrics"], "local_database_evaluation": report.get("local_database_evaluation")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
