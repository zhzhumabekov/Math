const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const fmt = (x, d = 3) => (+x.toFixed(d)).toLocaleString('ru-RU', { maximumFractionDigits: d });
const sfmt = (x, d = 2) => (x < 0 ? '−' : '') + fmt(Math.abs(x), d);
const chipsHTML = list => list.map(c => `<span class="chip fade">${c}</span>`).join('');
const X_ = '<i class="v">x</i>';
const sgn = n => (n < 0 ? '−' + num(-n) : num(n));
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
// цвет по знаку производной: растёт — зелёный, падает — красный, около нуля — жёлтый
const slopeColor = m => (m > 0.05 ? 'var(--c)' : m < -0.05 ? 'var(--a)' : 'var(--gold)');

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
  // касательная (или любая прямая) через точку (x, y) с наклоном m — во всю ширину графика
  const line = (x, y, m) => curve(t => y + m * (t - x), 1);
  return { X, Y, curve, line, W, H };
}
const marker = (svg, color, r = 7) => {
  const g = el('g', {}, svg); g.classList.add('move');
  style(el('circle', { cx: 0, cy: 0, r }, g), { fill: color, stroke: 'var(--card)', strokeWidth: 2 });
  return g;
};
const path = (svg, css) => style(el('path', { fill: 'none' }, svg), css);
const moveTo = (g, P, x, y) => { g.style.transform = `translate(${P.X(x)}px, ${P.Y(y)}px)`; };

// ---------- 1. Мгновенная скорость ----------
const f1 = t => t * t;
const t1 = bindRange('t1', render1), d1 = bindRange('d1', render1);
const P1 = plane($('p1'), { H: 320, x0: 0, x1: 7.6, y0: 0, y1: 58, sx: 1, sy: 5 });
style(el('path', { d: P1.curve(f1), fill: 'none', pathLength: 1 }, $('p1')), { stroke: 'var(--b)', strokeWidth: 4 }).classList.add('draw');
const tan1 = path($('p1'), { stroke: 'var(--muted)', strokeWidth: 2, strokeDasharray: '6 5' });
const sec1 = path($('p1'), { stroke: 'var(--gold)', strokeWidth: 3 });
const tri1 = path($('p1'), { stroke: 'var(--a)', strokeWidth: 2.5 });
const dtL1 = text($('p1'), 0, 0, 'Δt', { 'font-weight': 700 }, 'var(--a)');
const dsL1 = text($('p1'), 0, 0, 'Δs', { 'font-weight': 700, 'text-anchor': 'start' }, 'var(--a)');
const A1 = marker($('p1'), 'var(--b)'), B1 = marker($('p1'), 'var(--gold)');
text($('p1'), 552, 314, 'время t', { 'text-anchor': 'end', 'font-size': 11 }, 'var(--muted)');
text($('p1'), 30, 14, 'путь s', { 'text-anchor': 'start', 'font-size': 11 }, 'var(--muted)');
let shrinkTimer = null;
function render1() {
  const t = t1(), d = d1(), sA = f1(t), sB = f1(t + d), m = (sB - sA) / d, { X, Y } = P1;
  $('t1v').textContent = fmt(t, 1); $('d1v').textContent = fmt(d, 2);
  $('f1').innerHTML = `v<sub>ср</sub> = Δs : Δt = ${fmt(sB - sA, 2)} : ${fmt(d, 2)} = <span style="color:var(--gold)">${fmt(m, 2)}</span>`;
  tan1.setAttribute('d', P1.line(t, sA, 2 * t));
  sec1.setAttribute('d', P1.line(t, sA, m));
  tri1.setAttribute('d', `M${X(t)},${Y(sA)} H${X(t + d)} V${Y(sB)}`);
  setAttrs(dtL1, { x: (X(t) + X(t + d)) / 2, y: Y(sA) + 16 });
  setAttrs(dsL1, { x: X(t + d) + 6, y: (Y(sA) + Y(sB)) / 2 });
  moveTo(A1, P1, t, sA); moveTo(B1, P1, t + d, sB);
  $('i1').innerHTML = chipsHTML([
    `средняя скорость = 2t + Δt = ${fmt(2 * t, 1)} + ${fmt(d, 2)}`,
    `<span style="color:var(--muted)">- - -</span> мгновенная: s'(t) = 2t = ${fmt(2 * t, 1)}`,
    d <= 0.1 ? '✅ секущая почти слилась с касательной' : 'сожмите Δt — жёлтая прямая повернётся к пунктиру']);
}
$('shrink1').onclick = () => {
  clearInterval(shrinkTimer);
  shrinkTimer = setInterval(() => {
    const d = Math.max(0.05, +(d1() * 0.8).toFixed(2));
    $('d1').value = d; render1();
    if (d <= 0.05) clearInterval(shrinkTimer);
  }, 160);
};

