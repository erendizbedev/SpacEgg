# SpacEgg — Kritik Notlar (yol haritası beyin fırtınası)

Tarih: 16.11.2026 · Durum: tartışmaya açık, kararlar bekleniyor
Denetim: Bu dosya bir denetçi ajanın gözetiminde tutulur. Her geri dönüşte önce "Karar bekleyen sorular" bölümü gözden geçirilir; alınan karar ilgili satıra işlenir, eski hâli silinmez.

## 1. Doktor'un ana hedefi (kullanıcının sözleri)

- Sınırlılık ve eşsizlik hissi projeyi özel kılar. Örnek: dünyada doğum ve ölümü canlı gösteren sayaç siteleri.
- Kural: gezegen sayısı her zaman dünya nüfusunun %1'i kadar olacak.
- Belli seviyeye gelen gezegen profil linki alır (örnek: spacegg.com/fambo).
- Her gezegenin IP adresi gibi bir koordinatı olur; transfer, klan, topluluk, savaş olur.
- Belli seviyeden sonra gezegen sahibi para yükleyebilir (cüzdan, birkaç borsayla anlaşma); koruma, güç dengesi, yaşam seviyesi, medeniyet, galaksiler arası düzey eklenir.
- Daha sonra (ileri aşama): market ve global firmaların seviyeye uygun gezegenlere reklam vermesi.
- Çağlar ve yıllar olacak; tarım, nükleer gelişmeler, savaş, uydular, asteroit madenciliği düşünülüyor.

## 2. Doğrulanmış sayısal bilgi (arama sonucu)

- BM tahmini, 2026 nüfusu: 8.300.678.395 (1 Temmuz 2026). %1'i yaklaşık 83 milyon gezegen.
- Yıllık artış yaklaşık 69 milyon kişi: yaklaşık 690 bin gezegen/yıl.
- Kaynaklar farklı: PRB 2026 veri sayfası 8,24 milyar. Esas kaynak seçilmeli.
- BM projeksiyonu: nüfus 2084'e doğru azalmaya başlıyor; kural aynı kalırsa gezegen sayısı da düşmek zorunda.
- Kaynaklar: Worldometer, Statistics Times, PRB.

## 3. Hukuki bulgular (hukuki görüş değildir)

- "Soğuk cüzdan" çevrimdışı ve sahibinin anahtarını tuttuğu cüzdandır. Para SpacEgg'de durursa bu saklama hizmeti olur.
- Türkiye: kripto platformları ve saklama hizmeti için SPK izni gerekir (7518 sayılı Kanun); izinsiz faaliyet suçtur. Yurt dışından Türkiye'deki kişilere hizmet de izinsiz faaliyet sayılır (3–5 yıl ceza).
- AB: MiCA, oyuncuların bulunduğu yere bakar; oyuncu adına cüzdan tutan oyun için lisans gerektiği söyleniyor. Başkaları için anahtar tutmak düzenlemeyi tetikler, kendi anahtarını tutmak tetiklemez.
- Doğrulanmadı, uzmana sorulmalı: savaşta gerçek para kaybının kumara benzetilmesi, reklam gelirinin vergisi, kimlik doğrulama ve kara para kuralları.

## 4. Ajan görüşleri (4 ajan, özet)

Ortak noktalar:
- Sıra: paradan bağımsız çekirdek → kimlik → topluluk → market → savaş → en sonda para ve reklam.
- Sunucu şart; tarayıcıda tutulan her değer değiştirilebilir.
- Savaş isteğe bağlı; barışçıl yol 50. seviyeye açık olmalı.
- Para katmanı en sonda, uzman görüşüyle.

