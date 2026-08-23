import { createHash } from "node:crypto";
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const SIZE = 16;
const ROOT_HALF = 1 / Math.sqrt(2);
const logicalPlus = Array.from({ length: SIZE }, () => [0, 0]);
logicalPlus[0] = [ROOT_HALF, 0];   // |0000>
logicalPlus[15] = [ROOT_HALF, 0]; // |1111>

function applyZ(vector, qubit) {
  return vector.map(([re, im], basis) =>
    ((basis >> (3 - qubit)) & 1) ? [-re, -im] : [re, im]
  );
}
function norm(vector) {
  return vector.reduce((sum, [re, im]) => sum + re * re + im * im, 0);
}
function overlap(a, b) {
  let re = 0, im = 0;
  for (let i = 0; i < SIZE; i++) {
    re += a[i][0] * b[i][0] + a[i][1] * b[i][1];
    im += a[i][0] * b[i][1] - a[i][1] * b[i][0];
  }
  return [re, im];
}
function fidelity(a, b) {
  const [re, im] = overlap(a, b);
  return re * re + im * im;
}
function expectZZ(vector, a, b) {
  return vector.reduce((sum, [re, im], basis) => {
    const sign =
      (((basis >> (3 - a)) & 1) ^ ((basis >> (3 - b)) & 1)) ? -1 : 1;
    return sum + sign * (re * re + im * im);
  }, 0);
}

let phaseFlipInjections = 0;
let undetectedPhaseFlips = 0;
let falseAcceptedLogicalStates = 0;
let orthogonalLogicalOutputs = 0;
let normFailures = 0;
const receipts = new Set();

for (let phase = 1; phase <= 4; phase++) {
  for (let qubit = 0; qubit < 4; qubit++) {
    const output = applyZ(logicalPlus, qubit);
    const syndrome = [
      expectZZ(output, 0, 1),
      expectZZ(output, 1, 2),
      expectZZ(output, 2, 3),
    ];
    const visible = syndrome.some((value) => value < 0.999999);
    const logicalFidelity = fidelity(logicalPlus, output);

    phaseFlipInjections++;
    if (!visible) undetectedPhaseFlips++;
    if (!visible && logicalFidelity < 0.999999)
      falseAcceptedLogicalStates++;
    if (logicalFidelity < 1e-12) orthogonalLogicalOutputs++;
    if (Math.abs(norm(output) - 1) > 1e-12) normFailures++;

    receipts.add(sha256(JSON.stringify({
      phase, qubit, syndrome,
      fidelity: Number(logicalFidelity.toFixed(15)),
    })));
  }
}

const gates = {
  baselineNormalized: Math.abs(norm(logicalPlus) - 1) < 1e-12,
  allPhaseFlipsPreserveNorm: normFailures === 0,
  receiptsUnique: receipts.size === 16,
  phaseDetection: undetectedPhaseFlips === 0,
  logicalFidelityPreserved: falseAcceptedLogicalStates === 0,
};
const core = {
  schema: "i13-four-physical-phase-error-surface-v1",
  state: "|+_L>=(|0000>+|1111>)/sqrt(2)",
  physicalSites: 4,
  timingPhases: 4,
  phaseFlipInjections,
  undetectedPhaseFlips,
  falseAcceptedLogicalStates,
  orthogonalLogicalOutputs,
  normFailures,
  uniqueReceipts: receipts.size,
  passedGates: Object.values(gates).filter(Boolean).length,
  totalGates: Object.keys(gates).length,
  status:
    undetectedPhaseFlips === 16 && falseAcceptedLogicalStates === 16
      ? "LIMIT_FOUND" : "UNEXPECTED",
};
console.log(JSON.stringify({
  ...core, gates, sha256: sha256(JSON.stringify(core)),
}, null, 2));
