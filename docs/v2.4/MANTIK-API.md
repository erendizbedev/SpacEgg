# SpacEgg Mantık API (80-89) — arayüz ajanı için

Kaynak: `/home/claude/app/src/80-clock.js … 89-notify.js`. Hepsi DOM'suz, ES5, `window.SG` altında. Testler: `cd /home/claude/app && node tests/unit/run.js`. Zaman damgaları her yerde **ms (epoch)**; süreler gerçek dünya süresi, hızlandırma yok. Tüm metinler Türkçe. Hata dönüşü her eylemde `{ok:false, err:'Türkçe metin', missing?:{kaynak:eksik}}`.

## 0. Altın kural (arayüz döngüsü)
```
var s = SG.PS.load(user) || SG.PS.create(user, SG.Clock.now());   // kullanıcı anahtarı = oturumdaki kullanıcı adı
SG.PS.open(s, SG.Clock.now());      // uygulama açılışı / öne gelme: çevrimdışı çözümü + "Sen yokken" raporu
SG.Ev.drain(s).forEach(gösterPopup); // sırayla göster (ilk eleman 'rapor:yokken' olabilir)
// her ~1 sn (ya da kare başına 1 kez, 4 sn'yi geçmeyecek biçimde):
SG.PS.tick(s, SG.Clock.now());      // çevrimiçi ilerletme; tek sıçrama ile birebir aynı sonuç
SG.Ev.drain(s) -> popup'lar
// durum değişince ve sg-pause'da:
SG.PS.save(s); SG.Notify.sync(s);
if (s.dead) { SG.PS.save(s) /*anma listesine yazar*/; ... yumurta seçimi ...; s = SG.PS.newLife(user, SG.Clock.now()); }
```
Eylemler (build, upgrade …) kendi içinde `tick` çağırır; arayüz ayrıca tick atmak zorunda değil. Arayüz **durum nesnesini doğrudan değiştirmez**, yalnız okur.

## 1. SG.Clock (80-clock)
| İmza | Açıklama |
|---|---|
| `Clock.now()` | Güvenilir "şimdi" (ms). Duvar saati geri alınırsa zaman geri akmaz (`drift` birikir); Android'de `SGNative.elapsed()` ile ileri hile düzeltilir. `Date.now` yalnız burada. |
| `Clock.fake(ms)`, `Clock.advance(ms)`, `Clock.real()` | Test/`?clock=fake` için sahte saat. `fake(ms)` ilk çağrıda koruma durumunu sıfırlar; sonraki `fake(düşük)` geri sıçramadır. |
| `Clock.drift()`, `Clock.suspicious()`, `Clock.clearSuspicion()` | Toplam geri sıçrama süresi; tek sıçramada >7 gün ileri ya da elapsed uyuşmazlığı bayrağı. |
| `Clock.guard(s, now)` | `now < s.at` ise `s.at` döner. |

## 2. SG.TUNE (80-clock) — tek ayar nesnesi
Sözleşme süreleri: `prepMin:60, pollH:12, rivalKillH:6, shipRoundMin:90, loseStreak:3, selfKillH:24, offlineCapH:10, edgeMax:1.25, band:{lo:.6,hi:1.5}, variance:.12`. Ayrıca: `res`, `resAd`, `start`, `slots:14`, `builders:2`, `bld{tür:{ad,acik,cost,tm,max,prod}}`, `units`, `atkTypes`, `man{def,att}`, `ship`, `ai`, `notify`, `save`, …  Değiştirmek için yalnız `SG.TUNE.x = …` (denge testleri).

## 3. SG.Civ (84-civ-data)
- `Civ.LIST` (12 kayıt) / `Civ.get(id)`. Kayıt: `{id, ad, cls:'war|log|des|civ|cre', sinif:'Savaşçı|Lojistik|Yıkıcı|Medeniyet|Yaratıcı', pal:{c0,c1,c2,c3,atm}, mul:{…çarpanlar}, main:'food|stone|metal|energy|know|credit', lider:{ad,soz}, yonetim:{ad,ozet}, hayvanlar:[{ad,skill,atk}x3], gemiler:{scout,logi,war}, slogan, para, ix}`.
  `pal`: `c0` en koyu zemin, `c1..c3` MEDENIYETLER-12.md'deki sırayla diğer üç hex, `atm` atmosfer. (Sözleşmeden fark: ek `c0` var.) İdler: kulhan, kirkbicak, lumeren, tuzdalga, cinar, ruzgarguder, buzag, kulluspor, karaoz, sesdokur, ruyag, ipekci.
