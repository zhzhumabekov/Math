const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const fmt = (x, d = 3) => (+x.toFixed(d)).toLocaleString('ru-RU', { maximumFractionDigits: d });
const sfmt = (x, d = 2) => (x < 0 ? '−' : '') + fmt(Math.abs(x), d);
const chipsHTML = list => list.map(c => `<span class="chip fade">${c}</span>`).join('');
const sgn = n => (n < 0 ? '−' + num(-n) : num(n));
const par = n => (n < 0 ? `(${sgn(n)})` : num(n));
const V = s => `<span class="vec">${s}</span>`;
const vec = (...xs) => `(${xs.map(x => sfmt(x, 2)).join('; ')})`;

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function style(node, css) { Object.assign(node.style, css); return node; }
function bindRange(id, onChange) {
  const input = $(id);
  input.addEventListener('input', onChange);
  return () => +input.value;
}
const restart = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
const text = (svg, x, y, s, attrs = {}, color = 'var(--ink)') => {
  const t = el('text', { x, y, 'font-size': 13, 'text-anchor': 'middle', ...attrs }, svg);
  t.textContent = s; style(t, { fill: color });
  return t;
};
const later = (node, ms, cls = 'fade') => { style(node, { animationDelay: ms + 'ms' }).classList.add(cls); return node; };

// координатная плоскость: сетка, оси, подписи
function plane(svg, { W = 560, H = 340, x0, x1, y0, y1, sx = 1, sy = 1 }) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const X = v => ((v - x0) / (x1 - x0)) * W, Y = v => H - ((v - y0) / (y1 - y0)) * H;
  const ly = Math.min(Math.max(Y(0) + 14, 14), H - 5), lx = Math.min(Math.max(X(0) - 5, 26), W - 5);
  for (let i = Math.ceil(x0 / sx); i * sx <= x1; i++) {
    const v = i * sx;
    style(el('line', { x1: X(v), y1: 0, x2: X(v), y2: H }, svg), { stroke: v ? 'var(--line)' : 'var(--muted)', strokeWidth: v ? 1 : 1.5 });
    if (v) text(svg, X(v), ly, fmt(v), { 'font-size': 10 }, 'var(--muted)');
  }
  for (let i = Math.ceil(y0 / sy); i * sy <= y1; i++) {
    const v = i * sy;
    style(el('line', { x1: 0, y1: Y(v), x2: W, y2: Y(v) }, svg), { stroke: v ? 'var(--line)' : 'var(--muted)', strokeWidth: v ? 1 : 1.5 });
    if (v) text(svg, lx, Y(v) + 4, fmt(v), { 'font-size': 10, 'text-anchor': 'end' }, 'var(--muted)');
  }
  return { X, Y, W, H };
}
// стрелка из (x1; y1) в (x2; y2) в координатах графика; подпись — у середины, сбоку от стрелки
function arrow(parent, P, x1, y1, x2, y2, color, { w = 4, label = '', dash = '' } = {}) {
  const g = el('g', {}, parent);
  const X1 = P.X(x1), Y1 = P.Y(y1), X2 = P.X(x2), Y2 = P.Y(y2), L = Math.hypot(X2 - X1, Y2 - Y1);
  if (L < 2) { style(el('circle', { cx: X1, cy: Y1, r: 5 }, g), { fill: color }); return g; }
  const ux = (X2 - X1) / L, uy = (Y2 - Y1) / L, h = Math.min(16, L * 0.45), bx = X2 - ux * h, by = Y2 - uy * h;
  style(el('line', { x1: X1, y1: Y1, x2: bx, y2: by, 'stroke-dasharray': dash }, g), { stroke: color, strokeWidth: w, strokeLinecap: 'round' });
  style(el('polygon', { points: `${X2},${Y2} ${bx - uy * h * 0.55},${by + ux * h * 0.55} ${bx + uy * h * 0.55},${by - ux * h * 0.55}` }, g), { fill: color });
  if (label) text(g, (X1 + X2) / 2 - uy * 16, (Y1 + Y2) / 2 + ux * 16 + 5, label, { 'font-weight': 800, 'font-size': 15, 'font-style': 'italic' }, color);
  return g;
}
const dot = (parent, P, x, y, color, r = 6) => style(el('circle', { cx: P.X(x), cy: P.Y(y), r }, parent), { fill: color, stroke: 'var(--card)', strokeWidth: 2 });

