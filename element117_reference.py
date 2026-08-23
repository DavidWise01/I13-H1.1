"""Deterministic first-decay witness for 294Ts."""
import math, random, statistics

Z, A = 117, 294
HALF_LIFE_MS = 70.0

def daughter_after_alpha(z=Z, a=A):
    return z - 2, a - 4

def run(count=100_000, seed=117294):
    rng = random.Random(seed)
    decay_constant = math.log(2) / HALF_LIFE_MS
    times = [-math.log1p(-rng.random()) / decay_constant for _ in range(count)]
    survive_half = sum(t > HALF_LIFE_MS for t in times) / count
    return {
        "parent": (Z, A),
        "daughter": daughter_after_alpha(),
        "sample_count": count,
        "median_ms": statistics.median(times),
        "mean_ms": statistics.mean(times),
        "survival_at_half_life": survive_half,
        "expected_mean_ms": 1 / decay_constant,
    }

if __name__ == "__main__":
    for key, value in run().items():
        print(f"{key}: {value}")
