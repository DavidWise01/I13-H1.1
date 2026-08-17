# I13 Compiler Introspection v0.1

Status: **FROZEN KNOWN GOOD · COMPILER TESTED · CI-GATED**

Component ID: `I13-INTROSPECTION-0.1`

## Purpose

Introspection exposes what each compiler layer currently contains without changing I13 semantics or creating a new compiler authority.

```text
SOURCE
  ↓
TOKENS
  ↓
AST
  ↓
HIR
  ↓
IVM
```

The command surface is:

```text
i13 dump file.i13 --tokens
i13 dump file.i13 --ast
i13 dump file.i13 --hir
i13 dump file.i13 --ivm
```

## Authority rule — FROZEN

Introspection is read-only.

```text
SPEC -> HIR -> IVM     authority
DUMP                    observation
```

A dump is never accepted back into the compiler as source, HIR, or IVM. The dump format therefore cannot become a shadow serialization format or a fourth authority.

```text
INTROSPECTION MAY REVEAL AUTHORITY.
INTROSPECTION MAY NOT DEFINE AUTHORITY.
```

## Layer gates

Each dump stops at the requested layer:

```text
--tokens   lex only
--ast      lex + parse
--hir      lex + parse + lower HIR + semantic check
--ivm      full checked compile + IVM validation
```

Later-layer diagnostics are not bypassed. For example, an unknown function can still be inspected as tokens or AST, but `--hir` and `--ivm` reject it with the normal semantic diagnostic.

## Stable text contract

Every dump starts with a versioned header:

```text
I13 INTROSPECT TOKENS v0.1
I13 INTROSPECT AST v0.1
I13 INTROSPECT HIR v0.1
I13 INTROSPECT IVM v0.1
```

The renderer is handwritten and deterministic. It does not expose Rust `Debug` output as the public contract.

This matters because internal Rust struct layout or derive formatting may change without redefining the introspection format.

## Tokens

Token dumps include:

```text
sequence index
token kind/value
source line/column
byte span
```

Newlines and EOF remain visible so parser boundaries can be inspected directly.

## AST

AST dumps describe what the programmer physically wrote. They preserve concrete distinctions such as:

```text
Declare
Assign x.p
FunctionDef params=[...]
Binary
Compare
Call
```

Every statement/expression includes its source span.

## HIR

HIR dumps describe what I13 says the source means after semantic lowering/checking.

Important distinctions are explicit:

```text
Assign mode=declare
Assign mode=assign
Assign mode=osmotic
FunctionDef args=[...]
Constant
BinOp
Compare
Call
```

This makes transformations such as AST `Declare` -> HIR `Assign mode=declare` inspectable without changing the semantic authority of HIR itself.

## IVM

IVM dumps expose validated executable I13 in symbolic form.

They include:

```text
I13_FRAME_LIMIT
global slot table
main region
function table
function parameters/local count
program counter
opcode
symbolic operand interpretation
source span
```

Examples of symbolic rendering include:

```text
global=g0:add function=fn0:add
slot=g2:OUT mode=global-declare
op=Add
argc=2
```

Raw numeric IVM operands remain represented by their canonical meaning where possible so the dump is useful for compiler debugging rather than merely reproducing struct fields.

## Determinism law

For a fixed source and compiler version:

```text
dump(source, layer) == dump(source, layer)
```

byte-for-byte across repeated runs.

`tests/compiler_introspection.rs` regression-locks all four layers, semantic gating, symbolic IVM output, and the real CLI command.

The first full compiler/Wasm CI gate after construction passed all compiler tests, Wasm build/parity, and the canonical 4096-frame regression unchanged.

## Non-goals for v0.1

Not included:

```text
JSON dump format
binary serialization
round-trip loading
interactive debugger
IVM execution trace
optimization-pass dumps
diff visualization
editor UI
```

Those may consume introspection later, but they must not make dump output a semantic authority.
