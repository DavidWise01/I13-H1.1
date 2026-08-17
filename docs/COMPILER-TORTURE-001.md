# I13 Compiler Torture 001 — First Break

Status: **REPRODUCED · REPAIRED · REGRESSION-LOCKED**

Break ID: `I13-WASM-TYPE-001`

Purpose: attack the known-good compiler vertically until the first reference-VM / generated-Wasm semantic disagreement appears. Stop at the first disagreement, preserve the evidence, then repair without changing the I13 language surface.

## Original attack order

```text
1. arithmetic precedence
2. false-path control flow
3. recursion depth 256
4. division-by-zero runtime parity
5. function value used as a number
```

The first four passed:

```text
arith_precedence    OUT=10   VM=WASM
control_false_path  OUT=9    VM=WASM
recursion_256       OUT=256  VM=WASM
division_zero       VM error = Wasm trap
```

## Original first break

Source:

```i13
def f() { -> 7 }
I OUT <- f + 1
```

Reference VM result:

```text
E0501 Bin requires numeric operands
```

Original generated Wasm result:

```text
i13.global.f   = 0
i13.global.OUT = 1
```

Therefore, at discovery time:

```text
VM(program) != WASM(program)
```

## Root cause

The reference VM has a tagged runtime value model:

```text
Value::Number(f64)
Value::Function(function_id)
```

The first Wasm backend stored both payloads in one `f64` plane. A function binding wrote the function/table id as an `f64`; ordinary `Ask` then returned that payload with no value-kind tag.

For the first function:

```text
Function(0)
   ↓ flatten
0.0
   ↓
0.0 + 1.0 = 1.0
```

The bug was loss of IVM value identity during lowering, not Wasm arithmetic.

## Chosen repair — Option B

The Wasm backend now preserves tagged values end-to-end:

```text
[ kind:i32 | payload:f64 ]

NUMBER   = [0 | numeric f64]
FUNCTION = [1 | function/table id]
```

Storage keeps declaration state separately:

```text
[ kind | payload | bound ]
```

Generated exports now include:

```text
i13.global.<name>
i13.kind.<name>
i13.state.<name>
```

Function parameters and function returns also carry tagged pairs, so identity survives calls rather than being repaired only at globals.

Operation boundaries enforce the reference-VM law:

```text
Bin / Cmp / If  require NUMBER
Call            requires FUNCTION
```

## Regression expansion

After the repair, the torture sequence was expanded so the original example could not pass through a one-off patch.

Current ordered regression set:

```text
1. arithmetic precedence
2. false-path control flow
3. recursion depth 256
4. division-by-zero runtime parity
5. function value used as a number
6. function value carried through an argument, then used as number
7. function value carried through return + global assignment, then used as number
8. function value used as comparison operand
```

Observed result:

```text
PASS[1] arith_precedence
PASS[2] control_false_path
PASS[3] recursion_256
PASS[4] division_zero
PASS[5] function_as_number
PASS[6] function_through_argument
PASS[7] function_through_return
PASS[8] function_as_compare_operand

TORTURE PASS · 8 attacks
```

For attacks 5–8, parity means:

```text
Reference VM runtime error
=
Generated Wasm trap
```

## Closure

`I13-WASM-TYPE-001` is **CLOSED**.

The original failure remains documented because it defines why the tagged-value law exists. The executable regression is `scripts/compiler_torture.sh` and must remain green.

The repair did not add syntax, remove flexibility, or change the Twelve. It changed only backend representation so Wasm preserves the value distinction IVM already had.
