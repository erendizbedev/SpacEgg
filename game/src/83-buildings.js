/* SpacEgg v3 — yapılar ve birlikler (SG.Bld): 11 tür x 5 seviye, iş kuyruğu eylemleri */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
function T(){return SG.TUNE;}
function r5(x){return Math.max(1,Math.round(x/5)*5);}
var Bld=SG.Bld={TYPES:{}};
/* seviye tablosu (sivil çarpansız) */
function baseCost(type,lv){
  var t=T(),def=t.bld[type],o={},k,g=Math.pow(t.costGrowth,lv-1);
  for(k in def.cost)o[k]=r5(def.cost[k]*g);
  if(lv>=t.knowFrom)o.know=r5(t.knowBase*Math.pow(2,lv-t.knowFrom));
  return o;
}
function baseSecs(type,lv){var t=T();return Math.round(t.time.base*t.bld[type].tm*Math.pow(t.time.growth,lv-1));}
function init(){
  var t=T();
  t.bldOrder.forEach(function(id){
    var d=t.bld[id];
    Bld.TYPES[id]={id:id,ad:d.ad,acik:d.acik,max:d.max,
      cost:function(lv){return baseCost(id,lv);},
      secs:function(lv){return baseSecs(id,lv);},
      uretim:function(lv){var o={},k;for(k in d.prod)o[k]=d.prod[k]*t.lvMul[lv];return o;}};
  });
}
Bld.cost=function(type,lv){return baseCost(type,lv);};
Bld.secs=function(type,lv){return baseSecs(type,lv);};
Bld.costFor=function(s,type,lv){
  var c=baseCost(type,lv),m=SG.K.mul(s,'buildCost'),k;
  if(m!==1)for(k in c)c[k]=Math.max(1,Math.round(c[k]*m));
  return c;
};
Bld.secsFor=function(s,type,lv){return Math.max(5,Math.round(baseSecs(type,lv)*SG.K.mul(s,'buildTime')));};
Bld.canAfford=function(s,cost){for(var k in cost)if((s.res[k]||0)<cost[k]-1e-9)return false;return true;};
Bld.missing=function(s,cost){var o={},k;for(k in cost)if((s.res[k]||0)<cost[k]-1e-9)o[k]=Math.ceil(cost[k]-s.res[k]);return o;};
Bld.pay=function(s,cost){for(var k in cost)s.res[k]=Math.max(0,s.res[k]-cost[k]);};
Bld.refund=function(s,cost,frac){var cap=SG.Eco.cap(s),k;for(k in cost)s.res[k]=Math.min(Math.max(cap,s.res[k]),s.res[k]+cost[k]*frac);};
Bld.get=function(s,slot){for(var i=0;i<s.bld.length;i++)if(s.bld[i].slot===slot)return s.bld[i];return null;};
Bld.count=function(s,type){var n=0;for(var i=0;i<s.bld.length;i++)if(s.bld[i].type===type)n++;return n;};
Bld.lv=function(s,type){var m=0;for(var i=0;i<s.bld.length;i++)if(s.bld[i].type===type&&s.bld[i].lv>m)m=s.bld[i].lv;return m;};
Bld.lvSum=function(s,type){var n=0;for(var i=0;i<s.bld.length;i++)if(s.bld[i].type===type)n+=s.bld[i].lv;return n;};
Bld.hallLv=function(s){return Bld.lv(s,'hall');};
Bld.maxLv=function(s,type){return type==='hall'?T().maxLv:Math.min(T().maxLv,Bld.hallLv(s)+1);};
Bld.jobs=function(s,kinds){return s.q.filter(function(j){return kinds.indexOf(j.kind)>=0;});};
Bld.builders=function(s){return Bld.jobs(s,['build','upgrade']).length;};
Bld.troopCap=function(s){var c=T().troopCap;return c.base+c.hall*Bld.hallLv(s)+c.house*Bld.lvSum(s,'house')+c.barracks*Bld.lv(s,'barracks');};
Bld.troopCount=function(s,withQueue){
  var n=0,u;for(u in s.troops)n+=s.troops[u];
  if(withQueue)s.q.forEach(function(j){if(j.kind==='train')n+=j.n;else if(j.kind==='march')for(var k in j.troops)n+=j.troops[k];});
  return n;
};
Bld.unitOk=function(s,unit){
  var u=T().units[unit];if(!u)return {ok:false,err:'Bilinmeyen birlik.'};
  var no=(SG.Civ.get(s.civ).mul||{}).noUnits;
  if(no&&no.indexOf(unit)>=0)return {ok:false,err:'Bu medeniyet '+u.ad+' eğitemez.'};
  if(u.req>0&&Bld.lv(s,'barracks')<u.req)return {ok:false,err:u.ad+' için Kışla seviye '+u.req+' gerekir.'};
  if(Bld.hallLv(s)<1)return {ok:false,err:'Merkez yok.'};
  return {ok:true};
};
Bld.unitCost=function(s,unit,n){var u=T().units[unit],m=SG.K.mul(s,'trainCost'),o={},k;for(k in u.cost)o[k]=Math.max(1,Math.round(u.cost[k]*m))*n;return o;};
Bld.unitSecs=function(s,unit,n){
  var u=T().units[unit],bl=Math.max(0,Bld.lv(s,'barracks')-1),sp=Math.max(0.5,1-T().barracksSpeed*bl);
  return Math.max(1,Math.round(u.secs*n*SG.K.mul(s,'trainTime')*sp));
};
function fail(m){return {ok:false,err:m};}
function nid(s){s.seq=(s.seq||0)+1;return 'q'+s.seq;}
Bld.nid=nid;
Bld.canBuild=function(s,slot,type){
  var t=T();
  if(typeof slot!=='number'||slot<0||slot>=t.slots||slot%1!==0)return fail('Geçersiz yapı yeri.');
  var def=t.bld[type];if(!def)return fail('Bilinmeyen yapı.');
  if(type==='hall')return fail('Merkez zaten var.');
  if(Bld.get(s,slot))return fail('Bu yer dolu.');
  if(Bld.count(s,type)>=def.max)return fail(def.ad+' için en çok '+def.max+' yer olabilir.');
  if(Bld.builders(s)>=t.builders)return fail('İnşaat kuyruğu dolu ('+t.builders+').');
  var cost=Bld.costFor(s,type,1);
  if(!Bld.canAfford(s,cost))return {ok:false,err:'Kaynak yetmiyor.',missing:Bld.missing(s,cost),cost:cost};
  return {ok:true,cost:cost,secs:Bld.secsFor(s,type,1)};
};
Bld.build=function(s,slot,type,now){
  var c=Bld.canBuild(s,slot,type);if(!c.ok)return c;
  Bld.pay(s,c.cost);
  var id=nid(s);
  s.bld.push({slot:slot,type:type,lv:0,job:id,dmgUntil:0,colAt:0});
  s.q.push({id:id,kind:'build',slot:slot,type:type,lv:1,t0:now,t1:now+c.secs*1000,cost:c.cost});
  SG.PS.log(s,now,'build',T().bld[type].ad+' inşaatı başladı.');
  return {ok:true,qid:id,t1:now+c.secs*1000,cost:c.cost};
};
Bld.canUpgrade=function(s,slot){
  var t=T(),b=Bld.get(s,slot);
  if(!b||b.lv<1)return fail('Burada yükseltilecek yapı yok.');
  if(b.job)return fail('Bu yapı zaten işte.');
  if(b.lv>=t.maxLv)return fail('Yapı en üst seviyede.');
  if(b.lv+1>Bld.maxLv(s,b.type))return fail('Önce Merkez seviyesini yükselt (en çok Merkez+1).');
  if(b.dmgUntil>s.at)return fail('Yapı hasarlı; onarım bekleniyor.');
  if(Bld.builders(s)>=t.builders)return fail('İnşaat kuyruğu dolu ('+t.builders+').');
  var cost=Bld.costFor(s,b.type,b.lv+1);
  if(!Bld.canAfford(s,cost))return {ok:false,err:'Kaynak yetmiyor.',missing:Bld.missing(s,cost),cost:cost};
  return {ok:true,cost:cost,secs:Bld.secsFor(s,b.type,b.lv+1),lv:b.lv+1,type:b.type};
};
Bld.upgrade=function(s,slot,now){
  var c=Bld.canUpgrade(s,slot);if(!c.ok)return c;
  var b=Bld.get(s,slot),id=nid(s);
  Bld.pay(s,c.cost);b.job=id;
  s.q.push({id:id,kind:'upgrade',slot:slot,type:b.type,lv:c.lv,t0:now,t1:now+c.secs*1000,cost:c.cost});
  SG.PS.log(s,now,'build',T().bld[b.type].ad+' seviye '+c.lv+' yükseltmesi başladı.');
  return {ok:true,qid:id,t1:now+c.secs*1000,cost:c.cost,lv:c.lv};
};
function rechain(s,now){
  var tr=s.q.filter(function(j){return j.kind==='train';}).sort(function(a,b){return a.t0-b.t0;}),prev=now;
  tr.forEach(function(j){
    if(j.t0<=now&&j.t1>now){prev=j.t1;return;}
    var d=j.t1-j.t0;j.t0=prev;j.t1=prev+d;prev=j.t1;
  });
}
Bld.cancel=function(s,qid,now){
  var i,j=null;for(i=0;i<s.q.length;i++)if(s.q[i].id===qid){j=s.q[i];break;}
  if(!j)return fail('İş bulunamadı.');
  if(['build','upgrade','train','scout'].indexOf(j.kind)<0)return fail('Bu iş iptal edilemez.');
  s.q.splice(i,1);
  if(j.kind==='build'){for(i=0;i<s.bld.length;i++)if(s.bld[i].job===qid){s.bld.splice(i,1);break;}}
  else if(j.kind==='upgrade'){var b=Bld.get(s,j.slot);if(b)b.job=0;}
  else if(j.kind==='train')rechain(s,now);
  if(j.cost)Bld.refund(s,j.cost,T().refund);
  SG.PS.log(s,now,'cancel','İş iptal edildi; bedelin %'+Math.round(T().refund*100)+'\'i iade.');
  return {ok:true,refund:j.cost||{}};
};
Bld.train=function(s,unit,n,now){
  n=Math.floor(n);
  if(!(n>=1&&n<=100))return fail('Adet 1-100 olmalı.');
  var ok=Bld.unitOk(s,unit);if(!ok.ok)return ok;
  if(Bld.troopCount(s,true)+n>Bld.troopCap(s))return fail('Birlik sınırı: '+Bld.troopCap(s)+' (Konut ve Kışla ile artar).');
  var cost=Bld.unitCost(s,unit,n);
  if(!Bld.canAfford(s,cost))return {ok:false,err:'Kaynak yetmiyor.',missing:Bld.missing(s,cost),cost:cost};
  var last=now;s.q.forEach(function(j){if(j.kind==='train'&&j.t1>last)last=j.t1;});
  var secs=Bld.unitSecs(s,unit,n),id=nid(s);
  Bld.pay(s,cost);
  s.q.push({id:id,kind:'train',unit:unit,n:n,t0:last,t1:last+secs*1000,cost:cost});
  return {ok:true,qid:id,t1:last+secs*1000,cost:cost};
};
/* toplama dokunuşu: yapının collect.min dakikalık üretimi, yapı başına bekleme süresi */
Bld.collect=function(s,slot,now){
  var t=T(),b=Bld.get(s,slot);
  if(!b||b.lv<1)return fail('Burada toplanacak yapı yok.');
  if(b.dmgUntil>now)return fail('Yapı hasarlı.');
  if(b.colAt>now)return {ok:false,err:'Henüz hazır değil.',nextAt:b.colAt};
  var def=t.bld[b.type],civ=SG.Civ.get(s.civ),mul=civ.mul||{},cap=SG.Eco.cap(s),got={},any=false,k,v;
  for(k in def.prod){
    v=def.prod[k]*t.lvMul[b.lv]*(typeof mul[k]==='number'?mul[k]:1)*(civ.main===k?t.mainBonus:1)*t.collect.min/60;
    v=Math.min(v,Math.max(0,cap-s.res[k]));
    if(v>0){s.res[k]+=v;got[k]=Math.round(v*10)/10;any=true;}
  }
  b.colAt=now+t.collect.cooldownMin*60000;
  if(!any)return {ok:false,err:'Depo dolu ya da bu yapı toplanacak şey üretmiyor.',nextAt:b.colAt};
  return {ok:true,gained:got,nextAt:b.colAt};
};
Bld.finish=function(s,j){
  var t=T(),b,u;
  if(j.kind==='build'||j.kind==='upgrade'){
    b=Bld.get(s,j.slot);
    if(b){b.lv=j.lv;b.job=0;b.colAt=0;}
    SG.PS.log(s,j.t1,'build',t.bld[j.type].ad+' seviye '+j.lv+' tamamlandı.');
    if(j.type==='port'&&SG.Log)SG.Log.ensureFleet(s);
  }else if(j.kind==='train'){
    s.troops[j.unit]=(s.troops[j.unit]||0)+j.n;
    SG.PS.log(s,j.t1,'train',j.n+' '+t.units[j.unit].ad+' eğitildi.');
  }
};
/* arayüz yardımcısı: slot listesi */
Bld.list=function(s){
  var out=[],t=T(),i,b,j;
  for(i=0;i<t.slots;i++){
    b=Bld.get(s,i);
    if(!b){out.push({slot:i,type:null});continue;}
    j=null;if(b.job)for(var q=0;q<s.q.length;q++)if(s.q[q].id===b.job){j=s.q[q];break;}
    out.push({slot:i,type:b.type,lv:b.lv,dmgUntil:b.dmgUntil,damaged:b.dmgUntil>s.at,
      job:j?{id:j.id,kind:j.kind,t0:j.t0,t1:j.t1,progress:Math.max(0,Math.min(1,(s.at-j.t0)/Math.max(1,j.t1-j.t0)))}:null,colAt:b.colAt});
  }
  return out;
};
init();
})();
