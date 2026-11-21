/* SpacEgg v3 — 12 medeniyet (SG.Civ). Kaynak: MEDENIYETLER-12.md. Veri değişmez, sıra bağımlılığı yok. */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var CLASSES={war:'Savaşçı',log:'Lojistik',des:'Yıkıcı',civ:'Medeniyet',cre:'Yaratıcı'};
var BEATS={war:'log',log:'des',des:'civ',civ:'cre',cre:'war'};   // beşgen döngü
function C(id,ad,cls,hex,atm,mul,main,leader,gov,animals,ships,slogan,para){
  return {id:id,ad:ad,cls:cls,sinif:CLASSES[cls],pal:{c0:hex[0],c1:hex[1],c2:hex[2],c3:hex[3],atm:atm},mul:mul,main:main,
    lider:leader,yonetim:gov,hayvanlar:animals,gemiler:ships,slogan:slogan,para:para};
}
function A(ad,skill,atk){return {ad:ad,skill:skill,atk:atk};}
function Sh(scout,logi,war){return {scout:scout,logi:logi,war:war};}
var LIST=[
 C('kulhan','Külhan Kabilesi','war',['#1A1210','#E8452C','#FF9A3C','#5C2A1E'],'#8A2F1B',
   {atk:1.10,trainTime:0.8,loot:1.15,credit:0.9,stone:1.08},'metal',
   {ad:'Hatun Orgkara',soz:'Önce kapıyı yakarız, sonra adımızı söyleriz.'},
   {ad:'Savaş Ocağı',ozet:'Birlik eğitim süresi -%20, saldırı +%10; ganimet +%15, barış geliri -%10.'},
   [A('Magma Boğası',4,8),A('Kül Akbabası',7,4),A('Cüruf Kertenkelesi',5,6)],
   Sh('Kıvılcım Okçusu','Cüruf Mavnası','Kaldera Kruvazörü'),'Ateş soru sormaz.','Kor'),
 C('kirkbicak','Kırkbıçak Sürüsü','war',['#2B2410','#C9A227','#8DB600','#E8DCA0'],'#C9A94A',
   {trainCost:0.75,def:0.9},'food',
   {ad:'Kraliçe Sekiz-Yüz',soz:'Biz sayılmayız, biz çoğalırız.'},
   {ad:'Kovan Düzeni',ozet:'Birlik maliyeti -%25 ama savunma -%10.'},
   [A('Orak Böceği',6,7),A('Toz Akrebi',8,5),A('Kum Yılanı',3,8)],
   Sh('Sinek','Taşıyıcı Kovan','Orak Kovanı'),'Biri düşer, kırk çıkar.','Reçine'),
 C('lumeren','Lumeren Bilgeleri','civ',['#0B1F3A','#3DDCFF','#A5F2D0','#F4FBFF'],'#2E8FA8',
   {know:1.2,trainTime:1.15},'know',
   {ad:'Arif Ilmenu',soz:'Bilmek, kılıçtan keskin kınından çıkarılır.'},
   {ad:'Bilgelik Meclisi',ozet:'Bilgi +%20; birlik eğitimi %15 yavaş.'},
   [A('Parıltı Geyiği',6,3),A('Fener Balığı Sürüsü',8,2),A('Cam Örümcek',5,6)],
   Sh('Kandil','Prizma Taşıyıcı','Işık Kemanı'),'Karanlıkta öğrenen, ışığı bulur.','Lumen'),
 C('tuzdalga','Tuzdalga Konfederasyonu','civ',['#06314D','#1FA9C9','#F0E3B2','#E5F6FF'],'#1B6E99',
   {credit:1.15,def:0.9,atk:0.9,depot:1.2},'credit',
   {ad:'Amiral-Tüccar Neriya',soz:'Savaşı batırın, mal akın.'},
   {ad:'Ticaret Konfederasyonu',ozet:'Kredi getirisi +%15, depo +%20; sur ve birlik gücü -%10.'},
   [A('Gelgit Mantası',7,4),A('Tuz Ahtapotu',8,5),A('Kabuk Zırhlı Yengeç',3,7)],
   Sh('Martı','Kocabaş','Okyanus Şahı'),'Her kıyı bir pazar.','Cevher Sikkesi'),
 C('cinar','Çınar Konseyi','civ',['#14301C','#4FAE5E','#D9B26A','#EAF7E1'],'#2F7A47',
   {def:1.15,food:1.10,prep:1.25,buildCost:0.95},'food',
   {ad:'Büyük Kök Elmaş',soz:'Acele eden meyveyi yer, bekleyen ormanı.'},
   {ad:'Kök Konseyi',ozet:'Savunma +%15, gıda +%10; saldırı hazırlığı %25 uzun.'},
   [A('Gövde Ayısı',4,8),A('Dal Maymunu',7,3),A('Yaprak Kuşu',8,2)],
   Sh('Tohum Kapsülü','Dal Gemisi','Kök Kalesi'),'Kök bilir.','Palamut'),
 C('ruzgarguder','Rüzgârgüder','log',['#1E2A44','#F2C14E','#E8E4D0','#7FB8E3'],'#D9A441',
   {shipTime:2/3,depot:0.8},'energy',
   {ad:'Kervan Başı Aylın-Ser',soz:'Yol kapanmaz, yeni yol açılır.'},
   {ad:'Göçebe Birliği',ozet:'Gemi gidiş-dönüşü 1 saat (%30+ hız); depo -%20.'},
   [A('Rüzgâr Atı',7,4),A('Çöl Kartalı',8,5),A('Yük Devesi',4,2)],
   Sh('Süzülen','Bulutkervan','Fırtına Mızrağı'),'Durmayan kaybetmez.','Kervan Kuruşu'),
 C('buzag','Buzağ Ağı','log',['#0E2230','#8FD3E8','#F2FAFF','#3D6A8C'],'#9FD4E6',
   {offlineCap:1.2,food:0.9,scoutHide:0.7},'food',
   {ad:'Tünelbaşı Mirko-Taş',soz:'Üstte fırtına, altta bizim yolumuz.'},
   {ad:'Yer Altı Ağı',ozet:'Çevrimdışı birikim +%20; dış keşif başarısı -%30; gıda -%10.'},
   [A('Tünel Köstebeği',8,3),A('Kutup Tilkisi',6,5),A('Buz Mamudu',2,9)],
   Sh('Buz Kıvılcımı','Tünel Kızağı','Buzkıran'),'Altta herkes birbirine bağlı.','Buz Kuruşu'),
 C('kulluspor','Küllüspor','des',['#1A1F10','#7FA32A','#C4E04A','#5B3A5E'],'#8C9A3A',
   {siege:1.2,wallBreak:1.25,loot:1.2,credit:0.85},'stone',
   {ad:'Çürük Ana Vessa',soz:'Her şey bir gün bana döner.'},
   {ad:'Çürüme Düzeni',ozet:'Kuşatma +%20, sur yıkma +%25, ganimet +%20; barış geliri -%15.'},
   [A('Spor Böceği',5,7),A('Küf Sivrisineği',8,3),A('Asit Kurbağası',4,8)],
   Sh('Spor Tohumu','Çürük Kozası','Veba Kalesi'),'Her sur çürür.','Humus'),
 C('karaoz','Karaöz Tarikatı','des',['#05050A','#3B1E6B','#B13BFF','#0F0F1E'],'#241447',
   {shadow:1.2,wallBreak:1.15,energy:0.99,food:0.9,stone:0.9,metal:0.9,know:0.9,credit:0.9},'energy',
   {ad:'Çöküş Efendisi Voth',soz:'Düşmek bir seçenek değil, yasa.'},
   {ad:'Karanlık Tarikat',ozet:'Gölge Dalgası +%20, sur yıkma +%15; üretim -%10 (enerji +%10).'},
   [A('Gölge Kurdu',7,6),A('Ağır Kuş',5,7),A('Boşluk Tırtılı',8,3)],
   Sh('Gölge İğnesi','Boşluk Mavnası','Kara Delik Gemisi'),'Ağırlık kader.','Zerre'),
 C('sesdokur','Sesdokur Topluluğu','cre',['#2A1B4D','#FF5CA8','#5CE1E6','#FFF3A8'],'#8E4DB5',
   {buildTime:0.85,energy:1.10,def:0.9},'energy',
   {ad:'Maestro Ilya-Sen',soz:'Dinle, kale çalıyor.'},
   {ad:'Armoni Sanatı',ozet:'Yapı yükseltme hızı +%15, enerji +%10; savunma -%10.'},
   [A('Kristal Kuş',7,3),A('Yankı Yarasası',8,4),A('Gong Gergedanı',3,8)],
   Sh('Çınlama','Org Taşıyıcı','Senfoni Kalesi'),'Her yapı bir şarkıdır.','Nota'),
 C('ruyag','Rüyağ Sürüsü','cre',['#0B2B30','#2EC4B6','#B388FF','#E8FFF8'],'#3A8E9C',
   {know:1.1,def:0.9,fake:2},'know',
   {ad:'Rüya Dokuyucu Nyra',soz:'Sen gördüğüne inanıyorsun; ben ona karar veririm.'},
   {ad:'Hayal Birliği',ozet:'Keşifte birlikler 2 kat görünür; gerçek savunma -%10, bilgi +%10.'},
   [A('Hayal Kelebeği',8,2),A('Sis Kurbağası',5,5),A('Rüya Ahtapotu',7,6)],
   Sh('Düş Fenerleri','Sis Kervanı','Aynalı Hayal'),'Gerçek bir seçenektir.','Düş'),
 C('ipekci','İpekçi Kovan','cre',['#3A1F2B','#F2A65A','#E8D5B5','#C94F7C'],'#D98A5F',
   {buildCost:0.88,noUnits:['cannon']},'credit',
   {ad:'Ana Dokucu Selva',soz:'Her ip bir karar; her düğüm bir söz.'},
   {ad:'Dokuma Birliği',ozet:'Yapı bedeli -%12; ağır birlik (Topçu) eğitimi yok.'},
   [A('İpek Kurdu',6,2),A('Örümcek Muhafız',5,7),A('Bal Arısı',8,4)],
   Sh('İp Atlayan','Koza Taşıyıcı','Ağ Kalesi'),'Ağ ören yön verir.','İpek')
];
var BY={};LIST.forEach(function(c,i){c.ix=i;BY[c.id]=c;});
/* özel güçlü/zayıf listeleri (tablodan) */
var STRONG={kulhan:['ruzgarguder','buzag'],kirkbicak:['buzag','ipekci'],lumeren:['sesdokur','ruyag'],tuzdalga:['ipekci','sesdokur'],cinar:['ruyag','ipekci'],
  ruzgarguder:['kulluspor','karaoz'],buzag:['kulluspor','cinar'],kulluspor:['lumeren','tuzdalga'],karaoz:['cinar','lumeren'],sesdokur:['kulhan','kirkbicak'],
  ruyag:['kulhan','kirkbicak'],ipekci:['lumeren','cinar']};
