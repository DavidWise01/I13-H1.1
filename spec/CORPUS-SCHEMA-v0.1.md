# I13 H1.1 Corpus Schema v0.1

Canonical source format: UTF-8 JSON Lines (`corpus/h1.1-corpus.jsonl`). One record per line.

Required source fields:

```text
id              canonical lowercase identifier
title           source title
creator         creator / author / organization
year            integer or null
domain          non-empty classification list
v               non-empty V-layer list
kind            source kind
access          access mode
note            short original corpus note
url             absolute http(s) provenance URL
seriousness     0..2 (0 technical/evidence lane; higher = contextual/playful)
source_origin   provenance class
```

Optional source fields such as `ia` are retained by the JSONL source.

Allowed V-layer values:

```text
vector
voxel
vogel
vs
```

Derived fields are not required in the source JSONL:

```text
root.address = FNV1a32(id)
root.x       = address[31:16]
root.y       = address[15:0]
root.z       = 0
evidence_eligible = CV_PASS && seriousness == 0 && !vogel
```

`z` is local nested voxel depth and does not consume the 32-bit OLOGY surface address.

A hash collision is not resolved by probing in v0.1. It is rejected by Cortex Verifier so the identity decision stays explicit.
