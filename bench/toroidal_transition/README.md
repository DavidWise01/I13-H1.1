# Toroidal transition witness — T2

This behavioral test advances the frozen 55,296-state witness profile.

A single occupied token moves clockwise or counterclockwise between adjacent
nodes on a five-node ring. The edges `4 -> 0` and `0 -> 4` cross the
embedded `|||` seam. Every move conserves occupancy and produces a read-only
SHA-256 witness over the exact before state, operation, and after state.

Expected result:

```text
legal directed moves       10
embedded seam crossings     2
unique witness receipts    10
witness mutation failures   0
negative gates              8/8 PASS
```

Run:

```sh
node bench/toroidal_transition/run_transition_test.mjs
```

The test proves local ring adjacency, seam continuity, occupancy conservation,
receipt uniqueness for the legal transition set, and rejection of malformed or
tampered transitions. It does not yet prove multi-token collision scheduling.
