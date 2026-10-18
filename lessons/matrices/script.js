const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const num = x => x.toLocaleString('ru-RU');
const fmt = (x, d = 3) => (+x.toFixed(d)).toLocaleString('ru-RU', { maximumFractionDigits: d });
const sfmt = (x, d = 2) => (x < 0 ? '−' : '') + fmt(Math.abs(x), d);
const chipsHTML = list => list.map(c => `<span class="chip fade">${c}</span>`).join('');
const sgn = n => (n < 0 ? '−' + num(-n) : num(n));
const par = n => (n < 0 ? `(${sgn(n)})` : num(n));
const range = n => Array.from({ length: n }, (_, i) => i);
const make = (m, n, f) => range(m).map(i => range(n).map(j => f(i, j)));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

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

// матрица как HTML-сетка; cls(i, j) — классы клетки, show(v, i, j) — содержимое, delay(i, j) — задержка «pop» в мс
function matHTML(M, { cls = () => '', show = v => sfmt(v, 1), small = false, heads = false, delay = null, click = false } = {}) {
  const n = M[0].length;
  let s = `<div class="mat${small ? ' small' : ''}" style="grid-template-columns:${heads ? 'auto ' : ''}repeat(${n}, auto)">`;
  if (heads) s += '<span></span>' + range(n).map(j => `<span class="mhead">${j + 1}</span>`).join('');
  M.forEach((row, i) => {
    if (heads) s += `<span class="mhead">${i + 1}</span>`;
    row.forEach((v, j) => {
      const d = delay ? ` style="animation-delay:${delay(i, j)}ms"` : '';
      s += `<span class="mc ${cls(i, j)}${delay ? ' pop' : ''}${click ? ' click' : ''}" data-i="${i}" data-j="${j}"${d}>${show(v, i, j)}</span>`;
    });
  });
  return s + '</div>';
}
// картинка-матрица яркостей 0…9 как сетка пикселей
const shade = v => `background:hsl(0 0% ${(v / 9) * 92 + 4}%);color:${v > 4 ? '#111' : '#eee'}`;
const pixHTML = M => M.map(row => row.map(v => `<span class="px" style="${shade(v)}">${v}</span>`).join('')).join('');
const IMGS = {
  smile: (i, j) => {
    const x = j - 5.5, y = i - 5.5, r = Math.hypot(x, y);
    if (r > 5.8) return 1;
    if ((Math.abs(x + 2) < 1 || Math.abs(x - 2) < 1) && y > -3.2 && y < -0.8) return 0;
    if (r > 2.2 && r < 3.6 && y > 0.9) return 0;
    return r > 4.9 ? 5 : 8;
  },
  heart: (i, j) => {
    const x = (j - 5.5) / 4.8, y = -(i - 6.2) / 4.8, v = (x * x + y * y - 1) ** 3 - x * x * y ** 3;
    return v <= 0 ? (v > -0.06 ? 5 : 8) : 1;
  },
  arrow: (i, j) => {
    const x = Math.abs(j - 5.5);
    return (i >= 1 && i < 6 && x <= i - 0.5) || (i >= 6 && i <= 10 && x <= 1.5) ? 8 : 1;
  },
};
const image = name => make(12, 12, IMGS[name]);

// ---------- 1. Что такое матрица ----------
const val1 = (i, j) => ((i * 7 + j * 13 + 5) % 19) + 1;
const m1 = bindRange('m1', render1), n1 = bindRange('n1', render1), i1 = bindRange('i1', render1), j1 = bindRange('j1', render1);
function render1() {
  const m = m1(), n = n1();
  $('i1').max = m; $('j1').max = n;
  const i = Math.min(i1(), m), j = Math.min(j1(), n), M = make(m, n, val1);
  $('i1').value = i; $('j1').value = j;
  $('m1v').textContent = m; $('n1v').textContent = n; $('i1v').textContent = i; $('j1v').textContent = j;
  $('f1').innerHTML = `${m} × ${n}<br><span style="font-size:30px">a<sub>${i}${j}</sub> = <span style="color:var(--a)">${M[i - 1][j - 1]}</span></span>`;
  $('mat1').innerHTML = matHTML(M, { heads: true, show: v => v,
    cls: (a, b) => (a === i - 1 && b === j - 1 ? 'hit' : a === i - 1 ? 'row-on' : b === j - 1 ? 'col-on' : '') });
  $('info1').innerHTML = chipsHTML([
    `${m} · ${n} = ${m * n} элементов`,
    `<span style="color:var(--b)">строка ${i}</span>: (${M[i - 1].join('; ')})`,
    `<span style="color:var(--gold)">столбец ${j}</span>: (${M.map(r => r[j - 1]).join('; ')})`,
    'в таблице данных строка — объект, столбец — признак',
    `в Python счёт с нуля: A[${i - 1}][${j - 1}]`]);
}

