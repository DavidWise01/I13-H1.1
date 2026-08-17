# I13 Golden Corpus · 04 Analysis

Status: **CONSTRUCTED · GATE PENDING**

ID: `I13-GOLDEN-04-ANALYSIS-0.1`

`04_analysis` inherits `03_relations` at `14930352`.

```text
SEMANTICS   meaning
   ↓
RELATIONS   explicit fit space
   ↓
<flay>      methodology / admission
════════════════════════════════
ANALYSIS    measure admitted structure
   ↓
LOGIC       decision constraints
   ↓
BOOLEAN     0 / 1 boundary
```

## I13-ANALYSIS-001

```text
ANALYSIS MAY MEASURE ADMITTED RELATIONS.
ANALYSIS MAY DERIVE VALUES FROM ADMITTED RELATIONS.
ANALYSIS MAY NOT OPEN ITS OWN GATE.
ANALYSIS MAY NOT REDEFINE FLAY ADMISSION.

A BLOCKED RELATION CARRIES
ADMITTED = 0.

AN ADMITTED RELATION CARRIES
ADMITTED = 1.

VALUE = 0 ALONE DOES NOT MEAN BLOCKED.
THE ADMISSION FLAG CARRIES VALIDITY.
```

That last distinction keeps legitimate zero-valued measurements separate from closed methodology.

## FLAY boundary

Analysis does not run around FLAY.

```text
relation candidate
      ↓
    <flay>
   /      \
no fit    fit
  │        │
  X        ▼
blocked  ADMITTED=1
           │
═══════════╪═══════════
           ▼
        analysis
```

The corpus gate executes the upstream `03_relations/flay.i13` witness first and requires `FLAY_SATISFIED = 1` before accepting the analysis reach.

## Analysis rocks

```text
14930352 |s| 24157817 |s| 39088169 |s| 63245986 |s| 102334155
         |s| 165580141 |s| 267914296 |s| 433494437 |s| 701408733
         |s| 1134903170
```

| Rock | Measurement | In | Out |
|---:|---|---:|---:|
| 00 | inherited admission | 14930352 | 24157817 |
| 01 | interval | 24157817 | 39088169 |
| 02 | signed direction | 39088169 | 63245986 |
| 03 | rhythm / repeated interval | 63245986 | 102334155 |
| 04 | rate | 102334155 | 165580141 |
| 05 | cardinal coverage | 165580141 | 267914296 |
| 06 | recursive accumulation | 267914296 | 433494437 |
| 07 | closure at origin | 433494437 | 701408733 |
| 08 | composed profile | 701408733 | 1134903170 |

These are measurements, not new semantic identities.

## Executable analysis witness

`analysis.i13` composes the reach and proves both sides of the wall:

```text
ANALYSIS_UPSTREAM_FLAY    = 1

ANALYSIS_BLOCKED_ADMITTED = 0
ANALYSIS_BLOCKED_VALUE    = 0

ANALYSIS_OPEN_ADMITTED    = 1
ANALYSIS_OPEN_VALUE       = 23

ANALYSIS_INPUT            = 13
ANALYSIS_AFTER            = 13
ANALYSIS_OK               = 1
```

The unchanged `13` witness makes the observational boundary explicit: analysis derives measurements but does not mutate the admitted relation value.

`|s|`, `<flay>`, coordinate diagrams, and the analysis wall are documentary notation only. They are not I13 grammar.
