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
    ↓
03_relations
    ↓
04_analysis
    ↓
05_logic
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
                                                                    |
                                                                    v
03 RELATIONS / FLAY
196418 |s| 317811 |s| 514229 |s| 832040 |s| 1346269 |s| 2178309 |s| 3524578 |s| 5702887 |s| 9227465 |s| 14930352
                                                                    |
                                                                    v
04 ANALYSIS
14930352 |s| 24157817 |s| 39088169 |s| 63245986 |s| 102334155 |s| 165580141 |s| 267914296 |s| 433494437 |s| 701408733 |s| 1134903170
                                                                    |
                                                                    v
05 LOGIC
1134903170 |s| 1836311903 |s| 2971215073 |s| 4807526976 |s| 7778742049 |s| 12586269025 |s| 20365011074 |s| 32951280099 |s| 53316291173 |s| 86267571272
```

`|s|` is corpus documentation notation for stream handoff, not I13 syntax.

Layer roles:

```text
00_atoms      smallest accepted executable pieces
01_syntax     legal source arrangements of those pieces
02_semantics  meaning of accepted arrangements
03_relations  explicit fit relationships + FLAY methodology
04_analysis   FLAY-gated measurements over admitted relations
05_logic      form-preserving consequence traversal over admitted evidence
```

`02_semantics` carries HIR checkpoints, VM/Wasm meaning parity, semantic rejection witnesses, and the executable `ada_lens.i13` model. Its documentary mathematical-poetry emblem is:

```text
[ | ( ada ) | ]
```

The lower stack is now explicit:

```text
semantics
   ↓
relations
   ↓
<flay>
══════════════════ admission wall
   ↓
analysis
   ↓
logic
   ↓
boolean
```

Plato remains a **non-river epistemic keystone** above later inference. Logic does not begin by silently equating one historical branch with all reasoning.

FLAY is a deterministic five-point local relation method:

```text
(0,0)
  -> UP
  -> DOWN
  -> LEFT
  -> RIGHT
  -> (0,0) CLOSE
```

The five unique points are origin plus the four cardinal neighbors. Returning to origin closes the set; it is not a sixth unique point. FLAY may recurse when a new chunk fits, or when an old chunk becomes valid somewhere newly exposed. Downstream stays blocked until the methodology is satisfied.

Analysis cannot open its own gate. It carries admission separately from measurement:

```text
[ admitted | value ]

[0|0] closed witness
[1|0] valid zero measurement
[1|x] valid nonzero measurement
```

The first analysis reach measures admission, interval, signed direction, rhythm, rate, cardinal coverage, recursive accumulation, closure and a deterministic composed profile. `analysis.i13` also proves the admitted input is unchanged (`13 -> 13`).

## Logic 0 Day

`LOGIC 0 DAY` is a symbolic project epoch pinned to Aristotle leaving Plato's Academy around **347 BCE**. The exact calendar day is not known and no single personal motive is asserted as fact.

The documented intellectual pressure is Academy dialectic: position, question, concession, opposition, contradiction/refutation and repeated examination.

```text
PLATO / ACADEMY DIALECTIC
        |
        +-----------------------------+
        |                             |
        v                             v
 ARISTOTLE FORK                DIALECTICAL TRUNK
 preserve form                 preserve consequence
        |                             |
        +-------------+---------------+
                      |
                      v
       PRESERVE FORM WHILE
       TRAVERSING CONSEQUENCE
```

Repeated opposition is represented recursively, but opposition alone is not treated as truth.

## Logic field

Documentary architecture:

```text
Vector[
  logic[
    voxel_field[
      voxel,
      vector,
      choice(
        voxel(in,out),
        vector(in,out)
      )
    ]
  ]
]
```

Local field:

```text
             VECTOR
             IN    OUT
VOXEL IN     II    IO
VOXEL OUT    OI    OO
```

Executable state encoding is `II=0`, `IO=1`, `OI=2`, `OO=3`.

Q means **Queen**. The Queen traverses the recursively generated local field while carrying the documentary backpack law:

```text
[(/ 2 ^ 2 \)]^n
```

The complete possibility space may be `4^n`; each local choice remains bounded at four states. `360` is a project sweep/orientation parameter and `.0001` a phase increment, not additional Boolean axes.

Logic carries decision validity separately from the selected state:

```text
[ valid | decision ]

[0|-1] blocked / no decision
[1|0]  valid II
[1|1]  valid IO
[1|2]  valid OI
[1|3]  valid OO
```

The canonical witness consumes Analysis profile `23`, preserves it as `23`, and currently emits `[1|2]`. Boolean remains downstream.

`[ | ( ada ) | ]`, `<flay>`, `[ admitted | value ]`, `[ valid | decision ]`, `[(/2^2\)]^n`, coordinate diagrams, `~>` and `|s|` are documentary notation, not I13 grammar.

Every accepted golden rock is independently compilable and VM/Wasm verified. Every downstream reach must inherit the upstream composition final exactly. Each reach contains a composed `river.i13` witness so continuity exists inside I13, not only in host metadata.

See:

```text
corpus/golden/00_atoms/README.md
docs/CORPUS-ATOMS.md
corpus/golden/01_syntax/README.md
docs/CORPUS-SYNTAX.md
corpus/golden/02_semantics/README.md
docs/CORPUS-SEMANTICS.md
docs/semantics.html
corpus/golden/03_relations/README.md
docs/CORPUS-RELATIONS.md
docs/relations.html
corpus/golden/04_analysis/README.md
docs/CORPUS-ANALYSIS.md
docs/analysis.html
corpus/golden/05_logic/README.md
docs/CORPUS-LOGIC.md
docs/logic.html
docs/LOGIC-GENEALOGY-FORK.md
docs/LOGIC-FIELD-QUEEN.md
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
