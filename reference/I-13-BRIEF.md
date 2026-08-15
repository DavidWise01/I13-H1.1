# I-13 — the teaching brief (rev 2)

Author: **David Lee Wise / ROOT0 / TriPod LLC**. Canonical source: `i-13/i13-v2.1/`
(794 lines of Rust, no dependencies) plus the prose spec at
`i-13/i-13 v2/i13-v2/01-frozen-spec/I-13-v2-FROZEN.md`, which is the only document
defining L1–L4 and holding the MEASURED DEAD register.

> **Rev 2 changelog.** Five agents were taught rev 1 and asked to attack it. Rev 1
> was compiled from the Rust alone and inherited its defects. Corrected here: the
> plane membership (rev 1 had two symbols misfiled), `br` (does not exist), the
> axiom list (rev 1 presented eleven as equally enforced; five execute), the I.p
> coverage figure, and the "had no name" claim. Findings that need David's
> decision rather than a correction are collected in §10 and left open.

---

## 1. What it is

A **13-symbol alphabet for programs**, a five-rule zero-parameter governor, and a
stack machine whose validator is single-pass.

The alphabet was **not designed — it was counted.** 649,634 AST nodes across 504
Python 3.12 stdlib files, ranked by frequency and cut where the tail stopped
paying: **12 verbs at 83.27% coverage**, plus `I`. An independent recount over
Python 3.11 reproduced the rank order exactly, with one 0.02-point swap between
`Return` and `FunctionDef` — i.e. noise. **The ranking is reproducible.**

⚠ **The exclusion set is not published.** 83.27% holds over *some* set of excluded
node kinds (`Load`/`Store`/`Del`, operator singletons, `arguments`); raw `ast.walk`
with nothing excluded gives 57.66%, because `Load` alone is 25% of nodes. A
reproducer gets a different figure. See §10.1.

## 2. THE TWELVE — four planes of exactly three

| plane | symbol | attribution | share |
|---|---|---|---|
| **I DESIGNATE** — **53.55%** | `Name` | Lovelace 1843 | 29.67% |
| | `Constant` | Lovelace 1843 | 14.25% |
| | `Attribute` | *see §10.4* | 9.63% |
| **II BIND** — **11.13%** | `Assign` | Lovelace 1843 | 5.23% |
| | `Arg` *(a formal parameter; `Param` is the better name)* | Frege 1879 | 4.08% |
| | `Return` | Wheeler 1949 | 1.82% |
| **III DECIDE** — **7.78%** | `Expr` | *see §10.4* | 3.01% |
| | `If` | Lovelace 1843 | 2.76% |
| | `Compare` | Lovelace 1843 | 2.01% |
| **IV TRANSFORM** — **10.80%** | `Call` | Church 1932 | 7.50% |
| | `FunctionDef` | Church 1932 | 1.92% |
| | `BinOp` | *see §10.4* | 1.38% |
| | *total* | | **83.26%** |

Every triad sums to its published subtotal **exactly**. This is the corrected
membership, recovered from the frozen spec's wheel data.

⚠ **`ast.rs` currently disagrees with this table** and rev 1 of this brief copied
it. `ast.rs` files `Call` under DESIGNATE and `Expr` under TRANSFORM while keeping
the old subtotals, so as shipped its DESIGNATE header says 53.55% over members
summing to 61.05%. **Fix `ast.rs`, not this table** — the four exact reconciliations
above are the evidence for which is right.

**`Block` is not one of the twelve.** It is the container. It is a real, load-bearing
`Node` variant with no attribution and no measured share; counting it gives
thirteen verbs plus `I` = fourteen. Twelve verbs + `I` = 13 is the name.

**`I` is a declaration keyword in the concrete syntax** (`I x <- 0`), not an AST
node. That is the single fact rev 1 omitted that most confused its readers.

⚠ **`Node::Arg` is declared and never constructed.** Parameters live as
`Vec<String>` inside `FunctionDef`. One of the twelve is not in the machine.

## 3. Syntax — a whole program

```
// binom(4,2), then an osmotic accumulate
def choose(I n, I k) {
    I num <- 1
    I den <- 1
    if k < 1 { -> 1 }
    -> num
}
I total <- 0
total.p <- 4          // osmotic:  total <- total + 4
I out <- choose(4, 2)
```

`<-` binds, `->` returns, `I` declares, `{}` blocks, `//` comments. Two-character
tokens: `<- -> <= >= == !=`. `Constant` is `f64`; there is no string or integer type.

## 4. The law

    net = binds − k

