'use strict';
var h=require('./harness.js'),assert=require('assert');
var H=3600000,MIN=60000,DAY=86400000,T0=1700000000000;
function mk(opts,civ){var SG=h.load(opts);SG.Clock.fake(T0);return {SG:SG,s:SG.PS.create('doktor',T0,{seed:'sv1',civ:civ||'lumeren'})};}
exports.tests={
  'kayıt: sg3_ anahtarı, zarf+sağlama, gidiş-dönüş':function(){
    var st=h.memStorage(),x=mk({storage:st}),SG=x.SG,s=x.s;
    SG.PS.resolve(s,T0+2*H);assert.ok(SG.PS.save(s));
    assert.ok(st._d['sg3_doktor_p'],'anahtar');
    var env=JSON.parse(st._d['sg3_doktor_p']);assert.ok(env.f===1&&env.v===3&&env.sum&&env.saved&&typeof env.d==='string');
    var l=SG.PS.load('doktor');assert.strictEqual(JSON.stringify(l),JSON.stringify(s));
    assert.strictEqual(l.rev,1);
    SG.PS.save(s);assert.strictEqual(SG.PS.load('doktor').rev,2);
    SG.PS.save({user:'Doktor Ş',v:3});            // eksik durum: hata fırlatmaz
    SG.PS.clear('doktor');assert.strictEqual(SG.PS.load('doktor'),null);
  },
  'kayıt: 3 dönüşümlü yedek, bozuk ana kayıttan kurtarma':function(){
    var st=h.memStorage(),x=mk({storage:st}),SG=x.SG,s=x.s,i;
    for(i=1;i<=6;i++){SG.Clock.advance(100000);SG.PS.resolve(s,T0+i*H);SG.PS.save(s);}
    ['b0','b1','b2'].forEach(function(b){assert.ok(st._d['sg3_doktor_'+b],b);});
    st._d['sg3_doktor_p']='{bozuk';
    var l=SG.PS.load('doktor');assert.ok(l,'yedekten döndü');assert.ok(SG.PS.lastLoad.recovered);
    assert.ok(l.rev>=4&&l.rev<=6,'rev '+l.rev);
    assert.ok(JSON.parse(st._d['sg3_doktor_p']).f===1,'ana kayıt onarıldı');
    /* sağlama tutmayan zarf */
    var env=JSON.parse(st._d['sg3_doktor_p']);env.d=env.d.replace('"lumeren"','"cinar"');st._d['sg3_doktor_p']=JSON.stringify(env);
    var l2=SG.PS.load('doktor');assert.ok(l2&&l2.civ==='lumeren'&&SG.PS.lastLoad.recovered,'sağlama bozuğu reddedildi');
    ['p','b0','b1','b2'].forEach(function(k){st._d['sg3_doktor_'+k]='x';});
    assert.strictEqual(SG.PS.load('doktor'),null);
  },
  'kayıt: localStorage yoksa ya da hata verirse sessizce bellek':function(){
    var x=mk({},'cinar'),SG=x.SG,s=x.s;                        // localStorage yok
    assert.strictEqual(SG.PS.save(s),false);                   // kalıcı değil ama hata yok
    assert.strictEqual(SG.PS.load('doktor').civ,'cinar');
    var bad={getItem:function(){throw new Error('x');},setItem:function(){throw new Error('dolu');},removeItem:function(){throw new Error('x');}};
    var y=mk({storage:bad}),SG2=y.SG;
    assert.doesNotThrow(function(){SG2.PS.save(y.s);});
    assert.strictEqual(SG2.PS.load('doktor').id,y.s.id);
  },
  'anma listesi ve ayarlar':function(){
    var st=h.memStorage(),x=mk({storage:st}),SG=x.SG;
    assert.strictEqual(SG.PS.hall('doktor').length,0);
    SG.PS.hallAdd('doktor',{name:'A',civ:'cinar',lifeMs:5});SG.PS.hallAdd('doktor',{name:'B',civ:'kulhan',lifeMs:7});
    assert.strictEqual(SG.PS.hall('doktor').length,2);assert.ok(st._d['sg3_doktor_hall']);
    SG.PS.setSettings('doktor',{a:1});assert.strictEqual(SG.PS.settings('doktor').a,1);assert.ok(st._d['sg3_doktor_set']);
    var n=SG.PS.create('doktor',T0+DAY);assert.notStrictEqual(n.seed,x.s.seed);   // yaşam sayısı tohuma girer
  },
  'norm: bozuk/saldırgan kayıt reddedilir':function(){
    var SG=h.load(),s=SG.PS.create('u',T0,{seed:'n1'});
    var c=JSON.parse(JSON.stringify(s));c.rivals.pop();assert.strictEqual(SG.PS.norm(c),null);
    c=JSON.parse(JSON.stringify(s));c.civ='yok';assert.strictEqual(SG.PS.norm(c),null);
    c=JSON.parse(JSON.stringify(s));c.res.food='x';assert.strictEqual(SG.PS.norm(c).res.food,0);
    c=JSON.parse(JSON.stringify(s));c.bld.push({slot:99,type:'farm',lv:3});assert.strictEqual(SG.PS.norm(c).bld.length,2);
  },
  'saat: sahte saat, geri sıçrama koruması, drift':function(){
    var SG=h.load();SG.Clock.fake(1000);assert.strictEqual(SG.Clock.now(),1000);
    SG.Clock.advance(500);assert.strictEqual(SG.Clock.now(),1500);
    SG.Clock.fake(400);assert.strictEqual(SG.Clock.now(),1500,'zaman geri akmaz');assert.strictEqual(SG.Clock.drift(),1100);
    SG.Clock.advance(100);assert.strictEqual(SG.Clock.now(),1600);
    SG.Clock.fake(SG.Clock.now()+8*DAY);SG.Clock.now();assert.ok(SG.Clock.suspicious(),'7 günden fazla ileri sıçrama şüpheli');
  },
  'saat: durum zamanı geri gitmez; saat geri alınınca üretim negatif olmaz; ileri sıçrama tek adımda çözülür':function(){
    var x=mk({}),SG=x.SG,s=x.s;
    SG.PS.tick(s,T0+5*H);var f=s.res.food,at=s.at;
    SG.PS.tick(s,T0+1*H);                                    // saat geri alınmış
    assert.strictEqual(s.at,at);assert.strictEqual(s.res.food,f);
    assert.strictEqual(SG.Clock.guard(s,T0),at);
    var r=SG.PS.open(s,T0+3*H);assert.strictEqual(r,null);assert.strictEqual(s.at,at);
    var rp=SG.PS.open(s,T0+3*DAY);assert.ok(rp&&rp.awayMs>=3*DAY-5*H&&rp.capped,'3 gün sonra tavan notu');
    assert.ok(rp.lines.length>0);assert.ok(rp.gained.food>0);
    var d=SG.Ev.drain(s);assert.strictEqual(d[0].tur,'yokken');assert.strictEqual(SG.PS.report(s),rp);
    assert.strictEqual(SG.Ev.drain(s).filter(function(p){return p.tur==='yokken';}).length,0,'rapor bir kez');
  },
  'saat: Android elapsed ile duvar saati hilesi (ileri) elapsed ile düzeltilir':function(){
    var wall=1700000000000,el=5000;
    var SG=h.load({date:{now:function(){return wall;}},native:{elapsed:function(){return el;}}});
    var a=SG.Clock.now();assert.strictEqual(a,1700000000000);
    el+=1000;wall+=1000;assert.strictEqual(SG.Clock.now(),a+1000);
    el+=1000;wall+=DAY;                                       // duvar saati 1 gün ileri alındı, elapsed 1 sn
    var b=SG.Clock.now();assert.strictEqual(b,a+2000,'elapsed güvenilir');assert.ok(SG.Clock.suspicious());
  },
  'bildirim: alarm listesi, en çok 20, sessiz saat yok, köprü yoksa no-op':function(){
    var calls=[],nat={schedule:function(id,at,t,x){calls.push(['s',id,at,t,x]);},cancel:function(id){calls.push(['c',id]);},cancelAll:function(){calls.push(['a']);}};
    var x=mk({native:nat}),SG=x.SG,s=x.s;
    s.troops.sentinel=0;
    var b=SG.PS.build(s,2,'quarry',T0);assert.ok(b.ok);SG.PS.train(s,'sentinel',2,T0);
    var r=SG.Notify.sync(s);assert.ok(r.bridge);assert.strictEqual(r.alarms.length,2);assert.strictEqual(calls.filter(function(c){return c[0]==='s';}).length,2);
    calls.length=0;var r2=SG.Notify.sync(s);assert.strictEqual(r2.scheduled,0);assert.strictEqual(calls.length,0,'değişmeyen yeniden gönderilmez');
    SG.PS.cancel(s,b.qid,T0);calls.length=0;SG.Notify.sync(s);assert.ok(calls.some(function(c){return c[0]==='c'&&c[1]==='q:'+b.qid;}),'kalkan alarm iptal');
    /* 20 sınırı ve sessiz saat yok */
    var many=[],i;for(i=0;i<40;i++)many.push({id:'z'+i,at:T0+(i+1)*20*MIN,kind:'poll',a:0,b:1});
    s.plan.cursor=99999;s.plan.list=many;
    var r3=SG.Notify.sync(s);assert.strictEqual(r3.alarms.length,20);
    for(i=1;i<r3.alarms.length;i++)assert.ok(r3.alarms[i].at>=r3.alarms[i-1].at);
    var hrs={};r3.alarms.forEach(function(a){hrs[new Date(a.at).getUTCHours()]=1;});assert.ok(Object.keys(hrs).length>=1);
    r3.alarms.forEach(function(a){assert.ok(a.text.indexOf(s.name)<0&&a.title.indexOf(s.name)<0&&a.text.indexOf('doktor')<0,'kullanıcı verisi yok');});
    /* ölmekte olan gezegen alarmı */
    s.plan.list=[];s.dying={killAt:T0+40*H,since:T0};var r4=SG.Notify.sync(s);assert.ok(r4.alarms.some(function(a){return a.id==='k:s1';}));
    /* köprü yok */
    var y=mk({}),SG2=y.SG;SG2.PS.build(y.s,2,'quarry',T0);var rr=SG2.Notify.sync(y.s);assert.strictEqual(rr.bridge,false);assert.strictEqual(rr.alarms.length,1);
    /* tür kapatma */
    SG2.Notify.setPrefs({build:0});assert.strictEqual(SG2.Notify.sync(y.s).alarms.length,0);
  }
};
