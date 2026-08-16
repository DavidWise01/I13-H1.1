---
name: flay
description: Use when the user says "flay" (or distill+synthesize+stand-up+read) an archive.org item, book, paper, or any source artifact. FLAY = DISTILL (extract what it actually IS from the real content) + SYNTHESIZE (why it matters / where it sits in the mesh) + STAND UP (fold it into a skill: worktop + live + push to shared I13 repo) + READ (LIT inline proof of what was actually downloaded/verified). Always emit a Mutiny/Halt-and-Catch-Fire ASCII header + a one-block professional EXECUTIVE SUMMARY. This skill is built out iteratively as used.
category: workflow
---

# flay — distill + synthesize + stand up + read

Dave's verb for "take this source and turn it into a real, verified skill + a
tight reading of it." The discipline (i13): never summarize from memory — read
the actual downloaded corpus, then stamp.

## The four moves
1. **DISTILL** — what the artifact IS, grounded in the real OCR/content. Pull
   actual headings, TOC, named sections; quote real lines. No paraphrase-from-memory.
2. **SYNTHESIZE** — where it sits in the I13 mesh. Is it a *computational
   primitive* (php/awk/ternary), a *cultural-myth* layer (vague-21), or a
   *tooling/reference* layer (ia guide)? State affinity or non-affinity explicitly
   so Dave can find affinitive skillsets.
3. **STAND UP** — fold into a skill: download real files to worktop, write
   SKILL.md, `cp -r` to live `~/.hermes/skills/`, and push to shared I13 repo as
   a scoped PR (NEVER touch `.io` pages — GPT's lane).
4. **READ** — LIT inline proof: real byte sizes, `%PDF-`/magic, files present.
   Lightweight (one `ls`/`find`), no tempfile verifiers (user revoked those).

## Output contract (always)
```
+==============================================================+
|  MUTINY  //  Halt and Catch Fire  //  flay dispatch           |
+==============================================================+
  <item id>  —  <one-line subject>
```
Then:
- **EXECUTIVE SUMMARY** — 1 tight professional block (what it is, why it matters,
  what we did). No fluff.
- **DISTILL** — bullets/quotes from real content.
- **SYNTHESIZE** — mesh placement + affinity verdict.
- **STAND UP** — what was created/pushed (with LIT proof).
- **READ** — inline LIT evidence.

## Pitfalls (carried)
- Truncated archive.org URLs: the id often still resolves; if metadata call 404s,
  search `advancedsearch.php?q=<fragments>` to recover the real identifier.
- OCR is noisy: grep for real headings, don't trust the first 5 lines.
- Push of large PDFs times out at 180s foreground — push in background
  (`terminal(background=true, notify_on_complete=true)`), then open PR on complete.

## Build log (this skill is extended per use)
- v0.1 (2026-08-15): established DISTILL/SYNTHESIZE/STAND-UP/READ + Mutiny
  header + exec-summary contract. First real use: flayed `vague-21` (cultural
  layer) and `duccio-dogheria-internet-archive` (tooling layer).
