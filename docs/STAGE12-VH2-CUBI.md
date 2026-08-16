# Stage 12 — VH2 / CUBI [[5,1,3]]

Stage 12 mounts the existing `vh2` trunk row into the bounded exploded-view system.

## Preserved VH2 result

The preserved VH2 hypothesis test models:

```text
ternary controller (3 external control modes)
              ↓
        [[5,1,3]] code
              ↓
       5 physical qubits
              ↓
       1 logical qubit
```

Preserved stabilizers and logical operators:

```text
stabilizers
  XZZXI
  IXZZX
  XIXZZ
  ZXIXZ

logical X = XXXXX
logical Z = ZZZZZ
```

The preserved report records **10/10 PASS**:

```text
code-space dimension .............. rank 2
physical qubits ................... 5
physical Hilbert dimension ........ 32
logical basis orthogonal .......... PASS
logical X mapping ................. PASS
logical Z eigenvalues ............. PASS
single-Pauli syndromes ............ 15/15 unique
nonzero four-bit syndromes ........ 15/15
single-Pauli recovery ............. worst fidelity 1.0
external ternary controller ....... 3/3 modes fidelity 1.0
ternary quantum logical basis ..... REJECTED (rank 2 < 3)
```

Passing interpretation:

```text
3-state controller above one protected [[5,1,3]] logical qubit
```

Rejected interpretation:

```text
3-state quantum logical basis inside the same [[5,1,3]] block
```

Stage 12 preserves that distinction.

## Project topology overlay

H1.1 also has the odd-width project law:

```text
N = 2k + 1
internal = k
external = k + 1
```

For width 5:

```text
5 -> 2 | 3 -> decision width 1
```

Stage 12 shows `2 | 3` beside the five-qubit block, but labels it **project topology overlay**. It is not presented as a stabilizer-code partition, and no fixed physical qubit labels are assigned permanent internal/external authority by the QEC code.

## Added Stage-12 erasure validation

The preserved VH2 report tests arbitrary single-qubit Pauli errors. Stage 12 adds a separate validator at:

```text
scripts/stage12_vh2_erasure_check.py
```

For every two-qubit erased subset `E`, it checks the code-space decoupling condition:

```text
rho_E(|0L>) == rho_E(|1L>)
Tr_complement(|0L><1L|) == 0
```

There are:

```text
C(5,2) = 10
```

possible two-qubit erasure subsets. Passing all ten supports the ideal-code statement that any **two known erasures are correctable** for this encoded logical qubit. This is a simulation/code-property validation, not a hardware experiment and not a claim of an implemented physical decoder.

## Exploded shape

```text
INPUT
  five physical qubits
  four cyclic stabilizers
  logical X / Z
  one physical Pauli error
  external ternary controller mode

PIPELINE
  encode rank-2 logical space
  inject one X/Y/Z error
  measure four stabilizer syndrome bits
  map unique syndrome to correction
  apply matching correction
  verify ideal recovery
  keep ternary controller external to code space

STATE
  [[5,1,3]] code parameters
  current error
  four-bit syndrome
  controller mode

OUTPUT
  recovery result
  explicit receipt
  ternary-rank rejection
  2|3 topology overlay notice
  clipped five-qubit / syndrome visualization

MACHINE +
  stabilizers
  logical operators
  syndrome uniqueness
  recovery status
  external ternary control
  ideal-simulation boundary
```

## Controls

```text
RESET      clear the reference trace
ERROR +    cycle through the 15 single-qubit Pauli errors
SYNDROME   compute the current four-bit stabilizer syndrome
RECOVER    decode the syndrome and apply the matching ideal correction
MODE       cycle external ternary control 0=I, 1=X, 2=Z
```

## Boundary

Stage 12 does **not** claim:

- physical quantum hardware;
- physical error rates or noise performance;
- a qutrit encoded inside the rank-2 `[[5,1,3]]` block;
- that the `2|3` project topology is a stabilizer-code partition;
- that the added erasure criterion is a hardware reconstruction demonstration.

## Deliberate non-changes

- `docs/i13.svg` remains unchanged.
- preserved `reference/vh2/**` files remain unchanged.
- Stage 11 VH1 remains unchanged.
- freeze, corpus, and OLOGY are not newly exploded by Stage 12.
