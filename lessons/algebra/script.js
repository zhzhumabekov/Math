const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const fmt = (x, d = 3) => (+x.toFixed(d)).toLocaleString('ru-RU', { maximumFractionDigits: d });
const money = x => Math.round(x).toLocaleString('ru-RU') + ' ₽';
const chipsHTML = list => list.map(c => `<span class="chip fade">${c}</span>`).join('');
const X_ = '<i class="v">x</i>';
const sgn = n => (n < 0 ? '−' + num(-n) : num(n));
// a·x + b в привычной записи: 1x → x, −1x → −x, «+ −3» → «− 3»
function lin(a, b, v = X_) {
  let s = a === 0 ? '' : a === 1 ? v : a === -1 ? '−' + v : sgn(a) + v;
  if (b) s += s ? (b > 0 ? ' + ' : ' − ') + num(Math.abs(b)) : sgn(b);
  return s || '0';
}
const par = n => (n < 0 ? `(${sgn(n)})` : num(n));

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

// ---------- 1. Переменная и выражение ----------
const a1 = bindRange('a1', render1), b1 = bindRange('b1', render1), x1 = bindRange('x1', render1);
function render1() {
  const a = a1(), b = b1(), x = x1(), y = a * x + b;
  $('a1v').textContent = a; $('b1v').textContent = b; $('x1v').textContent = x;
  $('e1Label').innerHTML = lin(a, b);
  $('e1Machine').innerHTML = `
    <span class="tok pop" style="background:var(--b)">x = ${x}</span>
    <span class="arr pop" style="animation-delay:.2s">→ × ${a} →</span>
    <span class="tok pop" style="background:var(--gold);animation-delay:.4s">${a * x}</span>
    <span class="arr pop" style="animation-delay:.6s">→ + ${b} →</span>
    <span class="tok pop" style="background:var(--a);animation-delay:.8s">${y}</span>`;
  const u = 8.5, svg = $('e1Svg'); svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 560 90');
  let pos = 10, k = 0;
  for (let i = 0; i < a; i++) {
    const w = Math.max(x * u, 3);
    style(el('rect', { x: pos, y: 20, width: w - 2, height: 34, rx: 5 }, svg), { fill: 'var(--b)', animationDelay: k++ * 120 + 'ms' }).classList.add('pop');
    style(text(svg, pos + w / 2, 42, 'x', { 'font-weight': 700, 'font-style': 'italic', 'font-size': 15 }, '#fff'), { animationDelay: (k - 1) * 120 + 'ms' }).classList.add('pop');
    pos += w;
  }
  for (let i = 0; i < b; i++) {
    style(el('rect', { x: pos + 1, y: 20 + 34 - u * 2, width: u - 1, height: u * 2, rx: 2 }, svg), { fill: 'var(--gold)', animationDelay: (k + i) * 60 + 'ms' }).classList.add('pop');
    pos += u;
  }
  style(el('path', { d: `M10,64 v6 H${pos} v-6`, fill: 'none' }, svg), { stroke: 'var(--muted)' });
  text(svg, (10 + pos) / 2, 86, `всего ${y}`, { 'font-weight': 700 }, 'var(--a)');
  $('e1Info').innerHTML = chipsHTML([
    `${lin(a, b)} = ${a}·${x} + ${b} = ${y}`,
    `при x = ${x + 1}: ${a * (x + 1) + b} (на ${a} больше)`,
    'буква — это место для числа']);
}

