# T4 — ten-dimensional nested address

Canonical input:

```text
-+[ universe{9x9}^9 .
    [ galaxy{3x3}^3 .
      [ planet{2x2}^2 .
        [ local{1x1}^2 .
          [ self{i x 1}^2 ]
        ]
      ]
    ]
]+-
```

The complete nested address is copied across ten independent dimensions.

Capacity and phase are kept separate. `self{(i x 1)^2}` has magnitude one
and phase -1 per dimension. Ten dimensions close that phase to +1. The
`-++-` shell is balanced: additive boundary sum 0, multiplicative boundary
product +1.

Normalization:

```text
universe = 81^9 = 3^36
galaxy   = 9^3  = 3^6
planet   = 4^2  = 2^4
local    = 1
self magnitude = 1

one dimension = 2^4 x 3^42
ten dimensions = 2^40 x 3^420
```

The test uses exact BigInt symbolic exponentiation. It verifies the 213-digit
capacity without attempting to enumerate the address space.
