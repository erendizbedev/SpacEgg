# SpacEgg İleri Sürüm Senaryosu (yedek, henüz uygulanmaz)

Hazırlayan: oyun mimarı ve kodlama danışmanı. Durum: yalnızca belge. Hiçbir kaynak dosyaya dokunulmadı.
Bağlı olduğu sürüm: v1.0.3 (mimari sözleşme `ARCH.md`, oyun mantığı `41-game.js`, veri `CINS.json` ve `story-main.json`).
Makine okunur ek: `senaryo-veri-taslak.json` (ırklar, saldırı türleri, evre eşikleri, çağlar, ilişki eşikleri, buluşma olayı kimlikleri).

Okuma notu: Bu belge sesli okunduğunda doğal gelsin diye düz Türkçe yazıldı. Kod adları (dosya, işlev, anahtar) ters tırnak içinde yazılır; sesli okuyucu bunları atlayabilir. Anlam her zaman çevreleyen cümleden anlaşılır.

---

## 1. Vizyon ve oyun akışı

### 1.1 Tek cümlelik fikir
Gezegenin büyüdükçe yalnız kalmaz. Önce uzaktan bir yankı duyar, sonra komşular belirir, sonra komşular dost ya da düşman olur, sonunda galaksinin ötesinden gelen yabancılar kapıyı çalar. Her şey, mevcut 15 bölümlük "Yankının Peşinde" hikâyesinin üstüne oturur ve onu bozmaz.

### 1.2 Altın kurallar
1. Oyuncu cezalandırılmaz, sınanır. Saldırıda kaybedilen şey her zaman sınırlıdır, geri kazanılır ve her sonuç oyuncuya bir şey öğretir ya da kazandırır.
2. Seviye hiç düşmez. Gezegen hiçbir koşulda yok edilmez. Yapılar hiçbir koşulda silinmez.
3. Beş tür (Savaşçı, Medeniyet, Lojistik, Yıkıcı, Yaratıcı) aynı olaya farklı cevap verir. Hiçbir tür haksız kayırılmaz.
4. Her yeni özellik kapatılabilir ve geriye uyumludur: eski kayıt açılır, yeni alanlar kendiliğinden doldurulur.
5. Gerçek para ve blok zinciri bu senaryonun içine hiç girmez. Onlar ayrı yol haritasının konusudur (bkz. 8. bölüm).
6. Her şey tohumdan üretilir (rastgelelik de tohumludur). Aynı gezegen, aynı seviyede, aynı saldırıyı görür. Bu, test etmeyi ve hata ayıklamayı kolaylaştırır.

### 1.3 Beş evre
Süreler normal hızda (çarpan 1) ölçülmüştür. Mevcut süre ölçeğine göre 50. seviyeye yaklaşık 23,5 saatte varılır. Seviyeye varış süreleri `CUM` dizisinden hesaplanmıştır.

| Evre | Ad | Seviye | Normal hızda yaklaşık süre | Hikâye bölümleri | Çağ (mevcut `era`) |
|---|---|---|---|---|---|
| I | Kıvılcım | 1 – 9 | 0 – 0,5 saat | c01 – c05 | 0, 1 |
| II | Komşular | 10 – 19 | 0,5 – 1,6 saat | c06 – c08 | 1, 2, 3 |
| III | Uyanış | 20 – 29 | 1,8 – 4,1 saat | c09 – c11 | 3, 4 |
| IV | Eşik | 30 – 39 | 4,5 – 9,6 saat | c12 – c13 | 4, 5, 6 |
| V | Akor | 40 – 50 | 10,4 – 23,5 saat | c14 – c15 | 6, 7, 8 |

Her evrede açılanlar:

**Evre I, Kıvılcım (1–9).** Hiçbir saldırı yok. Oyuncu temel döngüyü öğrenir. 7. seviyede ilk "yabancı sinyal" olayı gelir (hikâyedeki "Komşunun Sesi" ile aynı seviye). Bu yalnızca bir sezdirme: ekranda uzak bir ışık ve kısa bir üç nota.

**Evre II, Komşular (10–19).** Aynı galaksideki ilk ırklarla tanışma (bkz. 5. bölüm). İlk üç küçük akın gelir (yoklama akını). İlişki puanı ve elçi eylemi açılır. 15. seviyede ilk ticaret yolu kurulabilir.

**Evre III, Uyanış (20–29).** Medeniyet çağları belirgin hale gelir (bkz. 3. bölüm). Örgütlü akınlar (hırsız sürüsü, yörünge kuşatması) görülür. Tür tepkileri tam açılır. 20. seviyedeki "Kapının Anahtarı" kararı senaryoya dal ekler. İlk ittifak teklifi 25. seviyede gelir.

**Evre IV, Eşik (30–39).** 30. seviyede ilk büyük dalga. 31. seviyede "Yankının Sahibi" kararıyla birlikte galaksi kapısı sezilir, 36. seviyede ("Kadim Eşik") kapı açılır ve öte galaksilerle ilk temas başlar. Galaksiler arası ticaret yolları ve gölge dalgası saldırıları gelir.

**Evre V, Akor (40–50).** İttifaklar tam güce ulaşır, ikinci ve üçüncü büyük dalga (40. ve 48. seviye) gelir. 45. seviyeden sonra "Yüce Sınav": saldırı değil, türün felsefesine yönelik bir sınav (bkz. 2.5). 50. seviyede "Yankının Peşinde" finali, o ana kadarki kararlara ve ilişkilere göre üç sondan birine bağlanır.

### 1.4 Ana döngü (oyuncu gözüyle)
Gezegen büyür, olaylar gelir, kaynak toplanır, mağazadan savunma ve diplomasi alınır. Şimdi buna şu halka eklenir: uyarı gelir, oyuncu kısa bir karar verir, sonuç gelir, hatıra ve ilişki puanı birikir. Bu halka, uzun oyun sürelerinde bile sıkmasın diye ağırlıklı olarak 20–90 saniyelik karar pencereleriyle çalışır.

---

## 2. Uzaylı saldırıları

