# I13 Golden Corpus · 05 Logic

Status: **CANON CANDIDATE · ANALYSIS-GATED · FOUR-STATE DECISION · BOOLEAN-DOWNSTREAM**

ID: `I13-GOLDEN-05-LOGIC-0.1`

Inherits exactly:

```text
04_analysis final = 1134903170
05_logic start    = 1134903170
```

## Logic 0 Day

`LOGIC 0 DAY` is a **symbolic project epoch** pinned to Aristotle leaving Plato's Academy around **347 BCE**, after Plato's death.

The exact calendar day is not known and the project does not claim one. Nor does it claim a single proven personal motive for Aristotle's departure.

The historically grounded pressure behind the symbol is Academy dialectic: questioner / answerer, concessions, repeated opposition, attempted contradiction and refutation across changing subject matter.

```text
ACADEMY DIALECTIC
      |
      | opposition / refutation pressure
      v
  LOGIC 0 DAY
      |
      +---------------------------+
      |                           |
      v                           v
ARISTOTLE FORK              DIALECTICAL TRUNK
form / analytics            proposition / consequence
```

Aristotle is therefore a **fork/burrow**, not the whole trunk of Logic.

## I13-LOGIC-001

```text
LOGIC CONSUMES ADMITTED ANALYSIS EVIDENCE.
LOGIC MAY NOT OPEN ITS OWN EVIDENCE GATE.
LOGIC MAY NOT MUTATE THE ANALYSIS EVIDENCE IT CONSUMES.

OPPOSITION MAY CREATE PRESSURE OR REFUTATION.
OPPOSITION ALONE DOES NOT CREATE TRUTH.

THE ARISTOTLE FORK PRESERVES FORM ACROSS CHANGED PARTICULARS.
THE DIALECTICAL / STOIC FORK PRESERVES CONSEQUENCE ACROSS STATES.

I13 LOGIC MAY FLAY THESE FORKS TOGETHER:
PRESERVE FORM WHILE TRAVERSING CONSEQUENCE.

LOGIC OPERATES LOCALLY OVER A BOUNDED VOXEL / VECTOR FIELD.
THE LOCAL FIELD HAS FOUR STATES: II / IO / OI / OO.
Q IS THE QUEEN RIDER.
Q MAY TRAVERSE RECURSIVE LOCAL FIELDS WITHOUT EXPANDING THE WHOLE 4^n SPACE.

A LOGIC DECISION MUST CARRY VALIDITY SEPARATELY FROM ITS STATE.
LOGIC DOES NOT COLLAPSE ITS FOUR-STATE DECISION TO BOOLEAN.
BOOLEAN IS DOWNSTREAM.
```

## Opposition pressure

Project notation:

```text
opposite(opposite(opposite(x)))
```

is encoded as a recursive state flip. Three flips produce the opposite of the start; two return to the start. This models repeated dialectical opposition, not an oracle for truth.

## Fork synthesis

```text
ARISTOTLE FORK
changed particulars
      |
      v
preserved relational FORM

DIALECTICAL / STOIC FORK
current state
      |
      v
licensed CONSEQUENCE
      |
      v
next state
```

I13 synthesis:

```text
PRESERVE FORM
      |
      v
TRAVERSE CONSEQUENCE
```

The historical genealogy and counterfactual notes remain documented in `docs/LOGIC-GENEALOGY-FORK.md` and are not themselves I13 syntax.

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

Executable state encoding:

```text
II = 0
IO = 1
OI = 2
OO = 3
```

Documentary recursive notation:

```text
[(/ 2 ^ 2 \)]^n
```

This notation is not I13 grammar.

## Q = Queen

The Queen is the field rider.

```text
Q[
  voxel,
  vector,
  backpack = [(/2^2\)]^n,
  sweep = 360,
  phase = t + .0001
]
```

`360` is a project sweep/orientation convention. `.0001` is a phase increment. Neither is an extra Boolean choice axis.

The executable witness keeps:

```text
LOCAL CHOICE = 4
GLOBAL POSSIBILITY = 4^n
```

without materializing the complete global field.

## Tagged decision

A decision state of `0` is legitimate (`II`), so zero cannot mean blocked.

Documentary state:

```text
[ valid | decision ]

[ 0 | -1 ]  blocked / no decision
[ 1 |  0 ]  valid II
[ 1 |  1 ]  valid IO
[ 1 |  2 ]  valid OI
[ 1 |  3 ]  valid OO
```

The canonical composed witness currently yields:

```text
LOGIC_VALID    = 1
LOGIC_DECISION = 2
```

while preserving:

```text
LOGIC_EVIDENCE_INPUT = 23
LOGIC_EVIDENCE_AFTER = 23
```

## Nine rocks

```text
00 ZERO DAY
01 OPPOSITION
02 FORM
03 CONSEQUENCE
04 VOXEL
05 VECTOR
06 CHOICE
07 QUEEN
08 DECISION
```

River:

```text
1134903170 |s| 1836311903 |s| 2971215073 |s| 4807526976
           |s| 7778742049 |s| 12586269025 |s| 20365011074
           |s| 32951280099 |s| 53316291173 |s| 86267571272
```

Current handoff candidate: `86267571272`.

The reach becomes **FROZEN KNOWN GOOD** only after HIR / VM / Wasm CI proves every rock, the composed method, upstream Analysis inheritance, evidence preservation, Queen recursion and the complete river.