Total, for every opcode, with **no unstated scope**.

| opcode | k | binds | net | | opcode | k | binds | net |
|---|---|---|---|---|---|---|---|---|
| `Const` | 0 | 1 | +1 | | `Cmp` | 2 | 1 | −1 |
| `Ask` | 0 | 1 | +1 | | `If` | 1 | 0 | −1 |
| `Attr` | 1 | 1 | 0 | | `Call(n)` | n+1 | 1 | −n |
| `Ret` | 1 | 1 | 0 | | `Block` | 0 | 0 | 0 |
| `Answer` | 1 | 0 | −1 | | `Else` | 0 | 0 | 0 |
| `Drop` | 1 | 0 | −1 | | `End` | 0 | 0 | 0 |
| `Bin` | 2 | 1 | −1 | | `Func`, `Halt` | 0 | 0 | 0 |

⚠ **There is no `br` opcode.** Rev 1 made "`br` targets a depth, never an address"
the headline law; the ISA has no branch instruction at all, and the string `br`
appears once in the source, in a doc comment. The **principle is real and
implemented** — control is `Block/If/Else/End` over a `ctrl` stack of *entry
heights*, so a target's height is always a number already in hand. State it that
way:

> **Control is depth-indexed, not address-indexed.** With absolute jumps the height
> at an instruction depends on how you arrived, so there is no single number to
> check; with a saved entry height there is, and validation is one linear pass.

⚠ **Applied partially.** `validate` bypasses `Op::effect()` for `Block`, `If`,
`Else`, `End` and `Ret`, re-deriving their arithmetic by hand. The two encodings
agree today; nothing enforces that they keep agreeing.

**A region** is the top level or a single `FunctionDef` body — blocks and `if` arms
are not regions. Each validates from height 0, which is why parameters are
*declared* rather than popped off the caller's stack. That is axiom XXIX, and it is
the design decision that makes single-pass work. **Independently verified:** the
validator visits exactly `len(code)` slots per region, ratio 1.0000, no backpatch,
no fixpoint.

## 5. I.p — the osmotic bind

    I <- J        LOSSLESS   the operand is REPLACED.  detectable.
    I.p <- v      OSMOTIC    the operand is on BOTH SIDES.  not detectable
                             without the prior value.

`x.p <- v` desugars to `x <- x + v`. The `osmotic` flag is set by the parser,
carried through flattening, and **read by nothing** — codegen is bit-identical with
it forced false. That is correct and worth saying plainly: it is provenance, and
its absence downstream is exactly what "not detectable without the prior value"
means.

**What the numbers actually support.** Measured over the stdlib:

| predicate | share of all binds |
|---|---|
| the bound name is read to compute its own new value | **~15–16%** |
| strictly `x <- x + v` — **what `I.p` can express** | **~4.9%** |

`parse.rs` hardcodes both the field name `p` and the operator `+`, so `I.p` reaches
the additive subset only. The 16.28% class is dominated by shapes it cannot
express: `s = s.replace(a,b)`, `buf = buf[n:]`, `x = x or default`.

⚠ **Drop "had no name."** The distinction is named in at least six literatures:
augmented assignment (ALGOL 68, C, PEP 203), read-modify-write (ISO C11 §5.1.2.4),
the accumulator register, **CRDT counter vs. register** (Shapiro et al. 2011 — the
closest match, and it exists for exactly your reason: increments commute,
replacements need a total order), relative vs. absolute update in replication, and
monoid action.

**The defensible claim is sharper than the one being made:** *a frequency-derived
alphabet cannot see this split, because the AST does not encode it. The single
symbol `Assign` silently merges two operationally distinct kinds of binding, and
every field that cares about concurrency or replication has been forced to split
them.* That is a finding about the census method, and it needs no history claim.

⚠ Composition is **three of the twelve** — ASSIGN + BINOP + NAME. No `Attribute`
node is constructed; `.p` is parsed as a keyword. And `Op::Attr` is a no-op in the
VM (`i += 1`), so `x.a.b.c` returns `x` — the rank-3 symbol has no semantics yet.

## 6. THE CORTEX — five rules, no *learned* parameters

Deterministic, bounded state. Each rule holds one thing a fixed window cannot: a
stack, a debt, a plane, an identity, a counter.

1. **VETO** — the only legal closer, or none.
2. **−I** — pressure `1.5·ln(1+age)`; and **the drain**, which emits every
   outstanding closer at once.
