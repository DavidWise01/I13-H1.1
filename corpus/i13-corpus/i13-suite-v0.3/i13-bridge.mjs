// i13-bridge.mjs — clean reusable v0.3 WASM bridge (extracted from i13-wasm-vm-bridge-v0.3.js).
// This is the "make it better" extract: same lowering/VM contract, but a real ES module
// importable by node servers and test runners (the original .js is kept verbatim).
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const R = require("./i-reader-engine-v0.2.js");

const VERSION = "i13-wasm-vm-bridge-v0.3";
const OP = { Const:0, Ask:1, Attr:2, Ret:3, Answer:4, Drop:5, Bin:6, Cmp:7, If:8, Call:9, Block:10, Else:11, End:12, Func:13, Halt:14 };
const BIN = { "+":0, "-":1, "*":2, "/":3 }, CMP = { "<":0, ">":1, "<=":2, ">=":3, "==":4, "!=":5 };
const VERR = { 0:"NONE",1:"UNDERFLOW",2:"ELSE_WITHOUT_IF",3:"END_WITHOUT_OPEN",4:"BLOCK_HEIGHT",5:"IF_HEIGHT",6:"UNCLOSED_CONTROL",7:"FINAL_HEIGHT",8:"CONTROL_OVERFLOW",9:"BAD_OPCODE" };
const VMERR = { 1:"OK","-1":"VALIDATION_FAILED","-2":"STACK_UNDERFLOW","-3":"STACK_OVERFLOW","-4":"UNBOUND_NAME","-5":"ASSIGN_UNDECLARED","-6":"DIV_ZERO","-7":"BAD_BIN","-8":"BAD_CMP","-9":"BAD_JUMP","-10":"UNSUPPORTED_OPCODE","-11":"STEP_LIMIT","-12":"BAD_SLOT","-13":"TYPE_ERROR","-14":"BAD_FUNC","-15":"ARITY","-16":"CALL_DEPTH","-17":"LOCAL_OVERFLOW","-18":"RET_MAIN" };
const TRACE = { 1:"ENTER",2:"CALL",3:"RET",4:"HALT" };

function collectDecls(body, out = new Set()) {
  for (const s of body || []) {
    if (s.type === "Declare") out.add(s.name);
    else if (s.type === "If") { collectDecls(s.then?.body, out); collectDecls(s.otherwise?.body, out); }
  }
  return out;
}

