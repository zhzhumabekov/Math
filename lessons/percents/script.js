const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const fmt = (x, d = 3) => (+x.toFixed(d)).toLocaleString('ru-RU', { maximumFractionDigits: d });
const money = x => Math.round(x).toLocaleString('ru-RU') + ' ₽';
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (n, d, color) =>
  `<span class="frac"${color ? ` style="color:${color}"` : ''}><span>${n}</span><span>${d}</span></span>`;
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
const text = (svg, x, y, s, attrs = {}, color = 'var(--ink)') => {
  const t = el('text', { x, y, 'font-size': 13, 'text-anchor': 'middle', ...attrs }, svg);
  t.textContent = s; style(t, { fill: color });
  return t;
};

// ---------- 1. Что такое процент ----------
const p1 = bindRange('p1', render1);
let prev1 = 0;
(function build1() {
  const svg = $('p1Svg');
  svg.setAttribute('viewBox', '0 0 250 250');
  for (let i = 0; i < 100; i++) {
    const c = el('rect', { id: 'c1_' + i, x: (i % 10) * 25 + 1.5, y: Math.floor(i / 10) * 25 + 1.5, width: 22, height: 22, rx: 4 }, svg);
    style(c, { fill: 'var(--empty)' }).classList.add('cell');
  }
})();
const NAMES = { 1: 'сотая часть', 10: 'десятая часть', 20: 'пятая часть', 25: 'четверть', 50: 'половина', 75: 'три четверти', 100: 'всё целиком' };
function render1() {
  const p = p1(), g = gcd(p, 100) || 1;
  $('p1v').textContent = p + '%';
  $('p1Label').innerHTML = `${p}% = ${frac(p, 100)} = ${fmt(p / 100, 2)}`;
  // перекрашиваем только изменившиеся клетки — «волной» от старой границы к новой
  const lo = Math.min(prev1, p), hi = Math.max(prev1, p);
  for (let i = lo; i < hi; i++) {
    const k = p > prev1 ? i - lo : hi - 1 - i;
    style($('c1_' + i), { transitionDelay: Math.min(k * 10, 600) + 'ms', fill: i < p ? 'var(--a)' : 'var(--empty)' });
  }
  prev1 = p;
  const list = [`${p} клеток из 100`];
  if (p && g > 1 && p < 100) list.push(`сокращаем: ${p}/100 = ${p / g}/${100 / g}`);
  if (NAMES[p]) list.push(NAMES[p]);
  list.push(`чтобы найти ${p}% от числа, умножьте его на ${fmt(p / 100, 2)}`);
  $('p1Info').innerHTML = chipsHTML(list);
  $('p1Quick').innerHTML = [1, 5, 10, 20, 25, 50, 75, 100]
    .map(v => `<span class="chip click" data-p="${v}" style="${v === p ? 'border-color:var(--a)' : ''}">${v}%</span>`).join('');
  $('p1Quick').querySelectorAll('[data-p]').forEach(c => c.onclick = () => { $('p1').value = c.dataset.p; render1(); });
}