// ---------- 2. Раскрытие скобок ----------
let open2 = false;
const a2 = bindRange('a2', render2), x2 = bindRange('x2', render2), b2 = bindRange('b2', render2);
$('open2').onclick = () => { open2 = !open2; update2(); };
function render2() {
  const a = a2(), x = x2(), b = b2(), u = 24;
  $('a2v').textContent = a; $('x2v').textContent = x; $('b2v').textContent = b;
  const svg = $('e2Svg'); svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 470 210');
  const part = (gx, w, color, id, label) => {
    const g = el('g', { id }, svg); g.classList.add('move');
    style(el('rect', { x: gx, y: 30, width: w * u, height: a * u }, g), { fill: color, stroke: 'var(--card)', strokeWidth: 2 });
    for (let i = 1; i < w; i++) style(el('line', { x1: gx + i * u, y1: 30, x2: gx + i * u, y2: 30 + a * u }, g), { stroke: 'var(--card)', strokeOpacity: .5 });
    for (let j = 1; j < a; j++) style(el('line', { x1: gx, y1: 30 + j * u, x2: gx + w * u, y2: 30 + j * u }, g), { stroke: 'var(--card)', strokeOpacity: .5 });
    text(g, gx + w * u / 2, 22, label[0], { 'font-weight': 700 });
    text(g, gx + w * u / 2, 30 + a * u / 2 + 5, label[1], { 'font-weight': 700, 'font-size': 14 }, '#fff');
    return g;
  };
  part(30, x, 'var(--b)', 'blue2', [`x (= ${x})`, `${a}x`]);
  part(30 + x * u, b, 'var(--gold)', 'gold2', [`${b}`, `${a * b}`]);
  text(svg, 18, 30 + a * u / 2 + 5, a, { 'font-weight': 700 });
  update2();
}
function update2() {
  const a = a2(), x = x2(), b = b2();
  $('gold2').style.transform = open2 ? 'translate(36px, 0)' : 'none';
  $('open2').textContent = open2 ? '↺ Собрать обратно' : 'Раскрыть скобки ▶';
  $('e2Label').innerHTML = open2 ? `${a}(${X_} + ${b}) = <span style="color:var(--b)">${a}${X_}</span> + <span style="color:var(--gold)">${a * b}</span>`
    : `${a}(${X_} + ${b}) = ?`;
  $('e2Info').innerHTML = chipsHTML(open2
    ? [`синяя часть: ${a}·x`, `жёлтая: ${a}·${b} = ${a * b}`, `проверка при x = ${x}: ${a}·${x + b} = ${a * (x + b)} и ${a * x} + ${a * b} = ${a * x + a * b}`]
    : [`высота ${a}, ширина x + ${b}`, `площадь = ${a}·(x + ${b})`]);
}

// ---------- 3. Уравнение — весы ----------
let step3 = 0;
const reset3 = () => { step3 = 0; render3(); };
const a3 = bindRange('a3', reset3), b3 = bindRange('b3', reset3), x3 = bindRange('x3', reset3), g3 = bindRange('g3', tilt3);
$('st3a').onclick = () => { step3 = 1; render3(); };
$('st3b').onclick = () => { step3 = 2; render3(); };
$('st3r').onclick = reset3;
(function build3() {
  const svg = $('e3Svg');
  svg.setAttribute('viewBox', '0 0 560 300');
  style(el('path', { d: 'M280,100 L250,292 H310 Z' }, svg), { fill: 'var(--line)' });
  const beam = el('g', { id: 'beam3' }, svg);
  style(beam, { transformBox: 'view-box', transformOrigin: '280px 100px' }).classList.add('move');
  style(el('line', { x1: 150, y1: 100, x2: 410, y2: 100 }, beam), { stroke: 'var(--ink)', strokeWidth: 6, strokeLinecap: 'round' });
  [150, 410].forEach(cx => {
    style(el('path', { d: `M${cx},100 L${cx - 85},250 M${cx},100 L${cx + 85},250`, fill: 'none' }, beam), { stroke: 'var(--muted)' });
    style(el('line', { x1: cx - 95, y1: 250, x2: cx + 95, y2: 250 }, beam), { stroke: 'var(--ink)', strokeWidth: 5, strokeLinecap: 'round' });
  });
  el('g', { id: 'L3' }, beam); el('g', { id: 'R3' }, beam);
  style(el('circle', { cx: 280, cy: 100, r: 7 }, svg), { fill: 'var(--a)' });
})();
// раскладка предметов на чаше: по 6 в ряд снизу вверх
function place(g, cx, items) {
  g.innerHTML = '';
  items.forEach((it, i) => {
    const x = cx - 78 + (i % 6) * 26, y = 250 - 26 * (Math.floor(i / 6) + 1);
    const node = it.kind === 'x' ? el('g', {}, g) : el('circle', { cx: x + 13, cy: y + 13, r: 10 }, g);
    if (it.kind === 'x') {
      style(el('rect', { x: x + 1, y: y + 1, width: 24, height: 24, rx: 4 }, node), { fill: 'var(--b)' });
      text(node, x + 13, y + 19, 'x', { 'font-style': 'italic', 'font-weight': 700, 'font-size': 15 }, '#fff');
    } else style(node, { fill: 'var(--gold)' });
    if (it.gone) style(node, { animationDelay: i * 30 + 'ms' }).classList.add('out');
    else if (it.fresh) style(node, { animationDelay: Math.min(i * 40, 1200) + 'ms' }).classList.add('pop');
  });
}
const many = (n, kind, flags = {}) => Array.from({ length: Math.max(n, 0) }, () => ({ kind, ...flags }));
let state3 = {};
function render3() {
  const a = a3(), b = b3(), x = x3(), c = a * x + b, fresh = step3 === 0;
  $('a3v').textContent = a; $('b3v').textContent = b; $('x3v').textContent = x;
  let L, R, lines;
  const eq0 = `${lin(a, b)} = ${c}`;
  if (step3 === 0) {
    L = [...many(a, 'x', { fresh }), ...many(b, 'u', { fresh })]; R = many(c, 'u', { fresh });
    lines = [eq0];
  } else if (step3 === 1) {
    L = [...many(a, 'x'), ...many(b, 'u', { gone: true })]; R = [...many(c - b, 'u'), ...many(b, 'u', { gone: true })];
    lines = [eq0, `${lin(a, 0)} = ${c} − ${b} = ${c - b}<span class="note">убрали по ${b} гирек с каждой чаши</span>`];
  } else {
    L = [...many(1, 'x'), ...many(a - 1, 'x', { gone: true })]; R = [...many(x, 'u'), ...many(c - b - x, 'u', { gone: true })];
    lines = [eq0, `${lin(a, 0)} = ${c - b}`, `${X_} = ${c - b} : ${a} = <span style="color:var(--a)">${x}</span><span class="note">оставили ${a === 1 ? 'всё как есть' : `1/${a} каждой чаши`}</span>`];
  }
  place($('L3'), 150, L); place($('R3'), 410, R);
  state3 = { boxes: L.filter(i => i.kind === 'x' && !i.gone).length, left: L.filter(i => i.kind === 'u' && !i.gone).length,
             right: R.filter(i => !i.gone).length, x };
  $('e3Steps').innerHTML = lines.map((l, i) => `<div class="${i === lines.length - 1 ? 'fade' : ''}">${l}</div>`).join('');
  $('st3a').disabled = step3 !== 0; $('st3b').disabled = step3 !== 1;
  tilt3();
}
function tilt3() {
  const g = g3(), { boxes, left, right, x } = state3, L = boxes * g + left, diff = L - right;
  $('g3v').textContent = g;
  $('beam3').style.transform = `rotate(${-Math.max(-12, Math.min(12, diff * 2))}deg)`;
  $('e3Info').innerHTML = chipsHTML([
    `если x = ${g}: слева ${boxes > 1 ? boxes + '·' : ''}${g}${left ? ' + ' + left : ''} = ${L}, справа ${right}`,
    diff === 0 ? '⚖️ равновесие — x найден!' : diff > 0 ? 'левая чаша тяжелее → x меньше' : 'правая чаша тяжелее → x больше']);
}

