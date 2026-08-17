# Base 11 · FLAY r0 Traversal

Status: **NON-RIVER TRAVERSAL PRIMITIVE · EXECUTABLE WITNESS**

`Base 11` is project terminology for a recursive traversal discipline. It is **not radix-11 arithmetic**.

## Local mnemonic

```text
5 outward
+ r0 home
+ 5 return
= 11 positions
```

The point is not the numeral eleven by itself. The invariant is that exploration always retains a route home.

```text
OUT → OUT → OUT → OUT → OUT → r0 ← RETURN ← RETURN ← RETURN ← RETURN ← RETURN
```

## Recursive FLAY arm

A single FLAY arm may itself contain another complete FLAY, recursively:

```text
Flay(
  flay(
    flay(
      ...
        r0
      ...
    )
  )
)
```

`r0` is local to the current frame. The nesting supplies parentage; no new I13 record syntax is implied.

## Two counters

The executable model keeps only two monotonic traversal counters:

```text
DOWN = recursive frames entered
UP   = recursive frames unwound

LIVE_DEPTH = DOWN - UP
```

Closure requires:

```text
at r0
AND DOWN == UP
AND required ? count == 0
```

This makes a deep recursive journey auditable without flattening the whole field.

## Compact tracker

Documentary form:

```text
Vector[
  voxel[
    r0
  ]
]
```

Interpretation:

```text
Vector = how this frame is entered / left
voxel  = the local working volume
r0     = local home / return invariant
```

The same shape nests at every depth.

## Dust

`dust` means no further distinction is required at the current purpose/resolution. It does **not** claim that nothing more could ever be asked.

```text
burrow
  ↓
distinguish
  ↓
resolve required ?
  ↓
if more required: FLAY again
  ↓
if dust: unwind to local r0
```

## Stress witness

`corpus/golden/base11_flay_r0.i13` proves a bounded example in current I13:

```text
5 FLAY arms
× 1000 recursive frames per arm
= 5000 DOWN
= 5000 UP

LIVE_DEPTH = 0
QUESTIONS  = 0
R0         = 1
BASE11_OK  = 1
```

The 1000-frame arm remains inside the frozen I13 4096-frame execution law.

This primitive is an aside to Logic and FLAY. It does not modify the frozen six-reach golden river or add language syntax.
