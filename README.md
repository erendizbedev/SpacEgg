<p align="center"><img src="assets/social-preview.png" alt="SpacEgg" width="720"></p>

# SpacEgg 2.1 — Evren Yaratma Simülatörü
> *Create a universe. Witness its story.*

Hiçlikten bir evren yarat, galaksileri keşfet, yıldızların ve dünyaların hikâyesini izle. SpacEgg; kozmik ölçeği hissettiren, bilimden ilham alan ve baskı yapmayan, sakin bir keşif oyunudur. Android için tek dosyalık bir web uygulaması (WebView) olarak çalışır.

## Neler var
- Tohumdan evren; Evren → Galaksi → Yıldız sistemi → Gezegen kesintisiz yakınlaşma
- Zamanı durdurma ve 1000 katına kadar hızlandırma
- Yıldız yaşam döngüsü, yörüngeler, kozmik olaylar, gezegen iklimi
- Keşif hedefleri, günlük, neden-sonuç kararları
- Sürümlü kayıt, yedek, dışa/içe aktarma
- Erişilebilirlik ve kalite kademeleri
- Her bilgi "gerçek / basitleştirilmiş / kurgu" etiketli

> Sürüm geçmişi: v1.0.x APK'ları `releases/` altında durur; eski tek dosyalı v71 oyunu `spacegg-v71.html` olarak saklanır.

## Android kurulumu
1. `releases/` klasöründeki en yeni `SpacEgg-v2.1.0.apk` dosyasını indir (Android 7.0+, paket `com.spacegg.app`).
2. "Bilinmeyen uygulamaları yükle" iznini dosyayı açan uygulamaya ver ve dosyaya dokun.
3. Güncellemelerin üzerine yazılması için aynı imza anahtarı gerekir; anahtar depoda yoktur.

## Derleme
```bash
cd game && python3 -I build.py --min   # game/dist/SpacEgg.html
# test: dist/SpacEgg.html?test=1
android/build.sh                 # APK (aapt, javac, dalvik-exchange, zipalign, apksigner)
```
Oyun kaynağı `game/` klasöründedir. `src/*.js` ad sırasıyla, `css/*.css` ad sırasıyla birleşir. Sürüm `data/version.json` dosyasından gelir.

## Mimari
| Modül | Sorumluluk | Global |
|---|---|---|
| Universe Core / Simulation | tohum, evren verisi, zaman, yıldız ve gezegen kuralları | `SG.U` |
| Rendering | Canvas kamera, ölçek geçişi, fotoğraf modu | `SG.R` |
| Sprites / Tokens | yıldız, gezegen, galaksi çizimi; tasarım değişkenleri | `SG.Sp` |
| Discovery | keşif hedefleri, kararlar | `SG.Disc` |
| Save System | sürümlü kayıt, yedek, dışa/içe aktarma | `SG.S` |
| UI / UX | HUD, görünümler, eğitim, erişilebilirlik | `SG.HUD` |
| Audio | ölçek bağlı ortam sesi | `SG.A2` |
| Performance | FPS ölçümü, kalite kademesi | `SG.P` |
| Metinler | tüm sistem metinleri | `SG.T2` |
Ayrıntı: `docs/ARCH-2.0.md`, kararlar: `docs/KARAR-KAYDI.md`, değişiklikler: `docs/CHANGELOG.md`.

## Yol haritası
- 2.0: dikey dilim (bu sürüm)
- 2.x: ikinci içerik dalgası (daha çok olay, iklim ayrıntısı, keşif hedefleri)
- Uzun vade: yaşam ve medeniyet. Temel simülasyon kararlı olmadan başlanmaz.
- Vizyon (yol haritasında, aktif değil): blok zinciri ve soğuk cüzdan. Gelirin %10'u görme engelli bireylere bağışlanacaktır.

## Lisans notu
Henüz bir açık kaynak lisansı seçilmedi; tüm hakları saklıdır. © 2026 SpacEgg · Fambo tarafından geliştirildi.
