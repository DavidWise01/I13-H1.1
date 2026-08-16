# Stage 6 — OLOGY stays the live/current destination

Stage 6 completes the original six-step Pages refinement by preserving the existing OLOGY / voxel / Cortex Verifier lab as the most active demonstration on the page.

The Stage 6 layer is observational. It does **not** replace the runtime already embedded in `docs/i13.svg`.

## Added

```text
OLOGY trunk row
  └── LIVE LAB
        ↓
CURRENT · OLOGY / VOXEL / CV LAB
  ├── existing Queen movement
  ├── existing voxel burrow
  ├── existing authority toggle
  ├── existing CV VERIFY
  ├── existing WASM SELFTEST
  ├── existing PY ENGINE
  └── Stage-6 read-only status mirror
```

`LIVE LAB` scrolls to the current lab using its actual transformed position. This remains correct when earlier exploded panels have pushed the lab downward.

## Current / live badge

The lab receives a small `LIVE · CURRENT` marker. The existing OLOGY trunk row keeps its green current-stage treatment and receives a pulsing live indicator on the jump control.

## Status mirror

A bounded strip below the existing controls mirrors:

```text
SURFACE  <- existing #addr
DEPTH    <- existing #depth-label
CV       <- existing #cv-label
WASM     <- existing #runtime
PY       <- existing #py-runtime
```

The mirror observes those existing nodes with `MutationObserver`. It does not maintain a parallel OLOGY state machine.

Long values are compacted in the mirror so the Stage-5 box/boundary rule remains intact.

## Source-of-truth rule

```text
existing i13.svg runtime = SOURCE OF TRUTH
Stage 6 overlay          = OBSERVER / NAVIGATION / STATUS
```

The existing controls continue to execute their original handlers. Stage 6 watches their resulting state and refreshes the status strip.

## Deliberate non-changes

- `docs/i13.svg` remains unchanged.
- OLOGY is **not** mounted into the reusable exploded-view component.
- Queen movement semantics are unchanged.
- `c[v[ (), {}, () ]]cv` semantics are unchanged.
- Wasm self-test behavior is unchanged.
- Pyodide / Python on-demand behavior is unchanged.
- Stage 3 / Stage 4 exploded panels remain unchanged.
- Stage 5 nested MACHINE behavior remains unchanged.

This keeps the trunk explanatory and collapsible while OLOGY remains the page's active runtime destination.
