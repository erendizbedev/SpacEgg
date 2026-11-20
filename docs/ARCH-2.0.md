# SpacEgg 2.0 — "Universe Creation Simulator" Mimari Sözleşmesi (bağlayıcı)

Kaynak belge: SpacEgg_Urun_Tasarim_ve_Gelistirme_Stratejisi.md. Slogan: "Create a universe. Witness its story."
Ürün vaadi: "Hiçlikten bir evren yarat. Galaksileri keşfet. Yıldızların ve dünyaların hikâyesini şekillendir."

## 0. Kapsam kilidi (dikey dilim)
İÇİNDE: evren oluşturma (tohum+ad), Evren→Galaksi→Yıldız sistemi→Gezegen kesintisiz yakınlaştırma, zaman hızlandırma/yavaşlatma/durdurma,
yıldız yaşam döngüsü, yörüngeler, kozmik olaylar, gezegen iklimi (neden-sonuç kararları), keşif hedefleri, günlük, kaydetme/dışa-içe aktarma/yedek,
başlangıç eğitimi, erişilebilirlik, kalite kademeleri, fotoğraf modu, ölçüm/test altyapısı.
DIŞINDA (dondurulmuş): yaşam/ekosistem/medeniyet simülasyonu, uzaylı saldırısı senaryosu (docs/SENARYO-ILERI-SURUM.md yedekte KALIR), gerçek para/bağış ödeme/soğuk cüzdan işlevi.
Giriş sayfasındaki vizyon metni (%10 bağış sözü, blockchain/soğuk cüzdan vizyonu, Fambo) AYNEN korunur; işlev değil vizyon metnidir.
Karanlık kalıp YASAK: günlük seri zorunluluğu, yapay bekleme, yanıltıcı kıtlık, agresif bildirim, ödemeye bağlı ilerleme.
Bilimsel dürüstlük: her gösterilen özellik etiketi taşır: 'gercek' | 'basit' | 'kurgu' (SG.U.TAGS).

