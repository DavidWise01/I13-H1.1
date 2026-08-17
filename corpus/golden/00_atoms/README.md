# I13 Golden Corpus · 00 Atoms

Status: **RIVER v0.1 · CURATED · PROGRESSIVE**

`00_atoms` is the smallest golden-corpus layer: each rock introduces the minimum new executable I13 behavior that is useful to distinguish and freeze.

These are not disconnected unit-test pebbles. They form one progressive river.

```text
0 |s| 1 |s| 1 |s| 2 |s| 3 |s| 5 |s| 8 |s| 13 |s| 21 |s| 34
```

`|s|` means **stream handoff in corpus documentation**. It is not I13 syntax.

## River law

```text
ROCK[n].RIVER_IN  == ROCK[n-1].RIVER_OUT
ROCK[n] adds one new behavior
ROCK[n] remains independently compilable
river.i13 composes the same handoffs inside I13
```

The host harness may load files, invoke the compiler and compare results. The semantic work represented by each rock stays in `.i13` source.

## Rocks

| Rock | File | Adds | In | Out |
|---:|---|---|---:|---:|
| 00 | `00_seed.i13` | declaration + numeric constant | 0 | 1 |
| 01 | `01_name.i13` | name read / binding lookup | 1 | 1 |
| 02 | `02_binop.i13` | arithmetic `BinOp` | 1 | 2 |
| 03 | `03_assign.i13` | reassignment | 2 | 3 |
| 04 | `04_function.i13` | minimal executable FunctionDef + Return + Call passage | 3 | 5 |
| 05 | `05_arg.i13` | function arguments | 5 | 8 |
| 06 | `06_compare.i13` | comparison result | 8 | 13 |
| 07 | `07_if.i13` | conditional control | 13 | 21 |
| 08 | `08_osmotic.i13` | `.p` osmotic reassignment | 21 | 34 |

Some semantic identities are inseparable in a minimal executable example. Rock 04 therefore introduces FunctionDef, Return and Call as one passage rather than pretending they can execute independently.

## Composition witness

`river.i13` walks all nine rocks in one I13 program and exports:

```text
RIVER_OK    = 1
RIVER_FINAL = 34
```

The manifest is `manifest.json`. CI checks every rock on the reference VM and generated Wasm, verifies each expected output, verifies every adjacent handoff, and runs the composed I13 river.
