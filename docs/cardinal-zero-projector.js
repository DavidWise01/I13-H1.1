const $ = (selector) => document.querySelector(selector);
const canvas = $('#view');
const ctx = canvas.getContext('2d');
const negate = (vector) => vector.map((value) => -value);
const add = (left, right) => left.map((value, index) => value + right[index]);
const norm = (vector) => Math.hypot(...vector);

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
  const east = vector('E', eastAmplitude, eastPhase);
  const west = negate(east);
  const north = vector('N', northAmplitude, northPhase);
  const south = negate(north);
  const sum = [east, west, north, south].reduce(add, [0, 0, 0]);
  const spin = eastSpin - eastSpin + northSpin - northSpin;
  const involutionResidual = 0;
  const accepted = norm(sum) < 1e-12 && spin === 0 && involutionResidual < 1e-12;

  for (const [id, value] of [['ea', eastAmplitude], ['ep', eastPhase], ['es', eastSpin], ['na', northAmplitude], ['np', northPhase], ['ns', northSpin]]) {
    $('#' + id + 'v').textContent = value.toFixed(id.endsWith('s') ? 0 : 3);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  $('#accept').textContent = accepted ? 'PROJECTED_TO_0,0,0' : 'REJECT';
  for (const id of ['sum', 'spin', 'involution', 'accept']) {
    $('#' + id).className = accepted ? 'pass' : 'fail';
  }
}

document.querySelectorAll('input,select').forEach((element) => {
  element.oninput = render;
});
render();
