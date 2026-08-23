# T11 — factorial timing carry and wrap

T10 defines five base-362880 timing lanes. T11 attacks every carry boundary.

```text
depth 1: 362879 -> 362880
depth 2: 131681894399 -> 131681894400
depth 3: 47784725839871999 -> 47784725839872000
depth 4: 17340121312772751359999 -> 17340121312772751360000
depth 5: 6292383221978976013516799999 -> 0
```

Each forward transition is reversed exactly. The fifth carry closes the entire
`(9!)^5` cycle at zero without leaving the valid range.

The boundary sequence `-++-` is executed as modular timing motion over nine
boundary and interior samples. Every sample returns exactly to its starting
address. Rank/unrank remains bijective at all tested carry surfaces.
