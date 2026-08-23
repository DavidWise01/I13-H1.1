# T3 — simultaneous collision arbitration

Two labeled tokens submit clockwise/counterclockwise intents against the same
immutable five-node ring snapshot. Arbitration occurs before witnessing.

Rules:

1. Two intents sharing one destination reject atomically.
2. A head-on exchange rejects atomically.
3. Entry into a node occupied in the immutable snapshot rejects atomically.
4. Otherwise both moves commit together.
5. The witness hashes the decision; it never chooses a winner.

The first oracle assumed an equal 10/10/10/10 result split and failed.
Exhaustive enumeration established the locked topology:

```text
ACCEPT                         20
REJECT_SHARED_DESTINATION       5
REJECT_HEAD_ON_SWAP             5
REJECT_OCCUPIED_SNAPSHOT       10
TOTAL                           40
```

All 15 seam-involving batches are included. Rejected batches must leave the
snapshot untouched. The test also rejects forged receipts, altered verdicts,
tampered after-states, and attempts by the witness to inject a partial winner.
