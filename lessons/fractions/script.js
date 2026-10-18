const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a / gcd(a, b)) * b;
const frac = (n, d, color) =>
  `<span class="frac"${color ? ` style="color:${color}"` : ''}><span>${n}</span><span>${d}</span></span>`;

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// parts: [{n, color}] — подряд закрашенные куски разных цветов
function colorAt(parts, i) {
  let acc = 0;
  for (const p of parts) { acc += p.n; if (i < acc) return p.color; }
  return null;
}
const total = parts => parts.reduce((s, p) => s + p.n, 0);

function drawPies(svg, den, parts) {
  svg.innerHTML = '';
  const S = 140, R = 62;
  const count = Math.max(1, Math.ceil(total(parts) / den));
  const cols = Math.min(count, 4), rows = Math.ceil(count / cols);
  svg.setAttribute('viewBox', `0 0 ${cols * S} ${rows * S}`);
  svg.style.maxWidth = cols * 190 + 'px';
  for (let p = 0; p < count; p++) {
    const cx = (p % cols) * S + S / 2, cy = Math.floor(p / cols) * S + S / 2;
    for (let i = 0; i < den; i++) {
      const idx = p * den + i, color = colorAt(parts, idx);
      let shape;
      if (den === 1) {
        shape = el('circle', { cx, cy, r: R }, svg);
      } else {
        const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / den, a1 = a0 + (2 * Math.PI) / den;
        const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
        const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
        shape = el('path', { d: `M${cx},${cy} L${x0},${y0} A${R},${R} 0 ${den === 2 ? 0 : 0} 1 ${x1},${y1} Z` }, svg);
      }
      shape.style.fill = color || 'var(--empty)';
      shape.style.stroke = 'var(--card)';
      shape.style.strokeWidth = 2.5;
      if (color) { shape.classList.add('pop'); shape.style.animationDelay = idx * 70 + 'ms'; }
    }
  }
}

function drawBars(svg, den, parts, opts = {}) {
  svg.innerHTML = '';
  const W = 600, H = opts.h || 48, G = 10;
  const rows = Math.max(1, Math.ceil(total(parts) / den));
  svg.setAttribute('viewBox', `0 0 ${W} ${rows * (H + G) - G}`);
  const cw = W / den;
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < den; i++) {
      const idx = r * den + i, color = colorAt(parts, idx);
      const rect = el('rect', { x: i * cw, y: r * (H + G), width: cw, height: H }, svg);
      rect.style.fill = color || 'var(--empty)';
      rect.style.stroke = 'var(--card)';
      rect.style.strokeWidth = den > 30 ? 1 : 2.5;
      if (color) { rect.classList.add('pop'); rect.style.animationDelay = Math.min(idx * 45, 1500) + 'ms'; }
    }
    const outline = el('rect', { x: 0, y: r * (H + G), width: W, height: H, rx: 4, fill: 'none' }, svg);
    outline.style.stroke = 'var(--line)';
  }
}

function bindRange(id, onChange) {
  const input = $(id), out = $(id + 'v');
  const update = () => { if (out) out.textContent = input.value; onChange(); };
  input.addEventListener('input', update);
  return () => +input.value;
}
const fmt = x => +x.toFixed(3) + '';

// ---------- 1. Часть целого ----------
let view1 = 'pie';
const n1 = bindRange('n1', render1), d1 = bindRange('d1', render1);
document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
  view1 = b.dataset.view;
  document.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('on', x === b));
  render1();
}));
function render1() {
  const n = n1(), d = d1();
  $('n1v').textContent = n; $('d1v').textContent = d;
  $('f1Label').innerHTML = frac(n, d, 'var(--a)');
  const parts = [{ n, color: 'var(--a)' }];
  view1 === 'pie' ? drawPies($('f1Svg'), d, parts) : drawBars($('f1Svg'), d, parts, { h: 70 });
  const g = gcd(n, d), chips = [];
  chips.push(n < d ? 'правильная дробь (меньше 1)' : n === d ? 'равна целому: 1' : 'неправильная дробь (больше 1)');
  chips.push('десятичная: ' + fmt(n / d));
  chips.push('проценты: ' + fmt((n / d) * 100) + '%');
  if (n > d && n % d) chips.push(`смешанное число: ${Math.floor(n / d)} целых и ${n % d}/${d}`);
  if (n && g > 1) chips.push(`сокращается: ${n / g}/${d / g}`);
  $('f1Info').innerHTML = chips.map(c => `<span class="chip fade">${c}</span>`).join('');
}

