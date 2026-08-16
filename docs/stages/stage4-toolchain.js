/* I13 H1.1 — Stage 4: Normalizer / Python / Wasm exploded views.
 *
 * Stage 3 Reader + IVM remains untouched. Stage 4 mounts only:
 *   norm, python, wasm1, wasm2
 *
 * Live integrations deliberately reuse the existing SVG runtime controls:
 *   PY ENGINE     -> existing Pyodide/CPython AST check
 *   WASM SELFTEST -> existing embedded Wasm micro-core self-test
 *
 * Historical test counts shown here are reference metadata, not rerun claims.
 */
(() => {
  'use strict';

  const MODULE_IDS = Object.freeze(['norm', 'python', 'wasm1', 'wasm2']);
  const CANONICAL_OPCODES = Object.freeze([
    'Const', 'Ask', 'Attr', 'Ret', 'Answer', 'Drop', 'Bin', 'Cmp',
    'If', 'Call', 'Block', 'Else', 'End', 'Func', 'Halt'
  ]);

  function svgDoc() {
    return document.getElementById('i13')?.contentDocument || null;
  }

  function panel(moduleId) {
    return svgDoc()?.querySelector(`.i13-exploded-panel[data-exploded-for="${moduleId}"]`) || null;
  }

  function sectionRows(moduleId, sectionIndex) {
    const p = panel(moduleId);
    const section = p?.querySelectorAll('.ev-section-group')?.[sectionIndex];
    return section ? Array.from(section.querySelectorAll('.ev-row, .ev-row-muted')) : [];
  }

  function machineRows(moduleId) {
    const p = panel(moduleId);
    if (!p) return [];
    const machine = p.querySelector('.ev-machine');
    if (!machine) return [];
    const y = Number(machine.getAttribute('y')) || 0;
    return Array.from(p.querySelectorAll('text.ev-row, text.ev-row-muted'))
      .filter(node => (Number(node.getAttribute('y')) || 0) > y + 20);
  }

  function setSection(moduleId, sectionIndex, rowIndex, text) {
    const row = sectionRows(moduleId, sectionIndex)[rowIndex];
    if (row) row.textContent = text;
  }

  function setMachine(moduleId, rowIndex, text) {
    const row = machineRows(moduleId)[rowIndex];
    if (row) row.textContent = text;
  }

  function clickSvgAction(action) {
    const doc = svgDoc();
    const target = doc?.querySelector(`[data-act="${action}"]`);
    if (!target) return false;
    const ViewMouseEvent = doc.defaultView?.MouseEvent || MouseEvent;
    target.dispatchEvent(new ViewMouseEvent('click', { bubbles: true, cancelable: true, view: doc.defaultView }));
    return true;
  }

  function readSvgText(id) {
    return svgDoc()?.getElementById(id)?.textContent?.trim() || '';
  }

  async function waitForText(id, done, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const text = readSvgText(id);
      if (done(text)) return text;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    return readSvgText(id) || 'timeout';
  }

  // ---------------------------------------------------------------------------
  // Normalizer / Validator
  // ---------------------------------------------------------------------------

  function normalizerReferenceReceipt() {
    setSection('norm', 2, 0, 'provenance · COMPLETE');
    setSection('norm', 2, 1, 'reference suite · 12/12 PASS');
    setSection('norm', 2, 2, 'validation region · h = 0');
    setSection('norm', 2, 3, 'loss policy · preserve, never guess');
    setSection('norm', 3, 0, 'canonical handoff · READY');
    setSection('norm', 3, 1, 'receipt · provenance complete');
    setSection('norm', 3, 2, 'status · REFERENCE PASS');
    setMachine('norm', 0, 'REFERENCE  normalizer v0.2 · 12/12 PASS');
    setMachine('norm', 1, 'REGION     top-level/function validation starts h = 0');
    setMachine('norm', 2, 'CONTROL    Block / If / Else / End depth targets');
    setMachine('norm', 3, 'BOUNDARY   unsupported input is preserved, not guessed');
  }

  function normalizerReset() {
    setSection('norm', 2, 0, 'provenance · waiting');
    setSection('norm', 2, 1, 'reference suite · 12/12 recorded');
    setSection('norm', 2, 2, 'validation region · h = 0');
    setSection('norm', 2, 3, 'loss policy · preserve');
    setSection('norm', 3, 0, 'canonical handoff · pending inspection');
    setSection('norm', 3, 1, 'receipt · waiting');
    setSection('norm', 3, 2, 'status · IDLE');
    setMachine('norm', 0, 'REFERENCE  press RECEIPT to expose frozen v0.2 status');
  }

  function mountNormalizer() {
    window.I13Exploded.mount('norm', {
      title: 'NORMALIZER + VALIDATOR · EXPLODED',
      subtitle: 'reader handoff → canonical form → validation region → receipt',
      family: 'i13',
      expanded: false,
      input: [
        'reader handoff',
        'source + byte provenance',
        'AST / canonical candidates'
      ],
      pipeline: [
        'NORMALIZE · deterministic canonical form',
        'MAP · preserve provenance',
        'VALIDATE · one region at a time',
        'CONTROL · depth-targeted blocks'
      ],
      state: [
        'provenance · waiting',
        'reference suite · 12/12 recorded',
        'validation region · h = 0',
        'loss policy · preserve'
      ],
      output: [
        'canonical handoff · pending inspection',
        'receipt · waiting',
        'status · IDLE'
      ],
      machine: [
        'REFERENCE  press RECEIPT to expose frozen v0.2 status',
        'REGION     top-level/function validation starts h = 0',
        'CONTROL    Block / If / Else / End depth targets',
        'BOUNDARY   unsupported input is preserved, not guessed'
      ],
      controls: [
        { id: 'norm-reset', label: 'RESET', onClick: normalizerReset },
        { id: 'norm-receipt', label: 'RECEIPT', onClick: normalizerReferenceReceipt }
      ]
    });
  }

  // ---------------------------------------------------------------------------
  // Python ingress / roundtrip
  // ---------------------------------------------------------------------------

  function pythonReset() {
    setSection('python', 2, 0, 'engine · idle');
    setSection('python', 2, 1, 'AST · pending');
    setSection('python', 2, 2, 'I-13 adapter · pending');
    setSection('python', 2, 3, 'provenance · preserved by adapter');
    setSection('python', 3, 0, 'I-13 · pending');
    setSection('python', 3, 1, 'roundtrip · 12/12 recorded');
    setSection('python', 3, 2, 'runtime · not requested');
    setMachine('python', 0, 'LIVE       uses the existing SVG PY ENGINE / Pyodide control');
    setMachine('python', 1, 'REFERENCE  ingress v0.1 · 10/10 PASS');
    setMachine('python', 2, 'REFERENCE  Python → I13 → Python · 12/12 PASS');
    setMachine('python', 3, 'STATUS     idle');
  }

  async function runPythonEngine() {
    setSection('python', 2, 0, 'engine · loading / running');
    setSection('python', 3, 2, 'runtime · requested');
    setMachine('python', 3, 'STATUS     handing off to existing SVG Pyodide engine…');

    if (!clickSvgAction('pytest')) {
      setSection('python', 2, 0, 'engine · unavailable');
      setMachine('python', 3, 'STATUS     SVG PY ENGINE control not found');
      return;
    }

    const result = await waitForText('py-runtime', text =>
      /^PY:\s+(PASS|unavailable)/.test(text), 35000);

    const pass = /^PY:\s+PASS/.test(result);
    setSection('python', 2, 0, `engine · ${pass ? 'PASS' : 'UNAVAILABLE'}`);
    setSection('python', 2, 1, `AST · ${pass ? 'CPython AST executed' : 'not confirmed'}`);
    setSection('python', 2, 2, 'I-13 adapter · reference boundary unchanged');
    setSection('python', 3, 0, 'I-13 · adapter is separate from live AST smoke');
    setSection('python', 3, 2, `runtime · ${result}`);
    setMachine('python', 3, `STATUS     ${result}`);
  }

  function mountPython() {
    window.I13Exploded.mount('python', {
      title: 'PYTHON INGRESS + ROUNDTRIP · EXPLODED',
      subtitle: 'CPython AST → I-13 adapter → canonical handoff / roundtrip',
      family: 'python',
      expanded: false,
      input: [
        'Python source',
        'demo · x = 1 + 2',
        'UTF-8 byte provenance'
      ],
      pipeline: [
        'CPython AST',
        'INGRESS ADAPTER · Python → I-13',
        'unsupported syntax · preserve, do not guess',
        'ROUNDTRIP · I-13 → Python projection'
      ],
      state: [
        'engine · idle',
        'AST · pending',
        'I-13 adapter · pending',
        'provenance · preserved by adapter'
      ],
      output: [
        'I-13 · pending',
        'roundtrip · 12/12 recorded',
        'runtime · not requested'
      ],
      machine: [
        'LIVE       uses the existing SVG PY ENGINE / Pyodide control',
        'REFERENCE  ingress v0.1 · 10/10 PASS',
        'REFERENCE  Python → I13 → Python · 12/12 PASS',
        'STATUS     idle'
      ],
      controls: [
        { id: 'py-reset', label: 'RESET', onClick: pythonReset },
        { id: 'py-live', label: 'PY ENGINE', onClick: runPythonEngine }
      ]
    });
  }

  // ---------------------------------------------------------------------------
  // Browser-native Wasm v0.1
  // ---------------------------------------------------------------------------

  function wasm1Reset() {
    setSection('wasm1', 2, 0, 'embedded core · idle');
    setSection('wasm1', 2, 1, 'Cortex rule mask · waiting');
    setSection('wasm1', 2, 2, 'execution address · waiting');
    setSection('wasm1', 2, 3, 'host boundary · browser native');
    setSection('wasm1', 3, 0, 'verdict · pending');
    setSection('wasm1', 3, 1, 'current Pages self-test · not requested');
    setSection('wasm1', 3, 2, 'historical v0.1 · 14/14 combined recorded');
    setMachine('wasm1', 0, 'HISTORICAL v0.1 · primitives 8/8 + pipeline 6/6');
    setMachine('wasm1', 1, 'HISTORICAL module · 1193 bytes · mask 0x3f');
    setMachine('wasm1', 2, 'CURRENT    Pages embeds a separate OLOGY/CV/Pulse micro-core');
    setMachine('wasm1', 3, 'STATUS     idle');
  }

  async function runWasmSelfTest() {
    setSection('wasm1', 2, 0, 'embedded core · running');
    setSection('wasm1', 3, 1, 'current Pages self-test · running');
    setMachine('wasm1', 3, 'STATUS     handing off to existing SVG WASM SELFTEST…');

    if (!clickSvgAction('wasmtest')) {
      setSection('wasm1', 2, 0, 'embedded core · unavailable');
      setMachine('wasm1', 3, 'STATUS     SVG WASM SELFTEST control not found');
      return;
    }

    const result = await waitForText('runtime', text =>
      /^WASM:\s+(PASS|FAIL)/.test(text), 5000);
    const pass = /^WASM:\s+PASS/.test(result);
    setSection('wasm1', 2, 0, `embedded core · ${pass ? 'PASS' : 'FAIL'}`);
    setSection('wasm1', 2, 1, 'Cortex rule mask · historical v0.1 = 0x3f');
    setSection('wasm1', 2, 2, 'execution address · historical pipeline produced');
    setSection('wasm1', 3, 0, `verdict · ${pass ? 'current micro-core PASS' : 'current micro-core FAIL'}`);
    setSection('wasm1', 3, 1, `current Pages self-test · ${result}`);
    setMachine('wasm1', 3, `STATUS     ${result}`);
  }

  function mountWasm1() {
    window.I13Exploded.mount('wasm1', {
      title: 'BROWSER-NATIVE WASM · EXPLODED',
      subtitle: 'semantic projection → Wasm Cortex → rule mask → verdict',
      family: 'wasm',
      expanded: false,
      input: [
        'canonical I-13 semantic projection',
        'identity / capability request',
        'browser session state'
      ],
      pipeline: [
        'Wasm MVP load',
        'semantic identity / fingerprint',
        'Cortex deterministic gates',
        'execution address + final rule mask'
      ],
      state: [
        'embedded core · idle',
        'Cortex rule mask · waiting',
        'execution address · waiting',
        'host boundary · browser native'
      ],
      output: [
        'verdict · pending',
        'current Pages self-test · not requested',
        'historical v0.1 · 14/14 combined recorded'
      ],
      machine: [
        'HISTORICAL v0.1 · primitives 8/8 + pipeline 6/6',
        'HISTORICAL module · 1193 bytes · mask 0x3f',
        'CURRENT    Pages embeds a separate OLOGY/CV/Pulse micro-core',
        'STATUS     idle'
      ],
      controls: [
        { id: 'wasm1-reset', label: 'RESET', onClick: wasm1Reset },
        { id: 'wasm1-live', label: 'WASM SELFTEST', onClick: runWasmSelfTest }
      ]
    });
  }

  // ---------------------------------------------------------------------------
  // Wasm validator + numeric VM v0.2
  // ---------------------------------------------------------------------------

  function validatorReferenceCheck() {
    const countOk = CANONICAL_OPCODES.length === 15;
    const noBr = !CANONICAL_OPCODES.includes('br') && !CANONICAL_OPCODES.includes('Br');
    const pass = countOk && noBr;
    setSection('wasm2', 2, 0, `opcode count · ${CANONICAL_OPCODES.length}`);
    setSection('wasm2', 2, 1, `br opcode · ${noBr ? 'ABSENT' : 'FOUND'}`);
    setSection('wasm2', 2, 2, 'region start · h = 0');
    setSection('wasm2', 2, 3, 'numeric value · f64');
    setSection('wasm2', 3, 0, `reference invariant check · ${pass ? 'PASS' : 'FAIL'}`);
    setSection('wasm2', 3, 1, 'recorded v0.2 suite · 9/9 PASS');
    setSection('wasm2', 3, 2, 'call arity · runtime boundary');
    setMachine('wasm2', 0, `OPCODES    ${CANONICAL_OPCODES.join(' ')}`);
    setMachine('wasm2', 1, `CHECK      count=${CANONICAL_OPCODES.length} · br=${noBr ? 'no' : 'yes'} · ${pass ? 'PASS' : 'FAIL'}`);
    setMachine('wasm2', 2, 'CONTROL    Block / If / Else / End use depth targets');
    setMachine('wasm2', 3, 'BOUNDARY   each top-level/function region begins h = 0');
  }

  function validatorReset() {
    setSection('wasm2', 2, 0, 'opcode count · waiting');
    setSection('wasm2', 2, 1, 'br opcode · waiting');
    setSection('wasm2', 2, 2, 'region start · h = 0');
    setSection('wasm2', 2, 3, 'numeric value · f64');
    setSection('wasm2', 3, 0, 'reference invariant check · idle');
    setSection('wasm2', 3, 1, 'recorded v0.2 suite · 9/9 PASS');
    setSection('wasm2', 3, 2, 'call arity · runtime boundary');
    setMachine('wasm2', 0, 'OPCODES    press CHECK to enumerate canonical baseline');
    setMachine('wasm2', 1, 'CHECK      idle');
  }

  function mountWasm2() {
    window.I13Exploded.mount('wasm2', {
      title: 'WASM VALIDATOR + NUMERIC VM · EXPLODED',
      subtitle: 'opcode stream → region validation → numeric VM → result',
      family: 'wasm',
      expanded: false,
      input: [
        'I-13 opcode stream',
        'top-level or function validation region',
        'f64 constants / numeric state'
      ],
      pipeline: [
        'VALIDATE · region starts h = 0',
        'DEPTH · control targets',
        'EXECUTE · numeric VM',
        'CALL · arity enforced at runtime boundary'
      ],
      state: [
        'opcode count · waiting',
        'br opcode · waiting',
        'region start · h = 0',
        'numeric value · f64'
      ],
      output: [
        'reference invariant check · idle',
        'recorded v0.2 suite · 9/9 PASS',
        'call arity · runtime boundary'
      ],
      machine: [
        'OPCODES    press CHECK to enumerate canonical baseline',
        'CHECK      idle',
        'CONTROL    Block / If / Else / End use depth targets',
        'BOUNDARY   each top-level/function region begins h = 0'
      ],
      controls: [
        { id: 'wasm2-reset', label: 'RESET', onClick: validatorReset },
        { id: 'wasm2-check', label: 'CHECK', onClick: validatorReferenceCheck }
      ]
    });
  }

  function mountAll() {
    if (!window.I13Exploded?.isReady?.()) return false;
    mountNormalizer();
    mountPython();
    mountWasm1();
    mountWasm2();
    return true;
  }

  function selfTest() {
    const checks = [
      { name: 'four Stage 4 modules', pass: MODULE_IDS.length === 4 },
      { name: 'canonical opcode count', pass: CANONICAL_OPCODES.length === 15 },
      { name: 'no br opcode', pass: !CANONICAL_OPCODES.includes('br') && !CANONICAL_OPCODES.includes('Br') },
      { name: 'Reader not remounted', pass: !MODULE_IDS.includes('reader') },
      { name: 'deeper stages untouched', pass: ['jit','gfx','child','pulse','vh1','vh2','freeze','corpus','ology'].every(id => !MODULE_IDS.includes(id)) }
    ];
    return Object.freeze({ pass: checks.every(item => item.pass), checks });
  }

  window.I13Stage4 = Object.freeze({
    version: '0.1.0',
    moduleIds: MODULE_IDS,
    selfTest,
    mountAll
  });

  if (window.I13Exploded?.isReady?.()) mountAll();
  else window.addEventListener('i13-exploded-ready', mountAll, { once: true });
})();
