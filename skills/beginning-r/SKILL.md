---
name: beginning-r
description: "Use when the user references 'Beginning R', 'The Statistical Programming Language', Mark Gardener, R programming, R statistics, or archive.org item isbn_9788126541201. Built from REAL archive.org OCR (item isbn_9788126541201). VERIFIED R / statistics textbook — the mesh's first data-science node. Pairs with DSA (quantitative methods); contrasts Python as a data-language."
category: data-science
---

# Beginning R — The Statistical Programming Language

**Source:** archive.org item **`isbn_9788126541201`** → *Beginning R: The
Statistical Programming Language* by **Mark Gardener** (Wiley, Indian edition,
ISBN 9788126541201). Collection: `internetarchivebooks` — public, fetchable.
Download filenames are `isbn_9788126541201.*` (URL-encode the path). The
`/page/n9/mode/2up` suffix in a shared URL is a *reader* view, not the item id.

## What it is
A **VERIFIED R / statistics** textbook — the mesh's **first data-science
node** (no stats/R entry existed before). Epistemic status: VERIFIED (published
textbook). Fills a real gap: the mesh had Python (fluency), C++ (pl), and DSA
(cs) but no **quantitative / statistical-computing** node.

## DISTILL — real structure (from OCR CONTENTS, 12 chapters)
1. Introducing R: What It Is and How to Get It · 2. Starting Out: Becoming
Familiar with R · 3. Starting Out: Working with Objects · 4. Data: Descriptive
Statistics and Tabulation · 5. Data: Distribution · 6. Simple Hypothesis
Testing · 7. Introduction to Graphical Analysis · 8. Formula Notation and
Complex Statistics · 9. Manipulating Data and Extracting Components · 10.
Regression (Linear Modeling) · 11. More About Graphs · 12. Writing Your Own
Scripts: Beginning to Program.

Subject: R language, descriptive/inferential statistics, data frames, graphics
(base + formula notation), linear regression, scripting.

## SYNTHESIZE — mesh placement
- **Layer:** `data-science` — a **new branch** (the mesh's first stats/R node).
  Distinct from `cs-foundations` (DSA, algorithms) and `pl-foundations` (C++).
- **Affinity:** pairs with `data-structures-algorithms` as the
  *quantitative-methods* pair (DSA = algorithm theory; R = applied stats).
  Contrasts `fluent-python` as a data-language comparison (R vs Python for data).
- **Non-affinity:** NOT a general CS textbook — it's applied statistical
  computing. Cite as the stats entry, not a programming-language primer.

## Tooling — `scripts/r_explorer.html`
A self-contained HTML/JS explorer of the 12-chapter map (grouped by part:
Setup / Data & Stats / Graphics / Programming) + on-demand archive.org PDF
link. Opens via `file://`. (flay rule #5 — runnable artifact; plain HTML/JS,
honestly labeled.)

## STAND UP / READ (LIT proof)
- `corpus/r_djvu.txt` — 1,007,545 B real OCR.
- `corpus/r.pdf` — 24,043,502 B (24 MB, under 100 MB GH001).
- Dropped: `jp2.zip` (192 MB), `orig_jp2.tar` (750 MB!), `hocr.html` (27 MB),
  `epub` (1.5 MB), `lcp.epub` (LCP-encrypted, unusable).
- HTTP 500 on first `/download/` attempt was a transient IA CDN error; retry
  succeeded (OCR 200/1.0MB, PDF 200/24MB).

## Pitfalls (carried)
- **ISBN-based item ids:** the real id is `isbn_9788126541201` (strip the
  `/page/.../mode/2up` reader suffix). Filenames share that prefix.
- **Underscores in filenames:** download names are `isbn_9788126541201.*` →
  URL-encode the path.
- No `rm -rf` / `rm -r` (i13n-flagged) — promote via `mkdir -p` + `cp -r`.
- No force-push; ff-only merges.