// ---------- 2. Числовая прямая ----------
const n2 = bindRange('n2', render2), d2 = bindRange('d2', render2);
let jumpTimers = [];
function render2(jumping) {
  jumpTimers.forEach(clearTimeout); jumpTimers = [];
  const n = n2(), d = d2();
  $('n2v').textContent = n; $('d2v').textContent = d;
  $('f2Label').innerHTML = frac(n, d, 'var(--b)');
  const range = Math.max(1, Math.ceil(n / d));
  const svg = $('nlSvg'); svg.innerHTML = '';
  const X0 = 30, X1 = 590, Y = 110;
  svg.setAttribute('viewBox', '0 0 620 160');
  const px = v => X0 + ((X1 - X0) * v) / range;
  const axis = el('line', { x1: X0 - 10, y1: Y, x2: X1 + 15, y2: Y }, svg);
  axis.style.stroke = 'var(--ink)'; axis.style.strokeWidth = 2;
  for (let i = 0; i <= range * d; i++) {
    const whole = i % d === 0, x = px(i / d);
    const t = el('line', { x1: x, y1: Y - (whole ? 12 : 7), x2: x, y2: Y + (whole ? 12 : 7) }, svg);
    t.style.stroke = 'var(--ink)'; t.style.strokeWidth = whole ? 2.5 : 1.5;
    if (whole) {
      const txt = el('text', { x, y: Y + 36, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700 }, svg);
      txt.textContent = i / d; txt.style.fill = 'var(--ink)';
    }
  }
  const marker = el('g', { id: 'nlMarker' }, svg);
  const dot = el('circle', { cx: 0, cy: Y, r: 9 }, marker); dot.style.fill = 'var(--b)';
  const tip = el('text', { x: 0, y: Y - 22, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 700 }, marker);
  tip.style.fill = 'var(--b)';
  const place = k => {
    marker.setAttribute('transform', `translate(${px(k / d)},0)`);
    tip.textContent = k === 0 ? '0' : `${k}/${d}`;
  };
  if (!jumping) { place(n); return; }
  place(0);
  for (let k = 0; k < n; k++) {
    jumpTimers.push(setTimeout(() => {
      const xa = px(k / d), xb = px((k + 1) / d), h = Math.min(60, (xb - xa) * 0.7 + 14);
      const arc = el('path', { d: `M${xa},${Y - 4} Q${(xa + xb) / 2},${Y - h * 1.6} ${xb},${Y - 4}`, pathLength: 1, fill: 'none' }, svg);
      arc.style.stroke = 'var(--b)'; arc.style.strokeWidth = 2.5; arc.classList.add('draw');
      svg.appendChild(marker);
      place(k + 1);
    }, 300 + k * 480));
  }
}
$('jump').addEventListener('click', () => render2(true));

// ---------- 3. Равные дроби ----------
const n3 = bindRange('n3', render3), d3 = bindRange('d3', render3), k3 = bindRange('k3', render3);
function render3() {
  const d = d3(); $('n3').max = d - 1;
  const n = Math.min(n3(), d - 1), k = k3();
  $('n3v').textContent = n; $('d3v').textContent = d; $('k3v').textContent = k;
  $('e3Top').innerHTML = frac(n, d, 'var(--c)');
  $('e3Bot').innerHTML = frac(n * k, d * k, 'var(--c)');
  drawBars($('e3TopSvg'), d, [{ n, color: 'var(--c)' }]);
  drawBars($('e3BotSvg'), d * k, [{ n: n * k, color: 'var(--c)' }]);
  const chain = [];
  for (let i = 1; i <= 6; i++)
    chain.push(`<span style="cursor:pointer;opacity:${i === k ? 1 : .45}" data-k="${i}">${frac(n * i, d * i)}</span>`);
  $('e3Chain').innerHTML = chain.join('<span style="align-self:center">=</span>');
  $('e3Chain').querySelectorAll('[data-k]').forEach(s =>
    s.addEventListener('click', () => { $('k3').value = s.dataset.k; render3(); }));
}
$('simplify').addEventListener('click', () => {
  const n = n3() * k3(), d = d3() * k3(), g = gcd(n, d);
  $('n3').value = n / g; $('d3').value = d / g; $('k3').value = 1; render3();
});

