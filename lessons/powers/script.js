const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const pw = (a, n, color) => `<span${color ? ` style="color:${color}"` : ''}>${a}<sup>${n}</sup></span>`;
const frac = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function bindRange(id, onChange) {
  const input = $(id);
  input.addEventListener('input', onChange);
  return () => +input.value;
}
const restart = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

// ---------- 1. Что такое степень ----------
const a1 = bindRange('a1', render1), n1 = bindRange('n1', render1);

function drawCube(svg, a, ox, oy, s, delay0) {
  const c = Math.cos(Math.PI / 6);
  const P = (x, y, z) => `${ox + (x - y) * c * s},${oy + (x + y) * 0.5 * s - z * s}`;
  const faces = [
    { op: 0.55, cell: (i, j) => [P(i, j, a), P(i + 1, j, a), P(i + 1, j + 1, a), P(i, j + 1, a)] }, // верх
    { op: 1,    cell: (i, j) => [P(a, i, j), P(a, i + 1, j), P(a, i + 1, j + 1), P(a, i, j + 1)] }, // правая
    { op: 0.78, cell: (i, j) => [P(i, a, j), P(i + 1, a, j), P(i + 1, a, j + 1), P(i, a, j + 1)] }, // левая
  ];
  let k = 0;
  faces.forEach(f => {
    for (let i = 0; i < a; i++) for (let j = 0; j < a; j++) {
      const poly = el('polygon', { points: f.cell(i, j).join(' ') }, svg);
      poly.style.fill = 'var(--a)'; poly.style.fillOpacity = f.op;
      poly.style.stroke = 'var(--card)'; poly.style.strokeWidth = 1.5;
      poly.classList.add('pop'); poly.style.animationDelay = Math.min(delay0 + k++ * 12, 1600) + 'ms';
    }
  });
}

function drawPicture(svg, a, n) {
  svg.innerHTML = '';
  const note = t => { const x = el('text', { x: 200, y: 60, 'text-anchor': 'middle', 'font-size': 16 }, svg); x.textContent = t; x.style.fill = 'var(--muted)'; };
  if (n === 0) {
    svg.setAttribute('viewBox', '0 0 400 120');
    const d = el('circle', { cx: 200, cy: 60, r: 22 }, svg); d.style.fill = 'var(--a)'; d.classList.add('pop');
    return;
  }
  if (n === 1) {
    const s = 44;
    svg.setAttribute('viewBox', `0 0 ${a * s} ${s}`); svg.style.maxWidth = a * 52 + 'px';
    for (let i = 0; i < a; i++) {
      const d = el('circle', { cx: i * s + s / 2, cy: s / 2, r: s * 0.38 }, svg);
      d.style.fill = 'var(--a)'; d.classList.add('pop'); d.style.animationDelay = i * 80 + 'ms';
    }
    return;
  }
  if (n === 2) {
    const s = 30;
    svg.setAttribute('viewBox', `0 0 ${a * s} ${a * s}`); svg.style.maxWidth = '300px';
    for (let i = 0; i < a; i++) for (let j = 0; j < a; j++) {
      const r = el('rect', { x: j * s + 2, y: i * s + 2, width: s - 4, height: s - 4, rx: 4 }, svg);
      r.style.fill = 'var(--a)'; r.classList.add('pop'); r.style.animationDelay = (i * a + j) * 25 + 'ms';
    }
    return;
  }
  if (n === 3) {
    const s = 120 / a, c = Math.cos(Math.PI / 6);
    svg.setAttribute('viewBox', `0 0 ${2 * a * c * s + 8} ${2 * a * s + 8}`); svg.style.maxWidth = '280px';
    drawCube(svg, a, a * c * s + 4, a * s + 4, s, 0);
    return;
  }
  if (n === 4 && a <= 5) {
    const s = 60 / a, c = Math.cos(Math.PI / 6), w = 2 * a * c * s + 14;
    svg.setAttribute('viewBox', `0 0 ${a * w} ${2 * a * s + 8}`); svg.style.maxWidth = a * 150 + 'px';
    for (let k = 0; k < a; k++) drawCube(svg, a, k * w + a * c * s + 4, a * s + 4, s, k * 250);
    return;
  }
  svg.setAttribute('viewBox', '0 0 400 120'); svg.style.maxWidth = '';
  note('Нарисовать сложно, но умножение работает так же ↑');
}