// ---------- 2. Сложение и вычитание ----------
const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = arr => arr[rnd(0, arr.length - 1)];
let A2, B2, op2 = null, wrong2 = false;
const fresh2 = () => { A2 = make(3, 3, () => rnd(0, 9)); B2 = make(3, 3, () => rnd(0, 9)); op2 = null; };
fresh2();
$('new2').onclick = () => { fresh2(); render2(); };
$('shape2').onclick = () => { wrong2 = !wrong2; op2 = null; render2(); };
document.querySelectorAll('[data-op2]').forEach(b => b.onclick = () => { op2 = b.dataset.op2; render2(); });
function render2() {
  const B = wrong2 ? B2.slice(0, 2) : B2;
  $('shape2').textContent = wrong2 ? 'B размера 3 × 3' : 'B размера 2 × 3';
  let res = '<span class="mat"><span class="mc" style="width:120px;height:120px;color:var(--muted)">?</span></span>', info = [];
  if (op2 && wrong2) {
    res = '<span class="err">✗ нельзя</span>';
    $('note2').innerHTML = '<span class="err">Размеры 3 × 3 и 2 × 3 разные — у третьей строки A нет пары.</span>';
    setTimeout(() => restart($('mat2'), 'shake'));
  } else if (op2) {
    const s = op2 === '+' ? 1 : -1, R = make(3, 3, (i, j) => A2[i][j] + s * B[i][j]);
    res = matHTML(R, { cls: () => 'res', delay: (i, j) => (i * 3 + j) * 90,
      show: (v, i, j) => `<small>${A2[i][j]}${op2}${B[i][j]}</small>${sgn(v)}` });
    info = [`r<sub>11</sub> = ${A2[0][0]} ${op2} ${B[0][0]} = ${sgn(R[0][0])}`, '9 элементов — 9 отдельных сложений', op2 === '+' ? 'A + B = B + A' : 'A − B ≠ B − A'];
    $('note2').textContent = 'Маленькие цифры сверху — что с чем сложили.';
  } else $('note2').textContent = 'Нажмите «A + B» или «A − B».';
  $('mat2').innerHTML = `${matHTML(A2, { show: v => v })}<span class="op">${op2 || '+'}</span>${matHTML(B, { show: v => v })}<span class="op">=</span>${res}`;
  $('info2').innerHTML = chipsHTML(info.length ? info : ['A — 3 × 3', `B — ${B.length} × 3`]);
}

// ---------- 3. Умножение на число: картинка ----------
let img3 = 'smile';
const k3 = bindRange('k3', render3), c3 = bindRange('c3', render3);
$('img3').addEventListener('input', () => { img3 = $('img3').value; build3(); });
function build3() {
  const A = image(img3);
  $('imgA').style.gridTemplateColumns = $('imgB').style.gridTemplateColumns = 'repeat(12, 1fr)';
  $('imgA').innerHTML = pixHTML(A);
  $('imgB').innerHTML = pixHTML(A);
  render3();
}
function render3() {
  const k = k3(), c = c3(), A = image(img3), cells = $('imgB').children;
  $('k3v').textContent = fmt(k, 2); $('c3v').textContent = sgn(c);
  let cut = 0;
  A.flat().forEach((v, idx) => {
    const raw = Math.round(k * v + c), r = clamp(raw, 0, 9);
    if (raw !== r) cut++;
    cells[idx].setAttribute('style', shade(r));
    cells[idx].textContent = r;
  });
  $('capB').textContent = `${fmt(k, 2)}·A ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
  $('f3').innerHTML = `b<sub>ij</sub> = ${fmt(k, 2)} · a<sub>ij</sub> ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
  $('info3').innerHTML = chipsHTML([
    `пиксель 8 → ${fmt(k, 2)}·8 ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${fmt(k * 8 + c, 2)}${k * 8 + c > 9 || k * 8 + c < 0 ? ` → ${clamp(Math.round(k * 8 + c), 0, 9)}` : ''}`,
    k < 1 ? 'k < 1 — темнее' : k > 1 ? 'k > 1 — ярче и контрастнее' : 'k = 1 — без изменений',
    cut ? `${cut} пикс. вышли за 0…9 и обрезаны` : 'все значения в пределах 0…9',
    '144 числа изменились одной операцией']);
}

