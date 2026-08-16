# Stage 15.0 — WASM Main Suite List

Stage 15.0 is a browser workspace/router for the existing H1.1 suites.

Canonical scaffold:

```text
[c[
    v[
        wasm[
            main[
                suite list[
                    (.)
                ]
            ]
        ]
    ]
]]
```

`(.)` is the currently selected working suite. Stage 15.0 is a host/UI envelope. It is not a new I13 semantic word, VM opcode, authority token, corpus node, or execution instruction.

## Goal

The H1.1 Pages surface accumulated many simultaneously visible Stage 14 overlays. That is useful for diagnostics but difficult for routine work. Stage 15.0 changes the default presentation rule to:

```text
suite list[(.)]
        ↓
one working suite open at a time
```

Runtime state is preserved when switching suites. The shell only changes presentation.

## Suite catalog

The initial launcher exposes:

- MAIN / MAP
- I13 READER / VM
- NORMALIZER
- PYTHON INGRESS
- WASM CORE
- WASM VM
- JIT
- GFX
- CORTEX CHILD
- PULSE
- VH1
- VH2 / CUBI
- H1.0 FREEZE
- OLOGY / VOXEL / CV
- CORPUS

Stage 15.0 delegates module expansion/collapse to the existing `I13Exploded` component.

## Corpus work views

CORPUS receives a second bounded list:

```text
NAV
FIELD
MESH
INTENT
EXECUTE
RECEIPT
CURATOR
ALL
```

`ALL` preserves the previous diagnostic presentation. It is not the default.

The default work view is:

```text
CORPUS / CURATOR
```

because Stage 14.9 is the current corpus front door.

The view filter does not stop or rewrite the underlying Stage 14 state machines. It only hides or shows their rendered SVG groups.

## Authority isolation

Stage 15.0 must not call:

- corpus walker movement
- `STEP`
- `REQUEST`
- `BURROW`
- Cortex Verifier
- arrival execution
- receipt-next authority
- curator proposal authority
- corpus mutation

Core law:

```text
SUITE SELECTION != EXECUTION
VIEW SELECTION  != AUTHORITY
HIDDEN          != TERMINATED
VISIBLE         != COMMITTED
```

Switching suites never changes Q, `pending`, local `z`, execution receipt, curator proposal, or corpus records.

## Pages behavior

The shell is a sticky HTML control bar above the existing SVG surface. It stores only the selected suite/view in browser `localStorage`.

The breadcrumb mirrors the canonical envelope, for example:

```text
[c[v[wasm[main[suite list[( CORPUS / CURATOR )]]]]]]
```

## Test gate

Stage 15.0 CI requires:

- JavaScript syntax
- 10/10 shell self-test
- Pages mount in `docs/index.html`
- corpus view catalog contains exactly eight views
- diagnostic `ALL` remains available
- no navigation/execution/curator/CV mutation calls in the shell
