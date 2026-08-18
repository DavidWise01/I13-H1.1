# E1.TECH-001 — Trit-Native Technical Agent

Status: **LOCKED KNOWN GOOD · NON-RIVER · JS/I13/WASM VERIFIED 2026-08-18**

Purpose: assemble a bounded technical/surgical/coding prime outside the I13 live-state domain. The module does not mutate host state. It returns a trit-native authority state to Cortex; host capabilities remain separately gated.

## Trit control law

```text
n1 = -1 = boundary / contradicted / HOLD
p0 =  0 = witness / unresolved / FLAY
p1 = +1 = resolved / PROCEED
```

No Boolean collapse is permitted at the agent-control layer.

```text
if evidence_trit == n1 -> n1
else if question_debt > 0 -> p0
else if evidence_trit == p1 -> p1
else -> p0
```

`p1` means only that Cortex may advance to the requested capability gate. It is not permission to bypass host capability, repository, filesystem, shell, network, or CV policy.

## Bounded request

```json
{
  "task": "repair one failing parser test",
  "phase": "diagnose",
  "scope": "parser/expression",
  "capability": "test",
  "evidence_trit": 0,
  "question_debt": 1
}
```

Allowed phases:

```text
inspect | diagnose | cut | verify | return
```

Allowed capability classes:

```text
read | build | test | patch | git
```

Limits:

```text
task          1..1024 chars
scope         1..512 chars
question_debt 0..255
payload        bounded by the existing E1 4096-byte capsule limit
```

## Surgical lifecycle

```text
0 : begin / r0
    |
    v
INSPECT
    |
    v
TRIT
 |- n1 -> HOLD -> receipt -> r0
 |- p0 -> FLAY -> inspect again
 `- p1 -> Cortex capability gate
              |
              v
       smallest bounded operation
              |
              v
            VERIFY
              |
              v
             TRIT
              |
          receipt -> r0
```

Law:

```text
OBSERVE BEFORE MUTATION.
A PLAUSIBLE DIAGNOSIS IS NOT AUTHORITY TO CUT.
CUT ONLY THE SMALLEST BOUNDARY SUPPORTED BY EVIDENCE.
VERIFY AGAINST THE SAME BOUNDARY.
RETURN A WITNESSED RECEIPT.
```

## E1 boundary

```text
I13/Cortex
   |
   | bounded request
   v
[ y | x ]
   |
   v
E1.TECH-001
   |
   | {trit, scope, capability, question_debt}
   v
[E1ID]cv
   |
   v
Cortex
```

The factory remains external. No shared mutable state crosses. A valid E1/CV transport receipt and the TECH trit are separate facts: a capsule may close correctly while carrying `n1` or `p0`.

## Native coding workspace attachment

`E1.WORKSPACE-001` binds the `p1` Cortex capability gate to an already-cloned local Git repository through the native `i13-workspace` worker.

```text
E1.TECH-001 / p1
      |
      v
CORTEX CAPABILITY GATE
      |
      v
i13-workspace <offline clone>
      |
      +-- read
      +-- git status / diff
      +-- cargo build --offline
      +-- cargo test --offline
      `-- bounded git apply
      |
      v
receipt -> r0
```

The worker is intentionally not exported from `src/lib.rs`; Wasm receives no filesystem or process capability. `n1` and `p0` stop before workspace execution. v0.1 has no arbitrary shell, commit, push, clone, fetch, pull, file creation/deletion/rename, or direct `.git` access.

Canonical attachment: `docs/E1-WORKSPACE-001.md`.

## Executable reference

`examples/e1_tech_trit.i13` mirrors the authority law in the current I13 surface using direct numeric trits `-1 / 0 / +1`. This adds no language syntax and does not modify the frozen numbered corpus river.

## Verified proof

Dedicated CI context:

```text
i13/e1-tech-trit = success
```

The gate verifies:

```text
JS core syntax + trit conformance
invalid trit veto
I13 check + HIR witness
reference VM exact globals
Wasm build + validation
VM/Wasm parity twice
opaque E1 sandbox wiring
no fetch/browser-storage path in E1 service
```

The native workspace attachment has its own independent proof context:

```text
i13/e1-workspace
```
