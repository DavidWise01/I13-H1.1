# H1.1 technical corpus

Seed lanes:

```text
ternary / mixed radix
linear algebra / vectors / tensors
Hamiltonians / integrable systems
fractals / chaos
Ada Lovelace / Babbage
DOS-era software
vector / voxel / vogel / VS
Sonia / Sonya / Sofya Kovalevskaya
```

V-layer:

```text
vector = mathematical/state-space structure
voxel  = spatial/nested-volume structure
vogel  = deliberately unserious/contextual material; not evidence by itself
VS     = explicit comparison/contrast
```

`h1.1-corpus.jsonl` stores metadata, provenance URLs, classifications and short notes. It does not redistribute full copyrighted books or software packages.

## Golden I13 river

The compiler-facing golden corpus is intentionally separate from the older technical/research corpus.

```text
corpus/golden/
    ↓
00_atoms
    ↓
future progressive language layers
```

`00_atoms` is a hand-curated progressive stream:

```text
0 |s| 1 |s| 1 |s| 2 |s| 3 |s| 5 |s| 8 |s| 13 |s| 21 |s| 34
```

`|s|` is corpus documentation notation for stream handoff, not I13 syntax. Every rock is independently compilable, its `RIVER_IN` equals the previous rock's `RIVER_OUT`, and `corpus/golden/00_atoms/river.i13` composes the current inside I13 itself.

See `corpus/golden/00_atoms/README.md` and `docs/CORPUS-ATOMS.md`.

## Stage 14 — admission gate

```text
JSONL -> schema -> provenance -> canonical ID -> OLOGY root -> corpus CV -> index
```

The Stage 14 gate rejects malformed records, duplicate IDs, 32-bit address collisions and missing provenance/classification. Vogel records may exist as context but are not evidence-eligible by themselves.

## Stage 14.1 — corpus mesh

```text
verified index
   -> shared-domain edges
   -> curated world-path overlays
   -> deterministic adjacency
   -> neighbor/path queries
   -> local voxel burrow
```

Current commands:

```text
python scripts/corpus_mesh_stage14_1.py --summary
python scripts/corpus_mesh_stage14_1.py --neighbors sonia-003
python scripts/corpus_mesh_stage14_1.py --path sonia-001 fractal-007
python scripts/corpus_mesh_stage14_1.py --burrow sonia-003 81
```

`--evidence-only` excludes Vogel/context nodes from traversal. `corpus/maps/WORLD-IV-SONIA.json` is admitted as an explicit navigation overlay only after every referenced corpus ID is verified to exist; its existing 0root verification caveat remains intact.
