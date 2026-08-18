(() => {
  'use strict';

  const VERSION = '1.0.0';
  const TRITS = Object.freeze({
    n1: Object.freeze({symbol:'n1', value:-1, role:'boundary', authority:'HOLD', next:'RETURN_R0'}),
    p0: Object.freeze({symbol:'p0', value:0, role:'witness', authority:'FLAY', next:'FLAY'}),
    p1: Object.freeze({symbol:'p1', value:1, role:'resolved', authority:'PROCEED', next:'CORTEX_CAPABILITY_GATE'}),
  });
  const BY_VALUE = Object.freeze({'-1':TRITS.n1, '0':TRITS.p0, '1':TRITS.p1});
  const PHASES = Object.freeze(['inspect','diagnose','cut','verify','return']);
  const CAPABILITIES = Object.freeze(['read','build','test','patch','git']);

  function cleanText(value, name, max) {
    const text = String(value ?? '').trim();
    if (!text || text.length > max) throw new Error(`${name} must be 1..${max} characters`);
    return text;
  }

  function parse(payload) {
    const request = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (!request || typeof request !== 'object' || Array.isArray(request)) throw new Error('TECH-001 request must be an object');
    return request;
  }

  function normalize(payload) {
    const request = parse(payload);
    const phase = cleanText(request.phase, 'phase', 16).toLowerCase();
    const capability = cleanText(request.capability, 'capability', 16).toLowerCase();
    if (!PHASES.includes(phase)) throw new Error(`unsupported phase: ${phase}`);
    if (!CAPABILITIES.includes(capability)) throw new Error(`unsupported capability: ${capability}`);

    const evidenceTrit = Number(request.evidence_trit);
    if (!Number.isInteger(evidenceTrit) || !(String(evidenceTrit) in BY_VALUE)) {
      throw new Error('evidence_trit must be -1, 0, or +1');
    }

    const questionDebt = Number(request.question_debt);
    if (!Number.isInteger(questionDebt) || questionDebt < 0 || questionDebt > 255) {
      throw new Error('question_debt must be an integer in 0..255');
    }

    return Object.freeze({
      task: cleanText(request.task, 'task', 1024),
      phase,
      scope: cleanText(request.scope, 'scope', 512),
      capability,
      evidence_trit: evidenceTrit,
      question_debt: questionDebt,
    });
  }

  function evaluate(payload) {
    const request = normalize(payload);
    let trit;
    if (request.evidence_trit === -1) trit = TRITS.n1;
    else if (request.question_debt > 0) trit = TRITS.p0;
    else if (request.evidence_trit === 1) trit = TRITS.p1;
    else trit = TRITS.p0;

    return Object.freeze({
      module:'E1.TECH-001',
      version:VERSION,
      task:request.task,
      phase:request.phase,
      scope:request.scope,
      capability:request.capability,
      evidence_trit:request.evidence_trit,
      question_debt:request.question_debt,
      trit,
      law:'n1 HOLD | p0 FLAY | p1 PROCEED',
      surgical:'observe -> distinguish -> smallest cut -> verify -> receipt -> r0',
      private_state_exported:false,
    });
  }

  globalThis.E1Tech001 = Object.freeze({VERSION, TRITS, PHASES, CAPABILITIES, parse, normalize, evaluate});
})();
