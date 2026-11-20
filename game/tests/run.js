#!/usr/bin/env node
'use strict';
/* SpacEgg test koşucusu. Kullanım: node tests/run.js [dist/SpacEgg.html] [--only=ad] [--json=yol]
   Modül yoksa test 'ATLANDI' olur (başarısız sayılmaz). Çıkış kodu: başarısız varsa 1. */
const path = require('path'), fs = require('fs');
const { launch, sleep } = require('./lib/cdp');
const root = path.resolve(__dirname, '..');
const arg = process.argv.slice(2);
const file = path.resolve(arg.find(a => !a.startsWith('--')) || path.join(root, 'dist', 'SpacEgg.html'));
const only = (arg.find(a => a.startsWith('--only=')) || '').slice(7);
const jsonOut = (arg.find(a => a.startsWith('--json=')) || '').slice(7) || path.join(__dirname, 'last-result.json');
const URL_ = 'file://' + file;
const results = [];
const NEW_VIEWS = ['create', 'cosmos', 'journal', 'saves', 'prefs'];
let B;

/* Tarayıcı derlemesinde audio/m*.ogg yoktur (yalnız APK assets'inde); oyun sentez müziğe düşer. Zararsız. */
const BENIGN = /audio\/m\d+\.ogg|müzik dosyası açılamadı|favicon/;
const errs = p => p.errors.filter(e => !BENIGN.test(e));
const has = (p, expr) => p.ev('!!(' + expr + ')');
async function open(o = {}, hash = '', q = '?test=1') {
  const p = await B.page(o);
  await p.goto(URL_ + q + hash);
  await p.waitFor('window.SG&&SG.current&&document.getElementById("app").getAttribute("data-view")', 6000);
  await p.sleep(300);
  return p;
}
async function register(p, name, pass) {
  await p.click('#lgt-up'); await p.sleep(250);
  await p.type('#ln', name); await p.type('#lp', pass); await p.type('#lp2', pass);
  await p.sleep(200); await p.enter();
  return p.waitFor('SG.G.user()&&SG.current()!=="login"', 5000);
}
const view = p => p.ev('SG.current()');

