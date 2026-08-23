"""Numerical witness for the E/W/N/S inverted-mirror projector."""
import math
import random
import numpy as np

J = np.array([[0,-1,0,0],[-1,0,0,0],[0,0,0,-1],[0,0,-1,0]], dtype=float)

def channels(e_amplitude, e_phase, e_spin, n_amplitude, n_phase, n_spin):
    east = np.array([e_amplitude*math.cos(e_phase), 0, e_amplitude*math.sin(e_phase)])
    north = np.array([0, n_amplitude*math.cos(n_phase), n_amplitude*math.sin(n_phase)])
    return {"E": east, "W": -east, "N": north, "S": -north}, (e_spin,-e_spin,n_spin,-n_spin)

def controller(threat, coherence, wall):
    g1 = "HIDE" if threat > coherence else "ASSIMILATE"
    g2 = "EXPAND" if coherence > threat + 20 else "COLLAPSE"
    g3 = "MOVE" if wall != 27 or g2 == "EXPAND" else "WAIT"
    mode = "FLIGHT" if (g1, g2, g3) == ("HIDE", "COLLAPSE", "WAIT") else "COUPLED"
    return g1, g2, g3, mode

def verify_controller():
    observed = set()
    cases = 0
    for threat in range(101):
        for coherence in range(101):
            for wall in (0, 27):
                g1, g2, g3, mode = controller(threat, coherence, wall)
                assert (g1 == "HIDE") == (threat > coherence)
                assert (g2 == "EXPAND") == (coherence > threat + 20)
                assert (g3 == "WAIT") == (wall == 27 and g2 != "EXPAND")
                assert (mode == "FLIGHT") == ((g1, g2, g3) == ("HIDE", "COLLAPSE", "WAIT"))
                observed.update((g1, g2, g3, mode))
                cases += 1
    required = {"HIDE", "ASSIMILATE", "COLLAPSE", "EXPAND", "WAIT", "MOVE", "FLIGHT", "COUPLED"}
    assert required <= observed
    return {"controller_cases": cases, "controller_branches": len(required)}

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
    results = verify() | verify_controller()
    for key,value in results.items(): print(f"{key}: {value}")
