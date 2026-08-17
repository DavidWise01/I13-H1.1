# I13 Compiler Bootstrap v0.1

Status: **FROZEN KNOWN GOOD · I13-EXECUTED · VM/WASM PROVEN**

Component ID: `I13-BOOTSTRAP-0.1`

## Purpose

Bootstrap v0.1 begins moving compiler/runtime support logic into I13 wherever the current language surface is sufficient.

This is **I13 self-use**, not full compiler self-hosting.

```text
Rust host/compiler
      ↓
compile .i13
      ↓
examples/compiler_bootstrap.i13
      ↓
I13 law mirror + self-test
     / \
    /   \
   VM   Wasm
    \   /
     \ /
      =
```

The executable bootstrap logic is written in I13. Rust and shell/Node remain orchestration and verification hosts.

## Authority law

Canonical authority remains:

```text
SPEC -> HIR -> IVM
```

Bootstrap does not become a fourth authority.

```text
I13-BOOTSTRAP-001

IF A COMPILER OR RUNTIME LAW
CAN BE EXPRESSED IN THE CURRENT
I13 LANGUAGE SURFACE,
ITS EXECUTABLE REFERENCE PROBE
SHOULD BE WRITTEN IN I13.

HOST CODE MAY ORCHESTRATE.
HOST CODE MAY VERIFY.
HOST CODE MUST NOT PRETEND
I13 HAS CAPABILITIES IT DOES NOT HAVE.
```

The authoritative stack-effect implementation remains `src/compiler/ivm.rs`. The bootstrap is an executable mirror/witness compiled under that authority.

## What moved into I13

`examples/compiler_bootstrap.i13` now expresses and self-tests:

```text
15 frozen IVM opcode ids
15 opcode stack-need laws
15 opcode stack-net laws
Call(argc) variable stack effect
4096 active-frame Call admission
Number / Function kind gates
Bin / Compare / If numeric gates
Call function-kind gate
Answer mode validity
Answer local/global classification
deterministic whole-law checksum
```

The file contains the logic itself, rather than only data consumed by a host-language test.

## Proof outputs

The I13 program exports:

```text
BOOTSTRAP_OK       = 1
LAW_CHECKSUM       = 15638
FRAME_4095         = 1
FRAME_4096         = 0
CALL16_NEED        = 17
CALL16_NET         = -16
NUMBER_BIN_OK      = 1
FUNCTION_BIN_VETO  = 0
FUNCTION_CALL_OK   = 1
NUMBER_CALL_VETO   = 0
```

Reference VM evidence from the first proof run:

```text
VALID · IVM 15 ops · 16 region(s) · peak stack 4
RUN OK · 5946 step(s) · peak stack 4 · call depth 19
```

Generated Wasm evidence:

```text
BUILD OK · 23186 byte(s) · 48 I13 global(s)
WASM PARITY OK · 10 checked global(s) · repeat deterministic
```

The first dedicated workflow run passed all bootstrap steps.

## Host / I13 boundary

Current division of work:

```text
HOST / RUST
  source bytes + filesystem
  lexer/parser/HIR construction
  semantic checking
  IVM lowering/validation authority
  reference VM implementation
  Wasm binary encoding
  CLI / diagnostics / debugger terminal I/O
  CI orchestration

I13
  bootstrap law mirror
  opcode effect computation
  variable Call(argc) effect computation
  frame-admission probe
  tagged operation-gate probe
  Answer-mode probe
  recursive whole-law checksum
  bootstrap self-test
```

This boundary is deliberate. I13 v0.1 currently has numeric constants, names, functions, arguments, returns, arithmetic, comparisons, calls and `if` control. It does not yet provide the text/collection/I/O facilities required to implement a real lexer or parser inside I13.

## Why this is not called self-hosting

A compiler is self-hosting when enough of the compiler implementation is written in the language it compiles to rebuild/maintain that compiler path.

I13 v0.1 cannot yet honestly do that because its frozen surface does not include:

```text
strings/text values
arrays or general collections
records/structured aggregate values
file/source byte access
modules/imports
host I/O primitives
```

Adding fake host intrinsics and calling the result self-hosted would hide the boundary rather than reduce it.

Bootstrap v0.1 instead creates a measurable migration rule: move logic into I13 only when I13 can actually express it.

## CI gate

`.github/workflows/compiler-bootstrap.yml` proves:

```text
1. compiler CLI builds
2. compiler_bootstrap.i13 passes `i13 check`
3. reference VM executes BOOTSTRAP_OK=1
4. all exported proof globals match expected law
5. the same source builds to real Wasm
6. generated Wasm matches all proof globals
7. repeated Wasm execution is deterministic
8. bootstrap logic remains present in .i13 source
```

## Next bootstrap frontier

The next self-use expansion should prefer one of two directions:

```text
A. more executable compiler algorithms that already fit numeric I13
B. deliberately add the smallest language capability that unlocks materially
   more compiler code inside I13
```

The strongest candidate for B is a bounded collection/text representation, because lexer/parser self-use is blocked primarily by the inability to represent and traverse source text and token sequences.

Any such language extension must preserve the thirteen semantic identities rather than adding an accidental fourteenth semantic verb.
