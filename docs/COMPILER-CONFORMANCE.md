# I13 Compiler Conformance v0.1

Status: **CONSTRUCTED · CI-GATED · DIAGNOSTIC CONTRACT LOCKED**

Conformance ID: `I13-CONFORMANCE-0.1`

## Purpose

Conformance answers one question:

```text
Does this compiler/runtime implementation still implement the known-good I13 contract?
```

It is intentionally separate from feature development, fuzzing, performance tests, and runtime safety-policy probes.

## Authority

Conformance consumes the frozen compiler authority chain:

```text
SPEC
  ↓
HIR
  ↓
IVM
```

The conformance suite does not create new language semantics. It records already-proven behavior and fails when an implementation drifts from it.

## Case classes

`tests/conformance/manifest.json` defines four classes:

```text
execute
    source must check
    reference VM must complete with expected globals
    generated Wasm must complete with the same expected globals
    repeated Wasm execution must remain deterministic

compile_error
    source must be rejected during check
    the expected stable diagnostic contract must be present

runtime_error
    source must pass check
    reference VM must fail with the expected runtime diagnostic contract
    generated Wasm must trap

resource_error
    source must pass check
    the canonical I13 resource law must reject execution consistently
    reference VM must emit the expected diagnostic contract
    generated Wasm must trap
```

For diagnostic-bearing cases, the contract now includes:

```text
stable E-code
phase/category
expected source line
source excerpt
marked source span
```

This consumes `I13-DIAGNOSTICS-0.1`; conformance does not maintain a second diagnostic taxonomy.

## v0.1 manifest

The first frozen set covers:

```text
C001 arithmetic precedence
C002 nested calls
C003 osmotic `.p` bind
C004 recursion depth 256
C005 whole examples/core.i13 acceptance
C006 call arity rejection · E0203 · semantic/semantics
C007 unknown function rejection · E0202 · semantic/semantics
C008 lexical unexpected-character rejection · E0001 · lex/syntax
C009 division-by-zero runtime parity · E0501 · runtime/execution / Wasm trap
C010 Function-as-Number runtime parity · E0501 · runtime/execution / Wasm trap
C011 canonical 4096-frame ceiling · E0503 · runtime/resource / Wasm trap
```

## Runtime-policy exclusion

The reference VM default `8,000,000` step fuse is **not** a conformance rejection rule.

It is governed by `I13-RUNTIME-POLICY-001` in `docs/COMPILER-RUNTIME-POLICY.md`.

Therefore the conformance suite distinguishes:

```text
4096 active frames   canonical I13 execution law   INCLUDED
8,000,000 VM steps   reference-runtime safety fuse EXCLUDED
```

A future standardized gas model would require its own versioned conformance surface.

## Execution path

The CI runner uses the real CLI and a real WebAssembly engine:

```text
manifest
   ↓
source .i13
   ↓
i13 check
   ↓
i13 run ────────────────┐
   ↓                     │
reference VM             │ compare
                         │
i13 build                │
   ↓                     │
.wasm                    │
   ↓                     │
Node WebAssembly engine ─┘
```

Error cases additionally verify the CLI-rendered source map rather than only searching for an E-code.

The runner is `scripts/compiler_conformance.js`.

The CI gate is `.github/workflows/compiler-conformance.yml`.

## Expansion law

New conformance cases may be added only for behavior that is already one of:

1. explicitly frozen language/compiler canon,
2. a repaired defect that has passed differential regression, or
3. an accepted whole-program behavior demonstrated by both reference VM and Wasm.

Exploratory torture cases stay outside conformance until their behavior is understood and deliberately accepted.

That separation is intentional:

```text
TORTURE      discovers
POLICY TEST  characterizes
CONFORMANCE  locks known good
```
