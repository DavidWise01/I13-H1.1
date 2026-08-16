(() => {
  "use strict";

  const canvas = document.getElementById("ology");
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  const words = [...document.querySelectorAll(".word")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    w: 0,
    h: 0,
    dpr: 1,
    spacing: 52,
    cols: 0,
    rows: 0,
    queen: { x: 0, y: 0, tx: 0, ty: 0, depth: 0 },
    target: null,
    trail: [],
    lastStep: 0,
    activePlane: "seed",
    frame: 0,
    seed: 0x1c41313,
    verdict: 1,
    pulse: 0,
  };

  function rand() {
    let x = state.seed >>> 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    state.seed = x >>> 0;
    return state.seed / 0x100000000;
  }

  function resize() {
    state.dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
    state.w = innerWidth;
    state.h = innerHeight;
    canvas.width = Math.round(state.w * state.dpr);
    canvas.height = Math.round(state.h * state.dpr);
    canvas.style.width = state.w + "px";
    canvas.style.height = state.h + "px";
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.spacing = Math.max(38, Math.min(62, Math.round(Math.min(state.w, state.h) / 13)));
    state.cols = Math.ceil(state.w / state.spacing) + 4;
    state.rows = Math.ceil(state.h / state.spacing) + 4;
    if (!state.queen.x && !state.queen.y) {
      state.queen.x = Math.floor(state.cols / 2);
      state.queen.y = Math.floor(state.rows / 2);
      state.queen.tx = state.queen.x;
      state.queen.ty = state.queen.y;
    }
    draw(performance.now(), true);
  }

  function screenFromGrid(gx, gy) {
    const ox = state.w / 2 - (state.cols / 2) * state.spacing;
    const oy = state.h / 2 - (state.rows / 2) * state.spacing;
    return [ox + gx * state.spacing, oy + gy * state.spacing];
  }

  function gridFromScreen(x, y) {
    const ox = state.w / 2 - (state.cols / 2) * state.spacing;
    const oy = state.h / 2 - (state.rows / 2) * state.spacing;
    return {
      x: Math.max(1, Math.min(state.cols - 2, Math.round((x - ox) / state.spacing))),
      y: Math.max(1, Math.min(state.rows - 2, Math.round((y - oy) / state.spacing))),
    };
  }

  function authority(nx, ny) {
    const inside = nx > 0 && nx < state.cols - 1 && ny > 0 && ny < state.rows - 1;
    const checksum = ((nx * 31) ^ (ny * 17) ^ state.queen.depth) >>> 0;
    return inside && checksum % 13 !== 0;
  }

  function chooseStep() {
    let dx = 0, dy = 0;
    const qx = Math.round(state.queen.tx);
    const qy = Math.round(state.queen.ty);
    if (state.target) {
      dx = Math.sign(state.target.x - qx);
      dy = Math.sign(state.target.y - qy);
      if (dx && dy && rand() < 0.5) dx = 0; else if (dx && dy) dy = 0;
      if (!dx && !dy) state.target = null;
    }
    if (!dx && !dy) {
      const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      [dx,dy] = dirs[Math.floor(rand() * dirs.length)];
    }

    const nx = qx + dx;
    const ny = qy + dy;
    state.verdict = authority(nx, ny) ? 1 : 0;
    state.pulse = 1;

    if (state.verdict) {
      state.trail.push({ x: qx, y: qy, depth: state.queen.depth, age: 1 });
      if (state.trail.length > 28) state.trail.shift();
      state.queen.tx = nx;
      state.queen.ty = ny;
      const burrow = rand();
      if (burrow < 0.22) state.queen.depth = Math.min(12, state.queen.depth + 1);
      else if (burrow > 0.86) state.queen.depth = Math.max(0, state.queen.depth - 1);
    }
  }

  function drawGrid(t) {
    ctx.save();
    ctx.lineWidth = 1;
    const [ox, oy] = screenFromGrid(0, 0);
    for (let x = 0; x < state.cols; x++) {
      const sx = ox + x * state.spacing;
      const major = x % 4 === 0;
      ctx.strokeStyle = major ? "rgba(84,217,255,.105)" : "rgba(130,158,205,.052)";
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, state.h); ctx.stroke();
    }
    for (let y = 0; y < state.rows; y++) {
      const sy = oy + y * state.spacing;
      const major = y % 4 === 0;
      ctx.strokeStyle = major ? "rgba(155,114,255,.085)" : "rgba(130,158,205,.048)";
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(state.w, sy); ctx.stroke();
    }

    const phase = t * 0.0008;
    for (let x = 1; x < state.cols - 1; x++) {
      for (let y = 1; y < state.rows - 1; y++) {
        const [sx, sy] = screenFromGrid(x, y);
        const hash = ((x * 73856093) ^ (y * 19349663)) >>> 0;
        const depth = hash % 5;
        const alpha = 0.11 + 0.035 * Math.sin(phase + hash % 31);
        ctx.fillStyle = `rgba(124,173,214,${alpha})`;
        ctx.beginPath(); ctx.arc(sx, sy, 1.45, 0, Math.PI * 2); ctx.fill();
        if (depth > 2 && ((x + y) % 5 === 0)) {
          ctx.strokeStyle = "rgba(255,122,26,.055)";
          ctx.beginPath(); ctx.arc(sx, sy, 4 + depth * 1.25, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawTrail() {
    ctx.save();
    for (const p of state.trail) {
      p.age *= 0.975;
      const [x, y] = screenFromGrid(p.x, p.y);
      ctx.fillStyle = `rgba(84,217,255,${0.18 * p.age})`;
      ctx.beginPath(); ctx.arc(x, y, 2.3 + p.depth * 0.14, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawQueen() {
    state.queen.x += (state.queen.tx - state.queen.x) * 0.13;
    state.queen.y += (state.queen.ty - state.queen.y) * 0.13;
    const [x, y] = screenFromGrid(state.queen.x, state.queen.y);
    const r = 7 + state.queen.depth * 1.35;
    state.pulse *= 0.94;

    ctx.save();
    ctx.shadowBlur = 28;
    ctx.shadowColor = state.verdict ? "rgba(101,239,170,.62)" : "rgba(255,91,67,.62)";
    ctx.strokeStyle = state.verdict ? "rgba(101,239,170,.86)" : "rgba(255,91,67,.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r + state.pulse * 10, 0, Math.PI * 2); ctx.stroke();

    for (let i = 0; i < Math.min(6, state.queen.depth + 1); i++) {
      ctx.strokeStyle = `rgba(255,122,26,${0.44 - i * 0.055})`;
      ctx.beginPath(); ctx.arc(x, y, Math.max(2.5, r - i * 2.2), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = "rgba(238,244,248,.96)";
    ctx.beginPath(); ctx.arc(x, y, 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function draw(t, once = false) {
    state.frame++;
    ctx.clearRect(0, 0, state.w, state.h);
    drawGrid(t);
    drawTrail();
    drawQueen();

    if (!reduced && !once) {
      if (t - state.lastStep > 720) {
        chooseStep();
        state.lastStep = t;
      }
      requestAnimationFrame(draw);
    }
  }

  function pulseWord(word) {
    words.forEach(w => w.classList.remove("active"));
    word.classList.add("active");
    state.activePlane = word.dataset.plane;
    state.pulse = 1;
    setTimeout(() => word.classList.remove("active"), 430);
  }

  for (const word of words) {
    word.addEventListener("pointerenter", () => pulseWord(word));
    word.addEventListener("click", () => {
      pulseWord(word);
      const r = word.getBoundingClientRect();
      state.target = gridFromScreen(r.left + r.width / 2, r.top + r.height / 2);
    });
  }

  addEventListener("pointerdown", (event) => {
    if (event.target.closest?.(".word")) return;
    state.target = gridFromScreen(event.clientX, event.clientY);
  }, { passive: true });

  addEventListener("keydown", (event) => {
    const map = { ArrowUp:[1,0], ArrowDown:[-1,0], ArrowRight:[0,1], ArrowLeft:[0,-1] };
    const d = map[event.key];
    if (!d) return;
    event.preventDefault();
    const nx = Math.round(state.queen.tx) + d[0];
    const ny = Math.round(state.queen.ty) + d[1];
    state.verdict = authority(nx, ny) ? 1 : 0;
    state.pulse = 1;
    if (state.verdict) { state.queen.tx = nx; state.queen.ty = ny; }
  });

  addEventListener("resize", resize, { passive: true });
  resize();
  if (!reduced) requestAnimationFrame(draw);
})();
