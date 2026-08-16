---
name: libanius-1517
description: "Use when the user references Libanius, Greek sophist/rhetoric, 'Libaníou sophistoú Meletai logoi te kai ekphraseis', the 1517 Greek edition, or archive.org item bub_gb_dyi8aXtnDvwC. Built from REAL archive.org metadata (title/author/date confirmed; Greek markers in OCR). Humanities/Classics node — oldest & first non-technical entry in the mesh. VERIFIED-PROVENANCE (not a technical-flavor text)."
category: humanities-classics
---

# Libanius 1517 — Meletai, Logoi, Ekphraseis

**Source:** archive.org item **`bub_gb_dyi8aXtnDvwC`** → *Libaníou sophistoú
Meletai, logoi te kai ekphraseis* by **Libanius** (Greek sophist & rhetorician,
c. 314–393 CE), **printed 1517**. Collection: `europeanlibraries` (Google Books
`bub_gb` scan) — public, fetchable. Download filenames are
`bub_gb_dyi8aXtnDvwC.*` (URL-encode the path).

## What it is
A **classical Greek rhetoric** text — the oldest item in the mesh and the
**first non-technical (humanities) node**. Epistemic status:
**VERIFIED-PROVENANCE** — title/author/date confirmed via archive.org metadata
+ Greek markers (`ALIBANIOY`, `Libanius`) in the OCR. It is NOT a technical /
computing text; do not pair it with the CS skills. It broadens the mesh from
pure-STEM into humanities.

## DISTILL — honest, no fabricated TOC
The OCR (`bub_gb_dyi8aXtnDvwC_djvu.txt`, 728 KB) is a **degraded early-print
Greek scan** — heavily garbled, usable for provenance/location, not reliable
transcription. Verified facts:
- **Author:** Libanius (Λιβάνιος), Greek sophist & rhetorician, c. 314–393 CE.
- **Title:** *Libaníou sophistoú Meletai, logoi te kai ekphraseis* (Exercises,
  Orations, and Ekphraseis).
- **Edition:** printed **1517** (incunabula-era Greek edition).
- **Genre:** late-antique Greek rhetoric & declamation.
Do NOT invent a chapter list — the source is a continuous Greek oration corpus,
not a numbered technical manual.

## SYNTHESIZE — mesh placement
- **Layer:** `humanities-classics` — a new branch, deliberately outside the
  STEM clusters. First node under "Humanities / Classics".
- **Affinity / contrast:** contrasts the entire technical mesh (this is the
  *oldest* and *least technical* entry). Demonstrates the mesh spans
  STEM ↔ humanities. Pairs conceptually with `eyes-wide-open` only as
  "non-STEM perspectives" — not as epistemic peers.
- **Non-affinity:** NOT a programming/computing reference. Cite as a primary
  classical source, not a how-to.

## Tooling — `scripts/libanius_portal.html`
A self-contained HTML/JS **catalog portal**: real metadata facts (author/title/
edition/source/genre/role) + on-demand archive.org download links (PDF, OCR,
item page) + an honest OCR-quality warning. Opens via `file://`. (flay rule #5
— runnable artifact; plain HTML/JS, honestly labeled.)

## STAND UP / READ (LIT proof)
- `corpus/libanius_djvu.txt` — 727,684 B real OCR (degraded Greek).
- `corpus/libanius.pdf` — 27,973,713 B (28 MB, under 100 MB GH001).
- Dropped: `jp2.zip` (144 MB), `images.tar` (264 MB), `hocr.html` (26 MB, redundant).

## Pitfalls (carried)
- **Google Books `bub_gb` IDs:** item id contains a long random suffix
  (`dyi8aXtnDvwC`); use exactly as given.
- **Underscores in filenames:** download names are `bub_gb_dyi8aXtnDvwC.*` →
  URL-encode the path.
- No `rm -rf` / `rm -r` (i13n-flagged) — promote via `mkdir -p` + `cp -r`.
- No force-push; ff-only merges.
