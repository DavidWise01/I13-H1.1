const $ = (selector) => document.querySelector(selector);
const canvas = $('#view');
const ctx = canvas.getContext('2d');
const negate = (vector) => vector.map((value) => -value);
const add = (left, right) => left.map((value, index) => value + right[index]);
const norm = (vector) => Math.hypot(...vector);
let pulseSerial = 0;

function controller(threat, coherence, wall) {
  const g1 = threat > coherence ? 'HIDE' : 'ASSIMILATE';
  const g2 = coherence > threat + 20 ? 'EXPAND' : 'COLLAPSE';
  const g3 = wall === 27 ? (g2 === 'EXPAND' ? 'MOVE' : 'WAIT') : 'MOVE';
  const mode = g1 === 'HIDE' && g2 === 'COLLAPSE' && g3 === 'WAIT' ? 'FLIGHT' : 'COUPLED';
  return { g1, g2, g3, mode };
}

function vector(axis, amplitude, phase) {
  return axis === 'E'
    ? [amplitude * Math.cos(phase), 0, amplitude * Math.sin(phase)]
    : [0, amplitude * Math.cos(phase), amplitude * Math.sin(phase)];
}

function project(vector3) {
  return [
    canvas.width / 2 + (vector3[0] + 0.42 * vector3[2]) * 250,
    canvas.height / 2 - (vector3[1] - 0.28 * vector3[2]) * 250,
  ];
}

function arrow(vector3, color, label) {
  const origin = project([0, 0, 0]);
  const end = project(vector3);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(...origin);
  ctx.lineTo(...end);
  ctx.stroke();
  const angle = Math.atan2(end[1] - origin[1], end[0] - origin[0]);
  ctx.beginPath();
  ctx.moveTo(...end);
  ctx.lineTo(end[0] - 12 * Math.cos(angle - 0.45), end[1] - 12 * Math.sin(angle - 0.45));
  ctx.lineTo(end[0] - 12 * Math.cos(angle + 0.45), end[1] - 12 * Math.sin(angle + 0.45));
  ctx.fill();
  ctx.font = 'bold 14px monospace';
  ctx.fillText(label, end[0] + 8, end[1] - 8);
}

function interactionSurface(nature, nurture) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const circleRadius = 86 + nature * 0.42;
  const squareSize = 172 + nurture * 0.42;
  ctx.save();
  ctx.fillStyle = 'rgba(255,114,155,.075)';
  ctx.strokeStyle = 'rgba(255,114,155,.52)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX - 64, centerY, circleRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(98,233,255,.055)';
  ctx.strokeStyle = 'rgba(98,233,255,.48)';
  ctx.strokeRect(centerX + 64 - squareSize / 2, centerY - squareSize / 2, squareSize, squareSize);
  ctx.fillRect(centerX + 64 - squareSize / 2, centerY - squareSize / 2, squareSize, squareSize);
  ctx.setLineDash([3, 7]);
  ctx.strokeStyle = 'rgba(98,233,255,.22)';
  for (let offset = -squareSize / 2 + 18; offset < squareSize / 2; offset += 18) {
    ctx.beginPath();
    ctx.moveTo(centerX + 64 - squareSize / 2, centerY + offset);
    ctx.lineTo(centerX + 64 + squareSize / 2, centerY + offset);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#ff9bb7';
  ctx.fillText('NATURE · ENTROPY · PROPAGATION', 22, 24);
  ctx.fillStyle = '#8ef1ff';
  ctx.fillText('NURTURE · STRUCTURE · LATTICE', canvas.width - 258, 24);
  ctx.fillStyle = '#ffd375';
  ctx.fillText('G1 → G2 → G3', centerX - 44, centerY - 48);
  ctx.restore();
}

