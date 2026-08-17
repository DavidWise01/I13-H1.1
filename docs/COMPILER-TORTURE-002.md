# I13 Compiler Torture 002 — Resource Boundary Break

Status: **REPRODUCED · OPEN · NOT FIXED IN DISCOVERY PASS**

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

Therefore the current measured parity boundary includes successful recursive execution through `count(4094)`.

## First new break

Source:

```i13
def count(I n) {
    if n <= 0 { -> 0 }
    -> 1 + count(n - 1)
}

I OUT <- count(4095)
```

Reference VM result:

```text
E0503 reference VM exceeded 4096 frames
```

Generated Wasm result:

```text
OK
OUT = 4095
kind(OUT) = NUMBER
```

Therefore:

```text
CLI/reference VM(program) != generated Wasm(program)
```

at the default reference-VM frame boundary.

## Why it breaks

The reference VM owns an explicit resource contract:

```text
VmConfig::default()

step_limit  = 8,000,000
frame_limit = 4096
```

Its frame vector includes the main frame. A recursive call that would push beyond that limit returns `E0503` rather than executing.

The current Wasm backend preserves IVM value semantics but does not emit an equivalent I13 frame counter/limit. Recursive I13 calls lower to host Wasm calls through `call_indirect`, so the host engine decides how deep execution may continue.

At this tested boundary the host engine permits one execution that the default reference VM forbids:

```text
count(4094)  VM PASS   == Wasm PASS
count(4095)  VM E0503  != Wasm PASS
```

This is not a Number/Function tagging defect. It is loss of an executable **resource-limit contract** during lowering.

## Boundary of known good

Known-good VM/Wasm parity is now measured through all first 24 ordered attacks and through recursion depth 4094.

Parity is **not** claimed at or beyond the reference VM frame-limit fence until `I13-WASM-LIMIT-002` is resolved.

## Repair direction not chosen in discovery pass

The discovery pass intentionally does not choose a repair. Plausible directions include:

```text
A. emit an explicit Wasm I13 frame counter and enforce the same limit
B. move the limit out of semantic parity and define it as host policy for both backends
C. replace recursive Wasm calls with an explicit I13 frame machine/trampoline
```

Whichever repair is selected must preserve the compiler law:

```text
BACKENDS MAY DIFFER.
RESULTS MAY NOT.
```

The discovery harness is `scripts/compiler_torture_003.sh` and the CI lane is `.github/workflows/compiler-torture-003.yml`.
