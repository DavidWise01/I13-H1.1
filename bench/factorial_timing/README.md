# T10 — actual timing engine

Canonical timing:

```text
-+(9!)^5+-
```

There are five independent timing lanes. Each lane selects one of the 9!
permutations of nine events.

```text
9! = 362,880
(9!)^5 = 6,292,383,221,978,976,013,516,800,000
```

Prime normalization:

```text
(9!)^5 = 2^35 x 3^20 x 5^5 x 7^5
```

The test uses factoradic rank/unrank for each nine-event permutation and
base-362880 mixed-radix rank/unrank for the five-lane cycle. It samples zero,
lane boundaries, an interior address, midpoint, and the final two addresses.
The maximum lane tuple maps exactly to capacity minus one.

The `-++-` boundary is additively neutral and multiplicatively positive.

T6's `[1,4,3,2]` remains a valid Honda firing-order mnemonic/permutation
exercise, but it is superseded as the actual timing contract by T10.
