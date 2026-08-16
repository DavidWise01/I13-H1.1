---
name: awk-programming
description: Use when the user references AWK, The AWK Programming Language (Aho/Kernighan/Weinberger, 1988), awk one-liners, awk patterns/actions, field processing, or text-processing pipelines. Corpus = the original AWK book (1988) OCR text + scanned PDF, downloaded from archive.org. Staged in the worktop; also promoted to live ~/.hermes/skills and pushed to the shared I13 repo.
category: reference
---

# awk-programming — The AWK Programming Language (1988)

Reference skill for *The AWK Programming Language* by Alfred V. Aho, Brian W.
Kernighan, and Peter J. Weinberger (Addison-Wesley, 1988) — the original,
definitive AWK book. Fits the programming skillset assembled from archive.org.

## Source (archive.org)
- Item: `pdfy-MgN0H1joIoDVoIC7`
- URL:  https://archive.org/details/pdfy-MgN0H1joIoDVoIC7
- Collections: pdfymirrors, the_stacks
- Files in this skill dir:
  - `book.pdf`      — scanned Text PDF (~8.2 MB), faithful pages
  - `book_djvu.txt` — OCR plain text (~434 KB), grep-able corpus

## How to use
Answer from `book_djvu.txt` (grep) or `book.pdf` (page images). The OCR has
typical scan-noise but the text is intact. Common queries:
- "show an awk one-liner for summing column N"
- "awk pattern/action model: BEGIN/END, fields, FS/OFS"
- "how awk differs from the PHP / retro-BASIC in the other skills"

## Notes
- This is the canonical 1988 AWK book (the language's authors). Not a ternary or
  retro-80s BASIC — it broadens the practical text-processing side of the set.
- Promoted to live `~/.hermes/skills/awk-programming` and pushed to the shared
  I13 repo (`skills/awk-programming`), per the user lifting the no-push gate.
  Does NOT touch any `.io` pages (GPT's lane).

## Verification (LIT, this turn)
- `book.pdf` downloaded: 8,204,128 bytes, `%PDF-` magic confirmed.
- `book_djvu.txt` downloaded: 434,683 bytes, real OCR (Aho/Kernighan/Weinberger header).
