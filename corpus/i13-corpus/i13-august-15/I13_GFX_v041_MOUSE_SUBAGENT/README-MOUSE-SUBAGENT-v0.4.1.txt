I-13.GFX SUITE v0.4.1 — MOUSE MANIPULATION + c[subagent()]

New viewport controls
---------------------
Left click
  Select nearest scene object.

Left drag selected object
  Move it across the ground plane, camera-relative.

Right drag
  Orbit the camera around its target.

Middle drag OR Shift + left drag
  Pan the camera.

Mouse wheel
  Zoom.

Double click object
  Select and focus camera target.

Selection visualization
-----------------------
Selected objects receive a highlighted shell plus conventional XYZ axis bars.

Persistent edit layer
---------------------
The I-13 program still emits the base scene every frame. Mouse changes are kept
in a separate scene.overrides map and applied AFTER each command-buffer rebuild.
That lets program animation continue while user position edits remain stable.

c[subagent()]
-------------
A deterministic local scene subagent/controller is embedded in the GPU pane.
It is NOT an external AI model. It observes:
  selection
  gesture/mouse mode
  camera override state
  object override count
  last manipulation

It can:
  focus selected object
  snap selected X/Z position to 0.25 units
  clear selected object's mouse override
  restore the I-13 program camera

Architecture
------------
I-13 -> IVM -> WASM -> GFX command buffer -> GPU renderer
                              |
                              +-> edit override layer
                              +-> c[subagent()] observer/controller

Run
---
python i13-gfx-suite-v0.4.1.pyz --open
