# I13 reusable exploded-view component

Stage 2 introduces a reusable SVG layout component without applying it to any trunk stage yet.

Runtime file:

```text
docs/exploded-view.js
```

The Pages wrapper loads it after the existing color system. It attaches to `docs/i13.svg` through the `<object id="i13">` boundary and exposes:

```js
I13Exploded.mount(moduleId, spec)
I13Exploded.unmount(moduleId)
I13Exploded.expand(moduleId)
I13Exploded.collapse(moduleId)
I13Exploded.toggle(moduleId)
I13Exploded.getState(moduleId)
I13Exploded.selfTest()
I13Exploded.isReady()
I13Exploded.mountedCount()
```

## Exploded-stage shape

Every mounted stage can provide six logical areas:

```text
INPUT -> PIPELINE -> STATE -> OUTPUT

MACHINE / RUNTIME
CONTROLS
```

Minimal spec:

```js
I13Exploded.mount('reader', {
  title: 'READER + IVM-13 · EXPLODED',
  family: 'i13',
  input: ['source text'],
  pipeline: ['read', 'decode'],
  state: ['instruction pointer', 'stack'],
  output: ['result / receipt'],
  machine: ['optional machine detail'],
  controls: []
})
```

## Layout behavior

A mounted stage receives an `EXPLODE` control. Panels are collapsed unless `expanded:true` is supplied.

When a panel expands:

1. its panel opens immediately below the stage row,
2. every later trunk stage moves downward by that panel's computed height,
3. the OLOGY live lab moves downward by the same accumulated amount,
4. the SVG height/viewBox and outer `<object>` height grow to fit,
5. collapse reverses the reflow.

This lets multiple stages be exploded without overlapping one another or the OLOGY lab.

## Component rules

- Component owns layout only; stage-specific semantics stay in each stage's spec.
- Stage 2 mounts **zero** trunk modules.
- Stage 3 is the first consumer and will apply the component to `reader` / IVM.
- Existing `docs/i13.svg` runtime behavior is not replaced.
- The Stage 1 color variables are reused; family colors are not duplicated as hard-coded stage palettes.
- Deeper machine sections remain collapsible through the stage-level EXPLODE/CLOSE gate.

## Families

Current panel-border families:

```text
i13
python
wasm
gpu
cortex
live
```

Additional families can be added without changing the component layout contract.

## Readiness

The component dispatches:

```text
i13-exploded-ready
```

when the embedded SVG is available and the layout machinery has initialized. The event detail is the result of `I13Exploded.selfTest()`.