const T = {};
T.acilis_giris = async (t, ) => {
  const p = await open();
  const v = await view(p);
  t.ok(v === 'login', 'ilk görünüm login: ' + v);
  t.ok(await has(p, 'document.querySelector("#ln")&&document.querySelector("#lp")'), 'kullanıcı adı ve parola alanları var');
  t.ok(await p.ev('SG.store.get("session",null)===null'), 'oturum kaydı yok');
  t.ok(errs(p).length === 0, 'konsol hatası: ' + errs(p).join(' | '));
  await p.close();
};
T.kayit_giris_cikis = async t => {
  const p = await open();
  const ok = await register(p, 'qatest', 'Parola9x');
  t.ok(ok, 'kayıt sonrası giriş yapıldı; görünüm=' + await view(p));
  t.ok(['hub', 'create', 'cosmos'].includes(await view(p)), 'giriş sonrası görünüm uygun: ' + await view(p));
  await p.ev('SG.G.logout()'); await p.sleep(400);
  t.ok(await view(p) === 'login', 'çıkış sonrası login');
  t.ok(await p.ev('location.hash')==='#/login', 'hash #/login');
  // yanlış parola
  await p.type('#ln', 'qatest'); await p.type('#lp', 'yanlis'); await p.enter(); await p.sleep(600);
  t.ok(await view(p) === 'login' && await p.ev('(document.getElementById("lp-m")||{textContent:""}).textContent.length>0||(document.querySelector(".lgm-err")||{textContent:""}).textContent.length>0'), 'yanlış parola login\'de kalır ve hata gösterir');
  await p.type('#lp', 'Parola9x'); await p.enter();
  t.ok(await p.waitFor('SG.G.user()&&SG.current()!=="login"', 4000), 'doğru parola ile giriş');
  t.ok(errs(p).length === 0, 'konsol hatası: ' + errs(p).join(' | '));
  await p.close();
};
T.hash_koruma = async t => {
  const routes = ['hub', 'egg', 'world', 'cosmos', 'journal', 'saves', 'prefs', 'create', 'settings'];
  for (const r of routes) {
    const p = await open({}, '#/' + r);
    const v = await view(p);
    t.ok(v === 'login', `oturumsuz #/${r} -> login (${v})`);
    await p.close();
  }
  const p = await open();
  await p.ev('location.hash="#/cosmos"'); await p.sleep(400);
  t.ok(await view(p) === 'login', 'çalışırken hash değişimi de login\'e döner');
  t.ok(errs(p).length === 0, 'konsol hatası: ' + errs(p).join(' | '));
  await p.close();
};
T.oturum_yeniden_acilis = async t => {
  const p = await open();
  await register(p, 'qatest2', 'Parola9x');
  await p.goto(URL_ + '?test=1'); await p.sleep(900);
  t.ok(await view(p) === 'login', 'yeniden yüklemede oturumsuz başlar');
  t.ok(await p.ev('SG.store.get("session",null)===null'), 'sg1_session temiz');
  await p.close();
};
const SIZES = [[390, 800], [360, 640]];
T.tasma = async t => {
  for (const [w, h] of SIZES) {
    const p = await open({ w, h });
    const chk = async (n) => {
      const r = await p.ev('({sw:document.documentElement.scrollWidth,iw:innerWidth,bw:document.body.scrollWidth})');
      t.ok(r.sw <= r.iw + 1 && r.bw <= r.iw + 1, `${w}x${h} ${n}: yatay taşma yok (${r.sw}/${r.iw})`);
    };
    await chk('login');
    await register(p, 'tasma' + w, 'Parola9x');
    const routes = await p.ev('SG.routes.filter(function(r){return r!=="login"})');
    for (const r of routes) {
      await p.ev(`SG.go(${JSON.stringify(r)})`); await p.sleep(450);
      if (await view(p) !== r) { t.skip(`${w}x${h} ${r}: erişilemedi`); continue; }
      await chk(r);
    }
    t.ok(errs(p).length === 0, `${w}x${h} konsol hatası: ` + errs(p).join(' | '));
    await p.close();
  }
};
T.hareket_azaltma = async t => {
  const p = await open({ reducedMotion: true });
  t.ok(await p.ev('SG.RM===true'), 'prefers-reduced-motion -> SG.RM true');
  const inf = await p.ev('document.getAnimations().filter(function(a){var e=a.effect&&a.effect.getComputedTiming();return a.playState==="running"&&e&&e.iterations===Infinity}).length');
  t.info('sonsuz CSS animasyonu: ' + inf);
  t.ok(inf <= 3, 'hareket azaltmada sürekli CSS animasyonu az (' + inf + ')');
  t.ok(errs(p).length === 0, 'konsol hatası: ' + errs(p).join(' | '));
  await p.close();
};
T.klavye = async t => {
  const p = await open();
  const seen = new Set(); let body = 0;
  for (let i = 0; i < 8; i++) {
    await p.tab(); await p.sleep(60);
    const a = await p.ev('(function(){var e=document.activeElement;return e?(e.tagName+"#"+(e.id||e.className||"")):"none"})()');
    if (a.startsWith('BODY')) body++; seen.add(a);
  }
  t.ok(seen.size >= 3, 'Tab ile en az 3 farklı öğeye odak (' + seen.size + ')');
  t.ok(body <= 1, 'odak gövdeye düşmüyor / tuzak yok');
  await p.ev('document.querySelector("#ln").focus()');
  await p.type('#ln', 'klavye'); await p.type('#lp', 'Parola9x');
  await p.click('#lgt-up'); await p.sleep(200);
  t.ok(await has(p, 'document.querySelector("[role=tab][aria-selected=true]")'), 'sekme aria-selected var');
  t.ok(await p.ev('SG.$$("button,input,a,[tabindex]").every(function(e){return e.offsetParent===null||e.getBoundingClientRect().width>0})'), 'görünür etkileşimli öğelerin boyutu var');
  t.ok(errs(p).length === 0, 'konsol hatası: ' + errs(p).join(' | '));
  await p.close();
};
T.dokunma_alani = async t => {
  const p = await open();
  await register(p, 'dokunma', 'Parola9x');
  const small = await p.ev(`(function(){var bad=[];SG.$$("button,[role=button],a[href]").forEach(function(e){if(e.offsetParent===null)return;var r=e.getBoundingClientRect();if(r.width&&(r.width<40||r.height<40))bad.push((e.getAttribute("aria-label")||e.textContent||e.className).slice(0,20)+" "+Math.round(r.width)+"x"+Math.round(r.height))});return bad})()`);
  t.info('40px altı düğmeler: ' + (small.join('; ') || 'yok'));
  t.ok(small.length <= 3, 'küçük dokunma hedefi sayısı ≤3 (' + small.length + ')');
  await p.close();
};
T.kayit_sistemi = async t => {
  const p = await open();
  if (!await has(p, 'window.SG&&SG.S&&SG.S.create')) { t.skip('SG.S yok'); await p.close(); return; }
  await register(p, 'kayitqa', 'Parola9x');
  await p.ev('SG.S.setUser("kayitqa")');
  const r = await p.ev(`(function(){var u=SG.S.create({name:"Test Evreni",seed:"qa-seed-1",preset:"sakin"});SG.S.save();
    var l=SG.S.list();var id=u.id;var again=SG.S.open(id);var tx=SG.S.exportText(id);var imp=SG.S.importText(tx);
    return {n:l.length,name:again&&again.name,seed:again&&again.seed,txp:tx.slice(0,5),impok:imp&&imp.ok,impid:imp&&imp.id,id:id}})()`);
  t.ok(r.n >= 1 && r.name === 'Test Evreni' && r.seed === 'qa-seed-1', 'oluştur/kaydet/aç turu');
  t.ok(r.txp === 'SGU2:' && r.impok === true, 'dışa/içe aktarma turu (SGU2:)');
  const bad = await p.ev('SG.S.importText("SGU2:bozuk-veri-123")');
  t.ok(bad && bad.ok === false, 'bozuk içe aktarma reddedilir (hata: ' + (bad && bad.error) + ')');
  const det = await p.ev(`(function(){var a=SG.U.gen("det-1"),b=SG.U.gen("det-1");return JSON.stringify(a.galaxies)===JSON.stringify(b.galaxies)})()`).catch(() => null);
  if (det === null) t.skip('SG.U yok'); else t.ok(det, 'aynı tohum aynı evreni üretir');
  // bozuk kayıt kurtarma
  const rec = await p.ev(`(function(){var id=SG.S.list()[0].id;var keys=Object.keys(localStorage).filter(function(k){return k.indexOf("sg2_kayitqa_")===0&&k.slice(-id.length-2)==="u_"+id});
    SG.S.save();SG.S.setUser(null); if(keys.length)localStorage.setItem(keys[0],"{bozuk");SG.S.setUser("kayitqa");var o=SG.S.open(id);var st=SG.S.status&&SG.S.status();
    var cor=Object.keys(localStorage).some(function(k){return k.indexOf("sg2_corrupt_")>=0});return {opened:!!o,st:st,cor:cor,hadKey:keys.length>0}})()`);
  if (!rec.hadKey) t.skip('kayıt anahtarı biçimi tahmin edilemedi, kurtarma testi atlandı');
  else { t.ok(rec.opened, 'bozuk kayıt sonrası yedekten açıldı'); t.ok(rec.cor, 'bozuk veri sg2_corrupt_ olarak saklandı'); }
  t.ok(errs(p).length === 0, 'konsol hatası: ' + errs(p).join(' | '));
  await p.close();
};
T.yeni_gorunumler = async t => {
  const p0 = await open();
  const avail = await p0.ev('SG.routes.slice()'); await p0.close();
  const mods = NEW_VIEWS.filter(v => avail.includes(v));
  if (!mods.length) { t.skip('2.0 görünümleri henüz yok'); return; }
  const p = await open();
  await register(p, 'gorunum', 'Parola9x');
  if (await has(p, 'window.SG.S&&SG.S.create')) { await p.ev('SG.S.setUser("gorunum");SG.S.create({name:"Duman",seed:"smoke-1"})'); }
  for (const v of NEW_VIEWS) {
    if (!avail.includes(v)) { t.skip('route yok: ' + v); continue; }
    await p.ev(`SG.go(${JSON.stringify(v)})`); await p.sleep(900);
    const cur = await view(p);
    t.ok(cur === v, `görünüm açıldı: ${v} (${cur})`);
    t.ok(await has(p, 'document.getElementById("app").children.length>0'), `${v} içerik çizdi`);
    if (v === 'cosmos') {
      t.ok(await has(p, 'document.querySelector("canvas")'), 'cosmos canvas var');
      const f = await p.ev('(function(){return SG.P?SG.P.fps():-1})()'); t.info('cosmos fps (başsız): ' + f);
      await p.ev('document.querySelector("canvas").dispatchEvent(new WheelEvent("wheel",{deltaY:-300,clientX:195,clientY:400,bubbles:true,cancelable:true}))'); await p.sleep(400);
    }
  }
  t.ok(errs(p).length === 0, 'konsol hatası: ' + errs(p).join(' | '));
  await p.close();
};
T.perf = async t => {
  const p = await open();
  if (!await has(p, 'window.SG&&SG.P')) { t.skip('SG.P yok'); await p.close(); return; }
  const tier = await p.ev('SG.P.tier()');
  t.ok([0, 1, 2].includes(tier), 'başlangıç kademesi 0..2: ' + tier);
  await p.sleep(1500);
  const rep = await p.ev('SG.P.report()');
  t.ok(rep.fps > 5 && rep.samples > 10, 'ölçüm toplanıyor (fps ' + rep.fps + ', örnek ' + rep.samples + ')');
  t.ok(['fps', 'p95ms', 'tier', 'longTasks', 'hints'].every(k => k in rep), 'report() alanları tam');
  const r = await p.ev(`(function(){var got=[];SG.bus.on("p:tier",function(n){got.push(n)});
    SG.P.setTier(2);var a=SG.P.tier(),m1=SG.P.mode(),q1=SG.store.get("quality");
    SG.P.setTier(0);var b=SG.P.tier(),q2=SG.store.get("quality");
    SG.P.setTier("auto");var m3=SG.P.mode();SG.P.setTier(2);SG.P.setTier("auto");
    var before=SG.P.tier();SG.P._test.decide(20);var after=SG.P.tier();
    SG.P.setTier(1);var man=SG.P.tier();SG.P._test.decide(20);var man2=SG.P.tier();
    return {a:a,m1:m1,q1:q1,b:b,q2:q2,m3:m3,before:before,after:after,man:man,man2:man2,got:got}})()`);
  t.ok(r.a === 2 && r.m1 === 'manual' && r.q1 === 'high', 'setTier(2) elle: kalite=high, mod manual');
  t.ok(r.b === 0 && r.q2 === 'low', 'setTier(0): kalite=low');
  t.ok(r.m3 === 'auto', 'setTier("auto") otomatiğe döner');
  t.ok(r.before === 0 ? r.after === 0 : r.after === r.before - 1, `düşük fps (20) bir kademe düşürür (${r.before}->${r.after})`);
  t.ok(r.man2 === r.man, 'elle seçimde otomatik düşürme yapmaz');
  t.ok(r.got.length >= 3, 'p:tier olayı yayınlanır (' + r.got.length + ')');
  t.ok(errs(p).length === 0, 'konsol hatası: ' + errs(p).join(' | '));
  await p.close();
};
T.yasam_dongusu = async t => {
  const p = await open();
  await register(p, 'yasam', 'Parola9x');
  await p.ev('window.dispatchEvent(new Event("sg-pause"))'); await p.sleep(300);
  await p.ev('window.dispatchEvent(new Event("sg-resume"))'); await p.sleep(600);
  t.ok(await p.ev('SG.G.user()!==null'), 'pause/resume sonrası oturum korunur');
  t.ok(errs(p).length === 0, 'pause/resume konsol hatası: ' + errs(p).join(' | '));
  await p.close();
};

