# H1.1 STATUS

Last parity pass: 2026-08-15.

## LIVE H1.1

- I-13 canonical surface documented.
- Rust `wasm32-unknown-unknown` core.
- OLOGY `u32 = x:16 | y:16` reversible address view.
- 2D Queen movement on user axes: +x up, -x down, +y right, -y left.
- every OLOGY vector may root a nested local voxel.
- voxel depth is local state and does not consume OLOGY surface bits.
- `[c[v[ (), {}, () ]]cv]` current Cortex -> voxel -> Cortex Verifier lifecycle.
- CV authority, same-root and local-depth gates.
- generic natural width helper plus frozen VH1 ternary width helper.
- odd-width quorum law `N=2k+1 -> k | k+1`.
- bounded ephemeral child lifecycle with receipt-only persistence.
- 54-record technical corpus.
- GitHub Pages source intentionally restricted to Icarium's 13 words.

## FROZEN / REFERENCE

- I-13 teaching brief rev 2 is authoritative for the historical language surface where copied into this repository.
- VH1 freezes base 3, depth 0..4, width 1/3/9/27/81 and factored Hermitian linear algebra.
- VH2 is a numerical hypothesis test: ternary controller above a `[[5,1,3]]` protected logical qubit; it rejects a ternary quantum basis inside the same rank-2 code space.
- GFX v0.4/v0.4.1 historical results remain reference artifacts; target-browser GPU rendering was not verified in the original container.
- historical `c[subagent()]` is not current H1.1 syntax.

## OPEN / NOT CLAIMED

- no physical quantum-computer claim.
- no fault-tolerant hardware claim.
- no claim that IPv4 itself is an OLOGY coordinate system.
- no claim that every 2-erasure partition of the five-qubit code has been independently reconstruction-tested in this repository yet.
- no lexical-closure implementation yet.
- Pulse remains experimental; `...` is a proposed hard pulse boundary, not a frozen I-13 token.
- exact 0root.ai Map -> World IV -> Sonia traversal has not been programmatically crawled; the Sonia technical branch is independently correlated.

## BUILD GATE

Required green checks:

```text
cargo test --all-targets
cargo build --release --target wasm32-unknown-unknown
python scripts/verify_reference.py
```