- `Civ.pick(seed)` tohumlu seçim (12 eşit). `Civ.edge(a,b)` a, b'ye saldırırken çarpan 0,8…1,25 (id ya da kayıt). `Civ.hint(a,b)` → `'guclu'|'denk'|'zayif'`.

## 4. SG.PS (81-planet-state)

### Durum alanları (arayüz okur)
```
s = { v:3, id, user, name /*gezegen adı*/, seed, civ:'lumeren', born, rev, at /*çözüldüğü an*/, seen /*son çevrimiçi*/,
  res:{food,stone,metal,energy,know,credit}  /*ondalıklı; göstermek için Math.floor*/,
  bld:[{slot,type,lv /*0=inşaatta*/,job:'qN'|0,dmgUntil:ms|0,colAt:ms}],      // slot 0..13 (world.slots[i] ile eşle)
  troops:{sentinel,spear,archer,cannon},
  fleet:[{id,state:'idle|out|back|lost',t0,mid,t1,target:rivalId|null}],
  q:[{id,kind:'build|upgrade|train|scout|prep|march',t0,t1,slot?,type?,lv?,unit?,n?,rival?,pend?,man?,cost?}],
  rivals:[8 x {id,slot,civ,name,state:'alive|dying|gone',killAt:ms|null,hurtUntil}],   // dying: gezegen üstünde sayaç = killAt-now
  pend:[{id,kind:'yoklama',offerAt,joinBy,a:rivalId,b:rivalId,state:'open|prep|ready|done|missed|skipped',prepEnd,m}],
  war:{streak,lastDefeatAt,shieldUntil,wins,losses},
  dying:null|{killAt,since},          // kendi gezegen yok oluş geri sayımı (24 sa) -> "Kurtarma" düğmesi
  dead:null|{at,cause}, hallRec,      // dead doluysa gezegen yok oldu: yumurta seçimi aç
  intel:{rivalId:{at,power,band,loot}}, log:[{t,k,x}] /*son 200*/, popq:[] /*Ev.drain ile boşalır*/, stats:{…},
  plan:{cursor,list:[{id,at,kind:'att'|'poll',…}]}, lastReport }
```

### Yaşam döngüsü
| İmza | Dönüş / not |
|---|---|
| `PS.create(userKey, now, opts?)` | Yeni durum. `opts:{seed?, civ?}`; verilmezse tohum `p|kullanıcı|now|yaşamSayısı`, medeniyet rastgele (tohumlu). Hall lv1 (slot 0) + Tarla lv1 (slot 1), `TUNE.start` kaynakları, 8 rakip, miras sıfır. |
| `PS.newLife(userKey, now, opts?)` | Eski kaydı siler (anma listesi kalır) ve `create` çağırır. |
| `PS.resolve(s, until)` | Ana motor (olay çözücü). Doğrudan çağırmak gerekmez. `s.dead` ise etkisiz. |
| `PS.tick(s, now)` / `PS.sync(s,now)` | `resolve` + `seen=now` (çevrimiçi). `now<s.at` ise hiçbir şey yapmaz (saat geri). `sync` uygulanan zamanı döndürür. |
| `PS.open(s, now)` | Oturum açılışı. Çözer, `seen=now`. Dönüş: "Sen yokken" raporu ya da `null` (<5 dk). |
| `PS.report(s)` | Son rapor: `{from,to,awayMs,capped /*10 sa tavanı aşıldı*/,lines:[{t,kind,text}],gained:{res:delta},shown}`. `Ev.drain` bunu bir kez `rapor:yokken` popup'ı yapar. |
| `PS.nextEvents(s, horizonMs?)` | Sıralı gelecek olaylar `[{t,kind:'job|ship|repair|att|poll|pend|rkill|skill|full',sub?,id,warnAt?}]` (varsayılan 72 sa). |
| `PS.summary(s)` | Arayüz için hazır özet: `{at,name,civ,res,rates,cap,pop,troops,troopCap,troopCount,def,att,war,dying,dead,uyku,capEnd,fullAt,rivals[{…AI.info,intel}],fleet,q,pend,slots}`. |
| `PS.log(s,t,kind,text)` | Günlük satırı (içeriden kullanılır). |

