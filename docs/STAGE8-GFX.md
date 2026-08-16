# Stage 8 — GFX trunk v0.3 → v0.4.1

Stage 8 mounts the existing `gfx` trunk row into the bounded exploded-view system and makes the machine-to-space bridge visible.

Historical/reference facts are sourced from the preserved GFX reports:

```text
WASM binary .......................... 10188 bytes
native GFX command-plane tests ....... 8/8 PASS
v0.3 function/recursion regression ... 4/4 PASS
command count ........................ 7
native calls ......................... 8
zero WASM imports .................... PASS
headless GPU renderer probe .......... UNVERIFIED
```

The preserved runtime architecture is:

```text
I-13 source
  -> browser reader/parser
  -> IVM-13 lowering
  -> WASM validator
  -> WASM VM
  -> ordinary IVM Call
  -> native gfx_* builtin
  -> 32-byte GFX record in WASM linear memory
  -> browser renderer
  -> WebGPU primary / WebGL2 fallback
  -> viewport
```

Canonical GFX builtins:

```text
gfx_time()
gfx_clear(r,g,b)
gfx_camera(x,y,z, target_x,target_y,target_z)
gfx_cube(id,x,y,z,size)
gfx_sphere(id,x,y,z,radius)
gfx_color(id,r,g,b)
gfx_rotate(id,rx,ry,rz)
```

## Exploded shape

```text
INPUT
  I-13 scene/entity state
  ordinary IVM Call
  reference time sample t=2.5
  v0.4.1 mouse/controller state

PIPELINE
  gfx_time
  gfx_clear
  gfx_camera
  gfx_cube / gfx_sphere
  gfx_color
  gfx_rotate
  Wasm memory -> renderer -> viewport

STATE
  command cursor
  current 32-byte record
  entity count / selection
  backend order

OUTPUT
  frame state
  entity summary
  receipt
  bounded miniature reference viewport

MACHINE +
  historical test status
  native call / record counts
  record layout
  backend order
  scene/camera state
  v0.4.1 input capability summary
  historical GPU probe status
```

## Controls

```text
RESET      clear the Pages reference scene
STEP CMD   consume one command record
FRAME      rebuild and consume the seven-record reference tape
SELECT     alternate cube/sphere selection in the miniature viewport
REPORT     expose the preserved test-report summary
```

## Reference command tape

The Pages tape has seven command records so the visible trace matches the preserved command count.

The following record values are preserved directly from the v0.4 report:

```text
cube
  op=3 id=1 x=-1 y=0 z=0 size=1.5

sphere
  op=4 id=2 x=1 y=0 z=0 radius=0.800000011920929

rotate
  op=6 id=1 rx=0 ry=2.5 rz=0
```

The clear, camera, and color values in the miniature viewport are **Pages demo values** selected only to make the scene visible. They are not asserted as the historical scene values.

The 32-byte record layout shown by Stage 8 is:

```text
i32 opcode
+i32 entity id
+6 × f32 payload
= 32 bytes
```

## Viewport boundary

The miniature reference frame is inserted inside the existing `OUTPUT` section and gets its own SVG clip-path. It cannot paint outside that output box, preserving the Stage-5 boundary rule.

The seven small bars at the bottom of the miniature viewport are the command tape. `STEP CMD` fills them one at a time; `FRAME` consumes all seven.

## v0.4.1 mouse/controller reference

The preserved v0.4.1 report records:

```text
left-click selection
left-drag ground-plane movement
right-drag orbit
middle / Shift+left pan
wheel zoom
double-click focus
persistent per-entity override layer
selected-object XYZ gizmo
```

It also records `c[subagent()]` as a deterministic local scene observer/controller, not a separate AI model.

Stage 8 does not recreate the full v0.4.1 mouse runtime in the miniature output box. It preserves that capability boundary and exposes selection only as a lightweight Pages reference interaction.

## Deliberate non-changes

- `docs/i13.svg` remains unchanged.
- Stage 8 does not replace the historical GFX renderer.
- The miniature viewport is SVG, not a claim of live WebGPU execution.
- The historical headless GPU probe remains labeled `UNVERIFIED`.
- Reader, Normalizer, Python, JIT, Wasm and OLOGY behavior remain unchanged.
- Cortex child, Pulse, VH1, VH2, freeze and corpus are not newly mounted by Stage 8.