// ---------- 4. Сложение ----------
let step = 0;
const aN = bindRange('aN', resetAdd), aD = bindRange('aD', resetAdd);
const bN = bindRange('bN', resetAdd), bD = bindRange('bD', resetAdd);
function resetAdd() { step = 0; renderAdd(); }
function rowHTML(label) { return `<div class="row fade"><div class="lbl">${label}</div><svg></svg></div>`; }
function renderAdd() {
  $('aN').max = aD(); $('bN').max = bD();
  const a = Math.min(aN(), aD()), b = aD(), c = Math.min(bN(), bD()), d = bD();
  ['aN', 'aD', 'bN', 'bD'].forEach((id, i) => $(id + 'v').textContent = [a, b, c, d][i]);
  const L = lcm(b, d), a2 = a * L / b, c2 = c * L / d, s = a2 + c2, g = gcd(s, L);
  const A = 'var(--a)', B = 'var(--b)', C = 'var(--c)';
  $('addLabel').innerHTML = `${frac(a, b, A)} + ${frac(c, d, B)} = ?`;
  document.querySelectorAll('#addDots i').forEach((x, i) => x.classList.toggle('on', i <= step));
  $('addPrev').disabled = step === 0; $('addNext').disabled = step === 3;
  const stage = $('addStage');
  let text, rows;
  if (step === 0) {
    text = `Куски разного размера: ${frac(1, b)} и ${frac(1, d)}. Сложить их «как есть» нельзя.`;
    rows = [[frac(a, b, A), b, [{ n: a, color: A }]], [frac(c, d, B), d, [{ n: c, color: B }]]];
  } else if (step === 1) {
    text = `Общий знаменатель — НОК(${b}, ${d}) = ${L}. Режем оба целых на ${L} частей.`;
    rows = [[frac(a2, L, A), L, [{ n: a2, color: A }]], [frac(c2, L, B), L, [{ n: c2, color: B }]]];
  } else if (step === 2) {
    text = `Теперь куски одинаковые — складываем числители: ${a2} + ${c2} = ${s}.`;
    rows = [[frac(s, L), L, [{ n: a2, color: A }, { n: c2, color: B }]]];
  } else {
    const whole = Math.floor(s / L), rest = s % L;
    text = g > 1 ? `Сокращаем на ${g}: ${frac(s, L)} = ${frac(s / g, L / g, C)}` : `Дробь ${frac(s, L, C)} уже несократима.`;
    if (whole && rest) text += ` = ${whole} целых и ${frac(rest / g, L / g)}`;
    if (whole && !rest) text += ` = ${whole}`;
    rows = [[frac(s / g, L / g, C), L / g, [{ n: s / g, color: C }]]];
  }
  $('addText').innerHTML = `<span class="fade" style="display:inline-block">${text}</span>`;
  stage.innerHTML = rows.map(r => rowHTML(r[0])).join('');
  stage.querySelectorAll('svg').forEach((svg, i) => drawBars(svg, rows[i][1], rows[i][2]));
}
$('addPrev').addEventListener('click', () => { step = Math.max(0, step - 1); renderAdd(); });
$('addNext').addEventListener('click', () => { step = Math.min(3, step + 1); renderAdd(); });

// ---------- 5. Сравнение ----------
const cAn = bindRange('cAn', renderCmp), cAd = bindRange('cAd', renderCmp);
const cBn = bindRange('cBn', renderCmp), cBd = bindRange('cBd', renderCmp);
function renderCmp() {
  const a = cAn(), b = cAd(), c = cBn(), d = cBd();
  const max = Math.max(1, a / b, c / d);
  $('cA').innerHTML = frac(a, b, 'var(--a)');
  $('cB').innerHTML = frac(c, d, 'var(--b)');
  $('mA').style.width = (a / b / max) * 100 + '%';
  $('mB').style.width = (c / d / max) * 100 + '%';
  const ticks = (den) => `repeating-linear-gradient(90deg, transparent 0 calc(${100 / (den * max)}% - 2px), var(--card) calc(${100 / (den * max)}% - 2px) ${100 / (den * max)}%)`;
  $('mAt').style.background = ticks(b);
  $('mBt').style.background = ticks(d);
  const l = a * d, r = c * b, sign = l > r ? '>' : l < r ? '<' : '=';
  const s = $('cSign'); s.textContent = sign; s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop');
  $('cWhy').innerHTML = `Крест-накрест: ${a} · ${d} = <b>${l}</b> и ${c} · ${b} = <b>${r}</b>, значит ${a}/${b} ${sign} ${c}/${d}.`;
}

