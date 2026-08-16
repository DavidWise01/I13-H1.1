---
name: byte-magazine-first-issue
description: "Use when the user references BYTE Magazine, the 1975 first issue 'The World's Greatest Toy', early microcomputing history, the Altair/8080 era, Don Lancaster's TV Typewriter, or the origins of the personal-computer press. Built from real archive.org OCR — not from memory."
category: cultural-myth
---

# BYTE Magazine — Vol 00 No 01, "The World's Greatest Toy" (September 1975)

**Source:** `BYTE Magazine Volume 00 Number 01 — The Worlds Greatest Toy`,
September 1975. Flayed from archive.org item **`byte-magazine-1975-09`**
(collection path in the user URL was `BYTE-MAGAZINE-COMPLETE/`; the bare
identifier is `byte-magazine-1975-09`). `corpus/byte-1975-09_djvu.txt` (OCR)
+ `corpus/byte-1975-09.pdf` (62 MB readable scan).

This is the **legendary first issue** of BYTE — the magazine that, with
*Dr. Dobb's*, defined the personal-computer era. Subtitle: "the small systems
journal." It landed months after the Altair 8800 (Jan 1975) and the Microsoft
Altair BASIC (spring 1975), and documents the hobbyist-to-industry inflection
point: surplus keyboards, cassette bulk storage, wire-wrap kits, and the first
"which microprocessor for you?" buyer's guides.

## What it is
A primary-source artifact of **computing history / cultural-myth** layer — the
moment microcomputing became a *movement* with its own press. Not a how-to
primitive; a primary document.

## DISTILL — real table of contents (from the OCR TOC block, ~p440-480)
Departments + features with authors + page numbers (verbatim from OCR):

- **What is BYTE?** — p4
- **HOW BYTE Started** — p9
- **WHICH MICROPROCESSOR FOR YOU?** — p10 (Hardware — Chamberlin)
- **RGS 008A MICROCOMPUTER KIT** — p16 (Review — Hogenson)
- **SERIAL INTERFACE** — p22 (Hardware — Lancaster) — Don Lancaster's
  UART/parallel-to-serial treatment; an excerpt of his forthcoming
  *TV Typewriter Cookbook* (Howard W. Sams). The historic **TV Typewriter**.
- **WRYTE for BYTE** — p44 (For Profit — Ryland)
- **WRITE YOUR OWN ASSEMBLER** — p50 (Software — Fylstra)
- **DECIPHERING MYSTERY KEYBOARDS** — p62 (Hardware — Helmers)
- **LIFE Line** — p72 (Applications — Helmers) — Conway's *Game of Life* on
  micros ("LIFE Line" column).
- **BYTE Shop / Newsletters (OlIDS)** — p40
- **Letters** — p87

Cover blurbs (front matter, real):
- "Which Microprocessor for you?"
- "Cassette Interface — Your key to inexpensive bulk memory"
- "Assembling Your Assembler"
- "Can YOU use these SURPLUS KEYBOARDS? (You bet you can!)"

Subject tags from metadata: altair, assembly language, diode matrix, printed
circuit, serial interface, brew computer, life program, instruction set,
symbol table, keyboard, power supply, memory, interface, program, byte, kit,
software, data.

## SYNTHESIZE — mesh placement
- **Layer:** cultural-myth / primary-source reference (with `vague-21`,
  `duccio-dogheria`). NOT a computational primitive (php/awk/ternary), NOT a
  tooling reference (ia-cli, google-hacking).
- **Affinity:** early-computing-history shelf. Pairs with anything about the
  Altair/8080 era, the Homebrew/kit scene, or the origins of personal computing.
  Cross-links to `sbtcvm` (ternary VM) only as a "how far we've come" contrast,
  not a technical lineage.
- **Non-affinity:** not a coding ladder item; not an OSINT/attack skill.

## STAND UP / READ (LIT proof)
- `corpus/byte-1975-09_djvu.txt` — 443,605 B real OCR (DjVuTXT).
- `corpus/byte-1975-09.pdf` — 62,035,693 B (62 MB, under GitHub's 100 MB
  per-file GH001 limit → pushable).
- Dropped from PR: `_jp2.zip` (73 MB — allowed but kept local to keep the PR
  lean; also `_abbyy.gz`, `_hocr.*` are redundant OCR layers).

## Pitfalls (carried)
- The user URL used a collection prefix (`BYTE-MAGAZINE-COMPLETE/...`); the bare
  metadata id 404'd (`{}`). Recovered via `advancedsearch.php?q=title:"The
  Worlds Greatest Toy" byte` → real id `byte-magazine-1975-09`. Always recover
  via search when a collection-path URL 404s.
- OCR is noisy (junk spaces/characters); the TOC block (~p440-480 of the OCR)
  is the trustworthy structure, not line 1.
- 1975 tech (8080, wire-wrap, cassette tape storage) — historical context, not
  current practice.
- i13n: no `rm -rf`; promote via `mkdir -p` + `cp -r`. No force-push.
