#!/usr/bin/env node
'use strict';
/* Ölçüm: bundle boyutu, açılış süresi, boş kare süresi. Kullanım: node tests/bench.js <html> [--json=yol]
   Not: başsız Chrome yazılım çizimi kullanır (GPU yok) → kare süreleri gerçek telefondan KÖTÜMSERDİR; sürümler arası karşılaştırma içindir. */
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const { launch } = require('./lib/cdp');
const file = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || 'dist/SpacEgg.html');
const jsonOut = (process.argv.find(a => a.startsWith('--json=')) || '').slice(7);
const INIT = `(function(){window.__f=[];window.__lt=[];var l=0;function f(t){if(l)window.__f.push(t-l);l=t;requestAnimationFrame(f)}requestAnimationFrame(f);
try{new PerformanceObserver(function(x){x.getEntries().forEach(function(e){window.__lt.push(e.duration)})}).observe({entryTypes:['longtask']})}catch(e){}})();`;
const stat = a => { if (!a.length) return {}; const s = a.slice().sort((x, y) => x - y), n = s.length, avg = s.reduce((x, y) => x + y, 0) / n;
  return { n, avgMs: +avg.toFixed(1), fps: +(1000 / avg).toFixed(1), p50: +s[n >> 1].toFixed(1), p95: +s[Math.floor(n * .95)].toFixed(1), max: +s[n - 1].toFixed(1) }; };
(async () => {
  const buf = fs.readFileSync(file);
  const out = { file, bytes: buf.length, gzip: zlib.gzipSync(buf, { level: 9 }).length, scripts: (buf.toString().match(/<script/g) || []).length };
  const B = await launch();
  for (const [name, w, h] of [['390x800', 390, 800]]) {
    const p = await B.page({ w, h, init: INIT });
    const t0 = Date.now();
    await p.goto('file://' + file + '?test=1');
    await p.waitFor('window.SG&&document.getElementById("app").getAttribute("data-view")', 8000);
    out.loadMs = Date.now() - t0;
    out.nav = await p.ev('(function(){var n=performance.getEntriesByType("navigation")[0],fcp=performance.getEntriesByType("paint").filter(function(e){return e.name==="first-contentful-paint"})[0];return {domContentLoaded:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd),fcp:fcp?Math.round(fcp.startTime):null}})()');
    out.heapMB = await p.ev('performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):null');
    await p.sleep(1000); await p.ev('window.__f.length=0;window.__lt.length=0'); await p.sleep(4000);
    out.login = Object.assign(stat(await p.ev('window.__f')), { longTasks: (await p.ev('window.__lt')).length });
    await p.click('#lgt-up'); await p.sleep(200);
    await p.type('#ln', 'benchq'); await p.type('#lp', 'Parola9x'); await p.type('#lp2', 'Parola9x'); await p.enter();
    await p.waitFor('SG.G&&SG.G.user()&&SG.current()!=="login"', 5000);
    out.afterLoginView = await p.ev('SG.current()');
    await p.sleep(1500); await p.ev('window.__f.length=0;window.__lt.length=0'); await p.sleep(4000);
    out.afterLogin = Object.assign(stat(await p.ev('window.__f')), { longTasks: (await p.ev('window.__lt')).length });
    for (const r of ['world', 'galaxy', 'cosmos']) {
      if (!await p.ev(`SG.routes.indexOf(${JSON.stringify(r)})>=0`)) continue;
      await p.ev(`SG.go(${JSON.stringify(r)})`); await p.sleep(1500); await p.ev('window.__f.length=0;window.__lt.length=0'); await p.sleep(4000);
      out['view_' + r] = Object.assign(stat(await p.ev('window.__f')), { longTasks: (await p.ev('window.__lt')).length });
    }
    out.heapEndMB = await p.ev('performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):null');
    await p.close();
  }
  B.close();
  console.log(JSON.stringify(out, null, 1));
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(out, null, 1));
})().catch(e => { console.error(e); process.exit(2); });
