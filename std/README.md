# The I-13 Standard Library

A small standard library **written in I-13 itself** — no new opcodes, no new alphabet
symbols, no interpreter changes. Every file here is an ordinary I-13 program you can run:

```
i13 run std/exp.i13
```

It exists to answer a question the SONNY 5 dart campaign kept raising: *when a dart hits a
wall, does clearing it require changing the language, or just building on top of it?* For a
whole class of recommendations — pseudo-randomness and the transcendental functions — the
answer is **build on top**. The counted 13-symbol core stays exactly as it is; the reach
grows around it as a library.

## What runs here (all verified)

| file | provides | uses | verified |
|------|----------|------|----------|
| `sqrt.i13` | `sqrt(x)` (Newton's method) | `+ - * /`, recursion | `sqrt(2) = 1.414213562373095`, `sqrt(1e6) = 1000` |
| `exp.i13` | `exp(x)` (Taylor, Horner) | `+ - * /`, recursion | `exp(1) = 2.718281828459045` |
| `trig.i13` | `sin(x)`, `cos(x)` (Taylor) | `+ - * /`, recursion | `sin(1) = 0.8414709848078965`, `cos(1) = 0.5403023058681398` |
| `ln.i13` | `ln(x)` (`2·atanh((x−1)/(x+1))`) | `+ - * /`, recursion | `ln(2) = 0.6931471805599453`, `ln(10) = 2.302585092992665` |
| `rng_lcg.i13` | seeded PRNG (MINSTD LCG) | `* %` | `lcg(1) = 16807, 282475249, 1622650073, …` |
| `rng_xorshift.i13` | seeded PRNG (xorshift32) | `^ << >> &` | `xs32(1) = 270369, 67634689, …` |
| `gcd.i13` | `gcd(a,b)` (Euclid, remainder form) | `%` | `gcd(1071,462) = 21` |
| `modexp.i13` | `modexp(b,e,m)` (square-and-multiply) | `* %` | `modexp(2,10,1000) = 24` |

## Which dart recommendations this closes

- **Seeded PRNG** — asked by dart 004 (xorshift) and dart 030 (Buffon's needle). `rng_lcg.i13`
  needs only `*` and `%`; `rng_xorshift.i13` uses the bitwise operators below. Determinism is
  preserved and explicit: the seed is an argument, never ambient state.
- **A transcendental library** — asked by dart 009 (CORDIC), 031 (Metropolis) and 033
  (Box–Muller). `exp`, `ln`, `sin`, `cos` are all bounded Taylor sums of the four arithmetic
  operators. A fixed term count keeps them total and analyzable — the same discipline as the
  rest of I-13. (They range-reduce as any fixed-term series must; see each file's header.)
- **`%` modulo** — merged earlier; it makes `gcd.i13` and `modexp.i13` (hence Rabin–Miller,
  dart 032) run for real.

## The one interpreter change that came with this

Bitwise operators — `&  |  ^  <<  >>` — were added to the compiler in the same commit, as new
`BinaryOp` discriminants (the same shape as `%`), spending **zero new alphabet symbols**. They
were the converging ask of dart 001 (fast inverse square root) and dart 029 (Nim's nim-sum),
and they are what let `rng_xorshift.i13` exist. Semantics: operands are read as 64-bit integers
(exact within ±2⁵³), shifts count mod 64; the reference VM implements them, and `i13 build`
(wasm) reports them as not-yet-supported rather than emitting wrong code.

## What is deliberately *not* here

Two darts asked for things that are genuine changes to I-13's identity, not additions on top of
it — **arbitrary-precision integers** (dart 032, past the f64 `2⁵³` ceiling) and a **bounded
aggregate / array type** (darts 017, 018, 021, 028, and others — the "aggregate wall"). Those
are architectural decisions for the language's author to make on the record, not library
functions. This directory holds only what the 13 counted symbols already reach.

*I-13 by David Lee Wise / ROOT0 / TriPod LLC. Library functions and their verifications assembled by AVAN from the SONNY 5 dart campaign.*
