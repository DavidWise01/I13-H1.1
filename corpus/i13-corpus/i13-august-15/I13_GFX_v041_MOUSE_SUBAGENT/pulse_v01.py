#!/usr/bin/env python3
"""Pulse v0.1 reference interpreter.

Hard statement delimiter: ...
Reserved: ..
Core transition mirrors pulse_axiom.py:
    adjusted = state + threshold
    adjusted > 128 ? adjusted * witness : None
"""
from __future__ import annotations
from dataclasses import dataclass
import re
import sys
from pathlib import Path

VERSION = "pulse-v0.1"
DELIMITER = "..."
RESERVED = ".."

class PulseError(Exception):
    pass

@dataclass(frozen=True)
class Statement:
    kind: str
    name: str | None = None
    args: tuple[str, ...] = ()

IDENT = r"[A-Za-z_][A-Za-z0-9_]*"
NUMBER = r"[-+]?(?:\d+(?:\.\d*)?|\.\d+)"


def execute_pulse_transition(state_vector: float, threshold_boundary: float, verification_witness: float):
    adjusted_vector = state_vector + threshold_boundary
    if adjusted_vector > 128:
        return adjusted_vector * verification_witness
    return None


def split_statements(source: str) -> list[str]:
    # Reject a bare double-dot. Triple-dot is consumed as the delimiter.
    scrubbed = source.replace(DELIMITER, "")
    if RESERVED in scrubbed:
        raise PulseError("'..' is reserved in Pulse v0.1; use '...' to terminate a statement")
    parts = [p.strip() for p in source.split(DELIMITER)]
    tail = parts.pop()
    if tail.strip():
        raise PulseError("unterminated statement: Pulse statements must end with '...'")
    return [p for p in parts if p]


def parse(source: str) -> list[Statement]:
    out: list[Statement] = []
    for raw in split_statements(source):
        # Strip full-line comments that can precede a statement.
        raw = "\n".join(line for line in raw.splitlines() if not line.lstrip().startswith("#")).strip()
        if not raw:
            continue
        m = re.fullmatch(rf"let\s+({IDENT})\s*=\s*({NUMBER}|{IDENT}|none)", raw)
        if m:
            out.append(Statement("let", m.group(1), (m.group(2),)))
            continue
        m = re.fullmatch(
            rf"pulse\s+({IDENT})\s*=\s*transition\s*\(\s*({NUMBER}|{IDENT}|none)\s*,\s*({NUMBER}|{IDENT}|none)\s*,\s*({NUMBER}|{IDENT}|none)\s*\)",
            raw,
        )
        if m:
            out.append(Statement("pulse", m.group(1), (m.group(2), m.group(3), m.group(4))))
            continue
        m = re.fullmatch(rf"emit\s+({NUMBER}|{IDENT}|none)", raw)
        if m:
            out.append(Statement("emit", None, (m.group(1),)))
            continue
        raise PulseError(f"cannot parse statement: {raw!r}")
    return out


def atom(token: str, env: dict[str, float | None]):
    if token == "none":
        return None
    if re.fullmatch(NUMBER, token):
        return float(token)
    if token not in env:
        raise PulseError(f"unbound name: {token}")
    return env[token]


def require_number(value, label: str) -> float:
    if value is None:
        raise PulseError(f"{label} cannot be none")
    return float(value)


def run(source: str):
    env: dict[str, float | None] = {}
    emitted: list[float | None] = []
    trace: list[dict] = []
    for i, stmt in enumerate(parse(source)):
        if stmt.kind == "let":
            value = atom(stmt.args[0], env)
            env[stmt.name] = value
            trace.append({"pc": i, "op": "let", "name": stmt.name, "value": value})
        elif stmt.kind == "pulse":
            s = require_number(atom(stmt.args[0], env), "state")
            t = require_number(atom(stmt.args[1], env), "threshold")
            w = require_number(atom(stmt.args[2], env), "witness")
            adjusted = s + t
            value = execute_pulse_transition(s, t, w)
            env[stmt.name] = value
            trace.append({"pc": i, "op": "transition", "name": stmt.name, "state": s, "threshold": t, "adjusted": adjusted, "witness": w, "crossed": adjusted > 128, "value": value})
        elif stmt.kind == "emit":
            value = atom(stmt.args[0], env)
            emitted.append(value)
            trace.append({"pc": i, "op": "emit", "value": value})
    return {"version": VERSION, "delimiter": DELIMITER, "env": env, "emitted": emitted, "trace": trace}


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("usage: python pulse_v01.py program.pulse", file=sys.stderr)
        return 2
    try:
        result = run(Path(argv[1]).read_text(encoding="utf-8"))
    except PulseError as e:
        print(f"PULSE ERROR: {e}", file=sys.stderr)
        return 1
    for value in result["emitted"]:
        print("none" if value is None else (int(value) if float(value).is_integer() else value))
    return 0

if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
