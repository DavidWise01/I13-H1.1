# I13 Compiler Torture 003 — Step-Budget Break

Status: **REPRODUCED · OPEN · NOT FIXED IN THIS PASS**

Break ID: `I13-WASM-STEP-003`

Purpose: restress the compiler after closing `I13-WASM-LIMIT-002`, prove the new I13-owned frame law at and beyond its exact fence, then continue until the next VM/Wasm disagreement.

## Frame-law regression — PASSED

`I13-EXEC-LIMIT-001` is now part of I13:

```text
I13_FRAME_LIMIT = 4096
```

The limit includes the main/root frame.

Restress results:

```text
24. recursion 4094  VM PASS  == Wasm PASS
25. recursion 4095  VM VETO  == Wasm TRAP
26. recursion 4096  VM VETO  == Wasm TRAP
```

Therefore the former frame-limit divergence is closed.

## Step-budget isolation

The next attack deliberately used shallow exponential recursion:

```i13
def explode(I n) {
    if n <= 0 { -> 1 }
    -> explode(n - 1) + explode(n - 1)
}
```

This grows executed instruction count exponentially while call depth grows only linearly, so the test isolates the reference VM step budget from the now-canonical frame ceiling.

Passing cases:

```text
27. explode(16)  OUT=65536   VM=WASM
28. explode(17)  OUT=131072  VM=WASM
29. explode(18)  OUT=262144  VM=WASM
```

## First new break

Source:

```i13
def explode(I n) {
    if n <= 0 { -> 1 }
    -> explode(n - 1) + explode(n - 1)
}

I OUT <- explode(19)
```

Reference VM:

```text
E0502 reference VM exceeded 8000000 steps
```

Generated Wasm:

```text
OK
OUT = 524288
kind(OUT) = NUMBER
```

Therefore:

```text
VM(program) != WASM(program)
```

at the current reference-VM step-budget boundary.

## Why it breaks

`VmConfig::default()` currently contains:

```text
step_limit = 8,000,000
```

That limit is still a reference-VM execution policy. Unlike the 4096-frame ceiling, it has **not yet been promoted into the I13 language/execution specification** and generated Wasm does not maintain an equivalent instruction/step counter.

The frame-law repair therefore worked exactly as intended and exposed the next independent resource mismatch:

```text
FRAME IDENTITY   preserved  ✓
VALUE IDENTITY   preserved  ✓
STEP BUDGET      backend-dependent  ✗
```

No repair is chosen in this discovery record. The next decision is whether `8,000,000` steps is:

```text
A. an I13-owned deterministic execution law shared by every backend
or
B. a reference-VM safety policy that should not participate in semantic parity
```

Until that decision is made, VM/Wasm parity is measured through attack 29 and `explode(18)`; `explode(19)` is the next open seam.