3. **DEPTH** — refuse a plane already paid for.
4. **IDEMPOTENCE** — *I am I.* A no-op cannot repeat.
5. **ADDRESS** — the substrate writes it. Constraining the model toward monotonic
   gave 44-digit runaways; handing it over gave 99%.

⚠ **"Zero parameters" means no *learned* parameters and no gradient path** — a real
and defensible claim. It does not mean no constants: `1.5`, `min(8)`, `min(12)`,
the `ceiling` argument, and the frozen spec's `run-pressure a=0.3` and `indent cap 16`
are all tuned. Say which you mean.

⚠ **In the shipped binary, only VETO and the drain execute.** `may_open`,
`pressure`, `address` and `idempotent` have no call site. Worse, `self.last` is
**never assigned**, so IDEMPOTENCE compares against a permanent `None`, always
returns true, and can never fire. `self.run` is never assigned either, so sensor
dimension 5 is a constant 0.

⚠ **The reach table is a doc comment.** Nothing computes it. Its L1 rows come from a
harness that is not in this repo, `veto` and `−I` are bit-identical at all four
planes despite having different guards, and the `address` counter increments
*unconditionally on call* — so its zero measures call sites, not expressions.
**L1–L4 are the tower** (FIELD, SUBAGENT HOST, COMPOSE, DEEP OPERAND), a different
four-way split from the alphabet's four planes.

## 7. The axioms — split by what actually runs

> **An axiom with no enforcement site is a belief.**

Rev 1 presented eleven as equally lit. Five execute in this repository.

### ENFORCED — verified running in the built binary

| id | claim | site |
|---|---|---|
| **XIII** | an exact ledger over an unstated scope is the strongest misdirection, because every entry is true | `Verdict` — non-optional `covered`/`not_covered`, printed unconditionally |
| **XXIX** | a context that inherits state cannot be checked alone | `validate` — one pass per region, each from height 0 |
| **XXXII** | a conserved quantity has no unstated scope | `Op::effect` — *partially; see §4* |
| **XXXIII** | a wish is not a discharge | `drain` — emits the closers, does not request them |
| **A7** | a check a parameter-free substrate can satisfy on random input is not measuring the model | `noise_control` — *but see §10.2* |

### PROVENANCE — true of the history, not enforced here

**A1, A2, A3, A4, A6, XXXI.** Their evidence lives in training runs that are not in
this tree — there is no model, no `torch`, no GRU anywhere. Specifically: **A3's
site (`main.rs`) reports neither of the two quantities A3 is about.** A6's site is a
comment. A2's site shows the *cortex* has a stack, which is not a claim about
learned state.

⚠ **XXXI is inside `pub const LIT` with `enforced_at: "no code"`,** so `print()`
emits *"11 LIT, each with an enforcement site."* The line-level honesty is real and
does not survive into the program's own output. A separate `WARNINGS` const, or an
`enforced: bool`, fixes this.

⚠ **A2's falsifier fired.** A2's falsifier is *"a recurrent model generates better
structure than a feedforward one."* A1's evidence, four lines above in the same
file: `GRU 33.8 mismatch, xfmr 65.6`. GRU is recurrent; lower is better. Recorded
LIT regardless.

## 8. The central claim — as the baseline control actually reads

The frozen spec's BASELINE CONTROL:

| arm | params | bits | brackets | mismatch | clean |
|---|---|---|---|---|---|
| GRU | 16,936 | 0.8440 | 79.6% | 33.8 | 16.6/40 |
| transformer | 14,944 | 0.9299 | 78.0% | 65.6 | 7.8/40 |
| **locked sa+cortex** | 18,921 | 0.9118 | **80.6%** | **0.0** | **40.0/40** |

⚠ **The published headline compares against a different configuration** —
`0.9182 / 74.3% / 15.0 / 24.0`. `0.9182` appears elsewhere only as the
uniform-averaging ablation that was killed; `74.3%` and `24.0/40` appear nowhere
else in the corpus. The bracket comparison **reverses** depending on which is used:
the GRU is 5.3 points better than the headline comparator and 1.0 point *worse*
than the shipped arm. "2.3×" exists only against 15.0.

**Supported as stated:** *at ~17k parameters on this corpus, adding a
zero-parameter cortex drives mismatched closers to 0, and no trained arm without it
does.*

**Not yet supported:** *learned state is not a stack.* That needs equal-parameter
arms, a capacity sweep (does mismatch fall toward 0 as parameters grow — the frozen
spec calls this the largest open question), a depth-generalisation test, and a
probe for whether the recurrent state encodes depth.

