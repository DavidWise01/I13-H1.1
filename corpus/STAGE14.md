# Stage 14 — Corpus v0.1

Stage 14 turns the H1.1 corpus from stored metadata into a deterministic, verified address space.

```text
JSONL source
  -> schema check
  -> canonical id
  -> provenance check
  -> V-layer classification
  -> FNV-1a-32(id)
  -> OLOGY <x16,y16>
  -> local voxel z=0
  -> [c[v[ record, context, result ]]cv]
  -> PASS | VETO
  -> query index
```

## Address law

The corpus does **not** consume OLOGY surface bits for depth.

```text
canonical id -> 32-bit fingerprint -> [x:16|y:16]
record root  -> <x,y;0>
burrow       -> <x,y;z>
```

FNV-1a-32 is used only as a stable compact address function. It is not cryptographic identity. A 32-bit collision is a **CV VETO** rather than silently moving either record.

## CV laws

A record is ingestible only when:

- its schema is valid,
- its canonical id is unique,
- its derived OLOGY root is unique,
- provenance is retained,
- classification is present.

`vogel` is allowed as a contextual lane, but a Vogel record is never evidence-eligible by itself.

## Current output

`scripts/corpus_stage14.py` builds a deterministic index containing:

- OLOGY root for every canonical record,
- local voxel depth `z=0`,
- CV verdict,
- evidence eligibility,
- domain index,
- V-layer index,
- kind index.

The source of truth remains `corpus/h1.1-corpus.jsonl`. Generated indexes are build products; source records are not rewritten during verification.