// ---------- 2. Три задачи ----------
let mode2 = 'part';
const w2 = bindRange('w2', render2), q2 = bindRange('q2', render2);
const X2 = v => 20 + v * 5.2; // v — проценты от 0 до 100
(function build2() {
  const svg = $('p2Svg');
  svg.setAttribute('viewBox', '0 0 560 130');
  style(el('rect', { x: 20, y: 40, width: 520, height: 36, rx: 6 }, svg), { fill: 'var(--empty)' });
  const bar = el('rect', { id: 'bar2', x: 20, y: 40, width: 520, height: 36 }, svg);
  style(bar, { fill: 'var(--a)', transformBox: 'fill-box', transformOrigin: 'left', transform: 'scaleX(0)' }).classList.add('move');
  for (let v = 0; v <= 100; v += 10) {
    style(el('line', { x1: X2(v), y1: 76, x2: X2(v), y2: v % 50 ? 82 : 86 }, svg), { stroke: 'var(--muted)' });
    text(svg, X2(v), 100, v + '%', { 'font-size': 11 }, 'var(--muted)');
  }
  const g = el('g', { id: 'lbl2' }, svg); g.classList.add('move');
  style(el('path', { d: 'M0,40 l-5,-8 h10 z' }, g), { fill: 'var(--ink)' });
  text(g, 0, 24, '', { id: 'lbl2t', 'font-weight': 700, 'font-size': 14 });
  text(svg, 280, 124, '', { id: 'whole2t', 'font-weight': 700, 'font-size': 14 });
})();
const ASK2 = {
  part: 'Известны целое и процент. <b>Найти часть.</b>',
  whole: 'Известны часть и её процент. <b>Найти целое.</b>',
  pct: 'Известны часть и целое. <b>Найти, какой это процент.</b>',
};
function render2() {
  const W = w2(), p = q2(), P = W * p / 100;
  $('w2v').textContent = num(W); $('q2v').textContent = p + '%';
  $('p2Ask').innerHTML = ASK2[mode2];
  const A = s => `<span style="color:var(--a)">${s}</span>`;
  let f, chips;
  if (mode2 === 'part') {
    f = `${p}% от ${num(W)} = ${num(W)} · ${fmt(p / 100, 2)} = ${A(fmt(P, 2))}`;
    chips = [`1% = ${num(W)} : 100 = ${fmt(W / 100, 2)}`, `${p}% = ${fmt(W / 100, 2)} · ${p} = ${fmt(P, 2)}`];
  } else if (mode2 === 'whole') {
    f = `${fmt(P, 2)} : ${fmt(p / 100, 2)} = ${A(num(W))}`;
    chips = [`${p}% — это ${fmt(P, 2)}`, `1% = ${fmt(P, 2)} : ${p} = ${fmt(P / p, 3)}`, `100% = ${fmt(P / p, 3)} · 100 = ${num(W)}`];
  } else {
    f = `${fmt(P, 2)} : ${num(W)} · 100% = ${A(p + '%')}`;
    chips = [`${fmt(P, 2)} : ${num(W)} = ${fmt(P / W, 4)}`, `доля × 100 = проценты`];
  }
  $('p2Formula').innerHTML = `<span class="fade" style="display:inline-block">${f}</span>`;
  $('p2Info').innerHTML = chipsHTML(chips);
  $('bar2').style.transform = `scaleX(${p / 100})`;
  $('lbl2').style.transform = `translate(${X2(p)}px, 0)`;
  $('lbl2t').textContent = mode2 === 'part' ? `часть = ?` : mode2 === 'pct' ? `${fmt(P, 2)} — это ?%` : `${p}% = ${fmt(P, 2)}`;
  $('whole2t').textContent = mode2 === 'whole' ? 'целое (100%) = ?' : `целое (100%) = ${num(W)}`;
}
document.querySelectorAll('[data-m2]').forEach(b => b.onclick = () => {
  mode2 = b.dataset.m2;
  document.querySelectorAll('[data-m2]').forEach(x => x.classList.toggle('on', x === b));
  render2();
});

