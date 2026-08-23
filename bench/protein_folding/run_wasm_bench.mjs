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

const n11 = {
  RESIDUES: 1480,
  TMD1_RESIDUES: 380,
  NBD1_RESIDUES: 270,
  REGULATORY_RESIDUES: 180,
  TMD2_RESIDUES: 340,
  NBD2_RESIDUES: 310,
  HELIX_RESIDUES: 252,
  NATIVE_HYDROPHOBIC: 700,
  DELTA_F508_HYDROPHOBIC: 699,
  NATIVE_MEMBRANE_FIT: 120,
  DELTA_F508_MEMBRANE_FIT: 120,
  NATIVE_SIGNATURE: 151813,
  DELTA_F508_SIGNATURE: 151800,
  CLOSED_WITNESS: 152443,
  OPEN_WITNESS: 152483,
  STRUCTURE_OK: 1,
  RECOGNITION: 1,
  VERDICT: 1,
};

const n12 = {
  NATIVE_123: 1064117,
  NATIVE_132: 1064117,
  NATIVE_213: 1064117,
  NATIVE_231: 1064117,
  NATIVE_312: 1064117,
  NATIVE_321: 1064117,
  DELTA_123: 1062599,
  DELTA_132: 1062599,
  DELTA_213: 1062599,
  DELTA_231: 1062599,
  DELTA_312: 1062599,
  DELTA_321: 1062599,
  NATIVE_INVARIANT: 1,
  DELTA_INVARIANT: 1,
  EXPECTED_MUTATION_DELTA: 1518,
  LOCALITY_OK: 1,
  RECOGNITION: 1,
  VERDICT: 1,
};

const n13 = {
  RESIDUES: 140,
  NTERM_RESIDUES: 60,
  NAC_RESIDUES: 35,
  CTERM_RESIDUES: 45,
  SOLUTION_0: 34,
  SOLUTION_1: 35,
  SOLUTION_2: 35,
  SOLUTION_3: 36,
  MEMBRANE_0: 35,
  MEMBRANE_1: 34,
  MEMBRANE_2: 35,
  MEMBRANE_3: 36,
  SOLUTION_DIVERSITY: 7349,
  MEMBRANE_DIVERSITY: 7349,
  NATIVE_CHARGE: 18,
  E46K_CHARGE: 20,
  TOPOLOGY_OK: 1,
  SOLUTION_ENSEMBLE_OK: 1,
  MEMBRANE_ENSEMBLE_OK: 1,
  COLLAPSED_REJECTED: 1,
  RECOGNITION: 1,
  VERDICT: 1,
};

const expected = path.includes("n13_asyn") ? n13 : path.includes("n12_cftr") ? n12 : path.includes("n11_cftr") ? n11 : path.includes("n4_arena_growth") ? n4 : path.includes("n3_array") ? n3 : path.includes("n2_collision") ? n2 : n1;

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
