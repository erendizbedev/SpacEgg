# SpacEgg — Yayın Kontrol Listesi

Amaç: her sürüm aynı adımlarla, kanıtlı çıksın. Kayıt kaybı = kritik hata.

## 1. Sürüm numarası (tek kaynak)
- Tek kaynak: `data/version.json` → `{"version":"2.0.0","code":6,"codename":"…"}`.
- `SG.ver` ve giriş/ayarlar ekranındaki sürüm metni buradan okunur; elle ikinci bir yerde numara YAZILMAZ.
- Android: `AndroidManifest.xml` `versionName` = `version`, `versionCode` = `code`; `build.sh` içindeki `--version-name/--version-code` aynı değerler.
- Aynı sürüm numarasını iki farklı dosya için tekrar kullanma. Dosya adı: `SpacEgg-v<version>.apk`.
- Sürüm artışı: hata düzeltme → 2.0.x; yeni özellik → 2.x.0; kayıt biçimi değişimi → ayrıca `SG.S` şema sürümünü artır + göç yaz.

## 2. Changelog
- `docs/CHANGELOG.md` en üstte yeni sürüm; başlıklar: Yeni · Değişti · Düzeldi · Bilinen sorun.
- Kullanıcının göreceği her değişiklik bir satır. "Düzeldi" satırı kök nedeni söyler.

## 3. APK imza ve güncelleme kuralları (DEĞİŞMEZ)
1. Paket adı `com.spacegg.app` değişmez.
2. SAME keystore (`spacegg.keystore`, sertifika SHA-256 `d5c3f2d5…0d5df8`). Yeni keystore üretmek kullanıcının kurulu uygulamasını bozar (güncelleme reddedilir, kaldırınca veri silinir).
3. `versionCode` her yayında önceki APK'dan BÜYÜK olmalı (v1.0.5 = 5 → 2.0.0 = 6).
4. Anahtar deposu repoya girmez; yalnız çalışma alanı + kullanıcıya sohbette verilen kopya.
5. Doğrulama: `apksigner verify --print-certs SpacEgg.apk` → aynı SHA-256; `aapt dump badging` → versionCode/versionName beklenen; APK içindeki `assets/index.html` özeti = derlenen `dist/SpacEgg.html` özeti.
6. minSdk 24 / targetSdk 34 korunur. Müzik `assets/audio/m01-m20.ogg` APK'ya girer (tarayıcı derlemesinde yoktur → test sırasında 'müzik dosyası açılamadı' uyarısı beklenir, zararsız).

## 4. Yayın öncesi otomatik testler
```
cd <proje> && python3 -I build.py --min
node tests/run.js dist/SpacEgg.html          # hepsi GECTI/ATLANDI olmalı, KALDI = yayın yok
node tests/bench.js dist/SpacEgg.html --json=tests/son-olcum.json
```
Kabul eşikleri: konsol hatası 0 · oturumsuz hiçbir route açılmaz · 390x800 ve 360x640'ta yatay taşma yok · kayıt/dışa-içe aktarma turu geçer · bozuk kayıt kurtarılır · bundle (min) ≤ 700 KB · açılış (load) ≤ 400 ms başsız · boş kare p95 ≤ 20 ms (başsız).
Başsız Chrome yazılım çizer: kare süresi telefondan kötümserdir; asıl karar gerçek cihazda (bölüm 5).

## 5. Gerçek cihaz kontrol listesi (telefonda elle)
Her madde: GEÇTİ / KALDI + not.
- [ ] **Kurulum:** eski sürümün ÜZERİNE kuruldu; "Güncelle" çıktı; eski kayıtlar (v1 kullanıcıları) duruyor.
- [ ] **Açılış:** ilk ekran ≤3 sn; giriş ekranı; klavye açılınca alanlar görünür kalıyor.
- [ ] **FPS / akıcılık:** Evren→Galaksi→Sistem→Gezegen yakınlaştırmada takılma yok; 1000× hızda da akıcı. Ayarlar → kalite "otomatik" ve elle düşük/orta/yüksek denendi.
- [ ] **Isı:** 10 dk kesintisiz oynama sonrası cihaz elde yakmıyor.
- [ ] **Pil:** 10 dk'da yüzde kaybı not et (hedef ≤ %4 orta seviye cihazda).
- [ ] **Geri tuşu:** alt ekranlardan geri → üst ekran; ana ekranda geri → uygulama kapanır.
- [ ] **Navigasyon çubuğu:** tam ekran; kenardan kaydırınca çıkar, 3 sn sonra gizlenir.
- [ ] **Home sonrası dönüş:** Home'a bas → müzik/ses kesilir; geri dön → uygulama devam eder (ya da oturum istenir); kayıt kaybı yok.
- [ ] **Ses:** müzik cızırtısız; dokunma/olay sesleri var; sessize al çalışıyor; yakınlaştırma ses katmanları değişiyor.
- [ ] **Kayıt:** evren oluştur → uygulamayı kapat/aç → giriş → evren aynı; dışa aktar → metni kopyala → içe aktar çalışıyor.
- [ ] **Erişilebilirlik:** hareket azaltma; yüksek kontrast; yazı %150; TalkBack ile liste modu.
- [ ] **Fotoğraf modu:** görüntü alınıyor, HUD'suz.
- [ ] **Uzun oturum:** 30 dk açık bırak; bellek/ısı artışı yok, takılma yok.
- [ ] **Çökme:** hiç beklenmedik kapanma yok.

## 6. Yayın adımları
1. `data/version.json` + changelog güncelle. 2. Derle (`--min`) ve testleri çalıştır. 3. `dist/SpacEgg.html` → `apk/assets/index.html`. 4. `build.sh` (aynı keystore). 5. İmza ve versionCode doğrula (bölüm 3.5). 6. GitHub: `android/`, `releases/SpacEgg-v<ver>.apk`, `docs/`, README. 7. Sabit artifact'ı yeniden yayınla. 8. Hafıza kaydını güncelle. 9. APK'yı sohbette gönder.
