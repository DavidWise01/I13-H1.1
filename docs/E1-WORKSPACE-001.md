# E1.WORKSPACE-001 — Offline Git Coding Workspace

Status: **BUILD CANDIDATE · NATIVE HOST ONLY · NON-RIVER**

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

## Scope

This is the first real coding-workspace attachment. It does not yet:

- choose a repository automatically;
- synthesize a patch from natural language by itself;
- create/delete/rename files;
- commit or push;
- provide arbitrary shell execution;
- claim OS process or network isolation.

Those remain separate capabilities and must not be smuggled into `p1`.
