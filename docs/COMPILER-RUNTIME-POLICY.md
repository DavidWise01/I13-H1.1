# I13 Compiler Runtime Policy — Locked Known Good

Status: **FROZEN POLICY · NOT A LANGUAGE SEMANTIC LIMIT**

Policy ID: `I13-RUNTIME-POLICY-001`

## Deterministic IVM step meter

The reference VM retains a deterministic execution meter:

```text
1 executed IVM instruction = 1 VM step
```

The meter increments before executing each IVM instruction. A configured budget `N` permits exactly `N` executed IVM instructions and vetoes the next instruction.

The meter is deterministic for a fixed validated IVM program. The same program and inputs must produce the same step count.

## Locked reference-VM default

```text
REFERENCE_VM_DEFAULT_STEP_LIMIT = 8,000,000
```

The current reference VM default remains `8_000_000` steps as a safety fuse.

This number is intentionally **not** an I13 language-validity rule and is **not** part of VM/Wasm semantic parity.

A semantically valid I13 program may require more than the reference VM default budget. A host or test may choose another step budget without changing I13 program meaning.

## Why the step limit is policy, not semantics

Measured equivalent-result programs can consume different IVM step counts:

```i13
I OUT <- 1 + 2
```

uses 4 steps, while:

```i13
I a <- 1
I b <- 2
I OUT <- a + b
```

uses 8 steps. Both produce `OUT = 3`.

Therefore the meter measures execution shape/work, not semantic result identity.

Compiler transformations may legitimately change executed IVM instruction count while preserving observable semantics. Such transformations must not silently change language validity.

## Separation from the canonical frame law

The frame ceiling remains different:

```text
I13_FRAME_LIMIT = 4096
```

`I13_FRAME_LIMIT` is an I13 execution law and every backend must enforce it.

The step budget is runtime policy:

```text
frame ceiling   = language/execution law
step meter      = deterministic mechanism
8,000,000       = reference-runtime default safety fuse
```

## Conformance rule

Semantic conformance tests must not treat the reference VM default step fuse as a language rejection rule.

When a conformance workload intentionally exceeds the default fuse, the conformance runner must either:

1. raise/disable the reference safety budget for that test, or
2. classify the result as runtime-policy behavior rather than semantic divergence.

## Future gas model

I13 may later standardize deterministic gas, but only by separately freezing a versioned charge schedule defining what work is charged and at what cost.

Until such a law is explicitly adopted:

```text
DETERMINISTIC STEP METER   KEEP
8M REFERENCE SAFETY FUSE   KEEP
8M LANGUAGE LIMIT          NO
WASM 8M MATCH REQUIRED     NO
```

Evidence: `docs/COMPILER-STEP-HYPOTHESIS.md` and `tests/compiler_step_semantics.rs`.