// ---------- 4. Транспонирование ----------
let t4 = false;
const m4 = bindRange('m4', () => { t4 = false; build4(); }), n4 = bindRange('n4', () => { t4 = false; build4(); });
$('go4').onclick = () => { t4 = !t4; place4(); };
function build4() {
  const m = m4(), n = n4(), size = Math.max(m, n) * 50, box = $('box4');
  $('m4v').textContent = m; $('n4v').textContent = n;
  style(box, { width: size + 'px', height: size + 'px' });
  box.innerHTML = '';
  range(m).forEach(i => range(n).forEach(j => {
    const c = document.createElement('span');
    c.className = 'tcell';
    c.textContent = i * n + j + 1;
    style(c, { background: `hsl(${i * 67 + 10} 65% 48%)`, outline: i === j ? '3px solid var(--ink)' : 'none', transitionDelay: (i + j) * 60 + 'ms' });
    c.dataset.i = i; c.dataset.j = j;
    box.appendChild(c);
  }));
  place4();
}
function place4() {
  const m = m4(), n = n4();
  $('box4').querySelectorAll('.tcell').forEach(c => {
    const i = +c.dataset.i, j = +c.dataset.j, [r, k] = t4 ? [j, i] : [i, j];
    c.style.transform = `translate(${k * 50}px, ${r * 50}px)`;
  });
  $('go4').textContent = t4 ? '↺ Обратно' : 'Транспонировать ▶';
  $('f4').innerHTML = t4 ? `Aᵀ: ${n} × ${m}` : `A: ${m} × ${n}`;
  $('info4').innerHTML = chipsHTML([
    'цвет — номер строки в исходной A',
    t4 ? 'каждая строка A стала столбцом Aᵀ' : 'нажмите «Транспонировать»',
    n > 1 && m > 0 ? `элемент «2» из (1; 2) переезжает в (2; 1)` : 'один столбец станет одной строкой',
    'клетки в рамке (главная диагональ) остаются на месте', '(Aᵀ)ᵀ = A']);
}

