# Stage 14.9 — Corpus Inlet + Curator

Stage 14.9 introduces a bounded curator inside the corpus voxel. It is an H1.1 host/runtime envelope, **not** a new I13 semantic word and **not** a VM opcode.

Canonical scaffold:

```text
[c[
    v[
        corpus[
            curator[
                [
                    (source),
                    (context),
                    (candidate),
                    {skill}
                ]
            ]
        ]
    ]]
    cv
]]
```

The compact form is:

```text
[c[v[corpus[curator[[(source),(context),(candidate),{skill}]]]]]cv]
```

## Four curator inputs

1. `(source)` — normalized material supplied to the inlet. The browser keeps the text; Wasm receives its deterministic FNV-1a-32 fingerprint plus byte length.
2. `(context)` — the current admitted corpus root. This must already exist in the compiled Stage 14 corpus.
3. `(candidate)` — proposed canonical corpus ID represented at the runtime boundary by its 32-bit OLOGY/FNV address plus byte length.
4. `{skill}` — a bounded capability profile.

The browser uses the existing Stage 14 canonical ID discipline and can distinguish an exact existing ID from a 32-bit hash collision because it retains the string. Wasm intentionally reports only `NEW_ROOT` or `ADDRESS_OCCUPIED`; an occupied address is never treated as proof of duplicate identity.

## Initial skill profiles

| Skill | Mask | Capabilities |
|---|---:|---|
| `BIBLIOGRAPHY` | `0x000f` | observe, compare, propose, provenance |
| `MATHEMATICS` | `0x0017` | observe, compare, propose, relate |
| `CODE` | `0x0027` | observe, compare, propose, code-inspect |

There is deliberately **no write/commit bit**.

```text
SKILL != AUTHORITY
CURATOR != COMMITTER
CANDIDATE != CORPUS RECORD
```

## Lifecycle

```text
0
→ SPAWN CURATOR
→ OBSERVE SOURCE
→ COMPARE CONTEXT
→ PROPOSE CANDIDATE
→ APPLY {skill}
→ RETURN
→ WITNESS
→ TERMINATE
→ outer cv
→ PASS / VETO
```

The curator child is ephemeral. Its private state dies at termination. Only the proposal receipt may survive.

## Runtime bounds

- source material: 1..4096 normalized UTF-8 bytes
- candidate canonical ID: 1..64 bytes
- context root: must already be an admitted Stage 14 root
- skill: must resolve to a known bounded profile
- Cortex authority: required for the curator return to pass

These are Stage 14.9 implementation bounds, not frozen I13 language laws.

## Proposal receipt

`i13_curator_propose(...) -> u64` packs:

```text
bit63       success
bits56..62  candidate status
bits48..55  skill
bits32..47  capability mask
bits0..31   curator witness
```

Candidate status is currently:

```text
1 = NEW_ROOT
2 = ADDRESS_OCCUPIED
```

`ADDRESS_OCCUPIED` means **hold and compare**. It does not authorize overwrite, merge, or revision.

## Outer CV

`i13_curator_cv(...)` recomputes the bounded curator receipt and returns:

```text
1 = PASS
0 = VETO
```

Tampered witness, changed status/mask, unknown context, invalid skill, exceeded bounds, or authority-off all VETO.

CV verifies the curator's return only. Stage 14.9 contains no corpus mutation API.

## Browser inlet

The Pages layer exposes:

```text
MATERIAL  → enter/paste raw material
ID        → enter proposed canonical ID
SKILL     → cycle bounded skill
CURATE    → request curator proposal + outer CV
CLEAR     → clear transient inlet state
```

Text normalization is a browser convenience (`NFKC`, trim, whitespace collapse). It does not grant evidence or commit authority.

An exact existing ID is displayed as an idempotence/occupied hold. A different ID mapping to an already occupied 32-bit address is quarantined as a collision before proposal display.

## Non-authority guarantees

Stage 14.9 does not export or call any operation that:

- writes or overwrites the corpus JSONL;
- adds a mesh edge;
- changes Q's current root;
- creates navigation `pending` state;
- invokes Stage 14.3 `STEP`, `BURROW`, or `CV / EXIT`;
- invokes Stage 14.6 `REQUEST`;
- executes arrival payloads;
- turns a proposal into evidence.

The next future commit/import stage, if built, must remain separately witnessed and must compare the canonical string rather than trusting FNV address equality alone.
