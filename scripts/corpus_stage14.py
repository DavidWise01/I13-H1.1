#!/usr/bin/env python3
"""Stage 14 corpus ingest/verify/index pipeline.

Stdlib-only by design. The corpus stays JSONL; this script validates records,
derives deterministic 32-bit OLOGY roots, applies corpus CV rules, and emits a
stable query index.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

ID_RE = re.compile(r"^[a-z0-9][a-z0-9._-]*$")
ALLOWED_V = {"vector", "voxel", "vogel", "vs"}
REQUIRED = (
    "id", "title", "creator", "year", "domain", "v", "kind", "access",
    "note", "url", "seriousness", "source_origin",
)


def fnv1a32(text: str) -> int:
    """Stable non-cryptographic 32-bit fingerprint shared with the Wasm core."""
    h = 0x811C9DC5
    for b in text.encode("utf-8"):
        h ^= b
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def ology_root(record_id: str) -> dict[str, int]:
    address = fnv1a32(record_id)
    return {"address": address, "x": (address >> 16) & 0xFFFF, "y": address & 0xFFFF, "z": 0}


def valid_url(value: object) -> bool:
    if not isinstance(value, str) or not value:
        return False
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def validate_record(record: object, line: int) -> list[str]:
    prefix = f"line {line}"
    if not isinstance(record, dict):
        return [f"{prefix}: record must be an object"]

    errors: list[str] = []
    for key in REQUIRED:
        if key not in record:
            errors.append(f"{prefix}: missing required field {key!r}")

    rid = record.get("id")
    if not isinstance(rid, str) or not ID_RE.fullmatch(rid):
        errors.append(f"{prefix}: invalid id {rid!r}")

    for key in ("title", "creator", "kind", "access", "note", "source_origin"):
        value = record.get(key)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{prefix}: {key} must be a non-empty string")

    year = record.get("year")
    if year is not None and (not isinstance(year, int) or isinstance(year, bool)):
        errors.append(f"{prefix}: year must be an integer or null")

    domains = record.get("domain")
    if not isinstance(domains, list) or not domains or not all(isinstance(x, str) and x for x in domains):
        errors.append(f"{prefix}: domain must be a non-empty string list")

    tags = record.get("v")
    if not isinstance(tags, list) or not tags or not all(isinstance(x, str) and x for x in tags):
        errors.append(f"{prefix}: v must be a non-empty string list")
    else:
        unknown = sorted(set(tags) - ALLOWED_V)
        if unknown:
            errors.append(f"{prefix}: unknown V-layer tags {unknown}")

    seriousness = record.get("seriousness")
    if not isinstance(seriousness, int) or isinstance(seriousness, bool) or not 0 <= seriousness <= 2:
        errors.append(f"{prefix}: seriousness must be integer 0..2")
    elif isinstance(tags, list) and "vogel" in tags and seriousness == 0:
        errors.append(f"{prefix}: vogel records must not claim seriousness 0")

    if not valid_url(record.get("url")):
        errors.append(f"{prefix}: url must be absolute http(s)")

    ia = record.get("ia")
    if ia is not None:
        if not isinstance(ia, str) or not ia:
            errors.append(f"{prefix}: ia must be a non-empty string when present")
        url = record.get("url", "")
        if isinstance(url, str) and "archive.org/details/" in url and ia not in url:
            errors.append(f"{prefix}: ia identifier does not match archive.org URL")

    return errors


def corpus_cv(record: dict, *, id_unique: bool, address_unique: bool) -> tuple[bool, list[str]]:
    """Corpus-specific [c[v[...]]cv] gate."""
    reasons: list[str] = []
    if not id_unique:
        reasons.append("duplicate-id")
    if not address_unique:
        reasons.append("ology-address-collision")
    if not valid_url(record.get("url")) or not record.get("source_origin"):
        reasons.append("provenance-missing")
    if not record.get("domain"):
        reasons.append("classification-missing")
    return (not reasons), reasons


def load_jsonl(path: Path) -> tuple[list[dict], list[str]]:
    records: list[dict] = []
    errors: list[str] = []
    for line_no, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not raw.strip():
            continue
        try:
            record = json.loads(raw)
        except json.JSONDecodeError as exc:
            errors.append(f"line {line_no}: invalid JSON: {exc.msg}")
            continue
        errors.extend(validate_record(record, line_no))
        if isinstance(record, dict):
            records.append(record)
    return records, errors


def build_index(records: list[dict]) -> tuple[dict, list[str]]:
    ids: defaultdict[str, int] = defaultdict(int)
    addresses: defaultdict[int, int] = defaultdict(int)
    for record in records:
        rid = record.get("id")
        if isinstance(rid, str):
            ids[rid] += 1
            addresses[fnv1a32(rid)] += 1

    by_domain: defaultdict[str, list[str]] = defaultdict(list)
    by_v: defaultdict[str, list[str]] = defaultdict(list)
    by_kind: defaultdict[str, list[str]] = defaultdict(list)
    indexed: list[dict] = []
    errors: list[str] = []

    for record in sorted(records, key=lambda r: str(r.get("id", ""))):
        rid = record["id"]
        root = ology_root(rid)
        passed, reasons = corpus_cv(record, id_unique=ids[rid] == 1, address_unique=addresses[root["address"]] == 1)
        if not passed:
            errors.append(f"{rid}: CV VETO: {', '.join(reasons)}")

        vogel = "vogel" in record["v"]
        evidence_eligible = passed and not vogel and record["seriousness"] == 0
        item = {
            "id": rid,
            "title": record["title"],
            "creator": record["creator"],
            "root": root,
            "domain": sorted(set(record["domain"])),
            "v": sorted(set(record["v"])),
            "kind": record["kind"],
            "url": record["url"],
            "source_origin": record["source_origin"],
            "seriousness": record["seriousness"],
            "evidence_eligible": evidence_eligible,
            "cv": {"verdict": "PASS" if passed else "VETO", "reasons": reasons},
        }
        indexed.append(item)
        for domain in item["domain"]:
            by_domain[domain].append(rid)
        for tag in item["v"]:
            by_v[tag].append(rid)
        by_kind[item["kind"]].append(rid)

    index = {
        "schema": "i13-h1.1-corpus-index/0.1",
        "addressing": {
            "surface_bits": 32,
            "layout": "x:16|y:16",
            "fingerprint": "FNV-1a-32(canonical-id)",
            "voxel_depth": "local z; root records start at z=0",
        },
        "count": len(indexed),
        "records": indexed,
        "indexes": {
            "domain": {k: sorted(v) for k, v in sorted(by_domain.items())},
            "v": {k: sorted(v) for k, v in sorted(by_v.items())},
            "kind": {k: sorted(v) for k, v in sorted(by_kind.items())},
        },
    }
    return index, errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("corpus/h1.1-corpus.jsonl"))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args(argv)

    records, errors = load_jsonl(args.input)
    if not errors:
        index, cv_errors = build_index(records)
        errors.extend(cv_errors)
    else:
        index = {}

    if errors:
        for error in errors:
            print(f"VETO {error}", file=sys.stderr)
        print(f"CORPUS VETO · {len(errors)} error(s) · {len(records)} parsed record(s)", file=sys.stderr)
        return 1

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(index, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    if args.summary or not args.output:
        evidence = sum(1 for r in index["records"] if r["evidence_eligible"])
        vogel = len(index["indexes"]["v"].get("vogel", []))
        print(f"CORPUS PASS · records={index['count']} · evidence={evidence} · vogel={vogel} · addresses={index['count']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
