/* I13 H1.1 — Stage 14.4: Corpus Queen spatial viewport.
 * Visual layer over Stage 14.3. It does not own traversal or commit authority.
 * All 54 corpus roots are projected from the exact x16/y16 OLOGY address plane.
 * Axis convention is project-native: +x is UP/DOWN (screen vertical), +y is LEFT/RIGHT.
 * The selected surface root opens a local voxel/fiber preview; z remains local state.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MODULE_ID = 'corpus';
  const WASM_URL = 'assets/i13_h1_1.wasm.b64';
  const MANIFEST_URL = 'assets/corpus-browser.json';
  const SURFACE_MAX = 0xffff;
  const SUCCESS = 1n << 63n;
  const MASK32 = 0xffff_ffffn;
  const MAX_DEPTH = 81;

  const spatial = {
    manifest: null,
    wasm: null,
    byId: new Map(),
    byAddress: new Map(),
    selected: null,
    followQueen: true,
    note: 'spatial assets pending',
    ready: false,
    signature: '',
    timer: null,
    bootToken: 0
  };

  function u32(value) { return Number(value) >>> 0; }
  function packXY(x, y) { return ((((Number(x) & SURFACE_MAX) << 16) | (Number(y) & SURFACE_MAX)) >>> 0); }
  function hex(value) { return `0x${u32(value).toString(16).padStart(8, '0')}`; }
  function bytesFromB64(text) {
    const clean = String(text || '').replace(/\s+/g, '');
    const raw = atob(clean);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function svgDoc() { return document.getElementById('i13')?.contentDocument || null; }
  function panel() { return svgDoc()?.querySelector(`.i13-exploded-panel[data-exploded-for="${MODULE_ID}"]`) || null; }
  function stageState() { return window.I13CorpusNavigatorStage?.state?.() || null; }
  function nodeById(id) { return id ? spatial.byId.get(id) || null : null; }
  function nodeByAddress(address) { return spatial.byAddress.get(u32(address)) || null; }

  function projectSurface(node, box) {
    if (!node) return null;
    const x = Math.max(0, Math.min(SURFACE_MAX, Number(node.x) || 0));
    const y = Math.max(0, Math.min(SURFACE_MAX, Number(node.y) || 0));
    return {
      // +y moves right on screen.
      sx: box.left + (y / SURFACE_MAX) * box.width,
      // +x moves up on screen, so SVG y is inverted.
      sy: box.top + (1 - (x / SURFACE_MAX)) * box.height,
      x,
      y
    };
  }

  function decodeWalk(value) {
    const v = BigInt(value);
    if ((v & SUCCESS) === 0n) return null;
    return { address: Number(v & MASK32) >>> 0, distance: Number((v >> 32n) & 0x7fff_ffffn) };
  }

  function computeRoute(state, limit = 54) {
    if (!spatial.wasm || !state?.current || !state?.goal) return [];
    const currentNode = nodeById(state.current);
    const goalNode = nodeById(state.goal);
    if (!currentNode || !goalNode) return [];
    const route = [u32(currentNode.address)];
    const seen = new Set(route);
    let current = u32(currentNode.address);
    const goal = u32(goalNode.address);
    for (let i = 0; i < limit && current !== goal; i++) {
      const step = decodeWalk(spatial.wasm.i13_corpus_walk_next(current, goal, state.evidenceOnly ? 1 : 0, limit));
      if (!step || seen.has(step.address)) break;
      route.push(step.address);
      seen.add(step.address);
      current = step.address;
    }
    return route;
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

  function selectRoot(id) {
    if (!spatial.byId.has(id)) return false;
    spatial.selected = id;
    spatial.followQueen = false;
    spatial.note = `selected ${id} · voxel preview opened`;
    spatial.signature = '';
    sync(true);
    return true;
  }

  function focusQueen() {
    const state = stageState();
    if (!state?.current) return false;
    spatial.selected = state.current;
    spatial.followQueen = true;
    spatial.note = `following Queen @ ${state.current}`;
    spatial.signature = '';
    sync(true);
    return true;
  }

  function selectedDepth(state, selected) {
    return selected && state?.current === selected.id ? Math.max(0, Math.min(MAX_DEPTH, Number(state.depth) || 0)) : 0;
  }

  function renderSpatialViewport(state) {
    const p = panel();
    const machine = p?.querySelector('.ev-machine');
    if (!p || !machine || !spatial.manifest) return false;
    p.querySelector('[data-stage14-4-spatial]')?.remove();

    const mx = Number(machine.getAttribute('x')) || 0;
    const my = Number(machine.getAttribute('y')) || 0;
    const mw = Number(machine.getAttribute('width')) || 0;
    const mh = Number(machine.getAttribute('height')) || 0;
    if (mh < 120 || mw < 700) return false;

    const g = el('g', { 'data-stage14-4-spatial': 'true', role: 'group', 'aria-label': 'Stage 14.4 OLOGY spatial viewport' });
    const vx = mx + Math.max(440, mw * 0.43);
    const vy = my + 45;
    const vw = Math.max(360, mx + mw - vx - 10);
    const vh = Math.max(84, mh - 45 - 38);
    const voxelW = Math.min(150, Math.max(118, vw * 0.28));
    const mapW = Math.max(190, vw - voxelW - 28);
    const mapH = Math.max(58, vh - 28);
    const mapBox = { left: vx + 12, top: vy + 20, width: mapW - 20, height: mapH - 12 };
    const voxelX = vx + mapW + 8;

    g.appendChild(el('rect', {
      x: vx, y: vy, width: vw, height: vh, rx: 8,
      style: 'fill:#ffffff;fill-opacity:.94;stroke:#0d9488;stroke-width:1.2'
    }));
    g.appendChild(el('text', {
      x: vx + 12, y: vy + 14,
      style: 'font-size:9px;font-weight:900;letter-spacing:.08em;fill:#0f766e'
    }, '14.4 · OLOGY x16/y16 · 54 ROOTS'));

    const follow = el('g', { role: 'button', tabindex: '0', 'aria-label': 'Follow Queen' });
    follow.appendChild(el('rect', {
      x: vx + vw - 78, y: vy + 4, width: 68, height: 16, rx: 8,
      style: `fill:${spatial.followQueen ? '#fff1f2' : '#f8fafc'};stroke:${spatial.followQueen ? '#be123c' : '#94a3b8'};stroke-width:1;cursor:pointer`
    }));
    follow.appendChild(el('text', {
      x: vx + vw - 44, y: vy + 15, 'text-anchor': 'middle',
      style: `font-size:7px;font-weight:900;fill:${spatial.followQueen ? '#be123c' : '#64748b'};pointer-events:none`
    }, spatial.followQueen ? 'Q FOLLOW' : 'Q FOCUS'));
    follow.addEventListener('click', focusQueen);
    follow.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); focusQueen(); }
    });
    g.appendChild(follow);

    // Map frame and deterministic x/y grid. Project convention: x is vertical, y horizontal.
    g.appendChild(el('rect', {
      x: mapBox.left, y: mapBox.top, width: mapBox.width, height: mapBox.height, rx: 4,
      style: 'fill:#f8fafc;fill-opacity:.9;stroke:#cbd5e1;stroke-width:.8'
    }));
    for (let i = 1; i < 4; i++) {
      const gx = mapBox.left + mapBox.width * i / 4;
      const gy = mapBox.top + mapBox.height * i / 4;
      g.appendChild(el('line', { x1: gx, x2: gx, y1: mapBox.top, y2: mapBox.top + mapBox.height, style: 'stroke:#e2e8f0;stroke-width:.7;stroke-dasharray:2 3' }));
      g.appendChild(el('line', { x1: mapBox.left, x2: mapBox.left + mapBox.width, y1: gy, y2: gy, style: 'stroke:#e2e8f0;stroke-width:.7;stroke-dasharray:2 3' }));
    }
    g.appendChild(el('text', { x: mapBox.left + 3, y: mapBox.top + 9, style: 'font-size:7px;font-weight:800;fill:#64748b' }, '+x UP'));
    g.appendChild(el('text', { x: mapBox.left + mapBox.width - 3, y: mapBox.top + mapBox.height - 4, 'text-anchor': 'end', style: 'font-size:7px;font-weight:800;fill:#64748b' }, '+y RIGHT'));

    const route = computeRoute(state);
    if (route.length > 1) {
      const points = route.map(address => projectSurface(nodeByAddress(address), mapBox)).filter(Boolean);
      if (points.length > 1) {
        g.appendChild(el('polyline', {
          points: points.map(point => `${point.sx},${point.sy}`).join(' '),
          style: 'fill:none;stroke:#2563eb;stroke-width:1.5;stroke-opacity:.58;stroke-dasharray:4 3'
        }));
      }
    }

    const current = nodeById(state?.current);
    const goal = nodeById(state?.goal);
    const pending = nodeById(state?.pending);
    const selected = nodeById(spatial.selected) || current || spatial.manifest.nodes[0] || null;

    spatial.manifest.nodes.forEach(node => {
      const point = projectSurface(node, mapBox);
      const isCurrent = current?.id === node.id;
      const isGoal = goal?.id === node.id;
      const isPending = pending?.id === node.id;
      const isSelected = selected?.id === node.id;
      const circle = el('circle', {
        cx: point.sx, cy: point.sy,
        r: isCurrent ? 5.2 : (isSelected || isGoal || isPending ? 4 : 2.35),
        style: `fill:${isCurrent ? '#be123c' : (isPending ? '#f59e0b' : (isGoal ? '#2563eb' : (node.evidence ? '#0d9488' : '#fb7185')))};stroke:#fff;stroke-width:${isCurrent ? 1.5 : .8};cursor:pointer`
      });
      addTitle(circle, `${node.id} · <${node.x},${node.y}> · ${node.title}`);
      circle.addEventListener('click', () => selectRoot(node.id));
      g.appendChild(circle);
      if (isSelected && !isCurrent) g.appendChild(el('circle', {
        cx: point.sx, cy: point.sy, r: 6.3,
        style: 'fill:none;stroke:#7c3aed;stroke-width:1.2;stroke-dasharray:2 2;pointer-events:none'
      }));
    });

    if (current) {
      const q = projectSurface(current, mapBox);
      g.appendChild(el('text', {
        x: q.sx, y: q.sy - 7, 'text-anchor': 'middle',
        style: 'font-size:7px;font-weight:900;fill:#be123c;pointer-events:none'
      }, 'Q'));
    }

    // Selected root opens downward into a local voxel/fiber. z is not part of the 32-bit root address.
    g.appendChild(el('line', {
      x1: voxelX - 6, x2: voxelX - 6, y1: vy + 20, y2: vy + vh - 8,
      style: 'stroke:#cbd5e1;stroke-width:.8'
    }));
    g.appendChild(el('rect', {
      x: voxelX, y: vy + 24, width: voxelW, height: Math.max(48, vh - 32), rx: 5,
      style: 'fill:#f5f3ff;fill-opacity:.68;stroke:#7c3aed;stroke-width:.8'
    }));

    const selectedPoint = selected ? projectSurface(selected, mapBox) : null;
    if (selectedPoint) {
      g.appendChild(el('line', {
        x1: selectedPoint.sx, y1: selectedPoint.sy,
        x2: voxelX, y2: vy + 40,
        style: 'stroke:#7c3aed;stroke-width:.9;stroke-opacity:.55;stroke-dasharray:3 3;pointer-events:none'
      }));
    }

    const z = selectedDepth(state, selected);
    const zMode = selected && state?.current === selected.id ? 'LIVE' : 'PREVIEW';
    g.appendChild(el('text', { x: voxelX + 8, y: vy + 38, style: 'font-size:8px;font-weight:900;fill:#6d28d9' }, 'VOXEL / FIBER'));
    g.appendChild(el('text', { x: voxelX + 8, y: vy + 51, style: 'font-size:7px;font-weight:800;fill:#334155' }, selected ? selected.id : '—'));
    g.appendChild(el('text', { x: voxelX + 8, y: vy + 63, style: 'font-size:7px;fill:#64748b' }, selected ? `<${selected.x},${selected.y};${z}>` : '<—,—;0>'));
    g.appendChild(el('text', { x: voxelX + voxelW - 8, y: vy + 51, 'text-anchor': 'end', style: `font-size:7px;font-weight:900;fill:${zMode === 'LIVE' ? '#be123c' : '#64748b'}` }, zMode));

    const nestTop = vy + 70;
    const nestHeight = Math.max(20, vh - 84);
    for (let i = 0; i < 5; i++) {
      const inset = i * 4;
      g.appendChild(el('rect', {
        x: voxelX + 9 + inset,
        y: nestTop + inset * .72,
        width: Math.max(18, voxelW - 18 - inset * 2),
        height: Math.max(10, nestHeight - inset * 1.35),
        rx: 3,
        style: `fill:none;stroke:#7c3aed;stroke-width:${i === 0 ? 1 : .7};stroke-opacity:${.72 - i * .1}`
      }));
    }

    const barX = voxelX + voxelW - 14;
    const barTop = nestTop + 3;
    const barBottom = nestTop + Math.max(10, nestHeight - 3);
    g.appendChild(el('line', { x1: barX, x2: barX, y1: barTop, y2: barBottom, style: 'stroke:#64748b;stroke-width:.8' }));
    const markerY = barTop + (z / MAX_DEPTH) * Math.max(1, barBottom - barTop);
    g.appendChild(el('circle', { cx: barX, cy: markerY, r: 2.8, style: 'fill:#be123c;stroke:#fff;stroke-width:.7' }));
    g.appendChild(el('text', { x: barX - 4, y: barBottom + 8, 'text-anchor': 'end', style: 'font-size:6px;fill:#64748b' }, `z ${z}/${MAX_DEPTH}`));

    g.appendChild(el('text', {
      x: vx + 12, y: vy + vh - 5,
      style: 'font-size:6.5px;font-weight:700;fill:#64748b'
    }, `${route.length || 0} route roots · selected ${selected?.id || '—'} · ${state?.evidenceOnly ? 'EVIDENCE' : 'FULL'} · z local / not IPv4 bits`));

    p.appendChild(g);
    return true;
  }

  function signatureFor(state) {
    const machine = panel()?.querySelector('.ev-machine');
    return JSON.stringify({
      current: state?.current || null,
      goal: state?.goal || null,
      pending: state?.pending || null,
      depth: Number(state?.depth) || 0,
      authority: !!state?.authority,
      evidenceOnly: !!state?.evidenceOnly,
      selected: spatial.selected,
      followQueen: spatial.followQueen,
      ready: spatial.ready,
      machineHeight: machine?.getAttribute('height') || null
    });
  }

  function sync(force = false) {
    if (!spatial.ready || !spatial.manifest) return false;
    const state = stageState();
    if (!state) return false;
    if (spatial.followQueen && state.current) spatial.selected = state.current;
    if (!spatial.selected) spatial.selected = state.current || spatial.manifest.nodes[0]?.id || null;
    const signature = signatureFor(state);
    if (!force && signature === spatial.signature) return true;
    spatial.signature = signature;
    return renderSpatialViewport(state);
  }

  async function bootAssets() {
    const token = ++spatial.bootToken;
    try {
      const [wasmResponse, manifestResponse] = await Promise.all([
        fetch(WASM_URL, { cache: 'no-store' }),
        fetch(MANIFEST_URL, { cache: 'no-store' })
      ]);
      if (!wasmResponse.ok) throw new Error(`Wasm asset HTTP ${wasmResponse.status}`);
      if (!manifestResponse.ok) throw new Error(`manifest HTTP ${manifestResponse.status}`);
      const [b64, manifest] = await Promise.all([wasmResponse.text(), manifestResponse.json()]);
      const result = await WebAssembly.instantiate(bytesFromB64(b64), {});
      if (token !== spatial.bootToken) return;
      const wasm = result.instance.exports;
      const required = ['i13_corpus_node_count','i13_corpus_edge_count','i13_corpus_walk_next','i13_corpus_source_fingerprint'];
      for (const name of required) if (typeof wasm[name] !== 'function') throw new Error(`missing export ${name}`);
      if (Number(wasm.i13_corpus_node_count()) !== manifest.counts.nodes) throw new Error('Wasm/manifest node count mismatch');
      if (Number(wasm.i13_corpus_edge_count()) !== manifest.counts.edges) throw new Error('Wasm/manifest edge count mismatch');
      if (u32(wasm.i13_corpus_source_fingerprint()) !== u32(manifest.fingerprints.corpus)) throw new Error('Wasm/manifest fingerprint mismatch');
      spatial.manifest = manifest;
      spatial.wasm = wasm;
      spatial.byId = new Map(manifest.nodes.map(node => [node.id, node]));
      spatial.byAddress = new Map(manifest.nodes.map(node => [u32(node.address), node]));
      spatial.ready = true;
      spatial.note = `spatial PASS · ${manifest.counts.nodes} roots · x16/y16`;
      const state = stageState();
      spatial.selected = state?.current || manifest.nodes[0]?.id || null;
      spatial.followQueen = true;
      spatial.signature = '';
      sync(true);
    } catch (error) {
      spatial.ready = false;
      spatial.note = `SPATIAL VETO · ${error.message}`;
    }
  }

  function spatialSelfTest(manifest = spatial.manifest) {
    const box = { left: 10, top: 20, width: 100, height: 200 };
    const northWest = projectSurface({ x: SURFACE_MAX, y: 0 }, box);
    const southEast = projectSurface({ x: 0, y: SURFACE_MAX }, box);
    const nodes = manifest?.nodes || [];
    const ids = new Set(nodes.map(node => node.id));
    const addresses = new Set(nodes.map(node => u32(node.address)));
    const checks = [
      { name: '32-bit surface splits x16/y16', pass: SURFACE_MAX === 65535 },
      { name: '+x projects upward', pass: northWest.sx === 10 && northWest.sy === 20 },
      { name: '+y projects rightward', pass: southEast.sx === 110 && southEast.sy === 220 },
      { name: 'address pack is x16|y16', pass: !nodes.length || nodes.every(node => packXY(node.x, node.y) === u32(node.address)) },
      { name: 'all spatial roots remain 16-bit bounded', pass: !nodes.length || nodes.every(node => node.x >= 0 && node.x <= SURFACE_MAX && node.y >= 0 && node.y <= SURFACE_MAX) },
      { name: 'all spatial root ids are unique', pass: !nodes.length || ids.size === nodes.length },
      { name: 'all spatial addresses are unique', pass: !nodes.length || addresses.size === nodes.length },
      { name: 'Stage 14.4 corpus has 54 roots when manifest supplied', pass: !manifest || manifest.counts.nodes === 54 },
      { name: 'voxel z stays outside 32-bit root address', pass: packXY(0xabcd, 0x1234) === 0xabcd1234 >>> 0 && MAX_DEPTH === 81 }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, selected: spatial.selected, note: spatial.note });
  }

  function boot() {
    if (!window.I13CorpusNavigatorStage) {
      setTimeout(boot, 80);
      return;
    }
    bootAssets();
    if (spatial.timer) clearInterval(spatial.timer);
    spatial.timer = setInterval(() => sync(false), 120);
  }

  window.I13CorpusSpatialStage = Object.freeze({
    version: '14.4.0',
    boot,
    sync: () => sync(true),
    selectRoot,
    focusQueen,
    projectSurface: (node, box) => Object.freeze(projectSurface(node, box)),
    spatialSelfTest,
    state: () => Object.freeze({
      ready: spatial.ready,
      selected: spatial.selected,
      followQueen: spatial.followQueen,
      note: spatial.note,
      roots: spatial.manifest?.counts?.nodes || 0
    })
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
