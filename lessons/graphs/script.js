const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const fmt = (x, d = 3) => (+x.toFixed(d)).toLocaleString('ru-RU', { maximumFractionDigits: d });
const chipsHTML = list => list.map(c => `<span class="chip fade">${c}</span>`).join('');
const X_ = '<i class="v">x</i>';
const sgn = n => (n < 0 ? '−' + num(-n) : num(n));
const sfmt = (x, d = 2) => (x < 0 ? '−' : '') + fmt(Math.abs(x), d);
const par = n => (n < 0 ? `(${sgn(n)})` : num(n));
// многочлен из пар [коэффициент, буква]: 1x → x, «+ −3» → «− 3», нулевые члены пропускаются
function poly(terms) {
  let s = '';
  for (const [c, v] of terms) {
    if (!c) continue;
    const abs = Math.abs(c), body = v ? (abs === 1 ? '' : num(abs)) + v : num(abs);
    s += s ? (c > 0 ? ' + ' : ' − ') + body : (c < 0 ? '−' : '') + body;
  }
  return s || '0';
}
const pt = (x, y) => `(${sgn(x)}; ${sgn(y)})`;

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
const setAttrs = (node, attrs) => { for (const k in attrs) node.setAttribute(k, attrs[k]); return node; };
// «круглый» шаг сетки: 1, 2, 5, 10, 20, 50…
const niceStep = v => { const p = 10 ** Math.floor(Math.log10(v)), n = v / p; return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p; };
const hm = t => { const h = Math.floor(t), m = Math.round((t - h) * 60); return `${h}:${String(m).padStart(2, '0')}`; };

// координатная плоскость: сетка, оси, подписи; curve(f) — путь графика функции
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
  const curve = (f, n = 240, a = x0, b = x1) => {
    let d = '', pen = false;
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n, y = f(x);
      if (!isFinite(y)) { pen = false; continue; }
      const yc = Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), y));
      d += (pen ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(yc).toFixed(1);
      pen = true;
    }
    return d;
  };
  return { X, Y, curve, W, H };
}
const marker = (svg, color, r = 7) => {
  const g = el('g', {}, svg); g.classList.add('move');
  style(el('circle', { cx: 0, cy: 0, r }, g), { fill: color, stroke: 'var(--card)', strokeWidth: 2 });
  return g;
};

// ---------- 1. Координаты точки ----------
const px1 = bindRange('px1', render1), py1 = bindRange('py1', render1);
const P1 = plane($('p1'), { W: 420, H: 420, x0: -8, x1: 8, y0: -8, y1: 8 });
const ROMAN = ['', 'I', 'II', 'III', 'IV'];
const quads1 = [[0, 8, 8, 0], [-8, 8, 0, 0], [-8, 0, 0, -8], [0, 0, 8, -8]].map(([xa, ya, xb, yb], i) => {
  const r = el('rect', { x: P1.X(xa), y: P1.Y(ya), width: P1.X(xb) - P1.X(xa), height: P1.Y(yb) - P1.Y(ya) });
  $('p1').insertBefore(r, $('p1').firstChild);
  style(r, { fill: 'var(--gold)', fillOpacity: .05 }).classList.add('quad');
  text($('p1'), P1.X((xa + xb) / 2), P1.Y((ya + yb) / 2) + 12, ROMAN[i + 1], { 'font-size': 36, 'font-weight': 800, opacity: .25 }, 'var(--muted)');
  return r;
});
const proj1 = style(el('path', { fill: 'none', 'stroke-dasharray': '5 4' }, $('p1')), { stroke: 'var(--muted)', strokeWidth: 2 });
const star1 = el('text', { 'font-size': 26, 'text-anchor': 'middle', opacity: 0 }, $('p1'));
star1.textContent = '⭐';
const dot1 = marker($('p1'), 'var(--a)', 8);
const lbl1 = text(dot1, 0, -14, '', { 'font-weight': 700 });
let target1 = null;
function render1() {
  const x = px1(), y = py1(), { X, Y } = P1;
  $('px1v').textContent = sgn(x); $('py1v').textContent = sgn(y);
  $('f1').innerHTML = `(<span style="color:var(--b)">${sgn(x)}</span>; <span style="color:var(--a)">${sgn(y)}</span>)`;
  dot1.style.transform = `translate(${X(x)}px, ${Y(y)}px)`;
  lbl1.textContent = pt(x, y);
  proj1.setAttribute('d', `M${X(x)},${Y(0)} V${Y(y)} M${X(0)},${Y(y)} H${X(x)}`);
  const q = x > 0 && y > 0 ? 1 : x < 0 && y > 0 ? 2 : x < 0 && y < 0 ? 3 : x > 0 && y < 0 ? 4 : 0;
  quads1.forEach((r, i) => r.style.fillOpacity = i + 1 === q ? .25 : .05);
  const signs = ['', '(+; +)', '(−; +)', '(−; −)', '(+; −)'];
  $('i1').innerHTML = chipsHTML([
    x ? `x = ${sgn(x)}: ${Math.abs(x)} шаг. ${x > 0 ? 'вправо' : 'влево'}` : 'x = 0: по горизонтали стоим на месте',
    y ? `y = ${sgn(y)}: ${Math.abs(y)} шаг. ${y > 0 ? 'вверх' : 'вниз'}` : 'y = 0: по вертикали стоим на месте',
    q ? `четверть ${ROMAN[q]}: знаки ${signs[q]}` : 'точка лежит на оси — ни в одной четверти']);
  if (target1) {
    if (x === target1[0] && y === target1[1]) {
      $('g1Msg').innerHTML = `<span class="hit">🎉 Попали! Звезда в точке ${pt(x, y)}.</span>`;
      target1 = null; star1.setAttribute('opacity', 0);
    } else $('g1Msg').textContent = 'Двигайте ползунки, пока красная точка не встанет на звезду.';
  }
}
$('game1').onclick = () => {
  do { target1 = [Math.floor(Math.random() * 15) - 7, Math.floor(Math.random() * 15) - 7]; } while (target1[0] === px1() && target1[1] === py1());
  setAttrs(star1, { x: P1.X(target1[0]), y: P1.Y(target1[1]) + 9, opacity: 1 });
  restart(star1, 'pop');
  render1();
};

