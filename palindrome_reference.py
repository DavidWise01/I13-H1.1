"""Reference witness for the reversible five-node palindrome schedule."""
import random

def run(rounds=2048, seed=60406040):
    rng=random.Random(seed); keys=[rng.getrandbits(32) for _ in range(rounds)]
    state=0x49313337; origin=state
    for key in keys: state ^= key
    apex=state
    for key in reversed(keys): state ^= key
    return {"rounds":rounds,"origin":origin,"apex":apex,"return":state,"identity":state==origin,"five_factorial":120,"capacity_law":"(n*n)^((9!)^91)"}

if __name__=="__main__":
    for k,v in run().items(): print(f"{k}: {v}")
