# Stage 14.3 — Browser Cortex Corpus Navigator

Status: H1.1 live implementation.

Stage 14.3 makes the Stage 14.2 compiled corpus walker visible in the existing I13 Pages trunk. The browser does not replace graph traversal with a JavaScript graph engine.

```text
corpus JSONL
  -> Stage 14 CV admission
  -> Stage 14.1 semantic mesh
  -> Stage 14.2 build.rs / CSR tables
  -> Rust -> wasm32-unknown-unknown
  -> docs/assets/i13_h1_1.wasm.b64
  -> Stage 14.3 browser navigator
```

A generated `docs/assets/corpus-browser.json` supplies titles, canonical IDs, domains and V-layer labels for display. It is metadata only. The live next-hop decision comes from:

```text
i13_corpus_walk_next(current, goal, evidence_only, max_steps)
```

## Visible lifecycle

The corpus exploded view renders the current OLOGY root, a bounded route rail and the voxel/CV lifecycle:

```text
current <x,y;0>
   |
   | walk_next()
   v
candidate <x',y';0>

[c[v[
    current root,
    { local z, authority },
    candidate exit
]]cv]

PASS -> commit <x',y';0>
VETO -> hold <x,y;z>
```

The `STEP` control proposes a Wasm next hop but does not commit it. `BURROW` changes local display depth. `CV / EXIT` calls the Stage 14.2 `i13_corpus_burrow` verifier on the current root; only PASS commits the pending surface hop.

`AUTO` repeats the same visible sequence with delays so the Queen can be watched moving root by root.

## Policy controls

- `EVIDENCE` toggles Stage 14.2 evidence-only traversal. Context/Vogel nodes cannot be used in that mode.
- `AUTHORITY` toggles the CV authority input. With authority off, exit is vetoed and the current root is held.
- `GOAL +` cycles through the 54 manifest nodes; the actual route is still chosen by Wasm.

The default route is the current curated World-IV/Sonia overlay start to Fractint target (`sonia-001` -> `fractal-007`). This remains navigation metadata and is not represented as an independently crawled 0root.ai proof.

## Pages asset publication

The repository uses legacy GitHub Pages from `main:/docs`. `.github/workflows/stage14-3-browser.yml` therefore compiles the real release Wasm, generates the browser manifest, validates both, and commits only these generated Pages assets:

```text
docs/assets/i13_h1_1.wasm.b64
docs/assets/corpus-browser.json
```

Source files remain canonical; generated browser assets are reproducible products of CI.