// ---------- 2. Как читать график ----------
const T2 = t => 5 + 7 * Math.sin(((t - 9) * Math.PI) / 12) + 1.5 * Math.sin((t * Math.PI) / 4);
const dT2 = t => T2(t + 0.01) - T2(t - 0.01);
const t2 = bindRange('t2', render2), c2 = bindRange('c2', render2);
const P2 = plane($('p2'), { H: 320, x0: 0, x1: 24, y0: -6, y1: 16, sx: 2, sy: 2 });
const band2 = el('g', {}, $('p2'));
const level2 = style(el('line', { x1: 0, x2: 560, 'stroke-dasharray': '6 5' }, $('p2')), { stroke: 'var(--gold)', strokeWidth: 2 });
(function build2() {
  // куски кривой: зелёные там, где растёт, красные — где падает
  let start = 0;
  for (let t = 0.05; t <= 24.001; t += 0.05) {
    const end = t >= 24 || Math.sign(dT2(t)) !== Math.sign(dT2(start + 0.01));
    if (end) {
      const color = dT2(start + 0.01) > 0 ? 'var(--c)' : 'var(--a)';
      style(el('path', { d: P2.curve(T2, 80, start, Math.min(t, 24)), fill: 'none', pathLength: 1 }, $('p2')),
        { stroke: color, strokeWidth: 4, strokeLinecap: 'round' }).classList.add('draw');
      start = t;
    }
  }
  const ts = Array.from({ length: 961 }, (_, i) => i / 40), vals = ts.map(T2);
  [[Math.max(...vals), 'макс'], [Math.min(...vals), 'мин']].forEach(([v, name]) => {
    const t = ts[vals.indexOf(v)], g = marker($('p2'), 'var(--gold)', 6);
    g.style.transform = `translate(${P2.X(t)}px, ${P2.Y(v)}px)`;
    text(g, 0, name === 'макс' ? -12 : 22, `${name} ${fmt(v, 1)}°`, { 'font-weight': 700, 'font-size': 12 });
    P2[name] = [t, v];
  });
})();
const proj2 = style(el('path', { fill: 'none', 'stroke-dasharray': '4 4' }, $('p2')), { stroke: 'var(--b)', strokeWidth: 2 });
const dot2 = marker($('p2'), 'var(--b)', 8);
function render2() {
  const t = t2(), c = c2(), v = T2(t), { X, Y } = P2;
  $('t2v').textContent = hm(t); $('c2v').textContent = sgn(c);
  $('f2').innerHTML = `в ${hm(t)} — <span style="color:var(--b)">${sfmt(v, 1)}°C</span>`;
  dot2.style.transform = `translate(${X(t)}px, ${Y(v)}px)`;
  proj2.setAttribute('d', `M${X(t)},${Y(-6)} V${Y(v)} H0`);
  setAttrs(level2, { y1: Y(c), y2: Y(c) });
  band2.innerHTML = '';
  const runs = [];
  let from = null;
  for (let i = 0; i <= 480; i++) {
    const s = i / 20, above = T2(s) > c;
    if (above && from === null) from = s;
    if ((!above || i === 480) && from !== null) { runs.push([from, s]); from = null; }
  }
  runs.forEach(([a, b]) => style(el('rect', { x: X(a), y: 0, width: X(b) - X(a), height: 320 }, band2), { fill: 'var(--gold)', fillOpacity: .12 }));
  $('i2').innerHTML = chipsHTML([
    dT2(t) > 0 ? '📈 сейчас теплеет' : '📉 сейчас холодает',
    `самое тепло: ${fmt(P2['макс'][1], 1)}° в ${hm(P2['макс'][0])}`,
    `самое холодно: ${sfmt(P2['мин'][1], 1)}° в ${hm(P2['мин'][0])}`,
    runs.length ? `теплее ${sgn(c)}°: ` + runs.map(([a, b]) => `${hm(a)}–${hm(b)}`).join(', ') : `теплее ${sgn(c)}° не было`]);
}

