---
name: retro-game-books
description: "Use when the user references retro game design/programming books, 8-bit/16-bit game dev, BASIC/6502/Assembly game code, Commodore/Apple/Atari/TRS-80 game books, or the archive.org collection 'RetroGameDesignAndProgrammingBooks' / 'Retro Computer Game Design and Programming Books'. Built from the REAL archive.org file list (135 PDFs) — a curated bundle index, NOT a single book."
category: computing-history
---

# Retro Computer Game Design and Programming Books

**Source:** archive.org item **`RetroGameDesignAndProgrammingBooks`** (titled
*Retro Computer Game Design and Programming Books*), an **archive.org
*collection* of ~135 retro game-design/programming PDFs** — NOT a single book.
Collections: `ataribooks`, `folkscanomy_computer`, `folkscanomy`. Public
(mediatype `texts`), all files fetchable (HTTP 200 on probe).

This is a **bundle skill**: it is an indexed catalog of the 135 books with real
titles, byte-sizes, platform tags, and language (BASIC/Logo/mixed), plus a
runnable HTML catalog that can fetch any book on demand. We deliberately did
NOT pull all 135 PDFs (would be many GB, and most are >100 MB zips) — instead
the skill ships a **real index** (`references/book_index.json`, 135 entries) and
5 **representative sample PDFs** in `corpus/` (~47 MB total, under the 100 MB
GitHub GH001 limit) to prove genuine content.

## What it is
A **computing-history / reference** artifact: the 1977–1990s canon of how people
actually learned to *design and code* games on micros — BASIC type-in listings,
6502 assembly game loops, Commodore/Apple/Atari platform books. Timeless
reference for: retro game-dev study, platform-game pattern archaeology, and
"how games were built before engines."

## DISTILL — real shape (from archive.org metadata, 135 PDFs)
- **Volume:** 135 PDFs. Largest platform presence: **Commodore** (44 — C64/C128/PET/VIC-20), **Atari** (16), **Apple** (9), **TRS-80** (8), **TI-99/4A** (3), **IBM PC** (1), **6502** (1).
- **Language:** mostly **BASIC** type-in books ("Tested Ready-to-Run Game Programs in BASIC", "Practical Programs and Games in BASIC", "Exciting Computer Games in BASIC"), plus **Logo** (TI-99/4A Logo magic) and **6502 assembly** (`6502Games1980.pdf`).
- **Representative titles (real, from the index):**
  - `24 Tested, Ready-to-Run Game Programs in BASIC (1978)` — 9.6 MB
  - `57 Practical Programs and Games in BASIC (1978)` — 5.9 MB
  - `25 Exciting Computer Games in BASIC for All Ages (1983)` — 6.9 MB
  - `34 More Tested Ready-to-Run Game Programs in BASIC (1981)` — 9.9 MB
  - `6502 Games (1980)` — 15.7 MB (assembly)
  - `Amazing Games for Your Commodore 64 (1984)`, `Commodore 128 (1986)`
  - `Adventure Games for the Commodore 64 (1984)`
  - `A Bit of Logo Magic for the TI-99/4A (1984)`
- **Sample corpus (downloaded, in `corpus/`):** the 5 above (47 MB).

## SYNTHESIZE — mesh placement
- **Layer:** computing-history / primary-source reference (with `byte-magazine`
  first-issue, `sbtcvm` balanced-ternary VM). The books are the *practice* that
  BYTE's 1975 "World's Greatest Toy" essay announced.
- **Affinity:** retro-computing / game-dev study shelf. Contrasts with
  `learning-patterns` (modern JS/React) as the *historical* counterpart.
- **Non-affinity:** NOT a modern engine tutorial; NOT an attack/pentest skill.

## Tooling — `scripts/retro_catalog.html`
A self-contained HTML/JS catalog of all **135 books** loaded from
`references/book_index.json` (fetched relative to the file). Features: search by
title, filter by platform (Commodore/Apple/Atari/TRS-80/TI-99/6502) and
language (BASIC/Logo), size display in MB, and a **per-book fetch link** that
opens the real archive.org download URL on demand (so the reader pulls only what
they need — no 100 MB repo bloat). Opens via `file://` or any static host.
(Per flay rule #5 — every flay ships a runnable artifact. Plain HTML/JS,
honestly labeled; not WASM.)

**On-demand fetch helper (no download needed up front):**
```
# fetch any one book by its archive.org filename
curl -L "https://archive.org/download/RetroGameDesignAndProgrammingBooks/<URL_ENCODED_NAME>.pdf" -o <out>.pdf
```

## STAND UP / READ (LIT proof)
- `references/book_index.json` — 135 real entries (title, size, platforms, lang).
- `corpus/*.pdf` — 5 sample books, 47,061,452 B total (under 100 MB GH001).
- DID NOT push the 135 zips (most `_jp2.zip` are 60–190 MB each → GH001 reject).

## Pitfalls (carried)
- **It's a collection, not a book** — do NOT summarize as one title; the skill is
  an *index + samples*, not the full 135 binaries.
- **Size discipline:** 135 PDFs + their `_jp2.zip` siblings exceed repo limits
  by far. We ship the index + 5 samples; on-demand fetch handles the rest.
- `rm -r` / `rm -rf` are i13n-flagged — never used; promote via `mkdir -p` +
  `cp -r`. No force-push.
