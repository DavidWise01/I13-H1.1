import { readFile } from "node:fs/promises";

const path = process.argv[2];
if (!path) {
  throw new Error("usage: node run_wasm_bench.mjs <benchmark.wasm>");
}

const bytes = await readFile(path);
const { instance } = await WebAssembly.instantiate(bytes, {});
instance.exports.i13_run();

const n1 = {
  RESIDUES: 731,
  MOVES: 730,
  HYDROPHOBIC_RESIDUES: 399,
  HYDROPHOBIC_CONTACTS: 365,
  BROKEN_BONDS: 0,
  COLLISIONS: 0,
  ENERGY: -365,
  VALID: 1,
  VERDICT: 1,
};

const n2 = {
  RESIDUES: 9,
  COLLISION_PAIRS: 6,
  BROKEN_BONDS: 0,
  ENERGY: 60000,
  VERDICT: 1,
};

const n3 = {
  ORIGINAL_1: 2,
  ORIGINAL_3: 4,
  UPDATED_1: 9,
  UPDATED_3: 7,
  VERDICT: 1,
};

const n4 = {
  ORIGINAL_0: 0,
  FINAL_0: 32,
  FINAL_1: 1,
  FINAL_31: 31,
  VERDICT: 1,
};

const expected = path.includes("n4_arena_growth") ? n4 : path.includes("n3_array") ? n3 : path.includes("n2_collision") ? n2 : n1;

const actual = {};
for (const [name, wanted] of Object.entries(expected)) {
  const exported = instance.exports[`i13.global.${name}`];
  if (!(exported instanceof WebAssembly.Global)) {
    throw new Error(`missing exported global: ${name}`);
  }
  actual[name] = exported.value;
  if (actual[name] !== wanted) {
    throw new Error(`${name}: expected ${wanted}, received ${actual[name]}`);
  }
}

console.log(JSON.stringify({ status: "PASS", bytes: bytes.length, globals: actual }));
