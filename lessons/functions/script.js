const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const fmt = (x, d = 3) => (+x.toFixed(d)).toLocaleString('ru-RU', { maximumFractionDigits: d });
const chipsHTML = list => list.map(c => `<span class="chip fade">${c}</span>`).join('');
const X_ = '<i class="v">x</i>', X2_ = '<i class="v">x</i>²';
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
const lin = (k, b) => poly([[k, X_], [b, '']]);

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
  const curve = (f, n = 240) => {
    let d = '', pen = false;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = f(x);
      if (!isFinite(y)) { pen = false; continue; }
      const yc = Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), y));
      d += (pen ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(yc).toFixed(1);
      pen = true;
    }
    return d;
  };
  return { X, Y, curve };
}
const marker = (svg, color, r = 7) => {
  const g = el('g', {}, svg); g.classList.add('move');
  style(el('circle', { cx: 0, cy: 0, r }, g), { fill: color, stroke: 'var(--card)', strokeWidth: 2 });
  return g;
};

// ---------- 1. Что такое функция ----------
const RULES = {
  lin: { f: x => 2 * x + 1, how: x => `2·${par(x)} + 1`, color: 'var(--b)' },
  sq: { f: x => x * x, how: x => `${par(x)}·${par(x)}`, color: 'var(--a)' },
  down: { f: x => 10 - x, how: x => `10 − ${par(x)}`, color: 'var(--c)' },
};
let rule1 = 'lin', pts1 = [], P1;
const x1 = bindRange('x1', () => { $('x1v').textContent = sgn(x1()); });
function build1() {
  P1 = plane($('p1'), { x0: -6, x1: 6, y0: -12, y1: 28, sx: 1, sy: 4 });
  P1.g = el('g', {}, $('p1'));
  pts1 = [];
  $('t1').innerHTML = '';
  $('m1').innerHTML = '<span class="lead" style="margin:0">Выберите x и нажмите «В машину».</span>';
  $('x1v').textContent = sgn(x1());
}
function feed1() {
  const x = x1(), R = RULES[rule1], y = R.f(x), label = $('rule1').selectedOptions[0].textContent;
  $('m1').innerHTML = `
    <span class="tok pop" style="background:var(--b)">${sgn(x)}</span>
    <span class="arr pop" style="animation-delay:.2s">→ ${label} →</span>
    <span class="tok pop" style="background:var(--a);animation-delay:.45s">${sgn(y)}</span>`;
  if (!pts1.includes(x)) {
    pts1.push(x);
    style(el('circle', { cx: P1.X(x), cy: P1.Y(y), r: 6 }, P1.g), { fill: R.color, animationDelay: '.6s' }).classList.add('pop');
    style(text(P1.g, P1.X(x), P1.Y(y) - 11, `(${sgn(x)}; ${sgn(y)})`, { 'font-size': 11, 'font-weight': 700 }), { animationDelay: '.7s' }).classList.add('fade');
    $('t1').insertAdjacentHTML('beforeend', `<span class="chip fade">x = ${sgn(x)} → y = ${R.how(x)} = ${sgn(y)}</span>`);
  }
  if (x < 5) { $('x1').value = x + 1; $('x1v').textContent = sgn(x + 1); }
}
$('rule1').addEventListener('input', () => { rule1 = $('rule1').value; build1(); });
$('feed1').onclick = feed1;
$('clear1').onclick = build1;
$('all1').onclick = () => {
  const p = el('path', { d: P1.curve(RULES[rule1].f), fill: 'none', pathLength: 1 }, $('p1'));
  style(p, { stroke: RULES[rule1].color, strokeWidth: 3, opacity: .7 }).classList.add('draw');
};

