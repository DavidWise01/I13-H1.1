# 0root extension audit

The extension guard walks nine deterministic layers:

1. authority
2. repository root
3. path namespace
4. extension role
5. encoding
6. media signature
7. payload size
8. SHA-256 content
9. duplicate identity

Every result returns through the eight adjacent edges to authority. The emitted
`extension-witness.json` is stable for identical input and contains the file,
extension, byte length, media signature, UTF-8 state, and SHA-256 witness.

## Decisions

- Rarity is not proof that an extension is unused.
- `.i13`, `.imvc`, `.pulse`, `.s6p`, `.stnp`, and `.trom` are project payloads,
  not disposable residue.
- Exact duplicate paths inside `corpus/` or `reference/` preserve lineage.
- Git already stores identical blob content once. Duplicate paths primarily cost
  checkout space; deleting them does not meaningfully compact Git object storage.
- `.bak`, `.tmp`, `.orig`, compiled objects, editor swaps, and platform debris
  are rejected as prunable residue.
- New extensions enter `review` until added deliberately to the policy.

## Commands

```bash
python -m unittest tests/test_root_extension_audit.py -v
python scripts/root_extension_audit.py \
  --root . \
  --policy governance/extension-policy.json \
  --output extension-witness.json \
  --strict
```

The scanner is deliberately non-destructive. A deletion requires a separate,
reviewed commit with live-reference evidence and a rollback path.

## Main baseline — 2026-08-24

The Git tree at `d39f51822840018a8920d058bcfe7f70761ad928` contains:

- 713 files across 32 extension classes
- 531,224,506 checkout bytes
- 8 exact Git-blob duplicate groups and 10 redundant paths
- 414,239 redundant checkout bytes
- zero cross-extension exact duplicates
- zero tracked `.nap`, `.bak`, `.tmp`, `.orig`, `.rej`, object, class, or editor-swap files

The 23 PDFs account for 490,915,853 bytes (92.4% of the checkout). They are
unique corpus payloads, not duplicate-extension residue. The single MP3 adds
20,785,964 bytes. If repository size becomes the target, object migration is a
separate operation from extension pruning.