function compile(ast) {
  if (!ast || ast.type !== "Program") throw new Error("Program required");
  const code = [], globals = new Map(), globalNames = [], functions = [], fnByName = new Map();
  const gslot = n => { if (!globals.has(n)) { globals.set(n, globalNames.length); globalNames.push(n); } return globals.get(n); };
  collectDecls(ast.body).forEach(gslot);
  const fnNodes = ast.body.filter(x => x.type === "FunctionDef");
  fnNodes.forEach((f, i) => { fnByName.set(f.name, i); gslot(f.name); });

  const emit = (op, a = 0, b = 0, imm = 0, meta = {}) => { const row = { op: OP[op], opName: op, a, b, imm, ...meta }; code.push(row); return code.length - 1; };
  const resolve = (name, ctx) => {
    if (ctx.locals && ctx.locals.has(name)) return { slot: ctx.locals.get(name), scope: 0 };
    if (globals.has(name)) return { slot: globals.get(name), scope: 1 };
    return { slot: gslot(name), scope: 1 };
  };
  const target = (name, ctx) => {
    if (ctx.locals && ctx.locals.has(name)) return { slot: ctx.locals.get(name), scope: 0 };
    if (globals.has(name)) return { slot: globals.get(name), scope: 1 };
    throw new Error("assignment target is undeclared: " + name);
  };
  const flags = (scope, assign) => (scope << 1) | (assign ? 1 : 0);

  const compileRegion = (body, ctx) => {
    const expr = n => {
      switch (n.type) {
        case "Constant": emit("Const", 0, 0, Number(n.value), { source: n.loc?.source }); break;
        case "Name": { const r = resolve(n.id, ctx); emit("Ask", r.slot, r.scope, 0, { name: n.id, source: n.loc?.source }); break; }
        case "Attribute": expr(n.object); emit("Attr", 0, 0, 0, { attr: n.attr, source: n.loc?.source }); break;
        case "Unary": if (n.op !== "-") throw new Error("unsupported unary " + n.op); emit("Const", 0, 0, 0); expr(n.value); emit("Bin", BIN["-"]); break;
        case "BinOp": if (BIN[n.op] === undefined) throw new Error("unsupported BinOp " + n.op); expr(n.left); expr(n.right); emit("Bin", BIN[n.op], 0, 0, { kind: n.op }); break;
        case "Compare": if (CMP[n.op] === undefined) throw new Error("unsupported Compare " + n.op); expr(n.left); expr(n.right); emit("Cmp", CMP[n.op], 0, 0, { kind: n.op }); break;
        case "Call": expr(n.callee); n.args.forEach(expr); emit("Call", n.args.length, 0, 0, { source: n.loc?.source }); break;
        default: throw new Error("unsupported expression " + n.type);
      }
    };
    const block = b => { emit("Block"); for (const s of b?.body || []) stmt(s); emit("End"); };
    const stmt = n => {
      switch (n.type) {
        case "FunctionDef":
          if (ctx.kind !== "main") throw new Error("nested FunctionDef/closure is not covered in v0.3");
          emit("Func", gslot(n.name), fnByName.get(n.name), 0, { name: n.name, source: n.loc?.source }); break;
        case "Declare": {
          const r = ctx.kind === "main" ? { slot: gslot(n.name), scope: 1 } : { slot: ctx.locals.get(n.name), scope: 0 };
          expr(n.value); emit("Answer", r.slot, flags(r.scope, 0), 0, { name: n.name, mode: "declare" }); break;
        }
        case "Assign": {
          if (n.target.attr && n.target.attr !== "p") throw new Error("unsupported assignment attribute ." + n.target.attr);
          const r = target(n.target.name, ctx);
          if (n.target.attr === "p") {
            emit("Ask", r.slot, r.scope, 0, { name: n.target.name }); expr(n.value); emit("Bin", BIN["+"]);
            emit("Answer", r.slot, flags(r.scope, 1), 0, { name: n.target.name, osmotic: true });
          } else { expr(n.value); emit("Answer", r.slot, flags(r.scope, 1), 0, { name: n.target.name }); }
          break;
        }
        case "Expr": expr(n.value); emit("Drop"); break;
        case "Return": expr(n.value); emit("Ret", 0, 0, 0, { source: n.loc?.source }); break;
        case "If": {
          expr(n.test); const ip = emit("If", -1); block(n.then); const ep = emit("Else", -1);
          const elseStart = code.length; if (n.otherwise) block(n.otherwise); else block({ body: [] });
          const end = emit("End"); code[ip].a = elseStart; code[ep].a = end + 1; break;
        }
        default: throw new Error("unsupported statement " + n.type);
      }
    };
    emit("Block", 0, 0, 0, { role: "region", region: ctx.name });
    for (const s of body) stmt(s);
    emit("End", 0, 0, 0, { role: "region", region: ctx.name });
    emit("Halt", 0, 0, 0, { region: ctx.name });
  };

  const mainStart = code.length;
  compileRegion(ast.body, { kind: "main", name: "main", locals: null });
  const mainCount = code.length - mainStart;
  fnNodes.forEach((f, fid) => {
    const locals = new Map(), localNames = [];
    const add = n => { if (!locals.has(n)) { locals.set(n, localNames.length); localNames.push(n); } };
    f.params.forEach(add); collectDecls(f.body?.body).forEach(add);
    const start = code.length;
    compileRegion(f.body?.body || [], { kind: "function", name: f.name, locals });
    functions.push({ id: fid, name: f.name, start, count: code.length - start, param_count: f.params.length, local_count: localNames.length, localNames });
  });
  return { version: VERSION, code, globals: Object.fromEntries(globals), globalNames, functions, main: { start: mainStart, count: mainCount } };
}

