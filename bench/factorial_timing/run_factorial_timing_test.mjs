import { createHash } from "node:crypto";
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const factorial = (n) => {
  let value = 1n;
  for (let i = 2n; i <= n; i++) value *= i;
  return value;
};

const BASE = factorial(9n);
const CAPACITY = BASE ** 5n;

function unrankPermutation(rank) {
  let cursor = BigInt(rank);
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const output = [];
  for (let size = 9; size >= 1; size--) {
    const radix = factorial(BigInt(size - 1));
    const index = Number(cursor / radix);
    cursor %= radix;
    output.push(pool.splice(index, 1)[0]);
  }
  return output;
}
function rankPermutation(permutation) {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  let rank = 0n;
  for (let i = 0; i < 9; i++) {
    const index = pool.indexOf(permutation[i]);
    if (index < 0) throw new Error("INVALID_PERMUTATION");
    rank += BigInt(index) * factorial(BigInt(8 - i));
    pool.splice(index, 1);
  }
  return rank;
}
function unrankCycle(rank) {
  let cursor = BigInt(rank);
  const lanes = [];
  for (let lane = 0; lane < 5; lane++) {
    lanes.push(cursor % BASE);
    cursor /= BASE;
  }
  if (cursor !== 0n) throw new Error("CYCLE_OUT_OF_RANGE");
  return lanes;
}
function rankCycle(lanes) {
  return lanes.reduceRight((rank, digit) => rank * BASE + digit, 0n);
}

const samples = [
  0n, 1n, BASE - 1n, BASE, BASE ** 2n + 12345n,
  CAPACITY / 2n, CAPACITY - 2n, CAPACITY - 1n,
];
let cycleRankUnrankPasses = 0;
let lanePermutationPasses = 0;
for (const sample of samples) {
  const lanes = unrankCycle(sample);
  if (rankCycle(lanes) === sample) cycleRankUnrankPasses++;
  for (const lane of lanes) {
    const permutation = unrankPermutation(lane);
    if (
      rankPermutation(permutation) === lane &&
      new Set(permutation).size === 9
    ) lanePermutationPasses++;
  }
}

const boundary = [-1, 1, 1, -1];
const normalized = 2n ** 35n * 3n ** 20n * 5n ** 5n * 7n ** 5n;
const gates = {
  factorial9: BASE === 362880n,
  exactCapacity: CAPACITY === 6292383221978976013516800000n,
  primeNormalization: CAPACITY === normalized,
  exactDigits: CAPACITY.toString().length === 28,
  boundaryBalanced:
    boundary.reduce((a, b) => a + b, 0) === 0 &&
    boundary.reduce((a, b) => a * b, 1) === 1,
  cycleRankUnrank: cycleRankUnrankPasses === samples.length,
  lanePermutationRankUnrank: lanePermutationPasses === samples.length * 5,
  maximumAddress: rankCycle(Array(5).fill(BASE - 1n)) === CAPACITY - 1n,
};

const core = {
  schema: "i13-five-lane-9factorial-timing-v1",
  lanes: 5,
  eventsPerLane: 9,
  permutationsPerLane: BASE.toString(),
  exactCycles: CAPACITY.toString(),
  primeForm: "2^35 * 3^20 * 5^5 * 7^5",
  digits: CAPACITY.toString().length,
  boundary: "-++-",
  rankSamples: samples.length,
  lanePermutationSamples: samples.length * 5,
  gatesPassed: Object.values(gates).filter(Boolean).length,
  gatesTotal: Object.keys(gates).length,
  status: Object.values(gates).every(Boolean) ? "PASS" : "FAIL",
};
console.log(JSON.stringify({
  ...core, gates, sha256: sha256(JSON.stringify(core)),
}, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