// ---------- 3. Повысили и понизили ----------
let order3 = 'up';
const s3 = bindRange('s3p', render3), r3 = bindRange('r3', render3);
const BASE3 = 240;
(function build3() {
  const svg = $('p3Svg');
  svg.setAttribute('viewBox', '0 0 560 270');
  style(el('line', { x1: 10, y1: BASE3, x2: 550, y2: BASE3 }, svg), { stroke: 'var(--ink)', strokeWidth: 2 });
  style(el('line', { id: 'ref3', x1: 10, y1: BASE3 - 100, x2: 550, y2: BASE3 - 100, 'stroke-dasharray': '6 5' }, svg), { stroke: 'var(--muted)' });
  ['var(--b)', 'var(--gold)', 'var(--a)'].forEach((color, i) => {
    const x = 40 + i * 180;
    const bar = el('rect', { id: 'bar3_' + i, x, y: BASE3 - 100, width: 120, height: 100, rx: 4 }, svg);
    style(bar, { fill: color, transformBox: 'fill-box', transformOrigin: 'bottom' }).classList.add('move');
    const g = el('g', { id: 'lbl3_' + i }, svg); g.classList.add('move');
    text(g, x + 60, -8, '', { id: 'val3_' + i, 'font-weight': 700, 'font-size': 15 });
    text(svg, x + 60, BASE3 + 20, '', { id: 'cap3_' + i, 'font-size': 13 }, 'var(--muted)');
  });
})();
function render3() {
  const S = s3(), p = r3(), up = 1 + p / 100, down = 1 - p / 100;
  $('s3v').textContent = num(S); $('r3v').textContent = p + '%';
  const k = order3 === 'up' ? [1, up, up * down] : [1, down, down * up];
  const caps = order3 === 'up' ? ['было', `+${p}%`, `затем −${p}%`] : ['было', `−${p}%`, `затем +${p}%`];
  k.forEach((v, i) => {
    $('bar3_' + i).style.transform = `scaleY(${v})`;
    $('lbl3_' + i).style.transform = `translate(0, ${BASE3 - 100 * v}px)`;
    $('val3_' + i).textContent = money(S * v);
    $('cap3_' + i).textContent = caps[i];
  });
  const mid = S * k[1];
  $('p3Info').innerHTML = chipsHTML([`× ${fmt(up, 2)} и × ${fmt(down, 2)}`, `${fmt(up, 2)} · ${fmt(down, 2)} = ${fmt(up * down, 4)}`,
    `итог: −${fmt(p * p / 100, 2)}% от начальной цены`]);
  $('p3Ans').innerHTML = `Второй процент считается <b>уже от другой суммы</b> — от ${money(mid)}, а не от ${money(S)}.
    Поэтому «+${p}%, потом −${p}%» дают <b>−${fmt(p * p / 100, 2)}%</b>. Порядок не важен: множители просто меняются местами.`;
}
document.querySelectorAll('[data-o3]').forEach(b => b.onclick = () => {
  order3 = b.dataset.o3;
  document.querySelectorAll('[data-o3]').forEach(x => x.classList.toggle('on', x === b));
  render3();
});

// ---------- 4. Проценты на проценты ----------
const r4 = bindRange('r4', render4), n4 = bindRange('n4', render4);
function render4() {
  const r = r4(), n = n4(), S = 100000;
  $('r4v').textContent = r + '%'; $('n4v').textContent = n;
  const simple = y => S * (1 + r * y / 100), comp = y => S * (1 + r / 100) ** y;
  const max = comp(n), W = 560, H = 230, bw = (W - 40) / (n + 1);
  const svg = $('p4Svg'); svg.innerHTML = '';
  svg.setAttribute('viewBox', `0 0 ${W} ${H + 30}`);
  const Y = v => (v / max) * (H - 20);
  for (let y = 0; y <= n; y++) {
    const x = 30 + y * bw, d = Math.min(y * 40, 1200) + 'ms';
    style(el('rect', { x: x + bw * .08, y: H - Y(comp(y)), width: bw * .4, height: Y(comp(y)), rx: 2 }, svg),
      { fill: 'var(--a)', animationDelay: d }).classList.add('grow');
    style(el('rect', { x: x + bw * .5, y: H - Y(simple(y)), width: bw * .4, height: Y(simple(y)), rx: 2 }, svg),
      { fill: 'var(--b)', animationDelay: d }).classList.add('grow');
    if (n <= 12 || y % 5 === 0) text(svg, x + bw / 2, H + 16, y, { 'font-size': 11 }, 'var(--muted)');
  }
  style(el('line', { x1: 20, y1: H, x2: W, y2: H }, svg), { stroke: 'var(--ink)' });
  text(svg, W - 10, H + 28, 'годы', { 'text-anchor': 'end', 'font-size': 11 }, 'var(--muted)');
  $('p4Info').innerHTML = chipsHTML([
    `простые: 100 000 + ${n} · ${num(S * r / 100)} = ${money(simple(n))}`,
    `сложные: 100 000 · ${fmt(1 + r / 100, 2)}<sup>${n}</sup> = ${money(comp(n))}`,
    `разница: ${money(comp(n) - simple(n))}`,
    `правило 72: деньги удвоятся примерно за 72 : ${r} ≈ ${fmt(72 / r, 1)} лет`]);
}

