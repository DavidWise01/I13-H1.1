# Stage 15.1 — Pages Origin Hallway

Stage 15.1 changes the GitHub Pages presentation without splitting the H1.1 runtime into one website per layer.

## Site architecture

```text
docs/index.html
  LANDING / ORIGIN
      ↓
  #history
      ↓
  #epistemology
      ↓
  #entrance
      ↓
docs/workbench.html
  Stage 15.0 WASM main suite
      ↓
docs/runtime.html
  one live H1.1 machine
```

Core presentation law:

```text
LANDING != RUNTIME
DOOR != NEW MACHINE
LAYER != SEPARATE WEBSITE
ONE STACK -> MANY ENTRANCES
```

The deep Stage 3..14 scripts still execute in the single `runtime.html` machine. The workbench merely selects which suite/view is visible.

## Landing / Origin

The landing page centers the declaration keyword `I` and the twelve canonical semantic words:

```text
I

DESIGNATE
Name / Constant / Attribute

BIND
Assign / Arg / Return

DECIDE
Expr / If / Compare

TRANSFORM
Call / FunctionDef / BinOp
```

`Block` is not presented as a 14th word.

## History

The history section tells the stack as an evolution rather than a flat list of features:

```text
I13 language core
→ H1.0 freeze
→ reader / normalizer / Wasm / JIT / GFX
→ Cortex child
→ OLOGY / voxel / CV
→ Stage 14 corpus
→ Queen movement / arrival execution / receipt context
→ Stage 14.9.1 curator
→ Stage 15 workbench
```

The history is descriptive UI copy. Frozen/reference artifacts remain governed by their existing reference files.

## Epistemology

“Epistemology” is used in its ordinary sense: how knowledge is justified or known.

For this site, the operational I13 epistemology is summarized as:

```text
SOURCE
→ CONTEXT
→ CANDIDATE
→ WITNESS
→ CV
→ RECEIPT
```

The landing page also exposes the existing authority boundaries:

```text
ADDRESS != AUTHORITY
ARRIVAL != EXECUTION
EXECUTION != COMMIT
PERSONA != AUTHORITY
CANDIDATE != CORPUS RECORD
```

This section explains the runtime's knowledge discipline; it does not claim that the runtime implements a complete philosophical theory of epistemology.

## Entrance

The entrance is a set of doors into the **same** workbench:

```text
01 LANGUAGE          -> READER
02 TRANSLATION       -> WASM2
03 OUTPUT            -> GFX
04 PLACE             -> OLOGY
05 KNOWLEDGE         -> CORPUS / NAV
06 ACTION            -> CORPUS / EXECUTE
07 CURATION          -> CORPUS / CURATOR
```

The door selection is stored in the existing Stage 15 local browser preference and then `workbench.html` opens the one selected suite.

No door grants execution or corpus authority.

## Raw machine

`runtime.html` remains directly reachable as a diagnostic/raw-machine view. It is not the normal landing page.

## Compatibility

The landing source retains non-executing string markers required by older frozen/reference CI. Operational scripts are loaded only by `runtime.html` and the Stage 15 suite shell is loaded only by `workbench.html`.

## Test gate

Stage 15.1 requires:

- landing JavaScript syntax;
- landing page contains all 13 canonical words;
- `Block` is not listed as a canonical word;
- history, epistemology and entrance sections exist;
- `workbench.html` contains the Stage 15 runtime frame;
- Stage 15.0 suite self-test remains green;
- authority isolation remains green;
- full H1.1 reference/Rust/Pages CI remains green;
- GitHub Pages build completes.