function mk(name) {
  const r = { name, status: 'GECTI', checks: [], notes: [], ms: 0 };
  return { r,
    ok(c, msg) { r.checks.push({ ok: !!c, msg }); if (!c) r.status = 'KALDI'; },
    skip(msg) { r.checks.push({ skip: true, msg }); if (r.status === 'GECTI' && !r.checks.some(c => c.ok !== undefined)) r.status = 'ATLANDI'; },
    info(msg) { r.notes.push(msg); } };
}
(async () => {
  if (!fs.existsSync(file)) { console.error('Dosya yok: ' + file + '\nÖnce: python3 -I build.py'); process.exit(2); }
  B = await launch();
  const names = Object.keys(T).filter(n => !only || n === only);
  for (const n of names) {
    const t = mk(n), t0 = Date.now();
    try { await T[n](t); } catch (e) { t.ok(false, 'İSTİSNA: ' + e.message); }
    t.r.ms = Date.now() - t0; results.push(t.r);
    console.log(`${t.r.status.padEnd(8)} ${n.padEnd(24)} ${t.r.ms}ms`);
    t.r.checks.filter(c => c.ok === false).forEach(c => console.log('   ✗ ' + c.msg));
    t.r.checks.filter(c => c.skip).forEach(c => console.log('   - atlandı: ' + c.msg));
    t.r.notes.forEach(m => console.log('   · ' + m));
  }
  B.close();
  const sum = { pass: results.filter(r => r.status === 'GECTI').length, fail: results.filter(r => r.status === 'KALDI').length, skip: results.filter(r => r.status === 'ATLANDI').length };
  const checks = results.reduce((a, r) => a + r.checks.filter(c => c.ok !== undefined).length, 0);
  console.log(`\nÖZET: ${sum.pass} geçti, ${sum.fail} kaldı, ${sum.skip} atlandı (${checks} denetim) — ${path.basename(file)}`);
  fs.writeFileSync(jsonOut, JSON.stringify({ file, when: new Date().toISOString(), summary: sum, results }, null, 1));
  process.exit(sum.fail ? 1 : 0);
})().catch(e => { console.error(e); try { B && B.close(); } catch (_) {} process.exit(2); });
