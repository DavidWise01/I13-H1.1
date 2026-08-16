---
name: programming-8086
description: "Use when the user references 'Programming the 8086/8088', James W. Coffron, x86 assembly, 8086/8088 microprocessor, Intel 8086/8088 registers/flags/instruction-set, or IBM PC assembly. Built from the REAL archive.org OCR (item Programming_the_8086_8088). VERIFIED x86 assembly textbook — computing-history node, paired with embedded-8051 (different ISA: x86 vs 8051 MCU)."
category: computing-history
---

# Programming the 8086/8088 — Coffron

**Source:** archive.org item **`Programming_the_8086_8088`** → *Programming the
8086/8088* by **James W. Coffron** (SYBEX, 1983). Collections:
`programming_books`, `folkscanomy_computer`, `folkscanomy` — public, fetchable.
Download filenames are `Programming_the_8086_8088.*` (URL-encode the path).

## What it is
A **VERIFIED x86 assembly** textbook (1983) — the classic Intel 8086/8088
programming reference. Epistemic status: VERIFIED (published textbook). Mesh
node: **computing-history** (hist. of computing), paired with `embedded-8051`
— same *theme* (microprocessor programming) but **different ISA**: x86
(Coffron) vs 8051 MCU (embedded-8051). Keep them as sibling contrast nodes.

## DISTILL — real structure (from OCR CHAPTER BREAKDOWN, 9 chapters)
1. Basic Concepts (binary/BCD, flags, microprocessor review) · 2. Internal
Structure & General Registers · 3. Memory Organization & Addressing Modes
(8086 vs 8088) · 4. The Instruction Set (complete listing) · 5. Basic
Programming Techniques · 6. Interrupts (interrupt table, internal/external) ·
7. Input/Output Techniques (I/O addressing, IN/OUT) · 8. Real-World
Applications · 9. Program Development Techniques.

Quick reference (from OCR): general registers AX/BX/CX/DX/SP/BP/SI/DI; segment
regs CS/DS/SS/ES; flags ODITSZAPC (Overflow, Direction, Interrupt, Trap, Sign,
Zero, Aux, Parity, Carry); addressing modes immediate/register/direct/
register-indirect/based/indexed/based-indexed; instruction groups data-move/
arithmetic/logic/branch/loop/string/flag/I/O. Subject: Intel 8086/8088, IBM PC.

## SYNTHESIZE — mesh placement
- **Layer:** `computing-history` (hist. of computing), same layer as
  `embedded-8051`, `byte-magazine`, `retro-game-books`.
- **Affinity:** pairs with `embedded-8051` (microprocessor programming, x86 vs
  8051 ISA contrast); with `fundamentals-cpp` (asm underpinnings of C++).
- **Non-affinity:** NOT a microcontroller book per se (it's the 8086/8088, a
  full microprocessor + IBM PC); NOT contested. Cite as a standard reference.

## Tooling — `scripts/8086_explorer.html`
A self-contained HTML/JS explorer of the 9-chapter map (grouped by part:
Foundations / Architecture / Programming / Systems) + a register/flag/addressing
quick-reference, with an on-demand archive.org PDF link. Opens via `file://`.
(flay rule #5 — every flay ships a runnable artifact; plain HTML/JS, honestly
labeled; not WASM.)

## STAND UP / READ (LIT proof)
- `corpus/8086_djvu.txt` — 383,966 B real OCR.
- `corpus/8086.pdf` — 25,469,965 B (25.5 MB, under 100 MB GH001).
- Dropped: `epub` (41 MB, redundant with PDF); `jp2.zip` (58 MB, redundant).

## Pitfalls (carried)
- **Underscores in filenames:** download names are `Programming_the_8086_8088.*`
  → URL-encode the path.
- No `rm -rf` / `rm -r` (i13n-flagged) — promote via `mkdir -p` + `cp -r`.
- No force-push; ff-only merges.
