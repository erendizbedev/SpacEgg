# Test Raporu — v1.0.5 tabanı (2.0 öncesi ölçüm)

Ölçüm aracı: `node tests/bench.js dist/SpacEgg.html` · Ortam: başsız Google Chrome, 390×800 @2x, yazılım çizimi (GPU yok), sandbox ≤2 çekirdek. Ham veri: `tests/baseline-v1.0.5.json`.
Yorum notu: başsız kare süreleri telefon GPU'sundan kötümserdir; asıl amaç sürümler arası karşılaştırma tabanıdır.

| Ölçü | Değer |
|---|---|
| Tek dosya boyutu (küçültülmüş) | 503.330 bayt (≈492 KB) |
| gzip | 147.193 bayt (≈144 KB) |
| Betik bloğu | 3 |
| DOMContentLoaded / load | 61 ms / 65 ms |
| Sayfa yüklenip ilk görünüm (data-view) | 197 ms |
| JS yığını (açılışta) | ≈9,5 MB |

## Boş kare süresi (4 sn pencere, rAF)
| Ekran | fps | ortalama | p95 | en kötü | uzun görev |
|---|---|---|---|---|---|
| Giriş | 59,5 | 16,8 ms | 16,7 | 33,3 | 0 |
| Merkez (giriş sonrası) | 60 | 16,7 | 16,8 | 16,8 | 0 |
| Dünya (gezegen) | 60 | 16,7 | 16,7 | 16,8 | 0 |
| Galaksi (v1) | 56,3 | 17,8 | 16,8 | **133,4** | **3** |

Bulgu: Galaksi (v1) görünümüne ilk girişte tek seferlik ≈133 ms'lik takılma ve 3 uzun görev var (sahne kurulumu). 2.0 hedefi: görünüm geçişlerinde tek uzun görev ≤ 50 ms (sahne kurulumunu parçala/ertele).

## Otomatik test paketi (bu tabanda, `tests/run.js`)
10 geçti · 0 kaldı · 2 atlandı (SG.S ve 2.0 görünümleri henüz yok) · 65 denetim.
Kapsam: giriş ekranı, kayıt+giriş+çıkış+yanlış parola, 9 route için oturumsuz hash koruma, yeniden açılışta oturumsuz başlama, 390×800 ve 360×640 taşma (tüm route'lar), hareket azaltma, klavye (Tab), dokunma hedefleri (≥40 px), pause/resume, SG.P davranışı.

## SG.P (yeni) ölçümü
- Kare başına maliyet: ≈0,03 µs (200.000 çağrı ölçümü) → ölçüm kare süresini etkilemez.
- Sandbox'ta cihaz ipucu kademe 0 (≤2 çekirdek) verdi; 60 fps ölçülünce otomatik yükseltme yalnız ipucu kademesine kadar olur (tasarım gereği, ısınmaya karşı muhafazakâr).

## Gerçek cihaz
HENÜZ ÖLÇÜLMEDİ. `docs/YAYIN-KONTROL.md` bölüm 5'teki liste kullanıcının telefonunda doldurulmalı.
