# I13 Golden Corpus · 03 Relations / FLAY

Status: **FROZEN KNOWN GOOD · HIR/VM/WASM CI-GATED**

ID: `I13-GOLDEN-03-RELATIONS-FLAY-0.1`

`03_relations` inherits `02_semantics` at `196418`.

```text
ATOMS       what pieces exist
SYNTAX      how pieces may be arranged
SEMANTICS   what accepted arrangements mean
RELATIONS   which explicit relationships carry that meaning
<flay>      methodology for testing where a chunk fits
ANALYSIS    derived measures / transformations
LOGIC       decision constraints
BOOLEAN     0 / 1 boundary
```

## FLAY

`<flay>` is I13 project methodology, not I13 source syntax.

Five unique points:

```text
              UP
             (0,1)
               |
LEFT (-1,0) -- (0,0) -- (1,0) RIGHT
               |
            (0,-1)
              DOWN
```

Ordered pass:

```text
(0,0)
  -> UP
  -> DOWN
  -> LEFT
  -> RIGHT
  -> (0,0) CLOSE
```

The repeated origin closes the five-point set; it is not a sixth unique point.

## I13-FLAY-001

```text
START AT LOCAL ORIGIN.
TEST UP / DOWN / LEFT / RIGHT.
RETURN TO LOCAL ORIGIN.

A CANDIDATE MAY BE NEW,
OR AN OLD CHUNK MAY FIT A NEW RELATION.

IF NO VALID FIT IS FOUND,
DOWNSTREAM REMAINS BLOCKED.

WHEN A FIT OPENS NEW RELATIONAL SPACE,
FLAY MAY RECUR FROM THAT LOCAL ORIGIN.
```

No directional mysticism is implied. Cardinal directions provide a deterministic four-neighbor relation set around a local anchor.

## Recursive meaning

```text
NEW CHUNK
chunk[n]
  -> FLAY
  -> valid fit
  -> chunk[n+1] at a new local origin
  -> FLAY
```

and:

```text
OLD CHUNK / NEW PLACE
same chunk
  -> UP fit
  -> recurse
  -> DOWN fit
  -> recurse
  -> LEFT fit
  -> recurse
  -> RIGHT fit
  -> close
```

Thus recursion can discover new material or re-use existing material in newly valid relationships.

## Blocking

```text
FLAY_SATISFIED = 0
        |
        X
  downstream blocked

FLAY_SATISFIED = 1
        |
        v
  downstream opens
```

The executable methodology witness is:

```text
corpus/golden/03_relations/flay.i13
```

Expected exports:

```text
FLAY_SATISFIED     = 1
FLAY_BLOCKED_VALUE = 0
FLAY_OPEN_VALUE    = 13
FLAY_OLD_OK        = 1
FLAY_NEW_OK        = 1
FLAY_OK            = 1
```

## River

```text
196418 |s| 317811 |s| 514229 |s| 832040 |s| 1346269
       |s| 2178309 |s| 3524578 |s| 5702887 |s| 9227465
       |s| 14930352
```

Nine rocks:

```text
00 origin
01 up
02 down
03 left
04 right
05 close
06 fit mask
07 recursive old chunk / new place
08 recursive new chunks + blocked/open gate
```

Every rock passed HIR introspection, reference VM execution, generated Wasm parity and repeat determinism. The composed `river.i13` exports:

```text
RIVER_START = 196418
RIVER_OK    = 1
RIVER_FINAL = 14930352
```

## Ada lens relationship

The Ada lens remains above FLAY:

```text
[ | ( ada ) | ]
      |
      v
   semantics
      |
      v
   relations
      |
      v
    <flay>
      |
      v
   analysis
      |
      v
  logic / boolean
```

`[ | ( ada ) | ]`, `<flay>`, coordinate diagrams and `|s|` are documentary mathematical notation. None are added to the I13 grammar by this component.

## Gate evidence

GitHub Actions run `32063203999`: **success**. The gate verified the nine-rock river, executable `flay.i13`, both recursion modes, blocked/open behavior, mandatory origin closure, cross-layer handoff `196418`, HIR observation, reference VM and generated Wasm.
