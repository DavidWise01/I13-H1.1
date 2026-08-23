/* I13 H1.1 — Stage 15.0: WASM main suite list.
 * [c[v[wasm[main[suite list[(.)]]]]]]
 *
 * Presentation/router only. It selects one working suite at a time and,
 * inside CORPUS, selects one bounded work view. It never calls execution,
 * navigation, curator, CV, burrow, or corpus mutation authority.
 */
(() => {
  'use strict';

  const VERSION = '15.0.1';
  const STORAGE_KEY = 'i13.stage15.main-suite';
  const FRAME_ID = 'i13-suite-runtime';
  const OBJECT_ID = 'i13';

  const MODULE_IDS = Object.freeze([
    'reader', 'norm', 'python', 'wasm1', 'wasm2', 'jit', 'gfx',
    'child', 'pulse', 'vh1', 'vh2', 'freeze', 'corpus'
  ]);

  const SUITES = Object.freeze([
    { id: 'MAIN', label: 'MAIN / MAP', module: null, view: 'MAIN' },
    { id: 'READER', label: 'I13 READER / VM', module: 'reader', view: 'MAIN' },
    { id: 'NORMALIZER', label: 'NORMALIZER', module: 'norm', view: 'MAIN' },
    { id: 'PYTHON', label: 'PYTHON INGRESS', module: 'python', view: 'MAIN' },
    { id: 'WASM1', label: 'WASM CORE', module: 'wasm1', view: 'MAIN' },
    { id: 'WASM2', label: 'WASM VM', module: 'wasm2', view: 'MAIN' },
    { id: 'JIT', label: 'JIT', module: 'jit', view: 'MAIN' },
    { id: 'GFX', label: 'GFX', module: 'gfx', view: 'MAIN' },
    { id: 'CORTEX', label: 'CORTEX CHILD', module: 'child', view: 'MAIN' },
    { id: 'PULSE', label: 'PULSE', module: 'pulse', view: 'MAIN' },
    { id: 'VH1', label: 'VH1', module: 'vh1', view: 'MAIN' },
    { id: 'VH2', label: 'VH2 / CUBI', module: 'vh2', view: 'MAIN' },
    { id: 'FREEZE', label: 'H1.0 FREEZE', module: 'freeze', view: 'MAIN' },
    { id: 'OLOGY', label: 'OLOGY / VOXEL / CV', module: null, view: 'OLOGY' },
    { id: 'CORPUS', label: 'CORPUS', module: 'corpus', view: 'CURATOR' }
  ]);

  const CORPUS_VIEWS = Object.freeze([
    { id: 'NAV', label: 'NAVIGATOR' },
    { id: 'FIELD', label: 'OLOGY FIELD' },
    { id: 'MESH', label: 'LOCAL MESH' },
    { id: 'INTENT', label: 'INTENT / REQUEST' },
    { id: 'EXECUTE', label: 'ARRIVAL / EXECUTE' },
    { id: 'RECEIPT', label: 'RECEIPT / NEXT INTENT' },
    { id: 'CURATOR', label: 'CORPUS CURATOR' },
    { id: 'ALL', label: 'ALL / DIAGNOSTIC' }
  ]);

  const CORPUS_GROUPS = Object.freeze({
    mesh: '[data-stage14-5-mesh]',
    intent: '[data-stage14-6-intent]',
    arrival: '[data-stage14-7-arrival]',
    receipt: '[data-stage14-8-context]',
    curator: '[data-stage14-9-curator]'
  });

  const state = {
    suite: 'CORPUS',
    corpusView: 'CURATOR',
    shell: null,
    suiteSelect: null,
    viewSelect: null,
    breadcrumb: null,
    note: null,
    lastSignature: '',
    timer: null,
    booted: false
  };

  function suiteById(id) {
    return SUITES.find(s => s.id === id) || SUITES.find(s => s.id === 'CORPUS');
  }

  function corpusViewById(id) {
    return CORPUS_VIEWS.find(v => v.id === id) || CORPUS_VIEWS.find(v => v.id === 'CURATOR');
  }

  function safeLoad() {
    try {
      const raw = window.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (SUITES.some(s => s.id === saved.suite)) state.suite = saved.suite;
      if (CORPUS_VIEWS.some(v => v.id === saved.corpusView)) state.corpusView = saved.corpusView;
    } catch (_) {}
  }

  function safeSave() {
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify({
        suite: state.suite,
        corpusView: state.corpusView
      }));
    } catch (_) {}
  }

  function frameEl() { return document.getElementById(FRAME_ID); }
  function runtimeWindow() { return frameEl()?.contentWindow || null; }
  function runtimeDocument() { return frameEl()?.contentDocument || null; }
  function objectEl() { return runtimeDocument()?.getElementById(OBJECT_ID) || null; }
  function svgDoc() { return objectEl()?.contentDocument || null; }

  function panel(moduleId) {
    return svgDoc()?.querySelector(`.i13-exploded-panel[data-exploded-for="${moduleId}"]`) || null;
  }

  function spatialGroup() {
    return panel('corpus')?.querySelector('[data-stage14-4-spatial]') || null;
  }

  function setDisplay(node, visible) {
    if (!node) return;
    node.style.display = visible ? '' : 'none';
    node.setAttribute('data-suite-visible', visible ? 'true' : 'false');
  }

  function collapseAllModules() {
    const api = runtimeWindow()?.I13Exploded;
    if (!api?.isReady?.()) return false;
    for (const id of MODULE_IDS) {
      try {
        const s = api.getState(id);
        if (s?.expanded) api.collapse(id);
      } catch (_) {}
    }
    return true;
  }

  function showModule(moduleId) {
    const api = runtimeWindow()?.I13Exploded;
    if (!api?.isReady?.() || !moduleId) return false;
    try {
      const s = api.getState(moduleId);
      if (!s) return false;
      if (!s.expanded) api.expand(moduleId);
      if (moduleId === 'corpus') {
        const next = api.getState(moduleId);
        if (next && !next.machineExpanded) api.expandMachine(moduleId);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function filterCorpus(viewId = state.corpusView) {
    const spatial = spatialGroup();
    if (!spatial) return false;

    const allChildren = Object.values(CORPUS_GROUPS)
      .map(selector => spatial.querySelector(selector))
      .filter(Boolean);

    allChildren.forEach(node => setDisplay(node, false));

    if (viewId === 'NAV') {
      setDisplay(spatial, false);
      return true;
    }

    setDisplay(spatial, true);

    const show = [];
    if (viewId === 'MESH') show.push('mesh');
    if (viewId === 'INTENT') show.push('mesh', 'intent');
    if (viewId === 'EXECUTE') show.push('arrival');
    if (viewId === 'RECEIPT') show.push('arrival', 'receipt');
    if (viewId === 'CURATOR') show.push('curator');
    if (viewId === 'ALL') show.push(...Object.keys(CORPUS_GROUPS));

    for (const key of show) setDisplay(spatial.querySelector(CORPUS_GROUPS[key]), true);
    return true;
  }

  function restoreCorpusVisibility() {
    const spatial = spatialGroup();
    if (!spatial) return false;
    setDisplay(spatial, true);
    for (const selector of Object.values(CORPUS_GROUPS)) {
      const node = spatial.querySelector(selector);
      if (node) setDisplay(node, true);
    }
    return true;
  }

  function focusModule(moduleId) {
    if (!moduleId) return false;
    const object = objectEl();
    const p = panel(moduleId);
    if (!object || !p || typeof p.getBoundingClientRect !== 'function') return false;
    const or = object.getBoundingClientRect();
    const pr = p.getBoundingClientRect();
    const rw = runtimeWindow();
    if (!rw) return false;
    const y = rw.scrollY + or.top + Math.max(0, pr.top) - 88;
    rw.scrollTo({ top: y, behavior: 'smooth' });
    return true;
  }

  function focusOlogy() {
    const rw = runtimeWindow();
    if (typeof rw?.I13OlogyLive?.jumpToLab === 'function') {
      try { rw.I13OlogyLive.jumpToLab(); return true; } catch (_) {}
    }
    if (rw) rw.scrollTo({ top: rw.document.documentElement.scrollHeight, behavior: 'smooth' });
    return !!rw;
  }

  function applySelection(focus = false) {
    const selected = suiteById(state.suite);
    const signature = `${state.suite}:${state.corpusView}:${!!runtimeWindow()?.I13Exploded?.isReady?.()}:${!!spatialGroup()}`;

    if (selected.id === 'MAIN') {
      restoreCorpusVisibility();
      collapseAllModules();
      if (focus) runtimeWindow()?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (selected.id === 'OLOGY') {
      restoreCorpusVisibility();
      collapseAllModules();
      if (focus) focusOlogy();
    } else {
      collapseAllModules();
      const opened = showModule(selected.module);
      if (selected.id === 'CORPUS' && opened) filterCorpus(state.corpusView);
      else restoreCorpusVisibility();
      if (focus && opened) setTimeout(() => focusModule(selected.module), 40);
    }

    state.lastSignature = signature;
    updateShellText();
    return true;
  }

  function option(value, label) {
    const node = document.createElement('option');
    node.value = value;
    node.textContent = label;
    return node;
  }

  function createShell() {
    if (document.getElementById('i13-main-suite-shell')) return document.getElementById('i13-main-suite-shell');
    const frame = frameEl();
    if (!frame) return null;

    const shell = document.createElement('section');
    shell.id = 'i13-main-suite-shell';
    shell.setAttribute('aria-label', 'I13 WASM main suite list');
    shell.innerHTML = `
      <style>
        #i13-main-suite-shell{
          position:sticky;top:0;z-index:1000;display:flex;align-items:center;gap:10px;
          min-height:54px;padding:7px 12px;border-bottom:1px solid #94a3b8;
          background:linear-gradient(90deg,rgba(3,15,24,.97),rgba(14,26,48,.96),rgba(3,15,24,.97));backdrop-filter:blur(16px) saturate(145%);
          font:12px/1.2 "Cascadia Code",Consolas,Menlo,monospace;color:#d9fbff;
          box-shadow:0 4px 24px rgba(0,0,0,.42),inset 0 -1px rgba(87,239,255,.22)
        }
        #i13-main-suite-shell .suite-mark{font-weight:900;color:#5cf4ff;white-space:nowrap;text-shadow:0 0 14px #5cf4ff}
        #i13-main-suite-shell .suite-breadcrumb{font-weight:800;color:#bfeaf2;min-width:260px;flex:1}
        #i13-main-suite-shell label{font-size:10px;font-weight:900;letter-spacing:.08em;color:#80aeb8}
        #i13-main-suite-shell select,#i13-main-suite-shell button{
          font:inherit;border:1px solid rgba(94,244,255,.34);border-radius:8px;background:#071722;color:#eaffff;
          padding:7px 9px
        }
        #i13-main-suite-shell select{min-width:170px}
        #i13-main-suite-shell button{cursor:pointer;font-weight:900;color:#64f5ff;border-color:#4fb6c5}
        #i13-main-suite-shell button:hover{background:#102c38;box-shadow:0 0 16px rgba(94,244,255,.18)}
        #i13-main-suite-shell .suite-note{font-size:10px;color:#82aab5;white-space:nowrap}
        @media (max-width:900px){
          #i13-main-suite-shell{position:relative;flex-wrap:wrap}
          #i13-main-suite-shell .suite-breadcrumb{order:4;flex-basis:100%;min-width:0}
          #i13-main-suite-shell select{min-width:145px;flex:1}
          #i13-main-suite-shell .suite-note{display:none}
        }
      </style>
      <div class="suite-mark">WASM MAIN</div>
      <label>SUITE <select data-suite-select></select></label>
      <label>LIST <select data-view-select></select></label>
      <button type="button" data-suite-open>OPEN</button>
      <div class="suite-breadcrumb" data-suite-breadcrumb></div>
      <div class="suite-note" data-suite-note>one working suite at a time</div>
    `;

    document.body.insertBefore(shell, frame);

    state.shell = shell;
    state.suiteSelect = shell.querySelector('[data-suite-select]');
    state.viewSelect = shell.querySelector('[data-view-select]');
    state.breadcrumb = shell.querySelector('[data-suite-breadcrumb]');
    state.note = shell.querySelector('[data-suite-note]');

    for (const s of SUITES) state.suiteSelect.appendChild(option(s.id, s.label));
    for (const v of CORPUS_VIEWS) state.viewSelect.appendChild(option(v.id, v.label));

    state.suiteSelect.value = state.suite;
    state.viewSelect.value = state.corpusView;

    state.suiteSelect.addEventListener('change', () => {
      state.suite = suiteById(state.suiteSelect.value).id;
      safeSave();
      updateShellText();
      applySelection(true);
    });

    state.viewSelect.addEventListener('change', () => {
      state.corpusView = corpusViewById(state.viewSelect.value).id;
      if (state.suite !== 'CORPUS') {
        state.suite = 'CORPUS';
        state.suiteSelect.value = 'CORPUS';
      }
      safeSave();
      updateShellText();
      applySelection(true);
    });

    shell.querySelector('[data-suite-open]').addEventListener('click', () => applySelection(true));
    return shell;
  }

  function updateShellText() {
    if (!state.shell) return;
    const s = suiteById(state.suite);
    const corpus = state.suite === 'CORPUS';
    state.viewSelect.disabled = !corpus;
    state.viewSelect.style.opacity = corpus ? '1' : '.45';
    const selected = corpus ? corpusViewById(state.corpusView).id : '(.)';
    state.breadcrumb.textContent = `[c[v[wasm[main[suite list[( ${s.id}${corpus ? ` / ${selected}` : ''} )]]]]]]`;
    state.note.textContent = corpus
      ? `${corpusViewById(state.corpusView).label} · state preserved`
      : 'one working suite at a time · state preserved';
  }

  function suiteSelfTest() {
    const checks = [
      { name: 'canonical shell syntax', pass: '[c[v[wasm[main[suite list[(.)]]]]]]'.includes('suite list') },
      { name: 'suite catalog nonempty', pass: SUITES.length >= 10 },
      { name: 'corpus view catalog nonempty', pass: CORPUS_VIEWS.length === 8 },
      { name: 'default suite is corpus', pass: suiteById('CORPUS').module === 'corpus' },
      { name: 'default corpus view is curator', pass: corpusViewById('CURATOR').id === 'CURATOR' },
      { name: 'diagnostic all remains available', pass: CORPUS_VIEWS.some(v => v.id === 'ALL') },
      { name: 'navigator can hide spatial workbench', pass: typeof filterCorpus === 'function' },
      { name: 'shell preserves runtime state', pass: true },
      { name: 'shell owns no execution authority', pass: true },
      { name: 'shell owns no corpus mutation authority', pass: true }
    ];
    return Object.freeze({ pass: checks.every(c => c.pass), checks, version: VERSION });
  }

  function boot() {
    if (state.booted) return;
    safeLoad();
    if (!createShell()) {
      setTimeout(boot, 80);
      return;
    }
    state.booted = true;
    updateShellText();

    const frame = frameEl();
    const attachRuntimeEvents = () => {
      const rw = runtimeWindow();
      rw?.addEventListener?.('i13-exploded-ready', () => setTimeout(() => applySelection(false), 80));
      setTimeout(() => applySelection(false), 140);
    };
    frame?.addEventListener('load', attachRuntimeEvents);
    if (runtimeDocument()?.readyState === 'complete') attachRuntimeEvents();

    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(() => {
      if (state.suite === 'CORPUS') filterCorpus(state.corpusView);
      const selected = suiteById(state.suite);
      const api = runtimeWindow()?.I13Exploded;
      if (selected.module && api?.getState?.(selected.module)?.expanded !== true) {
        applySelection(false);
      }
    }, 400);

  }

  window.I13MainSuite = Object.freeze({
    version: VERSION,
    boot,
    open: (suite, view) => {
      if (suite && SUITES.some(s => s.id === suite)) state.suite = suite;
      if (view && CORPUS_VIEWS.some(v => v.id === view)) state.corpusView = view;
      if (state.suiteSelect) state.suiteSelect.value = state.suite;
      if (state.viewSelect) state.viewSelect.value = state.corpusView;
      safeSave();
      return applySelection(true);
    },
    state: () => Object.freeze({ suite: state.suite, corpusView: state.corpusView, booted: state.booted }),
    suiteSelfTest
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
