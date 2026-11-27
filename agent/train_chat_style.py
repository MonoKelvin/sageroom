"""本地中文闲聊风格校准训练器。

从外部公开汇总的多来源人聊语料中流式抽样人类回复，训练一个只输出数值参数的
轻量判别器，并产出长度/句式统计画像，供 Rust 运行时设置输出预算。

不联网、不导出语料原文；产物只含数值参数。语料来源与许可见 agent/README.md。
"""

import argparse
import hashlib
from itertools import cycle, groupby
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

FEATURE_VERSION = 3
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
COMMENTARY = (
    "有画面感", "画面感来了", "这个比喻", "这个形容", "你这配置", "体验感拉满",
    "说得太对了", "氛围组到位", "烟火气拉满", "含金量拉满", "仪式感拉满", "格局打开",
)
HOLLOW_EXACT = (
    "哈哈", "哈哈哈", "哈哈哈哈", "确实", "对啊", "对对", "真的假的", "是吗", "然后呢", "我超好奇",
    "不是吧", "啊这", "算我一个", "我也来", "给我留一罐", "说得对", "正好走起", "我跟着走就行", "在",
    "在吗", "在干嘛", "聊点什么", "好有意思", "太浪漫了", "这搭配我懂",
)


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
        float("".join(char for char in text if char.isalnum()) in HOLLOW_EXACT),
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


# 每对是自编的（具体回复，模板候选），尽量用相近长度、标点和口语程度。
# 按主题和句式变体组手工分割，整组留在一个 split；不是从真实会话采样。
HANDWRITTEN_PAIRS = {
    "train": {
        "hollow": (
            ("刚到。", "哈 哈！"),
            ("几点？", "是吗？"),
            ("开门。", "对对。"),
            ("摔了……", "啊这……"),
            ("我值班", "我也来"),
            ("还卖吗？", "在吗？"),
            ("换三号线", "聊点什么"),
            ("去街口吗？", "聊点什么吧？"),
            ("往左转就是。", "说点什么呗。"),
            ("我坐在后排", "在"),
        ),
        "commentary": (
            ("灯照到对面了。", "真有画面感。"),
            ("这个纸袋会漏。", "这个形容绝了。"),
            ("骑车过桥更快。", "体验感拉满了。"),
            ("没错，是左脚。", "没错，说得太对了。"),
            ("钥匙放门口。", "这下格局打开了。"),
            ("风吹着耳朵疼，帽子借我戴会。", "风吹得耳朵疼，体验感拉满了。"),
            ("门口有点堵，先把车停在路边吧。", "堵在门口，这个形容很有画面感。"),
            ("打到一半没电了，我把手柄插上再试试。", "手柄没电还接着打，属实是格局打开。"),
        ),
        "echo": (
            ("我也想试，我去拿球。", "我也想试，我也想试。"),
            ("等晚上，我把灯修了。", "等晚上，晚上再说晚上。"),
            ("行行行，明早八点来。", "行行行，就这么行行行。"),
            ("下雨了，衣服还没收。", "下雨了，又是下雨了。"),
            ("饼干碎了，倒进酸奶吧。", "饼干、饼干，我也等饼干。"),
            ("那就去吧，门卡在我这。", "那就去吧，那就去吧。"),
            ("哈哈，蒸笼忘了盖呀。", "哈哈啊啊，就是这样呀～"),
        ),
        "long_template": (
            ("这条路下过雨有点滑，我去车棚拿伞，你在门口等我。", "听起来你有自己的想法，我能理解，这件事很重要。"),
            ("我把锅挪到小灶上了，左边那个火点不着，得找人修。", "这不只是普通的一天，更像是生活给我们留的小小仪式。"),
            ("我妈上回蒸包子也这样，掀盖太早，面一碰到冷风就塌了。", "首先这件事不必纠结，其次保持平常心，总的来说做好自己就行。"),
            ("红色那根线掉到柜子后面了，我找根筷子勾一下，你帮我照着点。", "要我说，这种感觉就像生活中的一道光，仿佛一切都静静地变好了。"),
        ),
    },
    "dev": {
        "hollow": (
            ("对门。", "确实。"),
            ("哪一站？", "然后呢？"),
            ("在值夜班。", "在干嘛"),
            ("棋盘拿来了！", "好有意思！"),
            ("你有几张票？", "你接着聊呗。"),
        ),
        "commentary": (
            ("你这柜门卡住了。", "你这配置真行。"),
            ("把顶灯关一下。", "氛围组到位。"),
            ("这批木料终于晒干了。", "这回含金量拉满。"),
        ),
        "echo": (
            ("有空再聊，我得关窗。", "有空再聊，有空再聊。"),
            ("两张票，一张递给我弟。", "两张票，对，就是两张票。"),
            ("等一等，红灯还亮着呢。", "等一等嘛，还得等一等。"),
        ),
    },
    # 独立短候选：也保留词表没覆盖的追问、点评和复读，检验形态特征的局限。
    "short_challenge": {
        "hollow": (
            ("还有插座吗？", "真的假的？"),
            ("我去称一下。", "我超好奇。"),
            ("漏水了！", "不是吧！"),
            ("我拿一个。", "算我一个。"),
            ("我把罐子洗了。", "给我留一罐。"),
            ("先去买张票。", "正好走起。"),
            ("我从南边过来。", "我跟着走就行。"),
            ("方格那件借我下。", "这搭配我懂。"),
            ("今天带什么菜？", "今天都聊啥？"),
            ("把窗帘拉开嘛。", "接着往下说嘛。"),
        ),
        "commentary": (
            ("沙子进鞋了。", "画面感来了。"),
            ("床单又掉了。", "这个比喻绝了。"),
            ("鱼都煎糊了，快开窗。", "锅一开，烟火气拉满。"),
            ("纸杯压扁了，换个新的。", "纸杯摆上，仪式感拉满。"),
            ("门把手松了，我给你拧拧。", "门把手这事，说得很到位。"),
        ),
        "echo": (
            ("我来看看，螺丝松了吗？", "我来看看，我来看看。"),
            ("赶早班车，六点得出门。", "赶早班车，还是赶早班车。"),
            ("四楼到了，把那箱书拿上。", "四楼，四楼，咱就是说四楼。"),
            ("豆浆我喝热的，别加糖。", "豆浆啊，我也是说豆浆啊。"),
            ("这锅先关火，闷两分钟再开盖。", "关火闷两分钟，对，闷两分钟。"),
        ),
    },
}


