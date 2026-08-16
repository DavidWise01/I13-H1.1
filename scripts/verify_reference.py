#!/usr/bin/env python3
from __future__ import annotations
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def check_json_report(path: Path, expected_passed: int, expected_total: int) -> None:
    r = json.loads(path.read_text(encoding="utf-8"))
    assert r["pass"] is True
    assert r["passed"] == expected_passed
    assert r["total"] == expected_total


def main() -> None:
    check_json_report(ROOT / "reference/vh1/VH1-TEST-REPORT.json", 10, 10)

    vh1 = load(ROOT / "reference/vh1/vh1.py", "vh1_reference")
    assert [vh1.width(n) for n in range(5)] == [1, 3, 9, 27, 81]
    try:
        vh1.width(5)
        raise AssertionError("VH1 accepted depth >4")
    except ValueError:
        pass
    demo = vh1.demo(4)
    assert demo["width"] == 81
    assert demo["terminated"] is True
    assert demo["dense_materialized"] is False

    vh1_doc = (ROOT / "reference/vh1/VH1-FROZEN.md").read_text(encoding="utf-8")
    for token in ["c.0 →  1", "c.1 →  3", "c.2 →  9", "c.3 → 27", "c.4 → 81", "H : C^81 → C^81"]:
        assert token in vh1_doc

    vh2 = load(ROOT / "reference/vh2/vh2_cubi_test.py", "vh2_cubi_reference")
    report = vh2.run()
    assert report["pass"] is True
    assert report["passed"] == 10 and report["total"] == 10
    assert report["details"]["code_space_dimension"] == 2
    assert report["details"]["physical_qubits"] == 5

    vh2_text = (ROOT / "reference/vh2/VH2-CUBI-TEST-REPORT.txt").read_text(encoding="utf-8")
    assert "TOTAL: 10/10 PASS" in vh2_text
    assert "PASSING MODEL: ternary controller above one [[5,1,3]] protected logical qubit." in vh2_text
    assert "REJECTED MODEL: ternary quantum logical basis inside the same [[5,1,3]] block." in vh2_text

    legacy_c = (ROOT / "reference/legacy/i13_cortex_vm_v04.c").read_text(encoding="utf-8")
    for token in ["OP_CONST=0", "OP_HALT=14", "GFX_CLEAR=1", "GFX_ROTATE=6", "MAX_FRAMES 64", "i13_vm_exec_program"]:
        assert token in legacy_c
    assert "OP_BR" not in legacy_c

    brief = (ROOT / "reference/I-13-BRIEF.md").read_text(encoding="utf-8")
    for token in ["Twelve verbs + `I` = 13 is the name", "There is no `br` opcode", "net = binds − k", "I.p — the osmotic bind"]:
        assert token in brief

    i13 = (ROOT / "spec/I13.md").read_text(encoding="utf-8")
    words = ["I", "Name", "Constant", "Attribute", "Assign", "Arg", "Return", "Expr", "If", "Compare", "Call", "FunctionDef", "BinOp"]
    assert all(word in i13 for word in words)

    # GitHub Pages now uses docs/index.html only as a wrapper. The actual
    # single-SVG visual source of truth is docs/i13.svg, so parity belongs there.
    page_wrapper = (ROOT / "docs/index.html").read_text(encoding="utf-8")
    assert 'data="i13.svg"' in page_wrapper
    page_svg = (ROOT / "docs/i13.svg").read_text(encoding="utf-8")
    for word in words:
        assert f">{word}<" in page_svg

    print("reference parity: PASS")

if __name__ == "__main__":
    main()
