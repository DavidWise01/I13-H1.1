import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const [receiptPath, exhaustionPath, recoveryPath, alternatePath, reportPath] = process.argv.slice(2);
if (!receiptPath || !exhaustionPath || !recoveryPath || !alternatePath) {
  throw new Error(
    "usage: node run_receipt_replay.mjs <receipt.json> <exhaustion.wasm> <recovery.wasm> <alternate.wasm> [report.json]",
  );
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const clone = (value) => structuredClone(value);

function expectedBinding(receipt, exhaustionBytes, recoveryBytes) {
  const artifacts = {
    exhaustionSha256: sha256(exhaustionBytes),
    recoverySha256: sha256(recoveryBytes),
  };
  const contractHash = sha256(JSON.stringify(receipt.replayFence.contract));
  const binding = sha256(
    `I13-N8\0${artifacts.exhaustionSha256}\0${artifacts.recoverySha256}\0${contractHash}\0${receipt.hashes.chain}`,
  );
  return { artifacts, contractHash, binding };
}

function verify(receipt, exhaustionBytes, recoveryBytes) {
  const expected = expectedBinding(receipt, exhaustionBytes, recoveryBytes);
  return (
    receipt.replayFence.artifacts.exhaustionSha256 === expected.artifacts.exhaustionSha256
    && receipt.replayFence.artifacts.recoverySha256 === expected.artifacts.recoverySha256
    && receipt.replayFence.contractHash === expected.contractHash
    && receipt.replayFence.binding === expected.binding
  );
}

const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
const exhaustionBytes = await readFile(exhaustionPath);
const recoveryBytes = await readFile(recoveryPath);
const alternateBytes = await readFile(alternatePath);
if (!verify(receipt, exhaustionBytes, recoveryBytes)) {
  throw new Error("valid receipt did not match its artifacts and contract");
}

const alteredContract = clone(receipt);
alteredContract.replayFence.contract.maximumPages += 1;
const alteredBinding = clone(receipt);
alteredBinding.replayFence.binding = `${alteredBinding.replayFence.binding[0] === "0" ? "1" : "0"}${alteredBinding.replayFence.binding.slice(1)}`;
const corruptedExhaustion = Buffer.from(exhaustionBytes);
corruptedExhaustion[Math.floor(corruptedExhaustion.length / 2)] ^= 1;
const truncatedRecovery = recoveryBytes.subarray(0, recoveryBytes.length - 1);

const rejected = {
  exhaustionArtifactSwap: !verify(receipt, alternateBytes, recoveryBytes),
  recoveryArtifactSwap: !verify(receipt, exhaustionBytes, alternateBytes),
  exhaustionBitCorruption: !verify(receipt, corruptedExhaustion, recoveryBytes),
  recoveryTruncation: !verify(receipt, exhaustionBytes, truncatedRecovery),
  alteredContract: !verify(alteredContract, exhaustionBytes, recoveryBytes),
  alteredBinding: !verify(alteredBinding, exhaustionBytes, recoveryBytes),
};
if (Object.values(rejected).some((value) => !value)) {
  throw new Error(`receipt replay accepted: ${JSON.stringify(rejected)}`);
}

const report = {
  schema: "i13-replay-report-v1",
  status: "PASS",
  originalAccepted: true,
  rejected,
  rejectedCount: Object.values(rejected).filter(Boolean).length,
  totalReplays: Object.keys(rejected).length,
  binding: receipt.replayFence.binding,
};
if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
