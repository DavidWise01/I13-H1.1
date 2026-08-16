# Stage 14.6 — Queen Local Intent / Edge Request

Status: live H1.1 browser layer above Stage 14.5.

## Purpose

Stage 14.5 exposes Q's exact local Wasm neighborhood. Stage 14.6 separates **selection**, **intent**, and **commit**:

```text
click neighbor
    ↓
PREVIEW
    ↓
REQUEST
    ↓
Stage 14.6 witnesses selected local edge
against Stage 14.2 Wasm walk_next()
    ↓
PASS → Stage 14.3 creates pending candidate
VETO → hold current root
    ↓
c[v[
    BURROW
]]cv]
    ↓
PASS → commit movement
```

## Authority boundary

Stage 14.6 does **not** mutate the Queen's current root, does not perform burrowing, and does not call Cortex Verifier. It may only ask Stage 14.3 to propose the active Wasm next-hop after independently checking that the selected neighbor matches that next-hop.

A click remains preview-only. `ARM` selects the current Wasm next-hop for inspection. `REQUEST` converts that preview into intent. Even a successful request produces only `pending`; it still requires `BURROW` and `CV / EXIT`.

## Intent verdicts

- `ADMISSIBLE` — selected neighbor is local and equals the current Wasm next-hop.
- `NO_SELECTION` — no local neighbor selected.
- `NOT_LOCAL` — selection is not exposed by the current Wasm neighborhood.
- `NO_ROUTE` — bounded Wasm traversal has no admissible next-hop.
- `ROUTE_MISMATCH` — selected neighbor is local but is not the active route next-hop.
- `PENDING_EXISTS` — Stage 14.3 already owns an unverified candidate.

Evidence mode is inherited from Stage 14.3 and therefore changes both the Wasm next-hop and the local neighborhood visible to Stage 14.6.

## Invariant

```text
preview != request != pending != commit

selected edge
  + local Wasm membership
  + route-next witness
  = request admissible

request admissible
  -> Stage 14.3 step()
  -> pending candidate only

pending
  -> c[v[ ... ]]cv]
  -> PASS
  -> move
```
