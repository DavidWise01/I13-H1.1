# I13 Golden Corpus · 00 Atoms River v0.1

Status: **CURATED · PROGRESSIVE · VM/WASM-GATED**

Component ID: `I13-GOLDEN-00-ATOMS-RIVER-0.1`

## Purpose

`00_atoms` is the smallest progressive golden-corpus lane. Each rock adds one new executable behavior while carrying a visible numeric handoff from the previous rock.

```text
0 |s| 1 |s| 1 |s| 2 |s| 3 |s| 5 |s| 8 |s| 13 |s| 21 |s| 34
```

`|s|` is documentation-only stream notation. It is not I13 syntax.

## River law

```text
ROCK[n].RIVER_IN == ROCK[n-1].RIVER_OUT
ONE NEW BEHAVIOR PER ROCK
EVERY ROCK COMPILES INDEPENDENTLY
EVERY ROCK RUNS ON VM AND WASM
river.i13 COMPOSES THE WHOLE CURRENT INSIDE I13
```

## Rocks

```text
00 seed      declaration + constant       0  ->  1
01 name      binding read                 1  ->  1
02 binop     arithmetic                   1  ->  2
03 assign    reassignment                 2  ->  3
04 function  FunctionDef+Return+Call      3  ->  5
05 arg       function arguments           5  ->  8
06 compare   comparison result            8  -> 13
07 if        conditional control         13  -> 21
08 osmotic   .p reassignment             21  -> 34
```

Rock 04 groups FunctionDef, Return and Call because the current executable language surface cannot demonstrate those three meaningfully as independent running programs.

## Files

```text
corpus/golden/00_atoms/
  README.md
  manifest.json
  00_seed.i13
  01_name.i13
  02_binop.i13
  03_assign.i13
  04_function.i13
  05_arg.i13
  06_compare.i13
  07_if.i13
  08_osmotic.i13
  river.i13
```

The verifier is `scripts/corpus_atoms.js` and the CI gate is `.github/workflows/corpus-atoms.yml`.

## Why the river is progressive

The files are not a random bag of syntax examples. Their values intentionally form one handoff sequence, and the later rocks retain the earlier language mechanisms needed to reach the next state.

That makes the corpus useful for future I13 self-use work:

```text
source text
    ↓
rock 00
    ↓
rock 01
    ↓
...
    ↓
rock 08
```

When I13 gains bounded text/sequence capability, an I13-written scanner can be taught against the same river from the smallest source first and advance one feature at a time.

## Authority boundary

The corpus does not define I13 semantics.

```text
SPEC -> HIR -> IVM       authority
GOLDEN CORPUS             witness + regression surface
```

The host may open files, execute the compiler and compare results. The corpus behavior itself remains ordinary `.i13` source.
