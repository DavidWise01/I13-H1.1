# Stage 5 — bounded boxes + nested machine depth

Stage 5 changes the reusable exploded-view component itself. Existing Reader/IVM and Stage-4 modules inherit the behavior without being redefined.

## Hard boundary rule

Every exploded section is now treated as a visual boundary.

```text
BOX
├── wrap static row text to available width
├── grow row height when wrapping is needed
└── clip all body rendering to the box interior
```

The clip-path is the final guard. If live stage code later replaces a wrapped row with a longer one-line value, the value may be visually clipped, but it cannot paint across a neighboring section.

Header title/subtitle areas and the machine body also receive independent clipping boundaries.

## Nested depth

Outer stage state and inner machine state are independent:

```text
TRUNK ROW
  └── EXPLODE
       ├── INPUT
       ├── PIPELINE
       ├── STATE
       ├── OUTPUT
       └── MACHINE +
            └── MACHINE / RUNTIME + CONTROLS
```

All machine sections default to collapsed.

Opening `MACHINE +`:

1. expands the current stage's machine/runtime area,
2. reveals that stage's existing controls,
3. recomputes only that panel's height,
4. pushes every later trunk row downward,
5. pushes the OLOGY live lab downward,
6. grows the SVG viewBox and outer object height.

Closing it reverses the reflow without closing the outer stage overview.

## Public API additions

The reusable component is now `I13Exploded.version === "0.2.0"` and adds:

```js
I13Exploded.expandMachine(moduleId)
I13Exploded.collapseMachine(moduleId)
I13Exploded.toggleMachine(moduleId)
```

`I13Exploded.getState(moduleId)` now includes:

```text
expanded
machineExpanded
height
```

The component dispatches `i13-machine-toggle` after a nested machine state change.

## Compatibility

Stage 5 does not modify `docs/i13.svg`.

Existing Stage-3 and Stage-4 control handlers remain attached to their original stage specs. The controls are simply hidden while the nested machine section is closed and become usable when it is opened.

The canonical I13/IVM/Wasm/Python/OLOGY semantics are unchanged; Stage 5 is a layout and interaction refinement.