# I13 Compiler Debugger v0.1

Status: **CONSTRUCTED · CI-GATED PENDING FINAL FREEZE**

Component ID: `I13-DEBUGGER-0.1`

## Purpose

The debugger turns the frozen trace observer seam into an interactive read-only control surface without creating a second VM or a writable runtime API.

```text
validated IVM
    ↓
reference VM
    ↓
pre-instruction immutable snapshot
    ↓
debugger pause / inspect / resume
    ↓
the same real instruction executes
```

Command surface:

```text
i13 debug file.i13
```

## Authority law

```text
SPEC -> HIR -> IVM     authority
REFERENCE VM            execution
TRACE                   observation
DEBUGGER                observation + pause control
```

```text
DEBUGGER MAY PAUSE EXECUTION.
DEBUGGER MAY INSPECT EXECUTION.
DEBUGGER MAY NOT MUTATE EXECUTION.
```

Debugger snapshots contain clones/read-only views of VM state. No debugger command receives a mutable reference to globals, locals, frames, stacks, program counters, or IVM instructions.

## Single-VM law

`run`, `run_observed`, and `run_debugged` enter the same VM execution loop.

There is no debugger interpreter and no debugger replay engine.

The controlled observer may return only:

```text
Continue
Quit
```

`Quit` aborts the debugger session without manufacturing a VM diagnostic or changing I13 program state.

## Pause model

The debugger pauses immediately before a real IVM instruction executes.

Pause reasons are:

```text
entry
step
next
breakpoint:<source-line>
```

`step` executes one IVM instruction.

`next` resumes until execution returns to the same or a shallower active I13 frame depth. This means a call can be stepped over without implementing a second call engine.

`continue` runs until a source-line breakpoint or program completion/fault.

Source-line breakpoints are suppressed until execution leaves the line that triggered them, preventing one source breakpoint from repeatedly firing on every lowered IVM instruction from the same source line.

## Read-only snapshot

Each debugger pause can inspect:

```text
current TraceEvent
all global bindings
active I13 frame stack
current operand stack
current-frame locals
current frame/program counter
source line and span
```

Function values remain tagged:

```text
Number(...)
Function(fnNNNN:name)
```

The debugger never flattens function identity into a numeric payload.

## Commands

```text
step | s
next | n
continue | c
break | b <line>
delete | d <line>
breakpoints | bl
where | w
bindings | vars
print | p <name|lNNNN>
stack
frames | bt
help | ?
quit | q
```

`print` resolves globals by name, function parameters by name, and raw local slots with `lNNNN` syntax.

## Relationship to trace

Trace is passive streaming observation.

Debugger consumes the same pre-instruction observation point but may block there while a user inspects the immutable snapshot.

```text
TRACE    observe → print → continue
DEBUG    observe → pause → inspect → resume
```

Neither defines IVM semantics.

## Diagnostics

Compile-time errors remain owned by `I13-DIAGNOSTICS-0.1` before the debugger begins.

Runtime faults remain normal VM diagnostics. Debugger inspection does not replace, wrap, or reinterpret them.

## Regression lock

`tests/compiler_debugger.rs` verifies:

```text
debugged VmResult == plain VmResult
one debugger snapshot per executed IVM instruction when continuously observed
tagged Function values survive debugger inspection
active function frames are visible
source-line breakpoint suppression works
real CLI supports break + inspect + next + continue
```

## Non-goals for v0.1

Not included:

```text
runtime value mutation
set-variable
program-counter mutation
instruction patching
conditional expressions in breakpoints
watchpoint-triggered pauses
reverse execution
trace replay
remote debugger protocol
DAP/LSP integration
Wasm-native debugging
editor UI
```

Future debugger versions may add richer observation and control, but writable execution state would require a separate explicit language/runtime decision rather than silently entering through tooling.
