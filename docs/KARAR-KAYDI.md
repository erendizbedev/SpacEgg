# SpacEgg 2.0 — Karar Kaydı

Kaynak: *SpacEgg — Ürün Vizyonu, Oyun Tasarımı ve Geliştirme Stratejisi* (bölüm numaraları aşağıda "B#"). Teknik ayrıntı: `docs/ARCH-2.0.md`.

## 1. Kapsam kilidi
**İçinde (dikey dilim, B1 "Başarı tanımı", B5, B12):** tohumdan evren oluşturma; Evren → Galaksi → Yıldız sistemi → Gezegen kesintisiz yakınlaştırma; zamanı durdurma/hızlandırma; yıldız yaşam döngüsü ve yörüngeler; kozmik olaylar; gezegen iklimi (neden-sonuç kararları); keşif hedefleri ve günlük; sürümlü kayıt, dışa/içe aktarma, yedek; başlangıç eğitimi; erişilebilirlik; kalite kademeleri; fotoğraf modu; ölçüm ve test altyapısı.
**Dışında (dondurulmuş, B5 "uzun vade", B11 "kapsam şişmesi"):** yaşam/ekosistem/medeniyet simülasyonu, uzaylı saldırısı senaryosu, gerçek para ekonomisi, soğuk cüzdan işlevi.

## 2. Alınan kararlar
| # | Karar | Gerekçe |
|---|---|---|
| K1 | Ürün kimliği "Universe Creation Simulator"; slogan "Create a universe. Witness its story." | B13. Rekabet avantajı menü sayısı değil, ölçek hissi ve kişisel evren hikâyesi. |
| K2 | Üç katman: Evren, Galaksi, Gezegen (arada Yıldız sistemi) | B1. Tek, kesintisiz kamera ile gezilir. |
| K3 | Simülasyon, çizimden ayrı (`SG.U` saf mantık, `SG.R` çizim) | B7. Tema veya render değişse de evren verisi korunur. |
| K4 | Deterministik tohum; simülasyonda `Math.random` yasak | B7, B4 "sahiplenme". Aynı tohum aynı evren; test edilebilir. |
| K5 | Her gösterilen özellik etiketi taşır: gerçek / basitleştirilmiş / kurgu | B2, B11. Bilimsel iddia ile kurgu karışmasın. |
| K6 | Sürümlü kayıt, 3 dönüşümlü yedek, dışa/içe aktarma, bozuk kayıt kurtarma | B3 "yerel kayıt", B10 "kayıt kaybı kritik hata". |
| K7 | Kalite kademeleri (düşük/orta/yüksek) ve otomatik seçim | B3 "performans", B7 kabul kriterleri. |
| K8 | Kademeli bilgi: her gözlem bir bilgi seviyesi açar | B4 "merak". Her şey aynı anda açılmaz. |
| K9 | Erişilebilirlik tasarıma dahil: hareket azaltma, yüksek kontrast, yazı ölçeği, liste görünümü, 44 px hedef | B6. |
| K10 | Tek sürüm kaynağı `data/version.json` + `docs/CHANGELOG.md` | B3 "sürüm tutarlılığı". |
| K11 | Eski v1 oyunu silinmez; yalnız Ayarlar'dan açılır, verisine dokunulmaz | Mevcut kullanıcı verisini koruma. |
| K12 | Giriş sayfasındaki vizyon metni korunur (%10 bağış sözü, blok zinciri/soğuk cüzdan vizyonu, Fambo) | Kullanıcı kararı; işlev değil vizyon metnidir, "yol haritasında, aktif değil" dili sürer. |

## 3. Karanlık kalıp yasağı (B4)
Zorunlu günlük giriş serisi, yapay bekleme duvarı, yanıltıcı kıtlık, agresif bildirim, ilerlemenin ödeme gücüne bağlanması **yoktur ve eklenmeyecek.** Metinlerde aciliyet/baskı dili kullanılmaz. Ödül; bilgi, koleksiyon ve başlıktır, para/enerji ekonomisi değildir. Gelir modeli düşünülürse yalnız kozmetik ve açıkça tanımlı genişleme (B4).

## 4. Ertelenenler
- Yaşam, ekosistem, evrim, medeniyet (B5 uzun vade) — temel simülasyon kararlı olmadan başlanmaz.
- Uzaylı saldırısı ve ırklar senaryosu: `docs/SENARYO-ILERI-SURUM.md` ve `senaryo-veri-taslak.json` yedekte, uygulanmaz.
- Gerçek ödeme, bağış akışı, soğuk cüzdan, blok zinciri işlevi (B3 "ödeme ve ekonomi": çalışan ve güvenli altyapı yokken ertelenir).
- WebGPU, Three.js geçişi: önce ölçüm (B7 "teknoloji kararı"). 2.0 Canvas 2D ile ilerler.
- Çok oyunculu/çevrimiçi özellikler, bildirimler.

## 5. Doğrulanması gerekenler (B kapsam notu)
Rapor kod denetimine dayanmıyor. Gerçek Android cihazda FPS, ısı, pil ve bellek ölçümü yayın öncesi yapılmalıdır (`docs/YAYIN-KONTROL.md`).