// ---------- 3. Сдвиги и растяжения ----------
const BASES = {
  sq: { f: x => x * x, show: s => (s === 'x' ? `${X_}²` : `(${s})²`), key: 'вершина' },
  abs: { f: Math.abs, show: s => `|${s}|`, key: 'угол' },
  root: { f: x => (x >= 0 ? Math.sqrt(x) : NaN), show: s => `√${s === 'x' ? X_ : `(${s})`}`, key: 'начало' },
  exp: { f: x => 2 ** x, show: s => `2<sup>${s === 'x' ? X_ : s}</sup>`, key: 'точка (0; 1)' },
};
let base3 = 'sq';
const h3 = bindRange('h3', render3), k3 = bindRange('k3', render3), a3 = bindRange('a3', render3);
const P3 = plane($('p3'), { H: 340, x0: -8, x1: 8, y0: -8, y1: 8 });
const ghost3 = style(el('path', { fill: 'none', 'stroke-dasharray': '6 5' }, $('p3')), { stroke: 'var(--muted)', strokeWidth: 2.5 });
const graph3 = style(el('path', { fill: 'none' }, $('p3')), { stroke: 'var(--a)', strokeWidth: 4, strokeLinecap: 'round' });
const arrow3 = style(el('path', { fill: 'none', 'stroke-dasharray': '3 4' }, $('p3')), { stroke: 'var(--gold)', strokeWidth: 2.5 });
const key3 = marker($('p3'), 'var(--gold)', 7), key0 = marker($('p3'), 'var(--muted)', 5);
$('base3').addEventListener('input', () => { base3 = $('base3').value; render3(); });
function render3() {
  const B = BASES[base3], h = h3(), k = k3(), a = a3(), g = x => a * B.f(x - h) + k, { X, Y } = P3;
  $('h3v').textContent = sgn(h); $('k3v').textContent = sgn(k); $('a3v').textContent = sgn(a);
  const inner = h ? `${X_} ${h > 0 ? '−' : '+'} ${Math.abs(h)}` : 'x';
  const front = a === 1 ? '' : a === -1 ? '−' : a === 0 ? '' : sgn(a) + '·';
  $('f3').innerHTML = 'y = ' + (a === 0 ? sgn(k) : front + B.show(inner) + (k ? (k > 0 ? ' + ' : ' − ') + Math.abs(k) : ''));
  ghost3.setAttribute('d', P3.curve(B.f, 300));
  graph3.setAttribute('d', P3.curve(g, 300));
  const y0 = B.f(0), y1 = a * y0 + k;
  key0.style.transform = `translate(${X(0)}px, ${Y(y0)}px)`;
  key3.style.transform = `translate(${X(h)}px, ${Y(y1)}px)`;
  arrow3.setAttribute('d', `M${X(0)},${Y(y0)} L${X(h)},${Y(y1)}`);
  $('i3').innerHTML = chipsHTML([
    h ? `h = ${sgn(h)}: ${h > 0 ? 'вправо' : 'влево'} на ${Math.abs(h)} (в формуле x ${h > 0 ? '−' : '+'} ${Math.abs(h)})` : 'h = 0: по горизонтали без сдвига',
    k ? `k = ${sgn(k)}: ${k > 0 ? 'вверх' : 'вниз'} на ${Math.abs(k)}` : 'k = 0: по вертикали без сдвига',
    a === 0 ? 'a = 0: всё сплющилось в прямую y = k' : `a = ${sgn(a)}: ${Math.abs(a) > 1 ? `вытянут в ${fmt(Math.abs(a))} раза` : Math.abs(a) < 1 ? `сжат в ${fmt(1 / Math.abs(a))} раза` : 'без растяжения'}${a < 0 ? ', перевёрнут' : ''}`,
    `<span style="color:var(--gold)">●</span> ${B.key}: ${pt(0, y0)} → ${pt(h, y1)}`]);
}

