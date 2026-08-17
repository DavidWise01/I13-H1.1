# Stage 15.3 — Live Cortex ↔ E1 handoff

Stage 15.2 attached and locked the E1 external primer factory. Stage 15.3 makes the attachment live without moving E1 into the internal runtime.

## Canonical flow

```text
I13
 |
 v
Cortex / bounded subagent
 |
 | needs prime
 v
[ y | x ]
 |
 | witnessed request capsule
 v
E1 external primer service
 |
 | witnessed return capsule
 v
[E1ID]cv
 |
 v
Cortex resumes
 |
 v
I13
```

`y` is internal-only state. `x` is external-only state. Each side keeps its own `n -> 2n -> 4n -> 8n` VORTEX reach. Width is never pooled.

## Isolation implementation

The workbench creates `e1-service.html` as a sandboxed iframe with exactly:

```text
sandbox="allow-scripts"
```

There is deliberately **no** `allow-same-origin`. The service therefore has an opaque origin and cannot read the workbench DOM or internal runtime state. The handoff script does not read the E1 DOM either. The only live interface is bounded `postMessage` traffic.

The service contains no fetch, localStorage, sessionStorage, or IndexedDB path. It receives one bounded request and returns one bounded prime.

## Request gate

Before crossing `y -> x`, the internal Stage 15.3 script:

1. limits the request to 4096 UTF-8 bytes;
2. SHA256-hashes the payload and canonical request shape;
3. folds those hashes to nonzero `u32` addresses for the compact Wasm ABI;
4. creates a traversal witness at request time;
5. calls `i13_e1_boundary_verify(Internal, External, ...)`;
6. refuses to post the request if the Wasm verifier vetoes it.

No live mutable state is included in the request capsule.

## Return gate

The external service returns:

```text
prime
parent_request_sha256
parent_request_u32
return_witness_u32
shared_live_state = false
```

The internal side then:

1. verifies the exact SHA256 parent request;
2. hashes the returned prime;
3. calls `i13_e1_boundary_verify(External, Internal, ...)`;
4. calls `i13_e1_closed_loop_verify(...)`;
5. emits an internal `i13:e1-prime` event only when both checks pass.

A failed parent, missing witness, same-side capsule, or contamination flag produces VETO and no prime is released.

## E1 modules exposed by the sandbox

### E1.RD-001 — Reverse Distillation

The bounded service performs structural flaying only:

```text
ABCD - D = ABC
```

It reports the extension and recovered parent geometry. It does not make causal or ownership claims.

### E1.CORPUS-001 — Corpus Orientation

The service uses only the locked calibration metadata:

```text
capstone  (top|bottom)    Neal Stephenson / The Fall / technical
keystone  (top|top)       George Orwell / 1984 / technical,somatic,phonic,doublespeak,triple-listen
core      (middle|middle) Enheduanna / first author / example,instruction,42
ucapstone (bottom|top)    Neal Stephenson / Seveneves / unknown,discovered
ukeystone (bottom|bottom) Aldous Huxley / Brave New World / barbaric,cultured,curated
```

No book text is present in the service and nothing is admitted to `corpus/`.

Continuity primitive:

```text
[ a+ [[ () ]] c- ] || [ c+ [[ () ]] a- ]
```

## Persistence law

Stage 15.3 keeps pending requests and the most recent receipt in page memory only. It does not persist E1 request/return content in browser storage.

## Public API

```text
window.I13E1HandoffStage.version
window.I13E1HandoffStage.request()
window.I13E1HandoffStage.state()
window.I13E1HandoffStage.selfTest()
```

Successful closure also emits:

```text
window event: i13:e1-prime
```

The event contains only the bounded prime and E1ID receipt.
