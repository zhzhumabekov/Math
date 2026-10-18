// Мобильная версия: на узком экране SVG сжимается вместе с подписями, и они становятся нечитаемыми.
// Увеличиваем мелкие подписи до MIN пикселей на экране; уроки перерисовывают SVG — следим за изменениями.
(() => {
  const MIN = 11, narrow = matchMedia('(max-width: 720px)');
  const fix = svg => {
    const vb = svg.viewBox && svg.viewBox.baseVal, w = svg.getBoundingClientRect().width;
    if (!vb || !vb.width || !w) return;
    const k = w / vb.width;
    if (k >= 1) return;
    svg.querySelectorAll('text').forEach(t => {
      const base = +(t.dataset.fs || t.getAttribute('font-size') || 16);
      t.dataset.fs = base;
      const need = MIN / k;
      t.setAttribute('font-size', (base < need ? need : base).toFixed(1));
    });
  };
  let queued = false;
  const restore = () => document.querySelectorAll('svg text[data-fs]').forEach(t => t.setAttribute('font-size', t.dataset.fs));
  const run = () => { queued = false; if (narrow.matches) document.querySelectorAll('svg').forEach(fix); else restore(); };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  addEventListener('resize', schedule);
  schedule();
})();
