# I13 Golden Corpus · 03 Relations · FLAY

Status: **FROZEN KNOWN GOOD · HIR/VM/WASM CI-GATED**

ID: `I13-GOLDEN-03-RELATIONS-FLAY-0.1`

`03_relations` inherits the final semantic handoff `196418` and lowers meaning into explicit relationships. Its methodology is `<flay>`.

```text
00 ATOMS        pieces
01 SYNTAX       arrangement
02 SEMANTICS    meaning
03 RELATIONS    explicit relationships
       |
       v
    <flay>      disciplined fitting method
       |
       v
    analysis
       |
       v
  logic / boolean
```

## FLAY is a five-point method

The five unique points are the local origin and its four cardinal relations:

```text
              UP
             (0,1)
               |
               |
LEFT (-1,0) -- (0,0) -- (1,0) RIGHT
               |
               |
            (0,-1)
              DOWN
```

A pass is ordered:

```text
START (0,0)
    |
    v
UP
    |
    v
DOWN
    |
    v
LEFT
    |
    v
RIGHT
    |
    v
CLOSE (0,0)
```

The return to `(0,0)` closes the five-point relation set. It is not a sixth unique point.

Mnemonic documentary form:

```text
<flay>
[ \ . . . . . / ]
```

`<flay>`, `[ \ . . . . . / ]`, coordinate diagrams, and `|s|` are documentary notation. They are not I13 syntax.

## Methodology law

```text
I13-FLAY-001

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

FLAY does not assign mystical meaning to directions. The four directions are a compact deterministic neighborhood around a local anchor.

## Recursive fitting

Two recursive cases are explicitly tested:

```text
NEW CHUNK
current local origin
    -> fit candidate
    -> candidate becomes next local chunk
    -> flay again
```

and:

```text
OLD CHUNK / NEW PLACE
same chunk
    -> fits UP in one pass
    -> fits DOWN in another
    -> fits LEFT
    -> fits RIGHT
    -> closes at origin
```

The second case is important: recursion is not synonymous with creating new material. Existing material may become valid in a newly exposed relation.

## Blocking law

```text
flay not satisfied
        |
        X  downstream blocked

flay satisfied
        |
        v
     downstream
```

The executable `flay.i13` exposes both cases:

```text
FLAY_BLOCKED_VALUE = 0
FLAY_OPEN_VALUE    = 13
FLAY_SATISFIED     = 1
FLAY_OK            = 1
```

## River rocks

```text
196418 |s| 317811 |s| 514229 |s| 832040 |s| 1346269
       |s| 2178309 |s| 3524578 |s| 5702887 |s| 9227465
       |s| 14930352
```

| Rock | Meaning | In | Out |
|---:|---|---:|---:|
| 00 | local origin `(0,0)` | 196418 | 317811 |
| 01 | UP relation `(0,1)` | 317811 | 514229 |
| 02 | DOWN relation `(0,-1)` | 514229 | 832040 |
| 03 | LEFT relation `(-1,0)` | 832040 | 1346269 |
| 04 | RIGHT relation `(1,0)` | 1346269 | 2178309 |
| 05 | close / return to `(0,0)` | 2178309 | 3524578 |
| 06 | fit mask over four relations | 3524578 | 5702887 |
| 07 | recursive old chunk / new place | 5702887 | 9227465 |
| 08 | recursive new chunks + blocked/open gate | 9227465 | 14930352 |

## Relationship to Ada lens

The Ada lens remains an interpretive design lens upstream. FLAY is the methodology beneath relations:

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
   boolean
```

The historical Ada references remain an homage to representational and relational thinking; FLAY itself is an I13 project methodology, not a historical claim about Ada Lovelace.

## CI evidence

First full gate: GitHub Actions run `32063203999`, conclusion **success**. It verified all nine rocks, the executable methodology witness, recursive reuse, recursive new chunks, origin closure, HIR checkpoints, reference VM execution, generated Wasm parity, repeat determinism and cross-reach continuity from `02_semantics`.
