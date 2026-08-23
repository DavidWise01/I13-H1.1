"""Numerical witness for the E/W/N/S inverted-mirror projector."""
import math
import random
import numpy as np

J = np.array([[0,-1,0,0],[-1,0,0,0],[0,0,0,-1],[0,0,-1,0]], dtype=float)

def channels(e_amplitude, e_phase, e_spin, n_amplitude, n_phase, n_spin):
    east = np.array([e_amplitude*math.cos(e_phase), 0, e_amplitude*math.sin(e_phase)])
    north = np.array([0, n_amplitude*math.cos(n_phase), n_amplitude*math.sin(n_phase)])
    return {"E": east, "W": -east, "N": north, "S": -north}, (e_spin,-e_spin,n_spin,-n_spin)

def verify(trials=100_000, seed=60406040):
    rng=random.Random(seed); max_projection=0.0; max_norm_error=0.0
    for _ in range(trials):
        vectors, spins=channels(rng.random(),rng.uniform(-math.pi,math.pi),rng.choice((-1,1)),rng.random(),rng.uniform(-math.pi,math.pi),rng.choice((-1,1)))
        projection=sum(vectors.values(), np.zeros(3))
        max_projection=max(max_projection,float(np.max(np.abs(projection))))
        max_norm_error=max(max_norm_error,abs(np.linalg.norm(vectors["E"])-np.linalg.norm(vectors["W"])),abs(np.linalg.norm(vectors["N"])-np.linalg.norm(vectors["S"])))
        assert sum(spins)==0
    return {"trials":trials,"max_projection_residual":max_projection,"max_norm_error":max_norm_error,"involution_residual":float(np.max(np.abs(J@J-np.eye(4))))}

if __name__=="__main__":
    for key,value in verify().items(): print(f"{key}: {value}")
