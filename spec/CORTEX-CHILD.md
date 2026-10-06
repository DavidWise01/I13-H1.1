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

### TOROID-5 timing extension

Child lifecycle commits are now additionally time-gated by the shared Cortex cell:

```text
{{ . | | | | . }}
0/5 -> 1/5 -> 2/5 -> 3/5 -> 4/5 -> 5/5
```

`5/5` is the closure witness and identifies with the next-cycle `0/5`. This timing gate does not expand child authority; all existing authority, depth, receipt, witness, and termination invariants remain intact.