### 2.1 Mevcut sistemle ilişkisi
Bugün saldırı yalnızca oyuncunun başlattığı bir eylem (`G.attack`). Yapay komşular kendiliğinden saldırmaz. Yeni sistem, oyuncunun yaptığı saldırıyı değiştirmez. Yalnızca gelen saldırıyı (akın) ekler. Akınlar, mevcut olay sistemindeki "karar bekleyen olay" (`p.pending`) yapısını kullanır. Böylece arayüz, süre dolunca kendiliğinden karar verme ve kayıt satırı gibi parçalar hazır çalışır.

### 2.2 Saldırı türleri
Altı tür vardır. Ayrıntılı sayılar `senaryo-veri-taslak.json` içindedir.

| Kod | Ad | Açıldığı seviye | Ne yapar | Katsayı (saldırı/savunma) |
|---|---|---|---|---|
| `yoklama` | Yoklama Akını | 10 | Savunmayı ölçer. Kayıp yok, istihbarat kazandırır. | 0,6 |
| `hirsiz` | Hırsız Sürüsü | 18 | Tek bir kaynaktan sınırlı miktar almaya çalışır. | 0,9 |
| `kusatma` | Yörünge Kuşatması | 24 | Uyduları ve madeni bir süre engeller. | 1,0 |
| `golge` | Gölge Dalgası | 32 | Haberleşmeyi bozar: ticaret ve diplomasi kısa süre kapanır. | 1,0 |
| `buyuk` | Büyük Dalga | 30, 40, 48 | Üç aşamalı, ittifaklarla savunulan büyük saldırı. | 1,15 |
| `sinav` | Yüce Sınav | 45 | Saldırı değil, türe özel bir sınav. Kayıp yok. | yok |

### 2.3 Uyarı ve öncelik
Her akın bir uyarı ile başlar. Uyarı süresi 90 saniyedir (gerçek zaman). Süre dolunca mevcut `autoDecide` kuralı çalışır: bedelsiz seçenek uygulanır.

Öncelik dört kademelidir ve arayüzde renk ve ses ile ayrılır:
1. Gözlem (gri-mavi): yoklama akını. Ses: kısa sinyal.
2. Uyarı (altın): hırsız sürüsü, gölge dalgası.
3. Tehlike (turuncu): yörünge kuşatması.
4. Büyük (kırmızı): büyük dalga. Uzun korna sesi ve üst bildirimin kalıcı kalması.

Uyarı kartı şunu söyler: kim geliyor (ırk adı ve rengi), ne kadar güçlü (zayıf, denk, güçlü şeklinde söz ile ve çubuk ile), en çok neyi hedefliyor ve hangi seçenekler var. Sayısal güç oranı yalnızca ayrıntıya basılınca gösterilir.

### 2.4 Hesap
Mevcut işlevler korunur: `myDef(p)` savunma değerini verir (seviye, savunma payı, direnç, diken payı, geçici güçlendirme).

Yeni savunma değeri: `S = myDef(p) + uyduKatkisi + hatiraPayi + hazirlikPayi`.
- `uyduKatkisi`: her uydu için `uydu.hp / 100 × 4`, en çok 5 uydu sayılır.
- `hatiraPayi`: her beş "savaş hatırası" için 1 puan, en çok 10 puan (bkz. 2.7).
- `hazirlikPayi`: uyarı sırasında "hazırlan" seçeneği seçilirse savunmanın yüzde 25'i kadar ek, yalnızca o akın için.

Saldırı gücü: `A = 8 × seviye × ırkÇarpanı × dalgaKatsayısı × (0,85 … 1,15 tohumlu rastgele)`.
- `ırkÇarpanı`: 0,9 – 1,2 arası (bkz. 4. bölüm).
- Dengeleyici: `A`, `0,5 × (8 × seviye)` altına inmez ve `1,6 × (8 × seviye)` üstüne çıkmaz. Böylece savunmayı ihmal eden oyuncu aşırı ezilmez, savunmayı çok yükselten oyuncu da hiç sınanmamış olmaz.

Oran: `r = S / A`. Sonuç kademeleri:

| Oran `r` | Sonuç | Kayıp (kaynak başına üst sınır) | Kazanç |
|---|---|---|---|
| 1,3 ve üstü | Kusursuz Savunma | yok | 12 deneyim, 1 hatıra, ganimet payı |
| 1,0 – 1,3 | Püskürtüldü | yok | 8 deneyim, 1 hatıra |
| 0,7 – 1,0 | Zorlu Direniş | en çok yüzde 4, tek kaynak | 6 deneyim, 1 hatıra |
| 0,4 – 0,7 | Ağır Hasar | en çok yüzde 6, iki kaynak; uydulara 20 hasar | 6 deneyim, 2 hatıra |
| 0,4 altı | Bastırıldı | en çok yüzde 8, üç kaynak; uydulara 30 hasar | 6 deneyim, 2 hatıra, yara izi |

Değişmez sınırlar:
- Hiçbir kaynaktan yüzde 8'den fazla kaybedilmez.
- Para kaybı yüzde 3'ü geçmez.
- Uydu sağlığı 10'un altına inmez (mevcut madencilik kuralıyla aynı).
- Kayıptan sonra 20 dakikalık koruma süresi başlar. Bu sürede yeni akın gelmez.
- "Güvenli depo": depo kapasitesinin yüzde 40'ı hiçbir akında alınamaz.

### 2.5 Yüce Sınav (45. seviye sonrası)
Bu bir saldırı değil. Beş türün her birine, kendi felsefesini sorgulayan kısa bir karar sunulur. Kayıp yok. Seçim, 50. seviyedeki finalin rengini ve ödülünü etkiler.
- Savaşçı: gücü bırakıp bırakmayacağı.
- Medeniyet: büyümeyi yavaşlatıp bırakmayacağı.
- Lojistik: yükün sahibi kim olacak, taşıyan mı alan mı.
- Yıkıcı: yok etmenin bedelini ödemeye hazır mı.
- Yaratıcı: yarattığına özgürlük verir mi.

### 2.6 Beş türün farklı tepkisi
Uyarı kartında, mevcut tür her zaman kendi özel seçeneğini görür. Bedeller mevcut kaynak adlarıyla yazılır.

