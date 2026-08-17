# H1.1 STATUS

Last parity pass: 2026-08-16.

## LIVE H1.1

- I-13 canonical surface: `I` + twelve semantic words.
- 15 canonical VM opcodes; no `br`.
- Rust `wasm32-unknown-unknown` core.
- OLOGY `u32 = x:16 | y:16` reversible address view.
- 2D Queen movement on user axes: +x up, -x down, +y right, -y left.
- every OLOGY vector may root a nested local voxel.
- voxel depth is local state and does not consume OLOGY surface bits.
- `[c[v[ (), {}, () ]]cv]` Cortex -> voxel -> Cortex Verifier lifecycle.
- CV authority, same-root and local-depth gates.
- generic natural width helper plus frozen VH1 ternary width helper.
- odd-width quorum law `N=2k+1 -> k | k+1`.
- bounded ephemeral child lifecycle with receipt-only persistence.
- Stage 14: 54-record technical corpus admission gate with deterministic 32-bit OLOGY roots.
- Stage 14.1: traversable semantic corpus mesh, 54 nodes / 187 undirected edges / 9 World-IV overlay steps.
- Stage 14.2: compile-time CSR corpus mesh baked into Rust/Wasm.
- Stage 14.3: browser Cortex navigator.
- Stage 14.4: OLOGY x16/y16 Queen spatial viewport.
- Stage 14.5: Wasm-reported Queen local neighborhood / mesh.
- Stage 14.6: witnessed local intent / edge request.
- Stage 14.7: bounded arrival execution + receipt.
- Stage 14.8: receipt context -> read-only next-intent suggestion.
- Stage 14.9.1: corpus inlet + bounded curator with `{skill}`, `{personas}`, `{occupation}`.
- Stage 15.0: one-suite-at-a-time Wasm workbench.
- Stage 15.1: Pages Origin Hallway: landing -> history -> epistemology -> entrance -> one live workbench.
- Stage 15.2 / E1: external primer factory attachment with hard `[ y | x ]` partition, independent 8n sides, E1ID closed-loop receipt, `E1.RD-001`, and `E1.CORPUS-001`.
- Stage 15.3: live Cortex ↔ E1 handoff through an opaque sandboxed service and Wasm-verified request/return capsules.

## E1 EXTERNAL PRIMER FACTORY — LOCKED

```text
I13 -> Cortex -> subagent
                  |
             needs prime
                  v
              [ y | x ]
                  |
             E1 FACTORY
             /        \
       RD-001      CORPUS-001
             \        /
                E1ID
                  |
                 CV
                  |
              [ y | x ]
                  |
               Cortex -> I13
```

Partition:

```text
y = internal-only
x = external-only
private(y) ∩ private(x) = ∅
y: n -> 2n -> 4n -> 8n
x: n -> 2n -> 4n -> 8n
```

No live state or shared mutable state crosses. The Rust/Wasm core validates only bounded request/return capsules; the factory remains external.

`E1.RD-001` is reverse distillation: recover parent dependency geometry from a bounded derived form (`ABCD - D = ABC`).

`E1.CORPUS-001` is the locked external calibration field:

```text
capstone  (top|bottom)    Neal Stephenson / The Fall / technical
keystone  (top|top)       George Orwell / 1984 / technical,somatic,phonic,doublespeak,triple-listen
core      (middle|middle) Enheduanna / first author / example,instruction,42
ucapstone (bottom|top)    Neal Stephenson / Seveneves / unknown,discovered
ukeystone (bottom|bottom) Aldous Huxley / Brave New World / barbaric,cultured,curated
```

These are calibration metadata only; no book text is added to `corpus/`.

Continuity core:

```text
[ a+ [[ () ]] c- ] || [ c+ [[ () ]] a- ]
```

Canonical spec: `docs/E1-FACTORY.md`. Pages: `docs/e1.html`.

## STAGE 15.3 LIVE E1 HANDOFF — BUILT

