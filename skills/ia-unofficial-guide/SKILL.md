---
name: ia-unofficial-guide
description: Use when the user references the Internet Archive itself — how to use archive.org, create an account, upload items, write metadata, use Open Library / Books to Borrow (CDL), search, or the Wayback Machine. Corpus = "Duccio Dogheria, Internet Archive: An unofficial guide to the World's most innovative digital library" (2025) OCR text + PDF, downloaded from archive.org. Staged in the worktop; also promoted to live ~/.hermes/skills and pushed to the shared I13 repo.
category: reference
---

# ia-unofficial-guide — Internet Archive: An Unofficial Guide (Dogheria, 2025)

Reference skill for *Internet Archive: An unofficial guide to the World's most
innovative digital library* by Duccio Dogheria (2025) — a practical how-to for
archive.org itself. Directly useful to the skill-acquisition workflow: it's the
manual for the very platform these skills are harvested from.

## Source (archive.org)
- Item: `duccio-dogheria-internet-archive.-an-unofficial-guide-to-the-wolrds-most-innovat`
- URL:  https://archive.org/details/duccio-dogheria-internet-archive.-an-unofficial-guide-to-the-wolrds-most-innovat
- Files in this skill dir:
  - `book.pdf`      — Text PDF (~1.4 MB)
  - `book_djvu.txt` — OCR plain text (~55 KB), grep-able corpus

## What it covers (from real OCR)
- **What IA is**: ~42M texts, 13M software files, 260k audio concerts, 2.5M
  collections (Nov 2024 figures); founded by Brewster Kahle (ex-Internet WAIS,
  co-founded Alexa).
- **Accounts**: sign up, "virtual library card", 65M+ free/borrowable items.
- **Uploading an item**: click Upload → pick uploader (e.g. Live Music Archive)
  → fill metadata → Upload creates the item. Metadata adheres to an
  international standard (Dublin Core-style); Subject Tags aid search.
- **Open Library** + **Books to Borrow** (CDL / controlled digital lending) for
  recent published books.
- **Search**: metadata-driven; help.archive.org + "New to the Archive?" section.

## How to use
Answer archive.org *usage* questions from `book_djvu.txt`. For the broader
harvesting pipeline (download metadata, fetch files via /download/ + /metadata
endpoints) combine with the `archive` CLI / advancedsearch.php patterns used by
the flay workflow itself.

## Notes
- This is the **tooling/reference** layer of the I13 set — it documents the
  platform we pull the other skills from. Affinity: high with the *workflow*
  skills (flay, skill curation), orthogonal to the computational (php/awk) and
  cultural (vague-21) layers.
- Staged in worktop; promoted live and pushed to shared I13 repo (no .io touch).

## Verification (LIT, this turn)
- `book.pdf` downloaded: 1,464,011 bytes, `%PDF-` magic confirmed.
- `book_djvu.txt` downloaded: 55,032 bytes, real OCR ("What is Internet Archive" present).
