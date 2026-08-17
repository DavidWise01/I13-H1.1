# I13 Compiler Torture 001 — First Break

Status: **REPRODUCED · OPEN · NOT FIXED IN THIS PASS**

Break ID: `I13-WASM-TYPE-001`

Purpose: attack the known-good compiler vertically until the first reference-VM / generated-Wasm semantic disagreement appears. Stop at the first disagreement; do not continue searching past it in the same pass.

## Attack order

The harness executes these cases in order:

```text
1. arithmetic precedence
2. false-path control flow
3. recursion depth 256
4. division-by-zero runtime parity
5. function value used as a number
```

The first four passed:

```text
arith_precedence   OUT=10   VM=WASM   repeated Wasm run deterministic
control_false_path OUT=9    VM=WASM   repeated Wasm run deterministic
recursion_256      OUT=256  VM=WASM   repeated Wasm run deterministic
division_zero      VM error = Wasm trap
```

## First break

Source:

```i13
def f() { -> 7 }
I OUT <- f + 1
```

Reference VM result:

```text
E0501 Bin requires numeric operands
```

Generated Wasm result:

```text
i13.global.f   = 0
i13.global.OUT = 1
```

Therefore:

```text
VM(program) != WASM(program)
```

and the compiler law correctly classifies this as a backend/compiler defect.

## Why it breaks

The reference VM has a tagged runtime value model:

```text
Value::Number(f64)
Value::Function(function_id)
```

`Bin` requires numeric operands, so `f + 1` is rejected.

The current Wasm backend stores global payloads in one `f64` value plane. A function binding writes the function/table id into that plane as an `f64`. An ordinary IVM `Ask` then reads the same global as `f64` with no runtime value-kind tag. `Bin` consequently sees a valid Wasm number and computes it.

For the first function, function id `0` becomes numeric `0.0`, therefore:

```text
0.0 + 1.0 = 1.0
```

The problem is not Wasm arithmetic. The problem is loss of the IVM value-kind distinction during lowering.

## Boundary of known good

Known-good Wasm parity currently includes the tested numeric/control subset, recursive function calls, deterministic reset, and division-by-zero trapping.

It does **not** include programs that allow a function-valued `Name` to flow into numeric operations.

## Why the attack existed

The compiler canon says:

```text
BACKENDS MAY DIFFER.
RESULTS MAY NOT.
```

The reference VM deliberately distinguishes function handles from numbers. The Wasm backend therefore must preserve that distinction somehow, or the semantic checker must prove that a function-valued name can only occur in call position before code generation.

This pass records the break without choosing the repair. The defect is evidence for the next hardening decision, not permission to alter the language surface.
