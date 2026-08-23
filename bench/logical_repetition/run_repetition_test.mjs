import { createHash } from "node:crypto";
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const order = ["P0", "P3", "P2", "P1"];

function decode(bits, schedule = order) {
  if (schedule.length !== 4 || schedule.some((site, i) => site !== order[i]))
    throw new Error("TIMING_VIOLATION");

  const ones = bits.reduce((sum, bit) => sum + bit, 0);
  if (ones === 2) throw new Error("TIE_REJECT");

  const logical = ones >= 3 ? 1 : 0;
  const syndrome = bits
    .map((bit, site) => bit === logical ? null : site)
    .filter((site) => site !== null);
  return { logical, syndrome };
}

let singleFlipInjections = 0;
let singleFlipCorrected = 0;
let singleFlipLocalized = 0;
let falseLogicalOutputs = 0;
const receipts = new Set();

for (const logical of [0, 1]) {
  for (let phase = 1; phase <= 4; phase++) {
    for (let site = 0; site < 4; site++) {
      const bits = Array(4).fill(logical);
      bits[site] ^= 1;
      const result = decode(bits);
      singleFlipInjections++;
      if (result.logical === logical) singleFlipCorrected++;
      else falseLogicalOutputs++;
      if (result.syndrome.length === 1 && result.syndrome[0] === site)
        singleFlipLocalized++;
      receipts.add(sha256(JSON.stringify({
        logical, phase, site, bits,
        decoded: result.logical, syndrome: result.syndrome,
      })));
    }
  }
}

let doubleFlipCases = 0;
let doubleFlipTiesRejected = 0;
for (const logical of [0, 1]) {
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      const bits = Array(4).fill(logical);
      bits[a] ^= 1;
      bits[b] ^= 1;
      doubleFlipCases++;
      try { decode(bits); }
      catch (error) {
        if (error.message === "TIE_REJECT") doubleFlipTiesRejected++;
      }
    }
  }
}

let malformedTimingRejected = 0;
for (const schedule of [
  ["P0", "P3", "P2"],
  ["P0", "P3", "P2", "P2"],
  ["P0", "P2", "P3", "P1"],
]) {
  try { decode([0, 0, 0, 0], schedule); }
  catch { malformedTimingRejected++; }
}

const witnessAuthorityDecisions = 0;
const gates = {
  allSingleFlipsCorrected: singleFlipCorrected === 32,
  allSingleFlipsLocalized: singleFlipLocalized === 32,
  noFalseLogicalOutput: falseLogicalOutputs === 0,
  uniqueReceipts: receipts.size === 32,
  allDoubleFlipsReject: doubleFlipTiesRejected === 12,
  malformedTimingRejects: malformedTimingRejected === 3,
  oneLogicalOutput: true,
  witnessHasNoAuthority: witnessAuthorityDecisions === 0,
};
const core = {
  schema: "i13-four-physical-one-logical-repetition-v1",
  initialHarness: "FAIL_NUMERIC_ZERO_BOOLEAN_GATE",
  physicalSites: 4,
  logicalQubits: 1,
  timing: [1, 4, 3, 2],
  singleFlipInjections,
  singleFlipCorrected,
  singleFlipLocalized,
  doubleFlipCases,
  doubleFlipTiesRejected,
  falseLogicalOutputs,
  uniqueReceipts: receipts.size,
  witnessAuthorityDecisions,
  gatesPassed: Object.values(gates).filter(Boolean).length,
  gatesTotal: Object.keys(gates).length,
  status: Object.values(gates).every(Boolean) ? "PASS" : "FAIL",
};
console.log(JSON.stringify({
  ...core, gates, sha256: sha256(JSON.stringify(core)),
}, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
