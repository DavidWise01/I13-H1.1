import { performance } from "node:perf_hooks";
import { createHash } from "node:crypto";

const K = 5n ** 15n;
const vectors = [1n, 5n, 25n, 3125n, K];
const expected = new Map([
  [1n, 30517578125n],
  [5n, 3814697265625n],
  [25n, 476837158203125n],
  [3125n, 931322574615478515625n],
  [K, 5n ** 60n],
]);

function direct(n) { return ((5n ** 5n) ** 3n) * n * (n ** 2n); }
function normalized(n) { return (5n ** 15n) * (n ** 3n); }

const started = performance.now();
const rows = vectors.map((n) => {
  const a = direct(n);
  const b = normalized(n);
  const oracle = expected.get(n);
  const pass = a === b && b === oracle;
  return { n: n.toString(), direct: a.toString(), normalized: b.toString(), digits: b.toString().length, pass };
});
const elapsedMs = performance.now() - started;
const canonical = JSON.stringify(rows);
const receipt = {
  schema: "i13-math-power-n14-v1",
  target: "(5^5)^3 * n * n^2",
  normalized: "5^15 * n^3",
  coefficient: K.toString(),
  arithmetic: "BigInt/exact",
  vectors: rows,
  status: rows.every((row) => row.pass) ? "PASS" : "FAIL",
  elapsedMs: Number(elapsedMs.toFixed(3)),
  sha256: createHash("sha256").update(canonical).digest("hex"),
};
console.log(JSON.stringify(receipt, null, 2));
if (receipt.status !== "PASS") process.exitCode = 1;
