# H1.1 OLOGY

Status: live H1.1 design; not part of the H1.0 freeze.

## Base geometry

OLOGY has two global navigation dimensions:

```text
+x up
-x down
+y right
-y left
```

A surface location is:

```text
ln = <x,y>
```

The current 32-bit canonical test packing is:

```text
[ x:16 | y:16 ]
```

This yields `2^32` surface roots without spending any address bits on nested depth.

## Vector-rooted voxel

Every surface vector may root a local voxel:

```text
V_ln = voxel rooted at ln
```

A conceptual location inside that voxel is:

```text
<x,y ; z>
```

`z` is local burrow depth. It is not a third OLOGY surface axis and is not packed into the 32-bit OLOGY address.

## Motion

```text
surface move: <x,y;z> -> <x+dx,y+dy;z>
burrow move : <x,y;z> -> <x,y;z+dz>
```

A surface move changes the vector/voxel root. A burrow keeps the root fixed.

## Spatial Cortex / Queen

The Queen is the mobile Cortex role:

```text
context -> choose 2D displacement -> verify authority -> enable -> move
```

Choosing a direction does not itself grant authority.
