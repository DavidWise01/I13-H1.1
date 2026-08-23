import { createHash } from "node:crypto";
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const sites = ["P0", "P1", "P2", "P3"];
const order = ["P0", "P3", "P2", "P1"];

function decode(physical, schedule) {
  if (schedule.length !== 4 || schedule.some((site, i) => site !== order[i]))
    throw new Error("TIMING_VIOLATION");
  if (sites.some((site, i) => physical[i] !== site))
    throw new Error("PHYSICAL_INTEGRITY_VIOLATION");
  return "L0";
}

const baseline = decode([...sites], [...order]);
const matrix = [];
let detected = 0;
let falseDecodes = 0;
let recovered = 0;
let localized = 0;

for (let phase = 1; phase <= 4; phase++) {
  for (let site = 0; site < 4; site++) {
    const physical = [...sites];
    physical[site] = `X(${sites[site]})`;
    let outcome;
    try {
      const logical = decode(physical, order);
      falseDecodes++;
      if (logical === "L0") recovered++;
      outcome = "FALSE_DECODE";
    } catch {
      detected++;
      outcome = "REJECT";
    }
    const location = physical.findIndex((value, i) => value !== sites[i]);
    if (location === site) localized++;
    matrix.push({
      phase,
      site: sites[site],
      outcome,
      localized: location === site,
    });
  }
}

const safety = {
  baselineDecodes: baseline === "L0",
  allDetected: detected === 16,
  noFalseLogicalOutput: falseDecodes === 0,
  allLocalized: localized === 16,
};
const correction = {
  corrected: recovered,
  total: 16,
  status: recovered === 16 ? "PASS" : "FAIL_NO_REDUNDANCY",
};
const core = {
  schema: "i13-physical-spiral-error-injection-v1",
  injections: 16,
  detected,
  falseDecodes,
  localized,
  recovered,
  safetyStatus: Object.values(safety).every(Boolean) ? "PASS" : "FAIL",
  correctionStatus: correction.status,
  limitFound: correction.status !== "PASS",
  status:
    Object.values(safety).every(Boolean) && correction.status !== "PASS"
      ? "LIMIT_FOUND"
      : "UNEXPECTED",
};

console.log(JSON.stringify({
  ...core, safety, correction, matrix,
  sha256: sha256(JSON.stringify(core)),
}, null, 2));
if (core.safetyStatus !== "PASS") process.exitCode = 1;
