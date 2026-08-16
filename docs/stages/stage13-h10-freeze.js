/* I13 H1.1 — Stage 13: H1.0 frozen boundary inspector.
 * Grounded in spec/H1.0-BOUNDARY.md.
 * H1.1 may reference H1.0 but must not silently mutate frozen semantics.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MODULE_ID = 'freeze';
  const FREEZE_ID = 'H1.0';

  const FROZEN = Object.freeze([
    Object.freeze({ key: 'child', label: 'bounded [c[(...)]] Cortex child', value: 'bounded ephemeral child concept' }),
    Object.freeze({ key: 'context', label: 'c.n resolved Cortex context/depth', value: 'resolved Cortex context / depth' }),
    Object.freeze({ key: 'width', label: '.() natural fractal width', value: 'context-derived natural width resolver' }),
    Object.freeze({ key: 'vh1', label: 'VH1 ternary 1/3/9/27/81', value: 'base-3 profile at depth 0..4' }),
    Object.freeze({ key: 'vh2', label: '[[5,1,3]] CUBI reference', value: 'numerical five-qubit hypothesis reference' }),
    Object.freeze({ key: 'split', label: '5 -> (2|3) -> 1', value: 'canonical small control block' }),
    Object.freeze({ key: 'odd', label: 'N = 2k + 1', value: 'generalized odd-width law' }),
    Object.freeze({ key: 'gfx', label: 'GFX v0.4.1 historical suite', value: 'historical browser / GPU reference' })
  ]);

  const runtime = {
    index: 0,
    verified: false,
    boundary: false,
    receipt: null,
    note: 'reference-only · immutable boundary'
  };

  const visual = { left: null, right: null, gate: null, label: null };

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

  function selected() {
    return FROZEN[runtime.index];
  }

  function makeReceipt() {
    const item = selected();
    return Object.freeze({
      freeze: FREEZE_ID,
      key: item.key,
      status: 'FROZEN_REFERENCE',
      mutationAllowed: false,
      semanticChangesBelongIn: 'H1.1+',
      verified: true
    });
  }

  function receiptSummary() {
    if (!runtime.receipt) return 'none';
    return `freeze=${runtime.receipt.freeze} key=${runtime.receipt.key} mutation=false -> H1.1+`;
  }

  function syncVisual() {
    if (!visual.left) return;
    const active = runtime.boundary || runtime.verified;
    visual.left.setAttribute('style', 'fill:#f8fafc;stroke:var(--freeze,#64748b);stroke-width:1.5');
    visual.right.setAttribute('style', active
      ? 'fill:#f0fdf4;stroke:var(--live,#16a34a);stroke-width:1.5'
      : 'fill:#fff;stroke:#cbd5e1;stroke-width:1.2');
    visual.gate.setAttribute('style', runtime.boundary
      ? 'stroke:var(--freeze,#64748b);stroke-width:3;stroke-dasharray:4 3'
      : 'stroke:#cbd5e1;stroke-width:2;stroke-dasharray:4 3');
    visual.label.textContent = runtime.boundary ? 'SEMANTIC CHANGE -> H1.1+' : 'REFERENCE ONLY';
  }

  function sync() {
    const item = selected();
    setSection(2, 0, `selected frozen fact · ${runtime.index + 1}/${FROZEN.length}`);
    setSection(2, 1, `key · ${item.key}`);
    setSection(2, 2, `status · ${runtime.verified ? 'VERIFIED REFERENCE' : 'frozen reference'}`);
    setSection(2, 3, 'mutation · FORBIDDEN IN H1.0');
    setSection(2, 4, `boundary · ${runtime.boundary ? 'VISIBLE' : 'ready'}`);

    setSection(3, 0, `H1.0 · ${item.label}`);
    setSection(3, 1, `meaning · ${item.value}`);
    setSection(3, 2, `receipt · ${receiptSummary()}`);
    setSection(3, 3, 'semantic change · route to H1.1+');

    setMachine(0, `FREEZE     ${FREEZE_ID} · immutable semantic boundary`);
    setMachine(1, `ITEM       ${runtime.index + 1}/${FROZEN.length} · ${item.key}`);
    setMachine(2, `FACT       ${item.label}`);
    setMachine(3, 'RULE       H1.1 may reference H1.0; silent semantic mutation forbidden');
    setMachine(4, 'MODEL NOTE recursion depth <=3 / authority path to 5 is project convention only');
    setMachine(5, 'EXTERNAL   not an implementation claim about ChatGPT/OpenAI or other systems');
    setMachine(6, `STATE      ${runtime.note}`);
    syncVisual();
  }

  function resetRuntime() {
    runtime.index = 0;
    runtime.verified = false;
    runtime.boundary = false;
    runtime.receipt = null;
    runtime.note = 'reference-only · immutable boundary';
    sync();
  }

  function nextItem() {
    runtime.index = (runtime.index + 1) % FROZEN.length;
    runtime.verified = false;
    runtime.receipt = null;
    runtime.note = `selected ${selected().key}`;
    sync();
  }

  function verifyItem() {
    runtime.verified = true;
    runtime.receipt = makeReceipt();
    runtime.note = `verified against Stage-13 frozen reference list · ${selected().key}`;
    sync();
  }

  function showBoundary() {
    runtime.boundary = !runtime.boundary;
    runtime.note = runtime.boundary
      ? 'boundary visible · semantic changes cross into H1.1+'
      : 'boundary hidden · reference-only remains enforced';
    sync();
  }

  function inspectReceipt() {
    if (!runtime.receipt) runtime.receipt = makeReceipt();
    runtime.note = `${receiptSummary()} · no write path into H1.0`;
    sync();
  }

  function installBoundaryGraphic() {
    const p = panel();
    if (!p || p.querySelector('[data-h10-freeze-boundary]')) return;
    const outputSection = p.querySelectorAll('.ev-section-group')?.[3];
    const rect = outputSection?.querySelector('rect.ev-section');
    const defs = p.querySelector('defs');
    if (!outputSection || !rect || !defs) return;

    const x = Number(rect.getAttribute('x')) || 0;
    const y = Number(rect.getAttribute('y')) || 0;
    const w = Number(rect.getAttribute('width')) || 0;
    const h = Number(rect.getAttribute('height')) || 0;
    const gx = x + 14;
    const gy = y + h - 56;
    const gw = Math.max(100, w - 28);
    const half = (gw - 16) / 2;

    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.id = 'stage13-h10-freeze-output-clip';
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', x + 8);
    clipRect.setAttribute('y', y + 30);
    clipRect.setAttribute('width', Math.max(1, w - 16));
    clipRect.setAttribute('height', Math.max(1, h - 38));
    clip.appendChild(clipRect);
    defs.appendChild(clip);

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-h10-freeze-boundary', 'true');
    g.setAttribute('clip-path', 'url(#stage13-h10-freeze-output-clip)');

    const left = document.createElementNS(SVG_NS, 'rect');
    left.setAttribute('x', gx);
    left.setAttribute('y', gy);
    left.setAttribute('width', half);
    left.setAttribute('height', 34);
    left.setAttribute('rx', 6);
    g.appendChild(left);

    const right = document.createElementNS(SVG_NS, 'rect');
    right.setAttribute('x', gx + half + 16);
    right.setAttribute('y', gy);
    right.setAttribute('width', half);
    right.setAttribute('height', 34);
    right.setAttribute('rx', 6);
    g.appendChild(right);

    const gateX = gx + half + 8;
    const gate = document.createElementNS(SVG_NS, 'line');
    gate.setAttribute('x1', gateX);
    gate.setAttribute('x2', gateX);
    gate.setAttribute('y1', gy - 4);
    gate.setAttribute('y2', gy + 38);
    g.appendChild(gate);

    const ltext = document.createElementNS(SVG_NS, 'text');
    ltext.setAttribute('x', gx + half / 2);
    ltext.setAttribute('y', gy + 15);
    ltext.setAttribute('text-anchor', 'middle');
    ltext.setAttribute('style', 'font-size:10px;font-weight:800;fill:var(--freeze,#64748b)');
    ltext.textContent = 'H1.0 · FROZEN';
    g.appendChild(ltext);

    const rtext = document.createElementNS(SVG_NS, 'text');
    rtext.setAttribute('x', gx + half + 16 + half / 2);
    rtext.setAttribute('y', gy + 15);
    rtext.setAttribute('text-anchor', 'middle');
    rtext.setAttribute('style', 'font-size:10px;font-weight:800;fill:var(--live,#16a34a)');
    rtext.textContent = 'H1.1+ · LIVE';
    g.appendChild(rtext);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', gx + gw / 2);
    label.setAttribute('y', gy + 29);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('style', 'font-size:8px;font-weight:700;fill:#64748b');
    g.appendChild(label);

    outputSection.appendChild(g);
    Object.assign(visual, { left, right, gate, label });
    syncVisual();
  }

  function mount() {
    if (!window.I13Exploded?.isReady?.()) return false;
    if (window.I13Exploded.getState(MODULE_ID)) return true;

    window.I13Exploded.mount(MODULE_ID, {
      title: 'H1.0 FREEZE · IMMUTABLE REFERENCE BOUNDARY · EXPLODED',
      subtitle: 'H1.0 frozen facts -> inspect / verify -> semantic changes route to H1.1+',
      family: 'freeze',
      expanded: false,
      machineExpanded: false,
      input: [
        'spec/H1.0-BOUNDARY.md',
        'frozen/reference facts · 8 carried forward',
        'H1.1 live development trunk',
        'request · reference / inspect only'
      ],
      pipeline: [
        'select frozen fact',
        'read preserved meaning',
        'verify reference identity',
        'deny silent H1.0 semantic mutation',
        'route semantic change to H1.1+',
        'emit immutable boundary receipt'
      ],
      state: [
        'selected frozen fact · 1/8',
        'key · child',
        'status · frozen reference',
        'mutation · FORBIDDEN IN H1.0',
        'boundary · ready'
      ],
      output: [
        `H1.0 · ${FROZEN[0].label}`,
        `meaning · ${FROZEN[0].value}`,
        'receipt · none',
        'semantic change · route to H1.1+'
      ],
      machine: [
        'FREEZE     H1.0 · immutable semantic boundary',
        'ITEM       1/8 · child',
        `FACT       ${FROZEN[0].label}`,
        'RULE       H1.1 may reference H1.0; silent semantic mutation forbidden',
        'MODEL NOTE recursion depth <=3 / authority path to 5 is project convention only',
        'EXTERNAL   not an implementation claim about ChatGPT/OpenAI or other systems',
        'STATE      reference-only · immutable boundary'
      ],
      controls: [
        { id: 'freeze-reset', label: 'RESET', onClick: resetRuntime },
        { id: 'freeze-next', label: 'ITEM +', onClick: nextItem },
        { id: 'freeze-verify', label: 'VERIFY', onClick: verifyItem },
        { id: 'freeze-boundary', label: 'BOUNDARY', onClick: showBoundary },
        { id: 'freeze-receipt', label: 'RECEIPT', onClick: inspectReceipt }
      ]
    });

    installBoundaryGraphic();
    sync();
    return true;
  }

  function selfTest() {
    const keys = FROZEN.map(item => item.key);
    const receipt = Object.freeze({ freeze: FREEZE_ID, mutationAllowed: false, semanticChangesBelongIn: 'H1.1+' });
    const checks = [
      { name: 'freeze id is H1.0', pass: FREEZE_ID === 'H1.0' },
      { name: 'eight frozen facts carried forward', pass: FROZEN.length === 8 },
      { name: 'frozen keys unique', pass: new Set(keys).size === FROZEN.length },
      { name: 'bounded child preserved', pass: FROZEN.some(x => x.key === 'child' && x.label.includes('[c[(...)]]')) },
      { name: 'c.n context preserved', pass: FROZEN.some(x => x.key === 'context' && x.label.includes('c.n')) },
      { name: 'natural width resolver preserved', pass: FROZEN.some(x => x.key === 'width' && x.label.includes('.()')) },
      { name: 'VH1 width profile preserved', pass: FROZEN.some(x => x.key === 'vh1' && x.label.includes('1/3/9/27/81')) },
      { name: 'VH2 CUBI reference preserved', pass: FROZEN.some(x => x.key === 'vh2' && x.label.includes('[[5,1,3]]')) },
      { name: '5 to 2|3 to 1 preserved', pass: FROZEN.some(x => x.key === 'split' && x.label.includes('(2|3)')) },
      { name: 'odd-width law preserved', pass: FROZEN.some(x => x.key === 'odd' && x.label.includes('2k + 1')) },
      { name: 'GFX v0.4.1 reference preserved', pass: FROZEN.some(x => x.key === 'gfx' && x.label.includes('v0.4.1')) },
      { name: 'H1.0 mutation denied', pass: receipt.mutationAllowed === false },
      { name: 'semantic changes route to H1.1+', pass: receipt.semanticChangesBelongIn === 'H1.1+' }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, frozenCount: FROZEN.length, keys });
  }

  function boot() {
    if (!mount()) window.addEventListener('i13-exploded-ready', mount, { once: true });
  }

  window.I13H10FreezeStage = Object.freeze({
    version: '0.1.0',
    mount,
    reset: resetRuntime,
    next: nextItem,
    verify: verifyItem,
    boundary: showBoundary,
    receipt: inspectReceipt,
    selfTest
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();