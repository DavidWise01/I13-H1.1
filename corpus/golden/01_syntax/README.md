# I13 Golden Corpus · 01 Syntax

Status: **RIVER v0.1 · CURATED · PROGRESSIVE**

`01_syntax` inherits the final handoff from `00_atoms` and changes **source shape**, not language meaning.

```text
00 ATOMS                         01 SYNTAX
what pieces exist               how those pieces may be arranged

... |s| 21 |s| 34               34 |s| 55 |s| 89 |s| ...
                    \           /
                     SAME RIVER
```

The first syntax rock must therefore begin with:

```text
RIVER_IN = 34
```

## Layer law

```text
ATOMS      = smallest accepted executable pieces
SYNTAX     = legal arrangements of those already-proven pieces
SEMANTICS  = meaning assigned to accepted arrangements
```

Or as river geometry:

```text
atoms      = rocks
syntax     = riverbed / legal placement
semantics  = current / meaning through the placement
```

`01_syntax` must not invent a new semantic identity. It exercises lexer/parser shapes that lower into behavior already present in the accepted core.

## Syntax rocks

| Rock | File | Adds source shape | In | Out |
|---:|---|---|---:|---:|
| 00 | `00_whitespace_comments.i13` | spaces, blank lines, comments | 34 | 55 |
| 01 | `01_grouping.i13` | parenthesized expression | 55 | 89 |
| 02 | `02_multiline_call.i13` | call arguments across lines | 89 | 144 |
| 03 | `03_multiline_params.i13` | function parameters across lines | 144 | 233 |
| 04 | `04_nested_blocks.i13` | nested `{ ... }` control shape | 233 | 377 |
| 05 | `05_prefix_minus.i13` | prefix `-` desugared to existing subtraction | 377 | 610 |
| 06 | `06_nested_calls.i13` | call expression inside call argument | 610 | 987 |
| 07 | `07_decimal_literal.i13` | decimal spelling of existing Number constant | 987 | 1597 |
| 08 | `08_identifier_shape.i13` | underscore/digit identifier spelling | 1597 | 2584 |

The values continue the same Fibonacci-like current established by `00_atoms`.

## Boundary with semantics

Syntax answers:

```text
Can this source shape be tokenized and parsed into the existing language pieces?
```

Semantics will answer stronger questions such as:

```text
Do two different legal shapes mean the same thing?
Which binding does a name resolve to?
What is the precedence/association meaning of an operator chain?
Which Return/control path determines the result?
When must a legal parse be rejected by semantic checking?
```

A syntax rock may use existing meaning to stay executable, but its **new delta is source arrangement only**.

## Composition witness

`river.i13` composes the syntax rocks after the inherited atom handoff and must export:

```text
RIVER_START = 34
RIVER_OK    = 1
RIVER_FINAL = 2584
```

`|s|` remains corpus documentation only and is not I13 syntax.
