const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const fmt = (x, d = 3) => (+x.toFixed(d)).toLocaleString('ru-RU', { maximumFractionDigits: d });
const sfmt = (x, d = 2) => (x < 0 ? '−' : '') + fmt(Math.abs(x), d);
const chipsHTML = list => list.map(c => `<span class="chip fade">${c}</span>`).join('');
const sgn = n => (n < 0 ? '−' + num(-n) : num(n));
const par = n => (n < 0 ? `(${sgn(n)})` : num(n));
const vec = (...xs) => `(${xs.map(x => sfmt(x, 2)).join('; ')})`;
const dotp = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const len = a => Math.sqrt(dotp(a, a));
const rad = d => (d * Math.PI) / 180;

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
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
// строка-полоска: подпись, заполнение (доля 0…1), значение справа
const barHTML = (name, share, value, color, best = false, delay = 0) =>
  `<div class="bar${best ? ' best' : ''}"><span>${name}</span><span class="track"><span class="fill" style="display:block;width:${Math.max(0, Math.min(1, share)) * 100}%;background:${color};animation-delay:${delay}ms"></span></span><b>${value}</b></div>`;

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
const RAW = { X: v => v, Y: v => v };
// стрелка из (x1; y1) в (x2; y2) в координатах графика P (RAW — в пикселях SVG)
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

// ---------- 1. Сумма произведений: чек ----------
const ITEMS = [['🍎 Яблоки, кг', 120], ['🥛 Молоко', 90], ['🍞 Хлеб', 45], ['🍫 Шоколад', 110]];
$('ctl1').innerHTML = '<div class="mid">Сколько купить</div>' + ITEMS.map(([n], i) => slider('q1_' + i, n, 0, 5, [2, 1, 2, 3][i])).join('');
ITEMS.forEach((_, i) => $('q1_' + i).addEventListener('input', render1));
function render1() {
  const q = ITEMS.map((_, i) => +$('q1_' + i).value), p = ITEMS.map(x => x[1]), total = dotp(q, p);
  q.forEach((v, i) => $('q1_' + i + 'v').textContent = v);
  $('rc1').innerHTML = '<span class="nm"></span><span class="nm">q</span><span></span><span class="nm">p, ₽</span><span></span><span class="nm">q × p</span>' +
    ITEMS.map(([n], i) => `<span class="nm">${n}</span><span class="tok" style="background:var(--b)">${q[i]}</span><span class="eq">×</span>
      <span class="tok" style="background:var(--gold)">${p[i]}</span><span class="eq">=</span>
      <span class="tok pop" style="background:${q[i] ? 'var(--c)' : 'var(--line)'};animation-delay:${i * 180}ms">${q[i] * p[i]}</span>`).join('');
  $('f1').innerHTML = `<span class="fade" style="display:inline-block;animation-delay:800ms">q · p = ${q.map((v, i) => `${v}·${p[i]}`).join(' + ')} = <span style="color:var(--a)">${num(total)} ₽</span></span>`;
  $('i1').innerHTML = chipsHTML(['два вектора из 4 чисел → 4 произведения → одно число', 'порядок не важен: q · p = p · q',
    q.some(v => !v) ? 'товар с количеством 0 ничего не добавляет' : 'попробуйте поставить 0 у какого-нибудь товара']);
}