// ---------- 4. Из данных — в график ----------
const NOISE = [0.6, -1.1, 0.3, 1.4, -0.5, -0.9, 0.8, -0.2, 1.1, -1.3, 0.4];
const DATA = {
  study: { xs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], f: x => 42 + 5.2 * x, amp: 4, xName: 'часов', yName: 'баллов' },
  brake: { xs: [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120], f: v => (v * v) / 170 + 0.12 * v, amp: 3, xName: 'км/ч', yName: 'метров' },
  subs: { xs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], f: d => 120 * 1.33 ** d, amp: 0, rel: 0.08, xName: 'дней', yName: 'подписчиков' },
};
Object.values(DATA).forEach(D => { D.ys = D.xs.map((x, i) => D.f(x) * (1 + (D.rel || 0) * NOISE[i]) + D.amp * NOISE[i]); });
// метод наименьших квадратов: решаем систему (AᵀA)·c = Aᵀy методом Гаусса
function lsq(rows, ys) {
  const n = rows[0].length, M = Array.from({ length: n }, (_, i) => [
    ...Array.from({ length: n }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0)),
    rows.reduce((s, r, k) => s + r[i] * ys[k], 0)]);
  for (let i = 0; i < n; i++) {
    const p = M[i][i];
    for (let j = i; j <= n; j++) M[i][j] /= p;
    for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i]; for (let j = i; j <= n; j++) M[r][j] -= f * M[i][j]; }
  }
  return M.map(r => r[n]);
}
const MODELS = {
  lin: { name: 'прямая', color: 'var(--b)', fit(D) { const [c, b] = lsq(D.xs.map(x => [1, x]), D.ys); return { f: x => c + b * x, text: `y ≈ ${fmt(b, 2)}${X_} + ${fmt(c, 1)}`.replace('+ -', '− ') }; } },
  quad: { name: 'парабола', color: 'var(--c)', fit(D) {
    const [c, b, a] = lsq(D.xs.map(x => [1, x, x * x]), D.ys);
    return { f: x => c + b * x + a * x * x, text: `y ≈ ${sfmt(a, 4)}${X_}² ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b), 2)}${X_} ${c < 0 ? '−' : '+'} ${fmt(Math.abs(c), 1)}` }; } },
  exp: { name: 'экспонента', color: 'var(--a)', fit(D) {
    const [lc, lb] = lsq(D.xs.map(x => [1, x]), D.ys.map(Math.log)), A = Math.exp(lc), q = Math.exp(lb);
    return { f: x => A * q ** x, text: `y ≈ ${fmt(A, 1)} · ${fmt(q, 3)}<sup>${X_}</sup>` }; } },
};
let data4 = 'study', model4 = null, tried4 = {};
$('d4').addEventListener('input', () => { data4 = $('d4').value; model4 = null; tried4 = {}; render4(); });
document.querySelectorAll('[data-m4]').forEach(b => b.onclick = () => { model4 = b.dataset.m4; render4(); });
function render4() {
  const D = DATA[data4], xmax = Math.max(...D.xs), ymax = Math.max(...D.ys);
  document.querySelectorAll('[data-m4]').forEach(b => b.classList.toggle('on', b.dataset.m4 === model4));
  const P = plane($('p4'), { H: 320, x0: 0, x1: xmax * 1.06, y0: 0, y1: ymax * 1.15, sx: niceStep(xmax / 8), sy: niceStep(ymax / 6) });
  text($('p4'), 552, 14, '→ ' + D.xName, { 'text-anchor': 'end', 'font-size': 11 }, 'var(--muted)');
  text($('p4'), 30, 14, D.yName, { 'text-anchor': 'start', 'font-size': 11 }, 'var(--muted)');
  let info;
  if (model4) {
    const M = MODELS[model4], fit = M.fit(D), errs = D.xs.map((x, i) => Math.abs(D.ys[i] - fit.f(x)));
    const mae = errs.reduce((s, e) => s + e, 0) / errs.length;
    tried4[model4] = mae;
    D.xs.forEach((x, i) => style(el('line', { x1: P.X(x), y1: P.Y(D.ys[i]), x2: P.X(x), y2: P.Y(fit.f(x)) }, $('p4')),
      { stroke: 'var(--gold)', strokeWidth: 2, animationDelay: '.9s' }).classList.add('fade'));
    style(el('path', { d: P.curve(fit.f, 200), fill: 'none', pathLength: 1 }, $('p4')), { stroke: M.color, strokeWidth: 4 }).classList.add('draw');
    $('f4').innerHTML = `<span class="fade" style="display:inline-block;color:${M.color}">${fit.text}</span>`;
    const best = Object.entries(tried4).sort((a, b) => a[1] - b[1])[0][0];
    info = [`средняя ошибка (жёлтые отрезки): ${fmt(mae, 1)} ${D.yName}`,
      ...Object.entries(tried4).filter(([k]) => k !== model4).map(([k, e]) => `${MODELS[k].name}: ошибка ${fmt(e, 1)}`),
      Object.keys(tried4).length > 1 ? `лучшая из проверенных — ${MODELS[best].name}` : 'попробуйте другие модели'];
  } else {
    $('f4').innerHTML = '<span class="lead" style="font-size:16px;font-weight:400">Выберите модель — какая линия лучше пройдёт через точки?</span>';
    info = ['каждая точка — одна строка таблицы', `x — ${D.xName}, y — ${D.yName}`];
  }
  D.xs.forEach((x, i) => style(el('circle', { cx: P.X(x), cy: P.Y(D.ys[i]), r: 6 }, $('p4')),
    { fill: 'var(--ink)', animationDelay: i * 50 + 'ms' }).classList.add('pop'));
  $('i4').innerHTML = chipsHTML(info);
}

