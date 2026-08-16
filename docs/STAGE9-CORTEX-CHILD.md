# Stage 9 — bounded Cortex child

Stage 9 mounts the existing `child` trunk row into the bounded exploded-view system.

The source contract is already present in H1.1:

```text
[c[
    ( ... ),
    ( isa , decoder , module ),
    { c.n , fractal , x( .() ) }
        <- (c.n)
    n = depth
]]
```

Lifecycle:

```text
0
-> RESOLVE
-> BIND
-> SPAWN
-> DECODE
-> EXECUTE
-> RETURN
-> WITNESS
-> TERMINATE
-> 0
```

Core invariants preserved by Stage 9:

```text
child authority ........ inherited + bounded by Cortex
private mutable state .. dies at termination
explicit receipt ....... may survive
provenance ............. may survive
outside direct commit .. forbidden
(isa,decoder,module) ... execution context, not persistent agent identity
```

The Rust H1.1 reference module already models the same boundary with `CortexChild`, `ChildPhase`, and `ChildReceipt`. Its receipt contains child id, depth, width, witness, and termination state; child-private mutable state is deliberately omitted.

## Exploded shape

```text
INPUT
  canonical child form
  c.n = 4
  reference width = 81
  private sample = 0xdeadbeef
  witness sample = 42

PIPELINE
  RESOLVE -> BIND -> SPAWN
  DECODE -> EXECUTE
  RETURN -> WITNESS
  TERMINATE -> 0
  inherited bounded authority
  no direct outside commit
  explicit result / receipt may survive

STATE
  lifecycle phase
  child presence / id
  depth / width
  private state
  optional GFX observation
  witness state

OUTPUT
  explicit result
  surviving receipt
  direct-commit boundary
  termination/private-state status
  clipped lifecycle rail

MACHINE +
  canonical child form
  full lifecycle
  current phase
  authority boundary
  private-state status
  receipt
  current note
```

## Controls

```text
RESET        return the Pages trace to initial zero
STEP         execute one lifecycle transition
RUN          execute the bounded lifecycle through final zero
OBSERVE GFX  read Stage-8 scene state without editing GFX
RECEIPT      inspect the explicit receipt boundary
```

`OBSERVE GFX` is intentionally read-only. It reads the existing Stage-8 panel state and treats that observation as child-local context. Stage 9 does not invoke Stage-8 mutation controls.

## Lifecycle rail

The OUTPUT box contains a small clipped phase rail:

```text
0 R B S D E R W T 0
```

The active phase is highlighted. Completed phases remain lightly marked. The rail gets its own clip-path and cannot paint beyond the OUTPUT box.

## Pages reference trace

The Pages demo uses:

```text
child id .... 13
depth ....... 4
width ....... 81
witness ..... 42
private ..... 0xdeadbeef
```

During `EXECUTE`, the private sample is present inside the child scope. At `RETURN`, an explicit receipt begins to exist. At `WITNESS`, witness `42` is attached. At `TERMINATE`, private state is erased and the receipt is marked terminated. Final `0` retains the explicit receipt but no child-private state.

This matches the source rule that explicit result/receipt/provenance may survive while private mutable state does not.

## GFX relationship

The preserved v0.4.1 scene subagent/controller is a concrete example of a deterministic local observer/controller. Its historical report records selection/gesture/camera observation plus focus, snap `.25`, reset-object, and reset-camera actions, and explicitly says it is not a separate AI model.

Stage 9 only implements the observation half against the Stage-8 reference panel. It does not claim to recreate the historical v0.4.1 controller or autonomous scene editing.

## Deliberate non-changes

- `docs/i13.svg` remains unchanged.
- Stage 8 GFX remains unchanged.
- OLOGY remains unchanged.
- the Rust `src/child.rs` semantics remain unchanged.
- Pulse, VH1, VH2, freeze, corpus, and OLOGY are not newly mounted by Stage 9.
- the Pages child trace is a deterministic visualization of the existing contract, not a separate AI process.
