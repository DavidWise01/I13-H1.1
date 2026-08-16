# I13 H1.1 color system

Step 1 of the Pages refinement sequence.

The color layer is deliberately separate from `i13.svg`: `docs/index.html` injects the palette into the same-origin SVG after it loads. This keeps the live SVG/runtime untouched while the visual language is evaluated.

## Semantic planes

| plane | role | tone |
|---|---|---|
| I / root | seed / declaration | slate |
| DESIGNATE | naming / designation | cyan |
| BIND | assignment / binding | emerald |
| DECIDE | expression / comparison / branch | violet |
| TRANSFORM | call / function / operation | amber |

## Engine families

| engine | tone |
|---|---|
| I13 / reader / normalizer | cyan-slate |
| Python / JIT | gold |
| Wasm | electric blue |
| GPU / GFX | magenta |
| Cortex | rose |
| linear algebra / VH1 | teal |
| QEC / VH2 | violet |
| frozen H1.0 | stone |
| corpus | turquoise |
| current OLOGY / voxel / CV | green + blue + rose |

## Runtime states

```text
idle / neutral = slate
running        = amber
pass / live    = green
veto / fail    = red
frozen         = desaturated stone
```

## Rule

Color communicates function or state; it is not decorative noise. Step 1 changes only presentation. Geometry, runtime behavior, module data, OLOGY, voxel motion, Wasm, Python and CV semantics remain unchanged.