| Tür | Özel seçenek | Nasıl çalışır | Güçlü yan | Zayıf yan |
|---|---|---|---|---|
| Savaşçı | Karşı Vuruş | `kuvvet` ve `cephane` harcar. Saldırıyı geri çevirir, ganimeti artırır. | En yüksek ham savunma, ganimet bonusu | Karşı vuruş başarısızsa moral kaybı (en çok 10) |
| Medeniyet | Büyük Elçilik | `bilgi` ve `refah` harcar. Dost veya tarafsız ırkın akınını durdurma şansı (yüzde 35 – 70, ortak "Elçi Gönder" seçeneğinden yaklaşık iki kat güçlü). | Kayıp yarı yarıya iner; sığınak şehirler | Düşman ırka elçilik işlemez |
| Lojistik | Konvoy Kaçışı | `yakit` harcar. Kaynakların bir kısmını önceden depoya kaçırır. Güvenli depo payı yüzde 40'tan 55'e çıkar. | Kaynak kaybı en düşük tür | Uydu hasarını azaltmaz |
| Yıkıcı | Yörünge Bozma | `kaos` ve `enerji` harcar. Saldırıyı çekim ile saptırır; yüksek getiri, yüksek sapma. | En büyük tek vuruşluk kazanç | Başarısızlıkta kaos artışı, uydular daha çok hasar alır |
| Yaratıcı | Yeniden Yarat | `ilham` ve `denge` harcar. Hasarı hemen onarır, kaybı geri verir; ya da tuzak gezegeni kurar. | Ham savunma düşük ama toparlanma en hızlı | Kusursuz savunma eşiği daha yüksek (1,45) |

Ortak seçenekler (her tür): Hazırlan (savunmayı yüzde 25 yükseltir, tür kaynağıyla), Bekle (bedelsiz, otomatik seçilen), Elçi Gönder (yalnızca ırk dost ya da tarafsızsa; başarı şansı yüzde 20 – 40, ırk tipinin elçi zorluğuna göre).

### 2.7 Savaş hatırası ve yara izi
Her akın sonrası "savaş hatırası" sayacı artar. Beş hatıra, kalıcı olarak 1 savunma puanı verir (en çok 10). Bu, oyuncunun kaybettiğinde bile gelişmesini sağlar.
"Yara izi" yalnızca görseldir: gezegende kısa süreli izler, 30 dakikada iyileşir. Hiçbir sayıyı etkilemez.

### 2.8 Çevrimdışı iken
Mevcut çevrimdışı hesap (`offline`) saldırıları da işler, ama kurallar yumuşatılır:
- Uzak kalınan her 30 dakika için en çok 1 akın, uzak kalma başına en çok 4 akın.
- Otomatik savunma değeri `S × 0,9` alınır, kayıp yarıya iner.
- Büyük dalga ve gölge dalgası çevrimdışı iken gelmez; kullanıcı dönene kadar bekler.
- "Sen yokken" özetine tek satır eklenir: kaç akın geldi, hangisi nasıl bitti.

### 2.9 Hız çarpanlarıyla uyum
Seviye atlama hızı çarpanla (5, 20, 60) arttığı için süre temelli bir plan bozulurdu. Bu yüzden akınlar süreye değil seviyeye bağlı bir plan tablosuyla gelir (bkz. 2.10). Uyarı süresi gerçek saniyedir ve çarpandan etkilenmez.

### 2.10 Akın planı (seviye temelli)
| Evre | Akın sayısı | Türleri | Büyük dalga |
|---|---|---|---|
| II (10–19) | 3 | yoklama, yoklama, hırsız | yok |
| III (20–29) | 6 | hırsız, kuşatma, yoklama, hırsız, kuşatma, hırsız | yok |
| IV (30–39) | 8 | kuşatma, gölge, hırsız, gölge, kuşatma, hırsız, gölge, kuşatma | 30. seviyede 1 |
| V (40–50) | 10 | kuşatma, gölge, hırsız, kuşatma, gölge, hırsız, kuşatma, gölge, hırsız, kuşatma | 40. ve 48. seviyede 2 |

Tablodaki akın sayıları büyük dalgaları içermez; büyük dalgalar ayrıca eklenir. Her akının tam seviyesi gezegenin tohumundan (`p.seed`) ±1 seviye sapmayla belirlenir. Plan, gezegen doğduğunda bir kez üretilip kaydedilir (`p.sc.plan`). Böylece oyuncu seviyeyi hızlı atlasa da akın sayısı sabit kalır.

---

## 3. Medeniyet gelişimi

### 3.1 Çağlar
Mevcut seviye listesinde dokuz çağ numarası (`era` 0–8) vardır. Çağ numaraları şu seviyelerde başlar: 1, 7, 13, 19, 25, 31, 37, 43, 49. Bu belge, çağlara ad ve sahne ekler. Adlar bu sürüm için önerilir.

| Çağ | Başladığı seviye | Ad | Görünen sahne |
|---|---|---|---|
| 0 | 1 | Kıvılcım Çağı | İlk ateşler, küçük topluluk |
| 1 | 7 | Taş Çağı | Taş surlar, nöbet kuleleri |
| 2 | 13 | Maden Çağı | Bronz ve demir, ilk yollar |
| 3 | 19 | Buhar Çağı | Barut, çelik, ilk şehirler |
| 4 | 25 | Makine Çağı | Fabrikalar, enerji hatları |
| 5 | 31 | Yörünge Çağı | İlk uydular, gökyüzü cephesi |
| 6 | 37 | Yıldız Çağı | Yıldızlararası yolculuk denemeleri |
| 7 | 43 | Birlik Çağı | Galaksiler arası ittifaklar |
| 8 | 49 | Akor Çağı | Barış ve uyum; final |

Çağ geçişi görsel bir olaydır: gezegen çizimindeki şehir ışıkları, yollar ve uyduların sayısı çağa göre artar (mevcut `city_lights` ve `satellite_launch` etkileri yeniden kullanılır).

### 3.2 Nüfus
Nüfus, her türün kendi kaynağından türetilen bir gösterge olarak ele alınır. Ayrı bir sayı tutulmaz; hesap şöyledir: `nufusGostergesi = seviye × 1000 × çağ çarpanı (1,0 – 2,6)`. Yalnızca gösterim ve olay metinleri içindir. Kaynak dengesini değiştirmez. Bu, kayıt boyutunu ve denge riskini sıfır tutar.

