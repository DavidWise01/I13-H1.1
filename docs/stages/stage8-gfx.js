/* I13 H1.1 — Stage 8: GFX trunk v0.3 -> v0.4.1 exploded view.
 *
 * Historical/reference facts come from the preserved v0.4/v0.4.1 reports.
 * The interactive command tape and small SVG viewport are a Pages reference
 * trace over that architecture; they do not claim to rerun the historical GPU
 * renderer or the native 8/8 suite in-browser.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MODULE_ID = 'gfx';
  const RECORD_BYTES = 32;
  const BACKENDS = Object.freeze(['WebGPU', 'WebGL2']);
  const BUILTINS = Object.freeze([
    'gfx_time', 'gfx_clear', 'gfx_camera', 'gfx_cube',
    'gfx_sphere', 'gfx_color', 'gfx_rotate'
  ]);

  const REFERENCE = Object.freeze({
    wasmBytes: 10188,
    nativeTests: '8/8 PASS',
    regression: '4/4 PASS',
    nativeCalls: 8,
    commandCount: 7,
    zeroImports: true,
    time: 2.5,
    gpuProbe: 'UNVERIFIED'
  });

  /* Cube, sphere and rotate records preserve values from the v0.4 report.
   * Clear, camera and color values below are Pages demo values chosen only to
   * make the miniature viewport visible.
   */
  const COMMANDS = Object.freeze([
    Object.freeze({ op: 1, kind: 'clear', id: 0, a: 0.04, b: 0.06, c: 0.10, d: 0, e: 0, f: 0, source: 'demo' }),
    Object.freeze({ op: 2, kind: 'camera', id: 0, a: 0, b: 2.5, c: 6, d: 0, e: 0, f: 0, source: 'demo' }),
    Object.freeze({ op: 3, kind: 'cube', id: 1, a: -1, b: 0, c: 0, d: 1.5, e: 0, f: 0, source: 'report' }),
    Object.freeze({ op: 4, kind: 'sphere', id: 2, a: 1, b: 0, c: 0, d: 0.800000011920929, e: 0, f: 0, source: 'report' }),
    Object.freeze({ op: 5, kind: 'color', id: 1, a: 0.20, b: 0.55, c: 0.95, d: 0, e: 0, f: 0, source: 'demo' }),
    Object.freeze({ op: 5, kind: 'color', id: 2, a: 0.95, b: 0.32, c: 0.48, d: 0, e: 0, f: 0, source: 'demo' }),
    Object.freeze({ op: 6, kind: 'rotate', id: 1, a: 0, b: 2.5, c: 0, d: 0, e: 0, f: 0, source: 'report' })
  ]);

  const runtime = {
    cursor: 0,
    frame: 0,
    selected: 1,
    last: 'waiting',
    receipt: 'ready',
    camera: 'pending',
    clear: null,
    entities: new Map()
  };

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

  function sEl(name, attrs = {}, text = '') {
    const doc = svgDoc();
    if (!doc) return null;
    const node = doc.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text !== '') node.textContent = String(text);
    return node;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function rgb(a, b, c) {
    return `rgb(${Math.round(clamp01(a) * 255)},${Math.round(clamp01(b) * 255)},${Math.round(clamp01(c) * 255)})`;
  }

  function recordText(command) {
    if (!command) return 'waiting';
    const tag = command.source === 'report' ? 'report' : 'demo';
    return `${command.kind} · op ${command.op} · id ${command.id} · ${tag}`;
  }

  function entitySummary() {
    if (!runtime.entities.size) return 'empty';
    return [...runtime.entities.values()].map(entity => `${entity.kind}${entity.id}`).join(' + ');
  }

  function resetStateObject(state) {
    state.cursor = 0;
    state.frame = 0;
    state.selected = 1;
    state.last = 'waiting';
    state.receipt = 'ready';
    state.camera = 'pending';
    state.clear = null;
    state.entities.clear();
  }

  function applyCommandTo(state, command) {
    switch (command.kind) {
      case 'clear':
        state.clear = rgb(command.a, command.b, command.c);
        break;
      case 'camera':
        state.camera = `<${command.a},${command.b},${command.c}> -> <${command.d},${command.e},${command.f}>`;
        break;
      case 'cube':
        state.entities.set(command.id, {
          id: command.id,
          kind: 'cube',
          x: command.a,
          y: command.b,
          z: command.c,
          size: command.d,
          color: 'rgb(96,165,250)',
          rotation: [0, 0, 0]
        });
        break;
      case 'sphere':
        state.entities.set(command.id, {
          id: command.id,
          kind: 'sphere',
          x: command.a,
          y: command.b,
          z: command.c,
          radius: command.d,
          color: 'rgb(244,114,182)',
          rotation: [0, 0, 0]
        });
        break;
      case 'color': {
        const entity = state.entities.get(command.id);
        if (entity) entity.color = rgb(command.a, command.b, command.c);
        break;
      }
      case 'rotate': {
        const entity = state.entities.get(command.id);
        if (entity) entity.rotation = [command.a, command.b, command.c];
        break;
      }
      default:
        throw new Error(`unknown GFX command kind: ${command.kind}`);
    }

    state.cursor += 1;
    state.last = command.kind;
    state.receipt = `applied ${command.kind} · ${state.cursor}/${COMMANDS.length}`;
  }

  function injectStyle() {
    const doc = svgDoc();
    if (!doc?.documentElement || doc.getElementById('stage8-gfx-style')) return;
    const style = doc.createElementNS(SVG_NS, 'style');
    style.id = 'stage8-gfx-style';
    style.textContent = `
.stage8-gfx-viewport .gfx-frame{fill:#f8fafc;stroke:var(--gpu,#c026d3);stroke-width:1}
.stage8-gfx-viewport .gfx-ground{stroke:#94a3b8;stroke-width:1}
.stage8-gfx-viewport .gfx-chip{fill:#e2e8f0;stroke:#94a3b8;stroke-width:.8}
.stage8-gfx-viewport .gfx-chip-done{fill:var(--gpu,#c026d3);stroke:var(--gpu,#c026d3)}
.stage8-gfx-viewport .gfx-selected{fill:none;stroke:var(--live,#16a34a);stroke-width:2;stroke-dasharray:4 3}
.stage8-gfx-viewport .gfx-label{font-size:9px;font-weight:700;fill:var(--muted,#64748b)}
`;
    doc.documentElement.appendChild(style);
  }

  function renderViewport() {
    const p = panel();
    if (!p) return;
    injectStyle();

    const output = p.querySelectorAll('.ev-section-group')?.[3];
    const box = output?.querySelector('rect.ev-section');
    if (!output || !box) return;

    output.querySelector('.stage8-gfx-viewport')?.remove();

    const x = Number(box.getAttribute('x')) || 0;
    const y = Number(box.getAttribute('y')) || 0;
    const width = Number(box.getAttribute('width')) || 0;
    const height = Number(box.getAttribute('height')) || 0;
    const vx = x + 12;
    const vy = y + 96;
    const vw = Math.max(40, width - 24);
    const vh = Math.max(48, height - 108);

    const defs = p.querySelector(':scope > defs');
    const clipId = 'stage8-gfx-output-clip';
    defs?.querySelector(`#${clipId}`)?.remove();
    if (defs) {
      const clip = sEl('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' });
      clip.appendChild(sEl('rect', { x: vx, y: vy, width: vw, height: vh }));
      defs.appendChild(clip);
    }

    const g = sEl('g', { class: 'stage8-gfx-viewport', 'clip-path': `url(#${clipId})` });
    g.appendChild(sEl('rect', { x: vx, y: vy, width: vw, height: vh, rx: 5, class: 'gfx-frame' }));

    if (runtime.clear) {
      g.querySelector('.gfx-frame')?.setAttribute('fill', runtime.clear);
      g.querySelector('.gfx-frame')?.setAttribute('fill-opacity', '0.18');
    }

    g.appendChild(sEl('text', { x: vx + 8, y: vy + 13, class: 'gfx-label' }, 'REFERENCE FRAME'));
    const groundY = vy + Math.max(30, vh * 0.62);
    g.appendChild(sEl('line', { x1: vx + 10, y1: groundY, x2: vx + vw - 10, y2: groundY, class: 'gfx-ground' }));

    const mapX = worldX => vx + vw / 2 + Number(worldX) * Math.min(42, vw / 5);
    const cube = runtime.entities.get(1);
    const sphere = runtime.entities.get(2);

    if (cube) {
      const cx = mapX(cube.x);
      const cy = groundY - 25;
      g.appendChild(sEl('rect', {
        x: cx - 18, y: cy - 18, width: 36, height: 36, rx: 2,
        fill: cube.color, 'fill-opacity': 0.75, stroke: 'var(--wasm,#2563eb)', 'stroke-width': 1.4
      }));
      g.appendChild(sEl('text', { x: cx, y: cy + 3, 'text-anchor': 'middle', class: 'gfx-label' }, 'C1'));
      if (runtime.selected === 1) g.appendChild(sEl('rect', { x: cx - 23, y: cy - 23, width: 46, height: 46, rx: 4, class: 'gfx-selected' }));
    }

    if (sphere) {
      const cx = mapX(sphere.x);
      const cy = groundY - 22;
      g.appendChild(sEl('circle', {
        cx, cy, r: 19, fill: sphere.color, 'fill-opacity': 0.75,
        stroke: 'var(--cortex,#be123c)', 'stroke-width': 1.4
      }));
      g.appendChild(sEl('text', { x: cx, y: cy + 3, 'text-anchor': 'middle', class: 'gfx-label' }, 'S2'));
      if (runtime.selected === 2) g.appendChild(sEl('circle', { cx, cy, r: 24, class: 'gfx-selected' }));
    }

    const chipY = vy + vh - 13;
    const chipGap = Math.max(3, Math.min(6, vw / 50));
    const chipWidth = Math.max(12, Math.min(22, (vw - 24 - chipGap * 6) / 7));
    const total = chipWidth * 7 + chipGap * 6;
    let chipX = vx + (vw - total) / 2;
    COMMANDS.forEach((command, index) => {
      g.appendChild(sEl('rect', {
        x: chipX, y: chipY, width: chipWidth, height: 6, rx: 2,
        class: index < runtime.cursor ? 'gfx-chip-done' : 'gfx-chip'
      }));
      chipX += chipWidth + chipGap;
    });

    output.appendChild(g);
  }

  function sync() {
    const current = runtime.cursor > 0 ? COMMANDS[runtime.cursor - 1] : null;
    setSection(2, 0, `command · ${runtime.cursor}/${COMMANDS.length} · ${runtime.last}`);
    setSection(2, 1, `record · ${recordText(current)}`);
    setSection(2, 2, `entities · ${runtime.entities.size} · selected ${runtime.selected}`);
    setSection(2, 3, `backend · ${BACKENDS[0]} -> ${BACKENDS[1]} fallback`);

    setSection(3, 0, `frame · ${runtime.frame} · ${runtime.cursor === COMMANDS.length ? 'READY' : 'PARTIAL'}`);
    setSection(3, 1, `viewport · ${entitySummary()}`);
    setSection(3, 2, `receipt · ${runtime.receipt}`);

    setMachine(0, `REFERENCE  GFX v0.4 · ${REFERENCE.nativeTests} · WASM ${REFERENCE.wasmBytes} bytes`);
    setMachine(1, `CALLS      ${REFERENCE.nativeCalls} native calls · ${REFERENCE.commandCount} command records`);
    setMachine(2, `RECORD     ${RECORD_BYTES} bytes · i32 opcode + i32 entity + 6 x f32`);
    setMachine(3, `BACKEND    ${BACKENDS[0]} primary · ${BACKENDS[1]} fallback`);
    setMachine(4, `SCENE      ${entitySummary()} · camera ${runtime.camera}`);
    setMachine(5, `INPUT      v0.4.1 mouse/select/orbit/pan/zoom/focus reference preserved`);
    setMachine(6, `STATUS     ${runtime.receipt} · GPU probe ${REFERENCE.gpuProbe}`);

    renderViewport();
  }

  function resetRuntime() {
    resetStateObject(runtime);
    sync();
  }

  function stepCommand() {
    if (runtime.cursor >= COMMANDS.length) {
      runtime.receipt = 'command tape complete · RESET or FRAME to replay';
      sync();
      return false;
    }
    applyCommandTo(runtime, COMMANDS[runtime.cursor]);
    sync();
    return runtime.cursor < COMMANDS.length;
  }

  function renderFrame() {
    const nextFrame = runtime.frame + 1;
    runtime.cursor = 0;
    runtime.last = 'rebuild';
    runtime.receipt = 'rebuilding reference frame';
    runtime.camera = 'pending';
    runtime.clear = null;
    runtime.entities.clear();
    COMMANDS.forEach(command => applyCommandTo(runtime, command));
    runtime.frame = nextFrame;
    runtime.receipt = `frame ${runtime.frame} · ${COMMANDS.length} records consumed`;
    sync();
  }

  function selectNext() {
    runtime.selected = runtime.selected === 1 ? 2 : 1;
    runtime.receipt = `selected entity ${runtime.selected}`;
    sync();
  }

  function showReport() {
    runtime.receipt = `report · ${REFERENCE.nativeTests} native · ${REFERENCE.regression} v0.3 · GPU ${REFERENCE.gpuProbe}`;
    sync();
  }

  function mount() {
    if (!window.I13Exploded?.isReady?.()) return false;
    if (window.I13Exploded.getState(MODULE_ID)) return true;

    window.I13Exploded.mount(MODULE_ID, {
      title: 'GFX TRUNK v0.3 -> v0.4.1 · EXPLODED',
      subtitle: 'IVM Call -> native gfx_* -> 32-byte record -> GPU renderer -> viewport',
      family: 'gpu',
      expanded: false,
      machineExpanded: false,
      input: [
        'I-13 scene source / entity state',
        'ordinary IVM Call opcode',
        `reference time sample · t = ${REFERENCE.time}`,
        'v0.4.1 mouse/controller state is a separate host layer'
      ],
      pipeline: [
        'Call gfx_time() · scalar sample',
        'Call gfx_clear() · command plane',
        'Call gfx_camera() · command plane',
        'Call gfx_cube() / gfx_sphere()',
        'Call gfx_color() · entity material',
        'Call gfx_rotate() · transform',
        'Wasm linear memory -> browser renderer -> viewport'
      ],
      state: [
        `command · 0/${COMMANDS.length} · waiting`,
        'record · waiting',
        'entities · 0 · selected 1',
        `${BACKENDS[0]} primary -> ${BACKENDS[1]} fallback`
      ],
      output: [
        'frame · 0 · PARTIAL',
        'viewport · empty',
        'receipt · ready'
      ],
      machine: [
        `REFERENCE  GFX v0.4 · ${REFERENCE.nativeTests} · WASM ${REFERENCE.wasmBytes} bytes`,
        `CALLS      ${REFERENCE.nativeCalls} native calls · ${REFERENCE.commandCount} command records`,
        `RECORD     ${RECORD_BYTES} bytes · i32 opcode + i32 entity + 6 x f32`,
        `BACKEND    ${BACKENDS[0]} primary · ${BACKENDS[1]} fallback`,
        'SCENE      empty · camera pending',
        'INPUT      v0.4.1 mouse/select/orbit/pan/zoom/focus reference preserved',
        `STATUS     ready · GPU probe ${REFERENCE.gpuProbe}`
      ],
      controls: [
        { id: 'gfx-reset', label: 'RESET', onClick: resetRuntime },
        { id: 'gfx-step', label: 'STEP CMD', onClick: stepCommand },
        { id: 'gfx-frame', label: 'FRAME', onClick: renderFrame },
        { id: 'gfx-select', label: 'SELECT', onClick: selectNext },
        { id: 'gfx-report', label: 'REPORT', onClick: showReport }
      ]
    });

    sync();
    return true;
  }

  function simulateFrameForTest() {
    const state = {
      cursor: 0,
      frame: 0,
      selected: 1,
      last: 'waiting',
      receipt: 'ready',
      camera: 'pending',
      clear: null,
      entities: new Map()
    };
    COMMANDS.forEach(command => applyCommandTo(state, command));
    return state;
  }

  function selfTest() {
    const frame = simulateFrameForTest();
    const cube = COMMANDS.find(command => command.kind === 'cube');
    const sphere = COMMANDS.find(command => command.kind === 'sphere');
    const rotate = COMMANDS.find(command => command.kind === 'rotate');
    const checks = [
      { name: 'canonical native builtin set', pass: JSON.stringify(BUILTINS) === JSON.stringify(['gfx_time','gfx_clear','gfx_camera','gfx_cube','gfx_sphere','gfx_color','gfx_rotate']) },
      { name: 'reference command count is 7', pass: COMMANDS.length === 7 && REFERENCE.commandCount === 7 },
      { name: 'record width is 32 bytes', pass: RECORD_BYTES === 32 },
      { name: 'cube report record preserved', pass: cube?.op === 3 && cube.id === 1 && cube.a === -1 && cube.b === 0 && cube.c === 0 && cube.d === 1.5 },
      { name: 'sphere report record preserved', pass: sphere?.op === 4 && sphere.id === 2 && sphere.a === 1 && sphere.d === 0.800000011920929 },
      { name: 'rotation report record preserved', pass: rotate?.op === 6 && rotate.id === 1 && rotate.a === 0 && rotate.b === 2.5 && rotate.c === 0 },
      { name: 'reference frame creates two entities', pass: frame.cursor === 7 && frame.entities.size === 2 },
      { name: 'rotation reaches cube state', pass: frame.entities.get(1)?.rotation?.[1] === 2.5 },
      { name: 'backend order preserved', pass: BACKENDS[0] === 'WebGPU' && BACKENDS[1] === 'WebGL2' },
      { name: 'reference facts preserved', pass: REFERENCE.wasmBytes === 10188 && REFERENCE.nativeTests === '8/8 PASS' && REFERENCE.regression === '4/4 PASS' && REFERENCE.zeroImports === true }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, frame: { cursor: frame.cursor, entities: frame.entities.size } });
  }

  function boot() {
    if (!mount()) window.addEventListener('i13-exploded-ready', mount, { once: true });
  }

  window.I13GfxStage = Object.freeze({
    version: '0.1.0',
    mount,
    reset: resetRuntime,
    step: stepCommand,
    frame: renderFrame,
    select: selectNext,
    report: showReport,
    selfTest
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();