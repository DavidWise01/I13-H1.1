I-13.GFX SUITE v0.4

This version turns the I-13 suite into a visible runtime.

LIVE PIPELINE
  I-13 source
    -> browser reader/parser
    -> IVM-13 lowering
    -> WASM validator
    -> WASM VM
    -> native gfx_* builtin calls
    -> 32-byte GFX command records in WASM linear memory
    -> browser GPU renderer
    -> viewport

GPU BACKENDS
  1. WebGPU, when available
  2. WebGL2 fallback

The program does not call WebGPU/WebGL directly. It calls:
  gfx_time()
  gfx_clear(r,g,b)
  gfx_camera(x,y,z, target_x,target_y,target_z)
  gfx_cube(id,x,y,z,size)
  gfx_sphere(id,x,y,z,radius)
  gfx_color(id,r,g,b)
  gfx_rotate(id,rx,ry,rz)

These are prebound native function values. They still use the ordinary IVM Call
opcode. WASM dispatches them and writes a compact command buffer.

WHY CLOSURES ARE STILL DEFERRED
  v0.3 function values are <function-id>.
  A lexical closure must become <function-id + captured-environment>.
  That requires lifetime-managed environments/upvalues so an outer frame's
  locals can survive after the frame returns.

  Graphics does not require that representation change. It gives the runtime
  immediate utility while leaving closure semantics isolated for the next
  language-completeness step.

RUN
  python i13-gfx-suite-v0.4.pyz --open

For WebGPU, localhost is the recommended path. WebGL2 is the fallback.