// ---------- 2. Угол и знак ----------
const ta2 = bindRange('ta2', render2), tb2 = bindRange('tb2', render2), lb2 = bindRange('lb2', render2);
function render2() {
  const A = 5, ta = ta2(), tb = tb2(), L = lb2();
  const a = [A * Math.cos(rad(ta)), A * Math.sin(rad(ta))], b = [L * Math.cos(rad(tb)), L * Math.sin(rad(tb))];
  const d = dotp(a, b), cos = d / (A * L), th = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  $('ta2v').textContent = ta + '°'; $('tb2v').textContent = tb + '°'; $('lb2v').textContent = fmt(L, 1);
  const col = Math.abs(d) < 0.05 ? 'var(--gold)' : d > 0 ? 'var(--c)' : 'var(--a)';
  $('f2').innerHTML = `a · b = <span style="color:${col}">${sfmt(Math.abs(d) < 0.005 ? 0 : d, 2)}</span><br><span style="font-size:18px;color:var(--muted)">угол θ = ${fmt(th, 0)}°</span>`;
  const svg = $('p2'), P = plane(svg, { W: 420, H: 420, x0: -7, x1: 7, y0: -7, y1: 7 });
  style(el('line', { x1: P.X(-a[0] * 2), y1: P.Y(-a[1] * 2), x2: P.X(a[0] * 2), y2: P.Y(a[1] * 2), 'stroke-dasharray': '3 5' }, svg), { stroke: 'var(--muted)' });
  const k = d / (A * A), foot = [a[0] * k, a[1] * k];
  style(el('line', { x1: P.X(0), y1: P.Y(0), x2: P.X(foot[0]), y2: P.Y(foot[1]) }, svg), { stroke: col, strokeWidth: 12, strokeOpacity: .35, strokeLinecap: 'round' });
  style(el('line', { x1: P.X(b[0]), y1: P.Y(b[1]), x2: P.X(foot[0]), y2: P.Y(foot[1]), 'stroke-dasharray': '5 4' }, svg), { stroke: 'var(--muted)', strokeWidth: 2 });
  const delta = ((tb - ta + 540) % 360) - 180;
  let arc = '';
  for (let s = 0; s <= 30; s++) {
    const t = rad(ta + (delta * s) / 30);
    arc += (s ? 'L' : 'M') + P.X(1.3 * Math.cos(t)) + ',' + P.Y(1.3 * Math.sin(t));
  }
  style(el('path', { d: arc, fill: 'none' }, svg), { stroke: col, strokeWidth: 3 });
  arrow(svg, P, 0, 0, ...a, 'var(--b)', { label: 'a' });
  arrow(svg, P, 0, 0, ...b, 'var(--gold)', { label: 'b' });
  $('i2').innerHTML = chipsHTML([
    `a = ${vec(...a)}, b = ${vec(...b)}`,
    `по координатам: ${sfmt(a[0], 2)}·${sfmt(b[0], 2)} + ${sfmt(a[1], 2)}·${sfmt(b[1], 2)} = ${sfmt(d, 2)}`,
    `через угол: 5 · ${fmt(L, 1)} · cos ${fmt(th, 0)}° = ${sfmt(A * L * cos, 2)}`,
    Math.abs(d) < 0.05 ? '⟂ угол 90° — векторы перпендикулярны, a · b = 0' : d > 0 ? 'угол острый — смотрят в одну сторону, a · b > 0' : 'угол тупой — смотрят в разные стороны, a · b < 0',
    'полоса вдоль a — «тень» (проекция) вектора b']);
}