**The strongest result in the corpus is not the headline.** The sensor —
`cortex.rs::sense`, six floats handing the cortex's own state back as input — took
L2 mismatch from **15.0±2.1 to 0.6±0.8 with nothing correcting**, and L1 stray-close
from 65.0 to 1.0. Cohen's d ≈ 9. It survives any correction, and it is currently in
a code comment.

## 9. Verdict scope

    validate   VALID   peak height 4
               COVERED     stack balance and control-structure pairing,
                           per region, without executing
               NOT COVERED types, termination, arithmetic, and waste

Mandatory output, not documentation — axiom XIII in code. ⚠ **Call arity is in
neither list:** `def f(I a)` called as `f(1,2,3)` validates and runs; `g()` for a
two-parameter `g` validates and then dies in the VM. An unstated boundary inside
the ledger whose purpose is stating boundaries.

## 10. Open — needs a decision, not a correction

1. **Publish the AST-census exclusion set,** and separate it from the training-corpus
   preprocessing. §10 of the frozen spec says "string literals stripped", but
   `Constant` at 14.25% is only consistent with strings *included* (52.3% of
   `Constant` nodes are `str`). Both can be true of different pipelines; the
   document does not distinguish them.
2. **`noise_control` has no positive arm.** It measures one cell of a 2×2. The gate
   `pass * 20 < rej` passes a validator that rejects *everything*. An added positive
   arm gives **TPR 100% on 2,000 constructed-valid programs** — a better
   advertisement than the current one. Single-deletion mutants are detected 79.2%
   of the time; that is the informative number, not 99.75% against uniform noise.
3. **Is the alphabet general or Python-shaped?** 44.6% of `Attribute` nodes have
   `self` as the base — a syntax convention with no semantic content, and removing
   it drops `Attribute` from rank 3 to rank 5. Lisp would yield ~3 symbols at 99%
   coverage; Haskell has no `Assign`; SQL loses 5 of 12. **The mechanism is general
   and was tested across seven languages; the twelve were counted once, over one
   language.** The cheapest fix is to say so — and to give `ast.rs` a `not_covered`
   line naming pattern matching, iteration, exceptions, declarations and relational
   operations, exactly as `Verdict` is required to.
4. **Attributions to review.** `Expr` → Backus 1957 is wrong; the expression
   statement is ALGOL 60, not FORTRAN I (a bare `F(X)` was illegal in FORTRAN).
   `Call`/`FunctionDef` → Church **1932**, not 1936. `Attribute` → Hoare 1966 has
   priors in COBOL 1959 and PL/I 1964 for the dotted notation. `BinOp` → Lovelace
   1843 is the weakest; note that under the corrected triads it is Lovelace's only
   TRANSFORM seat, so the "one seat in every triad" claim depends on it.
5. **Iteration.** "Iteration is recursion" is true of the alphabet and false of
   IVM-13-S as shipped: `Op::Call` recurses into the host `exec` with no tail-call
   detection, and a tail-recursive loop **aborts the process at ~1,300 iterations**,
   after the validator has returned VALID. The 8,000,000-step limit never fires.
   Rule 3 DEPTH governs operand nesting and has no counterpart at the call plane —
   which is precisely where `vm.rs` says the infinity moved.
6. **Evidentiary symmetry.** XXXI publishes `CLEAN 15 → 13` — about 0.65 SD on its
   own binomial noise — as evidence, while XXXIII dismisses `unclosed 94.8 → 91.6`
   (≈3.4 SEM) as noise. The threshold currently moves with the direction of the
   result. The MEASURED DEAD register is the right instrument for this and has not
   been pointed at the axioms.
7. **Housekeeping.** 794 lines, not 803 (isa 165, axioms 70, main 88). Build is
   `rustc --edition 2021 -O main.rs` — there is no `src/`. `Cargo.toml` says 2.0.0.
   Frozen spec says 17 opcodes; the ISA has 15. MANIFEST says "7 LIT, 1 dead, 2
   amber"; `axioms.rs` says 11 LIT. The `.maxstack`/CIL result — the strongest
   external validation in the document — has **no artifact anywhere in the tree**.

---

## What is not in doubt

The rank order reproduces independently. The build reproduces byte-for-byte,
including 1995/5. Single-pass validation is real and instrumented. Region isolation
with declared parameters is the strongest engineering in the artifact. `Verdict`
really does declare its own boundary at runtime, including naming the one injected
fault of four that it misses. And the MEASURED DEAD register — sixteen negative
results kept with their measurements, including a retraction of the author's own
headline numbers across nine languages — is the most valuable section in the
corpus, and the reason the rest is worth attacking this hard.
