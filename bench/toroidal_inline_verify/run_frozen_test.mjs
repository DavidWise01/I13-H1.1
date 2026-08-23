import { createHash } from "node:crypto";

const LOCAL = ["in", "out", "vacant", "occupied", "verify"];
const ORIENTATION = ["3x3", "abc", "-abc"];
const seen = new Set();
let verifyAbsent = 0;
let verifyPresent = 0;

for (let encoded = 0; encoded < 5 ** 5; encoded++) {
  let cursor = encoded;
  const local = [];
  for (let position = 0; position < 5; position++) {
    local.push(LOCAL[cursor % 5]);
    cursor = Math.floor(cursor / 5);
  }
  const hasVerify = local.includes("verify");

  for (const x of ORIENTATION)
    for (const y of ORIENTATION)
      for (const z of ORIENTATION) {
        const key = `${local.join("|")}::${[x, y, z].join("|")}`;
        if (seen.has(key)) throw new Error(`duplicate configuration: ${key}`);
        seen.add(key);
        hasVerify ? verifyPresent++ : verifyAbsent++;
      }
}

const core = {
  schema: "i13-toroidal-inline-verify-freeze-v1",
  localStates: 5,
  positions: 5,
  orientationChoices: 3,
  orientationAxes: 3,
  expected: 84375,
  observed: seen.size,
  verifyAbsent,
  verifyPresent,
  duplicates: 0,
  status:
    seen.size === 84375 &&
    verifyAbsent === 27648 &&
    verifyPresent === 56727
      ? "PASS"
      : "FAIL",
};
const sha256 = createHash("sha256").update(JSON.stringify(core)).digest("hex");
console.log(JSON.stringify({ ...core, sha256 }, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
