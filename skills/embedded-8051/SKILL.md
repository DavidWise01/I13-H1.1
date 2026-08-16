---
name: embedded-8051
description: "Use when the user references the 8051 microcontroller, EmbeddedProgramming archive.org collection, 8051Cmicro book, 8051 SFRs/registers/pinout/instruction-set, or wants an offline 8051 reference + embedded-book catalog. Built from the REAL archive.org item (EmbeddedProgramming) — the user URL EmbeddedProgramming/8051Cmicro/ maps to file 8051Cmicro.pdf inside it. Ships a FULL self-contained HTML tool (no external fetch)."
category: computing-history
---

# 8051 Embedded Workbench

**Source:** archive.org item **`EmbeddedProgramming`** (collection: `opensource`,
`community` — public). The user's `@url` was `EmbeddedProgramming/8051Cmicro/` —
that is NOT a separate item; archive.org returns `{"error":"Couldn't get
'8051Cmicro' for item EmbeddedProgramming"}` for it. `8051Cmicro` is a **file
inside** the `EmbeddedProgramming` item. Recovered by fetching the parent item.

The flayed book is **`8051Cmicro`** — a C + assembly textbook for the 8051
family (Sections I–IV: Beginnings, Functions/Modules/Development, Multitasking,
Appendices). Covers SFRs, register banks, the full instruction set (MOV/MOVC/MOVX,
logical, arithmetic, boolean/bit, jump/call), timers, interrupts, serial ports.

## What it is
A **computing/embedded reference** skill. Unlike retro-game-books (which needed a
split HTML+CLI because 135 PDFs were too big), this user explicitly asked for a
**FULL self-contained HTML tool** — so the deliverable is ONE offline file with
everything inline (no `fetch`, opens via `file://`):

`scripts/embedded_workbench.html` — the **8051 Embedded Workbench**:
- **SFR / Registers** view: the classic 8051 SFR map (P0/SP/DPTR/PCON/TCON/TMOD/
  TL0-TH1/P1/SCON/SBUF/P2/IE/P3/IP/PSW/ACC/B with addresses), register-bank note.
- **Pinout** view: inline SVG DIP-40 pinout (ports, RST, XTAL, ALE/PSEN, RD/WR).
- **Instruction Set** view: categorized ISA (Data Moving, Arithmetic, Logical,
  Boolean/bit, Jump/Call, addressing modes) — cross-checked vs the OCR.
- **Book Catalog** view: all **22 embedded titles** from the item metadata
  (8051 + PIC + embedded-C), filterable by family, each with an on-demand
  archive.org PDF fetch link.

All reference data (SFR addresses, pinout, ISA categories) are standard 8051
architecture facts, cross-checked against `corpus/8051Cmicro_djvu.txt`.

## DISTILL — real content (from OCR, 768 KB)
- Structure: Section I (C+assembly, parallel-port examples) → II (functions/
  modules/dev) → III (multitasking, timers/interrupts/serial) → IV (appendices).
- Real anchors from OCR: *"Special Function Registers"* (p33), *"Register Banks"*
  (p33), *"Data Moving Instructions"* (p59: MOV/MOVC/MOVX), *"Boolean (Bit)
  Instructions"* (p72), *"Timers, Interrupts, and Serial Ports"* (p281),
  *"Internal Timer Details"* / *"Example: A /msec Timer"* (p283-285).
- **22-book catalog** is the REAL file list of `EmbeddedProgramming` (8051Cmicro,
  Ayala's 8051 Architecture, Microcontroller Projects in C for the 8051, PIC
  guides, Embedded C Book, etc.).

## SYNTHESIZE — mesh placement
- **Layer:** computing/embedded reference (with `retro-game-books`, `sbtcvm`,
  `byte-magazine` first-issue). The 8051 is the hardware cousin of BYTE's 1975
  "World's Greatest Toy" essay and the sbtcvm balanced-ternary VM's real-world
  sibling.
- **Affinity:** embedded/firmware study shelf. Contrasts with `learning-patterns`
  (high-level JS) as the bare-metal counterpart.
- **Non-affinity:** NOT a modern MCU SDK; NOT an attack/pentest skill.

## Tooling — `scripts/embedded_workbench.html` (FULL HTML, per user ask)
Single self-contained file. No external `fetch`, no JSON dependency — all data
inline. Opens via `file://` or any static host. Verified under Node: 22 books
render, family filter works, SFR/pinout/ISA views present, fetch links wired.

## STAND UP / READ (LIT proof)
- `corpus/8051Cmicro_djvu.txt` — 768,430 B real OCR.
- `corpus/8051Cmicro.pdf` — 13,191,544 B (13.1 MB, under 100 MB GH001).
- `scripts/embedded_workbench.html` — 12,204 B self-contained tool.

## Pitfalls (carried)
- **URL is a file, not an item:** `EmbeddedProgramming/8051Cmicro/` 404s as a
  metadata item; fetch the parent `EmbeddedProgramming` and address the file.
- **`rm -rf` / `rm -r` are i13n-flagged** — never used; promote via `mkdir -p`
  + `cp -r`. No force-push.
- SFR/pinout facts are standard 8051; verify against your specific derivative
  (many 8051 clones add SFRs) — the HTML notes this.
