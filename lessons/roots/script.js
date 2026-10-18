const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const fmt = (x, d = 3) => (+x.toFixed(d)).toLocaleString('ru-RU', { maximumFractionDigits: d });
const rt = (a, n) => `<span class="rt">${n ? `<sup>${n}</sup>` : ''}√<span class="ov">${a}</span></span>`;
const chipsHTML = list => list.map(c => `<span class="chip fade">${c}</span>`).join('');

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

// ---------- 1. Квадратный корень ----------
const a1 = bindRange('a1', render1);
function render1() {
  const a = a1(), r = Math.sqrt(a), f = Math.floor(r), n = Math.ceil(r), perfect = f * f === a;
  $('a1v').textContent = a;
  $('p1Label').innerHTML = `${rt(a)} ${perfect ? '=' : '≈'} ${perfect ? r : fmt(r)}`;
  const u = 22, svg = $('p1Svg'); svg.innerHTML = '';
  svg.setAttribute('viewBox', `-4 -30 ${n * u + 8} ${n * u + 34}`);
  for (let i = 0; i < a; i++) {
    const t = el('rect', { x: (i % n) * u + 1, y: Math.floor(i / n) * u + 1, width: u - 2, height: u - 2, rx: 3 }, svg);
    style(t, { fill: 'var(--b)', animationDelay: Math.min(i * 12, 1000) + 'ms' }).classList.add('pop');
  }
  const later = Math.min(a * 12, 1000) + 250 + 'ms';
  const sq = el('rect', { x: 0, y: 0, width: r * u, height: r * u }, svg);
  style(sq, { fill: 'var(--a)', fillOpacity: .15, stroke: 'var(--a)', strokeWidth: 3, strokeDasharray: '7 4', animationDelay: later }).classList.add('fade');
  const label = el('text', { x: (r * u) / 2, y: -10, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700 }, svg);
  label.textContent = `сторона ${perfect ? r : '≈ ' + fmt(r, 2)}`;
  style(label, { fill: 'var(--a)', animationDelay: later }).classList.add('fade');
  $('p1Info').innerHTML = chipsHTML(perfect
    ? [`${r}² = ${a} — плитки сложились в квадрат ${r}×${r}`, `проверка: ${r} · ${r} = ${a}`]
    : [`плитки не складываются в квадрат`, `${f}² = ${f * f} < ${a} < ${n}² = ${n * n}`, `значит ${f} < √${a} < ${n}`, `проверка: ${fmt(r)}² ≈ ${fmt(r * r, 2)}`]);
  $('p1Squares').innerHTML = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]
    .map(v => `<span class="chip click" data-a="${v}" style="${v === a ? 'border-color:var(--a)' : ''}">${v}</span>`).join('');
  $('p1Squares').querySelectorAll('[data-a]').forEach(c => c.onclick = () => { $('a1').value = c.dataset.a; render1(); });
}

