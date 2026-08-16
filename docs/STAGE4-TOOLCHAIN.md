# Stage 4 — Normalizer / Python / Wasm exploded views

Stage 4 extends the reusable exploded-view system across the remaining front-half toolchain rows.

Mounted in Stage 4:

```text
norm
python
wasm1
wasm2
```

Already mounted from Stage 3:

```text
reader
```

Still intentionally unmounted:

```text
jit
gfx
child
pulse
vh1
vh2
freeze
corpus
ology
```

All Stage-4 panels are collapsed by default.

## NORMALIZER + VALIDATOR

Expanded shape:

```text
INPUT
  reader handoff
  source + byte provenance
  AST / canonical candidates

PIPELINE
  NORMALIZE
  MAP provenance
  VALIDATE one region at a time
  Block / If / Else / End depth-targeted control

STATE
  provenance
  recorded v0.2 suite status
  validation region h = 0
  preserve-not-guess loss policy

OUTPUT
  canonical handoff
  receipt
  status
```

Controls:

```text
RESET
RECEIPT
```

`RECEIPT` exposes the frozen/reference v0.2 status (`12/12 PASS`) and its provenance-complete handoff. It is a reference-inspection control, not a claim that the historical normalizer suite was rerun in the browser.

## PYTHON INGRESS + ROUNDTRIP

Expanded shape:

```text
Python source
  -> CPython AST
  -> Python → I-13 adapter
  -> preserve unsupported syntax
  -> I-13 → Python projection
```

Recorded reference statuses remain visible:

```text
Python ingress v0.1 ............ 10/10 PASS
Python → I13 → Python .......... 12/12 PASS
```

Controls:

```text
RESET
PY ENGINE
```

`PY ENGINE` does not create a second Python runtime. It programmatically invokes the existing `PY ENGINE` control in `docs/i13.svg`, which lazy-loads Pyodide and performs the existing CPython AST + Pulse smoke check. The panel then reads the live SVG runtime status back into the exploded view.

The live Pyodide smoke is distinct from the recorded ingress/roundtrip suites.

## BROWSER-NATIVE WASM v0.1

The panel separates historical/reference data from the current Pages micro-core.

Historical v0.1 report:

```text
WASM primitive suite ........... 8/8 PASS
I13 → WASM pipeline ............. 6/6 PASS
combined ........................ 14/14
historical module ............... 1193 bytes
full Cortex rule mask ........... 0x3f
```

Current Pages runtime:

```text
embedded OLOGY / CV / Pulse Wasm micro-core
```

Controls:

```text
RESET
WASM SELFTEST
```

`WASM SELFTEST` reuses the existing live SVG control and mirrors its current result into the exploded panel. It does not relabel the current micro-core as the historical v0.1 binary.

## WASM VALIDATOR + NUMERIC VM v0.2

Expanded shape:

```text
I-13 opcode stream
  -> region validation (h = 0)
  -> depth-targeted control validation
  -> numeric VM
  -> runtime call-arity boundary
```

Reference baseline displayed by `CHECK`:

```text
Const Ask Attr Ret Answer Drop Bin Cmp If Call Block Else End Func Halt
```

The check asserts only the visible baseline invariants used by this panel:

```text
opcode count = 15
br absent
region start = h = 0
numeric value = f64
```

Recorded historical suite status remains `9/9 PASS`; `CHECK` is a Pages invariant check, not a rerun of that full historical suite.

## Layout

Any combination of Reader, Normalizer, Python, browser-Wasm, and Wasm-validator panels can be expanded simultaneously. The Stage-2 component computes cumulative offsets, pushes later trunk rows downward, moves the OLOGY live lab, and grows/restores the SVG viewBox and wrapper height.

The original `docs/i13.svg` remains unchanged by Stage 4.
