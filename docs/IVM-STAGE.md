# Stage 3 — Reader + IVM-13 exploded view

Stage 3 is the first consumer of the reusable exploded-view component.

Mounted trunk module:

```text
reader
```

No Normalizer, Python, Wasm, GFX, Cortex-child, Pulse, VH1/VH2, corpus, or OLOGY trunk row is mounted to the reusable component in this stage.

## Panel

The `READER + IVM-13` row now receives an `EXPLODE` control. It is collapsed by default.

Expanded shape:

```text
INPUT
  I-13 source text
  UTF-8 source bytes + location
  demo: I out <- 4 + 2

        ↓

PIPELINE
  READ      reader v0.1 · 8/8
  HANDOFF   preserve source/provenance
  IVM-13    sidecar v0.1 · 9/9
  DECODE    canonical 15-opcode set

        ↓

STATE
  instruction pointer
  stack
  block depth
  frame

        ↓

OUTPUT
  result
  receipt
  exit state

MACHINE / RUNTIME
  canonical opcode tape
  current instruction pointer
  stack
  frame
  runtime state

CONTROLS
  RESET · STEP · RUN · AUTO
```

## Canonical IVM opcode set

The panel displays the frozen 15-opcode baseline exactly:

```text
Const Ask Attr Ret Answer Drop Bin Cmp If Call Block Else End Func Halt
```

There is no `br` opcode.

## Live trace

The panel includes a deliberately small deterministic reference trace:

```text
Const 4
Const 2
Bin +
Halt
```

Expected result:

```text
6
```

Expected steps:

```text
4
```

This trace exists to make the machine anatomy visible: IP, stack, frame, state, receipt and halt can be watched while stepping. It is a Pages visualization/reference runner over canonical opcode names; it does **not** replace or redefine the frozen IVM implementation.

## Controls

```text
RESET  restore IP=0, stack=[], READY
STEP   execute one demo instruction
RUN    execute the bounded demo to Halt
AUTO   step every ~650 ms; click again to pause
```

The existing OLOGY live lab remains unchanged and is automatically pushed downward only while the IVM panel is expanded.
