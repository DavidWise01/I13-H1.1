# Frozen toroidal inline-verify contract — v1

Status: **FROZEN / PASS**

## Canonical form

```text
{ in | out | vacant | occupied | verify }^5
x { 3x3 | abc | -abc }^3
```

This profile treats `verify` as one of the five mutually exclusive local
states. It is intentionally distinct from the read-only witness profile.

## Locked cardinality

```text
5^5 x 3^3
= 3,125 x 27
= 84,375
```

The exhaustive split is:

- 27,648 configurations with no inline `verify` state.
- 56,727 configurations with one or more inline `verify` states.

## Freeze gates

1. Enumerate exactly 84,375 unique identities.
2. Reject all duplicate identities.
3. Preserve five local positions and three orientation axes.
4. Preserve the locked verify-absent/verify-present split.
5. Recompute the receipt hash from canonical receipt fields.

Frozen receipt hash:

```text
0e550c9605a0131d432ed77eca1146bc9366798f08fdde4456df42ec1ce66c23
```

Any semantic or cardinality change requires a new schema version.
