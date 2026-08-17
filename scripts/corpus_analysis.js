'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const corpusDir = path.join(root, 'corpus', 'golden', '04_analysis');
const relationsDir = path.join(root, 'corpus', 'golden', '03_relations');
const relationsManifest = JSON.parse(fs.readFileSync(path.join(relationsDir, 'manifest.json'), 'utf8'));
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

async function verifyProgram(directory, file, expected, label) {
  const source = path.join(directory, file);
  invoke(['check', source]);
  const hir = invoke(['dump', source, '--hir']);
  assert(hir.includes('I13 INTROSPECT HIR v0.1'), `${file} missing HIR checkpoint`);
  const runText = invoke(['run', source]);
  for (const [name, value] of Object.entries(expected)) {
    assert.strictEqual(globalNumber(runText, name), value, `${file} ${name}`);
  }
  const wasmPath = path.join(os.tmpdir(), `i13-${label}-${file.replace(/[^A-Za-z0-9]+/g, '-')}.wasm`);
  invoke(['build', source, '-o', wasmPath]);
  await verifyWasm(wasmPath, expected);
  fs.rmSync(wasmPath, { force: true });
  return hir;
}

async function main() {
  assert.strictEqual(manifest.inherits.handoff, relationsManifest.composition.final, '04 analysis does not inherit actual 03 relations final');
  assert.strictEqual(manifest.composition.start, manifest.inherits.handoff, 'analysis composition start differs from inherited handoff');
  assert.strictEqual(manifest.analysis_notation_is_i13_syntax, false, 'analysis documentary notation must not become grammar');

  await verifyProgram(relationsDir, relationsManifest.methodology.file, {
    FLAY_SATISFIED: 1,
    FLAY_OPEN_VALUE: 13,
    FLAY_OK: 1,
  }, 'analysis-upstream-flay');
  console.log('UPSTREAM FLAY PASS · FLAY_SATISFIED=1 · analysis wall may open');

  let previousOut = manifest.inherits.handoff;
  for (const rock of manifest.rocks) {
    assert.strictEqual(rock.in, previousOut, `river discontinuity before analysis rock ${rock.index}`);
    const hir = await verifyProgram(corpusDir, rock.file, {
      RIVER_IN: rock.in,
      RIVER_OUT: rock.out,
      [rock.witness]: 1,
      ANALYSIS_OK: 1,
    }, 'analysis');
    if (rock.index === 5) {
      assert(hir.includes('Assign mode=osmotic target=count'), 'coverage must accumulate admitted cardinal fits');
    }
    if (rock.index === 6) {
      assert(hir.includes('Call repeat_sum argc=2'), 'recursive analysis accumulation missing');
    }
    if (rock.index === 8) {
      assert(hir.includes('Call profile argc=1'), 'composed analysis profile missing');
      assert(hir.includes('Call recurrence argc=3'), 'profile recurrence measure missing');
    }
    console.log(`ANALYSIS ${String(rock.index).padStart(2, '0')} PASS · ${rock.in} |s| ${rock.out} · ${rock.adds}`);
    previousOut = rock.out;
  }

  assert.strictEqual(previousOut, manifest.composition.final, 'manifest final differs from last analysis rock');

  const methodHir = await verifyProgram(corpusDir, manifest.method.file, manifest.method.expected, 'analysis-method');
  assert(methodHir.includes('Call analysis_profile argc=1'), 'analysis profile gate missing');
  assert(methodHir.includes('Call repeat_sum argc=2'), 'recursive measure missing from analysis method');
  console.log('ANALYSIS METHOD PASS · blocked/admitted tag · interval · direction · rhythm · rate · coverage · recurrence · closure · profile');

  await verifyProgram(corpusDir, manifest.composition.file, {
    RIVER_START: manifest.composition.start,
    RIVER_OK: manifest.composition.ok,
    RIVER_FINAL: manifest.composition.final,
  }, 'analysis-river');

  console.log(`ANALYSIS RIVER PASS · inherits=${manifest.inherits.handoff} · ${manifest.rocks.length} rocks · final=${manifest.composition.final} · upstream FLAY · HIR · VM=WASM`);
}

main().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
