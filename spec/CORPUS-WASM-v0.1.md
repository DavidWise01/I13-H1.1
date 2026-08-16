# Stage 14.2 — Corpus Wasm Walker v0.1

Status: H1.1 live implementation.

## Goal

Stage 14 admits records. Stage 14.1 connects admitted records. Stage 14.2 compiles that verified mesh into a compact numeric representation that the Rust/WebAssembly Cortex core can traverse directly.

```text
JSONL corpus
  -> Stage 14 admission / CV
  -> Stage 14.1 semantic mesh
  -> build.rs
  -> compact CSR tables
  -> Rust core
  -> wasm32-unknown-unknown
```

No second public node identifier is introduced. The corpus node key remains its deterministic 32-bit OLOGY surface root:

```text
canonical record id
  -> FNV-1a-32
  -> u32
  -> <x:16,y:16>
```

## Compile-time representation

`build.rs` reads:

- `corpus/h1.1-corpus.jsonl`
- `corpus/maps/WORLD-IV-SONIA.json`

and emits static tables into Cargo `OUT_DIR`:

```text
NODE_ADDRESSES : u32[N]
NODE_EVIDENCE  : u8[N]
OFFSETS        : u16[N+1]
NEIGHBORS      : u16[2E]
EDGE_FLAGS     : u8[2E]
EDGE_WEIGHTS   : u8[2E]
```

This is compressed-sparse-row style adjacency. Canonical ids are used only while compiling the mesh. Runtime traversal uses compact ordinals internally and OLOGY `u32` addresses at the ABI boundary.

Current Stage 14.2 baseline:

```text
nodes          54
undirected E   187
directed slots 374
World IV steps 9
```

The build fails on duplicate canonical ids, FNV/OLOGY address collision, missing provenance fields, missing domain classification, or a World-IV path id that does not exist in the admitted corpus.

## Edge flags

```text
0x01 DOMAIN
0x02 WORLD_PATH
```

An edge may carry both bits. `weight` preserves the Stage 14.1 deterministic ordering rule:

```text
weight = shared_domain_count + 4 * world_path_occurrences
```

`WORLD_PATH` is navigation metadata. It does not promote a node into evidence.

## Evidence mode

Stage 14.2 preserves the Stage 14.1 evidence-only rule: a walk may use only evidence-eligible nodes. Vogel/context nodes therefore disappear from an evidence-only traversal. Edge provenance remains visible through `EDGE_FLAGS`; callers can impose stricter edge policies later without changing node authority.

## Bounded Cortex walk

```text
walk_next(current, goal, evidence_only, max_steps)
```

performs a bounded BFS over the compiled mesh and returns only the first hop plus total shortest distance. Repeated calls move the Queen/Cortex across corpus roots without exposing a mutable graph object.

```text
<x,y;z>
   |
   | surface corpus edge
   v
<x',y';z>
```

The graph changes the OLOGY root. It does not change local voxel depth.

## Verified burrow

```text
verified_burrow(address, depth, max_depth, authority)
```

keeps the same surface root and passes the actual voxel transition through Cortex Verifier:

```text
[c[v[
    <x,y;0>,
    { authority, max_depth },
    <x,y;z>
]]cv]
```

A successful burrow returns `<x,y;z>`. A missing corpus root, authority veto, or depth-bound failure returns no location.

## Wasm ABI

Exports:

```text
i13_corpus_node_count()
i13_corpus_edge_count()
i13_corpus_world_steps()
i13_corpus_source_fingerprint()
i13_corpus_world_fingerprint()
i13_corpus_is_evidence(address)
i13_corpus_neighbor_count(address, evidence_only)
i13_corpus_neighbor(address, slot, evidence_only)
i13_corpus_walk_next(start, goal, evidence_only, max_steps)
i13_corpus_burrow(address, depth, max_depth, authority)
```

### Neighbor u64

```text
bit 63       success
bits 40..47  weight
bits 32..39  edge flags
bits 0..31   neighbor OLOGY address
```

### Walk u64

```text
bit 63       success
bits 32..62  shortest distance
bits 0..31   next OLOGY address
```

### Burrow u64

```text
bit 63       success
bits 32..62  local voxel z
bits 0..31   unchanged OLOGY root
```

Zero is the ABI failure/VETO value.

## Boundary

This is an application/runtime corpus overlay. It does not change IPv4, does not claim that OLOGY adjacency is physical network adjacency, and does not claim the curated World-IV route is an independently crawled 0root.ai route.
