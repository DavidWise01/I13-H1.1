# I13-H1.1

**I13 · Icarium · Wasm · Rust · Machina**

H1.1 is the live development trunk. H1.0 and VH1 reference material remain frozen and are carried under `reference/` without silently changing their semantics.

```text
I-13 source
  -> reader / normalize / I-13 IR
  -> Cortex / bounded subagent
       -> enough: continue internally
       -> needs prime: [ y | x ] -> E1 external primer factory -> [E1ID]cv -> Cortex
       -> p1 capability: native i13-workspace -> local Git clone -> receipt -> r0
  -> Rust core
  -> WebAssembly
  -> JS/WebGPU host
```

## Current H1.1 core

```text
32-bit OLOGY surface = x:16 | y:16
ln = <x,y>

<x,y> -> voxel rooted at that vector -> local burrow depth z

[c[v[
    (),
    {},
    ()
]]cv]
```

- `c[v[` — Cortex enters a voxel rooted at the current OLOGY vector.
- first `()` — state entering the voxel.
- `{}` — local voxel/context/working volume.
- second `()` — state emerging from the voxel.
- `]]cv]` — close/leave voxel and pass the transition to the Cortex Verifier before exit.
- surface movement changes `<x,y>`; burrowing changes local `z` without consuming any of the 32 surface bits.
- the same 32 bits may be viewed as an IPv4-sized overlay key; this is **not** a claim that IPv4 defines Cartesian coordinates.

## E1 external primer factory

E1 is secondary to I13 and remains outside the internal live-state domain.

```text
[ y | x ]
y = internal only
x = external only

private(y) ∩ private(x) = ∅
y: n -> 2n -> 4n -> 8n
x: n -> 2n -> 4n -> 8n
```

Only bounded witnessed capsules cross. `E1ID` binds request/return lineage and CV closes the return. The Rust/Wasm core implements only the boundary verifier; factory modules remain host-side.

Locked factory modules:

- `E1.TECH-001` — trit-native technical/surgical/coding prime. Agent authority remains `n1=-1` HOLD, `p0=0` FLAY, `p1=+1` PROCEED; `p1` advances only to a separate Cortex capability gate.
- `E1.RD-001` — Reverse Distillation: recover parent dependency geometry from a bounded derived form.
- `E1.CORPUS-001` — corpus-orientation calibration field around the Enheduanna middle/middle core. Named literary anchors are external calibration metadata only; their text is not added to `corpus/`.

TECH-001 has both a host implementation (`docs/e1-tech-001.js`) and an executable I13 semantic mirror (`examples/e1_tech_trit.i13`). It adds no new I13 syntax, opcode, or numbered corpus reach.

See [`docs/E1-FACTORY.md`](docs/E1-FACTORY.md), [`docs/E1-TECH-001.md`](docs/E1-TECH-001.md), and the live Pages [`e1.html`](https://davidwise01.github.io/I13-H1.1/e1.html).

### Stage 15.3 — live Cortex ↔ E1 handoff

The workbench carries a bounded `E1 PRIME` control. The external factory worker runs in `e1-service.html` inside an opaque sandbox with `sandbox="allow-scripts"` and **no** `allow-same-origin`. The two sides communicate only through `postMessage` capsules.

Before `y -> x`, the internal workbench loads the current Wasm core and calls `i13_e1_boundary_verify`. On return it verifies the exact parent request and calls both `i13_e1_boundary_verify` and `i13_e1_closed_loop_verify`. Only a closed `[E1ID]cv` return emits the internal `i13:e1-prime` event.

For `E1.TECH-001`, transport closure and agent authority remain separate: a valid `[E1ID]cv` receipt may carry `n1`, `p0`, or `p1`.

No E1 request/return payload is persisted in localStorage. See [`docs/STAGE15.3-E1-HANDOFF.md`](docs/STAGE15.3-E1-HANDOFF.md).

### E1.WORKSPACE-001 — offline local Git coding workspace

`p1` may now advance to a native-only worker for an already-cloned repository:

```text
E1.TECH-001 / p1
   -> Cortex capability gate
   -> i13-workspace <local clone>
   -> read | git | build | test | patch
   -> receipt
   -> r0
```

The worker is **not** exported from `src/lib.rs` and therefore is not part of the Wasm surface. v0.1 permits only:

- bounded UTF-8 file inspection inside the repo;
- local `git status` / `git diff`;
- `cargo build --offline --bin i13`;
- `cargo test --offline --all-targets`;
- bounded `git apply` patches to 1–4 existing, tracked, clean regular files.

It rejects path traversal, direct `.git` access, dirty patch targets, binary/create/delete/rename/mode patches, arbitrary shell commands, commit/push, and network Git operations.

See [`docs/E1-WORKSPACE-001.md`](docs/E1-WORKSPACE-001.md).

## Repository map

```text
src/                 live H1.1 Rust/Wasm reference core + native workspace worker
spec/                live semantics and frozen-boundary notes
reference/vh1/       frozen ternary/Hamiltonian reference
reference/vh2/       five-qubit CUBI hypothesis reference
reference/legacy/    historical Wasm/GPU proof artifacts
examples/            I-13 programs, including E1 TECH trit witness
corpus/              technical corpus + cross-reference maps
docs/                GitHub Pages hallway, workbench/runtime, E1 factory, workspace contract
```

See [`STATUS.md`](STATUS.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), and [`TRUNK.md`](TRUNK.md).