### 3.3 Bilim dalları
Altı dal. Her dal 5 kademelidir. Dal puanı, mevcut bir kaynak değil, olaylardan ve mağaza alımlarından birikir (`p.sc.sci`). Her kademe küçük, kalıcı ve türden bağımsız bir bonus verir. Bonuslar mevcut güçlendirme sistemine (`p.stats`) yazılır, yani hesap kodu değişmez.

| Dal | Ne öğretir | Kademe bonusu (kademe başına) |
|---|---|---|
| Gökbilim | Yıldız haritası, kuyruklu yıldız ve meteor önceden bilme | Akın uyarı süresine +5 saniye |
| Madde | Maden ve malzeme | Üretime yüzde +2 |
| Yaşam | Besin ve sağlık | Çevrimdışı kayıpları yüzde −5 |
| Haberleşme | Dil ve diplomasi | Elçi başarı şansına +2 puan |
| Savunma | Kalkan ve siper | Savunmaya +1 |
| Yolculuk | Yakıt ve rota | Ticaret yolu getirisine yüzde +3 |

Beşinci kademe, dalın kendi kısa hikâye satırını açar (kozmetik ödül).

### 3.4 Medeniyet olayları
Yeni olaylar, mevcut olay havuzuna `cat: "uyg"` (uygarlık) ile eklenir. Çağ sınırı `minLvl` ile verilir. Örnek on olay (ayrıntılı metinleri uygulama aşamasında yazılır):
1. Büyük Kütüphane (13): bilgi toplanır, Gökbilim puanı +1.
2. Kıtlık Yılı (13): gıda azalır; paylaşma ile moral artar.
3. Ortak Dil (19): iki topluluk uzlaşır; Haberleşme puanı +1.
4. Gezgin Ustalar (19): bir usta grup yurt ister.
5. Yeni Liman (25): ticaret yolu ihtimali açılır.
6. Hastalıkla Mücadele (25): Yaşam puanı +1.
7. İlk Uydu Töreni (31): uydu sevinci, moral artışı.
8. Yıldız Haritacıları (31): Gökbilim kademesi.
9. Kuşaklararası Anıt (37): ilişki puanı +3 (bir ırkla).
10. Büyük Uyum (43): tüm bilim dallarına +1 bir seferlik.

### 3.5 Türlere göre medeniyet vurgusu
- Savaşçı: Savunma dalı ucuz, Haberleşme pahalı.
- Medeniyet: Haberleşme ve Yaşam ucuz, Savunma pahalı.
- Lojistik: Madde ve Yolculuk ucuz.
- Yıkıcı: Gökbilim ve Savunma ucuz, Yaşam pahalı.
- Yaratıcı: Yaşam ve Haberleşme ucuz.
"Ucuz" ve "pahalı" kademe puanı eşiğinin yüzde 20 azalması ya da artması demektir.

---

## 4. Irklar ve ırk tipleri

### 4.1 Irk tipleri
Beş tip. Tipler davranışı belirler, ırklar renk ve hikâye verir.

| Tip | Ticaret oranı | Saldırı eğilimi | Elçi zorluğu | Kısa tanım |
|---|---|---|---|---|
| Ticaret | 1,10 | düşük (0,2) | kolay | Yol ve pazar kurar |
| Savaş | 0,85 | yüksek (0,8) | zor | Güç ve onurla ölçer |
| Bilgelik | 1,00 | düşük (0,15) | orta | Dinler, öğrenir, sır tutar |
| Yaşam | 1,00 | çok düşük (0,05) | kolay | Büyütür ve korur |
| Gölge | 0,80 | yüksek (0,7) | çok zor | Karanlıktan yaklaşır |

Saldırı eğilimi, o ırkın akın gönderme ağırlığını (0–1) belirler. Irk çarpanı bu tipten ve ırkın kişiliğinden gelir (0,9 – 1,2).

### 4.2 Sekiz özgün ırk
Hepsi bu projeye özgüdür. Hiçbir tanınmış eser, marka ya da karakterle ilgisi yoktur. Palet üç renklidir: ana, koyu, aydınlık.

**1. Vireller, "Işık Dokumacıları".** Tip: Ticaret.
Görünüm: ince, yarı saydam gövde; deri altında dolaşan soğuk mavi-yeşil ışık; uzun, tüy gibi uzantılar.
Değer sistemi: uyum, paylaşılan bilgi. "Bilmek, dağıtınca çoğalır."
Eğilim: ticaretçi, saldırıdan kaçınır; savunmada ışıktan kalkan örer.
Galaksi: 2. galaksi, "Sedef Kümesi".
Palet: `#7FE8D2`, `#2B6F8F`, `#E9FFF8`.
Başlangıç ilişkisi: tarafsız.

**2. Karnuklar, "Demir Sürüsü".** Tip: Savaş.
Görünüm: zırhlı, çok bacaklı, sürü olarak hareket eder; her birey bir çelik plaka.
Değer sistemi: sadakat ve sayıca güç. "Birimiz düşersek yüzümüz kalır."
Eğilim: akın gönderir, ama sözlü anlaşmaya saygı gösterir; ittifak yemini bozmaz.
Galaksi: 4. galaksi, "Pas Halkası".
Palet: `#C4552B`, `#5B2A1A`, `#F2A65A`.
Başlangıç ilişkisi: tarafsız (komşu galakside düşmana yatkın).

**3. Osmetler, "Derin Dinleyiciler".** Tip: Bilgelik.
Görünüm: uzun, ince gövdeli; yelpaze gibi kulak yapıları; deniz canlılarını andıran yumuşak hareket.
Değer sistemi: sır ve sabır. "Duymadan konuşan bilgeliği kaçırır."
Eğilim: saldırmaz; ama yankıyı onlardan gizlemek ilişkiyi bozar.
Galaksi: 6. galaksi, "Sessiz Girdap".
Palet: `#4D6CFF`, `#1B1F5E`, `#BFD0FF`.
Başlangıç ilişkisi: tarafsız; hikâyede "koruyucu" yolu seçenlere dost başlar.

