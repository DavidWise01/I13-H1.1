import { createHash } from "node:crypto";

const NODES = 5;
const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const canonical = (state) => state.join("|");
const adjacent = (a, b) =>
  (a + 1) % NODES === b || (a - 1 + NODES) % NODES === b;

function move(before, from, to) {
  if (
    before.length !== NODES ||
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 || to < 0 || from >= NODES || to >= NODES ||
    from === to ||
    !adjacent(from, to) ||
    before[from] !== "occupied" ||
    before[to] !== "vacant"
  ) throw new Error("ILLEGAL_TRANSITION");

  const after = [...before];
  after[from] = "vacant";
  after[to] = "occupied";

  const count = (state) => state.filter((value) => value === "occupied").length;
  if (count(after) !== count(before)) throw new Error("OCCUPANCY_VIOLATION");

  const seam = (from === 4 && to === 0) || (from === 0 && to === 4);
  const operation = `move:${from}->${to}${seam ? ":|||" : ""}`;
  const receipt = sha256(
    `${canonical(before)}::${operation}::${canonical(after)}`
  );
  return { before: [...before], operation, after, receipt };
}

function verify(transition) {
  return transition.receipt === sha256(
    `${canonical(transition.before)}::${transition.operation}::${canonical(transition.after)}`
  );
}

let legalTransitions = 0;
let seamCrossings = 0;
let witnessMutationFailures = 0;
const receipts = new Set();

for (let from = 0; from < NODES; from++) {
  for (const direction of [-1, 1]) {
    const to = (from + direction + NODES) % NODES;
    const before = Array(NODES).fill("vacant");
    before[from] = "occupied";
    const immutablePayload = canonical(before);
    const transition = move(before, from, to);

    if (!verify(transition)) throw new Error("WITNESS_REJECTED_LEGAL_MOVE");
    if (canonical(before) !== immutablePayload) witnessMutationFailures++;
    if (receipts.has(transition.receipt)) throw new Error("RECEIPT_COLLISION");

    receipts.add(transition.receipt);
    legalTransitions++;
    if (transition.operation.includes("|||")) seamCrossings++;
  }
}

const rejections = [];
const reject = (name, operation) => {
  try { operation(); rejections.push([name, false]); }
  catch { rejections.push([name, true]); }
};
const base = ["occupied", "vacant", "vacant", "vacant", "vacant"];

reject("nonadjacent", () => move(base, 0, 2));
reject("same-node", () => move(base, 0, 0));
reject("vacant-source", () => move(base, 1, 2));
reject("occupied-destination", () =>
  move(["occupied", "occupied", "vacant", "vacant", "vacant"], 0, 1)
);
reject("negative-index", () => move(base, -1, 0));
reject("overflow-index", () => move(base, 0, 5));

const good = move(base, 0, 1);
rejections.push(["forged-receipt", !verify({ ...good, receipt: "0".repeat(64) })]);
const tampered = { ...good, after: [...good.after] };
tampered.after[2] = "occupied";
rejections.push(["tampered-after", !verify(tampered)]);

const core = {
  schema: "i13-toroidal-transition-witness-v1",
  nodes: NODES,
  legalTransitions,
  seamCrossings,
  uniqueReceipts: receipts.size,
  occupancyConserved: true,
  witnessMutationFailures,
  negativeGatesPassed: rejections.filter(([, pass]) => pass).length,
  negativeGatesTotal: rejections.length,
  status:
    legalTransitions === 10 &&
    seamCrossings === 2 &&
    receipts.size === 10 &&
    witnessMutationFailures === 0 &&
    rejections.every(([, pass]) => pass)
      ? "PASS"
      : "FAIL",
};
const receipt = {
  ...core,
  rejections: Object.fromEntries(rejections),
  sha256: sha256(JSON.stringify(core)),
};
console.log(JSON.stringify(receipt, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
