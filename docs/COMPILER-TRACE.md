# I13 Compiler Execution Tracing v0.1

Status: **CONSTRUCTED · CI-GATED PENDING FINAL FREEZE**

Component ID: `I13-TRACE-0.1`

## Purpose

Execution tracing exposes validated IVM execution over time without creating a second interpreter, changing runtime semantics, or becoming a new compiler authority.

```text
validated IVM
    ↓
reference VM
    ↓
real instruction executes
    │
    └── read-only observation → TRACE
```

The command surface is:

```text
i13 trace file.i13
```

## Authority rule

Tracing is an observer of the reference VM.

```text
SPEC -> HIR -> IVM     authority
REFERENCE VM            execution
TRACE                   observation
```

```text
TRACE MAY OBSERVE EXECUTION.
TRACE MAY NOT DEFINE EXECUTION.
```

There is no trace interpreter and no path that replays trace text as executable I13.

## Single-VM law

`vm::run` and `vm::run_observed` enter the same execution loop.

The only difference is whether a read-only observer receives an event immediately before each real IVM instruction executes.

Therefore tracing does not maintain a duplicate implementation of:

```text
stack behavior
binding behavior
control flow
call/return behavior
resource limits
runtime errors
```

The observer cannot mutate VM frames, stacks, locals, globals, program counters, or IVM instructions.

## Event model

Each `TraceEvent` contains:

```text
step
active I13 frame depth
scope: main or function
program counter
opcode
current stack height
canonical opcode stack effect: need + net
source span
read-only operation detail
```

The event is emitted after the deterministic VM step meter advances and after the step safety fuse check, but immediately before the instruction executes.

This gives a trace of the actual instruction sequence and ensures the final emitted event on an execution fault identifies the real failing IVM instruction.

## Stable text format

Every trace begins with:

```text
I13 TRACE v0.1
step_limit 8000000
frame_limit 4096
```

A typical event has this shape:

```text
000001 depth=1 scope=main pc=0000 Func    stack=0 need=0 net=+0 @1:1 [0..33] | bind g0000:add <- Function(fn0000:add)
```

A function body is visibly distinguished by frame depth and scope:

```text
depth=2 scope=fn0000:add
```

## Runtime details

The observer renders operation-specific context using the real pre-instruction runtime state.

Examples include:

```text
Const   push Number(1)
Ask     read g0001:x -> Number(3)
Answer  assign g0001:x <- Number(3)
Bin     Number(1) Add Number(2)
Cmp     Number(3) Gte Number(2)
If      condition=Number(0) path=jump:12
Call    call Function(fn0000:add) argc=2
Ret     return Number(6)
Func    bind g0000:add <- Function(fn0000:add)
```

Function values remain tagged in trace output. A function handle is never rendered as if it were merely a numeric table index.

## Streaming law

The CLI renders events as they arrive rather than collecting the full trace in memory.

```text
VM step
  ↓
TraceEvent
  ↓
stdout
  ↓
next VM step
```

Tracing therefore does not require memory proportional to total executed steps.

## Fault behavior

Compile-time failures use the existing source-mapped diagnostic system before execution begins.

Runtime failures behave as:

```text
trace events through failing instruction
    ↓
normal I13 runtime diagnostic
```

The diagnostic remains authoritative for the error code, category, source excerpt, and marked span.

Tracing does not replace or redefine `I13-DIAGNOSTICS-0.1`.

## Determinism law

For a fixed source, compiler version, and VM configuration:

```text
trace(source) == trace(source)
```

byte-for-byte for successful deterministic execution.

Observed execution must also preserve the exact unobserved VM result:

```text
run(program) == run_observed(program).result
```

## Regression lock

`tests/compiler_trace.rs` verifies:

```text
observed VmResult == unobserved VmResult
one event per executed IVM instruction
deterministic repeated event sequence
binding/call/return transitions are visible
canonical stack effects are visible
function frame depth is visible
runtime fault preserves the exact VM diagnostic
last fault trace event is the real failing instruction
real `i13 trace` CLI command streams and completes
```

## Relationship to Wasm

v0.1 traces the canonical reference VM, not generated Wasm internals.

Semantic parity remains governed separately by compiler/Wasm conformance:

```text
VM(program) == WASM(program)
```

A future Wasm backend trace may consume this observational vocabulary, but it must not redefine IVM execution or the reference trace contract.

## Non-goals for v0.1

Not included:

```text
interactive stepping
breakpoints
watch expressions
trace filtering
JSON trace protocol
trace file replay
Wasm instruction tracing
performance profiling
editor UI
reverse execution
```

Those may consume this component later. They must not create a second execution authority.