// ---------- 2. Наклон касательной ----------
const f2 = x => x ** 3 / 3 - 3 * x, df2 = x => x * x - 3;
const x2 = bindRange('x2', render2);
const P2 = plane($('p2'), { H: 280, x0: -4.5, x1: 4.5, y0: -8, y1: 8, sx: 1, sy: 2 });
const P2d = plane($('p2d'), { H: 190, x0: -4.5, x1: 4.5, y0: -4, y1: 14, sx: 1, sy: 2 });
const r3 = Math.sqrt(3);
[[-4.5, -r3, 'var(--c)'], [-r3, r3, 'var(--a)'], [r3, 4.5, 'var(--c)']].forEach(([a, b, c]) => {
  const r = el('rect', { x: P2d.X(a), y: 0, width: P2d.X(b) - P2d.X(a), height: 190 });
  $('p2d').insertBefore(r, $('p2d').firstChild);
  style(r, { fill: c, fillOpacity: .1 });
});
text($('p2d'), 552, 16, "график f'(x): выше нуля — f растёт", { 'text-anchor': 'end', 'font-size': 11 }, 'var(--muted)');
path($('p2'), { stroke: 'var(--b)', strokeWidth: 4 }).setAttribute('d', P2.curve(f2));
path($('p2d'), { stroke: 'var(--gold)', strokeWidth: 3 }).setAttribute('d', P2d.curve(df2));
const guide2 = [P2, P2d].map(P => style(el('line', { y1: 0, y2: P.H, 'stroke-dasharray': '4 4' }, P === P2 ? $('p2') : $('p2d')), { stroke: 'var(--muted)' }));
const tan2 = path($('p2'), { strokeWidth: 3 });
const dot2 = marker($('p2'), 'var(--ink)'), dot2d = marker($('p2d'), 'var(--ink)');
function render2() {
  const x = x2(), y = f2(x), m = df2(x), c = slopeColor(m);
  $('x2v').textContent = sfmt(x, 1);
  $('f2').innerHTML = `f'(${sfmt(x, 1)}) = <span style="color:${c}">${sfmt(m, 2)}</span>`;
  tan2.setAttribute('d', P2.line(x, y, m)); tan2.style.stroke = c;
  moveTo(dot2, P2, x, y); moveTo(dot2d, P2d, x, m);
  setAttrs(guide2[0], { x1: P2.X(x), x2: P2.X(x) }); setAttrs(guide2[1], { x1: P2d.X(x), x2: P2d.X(x) });
  $('i2').innerHTML = chipsHTML([
    m > 0.05 ? '📈 f\'(x) > 0 — функция растёт' : m < -0.05 ? '📉 f\'(x) < 0 — функция падает' : '⏸ f\'(x) ≈ 0 — касательная горизонтальна',
    `касательная поднимается на ${sfmt(m, 2)} при шаге 1 вправо`,
    'чем круче график, тем больше |f\'(x)|']);
}

// ---------- 3. Правила: (x²)' = 2x ----------
const x3 = bindRange('x3', render3), d3 = bindRange('d3', render3);
function render3() {
  const x = x3(), d = d3(), u = 30, B = 345, svg = $('p3');
  $('x3v').textContent = fmt(x, 1); $('d3v').textContent = fmt(d, 1);
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 360 360');
  const rect = (rx, ry, w, h, color, delay, cls = 'pop') => style(el('rect', { x: 10 + rx * u, y: B - ry * u - h * u, width: w * u, height: h * u }, svg),
    { fill: color, stroke: 'var(--card)', strokeWidth: 2, animationDelay: delay + 'ms' }).classList.add(cls);
  rect(0, 0, x, x, 'var(--b)', 0, 'fade');
  rect(x, 0, d, x, 'var(--gold)', 200);
  rect(0, x, x, d, 'var(--gold)', 350);
  rect(x, x, d, d, 'var(--a)', 500);
  text(svg, 10 + (x * u) / 2, B - (x * u) / 2 + 6, `x² = ${fmt(x * x, 2)}`, { 'font-weight': 700, 'font-size': 15 }, '#fff');
  text(svg, 10 + (x * u) / 2, B + 14, `x = ${fmt(x, 1)}`, { 'font-size': 12 });
  text(svg, 10 + x * u + (d * u) / 2, B + 14, 'dx', { 'font-size': 12 }, 'var(--gold)');
  const dS = 2 * x * d + d * d;
  $('f3').innerHTML = `ΔS : dx = 2x + dx = <span style="color:var(--gold)">${fmt(2 * x + d, 2)}</span>`;
  $('i3').innerHTML = chipsHTML([
    `две полоски: 2·${fmt(x, 1)}·${fmt(d, 1)} = ${fmt(2 * x * d, 2)}`,
    `<span style="color:var(--a)">■</span> уголок: ${fmt(d, 1)}² = ${fmt(d * d, 2)} — ${fmt((d * d / dS) * 100, 0)}% прибавки`,
    `при dx → 0 остаётся 2x = ${fmt(2 * x, 1)}`]);
}