function render1() {
  const a = a1(), n = n1();
  $('a1v').textContent = a; $('n1v').textContent = n;
  $('p1Label').innerHTML = `${pw(a, n, 'var(--a)')} = ${num(a ** n)}`;
  const chain = $('p1Chain');
  if (n === 0) {
    chain.innerHTML = `<span class="chip fade">Ни одного множителя — результат 1 (объяснение в разделе 4)</span>`;
  } else {
    let html = '', prod = 1;
    for (let i = 0; i < n; i++) {
      prod *= a;
      if (i) html += `<span class="x pop" style="animation-delay:${i * 220}ms">×</span>`;
      html += `<span class="step pop" style="animation-delay:${i * 220}ms"><span class="tok" style="background:var(--a)">${a}</span><small>= ${num(prod)}</small></span>`;
    }
    chain.innerHTML = html;
  }
  drawPicture($('p1Svg'), a, n);
  const names = { 1: 'a¹ = само число', 2: 'a² — «квадрат»: площадь квадрата a×a', 3: 'a³ — «куб»: объём куба a×a×a', 4: 'a⁴ — это a кубов a×a×a' };
  const chips = [];
  if (names[n]) chips.push(names[n]);
  chips.push(`основание ${a}, показатель ${n}`);
  if (a === 1) chips.push('1 в любой степени = 1');
  $('p1Info').innerHTML = chips.map(c => `<span class="chip fade">${c}</span>`).join('');
}

// ---------- 2. Удвоение ----------
const n2 = bindRange('n2', render2);
function render2() {
  const n = n2(), cells = 2 ** n;
  $('n2v').textContent = n;
  $('p2Label').innerHTML = `${pw(2, n, 'var(--b)')} = ${num(cells)}`;
  const cols = 2 ** Math.ceil(n / 2), rows = 2 ** Math.floor(n / 2);
  const svg = $('p2Svg'); svg.innerHTML = '';
  const s = 16, gap = cols > 16 ? 1 : 2;
  svg.setAttribute('viewBox', `0 0 ${cols * s} ${rows * s}`);
  svg.style.maxWidth = Math.min(560, cols * 40) + 'px';
  for (let i = 0; i < cells; i++) {
    const r = el('rect', { x: (i % cols) * s + gap / 2, y: Math.floor(i / cols) * s + gap / 2, width: s - gap, height: s - gap, rx: 2 }, svg);
    r.style.fill = 'var(--b)';
    // новые клетки (вторая половина) появляются с анимацией
    if (i >= cells / 2) { r.classList.add('pop'); r.style.animationDelay = Math.min((i - cells / 2) * 4, 700) + 'ms'; }
  }
  const mm = cells * 0.1;
  $('p2Info').innerHTML = [
    `слоёв: ${num(cells)}`,
    `толщина при 0,1 мм на лист: ${mm < 1000 ? num(+mm.toFixed(1)) + ' мм' : num(+(mm / 1000).toFixed(2)) + ' м'}`,
    n ? `${pw(2, n)} = 2 · ${pw(2, n - 1)} = 2 · ${num(cells / 2)}` : '2⁰ = 1 — лист ещё не сложен',
  ].map(c => `<span class="chip fade">${c}</span>`).join('');
}
$('moon').addEventListener('click', () => {
  const km = Math.round((2 ** 42 * 0.1) / 1e6);
  $('p2Info').innerHTML = `<span class="chip pop" style="border-color:var(--gold)">2<sup>42</sup> = ${num(2 ** 42)} слоёв · толщина ≈ ${num(km)} км — больше, чем до Луны (384 400 км)! 🌕</span>`;
});

// ---------- 3. Свойства ----------
let rule = 'mul', shown = false;
const a3 = bindRange('a3', () => { shown = false; render3(); });
const m3 = bindRange('m3', () => { shown = false; render3(); });
const n3 = bindRange('n3', () => { shown = false; render3(); });
document.querySelectorAll('[data-rule]').forEach(b => b.addEventListener('click', () => {
  rule = b.dataset.rule; shown = false;
  document.querySelectorAll('[data-rule]').forEach(x => x.classList.toggle('on', x === b));
  render3();
}));
$('ruleGo').addEventListener('click', () => { shown = !shown; render3(); });

