/*
 * I13 H1.1 — reusable exploded-view SVG component
 * Stage 2: component only. No trunk module is mounted here.
 *
 * Public API (wrapper window):
 *   I13Exploded.mount(moduleId, spec)
 *   I13Exploded.unmount(moduleId)
 *   I13Exploded.expand(moduleId)
 *   I13Exploded.collapse(moduleId)
 *   I13Exploded.toggle(moduleId)
 *   I13Exploded.getState(moduleId)
 *   I13Exploded.selfTest()
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const DEFAULTS = Object.freeze({
    objectId: 'i13',
    moduleLayerId: 'module-layer',
    labId: 'lab',
    svgWidth: 1280,
    baseSvgHeight: 2940,
    baseObjectHeight: 2940,
    panelX: 140,
    panelWidth: 1070,
    panelTopGap: 10,
    panelBottomGap: 14,
    panelMinHeight: 228,
    panelPadding: 18,
    columnGap: 14,
    headerHeight: 42,
    sectionTitleHeight: 20,
    rowHeight: 21,
    maxRowsPerSection: 7,
    animationMs: 150
  });

  const state = {
    config: { ...DEFAULTS },
    object: null,
    doc: null,
    svg: null,
    moduleLayer: null,
    lab: null,
    mounted: new Map(),
    baseModuleY: new Map(),
    baseLabTransform: null,
    baseSvgHeight: null,
    baseViewBox: null,
    ready: false
  };

  const COMPONENT_STYLE = `
.i13-exploded-toggle{cursor:pointer}
.i13-exploded-toggle .ev-toggle-bg{fill:#fff;stroke:var(--line,#94a3b8);stroke-width:1.2}
.i13-exploded-toggle:hover .ev-toggle-bg{fill:#f8fafc;stroke:var(--line-strong,#475569)}
.i13-exploded-toggle .ev-toggle-text{font-size:11px;font-weight:800;letter-spacing:.06em;fill:var(--muted,#64748b)}
.i13-exploded-panel{pointer-events:auto}
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

  function svgEl(name, attrs = {}, text = '') {
    const node = state.doc.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    }
    if (text !== '') node.textContent = String(text);
    return node;
  }

  function normalizeRows(value) {
    if (value == null) return [];
    const rows = Array.isArray(value) ? value : [value];
    return rows.map(row => {
      if (typeof row === 'string' || typeof row === 'number') return { text: String(row) };
      if (!row || typeof row !== 'object') return { text: String(row) };
      return { text: String(row.text ?? ''), muted: !!row.muted };
    }).filter(row => row.text.length > 0);
  }

  function normalizeSpec(moduleId, spec = {}) {
    if (!moduleId || typeof moduleId !== 'string') throw new TypeError('moduleId must be a non-empty string');
    if (!spec || typeof spec !== 'object') throw new TypeError('spec must be an object');

    const normalized = {
      title: String(spec.title ?? `${moduleId.toUpperCase()} · EXPLODED`),
      subtitle: String(spec.subtitle ?? 'input → pipeline → state → output'),
      family: String(spec.family ?? 'i13').toLowerCase(),
      expanded: spec.expanded === true,
      input: normalizeRows(spec.input),
      pipeline: normalizeRows(spec.pipeline),
      state: normalizeRows(spec.state),
      output: normalizeRows(spec.output),
      machine: normalizeRows(spec.machine),
      controls: Array.isArray(spec.controls) ? spec.controls.map(control => ({
        id: String(control.id ?? ''),
        label: String(control.label ?? control.id ?? ''),
        onClick: typeof control.onClick === 'function' ? control.onClick : null
      })).filter(control => control.id && control.label) : []
    };

    const rowCounts = [normalized.input, normalized.pipeline, normalized.state, normalized.output]
      .map(rows => Math.min(rows.length, state.config.maxRowsPerSection));
    const upperRows = Math.max(1, ...rowCounts);
    const upperHeight = state.config.sectionTitleHeight + upperRows * state.config.rowHeight + 30;
    const machineRows = Math.min(normalized.machine.length, state.config.maxRowsPerSection);
    const lowerHeight = normalized.machine.length || normalized.controls.length
      ? 24 + Math.max(55, machineRows * state.config.rowHeight + 18, normalized.controls.length ? 48 : 0)
      : 0;

    normalized.height = Math.max(
      state.config.panelMinHeight,
      state.config.headerHeight + state.config.panelPadding * 2 + upperHeight + lowerHeight
    );
    return normalized;
  }

  function ensureReady() {
    if (!state.ready) throw new Error('I13Exploded is not ready; wait for the i13.svg object load event');
  }

  function captureBaseGeometry() {
    state.baseModuleY.clear();
    state.moduleLayer.querySelectorAll(':scope > g[data-module]').forEach(group => {
      const rect = group.querySelector('rect.box');
      if (rect) state.baseModuleY.set(group.getAttribute('data-module'), Number(rect.getAttribute('y')) || 0);
    });
    state.baseLabTransform = state.lab ? (state.lab.getAttribute('transform') || '') : '';
    state.baseSvgHeight = Number(state.svg.getAttribute('height')) || state.config.baseSvgHeight;
    state.baseViewBox = (state.svg.getAttribute('viewBox') || `0 0 ${state.config.svgWidth} ${state.baseSvgHeight}`)
      .trim().split(/\s+/).map(Number);
  }

  function injectStyle() {
    let style = state.doc.getElementById('i13-exploded-style');
    if (!style) {
      style = state.doc.createElementNS(SVG_NS, 'style');
      style.id = 'i13-exploded-style';
      state.svg.appendChild(style);
    }
    style.textContent = COMPONENT_STYLE;
  }

  function makeSection(title, rows, x, y, width, height) {
    const group = svgEl('g', { class: 'ev-section-group' });
    group.appendChild(svgEl('rect', { x, y, width, height, rx: 6, class: 'ev-section' }));
    group.appendChild(svgEl('text', { x: x + 12, y: y + 20, class: 'ev-section-title' }, title));
    const visible = rows.slice(0, state.config.maxRowsPerSection);
    if (!visible.length) {
      group.appendChild(svgEl('text', { x: x + 12, y: y + 44, class: 'ev-row-muted' }, '—'));
      return group;
    }
    visible.forEach((row, index) => {
      group.appendChild(svgEl('text', {
        x: x + 12,
        y: y + 44 + index * state.config.rowHeight,
        class: row.muted ? 'ev-row-muted' : 'ev-row'
      }, row.text));
    });
    if (rows.length > visible.length) {
      group.appendChild(svgEl('text', {
        x: x + 12,
        y: y + height - 10,
        class: 'ev-row-muted'
      }, `+${rows.length - visible.length} more`));
    }
    return group;
  }

  function makeControl(control, x, y, width = 96) {
    const group = svgEl('g', { class: 'ev-control-group', 'data-control': control.id });
    group.appendChild(svgEl('rect', { x, y, width, height: 30, rx: 5, class: 'ev-control' }));
    group.appendChild(svgEl('text', {
      x: x + width / 2,
      y: y + 20,
      'text-anchor': 'middle',
      class: 'ev-control-text'
    }, control.label));
    if (control.onClick) group.addEventListener('click', event => control.onClick({ event, moduleId: group.closest('[data-exploded-for]')?.getAttribute('data-exploded-for') }));
    return group;
  }

  function renderPanel(record) {
    const { spec, baseY } = record;
    const x = state.config.panelX;
    const y = baseY + 92 + state.config.panelTopGap;
    const width = state.config.panelWidth;
    const height = spec.height;
    const panel = svgEl('g', {
      class: 'i13-exploded-panel',
      'data-exploded-for': record.moduleId,
      'data-family': spec.family,
      transform: 'translate(0 0)'
    });

    panel.appendChild(svgEl('rect', { x, y, width, height, rx: 8, class: 'ev-shell' }));
    panel.appendChild(svgEl('rect', { x: x + 1, y: y + 1, width: width - 2, height: state.config.headerHeight, rx: 7, class: 'ev-header' }));
    panel.appendChild(svgEl('text', { x: x + 18, y: y + 24, class: 'ev-title' }, spec.title));
    panel.appendChild(svgEl('text', { x: x + width - 18, y: y + 24, 'text-anchor': 'end', class: 'ev-subtitle' }, spec.subtitle));

    const contentY = y + state.config.headerHeight + state.config.panelPadding;
    const innerWidth = width - state.config.panelPadding * 2;
    const colGap = state.config.columnGap;
    const colWidth = (innerWidth - colGap * 3) / 4;
    const sectionRows = [spec.input, spec.pipeline, spec.state, spec.output]
      .map(rows => Math.min(rows.length, state.config.maxRowsPerSection));
    const upperRows = Math.max(1, ...sectionRows);
    const upperHeight = state.config.sectionTitleHeight + upperRows * state.config.rowHeight + 30;
    const sections = [
      ['INPUT', spec.input],
      ['PIPELINE', spec.pipeline],
      ['STATE', spec.state],
      ['OUTPUT', spec.output]
    ];

    sections.forEach(([title, rows], index) => {
      const sx = x + state.config.panelPadding + index * (colWidth + colGap);
      panel.appendChild(makeSection(title, rows, sx, contentY, colWidth, upperHeight));
      if (index < sections.length - 1) {
        const arrowY = contentY + upperHeight / 2;
        panel.appendChild(svgEl('line', {
          x1: sx + colWidth + 3,
          y1: arrowY,
          x2: sx + colWidth + colGap - 3,
          y2: arrowY,
          class: 'ev-flow'
        }));
      }
    });

    let lowerY = contentY + upperHeight + 12;
    if (spec.machine.length || spec.controls.length) {
      const lowerHeight = y + height - state.config.panelPadding - lowerY;
      panel.appendChild(svgEl('rect', {
        x: x + state.config.panelPadding,
        y: lowerY,
        width: innerWidth,
        height: lowerHeight,
        rx: 6,
        class: 'ev-machine'
      }));
      panel.appendChild(svgEl('text', { x: x + state.config.panelPadding + 12, y: lowerY + 20, class: 'ev-section-title' }, 'MACHINE / RUNTIME'));
      spec.machine.slice(0, state.config.maxRowsPerSection).forEach((row, index) => {
        panel.appendChild(svgEl('text', {
          x: x + state.config.panelPadding + 12,
          y: lowerY + 44 + index * state.config.rowHeight,
          class: row.muted ? 'ev-row-muted' : 'ev-row'
        }, row.text));
      });

      let controlX = x + width - state.config.panelPadding - 10;
      [...spec.controls].reverse().forEach(control => {
        const buttonWidth = Math.max(84, Math.min(150, 28 + control.label.length * 7));
        controlX -= buttonWidth;
        panel.appendChild(makeControl(control, controlX, lowerY + 14, buttonWidth));
        controlX -= 8;
      });
    }

    record.panel = panel;
    record.group.appendChild(panel);
    panel.style.display = record.expanded ? '' : 'none';
  }

  function renderToggle(record) {
    const x = state.config.panelX + state.config.panelWidth - 96;
    const y = record.baseY + 50;
    const toggle = svgEl('g', {
      class: 'i13-exploded-toggle',
      'data-exploded-toggle': record.moduleId,
      role: 'button',
      tabindex: '0',
      'aria-expanded': record.expanded ? 'true' : 'false'
    });
    toggle.appendChild(svgEl('rect', { x, y, width: 76, height: 26, rx: 13, class: 'ev-toggle-bg' }));
    toggle.appendChild(svgEl('text', { x: x + 38, y: y + 18, 'text-anchor': 'middle', class: 'ev-toggle-text' }, record.expanded ? 'CLOSE' : 'EXPLODE'));
    const activate = () => toggleModule(record.moduleId);
    toggle.addEventListener('click', activate);
    toggle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
    record.toggle = toggle;
    record.group.appendChild(toggle);
  }

  function setToggleState(record) {
    if (!record.toggle) return;
    record.toggle.setAttribute('aria-expanded', record.expanded ? 'true' : 'false');
    const label = record.toggle.querySelector('.ev-toggle-text');
    if (label) label.textContent = record.expanded ? 'CLOSE' : 'EXPLODE';
  }

  function moduleOrder() {
    return [...state.moduleLayer.querySelectorAll(':scope > g[data-module]')]
      .map(group => group.getAttribute('data-module'))
      .filter(Boolean);
  }

  function extraFor(moduleId) {
    const record = state.mounted.get(moduleId);
    return record && record.expanded ? record.spec.height + state.config.panelBottomGap : 0;
  }

  function reflow() {
    ensureReady();
    let offset = 0;
    for (const moduleId of moduleOrder()) {
      const group = state.moduleLayer.querySelector(`:scope > g[data-module="${CSS.escape(moduleId)}"]`);
      if (!group) continue;
      group.setAttribute('transform', `translate(0 ${offset})`);
      offset += extraFor(moduleId);
    }

    if (state.lab) {
      const baseMatch = /translate\(\s*([^,\s]+)[,\s]+([^\)]+)\)/.exec(state.baseLabTransform || '');
      if (baseMatch) {
        const x = Number(baseMatch[1]) || 0;
        const y = Number(baseMatch[2]) || 0;
        state.lab.setAttribute('transform', `translate(${x},${y + offset})`);
      }
    }

    const newHeight = state.baseSvgHeight + offset;
    state.svg.setAttribute('height', String(newHeight));
    if (Array.isArray(state.baseViewBox) && state.baseViewBox.length === 4) {
      state.svg.setAttribute('viewBox', `${state.baseViewBox[0]} ${state.baseViewBox[1]} ${state.baseViewBox[2]} ${state.baseViewBox[3] + offset}`);
    }
    if (state.object) state.object.style.height = `${state.config.baseObjectHeight + offset}px`;
  }

  function mount(moduleId, spec = {}) {
    ensureReady();
    if (state.mounted.has(moduleId)) unmount(moduleId);

    const group = state.moduleLayer.querySelector(`:scope > g[data-module="${CSS.escape(moduleId)}"]`);
    if (!group) throw new Error(`Unknown trunk module: ${moduleId}`);
    const rect = group.querySelector('rect.box');
    if (!rect) throw new Error(`Module ${moduleId} has no base rect.box`);

    const normalized = normalizeSpec(moduleId, spec);
    const record = {
      moduleId,
      group,
      baseY: Number(rect.getAttribute('y')) || 0,
      spec: normalized,
      expanded: normalized.expanded,
      panel: null,
      toggle: null
    };
    state.mounted.set(moduleId, record);
    renderPanel(record);
    renderToggle(record);
    reflow();
    return getState(moduleId);
  }

  function unmount(moduleId) {
    ensureReady();
    const record = state.mounted.get(moduleId);
    if (!record) return false;
    record.panel?.remove();
    record.toggle?.remove();
    state.mounted.delete(moduleId);
    reflow();
    return true;
  }

  function setExpanded(moduleId, expanded) {
    ensureReady();
    const record = state.mounted.get(moduleId);
    if (!record) throw new Error(`Exploded view is not mounted for ${moduleId}`);
    record.expanded = !!expanded;
    if (record.panel) record.panel.style.display = record.expanded ? '' : 'none';
    setToggleState(record);
    reflow();
    return getState(moduleId);
  }

  function toggleModule(moduleId) {
    const record = state.mounted.get(moduleId);
    if (!record) throw new Error(`Exploded view is not mounted for ${moduleId}`);
    return setExpanded(moduleId, !record.expanded);
  }

  function getState(moduleId) {
    const record = state.mounted.get(moduleId);
    if (!record) return null;
    return Object.freeze({
      moduleId: record.moduleId,
      expanded: record.expanded,
      height: record.spec.height,
      family: record.spec.family,
      title: record.spec.title
    });
  }

  function selfTest() {
    const checks = [];
    const check = (name, fn) => {
      try { checks.push({ name, pass: !!fn() }); }
      catch (error) { checks.push({ name, pass: false, error: error.message }); }
    };
    check('normalize scalar rows', () => normalizeRows('x')[0].text === 'x');
    check('normalize object rows', () => normalizeRows({ text: 'y', muted: true })[0].muted === true);
    check('reject blank module id', () => { try { normalizeSpec('', {}); return false; } catch { return true; } });
    check('panel has minimum height', () => normalizeSpec('x', {}).height >= state.config.panelMinHeight);
    check('API starts with zero mounted modules', () => state.mounted.size === 0);
    return Object.freeze({ pass: checks.every(item => item.pass), checks });
  }

  function attach() {
    state.object = document.getElementById(state.config.objectId);
    if (!state.object) return;

    const initialize = () => {
      const doc = state.object.contentDocument;
      if (!doc || !doc.documentElement) return;
      state.doc = doc;
      state.svg = doc.documentElement;
      state.moduleLayer = doc.getElementById(state.config.moduleLayerId);
      state.lab = doc.getElementById(state.config.labId);
      if (!state.moduleLayer) return;
      injectStyle();
      captureBaseGeometry();
      state.ready = true;
      window.dispatchEvent(new CustomEvent('i13-exploded-ready', { detail: selfTest() }));
    };

    state.object.addEventListener('load', initialize);
    if (state.object.contentDocument?.documentElement) initialize();
  }

  window.I13Exploded = Object.freeze({
    version: '0.1.0',
    mount,
    unmount,
    expand: moduleId => setExpanded(moduleId, true),
    collapse: moduleId => setExpanded(moduleId, false),
    toggle: toggleModule,
    getState,
    selfTest,
    isReady: () => state.ready,
    mountedCount: () => state.mounted.size
  });

  attach();
})();
