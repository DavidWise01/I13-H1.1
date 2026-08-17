---
name: p-prime-prime
description: "Use when the user references 'P′′', 'P double prime', 'P-prime-prime', 'p-pp', Corrado Böhm 1964, structured programming theorem, or the theoretical PARENT of Brainfuck. Built from REAL fetched corpus (full Wikipedia article) because archive.org was 503 this session. VERIFIED esolang — the 3rd and capstone ESOTERIC-LANGUAGE node (sibling to brainfuck + malbolge). Ships a FAITHFUL P′′→Brainfuck translator that runs on the verified BF engine."
category: esoteric-language
---

# P′′ (P double prime) — Interpreter & BF Translator

**Source (fetched, NOT archive.org — IA was 503 this session):**
- **Wikipedia:** `https://en.wikipedia.org/wiki/P%E2%80%B2%E2%80%B2` → full 468 KB article
  (user pasted the URL; fetched via Python `urllib` — curl returns 0-byte chunked
  bodies on this MSYS host).
- Corpus: `p-prime-prime/corpus/wp_article.html`.

## What it is
**P′′** — a primitive language by **Corrado Böhm (1964)** describing a family of
Turing machines. One of the earliest formulations of the **single-entry/single-exit**
principle central to **structured programming** (sequence + iteration ONLY; no
selection/if-then-else). Historically the **theoretical parent of Brainfuck**
(BF "dialects" it; P′′ "influenced Brainfuck"). Epistemic status: VERIFIED.

## DISTILL — real structure (from fetched article)
The language uses symbols `λ`, `R`, `(` `)` and the composite `{λR}²⁵⁵`.
The **exact P′′ → Brainfuck correspondence** (verbatim from the article's
"Instruction correspondence" table — bidirectional term-rewrite rules):

| # | P′′ pattern | BF | Meaning |
|---|---|---|---|
| 1 | `{λR}²⁵⁵λ` | `>` | head move right (composite) |
| 2 | `{λR}²⁵⁵`   | `-` | decrement mod 256 |
| 3 | `λR`        | `+` | increment mod 256 |
| 4 | `λ`         | `+>` | increment + head move |
| 5 | `R`         | `<` | head move left |
| 6 | `(`         | `[` | loop start |
| 7 | `)`         | `]` | loop end |

Key fact: `λ` → `+>` (rule 4) AND `λR{λR}²⁵⁵λ` → `+>` (rules 3+1) — the article
explicitly shows **two different P′′ programs translating to the same BF `+>`**.
(LIT-proven in the tool's verifier.) Also: P′′ and BF tape heads move in OPPOSITE
directions ("Tape mirroring") — the tool translates then runs under the BF
convention.

## SYNTHESIZE — mesh placement
- **Layer:** `esoteric-language` — the **3rd + CAPSTONE node** of the esolang
  branch (sibling to `brainfuck`, `malbolge`). P′′ is the *theoretical ancestor*:
  Brainfuck is a dialect of P′′. Completes the spectrum: P′′ (1964, academic
  minimalism) → Brainfuck (minimal, runnable) → Malbolge (hostile, reference-only).
- **Affinity:** roots the esolang branch in *computability/structured-programming*
  history; pairs with `sbtcvm` (Turing machines) and `fundamentals-cpp`.

## Tooling — `scripts/p_pp_explorer.html`
A **FAITHFUL pipeline**: P′′ → BF via the 7-row article correspondence (NOT
guessed) → executed by the **same verified Brainfuck engine** as the `brainfuck`
skill. LIT-proven: both example P′′ programs translate to `+>`. Self-contained
(static, file://). (flay rule #5 — runnable artifact.)

## Pitfalls (carried)
- **Multi-char patterns matter:** the first translator was CHAR-BY-CHAR and broke
  `{λR}²⁵⁵λ`/`{λR}²⁵⁵` (produced garbage BF). Fixed to greedy longest-match.
  Verified the article's equivalence claim after the fix.
- **archive.org was DOWN (503)** — sourced from Wikipedia via Python `urllib`.
- No `rm -rf` / `rm -r` (i13n-flagged) — promote via `mkdir -p` + `cp -r`.
- No force-push; ff-only merges.
- `curl` 0-byte on chunked Wikimedia HTML on MSYS — use Python `urllib`.