// ---------- 4. Минимум и максимум ----------
let shown4 = false;
const c4 = bindRange('c4', () => { shown4 = false; render4(); });
$('go4').onclick = () => { shown4 = true; render4(); };
function render4() {
  const c = c4(), f = x => x ** 3 / 3 - c * x, df = x => x * x - c, r = Math.sqrt(c);
  $('c4v').textContent = fmt(c, 1);
  $('f4').innerHTML = `f'(x) = x² − ${fmt(c, 1)} = 0<br>x = ±√${fmt(c, 1)}${c ? ` ≈ ±${fmt(r, 2)}` : ' = 0'}`;
  const svg = $('p4'), P = plane(svg, { H: 320, x0: -4.5, x1: 4.5, y0: -12, y1: 12, sx: 1, sy: 2 });
  const parts = c ? [[-4.5, -r, '+'], [-r, r, '−'], [r, 4.5, '+']] : [[-4.5, 0, '+'], [0, 4.5, '+']];
  parts.forEach(([a, b, s]) => {
    style(el('rect', { x: P.X(a), y: 296, width: P.X(b) - P.X(a), height: 24 }, svg), { fill: s === '+' ? 'var(--c)' : 'var(--a)', fillOpacity: .3 });
    text(svg, (P.X(a) + P.X(b)) / 2, 313, `f' ${s}`, { 'font-weight': 700 }, s === '+' ? 'var(--c)' : 'var(--a)');
  });
  path(svg, { stroke: 'var(--b)', strokeWidth: 4 }).setAttribute('d', P.curve(f));
  const info = [];
  if (shown4 && c) {
    [[-r, 'максимум', 'var(--a)'], [r, 'минимум', 'var(--c)']].forEach(([x, name, col], i) => {
      path(svg, { stroke: 'var(--gold)', strokeWidth: 3, animationDelay: i * 300 + 'ms' }).setAttribute('d', `M${P.X(x - 1)},${P.Y(f(x))} H${P.X(x + 1)}`);
      const g = el('g', {}, svg);
      g.setAttribute('transform', `translate(${P.X(x)},${P.Y(f(x))})`);
      const inner = el('g', {}, g);
      style(inner, { animationDelay: i * 300 + 'ms' }).classList.add('pop');
      style(el('circle', { r: 8 }, inner), { fill: col, stroke: 'var(--card)', strokeWidth: 2 });
      text(inner, 0, x < 0 ? -14 : 24, `${name} ${sfmt(f(x), 2)}`, { 'font-weight': 700, 'font-size': 12 });
    });
    info.push(`x = ${sfmt(-r, 2)}: f' меняет «+» на «−» → максимум`, `x = ${fmt(r, 2)}: f' меняет «−» на «+» → минимум`);
  } else if (shown4) {
    info.push("x = 0: f'(0) = 0, но знак не меняется (+ и +) — это не экстремум, а перегиб");
  } else info.push('нажмите «Найти экстремумы»', 'посмотрите на полосу знаков f\' под графиком');
  info.push('f\'(x) = 0 — кандидат; проверяем, меняется ли знак');
  $('i4').innerHTML = chipsHTML(info);
}

