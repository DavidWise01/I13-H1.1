# I13 Golden Corpus · 05 Logic

ID: `I13-GOLDEN-05-LOGIC-0.1`

Canonical law: `I13-LOGIC-001`

## Logic 0 Day

I13 pins **Logic 0 Day** symbolically to Aristotle leaving Plato's Academy around **347 BCE**.

This is an architectural epoch, not a claim that the literal calendar day is known. Historical sources establish the broad timing after Plato's death, while possible reasons for Aristotle's departure remain debated.

The intellectual pressure used by the corpus is better documented: Academy dialectic repeatedly placed a thesis under question-and-answer examination, seeking concessions from which contradiction/refutation could be produced.

```text
PLATO / ACADEMY DIALECTIC
        |
        | repeated opposition / refutation
        v
    LOGIC 0 DAY
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

Aristotle is a fork/burrow, not the sole trunk.

## Law

```text
LOGIC CONSUMES ADMITTED ANALYSIS EVIDENCE.
LOGIC MAY NOT OPEN ITS OWN EVIDENCE GATE.
LOGIC MAY NOT MUTATE ITS ANALYSIS EVIDENCE.

OPPOSITION MAY CREATE PRESSURE OR REFUTATION.
OPPOSITION ALONE DOES NOT CREATE TRUTH.

THE ARISTOTLE FORK PRESERVES FORM.
THE DIALECTICAL / STOIC FORK PRESERVES CONSEQUENCE.
I13 FLAYS BOTH: PRESERVE FORM WHILE TRAVERSING CONSEQUENCE.

LOCAL LOGIC IS A VOXEL / VECTOR CHOICE FIELD.
LOCAL CHOICE HAS FOUR STATES: II / IO / OI / OO.
Q IS THE QUEEN RIDER.
Q CARRIES THE RECURSIVE FIELD LAW [(/2^2\)]^n.

DECISION VALIDITY IS SEPARATE FROM DECISION STATE.
BOOLEAN IS DOWNSTREAM.
```

## Four-state field

```text
             VECTOR
             IN    OUT
VOXEL IN     II    IO
VOXEL OUT    OI    OO

II = 0
IO = 1
OI = 2
OO = 3
```

The numeric encoding is implementation witness state, not a claim that these four states are Boolean truth values.

## Queen

```text
Q[
  voxel,
  vector,
  backpack = [(/2^2\)]^n,
  2D = 1.00 local coverage,
  3D = 1.00 x 360,
  4D = 1.00 x 360 x .0001 ~> { t + .0001 }
]
```

`360` is sweep/orientation and `.0001` is phase progression under I13 project geometry conventions.

## Tagged output

```text
[ valid | decision ]

[0|-1] blocked / no decision
[1|0]  valid II
[1|1]  valid IO
[1|2]  valid OI
[1|3]  valid OO
```

This prevents valid state `0` from being confused with failure.

Canonical method witness:

```text
LOGIC_EVIDENCE_INPUT = 23
LOGIC_EVIDENCE_AFTER = 23
LOGIC_VALID          = 1
LOGIC_DECISION       = 2
LOGIC_BLOCKED_VALID  = 0
LOGIC_BLOCKED_DECISION = -1
```

## River

```text
1134903170 |s| 1836311903 |s| 2971215073 |s| 4807526976
           |s| 7778742049 |s| 12586269025 |s| 20365011074
           |s| 32951280099 |s| 53316291173 |s| 86267571272
```

Nine rocks:

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

The executable source lives at `corpus/golden/05_logic/`.

Historical fork notes: `docs/LOGIC-GENEALOGY-FORK.md`.
Queen precursor notes: `docs/LOGIC-FIELD-QUEEN.md`.
Plato remains the non-river epistemic keystone above Logic: `docs/KEYSTONE-PLATO.md`.
