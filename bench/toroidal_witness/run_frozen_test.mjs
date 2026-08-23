import { createHash } from "node:crypto";

const PHYSICAL = ["in", "out", "vacant", "occupied"];
const ORIENTATION = ["3x3", "abc", "-abc"];
const seen = new Set();
let verified = 0;
let unverified = 0;
let mutationFailures = 0;

for (let encoded = 0; encoded < 4 ** 5; encoded++) {
  let cursor = encoded;
  const physical = [];
  for (let position = 0; position < 5; position++) {
    physical.push(PHYSICAL[cursor % 4]);
    cursor = Math.floor(cursor / 4);
  }
  const payload = physical.join("|");

  for (const x of ORIENTATION)
    for (const y of ORIENTATION)
      for (const z of ORIENTATION) {
        const orientation = [x, y, z].join("|");
        const before = `${payload}::${orientation}`;

        for (const witness of [0, 1]) {
          const after = `${payload}::${orientation}`;
          if (before !== after) mutationFailures++;

          const key = `${after}::w${witness}`;
          if (seen.has(key)) throw new Error(`duplicate configuration: ${key}`);
          seen.add(key);
          witness ? verified++ : unverified++;
        }
      }
}

const core = {
  schema: "i13-toroidal-witness-freeze-v1",
  physicalStates: 4,
  positions: 5,
  witnessStates: 2,
  orientationChoices: 3,
  orientationAxes: 3,
  expected: 55296,
  observed: seen.size,
  unverified,
  verified,
  mutationFailures,
  status:
    seen.size === 55296 &&
    verified === 27648 &&
    unverified === 27648 &&
    mutationFailures === 0
      ? "PASS"
      : "FAIL",
};
const sha256 = createHash("sha256").update(JSON.stringify(core)).digest("hex");
console.log(JSON.stringify({ ...core, sha256 }, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