// ---------- 5. Градиентный спуск ----------
const FN5 = {
  bowl: { f: x => (x - 3) ** 2 / 2 + 1, df: x => x - 3, y1: 30 },
  bumpy: { f: x => (x - 3) ** 2 / 4 + 2 * Math.sin(1.5 * x) + 3, df: x => (x - 3) / 2 + 3 * Math.cos(1.5 * x), y1: 22 },
};
let fn5 = 'bowl', gd = {}, timer5 = null, P5, trail5, ball5;
const s5 = bindRange('st5', reset5), l5 = bindRange('l5', reset5);
$('fn5').addEventListener('input', () => { fn5 = $('fn5').value; reset5(); });
function reset5() {
  clearInterval(timer5);
  const F = FN5[fn5];
  $('st5v').textContent = sfmt(s5(), 1); $('l5v').textContent = fmt(l5(), 2);
  P5 = plane($('p5'), { H: 300, x0: -5, x1: 10, y0: 0, y1: F.y1, sx: 1, sy: 2 });
  path($('p5'), { stroke: 'var(--b)', strokeWidth: 4 }).setAttribute('d', P5.curve(F.f, 300));
  trail5 = el('g', {}, $('p5'));
  ball5 = marker($('p5'), 'var(--a)', 10);
  gd = { x: s5(), rows: [], done: false };
  moveTo(ball5, P5, gd.x, F.f(gd.x));
  render5();
}
function step5() {
  const F = FN5[fn5], lr = l5();
  if (gd.done) return;
  const x = gd.x, g = F.df(x), nx = x - lr * g;
  gd.rows.push({ x, g, nx });
  style(el('line', { x1: P5.X(x), y1: P5.Y(F.f(x)), x2: P5.X(nx), y2: P5.Y(F.f(nx)) }, trail5), { stroke: 'var(--gold)', strokeWidth: 2, strokeDasharray: '4 3' });
  style(el('circle', { cx: P5.X(x), cy: P5.Y(F.f(x)), r: 4 }, trail5), { fill: 'var(--gold)' });
  gd.x = nx;
  if (Math.abs(nx) > 40) { gd.done = 'boom'; clearInterval(timer5); }
  else {
    moveTo(ball5, P5, nx, F.f(nx));
    if (Math.abs(F.df(nx)) < 0.01 || gd.rows.length >= 60) { gd.done = 'ok'; clearInterval(timer5); }
  }
  render5();
}
function render5() {
  const F = FN5[fn5], lr = l5();
  $('t5').innerHTML = '<tr><th>шаг</th><th>x</th><th>f\'(x)</th><th>− скорость · f\'</th><th>новый x</th></tr>' +
    gd.rows.slice(-5).map((r, i, arr) => `<tr class="${i === arr.length - 1 ? 'fade' : ''}"><td>${gd.rows.length - arr.length + i + 1}</td>
      <td>${sfmt(r.x, 3)}</td><td style="color:${slopeColor(r.g)}">${sfmt(r.g, 3)}</td><td>${sfmt(-lr * r.g, 3)}</td><td>${sfmt(r.nx, 3)}</td></tr>`).join('');
  let msg;
  if (gd.done === 'boom') msg = '💥 <b>Улетели!</b> Скорость обучения слишком большая: каждый шаг перепрыгивает минимум всё дальше.';
  else if (gd.done === 'ok') {
    let best = 0;
    for (let x = -5; x <= 10; x += 0.001) if (F.f(x) < F.f(best)) best = x;
    msg = Math.abs(gd.x - best) < 0.1
      ? `✅ Производная ≈ 0 — нашли минимум: x ≈ ${sfmt(gd.x, 2)} за ${gd.rows.length} шаг.`
      : `⚠️ Застряли в <b>местной ямке</b> (x ≈ ${sfmt(gd.x, 2)}). Самая глубокая — около x ≈ ${sfmt(best, 2)}. Попробуйте другой старт.`;
  } else msg = lr >= 2 ? 'Скорость обучения ≥ 2 для «чаши» — посмотрите, что будет.'
    : 'Знак производной показывает, куда идти вниз; её величина — насколько далеко шагнуть.';
  $('a5').innerHTML = msg;
}
$('step5').onclick = step5;
$('reset5').onclick = reset5;
$('auto5').onclick = () => { clearInterval(timer5); timer5 = setInterval(step5, 650); };