// ---------- 3. Проекция и работа силы ----------
let moved3 = false;
const t3 = bindRange('t3', () => { moved3 = false; render3(); }), F3 = bindRange('F3', () => { moved3 = false; render3(); });
$('go3').onclick = () => { moved3 = !moved3; render3(); };
function render3() {
  const th = t3(), F = F3(), c = Math.cos(rad(th)), W = F * 10 * c, k = 1.6, svg = $('p3');
  $('t3v').textContent = th + '°'; $('F3v').textContent = F;
  $('f3').innerHTML = `A = ${F} · 10 · cos ${th}° = <span style="color:${W > 0.5 ? 'var(--c)' : W < -0.5 ? 'var(--a)' : 'var(--gold)'}">${sfmt(Math.abs(W) < 0.5 ? 0 : W, 0)} Дж</span>`;
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 560 260');
  style(el('line', { x1: 0, y1: 200, x2: 560, y2: 200 }, svg), { stroke: 'var(--ink)', strokeWidth: 3 });
  for (let x = 0; x < 560; x += 28) style(el('line', { x1: x, y1: 200, x2: x - 10, y2: 212 }, svg), { stroke: 'var(--muted)' });
  const g = el('g', {}, svg);
  style(g, { transition: 'transform 1.6s cubic-bezier(.3, .8, .4, 1)' });
  const hx = 250, hy = 180, fx = hx + F * k * c, fy = hy - F * k * Math.sin(rad(th));
  text(g, hx - 40, 196, '🛷', { 'font-size': 46 });
  style(el('line', { x1: hx, y1: hy, x2: fx, y2: hy, 'stroke-dasharray': '' }, g), { stroke: 'var(--gold)', strokeWidth: 12, strokeOpacity: .4, strokeLinecap: 'round' });
  style(el('line', { x1: fx, y1: fy, x2: fx, y2: hy, 'stroke-dasharray': '5 4' }, g), { stroke: 'var(--muted)', strokeWidth: 2 });
  arrow(g, RAW, hx, hy, fx, hy, 'var(--gold)', { w: 3 });
  arrow(g, RAW, hx, hy, fx, fy, 'var(--a)', { w: 4 });
  text(g, fx + (c >= 0 ? 10 : -10), fy - 6, 'F', { 'font-weight': 800, 'font-style': 'italic', 'font-size': 16, 'text-anchor': c >= 0 ? 'start' : 'end' }, 'var(--a)');
  let arc = '';
  for (let s = 0; s <= 20; s++) { const t = rad((th * s) / 20); arc += (s ? 'L' : 'M') + (hx + 34 * Math.cos(t)) + ',' + (hy - 34 * Math.sin(t)); }
  style(el('path', { d: arc, fill: 'none' }, g), { stroke: 'var(--ink)', strokeWidth: 2 });
  text(g, hx + 46, hy - 12, 'θ', { 'font-style': 'italic', 'font-weight': 700 });
  const shift = Math.max(-150, Math.min(220, F * c * 2.4));
  if (moved3) requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transform = `translateX(${shift}px)`; }));
  arrow(svg, RAW, 40, 236, 140, 236, 'var(--muted)', { w: 2 });
  text(svg, 90, 252, 'путь s = 10 м', { 'font-size': 11 }, 'var(--muted)');
  $('i3').innerHTML = chipsHTML([
    `полезная часть силы: |F|·cos θ = ${F}·${sfmt(c, 2)} = ${sfmt(F * c, 1)} Н`,
    th === 90 ? 'θ = 90°: тянем вверх — санки не едут, работа 0' : th > 90 ? 'θ > 90°: сила тянет назад — работа отрицательная' : th === 0 ? 'θ = 0°: вся сила идёт в дело' : 'чем меньше угол, тем больше пользы',
    'жёлтая стрелка — проекция силы на путь']);
}

// ---------- 4. Косинусная похожесть ----------
const USERS = { 'Аня': [9, 2], 'Борис': [2, 9], 'Вика': [7, 7], 'Гоша': [5, 1], 'Даша': [1, 4] };
const cx4 = bindRange('cx4', render4), cy4 = bindRange('cy4', render4);
function render4() {
  const me = [cx4(), cy4()];
  $('cx4v').textContent = me[0]; $('cy4v').textContent = me[1];
  const svg = $('p4'), P = plane(svg, { W: 420, H: 420, x0: -0.6, x1: 10.6, y0: -0.6, y1: 10.6 });
  text(svg, 412, P.Y(0) - 6, 'комедии →', { 'text-anchor': 'end', 'font-size': 11 }, 'var(--muted)');
  text(svg, P.X(0) + 6, 14, '↑ боевики', { 'text-anchor': 'start', 'font-size': 11 }, 'var(--muted)');
  if (!me[0] && !me[1]) {
    $('b4').innerHTML = '<span class="err">Нулевой вектор: вкусов нет — сравнивать не с чем.</span>';
    $('i4').innerHTML = chipsHTML(['длина (0; 0) равна 0, делить на неё нельзя']);
    return;
  }
  const sims = Object.entries(USERS).map(([n, v]) => [n, v, dotp(me, v) / (len(me) * len(v))]).sort((p, q) => q[2] - p[2]);
  const best = sims[0];
  sims.forEach(([n, v]) => {
    arrow(svg, P, 0, 0, ...v, n === best[0] ? 'var(--c)' : 'var(--muted)', { w: n === best[0] ? 4 : 2 });
    text(svg, P.X(v[0]) + 6, P.Y(v[1]) - 8, n, { 'text-anchor': 'start', 'font-size': 12, 'font-weight': 700 }, n === best[0] ? 'var(--c)' : 'var(--muted)');
  });
  arrow(svg, P, 0, 0, ...me, 'var(--a)', { w: 5, label: 'вы' });
  $('b4').innerHTML = sims.map(([n, , s], i) => barHTML(n, s, fmt(s, 2), i ? 'var(--b)' : 'var(--c)', !i, i * 80)).join('');
  $('i4').innerHTML = chipsHTML([
    `cos = a·b : (|a|·|b|) = ${fmt(dotp(me, best[1]), 0)} : (${fmt(len(me), 2)}·${fmt(len(best[1]), 2)}) = ${fmt(best[2], 3)}`,
    `|a| = √(a·a) = √${dotp(me, me)} ≈ ${fmt(len(me), 2)} — подробнее в теме «Норма»`,
    `больше всего похожи на вас вкусы ${best[0] === 'Аня' ? 'Ани' : best[0] === 'Борис' ? 'Бориса' : best[0] === 'Вика' ? 'Вики' : best[0] === 'Гоша' ? 'Гоши' : 'Даши'}`,
    'важно направление, а не длина: (4; 2) и (8; 4) — одинаковые вкусы']);
}

