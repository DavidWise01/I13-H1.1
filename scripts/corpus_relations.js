'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const corpusDir = path.join(root, 'corpus', 'golden', '03_relations');
const semanticManifest = JSON.parse(fs.readFileSync(path.join(root, 'corpus', 'golden', '02_semantics', 'manifest.json'), 'utf8'));
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
  const hir = invoke(['dump', source, '--hir']);
  assert(hir.includes('I13 INTROSPECT HIR v0.1'), `${file} missing HIR checkpoint`);
  const runText = invoke(['run', source]);
  for (const [name, value] of Object.entries(expected)) {
    assert.strictEqual(globalNumber(runText, name), value, `${file} ${name}`);
  }
  const wasmPath = path.join(os.tmpdir(), `i13-relations-${file.replace(/[^A-Za-z0-9]+/g, '-')}.wasm`);
  invoke(['build', source, '-o', wasmPath]);
  await verifyWasm(wasmPath, expected);
  fs.rmSync(wasmPath, { force: true });
  return hir;
}

async function main() {
  assert.strictEqual(manifest.inherits.handoff, semanticManifest.composition.final, '03 relations does not inherit actual 02 semantics final');
  assert.strictEqual(manifest.composition.start, manifest.inherits.handoff, 'composition start differs from inherited handoff');
  assert.strictEqual(manifest.flay_notation_is_i13_syntax, false, 'FLAY notation must remain documentary');

  let previousOut = manifest.inherits.handoff;
  for (const rock of manifest.rocks) {
    assert.strictEqual(rock.in, previousOut, `river discontinuity before relation rock ${rock.index}`);
    const hir = await verifyProgram(rock.file, {
      RIVER_IN: rock.in,
      RIVER_OUT: rock.out,
      [rock.witness]: 1,
      RELATION_OK: 1,
    });
    if (rock.index === 6) {
      assert(hir.includes('Assign mode=osmotic target=mask'), 'fit mask must use osmotic accumulation');
    }
    if (rock.index === 7) {
      assert(hir.includes('Call reuse_chunk argc=2'), 'old-chunk recursion missing from HIR');
    }
    if (rock.index === 8) {
      assert(hir.includes('Call new_chunks argc=2'), 'new-chunk recursion missing from HIR');
      assert(hir.includes('Call gate argc=2'), 'blocked/open gate missing from HIR');
    }
    console.log(`RELATIONS ${String(rock.index).padStart(2, '0')} PASS · ${rock.in} |s| ${rock.out} · ${rock.adds}`);
    previousOut = rock.out;
  }

  assert.strictEqual(previousOut, manifest.composition.final, 'manifest final differs from last relation rock');

  const methodologyHir = await verifyProgram(manifest.methodology.file, manifest.methodology.expected);
  assert(methodologyHir.includes('Call flay_old_chunk argc=2'), 'methodology old-chunk recursion missing');
  assert(methodologyHir.includes('Call flay_new_chunks argc=2'), 'methodology new-chunk recursion missing');
  assert(methodologyHir.includes('Call flay_gate argc=2'), 'methodology gate missing');
  console.log('FLAY PASS · origin/up/down/left/right/origin · reuse recursion · new recursion · blocked/open gate');

  await verifyProgram(manifest.composition.file, {
    RIVER_START: manifest.composition.start,
    RIVER_OK: manifest.composition.ok,
    RIVER_FINAL: manifest.composition.final,
  });

  console.log(`RELATIONS RIVER PASS · inherits=${manifest.inherits.handoff} · ${manifest.rocks.length} rocks · final=${manifest.composition.final} · FLAY methodology · HIR · VM=WASM`);
}

main().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
