---
name: c-modern-approach-king
description: Use when the user references C programming, K.N. King's "C Programming: A Modern Approach" (2nd ed, 2008), C89/C99, or wants the foundational systems-language reference for the programming skillset. Corpus = the King C book (PDF 106MB + OCR txt 1.69MB) from archive.org. STAGED but corpus PENDING — archive.org returned 500 on all files of this item at flay time; will complete when the CDN recovers. Container wired to shared I13 repo (IMVC, no binary).
category: reference
---

# c-modern-approach-king — C Programming: A Modern Approach (King, 2008)

Reference skill for *C Programming: A Modern Approach, 2nd Edition* by K. N. King
(2008) — the canonical modern C textbook (C89 + C99). The **foundational systems
language** of the programming skillset: awk/php are built on C's lineage, so this
is the "root" computational-primitive skill.

## Source (archive.org)
- Item: `c-programming-a-modern-approach-2nd-ed-c-89-c-99-king-by`
- URL:  https://archive.org/details/c-programming-a-modern-approach-2nd-ed-c-89-c-99-king-by
- Collections: programming_books, folkscanomy_computer, folkscanomy
- Available files (from metadata): Image Container PDF (~106 MB, OVER GitHub 100 MB
  limit -> LOCAL-ONLY), Additional Text PDF (~45 MB), OCR DjVuTXT (~1.69 MB),
  Abbyy GZ, JP2 zip, EPUB (~63 MB), Daisy.

## Status: CORPUS PENDING
At flay time (2026-08-15) archive.org returned **HTTP 500 on every file** of this
item (item PAGE is 200/public, but `_djvu.txt`, `_abbyy.gz`, `.pdf` all 500'd).
This is a transient CDN outage (same failure seen earlier on the ternary-vm .ova).
The corpus (book.pdf + book_djvu.txt) will be downloaded and the IMVC container
refreshed once the CDN recovers. The SKILL.md + empty container are wired now so
the skill slot exists.

## How to use (once corpus lands)
Answer C questions from `book_djvu.txt` (grep). The OCR covers the full book
(pointers, arrays, strings, structs, the C preprocessor, C99 features). Pairs
naturally with `awk-programming` (AWK is C-flavored) and `php-programming`.

## Notes
- Layer: COMPUTATIONAL PRIMITIVE — highest affinity with php/awk; root of the
  Unix-tooling lineage in the set.
- Promoted live + container pushed to shared I13 repo (no .io touch). Binary stays
  local (106 MB PDF over the 100 MB limit anyway — IMVC offload rule).

## Verification
- [LIT] metadata + item page verified (HTTP 200).
- [LIT] SKILL.md + container.imvc created (empty corpus, status PENDING).
- [WALL] corpus download blocked by archive.org 500 (transient) — retry later.