// ---------- 2. Обратное действие ----------
const x2 = bindRange('x2', render2);
const G2 = { W: 560, H: 260 };
G2.X = v => 46 + (v * (G2.W - 70)) / 100;
G2.Y = v => G2.H - 30 - (v * (G2.H - 50)) / 10;
(function buildGraph2() {
  const svg = $('p2Svg'), { W, H, X, Y } = G2;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  style(el('path', { d: `M${X(0)},${Y(10)} V${Y(0)} H${X(100) + 10}`, fill: 'none' }, svg), { stroke: 'var(--line)', strokeWidth: 2 });
  for (let v = 0; v <= 100; v += 20) style(el('text', { x: X(v), y: H - 10, 'text-anchor': 'middle', 'font-size': 12 }, svg), { fill: 'var(--muted)' }).textContent = v;
  for (let v = 0; v <= 10; v += 2) style(el('text', { x: X(0) - 8, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 12 }, svg), { fill: 'var(--muted)' }).textContent = v;
  let d = '';
  for (let v = 0; v <= 100; v += 0.5) d += (v ? 'L' : 'M') + X(v) + ',' + Y(Math.sqrt(v));
  const curve = el('path', { d, fill: 'none', pathLength: 1 }, svg);
  style(curve, { stroke: 'var(--c)', strokeWidth: 3 }).classList.add('draw');
  style(el('text', { x: X(78), y: Y(9.6), 'font-size': 14, 'font-weight': 700 }, svg), { fill: 'var(--c)' }).textContent = 'y = √x';
  const g = el('g', { id: 'p2Pt' }, svg); g.classList.add('move');
  style(el('circle', { cx: 0, cy: 0, r: 8 }, g), { fill: 'var(--a)' });
  style(el('text', { id: 'p2PtTxt', x: 0, y: -16, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700 }, g), { fill: 'var(--a)' });
})();
function render2() {
  const x = x2(), sq = x * x, back = Math.abs(x);
  $('x2v').textContent = x;
  $('p2Machine').innerHTML = `
    <span class="tok pop" style="background:var(--b)">${x}</span>
    <span class="arr pop" style="animation-delay:.2s">→ в квадрат →</span>
    <span class="tok pop" style="background:var(--a);animation-delay:.45s">${sq}</span>
    <span class="arr pop" style="animation-delay:.7s">→ √ →</span>
    <span class="tok pop" style="background:${x < 0 ? 'var(--gold)' : 'var(--c)'};animation-delay:.95s">${back}</span>`;
  $('p2Note').innerHTML = x < 0
    ? `Вернулись к <b>${back}</b>, а не к ${x}! Ведь и ${x}², и ${back}² равны ${sq}. Корень по определению <b>не отрицательный</b>: √(x²) = |x|.`
    : `${x}² = ${sq}, значит √${sq} = ${x}. Корень «отменяет» квадрат. На графике точка (${sq}; ${back}) лежит на кривой y = √x.`;
  $('p2Pt').style.transform = `translate(${G2.X(sq)}px, ${G2.Y(back)}px)`;
  $('p2PtTxt').textContent = `√${sq} = ${back}`;
}

// ---------- 3. Половинное деление ----------
let bs = {}, autoTimer = null;
const a3 = bindRange('a3', reset3);
const X3 = v => 20 + (v * 520) / bs.max;
function reset3() {
  clearInterval(autoTimer);
  const a = a3();
  bs = { a, max: a, lo: 0, hi: a, rows: [] };
  const svg = $('p3Svg'); svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 0 560 80');
  const band = el('rect', { id: 'band3', x: 0, y: 14, width: 1, height: 26, rx: 0 }, svg);
  style(band, { fill: 'var(--gold)', opacity: .55, transformOrigin: '0 0' }).classList.add('move');
  style(el('line', { x1: 20, y1: 40, x2: 540, y2: 40 }, svg), { stroke: 'var(--ink)', strokeWidth: 2 });
  const step = a <= 20 ? 1 : a <= 50 ? 5 : a <= 100 ? 10 : 25;
  for (let v = 0; v <= a; v += step) {
    style(el('line', { x1: X3(v), y1: 34, x2: X3(v), y2: 46 }, svg), { stroke: 'var(--ink)' });
    style(el('text', { x: X3(v), y: 64, 'text-anchor': 'middle', 'font-size': 12 }, svg), { fill: 'var(--muted)' }).textContent = v;
  }
  const mid = el('g', { id: 'mid3' }, svg); mid.classList.add('move');
  style(el('path', { d: 'M0,10 l-6,-9 h12 z' }, mid), { fill: 'var(--a)' });
  render3();
}
function step3() {
  if (bs.hi - bs.lo < 1e-6) return;
  const m = (bs.lo + bs.hi) / 2, s = m * m, big = s > bs.a;
  if (big) bs.hi = m; else bs.lo = m;
  bs.rows.push({ m, s, big, lo: bs.lo, hi: bs.hi });
  render3(m);
}
function render3(m) {
  const { a, lo, hi, rows } = bs;
  $('a3v').textContent = a;
  $('band3').style.transform = `translate(${X3(lo)}px, 0) scaleX(${Math.max(0.5, X3(hi) - X3(lo))})`;
  $('mid3').style.transform = `translate(${X3(m ?? (lo + hi) / 2)}px, 0)`;
  const done = hi - lo < 0.001;
  $('p3Label').innerHTML = `${rt(a)} между ${fmt(lo, 4)} и ${fmt(hi, 4)}` +
    (done ? `<div class="answer fade">≈ ${fmt((lo + hi) / 2, 3)} ✅ калькулятор: ${fmt(Math.sqrt(a), 3)}</div>` : '');
  $('p3Table').innerHTML = '<tr><th>шаг</th><th>середина m</th><th>m²</th><th></th><th>новый отрезок</th></tr>' +
    rows.slice(-7).map((r, i, arr) => `<tr class="${i === arr.length - 1 ? 'fade' : ''}"><td>${rows.length - arr.length + i + 1}</td><td>${fmt(r.m, 4)}</td><td>${fmt(r.s, 3)}</td>
      <td style="color:${r.big ? 'var(--a)' : 'var(--c)'}">${r.big ? '&gt; ' + a + ' ← левее' : '&lt; ' + a + ' → правее'}</td><td>[${fmt(r.lo, 4)}; ${fmt(r.hi, 4)}]</td></tr>`).join('');
}
$('step3').onclick = step3;
$('reset3').onclick = reset3;
$('auto3').onclick = () => {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => { if (bs.hi - bs.lo < 0.001) clearInterval(autoTimer); else step3(); }, 650);
};

