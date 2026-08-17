# I13 Golden Corpus · 01 Syntax

Status: **RIVER v0.1 · DOWNSTREAM OF 00 ATOMS**

`01_syntax` begins where `00_atoms` ends.

```text
00 ATOMS
0 |s| 1 |s| 1 |s| 2 |s| 3 |s| 5 |s| 8 |s| 13 |s| 21 |s| 34
                                                                    |
                                                                    v
01 SYNTAX
34 |s| 55 |s| 89 |s| 144 |s| 233 |s| 377 |s| 610 |s| 987 |s| 1597 |s| 2584
```

`|s|` is corpus stream notation only.

## What syntax is

```text
ATOMS      what pieces exist
SYNTAX     how those pieces may be legally arranged
SEMANTICS  what an accepted arrangement means
```

River analogy:

```text
atoms      rocks
syntax     riverbed / legal placement and shape
semantics  current / meaning through that shape
```

Syntax is therefore a parser/lexer-facing layer. A syntax rock changes the legal spelling, grouping, line layout or nesting of already accepted behavior without intentionally adding a new semantic identity.

## v0.1 syntax rocks

```text
34   -> 55    whitespace + blank lines + comments
55   -> 89    parenthesized grouping
89   -> 144   multiline call arguments
144  -> 233   multiline function parameters
233  -> 377   nested block shape
377  -> 610   prefix minus syntax
610  -> 987   nested calls
987  -> 1597  decimal Number spelling
1597 -> 2584  underscore/digit identifier spelling
```

## Why prefix minus belongs here

Prefix minus is a useful boundary example. It is a new source form, but the current parser desugars it into already-existing subtraction:

```text
-x
 ↓ parser
0 - x
 ↓
existing BinOp semantics
```

So the syntax surface expands while the semantic vocabulary does not.

## Boundary with semantics

`01_syntax` asks:

```text
Can this arrangement be tokenized and parsed into the existing I13 pieces?
```

`02_semantics` will ask:

```text
What does the accepted arrangement mean?
```

Examples for the semantic layer include operator precedence/association, binding/scope resolution, equivalent source shapes producing equivalent HIR/results, return/control-path meaning, runtime kind boundaries, and semantic rejection of syntactically valid programs.

## Continuity law

The syntax gate must read the upstream atom manifest and require:

```text
00_atoms.composition.final
        ==
01_syntax.inherits.handoff
        ==
01_syntax.rocks[0].RIVER_IN
        ==
34
```

The syntax composition witness must end at:

```text
RIVER_FINAL = 2584
```

This keeps the corpus one river instead of a directory taxonomy.
