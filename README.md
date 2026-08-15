# I13-H1.1

**I13 · Icarium · Wasm · Rust · Machina**

H1.1 is the live development trunk. H1.0 and VH1 reference material remain frozen and are carried under `reference/` without silently changing their semantics.

```text
I-13 source
  -> reader / normalize / I-13 IR
  -> Cortex
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

## Repository map

```text
src/                 live H1.1 Rust/Wasm reference core
spec/                live semantics and frozen-boundary notes
reference/vh1/       frozen ternary/Hamiltonian reference
reference/vh2/       five-qubit CUBI hypothesis reference
reference/legacy/    historical Wasm/GPU proof artifacts
examples/            I-13 programs
corpus/              technical corpus + cross-reference maps
docs/                one GitHub Pages page: Icarium's 13 words only
```

See [`STATUS.md`](STATUS.md), [`ARCHITECTURE.md`](ARCHITECTURE.md), and [`TRUNK.md`](TRUNK.md).
