# SpacEgg 2.0 — Oyun Tasarımı (Keşif, Karar, İlerleme)

Kapsam: SG.Disc (src/62-discovery.js) + data/discoveries.json. Ana döngü: Oluştur → Gözlemle → Keşfet → Karar ver → Sonucu gör → Kaydet/paylaş.

## İlke
Ödül = bilgi, koleksiyon, başlık. Para, enerji, bekleme, seri, kıtlık YOK. Hiçbir keşif zamanla kaybolmaz, hiçbir keşif için beklemek gerekmez; zamanı isteyen hızlandırır.

## Gözlem kademesi (merak)
`uni.state.observed[id]` = 0..3 (SG.U.observe). Her gözlem bir katman açar; bilgi kademeli gelir. Kararlar gezegen için en az seviye 1, ağır müdahaleler (kuyruklu yıldız, atmosfer kaçışı) seviye 2, bölgesel kararlar galaksi seviye 2 ister. "Bilmediğin şeye karar veremezsin" kuralı merakı ödüllendirir.

## Keşifler (70)
Evren 10, Galaksi 10, Yıldız 12, Gezegen 14, Olay 12, Karar 12. Her biri {id,title,desc,cat,tier,hint,need}. `tier` 1–4 kademeyi belirler (1 = ilk dakikalar, 4 = uzun vade). 3 gizli keşif (nötron yıldızı, kara delik, "Gerçek Bir Ders") hedef listesinde görünmez, listede "???" olarak durur.

### Koşul DSL'i (`need`, tüm anahtarlar VE ile birleşir)
observed{kind,min,level} · gkind{kind} · scls{cls} · sphase{phase} · ptype{type} · habZone · habScore{min} · temp{min,max} · moons{min} · spread{min} · event · events{min} · eventKinds{min} · decided · decisions{min} · decidedKinds{min} · reverted{min} · scale · scales{min} · t{min} (Myr) · speed{ix} · flag · count{cat,min} · total{min} · disc · any[] · all[].
Durum yalnız `uni.state` üzerinden okunur; sıcaklık/yaşanabilirlik güncel parametrelerle SG.U.climate'tan hesaplanır.

## Kararlar (14, 7 çift)
Hepsi geri alınabilir, adım küçük, değerler sınırlı: atm 0–2, water 0–2, albedo 0,05–0,95. Maliyet yok.
| Karar | Hedef | Etki | Etiket |
|---|---|---|---|
| sera-artir / sera-azalt | gezegen | atm ±0,25 | basit |
| su-ekle / su-cek | gezegen | water ±0,25 | basit |
| bulut-artir / toz-artir | gezegen | albedo ±0,10 | gerçek |
| kuyruklu-yonlendir / atmosfer-kacisi | gezegen (sev. 2) | su ±0,30, atm ±0,10 | kurgu |
| gezegen-dogal | gezegen | ilk değerlere dön | basit |
| bolge-sera-artir / -azalt | galaksi (sev. 2) | gözlenmiş tüm gezegenlerde atm ±0,10 | basit |
| bolge-su-artir / -azalt | galaksi (sev. 2) | water ±0,10 | basit |
| galaksi-dogal | galaksi (sev. 2) | hepsini ilk haline getir | basit |
Her karar sonucu açık neden-sonuç cümlesi + sayılar döndürür: "Sıcaklık 288 K → 296 K, yaşanabilirlik %80 → %55". Aynı küçük bölgesel değişiklik farklı gezegenlerde farklı sonuç verir (öğretici). Yaşanabilirlik %50 eşiğini yukarı geçmek "Cennet Mühendisi", aşağı geçmek gizli "Gerçek Bir Ders" bayrağını açar; kayıp bir cezadır değil öğrenmedir, her şey geri alınabilir.

## Hedefler (SG.Disc.goals)
En çok 3 ipucu gösterilir; yalnız `hint` (başlık yok), farklı kategorilerden seçilir. Kademe sınırı `1 + floor(açılan/7)`: ilk 7 keşiften önce yalnız tier 1 görünür, sonra tier 2 vb. Sıra tohumdan türetilir (aynı evren hep aynı sırayı görür, her evren farklı). Tek koşullu hedefler kısmi ilerleme (0..1) döndürür.

## Rozet ve unvan (para yok)
10 rozet: Çırak Gözlemci (3 keşif), Gökyüzü Okuyucusu (10), Zaman Yolcusu, Kartograf, Yıldız Okuyucu, Dünya Bakıcısı, Kozmik Haberci, İklim Çırağı (kategori sayıları), Kozmik Hikâyeci (40), Evren Ustası (60). Unvan en son kazanılan rozettir. Başlangıç unvanı "Yeni Gözlemci".

## İlk 10 dakika akışı
- 0:00–0:30 Evren oluşturma, Büyük Patlama animasyonu, evren haritası. Zaman 1× akar.
- ~0:20 İlk dokunuşta **İlk Işık** (ilk anlamlı eylem, eğitim adımı 1). Galaksi türüne göre ikinci keşif de gelir (örn. Sarmal Kollar).
- ~1:00 Hız kontrolü: **Sessiz An** (duraklat) ve **Zamanın Akışı** (10×). Eğitim adımı 2.
- ~1:30 Galaksiye yakınlaş: **Galaksi Gezgini**; bir yıldıza dokun: **İlk Yıldız** (+ sarı/kırmızı sınıf keşfi).
- ~2:30 Sisteme gir, gezegene dokun: **İlk Dünya**, tür keşfi (Gaz Devi/Mavi Dünya...). Hedef listesi tier 2'ye açılmaya başlar.
- ~3:30 İlk karar: panelde "Atmosferi kalınlaştır" → sayılarla sonuç, **İlk Müdahale** + **Sera Ustası**; tersini seçerek **Pişmanlık Yok**.
- 4–8 dk Hızı 100–1000× yap; ilk kozmik olay haberi (**İlk Haber**), **Bir Milyar Yıl**; **Dört Ölçek**. İlk rozet (**Çırak Gözlemci**) ~3. keşifte.
- 8–10 dk Fotoğraf modu (**Evrenin Portresi**), 10+ keşif → **Gökyüzü Okuyucusu**. Hedef: ilk oturumda ~12–16 keşif (%17–23). Tamamı ~3–5 saatlik rahat oynayışa yayılır; tier 4 uzun vadedir.

## Denge ve test edilebilirlik
- Hiçbir keşif tek bir nadir olaya bağlı değil: olay keşifleri için zaman hızlandırma yeterli; en nadir (çarpışma, süpernova) 1000× hızda dakikalar içinde beklenir (SG.U olay oranlarıyla ayarlanır; sapma olursa yalnız bu koşulları gevşet).
- Gizli keşifler yalnız tamamlayıcıdır, rozet eşiklerine yetmeyecek şekilde tutulmuştur (usta=60/70).
- `node out/disc-selftest.js` 95 denetim çalıştırır (DSL, karar sınırları, geri alma, rozet, performans, bus olayları).

## HUD'un çağırması gerekenler
`SG.Disc.noteScale(uni,scale)` (ölçek değişince), `SG.Disc.noteSpeed(uni,ix)` (hız değişince), `SG.Disc.flag(uni,'photo')` (fotoğraf çekilince), `SG.Disc.check(uni)` (olay/gözlem sonrası; ucuzdur, imza değişmediyse anında döner), `SG.bus.on('disc:unlock'|'disc:badge'|'d:decision')`.
