const $ = id => document.getElementById(id);
// href — путь к готовому уроку; без href тема показана как «скоро»
const COURSE = [
  { title: 'Базовая математика', goal: 'научиться понимать формулы, зависимости и вычисления', lessons: [
    { ico: '🍕', name: 'Дроби', about: 'части целого, сложение, сокращение', href: 'lessons/fractions/index.html' },
    { ico: '💯', name: 'Проценты', about: 'скидки, налоги, проценты на проценты', href: 'lessons/percents/index.html' },
    { ico: '🚀', name: 'Степени', about: 'быстрый рост, большие и малые числа', href: 'lessons/powers/index.html' },
    { ico: '📐', name: 'Корни', about: 'обратное действие к степени', href: 'lessons/roots/index.html' },
    { ico: '⚖️', name: 'Алгебра', about: 'переменные, выражения, уравнения', href: 'lessons/algebra/index.html' },
    { ico: '📈', name: 'Функции', about: 'линейные, квадратичные, экспонента, логарифм' },
    { ico: '🗺️', name: 'Графики функций', about: 'координатная плоскость' },
    { ico: '⛰️', name: 'Производная', about: 'скорость изменения, минимум и максимум' },
  ] },
  { title: 'Линейная алгебра', goal: 'понимать, как модели работают с числовыми данными', lessons: [
    { ico: '➡️', name: 'Векторы', about: 'операции с векторами' },
    { ico: '🔢', name: 'Матрицы', about: 'операции с матрицами' },
    { ico: '✖️', name: 'Скалярное произведение', about: 'насколько векторы похожи' },
    { ico: '🧮', name: 'Умножение матриц', about: 'строка на столбец' },
    { ico: '📦', name: 'Размерности и формы', about: 'shape массивов' },
    { ico: '📏', name: 'Норма и расстояние', about: 'длина вектора, близость объектов' },
  ] },
  { title: 'Теория вероятностей и статистика', goal: 'самый важный математический блок для Data Science', lessons: [
    { ico: '📊', name: 'Среднее, медиана, мода', about: 'типичное значение' },
    { ico: '↔️', name: 'Дисперсия и отклонение', about: 'разброс данных' },
    { ico: '🎲', name: 'Вероятность', about: 'и условная вероятность' },
    { ico: '🔔', name: 'Распределения', about: 'нормальное и Бернулли' },
    { ico: '🔗', name: 'Корреляция и ковариация', about: 'связь двух величин' },
    { ico: '🥄', name: 'Выборка', about: 'и генеральная совокупность' },
    { ico: '🎯', name: 'Доверительные интервалы', about: 'насколько точна оценка' },
    { ico: '🧪', name: 'Гипотезы и p-value', about: 'случайность или эффект' },
  ] },
  { title: 'Python для Data Science', goal: 'применять математику на реальных данных', lessons: [
    { ico: '🐍', name: 'Основы Python', about: 'переменные, типы, условия, циклы' },
    { ico: '📚', name: 'Списки, словари, функции', about: 'структуры данных' },
    { ico: '🔲', name: 'NumPy', about: 'массивы, векторизация, матрицы' },
    { ico: '🐼', name: 'Pandas', about: 'DataFrame, фильтры, группировка, join' },
    { ico: '🎨', name: 'Matplotlib и Seaborn', about: 'построение графиков' },
    { ico: '📓', name: 'Jupyter Notebook', about: 'исследование данных' },
  ] },
  { title: 'Анализ и подготовка данных', goal: 'одна из самых востребованных частей работы', lessons: [
    { ico: '📥', name: 'Загрузка данных', about: 'CSV, Excel, SQL' },
    { ico: '🧹', name: 'Очистка и пропуски', about: 'что делать с пустыми ячейками' },
    { ico: '🔍', name: 'Выбросы и дубликаты', about: 'поиск странных значений' },
    { ico: '🗂️', name: 'Группировка и агрегация', about: 'итоги по категориям' },
    { ico: '🔎', name: 'EDA', about: 'исследовательский анализ' },
    { ico: '⚙️', name: 'Масштабирование и кодирование', about: 'подготовка признаков' },
    { ico: '✂️', name: 'Обучение и тест', about: 'разделение выборки' },
  ] },
  { title: 'Машинное обучение', goal: 'строить модели, которые прогнозируют результаты', lessons: [
    { ico: '👩‍🏫', name: 'С учителем и без', about: 'виды обучения' },
    { ico: '📉', name: 'Регрессия', about: 'линейная и логистическая' },
    { ico: '🌳', name: 'Деревья решений', about: 'вопросы «да / нет»' },
    { ico: '🌲', name: 'Random Forest', about: 'лес из деревьев' },
    { ico: '🚀', name: 'Градиентный бустинг', about: 'исправляем ошибки по шагам' },
    { ico: '🫧', name: 'K-means', about: 'кластеризация' },
    { ico: '🎭', name: 'Переобучение', about: 'и недообучение' },
    { ico: '🎯', name: 'Метрики', about: 'MAE, RMSE, Accuracy, Precision, Recall, F1' },
    { ico: '🔁', name: 'Кросс-валидация', about: 'честная проверка модели' },
  ] },
  { title: 'SQL и практические проекты', goal: 'превратить знания в профессиональные навыки', lessons: [
    { ico: '🗄️', name: 'SQL: основы', about: 'SELECT, WHERE, GROUP BY, JOIN' },
    { ico: '🪟', name: 'Агрегация и оконные функции', about: 'итоги без потери строк' },
    { ico: '💰', name: 'Анализ продаж', about: 'и финансовых показателей' },
    { ico: '🔮', name: 'Прогноз спроса', about: 'или стоимости' },
    { ico: '👥', name: 'Классификация клиентов', about: 'кто уйдёт, кто купит' },
    { ico: '🏭', name: 'ML-пайплайн', about: 'полный путь на scikit-learn' },
  ] },
];

const all = COURSE.flatMap(b => b.lessons), done = all.filter(l => l.href).length;
$('progText').textContent = `Готово уроков: ${done} из ${all.length}`;
$('progBar').style.width = (done / all.length * 100) + '%';
$('nav').innerHTML = COURSE.map((b, i) => `<a href="#b${i + 1}">${i + 1}. ${b.title}</a>`).join('');
$('blocks').innerHTML = COURSE.map((b, i) => {
  const ready = b.lessons.filter(l => l.href).length;
  return `<section id="b${i + 1}">
    <h2>${i + 1}. ${b.title} <small>${ready} из ${b.lessons.length}</small></h2>
    <p class="lead">Цель: ${b.goal}.</p>
    <div class="lessons">${b.lessons.map(l => {
      const inner = `<div class="ico">${l.ico}</div><b>${l.name}</b><p>${l.about}</p>
        <span class="tag">${l.href ? 'Открыть →' : 'скоро'}</span>`;
      return l.href ? `<a class="lesson" href="${l.href}">${inner}</a>`
                    : `<div class="lesson soon">${inner}</div>`;
    }).join('')}</div>
  </section>`;
}).join('');
