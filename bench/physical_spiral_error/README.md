# T7 — physical spiral error injection

The complete 4 physical sites x 4 timing phases matrix injects one corrupted
physical identity per run.

Result:

```text
injections       16
detected         16
localized        16
false L0 decode   0
corrected         0
safety            PASS
correction        FAIL_NO_REDUNDANCY
overall           LIMIT_FOUND
```

The T6 spiral is fail-closed: every single-site corruption is detected and
localized, and no corrupted path is emitted as L0. It is not yet an
error-correcting logical encoding. Timing order and physical identity checks
provide detection but no parity, stabilizer, or redundant constraint from
which a missing value can be reconstructed.

This limit is preserved intentionally. A future correction target must define
a redundancy rule before claiming physical error recovery.
