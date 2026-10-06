# CORTEX TOROID-5 Commit Timing

Append-only extension to the Cortex verifier/child lifecycle.

Literal cell:

    {{ . | | | | . }}

Exact integer phases:

    0/5 -> 1/5 -> 2/5 -> 3/5 -> 4/5 -> 5/5

Rules:

- no commit on phases 1/5 through 4/5;
- commit witness only at 5/5;
- wrap is legal only after 5/5;
- 5/5 identifies with the next-cycle 0/5;
- Mother-Nature balance gate is `-1 + 0 + 1 = 0`;
- timing does not override Cortex authority, root, depth, witness, or provenance checks.

Implementation: `src/cortex.rs::Toroid5Clock`.

Stress target encoded in unit tests: 10,000 cycles = 50,000 exact transfers, zero phase drift because phase is stored as integer numerator over denominator 5.
