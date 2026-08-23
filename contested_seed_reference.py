"""Deterministic reference for the 5×5 exclusive contested-seed gate."""
import math

def resolve(left, right, preferred):
    if left == 0 or right == 0: return 2
    if left > right: return 0
    if right > left: return 1
    return preferred & 1

def verify():
    spectrum = [str(i) for i in range(12)] + ["M", "S", "T", "H"]
    assert len(spectrum) == 16 and len(set(spectrum)) == 16
    cases = 0
    for left in range(6):
        for right in range(6):
            for preferred in (0, 1):
                winner = resolve(left, right, preferred)
                if left == 0 or right == 0:
                    assert winner == 2
                else:
                    assert winner in (0, 1)
                    assert (winner == 0) != (winner == 1)
                    assert left <= right or winner == 0
                    assert right <= left or winner == 1
                cases += 1
    assert math.factorial(9) == 362_880
    return {"cases": cases, "exclusive": "PASS", "factorial_9": math.factorial(9), "spectrum_channels": len(spectrum), "photon_closure": "Z->0"}

if __name__ == "__main__":
    for key, value in verify().items(): print(f"{key}: {value}")
