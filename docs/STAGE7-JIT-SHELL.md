# Stage 7 — JIT shell v0.2

Stage 7 fills the remaining front-half Pages gap by mounting the existing `jit` trunk row into the bounded exploded-view system.

Historical/reference status preserved from the trunk:

```text
JIT shell v0.2 .............. 7/7 PASS
capability-addressed shell
safe numeric execution
deterministic cache
```

The interactive panel is a **Pages reference trace** over that architecture. It does not claim to rerun the historical v0.2 7/7 suite in-browser.

## Exploded shape

```text
INPUT
  validated I-13 IR
  demo: I out <- 4 + 2
  requested capability: numeric

PIPELINE
  resolve deterministic execution address
  gate requested capability
  lookup deterministic cache
  dispatch bounded numeric operation
  commit cache + return receipt

STATE
  phase
  execution address
  capability GRANTED / DENIED
  cache UNREAD / MISS / HIT / COMMITTED

OUTPUT
  result
  verdict
  receipt

MACHINE +
  reference status
  current phase
  address
  cache state
  numeric dispatch
  verdict / receipt
```

All text remains under the Stage-5 box-boundary rules.

## Controls

```text
RESET   restore the trace to REQUEST
STEP    execute one JIT phase
RUN     run the bounded trace to RETURN or VETO
CACHE   inspect the current deterministic cache
CAP ON  toggle the demo capability gate
```

The capability toggle exists so the same visible trace can demonstrate both an allowed path and a veto path.

## Reference trace

Cold path:

```text
REQUEST
  -> ADDRESS
  -> CAPABILITY PASS
  -> CACHE MISS
  -> DISPATCH add(4,2)
  -> COMMIT
  -> RETURN 6
```

A subsequent run with the same execution address observes the previously committed cache entry and takes the HIT path.

With capability disabled:

```text
REQUEST
  -> ADDRESS
  -> CAPABILITY VETO
  -> stop
```

The execution address in this Pages demo is a deterministic 32-bit FNV-1a hash over the demo capability/operation/arguments. That hash choice belongs to the visualization/reference trace; it is not asserted as the historical JIT v0.2 address algorithm.

## Deliberate non-changes

- `docs/i13.svg` remains unchanged.
- Reader/IVM remains unchanged.
- Normalizer/Validator remains unchanged.
- Python ingress/roundtrip remains unchanged.
- Browser-native Wasm remains unchanged.
- Wasm validator/numeric VM remains unchanged.
- Stage-5 nested `MACHINE +` behavior is reused, not replaced.
- Stage-6 OLOGY observer remains unchanged.
- GFX, Cortex child, Pulse, VH1/VH2, freeze, corpus, and OLOGY are not newly mounted by Stage 7.