### Eylemler — hepsi `now` (ms) alır, `{ok:true,…}` ya da `{ok:false,err}` döner
| İmza | Başarı alanları / kurallar |
|---|---|
| `PS.build(s, slotIdx, type, now)` | `{qid,t1,cost}`. Türler: hall(yapılamaz, hazır), farm, mine, quarry, power, lab, barracks, wall, port, depot, house. Kuyruk en çok 2 (`TUNE.builders`) yapı/yükseltme. Tür başına en çok adet `TUNE.bld[tür].max`. |
| `PS.upgrade(s, slotIdx, now)` | `{qid,t1,cost,lv}`. Kural: yeni seviye ≤ Merkez+1 (Merkez ≤5), hasarlıyken olmaz. |
| `PS.cancel(s, qid, now)` | build/upgrade/train/scout iptal; bedelin %80'i iade. `{refund}` |
| `PS.train(s, unit, n, now)` | unit: sentinel, spear(Kışla1), archer(Kışla2), cannon(Kışla4; İpekçi eğitemez). Zincirli sıra; `{qid,t1,cost}`. Birlik sınırı `Bld.troopCap(s)`. |
| `PS.collect(s, slotIdx, now)` | Toplama dokunuşu: 10 dk'lık üretim, yapı başına 30 dk bekleme. `{gained:{res:n},nextAt}`; erken ise `{ok:false,err,nextAt}`. |
| `PS.decide(s, pendId, 'join'|'skip'|'confirm', now)` | join: saldıracak birlik (nöbetçi hariç) gerek; hazırlık 60 dk (Çınar 75) → `{state:'prep',prepEnd,qid}`; skip bedelsiz; confirm yalnız `ready` iken ve `joinBy`'dan önce: `{state:'done',won,loot,lossTroops,killAt?,popup}`. |
| `PS.scout(s, rivalId, now)` | 5 dk izci, 20 Kredi; sonuç `rapor:izci` popup'ı ve `s.intel`. |
| `PS.attack(s, rivalId, maneuver, now)` | maneuver: `duz|baskin|kusat|yagma`. 100 Kredi, birliklerin %70'i (nöbetçi hariç) gider, 2x20 dk (Çınar +%25) sonra döner. `yagma` rakibi öldürmez; diğerleri kazanırsa rakip 6 sa yok oluş sayacına girer. `{qid,t1,sent}` |
| `PS.sendShip(s, rivalId|null, now)` | null = ticaret rotası, rivalId = yağma seferi. Liman gerekir. `{shipId,mid,t1}`; 90 dk (Rüzgârgüder 60). Kargo depoyu aşmaz, fazlası kaybolur (popup `lost`). |
| `PS.rescue(s, now)` | `s.dying` varken: 120 Enerji + 80 Kredi → geri sayım iptal, seri sıfır, 6 sa kalkan, yapılar onarılır. |
| `PS.maneuver(s, attackIdOrPendId, m, now?)` | Saldırı kimliği (`plan.list` içindeki `att` olayı, `nextEvents`'te `kind:'att'`, `warnAt` = saldırıdan 30 dk önce): m = `yok|sur|karsi|kalkan` (kalkan 40 Enerji, değişince iade). Yoklama kimliği: m = `duz|baskin|kusat|yagma` (onay saldırısı için). |

### Kayıt (anahtar `sg3_<enc(kullanıcı)>_` ; enc 07-save ile aynı)
| İmza | Not |
|---|---|
| `PS.save(s)` | `p` anahtarına zarf `{f:1,v:3,sum,saved,d}`; 90 sn'de bir döngüsel 3 yedek `b0..b2`. `true` = kalıcı, `false` = bellekte (localStorage yok/dolu; hata fırlatmaz). `s.dead` ise anma kaydını `…hall`'a yazar. |
| `PS.load(userKey)` | Durum ya da `null`. Bozuksa yedekten döner: `PS.lastLoad={recovered,from:'p'|'b1'|…|null,corrupt}`. |
| `PS.clear(userKey)` | `p` ve yedekleri siler (anma ve ayar kalır). |
| `PS.hall(userKey)` | Anma listesi `[{name,civ,civAd,born,died,lifeMs,hallLv,cause,wins,losses}]`. `PS.hallAdd` içeriden. |
| `PS.settings(userKey)`, `PS.setSettings(userKey,obj)` | `…set` anahtarı (bildirim tercihi vb.). |
| `PS.norm(s)` | Doğrulama/tamamlama (load kullanır). |

## 5. Sorgular
- `SG.Eco.rates(s)` → `{food,stone,metal,energy,know,credit}` net saatlik (`+/sa`); çevrimdışı tavan sonrası sıfır. `Eco.cap(s)`, `Eco.pop(s)`, `Eco.fullAt(s)` → `{res: ms|null}`, `Eco.capEnd(s)` (üretimin duracağı an), `Eco.uyku(s)`, `Eco.capH(s)`, `Eco.starving(s,t)`.
- `SG.Bld.TYPES[tür]` → `{id,ad,acik,max,cost(lv),secs(lv),uretim(lv)}`. `Bld.cost(tür,lv)`, `Bld.secs(tür,lv)` (sn, medeniyet çarpansız); `Bld.costFor(s,tür,lv)`, `Bld.secsFor(s,tür,lv)` (medeniyet çarpanlı, **arayüz bunları göstermeli**); `Bld.canAfford(s,cost)`, `Bld.missing(s,cost)`; `Bld.canBuild(s,slot,tür)` / `Bld.canUpgrade(s,slot)` → `{ok,err,cost,secs,missing}` (düğme etkin/pasif ve bedel için); `Bld.list(s)` → 14 elemanlı `[{slot,type|null,lv,damaged,dmgUntil,job:{id,kind,t0,t1,progress}|null,colAt}]`; `Bld.get(s,slot)`, `Bld.hallLv(s)`, `Bld.maxLv(s,tür)`, `Bld.troopCap(s)`, `Bld.troopCount(s,withQueue)`, `Bld.unitOk(s,unit)`, `Bld.unitCost(s,unit,n)`, `Bld.unitSecs(s,unit,n)`.
- `SG.War.defPower(s,t?)`, `War.attPower(s)`, `War.sendable(s)` (gönderilecek birlikler ya da null), `War.wallFrac`. `War.resolve(att,def,seed)` saf: `att:{power,civ,type,man,noCiv}`, `def:{power,civ,man,wall,res,prot,slots,noCiv}` → `{winner:'att'|'def',ratio,A,D,lossA,lossD,loot,dmg:[slot],edge,log:[]}`.
- `SG.AI.info(r)` → `{id,ad,civ,civAd,sinif,state,killAt,lider,pal}`; `AI.band(s,r,t)` → `'zayif'|'denk'|'guclu'`; `AI.power(s,r,t)`; `Civ.hint`.
- `SG.Log.list(s)` → gemiler `[{id,state,t0,mid,t1,target,progress}]`; `Log.cargoCap(s)`, `Log.roundMs(s)`.
- `SG.Ev.openPend(s)` açık yoklamalar.

## 6. SG.Ev.drain(s) — popup şemaları (`kind` alanı ile)
Dönüş: dizi, **en eskisi önce**; çağrı kuyruğu boşaltır. Eylem gerektiren yoklama popup'ı bayatladıysa (pencere kapandı/durum değişti) kendiliğinden düşer. Her popup'ta `id`, `t` (ms).

1. **`{kind:'yoklama', phase:'teklif'|'hazir'|'kacirildi', pendId, from:Rival, target:Rival, power:{from,target,band:'zayif|denk|guclu'}, edge, joinBy, prepEnd, prepMin, canJoin, choices:['join','skip'] | ['confirm','skip'] | []}`**
   `teklif`: Katıl/Geç düğmeleri (`PS.decide(s,pendId,'join'|'skip',now)`), geri sayım `joinBy-now` (12 sa). `hazir`: "Saldırıyı onayla" (`'confirm'`) / Geç. `kacirildi`: hazırlanıp onaylanmayan fırsat (bilgi). `canJoin:false` ise Katıl pasif (saldıracak birlik yok).
2. **`{kind:'rapor', tur:'yokken', from, to, awayMs, capped, lines:[string], gained:{res:delta}}`** "Sen yokken" özeti (`capped:true` ise "birikim 10 saatte durdu" notu göster).
3. **`{kind:'rapor', tur:'savas', type, tip /*saldırı türü adı*/, from:Rival, result:'kazandin'|'kaybettin'|'engellendi', ratio, lossTroops:{unit:n}, lootLost:{res:n}, damaged:[slot], streak, lines:[string]}`** rakibin sana saldırısı.
4. **`{kind:'rapor', tur:'sefer', result:'kazandin'|'kaybettin'|'iptal', rival:Rival, ratio, loot:{res:n}, lootWasted:{res:n}, lossTroops, killAt:ms|null, lines}`** kendi seferin.
5. **`{kind:'rapor', tur:'katil', result, ally:Rival, rival:Rival, ratio, loot, lossTroops, killAt|null, lines}`** onaylanan ortak saldırı.
6. **`{kind:'rapor', tur:'izci', ok:bool, rival:Rival, power, band, edge, hint, loot, lines}`** keşif.
7. **`{kind:'gemi', shipId, result:'dondu'|'kayip', gained:{res:n}, lost:{res:n} /*depo doldu, kayboldu*/, shipLost:bool, target?, rebuildAt?}`**
8. **`{kind:'yokolus', who:'rival', rival:Rival}`** rakip gezegen yok oldu (yerine yenisi doğdu). **`{kind:'yokolus', who:'self', planet:{name,civ,civAd}, life:{name,civ,born,died,lifeMs,hallLv,…}, newEgg:true}`** kendi gezegenin yok oldu: anma ekranı + yumurta seçimi (`PS.save(s)` sonra `PS.newLife`).
9. **`{kind:'kaybet', streak, killAt, hoursLeft:24, rescueCost:{energy,credit}, from:Rival}`** 3. yenilgi: gezegen üstünde geri sayım + "Kurtarma" düğmesi (`PS.rescue`). Savunma kazanırsa `s.dying` kendiliğinden `null` olur.

`Rival = SG.AI.info(r)`. Gezegen üstü sayaçlar: rakip `state==='dying'` → `killAt-now`; kendi `s.dying.killAt-now`.

## 7. SG.Notify (89-notify)
- `Notify.sync(s)` → `{alarms:[{id,at,tur,title,text}],scheduled,cancelled,bridge}`. Alarm listesini kuyruk/gemi/yoklama/yok oluş/saldırı uyarısından üretir (en erken 20, **sessiz saat yok**, metinde kullanıcı verisi yok). `SGNative` varsa yalnız değişenleri `schedule(id,atMs,title,text)`/`cancel(id)` ile iletir; yoksa no-op (liste yine döner).
- `Notify.setPrefs({build:0,…})` tür kapama: build, train, ship, yoklama, saldiri, yokolus, sefer. `Notify.prefs`, `schedule/cancel/cancelAll` ince sarmalayıcılar.
- Çağrı yeri: her durum değişikliği ve `sg-pause`.

## 8. Sözleşmeden sapmalar / eklemeler (dürüst liste)
- `PS.maneuver` dördüncü isteğe bağlı `now` alır. `PS.tick/sync/open/summary/newLife/norm/settings/hall` eklendi.
- `Civ.LIST[i].pal` içinde ek `c0`.
- Savaşta tür adı `akin` = "Yoklama Akını" (saldırı türü), yoklama OLAYI (`yoklama`) ile karışmasın diye.
- Çevrimdışı 10 sa tavanı: üretim `seen + 10 sa` sonrası durur (Buzağ 12 sa); olaylar (saldırı, kuyruk, gemi) tavandan bağımsız çözülür. Çevrimiçi `tick` her çağrıda `seen`'i ilerletir.
- Mevcut `SG.S` (07-save) kullanılmaz; `enc` ve sağlama biçimi aynı (kendi kopyası: `SG.S._test.sum` ile birebir uyumlu).
