# SpacEgg — eksiksiz proje özeti (v0.75, 16 Kasım 2026)

Bu dosya projede bugüne kadar yapılan her şeyi konu konu toplar. Ayrıntılı kronoloji SPACEGG.md içindedir.

## 1. Proje nedir
SpacEgg, Android telefonda tarayıcıda çalışan tek dosyalık (HTML/CSS/JS) Türkçe bir "Galaxy simülasyonu" prototipidir. Akış: giriş → galaksi yumurtası mağazası → test modlu ödeme → gezegene ad verme → yükleme → canlı simülasyon. Son sürüm: spacegg-v75.html.

## 2. Kalıcı kurallar (Doktor'un)
- Doktor'a "Doktor" diye hitap edilir; cevaplar tamamen Türkçe.
- Yorum yapılmaz, yalnızca gerçek ve güncel bilgi verilir; öneri istenirse önce seçenek olarak sorulur.
- Yalnızca son çalışan .html dosyası teslim edilir (indirme sayfası, canlı önizleme, artifact yok).
- Ses efektlerine asla dokunulmaz (Doktor'un 16 Kas 2026 tarihli açık isteğiyle yapılan v0.72 revizyonu tek seferlik istisnadır). Yeni arka plan müzikleri zamanla eklenebilir, yalnızca küçük bildirim notuyla.
- Her düzeltme tüm çıktılara uygulanır: html, SPACEGG.md, İş Planı belgesi, hafıza.
- Ad her yerde "SpacEgg". "Galaxy simülasyonu" denir, oyun denmez; kullanıcılara "pilot" denmez.
- Giriş sayfası tasarımı (v0.40) korunur. Yazı tipleri: Poppins başlık, Inter metin.
- Fambo ve demo parolaları hiçbir dosyaya yazılmaz (kodda yalnızca özet değer var).
- Fambo verisi her güncellemede kaldığı yerden devam eder.
- Doktor'un yazdığı hiçbir not ertelenmez.

## 3. Sürüm geçmişi (özet)
- v0.5–v0.10: giriş, mağaza, ödeme, adlandırma, yükleme, simülasyon; seviyeler, zaman ölçeği, ses paketi, müzik, alt bant, uydular.
- v0.11–v0.14: araştırma listesi (yeni gezegen türleri, uzay/yıldız/manyetik/asteroit/komşu olayları, yaşam zaman çizgisi), ÖZELLİKLER çekmecesi, WebGL 3B gezegen, 3 görünüm (3B / GERÇEK 2B / 8 BİT).
- v0.15–v0.20: müdahale ve enerji, yaşam koşulları, rozetler, modern tasarım, tıklama efekti, komşu gezegen seçimleri.
- v0.21–v0.25: harita yakınlaştırma, detay penceresi, olay ikonları, kayan bilgi şeridi, site tarzı üst çubuk.
- v0.26–v0.34: 6 yumurta, yumurta galerisi, ikon detay penceresi, 12 ödeme yöntemi, 10'lu olay blokları, zincirleme/koşullu/mevsim olayları, ad SpacEgg oldu.
- v0.35–v0.54: neon yazı, gezegen mağazası (v0.43), eylem düğmeleri, oyuncu seviyesi, ödeme ekranı, derin uzay arka planı, galaksi bilgi şeridi.
- v0.55–v0.57: tasarım denetimi, Fambo kalıcı hesabı (v0.56), orijinal ses dosyaları ve müzik döngüleri (v0.57).
- v0.58: 50 seviye, 8. seviyeden sonra her seviye daha yavaş, olay/mevsim/mağaza süreleri seviyeyle uzar, harita her seviyede temizlenir.
- v0.59: mağaza kataloğu (63 ürün, seviye 3–50, seviye başına alım limiti).
- v0.60: alt panel yeniden tasarım, yumuşak gezegen dokunma sesi.
- v0.61: uydular yörüngede, kendi periyotlarıyla.
- v0.62: Fambo veri güvencesi (sürümlü kayıt, x1 arka plan zamanı, yedek al/yükle).
- v0.63–v0.65: seviye 20+ yaşam çeşitliliği (gezegen kimyasına bağlı gerçek ve deneysel türler, yaratık ikonları, grup sesleri).
- v0.66: harita coğrafyası (kıta, deniz, ada, dağ, yarık, kıta bölünmesi).
- v0.67: seviyeye özel olay cümleleri (10 kategori × 12 kademe).
- v0.68: iklim senaryoları (buzul erimesi, deniz yükselmesi/kuruması, çöl-orman dönüşümü, yeni buz çağı).
- v0.69: uydu oyunu (sağlık, patlama, ihmal, iletişim, element alışverişi) ve 6 uydu gönderisi (seviye 30–44).
- v0.70: tüm gezegenlerin 3B görüntüsü yenilendi, 2B ve 8 bit yeniden çizildi, yeni dokunma efekti.
- v0.71: 10 yeni arka plan müziği (toplam 48 parça).
- v0.72: gömülü 21 ses dosyasının tamamı revize edildi (6 arayüz, 11 olay, 4 müzik); kodla üretilen sesler aynı kaldı.
- v0.73: müzikler arası yumuşak çapraz geçiş (6 sn), ani bitişler ve ani kesmeler kaldırıldı.
- v0.74: gezegen sahnesine tür renginde atmosfer halesi, türe özel renk derecelendirmesi ve yeni kimlik rozeti (Frontend Design).
- v0.75: 3B gezegenlerde iklim kuşaklı orman, çöl, kar ve kumsal; seviyeyle büyüyen bitki örtüsü; deprem şok halkası; dört türlü gölgelendirmeli uydular; yumurta, gezegen ve mağaza için küçük animasyonlar.

## 4. Nasıl çalışıyor (teknik)
- Tek dosya, ES5 tarzı IIFE. Test için adrese #test eklenir (window.__t).
- Seviyeler: 50 seviye; seviye 1–8 sabit, sonrası her seviye %7 daha uzun. Yaklaşık 23,5 saatte seviye 50.
- Mağaza: ürünlerin süresi seviye çarpanıyla uzar; her seviyede yeni ürünler açılır.
- Hesap: demo ve Fambo. Fambo kaydı tarayıcıda; uygulama içinde yedek al/yükle düğmeleri var.
- Ses: ses efektleri ve olay sesleri orijinal gömülü dosyalar + kodla üretilen sesler; müzik 48 parçalık karışık çalar.
- Test yöntemi: Playwright (swiftshader), sayfa hatası, 390 ve 320 px taşma, Fambo akışı, ses testi.

## 5. Açık işler
- İş Planı ve Ar-Ge belgesi v0.69'a kadar güncel; v0.70, v0.71 ve ayrıntı tabloları (Ar-Ge, mimari, tasarım) güncellenecek.
- Denetim bulguları: olay ivDecide zaman hatası, rozet/enerji çiftlenmesi, çevrimdışı yaşam kapısı, açık #test kancası, ödeme doğrulanmıyor (test modu), ölü rAF döngüsü, sabit ses/müzik düğmeleri içeriği kapatıyor, küçük dokunma hedefleri.
- Günlük (journal) özelliği (madde 6) çok sonraya ertelendi.
- Zaman senaryosu alternatifleri (A gerçek zaman, B ritmik, C üç katman) ve 12 hikâye fikri: seçim bekliyor.
- APK: ağ erişimi açık yeni sohbette WebView kabuğuyla yapılacak.
- Gezegen yüklemesi telefonda yavaşsa doku çözünürlüğü (GN) düşürülebilir; telefondaki akıcılık ölçülmedi.

## 6. Dosyalar
spacegg-v75.html (son sürüm), SPACEGG.md (ayrıntılı hafıza), SpacEgg-proje-talimatlari.md (Projeler talimatı), SpacEgg-proje-ozeti.md (bu dosya), spacegg-stil-rehberi.html (stil rehberi). İş Planı ve Ar-Ge Dosyası Claude Docs belgesidir.
