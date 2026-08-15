#!/usr/bin/env python3
"""
VH2 CUBI hypothesis test

Tests the hierarchical interpretation:

    ternary controller (3 classical/control modes)
              ↓
      [[5,1,3]] perfect code
              ↓
        5 physical qubits

It also proves that the same [[5,1,3]] block cannot hold a 3-state
logical quantum basis: its code-space dimension is exactly 2.
"""
import numpy as np
import json

I2 = np.eye(2, dtype=complex)
X  = np.array([[0,1],[1,0]], dtype=complex)
Y  = np.array([[0,-1j],[1j,0]], dtype=complex)
Z  = np.array([[1,0],[0,-1]], dtype=complex)
P1 = {"I":I2, "X":X, "Y":Y, "Z":Z}

def kron_word(word):
    out = np.array([[1]], dtype=complex)
    for c in word:
        out = np.kron(out, P1[c])
    return out

# Standard cyclic generators of the five-qubit perfect code.
STAB_WORDS = ["XZZXI", "IXZZX", "XIXZZ", "ZXIXZ"]
STABS = [kron_word(w) for w in STAB_WORDS]
XL = kron_word("XXXXX")
ZL = kron_word("ZZZZZ")
ID32 = np.eye(32, dtype=complex)

def projector():
    P = ID32.copy()
    for g in STABS:
        P = P @ ((ID32 + g) / 2)
    return P

def code_basis():
    P = projector()
    vals, vecs = np.linalg.eigh(P)
    V = vecs[:, vals > 0.5]  # code-space basis, expected dimension 2
    # Diagonalize logical Z within the code space to get |0L>, |1L>.
    z_small = V.conj().T @ ZL @ V
    zvals, U = np.linalg.eigh(z_small)
    W = V @ U
    # +1 eigenstate of ZL = |0L>, -1 = |1L>
    idx0 = int(np.argmax(zvals))
    idx1 = int(np.argmin(zvals))
    zero = W[:, idx0]
    one  = W[:, idx1]
    # phase-align X_L |0L> with |1L>
    amp = np.vdot(one, XL @ zero)
    if abs(amp) > 1e-12:
        one = one * np.exp(1j*np.angle(amp))
    return P, zero/np.linalg.norm(zero), one/np.linalg.norm(one)

def syndrome(E):
    bits=[]
    for g in STABS:
        # commute => +1 => 0; anticommute => -1 => 1
        a = g @ E
        b = E @ g
        bits.append(0 if np.allclose(a,b,atol=1e-10) else 1)
    return tuple(bits)

def physical_error(qubit, pauli):
    chars=["I"]*5
    chars[qubit]=pauli
    return kron_word("".join(chars))

def fidelity(a,b):
    return float(abs(np.vdot(a,b))**2)

def run():
    P, zero, one = code_basis()
    report = {"tests":[], "details":{}}
    def test(name, ok, detail):
        report["tests"].append({"name":name,"pass":bool(ok),"detail":detail})

    rank = int(np.sum(np.linalg.eigvalsh(P) > 0.5))
    test("code-space dimension is 2", rank == 2, f"rank(P)={rank}")
    test("five physical qubits", P.shape == (32,32), "Hilbert dimension=2^5=32")
    test("logical basis orthogonal", abs(np.vdot(zero,one)) < 1e-10, f"<0L|1L>={np.vdot(zero,one)}")
    test("logical X maps |0L> to |1L>", fidelity(XL@zero, one) > 1-1e-10, f"F={fidelity(XL@zero,one):.12f}")
    test("logical Z eigenvalues", np.allclose(ZL@zero,zero,atol=1e-10) and np.allclose(ZL@one,-one,atol=1e-10), "ZL|0L>=+|0L>, ZL|1L>=-|1L>")

    errors=[]
    syndromes={}
    collision=False
    for q in range(5):
        for p in "XYZ":
            E=physical_error(q,p)
            s=syndrome(E)
            label=f"{p}{q}"
            if s in syndromes:
                collision=True
            syndromes[s]=label
            errors.append((label,E,s))
    test("15 single-qubit Pauli syndromes unique", len(syndromes)==15 and not collision, f"unique={len(syndromes)}/15")
    test("all nonzero syndromes used", (0,0,0,0) not in syndromes and len(syndromes)==15, "15 nonzero four-bit syndromes")

    # Deterministic arbitrary logical state.
    alpha = np.sqrt(0.37)
    beta = np.sqrt(0.63) * np.exp(0.31j)
    psi = alpha*zero + beta*one
    psi /= np.linalg.norm(psi)

    recovery_ok=True
    worst=1.0
    for label,E,s in errors:
        damaged=E@psi
        correction=None
        for lab2,E2,s2 in errors:
            if s2==s:
                correction=E2
                break
        recovered=correction@damaged
        F=fidelity(psi,recovered)
        worst=min(worst,F)
        if F < 1-1e-9:
            recovery_ok=False
    test("corrects every single-qubit Pauli error", recovery_ok, f"worst recovery fidelity={worst:.12f}")

    # Ternary controller is EXTERNAL metadata/control, not a qutrit encoded in the block.
    # Mode 0 = logical identity, 1 = logical X, 2 = logical Z.
    controller = {0:ID32, 1:XL, 2:ZL}
    ctrl_ok=True
    ctrl_details={}
    for mode,Ulog in controller.items():
        target=Ulog@psi
        # add one representative physical error, then syndrome-correct it
        E=physical_error(3,"Y")
        s=syndrome(E)
        correction=next(E2 for _,E2,s2 in errors if s2==s)
        out=correction@(E@target)
        F=fidelity(target,out)
        ctrl_details[str(mode)]=F
        if F < 1-1e-9:
            ctrl_ok=False
    test("3-mode ternary controller can govern protected logical operations", ctrl_ok, f"mode fidelities={ctrl_details}")

    # Prove ternary QUANTUM encoding does not fit this code space.
    # A 3-level logical quantum state requires at least a 3D encoded subspace.
    ternary_quantum_fits = rank >= 3
    test("ternary quantum state does NOT fit [[5,1,3]] code space", not ternary_quantum_fits, f"required rank>=3, actual rank={rank}")

    report["details"].update({
        "physical_qubits":5,
        "physical_hilbert_dimension":32,
        "logical_qubits":1,
        "code_distance":3,
        "code_space_dimension":rank,
        "ternary_controller_modes":3,
        "ternary_controller_semantics":{
            "0":"logical identity",
            "1":"logical X",
            "2":"logical Z"
        },
        "syndrome_map":{"".join(map(str,k)):v for k,v in sorted(syndromes.items())},
        "interpretation":{
            "passes":"3-state controller above a protected [[5,1,3]] logical qubit",
            "fails":"3-state quantum logical basis inside the same [[5,1,3]] block"
        }
    })
    report["passed"]=sum(t["pass"] for t in report["tests"])
    report["total"]=len(report["tests"])
    report["pass"]=report["passed"]==report["total"]
    return report

if __name__=="__main__":
    print(json.dumps(run(), indent=2))
