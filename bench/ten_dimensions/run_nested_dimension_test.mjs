import { createHash } from "node:crypto";
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const layers = {
  universe: 81n ** 9n,
  galaxy: 9n ** 3n,
  planet: 4n ** 2n,
  local: 1n ** 2n,
  selfMagnitude: 1n,
};
const oneDimension = Object.values(layers).reduce((a, b) => a * b, 1n);
const tenDimensions = oneDimension ** 10n;
const normalizedOne = (2n ** 4n) * (3n ** 42n);
const normalizedTen = (2n ** 40n) * (3n ** 420n);

const boundary = [-1, 1, 1, -1]; // -+[ ... ]+-
const selfPhasePerDimension = -1; // (i x 1)^2
const selfPhaseAfterTen = selfPhasePerDimension ** 10;

const gates = {
  universeNormalization: layers.universe === 3n ** 36n,
  galaxyNormalization: layers.galaxy === 3n ** 6n,
  planetNormalization: layers.planet === 2n ** 4n,
  oneDimensionNormalization: oneDimension === normalizedOne,
  tenDimensionNormalization: tenDimensions === normalizedTen,
  tenDimensionsIndependent: tenDimensions === oneDimension ** 10n,
  selfPhaseClosure: selfPhaseAfterTen === 1,
  boundaryBalanced:
    boundary.reduce((a, b) => a + b, 0) === 0 &&
    boundary.reduce((a, b) => a * b, 1) === 1,
  exactDigits: tenDimensions.toString().length === 213,
};

const core = {
  schema: "i13-ten-dimensional-nested-address-v1",
  dimensions: 10,
  boundary: "-++-",
  layers: Object.fromEntries(
    Object.entries(layers).map(([key, value]) => [key, value.toString()])
  ),
  oneDimensionAddresses: oneDimension.toString(),
  tenDimensionAddresses: tenDimensions.toString(),
  digits: tenDimensions.toString().length,
  selfPhasePerDimension,
  selfPhaseAfterTen,
  gatesPassed: Object.values(gates).filter(Boolean).length,
  gatesTotal: Object.keys(gates).length,
  status: Object.values(gates).every(Boolean) ? "PASS" : "FAIL",
};

console.log(JSON.stringify({
  ...core,
  gates,
  sha256: sha256(JSON.stringify(core)),
}, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
