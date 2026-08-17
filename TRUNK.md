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

H1.0 froze bounded Cortex children, context width, VH1/VH2 reference laws, the odd-width control split, and the historical GPU suite. H1.1 does not mutate H1.0.

## H1.1 corpus

The H1.1 corpus begins with technical material across ternary/mixed radix, linear algebra, Hamiltonians, fractals/chaos, computing history, vector/voxel/vogel/VS annotations, and the Sonia/Sonya/Sofya Kovalevskaya technical branch. The current seed corpus is under `corpus/`.

## H1.1 OLOGY — current

OLOGY is currently a **2D discrete navigation surface**.

```text
+x = up
-x = down
+y = right
-y = left
ln = <x,y>
u32 = x:16 | y:16
```

Each OLOGY surface vector roots a local voxel. The 32 bits select the surface root; local voxel depth is nested state and does **not** consume those bits.

```text
MOVE    : <x,y;z> -> <x+dx,y+dy;z>
BURROW  : <x,y;z> -> <x,y;z+dz>
```

## Cortex -> voxel -> Cortex Verifier

```text
[c[v[
    (),
    {},
    ()
]]cv]
```

```text
CORTEX -> VOXEL -> TRANSFORM -> CLOSE -> CV -> CONDITIONAL EXIT
```

`v` on ingress means **voxel**. `cv` on egress means **Cortex Verifier**.

## E1 external primer factory — current attachment

E1 is not upstream of I13. It is an external secondary factory called by Cortex when a bounded subagent needs more external capability.

```text
I13
  -> Cortex
     -> subagent
        -> enough: continue
        -> needs prime
             -> [ y | x ]
             -> E1(primer(factory(module)))
             -> [E1ID]cv
             -> Cortex
  -> continue I13
```

Hard partition:

```text
[ y | x ]
y = internal-only
x = external-only
private(y) ∩ private(x) = ∅
```

Each side owns its own full gearbox:

```text
y: n -> 2n -> 4n -> 8n
x: n -> 2n -> 4n -> 8n
```

No live state crosses. Only bounded witnessed capsules cross. The core verifies the boundary; factory state remains external.

Locked modules:

```text
E1.RD-001       Reverse Distillation
E1.CORPUS-001   Corpus Orientation
```

Reverse distillation law:

```text
A(B(C(D))) ||| D -> A(B(C))
ABCD - D = ABC
```

Corpus orientation uses the Enheduanna first-author object as `(middle|middle)` and four user-defined external calibration anchors around it. The names/tags are calibration metadata only and are not admitted into the Stage 14 corpus.

Continuity core:

```text
[ a+ [[ () ]] c- ] || [ c+ [[ () ]] a- ]
```

Canonical E1 specification: `docs/E1-FACTORY.md`.

## Stage 15.3 — live E1 crossing

The workbench now executes the attachment as a bounded closed loop:

```text
internal/y Cortex request
    -> Wasm `i13_e1_boundary_verify`
    -> postMessage
    -> external/x `e1-service.html`
         sandbox="allow-scripts"
         opaque origin
    -> bounded prime + parent receipt
    -> Wasm return boundary verify
    -> Wasm closed-loop verify
    -> [E1ID]cv
    -> `i13:e1-prime`
    -> Cortex continues
```

The E1 service has no same-origin capability, no fetch path, and no browser-storage path. It cannot read internal DOM/runtime state. The internal page does not read E1 DOM state. `postMessage` is the only live bridge.

The full request/return SHA256 values remain in E1ID while compact nonzero `u32` folds feed the current Wasm ABI. No prime is released if the boundary, witness, parent, or contamination checks fail.

Canonical Stage 15.3 specification: `docs/STAGE15.3-E1-HANDOFF.md`.

This live `[ y | x ]` handoff is the current H1.1 trunk boundary.
