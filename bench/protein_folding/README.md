# Protein folding benchmark

These targets exercise the checked I13 compiler and reference VM with a
deterministic lattice-folding workload. They are logic benchmarks, not physical
protein models.

## N1 — hydrophobic oracle

`n1_hydrophobic_oracle.i13` reconstructs a connected, self-avoiding
731-residue walk. Its optimized inverse lattice map checks the three positive
spatial neighbors of each residue, counting every undirected noncovalent
contact exactly once. Locked globals:

```text
RESIDUES=731 MOVES=730 HYDROPHOBIC_RESIDUES=399
HYDROPHOBIC_CONTACTS=365 BROKEN_BONDS=0 COLLISIONS=0
ENERGY=-365 VALID=1 VERDICT=1
```

The original quadratic scan hit the VM's exact 8,000,000-step ceiling after
27.065 seconds. The inverse-map form is the benchmark's optimized baseline.
Integer quotients are formed explicitly as `(n - n%d) / d` because I13 `/`
uses numeric division rather than implicit floor division.

## N2 — collision oracle

`n2_collision_oracle.i13` traverses a four-site unit square twice and returns
to the origin. It counts every equal-site residue pair, rather than only
immediate backtracking. Locked globals:

```text
RESIDUES=9 COLLISION_PAIRS=6 BROKEN_BONDS=0 ENERGY=60000 VERDICT=1
```

Run when the Rust toolchain is installed:

```sh
cargo run --offline --bin i13 -- check bench/protein_folding/n1_hydrophobic_oracle.i13
cargo run --offline --bin i13 -- run bench/protein_folding/n1_hydrophobic_oracle.i13
cargo run --offline --bin i13 -- check bench/protein_folding/n2_collision_oracle.i13
cargo run --offline --bin i13 -- run bench/protein_folding/n2_collision_oracle.i13
```

Full Cargo -> I13 -> Wasm -> benchmark receipt:

```sh
cargo build --offline --bin i13
target/debug/i13 build bench/protein_folding/n1_hydrophobic_oracle.i13 \
  -o bench/protein_folding/n1_hydrophobic_oracle.wasm
node bench/protein_folding/run_wasm_bench.mjs \
  bench/protein_folding/n1_hydrophobic_oracle.wasm
```

The Wasm backend lowers arrays to a private bounded linear-memory arena. N3
locks VM-compatible clone-on-write behavior: each `ArraySet` copies the source
allocation, changes the copy, and returns its new handle while the original
array remains unchanged.

N4 starts the arena at one 64 KiB page and grows only as allocations require,
up to a fixed 16-page / 1 MiB maximum. `n4_arena_growth.i13` proves successful
cross-page growth. `n4_arena_exhaustion.i13` proves deterministic trapping at
the cap, and the stress runner proves a fresh instance remains executable.

N5 adds `i13_reset` and witnesses same-instance recovery as one three-plane
transition per global: `[payload, kind, bound]` moves from initial, through the
trapped state, back to `[0, 0, 0]`. Frame depth returns to `1` and heap offset
returns to `0`; repeating the trap/reset cycle proves the instance is reusable.

N6 canonicalizes each phase as sorted `[name, payload, kind, bound]` tuples plus
frame and heap, hashes all three phases with SHA-256, and binds them into one
transition-chain hash. Two independent Wasm instances must produce identical
receipts before `n6_state_receipt.json` is accepted.

N7 stores the canonical phase states in the receipt and independently
recomputes every phase and chain hash. Its tamper suite changes payload, kind,
bound, frame, and heap separately, then flips one bit in each stored hash. All
mutations must be rejected and are recorded in `n7_tamper_report.json`.

N8 adds a replay fence over the exhaustion and recovery Wasm SHA-256 digests,
a canonical benchmark contract, and the N6 transition chain. The replay suite
swaps each artifact independently, alters the contract, and flips the binding;
it also checks one-bit artifact corruption and binary truncation. All six
substitutions must be rejected in `n8_replay_report.json`.

N9 applies an exact receipt schema and rejects missing or extra fields, wrong
types, reordered axes, duplicate or unsorted globals, fractional counters,
malformed hashes, and attempts to expand the memory contract.

N10 is the complete one-command finish line. It rebuilds all five Wasm modules,
grades the four successful workloads, drives arena exhaustion to the fixed
1 MiB cap, runs every negative gate, and writes a deterministic SHA-256
manifest over every source, binary, receipt, and report:

```sh
node bench/protein_folding/run_full_suite.mjs target/debug/i13
```
