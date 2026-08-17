# I13 Compiler Canon — Known Good

Status: **EXECUTABLE VERTICAL SLICE · TAGGED VALUE MODEL FROZEN · I13 FRAME LAW FROZEN · KNOWN-GOOD THROUGH 29 DIFFERENTIAL ATTACKS · ONE OPEN STEP-BUDGET BREAK**

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

The reference VM prioritizes correctness and determinism over speed. For every conformance program inside the canonical execution boundary:

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

Generated Wasm preserves that distinction as:

```text
[ kind:i32 | payload:f64 ]

NUMBER   = [0 | numeric f64]
FUNCTION = [1 | function/table id]
```

Stored bindings retain three independent facts:

```text
[ kind | payload | bound ]
```

Tagged values are preserved through `Ask`, `Answer`, arguments, returns, local storage, and global storage.

Operation boundaries enforce:

```text
Bin / Cmp / If  require NUMBER
Call            requires FUNCTION
```

`I13-WASM-TYPE-001` is closed and regression-locked. Original evidence remains in `docs/COMPILER-TORTURE-001.md`.

## Canonical frame law — FROZEN

`I13-EXEC-LIMIT-001`

```text
I13_FRAME_LIMIT = 4096
```

This is part of I13, not host policy.

The count includes the main/root frame. A `Call` is legal only when pushing the callee keeps active I13 frames at or below `4096`.

```text
root/main = 1

current_frames < 4096
        ↓
      Call
        ↓
current_frames += 1

current_frames >= 4096
        ↓
      Call
        ↓
      VETO
```

The IVM layer owns `I13_FRAME_LIMIT`. The reference VM cannot raise its execution ceiling above it. Generated Wasm owns a private frame-depth counter, resets it to `1` at each `i13_run`, checks the canonical limit before every `call_indirect`, increments before a legal call, and decrements after a successful return.

The former `I13-WASM-LIMIT-002` disagreement is closed:

```text
count(4094)  VM PASS  == Wasm PASS
count(4095)  VM VETO  == Wasm TRAP
count(4096)  VM VETO  == Wasm TRAP
```

The frame law is hard-regression-gated in the normal compiler/Wasm CI lane. Discovery and repair evidence remain in `docs/COMPILER-TORTURE-002.md`.

## Differential hardening — KNOWN GOOD THROUGH ATTACK 29

The measured passing surface now includes:

```text
1-8   original arithmetic/control/tagged-value regression set
9     function used as If condition
10    rebound function name called
11    nested calls
12    global assignment before declaration
13    local assignment before declaration
14    function fallthrough
15    nested early return
16    arity-16 tagged ABI
17    recursion 512
18    recursion 1024
19    recursion 1536
20    recursion 2048
21    recursion 2560
22    recursion 3072
23    recursion 3584
24    recursion 4094
25    recursion 4095 · VM VETO = Wasm TRAP
26    recursion 4096 · VM VETO = Wasm TRAP
27    explode(16) · OUT=65536
28    explode(17) · OUT=131072
29    explode(18) · OUT=262144
```

## Third differential hardening break — OPEN

`I13-WASM-STEP-003`

The restress deliberately used shallow exponential recursion to increase executed work without approaching the 4096-frame ceiling:

```i13
def explode(I n) {
    if n <= 0 { -> 1 }
    -> explode(n - 1) + explode(n - 1)
}

I OUT <- explode(19)
```

Observed behavior:

```text
Reference VM: E0502 reference VM exceeded 8000000 steps
Generated Wasm: OUT = 524288, kind = NUMBER
```

The current `8,000,000` step limit is still a reference-VM policy. It has **not** been promoted into the I13 specification, and generated Wasm does not yet enforce an equivalent step counter.

Therefore:

```text
VALUE IDENTITY   preserved  ✓
FRAME IDENTITY   preserved  ✓
STEP BUDGET      backend-dependent  ✗
```

No repair is frozen for this new seam. Evidence is in `docs/COMPILER-TORTURE-003.md`.

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

`i13_run` resets program globals and private execution-frame depth before execution so repeated calls represent fresh deterministic executions.

IVM division-by-zero behavior is preserved with an explicit Wasm guard rather than accepting native `f64.div` infinity behavior.

## Closed inherited compiler defects

The accepted compiler path closes these inherited defects:

- `Arg` is a real HIR construct.
- unsupported `Attribute` use fails explicitly before execution.
- call arity fails during semantic checking.
- reference-VM recursion uses explicit VM frames, not Rust recursion.
- stack/control effects have one IVM authority.
- source spans and stable diagnostics exist from the front end onward.
- Wasm preserves Number versus Function identity.
- VM and Wasm share the canonical I13 4096-frame ceiling.

## Scope freeze during compiler construction

E1, corpus expansion, UI stages, and new conceptual modules remain **referent-only** until the compiler usable-core work is deliberately released.

They may be referenced for compatibility. They are not active construction targets.

## First acceptance target — PASSED

`examples/core.i13` passes:

```text
i13 check examples/core.i13
i13 run examples/core.i13
i13 build examples/core.i13 -o core.wasm
```

The generated Wasm validates and instantiates in Node and matches the reference VM:

```text
CORE_OK = 1
ROUTES  = 56
```

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
FRAME LAW    COMPLETE · I13_FRAME_LIMIT=4096 · VM=WASM
VM = WASM    KNOWN-GOOD THROUGH ATTACK 29
OPEN BREAK   I13-WASM-STEP-003 @ explode(19)
CLI BUILD    COMPLETE
```

This does **not** mean the language is feature-complete. It means the source-to-executable compiler path has a measured semantic/resource boundary, two differential defects have been repaired and locked, and the next independent hardening seam is explicit rather than hidden.
