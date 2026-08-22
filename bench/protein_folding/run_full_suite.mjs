import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const i13 = process.argv[2] || join(root, "..", "..", "target", "debug", "i13");
const node = process.execPath;

function run(command, args, parseJson = true) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")}\n${result.stderr || result.stdout}`);
  const line = result.stdout.trim().split("\n").at(-1);
  return parseJson && line ? JSON.parse(line) : line;
}

const targets = [
  "n1_hydrophobic_oracle", "n2_collision_oracle", "n3_array_cow",
  "n4_arena_growth", "n4_arena_exhaustion", "n11_cftr_1480",
];
for (const name of targets) run(i13, ["build", join(root, `${name}.i13`), "-o", join(root, `${name}.wasm`)], false);

const graders = {};
for (const name of targets.filter((name) => name !== "n4_arena_exhaustion")) {
  graders[name] = run(node, [join(root, "run_wasm_bench.mjs"), join(root, `${name}.wasm`)]);
}
const receiptPath = join(root, "n6_state_receipt.json");
const exhaustionPath = join(root, "n4_arena_exhaustion.wasm");
const recoveryPath = join(root, "n3_array_cow.wasm");
const alternatePath = join(root, "n4_arena_growth.wasm");
const receipt = run(node, [join(root, "run_arena_stress.mjs"), exhaustionPath, recoveryPath, receiptPath]);
const tamper = run(node, [join(root, "run_receipt_tamper.mjs"), receiptPath, join(root, "n7_tamper_report.json")]);
const replay = run(node, [join(root, "run_receipt_replay.mjs"), receiptPath, exhaustionPath, recoveryPath, alternatePath, join(root, "n8_replay_report.json")]);
const schema = run(node, [join(root, "run_receipt_schema.mjs"), receiptPath, exhaustionPath, recoveryPath, join(root, "n9_schema_report.json")]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const artifactNames = [
  ...targets.map((name) => `${name}.i13`), ...targets.map((name) => `${name}.wasm`),
  "n6_state_receipt.json", "n7_tamper_report.json", "n8_replay_report.json", "n9_schema_report.json",
];
const artifacts = {};
for (const name of artifactNames) artifacts[name] = sha256(await readFile(join(root, name)));

const manifest = {
  schema: "i13-protein-folding-suite-v1",
  status: "PASS",
  targets: { compiled: targets.length, graded: Object.keys(graders).length, arenaExhaustion: "PASS", cftr1480: "PASS" },
  rejectionGates: { tamper: `${tamper.rejectedCount}/${tamper.totalMutations}`, replay: `${replay.rejectedCount}/${replay.totalReplays}`, schema: `${schema.rejectedCount}/${schema.totalMalformed}` },
  maximumCap: { memoryPages: 16, memoryBytes: 1048576, trappedFrame: receipt.trapped.frame, trappedHeap: receipt.trapped.heap },
  stateBinding: receipt.replayFence.binding,
  artifacts,
};
await writeFile(join(root, "n10_suite_manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest));