// ---------- 5. Суммы и средние ----------
const STORES = ['Центр', 'Север', 'Юг'], MONTHS = ['янв', 'фев', 'мар', 'апр'];
let S5 = make(3, 4, () => rnd(2, 9) * 10), agg5 = 'rows';
$('new5').onclick = () => { S5 = make(3, 4, () => rnd(2, 9) * 10); render5(); };
document.querySelectorAll('[data-agg]').forEach(b => b.onclick = () => {
  agg5 = b.dataset.agg;
  document.querySelectorAll('[data-agg]').forEach(x => x.classList.toggle('on', x === b));
  render5();
});
function render5() {
  const rs = S5.map(r => r.reduce((a, b) => a + b, 0)), cs = range(4).map(j => S5.reduce((a, r) => a + r[j], 0)), total = rs.reduce((a, b) => a + b, 0);
  const extraCol = agg5 === 'rows', extraRow = agg5 === 'cols' || agg5 === 'mean';
  let s = `<div class="mat" style="grid-template-columns:auto repeat(4, auto)${extraCol ? ' auto' : ''}"><span></span>`;
  s += MONTHS.map(mn => `<span class="mhead">${mn}</span>`).join('') + (extraCol ? '<span class="mhead">Σ</span>' : '');
  S5.forEach((row, i) => {
    s += `<span class="mhead">${STORES[i]}</span>` + row.map(v => `<span class="mc${agg5 === 'all' ? ' row-on' : ''}">${v}</span>`).join('');
    if (extraCol) s += `<span class="mc res pop" style="animation-delay:${i * 150}ms">${rs[i]}</span>`;
  });
  if (extraRow) {
    s += `<span class="mhead">${agg5 === 'mean' ? 'ср.' : 'Σ'}</span>` +
      cs.map((v, j) => `<span class="mc res pop" style="animation-delay:${j * 150}ms">${agg5 === 'mean' ? fmt(v / 3, 1) : v}</span>`).join('');
  }
  $('mat5').innerHTML = s + '</div>';
  const best = (arr, names) => names[arr.indexOf(Math.max(...arr))];
  const np = { rows: `A.sum(axis=1) → [${rs.join(', ')}]`, cols: `A.sum(axis=0) → [${cs.join(', ')}]`,
    mean: `A.mean(axis=0) → [${cs.map(v => fmt(v / 3, 1).replace(',', '.')).join(', ')}]`, all: `A.sum() → ${total}` }[agg5];
  $('f5').innerHTML = `<span style="color:var(--muted)">в NumPy:</span><br><code>${np}</code>`;
  $('info5').innerHTML = chipsHTML({
    rows: [`лучший магазин — ${best(rs, STORES)}`, 'строку сворачиваем в одно число: 3 × 4 → 3 числа'],
    cols: [`лучший месяц — ${best(cs, MONTHS)}`, 'столбец сворачиваем в одно число: 3 × 4 → 4 числа'],
    mean: ['среднее = сумма столбца : 3 магазина', '«типичный магазин» по месяцам'],
    all: [`все продажи: ${total}`, `в среднем на клетку: ${fmt(total / 12, 1)}`],
  }[agg5]);
}

// ---------- 6. Зачем нужны матрицы ----------
const slider = (id, label, min, max, val, step = 1) =>
  `<label class="r">${label} <b id="${id}v"></b><input type="range" id="${id}" min="${min}" max="${max}" value="${val}" step="${step}"></label>`;
