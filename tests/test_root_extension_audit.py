import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "scripts" / "root_extension_audit.py"
SPEC = importlib.util.spec_from_file_location("root_extension_audit", MODULE_PATH)
AUDIT = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(AUDIT)


POLICY = {
    "allowed_extensions": [".txt", ".md"],
    "prunable_extensions": [".bak"],
    "prunable_names": ["Thumbs.db"],
    "canonical_path_priority": ["docs/", "corpus/"],
    "expected_media": {},
}


class RootExtensionAuditTests(unittest.TestCase):
    def test_duplicate_identity_and_canonical_path(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "docs").mkdir()
            (root / "corpus").mkdir()
            (root / "docs" / "a.txt").write_text("same", encoding="utf-8")
            (root / "corpus" / "b.txt").write_text("same", encoding="utf-8")

            witness = AUDIT.audit(root, POLICY)

            self.assertEqual(witness["summary"]["duplicate_groups"], 1)
            self.assertEqual(witness["summary"]["redundant_checkout_files"], 1)
            self.assertEqual(witness["duplicates"][0]["canonical"], "docs/a.txt")
            self.assertEqual(witness["duplicates"][0]["decision"], "review-alias")

    def test_archive_duplicates_preserve_lineage(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "corpus").mkdir()
            (root / "reference").mkdir()
            (root / "corpus" / "a.md").write_text("witness", encoding="utf-8")
            (root / "reference" / "a.md").write_text("witness", encoding="utf-8")

            witness = AUDIT.audit(root, POLICY)

            self.assertEqual(witness["duplicates"][0]["decision"], "preserve-lineage")

    def test_residue_and_unknown_are_distinct(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "stale.bak").write_text("old", encoding="utf-8")
            (root / "new.xyz").write_text("new", encoding="utf-8")

            witness = AUDIT.audit(root, POLICY)

            self.assertEqual(witness["summary"]["prunable_residues"], 1)
            self.assertEqual(witness["summary"]["unknown_extensions"], 1)

    def test_witness_is_deterministic(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "z.txt").write_text("z", encoding="utf-8")
            (root / "a.md").write_text("a", encoding="utf-8")

            first = AUDIT.audit(root, POLICY)
            second = AUDIT.audit(root, POLICY)

            self.assertEqual(
                json.dumps(first, sort_keys=True),
                json.dumps(second, sort_keys=True),
            )
            self.assertEqual([item["path"] for item in first["files"]], ["a.md", "z.txt"])


if __name__ == "__main__":
    unittest.main()
