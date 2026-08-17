# I13-H1.1

**I13 · Icarium · Wasm · Rust · Machina**

H1.1 is the live development trunk. H1.0 and VH1 reference material remain frozen and are carried under `reference/` without silently changing their semantics.

```text
I-13 source
  -> reader / normalize / I-13 IR
  -> Cortex / bounded subagent
       -> enough: continue internally
       -> needs prime: [ y | x ] -> E1 external primer factory -> [E1ID]cv -> Cortex
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

- `E1.RD-001` — Reverse Distillation: recover parent dependency geometry from a bounded derived form.
- `E1.CORPUS-001` — corpus-orientation calibration field around the Enheduanna middle/middle core. Named literary anchors are external calibration metadata only; their text is not added to `corpus/`.

See [`docs/E1-FACTORY.md`](docs/E1-FACTORY.md) and the live Pages [`e1.html`](https://davidwise01.github.io/I13-H1.1/e1.html).

### Stage 15.3 — live Cortex ↔ E1 handoff

The workbench now carries a bounded `E1 PRIME` control. The external factory worker runs in `e1-service.html` inside an opaque sandbox with `sandbox="allow-scripts"` and **no** `allow-same-origin`. The two sides communicate only through `postMessage` capsules.

Before `y -> x`, the internal workbench loads the current Wasm core and calls `i13_e1_boundary_verify`. On return it verifies the exact parent request and calls both `i13_e1_boundary_verify` and `i13_e1_closed_loop_verify`. Only a closed `[E1ID]cv` return emits the internal `i13:e1-prime` event.

No E1 request/return payload is persisted in localStorage. See [`docs/STAGE15.3-E1-HANDOFF.md`](docs/STAGE15.3-E1-HANDOFF.md).

## Repository map

```text
src/                 live H1.1 Rust/Wasm reference core
spec/                live semantics and frozen-boundary notes
reference/vh1/       frozen ternary/Hamiltonian reference
reference/vh2/       five-qubit CUBI hypothesis reference
reference/legacy/    historical Wasm/GPU proof artifacts
examples/            I-13 programs
corpus/              technical corpus + cross-reference maps
docs/                GitHub Pages hallway, workbench/runtime, and E1 external factory
```

See [`STATUS.md`](STATUS.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), and [`TRUNK.md`](TRUNK.md).
