# Stage 10 — Pulse experimental threshold lane

Stage 10 mounts the existing `pulse` trunk row into the bounded exploded-view system.

Pulse is **experimental H1.1**, not frozen I-13 syntax. The preserved numerical helper is:

```text
adjusted_vector = state_vector + threshold_boundary
if adjusted_vector > 128:
    return adjusted_vector * verification_witness
return none
```

Reference cases:

```text
PASS
120 + 10 = 130
130 > 128
130 × 2 = 260

EDGE
120 + 8 = 128
128 > 128 is false
return none
```

The strict `>` operator is part of the preserved experiment. Stage 10 does not silently change it to `>=`.

## Experimental notation lane

```text
.    atomic point
..   reserved soft continuation/range — semantics not frozen
...  experimental hard pulse/commit boundary
```

The Rust helper exists to pin the numerical experiment only. It does not make `...` a canonical I-13 token.

## Exploded shape

```text
INPUT
  state_vector
  threshold_boundary
  verification_witness
  experimental-lane notice

PIPELINE
  add state + threshold
  compare strictly > 128
  if true, apply witness
  if false, return none
  equality does not pass

STATE
  current phase
  adjusted_vector
  gate PASS / FAIL
  fixed boundary 128
  witness value

OUTPUT
  Option(result)
  status
  receipt
  experimental ... notation marker
  clipped threshold gauge

MACHINE +
  numerical helper
  selected reference case
  current phase
  adjusted value
  strict gate
  output
  notation status
```

## Controls

```text
RESET       reset the selected case
STEP        advance one numerical phase
RUN         execute the selected case to completion
CASE PASS   toggle PASS / EDGE reference cases
NOTATION    show the experimental punctuation lane
```

## Threshold gauge

The OUTPUT box contains a clipped gauge around the numerical neighborhood of the fixed `128` boundary.

- PASS case moves from `120` to adjusted `130`, to the passing side of the boundary.
- EDGE case moves from `120` to adjusted `128`, exactly on the boundary; because the test is strict `>`, it fails.
- the gauge has its own SVG clip-path and cannot paint outside the OUTPUT box.

## Deliberate non-changes

- `docs/i13.svg` remains unchanged.
- `src/pulse.rs` remains unchanged.
- Stage 10 does not promote Pulse punctuation to canonical I-13 syntax.
- Stage 10 does not claim Pulse is a scheduler, authority layer, or networking primitive beyond what the existing experiment supports.
- Cortex Child remains unchanged.
- GFX remains unchanged.
- OLOGY remains unchanged.
- VH1, VH2, freeze, corpus, and OLOGY are not newly mounted by Stage 10.
