# I13 Compiler Canon — Known Good

Status: **FIRST EXECUTABLE VERTICAL SLICE ACHIEVED · TAGGED WASM VALUE MODEL FROZEN KNOWN-GOOD**

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

## Wasm tagged-value law — FROZEN

`I13-WASM-VALUE-001`

```text
A VALUE SHALL RETAIN
ITS KIND AND PAYLOAD
THROUGH LOWERING.

LOWERING MAY CHANGE
REPRESENTATION.

LOWERING MAY NOT
ERASE VALUE IDENTITY.
```

The reference VM distinguishes:

```text
Value::Number(f64)
Value::Function(function_id)
```

Generated Wasm now preserves that distinction as a tagged pair:

```text
[ kind:i32 | payload:f64 ]

NUMBER   = [0 | numeric f64]
FUNCTION = [1 | function/table id]
```

Storage adds declaration state as a separate third fact:

```text
[ kind | payload | bound ]
```

The three facts are never intentionally conflated.

Generated modules expose:

```text
i13_run

i13.global.<name>   payload
i13.kind.<name>     value kind
i13.state.<name>    bound/unbound state
```

Tagged values are preserved through:

```text
Ask
Answer
function arguments
function returns
local storage
global storage
```

Operation boundaries enforce IVM value law:

```text
Bin / Cmp / If  require NUMBER
Call            requires FUNCTION
```

User functions accept and return tagged value pairs. IVM `Call` lowers through a Wasm table and `call_indirect`, preserving recursion without Rust host recursion.

## First differential hardening break — CLOSED

`I13-WASM-TYPE-001` was the first reproduced VM/Wasm semantic disagreement.

Original failing source:

```i13
def f() { -> 7 }
I OUT <- f + 1
```

Original behavior:

```text
Reference VM: E0501 Bin requires numeric operands
Generated Wasm: OUT = 1
```

Cause: the first Wasm backend flattened `Function(0)` into numeric `0.0` and lost the IVM value-kind distinction.

Repair: the Wasm backend now carries tagged `[kind | payload]` values end-to-end and stores `[kind | payload | bound]` separately.

Regression proof now passes all eight ordered attacks:

```text
1. arithmetic precedence                 PASS
2. false-path control flow               PASS
3. recursion depth 256                   PASS
4. division-by-zero runtime parity       PASS
5. function used as number               PASS · VM error = Wasm trap
6. function kind through argument        PASS · VM error = Wasm trap
7. function kind through return/global   PASS · VM error = Wasm trap
8. function used as compare operand      PASS · VM error = Wasm trap
```

The original discovery evidence remains in `docs/COMPILER-TORTURE-001.md`; the defect is now regression-locked by `scripts/compiler_torture.sh`.

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

`i13_run` resets program globals before execution so repeated calls represent fresh deterministic executions.

IVM division-by-zero behavior is preserved with an explicit Wasm guard rather than accepting native `f64.div` infinity behavior.

## Closed inherited compiler defects

The accepted compiler path now closes these inherited defects:

- `Arg` is a real HIR construct.
- unsupported `Attribute` use fails explicitly before execution.
- call arity fails during semantic checking.
- reference-VM recursion uses explicit VM frames, not Rust recursion.
- stack/control effects have one IVM authority.
- source spans and stable diagnostics exist from the front end onward.
- Wasm preserves Number versus Function value identity.

## Scope freeze during compiler construction

E1, corpus expansion, UI stages, and new conceptual modules remain **referent-only** until the compiler usable-core work is deliberately released.

They may be referenced for compatibility. They are not active construction targets.

## First acceptance target — PASSED

`examples/core.i13` is the first whole-program acceptance target because it exercises declarations, functions, arguments, calls, conditions, comparisons, arithmetic, returns, recursion, and the existing `.p` spelling.

The same source passes:

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
WASM CODEGEN COMPLETE · TAGGED VALUE MODEL
VM = WASM    KNOWN-GOOD THROUGH TORTURE-001 REGRESSION SET
CLI BUILD    COMPLETE
```

This does **not** mean the language is feature-complete. It means the first full source-to-executable compiler path is known-good inside its tested semantic boundary, including preservation of the current IVM runtime value kinds.