// ---------- 4. x с обеих сторон ----------
const r4 = ['a4', 'b4', 'c4', 'd4'].map(id => bindRange(id, render4));
const X4 = v => 280 + v * 25, Y4 = v => 150 - v * 6.5;
(function build4() {
  const svg = $('e4Svg');
  svg.setAttribute('viewBox', '0 0 560 300');
  for (let v = -10; v <= 10; v += 2) {
    style(el('line', { x1: X4(v), y1: 0, x2: X4(v), y2: 300 }, svg), { stroke: 'var(--line)', strokeWidth: v ? 1 : 2 });
    if (v) text(svg, X4(v), 166, v, { 'font-size': 11 }, 'var(--muted)');
  }
  for (let v = -20; v <= 20; v += 5) {
    style(el('line', { x1: 0, y1: Y4(v), x2: 560, y2: Y4(v) }, svg), { stroke: 'var(--line)', strokeWidth: v ? 1 : 2 });
    if (v) text(svg, X4(0) - 6, Y4(v) + 4, v, { 'font-size': 11, 'text-anchor': 'end' }, 'var(--muted)');
  }
  [['L4', 'var(--b)'], ['R4', 'var(--gold)']].forEach(([id, color]) =>
    style(el('line', { id, x1: 0, y1: 0, x2: 0, y2: 0 }, svg), { stroke: color, strokeWidth: 4, strokeLinecap: 'round' }));
  const g = el('g', { id: 'pt4' }, svg); g.classList.add('move');
  style(el('line', { x1: 0, y1: 0, x2: 0, y2: 0, id: 'pt4v', 'stroke-dasharray': '5 4' }, g), { stroke: 'var(--a)', strokeWidth: 2 });
  style(el('circle', { cx: 0, cy: 0, r: 8 }, g), { fill: 'var(--a)' });
})();
function render4() {
  const [a, b, c, d] = r4.map(f => f());
  ['a4', 'b4', 'c4', 'd4'].forEach((id, i) => $(id + 'v').textContent = sgn([a, b, c, d][i]));
  $('e4Label').innerHTML = `<span style="color:var(--b)">${lin(a, b)}</span> = <span style="color:var(--gold)">${lin(c, d)}</span>`;
  const setLine = (id, k, m) => { const l = $(id); l.setAttribute('x1', X4(-12)); l.setAttribute('y1', Y4(-12 * k + m)); l.setAttribute('x2', X4(12)); l.setAttribute('y2', Y4(12 * k + m)); };
  setLine('L4', a, b); setLine('R4', c, d);
  const steps = [`${lin(a, 0)} ${c < 0 ? '+' : '−'} ${lin(Math.abs(c), 0)} = ${sgn(d)} ${b < 0 ? '+' : '−'} ${num(Math.abs(b))}<span class="note">иксы — влево, числа — вправо</span>`,
                 `${lin(a - c, 0)} = ${sgn(d - b)}`];
  const pt = $('pt4');
  if (a === c) {
    pt.style.opacity = 0;
    steps.push(d === b ? `<span style="color:var(--c)">0 = 0 — подходит любое x</span><span class="note">прямые совпали</span>`
                       : `<span style="color:var(--a)">0 = ${sgn(d - b)} — решений нет</span><span class="note">прямые параллельны</span>`);
  } else {
    const x = (d - b) / (a - c), y = a * x + b, whole = Number.isInteger(x);
    pt.style.opacity = Math.abs(x) <= 11 && Math.abs(y) <= 23 ? 1 : 0;
    pt.style.transform = `translate(${X4(x)}px, ${Y4(y)}px)`;
    const v = $('pt4v'); v.setAttribute('y2', Y4(0) - Y4(y));
    steps.push(`${X_} = ${sgn(d - b)} : ${par(a - c)} ${whole ? '=' : '≈'} <span style="color:var(--a)">${whole ? sgn(x) : fmt(x, 2)}</span>`);
    steps.push(`<span class="note" style="margin:0">проверка: слева ${fmt(y, 2)}, справа ${fmt(c * x + d, 2)}</span>`);
  }
  $('e4Steps').innerHTML = steps.map(s => `<div class="fade">${s}</div>`).join('');
}

