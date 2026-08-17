# I13 Compiler Canon — Known Good

Status: **FIRST EXECUTABLE VERTICAL SLICE ACHIEVED · FROZEN KNOWN-GOOD WITH ONE OPEN DIFFERENTIAL BREAK**

This document freezes only compiler architecture and behavior proven by the compiler conformance path. It does not add language features.

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

The frozen IVM opcode surface remains exactly:

```text
Const Ask Attr Ret Answer Drop Bin Cmp If Call Block Else End Func Halt
```

## Reference-first law

The reference VM prioritizes correctness and determinism over speed. For every conformance program:

```text
VM(program) == WASM(program)
```

A disagreement is a compiler/backend defect until proven otherwise.

## First differential hardening break — OPEN

`I13-WASM-TYPE-001` is the first reproduced VM/Wasm semantic disagreement discovered by the ordered torture harness.

The first four attacks passed:

```text
arithmetic precedence
false-path control flow
recursion depth 256
division-by-zero runtime parity
```

The fifth attack broke parity:

```i13
def f() { -> 7 }
I OUT <- f + 1
```

Reference VM:

```text
E0501 Bin requires numeric operands
```

Generated Wasm:

```text
i13.global.f   = 0
i13.global.OUT = 1
```

Cause: the VM preserves `Number` versus `Function` as distinct runtime value kinds, while the current Wasm global payload plane stores both as `f64` and therefore loses the function-value tag before numeric operations.

Known-good Wasm parity is therefore bounded to the tested numeric/control/call subset and does **not** claim parity for function-valued names flowing into numeric operators.

Evidence and attack order are recorded in `docs/COMPILER-TORTURE-001.md`. The defect is intentionally not repaired in the discovery pass.

## Compiler-owned Wasm law

The production backend consumes **validated IVM**, not HIR and not AST.

```text
validated IVM
      ↓
compiler/wasm.rs
      ↓
WebAssembly binary
```

The backend is dependency-free and emits the WebAssembly binary format directly.

Generated modules currently expose:

```text
i13_run

i13.global.<name>
i13.state.<name>
```

`i13_run` resets program globals before execution so repeated calls represent fresh deterministic executions.

I13 function handles lower to Wasm table indices. IVM `Call` lowers through `call_indirect`, allowing recursive generated Wasm without Rust host recursion.

IVM division-by-zero behavior is preserved with an explicit Wasm guard rather than accepting native `f64.div` infinity behavior.

## Closed inherited compiler defects

The first vertical slice closes these inherited defects on the accepted compiler path:

- `Arg` is a real HIR construct.
- unsupported `Attribute` use fails explicitly before execution.
- call arity fails during semantic checking.
- reference-VM recursion uses explicit VM frames, not Rust recursion.
- stack/control effects have one IVM authority.
- source spans and stable diagnostics exist from the front end onward.

## Scope freeze during compiler construction

E1, corpus expansion, UI stages, and new conceptual modules remain **referent-only** until the compiler usable-core work is deliberately released.

They may be referenced for compatibility. They are not active construction targets.

## First acceptance target — PASSED

`examples/core.i13` is the first whole-program acceptance target because it exercises declarations, functions, arguments, calls, conditions, comparisons, arithmetic, returns, recursion, and the existing `.p` spelling.

The same source now passes:

```text
i13 check examples/core.i13
i13 run examples/core.i13
i13 build examples/core.i13 -o core.wasm
```

The generated Wasm module is validated and instantiated by Node's WebAssembly engine, executes `i13_run`, and matches the reference VM acceptance values:

```text
CORE_OK = 1
ROUTES  = 56
```

The parity test executes the same generated module twice and requires the same values on both runs.

## Current compiler status

```text
SOURCE       COMPLETE
LEXER        COMPLETE
PARSER       COMPLETE
AST          COMPLETE
HIR          COMPLETE
SEMANTIC     COMPLETE
IVM          COMPLETE
VALIDATOR    COMPLETE
REFERENCE VM COMPLETE
CLI CHECK    COMPLETE
CLI RUN      COMPLETE
WASM CODEGEN COMPLETE · FIRST ACCEPTANCE SLICE
VM = WASM    BOUNDED KNOWN-GOOD · I13-WASM-TYPE-001 OPEN
CLI BUILD    COMPLETE
```

This does **not** mean the language is feature-complete. It means the first full source-to-executable compiler path is known-good inside its tested semantic boundary, and the first differential failure now marks the next hardening seam.
