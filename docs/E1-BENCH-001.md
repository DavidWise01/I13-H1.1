# E1.BENCH-001 — First Official Terminal-Bench 2.1 Trial

Status: **VALID SCORED TRIAL · FAIL · 2026-08-18**

This record is intentionally not a pass claim. It captures the first valid run of the current bounded I13 technical-agent surface against an unchanged public industry benchmark task.

## Benchmark contract

```text
benchmark : Terminal-Bench 2.1
dataset   : terminal-bench/terminal-bench-2-1
task      : terminal-bench/fix-git
category  : software-engineering / version-control
difficulty: easy
Harbor    : 0.20.0
attempts  : 1
concurrent: 1
```

The official task asks the agent to recover changes lost after checking out `master` and merge those changes into `master`.

Pinned source provenance used while validating the task identity:

```text
harbor-framework/terminal-bench-2-1
7131e4375048a0e408a8fb404b5f499d726b695b
```

The canonical task name from `tasks/fix-git/task.toml` is:

```text
terminal-bench/fix-git
```

## Agent under test

Harbor adapter:

```text
scripts.harbor_i13_agent:I13HarborAgent
```

The adapter did not widen E1.WORKSPACE-001 for the benchmark. Its available Git observations were limited to the current bounded surface:

```text
pwd
git rev-parse --show-toplevel
git rev-parse HEAD
git status --porcelain=v1 --untracked-files=all
git diff --no-ext-diff --no-color
```

It explicitly did **not** use:

```text
.git direct reads
reflog
branch creation
merge
reset
checkout
commit
push
arbitrary shell repair
```

## Official result

Authoritative run commit:

```text
8dccd57979918bd1f35d13bbe0e726b966253c23
```

GitHub status receipts from that run:

```text
i13/tb21-exact/harness-ok      = success
i13/tb21-exact/reward-0.0      = failure
i13/tb21-exact/trit-p0         = success
i13/tb21-exact/mutated-false   = success
i13/tb21-exact/rc-0            = success
i13/tb21-exact/fix-git         = failure
```

Therefore:

```text
HARNESS VALID       = 1
OFFICIAL REWARD     = 0.0
TASK PASS           = 0
I13 TRIT             = p0
QUESTION STATE       = unresolved
MUTATION             = false
HARBOR PROCESS EXIT  = 0
RETURN                = r0
```

## Interpretation

This is a genuine benchmark failure, not an infrastructure failure.

The task requires Git-history recovery and integration behavior that is outside the current E1.WORKSPACE-001 capability boundary. Current I13 inspected the available working-tree state, did not establish authority to perform the required recovery, returned `p0`, and made no mutation.

That behavior is internally consistent with the trit law but does not satisfy the Terminal-Bench verifier. The benchmark score remains `0.0`.

The result identifies the next concrete capability gap:

```text
p0
 |
 FLAY Git-history problem
 |
 missing bounded capability:
   history inspect / recovery
   + bounded branch/integration operation
 |
 only then may a future p1 attempt re-run fix-git
```

No benchmark-specific oracle or solution was added to I13.

## Reproducible runner

The retained workflow is:

```text
.github/workflows/e1-terminal-bench-fix-git-final.yml
```

Temporary debug and superseded runner workflows used while repairing the harness were removed after the valid scored trial.