// ---------- 4. Вынесение множителя ----------
let shown4 = false;
const n4 = bindRange('n4', () => { shown4 = false; render4(); });
$('go4').onclick = () => { shown4 = !shown4; render4(); };
function factor(n) {
  const f = [];
  for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; }
  if (n > 1) f.push(n);
  return f;
}
function render4() {
  const n = n4(), f = factor(n);
  $('n4v').textContent = n;
  $('go4').textContent = shown4 ? '↺ Сначала' : 'Вынести пары ▶';
  const pairs = [], singles = [], items = [];
  for (let i = 0; i < f.length;) {
    if (f[i] === f[i + 1]) { const color = `hsl(${pairs.length * 67 + 10},65%,50%)`; pairs.push({ p: f[i], color }); items.push({ p: f[i], color }, { p: f[i], color }); i += 2; }
    else { singles.push(f[i]); items.push({ p: f[i], color: 'var(--muted)' }); i++; }
  }
  const k = pairs.reduce((s, x) => s * x.p, 1), m = singles.reduce((s, x) => s * x, 1);
  const tok = (x, i) => `<span class="tok pop" style="background:${x.color};animation-delay:${i * 70}ms">${x.p}</span>`;
  const join = arr => arr.map(tok).join('<span class="dot">·</span>');
  const radical = inner => `<span class="rad"><span class="sym">√</span><span class="in">${inner}</span></span>`;
  if (!shown4) {
    $('p4Stage').innerHTML = `<div class="machine">${rt(n)}&nbsp;=&nbsp;${radical(join(items))}</div>`;
    $('p4Formula').innerHTML = pairs.length ? `<span class="fade" style="display:inline-block">Ищем пары одинаковых множителей…</span>`
      : `<span class="fade" style="display:inline-block">Пар нет — ${rt(n)} не упрощается.</span>`;
  } else if (!pairs.length) {
    $('p4Stage').innerHTML = `<div class="machine">${rt(n)}</div>`;
    $('p4Formula').innerHTML = `<span class="fade" style="display:inline-block">Пар нет — ${rt(n)} не упрощается.</span>`;
  } else {
    const outside = pairs.length ? join(pairs) : '';
    const inside = singles.length ? radical(join(singles.map(p => ({ p, color: 'var(--muted)' })))) : '';
    $('p4Stage').innerHTML = `<div class="machine">${rt(n)}&nbsp;=&nbsp;${outside}${outside && inside ? '<span class="dot">·</span>' : ''}${inside || (outside ? '' : '1')}</div>`;
    const res = k === 1 ? rt(n) : m === 1 ? `${k}` : `${k}${rt(m)}`;
    $('p4Formula').innerHTML = `<span class="fade" style="display:inline-block">${rt(n)} = ${rt(`${k * k}·${m}`)} = ${rt(k * k)}·${rt(m)} = <span style="color:var(--a)">${res}</span></span>`;
  }
}

