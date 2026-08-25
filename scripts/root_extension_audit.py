#!/usr/bin/env python3
"""Deterministic 0root extension and exact-content audit.

The scanner never deletes or rewrites payloads.  It walks from the repository
root to content identity (L1..L9), then emits the eight return edges needed to
trace every finding back to repository authority.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable


SCHEMA = "0root.extension-witness/v1"
DEFAULT_EXCLUDES = {".git", "node_modules", "target", "__pycache__", ".pytest_cache"}


def normalized_extension(path: Path) -> str:
    """Return a lowercase suffix, or ``(none)`` for extensionless dotfiles."""
    name = path.name
    if name.startswith(".") and name.count(".") == 1:
        return "(none)"
    suffix = path.suffix.lower()
    return suffix if suffix else "(none)"


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def sniff(path: Path) -> tuple[str, bool | None]:
    """Return a conservative media signature and UTF-8 validity."""
    with path.open("rb") as stream:
        head = stream.read(8192)

    if head.startswith(b"%PDF-"):
        return "application/pdf", None
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", None
    if len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp", None
    if head.startswith(b"\x00asm"):
        return "application/wasm", None
    if head.startswith((b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")):
        return "application/zip", None
    if head.startswith(b"ID3") or (len(head) > 1 and head[0] == 0xFF and head[1] & 0xE0 == 0xE0):
        return "audio/mpeg", None

    try:
        text = head.decode("utf-8")
    except UnicodeDecodeError:
        return "application/octet-stream", False

    lowered = text.lstrip("\ufeff\t\r\n ").lower()
    if lowered.startswith("<!doctype html") or lowered.startswith("<html"):
        return "text/html", True
    if lowered.startswith("<?xml") or "<svg" in lowered[:1024]:
        return "image/svg+xml" if "<svg" in lowered[:1024] else "application/xml", True
    return "text/plain", True


def iter_files(root: Path, excludes: set[str]) -> Iterable[Path]:
    for current, directories, files in os.walk(root, followlinks=False):
        directories[:] = sorted(d for d in directories if d not in excludes)
        base = Path(current)
        for name in sorted(files):
            path = base / name
            if not path.is_symlink():
                yield path


def load_policy(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as stream:
        policy = json.load(stream)
    required = {"allowed_extensions", "prunable_extensions", "prunable_names"}
    missing = sorted(required - policy.keys())
    if missing:
        raise ValueError(f"policy missing keys: {', '.join(missing)}")
    return policy


def canonical_rank(path: str, priorities: list[str]) -> tuple[int, str]:
    for index, prefix in enumerate(priorities):
        if path == prefix.rstrip("/") or path.startswith(prefix):
            return index, path
    return len(priorities), path


def audit(root: Path, policy: dict[str, Any]) -> dict[str, Any]:
    root = root.resolve()
    excludes = set(policy.get("excluded_directories", [])) | DEFAULT_EXCLUDES
    allowed = set(policy["allowed_extensions"])
    prunable_extensions = set(policy["prunable_extensions"])
    prunable_names = set(policy["prunable_names"])
    priorities = list(policy.get("canonical_path_priority", []))
    expected_media = dict(policy.get("expected_media", {}))

    entries: list[dict[str, Any]] = []
    by_hash: dict[str, list[dict[str, Any]]] = defaultdict(list)
    extension_counts: Counter[str] = Counter()
    extension_bytes: Counter[str] = Counter()
    findings: list[dict[str, Any]] = []

    for path in iter_files(root, excludes):
        relative = path.relative_to(root).as_posix()
        extension = normalized_extension(path)
        size = path.stat().st_size
        digest = sha256_file(path)
        media, utf8 = sniff(path)
        state = "allowed" if extension in allowed else "review"

        if extension in prunable_extensions or path.name in prunable_names or path.name.endswith("~"):
            state = "prunable-residue"
            findings.append({"kind": state, "path": relative, "extension": extension})
        elif extension not in allowed:
            findings.append({"kind": "unknown-extension", "path": relative, "extension": extension})

        expected = expected_media.get(extension)
        if expected and media not in expected:
            findings.append(
                {
                    "kind": "signature-mismatch",
                    "path": relative,
                    "extension": extension,
                    "expected": expected,
                    "observed": media,
                }
            )

        entry = {
            "path": relative,
            "extension": extension,
            "bytes": size,
            "sha256": digest,
            "media": media,
            "utf8": utf8,
            "state": state,
        }
        entries.append(entry)
        by_hash[digest].append(entry)
        extension_counts[extension] += 1
        extension_bytes[extension] += size

    duplicate_groups: list[dict[str, Any]] = []
    for digest, group in by_hash.items():
        if len(group) < 2:
            continue
        paths = sorted(item["path"] for item in group)
        canonical = min(paths, key=lambda item: canonical_rank(item, priorities))
        archive_only = all(path.startswith(("corpus/", "reference/")) for path in paths)
        duplicate_groups.append(
            {
                "sha256": digest,
                "bytes_each": group[0]["bytes"],
                "count": len(paths),
                "canonical": canonical,
                "paths": paths,
                "decision": "preserve-lineage" if archive_only else "review-alias",
            }
        )

    duplicate_groups.sort(key=lambda item: (-item["count"], item["canonical"]))
    findings.sort(key=lambda item: (item["kind"], item["path"]))
    entries.sort(key=lambda item: item["path"])

    extensions = [
        {"extension": ext, "files": extension_counts[ext], "bytes": extension_bytes[ext]}
        for ext in sorted(extension_counts)
    ]
    redundant_files = sum(group["count"] - 1 for group in duplicate_groups)
    checkout_bytes = sum((group["count"] - 1) * group["bytes_each"] for group in duplicate_groups)

    return {
        "schema": SCHEMA,
        "root": ".",
        "layers": [
            "L1 authority",
            "L2 repository root",
            "L3 path namespace",
            "L4 extension role",
            "L5 encoding",
            "L6 media signature",
            "L7 payload size",
            "L8 SHA-256 content",
            "L9 duplicate identity",
        ],
        "return_edges": [
            "L9->L8 identity witness",
            "L8->L7 byte witness",
            "L7->L6 media witness",
            "L6->L5 encoding witness",
            "L5->L4 extension witness",
            "L4->L3 path witness",
            "L3->L2 root witness",
            "L2->L1 authority witness",
        ],
        "summary": {
            "files": len(entries),
            "bytes": sum(item["bytes"] for item in entries),
            "extension_count": len(extension_counts),
            "duplicate_groups": len(duplicate_groups),
            "redundant_checkout_files": redundant_files,
            "redundant_checkout_bytes": checkout_bytes,
            "prunable_residues": sum(item["kind"] == "prunable-residue" for item in findings),
            "unknown_extensions": sum(item["kind"] == "unknown-extension" for item in findings),
            "signature_mismatches": sum(item["kind"] == "signature-mismatch" for item in findings),
        },
        "extensions": extensions,
        "duplicates": duplicate_groups,
        "findings": findings,
        "files": entries,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--policy", type=Path, default=Path("governance/extension-policy.json"))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--strict", action="store_true", help="fail on residue or unknown extensions")
    parser.add_argument("--strict-signatures", action="store_true", help="also fail on signature mismatch")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    witness = audit(args.root, load_policy(args.policy))
    rendered = json.dumps(witness, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8", newline="\n")
    else:
        print(rendered, end="")

    summary = witness["summary"]
    failed = summary["prunable_residues"] or summary["unknown_extensions"]
    if args.strict_signatures:
        failed = failed or summary["signature_mismatches"]
    return 2 if (args.strict or args.strict_signatures) and failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
