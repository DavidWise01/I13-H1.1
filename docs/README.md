# I13 GitHub Pages

The Pages UI has one visual source of truth:

```text
docs/i13.svg
```

`index.html` is only a thin wrapper so GitHub Pages opens the SVG at the repository root URL.

## Adding a module

Add one object to the `MODULES` array inside `i13.svg`:

```js
{
  id: 'module-id',
  title: 'MODULE NAME',
  version: 'vX.Y',
  eng: ['I13', 'WASM', 'PY'],
  status: 'test/status',
  body: ['line one', 'line two']
}
```

The trunk renderer lays modules onto the vertical spine automatically.

## Embedded engines

- **Wasm:** a tiny OLOGY/CV/Pulse reference core is embedded directly as base64 WebAssembly and self-tests on page load.
- **Python:** Python is intentionally lazy-loaded only when requested through the `PY ENGINE` control. It uses Pyodide in-browser and runs the Python AST + Pulse reference check.
- **SVG:** the 2D OLOGY surface, vector-rooted voxel, Queen movement, burrowing, authority toggle, and CV verdict are all drawn and controlled inside the single SVG.

The large historical/source engines remain in the repository; this SVG is the live visual/runtime map, not a replacement for those sources.