function instBytes(code) {
  const buf = new ArrayBuffer(code.length * 24), dv = new DataView(buf);
  code.forEach((x, i) => { const p = i * 24; dv.setInt32(p, x.op, true); dv.setInt32(p + 4, x.a | 0, true); dv.setInt32(p + 8, x.b | 0, true); dv.setInt32(p + 12, 0, true); dv.setFloat64(p + 16, Number(x.imm || 0), true); });
  return new Uint8Array(buf);
}
function funcBytes(funcs) {
  const buf = new ArrayBuffer(funcs.length * 16), dv = new DataView(buf);
  funcs.forEach((f, i) => { const p = i * 16; dv.setInt32(p, f.start, true); dv.setInt32(p + 4, f.count, true); dv.setInt32(p + 8, f.param_count, true); dv.setInt32(p + 12, f.local_count, true); });
  return new Uint8Array(buf);
}
function install(W, c) {
  const ib = instBytes(c.code), fb = funcBytes(c.functions);
  let p = 16384;
  const instPtr = p; p += ib.length; p = (p + 7) & ~7;
  const funcsPtr = p; p += fb.length; p = (p + 7) & ~7;
  const gvPtr = p; p += c.globalNames.length * 8; p = (p + 7) & ~7;
  const gtPtr = p; p += c.globalNames.length; p = (p + 7) & ~7;
  const gsPtr = p; p += c.globalNames.length; p = (p + 7) & ~7;
  if (W.memory.buffer.byteLength < p) W.memory.grow(Math.ceil((p - W.memory.buffer.byteLength) / 65536));
  new Uint8Array(W.memory.buffer, instPtr, ib.length).set(ib);
  new Uint8Array(W.memory.buffer, funcsPtr, fb.length).set(fb);
  new Float64Array(W.memory.buffer, gvPtr, c.globalNames.length).fill(0);
  new Uint8Array(W.memory.buffer, gtPtr, c.globalNames.length).fill(0);
  new Uint8Array(W.memory.buffer, gsPtr, c.globalNames.length).fill(0);
  return { instPtr, funcsPtr, gvPtr, gtPtr, gsPtr, instBytes: ib, funcBytes: fb };
}
function validate(W, c) {
  const L = install(W, c);
  const ok = W.i13_validate_program(L.instPtr, c.main.start, c.main.count, L.funcsPtr, c.functions.length) === 1;
  return { ok, peak: W.i13_val_peak(), error_pc: W.i13_val_error_pc(), error_code: W.i13_val_error_code(), error: VERR[W.i13_val_error_code()] || "UNKNOWN", error_region: W.i13_val_error_region(), regions: W.i13_val_regions(), layout: L };
}
function execute(W, c, stepLimit = 1000000, callLimit = 48) {
  const L = install(W, c);
  const rc = W.i13_vm_exec_program(L.instPtr, c.main.start, c.main.count, L.funcsPtr, c.functions.length, L.gvPtr, L.gtPtr, L.gsPtr, c.globalNames.length, stepLimit, callLimit);
  const vals = new Float64Array(W.memory.buffer, L.gvPtr, c.globalNames.length), tags = new Uint8Array(W.memory.buffer, L.gtPtr, c.globalNames.length), states = new Uint8Array(W.memory.buffer, L.gsPtr, c.globalNames.length);
  const globals = {};
  c.globalNames.forEach((n, i) => { if (states[i]) globals[n] = tags[i] === 2 ? `<func:${c.functions[Math.trunc(vals[i])]?.name || vals[i]}>` : vals[i]; });
  const trace = [];
  for (let i = 0; i < W.i13_trace_count(); i++) { const fid = W.i13_trace_func(i); trace.push({ event: TRACE[W.i13_trace_event(i)] || W.i13_trace_event(i), depth: W.i13_trace_depth(i), func_id: fid, func: fid >= 0 ? c.functions[fid]?.name : "main", pc: W.i13_trace_pc(i) }); }
  return { ok: rc === 1, rc, error: VMERR[String(rc)] || "UNKNOWN", error_pc: W.i13_vm_error_pc(), steps: W.i13_vm_steps(), peak: W.i13_vm_peak(), final_height: W.i13_vm_final_height(), max_call_depth: W.i13_vm_max_call_depth(), calls: W.i13_vm_calls(), last_func: W.i13_vm_last_func(), globals, trace, layout: L };
}
function callEdges(c) {
  const regionForPc = pc => c.functions.find(f => pc >= f.start && pc < f.start + f.count)?.name || "main";
  const edges = [];
  for (let pc = 0; pc < c.code.length; pc++) {
    const x = c.code[pc]; if (x.opName !== "Call") continue;
    let callee = "dynamic";
    for (let q = pc - 1; q >= Math.max(0, pc - x.a - 4); q--) {
      const y = c.code[q];
      if (y.opName === "Ask" && y.b === 1) { const name = c.globalNames[y.a]; if (c.functions.some(f => f.name === name)) { callee = name; break; } }
    }
    edges.push({ from: regionForPc(pc), to: callee, pc, argc: x.a });
  }
  return edges;
}

