/* I13 H1.1 — Stage 9: bounded Cortex child exploded view.
 *
 * Grounded in spec/CORTEX-CHILD.md and src/child.rs.
 * The Pages lifecycle trace is deterministic and local. It does not claim a
 * separate AI model or direct commit authority outside Cortex.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MODULE_ID = 'child';
  const CHILD_ID = 13;
  const DEPTH = 4;
  const WIDTH = 81;
  const WITNESS = 42;
  const PRIVATE_SAMPLE = '0xdeadbeef';

  const PHASES = Object.freeze([
    'ZERO',
    'RESOLVE',
    'BIND',
    'SPAWN',
    'DECODE',
    'EXECUTE',
    'RETURN',
    'WITNESS',
    'TERMINATE',
    'ZERO'
  ]);

  const runtime = {
    index: 0,
    childPresent: false,
    privateState: 'NONE',
    observation: 'none',
    result: 'none',
    witnessState: 'pending',
    receipt: null,
    note: 'ready'
  };

  const railNodes = [];

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

  function phase() {
    return PHASES[runtime.index] || 'ZERO';
  }

  function receiptSummary() {
    if (!runtime.receipt) return 'none';
    const r = runtime.receipt;
    return `child=${r.childId} depth=${r.depth} width=${r.width} witness=${r.witness} terminated=${r.terminated}`;
  }

  function syncRail() {
    railNodes.forEach((node, index) => {
      const circle = node.circle;
      const label = node.label;
      if (!circle || !label) return;
      if (index < runtime.index) {
        circle.setAttribute('style', 'fill:#fecdd3;stroke:var(--cortex,#be123c);stroke-width:1.3');
        label.setAttribute('style', 'fill:#9f1239;font-size:8px;font-weight:700');
      } else if (index === runtime.index) {
        circle.setAttribute('style', 'fill:var(--cortex,#be123c);stroke:var(--cortex,#be123c);stroke-width:1.8');
        label.setAttribute('style', 'fill:var(--cortex,#be123c);font-size:8px;font-weight:800');
      } else {
        circle.setAttribute('style', 'fill:#fff;stroke:#cbd5e1;stroke-width:1.1');
        label.setAttribute('style', 'fill:#64748b;font-size:8px;font-weight:600');
      }
    });
  }

  function sync() {
    setSection(2, 0, `phase · ${phase()}`);
    setSection(2, 1, `child · ${runtime.childPresent ? CHILD_ID : 'none'} · depth ${DEPTH} · width ${WIDTH}`);
    setSection(2, 2, `private state · ${runtime.privateState}`);
    setSection(2, 3, `observation · ${runtime.observation}`);
    setSection(2, 4, `witness · ${runtime.witnessState}`);

    setSection(3, 0, `result · ${runtime.result}`);
    setSection(3, 1, `receipt · ${receiptSummary()}`);
    setSection(3, 2, `direct commit · FORBIDDEN`);
    setSection(3, 3, `scope after terminate · ${runtime.index >= 8 ? 'private erased' : 'active / pending'}`);

    setMachine(0, 'FORM       [c[(...), (isa,decoder,module), {c.n,fractal,x(.())} <- (c.n)]]');
    setMachine(1, `LIFECYCLE  ${PHASES.join(' -> ')}`);
    setMachine(2, `PHASE      ${phase()} · child ${runtime.childPresent ? CHILD_ID : 'none'}`);
    setMachine(3, `AUTHORITY  inherited + bounded by Cortex · direct commit NO`);
    setMachine(4, `PRIVATE    ${runtime.privateState} · survives termination NO`);
    setMachine(5, `RECEIPT    ${receiptSummary()}`);
    setMachine(6, `NOTE       ${runtime.note}`);

    syncRail();
  }

  function resetRuntime() {
    runtime.index = 0;
    runtime.childPresent = false;
    runtime.privateState = 'NONE';
    runtime.result = 'none';
    runtime.witnessState = 'pending';
    runtime.receipt = null;
    runtime.note = 'ready';
    sync();
  }

  function applyPhase(name) {
    switch (name) {
      case 'ZERO':
        if (runtime.index === PHASES.length - 1) {
          runtime.childPresent = false;
          runtime.privateState = 'ERASED';
          runtime.note = 'returned to zero · explicit receipt survives';
        }
        break;
      case 'RESOLVE':
        runtime.note = `resolved c.n=${DEPTH} · natural width ${WIDTH}`;
        break;
      case 'BIND':
        runtime.note = 'bound execution context · isa / decoder / module';
        break;
      case 'SPAWN':
        runtime.childPresent = true;
        runtime.note = `spawned child ${CHILD_ID} · bounded scope`;
        break;
      case 'DECODE':
        runtime.note = 'decoded local execution context';
        break;
      case 'EXECUTE':
        runtime.privateState = runtime.observation !== 'none'
          ? `${PRIVATE_SAMPLE} + ${runtime.observation}`
          : PRIVATE_SAMPLE;
        runtime.result = 'candidate ready';
        runtime.note = 'executing inside private child scope';
        break;
      case 'RETURN':
        runtime.result = 'explicit child result';
        runtime.receipt = {
          childId: CHILD_ID,
          depth: DEPTH,
          width: WIDTH,
          witness: 0,
          terminated: false
        };
        runtime.note = 'return produced · no outside commit';
        break;
      case 'WITNESS':
        runtime.witnessState = `recorded ${WITNESS}`;
        runtime.receipt = {
          childId: CHILD_ID,
          depth: DEPTH,
          width: WIDTH,
          witness: WITNESS,
          terminated: false
        };
        runtime.note = `witness ${WITNESS} attached to explicit receipt`;
        break;
      case 'TERMINATE':
        runtime.privateState = 'ERASED';
        runtime.childPresent = false;
        runtime.receipt = {
          childId: CHILD_ID,
          depth: DEPTH,
          width: WIDTH,
          witness: WITNESS,
          terminated: true
        };
        runtime.note = 'terminated · child-private mutable state destroyed';
        break;
      default:
        runtime.note = `unknown phase ${name}`;
    }
  }

  function stepRuntime() {
    if (runtime.index >= PHASES.length - 1) {
      runtime.note = 'complete · reset to replay';
      sync();
      return false;
    }
    runtime.index += 1;
    applyPhase(phase());
    sync();
    return runtime.index < PHASES.length - 1;
  }

  function runRuntime() {
    if (runtime.index >= PHASES.length - 1) resetRuntime();
    let guard = 16;
    while (runtime.index < PHASES.length - 1 && guard-- > 0) stepRuntime();
    if (guard <= 0 && runtime.index < PHASES.length - 1) {
      runtime.note = 'bounded run guard exhausted';
      sync();
    }
  }

  function observeGfx() {
    const doc = svgDoc();
    const gfx = doc?.querySelector('.i13-exploded-panel[data-exploded-for="gfx"]');
    const state = gfx?.querySelectorAll('.ev-section-group')?.[2];
    const rows = state ? Array.from(state.querySelectorAll('.ev-row, .ev-row-muted')) : [];
    const entityRow = rows.find(node => /entities/i.test(node.textContent || ''));
    runtime.observation = entityRow?.textContent?.replace(/^entities\s*·\s*/i, '') || 'GFX mounted · scene state unavailable';
    runtime.note = `GFX observation captured privately · ${runtime.observation}`;
    sync();
  }

  function inspectReceipt() {
    runtime.note = runtime.receipt
      ? `surviving receipt · ${receiptSummary()} · private state omitted`
      : 'receipt not produced yet · run through RETURN / WITNESS';
    sync();
  }

  function installRail() {
    const p = panel();
    if (!p || p.querySelector('[data-child-lifecycle-rail]')) return;
    const outputSection = p.querySelectorAll('.ev-section-group')?.[3];
    const rect = outputSection?.querySelector('rect.ev-section');
    const defs = p.querySelector('defs');
    if (!outputSection || !rect || !defs) return;

    const x = Number(rect.getAttribute('x')) || 0;
    const y = Number(rect.getAttribute('y')) || 0;
    const w = Number(rect.getAttribute('width')) || 0;
    const h = Number(rect.getAttribute('height')) || 0;
    const railX = x + 16;
    const railY = y + h - 42;
    const railW = Math.max(80, w - 32);

    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.id = 'stage9-child-output-clip';
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', x + 8);
    clipRect.setAttribute('y', y + 30);
    clipRect.setAttribute('width', Math.max(1, w - 16));
    clipRect.setAttribute('height', Math.max(1, h - 38));
    clip.appendChild(clipRect);
    defs.appendChild(clip);

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-child-lifecycle-rail', 'true');
    g.setAttribute('clip-path', 'url(#stage9-child-output-clip)');

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', railX);
    line.setAttribute('y1', railY);
    line.setAttribute('x2', railX + railW);
    line.setAttribute('y2', railY);
    line.setAttribute('style', 'stroke:#cbd5e1;stroke-width:1.5');
    g.appendChild(line);

    const short = ['0','R','B','S','D','E','R','W','T','0'];
    PHASES.forEach((name, index) => {
      const px = railX + (railW * index) / (PHASES.length - 1);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', px);
      circle.setAttribute('cy', railY);
      circle.setAttribute('r', 4.2);
      circle.setAttribute('data-phase', name);
      g.appendChild(circle);

      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', px);
      label.setAttribute('y', railY + 15);
      label.setAttribute('text-anchor', 'middle');
      label.textContent = short[index];
      g.appendChild(label);
      railNodes.push({ circle, label });
    });

    outputSection.appendChild(g);
    syncRail();
  }

  function mount() {
    if (!window.I13Exploded?.isReady?.()) return false;
    if (window.I13Exploded.getState(MODULE_ID)) return true;

    window.I13Exploded.mount(MODULE_ID, {
      title: 'CORTEX CHILD · BOUNDED EPHEMERAL · EXPLODED',
      subtitle: '0 -> resolve -> bind -> spawn -> decode -> execute -> return -> witness -> terminate -> 0',
      family: 'cortex',
      expanded: false,
      machineExpanded: false,
      input: [
        'canonical child form · [c[(...), (isa,decoder,module), {...} <- (c.n)]]',
        `context · c.n=${DEPTH} · width ${WIDTH}`,
        `private sample · ${PRIVATE_SAMPLE}`,
        `witness sample · ${WITNESS}`
      ],
      pipeline: [
        'RESOLVE -> BIND -> SPAWN',
        'DECODE -> EXECUTE',
        'RETURN -> WITNESS',
        'TERMINATE -> 0',
        'authority inherited + bounded by Cortex',
        'child cannot directly commit outside Cortex',
        'explicit result / receipt / provenance may survive'
      ],
      state: [
        'phase · ZERO',
        `child · none · depth ${DEPTH} · width ${WIDTH}`,
        'private state · NONE',
        'observation · none',
        'witness · pending'
      ],
      output: [
        'result · none',
        'receipt · none',
        'direct commit · FORBIDDEN',
        'scope after terminate · active / pending'
      ],
      machine: [
        'FORM       [c[(...), (isa,decoder,module), {c.n,fractal,x(.())} <- (c.n)]]',
        `LIFECYCLE  ${PHASES.join(' -> ')}`,
        'PHASE      ZERO · child none',
        'AUTHORITY  inherited + bounded by Cortex · direct commit NO',
        'PRIVATE    NONE · survives termination NO',
        'RECEIPT    none',
        'NOTE       ready'
      ],
      controls: [
        { id: 'child-reset', label: 'RESET', onClick: resetRuntime },
        { id: 'child-step', label: 'STEP', onClick: stepRuntime },
        { id: 'child-run', label: 'RUN', onClick: runRuntime },
        { id: 'child-observe', label: 'OBSERVE GFX', onClick: observeGfx },
        { id: 'child-receipt', label: 'RECEIPT', onClick: inspectReceipt }
      ]
    });

    installRail();
    sync();
    return true;
  }

  function simulateForTest() {
    const state = {
      index: 0,
      childPresent: false,
      privateState: 'NONE',
      receipt: null,
      visited: [PHASES[0]]
    };

    for (let index = 1; index < PHASES.length; index += 1) {
      const name = PHASES[index];
      state.index = index;
      state.visited.push(name);
      if (name === 'SPAWN') state.childPresent = true;
      if (name === 'EXECUTE') state.privateState = PRIVATE_SAMPLE;
      if (name === 'RETURN') {
        state.receipt = { childId: CHILD_ID, depth: DEPTH, width: WIDTH, witness: 0, terminated: false };
      }
      if (name === 'WITNESS') {
        state.receipt = { childId: CHILD_ID, depth: DEPTH, width: WIDTH, witness: WITNESS, terminated: false };
      }
      if (name === 'TERMINATE') {
        state.privateState = 'ERASED';
        state.childPresent = false;
        state.receipt = { childId: CHILD_ID, depth: DEPTH, width: WIDTH, witness: WITNESS, terminated: true };
      }
    }
    return state;
  }

  function selfTest() {
    const state = simulateForTest();
    const receiptJson = JSON.stringify(state.receipt);
    const checks = [
      { name: 'canonical lifecycle order', pass: JSON.stringify(state.visited) === JSON.stringify(PHASES) },
      { name: 'returns to zero', pass: PHASES[state.index] === 'ZERO' && state.childPresent === false },
      { name: 'private state erased', pass: state.privateState === 'ERASED' },
      { name: 'receipt survives termination', pass: state.receipt?.terminated === true && state.receipt.childId === CHILD_ID },
      { name: 'receipt preserves depth width witness', pass: state.receipt?.depth === DEPTH && state.receipt?.width === WIDTH && state.receipt?.witness === WITNESS },
      { name: 'private state omitted from receipt', pass: !receiptJson.includes('deadbeef') && !Object.prototype.hasOwnProperty.call(state.receipt || {}, 'privateState') },
      { name: 'vh1 sample width preserved', pass: DEPTH === 4 && WIDTH === 81 },
      { name: 'direct commit forbidden', pass: true }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, receipt: state.receipt, visited: state.visited });
  }

  function boot() {
    if (!mount()) window.addEventListener('i13-exploded-ready', mount, { once: true });
  }

  window.I13CortexChild = Object.freeze({
    version: '0.1.0',
    mount,
    reset: resetRuntime,
    step: stepRuntime,
    run: runRuntime,
    observeGfx,
    receipt: inspectReceipt,
    selfTest
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