// ---------- 6. Зачем нужна производная ----------
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
let useTab = 'price', timer6 = null, frame6 = null;
const TRAIN_X = [1, 2, 3, 4, 5, 6, 7, 8], TRAIN_NOISE = [0.6, -1.1, 0.3, 1.4, -0.5, -0.9, 0.8, -0.2];
const TRAIN_Y = TRAIN_X.map((x, i) => 1.8 * x + TRAIN_NOISE[i]);
const loss = w => TRAIN_X.reduce((s, x, i) => s + (TRAIN_Y[i] - w * x) ** 2, 0) / TRAIN_X.length;
const dloss = w => (-2 * TRAIN_X.reduce((s, x, i) => s + x * (TRAIN_Y[i] - w * x), 0)) / TRAIN_X.length;
const W_BEST = TRAIN_X.reduce((s, x, i) => s + x * TRAIN_Y[i], 0) / TRAIN_X.reduce((s, x) => s + x * x, 0);
const USES = {
  price: {
    controls: slider('pC', 'Себестоимость товара, ₽', 100, 400, 200, 50) + slider('pP', 'Цена, ₽', 100, 1000, 450, 10) +
      '<p class="lead" style="margin:0">Спрос: при цене p покупают 1000 − p штук в месяц.</p>',
    render() {
      const c = +$('pC').value, p = +$('pP').value, P = x => (x - c) * (1000 - x), dP = x => 1000 - 2 * x + c, opt = (1000 + c) / 2;
      $('pCv').textContent = c; $('pPv').textContent = p;
      const max = P(opt), m = dP(p), col = slopeColor(m / 100);
      $('useOut').innerHTML = `
        <div class="mid">P'(${p}) = 1000 − 2·${p} + ${c} = <span style="color:${col}">${sgn(m)}</span></div>
        <svg id="prSvg" class="plot" style="margin-top:10px"></svg>
        <div class="info">${chipsHTML([`прибыль: (${p} − ${c})·${1000 - p} = ${num(P(p))} ₽`,
          m > 0 ? '📈 P\' > 0 — цену выгодно поднять' : m < 0 ? '📉 P\' < 0 — цену выгодно снизить' : '🎯 P\' = 0 — лучшая цена!',
          `лучшая цена: P'(p) = 0 → p = (1000 + ${c}) : 2 = ${num(opt)} ₽, прибыль ${num(max)} ₽`])}</div>
        <p class="answer">Прибыль = (цена − себестоимость) · количество. Дорого — мало покупают, дёшево — мало зарабатываем с штуки.
        Лучшая цена там, где <b>производная прибыли равна нулю</b>: касательная на вершине горизонтальна.</p>`;
      // график в тысячах рублей, чтобы подписи оси помещались
      const K = x => P(x) / 1000, mk = max / 1000;
      const Pl = plane($('prSvg'), { H: 280, x0: 0, x1: 1050, y0: -mk * 0.25, y1: mk * 1.2, sx: 100, sy: niceStep(mk / 5) });
      text($('prSvg'), 30, 14, 'прибыль, тыс. ₽', { 'text-anchor': 'start', 'font-size': 11 }, 'var(--muted)');
      style(el('path', { d: Pl.curve(x => (x >= c - 50 ? K(x) : NaN), 200), fill: 'none', pathLength: 1 }, $('prSvg')), { stroke: 'var(--b)', strokeWidth: 4 }).classList.add('draw');
      style(el('line', { x1: Pl.X(opt), y1: Pl.Y(mk), x2: Pl.X(opt), y2: Pl.Y(0), 'stroke-dasharray': '5 4' }, $('prSvg')), { stroke: 'var(--gold)', strokeWidth: 2 });
      path($('prSvg'), { stroke: col, strokeWidth: 3 }).setAttribute('d', Pl.curve(x => K(p) + (m / 1000) * (x - p), 1, Math.max(0, p - 200), Math.min(1050, p + 200)));
      style(el('circle', { cx: Pl.X(p), cy: Pl.Y(K(p)), r: 8 }, $('prSvg')), { fill: col, stroke: 'var(--card)', strokeWidth: 2 }).classList.add('pop');
    },
  },
  box: {
    controls: slider('bX', 'Вырезаем по углам квадраты, см', 0.5, 14.5, 2, 0.5) + '<p class="lead" style="margin:0">Лист 30 × 30 см. Углы загибаем вверх — получаем коробку без крышки.</p>',
    render() {
      const x = +$('bX').value, V = t => t * (30 - 2 * t) ** 2, dV = t => (30 - 2 * t) * (30 - 6 * t);
      $('bXv').textContent = fmt(x, 1);
      const m = dV(x), col = slopeColor(m / 50), k = 7, s = 30 * k;
      let corners = '';
      [[0, 0], [30 - x, 0], [0, 30 - x], [30 - x, 30 - x]].forEach(([cx, cy], i) => {
        corners += `<rect class="pop" x="${10 + cx * k}" y="${10 + cy * k}" width="${x * k}" height="${x * k}" style="fill:var(--a);animation-delay:${i * 100}ms"/>`;
      });
      $('useOut').innerHTML = `
        <div class="mid">V = x·(30 − 2x)² = <span style="color:${col}">${num(Math.round(V(x)))} см³</span></div>
        <div class="two" style="margin-top:10px">
          <svg viewBox="0 0 230 230" style="max-width:230px;margin:0 auto">
            <rect x="10" y="10" width="${s}" height="${s}" style="fill:var(--gold);fill-opacity:.35;stroke:var(--gold)"/>
            <rect x="${10 + x * k}" y="${10 + x * k}" width="${(30 - 2 * x) * k}" height="${(30 - 2 * x) * k}" style="fill:none;stroke:var(--ink);stroke-dasharray:5 4"/>
            ${corners}
            <text x="115" y="${10 + s / 2 + 5}" text-anchor="middle" font-size="13" style="fill:var(--ink)">дно ${fmt(30 - 2 * x, 1)} × ${fmt(30 - 2 * x, 1)}</text>
          </svg>
          <svg id="bxSvg" class="plot"></svg>
        </div>
        <div class="info">${chipsHTML([`V'(x) = (30 − 2x)(30 − 6x) = ${sgn(Math.round(m))}`, m > 0 ? 'V\' > 0 — вырезайте больше' : m < 0 ? 'V\' < 0 — вырезайте меньше' : '🎯 V\' = 0 — объём наибольший!',
          'максимум при x = 5 см: V = 2 000 см³ = 2 литра'])}</div>
        <p class="answer">Маленькие углы — коробка плоская, большие — узкая. Где-то посередине объём <b>наибольший</b>.
        Чтобы найти его без перебора, решаем V'(x) = 0: 30 − 6x = 0, <b>x = 5 см</b>.</p>`;
      const P = plane($('bxSvg'), { W: 300, H: 230, x0: 0, x1: 15, y0: 0, y1: 2400, sx: 5, sy: 500 });
      path($('bxSvg'), { stroke: 'var(--b)', strokeWidth: 3 }).setAttribute('d', P.curve(V));
      path($('bxSvg'), { stroke: col, strokeWidth: 2.5 }).setAttribute('d', P.curve(t => V(x) + m * (t - x), 1, Math.max(0, x - 3), Math.min(15, x + 3)));
      style(el('circle', { cx: P.X(x), cy: P.Y(V(x)), r: 7 }, $('bxSvg')), { fill: col }).classList.add('pop');
    },
  },
  car: {
    controls: slider('cT', 'Время, с', 0, 20, 5, 0.1) + `<div class="btns"><button class="primary" id="cGo">Поехать ▶</button></div>`,
    render() {
      const s = t => 400 * (3 * (t / 20) ** 2 - 2 * (t / 20) ** 3), v = t => 120 * (t / 20 - (t / 20) ** 2);
      if (!$('cSvg')) {
        $('useOut').innerHTML = `<div class="mid" id="cHead"></div>
          <svg id="cSvg" viewBox="0 0 560 230" style="margin-top:10px"></svg><div class="info" id="cInfo"></div>
          <p class="answer">Путь растёт неравномерно: сначала медленно, потом быстро, потом опять медленно. Спидометр показывает
          <b>скорость в этот момент</b> — производную пути s'(t). А производная скорости — ускорение: плюс при разгоне, минус при торможении.</p>`;
        const svg = $('cSvg');
        style(el('line', { x1: 20, y1: 190, x2: 330, y2: 190 }, svg), { stroke: 'var(--ink)', strokeWidth: 3 });
        for (let m = 0; m <= 400; m += 100) text(svg, 20 + m * 0.75, 210, m + ' м', { 'font-size': 11 }, 'var(--muted)');
        const car = el('text', { id: 'cCar', x: 0, y: 186, 'font-size': 30, 'text-anchor': 'middle' }, svg);
        car.textContent = '🚗'; car.style.transform = 'scaleX(-1)'; car.style.transformBox = 'fill-box'; car.style.transformOrigin = 'center';
        const cx = 450, cy = 150, R = 90;
        style(el('path', { d: `M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy}`, fill: 'none' }, svg), { stroke: 'var(--line)', strokeWidth: 12 });
        for (let k = 0; k <= 120; k += 20) {
          const a = Math.PI * (1 - k / 120);
          text(svg, cx + (R + 18) * Math.cos(a), cy - (R + 18) * Math.sin(a) + 4, k, { 'font-size': 11 }, 'var(--muted)');
        }
        const needle = el('g', { id: 'cNeedle' }, svg);
        style(needle, { transformBox: 'view-box', transformOrigin: `${cx}px ${cy}px` });
        style(el('line', { x1: cx, y1: cy, x2: cx - R + 14, y2: cy }, needle), { stroke: 'var(--a)', strokeWidth: 4, strokeLinecap: 'round' });
        style(el('circle', { cx, cy, r: 7 }, svg), { fill: 'var(--a)' });
        text(svg, cx, cy + 30, 'км/ч', { 'font-size': 12 }, 'var(--muted)');
      }
      const t = +$('cT').value, kmh = v(t) * 3.6, acc = (v(t + 0.01) - v(t - 0.01)) / 0.02;
      $('cTv').textContent = fmt(t, 1);
      $('cCar').setAttribute('x', 20 + s(t) * 0.75);
      $('cNeedle').style.transform = `rotate(${(kmh / 120) * 180}deg)`;
      $('cHead').innerHTML = `s'(${fmt(t, 1)}) = <span style="color:var(--a)">${fmt(v(t), 1)} м/с ≈ ${fmt(kmh, 0)} км/ч</span>`;
      $('cInfo').innerHTML = chipsHTML([`проехали s = ${fmt(s(t), 0)} м`, t < 0.05 || t > 19.95 ? 'стоим' : acc > 0.05 ? '⬆ разгон: ускорение > 0' : acc < -0.05 ? '⬇ торможение: ускорение < 0' : 'скорость максимальна: ускорение = 0']);
      $('cGo').onclick = () => {
        cancelAnimationFrame(frame6);
        const start = performance.now();
        const tick = now => { const tt = Math.min(20, ((now - start) / 6000) * 20); $('cT').value = tt; USES.car.render(); if (tt < 20) frame6 = requestAnimationFrame(tick); };
        frame6 = requestAnimationFrame(tick);
      };
    },
  },
  train: {
    controls: slider('tL', 'Скорость обучения', 0.002, 0.04, 0.01, 0.002) +
      `<div class="btns"><button class="primary" id="tStep">Шаг ▶</button><button id="tAuto">Авто ▶▶</button><button id="tReset">Сначала</button></div>`,
    w: 0, steps: 0,
    render() {
      const u = USES.train, lr = +$('tL').value;
      $('tLv').textContent = fmt(lr, 3);
      if (!$('trA')) {
        $('useOut').innerHTML = `<div class="mid" id="tHead"></div>
          <div class="two" style="margin-top:10px"><svg id="trA" class="plot"></svg><svg id="trB" class="plot"></svg></div>
          <div class="info" id="tInfo"></div>
          <p class="answer">Модель y = w·x подбирает наклон w. Ошибка — средний квадрат промахов, она зависит от w как парабола.
          Каждый шаг: <b>w ← w − скорость · L'(w)</b>. Прямая слева поворачивается к точкам, шарик справа скатывается в минимум ошибки.
          Настоящие модели делают то же самое, только параметров у них миллионы.</p>`;
        u.A = plane($('trA'), { W: 280, H: 260, x0: 0, x1: 9, y0: 0, y1: 18, sx: 1, sy: 2 });
        TRAIN_X.forEach((x, i) => style(el('circle', { cx: u.A.X(x), cy: u.A.Y(TRAIN_Y[i]), r: 5 }, $('trA')), { fill: 'var(--ink)' }));
        u.lineA = path($('trA'), { stroke: 'var(--a)', strokeWidth: 3 });
        u.B = plane($('trB'), { W: 280, H: 260, x0: -0.2, x1: 3.6, y0: 0, y1: 90, sx: 0.5, sy: 10 });
        path($('trB'), { stroke: 'var(--b)', strokeWidth: 3 }).setAttribute('d', u.B.curve(loss));
        text($('trB'), 272, 250, 'w', { 'text-anchor': 'end', 'font-style': 'italic' }, 'var(--muted)');
        text($('trB'), 30, 14, 'ошибка', { 'text-anchor': 'start', 'font-size': 11 }, 'var(--muted)');
        u.ball = marker($('trB'), 'var(--a)', 8);
      }
      u.lineA.setAttribute('d', u.A.curve(x => u.w * x, 1));
      moveTo(u.ball, u.B, u.w, Math.min(loss(u.w), 89));
      const g = dloss(u.w);
      $('tHead').innerHTML = `шаг ${u.steps}: w = ${fmt(u.w, 3)}, ошибка = <span style="color:var(--a)">${fmt(loss(u.w), 2)}</span>`;
      $('tInfo').innerHTML = chipsHTML([`L'(w) = ${sfmt(g, 2)} → w ${g > 0 ? 'уменьшаем' : 'увеличиваем'}`,
        `лучший w = ${fmt(W_BEST, 3)}`, Math.abs(u.w - W_BEST) < 0.005 ? '✅ модель обучена' : 'жмите «Шаг» или «Авто»']);
      const step = () => {
        u.w -= lr * dloss(u.w); u.steps++;
        if (Math.abs(u.w) > 20) { u.w = 0; u.steps = 0; clearInterval(timer6); $('tHead').textContent = '💥 скорость слишком большая — начинаем сначала'; return; }
        u.render();
        if (Math.abs(u.w - W_BEST) < 0.0005) clearInterval(timer6);
      };
      $('tStep').onclick = step;
      $('tAuto').onclick = () => { clearInterval(timer6); timer6 = setInterval(step, 500); };
      $('tReset').onclick = () => { clearInterval(timer6); u.w = 0; u.steps = 0; u.render(); };
    },
  },
};
function buildUse() {
  clearInterval(timer6); cancelAnimationFrame(frame6);
  USES.train.w = 0; USES.train.steps = 0;
  const u = USES[useTab];
  $('useOut').innerHTML = '';
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
    const a = rnd(1, 5), n = rnd(2, 4), x = rnd(-3, 3);
    q = { text: `f(${X_}) = ${a === 1 ? '' : a}${X_}<sup>${n}</sup>. f'(${sgn(x)}) = ?`, ans: a * n * x ** (n - 1),
          hint: `(x<sup>${n}</sup>)' = ${n}x<sup>${n - 1}</sup>, значит f'(x) = ${a * n}x<sup>${n - 1}</sup>.` };
  } else if (type === 1) {
    const b = rnd(-9, 9), c = rnd(-9, 9), x = rnd(-5, 5);
    q = { text: `f(${X_}) = ${poly([[1, `${X_}²`], [b, X_], [c, '']])}. f'(${sgn(x)}) = ?`, ans: 2 * x + b,
          hint: `f'(x) = 2x${b ? (b > 0 ? ' + ' : ' − ') + Math.abs(b) : ''}: константа исчезает.` };
  } else if (type === 2) {
    const k = nz(-9, 9), b = rnd(-20, 20), x = rnd(-10, 10);
    q = { text: `f(${X_}) = ${poly([[k, X_], [b, '']])}. f'(${sgn(x)}) = ?`, ans: k, hint: 'Производная прямой — её наклон k, в любой точке одинаковый.' };
  } else if (type === 3) {
    const b = rnd(-6, 6) * 2, c = rnd(-9, 9);
    q = { text: `f(${X_}) = ${poly([[1, `${X_}²`], [b, X_], [c, '']])}. При каком ${X_} минимум?`, ans: -b / 2,
          hint: `f'(x) = 2x${b ? (b > 0 ? ' + ' : ' − ') + Math.abs(b) : ''} = 0.` };
  } else if (type === 4) {
    const ta = rnd(0, 4), tb = ta + rnd(1, 4);
    q = { text: story(`🚗 Путь s = t² (м). Средняя скорость с ${ta}-й по ${tb}-ю секунду (м/с)?`), ans: ta + tb,
          hint: `(${tb}² − ${ta}²) : (${tb} − ${ta}) = ${tb * tb - ta * ta} : ${tb - ta}.` };
  } else if (type === 5) {
    const x = rnd(-5, 8), g = nz(-8, 8), lr = pick([0.1, 0.5, 0.25]);
    q = { text: story(`🤖 Градиентный спуск: x = ${sgn(x)}, f'(x) = ${sgn(g)}, скорость обучения ${fmt(lr, 2)}. Новый x = ?`), ans: x - lr * g,
          hint: `x − скорость · f'(x) = ${sgn(x)} − ${fmt(lr, 2)}·${par(g)}.` };
  } else {
    const a = rnd(2, 10) * 100;
    q = { text: story(`💰 При цене p ₽ в день покупают ${a} − p штук. При какой цене выручка p·(${a} − p) наибольшая?`), ans: a / 2,
          hint: `Выручка = ${a}p − p². Производная ${a} − 2p = 0.` };
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

render1(); render2(); render3(); render4(); reset5(); buildUse(); newQuiz();
$('qScore').textContent = 'Счёт: 0 из 0';