// ---------- 5. Кубический корень ----------
const a5 = bindRange('a5', render5);
function drawCube(svg, side, ox, oy, s, grid) {
  const c = Math.cos(Math.PI / 6);
  const P = (x, y, z) => `${ox + (x - y) * c * s},${oy + (x + y) * 0.5 * s - z * s}`;
  const faces = [
    { op: .55, f: (i, j, a, b) => [P(i, j, side), P(a, j, side), P(a, b, side), P(i, b, side)] },
    { op: 1, f: (i, j, a, b) => [P(side, i, j), P(side, a, j), P(side, a, b), P(side, i, b)] },
    { op: .78, f: (i, j, a, b) => [P(i, side, j), P(a, side, j), P(a, side, b), P(i, side, b)] },
  ];
  const n = grid ? side : 1, st = side / n;
  let k = 0;
  faces.forEach(face => {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const poly = el('polygon', { points: face.f(i * st, j * st, (i + 1) * st, (j + 1) * st).join(' ') }, svg);
      style(poly, { fill: 'var(--b)', fillOpacity: face.op, stroke: 'var(--card)', strokeWidth: 1.2, animationDelay: Math.min(k++ * 8, 1200) + 'ms' }).classList.add('pop');
    }
  });
}
function render5() {
  const a = a5(), r = Math.cbrt(a), ri = Math.round(r), perfect = ri ** 3 === a, f = Math.floor(r + 1e-9);
  $('a5v').textContent = a;
  $('p5Label').innerHTML = `${rt(a, 3)} ${perfect ? '=' : '≈'} ${perfect ? ri : fmt(r)}`;
  const svg = $('p5Svg'); svg.innerHTML = '';
  const s = 11;
  drawCube(svg, perfect ? ri : r, 110, 245 - r * s, s, perfect);
  $('p5Info').innerHTML = chipsHTML(perfect
    ? [`${ri}³ = ${ri}·${ri}·${ri} = ${a}`, `куб ${ri}×${ri}×${ri}`]
    : [`${f}³ = ${f ** 3} < ${a} < ${(f + 1) ** 3} = ${f + 1}³`, `значит ${f} < ∛${a} < ${f + 1}`]);
  $('p5Cubes').innerHTML = [1, 8, 27, 64, 125, 216, 343, 512, 729, 1000]
    .map(v => `<span class="chip click" data-a="${v}" style="${v === a ? 'border-color:var(--a)' : ''}">${v}</span>`).join('');
  $('p5Cubes').querySelectorAll('[data-a]').forEach(c => c.onclick = () => { $('a5').value = c.dataset.a; render5(); });
}

