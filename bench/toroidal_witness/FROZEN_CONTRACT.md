# Frozen toroidal witness contract — v1

Status: **FROZEN / PASS**

## Canonical form

```text
{ in | out | vacant | occupied }^5
x { unwitnessed | witnessed }
x { 3x3 | abc | -abc }^3
```

The embedded torus seam is written `|||`. Global in/out ports are not added.
`in` and `out` remain local physical orientations at the seam.

The witness is read-only. It may change the verification phase from
`unwitnessed` to `witnessed`; it may not alter physical occupancy,
orientation, cardinality, or identity.

## Locked cardinality

```text
4^5 x 2 x 3^3
= 1,024 x 2 x 27
= 55,296
```

Exactly 27,648 configurations are unwitnessed and 27,648 are witnessed.

## Freeze gates

1. Enumerate exactly 55,296 unique configurations.
2. Preserve a one-to-one witness pair for every physical/orientation payload.
3. Report zero duplicate identities.
4. Report zero witness-caused payload mutations.
5. Recompute the receipt SHA-256 from the canonical receipt fields.

Frozen receipt hash:

```text
f0dbbdba8fa760562e4df783f34b7e25e64cd595ec2e4dbcfce913b1baea9b76
```

Any semantic or cardinality change requires a new schema version. This v1
receipt must not be silently regenerated under altered rules.