// ---- live test harness (in-process; re-measures every call) ----
const NATIVE_CASES = [
  ["simple call", `def add(I a, I b) {\n  -> a + b\n}\nI x <- add(2, 3)\n`, { x: 5 }],
  ["nested calls", `def add(I a, I b) {\n  -> a + b\n}\ndef twice(I x) {\n  -> add(x, x)\n}\nI y <- twice(7)\n`, { y: 14 }],
  ["locals + if", `def clamp(I x, I lo, I hi) {\n  if x < lo {\n    -> lo\n  }\n  if x > hi {\n    -> hi\n  }\n  I y <- x + 0\n  -> y\n}\nI z <- clamp(14, 0, 10)\n`, { z: 10 }],
  ["recursion", `def sumdown(I n) {\n  if n <= 0 {\n    -> 0\n  }\n  -> n + sumdown(n - 1)\n}\nI s <- sumdown(6)\n`, { s: 21 }],
  ["function alias", `def inc(I x) {\n  -> x + 1\n}\nI f <- inc\nI y <- f(9)\n`, { y: 10 }],
];
const SUITE_CASES = [
  ["Arithmetic", "I x <- 2 + 3 * 4\n", { x: 14 }],
  ["Osmotic", "I x <- 1\nx.p <- 4\n", { x: 5 }],
  ["If/Else", "I x <- 7\nif x > 5 { I y <- 1 } else { I y <- 0 }\n", { y: 1 }],
  ["Function", "def add(I a,I b){ -> a+b }\nI x <- add(2,3)\n", { x: 5 }],
  ["Nested call", "def inc(I x){ -> x+1 }\ndef twice(I x){ -> inc(inc(x)) }\nI y <- twice(7)\n", { y: 9 }],
  ["Recursion", "def sumdown(I n){ if n <= 0 { -> 0 } -> n + sumdown(n-1) }\nI s <- sumdown(6)\n", { s: 21 }],
  ["Alias", "def inc(I x){ -> x+1 }\nI f <- inc\nI y <- f(9)\n", { y: 10 }],
  ["Local + branch", "def clamp(I x,I lo,I hi){ if x < lo { -> lo } if x > hi { -> hi } I y <- x+0 -> y }\nI z <- clamp(14,0,10)\n", { z: 10 }],
];

let _wasmBytes = 0;
async function loadWasm() {
  const here = dirname(fileURLToPath(import.meta.url));
  const bytes = await readFile(join(here, "i13_cortex_vm_v03.wasm"));
  _wasmBytes = bytes.length;
  const { instance } = await WebAssembly.instantiate(bytes, {});
  return instance.exports;
}

let _W = null;
async function getInstance() { if (!_W) _W = await loadWasm(); return _W; }

export async function runNative() {
  const W = await getInstance();
  const tests = [];
  for (const [name, src, expect] of NATIVE_CASES) {
    const h = await R.read(src, name + ".i13");
    const c = compile(h.ast), v = validate(W, c), r = execute(W, c);
    const ok = v.ok && r.ok && Object.entries(expect).every(([k, val]) => r.globals[k] === val);
    tests.push({ name, pass: !!ok, detail: ok ? `regions=${v.regions} calls=${r.calls} depth=${r.max_call_depth} got=${JSON.stringify(r.globals)}` : `globals=${JSON.stringify(r && r.globals)} error=${r && r.error}` });
  }
  // boundary + architectural checks
  const bad = await R.read(`def f(I x) { -> x }\nI y <- f(1, 2)\n`);
  const bc = compile(bad.ast), bv = validate(W, bc), br = execute(W, bc);
  tests.push({ name: "arity remains runtime boundary", pass: bv.ok && !br.ok && br.error === "ARITY", detail: `validator=${bv.ok} runtime=${br.error}` });
  const reg = await R.read(`def a(I x){ -> x + 1 }\ndef b(I x){ -> a(x) }\nI z <- b(3)\n`);
  const rc = compile(reg.ast), rv = validate(W, rc), rr = execute(W, rc);
  tests.push({ name: "independent validation regions", pass: rv.ok && rv.regions === 3, detail: `regions=${rv.regions}` });
  tests.push({ name: "native call-frame trace", pass: rr.trace.some(x => x.event === "CALL") && rr.trace.some(x => x.event === "RET"), detail: `${rr.trace.length} events` });
  return { pass: tests.every(t => t.pass), passed: tests.filter(t => t.pass).length, total: tests.length, wasm_bytes: _wasmBytes, exports: Object.keys(W).sort(), tests, measured_at: new Date().toISOString() };
}

export async function runSuite() {
  const W = await getInstance();
  const tests = [];
  for (const [name, src, expect] of SUITE_CASES) {
    const h = await R.read(src, name + ".i13");
    const c = compile(h.ast), v = validate(W, c), r = v.ok ? execute(W, c) : null;
    const ok = v.ok && r && r.ok && Object.entries(expect).every(([k, val]) => r.globals[k] === val);
    tests.push({ name, pass: !!ok, detail: ok ? `regions=${v.regions} calls=${r.calls} expected=${JSON.stringify(expect)}` : `globals=${JSON.stringify(r && r.globals)} error=${r && r.error}` });
  }
  return { pass: tests.every(t => t.pass), passed: tests.filter(t => t.pass).length, total: tests.length, tests, measured_at: new Date().toISOString() };
}

export { VERSION, compile, validate, execute, callEdges };
