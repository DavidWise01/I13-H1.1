# E1 External Primer Factory — canonical attachment

Status: **CANON / LOCKED 2026-08-16**

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

## 5. Full stack

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
              | E1.RD-001             |
              | E1.CORPUS-001         |
              | future primers...     |
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
                         I13
```

## 6. Internal implementation boundary

The Rust/Wasm core implements only the boundary contract:

- validate internal/external side crossing;
- reject same-side traversal presented as E1 crossing;
- reject any capsule marked as sharing live state;
- require nonzero request/payload identity and witness;
- provide independent `8n` width per side;
- verify that a return names the request it closes.

The factory modules and their calibration metadata remain host-side/external.
