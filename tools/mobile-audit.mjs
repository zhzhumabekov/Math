// Мобильный аудит уроков через Chrome DevTools Protocol (Edge без окна).
// node tools/mobile-audit.mjs <папка для снимков> 375 <file1.html> [file2.html ...]
// Для каждой страницы: эмуляция телефона, отчёт (вылезающие элементы, мелкий текст, маленькие кнопки) и снимок всей страницы.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename, dirname } from 'node:path';

const [outDir, widthArg, ...files] = process.argv.slice(2);
const WIDTH = +widthArg || 375, PORT = 9333;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile = mkdtempSync(join(tmpdir(), 'edge-cdp-'));
const browser = spawn(EDGE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* браузер ещё запускается */ }
    await sleep(200);
  }
  throw new Error('нет связи с браузером');
}

const AUDIT = `(() => {
  const W = document.documentElement.clientWidth, out = [];
  const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).join('.') : '');
  const path = e => { const p = []; for (let x = e; x && x !== document.body && p.length < 3; x = x.parentElement) p.unshift(name(x)); return p.join(' > '); };
  const clipped = e => { for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { if (/(auto|scroll|hidden)/.test(getComputedStyle(x).overflowX)) return true; } return false; };
  const wide = new Map();
  document.querySelectorAll('body *').forEach(e => {
    if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') return;
    const r = e.getBoundingClientRect();
    if (r.width && r.right > W + 1 && !clipped(e)) { const k = path(e); if (!wide.has(k)) wide.set(k, Math.round(r.right - W)); }
  });
  [...wide].slice(0, 15).forEach(([k, d]) => out.push('WIDE +' + d + 'px: ' + k));
  const small = new Map();
  document.querySelectorAll('body *').forEach(e => {
    if (e.closest('svg')) return;
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 12) { const k = name(e); small.set(k, Math.min(fs, small.get(k) || 99)); }
  });
  [...small].slice(0, 10).forEach(([k, f]) => out.push('SMALLTEXT ' + f + 'px: ' + k));
  const tiny = new Map();
  document.querySelectorAll('button, select, input, a, .chip.click, .mc.click').forEach(e => {
    const r = e.getBoundingClientRect();
    if (r.width && r.height < 32) { const k = name(e); tiny.set(k, Math.min(Math.round(r.height), tiny.get(k) || 99)); }
  });
  [...tiny].slice(0, 10).forEach(([k, h]) => out.push('TINY ' + h + 'px: ' + k));
  let svgMin = 99, svgWho = '';
  document.querySelectorAll('svg text').forEach(t => { const r = t.getBoundingClientRect(); if (r.height > 0 && t.textContent.trim() && r.height < svgMin) { svgMin = r.height; svgWho = (t.closest('svg').id || t.closest('section')?.id || '') + ' «' + t.textContent.slice(0, 20) + '» fs=' + t.getAttribute('font-size') + ' vb=' + t.closest('svg').getAttribute('viewBox') + ' w=' + Math.round(t.closest('svg').getBoundingClientRect().width); } });
  if (svgMin < 99) out.push('SVG min text ' + svgMin.toFixed(1) + 'px (' + svgWho + ')');
  out.unshift('viewport ' + W + 'px, scrollWidth ' + document.documentElement.scrollWidth + 'px, height ' + document.documentElement.scrollHeight + 'px');
  return JSON.stringify(out);
})()`;

const ws = new WebSocket(await connect());
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0;
const waiters = new Map(), events = [];
ws.addEventListener('message', m => {
  const msg = JSON.parse(m.data);
  if (msg.id && waiters.has(msg.id)) { waiters.get(msg.id)(msg); waiters.delete(msg.id); }
  else if (msg.method) events.push(msg.method);
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; waiters.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 800, deviceScaleFactor: 1, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
for (const f of files) {
  events.length = 0;
  await send('Page.navigate', { url: 'file:///' + f.replace(/\\/g, '/') });
  for (let i = 0; i < 100 && !events.includes('Page.loadEventFired'); i++) await sleep(100);
  await sleep(2500);
  const res = await send('Runtime.evaluate', { expression: AUDIT, returnByValue: true });
  const report = JSON.parse(res.result.result.value);
  const tag = basename(dirname(f)) === 'Math' ? 'home' : basename(dirname(f));
  const errs = events.filter(e => e === 'Runtime.exceptionThrown').length;
  console.log(`== ${tag}${errs ? ` — ОШИБОК JS: ${errs}` : ''}\n  ` + report.join('\n  '));
  const h = +report[0].match(/height (\d+)/)[1];
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: WIDTH, height: h, scale: 1 } });
  writeFileSync(join(outDir, `m-${tag}.png`), Buffer.from(shot.result.data, 'base64'));
}
ws.close();
browser.kill();
