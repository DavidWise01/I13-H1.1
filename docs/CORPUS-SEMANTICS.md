# I13 Golden Corpus · 02 Semantics

Status: **FROZEN KNOWN GOOD · HIR-GATED · VM/WASM VERIFIED**

ID: `I13-GOLDEN-02-SEMANTICS-RIVER-0.1`

## Purpose

`02_semantics` inherits `01_syntax` at `2584` and tests meaning rather than spelling.

```text
ATOMS      what pieces exist
SYNTAX     how those pieces may be arranged
SEMANTICS  what accepted arrangements mean
```

For the river metaphor:

```text
rocks      = atoms
riverbed   = syntax
current    = semantics
```

## Whose semantics?

I13's.

```text
SPEC
  ↓
HIR      semantic authority
  ↓
IVM      execution authority
 ╱ ╲
VM WASM  implementations required to agree
```

The corpus is evidence about that chain. It does not become a new semantic authority.

## Mathematical poetry / Ada lens

The semantic reach uses the documentary emblem:

```text
[ | ( ada ) | ]
```

and the conceptual funnel:

```text
semantics {
  ada_lens : (
    analysis,
    music(rhythm, tempo, pace, timing),
    reason
  )
}
        ~>
relations
        ~>
boolean
```

This is **mathematical poetry**: readable structure carrying geometry, symmetry, containment and conceptual intent. It is not executable I13 syntax.

The executable file `corpus/golden/02_semantics/ada_lens.i13` translates the lens into current I13 primitives—functions, numeric relations, comparisons, control and Boolean-like `0/1` results.

The name is an homage to Ada Lovelace's representational insight. It does not claim that Lovelace authored this modern stack or notation.

## Compression and interpretation

```text
meaning
  ↓ compression
analysis / timing relations
  ↓
reason / decision
  ↓
boolean
```

The inverse is interpretation, not lossless reconstruction:

```text
boolean
  ↑ interpretation
relations
  ↑
semantic context
```

A Boolean result cannot by itself reconstruct all semantic richness that was compressed into it.

## River

```text
2584 |s| 4181 |s| 6765 |s| 10946 |s| 17711 |s| 28657
     |s| 46368 |s| 75025 |s| 121393 |s| 196418
```

Semantic rocks test:

```text
00 representation identity
01 precedence
02 association / grouping
03 scope resolution
04 assignment vs osmotic binding
05 return/control meaning
06 call arity
07 named-call resolution
08 syntax-equivalent meaning
```

## Bank witnesses

Rejected programs stay attached to the relevant rock instead of pretending to emit a successful stream handoff:

```text
Function + Number  -> E0501 / Wasm trap
wrong arity        -> E0203
unknown function   -> E0202
```

## Frozen proof

The first authoritative gate completed successfully on workflow run `32052652158`, job `95455536222`.

```text
SEMANTICS 00 PASS · 2584 -> 4181
SEMANTICS 01 PASS · 4181 -> 6765
SEMANTICS 02 PASS · 6765 -> 10946
SEMANTICS 03 PASS · 10946 -> 17711
SEMANTICS 04 PASS · 17711 -> 28657
SEMANTICS 05 PASS · 28657 -> 46368
SEMANTICS 06 PASS · 46368 -> 75025
SEMANTICS 07 PASS · 75025 -> 121393
SEMANTICS 08 PASS · 121393 -> 196418
ADA LENS PASS
BANK 00 PASS · E0501 / Wasm trap
BANK 06 PASS · E0203
BANK 07 PASS · E0202
SEMANTICS RIVER PASS · HIR checkpoint · VM=WASM
```

Every successful semantic rock passes:

```text
source
  ↓
HIR introspection
  ↓
reference VM
  ↓
generated Wasm
```

`river.i13` finishes with:

```text
RIVER_START = 2584
RIVER_OK    = 1
RIVER_FINAL = 196418
```

`|s|`, `[ | ( ada ) | ]`, and `~>` remain documentary notation only.