const tok = (a, color, i = 0, extra = '') =>
  `<span class="tok pop ${extra}" style="background:${color};animation-delay:${i * 60}ms">${a}</span>`;
const toks = (a, k, color, from = 0) => Array.from({ length: k }, (_, i) => tok(a, color, from + i)).join('');

function render3() {
  const a = a3();
  $('n3').max = rule === 'div' ? m3() : 5;
  const m = m3(), n = Math.min(n3(), +$('n3').max);
  $('a3v').textContent = a; $('m3v').textContent = m; $('n3v').textContent = n;
  $('ruleGo').textContent = shown ? '↺ Сначала' : 'Показать ▶';
  const A = 'var(--a)', B = 'var(--b)', C = 'var(--c)';
  let html, formula;
  if (rule === 'mul') {
    html = shown
      ? `<div class="rule-row">${toks(a, m, A)}${toks(a, n, B, m)}</div>`
      : `<div class="rule-row">${pw(a, m, A)}&nbsp;= ${toks(a, m, A)}</div><div class="rule-row">${pw(a, n, B)}&nbsp;= ${toks(a, n, B)}</div>`;
    formula = shown
      ? `${pw(a, m, A)} · ${pw(a, n, B)} = ${pw(a, `${m}+${n}`)} = ${pw(a, m + n, C)} = ${num(a ** (m + n))}`
      : `Сколько всего множителей ${a}?`;
  } else if (rule === 'div') {
    const top = Array.from({ length: m }, (_, i) => tok(a, A, i, shown && i < n ? 'gone' : '')).join('');
    const bot = Array.from({ length: n }, (_, i) => tok(a, B, i, shown ? 'gone' : '')).join('');
    html = `<div class="rule-row"><span class="over"><span class="rule-row">${top}</span><hr><span class="rule-row">${bot}</span></span></div>`;
    formula = shown
      ? `${pw(a, m, A)} : ${pw(a, n, B)} = ${pw(a, `${m}−${n}`)} = ${pw(a, m - n, C)} = ${num(a ** (m - n))}`
      : `Одинаковые множители сверху и снизу сокращаются…`;
  } else {
    const groups = Array.from({ length: n }, (_, g) =>
      `<span class="group pop" style="animation-delay:${g * 150}ms">${toks(a, m, g % 2 ? B : A, g * m)}</span>`).join('');
    html = shown
      ? `<div class="rule-row">${Array.from({ length: n }, (_, g) => toks(a, m, g % 2 ? B : A, g * m)).join('')}</div>`
      : `<div class="rule-row">(${pw(a, m)})<sup>${n}</sup>&nbsp;=</div><div class="rule-row">${groups}</div>`;
    formula = shown
      ? `(${pw(a, m)})<sup>${n}</sup> = ${pw(a, `${m}·${n}`)} = ${pw(a, m * n, C)}${m * n <= 20 ? ' = ' + num(a ** (m * n)) : ''}`
      : `${n} групп по ${m} множителей…`;
  }
  $('ruleStage').innerHTML = html;
  $('ruleFormula').innerHTML = `<span class="fade" style="display:inline-block">${formula}</span>`;
}

