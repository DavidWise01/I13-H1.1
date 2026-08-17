# I13 Compiler Torture 002 — Resource Boundary Break

Status: **CLOSED · REGRESSION-LOCKED**

Break ID: `I13-WASM-LIMIT-002`

Purpose: continue differential attack beyond the tagged-value regression set and stop at the first new reference-VM / generated-Wasm disagreement.

## Known-good expansion before the break

The original 8-case tagged-value regression set remained green.

Pass 002 then added and passed:

```text
9.  function used as If condition              PASS · VM error = Wasm trap
10. rebound function name called               PASS · VM error = Wasm trap
11. nested calls / shared scratch               PASS · OUT=14
12. global assignment before declaration       PASS · VM error = Wasm trap
13. local assignment before declaration        PASS · VM error = Wasm trap
14. function fallthrough                       PASS · VM error = Wasm trap
15. nested early return                        PASS · OUT=42
16. arity-16 tagged call ABI                   PASS · OUT=16
17. recursion 512                              PASS
18. recursion 1024                             PASS
19. recursion 1536                             PASS
20. recursion 2048                             PASS
21. recursion 2560                             PASS
22. recursion 3072                             PASS
23. recursion 3584                             PASS
24. recursion 4094                             PASS
```

## Original break

```i13
def count(I n) {
    if n <= 0 { -> 0 }
    -> 1 + count(n - 1)
}

I OUT <- count(4095)
```

Original behavior:

```text
Reference VM: E0503 reference VM exceeded 4096 frames
Generated Wasm: OUT = 4095
```

Cause: the reference VM owned an explicit 4096-frame execution boundary while the first Wasm backend delegated recursion capacity to the host engine.

## Repair

The boundary is now part of I13 itself as `I13-EXEC-LIMIT-001`:

```text
I13_FRAME_LIMIT = 4096
```

The count includes the main/root frame.

The IVM layer owns the constant. The reference VM uses it as the canonical maximum. Generated Wasm now carries a private active-frame counter:

```text
i13_run
  ↓
frame_depth = 1

Call
  ↓
require frame_depth < 4096
  ↓
frame_depth += 1
  ↓
call_indirect
  ↓
frame_depth -= 1
```

A trapped run does not need to unwind the private counter because every new `i13_run` resets it to root frame `1` before execution.

## Regression proof

After the repair:

```text
count(4094)  VM PASS  == Wasm PASS
count(4095)  VM VETO  == Wasm TRAP
count(4096)  VM VETO  == Wasm TRAP
```

Therefore `I13-WASM-LIMIT-002` is closed.

The same restress continued beyond this repaired seam and discovered the next independent mismatch at the reference VM step budget. That result is recorded in `docs/COMPILER-TORTURE-003.md`.
