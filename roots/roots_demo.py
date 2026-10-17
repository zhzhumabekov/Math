"""Корни в движении — интерактивная демонстрация на Python (tkinter, без внешних библиотек).

Запуск:  python roots_demo.py
"""
import time
import tkinter as tk
from math import acos, ceil, cos, hypot, isqrt, sin, sqrt

COLOR_A = "#e4572e"
COLOR_B = "#2e86ab"
COLOR_C = "#5b9a2f"
GOLD = "#f2a541"
BG = "#f6f3ec"
FONT = ("Segoe UI", 11)
MONO = ("Consolas", 12)


def factor(n):
    """Разложение на простые множители: 72 → [2, 2, 2, 3, 3]."""
    result, p = [], 2
    while p * p <= n:
        while n % p == 0:
            result.append(p)
            n //= p
        p += 1
    if n > 1:
        result.append(n)
    return result


def simplify(n):
    """√n = k·√m: каждая пара одинаковых множителей выходит из-под корня."""
    k, m = 1, 1
    f = factor(n)
    i = 0
    while i < len(f):
        if i + 1 < len(f) and f[i] == f[i + 1]:
            k *= f[i]
            i += 2
        else:
            m *= f[i]
            i += 1
    return k, m, f


class Tiles(tk.Canvas):
    """a плиток раскладываются рядами, затем рисуется квадрат площади a со стороной √a."""

    def __init__(self, master):
        super().__init__(master, width=300, height=300, bg=BG, highlightthickness=0)
        self._job = None

    def show(self, a):
        if self._job:
            self.after_cancel(self._job)
        self.delete("all")
        n = ceil(sqrt(a))
        u = 270 / n
        cells = [(10 + (i % n) * u, 20 + (i // n) * u) for i in range(a)]
        self._tile(cells, u, 0, a)

    def _tile(self, cells, u, i, a):
        for _ in range(max(1, len(cells) // 30)):
            if i >= len(cells):
                side = sqrt(a) * u
                self.create_rectangle(10, 20, 10 + side, 20 + side, outline=COLOR_A, width=3, dash=(6, 4))
                self.create_text(10 + side / 2, 10, text=f"сторона √{a} ≈ {sqrt(a):.3f}", fill=COLOR_A,
                                 font=("Segoe UI", 10, "bold"))
                return
            x, y = cells[i]
            self.create_rectangle(x + 1, y + 1, x + u - 1, y + u - 1, fill=COLOR_B, outline="")
            i += 1
        self._job = self.after(25, self._tile, cells, u, i, a)


class Bisection(tk.Canvas):
    """Поиск √a половинным делением: жёлтый отрезок сжимается вокруг корня."""

    def __init__(self, master, log):
        super().__init__(master, width=560, height=70, bg=BG, highlightthickness=0)
        self.log = log
        self._job = None

    def start(self, a):
        if self._job:
            self.after_cancel(self._job)
        self.a, self.lo, self.hi, self.k = a, 0.0, float(a), 0
        self.lines = []
        self._draw()
        self._job = self.after(500, self._step)

    def _x(self, v):
        return 20 + 520 * v / self.a

    def _draw(self, mid=None):
        self.delete("all")
        self.create_rectangle(self._x(self.lo), 12, max(self._x(self.hi), self._x(self.lo) + 1), 38, fill=GOLD, outline="")
        self.create_line(20, 38, 540, 38, width=2)
        step = 1 if self.a <= 20 else 5 if self.a <= 50 else 10 if self.a <= 100 else 25
        for v in range(0, self.a + 1, step):
            self.create_line(self._x(v), 32, self._x(v), 44)
            self.create_text(self._x(v), 58, text=str(v), font=("Segoe UI", 9))
        if mid is not None:
            self.create_polygon(self._x(mid), 12, self._x(mid) - 6, 2, self._x(mid) + 6, 2, fill=COLOR_A)

    def _step(self):
        if self.hi - self.lo < 0.001:
            self.lines.append(f"Готово: √{self.a} ≈ {(self.lo + self.hi) / 2:.3f}  (калькулятор: {sqrt(self.a):.3f})")
            self.log.config(text="\n".join(self.lines[-8:]))
            return
        self.k += 1
        m = (self.lo + self.hi) / 2
        bigger = m * m > self.a
        if bigger:
            self.hi = m
        else:
            self.lo = m
        self.lines.append(f"{self.k:2}) m = {m:9.4f}  m² = {m * m:10.3f}  {'>' if bigger else '<'} {self.a}"
                          f"  → [{self.lo:.4f}; {self.hi:.4f}]")
        self.log.config(text="\n".join(self.lines[-8:]))
        self._draw(m)
        self._job = self.after(600, self._step)


class UsesWindow(tk.Toplevel):
    """Зачем нужны корни: лестница (Пифагор), время падения, дальность горизонта."""

    TEXT = """Корень нужен, когда известен квадрат (или куб) величины, а найти надо её саму.

📐 Геометрия: сторона квадрата по площади, гипотенуза c = √(a² + b²), диагональ экрана.
🏗️ Стройка: прямой угол «3-4-5», длина ската крыши.
🪂 Физика: время падения t = √(2h/g), период маятника, скорость по тормозному пути.
🌅 Горизонт: d ≈ 3,57·√h км (h в метрах).
📄 Бумага A4: стороны 1 : √2, поэтому сложенный пополам A3 — это A4.
📊 Статистика и финансы: стандартное отклонение, средний рост за n лет = ⁿ√(итог/начало)."""

    def __init__(self, master):
        super().__init__(master)
        self.title("Зачем нужны корни")
        self.configure(bg=BG, padx=16, pady=12)
        tk.Label(self, text=self.TEXT, font=FONT, bg=BG, justify="left").pack(anchor="w")

        row = tk.Frame(self, bg=BG)
        row.pack(fill="x", pady=8)
        self.h, self.b, self.fall_h = tk.IntVar(value=4), tk.IntVar(value=3), tk.IntVar(value=20)
        for label, var, lo, hi, cmd in (("Высота окна, м", self.h, 2, 12, self.ladder),
                                        ("Отступ лестницы, м", self.b, 1, 6, self.ladder),
                                        ("Высота падения, м", self.fall_h, 1, 300, self.fall)):
            tk.Scale(row, label=label, variable=var, from_=lo, to=hi, orient="horizontal", length=170, bg=BG,
                     highlightthickness=0, command=lambda _, c=cmd: c()).pack(side="left", padx=(0, 10))

        horizon = tk.Frame(self, bg=BG)
        horizon.pack(anchor="w")
        tk.Label(horizon, text="🌅 Горизонт:", bg=BG, font=FONT).pack(side="left")
        for name, h in (("человек 1,7 м", 1.7), ("маяк 30 м", 30), ("Эверест", 8848), ("самолёт 10 км", 10000)):
            tk.Button(horizon, text=name, font=FONT, command=lambda v=h, n=name: self.horizon(v, n)).pack(side="left", padx=2)

        self.canvas = tk.Canvas(self, width=600, height=260, bg=BG, highlightthickness=0)
        self.canvas.pack(pady=6)
        self.out = tk.Label(self, font=MONO, bg=BG, justify="left", anchor="w", fg=COLOR_C)
        self.out.pack(fill="x")
        self._job = None
        self.ladder()

    def _cancel(self):
        if self._job:
            self.after_cancel(self._job)
        self.canvas.delete("all")

    def ladder(self, t=0):
        h, b = self.h.get(), self.b.get()
        if t == 0:
            self._cancel()
            c = hypot(h, b)
            self.out.config(text=f"c = √({h}² + {b}²) = √{h * h + b * b} ≈ {c:.2f} м\n"
                                 "Теорема Пифагора даёт c², а корень — саму длину лестницы.")
            self.canvas.create_rectangle(300, 10, 316, 240, fill="#ddd6c8", outline="")
            self.canvas.create_line(100, 240, 400, 240, width=2)
        k, wall, ground = 18, 300, 240
        foot, top = wall - b * k, ground - h * k
        frames = 20
        x = foot + (wall - foot) * t / frames
        y = ground + (top - ground) * t / frames
        self.canvas.delete("ladder")
        self.canvas.create_line(foot, ground, x, y, fill=COLOR_A, width=5, capstyle="round", tags="ladder")
        if t < frames:
            self._job = self.after(25, self.ladder, t + 1)

    def fall(self, start=None):
        h = self.fall_h.get()
        total = sqrt(2 * h / 9.8)
        if start is None:
            self._cancel()
            self.canvas.create_rectangle(250, 10, 290, 250, fill="#ddd6c8", outline="")
            self.canvas.create_line(200, 250, 420, 250, width=2)
            self.out.config(text=f"t = √(2h / g) = √(2·{h} / 9,8) ≈ {total:.2f} с\n"
                                 f"В 4 раза выше ({4 * h} м) → {sqrt(8 * h / 9.8):.2f} с — всего в 2 раза дольше.")
            start = time.perf_counter()
        t = min(total, time.perf_counter() - start)
        y = 12 + 228 * (t / total) ** 2  # путь растёт как квадрат времени
        self.canvas.delete("ball")
        self.canvas.create_oval(320, y - 9, 338, y + 9, fill=COLOR_A, outline="", tags="ball")
        self.canvas.create_text(470, 120, text=f"{t:.2f} с", font=("Segoe UI", 28, "bold"), tags="ball")
        if t < total:
            self._job = self.after(16, self.fall, start)

    def horizon(self, h, name):
        self._cancel()
        d = sqrt(2 * 6_371_000 * h + h * h) / 1000
        cx, cy, r = 300, 560, 400
        self.canvas.create_oval(cx - r, cy - r, cx + r, cy + r, fill="#cfe3ec", outline="")
        hp = 15 + 25 * (len(str(int(h))))  # высота на рисунке преувеличена
        oy = cy - r - hp
        self.canvas.create_line(cx, cy - r, cx, oy, width=3)
        th = acos(r / (r + hp))
        for sgn in (-1, 1):
            self.canvas.create_line(cx, oy, cx + sgn * r * sin(th), cy - r * cos(th), fill=COLOR_A, width=2)
        self.out.config(text=f"{name}: d ≈ √(2Rh) ≈ 3,57·√{h:g} ≈ {d:,.1f} км\n".replace(",", " ")
                             + "В 100 раз выше → видно в 10 раз дальше.")


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Корни в движении — Python")
        self.configure(bg=BG, padx=16, pady=12)
        tk.Label(self, text="Корни в движении", font=("Segoe UI", 20, "bold"), bg=BG).pack(anchor="w")

        top = tk.Frame(self, bg=BG)
        top.pack(fill="x")
        left = tk.Frame(top, bg=BG)
        left.pack(side="left", anchor="n")
        self.a = tk.IntVar(value=10)
        tk.Scale(left, label="Площадь a (плиток)", variable=self.a, from_=1, to=144, orient="horizontal", length=240,
                 bg=BG, highlightthickness=0, font=FONT, command=lambda _: self.update_root()).pack(anchor="w")
        self.result = tk.Label(left, font=("Segoe UI", 20, "bold"), bg=BG, fg=COLOR_A)
        self.result.pack(anchor="w", pady=4)
        self.info = tk.Label(left, font=FONT, bg=BG, justify="left")
        self.info.pack(anchor="w")
        self.tiles = Tiles(top)
        self.tiles.pack(side="left", padx=16)

        # Половинное деление
        box = tk.LabelFrame(self, text="Как найти √a без калькулятора (половинное деление)", bg=BG, font=FONT, padx=8, pady=6)
        box.pack(fill="x", pady=6)
        tk.Button(box, text="Найти √a ▶", font=FONT, command=lambda: self.bisect.start(self.a.get())).pack(anchor="w")
        self.bis_log = tk.Label(box, font=("Consolas", 10), bg=BG, justify="left", anchor="w")
        self.bisect = Bisection(box, self.bis_log)
        self.bisect.pack()
        self.bis_log.pack(fill="x")

        # Вынесение множителя
        sim = tk.LabelFrame(self, text="Вынести множитель из-под корня", bg=BG, font=FONT, padx=8, pady=6)
        sim.pack(fill="x")
        self.n_entry = tk.Entry(sim, width=8, font=FONT)
        self.n_entry.insert(0, "72")
        tk.Label(sim, text="√", bg=BG, font=("Segoe UI", 14)).pack(side="left")
        self.n_entry.pack(side="left")
        tk.Button(sim, text="Упростить", font=FONT, command=self.simplify).pack(side="left", padx=8)
        self.sim_text = tk.Label(self, font=MONO, bg=BG, fg=COLOR_C, justify="left", anchor="w")
        self.sim_text.pack(fill="x", pady=4)

        tk.Button(self, text="Зачем нужны корни? →", font=FONT, command=lambda: UsesWindow(self)).pack(anchor="w")

        self.update_root()
        self.simplify()

    def update_root(self):
        a = self.a.get()
        r, f = sqrt(a), isqrt(a)
        if f * f == a:
            self.result.config(text=f"√{a} = {f}")
            self.info.config(text=f"{f}² = {a}\nплитки сложились в квадрат {f}×{f}")
        else:
            self.result.config(text=f"√{a} ≈ {r:.3f}")
            self.info.config(text=f"{f}² = {f * f} < {a} < {f + 1}² = {(f + 1) ** 2}\n"
                                  f"значит {f} < √{a} < {f + 1}\nплитки в квадрат не складываются")
        self.tiles.show(a)

    def simplify(self):
        try:
            n = int(self.n_entry.get())
            assert n >= 2
        except (ValueError, AssertionError):
            self.sim_text.config(text="Введите целое число ≥ 2", fg=COLOR_A)
            return
        k, m, f = simplify(n)
        lines = [f"{n} = " + " · ".join(map(str, f))]
        if k == 1:
            lines.append(f"Пар одинаковых множителей нет — √{n} не упрощается.")
        else:
            res = f"{k}" if m == 1 else f"{k}√{m}"
            lines.append(f"√{n} = √({k * k}·{m}) = √{k * k} · √{m} = {res}")
        self.sim_text.config(text="\n".join(lines), fg=COLOR_C)


if __name__ == "__main__":
    App().mainloop()
