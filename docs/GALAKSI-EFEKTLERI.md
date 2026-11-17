# Galaksi efektleri (v1.0.2) — direktör notu

Kapsam: yalnız galaksi görünümü (`SG.W.galaxy`, `src/31-world.js`). Tıklama hedefleri, kart ve seçim davranışı değişmedi.

## Tasarım
- **Kuyruklu yıldız** (rastgele nadir, 22-32 sn'de bir geçiş): parlak çekirdek + mavi iyon kuyruğu (düz, yıldızın tersine) + sarı-beyaz toz kuyruğu (yörünge geri yönüne kıvrık). Yol: eğrisel (ikinci derece Bézier), merkez yıldıza 0,3-0,5 menzil yarıçapı kadar yaklaşır, yani gezegen kuşağından geçer. Yıldıza yaklaştıkça kuyruk uzar ve parlar.
- **Alevli meteor** (2-6 sn'de bir): rastgele bir gezegenin 1,5-2,8 yarıçap yanından hızlı geçer (1,1-1,8 sn). Turuncu-kırmızı çekirdek, ateş-kıvılcım-duman izi.
- **Buz devleri**: tohumdan gelen 3 dekoratif buz devi (tıklanmaz), ince halkalı olabilir, donuk hale ve dört uçlu buz kristali parıltısı. Türü `buzdev`/`buz` olan gerçek düğümlere de aynı parıltı eklenir. Kuyruklu yıldız veya meteor yakın geçerse parıltı patlar ve söner (1 sn).

## Kalite kademeleri (v.q)
| q | kuyruklu yıldız | meteor | buz devleri |
|---|---|---|---|
| 0 | 1 adet, yalnız iyon kuyruğu | çekirdek + alev kuyruğu, parçacık yok | yok |
| 1 | 1 adet, iyon + toz | + kıvılcım | 1 dekoratif + düğüm parıltısı |
| 2-3 | 2 adet, buz kıvılcımı | 2 eşzamanlı, kıvılcım + ateş + duman | 3 dekoratif + düğüm halesi |

## Teknik
- Tohumlu rastgelelik: plan (`SG.rng`, `bgSeed`), parçacık titreşimi hızlı xorshift. Zaman `tt`'den, çerçeve hızından bağımsız.
- Havuz: 240 parçacıklık Float32Array, kare başına ayırma yok. Kuyruk ve hale sprite'ları önbellekli (`sprs`).
- Duraklatma: çizim döngüsü `SG.loop` ile durduğunda efekt de durur (`tt` ilerlemez).
- Kanca gerekmez.