// ---------- 5. Как графики обманывают ----------
const SALES = [96, 98, 101, 104], TOP5 = 110;
const z5 = bindRange('z5', render5);
(function build5() {
  const svg = $('p5');
  svg.setAttribute('viewBox', '0 0 560 300');
  el('g', { id: 'ax5' }, svg);
  SALES.forEach((v, i) => {
    const x = 90 + i * 115;
    const r = el('rect', { id: 'bar5_' + i, x, y: 20, width: 80, height: 250, rx: 4 }, svg);
    style(r, { fill: i === 3 ? 'var(--a)' : 'var(--b)', transformBox: 'fill-box', transformOrigin: 'bottom' }).classList.add('move');
    text(svg, x + 40, 290, `${i + 1} квартал`, { 'font-size': 12 }, 'var(--muted)');
    const g = el('g', { id: 'lbl5_' + i }, svg); g.classList.add('move');
    text(g, x + 40, -6, num(v), { 'font-weight': 700 });
  });
  style(el('line', { x1: 60, y1: 270, x2: 550, y2: 270 }, svg), { stroke: 'var(--ink)', strokeWidth: 2 });
})();
function render5() {
  const z = z5(), H = 250, h = v => ((v - z) / (TOP5 - z)) * H;
  $('z5v').textContent = z;
  SALES.forEach((v, i) => {
    $('bar5_' + i).style.transform = `scaleY(${h(v) / H})`;
    $('lbl5_' + i).style.transform = `translate(0, ${270 - h(v)}px)`;
  });
  const ax = $('ax5'); ax.innerHTML = '';
  for (let i = 0; i <= 5; i++) {
    const v = z + ((TOP5 - z) * i) / 5, y = 270 - (H * i) / 5;
    style(el('line', { x1: 60, y1: y, x2: 550, y2: y }, ax), { stroke: 'var(--line)' });
    text(ax, 52, y + 4, fmt(v, 0), { 'font-size': 11, 'text-anchor': 'end' }, 'var(--muted)');
  }
  if (z > 0) text(ax, 30, 262, '⚡', { 'font-size': 16 });
  const looks = h(104) / h(96);
  $('i5').innerHTML = chipsHTML([`на деле рост: (104 − 96) : 96 ≈ ${fmt((8 / 96) * 100, 1)}%`,
    `на картинке столбик выше в ${fmt(looks, 1)} раза`,
    z ? `⚡ ось начинается с ${z} — разница кажется больше` : 'ось с нуля — картинка честная']);
}

