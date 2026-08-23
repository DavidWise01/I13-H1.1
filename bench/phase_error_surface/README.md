# T9 — phase-error failure surface

This test crosses from the deterministic bit-flip surrogate into a complex
state-vector model.

It encodes:

```text
|+_L> = (|0000> + |1111>) / sqrt(2)
```

A Pauli-Z phase flip is injected at each of four physical sites during each of
four timing phases. The existing repetition checks are the three adjacent
Z-pair stabilizers.

Result:

```text
phase injections             16
norm preserved               16
phase errors detected         0
false logical acceptances    16
outputs orthogonal to target 16
status                       LIMIT_FOUND
```

Every single Z error commutes with the repetition checks and acts as a logical
phase flip inside the code space. The state remains normalized, so norm and
receipt integrity cannot detect the logical corruption.

T8 remains valid only for its stated classical bit-flip scope. Four repeated
computational-basis sites do not protect an arbitrary quantum state against
both bit and phase errors. A new encoding—not a changed witness—is required.
