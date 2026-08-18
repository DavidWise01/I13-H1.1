#!/usr/bin/env python3
"""Harbor external-agent adapter for the current bounded I13 TECH/WORKSPACE surface.

This adapter intentionally does not grant new host capabilities just to improve a
benchmark score. It maps the current I13 workspace contract into a Harbor task:

- inspect current working directory / Git root
- read Git HEAD
- git status
- git diff
- return a trit receipt

No reflog, branch creation, merge, reset, checkout, commit, push, arbitrary shell
repair, or direct .git inspection is performed by this v0.1 adapter.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from harbor.agents.base import BaseAgent
from harbor.environments.base import BaseEnvironment
from harbor.models.agent.context import AgentContext


class I13HarborAgent(BaseAgent):
    SUPPORTS_ATIF = False

    @staticmethod
    def name() -> str:
        return "i13-tech-workspace"

    def version(self) -> str | None:
        return "0.1.0"

    async def setup(self, environment: BaseEnvironment) -> None:
        return

    async def _exec(self, environment: BaseEnvironment, command: str) -> dict[str, Any]:
        result = await environment.exec(command=command)
        return {
            "command": command,
            "return_code": int(result.return_code),
            "stdout": str(result.stdout or "")[-16384:],
            "stderr": str(result.stderr or "")[-16384:],
        }

    async def run(
        self,
        instruction: str,
        environment: BaseEnvironment,
        context: AgentContext,
    ) -> None:
        trace: dict[str, Any] = {
            "module": "E1.BENCH-001",
            "agent": self.name(),
            "version": self.version(),
            "instruction": instruction,
            "commands": [],
            "boundary": {
                "allowed": ["git-root", "head", "status", "diff"],
                "denied": [
                    "direct-.git",
                    "reflog",
                    "branch-create",
                    "merge",
                    "reset",
                    "checkout",
                    "commit",
                    "push",
                    "arbitrary-shell-repair",
                ],
            },
        }

        # These mirror operations already present in E1.WORKSPACE-001.
        for command in [
            "pwd",
            "git rev-parse --show-toplevel",
            "git rev-parse HEAD",
            "git status --porcelain=v1 --untracked-files=all",
            "git diff --no-ext-diff --no-color",
        ]:
            trace["commands"].append(await self._exec(environment, command))

        status = trace["commands"][3]
        diff = trace["commands"][4]
        visible_change = bool(status["stdout"].strip() or diff["stdout"].strip())

        # Current I13 has no bounded Git-history recovery/merge capability. The
        # correct control state is therefore p0: unresolved, no mutation.
        trace.update(
            {
                "trit": {"symbol": "p0", "value": 0, "authority": "FLAY"},
                "question_debt": 1,
                "executed_mutation": False,
                "visible_worktree_change": visible_change,
                "reason": "task requires Git history recovery/merge capability outside current E1.WORKSPACE-001 surface",
                "r0": 1,
            }
        )

        self.logs_dir.mkdir(parents=True, exist_ok=True)
        (self.logs_dir / "i13-bench-trace.json").write_text(
            json.dumps(trace, indent=2, sort_keys=True), encoding="utf-8"
        )

        # Model-free adapter: no token usage.
        if hasattr(context, "n_input_tokens"):
            context.n_input_tokens = 0
        if hasattr(context, "n_output_tokens"):
            context.n_output_tokens = 0
        if hasattr(context, "n_cache_tokens"):
            context.n_cache_tokens = 0


__all__ = ["I13HarborAgent"]