def standardize(vector, means, scales):
    return [max(-8.0, min(8.0, (value - mean) / scale)) for value, mean, scale in zip(vector, means, scales)]


def sigmoid(value):
    return 1.0 / (1.0 + math.exp(-max(-60.0, min(60.0, value))))


def score(model, text):
    vector = standardize(features(text), model["means"], model["scales"])
    return sigmoid(model["bias"] + sum(weight * value for weight, value in zip(model["weights"], vector)))


def evaluation(model, positives, negatives=()):
    def flagged_rate(texts):
        return sum(score(model, text) >= model["threshold"] for text in texts) / len(texts)

    result = {
        "natural_samples": len(positives),
        "natural_false_positive_rate": flagged_rate(positives),
    }
    if negatives:
        result.update(synthetic_samples=len(negatives), synthetic_detection_rate=flagged_rate(negatives))
    return result


def paired_evaluation(model, groups):
    positives, negatives = zip(*(pair for pairs in groups.values() for pair in pairs))
    result = evaluation(model, positives, negatives)
    result["by_group"] = {group: evaluation(model, *zip(*pairs)) for group, pairs in groups.items()}
    return result


def calibrate_threshold(*dev_score_groups):
    # 公开语料和手写 dev 正例分别以不超过 2% 的误报为目标，不让大组掩盖小组。
    # score >= threshold 才算命中；边界同分时整体放过，另留微小浮点余量给 Rust。
    boundaries = [sorted(scores)[len(scores) - len(scores) // 50 - 1] for scores in dev_score_groups]
    return min(0.999999, max(0.6, max(boundaries) + 1e-9))


def fit_model(train, dev, test, seed):
    if len(train) < 100 or not dev or not test:
        raise ValueError("需要至少 100 条独立训练正例及非空的独立 dev/test 分割。")
    rng = random.Random(seed)
    natural = [natural_variant(text, rng) for text in train]
    rows = [(features(text), 0.0) for text in natural]
    # 开放语料规模较大，按其样本量重采样配对组，避免短负例和对照句被淹没。
    pairs = [(features(positive), features(negative))
             for group in HANDWRITTEN_PAIRS["train"].values() for positive, negative in group]
    rng.shuffle(pairs)
    for _, (positive, negative) in zip(natural, cycle(pairs)):
        rows.extend(((positive, 0.0), (negative, 1.0)))
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
    test_rng = random.Random(seed + 2)
    dev_natural = [natural_variant(text, dev_rng) for text in dev]
    test_natural = [natural_variant(text, test_rng) for text in test]
    dev_groups = HANDWRITTEN_PAIRS["dev"]
    model["threshold"] = calibrate_threshold(
        [score(model, text) for text in dev_natural],
        [score(model, text) for pairs in dev_groups.values() for text, _ in pairs],
    )
    return model, {
        "dev": evaluation(model, dev_natural),
        "dev_handwritten": paired_evaluation(model, dev_groups),
        "test": evaluation(model, test_natural),
        "short_challenge": paired_evaluation(model, HANDWRITTEN_PAIRS["short_challenge"]),
    }


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
            "SELECT m.seq, mp.text FROM messages m "
            "JOIN participants p ON p.id=m.sender_id JOIN message_parts mp ON mp.message_id=m.id "
            "WHERE p.kind='agent' AND m.state='visible' AND mp.kind='text' AND mp.text IS NOT NULL "
            "ORDER BY m.seq, mp.ordinal"
        )
        texts = ["".join(part[1] for part in parts) for _, parts in groupby(rows, key=lambda row: row[0])]
    finally:
        connection.close()

    def summary(items):
        lengths = [len(text) for text in items]
        openings = [text[:2] for text in items]
        repeated = sum(openings.count(opening) > 1 for opening in set(openings))
        vectors = [features(text) for text in items]
        return {
            "ai_messages": len(items),
            "mean_characters": statistics.fmean(lengths) if lengths else 0,
            "over_30_characters": sum(length > 30 for length in lengths),
            "over_40_characters": sum(length > 40 for length in lengths),
            "over_48_characters": sum(length > 48 for length in lengths),
            "style_flagged": sum(score(model, text) >= model["threshold"] for text in items),
            "repeated_opening_groups": repeated,
            "filler_occurrences": sum(vector[3] for vector in vectors),
            "evaluation_occurrences": sum(vector[5] for vector in vectors),
            "empathy_occurrences": sum(vector[6] for vector in vectors),
            "metaphor_occurrences": sum(vector[7] for vector in vectors),
            "commentary_template_occurrences": sum(vector[10] for vector in vectors),
            "hollow_messages": sum(vector[11] == 1.0 for vector in vectors),
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
            "阈值优先控制 dev 自然回复误报；short_challenge 是未用于训练或校准的手写短候选（不超过 20 字）。",
            "负例是启发式合成，检出率不是实际 AI 识别准确率；单句形态无法可靠判断接话是否有内容或是否在复读别人。",
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