**4. Tavrinler, "Gezgin Tüccarlar".** Tip: Ticaret.
Görünüm: uzun yolculuk gemilerinde yaşayan göçebe halk; bakır tonlu deri, yelken benzeri pelerinler.
Değer sistemi: yol ve söz. "Yol bitince hikâye biter."
Eğilim: her galakside küçük bir üsleri bulunur; ticaret yoluna en çok katkı verirler; yol soyulunca öfkelenirler.
Galaksi: gezgin; her galakside bir "yol yıldızı" noktası.
Palet: `#FFC83D`, `#8A4B12`, `#FFF1B8`.
Başlangıç ilişkisi: dost.

**5. Ulakarlar, "Kül Kâhinleri".** Tip: Savaş.
Görünüm: kor gibi parlayan çatlaklı ten; omuzlarında sönmeyen küller; ağır adımlı.
Değer sistemi: onur ve kader. "Ateşi görmeden gölge bilinmez."
Eğilim: yalnızca meydan okuyana saldırır; haksız saldırıyı affetmez ama savaş sonrası saygı gösterir.
Galaksi: 3. galaksi, "Kor Dizisi".
Palet: `#FF6A3D`, `#3B0F0A`, `#FFD2A8`.
Başlangıç ilişkisi: tarafsız.

**6. Eşmirler, "Taş Bahçıvanları".** Tip: Yaşam.
Görünüm: bitki ile maden karışımı; yosun örtülü kristal gövde; çok yavaş hareket.
Değer sistemi: sabır ve büyütmek. "Taş da yeşerir, yeter ki beklenir."
Eğilim: neredeyse hiç saldırmaz; saldırıya uğrayanlara kök kalkanı öğretir.
Galaksi: 1. galaksi, "Yeşil Sedir".
Palet: `#6BDB7A`, `#1F5A3A`, `#E6FFD0`.
Başlangıç ilişkisi: dost.

**7. Draveklar, "Boşluk Avcıları".** Tip: Gölge.
Görünüm: sürekli sızan karanlık madde; belirgin yüz yok, iki parlak nokta; yaklaştıkça ışık söner.
Değer sistemi: kıtlık ve avantaj. "Boşluğu dolduran, sahibi olur."
Eğilim: gölge dalgası gönderir, yolları soyar; ama güçlü bir karşılığı kabul edebilir.
Galaksi: 8. galaksi, "Kara Çayır".
Palet: `#B15CFF`, `#1A0B33`, `#E0C2FF`.
Başlangıç ilişkisi: düşman (yalnızca öte galakside).

**8. Anımsarlar, "Hafıza Tutucuları".** Tip: Bilgelik.
Görünüm: duman ve ışıktan bir siluet; kayıp gezegenin hatırası; her biri bir anıyı taşır.
Değer sistemi: hatırlamak ve hatırlatmak. "Unutulan, yeniden doğar."
Eğilim: saldırmaz; yalnızca yankının sahibi olarak oyuncuyla konuşur (hikâyedeki c12 ile bağlı).
Galaksi: hiçbir haritada görünmez; 36. seviyedeki eşikte belirir.
Palet: `#FFF1C9`, `#6A5A3A`, `#FFFFFF`.
Başlangıç ilişkisi: özel (ilişki puanı hikâye kararlarından başlar).

