---
name: works-of-hogarth
description: "Use when the user references 'The Works of William Hogarth', John Trusler, Hogarth engravings, Hogarth's moral satires (Beer Street, Gin Lane, A Rake's Progress, Marriage à-la-mode), or archive.org item worksofwilliamho030737mbp. Built from REAL archive.org metadata (title/author/date confirmed; 'THE WORKS OF WILLIAM HOGARTH' in OCR). Humanities/Art-History node — sibling to libanius-1517 (classics). VERIFIED-PROVENANCE (not a technical text)."
category: humanities-classics
---

# Works of William Hogarth (Trusler, 1833)

**Source:** archive.org item **`worksofwilliamho030737mbp`** → *The Works of
William Hogarth, in a Series of Engravings, with Descriptions and a Comment on
their Moral Tendency* by **John Trusler** (commentary), engravings by **William
Hogarth** (1697–1764). Edition **1833**. Collection: `universallibrary` (public,
fetchable). Download filenames are `worksofwilliamho030737mbp.*` (URL-encode the
path).

## What it is
An **art-history / satirical-print commentary** text — the 2nd humanities node
(after `libanius-1517`) and the **first Art-History** entry. Epistemic status:
**VERIFIED-PROVENANCE** — title/author/date confirmed via archive.org metadata
+ "THE WORKS OF WILLIAM HOGARTH" in the OCR title page. NOT a technical text;
pairs with `libanius-1517` as the humanities/arts branch of the mesh.

## DISTILL — honest, no fabricated TOC
The OCR (`worksofwilliamho030737mbp_djvu.txt`, 348 KB) is **thin** — an
engraving-heavy art book: title page + plate captions only; the body is
image-driven (Hogarth's plates). Verified facts:
- **Artist:** William Hogarth (1697–1764), English painter & engraver.
- **Commentator:** John Trusler — moral commentary on the engravings (1833 ed.).
- **Title:** *The Works of William Hogarth, in a Series of Engravings, with
  Descriptions and a Comment on their Moral Tendency*.
- **Edition:** 1833 (19th-c. compilation of Hogarth's moral satires).
- **Subject (LoC auto-tag, corrupted):** the metadata carries a junk
  "Programming. Design. Parts for specific use" subject — IGNORE; the real
  subject is art history / satirical prints.
Do NOT invent a chapter list — the work is organized by engraving/plate, not a
numbered technical manual.

## SYNTHESIZE — mesh placement
- **Layer:** `humanities-classics` — same new branch as `libanius-1517`, but
  tagged **Art History** (sub-branch of humanities). 2nd non-technical node.
- **Affinity / contrast:** sibling to `libanius-1517` (both humanities, both
  "old" texts the user picked for age). Contrasts the entire STEM tier.
- **Non-affinity:** NOT a programming/computing reference. The LoC subject
  glitch ("Programming") is a classification artifact — do not route to CS.

## Tooling — `scripts/hogarth_portal.html`
A self-contained HTML/JS **catalog portal**: real metadata facts (artist/
commentator/title/edition/genre/role) + on-demand archive.org download links
(PDF, OCR, item page) + an honest OCR-quality warning. Opens via `file://`.
(flay rule #5 — runnable artifact; plain HTML/JS, honestly labeled.)

## STAND UP / READ (LIT proof)
- `corpus/hogarth_djvu.txt` — 348,323 B real OCR (title/captions).
- `corpus/hogarth.pdf` — 79,522,429 B (79.5 MB, under 100 MB GH001).
- Dropped: `OTIFF.zip` (1.1 GB!), `tif.zip` (180 MB), `djvu` (76 MB, redundant w/ PDF).

## Pitfalls (carried)
- **`bub_gb`-style / Million-Books IDs:** item id `worksofwilliamho030737mbp`
  has a long random suffix; use exactly as given. Filenames share that suffix.
- **Underscores in filenames:** download names are `worksofwilliamho030737mbp.*`
  → URL-encode the path.
- **Corrupted LoC subject:** ignore "Programming. Design..." — it's not CS.
- No `rm -rf` / `rm -r` (i13n-flagged) — promote via `mkdir -p` + `cp -r`.
- No force-push; ff-only merges.