// ---------- 6. Зачем нужны дроби ----------
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
const chips = list => `<div class="info">${list.map(c => `<span class="chip fade">${c}</span>`).join('')}</div>`;
const money = x => Math.round(x).toLocaleString('ru-RU') + ' ₽';
// дробь n/d в виде смешанного числа после сокращения
function mixed(n, d, color) {
  const g = gcd(n, d); n /= g; d /= g;
  const w = Math.floor(n / d), r = n % d;
  if (!r) return `<b${color ? ` style="color:${color}"` : ''}>${w}</b>`;
  return (w ? `<b${color ? ` style="color:${color}"` : ''}>${w}</b>&thinsp;` : '') + frac(r, d, color);
}

let useTab = 'pizza';
const USES = {
  pizza: {
    controls: slider('zP', 'Сколько пицц', 1, 5, 3) + slider('zN', 'Сколько человек', 2, 12, 4),
    render() {
      const P = +$('zP').value, N = +$('zN').value;
      $('zPv').textContent = P; $('zNv').textContent = N;
      const S = 140, R = 62, cols = Math.min(P, 3), rows = Math.ceil(P / cols);
      let svg = '';
      for (let p = 0; p < P; p++) {
        const cx = (p % cols) * S + S / 2, cy = Math.floor(p / cols) * S + S / 2;
        for (let i = 0; i < N; i++) {
          const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / N, a1 = a0 + (2 * Math.PI) / N;
          const d = `M${cx},${cy} L${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} A${R},${R} 0 0 1 ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} Z`;
          svg += `<path class="pop" d="${d}" style="fill:hsl(${(i * 360) / N},65%,55%);stroke:var(--card);stroke-width:2.5;animation-delay:${(p * N + i) * 40}ms"/>`;
        }
      }
      $('useOut').innerHTML = `
        <div class="mid">${P} : ${N} = ${frac(P, N, 'var(--a)')} пиццы каждому</div>
        <svg viewBox="0 0 ${cols * S} ${rows * S}" style="max-width:${cols * 170}px;margin:10px auto">${svg}</svg>
        ${chips([`сокращённо: ${mixed(P, N)}`, `≈ ${fmt(P / N)} пиццы`, `один кусок = ${frac(1, N)} пиццы`])}
        <p class="answer">Каждую пиццу режем на ${N} кусков (цвет — это человек). Каждый берёт по куску из каждой пиццы:
        ${P} кусков по ${frac(1, N)} = ${frac(P, N)}. <b>Деление и дробь — одно и то же: a : b = a/b.</b></p>`;
    },
  },
  recipe: {
    controls: slider('rP', 'Порций (рецепт на 4)', 1, 12, 6),
    render() {
      const P = +$('rP').value;
      $('rPv').textContent = P;
      const items = [['🌾 Мука', 3, 2, 'стакана'], ['🥛 Молоко', 5, 4, 'стакана'], ['🍬 Сахар', 1, 4, 'стакана'],
                     ['🧈 Масло', 1, 2, 'ложки'], ['🥚 Яйца', 2, 1, 'шт.']];
      const rows = items.map(([name, n, d, unit], k) => {
        const an = n * P, ad = d * 4, amount = an / ad;
        let cups = '';
        for (let c = 0; c < Math.ceil(amount); c++) {
          const fill = Math.min(1, amount - c);
          cups += `<rect x="${c * 30 + 1}" y="1" width="24" height="36" rx="4" style="fill:var(--empty);stroke:var(--line)"/>` +
            `<rect class="grow" x="${c * 30 + 1}" y="${1 + 36 * (1 - fill)}" width="24" height="${36 * fill}" rx="4" style="fill:var(--b);animation-delay:${k * 120 + c * 60}ms"/>`;
        }
        return `<div class="ing fade"><span>${name}</span><span class="amt">${mixed(an, ad)} <small style="font-size:12px;font-weight:400">${unit}</small></span>
          <svg viewBox="0 0 ${Math.ceil(amount) * 30} 38" style="width:${Math.ceil(amount) * 30}px">${cups}</svg></div>`;
      }).join('');
      $('useOut').innerHTML = `
        <div class="mid">все количества × ${frac(P, 4, 'var(--a)')}${gcd(P, 4) > 1 ? ' = ' + mixed(P, 4, 'var(--a)') : ''}</div>
        <div style="margin-top:8px">${rows}</div>
        <p class="answer">Рецепт написан на 4 порции, а нужно на ${P}. Значит, каждое количество умножаем на ${frac(P, 4)}.
        Например, мука: ${frac(3, 2)} · ${frac(P, 4)} = ${frac(3 * P, 8)}${gcd(3 * P, 8) > 1 || 3 * P > 8 ? ' = ' + mixed(3 * P, 8) : ''} стакана.
        ${(2 * P) % 4 ? '<b>Пол-яйца не бывает — округлите 🙂</b>' : ''}</p>`;
    },
  },
  sale: {
    controls: slider('sPr', 'Цена, ₽', 100, 10000, 2000, 100) +
      `<label class="r">Скидка<select id="sD" style="grid-column:1/-1">
        <option value="1/10">10% = 1/10</option><option value="1/5">20% = 1/5</option>
        <option value="1/4" selected>25% = 1/4</option><option value="1/3">≈33% = 1/3</option>
        <option value="1/2">50% = 1/2</option><option value="3/4">75% = 3/4</option>
      </select></label>`,
    render() {
      const price = +$('sPr').value, [n, d] = $('sD').value.split('/').map(Number);
      $('sPrv').textContent = money(price);
      $('useOut').innerHTML = `
        <div class="mid">скидка ${frac(n, d, 'var(--a)')} цены → платим ${frac(d - n, d, 'var(--c)')}</div>
        <svg id="saleSvg" style="margin:12px 0"></svg>
        ${chips([`скидка: ${money(price)} · ${n}/${d} = ${money((price * n) / d)}`, `к оплате: ${money(price)} · ${d - n}/${d} = ${money((price * (d - n)) / d)}`])}
        <p class="answer">Цену делим на ${d} равных частей: <b>${n}</b> ${n === 1 ? 'часть' : 'части'} — скидка, ${d - n} — платим.
        Процент — это дробь со знаменателем 100: ${Math.round((100 * n) / d)}% ≈ ${Math.round((100 * n) / d)}/100${d === 3 ? ' (1/3 точнее, чем 33%)' : ' = ' + n + '/' + d}.</p>`;
      drawBars($('saleSvg'), d, [{ n: d - n, color: 'var(--c)' }, { n, color: 'var(--a)' }], { h: 60 });
    },
  },
  clock: {
    controls: slider('cM', 'Минут', 5, 60, 15, 5),
    render() {
      const m = +$('cM').value;
      $('cMv').textContent = m;
      const C = 100, R = 80, a1 = -Math.PI / 2 + (m / 60) * 2 * Math.PI;
      const sector = m === 60
        ? `<circle class="pop" cx="${C}" cy="${C}" r="${R}" style="fill:var(--gold);opacity:.7"/>`
        : `<path class="pop" d="M${C},${C} L${C},${C - R} A${R},${R} 0 ${m > 30 ? 1 : 0} 1 ${C + R * Math.cos(a1)},${C + R * Math.sin(a1)} Z" style="fill:var(--gold);opacity:.7"/>`;
      let ticks = '';
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ticks += `<line x1="${C + 72 * Math.sin(a)}" y1="${C - 72 * Math.cos(a)}" x2="${C + 80 * Math.sin(a)}" y2="${C - 80 * Math.cos(a)}" style="stroke:var(--ink);stroke-width:${i % 3 ? 1.5 : 3}"/>`;
      }
      const names = { 15: 'четверть часа', 20: 'треть часа', 30: 'полчаса', 40: 'две трети часа', 45: 'три четверти часа', 60: 'целый час' };
      const last = this.last ?? m;
      $('useOut').innerHTML = `
        <div class="mid">${m} мин = ${frac(m, 60)} часа${gcd(m, 60) > 1 ? ' = ' + mixed(m, 60, 'var(--a)') : ''}</div>
        <svg viewBox="0 0 200 200" style="max-width:220px;margin:12px auto">
          <circle cx="${C}" cy="${C}" r="${R}" style="fill:var(--bg);stroke:var(--ink);stroke-width:3"/>
          ${sector}${ticks}
          <g class="hand" id="clockHand" style="transform-origin:${C}px ${C}px;transform:rotate(${last * 6}deg)">
            <line x1="${C}" y1="${C}" x2="${C}" y2="${C - 66}" style="stroke:var(--a);stroke-width:4;stroke-linecap:round"/></g>
          <circle cx="${C}" cy="${C}" r="5" style="fill:var(--ink)"/>
        </svg>
        ${chips([names[m] || `${m} из 60 минут`, `≈ ${fmt(m / 60)} ч`])}
        <p class="answer">В часе 60 минут, поэтому <b>m минут = m/60 часа</b>. Так решают задачи на скорость:
        за ${m} мин при скорости 60 км/ч машина проедет 60 · ${frac(m, 60)} = ${m} км.</p>`;
      requestAnimationFrame(() => requestAnimationFrame(() => { $('clockHand').style.transform = `rotate(${m * 6}deg)`; }));
      this.last = m;
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
function newQuiz() {
  const story = Math.random() < 0.35;
  $('qSvg').style.display = story ? 'none' : '';
  $('qText').style.display = story ? '' : 'none';
  if (story) {
    const kind = rnd(0, 2);
    if (kind === 0) {
      const P = rnd(1, 4), N = rnd(P + 1, 9);
      q = { n: P, d: N, text: `🍕 ${P} ${P === 1 ? 'пиццу' : 'пиццы'} разделили поровну на ${N} человек. Какую часть пиццы получит каждый?`,
            hint: `Деление — это дробь: ${P} : ${N} = ${P}/${N}.` };
    } else if (kind === 1) {
      const m = pick([10, 15, 20, 30, 40, 45, 50]);
      q = { n: m, d: 60, text: `⏱️ Какую часть часа составляют ${m} минут?`, hint: `В часе 60 минут: ${m}/60, можно сократить.` };
    } else {
      const p = pick([10, 20, 25, 50, 75]);
      q = { n: p, d: 100, text: `🏷️ Скидка ${p}%. Какую часть цены вам не придётся платить?`, hint: `${p}% = ${p}/100, можно сократить.` };
    }
    $('qText').innerHTML = `<span class="fade" style="display:inline-block">${q.text}</span>`;
  } else {
    const d = rnd(2, 10);
    q = { n: rnd(1, d - 1), d, pie: Math.random() < 0.5 };
    q.pie ? drawPies($('qSvg'), q.d, [{ n: q.n, color: 'var(--gold)' }])
          : drawBars($('qSvg'), q.d, [{ n: q.n, color: 'var(--gold)' }], { h: 80 });
  }
  $('qN').value = ''; $('qD').value = ''; $('qMsg').textContent = '';
  $('qN').focus({ preventScroll: true });
}
function check() {
  const n = parseInt($('qN').value, 10), d = parseInt($('qD').value, 10), msg = $('qMsg');
  if (!d || isNaN(n)) { msg.className = 'bad'; msg.textContent = 'Введите числитель и знаменатель.'; return; }
  tries++;
  if (n * q.d === q.n * d) {
    score++;
    msg.className = 'ok fade';
    msg.innerHTML = n === q.n && d === q.d ? 'Верно! 🎉' : `Верно! ${n}/${d} = ${q.n}/${q.d} — это равные дроби.`;
    setTimeout(newQuiz, 1600);
  } else {
    msg.className = 'bad';
    msg.innerHTML = 'Не совсем. ' + (q.hint || 'Посчитайте все части (это знаменатель) и закрашенные (числитель).');
    const box = $('qBox'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
  $('qScore').textContent = `Счёт: ${score} из ${tries}`;
}
$('qCheck').addEventListener('click', check);
$('qNew').addEventListener('click', newQuiz);
[$('qN'), $('qD')].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') check(); }));

render1(); render2(); render3(); renderAdd(); renderCmp(); buildUse(); newQuiz();
$('qScore').textContent = 'Счёт: 0 из 0';
