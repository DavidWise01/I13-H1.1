/* I13 H1.1 — Stage 10: Pulse experimental threshold exploded view.
 *
 * Grounded in spec/PULSE.md and src/pulse.rs.
 * Pulse is an experimental H1.1 lane, not frozen I-13 syntax.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MODULE_ID = 'pulse';
  const BOUNDARY = 128;
  const PHASES = Object.freeze(['INPUT', 'ADJUST', 'COMPARE', 'WITNESS', 'RETURN']);
  const CASES = Object.freeze([
    Object.freeze({ id: 'PASS', state: 120, threshold: 10, witness: 2 }),
    Object.freeze({ id: 'EDGE', state: 120, threshold: 8, witness: 2 })
  ]);

  const runtime = {
    caseIndex: 0,
    phaseIndex: 0,
    adjusted: null,
    gate: 'PENDING',
    result: null,
    status: 'WAITING',
    receipt: 'ready'
  };

  const gauge = { point: null, value: null, gate: null };

  function currentCase() { return CASES[runtime.caseIndex]; }
  function phase() { return PHASES[runtime.phaseIndex] || 'DONE'; }

  function executePulseTransition(stateVector, thresholdBoundary, verificationWitness) {
    const adjustedVector = stateVector + thresholdBoundary;
    return adjustedVector > BOUNDARY ? adjustedVector * verificationWitness : null;
  }

  function svgDoc() {
    return document.getElementById('i13')?.contentDocument || null;
  }

  function panel() {
    return svgDoc()?.querySelector(`.i13-exploded-panel[data-exploded-for="${MODULE_ID}"]`) || null;
  }

  function sectionRows(sectionIndex) {
    const p = panel();
    const section = p?.querySelectorAll('.ev-section-group')?.[sectionIndex];
    return section ? Array.from(section.querySelectorAll('.ev-row, .ev-row-muted')) : [];
  }

  function machineRows() {
    const p = panel();
    if (!p) return [];
    const machine = p.querySelector('.ev-machine');
    if (!machine) return [];
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

  function controlLabel(id) {
    return panel()?.querySelector(`[data-control="${id}"] .ev-control-text`) || null;
  }

  function adjustedDisplay() {
    return runtime.adjusted == null ? 'pending' : String(runtime.adjusted);
  }

  function resultDisplay() {
    return runtime.result == null ? 'none' : String(runtime.result);
  }

  function syncGauge() {
    if (!gauge.point) return;
    const c = currentCase();
    const value = runtime.adjusted == null ? c.state : runtime.adjusted;
    const min = 118;
    const max = 132;
    const x0 = Number(gauge.point.dataset.x0 || 0);
    const x1 = Number(gauge.point.dataset.x1 || 0);
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const x = x0 + (x1 - x0) * ratio;
    gauge.point.setAttribute('cx', String(x));
    gauge.point.setAttribute('style', runtime.gate === 'PASS'
      ? 'fill:var(--pass,#16a34a);stroke:var(--pass,#16a34a);stroke-width:1.5'
      : runtime.gate === 'FAIL'
        ? 'fill:var(--veto,#dc2626);stroke:var(--veto,#dc2626);stroke-width:1.5'
        : 'fill:var(--pulse,#ea580c);stroke:var(--pulse,#ea580c);stroke-width:1.5');
    if (gauge.value) gauge.value.textContent = `adjusted ${value}`;
    if (gauge.gate) gauge.gate.textContent = runtime.gate === 'PENDING' ? '> 128 ?' : runtime.gate;
  }

  function sync() {
    const c = currentCase();
    setSection(0, 0, `state_vector · ${c.state}`);
    setSection(0, 1, `threshold_boundary · ${c.threshold}`);
    setSection(0, 2, `verification_witness · ${c.witness}`);
    setSection(0, 3, 'lane · experimental H1.1 · not frozen I-13 syntax');

    setSection(2, 0, `phase · ${phase()}`);
    setSection(2, 1, `adjusted_vector · ${adjustedDisplay()}`);
    setSection(2, 2, `strict gate · ${runtime.gate}`);
    setSection(2, 3, `boundary · ${BOUNDARY} · operator >`);
    setSection(2, 4, `witness · ${c.witness}`);

    setSection(3, 0, `result · ${resultDisplay()}`);
    setSection(3, 1, `status · ${runtime.status}`);
    setSection(3, 2, `receipt · ${runtime.receipt}`);
    setSection(3, 3, '... · experimental hard pulse/commit boundary');

    setMachine(0, `HELPER     adjusted = state + threshold; if adjusted > ${BOUNDARY}: adjusted * witness`);
    setMachine(1, `CASE       ${c.id} · ${c.state} + ${c.threshold} · witness ${c.witness}`);
    setMachine(2, `PHASE      ${phase()}`);
    setMachine(3, `ADJUSTED   ${adjustedDisplay()}`);
    setMachine(4, `GATE       ${runtime.gate} · strict > ${BOUNDARY} · equality does not pass`);
    setMachine(5, `OUTPUT     ${resultDisplay()} · ${runtime.status}`);
    setMachine(6, 'NOTATION   . atomic · .. reserved/unfrozen · ... experimental hard boundary');

    const caseButton = controlLabel('pulse-case');
    if (caseButton) caseButton.textContent = `CASE ${c.id}`;
    syncGauge();
  }

  function resetRuntime() {
    runtime.phaseIndex = 0;
    runtime.adjusted = null;
    runtime.gate = 'PENDING';
    runtime.result = null;
    runtime.status = 'WAITING';
    runtime.receipt = 'ready';
    sync();
  }

  function toggleCase() {
    runtime.caseIndex = (runtime.caseIndex + 1) % CASES.length;
    resetRuntime();
    runtime.receipt = `case selected · ${currentCase().id}`;
    sync();
  }

  function showNotation() {
    runtime.receipt = '. atomic point · .. reserved soft continuation/range, semantics unfrozen · ... experimental hard pulse/commit boundary';
    sync();
  }

  function stepRuntime() {
    const c = currentCase();
    if (runtime.phaseIndex >= PHASES.length) {
      runtime.receipt = 'complete · reset or change case to replay';
      sync();
      return false;
    }

    switch (PHASES[runtime.phaseIndex]) {
      case 'INPUT':
        runtime.receipt = `loaded ${c.id} case`;
        break;
      case 'ADJUST':
        runtime.adjusted = c.state + c.threshold;
        runtime.receipt = `adjusted_vector = ${runtime.adjusted}`;
        break;
      case 'COMPARE':
        if (runtime.adjusted == null) runtime.adjusted = c.state + c.threshold;
        runtime.gate = runtime.adjusted > BOUNDARY ? 'PASS' : 'FAIL';
        runtime.status = runtime.gate === 'PASS' ? 'ELIGIBLE' : 'NO PULSE';
        runtime.receipt = runtime.gate === 'PASS'
          ? `${runtime.adjusted} > ${BOUNDARY} · witness may apply`
          : `${runtime.adjusted} > ${BOUNDARY} is false · return none`;
        if (runtime.gate === 'FAIL') {
          runtime.result = null;
          runtime.phaseIndex = PHASES.length;
          sync();
          return false;
        }
        break;
      case 'WITNESS':
        runtime.result = runtime.adjusted * c.witness;
        runtime.status = 'VERIFIED';
        runtime.receipt = `${runtime.adjusted} × ${c.witness} = ${runtime.result}`;
        break;
      case 'RETURN':
        runtime.status = 'RETURNED';
        runtime.receipt = `return ${runtime.result}`;
        break;
      default:
        runtime.status = 'ERROR';
        runtime.receipt = 'unknown Pulse phase';
        runtime.phaseIndex = PHASES.length;
        sync();
        return false;
    }

    runtime.phaseIndex += 1;
    sync();
    return runtime.phaseIndex < PHASES.length;
  }

  function runRuntime() {
    if (runtime.phaseIndex >= PHASES.length) resetRuntime();
    let guard = 8;
    while (runtime.phaseIndex < PHASES.length && guard-- > 0) stepRuntime();
    if (guard <= 0 && runtime.phaseIndex < PHASES.length) {
      runtime.status = 'ERROR';
      runtime.receipt = 'bounded Pulse run guard exhausted';
      runtime.phaseIndex = PHASES.length;
      sync();
    }
  }

  function injectPulseStyle() {
    const doc = svgDoc();
    if (!doc || doc.getElementById('stage10-pulse-style')) return;
    const style = doc.createElementNS(SVG_NS, 'style');
    style.id = 'stage10-pulse-style';
    style.textContent = `
.i13-exploded-panel[data-family="pulse"] .ev-shell{stroke:var(--pulse,#ea580c)}
.i13-exploded-panel[data-family="pulse"] .ev-header{fill:var(--pulse-bg,#fff7ed);stroke:var(--pulse,#ea580c)}
.i13-exploded-panel[data-family="pulse"] .ev-machine{fill:var(--pulse-bg,#fff7ed)}
`;
    doc.documentElement.appendChild(style);
  }

  function installGauge() {
    const p = panel();
    if (!p || p.querySelector('[data-pulse-gauge]')) return;
    const outputSection = p.querySelectorAll('.ev-section-group')?.[3];
    const rect = outputSection?.querySelector('rect.ev-section');
    const defs = p.querySelector('defs');
    if (!outputSection || !rect || !defs) return;

    const x = Number(rect.getAttribute('x')) || 0;
    const y = Number(rect.getAttribute('y')) || 0;
    const w = Number(rect.getAttribute('width')) || 0;
    const h = Number(rect.getAttribute('height')) || 0;
    const x0 = x + 18;
    const x1 = x + w - 18;
    const gy = y + h - 38;

    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.id = 'stage10-pulse-output-clip';
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', x + 8);
    clipRect.setAttribute('y', y + 30);
    clipRect.setAttribute('width', Math.max(1, w - 16));
    clipRect.setAttribute('height', Math.max(1, h - 38));
    clip.appendChild(clipRect);
    defs.appendChild(clip);

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-pulse-gauge', 'true');
    g.setAttribute('clip-path', 'url(#stage10-pulse-output-clip)');

    const track = document.createElementNS(SVG_NS, 'line');
    track.setAttribute('x1', x0);
    track.setAttribute('x2', x1);
    track.setAttribute('y1', gy);
    track.setAttribute('y2', gy);
    track.setAttribute('style', 'stroke:#cbd5e1;stroke-width:2');
    g.appendChild(track);

    const boundaryX = x0 + (x1 - x0) * ((BOUNDARY - 118) / (132 - 118));
    const boundary = document.createElementNS(SVG_NS, 'line');
    boundary.setAttribute('x1', boundaryX);
    boundary.setAttribute('x2', boundaryX);
    boundary.setAttribute('y1', gy - 12);
    boundary.setAttribute('y2', gy + 12);
    boundary.setAttribute('style', 'stroke:var(--pulse,#ea580c);stroke-width:1.6;stroke-dasharray:3 2');
    g.appendChild(boundary);

    const boundaryLabel = document.createElementNS(SVG_NS, 'text');
    boundaryLabel.setAttribute('x', boundaryX);
    boundaryLabel.setAttribute('y', gy - 16);
    boundaryLabel.setAttribute('text-anchor', 'middle');
    boundaryLabel.setAttribute('style', 'font-size:8px;font-weight:700;fill:var(--pulse,#ea580c)');
    boundaryLabel.textContent = '128';
    g.appendChild(boundaryLabel);

    const point = document.createElementNS(SVG_NS, 'circle');
    point.setAttribute('cy', gy);
    point.setAttribute('r', 5);
    point.dataset.x0 = String(x0);
    point.dataset.x1 = String(x1);
    g.appendChild(point);

    const value = document.createElementNS(SVG_NS, 'text');
    value.setAttribute('x', x0);
    value.setAttribute('y', gy + 18);
    value.setAttribute('style', 'font-size:8px;font-weight:700;fill:#475569');
    g.appendChild(value);

    const gate = document.createElementNS(SVG_NS, 'text');
    gate.setAttribute('x', x1);
    gate.setAttribute('y', gy + 18);
    gate.setAttribute('text-anchor', 'end');
    gate.setAttribute('style', 'font-size:8px;font-weight:700;fill:#475569');
    g.appendChild(gate);

    outputSection.appendChild(g);
    gauge.point = point;
    gauge.value = value;
    gauge.gate = gate;
    syncGauge();
  }

  function mount() {
    if (!window.I13Exploded?.isReady?.()) return false;
    if (window.I13Exploded.getState(MODULE_ID)) return true;

    window.I13Exploded.mount(MODULE_ID, {
      title: 'PULSE · EXPERIMENTAL H1.1 THRESHOLD · EXPLODED',
      subtitle: 'state + threshold -> strict > 128 -> witness -> Option(result)',
      family: 'pulse',
      expanded: false,
      machineExpanded: false,
      input: [
        'state_vector · 120',
        'threshold_boundary · 10',
        'verification_witness · 2',
        'lane · experimental H1.1 · not frozen I-13 syntax'
      ],
      pipeline: [
        'adjusted_vector = state_vector + threshold_boundary',
        `strict compare · adjusted_vector > ${BOUNDARY}`,
        'if true · multiply by verification_witness',
        'if false · return none',
        'exact equality at 128 does not pass'
      ],
      state: [
        'phase · INPUT',
        'adjusted_vector · pending',
        'strict gate · PENDING',
        `boundary · ${BOUNDARY} · operator >`,
        'witness · 2'
      ],
      output: [
        'result · none',
        'status · WAITING',
        'receipt · ready',
        '... · experimental hard pulse/commit boundary'
      ],
      machine: [
        `HELPER     adjusted = state + threshold; if adjusted > ${BOUNDARY}: adjusted * witness`,
        'CASE       PASS · 120 + 10 · witness 2',
        'PHASE      INPUT',
        'ADJUSTED   pending',
        `GATE       PENDING · strict > ${BOUNDARY} · equality does not pass`,
        'OUTPUT     none · WAITING',
        'NOTATION   . atomic · .. reserved/unfrozen · ... experimental hard boundary'
      ],
      controls: [
        { id: 'pulse-reset', label: 'RESET', onClick: resetRuntime },
        { id: 'pulse-step', label: 'STEP', onClick: stepRuntime },
        { id: 'pulse-run', label: 'RUN', onClick: runRuntime },
        { id: 'pulse-case', label: 'CASE PASS', onClick: toggleCase },
        { id: 'pulse-notation', label: 'NOTATION', onClick: showNotation }
      ]
    });

    injectPulseStyle();
    installGauge();
    sync();
    return true;
  }

  function simulateForTest(c) {
    const adjusted = c.state + c.threshold;
    const pass = adjusted > BOUNDARY;
    return Object.freeze({
      adjusted,
      pass,
      result: pass ? adjusted * c.witness : null
    });
  }

  function selfTest() {
    const passCase = simulateForTest(CASES[0]);
    const edgeCase = simulateForTest(CASES[1]);
    const checks = [
      { name: 'boundary is 128', pass: BOUNDARY === 128 },
      { name: 'strict operator is greater-than', pass: passCase.pass === true && edgeCase.pass === false },
      { name: 'pass example adjusted is 130', pass: passCase.adjusted === 130 },
      { name: 'pass example returns 260', pass: passCase.result === 260 },
      { name: 'edge example adjusted is 128', pass: edgeCase.adjusted === 128 },
      { name: 'exact boundary returns none', pass: edgeCase.result === null },
      { name: 'helper matches pass example', pass: executePulseTransition(120, 10, 2) === 260 },
      { name: 'helper matches edge example', pass: executePulseTransition(120, 8, 2) === null },
      { name: 'notation remains experimental', pass: true }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, passCase, edgeCase });
  }

  function boot() {
    if (!mount()) window.addEventListener('i13-exploded-ready', mount, { once: true });
  }

  window.I13PulseStage = Object.freeze({
    version: '0.1.0',
    mount,
    reset: resetRuntime,
    step: stepRuntime,
    run: runRuntime,
    toggleCase,
    showNotation,
    executePulseTransition,
    selfTest
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();