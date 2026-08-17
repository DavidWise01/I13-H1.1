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
01_syntax
    ↓
02_semantics
```

The golden river does not restart between folders.

```text
00 ATOMS
0 |s| 1 |s| 1 |s| 2 |s| 3 |s| 5 |s| 8 |s| 13 |s| 21 |s| 34
                                                                    |
                                                                    v
01 SYNTAX
34 |s| 55 |s| 89 |s| 144 |s| 233 |s| 377 |s| 610 |s| 987 |s| 1597 |s| 2584
                                                                    |
                                                                    v
02 SEMANTICS
2584 |s| 4181 |s| 6765 |s| 10946 |s| 17711 |s| 28657 |s| 46368 |s| 75025 |s| 121393 |s| 196418
```

`|s|` is corpus documentation notation for stream handoff, not I13 syntax.

Layer roles:

```text
00_atoms      smallest accepted executable pieces
01_syntax     legal source arrangements of those pieces
02_semantics  meaning of accepted arrangements
```

`02_semantics` adds HIR checkpoints, VM/Wasm meaning parity, semantic rejection witnesses, and the executable `ada_lens.i13` model. Its documentary mathematical-poetry emblem is:

```text
[ | ( ada ) | ]
```

The emblem and `~>` notation are not I13 syntax. They describe a human-readable conceptual funnel that the executable Ada lens models using current I13 primitives:

```text
semantics
   ↓
analysis + music(rhythm, tempo, pace, timing)
   ↓
reason
   ↓
boolean
```

Every golden rock is independently compilable when it represents accepted execution, and every downstream reach must inherit the upstream composition final exactly. Each reach contains a composed `river.i13` witness so continuity exists inside I13, not only in host metadata. Rejected semantic programs live as attached bank witnesses rather than pretending to emit a successful handoff.

See:

```text
corpus/golden/00_atoms/README.md
docs/CORPUS-ATOMS.md
corpus/golden/01_syntax/README.md
docs/CORPUS-SYNTAX.md
corpus/golden/02_semantics/README.md
docs/CORPUS-SEMANTICS.md
docs/semantics.html
```

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
