"""Exact NumPy witness for the CVC-Y2A M_6040 gate."""
import numpy as np

PORTS = ("IN", "OCCUPIED", "OUT", "VACANT")
C4 = np.roll(np.eye(4, dtype=complex), 1, axis=0)
D6040 = np.diag(np.exp(1j * np.array([3*np.pi/4, 0, np.pi/2, 0])))
U = C4 @ D6040
M6040 = np.block([
    [U, np.zeros((4, 4), dtype=complex)],
    [np.zeros((4, 4), dtype=complex), U.conj().T],
])

def verify(atol: float = 1e-12) -> dict[str, float | bool]:
    identity = np.eye(8)
    residual = float(np.max(np.abs(M6040.conj().T @ M6040 - identity)))
    fourth = np.linalg.matrix_power(M6040, 4)
    return {
        "shape_8x8": M6040.shape == (8, 8),
        "unitarity_residual": residual,
        "unitary": residual <= atol,
        "determinant_magnitude": float(abs(np.linalg.det(M6040))),
        "eigenvalue_radius_residual": float(np.max(np.abs(np.abs(np.linalg.eigvals(M6040)) - 1))),
        "four_pulse_port_return": bool(np.max(np.abs(fourth - np.diag(np.diag(fourth)))) <= atol),
    }

if __name__ == "__main__":
    for key, value in verify().items():
        print(f"{key}: {value}")
