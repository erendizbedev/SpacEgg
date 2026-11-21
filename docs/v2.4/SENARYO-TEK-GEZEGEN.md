# SpacEgg: Tek Gezegen Senaryosu (tartışma taslağı)

Durum: yalnızca tasarım belgesi. Kod, ses efektleri ve görsel tasarım değişmez. Ödemeler test modunda kalır, hesaplar cihazda yerel, gelirin yüzde 10'u görme engellilere bağış taahhüdü sürer. Soğuk cüzdan hâlâ planlı, aktif değil.

## 1. Vizyon ve oyuncu fantezisi

**Vizyon:** Yumurtadan çıkan tek bir gezegeni, kıvılcımdan yıldızlararası bir uygarlığa taşı; kapına gelenleri püskürt, sonunda galaksiye fetih, ittifak ya da hükümle yön ver.

**Fantezi:** "Bu gezegen benim halkım. Onu ben büyüttüm, ben koruyorum, kaderine ben karar veriyorum."

Çoklu evren simülatörü kaldırılmaz; "Evren" ekranı gezegenin dışındaki galaksi haritası olur (bölüm 7). "Yeni evren yarat" yerine "Yumurtanı seç" ile başlanır.

## 2. Çekirdek döngü

- **Dakikalık (30-90 sn):** Toplama dokunuşu, bir yapı yükseltmesi, bir birlik emri. Tek elle, en çok 3 dokunuş.
- **Saatlik (3-5 oturum):** Kuyruğa yapı ve birlik koy, depoyu boşalt, gelen akına karar ver, bir keşif gönder.
- **Günlük (10-15 dk):** Günün hedefi (3 küçük görev), ticaret yolu yenileme, çağ ilerlemesi, bir saldırı ya da elçi eylemi.
- **Haftalık:** Çağ geçişi ve büyük dalga. Hızlı oturum, uzun vadeli ilerleme.

Hiçbir şey seni bekletmez ya da zorlamaz; süre dolunca hızlandırma isteğe bağlıdır.

## 3. Ekonomi

**Para birimi:** *Kredi* (mevcut coin). Ticaret, birim eğitimi ve diplomasi hediyesi için. Savaşta kaybı en çok yüzde 3.

**Beş kaynak:**
| Kaynak | Kaynağı | Başlangıç üretimi |
|---|---|---|
| Gıda | Tarla | 60 / sa |
| Taş | Taş ocağı | 40 / sa |
| Metal | Maden | 30 / sa (2. çağdan) |
| Enerji | Jeneratör | 20 / sa (4. çağdan) |
| Bilgi | Kütüphane, laboratuvar | 10 / sa |

Mevcut beş türün dört kaynağı bu beşe eşlenir; tür "uzman kaynağında" yüzde 15 bonus alır (örn. Savaşçı metalde).

**Üretim-tüketim:** Üretim yapı seviyesiyle artar (seviye başına +%12). Nüfus gıda tüketir: her 100 nüfus 6 gıda / sa. Gıda sıfırsa ceza yok, yalnız üretim yüzde 50 yavaşlar.

**Depo sınırı:** Başlangıç 2.000 birim, her çağda +1.500. Depo dolunca üretim durur, kayıp olmaz. Depo kapasitesinin yüzde 40'ı saldırıda alınamaz.

**Ticaret:** Ticaret yolu saatte 30-60 birim getirir (yol sayısı 2'den 5'e). Çevrimdışı en çok 8 saatlik getiri toplanır. Kaynak çevirme: 10 taş = 8 metal, kredi ile hızlı takas.

## 4. Medeniyet gücü ve çağlar

**Medeniyet gücü (MG)** tek göstergedir: `MG = 10 × çağ + toplam yapı seviyesi + 2 × birlik sayısı/10 + bilim kademesi × 5`. Saldırı gücünü, sıralamayı ve hükmetme eşiğini belirler.