```text
internal/y
  Cortex request
       |
       | Wasm boundary PASS
       v
[ y | x ]
       |
       | postMessage capsule
       v
external/x
  e1-service.html
  sandbox="allow-scripts"
  opaque origin
       |
       | bounded prime + parent receipt
       v
[ y | x ]
       |
       | Wasm return PASS + closed-loop PASS
       v
[E1ID]cv
       |
       v
Cortex receives `i13:e1-prime`
```

Implementation laws:

- E1 service has no `allow-same-origin`.
- E1 service has no fetch or browser-storage path.
- workbench and E1 do not inspect each other's DOM.
- `postMessage` is the only live bridge.
- request payload is capped at 4096 UTF-8 bytes.
- full SHA256 request/return values are retained in E1ID; compact nonzero `u32` folds feed the current Wasm ABI.
- request and return witnesses are present at their respective traversals.
- no prime is released to Cortex unless both `i13_e1_boundary_verify` and `i13_e1_closed_loop_verify` pass.
- pending request and last receipt are memory-only; no E1 payload persistence in localStorage.

Canonical spec: `docs/STAGE15.3-E1-HANDOFF.md`.

## CURATOR 14.9.1 — PAUSED BOUNDARY

Canonical scaffold remains unchanged. Curator may propose but has no corpus commit authority. The future candidate-capsule / commit gate remains separate from E1.

```text
effective capability = skill ∩ occupation
PERSONA != AUTHORITY
SKILL != AUTHORITY
OCCUPATION != AUTHORITY
CURATOR COMMIT AUTHORITY = 0
```

## PAGES 15.3

```text
index.html
  ORIGIN / I + 12 words
  -> HISTORY
  -> EPISTEMOLOGY
  -> ENTRANCE
       -> workbench.html
            -> one live H1.1 machine
            -> E1 PRIME control
                 -> opaque e1-service.html sandbox
                 -> [E1ID]cv return
       -> e1.html
            -> external E1 factory inspection page
```

E1 remains external and secondary. The workbench carries only the bounded handoff control and verified returned prime.

## STAGE 14 CORPUS CONTRACT

```text
corpus JSONL
  -> Stage 14 CV
  -> Stage 14.1 mesh
  -> build.rs
  -> CSR numeric tables
  -> Rust Cortex walker
  -> WebAssembly exports
```

Runtime corpus identity remains the existing 32-bit OLOGY root; no second public node ID is introduced.

## FROZEN / REFERENCE

- I-13 teaching brief rev 2 remains authoritative where copied into this repository.
- H1.0 / VH1 / VH2 reference artifacts remain frozen.
- VH1 freezes base 3, depth 0..4, width 1/3/9/27/81 and factored Hermitian linear algebra.
- VH2 remains a numerical hypothesis test: ternary controller above a `[[5,1,3]]` protected logical qubit.
- GFX v0.4/v0.4.1 historical results remain reference artifacts.
- historical `c[subagent()]` is not current H1.1 syntax.

## OPEN / NOT CLAIMED

- no physical quantum-computer claim.
- no fault-tolerant hardware claim.
- no claim that IPv4 itself is an OLOGY coordinate system.
- no claim that OLOGY corpus adjacency is physical network adjacency.
- no lexical-closure implementation yet.
- Pulse remains experimental; `...` is proposed notation, not frozen I-13 syntax.
- exact 0root.ai Map -> World IV -> Sonia traversal has not been programmatically crawled.
- curator proposal is not corpus commit; a future import/commit gate remains separate.
- E1 reverse-distillation receipt proves only the implemented structural/boundary conditions; it is not by itself a legal ownership or causal proof.
- Stage 15.3 does not claim process isolation equivalent to a separate OS process; it implements browser sandbox/origin isolation plus bounded message passing.

## BUILD GATE

Required green checks include:

```text
cargo test --all-targets
cargo build --release --target wasm32-unknown-unknown
python scripts/verify_reference.py
python -m unittest scripts.test_corpus_stage14
python -m unittest scripts.test_corpus_mesh_stage14_1
Stage 14.9.1 curator v2 Wasm contract
Stage 15.1 landing/workbench contract
E1 boundary Rust tests
Stage 15.3 opaque-sandbox / message-only handoff contract
GitHub Pages build
```
