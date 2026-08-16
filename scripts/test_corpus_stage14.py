import json
import tempfile
import unittest
from pathlib import Path

from scripts.corpus_stage14 import build_index, fnv1a32, load_jsonl, ology_root


def rec(**patch):
    item = {
        "id": "radix-001",
        "title": "Number systems",
        "creator": "Example",
        "year": 1971,
        "domain": ["radix"],
        "v": ["vector"],
        "kind": "book",
        "access": "open",
        "note": "fixture",
        "url": "https://example.org/radix",
        "seriousness": 0,
        "source_origin": "fixture",
    }
    item.update(patch)
    return item


class Stage14CorpusTests(unittest.TestCase):
    def test_known_root_is_stable(self):
        self.assertEqual(fnv1a32("radix-001"), 0x3B470E7F)
        self.assertEqual(ology_root("radix-001"), {"address": 0x3B470E7F, "x": 15175, "y": 3711, "z": 0})

    def test_index_passes_good_record(self):
        index, errors = build_index([rec()])
        self.assertEqual(errors, [])
        self.assertEqual(index["count"], 1)
        self.assertEqual(index["records"][0]["cv"]["verdict"], "PASS")
        self.assertTrue(index["records"][0]["evidence_eligible"])

    def test_vogel_is_context_not_evidence(self):
        index, errors = build_index([rec(v=["vector", "vogel"], seriousness=1)])
        self.assertEqual(errors, [])
        self.assertFalse(index["records"][0]["evidence_eligible"])

    def test_duplicate_id_is_vetoed(self):
        _, errors = build_index([rec(), rec(title="duplicate")])
        self.assertTrue(any("duplicate-id" in e for e in errors))

    def test_jsonl_schema_rejects_vogel_seriousness_zero(self):
        bad = rec(v=["vogel"], seriousness=0)
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "c.jsonl"
            path.write_text(json.dumps(bad) + "\n", encoding="utf-8")
            _, errors = load_jsonl(path)
        self.assertTrue(any("vogel records must not claim seriousness 0" in e for e in errors))


if __name__ == "__main__":
    unittest.main()
