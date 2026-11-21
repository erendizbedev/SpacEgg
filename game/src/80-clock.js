/* SpacEgg v3 — saat (SG.Clock), ayarlar (SG.TUNE), ortak yardımcılar (SG.K)
   Date.now yalnız bu dosyada. Hiçbir süre/eşik başka dosyada sabit yazılmaz: hepsi SG.TUNE. */
(function(){
'use strict';
var SG=window.SG=window.SG||{};

/* ---------- yardımcılar (SG.rng yoksa kendi mulberry32) ---------- */
function hash(s){s=String(s);var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function rng(seed){var a=(typeof seed==='number'?seed:hash(seed))>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
if(!SG.hash)SG.hash=hash;
if(!SG.rng)SG.rng=rng;
var K=SG.K={
  clamp:function(v,a,b){return v<a?a:v>b?b:v;},
  hash:function(s){return (SG.hash||hash)(s);},
  rng:function(s){return (SG.rng||rng)(s);},
  copy:function(o){return JSON.parse(JSON.stringify(o));},
  H:3600000,
  hours:function(ms){return ms/3600000;},
  civ:function(s){return SG.Civ.get(s.civ);},
  mul:function(s,k){var c=SG.Civ.get(s.civ);var v=c&&c.mul&&c.mul[k];return typeof v==='number'?v:1;}
};

/* ---------- TUNE: tek ayar nesnesi ---------- */
var T=SG.TUNE={
  ver:'3.0',
  /* sözleşme süreleri (Doktor'un kararları) */
  prepMin:60,          // Katıl: saldırıya hazırlık, gerçek dakika
  pollH:12,            // yoklama penceresi (joinBy = offerAt + 12 sa)
  rivalKillH:6,        // yenilen rakip gezegen yok oluş geri sayımı
  shipRoundMin:90,     // lojistik gemi gidiş-dönüş (45+45)
  loseStreak:3,        // üst üste yenilgi eşiği
  selfKillH:24,        // kendi gezegen yok oluş geri sayımı
  offlineCapH:10,      // çevrimdışı birikim tavanı
  edgeMax:1.25,        // sınıf avantajı saldırıya en çok
  edgeClass:1.12,      // yalnız sınıf döngüsü avantajı (çifte özel liste yoksa)
  band:{lo:0.6,hi:1.5},// rakip gücü / oyuncu savunması bandı
  variance:0.12,       // savaş sonucu ±%12
  /* kaynaklar */
  res:['food','stone','metal','energy','know','credit'],
  resAd:{food:'Gıda',stone:'Taş',metal:'Metal',energy:'Enerji',know:'Bilgi',credit:'Kredi'},
  start:{food:400,stone:400,metal:150,energy:60,know:30,credit:250},
  slots:14, builders:2, refund:0.8,
  pop:{base:40,hall:20,house:30}, foodPerPop:0.06, starveMul:0.5,
  capBase:2000, capHall:300, capDepot:[0,1500,3200,5200,7500,10500],
  protect:0.4,          // depo kapasitesinin %40'ı yağmada alınamaz
  mainBonus:1.15,       // ana kaynakta medeniyet bonusu
  lvMul:[0,1,1.9,3.1,4.7,6.8],
  maxLv:5,
  time:{base:150,growth:3.4},   // sn: seviye 1 ≈ 2,5-3,5 dk, seviye 5 ≈ 5,6-7,8 sa
  costGrowth:2.0, knowFrom:3, knowBase:15,
  collect:{min:10,cooldownMin:30},
  /* bina tablosu: cost = temel maliyet (seviye 1), tm = süre çarpanı, prod = saatlik temel üretim, max = en çok adet */
  bld:{
    hall:{ad:'Merkez',acik:'Gezegenin kalbi. Seviyesi diğer yapıların üst sınırını belirler; kredi ve nüfus verir.',cost:{food:100,stone:150,metal:40},tm:1.4,max:1,prod:{credit:10}},
    farm:{ad:'Tarla',acik:'Gıda üretir; halkın doyması için gerekir.',cost:{food:30,stone:50},tm:1,max:3,prod:{food:60}},
    mine:{ad:'Maden',acik:'Metal üretir; gelişmiş birlikler ve yapılar için gerekir.',cost:{food:60,stone:60},tm:1.1,max:2,prod:{metal:30}},
    quarry:{ad:'Taş Ocağı',acik:'Taş üretir.',cost:{food:40,stone:20},tm:1,max:2,prod:{stone:40}},
    power:{ad:'Jeneratör',acik:'Enerji üretir; kalkan ve ileri birlikler enerji harcar.',cost:{stone:80,metal:60},tm:1.2,max:2,prod:{energy:20}},
    lab:{ad:'Laboratuvar',acik:'Bilgi üretir.',cost:{stone:100,metal:60,energy:20},tm:1.3,max:1,prod:{know:10}},
    barracks:{ad:'Kışla',acik:'Birlik eğitir; seviyesi yeni birliklerin kilidini açar ve eğitimi hızlandırır.',cost:{food:80,stone:100,metal:40},tm:1.2,max:1,prod:{}},
    wall:{ad:'Sur',acik:'Savunma gücünü artırır.',cost:{stone:150,metal:20},tm:1,max:1,prod:{}},
    port:{ad:'Liman',acik:'Lojistik gemi yönetir, kredi getirir.',cost:{stone:100,metal:50,credit:30},tm:1.1,max:1,prod:{credit:20}},
    depot:{ad:'Depo',acik:'Kaynak kapasitesini artırır; yağmada %40 korunur.',cost:{stone:120,metal:30},tm:1,max:2,prod:{}},
    house:{ad:'Konut',acik:'Nüfus ve birlik sınırını artırır; küçük vergi verir.',cost:{food:40,stone:60},tm:0.9,max:3,prod:{credit:4}}
  },
  bldOrder:['hall','farm','quarry','mine','power','lab','barracks','wall','port','depot','house'],
  /* birimler */
  units:{
    sentinel:{ad:'Nöbetçi',att:2,def:6,cost:{food:25,stone:10},secs:20,req:0},
    spear:{ad:'Mızrakçı',att:5,def:5,cost:{food:30,stone:20},secs:30,req:1},
    archer:{ad:'Okçu',att:7,def:3,cost:{food:25,metal:25},secs:40,req:2},
    cannon:{ad:'Topçu',att:10,def:4,cost:{metal:40,energy:20},secs:70,req:4}
  },
  unitOrder:['sentinel','spear','archer','cannon'],
  troopCap:{base:20,hall:10,house:10,barracks:15}, barracksSpeed:0.08,
  baseDef:30, hallDef:15, wallBonus:0.1,
  sendFrac:0.7,                 // saldırıya/katılıma gönderilen birlik oranı (nöbetçiler hariç)
  /* saldırı türleri (rakip -> oyuncu). lootOnly: yalnız kaynak yağması, bina hasarı yok */
  atkTypes:{
    akin:{ad:'Yoklama Akını',w:3,ratio:0.5,lootOnly:true,dmg:0,loot:0.5,minDay:0},
    hirsiz:{ad:'Hırsız Sürüsü',w:3,ratio:0.8,lootOnly:true,dmg:0,loot:1.3,minDay:1},
    kusat:{ad:'Yörünge Kuşatması',w:2,ratio:1.0,lootOnly:false,dmg:2,loot:0.6,minDay:3},
    golge:{ad:'Gölge Dalgası',w:2,ratio:1.0,lootOnly:false,dmg:1,loot:1.0,minDay:4},
    buyuk:{ad:'Büyük Dalga',w:1,ratio:1.3,lootOnly:false,dmg:3,loot:1.3,minDay:7,gapDays:9},
    yuce:{ad:'Yüce Sınav',w:1,ratio:1.0,lootOnly:true,dmg:0,loot:0,minDay:10,gapDays:12,noLoss:true}
  },
  /* manevralar. def: savunma tarafı; att: oyuncunun kendi saldırısı */
  man:{
    def:{
      yok:{ad:'Yok',def:1,lootMul:1},
      sur:{ad:'Sur arkasına çekil',def:1.2,lootMul:1.1},
      karsi:{ad:'Karşı saldırı',def:0.9,lossAtt:1.3},
      kalkan:{ad:'Kalkan (enerji)',def:1.25,cost:{energy:40}}
    },
    att:{
      duz:{ad:'Düz saldırı',att:1,lossOwn:1,loot:1},
      baskin:{ad:'Baskın',att:1.15,lossOwn:1.2,loot:1},
      kusat:{ad:'Kuşatma',att:0.95,def:0.9,loot:0.7,lossOwn:1},
      yagma:{ad:'Yağma (yalnız kaynak)',att:0.85,loot:1.25,lossOwn:0.8,lootOnly:true}
    }
  },
  lossWin:0.05, lossLose:0.12, lossSlope:0.25, lossMax:0.5,   // savunmacı birlik kaybı
  lootBase:0.03, lootSlope:0.07, lootMax:0.08, lootCredit:0.03, lootRes:3,
  dmgH:3,                       // yıkılan bina yeniden yapılır: geçici hasar süresi
  shieldMin:20,                 // yenilgiden sonra koruma
  rescue:{cost:{energy:120,credit:80},shieldH:6},
  attackCost:{credit:100}, marchMin:20,   // sefer: gidiş süresi (toplam gidiş-dönüş 2x)
  scoutCost:{credit:20}, scoutMin:5,
  yuceReward:{credit:150,know:40},
  joinLoot:0.08, joinAlly:0.6,            // yoklamaya katılım: ganimet oranı, müttefik gücü payı
  /* yapay zekâ rakipler */
  rivalCount:8,
  ai:{p0:[150,300],k:[0.12,0.22],pMax:[700,1500],defK:0.9,stockBase:400,stockPer:25,refMin:24,hurtMul:0.75,errScout:0.15},
  graceH:24,                    // oyuncuya ilk 24 saat saldırı yok
  planWindowH:72, atkPerDay:0.9, pollPerDay:1.4, warnMin:30,
  /* lojistik gemi */
  ship:{count:[0,1,1,2,2,3],cargo:[0,300,500,800,1200,1800],raidFrac:0.03,dyingBonus:1.5,riskBase:0.02,riskMax:0.15,rebuildH:6},
  /* bildirim */
  notify:{max:20,warnKillMin:60,warnJoinMin:60},
  /* kayıt */
  report:{minMin:5},
  save:{backupGapMs:90000,maxBytes:1500000,logMax:200},
  clock:{skewMs:300000,suspectMs:7*86400000},
  maxIter:400000
};

/* ---------- saat ---------- */
var fakeOn=false,fakeMs=0,lastRaw=null,lastN=0,drift=0,sus=false,base=null;
function realWall(){return fakeOn?fakeMs:Date.now();}
function nativeEl(){try{if(typeof SGNative!=='undefined'&&SGNative&&typeof SGNative.elapsed==='function'){var e=Number(SGNative.elapsed());return isFinite(e)?e:null;}}catch(e){}return null;}
function sample(){
  var w=realWall();
  if(fakeOn)return w;
  var el=nativeEl();
  if(el!=null){
    if(!base||el<base.e)base={w:w,e:el};              // ilk örnek ya da yeniden başlatma (elapsed sıfırlandı)
    var exp=base.w+(el-base.e);
    if(Math.abs(w-exp)>T.clock.skewMs){w=exp;sus=true;} // duvar saati elle oynanmış: elapsed güvenilir
    else base={w:w,e:el};
  }
  return w;
}
var Clock=SG.Clock={
  now:function(){
    var w=sample();
    if(lastRaw!=null){
      if(w<lastRaw)drift+=lastRaw-w;                    // geri sıçrama: süre drift olur, zaman geri akmaz
      else if(w-lastRaw>T.clock.suspectMs)sus=true;     // tek sıçramada 7 günden fazla ileri
    }
    lastRaw=w;
    var n=w+drift;if(n<lastN)n=lastN;lastN=n;return n;
  },
  fake:function(ms){if(!fakeOn){fakeOn=true;lastRaw=null;lastN=0;drift=0;sus=false;}fakeMs=ms;return Clock;},
  advance:function(ms){if(!fakeOn)Clock.fake(Clock.now());fakeMs+=ms;return Clock;},
  real:function(){fakeOn=false;lastRaw=null;lastN=0;drift=0;sus=false;base=null;return Clock;},
  isFake:function(){return fakeOn;},
  drift:function(){return drift;},
  suspicious:function(){return sus;},
  clearSuspicion:function(){sus=false;},
  /* kayıttaki durum zamanı şimdiden ilerideyse (saat geri alınmış) güvenli şimdiyi döndürür */
  guard:function(s,now){return (s&&typeof s.at==='number'&&now<s.at)?s.at:now;}
};
})();
