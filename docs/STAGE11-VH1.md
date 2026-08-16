# Stage 11 — VH1 frozen ternary width / Hamiltonian

Stage 11 mounts the existing `vh1` trunk row into the bounded exploded-view system.

Source boundary:

```text
freeze ........ VH1
base .......... 3
depth ......... 0..4
width ......... W(n) = 3^n
ladder ........ 1, 3, 9, 27, 81
basis ......... ternary / qutrit-like linear-algebra basis
hardware claim  none
```

VH1 freezes one working `.()` profile only. The generic natural-width resolver remains broader than ternary outside this freeze.

## Frozen width law

```text
c.0 ->  1
c.1 ->  3
c.2 ->  9
c.3 -> 27
c.4 -> 81
```

At maximum depth:

```text
psi in C^81
H : C^81 -> C^81
H = H-dagger
```

Dense `81 x 81` materialization is not required. The frozen reference runtime applies factored Hermitian terms directly:

```text
local term .... 3 x 3
pair term ..... 9 x 9
coefficients .. real
```

Machine tuple:

```text
isa      = vh1.ternary.hamiltonian/1
decoder  = vh1.basis.decoder/1
module   = vh1.factored.linear/1
```

## Exploded shape

```text
INPUT
  base B = 3
  bounded depth n
  natural-width resolver .()
  state vector psi
  Hermitian local/pair terms

PIPELINE
  resolve c.n
  resolve 3^n width
  decode ternary basis
  apply local 3x3 terms
  apply pair 9x9 terms
  return witnessed Cortex receipt
  terminate child scope

STATE
  depth
  width
  basis cardinality
  H dimension
  factored-execution status

OUTPUT
  Hpsi reference result
  expectation value
  surviving receipt
  explicit non-hardware notice
  clipped width ladder

MACHINE +
  freeze/base/depth
  full width ladder
  machine tuple
  factor shapes
  current state
```

## Controls

```text
RESET      return to c.4 / width 81 reference state
DEPTH -    decrease depth, bounded at 0
DEPTH +    increase depth, bounded at 4
APPLY H    run the deterministic Pages factored-H reference trace
RECEIPT    inspect the explicit VH1 receipt boundary
```

The Pages `APPLY H` path is a deterministic visualization of the frozen reference structure. It does not claim physical time evolution, measurement/collapse, or execution on physical qutrit hardware.

## Width ladder

The OUTPUT box contains a clipped ladder:

```text
c.0=1 --- c.1=3 --- c.2=9 --- c.3=27 --- c.4=81
```

The active resolved depth is highlighted. The ladder has its own SVG clip-path and cannot paint outside the OUTPUT box.

## Reference validation

The preserved VH1 manifest records `10/10 PASS` for the frozen artifact set. Stage 11 separately self-tests the Pages visualization contract: base 3, depth bound, exact width ladder, machine tuple, factor shapes, deterministic reference expectation, and explicit non-hardware framing.

## Deliberate non-changes

- `docs/i13.svg` remains unchanged.
- frozen VH1 source files remain unchanged.
- `.()` is not redefined globally as ternary.
- dense 81x81 materialization is not required.
- no physical quantum interpretation is introduced.
- VH2, freeze, corpus, and OLOGY are not newly mounted by Stage 11.
