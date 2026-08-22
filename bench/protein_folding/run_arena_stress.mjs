import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const [exhaustionPath, recoveryPath, receiptPath] = process.argv.slice(2);
if (!exhaustionPath || !recoveryPath) {
  throw new Error("usage: node run_arena_stress.mjs <exhaustion.wasm> <recovery.wasm>");
}

function snapshot(exports) {
  const globals = {};
  for (const [name, value] of Object.entries(exports)) {
    if (value instanceof WebAssembly.Global && name.startsWith("i13.global.")) {
      const id = name.slice("i13.global.".length);
      globals[id] = {
        a: value.value,
        b: exports[`i13.kind.${id}`].value,
        c: exports[`i13.state.${id}`].value,
      };
    }
  }
  return {
    globals,
    frame: exports["i13.frame_depth"].value,
    heap: exports["i13.array_heap"].value,
  };
}

function canonical(state) {
  return JSON.stringify({
    globals: Object.entries(state.globals)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, triple]) => [name, triple.a, triple.b, triple.c]),
    frame: state.frame,
    heap: state.heap,
  });
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stateHash(state) {
  return sha256(canonical(state));
}

function expectTrap(exports) {
  try {
    exports.i13_run();
  } catch (error) {
    if (!(error instanceof WebAssembly.RuntimeError)) throw error;
    if (!/unreachable/i.test(error.message)) {
      throw new Error(`unexpected runtime trap: ${error.message}`);
    }
    return error.message;
  }
  throw new Error("arena exhaustion did not trap");
}

function verifyRecovered(state) {
  for (const triple of Object.values(state.globals)) {
    if (triple.a !== 0 || triple.b !== 0 || triple.c !== 0) {
      throw new Error(`three-plane reset failed: ${JSON.stringify(triple)}`);
    }
  }
  if (state.frame !== 1 || state.heap !== 0) {
    throw new Error(`private reset failed: ${JSON.stringify(state)}`);
  }
}

async function cycle(bytes) {
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const exports = instance.exports;
  const phase1 = snapshot(exports);
  const trap = expectTrap(exports);
  const phase2 = snapshot(exports);
  exports.i13_reset();
  const phase3 = snapshot(exports);
  verifyRecovered(phase3);
  const hashes = {
    initial: stateHash(phase1),
    trapped: stateHash(phase2),
    recovered: stateHash(phase3),
  };
  hashes.chain = sha256(`I13-N5\0${hashes.initial}\0${hashes.trapped}\0${hashes.recovered}`);
  return { exports, trap, phase1, phase2, phase3, hashes };
}

const exhaustionBytes = await readFile(exhaustionPath);
const first = await cycle(exhaustionBytes);
const second = await cycle(exhaustionBytes);
if (JSON.stringify(first.hashes) !== JSON.stringify(second.hashes)) {
  throw new Error(`nondeterministic state receipts: ${JSON.stringify({ first: first.hashes, second: second.hashes })}`);
}

const trap2 = expectTrap(first.exports);
first.exports.i13_reset();
const phase4 = snapshot(first.exports);
verifyRecovered(phase4);

const recoveryBytes = await readFile(recoveryPath);
const recovery = await WebAssembly.instantiate(recoveryBytes, {});
recovery.instance.exports.i13_run();
const verdict = recovery.instance.exports["i13.global.VERDICT"]?.value;
if (verdict !== 1) throw new Error(`fresh-instance recovery verdict: ${verdict}`);

const contract = {
  benchmark: "protein-folding-arena",
  version: 1,
  axes: ["payload", "kind", "bound"],
  initialPages: 1,
  maximumPages: 16,
  resetFrame: 1,
  resetHeap: 0,
};
const artifacts = {
  exhaustionSha256: sha256Bytes(exhaustionBytes),
  recoverySha256: sha256Bytes(recoveryBytes),
};
const contractHash = sha256(JSON.stringify(contract));
const binding = sha256(
  `I13-N8\0${artifacts.exhaustionSha256}\0${artifacts.recoverySha256}\0${contractHash}\0${first.hashes.chain}`,
);

const receipt = {
  schema: "i13-state-receipt-v1",
  status: "PASS",
  entanglement: "[a1,b1,c1]~>[a2,b2,c2]~>[a3,b3,c3]",
  axes: ["payload", "kind", "bound"],
  states: {
    initial: JSON.parse(canonical(first.phase1)),
    trapped: JSON.parse(canonical(first.phase2)),
    recovered: JSON.parse(canonical(first.phase3)),
  },
  hashes: first.hashes,
  replayFence: { artifacts, contract, contractHash, binding },
  deterministicAcrossInstances: true,
  trapped: { trap: first.trap, frame: first.phase2.frame, heap: first.phase2.heap },
  recovered: { frame: first.phase3.frame, heap: first.phase3.heap },
  repeat: { trap2, frame: phase4.frame, heap: phase4.heap },
  freshInstance: "VERDICT_1",
};

if (receiptPath) await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt));
