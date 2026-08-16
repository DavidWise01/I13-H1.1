---
name: eyes-wide-open
description: "Use when the user references 'Eyes Wide Open' (2020 Lockdown Edition), Fiona Barnett, CIA child trafficking, MK-ULTRA in Australia, MK-DELTA, Pizzagate/Pedogate, ritual abuse / mind-control memoirs, or the contested 'exposure' literature. Built from the REAL archive.org OCR (item eyeswideopen-2020-edition). CULTURAL-MYTH / CONTESTED NARRATIVE — the book's claims are the author's assertions, not established fact; pair with rape-of-the-mind (clinical 1956) as the contrast node, never conflate."
category: cultural-myth
---

# Eyes Wide Open — 2020 Lockdown Edition

**Source:** archive.org item **`eyeswideopen-2020-edition`** → *Eyes Wide Open:
2020 Lockdown Edition* by **Fiona Barnett** (2020-06-21). Collections:
`opensource`, `community` — public, fetchable. Download filenames in the item
are `EWO_June2020_LockdownEdition.*` (NOT the URL slug — the slug 404s on
download; use the metadata filenames).

Self-described scope (OCR front matter): *"CIA Child Trafficking | MK-ULTRA in
Australia | Ritual Abuse & Mind Control | Trauma-Based Forced Dissociation."*

## What it is
A **cultural-myth / contested-narrative** artifact: a 2020 conspiracy/alleged-
exposure memoir. The author asserts a worldwide CIA-coordinated child-trafficking
and MK-ULTRA mind-control operation touching Australia, the military, churches,
and US politics. This is **NOT** verified history — it is the author's claimed
testimony + interpretation. Label it honestly as contested.

## DISTILL — real structure (from OCR TOC, 23 chapters)
1. Watergate was Pedogate · 2. Royal Whitewash · 3. Victorian Pedophile Network
· 4. NSW Pedophile Network · 5. Bond University Pedophile Network · 6. Satan's
Seat · 7. Witches in the Workplace · 8. Conspiracy Fact · 9. Soviet-Fascist
Agenda · 10. Justice Denied · 11. MK-ULTRA & the Occult · 12. MK-ULTRA in
Australia / in the Military · 13. MK-ULTRA in Hillsong Church · 14. Confessions
of a Sydney Satanist · 15. Addicted to the Occult · 16. An 'Ejumacation' ·
17. The Family · 18. Ritual Abuse in Australia · 19. Candy Girl Child Prostitute
· 20. The Relevance of Intelligence · 21. Personality Assessment System ·
22. The Programming Matrix · 23. MK-DELTA Child Soldier.

Anchor (verbatim, OCR l46-48): *"TOPICS: CIA coordinated global child
trafficking operation; Project MK-ULTRA in Australia; Project MK-DELTA child
soldier program; Occult ritual abuse & mind control; Trauma-based forced
dissociation methods; Trauma-focussed integration treatment."*

## SYNTHESIZE — mesh placement (the OLOGY)
- **Layer:** cultural-myth / contested-narrative (with `rape-of-the-mind`,
  `byte-magazine`, `vague-21`). Distinct from `rape-of-the-mind`: Meerloo
  (1956) is a **clinical/peer-context** study of brainwashing; Barnett (2020) is
  a **first-person alleged-exposure memoir** in the conspiracy canon. Same
  *theme* (mind control) but opposite *epistemic status* — keep them as paired
  contrast nodes, never merge the claims.
- **Affinity:** media-literacy / propaganda-inoculation shelf (with
  `google-hacking-pentest` only as a contrast — information-ops awareness).
- **Non-affinity:** NOT a clinical source; NOT an attack/pentest skill; NOT
  verified history. Cite as "author asserts…", never as fact.

## Tooling — `scripts/eyes_reader.html`
A self-contained HTML/JS chapter reader of the 23-chapter TOC + the book's
self-described topic list, with an on-demand archive.org PDF fetch link. Opens
via `file://`. (Per flay rule #5 — every flay ships a runnable artifact. Plain
HTML/JS, honestly labeled; not WASM.)

## STAND UP / READ (LIT proof)
- `corpus/eyes-wide-open_djvu.txt` — 1,715,361 B real OCR.
- `corpus/eyes-wide-open.pdf` — 64,691,288 B (64.7 MB, under 100 MB GH001).
- Dropped: `EWO...epub` (395 MB) + `EWO..._jp2.zip` (387 MB) → GH001 reject.

## Pitfalls (carried)
- **Download filename mismatch:** the item's files are `EWO_June2020_*`; the
  URL slug `eyeswideopen-2020-edition.pdf` 404s. Use metadata filenames.
- **Epistemic honesty:** this is contested/alleged content. Flag every claim as
  the author's assertion. Do NOT present as established fact or merge with
  `rape-of-the-mind`'s clinical framing.
- `rm -rf` / `rm -r` are i13n-flagged — never used; promote via `mkdir -p` +
  `cp -r`. No force-push.
