import { createHash } from "node:crypto";
const N = 5;
const sha256 = (text) => createHash("sha256").update(text).digest("hex");

function verify(transition) {
  const { receipt, ...decision } = transition;
  return receipt === sha256(JSON.stringify(decision));
}

function arbitrate(a, b, da, db) {
  if (!(Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b < N &&
        a < b && [-1, 1].includes(da) && [-1, 1].includes(db)))
    throw new Error("INVALID_BATCH");

  const ta = (a + da + N) % N;
  const tb = (b + db + N) % N;
  let verdict = "ACCEPT";

  if (ta === tb) verdict = "REJECT_SHARED_DESTINATION";
  else if (ta === b && tb === a) verdict = "REJECT_HEAD_ON_SWAP";
  else if (ta === b || tb === a) verdict = "REJECT_OCCUPIED_SNAPSHOT";

  const before = Array(N).fill(".");
  before[a] = "A";
  before[b] = "B";
  const after = [...before];

  if (verdict === "ACCEPT") {
    after[a] = ".";
    after[b] = ".";
    after[ta] = "A";
    after[tb] = "B";
  }

  const decision = {
    before: before.join(""),
    intents: `A:${a}->${ta}|B:${b}->${tb}`,
    verdict,
    after: after.join(""),
  };
  return { ...decision, receipt: sha256(JSON.stringify(decision)) };
}

const correctedOracle = {
  ACCEPT: 20,
  REJECT_SHARED_DESTINATION: 5,
  REJECT_HEAD_ON_SWAP: 5,
  REJECT_OCCUPIED_SNAPSHOT: 10,
};
const counts = Object.fromEntries(Object.keys(correctedOracle).map((key) => [key, 0]));
const receipts = new Set();
let seamBatches = 0;
let partialRejects = 0;
let conservationFailures = 0;

for (let a = 0; a < N; a++)
  for (let b = a + 1; b < N; b++)
    for (const da of [-1, 1])
      for (const db of [-1, 1]) {
        const transition = arbitrate(a, b, da, db);
        counts[transition.verdict]++;
        if (receipts.has(transition.receipt)) throw new Error("RECEIPT_COLLISION");
        receipts.add(transition.receipt);
        if (transition.intents.includes("0->4") || transition.intents.includes("4->0"))
          seamBatches++;
        if (transition.verdict !== "ACCEPT" && transition.before !== transition.after)
          partialRejects++;
        if ([...transition.after].filter((x) => x === "A" || x === "B").length !== 2)
          conservationFailures++;
        if (!verify(transition)) throw new Error("WITNESS_FAILURE");
      }

const gates = {
  forgedReceipt: false,
  tamperedVerdict: false,
  tamperedAfter: false,
  witnessWinnerInjection: false,
  partialCommitRejected: partialRejects === 0,
};
const good = arbitrate(0, 2, 1, 1);
gates.forgedReceipt = !verify({ ...good, receipt: "0".repeat(64) });
gates.tamperedVerdict = !verify({ ...good, verdict: "REJECT_SHARED_DESTINATION" });
gates.tamperedAfter = !verify({ ...good, after: "A...B" });
gates.witnessWinnerInjection = !verify({ ...good, verdict: "ACCEPT_A_ONLY" });

const core = {
  schema: "i13-toroidal-collision-arbitration-v1",
  initialOracle: "FAIL_EQUAL_BUCKET_ASSUMPTION",
  correctedOracle,
  initialPairs: 10,
  directionPairsPerState: 4,
  totalBatches: 40,
  counts,
  seamBatches,
  uniqueReceipts: receipts.size,
  conservationFailures,
  partialRejects,
  witnessAuthorityDecisions: 0,
  negativeGatesPassed: Object.values(gates).filter(Boolean).length,
  negativeGatesTotal: Object.keys(gates).length,
  status:
    JSON.stringify(counts) === JSON.stringify(correctedOracle) &&
    receipts.size === 40 &&
    conservationFailures === 0 &&
    partialRejects === 0 &&
    Object.values(gates).every(Boolean)
      ? "PASS" : "FAIL",
};
console.log(JSON.stringify({ ...core, gates, sha256: sha256(JSON.stringify(core)) }, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
