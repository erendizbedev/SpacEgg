'use strict';
var h=require('./harness.js'),assert=require('assert');
var H=3600000,MIN=60000,DAY=86400000,T0=1700000000000;
function mk(civ,seed,opts){
  var SG=h.load(opts);SG.Clock.fake(T0);
  var s=SG.PS.create('u',T0,{seed:seed||'f1',civ:civ||'lumeren'});
  s.plan.cursor=99999;s.plan.list=[];           // rastgele plan kapalı: yalnız enjekte edilen olaylar
  return {SG:SG,s:s};
}
function inject(s){for(var i=1;i<arguments.length;i++)s.plan.list.push(arguments[i]);s.plan.list.sort(function(a,b){return a.at-b.at;});}
function strong(s){s.rivals.forEach(function(r){r.p0=1e6;r.pMax=1e6;});}
function kinds(arr){return arr.map(function(p){return p.kind+(p.tur?':'+p.tur:'')+(p.phase?':'+p.phase:'')+(p.who?':'+p.who:'');});}
exports.tests={
  'yoklama: 12 sa pencere, Katıl=hazırlan 60 dk, onay, kapanış':function(){
    var x=mk(),SG=x.SG,s=x.s;
    inject(s,{id:'tp1',at:T0+2*H,kind:'poll',a:0,b:1});
    s.troops.archer=20;
    SG.PS.resolve(s,T0+2*H);
    var p=s.pend[0];assert.strictEqual(p.state,'open');assert.strictEqual(p.joinBy-p.offerAt,12*H);
    var d=SG.Ev.drain(s);assert.strictEqual(JSON.stringify(kinds(d).filter(function(k){return /yoklama/.test(k);})),JSON.stringify(['yoklama:teklif']));
    var pop=d.filter(function(q){return q.kind==='yoklama';})[0];
    assert.ok(pop.canJoin&&pop.from&&pop.target&&pop.power&&pop.choices.length===2);
    assert.ok(!SG.PS.decide(s,p.id,'confirm',T0+2*H).ok,'hazır değil');
    var j=SG.PS.decide(s,p.id,'join',T0+2*H+MIN);assert.ok(j.ok);
    assert.strictEqual(j.prepEnd,T0+2*H+MIN+60*MIN,'hazırlık 60 dk');
    assert.ok(!SG.PS.decide(s,p.id,'confirm',T0+2*H+30*MIN).ok,'erken onay yok');
    SG.PS.resolve(s,j.prepEnd);assert.strictEqual(p.state,'ready');
    var d2=SG.Ev.drain(s);assert.ok(kinds(d2).indexOf('yoklama:hazir')>=0);
    var c=SG.PS.decide(s,p.id,'confirm',j.prepEnd+5*MIN);assert.ok(c.ok&&typeof c.won==='boolean');
    assert.strictEqual(p.state,'done');
    assert.ok(!SG.PS.decide(s,p.id,'confirm',j.prepEnd+6*MIN).ok);
    var rp=SG.Ev.drain(s).filter(function(q){return q.tur==='katil';});assert.strictEqual(rp.length,1);
    if(c.won){assert.ok(s.rivals[1].state==='dying'&&s.rivals[1].killAt===j.prepEnd+5*MIN+6*H,'yok oluş 6 sa');}
  },
  'yoklama: geç katılım, kaçırma, Geç bedelsiz, birliksiz katılım yok':function(){
    var x=mk(),SG=x.SG,s=x.s;
    inject(s,{id:'tp1',at:T0+2*H,kind:'poll',a:0,b:1},{id:'tp2',at:T0+20*H,kind:'poll',a:2,b:3},{id:'tp3',at:T0+40*H,kind:'poll',a:4,b:5});
    SG.PS.resolve(s,T0+2*H);
    var p1=s.pend[0];
    assert.ok(!SG.PS.decide(s,p1.id,'join',T0+3*H).ok,'birlik yok');
    s.troops.archer=20;
    var late=SG.PS.decide(s,p1.id,'join',T0+2*H+11*H+30*MIN);assert.ok(!late.ok&&/sığmıyor/.test(late.err));
    var res0=JSON.stringify(s.res);
    SG.PS.resolve(s,T0+14*H+MIN);
    assert.strictEqual(p1.state,'missed');assert.ok(s.log.some(function(e){return /kaçırıldı/.test(e.x);}));
    assert.ok(!SG.PS.decide(s,p1.id,'join',T0+14*H+2*MIN).ok);
    /* tp2: hazırlanıp onaylamayan fırsat kaçar */
    SG.PS.resolve(s,T0+20*H);var p2=s.pend.filter(function(p){return p.id==='ytp2';})[0];
    var j=SG.PS.decide(s,p2.id,'join',T0+20*H);assert.ok(j.ok);
    SG.PS.resolve(s,T0+33*H);assert.strictEqual(p2.state,'missed');
    var dd=kinds(SG.Ev.drain(s));assert.ok(dd.indexOf('yoklama:kacirildi')>=0);
    assert.ok(dd.indexOf('yoklama:teklif')<0,'bayat teklif düşer');
    /* tp3: Geç */
    SG.PS.resolve(s,T0+40*H);var p3=s.pend.filter(function(p){return p.id==='ytp3';})[0];
    var before=JSON.stringify([s.res.food,s.res.stone]);
    assert.ok(SG.PS.decide(s,p3.id,'skip',T0+40*H).ok);assert.strictEqual(p3.state,'skipped');
  },
  'kendi gezegen: 3 yenilgi -> 24 sa geri sayım -> Kurtarma':function(){
    var x=mk(),SG=x.SG,s=x.s;strong(s);
    s.res.energy=500;s.res.credit=500;
    inject(s,{id:'a1',at:T0+30*H,kind:'att',slot:0,type:'buyuk',m:'yok'},{id:'a2',at:T0+32*H,kind:'att',slot:1,type:'buyuk',m:'yok'},{id:'a3',at:T0+34*H,kind:'att',slot:2,type:'buyuk',m:'yok'});
    SG.PS.resolve(s,T0+33*H);assert.strictEqual(s.war.streak,2);assert.ok(!s.dying);
    SG.PS.resolve(s,T0+34*H);assert.strictEqual(s.war.streak,3);
    assert.strictEqual(s.dying.killAt,T0+34*H+24*H,'24 sa');
    var d=SG.Ev.drain(s),kb=d.filter(function(p){return p.kind==='kaybet';})[0];assert.ok(kb&&kb.hoursLeft===24&&kb.rescueCost);
    var r=SG.PS.rescue(s,T0+40*H);assert.ok(r.ok);assert.strictEqual(s.dying,null);assert.strictEqual(s.war.streak,0);
    assert.ok(s.war.shieldUntil>T0+40*H);
    assert.ok(!SG.PS.rescue(s,T0+41*H).ok,'kurtarılacak yok');
  },
  'kendi gezegen: savunma kazanınca geri sayım iptal; süre dolunca yok oluş, anma, yeni yumurta':function(){
    var a=mk('lumeren','f2'),SG=a.SG,s=a.s;strong(s);
    inject(s,{id:'a1',at:T0+30*H,kind:'att',slot:0,type:'buyuk',m:'yok'},{id:'a2',at:T0+32*H,kind:'att',slot:1,type:'buyuk',m:'yok'},{id:'a3',at:T0+34*H,kind:'att',slot:2,type:'buyuk',m:'yok'},{id:'a4',at:T0+40*H,kind:'att',slot:3,type:'akin',m:'yok'});
    SG.PS.resolve(s,T0+35*H);assert.ok(s.dying);
    s.troops.sentinel=5000;s.rivals.forEach(function(r){r.p0=1;r.pMax=1;});SG.PS.resolve(s,T0+41*H);
    assert.strictEqual(s.dying,null,'savunma kazanıldı: iptal');assert.strictEqual(s.war.streak,0);
    /* süre dolsun */
    var b=mk('lumeren','f3'),SG2=b.SG,s2=b.s;strong(s2);
    inject(s2,{id:'a1',at:T0+30*H,kind:'att',slot:0,type:'buyuk',m:'yok'},{id:'a2',at:T0+32*H,kind:'att',slot:1,type:'buyuk',m:'yok'},{id:'a3',at:T0+34*H,kind:'att',slot:2,type:'buyuk',m:'yok'});
    SG2.PS.resolve(s2,T0+34*H+24*H-1);assert.ok(!s2.dead);
    SG2.PS.resolve(s2,T0+34*H+24*H);assert.ok(s2.dead);assert.strictEqual(s2.dead.at,T0+58*H);
    var dd=SG2.Ev.drain(s2),yk=dd.filter(function(p){return p.kind==='yokolus'&&p.who==='self';})[0];assert.ok(yk&&yk.newEgg&&yk.life);
    assert.ok(!SG2.PS.build(s2,3,'farm',T0+60*H).ok,'ölüyken eylem yok');
    var st=h.memStorage();SG2.PS._store.use(st);
    SG2.PS.save(s2);assert.strictEqual(SG2.PS.hall('u').length,1);
    assert.strictEqual(SG2.PS.hall('u')[0].civ,'lumeren');
    var n=SG2.PS.newLife('u',T0+61*H);
    assert.notStrictEqual(n.id,s2.id);assert.strictEqual(JSON.stringify(n.res),JSON.stringify(SG2.TUNE.start),'sıfır miras');
    assert.strictEqual(n.bld.length,2);assert.strictEqual(SG2.Bld.troopCount(n),0);assert.strictEqual(SG2.PS.load('u'),null,'eski kayıt silindi');
  },
  'bina hasarı geçici; yağma-yalnız türler yapıya dokunmaz':function(){
    var a=mk(),SG=a.SG,s=a.s;strong(s);
    inject(s,{id:'a1',at:T0+30*H,kind:'att',slot:0,type:'hirsiz',m:'yok'});
    s.res.food=1500;SG.PS.resolve(s,T0+31*H);
    assert.ok(s.bld.every(function(b){return !b.dmgUntil;}),'hırsız bina yıkmaz');
    var b=mk('lumeren','f9'),SG2=b.SG,s2=b.s;strong(s2);
    inject(s2,{id:'a1',at:T0+30*H,kind:'att',slot:0,type:'kusat',m:'yok'});
    SG2.PS.resolve(s2,T0+30*H);var fm=SG2.Bld.get(s2,1);
    assert.strictEqual(fm.dmgUntil,T0+33*H,'3 sa hasar');
    assert.ok(!SG2.PS.upgrade(s2,1,T0+31*H).ok,'hasarlıyken yükseltilemez');
    SG2.PS.resolve(s2,T0+33*H);assert.strictEqual(fm.dmgUntil,0);
  },
  'rakip yok oluş: sefer, 6 sa geri sayım, yerine yeni rakip; yağma türü öldürmez':function(){
    var a=mk(),SG=a.SG,s=a.s;
    s.troops.cannon=400;s.res.credit=500;
    var r0=s.rivals[0],id0=r0.id;
    assert.ok(!SG.PS.attack(s,'yok','duz',T0).ok);
    var at=SG.PS.attack(s,id0,'duz',T0);assert.ok(at.ok);
    assert.strictEqual(at.t1,T0+40*MIN,'gidiş-dönüş 2x20 dk');
    assert.ok(!SG.PS.attack(s,s.rivals[1].id,'duz',T0).ok,'tek sefer');
    assert.strictEqual(s.troops.cannon,400-Math.floor(400*0.7));
    SG.PS.resolve(s,at.t1);
    assert.strictEqual(r0.state,'dying');assert.strictEqual(r0.killAt,at.t1+6*H);
    var rp=SG.Ev.drain(s).filter(function(p){return p.tur==='sefer';})[0];assert.ok(rp&&rp.result==='kazandin'&&rp.killAt===r0.killAt);
    /* geri sayım sırasında bu rakip saldıramaz */
    inject(s,{id:'ax',at:at.t1+H,kind:'att',slot:0,type:'kusat',m:'yok'});
    var n0=s.log.length;SG.PS.resolve(s,at.t1+2*H);assert.ok(!s.log.slice(n0).some(function(e){return e.k==='war';}),'ölmekte olan saldırmaz');
    SG.PS.resolve(s,r0.killAt-1);assert.ok(s.rivals[0].id===id0);
    SG.PS.resolve(s,r0.killAt);assert.notStrictEqual(s.rivals[0].id,id0,'yeni rakip doğdu');assert.strictEqual(s.rivals[0].state,'alive');
    assert.ok(kinds(SG.Ev.drain(s)).indexOf('yokolus:rival')>=0);
    /* yağma: öldürmez */
    var b=mk('kulhan','f7'),SG2=b.SG,s2=b.s;s2.troops.cannon=400;s2.res.credit=500;
    var t2=SG2.PS.attack(s2,s2.rivals[2].id,'yagma',T0);assert.ok(t2.ok);
    SG2.PS.resolve(s2,t2.t1);assert.strictEqual(s2.rivals[2].state,'alive');
  },
  'lojistik gemi: 90 dk gidiş-dönüş, ganimet depoyu aşmaz, Rüzgârgüder 60 dk':function(){
    var a=mk('lumeren','f4'),SG=a.SG,s=a.s;
    assert.ok(!SG.PS.sendShip(s,null,T0).ok,'liman yok');
    s.bld.push({slot:5,type:'port',lv:2,job:0,dmgUntil:0,colAt:0});SG.Log.ensureFleet(s);
    var cap=SG.Eco.cap(s);SG.TUNE.res.forEach(function(k){s.res[k]=cap-5;});
    var r=SG.PS.sendShip(s,null,T0);assert.ok(r.ok);assert.strictEqual(r.t1-T0,90*MIN);assert.strictEqual(r.mid-T0,45*MIN);
    assert.ok(!SG.PS.sendShip(s,null,T0+MIN).ok,'boş gemi yok');
    SG.PS.resolve(s,T0+89*MIN);assert.strictEqual(s.fleet[0].state,'back');
    SG.PS.resolve(s,T0+90*MIN);assert.strictEqual(s.fleet[0].state,'idle');
    SG.TUNE.res.forEach(function(k){assert.ok(s.res[k]<=SG.Eco.cap(s)+1e-9,k+' tavanı aştı');});
    var g=SG.Ev.drain(s).filter(function(p){return p.kind==='gemi';})[0];
    assert.ok(g&&g.result==='dondu');var lostSum=0,k;for(k in g.lost)lostSum+=g.lost[k];assert.ok(lostSum>0,'fazlası kayboldu');
    var b=mk('ruzgarguder','f5'),SG2=b.SG,s2=b.s;
    s2.bld.push({slot:5,type:'port',lv:1,job:0,dmgUntil:0,colAt:0});
    var r2=SG2.PS.sendShip(s2,null,T0);assert.strictEqual(r2.t1-T0,60*MIN);
    SG2.PS.resolve(s2,r2.t1);var g2=SG2.Ev.drain(s2).filter(function(p){return p.kind==='gemi';})[0];
    var tot=0;for(k in g2.gained)tot+=g2.gained[k];assert.ok(tot>0&&tot<=SG2.Log.cargoCap(s2)*1.2,'kargo '+tot);
    /* yağma seferi */
    var r3=SG2.PS.sendShip(s2,s2.rivals[3].id,r2.t1);assert.ok(r3.ok);
    SG2.PS.resolve(s2,r3.t1);assert.strictEqual(s2.fleet[0].state==='idle'||s2.fleet[0].state==='lost',true);
  },
  'manevra: kalkan enerji harcar, değişince iade; saldırı saldırıdan önce set edilir':function(){
    var a=mk(),SG=a.SG,s=a.s;
    inject(s,{id:'m1',at:T0+30*H,kind:'att',slot:0,type:'golge',m:'yok'});
    var e0=s.res.energy;
    assert.ok(SG.PS.maneuver(s,'m1','kalkan',T0).ok);near(s.res.energy,e0-40);
    assert.ok(SG.PS.maneuver(s,'m1','sur',T0).ok);near(s.res.energy,e0);
    assert.ok(!SG.PS.maneuver(s,'m1','uydurma',T0).ok);
    assert.ok(!SG.PS.maneuver(s,'yok-id','sur',T0).ok);
    s.res.energy=10;assert.ok(!SG.PS.maneuver(s,'m1','kalkan',T0).ok);
    function near(x,y){assert.ok(Math.abs(x-y)<1e-6,x+' '+y);}
  },
  'savaş çözümleyici saf fonksiyon, manevra etkisi, tohum aynı sonuç':function(){
    var SG=h.load();
    var att={power:200,civ:'kulhan',type:'kusat',man:'duz',noCiv:true},def={power:150,civ:'cinar',man:'yok',wall:0.2,res:{food:1000,stone:1000,metal:1000,energy:1000,know:1000,credit:1000},prot:400,slots:[1,2,3]};
    var a=SG.War.resolve(att,def,'s1'),b=SG.War.resolve(att,def,'s1');
    assert.strictEqual(JSON.stringify(a),JSON.stringify(b));
    var d2=JSON.parse(JSON.stringify(def));d2.man='kalkan';
    var c=SG.War.resolve(att,d2,'s1');assert.ok(c.D>a.D*1.2);
    var d3=JSON.parse(JSON.stringify(def));d3.man='sur';var e=SG.War.resolve(att,d3,'s1');assert.ok(e.D>a.D*1.15);
    var big={power:5000,civ:'kulhan',type:'buyuk',man:'duz',noCiv:true},w=SG.War.resolve(big,def,'s2');
    assert.strictEqual(w.winner,'att');
    Object.keys(w.loot).forEach(function(k){if(k!=='credit')assert.ok(w.loot[k]<=(1000-400)*0.2,'ganimet tavanı: korunan %40 alınmaz');});
    assert.ok((w.loot.credit||0)<=1000*0.03+1);assert.ok(w.dmg.length<=3);
    var hir={power:5000,civ:'kulhan',type:'hirsiz',man:'duz',noCiv:true},hh=SG.War.resolve(hir,def,'s3');assert.strictEqual(hh.dmg.length,0,'yağma-yalnız');
    var yuce={power:5000,civ:'kulhan',type:'yuce',man:'duz',noCiv:true},yy=SG.War.resolve(yuce,def,'s4');assert.strictEqual(yy.lossD,0);assert.strictEqual(Object.keys(yy.loot).length,0);
  },
  'rakip güç eğrisi oyuncuya 0,6-1,5 bandında uyar':function(){
    var a=mk(),SG=a.SG,s=a.s,t,r,D;
    s.troops.sentinel=100;
    for(t=T0;t<T0+30*DAY;t+=DAY){
      D=SG.War.defPower(s,t);
      s.rivals.forEach(function(r){var p=SG.AI.power(s,r,t),ref=Math.max(D,SG.TUNE.ai.refMin);assert.ok(p>=0.6*ref-1e-9&&p<=1.5*ref+1e-9,'bant dışı '+p/ref);});
    }
    s.troops.sentinel=0;D=SG.War.defPower(s,T0);
    s.rivals.forEach(function(r){assert.ok(SG.AI.power(s,r,T0+10*DAY)<=1.5*Math.max(D,SG.TUNE.ai.refMin)+1e-9);});
  },
  'keşif: izci 5 dk, bedel, rapor':function(){
    var a=mk(),SG=a.SG,s=a.s,c0=s.res.credit;
    var r=SG.PS.scout(s,s.rivals[0].id,T0);assert.ok(r.ok);assert.strictEqual(r.t1-T0,5*MIN);
    assert.strictEqual(s.res.credit,c0-20);assert.ok(!SG.PS.scout(s,s.rivals[0].id,T0).ok,'aynı hedefe iki izci yok');
    SG.PS.resolve(s,T0+5*MIN);var p=SG.Ev.drain(s).filter(function(q){return q.tur==='izci';})[0];
    assert.ok(p&&(p.ok===false||(p.band&&p.power>0)));
  }
};