// ---------- 1. Что такое вектор ----------
const vx1 = bindRange('vx1', () => { copies1 = []; render1(); }), vy1 = bindRange('vy1', () => { copies1 = []; render1(); });
let copies1 = [];
function render1() {
  const x = vx1(), y = vy1();
  $('vx1v').textContent = sgn(x); $('vy1v').textContent = sgn(y);
  $('f1').innerHTML = `${V('a')} = (<span style="color:var(--b)">${sgn(x)}</span>; <span style="color:var(--a)">${sgn(y)}</span>)`;
  const svg = $('p1'), P = plane(svg, { W: 420, H: 420, x0: -8, x1: 8, y0: -8, y1: 8 });
  if (x || y) {
    style(el('path', { d: `M${P.X(0)},${P.Y(0)} H${P.X(x)} V${P.Y(y)}`, fill: 'none', 'stroke-dasharray': '5 4' }, svg), { stroke: 'var(--muted)', strokeWidth: 2 });
    if (x) text(svg, P.X(x / 2), P.Y(0) + (y >= 0 ? 18 : -8), `${sgn(x)}`, { 'font-weight': 700 }, 'var(--b)');
    if (y) text(svg, P.X(x) + (x >= 0 ? 14 : -14), P.Y(y / 2) + 4, `${sgn(y)}`, { 'font-weight': 700 }, 'var(--a)');
  }
  copies1.forEach(([sx, sy], i) => later(arrow(svg, P, sx, sy, sx + x, sy + y, 'var(--c)', { w: 3 }), i === copies1.length - 1 ? 0 : -1, 'pop'));
  arrow(svg, P, 0, 0, x, y, 'var(--ink)', { w: 5, label: 'a' });
  $('i1').innerHTML = chipsHTML([
    `${Math.abs(x)} шаг. ${x >= 0 ? 'вправо' : 'влево'}, ${Math.abs(y)} шаг. ${y >= 0 ? 'вверх' : 'вниз'}`,
    copies1.length ? `<span style="color:var(--c)">зелёные стрелки</span> — тот же вектор ${vec(x, y)}, просто из других точек` : 'нажмите «Перенести стрелку»',
    x || y ? 'вектор = направление + длина' : '(0; 0) — нулевой вектор: никуда не двигаемся']);
}
$('copy1').onclick = () => {
  if (copies1.length >= 4) copies1 = [];
  const x = vx1(), y = vy1(), lo = v => Math.max(-7, -7 - v), hi = v => Math.min(7, 7 - v);
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  copies1.push([r(lo(x), hi(x)), r(lo(y), hi(y))]);
  render1();
};

// ---------- 2. Сложение ----------
let added2 = false;
const r2 = ['ax2', 'ay2', 'bx2', 'by2'].map(id => bindRange(id, () => render2(false)));
$('add2').onclick = () => { added2 = !added2; render2(added2); };
function render2(animate) {
  const [ax, ay, bx, by] = r2.map(f => f()), sx = ax + bx, sy = ay + by;
  ['ax2', 'ay2', 'bx2', 'by2'].forEach((id, i) => $(id + 'v').textContent = sgn([ax, ay, bx, by][i]));
  $('add2').textContent = added2 ? '↺ Сначала' : 'Сложить ▶';
  $('f2').innerHTML = `${V('a')} + ${V('b')} = ` + (added2 ? `${vec(ax, ay)} + ${vec(bx, by)} = <span style="color:var(--a)">${vec(sx, sy)}</span>` : '?');
  const svg = $('p2'), P = plane(svg, { W: 420, H: 420, x0: -10, x1: 10, y0: -10, y1: 10, sx: 2, sy: 2 });
  if (added2) {
    later(arrow(svg, P, 0, 0, bx, by, 'var(--gold)', { w: 2, dash: '5 4' }), animate ? 900 : 0);
    later(arrow(svg, P, bx, by, sx, sy, 'var(--b)', { w: 2, dash: '5 4' }), animate ? 900 : 0);
  }
  arrow(svg, P, 0, 0, ax, ay, 'var(--b)', { label: 'a' });
  const b = arrow(svg, P, 0, 0, bx, by, 'var(--gold)', { label: 'b' });
  b.classList.add('move');
  const shift = `translate(${P.X(ax) - P.X(0)}px, ${P.Y(ay) - P.Y(0)}px)`;
  if (added2 && animate) requestAnimationFrame(() => requestAnimationFrame(() => { b.style.transform = shift; }));
  else if (added2) b.style.transform = shift;
  if (added2) later(arrow(svg, P, 0, 0, sx, sy, 'var(--a)', { w: 5, label: 'a + b' }), animate ? 650 : 0);
  $('i2').innerHTML = chipsHTML(added2
    ? [`x: ${sgn(ax)} + ${par(bx)} = ${sgn(sx)}`, `y: ${sgn(ay)} + ${par(by)} = ${sgn(sy)}`, 'пунктир: b + a — тот же результат (параллелограмм)']
    : ['синяя — a, жёлтая — b', 'нажмите «Сложить»: b переедет в конец a']);
}