// ---------- 4. Лестница ----------
let lowest = 1;
const a4 = bindRange('a4', render4);
$('down').addEventListener('click', () => { if (lowest > -3) { lowest--; render4(true); } });
$('reset4').addEventListener('click', () => { lowest = 1; render4(); });
function render4(animateLast) {
  const a = a4();
  $('a4v').textContent = a;
  let html = '';
  for (let k = 4; k >= lowest; k--) {
    const value = k >= 0 ? num(a ** k) : frac(1, num(a ** -k));
    const cls = (k === 0 ? ' zero' : '') + (k < 0 ? ' neg' : '') + (animateLast && k === lowest ? ' pop' : '');
    if (k < 4) html += `<div class="arrow${animateLast && k === lowest ? ' fade' : ''}">÷${a}<br>→</div>`;
    html += `<div class="card${cls}"><div class="p">${pw(a, k)}</div><div class="v">${value}</div></div>`;
  }
  $('stairs').innerHTML = html;
  $('down').disabled = lowest <= -3;
  const notes = {
    1: 'Каждый шаг вправо — показатель на 1 меньше, значение в a раз меньше. Нажмите «Шаг вниз».',
    0: `${a}¹ : ${a} = 1. Поэтому любое число (кроме 0) в нулевой степени равно 1.`,
    '-1': `1 : ${a} = 1/${a}. Отрицательный показатель — это «один делить на»: ${a}⁻¹ = 1/${a}.`,
  };
  $('p4Note').innerHTML = notes[lowest] || `Правило: a<sup>−n</sup> = 1 / a<sup>n</sup>. Например, ${a}<sup>${lowest}</sup> = 1/${num(a ** -lowest)}.`;
}

