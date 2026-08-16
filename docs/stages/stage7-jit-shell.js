/* I13 H1.1 — Stage 7: JIT shell v0.2 exploded view.
 *
 * The repo preserves the historical JIT shell v0.2 status as 7/7 PASS with a
 * capability-addressed execution shell, safe numeric execution and a
 * deterministic cache. The interactive program below is a Pages reference
 * trace over that architecture; it is not a rerun of the historical 7/7 suite.
 */
(() => {
  'use strict';

  const MODULE_ID = 'jit';
  const DEMO = Object.freeze({
    source: 'I out <- 4 + 2',
    capability: 'numeric',
    op: 'add',
    left: 4,
    right: 2
  });

  const cache = new Map();
  const runtime = {
    phase: 0,
    capabilityGranted: true,
    address: 0,
    cacheState: 'UNREAD',
    result: null,
    verdict: 'WAITING',
    receipt: 'ready'
  };

  const PHASES = Object.freeze([
    'REQUEST',
    'ADDRESS',
    'CAPABILITY',
    'CACHE',
    'DISPATCH',
    'COMMIT',
    'RETURN'
  ]);

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

  function controlLabel(id) {
    return panel()?.querySelector(`[data-control="${id}"] .ev-control-text`) || null;
  }

  function fnv1a32(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash >>> 0;
  }

  function addressHex() {
    return `0x${runtime.address.toString(16).padStart(8, '0')}`;
  }

  function cacheKey() {
    return `${DEMO.capability}|${DEMO.op}|${DEMO.left}|${DEMO.right}`;
  }

  function phaseName() {
    return runtime.phase >= PHASES.length ? 'DONE' : PHASES[runtime.phase];
  }

  function sync() {
    setSection(2, 0, `phase · ${phaseName()}`);
    setSection(2, 1, `execution address · ${runtime.address ? addressHex() : 'pending'}`);
    setSection(2, 2, `capability · ${runtime.capabilityGranted ? 'GRANTED' : 'DENIED'}`);
    setSection(2, 3, `cache · ${runtime.cacheState}`);

    setSection(3, 0, `result · ${runtime.result == null ? 'pending' : runtime.result}`);
    setSection(3, 1, `verdict · ${runtime.verdict}`);
    setSection(3, 2, `receipt · ${runtime.receipt}`);

    setMachine(0, 'REFERENCE  JIT shell v0.2 · 7/7 PASS recorded');
    setMachine(1, `PHASE      ${phaseName()} · cap ${runtime.capabilityGranted ? 'ON' : 'OFF'}`);
    setMachine(2, `ADDRESS    ${runtime.address ? addressHex() : 'pending'} · deterministic demo key`);
    setMachine(3, `CACHE      ${runtime.cacheState} · entries ${cache.size}`);
    setMachine(4, `DISPATCH   ${DEMO.op}(${DEMO.left}, ${DEMO.right}) · safe numeric demo`);
    setMachine(5, `VERDICT    ${runtime.verdict} · ${runtime.receipt}`);

    const cap = controlLabel('jit-capability');
    if (cap) cap.textContent = runtime.capabilityGranted ? 'CAP ON' : 'CAP OFF';
  }

  function resetRuntime() {
    runtime.phase = 0;
    runtime.address = 0;
    runtime.cacheState = 'UNREAD';
    runtime.result = null;
    runtime.verdict = 'WAITING';
    runtime.receipt = 'ready';
    sync();
  }

  function toggleCapability() {
    runtime.capabilityGranted = !runtime.capabilityGranted;
    resetRuntime();
    runtime.receipt = runtime.capabilityGranted ? 'capability enabled' : 'capability disabled';
    sync();
  }

  function stepRuntime() {
    if (runtime.phase >= PHASES.length || runtime.verdict === 'VETO') {
      runtime.receipt = runtime.verdict === 'VETO' ? 'vetoed · reset or enable capability' : 'complete · reset to replay';
      sync();
      return false;
    }

    switch (PHASES[runtime.phase]) {
      case 'REQUEST':
        runtime.receipt = `request · ${DEMO.source}`;
        break;

      case 'ADDRESS':
        runtime.address = fnv1a32(cacheKey());
        runtime.receipt = `address resolved · ${addressHex()}`;
        break;

      case 'CAPABILITY':
        if (!runtime.capabilityGranted) {
          runtime.verdict = 'VETO';
          runtime.receipt = 'capability gate denied numeric execution';
          runtime.phase = PHASES.length;
          sync();
          return false;
        }
        runtime.verdict = 'PASS';
        runtime.receipt = 'capability gate passed';
        break;

      case 'CACHE': {
        const hit = cache.has(runtime.address);
        runtime.cacheState = hit ? 'HIT' : 'MISS';
        if (hit) {
          runtime.result = cache.get(runtime.address);
          runtime.receipt = `cache HIT · result ${runtime.result}`;
          runtime.phase = PHASES.indexOf('RETURN');
          sync();
          return true;
        }
        runtime.receipt = 'cache MISS · dispatch required';
        break;
      }

      case 'DISPATCH':
        runtime.result = DEMO.left + DEMO.right;
        runtime.receipt = `numeric dispatch · result ${runtime.result}`;
        break;

      case 'COMMIT':
        cache.set(runtime.address, runtime.result);
        runtime.cacheState = 'COMMITTED';
        runtime.receipt = `cache commit · ${addressHex()}`;
        break;

      case 'RETURN':
        runtime.verdict = 'PASS';
        runtime.receipt = `return ${runtime.result} · deterministic receipt`;
        break;

      default:
        runtime.verdict = 'VETO';
        runtime.receipt = 'unknown JIT phase';
        runtime.phase = PHASES.length;
        sync();
        return false;
    }

    runtime.phase += 1;
    sync();
    return runtime.phase < PHASES.length;
  }

  function runRuntime() {
    if (runtime.phase >= PHASES.length || runtime.verdict === 'VETO') resetRuntime();
    let guard = 16;
    while (runtime.phase < PHASES.length && runtime.verdict !== 'VETO' && guard-- > 0) {
      stepRuntime();
    }
    if (guard <= 0 && runtime.phase < PHASES.length) {
      runtime.verdict = 'VETO';
      runtime.receipt = 'bounded run guard exhausted';
      runtime.phase = PHASES.length;
      sync();
    }
  }

  function inspectCache() {
    if (!cache.size) {
      runtime.cacheState = 'EMPTY';
      runtime.receipt = 'cache inspection · empty';
    } else {
      const entries = [...cache.entries()].map(([address, value]) =>
        `0x${address.toString(16).padStart(8, '0')}=${value}`);
      runtime.cacheState = 'INSPECT';
      runtime.receipt = `cache · ${entries.join(' · ')}`;
    }
    sync();
  }

  function mount() {
    if (!window.I13Exploded?.isReady?.()) return false;
    if (window.I13Exploded.getState(MODULE_ID)) return true;

    window.I13Exploded.mount(MODULE_ID, {
      title: 'JIT SHELL v0.2 · EXPLODED',
      subtitle: 'I-13 IR → address → capability → cache → numeric dispatch → return',
      family: 'python',
      expanded: false,
      machineExpanded: false,
      input: [
        'validated I-13 IR',
        `demo · ${DEMO.source}`,
        `requested capability · ${DEMO.capability}`
      ],
      pipeline: [
        'resolve deterministic execution address',
        'gate requested capability',
        'lookup deterministic cache',
        'dispatch bounded numeric operation',
        'commit cache + return receipt'
      ],
      state: [
        'phase · REQUEST',
        'execution address · pending',
        'capability · GRANTED',
        'cache · UNREAD'
      ],
      output: [
        'result · pending',
        'verdict · WAITING',
        'receipt · ready'
      ],
      machine: [
        'REFERENCE  JIT shell v0.2 · 7/7 PASS recorded',
        'PHASE      REQUEST · cap ON',
        'ADDRESS    pending · deterministic demo key',
        'CACHE      UNREAD · entries 0',
        'DISPATCH   add(4, 2) · safe numeric demo',
        'VERDICT    WAITING · ready'
      ],
      controls: [
        { id: 'jit-reset', label: 'RESET', onClick: resetRuntime },
        { id: 'jit-step', label: 'STEP', onClick: stepRuntime },
        { id: 'jit-run', label: 'RUN', onClick: runRuntime },
        { id: 'jit-cache', label: 'CACHE', onClick: inspectCache },
        { id: 'jit-capability', label: 'CAP ON', onClick: toggleCapability }
      ]
    });

    sync();
    return true;
  }

  function referenceDemoForTest(capabilityGranted = true, warmCache = false) {
    const address = fnv1a32(cacheKey());
    const localCache = new Map();
    if (warmCache) localCache.set(address, 6);
    if (!capabilityGranted) return Object.freeze({ verdict: 'VETO', address, result: null, cache: 'UNREAD' });
    if (localCache.has(address)) return Object.freeze({ verdict: 'PASS', address, result: localCache.get(address), cache: 'HIT' });
    const result = DEMO.left + DEMO.right;
    localCache.set(address, result);
    return Object.freeze({ verdict: 'PASS', address, result, cache: 'MISS' });
  }

  function selfTest() {
    const cold = referenceDemoForTest(true, false);
    const warm = referenceDemoForTest(true, true);
    const veto = referenceDemoForTest(false, false);
    const checks = [
      { name: 'cold demo returns 6', pass: cold.result === 6 && cold.verdict === 'PASS' },
      { name: 'cold demo is cache miss', pass: cold.cache === 'MISS' },
      { name: 'warm demo is cache hit', pass: warm.result === 6 && warm.cache === 'HIT' },
      { name: 'address deterministic', pass: cold.address === warm.address && cold.address !== 0 },
      { name: 'capability denial vetoes', pass: veto.verdict === 'VETO' && veto.result === null }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks, demo: cold });
  }

  function boot() {
    if (!mount()) window.addEventListener('i13-exploded-ready', mount, { once: true });
  }

  window.I13JitShell = Object.freeze({
    version: '0.1.0',
    mount,
    reset: resetRuntime,
    step: stepRuntime,
    run: runRuntime,
    inspectCache,
    toggleCapability,
    selfTest
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
