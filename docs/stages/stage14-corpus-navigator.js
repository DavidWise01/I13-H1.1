/* I13 H1.1 — Stage 14.3: browser Cortex corpus navigator.
 * Loads the Stage 14.2 Rust/Wasm walker plus a display-only corpus manifest.
 * Traversal authority stays in Wasm; the manifest supplies labels/metadata only.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MODULE_ID = 'corpus';
  const WASM_URL = 'assets/i13_h1_1.wasm.b64';
  const MANIFEST_URL = 'assets/corpus-browser.json';
  const SUCCESS = 1n << 63n;
  const MASK32 = 0xffff_ffffn;

  const runtime = {
    wasm: null,
    manifest: null,
    byId: new Map(),
    byAddress: new Map(),
    current: null,
    goal: null,
    pending: null,
    depth: 0,
    maxDepth: 81,
    authority: true,
    evidenceOnly: false,
    phase: 'BOOT',
    receipt: 'none',
    note: 'browser assets pending',
    auto: false,
    autoToken: 0
  };

  function svgDoc() { return document.getElementById('i13')?.contentDocument || null; }
  function panel() { return svgDoc()?.querySelector(`.i13-exploded-panel[data-exploded-for="${MODULE_ID}"]`) || null; }
  function sectionRows(index) {
    const section = panel()?.querySelectorAll('.ev-section-group')?.[index];
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
  function setSection(section, row, text) { const n = sectionRows(section)[row]; if (n) n.textContent = text; }
  function setMachine(row, text) { const n = machineRows()[row]; if (n) n.textContent = text; }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function u32(n) { return Number(n) >>> 0; }
  function hex(n) { return `0x${u32(n).toString(16).padStart(8, '0')}`; }
  function xy(node) { return node ? `<${node.x},${node.y}>` : '<—,—>'; }
  function label(node) {
    if (!node) return '—';
    const title = String(node.title || '').replace(/\s+/g, ' ').trim();
    return `${node.id} · ${title.length > 44 ? `${title.slice(0, 41)}…` : title}`;
  }
  function bytesFromB64(text) {
    const clean = String(text || '').replace(/\s+/g, '');
    const raw = atob(clean);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function nodeByAddress(address) { return runtime.byAddress.get(u32(address)) || null; }

  function decodeWalk(value) {
    const v = BigInt(value);
    if ((v & SUCCESS) === 0n) return null;
    return {
      address: Number(v & MASK32) >>> 0,
      distance: Number((v >> 32n) & 0x7fff_ffffn)
    };
  }
  function decodeNeighbor(value) {
    const v = BigInt(value);
    if ((v & SUCCESS) === 0n) return null;
    return {
      address: Number(v & MASK32) >>> 0,
      flags: Number((v >> 32n) & 0xffn),
      weight: Number((v >> 40n) & 0xffn)
    };
  }
  function decodeBurrow(value) {
    const v = BigInt(value);
    if ((v & SUCCESS) === 0n) return null;
    return {
      address: Number(v & MASK32) >>> 0,
      depth: Number((v >> 32n) & 0x7fff_ffffn)
    };
  }

  function edgeMeta(from, to) {
    if (!runtime.wasm || !from || !to) return null;
    const count = Number(runtime.wasm.i13_corpus_neighbor_count(u32(from.address), runtime.evidenceOnly ? 1 : 0));
    for (let slot = 0; slot < count; slot++) {
      const decoded = decodeNeighbor(runtime.wasm.i13_corpus_neighbor(u32(from.address), slot, runtime.evidenceOnly ? 1 : 0));
      if (decoded?.address === u32(to.address)) return decoded;
    }
    return null;
  }

  function computeRoute(limit = 54) {
    if (!runtime.wasm || !runtime.current || !runtime.goal) return [];
    const route = [runtime.current.address];
    let current = runtime.current.address;
    const seen = new Set([u32(current)]);
    for (let i = 0; i < limit && u32(current) !== u32(runtime.goal.address); i++) {
      const step = decodeWalk(runtime.wasm.i13_corpus_walk_next(u32(current), u32(runtime.goal.address), runtime.evidenceOnly ? 1 : 0, limit));
      if (!step || seen.has(step.address)) break;
      route.push(step.address);
      seen.add(step.address);
      current = step.address;
    }
    return route;
  }

  function installRouteGraphic() {
    const p = panel();
    const output = p?.querySelectorAll('.ev-section-group')?.[3];
    const rect = output?.querySelector('rect.ev-section');
    if (!p || !output || !rect) return;
    output.querySelector('[data-stage14-route]')?.remove();

    const x = Number(rect.getAttribute('x')) || 0;
    const y = Number(rect.getAttribute('y')) || 0;
    const w = Number(rect.getAttribute('width')) || 0;
    const h = Number(rect.getAttribute('height')) || 0;
    const gy = y + h - 29;
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('data-stage14-route', 'true');
    g.setAttribute('pointer-events', 'none');

    const route = computeRoute();
    const display = route.length > 10 ? [...route.slice(0, 9), route.at(-1)] : route;
    if (!display.length) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', x + 12); text.setAttribute('y', gy + 4);
      text.setAttribute('style', 'font-size:9px;font-weight:700;fill:#64748b');
      text.textContent = runtime.wasm ? 'NO ADMISSIBLE ROUTE' : 'WASM ROUTE PENDING';
      g.appendChild(text); output.appendChild(g); return;
    }

    const left = x + 16, right = x + w - 16;
    const span = Math.max(1, display.length - 1);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', left); line.setAttribute('x2', right);
    line.setAttribute('y1', gy); line.setAttribute('y2', gy);
    line.setAttribute('style', 'stroke:#94a3b8;stroke-width:1.4');
    g.appendChild(line);

    display.forEach((address, index) => {
      const cx = left + ((right - left) * index / span);
      const node = nodeByAddress(address);
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx', cx); circle.setAttribute('cy', gy); circle.setAttribute('r', index === 0 ? 6 : 4.5);
      let fill = node?.evidence ? '#0d9488' : '#fb7185';
      if (runtime.pending && u32(runtime.pending.address) === u32(address)) fill = '#f59e0b';
      if (index === 0) fill = '#be123c';
      if (runtime.goal && u32(runtime.goal.address) === u32(address)) fill = '#2563eb';
      circle.setAttribute('style', `fill:${fill};stroke:#fff;stroke-width:1.2`);
      g.appendChild(circle);
    });

    const q = document.createElementNS(SVG_NS, 'text');
    q.setAttribute('x', left); q.setAttribute('y', gy - 9); q.setAttribute('text-anchor', 'middle');
    q.setAttribute('style', 'font-size:8px;font-weight:900;fill:#be123c'); q.textContent = 'Q'; g.appendChild(q);
    const summary = document.createElementNS(SVG_NS, 'text');
    summary.setAttribute('x', x + w / 2); summary.setAttribute('y', gy + 18); summary.setAttribute('text-anchor', 'middle');
    summary.setAttribute('style', 'font-size:8px;font-weight:700;fill:#64748b');
    summary.textContent = `${route.length} root${route.length === 1 ? '' : 's'} · ${runtime.evidenceOnly ? 'EVIDENCE ONLY' : 'FULL MESH'}`;
    g.appendChild(summary);
    output.appendChild(g);
  }

  function sync() {
    const current = runtime.current, goal = runtime.goal, pending = runtime.pending;
    const route = computeRoute();
    const neighborCount = runtime.wasm && current
      ? Number(runtime.wasm.i13_corpus_neighbor_count(u32(current.address), runtime.evidenceOnly ? 1 : 0)) : 0;

    setSection(0, 0, `Wasm asset · ${runtime.wasm ? 'READY' : 'pending'}`);
    setSection(0, 1, `manifest · ${runtime.manifest ? `${runtime.manifest.counts.nodes} nodes` : 'pending'}`);
    setSection(0, 2, `current · ${label(current)}`);
    setSection(0, 3, `goal · ${label(goal)}`);

    setSection(1, 0, `walk_next(current, goal, evidence=${runtime.evidenceOnly ? 1 : 0})`);
    setSection(1, 1, `c[v[ ${current ? current.id : '—'}`);
    setSection(1, 2, `{ local z=${runtime.depth} · authority=${runtime.authority ? 'ON' : 'OFF'} }`);
    setSection(1, 3, `() ${pending ? `candidate ${pending.id}` : 'candidate waiting'}`);
    setSection(1, 4, ']]cv] verify same-root voxel transition');
    setSection(1, 5, 'PASS -> commit next root · VETO -> hold');

    setSection(2, 0, `phase · ${runtime.phase}`);
    setSection(2, 1, `surface · ${xy(current)} ${current ? hex(current.address) : ''}`);
    setSection(2, 2, `voxel z · ${runtime.depth}/${runtime.maxDepth}`);
    setSection(2, 3, `neighbors · ${neighborCount}`);
    setSection(2, 4, `current evidence · ${current ? (current.evidence ? 'YES' : 'CONTEXT/VOGEL') : '—'}`);
    setSection(2, 5, `mode · ${runtime.evidenceOnly ? 'EVIDENCE ONLY' : 'FULL MESH'}`);

    setSection(3, 0, `next · ${pending ? label(pending) : '—'}`);
    setSection(3, 1, `goal · ${goal ? goal.id : '—'}`);
    setSection(3, 2, `shortest roots · ${route.length || 0}`);
    setSection(3, 3, `receipt · ${runtime.receipt}`);

    setMachine(0, `WASM      ${runtime.wasm ? 'LIVE Stage 14.2 walker' : 'asset pending'}`);
    setMachine(1, `CORPUS    ${runtime.manifest ? `${runtime.manifest.counts.nodes} nodes · ${runtime.manifest.counts.edges} edges` : 'pending'}`);
    setMachine(2, `CURRENT   ${current ? `${current.id} · ${hex(current.address)} · ${xy(current)}` : '—'}`);
    setMachine(3, `GOAL      ${goal ? `${goal.id} · ${hex(goal.address)} · ${xy(goal)}` : '—'}`);
    setMachine(4, `PHASE     ${runtime.phase} · z=${runtime.depth} · authority=${runtime.authority ? 'ON' : 'OFF'}`);
    setMachine(5, `CV        ${runtime.receipt}`);
    setMachine(6, `STATE     ${runtime.note}`);
    installRouteGraphic();
  }

  function defaults() {
    runtime.current = runtime.byId.get('sonia-001') || runtime.manifest?.nodes?.[0] || null;
    runtime.goal = runtime.byId.get('fractal-007') || runtime.manifest?.nodes?.at(-1) || null;
    runtime.pending = null; runtime.depth = 0; runtime.authority = true; runtime.evidenceOnly = false;
    runtime.phase = 'READY'; runtime.receipt = 'none'; runtime.note = 'Sonia -> Fractint route ready';
  }

  async function bootAssets() {
    runtime.phase = 'BOOT'; runtime.note = 'fetching Stage 14.2 Wasm + browser manifest'; sync();
    try {
      const [wasmResponse, manifestResponse] = await Promise.all([fetch(WASM_URL, { cache: 'no-store' }), fetch(MANIFEST_URL, { cache: 'no-store' })]);
      if (!wasmResponse.ok) throw new Error(`Wasm asset HTTP ${wasmResponse.status}`);
      if (!manifestResponse.ok) throw new Error(`manifest HTTP ${manifestResponse.status}`);
      const [b64, manifest] = await Promise.all([wasmResponse.text(), manifestResponse.json()]);
      const result = await WebAssembly.instantiate(bytesFromB64(b64), {});
      const wasm = result.instance.exports;
      const required = ['i13_corpus_node_count','i13_corpus_edge_count','i13_corpus_neighbor_count','i13_corpus_neighbor','i13_corpus_walk_next','i13_corpus_burrow','i13_corpus_is_evidence','i13_corpus_source_fingerprint'];
      for (const name of required) if (typeof wasm[name] !== 'function') throw new Error(`missing export ${name}`);
      if (Number(wasm.i13_corpus_node_count()) !== manifest.counts.nodes) throw new Error('Wasm/manifest node count mismatch');
      if (Number(wasm.i13_corpus_edge_count()) !== manifest.counts.edges) throw new Error('Wasm/manifest edge count mismatch');
      if (u32(wasm.i13_corpus_source_fingerprint()) !== u32(manifest.fingerprints.corpus)) throw new Error('Wasm/manifest corpus fingerprint mismatch');

      runtime.wasm = wasm; runtime.manifest = manifest;
      runtime.byId = new Map(manifest.nodes.map(node => [node.id, node]));
      runtime.byAddress = new Map(manifest.nodes.map(node => [u32(node.address), node]));
      defaults();
      runtime.note = `Wasm PASS · ${manifest.counts.nodes} roots · ${manifest.counts.edges} mesh edges`;
    } catch (error) {
      runtime.wasm = null; runtime.phase = 'ASSET VETO'; runtime.note = error.message; runtime.receipt = 'VETO · browser assets unavailable';
    }
    sync();
  }

  function reset() {
    runtime.auto = false; runtime.autoToken++;
    if (runtime.manifest) defaults();
    else { runtime.phase = 'BOOT'; runtime.note = 'assets not ready'; }
    sync();
  }

  function cycleGoal() {
    if (!runtime.manifest || !runtime.current) return;
    const nodes = runtime.manifest.nodes;
    let index = Math.max(0, nodes.findIndex(node => runtime.goal && node.id === runtime.goal.id));
    for (let i = 0; i < nodes.length; i++) {
      index = (index + 1) % nodes.length;
      if (!runtime.evidenceOnly || nodes[index].evidence) break;
    }
    runtime.goal = nodes[index]; runtime.pending = null; runtime.depth = 0; runtime.receipt = 'none';
    runtime.phase = 'GOAL SELECT'; runtime.note = `goal -> ${runtime.goal.id}`; sync();
  }

  function proposeStep() {
    if (!runtime.wasm || !runtime.current || !runtime.goal) { runtime.note = 'Wasm/manifest not ready'; sync(); return false; }
    if (u32(runtime.current.address) === u32(runtime.goal.address)) {
      runtime.pending = null; runtime.phase = 'ARRIVED'; runtime.note = `arrived at ${runtime.goal.id}`; sync(); return false;
    }
    const step = decodeWalk(runtime.wasm.i13_corpus_walk_next(u32(runtime.current.address), u32(runtime.goal.address), runtime.evidenceOnly ? 1 : 0, 54));
    if (!step) {
      runtime.pending = null; runtime.phase = 'WALK VETO'; runtime.receipt = 'VETO · no admissible bounded route';
      runtime.note = runtime.evidenceOnly ? 'evidence-only route unavailable from current/goal' : 'no bounded route'; sync(); return false;
    }
    runtime.pending = nodeByAddress(step.address);
    if (!runtime.pending) {
      runtime.phase = 'MANIFEST VETO'; runtime.receipt = 'VETO · next Wasm root absent from manifest'; runtime.note = hex(step.address); sync(); return false;
    }
    runtime.depth = 0; runtime.phase = 'c[v['; runtime.receipt = 'pending CV';
    runtime.note = `candidate ${runtime.pending.id} · distance ${step.distance}`; sync(); return true;
  }

  function burrow() {
    if (!runtime.pending) { runtime.note = 'propose STEP before burrowing'; sync(); return; }
    runtime.depth = Math.min(runtime.maxDepth, runtime.depth + 1);
    runtime.phase = 'VOXEL'; runtime.note = `inside ${runtime.current.id} voxel · z=${runtime.depth}`; sync();
  }

  function cvExit() {
    if (!runtime.wasm || !runtime.current || !runtime.pending) { runtime.note = 'no pending voxel exit'; sync(); return false; }
    const verified = decodeBurrow(runtime.wasm.i13_corpus_burrow(u32(runtime.current.address), runtime.depth, runtime.maxDepth, runtime.authority ? 1 : 0));
    if (!verified || verified.address !== u32(runtime.current.address)) {
      runtime.phase = ']]cv] VETO'; runtime.receipt = `VETO · ${runtime.authority ? 'depth/root gate' : 'authority off'}`;
      runtime.note = `hold ${runtime.current.id} · candidate ${runtime.pending.id} not committed`; sync(); return false;
    }
    const from = runtime.current, to = runtime.pending, meta = edgeMeta(from, to);
    runtime.current = to; runtime.pending = null; runtime.depth = 0;
    runtime.phase = ']]cv] PASS -> EXIT';
    runtime.receipt = `PASS · ${from.id} -> ${to.id}${meta ? ` · flags=${meta.flags} weight=${meta.weight}` : ''}`;
    runtime.note = u32(runtime.current.address) === u32(runtime.goal.address) ? `arrived at ${runtime.goal.id}` : 'exit committed · ready for next root';
    sync(); return true;
  }

  function toggleEvidence() {
    runtime.evidenceOnly = !runtime.evidenceOnly; runtime.pending = null; runtime.depth = 0;
    runtime.phase = 'POLICY'; runtime.receipt = 'none';
    runtime.note = runtime.evidenceOnly ? 'evidence-only traversal enabled · Vogel/context excluded' : 'full mesh traversal enabled'; sync();
  }

  function toggleAuthority() {
    runtime.authority = !runtime.authority; runtime.phase = 'AUTHORITY';
    runtime.note = `Cortex authority ${runtime.authority ? 'ON' : 'OFF'}`; sync();
  }

  async function autoWalk() {
    if (runtime.auto) { runtime.auto = false; runtime.autoToken++; runtime.note = 'auto stopped'; sync(); return; }
    if (!runtime.wasm) { runtime.note = 'Wasm not ready'; sync(); return; }
    runtime.auto = true; const token = ++runtime.autoToken; runtime.note = 'AUTO running'; sync();
    for (let hop = 0; hop < 54 && runtime.auto && token === runtime.autoToken; hop++) {
      if (runtime.current && runtime.goal && u32(runtime.current.address) === u32(runtime.goal.address)) break;
      if (!proposeStep()) break;
      await sleep(360); if (!runtime.auto || token !== runtime.autoToken) break;
      burrow(); await sleep(320); if (!runtime.auto || token !== runtime.autoToken) break;
      if (!cvExit()) break;
      await sleep(420);
    }
    if (token === runtime.autoToken) { runtime.auto = false; runtime.note = runtime.current === runtime.goal ? 'AUTO arrived' : runtime.note; sync(); }
  }

  function mount() {
    if (!window.I13Exploded?.isReady?.()) return false;
    if (window.I13Exploded.getState(MODULE_ID)) return true;
    window.I13Exploded.mount(MODULE_ID, {
      title: 'STAGE 14.3 · CORPUS CORTEX NAVIGATOR · EXPLODED',
      subtitle: 'Wasm walk_next -> c[v[ voxel -> ]]cv] -> commit next OLOGY root',
      family: 'live',
      expanded: false,
      machineExpanded: true,
      input: ['Wasm asset · pending','manifest · pending','current · —','goal · —'],
      pipeline: ['walk_next(current, goal, evidence=0)','c[v[ —','{ local z=0 · authority=ON }','() candidate waiting',']]cv] verify same-root voxel transition','PASS -> commit next root · VETO -> hold'],
      state: ['phase · BOOT','surface · <—,—>','voxel z · 0/81','neighbors · 0','current evidence · —','mode · FULL MESH'],
      output: ['next · —','goal · —','shortest roots · 0','receipt · none'],
      machine: ['WASM      asset pending','CORPUS    pending','CURRENT   —','GOAL      —','PHASE     BOOT · z=0 · authority=ON','CV        none','STATE     browser assets pending'],
      controls: [
        { id: 'c14-reset', label: 'RESET', onClick: reset },
        { id: 'c14-goal', label: 'GOAL +', onClick: cycleGoal },
        { id: 'c14-step', label: 'STEP', onClick: proposeStep },
        { id: 'c14-burrow', label: 'BURROW', onClick: burrow },
        { id: 'c14-cv', label: 'CV / EXIT', onClick: cvExit },
        { id: 'c14-auto', label: 'AUTO', onClick: autoWalk },
        { id: 'c14-evidence', label: 'EVIDENCE', onClick: toggleEvidence },
        { id: 'c14-authority', label: 'AUTHORITY', onClick: toggleAuthority }
      ]
    });
    sync();
    bootAssets();
    return true;
  }

  function selfTest() {
    const checks = [
      { name: 'Stage 14.2 Wasm URL fixed', pass: WASM_URL.endsWith('i13_h1_1.wasm.b64') },
      { name: 'browser manifest URL fixed', pass: MANIFEST_URL.endsWith('corpus-browser.json') },
      { name: 'Cortex module is corpus', pass: MODULE_ID === 'corpus' },
      { name: 'CV success bit is i64 bit63', pass: SUCCESS === (1n << 63n) },
      { name: 'runtime max voxel depth starts at 81', pass: runtime.maxDepth === 81 },
      { name: 'live node count matches 54 when booted', pass: !runtime.manifest || runtime.manifest.counts.nodes === 54 },
      { name: 'live edge count matches 187 when booted', pass: !runtime.manifest || runtime.manifest.counts.edges === 187 }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, phase: runtime.phase });
  }

  function boot() { if (!mount()) window.addEventListener('i13-exploded-ready', mount, { once: true }); }

  window.I13CorpusNavigatorStage = Object.freeze({
    version: '0.1.0', mount, reset, step: proposeStep, burrow, verifyExit: cvExit,
    auto: autoWalk, toggleEvidence, toggleAuthority, selfTest,
    state: () => Object.freeze({ phase: runtime.phase, current: runtime.current?.id || null, goal: runtime.goal?.id || null, pending: runtime.pending?.id || null, depth: runtime.depth, authority: runtime.authority, evidenceOnly: runtime.evidenceOnly })
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
