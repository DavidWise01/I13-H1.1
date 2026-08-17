# I13 SKILL MESH — TOPIC & OLOGY

Organization of the flayed skills into **TOPIC** (subject cluster) and
**OLOGY** (domain of study / field of knowledge). Every entry carries its
**LAYER** (mesh placement) and **EPISTEMIC STATUS** (how to trust it).

> Epistemic key: **VERIFIED** = peer-standard text, **CLINICAL** = clinician-
> authored study, **CONTESTED** = author-asserted / conspiracy canon (cite as
> claim, not fact). **TOOL** = ships a runnable artifact.

---

## A. PYTHON FLUENCY (topic) — Pedagogy / Andragogy (-ology: how adults learn to code)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `think-python-downey` | beginner tier | VERIFIED | — (PR #10 open) |
| `automate-the-boring-stuff-sweigart` | beginner tier | VERIFIED | — (merged #7) |
| `fluent-python-ramalho` | advanced tier | VERIFIED | — (merged #8) |

## B. COMPUTATIONAL PRIMITIVES (topic) — Computer Architecture / Non-Standard Arithmetic
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `sbtcvm` | computational-primitive | VERIFIED | web wrapper (SSE VM) + bare VM |

## C. SECURITY / OSINT (topic) — Information Operations (-ology: infosec)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `google-hacking-pentest` | tooling-reference | VERIFIED | `ghdb.py` (offline dork builder) |

## D. WEB / FRONTEND PATTERNS (topic) — Software Engineering (-ology: design patterns)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `learning-patterns` | tooling-reference | VERIFIED | `patterns_explorer.html` (patterns.dev) |

## E. COMPUTING HISTORY (topic) — History of Computing (-ology: hist. of tech)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `byte-magazine-first-issue` | cultural-myth | VERIFIED (primary source) | `byte_reader.html` |
| `retro-game-books` | computing-history | VERIFIED (index) | `retro_catalog.html` + `retro_fetch.py` |
| `embedded-8051` | computing/embedded | VERIFIED | `embedded_workbench.html` (full HTML) |
| `programming-8086` | computing-history | VERIFIED | `8086_explorer.html` |

> **8086 pairs with embedded-8051** as the microprocessor-programming contrast:
> x86 (Coffron, 8086/8088 + IBM PC) vs 8051 MCU. Different ISA, same theme.
## E1. HUMANITIES / CLASSICS (topic) — Late-Antique Greek Rhetoric + Art History (-ology: Greek rhetoric & declamation; Art History / satirical prints)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `libanius-1517` | humanities-classics | VERIFIED | `libanius_portal.html` |
| `works-of-hogarth` | humanities-classics | VERIFIED | `hogarth_portal.html` |

> **E1 = mesh broadening:** the oldest (1517) & first *non-technical* node
> (libanius), joined by the first *Art-History* node (hogarth, 1833). Spans the
> mesh from pure-STEM into humanities + art — proof the ology is domain-agnostic.
> Neither pairs with anything technical; both contrast the computing tier by
> being non-technical, old texts the user picked for age.

## E2. CS FOUNDATIONS (topic) — Computer Science / Algorithms (-ology: algorithms & data structures)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `data-structures-algorithms` | cs-foundations | VERIFIED | `dsa_explorer.html` |

> **E2 sits under E** as the algorithmic backbone: the DSA theory the Python-fluency
> tier (A) applies. Karumanchi (2017) is a published textbook — VERIFIED, not contested.

## E3. PL FOUNDATIONS (topic) — Programming Languages (-ology: programming languages / C++)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `fundamentals-cpp` | pl-foundations | VERIFIED | `cpp_explorer.html` |

> **E3 = PRUNING discipline:** C++ is a distinct *language* node, NOT a clone of the
> Python-fluency tier (A). One clean language node added; no redundant "beginner tier"
> duplication. Pairs with E2 (implement DSA in C++) and A (C++ vs Python idioms).

## E4. DATA SCIENCE (topic) — Statistics / R Programming (-ology: statistics & R)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `beginning-r` | data-science | VERIFIED | `r_explorer.html` |

> **E4 = mesh gap-fill:** the mesh's first *quantitative / statistical-computing*
> node. Pairs with E2 (DSA) as the "quantitative methods" pair — DSA = algorithm
> theory, R = applied stats. Contrasts A (Python) as a data-language comparison.

## E5. OCCULT / OBSCURE (topic) — Deathbed Literature / Memento Mori (-ology: death-literature & pre-Reformation devotion)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `ars-moriendi` | occult-obscure | VERIFIED | `ars_moriendi_explorer.html` |

> **E5 = the pivot node:** the user's "occult & obscure" request. Sourced from
> Wikisource + Wikipedia (archive.org was 503 this session). Ars Moriendi (Art of
> Dying), two Latin versions c.1415 & c.1450 — 11 woodcuts, 5 deathbed temptations.
> Distinct from E1 (Greek rhetoric / Art History); this is *death-literature / the
> occult-death tradition*. Pairs with F (MIND) as the *belief-and-influence*
> contrast — medieval manual for the soul's final temptation vs modern mind-control.

## E6. ESOTERIC LANGUAGE (topic) — Esoteric Programming Languages (-ology: esolangs / language design)
| Skill | Layer | Status | Tool |
|---|---|---|---|
| `brainfuck` | esoteric-language | VERIFIED | `brainfuck_explorer.html` |
| `malbolge` | esoteric-language | VERIFIED | `malbolge_explorer.html` |

> **E6 = the esolang branch:** the user's "this one lol" pivot (Brainfuck) then
> Malbolge. Brainfuck ships a *runnable* interpreter (minimal, faithful); Malbolge
> ships a *reference* only (its self-modifying ternary VM is non-trivial — a wrong
> runner was attempted and graveyarded; the reference is real spec data). Together
> they bracket the language-design spectrum: minimal-by-design vs hostile-by-design.
> Pairs with `pl-foundations` (C++) and `computational-primitive` (sbtcvm).

## F. MIND / THOUGHT-CONTROL (topic) — Psychology & Media Studies
| Skill | Layer | Status | OLOGY branch | Tool |
|---|---|---|---|---|
| `rape-of-the-mind` | cultural-myth | CLINICAL (1956) | clinical psychiatry | `menticide_explorer.html` |
| `eyes-wide-open` | cultural-myth | CONTESTED (2020) | conspiracy-studies | `eyes_reader.html` |

> **F is the contrast pair:** Meerloo (CLINICAL) vs Barnett (CONTESTED). Same
> *theme* (menticide / mind control) but opposite epistemic status. Never merge
> their claims — they are the "two poles" of the mind-control ology node.

---

## OLOGY TAXONOMY (the "-ology" map)
- **Pedagogy / Andragogy** → A (Python fluency ladder)
- **Computer Architecture** → B (sbtcvm balanced-ternary VM)
- **Information Security** → C (google-hacking)
- **Software Design Patterns** → D (learning-patterns)
- **History of Computing** → E (byte, retro-games, embedded-8051)
- **Computer Science (algorithms)** → E2 (data-structures-algorithms)
- **Programming Languages (C++)** → E3 (fundamentals-cpp)
- **Statistics / R Programming** → E4 (beginning-r)
- **Deathbed Literature / Memento Mori** → E5 (ars-moriendi)
- **Esoteric Programming Languages** → E6 (brainfuck, malbolge)
- **Late-Antique Greek Rhetoric** → E1 (libanius-1517)
- **Art History / Satirical Prints** → E1 (works-of-hogarth)
- **Clinical Psychology / Psychiatry** → F-clinical (rape-of-the-mind)
- **Conspiracy Studies / Contested Narrative** → F-contested (eyes-wide-open)
- **Media Literacy / Propaganda Inoculation** → cross-cutting (C + F pair)

## MESH LAYERS (how flay sorts)
1. `computational-primitive` — sbtcvm
2. `tooling-reference` — google-hacking, learning-patterns
3. `computing-history` — byte-magazine, retro-game-books, embedded-8051
4. `cultural-myth` — rape-of-the-mind, eyes-wide-open
5. `cs-foundations` — data-structures-algorithms
6. `pl-foundations` — fundamentals-cpp
7. `humanities-classics` — libanius-1517, works-of-hogarth
8. `data-science` — beginning-r
9. `occult-obscure` — ars-moriendi
10. `esoteric-language` — brainfuck, malbolge

## RULE SET (flay discipline, v0.10)
- Every flay ships a runnable artifact (move #5): CLI or self-contained HTML/JS.
- WALL handling: 401/login-gated → pivot to open copy (rape-of-the-mind did this).
- Collection-vs-item: URL slug may be a file inside an item (embedded-8051,
  eyes-wide-open download filenames).
- Epistemic honesty: tag VERIFIED / CLINICAL / CONTESTED; never present a
  contested claim as fact.
- No `rm -rf` / `rm -r`; promote via `mkdir -p` + `cp -r`; no force-push.
