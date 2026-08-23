"""Deterministic conservation witness for the two-universe M-gate conflict."""
from dataclasses import dataclass
from itertools import permutations

@dataclass(frozen=True)
class Result:
    delivered_l: float
    delivered_r: float
    diverted: float
    vacant: float
    imbalance: float

def generation(demand_l: float, demand_r: float, rebels_l: int, rebels_r: int) -> Result:
    if not (0 <= demand_l <= 1 and 0 <= demand_r <= 1):
        raise ValueError("demands must be within [0,1]")
    if rebels_l not in range(4) or rebels_r not in range(4):
        raise ValueError("rebel counts must be within [0,3]")
    vacant = max(0.0, 1.0 - max(demand_l, demand_r)) * 0.1
    available = 1.0 - vacant
    score_l = max(0.0001, demand_l * (1 + rebels_l * 0.18))
    score_r = max(0.0001, demand_r * (1 + rebels_r * 0.18))
    allocated_l = available * score_l / (score_l + score_r)
    allocated_r = available - allocated_l
    diverted_l = allocated_l * (rebels_l / 3) * 0.22
    diverted_r = allocated_r * (rebels_r / 3) * 0.22
    delivered_l = allocated_l - diverted_l
    delivered_r = allocated_r - diverted_r
    diverted = diverted_l + diverted_r
    return Result(delivered_l, delivered_r, diverted, vacant, abs(delivered_l-delivered_r))

def verify() -> dict[str, float | bool]:
    maximum_error = 0.0
    bounded = True
    cases = 0
    for dl_i in range(101):
        for dr_i in range(101):
            for rl in range(4):
                for rr in range(4):
                    result = generation(dl_i/100, dr_i/100, rl, rr)
                    total = result.delivered_l + result.delivered_r + result.diverted + result.vacant
                    maximum_error = max(maximum_error, abs(total-1))
                    bounded &= all(0 <= x <= 1 for x in result.__dict__.values())
                    cases += 1
    channel = tuple("".join(p) for p in permutations("ABC"))
    return {"cases": cases, "maximum_conservation_error": maximum_error, "bounded": bounded,
            "three_dot_permutations": len(channel), "channel_unique": len(set(channel)) == 6}

if __name__ == "__main__":
    for key, value in verify().items():
        print(f"{key}: {value}")
