"""Дроби в движении — интерактивная демонстрация на Python (tkinter, без внешних библиотек).

Запуск:  python fractions_demo.py
"""
import tkinter as tk
from fractions import Fraction
from math import ceil, gcd

COLOR_A = "#e4572e"
COLOR_B = "#2e86ab"
COLOR_C = "#5b9a2f"
EMPTY = "#eee9de"
BG = "#f6f3ec"


class PieView(tk.Canvas):
    """Круги-«пиццы», куски которых закрашиваются по одному с анимацией."""

    def __init__(self, master, **kw):
        super().__init__(master, width=560, height=170, bg=BG, highlightthickness=0, **kw)
        self._job = None

    def show(self, num, den, color=COLOR_A):
        if self._job:
            self.after_cancel(self._job)
        self.delete("all")
        pies = max(1, ceil(num / den))
        size, r = 140, 60
        self.slices = []
        for p in range(pies):
            cx, cy = 20 + p * size + size // 2, 85
            for i in range(den):
                if den == 1:
                    item = self.create_oval(cx - r, cy - r, cx + r, cy + r, fill=EMPTY, outline=BG, width=3)
                else:
                    extent = 360 / den
                    item = self.create_arc(cx - r, cy - r, cx + r, cy + r, start=90 - (i + 1) * extent,
                                           extent=extent, fill=EMPTY, outline=BG, width=3)
                self.slices.append(item)
        self._animate(0, num, color)

    def _animate(self, i, num, color):
        if i >= num:
            return
        self.itemconfig(self.slices[i], fill=color)
        self._job = self.after(120, self._animate, i + 1, num, color)


