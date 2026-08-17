# I13 Golden Corpus · 02 Semantics

Status: **RIVER v0.1 · FROZEN KNOWN GOOD · PROGRESSIVE**

`02_semantics` inherits the final handoff from `01_syntax` and changes the question from **what can be written?** to **what does an accepted program mean?**

```text
00 ATOMS        01 SYNTAX        02 SEMANTICS        03 RELATIONS
pieces          arrangement      meaning             explicit fit/method
rocks           riverbed         current             FLAY downstream
   \               |               |                    /
                    SAME RIVER
```

The first semantic rock begins with `RIVER_IN = 2584`; the final semantic handoff is `196418`, now inherited exactly by `03_relations`.

## Semantic authority

```text
SPEC
  ↓
HIR   <- semantic checkpoint
  ↓
IVM   <- execution authority
 ╱ ╲
VM WASM
```

The corpus observes and tests this authority; it does not replace it.

## Ada lens · mathematical poetry

```text
[ | ( ada ) | ]

semantics {
  ada_lens : (
    analysis,
    music(rhythm, tempo, pace, timing),
    reason
  )
}
```

`[ | ( ada ) | ]` is documentary mathematical poetry, not I13 syntax. The executable companion `ada_lens.i13` models the lens with current I13 numbers, comparisons, functions and control.

The name `ada_lens` is a design homage to Ada Lovelace's representational insight; it is not a historical claim that she authored this modern stack.

## Downstream methodology

The methodology boundary now belongs to `03_relations`:

```text
semantics
   ↓ 196418
relations
   ↓
<flay>
   ↓
analysis
   ↓
logic / boolean
```

`<flay>` is a deterministic local fitting discipline defined downstream: `(0,0) -> UP -> DOWN -> LEFT -> RIGHT -> (0,0) CLOSE`, recursive for new chunks or old chunks that fit somewhere newly exposed, and blocked until satisfied.

## Semantic rocks

| Rock | File | Meaning under test | In | Out |
|---:|---|---|---:|---:|
| 00 | `00_representation.i13` | value identity survives binding/call/return | 2584 | 4181 |
| 01 | `01_precedence.i13` | `*` binds inside `+` before comparison | 4181 | 6765 |
| 02 | `02_association.i13` | left association differs from explicit grouping | 6765 | 10946 |
| 03 | `03_scope.i13` | function parameter shadows same-named global | 10946 | 17711 |
| 04 | `04_binding_modes.i13` | assignment replaces; `.p` accumulates | 17711 | 28657 |
| 05 | `05_return_control.i13` | taken Return determines result; fallback remains reachable | 28657 | 46368 |
| 06 | `06_arity.i13` | declared arity defines legal named Call | 46368 | 75025 |
| 07 | `07_named_call.i13` | known function names resolve; unknown names are rejected | 75025 | 121393 |
| 08 | `08_equivalence.i13` | different legal source shapes may preserve one result | 121393 | 196418 |

```text
2584 |s| 4181 |s| 6765 |s| 10946 |s| 17711 |s| 28657
     |s| 46368 |s| 75025 |s| 121393 |s| 196418
```

## Attached veto witnesses

```text
00_representation_veto.i13  -> E0501 runtime kind veto
06_arity_veto.i13           -> E0203 semantic arity veto
07_unknown_veto.i13         -> E0202 semantic unknown-function veto
```

These are bank witnesses: they constrain the same river without pretending failure is a successful handoff.

## Composition witness

`river.i13` exports:

```text
RIVER_START = 2584
RIVER_OK    = 1
RIVER_FINAL = 196418
```

`|s|`, `[ | ( ada ) | ]`, `<flay>`, and `~>` remain documentary notation only.