// ---------- 5. Нейрон ----------
const W5 = [0.6, 0.5, 0.7], IN5 = ['☀️ солнце', '📚 уроки', '👫 друзья'];
const x5 = [0, 1, 2].map(i => bindRange('x5_' + i, render5)), b5 = bindRange('b5', render5);
function render5() {
  const x = x5.map(f => f()), b = b5(), wx = dotp(W5, x), z = wx + b, yes = z > 0, svg = $('p5');
  x.forEach((v, i) => $('x5_' + i + 'v').textContent = v); $('b5v').textContent = sgn(b);
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 560 230');
  const ys = [40, 115, 190];
  ys.forEach((y, i) => {
    style(el('line', { x1: 90, y1: y, x2: 300, y2: 115 }, svg), { stroke: 'var(--b)', strokeWidth: 2 + W5[i] * 8, strokeOpacity: .25 + x[i] / 14 });
    style(el('circle', { cx: 60, cy: y, r: 28 }, svg), { fill: 'var(--b)' });
    text(svg, 60, y + 6, x[i], { 'font-weight': 800, 'font-size': 18 }, '#fff');
    text(svg, 60, y + (i === 2 ? 44 : -34), IN5[i], { 'font-size': 11 }, 'var(--muted)');
    later(text(svg, 190, (y + 115) / 2 - 8 + (i === 1 ? 0 : 0), `${fmt(W5[i], 1)}·${x[i]} = ${fmt(W5[i] * x[i], 1)}`, { 'font-size': 12, 'font-weight': 700 }, 'var(--ink)'), i * 150);
  });
  style(el('circle', { cx: 330, cy: 115, r: 44 }, svg), { fill: 'var(--gold)' });
  text(svg, 330, 108, 'w·x + b', { 'font-size': 11 }, '#111');
  later(text(svg, 330, 128, sfmt(z, 1), { 'font-size': 18, 'font-weight': 800 }, '#111'), 450, 'pop');
  arrow(svg, RAW, 376, 115, 440, 115, 'var(--muted)', { w: 3 });
  const lamp = el('g', {}, svg);
  style(el('circle', { cx: 495, cy: 115, r: 40 }, lamp), { fill: yes ? 'var(--c)' : 'var(--a)' });
  text(lamp, 495, 112, yes ? '🚶' : '🏠', { 'font-size': 22 });
  text(lamp, 495, 136, yes ? 'гулять!' : 'дома', { 'font-size': 12, 'font-weight': 700 }, '#fff');
  later(lamp, 650, 'pop');
  $('f5').innerHTML = `z = ${W5.map((w, i) => `${fmt(w, 1)}·${x[i]}`).join(' + ')} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = <span style="color:${yes ? 'var(--c)' : 'var(--a)'}">${sfmt(z, 1)}</span>`;
  $('i5').innerHTML = chipsHTML([`w · x = ${fmt(wx, 1)} — скалярное произведение весов и входов`, `z ${yes ? '> 0 → «да»' : '≤ 0 → «нет»'}`,
    'толщина линии — вес: друзья важнее всего', 'обучить нейрон = подобрать веса w и сдвиг b']);
}

