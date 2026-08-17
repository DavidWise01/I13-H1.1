#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const manifestPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'tests', 'conformance', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const bin = process.env.I13_BIN || path.join(root, 'target', 'debug', 'i13');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'i13-conformance-'));

function fail(message, detail = '') {
  console.error(`CONFORMANCE FAIL · ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

function cli(args) {
  return spawnSync(bin, args, {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });
}

function combined(result) {
  return `${result.stdout || ''}${result.stderr || ''}`;
}

function expectStatus(result, ok, label) {
  const succeeded = result.status === 0;
  if (succeeded !== ok) {
    fail(`${label} expected ${ok ? 'success' : 'failure'} but exit=${result.status}`, combined(result));
  }
}

function expectDiagnostic(result, caseDef, label) {
  const text = combined(result);
  if (!text.includes(caseDef.code)) {
    fail(`${label} expected diagnostic ${caseDef.code}`, text);
  }

  if (caseDef.phase && caseDef.category) {
    const header = `error[${caseDef.code}] ${caseDef.phase}/${caseDef.category}:`;
    if (!text.includes(header)) {
      fail(`${label} expected diagnostic header ${header}`, text);
    }
  }

  if (caseDef.line) {
    const location = new RegExp(`\\s-->\\s.*:${caseDef.line}:\\d+`);
    if (!location.test(text)) {
      fail(`${label} expected source location on line ${caseDef.line}`, text);
    }
  }

  if (caseDef.source) {
    const sourceLine = `${caseDef.line} | ${caseDef.source}`;
    if (!text.includes(sourceLine)) {
      fail(`${label} expected source excerpt ${sourceLine}`, text);
    }
  }

  if (!text.includes('^')) {
    fail(`${label} expected marked source span`, text);
  }
}

function parseNumericGlobals(stdout) {
  const globals = new Map();
  for (const line of stdout.split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*) = (-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)$/.exec(line.trim());
    if (match) globals.set(match[1], Number(match[2]));
  }
  return globals;
}

function expectGlobals(actual, expected, label) {
  for (const [name, value] of Object.entries(expected || {})) {
    if (!actual.has(name)) fail(`${label} missing global ${name}`);
    const got = actual.get(name);
    if (!Object.is(got, value) && got !== value) {
      fail(`${label} global ${name}: expected ${value}, got ${got}`);
    }
  }
}

function buildWasm(caseDef, sourcePath) {
  const target = path.join(work, `${caseDef.id}.wasm`);
  const build = cli(['build', sourcePath, '-o', target]);
  expectStatus(build, true, `${caseDef.id} build`);
  const bytes = fs.readFileSync(target);
  return new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
}

function wasmGlobals(instance, expected) {
  const globals = new Map();
  for (const name of Object.keys(expected || {})) {
    const valueExport = instance.exports[`i13.global.${name}`];
    const kindExport = instance.exports[`i13.kind.${name}`];
    if (!valueExport || !kindExport) fail(`Wasm missing exported I13 global ${name}`);
    if (kindExport.value !== 0) fail(`Wasm global ${name} expected NUMBER kind=0, got ${kindExport.value}`);
    globals.set(name, valueExport.value);
  }
  return globals;
}

function expectWasmTrap(instance, label) {
  try {
    instance.exports.i13_run();
  } catch (error) {
    if (error instanceof WebAssembly.RuntimeError) return;
    fail(`${label} threw non-Wasm error`, `${error && error.stack ? error.stack : error}`);
  }
  fail(`${label} expected Wasm trap but execution completed`);
}

let passed = 0;

for (const caseDef of manifest.cases) {
  const sourcePath = path.resolve(root, caseDef.file);
  if (!fs.existsSync(sourcePath)) fail(`${caseDef.id} missing source ${caseDef.file}`);

  if (caseDef.class === 'compile_error') {
    const check = cli(['check', sourcePath]);
    expectStatus(check, false, `${caseDef.id} check`);
    expectDiagnostic(check, caseDef, `${caseDef.id} check`);
  } else if (caseDef.class === 'execute') {
    const check = cli(['check', sourcePath]);
    expectStatus(check, true, `${caseDef.id} check`);

    const run = cli(['run', sourcePath]);
    expectStatus(run, true, `${caseDef.id} reference VM`);
    expectGlobals(parseNumericGlobals(run.stdout), caseDef.globals, `${caseDef.id} VM`);

    const instance = buildWasm(caseDef, sourcePath);
    instance.exports.i13_run();
    expectGlobals(wasmGlobals(instance, caseDef.globals), caseDef.globals, `${caseDef.id} Wasm run1`);
    instance.exports.i13_run();
    expectGlobals(wasmGlobals(instance, caseDef.globals), caseDef.globals, `${caseDef.id} Wasm run2`);
  } else if (caseDef.class === 'runtime_error' || caseDef.class === 'resource_error') {
    const check = cli(['check', sourcePath]);
    expectStatus(check, true, `${caseDef.id} check`);

    const run = cli(['run', sourcePath]);
    expectStatus(run, false, `${caseDef.id} reference VM`);
    expectDiagnostic(run, caseDef, `${caseDef.id} reference VM`);

    const instance = buildWasm(caseDef, sourcePath);
    expectWasmTrap(instance, `${caseDef.id} Wasm`);
  } else {
    fail(`${caseDef.id} unknown conformance class ${caseDef.class}`);
  }

  passed += 1;
  console.log(`PASS ${caseDef.id} · ${caseDef.class} · ${caseDef.file}`);
}

console.log(`I13 CONFORMANCE PASS · ${manifest.version} · ${passed}/${manifest.cases.length} cases`);
