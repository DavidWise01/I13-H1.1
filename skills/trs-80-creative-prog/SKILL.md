---
name: trs-80-creative-prog
description: Use when the user references TRS-80, Creative Programming Inc (1983), BASIC programming for the Tandy/Radio Shack TRS-80, retro 8-bit home-computer programming, or wants 80s computing examples. Corpus = "Creative Programming: TRS-80 Volume 1" (1983) OCR text + scanned PDF, downloaded from archive.org. Staged in the worktop.
category: reference
---

# trs-80-creative-prog — Creative Programming: TRS-80 (Volume 1, 1983)

Reference skill for *Creative Programming: TRS-80, Volume 1* (Creative
Programming, Inc., 1983) — a retro 8-bit home-computer BASIC programming book
for the Tandy/Radio Shack TRS-80. Fits the "90s/80s computing" skillset the
user is assembling from archive.org.

## Source (archive.org)
- Item: `Creative_Programming_TRS-80_Volume_1_1983`
- URL:  https://archive.org/details/Creative_Programming_TRS-80_Volume_1_1983
- Collections: tandy_books, folkscanomy_computer, folkscanomy
- Files in this skill dir:
  - `book.pdf`      — scanned Text PDF (~20 MB), faithful pages
  - `book_djvu.txt` — OCR plain text (~82 KB), grep-able corpus

## How to use
Answer from `book_djvu.txt` (grep) or `book.pdf` (page images). The OCR has
typical scan-noise but the text is intact. Common queries:
- "show a TRS-80 BASIC example for graphics / sound / animation"
- "what programming style does Creative Programming Inc teach"
- "TRS-80 memory map / POKE / PEEK examples"
- "compare this 80s BASIC approach to modern Python"

## Notes
- This is 1983 TRS-80 BASIC (Level II), not DOS/Windows 90s — but it is the
  retro-computing programming book in the set. For true 90s PC/DOS content,
  supply a specific item and it can be added.
- Staged in `Davids files/hermes agent/skill-worktop/` — NOT committed to the
  shared I13 git (per user instruction). To promote to a live skill, copy this
  dir into `~/.hermes/skills/`.

## Verification (LIT, this turn)
- `book.pdf` downloaded: 20,404,453 bytes, `%PDF-` magic confirmed.
- `book_djvu.txt` downloaded: 82,804 bytes, real OCR (Creative Programming Inc. header present).