// ---------- 5. Процентные пункты ----------
const a5 = bindRange('a5', render5), b5 = bindRange('b5', render5);
(function build5() {
  const svg = $('p5Svg');
  svg.setAttribute('viewBox', '0 0 540 285');
  [0, 1].forEach(g => {
    for (let i = 0; i < 100; i++) {
      const c = el('rect', { id: `c5_${g}_${i}`, x: g * 290 + (i % 10) * 25, y: Math.floor(i / 10) * 25, width: 22, height: 22, rx: 4 }, svg);
      style(c, { fill: 'var(--empty)' }).classList.add('cell');
    }
    text(svg, g * 290 + 124, 274, g ? 'стало' : 'было', { 'font-weight': 700 });
  });
})();
function render5() {
  const a = a5(), b = b5(), d = b - a, rel = d / a * 100;
  $('a5v').textContent = a + '%'; $('b5v').textContent = b + '%';
  for (let i = 0; i < 100; i++) {
    style($('c5_0_' + i), { fill: i < a ? 'var(--b)' : 'var(--empty)', opacity: 1 });
    const cell = $('c5_1_' + i);
    if (i < Math.min(a, b)) style(cell, { fill: 'var(--b)', opacity: 1 });
    else if (i < b) style(cell, { fill: 'var(--gold)', opacity: 1 });
    else if (i < a) style(cell, { fill: 'var(--a)', opacity: .35 });
    else style(cell, { fill: 'var(--empty)', opacity: 1 });
  }
  const sign = x => (x > 0 ? '+' : x < 0 ? '−' : '') + fmt(Math.abs(x), 1);
  $('p5Formula').innerHTML = `<span class="fade" style="display:inline-block">${sign(d)} п. п.<br>
    <span style="color:var(--a)">${sign(rel)}%</span></span>`;
  $('p5Info').innerHTML = chipsHTML([
    `${b}% − ${a}% = ${sign(d)} процентных пункта`,
    `(${b} − ${a}) : ${a} · 100% = ${sign(rel)}%`,
    d > 0 ? `жёлтых клеток ${d} — это ${fmt(rel, 1)}% от ${a} синих` : d < 0 ? `потеряно ${-d} клеток из ${a}` : 'ничего не изменилось']);
}

