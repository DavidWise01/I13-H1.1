# E1.WORKSPACE-001 — Offline Git Coding Workspace

Status: **LOCKED KNOWN GOOD · NATIVE HOST ONLY · NON-RIVER · CI VERIFIED 2026-08-18**

Purpose: bind `E1.TECH-001` `p1` to a real, bounded coding workspace without moving filesystem/process authority into I13, Wasm, or the E1 sandbox.

```text
E1.TECH-001
    |
    | n1 -> HOLD -> r0
    | p0 -> FLAY -> r0/retry
    ` p1
      |
      v
CORTEX CAPABILITY GATE
      |
      v
i13-workspace <local-clone>
      |
      +-- read
      +-- git status / diff
      +-- cargo build --offline
      +-- cargo test --offline
      `-- bounded git apply
      |
      v
receipt -> r0
```

## Native boundary

`src/workspace.rs` is consumed by the native `src/bin/i13-workspace.rs` worker. It is not exported through `src/lib.rs`, so the Wasm core receives no filesystem or process API.

The worker assumes the target repository is already cloned locally. It never invokes `clone`, `fetch`, `pull`, `push`, remote resolution, or arbitrary shell commands.

## Trit gate

```text
n1 = -1 -> HOLD    -> executed=0
p0 =  0 -> FLAY    -> executed=0
p1 = +1 -> PROCEED -> capability may execute
```

Transport PASS and workspace authority remain separate facts. Only `p1` can reach a host operation.

## v0.1 capability surface

```text
read   : inspect one UTF-8 repository-relative file, <= 256 KiB
git    : status or diff only
build  : cargo build --offline --bin i13
test   : cargo test --offline --all-targets
patch  : git-native unified diff from stdin
```

No commit or push capability exists in v0.1.

## Surgical patch law

A patch is admitted only when all of these hold:

```text
patch <= 64 KiB
1..4 files
repository-relative paths only
no .git access
no path traversal
existing files only
tracked regular files only
patch target clean before cut
no create/delete/rename/mode/binary patch
git apply --check PASS
git apply PASS
git diff --check PASS
```

Unrelated dirty files are not reset or modified. If a target is already dirty, the patch is vetoed rather than merged into existing work.

## Offline law

Native Cargo operations are fixed, not supplied by the model:

```text
cargo build --offline --bin i13
cargo test --offline --all-targets
```

The worker sets:

```text
CARGO_NET_OFFLINE=true
GIT_TERMINAL_PROMPT=0
I13_WORKSPACE_OFFLINE=1
```

This prevents Cargo dependency resolution from using the network and prevents Git credential prompting. The worker itself has no network operation. A repository build script or test is still code from the local repository and remains subject to the host environment; v0.1 does not claim OS-level network sandboxing.

## CLI

```text
i13-workspace <repo> <-1|0|1> inspect <path>
i13-workspace <repo> <-1|0|1> status
i13-workspace <repo> <-1|0|1> diff [path]
i13-workspace <repo> <-1|0|1> build
i13-workspace <repo> <-1|0|1> test
cat fix.patch | i13-workspace <repo> 1 patch
```

The worker returns to `r0` on every controlled outcome. Gate-only exits:

```text
20 = n1 / HOLD
21 = p0 / FLAY
```

A host command failure returns `30`; structural/input veto returns `2`.

## Verified proof

Dedicated CI context:

```text
i13/e1-workspace = success
```

The gate verifies:

```text
native Rust compile + workspace unit tests
n1 HOLD executes nothing
p0 FLAY executes nothing
p1 PROCEED reaches local Git capability
bounded UTF-8 read
path traversal veto
direct .git access veto
real git apply against a temporary local repository
dirty patch-target veto
fixed cargo build --offline
fixed cargo test --offline
Wasm library still compiles without workspace/process exports
```

### Full local-clone surgical repair proof

The CI gate also performs a complete repair cycle against a local clone of this repository:

```text
known-good repo
  -> local clone
  -> commit one controlled defect in src/e1_boundary.rs
  -> p1 TEST observes cargo-test failure and returns r0
  -> p0 PATCH executes nothing; defect remains
  -> p1 PATCH applies one tracked-file reverse diff
  -> git diff --check PASS
  -> p1 TEST returns exit=0 and r0
  -> repaired file matches the known-good parent exactly
```

The controlled defect changes the expected `vortex_width_8n(1)` result from `Some(8)` to `Some(7)`. The worker must observe the failing suite before repair, must not cut under `p0`, and may repair only under `p1`. The first version of this test intentionally exposed an invalid reverse-diff shape (`b/file -> a/file`); the workspace correctly vetoed it. The proof was corrected to generate a normal `a/file -> b/file` repair patch without weakening the workspace policy.

Successful proof marker:

```text
I13_SURGICAL_SELF_REPAIR_OK=1
```

`i13/e1-tech-trit` remains independently green; a TECH trit and a workspace receipt are separate evidence layers.

## Scope

This is the first real coding-workspace attachment. It does not yet:

- choose a repository automatically;
- synthesize a patch from natural language by itself;
- create/delete/rename files;
- commit or push;
- provide arbitrary shell execution;
- claim OS process or network isolation.

Those remain separate capabilities and must not be smuggled into `p1`.
