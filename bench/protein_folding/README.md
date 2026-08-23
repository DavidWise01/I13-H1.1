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

N10 is the complete one-command finish line. It rebuilds every Wasm module,
grades every successful workload, drives arena exhaustion to the fixed
1 MiB cap, runs every negative gate, and writes a deterministic SHA-256
manifest over every source, binary, receipt, and report:

```sh
node bench/protein_folding/run_full_suite.mjs target/debug/i13
```

## N11 — CFTR-1480 multidomain compression

`n11_cftr_1480.i13` maps the complete 1,480-residue CFTR chain into five
deterministic regions: TMD1 (380), NBD1 (270), regulatory (180), TMD2 (340),
and NBD2 (310). Twelve membrane helices occupy 252 positions. Native and
ΔF508 paths traverse the same domain map; removal of residue 508 changes the
hydrophobic count by one and the locked fold signature by 13.

The 3/2/1 compression is executable: region, helix, and hydrophobic inputs
produce closed/open witnesses `152443` and `152483`, then compress to one
`RECOGNITION=1`. Reference VM and Wasm must agree on all 18 locked globals.

## N12 — permutation invariance and mutation locality

`n12_cftr_permutation.i13` evaluates all six orderings `123, 132, 213, 231,
312, 321` of domain, helix, and hydrophobic inputs. Elementary symmetric terms
make the compression independent of presentation order: all native paths lock
to `1064117`, and all ΔF508 paths lock to `1062599`.

The mutation-locality gate requires the difference `1518` while domain and
helix topology remain unchanged. Six native witnesses and six mutant witnesses
must each converge to one recognition; any permutation or exterior topology
drift returns `VERDICT=0`.
