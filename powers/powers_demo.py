"""Степени в движении — интерактивная демонстрация на Python (tkinter, без внешних библиотек).

Запуск:  python powers_demo.py
"""
import tkinter as tk
from fractions import Fraction
from math import cos, pi

COLOR_A = "#e4572e"
COLOR_B = "#2e86ab"
COLOR_C = "#5b9a2f"
SHADES = ("#f0a48d", "#e4572e", "#c0441f")  # верх, правая, левая грани куба
BG = "#f6f3ec"
FONT = ("Segoe UI", 11)


class Picture(tk.Canvas):
    """a¹ — точки в ряд, a² — квадрат, a³ — изометрический куб. Клетки появляются по одной."""

    def __init__(self, master):
        super().__init__(master, width=560, height=280, bg=BG, highlightthickness=0)
        self._job = None
        self.queue = []

    def show(self, a, n):
        if self._job:
            self.after_cancel(self._job)
        self.delete("all")
        self.queue = []
        if n == 0:
            self.queue.append(("oval", (260, 120, 300, 160), COLOR_A))
        elif n == 1:
            s = min(50, 520 // a)
            for i in range(a):
                x = 20 + i * s
                self.queue.append(("oval", (x + 4, 120, x + s - 4, 120 + s - 8), COLOR_A))
        elif n == 2:
            s = 240 // a
            for i in range(a):
                for j in range(a):
                    x, y = 160 + j * s, 20 + i * s
                    self.queue.append(("rect", (x + 2, y + 2, x + s - 2, y + s - 2), COLOR_A))
        elif n == 3:
            self._cube(a, 280, 140, 120 / a)
        else:
            self.create_text(280, 140, text="Нарисовать сложно, но умножение работает так же",
                             font=FONT, fill="#6b7280")
        self._step()

    def _cube(self, a, ox, oy, s):
        c = cos(pi / 6)

        def p(x, y, z):
            return ox + (x - y) * c * s, oy + (x + y) * 0.5 * s - z * s

        for i in range(a):
            for j in range(a):
                self.queue.append(("poly", (p(i, j, a), p(i + 1, j, a), p(i + 1, j + 1, a), p(i, j + 1, a)), SHADES[0]))
        for i in range(a):
            for j in range(a):
                self.queue.append(("poly", (p(a, i, j), p(a, i + 1, j), p(a, i + 1, j + 1), p(a, i, j + 1)), SHADES[1]))
        for i in range(a):
            for j in range(a):
                self.queue.append(("poly", (p(i, a, j), p(i + 1, a, j), p(i + 1, a, j + 1), p(i, a, j + 1)), SHADES[2]))

    def _step(self):
        # рисуем по несколько клеток за кадр, чтобы большие фигуры не рисовались слишком долго
        for _ in range(max(1, len(self.queue) // 40)):
            if not self.queue:
                return
            kind, coords, color = self.queue.pop(0)
            if kind == "oval":
                self.create_oval(*coords, fill=color, outline="")
            elif kind == "rect":
                self.create_rectangle(*coords, fill=color, outline="")
            else:
                self.create_polygon(*[v for pt in coords for v in pt], fill=color, outline=BG)
        self._job = self.after(30, self._step)


class GrowthChart(tk.Canvas):
    """Графики 10·n, n² и 2ⁿ рисуются точка за точкой."""

    def __init__(self, master):
        super().__init__(master, width=560, height=220, bg=BG, highlightthickness=0)
        self._job = None

    def show(self, big_n):
        if self._job:
            self.after_cancel(self._job)
        self.delete("all")
        funcs = ((lambda n: 10 * n, COLOR_C, "10·n"), (lambda n: n * n, COLOR_B, "n²"), (lambda n: 2 ** n, COLOR_A, "2ⁿ"))
        max_y = max(f(big_n) for f, _, _ in funcs)
        left, bottom, w, h = 50, 190, 490, 170
        self.x = lambda n: left + w * n / big_n
        self.y = lambda v: bottom - h * v / max_y
        self.create_line(left, bottom - h, left, bottom, left + w, bottom, fill="#bbb", width=2)
        self.create_text(left - 6, bottom - h, text=str(max_y), anchor="e", font=("Segoe UI", 9))
        for i, (_, color, name) in enumerate(funcs):
            self.create_text(left + 10 + i * 70, 12, text=name, fill=color, anchor="w", font=("Segoe UI", 11, "bold"))
        self._draw(funcs, big_n, 1)

    def _draw(self, funcs, big_n, n):
        if n > big_n:
            return
        for f, color, _ in funcs:
            self.create_line(self.x(n - 1), self.y(f(n - 1)), self.x(n), self.y(f(n)), fill=color, width=3)
        self._job = self.after(120, self._draw, funcs, big_n, n + 1)


USES_TEXT = """Степень нужна там, где одно и то же действие «умножить на a» повторяется много раз.

📐 Площадь и объём: a² (м²) и a³ (см³). Признак: длина умножается сама на себя.
📈 Рост в одно и то же число раз: вклады, бактерии, слухи, распад веществ.
     Признак: «каждый год / день / шаг в k раз больше».
💻 Комбинации: n мест, на каждом k вариантов → kⁿ (пароли, PIN-коды, биты: 1 байт = 2⁸).
🔭 Очень большие и малые числа: до Солнца 1,5·10¹¹ м, атом 10⁻¹⁰ м."""


def spaced(x):
    return f"{x:,}".replace(",", " ")


class UsesWindow(tk.Toplevel):
    """Три задачи из жизни: вклад, пароль, слух. Графики растут с анимацией."""

    def __init__(self, master):
        super().__init__(master)
        self.title("Зачем нужны степени")
        self.configure(bg=BG, padx=16, pady=12)
        tk.Label(self, text=USES_TEXT, font=FONT, bg=BG, justify="left").pack(anchor="w")

        row = tk.Frame(self, bg=BG)
        row.pack(fill="x", pady=8)
        self.fields = {}
        for key, label, default in (("s0", "Вклад, ₽", 10000), ("r", "% в год", 10), ("n", "Лет / символов / дней", 10),
                                    ("k", "Символов в алфавите / людей", 62)):
            tk.Label(row, text=label, bg=BG, font=FONT).pack(side="left")
            e = tk.Entry(row, width=7, font=FONT)
            e.insert(0, str(default))
            e.pack(side="left", padx=(2, 10))
            self.fields[key] = e

        buttons = tk.Frame(self, bg=BG)
        buttons.pack(anchor="w")
        for text, cmd in (("💰 Вклад", self.bank), ("🔐 Пароль", self.password), ("📣 Слух", self.rumor)):
            tk.Button(buttons, text=text, font=FONT, command=cmd).pack(side="left", padx=(0, 6))

        self.canvas = tk.Canvas(self, width=600, height=200, bg=BG, highlightthickness=0)
        self.canvas.pack(pady=6)
        self.out = tk.Label(self, font=("Consolas", 11), bg=BG, justify="left", anchor="w", fg=COLOR_C)
        self.out.pack(fill="x")
        self._job = None
        self.bank()

    def _get(self, key):
        return float(self.fields[key].get().replace(",", "."))

    def _bars(self, values, color, i=0):
        """Столбики появляются по одному."""
        if i == 0:
            if self._job:
                self.after_cancel(self._job)
            self.canvas.delete("all")
        if i >= len(values):
            return
        w, top = 600 / len(values), max(values)
        h = 180 * values[i] / top
        self.canvas.create_rectangle(i * w + w * 0.15, 190 - h, i * w + w * 0.85, 190, fill=color, outline="")
        self._job = self.after(60, self._bars, values, color, i + 1)

    def bank(self):
        try:
            s0, r, n = self._get("s0"), self._get("r"), int(self._get("n"))
        except ValueError:
            return self.out.config(text="Введите числа", fg=COLOR_A)
        q = 1 + r / 100
        values = [s0 * q ** i for i in range(n + 1)]
        self._bars(values, COLOR_B)
        self.out.config(fg=COLOR_C, text=(
            f"S = S0 · (1 + r/100)ⁿ = {spaced(round(s0))} · {q:g}^{n} ≈ {spaced(round(values[-1]))} ₽\n"
            f"Деньги выросли в {values[-1] / s0:.2f} раза. Без степени (простой процент): "
            f"{spaced(round(s0 * (1 + r * n / 100)))} ₽"))

    def password(self):
        try:
            n, k = int(self._get("n")), int(self._get("k"))
        except ValueError:
            return self.out.config(text="Введите числа", fg=COLOR_A)
        self._bars([k ** i for i in range(1, n + 1)], COLOR_A)
        combos = k ** n
        years = combos / 1e9 / 3600 / 24 / 365
        self.out.config(fg=COLOR_C, text=(
            f"{n} символов, у каждого {k} вариантов → {k}^{n} = {spaced(combos)} паролей\n"
            f"Перебор при миллиарде вариантов в секунду: ≈ {years:,.1f} лет\n"
            f"Каждый лишний символ увеличивает время взлома в {k} раз."))

    def rumor(self):
        try:
            n, k = int(self._get("n")), int(self._get("k"))
        except ValueError:
            return self.out.config(text="Введите числа", fg=COLOR_A)
        k = min(k, 10)
        values = [k ** i for i in range(n + 1)]
        self._bars(values, COLOR_A)
        days = next(d for d in range(100) if (k ** (d + 1) - 1) // (k - 1) >= 8_000_000_000) if k > 1 else "∞"
        self.out.config(fg=COLOR_C, text=(
            f"Каждый рассказывает {k} людям в день → в день {n} узнали {k}^{n} = {spaced(k ** n)} человек\n"
            f"Вся Земля (8 млрд) узнает примерно за {days} дней."))


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Степени в движении — Python")
        self.configure(bg=BG, padx=16, pady=12)
        tk.Label(self, text="Степени в движении", font=("Segoe UI", 20, "bold"), bg=BG).pack(anchor="w")

        ctl = tk.Frame(self, bg=BG)
        ctl.pack(fill="x")
        self.a = tk.IntVar(value=3)
        self.n = tk.IntVar(value=3)
        for text, var, lo, hi in (("Основание a", self.a, 1, 10), ("Показатель n", self.n, 0, 6)):
            tk.Scale(ctl, label=text, variable=var, from_=lo, to=hi, orient="horizontal", length=220, bg=BG,
                     highlightthickness=0, font=FONT, command=lambda _: self.update_power()).pack(side="left", padx=(0, 16))

        self.result = tk.Label(self, font=("Segoe UI", 18, "bold"), bg=BG, fg=COLOR_A)
        self.result.pack(anchor="w", pady=(6, 0))
        self.chain = tk.Label(self, font=("Consolas", 13), bg=BG, justify="left")
        self.chain.pack(anchor="w")
        self.picture = Picture(self)
        self.picture.pack()

        # Свойства
        box = tk.LabelFrame(self, text="Свойства: a, m, n", bg=BG, font=FONT, padx=8, pady=6)
        box.pack(fill="x", pady=6)
        self.ra, self.rm, self.rn = (tk.Spinbox(box, from_=lo, to=hi, width=4, font=FONT) for lo, hi in ((2, 9), (1, 8), (1, 8)))
        for label, spin, default in (("a =", self.ra, 2), ("m =", self.rm, 3), ("n =", self.rn, 2)):
            tk.Label(box, text=label, bg=BG, font=FONT).pack(side="left")
            spin.delete(0, "end")
            spin.insert(0, str(default))
            spin.pack(side="left", padx=(2, 10))
        for text, kind in (("aᵐ·aⁿ", "mul"), ("aᵐ:aⁿ", "div"), ("(aᵐ)ⁿ", "pow"), ("a⁻ⁿ", "neg")):
            tk.Button(box, text=text, font=FONT, command=lambda k=kind: self.rule(k)).pack(side="left", padx=3)
        self.rule_text = tk.Label(self, font=("Consolas", 12), bg=BG, fg=COLOR_C, justify="left", anchor="w")
        self.rule_text.pack(fill="x")

        # Рост
        grow = tk.Frame(self, bg=BG)
        grow.pack(fill="x", pady=(8, 0))
        self.big_n = tk.IntVar(value=10)
        tk.Scale(grow, label="Кто быстрее: n до", variable=self.big_n, from_=2, to=14, orient="horizontal",
                 length=220, bg=BG, highlightthickness=0, font=FONT,
                 command=lambda _: self.chart.show(self.big_n.get())).pack(anchor="w")
        self.chart = GrowthChart(self)
        self.chart.pack()

        tk.Button(self, text="Зачем нужны степени? →", font=FONT, command=lambda: UsesWindow(self)).pack(anchor="w", pady=(6, 0))

        self._chain_job = None
        self.update_power()
        self.rule("mul")
        self.chart.show(self.big_n.get())

    def update_power(self):
        a, n = self.a.get(), self.n.get()
        self.result.config(text=f"{a}^{n} = {a ** n:,}".replace(",", " "))
        self.picture.show(a, n)
        if self._chain_job:
            self.after_cancel(self._chain_job)
        if n == 0:
            self.chain.config(text="Ни одного множителя → 1")
        else:
            self._grow_chain(a, n, 1)

    def _grow_chain(self, a, n, k):
        """Множители появляются по одному, рядом — промежуточное произведение."""
        self.chain.config(text=" × ".join([str(a)] * k) + f"  =  {a ** k:,}".replace(",", " "))
        if k < n:
            self._chain_job = self.after(350, self._grow_chain, a, n, k + 1)

    def rule(self, kind):
        try:
            a, m, n = int(self.ra.get()), int(self.rm.get()), int(self.rn.get())
        except ValueError:
            self.rule_text.config(text="Введите целые числа", fg=COLOR_A)
            return
        f = lambda k: "·".join([str(a)] * k) if k else "1"
        if kind == "mul":
            text = (f"{a}^{m} · {a}^{n} = ({f(m)}) · ({f(n)})\n"
                    f"= {m}+{n} множителей = {a}^{m + n} = {a ** (m + n)}")
        elif kind == "div":
            text = (f"{a}^{m} : {a}^{n} = ({f(m)}) / ({f(n)})\n"
                    f"сокращаем {min(m, n)} пар → {a}^{m}-{n} = {a}^{m - n} = {Fraction(a) ** (m - n)}")
        elif kind == "pow":
            text = (f"({a}^{m})^{n} = " + " · ".join([f"({f(m)})"] * n) + "\n"
                    f"= {n} групп по {m} = {a}^{m * n} = {a ** (m * n)}")
        else:
            steps = "  →  ".join(f"{a}^{k} = {Fraction(a) ** k}" for k in range(2, -n - 1, -1))
            text = f"Каждый шаг делим на {a}:\n{steps}"
        self.rule_text.config(text=text, fg=COLOR_C)


if __name__ == "__main__":
    App().mainloop()
