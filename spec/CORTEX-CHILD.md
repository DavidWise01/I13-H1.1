# Bounded Cortex child

Frozen VH1 reference form:

```text
[c[
    ( ... ),
    ( isa , decoder , module ),
    { c.n , fractal , x( .() ) }
        <- (c.n)
    n = depth
]]
```

Lifecycle carried into H1.1:

```text
0 -> RESOLVE -> BIND -> SPAWN -> DECODE -> EXECUTE -> RETURN -> WITNESS -> TERMINATE -> 0
```

Invariants:

- child authority is inherited and bounded by Cortex;
- child-private mutable state does not survive termination;
- explicit result/receipt/provenance may survive;
- child does not directly commit outside Cortex;
- `(isa, decoder, module)` is execution context, not a persistent agent identity.
