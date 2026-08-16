/* I13 H1.1 — Stage 6: preserve OLOGY as the live/current destination.
 *
 * This layer is intentionally observational. It does not replace the existing
 * OLOGY / voxel / CV runtime in docs/i13.svg. It adds:
 *   - LIVE LAB jump control on the OLOGY trunk row
 *   - CURRENT/LIVE badge in the existing lab
 *   - bounded status strip mirroring existing runtime text
 *
 * Existing SVG action handlers remain the source of truth.
 */
(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const OBJECT_ID = 'i13';
  const MODULE_ID = 'ology';
  const LAB_ID = 'lab';

  const S = {
    object: null,
    doc: null,
    svg: null,
    row: null,
    lab: null,
    observer: null,
    actionCount: 0,
    ready: false
  };

  const STYLE = `
#module-layer [data-module="ology"].ology-live-current .box{
  stroke:var(--live,#16a34a);
  stroke-width:2.6;
}
.ology-live-jump{cursor:pointer}
.ology-live-jump .ology-live-jump-bg{
  fill:var(--live-bg,#f0fdf4);
  stroke:var(--live,#16a34a);
  stroke-width:1.25;
}
.ology-live-jump:hover .ology-live-jump-bg{fill:#dcfce7;stroke-width:1.8}
.ology-live-jump .ology-live-jump-text{
  fill:var(--live,#16a34a);
  font-size:11px;
  font-weight:800;
  letter-spacing:.06em;
  pointer-events:none;
}
.ology-live-pulse{fill:var(--live,#16a34a);transform-box:fill-box;transform-origin:center;animation:ologyPulse 1.65s ease-in-out infinite}
@keyframes ologyPulse{0%,100%{opacity:.38;transform:scale(.78)}50%{opacity:1;transform:scale(1)}}
#stage6-ology-badge .ology-live-badge-bg{fill:var(--live-bg,#f0fdf4);stroke:var(--live,#16a34a);stroke-width:1.2}
#stage6-ology-badge text{fill:var(--live,#16a34a);font-size:11px;font-weight:800;letter-spacing:.06em}
#stage6-ology-status .ology-status-shell{fill:#fff;stroke:var(--line,#94a3b8);stroke-width:1}
#stage6-ology-status .ology-status-sep{stroke:var(--line,#94a3b8);stroke-width:1}
#stage6-ology-status .ology-status-key{fill:var(--muted,#64748b);font-size:10px;font-weight:800;letter-spacing:.05em}
#stage6-ology-status .ology-status-value{fill:var(--ink,#18212b);font-size:11px}
#stage6-ology-status .ology-status-value[data-state="pass"]{fill:var(--pass,#16a34a);font-weight:800}
#stage6-ology-status .ology-status-value[data-state="veto"]{fill:var(--veto,#dc2626);font-weight:800}
#stage6-ology-status .ology-status-value[data-state="running"]{fill:var(--running,#d97706);font-weight:800}
`;

  function el(name, attrs = {}, text = '') {
    const node = S.doc.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text !== '') node.textContent = String(text);
    return node;
  }

  function compact(value, max = 27) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!text) return '—';
    return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1))}…`;
  }

  function text(id) {
    return S.doc?.getElementById(id)?.textContent?.trim() || '';
  }

  function injectStyle() {
    let style = S.doc.getElementById('stage6-ology-style');
    if (!style) {
      style = el('style', { id: 'stage6-ology-style' });
      S.svg.appendChild(style);
    }
    style.textContent = STYLE;
  }

  function jumpToLab() {
    if (!S.object || !S.lab) return false;
    const objectRect = S.object.getBoundingClientRect();
    const viewBox = S.svg.viewBox?.baseVal;
    const logicalWidth = viewBox?.width || 1280;
    const scale = S.object.clientWidth > 0 ? S.object.clientWidth / logicalWidth : 1;
    const matrix = S.lab.getCTM?.();
    const labY = matrix?.f ?? 2350;
    const target = window.scrollY + objectRect.top + labY * scale - 16;
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    return true;
  }

  function addJumpControl() {
    S.row.classList.add('ology-live-current');
    S.row.querySelector('.ology-live-jump')?.remove();

    const box = S.row.querySelector('rect.box');
    if (!box) return;
    const x = Number(box.getAttribute('x')) || 140;
    const y = Number(box.getAttribute('y')) || 0;
    const width = Number(box.getAttribute('width')) || 1070;

    const g = el('g', {
      class: 'ology-live-jump',
      role: 'button',
      tabindex: '0',
      'aria-label': 'Jump to current OLOGY live lab'
    });
    const bx = x + width - 112;
    const by = y + 50;
    g.appendChild(el('rect', { x: bx, y: by, width: 92, height: 26, rx: 13, class: 'ology-live-jump-bg' }));
    g.appendChild(el('circle', { cx: bx + 13, cy: by + 13, r: 4, class: 'ology-live-pulse' }));
    g.appendChild(el('text', { x: bx + 56, y: by + 18, 'text-anchor': 'middle', class: 'ology-live-jump-text' }, 'LIVE LAB'));
    const fire = () => jumpToLab();
    g.addEventListener('click', fire);
    g.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fire();
      }
    });
    S.row.appendChild(g);
  }

  function addLabBadge() {
    S.lab.querySelector('#stage6-ology-badge')?.remove();
    const g = el('g', { id: 'stage6-ology-badge', 'aria-label': 'OLOGY live current' });
    g.appendChild(el('rect', { x: 1046, y: 16, width: 164, height: 28, rx: 14, class: 'ology-live-badge-bg' }));
    g.appendChild(el('circle', { cx: 1062, cy: 30, r: 4, class: 'ology-live-pulse' }));
    g.appendChild(el('text', { x: 1128, y: 34, 'text-anchor': 'middle' }, 'LIVE · CURRENT'));
    S.lab.appendChild(g);
  }

  function addStatusStrip() {
    S.lab.querySelector('#stage6-ology-status')?.remove();
    const g = el('g', { id: 'stage6-ology-status', 'aria-label': 'Live OLOGY status mirror' });
    g.appendChild(el('rect', { x: 70, y: 654, width: 1140, height: 34, rx: 6, class: 'ology-status-shell' }));

    const fields = [
      { key: 'SURFACE', id: 'ology-status-surface', x: 86, valueX: 148, width: 252 },
      { key: 'DEPTH', id: 'ology-status-depth', x: 352, valueX: 397, width: 123 },
      { key: 'CV', id: 'ology-status-cv', x: 536, valueX: 560, width: 164 },
      { key: 'WASM', id: 'ology-status-wasm', x: 744, valueX: 785, width: 171 },
      { key: 'PY', id: 'ology-status-py', x: 978, valueX: 1000, width: 196 }
    ];

    fields.forEach((field, index) => {
      if (index > 0) g.appendChild(el('line', { x1: field.x - 14, y1: 661, x2: field.x - 14, y2: 681, class: 'ology-status-sep' }));
      g.appendChild(el('text', { x: field.x, y: 675, class: 'ology-status-key' }, field.key));
      const value = el('text', { id: field.id, x: field.valueX, y: 676, class: 'ology-status-value' }, '—');
      g.appendChild(value);
    });
    S.lab.appendChild(g);
  }

  function classify(value) {
    const s = String(value || '').toLowerCase();
    if (/\b(pass|true|enabled|authority on)\b/.test(s)) return 'pass';
    if (/\b(veto|fail|false|unavailable|authority off)\b/.test(s)) return 'veto';
    if (/\b(boot|load|run|wait|demand|pending)\b/.test(s)) return 'running';
    return 'neutral';
  }

  function setStatus(id, value, max) {
    const node = S.doc.getElementById(id);
    if (!node) return;
    node.textContent = compact(value, max);
    const state = classify(value);
    if (state === 'neutral') node.removeAttribute('data-state');
    else node.setAttribute('data-state', state);
  }

  function refresh() {
    if (!S.ready) return false;
    const surface = text('addr') || 'address';
    const depth = text('depth-label') || 'depth 0';
    const cv = text('cv-label') || 'cv: waiting';
    const wasm = text('runtime') || 'WASM: booting';
    const py = text('py-runtime') || 'PY: on demand';

    setStatus('ology-status-surface', surface, 29);
    setStatus('ology-status-depth', depth, 15);
    setStatus('ology-status-cv', cv, 21);
    setStatus('ology-status-wasm', wasm, 22);
    setStatus('ology-status-py', py, 25);
    return true;
  }

  function observeExistingRuntime() {
    S.observer?.disconnect();
    S.observer = new MutationObserver(() => refresh());
    for (const id of ['addr', 'ipv4', 'depth-label', 'cv-label', 'runtime', 'py-runtime', 'authority-text']) {
      const node = S.doc.getElementById(id);
      if (node) S.observer.observe(node, { childList: true, characterData: true, subtree: true });
    }

    S.lab.querySelectorAll('[data-act]').forEach(action => {
      action.addEventListener('click', () => {
        S.actionCount += 1;
        queueMicrotask(refresh);
        setTimeout(refresh, 30);
      });
    });
  }

  function selfTest() {
    const checks = [
      ['OLOGY row', !!S.row],
      ['existing lab', !!S.lab],
      ['existing Queen', !!S.doc?.getElementById('queen')],
      ['existing CV label', !!S.doc?.getElementById('cv-label')],
      ['existing Wasm status', !!S.doc?.getElementById('runtime')],
      ['existing Python status', !!S.doc?.getElementById('py-runtime')],
      ['jump control', !!S.row?.querySelector('.ology-live-jump')],
      ['status strip', !!S.lab?.querySelector('#stage6-ology-status')]
    ].map(([name, pass]) => ({ name, pass: !!pass }));
    return Object.freeze({ pass: checks.every(check => check.pass), checks, actionCount: S.actionCount });
  }

  function initialize() {
    const doc = S.object?.contentDocument;
    if (!doc?.documentElement) return;
    S.doc = doc;
    S.svg = doc.documentElement;
    S.row = doc.querySelector('#module-layer > g[data-module="ology"]');
    S.lab = doc.getElementById(LAB_ID);
    if (!S.row || !S.lab) return;

    injectStyle();
    addJumpControl();
    addLabBadge();
    addStatusStrip();
    S.ready = true;
    observeExistingRuntime();
    refresh();

    window.dispatchEvent(new CustomEvent('i13-ology-live-ready', { detail: selfTest() }));
  }

  function attach() {
    S.object = document.getElementById(OBJECT_ID);
    if (!S.object) return;
    S.object.addEventListener('load', initialize);
    if (S.object.contentDocument?.documentElement) initialize();
  }

  window.I13OlogyLive = Object.freeze({
    version: '0.1.0',
    refresh,
    jump: jumpToLab,
    selfTest,
    isReady: () => S.ready
  });

  attach();
})();
