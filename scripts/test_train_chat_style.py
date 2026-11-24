import importlib.util
import json
import math
from pathlib import Path
import sqlite3
import tempfile
import unittest
import zipfile

SPEC = importlib.util.spec_from_file_location("train_chat_style", Path(__file__).with_name("train_chat_style.py"))
trainer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(trainer)


def row(label, answer, context="这是一条完整的上下文"):
    return f"{label}\t第一轮\t{context}\t{answer}\n"


def archive(path, splits):
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as output:
        for split in ("train", "dev", "test"):
            output.writestr(f"raw_chat_corpus/douban-multiturn-100w/{split}.txt", splits.get(split, ""))


class ChatStyleTests(unittest.TestCase):
    def test_features_have_the_shared_order_and_nonoverlapping_counts(self):
        text = "诶啊啊，哈哈哈哈…～\n你这配置有画面感。听起来很重要，就像故事！"
        expected = [math.log1p(len(text)), 5.0, math.log1p(8), 4.0, 2.0, 2.0, 2.0, 1.0, 2.0, 2.0]
        self.assertEqual(trainer.features(text), expected)
        self.assertEqual(trainer.features("")[1], 0)
        self.assertEqual(trainer.features("...~~～…")[4], 5)

    def test_only_positive_rows_use_the_final_response_column(self):
        self.assertEqual(trainer.response_from_line(row("1", "晚饭 吃了 面条").encode()), ("晚饭吃了面条", True))
        self.assertEqual(trainer.response_from_line(row("0", "负例 不能 入库").encode()), (None, False))
        self.assertEqual(trainer.response_from_line(b"1\ttoo-short\n"), (None, False))
        self.assertEqual(trainer.response_from_line(b"1\tcontext\t\xff\n"), (None, False))

    def test_filter_removes_private_unsafe_and_robot_text(self):
        for text in (
            "今天看看https://example.invalid/news", "联系我hello@example.invalid", "微信加我就能知道", "我的号码13800138000",
            "号码1 3 8 0 0 1 3 8 0 0 0", "我是一个机器人助手", "菲菲可以陪睡聊天", "这个傻逼别来聊天", "兼职刷单马上到账",
            "去", "English conversation only", "甲" * 81,
        ):
            self.assertIsNone(trainer.clean_response(text), text)
        self.assertEqual(trainer.clean_response("我 还 没 吃饭 ，等会 去。"), "我还没吃饭，等会去。")
        self.assertEqual(trainer.clean_response("今晚看电影。"), "今晚看电影。")

    def test_streaming_sampling_keeps_splits_separate_and_deduplicated(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.zip"
            archive(path, {
                "train": row("1", "明天 一起 吃饭 吧") * 2 + row("0", "这 条 不应 采用") + row("1", "下班 再去 买点 菜"),
                "dev": row("1", "明天 一起 吃饭 吧") + row("1", "今天 图书馆 人不多"),
                "test": row("1", "今天 图书馆 人不多") + row("1", "晚上 再去 散步 好了"),
            })
            with trainer.Corpus(path) as corpus:
                train, train_seen, train_stats = trainer.sample_split(corpus, "train", 100, 42, set())
                dev, dev_seen, _ = trainer.sample_split(corpus, "dev", 100, 43, train_seen)
                test, _, _ = trainer.sample_split(corpus, "test", 100, 44, train_seen | dev_seen)
            self.assertEqual(train, ["明天一起吃饭吧", "下班再去买点菜"])
            self.assertEqual(dev, ["今天图书馆人不多"])
            self.assertEqual(test, ["晚上再去散步好了"])
            self.assertEqual(train_stats["positive_rows"], 3)
            self.assertEqual(train_stats["duplicate_rows"], 1)
            self.assertEqual(len(train_stats["sha256"]), 64)

    def test_bounded_reservoir_is_reproducible_and_not_just_the_prefix(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.zip"
            archive(path, {"train": "".join(row("1", f"我准备第{number}次去图书馆。") for number in range(300))})
            with trainer.Corpus(path) as corpus:
                first, _, stats = trainer.sample_split(corpus, "train", 10, 42, set())
                again, _, _ = trainer.sample_split(corpus, "train", 10, 42, set())
            self.assertEqual(first, again)
            self.assertEqual(len(first), 10)
            self.assertEqual(stats["accepted_unique"], 300)
            self.assertTrue(any(int(text.split("第")[1].split("次")[0]) > 10 for text in first))

    def test_directory_input_and_oversized_rows_are_safe(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for split in ("train", "dev", "test"):
                (root / f"{split}.txt").write_bytes(("1\t" + "很" * 9000 + "\t很长的上下文\n").encode() + row("1", "我们晚饭后再去。 ").encode())
            with trainer.Corpus(root) as corpus:
                samples, _, stats = trainer.sample_split(corpus, "train", 10, 42, set())
            self.assertEqual(samples, ["我们晚饭后再去。"])
            self.assertEqual(stats["rows"], 2)
            self.assertEqual(stats["filtered_rows"], 1)

    def test_archive_never_extracts_paths_and_rejects_ambiguous_entries(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "fixture.zip"
            archive(path, {"train": row("1", "今天去买点蔬菜吧。")})
            with zipfile.ZipFile(path, "a") as output:
                output.writestr("../../outside.py", "raise RuntimeError('不能执行')")
            with trainer.Corpus(path) as corpus:
                samples, _, _ = trainer.sample_split(corpus, "train", 10, 42, set())
            self.assertEqual(samples, ["今天去买点蔬菜吧。"])
            self.assertFalse((root / "outside.py").exists())
            with zipfile.ZipFile(path, "a") as output:
                output.writestr("other/douban-multiturn-100w/train.txt", row("1", "不采用重复来源。"))
            with self.assertRaises(ValueError):
                with trainer.Corpus(path):
                    pass

    def test_training_exports_only_numeric_parameters_and_reproducible_metrics(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "fixture.zip"
            archive(path, {
                "train": "".join(row("1", f"第{number}次下班后去买点蔬菜。") for number in range(180)),
                "dev": "".join(row("1", f"我准备第{number}次去图书馆。") for number in range(40)),
                "test": "".join(row("1", f"周末第{number}次和朋友一起散步。") for number in range(40)),
            })
            first, first_report = trainer.train(path, root / "first" / "model.json", samples=120, seed=42)
            second, second_report = trainer.train(path, root / "second" / "model.json", samples=120, seed=42)
            self.assertEqual(first, second)
            self.assertEqual(first_report, second_report)
            self.assertEqual(first["training_samples"], 120)
            self.assertEqual(first["feature_version"], 1)
            for field in ("means", "scales", "weights"):
                self.assertEqual(len(first[field]), 10)
                self.assertTrue(all(math.isfinite(number) for number in first[field]))
            self.assertGreaterEqual(first["threshold"], 0.6)
            self.assertLess(first["threshold"], 1)
            contents = (root / "first" / "model.json").read_text(encoding="utf-8")
            self.assertNotIn("下班后", contents)
            self.assertNotIn("图书馆", contents)
            self.assertNotIn(str(root), contents)
            loaded = json.loads(contents)
            def numeric_values(value):
                if isinstance(value, dict):
                    return all(numeric_values(item) for item in value.values())
                if isinstance(value, list):
                    return all(numeric_values(item) for item in value)
                return isinstance(value, (int, float)) and not isinstance(value, bool)
            self.assertTrue(numeric_values(loaded))
            self.assertTrue((root / "first" / "report.json").exists())
            self.assertEqual(list((root / "first").glob(".chat-style-*")), [])
            self.assertGreater(trainer.score(first, "这个形容真有画面感，你这配置就是岁月静好。"), trainer.score(first, "我还没吃，等会去。"))

    def test_optional_database_evaluation_is_readonly_and_excludes_user_text(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.sqlite3"
            connection = sqlite3.connect(path)
            try:
                connection.executescript("CREATE TABLE participants(id TEXT,kind TEXT); CREATE TABLE messages(id TEXT,seq INTEGER,sender_id TEXT,state TEXT); CREATE TABLE message_parts(message_id TEXT,ordinal INTEGER,text TEXT);")
                connection.executemany("INSERT INTO participants VALUES (?,?)", [("human", "user"), ("bot", "agent")])
                connection.executemany("INSERT INTO messages VALUES (?,?,?,?)", [("u", 1, "human", "visible"), ("a", 2, "bot", "visible"), ("hidden", 3, "bot", "recalled")])
                connection.executemany("INSERT INTO message_parts VALUES (?,?,?)", [("u", 0, "用户私有文本不可进入报告" * 100), ("a", 0, "我还没吃，等会去。"), ("hidden", 0, "撤回正文不应统计")])
                connection.commit()
            finally:
                connection.close()
            original = path.read_bytes()
            model = {"means": [0.0] * 10, "scales": [1.0] * 10, "weights": [0.0] * 10, "bias": 0.0, "threshold": 0.6}
            result = trainer.evaluate_database(model, path)
            self.assertEqual(result["visible_ai_only"]["ai_messages"], 1)
            self.assertEqual(result["latest_12_ai_only"]["mean_characters"], len("我还没吃，等会去。"))
            self.assertNotIn("用户私有", json.dumps(result, ensure_ascii=False))
            self.assertNotIn("我还没吃", json.dumps(result, ensure_ascii=False))
            self.assertEqual(path.read_bytes(), original)

    def test_insufficient_training_data_cannot_generate_a_model(self):
        with self.assertRaises(ValueError):
            trainer.fit_model(["今天吃点面条。"] * 99, ["明天出门走走。"], ["周末去图书馆。"], 42)
        with self.assertRaises(ValueError):
            trainer.train("missing", "not-created.json", samples=20_001)


if __name__ == "__main__":
    unittest.main()
