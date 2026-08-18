# I-13 Bignum — specification

Status: **implemented (H1.1)**. Author's decision (David Lee Wise), 2026-08-17, after four
independent SONNY 5 darts converged on arbitrary-precision integers as the remaining request:
032 Rabin–Miller, 035 Diffie–Hellman, 041 Karatsuba, 047 Chinese Remainder — each runs the
*method* on I-13 but is capped by f64's exact range (2⁵³). Bignum lifts the cap.

Like the bounded array, this is an author-level change to what an I-13 *value* can be. It is
implemented to disturb the language's principles as little as possible.

## Principles kept

1. **Explicit promotion, no hidden magic.** A number does not silently become a bignum. The
   intrinsic **`big(x)`** promotes an integer-valued number to a bignum; from there arithmetic
   *propagates* — if either operand of `+ - * / %` or a comparison is a bignum, both are treated
   as bignums and the result is a bignum. Nothing is promoted behind your back.
2. **Exact, or an error — never silent loss.** Bignum arithmetic is exact. `big(x)` on a
   non-integer is a runtime error, not a rounding.
3. **No aliasing.** Bignums are values: each operation produces a new one (handles into a per-run
   arena), so two variables never share storage — the same discipline as arrays.
4. **No new dependency.** The project builds offline, so `BigInt` is a self-contained
   sign-magnitude implementation (base 2³², schoolbook add/sub/mul, binary long division) in
   `src/compiler/bignum.rs`, with its own unit tests.

## Syntax and semantics

```
I n  <- big(1)              // promote 1 to a bignum
I f  <- big(1)
// factorial 25 (exceeds 2^53, so f64 cannot hold it):
def fact(I n, I acc) { if n <= 1 { -> acc }  -> fact(n - 1, acc * n) }
I f25 <- fact(25, big(1))   // 15511210043330985984000000  (exact)
```

- `big(x)` — `x` must be an integer-valued number (≤ 2⁵³ to be exact in f64 first); returns a bignum.
- `+ - *` — exact bignum arithmetic (with a promoted operand if the other side is a plain number).
- `/` — **integer** (truncated) division for bignums (I-13's f64 `/` is real division; the bignum
  `/` is quotient). `%` — remainder, taking the sign of the dividend, matching f64 `%` on integers.
- comparisons (`< > <= >= == !=`) — exact, sign-aware.
- **bitwise** (`& | ^ << >>`) are *not* defined on bignum values (a clean runtime error) — they
  remain f64-integer operations.
- A bignum-valued global prints its **exact decimal string** (resolved before the run's arena is
  released).

## ISA change

One new opcode, `ToBig` (promotion), taking `OPCODE_COUNT` from 18 to **19**. It has a fixed
effect (need 1, net 0), declared in the one `Op::effect` law, so the single-pass validator is
unchanged. Bignum arithmetic reuses the existing `Bin`/`Cmp` opcodes — the *runtime* dispatches on
value type, so no new arithmetic opcodes and no change to the validator's stack proof.

`Value` gains `Bignum(usize)` (a handle into the per-run arena), staying `Copy`; no existing code
was disturbed, only extended.

## Verified

Matches a reference big-integer implementation exactly:

```
i13 run  fact.i13    ->  f100 = 933262154...000000        (100!, 158 digits)
i13 run  hanoi.i13   ->  hanoi64 = 18446744073709551615   (2^64 - 1, dart 036's count)
i13 run  modexp.i13  ->  dh = 293482507                   (7^128 mod 1000000009)
```

The full existing test suite stays green; six bignum unit tests cover sign handling, 25!, 2¹⁰⁰,
long division reconstruction, and modular exponentiation.

## Not in this version

- The **wasm backend** reports bignum as not-yet-supported (`i13 build`), directing to `i13 run`,
  as `%`, bitwise, and arrays did on first landing.
- Bignum **literals** (huge digit strings in source) — build large values from `big(small)` by
  arithmetic, as the examples do.
- The remaining converged request is **multiple return** (a tuple/pair), named by darts 045
  (quicksort) and 048 (union-find) — a *different* frontier, still the author's call.

*I-13 by David Lee Wise / ROOT0 / TriPod LLC. Spec drafted by AVAN at the author's instruction.*
