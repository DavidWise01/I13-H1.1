#!/usr/bin/env python3
"""VH1 frozen reference runtime — stdlib only.

Implements the frozen ternary profile:
  base = 3
  depth 0..4
  width = 3**depth
  factored Hermitian Hamiltonian action without dense W x W materialization.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from itertools import product
from typing import Sequence, Iterable
import math

FREEZE_ID = "VH1"
BASE = 3
MAX_DEPTH = 4
ISA = "vh1.ternary.hamiltonian/1"
DECODER = "vh1.basis.decoder/1"
MODULE = "vh1.factored.linear/1"
TOL = 1e-10


def width(depth: int) -> int:
    if not isinstance(depth, int):
        raise TypeError("VH1 depth must be an integer")
    if depth < 0 or depth > MAX_DEPTH:
        raise ValueError(f"VH1 depth must be 0..{MAX_DEPTH}")
    return BASE ** depth


def basis(depth: int):
    width(depth)
    if depth == 0:
        return [()]
    return list(product(range(BASE), repeat=depth))


def digits_to_index(digits: Sequence[int]) -> int:
    idx = 0
    for d in digits:
        if d not in (0, 1, 2):
            raise ValueError("VH1 basis digit must be 0, 1, or 2")
        idx = idx * BASE + d
    return idx


def index_to_digits(index: int, depth: int):
    w = width(depth)
    if index < 0 or index >= w:
        raise IndexError(index)
    out = [0] * depth
    x = index
    for i in range(depth - 1, -1, -1):
        out[i] = x % BASE
        x //= BASE
    return tuple(out)


def _square_matrix(m, size: int):
    if len(m) != size or any(len(r) != size for r in m):
        raise ValueError(f"expected {size}x{size} matrix")
    return [[complex(x) for x in row] for row in m]


def is_hermitian(m, tol: float = TOL) -> bool:
    n = len(m)
    if any(len(r) != n for r in m):
        return False
    for i in range(n):
        for j in range(n):
            if abs(complex(m[i][j]) - complex(m[j][i]).conjugate()) > tol:
                return False
    return True


def norm2(v: Sequence[complex]) -> float:
    return float(sum((complex(x).real**2 + complex(x).imag**2) for x in v))


def inner(a: Sequence[complex], b: Sequence[complex]) -> complex:
    if len(a) != len(b):
        raise ValueError("inner-product dimension mismatch")
    return sum(complex(x).conjugate() * complex(y) for x, y in zip(a, b))


def apply_local(state: Sequence[complex], depth: int, site: int, op):
    w = width(depth)
    if len(state) != w:
        raise ValueError(f"state length {len(state)} != width {w}")
    if depth == 0:
        raise ValueError("local operator requires depth >= 1")
    if site < 0 or site >= depth:
        raise IndexError(site)
    op = _square_matrix(op, 3)
    out = [0j] * w
    for idx, amp in enumerate(state):
        amp = complex(amp)
        if amp == 0:
            continue
        digs = list(index_to_digits(idx, depth))
        src = digs[site]
        for dst_digit in range(3):
            coeff = op[dst_digit][src]
            if coeff == 0:
                continue
            nd = digs.copy(); nd[site] = dst_digit
            out[digits_to_index(nd)] += coeff * amp
    return out


def apply_pair(state: Sequence[complex], depth: int, site_a: int, site_b: int, op):
    w = width(depth)
    if len(state) != w:
        raise ValueError(f"state length {len(state)} != width {w}")
    if depth < 2:
        raise ValueError("pair operator requires depth >= 2")
    if site_a == site_b or min(site_a, site_b) < 0 or max(site_a, site_b) >= depth:
        raise IndexError((site_a, site_b))
    op = _square_matrix(op, 9)
    out = [0j] * w
    for idx, amp in enumerate(state):
        amp = complex(amp)
        if amp == 0:
            continue
        digs = list(index_to_digits(idx, depth))
        src = digs[site_a] * 3 + digs[site_b]
        for dst_pair in range(9):
            coeff = op[dst_pair][src]
            if coeff == 0:
                continue
            nd = digs.copy()
            nd[site_a], nd[site_b] = divmod(dst_pair, 3)
            out[digits_to_index(nd)] += coeff * amp
    return out


def kron(a, b):
    return [[complex(x) * complex(y) for x in ra for y in rb] for ra in a for rb in b]


@dataclass(frozen=True)
class LocalTerm:
    site: int
    op: tuple
    coefficient: float = 1.0

    @staticmethod
    def make(site, op, coefficient=1.0):
        m = _square_matrix(op, 3)
        if not is_hermitian(m):
            raise ValueError("local term must be Hermitian")
        if abs(complex(coefficient).imag) > TOL:
            raise ValueError("Hermitian term coefficient must be real")
        return LocalTerm(site, tuple(tuple(x for x in r) for r in m), float(complex(coefficient).real))


@dataclass(frozen=True)
class PairTerm:
    site_a: int
    site_b: int
    op: tuple
    coefficient: float = 1.0

    @staticmethod
    def make(site_a, site_b, op, coefficient=1.0):
        m = _square_matrix(op, 9)
        if not is_hermitian(m):
            raise ValueError("pair term must be Hermitian")
        if abs(complex(coefficient).imag) > TOL:
            raise ValueError("Hermitian term coefficient must be real")
        return PairTerm(site_a, site_b, tuple(tuple(x for x in r) for r in m), float(complex(coefficient).real))


@dataclass
class Hamiltonian:
    depth: int
    local_terms: list[LocalTerm] = field(default_factory=list)
    pair_terms: list[PairTerm] = field(default_factory=list)

    def __post_init__(self):
        width(self.depth)

    @property
    def dimension(self):
        return width(self.depth)

    @property
    def dense_shape(self):
        return (self.dimension, self.dimension)

    def add_local(self, site, op, coefficient=1.0):
        if site < 0 or site >= self.depth:
            raise IndexError(site)
        self.local_terms.append(LocalTerm.make(site, op, coefficient))
        return self

    def add_pair(self, site_a, site_b, op, coefficient=1.0):
        if site_a == site_b or min(site_a, site_b) < 0 or max(site_a, site_b) >= self.depth:
            raise IndexError((site_a, site_b))
        self.pair_terms.append(PairTerm.make(site_a, site_b, op, coefficient))
        return self

    def apply(self, state: Sequence[complex]):
        w = self.dimension
        if len(state) != w:
            raise ValueError(f"state length {len(state)} != width {w}")
        out = [0j] * w
        for term in self.local_terms:
            part = apply_local(state, self.depth, term.site, term.op)
            for i, x in enumerate(part): out[i] += term.coefficient * x
        for term in self.pair_terms:
            part = apply_pair(state, self.depth, term.site_a, term.site_b, term.op)
            for i, x in enumerate(part): out[i] += term.coefficient * x
        return out

    def expectation(self, state: Sequence[complex]):
        hv = self.apply(state)
        return inner(state, hv)


class CortexVH1:
    """Bounded ephemeral child executor for the VH1 profile."""
    def __init__(self):
        self._active_children = 0
        self._next_child = 1

    @property
    def active_children(self):
        return self._active_children

    def execute(self, depth: int, state: Sequence[complex], hamiltonian: Hamiltonian):
        w = width(depth)
        if hamiltonian.depth != depth:
            raise ValueError("Hamiltonian depth differs from Cortex depth")
        if len(state) != w:
            raise ValueError("state width differs from Cortex width")
        child_id = self._next_child; self._next_child += 1
        self._active_children += 1
        try:
            machine = {"isa": ISA, "decoder": DECODER, "module": MODULE}
            result = hamiltonian.apply(state)
            witness = {
                "input_norm2": norm2(state),
                "output_norm2": norm2(result),
                "expectation": hamiltonian.expectation(state),
                "hermitian_terms": True,
            }
            receipt = {
                "freeze": FREEZE_ID,
                "child_id": child_id,
                "base": BASE,
                "depth": depth,
                "width": w,
                "machine": machine,
                "dense_shape": hamiltonian.dense_shape,
                "dense_materialized": False,
                "result": result,
                "witness": witness,
                "terminated": True,
            }
            return receipt
        finally:
            self._active_children -= 1


# Frozen reference qutrit operators.
I3 = [[1,0,0],[0,1,0],[0,0,1]]
Z3 = [[-1,0,0],[0,0,0],[0,0,1]]
X3 = [[0,1,0],[1,0,1],[0,1,0]]
ZZ9 = kron(Z3, Z3)


def demo(depth=4):
    w = width(depth)
    state = [0j] * w
    state[0] = 1+0j
    h = Hamiltonian(depth)
    for s in range(depth):
        h.add_local(s, Z3, coefficient=0.25*(s+1))
    for s in range(max(0, depth-1)):
        h.add_pair(s, s+1, ZZ9, coefficient=0.1)
    rt = CortexVH1()
    return rt.execute(depth, state, h)


if __name__ == "__main__":
    r = demo(4)
    print(f"{r['freeze']} depth={r['depth']} width={r['width']} H={r['dense_shape'][0]}x{r['dense_shape'][1]} factored={not r['dense_materialized']} terminated={r['terminated']}")
    print("expectation=", r["witness"]["expectation"])
