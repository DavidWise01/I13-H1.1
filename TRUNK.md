# I13 trunk — beginning to H1.1 current

This file is the development spine, not a replacement for frozen release artifacts.

## I-13 root

I-13 is named for **12 semantic verbs + the concrete declaration keyword `I` = 13**.
`Block` is a container, not one of the twelve.

Canonical semantic words:

```text
I
Name
Constant
Attribute
Assign
Arg
Return
Expr
If
Compare
Call
FunctionDef
BinOp
```

Concrete syntax retained from the frozen brief:

```text
<-   bind
->   return
I    declare
{}   block
//   comment
```

Constants are `f64`. The stack law is:

```text
net = binds - k
```

The VM baseline has exactly 15 opcodes:

```text
Const Ask Attr Ret Answer Drop Bin Cmp If Call Block Else End Func Halt
```

There is no `br` opcode. Control flow uses `Block / If / Else / End` depth targets.

## Toolchain trunk

```text
CODE -> READ -> NORMALIZE/AST -> I-13 IR -> VALIDATE -> TRANSLATE -> WRITE
```

Milestones carried forward from H1.0 work:

- reader v0.1 — 8/8 PASS
- IVM-13 sidecar v0.1 — 9/9 PASS
- normalizer v0.2 — 12/12 PASS, provenance complete
- Python ingress adapter v0.1 — 10/10 PASS
- Python -> I13 -> Python roundtrip — 12/12 PASS
- JIT shell v0.2 — 7/7 PASS
- browser-native Wasm v0.1 — combined native tests 14/14 PASS
- Wasm validator + numeric VM v0.2 — 9/9 PASS
- graphical suite v0.3 — native Func/Call/Ret + recursion; 16/16 functional tests
- GFX v0.4 — WebGPU primary, WebGL2 fallback; command buffer emitted from Wasm
- GFX v0.4.1 — mouse manipulation + Cortex child observer/controller

## Cortex child

Canonical bounded ephemeral child form:

```text
[c[
    (
        ...
    )
]]
```

Lifecycle:

```text
0 -> SPAWN -> RUN -> RETURN -> WITNESS -> TERMINATE -> 0
```

Private child state does not survive termination; explicit result/receipt may.

## Context width

Current width notation:

```text
[c[
    (...),
    {
        c.n,
        fractal,
        x(.())
    }
    <- (c.n)
    n = depth
]]
```

`n` is depth. `c.n` is resolved Cortex context. `.()` resolves the natural local fractal width from context.

Frozen ternary VH1 profile:

```text
base = 3
depth = 0..4
.() = 3^n
width = 1, 3, 9, 27, 81
```

## H1.0 freeze carried into H1.1

H1.0 froze:

- bounded `[c[(...)]]` Cortex children
- `c.n` depth context
- `.()` context-derived fractal width
- VH1 ternary 1/3/9/27/81 profile
- numerical `[[5,1,3]]` five-qubit reference model
- canonical control split `5 -> (2|3) -> 1`
- odd-width law `N=2k+1`, internal `k`, external `k+1`
- GPU suite v0.4.1

H1.1 does not mutate H1.0.

## H1.1 corpus

The H1.1 corpus begins with technical material across:

- ternary / mixed radix
- linear algebra / vector / tensor
- Hamiltonians / integrable systems
- fractals / chaos
- Ada Lovelace / Babbage
- DOS-era software
- vector / voxel / vogel / VS annotations
- Sonia / Sonya / Sofya Kovalevskaya technical branch

The current seed corpus is under `corpus/`.

## H1.1 OLOGY — current

OLOGY is currently a **2D discrete navigation surface**.

User axis convention:

```text
+x = up
-x = down
+y = right
-y = left
```

A point is a position vector:

```text
ln = <x,y>
```

For the IPv4-sized overlay, H1.1 currently uses the same 32 bits as a two-dimensional surface coordinate:

```text
u32 = x:16 | y:16
```

This is an overlay interpretation, not a claim that IPv4 itself defines Cartesian coordinates.

### Vector -> voxel

Each OLOGY surface vector roots a local voxel:

```text
<x,y>
  |
  v
voxel(x,y)
  |
  +-- local depth / burrow
```

The 32 bits select the surface root. Local voxel depth is nested state and does **not** consume those 32 bits.

Conceptual total location:

```text
<x,y ; z>
```

where `z` is local voxel depth rather than a third global OLOGY navigation axis.

### Queen movement

The spatial Cortex / Queen has two distinct motions:

```text
MOVE    : <x,y;z> -> <x+dx,y+dy;z>
BURROW  : <x,y;z> -> <x,y;z+dz>
```

Direction selection and authority remain separate operations.

## Cortex -> voxel -> Cortex Verifier

Current literal form:

```text
[c[v[
    (),
    {},
    ()
]]cv]
```

Directional semantics:

```text
c[v[       Cortex enters voxel
()         state in
{}         local voxel/context
()         state out
]]          close/leave voxel
cv          Cortex Verifier before exit
```

Current invariant:

```text
CORTEX -> VOXEL -> TRANSFORM -> CLOSE -> CV -> CONDITIONAL EXIT
```

`v` on ingress means **voxel**. `cv` on egress means **Cortex Verifier**.

This is the current H1.1 trunk boundary.