## 1. Teknik kurallar (herkes)
- Tek global `window.SG`. Her dosya IIFE + 'use strict'. Modül yok, framework yok, harici ağ isteği YOK. ES2018'e kadar serbest ama lambda/Java kuralı yalnız Java'da geçerli.
- DOM için `SG.h(tag,attrs,...children)`, olay için `SG.bus.on/emit`, döngü için `SG.loop.add(name,fn(dt,t))`, rastgelelik için `SG.rng(seed)` (deterministik). `Math.random` simülasyonda YASAK.
- Hata: `try{}catch(e){SG.log.err('modul',e)}`; konsola hata düşmemeli.
- Android yaşam döngüsü: `window` üzerinde 'sg-pause' ve 'sg-resume' olayları gelir. Çizim/ses döngüleri pause'da durur, resume'da devam eder.
- `SG.RM` (hareket azaltma) true ise parçacık/sürekli hareket kapatılır; geçişler anlık veya çok kısa olur.
- Kalite: `SG.P.tier()` 0=düşük(30fps hedef) 1=orta 2=yüksek; `SG.bus.on('p:tier',fn)`. Her ağır efekt tier'a bağlanır.
- Metinler Türkçe. Sistem-genel metinler `SG.T2` (04-text2.js, Oyun Direktörü); modül-özel metinler modülün kendi dosyasında.
- Her ajan YALNIZ kendi dosyalarını yazar (aşağıdaki tablo). Ortak dosyalara (00-core, 41-game, 50-ui, 90-main, template.html, build.py, main.css) DOKUNMAZ; gereken değişiklikleri `out/INTEGRATION.md` içine yazar (satır satır, kopyalanabilir). Entegrasyonu Claude yapar.
- Çalışma kopyası: `/home/claude/work/app2-<rol>` (app2'nin kopyası). Teslim: `out/` altında yalnız kendi dosyaların + INTEGRATION.md + RAPOR.md (10 satırı geçmesin). Yarım iş kaybolmasın: sık kaydet.
- Derleme: `cd <kopya> && python3 -I build.py` (src/*.js ad sırasıyla, css/*.css ad sırasıyla birleşir). Test: headless Chrome, `?test=1`.

## 2. Dosya sahipliği
| # | Rol | Dosyalar | Global |
|---|-----|----------|--------|
| 1 | Oyun Direktörü | src/04-text2.js, docs/KARAR-KAYDI.md, docs/README-2.0.md, docs/CHANGELOG.md, data/version.json, src/05-login-text.js (yalnız slogan/2.0 uyumu; %10 ve blockchain cümleleri korunur) | SG.T2 |
| 2 | Oyun Tasarımcısı | src/62-discovery.js, data/discoveries.json, docs/OYUN-TASARIMI.md | SG.Disc |
| 3 | Simülasyon Mühendisi | src/06-universe.js, docs/SIMULASYON.md | SG.U |
| 4 | Kayıt Sistemi Mühendisi | src/07-save.js, docs/KAYIT-SISTEMI.md | SG.S |
| 5 | Grafik Mühendisi | src/60-cosmos.js | SG.R |
| 6 | Teknik Sanatçı | src/61-sprites.js, css/10-tokens.css, out/icon-*.png, out/logo.svg | SG.Sp |
| 7 | UI/UX Tasarımcısı | src/70-hud.js, src/71-views.js, css/20-hud.css | SG.HUD + view'lar |
| 8 | Ses Mühendisi | src/21-audio2.js | SG.A2 |
| 9 | QA / Cihaz Testi | src/08-perf.js, tests/*, docs/YAYIN-KONTROL.md, docs/TEST-RAPORU.md | SG.P |

## 3. Veri modeli ve API'ler

### 3.1 SG.U (Simülasyon) — saf mantık, DOM yok, deterministik
Kozmik zaman birimi: Myr (milyon yıl). Hız basamakları: `SG.U.SPEEDS=[0,1,10,100,1000]` (Myr / gerçek saniye).
```
SG.U.gen(seed:string, opts?{preset:'sakin'|'yogun'|'seyrek', name?}) -> uni
uni = {v:2, id, name, seed, preset, t:0 (Myr), speedIx:1, created:ms,
       galaxies:[{id:'g0',name,kind:'spiral'|'barred'|'elliptical'|'irregular',x,y (-1..1 evren birimi),r (0.08..0.2),rot,hue(0-360),arms,starCount}], // 7-9 adet
       state:{observed:{[id]:0..3}, params:{[planetId]:{atm,water,albedo}}, decisions:[{t,target,action}],
              disc:{[discId]:tMs}, events:[ilk 100 olay], journal:[{t,kind,text,target}]}}
SG.U.galaxy(uni,gid)  -> {id, stars:[{id:'g0s12',name,x,y (-1..1 galaksi birimi),cls:'O|B|A|F|G|K|M',mass(Güneş=1),lum,temp,
                          age(Myr),life(Myr),phase:'protostar'|'main'|'giant'|'dwarf'|'neutron'|'blackhole',hue,planetCount}]}   // ~300-500 yıldız, önbellekli
SG.U.system(uni,sid)  -> {id,star:{...aynı alanlar},planets:[{id:'g0s12p2',name,a(AU),period(gün),radius(Dünya=1),mass,type:'rocky'|'ocean'|'ice'|'gas'|'lava'|'desert'|'ringed',
                          temp(K, iklim parametrelerinden), atm, water, albedo, moons:[{id,name,a,radius}], habZone:bool, habScore:0..1, hue}]}
SG.U.find(uni,id)     -> galaksi/yıldız/gezegen/uydu nesnesi veya null     // id'den kind: g | s | p | m
SG.U.step(uni,dtMyr)  -> events[]   // zamanı ilerletir, yıldız fazlarını günceller, olay üretir (deterministik)
SG.U.setSpeed(uni,ix) ; SG.U.cosmicLabel(t) -> "13,8 milyar yıl" gibi metin
SG.U.climate(planet,params,star) -> {temp,habScore,label}   // neden-sonuç: sera(atm), su(water), albedo
SG.U.observe(uni,id)  -> yeni bilgi seviyesi 0..3 (her gözlem bir seviye açar; merak kademesi)
SG.U.orbitPos(planet,tVisSec) -> {x,y,angle}   // görsel yörünge (gerçek süreden bağımsız, süs)
SG.U.TAGS -> {alan:'gercek'|'basit'|'kurgu'}    // ör. temp:'basit', luminosity:'gercek', lifetime:'basit', moons:'kurgu'
Olay: {id,type:'supernova'|'nova'|'comet'|'nebula'|'stellar-birth'|'star-dies'|'habitable-shift'|'collision',t,target,galaxy,severity:1..3,text}
Her olay: uni.state.events + journal'a eklenir ve SG.bus.emit('u:event',olay).
```
Performans bütçesi: step() ≤ 2 ms/çağrı (500 yıldız). Galaksi/sistem üretimi ≤ 25 ms.

### 3.2 SG.S (Kayıt) — kullanıcıya göre ayrık, sürümlü
```
SG.S.setUser(name|null)             // giriş/çıkışta çağrılır; anahtar öneki sg2_<kullanıcı>_
SG.S.list() -> [{id,name,seed,t,saved,bytes}]
SG.S.create({name,seed,preset}) -> uni (SG.U.gen kullanır) ve aktif yapar
SG.S.active() -> uni|null ; SG.S.open(id) -> uni|null ; SG.S.remove(id) ; SG.S.rename(id,name)
SG.S.save() ; SG.S.autosave(dtSec)  // 20 sn'de bir + pagehide + sg-pause
SG.S.exportText(id) -> "SGU2:<base64>" (içinde sürüm+sağlama toplamı) ; SG.S.importText(text) -> {ok,id?,error?}
SG.S.backups(id) -> [{ix,saved,t}] (3 dönüşümlü yedek) ; SG.S.restore(id,ix) -> uni|null
SG.S.status() -> {ok:true|false,msg} (bozuk kayıt kurtarıldı mı)
Bozuk kayıt: kurtarma kopyası sg2_corrupt_<ts>, en yeni sağlam yedeğe dönülür; asla sessizce silinmez. localStorage yoksa bellek yedeği.
```
Göç: v1 verisine (sg1_*) DOKUNULMAZ. Eski oyun "Eski SpacEgg (v1)" olarak Ayarlar'dan açılır.

### 3.3 SG.R (Çizim) — Canvas 2D, kesintisiz ölçek
```
var r=SG.R.create(canvas,{uni, onSelect(id,kind), onScale(scale), onTap?})
r.setUniverse(uni) ; r.focus(id,{animate:true}) ; r.up() ; r.home()
r.scale() -> 'universe'|'galaxy'|'system'|'planet' ; r.selected() -> id|null
r.setQuality(0|1|2) ; r.setReducedMotion(bool) ; r.resize() ; r.pause() ; r.resume() ; r.destroy()
r.pick(x,y) -> id|null ; r.photo({hud:false,w:1080,h:1920}) -> Promise<dataURL>
r.on('frame',fn)  // dt başına
SG.R.bigBang(canvas,seed) -> {stop()}   // evren oluştur ekranı için kısa animasyon (≤4 sn, döngüsüz de olabilir)
```
Girdi: tek parmak sürükle=kaydır, iki parmak=sıkıştır yakınlaştır, çift dokun=odakla, tekerlek, klavye (ok tuşları, +/-, Esc=yukarı, Enter=seç). Zoom eşikleri sürekli; ölçek adı eşiğe göre değişir.
SG.Sp yoksa basit yedek çizimlerle çalışmalıdır.

### 3.4 SG.Sp (Sprite/Malzeme)
```
SG.Sp.PAL -> renk paleti (yıldız sınıfı renkleri, gezegen tipleri)
SG.Sp.galaxy(ctx,galaxy,cx,cy,radius,time,{q}) ; SG.Sp.star(ctx,star,cx,cy,radius,time,{q})
SG.Sp.planet(ctx,planet,cx,cy,radius,time,{q,light:{x,y},climate}) ; SG.Sp.moon(...) ; SG.Sp.nebula(seed,w,h,q)->canvas ; SG.Sp.bg(ctx,w,h,t,{q})
Önbellek: ofscreen canvas, tier'a göre boyut. Hiçbir çizim kare başına yeni canvas üretmez.
CSS tokenları (--sg-*): renk, boşluk, yazı, hareket süresi, yüksek kontrast değişkenleri.
```

### 3.5 SG.Disc (Keşif/Karar)
```
SG.Disc.list() -> [{id,title,desc,cat,need:{...},hint,reward?}] ; SG.Disc.progress(uni) -> {done,total,byCat}
SG.Disc.check(uni) -> yeni açılanlar[] ; açılınca SG.bus.emit('disc:unlock',d) + journal
SG.Disc.actions(uni,targetId) -> [{id,label,desc,cost?,tag}]   // hedef türüne göre kararlar
SG.Disc.apply(uni,targetId,actionId) -> {ok,message,effects:[{k,from,to}]}   // SG.U.climate ile neden-sonuç
SG.Disc.goals(uni) -> o an görünen en çok 3 hedef (yalnız ipucu; hepsini açma)
```
Ödül yok sayılabilir: ilerleme bilgi/koleksiyon/başlık (rozet) üzerinden; para/enerji ekonomisi yok.

### 3.6 SG.HUD + view'lar
Route'lar: `create` (evren oluştur), `cosmos` (ana oyun), `journal` (günlük/kozmik tarihçe/keşifler), `saves` (kayıtlar+yedek+dışa/içe aktar), `prefs` (erişilebilirlik+ses+kalite+eski v1 bağlantısı+çıkış).
cosmos görünümü: tam ekran canvas (SG.R) + üst bar (evren adı, kozmik zaman, hız kontrolü ⏸ 1× 10× 100× 1000×) + ölçek izi (Evren › Galaksi › Sistem › Gezegen) + alt sekme çubuğu (Evren, Günlük, Kayıtlar, Ayarlar) + seçili nesne alt paneli (bilgi seviyesine göre kademeli bilgi, etiket rozetleri gerçek/basit/kurgu, kararlar) + olay toast'ları + ilk kullanımda 4 adımlı eğitim + nesne LİSTE modu (ekran okuyucu/klavye alternatifi).
Erişilebilirlik: hareket azaltma, yüksek kontrast, yazı ölçeği (%100/125/150), min 44px dokunma alanı, aria etiketleri, odak halkası.

### 3.7 SG.A2 (Ses)
```
SG.A2.start() ; SG.A2.stop() ; SG.A2.setScale('universe'|'galaxy'|'system'|'planet') ; SG.A2.setSpeed(ix) ; SG.A2.event(type) ; SG.A2.ui('tap'|'open'|'close'|'unlock'|'error')
```
Mevcut SG.A (20-audio.js) üzerine kurulur (yeniden yazılmaz); ölçekle bağlı sakin ortam katmanları, hız arttıkça filtre/kaydırma; olay vurguları kısa ve yumuşak; pause/resume'a saygı; toplam CPU düşük.

### 3.8 SG.P (Performans/Kalite)
```
SG.P.tier() ; SG.P.setTier(0|1|2|'auto') ; SG.P.fps() ; SG.P.report() -> {fps,p95ms,tier,mem?,longTasks}
Otomatik: ilk 6 sn örnekle; <40fps ise bir kademe düş; 60 sn sonra yeniden değerlendir; kullanıcı elle seçerse auto kapalı. SG.bus.emit('p:tier',n)
```

## 4. Entegrasyon (Claude yapar)
- 00-core ROUTES += create, cosmos, journal, saves, prefs. SG.ver version.json'dan.
- Giriş sonrası: SG.S.setUser(kullanıcı); aktif evren yoksa → create, varsa → cosmos. Çıkışta SG.S.save(); SG.S.setUser(null).
- Müzik bağlamı: cosmos/create/journal/saves/prefs → SG.A2 + mevcut müzik.
- Eski v1 görünümleri (hub, egg, world, galaxy, shop, missions, story, settings) KALIR; yalnız prefs'ten erişilir.
