# I13-H1.1

**I13 · Icarium · Wasm · Rust · Machina**

H1.1 is the live development trunk. H1.0 remains frozen.

Current execution target:

```text
I-13 source
  -> reader / normalizer
  -> I-13 IR
  -> Cortex
  -> Rust core
  -> WebAssembly
  -> JS/WebGPU host
```

Current H1.1 spatial model:

```text
32-bit OLOGY surface
= x:16 | y:16

ln = <x,y>

Every surface vector roots a local voxel.
Depth is nested local state; it does not consume the 32-bit surface address.

Cortex enters / works / verifies before exit:
[c[v[ (), {}, () ]]cv]
```

Meaning:

- `c[v[` — Cortex enters a voxel rooted at the current OLOGY vector.
- first `()` — state entering the voxel.
- `{}` — local voxel volume/context.
- second `()` — state emerging from the voxel.
- `]]cv]` — close/leave voxel, then Cortex Verifier gates exit.
- surface movement uses a 2D displacement vector; voxel movement is burrowing at the same surface root.

See [`TRUNK.md`](TRUNK.md) for the path from the first I-13 tooling through the current H1.1 model.

The GitHub Pages source is [`docs/index.html`](docs/index.html). Its visible body contains only Icarium's canonical 13 I-13 words.
