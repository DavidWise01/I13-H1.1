# T6 — physical spiral timing

One logical identity `L0` is decoded from four physical sites.

```text
physical layout:  | P0 | P1 | P2 | P3 =
timing labels:    [  1 .  4 .  3 .  2 ]
chronology:       P0 -> P3 -> P2 -> P1 = L0
```

The timing permutation `[1,4,3,2]` is self-inverse. Applying it once produces
the downward-spiral order; applying it twice restores the original physical
ordering.

Decode is gated until all four sites fire exactly once in the locked order.
The negative suite rejects early decode at t1, t2, and t3, plus duplicate,
missing, and out-of-order schedules. Physical plurality always converges to one
logical output.