// ---------- 2. Линейная функция ----------
const k2 = bindRange('k2', render2), b2 = bindRange('b2', render2);
const P2 = plane($('p2'), { x0: -6, x1: 6, y0: -12, y1: 12, sx: 1, sy: 2 });
const line2 = style(el('path', { fill: 'none' }, $('p2')), { stroke: 'var(--b)', strokeWidth: 4, strokeLinecap: 'round' });
const tri2 = style(el('path', { fill: 'none' }, $('p2')), { stroke: 'var(--gold)', strokeWidth: 3, strokeDasharray: '6 4' });
const triH2 = text($('p2'), 0, 0, '+1', { 'font-weight': 700 }, 'var(--gold)');
const triV2 = text($('p2'), 0, 0, '', { 'font-weight': 700, 'text-anchor': 'start' }, 'var(--gold)');
const start2 = marker($('p2'), 'var(--c)'), root2 = marker($('p2'), 'var(--a)');
function render2() {
  const k = k2(), b = b2(), f = x => k * x + b, { X, Y } = P2;
  $('k2v').textContent = sgn(k); $('b2v').textContent = sgn(b);
  $('f2').innerHTML = `y = ${lin(k, b)}`;
  line2.setAttribute('d', P2.curve(f, 2));
  tri2.setAttribute('d', `M${X(1)},${Y(f(1))} H${X(2)} V${Y(f(2))}`);
  setAttrs(triH2, { x: (X(1) + X(2)) / 2, y: Y(f(1)) + (k >= 0 ? 16 : -8) });
  setAttrs(triV2, { x: X(2) + 6, y: (Y(f(1)) + Y(f(2))) / 2 + 4 });
  triV2.textContent = k ? (k > 0 ? '+' : '−') + fmt(Math.abs(k)) : '0';
  start2.style.transform = `translate(${X(0)}px, ${Y(b)}px)`;
  const r = k ? -b / k : null;
  root2.style.opacity = r !== null && Math.abs(r) <= 6 ? 1 : 0;
  if (r !== null) root2.style.transform = `translate(${X(r)}px, ${Y(0)}px)`;
  $('i2').innerHTML = chipsHTML([
    k > 0 ? `шаг вправо на 1 → y растёт на ${fmt(k)}` : k < 0 ? `шаг вправо на 1 → y падает на ${fmt(-k)}` : 'k = 0 — прямая горизонтальна, y не меняется',
    `<span style="color:var(--c)">●</span> при x = 0: y = b = ${sgn(b)}`,
    r === null ? (b ? 'ось x прямая не пересекает' : 'прямая лежит на оси x')
               : `<span style="color:var(--a)">●</span> y = 0 при x = −b : k = ${fmt(r, 2).replace('-', '−')}`]);
}

// ---------- 3. Квадратичная функция ----------
const a3 = bindRange('a3', render3), b3 = bindRange('b3', render3), c3 = bindRange('c3', render3);
const P3 = plane($('p3'), { x0: -6, x1: 6, y0: -10, y1: 14, sx: 1, sy: 2 });
const axis3 = style(el('line', { y1: 0, y2: 340 }, $('p3')), { stroke: 'var(--gold)', strokeWidth: 2, strokeDasharray: '6 5' });
const par3 = style(el('path', { fill: 'none' }, $('p3')), { stroke: 'var(--a)', strokeWidth: 4, strokeLinecap: 'round' });
const roots3 = [marker($('p3'), 'var(--c)', 6), marker($('p3'), 'var(--c)', 6)];
const top3 = marker($('p3'), 'var(--gold)', 8);
function render3() {
  const a = a3(), b = b3(), c = c3(), f = x => a * x * x + b * x + c, { X, Y } = P3;
  $('a3v').textContent = sgn(a); $('b3v').textContent = sgn(b); $('c3v').textContent = sgn(c);
  $('f3').innerHTML = `y = ${poly([[a, X2_], [b, X_], [c, '']])}`;
  par3.setAttribute('d', P3.curve(f));
  if (!a) {
    top3.style.opacity = 0; axis3.style.opacity = 0; roots3.forEach(r => r.style.opacity = 0);
    $('i3').innerHTML = chipsHTML(['a = 0 — квадрата нет, это уже прямая y = ' + lin(b, c)]);
    return;
  }
  const xv = -b / (2 * a), yv = f(xv), D = b * b - 4 * a * c;
  top3.style.opacity = 1; axis3.style.opacity = 1;
  top3.style.transform = `translate(${X(xv)}px, ${Y(yv)}px)`;
  setAttrs(axis3, { x1: X(xv), x2: X(xv) });
  const rs = D > 0 ? [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)] : D === 0 ? [xv] : [];
  roots3.forEach((m, i) => {
    m.style.opacity = i < rs.length && Math.abs(rs[i]) <= 6 ? 1 : 0;
    if (i < rs.length) m.style.transform = `translate(${X(rs[i])}px, ${Y(0)}px)`;
  });
  const f2 = v => fmt(v, 2).replace('-', '−');
  $('i3').innerHTML = chipsHTML([
    a > 0 ? 'ветви вверх → в вершине минимум' : 'ветви вниз → в вершине максимум',
    `<span style="color:var(--gold)">●</span> вершина: x = −b : 2a = ${f2(xv)}, y = ${f2(yv)}`,
    `D = b² − 4ac = ${f2(D)}`,
    rs.length === 2 ? `<span style="color:var(--c)">●</span> y = 0 при x ≈ ${f2(Math.min(...rs))} и ${f2(Math.max(...rs))}`
      : rs.length === 1 ? `<span style="color:var(--c)">●</span> касается оси x в точке x = ${f2(rs[0])}` : 'D < 0 — с осью x не пересекается']);
}