Yazılım mimarisi:
- Merkezî sunucu ve ilişkisel veritabanı; tablolar: hesap, gezegen, koordinat, sahiplik, işlem günlüğü.
- %1: hedef = nüfus × 0,01, tek kapasite değeri, ayda bir güncellenir; doğum veritabanı işlemi ve kilitle yapılır.
- Koordinat: doğum sırası numarasından sabit biçim (galaksi-sektör-sıra), tekil kısıtla benzersiz.
- Profil adı: küçük harf, tekil kısıt, ayrılmış ad listesi, benzer ad denetimi, ad değişikliği sınırlı.
- Canlı sayaç olay günlüğünden türetilir.
- Aşamalar: (1) salt okunur sayaç sunucusu ve %1 çekirdeği, (2) hesap ve bulut kaydı, profil linki, (3) sahiplik, koordinat, transfer, (4) klan, (5) market, (6) savaş, (7) para ve cüzdan.

Güvenlik ve ödeme:
- Sunucuda hesap doğrulama ve iki adımlı giriş şart; hesap tarayıcıda tutulmamalı.
- Depo herkese açık; koddaki demo parola ve hesap özeti (hash) sızıntı yüzeyi.
- Çoklu hesap ve hile: hesap başına yumurta limiti, cihaz ve ödeme eşleştirmesi, şüpheli aktarım izleme.
- Ödeme: saklamalı yol en ağırı; saklamasız (oyuncu kendi cüzdanından veya lisanslı sağlayıcıyla) daha hafif.
- Sıra: paradan bağımsız sürüm → sunucuda doğrulama → saklamasız satın alma → cüzdan, transfer, savaş ödülü.

Oyun mekaniği:
- Savaş merkez değil, üst katman; seviye 36 sonrası isteğe bağlı "çağ çatışması". Asıl düşman kozmos.
- Çağlar: 1–8 jeolojik, 9–20 yaşam, 21–28 tarım, 29–35 sanayi, 36–43 nükleer, 44–50 uzay; hikâye karar bölümleriyle (9, 20, 31) eşlenebilir.
- Puan: bakım, olay atlatma, hikâye, günlük hedef, rozet (var) + medeniyet puanı ve keşif puanı (yeni).
- Market çağa bağlı ürün aileleri; seviye başına alım limiti korunur.
- Asteroit olayı karar kartı: kalkanla savun ya da madenle kaynağa çevir; uydular madenciliğe evrilir.
- Güç dengesi: savaş gücü çağ puanına bağlı, seviye bandına göre eşleşme.
- %1 çelişkisi: gezegen ölmez, "uykuya geçer"; sayaç yalnızca etkin gezegenleri sayar; yeni doğumlar kuyruktan açılır.

Ürün ve iş stratejisi (web araması yapılmadı, bilinen örneklerden):
- Aşamalar: paradan bağımsız çekirdek → kimlik → topluluk → market (yalnızca oyun içi puan) → reklam ve gerçek para.
- İlk kullanıcılar: canlı sayaç paylaşılabilir sayfa; bekleme listesi ve bir kez verilen "kurucu" rozeti; Türkçe oyun, bilim ve uzay toplulukları.
- Riskler: sayaç doğrulanabilir değilse güven kaybolur ("örnek veri" şeridi kaldırılmalı); %1 büyümeyi tavana bağlar; para katmanı izne takılabilir; reklam eşsizlik hissini zedeleyebilir; çoklu hesap.

## 5. Karar bekleyen sorular

| # | Soru | Durum |
|---|---|---|
| 1 | Gezegen savaşta kalıcı mı ölsün, uykuya mı geçsin; uyandırmanın bedeli? | Bekliyor |
| 2 | Nüfus düşerse fazla gezegenler silinecek mi, yoksa yalnızca yeni doğum mu duracak? | Bekliyor |
| 3 | Sahiplik oyun içi hak mı, devredilebilir varlık mı? | Bekliyor |
| 4 | Hedef kitle Türkiye mi, baştan küresel mi? | Bekliyor |
| 5 | Simülasyon sunucuda mı, tarayıcıda mı (sunucu yalnızca doğrular)? | Bekliyor |
| 6 | Kurucu rozeti ilk kaç kişiyle sınırlı? | Bekliyor |
| 7 | Savaşta kaybeden gerçek para mı kaybeder, yalnızca oyun içi güç mü? | Bekliyor |
| 8 | Reklam nerede görünür, geliri kim alır, "market" gezegen alım satımı mı? | İleri aşama |
| 9 | Çağlar seviyeye mi, oyuncu seçimlerine mi bağlı? | Bekliyor |
| 10 | Esas nüfus kaynağı: BM mi, başka mı? | Bekliyor |

