# I13 GitHub Pages surface

Production source for the single Icarium/I13 public page.

```text
docs/
├── index.html
├── .nojekyll
└── assets/
    ├── style.css
    ├── app.js
    ├── forge-reference.webp
    └── runtime-reference.webp
```

The visible page intentionally contains only the canonical 13 I-13 words.

`app.js` supplies the live 2D OLOGY layer beneath them:

- 32-bit surface is modeled visually as a 2D vector field.
- each vector root has local voxel-depth cues.
- the Queen walks across surface roots.
- a deterministic Cortex Verifier gate can pass/veto candidate movement.
- local burrow depth changes without consuming the surface x/y address.
- pointer input can retarget the Queen; arrow keys propose cardinal moves.
- reduced-motion clients receive a static rendered frame.

The WebP files are compact visual fallbacks/reference assets derived from the Icarium forge dashboard concepts.

Production/live surface is published from `main:/docs`.
