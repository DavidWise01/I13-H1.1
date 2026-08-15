#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def check_json_report(path: Path, expected_passed: int, expected_total: int) -> None:
    r = json.loads(path.read_text(encoding="utf-8"))
    assert r["pass"] is True
    assert r["passed"] == expected_passed
    assert r["total"] == expected_total


def main() -> None:
    check_json_report(ROOT / "reference/vh1/VH1-TEST-REPORT.json", 10, 10)

    vh1 = (ROOT / "reference/vh1/VH1-FROZEN.md").read_text(encoding="utf-8")
    for token in ["c.0 →  1", "c.1 →  3", "c.2 →  9", "c.3 → 27", "c.4 → 81", "H : C^81 → C^81"]:
        assert token in vh1

    vh2 = (ROOT / "reference/vh2/VH2-CUBI-TEST-REPORT.txt").read_text(encoding="utf-8")
    assert "TOTAL: 10/10 PASS" in vh2
    assert "PASSING MODEL: ternary controller above one [[5,1,3]] protected logical qubit." in vh2
    assert "REJECTED MODEL: ternary quantum logical basis inside the same [[5,1,3]] block." in vh2

    i13 = (ROOT / "spec/I13.md").read_text(encoding="utf-8")
    words = ["I", "Name", "Constant", "Attribute", "Assign", "Arg", "Return", "Expr", "If", "Compare", "Call", "FunctionDef", "BinOp"]
    assert all(word in i13 for word in words)

    page = (ROOT / "docs/index.html").read_text(encoding="utf-8")
    for word in words:
        assert f">{word}<" in page

    print("reference parity: PASS")

if __name__ == "__main__":
    main()