// ---------- 3. Умножение на число ----------
const k3 = bindRange('k3', render3), ax3 = bindRange('ax3', render3), ay3 = bindRange('ay3', render3);
function render3() {
  const k = k3(), x = ax3(), y = ay3();
  $('k3v').textContent = sfmt(k, 1); $('ax3v').textContent = sgn(x); $('ay3v').textContent = sgn(y);
  $('f3').innerHTML = `${sfmt(k, 1)} · ${vec(x, y)} = <span style="color:var(--a)">${vec(k * x, k * y)}</span>`;
  const svg = $('p3'), P = plane(svg, { W: 420, H: 420, x0: -10, x1: 10, y0: -10, y1: 10, sx: 2, sy: 2 });
  style(el('line', { x1: P.X(-10 * x), y1: P.Y(-10 * y), x2: P.X(10 * x), y2: P.Y(10 * y), 'stroke-dasharray': '3 5' }, svg), { stroke: 'var(--muted)' });
  arrow(svg, P, 0, 0, k * x, k * y, 'var(--a)', { w: 6, label: k === 1 ? '' : `${sfmt(k, 1)}a` });
  arrow(svg, P, 0, 0, x, y, 'var(--b)', { w: 3, label: 'a' });
  for (let m = -2; m <= 3; m++) if (m && m !== 1) dot(svg, P, m * x, m * y, 'var(--muted)', 3.5);
  $('i3').innerHTML = chipsHTML([
    k > 1 ? `k > 1 — стрелка длиннее в ${fmt(k, 1)} раза` : k > 0 && k < 1 ? 'от 0 до 1 — стрелка короче' : k === 1 ? 'k = 1 — ничего не меняется'
      : k === 0 ? 'k = 0 — нулевой вектор (0; 0)' : `k < 0 — стрелка развернулась${k < -1 ? ` и стала длиннее в ${fmt(-k, 1)} раза` : ''}`,
    `x: ${sfmt(k, 1)}·${par(x)} = ${sfmt(k * x, 1)}, y: ${sfmt(k, 1)}·${par(y)} = ${sfmt(k * y, 1)}`,
    'все k·a лежат на одной прямой (пунктир)']);
}

