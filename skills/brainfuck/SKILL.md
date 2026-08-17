---
name: brainfuck
description: "Use when the user references 'Brainfuck', 'BF' (the esolang), Urban Müller, esoteric programming languages, Turing tarpits, or the 8-command minimal language. Built from REAL fetched corpus (Wikipedia) because archive.org was 503 this session. VERIFIED esolang — the mesh's first ESOTERIC-LANGUAGE node (fun contrast to practical PLs: Python/C++/R)."
category: esoteric-language
---

# Brainfuck — The Esoteric Language

**Source (fetched, NOT archive.org — IA was 503 this session):**
- **Wikipedia:** `https://en.wikipedia.org/wiki/Brainfuck` → 236,697 B real article.
  Fetched via Python `urllib` (curl returns 0-byte chunked bodies on this MSYS host).
- `curl` 0-byte on chunked Wikimedia HTML on MSYS — use Python `urllib` as fallback
  (same workaround as the Ars Moriendi flay).

## What it is
**Brainfuck** — an esoteric programming language by **Urban Müller (1993)**, a
minimal **Turing tarpit**: 8 single-character commands (`> < + - . , [ ]`) over a
30,000-cell 8-bit tape. Turing-complete but impractical by design. Epistemic
status: VERIFIED (canonical, well-documented language; Wikipedia article fetched).

## DISTILL — real structure (from fetched article)
- **8 commands:** `>` inc pointer · `<` dec pointer · `+` inc cell (wrap 255→0) ·
  `-` dec cell (wrap 0→255) · `.` output ASCII · `,` input · `[` jump past `]` if
  cell 0 · `]` jump back to `[` if cell nonzero.
- **Turing tarpit:** can express any computable function, but with almost no
  abstraction. Popular as a "write an interpreter" exercise.
- **Examples in article:** Hello World! (106 active chars), ROT13, add-two-values.

## SYNTHESIZE — mesh placement
- **Layer:** `esoteric-language` — a **new branch** (the user's "this one lol"
  pivot to something playful/obscure). Distinct from `pl-foundations` (C++,
  a *practical* language) and `cs-foundations` (DSA). This is the *esolang*
  contrast — minimalism as a concept.
- **Affinity:** pairs with `fundamentals-cpp` (PL Foundations) as the
  *language-design spectrum* — C++ (maximal abstraction) vs Brainfuck (minimal).
  Also a cousin to `sbtcvm` (computational primitives / weird VMs).
- **Non-affinity:** NOT a language you'd ship in — cite as the esolang/teaching
  curiosity, not a tool.

## Tooling — `scripts/brainfuck_explorer.html`
A **self-contained, RUNNABLE** BF interpreter + 8-command reference. The embedded
interpreter is faithful (wrapping 8-bit cells, 30k tape, bracket-matching, 5M-step
guard). Ships with Hello World / ROT13 / add presets. Opens via `file://`.
(flay rule #5 — runnable artifact; plain HTML/JS, honestly labeled.)

## Pitfalls (carried)
- **archive.org was DOWN (503) this session** — sourced from Wikipedia via Python
  `urllib`. If IA recovers, a BF-spec PDF could be added as a supplement.
- No `rm -rf` / `rm -r` (i13n-flagged) — promote via `mkdir -p` + `cp -r`.
- No force-push; ff-only merges.
- `curl` 0-byte on chunked Wikimedia HTML on MSYS — use Python `urllib`.
