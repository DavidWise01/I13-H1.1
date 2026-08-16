---
name: think-python-downey
description: "Use when teaching or starting from absolute-zero Python (Allen Downey, Think Python 2nd ed, Green Tea Press). The beginner tier of the Python affinity chain — pairs below automate-the-boring-stuff-sweigart (practical) and fluent-python-ramalho (internals). Free CC-BY-NC."
category: tooling
---

# Think Python — Downey (2nd ed, Green Tea Press)

Beginner-Python skill. Source: archive.org item `2015ThinkPython`
— Allen B. Downey, *Think Python: How to Think Like a Computer Scientist*,
2nd ed (v2.2.23), Green Tea Press, 2015. CC-BY-NC 3.0. Public,
`programming_books` / `folkscanomy`.

## What this skill is for
The **entry tier** of the Python affinity chain: learn to *think* like a
programmer from zero (values, types, functions, recursion, OOP) before
applying it. Completes the ladder:
**Think Python (beginner) → Automate the Boring Stuff (practical) → Fluent Python (internals).**
Affinitive to `automate-the-boring-stuff-sweigart` and `fluent-python-ramalho`
(same language, ascending depth). NOT an internals book — this is where a
total beginner starts.

## Chapter structure (LIT = verified in real OCR TOC; AMBER = known 2nd-ed structure, not cleanly in this OCR)
LIT (found in `_djvu.txt` "Contents" block, lines ~509–2200):
- 1. The Way of the Program
- 2. Variables, Expressions and Statements
- 4. Case Study: Interface Design
- 8. Strings
- 9. Case Study: Word Play
- 12. Tuples
- 13. Functions
- 15. Conditionals and Recursion
- 16. Fruitful Functions
- 17. Iteration

AMBER (2nd-ed full set fills the gaps — lists/dicts, files, classes, inheritance,
debugging — but these headings are buried in noisy OCR lines, not the TOC block):
- 3. Functions (early), 5–7. (variables/functions region), 10–11. Lists & Dictionaries,
  14. Files, 18–20. Classes and Objects / Inheritance / Debugging.

## Real corpus (in `corpus/`)
- `tp_djvu.txt` — 516 KB OCR text (grep-able; verified, 516,396 bytes)
- `tp.pdf` — 814 KB Text PDF (verified `%PDF-`, 814,210 bytes; < 100 MB → pushable)

Note: this edition is tiny (PDF < 1 MB) — the whole book fits in git with room to spare.

## Distill -> Synthesize -> StandUp -> Read (flay discipline)
- DISTILL: chapter headings above read from the actual `_djvu.txt` Contents block.
- SYNTHESIZE: tooling/beginner layer; affinitive to `automate-the-boring-stuff-sweigart`
  + `fluent-python-ramalho` (forms the learner→mastery ladder). Pairs with a
  `python-stdlib` reference.
- STAND UP: promoted live to `~/.hermes/skills/think-python-downey`; folded into
  shared I13 repo (PR scoped to `skills/<name>/` only, no `.io`).
- READ: LIT proof = `ls` of live + pushed path; PDF byte size matches metadata.

## Quick grep examples (run against corpus/tp_djvu.txt)
- Recursion: `grep -ni "recursion" corpus/tp_djvu.txt | head`
- Classes: `grep -ni "class\|object\|inherit" corpus/tp_djvu.txt | head`
