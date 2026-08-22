import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const [receiptPath, exhaustionPath, recoveryPath, reportPath] = process.argv.slice(2);
if (!receiptPath || !exhaustionPath || !recoveryPath) {
  throw new Error("usage: node run_receipt_schema.mjs <receipt.json> <exhaustion.wasm> <recovery.wasm> [report.json]");
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const clone = (value) => structuredClone(value);
const hex64 = /^[0-9a-f]{64}$/;

function exactKeys(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
}

function validState(state) {
  if (!exactKeys(state, ["globals", "frame", "heap"])) return false;
  if (!Number.isSafeInteger(state.frame) || state.frame < 1) return false;
  if (!Number.isSafeInteger(state.heap) || state.heap < 0) return false;
  if (!Array.isArray(state.globals) || state.globals.length === 0) return false;
  const names = [];
  for (const tuple of state.globals) {
    if (!Array.isArray(tuple) || tuple.length !== 4 || typeof tuple[0] !== "string") return false;
    if (!tuple.slice(1).every(Number.isSafeInteger)) return false;
    names.push(tuple[0]);
  }
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  return new Set(names).size === names.length && JSON.stringify(names) === JSON.stringify(sorted);
}

function verify(receipt, exhaustionBytes, recoveryBytes) {
  if (!exactKeys(receipt, [
    "schema", "status", "entanglement", "axes", "states", "hashes", "replayFence",
    "deterministicAcrossInstances", "trapped", "recovered", "repeat", "freshInstance",
  ])) return false;
  if (receipt.schema !== "i13-state-receipt-v1" || receipt.status !== "PASS") return false;
  if (receipt.entanglement !== "[a1,b1,c1]~>[a2,b2,c2]~>[a3,b3,c3]") return false;
  if (JSON.stringify(receipt.axes) !== JSON.stringify(["payload", "kind", "bound"])) return false;
  if (!exactKeys(receipt.states, ["initial", "trapped", "recovered"])) return false;
  if (!Object.values(receipt.states).every(validState)) return false;
  if (!exactKeys(receipt.hashes, ["initial", "trapped", "recovered", "chain"])) return false;
  if (!Object.values(receipt.hashes).every((hash) => typeof hash === "string" && hex64.test(hash))) return false;

  const computed = {
    initial: sha256(JSON.stringify(receipt.states.initial)),
    trapped: sha256(JSON.stringify(receipt.states.trapped)),
    recovered: sha256(JSON.stringify(receipt.states.recovered)),
  };
  computed.chain = sha256(`I13-N5\0${computed.initial}\0${computed.trapped}\0${computed.recovered}`);
  if (Object.keys(computed).some((name) => computed[name] !== receipt.hashes[name])) return false;
  if (computed.initial !== computed.recovered) return false;

  const fence = receipt.replayFence;
  if (!exactKeys(fence, ["artifacts", "contract", "contractHash", "binding"])) return false;
  if (!exactKeys(fence.artifacts, ["exhaustionSha256", "recoverySha256"])) return false;
  if (!exactKeys(fence.contract, ["benchmark", "version", "axes", "initialPages", "maximumPages", "resetFrame", "resetHeap"])) return false;
  const wantedContract = {
    benchmark: "protein-folding-arena", version: 1, axes: ["payload", "kind", "bound"],
    initialPages: 1, maximumPages: 16, resetFrame: 1, resetHeap: 0,
  };
  if (JSON.stringify(fence.contract) !== JSON.stringify(wantedContract)) return false;
  const artifactHashes = { exhaustionSha256: sha256(exhaustionBytes), recoverySha256: sha256(recoveryBytes) };
  if (JSON.stringify(fence.artifacts) !== JSON.stringify(artifactHashes)) return false;
  const contractHash = sha256(JSON.stringify(fence.contract));
  const binding = sha256(`I13-N8\0${artifactHashes.exhaustionSha256}\0${artifactHashes.recoverySha256}\0${contractHash}\0${computed.chain}`);
  return fence.contractHash === contractHash && fence.binding === binding;
}

const original = JSON.parse(await readFile(receiptPath, "utf8"));
const exhaustionBytes = await readFile(exhaustionPath);
const recoveryBytes = await readFile(recoveryPath);
if (!verify(original, exhaustionBytes, recoveryBytes)) throw new Error("original receipt failed strict schema verification");

const mutations = {
  missingField(r) { delete r.status; },
  extraField(r) { r.unknown = 1; },
  wrongSchema(r) { r.schema = "i13-state-receipt-v2"; },
  wrongStatusType(r) { r.status = true; },
  reorderedAxes(r) { r.axes.reverse(); },
  duplicateGlobal(r) { r.states.trapped.globals[1][0] = r.states.trapped.globals[0][0]; },
  unsortedGlobals(r) { r.states.trapped.globals.reverse(); },
  nonIntegerFrame(r) { r.states.trapped.frame = 1.5; },
  malformedHash(r) { r.hashes.chain = "xyz"; },
  expandedMemoryContract(r) { r.replayFence.contract.maximumPages = 17; },
};
const rejected = {};
for (const [name, mutate] of Object.entries(mutations)) {
  const candidate = clone(original);
  mutate(candidate);
  rejected[name] = !verify(candidate, exhaustionBytes, recoveryBytes);
  if (!rejected[name]) throw new Error(`malformed receipt accepted: ${name}`);
}

const report = {
  schema: "i13-schema-report-v1", status: "PASS", originalAccepted: true, rejected,
  rejectedCount: Object.values(rejected).filter(Boolean).length, totalMalformed: Object.keys(rejected).length,
  binding: original.replayFence.binding,
};
if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
