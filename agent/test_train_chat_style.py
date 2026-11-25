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

FILES = {
    "raw_chat_corpus/douban-multiturn-100w/train.txt": "",
    "raw_chat_corpus/douban-multiturn-100w/dev.txt": "",
    "raw_chat_corpus/douban-multiturn-100w/test.txt": "",
    "raw_chat_corpus/tieba-305w/tieba.dialogues": "",
    "raw_chat_corpus/weibo-400w/stc_weibo_train_response": "",
    "raw_chat_corpus/ptt-42w/Gossiping-QA-Dataset.txt": "",
    "raw_chat_corpus/qingyun-11w/青云库.csv": "",
}


def douban_row(answer):
    return f"1\t第一轮\t这是一条完整的上下文\t{answer}\n"


def archive(path, contents):
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as output:
        for name, content in {**FILES, **contents}.items():
            output.writestr(name, content)


class ChatStyleTests(unittest.TestCase):
    def test_features_have_the_shared_order_and_nonoverlapping_counts(self):
        text = "诶啊啊，哈哈哈哈…～\n你这配置有画面感。听起来很重要，就像故事！"
        expected = [math.log1p(len(text)), 5.0, math.log1p(8), 4.0, 2.0, 2.0, 2.0, 1.0, 2.0, 2.0, 2.0, 4.0]
        self.assertEqual(trainer.features(text), expected)
        self.assertEqual(trainer.features("")[1], 0)
        self.assertEqual(trainer.features("...~~～…")[4], 5)

    def test_parsers_cover_douban_tieba_ptt_qingyun_and_weibo(self):
        self.assertEqual(trainer.parse_douban("1\t上下文\t晚饭 吃了 面条\n".encode()), "晚饭 吃了 面条")
        self.assertIsNone(trainer.parse_douban("0\t上下文\t负例不入库\n".encode()))
        self.assertEqual(trainer.parse_tab_answer("问题\t答 案\n".encode()), "答 案")
        self.assertEqual(trainer.parse_pipe_answer("问 | 答 案\r\n".encode()), "答 案")
        self.assertEqual(trainer.parse_plain("微博 回 复\n".encode()), "微博 回 复")
        self.assertIsNone(trainer.parse_pipe_answer(b"only one field\n"))

    def test_filter_removes_private_unsafe_robot_and_ad_text(self):
        for text in (
            "今天看看https://example.invalid/news", "联系我hello@example.invalid", "微信加我就能知道", "我的号码13800138000",
            "号码1 3 8 0 0 1 3 8 0 0 0", "我是一个机器人助手", "菲菲可以陪睡聊天", "这个傻逼别来聊天", "兼职刷单马上到账",
            "点击下载这个软件", "扫码加群领福利", "无法理解您的话，请发送 help", "去", "English conversation only", "甲" * 81,
        ):
            self.assertIsNone(trainer.clean_response(text), text)
        self.assertEqual(trainer.clean_response("我 还 没 吃饭 ，等会 去。"), "我还没吃饭，等会去。")
        self.assertEqual(trainer.clean_response("今晚看电影。"), "今晚看电影。")

    def test_social_noise_is_stripped_before_validation(self):
        self.assertEqual(trainer.clean_response("@小明 今晚 一起 吃饭 吧"), "今晚一起吃饭吧")
        self.assertEqual(trainer.clean_response("#加班日常# 今天 又 到 十点"), "今天又到十点")
        self.assertIsNone(trainer.clean_response("@某人"))

    def test_corpus_resolves_each_source_from_zip_and_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "fixture.zip"
            archive(path, {})
            with trainer.Corpus(path) as corpus:
                for source in trainer.SOURCES:
                    streams = corpus.streams(source)
                    self.assertEqual(len(streams), 3 if source.split_by_file else 1, source.name)
                    for _, stream in streams:
                        stream.close()
            for name in FILES:
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("", encoding="utf-8")
            with trainer.Corpus(root) as corpus:
                streams = corpus.streams(trainer.SOURCES[1])
                self.assertEqual(len(streams), 1)
                for _, stream in streams:
                    stream.close()

    def test_missing_sources_are_marked_without_failing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "fixture.zip"
            with zipfile.ZipFile(path, "w") as output:
                output.writestr("raw_chat_corpus/douban-multiturn-100w/train.txt", douban_row("今晚 去 散步"))
            with trainer.Corpus(path) as corpus:
                reservoirs, _, stats = trainer.sample_source(corpus, trainer.SOURCES[1], {"train": 10, "dev": 2, "test": 2}, 42, set())
            self.assertTrue(stats["missing"])
            self.assertEqual(reservoirs["train"], [])

    def test_sampling_is_reproducible_deduplicated_and_split_by_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "fixture.zip"
            rows = "".join(f"问题{number}\t我准备第{number}次去图书馆\n" for number in range(400))
            rows += "重复\t我准备第0次去图书馆\n"
            archive(path, {"raw_chat_corpus/tieba-305w/tieba.dialogues": rows})
            budgets = {"train": 40, "dev": 5, "test": 5}
            with trainer.Corpus(path) as corpus:
                first, _, stats = trainer.sample_source(corpus, trainer.SOURCES[1], budgets, 42, set())
            with trainer.Corpus(path) as corpus:
                second, _, _ = trainer.sample_source(corpus, trainer.SOURCES[1], budgets, 42, set())
            self.assertEqual(first, second)
            self.assertEqual(stats["accepted_unique"], 400)
            self.assertEqual(stats["duplicate_rows"], 1)
            self.assertEqual(len(first["train"]), 40)
            merged = first["train"] + first["dev"] + first["test"]
            self.assertEqual(len(merged), len(set(merged)))
            self.assertTrue(all(text.startswith("我准备第") for text in merged))

    def test_douban_split_files_keep_their_original_split(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "fixture.zip"
            archive(path, {
                "raw_chat_corpus/douban-multiturn-100w/train.txt": douban_row("明天 一起 吃饭 吧"),
                "raw_chat_corpus/douban-multiturn-100w/dev.txt": douban_row("今天 图书馆 人不多"),
                "raw_chat_corpus/douban-multiturn-100w/test.txt": douban_row("晚上 再去 散步 好了"),
            })
            with trainer.Corpus(path) as corpus:
                reservoirs, _, _ = trainer.sample_source(corpus, trainer.SOURCES[0], {"train": 10, "dev": 10, "test": 10}, 42, set())
            self.assertIn("明天一起吃饭吧", reservoirs["train"])
            self.assertIn("今天图书馆人不多", reservoirs["dev"])
            self.assertIn("晚上再去散步好了", reservoirs["test"])

    def test_style_profile_reports_numeric_language_shape(self):
        profile = trainer.style_profile(["嗯嗯", "今晚一起吃饭吧", "我还没想好，等会再说。"])
        self.assertEqual(profile["samples"], 3)
        self.assertLessEqual(profile["length_p50"], profile["length_p75"])
        self.assertLessEqual(profile["length_p75"], profile["length_p90"])
        self.assertGreater(profile["share_within_20"], 0)
        self.assertEqual(profile["newline_share"], 0)
        self.assertTrue(all(isinstance(value, (int, float)) for value in profile.values()))

    def test_training_exports_only_numeric_parameters_and_reproducible_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "fixture.zip"
            archive(path, {
                "raw_chat_corpus/douban-multiturn-100w/train.txt": "".join(douban_row(f"第{number}次下班后去买点蔬菜。") for number in range(200)),
                "raw_chat_corpus/douban-multiturn-100w/dev.txt": "".join(douban_row(f"我准备第{number}次去图书馆。") for number in range(60)),
                "raw_chat_corpus/douban-multiturn-100w/test.txt": "".join(douban_row(f"周末第{number}次和朋友一起散步。") for number in range(60)),
            })
            first, first_report = trainer.train(path, root / "first" / "model.json", samples=120, seed=42, enabled_sources={"douban"})
            second, second_report = trainer.train(path, root / "second" / "model.json", samples=120, seed=42, enabled_sources={"douban"})
            self.assertEqual(first, second)
            self.assertEqual(first_report, second_report)
            self.assertIn("style_profile", second_report)
            self.assertEqual(set(second["length_chars"]), {"median", "p75", "p90"})
            self.assertEqual(len(second["weights"]), 12)
            serialized = json.dumps(second, ensure_ascii=False)
            for private in ("第1次下班", "raw_chat_corpus", "chat_corpus_zh", "douban", "我准备"):
                self.assertNotIn(private, serialized)
            contents = (root / "first" / "model.json").read_text(encoding="utf-8")
            def numeric_values(value):
                if isinstance(value, dict):
                    return all(numeric_values(item) for item in value.values())
                if isinstance(value, list):
                    return all(numeric_values(item) for item in value)
                return isinstance(value, (int, float)) and not isinstance(value, bool)
            self.assertTrue(numeric_values(json.loads(contents)))
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
            model = {"means": [0.0] * 12, "scales": [1.0] * 12, "weights": [0.0] * 12, "bias": 0.0, "threshold": 0.6}
            result = trainer.evaluate_database(model, path)
            self.assertEqual(result["visible_ai_only"]["ai_messages"], 1)
            self.assertEqual(result["latest_12_ai_only"]["mean_characters"], len("我还没吃，等会去。"))
            self.assertIn("over_30_characters", result["visible_ai_only"])
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
