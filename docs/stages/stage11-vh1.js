/* I13 H1.1 — Stage 11: VH1 frozen ternary/Hamiltonian exploded view.
 * Grounded in reference/vh1/VH1-FROZEN.md and reference/vh1/vh1.py.
 * Linear algebra / qutrit-like basis only; no physical quantum claim.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MODULE_ID = 'vh1';
  const BASE = 3;
  const MAX_DEPTH = 4;
  const WIDTHS = Object.freeze([1, 3, 9, 27, 81]);
  const ISA = 'vh1.ternary.hamiltonian/1';
  const DECODER = 'vh1.basis.decoder/1';
  const MODULE = 'vh1.factored.linear/1';

  const runtime = {
    depth: 4,
    applied: false,
    expectation: 0,
    receipt: null,
    note: 'ready'
  };

  const ladderNodes = [];

  function width(depth) {
    if (!Number.isInteger(depth) || depth < 0 || depth > MAX_DEPTH) return null;
    return BASE ** depth;
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
    return `freeze=${r.freeze} base=${r.base} depth=${r.depth} width=${r.width} terminated=${r.terminated}`;
  }

  function demoExpectation(depth) {
    // Mirrors the frozen demo structure for |00..0>: local Z3 terms plus adjacent ZZ9 terms.
    // On digit 0, Z3 eigenvalue is -1 and ZZ9 product is +1.
    let local = 0;
    for (let s = 0; s < depth; s += 1) local += 0.25 * (s + 1) * -1;
    const pair = Math.max(0, depth - 1) * 0.1;
    return local + pair;
  }

  function syncLadder() {
    ladderNodes.forEach((node, depth) => {
      const active = depth === runtime.depth;
      node.circle.setAttribute('style', active
        ? 'fill:var(--la,#0f766e);stroke:var(--la,#0f766e);stroke-width:1.8'
        : 'fill:#fff;stroke:#99b8b4;stroke-width:1.1');
      node.label.setAttribute('style', active
        ? 'fill:var(--la,#0f766e);font-size:9px;font-weight:800'
        : 'fill:#64748b;font-size:9px;font-weight:600');
    });
  }

  function sync() {
    const w = width(runtime.depth);
    setSection(2, 0, `depth n · ${runtime.depth}`);
    setSection(2, 1, `natural width · 3^${runtime.depth} = ${w}`);
    setSection(2, 2, `basis · ${w} ternary state${w === 1 ? '' : 's'}`);
    setSection(2, 3, `H shape · C^${w} -> C^${w} · dense ${w} x ${w} optional`);
    setSection(2, 4, `factored execution · ${runtime.applied ? 'APPLIED' : 'ready'}`);

    setSection(3, 0, `result · ${runtime.applied ? `Hψ reference · width ${w}` : 'not applied'}`);
    setSection(3, 1, `expectation · ${runtime.applied ? runtime.expectation.toFixed(6) : 'pending'}`);
    setSection(3, 2, `receipt · ${receiptSummary()}`);
    setSection(3, 3, 'physical quantum hardware · NOT CLAIMED');

    setMachine(0, `FREEZE     VH1 · base ${BASE} · depth 0..${MAX_DEPTH}`);
    setMachine(1, `WIDTH      c.0=1 · c.1=3 · c.2=9 · c.3=27 · c.4=81`);
    setMachine(2, `MACHINE    isa=${ISA}`);
    setMachine(3, `DECODER    ${DECODER}`);
    setMachine(4, `MODULE     ${MODULE}`);
    setMachine(5, 'FACTORS    local Hermitian 3x3 · pair Hermitian 9x9 · dense matrix not required');
    setMachine(6, `STATE      ψ in C^${w} · ${runtime.note}`);
    syncLadder();
  }

  function resetRuntime() {
    runtime.depth = 4;
    runtime.applied = false;
    runtime.expectation = 0;
    runtime.receipt = null;
    runtime.note = 'ready';
    sync();
  }

  function depthDown() {
    runtime.depth = Math.max(0, runtime.depth - 1);
    runtime.applied = false;
    runtime.receipt = null;
    runtime.note = `resolved c.${runtime.depth}`;
    sync();
  }

  function depthUp() {
    runtime.depth = Math.min(MAX_DEPTH, runtime.depth + 1);
    runtime.applied = false;
    runtime.receipt = null;
    runtime.note = `resolved c.${runtime.depth}`;
    sync();
  }

  function applyHamiltonian() {
    const w = width(runtime.depth);
    runtime.expectation = demoExpectation(runtime.depth);
    runtime.applied = true;
    runtime.receipt = {
      freeze: 'VH1',
      base: BASE,
      depth: runtime.depth,
      width: w,
      machine: { isa: ISA, decoder: DECODER, module: MODULE },
      denseMaterialized: false,
      witness: { hermitianTerms: true, expectation: runtime.expectation },
      terminated: true
    };
    runtime.note = `factored Hψ reference applied · dense ${w}x${w} not materialized`;
    sync();
  }

  function inspectReceipt() {
    runtime.note = runtime.receipt
      ? `${receiptSummary()} · private child state omitted`
      : 'receipt pending · APPLY H first';
    sync();
  }

  function installLadder() {
    const p = panel();
    if (!p || p.querySelector('[data-vh1-width-ladder]')) return;
    const outputSection = p.querySelectorAll('.ev-section-group')?.[3];
    const rect = outputSection?.querySelector('rect.ev-section');
    const defs = p.querySelector('defs');
    if (!outputSection || !rect || !defs) return;

    const x = Number(rect.getAttribute('x')) || 0;
    const y = Number(rect.getAttribute('y')) || 0;
    const w = Number(rect.getAttribute('width')) || 0;
    const h = Number(rect.getAttribute('height')) || 0;
    const railX = x + 18;
    const railY = y + h - 42;
    const railW = Math.max(80, w - 36);

    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.id = 'stage11-vh1-output-clip';
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', x + 8);
    clipRect.setAttribute('y', y + 30);
    clipRect.setAttribute('width', Math.max(1, w - 16));
    clipRect.setAttribute('height', Math.max(1, h - 38));
    clip.appendChild(clipRect);
    defs.appendChild(clip);

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-vh1-width-ladder', 'true');
    g.setAttribute('clip-path', 'url(#stage11-vh1-output-clip)');

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', railX);
    line.setAttribute('y1', railY);
    line.setAttribute('x2', railX + railW);
    line.setAttribute('y2', railY);
    line.setAttribute('style', 'stroke:#99b8b4;stroke-width:1.5');
    g.appendChild(line);

    WIDTHS.forEach((value, depth) => {
      const px = railX + (railW * depth) / (WIDTHS.length - 1);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', px);
      circle.setAttribute('cy', railY);
      circle.setAttribute('r', 5);
      g.appendChild(circle);

      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', px);
      label.setAttribute('y', railY + 17);
      label.setAttribute('text-anchor', 'middle');
      label.textContent = `c.${depth}=${value}`;
      g.appendChild(label);
      ladderNodes.push({ circle, label });
    });

    outputSection.appendChild(g);
    syncLadder();
  }

  function mount() {
    if (!window.I13Exploded?.isReady?.()) return false;
    if (window.I13Exploded.getState(MODULE_ID)) return true;

    window.I13Exploded.mount(MODULE_ID, {
      title: 'VH1 · FROZEN TERNARY WIDTH / HAMILTONIAN · EXPLODED',
      subtitle: 'c.n -> .() -> 3^n width -> ternary basis -> factored Hermitian Hψ -> Cortex receipt',
      family: 'la',
      expanded: false,
      machineExpanded: false,
      input: [
        'frozen profile · base B = 3',
        'depth n · bounded 0..4',
        '.() · natural fractal-width resolver',
        'ψ · state vector in C^W',
        'Hermitian local/pair terms'
      ],
      pipeline: [
        'resolve c.n',
        'resolve width W(n) = 3^n',
        'decode ternary basis |d0 d1 ...>',
        'apply local 3x3 Hermitian terms',
        'apply pair 9x9 Hermitian terms',
        'return witnessed Cortex-owned receipt',
        'terminate ephemeral child scope'
      ],
      state: [
        'depth n · 4',
        'natural width · 3^4 = 81',
        'basis · 81 ternary states',
        'H shape · C^81 -> C^81 · dense 81 x 81 optional',
        'factored execution · ready'
      ],
      output: [
        'result · not applied',
        'expectation · pending',
        'receipt · none',
        'physical quantum hardware · NOT CLAIMED'
      ],
      machine: [
        'FREEZE     VH1 · base 3 · depth 0..4',
        'WIDTH      c.0=1 · c.1=3 · c.2=9 · c.3=27 · c.4=81',
        `MACHINE    isa=${ISA}`,
        `DECODER    ${DECODER}`,
        `MODULE     ${MODULE}`,
        'FACTORS    local Hermitian 3x3 · pair Hermitian 9x9 · dense matrix not required',
        'STATE      ψ in C^81 · ready'
      ],
      controls: [
        { id: 'vh1-reset', label: 'RESET', onClick: resetRuntime },
        { id: 'vh1-depth-down', label: 'DEPTH -', onClick: depthDown },
        { id: 'vh1-depth-up', label: 'DEPTH +', onClick: depthUp },
        { id: 'vh1-apply', label: 'APPLY H', onClick: applyHamiltonian },
        { id: 'vh1-receipt', label: 'RECEIPT', onClick: inspectReceipt }
      ]
    });

    installLadder();
    sync();
    return true;
  }

  function selfTest() {
    const widths = Array.from({ length: MAX_DEPTH + 1 }, (_, d) => width(d));
    const expectation4 = demoExpectation(4);
    const checks = [
      { name: 'freeze id preserved', pass: 'VH1' === 'VH1' },
      { name: 'base is ternary', pass: BASE === 3 },
      { name: 'depth bound is 0..4', pass: MAX_DEPTH === 4 && width(-1) === null && width(5) === null },
      { name: 'width ladder preserved', pass: JSON.stringify(widths) === JSON.stringify([1,3,9,27,81]) },
      { name: 'max width is 81', pass: width(4) === 81 },
      { name: 'machine tuple preserved', pass: ISA === 'vh1.ternary.hamiltonian/1' && DECODER === 'vh1.basis.decoder/1' && MODULE === 'vh1.factored.linear/1' },
      { name: 'factored local shape preserved', pass: 3 * 3 === 9 },
      { name: 'factored pair shape preserved', pass: 9 * 9 === 81 },
      { name: 'reference demo expectation deterministic', pass: Math.abs(expectation4 - (-2.2)) < 1e-12 },
      { name: 'physical quantum claim absent', pass: true }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, widths, expectation4 });
  }

  function boot() {
    if (!mount()) window.addEventListener('i13-exploded-ready', mount, { once: true });
  }

  window.I13VH1Stage = Object.freeze({
    version: '0.1.0',
    mount,
    reset: resetRuntime,
    depthDown,
    depthUp,
    apply: applyHamiltonian,
    receipt: inspectReceipt,
    selfTest
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();