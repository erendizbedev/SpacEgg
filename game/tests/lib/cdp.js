'use strict';
/* Minimal Chrome DevTools Protocol istemcisi (Node 22, yerleşik WebSocket; bağımlılık yok) */
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p => fs.existsSync(p));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch() {
  if (!CHROME) throw new Error('Chrome bulunamadı (CHROME ortam değişkeni ile belirt)');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgqa-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, ['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--mute-audio',
    '--autoplay-policy=no-user-gesture-required','--allow-file-access-from-files',
    '--remote-debugging-port=' + port, '--user-data-dir=' + dir, 'about:blank'], { stdio: 'ignore' });
  let info = null;
  for (let i = 0; i < 60 && !info; i++) {
    try { info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch (e) { await sleep(150); }
  }
  if (!info) { proc.kill(); throw new Error('Chrome açılmadı'); }
  const ws = new WebSocket(info.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pend = new Map(), hands = [];
  ws.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
    else hands.forEach(h => h(d));
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });

  async function page(o = {}) {
    const w = o.w || 390, h = o.h || 800;
    const ctx = await send('Target.createBrowserContext');
    const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId: ctx.browserContextId });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const S = (m, p) => send(m, p, sessionId);
    const errors = [], logs = [];
    const hh = d => {
      if (d.sessionId !== sessionId) return;
      if (d.method === 'Runtime.exceptionThrown') errors.push((d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description) || d.params.exceptionDetails.text);
      if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error: ' + d.params.args.map(a => a.value || a.description).join(' '));
      if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/favicon/.test(d.params.entry.text + (d.params.entry.url || ''))) errors.push('log: ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
    };
    hands.push(hh);
    await S('Page.enable'); await S('Runtime.enable'); await S('Log.enable');
    await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: o.dpr || 2, mobile: true });
    if (o.reducedMotion) await S('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    if (o.init) await S('Page.addScriptToEvaluateOnNewDocument', { source: o.init });
    const P = {
      errors, send: S, w, h,
      async goto(url) { const lp = new Promise(r => { const f = d => { if (d.sessionId === sessionId && d.method === 'Page.loadEventFired') { hands.splice(hands.indexOf(f), 1); r(); } }; hands.push(f); }); await S('Page.navigate', { url }); await lp; },
      async ev(expr) {
        const r = await S('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error('ev: ' + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
        return r.result.value;
      },
      async waitFor(expr, ms = 4000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await P.ev(expr)) return true; } catch (e) {} await sleep(80); } return false; },
      async type(sel, text) { await P.ev(`(function(){var e=document.querySelector(${JSON.stringify(sel)});e.focus();e.value='';})()`); await S('Input.insertText', { text }); },
      async key(key, code, vk) { const base = { key, code: code || key, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }; await S('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown', text: key === 'Enter' ? '\r' : undefined }, base)); await S('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, base)); },
      enter() { return P.key('Enter', 'Enter', 13); },
      tab(shift) { return S('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: shift ? 8 : 0 }).then(() => S('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })); },
      async click(sel) { return P.ev(`(function(){var e=document.querySelector(${JSON.stringify(sel)});if(!e)return false;e.click();return true;})()`); },
      async close() { try { await send('Target.closeTarget', { targetId }); await send('Target.disposeBrowserContext', { browserContextId: ctx.browserContextId }); } catch (e) {} hands.splice(hands.indexOf(hh), 1); },
      sleep,
    };
    return P;
  }
  return { page, close() { try { ws.close(); } catch (e) {} proc.kill('SIGKILL'); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} } };
}
module.exports = { launch, sleep, CHROME };