// ---------- 4. Экспонента ----------
const q4 = bindRange('q4', render4), n4 = bindRange('n4', render4);
function render4() {
  const q = q4(), n = n4(), e = k => 100 * q ** k, l = k => Math.max(0, 100 + 100 * (q - 1) * k);
  $('q4v').textContent = fmt(q, 1); $('n4v').textContent = n;
  $('f4').innerHTML = `y = 100 · ${fmt(q, 1)}<sup>${X_}</sup>`;
  const W = 560, H = 240, bw = (W - 20) / (n + 1), max = Math.max(e(n), l(n), 100) * 1.08;
  const svg = $('p4'); svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${W} ${H + 24}`);
  for (let k = 0; k <= n; k++) {
    const x = 10 + k * bw, d = Math.min(k * 70, 1200) + 'ms';
    [[e(k), 'var(--a)', .08], [l(k), 'var(--b)', .5]].forEach(([v, color, off]) => {
      const h = Math.max((v / max) * (H - 18), v > 0 ? 1 : 0);
      style(el('rect', { x: x + bw * off, y: H - h, width: bw * .4, height: h, rx: 2 }, svg), { fill: color, animationDelay: d }).classList.add('grow');
    });
    text(svg, x + bw / 2, H + 16, k, { 'font-size': 11 }, 'var(--muted)');
  }
  style(el('line', { x1: 0, y1: H, x2: W, y2: H }, svg), { stroke: 'var(--ink)' });
  const top = (v, color, dx) => {
    const t = text(svg, 10 + n * bw + bw * dx, H - (v / max) * (H - 18) - 4, fmt(v, 0), { 'font-size': 11, 'font-weight': 700 }, color);
    style(t, { animationDelay: Math.min(n * 70, 1200) + 300 + 'ms' }).classList.add('fade');
  };
  top(e(n), 'var(--a)', .28); top(l(n), 'var(--b)', .7);
  const info = [`через ${n} шагов: 100 · ${fmt(q, 1)}<sup>${n}</sup> ≈ ${fmt(e(n), 1)}`, `прямая с тем же первым шагом: ${fmt(l(n), 1)}`];
  if (q > 1) info.push(`удвоение примерно каждые ${fmt(Math.log(2) / Math.log(q), 1)} шага`);
  else if (q < 1) info.push(`половина — за ${fmt(Math.log(.5) / Math.log(q), 1)} шага; до нуля экспонента не дойдёт никогда`);
  else info.push('q = 1 — ничего не меняется');
  $('i4').innerHTML = chipsHTML(info);
}

// ---------- 5. Логарифм ----------
let base5 = 2;
const MAX5 = { 2: 10, 10: 6 };
const s5 = bindRange('y5', render5);
const y5 = () => Math.max(1, Math.round(base5 ** ((s5() / 1000) * MAX5[base5])));
let XL5, XG5;
function build5() {
  const svg = $('p5'), max = MAX5[base5], top = base5 ** max;
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 560 160');
  XL5 = v => 20 + (v / top) * 520; XG5 = v => 20 + (v / max) * 520;
  text(svg, 20, 18, 'обычная шкала: шаг = + одно и то же', { 'text-anchor': 'start', 'font-size': 12 }, 'var(--muted)');
  text(svg, 20, 94, `логарифмическая шкала: шаг = × ${base5}`, { 'text-anchor': 'start', 'font-size': 12 }, 'var(--muted)');
  [50, 126].forEach(y => style(el('line', { x1: 20, y1: y, x2: 540, y2: y }, svg), { stroke: 'var(--ink)', strokeWidth: 2 }));
  for (let k = 0; k <= max; k++) {
    style(el('line', { x1: XL5(base5 ** k), y1: 44, x2: XL5(base5 ** k), y2: 56 }, svg), { stroke: 'var(--a)' });
    style(el('line', { x1: XG5(k), y1: 120, x2: XG5(k), y2: 132 }, svg), { stroke: 'var(--a)' });
    text(svg, XG5(k), 150, num(base5 ** k), { 'font-size': 10 }, 'var(--muted)');
  }
  text(svg, XL5(0), 72, '0', { 'font-size': 10 }, 'var(--muted)');
  text(svg, XL5(top), 72, num(top), { 'font-size': 10 }, 'var(--muted)');
  ['m5a', 'm5b'].forEach((id, i) => {
    const g = el('g', { id }, svg); g.classList.add('move');
    style(el('path', { d: `M0,${i ? 120 : 44} l-7,-11 h14 z` }, g), { fill: 'var(--b)' });
  });
  render5();
}
function render5() {
  const y = y5(), b = base5, L = Math.log(y) / Math.log(b), n = Math.floor(L + 1e-9), exact = b ** n === y;
  $('y5v').textContent = num(y);
  $('f5').innerHTML = `log<sub>${b}</sub> ${num(y)} ${exact ? '=' : '≈'} <span style="color:var(--a)">${exact ? n : fmt(L, 2)}</span>`;
  let hops = `<span class="tok pop" style="background:var(--b)">1</span>`;
  for (let k = 1; k <= n; k++) {
    const d = k * 120;
    hops += `<span class="arr pop" style="animation-delay:${d - 60}ms">×${b}</span><span class="tok pop" style="background:var(--b);animation-delay:${d}ms">${num(b ** k)}</span>`;
  }
  if (!exact) hops += `<span class="arr pop" style="animation-delay:${n * 120 + 60}ms">×${fmt(y / b ** n, 2)}</span><span class="tok pop" style="background:var(--a);animation-delay:${n * 120 + 120}ms">${num(y)}</span>`;
  $('hops5').innerHTML = hops;
  $('m5a').style.transform = `translate(${XL5(y)}px, 0)`;
  $('m5b').style.transform = `translate(${XG5(L)}px, 0)`;
  $('i5').innerHTML = chipsHTML([
    exact ? `${b}<sup>${n}</sup> = ${num(y)} — ровно ${n} умножений` : `${b}<sup>${n}</sup> = ${num(b ** n)} < ${num(y)} < ${num(b ** (n + 1))} = ${b}<sup>${n + 1}</sup>`,
    b === 10 ? `в числе ${num(y)} — ${n + 1} цифр: целая часть логарифма + 1` : `чтобы записать ${num(y)} в двоичной системе, нужно ${n + 1} бит`,
    'log(a·b) = log a + log b — умножение превращается в сложение']);
}
document.querySelectorAll('[data-base]').forEach(btn => btn.onclick = () => {
  base5 = +btn.dataset.base;
  document.querySelectorAll('[data-base]').forEach(x => x.classList.toggle('on', x === btn));
  build5();
});

// ---------- 6. Зачем нужны функции ----------
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
let useTab = 'ball', frame6 = null;
const USES = {
  ball: {
    controls: slider('bV', 'Скорость броска вверх, м/с', 5, 30, 15) + `<div class="btns"><button class="primary" id="bGo">Бросить ▶</button></div>`,
    render() {
      const v = +$('bV').value, T = v / 5, H = (v * v) / 20, h = t => v * t - 5 * t * t;
      $('bVv').textContent = v;
      $('useOut').innerHTML = `
        <div class="mid">h = ${v}t − 5t² → наибольшая высота <span style="color:var(--a)">${fmt(H, 1)} м</span></div>
        <svg id="bSvg" class="plot" style="margin-top:10px"></svg>
        <div class="info">${chipsHTML([`вершина: t = ${v} : 10 = ${fmt(v / 10, 1)} с`, `h = ${v}·${fmt(v / 10, 1)} − 5·${fmt(v / 10, 1)}² = ${fmt(H, 1)} м`,
          `упадёт через ${fmt(T, 1)} с`, 'в 2 раза быстрее → в 4 раза выше'])}</div>
        <p class="answer">Высота мяча — <b>квадратичная функция</b> времени: скорость тянет вверх (vt), притяжение — вниз (5t², g ≈ 10 м/с²).
        Ветви параболы смотрят вниз, поэтому в вершине — <b>максимум</b>: самая высокая точка полёта.</p>`;
      const P = plane($('bSvg'), { H: 300, x0: 0, x1: 6.4, y0: 0, y1: 50, sx: 1, sy: 5 });
      const path = el('path', { d: P.curve(t => (t <= T ? h(t) : NaN), 300), fill: 'none', pathLength: 1 }, $('bSvg'));
      style(path, { stroke: 'var(--a)', strokeWidth: 3 }).classList.add('draw');
      style(el('line', { x1: P.X(v / 10), y1: P.Y(H), x2: P.X(v / 10), y2: P.Y(0), 'stroke-dasharray': '5 4' }, $('bSvg')), { stroke: 'var(--gold)', strokeWidth: 2 });
      style(text($('bSvg'), P.X(v / 10), P.Y(H) - 10, `${fmt(H, 1)} м`, { 'font-weight': 700 }, 'var(--gold)'), { animationDelay: '.8s' }).classList.add('fade');
      const ball = el('g', {}, $('bSvg'));
      style(el('circle', { cx: 0, cy: 0, r: 9 }, ball), { fill: 'var(--b)' });
      const clock = text($('bSvg'), 540, 24, '0,0 с', { 'font-size': 20, 'font-weight': 800, 'text-anchor': 'end' });
      const put = t => { ball.setAttribute('transform', `translate(${P.X(t)},${P.Y(Math.max(h(t), 0))})`); clock.textContent = fmt(t, 1).replace('.', ',') + ' с'; };
      put(0);
      $('bGo').onclick = () => {
        cancelAnimationFrame(frame6);
        const start = performance.now();
        const tick = now => { const t = Math.min(T, (now - start) / 1000); put(t); if (t < T) frame6 = requestAnimationFrame(tick); };
        frame6 = requestAnimationFrame(tick);
      };
    },
  },
  germs: {
    controls: slider('gH', 'Прошло часов', 0, 6, 2, 0.5) +
      `<label class="r">Сколько бактерий нужно<select id="gN" style="grid-column:1/-1">
        <option value="1000">1 000</option><option value="1000000" selected>1 000 000</option><option value="1000000000">1 000 000 000</option></select></label>`,
    render() {
      const hrs = +$('gH').value, steps = hrs * 3, N = 2 ** steps, goal = +$('gN').value, need = Math.log2(goal);
      $('gHv').textContent = fmt(hrs, 1);
      const shown = Math.min(N, 512), per = N / shown, cols = 32;
      let dots = '';
      for (let i = 0; i < shown; i++) {
        dots += `<circle class="pop" cx="${(i % cols) * 17 + 9}" cy="${Math.floor(i / cols) * 17 + 9}" r="6" style="fill:var(--c);animation-delay:${Math.min(i * 3, 1200)}ms"/>`;
      }
      $('useOut').innerHTML = `
        <div class="mid">N = 2<sup>3t</sup>: через ${fmt(hrs, 1)} ч — <span style="color:var(--a)">${num(N)}</span></div>
        <svg viewBox="0 0 545 ${Math.ceil(shown / cols) * 17 + 2}" style="margin-top:10px">${dots}</svg>
        <div class="info">${chipsHTML([per > 1 ? `одна точка = ${num(per)} бактерий` : 'одна точка = одна бактерия',
          `удвоение каждые 20 мин → за час ×8`,
          `${num(goal)} бактерий: log₂ ${num(goal)} ≈ ${fmt(need, 1)} удвоений ≈ ${fmt((need * 20) / 60, 1)} ч`])}</div>
        <p class="answer">Число бактерий — <b>экспонента</b>: каждые 20 минут умножается на 2. Вопрос «сколько будет через t» решает экспонента,
        а обратный вопрос «<b>когда</b> станет N» — <b>логарифм</b>: сколько раз надо удвоить.</p>`;
    },
  },
  tea: {
    controls: slider('tT', 'Пить можно при, °C', 30, 80, 60) + slider('tR', 'Температура в комнате, °C', 15, 28, 20),
    render() {
      const goal = +$('tT').value, room = +$('tR').value, T = t => room + (90 - room) * 0.9 ** t;
      $('tTv').textContent = goal; $('tRv').textContent = room;
      const ok = goal > room, t = ok ? Math.log((goal - room) / (90 - room)) / Math.log(0.9) : NaN;
      $('useOut').innerHTML = `
        <div class="mid">T = ${room} + ${90 - room}·0,9<sup>t</sup> → ${ok ? `${goal}° через <span style="color:var(--a)">${fmt(t, 1)} мин</span>` : 'остынет только до комнатной'}</div>
        <svg id="tSvg" class="plot" style="margin-top:10px"></svg>
        <div class="info">${chipsHTML(['каждую минуту разница с комнатой × 0,9', `через 10 мин: ${fmt(T(10), 0)}°C`,
          ok ? `t = log<sub>0,9</sub>(${goal - room} : ${90 - room}) ≈ ${fmt(t, 1)} мин` : `ниже ${room}°C чай не остынет`])}</div>
        <p class="answer">Остывание — <b>убывающая экспонента</b>: каждую минуту исчезает 10% разницы между чаем и комнатой.
        Поэтому сначала чай остывает быстро, потом всё медленнее. Время до нужной температуры находят <b>логарифмом</b>.</p>`;
      const P = plane($('tSvg'), { H: 280, x0: 0, x1: 40, y0: 0, y1: 100, sx: 5, sy: 10 });
      style(el('line', { x1: 0, y1: P.Y(goal), x2: 560, y2: P.Y(goal), 'stroke-dasharray': '6 5' }, $('tSvg')), { stroke: 'var(--gold)', strokeWidth: 2 });
      style(el('line', { x1: 0, y1: P.Y(room), x2: 560, y2: P.Y(room), 'stroke-dasharray': '2 4' }, $('tSvg')), { stroke: 'var(--b)', strokeWidth: 2 });
      style(el('path', { d: P.curve(T), fill: 'none', pathLength: 1 }, $('tSvg')), { stroke: 'var(--a)', strokeWidth: 4 }).classList.add('draw');
      if (ok && t <= 40) {
        style(el('line', { x1: P.X(t), y1: P.Y(goal), x2: P.X(t), y2: 280, 'stroke-dasharray': '5 4' }, $('tSvg')), { stroke: 'var(--gold)', animationDelay: '1s' }).classList.add('fade');
        style(el('circle', { cx: P.X(t), cy: P.Y(goal), r: 8 }, $('tSvg')), { fill: 'var(--gold)', animationDelay: '1s' }).classList.add('pop');
      }
    },
  },
  search: {
    controls: `<label class="r">Загадано число от 1 до<select id="sN" style="grid-column:1/-1">
        <option value="100">100</option><option value="1000" selected>1 000</option><option value="1000000">1 000 000</option></select></label>` +
      slider('sX', 'Загаданное число', 1, 1000, 737),
    render() {
      const N = +$('sN').value, sx = $('sX');
      sx.max = N; if (+sx.value > N) sx.value = N;
      const secret = +sx.value, need = Math.ceil(Math.log2(N));
      $('sXv').textContent = num(secret);
      const rows = [];
      let lo = 1, hi = N;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2), yes = secret <= mid;
        rows.push({ lo, hi, mid, yes });
        if (yes) hi = mid; else lo = mid + 1;
      }
      const X = v => 10 + ((v - 1) / N) * 330;
      let bars = '';
      rows.forEach((r, i) => {
        const y = i * 24, d = i * 160;
        bars += `<rect x="10" y="${y}" width="330" height="16" rx="3" style="fill:var(--empty)"/>
          <rect class="pop" x="${X(r.lo)}" y="${y}" width="${Math.max(X(r.hi + 1) - X(r.lo), 2)}" height="16" rx="3" style="fill:var(--b);animation-delay:${d}ms"/>
          <text class="fade" x="350" y="${y + 13}" font-size="12" style="fill:var(--ink);animation-delay:${d}ms">${i + 1}) ≤ ${num(r.mid)}? <tspan font-weight="700" style="fill:${r.yes ? 'var(--c)' : 'var(--a)'}">${r.yes ? 'да' : 'нет'}</tspan></text>`;
      });
      bars += `<text class="pop" x="${X(lo)}" y="${rows.length * 24 + 16}" font-size="14" font-weight="800" style="fill:var(--a);animation-delay:${rows.length * 160}ms">↑ ${num(lo)}</text>`;
      $('useOut').innerHTML = `
        <div class="mid">log₂ ${num(N)} ≈ ${fmt(Math.log2(N), 1)} → <span style="color:var(--a)">${need} вопросов</span> хватит всегда</div>
        <svg viewBox="0 0 560 ${rows.length * 24 + 24}" style="margin-top:10px">${bars}</svg>
        <div class="info">${chipsHTML([`угадано за ${rows.length} вопросов`, 'каждый ответ отбрасывает половину',
          'перебором подряд — до ' + num(N) + ' вопросов', '8 миллиардов людей — 33 вопроса'])}</div>
        <p class="answer">Каждый вопрос «больше или меньше?» делит отрезок пополам. После k вопросов остаётся N : 2<sup>k</sup> чисел.
        Нужно, чтобы осталось одно: 2<sup>k</sup> ≥ N, то есть <b>k = log₂ N</b>. Так ищут записи в базах данных и слова в словаре.</p>`;
    },
  },
};
function buildUse() {
  cancelAnimationFrame(frame6);
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
    const k = nz(-4, 5), b = rnd(-9, 9), x = rnd(-5, 6);
    q = { text: `y = ${lin(k, b)}. y при ${X_} = ${sgn(x)}?`, ans: k * x + b, hint: `Подставьте: ${k}·${par(x)}${b ? (b > 0 ? ' + ' : ' − ') + Math.abs(b) : ''}.` };
  } else if (type === 1) {
    const k = nz(-4, 4), b = rnd(-5, 5), xa = rnd(-3, 2), xb = xa + rnd(1, 4);
    q = { text: `Прямая проходит через (${sgn(xa)}; ${sgn(k * xa + b)}) и (${sgn(xb)}; ${sgn(k * xb + b)}). k = ?`, ans: k,
          hint: `k = (y₂ − y₁) : (x₂ − x₁) = ${sgn(k * (xb - xa))} : ${xb - xa}.` };
  } else if (type === 2) {
    const b = rnd(-5, 5) * 2, c = rnd(-9, 9);
    q = { text: `y = ${poly([[1, X2_], [b, X_], [c, '']])}. x вершины = ?`, ans: -b / 2, hint: `x вершины = −b : 2a = ${sgn(-b)} : 2.` };
  } else if (type === 3) {
    const a = rnd(1, 3), c = rnd(-9, 9), x = rnd(-4, 4);
    q = { text: `y = ${poly([[a, X2_], [c, '']])}. y при ${X_} = ${sgn(x)}?`, ans: a * x * x + c, hint: `${par(x)}² = ${x * x}, затем ·${a}${c ? (c > 0 ? ' + ' : ' − ') + Math.abs(c) : ''}.` };
  } else if (type === 4) {
    const [b, n] = pick([[2, rnd(1, 10)], [3, rnd(1, 5)], [10, rnd(1, 6)], [5, rnd(1, 4)]]);
    q = Math.random() < .5
      ? { text: `log<sub>${b}</sub> ${num(b ** n)} = ?`, ans: n, hint: `Сколько раз умножить ${b} само на себя, чтобы получить ${num(b ** n)}?` }
      : { text: `${b}<sup>${n}</sup> = ?`, ans: b ** n, hint: `${b} умножить само на себя ${n} раз.` };
  } else if (type === 5) {
    const p = pick([10, 20, 30]), n = rnd(2, 10);
    q = { text: story(`🦠 Колония удваивается каждые ${p} мин. Через сколько минут из 1 бактерии станет ${num(2 ** n)}?`), ans: n * p,
          hint: `${num(2 ** n)} = 2<sup>${n}</sup>, значит, нужно ${n} удвоений по ${p} мин.` };
  } else {
    const N = pick([16, 100, 1000, 1000000, 1000000000]);
    q = { text: story(`🔍 Загадано число от 1 до ${num(N)}. Сколько вопросов «больше или меньше?» нужно, чтобы наверняка угадать?`), ans: Math.ceil(Math.log2(N)),
          hint: `Нужно наименьшее k, при котором 2<sup>k</sup> ≥ ${num(N)}.` };
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

build1(); [-2, -1, 0, 1, 2].forEach(x => { $('x1').value = x; feed1(); });
render2(); render3(); render4(); build5(); buildUse(); newQuiz();
$('qScore').textContent = 'Счёт: 0 из 0';
