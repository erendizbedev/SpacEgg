# SpacEgg — proje hafıza dosyası

Her oturumun başında bu dosya okunur. Her değişiklikten sonra güncellenir.
Son güncelleme: 13.11.2026 (v0.9 yazı tipi ve müzik) · Güncel sürüm: v0.9

---

## 1. GENEL KURALLAR (tüm projeler için)

- Kullanıcıya "Doktor" diye hitap edilir (adı Fatih).
- Cevaplar tamamen Türkçe olur. Almanca ve Hollandaca terimler Türkçeye çevrilir. Çevrilmemiş ifade bırakılmaz.
- Soru önce içeride İngilizceye çevrilir, cevap Türkçe verilir.
- Yorum yapılmaz. Yalnızca gerçek ve güncel bilgi verilir.
- Yorum veya öneri sunmak gerekirse bunu önce seçenek olarak sorulur.
- Tek seferde tek komut verilir. Onay beklenip sonra sonraki komuta geçilir.
- Dosya düzenlemede nano yerine heredoc veya `sed -i` kullanılır.
- Skill'de her değişiklikten sonra kaydetme kartı (propose_skills) gösterilir.
- Her çıktı Android telefona indirilebilir olmalıdır. (13.11.2026'dan itibaren) Kullanıcıya yalnızca çalışan son .html dosyası teslim edilir; indirme sayfası, iş planı ve canlı önizleme gösterilmez, yalnızca kaydı arka planda güncellenir.
- Projede olan biten her şey kaydedilir (hafızada /areas/spacegg.md ve bu dosyada).
- Şifreler ve kişisel veriler hafızaya yazılmaz.

---

## 2. PROJE ÖZETİ

- Ad: **SpacEgg**
- Tanım: Tarayıcıda oynanan "Galaxy simülasyonu" prototipi. (Oyun veya "pilot" kelimeleri kullanılmaz; kullanıcı pilot değildir.)
- Dil: Türkçe. ş ğ ü İ ı harfleri düzgün görünmelidir.
- Test ortamı: Kullanıcının Android telefonu.
- Biçim: Tek dosyalık HTML (CSS + JS içinde).

### Akış
1. Giriş (deneme hesabı: kullanıcı adı `demo`; ekranda "demo" düğmesi de var)
2. Yumurta mağazası: Nebula yumurtası $10, Süpernova yumurtası $30
3. Ödeme (TEST MODU): PayPal, Bitcoin, banka, MoneyGram
4. Gezegene isim verme sayfası
5. "Simülasyonu başlat" ve kısa yükleme aşaması
6. Canlı simülasyon: yumurta çatlar, gezegen doğar ve gelişir

---

## 3. TASARIM

- Siyah arka plan, 8/12-bit piksel uzay stili.
- Yazı tipi (v0.9'dan beri): **Noto Sans Mono** (tüm metinler, logo ve rakamlar dahil). Eski: Pixelify Sans ve Press Start 2P.
- Renkler:
  - Uzay Siyahı `#000000` (ana arka plan)
  - Derin Lacivert `#0B0F2A` (panel)
  - Nebula Moru `#4B1D8F` (gölge/vurgu)
  - Neon Camgöbeği `#00E5FF` (marka, çerçeve)
  - Yıldız Sarısı `#FFD400` (alt başlık, fiyat)
  - Plazma Yeşili `#39FF14` (ana buton, başarı)
  - Mars Kırmızısı `#FF4D2E` (hata, tehlike)
  - Yıldız Beyazı `#F2F2F2` (ana metin)
  - Kozmik Gri `#8A8FA8` (ikincil metin, kenarlık)
- Not: Silkscreen ve VT323 fontları Türkçe karakterlerde güvenilir olmadığı için bırakıldı.

---

## 4. v0.6 SİMÜLASYON ÖZELLİKLERİ

### Gezegen
- 96×96 piksel canvas, 3D değer gürültüsü, Bayer dithering.
- Yavaş dönüş. Başlangıçta sıcak, zamanla soğur. Atmosfer halkası büyür.
- Gezegene dokunma: nabız efekti, ses, mesaj, dokunma sayısı kaydı (bebek bakımı hissi).
- 7 gezegen türü: okyanus, çöl, lav, kayalık, buz, gaz devi, buz devi.

### Seviyeler (yumurtadan çıkıştan sonraki saniye)
| Seviye | Ad | Başlangıç |
|---|---|---|
| 1 | Doğuş | 0 sn |
| 2 | Çekirdek | 10 sn |
| 3 | Soğuma | 24 sn |
| 4 | Atmosfer | 40 sn |
| 5 | Kimya | 58 sn |
| 6 | Yüzey | 76 sn |
| 7 | Yaşam Arayışı | 94 sn |
| 8 | Olgunluk | 114 sn |

- Yıl sayacı: 0'dan 2 milyar yıla geometrik artış. Sonra saniyede 10 milyon yıl eklenir.
- Hız seçimi: x1, x5, x20.

### Olaylar
- Yaklaşık 49 şablon: jeoloji, depozit, atmosfer, kimya, yağış, yaşam.
- Örnekler: deprem (büyüklük bilgisiyle), kristal bulutları, bakır yağmuru (lav), elmas yağmuru (gaz ve buz devleri), kimyasal gelişim, tek hücreli yaşama geçiş.
- Her olay enlem, boylam ve bölge adıyla yazılır.
- Olaylar tohumlu rastgele üretilir; sayfa yenilense de aynı gezegen ve olaylar gelir.
- 97. saniyede özel sonuç olayı: yaşam bulundu / yaşam yok / koşullar uygun değil.

### Arayüz
- Sol panel: gezegen özellikleri ve element çubukları.
- Sağ panel: galaksi bilgileri (başlangıç zamanı, çatlama süresi, galaksi adı, tipi, çapı).
- Hedefler paneli: 7 hedef, ilerleme çubuklu.
- Durum paneli: 5 gösterge ve dokunma sayısı.
- Alt panel: seviye, gezegen yaşı, ilerleme çubukları, anlık olay ve konumu, açılır akış listesi.
- Gezegen üzerinde olay işaretçileri ve efektler. Deprem sırasında gezegen sarsılır.
- Düz harita (96×48) üzerinde olay işaretçileri.

---

## 4A. v0.7 GİRİŞ SAYFASI İYİLEŞTİRMELERİ

Kullanıcı 13 maddelik listenin tamamının uygulanmasını istedi. Hepsi `spacegg-v07.html` içinde.

| # | Madde | Durum |
|---|---|---|
| 1 | Hareketli yıldızlar ve kuyruklu yıldız | Yıldız kayması v0.6'da vardı; kuyruklu yıldız sıklığı 0,006 → 0,014 yapıldı |
| 2 | Logonun yanında dönen piksel gezegen | Eklendi (28×28 canvas, 140 ms'de bir döner) |
| 3 | Daktilo efektiyle "Galaxy simülasyonuna hoş geldin" | Eklendi; hareket azaltma ayarında metin anında görünür |
| 4 | Düğme sesleri ve ses ayarını hatırlama | Giriş sayfası düğmelerine dokunma sesi; AÇIK/KAPALI ayarı `localStorage` içinde |
| 5 | Şifre göster/gizle | Eklendi (GÖSTER / GİZLE düğmesi) |
| 6 | Hatalı girişte titreşim ve kırmızı uyarı | Panel titrer, alanlar kırmızı çerçeve alır, mesaj yazılır |
| 7 | Klavye açılınca alanların görünür kalması | Alana odaklanınca ortaya kaydırma ve `interactive-widget=resizes-content` |
| 8 | Beni hatırla | Yalnızca kullanıcı adı saklanır (şifre saklanmaz) |
| 9 | Kayıt ol / Şifremi unuttum | Bilgi kutusu açar: gerçek hesap sistemi yok, "demo bilgilerini doldur" düğmesi var |
| 10 | Tanıtım kartları | Üç kart: Yumurta al, Gezegenini doğur, Gelişimini izle |
| 11 | Sürüm numarası | Altta "PROTOTİP v0.7" |
| 12 | Yazı tipi yedeği | Yazı tipi 3,5 sn içinde yüklenmezse yedek yazı aralıkları devreye girer |
| 13 | Erişilebilirlik | Klavye odak çerçevesi, 44-54 px dokunma alanları, aria etiketleri |

Test sonuçları (Chrome, Playwright): 30 maddelik giriş testi başarılı (daktilo, dönen logo, şifre göster/gizle, hata ve titreşim, kayıt/unuttum kutuları, demo doldurma, beni hatırla, ses ayarı hatırlama, Enter ile giriş, 320 px ve masaüstü genişliği, hareket azaltma, sandbox iframe). 30 gezegenli simülasyon taraması sorunsuz. Düzeltilen hata: "SES" düğmesi dar ekranda logoyu kaplıyordu; giriş sayfası üst boşluğu artırıldı. Gerçek Android telefonda denenmedi.

Bilinen sınırlama: Giriş hâlâ yalnızca demo hesabıyla çalışır; kayıt ve şifre sıfırlama gerçek değildir.

## 4B. v0.8 ZAMAN ÖLÇEĞİ VE SES PAKETİ

Kullanıcı isteği: zaman çok hızlı akmasın; saat değil dakika bazında, daha yavaş bir ölçek olsun. Sesler daha güzel olsun, telifsiz kaynak varsa entegre edilsin.

### Zaman ölçeği
- Tek sabit: `TS = 15` (kodda seviye zamanlarının çarpanı). v0.7'de Seviye 8 yaklaşık 1,9 dakikada geliyordu; v0.8'de yaklaşık **28,5 dakikada** geliyor. Süreyi değiştirmek için yalnızca `TS` değeri değiştirilir.
- Seviye başlangıçları (yumurtadan çıkıştan sonra): 0, 2:30, 6:00, 10:00, 14:30, 19:00, 23:30, 28:30.
- Olay aralığı `EVS = 3` ile çarpılır (yaklaşık 11 ile 20 saniyede bir olay).
- Seviye 8'de yıl artışı saniyede 10 milyon yılın 15'te biri.
- Hız düğmesi: x1, x5, x20 ve yeni x60.
- Yumurta çatlama süresi değişmedi (8 ile 20 saniye).
- Ölçüm: Seviye 5'te sayaç 2 saniyede yaklaşık 2,6 milyon yıl ilerliyor (v0.7'de çok daha hızlıydı).
- Eski kayıtlı simülasyonlar yeni ölçekte farklı seviyede görünebilir; yeni simülasyon başlatılırsa sorun olmaz.

### Ses paketi
- Tüm sesler Web Audio ile özgün sentezlenir: telif sorunu yoktur, internet gerekmez.
- Yeni altyapı: sıkıştırıcı, yankı (reverb), zarf, süzgeç, katmanlı osilatör, çan sesi, süzgeçli gürültü.
- Arayüz sesleri: menü, başarı, hata, lazer, patlama, puan, dokunma (kabarcık).
- Simülasyon sesleri: seviye atlama (yumuşak akor + çan), deprem (alçak gürültü), yağmur, bulut, yanardağ, yaşam (çan arpeji), kıvılcım, sonar halkası.
- Fon: yumuşak uzay dokusu; yumurta çatlayınca başlar, seviyeye göre ton değiştirir, SES düğmesiyle veya sayfa değişince kapanır.
- Gerçek ses dosyası (CC0) entegrasyonu: bu çalışma alanından Kenney ve Freesound sitelerine erişim yok (403 hatası). Kullanıcı telifsiz (CC0) dosyaları indirip yüklerse dosyalara gömülür. Lisans şartlarını her dosya için kontrol etmek gerekir.
- Sesler bu ortamda dinlenemedi; yalnızca hatasız çalıştığı test edildi. Kulakla değerlendirme kullanıcıdadır.

## 4C. v0.9 YAZI TİPİ VE MÜZİK

Kullanıcı isteği: Gönderdiği ekran görüntüsündeki yazı tipi tüm projeye uygulansın; arka plan müzikleri çoğaltılsın, farklı farklı şeyler çalsın. Bundan sonra kullanıcıya yalnızca çalışan son `.html` dosyası verilecek; indirme sayfası, canlı önizleme ve iş planı kullanıcıya gösterilmeyecek, yalnızca arka planda kaydı güncellenecek.

- Yazı tipi: net, geniş aralıklı monospace. Noto Sans Mono (yüklenmezse DejaVu Sans Mono, cihazın kendi monospace yazı tipi). Logo ve rakamlar dahil her yerde. Pixelify Sans ve Press Start 2P kaldırıldı. Ekran görüntüsündeki yazı tipinin adı bilinmiyor; görünüme en yakın standart monospace seçildi.
- Müzik: 7 özgün tema (Piksel, Yıldız Tozu, Kozmik Nabız, Okyanus Işığı, Ateş Doğuşu, Uyanış, Derin Uzay). Web Audio ile sentezlenir; yaklaşık 16-24 ölçü sonra otomatik değişir (yumuşak geçiş).
- Gruplar: giriş/mağaza/isim = Piksel, Yıldız Tozu. Simülasyon Seviye 1-2 = Ateş Doğuşu, Derin Uzay; 3-4 = Derin Uzay, Kozmik Nabız; 5-6 = Okyanus Işığı, Kozmik Nabız, Yıldız Tozu; 7-8 = Uyanış, Yıldız Tozu, Okyanus Işığı.
- Sol üstte MÜZİK düğmesi: Otomatik, her tema, Kapalı döngüsü; seçim `localStorage` içinde hatırlanır. SES düğmesi hem efektleri hem müziği kapatır.
- Test: Her temada ses çıkışı ölçüldü; seviye grupları ve düğme döngüsü doğrulandı. 30 gezegenlik tarama ve giriş testleri temiz. Müzikler kulakla değerlendirilmedi; gerçek telefonda denenmedi.
- Not: İndirme sayfası ve canlı önizleme artifact'leri v0.8 sürümünde kaldı (kullanıcı istemediği için güncellenmedi).

## 5. TEKNİK NOTLAR

- ES5 stili: `var` kullanılır; ok fonksiyonu ve şablon dizgisi yok. Her şey bir IIFE içinde.
- Durum `sessionStorage` içinde (`spacegg_user`, `spacegg_sim`). Engellenirse bellek içi yedek (`memSim`) kullanılır.
- Simülasyon saati: `simEl() = base + (Date.now()-since)/1000*speed`.
- Görüntüleyici sandbox'ında `allow-forms` yok. Giriş ve isim formları bu yüzden düğme tıklaması + Enter ile çalışır.
- İndirme sayfası Artifact `downloads` yeteneğini kullanır. Dosyalar sayfaya JSON olarak gömülür (build.js).
- Test: Playwright + /usr/bin/google-chrome. Sandbox'ta Google Fonts yüklenmez; bu beklenen durumdur, hata değildir.

### Dosyalar (/home/claude)
- `spacegg-v09.html` – güncel ana prototip (Noto Sans Mono yazı tipi, 7 temalı müzik)
- `spacegg-v08.html` – v0.8 (yavaş zaman ölçeği, yeni sesler)
- `spacegg-v07.html` – v0.7 (yeni giriş sayfası)
- `spacegg-v06.html` – v0.6 (giriş sayfası eski)
- `spacegg-v051.html` – önceki onaylı sürüm
- `spacegg-stil-rehberi.html` – yazı tipi ve renk rehberi
- `ekranlar/` – ekran görüntüleri (bkz. bölüm 5A)
- `SPACEGG.md` – bu dosya

---

## 5A. EKRAN GÖRÜNTÜLERİ (v0.6, telefon genişliği 400 px, 2x)

Klasör: `/home/claude/ekranlar/`. Görüntüler bilgisayardaki Chrome'dan alınmıştır; Google Fonts yüklenmediği için yazı tipi yedek fontla görünür (telefonda Pixelify Sans kullanılır).

| Dosya | Ekran | Görünen detaylar |
|---|---|---|
| `v06-giris.png` | Giriş | Logo, "GALAXY SİMÜLASYONU" alt başlığı, kullanıcı adı ve şifre alanları, demo düğmesi, uzay arka planı |
| `v06-magaza.png` | Galaxy mağazası | İki yumurta: Nebula ($10) ve Süpernova ($30); PayPal, Bitcoin, Banka, MoneyGram düğmeleri; "TEST MODU" yazısı |
| `v06-odeme.png` | Ödeme (test) | Ürün, tutar ($30 USD), kullanıcı, yöntem, sipariş kodu; hesap ve ödeme bağlantısı "eklenmedi"; "TEST MODU: gerçek ödeme almaz" uyarısı; "ÖDEMEYİ YAPTIM" ve "VAZGEÇ" düğmeleri |
| `v06-isim.png` | Gezegen adı | Yumurta bilgisi, isim alanı, rastgele isim düğmesi |
| `v06-yukleme.png` | Yükleme | Yumurta ve ilerleme çubuğu, sistemin gezegeni belirlediğini anlatan mesajlar |
| `v06-yumurta.png` | Yumurta çatlıyor (Seviye 0) | Çatlayan yumurta, geri sayım (KALAN 00:10), ilerleme çubuğu, açıklama metni |
| `v06-okyanus.png` | Okyanus gezegeni (Seviye 7) | Gezegen yaşı 1,27 milyar yıl, işaretçili gezegen, "Tek hücreli yaşama geçildi" olayı, konum bilgisi, ilerleme çubukları |
| `v06-lav.png` | Lav gezegeni | Sıcak gezegen görünümü, olay ve konum satırı |
| `v07-giris.png` | Yeni giriş (v0.7) | Dönen logo gezegeni, daktilo satırı, şifre göster, beni hatırla, tanıtım kartları |
| `v07-hata.png` | Hatalı giriş | Kırmızı alan çerçevesi ve hata mesajı |
| `v07-bilgi.png` | Şifremi unuttum kutusu | Bilgi kutusu ve demo doldurma düğmesi |
| `v06-gaz-devi.png` | Gaz devi | Bantlı gaz devi görünümü, olay ve konum satırı |

Ekran görüntüsü eklenecek yeni konular bu tabloya satır olarak eklenir.

---

## 6. SÜRÜM GEÇMİŞİ

- v0.1–0.4: giriş sayfası, stil rehberi, font düzeltmesi (Pixelify Sans).
- v0.5: demo hesap, yumurta mağazası, ödeme (test), isim sayfası, yükleme, canlı simülasyon.
- v0.5.1: telefonda giriş sorunu düzeltildi. Kullanıcı onayladı.
- v0.9: Noto Sans Mono yazı tipi ve 7 temalı müzik (bölüm 4C).
- v0.8: zaman ölçeği (TS=15, yaklaşık 28,5 dk) ve yeni ses motoru (bölüm 4B).
- v0.7: giriş sayfası iyileştirmeleri (bölüm 4A).
- v0.6: seviyeler, yıl sayacı, olay konumları, hedefler, durum paneli, bebek bakımı etkileşimi. Chrome'da telefon ve masaüstü genişliğinde test edildi, gerçek telefonda henüz denenmedi.

---

## 7. AÇIK İŞLER

- v0.6'nın Android telefonda denenmesi ve kullanıcı geri bildirimi.
- Ödeme hâlâ test modunda (gerçek ödeme yok).
- Gezegen değerleri kurgusal simülasyon değerleridir.

## 4D. v0.10 – Küçük alt bant ve uydular (13.11.2026)
- Alt zaman bandı varsayılan olarak tek satır (~59 px): ilerleme çizgisi + SEV x/8 + gezegen yaşı + HIZ + DETAY. DETAY düğmesi tam paneli açar (KÜÇÜLT ile geri); tercih localStorage `spacegg_dock`.
- Uydular: gezegenin yanında (en fazla 5) dönen piksel uydular; Seviye 5'ten itibaren sırayla doğar; gezegen uydu sayısına göre küçülür; yeni uyduda mesaj + ses. Uydusu olmayan gezegende görünmez (uydu sayısı tür/seed'e bağlı).
- Testler: 400 px telefon + masaüstü, 8 seed uydu kontrolü, 30 seed tarama (sorun yok), giriş/müzik testleri geçti. Gerçek telefonda denenmedi.
- Dosya: /home/claude/spacegg-v10.html

## 4E. Araştırma ve iyileştirme listesi (13.11.2026) – UYGULANMADI, kullanıcı seçimi bekleniyor
Kaynaklar: Planetary Society gezegen türleri; arXiv 1801.01474 (galaktik etkiler); arXiv 2207.04164 (iç-atmosfer evrimi); arXiv 1609.09355 (GRB); arXiv 1102.2830 (iyonlaştırıcı radyasyon); arXiv 1906.06797 (süper patlamalar); A&A 608 A147 (nötron yıldızı gezegenleri); Wikipedia yaşamın zaman çizelgesi.
A Gezegen türleri: karbon, pulsar, serbest, Kthonyen, mini-Neptün, derin okyanus süper-Dünya.
B İç yaşam: magma okyanusu, radyoaktif/gelgit ısısı, atmosfer evrimi, silikat aşınması.
C Yıldız: XUV fırtınası, güneş fırtınası/CME, yıldıza kilitli gündüz-gece farkı, pulsar aurorası, manyetik alan ve radyasyon kuşakları.
D Galaksi: süpernova, GRB, magnetar, kozmik ışın, geçen yıldız, geniş çift yıldız, metal zenginliği, nötrino/kuasar (arka plan raporu).
E Asteroit: C/S/M/D/V tipleri, kuyruklu yıldız, Jüpiter rezonansı, Yarkovsky uyarısı, krater ve kimya.
F Uydular: yakalanmış/çarpışma uydusu, gelgit ısınması.
G Yaşam zaman çizelgesi (ilk hücre, fotosentez, büyük oksijenlenme, ökaryot, çok hücreli, Kambriyen patlaması, balıklar, kara bitkileri, dört ayaklılar, böcekler, ormanlar, sürüngenler, memeliler, çiçekli bitkiler, kitlesel yok oluşlar, balinalar, primatlar) – her bildirimin ayrı sesi olacak.

## 4F. v0.11 – Araştırma listesinin uygulanması (13.11.2026)
Dosya: spacegg-v11.html (v0.10 üzerine). Uygulananlar:
- Yeni gezegen türleri (6): KARBON, DERİN OKYANUS, KTHONYEN ÇEKİRDEK, PULSAR GEZEGENİ, SERBEST GEZEGEN, MİNİ-NEPTÜN (toplam 13 tür).
- Yeni bildirim kategorileri (9): YILDIZ, UZAY, MANYETİK, ASTEROİT, KOMŞU, BİTKİ, DENİZ YAŞAMI, KARA YAŞAMI, YOK OLUŞ. ~37 yeni olay şablonu: pulsar, kuasar, nötrino, süpernova, GRB, magnetar, kozmik ışın, yıldız parlaması/CME/XUV, atmosfer kaçışı, radyasyon kuşakları, manyetik fırtına/kutup değişimi/alan zayıflaması, C/S/M/V asteroit, kuyruklu yıldız, rezonans ve Yarkovsky uyarısı, komşu gezegen olayları.
- Yaşam zaman çizelgesi (60 sn sim aralıklı): DENİZ (18 evre: hücre → oksijen → ökaryot → çok hücreli → deniz patlaması → balık → bitki → dört ayaklı → böcek → orman → yok oluş → sürüngen → memeli → çiçek → yok oluş → balina → primat → olgun), BUZ ALTI (9 evre), KARA (9 evre). Yaşam yeri gezegen türüne göre. Hedefler panelinde "Yaşam:" satırları, sol panelde YAŞAM EVRESİ satırı.
- Yeni göstergeler: MANYETİK KALKAN, OKSİJEN, YÜZEY RADYASYONU.
- Ses: her bildirim türü için ayrı sentezlenmiş ses (40 adet, SND.S); olay oluşunca "Bildirim:" satırı.
- Testler: 30 seed taraması (13 tür, sorun yok), 400 seed olay/ses taraması (eksik ses yok, hata yok), uydu/alt bant testi, ekran görüntüsü. Sesler insan kulağıyla dinlenmedi; gerçek telefonda denenmedi.
- Yapılmayanlar: yaşam koşullarının oyuncuyu etkilemesi (yok oluş yalnızca bildirim); nötrino/kuasar yalnızca arka plan raporu (kaynak bulunamadı).

## 4G. v0.12 – Özellik çekmecesi ve bildirim rozeti (14.11.2026)
Dosya: spacegg-v12.html (v0.11 üzerine).
- Telefonda (genişlik < 820 px) gezegen altındaki GEZEGEN / GALAKSİ / GÖSTERGE / HEDEF panelleri sayfadan çıkarıldı; ÖZELLİKLER düğmesi (gezegenin altında) ve alt banttaki ÖZELLİK düğmesi alttan kayan çekmeceyi açar. Çekmecede 5 sekme: GEZEGEN, GALAKSİ, GÖSTERGE, HEDEF, OLAYLAR (olay listesi). KAPAT düğmesi, karartmaya dokunma, Esc veya başlığı aşağı kaydırma ile kapanır. Son açık sekme hatırlanır (localStorage spacegg_drtab).
- Bildirim rozeti: çekmece kapalıyken (veya OLAYLAR sekmesi açık değilken) gelen her yeni olay kırmızı sayı rozeti üretir (9+ üstü "9+"), düğmelerde ve OLAYLAR sekmesinde görünür; OLAYLAR sekmesi açılınca sıfırlanır.
- Masaüstünde (>= 820 px) eski üç sütunlu düzen aynen korunur; paneller ekran genişliği değişince yerine döner.
- Testler: telefon + masaüstü, sekme geçişleri, kapatma, rozet, 30 seed taraması (13 tür), ses/olay taraması: sorun yok. Gerçek telefonda denenmedi.

## 4H. Gerçekçi görünüm planı (14.11.2026) – A + B aşama aşama
Kullanıcı seçimi: A (yüksek çözünürlüklü tuval) ve B (WebGL), yavaş yavaş, her aşamada bilgi verilerek; son hali kaydedilecek.
- Aşama 1 (v0.13, TAMAM): gezegen yüzeyi 256×256 pürüzsüz çizim: dokudan örnekleme, yumuşak ışık-gölge, kenar kararması, atmosfer parıltısı, bulut katmanı (okyanus/derin okyanus/kayalık/çöl/buz/karbon), okyanusta parlama, lav çatlaklarında kendi ışığı, pürüzsüz uydular. GÖRÜNÜM: GERÇEK / 8 BİT düğmesi (üst çubuk), seçim hatırlanır (localStorage spacegg_view). Cihaz yavaşsa (ort. > 50 ms/kare, ~40 kare) otomatik 8 bit'e geçer. Ölçülen çizim süresi masaüstünde 3-6 ms; telefonda ölçülmedi.
- Aşama 2 (bekliyor): olay efektleri (patlama, yağmur, bulut, aurora, deprem) ve yumurta pürüzsüz/gerçekçi; gezegen haritası.
- Aşama 3 (bekliyor): B – WebGL 3B küre (kabartma, bulut gölgesi, atmosfer saçılması, gece ışıkları, halkalar, gerçek 3B uydular), A'ya geri dönüşle.
- Bilinen: kutup bölgelerinde düz bir kutup başlığı kenarı görünür (ince ayar bekliyor).

## 4I. v0.14 – Gerçekçi görünüm aşama 2 ve 3 (14.11.2026) – SON HAL
Dosya: spacegg-v14.html (v0.13 üzerine). Kullanıcı "geç ve bitir teslim et" dedi.
- Aşama 2: olay efektleri (işaret, yayılan halkalar, deprem, yağmur, bulut, patlama, yaşam kıvılcımları) pürüzsüz; yumurta degrade, parlama ve ışıklı çatlaklarla gerçekçi; parçalar yuvarlak; gezegen haritası dokudan pürüzsüz.
- Aşama 3: WebGL 3B küre (gölgelendirici): kabartma (bump), bulut katmanı + bulut gölgesi, atmosfer saçılması, gün batımı rengi, okyanus parlaması, lav kendi ışığı, gaz devlerinde halkalar (yaklaşık %50, gölge ve ön/arka kesişme dahil).
- GÖRÜNÜM düğmesi 3 durum döner: 3B → GERÇEK 2B → 8 BİT; varsayılan 3B; WebGL yoksa otomatik GERÇEK 2B; 2B yavaşsa otomatik 8 BİT. Seçim localStorage spacegg_view.
- Yapılmayan: gece yüzü şehir ışıkları (zeki yaşam yok), gerçek 3B uydu yörüngesi gölgesi, kutup kapağı kenarı ince ayarı.
- Testler: 12 tür × 3B ekran görüntüsü, WebGL yok/var yedek testi, görünüm döngüsü, yumurta, 30 seed taraması, 400 seed olay/ses taraması: hata yok. Telefonda (GPU/hız) denenmedi.

## 4J. Etkileşim planı (B) – 14.11.2026 (kullanıcı: "hepsini yapacağız sıra sıra")
1 Olaylara müdahale (asteroit sapıtma/koruma, yıldız fırtınası ve yakın süpernovada karar kartı) – TAMAM (v0.15)
2 Kaynak/enerji sistemi (zamanla ve dokunuşla dolan enerji; atmosfer takviyesi, kalkan güçlendirme, yaşam desteği) – TAMAM (v0.15)
3 Yaşam koşullarını yönetme (koşullar yaşam evrelerini ve yok oluşları gerçekten etkiler) – TAMAM (v0.16)
4 Hedef ve ödül sistemi (rozetler, yeni yumurta/görünüm açma, yaşam başarıları) – bekliyor
5 Komşu gezegen ve galaksi seçimleri (iletişim kur / gözlemle / görmezden gel; yörünge riski-fırsat) – bekliyor
6 Kayıt ve geri dönüş (gezegen günlüğü, "sen yokken olanlar" özeti) – bekliyor

## 4K. v0.15 – Müdahale ve enerji (14.11.2026)
Dosya: spacegg-v15.html (v0.14 üzerine).
- Enerji: 0-100; her 6 sim-saniyede +1, her dokunuşta +1; başlangıç 40. Gezegenin altında ENERJİ çubuğu.
- Eylem düğmeleri (gezegenin altında): ATMOSFER (25; gaz gezegende yok; +%15, en fazla +%30), KALKAN (20; manyetik kalkan +%15, en fazla +%30), YAŞAM (25; yalnız yaşamlı gezegende; sonraki yok oluşu hafifletir, en fazla 2 hak).
- Müdahale kartları (zaman durur, 20 sn süre; süre dolunca ücretsiz seçenek): rezonans uyarısı/yörünge kayması → yörüngeyi saptır (30) / atmosferi güçlendir (15) / çarpmaya izin ver; CME → kalkanı güçlendir (20) / karşıla; yakın süpernova ve GRB → koruma tabakası (30) / karşıla. Sonuç, listeye ayrı bir olay olarak eklenir ve oturumda saklanır (simState.ins).
- Etkiler: atmosfer ve manyetik kalkan göstergeleri, yüzey radyasyonu, atmosfer çizimi modlara bağlı.
- Test: karar kartı (asteroit ve CME yolu), enerji harcama, eylem düğmesi, 30 seed taraması, 400 seed olay/ses taraması: hata yok. Telefonda denenmedi. Not: yeniden yükleme sonrası eklenen olay kurtarma mantığı yazıldı ama test aracı oturumu sıfırladığı için ayrıca denenmedi.

## 4L. v0.16 – Yaşam koşulları (14.11.2026)
Dosya: spacegg-v16.html (v0.15 üzerine).
- YAŞAM KOŞULLARI göstergesi (GÖSTERGE sekmesi): koşul puanı = 0,5 x (100 − yüzey radyasyonu) + 0,3 x atmosfer + 0,2 x oksijen uygunluğu; yanında bir sonraki evre için GEREKEN puan.
- Evre eşiği: 50 + 2,2 x evre sırası (en çok 88). Evre zamanı gelince puan yetersizse "Evrim duraksadı" olayı çıkar ve evre yarım dönem sonra yeniden denenir; 4 başarısız denemeden sonra zorlu koşullara uyumla geçer.
- Kitlesel yok oluş: puan 75 ve üstündeyse "Kriz atlatıldı"; değilse yok oluş olur; YAŞAM desteği hakkı varsa etkisi hafifler.
- Oyuncu etkisi: ATMOSFER ve KALKAN eylemleri, müdahale kartı sonuçları ve yıldız/süpernova olayları puanı değiştirir.
- Kalıcılık: değişiklikler ve ertelemeler oturumda saklanır (simState.mut, simState.ins, simState.lp).
- Test: iyi ve kötü koşulda evre geçişi/duraksama, önceki test paketleri (30 seed, 400 seed olay/ses, karar kartı): hata yok. Telefonda denenmedi; yeniden yükleme sonrası kurtarma ayrıca otomatik denenmedi.

## 4M. v0.17 – Madde 4: Rozetler ve ödüller (TAMAM, 14.11.2026)
- Dosya: spacegg-v17.html (taban v16, patch_v17.py). HEDEF sekmesine "ROZETLER" bölümü + UNVAN eklendi.
- 15 rozet: hatch, tap10, tap100, moon, act, iv, save, surv, life, lifeall, mature, fast, full, views, nova. Her biri tek seferlik enerji ödülü (+5…+40) verir.
- Unvanlar (açılan rozet sayısına göre): 0 Yumurta Bakıcısı, 3 Gezegen Çırağı, 6 Gökyüzü Gözcüsü, 9 Yıldız Mimarı, 12 Galaksi Ustası, 15 Kozmik Usta.
- Kalıcılık: rozetler localStorage `spacegg_ach` (tüm simülasyonlar), görünüm sayacı `spacegg_vseen`; simülasyon sayaçları simState içinde (acted, ivN, ivSave, surv, fast).
- Test: t17.py (rozet açılışı, görünüm döngüsü, hız, 15/15, enerji) + 30 tohum taraması: hata yok.
- YAPILMADI: yeni yumurta türü açma (mağaza/ödeme akışına dokunmamak için). Gerçek telefonda denenmedi.
- Sıradaki: madde 5 (komşu seçimleri), madde 6 (günlük + "sen yokken olanlar").

## 4N. v0.18 modern tasarım ÖNİZLEME (14.11.2026, onay bekliyor)
- İstek: renkler aynı kalsın, tasarım modern olsun; önce ekran görüntüsü onaya sunulsun.
- Önizleme dosyası: spacegg-v18-onizleme.html (v17 + /tmp/spxwork/modern.css eklenmiş). Ekranlar: m_login/m_shop/m_sim/m_drawer.png.
- Değişenler: sistem sans yazı tipi, yuvarlak köşeli cam kartlar, ince çizgi kenarlık, gradyan yeşil düğmeler, hap şeklinde sekmeler, gradyan logo. Piksel yıldız alanı, 8 bit gezegen/yumurta çizimleri aynı.
- Onaydan sonra: son hali spacegg-v18.html olarak teslim edilecek.
- 4N devamı: Tasarım B (düz/bento, spacegg-v18b-onizleme.html) beğenildi ("harika"); düğme tasarımı ve stil/rengi değiştirilmesi istendi → v18c önizleme (spacegg-v18c-onizleme.html): ana düğme cyan→mor gradyan, 14px köşe, ikincil düğmeler cyan/sarı/kırmızı şeffaf dolgu + ince çerçeve. Onay bekleniyor.

## 4O. v0.18 modern tasarım UYGULANDI (14.11.2026)
- Onaylanan tasarım: B (düz/bento) + yeni düğme stili (cyan→mor gradyan). Dosya: spacegg-v18.html (v17 + CSS katmanı /tmp/spxwork/modern2.css). İşlev değişmedi.
- Test: t18.py (rozetler 15/15, hata yok) + 30 tohum taraması temiz. Telefonda denenmedi.
- Piksel yıldız alanı bu tasarımda gizli; 8 bit gezegen/yumurta çizimleri duruyor.

## 4P. v0.19 tıklama efekti (14.11.2026)
- spacegg-v19.html (v18 + CSS/JS): düğmelere basınca küçülme + parlama, dokunulan noktada cyan-mor dalga halkası (.rip), Android'de 8 ms titreşim; azaltılmış hareket ayarında kapalı.
- Test: halka oluşuyor ve temizleniyor, rozet testi 15/15, sayfa hatası yok. Telefonda denenmedi.

## 4Q. v0.20 – Madde 5: Komşu gezegen seçimleri (TAMAM, 14.11.2026)
- spacegg-v20.html (taban v19, patch_v20.py). 'Komşu gezegen sinyali' (iv:'sig') ve 'Komşu gezegen yakın geçiş' (iv:'gec') olayları müdahale kartı açar.
- Sinyal: İletişim kur (15 enerji; %55 yanıt +25 enerji, %25 sessizlik, %20 parazit +ışınım), Sessizce gözlemle (5 enerji; +8 enerji), Görmezden gel (ücretsiz, 20 sn sonra varsayılan).
- Yakın geçiş: Yakından gözlemle (ücretsiz; %50 +25 enerji, %35 gelgit sarsıntısı −atmosfer +ışınım, %15 sakin), Kalkanı güçlendir (20 enerji, kalkan +0.05), Akışına bırak.
- Yeni rozetler: temas (komşudan yanıt al), gozlem (komşu olayında gözlem) → toplam 17; yeni unvan 17 rozette "Galaksi Elçisi".
- Test: t20.py (2 olay × 3 seçenek, kart + sonuç + rozet, hata yok), 30 tohum taraması, rozet 15/17 senaryosu. Telefonda denenmedi.
- Sıradaki: madde 6 (günlük + "sen yokken olanlar").

## 4R. v0.21 – Harita karesine dokununca yakınlaştırma (14.11.2026)
- İstek: haritada kare kare gelişmeler oluyor; kareye dokununca yakınlaşıp ne olduğu görülsün.
- spacegg-v21.html (taban v20, patch_v21.py): harita 4×2 = 8 kare (kuzey/güney × 90°'lik boylam dilimleri). Kareye dokunma → "BÖLGE n/8" penceresi: kare 240×240 yakın görünüm (3B/gerçek görünümde dokudan yüksek çözünürlük, 8 bit'te piksel), numaralı renkli olay işaretleri (en yeni 1), listede yıl, kategori, başlık, açıklama, koordinat; listeden veya işaretten seçim vurgulanır; sürerken 1,5 sn'de bir yenilenir; KAPAT/arka plan/Esc ile kapanır; açıkken MÜZİK/SES düğmeleri gizlenir.
- Yeni rozet: harita (Bölge gezgini, +5 enerji) → toplam 18.
- Test: t21.py (3B ve 8 bit: aç, liste, seçim, kapat, rozet; hata yok), 30 tohum taraması, t21b (komşu kartları) temiz.

## 4S. v0.22 – Detay penceresi kapat tuşu (14.11.2026)
- spacegg-v22.html (v21 + küçük CSS/HTML değişikliği): bölge penceresinin sağ üstünde yuvarlak "✕" kapat tuşu (44 px, aria-label Kapat); üst şerit kaydırırken sabit (sticky), böylece liste uzasa da tuş görünür kalır; otomatik odak çerçevesi kaldırıldı.
- Test: t22.py (3B ve 8 bit açma/kapatma, hata yok).

## 4T. v0.23 eylem ikonları ÖNİZLEME (14.11.2026, onay bekliyor)
- İstek: haritada oluşan eylemler için eylem tipi renginde uygun ikonlar; hem haritada hem akışta.
- spacegg-v23.html (v22 + patch_v23.py): 15 kategori için çizgi ikon seti (jeo dağ, dep kalp ritmi, atm bulut, kim şişe, yag damla, yas filiz, yil güneş, uzy parıltı, man mıknatıs, ast göktaşı, kom halkalı gezegen, bit yaprak, den balık, kar pati, yok uyarı üçgeni). Haritada renkli daire içinde ikon (yüksek çözünürlüklü üst katman #pmapI, son olay beyaz halkalı), akışta ve bölge penceresinde çip içinde ikon, bölge penceresinde işaretlerde ikon + köşede numara.
- Teslim: onay bekleniyor (önizleme ekran görüntüleri gönderildi; html henüz gönderilmedi).
- 4T sonu: İkonlar onaylandı ve uygulandı → spacegg-v23.html teslim edildi (14.11.2026). Test: 30 tohum taraması, bölge penceresi (3B + 8 bit), komşu kartları temiz, hata yok. Telefonda denenmedi.

## 4U. v0.24 – Sıkı üst bölüm + kayan bilgi şeridi (14.11.2026)
- İstek: gezegenin üstündeki yazılar küçülsün/sıkışsın ama okunaklı kalsın; gezegen adı, niteliği, koordinatlar, teknik gelişmeler ve hava durumu farklı renklerde sola kayan yazıyla animasyonlu gösterilsin.
- spacegg-v24.html (taban v23, patch_v24.py): simülasyon sayfasında başlık/alt başlık/kullanıcı çubuğu/gezegen adı/seviye/yaş satırları küçültüldü; seviye-yaş satırlarının altına kayan şerit (#tick) eklendi: 48 px/sn sola kayar, kenarlar solar, JS ile pürüzsüz döngü, 1,5 sn'de bir içerik yenilenir; azaltılmış harekette kaydırılabilir şerit.
- Şerit içeriği ve renkleri: sarı = ad · tür · nadirlik; turuncu = seviye; cyan = görünen yüz boylamı ve son olay koordinatı; yeşil = sıcaklık, atmosfer, yerçekimi, manyetik kalkan, radyasyon, oksijen, gün/uydu; pembe = hava durumu (atmosfer + sıcaklık ve ışınım sözcüğü); kategori rengi = son gelişme. Yumurta evresinde yumurta bilgisi ve kalan süre.
- Test: t24.py (360 ve 400 px genişlik, şerit hareketi, yatay taşma yok, hata yok), 30 tohum taraması, bölge penceresi, komşu kartları. Telefonda denenmedi.

## 4V. v0.25 – Site tarzı üst çubuk, ikon düğmeleri, kimlik kartı (15.11.2026)
- İstek: üst alan web sitesi gibi olsun; kullanıcı adı, gezegen adı, proje ikonu ve ismi daha güzel/gerçekçi/modern; MÜZİK/SES yazıları yerine modern ikonlar.
- spacegg-v25.html (taban v24, patch_v25.py): simülasyon sayfasında site tarzı üst çubuk (.nav): halkalı gerçekçi gezegen logosu (SVG, degrade) + degrade "SPACEGG" yazısı (≥460 px genişlikte "GALAXY SİMÜLASYONU" alt yazısı); sağda kullanıcı hapı (avatar baş harf + ad) → açılır menü: Görünüm, Yeni simülasyon, Çıkış (kimlikler aynı: viewBtn/newSim/logout3); Esc/dış tıklama ile kapanır.
- MÜZİK/SES: tüm sayfalarda yuvarlak 40 px cam ikon düğmeleri (nota, hoparlör); kapalıyken gri + üstü çizili, müzik açıkken cyan parıltı; yazılar erişilebilirlik için aria-label/title'da.
- Gezegen kimlik kartı (.hero): solda degrade gezegen adı, sağda seviye ve yaş.
- Test: t25.py (360 px: menü açma/kapama, görünüm değiştirme, ses/müzik sınıfları, yatay taşma yok, hata yok), 30 tohum taraması, bölge penceresi, komşu kartları.

## 4W. Madde 6 ERTELENDİ (15.11.2026)
- İstek: madde 6 (gezegen günlüğü + "sen yokken olanlar" özeti) çok sonra için saklansın. Plan 4J'de duruyor; kullanıcı istemeden başlanmayacak.
- Yeni fikir (kullanıcıdan): ödeme yöntemlerini çoğalt ve yöntemlere uygun ikonlar koy (mağaza ödeme ekranı, test modu). Başka önerilerin de sunulması istendi.

## 4X. v0.26 — Yumurta çeşitleri
- 6 yumurta: Nebula $10, Süpernova $30, Pulsar $20 (manyetik, pulsar/kara tür), Kuasar $50 (gaz devi, halka, uzun çatlama), Kara Delik $75 (uzun çatlama, daha sık olay), Kozmik ÜCRETSİZ (10 rozetle açılır, dengeli).
- Her yumurtanın kendi piksel çizimi ve paleti; ödeme test modunda. Ücretsiz yumurta ödemeyi atlayıp isim ekranına gider.
- Yeni rozet: "Yumurta koleksiyoncusu" (3 farklı yumurta, +15).
- Test: mağaza 360 px, kilitli/açık Kozmik, 4 yeni yumurtayla simülasyon, 30 tohum taraması: hata yok. Gerçek telefonda denenmedi.

## 4Y. v0.27 — Yatay yumurta galerisi
- Mağazada yumurtalar yana kayan galeri (scroll-snap, kart genişliği %72), üstte "SAĞA SOLA KAYDIR" ipucu, noktalı konum göstergesi. Seçim/kilit/ödeme mantığı değişmedi. Test: 360 px, yatay taşma yok, hata yok.

## 4Z. v0.28 — İkona tıklayınca siyah detay penceresi
- Bölge penceresinde (yakınlaştırma) bir ikona basınca ikonun yanında küçük siyah pencere açılır (kategori renginde çerçeve, Noto Sans Mono, ✕ ile kapanır; boş yere dokununca da kapanır).
- İçerik: kategori + yıl, başlık, ölçek (depremlerde şiddet), konum (bölge · koordinat), sebep (kategoriye göre kısa neden), açıklama.
- Test: 400 px, 3B ve 8 bit görünümde açılma/kapanma, hata yok. Gerçek telefonda denenmedi.

## 4AA. v0.29 — Ödeme yöntemleri galerisi
- Ödeme yöntemleri yana kayan galeri; 12 yöntem, her birinin ikonu ve rengi: PayPal, Kart (Visa·Mastercard·Troy), Apple Pay, Google Pay, Papara, Bitcoin, Ethereum, USDT (TRC-20), Banka (Havale/EFT/IBAN), Wise, MoneyGram, Western Union.
- Yeni buton: yuvarlak köşeli kart, ikon kutusu, ad, alt yazı, gradyanlı "ÖDE" hapı. Ödeme ekranı test modunda; satıcı bilgileri boş ("eklenmedi").
- Test: 360 px, 12 buton, yumurta seçmeden uyarı, 4 yöntemle ödeme ekranı, yatay taşma yok, hata yok.

## 4AB. v0.30 — 10'lu olay blokları + haritada kalıcı oluşumlar
- Her kategoride 10. olay tamamlanınca (20, 30... da) otomatik "★" sonuç olayı çıkar: jeoloji → dağ/yanardağ, deprem → fay yarığı, asteroit → krater, yağış → deniz, deniz yaşamı → okyanus, bitki/yaşam → orman, kara yaşamı → ova, kimya → uzaylı medeniyet (ufo), atmosfer → kalıcı fırtına; diğerleri (manyetik, uzay, yıldız, komşu, yok oluş) kendi başlıklı "iz/alan". Gaz gezegenlerinde kara oluşumları kalıcı fırtınaya dönüşür.
- Sonuç olayları rastgele ad alır (örn. "Texnix Yanardağı", "Quosel Krateri"), haritada kalıcı ikon + yazılı adla kalır; zoom penceresinde de görünür; popup'ta "Tetik" ve "Ad" satırları.
- Sonuç olayları deterministiktir (aynı tohum = aynı oluşumlar); diğer olayların dizisi değişmedi.
- Ertelenen: kıtalara bölme + kıta isimleri (aşama 3), deniz/dağ/mevsim özellik kartları (aşama 4).
- Test: 18 tohum × 6 yumurta, sıralama doğru, hata yok. Gerçek telefonda denenmedi.

## 4AC. v0.31 — Harita ikon hatası düzeltildi
- v0.30'da harita ve zoom penceresindeki tüm ikonlar aynı yıldız (UZAY) çıkıyordu: yeni eklediğim `evKey` işlevi dosyadaki eski `evKey` ile aynı adı taşıyordu. Adı `evIcon` yapıldı; her olay kendi kategori ikonuyla (ve ★ sonuç olayları kendi oluşum ikonuyla) çiziliyor.
- Test: harita ekran görüntüsü, farklı ikonlar görünüyor, hata yok.

## 4AD. v0.32 — Zincirleme, koşullu ve mevsim olayları + benzersiz açıklamalar
- Zincirleme olaylar (12 şablon): volkan→kül bulutu→volkanik kış, deprem→artçı/heyelan/dev dalga, asteroit→toz/metal/sıcak yağış, CME→manyetik fırtına→aurora, süpernova/GRB/magnetar→radyasyon dalgası, fırtına→yıldırım yangını, yağmur→nehir yatağı. Çocuk olay ebeveynin yakınında doğar; popup'ta "Zincir: ebeveyn → olay".
- Koşullu olaylar (12): gezegenin sıcaklık, yerçekimi, gün uzunluğu, uydu sayısı ve yaşam durumuna bağlı (kuraklık, kavurucu sıcak, donma, uydu hizalanması/tutulması, yerçekimi çökmesi, gaz sızıntısı, uzun gece, hızlı rüzgârlar, evrimsel sıçrama, büyük göç, mutasyon, salgın).
- Mevsimler: seviye 5'ten itibaren her 18 EVS'de bir mevsim değişimi (kuzey/güney karşıt mevsim, sıcaklık, gezegen türüne göre ad); ara sıra iklim olayı (buzul çağı, sera dönemi, kuraklık çağı, büyük su baskını, kasırga mevsimi). Kayan şeritte "MEVSİM ..." görünür.
- Benzersiz açıklamalar: her olay şablon cümlesine ek olarak 15 kategoriye özel, sayılı/adlı ayrıntı cümlesi alır (rotasyonlu); aynı tam metin bir simülasyonda tekrar etmez. Not: baştaki şablon cümlesi aynı kalabilir, ayrıntı cümlesi ve sayılar her seferinde değişir.
- Test: 24 tohum × 6 yumurta, sıra doğru, tekrar eden tam metin 0, hata yok. Gerçek telefonda denenmedi.

## 4AE. v0.33 — Proje adı SpacEgg oldu
- Proje adı Spx4gg → SpacEgg oldu. Sayfa başlığı, tüm başlıklar ve üst menü logosu "SpacEgg" (EGG kısmı sarı-turuncu gradyan). Sipariş referansı ve yıldız adı öneki SPX- → SEG-.
- Dosya adı artık spacegg-vNN.html; proje dosyası SPACEGG.md (eski dosya SPACEGG_eski.md olarak duruyor).
- Kayıt anahtarları v0.35'te spacegg_* oldu; eski spx4gg_* verileri açılışta otomatik taşınır (rozetler kaybolmaz).

## 4AF. İş planı ve Ar-Ge dosyası güncellendi (15.11.2026)
- Belge adı "SpacEgg – İş Planı ve Ar-Ge Dosyası" oldu (artifact RP6QmLYGCsWx9Wz1jJgvAq). v0.9'da kalmıştı; v0.33 durumuna getirildi: yönetici özeti, sürüm geçmişi (v0.10–v0.33), 6 yumurta tablosu, 12 ödeme yöntemi, sıradaki işler, güncelleme günlüğü.
- Güncellenmeyen kısımlar: Ar-Ge bölümleri (gezegen üretimi, olay sistemi), teknik mimari, tasarım sistemi ve ekran görüntüleri hâlâ eski sürümleri anlatıyor.

## 4AG. v0.34 — Yazım SpacEgg oldu
- Kullanıcı yazımı "SpacEgg" olarak istedi (v0.33'te SpacEgg idi). Tüm başlıklar, üst menü logosu ve sayfa başlığı güncellendi; "Egg" kısmı sarı-turuncu gradyanlı.
- Not: iş planı/Ar-Ge belgesi ve hafızada hâlâ "SpacEgg" yazımı geçiyor olabilir; kullanıcı yalnız .html için istedi.

## 4AH — Ekran görüntüleri silindi, kalıcı kural
- Eski ekran görüntüleri (PNG dosyaları ve ekranlar/ klasörü) silindi; Ar-Ge belgesindeki "Ekran görüntüleri" bölümü kaldırıldı.
- Yazım her çıktıda "SpacEgg" (SpacEgg değil).
- KALICI KURAL: Doktor'un söylediği her düzeltme; html, SPACEGG.md, Ar-Ge/iş planı belgesi ve hafıza dahil tüm rapor ve çıktılara uygulanır.
- Spx4gg adı her yerde SpacEgg yapıldı: tüm .html dosya adları ve içerikleri (spacegg-*.html), bu dosya, Ar-Ge belgesi, hafıza.
- v0.35 (taslak, teslim edilmedi): haritada bölge lekeleri + yarımküre mevsim bandı/rozeti, mevsim/iklim/özellik ikonları ve sesleri, modern dokunma sesleri, 30 parçalı karışık müzik (arka arkaya tekrar yok), müzik düğmesi aç/kapa.
- v0.35 (spacegg-v35.html) test edildi (30 parça, tekrar yok, müzik aç/kapa, mevsim rozeti ve ikonlar, sesler hatasız, anahtar taşıma) ve teslim edildi.
- v0.36 (spacegg-v36.html): ÖZELLİKLER düğmesi gezegenin üstüne (akan yazının altına) ince, saydam, cam efektli sekme çubuğu olarak taşındı (menü ikonu, harf aralıklı yazı, bildirim rozeti, yukarı ok). Çekmece açılışı test edildi, taşma yok.
- v0.37 (spacegg-v37.html): ÖZELLİKLER panelinde tüm çubuklar ve yazılar kategori renginde: göstergeler (yaşam koşulları yeşil, sıcaklık turuncu, atmosfer camgöbeği, kabuk kahve, kimya mor, yaşam potansiyeli açık yeşil, manyetik pembe, oksijen mavi, radyasyon kırmızı), hedefler (yörünge mavi-mor, çekirdek sarı, atmosfer camgöbeği, kimya mor, yüzey kahve, tek hücreli yeşil, olgunluk pembe; yaşam zinciri deniz mavi/bitki yeşil/kara turuncu) ve elementler (her elementin kendi rengi). Çubuklar o renkte dolar/azalır, parıltı ve yumuşak geçiş eklendi. Test: GÖSTERGE ve HEDEF sekmeleri ekran görüntüsüyle doğrulandı.
- v0.38 (spacegg-v38.html): sahneli giriş sayfası: arkada yıldız alanı + dönen spiral galaksi, ortada nabız gibi atan kozmik yumurta (renk akışı, çatlak ışığı, yörüngede gezegen, kıvılcımlar), cam efektli giriş kartı ve adım kartları; girişe basınca yumurta çatlayıp ışıkla patlar, sonra mağaza açılır. Altında canlı galaksi şeridi: çevrimiçi, aktif gezegen, bugün doğan + kayan olay satırı. DİKKAT: sayaç değerleri ÖRNEK VERİ (sunucu yok), şeritte 'ÖRNEK VERİ' yazıyor. Test: 390/320 px taşma yok, 61 kare/sn, giriş-patlama-mağaza akışı hatasız.
- v0.38 sayaçları: açılışta rastgele belirlenir (çevrimiçi 60-480, aktif gezegen 2000-9000, bugün doğan 20-200), sonra hafifçe değişir; sabit veriye bağlı değil. Etiket 'ÖRNEK VERİ' kalır.
- v0.39 (spacegg-v39.html): (1) TİPOGRAFİ: tüm projede Noto Sans Mono kaldırıldı; yazı tipleri dosyaya gömüldü (internet gerekmez): başlık/logo/düğme/fiyat = Poppins Medium+Bold, metin/etiket = Inter 400-700 (Türkçe karakterler test edildi). (2) Giriş sayfası: sayaç kutusu kaldırıldı; en üstte sola kayan şerit (ÖRNEK VERİ etiketli: çevrimiçi, aktif gezegen, bugün doğan + olay mesajları, her turda sayılar yenilenir). (3) Logo gezegeni: gerçekçi dönen gezegen (okyanus/kıta/kutup buzu/bulut dokusu, ışık-gölge, atmosfer halesi, gece tarafı), arkasında sağdan sola akan renkli yıldızlar. Test: 390/320 px taşma yok, hatasız; giriş→patlama→mağaza→sim çalışıyor. Dosya boyutu ~490 KB (gömülü yazı tipleri).
- v0.40 (spacegg-v40.html): giriş formu yeniden tasarlandı: küçük başlık + 'Gezegenine dön', alanlar yumuşak çerçeveli (radius 14, ikonlu, odakta cyan parıltı), GÖSTER küçük hap düğme, özel küçük onay kutusu, kompakt düğmeler ve bağlantılar, demo bilgisi kesik çizgili küçük kutu. Test: 390 px taşma yok, hatasız, hata mesajı çalışıyor.
- v0.41 (spacegg-v41.html): yumurta mağazası: görsel 150→78 px; kartlar merkezde kayan galeri (kenarlarda komşu kart görünür, aktif kart büyük/parlak, diğerleri soluk, noktalar senkron); tipografi (Poppins ad/fiyat, Inter açıklama, hap etiket); fiyatın yanında altın para ikonu + USD; ödeme kartları eşit yükseklik ve hizalı (PayPal dahil; Western Union adı W. UNION oldu, Kart alt yazısı tek satır). Test: tüm ödeme kartlarında başlık konumu aynı, 390 px taşma yok.
- v0.42 (spacegg-v42.html): yazılarda kendi renginde neon parıltı (başlık, etiketler, göstergeler, fiyat, düğmeler, kayan şerit); giriş sayfası tasarımı korundu.

## 4AI — Genel proje durumu (v0.42, 15.11.2026)
- Akış: giriş (sahneli, demo hesap) → yumurta mağazası (6 yumurta, merkezde kayan galeri, fiyat + para ikonu) → ödeme (12 yöntem, test modu) → gezegen adı → yükleme → canlı simülasyon (8 seviye).
- Simülasyon: 3B/2B/8 bit görünüm, olay haritası (mevsim bandı, bölge lekeleri, kalıcı özellik ikonları), zincir/koşullu/mevsim/iklim olayları, rozetler, oyuncu müdahaleleri, özellikler paneli (kategori renkli çubuklar).
- Ses: dokunma/menü/onay sesleri modern; her olay türüne ayrı ses; 30 parçalı karışık müzik (tekrar yok), müzik düğmesi aç/kapa.
- Tasarım: Poppins (başlık/düğme/fiyat) + Inter (metin), dosyaya gömülü; neon parıltı; SpacEgg yazımı (Egg sarı-turuncu gradyan).
- Bilinen/örnek: giriş şeridindeki sayılar örnek veri; gerçek Android telefonda test edilmedi; günlük/"sen yokken olanlar" (madde 6) ertelendi; kıtalar, mevsim özellik kartları, medeniyet olayları, kalıcı gezegen kaydı hâlâ bekliyor.
- Kurallar: Türkçe yanıt, "Doktor", yorum/öneri yalnızca istenirse, tek komut, heredoc/sed, her düzeltme tüm çıktılara (html, bu dosya, belge, hafıza) uygulanır, yalnızca son .html teslim edilir.

## 4AJ Gezegen mağazası (v0.43)
- Yumurta çatlayıp SEVİYE 3 başlayınca (lvlInfo(ts).i>=2) planet ekranında "GEZEGEN MAĞAZASI" düğmesi çıkar; pencerede TEST MODU etiketi, 12 ödeme yöntemi (varsayılan Bitcoin), 8 gönderi: Demir meteoru, Mikrobiyal bulut, Su kütlesi, Civa buharı, Azot, Potasyum, Fosfor, Buz kuyruklu yıldızı.
- Satın alınca gerçek saniye geri sayımlı kuyruk (en fazla 6, simState.q, sayfa yenilense korunur). Varışta olasılıksal etki: modS() alanları atm/mag/rad + yeni liv (yaşam koşulu eklemesi, lifeVals'a eklendi); kalkan güçlüyse risk azalır, koşul düşükse artar.
- Olay kaydı: yararlı kategori 'shy' (yeşil, yıldız ikonu), zararlı 'shz' (kırmızı, uyarı üçgeni); her gönderi için ayrı yararlı/zararlı ses (sh_<id>y/z). Olaylar simState.ins ile kalıcı.
- Test: 390/320 px taşma 0, hata yok, kilit/kuyruk/etki/yenileme doğrulandı. Gerçek telefonda denenmedi.

## 4AK Eylem düğmeleri tasarımı (v0.44)
- ENERJİ satırına yıldırım ikonu ve turuncu-sarı bar; ATMOSFER (cyan, bulut), KALKAN (mor, kalkan+artı), YAŞAM (yeşil, filiz) düğmeleri ayrı renk/ikon, maliyet yanında küçük yıldırım ikonu. Test: 390/320 px taşma 0, hata yok.

## 4AL Giriş karşılama yazısı (v0.45)
- "Galaxy simülasyonuna hoş geldin" satırı tek satıra sığar (320/360/390 px doğrulandı), Poppins 600, cyan→mor→pembe gradyan + neon parlama, yazma imleci sarı.

## 4AM Giriş yazısı düzeltmesi (v0.46)
- Yazı Türkçe: "Sınırlı sayıda gezegen var". Yazı boyutu JS ile (fitType) ekran genişliğine ve imlece göre küçülür; telefon yazı ölçeği büyük olsa da taşmaz (17 px üst sınır).

## 4AN Ödeme ekranı tasarımı (v0.47)
- Fiş görünümü: başlık + TEST MODU rozeti, çizgili özet kartı (tutar sarı neon, yöntem kendi renginde, sipariş kodu mono), "eklenmedi" kırmızı rozet, uyarı sarı kutu, durum yeşil kutu; yazılar 14 px, Inter/Poppins; yönteme göre kenarlık rengi (--mc).

## 4AO Derin uzay arka planı (v0.48)
- Yumurta çatladıktan sonra simülasyon ekranında sabit #deepBg canvas: aşağı akan 3 katmanlı yıldız (paralaks), ara sıra kayan yıldız, uzak soluk gezegenler (biri halkalı), mor/mavi/pembe bulutsu. Yumurta evresinde ve giriş/mağaza ekranlarında gizli; azaltılmış hareket tercihinde durağan.

## 4AP Oyuncu seviyesi (v0.49)
- Enerji satırının üstünde "OYUNCU n · ÜNVAN" + XP çubuğu (pembe-mor). Gereken puan her seviyede artar: 40·1,35^(n-1). Kaynaklar: eylem +10, mağaza gönderisi +6 (varışta yararlı +12 / zararlı +4), müdahale kararı +8. Seviye atlayınca +25 enerji ve bildirim. 10 ünvan (Acemi…Efsane). simState.xp ile kalıcı.

## 4AQ ÖZELLİKLER düğmesi (v0.50)
- Hap biçimli düğme: cyan→mor→pembe degrade çerçeve, solda parlak ızgara ikonlu daire, ortada degrade neon yazı (Poppins), sağda yuvarlak ok; yavaş parlama süzülmesi (hareket azaltmada kapalı). Bildirim rozeti korunur.

## 4AR Oyuncu adı (v0.51) ve yumurta mağazası görselleri (v0.52)
- v0.51: seviye satırında "OYUNCU" yerine bağlı kullanıcı adı; yanında "SEV n · ÜNVAN".
- v0.52: her yumurta kendi renginde (nebula cyan, nova turuncu, pulsar mor, kuasar pembe, kara delik mavi-mor, kozmik yeşil) parlak hale, nefes alan aura, büyük süzülen yumurta, renkli kenarlık; yeni seçenek rozetleri (tür eğilimi + çatlama süresi aralığı).
- Müzik isteği (gerçek telifsiz uzay müziği): atölye ağı kapalı, dosya indirilemiyor; kullanıcıya seçenekler sunuldu, cevap bekleniyor.

## 4AS Ödeme ekranı biletli tasarım (v0.53)
- 3 adımlı ilerleme (Seçim ✓ · Ödeme · İsim), yumurta görselli bilet kartı (aura, büyük sarı tutar, yöntem ikonu ve rengi), delikli kesik çizgi, altında kullanıcı/yöntem/sipariş kodu; sayfa rengi seçilen yumurtanın rengini alır; ödeme sonrası 2. adım ✓, 3. adım aktif ve yeşil onay kutusu.

## 4AT Galaksi bilgi şeridi (v0.54)
- Kayan şerit: kullanıcı, çevrimiçi kişi, gezegen, kara delik, bugün doğan sayıları; renkli ikonlar ve neon rakamlar; her girişte rastgele başlangıç değerleri, her turda kayar. "ÖRNEK VERİ" etiketli (gerçek veri değil). Giriş, mağaza ve gezegen ekranlarında.

## 4AU Kalıcı hesap: Fambo (v0.56)
- Kullanıcı adı Fambo, şifre kullanıcı tarafından verildi (bu dosyada tutulmaz; kodda yalnızca özet değeri var, gerçek güvenlik değildir). Girişte sim durumu, siparişler, rozetler, görünüm tercihleri localStorage'daki `spacegg_acct_fambo` kaydından yüklenir; 4 sn'de bir, sekme kapanırken ve çıkışta otomatik kaydedilir. Çıkış kaydı silmez. Zaman gerçek saate bağlı (Date.now) olduğundan gezegen uygulama kapalıyken de ilerler; girişte "arka planda X dk ilerledi" bildirimi. Demo hesabı eskisi gibi kalıcı değildir.
- Sınır: kayıt yalnızca o telefonun tarayıcısında durur (sunucu yok); tarayıcı verisi silinirse gider.

## 4AV Tasarım denetimi düzeltmeleri (v0.55) ve yeni öykünmeler (v0.56)
- v0.55: dokunma hedefleri 44 px, alt panel altında boşluk, çekmece sekmeleri kaydırma ipucu ve ortalama, küçük yazılar büyütüldü, 320 px'te kullanıcı adı gizlenir, mağaza penceresi ses düğmelerinden kaçtı.
- v0.56: karar kartı öykünmeleri "Sıcak bacalar" (Seviye 3-5, okyanus/buz) ve "Yıldırım yangını" (Seviye 7-8, yaşam varsa). Raporlar: /tmp/design_audit/RAPOR.md, /tmp/senaryo/RAPOR.md (12 öykünme, ilk paket 12-5-7-9-11, 3 zaman alternatifi; seçim bekleniyor).

## 4AW Orijinal ses dosyaları (v0.57)
- Ajanla sıfırdan sentezlenen telifsiz sesler gömüldü (base64, #afdata): 6 arayüz sesi (tap, menu, ok, err, coin, levelup), 11 olay sesi (deprem, meteor, yağmur, kimya, yaşam, volkan, okyanus, manyetik, yıldız fırtınası, yararlı, zararlı) ve 4 müzik (huzurlu D Lidyen, gizemli A Frigiyen, görkemli C majör, gerilimli). Dosyalar /tmp/audio_out (kaynak kod src/ altında).
- Dosya sesi yoksa eski sentez sesine geri döner. Müzik karışık listesinde dosya parçaları ile sentez temaları sırayla (biri dosya, biri sentez) çalar; müzik düğmesi aç/kapa aynı.
- Sınır: sesler headless testte dinlenemedi; yalnızca çözülme/çalma ve seviyeler ölçüldü. Dosya boyutu ~2,9 MB.

## 4AX — Müzik/ses kuralı (Doktor, 15 Kas 2026)
- Ses dosyaları ve üretilmiş arka plan müzikleri beğenildi.
- Zamanla yeni arka plan müzikleri kendiliğinden üretilip projeye eklenecek; Doktor'a yalnızca kısa bildirim notu verilecek.
- Ses efektlerine (tap/menu/ok/err/coin/lvl/fx/mağaza sesleri) ASLA dokunulmayacak. (Tek istisna: Doktor'un 16 Kas 2026 tarihli açık isteğiyle yapılan v0.72 revizyonu, bkz. 4BL.)

## 4AY — 4 ajanlı denetim (v0.57, 15 Kas 2026) — raporlar /tmp/audit2/
- Güvenlik: spacegg_user ile şifresiz giriş; ödeme doğrulanmıyor; zayıf hash; localStorage hilesi (xp); #test kancası açık; XSS yok; harici istek yok.
- Kod: ölü #space döngüsü rAF; giriş ekranı ağır (17 fps kısılı mobil); WebGL mobilde yavaş; çift lvFill; MUS.timer temizlenmiyor; acctSave gizliyken yazıyor; sızıntı yok.
- Tasarım: sabit ses/müzik düğmeleri ve dock içeriği örtüyor (kritik); dock yıl kırpma; giriş dokunma hedefleri <44px; çekmece sekme; 9-11px yazılar.
- Arka plan: ivDecide zamana ekliyor; Fambo rozet ezme/enerji çoğaltma; lifeGate uzakta çalışmıyor; yenileme kararı siliyor; acctSave null ezme; olay listesi sınırsız; saat geri alma.
- Hiçbir düzeltme uygulanmadı; Doktor'un seçimi bekleniyor. Ses efektlerine dokunulmadı.

## 4AZ — Gelişme notları yol haritası (Doktor, 15 Kas 2026) — sırayla uygulanacak
1. Belirli seviyeden sonra zaman yavaşlar; her seviyede tüm süreçler biraz daha yavaşlar. Başlangıç hedefi: 50 seviye.
2. Haritadaki ikon etkileri her seviyeye uygun değişir (ör. Sev.1 kimya = atmosfer gelişimi; Sev.7 kimya = o seviyeye uygun kimyasal gelişme/reaksiyon sonuçları). Tüm kategoriler için geçerli.
3. İlerleyen seviyelerde gezegen uydularıyla patlama/iletişim/element alışverişi.
4. Eylem haritası ikonla dolmasın: her seviyede ikonlar temizlenir; haritada dağlar, okyanuslar, kıta bölünmeleri, adalar, denizler detaylı görünür.
5. Eylem süreleri/araları her seviyede biraz uzar (4 sn çok az).
6. Her seviye/çağda gezegen mağazasına çok farklı ürünler; süre, alım limiti, gezegene etkisi farklı. Doktor listeyi/ayrıntıyı gönderecek.
7. Gerekli seviyelerde yeni ikonlar ve yeni eylem sesleri (mevcut ses efektlerine DOKUNULMAZ).
8. Hesaba (örn. Fambo) bağlanınca kaldığı yerden doğrudan gezegen penceresi açılır; kullanıcı yokken gerçek zamanlı işler arka planda işler, seviye ilerlemeleri buna uygun uygulanır.
- Denetim bulguları (4AY) için düzeltmeler ayrı bekliyor.

## 4BA — v0.58 Aşama 1 (15 Kas 2026) — spacegg-v58.html
- 50 seviye (LVL/LVT/LVN/LVEND, lvF(i)=1+0.07*i). Seviye 8'den sonra her seviye %7 daha uzun, yıl akışı (YRATE) her seviyede x0.9 yavaşlar. Seviye 50'ye ≈23,5 saat; sev. 50 süresi ≈102 dk.
- Olay araları ve mevsim aralığı lvF ile uzar (seviye 1'den itibaren); mağaza gönderi süresi seviyeyle uzar (kuyrukta tot).
- Harita: her seviye başında ikonlar temizlenir; önceki seviyelerin adlı detayları (dağ/okyanus vb.) küçük nokta+isim olarak kalır.
- Bekleyen: seviyeye özel olay metinleri (kategori×seviye), uydu etkileşimi, kıta/ada/deniz detayı, mağaza ürünleri (Doktor listeyi gönderecek), yeni ikon+ses (mevcut efektlere dokunulmaz).

## 4BB — Yol haritası ek madde (Doktor, 15 Kas 2026, 20:50)
9. Seviye 20'den sonra okyanus/dağ/orman/çöl gibi bölgelerde gezegene uygun mikrobiyal, bakteriyel, tek hücreli gelişimler ve deneysel/hayal ürünü yaşam biçimleri (çift başlı kırmızı balık, dört kuyruklu orman yılanı, altı kollu çöl akrebi, yeni başlı bacaklılar...) + gerçek taksonlar (eklem bacaklılar, deniz yıldızları, amfibiler, balıklar, böcekler, karıncalar, memeliler, süngerler, yosunlar) araştırılarak detaylı süreçlere eklenecek.
- Mağaza (v0.59): Doktor listeyi benim tasarlamamı istedi (bilimsel, ikonlu, bedelli, limitli, yaratıcı).

## 4BC — v0.59 Mağaza kataloğu (15 Kas 2026) — spacegg-v59.html
- 63 ürün: 8 eski (Sev.3) + 55 yeni, seviye 3–50 arası bilimsel çağ sırasıyla (kimya→biyosfer→kıta→zekâ→medeniyet→uydu→gezegenler arası→yıldız→galaktik→kozmik). ~55 yeni ikon (NICO), ürün başına benzersiz ses frekansı (sh_<id>y/z, mevcut efektler değişmedi).
- Her ürün: seviye (lv), seviye başına alım hakkı (lim, simState.sl), süre (sec×lvF), iyi/kötü etki (atm/mag/rad/liv), bilimsel açıklama.
- Liste yalnız açık seviyeleri gösterir, en yeni üstte "YENİ" rozetli; sonraki 2 ürün kilitli önizleme.

## 4BD — v0.60 (15 Kas 2026) — spacegg-v60.html
- Alt zaman paneli (dock.mini) yeniden düzenlendi: SEV chip + yıl aynı satır, 3 hap düğme (HIZ/ÖZELLİK/DETAY) ayrı satır; üst üste binme giderildi (390 ve 320 px).
- Gezegene dokunma sesi değiştirildi (Doktor isteği): SND.S.gtouch = yumuşak pentatonik cam çınlaması; SND.tap (arayüz dokunuşu) değişmedi.

## 4BE — Uydu sistemi kararı (Doktor, 15 Kas 2026)
- Karar: seçenek C — uydular oyuncuya ait ama yarı bağımsız ortak sistem (kendi sıcaklık/buz/maden kaynağı, patlama/iletişim/element alışverişi; ihmal edilirse gezegene zarar).
- İleride belli seviyede mağazada uydulara gönderim: element/kimya vb. transferleri; süreç birlikte geliştirilecek.
- Uydular gezegen etrafında kendi yörünge periyotlarıyla (kendi zamanlarına ait döngüler) animasyonla dönerken GÖRSEL olarak görünmeli (3B/2B/8 bit).

## 4BF — v0.61 Uydu görseli (15 Kas 2026) — spacegg-v61.html
- Uydular artık seviye 2'den itibaren sırayla belirir (önce seviye 5'ten); her uydunun kendi Kepler tipi yörünge periyodu (9·(1+0.7i)^1.5 sn + rastgele), yörünge halkası (arka/ön yay), yumuşak yuvarlak uydu çizimi (3B ve 2B), 8 bit'te piksel.
- Uydu sayısı gezegen türüne bağlı: kayalık 0–3, gaz devi 3–13 (en fazla 5 çizilir). Seçenek C'nin oyun mantığı (kaynak, patlama, element alışverişi, mağaza gönderimi) henüz yapılmadı.

## 4BG — v0.62 Fambo veri güvencesi (15 Kas 2026) — spacegg-v62.html
- Kayıt sürümlü (v:2) ve geriye uyumlu; acctLoad eksik alanları tamamlar (taps, xp, q, sl).
- Kullanıcı yokken zaman gerçek hızda (x1) işler; x20/x60 hız tercihi çıkışta/girişte x1'e döner (kayıt anındaki hızla hesaplanan sim zamanı + gerçek geçen süre).
- acctSave, oturumda sim yokken (ikinci sekme) hesap kaydını null ile ezmez.
- Kalıcı hesapta "YENİ SİMÜLASYON" gizli (yanlışlıkla gezegen silinmesin); menüde "PROFİL YEDEĞİ İNDİR" ve "YEDEKTEN YÜKLE"; kayıt bulunamazsa mağaza çubuğunda "YEDEKTEN YÜKLE". Güncellemeler aynı depolama anahtarlarını (spacegg_acct_fambo vb.) kullanır; tarayıcı depolaması silinirse yedek dosyası kurtarır.
- Giriş: kayıtlı gezegen varsa doğrudan simülasyon (yumurta seçimi yok).

## 4BH v0.63–v0.69 (özet)
- v0.63–65: seviye 20+ yaşam çeşitliliği (sabit XL listesi + kimya bağlantılı prosedürel tür üretici xlGen, ~21 yaratık ikonu, grup sesleri, deneysel türler pembe).
- v0.66: harita coğrafyası (geoBuild/geoDraw): kıta, deniz/okyanus/göl, ada, dağ/zirve isimleri seviyeye göre açılır; seviye 14'te yarık çizgisi, 19'da rift + iki kıta adı; eski seviye ikon/isim noktaları kaldırıldı (her seviyede temiz harita).
- v0.67: seviyeye özel olay cümleleri (LVSEN, 10 kategori × 12 kademe) build() sonunda eklenir.
- v0.68: iklim senaryoları (kutup buzulu erimesi, deniz yükselmesi/kuruması, tuz çölü, çöl→orman, orman→çöl, yeni buz çağı) XL şablonları olarak; add() içinde %14 olasılıkla seçilir (cl bayrağı).
- v0.69: uydu oyunu (seçenek C): simState.mn[k]={h,ice,min}, simState.mnT; moonStep seviye 29+ (patlama, ihmal, iletişim, element alışverişi; cat 'uyd', ikon 'ayy'); mağazada 6 uydu gönderisi (uyk,uym,uyr,uyh,uyi,uyt; sev 30–44) en zayıf uyduya gider; sol panelde UYDU SAĞLIĞI satırı.
- Testler: hata yok, 390/320 taşma 0, Fambo akışı ve ses testi geçti.

## 4BI v0.70 (gezegen görüntüsü ve dokunma efekti)
- İki tasarım ajanı: A = WebGL gezegen (yeni FS shader, RGBA doku, VK 4, GN 448, kraterli kabartma, atmosfer kenar parıltısı, bulut gölgeleri, okyanus kıyı/speküler, kutup buzu yumuşatıldı (üst düz çizgi kusuru giderildi), lav/buz çatlakları, gaz bantları ve fırtına, halka gölgesi, gece ışıkları, deniz seviyesi SEAL=0.57). B = dokunma efekti (3 yüzey halkası, parlama, limb ışıltısı, parçacık, sarsıntı; tür rengi; 3B/2B/8 bit) + GERÇEK 2B ve 8 BİT çizimi yenilendi.
- Ses efektlerine dokunulmadı. Yama: /tmp/spxwork/agentA_patch.py + agentB_merge.py -> spacegg-v70.html. Testler: hata yok, taşma 0, Fambo ve ses testi geçti.
- Not: bakeTex mobilde yavaşsa GN 384'e düşürülebilir.

## 4BJ v0.71 (yeni arka plan müzikleri)
- Audiorective eklentisi eklendi (npm paketi bu ortamda kurulamıyor; tek HTML dosyasına girmiyor), bu yüzden müzikler mevcut sentez motoruyla üretildi.
- 4 yeni müzik tabanı (uydu, medeniyet, galaksi, kozmik) ve 10 yeni parça: UYDU YÖRÜNGESİ, HALKA SESLERİ, İSTASYON GECESİ, ORTAK ŞEHİR, YILDIZ KERVANI, UFUKTAKİ IŞIK, GALAKTİK BULUT, SARMAL KOLLAR, SONSUZLUK, KOZMİK DOĞUM. Toplam 48 parça karışık çalar. Eski müzikler korundu, ses efektlerine dokunulmadı.

## 4BK — Güncel açık işler ve taşıma (16 Kas 2026)
- Proje paketi: SpacEgg-proje-paketi.zip (v0.71, SPACEGG.md, SpacEgg-proje-ozeti.md, talimatlar). Proje oturumuna taşındı/taşınacak; Projeler'e yükleme Doktor tarafından yapılır.
- Açık işler için SpacEgg-proje-ozeti.md bölüm 5'e bak.


## 4BL v0.72 (ses revizyonu, 16 Kas 2026)
- Doktor isteği: tüm projenin sesleri revize edilsin. "Ses efektlerine dokunulmaz" kuralına bu istekle tek seferlik istisna yapıldı; kural diğer durumlarda geçerli.
- Gömülü 21 dosyanın tamamı sıfırdan yeniden sentezlendi (Python/numpy, telifsiz): 6 arayüz sesi, 11 olay sesi, 4 müzik. Anahtar adları, süreler ve ses seviyeleri (LUFS) eskisiyle uyumlu tutuldu.
- Efektler: FM çan, pluck, yankı (reverb), stereo; sonda tıklama önlendi. Müzikler: kusursuz döngü (dairesel yankı/gecikme), 48 kbps Opus.
- Kodla üretilen sentez sesleri (SND.S, 28 kimlik) ve 48 parçalık müzik motoru değiştirilmedi.
- Test: sayfa hatası yok, 390 ve 320 px taşma 0, 21 dosyanın tamamı çözüldü. Fambo akışı bu turda otomatik denenmedi. Sesler dinlenemedi, telefonda denenmedi.
- Dosya boyutu ~3,17 MB. Teslim: spacegg-v72.html.

## 4BM v0.73 (yumuşak müzik geçişleri, 16 Kas 2026)
- Doktor isteği: arka plan müzikleri birdenbire bitmesin, birbirine yumuşak geçsin, kullanıcının dikkatini bozmasın.
- Müzik motoru (MUS) değişti: parçalar arası eşit güçlü çapraz geçiş (6 sn, kosinüs/sinüs eğrisi). Eski parça bitmeden yenisi girer; geçiş boyunca iki parçanın toplam gücü sabit kalır.
- Dosya parçaları: bitiş zamanı kaydedilir, parça bitmeden 6 sn önce sonraki parçaya geçilir (eskiden son anda ani kesiliyordu).
- Sentez parçaları: son 6 sn kala geçiş başlar; eski parça geçiş boyunca çalmaya devam eder, notaları aniden kesilmez.
- İlk parça 3 sn'de yumuşakça açılır. Müzik/ses kapatılınca 2 sn'lik sönümle kapanır (eskiden kaynak anında durduruluyordu).
- Test: kazanç eğrisi ölçüldü (eski 0,50→0, yeni 0→0,50, toplam güç 0,250 sabit), dosya ve sentez parçası otomatik geçişi, kapatma sönümü, sayfa hatası yok, 390 ve 320 px taşma 0, 21 ses çözüldü. Kulakla dinlenmedi, telefonda denenmedi.
- Ses dosyalarına (efektler) bu turda dokunulmadı. Dosya: spacegg-v73.html (~3,18 MB).

## 4BN v0.74 (genel tasarım dokunuşu, Frontend Design yeteneği, 16 Kas 2026)
- Doktor isteği: Frontend Design yeteneğiyle genel tasarıma dokunuş, özellikle gezegen görüntüleri. Frontend Design bu oturumda hazır yüklü bir yetenek (kurulum gerekmedi).
- Tasarım kararı: tek vurgu gezegen sahnesi; geri kalan arayüz, renkler, Poppins/Inter, giriş sayfası (v0.40) ve tüm sesler aynı.
- Gezegen sahnesi: tuval .pwrap sarmalayıcısına alındı; arkasına tür renginde (türün rim rengi) atmosfer halesi (.paura) eklendi. Hale boyutu gezegen yarıçapına (simPR) bağlı, yumurta evresinde kapalı, yavaş nefes alır (hareket azaltma tercihinde durağan).
- Türe özel renk derecelendirmesi (CSS filter, #stage): kayalık, karbon, serbest, pulsar, kthonyen, lav, okyanus, derin okyanus ayrı ayarlı; birbirine benzeyen gri kayalık türler artık ayrışıyor. WebGL gölgelendirici değişmedi.
- Kimlik rozeti (.psub): düz sarı yazı yerine, tür renginde nokta ve ince çerçeveli hap; metin aynı (ör. OKYANUS GEZEGENİ · NADİR).
- Test: 13 gezegen türü ekran görüntüsüyle karşılaştırıldı, sayfa hatası yok, 390 ve 320 px taşma 0, 21 ses çözüldü. Fambo akışı bu turda denenmedi, telefonda denenmedi.
- Bekleyen: tüm gezegenler için yepyeni 3B tasarım (kapsam Doktor'un cevabını bekliyor: 13 türün tamamı mı, belirli türler mi).

## 4BO v0.75 (gerçekçi yüzeyler, deprem, uydular, küçük animasyonlar, 16 Kas 2026)
İstek: ilerideki seviyeler için daha gerçekçi gezegenler (deprem, çöl, okyanus, orman, uydular) ve tüm yumurtalar, gezegen türleri ve mağaza için küçük animasyonlar. Yama: /home/claude/patches/p75.py (v74 → v75). Yalnızca 3B (WebGL) görünüm değişti; GERÇEK 2B ve 8 BİT aynı.
- Karasal (okyanus): enlem kuşaklarına göre iklim modeli (ekvatorda nem, 0,42 enleminde kuru kuşak), çöl kum dalgaları, bozkır, ılıman orman ve yoğun orman, tundra, dağ, kar, kumsal. Bitki örtüsü `uVeg` seviyeyle büyür: LVT[8]'den LVT[14]'e (Seviye 9–15), yalnızca w.life olan okyanus gezegeninde; yaşamsız okyanus gezegeninde kıtalar çıplak kayadır.
- Çöl gezegeni (`uDes`): kum dalgaları, koyu kaya çıkıntıları, kutup buzu. Kayalık, karbon, kthonyen, buz: tektonik fay çizgileri (`uTc`), kayalık ve çölde kutup buz başlığı (`uCap`), buzda lekeli çizgiler ve parıltı.
- Deprem (`uQk`, `uQt`, `uQp`): olay fx==='quake' ise o enlem/boylamda genişleyen şok halkası, toz, çatlaklar, normal kıvrımı. simDraw son 4 olaydan en güçlüsünü QK nesnesine yazar (7 sn, üstel sönüm). Mevcut ekran sarsıntısı korundu.
- Küçük animasyonlar gölgelendiricide `uTm` ile (reduce-motion açıkken donar): okyanus köpüğü ve parıltısı, derin okyanus plankton çiçeklenmesi, gaz devi bant salınımı, lav nabzı, gece şehir ışığı titremesi, buz parıltısı, pulsar ve yaşamlı okyanus kutup ışığı (aurora).
- Uydular: ikinci gölgelendirici (FSM, glMoon). Dört tür: kraterli gri, buzlu çatlaklı, volkanik (turuncu bacalar), kızıl tozlu. Tür paletin dizinine bağlı: MPAL 0→gri, 1→kızıl toz, 2→buzlu, 3→volkanik. buildMoons sonunda `pi` alanı eklendi (tohum sırası değişmedi). Yalnızca 3B görünümde; diğer görünümlerde eski moonSm.
- Yumurtalar: kart başına CSS animasyonu (nebula toz, nova halka, pulsar dönen ışın, kuasar jet, kara delik yığılma diski, kozmik yıldız parıltısı); sahnedeki yumurtada aynı temalar eggAmb ile canvas'ta. Yumurta önizlemeleri hafif süzülür. 8 BİT yumurta çizimi değişmedi.
- Mağaza: satırlar sırayla belirir, simgeler hafif sallanır, YENİ rozeti nabız atar, satın almada satır yeşil parlar (sent). Hepsi prefers-reduced-motion: no-preference içinde.
- Test: 13 tür (Seviye 23) ekran görüntüsü, 390/320 px taşma 0, sayfa hatası 0, ses çözme tamam. Deprem görünümü test kopyasında QK sabitlenerek denendi (çölde ve okyanusta net, kayalıkta daha hafif). Doğrulanmayanlar: telefonda performans (3B gölgelendirici maliyeti arttı: terrestrial modda ek fb çağrıları), gerçek zamanlı deprem akışı, kulakla dinleme.
- Açık: İş Planı ve Ar-Ge belgesi güncellenmedi; kıtaların zamanla kayması (Kıta Çağı) ve şehir ışıklarının kıta kıyısına bağlanması yapılmadı.
