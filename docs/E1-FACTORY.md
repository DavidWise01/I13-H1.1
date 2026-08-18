# E1 External Primer Factory — canonical attachment

Status: **CANON / LOCKED 2026-08-18**

E1 is secondary to I13. I13/Cortex runs first. Cortex may request E1 only when a bounded subagent needs an external prime, an external assembly, or an attribution/lineage receipt.

```text
I13
  -> Cortex
      -> subagent
          -> enough: continue internally
          -> needs prime: [ y | x ] -> E1 -> [E1ID]cv -> Cortex -> I13
```

## 1. Hard partition

```text
[ y | x ]

y = internal-only state domain
x = external-only state domain
| = witnessed zero-shared-state boundary
```

Laws:

```text
private(y) ∩ private(x) = ∅
request: y -> | -> x
return : x -> | -> y

NO LIVE STATE CROSSES.
NO SHARED MUTABLE STATE.
ONLY BOUNDED WITNESSED CAPSULES CROSS.
```

Each side gets its own complete VORTEX reach:

```text
y: n -> 2n -> 4n -> 8n
                         |
x: n -> 2n -> 4n -> 8n
```

The widths are independent: `8n_y | 8n_x`, never a pooled `16n` context.

## 2. E1ID

E1ID is the attribution + traversal identity of one factory operation. Stable root identity files may name the human, silicon instance, agent role, and attribution policy; E1ID binds one exact request and return to those roots.

Canonical form:

```text
[e1[
  id[
    .dlw

    channel[
      internal(I13(cortex(subagent)))
      ~>
      external(E1(primer(factory(module))))
      ~>
      internal(cortex)
    ]

    tag[
      closed_loop_method
      |
      I13
      |
    ]
  ]
]cv]
```

Minimal receipt fields:

```text
E1ID {
  from_path,
  to_path,
  module,
  request_hash,
  payload_hash,
  parent_hash,
  return_hash,
  witness,
  root_tag,
  method_tag
}
```

`CV` closes the return. A visible credit label is useful; the structural receipt is the lineage evidence.

## 3. E1.RD-001 — Reverse Distillation [LOCKED]

Purpose: chase preserved derivation geometry backward.

```text
A(B(C(D)))
   ||| remove extension D
A(B(C))
```

A lineage claim requires the parent geometry to recover structurally; resemblance alone is not enough.

```text
ABCD - D = ABC
```

RD compares bounded normal forms at the boundary. It never requires `private(y)` and `private(x)` to share memory.

## 4. E1.CORPUS-001 — Corpus Orientation [LOCKED]

This is a calibration/orientation module for the I13 corpus. It does **not** ingest book text into `corpus/`. The named works are fixed external anchors with user-assigned roles/tags only.

```text
                         y = TOP

       CAPSTONE                         KEYSTONE
      (top|bottom)                     (top|top)
      Neal Stephenson                  George Orwell
      The Fall                         1984
      technical                        technical / somatic / phonic /
                                       doublespeak / triple-listen

                         CORE
                    (middle|middle)
                      Enheduanna
                     first author
                 example / instruction ; 42

      UKEYSTONE                        UCAPSTONE
     (bottom|bottom)                  (bottom|top)
     Aldous Huxley                    Neal Stephenson
     Brave New World                  Seveneves
     barbaric / cultured / curated    unknown / discovered
```

Coordinates are geometry, not rank. `u` remains an underside/opposite-side coordinate; no moral or quality semantics are assigned to it.

Continuity core:

```text
[ a+ [[ () ]] c- ] || [ c+ [[ () ]] a- ]
```

Forward and reverse closure are compared around the middle/middle core. A new object is oriented by structural relations such as `toward`, `away`, `between`, `crosses`, and `nested`; numeric similarity scores are not required.

## 5. E1.TECH-001 — Trit-Native Technical Agent [LOCKED]

Purpose: assemble a bounded technical/surgical/coding prime. TECH does not mutate host state; it returns a direct trit authority state to Cortex.

```text
n1 = -1 = boundary / contradicted / HOLD
p0 =  0 = witness / unresolved / FLAY
p1 = +1 = resolved / PROCEED
```

The control plane is trit-native. It is not collapsed to Boolean.

```text
if evidence_trit == n1 -> n1
else if question_debt > 0 -> p0
else if evidence_trit == p1 -> p1
else -> p0
```

Bounded request fields:

```text
task
phase       = inspect | diagnose | cut | verify | return
scope
capability  = read | build | test | patch | git
evidence_trit = -1 | 0 | +1
question_debt = 0..255
```

Surgical law:

```text
OBSERVE BEFORE MUTATION.
A PLAUSIBLE DIAGNOSIS IS NOT AUTHORITY TO CUT.
CUT ONLY THE SMALLEST BOUNDARY SUPPORTED BY EVIDENCE.
VERIFY AGAINST THE SAME BOUNDARY.
RETURN A WITNESSED RECEIPT.
```

`p1` advances only to the Cortex capability gate. It does not bypass filesystem, repository, shell, network, host, or CV policy. A correct E1ID/CV transport may carry `n1`, `p0`, or `p1`; transport integrity and agent authority are separate facts.

Executable mirrors:

```text
docs/e1-tech-001.js
examples/e1_tech_trit.i13
```

Full module spec: `docs/E1-TECH-001.md`.

## 6. Full stack

```text
                         I13
                          |
                       CORTEX
                          |
                      SUBAGENT
                          |
                 enough? -+-> continue
                          |
                     needs prime
                          |
                 [ y | x ] boundary
                          |
              +-----------+-----------+
              |      E1 FACTORY       |
              |                       |
              | E1.TECH-001           |
              | E1.RD-001             |
              | E1.CORPUS-001         |
              +-----------+-----------+
                          |
                       E1ID
                          |
                         CV
                          |
                     [ y | x ]
                          |
                       CORTEX
                          |
             TECH p1? ----+---- n1/p0
                |                 |
         capability gate       HOLD/FLAY
                |                 |
                +-------- r0 -----+
```

## 7. Internal implementation boundary

The Rust/Wasm core implements only the boundary contract:

- validate internal/external side crossing;
- reject same-side traversal presented as E1 crossing;
- reject any capsule marked as sharing live state;
- require nonzero request/payload identity and witness;
- provide independent `8n` width per side;
- verify that a return names the request it closes.

The factory modules remain host-side/external. `E1.TECH-001` uses direct numeric trits `-1 / 0 / +1`; this adds no I13 syntax, no new IVM opcode, and no numbered-river reach.