| Çağ | Kilidi | Yeni yapı | Yeni birim |
|---|---|---|---|
| 1. Kıvılcım | Başlangıç | Tarla, Ocak, Merkez | Nöbetçi |
| 2. Taş | 30 dk, Merkez 3 | Taş sur, Kule | Mızrakçı (30 gıda, 20 taş) |
| 3. Maden | MG 120 | Maden, Demirci | Okçu, Kılıçlı (25 gıda, 25 metal) |
| 4. Buhar | MG 300, 1 bilim kademesi | Jeneratör, Kale | Topçu (40 metal, 20 enerji) |
| 5. Makine | MG 600 | Fabrika, Kalkan jeneratörü | Zırhlı |
| 6. Yörünge | MG 1.000 | Uydu rampası, Radar | Uçan birim, uydu |
| 7. Yıldız | MG 1.600 | Kapı, Elçilik sarayı | Yıldız gemisi |

Çağ atlama: kaynak bedeli (örn. 3. çağ için 600 gıda, 500 taş, 300 metal) ve kısa görsel tören. Önceki çağ yapıları yok olmaz, yükseltilir.

## 5. Gezegen haritası ve yapılar

Gezegen 4 bölgeye ayrılır: **Merkez, Tarım-Maden, Savunma Halkası, Yörünge.** Her bölgede 6 slot, toplam 24. Slot dokunuşla açılır, sürükleme yok. Çağ ilerledikçe yeni slotlar açılır (1. çağda 6, 7. çağda 24).

Dikey ekranda gezegen ortada, altta tek sıra eylem çubuğu, üstte kaynak şeridi. Yapı yükseltmesi ve birlik emri baş parmak bölgesinde. Mevcut ses efektleri ve çizim tarzı yeni yapılara aynen uygulanır.

## 6. Savunma

**Saldırı türleri (altı):** Yoklama, Hırsız Sürüsü, Yörünge Kuşatması, Gölge Dalgası, Büyük Dalga, Yüce Sınav (kayıpsız).

**Dalga takvimi (seviyeye bağlı, süreye değil):** 1. çağda saldırı yok. 2. çağda 3 yoklama/hırsız akını, 3-4. çağda 6, 5-6. çağda 8, 7. çağda 10; büyük dalgalar 4., 6. ve 7. çağ sonunda. Plan tohumdan üretilir.

**Uyarı:** 90 saniye (gerçek zaman). Kartta kim, ne kadar güçlü (zayıf, denk, güçlü), neyi hedefliyor. Karar verilmezse bedelsiz seçenek uygulanır.

**Üç katman:**
1. **Kale/sur:** sabit savunma, çağla artar (örn. Kale 3. seviye = +40).
2. **Kalkan:** enerji harcar, bir akın için savunmayı %25 artırır.
3. **Birlik:** garnizon; her birim 4-12 savunma verir.

Savunma gücü `S` ile akın gücü `A` oranlanır: S/A 1,0 üstü = kayıpsız; 0,4 altı = en kötü durumda kaynakların en çok %8'i (en çok 3 kaynak), kredinin en çok %3'ü. Seviye ve yapı asla kaybolmaz; kayıptan sonra 20 dk koruma, savaş hatırası kalıcı bonus verir.

## 7. Saldırı ve hüküm

**Keşif:** İzci birimi 5 dk'da bir komşuyu gözlemler: güç (zayıf-denk-güçlü), ganimet, ırk tipi. Komşu sayısı çağla artar (3. çağda 4, 7. çağda 12).

**Hedef seçimi:** Harita üzerinde en çok 3 öneri; MG'ye yakın hedefler. Fiyatlı saldırı: birlik ve 100 kredi sefer masrafı, süre 3-10 dk.