// ---------- 6. Зачем нужны проценты ----------
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
let useTab = 'sale';
const USES = {
  sale: {
    controls: slider('dP', 'Цена, ₽', 500, 20000, 5000, 500) + slider('d1', 'Скидка в магазине, %', 5, 70, 20) +
              slider('d2', 'Ещё скидка по карте, %', 5, 70, 30),
    render() {
      const P = +$('dP').value, d1 = +$('d1').value, d2 = +$('d2').value;
      $('dPv').textContent = num(P); $('d1v').textContent = d1 + '%'; $('d2v').textContent = d2 + '%';
      const P1 = P * (1 - d1 / 100), P2 = P1 * (1 - d2 / 100), total = (1 - P2 / P) * 100, naive = d1 + d2;
      const X = v => (v / P) * 400;
      const rows = [[P, 'цена', 'var(--b)'], [P1, `−${d1}%`, 'var(--gold)'], [P2, `−${d2}% от ${money(P1)}`, 'var(--a)']];
      $('useOut').innerHTML = `
        <div class="mid">${money(P)} · ${fmt(1 - d1 / 100, 2)} · ${fmt(1 - d2 / 100, 2)} = <span style="color:var(--a)">${money(P2)}</span></div>
        <svg viewBox="0 0 560 170" style="margin-top:10px">
          ${rows.map(([v, cap, c], i) => `
            <rect class="growx" x="0" y="${i * 50}" width="${X(v)}" height="34" rx="5" style="fill:${c};animation-delay:${i * 450}ms"/>
            <text class="fade" x="${X(v) + 8}" y="${i * 50 + 22}" font-size="14" style="fill:var(--ink);animation-delay:${i * 450 + 300}ms"><tspan font-weight="700">${money(v)}</tspan> ${cap}</text>`).join('')}
          ${naive < 100 ? `<line class="fade" x1="${X(P * (1 - naive / 100))}" y1="90" x2="${X(P * (1 - naive / 100))}" y2="140" style="stroke:var(--ink);stroke-width:2;stroke-dasharray:4 4;animation-delay:1.2s"/>
            <text class="fade" x="${X(P * (1 - naive / 100))}" y="160" font-size="12" text-anchor="middle" style="fill:var(--muted);animation-delay:1.2s">если бы −${naive}%</text>` : ''}
        </svg>
        <div class="info">${chipsHTML([`итоговая скидка ${fmt(total, 1)}%, а не ${naive}%`, `вторая скидка считается от ${money(P1)}`,
          `формула: 1 − ${fmt(1 - d1 / 100, 2)} · ${fmt(1 - d2 / 100, 2)} = ${fmt(total / 100, 3)}`])}</div>
        <p class="answer">Скидки подряд <b>умножаются, а не складываются</b>: после первой скидки цена уже меньше, и вторая
        «откусывает» процент от меньшей суммы. Поэтому «−${d1}% и ещё −${d2}%» выгоднее для магазина, чем кажется покупателю.</p>`;
    },
  },
  vat: {
    controls: slider('vP', 'Цена в чеке (с налогом), ₽', 120, 12000, 1200, 60) +
      `<label class="r">Ставка налога<select id="vR" style="grid-column:1/-1">
         <option value="20">20%</option><option value="10">10%</option><option value="22">22%</option></select></label>`,
    render() {
      const P = +$('vP').value, r = +$('vR').value, tax = P * r / (100 + r), base = P - tax;
      $('vPv').textContent = num(P);
      const W = 520, xb = W * 100 / (100 + r);
      $('useOut').innerHTML = `
        <div class="mid">налог = ${num(P)} · ${r} : ${100 + r} = <span style="color:var(--a)">${money(tax)}</span></div>
        <svg viewBox="0 0 540 110" style="margin-top:10px">
          <rect class="growx" x="10" y="20" width="${xb}" height="40" rx="5" style="fill:var(--b)"/>
          <rect class="growx" x="${10 + xb}" y="20" width="${W - xb}" height="40" rx="5" style="fill:var(--a);animation-delay:.5s"/>
          <text class="fade" x="${10 + xb / 2}" y="46" text-anchor="middle" font-size="14" font-weight="700" style="fill:#fff">100% — ${money(base)}</text>
          <text class="fade" x="${10 + xb + (W - xb) / 2}" y="85" text-anchor="middle" font-size="13" font-weight="700" style="fill:var(--a);animation-delay:.8s">${r}%</text>
          <text x="${10 + W / 2}" y="105" text-anchor="middle" font-size="13" style="fill:var(--muted)">в чеке: ${100 + r}% = ${money(P)}</text>
        </svg>
        <div class="info">${chipsHTML([`без налога: ${money(base)}`, `проверка: ${money(base)} · ${fmt(1 + r / 100, 2)} = ${money(P)}`,
          `ошибка: ${num(P)} · ${r}% = ${money(P * r / 100)} — это не налог`])}</div>
        <p class="answer">Налог начисляют <b>на цену без налога</b>, поэтому цена в чеке — это ${100 + r}%, а не 100%.
        Чтобы найти налог, делим чек на ${100 + r} частей и берём ${r} из них.</p>`;
    },
  },
  funnel: {
    controls: slider('fV', 'Посетителей сайта', 1000, 100000, 10000, 1000) +
              slider('fC', 'Положили товар в корзину, %', 1, 60, 20) + slider('fB', 'Из корзины оплатили, %', 1, 100, 40),
    render() {
      const V = +$('fV').value, c = +$('fC').value, b = +$('fB').value, C = V * c / 100, B = C * b / 100, total = c * b / 100;
      $('fVv').textContent = num(V); $('fCv').textContent = c + '%'; $('fBv').textContent = b + '%';
      const W = 520, w = v => Math.max(4, W * v / V);
      const rows = [[V, 'зашли на сайт', 'var(--b)'], [C, `в корзине (${c}%)`, 'var(--gold)'], [B, `оплатили (${b}% от корзины)`, 'var(--c)']];
      $('useOut').innerHTML = `
        <div class="mid">${c}% · ${b}% = <span style="color:var(--a)">${fmt(total, 2)}%</span> посетителей покупают</div>
        <svg viewBox="0 0 540 170" style="margin-top:10px">
          ${rows.map(([v, cap, col], i) => `
            <rect class="pop" x="${10 + (W - w(v)) / 2}" y="${i * 56}" width="${w(v)}" height="36" rx="6" style="fill:${col};animation-delay:${i * 400}ms"/>
            <text class="fade" x="${10 + W / 2}" y="${i * 56 + 52}" text-anchor="middle" font-size="13" style="fill:var(--ink);animation-delay:${i * 400 + 200}ms"><tspan font-weight="700">${num(Math.round(v))}</tspan> — ${cap}</text>`).join('')}
        </svg>
        <div class="info">${chipsHTML([`конверсия = ${num(Math.round(B))} : ${num(V)} = ${fmt(total, 2)}%`,
          `+5 п. п. к корзине → ${num(Math.round(V * Math.min(c + 5, 100) / 100 * b / 100))} покупок вместо ${num(Math.round(B))}`])}</div>
        <p class="answer">Доли на каждом шаге <b>перемножаются</b>. Аналитик смотрит, на каком шаге теряется больше всего людей,
        и улучшает именно его. Конверсия — один из самых частых процентов в работе с данными.</p>`;
    },
  },
  spam: {
    controls: slider('sS', 'Спама среди 100 писем, %', 1, 50, 10) + slider('sR', 'Сколько спама ловит модель, %', 0, 100, 0) +
      `<div class="info"><span class="chip click" data-r="0">ленивая модель: 0%</span><span class="chip click" data-r="80">хорошая: 80%</span></div>`,
    render() {
      const s = +$('sS').value, r = +$('sR').value, caught = Math.round(s * r / 100), right = 100 - s + caught;
      $('sSv').textContent = s + '%'; $('sRv').textContent = r + '%';
      let cells = '';
      for (let i = 0; i < 100; i++) {
        const isSpam = i < s, ok = !isSpam || i < caught;
        const fill = !isSpam ? 'var(--empty)' : ok ? 'var(--c)' : 'var(--a)';
        cells += `<rect class="pop" x="${(i % 10) * 25}" y="${Math.floor(i / 10) * 25}" width="22" height="22" rx="4" style="fill:${fill};animation-delay:${Math.min(i * 8, 800)}ms"/>`;
        if (isSpam) cells += `<text x="${(i % 10) * 25 + 11}" y="${Math.floor(i / 10) * 25 + 16}" text-anchor="middle" font-size="12" style="fill:#fff">${ok ? '✓' : '✗'}</text>`;
      }
      $('useOut').innerHTML = `
        <div class="mid">точность = ${right} : 100 = <span style="color:var(--a)">${right}%</span></div>
        <svg viewBox="0 0 250 250" style="max-width:260px;margin:10px auto">${cells}</svg>
        <div class="info">${chipsHTML([`поймано ${caught} из ${s} спам-писем`, `пропущено ${s - caught}`, `обычные письма модель не трогает — они верны`])}</div>
        <p class="answer">Модель, которая <b>вообще не ищет спам</b>, всё равно верна в ${100 - s}% случаев: обычных писем большинство.
        Поэтому одного общего процента мало — смотрят ещё долю пойманного спама. Подробнее — в теме про метрики.</p>`;
      $('useCtl').querySelectorAll('[data-r]').forEach(c => c.onclick = () => { $('sR').value = c.dataset.r; USES.spam.render(); });
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
// число, у которого p% — целое: кратно 100 / НОД(p, 100)
const wholeFor = (p, maxK) => (100 / gcd(p, 100)) * rnd(1, maxK);
function newQuiz() {
  const type = rnd(0, 6);
  if (type === 0) {
    const p = pick([5, 10, 15, 20, 25, 30, 50, 75]), N = wholeFor(p, 20);
    q = { text: `${p}% от ${num(N)} = ?`, ans: N * p / 100, hint: `1% от ${num(N)} = ${fmt(N / 100)}, а ${p}% — в ${p} раз больше.` };
  } else if (type === 1) {
    const p = pick([5, 10, 20, 25, 40, 50]), W = wholeFor(p, 15), P = W * p / 100;
    q = { text: `${p}% числа — это ${num(P)}. Чему равно число?`, ans: W, hint: `1% = ${num(P)} : ${p} = ${fmt(P / p)}, а 100% — в 100 раз больше.` };
  } else if (type === 2) {
    const p = pick([10, 20, 25, 40, 50, 60, 75, 80]), b = wholeFor(p, 10), a = b * p / 100;
    q = { text: `${a} от ${b} — это сколько процентов?`, ans: p, hint: `${a} : ${b} = ${fmt(a / b, 2)}. Умножьте на 100.` };
  } else if (type === 3) {
    const N = rnd(5, 60) * 100, p = pick([5, 10, 15, 20, 25, 30, 50]), up = Math.random() < .5;
    q = up
      ? { text: story(`📈 Товар стоил ${num(N)} ₽ и подорожал на ${p}%. Сколько он стоит теперь (₽)?`), ans: N * (100 + p) / 100,
          hint: `Новая цена — это ${100 + p}% от старой: ${num(N)} · ${fmt(1 + p / 100, 2)}.` }
      : { text: story(`🛒 Куртка стоит ${num(N)} ₽, скидка ${p}%. Сколько нужно заплатить (₽)?`), ans: N * (100 - p) / 100,
          hint: `Платим ${100 - p}% цены: ${num(N)} · ${fmt(1 - p / 100, 2)}.` };
  } else if (type === 4) {
    const [a, b] = pick([[10, 15], [20, 25], [4, 6], [5, 8], [10, 12], [20, 30], [8, 10], [25, 20], [10, 8]]), rel = (b - a) / a * 100;
    q = { text: story(`🏦 Ставка была ${a}%, стала ${b}%. На сколько процентов (не пунктов!) она изменилась? Падение — со знаком минус.`), ans: rel,
          hint: `Изменение — ${b - a} п. п. Делим на старое значение: ${b - a} : ${a} · 100%.` };
  } else if (type === 5) {
    const V = pick([200, 400, 500, 1000, 2000, 2500]), p = pick([1, 2, 4, 5, 10, 20]), k = V * p / 100;
    q = { text: story(`📈 Сайт посетили ${num(V)} человек, купили ${k}. Какая конверсия (%)?`), ans: p, hint: `${k} : ${num(V)} · 100%.` };
  } else {
    const base = rnd(1, 40) * 50, price = base * 1.2, tax = base * 0.2;
    q = { text: story(`🧾 Цена с налогом 20% — ${num(price)} ₽. Сколько в ней налога (₽)?`), ans: tax,
          hint: `Цена в чеке — это 120%. Налог = ${num(price)} · 20 : 120.` };
  }
  $('qTask').innerHTML = `<span class="fade" style="display:inline-block">${q.text}</span>`;
  $('qIn').value = ''; $('qMsg').textContent = '';
}
function check() {
  const raw = $('qIn').value.replace(/[\s%₽]/g, '').replace(',', '.').replace('−', '-');
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
