import { createHash } from "node:crypto";
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

const distinctions = ["DIRECT", "INVERSE", "MIRROR", "INVERSE_MIRROR"];
const amplitudes = [0, 2];
const boundaries = ["IN", "OUT"];
const universe = "U000";
const dimensions = [];
const states = [];
const receipts = new Set();

for (let bank = 0; bank < distinctions.length; bank++) {
  for (let localDimension = 0; localDimension < 10; localDimension++) {
    const id = `D${String(bank * 10 + localDimension).padStart(2, "0")}`;
    dimensions.push({ id, distinction: distinctions[bank], localDimension });

    for (const amplitude of amplitudes) {
      for (const boundary of boundaries) {
        const state = {
          universe,
          id,
          distinction: distinctions[bank],
          localDimension,
          amplitude,
          boundary,
          observer: "YOU_0D",
        };
        const receipt = sha256(JSON.stringify(state));
        if (receipts.has(receipt)) throw new Error("RECEIPT_COLLISION");
        receipts.add(receipt);
        states.push(state);
      }
    }
  }
}

const banks = Object.fromEntries(
  distinctions.map((name) => [
    name,
    dimensions.filter((dimension) => dimension.distinction === name).length,
  ])
);
const gates = {
  fortyDimensions: dimensions.length === 40,
  uniqueDimensionIds: new Set(dimensions.map(({ id }) => id)).size === 40,
  fourBanksOfTen: Object.values(banks).every((count) => count === 10),
  rankUnrankBijection: dimensions.every((dimension, rank) =>
    dimension.distinction === distinctions[Math.floor(rank / 10)] &&
    dimension.localDimension === rank % 10
  ),
  controlsDoNotInflateDimensions:
    dimensions.length === 40 && states.length === 160,
  uniqueControlledStates: receipts.size === 160,
  observerZeroDimensional: states.every(({ observer }) => observer === "YOU_0D"),
  singleUniverseClosure: states.every((state) => state.universe === universe),
};

const core = {
  schema: "i13-tensor40-single-universe-v1",
  universe,
  dimensions: dimensions.length,
  distinctions: banks,
  amplitudes,
  boundaries,
  observer: "YOU_0D",
  controlledStates: states.length,
  uniqueReceipts: receipts.size,
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
