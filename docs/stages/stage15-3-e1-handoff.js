/* I13 H1.1 — Stage 15.3: live Cortex <-> E1 primer handoff.
 *
 * Internal side only. The E1 service is loaded into a sandboxed iframe with
 * scripts enabled but SAME-ORIGIN ACCESS DISABLED. The two sides communicate
 * only with bounded postMessage capsules. Rust/Wasm verifies the [ y | x ]
 * crossing and the closed-loop parent receipt before a prime is released to
 * the internal workbench.
 */
(() => {
  'use strict';

  const VERSION = '15.3.0';
  const WASM_URL = 'assets/i13_h1_1.wasm.b64';
  const SERVICE_URL = 'e1-service.html';
  const MAX_PAYLOAD_BYTES = 4096;
  const SERVICE_TYPE_REQUEST = 'I13_E1_PRIME_REQUEST';
  const SERVICE_TYPE_RETURN = 'I13_E1_PRIME_RETURN';

  const state = {
    wasm: null,
    ready: false,
    serviceReady: false,
    serviceFrame: null,
    dock: null,
    button: null,
    pending: null,
    lastReceipt: null,
    bootError: null,
  };

  const encoder = new TextEncoder();
  const utf8Length = value => encoder.encode(String(value)).length;

  function bytesFromB64(text) {
    const raw = atob(String(text || '').replace(/\s+/g, ''));
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
    return out;
  }

  function stable(value) {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
    }
    return JSON.stringify(value);
  }

  async function sha256(text) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(text)));
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function u32FromHex(hex) {
    const n = Number.parseInt(String(hex).slice(0, 8), 16) >>> 0;
    return n || 1;
  }

  function randomU32() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return (a[0] >>> 0) || 1;
  }

  function requestId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `${Date.now().toString(36)}-${randomU32().toString(16)}`;
  }

  function shell() {
    return document.getElementById('i13-main-suite-shell');
  }

  function setOutput(value, verdict = 'READY') {
    const dock = state.dock;
    if (!dock) return;
    const out = dock.querySelector('[data-e1-out]');
    const status = dock.querySelector('[data-e1-status]');
    out.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    status.textContent = verdict;
    status.dataset.phase = verdict.startsWith('PASS') ? 'pass' : verdict.startsWith('VETO') ? 'veto' : 'ready';
  }

  function createServiceFrame() {
    if (state.serviceFrame) return state.serviceFrame;
    const frame = document.createElement('iframe');
    frame.id = 'i13-e1-service';
    frame.src = SERVICE_URL;
    frame.title = 'E1 external primer service';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;width:1px;height:1px;right:-10px;bottom:-10px;border:0;opacity:0;pointer-events:none';
    frame.addEventListener('load', () => {
      state.serviceReady = true;
      updateButton();
    });
    document.body.appendChild(frame);
    state.serviceFrame = frame;
    return frame;
  }

  function createDock() {
    if (state.dock) return state.dock;
    const dock = document.createElement('aside');
    dock.id = 'i13-e1-handoff-dock';
    dock.setAttribute('aria-label', 'Stage 15.3 E1 handoff');
    dock.innerHTML = `
      <style>
        #i13-e1-handoff-dock{position:fixed;z-index:4200;right:14px;top:68px;width:min(440px,calc(100vw - 28px));max-height:calc(100vh - 84px);overflow:auto;background:#071019;color:#dce8f5;border:1px solid #36516d;border-radius:12px;box-shadow:0 18px 50px rgba(15,23,42,.28);padding:13px;font:11px/1.45 "Cascadia Code",Consolas,monospace;display:none}
        #i13-e1-handoff-dock[data-open="true"]{display:block}
        #i13-e1-handoff-dock .e1-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}
        #i13-e1-handoff-dock .e1-head b{color:#67e8f9;flex:1}#i13-e1-handoff-dock .e1-part{color:#c4b5fd}
        #i13-e1-handoff-dock button,#i13-e1-handoff-dock select,#i13-e1-handoff-dock textarea{font:inherit;border:1px solid #36516d;border-radius:7px;background:#0b1722;color:#e6f0fa;padding:7px}
        #i13-e1-handoff-dock textarea{width:100%;min-height:76px;resize:vertical;margin-top:7px}
        #i13-e1-handoff-dock select{width:100%}#i13-e1-handoff-dock button{cursor:pointer;font-weight:900}
        #i13-e1-handoff-dock .e1-actions{display:flex;gap:7px;margin:8px 0;flex-wrap:wrap}#i13-e1-handoff-dock .e1-actions button:first-child{color:#67e8f9;border-color:#0e7490}
        #i13-e1-handoff-dock pre{white-space:pre-wrap;word-break:break-word;background:#03070b;border:1px solid #21384d;border-radius:8px;padding:9px;min-height:130px;max-height:300px;overflow:auto;margin:8px 0 0}
        #i13-e1-handoff-dock [data-e1-status]{display:block;margin-top:7px;color:#94a3b8;font-weight:900}#i13-e1-handoff-dock [data-e1-status][data-phase="pass"]{color:#6ee7b7}#i13-e1-handoff-dock [data-e1-status][data-phase="veto"]{color:#fb7185}
        #i13-e1-handoff-dock .e1-law{color:#94a3b8;margin:6px 0}.e1-law code{color:#fbbf24}.e1-link{color:#67e8f9}
      </style>
      <div class="e1-head"><b>15.3 · CORTEX → E1 → CV</b><span class="e1-part">[ y | x ]</span><button type="button" data-e1-close>×</button></div>
      <div class="e1-law">Internal request console only. External factory runs in <code>sandbox="allow-scripts"</code> with no same-origin capability.</div>
      <label>MODULE<select data-e1-module><option value="RD-001">E1.RD-001 · REVERSE DISTILLATION</option><option value="CORPUS-001">E1.CORPUS-001 · CORPUS ORIENTATION</option></select></label>
      <textarea data-e1-request placeholder="bounded Cortex request — no live state"></textarea>
      <div class="e1-actions"><button type="button" data-e1-prime>PRIME THROUGH E1</button><button type="button" data-e1-clear>CLEAR RECEIPT</button><a class="e1-link" href="e1.html" target="_blank" rel="noopener">factory page ↗</a></div>
      <span data-e1-status data-phase="ready">BOOTING · internal Wasm verifier</span>
      <pre data-e1-out>{ "stage": "15.3", "boundary": "[ y | x ]" }</pre>
    `;
    document.body.appendChild(dock);
    state.dock = dock;
    dock.querySelector('[data-e1-close]').addEventListener('click', () => toggleDock(false));
    dock.querySelector('[data-e1-clear]').addEventListener('click', () => {
      state.lastReceipt = null;
      setOutput({stage:'15.3', boundary:'[ y | x ]', receipt:null}, 'READY · receipt cleared');
    });
    dock.querySelector('[data-e1-prime]').addEventListener('click', () => requestPrime());
    return dock;
  }

  function toggleDock(force) {
    const dock = createDock();
    const open = typeof force === 'boolean' ? force : dock.dataset.open !== 'true';
    dock.dataset.open = open ? 'true' : 'false';
    if (open) dock.querySelector('[data-e1-request]')?.focus();
  }

  function attachButton() {
    if (state.button) return true;
    const s = shell();
    if (!s) return false;
    const open = s.querySelector('[data-suite-open]');
    if (!open) return false;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.e1PrimeOpen = 'true';
    button.textContent = 'E1 PRIME';
    button.title = 'Open bounded Cortex → E1 handoff';
    button.addEventListener('click', () => toggleDock());
    open.insertAdjacentElement('afterend', button);
    state.button = button;
    updateButton();
    return true;
  }

  function updateButton() {
    if (!state.button) return;
    state.button.disabled = !state.ready || !state.serviceReady;
    state.button.style.opacity = state.button.disabled ? '.45' : '1';
    state.button.textContent = state.ready && state.serviceReady ? 'E1 PRIME' : 'E1 …';
  }

  async function bootWasm() {
    try {
      const response = await fetch(WASM_URL, {cache:'no-store'});
      if (!response.ok) throw new Error(`Wasm asset HTTP ${response.status}`);
      const result = await WebAssembly.instantiate(bytesFromB64(await response.text()), {});
      const wasm = result.instance.exports;
      for (const name of ['i13_e1_boundary_verify','i13_e1_vortex_width','i13_e1_closed_loop_verify']) {
        if (typeof wasm[name] !== 'function') throw new Error(`missing Wasm export ${name}`);
      }
      if (Number(wasm.i13_e1_vortex_width(1)) !== 8) throw new Error('E1 vortex law mismatch');
      state.wasm = wasm;
      state.ready = true;
      state.bootError = null;
      if (state.dock) setOutput({stage:'15.3', internal_verifier:'Wasm PASS', width:'8n_y | 8n_x'}, 'READY · Wasm + service boundary armed');
    } catch (error) {
      state.ready = false;
      state.bootError = String(error?.message || error);
      if (state.dock) setOutput({error:state.bootError}, 'VETO · internal verifier unavailable');
    }
    updateButton();
  }

  async function requestPrime() {
    const dock = createDock();
    if (!state.ready || !state.wasm) return setOutput({error:state.bootError || 'Wasm not ready'}, 'VETO · internal verifier unavailable');
    if (!state.serviceReady || !state.serviceFrame?.contentWindow) return setOutput({error:'E1 service sandbox not ready'}, 'VETO · external service unavailable');
    if (state.pending) return setOutput({error:'a bounded E1 request is already pending'}, 'VETO · one crossing at a time');

    const module = dock.querySelector('[data-e1-module]').value;
    const payload = dock.querySelector('[data-e1-request]').value.trim();
    const bytes = utf8Length(payload);
    if (!payload) return setOutput({error:'empty bounded request'}, 'VETO · request required');
    if (bytes > MAX_PAYLOAD_BYTES) return setOutput({error:`request ${bytes} bytes > ${MAX_PAYLOAD_BYTES}`}, 'VETO · request exceeds boundary');

    const payloadSha256 = await sha256(payload);
    const id = requestId();
    const requestShape = {
      id,
      boundary:'[ y | x ]',
      from:'internal/channel/I13/cortex/subagent',
      to:`external/channel/E1/primer/factory/${module}`,
      module,
      payload_sha256:payloadSha256,
      payload_bytes:bytes,
      shared_live_state:false,
      vortex:{y:['n','2n','4n','8n'],x:['n','2n','4n','8n']},
    };
    const requestSha256 = await sha256(stable(requestShape));
    const requestU32 = u32FromHex(requestSha256);
    const payloadU32 = u32FromHex(payloadSha256);
    const requestWitness = randomU32();
    const pass = Number(state.wasm.i13_e1_boundary_verify(0, 1, requestU32, payloadU32, 0, requestWitness, 0)) === 1;
    if (!pass) return setOutput({request:requestShape}, 'VETO · Wasm rejected y → x capsule');

    state.pending = {id,module,payload,requestShape,requestSha256,requestU32,payloadU32,requestWitness,started:performance.now()};
    setOutput({E1ID:{phase:'request',...requestShape,request_sha256:requestSha256,request_u32:requestU32,witness_u32:requestWitness}}, 'REQUEST · witnessed y → x; waiting on external factory');

    state.serviceFrame.contentWindow.postMessage({
      type:SERVICE_TYPE_REQUEST,
      version:1,
      id,
      module,
      payload,
      capsule:{
        boundary:'[ y | x ]',
        from:'internal',
        to:'external',
        request_sha256:requestSha256,
        request_u32:requestU32,
        payload_sha256:payloadSha256,
        payload_u32:payloadU32,
        request_witness_u32:requestWitness,
        shared_live_state:false,
      }
    }, '*');

    setTimeout(() => {
      if (state.pending?.id === id) {
        state.pending = null;
        setOutput({id,error:'external E1 service timeout'}, 'VETO · no witnessed return');
      }
    }, 5000);
  }

  async function acceptReturn(message) {
    const pending = state.pending;
    if (!pending || message.id !== pending.id) return;
    state.pending = null;

    if (message.error) return setOutput({id:message.id,error:message.error}, 'VETO · external factory rejected request');
    const capsule = message.capsule || {};
    if (capsule.shared_live_state !== false) return setOutput({capsule}, 'VETO · contamination flag');
    if (capsule.parent_request_sha256 !== pending.requestSha256 || Number(capsule.parent_request_u32) !== pending.requestU32) {
      return setOutput({capsule,expected:pending.requestSha256}, 'VETO · parent receipt mismatch');
    }

    const primeSha256 = await sha256(stable(message.prime));
    const primeU32 = u32FromHex(primeSha256);
    const returnWitness = Number(capsule.return_witness_u32) >>> 0;
    if (!returnWitness) return setOutput({capsule}, 'VETO · return witness missing');

    const returnPass = Number(state.wasm.i13_e1_boundary_verify(1, 0, pending.requestU32, primeU32, pending.requestU32, returnWitness, 0)) === 1;
    const closed = Number(state.wasm.i13_e1_closed_loop_verify(pending.requestU32, Number(capsule.parent_request_u32) >>> 0, pending.requestWitness, returnWitness, 0)) === 1;
    if (!returnPass || !closed) return setOutput({returnPass,closed,capsule}, 'VETO · [E1ID]cv did not close');

    const receipt = {
      stage:'15.3',
      prime:message.prime,
      E1ID:{
        root_tag:'.dlw',
        method_tag:'closed_loop_method|I13|',
        boundary:'[ y | x ]',
        request_sha256:pending.requestSha256,
        request_u32:pending.requestU32,
        payload_sha256:pending.requestShape.payload_sha256,
        return_sha256:primeSha256,
        return_u32:primeU32,
        request_witness_u32:pending.requestWitness,
        return_witness_u32:returnWitness,
        cv:'PASS',
        shared_live_state:false,
        transport:'sandboxed postMessage; allow-scripts only; opaque external origin',
        elapsed_ms:Math.round(performance.now() - pending.started),
      }
    };
    state.lastReceipt = receipt;
    setOutput(receipt, 'PASS · [E1ID]cv closed x → y; Cortex may continue');
    window.dispatchEvent(new CustomEvent('i13:e1-prime', {detail:receipt}));
  }

  function onMessage(event) {
    if (event.source !== state.serviceFrame?.contentWindow) return;
    const message = event.data;
    if (!message || message.type !== SERVICE_TYPE_RETURN || message.version !== 1) return;
    acceptReturn(message).catch(error => {
      state.pending = null;
      setOutput({error:String(error?.message || error)}, 'VETO · return verification error');
    });
  }

  function selfTest() {
    return {
      version:VERSION,
      sandbox:state.serviceFrame?.getAttribute('sandbox') === 'allow-scripts',
      same_origin_capability:state.serviceFrame?.getAttribute('sandbox')?.includes('allow-same-origin') || false,
      wasm_ready:state.ready,
      service_ready:state.serviceReady,
      independent_width:state.wasm ? Number(state.wasm.i13_e1_vortex_width(1)) : 0,
      no_persistence:true,
    };
  }

  window.addEventListener('message', onMessage);
  createServiceFrame();
  createDock();
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (attachButton() || tries > 100) clearInterval(timer);
  }, 50);
  bootWasm();

  window.I13E1HandoffStage = Object.freeze({
    version:VERSION,
    request:requestPrime,
    state:() => ({ready:state.ready,serviceReady:state.serviceReady,pending:!!state.pending,lastReceipt:state.lastReceipt}),
    selfTest,
  });
})();
