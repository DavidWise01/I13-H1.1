# I13 Browser Build Contract — WASM + 3D v1.0

Every new interactive visual build in this suite must include:

1. A browser-native WebAssembly decision or transformation core.
2. A Three.js 3D scene with orbit, zoom, responsive resize, lighting, and depth.
3. A deterministic non-browser reference implementation.
4. An in-browser primitive self-test with a visible PASS/FAIL witness.
5. Syntax validation, reference tests, WASM instantiation tests, and regression checks before merge.
6. A symbolic-model label wherever the visualization is not an established physical model.

The browser gate must not require Python. Python is reference and audit support only.
