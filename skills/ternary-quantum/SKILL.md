---
name: ternary-quantum
description: Use when the user references ternary/balanced-ternary quantum computing, ternary quantum arithmetic, ternary quantum logic circuits, or ternary quantum homomorphic encryption. Corpus = 3 arxiv papers on ternary+qubit crossover, downloaded from archive.org. Staged in the worktop.
category: reference
---

# ternary-quantum — ternary (trit) × qubit crossover

Reference skill for the narrow but real intersection of **balanced ternary
computing** and **quantum (qubit)** computation: ternary quantum arithmetic,
ternary quantum logic-circuit synthesis, and ternary quantum homomorphic
encryption. These are the closest archive.org has to "obscure programming
languages / formalisms near trit + qubit."

## Source (archive.org, all downloaded as PDF)
| File                        | arXiv ID              | Topic |
|-----------------------------|----------------------|-------|
| `arxiv-1512.03824.pdf`      | 1512.03824           | Improved Quantum Ternary Arithmetics |
| `arxiv-quant-ph0511041.pdf` | quant-ph/0511041     | Synthesis of Ternary Quantum Logic Circuits by Decomposition |
| `arxiv-1505.02854.pdf`      | 1505.02854           | Symmetric Ternary Quantum Homomorphic Encryption Scheme |

## How to use
Answer from the PDFs (read via pdftotext or the viewer). They are theory/formal
papers, not runnable languages — treat as the mathematical substrate, not a PL.
Common queries:
- "how is addition defined in quantum ternary arithmetic?"
- "how do you synthesize a ternary quantum logic circuit from a truth table?"
- "what's the ternary quantum homomorphic encryption scheme's security basis?"

## Notes
- These are PAPERS, not programming languages. The only runnable ternary
  *language* on archive.org is SBTCVM/TernOO (see the `ternary-vm` skill — the
  6.5 GB .ova appliance, staged separately for a VM build).
- Staged in `Davids files/hermes agent/skill-worktop/` — NOT committed to the
  shared I13 git (per user instruction).

## Verification (LIT, this turn)
- 3 PDFs downloaded, all `%PDF-` magic, sizes 148KB / 248KB / 379KB.