// ---------- 4. Разность ----------
const r4 = ['ax4', 'ay4', 'bx4', 'by4'].map(id => bindRange(id, render4));
function render4() {
  const [ax, ay, bx, by] = r4.map(f => f()), dx = bx - ax, dy = by - ay;
  ['ax4', 'ay4', 'bx4', 'by4'].forEach((id, i) => $(id + 'v').textContent = sgn([ax, ay, bx, by][i]));
  $('f4').innerHTML = `AB = B − A = (${sgn(bx)} − ${par(ax)}; ${sgn(by)} − ${par(ay)}) = <span style="color:var(--gold)">${vec(dx, dy)}</span>`;
  const svg = $('p4'), P = plane(svg, { W: 420, H: 420, x0: -8, x1: 8, y0: -8, y1: 8 });
  arrow(svg, P, 0, 0, ax, ay, 'var(--b)', { w: 2, dash: '5 4' });
  arrow(svg, P, 0, 0, bx, by, 'var(--c)', { w: 2, dash: '5 4' });
  style(el('path', { d: `M${P.X(ax)},${P.Y(ay)} H${P.X(bx)} V${P.Y(by)}`, fill: 'none', 'stroke-dasharray': '2 4' }, svg), { stroke: 'var(--muted)', strokeWidth: 2 });
  arrow(svg, P, ax, ay, bx, by, 'var(--gold)', { w: 5 });
  dot(svg, P, ax, ay, 'var(--b)', 7); dot(svg, P, bx, by, 'var(--c)', 7);
  text(svg, P.X(ax) - 12, P.Y(ay) - 10, 'A', { 'font-weight': 800, 'font-size': 16 }, 'var(--b)');
  text(svg, P.X(bx) + 12, P.Y(by) - 10, 'B', { 'font-weight': 800, 'font-size': 16 }, 'var(--c)');
  $('i4').innerHTML = chipsHTML([
    `из A в B: ${Math.abs(dx)} ${dx >= 0 ? 'вправо' : 'влево'}, ${Math.abs(dy)} ${dy >= 0 ? 'вверх' : 'вниз'}`,
    `обратно, из B в A: A − B = ${vec(-dx, -dy)}`,
    'проверка: A + AB = B']);
}

