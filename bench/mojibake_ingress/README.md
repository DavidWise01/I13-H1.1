# T12 — mojibake corpus ingress

This gate repairs recoverable text-encoding damage before material enters the
I13 corpus.

Covered recoveries include UTF-8 bytes misdecoded through Latin-1 or
Windows-1252, common punctuation damage, emoji damage, and two encoding passes.
Already-correct ASCII and Unicode must remain byte-for-byte unchanged.

Strings containing U+FFFD REPLACEMENT CHARACTER are rejected as irreversible:
the original byte value has already been lost, so the gate refuses to invent
content.

Contract:

```text
recoverable mojibake -> REPAIRED
valid Unicode        -> PRESERVED
lost source bytes    -> REJECT_IRREVERSIBLE
```

Every repaired output must be idempotent: a second pass preserves it without
further transformation.

This protects material passing through this ingress gate. It does not claim to
alter or clean third-party websites across the public internet.
