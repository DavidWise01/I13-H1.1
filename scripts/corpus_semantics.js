'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const corpusDir = path.join(root, 'corpus', 'golden', '02_semantics');
const syntaxManifest = JSON.parse(fs.readFileSync(path.join(root, 'corpus', 'golden', '01_syntax', 'manifest.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(corpusDir, 'manifest.json'), 'utf8'));
const i13 = process.argv[2] || path.join(root, 'target', 'debug', 'i13');

function call(args) {
  return spawnSync(i13, args, { cwd: root, encoding: 'utf8' });
}

function invoke(args) {
  const r = call(args);
  if (r.status !== 0) {
    process.stderr.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
    throw new Error(`i13 ${args.join(' ')} exited ${r.status}`);
  }
  return `${r.stdout || ''}\n${r.stderr || ''}`;
}

function expectFailure(args, code) {
  const r = call(args);
  assert.notStrictEqual(r.status, 0, `expected i13 ${args.join(' ')} to fail`);
  const text = `${r.stdout || ''}\n${r.stderr || ''}`;
  assert(text.includes(`error[${code}]`), `missing ${code} in ${args.join(' ')}\n${text}`);
  return text;
}

function globalNumber(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`^${escaped} = (-?(?:\\d+(?:\\.\\d+)?|\\.\\d+))$`, 'm'));
  assert(match, `missing global ${name}`);
  return Number(match[1]);
}

async function verifyWasm(wasmPath, expected) {
  const bytes = fs.readFileSync(wasmPath);
  assert.strictEqual(WebAssembly.validate(bytes), true, `${wasmPath} is invalid Wasm`);
  const { instance } = await WebAssembly.instantiate(bytes, {});
  assert.strictEqual(typeof instance.exports.i13_run, 'function', 'i13_run export missing');
  const verify = () => {
    for (const [name, value] of Object.entries(expected)) {
      const g = instance.exports[`i13.global.${name}`];
      const state = instance.exports[`i13.state.${name}`];
      assert(g instanceof WebAssembly.Global, `missing i13.global.${name}`);
      assert(state instanceof WebAssembly.Global, `missing i13.state.${name}`);
      assert.strictEqual(state.value, 1, `${name} not bound`);
      assert.strictEqual(g.value, value, `${name} mismatch`);
    }
  };
  instance.exports.i13_run();
  verify();
  instance.exports.i13_run();
  verify();
}

async function verifyWasmTrap(wasmPath) {
  const bytes = fs.readFileSync(wasmPath);
  assert.strictEqual(WebAssembly.validate(bytes), true, `${wasmPath} is invalid Wasm`);
  const { instance } = await WebAssembly.instantiate(bytes, {});
  assert.throws(() => instance.exports.i13_run(), WebAssembly.RuntimeError);
}

async function verifyProgram(file, expected) {
  const source = path.join(corpusDir, file);
  invoke(['check', source]);
  const hir = invoke(['dump', source, '--hir']);
  assert(hir.includes('I13 INTROSPECT HIR v0.1'), `${file} missing HIR checkpoint`);
  const runText = invoke(['run', source]);
  for (const [name, value] of Object.entries(expected)) {
    assert.strictEqual(globalNumber(runText, name), value, `${file} ${name}`);
  }
  const wasmPath = path.join(os.tmpdir(), `i13-semantics-${file.replace(/[^A-Za-z0-9]+/g, '-')}.wasm`);
  invoke(['build', source, '-o', wasmPath]);
  await verifyWasm(wasmPath, expected);
  fs.rmSync(wasmPath, { force: true });
  return hir;
}

async function verifyRuntimeVeto(file, code) {
  const source = path.join(corpusDir, file);
  invoke(['check', source]);
  expectFailure(['run', source], code);
  const wasmPath = path.join(os.tmpdir(), `i13-semantics-veto-${file.replace(/[^A-Za-z0-9]+/g, '-')}.wasm`);
  invoke(['build', source, '-o', wasmPath]);
  await verifyWasmTrap(wasmPath);
  fs.rmSync(wasmPath, { force: true });
}

async function main() {
  assert.strictEqual(manifest.inherits.handoff, syntaxManifest.composition.final, '02 semantics does not inherit actual 01 syntax final');
  assert.strictEqual(manifest.composition.start, manifest.inherits.handoff, 'composition start differs from inherited handoff');

  let previousOut = manifest.inherits.handoff;
  for (const rock of manifest.rocks) {
    assert.strictEqual(rock.in, previousOut, `river discontinuity before semantic rock ${rock.index}`);
    const hir = await verifyProgram(rock.file, {
      RIVER_IN: rock.in,
      RIVER_OUT: rock.out,
      [rock.witness]: 1,
      SEMANTIC_OK: 1,
    });
    if (rock.index === 1) {
      assert(/Compare Eq[\s\S]*BinOp Add[\s\S]*Constant 2[\s\S]*BinOp Mul[\s\S]*Constant 3[\s\S]*Constant 4/.test(hir), 'precedence HIR shape drifted');
    }
    if (rock.index === 4) {
      assert(hir.includes('Assign mode=assign target=replace_value'), 'ordinary assignment HIR meaning missing');
      assert(hir.includes('Assign mode=osmotic target=osmotic_value'), 'osmotic HIR meaning missing');
    }
    console.log(`SEMANTICS ${String(rock.index).padStart(2, '0')} PASS · ${rock.in} |s| ${rock.out} · ${rock.adds}`);
    previousOut = rock.out;
  }

  assert.strictEqual(previousOut, manifest.composition.final, 'manifest final differs from last semantic rock');
  await verifyProgram(manifest.lens.file, manifest.lens.expected);
  console.log('ADA LENS PASS · analysis/music/reason -> boolean · executable I13');

  await verifyRuntimeVeto('00_representation_veto.i13', 'E0501');
  console.log('BANK 00 PASS · Function + Number -> E0501 / Wasm trap');
  expectFailure(['check', path.join(corpusDir, '06_arity_veto.i13')], 'E0203');
  console.log('BANK 06 PASS · arity mismatch -> E0203');
  expectFailure(['check', path.join(corpusDir, '07_unknown_veto.i13')], 'E0202');
  console.log('BANK 07 PASS · unknown function -> E0202');

  await verifyProgram(manifest.composition.file, {
    RIVER_START: manifest.composition.start,
    RIVER_OK: manifest.composition.ok,
    RIVER_FINAL: manifest.composition.final,
  });

  console.log(`SEMANTICS RIVER PASS · inherits=${manifest.inherits.handoff} · ${manifest.rocks.length} rocks · final=${manifest.composition.final} · HIR checkpoint · VM=WASM`);
}

main().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
