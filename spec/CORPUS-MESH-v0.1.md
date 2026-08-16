# H1.1 Corpus Mesh v0.1 — Stage 14.1

Stage 14.1 turns the admitted Stage 14 records into a traversable mesh without weakening the Stage 14 verifier.

## Separation of responsibilities

```text
Stage 14   : may this record exist?
Stage 14.1 : how may admitted records connect and be traversed?
```

The mesh never upgrades context into evidence. `evidence_eligible` remains a property of the verified Stage 14 record.

## Node address

Every node keeps the Stage 14 address:

```text
canonical id -> FNV-1a-32 -> [x:16 | y:16]
```

The surface root is `<x,y>`. Burrowing is local:

```text
<x,y;z> -> <x,y;z+dz>
```

`z` does not consume or alter the 32-bit OLOGY root.

## Edge classes

### `domain`

An undirected semantic edge exists when two admitted records share at least one Stage 14 `domain` classification. The edge stores the complete sorted set of shared domains.

### `world_path`

A curated path file may add an explicit traversal edge. This is navigation metadata, not evidence authority. Stage 14.1 currently loads `corpus/maps/WORLD-IV-SONIA.json` and verifies every referenced record ID exists before admitting the overlay.

The existing World IV file remains explicitly marked as correlated/candidate rather than as a programmatically verified crawl of 0root.ai.

## Weight

The initial deterministic traversal weight is descriptive, not probabilistic:

```text
weight = shared_domain_count + 4 * world_path_membership_count
```

It is used to order neighbor display. Shortest-path traversal is unweighted BFS so an added metadata weight cannot silently rewrite reachability semantics.

## Vogel rule

Vogel/context records may appear in the ordinary mesh. `--evidence-only` excludes records whose Stage 14 `evidence_eligible` value is false. This keeps playful/contextual nodes traversable while preventing them from becoming evidence merely because a graph edge exists.

## CLI

```text
python scripts/corpus_mesh_stage14_1.py --summary
python scripts/corpus_mesh_stage14_1.py --neighbors sonia-003
python scripts/corpus_mesh_stage14_1.py --path sonia-001 fractal-007
python scripts/corpus_mesh_stage14_1.py --path sonia-001 fractal-007 --evidence-only
python scripts/corpus_mesh_stage14_1.py --burrow sonia-003 81
python scripts/corpus_mesh_stage14_1.py --output /tmp/i13-corpus-mesh.json
```

## Determinism

Records, domains, edges, adjacency lists, world overlays and emitted JSON are sorted deterministically. CI builds the mesh twice and byte-compares both results.

## Current boundary

Stage 14.1 is a host-side semantic graph over the verified corpus. Rust/Wasm owns corpus addressing, CV rules and bounded local burrow state. Loading/querying the dynamic semantic mesh inside Wasm is deferred to a later stage rather than inventing a string/graph ABI prematurely.
