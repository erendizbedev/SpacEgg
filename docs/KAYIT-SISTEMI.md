# Kayıt Sistemi (SG.S) — src/07-save.js

## Depolama düzeni
Önek: `sg2_<kullanıcı>_` (kullanıcı adı güvenli kodlanır: harf/rakam dışı her karakter `_<hex>_`, 40+ karakter kısaltılıp özetlenir).
| Anahtar | İçerik |
|---|---|
| `…idx` | evren listesi `[{id,name,seed,t,saved,bytes}]` (bozulursa kayıtlardan yeniden kurulur) |
| `…act` | son aktif evren id'si |
| `…u_<id>` | ana kayıt (zarf) |
| `…b_<id>_0..2` | 3 dönüşümlü yedek (önceki ana kayıt sürümleri) |
| `sg2_corrupt_<ts>_<h>` | bozuk kaydın kurtarma kopyası (asla otomatik silinmez) |
Zarf: `{f:1, v:<evren şeması>, sum:<SG.hash.uzunluk>, saved:<artan ms>, t:<kozmik zaman>, d:"<evren JSON>"}`. Sağlama `d` metni üzerindedir.
v1 (`sg1_*`) anahtarlarına dokunulmaz.

## Ne kaydedilir
Yalnız `uni` (ad, tohum, hazır ayar, t, hız, galaksi özeti, state). Yıldız/sistem/gezegen KAYDEDİLMEZ (tohumdan deterministik üretilir). Tipik boyut ≈ 3–15 KB. Üst sınır 1,5 MB.

## Yazma sırası ve yedek
Her yazmada: (1) mevcut ana kayıt sağlamsa ve son yedekten ≥90 sn geçtiyse (ya da `save(true)`) yedek halkasına yazılır, (2) ana kayıt yazılır, (3) indeks ve `act`. Değişiklik yoksa (sağlama aynı) yazılmaz. Yedek yazılamazsa sessizce atlanır, ana kayıt önceliklidir.

## Bozuk kayıt
Açarken sağlama/JSON/alan hatası → kopya `sg2_corrupt_…`'a saklanır → en yeni sağlam yedeğe dönülür ve ana kayıt onarılır → `status()` = `{ok:false,recovered:true,msg:"Kayıt bozuktu; <tarih> yedeğinden kurtarıldı."}`. Sağlam yedek yoksa `open()` null döner, `status().error` true.

## Depolama yok / dolu
`localStorage` yoksa ya da `setItem` kota hatası verirse kayıt bellek katmanında tutulur (okuma/yazma çalışır, `save()` false döner, atmaz), `status().mem=true` ve mesaj gösterilmelidir; kullanıcı dışa aktarmaya yönlendirilir. Yer açılınca bir sonraki başarılı yazma bellek katmanını boşaltır.

## İki sekme
`storage` olayı ile diğer sekmedeki değişiklik algılanır (`status().conflict`). Yazarken diskteki sürüm bu sekmenin son bildiği sürümden farklıysa o sürüm yedeğe alınır (kayıp yok), son yazan kazanır.

## Dışa/içe aktarma
`"SGU2:" + base64(UTF-8 JSON {f:'SGU2',v,sum,d})`. İçe aktarma güvenilmeyen girdi sayılır: ≤2 MB, base64 doğrulaması, sağlama, sürüm (daha yenisi reddedilir), **strict** doğrulama (bilinen alanlar, aralık sıkıştırma, `__proto__/constructor/prototype` anahtarları atılır, id deseni, ad temizliği, galaksiler tohumdan yeniden üretilir, dizi/harita sınırları). Aynı id varsa yeni id verilir. İçe aktarılan evren aktif yapılmaz (`open(id)` ile açılır). Modüller ek state alanı saklayacaksa `SG.S.registerStateKey('ad')` çağırmalıdır (aksi halde yalnız içe aktarmada atılır; kendi kayıtlarında korunur).
Sınır: kullanıcı başına 24 evren. Arayüz ad/metinleri `textContent` ile göstermelidir.

## Göç
`migrate(u,target)`: v→v+1 basamakları `MIG` tablosunda (v1→v2 gerçek, v2→v3 örnek iskelet). Daha yeni sürüm reddedilir. Şema yükseltince: `SCHEMA` sabitini artır, `MIG[eski]` ekle, selftest'e durum ekle.

## Test
`tests/run-selftest.sh` → 70 durum (bozuk veri, kota, depolamasız, saldırı girdileri, iki sekme, kullanıcı değişimi, autosave, yedek halkası, göç). Çıktı: `PASS 70/70`.