// ---------- 5. Формулы ----------
const FORMULAS = {
  path: { title: '🚗 Путь: S = v · t', top: ['S', 'путь, км'], f: [['v', 'скорость, км/ч', 10, 120, 60, 10], ['t', 'время, ч', 1, 10, 3, 1]] },
  cost: { title: '🛒 Покупка: C = p · n', top: ['C', 'стоимость, ₽'], f: [['p', 'цена штуки, ₽', 10, 500, 80, 10], ['n', 'штук', 1, 20, 6, 1]] },
  area: { title: '🟩 Площадь: S = a · b', top: ['S', 'площадь, м²'], f: [['a', 'длина, м', 1, 20, 8, 1], ['b', 'ширина, м', 1, 20, 5, 1]] },
};
let f5 = 'path', unk5 = 0; // 0 — верх треугольника, 1 и 2 — множители
$('f5').innerHTML = Object.entries(FORMULAS).map(([k, f]) => `<option value="${k}">${f.title}</option>`).join('');
$('f5').addEventListener('input', () => { f5 = $('f5').value; unk5 = 0; build5(); });
const REG5 = ['150,10 80,130 220,130', '80,130 150,130 150,250 10,250', '150,130 220,130 290,250 150,250'];
const POS5 = [[150, 100], [92, 205], [208, 205]];
function build5() {
  const F = FORMULAS[f5];
  $('f5Sliders').innerHTML = F.f.map(([n, label, min, max, val, step]) =>
    `<label class="r">${n} — ${label} <b id="f5${n}v"></b><input type="range" id="f5${n}" min="${min}" max="${max}" step="${step}" value="${val}"></label>`).join('');
  $('f5Sliders').querySelectorAll('input').forEach(i => i.addEventListener('input', () => render5()));
  $('f5Btns').innerHTML = [F.top[0], F.f[0][0], F.f[1][0]].map((n, i) => `<button data-u5="${i}">найти ${n}</button>`).join('');
  $('f5Btns').querySelectorAll('[data-u5]').forEach(b => b.onclick = () => { unk5 = +b.dataset.u5; render5(); });
  const svg = $('e5Svg'); svg.innerHTML = '';
  REG5.forEach((pts, i) => {
    const p = el('polygon', { id: 'r5_' + i, points: pts }, svg);
    style(p, { fill: 'var(--bg)', stroke: 'var(--ink)', strokeWidth: 3, strokeLinejoin: 'round', cursor: 'pointer' });
    p.onclick = () => { unk5 = i; render5(); };
    text(svg, POS5[i][0], POS5[i][1], '', { id: 't5_' + i, 'font-size': 30, 'font-weight': 800, 'font-style': 'italic', 'pointer-events': 'none' });
  });
  render5();
}
function render5() {
  const F = FORMULAS[f5], [[n1], [n2]] = F.f, v1 = +$('f5' + n1).value, v2 = +$('f5' + n2).value, top = v1 * v2;
  $('f5' + n1 + 'v').textContent = num(v1); $('f5' + n2 + 'v').textContent = num(v2);
  const names = [F.top[0], n1, n2], vals = [top, v1, v2];
  names.forEach((n, i) => {
    const r = $('r5_' + i);
    style(r, { fill: i === unk5 ? 'var(--a)' : 'var(--bg)', fillOpacity: i === unk5 ? .25 : 1 });
    $('t5_' + i).textContent = i === unk5 ? n + ' = ?' : n;
  });
  restart($('r5_' + unk5), 'pop');
  document.querySelectorAll('[data-u5]').forEach(b => b.classList.toggle('on', +b.dataset.u5 === unk5));
  const V = s => `<i class="v">${s}</i>`, A = s => `<span style="color:var(--a)">${s}</span>`;
  let f;
  if (unk5 === 0) f = `${V(names[0])} = ${V(n1)} · ${V(n2)} = ${num(v1)} · ${num(v2)} = ${A(num(top))}`;
  else {
    const other = unk5 === 1 ? 2 : 1;
    f = `${V(names[unk5])} = ${V(names[0])} : ${V(names[other])} = ${num(top)} : ${num(vals[other])} = ${A(num(vals[unk5]))}`;
  }
  $('e5Formula').innerHTML = `<span class="fade" style="display:inline-block">${f}</span>`;
  $('e5Info').innerHTML = chipsHTML([`${F.top[0]} — ${F.top[1]}`, `${n1} — ${F.f[0][1]}`, `${n2} — ${F.f[1][1]}`,
    unk5 ? 'неизвестный множитель = произведение : другой множитель' : 'закройте пальцем букву — остальное и есть формула']);
}

