import { createHash } from "node:crypto";
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const BASE = 362880n;
const CAPACITY = BASE ** 5n;

const lanes = (rank) => {
  let cursor = ((rank % CAPACITY) + CAPACITY) % CAPACITY;
  const output = [];
  for (let lane = 0; lane < 5; lane++) {
    output.push(cursor % BASE);
    cursor /= BASE;
  }
  return output;
};
const rank = (digits) =>
  digits.reduceRight((value, digit) => value * BASE + digit, 0n);
const step = (value, direction) =>
  ((value + BigInt(direction)) % CAPACITY + CAPACITY) % CAPACITY;

const receipts = new Set();
const surfaces = [];
let carryPass = 0;
let reversePass = 0;
let rangePass = 0;

for (let depth = 1; depth <= 5; depth++) {
  const before = BASE ** BigInt(depth) - 1n;
  const after = step(before, 1);
  const beforeLanes = lanes(before);
  const afterLanes = lanes(after);
  const carry = beforeLanes.filter(
    (digit, lane) => lane < depth && digit === BASE - 1n
  ).length;
  const expectedAfter =
    depth === 5 ? 0n : BASE ** BigInt(depth);

  if (carry === depth && after === expectedAfter && rank(afterLanes) === after)
    carryPass++;
  if (step(after, -1) === before) reversePass++;
  if (after >= 0n && after < CAPACITY) rangePass++;

  const record = {
    depth,
    before: before.toString(),
    after: after.toString(),
    carry,
    wrap: depth === 5,
  };
  receipts.add(sha256(JSON.stringify(record)));
  surfaces.push(record);
}

const samples = [
  0n, 1n, BASE - 1n, BASE,
  BASE ** 2n - 1n, BASE ** 3n - 1n, BASE ** 4n - 1n,
  CAPACITY - 1n, CAPACITY / 2n,
];
let shellPass = 0;
for (const sample of samples) {
  let value = sample;
  for (const direction of [-1, 1, 1, -1])
    value = step(value, direction);
  if (value === sample) shellPass++;
  receipts.add(sha256(JSON.stringify({
    shell: sample.toString(), closed: value === sample,
  })));
}

const gates = {
  allCarryDepths: carryPass === 5,
  allReverse: reversePass === 5,
  fullWrap: surfaces[4].after === "0",
  allInRange: rangePass === 5,
  shellClosure: shellPass === samples.length,
  rankUnrankAtSurfaces: surfaces.every(
    ({ after }) => rank(lanes(BigInt(after))) === BigInt(after)
  ),
  uniqueReceipts: receipts.size === 14,
  capacityPreserved:
    CAPACITY === 6292383221978976013516800000n,
};
const core = {
  schema: "i13-factorial-timing-carry-wrap-v1",
  base: BASE.toString(),
  lanes: 5,
  capacity: CAPACITY.toString(),
  carrySurfaces: 5,
  carryPass,
  reversePass,
  fullWraps: surfaces.filter(({ wrap, after }) => wrap && after === "0").length,
  shellSamples: samples.length,
  shellPass,
  uniqueReceipts: receipts.size,
  gatesPassed: Object.values(gates).filter(Boolean).length,
  gatesTotal: Object.keys(gates).length,
  status: Object.values(gates).every(Boolean) ? "PASS" : "FAIL",
};
console.log(JSON.stringify({
  ...core, surfaces, gates, sha256: sha256(JSON.stringify(core)),
}, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
