import { createHash } from "node:crypto";

const cp1252Reverse = new Map([
  ["€", 0x80], ["‚", 0x82], ["ƒ", 0x83], ["„", 0x84], ["…", 0x85],
  ["†", 0x86], ["‡", 0x87], ["ˆ", 0x88], ["‰", 0x89], ["Š", 0x8a],
  ["‹", 0x8b], ["Œ", 0x8c], ["Ž", 0x8e], ["‘", 0x91], ["’", 0x92],
  ["“", 0x93], ["”", 0x94], ["•", 0x95], ["–", 0x96], ["—", 0x97],
  ["˜", 0x98], ["™", 0x99], ["š", 0x9a], ["›", 0x9b], ["œ", 0x9c],
  ["ž", 0x9e], ["Ÿ", 0x9f],
]);

function toLegacyBytes(text) {
  const bytes = [];
  for (const character of text) {
    const point = character.codePointAt(0);
    if (cp1252Reverse.has(character)) bytes.push(cp1252Reverse.get(character));
    else if (point <= 0xff) bytes.push(point);
    else return null;
  }
  return Uint8Array.from(bytes);
}

function decodeOnce(text) {
  const bytes = toLegacyBytes(text);
  if (!bytes) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function suspicion(text) {
  const markers = text.match(/(?:Ã.|Â.|â.|ðŸ|ï»¿|\uFFFD|[\u0080-\u009f])/gu) ?? [];
  return markers.length * 10 + (text.match(/\uFFFD/gu) ?? []).length * 100;
}

function sanitize(input) {
  if (input.includes("\uFFFD")) return { status: "REJECT_IRREVERSIBLE", output: null, depth: 0 };
  let best = input;
  let bestScore = suspicion(input);
  let candidate = input;
  let depth = 0;
  for (let attempt = 1; attempt <= 2; attempt++) {
    candidate = decodeOnce(candidate);
    if (candidate === null) break;
    const score = suspicion(candidate);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
      depth = attempt;
    }
  }
  return { status: depth ? "REPAIRED" : "PRESERVED", output: best, depth };
}

const repairVectors = [
  ["FranÃ§ois", "François"],
  ["cafÃ©", "café"],
  ["Iâ€™m ready", "I’m ready"],
  ["â€œquotedâ€\u009d", "“quoted”"],
  ["ðŸ˜€", "😀"],
  ["MÃ¼nchen", "München"],
  ["Â£20", "£20"],
  ["FranÃƒÂ§ais", "Français"],
];
const preserveVectors = ["plain ASCII", "東京", "naïve", "😀 already valid", "€100"];
const rejectVectors = ["bad \uFFFD data", "\uFFFD"];

let repaired = 0, preserved = 0, rejected = 0, idempotent = 0;
for (const [input, expected] of repairVectors) {
  const result = sanitize(input);
  if (result.status === "REPAIRED" && result.output === expected) repaired++;
  const second = sanitize(result.output);
  if (second.status === "PRESERVED" && second.output === expected) idempotent++;
}
for (const input of preserveVectors) {
  const result = sanitize(input);
  if (result.status === "PRESERVED" && result.output === input) preserved++;
}
for (const input of rejectVectors) {
  if (sanitize(input).status === "REJECT_IRREVERSIBLE") rejected++;
}

const core = {
  schema: "i13-mojibake-ingress-v1",
  repairVectors: repairVectors.length,
  repaired,
  preserveVectors: preserveVectors.length,
  preserved,
  rejectVectors: rejectVectors.length,
  rejected,
  idempotent,
  falseModifications: preserveVectors.length - preserved,
  status:
    repaired === repairVectors.length &&
    preserved === preserveVectors.length &&
    rejected === rejectVectors.length &&
    idempotent === repairVectors.length ? "PASS" : "FAIL",
};
const sha256 = createHash("sha256").update(JSON.stringify(core)).digest("hex");
console.log(JSON.stringify({ ...core, sha256 }, null, 2));
if (core.status !== "PASS") process.exitCode = 1;
