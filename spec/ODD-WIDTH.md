# Odd-width control law

For quorum/control widths:

```text
N = 2k + 1
internal = k
external = k + 1
decision = 1
```

Examples:

```text
3  -> 1 | 2
5  -> 2 | 3
7  -> 3 | 4
9  -> 4 | 5
11 -> 5 | 6
81 -> 40 | 41
```

Properties:

- ties are impossible for valid odd widths;
- the external side is exactly one wider;
- `5 -> 2|3` is the canonical small nontrivial block currently used in the CUBI/Cortex model;
- this is project topology, not a claim about hidden architecture in external AI systems.
