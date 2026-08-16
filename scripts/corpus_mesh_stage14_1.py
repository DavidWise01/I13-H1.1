#!/usr/bin/env python3
"""Stage 14.1 deterministic corpus mesh.

Builds a traversable graph over the Stage 14 verified corpus index.
- semantic edges come from shared domain labels;
- curated world paths are explicit overlays and never masquerade as evidence;
- Vogel/context nodes remain traversable but are excluded by evidence-only queries;
- voxel burrowing changes local z only, never the 32-bit OLOGY surface root.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import deque
from pathlib import Path
from typing import Iterable


def _record_map(index: dict) -> dict[str, dict]:
    records = index.get("records", [])
    if not isinstance(records, list):
        raise ValueError("index.records must be a list")
    out: dict[str, dict] = {}
    for record in records:
        rid = record.get("id") if isinstance(record, dict) else None
        if not isinstance(rid, str) or not rid:
            raise ValueError("every index record requires id")
        if rid in out:
            raise ValueError(f"duplicate index id: {rid}")
        out[rid] = record
    return out


def load_world_path(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path}: world path must be an object")
    route = data.get("path")
    if not isinstance(route, list) or len(route) < 2 or not all(isinstance(x, str) and x for x in route):
        raise ValueError(f"{path}: path must contain at least two record ids")
    world = data.get("world")
    target = data.get("target")
    if not isinstance(world, str) or not world or not isinstance(target, str) or not target:
        raise ValueError(f"{path}: world and target are required")
    return data


def validate_world_path(index: dict, world_path: dict) -> None:
    records = _record_map(index)
    missing = [rid for rid in world_path["path"] if rid not in records]
    if missing:
        raise ValueError(f"world {world_path.get('world')} path references missing ids: {', '.join(missing)}")


def _edge_slot(edges: dict[tuple[str, str], dict], a: str, b: str) -> dict:
    if a == b:
        raise ValueError("self edge is not allowed")
    lo, hi = sorted((a, b))
    key = (lo, hi)
    if key not in edges:
        edges[key] = {
            "a": lo,
            "b": hi,
            "kinds": set(),
            "shared_domains": set(),
            "world_paths": [],
        }
    return edges[key]


def build_mesh(index: dict, world_paths: Iterable[dict] = ()) -> dict:
    """Build deterministic undirected semantic mesh plus explicit world-path overlays."""
    records = _record_map(index)
    edges: dict[tuple[str, str], dict] = {}

    domain_index = index.get("indexes", {}).get("domain", {})
    if not isinstance(domain_index, dict):
        raise ValueError("index.indexes.domain must be an object")

    for domain, members in sorted(domain_index.items()):
        if not isinstance(domain, str) or not isinstance(members, list):
            raise ValueError("domain index entries must be string -> list")
        ids = sorted(set(members))
        unknown = [rid for rid in ids if rid not in records]
        if unknown:
            raise ValueError(f"domain {domain} references missing ids: {', '.join(unknown)}")
        for i, a in enumerate(ids):
            for b in ids[i + 1 :]:
                slot = _edge_slot(edges, a, b)
                slot["kinds"].add("domain")
                slot["shared_domains"].add(domain)

    paths = list(world_paths)
    for wp in paths:
        validate_world_path(index, wp)
        route = wp["path"]
        label = f"WORLD-{wp['world']}:{wp['target']}"
        for ordinal, (a, b) in enumerate(zip(route, route[1:]), start=1):
            slot = _edge_slot(edges, a, b)
            slot["kinds"].add("world_path")
            slot["world_paths"].append({"label": label, "ordinal": ordinal})

    edge_list: list[dict] = []
    adjacency: dict[str, list[dict]] = {rid: [] for rid in sorted(records)}
    for key in sorted(edges):
        raw = edges[key]
        shared = sorted(raw["shared_domains"])
        world = sorted(raw["world_paths"], key=lambda x: (x["label"], x["ordinal"]))
        item = {
            "a": raw["a"],
            "b": raw["b"],
            "kinds": sorted(raw["kinds"]),
            "shared_domains": shared,
            "world_paths": world,
            "weight": len(shared) + (4 * len(world)),
        }
        edge_list.append(item)
        for src, dst in ((item["a"], item["b"]), (item["b"], item["a"])):
            adjacency[src].append({
                "id": dst,
                "kinds": item["kinds"],
                "shared_domains": shared,
                "world_paths": world,
                "weight": item["weight"],
                "evidence_eligible": bool(records[dst].get("evidence_eligible")),
            })

    for rid in adjacency:
        adjacency[rid].sort(key=lambda n: (-n["weight"], n["id"]))

    return {
        "schema": "i13-h1.1-corpus-mesh/0.1",
        "source_schema": index.get("schema"),
        "node_count": len(records),
        "edge_count": len(edge_list),
        "edge_policy": {
            "domain": "undirected edge for shared Stage 14 domain classification",
            "world_path": "explicit curated overlay; traversal metadata, not evidence authority",
            "vogel": "context nodes may be traversed; evidence-only traversal excludes them",
        },
        "edges": edge_list,
        "adjacency": adjacency,
        "world_paths": [
            {
                "world": wp["world"],
                "target": wp["target"],
                "status": wp.get("status"),
                "path": list(wp["path"]),
                "interpretation": wp.get("interpretation"),
            }
            for wp in sorted(paths, key=lambda x: (x["world"], x["target"]))
        ],
    }


def neighbors(mesh: dict, record_id: str, *, evidence_only: bool = False) -> list[dict]:
    adjacency = mesh.get("adjacency", {})
    if record_id not in adjacency:
        raise KeyError(record_id)
    items = adjacency[record_id]
    if not evidence_only:
        return list(items)
    return [item for item in items if item.get("evidence_eligible")]


def shortest_path(mesh: dict, index: dict, start: str, goal: str, *, evidence_only: bool = False) -> list[str] | None:
    records = _record_map(index)
    if start not in records:
        raise KeyError(start)
    if goal not in records:
        raise KeyError(goal)
    if evidence_only and (not records[start].get("evidence_eligible") or not records[goal].get("evidence_eligible")):
        return None

    queue = deque([start])
    parent: dict[str, str | None] = {start: None}
    while queue:
        current = queue.popleft()
        if current == goal:
            break
        for item in neighbors(mesh, current, evidence_only=evidence_only):
            nxt = item["id"]
            if evidence_only and not records[nxt].get("evidence_eligible"):
                continue
            if nxt not in parent:
                parent[nxt] = current
                queue.append(nxt)

    if goal not in parent:
        return None
    route: list[str] = []
    cur: str | None = goal
    while cur is not None:
        route.append(cur)
        cur = parent[cur]
    route.reverse()
    return route


def burrow(index: dict, record_id: str, depth: int) -> dict:
    if not isinstance(depth, int) or isinstance(depth, bool) or depth < 0:
        raise ValueError("depth must be a non-negative integer")
    records = _record_map(index)
    record = records.get(record_id)
    if record is None:
        raise KeyError(record_id)
    root = record.get("root")
    if not isinstance(root, dict) or not all(k in root for k in ("address", "x", "y")):
        raise ValueError(f"{record_id}: missing Stage 14 root")
    return {
        "id": record_id,
        "address": root["address"],
        "x": root["x"],
        "y": root["y"],
        "z": depth,
    }


def load_stage14_index(input_path: Path) -> dict:
    from scripts.corpus_stage14 import build_index, load_jsonl

    records, errors = load_jsonl(input_path)
    if errors:
        raise ValueError("; ".join(errors))
    index, cv_errors = build_index(records)
    if cv_errors:
        raise ValueError("; ".join(cv_errors))
    return index


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("corpus/h1.1-corpus.jsonl"))
    parser.add_argument("--world-path", type=Path, action="append", default=[Path("corpus/maps/WORLD-IV-SONIA.json")])
    parser.add_argument("--output", type=Path)
    parser.add_argument("--neighbors", metavar="ID")
    parser.add_argument("--path", nargs=2, metavar=("FROM", "TO"))
    parser.add_argument("--burrow", nargs=2, metavar=("ID", "DEPTH"))
    parser.add_argument("--evidence-only", action="store_true")
    parser.add_argument("--summary", action="store_true")
    args = parser.parse_args(argv)

    try:
        index = load_stage14_index(args.input)
        world_paths = [load_world_path(path) for path in args.world_path]
        mesh = build_mesh(index, world_paths)

        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(json.dumps(mesh, indent=2, sort_keys=True) + "\n", encoding="utf-8")

        if args.neighbors:
            print(json.dumps(neighbors(mesh, args.neighbors, evidence_only=args.evidence_only), indent=2, sort_keys=True))
        if args.path:
            route = shortest_path(mesh, index, args.path[0], args.path[1], evidence_only=args.evidence_only)
            print(json.dumps({"from": args.path[0], "to": args.path[1], "path": route}, indent=2, sort_keys=True))
        if args.burrow:
            print(json.dumps(burrow(index, args.burrow[0], int(args.burrow[1])), indent=2, sort_keys=True))
        if args.summary or not (args.output or args.neighbors or args.path or args.burrow):
            world_steps = sum(max(0, len(wp["path"]) - 1) for wp in world_paths)
            print(f"MESH PASS · nodes={mesh['node_count']} · edges={mesh['edge_count']} · world_steps={world_steps}")
        return 0
    except (ValueError, KeyError, OSError, json.JSONDecodeError) as exc:
        print(f"MESH VETO · {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
