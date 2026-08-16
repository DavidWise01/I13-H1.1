---
name: fundamentals-cpp
description: "Use when the user references 'Fundamentals of C++ Programming', Richard L. Halterman, C++, or introductory C++ (variables, operators, functions, pointers, arrays/vectors, classes, inheritance, templates, STL, exceptions). Built from the REAL archive.org OCR (item 2018FundamentalsOfCppProgramming). VERIFIED CS / programming-languages textbook — PL-Foundations node, sibling to Python-fluency + cs-foundations (DSA). PRUNED: folded as a distinct language node, not a duplicate of the Python tier."
category: pl-foundations
---

# Fundamentals of C++ Programming — Halterman

**Source:** archive.org item **`2018FundamentalsOfCppProgramming`** → *Fundamentals
of C++ Programming* by **Richard L. Halterman** (School of Computing, Southern
Adventist University; 2008–2018). Collections: `programming_books`,
`folkscanomy_computer`, `folkscanomy` — public, fetchable. Download filenames
start `2018_fundamentals-of-cpp-programming.*` (URL-encode the path).

## What it is
A **VERIFIED CS / programming-languages** textbook — the standard university
intro-to-C++ text. Epistemic status: VERIFIED (published textbook). Mesh node:
**PL-Foundations** (programming languages), a sibling branch under CS alongside
`think-python`/`fluent-python` (Python) and `data-structures-algorithms`
(cs-foundations / DSA). Different *language*, so it is NOT a duplicate of the
Python tier — it is the C++ counterpart.

## DISTILL — real structure (from OCR TOC)
~22 chapters: 1. Context of Software Development · 2-5. Program structure,
Values/Variables, Operators, Control Flow · 6-10. Modular design, Using/Writing
Functions, Function Mechanics, Managing Functions and Data (pointers, references,
scope) · 11-13. Sequences (Arrays, Vectors, Strings), Standard C++ Classes
(string/file streams), I/O Streams · 14-18. Custom Objects (classes), Fine-Tuning
Objects, Object Relationships, Inheritance & Polymorphism, Dynamic Objects &
Memory · 19-22. Generic Programming (templates), the STL, Iterators & Algorithms,
Handling Exceptions.

Topic map (OCR + subject metadata): software-dev context, values & variables,
operators (arithmetic/bitwise), functions, pointers & references, arrays/vectors/
strings, standard C++ classes, custom objects, inheritance & polymorphism,
generic programming, exception handling.

## SYNTHESIZE + PRUNE — mesh placement
- **Layer:** `pl-foundations` (NEW sub-layer under CS). Deliberately distinct
  from `cs-foundations` (DSA, algorithms) and from `Python Fluency` (different
  language). This is the **pruning** discipline: add ONE clean language node, do
  not spawn a redundant "beginner tier" clone of the Python skills.
- **Affinity:** pairs with `data-structures-algorithms` (implement DSA in C++)
  and the Python-fluency tier (cross-language comparison: C++ vs Python idioms).
- **Non-affinity:** NOT Python-specific; NOT contested. Cite as a standard ref.

## Tooling — `scripts/cpp_explorer.html`
A self-contained HTML/JS explorer of the ~22-chapter map (grouped by part:
Basics / Functions / Sequences / Objects / Advanced) + topic map, with an
on-demand archive.org PDF link. Opens via `file://`. (flay rule #5 — every flay
ships a runnable artifact; plain HTML/JS, honestly labeled; not WASM.)

## STAND UP / READ (LIT proof)
- `corpus/cpp_djvu.txt` — 1,608,711 B real OCR.
- `corpus/cpp.pdf` — 9,326,752 B (9.3 MB, under 100 MB GH001).
- Dropped: `epub` (34.8 MB, redundant with PDF); `jp2.zip` (261 MB → GH001 reject).

## Pitfalls (carried)
- **Spaces/hyphens in filenames:** download names are `2018_fundamentals-of-cpp-programming.*`
  → URL-encode the path.
- **Pruning:** do not duplicate the Python tier; keep `pl-foundations` as a
  distinct language node. No `rm -rf` / `rm -r` (i13n-flagged) — promote via
  `mkdir -p` + `cp -r`. No force-push; ff-only merges.