class NumberLine(tk.Canvas):
    """Числовая прямая: точка прыгает от 0 до n/d шагами по 1/d."""

    def __init__(self, master, **kw):
        super().__init__(master, width=560, height=120, bg=BG, highlightthickness=0, **kw)
        self._job = None

    def show(self, num, den):
        if self._job:
            self.after_cancel(self._job)
        self.delete("all")
        rng = max(1, ceil(num / den))
        x0, x1, y = 30, 530, 80
        self.px = lambda v: x0 + (x1 - x0) * v / rng
        self.y = y
        self.create_line(x0 - 10, y, x1 + 15, y, width=2, arrow=tk.LAST)
        for i in range(rng * den + 1):
            whole = i % den == 0
            x, h = self.px(i / den), 12 if whole else 6
            self.create_line(x, y - h, x, y + h, width=2 if whole else 1)
            if whole:
                self.create_text(x, y + 26, text=str(i // den), font=("Segoe UI", 12, "bold"))
        self.dot = self.create_oval(0, 0, 0, 0, fill=COLOR_B, outline="")
        self._place(0)
        self._jump(0, num, den)

    def _place(self, v):
        x = self.px(v)
        self.coords(self.dot, x - 8, self.y - 8, x + 8, self.y + 8)

    def _jump(self, k, num, den, t=0.0):
        if k >= num:
            return
        frames = 12
        a, b = k / den, (k + 1) / den
        v = a + (b - a) * t / frames
        x = self.px(v)
        lift = 4 * (t / frames) * (1 - t / frames) * 35  # парабола прыжка
        self.coords(self.dot, x - 8, self.y - 8 - lift, x + 8, self.y + 8 - lift)
        if t < frames:
            self._job = self.after(20, self._jump, k, num, den, t + 1)
        else:
            xa, xb = self.px(a), self.px(b)
            self.create_line(xa, self.y - 4, (xa + xb) / 2, self.y - 45, xb, self.y - 4,
                             smooth=True, fill=COLOR_B, width=2)
            self.tag_raise(self.dot)
            self._job = self.after(120, self._jump, k + 1, num, den, 0)


USES_TEXT = """Дробь нужна, когда целое делят на части, а целым числом ответ не записать.
3 пиццы на 4 человека — каждому 3 : 4 = 3/4 пиццы. Дробь — это результат деления.

🍕 Делить поровну: пицца, деньги, работа. Признак: «поровну», и нацело не делится.
🍳 Рецепты и мерки: ½ стакана, ¾ ложки. Признак: «половина, треть, четверть».
🏷️ Проценты и скидки: 25% = 25/100 = 1/4. Признак: «%», «часть от».
⏱️ Время: 15 мин = 1/4 часа, 45 мин = 3/4 часа.
🎲 Вероятность: шанс выбросить шестёрку — 1/6."""

PALETTE = ("#e4572e", "#2e86ab", "#5b9a2f", "#f2a541", "#8e5bd0", "#d04f8e",
           "#3bb3a6", "#a1662f", "#5b6ee1", "#c2b830", "#7a7a7a", "#e07b39")


def mixed(f):
    """Fraction → «1 1/2»."""
    whole, rest = divmod(f.numerator, f.denominator)
    if rest == 0:
        return str(whole)
    return (f"{whole} " if whole else "") + f"{rest}/{f.denominator}"


class UsesWindow(tk.Toplevel):
    """Задачи из жизни: делим пиццу, пересчитываем рецепт, считаем скидку."""

    def __init__(self, master):
        super().__init__(master)
        self.title("Зачем нужны дроби")
        self.configure(bg=BG, padx=16, pady=12)
        font = ("Segoe UI", 11)
        tk.Label(self, text=USES_TEXT, font=font, bg=BG, justify="left").pack(anchor="w")

        row = tk.Frame(self, bg=BG)
        row.pack(fill="x", pady=8)
        self.pizzas, self.people = tk.IntVar(value=3), tk.IntVar(value=4)
        tk.Scale(row, label="Пицц", variable=self.pizzas, from_=1, to=4, orient="horizontal", length=140,
                 bg=BG, highlightthickness=0, command=lambda _: self.pizza()).pack(side="left")
        tk.Scale(row, label="Человек", variable=self.people, from_=2, to=12, orient="horizontal", length=160,
                 bg=BG, highlightthickness=0, command=lambda _: self.pizza()).pack(side="left", padx=10)
        self.portions = tk.IntVar(value=6)
        tk.Scale(row, label="Порций (рецепт на 4)", variable=self.portions, from_=1, to=12, orient="horizontal",
                 length=180, bg=BG, highlightthickness=0, command=lambda _: self.recipe()).pack(side="left")

        sale = tk.Frame(self, bg=BG)
        sale.pack(anchor="w")
        tk.Label(sale, text="Цена:", bg=BG, font=font).pack(side="left")
        self.price = tk.Entry(sale, width=8, font=font)
        self.price.insert(0, "2000")
        self.price.pack(side="left", padx=4)
        for text in ("1/10", "1/5", "1/4", "1/3", "1/2", "3/4"):
            tk.Button(sale, text=f"скидка {text}", font=font, command=lambda t=text: self.sale(t)).pack(side="left", padx=2)

        self.canvas = tk.Canvas(self, width=600, height=150, bg=BG, highlightthickness=0)
        self.canvas.pack(pady=6)
        self.out = tk.Label(self, font=("Consolas", 11), bg=BG, justify="left", anchor="w", fg=COLOR_C)
        self.out.pack(fill="x")
        self._job = None
        self.pizza()

    def _queue(self, items, i=0):
        """Рисуем фигуры по одной — так видно, как целое делится на части."""
        if i == 0:
            if self._job:
                self.after_cancel(self._job)
            self.canvas.delete("all")
        if i < len(items):
            kind, args, kw = items[i]
            getattr(self.canvas, kind)(*args, **kw)
            self._job = self.after(50, self._queue, items, i + 1)

    def pizza(self):
        p, n = self.pizzas.get(), self.people.get()
        items, r = [], 60
        for k in range(p):
            cx = 80 + k * 145
            for i in range(n):
                extent = 360 / n
                items.append(("create_arc", (cx - r, 75 - r, cx + r, 75 + r),
                              {"start": 90 - (i + 1) * extent, "extent": extent, "fill": PALETTE[i % 12],
                               "outline": BG, "width": 2}))
        self._queue(items)
        share = Fraction(p, n)
        self.out.config(text=(f"{p} пиццы : {n} человек = {p}/{n}" + (f" = {mixed(share)}" if share.denominator != n or share > 1 else "")
                              + " пиццы каждому\n"
                              f"Каждую пиццу режем на {n} кусков (цвет — человек), каждый берёт {p} кусков по 1/{n}."))

    def recipe(self):
        k = Fraction(self.portions.get(), 4)
        ingredients = (("Мука", Fraction(3, 2), "стакана"), ("Молоко", Fraction(5, 4), "стакана"),
                       ("Сахар", Fraction(1, 4), "стакана"), ("Масло", Fraction(1, 2), "ложки"), ("Яйца", Fraction(2), "шт."))
        items = []
        for row, (_, amount, _) in enumerate(ingredients):
            value = amount * k
            for c in range(ceil(value)):
                fill = min(Fraction(1), value - c)
                x, y = 20 + c * 26, 8 + row * 28
                items.append(("create_rectangle", (x, y, x + 20, y + 24), {"fill": EMPTY, "outline": "#ccc"}))
                items.append(("create_rectangle", (x, y + 24 * (1 - fill), x + 20, y + 24), {"fill": COLOR_B, "outline": ""}))
        self._queue(items)
        lines = [f"Рецепт на 4 порции, нужно на {self.portions.get()} → всё умножаем на {mixed(k)}"]
        lines += [f"{name:7} {mixed(amount)} × {mixed(k)} = {mixed(amount * k)} {unit}" for name, amount, unit in ingredients]
        self.out.config(text="\n".join(lines))

    def sale(self, text):
        try:
            price = float(self.price.get().replace(",", "."))
        except ValueError:
            return self.out.config(text="Введите цену", fg=COLOR_A)
        f = Fraction(text)
        d, n = f.denominator, f.numerator
        w = 560 / d
        items = [("create_rectangle", (20 + i * w, 40, 20 + (i + 1) * w, 100),
                  {"fill": COLOR_A if i >= d - n else COLOR_C, "outline": BG, "width": 2}) for i in range(d)]
        self._queue(items)
        self.out.config(fg=COLOR_C, text=(
            f"Скидка {f} ≈ {float(f) * 100:.0f}%:  {price:g} · {f} = {price * f.numerator / d:.0f} ₽\n"
            f"Платим {1 - f} цены:  {price:g} · {1 - f} = {price * (d - n) / d:.0f} ₽\n"
            f"Процент — это дробь со знаменателем 100."))


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Дроби в движении — Python")
        self.configure(bg=BG, padx=16, pady=12)
        font = ("Segoe UI", 11)

        tk.Label(self, text="Дроби в движении", font=("Segoe UI", 20, "bold"), bg=BG).pack(anchor="w")

        ctl = tk.Frame(self, bg=BG)
        ctl.pack(fill="x", pady=6)
        self.num = tk.IntVar(value=3)
        self.den = tk.IntVar(value=4)
        for text, var, lo, hi in (("Числитель", self.num, 0, 12), ("Знаменатель", self.den, 1, 12)):
            tk.Scale(ctl, label=text, variable=var, from_=lo, to=hi, orient="horizontal", length=220,
                     bg=BG, highlightthickness=0, font=font, command=lambda _: self.update_fraction()
                     ).pack(side="left", padx=(0, 16))

        self.title_lbl = tk.Label(self, font=("Segoe UI", 16, "bold"), bg=BG, fg=COLOR_A)
        self.title_lbl.pack(anchor="w")
        self.pies = PieView(self)
        self.pies.pack()
        self.line = NumberLine(self)
        self.line.pack()
        self.info = tk.Label(self, font=font, bg=BG, justify="left")
        self.info.pack(anchor="w", pady=(0, 10))

        # Сложение по шагам
        add = tk.LabelFrame(self, text="Сложение дробей (например: 1/3 + 1/4)", bg=BG, font=font, padx=8, pady=6)
        add.pack(fill="x")
        self.e1, self.e2 = tk.Entry(add, width=8, font=font), tk.Entry(add, width=8, font=font)
        self.e1.insert(0, "1/3")
        self.e2.insert(0, "1/4")
        self.e1.pack(side="left")
        tk.Label(add, text="+", bg=BG, font=font).pack(side="left", padx=4)
        self.e2.pack(side="left")
        tk.Button(add, text="Решить по шагам", command=self.solve, font=font).pack(side="left", padx=8)
        self.steps = tk.Label(self, font=("Consolas", 12), bg=BG, justify="left", anchor="w")
        self.steps.pack(fill="x", pady=6)

        tk.Button(self, text="Зачем нужны дроби? →", font=font, command=lambda: UsesWindow(self)).pack(anchor="w")

        self.update_fraction()
        self.solve()

    def update_fraction(self):
        n, d = self.num.get(), self.den.get()
        self.title_lbl.config(text=f"{n}/{d}")
        self.pies.show(n, d)
        self.line.show(n, d)
        f = Fraction(n, d)
        kind = "правильная" if n < d else ("равна 1" if n == d else "неправильная")
        lines = [f"Тип: {kind}",
                 f"Десятичная: {n / d:.3f}   Проценты: {n / d * 100:.1f}%"]
        if f.denominator != d:
            lines.append(f"Сокращённая: {f}")
        if n > d and n % d:
            lines.append(f"Смешанное число: {n // d} целых и {n % d}/{d}")
        self.info.config(text="\n".join(lines))

    def solve(self):
        try:
            a, b = Fraction(self.e1.get()), Fraction(self.e2.get())
        except (ValueError, ZeroDivisionError):
            self.steps.config(text="Введите дроби в виде 2/5", fg=COLOR_A)
            return
        lcd = a.denominator * b.denominator // gcd(a.denominator, b.denominator)
        a2, b2 = a.numerator * lcd // a.denominator, b.numerator * lcd // b.denominator
        res = a + b
        text = (f"1) Общий знаменатель: НОК({a.denominator}, {b.denominator}) = {lcd}\n"
                f"2) {a} = {a2}/{lcd},   {b} = {b2}/{lcd}\n"
                f"3) {a2}/{lcd} + {b2}/{lcd} = {a2 + b2}/{lcd}\n"
                f"4) Ответ: {res}" + (f" = {float(res):.3f}" if res.denominator != 1 else ""))
        self.steps.config(text=text, fg=COLOR_C)


if __name__ == "__main__":
    App().mainloop()
