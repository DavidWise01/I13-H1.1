# I-13 Bounded Arrays — specification

Status: **proposed → implemented (H1.1)**. Author's decision (David Lee Wise), 2026-08-17,
after four independent SONNY 5 darts (032 Rabin–Miller, 035 Diffie–Hellman, 036 Hanoi, 041
Karatsuba) converged on an aggregate/array as the corpus's single clearest remaining request,
and the "aggregate wall" recurred across darts 017, 018, 021, 028.

This is deliberately larger than the earlier additions (`%`, bitwise): those spent **zero new
alphabet** and added no value kind. The array is the **first non-scalar value** in I-13. It is
therefore an author-level change to what I-13 *is*, made on the record, and specified to disturb
the language's principles as little as possible.

## Principles kept

1. **Bounded.** An array is created from a literal with a fixed number of elements. There is no
   `push`, `grow`, or `resize`. A length is fixed at the moment of creation.
2. **Checked.** Every index access is bounds-checked at run time. An out-of-range index is a
   runtime error (`E05xx`), exactly like division by zero — never undefined behaviour.
3. **Total, stated effects.** The three new IVM opcodes have fixed stack effects, declared in the
   one `Op::effect` authority, so the single-pass validator still proves stack balance.
4. **Value semantics, no aliasing.** A write does **not** mutate through a shared reference. It
   produces a **new** array; `v[i] <- e` is exactly `v <- arrayset(v, i, e)`. Two variables can
   never alias the same storage, so there is no hidden state — the property I-13 refuses to give up.
5. **Scalar elements.** Every element is an `f64`, I-13's only scalar. Arrays are flat vectors of
   `f64`; they do not nest in this version.

## Syntax

```
I v <- [3, 1, 4, 1, 5]      // an array literal — fixed length 5
I x <- v[2]                 // read element 2 (0-based)  -> 4
v[0] <- 9                   // write element 0  (v becomes [9,1,4,1,5])
```

- Array literal: `[ e0 , e1 , ... , en-1 ]` (elements are expressions; `[]` empty is allowed).
- Index read: `expr [ index ]` in any expression position (postfix, binds tightest).
- Index write: `name [ index ] <- value` as a statement; `name` must already be declared.
- The length is not a keyword; a program that needs it passes it explicitly alongside the array
  (in I-13's spirit — nothing implicit). Iteration is bounded recursion, as everywhere else:

```
def fill(I a, I i, I n) {
  if i >= n { -> a }
  a[i] <- i * i
  -> fill(a, i + 1, n)
}
I squares <- fill([0,0,0,0,0], 0, 5)   // [0,1,4,9,16]
```

## Semantics

- `[e0..en-1]` evaluates the elements left to right and produces an array of length n.
- `v[i]` requires `0 <= i < len(v)`, else a runtime error `array index out of range`. `i` is
  truncated to an integer (as the bitwise ops do); a non-array base is a runtime type error.
- `v[i] <- e` requires the same bound, and yields a new array equal to `v` with position `i`
  replaced by `e`, rebound to the variable. Because it is a functional update, a write is O(n);
  this is the price of alias-freedom and is documented, not hidden.

## ISA change

Three new opcodes, taking `OPCODE_COUNT` from 15 to **18** (`Op::Attr` remains reserved /
non-executable):

| opcode | operand | stack effect (need → net) | meaning |
|--------|---------|---------------------------|---------|
| `MakeArray` | `a = n` | need n, net `1 - n` | pop n numbers, push a length-n array |
| `Index` | — | need 2, net −1 | pop (array, i), push array[i] (checked) |
| `ArraySet` | — | need 3, net −2 | pop (array, i, x), push a copy with array[i]=x (checked) |

`MakeArray` has variable arity, declared through `Inst::effect` the same way `Call` is, so the
validator's stack-height proof is unchanged in structure.

The runtime represents an array as a handle into a per-run arena, so `Value` stays `Copy` and no
existing code is disturbed; the arena is bounded by the 8,000,000-step ceiling.

## Not in this version (still the author's call, if ever)

- Dynamic growth / resize (arrays stay bounded by construction).
- Nested arrays / arrays of arrays (elements are `f64`).
- The **wasm backend**: `i13 build` reports arrays as not-yet-supported and directs to `i13 run`
  (the reference VM), exactly as `%` and the bitwise ops did on first landing.
- Arbitrary-precision integers (**bignum**) — a *different* withheld request (darts 032/035/036/
  041); an array does not address it.

## Verification

The full existing test suite must stay green (130 tests), and these must run:

```
i13 run std/array_sum.i13      # sum of an array
i13 run std/array_sieve.i13    # Sieve of Eratosthenes (dart 017's wall), now cleared
```

*I-13 by David Lee Wise / ROOT0 / TriPod LLC. Spec drafted by AVAN at the author's instruction.*
