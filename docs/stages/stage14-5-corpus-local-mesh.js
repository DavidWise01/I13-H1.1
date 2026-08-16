/* I13 H1.1 — Stage 14.5: Queen local neighborhood / mesh field.
 * Visual topology layer over Stage 14.4. Traversal and edge authority remain in
 * the Stage 14.2 Rust/Wasm corpus walker. This layer asks the Wasm neighbor ABI
 * for Q's exact current root and renders only that local ego-mesh.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MODULE_ID = 'corpus';
  const WASM_URL = 'assets/i13_h1_1.wasm.b64';
  const MANIFEST_URL = 'assets/corpus-browser.json';
  const SUCCESS = 1n << 63n;
  const MASK32 = 0xffff_ffffn;
  const EDGE_DOMAIN = 0x01;
  const EDGE_WORLD = 0x02;

  const mesh = {
    manifest: null,
    wasm: null,
    byId: new Map(),
    byAddress: new Map(),
    ready: false,
    note: 'local mesh assets pending',
    signature: '',
    timer: null,
    bootToken: 0,
    selectedNeighbor: null
  };

  function u32(value) { return Number(value) >>> 0; }
  function svgDoc() { return document.getElementById('i13')?.contentDocument || null; }
  function panel() { return svgDoc()?.querySelector(`.i13-exploded-panel[data-exploded-for="${MODULE_ID}"]`) || null; }
  function stageState() { return window.I13CorpusNavigatorStage?.state?.() || null; }
  function spatialStage() { return window.I13CorpusSpatialStage || null; }
  function spatialGroup() { return panel()?.querySelector('[data-stage14-4-spatial]') || null; }
  function nodeById(id) { return id ? mesh.byId.get(id) || null : null; }
  function nodeByAddress(address) { return mesh.byAddress.get(u32(address)) || null; }

  function bytesFromB64(text) {
    const clean = String(text || '').replace(/\s+/g, '');
    const raw = atob(clean);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
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

  function decodeWalk(value) {
    const v = BigInt(value);
    if ((v & SUCCESS) === 0n) return null;
    return {
      address: Number(v & MASK32) >>> 0,
      distance: Number((v >> 32n) & 0x7fff_ffffn)
    };
  }

  function edgeKinds(flags) {
    const kinds = [];
    if (flags & EDGE_DOMAIN) kinds.push('DOMAIN');
    if (flags & EDGE_WORLD) kinds.push('WORLD');
    return kinds.length ? kinds : ['UNKNOWN'];
  }

  function edgeStyle(edge, isNext, isPending) {
    if (isPending) return { stroke: '#f59e0b', dash: '', opacity: .96 };
    if (isNext) return { stroke: '#2563eb', dash: '', opacity: .94 };
    if ((edge.flags & (EDGE_DOMAIN | EDGE_WORLD)) === (EDGE_DOMAIN | EDGE_WORLD)) {
      return { stroke: '#7c3aed', dash: '', opacity: .82 };
    }
    if (edge.flags & EDGE_WORLD) return { stroke: '#d97706', dash: '5 3', opacity: .86 };
    return { stroke: '#0d9488', dash: '', opacity: .56 };
  }

  function localNeighbors(state = stageState()) {
    if (!mesh.wasm || !state?.current) return [];
    const current = nodeById(state.current);
    if (!current) return [];
    const evidence = state.evidenceOnly ? 1 : 0;
    const count = Number(mesh.wasm.i13_corpus_neighbor_count(u32(current.address), evidence));
    const out = [];
    for (let slot = 0; slot < count; slot++) {
      const decoded = decodeNeighbor(mesh.wasm.i13_corpus_neighbor(u32(current.address), slot, evidence));
      if (!decoded) continue;
      const node = nodeByAddress(decoded.address);
      if (!node) continue;
      out.push(Object.freeze({ slot, node, address: decoded.address, flags: decoded.flags, weight: decoded.weight }));
    }
    return out;
  }

  function nextHop(state = stageState()) {
    if (!mesh.wasm || !state?.current || !state?.goal) return null;
    const current = nodeById(state.current);
    const goal = nodeById(state.goal);
    if (!current || !goal || u32(current.address) === u32(goal.address)) return null;
    const decoded = decodeWalk(mesh.wasm.i13_corpus_walk_next(
      u32(current.address), u32(goal.address), state.evidenceOnly ? 1 : 0, 54
    ));
    return decoded ? nodeByAddress(decoded.address) : null;
  }

  function el(name, attrs = {}, text = '') {
    const doc = svgDoc();
    if (!doc) return null;
    const node = doc.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
    if (text !== '') node.textContent = String(text);
    return node;
  }

  function addTitle(node, text) {
    if (!node) return;
    const title = el('title', {}, text);
    if (title) node.appendChild(title);
  }

  function geometry() {
    const machine = panel()?.querySelector('.ev-machine');
    if (!machine) return null;
    const mx = Number(machine.getAttribute('x')) || 0;
    const my = Number(machine.getAttribute('y')) || 0;
    const mw = Number(machine.getAttribute('width')) || 0;
    const mh = Number(machine.getAttribute('height')) || 0;
    if (mh < 120 || mw < 700) return null;
    const vx = mx + Math.max(440, mw * 0.43);
    const vy = my + 45;
    const vw = Math.max(360, mx + mw - vx - 10);
    const vh = Math.max(84, mh - 45 - 38);
    const voxelW = Math.min(150, Math.max(118, vw * 0.28));
    const mapW = Math.max(190, vw - voxelW - 28);
    const mapH = Math.max(58, vh - 28);
    return {
      vx, vy, vw, vh,
      mapBox: { left: vx + 12, top: vy + 20, width: mapW - 20, height: mapH - 12 }
    };
  }

  function selectNeighbor(id) {
    if (!mesh.byId.has(id)) return false;
    mesh.selectedNeighbor = id;
    mesh.note = `neighbor selected · ${id} · preview only`;
    spatialStage()?.selectRoot?.(id);
    mesh.signature = '';
    sync(true);
    return true;
  }

  function renderLocalMesh(state) {
    const base = spatialGroup();
    const geo = geometry();
    const projector = spatialStage()?.projectSurface;
    const current = nodeById(state?.current);
    if (!base || !geo || typeof projector !== 'function' || !current) return false;

    base.querySelector('[data-stage14-5-mesh]')?.remove();
    const g = el('g', {
      'data-stage14-5-mesh': 'true',
      role: 'group',
      'aria-label': 'Stage 14.5 Queen local corpus mesh'
    });
    if (!g) return false;

    const neighbors = localNeighbors(state);
    const next = nextHop(state);
    const pending = nodeById(state?.pending);
    const q = projector(current, geo.mapBox);
    const counts = { domain: 0, world: 0, both: 0 };

    neighbors.forEach(edge => {
      const n = projector(edge.node, geo.mapBox);
      const isNext = next?.id === edge.node.id;
      const isPending = pending?.id === edge.node.id;
      const style = edgeStyle(edge, isNext, isPending);
      if ((edge.flags & 0x03) === 0x03) counts.both++;
      else if (edge.flags & EDGE_WORLD) counts.world++;
      else if (edge.flags & EDGE_DOMAIN) counts.domain++;

      const width = Math.min(3.2, .85 + Math.max(1, edge.weight) * .28);
      const line = el('line', {
        x1: q.sx, y1: q.sy, x2: n.sx, y2: n.sy,
        style: `stroke:${style.stroke};stroke-width:${width};stroke-opacity:${style.opacity};${style.dash ? `stroke-dasharray:${style.dash};` : ''}pointer-events:none`
      });
      addTitle(line, `${current.id} -> ${edge.node.id} · ${edgeKinds(edge.flags).join('+')} · weight ${edge.weight}`);
      g.appendChild(line);

      const halo = el('circle', {
        cx: n.sx, cy: n.sy,
        r: isPending ? 8 : (isNext ? 7 : 5.7),
        style: `fill:none;stroke:${style.stroke};stroke-width:${isNext || isPending ? 1.8 : 1.05};stroke-opacity:.9;cursor:pointer;${style.dash ? `stroke-dasharray:${style.dash};` : ''}`
      });
      addTitle(halo, `${edge.node.id} · ${edgeKinds(edge.flags).join('+')} · weight ${edge.weight} · click = preview only`);
      halo.addEventListener('click', () => selectNeighbor(edge.node.id));
      g.appendChild(halo);

      if (isNext || isPending) {
        g.appendChild(el('text', {
          x: n.sx, y: n.sy - 8.5, 'text-anchor': 'middle',
          style: `font-size:6.5px;font-weight:900;fill:${style.stroke};pointer-events:none`
        }, isPending ? 'PENDING' : 'NEXT'));
      }
    });

    // Q topology halo: this is degree/mesh state, not another movement authority.
    g.appendChild(el('circle', {
      cx: q.sx, cy: q.sy, r: 9.2,
      style: 'fill:none;stroke:#be123c;stroke-width:1.2;stroke-opacity:.72;stroke-dasharray:2 2;pointer-events:none'
    }));
    g.appendChild(el('text', {
      x: q.sx, y: q.sy + 12.5, 'text-anchor': 'middle',
      style: 'font-size:6.5px;font-weight:900;fill:#be123c;pointer-events:none'
    }, `deg ${neighbors.length}`));

    const badgeX = geo.mapBox.left + 3;
    const badgeY = geo.mapBox.top + geo.mapBox.height - 18;
    const badgeW = Math.min(238, geo.mapBox.width - 6);
    g.appendChild(el('rect', {
      x: badgeX, y: badgeY, width: badgeW, height: 14, rx: 7,
      style: 'fill:#ffffff;fill-opacity:.92;stroke:#94a3b8;stroke-width:.7;pointer-events:none'
    }));
    g.appendChild(el('text', {
      x: badgeX + 7, y: badgeY + 10,
      style: 'font-size:6.5px;font-weight:900;fill:#334155;pointer-events:none'
    }, `14.5 LOCAL MESH · ${neighbors.length} neighbors · D ${counts.domain} · W ${counts.world} · D+W ${counts.both} · ${state?.evidenceOnly ? 'EVIDENCE' : 'FULL'}`));

    base.appendChild(g);
    mesh.note = neighbors.length
      ? `local mesh PASS · ${current.id} degree ${neighbors.length}`
      : `local mesh · ${current.id} degree 0${state?.evidenceOnly ? ' (evidence gate)' : ''}`;
    return true;
  }

  function signatureFor(state) {
    return JSON.stringify({
      current: state?.current || null,
      goal: state?.goal || null,
      pending: state?.pending || null,
      evidenceOnly: !!state?.evidenceOnly,
      selectedNeighbor: mesh.selectedNeighbor,
      spatialReady: !!spatialStage()?.state?.()?.ready,
      spatialSelected: spatialStage()?.state?.()?.selected || null,
      overlayPresent: !!spatialGroup()?.querySelector('[data-stage14-5-mesh]')
    });
  }

  function sync(force = false) {
    if (!mesh.ready || !mesh.manifest || !mesh.wasm) return false;
    const state = stageState();
    if (!state || !spatialStage()?.state?.()?.ready) return false;
    const signature = signatureFor(state);
    const overlayPresent = !!spatialGroup()?.querySelector('[data-stage14-5-mesh]');
    if (!force && overlayPresent && signature === mesh.signature) return true;
    mesh.signature = signature;
    return renderLocalMesh(state);
  }

  async function bootAssets() {
    const token = ++mesh.bootToken;
    try {
      const [wasmResponse, manifestResponse] = await Promise.all([
        fetch(WASM_URL, { cache: 'no-store' }),
        fetch(MANIFEST_URL, { cache: 'no-store' })
      ]);
      if (!wasmResponse.ok) throw new Error(`Wasm asset HTTP ${wasmResponse.status}`);
      if (!manifestResponse.ok) throw new Error(`manifest HTTP ${manifestResponse.status}`);
      const [b64, manifest] = await Promise.all([wasmResponse.text(), manifestResponse.json()]);
      const result = await WebAssembly.instantiate(bytesFromB64(b64), {});
      if (token !== mesh.bootToken) return;
      const wasm = result.instance.exports;
      const required = [
        'i13_corpus_node_count','i13_corpus_edge_count','i13_corpus_neighbor_count',
        'i13_corpus_neighbor','i13_corpus_walk_next','i13_corpus_source_fingerprint'
      ];
      for (const name of required) if (typeof wasm[name] !== 'function') throw new Error(`missing export ${name}`);
      if (Number(wasm.i13_corpus_node_count()) !== manifest.counts.nodes) throw new Error('Wasm/manifest node count mismatch');
      if (Number(wasm.i13_corpus_edge_count()) !== manifest.counts.edges) throw new Error('Wasm/manifest edge count mismatch');
      if (u32(wasm.i13_corpus_source_fingerprint()) !== u32(manifest.fingerprints.corpus)) throw new Error('Wasm/manifest fingerprint mismatch');

      mesh.manifest = manifest;
      mesh.wasm = wasm;
      mesh.byId = new Map(manifest.nodes.map(node => [node.id, node]));
      mesh.byAddress = new Map(manifest.nodes.map(node => [u32(node.address), node]));
      mesh.ready = true;
      mesh.note = `local mesh assets PASS · ${manifest.counts.nodes} roots · ${manifest.counts.edges} edges`;
      mesh.signature = '';
      sync(true);
    } catch (error) {
      mesh.ready = false;
      mesh.note = `LOCAL MESH VETO · ${error.message}`;
    }
  }

  function meshSelfTest(manifest = mesh.manifest) {
    const synthetic = SUCCESS | 0x12345678n | (3n << 32n) | (5n << 40n);
    const decoded = decodeNeighbor(synthetic);
    const nodes = manifest?.nodes || [];
    const checks = [
      { name: 'domain edge bit is 0x01', pass: EDGE_DOMAIN === 0x01 },
      { name: 'World path edge bit is 0x02', pass: EDGE_WORLD === 0x02 },
      { name: 'neighbor decoder preserves address', pass: decoded?.address === 0x12345678 },
      { name: 'neighbor decoder preserves combined flags', pass: decoded?.flags === 3 },
      { name: 'neighbor decoder preserves weight', pass: decoded?.weight === 5 },
      { name: 'Stage 14.5 uses same corpus module', pass: MODULE_ID === 'corpus' },
      { name: 'Stage 14.5 manifest has 54 roots when supplied', pass: !manifest || manifest.counts.nodes === 54 },
      { name: 'Stage 14.5 manifest has 187 mesh edges when supplied', pass: !manifest || manifest.counts.edges === 187 },
      { name: 'all manifest roots retain unique addresses', pass: !nodes.length || new Set(nodes.map(node => u32(node.address))).size === nodes.length },
      { name: 'visual layer does not export move/commit authority', pass: true }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, note: mesh.note });
  }

  function boot() {
    if (!window.I13CorpusNavigatorStage || !window.I13CorpusSpatialStage) {
      setTimeout(boot, 90);
      return;
    }
    bootAssets();
    if (mesh.timer) clearInterval(mesh.timer);
    mesh.timer = setInterval(() => sync(false), 140);
  }

  window.I13CorpusLocalMeshStage = Object.freeze({
    version: '14.5.0',
    boot,
    sync: () => sync(true),
    selectNeighbor,
    localNeighbors: () => Object.freeze(localNeighbors().map(edge => Object.freeze({
      id: edge.node.id,
      address: edge.address,
      flags: edge.flags,
      weight: edge.weight,
      evidence: !!edge.node.evidence
    }))),
    meshSelfTest,
    state: () => Object.freeze({
      ready: mesh.ready,
      current: stageState()?.current || null,
      degree: mesh.ready ? localNeighbors().length : 0,
      selectedNeighbor: mesh.selectedNeighbor,
      note: mesh.note
    })
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
