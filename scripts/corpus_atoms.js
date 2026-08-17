'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const corpusDir = path.join(root, 'corpus', 'golden', '00_atoms');
const manifest = JSON.parse(fs.readFileSync(path.join(corpusDir, 'manifest.json'), 'utf8'));
const i13 = process.argv[2] || path.join(root, 'target', 'debug', 'i13');

function invoke(args) {
  const r = spawnSync(i13, args, { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) {
    process.stderr.write(r.stdout || '');
    process.stderr.write(r.stderr || '');
    throw new Error(`i13 ${args.join(' ')} exited ${r.status}`);
  }
  return `${r.stdout || ''}\n${r.stderr || ''}`;
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

async function verifyProgram(file, expected) {
  const source = path.join(corpusDir, file);
  invoke(['check', source]);
  const runText = invoke(['run', source]);
  for (const [name, value] of Object.entries(expected)) {
    assert.strictEqual(globalNumber(runText, name), value, `${file} ${name}`);
  }

  const wasmPath = path.join(os.tmpdir(), `i13-${file.replace(/[^A-Za-z0-9]+/g, '-')}.wasm`);
  invoke(['build', source, '-o', wasmPath]);
  await verifyWasm(wasmPath, expected);
  fs.rmSync(wasmPath, { force: true });
}

async function main() {
  let previousOut = null;
  for (const rock of manifest.rocks) {
    if (previousOut !== null) {
      assert.strictEqual(rock.in, previousOut, `river discontinuity before rock ${rock.index}`);
    }
    await verifyProgram(rock.file, { RIVER_IN: rock.in, RIVER_OUT: rock.out });
    console.log(`ROCK ${String(rock.index).padStart(2, '0')} PASS · ${rock.in} |s| ${rock.out} · ${rock.adds}`);
    previousOut = rock.out;
  }

  assert.strictEqual(previousOut, manifest.composition.final, 'manifest final differs from last rock');
  await verifyProgram(manifest.composition.file, {
    RIVER_OK: manifest.composition.ok,
    RIVER_FINAL: manifest.composition.final,
  });

  console.log(`RIVER PASS · ${manifest.rocks.length} rocks · final=${manifest.composition.final} · VM=WASM · repeat deterministic`);
}

main().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
