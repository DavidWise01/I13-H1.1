# Stage 14.7 — Arrival Execution

Stage 14.7 begins **after a verified movement has committed**. It does not change the Stage 14.2/14.3 movement authority chain.

```text
MOVE -> ARRIVE -> EXECUTE -> RETURN -> WITNESS -> RECEIPT
```

## Boundary law

```text
ADDRESS != AUTHORITY
ARRIVAL != EXECUTION
EXECUTION != COMMIT
```

`EXECUTE` is explicit. Merely arriving at an OLOGY root never runs code.

## Runtime

The live Rust/Wasm core now includes an arrival-safe I13 numeric VM kernel. Its opcode numbers are the exact preserved I13 v0.4 IDs:

`Const, Ask, Attr, Ret, Answer, Drop, Bin, Cmp, If, Call, Block, Else, End, Func, Halt` = `0..14`.

Stage 14.7 intentionally implements only the bounded arrival-safe subset first: `Const`, `Ask`, `Attr`, `Answer`, `Drop`, `Bin`, `Cmp`, `If`, `Block`, `Else`, `End`, `Halt`. `Func`, `Call`, and `Ret` are rejected rather than emulated. This is **not** a claim of full frozen VM parity.

The VM uses f64 internally. Arrival receipts accept only finite integral results fitting signed 32-bit range. Each executable program receives private read-only arrival context slots:

- global 0 = OLOGY x
- global 1 = OLOGY y
- global 2 = evidence eligibility (0/1)
- global 3 = full local mesh degree
- global 4 = private output slot

Private VM state terminates with the Cortex child. Only the receipt survives.

## Payload policy v0.1

All known corpus roots support a context-only `READ/RESOLVE` receipt. One explicit execution-contract fixture is registered initially:

- `sonia-003` -> program 1 `OLOGY_SUM`

`OLOGY_SUM` is **not a semantic claim about Kovalevskaya**. It is a runtime fixture that proves the arrived root is bound into the real I13 numeric execution path: `Ask x`, `Ask y`, `Bin +`, `Answer output`, `Halt`.

## Wasm ABI

- `i13_arrival_opcode_count()`
- `i13_arrival_kind(address)`
- `i13_arrival_program(address)`
- `i13_arrival_execute(address, step_limit, authority)`
- `i13_arrival_witness(address, result_bits, steps, kind, program)`

Receipt packing:

```text
bit63       success
bits56..62  arrival kind
bits48..55  program id
bits32..47  executed steps
bits0..31   signed i32 result bits
```

Zero is VETO.

## Browser behavior

Stage 14.7 watches the committed Queen root. A root change produces `ARRIVED`, clears any previous execution receipt, resolves `CONTEXT` or `PROGRAM`, and waits for explicit `EXECUTE`.

The browser does not evaluate I13. It only invokes the Rust/Wasm exports and displays the returned result and witness.