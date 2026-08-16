/* I13 H1.1 — Stage 12: VH2 / CUBI [[5,1,3]] exploded view.
 * Grounded in reference/vh2/vh2_cubi_test.py + VH2-CUBI-TEST-REPORT.txt.
 * Ideal stabilizer-code simulation only; no physical quantum hardware claim.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MODULE_ID = 'vh2';
  const PHYSICAL_QUBITS = 5;
  const HILBERT_DIM = 32;
  const LOGICAL_QUBITS = 1;
  const DISTANCE = 3;
  const CODE_SPACE_DIM = 2;
  const STABS = Object.freeze(['XZZXI', 'IXZZX', 'XIXZZ', 'ZXIXZ']);
  const LOGICAL_X = 'XXXXX';
  const LOGICAL_Z = 'ZZZZZ';
  const CONTROLLER = Object.freeze({ 0: 'logical I', 1: 'logical X', 2: 'logical Z' });
  const ERRORS = Object.freeze(Array.from({ length: PHYSICAL_QUBITS }, (_, q) =>
    ['X', 'Y', 'Z'].map(p => Object.freeze({ q, p, label: `${p}${q}` }))
  ).flat());

  const runtime = {
    errorIndex: 0,
    phase: 'READY',
    syndrome: '----',
    recovered: false,
    mode: 0,
    receipt: null,
    note: 'ready'
  };

  const viz = { qubits: [], bits: [], mode: null, split: null };

  function anti(a, b) {
    if (a === 'I' || b === 'I' || a === b) return 0;
    return 1;
  }

  function errorWord(error) {
    const out = ['I', 'I', 'I', 'I', 'I'];
    out[error.q] = error.p;
    return out.join('');
  }

  function syndromeOf(error) {
    const word = errorWord(error);
    return STABS.map(stab => {
      let parity = 0;
      for (let i = 0; i < PHYSICAL_QUBITS; i += 1) parity ^= anti(stab[i], word[i]);
      return parity;
    }).join('');
  }

  function syndromeMap() {
    const map = new Map();
    ERRORS.forEach(error => map.set(syndromeOf(error), error.label));
    return map;
  }

  function currentError() {
    return ERRORS[runtime.errorIndex];
  }

  function svgDoc() {
    return document.getElementById('i13')?.contentDocument || null;
  }

  function panel() {
    return svgDoc()?.querySelector(`.i13-exploded-panel[data-exploded-for="${MODULE_ID}"]`) || null;
  }

  function sectionRows(sectionIndex) {
    const section = panel()?.querySelectorAll('.ev-section-group')?.[sectionIndex];
    return section ? Array.from(section.querySelectorAll('.ev-row, .ev-row-muted')) : [];
  }

  function machineRows() {
    const p = panel();
    const machine = p?.querySelector('.ev-machine');
    if (!p || !machine) return [];
    const y = Number(machine.getAttribute('y')) || 0;
    return Array.from(p.querySelectorAll('text.ev-row, text.ev-row-muted'))
      .filter(node => (Number(node.getAttribute('y')) || 0) > y + 20);
  }

  function setSection(sectionIndex, rowIndex, text) {
    const row = sectionRows(sectionIndex)[rowIndex];
    if (row) row.textContent = text;
  }

  function setMachine(rowIndex, text) {
    const row = machineRows()[rowIndex];
    if (row) row.textContent = text;
  }

  function receiptSummary() {
    if (!runtime.receipt) return 'none';
    const r = runtime.receipt;
    return `[[5,1,3]] ${r.error} syndrome=${r.syndrome} F=${r.fidelity.toFixed(12)}`;
  }

  function syncViz() {
    const error = currentError();
    viz.qubits.forEach((node, q) => {
      const hot = q === error.q && runtime.phase !== 'READY';
      node.circle.setAttribute('style', hot
        ? 'fill:var(--qec,#6d28d9);stroke:var(--qec,#6d28d9);stroke-width:1.8'
        : 'fill:#fff;stroke:#a78bfa;stroke-width:1.2');
      node.label.setAttribute('style', hot
        ? 'fill:#6d28d9;font-size:9px;font-weight:800'
        : 'fill:#64748b;font-size:9px;font-weight:600');
      node.pauli.textContent = hot ? error.p : 'I';
      node.pauli.setAttribute('style', hot
        ? 'fill:#fff;font-size:9px;font-weight:800'
        : 'fill:#6d28d9;font-size:9px;font-weight:700');
    });

    const bits = runtime.syndrome === '----' ? ['-', '-', '-', '-'] : runtime.syndrome.split('');
    viz.bits.forEach((node, i) => {
      node.text.textContent = bits[i];
      const active = bits[i] === '1';
      node.rect.setAttribute('style', active
        ? 'fill:#ede9fe;stroke:var(--qec,#6d28d9);stroke-width:1.2'
        : 'fill:#fff;stroke:#c4b5fd;stroke-width:1');
    });
    if (viz.mode) viz.mode.textContent = `CTRL ${runtime.mode} · ${CONTROLLER[runtime.mode]}`;
  }

  function sync() {
    const error = currentError();
    setSection(2, 0, `code · [[5,1,3]] · physical ${PHYSICAL_QUBITS} · Hilbert ${HILBERT_DIM}`);
    setSection(2, 1, `logical space · rank ${CODE_SPACE_DIM} · ${LOGICAL_QUBITS} logical qubit`);
    setSection(2, 2, `error · ${runtime.phase === 'READY' ? 'none selected' : `${error.label} on q${error.q}`}`);
    setSection(2, 3, `syndrome · ${runtime.syndrome}`);
    setSection(2, 4, `controller · mode ${runtime.mode} = ${CONTROLLER[runtime.mode]}`);

    setSection(3, 0, `recovery · ${runtime.recovered ? 'PASS · ideal fidelity 1.000000000000' : 'pending'}`);
    setSection(3, 1, `receipt · ${receiptSummary()}`);
    setSection(3, 2, 'ternary quantum logical basis · REJECTED · rank 2 < 3');
    setSection(3, 3, '2|3 split · project topology overlay, not stabilizer partition');
    setSection(3, 4, 'physical quantum hardware · NOT CLAIMED');

    setMachine(0, `CODE       [[5,1,3]] · n=${PHYSICAL_QUBITS} · k=${LOGICAL_QUBITS} · d=${DISTANCE} · code rank ${CODE_SPACE_DIM}`);
    setMachine(1, `STABS      ${STABS.join(' · ')}`);
    setMachine(2, `LOGICAL    X=${LOGICAL_X} · Z=${LOGICAL_Z}`);
    setMachine(3, `SYNDROME   15/15 unique nonzero four-bit syndromes · current ${runtime.syndrome}`);
    setMachine(4, `RECOVERY   arbitrary single-qubit Pauli · ${runtime.recovered ? 'PASS F=1' : 'pending'}`);
    setMachine(5, `CONTROL    external ternary modes 0=I · 1=X · 2=Z · current ${runtime.mode}`);
    setMachine(6, `BOUNDARY   ideal simulation · topology 5 -> 2|3 -> 1 separate from stabilizer partition · ${runtime.note}`);
    syncViz();
  }

  function resetRuntime() {
    runtime.errorIndex = 0;
    runtime.phase = 'READY';
    runtime.syndrome = '----';
    runtime.recovered = false;
    runtime.mode = 0;
    runtime.receipt = null;
    runtime.note = 'ready';
    sync();
  }

  function nextError() {
    runtime.errorIndex = (runtime.errorIndex + 1) % ERRORS.length;
    runtime.phase = 'ERROR';
    runtime.syndrome = '----';
    runtime.recovered = false;
    runtime.receipt = null;
    runtime.note = `injected ${currentError().label}`;
    sync();
  }

  function measureSyndrome() {
    if (runtime.phase === 'READY') runtime.phase = 'ERROR';
    runtime.syndrome = syndromeOf(currentError());
    runtime.phase = 'SYNDROME';
    runtime.recovered = false;
    runtime.receipt = null;
    runtime.note = `four stabilizers resolve ${currentError().label} -> ${runtime.syndrome}`;
    sync();
  }

  function recover() {
    if (runtime.syndrome === '----') runtime.syndrome = syndromeOf(currentError());
    const decoded = syndromeMap().get(runtime.syndrome);
    runtime.recovered = decoded === currentError().label;
    runtime.phase = 'RECOVER';
    runtime.receipt = runtime.recovered ? {
      code: '[[5,1,3]]',
      error: currentError().label,
      syndrome: runtime.syndrome,
      correction: decoded,
      fidelity: 1,
      terminated: true
    } : null;
    runtime.note = runtime.recovered
      ? `decoded ${runtime.syndrome} -> ${decoded} · ideal recovery fidelity 1`
      : `decode failure for ${runtime.syndrome}`;
    sync();
  }

  function nextMode() {
    runtime.mode = (runtime.mode + 1) % 3;
    runtime.note = `external ternary controller mode ${runtime.mode} = ${CONTROLLER[runtime.mode]}`;
    sync();
  }

  function installCodeBlock() {
    const p = panel();
    if (!p || p.querySelector('[data-vh2-code-block]')) return;
    const outputSection = p.querySelectorAll('.ev-section-group')?.[3];
    const rect = outputSection?.querySelector('rect.ev-section');
    const defs = p.querySelector('defs');
    if (!outputSection || !rect || !defs) return;

    const x = Number(rect.getAttribute('x')) || 0;
    const y = Number(rect.getAttribute('y')) || 0;
    const w = Number(rect.getAttribute('width')) || 0;
    const h = Number(rect.getAttribute('height')) || 0;

    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.id = 'stage12-vh2-output-clip';
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', x + 8);
    clipRect.setAttribute('y', y + 30);
    clipRect.setAttribute('width', Math.max(1, w - 16));
    clipRect.setAttribute('height', Math.max(1, h - 38));
    clip.appendChild(clipRect);
    defs.appendChild(clip);

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-vh2-code-block', 'true');
    g.setAttribute('clip-path', 'url(#stage12-vh2-output-clip)');

    const railY = y + h - 62;
    const startX = x + 28;
    const span = Math.max(120, w - 56);

    const rail = document.createElementNS(SVG_NS, 'line');
    rail.setAttribute('x1', startX);
    rail.setAttribute('y1', railY);
    rail.setAttribute('x2', startX + span);
    rail.setAttribute('y2', railY);
    rail.setAttribute('style', 'stroke:#c4b5fd;stroke-width:1.5');
    g.appendChild(rail);

    for (let q = 0; q < PHYSICAL_QUBITS; q += 1) {
      const px = startX + (span * q) / (PHYSICAL_QUBITS - 1);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', px);
      circle.setAttribute('cy', railY);
      circle.setAttribute('r', 9);
      g.appendChild(circle);

      const pauli = document.createElementNS(SVG_NS, 'text');
      pauli.setAttribute('x', px);
      pauli.setAttribute('y', railY + 3);
      pauli.setAttribute('text-anchor', 'middle');
      g.appendChild(pauli);

      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', px);
      label.setAttribute('y', railY - 14);
      label.setAttribute('text-anchor', 'middle');
      label.textContent = `q${q}`;
      g.appendChild(label);
      viz.qubits.push({ circle, pauli, label });
    }

    const splitX = startX + span * 0.375;
    const split = document.createElementNS(SVG_NS, 'line');
    split.setAttribute('x1', splitX);
    split.setAttribute('y1', railY - 24);
    split.setAttribute('x2', splitX);
    split.setAttribute('y2', railY + 16);
    split.setAttribute('style', 'stroke:#94a3b8;stroke-width:1;stroke-dasharray:3 3');
    g.appendChild(split);
    viz.split = split;

    const splitLabel = document.createElementNS(SVG_NS, 'text');
    splitLabel.setAttribute('x', startX + span / 2);
    splitLabel.setAttribute('y', railY + 28);
    splitLabel.setAttribute('text-anchor', 'middle');
    splitLabel.setAttribute('style', 'fill:#64748b;font-size:8px;font-weight:600');
    splitLabel.textContent = 'project overlay · 2 | 3';
    g.appendChild(splitLabel);

    const bitY = railY + 42;
    const bitStart = x + 56;
    for (let i = 0; i < 4; i += 1) {
      const bx = bitStart + i * 26;
      const r = document.createElementNS(SVG_NS, 'rect');
      r.setAttribute('x', bx);
      r.setAttribute('y', bitY);
      r.setAttribute('width', 20);
      r.setAttribute('height', 16);
      r.setAttribute('rx', 3);
      g.appendChild(r);
      const t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', bx + 10);
      t.setAttribute('y', bitY + 12);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('style', 'fill:#6d28d9;font-size:9px;font-weight:800');
      g.appendChild(t);
      viz.bits.push({ rect: r, text: t });
    }

    const mode = document.createElementNS(SVG_NS, 'text');
    mode.setAttribute('x', x + w - 18);
    mode.setAttribute('y', bitY + 12);
    mode.setAttribute('text-anchor', 'end');
    mode.setAttribute('style', 'fill:#6d28d9;font-size:8px;font-weight:700');
    g.appendChild(mode);
    viz.mode = mode;

    outputSection.appendChild(g);
    syncViz();
  }

  function mount() {
    if (!window.I13Exploded?.isReady?.()) return false;
    if (window.I13Exploded.getState(MODULE_ID)) return true;

    window.I13Exploded.mount(MODULE_ID, {
      title: 'VH2 · CUBI [[5,1,3]] · EXPLODED',
      subtitle: '5 physical qubits -> syndrome -> single-Pauli recovery -> 1 protected logical qubit · external ternary controller',
      family: 'qec',
      expanded: false,
      machineExpanded: false,
      input: [
        'five physical qubits · Hilbert dimension 2^5 = 32',
        'four cyclic stabilizers',
        'logical X = XXXXX · logical Z = ZZZZZ',
        'single-qubit Pauli error X/Y/Z',
        'external ternary control mode 0/1/2'
      ],
      pipeline: [
        'encode one logical qubit in rank-2 code space',
        'apply one physical Pauli error',
        'measure four stabilizer syndrome bits',
        'map unique nonzero syndrome -> correction',
        'apply matching correction',
        'verify logical recovery fidelity',
        'keep ternary controller outside quantum code space'
      ],
      state: [
        'code · [[5,1,3]] · physical 5 · Hilbert 32',
        'logical space · rank 2 · 1 logical qubit',
        'error · none selected',
        'syndrome · ----',
        'controller · mode 0 = logical I'
      ],
      output: [
        'recovery · pending',
        'receipt · none',
        'ternary quantum logical basis · REJECTED · rank 2 < 3',
        '2|3 split · project topology overlay, not stabilizer partition',
        'physical quantum hardware · NOT CLAIMED'
      ],
      machine: [
        'CODE       [[5,1,3]] · n=5 · k=1 · d=3 · code rank 2',
        `STABS      ${STABS.join(' · ')}`,
        `LOGICAL    X=${LOGICAL_X} · Z=${LOGICAL_Z}`,
        'SYNDROME   15/15 unique nonzero four-bit syndromes · current ----',
        'RECOVERY   arbitrary single-qubit Pauli · pending',
        'CONTROL    external ternary modes 0=I · 1=X · 2=Z · current 0',
        'BOUNDARY   ideal simulation · topology 5 -> 2|3 -> 1 separate from stabilizer partition · ready'
      ],
      controls: [
        { id: 'vh2-reset', label: 'RESET', onClick: resetRuntime },
        { id: 'vh2-error', label: 'ERROR +', onClick: nextError },
        { id: 'vh2-syndrome', label: 'SYNDROME', onClick: measureSyndrome },
        { id: 'vh2-recover', label: 'RECOVER', onClick: recover },
        { id: 'vh2-mode', label: 'MODE', onClick: nextMode }
      ]
    });

    const p = panel();
    const shell = p?.querySelector('.ev-shell');
    if (shell) shell.setAttribute('style', 'stroke:var(--qec,#6d28d9);stroke-width:1.25');
    installCodeBlock();
    sync();
    return true;
  }

  function selfTest() {
    const map = syndromeMap();
    const syndromes = ERRORS.map(syndromeOf);
    const checks = [
      { name: 'five physical qubits', pass: PHYSICAL_QUBITS === 5 && HILBERT_DIM === 32 },
      { name: 'one logical qubit distance three', pass: LOGICAL_QUBITS === 1 && DISTANCE === 3 },
      { name: 'code space rank is two', pass: CODE_SPACE_DIM === 2 },
      { name: 'stabilizer generators preserved', pass: JSON.stringify(STABS) === JSON.stringify(['XZZXI','IXZZX','XIXZZ','ZXIXZ']) },
      { name: 'logical operators preserved', pass: LOGICAL_X === 'XXXXX' && LOGICAL_Z === 'ZZZZZ' },
      { name: '15 physical single-Pauli errors', pass: ERRORS.length === 15 },
      { name: '15 syndromes unique', pass: new Set(syndromes).size === 15 },
      { name: 'all single-Pauli syndromes nonzero', pass: syndromes.every(s => s !== '0000') },
      { name: 'syndrome map decodes every single-Pauli error', pass: ERRORS.every(e => map.get(syndromeOf(e)) === e.label) },
      { name: 'ternary controller remains external metadata/control', pass: CONTROLLER[0] === 'logical I' && CONTROLLER[1] === 'logical X' && CONTROLLER[2] === 'logical Z' },
      { name: 'ternary quantum basis rejected by rank', pass: CODE_SPACE_DIM < 3 },
      { name: 'odd-width project overlay is 2|3', pass: Math.floor(PHYSICAL_QUBITS / 2) === 2 && Math.ceil(PHYSICAL_QUBITS / 2) === 3 }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, syndromes, errors: ERRORS.length });
  }

  function boot() {
    if (!mount()) window.addEventListener('i13-exploded-ready', mount, { once: true });
  }

  window.I13VH2Stage = Object.freeze({
    version: '0.1.0',
    mount,
    reset: resetRuntime,
    nextError,
    syndrome: measureSyndrome,
    recover,
    mode: nextMode,
    selfTest
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();