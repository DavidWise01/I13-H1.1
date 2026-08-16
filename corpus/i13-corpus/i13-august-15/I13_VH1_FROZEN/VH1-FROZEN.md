# VH1 — FROZEN

Status: **FROZEN**  
Freeze ID: `VH1`  
Scope: Cortex ephemeral child + depth-resolved fractal width + ternary Hamiltonian profile.

## 1. Canonical Cortex child form

```text
[c[
    ( ... ),

    ( isa , decoder , module ),

    { c.n , fractal , x( .() ) }
        <- (c.n)

    n = depth
]]
```

## 2. Lifecycle law

`[c[(...)]]` is an on-the-fly Cortex child. It is bounded and terminated upon completion.

```text
0 → RESOLVE → BIND → SPAWN → DECODE → EXECUTE → RETURN → WITNESS → TERMINATE → 0
```

Frozen invariants:

- child authority is inherited and bounded by Cortex;
- child private state is ephemeral;
- only explicit result/receipt/provenance may survive `]]`;
- commit/veto authority remains with Cortex;
- `(isa, decoder, module)` is snapshot-bound from resolved `(c.n)` for the child lifetime.

## 3. Depth and width

`n` is **depth**.

`.()` is the **natural fractal-width resolver**. It is not intrinsically binary, decimal, ternary, or base-60.

General uniform-radix law:

```text
W(n) = B^n
```

General mixed-radix law:

```text
W(n) = Π B_i
```

VH1 freezes one working profile:

```text
B = 3
0 ≤ n ≤ 4
W(n) = 3^n
```

Therefore:

```text
c.0 →  1
c.1 →  3
c.2 →  9
c.3 → 27
c.4 → 81
```

Within VH1, `x(.())` resolves to exactly the width above.

## 4. Ternary basis

Depth `n` is represented as `n` ternary digits/qutrit-like coordinates:

```text
|d_0 d_1 ... d_(n-1)>,  d_i ∈ {0,1,2}
```

The basis cardinality is `3^n`.

The term *qutrit-like* here describes the three-state linear-algebra basis. VH1 does not claim a physical quantum device or physical quantum behavior.

## 5. Hamiltonian

At resolved width `W`, VH1 permits a Hermitian linear operator

```text
H : C^W → C^W
H = H†
```

At maximum VH1 depth:

```text
n = 4
W = 81
H : C^81 → C^81
```

A dense Hamiltonian would have shape `81 × 81`, but **dense materialization is not required**.

VH1 reference execution prefers factored terms:

- local one-site Hermitian terms: `3 × 3`;
- two-site Hermitian coupling terms: `9 × 9`;
- real coefficients for Hermitian term preservation.

The reference module applies these terms directly to the state vector and does not construct the full `81 × 81` matrix.

## 6. Frozen machine tuple

```text
isa      = operations admitted at c.n
decoder  = mapping from bounded process/basis references into those operations
module   = implementation that applies the operations
```

For the VH1 reference runtime:

```text
isa      = vh1.ternary.hamiltonian/1
decoder  = vh1.basis.decoder/1
module   = vh1.factored.linear/1
```

## 7. Receipt

A completed ephemeral child returns a Cortex-owned receipt with at least:

```text
receipt[
    freeze = VH1,
    base = 3,
    depth = n,
    width = 3^n,
    machine = (isa, decoder, module),
    result,
    witness,
    terminated = true
]
```

No child-private mutable state survives termination.

## 8. Freeze boundary

VH1 deliberately does **not** freeze:

- a physical quantum interpretation;
- time-evolution integrator semantics;
- measurement/collapse semantics;
- a dense-matrix requirement;
- a meaning for `.()` outside the resolved Cortex/fractal context;
- bases other than 3 for the VH1 working profile (the generic `.()` law remains broader).

Changes to the frozen items above require a new freeze ID (`VH2`, etc.).
