'use strict';
var h=require('./harness.js'),bot=require('./bot.js'),assert=require('assert');
var H=3600000,DAY=86400000,T0=1700000000000;
function runScenario(seedName,days,stepMs,prof,every){
  var SG=h.load();SG.Clock.fake(T0);
  var s=SG.PS.create('replay',T0,{seed:seedName}),rg=SG.rng('bot#'+seedName),end=T0+days*DAY,acts=[],t;
  for(t=T0+every;t<=end;t+=every)acts.push(t);
  var pops=[],ai=0;
  var tt=T0;
  while(tt<end){
    var next=ai<acts.length?acts[ai]:end;
    if(stepMs>0){while(tt+stepMs<=next&&tt<next){tt+=stepMs;SG.PS.resolve(s,tt);}}
    if(tt<next){tt=next;SG.PS.resolve(s,tt);}
    if(ai<acts.length&&tt===acts[ai]){bot.act(SG,s,tt,prof,rg);ai++;}
    if(tt>=end&&ai>=acts.length)break;
  }
  SG.PS.resolve(s,end);
  return {SG:SG,s:s};
}
exports.runScenario=runScenario;
function eq(a,b,path){
  if(typeof a==='number'&&typeof b==='number'){assert.ok(Math.abs(a-b)<=Math.max(0.01,Math.abs(a)*1e-9),path+' '+a+' != '+b);return;}
  if(a&&typeof a==='object'){
    assert.ok(b&&typeof b==='object',path+' tip');
    var ka=Object.keys(a).sort(),kb=Object.keys(b).sort();
    assert.deepStrictEqual(ka,kb,path+' anahtarlar');
    ka.forEach(function(k){eq(a[k],b[k],path+'.'+k);});return;
  }
  assert.strictEqual(a,b,path);
}
exports.tests={
  'replay 3 gün: 1 sn adım == tek sıçrama':function(){
    var a=runScenario('golden-A',3,1000,bot.PROF.active,3*H),b=runScenario('golden-A',3,0,bot.PROF.active,3*H);
    eq(a.s,b.s,'s');
    assert.ok(a.s.log.length>10);
  },
  'replay 30 gün: 30 sn adım == tek sıçrama (3 tohum)':function(){
    ['golden-A','golden-B','golden-C'].forEach(function(sd){
      var prof=sd==='golden-C'?bot.PROF.passive:bot.PROF.active;
      var a=runScenario(sd,30,30000,prof,3*H),b=runScenario(sd,30,0,prof,3*H);
      eq(a.s,b.s,sd);
      var pa=JSON.stringify(a.SG.Ev.drain(a.s)),pb=JSON.stringify(b.SG.Ev.drain(b.s));
      assert.strictEqual(pa,pb,sd+' popup');
    });
  },
  'replay 30 gün: 1 sn adım == tek sıçrama':function(){
    var a=runScenario('golden-D',30,1000,bot.PROF.active,3*H),b=runScenario('golden-D',30,0,bot.PROF.active,3*H);
    eq(a.s,b.s,'D');
  },
  'tohum tutarlılığı: aynı tohum+eylem aynı sonuç, farklı tohum farklı':function(){
    var a=runScenario('seed-1',10,0,bot.PROF.active,3*H),b=runScenario('seed-1',10,0,bot.PROF.active,3*H),c=runScenario('seed-2',10,0,bot.PROF.active,3*H);
    assert.strictEqual(JSON.stringify(a.s),JSON.stringify(b.s));
    assert.notStrictEqual(JSON.stringify(a.s.plan),JSON.stringify(c.s.plan));
    assert.strictEqual(a.s.civ,b.s.civ);
  },
  'yeniden yükle: kaydedip yükleyince yeniden at hilesi işe yaramaz':function(){
    var SG=h.load({storage:h.memStorage()});SG.Clock.fake(T0);
    var s=SG.PS.create('hile',T0,{seed:'hile-1'});SG.PS.resolve(s,T0+2*DAY);
    var p0=JSON.stringify(s.plan.list.slice(0,3));
    SG.PS.save(s);var l=SG.PS.load('hile');
    SG.PS.resolve(s,T0+6*DAY);SG.PS.resolve(l,T0+6*DAY);
    assert.strictEqual(JSON.stringify(s.log),JSON.stringify(l.log));
  }
};
