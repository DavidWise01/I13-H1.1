# Stage 14.9.1 — Corpus Inlet + Curator Identity Profile

Stage 14.9.1 completes the bounded curator object inside the corpus voxel. It is an H1.1 host/runtime envelope, **not** a new I13 semantic word and **not** a VM opcode.

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
                    {skill},
                    {personas},
                    {occupation}
                ]
            ]
        ]
    ]]
    cv
]]
```

Compact form:

```text
[c[v[corpus[curator[[(source),(context),(candidate),{skill},{personas},{occupation}]]]]]cv]
```

## Six curator inputs

1. `(source)` — normalized material supplied to the inlet. The browser keeps the text; Wasm receives its deterministic FNV-1a-32 fingerprint plus byte length.
2. `(context)` — the current admitted corpus root. It must already exist in the compiled Stage 14 corpus.
3. `(candidate)` — the proposed canonical corpus ID, represented at the runtime boundary by its 32-bit OLOGY/FNV address plus byte length.
4. `{skill}` — **what the curator knows how to do**. Skill contributes a bounded capability mask.
5. `{personas}` — **which interpretive lenses examine the material**. Personas are a bounded bit-set and add zero authority/capability.
6. `{occupation}` — **what job the curator has in this session**. Occupation narrows the skill mask; it never expands it.

The browser retains canonical ID strings and can distinguish an exact existing ID from a 32-bit hash collision. Wasm intentionally reports only `NEW_ROOT` or `ADDRESS_OCCUPIED`; an occupied address is never proof of duplicate identity.

## Working triangle

```text
(.) SOURCE
     ↓
(.) CONTEXT
     ↓
(.) CANDIDATE
```

The three data slots are the curator's working triangle. The three brace slots describe bounded competence, lens, and assignment.

```text
{skill}       = HOW / CAPABILITY
{personas}    = WHOSE LENSES / INTERPRETATION
{occupation}  = JOB / SESSION SCOPE
```

## Skill profiles

| Skill | Mask | Capabilities |
|---|---:|---|
| `BIBLIOGRAPHY` | `0x000f` | observe, compare, propose, provenance |
| `MATHEMATICS` | `0x0017` | observe, compare, propose, relate |
| `CODE` | `0x0027` | observe, compare, propose, code-inspect |

There is deliberately **no write/commit bit**.

## Persona lenses

Stage 14.9.1 exposes four bounded persona bits:

```text
0x01 ARCHIVIST
0x02 MATHEMATICIAN
0x04 SKEPTIC
0x08 ENGINEER
```

The browser currently offers four safe lens-sets:

```text
ARCHIVIST + SKEPTIC
MATHEMATICIAN + SKEPTIC
SKEPTIC + ENGINEER
ALL LENSES
```

Personas are included in the v2 witness so the receipt records which lenses were used, but the persona mask never participates in capability calculation.

```text
PERSONA != AUTHORITY
PERSONA != CAPABILITY
PERSONA != COMMIT
```

Changing personas may change the witness. It must **not** increase the effective capability mask.

## Occupations

Initial bounded jobs:

```text
1 INGEST
2 REVIEW
3 CLASSIFY
4 RELATE
5 DUPLICATE_AUDIT
```

Occupation masks are:

| Occupation | Maximum job scope |
|---|---|
| `INGEST` | base + provenance |
| `REVIEW` | base only |
| `CLASSIFY` | base + relate |
| `RELATE` | base + relate |
| `DUPLICATE_AUDIT` | base + provenance |

Effective capability is an intersection:

```text
effective capability
=
skill capability
∩ occupation scope
```

The containing Cortex/corpus policy remains outside the curator and may narrow this further.

```text
effective curator authority
=
Cortex authority
∩ corpus policy
∩ occupation scope
∩ skill capability

personas add interpretation
but add 0 authority
```

## Core laws

```text
SKILL != AUTHORITY
PERSONA != AUTHORITY
OCCUPATION != AUTHORITY

CURATOR != COMMITTER
CANDIDATE != CORPUS RECORD
ADDRESS MATCH != IDENTITY
```

A title such as `{persona:administrator}` or `{occupation:administrator}` cannot create administrator authority. Names are data; authority is supplied by the containing Cortex gate.

## Lifecycle

```text
0
→ SPAWN CURATOR
→ ASSIGN {occupation}
→ LOAD {skill}
→ LOAD {personas}
→ OBSERVE (source)
→ COMPARE (context)
→ PROPOSE (candidate)
→ RETURN
→ WITNESS
→ TERMINATE PERSONA/CURATOR PRIVATE STATE
→ outer cv
→ PASS / HOLD / QUARANTINE / VETO
→ RECEIPT
→ 0
```

The curator child is ephemeral. Its private working state and persona scratch state die at termination. Only the witnessed proposal receipt may survive.

## Runtime bounds

- source material: `1..4096` normalized UTF-8 bytes
- candidate canonical ID: `1..64` bytes
- context root: must already be an admitted Stage 14 root
- skill: must resolve to a known bounded profile
- personas: non-zero subset of `0x0f`
- occupation: one of the five bounded jobs
- Cortex authority: required

These are H1.1 implementation bounds, not frozen I13 language laws.

## Protocol v2

`i13_curator_protocol_version()` returns `2`.

Stage 14.9.1 keeps the Stage 14.9 v1 proposal/CV exports for ABI compatibility and adds:

```text
i13_curator_persona_mask_valid
i13_curator_occupation_mask
i13_curator_effective_mask
i13_curator_propose_v2
i13_curator_cv_v2
```

`i13_curator_propose_v2(...) -> u64` packs:

```text
bit63       success
bits60..62  candidate status
bits56..59  skill
bits52..55  occupation
bits44..51  persona mask
bits32..43  effective capability mask
bits0..31   curator witness
```

Candidate status remains:

```text
1 = NEW_ROOT
2 = ADDRESS_OCCUPIED
```

`ADDRESS_OCCUPIED` means **hold and compare**. It does not authorize overwrite, merge, or revision.

## Outer CV v2

`i13_curator_cv_v2(...)` recomputes the complete bounded proposal and returns:

```text
1 = PASS
0 = VETO
```

The verifier binds:

```text
source fingerprint
source byte count
context root
candidate root + ID byte count
skill
personas
occupation
candidate status
effective mask
corpus fingerprint
witness
authority
```

Tampered persona set, occupation, witness, status, capability mask, invalid context, bounds failure, unknown profile, or authority-off all VETO.

CV verifies the curator return only. **Stage 14.9.1 contains no corpus mutation API.**

## Browser inlet

The Pages workbench exposes:

```text
MATERIAL  → enter/paste raw material
ID        → enter proposed canonical ID
SKILL     → cycle bounded skill
PERSONA   → cycle bounded persona set
JOB       → cycle bounded occupation
CURATE    → request proposal + outer CV
CLEAR     → clear transient inlet state
```

An exact existing ID is an idempotence/occupied `HOLD`. A different ID mapping to the same 32-bit address is `QUARANTINE` before proposal display.

## Non-authority guarantees

Stage 14.9.1 does not export or call any operation that:

- writes or overwrites the corpus JSONL;
- adds a mesh edge;
- changes Q's current root;
- creates navigation `pending` state;
- invokes Stage 14.3 `STEP`, `BURROW`, or `CV / EXIT`;
- invokes Stage 14.6 `REQUEST`;
- executes arrival payloads;
- turns a proposal into evidence;
- derives authority from persona or occupation names.

The future import/commit stage remains a separate witnessed gate.
