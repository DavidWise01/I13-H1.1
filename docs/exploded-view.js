/* I13 H1.1 reusable exploded-view component — Stage 5 / v0.2. */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CFG = Object.freeze({
    objectId: 'i13',
    moduleLayerId: 'module-layer',
    labId: 'lab',
    panelX: 140,
    panelWidth: 1070,
    minHeight: 228,
    panelGap: 14,
    maxRows: 7,
    pad: 18,
    gap: 14,
    headerHeight: 42,
    contentTop: 60,
    lineHeight: 16,
    rowGap: 5,
    charPx: 7.1,
    machineCollapsedHeight: 48
  });

  const S = {
    object: null,
    doc: null,
    svg: null,
    layer: null,
    lab: null,
    ready: false,
    mounted: new Map(),
    baseSvgHeight: 2940,
    baseViewBox: [0, 0, 1280, 2940],
    baseLabTransform: 'translate(0,2350)'
  };

  const STYLE = `
.i13-exploded-toggle,.ev-machine-toggle{cursor:pointer}
.i13-exploded-toggle .ev-bg,.ev-machine-toggle .ev-machine-toggle-bg{fill:#fff;stroke:var(--line,#94a3b8);stroke-width:1.2}
.i13-exploded-toggle:hover .ev-bg,.ev-machine-toggle:hover .ev-machine-toggle-bg{fill:#f8fafc;stroke:var(--line-strong,#475569)}
.i13-exploded-toggle .ev-label,.ev-machine-toggle .ev-machine-toggle-label{font-size:11px;font-weight:800;letter-spacing:.06em;fill:var(--muted,#64748b)}
.i13-exploded-panel .ev-shell{fill:#fff;stroke:var(--line-strong,#475569);stroke-width:1.25}
.i13-exploded-panel .ev-header{fill:#f8fafc;stroke:var(--line,#94a3b8);stroke-width:1}
.i13-exploded-panel .ev-title{font-size:13px;font-weight:800;letter-spacing:.08em;fill:var(--ink,#18212b)}
.i13-exploded-panel .ev-subtitle{font-size:11px;fill:var(--muted,#64748b)}
.i13-exploded-panel .ev-section{fill:#fff;stroke:var(--line,#94a3b8);stroke-width:1}
.i13-exploded-panel .ev-section-title{font-size:11px;font-weight:800;letter-spacing:.07em;fill:var(--muted,#64748b)}
.i13-exploded-panel .ev-row{font-size:12px;fill:var(--ink,#18212b)}
.i13-exploded-panel .ev-row-muted{font-size:11px;fill:var(--muted,#64748b)}
.i13-exploded-panel .ev-flow{stroke:var(--line-strong,#475569);stroke-width:1.35;fill:none;marker-end:url(#arrow)}
.i13-exploded-panel .ev-machine{fill:#f8fafc;stroke:var(--line,#94a3b8);stroke-width:1}
.i13-exploded-panel .ev-control{fill:#fff;stroke:var(--line,#94a3b8);stroke-width:1;cursor:pointer}
.i13-exploded-panel .ev-control:hover{fill:#eef6ff;stroke:var(--wasm,#2563eb)}
.i13-exploded-panel .ev-control-text{font-size:11px;font-weight:700;fill:var(--ink,#18212b);pointer-events:none}
.i13-exploded-panel[data-family="i13"] .ev-shell{stroke:var(--i13,#0e7490)}
.i13-exploded-panel[data-family="python"] .ev-shell{stroke:var(--python,#ca8a04)}
.i13-exploded-panel[data-family="wasm"] .ev-shell{stroke:var(--wasm,#2563eb)}
.i13-exploded-panel[data-family="gpu"] .ev-shell{stroke:var(--gpu,#c026d3)}
.i13-exploded-panel[data-family="cortex"] .ev-shell{stroke:var(--cortex,#be123c)}
.i13-exploded-panel[data-family="live"] .ev-shell{stroke:var(--live,#16a34a)}
`;

  function el(name, attrs = {}, text = '') {
    const n = S.doc.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v !== undefined && v !== null) n.setAttribute(k, String(v));
    });
    if (text !== '') n.textContent = String(text);
    return n;
  }

  function rows(value) {
    const list = value == null ? [] : (Array.isArray(value) ? value : [value]);
    return list.map(v => {
      if (typeof v === 'object' && v !== null) return { text: String(v.text ?? ''), muted: !!v.muted };
      return { text: String(v), muted: false };
    }).filter(v => v.text);
  }

  function wrapLines(value, maxChars) {
    const text = String(value ?? '').trim();
    if (!text) return [''];
    const limit = Math.max(8, Math.floor(maxChars));
    const words = text.split(/\s+/);
    const out = [];
    let line = '';

    const flush = () => {
      if (line) out.push(line);
      line = '';
    };

    for (let word of words) {
      if (!word) continue;
      if (word.length > limit) {
        flush();
        while (word.length > limit) {
          out.push(word.slice(0, limit));
          word = word.slice(limit);
        }
        line = word;
        continue;
      }
      if (!line) line = word;
      else if (line.length + 1 + word.length <= limit) line += ` ${word}`;
      else {
        out.push(line);
        line = word;
      }
    }
    flush();
    return out.length ? out : [''];
  }

  function maxCharsFor(width, fontPx = 12) {
    const factor = fontPx <= 11 ? 6.6 : CFG.charPx;
    return Math.max(8, Math.floor(width / factor));
  }

  function bodyHeight(data, width) {
    const shown = data.slice(0, CFG.maxRows);
    if (!shown.length) return CFG.lineHeight;
    const maxChars = maxCharsFor(width - 24);
    let height = 0;
    shown.forEach((row, index) => {
      height += wrapLines(row.text, maxChars).length * CFG.lineHeight;
      if (index < shown.length - 1) height += CFG.rowGap;
    });
    if (data.length > shown.length) height += CFG.lineHeight + CFG.rowGap;
    return height;
  }

  function wrappedText(attrs, value, maxChars, lineHeight = CFG.lineHeight) {
    const node = el('text', attrs);
    const lines = wrapLines(value, maxChars);
    lines.forEach((line, index) => {
      node.appendChild(el('tspan', {
        x: attrs.x,
        dy: index === 0 ? 0 : lineHeight
      }, line));
    });
    return node;
  }

  function safeId(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  function addClip(defs, id, x, y, width, height) {
    const clip = el('clipPath', { id, clipPathUnits: 'userSpaceOnUse' });
    clip.appendChild(el('rect', { x, y, width: Math.max(1, width), height: Math.max(1, height) }));
    defs.appendChild(clip);
  }

  function normalize(moduleId, spec = {}) {
    if (!moduleId || typeof moduleId !== 'string') throw new TypeError('moduleId must be a non-empty string');
    const out = {
      title: String(spec.title ?? `${moduleId.toUpperCase()} · EXPLODED`),
      subtitle: String(spec.subtitle ?? 'input → pipeline → state → output'),
      family: String(spec.family ?? 'i13').toLowerCase(),
      expanded: spec.expanded === true,
      machineExpanded: spec.machineExpanded === true,
      input: rows(spec.input),
      pipeline: rows(spec.pipeline),
      state: rows(spec.state),
      output: rows(spec.output),
      machine: rows(spec.machine),
      controls: Array.isArray(spec.controls) ? spec.controls.map(c => ({
        id: String(c.id ?? ''),
        label: String(c.label ?? c.id ?? ''),
        onClick: typeof c.onClick === 'function' ? c.onClick : null
      })).filter(c => c.id && c.label) : []
    };

    const inner = CFG.panelWidth - CFG.pad * 2;
    const cw = (inner - CFG.gap * 3) / 4;
    const topBody = Math.max(
      bodyHeight(out.input, cw),
      bodyHeight(out.pipeline, cw),
      bodyHeight(out.state, cw),
      bodyHeight(out.output, cw)
    );
    out.topHeight = Math.max(128, 56 + topBody);
    out.hasMachine = out.machine.length > 0 || out.controls.length > 0;
    const machineBody = bodyHeight(out.machine, inner);
    out.machineExpandedHeight = Math.max(126, 68 + machineBody);
    return out;
  }

  function panelHeight(record) {
    const machineH = record.spec.hasMachine
      ? (record.machineExpanded ? record.spec.machineExpandedHeight : CFG.machineCollapsedHeight)
      : 0;
    return Math.max(
      CFG.minHeight,
      CFG.contentTop + record.spec.topHeight + 12 + machineH + 18
    );
  }

  function ensureReady() {
    if (!S.ready) throw new Error('I13Exploded not ready; wait for i13-exploded-ready');
  }

  function injectStyle() {
    let style = S.doc.getElementById('i13-exploded-style');
    if (!style) {
      style = S.doc.createElementNS(SVG_NS, 'style');
      style.id = 'i13-exploded-style';
      S.svg.appendChild(style);
    }
    style.textContent = STYLE;
  }

  function section(record, defs, title, data, index, x, y, width, height) {
    const g = el('g', { class: 'ev-section-group' });
    g.appendChild(el('rect', { x, y, width, height, rx: 6, class: 'ev-section' }));
    g.appendChild(el('text', { x: x + 12, y: y + 20, class: 'ev-section-title' }, title));

    const clipId = `ev-${safeId(record.moduleId)}-section-${index}`;
    addClip(defs, clipId, x + 8, y + 30, width - 16, height - 38);
    const content = el('g', { 'clip-path': `url(#${clipId})` });
    const shown = data.slice(0, CFG.maxRows);
    const maxChars = maxCharsFor(width - 24);
    let cursorY = y + 44;

    if (!shown.length) {
      content.appendChild(el('text', { x: x + 12, y: cursorY, class: 'ev-row-muted' }, '—'));
    } else {
      shown.forEach((row, rowIndex) => {
        const lines = wrapLines(row.text, maxChars);
        content.appendChild(wrappedText({
          x: x + 12,
          y: cursorY,
          class: row.muted ? 'ev-row-muted' : 'ev-row',
          'data-wrap-max': maxChars
        }, row.text, maxChars));
        cursorY += lines.length * CFG.lineHeight;
        if (rowIndex < shown.length - 1) cursorY += CFG.rowGap;
      });
    }

    if (data.length > shown.length) {
      content.appendChild(el('text', {
        x: x + 12,
        y: Math.min(y + height - 10, cursorY + CFG.lineHeight),
        class: 'ev-row-muted'
      }, `+${data.length - shown.length} more`));
    }

    g.appendChild(content);
    return g;
  }

  function renderMachine(record, defs, panel, x, y, width) {
    const spec = record.spec;
    if (!spec.hasMachine) return;

    const height = record.machineExpanded ? spec.machineExpandedHeight : CFG.machineCollapsedHeight;
    const rect = el('rect', { x, y, width, height, rx: 6, class: 'ev-machine' });
    panel.appendChild(rect);
    panel.appendChild(el('text', { x: x + 12, y: y + 21, class: 'ev-section-title' }, 'MACHINE / RUNTIME'));

    const toggleWidth = 102;
    const tx = x + width - toggleWidth - 10;
    const toggle = el('g', {
      class: 'ev-machine-toggle',
      role: 'button',
      tabindex: '0',
      'aria-expanded': String(record.machineExpanded)
    });
    toggle.appendChild(el('rect', { x: tx, y: y + 9, width: toggleWidth, height: 28, rx: 14, class: 'ev-machine-toggle-bg' }));
    toggle.appendChild(el('text', {
      x: tx + toggleWidth / 2,
      y: y + 28,
      'text-anchor': 'middle',
      class: 'ev-machine-toggle-label'
    }, record.machineExpanded ? 'MACHINE −' : 'MACHINE +'));
    const fire = () => toggleMachine(record.moduleId);
    toggle.addEventListener('click', fire);
    toggle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fire();
      }
    });
    panel.appendChild(toggle);

    const clipId = `ev-${safeId(record.moduleId)}-machine`;
    addClip(defs, clipId, x + 8, y + 42, width - 16, Math.max(1, spec.machineExpandedHeight - 50));
    const machineMaxChars = maxCharsFor(width - 24);
    let cursorY = y + 55;
    const contentNodes = [];

    spec.machine.slice(0, CFG.maxRows).forEach((row, rowIndex) => {
      const lines = wrapLines(row.text, machineMaxChars);
      const node = wrappedText({
        x: x + 12,
        y: cursorY,
        class: row.muted ? 'ev-row-muted' : 'ev-row',
        'clip-path': `url(#${clipId})`,
        'data-machine-content': 'true',
        'data-wrap-max': machineMaxChars
      }, row.text, machineMaxChars);
      panel.appendChild(node);
      contentNodes.push(node);
      cursorY += lines.length * CFG.lineHeight;
      if (rowIndex < Math.min(spec.machine.length, CFG.maxRows) - 1) cursorY += CFG.rowGap;
    });

    let cx = tx - 8;
    [...spec.controls].reverse().forEach(control => {
      const bw = Math.max(84, Math.min(150, 28 + control.label.length * 7));
      cx -= bw;
      const g = el('g', { 'data-control': control.id, 'data-machine-content': 'true' });
      g.appendChild(el('rect', { x: cx, y: y + 8, width: bw, height: 30, rx: 5, class: 'ev-control' }));
      g.appendChild(el('text', { x: cx + bw / 2, y: y + 28, 'text-anchor': 'middle', class: 'ev-control-text' }, control.label));
      if (control.onClick) g.addEventListener('click', event => control.onClick({ event, moduleId: record.moduleId }));
      panel.appendChild(g);
      contentNodes.push(g);
      cx -= 8;
    });

    record.machineRect = rect;
    record.machineToggle = toggle;
    record.machineContent = contentNodes;
    updateMachineVisual(record);
  }

  function renderPanel(record) {
    const { spec, baseY } = record;
    const x = CFG.panelX;
    const y = baseY + 102;
    const w = CFG.panelWidth;
    const h = panelHeight(record);
    const panel = el('g', { class: 'i13-exploded-panel', 'data-exploded-for': record.moduleId, 'data-family': spec.family });
    const defs = el('defs');
    panel.appendChild(defs);

    const shell = el('rect', { x, y, width: w, height: h, rx: 8, class: 'ev-shell' });
    panel.appendChild(shell);
    panel.appendChild(el('rect', { x: x + 1, y: y + 1, width: w - 2, height: CFG.headerHeight, rx: 7, class: 'ev-header' }));

    const titleClip = `ev-${safeId(record.moduleId)}-title`;
    const subtitleClip = `ev-${safeId(record.moduleId)}-subtitle`;
    addClip(defs, titleClip, x + 16, y + 5, 520, 32);
    addClip(defs, subtitleClip, x + 540, y + 5, w - 558, 32);
    panel.appendChild(el('text', { x: x + 18, y: y + 25, class: 'ev-title', 'clip-path': `url(#${titleClip})` }, spec.title));
    panel.appendChild(el('text', { x: x + w - 18, y: y + 25, 'text-anchor': 'end', class: 'ev-subtitle', 'clip-path': `url(#${subtitleClip})` }, spec.subtitle));

    const pad = CFG.pad;
    const gap = CFG.gap;
    const contentY = y + CFG.contentTop;
    const inner = w - pad * 2;
    const cw = (inner - gap * 3) / 4;
    const defsList = [['INPUT', spec.input], ['PIPELINE', spec.pipeline], ['STATE', spec.state], ['OUTPUT', spec.output]];

    defsList.forEach(([title, data], index) => {
      const sx = x + pad + index * (cw + gap);
      panel.appendChild(section(record, defs, title, data, index, sx, contentY, cw, spec.topHeight));
      if (index < 3) {
        panel.appendChild(el('line', {
          x1: sx + cw + 3,
          y1: contentY + spec.topHeight / 2,
          x2: sx + cw + gap - 3,
          y2: contentY + spec.topHeight / 2,
          class: 'ev-flow'
        }));
      }
    });

    const lowerY = contentY + spec.topHeight + 12;
    renderMachine(record, defs, panel, x + pad, lowerY, inner);

    record.panel = panel;
    record.shell = shell;
    record.machineY = lowerY;
    record.group.appendChild(panel);
    panel.style.display = record.expanded ? '' : 'none';
  }

  function renderToggle(record) {
    const x = CFG.panelX + CFG.panelWidth - 96;
    const y = record.baseY + 50;
    const g = el('g', { class: 'i13-exploded-toggle', role: 'button', tabindex: '0', 'aria-expanded': String(record.expanded) });
    g.appendChild(el('rect', { x, y, width: 76, height: 26, rx: 13, class: 'ev-bg' }));
    g.appendChild(el('text', { x: x + 38, y: y + 18, 'text-anchor': 'middle', class: 'ev-label' }, record.expanded ? 'CLOSE' : 'EXPLODE'));
    const fire = () => toggle(record.moduleId);
    g.addEventListener('click', fire);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
    record.toggle = g;
    record.group.appendChild(g);
  }

  function setToggle(record) {
    record.toggle?.setAttribute('aria-expanded', String(record.expanded));
    const label = record.toggle?.querySelector('.ev-label');
    if (label) label.textContent = record.expanded ? 'CLOSE' : 'EXPLODE';
  }

  function updateMachineVisual(record) {
    if (!record.spec.hasMachine) return;
    const machineH = record.machineExpanded ? record.spec.machineExpandedHeight : CFG.machineCollapsedHeight;
    record.machineRect?.setAttribute('height', String(machineH));
    record.machineToggle?.setAttribute('aria-expanded', String(record.machineExpanded));
    const label = record.machineToggle?.querySelector('.ev-machine-toggle-label');
    if (label) label.textContent = record.machineExpanded ? 'MACHINE −' : 'MACHINE +';
    (record.machineContent || []).forEach(node => { node.style.display = record.machineExpanded ? '' : 'none'; });
    record.shell?.setAttribute('height', String(panelHeight(record)));
    record.panel?.setAttribute('data-machine-expanded', String(record.machineExpanded));
  }

  function order() {
    return [...S.layer.querySelectorAll(':scope > g[data-module]')].map(g => g.getAttribute('data-module')).filter(Boolean);
  }

  function reflow() {
    let offset = 0;
    order().forEach(id => {
      const group = S.layer.querySelector(`:scope > g[data-module="${CSS.escape(id)}"]`);
      if (group) group.setAttribute('transform', `translate(0 ${offset})`);
      const record = S.mounted.get(id);
      if (record?.expanded) offset += panelHeight(record) + CFG.panelGap;
    });

    if (S.lab) {
      const match = /translate\(\s*([^,\s]+)[,\s]+([^\)]+)\)/.exec(S.baseLabTransform);
      if (match) S.lab.setAttribute('transform', `translate(${Number(match[1]) || 0},${(Number(match[2]) || 0) + offset})`);
    }
    S.svg.setAttribute('height', String(S.baseSvgHeight + offset));
    S.svg.setAttribute('viewBox', `${S.baseViewBox[0]} ${S.baseViewBox[1]} ${S.baseViewBox[2]} ${S.baseViewBox[3] + offset}`);
    S.object.style.height = `${S.baseSvgHeight + offset}px`;
  }

  function mount(moduleId, spec = {}) {
    ensureReady();
    if (S.mounted.has(moduleId)) unmount(moduleId);
    const group = S.layer.querySelector(`:scope > g[data-module="${CSS.escape(moduleId)}"]`);
    if (!group) throw new Error(`Unknown trunk module: ${moduleId}`);
    const rect = group.querySelector('rect.box');
    if (!rect) throw new Error(`Module ${moduleId} has no base rect.box`);
    const normalized = normalize(moduleId, spec);
    const record = {
      moduleId,
      group,
      baseY: Number(rect.getAttribute('y')) || 0,
      spec: normalized,
      expanded: normalized.expanded,
      machineExpanded: normalized.machineExpanded,
      panel: null,
      shell: null,
      toggle: null,
      machineRect: null,
      machineToggle: null,
      machineContent: []
    };
    S.mounted.set(moduleId, record);
    renderPanel(record);
    renderToggle(record);
    reflow();
    return getState(moduleId);
  }

  function unmount(moduleId) {
    ensureReady();
    const record = S.mounted.get(moduleId);
    if (!record) return false;
    record.panel?.remove();
    record.toggle?.remove();
    S.mounted.delete(moduleId);
    reflow();
    return true;
  }

  function setExpanded(moduleId, expanded) {
    ensureReady();
    const record = S.mounted.get(moduleId);
    if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    record.expanded = !!expanded;
    record.panel.style.display = record.expanded ? '' : 'none';
    setToggle(record);
    reflow();
    return getState(moduleId);
  }

  function toggle(moduleId) {
    const record = S.mounted.get(moduleId);
    if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    return setExpanded(moduleId, !record.expanded);
  }

  function setMachineExpanded(moduleId, expanded) {
    ensureReady();
    const record = S.mounted.get(moduleId);
    if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    if (!record.spec.hasMachine) return getState(moduleId);
    record.machineExpanded = !!expanded;
    updateMachineVisual(record);
    reflow();
    window.dispatchEvent(new CustomEvent('i13-machine-toggle', {
      detail: { moduleId, machineExpanded: record.machineExpanded }
    }));
    return getState(moduleId);
  }

  function toggleMachine(moduleId) {
    const record = S.mounted.get(moduleId);
    if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    return setMachineExpanded(moduleId, !record.machineExpanded);
  }

  function getState(moduleId) {
    const record = S.mounted.get(moduleId);
    return record ? Object.freeze({
      moduleId,
      expanded: record.expanded,
      machineExpanded: record.machineExpanded,
      height: panelHeight(record),
      family: record.spec.family,
      title: record.spec.title
    }) : null;
  }

  function selfTest() {
    const checks = [];
    const check = (name, fn) => { try { checks.push({ name, pass: !!fn() }); } catch (e) { checks.push({ name, pass: false, error: e.message }); } };
    check('row normalization', () => rows('x')[0].text === 'x');
    check('object row normalization', () => rows({ text: 'y', muted: true })[0].muted === true);
    check('blank module id rejected', () => { try { normalize('', {}); return false; } catch { return true; } });
    check('long text wraps', () => wrapLines('deterministic canonical form that must remain bounded', 18).length > 1);
    check('machine defaults collapsed', () => normalize('x', { machine: ['row'] }).machineExpanded === false);
    check('minimum panel height', () => {
      const spec = normalize('x', {});
      const fake = { spec, machineExpanded: false };
      return panelHeight(fake) >= CFG.minHeight;
    });
    check('mount registry is a Map', () => S.mounted instanceof Map);
    return Object.freeze({ pass: checks.every(c => c.pass), checks });
  }

  function initialize() {
    const doc = S.object?.contentDocument;
    if (!doc?.documentElement) return;
    S.doc = doc;
    S.svg = doc.documentElement;
    S.layer = doc.getElementById(CFG.moduleLayerId);
    S.lab = doc.getElementById(CFG.labId);
    if (!S.layer) return;
    S.baseSvgHeight = Number(S.svg.getAttribute('height')) || 2940;
    const vb = (S.svg.getAttribute('viewBox') || '0 0 1280 2940').trim().split(/\s+/).map(Number);
    if (vb.length === 4 && vb.every(Number.isFinite)) S.baseViewBox = vb;
    S.baseLabTransform = S.lab?.getAttribute('transform') || 'translate(0,2350)';
    injectStyle();
    S.ready = true;
    window.dispatchEvent(new CustomEvent('i13-exploded-ready', { detail: selfTest() }));
  }

  function attach() {
    S.object = document.getElementById(CFG.objectId);
    if (!S.object) return;
    S.object.addEventListener('load', initialize);
    if (S.object.contentDocument?.documentElement) initialize();
  }

  window.I13Exploded = Object.freeze({
    version: '0.2.0',
    mount,
    unmount,
    expand: id => setExpanded(id, true),
    collapse: id => setExpanded(id, false),
    toggle,
    expandMachine: id => setMachineExpanded(id, true),
    collapseMachine: id => setMachineExpanded(id, false),
    toggleMachine,
    getState,
    selfTest,
    isReady: () => S.ready,
    mountedCount: () => S.mounted.size
  });

  attach();
})();