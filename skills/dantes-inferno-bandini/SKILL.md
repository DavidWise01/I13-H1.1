---
name: dantes-inferno-bandini
description: Use when the user references Dante's Inferno, Dante Alighieri, or the Bandini translation — canto summaries, character/allegorical analysis (Virgil, Beatrice, the sinners), terza rima, or quotes. Corpus is the OCR text of "Dante's Inferno" (Rev. Albert R. Bandini translation) downloaded from archive.org, staged in the worktop.
category: reference
---

# dantes-inferno-bandini — Dante's Inferno (Bandini translation)

Reference skill for *Dante's Inferno* (the first cantica of the *Divine Comedy*),
using the OCR text of the **Rev. Albert R. Bandini** translation downloaded from
archive.org item `bwb_S0-BSP-206`.

## Source
- Item: `bwb_S0-BSP-206` — https://archive.org/details/bwb_S0-BSP-206
- Title: *Dante's Inferno* — Rev. Albert R. Bandini
- Files in this skill dir:
  - `book_djvu.txt` — OCR plain text (~1.0 MB), grep-able corpus
  - `book.pdf`      — scanned Text PDF (~27 MB), faithful page images

## How to use
Answer from `book_djvu.txt` directly (grep + read). The OCR has typical
scan-noise (stray glyphs, broken italics) but the text is intact and searchable.
Common queries:
- "summarize Canto V (Paolo and Francesca)"
- "what does Virgil represent / why is Beatrice the guide"
- "list the nine circles of Hell and their sins"
- "quote the inscription on the Gate of Hell"
- "explain the contrapasso for the gluttons / traitors"

## Notes
- The OCR is noisy; when quoting, prefer the PDF (`book.pdf`) to confirm exact
  wording for any line you plan to cite verbatim.
- This is the Bandini English translation, not the original Italian terza rima.
- Staged in `Davids files/hermes agent/skill-worktop/` — NOT committed to the
  shared I13 git (per user instruction). To promote to a live skill, copy this
  dir into `~/.hermes/skills/`.

## Verification (LIT, this turn)
- `book_djvu.txt` downloaded: 1,039,891 bytes, HTTP 200, valid text.
- `book.pdf` downloaded: 27,749,414 bytes, `%PDF-` magic confirmed.
- Grep confirmed real content: 531 hits for Inferno/Dante/Virgil/Beatrice.
