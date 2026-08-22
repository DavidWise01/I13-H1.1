import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const [receiptPath, reportPath] = process.argv.slice(2);
if (!receiptPath) throw new Error("usage: node run_receipt_tamper.mjs <receipt.json> [report.json]");

const sha256 = (text) => createHash("sha256").update(text).digest("hex");
const clone = (value) => structuredClone(value);
const stateHash = (state) => sha256(JSON.stringify(state));
const chainHash = (hashes) => sha256(`I13-N5\0${hashes.initial}\0${hashes.trapped}\0${hashes.recovered}`);

function verify(receipt) {
  const computed = {
    initial: stateHash(receipt.states.initial),
    trapped: stateHash(receipt.states.trapped),
    recovered: stateHash(receipt.states.recovered),
  };
  computed.chain = chainHash(computed);
  for (const name of ["initial", "trapped", "recovered", "chain"]) {
    if (receipt.hashes[name] !== computed[name]) return false;
  }
  return computed.initial === computed.recovered;
}

function flipFirstHexBit(text) {
  const first = Number.parseInt(text[0], 16) ^ 1;
  return first.toString(16) + text.slice(1);
}

const original = JSON.parse(await readFile(receiptPath, "utf8"));
if (!verify(original)) throw new Error("original receipt failed verification");

const mutations = {
  payload(receipt) { receipt.states.trapped.globals[0][1] += 1; },
  kind(receipt) { receipt.states.trapped.globals[0][2] += 1; },
  bound(receipt) { receipt.states.trapped.globals[0][3] ^= 1; },
  frame(receipt) { receipt.states.trapped.frame += 1; },
  heap(receipt) { receipt.states.trapped.heap += 1; },
  initial_hash_bit(receipt) { receipt.hashes.initial = flipFirstHexBit(receipt.hashes.initial); },
  trapped_hash_bit(receipt) { receipt.hashes.trapped = flipFirstHexBit(receipt.hashes.trapped); },
  recovered_hash_bit(receipt) { receipt.hashes.recovered = flipFirstHexBit(receipt.hashes.recovered); },
  chain_hash_bit(receipt) { receipt.hashes.chain = flipFirstHexBit(receipt.hashes.chain); },
};

const rejected = {};
for (const [name, mutate] of Object.entries(mutations)) {
  const candidate = clone(original);
  mutate(candidate);
  rejected[name] = !verify(candidate);
  if (!rejected[name]) throw new Error(`tamper was accepted: ${name}`);
}

const report = {
  schema: "i13-tamper-report-v1",
  status: "PASS",
  originalAccepted: true,
  rejected,
  rejectedCount: Object.values(rejected).filter(Boolean).length,
  totalMutations: Object.keys(mutations).length,
  receiptChain: original.hashes.chain,
};

if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
