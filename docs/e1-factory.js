(() => {
  'use strict';

  const ANCHORS = [
    {role:'capstone', coord:'top | bottom', author:'Neal Stephenson', work:'The Fall', tags:['technical']},
    {role:'keystone', coord:'top | top', author:'George Orwell', work:'1984', tags:['technical','somatic','phonic','doublespeak','triple-listen']},
    {role:'core', coord:'middle | middle', author:'Enheduanna', work:'first author', tags:['example','instruction','42']},
    {role:'ucapstone', coord:'bottom | top', author:'Neal Stephenson', work:'Seveneves', tags:['unknown','discovered']},
    {role:'ukeystone', coord:'bottom | bottom', author:'Aldous Huxley', work:'Brave New World', tags:['barbaric','cultured','curated']},
  ];

  const anchors = document.getElementById('anchors');
  for (const a of ANCHORS) {
    const el = document.createElement('article');
    el.className = `card anchor ${a.role === 'core' ? 'core' : ''}`;
    el.innerHTML = `<div class="coord">${a.role.toUpperCase()} · (${a.coord})</div><h3>${a.author}</h3><b>${a.work}</b><p>${a.tags.join(' / ')}</p>`;
    anchors.appendChild(el);
  }

  const moduleEl = document.getElementById('module');
  const requestEl = document.getElementById('request');
  const out = document.getElementById('out');
  const status = document.getElementById('status');
  const send = document.getElementById('send');
  const ret = document.getElementById('return');
  const reset = document.getElementById('reset');

  let pending = null;

  function stable(value) {
    if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
    if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
    return JSON.stringify(value);
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function nonce() {
    const v = new Uint32Array(2);
    crypto.getRandomValues(v);
    return [...v].map(x => x.toString(16).padStart(8,'0')).join('');
  }

  function show(value, verdict) {
    out.textContent = JSON.stringify(value, null, 2);
    status.textContent = verdict;
    status.className = `status ${verdict.includes('PASS') ? 'pass' : verdict.includes('VETO') ? 'veto' : ''}`;
  }

  function techPrime(payload) {
    if (!globalThis.E1Tech001) throw new Error('E1.TECH-001 core unavailable');
    return globalThis.E1Tech001.evaluate(payload);
  }

  moduleEl.addEventListener('change', () => {
    if (moduleEl.value === 'TECH-001') {
      requestEl.value = JSON.stringify({
        task:'repair one failing parser test',
        phase:'diagnose',
        scope:'parser/expression',
        capability:'test',
        evidence_trit:0,
        question_debt:1,
      }, null, 2);
    }
  });

  send.addEventListener('click', async () => {
    const payload = requestEl.value.trim();
    if (!payload) return show({error:'empty bounded request'}, 'VETO · request has no payload');
    if (moduleEl.value === 'TECH-001') {
      try { globalThis.E1Tech001.normalize(payload); }
      catch (error) { return show({error:String(error?.message || error)}, 'VETO · invalid TECH-001 request'); }
    }
    const request = {
      boundary:'[ y | x ]',
      from:'internal/channel/I13/cortex/subagent',
      to:`external/channel/E1/primer/factory/${moduleEl.value}`,
      module:moduleEl.value,
      payload,
      shared_live_state:false,
      vortex:{internal:['n','2n','4n','8n'],external:['n','2n','4n','8n']},
      nonce:nonce(),
    };
    request.payload_hash = await sha256(payload);
    request.request_hash = await sha256(stable(request));
    request.witness = await sha256(`E1ID.request|${request.request_hash}|closed_loop_method|I13|`);
    pending = request;
    ret.disabled = false;
    show({E1ID:{phase:'request',...request}}, 'PASS · witnessed bounded request y → x');
  });

  ret.addEventListener('click', async () => {
    if (!pending) return show({error:'no pending request'}, 'VETO · no request to close');
    let prime;
    try {
      if (pending.module === 'RD-001') {
        prime = {module:'E1.RD-001', law:'ABCD - D = ABC', operation:'recover parent geometry from bounded derived form', private_state_exported:false};
      } else if (pending.module === 'CORPUS-001') {
        prime = {module:'E1.CORPUS-001', operation:'orient against fixed external calibration geometry', anchors:ANCHORS, continuity:'[ a+ [[ () ]] c- ] || [ c+ [[ () ]] a- ]', corpus_ingest:false};
      } else {
        prime = techPrime(pending.payload);
      }
    } catch (error) {
      return show({error:String(error?.message || error)}, 'VETO · factory module rejected request');
    }

    const return_hash = await sha256(stable(prime));
    const e1id = {
      phase:'return',
      root_tag:'.dlw',
      method_tag:'closed_loop_method|I13|',
      from:`external/channel/E1/primer/factory/${pending.module}`,
      to:'internal/channel/I13/cortex',
      parent_hash:pending.request_hash,
      request_hash:pending.request_hash,
      payload_hash:pending.payload_hash,
      return_hash,
      witness:await sha256(`E1ID.return|${pending.request_hash}|${return_hash}|closed_loop_method|I13|`),
      shared_live_state:false,
      cv:'PASS',
    };
    const verdict = prime.module === 'E1.TECH-001'
      ? `PASS · [E1ID]cv closed · ${prime.trit.symbol} ${prime.trit.authority}`
      : 'PASS · [E1ID]cv closed x → y; I13 may continue';
    show({prime,E1ID:e1id}, verdict);
    pending = null;
    ret.disabled = true;
  });

  reset.addEventListener('click', () => {
    pending = null;
    ret.disabled = true;
    show({boundary:'[ y | x ]',shared_live_state:false}, 'No traversal yet.');
  });
})();
