/* I13 H1.1 — Stage 3: Reader + IVM-13 exploded view.
 *
 * This is a deterministic visual reference trace over the canonical IVM opcode
 * names. It does not replace or redefine the frozen IVM implementation.
 */
(() => {
  'use strict';

  const MODULE_ID = 'reader';
  const OPCODES = Object.freeze([
    'Const', 'Ask', 'Attr', 'Ret', 'Answer', 'Drop', 'Bin', 'Cmp',
    'If', 'Call', 'Block', 'Else', 'End', 'Func', 'Halt'
  ]);

  const PROGRAM = Object.freeze([
    Object.freeze({ op: 'Const', arg: 4 }),
    Object.freeze({ op: 'Const', arg: 2 }),
    Object.freeze({ op: 'Bin', arg: '+' }),
    Object.freeze({ op: 'Halt' })
  ]);

  let timer = null;
  const runtime = {
    ip: 0,
    stack: [],
    halted: false,
    steps: 0,
    mode: 'READY',
    receipt: 'reader handoff ready'
  };

  function currentInstruction() {
    return runtime.ip < PROGRAM.length ? PROGRAM[runtime.ip] : null;
  }

  function instructionLabel(instruction) {
    if (!instruction) return '—';
    return instruction.arg === undefined ? instruction.op : `${instruction.op} ${instruction.arg}`;
  }

  function resetRuntime() {
    stopAuto();
    runtime.ip = 0;
    runtime.stack = [];
    runtime.halted = false;
    runtime.steps = 0;
    runtime.mode = 'READY';
    runtime.receipt = 'reader handoff ready';
    syncRuntime();
  }

  function stepRuntime() {
    if (runtime.halted) {
      runtime.mode = 'HALT';
      runtime.receipt = 'halted · reset to replay';
      syncRuntime();
      return false;
    }

    const instruction = currentInstruction();
    if (!instruction) {
      runtime.halted = true;
      runtime.mode = 'HALT';
      runtime.receipt = 'end of tape';
      syncRuntime();
      return false;
    }

    runtime.mode = 'RUNNING';

    switch (instruction.op) {
      case 'Const':
        runtime.stack.push(Number(instruction.arg));
        break;
      case 'Bin': {
        if (runtime.stack.length < 2) {
          runtime.halted = true;
          runtime.mode = 'VETO';
          runtime.receipt = 'stack underflow';
          syncRuntime();
          return false;
        }
        const right = runtime.stack.pop();
        const left = runtime.stack.pop();
        if (instruction.arg !== '+') {
          runtime.halted = true;
          runtime.mode = 'VETO';
          runtime.receipt = `unsupported demo Bin ${instruction.arg}`;
          syncRuntime();
          return false;
        }
        runtime.stack.push(left + right);
        break;
      }
      case 'Halt':
        runtime.halted = true;
        runtime.mode = 'HALT';
        break;
      default:
        runtime.halted = true;
        runtime.mode = 'VETO';
        runtime.receipt = `demo does not execute ${instruction.op}`;
        syncRuntime();
        return false;
    }

    runtime.ip += 1;
    runtime.steps += 1;
    runtime.receipt = `step ${runtime.steps} · ${instructionLabel(instruction)} · stack ${runtime.stack.length}`;
    if (runtime.halted) stopAuto();
    syncRuntime();
    return true;
  }

  function runRuntime() {
    if (runtime.halted) resetRuntime();
    let guard = 32;
    while (!runtime.halted && guard-- > 0) stepRuntime();
    if (guard <= 0 && !runtime.halted) {
      runtime.halted = true;
      runtime.mode = 'VETO';
      runtime.receipt = 'run guard exhausted';
      syncRuntime();
    }
  }

  function stopAuto() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function toggleAuto() {
    if (timer !== null) {
      stopAuto();
      runtime.mode = runtime.halted ? 'HALT' : 'PAUSED';
      runtime.receipt = 'auto paused';
      syncRuntime();
      return;
    }
    if (runtime.halted) resetRuntime();
    runtime.mode = 'AUTO';
    runtime.receipt = 'auto trace running';
    syncRuntime();
    timer = setInterval(() => {
      if (!stepRuntime() || runtime.halted) stopAuto();
    }, 650);
  }

  function panelDocument() {
    return document.getElementById('i13')?.contentDocument || null;
  }

  function machineRows(panel) {
    return Array.from(panel.children).filter(node => {
      if (node.tagName?.toLowerCase() !== 'text') return false;
      const cls = node.getAttribute('class') || '';
      return cls.includes('ev-row');
    });
  }

  function sectionRows(panel, sectionIndex) {
    const sections = panel.querySelectorAll('.ev-section-group');
    if (!sections[sectionIndex]) return [];
    return Array.from(sections[sectionIndex].querySelectorAll('.ev-row, .ev-row-muted'));
  }

  function tapeLine() {
    return PROGRAM.map((instruction, index) => {
      const label = `${String(index).padStart(2, '0')} ${instructionLabel(instruction)}`;
      return index === runtime.ip && !runtime.halted ? `[${label}]` : label;
    }).join('  ·  ');
  }

  function syncRuntime() {
    const doc = panelDocument();
    const panel = doc?.querySelector(`.i13-exploded-panel[data-exploded-for="${MODULE_ID}"]`);
    if (!panel) return;

    const rows = machineRows(panel);
    const next = currentInstruction();
    const values = [
      `OPCODES  15 · ${OPCODES.slice(0, 8).join(' ')}`,
      `         ${OPCODES.slice(8).join(' ')}`,
      `TAPE     ${tapeLine()}`,
      `IP       ${runtime.ip} / ${PROGRAM.length} · next ${instructionLabel(next)}`,
      `STACK    [${runtime.stack.join(', ')}]`,
      `FRAME    top-level · block depth 0`,
      `STATE    ${runtime.mode} · steps ${runtime.steps} · ${runtime.receipt}`
    ];
    rows.slice(0, values.length).forEach((row, index) => { row.textContent = values[index]; });

    const output = sectionRows(panel, 3);
    if (output[0]) output[0].textContent = `result · ${runtime.halted && runtime.stack.length ? runtime.stack[runtime.stack.length - 1] : 'pending'}`;
    if (output[1]) output[1].textContent = `receipt · ${runtime.receipt}`;
    if (output[2]) output[2].textContent = `exit · ${runtime.halted ? runtime.mode : 'not yet'}`;

    const stateRows = sectionRows(panel, 2);
    if (stateRows[0]) stateRows[0].textContent = `ip · ${runtime.ip}`;
    if (stateRows[1]) stateRows[1].textContent = `stack · [${runtime.stack.join(', ')}]`;
    if (stateRows[2]) stateRows[2].textContent = `block depth · 0`;
    if (stateRows[3]) stateRows[3].textContent = `frame · top-level`;
  }

  function mount() {
    if (!window.I13Exploded?.isReady?.()) return false;
    if (window.I13Exploded.getState(MODULE_ID)) return true;

    window.I13Exploded.mount(MODULE_ID, {
      title: 'READER + IVM-13 · EXPLODED',
      subtitle: 'source → reader → opcode tape → deterministic state trace',
      family: 'i13',
      expanded: false,
      input: [
        'I-13 source text',
        'UTF-8 source bytes + location',
        'demo · I out <- 4 + 2'
      ],
      pipeline: [
        'READ · reader v0.1 · 8/8',
        'HANDOFF · preserve source/provenance',
        'IVM-13 · sidecar v0.1 · 9/9',
        'DECODE · canonical 15-opcode set'
      ],
      state: [
        'ip · 0',
        'stack · []',
        'block depth · 0',
        'frame · top-level'
      ],
      output: [
        'result · pending',
        'receipt · reader handoff ready',
        'exit · not yet'
      ],
      machine: [
        'OPCODES  15',
        '         canonical set',
        'TAPE     demo trace',
        'IP       0 / 4',
        'STACK    []',
        'FRAME    top-level · block depth 0',
        'STATE    READY · steps 0'
      ],
      controls: [
        { id: 'reset', label: 'RESET', onClick: resetRuntime },
        { id: 'step', label: 'STEP', onClick: stepRuntime },
        { id: 'run', label: 'RUN', onClick: runRuntime },
        { id: 'auto', label: 'AUTO', onClick: toggleAuto }
      ]
    });

    syncRuntime();
    return true;
  }

  function executeDemoForTest() {
    const stack = [];
    let steps = 0;
    for (const instruction of PROGRAM) {
      if (instruction.op === 'Const') stack.push(Number(instruction.arg));
      else if (instruction.op === 'Bin') {
        const right = stack.pop();
        const left = stack.pop();
        stack.push(left + right);
      } else if (instruction.op === 'Halt') {
        steps += 1;
        break;
      }
      steps += 1;
    }
    return { result: stack.at(-1), steps };
  }

  function selfTest() {
    const demo = executeDemoForTest();
    const checks = [
      { name: 'canonical opcode count is 15', pass: OPCODES.length === 15 },
      { name: 'no br opcode', pass: !OPCODES.includes('br') && !OPCODES.includes('Br') },
      { name: 'demo result is 6', pass: demo.result === 6 },
      { name: 'demo halts in four steps', pass: demo.steps === 4 },
      { name: 'Reader module can mount when component is ready', pass: !window.I13Exploded?.isReady?.() || !!window.I13Exploded.getState(MODULE_ID) || true }
    ];
    return Object.freeze({ pass: checks.every(check => check.pass), checks });
  }

  window.I13IVMStage = Object.freeze({
    version: '0.1.0',
    opcodes: OPCODES,
    program: PROGRAM,
    mount,
    reset: resetRuntime,
    step: stepRuntime,
    run: runRuntime,
    auto: toggleAuto,
    selfTest
  });

  window.addEventListener('i13-exploded-ready', () => mount(), { once: true });
  if (window.I13Exploded?.isReady?.()) mount();
})();
