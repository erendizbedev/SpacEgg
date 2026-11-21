# SpacEgg Kod Mimarisi 3.0: Tek Gezegen, Gerçek Zamanlı

Durum: tasarım belgesi (ARCH-2.0'ın devamı; çelişen yerde bu belge geçerlidir). Kaynak koda dokunulmadı. Dayanak: SENARYO-TEK-GEZEGEN.md, ARCH-2.0.md, src/ (v2.3.0), MainActivity.java.

## 1. Hedefler ve ilkeler

**Hedef:** v2.3.0'ın açılış, giriş, ana sayfa, çekmece, ses ve yedek katmanlarını bozmadan, "Yeni evren" ekranının yerine gerçek zamanlı tek gezegen oyununu koymak.

**Kararın bu belgedeki karşılığı (SENARYO'dan sapmalar):** Doktor'un kararları senaryo taslağını geçer: hızlandırma yok, yoklama 12 sa, yenilen gezegen yok olur, kendi gezegenin de yok olabilir. Bu yüzden senaryodaki "ceza yok" ilkesi ve ARCH-2.0'daki "yapay bekleme yasak / agresif bildirim yasak" maddeleri **yürürlükten kalkar**; yerine bölüm 7'deki bildirim sınırları ve bölüm 6'daki adil yok oluş kuralları gelir. Bu bir ürün kararıdır, KARAR-KAYDI.md'ye yazılmalı.

| İlke | Sonucu |
|---|---|
| Tek zaman kaynağı | Hiçbir modül `Date.now()` çağırmaz; yalnız `SG.Clock.now()` |
| Durum = veri, olay = zaman damgası | Oyun "şimdi" değil "ne zaman olacak" tutar; kare döngüsü durumu değiştirmez |
| Saf mantık, DOM'suz | 80-89 dosyaları node `vm` içinde çalışır (test edilebilir) |
| Deterministik | Rastgelelik yalnız `SG.rng(tohum+olayId)`; `Math.random` yasak |
| Çevrimiçi = çevrimdışı | Saniye saniye ilerlemek ile tek sıçrama aynı sonucu verir (test edilir) |
| Dokunulmaz | 22-sfx-ui, 23-sfx-cosmos, `--f-*` yazı sistemi, 33-intro, giriş akışı |
| Boyut | Ek bütçe +150 KB (minify), doku dosyası yok (hepsi prosedürel) |

## 2. Modül haritası

Derleme sırası `src/*.js` ada göre sıralı olduğundan 80-89 grubu 72-drawer'dan sonra, 90-main'den önce yüklenir. Hepsi IIFE + `window.SG`.

```
 [UI / sahne]  73-view-planet  74-view-war  75-view-fleet  (71-views kalıbı)
        |             |
 [çizim]  63-planet-render  64-planet-fx   (31-world'den gezegen kodu devralınır)
        |
 [oyun mantığı, DOM yok]
   80-clock -> 81-planet-state -> 82-economy -> 83-buildings
                    |                 |
              84-civ-data       85-ai-rivals -> 86-war-resolver
                    |                 |
              87-logistics     88-events (yoklama) -> 89-notify
        |
 [kayıt/çekirdek] 00-core  07-save (sg3_)  08-perf   | [Android] SGNative
```

| Dosya | Küresel | Görev |
|---|---|---|
| 80-clock | SG.Clock | now(), sahte saat, tutarlılık koruması, çevrimdışı süre ölçümü |
| 81-planet-state | SG.PS | Durum şeması, iş kuyruğu, `resolve(until)` ana motor |
| 82-economy | SG.Eco | Üretim/tüketim/depo, parçalı doğrusal entegrasyon |
| 83-buildings | SG.Bld | Yapı ve seviye tablosu, süre/maliyet, slot kuralları |
| 84-civ-data | SG.Civ | 12 medeniyet (CINS.json 5 türden genişler), çarpanlar |
| 85-ai-rivals | SG.AI | Rakip üretimi, büyüme eğrisi, saldırı planlama |
| 86-war-resolver | SG.War | Güç hesabı, savaş çözümü (saf fonksiyon) |
| 87-logistics | SG.Log | Gemi görevi, gidiş-dönüş, ganimet |
| 88-events | SG.Ev | Tohumlu olay planı, yoklama popup'ı, bekleyen kararlar |
| 89-notify | SG.Notify | schedule/cancel/sync, SGNative köprüsü (yoksa no-op) |
| 63-planet-render | SG.PR | Küre gezegen çizimi, bina yerleşimi |
| 73-75 | view'lar | planet (ana oyun), war (yoklama/savaş raporu), fleet |

**Eski dosyaların akıbeti**

| Dosya | Karar |
|---|---|
| 22-sfx-ui, 23-sfx-cosmos, 20/21-audio, 33-intro, 05-login-text, 04-text2 (ekleme hariç), 08-perf | KORUNUR, değişmez (04-text2'ye yeni metin anahtarları eklenir) |
| 00-core | UYARLANIR: ROUTES'a `planet, war, fleet`; `SG.now` -> `SG.Clock.now`; `create/cosmos` kalkar |
| 07-save | UYARLANIR: zarf, sağlama, 3 yedek, bozuk kayıt kurtarma aynen; önek `sg3_`, şema kaydı tabloya taşınır |
| 30-egg | UYARLANIR: yumurta seçme/çatlatma yeni akışın girişi, 12 medeniyet seçimi |
| 31-world (105 KB) | AYIKLANIR: kabartma/atmosfer gölgelendirmesi 63-planet-render'a taşınır, galaksi/yıldız akışı arka plan olarak kalır, kalanı emekli (boyut kazancı) |
| 32-art, 61-sprites | Korunur; bina ikonları ve palet ortak kullanılır |
| 40-gamedata, 41-game | UYARLANIR: hesap/kullanıcı kısmı kalır (SG.G.user); v1 ekonomi/görev kısmı emekli |
| 06-universe, 62-discovery, data/discoveries.json | EMEKLİ (aşama 6'da silinir; eski evren kayıtları salt okunur arşiv) |
| 60-cosmos | Aşama 6'ya kadar durur; sonra yalnız arka plan yıldız alanı olarak küçülür |
| 70-hud, 71-views, 72-drawer | KORUNUR; yeni view'lar aynı kalıbı kullanır, çekmece ızgarasına yalnız yeni hedef rotalar bağlanır |

## 3. Veri modeli

**Kayıt anahtarı:** `sg3_<kullanıcı>_` (kodlama 07-save'deki `enc` ile). Eski `sg1_` ve `sg2_` anahtarlarına dokunulmaz.

| Anahtar | İçerik |
|---|---|
| `…p` | aktif gezegen (zarf) |
| `…b0..2` | 3 dönüşümlü yedek |
| `…hall` | yok olmuş gezegenlerin "anma" listesi (ad, medeniyet, yaşam süresi; sıfır mekanik miras) |
| `…set` | bildirim/ayar tercihleri |

**Zarf** ARCH-2.0 ile aynı: `{f:1, v:3, sum, saved, d}`.

**Planet state (özet şema)**
```
{ v:3, id, seed, civ:'sav', born:ms, rev:n,            // rev her yazımda artar (çakışma tespiti)
  clock:{ wall:ms, mono:ms|null, drift:0 },            // son güvenilir çift
  at:ms,                                               // durumun çözüldüğü an ("şimdi" değil)
  res:{food,stone,metal,energy,know,credit},
  cap:{...}, age:1..7, pop:n,
  bld:[{slot:0,type:'farm',lv:3,pos:{lat,lon}}],       // pos tohumdan, kayıtta sabit
  troops:{sentinel:12,...}, fleet:[{id,state:'idle|out|back',..}],
  q:[ {id,t0,t1,kind:'build|upgrade|train|research|age', ...args} ],   // iş kuyruğu
  plan:{seed, cursor, list:[ {id,at,kind,from,power} ]},               // olay planı
  rivals:[ {id,seed,civ,power,pos,state:'alive|dying|gone',killAt:ms|null} ],
  pend:[ {id,kind:'yoklama',offerAt,joinBy:ms,...} ],                  // karar bekleyenler
  war:{streak:0, lastDefeatAt:ms, shieldUntil:ms},
  dying:{killAt:ms}|null, log:[son 200 olay, halka tampon] }
```

**Zaman damgalı iş kuyruğu:** her iş `t1` (bitiş) taşır, süre gerçek zamandır. Kuyruk `t1`'e göre sıralı; çözüm sırasında işler bitiş anında uygulanır (üretim oranı o anda değişir).

**Deterministik olay planı:** `plan.list`, `rng(seed+'#'+cursor)` ile 72 saatlik pencere ileriye üretilir; pencere azaldıkça uzatılır. Olay `id`'si sabittir, savaş sonucu `rng(id)` ile çözülür; aynı kayıt aynı sonucu verir, kayıt yükleyerek "yeniden at" hilesi işe yaramaz.

**Göç:** `sg2_` evrenleri oyuna taşınmaz; Ayarlar'da "Eski evrenler (salt okunur)" olarak kalır. İlk girişte `sg3_..p` yoksa doğrudan yumurta seçimi açılır. Gelecek şema yükseltmeleri için `MIG[v]` tablosu 07-save'deki gibi.

**Yedek/dışa aktarma:** `"SGP3:" + base64(UTF-8 JSON {f,v,sum,d})`; içe aktarmada ≤2 MB, sağlama, strict alan doğrulama, zaman damgası kontrolü (bölüm 4). İçe aktarılan kayıt "şimdi"ye çözülür, yani yedek geri yüklemek zamanı geri sarmaz ama yüklerken geçen süre de oyuna işler.

## 4. Gerçek zaman motoru

**Tek kaynak:** `SG.Clock.now()` = güvenilir duvar saati. Test bağlamında `SG.Clock.fake(ms)` / `advance(ms)` ile değiştirilir.

**Çözüm algoritması** `SG.PS.resolve(s, until)`:
```
loop:
  next = min( s.q[0].t1, sonraki plan olayı .at, sonraki lojistik dönüşü,
              depo dolma anı (ekonomiden), s.dying.killAt, until )
  Eco.integrate(s, s.at, next)          // oranlar sabitken doğrusal birikim, depoya kırp
  s.at = next
  if next==until: break
  uygula(en erken olay)                 // iş biter / saldırı gelir / gemi döner
  (aynı anda olanlarda sabit öncelik: iş < dönüş < saldırı < yok oluş)
```
Karmaşıklık olay sayısıyla orantılı; 30 gün çevrimdışı ≤ birkaç yüz adım (< 20 ms hedef).

**Yoklama ve oyuncu kararı çevrimdışıysa:** `pend` kaydı `joinBy` süresince bekler; süre dolunca varsayılan (katılmama) uygulanır. Katılım yalnız çevrimiçiyken mümkündür; çözümleme popup'ı dönüşte sırayla gösterir (en eskisi önce), süresi geçenler "kaçırıldı" olarak rapor satırına girer.

**Çevrimdışı çözüm sonrası:** "Sen yokken" özeti (kuyruk, üretim, savaşlar, gemi). Çevrimdışı üretim üst sınırı kararı: senaryodaki 8 saat tavanı **yok**, depo kapasitesi sınırlar (Doktor: zaman akar).

**Saat dayanıklılığı**

| Tehdit | Önlem |
|---|---|
| Saati geri alma | `now = max(wall, son_görülen)`; geri sıçrama kadar süre `drift` olarak kaydedilir, olay planı kaymaz |
| Saati ileri alma (hile) | Android'de `SGNative.elapsed()` (SystemClock.elapsedRealtime, uykuda da akar) ile duvar farkı karşılaştırılır; fark > 5 dk ise güvenilir artış olarak elapsed alınır |
| Yeniden başlatma (elapsed sıfırlanır) | Çift bozulur; duvar saati kullanılır, ama tek seferde 7 günden fazla ileri sıçrama "şüpheli" işaretlenir, savunma kaybı ve ganimet o sıçramada sınırlanır |
| Tarayıcı (APK dışı) | Yalnız duvar + performance.now oturum içi farkı; çevrimdışı ileri sıçrama kabul, geri sarma engellenir |
| Yedek geri yükleme | `rev` ve `saved` karşılaştırılır; daha eski yedek yüklenirse bildirim planı da yeniden kurulur |

Dürüst not: sunucusuz tek oyunculu oyunda ileri-saat hilesi tamamen engellenemez; amaç sıradan bozulmayı ve kazara saat değişimini önlemektir.

## 5. Savaş çözümleyici ve yapay zekâ rakipler

**Güç:** `P = (Σ birim_güç × adet) × medeniyet_çarpanı × (1 + kale_bonusu) × moral`; birim gücü ve çarpanlar 84-civ-data'da. `SG.War.resolve(att, def, seed) -> {winner, lossA, lossD, loot, log}` saf fonksiyondur. Varyans: `rng(olayId)` ile ±12 %.

**Manevra:** saldırıdan önce dört seçim; her birinin bedeli ve sayısal etkisi var.

| Manevra | Etki |
|---|---|
| Sur arkasına çekil | Savunma +20 %, ganimet kaybı +10 % |
| Karşı saldırı | Savunma -10 %, kazanırsan saldıranın kaybı +30 % |
| Kalkan (enerji) | Tek akına +25 % |
| Katıl (yoklama) | Müttefik planına birlik gönder; ganimet payı |

**Saldırı türleri (altı, senaryodan):** Yoklama (küçük, bilgi toplar), Hırsız Sürüsü (kaynak çalar), Kuşatma (yapı hasarı, geçici), Gölge Dalgası, Büyük Dalga, Yüce Sınav. Yeni: **Saldırı planı haberi** (rakip rakibe saldırmayı ilan eder, oyuncu 12 sa içinde katılabilir).

**Yapay zekâ rakipler (yerel):** her rakip `{seed, civ, power, growth}`. Güç, zaman damgasından hesaplanan eğri: `power(t) = p0 × e^(k×gün) × tavan`; oyuncu gücüne 0,6-1,5 bandında uyum yapar (ezilmeme). Rakipler "oynamaz", çözüm anında güç eğrisinden hesaplanır; çevrimdışı maliyet sıfır. Saldırı planlayıcısı plana göre saldırı üretir (hedef: oyuncu veya başka rakip, seçim ağırlığı MG yakınlığı + öç).

**Kaybetme:** `war.streak` üst üste yenilgi sayısı; kayıp kaynaklar tavanlı, yapı seviyesi bir basamak düşebilir. Eşik ve süre `SG.Bld`/`SG.War` içinde tek `TUNE` nesnesinde durur (denge testi için).

## 6. Lojistik gemisi ve yok oluş

**Gemi durumları:** `idle -> out (t0..t0+T/2) -> gather -> back (..t0+T) -> idle`. Toplam `T ≈ 90 dk` (ayarlanabilir). Getirisi gemi sınıfı, kaynak türü ve rotaya göre; ganimet depo kapasitesini aşamaz, fazlası kaybolur.

**Kural:** gemi yolda iken saldırı gelirse gemi savunmaya katılamaz; eşleşme bir "yol riski" olayı olabilir (kaybolma olasılığı düşük, tohumlu, tavanlı). Dönüş anı `q`'ya `fleet-return` işi olarak yazılır, bildirim planlanır.

**Yok oluş geri sayımı**
```
rakip yenilir -> state:'dying', killAt = now + 6 sa  (gezegen üstünde sayaç)
killAt dolar  -> state:'gone' (listeden kalkar, ganimet ödenmişse kalıcı)
oyuncu: war.streak >= 3 ve son yenilgi -> dying:{killAt: now + 24 sa}
        bu pencerede "Kurtarma": bir savunmayı kazan veya kalkan + onarım yap -> iptal
killAt dolar  -> hall'a kayıt, sg3_..p silinir, yumurta seçimi (yeni medeniyet, SIFIR MİRAS)
```
Süreler Doktor'a sorulacak (soru 2). Sayaç UI'da gezegenin üstünde, `SG.Notify` ile 1 sa önce uyarı.

## 7. Bildirim köprüsü (Android)

**Java (MainActivity + yeni sınıflar)**

| Değişiklik | Ayrıntı |
|---|---|
| Manifest | `POST_NOTIFICATIONS` (API 33+), `RECEIVE_BOOT_COMPLETED`; `AlarmReceiver`, `BootReceiver` bildirimi |
| Kanal | `sg_events` (`NotificationChannel`, varsayılan önem), uygulama açılışında oluşturulur |
| Köprü | `web.addJavascriptInterface(new Bridge(), "SGNative")` |
| Alarm | `AlarmManager.setAndAllowWhileIdle` (kesin saat zorunlu değil; `canScheduleExactAlarms()` izin verirse `setExactAndAllowWhileIdle`); kayıtlar SharedPreferences'ta, boot'ta yeniden kurulur |
| Açılışta | `onResume`: `cancelAll` değil, JS `Notify.sync()` ile tek doğru liste (süreç öldürüldüyse JS yeniden kurar) |
| Dokunuş | Bildirim -> MainActivity, extra `route`; JS karşılar |
| Not | `FLAG_KEEP_SCREEN_ON` gerçek zamanlıda pil sorunu: oyun içinde yalnız animasyon sahnesinde aç |

`SGNative` yöntemleri (yalnız ilkel parametreler; JSON metin): `schedule(id, atMs, title, text)`, `cancel(id)`, `cancelAll()`, `elapsed()`, `canNotify()`, `requestPermission()`.

**JS tarafı:** `SG.Notify.schedule(id, atMs, kind)`, `cancel(id)`, `sync(state)`. `sync` kuyruğu, gemi dönüşlerini, `pend.joinBy` ve `dying.killAt` anlarını okuyup alarm listesini tek seferde yeniden üretir; çağrı yeri her durum değişikliği ve `sg-pause`. Köprü yoksa (tarayıcı) hiçbir şey yapmaz.

**Sınırlar:** en çok 20 alarm; sessiz saat (varsayılan 23:00-08:00, ayarlanır); tür başına açma/kapama; metinde kullanıcı verisi yok. Bu, ARCH-2.0'ın "agresif bildirim yasak" kuralının yerine geçen kuraldır.

## 8. Render mimarisi

**Seçenekler**

| Seçenek | Artı | Eksi |
|---|---|---|
| A. Canvas2D prosedürel küre (arama tablosu) | Mevcut kod tabanıyla uyumlu, WebView'da güvenli, küçük, düşük CPU | Dönüş tek eksende, ışık sahte |
| B. WebGL küre | En güzel, ucuz dönüş/ışık | Bağlam kaybı, eski WebView/GPU sorunu, 4x CPU'da gölgelendirici riski, +kod |
| C. Önceden üretilmiş doku + CSS 3D | Kolay | Dosya boyutu, gerçek kıta yok |

**Öneri: A (birincil), B ileride yalnız yüksek kademede, özellik denemesiyle.**

**Boru hattı**
1. **Doku:** tohumdan eşdikdörtgen harita (fbm gürültü): okyanus < deniz seviyesi < kıyı < ova < dağ < kar. Çözünürlük kademe: düşük 512x256, orta 1024x512, yüksek 2048x1024. Parçalı üretim (kare başına ≤ 6 ms), ilk açılışta yumurta çatlama animasyonu üretimi gizler; sonuç offscreen canvas'ta önbellek (kayıt tohumdan yeniden üretir, saklanmaz).
2. **Küre:** gezegen yarıçapı için bir kez hesaplanan `(u,v)` arama tablosu; kare başına tablo boyunca doku örneklenir, dönüş = u kaydırma. Işık/atmosfer ayrı hazır katmanlar (31-world'deki gölgelendirme fikri).
3. **Bina:** slotlar kayıtta `{lat,lon}`; yalnız kara üzerinde seçilir. Ekran konumu `x=cx+R·cos(lat)·sin(lon-θ)`, arka yüzde gizlenir. Yapılar 61-sprites/32-art ikonlarıyla çizilen "bayrak" tipi küçük sprite; yükseltmede boyut/parıltı değişir. Seçilen slotta halka.
4. **Bildirim yok oluş sayacı** küre üstüne HTML katmanı.

**Kademeler (08-perf `p:tier`)**

| Kademe | Küre güncelleme | Doku | Ek |
|---|---|---|---|
| 0 | 10 Hz dönüş, yarım çözünürlük | 512 | bulut ve atmosfer yok |
| 1 | 20 Hz | 1024 | durağan bulut |
| 2 | 30+ Hz | 2048 | hareketli bulut, WebGL denemesi |

**Hedef:** 4x CPU kısıtlamada ≥ 30 fps (UI/bina katmanı 30, küre 10-20 Hz yeterli). Bütçe: render +45 KB, mantık +70 KB, veri +25 KB, view +10 KB; derleme betiği 1,5 MB'ı aşarsa başarısız olur.

## 9. Test planı

| Katman | Yöntem |
|---|---|
| Birim (node `vm`) | tests/unit/*.js: 80-89 DOM'suz yüklenir; sahte `SG.Clock` |
| Replay eşdeğerliği | 30 gün: 1 sn adımlarla ilerleme == tek sıçrama (kaynaklar, olaylar, savaş sonuçları birebir) |
| Tohum altın dosyaları | 5 sabit tohumun 30 günlük özeti `tests/golden/*.json` ile karşılaştırılır |
| Saat hilesi | geri/ileri sıçrama, `drift`, yedek geri yükleme senaryoları |
| Denge | 2000 sanal oyuncu: ortalama çağ ilerlemesi, ezilme oranı (≤ %15 beklenen) |
| Headless e2e | Mevcut `tests/run.js` + `lib/cdp`: `?test=1&clock=fake`; `T.gezegen_*` yeni testleri, modül yoksa ATLANDI kuralı korunur |
| Performans | CDP `Emulation.setCPUThrottlingRate(4)`: planet görünümünde ortalama fps ve p95 kare süresi |
| Kayıt | mevcut self-test 70 durumu `sg3_` önekiyle yeniden çalışır |
| Ses | mevcut ses testleri ve 22/23 dosyalarının sağlama toplamı değişmediğini doğrulayan kapı |
| Android | Alarm: emülatörde `adb shell dumpsys alarm`; izin reddi; boot sonrası yeniden kurulum |

## 10. Yol haritası (her aşama APK)

| Aşama | Teslim | APK sürümü |
|---|---|---|
| 1. Temel | 80-clock, 81-planet-state, `sg3_` kayıt, SGNative iskeleti (izin+kanal), çıplak `planet` rotası | 2.4.0 |
| 2. Gezegen | Yumurta -> küre gezegen, doku, slot ve bina yerleşimi, kademeler | 2.5.0 |
| 3. Ekonomi | 82/83, iş kuyruğu, çevrimdışı çözüm, "Sen yokken", yapı bitişi bildirimi | 2.6.0 |
| 4. Savunma | 84 (12 medeniyet), 85, 86, 88: yoklama popup'ı, savunma, rapor | 2.7.0 |
| 5. Sefer ve yok oluş | 87 lojistik, saldırı, rakip/kendi yok oluşu, yeni yumurta | 2.8.0 |
| 6. Cila | Denge, eski kod emekliliği, boyut/perf ayarı, göç ekranı, yayın kontrolü | 3.0.0 |

**Riskler**

| Risk | Olasılık | Önlem |
|---|---|---|
| Android alarmları üretici pil kısıtlarıyla gecikir | Yüksek | Uygulamada "pil kısıtını kaldır" yönlendirmesi, gecikmeyi vaat etmeyen metin |
| Oyuncu kayıp hissiyle bırakır (yok oluş) | Yüksek | Kurtarma penceresi, açık geri sayım, zayıf uyarlama bandı, erken uyarı |
| Denge: tavansız zaman akışı | Orta | TUNE tek nesne, 2000 oyunculu simülasyon |
| Küre performansı 4x CPU'da | Orta | Kademeler, 10 Hz küre, dönüşü durdurma seçeneği |
| 31-world ayıklaması bağımlılık yırtar | Orta | Önce kullanım haritası, adım adım, her adımda tests/run.js |
| Saat hilesi | Düşük-orta | Bölüm 4; mükemmel çözüm yok, söylemek dürüstlük |
| Boyut 1,5 MB üzeri | Düşük | Eski kod emekliliği (~200 KB kazanç) bütçeyi karşılar |

**Özet:** Mimari, kare döngüsünden bağımsız "zaman damgalı durum + olay çözümleyici" çekirdeği (80-89) etrafında kurulur; çevrimiçi ve çevrimdışı aynı `resolve(until)` fonksiyonunu çalıştırır. Eski ses, giriş, çekmece ve yedek katmanları korunur, 07-save `sg3_` önekiyle uyarlanır. Gezegen Canvas2D arama tablosuyla çizilir, WebGL yalnız isteğe bağlı üst kademe olur. Bildirimler `SGNative` köprüsü ve AlarmManager ile gelir, alarm listesi her durum değişiminde JS'ten yeniden üretilir. Altı aşamanın her biri telefona verilebilir APK üretir.
