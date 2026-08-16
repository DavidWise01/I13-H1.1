/* I13 H1.1 reusable exploded-view component — Stage 13.1 / v0.3.1.
 * Glass + boundary tightening:
 * - translucent holographic SVG panels
 * - fixed footer rail inside every section
 * - overflow paging without resizing the outer section
 * - machine/runtime paging
 * - Stage 13 freeze graphic receives a collision-free 56px footer rail
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CFG = Object.freeze({
    objectId: 'i13', moduleLayerId: 'module-layer', labId: 'lab',
    panelX: 140, panelWidth: 1070, minHeight: 252, panelGap: 14,
    maxRows: 7, pad: 18, gap: 14, headerHeight: 42, contentTop: 60,
    lineHeight: 16, rowGap: 5, charPx: 7.1,
    sectionFooterHeight: 56, sectionBodyTop: 38, sectionBottomPad: 10,
    machineCollapsedHeight: 48, machineFooterHeight: 34
  });

  const S = {
    object: null, doc: null, svg: null, layer: null, lab: null, ready: false,
    mounted: new Map(), baseSvgHeight: 2940, baseViewBox: [0, 0, 1280, 2940],
    baseLabTransform: 'translate(0,2350)'
  };

  const STYLE = `
.i13-exploded-toggle,.ev-machine-toggle,.ev-section-more,.ev-machine-more{cursor:pointer}
.i13-exploded-toggle .ev-bg,.ev-machine-toggle .ev-machine-toggle-bg{fill:url(#ev-glass-control);stroke:var(--line,#94a3b8);stroke-width:1.15;filter:url(#ev-glass-shadow-soft)}
.i13-exploded-toggle:hover .ev-bg,.ev-machine-toggle:hover .ev-machine-toggle-bg,.ev-section-more:hover .ev-more-bg,.ev-machine-more:hover .ev-more-bg{stroke:var(--line-strong,#475569)}
.i13-exploded-toggle .ev-label,.ev-machine-toggle .ev-machine-toggle-label{font-size:11px;font-weight:800;letter-spacing:.06em;fill:var(--muted,#64748b)}
.i13-exploded-panel .ev-shell{fill:url(#ev-glass-shell);stroke:var(--line-strong,#475569);stroke-width:1.35;filter:url(#ev-glass-shadow)}
.i13-exploded-panel .ev-shell-sheen{fill:none;stroke:rgba(255,255,255,.72);stroke-width:.8;pointer-events:none}
.i13-exploded-panel .ev-header{fill:url(#ev-glass-header);stroke:var(--line,#94a3b8);stroke-width:1}
.i13-exploded-panel .ev-title{font-size:13px;font-weight:800;letter-spacing:.08em;fill:var(--ink,#18212b)}
.i13-exploded-panel .ev-subtitle{font-size:11px;fill:var(--muted,#64748b)}
.i13-exploded-panel .ev-section{fill:url(#ev-glass-section);stroke:var(--line,#94a3b8);stroke-width:1}
.i13-exploded-panel .ev-section-title{font-size:11px;font-weight:800;letter-spacing:.07em;fill:var(--muted,#64748b)}
.i13-exploded-panel .ev-row{font-size:12px;fill:var(--ink,#18212b)}
.i13-exploded-panel .ev-row-muted{font-size:11px;fill:var(--muted,#64748b)}
.i13-exploded-panel .ev-flow{stroke:var(--line-strong,#475569);stroke-width:1.35;fill:none;marker-end:url(#arrow)}
.i13-exploded-panel .ev-section-footer-line,.i13-exploded-panel .ev-machine-footer-line{stroke:rgba(100,116,139,.28);stroke-width:1}
.i13-exploded-panel .ev-footer-mark{font-size:8px;font-weight:800;letter-spacing:.12em;fill:rgba(100,116,139,.55)}
.i13-exploded-panel .ev-more-bg{fill:url(#ev-glass-control);stroke:rgba(100,116,139,.42);stroke-width:1}
.i13-exploded-panel .ev-more-label{font-size:9px;font-weight:800;letter-spacing:.05em;fill:var(--muted,#64748b);pointer-events:none}
.i13-exploded-panel .ev-machine{fill:url(#ev-glass-machine);stroke:var(--line,#94a3b8);stroke-width:1;filter:url(#ev-glass-shadow-soft)}
.i13-exploded-panel .ev-control{fill:url(#ev-glass-control);stroke:var(--line,#94a3b8);stroke-width:1;cursor:pointer}
.i13-exploded-panel .ev-control:hover{stroke:var(--wasm,#2563eb)}
.i13-exploded-panel .ev-control-text{font-size:11px;font-weight:700;fill:var(--ink,#18212b);pointer-events:none}
.i13-exploded-panel[data-family="i13"] .ev-shell{stroke:var(--i13,#0e7490)}
.i13-exploded-panel[data-family="python"] .ev-shell{stroke:var(--python,#ca8a04)}
.i13-exploded-panel[data-family="wasm"] .ev-shell{stroke:var(--wasm,#2563eb)}
.i13-exploded-panel[data-family="gpu"] .ev-shell{stroke:var(--gpu,#c026d3)}
.i13-exploded-panel[data-family="cortex"] .ev-shell{stroke:var(--cortex,#be123c)}
.i13-exploded-panel[data-family="live"] .ev-shell{stroke:var(--live,#16a34a)}
.i13-exploded-panel[data-family="freeze"] .ev-shell{stroke:var(--freeze,#64748b)}
.i13-exploded-panel[data-family="la"] .ev-shell{stroke:var(--la,#0f766e)}
.i13-exploded-panel[data-family="qec"] .ev-shell{stroke:var(--qec,#6d28d9)}
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
    const flush = () => { if (line) out.push(line); line = ''; };
    for (let word of words) {
      if (!word) continue;
      if (word.length > limit) {
        flush();
        while (word.length > limit) { out.push(word.slice(0, limit)); word = word.slice(limit); }
        line = word;
        continue;
      }
      if (!line) line = word;
      else if (line.length + 1 + word.length <= limit) line += ` ${word}`;
      else { out.push(line); line = word; }
    }
    flush();
    return out.length ? out : [''];
  }

  function maxCharsFor(width, fontPx = 12) {
    const factor = fontPx <= 11 ? 6.6 : CFG.charPx;
    return Math.max(8, Math.floor(width / factor));
  }

  function pageSlices(data) {
    if (!data.length) return [[]];
    const pages = [];
    for (let i = 0; i < data.length; i += CFG.maxRows) pages.push(data.slice(i, i + CFG.maxRows));
    return pages;
  }

  function pageBodyHeight(page, width) {
    if (!page.length) return CFG.lineHeight;
    const maxChars = maxCharsFor(width - 24);
    let height = 0;
    page.forEach((row, index) => {
      height += wrapLines(row.text, maxChars).length * CFG.lineHeight;
      if (index < page.length - 1) height += CFG.rowGap;
    });
    return height;
  }

  function stableBodyHeight(data, width) {
    return Math.max(...pageSlices(data).map(page => pageBodyHeight(page, width)));
  }

  function wrappedText(attrs, value, maxChars, lineHeight = CFG.lineHeight) {
    const node = el('text', attrs);
    wrapLines(value, maxChars).forEach((line, index) => {
      node.appendChild(el('tspan', { x: attrs.x, dy: index === 0 ? 0 : lineHeight }, line));
    });
    return node;
  }

  function safeId(value) { return String(value).replace(/[^a-zA-Z0-9_-]/g, '-'); }

  function addClip(defs, id, x, y, width, height) {
    const clip = el('clipPath', { id, clipPathUnits: 'userSpaceOnUse' });
    clip.appendChild(el('rect', { x, y, width: Math.max(1, width), height: Math.max(1, height) }));
    defs.appendChild(clip);
  }

  function gradient(defs, id, stops) {
    const g = el('linearGradient', { id, x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
    stops.forEach(stop => g.appendChild(el('stop', {
      offset: stop.offset, 'stop-color': stop.color, 'stop-opacity': stop.opacity
    })));
    defs.appendChild(g);
  }

  function ensureGlassDefs() {
    let defs = S.svg.querySelector('#i13-exploded-global-defs');
    if (defs) return defs;
    defs = el('defs', { id: 'i13-exploded-global-defs' });
    gradient(defs, 'ev-glass-shell', [
      { offset: '0%', color: '#ffffff', opacity: '.92' },
      { offset: '38%', color: '#ecfeff', opacity: '.68' },
      { offset: '70%', color: '#faf5ff', opacity: '.62' },
      { offset: '100%', color: '#ffffff', opacity: '.82' }
    ]);
    gradient(defs, 'ev-glass-header', [
      { offset: '0%', color: '#ffffff', opacity: '.82' },
      { offset: '55%', color: '#eff6ff', opacity: '.60' },
      { offset: '100%', color: '#fdf4ff', opacity: '.68' }
    ]);
    gradient(defs, 'ev-glass-section', [
      { offset: '0%', color: '#ffffff', opacity: '.72' },
      { offset: '48%', color: '#f0fdfa', opacity: '.48' },
      { offset: '100%', color: '#faf5ff', opacity: '.56' }
    ]);
    gradient(defs, 'ev-glass-machine', [
      { offset: '0%', color: '#f8fafc', opacity: '.76' },
      { offset: '50%', color: '#eff6ff', opacity: '.50' },
      { offset: '100%', color: '#fdf4ff', opacity: '.58' }
    ]);
    gradient(defs, 'ev-glass-control', [
      { offset: '0%', color: '#ffffff', opacity: '.94' },
      { offset: '100%', color: '#e0f2fe', opacity: '.72' }
    ]);
    const shadow = el('filter', { id: 'ev-glass-shadow', x: '-20%', y: '-20%', width: '140%', height: '150%' });
    shadow.appendChild(el('feDropShadow', { dx: '0', dy: '5', stdDeviation: '7', 'flood-color': '#0f172a', 'flood-opacity': '.12' }));
    defs.appendChild(shadow);
    const soft = el('filter', { id: 'ev-glass-shadow-soft', x: '-15%', y: '-15%', width: '130%', height: '140%' });
    soft.appendChild(el('feDropShadow', { dx: '0', dy: '3', stdDeviation: '4', 'flood-color': '#0f172a', 'flood-opacity': '.08' }));
    defs.appendChild(soft);
    S.svg.insertBefore(defs, S.svg.firstChild);
    return defs;
  }

  function normalize(moduleId, spec = {}) {
    if (!moduleId || typeof moduleId !== 'string') throw new TypeError('moduleId must be a non-empty string');
    const out = {
      title: String(spec.title ?? `${moduleId.toUpperCase()} · EXPLODED`),
      subtitle: String(spec.subtitle ?? 'input → pipeline → state → output'),
      family: String(spec.family ?? 'i13').toLowerCase(),
      expanded: spec.expanded === true,
      machineExpanded: spec.machineExpanded === true,
      input: rows(spec.input), pipeline: rows(spec.pipeline), state: rows(spec.state), output: rows(spec.output),
      machine: rows(spec.machine),
      controls: Array.isArray(spec.controls) ? spec.controls.map(c => ({
        id: String(c.id ?? ''), label: String(c.label ?? c.id ?? ''),
        onClick: typeof c.onClick === 'function' ? c.onClick : null
      })).filter(c => c.id && c.label) : []
    };
    const inner = CFG.panelWidth - CFG.pad * 2;
    const cw = (inner - CFG.gap * 3) / 4;
    const sectionData = [out.input, out.pipeline, out.state, out.output];
    const topBody = Math.max(...sectionData.map(data => stableBodyHeight(data, cw)));
    out.topHeight = Math.max(154, 56 + topBody + CFG.sectionFooterHeight);
    out.hasMachine = out.machine.length > 0 || out.controls.length > 0;
    const machineBody = stableBodyHeight(out.machine, inner);
    out.machineExpandedHeight = Math.max(140, 68 + machineBody + CFG.machineFooterHeight);
    return out;
  }

  function panelHeight(record) {
    const machineH = record.spec.hasMachine
      ? (record.machineExpanded ? record.spec.machineExpandedHeight : CFG.machineCollapsedHeight) : 0;
    return Math.max(CFG.minHeight, CFG.contentTop + record.spec.topHeight + 12 + machineH + 18);
  }

  function ensureReady() { if (!S.ready) throw new Error('I13Exploded not ready; wait for i13-exploded-ready'); }

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
    const g = el('g', { class: 'ev-section-group', 'data-section-index': index, 'data-section-title': title });
    g.appendChild(el('rect', { x, y, width, height, rx: 8, class: 'ev-section' }));
    g.appendChild(el('text', { x: x + 12, y: y + 20, class: 'ev-section-title' }, title));

    const footerTop = y + height - CFG.sectionFooterHeight;
    g.appendChild(el('line', { x1: x + 8, x2: x + width - 8, y1: footerTop, y2: footerTop, class: 'ev-section-footer-line' }));
    const footer = el('g', {
      class: 'ev-section-footer', 'data-footer-x': x, 'data-footer-y': footerTop,
      'data-footer-width': width, 'data-footer-height': CFG.sectionFooterHeight
    });
    footer.appendChild(el('text', { x: x + 12, y: footerTop + CFG.sectionFooterHeight - 10, class: 'ev-footer-mark' }, 'BOUNDARY'));
    g.appendChild(footer);

    const clipId = `ev-${safeId(record.moduleId)}-section-${index}`;
    const bodyClipHeight = Math.max(1, footerTop - (y + CFG.sectionBodyTop) - CFG.sectionBottomPad);
    addClip(defs, clipId, x + 8, y + CFG.sectionBodyTop, width - 16, bodyClipHeight);

    const pages = pageSlices(data);
    const pageGroups = [];
    const maxChars = maxCharsFor(width - 24);
    pages.forEach((page, pageIndex) => {
      const content = el('g', { 'clip-path': `url(#${clipId})`, 'data-section-page': pageIndex });
      let cursorY = y + 44;
      if (!page.length) {
        content.appendChild(el('text', { x: x + 12, y: cursorY, class: 'ev-row-muted' }, '—'));
      } else {
        page.forEach((row, localIndex) => {
          const globalIndex = pageIndex * CFG.maxRows + localIndex;
          const lines = wrapLines(row.text, maxChars);
          content.appendChild(wrappedText({
            x: x + 12, y: cursorY, class: row.muted ? 'ev-row-muted' : 'ev-row',
            'data-row-index': globalIndex, 'data-wrap-max': maxChars
          }, row.text, maxChars));
          cursorY += lines.length * CFG.lineHeight;
          if (localIndex < page.length - 1) cursorY += CFG.rowGap;
        });
      }
      content.style.display = pageIndex === 0 ? '' : 'none';
      pageGroups.push(content);
      g.appendChild(content);
    });

    let pager = null;
    let pagerLabel = null;
    if (pages.length > 1) {
      const bw = 86, bx = x + width - bw - 10, by = footerTop + 10;
      pager = el('g', { class: 'ev-section-more', role: 'button', tabindex: '0', 'aria-label': `${title} more rows` });
      pager.appendChild(el('rect', { x: bx, y: by, width: bw, height: 28, rx: 14, class: 'ev-more-bg' }));
      pagerLabel = el('text', { x: bx + bw / 2, y: by + 18, 'text-anchor': 'middle', class: 'ev-more-label' }, `MORE 1/${pages.length} ↓`);
      pager.appendChild(pagerLabel);
      const fire = () => cycleSectionPage(record.moduleId, index);
      pager.addEventListener('click', fire);
      pager.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fire(); } });
      footer.appendChild(pager);
    }
    record.sectionNodes[index] = { pages: pageGroups, pager, pagerLabel, pageCount: pages.length };
    return g;
  }

  function updateSectionPageVisual(record, index) {
    const node = record.sectionNodes[index];
    if (!node) return;
    const page = Math.max(0, Math.min(record.sectionPage[index] || 0, node.pageCount - 1));
    record.sectionPage[index] = page;
    node.pages.forEach((group, i) => { group.style.display = i === page ? '' : 'none'; });
    if (node.pagerLabel) node.pagerLabel.textContent = page === node.pageCount - 1
      ? `LESS ${page + 1}/${node.pageCount} ↑` : `MORE ${page + 1}/${node.pageCount} ↓`;
  }

  function cycleSectionPage(moduleId, index) {
    ensureReady();
    const record = S.mounted.get(moduleId);
    if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    const node = record.sectionNodes[index];
    if (!node || node.pageCount <= 1) return getState(moduleId);
    const current = record.sectionPage[index] || 0;
    record.sectionPage[index] = current >= node.pageCount - 1 ? 0 : current + 1;
    updateSectionPageVisual(record, index);
    window.dispatchEvent(new CustomEvent('i13-section-page', { detail: { moduleId, sectionIndex: index, page: record.sectionPage[index], pages: node.pageCount } }));
    return getState(moduleId);
  }

  function renderMachine(record, defs, panel, x, y, width) {
    const spec = record.spec;
    if (!spec.hasMachine) return;
    const height = record.machineExpanded ? spec.machineExpandedHeight : CFG.machineCollapsedHeight;
    const rect = el('rect', { x, y, width, height, rx: 8, class: 'ev-machine' });
    panel.appendChild(rect);
    panel.appendChild(el('text', { x: x + 12, y: y + 21, class: 'ev-section-title' }, 'MACHINE / RUNTIME'));

    const toggleWidth = 102, tx = x + width - toggleWidth - 10;
    const toggle = el('g', { class: 'ev-machine-toggle', role: 'button', tabindex: '0', 'aria-expanded': String(record.machineExpanded) });
    toggle.appendChild(el('rect', { x: tx, y: y + 9, width: toggleWidth, height: 28, rx: 14, class: 'ev-machine-toggle-bg' }));
    toggle.appendChild(el('text', { x: tx + toggleWidth / 2, y: y + 28, 'text-anchor': 'middle', class: 'ev-machine-toggle-label' }, record.machineExpanded ? 'MACHINE −' : 'MACHINE +'));
    const fire = () => toggleMachine(record.moduleId);
    toggle.addEventListener('click', fire);
    toggle.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fire(); } });
    panel.appendChild(toggle);

    const footerTop = y + spec.machineExpandedHeight - CFG.machineFooterHeight;
    const footerLine = el('line', { x1: x + 8, x2: x + width - 8, y1: footerTop, y2: footerTop, class: 'ev-machine-footer-line', 'data-machine-content': 'true' });
    panel.appendChild(footerLine);
    const clipId = `ev-${safeId(record.moduleId)}-machine`;
    addClip(defs, clipId, x + 8, y + 42, width - 16, Math.max(1, footerTop - (y + 42) - 8));

    const machineMaxChars = maxCharsFor(width - 24);
    const pages = pageSlices(spec.machine);
    const pageGroups = [];
    const contentNodes = [footerLine];
    pages.forEach((page, pageIndex) => {
      const pageGroup = el('g', { 'clip-path': `url(#${clipId})`, 'data-machine-content': 'true', 'data-machine-page': pageIndex });
      let cursorY = y + 55;
      page.forEach((row, localIndex) => {
        const globalIndex = pageIndex * CFG.maxRows + localIndex;
        const lines = wrapLines(row.text, machineMaxChars);
        pageGroup.appendChild(wrappedText({ x: x + 12, y: cursorY, class: row.muted ? 'ev-row-muted' : 'ev-row', 'data-row-index': globalIndex, 'data-wrap-max': machineMaxChars }, row.text, machineMaxChars));
        cursorY += lines.length * CFG.lineHeight;
        if (localIndex < page.length - 1) cursorY += CFG.rowGap;
      });
      pageGroups.push(pageGroup); contentNodes.push(pageGroup); panel.appendChild(pageGroup);
    });

    let machinePager = null, machinePagerLabel = null;
    if (pages.length > 1) {
      const bw = 96, bx = x + width - bw - 10, by = footerTop + 3;
      machinePager = el('g', { class: 'ev-machine-more', role: 'button', tabindex: '0', 'data-machine-content': 'true', 'aria-label': 'machine runtime more rows' });
      machinePager.appendChild(el('rect', { x: bx, y: by, width: bw, height: 27, rx: 13.5, class: 'ev-more-bg' }));
      machinePagerLabel = el('text', { x: bx + bw / 2, y: by + 18, 'text-anchor': 'middle', class: 'ev-more-label' }, `MORE 1/${pages.length} ↓`);
      machinePager.appendChild(machinePagerLabel);
      const pageFire = () => cycleMachinePage(record.moduleId);
      machinePager.addEventListener('click', pageFire);
      machinePager.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pageFire(); } });
      panel.appendChild(machinePager); contentNodes.push(machinePager);
    }

    let cx = tx - 8;
    [...spec.controls].reverse().forEach(control => {
      const bw = Math.max(84, Math.min(150, 28 + control.label.length * 7));
      cx -= bw;
      const g = el('g', { 'data-control': control.id, 'data-machine-content': 'true' });
      g.appendChild(el('rect', { x: cx, y: y + 8, width: bw, height: 30, rx: 6, class: 'ev-control' }));
      g.appendChild(el('text', { x: cx + bw / 2, y: y + 28, 'text-anchor': 'middle', class: 'ev-control-text' }, control.label));
      if (control.onClick) g.addEventListener('click', event => control.onClick({ event, moduleId: record.moduleId }));
      panel.appendChild(g); contentNodes.push(g); cx -= 8;
    });

    record.machineRect = rect; record.machineToggle = toggle; record.machineContent = contentNodes;
    record.machinePages = pageGroups; record.machinePager = machinePager; record.machinePagerLabel = machinePagerLabel;
    updateMachineVisual(record);
  }

  function cycleMachinePage(moduleId) {
    ensureReady();
    const record = S.mounted.get(moduleId);
    if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    const count = record.machinePages.length;
    if (count <= 1) return getState(moduleId);
    record.machinePage = record.machinePage >= count - 1 ? 0 : record.machinePage + 1;
    updateMachineVisual(record);
    window.dispatchEvent(new CustomEvent('i13-machine-page', { detail: { moduleId, page: record.machinePage, pages: count } }));
    return getState(moduleId);
  }

  function renderPanel(record) {
    const { spec, baseY } = record;
    const x = CFG.panelX, y = baseY + 102, w = CFG.panelWidth, h = panelHeight(record);
    const panel = el('g', { class: 'i13-exploded-panel', 'data-exploded-for': record.moduleId, 'data-family': spec.family, 'data-layout-version': '13.1' });
    const defs = el('defs'); panel.appendChild(defs);
    const shell = el('rect', { x, y, width: w, height: h, rx: 11, class: 'ev-shell' });
    panel.appendChild(shell);
    panel.appendChild(el('rect', { x: x + 2, y: y + 2, width: w - 4, height: h - 4, rx: 10, class: 'ev-shell-sheen' }));
    panel.appendChild(el('rect', { x: x + 1, y: y + 1, width: w - 2, height: CFG.headerHeight, rx: 10, class: 'ev-header' }));

    const titleClip = `ev-${safeId(record.moduleId)}-title`, subtitleClip = `ev-${safeId(record.moduleId)}-subtitle`;
    addClip(defs, titleClip, x + 16, y + 5, 520, 32); addClip(defs, subtitleClip, x + 540, y + 5, w - 558, 32);
    panel.appendChild(el('text', { x: x + 18, y: y + 25, class: 'ev-title', 'clip-path': `url(#${titleClip})` }, spec.title));
    panel.appendChild(el('text', { x: x + w - 18, y: y + 25, 'text-anchor': 'end', class: 'ev-subtitle', 'clip-path': `url(#${subtitleClip})` }, spec.subtitle));

    const pad = CFG.pad, gap = CFG.gap, contentY = y + CFG.contentTop, inner = w - pad * 2;
    const cw = (inner - gap * 3) / 4;
    const defsList = [['INPUT', spec.input], ['PIPELINE', spec.pipeline], ['STATE', spec.state], ['OUTPUT', spec.output]];
    defsList.forEach(([title, data], index) => {
      const sx = x + pad + index * (cw + gap);
      panel.appendChild(section(record, defs, title, data, index, sx, contentY, cw, spec.topHeight));
      if (index < 3) panel.appendChild(el('line', { x1: sx + cw + 3, y1: contentY + spec.topHeight / 2, x2: sx + cw + gap - 3, y2: contentY + spec.topHeight / 2, class: 'ev-flow' }));
    });

    const lowerY = contentY + spec.topHeight + 12;
    renderMachine(record, defs, panel, x + pad, lowerY, inner);
    record.panel = panel; record.shell = shell; record.machineY = lowerY;
    record.group.appendChild(panel); panel.style.display = record.expanded ? '' : 'none';
  }

  function renderToggle(record) {
    const x = CFG.panelX + CFG.panelWidth - 96, y = record.baseY + 50;
    const g = el('g', { class: 'i13-exploded-toggle', role: 'button', tabindex: '0', 'aria-expanded': String(record.expanded) });
    g.appendChild(el('rect', { x, y, width: 76, height: 26, rx: 13, class: 'ev-bg' }));
    g.appendChild(el('text', { x: x + 38, y: y + 18, 'text-anchor': 'middle', class: 'ev-label' }, record.expanded ? 'CLOSE' : 'EXPLODE'));
    const fire = () => toggle(record.moduleId);
    g.addEventListener('click', fire);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
    record.toggle = g; record.group.appendChild(g);
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
    if (record.machineExpanded) {
      record.machinePages.forEach((group, index) => { group.style.display = index === record.machinePage ? '' : 'none'; });
      if (record.machinePagerLabel && record.machinePages.length > 1) record.machinePagerLabel.textContent = record.machinePage === record.machinePages.length - 1
        ? `LESS ${record.machinePage + 1}/${record.machinePages.length} ↑` : `MORE ${record.machinePage + 1}/${record.machinePages.length} ↓`;
    }
    record.shell?.setAttribute('height', String(panelHeight(record)));
    record.panel?.querySelector('.ev-shell-sheen')?.setAttribute('height', String(Math.max(1, panelHeight(record) - 4)));
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
      moduleId, group, baseY: Number(rect.getAttribute('y')) || 0, spec: normalized,
      expanded: normalized.expanded, machineExpanded: normalized.machineExpanded,
      sectionPage: [0, 0, 0, 0], sectionNodes: [null, null, null, null],
      machinePage: 0, machinePages: [], panel: null, shell: null, toggle: null,
      machineRect: null, machineToggle: null, machineContent: [], machinePager: null, machinePagerLabel: null
    };
    S.mounted.set(moduleId, record); renderPanel(record); renderToggle(record); reflow(); return getState(moduleId);
  }

  function unmount(moduleId) {
    ensureReady();
    const record = S.mounted.get(moduleId); if (!record) return false;
    record.panel?.remove(); record.toggle?.remove(); S.mounted.delete(moduleId); reflow(); return true;
  }

  function setExpanded(moduleId, expanded) {
    ensureReady();
    const record = S.mounted.get(moduleId); if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    record.expanded = !!expanded; record.panel.style.display = record.expanded ? '' : 'none'; setToggle(record); reflow(); return getState(moduleId);
  }

  function toggle(moduleId) {
    const record = S.mounted.get(moduleId); if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    return setExpanded(moduleId, !record.expanded);
  }

  function setMachineExpanded(moduleId, expanded) {
    ensureReady();
    const record = S.mounted.get(moduleId); if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    if (!record.spec.hasMachine) return getState(moduleId);
    record.machineExpanded = !!expanded; updateMachineVisual(record); reflow();
    window.dispatchEvent(new CustomEvent('i13-machine-toggle', { detail: { moduleId, machineExpanded: record.machineExpanded } }));
    return getState(moduleId);
  }

  function toggleMachine(moduleId) {
    const record = S.mounted.get(moduleId); if (!record) throw new Error(`Exploded view not mounted for ${moduleId}`);
    return setMachineExpanded(moduleId, !record.machineExpanded);
  }

  function getState(moduleId) {
    const record = S.mounted.get(moduleId);
    return record ? Object.freeze({
      moduleId, expanded: record.expanded, machineExpanded: record.machineExpanded,
      height: panelHeight(record), family: record.spec.family, title: record.spec.title,
      sectionPage: Object.freeze([...record.sectionPage]),
      sectionPages: Object.freeze(record.sectionNodes.map(node => node?.pageCount || 1)),
      machinePage: record.machinePage, machinePages: record.machinePages.length || 1,
      layout: '13.1-glass-boundary'
    }) : null;
  }

  function selfTest() {
    const checks = [];
    const check = (name, fn) => { try { checks.push({ name, pass: !!fn() }); } catch (e) { checks.push({ name, pass: false, error: e.message }); } };
    check('row normalization', () => rows('x')[0].text === 'x');
    check('object row normalization', () => rows({ text: 'y', muted: true })[0].muted === true);
    check('blank module id rejected', () => { try { normalize('', {}); return false; } catch { return true; } });
    check('long text wraps', () => wrapLines('deterministic canonical form that must remain bounded', 18).length > 1);
    check('eight rows page into two fixed-height pages', () => pageSlices(rows(['1','2','3','4','5','6','7','8'])).length === 2);
    check('footer rail is reserved', () => CFG.sectionFooterHeight === 56);
    check('machine defaults collapsed', () => normalize('x', { machine: ['row'] }).machineExpanded === false);
    check('minimum panel height', () => { const spec = normalize('x', {}); return panelHeight({ spec, machineExpanded: false }) >= CFG.minHeight; });
    check('mount registry is a Map', () => S.mounted instanceof Map);
    return Object.freeze({ pass: checks.every(c => c.pass), checks });
  }

  function initialize() {
    const doc = S.object?.contentDocument;
    if (!doc?.documentElement) return;
    S.doc = doc; S.svg = doc.documentElement; S.layer = doc.getElementById(CFG.moduleLayerId); S.lab = doc.getElementById(CFG.labId);
    if (!S.layer) return;
    S.baseSvgHeight = Number(S.svg.getAttribute('height')) || 2940;
    const vb = (S.svg.getAttribute('viewBox') || '0 0 1280 2940').trim().split(/\s+/).map(Number);
    if (vb.length === 4 && vb.every(Number.isFinite)) S.baseViewBox = vb;
    S.baseLabTransform = S.lab?.getAttribute('transform') || 'translate(0,2350)';
    ensureGlassDefs(); injectStyle(); S.ready = true;
    window.dispatchEvent(new CustomEvent('i13-exploded-ready', { detail: selfTest() }));
  }

  function attach() {
    S.object = document.getElementById(CFG.objectId); if (!S.object) return;
    S.object.addEventListener('load', initialize); if (S.object.contentDocument?.documentElement) initialize();
  }

  window.I13Exploded = Object.freeze({
    version: '0.3.1', mount, unmount,
    expand: id => setExpanded(id, true), collapse: id => setExpanded(id, false), toggle,
    expandMachine: id => setMachineExpanded(id, true), collapseMachine: id => setMachineExpanded(id, false), toggleMachine,
    cycleSectionPage, cycleMachinePage, getState, selfTest,
    isReady: () => S.ready, mountedCount: () => S.mounted.size
  });

  attach();
})();
