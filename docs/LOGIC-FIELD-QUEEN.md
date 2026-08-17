# I13 Logic Field · Queen Rider

Status: **LOGIC DESIGN PRIMITIVE · NON-RIVER UNTIL 05_LOGIC IS FROZEN**

The Queen is folded into Logic as a traversal primitive, not as another epistemic layer and not as a separate corpus reach.

```text
Vector[
  logic[
    voxel_field[
      voxel,
      vector,
      choice(
        voxel(in,out),
        vector(in,out)
      )
    ]
  ]
]
```

The local choice field is a two-axis binary relation:

```text
             VECTOR
             IN    OUT
VOXEL IN     II    IO
VOXEL OUT    OI    OO
```

One local field therefore has `2^2 = 4` states. Recursively nested fields are written documentarily as:

```text
[(/ 2 ^ 2 \)]^n
```

This is architecture notation, not new I13 syntax.

## Q = Queen

`Q` means **Queen**, not query.

The Queen is the rider that can traverse the locally generated field while carrying the compact recursion law rather than a fully expanded `4^n` space.

```text
Q[
  voxel,
  vector,
  backpack = [(/2^2\)]^n
]
```

The backpack carries the local field-generation rule plus enough state/provenance to continue, return, or re-evaluate a path. The Queen does not own the terrain; she traverses the terrain exposed by Logic.

## Dimensional rider notation

Project notation:

```text
queen[
  1D : line,

  2D :
    (2 axes x 2 directions) / 4
    = 1.00 local directional coverage,

  3D :
    1.00 x 360,

  4D :
    1.00 x 360 x .0001
    ~> { t + .0001 }
]
```

`360` is treated here as a sweep/orientation parameter, not as another Boolean choice count. `.0001` is a phase increment. These are project geometry conventions, not claims about physical dimensionality.

## Logic boundary

The Queen rider belongs **inside** Logic:

```text
PLATO KEYSTONE
    |
    v
04 ANALYSIS
    |
    v
05 LOGIC
    |
    +-- voxel field
    |     +-- voxel(in,out)
    |     +-- vector(in,out)
    |     +-- choice = {II,IO,OI,OO}
    |
    +-- Q / QUEEN
          +-- traverse local field
          +-- carry [(/2^2\)]^n backpack
          +-- sweep orientation
          +-- advance phase
```

Logic must still consume admitted Analysis evidence; the Queen changes how the logic field is traversed, not the status of upstream evidence.

## Distilled invariant

```text
GLOBAL POSSIBILITY = 4^n
LOCAL CHOICE        = 4
RIDER STATE         = path + local field + orientation + phase
```

The field may grow recursively while each local choice remains bounded.

Executable companion:

```text
corpus/golden/logic_queen_rider.i13
```
