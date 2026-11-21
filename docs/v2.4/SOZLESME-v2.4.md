# SpacEgg v2.4 Uygulama Sözleşmesi (tüm ajanlar bunu okur)

Çalışma ağacı: /home/claude/app (src/*.js ada göre birleşir, css/*.css, data/*.json, build.py). Derleme: `cd /home/claude/app && python3 -I build.py --min` -> dist/SpacEgg.html. Python her zaman `python3 -I`.
Ajanlar YALNIZ kendine ayrılan YENİ dosyaları yazar. Mevcut dosyalara DOKUNMAZ (00-core, 07-save, 50-ui, 71-views, 72-drawer, 90-main, 22-sfx-ui, 23-sfx-cosmos, 33-intro, 05-login-text, fontlar). Ana oturum entegrasyonu yapar.
Yasak: Date.now (mantık dosyalarında), Math.random (mantık dosyalarında; SG.rng kullan), harici ağ, harici dosya/doku (hepsi kodla çizilir). Yazı tipi: CSS değişkenleri var(--f-title), var(--f-body), var(--f-mono). Tüm metinler Türkçe. Dil: kod yorumları kısa Türkçe.

## Oyun kararları (Doktor'un, değişmez)
- Tek gezegen, gerçek zamanlı, HIZLANDIRMA YOK. Her süre gerçek dünya süresi.
- 12 medeniyet, hepsi baştan açık. Yumurta çatlayınca medeniyet RASTGELE atanır (tohumlu). Miras SIFIR.
- Rakipler yapay zekâ, 12 medeniyetten eşit olasılıkla.
- Yoklama: rakip bir saldırı planı ilan eder, pencere 12 saat. "Katıl" = saldırıya HAZIRLAN (hazırlık TUNE.prepMin=60 dk gerçek süre, bitince "Saldırıyı onayla" çıkar, joinBy dolmadan onaylanmazsa fırsat kaçar). "Geç" ya da süre dolması = bedelsiz kapanır.
- Yenilen rakip gezegen yok olma geri sayımına girer: TUNE.rivalKillH=6 saat, gezegen üstünde sayaç. Lojistik gemi gidiş-dönüş TUNE.shipRoundMin=90 dk (gidiş 45, dönüş 45), ganimeti depo kapasitesini aşamaz.
- Kendi gezegenin: üst üste TUNE.loseStreak=3 yenilgide yok olma geri sayımı TUNE.selfKillH=24 saat; bu sürede "Kurtarma" (bir savunmayı kazan ya da kalkan+onarım) iptal eder. Süre dolarsa gezegen yok olur: anma listesine yazılır, yeni yumurta, sıfır miras.
- Bazı saldırılar yalnız kaynak yağmasıdır, yıkılan bina yeniden yapılır.
- Çevrimdışı birikim tavanı TUNE.offlineCapH=10 saat (depo kapasitesi de sınırlar).
- Bildirim: yerel alarm, SESSİZ SAAT YOK. Kaynaklar: food, stone, metal, energy, know ve para birimi credit (Kredi).
- Tüm ayarlanabilir sayılar tek nesnede: SG.TUNE.

## Sınıflar ve denge (MEDENIYETLER-12.md)
Savaşçı > Lojistik > Yıkıcı > Medeniyet > Yaratıcı > Savaşçı. Avantaj saldırı gücüne en çok x1.25.
Medeniyet kimlikleri (id): kulhan, kirkbicak, lumeren, tuzdalga, cinar, ruzgarguder, buzag, kulluspor, karaoz, sesdokur, ruyag, ipekci.

## Modül dosyaları ve sahipleri
| Dosya | Sahip | Küresel |
|---|---|---|
| src/63-iso-world.js | Grafik 1 | SG.Iso.World (arazi, su, bulut, sahne çizimi, kamera) |
| src/64-iso-buildings.js | Grafik 1 | SG.Iso.building (bina sprite çizimi, 11 tür x 5 seviye x 12 medeniyet rengi) |
| src/65-iso-icons.js | Grafik 2 | SG.Iso.icon (kaynak/arayüz ikonları), SG.Iso.ship, SG.Iso.rivalPlanet |
| src/66-iso-fx.js | Grafik 2 | SG.Iso.fx (parçacık: duman, iniş alevi, inşaat tozu, yok oluş çatlağı, toplama balonu, kıvılcım) |
| src/80-clock.js, 81-planet-state.js, 82-economy.js, 83-buildings.js, 84-civ-data.js, 85-ai-rivals.js, 86-war-resolver.js, 87-logistics.js, 88-events.js, 89-notify.js | Mantık | SG.Clock, SG.PS, SG.Eco, SG.Bld, SG.Civ, SG.AI, SG.War, SG.Log, SG.Ev, SG.Notify, SG.TUNE |
| src/73-view-planet.js, css/35-planet.css | Arayüz (2. aşama) | SG.view('planet'), view'lar war/fleet |
| android/ (Java) | Android | SGNative köprüsü |

## Grafik API (Grafik 1 ve 2'nin vereceği; arayüz bunu çağırır)
Izgara: 24x24 karo, karo elması 64x32 piksel (izometrik 2:1). Sahne mantıksal koordinatta, kamera {x,y,zoom}.
- `SG.Iso.World.make(seed, civId)` -> `{n:24, kind:Uint8Array(n*n) /*0 deniz,1 kıyı,2 ova,3 orman,4 dağ,5 nehir,6 kar*/, hgt:Float32Array, slots:[{i,j,type?}] /*bina slotları, en az 14, kara üzerinde*/, pad:{i,j} /*iniş pisti*/, port:{i,j}}`
- `SG.Iso.World.draw(ctx, world, cam, t, opts)` zemin + su + bulut gölgesi çizer. `opts:{night:0..1, w, h}`
- `SG.Iso.World.toScreen(world,cam,i,j)` -> `{x,y}`; `fromScreen(world,cam,x,y)` -> `{i,j}`
- `SG.Iso.building(ctx, type, lv, civId, x, y, o)` x,y = karonun zemin merkezi (elmasın alt-orta noktası değil, ELMASIN MERKEZİ). `o:{t, scale, selected, progress /*0..1 inşaat iskele*/, night, damaged /*0..1*/}`. Türler: hall, farm, mine, quarry, power, lab, barracks, wall, port, depot, house. lv 1..5.
- `SG.Iso.icon(ctx, name, x, y, size, o)` isimler: food, stone, metal, energy, know, credit, build, upgrade, attack, scout, ship, shield, clock, alert, plus, check, cross, menu, planet, city, fleet, war, diplomacy, collect.
- `SG.Iso.ship(ctx, kind, civId, x, y, ang, t, o)` kind: logi, war, scout; o:{flame}.
- `SG.Iso.rivalPlanet(ctx, seed, civId, x, y, r, t, o)` küçük dokulu küre; o:{dying:0..1 çatlak, target}.
- `SG.Iso.fx.new()` -> sistem; `.emit(kind, x, y, o)`, `.step(dt)`, `.draw(ctx)` kinds: smoke, dust, flame, spark, crack, bubble, ring, confetti.
Sahne çizim sırası arayüzde: World.draw, sonra slotları (i+j) artan sırayla building, sonra gemi/fx.
Görsel hedef: net okunur silüet, 2-3 tonlu gölgeleme, medeniyet renk paleti (MEDENIYETLER-12.md hex'leri), kontrast yüksek, düşük kademede de güzel; tek çizim 1 ms altı hedefi için ön-render önbelleği (offscreen canvas) kullan.

## Mantık API (Mantık ajanının vereceği; arayüz bunu çağırır). Hepsi DOM'suz, node vm'de çalışır.
- `SG.TUNE` tek ayar nesnesi. `SG.Clock.now()`, test için `SG.Clock.fake(ms)`, `SG.Clock.advance(ms)`.
- `SG.Civ.LIST` (12 kayıt: id, ad, sınıf, palet {c1,c2,c3,atm}, çarpanlar, ana kaynak, lider, yönetim, hayvanlar, gemiler), `SG.Civ.pick(seed)` rastgele tohumlu seçim, `SG.Civ.edge(a,b)` avantaj çarpanı.
- `SG.PS.create(userKey, now)` -> yeni gezegen durumu (rastgele medeniyet, tohumlu, ilk kaynaklar, hall seviye 1, 1-2 başlangıç binası). Durum şeması KOD-MIMARISI-3.md bölüm 3. `SG.PS.resolve(s, until)` ana motor. `SG.PS.load(userKey)`, `SG.PS.save(s)` (`sg3_<kullanıcı>_p`, zarf+sağlama+3 yedek, 07-save'in `enc` ve sağlama işlevlerini kullanır; yoksa kendi küçük sağlaması), `SG.PS.clear(userKey)`.
- Eylemler (hepsi `{ok:true,...}` ya da `{ok:false, err:'metin'}` döner, süreleri `now`'dan yazar): `SG.PS.build(s,slotIdx,type,now)`, `SG.PS.upgrade(s,slotIdx,now)`, `SG.PS.cancel(s,qid,now)`, `SG.PS.train(s,unit,n,now)`, `SG.PS.collect(s,slotIdx,now)`, `SG.PS.decide(s,pendId,'join'|'skip'|'confirm',now)`, `SG.PS.scout(s,rivalId,now)`, `SG.PS.attack(s,rivalId,maneuver,now)`, `SG.PS.sendShip(s,rivalId|null,now)`, `SG.PS.rescue(s,now)`, `SG.PS.maneuver(s,pendId|attackId,m)`.
- Sorgular: `SG.Eco.rates(s)` -> {food:+/sa,...}, `SG.Eco.cap(s)`, `SG.Bld.TYPES` (ad, açıklama, maliyet(lv), süre(lv) sn, üretim), `SG.Bld.cost(type,lv)`, `SG.Bld.secs(type,lv)`, `SG.Bld.canAfford(s,cost)`, `SG.PS.report(s)` ("Sen yokken" özeti: satır listesi), `SG.PS.nextEvents(s)`.
- Olay akışı: `SG.Ev.drain(s)` -> arayüzün göstereceği sıradaki popup'lar [{kind:'yoklama'|'rapor'|'yokolus'|'gemi'|'kaybet', ...}].
- Bildirim: `SG.Notify.sync(s)` alarm listesini yeniden üretir, `SGNative` varsa köprüyü çağırır.
- Her sayı kümesi TUNE'dan. Rakip güç eğrisi oyuncu gücüne 0.6-1.5 bandında uyum (ezilme önlemi).

## Test kuralı
- Mantık: `/home/claude/app/tests/unit/*.js` node vm testleri (`node tests/unit/run.js`), 30 günlük replay eşdeğerliği (1 sn adım == tek sıçrama), tohum tutarlılığı, saat geri/ileri.
- Grafik: kendi tek dosyalık sınama sayfası /home/claude/app/tests/art/<ad>.html (SG kökü için küçük taslak: `window.SG={rng:...}`), playwright + /usr/bin/google-chrome --no-sandbox ile 390x800 dsf2 ekran görüntüsü /home/claude/shot/ altına; Read ile bakıp düzelt (en az 2 tur). Sayfa hatası olmamalı.
- Toplam ek boyut bütçesi: grafik 70 KB, mantık 90 KB minify öncesi sınırı umursama ama gereksiz şişirme.

## Teslim
Bitirince tek paragraf Türkçe rapor: yazılan dosyalar, API'de sözleşmeden sapma varsa tam imza, test sonucu, bilinen eksik.
