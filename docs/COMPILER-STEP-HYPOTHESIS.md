# I13 Compiler Step-Budget Hypothesis

Status: **TESTED · DETERMINISTIC METER CONFIRMED · NOT CANONIZED AS LANGUAGE LAW**

Related open break: `I13-WASM-STEP-003`

Purpose: determine whether the reference VM default `8,000,000` step cutoff behaves like a stable I13 semantic law or like an implementation/resource meter.

## What a VM step currently means

The reference VM increments its counter once per executed IVM instruction. It rejects execution only when:

```text
steps > configured_step_limit
```

Therefore a program that requires exactly `N` executed IVM instructions succeeds with `step_limit = N` and fails with `step_limit = N - 1`.

The dedicated probe confirmed this fencepost behavior.

## Determinism

Every measured source was executed twice under a temporary `100,000,000`-step ceiling. Exact step counts and results repeated identically.

For the exponential recursion probe:

```i13
def explode(I n) {
    if n <= 0 { -> 1 }
    -> explode(n - 1) + explode(n - 1)
}
```

Measured results:

```text
explode(16)  steps =  1,507,316   OUT =    65,536
explode(17)  steps =  3,014,644   OUT =   131,072
explode(18)  steps =  6,029,300   OUT =   262,144
explode(19)  steps = 12,058,612   OUT =   524,288
explode(20)  steps = 24,117,236   OUT = 1,048,576
```

The current default `8,000,000` cutoff therefore lies cleanly between `explode(18)` and `explode(19)`.

## Execution-shape sensitivity

Two programs with the same observable result were also measured:

```i13
I OUT <- 1 + 2
```

Result:

```text
OUT = 3
steps = 4
```

and:

```i13
I a <- 1
I b <- 2
I OUT <- a + b
```

Result:

```text
OUT = 3
steps = 8
```

Thus step count is deterministic but intentionally sensitive to execution/lowering shape. It is not a property of the final semantic result alone.

## Current VM/Wasm mismatch is deterministic

`explode(19)` was repeated three times through the CLI/reference VM. Every run produced the same `E0502` step-limit veto at the configured `8,000,000` ceiling.

The same source was compiled to Wasm and executed repeatedly. Generated Wasm completed deterministically with:

```text
OUT = 524288
kind = NUMBER
```

So the open break remains reproducible:

```text
reference VM: deterministic resource veto
Wasm:         deterministic completion
```

## Interpretation

The test supports two distinct facts:

```text
DETERMINISTIC METER     YES
SEMANTIC RESULT LAW     NO
```

A fixed step budget can become an I13-owned law only if I13 deliberately adopts a gas/execution-cost model and freezes what is charged. Otherwise compiler transformations that change IVM instruction count could change whether a program is permitted to complete even when its observable semantics are preserved.

The measured evidence therefore supports keeping `8,000,000` as a reference/runtime safety policy for now, while treating deterministic IVM-step metering as a reusable mechanism that could later be standardized independently.

No language-law change was made by this test.

## Persistent test assets

```text
tests/compiler_step_semantics.rs
.github/workflows/compiler-step-hypothesis.yml
```

The workflow is expected to keep proving both the VM meter's determinism and the current open Wasm mismatch until the step-budget policy is deliberately resolved.
