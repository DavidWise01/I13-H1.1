const machine = document.querySelector('.machine-shell');
const centerNode = document.querySelector('.core-center');
const words = [...document.querySelectorAll('.word')];
const linkLayer = document.getElementById('link-layer');
const canvas = document.getElementById('inferno');
const ctx = canvas.getContext('2d');

const groups = {
  designate: { words: ['Name', 'Constant', 'Attribute'], baseDeg: -90 },
  bind: { words: ['Assign', 'Arg', 'Return'], baseDeg: 0 },
  decide: { words: ['Expr', 'If', 'Compare'], baseDeg: 90 },
  transform: { words: ['Call', 'FunctionDef', 'BinOp'], baseDeg: 180 }
};

let currentActive = null;
let queen = { x: 0, y: 0, targetX: 0, targetY: 0, depth: 0, t: 0 };
let embers = [];

function placeWords() {
  const rect = machine.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const radius = Math.min(rect.width, rect.height) * (rect.width < 700 ? 0.33 : 0.36);
  const offsets = [-24, 0, 24];

  words.forEach(word => {
    const group = groups[word.dataset.group];
    const index = group.words.indexOf(word.dataset.word);
    const angle = (group.baseDeg + offsets[index]) * Math.PI / 180;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    word.style.left = `${x}px`;
    word.style.top = `${y}px`;
    word.dataset.cx = x;
    word.dataset.cy = y;
  });

  centerNode.style.left = `${cx}px`;
  centerNode.style.top = `${cy}px`;
  queen.targetX = queen.x = cx;
  queen.targetY = queen.y = cy;

  drawLinks(cx, cy);
}

function drawLinks(cx, cy) {
  linkLayer.innerHTML = '';
  words.forEach(word => {
    const x = Number(word.dataset.cx);
    const y = Number(word.dataset.cy);
    const mx = cx + (x - cx) * 0.58;
    const my = cy + (y - cy) * 0.58;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${cx} ${cy} Q ${mx} ${my} ${x} ${y}`);
    path.setAttribute('class', `group-${word.dataset.group}`);
    linkLayer.appendChild(path);
  });
}

function activateWord(word) {
  if (currentActive) currentActive.classList.remove('active');
  currentActive = word;
  currentActive.classList.add('active');
  queen.targetX = Number(word.dataset.cx);
  queen.targetY = Number(word.dataset.cy);
  queen.depth = (queen.depth + 1) % 10;
}

words.forEach(word => {
  word.addEventListener('click', () => activateWord(word));
  word.addEventListener('mouseenter', () => activateWord(word));
});

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedEmbers();
}

function seedEmbers() {
  embers = Array.from({ length: 80 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: 0.8 + Math.random() * 2.4,
    s: 0.18 + Math.random() * 0.55,
    a: 0.08 + Math.random() * 0.3,
    w: (Math.random() - 0.5) * 0.25
  }));
}

function drawInferno() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const rect = machine.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const bg = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  bg.addColorStop(0, 'rgba(8, 6, 11, 0.12)');
  bg.addColorStop(1, 'rgba(10, 5, 5, 0.26)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = 0; i < 9; i++) {
    const radius = 64 + i * 54;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,122,26,0.08)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = i === 0 ? 1.2 : 1;
    ctx.stroke();
  }

  const flame = ctx.createRadialGradient(cx, cy + 240, 16, cx, cy + 240, 420);
  flame.addColorStop(0, 'rgba(255, 111, 12, 0.26)');
  flame.addColorStop(0.25, 'rgba(255, 80, 0, 0.12)');
  flame.addColorStop(1, 'rgba(255, 80, 0, 0)');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.arc(cx, cy + 240, 420, 0, Math.PI * 2);
  ctx.fill();

  embers.forEach(e => {
    e.y -= e.s;
    e.x += Math.sin(e.y * 0.008) * e.w;
    if (e.y < -10) {
      e.y = window.innerHeight + 12;
      e.x = Math.random() * window.innerWidth;
    }
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, ${110 + Math.floor(Math.random()*40)}, 40, ${e.a})`;
    ctx.fill();
  });

  queen.x += (queen.targetX - queen.x) * 0.08;
  queen.y += (queen.targetY - queen.y) * 0.08;
  queen.t += 0.02;

  const halo = ctx.createRadialGradient(queen.x, queen.y, 2, queen.x, queen.y, 24 + queen.depth * 2);
  halo.addColorStop(0, 'rgba(255, 231, 180, 0.9)');
  halo.addColorStop(0.35, 'rgba(255, 122, 26, 0.35)');
  halo.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(queen.x, queen.y, 24 + queen.depth * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(queen.x, queen.y, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 244, 225, 0.95)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(queen.x, queen.y, 16 + Math.sin(queen.t) * 1.4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(66, 227, 180, 0.20)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function loop() {
  drawInferno();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  placeWords();
});

resizeCanvas();
placeWords();
setTimeout(() => activateWord(words[0]), 20);
loop();
