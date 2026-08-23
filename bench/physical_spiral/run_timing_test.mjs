import { createHash } from "node:crypto";
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const sites = ["P0", "P1", "P2", "P3"];
const timing = [1, 4, 3, 2];
const expected = ["P0", "P3", "P2", "P1"];

const chronologicalOrder = [...sites].sort(
  (a, b) => timing[sites.indexOf(a)] - timing[sites.indexOf(b)]
);
const applyPermutation = (values) =>
  timing.map((target) => values[target - 1]);
const permutationOnce = applyPermutation(sites);
const permutationTwice = applyPermutation(permutationOnce);

function decode(schedule) {
  if (schedule.length !== 4) throw new Error("INCOMPLETE_CYCLE");
  if (new Set(schedule).size !== 4) throw new Error("DUPLICATE_FIRE");
  if (schedule.some((site, index) => site !== expected[index]))
    throw new Error("TIMING_ORDER_VIOLATION");
  return "L0";
}

const rejections = {
  earlyT1: false, earlyT2: false, earlyT3: false,
  duplicate: false, missing: false, outOfOrder: false,
};
for (let length = 1; length <= 3; length++) {
  try { decode(expected.slice(0, length)); }
  catch { rejections[`earlyT${length}`] = true; }
}
try { decode(["P0", "P3", "P2", "P2"]); }
catch { rejections.duplicate = true; }
try { decode(["P0", "P3", "P2"]); }
catch { rejections.missing = true; }
try { decode(["P0", "P2", "P3", "P1"]); }
catch { rejections.outOfOrder = true; }

const logicalIdentity = decode(chronologicalOrder);
const gates = {
  uniqueTiming:
    new Set(timing).size === 4 &&
    timing.every((value) => value >= 1 && value <= 4),
  chronology:
    JSON.stringify(chronologicalOrder) === JSON.stringify(expected),
  firesOnce: new Set(chronologicalOrder).size === 4,
  selfInverse: JSON.stringify(permutationTwice) === JSON.stringify(sites),
  oneLogicalOutput: logicalIdentity === "L0",
  earlyDecodeRejected:
    rejections.earlyT1 && rejections.earlyT2 && rejections.earlyT3,
  malformedSchedulesRejected:
    rejections.duplicate && rejections.missing && rejections.outOfOrder,
};

const core = {
  schema: "i13-physical-spiral-timing-v1",
  physicalSites: 4,
  timing,
  chronologicalOrder,
  permutationOnce,
  permutationTwice,
  logicalOutputs: 1,
  logicalIdentity,
  gatesPassed: Object.values(gates).filter(Boolean).length,
  gatesTotal: Object.keys(gates).length,
  status: Object.values(gates).every(Boolean) ? "PASS" : "FAIL",
};
console.log(JSON.stringify({
  ...core,
  trace: chronologicalOrder.map((site, index) => ({ time: index + 1, site })),
  rejections,
  gates,
  sha256: sha256(JSON.stringify(core)),
}, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