let useTab = 'photo';
const FILTERS = {
  invert: { name: 'Негатив: 9 − A', f: (A, i, j) => 9 - A[i][j] },
  bright: { name: 'Ярче: A + 3', f: (A, i, j) => A[i][j] + 3 },
  contrast: { name: 'Контраст: 2·(A − 4,5) + 4,5', f: (A, i, j) => 2 * (A[i][j] - 4.5) + 4.5 },
  flip: { name: 'Отражение: Aᵀ', f: (A, i, j) => A[j][i] },
  mirror: { name: 'Вверх ногами: строки наоборот', f: (A, i, j) => A[11 - i][j] },
};
const NAMES = ['Аня', 'Борис', 'Вика', 'Гоша', 'Даша'];
const SHIPS = [[0, 1], [0, 2], [0, 3], [2, 5], [3, 5], [4, 0], [5, 3], [5, 4], [2, 1]];
const USES = {
  photo: {
    controls: `<label class="r">Картинка<select id="phI" style="grid-column:1/-1"><option value="smile">🙂 Смайлик</option><option value="heart">❤️ Сердце</option><option value="arrow">⬆️ Стрелка</option></select></label>
      <label class="r">Фильтр<select id="phF" style="grid-column:1/-1">${Object.entries(FILTERS).map(([k, f]) => `<option value="${k}">${f.name}</option>`).join('')}</select></label>`,
    render() {
      const A = image($('phI').value), F = FILTERS[$('phF').value], R = make(12, 12, (i, j) => clamp(Math.round(F.f(A, i, j)), 0, 9));
      $('useOut').innerHTML = `
        <div class="mid">${F.name}</div>
        <div class="two" style="margin-top:10px"><div class="pix" style="grid-template-columns:repeat(12,1fr)">${pixHTML(A)}</div>
          <div class="pix fade" style="grid-template-columns:repeat(12,1fr)">${pixHTML(R)}</div></div>
        <div class="info">${chipsHTML(['слева — исходная матрица, справа — результат', 'одна формула применяется ко всем 144 пикселям', 'числа за пределами 0…9 обрезаются'])}</div>
        <p class="answer">Фоторедактор не «рисует» — он <b>считает</b>. Яркость — прибавить число, контраст — умножить на число,
        негатив — вычесть из максимума, поворот и отражение — переставить элементы матрицы. Настоящее фото — это матрица 4000 × 3000, и не одна, а три: R, G и B.</p>`;
    },
  },
  stock: {
    controls: `<div class="btns"><button class="primary" id="stD">+ привезли ▶</button><button class="primary" id="stP">− продали ▶</button><button id="stR">Сначала</button></div>
      <p class="lead" style="margin:0">Строки — магазины, столбцы — товары: 🍎 🥛 🍞 🧃</p>`,
    step: 0,
    render() {
      const u = USES.stock, S = [[12, 5, 20, 8], [3, 14, 6, 10], [9, 0, 15, 4]], D = [[10, 10, 0, 5], [20, 0, 10, 0], [0, 15, 5, 10]], P = [[18, 12, 15, 9], [15, 11, 18, 6], [7, 16, 22, 13]];
      const cur = make(3, 4, (i, j) => S[i][j] + (u.step >= 1 ? D[i][j] : 0) - (u.step >= 2 ? P[i][j] : 0));
      const shown = u.step === 0 ? '' : `<span class="op">+</span>${matHTML(D, { show: v => v, small: true })}` + (u.step === 2 ? `<span class="op">−</span>${matHTML(P, { show: v => v, small: true })}` : '');
      const neg = [];
      cur.forEach((r, i) => r.forEach((v, j) => { if (v < 0) neg.push(`магазин ${i + 1}, ${'🍎🥛🍞🧃'.slice(j * 2, j * 2 + 2)}: ${sgn(v)}`); }));
      $('useOut').innerHTML = `
        <div class="mid">${['остатки S', 'S + привезли', 'S + привезли − продали'][u.step]}</div>
        <div class="mrow" style="margin-top:8px">${matHTML(S, { show: v => v, small: true })}${shown}<span class="op">=</span>
          ${matHTML(cur, { delay: (i, j) => (i * 4 + j) * 50, cls: (i, j) => (cur[i][j] < 0 ? 'bad' : cur[i][j] < 3 ? 'col-on' : 'good') })}</div>
        <div class="info">${chipsHTML([...neg.map(t => `⚠️ не хватило: ${t}`), neg.length ? '' : '✅ всего хватает',
          `итого по магазинам: ${cur.map(r => r.reduce((a, b) => a + b, 0)).join(', ')}`].filter(Boolean))}</div>
        <p class="answer">Остаток = <b>было + привезли − продали</b> — и это одна формула для всех магазинов и товаров сразу.
        Красные клетки — где товара не хватило: туда и надо везти. Так считают склады больших сетей, только матрицы у них — тысячи на тысячи.</p>`;
      $('stD').onclick = () => { u.step = Math.max(u.step, 1); u.render(); };
      $('stP').onclick = () => { u.step = 2; u.render(); };
      $('stR').onclick = () => { u.step = 0; u.render(); };
    },
  },
  friends: {
    controls: '<p class="lead" style="margin:0">Нажимайте на клетки матрицы: 1 — дружат, 0 — нет. Матрица сама остаётся симметричной.</p>',
    F: [[0, 1, 1, 0, 0], [1, 0, 1, 1, 0], [1, 1, 0, 0, 1], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0]],
    render() {
      const u = USES.friends, F = u.F, deg = F.map(r => r.reduce((a, b) => a + b, 0));
      const pos = NAMES.map((_, k) => [130 + 95 * Math.cos(-Math.PI / 2 + (k * 2 * Math.PI) / 5), 125 + 95 * Math.sin(-Math.PI / 2 + (k * 2 * Math.PI) / 5)]);
      let edges = '', nodes = '';
      F.forEach((r, i) => r.forEach((v, j) => { if (v && i < j) edges += `<line class="fade" x1="${pos[i][0]}" y1="${pos[i][1]}" x2="${pos[j][0]}" y2="${pos[j][1]}" style="stroke:var(--b);stroke-width:3"/>`; }));
      pos.forEach(([x, y], k) => {
        nodes += `<circle cx="${x}" cy="${y}" r="${12 + deg[k] * 4}" style="fill:var(--gold);stroke:var(--card);stroke-width:2"/>
          <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" font-weight="700" style="fill:#111">${NAMES[k]}</text>`;
      });
      const top = NAMES[deg.indexOf(Math.max(...deg))];
      $('useOut').innerHTML = `
        <div class="two">
          <div style="display:grid;grid-template-columns:auto auto;gap:4px;align-items:center;justify-content:center">
            <span></span><span style="display:flex;gap:4px;padding-left:8px">${NAMES.map(n => `<span class="mhead" style="min-width:30px">${n[0]}</span>`).join('')}</span>
            <span style="display:grid;gap:4px">${NAMES.map(n => `<span class="mhead" style="height:30px">${n}</span>`).join('')}</span>
            ${matHTML(F, { small: true, click: true, show: v => v, cls: (i, j) => (i === j ? '' : F[i][j] ? 'good' : '') })}
          </div>
          <svg viewBox="0 0 260 250">${edges}${nodes}</svg>
        </div>
        <div class="info">${chipsHTML([`друзей: ${NAMES.map((n, k) => `${n} ${deg[k]}`).join(', ')}`, `самый популярный — ${top}`, 'число друзей = сумма строки', 'A = Aᵀ: если Аня дружит с Борисом, то и Борис с Аней'])}</div>
        <p class="answer">Матрица смежности хранит все связи сети. Сумма строки — сколько у человека друзей, а матрица симметрична, потому что дружба взаимна.
        Так соцсети ищут «возможно, вы знакомы», а навигаторы — связи между городами.</p>`;
      $('useOut').querySelectorAll('.mc.click').forEach(c => c.onclick = () => {
        const i = +c.dataset.i, j = +c.dataset.j;
        if (i === j) return;
        F[i][j] = F[j][i] = 1 - F[i][j];
        u.render();
      });
    },
  },
  battle: {
    controls: slider('bR', 'Строка (с нуля)', 0, 5, 2) + slider('bC', 'Столбец (с нуля)', 0, 5, 1) +
      `<div class="btns"><button class="primary" id="bFire">Огонь ▶</button><button id="bShow">Показать корабли</button><button id="bNew">Заново</button></div>`,
    shots: [], reveal: false,
    render() {
      const u = USES.battle, r = +$('bR').value, c = +$('bC').value, ship = (i, j) => SHIPS.some(([a, b]) => a === i && b === j);
      $('bRv').textContent = r; $('bCv').textContent = c;
      const shot = (i, j) => u.shots.some(([a, b]) => a === i && b === j), hits = u.shots.filter(([a, b]) => ship(a, b)).length;
      const B = make(6, 6, (i, j) => (shot(i, j) ? (ship(i, j) ? '💥' : '·') : u.reveal && ship(i, j) ? '🚢' : ''));
      let s = '<div class="mat" style="grid-template-columns:auto repeat(6, auto)"><span></span>' + range(6).map(j => `<span class="mhead">${j}</span>`).join('');
      B.forEach((row, i) => {
        s += `<span class="mhead">${i}</span>` + row.map((v, j) => `<span class="mc ${i === r && j === c ? 'hit' : i === r ? 'row-on' : j === c ? 'col-on' : ''}">${v}</span>`).join('');
      });
      $('useOut').innerHTML = `
        <div class="mid">A[${r}][${c}] ${shot(r, c) ? (ship(r, c) ? '— 💥 попадание!' : '— мимо') : '— ?'}</div>
        <div style="margin-top:8px">${s}</div>
        <div class="info">${chipsHTML([`выстрелов: ${u.shots.length}, попаданий: ${hits} из ${SHIPS.length}`, 'строка и столбец считаются с нуля, как в Python', hits === SHIPS.length ? '🏆 все корабли потоплены!' : 'красная клетка — куда целимся'])}</div>
        <p class="answer">Игровое поле — матрица 6 × 6. Чтобы проверить клетку, программа берёт элемент <b>A[строка][столбец]</b>.
        В Python и NumPy нумерация начинается с <b>нуля</b>: первая строка — A[0], последняя в поле 6 × 6 — A[5].</p>`;
      $('bFire').onclick = () => { if (!shot(r, c)) u.shots.push([r, c]); u.render(); };
      $('bShow').onclick = () => { u.reveal = !u.reveal; u.render(); };
      $('bNew').onclick = () => { u.shots = []; u.reveal = false; u.render(); };
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
const story = t => `<span style="font-size:20px;font-weight:600">${t}</span>`;
const nz = (lo, hi) => { let v; do { v = rnd(lo, hi); } while (!v); return v; };
const mini = M => matHTML(M, { small: true, show: v => sgn(v) });
const at = (i, j) => `элемент (${i + 1}; ${j + 1})`;
function newQuiz() {
  const type = rnd(0, 6), i = rnd(0, 1), j = rnd(0, 1);
  if (type === 0) {
    const A = make(2, 2, () => rnd(-9, 9)), B = make(2, 2, () => rnd(-9, 9)), minus = Math.random() < .4;
    q = { text: `${mini(A)} ${minus ? '−' : '+'} ${mini(B)}: ${at(i, j)} = ?`, ans: A[i][j] + (minus ? -1 : 1) * B[i][j],
          hint: `Берём элементы на том же месте: ${sgn(A[i][j])} ${minus ? '−' : '+'} ${par(B[i][j])}.` };
  } else if (type === 1) {
    const A = make(2, 2, () => rnd(-9, 9)), k = nz(-4, 5);
    q = { text: `${sgn(k)} · ${mini(A)}: ${at(i, j)} = ?`, ans: k * A[i][j], hint: `Каждый элемент умножается на ${sgn(k)}: ${sgn(k)}·${par(A[i][j])}.` };
  } else if (type === 2) {
    const A = make(2, 3, () => rnd(-9, 9)), r = rnd(0, 2), c = rnd(0, 1);
    q = { text: `A = ${mini(A)}. В Aᵀ ${at(r, c)} = ?`, ans: A[c][r], hint: `(Aᵀ)<sub>ij</sub> = a<sub>ji</sub>: ищите в A строку ${c + 1}, столбец ${r + 1}.` };
  } else if (type === 3) {
    const m = rnd(2, 9), n = rnd(2, 9), kind = rnd(0, 2);
    q = [{ text: `Матрица ${m} × ${n}. Сколько в ней элементов?`, ans: m * n, hint: `${m} строк по ${n} элементов.` },
         { text: `A — матрица ${m} × ${n}. Сколько строк у Aᵀ?`, ans: n, hint: 'При транспонировании столбцы становятся строками.' },
         { text: `A — матрица ${m} × ${n}. Сколько чисел вернёт A.sum(axis=1) — сумма по строкам?`, ans: m, hint: 'Каждая строка сворачивается в одно число.' }][kind];
  } else if (type === 4) {
    const A = make(3, 3, () => rnd(0, 9)), r = rnd(0, 2), byCol = Math.random() < .5;
    q = { text: `${mini(A)} Сумма ${byCol ? 'столбца' : 'строки'} ${r + 1} = ?`, ans: byCol ? A.reduce((s, row) => s + row[r], 0) : A[r].reduce((s, v) => s + v, 0),
          hint: `Сложите все числа ${byCol ? 'столбца' : 'строки'} ${r + 1}.` };
  } else if (type === 5) {
    const F = make(4, 4, () => 0);
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) F[a][b] = F[b][a] = Math.random() < .5 ? 1 : 0;
    const k = rnd(0, 3);
    q = { text: story(`👥 Матрица дружбы: ${mini(F)} Сколько друзей у человека номер ${k + 1}?`), ans: F[k].reduce((s, v) => s + v, 0),
          hint: `Сумма строки ${k + 1}: считаем единицы.` };
  } else {
    const S = rnd(5, 30), D = rnd(0, 20), P = rnd(5, 40), shop = rnd(1, 3);
    q = { text: story(`🏬 Магазин ${shop}: на складе ${S} пакетов молока, привезли ${D}, продали ${P}. Какой остаток? (минус — не хватило)`), ans: S + D - P,
          hint: `Остаток = было + привезли − продали = ${S} + ${D} − ${P}.` };
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

render1(); render2(); build3(); build4(); render5(); buildUse(); newQuiz();
$('qScore').textContent = 'Счёт: 0 из 0';