// ---------- 6. Зачем нужна алгебра ----------
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
// график прямых y = k·x + b; точка пересечения первых двух, если она в пределах графика
function plot({ lines, xMax, xName, yName, points = [], mark = null, yFmt = v => num(Math.round(v)) }) {
  const W = 540, H = 260, L = 60, B = 222, R = 520, T = 14;
  const vals = lines.flatMap(l => [l.b, l.b + l.k * xMax]).concat(points.map(p => p[1]));
  const yMax = Math.max(...vals) * 1.1 || 1;
  const X = v => L + (v / xMax) * (R - L), Y = v => B - (v / yMax) * (B - T);
  let s = `<svg viewBox="0 0 ${W} ${H}" style="margin-top:10px"><path d="M${L},${T} V${B} H${R}" fill="none" style="stroke:var(--muted)"/>`;
  for (let i = 0; i <= 5; i++) {
    s += `<text x="${X(xMax * i / 5)}" y="${B + 16}" text-anchor="middle" font-size="11" style="fill:var(--muted)">${num(Math.round(xMax * i / 5))}</text>`;
    s += `<text x="${L - 6}" y="${Y(yMax * i / 5) + 4}" text-anchor="end" font-size="11" style="fill:var(--muted)">${yFmt(yMax * i / 5)}</text>`;
  }
  s += `<text x="${R}" y="${B + 32}" text-anchor="end" font-size="12" style="fill:var(--muted)">${xName}</text>
        <text x="${L}" y="${T - 2}" font-size="12" style="fill:var(--muted)">${yName}</text>`;
  points.forEach(([px, py], i) => { s += `<circle class="pop" cx="${X(px)}" cy="${Y(py)}" r="4" style="fill:var(--muted);animation-delay:${i * 40}ms"/>`; });
  if (mark !== null) s += `<line x1="${X(mark)}" y1="${T}" x2="${X(mark)}" y2="${B}" style="stroke:var(--muted);stroke-dasharray:3 4"/>`;
  lines.forEach((l, i) => {
    s += `<line class="draw" pathLength="1" x1="${X(0)}" y1="${Y(l.b)}" x2="${X(xMax)}" y2="${Y(l.b + l.k * xMax)}" style="stroke:${l.color};stroke-width:4;stroke-linecap:round;animation-delay:${i * 300}ms"/>
          <text class="fade" x="${X(xMax) - 4}" y="${Y(l.b + l.k * xMax) - 8}" text-anchor="end" font-size="13" font-weight="700" style="fill:${l.color};animation-delay:${i * 300 + 600}ms">${l.label}</text>`;
  });
  let xc = null;
  if (lines.length > 1 && lines[0].k !== lines[1].k) {
    xc = (lines[1].b - lines[0].b) / (lines[0].k - lines[1].k);
    if (xc >= 0 && xc <= xMax) {
      const yc = lines[0].b + lines[0].k * xc;
      s += `<line class="fade" x1="${X(xc)}" y1="${Y(yc)}" x2="${X(xc)}" y2="${B}" style="stroke:var(--a);stroke-width:2;stroke-dasharray:5 4;animation-delay:1s"/>
            <circle class="pop" cx="${X(xc)}" cy="${Y(yc)}" r="8" style="fill:var(--a);animation-delay:1s"/>`;
    }
  }
  return { svg: s + '</svg>', xc };
}
let useTab = 'tariff';
const USES = {
  tariff: {
    controls: slider('tA1', 'Тариф А: абонплата, ₽', 0, 1000, 200, 50) + slider('tK1', 'Тариф А: ₽ за минуту', 1, 10, 6) +
              slider('tA2', 'Тариф Б: абонплата, ₽', 0, 1000, 600, 50) + slider('tK2', 'Тариф Б: ₽ за минуту', 1, 10, 2) +
              slider('tM', 'Вы говорите минут в месяц', 0, 300, 150, 10),
    render() {
      const [A1, K1, A2, K2, M] = ['tA1', 'tK1', 'tA2', 'tK2', 'tM'].map(id => +$(id).value);
      ['tA1', 'tK1', 'tA2', 'tK2', 'tM'].forEach(id => $(id + 'v').textContent = num(+$(id).value));
      const { svg, xc } = plot({ lines: [{ k: K1, b: A1, color: 'var(--b)', label: 'А' }, { k: K2, b: A2, color: 'var(--gold)', label: 'Б' }],
        xMax: 300, xName: 'минут', yName: '₽ в месяц', mark: M });
      const cA = A1 + K1 * M, cB = A2 + K2 * M;
      const eq = K1 === K2 ? (A1 === A2 ? 'тарифы одинаковые' : 'цена за минуту одна — дешевле всегда тот, у кого меньше абонплата')
        : `${A1} + ${K1}x = ${A2} + ${K2}x → x = ${A2 - A1} : ${K1 - K2} ${Number.isInteger(xc) ? '=' : '≈'} ${fmt(xc, 1)} мин`;
      $('useOut').innerHTML = `
        <div class="mid">${K1 === K2 ? 'прямые параллельны' : `равны при x ${Number.isInteger(xc) ? '=' : '≈'} <span style="color:var(--a)">${fmt(xc, 1)} мин</span>`}</div>
        ${svg}
        <div class="info">${chipsHTML([eq, `при ${M} мин: А — ${money(cA)}, Б — ${money(cB)}`,
          cA === cB ? 'сейчас одинаково' : `выгоднее ${cA < cB ? 'А' : 'Б'} на ${money(Math.abs(cA - cB))}`])}</div>
        <p class="answer">Стоимость тарифа — выражение <b>абонплата + цена · минуты</b>. Приравниваем два выражения и находим x,
        при котором они равны. Левее точки пересечения выгоднее один тариф, правее — другой.</p>`;
    },
  },
  taxi: {
    controls: slider('xP', 'Посадка, ₽', 0, 300, 100, 50) + slider('xK', 'Цена за км, ₽', 10, 60, 25, 5) +
              slider('xB', 'В кошельке, ₽', 200, 3000, 600, 100),
    render() {
      const P = +$('xP').value, K = +$('xK').value, Bu = +$('xB').value, x = (Bu - P) / K, km = Math.floor(Math.max(x, 0));
      $('xPv').textContent = num(P); $('xKv').textContent = num(K); $('xBv').textContent = num(Bu);
      const maxKm = Math.max(10, Math.ceil(x * 1.25 / 10) * 10), X = v => 20 + (v / maxKm) * 500;
      let ticks = '';
      for (let v = 0; v <= maxKm; v += maxKm / 10) ticks += `<line x1="${X(v)}" y1="70" x2="${X(v)}" y2="78" style="stroke:var(--muted)"/><text x="${X(v)}" y="94" text-anchor="middle" font-size="11" style="fill:var(--muted)">${v}</text>`;
      $('useOut').innerHTML = `
        <div class="mid">${P} + ${K}x = ${Bu} → x = ${Bu - P} : ${K} ${Number.isInteger(x) ? '=' : '≈'} <span style="color:var(--a)">${fmt(Math.max(x, 0), 1)} км</span></div>
        <svg viewBox="0 0 540 110" style="margin-top:10px">
          <rect x="20" y="40" width="500" height="30" rx="6" style="fill:var(--empty)"/>
          ${x > 0 ? `<rect class="growx" x="20" y="40" width="${X(x) - 20}" height="30" rx="6" style="fill:var(--c)"/>` : ''}
          ${ticks}
          <text class="pop" x="${X(Math.max(x, 0))}" y="32" text-anchor="middle" font-size="26" style="animation-delay:.7s">🚕</text>
          <text x="520" y="108" text-anchor="end" font-size="12" style="fill:var(--muted)">км</text>
        </svg>
        <div class="info">${chipsHTML([x < 0 ? 'не хватит даже на посадку' : `хватит на ${km} полных км`,
          `проверка: ${P} + ${K}·${km} = ${money(P + K * km)}`, `${km + 1} км стоили бы ${money(P + K * (km + 1))}`])}</div>
        <p class="answer">Неизвестное — расстояние. Условие «потратить не больше ${num(Bu)} ₽» записываем равенством
        <b>${P} + ${K}·x = ${Bu}</b>: убираем посадку с обеих сторон, делим на цену километра.</p>`;
    },
  },
  cafe: {
    controls: slider('cF', 'Аренда и зарплаты в месяц, ₽', 20000, 300000, 120000, 10000) +
              slider('cP', 'Цена чашки кофе, ₽', 100, 400, 220, 10) + slider('cC', 'Себестоимость чашки, ₽', 20, 300, 70, 10),
    render() {
      const F = +$('cF').value, P = +$('cP').value, C = +$('cC').value;
      ['cF', 'cP', 'cC'].forEach(id => $(id + 'v').textContent = num(+$(id).value));
      if (P <= C) {
        $('useOut').innerHTML = `<div class="mid" style="color:var(--a)">цена ≤ себестоимости — каждая чашка в минус</div>
          <p class="answer">Уравнение ${P}x = ${F} + ${C}x не имеет решения с положительным x: прибыль на чашке ${P - C} ₽.</p>`;
        return;
      }
      const x = F / (P - C), xMax = Math.max(100, Math.ceil(x * 1.6 / 100) * 100);
      const { svg } = plot({ lines: [{ k: C, b: F, color: 'var(--a)', label: 'расходы' }, { k: P, b: 0, color: 'var(--c)', label: 'выручка' }],
        xMax, xName: 'чашек в месяц', yName: '₽' });
      $('useOut').innerHTML = `
        <div class="mid">${num(P)}x = ${num(F)} + ${C}x → x = ${num(F)} : ${P - C} ≈ <span style="color:var(--a)">${num(Math.ceil(x))} чашек</span></div>
        ${svg}
        <div class="info">${chipsHTML([`с каждой чашки остаётся ${P} − ${C} = ${P - C} ₽`, `в день ≈ ${num(Math.ceil(x / 30))} чашек`,
          `+20 ₽ к цене → ${num(Math.ceil(F / (P + 20 - C)))} чашек`])}</div>
        <p class="answer">Выручка = <b>цена · x</b>, расходы = <b>постоянные + себестоимость · x</b>. Пока выручка ниже — убыток,
        после пересечения — прибыль. Точку пересечения называют точкой безубыточности.</p>`;
    },
  },
  model: {
    controls: slider('mW', 'w — млн ₽ за 1 м²', 0.1, 0.5, 0.25, 0.01) + slider('mB', 'b — базовая цена, млн ₽', 0, 5, 1, 0.5) +
              slider('mT', 'Бюджет покупателя, млн ₽', 5, 30, 15, 0.5),
    render() {
      const w = +$('mW').value, b = +$('mB').value, T = +$('mT').value, S = (T - b) / w;
      $('mWv').textContent = fmt(w, 2); $('mBv').textContent = fmt(b, 1); $('mTv').textContent = fmt(T, 1);
      const noise = [0.6, -1.1, 0.3, 1.4, -0.5, -0.9, 0.8, -0.2, 1.1, -1.3, 0.4, -0.6];
      const points = noise.map((n, i) => [25 + i * 10, 0.25 * (25 + i * 10) + 1 + n * 2]);
      const { svg } = plot({ lines: [{ k: w, b, color: 'var(--b)', label: 'модель' }, { k: 0, b: T, color: 'var(--gold)', label: 'бюджет' }],
        xMax: 150, xName: 'площадь, м²', yName: 'цена, млн ₽', points, yFmt: v => fmt(v, 1) });
      $('useOut').innerHTML = `
        <div class="mid">${fmt(w, 2)}·x + ${fmt(b, 1)} = ${fmt(T, 1)} → x ≈ <span style="color:var(--a)">${fmt(Math.max(S, 0), 1)} м²</span></div>
        ${svg}
        <div class="info">${chipsHTML([`модель: цена = ${fmt(w, 2)} · площадь + ${fmt(b, 1)}`, `квартира 50 м² → ${fmt(w * 50 + b, 1)} млн`,
          'серые точки — реальные квартиры'])}</div>
        <p class="answer">Модель машинного обучения часто — просто формула <b>y = w·x + b</b>. Прямой ход — подставить площадь и получить цену.
        Обратный — решить уравнение: какую площадь можно купить на ${fmt(T, 1)} млн. Подберите w и b так, чтобы прямая шла через серые точки, — это и есть «обучение модели».</p>`;
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
function newQuiz() {
  const type = rnd(0, 6);
  if (type === 0) {
    const a = rnd(2, 9), b = rnd(-9, 9), x = rnd(-5, 6);
    q = { text: `${lin(a, b)} при ${X_} = ${x}`, ans: a * x + b, hint: `Подставьте: ${a}·${par(x)}${b ? (b > 0 ? ' + ' : ' − ') + Math.abs(b) : ''}.` };
  } else if (type === 1) {
    const a = rnd(2, 9), b = rnd(-10, 10), x = rnd(-6, 9), c = a * x + b;
    q = { text: `${lin(a, b)} = ${sgn(c)}, ${X_} = ?`, ans: x,
          hint: `Сначала ${b >= 0 ? 'вычтите ' + b : 'прибавьте ' + -b} с обеих сторон: ${lin(a, 0)} = ${sgn(c - b)}. Потом разделите на ${a}.` };
  } else if (type === 2) {
    const a = rnd(2, 9); let c; do { c = rnd(1, 8); } while (c === a);
    const x = rnd(-5, 8), b = rnd(-10, 10), d = (a - c) * x + b;
    q = { text: `${lin(a, b)} = ${lin(c, d)}, ${X_} = ?`, ans: x, hint: `Иксы влево, числа вправо: ${lin(a - c, 0)} = ${sgn(d - b)}.` };
  } else if (type === 3) {
    const k = rnd(2, 9), m = rnd(1, 9), minus = Math.random() < .4;
    q = { text: `${k}(${X_} ${minus ? '−' : '+'} ${m}) = ${k}${X_} ${minus ? '−' : '+'} ?`, ans: k * m, hint: `Умножьте ${k} на каждое слагаемое: ${k}·${m}.` };
  } else if (type === 4) {
    const P = pick([50, 100, 150]), K = pick([20, 25, 30, 40]), x = rnd(3, 25);
    q = { text: story(`🚕 Посадка ${P} ₽, километр ${K} ₽. Поездка стоила ${num(P + K * x)} ₽. Сколько километров проехали?`), ans: x,
          hint: `${P} + ${K}x = ${P + K * x} → ${K}x = ${K * x}.` };
  } else if (type === 5) {
    const K1 = pick([5, 6, 8]), K2 = pick([2, 3, 4]), x = rnd(5, 30) * 10, A1 = pick([0, 100, 200]), A2 = A1 + (K1 - K2) * x;
    q = { text: story(`📱 Тариф А: ${A1} ₽ + ${K1} ₽/мин. Тариф Б: ${A2} ₽ + ${K2} ₽/мин. При скольких минутах они стоят одинаково?`), ans: x,
          hint: `${A1} + ${K1}x = ${A2} + ${K2}x → ${K1 - K2}x = ${A2 - A1}.` };
  } else {
    const c = rnd(2, 6) * 10, p = c + rnd(3, 15) * 10, x = rnd(2, 20) * 100, F = (p - c) * x;
    q = { text: story(`☕ Аренда ${num(F)} ₽ в месяц. Чашка стоит ${p} ₽, её себестоимость ${c} ₽. Сколько чашек надо продать, чтобы выйти в ноль?`), ans: x,
          hint: `С каждой чашки остаётся ${p - c} ₽. Решите ${p - c}x = ${num(F)}.` };
  }
  $('qTask').innerHTML = `<span class="fade" style="display:inline-block">${q.text}</span>`;
  $('qIn').value = ''; $('qMsg').textContent = '';
}
function check() {
  const raw = $('qIn').value.replace(/[\s₽]/g, '').replace(',', '.').replace('−', '-');
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

render1(); render2(); render3(); render4(); build5(); buildUse(); newQuiz();
$('qScore').textContent = 'Счёт: 0 из 0';