var WEAK={kulhan:['ruyag','sesdokur'],kirkbicak:['sesdokur','ruyag'],lumeren:['kulluspor','karaoz'],tuzdalga:['kulluspor','kulhan'],cinar:['karaoz','kulluspor'],
  ruzgarguder:['kulhan','kirkbicak'],buzag:['kirkbicak','kulhan'],kulluspor:['ruzgarguder','buzag'],karaoz:['ruzgarguder','tuzdalga'],sesdokur:['lumeren','tuzdalga'],
  ruyag:['lumeren','cinar'],ipekci:['tuzdalga','kirkbicak']};
function idOf(x){return typeof x==='string'?x:(x&&x.id);}
var Civ=SG.Civ={
  LIST:LIST,CLASSES:CLASSES,BEATS:BEATS,STRONG:STRONG,WEAK:WEAK,
  get:function(id){return BY[idOf(id)]||null;},
  /* tohumlu rastgele seçim: 12 medeniyet eşit olasılık */
  pick:function(seed){var r=SG.K.rng('civ|'+seed);return LIST[Math.floor(r()*LIST.length)];},
  /* a, b'ye saldırırken saldırı gücü çarpanı: 0,8 ... 1,25 */
  edge:function(a,b){
    var x=idOf(a),y=idOf(b),T=SG.TUNE,em=T.edgeMax,ca=BY[x],cb=BY[y];
    if(!ca||!cb)return 1;
    if(STRONG[x].indexOf(y)>=0||WEAK[y].indexOf(x)>=0)return em;
    if(WEAK[x].indexOf(y)>=0||STRONG[y].indexOf(x)>=0)return 1/em;
    if(BEATS[ca.cls]===cb.cls)return T.edgeClass;
    if(BEATS[cb.cls]===ca.cls)return 1/T.edgeClass;
    return 1;
  },
  /* keşifte okunacak ipucu */
  hint:function(a,b){var e=Civ.edge(a,b);return e>1.01?'guclu':e<0.99?'zayif':'denk';}
};
})();
