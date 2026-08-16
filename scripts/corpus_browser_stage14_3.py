#!/usr/bin/env python3
"""Stage 14.3 browser manifest generator.

The manifest is display metadata only. Runtime graph traversal remains in the
Stage 14.2 Rust/WebAssembly corpus walker.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from scripts.corpus_stage14 import build_index, load_jsonl
    from scripts.corpus_mesh_stage14_1 import build_mesh, load_world_path
except ModuleNotFoundError:
    from corpus_stage14 import build_index, load_jsonl
    from corpus_mesh_stage14_1 import build_mesh, load_world_path


def fnv1a32_bytes(data: bytes) -> int:
    h = 0x811C9DC5
    for byte in data:
        h ^= byte
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def build_browser_manifest(corpus_path: Path, world_path: Path) -> dict:
    records, errors = load_jsonl(corpus_path)
    if errors:
        raise ValueError('; '.join(errors))
    index, cv_errors = build_index(records)
    if cv_errors:
        raise ValueError('; '.join(cv_errors))
    world = load_world_path(world_path)
    mesh = build_mesh(index, [world])

    ordered = sorted(index['records'], key=lambda item: item['id'])
    nodes = []
    for ordinal, item in enumerate(ordered):
        root = item['root']
        nodes.append({
            'ordinal': ordinal,
            'id': item['id'],
            'title': item['title'],
            'creator': item['creator'],
            'address': root['address'],
            'x': root['x'],
            'y': root['y'],
            'evidence': bool(item['evidence_eligible']),
            'v': item['v'],
            'domain': item['domain'],
            'kind': item['kind'],
        })

    return {
        'schema': 'i13-h1.1-corpus-browser/0.1',
        'source_schema': index['schema'],
        'mesh_schema': mesh['schema'],
        'counts': {
            'nodes': len(nodes),
            'edges': mesh['edge_count'],
            'directed_edges': mesh['edge_count'] * 2,
            'evidence': sum(1 for node in nodes if node['evidence']),
            'vogel': sum(1 for node in nodes if 'vogel' in node['v']),
            'world_steps': len(world['path']) - 1,
        },
        'fingerprints': {
            'corpus': fnv1a32_bytes(corpus_path.read_bytes()),
            'world': fnv1a32_bytes(world_path.read_bytes()),
        },
        'addressing': index['addressing'],
        'nodes': nodes,
        'world_path': {
            'world': world['world'],
            'target': world['target'],
            'status': world.get('status'),
            'path': list(world['path']),
            'interpretation': world.get('interpretation'),
        },
        'runtime_authority': 'Stage 14.2 Rust/Wasm walker; manifest is labels/metadata only',
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--corpus', type=Path, default=Path('corpus/h1.1-corpus.jsonl'))
    parser.add_argument('--world-path', type=Path, default=Path('corpus/maps/WORLD-IV-SONIA.json'))
    parser.add_argument('--output', type=Path, default=Path('docs/assets/corpus-browser.json'))
    parser.add_argument('--summary', action='store_true')
    args = parser.parse_args(argv)

    manifest = build_browser_manifest(args.corpus, args.world_path)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(manifest, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    if args.summary:
        c = manifest['counts']
        print(f"BROWSER MANIFEST PASS · nodes={c['nodes']} · edges={c['edges']} · evidence={c['evidence']} · vogel={c['vogel']} · world_steps={c['world_steps']}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