// ---------- 6. Зачем нужны корни ----------
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
let useTab = 'ladder', fallFrame = null;
const USES = {
  ladder: {
    controls: slider('lH', 'Высота окна, м', 2, 12, 4) + slider('lB', 'Отступ от стены, м', 1, 6, 3),
    render() {
      const h = +$('lH').value, b = +$('lB').value, c = Math.hypot(h, b), whole = Number.isInteger(c);
      $('lHv').textContent = h; $('lBv').textContent = b;
      const k = 20, X0 = 40, Y0 = 270, wallX = X0 + 6 * k + 30;
      const footX = wallX - b * k, topY = Y0 - h * k;
      let rungs = '';
      const steps = Math.floor(c / 0.4);
      for (let i = 1; i < steps; i++) {
        const t = i / steps, x = footX + (wallX - footX) * t, y = Y0 + (topY - Y0) * t;
        rungs += `<circle class="pop" cx="${x}" cy="${y}" r="2.5" style="fill:var(--a);animation-delay:${400 + i * 30}ms"/>`;
      }
      $('useOut').innerHTML = `
        <div class="mid">c = ${rt(`${h}² + ${b}²`)} = ${rt(h * h + b * b)} ${whole ? '=' : '≈'} <span style="color:var(--a)">${whole ? c : fmt(c, 2)} м</span></div>
        <svg viewBox="0 0 300 300" style="max-width:320px;margin:10px auto">
          <rect x="${wallX}" y="20" width="16" height="250" style="fill:var(--line)"/>
          <line x1="10" y1="${Y0}" x2="290" y2="${Y0}" style="stroke:var(--ink);stroke-width:2"/>
          <rect x="${wallX - 26}" y="${topY - 22}" width="26" height="22" rx="2" style="fill:var(--b);opacity:.5"/>
          <path d="M${wallX - 12},${Y0} v-12 h12" fill="none" style="stroke:var(--muted)"/>
          <line class="draw" pathLength="1" x1="${footX}" y1="${Y0}" x2="${wallX}" y2="${topY}" style="stroke:var(--a);stroke-width:5;stroke-linecap:round"/>
          ${rungs}
          <text x="${(footX + wallX) / 2}" y="${Y0 + 22}" text-anchor="middle" font-size="14" style="fill:var(--ink)">b = ${b} м</text>
          <text x="${wallX + 22}" y="${(Y0 + topY) / 2}" font-size="14" style="fill:var(--ink)">h = ${h} м</text>
          <text x="${(footX + wallX) / 2 - 18}" y="${(Y0 + topY) / 2 - 6}" text-anchor="end" font-size="14" font-weight="700" style="fill:var(--a)">c = ?</text>
        </svg>
        <div class="info">${chipsHTML([`c² = ${h}² + ${b}² = ${h * h} + ${b * b} = ${h * h + b * b}`, whole ? 'целый ответ: «пифагорова тройка»!' : `проверка: ${fmt(c, 2)}² ≈ ${fmt(c * c, 1)}`])}</div>
        <p class="answer">Теорема Пифагора даёт <b>квадрат</b> длины лестницы: c² = h² + b². Чтобы получить саму длину, извлекаем корень.
        Так же находят диагональ экрана, расстояние «по прямой» и проверяют прямой угол: стороны 3, 4 и 5 м.</p>`;
    },
  },
  fall: {
    controls: slider('fH', 'Высота, м', 1, 300, 20) +
      `<div class="btns"><button class="primary" id="fGo">Бросить ▶</button></div>
       <div class="info"><span class="chip click" data-h="5">5 м — 2 этажа</span><span class="chip click" data-h="20">20 м</span><span class="chip click" data-h="80">80 м</span><span class="chip click" data-h="300">300 м — Эйфелева башня</span></div>`,
    render() {
      const h = +$('fH').value, t = Math.sqrt((2 * h) / 9.8);
      $('fHv').textContent = h;
      const t4 = Math.sqrt((2 * 4 * h) / 9.8);
      $('useOut').innerHTML = `
        <div class="mid">t = ${rt('2h / g')} = ${rt(`2·${h} / 9,8`)} ≈ <span style="color:var(--a)">${fmt(t, 2)} с</span></div>
        <div style="display:flex;gap:20px;align-items:center;margin-top:10px">
          <svg viewBox="0 0 120 260" style="max-width:120px">
            <rect x="10" y="10" width="40" height="240" style="fill:var(--line)"/>
            <line x1="0" y1="250" x2="120" y2="250" style="stroke:var(--ink);stroke-width:2"/>
            <circle id="ball" cx="80" cy="12" r="9" style="fill:var(--a);--dist:229px"/>
          </svg>
          <div><div class="big" id="fClock">0,00 с</div><div class="lead">секундомер</div></div>
        </div>
        <div class="info">${chipsHTML([`в 4 раза выше (${4 * h} м) → ${fmt(t4, 2)} с — всего в 2 раза дольше`, 'сопротивление воздуха не учитываем'])}</div>
        <p class="answer">Путь при падении растёт как квадрат времени: h = g·t²/2. Значит, время — это <b>корень</b> из высоты.
        Поэтому падение с высоты в 4 раза больше длится лишь в 2 раза дольше, а в 100 раз больше — в 10 раз дольше.</p>`;
      $('fGo').onclick = () => drop(t);
      $('useCtl').querySelectorAll('[data-h]').forEach(c => c.onclick = () => { $('fH').value = c.dataset.h; USES.fall.render(); drop(Math.sqrt((2 * +c.dataset.h) / 9.8)); });
    },
  },
  horizon: {
    controls: `<label class="r">Где стоит наблюдатель<select id="hzS" style="grid-column:1/-1">
        <option value="1.7">🧍 Человек на берегу — 1,7 м</option>
        <option value="30">🗼 Маяк — 30 м</option>
        <option value="330">🗼 Эйфелева башня — 330 м</option>
        <option value="828">🏙️ Самый высокий небоскрёб — 828 м</option>
        <option value="8848">⛰️ Эверест — 8 848 м</option>
        <option value="10000">✈️ Самолёт — 10 000 м</option>
        <option value="400000">🛰️ МКС — 400 км</option>
      </select></label>`,
    render() {
      const h = +$('hzS').value, R = 6371000, d = Math.sqrt(2 * R * h + h * h) / 1000;
      const cx = 160, cy = 330, r = 240, hp = 10 + 16 * Math.log10(h + 1), th = Math.acos(r / (r + hp));
      const ox = cx, oy = cy - r - hp, tx = r * Math.sin(th), ty = cy - r * Math.cos(th);
      $('useOut').innerHTML = `
        <div class="mid">d ≈ ${rt('2Rh')} ≈ 3,57·${rt(h.toLocaleString('ru-RU'))} ≈ <span style="color:var(--a)">${num(Math.round(d * 10) / 10)} км</span></div>
        <svg viewBox="0 -20 320 200" style="margin:10px 0">
          <circle cx="${cx}" cy="${cy}" r="${r}" style="fill:var(--b);opacity:.25"/>
          <path class="draw" pathLength="1" d="M${cx - tx},${ty} A${r},${r} 0 0 1 ${cx + tx},${ty}" fill="none" style="stroke:var(--gold);stroke-width:6"/>
          <line x1="${ox}" y1="${cy - r}" x2="${ox}" y2="${oy}" style="stroke:var(--ink);stroke-width:3"/>
          <circle class="pop" cx="${ox}" cy="${oy}" r="5" style="fill:var(--a)"/>
          <line class="draw" pathLength="1" x1="${ox}" y1="${oy}" x2="${cx - tx}" y2="${ty}" style="stroke:var(--a);stroke-width:2"/>
          <line class="draw" pathLength="1" x1="${ox}" y1="${oy}" x2="${cx + tx}" y2="${ty}" style="stroke:var(--a);stroke-width:2"/>
        </svg>
        <div class="info">${chipsHTML(['жёлтая дуга — видимая часть Земли (высота на рисунке преувеличена)', `в 100 раз выше → видно в 10 раз дальше`])}</div>
        <p class="answer">Луч взгляда касается Земли. По теореме Пифагора: (R + h)² = R² + d², откуда <b>d = √(2Rh + h²) ≈ √(2Rh)</b>, где R ≈ 6 371 км.
        Так рассчитывают, с какого расстояния виден маяк и как высоко ставить антенну.</p>`;
    },
  },
  paper: {
    controls: slider('pk', 'Формат A', 0, 7, 4),
    render() {
      const k = +$('pk').value;
      $('pkv').textContent = 'A' + k;
      let [w, h] = [841, 1189];
      for (let i = 0; i < k; i++) [w, h] = [Math.floor(h / 2), w];
      const S = 0.2;
      let reg = { x: 10, y: 10, w: 841 * S, h: 1189 * S }, lines = '', hi = '';
      for (let i = 1; i <= 7; i++) {
        const vertical = reg.h <= reg.w;
        if (vertical) {
          lines += `<line class="draw" pathLength="1" x1="${reg.x + reg.w / 2}" y1="${reg.y}" x2="${reg.x + reg.w / 2}" y2="${reg.y + reg.h}" style="stroke:var(--ink);stroke-width:1.5;animation-delay:${i * 150}ms"/>`;
          reg = { x: reg.x + reg.w / 2, y: reg.y, w: reg.w / 2, h: reg.h };
        } else {
          lines += `<line class="draw" pathLength="1" x1="${reg.x}" y1="${reg.y + reg.h / 2}" x2="${reg.x + reg.w}" y2="${reg.y + reg.h / 2}" style="stroke:var(--ink);stroke-width:1.5;animation-delay:${i * 150}ms"/>`;
          reg = { x: reg.x, y: reg.y + reg.h / 2, w: reg.w, h: reg.h / 2 };
        }
        if (i === k) hi = `<rect class="pop" x="${reg.x}" y="${reg.y}" width="${reg.w}" height="${reg.h}" style="fill:var(--gold);animation-delay:${k * 150}ms"/>`;
      }
      if (k === 0) hi = `<rect class="pop" x="10" y="10" width="${841 * S}" height="${1189 * S}" style="fill:var(--gold);opacity:.6"/>`;
      $('useOut').innerHTML = `
        <div class="mid">A${k}: ${w} × ${h} мм, ${h} / ${w} ≈ <span style="color:var(--a)">${fmt(h / w, 3)}</span> ≈ √2</div>
        <svg viewBox="0 0 190 260" style="max-width:200px;margin:10px auto">
          <rect x="10" y="10" width="${841 * S}" height="${1189 * S}" style="fill:var(--bg);stroke:var(--ink);stroke-width:2"/>
          ${hi}${lines}
        </svg>
        <div class="info">${chipsHTML(['√2 ≈ 1,414', 'A0 = 1 м² по площади', 'каждый следующий — ровно половина'])}</div>
        <p class="answer">Если лист с отношением сторон 1 : x сложить пополам, получится 1 : x/2… Форма сохранится, только если x = 2/x, то есть
        x² = 2 и <b>x = √2</b>. Поэтому A4 можно увеличить до A3 на копире без полей и искажений (масштаб 141% = √2).</p>`;
    },
  },
};
function drop(t) {
  const ball = $('ball'); if (!ball) return;
  cancelAnimationFrame(fallFrame);
  ball.style.animation = 'none'; void ball.getBoundingClientRect();
  ball.style.animation = `fall ${t}s cubic-bezier(.11, 0, .5, 0) forwards`;
  const start = performance.now();
  const tick = now => {
    const sec = Math.min(t, (now - start) / 1000);
    if ($('fClock')) $('fClock').textContent = sec.toFixed(2).replace('.', ',') + ' с';
    if (sec < t) fallFrame = requestAnimationFrame(tick);
  };
  fallFrame = requestAnimationFrame(tick);
}
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
    const n = rnd(1, 20);
    q = { text: `${rt(n * n)} = ?`, ans: n, hint: `Какое число в квадрате даёт ${n * n}?` };
  } else if (type === 1) {
    const n = rnd(1, 10);
    q = { text: `${rt(n ** 3, 3)} = ?`, ans: n, hint: `Какое число в кубе даёт ${n ** 3}?` };
  } else if (type === 2) {
    let a; do { a = rnd(2, 150); } while (Number.isInteger(Math.sqrt(a)));
    q = { text: `${rt(a)} ≈ ? <small style="font-size:16px;color:var(--muted)">(до целого)</small>`, ans: Math.round(Math.sqrt(a)),
          hint: `${Math.floor(Math.sqrt(a))}² = ${Math.floor(Math.sqrt(a)) ** 2}, ${Math.ceil(Math.sqrt(a))}² = ${Math.ceil(Math.sqrt(a)) ** 2}. К какому ближе?` };
  } else if (type === 3) {
    const k = rnd(2, 6), m = pick([2, 3, 5, 6, 7]);
    q = { text: `${rt(k * k * m)} = ?${rt(m)}`, ans: k, hint: `${k * k * m} = ${k * k} · ${m}, а ${rt(k * k)} = ${k}.` };
  } else if (type === 4) {
    const n = rnd(3, 15);
    q = { text: story(`🟩 Площадь квадратной комнаты ${n * n} м². Чему равна её сторона (в метрах)?`), ans: n, hint: `Сторона = √площади = √${n * n}.` };
  } else if (type === 5) {
    const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
    q = { text: story(`🪜 Лестница стоит в ${a} м от стены и достаёт до высоты ${b} м. Какой длины лестница (в метрах)?`), ans: c, hint: `c = √(${a}² + ${b}²) = √${a * a + b * b}.` };
  } else {
    const n = rnd(2, 9);
    q = { text: story(`🧊 Объём кубического аквариума ${n ** 3} дм³. Чему равно его ребро (в дм)?`), ans: n, hint: `Ребро = ∛объёма = ∛${n ** 3}.` };
  }
  $('qTask').innerHTML = `<span class="fade" style="display:inline-block">${q.text}</span>`;
  $('qIn').value = ''; $('qMsg').textContent = '';
}
function check() {
  const v = parseInt($('qIn').value.replace(/\s/g, ''), 10), msg = $('qMsg');
  if (isNaN(v)) { msg.className = 'bad'; msg.textContent = 'Введите число.'; return; }
  tries++;
  if (v === q.ans) {
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

render1(); render2(); reset3(); render4(); render5(); buildUse(); newQuiz();
$('qScore').textContent = 'Счёт: 0 из 0';