## 6. Denetçi ajan için kontrol listesi

- Her geri dönüşte tabloyu güncelle; karar çelişirse işaretle.
- %1 kuralı, uyku/ölüm ve nüfus düşüşü kararları tutarlı mı kontrol et.
- Para, cüzdan ve reklam maddelerini hukuki doğrulama yapılmadan "karar verildi" yapma.
- Şifre, parola ve hesap özetlerini bu dosyaya yazma.

## 7. Ek sorular (beyin fırtınasında sorulan, cevaplanmamış; Doktor hatırlatınca tekrar sorulacak)

A. Genel kapsam
- SpacEgg'i kim oynayacak: tek bir kitle mi, herkes mi?
- Bir oyuncu günde kaç dakika geçirsin?
- Gezegen yok olabilir mi; olursa oyuncu ne kaybeder?
- Gerçek ödeme ve sunucu ne zaman gündeme gelsin, hiç gelmesin mi?
- Yankının Peşinde hikâyesi ana amaç mı, yan katman mı?

B. Sınırlılık ve %1 kuralı
- Neyin sayısı sınırlı: toplam yumurta, gezegen, yoksa her yumurta türünün ayrı üst sınırı mı?
- Eşsizlik neyle sağlanacak: her gezegenin dünyada tek olması mı, sahipliğin kayıt altında olması mı?
- Sayaçlarda ne gösterilecek: doğan, yok olan, yaşayan, kalan yumurta?
- Sayaçlar gerçek ve herkese ortak mı olacak (sunucu gerekir)?
- Yok olan gezegen sayaçta ölen mi görünsün, ölüm kalıcı mı?
- 83 milyon gezegenin hepsi baştan var mı, sahipsizler herkese açık mı, yoksa sayı oyuncu sayısına mı bağlı?
- Nüfus arttıkça yeni gezegenler nasıl doğacak: sıradaki oyuncuya yumurta, açık artırma, kuyruk?
- Sayaç kaynağı: BM tahmini mi, canlı sayaç siteleri mi?
- Kural doğrulanabilir olmalı mı (herkes "şu an tam %1" olduğunu görebilsin mi)?

C. Profil, para ve cüzdan
- Para yükleme ilk sürümde mi, önce paradan bağımsız sürümde mi?
- Yüklenen para oyuncunun mu kalsın (çekebilsin), yoksa harcanıp çekilmesin mi?
- Savaşta kaybeden gerçek para mı kaybeder, yalnızca oyun içi güç mü?
- Koordinat nasıl verilsin: rastgele mi, sıra numarasıyla mı?
- Profil linki hangi seviyede açılsın; ad serbest mi, benzersiz ve bir kez alınan bir ad mı?
- Para katmanını oyuncunun kendi cüzdanından ödeme yaptığı, SpacEgg'in parayı tutmadığı bir yapıyla da konuşmak ister misiniz?

D. Reklam ve market (ileri aşama)
- Reklam nerede görünecek: profil sayfasında, gezegen yüzeyinde, simülasyon içinde mi?
- Reklam geliri kime gidecek: gezegen sahibine, SpacEgg'e, paylaşım mı?
- "Market" gezegen alım satımı mı, mağazanın genişlemesi mi?
- Reklam verenin gezegeni seçebileceği seviye eşiği nedir?

E. Savaş, çağlar, puan
- Gezegen savaşta kalıcı ölür mü, yalnızca zarar mı görür?
- Çağlar seviyeye mi, oyuncu seçimlerine mi bağlı?
- Savaş zorunlu mu, barışçıl oyuncu savaşmadan en üst seviyeye çıkabilir mi?
- Uykuya geçen gezegen geri uyandırılabilsin mi, bedeli ne olsun? Savaş ganimeti kaynak mı, yalnızca itibar mı?
- Hedef kitle Türkiye mi, küresel mi? Simülasyon sunucuda mı, tarayıcıda mı çalışsın?
