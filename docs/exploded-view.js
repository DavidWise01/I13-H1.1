/* I13 H1.1 reusable exploded-view component — Stage 2 only. */
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
    rowHeight: 21,
    maxRows: 7
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
.i13-exploded-toggle{cursor:pointer}
.i13-exploded-toggle .ev-bg{fill:#fff;stroke:var(--line,#94a3b8);stroke-width:1.2}
.i13-exploded-toggle:hover .ev-bg{fill:#f8fafc;stroke:var(--line-strong,#475569)}
.i13-exploded-toggle .ev-label{font-size:11px;font-weight:800;letter-spacing:.06em;fill:var(--muted,#64748b)}
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
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
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

  function normalize(moduleId, spec = {}) {
    if (!moduleId || typeof moduleId !== 'string') throw new TypeError('moduleId must be a non-empty string');
    const out = {
      title: String(spec.title ?? `${moduleId.toUpperCase()} · EXPLODED`),
      subtitle: String(spec.subtitle ?? 'input → pipeline → state → output'),
      family: String(spec.family ?? 'i13').toLowerCase(),
      expanded: spec.expanded === true,
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
    const topRows = Math.max(1, ...[out.input, out.pipeline, out.state, out.output].map(r => Math.min(CFG.maxRows, r.length)));
    const topHeight = 50 + topRows * CFG.rowHeight;
    const bottomHeight = (out.machine.length || out.controls.length) ? 92 + Math.min(CFG.maxRows, out.machine.length) * CFG.rowHeight : 0;
    out.height = Math.max(CFG.minHeight, 42 + 36 + topHeight + bottomHeight);
    return out;
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

  function section(title, data, x, y, width, height) {
    const g = el('g');
    g.appendChild(el('rect', { x, y, width, height, rx: 6, class: 'ev-section' }));
    g.appendChild(el('text', { x: x + 12, y: y + 20, class: 'ev-section-title' }, title));
    const shown = data.slice(0, CFG.maxRows);
    if (!shown.length) g.appendChild(el('text', { x: x + 12, y: y + 44, class: 'ev-row-muted' }, '—'));
    shown.forEach((r, i) => g.appendChild(el('text', {
      x: x + 12,
      y: y + 44 + i * CFG.rowHeight,
      class: r.muted ? 'ev-row-muted' : 'ev-row'
    }, r.text)));
    if (data.length > shown.length) g.appendChild(el('text', { x: x + 12, y: y + height - 10, class: 'ev-row-muted' }, `+${data.length - shown.length} more`));
    return g;
  }

  function renderPanel(record) {
    const { spec, baseY } = record;
    const x = CFG.panelX;
    const y = baseY + 102;
    const w = CFG.panelWidth;
    const h = spec.height;
    const p = el('g', { class: 'i13-exploded-panel', 'data-exploded-for': record.moduleId, 'data-family': spec.family });
    p.appendChild(el('rect', { x, y, width: w, height: h, rx: 8, class: 'ev-shell' }));
    p.appendChild(el('rect', { x: x + 1, y: y + 1, width: w - 2, height: 42, rx: 7, class: 'ev-header' }));
    p.appendChild(el('text', { x: x + 18, y: y + 25, class: 'ev-title' }, spec.title));
    p.appendChild(el('text', { x: x + w - 18, y: y + 25, 'text-anchor': 'end', class: 'ev-subtitle' }, spec.subtitle));

    const pad = 18, gap = 14, contentY = y + 60, inner = w - pad * 2;
    const cw = (inner - gap * 3) / 4;
    const topRows = Math.max(1, ...[spec.input, spec.pipeline, spec.state, spec.output].map(r => Math.min(CFG.maxRows, r.length)));
    const ch = 50 + topRows * CFG.rowHeight;
    const defs = [['INPUT', spec.input], ['PIPELINE', spec.pipeline], ['STATE', spec.state], ['OUTPUT', spec.output]];
    defs.forEach(([title, data], i) => {
      const sx = x + pad + i * (cw + gap);
      p.appendChild(section(title, data, sx, contentY, cw, ch));
      if (i < 3) p.appendChild(el('line', { x1: sx + cw + 3, y1: contentY + ch / 2, x2: sx + cw + gap - 3, y2: contentY + ch / 2, class: 'ev-flow' }));
    });

    const lowerY = contentY + ch + 12;
    if (spec.machine.length || spec.controls.length) {
      const lowerH = y + h - 18 - lowerY;
      p.appendChild(el('rect', { x: x + pad, y: lowerY, width: inner, height: lowerH, rx: 6, class: 'ev-machine' }));
      p.appendChild(el('text', { x: x + pad + 12, y: lowerY + 20, class: 'ev-section-title' }, 'MACHINE / RUNTIME'));
      spec.machine.slice(0, CFG.maxRows).forEach((r, i) => p.appendChild(el('text', {
        x: x + pad + 12,
        y: lowerY + 44 + i * CFG.rowHeight,
        class: r.muted ? 'ev-row-muted' : 'ev-row'
      }, r.text)));
      let cx = x + w - pad - 10;
      [...spec.controls].reverse().forEach(control => {
        const bw = Math.max(84, Math.min(150, 28 + control.label.length * 7));
        cx -= bw;
        const g = el('g', { 'data-control': control.id });
        g.appendChild(el('rect', { x: cx, y: lowerY + 14, width: bw, height: 30, rx: 5, class: 'ev-control' }));
        g.appendChild(el('text', { x: cx + bw / 2, y: lowerY + 34, 'text-anchor': 'middle', class: 'ev-control-text' }, control.label));
        if (control.onClick) g.addEventListener('click', event => control.onClick({ event, moduleId: record.moduleId }));
        p.appendChild(g);
        cx -= 8;
      });
    }
    record.panel = p;
    record.group.appendChild(p);
    p.style.display = record.expanded ? '' : 'none';
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

  function order() {
    return [...S.layer.querySelectorAll(':scope > g[data-module]')].map(g => g.getAttribute('data-module')).filter(Boolean);
  }

  function reflow() {
    let offset = 0;
    order().forEach(id => {
      const group = S.layer.querySelector(`:scope > g[data-module="${CSS.escape(id)}"]`);
      if (group) group.setAttribute('transform', `translate(0 ${offset})`);
      const r = S.mounted.get(id);
      if (r?.expanded) offset += r.spec.height + CFG.panelGap;
    });

    if (S.lab) {
      const m = /translate\(\s*([^,\s]+)[,\s]+([^\)]+)\)/.exec(S.baseLabTransform);
      if (m) S.lab.setAttribute('transform', `translate(${Number(m[1]) || 0},${(Number(m[2]) || 0) + offset})`);
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
    const record = { moduleId, group, baseY: Number(rect.getAttribute('y')) || 0, spec: normalize(moduleId, spec), expanded: spec.expanded === true, panel: null, toggle: null };
    S.mounted.set(moduleId, record);
    renderPanel(record);
    renderToggle(record);
    reflow();
    return getState(moduleId);
  }

  function unmount(moduleId) {
    ensureReady();
    const r = S.mounted.get(moduleId);
    if (!r) return false;
    r.panel?.remove();
    r.toggle?.remove();
    S.mounted.delete(moduleId);
    reflow();
    return true;
  }

  function setExpanded(moduleId, expanded) {
    ensureReady();
    const r = S.mounted.get(moduleId);
    if (!r) throw new Error(`Exploded view not mounted for ${moduleId}`);
    r.expanded = !!expanded;
    r.panel.style.display = r.expanded ? '' : 'none';
    setToggle(r);
    reflow();
    return getState(moduleId);
  }

  function toggle(moduleId) {
    const r = S.mounted.get(moduleId);
    if (!r) throw new Error(`Exploded view not mounted for ${moduleId}`);
    return setExpanded(moduleId, !r.expanded);
  }

  function getState(moduleId) {
    const r = S.mounted.get(moduleId);
    return r ? Object.freeze({ moduleId, expanded: r.expanded, height: r.spec.height, family: r.spec.family, title: r.spec.title }) : null;
  }

  function selfTest() {
    const checks = [];
    const check = (name, fn) => { try { checks.push({ name, pass: !!fn() }); } catch (e) { checks.push({ name, pass: false, error: e.message }); } };
    check('row normalization', () => rows('x')[0].text === 'x');
    check('object row normalization', () => rows({ text: 'y', muted: true })[0].muted === true);
    check('blank module id rejected', () => { try { normalize('', {}); return false; } catch { return true; } });
    check('minimum panel height', () => normalize('x', {}).height >= CFG.minHeight);
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
    version: '0.1.0',
    mount,
    unmount,
    expand: id => setExpanded(id, true),
    collapse: id => setExpanded(id, false),
    toggle,
    getState,
    selfTest,
    isReady: () => S.ready,
    mountedCount: () => S.mounted.size
  });

  attach();
})();