// ---------- 6. Зачем нужны графики ----------
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
let useTab = 'map', flip6 = [1, 1];
const PRICES = Array.from({ length: 30 }, (_, d) => Math.round(100 + 15 * Math.sin(d / 4) + 8 * Math.sin(d / 1.7) + d * 0.8));
const RUN = [[0, 0], [10, 2000], [15, 2000], [30, 4250]];
const runAt = t => { for (let i = 1; i < RUN.length; i++) if (t <= RUN[i][0]) { const [ta, da] = RUN[i - 1], [tb, db] = RUN[i]; return { d: da + ((db - da) * (t - ta)) / (tb - ta), v: (db - da) / (tb - ta) }; } };
const SPRITE = [[0, 0], [2, 0], [2, 2], [1, 3], [0, 2]];
const USES = {
  map: {
    controls: slider('mX', 'Клад: x', -6, 6, 4) + slider('mY', 'Клад: y', -6, 6, 3) + '<p class="lead" style="margin:0">Вы стоите в точке (−3; −2).</p>',
    render() {
      const tx = +$('mX').value, ty = +$('mY').value, ax = -3, ay = -2, dx = tx - ax, dy = ty - ay;
      $('mXv').textContent = sgn(tx); $('mYv').textContent = sgn(ty);
      const city = Math.abs(dx) + Math.abs(dy), line = Math.hypot(dx, dy);
      $('useOut').innerHTML = `
        <div class="mid">по улицам ${city} · напрямик <span style="color:var(--a)">${fmt(line, 2)}</span></div>
        <svg id="mSvg" class="plot" style="max-width:380px;margin:10px auto"></svg>
        <div class="info">${chipsHTML([`по улицам: |${sgn(dx)}| + |${sgn(dy)}| = ${city} кварталов`,
          `напрямик: √(${sgn(dx)}² + ${sgn(dy)}²) = √${dx * dx + dy * dy} ≈ ${fmt(line, 2)}`])}</div>
        <p class="answer">Разность координат говорит, сколько пройти по горизонтали и по вертикали. Пешком по кварталам складываем их,
        напрямик — считаем по <b>теореме Пифагора</b>. В Data Science оба расстояния нужны, чтобы находить <b>похожие объекты</b>:
        чем ближе точки, тем похожее объекты.</p>`;
      const P = plane($('mSvg'), { W: 380, H: 380, x0: -7, x1: 7, y0: -7, y1: 7 });
      style(el('path', { d: `M${P.X(ax)},${P.Y(ay)} H${P.X(tx)} V${P.Y(ty)}`, fill: 'none', pathLength: 1 }, $('mSvg')),
        { stroke: 'var(--gold)', strokeWidth: 5, strokeLinejoin: 'round' }).classList.add('draw');
      style(el('line', { x1: P.X(ax), y1: P.Y(ay), x2: P.X(tx), y2: P.Y(ty), pathLength: 1 }, $('mSvg')),
        { stroke: 'var(--a)', strokeWidth: 3, animationDelay: '.6s' }).classList.add('draw');
      text($('mSvg'), P.X(ax), P.Y(ay) + 8, '🧍', { 'font-size': 22 });
      style(text($('mSvg'), P.X(tx), P.Y(ty) + 8, '💰', { 'font-size': 24 }), { animationDelay: '1s' }).classList.add('pop');
    },
  },
  game: {
    controls: slider('gX', 'Сдвиг по x', -5, 5, 3) + slider('gY', 'Сдвиг по y', -5, 5, 1) +
      `<div class="btns"><button id="gFx">↕ отразить по оси x</button><button id="gFy">↔ отразить по оси y</button></div>`,
    render() {
      const dx = +$('gX').value, dy = +$('gY').value, [sx, sy] = flip6;
      $('gXv').textContent = sgn(dx); $('gYv').textContent = sgn(dy);
      if (!$('gSvg')) {
        $('useOut').innerHTML = `<svg id="gSvg" class="plot" style="max-width:380px;margin:0 auto"></svg><div class="info" id="gInfo"></div>
          <p class="answer">Персонаж в игре — набор точек. Сдвиг: <b>к каждой координате прибавляем</b> одно и то же число.
          Отражение по оси x меняет знак у y, по оси y — у x. Так компьютер двигает всё, что вы видите на экране.</p>`;
        const P = plane($('gSvg'), { W: 380, H: 380, x0: -8, x1: 8, y0: -8, y1: 8 });
        const pts = SPRITE.map(([x, y]) => `${P.X(x)},${P.Y(y)}`).join(' ');
        style(el('polygon', { points: pts }, $('gSvg')), { fill: 'none', stroke: 'var(--muted)', strokeWidth: 2, strokeDasharray: '5 4' });
        const g = el('g', { id: 'gHero' }, $('gSvg'));
        style(g, { transformBox: 'view-box', transformOrigin: `${P.X(0)}px ${P.Y(0)}px` }).classList.add('move');
        style(el('polygon', { points: pts }, g), { fill: 'var(--b)', fillOpacity: .8, stroke: 'var(--b)', strokeWidth: 3 });
        style(el('circle', { cx: P.X(1), cy: P.Y(1.8), r: 6 }, g), { fill: 'var(--gold)' });
        USES.game.P = P;
      }
      const P = USES.game.P;
      $('gHero').style.transform = `translate(${P.X(dx) - P.X(0)}px, ${P.Y(dy) - P.Y(0)}px) scale(${sx}, ${sy})`;
      $('gInfo').innerHTML = chipsHTML(SPRITE.map(([x, y], i) => `${'ABCDE'[i]}${pt(x, y)} → ${pt(sx * x + dx, sy * y + dy)}`));
    },
  },
  stock: {
    controls: slider('sB', 'День покупки', 0, 29, 8) + slider('sS', 'День продажи', 0, 29, 12),
    render() {
      const b = +$('sB').value, s = +$('sS').value, pb = PRICES[b], ps = PRICES[s];
      $('sBv').textContent = b; $('sSv').textContent = s;
      let best = [0, 0, 0];
      for (let i = 0; i < 30; i++) for (let j = i + 1; j < 30; j++) if (PRICES[j] - PRICES[i] > best[2]) best = [i, j, PRICES[j] - PRICES[i]];
      const ok = s > b, profit = ps - pb;
      $('useOut').innerHTML = `
        <div class="mid">${ok ? `${ps} − ${pb} = <span style="color:${profit >= 0 ? 'var(--c)' : 'var(--a)'}">${profit >= 0 ? '+' : '−'}${Math.abs(profit)} ₽</span> с акции` : '<span style="color:var(--a)">продать раньше покупки нельзя</span>'}</div>
        <svg id="sSvg" class="plot" style="margin-top:10px"></svg>
        <div class="info">${chipsHTML([`🟢 купили в день ${b} по ${pb} ₽`, `🔴 продали в день ${s} по ${ps} ₽`,
          `лучшее за месяц: купить в день ${best[0]}, продать в день ${best[1]} → +${best[2]} ₽`])}</div>
        <p class="answer">По графику цены сразу видно <b>низины и вершины</b>. Задача «купить дёшево, продать дорого» — найти минимум
        и следующий за ним максимум. Правда, заранее будущий график не известен — его пытаются <b>предсказать</b> модели.</p>`;
      const lo = Math.min(...PRICES), hi = Math.max(...PRICES);
      const P = plane($('sSvg'), { H: 280, x0: -1, x1: 30, y0: lo - 10, y1: hi + 10, sx: 5, sy: 10 });
      if (ok) style(el('rect', { x: P.X(b), y: 0, width: P.X(s) - P.X(b), height: 280 }, $('sSvg')), { fill: profit >= 0 ? 'var(--c)' : 'var(--a)', fillOpacity: .12 });
      style(el('path', { d: 'M' + PRICES.map((p, d) => `${P.X(d)},${P.Y(p)}`).join(' L'), fill: 'none', pathLength: 1 }, $('sSvg')),
        { stroke: 'var(--b)', strokeWidth: 3, strokeLinejoin: 'round' }).classList.add('draw');
      [[b, pb, 'var(--c)'], [s, ps, 'var(--a)']].forEach(([d, p, c], i) =>
        style(el('circle', { cx: P.X(d), cy: P.Y(p), r: 8 }, $('sSvg')), { fill: c, animationDelay: 600 + i * 200 + 'ms' }).classList.add('pop'));
    },
  },
  run: {
    controls: slider('rT', 'Минута пробежки', 0, 30, 6, 0.5),
    render() {
      const t = +$('rT').value, { d, v } = runAt(Math.max(t, 0.01));
      $('rTv').textContent = fmt(t, 1);
      if (!$('rSvg')) {
        $('useOut').innerHTML = `<div class="mid" id="rHead"></div><svg id="rSvg" class="plot" style="margin-top:10px"></svg><div class="info" id="rInfo"></div>
          <p class="answer">На графике «путь — время» скорость — это <b>крутизна</b> линии: путь за минуту. Круче — быстрее,
          горизонтальный участок — стоим на месте. Наклон прямой — то самое k из линейной функции.</p>`;
        const P = plane($('rSvg'), { H: 280, x0: -1, x1: 31, y0: -300, y1: 4800, sx: 5, sy: 1000 });
        style(el('path', { d: 'M' + RUN.map(([a, b]) => `${P.X(a)},${P.Y(b)}`).join(' L'), fill: 'none', pathLength: 1 }, $('rSvg')),
          { stroke: 'var(--a)', strokeWidth: 4, strokeLinejoin: 'round' }).classList.add('draw');
        USES.run.proj = style(el('path', { fill: 'none', 'stroke-dasharray': '4 4' }, $('rSvg')), { stroke: 'var(--b)', strokeWidth: 2 });
        USES.run.dot = marker($('rSvg'), 'var(--b)', 8);
        USES.run.P = P;
      }
      const { P, proj, dot } = USES.run;
      dot.style.transform = `translate(${P.X(t)}px, ${P.Y(d)}px)`;
      proj.setAttribute('d', `M${P.X(t)},${P.Y(0)} V${P.Y(d)} H${P.X(0)}`);
      $('rHead').innerHTML = `${fmt(t, 1)} мин → <span style="color:var(--b)">${num(Math.round(d))} м</span>`;
      $('rInfo').innerHTML = chipsHTML([v ? `скорость на участке: ${v} м/мин ≈ ${fmt(v * 0.06, 1)} км/ч` : 'участок горизонтальный — отдых, скорость 0',
        `средняя за ${fmt(t, 1)} мин: ${t ? fmt(d / t, 0) : 0} м/мин`]);
    },
  },
};
function buildUse() {
  const u = USES[useTab];
  $('useOut').innerHTML = '';
  $('useCtl').innerHTML = u.controls;
  $('useCtl').querySelectorAll('input, select').forEach(i => i.addEventListener('input', () => u.render()));
  if ($('gFx')) {
    $('gFx').onclick = () => { flip6[1] *= -1; u.render(); };
    $('gFy').onclick = () => { flip6[0] *= -1; u.render(); };
  }
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
    const x = nz(-9, 9), y = nz(-9, 9), qd = x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3;
    q = { text: `В какой четверти точка ${pt(x, y)}? (1–4)`, ans: qd, hint: 'I: (+; +), II: (−; +), III: (−; −), IV: (+; −). Нумерация идёт против часовой стрелки.' };
  } else if (type === 1) {
    const x = nz(-9, 9), y = nz(-9, 9), byX = Math.random() < .5;
    q = byX
      ? { text: `Точку ${pt(x, y)} отразили относительно оси x. Чему равна новая y?`, ans: -y, hint: 'При отражении относительно оси x меняется знак у y.' }
      : { text: `Точку ${pt(x, y)} отразили относительно оси y. Чему равен новый x?`, ans: -x, hint: 'При отражении относительно оси y меняется знак у x.' };
  } else if (type === 2) {
    const h = nz(-6, 6), k = rnd(-6, 6), askX = Math.random() < .5;
    const f = `y = (${X_} ${h > 0 ? '−' : '+'} ${Math.abs(h)})²${k ? (k > 0 ? ' + ' : ' − ') + Math.abs(k) : ''}`;
    q = askX ? { text: `${f}. x вершины = ?`, ans: h, hint: `Вершина там, где скобка равна нулю: x ${h > 0 ? '−' : '+'} ${Math.abs(h)} = 0.` }
             : { text: `${f}. y вершины = ?`, ans: k, hint: 'В вершине скобка равна нулю, остаётся только число после неё.' };
  } else if (type === 3) {
    const h = nz(-4, 4), x = rnd(-3, 7);
    q = { text: `f(${X_}) = ${X_}², g(${X_}) = f(${X_} ${h > 0 ? '−' : '+'} ${Math.abs(h)}). g(${x}) = ?`, ans: (x - h) ** 2,
          hint: `g(${x}) = (${x} ${h > 0 ? '−' : '+'} ${Math.abs(h)})² = ${par(x - h)}².` };
  } else if (type === 4) {
    const [a, b] = pick([[3, 4], [6, 8], [5, 12], [8, 6], [9, 12]]), x = rnd(-5, 3), y = rnd(-5, 3);
    q = { text: `Расстояние между ${pt(x, y)} и ${pt(x + a, y + b)} = ?`, ans: Math.hypot(a, b), hint: `√(${a}² + ${b}²): разности координат — катеты.` };
  } else if (type === 5) {
    const v = pick([12, 15, 18, 20, 24]), t = rnd(2, 5);
    q = { text: story(`🚲 По графику: в 0 ч велосипедист на отметке 0 км, в ${t} ч — на ${v * t} км. Линия прямая. Скорость (км/ч)?`), ans: v,
          hint: `Скорость — наклон: ${v * t} км : ${t} ч.` };
  } else {
    const xa = rnd(-8, 4), dx = rnd(1, 5) * 2, ya = rnd(-8, 4), dy = rnd(1, 5) * 2, askX = Math.random() < .5;
    q = { text: `Середина отрезка между ${pt(xa, ya)} и ${pt(xa + dx, ya + dy)}: ${askX ? 'x' : 'y'} = ?`, ans: askX ? xa + dx / 2 : ya + dy / 2,
          hint: 'Координата середины — среднее: (первая + вторая) : 2.' };
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
