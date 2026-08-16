I-13 SUITE v0.3 — BROWSER-NATIVE WASM RUNTIME

The suite is a graphical browser control plane around the native I-13 WASM VM.

Suite views
-----------
01 Workbench
   I-13 editor, five-stage live pipeline, native runtime pulse.

02 Execution Map
   SVG region graph showing main/function validator regions and call edges.

03 Call Frames
   Frame tower plus native ENTER/CALL/RET/HALT trace timeline.

04 Memory
   Tagged global values/function references and WASM linear-memory allocation.

05 Cortex
   Six-rule graphical field: VETO, DEPTH, CAPABILITY, ROUNDTRIP, ADDRESS,
   IDEMPOTENCE.

06 Test Lab
   Eight browser-suite programs covering arithmetic, osmotic assignment,
   branches, functions, nested calls, recursion, aliases, and locals.

Native in WebAssembly v0.3
--------------------------
- Cortex gates
- independent main/function validation regions
- Func / Call / Ret
- tagged NUMBER / FUNCTION values
- parameter binding
- local function environments + global fallback
- nested calls
- recursion
- function aliases
- runtime arity checking
- call-depth and step governors
- call-frame trace
- Const / Ask / Attr / Answer / Drop
- Bin / Cmp
- If / Else / End / Block / Halt

Still JavaScript
----------------
- I-13 lexer/parser
- AST -> fixed IVM instruction lowering
- graphical suite and orchestration

Run
---
python i13-suite-v0.3.pyz --open

or open:
i13-suite-v0.3.html

Deliberate v0.3 boundary
------------------------
Nested FunctionDef / lexical closures are not lowered yet.
Call arity intentionally remains a runtime check rather than a validator check,
matching the documented canonical validator boundary.
