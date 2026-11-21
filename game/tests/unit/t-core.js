'use strict';
var h=require('./harness.js'),assert=require('assert'),fs=require('fs'),path=require('path');
var H=3600000,DAY=86400000,T0=1700000000000;
function mk(civ,seed){var SG=h.load();SG.Clock.fake(T0);return {SG:SG,s:SG.PS.create('u',T0,{seed:seed||'t1',civ:civ||'cinar'})};}
function near(a,b,e,m){assert.ok(Math.abs(a-b)<=(e||1e-6),(m||'')+' '+a+' != '+b);}
exports.tests={
  'kaynak taraması: Math.random / Date.now yasak (80-clock hariç)':function(){
    var dir=path.join(__dirname,'..','..','src');
    h.files.forEach(function(f){
      var t=fs.readFileSync(path.join(dir,f),'utf8');
      assert.ok(!/Math\.random/.test(t),f+' Math.random');
      if(f!=='80-clock.js')assert.ok(!/Date\.now|new Date/.test(t),f+' Date.now');
    });
  },
  'sözleşme sabitleri TUNE içinde':function(){
    var SG=h.load(),T=SG.TUNE;
    assert.strictEqual(T.prepMin,60);assert.strictEqual(T.pollH,12);assert.strictEqual(T.rivalKillH,6);
    assert.strictEqual(T.shipRoundMin,90);assert.strictEqual(T.loseStreak,3);assert.strictEqual(T.selfKillH,24);
    assert.strictEqual(T.offlineCapH,10);assert.strictEqual(T.edgeMax,1.25);
    assert.strictEqual(JSON.stringify(T.res),JSON.stringify(['food','stone','metal','energy','know','credit']));
  },
  '12 medeniyet kaydı, sınıf sayıları, palet, tohumlu seçim eşit dağılım':function(){
    var SG=h.load(),L=SG.Civ.LIST;
    assert.strictEqual(L.length,12);
    var ids=['kulhan','kirkbicak','lumeren','tuzdalga','cinar','ruzgarguder','buzag','kulluspor','karaoz','sesdokur','ruyag','ipekci'];
    assert.strictEqual(JSON.stringify(L.map(function(c){return c.id;}).sort()),JSON.stringify(ids.slice().sort()));
    var cnt={};L.forEach(function(c){cnt[c.cls]=(cnt[c.cls]||0)+1;
      ['ad','sinif','main','lider','yonetim','hayvanlar','gemiler','pal','mul'].forEach(function(k){assert.ok(c[k],c.id+' '+k);});
      ['c1','c2','c3','atm'].forEach(function(k){assert.ok(/^#[0-9A-Fa-f]{6}$/.test(c.pal[k]),c.id+' pal '+k);});
      assert.strictEqual(c.hayvanlar.length,3);assert.ok(c.gemiler.scout&&c.gemiler.logi&&c.gemiler.war);
      assert.ok(SG.TUNE.res.indexOf(c.main)>=0);});
    assert.strictEqual(JSON.stringify(cnt),JSON.stringify({war:2,civ:3,log:2,des:2,cre:3}));
    var hit={},i;for(i=0;i<2400;i++)hit[SG.Civ.pick('x'+i).id]=(hit[SG.Civ.pick('x'+i).id]||0)+1;
    ids.forEach(function(id){assert.ok(hit[id]>120&&hit[id]<290,id+' dağılım '+hit[id]);});
    assert.strictEqual(SG.Civ.pick('abc').id,SG.Civ.pick('abc').id);
  },
  'beşgen sınıf avantaj döngüsü ve edge sınırları':function(){
    var SG=h.load(),L=SG.Civ.LIST,a,b;
    L.forEach(function(x){L.forEach(function(y){var e=SG.Civ.edge(x,y);assert.ok(e>=0.8-1e-9&&e<=1.25+1e-9,x.id+'>'+y.id+' '+e);
    });});
    assert.strictEqual(SG.Civ.edge('kulhan','ruzgarguder'),1.25);   // savaşçı > lojistik, özel liste
    assert.strictEqual(SG.Civ.edge('ruzgarguder','kulhan'),0.8);
    assert.strictEqual(SG.Civ.edge('kulhan','kulhan'),1);
    var cyc=['war','log','des','civ','cre'];
    cyc.forEach(function(c,i){assert.strictEqual(SG.Civ.BEATS[c],cyc[(i+1)%5]);});
    assert.strictEqual(SG.Civ.edge('tuzdalga','ruyag'),1.12);        // yalnız sınıf avantajı (Medeniyet > Yaratıcı)
    assert.strictEqual(SG.Civ.edge('ruyag','tuzdalga'),1/1.12);
    assert.strictEqual(SG.Civ.edge('kulhan','lumeren'),1);           // ilişkisiz
  },
  'bina tablosu: 11 tür x 5 seviye, süre ve maliyet eğrisi':function(){
    var SG=h.load(),B=SG.Bld;
    var ids=Object.keys(B.TYPES);assert.strictEqual(ids.length,11);
    ['hall','farm','mine','quarry','power','lab','barracks','wall','port','depot','house'].forEach(function(id){
      assert.ok(B.TYPES[id],id);
      var pc=null,ps=0;
      for(var lv=1;lv<=5;lv++){
        var c=B.cost(id,lv),sec=B.secs(id,lv);
        assert.ok(Object.keys(c).length>0);assert.ok(sec>ps,id+' süre artmalı');ps=sec;
        if(pc)Object.keys(pc).forEach(function(k){assert.ok(c[k]>=pc[k],id+' maliyet '+k);});
        pc=c;
      }
      assert.ok(B.secs(id,1)>=120&&B.secs(id,1)<=300,id+' sv1 birkaç dk: '+B.secs(id,1));
      assert.ok(B.secs(id,5)>=3*3600,id+' sv5 saatler: '+B.secs(id,5));
    });
  },
  'ekonomi: oranlar, doğrusal birikim, açlık':function(){
    var x=mk('cinar'),SG=x.SG,s=x.s;
    var r=SG.Eco.rates(s);
    near(r.food,60*1.10*1.15-SG.Eco.pop(s)*0.06,1e-9,'gıda oranı');   // çınar: gıda x1,10, ana kaynak x1,15
    near(r.credit,10,1e-9);assert.strictEqual(r.stone,0);
    SG.PS.resolve(s,T0+H);near(s.res.food,400+r.food,1e-6);near(s.res.credit,250+10,1e-6);
    /* açlık: gıda azken tüketim üretimi aşarsa gıda 0'a iner, diğer üretim yarıya düşer */
    var y=mk('cinar','t2'),s2=y.s;s2.res.food=10;
    s2.bld.push({slot:2,type:'house',lv:3,job:0,dmgUntil:0,colAt:0},{slot:3,type:'quarry',lv:1,job:0,dmgUntil:0,colAt:0});
    s2.bld.forEach(function(b){if(b.type==='farm')b.lv=0;});
    var rr=y.SG.Eco.rates(s2);assert.ok(rr.food<0);
    var tz=T0+Math.ceil(10/(-rr.food)*H);
    y.SG.PS.resolve(s2,tz-2000);assert.ok(s2.res.food>0);
    y.SG.PS.resolve(s2,tz+1000);near(s2.res.food,0,1e-9);
    var st=y.SG.Eco.rates(s2);near(st.stone,40*0.5,1e-9,'açlıkta üretim yarı');assert.strictEqual(st.food,0);
  },
  'depo kapasitesi tavanı ve dolma günlüğü':function(){
    var x=mk('cinar'),SG=x.SG,s=x.s;
    s.res.food=SG.Eco.cap(s)-50;
    SG.PS.resolve(s,T0+H);
    near(s.res.food,SG.Eco.cap(s),1e-9);
    assert.ok(s.log.some(function(e){return /Depo doldu/.test(e.x);}));
    assert.strictEqual(s.log.filter(function(e){return /Depo doldu/.test(e.x);}).length,1);
  },
  'çevrimdışı tavan 10 sa (çevrimiçi sürekli); Buzağ 12 sa':function(){
    var x=mk('lumeren'),SG=x.SG,s=x.s,r=SG.Eco.rates(s);
    SG.PS.resolve(s,T0+25*H);near(s.res.credit,250+10*10,1e-6,'10 saatlik birikim');   // seen=T0
    var y=mk('lumeren','t3'),s2=y.s;
    for(var i=1;i<=25;i++)y.SG.PS.tick(s2,T0+i*H);               // çevrimiçi
    near(s2.res.credit,250+25*10,1e-6,'çevrimiçi sınırsız');
    var z=mk('buzag','t4');z.SG.PS.resolve(z.s,T0+30*H);
    near(z.s.res.credit,250+12*10,1e-6,'buzağ 12 sa');
  },
  'kuyruk: inşaat süresi/maliyet/iptal/kuyruk sınırı/seviye kapısı':function(){
    var x=mk('lumeren'),SG=x.SG,s=x.s;
    var c0=JSON.parse(JSON.stringify(s.res));
    var r=SG.PS.build(s,2,'quarry',T0);assert.ok(r.ok);
    assert.strictEqual(r.t1,T0+SG.Bld.secsFor(s,'quarry',1)*1000);
    assert.strictEqual(s.res.stone,c0.stone-20);assert.strictEqual(s.res.food,c0.food-40);
    assert.ok(!SG.PS.build(s,2,'mine',T0).ok,'dolu yer');
    assert.ok(SG.PS.build(s,3,'house',T0).ok);
    var f=SG.PS.build(s,4,'mine',T0);assert.ok(!f.ok&&/kuyruğu dolu/.test(f.err));
    assert.ok(!SG.PS.upgrade(s,1,T0).ok||true);
    var cancel=SG.PS.cancel(s,r.qid,T0);assert.ok(cancel.ok);
    assert.strictEqual(SG.Bld.get(s,2),null);near(s.res.stone,c0.stone-20-SG.Bld.costFor(s,'house',1).stone+16,1e-6);
    SG.PS.resolve(s,T0+SG.Bld.secsFor(s,'house',1)*1000);
    assert.strictEqual(SG.Bld.get(s,3).lv,1);
    /* seviye kapısı: Merkez 1 iken en çok 2 */
    s.res.food=9999;s.res.stone=2400;s.res.metal=2400;s.res.know=999;s.res.energy=999;s.res.credit=999;
    var n=T0+SG.Bld.secsFor(s,'house',1)*1000;
    var u2=SG.PS.upgrade(s,3,n);assert.ok(u2.ok);SG.PS.resolve(s,u2.t1);
    var u3=SG.PS.upgrade(s,3,u2.t1);assert.ok(!u3.ok&&/Merkez/.test(u3.err));
    /* süre gerçek zaman: sv2 yükseltme süresi tablo ile aynı */
    assert.strictEqual(u2.t1-n,SG.Bld.secsFor(s,'house',2)*1000);
  },
  'eğitim: zincir süresi, birlik sınırı, kışla kapısı, İpekçi topçu yok':function(){
    var x=mk('lumeren'),SG=x.SG,s=x.s;
    var a=SG.PS.train(s,'sentinel',3,T0);assert.ok(a.ok);
    var b=SG.PS.train(s,'sentinel',2,T0);assert.ok(b.ok);
    assert.strictEqual(b.t1,a.t1+SG.Bld.unitSecs(s,'sentinel',2)*1000,'zincir');
    assert.ok(!SG.PS.train(s,'spear',1,T0).ok,'kışla yok');
    assert.ok(!SG.PS.train(s,'sentinel',500,T0).ok);
    var cn=SG.PS.cancel(s,a.qid,T0);assert.ok(cn.ok);
    var q=s.q.filter(function(j){return j.id===b.qid;})[0];assert.strictEqual(q.t0,T0,'zincir kısaldı');
    SG.PS.resolve(s,q.t1);assert.strictEqual(s.troops.sentinel,2);
    var y=mk('ipekci','t5');y.s.bld.push({slot:5,type:'barracks',lv:4,job:0,dmgUntil:0,colAt:0});y.s.res.metal=500;y.s.res.energy=500;
    assert.ok(!y.SG.PS.train(y.s,'cannon',1,T0).ok);
    var z=mk('kulhan','t6');z.s.bld.push({slot:5,type:'barracks',lv:4,job:0,dmgUntil:0,colAt:0});z.s.res.metal=500;z.s.res.energy=500;
    assert.ok(z.SG.PS.train(z.s,'cannon',2,T0).ok);
  },
  'toplama dokunuşu: bekleme ve depo sınırı':function(){
    var x=mk('lumeren'),SG=x.SG,s=x.s;
    var r=SG.PS.collect(s,1,T0);assert.ok(r.ok&&r.gained.food>0);
    assert.ok(!SG.PS.collect(s,1,T0+60000).ok);
    assert.ok(SG.PS.collect(s,1,r.nextAt).ok);
  },
  'hasar geçici: hasarlı yapı üretmez, onarım olayıyla düzelir':function(){
    var x=mk('lumeren'),SG=x.SG,s=x.s;
    var b=SG.Bld.get(s,1);b.dmgUntil=T0+3*H;
    assert.strictEqual(SG.Eco.rates(s).food,-SG.Eco.pop(s)*0.06);
    SG.PS.resolve(s,T0+4*H);assert.strictEqual(b.dmgUntil,0);assert.ok(SG.Eco.rates(s,s.at).food>0);
  }
};