function quartzCore() {
  const [x, y] = project([0, 0, 0]);
  const facets = [
    { points: [[x, y - 28], [x - 22, y - 7], [x, y]], fill: 'rgba(210,245,255,.92)' },
    { points: [[x, y - 28], [x + 22, y - 7], [x, y]], fill: 'rgba(117,221,255,.72)' },
    { points: [[x - 22, y - 7], [x, y], [x - 14, y + 25]], fill: 'rgba(157,181,255,.68)' },
    { points: [[x + 22, y - 7], [x, y], [x + 14, y + 25]], fill: 'rgba(86,159,224,.72)' },
    { points: [[x, y], [x - 14, y + 25], [x + 14, y + 25]], fill: 'rgba(223,248,255,.82)' },
  ];
  ctx.save();
  ctx.shadowColor = '#7deaff';
  ctx.shadowBlur = 22;
  for (const facet of facets) {
    ctx.beginPath();
    ctx.moveTo(...facet.points[0]);
    facet.points.slice(1).forEach((point) => ctx.lineTo(...point));
    ctx.closePath();
    ctx.fillStyle = facet.fill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(235,252,255,.9)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#dffbff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('QUARTZ · 0,0,0', x + 28, y + 4);
}

function render() {
  const eastAmplitude = +$('#ea').value;
  const eastPhase = +$('#ep').value;
  const eastSpin = +$('#es').value;
  const northAmplitude = +$('#na').value;
  const northPhase = +$('#np').value;
  const northSpin = +$('#ns').value;
  const threat = +$('#threat').value;
  const coherence = +$('#coherence').value;
  const wall = +$('#wall').value;
  const catalyst = controller(threat, coherence, wall);
  const east = vector('E', eastAmplitude, eastPhase);
  const west = negate(east);
  const north = vector('N', northAmplitude, northPhase);
  const south = negate(north);
  const sum = [east, west, north, south].reduce(add, [0, 0, 0]);
  const spin = eastSpin - eastSpin + northSpin - northSpin;
  const involutionResidual = 0;
  const accepted = norm(sum) < 1e-12 && spin === 0 && involutionResidual < 1e-12;

  for (const [id, value] of [['ea', eastAmplitude], ['ep', eastPhase], ['es', eastSpin], ['na', northAmplitude], ['np', northPhase], ['ns', northSpin], ['threat', threat], ['coherence', coherence], ['wall', wall]]) {
    $('#' + id + 'v').textContent = value.toFixed(id.endsWith('s') ? 0 : 3);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  interactionSurface(threat, coherence);
  ctx.strokeStyle = '#263647';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, canvas.height / 2);
  ctx.lineTo(canvas.width - 40, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, 30);
  ctx.lineTo(canvas.width / 2, canvas.height - 30);
  ctx.stroke();
  arrow(east, '#62e9ff', 'E');
  arrow(west, '#ff729b', 'W');
  arrow(north, '#ffd375', 'N');
  arrow(south, '#65f3a5', 'S');
  quartzCore();

  const channels = [['E', east, eastSpin], ['W', west, -eastSpin], ['N', north, northSpin], ['S', south, -northSpin]];
  $('#channels').innerHTML = channels.map(([name, values, channelSpin]) =>
    '<div class="channel"><b>' + name + '</b>[' + values.map((value) => value.toFixed(3)).join(', ') + ']<br>spin ' + (channelSpin > 0 ? '+' : '') + channelSpin + '</div>'
  ).join('');
  $('#sum').textContent = '(' + sum.map((value) => value.toExponential(1)).join(', ') + ')';
  $('#spin').textContent = spin;
  $('#involution').textContent = involutionResidual.toExponential(1);
  $('#catalyst').textContent = catalyst.mode;
  $('#accept').textContent = accepted ? 'PROJECTED_TO_0,0,0' : 'REJECT';
  $('#g1 b').textContent = catalyst.g1;
  $('#g2 b').textContent = catalyst.g2;
  $('#g3 b').textContent = catalyst.g3;
  for (const id of ['sum', 'spin', 'involution', 'catalyst', 'accept']) {
    $('#' + id).className = accepted ? 'pass' : 'fail';
  }
}

function pulse() {
  const serial = ++pulseSerial;
  ['g1', 'g2', 'g3'].forEach((id) => $('#' + id).classList.remove('active'));
  ['g1', 'g2', 'g3'].forEach((id, index) => {
    setTimeout(() => {
      if (serial !== pulseSerial) return;
      ['g1', 'g2', 'g3'].forEach((stage) => $('#' + stage).classList.remove('active'));
      $('#' + id).classList.add('active');
      if (id === 'g3') setTimeout(() => serial === pulseSerial && $('#' + id).classList.remove('active'), 420);
    }, index * 420);
  });
}

document.querySelectorAll('input,select').forEach((element) => {
  element.oninput = render;
});
$('#pulse').onclick = pulse;
render();