// ---------- 5. Кто быстрее ----------
const n5 = bindRange('n5', render5);
function render5() {
  const N = n5();
  $('n5v').textContent = N;
  const series = [
    { f: n => 10 * n, color: 'var(--c)' },
    { f: n => n * n, color: 'var(--b)' },
    { f: n => 2 ** n, color: 'var(--a)' },
  ];
  const W = 560, H = 300, L = 50, B = 30;
  const maxY = Math.max(...series.map(s => s.f(N)));
  const X = n => L + ((W - L - 10) * n) / N, Y = v => H - B - ((H - B - 10) * v) / maxY;
  const svg = $('p5Svg'); svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const axis = el('path', { d: `M${L},10 V${H - B} H${W}`, fill: 'none' }, svg);
  axis.style.stroke = 'var(--line)'; axis.style.strokeWidth = 2;
  for (let n = 0; n <= N; n += N > 8 ? 2 : 1) {
    const t = el('text', { x: X(n), y: H - 8, 'text-anchor': 'middle', 'font-size': 12 }, svg);
    t.textContent = n; t.style.fill = 'var(--muted)';
  }
  [0, maxY / 2, maxY].forEach(v => {
    const t = el('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 12 }, svg);
    t.textContent = num(Math.round(v)); t.style.fill = 'var(--muted)';
  });
  series.forEach((s, si) => {
    let d = '';
    for (let n = 0; n <= N; n++) d += (n ? 'L' : 'M') + X(n) + ',' + Y(s.f(n));
    const p = el('path', { d, fill: 'none', pathLength: 1 }, svg);
    p.style.stroke = s.color; p.style.strokeWidth = 3; p.style.strokeLinejoin = 'round';
    p.classList.add('draw'); p.style.animationDelay = si * 300 + 'ms';
  });
  let rows = '<tr><th>n</th><th>10·n</th><th>n²</th><th>2ⁿ</th></tr>';
  for (let n = Math.max(0, N - 4); n <= N; n++)
    rows += `<tr><td>${n}</td>${series.map(s => `<td style="color:${s.color}">${num(s.f(n))}</td>`).join('')}</tr>`;
  $('p5Table').innerHTML = rows;
  let over = 0;
  for (let n = 1; n <= 20; n++) if (2 ** n > 10 * n && 2 ** n > n * n && n > 4) { over = n; break; }
  $('p5Note').textContent = N >= over
    ? `Начиная с n = ${over}, 2ⁿ больше и 10·n, и n² — и дальше отрыв только растёт.`
    : `Пока 2ⁿ отстаёт. Увеличьте n до ${over} и дальше.`;
}

// ---------- 6. Зачем нужны степени ----------
let useTab = 'bank';
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
const chips = list => `<div class="info">${list.map(c => `<span class="chip fade">${c}</span>`).join('')}</div>`;

function formatTime(sec) {
  if (sec < 1) return 'меньше секунды';
  const units = [[60, 'сек'], [60, 'мин'], [24, 'ч'], [365, 'дн']];
  let v = sec;
  for (const [k, name] of units) { if (v < k) return `${num(+v.toFixed(1))} ${name}`; v /= k; }
  if (v < 1e6) return `${num(Math.round(v))} лет`;
  if (v < 1e9) return `${num(+(v / 1e6).toFixed(1))} млн лет`;
  if (v < 1.38e10) return `${num(+(v / 1e9).toFixed(1))} млрд лет`;
  return `в ${num(Math.round(v / 1.38e10))} раз дольше, чем существует Вселенная`;
}

const USES = {
  bank: {
    controls: slider('bS', 'Сумма вклада, ₽', 1000, 100000, 10000, 1000) +
              slider('bR', 'Процент в год', 1, 30, 10) + slider('bN', 'Лет', 1, 30, 15),
    render() {
      const s0 = +$('bS').value, r = +$('bR').value, n = +$('bN').value, q = 1 + r / 100, qs = num(+q.toFixed(2));
      $('bSv').textContent = num(s0); $('bRv').textContent = r + '%'; $('bNv').textContent = n;
      const final = s0 * q ** n, simple = s0 * (1 + (r * n) / 100);
      const W = 560, H = 220, bw = W / (n + 1);
      let bars = '', dots = '';
      for (let i = 0; i <= n; i++) {
        const v = s0 * q ** i, h = (v / final) * (H - 20), sv = s0 * (1 + (r * i) / 100);
        bars += `<rect class="grow" style="fill:var(--b);animation-delay:${i * 50}ms" x="${i * bw + bw * .15}" y="${H - h}" width="${bw * .7}" height="${h}" rx="3"/>`;
        dots += `<circle class="pop" style="fill:var(--c);animation-delay:${600 + i * 30}ms" cx="${i * bw + bw / 2}" cy="${H - (sv / final) * (H - 20)}" r="${Math.min(5, bw / 4)}"/>`;
      }
      $('useOut').innerHTML = `
        <div class="mid">S = ${num(s0)} · ${qs}<sup>${n}</sup> ≈ <span style="color:var(--b)">${num(Math.round(final))} ₽</span></div>
        <svg viewBox="0 0 ${W} ${H}" style="margin-top:10px">${bars}${dots}</svg>
        <div class="legend"><span><i style="background:var(--b)"></i>сложный процент (степень)</span><span><i style="background:var(--c)"></i>если бы процент начислялся только на начальную сумму</span></div>
        ${chips([`деньги выросли в ${num(+(final / s0).toFixed(2))} раза`,
                 `без степени было бы ${num(Math.round(simple))} ₽`,
                 `удвоение примерно за ${num(+(Math.log(2) / Math.log(q)).toFixed(1))} лет`])}
        <p class="answer">Каждый год сумма умножается на <b>${qs}</b>. Через n лет — на ${qs}<sup>n</sup>.
        Так же считают кредиты, инфляцию и рост цен.</p>`;
    },
  },
  pass: {
    controls: slider('pL', 'Длина пароля, символов', 1, 16, 4) +
      `<label class="r">Из каких символов<select id="pK" style="grid-column:1/-1">
        <option value="10">только цифры (10)</option>
        <option value="26">маленькие буквы (26)</option>
        <option value="52">большие и маленькие буквы (52)</option>
        <option value="62">буквы + цифры (62)</option>
        <option value="94">буквы + цифры + знаки (94)</option>
      </select></label>`,
    render() {
      const n = +$('pL').value, k = +$('pK').value;
      $('pLv').textContent = n;
      const combos = BigInt(k) ** BigInt(n);
      let slots = '';
      for (let i = 0; i < n; i++)
        slots += (i ? `<span class="x pop" style="animation-delay:${i * 60}ms">×</span>` : '') +
          `<span class="step pop" style="animation-delay:${i * 60}ms"><span class="tok" style="background:var(--b)">${k}</span><small>${i + 1}-й</small></span>`;
      $('useOut').innerHTML = `
        <div class="chain">${slots}</div>
        <div class="mid">${k}<sup>${n}</sup> = <span class="pop" style="display:inline-block;color:var(--b);word-break:break-all">${combos.toLocaleString('ru-RU')}</span> вариантов</div>
        ${chips([`перебор (миллиард вариантов в секунду): ${formatTime(Number(combos) / 1e9)}`])}
        <p class="answer">На каждое из ${n} мест можно поставить любой из ${k} символов, поэтому варианты перемножаются: k·k·…·k = k<sup>n</sup>.
        <b>Один лишний символ умножает время взлома в ${k} раз.</b> Длина пароля важнее, чем сложные символы.</p>`;
    },
  },
  rumor: {
    controls: slider('rK', 'Каждый рассказывает за день', 2, 4, 3) + slider('rD', 'Дней', 0, 10, 4),
    render() {
      const k = +$('rK').value;
      const maxD = Math.floor(Math.log(1100) / Math.log(k));
      $('rD').max = maxD;
      const d = Math.min(+$('rD').value, maxD);
      $('rKv').textContent = k + ' людям'; $('rDv').textContent = d;
      const W = 560, H = 240, rowH = H / (d + 1);
      let lines = '', dots = '';
      for (let lv = 0; lv <= d; lv++) {
        const count = k ** lv, y = rowH * lv + rowH / 2, r = Math.max(1.3, Math.min(9, W / count / 2.6));
        for (let i = 0; i < count; i++) {
          const x = ((i + 0.5) * W) / count;
          if (lv && count <= 243) {
            const px = ((Math.floor(i / k) + 0.5) * W) / (count / k), py = y - rowH;
            lines += `<line class="fade" style="stroke:var(--line);animation-delay:${lv * 300}ms" x1="${px}" y1="${py}" x2="${x}" y2="${y}"/>`;
          }
          dots += `<circle class="pop" style="fill:${lv ? 'var(--a)' : 'var(--gold)'};animation-delay:${lv * 300}ms" cx="${x}" cy="${y}" r="${r}"/>`;
        }
      }
      const total = (k ** (d + 1) - 1) / (k - 1);
      let earth = 0;
      while ((k ** (earth + 1) - 1) / (k - 1) < 8e9) earth++;
      $('useOut').innerHTML = `
        <div class="mid">в день ${d} узнали ${k}<sup>${d}</sup> = <span style="color:var(--a)">${num(k ** d)}</span> новых человек</div>
        <svg viewBox="0 0 ${W} ${H}" style="margin-top:10px">${lines}${dots}</svg>
        ${chips([`всего знают: ${num(total)}`, `вся Земля (8 млрд) узнает за ${earth} дней`])}
        <p class="answer">Каждый день число новых слушателей умножается на ${k}. Так же распространяются вирусы, сообщения в соцсетях
        и «письма счастья». <b>Поэтому эпидемии важно останавливать в самом начале.</b></p>`;
    },
  },
  scale: {
    controls: slider('sP', 'Размер: 10 в степени', -10, 12, 0),
    render() {
      const p = +$('sP').value;
      $('sPv').textContent = p;
      const items = {
        '-10': ['⚛️', 'Атом'], '-9': ['🧬', 'Толщина нити ДНК'], '-8': ['🦠', 'Самые маленькие вирусы'],
        '-7': ['🦠', 'Вирус гриппа'], '-6': ['🧫', 'Бактерия'], '-5': ['🔬', 'Клетка человека'],
        '-4': ['💇', 'Толщина волоса'], '-3': ['🐜', 'Муравей'], '-2': ['🐞', 'Божья коровка'],
        '-1': ['✋', 'Ладонь'], 0: ['🧍', 'Человек'], 1: ['🏠', 'Дом'], 2: ['⚽', 'Футбольное поле'],
        3: ['🏙️', 'Самый высокий небоскрёб (828 м)'], 4: ['⛰️', 'Эверест (8,8 км)'], 5: ['🚀', 'Граница космоса (100 км)'],
        6: ['🚆', 'Москва — Санкт-Петербург'], 7: ['🌍', 'Диаметр Земли'], 8: ['🌙', 'До Луны'],
        9: ['☀️', 'Диаметр Солнца'], 10: ['🪐', 'До Венеры в ближайшей точке'], 11: ['🌞', 'От Земли до Солнца'],
        12: ['🪐', 'До Сатурна'],
      };
      const [ico, name] = items[p];
      const full = p >= 0 ? num(10 ** p) : '0,' + '0'.repeat(-p - 1) + '1';
      const W = 560, X = v => 20 + ((v + 10) * (W - 40)) / 22;
      let ticks = '';
      for (let v = -10; v <= 12; v++)
        ticks += `<line x1="${X(v)}" y1="30" x2="${X(v)}" y2="${v % 5 ? 38 : 44}" style="stroke:var(--muted)"/>` +
          (v % 5 ? '' : `<text x="${X(v)}" y="60" text-anchor="middle" font-size="12" style="fill:var(--muted)">10${v < 0 ? '⁻' : ''}${String(Math.abs(v)).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('')}</text>`);
      $('useOut').innerHTML = `
        <div style="display:flex;align-items:center;gap:18px"><span class="emoji pop">${ico}</span>
          <div><div class="mid">${name}</div><div style="font-size:22px">≈ 10<sup>${p}</sup> м</div></div></div>
        <svg viewBox="0 0 ${W} 70" style="margin-top:16px">
          <line x1="20" y1="34" x2="${W - 20}" y2="34" style="stroke:var(--ink);stroke-width:2"/>${ticks}
          <g class="slide" id="scaleMark" transform="translate(${X(this.last ?? 0)},0)"><circle cx="0" cy="34" r="8" style="fill:var(--a)"/></g>
        </svg>
        <p class="answer">Полностью: <b style="word-break:break-all">${full}</b> м.
        ${p > 0 ? `Это 1 и ${p} нулей.` : p < 0 ? `Это 1 : 10<sup>${-p}</sup> — одна ${['', 'десятая', 'сотая', 'тысячная'][-p] || `${-p}-я доля после запятой`}.` : ''}
        Каждый шаг ползунка — в 10 раз больше или меньше. Без степеней такие числа неудобно читать и легко ошибиться в нулях.</p>`;
      requestAnimationFrame(() => requestAnimationFrame(() =>
        $('scaleMark').setAttribute('transform', `translate(${X(p)},0)`)));
      this.last = p;
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
function newQuiz() {
  const type = rnd(0, 6), a = rnd(2, 9);
  const story = t => `<span style="font-size:20px;font-weight:600">${t}</span>`;
  if (type === 5) {
    const h = rnd(3, 10);
    q = { text: story(`🦠 Бактерия делится пополам каждый час. Сколько бактерий будет через ${h} ч, если сначала была одна?`),
          ans: 2 ** h, hint: `Каждый час количество умножается на 2: ответ 2^${h}.` };
  } else if (type === 6) {
    const n = rnd(2, 5);
    q = { text: story(`🔐 Сколько существует PIN-кодов из ${n} цифр (цифры могут повторяться)?`),
          ans: 10 ** n, hint: `На каждом из ${n} мест — 10 вариантов: 10^${n}.` };
  } else if (type <= 1) {
    const n = a <= 3 ? rnd(0, 6) : a <= 5 ? rnd(0, 4) : rnd(0, 3);
    q = { text: `${pw(a, n)} = ?`, ans: a ** n, hint: n ? `Перемножьте ${a} само на себя ${n} раз.` : 'Любое число (кроме 0) в степени 0 равно 1.' };
  } else if (type === 2) {
    const m = rnd(2, 7), n = rnd(2, 7);
    q = { text: `${pw(a, m)} · ${pw(a, n)} = ${pw(a, '?')}`, ans: m + n, hint: 'При умножении показатели складываются.' };
  } else if (type === 3) {
    const n = rnd(1, 5), m = n + rnd(1, 6);
    q = { text: `${pw(a, m)} : ${pw(a, n)} = ${pw(a, '?')}`, ans: m - n, hint: 'При делении показатели вычитаются.' };
  } else {
    const m = rnd(2, 5), n = rnd(2, 4);
    q = { text: `(${pw(a, m)})<sup>${n}</sup> = ${pw(a, '?')}`, ans: m * n, hint: 'При возведении степени в степень показатели перемножаются.' };
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
    msg.className = 'bad'; msg.textContent = 'Не совсем. ' + q.hint;
    restart($('qBox'), 'shake');
  }
  $('qScore').textContent = `Счёт: ${score} из ${tries}`;
}
$('qCheck').addEventListener('click', check);
$('qNew').addEventListener('click', newQuiz);
$('qIn').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });

render1(); render2(); render3(); render4(); render5(); buildUse(); newQuiz();
$('qScore').textContent = 'Счёт: 0 из 0';