// ---------- 6. Зачем нужно скалярное произведение ----------
let useTab = 'grade';
const GRADES = [['Контрольные', 0.4, 4.2], ['Самостоятельные', 0.25, 3.6], ['Домашние', 0.2, 5], ['На уроке', 0.15, 4.5]];
const GENRES = ['комедия', 'боевик', 'драма', 'мультфильм'];
const FILMS = [['«Весёлый отпуск»', [1, 0, 0, 0]], ['«Погоня в городе»', [0, 1, 0, 0]], ['«Письмо маме»', [0, 0, 1, 0]],
  ['«Кот-детектив»', [0.5, 0, 0, 1]], ['«Смешные шпионы»', [1, 1, 0, 0]], ['«Космос: последний рубеж»', [0, 1, 1, 0]]];
const VOCAB = ['кот', 'собака', 'молоко', 'мяч', 'парк'];
const DOCS = [['Кот пьёт молоко, потом кот спит', [2, 0, 1, 0, 0]], ['Собака играет с мячом в парке', [0, 1, 0, 1, 1]],
  ['Кот и собака гуляют в парке', [1, 1, 0, 0, 1]], ['Купить молоко и новый мяч', [0, 0, 1, 1, 0]]];
const QUERIES = ['кот молоко', 'собака парк', 'мяч', 'кот парк'];
const FEATS = [['Площадь, м²', 20, 120, 55, 1, 0.12], ['Комнат', 1, 4, 2, 1, 0.6], ['Этаж', 1, 20, 5, 1, 0.04], ['До метро, мин', 1, 30, 10, 1, -0.07]];
const USES = {
  grade: {
    controls: GRADES.map(([n, w, g], i) => slider('g6_' + i, `${n} (вес ${fmt(w * 100, 0)}%)`, 2, 5, g, 0.1)).join(''),
    render() {
      const g = GRADES.map((_, i) => +$('g6_' + i).value), w = GRADES.map(x => x[1]), total = dotp(g, w), mean = g.reduce((a, b) => a + b, 0) / 4;
      g.forEach((v, i) => $('g6_' + i + 'v').textContent = fmt(v, 1));
      $('useOut').innerHTML = `
        <div class="mid">оценки · веса = <span style="color:var(--a)">${fmt(total, 2)}</span></div>
        <div class="bars">${GRADES.map(([n], i) => barHTML(n, (g[i] * w[i]) / 2, `${fmt(g[i], 1)}·${fmt(w[i], 2)} = ${fmt(g[i] * w[i], 2)}`, 'var(--b)', false, i * 100)).join('')}</div>
        <div class="info">${chipsHTML([`итог: ${GRADES.map((_, i) => fmt(g[i] * w[i], 2)).join(' + ')} = ${fmt(total, 2)}`,
          `простое среднее было бы ${fmt(mean, 2)}`, 'сумма весов = 1 (100%)', `в журнал: ${Math.round(total + 1e-9)}`])}</div>
        <p class="answer">Взвешенная оценка — скалярное произведение <b>вектора оценок</b> на <b>вектор весов</b>. Пятёрки за домашку весят мало,
        а контрольные — много. Поэтому итог отличается от простого среднего, где у всех оценок вес одинаковый.</p>`;
    },
  },
  movies: {
    controls: '<div class="mid">Ваши вкусы, 0–5</div>' + GENRES.map((n, i) => slider('m6_' + i, n, 0, 5, [4, 1, 0, 3][i])).join(''),
    render() {
      const t = GENRES.map((_, i) => +$('m6_' + i).value);
      t.forEach((v, i) => $('m6_' + i + 'v').textContent = v);
      const scores = FILMS.map(([n, v]) => [n, v, dotp(t, v)]).sort((p, q) => q[2] - p[2]), max = Math.max(1, scores[0][2]);
      $('useOut').innerHTML = `
        <div class="mid">советуем: <span style="color:var(--a)">${scores[0][0]}</span></div>
        <div class="bars">${scores.map(([n, , s], i) => barHTML(n, s / max, fmt(s, 1), i ? 'var(--b)' : 'var(--c)', !i, i * 90)).join('')}</div>
        <div class="info">${chipsHTML([`вкусы = ${vec(...t)}`, `${scores[0][0]}: жанры ${vec(...scores[0][1])} → ${scores[0][1].map((v, i) => `${t[i]}·${fmt(v, 1)}`).join(' + ')} = ${fmt(scores[0][2], 1)}`,
          'фильм получает очки за жанры, которые вы любите'])}</div>
        <p class="answer">У каждого фильма — вектор жанров, у вас — вектор вкусов. Их скалярное произведение — <b>прогноз, насколько понравится</b>.
        Онлайн-кинотеатры делают то же самое, только жанров и скрытых признаков у них сотни, а векторы вкусов они узнают по вашим просмотрам.</p>`;
    },
  },
  search: {
    controls: `<label class="r">Запрос<select id="sQ" style="grid-column:1/-1">${QUERIES.map(qq => `<option>${qq}</option>`).join('')}</select></label>`,
    render() {
      const words = $('sQ').value.split(' '), qv = VOCAB.map(w => (words.includes(w) ? 1 : 0));
      const scores = DOCS.map(([t, v], k) => [t, v, dotp(qv, v), k]).sort((p, q) => q[2] - p[2]), max = Math.max(1, scores[0][2]);
      const head = `<span></span>${VOCAB.map(w => `<span class="mhead" style="${words.includes(w) ? 'color:var(--a);font-weight:700' : ''}">${w}</span>`).join('')}`;
      const rows = DOCS.map(([, v], k) => `<span class="mhead">док ${k + 1}</span>${v.map((c, j) => `<span class="mc${qv[j] && c ? ' hit' : ''}">${c}</span>`).join('')}`).join('');
      $('useOut').innerHTML = `
        <div class="mid">запрос = ${vec(...qv)}</div>
        <div class="mat small" style="grid-template-columns:auto repeat(5, auto);margin-top:8px">${head}${rows}</div>
        <div class="bars">${scores.map(([t, , s, k], i) => barHTML(`док ${k + 1}`, s / max, s, i ? 'var(--b)' : 'var(--c)', !i && s > 0, i * 90)).join('')}</div>
        <div class="info">${chipsHTML([`первым покажем: «${scores[0][1] && scores[0][0]}»`, 'в таблице — сколько раз слово встречается в документе', 'красные клетки дают очки'])}</div>
        <p class="answer">Текст превращают в вектор: сколько раз встречается каждое слово. Запрос — тоже вектор. Скалярное произведение
        запроса и документа — <b>сколько совпадений</b>. Сортируем по нему — получаем выдачу поисковика. Настоящие поисковики делят ещё на длины (косинус) и учитывают редкость слов.</p>`;
    },
  },
  price: {
    controls: FEATS.map(([n, min, max, val, step], i) => slider('f6_' + i, n, min, max, val, step)).join(''),
    render() {
      const x = FEATS.map((_, i) => +$('f6_' + i).value), w = FEATS.map(f => f[5]), b = 1.5, price = dotp(w, x) + b;
      x.forEach((v, i) => $('f6_' + i + 'v').textContent = v);
      const parts = FEATS.map(([n], i) => [n, w[i] * x[i]]), max = Math.max(...parts.map(p => Math.abs(p[1])), b);
      $('useOut').innerHTML = `
        <div class="mid">цена ≈ <span style="color:var(--a)">${fmt(price, 2)} млн ₽</span></div>
        <div class="bars">${barHTML('база b', b / max, '+' + fmt(b, 2), 'var(--muted)')}${parts.map(([n, v], i) =>
          barHTML(n, Math.abs(v) / max, (v >= 0 ? '+' : '−') + fmt(Math.abs(v), 2), v >= 0 ? 'var(--c)' : 'var(--a)', false, (i + 1) * 90)).join('')}</div>
        <div class="info">${chipsHTML([`веса w = ${vec(...w)}`, `цена = w · x + b = ${w.map((wi, i) => `${i ? (wi < 0 ? ' − ' : ' + ') : ''}${fmt(Math.abs(wi), 2)}·${x[i]}`).join('')} + ${fmt(b, 1)}`,
          'отрицательный вес: дальше от метро — дешевле'])}</div>
        <p class="answer">Это <b>линейная регрессия</b> — самая простая модель машинного обучения. Квартира — вектор признаков x,
        модель — вектор весов w. Прогноз — их скалярное произведение плюс b. Знак веса показывает, повышает признак цену или понижает, а величина — насколько сильно.</p>`;
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
function newQuiz() {
  const type = rnd(0, 6);
  if (type === 0) {
    const a = [rnd(-6, 6), rnd(-6, 6)], b = [rnd(-6, 6), rnd(-6, 6)];
    q = { text: `${vec(...a)} · ${vec(...b)} = ?`, ans: dotp(a, b), hint: `${sgn(a[0])}·${par(b[0])} + ${sgn(a[1])}·${par(b[1])}.` };
  } else if (type === 1) {
    const a = [rnd(-4, 5), rnd(-4, 5), rnd(-4, 5)], b = [rnd(-4, 5), rnd(-4, 5), rnd(-4, 5)];
    q = { text: `${vec(...a)} · ${vec(...b)} = ?`, ans: dotp(a, b), hint: `Три произведения: ${a.map((v, i) => `${sgn(v)}·${par(b[i])}`).join(' + ')}.` };
  } else if (type === 2) {
    const p = pick([1, 2, -1, -2]), r = nz(-3, 3), m = nz(-4, 4), qq = p * r;
    q = { text: `При каком k векторы (k; ${sgn(m)}) и (${sgn(p)}; ${sgn(qq)}) перпендикулярны?`, ans: (-m * qq) / p,
          hint: `Перпендикулярны — значит a · b = 0: k·${par(p)} + ${sgn(m)}·${par(qq)} = 0.` };
  } else if (type === 3) {
    const [ang, c] = pick([[0, 1], [60, 0.5], [90, 0], [120, -0.5], [180, -1]]), A = rnd(1, 6), B = rnd(1, 5) * 2;
    q = { text: `|a| = ${A}, |b| = ${B}, угол между ними ${ang}°. a · b = ?`, ans: A * B * c, hint: `a · b = |a|·|b|·cos ${ang}°, cos ${ang}° = ${sfmt(c, 1)}.` };
  } else if (type === 4) {
    const a = [rnd(-9, 9), rnd(-9, 9)];
    q = { text: `a = ${vec(...a)}. a · a = ?`, ans: dotp(a, a), hint: `${sgn(a[0])}² + ${par(a[1])}². Это квадрат длины вектора.` };
  } else if (type === 5) {
    const qn = [rnd(1, 4), rnd(1, 4), rnd(1, 3)], pr = [pick([40, 50, 60]), pick([80, 90, 100]), pick([150, 200, 250])];
    q = { text: story(`🛒 Купили ${qn[0]} булочки по ${pr[0]} ₽, ${qn[1]} пакета сока по ${pr[1]} ₽ и ${qn[2]} торта по ${pr[2]} ₽. Сумма чека (₽)?`),
          ans: dotp(qn, pr), hint: `Количества · цены: ${qn.map((v, i) => `${v}·${pr[i]}`).join(' + ')}.` };
  } else {
    const g = [rnd(3, 5), rnd(3, 5), rnd(2, 5)];
    q = { text: story(`🎓 Контрольная (вес 0,5) — ${g[0]}, самостоятельная (вес 0,3) — ${g[1]}, домашка (вес 0,2) — ${g[2]}. Итоговая оценка?`),
          ans: dotp(g, [0.5, 0.3, 0.2]), hint: `${g[0]}·0,5 + ${g[1]}·0,3 + ${g[2]}·0,2.` };
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

render1(); render2(); render3(); render4(); render5(); buildUse(); newQuiz();
$('qScore').textContent = 'Счёт: 0 из 0';
