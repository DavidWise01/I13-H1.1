(() => {
  const nodes = [...document.querySelectorAll('[data-pipeline-node]')];
  let nodeIndex = 0;
  const tickPipeline = () => {
    nodes.forEach((node, index) => node.classList.toggle('active', index === nodeIndex));
    nodeIndex = nodes.length ? (nodeIndex + 1) % nodes.length : 0;
  };
  if (nodes.length) {
    tickPipeline();
    setInterval(tickPipeline, 1150);
  }

  const terminal = document.querySelector('[data-debug-terminal]');
  if (!terminal) return;

  const steps = [
    {
      label: 'ENTRY',
      html: '<span class="hot">PAUSE entry</span> · step=000001 depth=1 scope=main pc=0000 Func\n   1 | def add(I a, I b) { -> a + b }\n     | ^\n\ni13dbg&gt; break 4\n<span class="good">BREAKPOINT 4 SET</span>'
    },
    {
      label: 'CONTINUE',
      html: '<span class="hot">PAUSE breakpoint:4</span> · depth=1 scope=main pc=0003 Ask\n   4 | I OUT &lt;- add(x, 3)\n     | ^\n\ni13dbg&gt; bindings\nGLOBALS\n  g0000:add = Function(fn0000:add)\n  g0001:x   = Number(1)\n  g0002:OUT = &lt;unbound&gt;'
    },
    {
      label: 'NEXT',
      html: '<span class="warn">NEXT</span> · call enters depth=2 but debugger does not stop there\n\nfn0000:add\n  Number(1) Add Number(3)\n  return Number(4)\n\n<span class="hot">PAUSE next</span> · depth=1 scope=main\ni13dbg&gt; stack\nSTACK bottom→top\n  [0000] Number(4)'
    },
    {
      label: 'DONE',
      html: '<span class="good">DEBUG OK</span> · reference VM completed\nsteps deterministic\nframe ceiling 4096\n\nOUT = 4\n\nTRACE / DEBUG are observers.\nIVM remains execution authority.'
    }
  ];

  let index = 0;
  const body = terminal.querySelector('[data-terminal-body]');
  const buttons = [...terminal.querySelectorAll('[data-terminal-step]')];

  const render = (nextIndex) => {
    index = (nextIndex + steps.length) % steps.length;
    if (body) body.innerHTML = steps[index].html;
    buttons.forEach((button, buttonIndex) => button.classList.toggle('active', buttonIndex === index));
  };

  buttons.forEach((button, buttonIndex) => {
    button.addEventListener('click', () => render(buttonIndex));
  });

  render(0);
  let auto = setInterval(() => render(index + 1), 4200);
  terminal.addEventListener('mouseenter', () => clearInterval(auto), { once: true });
})();
