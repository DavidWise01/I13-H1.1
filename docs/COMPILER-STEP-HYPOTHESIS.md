# I13 Compiler Step-Budget Hypothesis

Status: **TESTED · DECISION LOCKED · DETERMINISTIC METER KEPT · 8M IS RUNTIME POLICY, NOT LANGUAGE LAW**

Historical break ID: `I13-WASM-STEP-003`

Resolution: **RECLASSIFIED AS POLICY DIVERGENCE · NOT A SEMANTIC COMPILER DEFECT**

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

## VM/Wasm difference is deterministic

`explode(19)` was repeated three times through the CLI/reference VM. Every run produced the same `E0502` step-limit veto at the configured `8,000,000` ceiling.

The same source was compiled to Wasm and executed repeatedly. Generated Wasm completed deterministically with:

```text
OUT = 524288
kind = NUMBER
```

Therefore the observed difference is:

```text
reference VM: deterministic runtime-policy veto
Wasm:         deterministic semantic completion
```

It is no longer classified as a required VM/Wasm semantic-parity failure because the `8,000,000` fuse is explicitly outside I13 language validity.

## Locked decision

`I13-RUNTIME-POLICY-001`

```text
DETERMINISTIC STEP METER   KEEP
1 IVM instruction = 1 step KEEP
8,000,000 DEFAULT FUSE     KEEP
8M AS I13 LANGUAGE LIMIT   NO
WASM 8M MATCH REQUIRED     NO
```

The reference VM keeps `8_000_000` as its default safety fuse.

A host or test may use another step budget without changing I13 program meaning.

Semantic conformance must not reject a program merely because one implementation's safety fuse is lower than the work required by that program.

The canonical 4096-frame law remains separate and mandatory across every backend.

## Future gas model

A fixed step budget can become an I13-owned law only if I13 deliberately adopts a versioned gas/execution-cost model and freezes what is charged.

Without such a schedule, compiler transformations that change IVM instruction count could change whether a program is permitted to complete even when observable semantics are preserved.

No gas law is adopted by this decision.

## Persistent test and policy assets

```text
tests/compiler_step_semantics.rs
.github/workflows/compiler-step-hypothesis.yml
docs/COMPILER-RUNTIME-POLICY.md
```

The workflow remains useful as a regression probe for deterministic metering and for proving that the reference-runtime fuse remains policy rather than hidden language semantics.