**Üç yol, sekiz ırk (özgün, mevcut ırklar korunur):**
- **Fetih:** Ganimet kaynak stoğunun %10'u kadar (en çok 1.500). Haksız saldırı itibarı -25.
- **Vassal:** Yenilen komşu saatte 20-40 kaynak vergi öder; hükmü bozarsa yeniden sefer.
- **Diplomasi / ittifak:** Elçi (+5…+12), ticaret anlaşması, ittifak yemini (puan 60 üstü). Büyük dalgada müttefik başına +10 savunma. En çok 3 müttefik.

**Hüküm (galaksi hakimiyeti):** 7. çağda MG 1.600 üstünde, galaksinin haritasında 5 bölgeden 3'ünü vassal ya da müttefik yapan oyuncu "Hükümdar" olur; üç son: Fatih, Birleştirici, Bilge. Sonrası sonsuz mod: sezonluk sıralama.

## 8. İlerleme, çevrimdışı ve adil zorluk

- **Ceza yok ilkesi:** Seviye düşmez, gezegen yok edilmez, yapı silinmez.
- Kaynak kaybı en çok %8, kredi kaybı en çok %3, kayıptan sonra 20 dk koruma.
- Çevrimdışı: 30 dk'da en çok 1 akın, kalan 4. Savunma ×0,9, kayıp yarıya iner. Büyük dalga ve gölge dalgası çevrimdışıyken gelmez. Dönüşte tek satırlık "Sen yokken" özeti.
- Üretim çevrimdışı en çok 8 saat birikir (kayıp yok).
- Zorluk uyum yapar: A, S'ye göre 0,5-1,6 bandında tutulur; ihmal edince ezilmezsin, güçlenince sınanırsın.
- Toplam: yaklaşık 25-30 saat aktif oynayış, 3-4 hafta.

## 9. İlk 10 dakika

- **0:00-0:30:** Yumurta seç, çatlat, gezegen belirir. Tek dokunuş.
- **0:30-2:00:** İlk tarla ve taş ocağı. Kaynak şeridi dolar, ses ve ışık geri bildirimi.
- **2:00-4:00:** Merkezi 2. seviyeye çıkar, ilk Nöbetçi. Hedef kartı: "Taş çağına 3 adım".
- **4:00-6:00:** İlk Yoklama Akını değil; önce sezdirme, uzak ışık ve üç nota.
- **6:00-8:00:** Çağ 2'ye geç (garantili, kısa tören), ilk sur.
- **8:00-10:00:** Bir komşuya izci, ilk elçi. "Yarın gel: ocaklar seni bekler" kartı. Hiçbir pencere açılmaz, sayı yığını yoktur.

Hiçbir akın, kayıp ya da bekleme ilk oturumda yok.

## 10. Riskler ve açık sorular

**Üç risk:**
1. **Kapsam şişmesi:** AoE derinliği mobil hız ile çelişir. Önlem: 5 kaynak, 24 slot, tek çubuk.
2. **Uzun bekleme ve ceza algısı:** Ceza yok ilkesini bozmadan savunmanın "ağırlığı" hissedilmeli.
3. **Denge:** 7 çağ, 5 tür ve fetih sonsuz kaynak üretebilir. Önlem: ganimet tavanı, tohumlu test.

**Doktor'a altı açık soru:**
1. Beş türün 4'er kaynağı korunsun mu, yoksa herkes ortak 5 kaynakla mı başlasın?
2. Fetih ve vassal ne kadar sert olsun; komşu "yok edilebilir" mi, yoksa yalnız vassal mı?
3. Çevrimdışı saldırı tamamen kapatılsın mı, yoksa mevcut yumuşatma yeterli mi?
4. Hüküm sonrası sonsuz mod için sezonluk sıralama istiyor muyuz?
5. Çoklu evren fikri tamamen kalksın mı, yoksa 7. çağdan sonra "yeni gezegen" olarak geri mi gelsin?
6. Hızlandırma yalnız reklamsız test modunda mı kalsın, yoksa kredi ile mi alınsın?
