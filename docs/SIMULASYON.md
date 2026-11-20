# SG.U — Simülasyon Çekirdeği (src/06-universe.js)

Saf mantık, DOM yok, `Math.random` yok. Birim: Myr (milyon yıl). t=0'da evren yaşı **1000 Myr** (`SG.U.BASE_AGE`); `cosmicLabel(t)` evren yaşını yazar ("1,0 milyar yıl").
Öz-test: `node out/sim-selftest.js [kaynak-dizini]` (00-core.js + 06-universe.js'i yükler; 177 bin+ doğrulama).

## Üretim ve önbellek
- `gen(seed,{preset,name,created})`: yalnız galaksi listesi + `state` döner (kayıt küçük, ~3 KB). Galaksi/yıldız/sistem **kayda yazılmaz**, tohumdan her seferinde aynı üretilir.
- `galaxy(uni,gid)` ≤6 ms; evren nesnesine bağlı (WeakMap) önbellek; yıldız nesnelerinde `_a0,_lz,_t0` iç alanları vardır (JSON'a yazmayın).
- `system(uni,sid)` önbellekli (en çok 6 sistem), her çağrıda iklim/yaşanabilir kuşak güncel yıldız parlaklığı ve `state.params` ile yeniden hesaplanır. Yıldız yaşı <20 Myr ise `forming:true`, `planets:[]` (gezegenler disk evresinde).
- Kimlikler: `g0` / `g0s12` / `g0s12p0` (0 tabanlı) / `g0s12p0m0`. Gezegen adı yıldız + b,c,d…; uydu adı gezegen + I,II…
- Presetler: sakin (7 galaksi ×~360 yıldız, olay λ=.10/Myr), yogun (9 ×~480, gezegen ×1,2, λ=.16), seyrek (7 ×~300, gezegen ×0,7, λ=.07).

## Zaman, olaylar
- `step(uni,dtMyr)` / `tick(uni,dtSec)` (= dtSec × SPEEDS[speedIx]). İlk adımda zamanlama listesi kurulur (~17 ms, `warm(uni)` ile önceden yapılabilir).
- Yıldız geçişleri (doğum, bulutsu çökmesi, yaşanabilir kuşak kayması, kızıl dev, beyaz cüce, süpernova) önceden hesaplanmış zaman listesinden; rastgele olaylar (kuyruklu yıldız, bulutsu, nova, galaksi yaklaşması) 1 Myr'lik kovalardan Poisson benzeri, tohumdan deterministik.
- **Bildirim sınırı:** en fazla 1 olay / 2,5 gerçek saniye (her hızda; test: 180 sn × 4 hız, en yoğun 1 sn penceresi = 1). Kuyruk 5 olay; taşınca en düşük önem (sonra en eski) düşer. Düşen olayın **durum etkisi yine uygulanır** (yıldız yine patlamış olur), yalnız bildirimi/günlüğü yoktur. Her adım ≤1 olay döner.
- Bildirilen olay `state.events` (son 100) ve `state.journal` (son 300) içine yazılır, `SG.bus.emit('u:event',ev)`.
- Yükleme sonrası geçmiş olaylar tekrarlanmaz (zaman listesi `uni.t`'den sonrasını alır).

## Etiketler (gercek / basit / kurgu) — `SG.U.TAGS`
| Alan | Etiket | Not |
|---|---|---|
| starClass (OBAFGKM) | gercek | Sınıflandırma gerçek; **dağılım oyun için** M .66, K .13, G .08, F .06, A .04, B .026, O .004 (gerçekte M ≈ %76, O ≈ %0,00003) |
| starMass, luminosity | basit | Parçalı kütle–parlaklık yasası (m<.43: .23m^2.3; <2: m^4; <55: 1,4m^3,5) |
| lifetime | basit | 10000·m/L Myr, 3 Myr–1 Tyr aralığına kırpılır |
| phase | basit | Fazlar gerçek; süreler basit (dev evre ömrün %12'si, süper dev %5) |
| temp (yıldız) / starColor | basit | Sınıf içi kütleye bağlı enterpolasyon |
| orbitPeriod | gercek | Kepler III: P = 365,25·√(a³/M) gün |
| orbitSpacing | basit | Titius–Bode benzeri a·oran^n (1,4–1,85), ±%7 |
| habZone | basit | [√(L/1,1), √(L/0,53)] AU |
| planetType / Radius / Mass | basit | Tür, donma çizgisi ve sıcaklıktan; kütle yarıçap^3,5 (kayaç) / 1,2·r^2,3 (gaz) |
| temp, atm, water, albedo (gezegen) | basit | Denge sıcaklığı 278,5·L^¼(1−A)^¼/√a + sera 33 K·atm^1,3·(0,6+0,4·su) + su buharı kaçak ısınması |
| habScore | kurgu | Oyun skoru 0–1 (sıcaklık, su, atmosfer, boyut, tür, yıldız ömrü) |
| moons | kurgu | Sayı/yörünge/boyut |
| galaxyKind | gercek | Hubble sınıfları; yerleşim basit; konum kurgu |
| events / eventRates | basit / kurgu | Olay türleri gerçek süreçler; oranlar oyun için |
| cosmicTime | basit | Evren yaşı = 1000 Myr + t |
| names, orbitVisual | kurgu | |

## Neden-sonuç (karar API'si için)
`climate(planet,params,star)` → `{temp,habScore,label}`; `setParams(uni,pid,{atm,water,albedo})` değeri sınırlar (0–2, 0–2, .02–.9), `state.params[pid]`'e yazar, önbellekteki gezegeni günceller. Doğrulama: Dünya benzeri 288 K/ılıman, Venüs benzeri >400 K, Mars benzeri <273 K, sera ↑ ⇒ sıcaklık ↑, albedo ↑ ⇒ sıcaklık ↓.

## Ölçümler (node 22, 9 galaksi × ~480 yıldız)
galaksi üretimi ≤5,7 ms; sistem üretimi ≤0,1 ms; step ort 0,64 ms, p95 1,3 ms, en yüksek 2,4 ms (20 Myr'de bir tam yeniden hesap karesi). 600 kare sonra kayıt ≈2,6 KB.
