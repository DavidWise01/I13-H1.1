# T8 — four physical sites encode one logical unit

A minimal repetition constraint stores the same logical bit at P0-P3 and
retains timing `[1,4,3,2]`.

A 3-of-4 majority corrects and localizes any one physical bit flip. A 2-of-4
tie is rejected rather than guessed.

Coverage:

```text
2 logical values x 4 injection phases x 4 physical sites = 32 single flips
2 logical values x C(4,2) = 12 double flips
```

All 32 single flips correct to the intended single logical output. All 12
double flips produce ties and reject. The witness records the syndrome and
decision but contributes no authority.

The initial harness run failed because numeric zero was used directly as a
Boolean gate for witness authority. The corrected gate explicitly tests
`witnessAuthorityDecisions === 0`; this harness failure remains in the receipt.

## Scope limit

This is a deterministic classical bit-flip repetition model. It does not model
complex amplitudes, phase-flip errors, decoherence, quantum measurement, or
physical entanglement. Those require a separate state-vector/stabilizer target.
