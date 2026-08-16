# Stage 13.1 — Glass + Boundary Tightening

Stage 13.1 is a layout/runtime pass over the reusable exploded-view component. It does **not** change the frozen H1.0 semantics carried by Stage 13.

## Goal

Remove content collisions while keeping the exploded stage grid deterministic and visually coherent.

```text
outer panel
  -> holographic glass shell
  -> INPUT | PIPELINE | STATE | OUTPUT
       each section owns:
         body viewport
         fixed footer rail
         overflow pager when needed
  -> MACHINE / RUNTIME
       fixed body viewport
       overflow pager when needed
```

## Boundary rule

Every top section now reserves a **56 px footer rail**. The body clip stops before that rail.

Stage 13 already positions the H1.0 / H1.1+ boundary graphic at:

```text
gy = section_y + section_height - 56
```

Therefore the existing Stage-13 boundary graphic lands exactly in the new footer rail. No H1.0 freeze meaning or Stage-13 verifier behavior is rewritten.

## Overflow behavior

The component keeps `maxRows = 7` per page. More than seven rows are split into fixed-height pages.

```text
page 1 -> MORE 1/N ↓
page 2 -> MORE 2/N ↓
...
last   -> LESS N/N ↑
```

The section boundary does not resize while paging. The component computes a stable body height from the tallest page so later pages cannot collide with the footer.

The same paging rule applies to expanded `MACHINE / RUNTIME` content.

## Glass system

The component injects SVG-native translucent gradients and soft drop shadows:

```text
ev-glass-shell
ev-glass-header
ev-glass-section
ev-glass-machine
ev-glass-control
ev-glass-shadow
ev-glass-shadow-soft
```

Family color remains an edge/accent signal (`i13`, `python`, `wasm`, `gpu`, `cortex`, `la`, `qec`, `freeze`, `live`) rather than an opaque panel fill.

## Component version

```text
I13Exploded.version = 0.3.1
layout = 13.1-glass-boundary
```

New public helpers:

```text
I13Exploded.cycleSectionPage(moduleId, sectionIndex)
I13Exploded.cycleMachinePage(moduleId)
```

Existing mount, collapse, explode, machine-toggle, reflow and state APIs remain available.

## Invariant

```text
CONTENT -> BODY CLIP -> FOOTER BOUNDARY -> NO COLLISION
```

Stage 13.1 changes presentation/layout only. H1.0 stays frozen.
