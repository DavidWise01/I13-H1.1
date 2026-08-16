#!/usr/bin/env python3
"""Stage 12 VH2 erasure-correctability check.

This is an added H1.1 validation, separate from the preserved VH2 10/10 report.
For the [[5,1,3]] code basis from reference/vh2/vh2_cubi_test.py, every
2-qubit erased subsystem must carry no logical information. Equivalently,
for every pair E:
  rho_E(|0L>) == rho_E(|1L>)
  Tr_complement(|0L><1L|) == 0
This is the standard code-space decoupling criterion for correctable erasure.
"""
from __future__ import annotations

import importlib.util
import itertools
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "reference" / "vh2" / "vh2_cubi_test.py"

spec = importlib.util.spec_from_file_location("vh2_cubi_test", SRC)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load {SRC}")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def reduced_cross(a: np.ndarray, b: np.ndarray, keep: tuple[int, ...]) -> np.ndarray:
    """Traces out all qubits except `keep` from |a><b|."""
    n = 5
    rest = tuple(i for i in range(n) if i not in keep)
    perm = keep + rest
    shape = (2,) * n
    a_tensor = np.asarray(a, dtype=complex).reshape(shape).transpose(perm)
    b_tensor = np.asarray(b, dtype=complex).reshape(shape).transpose(perm)
    left = 2 ** len(keep)
    right = 2 ** len(rest)
    a_matrix = a_tensor.reshape(left, right)
    b_matrix = b_tensor.reshape(left, right)
    return a_matrix @ b_matrix.conj().T


def run(tol: float = 1e-10):
    _, zero, one = mod.code_basis()
    pairs = list(itertools.combinations(range(5), 2))
    results = []
    worst_diag = 0.0
    worst_off = 0.0

    for pair in pairs:
        rho0 = reduced_cross(zero, zero, pair)
        rho1 = reduced_cross(one, one, pair)
        cross = reduced_cross(zero, one, pair)
        diag_delta = float(np.max(np.abs(rho0 - rho1)))
        off_delta = float(np.max(np.abs(cross)))
        ok = diag_delta <= tol and off_delta <= tol
        worst_diag = max(worst_diag, diag_delta)
        worst_off = max(worst_off, off_delta)
        results.append({
            "erased": pair,
            "pass": ok,
            "rho_delta": diag_delta,
            "cross_max": off_delta,
        })

    return {
        "pairs": len(pairs),
        "passed": sum(r["pass"] for r in results),
        "pass": all(r["pass"] for r in results),
        "worst_rho_delta": worst_diag,
        "worst_cross_max": worst_off,
        "results": results,
    }


if __name__ == "__main__":
    report = run()
    for item in report["results"]:
        q0, q1 = item["erased"]
        print(
            f"{'PASS' if item['pass'] else 'FAIL'} erase q{q0},q{q1} "
            f"rho_delta={item['rho_delta']:.3e} cross={item['cross_max']:.3e}"
        )
    print(
        f"TOTAL: {report['passed']}/{report['pairs']} PASS · "
        f"worst_rho_delta={report['worst_rho_delta']:.3e} · "
        f"worst_cross={report['worst_cross_max']:.3e}"
    )
    raise SystemExit(0 if report["pass"] else 1)
