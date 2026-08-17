# I13 Compiler Diagnostics + Source Mapping v0.1

Status: **CONSTRUCTED · PENDING/CI-GATED KNOWN GOOD**

Component ID: `I13-DIAGNOSTICS-0.1`

## Purpose

Diagnostics are a compiler contract, not incidental terminal text.

Every compiler/runtime failure exposed by the I13 CLI carries:

```text
stable diagnostic code
phase
category
source file
1-based line
1-based column
source excerpt
marked source span
message
```

## Stable render form

```text
error[E0203] semantic/semantics: <message>
 --> file.i13:2:10
  |
2 | I OUT <- f(1, 2)
  |          ^~~~~~~
```

The exact marker width follows the source span. A zero-width diagnostic still renders at least one `^`.

## Phase authority

Diagnostic phase is derived from the diagnostic code:

```text
E00xx  lex
E01xx  parse
E02xx  semantic
E03xx  ivm
E04xx  validate
E05xx  runtime
E06xx  wasm
```

A caller does not choose the phase independently from the code.

## Category authority

```text
syntax      lexer/parser failures
semantics   semantic/lowering meaning failures
validation  IVM structural validation failures
execution   runtime semantic failures
resource    canonical/runtime resource vetoes
backend     Wasm backend construction failures
```

Examples:

```text
E0001  lex/syntax
E0203  semantic/semantics
E0401  validate/validation
E0501  runtime/execution
E0502  runtime/resource
E0503  runtime/resource
E0601  wasm/backend
```

`E0502` remains a runtime-policy resource veto; its category does not make the 8,000,000-step default an I13 language law.

## Source mapping

`Span` remains byte-addressed and carries starting line/column metadata.

```text
Span {
    start,
    end,
    line,
    column
}
```

`SourceFile` owns line extraction and marker-width calculation. Rendering never re-lexes source to rediscover a location.

Spans survive the compiler path:

```text
source
  ↓
token span
  ↓
AST span
  ↓
HIR span
  ↓
IVM instruction span
  ↓
validator / reference VM diagnostic
  ↓
source excerpt
```

This is why runtime errors such as division by zero can map back to the original I13 source rather than only reporting an IVM program counter.

## CLI law

`i13 check`, `i13 run`, and `i13 build` use the same renderer.

Multiple diagnostics are rendered in deterministic compiler order and separated by one blank line.

The CLI must not maintain a separate table mapping codes to phases/categories.

## Conformance lock

`I13-CONFORMANCE-0.1` verifies diagnostic cases for:

```text
code
phase/category
expected source line
source excerpt
marked span
```

Compiler tests additionally cover CRLF line extraction and zero-width EOF spans.

## Non-goals for v0.1

Not included yet:

```text
JSON diagnostic protocol
LSP wire format
editor integration
multi-file related spans
fix-it edits
warnings/lints
colorized terminal output
```

Those may consume this component later. They must not redefine the diagnostic authority established here.
