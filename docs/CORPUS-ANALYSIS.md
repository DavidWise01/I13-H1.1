# I13 Golden Corpus · 04 Analysis

Status: **FROZEN KNOWN GOOD · UPSTREAM-FLAY-GATED · HIR/VM/WASM VERIFIED**

ID: `I13-GOLDEN-04-ANALYSIS-0.1`

## Position

```text
[ | ( ada ) | ]
      ↓
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

Analysis begins only after the Relations/FLAY reach has admitted a local fit.

## I13-ANALYSIS-001

```text
ANALYSIS MAY MEASURE ADMITTED RELATIONS.
ANALYSIS MAY DERIVE VALUES FROM ADMITTED RELATIONS.
ANALYSIS MAY NOT OPEN ITS OWN GATE.
ANALYSIS MAY NOT REDEFINE FLAY ADMISSION.
ANALYSIS MAY NOT MUTATE THE ADMITTED RELATION.
```

Admission and measurement remain distinct:

```text
[ admitted | value ]

[ 0 | 0 ]  closed witness
[ 1 | 0 ]  valid zero measurement
[ 1 | x ]  valid nonzero measurement
```

Therefore `value == 0` does not by itself mean blocked.

## Measurements

The first reach deliberately stays small:

```text
admission
interval
signed direction
rhythm / repeated interval
rate
cardinal coverage
recursive accumulation
closure
composed profile
```

These operations derive facts from accepted relational structure. They do not rename or reinterpret the upstream semantic object.

## Upstream proof

The analysis gate executes `corpus/golden/03_relations/flay.i13` before the analysis corpus and requires:

```text
FLAY_SATISFIED = 1
FLAY_OPEN_VALUE = 13
FLAY_OK = 1
```

Only then are analysis rocks certified.

## River

```text
14930352 |s| 24157817 |s| 39088169 |s| 63245986 |s| 102334155
         |s| 165580141 |s| 267914296 |s| 433494437 |s| 701408733
         |s| 1134903170
```

The composed witness finishes with:

```text
RIVER_START = 14930352
RIVER_OK    = 1
RIVER_FINAL = 1134903170
```

## Executable method witness

`analysis.i13` proves:

```text
ANALYSIS_BLOCKED_ADMITTED = 0
ANALYSIS_BLOCKED_VALUE    = 0
ANALYSIS_OPEN_ADMITTED    = 1
ANALYSIS_OPEN_VALUE       = 23
ANALYSIS_INPUT            = 13
ANALYSIS_AFTER            = 13
ANALYSIS_OK               = 1
```

The unchanged input is the non-mutation witness.

## Frozen proof

GitHub Actions run `32069931782`: **success**.

```text
UPSTREAM FLAY PASS
ANALYSIS 00..08 PASS
ANALYSIS METHOD PASS
ANALYSIS RIVER PASS
HIR checkpoint
VM = WASM
repeat deterministic
```

`[ admitted | value ]`, `<flay>`, the wall diagrams, `[ | ( ada ) | ]`, and `|s|` are documentary notation; they do not extend I13 grammar.
