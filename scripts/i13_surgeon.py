#!/usr/bin/env python3
"""Deterministic E1.TECH surgical diagnosis probe.

Reads only a local repository and a captured failing test log. It does not mutate
files or execute host commands. When a narrow invariant can be established, it
emits one bounded unified diff for i13-workspace to gate and apply.
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
from pathlib import Path

PANIC_RE = re.compile(r"panicked at (?P<path>[^:\n]+):(?P<line>\d+):(?P<col>\d+)")
ASSERT_CALL_RE = re.compile(r"assert_eq!\(\s*([A-Za-z_][A-Za-z0-9_]*)\(")
FN_RE_TEMPLATE = r"\b(?:pub\s+)?fn\s+{name}\s*\("
MULT_RE = re.compile(r"checked_mul\((\d+)\)")
SUFFIX_RE = re.compile(r"_(\d+)n$")


def fail(reason: str) -> int:
    print(json.dumps({
        "module": "E1.TECH-SURGEON-001",
        "trit": {"symbol": "p0", "value": 0, "authority": "FLAY"},
        "question_debt": 1,
        "patch_emitted": False,
        "reason": reason,
        "r0": 1,
    }, sort_keys=True))
    return 21


def safe_relative(raw: str) -> str | None:
    raw = raw.replace("\\", "/")
    p = Path(raw)
    if p.is_absolute() or ".." in p.parts or ".git" in p.parts:
        return None
    return raw


def function_span(text: str, start: int) -> tuple[int, int] | None:
    brace = text.find("{", start)
    if brace < 0:
        return None
    depth = 0
    for i in range(brace, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return brace, i + 1
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--failure", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    repo = Path(args.repo).resolve()
    failure = Path(args.failure).read_text(errors="replace")
    match = PANIC_RE.search(failure)
    if not match:
        return fail("no Rust panic source location in failure log")

    rel = safe_relative(match.group("path"))
    if not rel:
        return fail("panic path is outside repository policy")
    panic_file = (repo / rel).resolve()
    if not panic_file.is_file() or repo not in panic_file.parents:
        return fail("panic source file unavailable")

    lines = panic_file.read_text().splitlines(keepends=True)
    line_no = int(match.group("line"))
    if line_no < 1 or line_no > len(lines):
        return fail("panic line outside source file")

    window = "".join(lines[max(0, line_no - 3): min(len(lines), line_no + 2)])
    call = ASSERT_CALL_RE.search(window)
    if not call:
        return fail("failing assertion does not expose a direct function call")
    symbol = call.group(1)

    suffix = SUFFIX_RE.search(symbol)
    if not suffix:
        return fail(f"no numeric invariant encoded by symbol {symbol}")
    expected_factor = int(suffix.group(1))

    definition_path = None
    definition_text = None
    definition_start = None
    fn_re = re.compile(FN_RE_TEMPLATE.format(name=re.escape(symbol)))
    for path in sorted((repo / "src").rglob("*.rs")):
        text = path.read_text(errors="replace")
        m = fn_re.search(text)
        if m:
            definition_path = path
            definition_text = text
            definition_start = m.start()
            break
    if definition_path is None or definition_text is None or definition_start is None:
        return fail(f"definition for {symbol} not found")

    span = function_span(definition_text, definition_start)
    if not span:
        return fail("could not bound function body")
    body_start, body_end = span
    body = definition_text[body_start:body_end]
    multipliers = list(MULT_RE.finditer(body))
    if len(multipliers) != 1:
        return fail("function does not contain exactly one checked_mul literal")

    current_factor = int(multipliers[0].group(1))
    if current_factor == expected_factor:
        return fail("implementation already matches encoded invariant")

    # Require independent textual corroboration near the definition. This keeps
    # the symbol name from being the only authority for a cut.
    prefix = definition_text[max(0, definition_start - 500):definition_start]
    if f"{expected_factor}n" not in prefix:
        return fail("encoded invariant lacks nearby source documentation")

    absolute_start = body_start + multipliers[0].start(1)
    absolute_end = body_start + multipliers[0].end(1)
    repaired = definition_text[:absolute_start] + str(expected_factor) + definition_text[absolute_end:]

    rel_def = definition_path.relative_to(repo).as_posix()
    patch = "".join(difflib.unified_diff(
        definition_text.splitlines(keepends=True),
        repaired.splitlines(keepends=True),
        fromfile=f"a/{rel_def}",
        tofile=f"b/{rel_def}",
        n=3,
    ))
    if not patch:
        return fail("candidate repair produced no diff")
    patch = f"diff --git a/{rel_def} b/{rel_def}\n" + patch
    Path(args.out).write_text(patch)

    print(json.dumps({
        "module": "E1.TECH-SURGEON-001",
        "failure_source": rel,
        "symbol": symbol,
        "definition": rel_def,
        "observed_factor": current_factor,
        "required_factor": expected_factor,
        "evidence": ["failing assertion", "function-name invariant", "nearby source documentation"],
        "trit": {"symbol": "p1", "value": 1, "authority": "PROCEED"},
        "question_debt": 0,
        "patch_emitted": True,
        "r0": 1,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