### 4.3 Galaksi haritası
Mevcut kodda galaksi numarası 1 ile 9 arasındadır ve gezegen doğarken rastgele atanır. Yapay komşular kendi galaksisinde ya da bir yanındaki galakside çıkar. Bu yüzden ırk yurtları sabit galaksi numaralarına bağlanır; hangi ırkın "yakın" olduğu oyuncunun galaksisine göre değişir. Bu, her oyuncuya farklı bir komşuluk verir.
Uzaklık tanımı: galaksi numarası farkı (dairesel: 9'dan sonra 1 gelir). Fark 0: yurdun içi. Fark 1: komşu. Fark 2 ve üzeri: öte galaksi.
Galaksi 5, 7 ve 9'da bu sürümde hiçbir ırkın yurdu yoktur: boş galaksilerdir ve Tavrinlerin yol yıldızı noktaları dışında uzak sinyal kaynağı olarak kullanılır. Böylece sonraki sürümlerde yeni ırk eklemeye yer kalır.
Uygulama notu: mevcut kod `p.gal + 1` ile 10 üretebilir. Yeni kod bunu 1'e sarmalıdır (10 → 1).

### 4.4 İlişki sistemi
Mevcut durum üç değerlidir: `dost`, `dusman`, `tarafsiz` (`p.rel[node.id]`). Yeni sistem bunları bozmaz, üstüne bir puan ve bir yeni durum ekler.

- Puan: her ırk için −100 ile +100 arası (`u.sc.races[ırk].score`).
- Eşikler: −40 ve altı düşman; −39 ile +39 arası tarafsız; +40 ve üstü dost. Müttefik (yeni durum, kod: `muttefik`) puanla kendiliğinden oluşmaz: puan 60 ve üstüyken "İttifak Yemini" eylemiyle kazanılır, yemin puanı 80'e çıkarır. Puan 50'nin altına inerse müttefiklik biter ve ırk dost durumuna döner. Müttefikte zamanla uyum işlemez.
- Geçiş kuralları:
  - Elçi ve armağan: +5 ile +12.
  - Ticaret: işlem başına +1.
  - Haksız saldırı: −25. Savunma amaçlı karşılık: 0.
  - Irkın akınını geri püskürtme: −3 (kısa sürede geçer). Diplomasi ile durdurma: +6.
  - Yol soyulması (gölge dalgası): ilgili ırka −10.
  - Zamanla uyum: her yarım saatte puan sıfıra doğru 1 puan yaklaşır (müttefik değilse). Böylece eski düşmanlıklar çözülebilir.
- Üst sınırlar: bir kararla puan en çok 30 değişir; oyuncu "kilitli" kalmaz.
- Gösterim: mevcut galaksi kartındaki `relation` alanı aynen çalışır. `muttefik` için galaksi çizimindeki ilişki renk tablosuna yeni bir kayıt eklenir. Tabloda olmayan değerler bugün "tarafsız" gibi çizilir, yani eski kod çökmez.

---

## 5. Öte galaksi buluşmaları

### 5.1 Açılış koşulları
- Aynı galaksideki ilk temaslar: 10. seviyeden sonra.
- Komşu galaksi (fark 1): 25. seviyeden sonra, "ilk ışık" olayıyla.
- Galaksi kapısı: 31. seviyede sezilir, 36. seviyede ("Kadim Eşik") açılır; `p.unl.kapi = 1` olarak kaydedilir.
- Öte galaksi (fark 2 ve üzeri): kapı açıldıktan sonra.

### 5.2 İlk temas dizisi
Her ırk için beş basamak, her basamak bir olaydır:
1. Sinyal: uzak bir ışık ya da üç notalık ses; ırkın rengi.
2. Gözlem: ırkın gemisi ya da elçisi uzaktan belirir.
3. Karşılaşma: üç seçenek (Selam ver, Bekle ve gözle, Kalkanı kaldır). Seçimin sonucu ırkın tipine göre farklıdır.
4. Anlaşma ya da gerilim: ilişki puanına göre.
5. Kalıcı ilişki: ırk, kart ve haritada kalıcı olarak yer alır.

Beş türün ilk temas üslubu:
- Savaşçı: Karşılaşma sırasında "Kalkanı kaldır" güçlü ama karşılığı da var.
- Medeniyet: "Selam ver" ek ilişki puanı kazandırır.
- Lojistik: Ortak ticaret yolu teklif eder.
- Yıkıcı: Karanlık ırklarla (Dravek) farklı bir pazarlık yolu açılır.
- Yaratıcı: Ortak bir "armağan eser" yaratma seçeneği gelir.

### 5.3 Diplomasi eylemleri
Altı eylem. Bedeller kaynak ve para cinsindendir; bekleme süreleri vardır.

| Eylem | Etki | Bedel | Bekleme |
|---|---|---|---|
| Elçi Gönder | ilişki +5 … +12 | tür kaynağı | 5 dakika |
| Armağan | ilişki +8; ırka göre bonus | para + kaynak | 8 dakika |
| Ortak Anıt | ilişki +12, ortak çizim | büyük bedel | 30 dakika |
| Ticaret Anlaşması | ticaret oranı artar | para | 15 dakika |
| İttifak Yemini | müttefik olur, puan 80'e çıkar (puan ≥ 60 gerekir) | para + söz | 45 dakika |
| Savaş İlanı | ilişki −40, ganimet bonusu | yok | seyrek |

### 5.4 Ticaret yolları
Mevcut tek seferlik ticaret (`G.trade`) korunur. Yanına kalıcı "yol" eklenir:
- Bir yol, bir ırk ve bir seviye ile tanımlanır; saat başına küçük, sürekli kaynak getirir.
- Yol sayısı sınırı: 2 (seviye 15), 3 (seviye 25), 4 (seviye 36), 5 (seviye 45). Uydu ve koloni sayısı bunu azaltmaz.
- Yol getirisi: `getiri = taban × ırk tipi oranı × (1 + Yolculuk dalı payı)`. Çevrimdışı iken en çok 8 saatlik getiri toplanır.
- Yola gölge dalgası gelirse yol 20 dakika "kapalı" olur, silinmez.

### 5.5 İttifaklar
- En çok 3 müttefik.
- Büyük dalgada müttefik yardımı: savunmaya müttefik başına +10 puan ve kayıp yüzde 20 azalır.
- Yardım isteği: müttefik bazen yardım ister (karar olayı, 90 saniye). Cevapsız kalırsa puan yalnızca −5 olur; ittifak bozulmaz.
- Müttefik ırkın düşmanıyla ittifak mümkün değildir; teklif sırasında bu söylenir.

### 5.6 Hikâye dalları
15 bölümlük ana hikâye aynen kalır. Üç ana karar (c05, c09, c12) mevcut `G.ending` hesabına girmeye devam eder. Ek olarak şu ayarlar uygulanır:
- c05 "koruyucu": Osmetler dost başlar; akın sayısı yüzde 20 azalır, ama her akın biraz güçlüdür.
- c05 "kâşif": Tavrinler ve ilk temas daha erken gelir; ilk temas 3 seviye erken açılır (10. seviye yerine 7. seviyeden sonra).
- c05 "dönüştürücü": Anımsarlarla bağ güçlenir; Yaratıcı olayları artar.
- c09 ve c12 kararları, 36. seviyedeki Anımsar buluşmasının tonunu değiştirir.

Yan bölümler: her ırk için bir yan bölüm (toplam 8), ayrı bir veri bölgesinde (`D.SCEN.side`) tutulur. Ana hikâyenin 15 bölüm kuralı (veri doğrulaması bunu denetler) bozulmaz. Yan bölümler "Hikâye" ekranında ayrı bir sekmede görünür.

Sonlara etki: üç son korunur (koruyucu, kâşif, dönüştürücü). Final ekranı, kurulan ilişkileri ve ittifakları özetleyen kısa bir "yolculuk özeti" gösterir.

---

## 6. Mevcut kodla bütünleştirme planı

### 6.1 Genel ilke
Yeni işler ayrı dosya ve ayrı veri bölgesine konur. Mevcut dosyalara yalnızca küçük, dar kancalar eklenir. Her kanca, özellik kapalıyken eski davranışı birebir korur.

### 6.2 Dosya dosya liste
**`build.py` ve `template.html`.**
- Yeni veri dosyası `data/scenario.json`.
- `template.html` içine `<script type="application/json" id="d-scenario">/*DATA:scenario*/</script>` eklenir.
- `build.py` içinde `out.replace('/*DATA:scenario*/', data('scenario'))` satırı eklenir (`data()` işlevi dosya yoksa `null` döndürdüğü için eski derleme bozulmaz).

**`src/40-gamedata.js`.**
- `D.SCEN = load('d-scenario') || {}` ve doğrulama (ırk sayısı 8, saldırı türü sayısı 6, evre sayısı 5).
- Mevcut doğrulamalar (yumurta 40, hikâye 15, seviye 50) aynen kalır.
- Yardımcılar: `D.race(id)`, `D.raidType(id)`, `D.phase(lvl)`.

**`src/41-game.js` (asıl iş).** Yeni işlevler (hepsi `G.` altında ya da dosya içi):
- `scPlan(p)`: gezegen doğunca akın planını üretir (`p.sc.plan`), tohumdan (2.10).
- `stepScenario(p, dt, simNow, isOff)`: `stepPlanet0` içinden tek satırla çağrılır; plan eşiğine gelince uyarıyı üretir.
- `raidSpawn(p, tur, irk)`: `p.pending` içine `cat: 'akin'` olaylı bir giriş ekler (mevcut `pe` şekli: `uid, eventId, name, text, icon, cat, choices, exp, t`).
- `raidResolve(p, pe, secenek)`: `resolve()` ile aynı kapıdan geçer; sonuç kademesini hesaplar ve değişmez sınırları uygular.
- `G.races()`, `G.race(id)`: ilişki puanı, durum, ilk temas aşaması.
- `G.diplomacy(irkId, eylemId)`: 5.3'teki eylemler.
- `G.routes()`, `G.routeAdd(irkId)`, `G.routeTick`: ticaret yolları.
- `G.allies()`, `G.allyAdd`, `G.allyHelp`.
- `G.raids()`: son akın günlüğü (`p.sc.log`, en çok 30).
- `G.science()`, `G.scienceUp(dal)`: bilim dalları.
- `G.galaxy()` genişletilir: her yapay komşuya `race` alanı eklenir (galaksi numarasına ve tohuma göre); mevcut `relation`, `power`, `def` alanları aynen kalır.
- `normalize()` içine varsayılanlar eklenir: `u.sc = {v:1, races:{}, contacts:{}, side:{}}` ve her gezegen için `p.sc = {v:1, plan:null, next:0, wins:0, mem:0, prot:0, scar:0, sci:{}, routes:[], allies:[]}`.
- `offline()` içinde 2.8'deki yumuşatma kuralları.
- Yeni test kancaları: `SG.test.forceRaid(tur)`, `SG.test.setRel(irk, puan)`.

**`src/31-world.js`.**
- İlişki renk tablosuna `muttefik` kaydı.
- Düğümlere ırk halkası (ırkın ana rengi) ve küçük sembol; kalite 0'da yalnız renk.
- Galaksi kapısı işareti (36. seviyeden sonra).
- Mevcut etkiler yeniden kullanılır: `war_strike`, `shield`, `trade_ship`, `impact`. Yeni etki ihtiyacı: `raid_incoming` (uzaktan gelen ışık çizgileri, en çok 3 nesne).

**`src/50-ui.js` ve `css/main.css`.**
- Uyarı kartı: mevcut karar kartı yolu kullanılır; öncelik rengi ve ırk adı eklenir.
- Galaksi kartına ırk, ilişki puanı çubuğu ve diplomasi düğmesi.
- Dünya görünümüne "Akın Günlüğü" ve "Bilim Dalları" sekmeleri.
- Ayarlar: "Nöbet modu" (çevrimdışı akınları aç/kapat).
- Hikâye ekranı: "Yan Bölümler" sekmesi.

**`src/20-audio.js`.**
- Mevcut kimlikler yeterlidir (`war_horn`, `shield_up`, `shield_hit`, `signal`, `warp`, `peace`, `trade`). İsteğe bağlı iki yeni kimlik: `raid_alarm` ve `contact_hum`. Müzik: büyük dalgada geçici gerilim tonu (`setType` benzeri).

**Veri JSON.**
- `data/scenario.json`: ırklar, saldırı türleri, evre eşikleri, diplomasi eylemleri, bilim dalları, yan bölümler, medeniyet olayları, 12 yeni rozet.
- `data/CINS.json` ve `data/story-main.json` DEĞİŞMEZ (ana hikâye 15 bölüm kuralı korunur).

### 6.3 Veri şeması taslakları
Ayrıntılı örnek: `senaryo-veri-taslak.json`. Özet:
- Irk: `{id, ad, takma, tip, galaksi, palet:[a,b,c], deger, egilim:{ticaret, saldiri, elci}, baslangic:'tarafsiz', yurtAd, seviyeMin}`.
- Saldırı türü: `{id, ad, seviyeMin, katsayi, uyariSn, oncelik, kayip:{ustSinir, kaynakSayisi}, odul:{xp, hatira}}`.
- Evre: `{id, ad, seviyeMin, seviyeMax, akinSayisi, buyukDalgaSeviyeleri}`.
- İlişki eşikleri: `{dusman:-40, dost:40, ittifakGerek:60, muttefik:80, muttefikKaybi:50}`.
- Taslak dosyada ayrıca: ırk çarpanları (0,9 – 1,2), dokuz çağ ve nüfus çarpanları, 40 ilk temas olayı kimliği (`temas.<ırk>.<basamak>`), 10 uygarlık olayı, 8 yan bölüm, 12 yeni rozet, diplomasi eylemleri ve ticaret yolu sınırları.

### 6.4 Kaydetme uyumluluğu
- Anahtarlar `sg1_` ile başlayan mevcut depoda kalır; yeni anahtar açılmaz. Yeni veriler kullanıcı kaydının içindeki `sc` alanına yazılır (`u.sc`, `p.sc`).
- `VER` değeri değiştirilmez. Yeni alanların sürümü kendi içinde tutulur (`sc.v`). Böylece eski sürümle yapılmış yedek dosyası (`importBackup`) sorunsuz okunur.
- `normalize()` eksik alanları doldurur; dolduramadığı hiçbir alan yoktur.
- Geri dönüş: yeni sürümden eski sürüme dönülürse bilinmeyen alanlar yok sayılır (mevcut kod zaten bilinmeyen alanlara bakmaz).
- Boyut: gezegen başına en çok 4 KB eklenir (günlük 30 satırla sınırlı). Yedek dosyası boyutu buna göre hesaplanır.
- Yedek ve göç testi: v1.0.3 kaydı açılıp kaydedilir, yeni alanlar eklendikten sonra tekrar açılır; hiçbir sayı değişmemelidir.

### 6.5 Performans bütçesi
- Her kare maliyeti: yeni sistem, çizim döngüsünde yalnızca düğüm başına bir halka çizer. Hedef: galaksi görünümünde mevcut sürüme göre en çok yüzde 3 ek maliyet (4 kat yavaşlatılmış işlemcide 55 kare/saniye altına inilmez).
- Oyun mantığı: her saniye gezegen başına en çok 3 kıyaslama ve 1 tohumlu sayı; hesap O(1).
- Akın etkisi: aynı anda en çok 3 çizgi nesnesi; kalite 0'da yalnız renkli çerçeve.
- Bellek: akın günlüğü 30 satır, ilişki tablosu 8 satır, yol listesi 5, müttefik listesi 3.
- Ses: yeni sesler mevcut hız sınırlayıcıya girer; akın başına en çok 2 ses.
- Çevrimdışı hesap: mevcut döngü maliyeti %10'dan fazla artmaz (akın hesabı yalnızca eşik geçişinde çalışır).

### 6.6 Test planı
1. Birim denetimi (test kancasıyla): `forceLvl(n)` ile her evre eşiğinde `SG.test.forceRaid(tür)`; sonuç kademesi, kayıp sınırı (yüzde 8), para sınırı (yüzde 3), uydu sağlığı alt sınırı (10).
2. Değişmezler: `G.pass()` hiçbir bozuk sayı bildirmez (negatif kaynak, NaN, seviye düşmesi yok).
3. Tohum kararlılığı: aynı tohum, aynı seviye, aynı akın planı; iki çalıştırmada aynı sonuç.
4. Çevrimdışı: 6 saatlik `fastForward` sonrası akın sayısı üst sınırı (4), kayıp yarıya inmiş, rapor satırı var.
5. Tür senaryoları: beş türün her biri için özel seçenek çalışıyor, bedel doğru, başarı oranı beklenen aralıkta (1000 deneme, yüzde 5 sapma).
6. İlişki: puan eşikleri doğru durum üretir; zamanla uyum çalışır; müttefik sayısı 3'ü geçmez.
7. Eski kayıt: v1.0.3 yedeği açılır, kaydedilir; hiçbir mevcut alan değişmez.
8. Arayüz: 390 ve 1280 genişlikte uyarı kartı, galaksi kartı, günlük; konsol hatası 0; 30 yol turunda canvas sızıntısı yok.
9. Hız: 4 kat yavaşlatılmış işlemcide galaksi ve dünya görünümü kare hızı ölçümü (mevcut sürümle karşılaştırma).
10. Gerçek telefon: Android kabuğunda uyarı süresinin ve duraklatmanın doğru çalıştığı (uygulama arka plana alınınca akın gelmez, uyarı süresi dolmaz).

---

## 7. Uygulama sırası

Tahmin birimi: bir uzman ajanın bir çalışma oturumu (yaklaşık yarım gün). Riskler her aşamanın yanında.

| Aşama | İş | Tahmin | Ana risk |
|---|---|---|---|
| 0 | Veri bölgesi ve altyapı: `scenario.json`, `build.py`, `40-gamedata.js` doğrulama, `normalize()` varsayılanları, göç testi | 1 oturum | Eski kayıt bozulması (göç testiyle kapanır) |
| 1 | Irklar ve ilişki sistemi: galaksi düğümlerine ırk, ilişki puanı, `muttefik` durumu, galaksi kartı | 1,5 oturum | Galaksi çizimi performansı (halka maliyeti) |
| 2 | Akın motoru: plan, uyarı kartı, sonuç kademeleri, değişmez sınırlar, çevrimdışı kuralları | 2 oturum | Denge (çok ağır ya da çok kolay) |
| 3 | Tür tepkileri: beş özel seçenek, hatıra ve yara izi, hazırlık seçeneği | 1,5 oturum | Beş türün dengesi |
| 4 | Medeniyet: çağ adları ve sahneleri, bilim dalları, on yeni olay | 1,5 oturum | Çok metin; gereksiz tekrar |
| 5 | Öte galaksi: ilk temas dizisi, diplomasi eylemleri, galaksi kapısı | 2 oturum | Hikâye tutarlılığı (c12, c13 ile) |
| 6 | Ticaret yolları ve ittifaklar, büyük dalga (üç aşama) | 2 oturum | Müttefik yardımı hesabı; çevrimdışı yol birikimi |
| 7 | Yan bölümler, hikâye dalları, final özeti, Yüce Sınav | 1,5 oturum | Ana hikâyeyi bozmama |
| 8 | Denge, ses, görsel cila; tam test; gerçek telefon denemesi | 2 oturum | Telefonda doğrulama eksikliği |

Toplam yaklaşık 15 oturum. Her aşama sonunda: derleme, test planının ilgili maddeleri, yedeklenebilir sürüm numarası artışı (v1.1.0 civarı) ve GitHub güncellemesi.

Önerilen yayın dilimleri:
- v1.1.0: aşama 0–2 (ırklar, ilişki, akınlar; yalnız yoklama ve hırsız).
- v1.2.0: aşama 3–4 (tür tepkileri, medeniyet).
- v1.3.0: aşama 5–6 (öte galaksi, yollar, ittifaklar, büyük dalga).
- v1.4.0: aşama 7–8 (yan bölümler, final, cila).

---

## 8. Ayrı yol haritası: gerçek para ve blok zinciri
Bu senaryonun hiçbir mekaniği gerçek parayı ya da blok zincirini kullanmaz. Test modundaki sanal para yapısı olduğu gibi kalır. "Soğuk cüzdan" gibi gelecek planları ayrı bir belgenin konusudur; sunucu, hukuki inceleme ve güvenlik gerektirir. Senaryo verisi bu yüzden gezegen sahipliği ya da hiçbir değer taşıyıcı alan içermez.

## 9. Açık sorular (uygulama öncesi kararlar)
1. Akınlar tüm hesaplarda mı açık olsun, yoksa ayarlardan kapatılabilsin mi? (Öneri: kapatılabilsin, varsayılan açık.)
2. Irk adları ve takma adlar son hale gelmeden Doktor onayı alınmalı.
3. Uyarı süresi 90 saniye yeterli mi? Telefonda deneyip ayarlanmalı.
4. Çağ adları (3.1) bu belgedeki gibi mi kalsın?
