# I13 Compiler Canon — Known Good

Status: **FROZEN FOR COMPILER CONSTRUCTION**

This document freezes only the compiler architecture already established as known-good. It does not add language features.

## Canonical authority chain

```text
SPEC
  ↓
HIR
  ↓
IVM
```

The three authorities are:

1. **Language authority** — `spec/I13.md`
2. **Semantic authority** — I13 HIR
3. **Execution authority** — IVM-13

Backends may differ. Semantics may not.

## Compiler law

```text
I13-COMPILER-001

SOURCE SYNTAX MAY DESUGAR.
THE TWELVE MAY NOT DRIFT.
IVM MAY LOWER.
SEMANTICS MAY NOT DRIFT.
BACKENDS MAY DIFFER.
RESULTS MAY NOT.
```

## Canonical pipeline

```text
.i13 source
    ↓
source + spans
    ↓
lexer
    ↓
token stream
    ↓
parser
    ↓
AST
    ↓
HIR
    ↓
semantic checker
    ↓
IVM-13
    ↓
single-pass validator
   / \
  /   \
 VM   Wasm
  \   /
   \ /
    =
```

## I13 identity

The concrete declaration keyword is `I`.

The twelve semantic words remain:

```text
Name Constant Attribute
Assign Arg Return
Expr If Compare
Call FunctionDef BinOp
```

`Block` is a container, not a thirteenth semantic word.

## Representation law

```text
AST = what the programmer physically wrote
HIR = what I13 says that writing means
IVM = executable I13
```

The parser does not define language semantics. The Wasm backend does not define language semantics.

## One execution law

Opcode stack/control effects have one definition. Validator, reference VM, and Wasm lowering consume the same IVM law rather than re-deriving it independently.

## Reference-first law

The reference VM prioritizes correctness and determinism over speed. For every conformance program:

```text
VM(program) == WASM(program)
```

A disagreement is a compiler/backend defect until proven otherwise.

## Known inherited defects to close before alpha

- `Arg` must become a real semantic construct rather than only a string stored inside `FunctionDef`.
- `Attribute` must have defined executable semantics or fail explicitly before execution.
- Function call arity must fail in semantic checking, not at runtime.
- I13 recursion must use an explicit VM call stack rather than host-language recursion.
- Stack/control effects must have one authority.
- Source spans and diagnostics are required from the beginning.

## Scope freeze during compiler construction

E1, corpus expansion, UI stages, and new conceptual modules are **referent-only** until the compiler reaches the usable vertical-slice milestone.

They may be referenced for compatibility. They are not active construction targets.

## First acceptance target

`examples/core.i13` is the first whole-program acceptance target because it exercises declarations, functions, arguments, calls, conditions, comparisons, arithmetic, returns, recursion, and the existing `.p` spelling.

The compiler milestone is reached when the same source passes:

```text
i13 check examples/core.i13
i13 run examples/core.i13
i13 build examples/core.i13 -o core.wasm
```

with reference-VM and Wasm results equivalent.
