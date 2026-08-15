# H1.1 architecture

## 1. Language to host

```text
CODE
 -> READ
 -> NORMALIZE / AST
 -> I-13 IR
 -> VALIDATE
 -> TRANSLATE
 -> WRITE / EXECUTE

                    host boundary
                         |
I-13 / Cortex -> Rust -> Wasm -> JS/TS -> WebGPU / network / files / UI
```

Wasm owns bounded deterministic computation. Browser/OS capabilities stay host-side and must be explicitly adapted.

## 2. OLOGY base

Only two global navigation dimensions are currently defined:

```text
+x = up
-x = down
+y = right
-y = left

ln = <x,y>
address32 = [x:16 | y:16]
```

The packing is a reversible coordinate view over all 32 bits.

## 3. Vector-rooted voxel field

Every OLOGY point may open inward:

```text
<x,y>
  |
  +--> voxel(x,y)
         z0
         z1
         z2
         ...
```

The conceptual total location can be written `<x,y ; z>`, but `z` is local nested depth, not a third OLOGY surface axis.

```text
MOVE   : <x,y;z> -> <x+dx,y+dy;z>
BURROW : <x,y;z> -> <x,y;z+dz>
```

This is equivalent in spirit to attaching a local fiber/volume to each point of a 2D base, without requiring the implementation to use differential-geometric machinery.

## 4. Cortex / voxel / verifier

```text
[c[v[
    (),
    {},
    ()
]]cv]
```

Directional parse:

```text
c[v[  Cortex enters voxel
()    state in
{}    local voxel/context
()    state out
]]    close voxel
cv    Cortex Verifier before exit
```

Current CV invariants:

1. outbound transition has authority;
2. work inside a voxel cannot silently change the surface root;
3. emerged local depth is within the declared bound;
4. verifier returns a verdict/receipt; it does not become the voxel.

A Queen/surface move is a separate transition after local work. Direction selection and authority are distinct.

## 5. Width and odd quorum

Generic width:

```text
uniform: W(n) = B^n
mixed:   W(n) = product(B_i)
```

Frozen VH1 working profile:

```text
B=3
n=0..4
W=1,3,9,27,81
```

Odd control law:

```text
N = 2k + 1
internal = k
external = k + 1
```

Examples: `3 -> 1|2`, `5 -> 2|3`, `7 -> 3|4`, `9 -> 4|5`, `81 -> 40|41`.

## 6. Historical runtime boundary

The older v0.4 Wasm VM used iterative native frames, a 15-opcode I-13 VM, a deterministic Cortex rule mask, and a 32-byte graphics command record. It is retained under `reference/legacy/` as proof/history. It is not automatically the semantic definition of H1.1.
