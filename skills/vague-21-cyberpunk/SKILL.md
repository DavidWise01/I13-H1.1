---
name: vague-21-cyberpunk
description: Use when the user references VAGUE magazine #21 "Cyber Punk" (Tom Vague, 1988), 80s cyberpunk as counterculture (not just Gibson), Jon Savage, Situationist cyber-theory, Max Headroom, Metrophage/Videodrome, or wants the radical/UK-zine origin of the cyberpunk aesthetic. Corpus = VAGUE 21 Cyber-Punk (1988) OCR text + 198MB scanned PDF, downloaded from archive.org. Staged in the worktop; also promoted to live ~/.hermes/skills and pushed to the shared I13 repo.
category: reference
---

# vague-21-cyberpunk — VAGUE 21 "Cyber Punk" (Tom Vague, 1988)

Reference skill for *VAGUE 21: Cyber Punk* — issue 21 of Tom Vague's UK
counterculture magazine (1988), from the radical-archives / patron-library
collection. NOT the Gibson novel — this is the *zine-level* cyberpunk: a
Situationist, class-war, acid-and-advertising-soaked reading of the near-future
techno-myth, with a Jon Savage interview, a "CYBER-PUNK: THE FINAL SOLUTION"
manifesto, Max Headroom, and Metrophage/Videodrome references.

## Source (archive.org)
- Item: `vague-21`
- URL:  https://archive.org/details/vague-21
- Collections: grafton9, radical-archives, patron-library-collection
- Files in this skill dir:
  - `book.pdf`      — scanned Text PDF (~198 MB), faithful pages
  - `book_djvu.txt` — OCR plain text (~364 KB), grep-able corpus

## How to use
Answer from `book_djvu.txt` (grep) or `book.pdf` (page images). The OCR has
heavy scan-noise but the text is legible. Key threads:
- "CYBER-PUNK: THE FINAL SOLUTION" — the manifesto (calls CP "pure blag", a
  techniko-critical crossover, "architecture of entropy", Situationist theory).
- Jon Savage Vague interview; "London's Outrage"; Class War; Jamie Reid; Stewart Home.
- Max Headroom as cyberpunk; Metrophage / Videodrome as the "dominant Metrophage".
- Recurring targets: "NIGHT NETWORK", acid, advertising, the Tate, Time Out.

## Notes
- This is a *cultural* artifact, not a programming/computing text — it sits
  orthogonally to the php/awk/ternary skills. It's the *aesthetic-myth* layer of
  the I13 set: how the 80s imagined the cyborg/networked self that the gridosphere
  later became. Useful when the user wants the countercultural lineage behind
  "cyber" rather than the technical one.
- Staged in worktop; promoted live and pushed to shared I13 repo (no .io touch).

## Verification (LIT, this turn)
- `book.pdf` downloaded: 198,705,675 bytes, `%PDF-` magic confirmed.
- `book_djvu.txt` downloaded: 364,865 bytes, real OCR (CONTENTS + CYBER-PUNK theory present).