// ---------- 5. Вектор признаков ----------
const SUBJ = ['Матем.', 'Физика', 'Русский', 'Англ.', 'Информ.'];
const ANYA = [72, 64, 88, 55, 91], BORIS = [85, 70, 60, 78, 95];
let op5 = 'show';
const k5 = bindRange('k5', render5);
document.querySelectorAll('[data-op5]').forEach(b => b.onclick = () => {
  op5 = b.dataset.op5;
  document.querySelectorAll('[data-op5]').forEach(x => x.classList.toggle('on', x === b));
  render5();
});
function render5() {
  const k = k5(), svg = $('p5'), W = 560, H = 260;
  $('k5v').textContent = fmt(k, 2);
  svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${W} ${H + 30}`);
  const series = op5 === 'show' ? [[ANYA, 'var(--b)', 'Аня'], [BORIS, 'var(--gold)', 'Борис']]
    : op5 === 'diff' ? [[BORIS.map((b, i) => b - ANYA[i]), null, 'Б − А']]
    : op5 === 'mean' ? [[ANYA.map((a, i) => (a + BORIS[i]) / 2), 'var(--c)', 'среднее']]
    : [[ANYA, 'var(--line)', 'Аня'], [ANYA.map(a => Math.round(k * a * 10) / 10), 'var(--a)', `${fmt(k, 2)} · Аня`]];
  const lo = op5 === 'diff' ? -40 : 0, hi = op5 === 'diff' ? 40 : 115;
  const Y = v => 10 + ((hi - v) / (hi - lo)) * (H - 10), gw = (W - 20) / 5, bw = (gw * 0.7) / series.length;
  style(el('line', { x1: 10, y1: Y(0), x2: W - 10, y2: Y(0) }, svg), { stroke: 'var(--ink)', strokeWidth: 2 });
  SUBJ.forEach((s, i) => {
    text(svg, 10 + gw * i + gw / 2, H + 22, s, { 'font-size': 12 }, 'var(--muted)');
    series.forEach(([vals, color, name], j) => {
      const v = vals[i], x = 10 + gw * i + gw * 0.15 + j * bw, y = Math.min(Y(v), Y(0)), h = Math.abs(Y(v) - Y(0));
      const c = color || (v >= 0 ? 'var(--c)' : 'var(--a)');
      const r = el('rect', { x, y, width: bw - 3, height: Math.max(h, 1), rx: 3 }, svg);
      style(r, { fill: c, transformOrigin: v >= 0 ? 'bottom' : 'top' });
      later(r, i * 60 + j * 120, 'grow');
      later(text(svg, x + (bw - 3) / 2, v >= 0 ? Y(v) - 5 : Y(v) + 14, sfmt(v, 1), { 'font-size': 11, 'font-weight': 700 }), i * 60 + j * 120 + 300);
    });
  });
  $('lg5').innerHTML = series.map(([, c, n]) => `<span><i style="background:${c || 'var(--c)'}"></i>${n}</span>`).join('');
  const show = vals => `(${vals.map(v => fmt(v, 1)).join('; ')})`;
  const res = series[series.length - 1][0];
  $('f5').innerHTML = op5 === 'show' ? `А = ${show(ANYA)}<br>Б = ${show(BORIS)}`
    : `${series[series.length - 1][2]} = <span style="color:var(--a)">${show(res).replace(/-/g, '−')}</span>`;
  const info = {
    show: ['каждый ученик — вектор из 5 чисел', 'точка в 5-мерном пространстве'],
    diff: [`Борис впереди в ${res.filter(v => v > 0).length} предметах`, `Аня сильнее: ${SUBJ.filter((_, i) => res[i] < 0).join(', ')}`, 'вычитаем по каждой координате'],
    mean: ['среднее двух векторов — «середина» между ними', 'так считают «типичного» ученика класса'],
    scale: [`каждую оценку × ${fmt(k, 2)}`, 'все пропорции между предметами сохраняются'],
  }[op5];
  $('i5').innerHTML = chipsHTML(info);
}

// ---------- 6. Зачем нужны векторы ----------
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
let useTab = 'plane';
const COLORS = { 'красный': [230, 30, 30], 'жёлтый': [255, 215, 0], 'синий': [20, 80, 230], 'зелёный': [20, 170, 70], 'белый': [255, 255, 255], 'чёрный': [0, 0, 0] };
const colorSelect = (id, val) => `<select id="${id}" style="grid-column:1/-1">${Object.keys(COLORS).map(n => `<option${n === val ? ' selected' : ''}>${n}</option>`).join('')}</select>`;
const WORDS = { 'мужчина': [1, 1], 'женщина': [1, 4], 'король': [6, 1.4], 'королева': [6, 4.4], 'мальчик': [-2, 0.6], 'девочка': [-2, 3.6], 'принц': [3.5, 1.2], 'принцесса': [3.5, 4.2] };
const PUZZLES = [['король', 'мужчина', 'женщина'], ['принц', 'мальчик', 'девочка'], ['королева', 'женщина', 'мужчина'], ['мальчик', 'мужчина', 'король']];
const USES = {
  plane: {
    controls: slider('pV', 'Самолёт летит на восток, км/ч', 200, 900, 600, 50) +
      slider('wX', 'Ветер: на восток (+) / запад (−)', -150, 150, -50, 10) + slider('wY', 'Ветер: на север (+) / юг (−)', -150, 150, 120, 10),
    render() {
      const v = +$('pV').value, wx = +$('wX').value, wy = +$('wY').value, gx = v + wx, gy = wy;
      $('pVv').textContent = v; $('wXv').textContent = sgn(wx); $('wYv').textContent = sgn(wy);
      const speed = Math.hypot(gx, gy), angle = (Math.atan2(gy, gx) * 180) / Math.PI;
      $('useOut').innerHTML = `
        <div class="mid">${vec(v, 0)} + ${vec(wx, wy)} = <span style="color:var(--a)">${vec(gx, gy)}</span></div>
        <svg id="plSvg" class="plot" style="margin-top:10px"></svg>
        <div class="info">${chipsHTML([`скорость над землёй ≈ ${fmt(speed, 0)} км/ч`, wy ? `сносит на ${wy > 0 ? 'север' : 'юг'} на ${fmt(Math.abs(angle), 1)}°` : 'курс не сбивается',
          `чтобы лететь точно на восток, нужно добавить ${vec(0, -wy)}`])}</div>
        <p class="answer">Самолёт движется относительно воздуха, а воздух — относительно земли. Поэтому скорости <b>складываются как векторы</b>:
        отдельно восток-запад, отдельно север-юг. Штурман решает обратную задачу: какой курс взять, чтобы ветер не сбил с пути.</p>`;
      const P = plane($('plSvg'), { H: 300, x0: -100, x1: 1100, y0: -320, y1: 320, sx: 100, sy: 100 });
      later(arrow($('plSvg'), P, 0, 0, v, 0, 'var(--b)', { label: 'самолёт' }), 0);
      later(arrow($('plSvg'), P, v, 0, gx, gy, 'var(--gold)', { label: 'ветер' }), 300);
      later(arrow($('plSvg'), P, 0, 0, gx, gy, 'var(--a)', { w: 5, label: 'итог' }), 650);
      later(text($('plSvg'), P.X(gx), P.Y(gy) + 8, '✈️', { 'font-size': 22 }), 900, 'pop');
    },
  },
  game: {
    controls: slider('jX', 'Скорость вправо', 1, 8, 4) + slider('jY', 'Скорость вверх', 4, 14, 10) + slider('jG', 'Гравитация', 0.5, 2, 1, 0.5) +
      `<div class="btns"><button class="primary" id="jGo">Прыгнуть ▶</button></div>`,
    render() {
      const vx = +$('jX').value, vy0 = +$('jY').value, g = +$('jG').value;
      $('jXv').textContent = vx; $('jYv').textContent = vy0; $('jGv').textContent = fmt(g, 1);
      const pts = [[0, 0, vx, vy0]];
      let [x, y, vy] = [0, 0, vy0];
      while (pts.length < 60) { x += vx; y += vy; vy -= g; pts.push([x, Math.max(y, 0), vx, vy]); if (y <= 0) break; }
      const top = Math.max(...pts.map(p => p[1]));
      $('useOut').innerHTML = `
        <div class="mid">позиция += скорость, скорость += ${vec(0, -g)}</div>
        <svg id="jSvg" class="plot" style="margin-top:10px"></svg>
        <div class="info">${chipsHTML([`в воздухе ${pts.length - 1} кадров`, `высота прыжка ${fmt(top, 1)}`, `дальность ${fmt(pts[pts.length - 1][0], 1)}`])}</div>
        <p class="answer">Игровой движок хранит у персонажа два вектора: <b>позицию</b> и <b>скорость</b>. Каждый кадр к позиции прибавляется скорость,
        а к скорости — вектор гравитации (0; −${fmt(g, 1)}). Из двух сложений получается красивая парабола.</p>`;
      const xmax = Math.max(20, pts[pts.length - 1][0] + 4), ymax = Math.max(12, top * 1.25);
      const P = plane($('jSvg'), { H: 300, x0: -2, x1: xmax, y0: -2, y1: ymax, sx: 10, sy: 10 });
      pts.forEach(([px, py, svx, svy], i) => {
        const d = i * 110;
        if (i < pts.length - 1) later(arrow($('jSvg'), P, px, py, px + svx, py + svy, 'var(--gold)', { w: 2 }), d);
        later(dot($('jSvg'), P, px, py, i === pts.length - 1 ? 'var(--a)' : 'var(--b)', 6), d, 'pop');
      });
      $('jGo').onclick = () => USES.game.render();
    },
  },
  color: {
    controls: `<label class="r">Цвет A${colorSelect('cA', 'синий')}</label><label class="r">Цвет B${colorSelect('cB', 'жёлтый')}</label>` +
      slider('cT', 'Доля цвета B', 0, 1, 0.5, 0.05),
    render() {
      const A = COLORS[$('cA').value], B = COLORS[$('cB').value], t = +$('cT').value;
      $('cTv').textContent = Math.round(t * 100) + '%';
      const M = A.map((a, i) => Math.round((1 - t) * a + t * B[i])), rgb = c => `rgb(${c.join(',')})`;
      const bars = (c, x0) => c.map((v, i) => `<rect class="grow" x="${x0 + i * 26}" y="${130 - v / 2.2}" width="22" height="${v / 2.2 + 0.5}" rx="3"
        style="fill:${['#e4572e', '#5b9a2f', '#2e86ab'][i]};animation-delay:${i * 80}ms"/><text x="${x0 + i * 26 + 11}" y="148" text-anchor="middle" font-size="10" style="fill:var(--muted)">${'RGB'[i]}</text>`).join('');
      $('useOut').innerHTML = `
        <div class="mid" style="font-size:20px">(1 − t)·A + t·B = <span style="color:var(--a)">${vec(...M)}</span></div>
        <div class="swatches"><div class="swatch" style="background:${rgb(A)}"></div><b>+</b><div class="swatch" style="background:${rgb(B)}"></div>
          <b>=</b><div class="swatch big" style="background:${rgb(M)}"></div></div>
        <svg viewBox="0 0 560 155" style="margin-top:10px">
          <text x="50" y="14" font-size="12" text-anchor="middle" style="fill:var(--muted)">A ${vec(...A)}</text>${bars(A, 10)}
          <text x="270" y="14" font-size="12" text-anchor="middle" style="fill:var(--ink);font-weight:700">смесь ${vec(...M)}</text>${bars(M, 230)}
          <text x="490" y="14" font-size="12" text-anchor="middle" style="fill:var(--muted)">B ${vec(...B)}</text>${bars(B, 450)}
        </svg>
        <div class="info">${chipsHTML([`R: ${fmt(1 - t, 2)}·${A[0]} + ${fmt(t, 2)}·${B[0]} = ${M[0]}`, 'каждая координата — отдельно', 'так смешивает свет экрана, а не краски'])}</div>
        <p class="answer">Цвет на экране — вектор из трёх чисел (красный, зелёный, синий) от 0 до 255. Плавный переход от одного цвета к другому —
        это <b>сумма векторов с весами</b>: (1 − t)·A + t·B. Ползунок t от 0 до 1 проводит нас по отрезку между двумя точками-цветами.</p>`;
    },
  },
  words: {
    controls: `<label class="r">Задача<select id="wP" style="grid-column:1/-1">${PUZZLES.map(([a, b, c], i) => `<option value="${i}">${a} − ${b} + ${c} = ?</option>`).join('')}</select></label>`,
    render() {
      const [a, b, c] = PUZZLES[+$('wP').value], A = WORDS[a], B = WORDS[b], C = WORDS[c];
      const R = [A[0] - B[0] + C[0], A[1] - B[1] + C[1]];
      const near = Object.entries(WORDS).filter(([w]) => ![a, b, c].includes(w)).sort((p, q) => Math.hypot(p[1][0] - R[0], p[1][1] - R[1]) - Math.hypot(q[1][0] - R[0], q[1][1] - R[1]))[0][0];
      $('useOut').innerHTML = `
        <div class="mid">${a} − ${b} + ${c} ≈ <span style="color:var(--a)">${near}</span></div>
        <svg id="wSvg" class="plot" style="margin-top:10px"></svg>
        <div class="info">${chipsHTML([`${vec(...A)} − ${vec(...B)} + ${vec(...C)} = ${vec(...R)}`, `${c} − ${b} = ${vec(C[0] - B[0], C[1] - B[1])} — одно «направление смысла»`, `ближайшее слово — «${near}»`])}</div>
        <p class="answer">Нейросети превращают слова в векторы так, чтобы похожие слова оказались рядом. Тогда «разница смыслов» — тоже вектор:
        стрелка «${b} → ${c}» одинакова для всех пар. Прибавив её к «${a}», попадаем рядом со словом «${near}». В настоящих моделях у слова не 2, а сотни координат.</p>`;
      const P = plane($('wSvg'), { H: 300, x0: -3.5, x1: 7.8, y0: -0.6, y1: 5.6 });
      Object.entries(WORDS).forEach(([w, [x, y]]) => {
        const hl = w === near ? 'var(--a)' : [a, b, c].includes(w) ? 'var(--b)' : 'var(--muted)';
        dot($('wSvg'), P, x, y, hl, w === near ? 8 : 6);
        text($('wSvg'), P.X(x), P.Y(y) - 12, w, { 'font-size': 12, 'font-weight': 700 }, hl);
      });
      later(arrow($('wSvg'), P, B[0], B[1], C[0], C[1], 'var(--gold)', { w: 3, dash: '6 4' }), 0);
      later(arrow($('wSvg'), P, A[0], A[1], R[0], R[1], 'var(--gold)', { w: 4 }), 500);
      later(text($('wSvg'), P.X(R[0]), P.Y(R[1]) + 7, '★', { 'font-size': 22 }, 'var(--a)'), 900, 'pop');
    },
  },
};
function buildUse() {
  const u = USES[useTab];
  $('useCtl').innerHTML = u.controls;
  $('useCtl').querySelectorAll('input, select').forEach(i => i.addEventListener('input', () => u.render()));
  u.render();
}
document.querySelectorAll('[data-use]').forEach(b => b.addEventListener('click', () => {
  useTab = b.dataset.use;
  document.querySelectorAll('[data-use]').forEach(x => x.classList.toggle('on', x === b));
  buildUse();
}));

// ---------- 7. Проверь себя ----------
let q = {}, score = 0, tries = 0;
const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = arr => arr[rnd(0, arr.length - 1)];
const story = t => `<span style="font-size:20px;font-weight:600">${t}</span>`;
const nz = (lo, hi) => { let v; do { v = rnd(lo, hi); } while (!v); return v; };
const coord = () => (Math.random() < .5 ? ['x', 0] : ['y', 1]);
function newQuiz() {
  const type = rnd(0, 6), a = [rnd(-9, 9), rnd(-9, 9)], b = [rnd(-9, 9), rnd(-9, 9)], [cn, ci] = coord();
  if (type === 0) {
    q = { text: `${V('a')} = ${vec(...a)}, ${V('b')} = ${vec(...b)}. ${V('a')} + ${V('b')}: ${cn} = ?`, ans: a[ci] + b[ci], hint: `Складываем ${cn}-координаты: ${sgn(a[ci])} + ${par(b[ci])}.` };
  } else if (type === 1) {
    q = { text: `${V('a')} = ${vec(...a)}, ${V('b')} = ${vec(...b)}. ${V('b')} − ${V('a')}: ${cn} = ?`, ans: b[ci] - a[ci], hint: `Вычитаем ${cn}-координаты: ${sgn(b[ci])} − ${par(a[ci])}.` };
  } else if (type === 2) {
    const k = nz(-4, 5);
    q = { text: `${V('a')} = ${vec(...a)}. ${sgn(k)}·${V('a')}: ${cn} = ?`, ans: k * a[ci], hint: `Умножаем каждую координату: ${sgn(k)}·${par(a[ci])}.` };
  } else if (type === 3) {
    q = { text: `A${vec(...a)}, B${vec(...b)}. Вектор AB: ${cn} = ?`, ans: b[ci] - a[ci], hint: `AB = B − A: из конца вычитаем начало, ${sgn(b[ci])} − ${par(a[ci])}.` };
  } else if (type === 4) {
    const k = nz(2, 3);
    q = { text: `${V('a')} = ${vec(...a)}, ${V('b')} = ${vec(...b)}. ${k}${V('a')} − ${V('b')}: ${cn} = ?`, ans: k * a[ci] - b[ci], hint: `${k}·${par(a[ci])} − ${par(b[ci])}.` };
  } else if (type === 5) {
    const v = rnd(4, 9) * 100, wx = rnd(-8, 8) * 10, wy = nz(-8, 8) * 10, askX = Math.random() < .5;
    q = { text: story(`✈️ Самолёт: ${vec(v, 0)} км/ч, ветер: ${vec(wx, wy)} км/ч. Итоговая скорость — (x; y). ${askX ? 'x' : 'y'} = ?`),
          ans: askX ? v + wx : wy, hint: 'Скорости складываются покоординатно.' };
  } else {
    const n = rnd(2, 5), v = [rnd(1, 5), rnd(1, 9)];
    q = { text: story(`🎮 Персонаж в точке ${vec(...a)}, скорость ${vec(...v)} за кадр. Где он будет через ${n} кадра? ${cn} = ?`),
          ans: a[ci] + n * v[ci], hint: `Позиция + ${n}·скорость: ${sgn(a[ci])} + ${n}·${v[ci]}.` };
  }
  $('qTask').innerHTML = `<span class="fade" style="display:inline-block">${q.text}</span>`;
  $('qIn').value = ''; $('qMsg').textContent = '';
}
function check() {
  const raw = $('qIn').value.replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const v = parseFloat(raw), msg = $('qMsg');
  if (isNaN(v)) { msg.className = 'bad'; msg.textContent = 'Введите число.'; return; }
  tries++;
  if (Math.abs(v - q.ans) < 0.01) {
    score++; msg.className = 'ok fade'; msg.textContent = 'Верно! 🎉';
    setTimeout(newQuiz, 1300);
  } else {
    msg.className = 'bad'; msg.innerHTML = 'Не совсем. ' + q.hint;
    restart($('qBox'), 'shake');
  }
  $('qScore').textContent = `Счёт: ${score} из ${tries}`;
}
$('qCheck').onclick = check;
$('qNew').onclick = newQuiz;
$('qIn').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });

render1(); render2(false); render3(); render4(); render5(); buildUse(); newQuiz();
$('qScore').textContent = 'Счёт: 0 из 0';
