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
        expected = [math.log1p(len(text)), 5.0, math.log1p(8), 4.0, 2.0, 2.0, 2.0, 1.0, 2.0, 2.0, 2.0, 0.0]
        self.assertEqual(trainer.features(text), expected)
        self.assertEqual(trainer.features("")[1], 0)
        self.assertEqual(trainer.features("...~~～…")[4], 5)

    def test_commentary_and_hollow_use_v3_vocabularies(self):
        commentary = (
            "有画面感", "画面感来了", "这个比喻", "这个形容", "你这配置", "体验感拉满", "说得太对了",
            "氛围组到位", "烟火气拉满", "含金量拉满", "仪式感拉满", "格局打开",
        )
        hollow = (
            "哈哈", "哈哈哈", "哈哈哈哈", "确实", "对啊", "对对", "真的假的", "是吗", "然后呢", "我超好奇",
            "不是吧", "啊这", "算我一个", "我也来", "给我留一罐", "说得对", "正好走起", "我跟着走就行", "在",
            "在吗", "在干嘛", "聊点什么", "好有意思", "太浪漫了", "这搭配我懂",
        )
        self.assertEqual(trainer.COMMENTARY, commentary)
        self.assertEqual(trainer.HOLLOW_EXACT, hollow)
        self.assertEqual(trainer.features("；".join(commentary) + "，有画面感。很有画面感。")[10], 14.0)
        for phrase in hollow:
            self.assertEqual(trainer.features("《" + "_ \n".join(phrase) + "？》")[10:], [0.0, 1.0], phrase)
        for text in ("", "。", "啊这2", "确实Ａ", "哈哈哈哈哈", "哈哈，蒸笼盖上了。", "算我一个，六点到。",
                     "绝了，画面感挺强。", "我和他说得对。", "在修水管。", "确实，确实。"):
            self.assertEqual(trainer.features(text)[10:], [0.0, 0.0], text)

    def test_calibration_controls_natural_false_positives_and_handles_ties(self):
        public = [0.2] * 48 + [0.72, 0.9]
        threshold = trainer.calibrate_threshold(public, [0.4])
        self.assertEqual(sum(value >= threshold for value in public), 1)
        tied = [0.81, 0.81]
        self.assertGreater(trainer.calibrate_threshold(public, tied), max(tied))
        self.assertEqual(trainer.calibrate_threshold([0.2], [0.3]), 0.6)

    def test_handwritten_train_dev_and_short_challenge_are_disjoint(self):
        seen = set()
        for split, groups in trainer.HANDWRITTEN_PAIRS.items():
            texts = {"".join(char for char in text if char.isalnum())
                     for pairs in groups.values() for pair in pairs for text in pair}
            self.assertFalse(seen & texts, split)
            seen.update(texts)
        challenge = trainer.HANDWRITTEN_PAIRS["short_challenge"]
        self.assertEqual(set(challenge), {"hollow", "commentary", "echo"})
        self.assertTrue(all(len(negative) <= 20 for pairs in challenge.values() for _, negative in pairs))

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
            self.assertEqual(second["feature_version"], 3)
            self.assertEqual(len(second["weights"]), 12)
            metrics = first_report["metrics"]
            for split in ("dev", "dev_handwritten"):
                self.assertLessEqual(metrics[split]["natural_false_positive_rate"], 0.02)
            challenge = metrics["short_challenge"]
            self.assertEqual(challenge["synthetic_samples"], 20)
            self.assertEqual(challenge["by_group"]["echo"]["synthetic_samples"], 5)
            self.assertGreaterEqual(challenge["synthetic_detection_rate"], 0.5)
            self.assertLessEqual(challenge["natural_false_positive_rate"], 0.1)
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
            for text in ("刚下车。", "我还没吃，等会去。", "天黑了，柜子顶上有手电筒，你拿着照一下楼梯。"):
                self.assertLess(trainer.score(first, text), first["threshold"], text)
            for text in ("画面感来了。", "真的假的？"):
                self.assertGreaterEqual(trainer.score(first, text), first["threshold"], text)

    def test_optional_database_evaluation_groups_ordered_text_parts_and_exports_no_text(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fixture.sqlite3"
            connection = sqlite3.connect(path)
            try:
                connection.executescript("""
                    CREATE TABLE participants(id TEXT, kind TEXT);
                    CREATE TABLE messages(id TEXT, seq INTEGER PRIMARY KEY, sender_id TEXT, state TEXT);
                    CREATE TABLE message_parts(message_id TEXT, ordinal INTEGER, kind TEXT, text TEXT);
                """)
                connection.executemany("INSERT INTO participants VALUES (?,?)", [("human", "user"), ("bot", "agent")])
                connection.executemany("INSERT INTO messages VALUES (?,?,?,?)", [
                    ("u", 1, "human", "visible"), ("a", 5, "bot", "visible"), ("b", 2, "bot", "visible"),
                    ("hidden", 3, "bot", "recalled"), ("file", 4, "bot", "visible"),
                ])
                connection.executemany("INSERT INTO message_parts VALUES (?,?,?,?)", [
                    ("u", 0, "text", "用户私有文本有画面感" * 100),
                    ("a", 2, "text", "实。"), ("a", 1, "attachment", None), ("a", 0, "text", "确"),
                    ("b", 0, "text", "海报上写着烟火气拉满。"), ("hidden", 0, "text", "太浪漫了"),
                    ("file", 0, "attachment", None),
                ])
                connection.commit()
            finally:
                connection.close()
            original = path.read_bytes()
            model = {"means": [0.0] * 12, "scales": [1.0] * 12, "weights": [0.0] * 12, "bias": 0.0, "threshold": 0.6}
            result = trainer.evaluate_database(model, path)
            visible = result["visible_ai_only"]
            self.assertEqual(visible["ai_messages"], 2)
            self.assertEqual(visible["mean_characters"], (len("确实。") + len("海报上写着烟火气拉满。")) / 2)
            self.assertEqual(visible["commentary_template_occurrences"], 1)
            self.assertEqual(visible["hollow_messages"], 1)
            self.assertEqual(result["latest_12_ai_only"], visible)
            report = json.dumps(result, ensure_ascii=False)
            for private in ("用户私有", "确", "海报上写着", "太浪漫了"):
                self.assertNotIn(private, report)
            self.assertEqual(path.read_bytes(), original)

    def test_insufficient_training_data_cannot_generate_a_model(self):
        with self.assertRaises(ValueError):
            trainer.fit_model(["今天吃点面条。"] * 99, ["明天出门走走。"], ["周末去图书馆。"], 42)
        with self.assertRaises(ValueError):
            trainer.train("missing", "not-created.json", samples=20_001)


if __name__ == "__main__":
    unittest.main()
