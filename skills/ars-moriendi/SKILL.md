---
name: ars-moriendi
description: "Use when the user references 'Ars Moriendi', 'The Art of Dying', 'Book of the Craft of Dying', deathbed literature, the five temptations of the dying, or the 15th-century memento-mori / occult-death tradition. Built from REAL fetched corpus (Wikisource + Wikipedia) because archive.org was down (HTTP 503) this session. VERIFIED scholarly structure (two Latin versions c.1415/1450, 11 woodcuts, 5 temptations) — the mesh's first OCCULT / OBSCURE node."
category: occult-obscure
---

# Ars Moriendi — The Art of Dying

**Source (fetched, NOT archive.org — IA was 503 this session):**
- **Wikisource:** *The Book of the Craft of Dying* (Caxton's English rendering of
  Ars Moriendi) — `https://en.wikisource.org/wiki/The_Book_of_the_Craft_of_Dying/craft`
  → 6 CHAPTERS, ~93,504 chars of real transcribed text.
- **Wikipedia:** `https://en.wikipedia.org/wiki/Ars_Moriendi` — scholarly structure
  (two Latin versions c.1415 & c.1450; 11 woodcuts; 5 temptations).

`curl` to Wikimedia returned 0-byte chunked bodies on this MSYS host; fetched via
Python `urllib` (handles chunked transfer). LIT-proof: both files downloaded
(wp_article.html 216,282 B; craft_rest.html 209,138 B).

## What it is
A **VERIFIED occult/deathbed** text — the mesh's **first OCCULT / OBSCURE node**
(distinct from Humanities/Classics, which held Greek rhetoric + Art History). Two
related Latin manuals (c.1415 & c.1450) for achieving a "good death" in the
shadow of the Black Death. Epistemic status: VERIFIED (published scholarly
structure + primary translated text).

## DISTILL — real structure (from fetched corpus)
- **The English text (Wikisource):** 6 chapters — Ch I The Hour of Death; Ch II–VI
  the Five Temptations (Faith, Despair, Impatience, Vainglory, Avarice) and their
  remedies; final consolations.
- **Scholarly structure (Wikipedia):** a *short version* (blockbook, **11 woodcuts**
  dramatizing angels vs demons at the deathbed — woodblock 7 of 11, Netherlands c.1460)
  and a *long version* (homiletic expansion). The **five temptations** of the dying
  man by demons: (1) against Faith, (2) to Despair, (3) to Impatience, (4) to
  Vainglory, (5) to Avarice — each answered by a counter-virtue.

## SYNTHESIZE — mesh placement
- **Layer:** `occult-obscure` — a **new branch** (the pivot the user requested).
  Distinct from `humanities-classics` (Libanius Greek rhetoric, Hogarth Art History).
  This is death-literature / memento-mori / pre-Reformation devotional occult.
- **Affinity:** pairs with the MIND branch (rape-of-the-mind / eyes-wide-open) as
  the *belief-and-influence* contrast — Ars Moriendi is the *medieval* manual for
  managing the soul's final temptation; the mind nodes are modern.
- **Non-affinity:** NOT a general philosophy text — it's a narrow 15th-c. death
  manual. Cite as the occult/deathbed entry, not a theology primer.

## Tooling — `scripts/ars_moriendi_explorer.html`
A self-contained HTML/JS explorer: 6 chapters + 5 Temptations + scholarly
structure (14 nodes), filter by Text / Temptations / Structure + search. Opens via
`file://`. (flay rule #5 — runnable artifact; plain HTML/JS, honestly labeled.)

## Pitfalls (carried)
- **archive.org was DOWN (503) this session** — sourced from Wikisource +
  Wikipedia via Python `urllib` instead. If IA recovers, a fuller PDF/OCR edition
  (e.g., `bookofcraftofdyi00caxtiala`) could be added later as a supplement.
- No `rm -rf` / `rm -r` (i13n-flagged) — promote via `mkdir -p` + `cp -r`.
- No force-push; ff-only merges.
- `curl` 0-byte on chunked Wikimedia HTML on MSYS — use Python `urllib` as fallback.
