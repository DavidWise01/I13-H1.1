# Pulse v0.1

Pulse is a small deterministic transition language.

## Delimiter

`...` is the **pulse delimiter**. It ends and commits one complete statement.

`..` is reserved in v0.1 and is not valid syntax. Reserving it prevents a future
continuation/range operator from colliding with the hard statement boundary.

A newline is only whitespace; the `...` delimiter is the actual statement
boundary.

## Core transition

Pulse v0.1 is anchored to the transition law:

```text
adjusted = state + threshold
if adjusted > 128:
    result = adjusted * witness
else:
    result = none
```

## Grammar

```text
program      := statement*
statement    := let_stmt | pulse_stmt | emit_stmt
let_stmt     := "let" IDENT "=" expr "..."
pulse_stmt   := "pulse" IDENT "=" "transition" "(" expr "," expr "," expr ")" "..."
emit_stmt    := "emit" expr "..."
expr         := NUMBER | IDENT | "none"
```

## Example

```pulse
let state = 120 ...
let threshold = 10 ...
let witness = 2 ...
pulse result = transition(state, threshold, witness) ...
emit result ...
```

Result:

```text
260
```

Because `120 + 10 = 130`, `130 > 128`, and `130 * 2 = 260`.

If the threshold is `8`, the adjusted value is `128`, which does **not** satisfy
`> 128`, so the transition result is `none`.

## Why this is a language

Pulse v0.1 has:

- lexical tokens,
- a grammar,
- a hard delimiter,
- named state,
- deterministic evaluation rules,
- an observable output operation,
- parse/runtime errors,
- a reference interpreter and tests.

That is enough to call it a small language rather than only a notation.
