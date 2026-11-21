/* SpacEgg v3 — gezegen durumu (SG.PS): şema, olay çözücü resolve(until), eylemler, kayıt (sg3_) */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var H=3600000;
function T(){return SG.TUNE;}
var PS=SG.PS={};

/* ---------- günlük ---------- */
PS.log=function(s,t,k,x){
  s.log.push({t:t,k:k,x:x});
  var m=T().save.logMax;if(s.log.length>m)s.log.splice(0,s.log.length-m);
};

/* ---------- oluşturma ---------- */
PS.create=function(userKey,now,opts){
  opts=opts||{};
  var t=T(),lives=PS.hall(userKey).length;
  var seed=opts.seed||('p|'+userKey+'|'+now+'|'+lives);
  var civ=opts.civ?SG.Civ.get(opts.civ):SG.Civ.pick(seed);
  var rg=SG.K.rng(seed+'#planet');
  var s={v:3,id:'p'+SG.K.hash(seed).toString(36),user:userKey,name:SG.AI.name(rg),seed:seed,civ:civ.id,born:now,rev:0,
    at:now,seen:now,clock:{drift:0,sus:false},
    res:SG.K.copy(t.start),bld:[],troops:{sentinel:0,spear:0,archer:0,cannon:0},fleet:[],q:[],
    plan:{cursor:0,list:[]},rivals:[],pend:[],war:{streak:0,lastDefeatAt:0,shieldUntil:0,wins:0,losses:0},
    dying:null,intel:{},log:[],popq:[],stats:{},full:{},seq:0,dead:null,hallDone:false,mark:null,lastReport:null};
  s.bld.push({slot:0,type:'hall',lv:1,job:0,dmgUntil:0,colAt:0});
  s.bld.push({slot:1,type:'farm',lv:1,job:0,dmgUntil:0,colAt:0});
  SG.AI.init(s);
  PS.log(s,now,'basla',s.name+' gezegeni çatladı: '+civ.ad+'.');
  return s;
};

/* ---------- ana motor ---------- */
function jobDone(s,j){
  switch(j.kind){
    case 'build':case 'upgrade':case 'train':SG.Bld.finish(s,j);break;
    case 'scout':SG.AI.finishScout(s,j);break;
    case 'prep':SG.Ev.prepDone(s,j);break;
    case 'march':SG.War.finishMarch(s,j);break;
  }
}
function die(s){
  var t=s.at;
  s.dead={at:t,cause:'yenilgi'};
  s.dying=null;
  var rec={name:s.name,civ:s.civ,civAd:SG.Civ.get(s.civ).ad,born:s.born,died:t,lifeMs:t-s.born,hallLv:SG.Bld.hallLv(s),cause:'yenilgi',wins:s.war.wins,losses:s.war.losses};
  s.hallRec=rec;
  PS.log(s,t,'kill','Gezegen yok oldu: '+s.name+'.');
  SG.Ev.pop(s,{kind:'yokolus',who:'self',t:t,planet:{name:s.name,civ:s.civ,civAd:rec.civAd},life:rec,newEgg:true});
}
function pruneEnded(s,at){
  s.pend=s.pend.filter(function(p){return p.state==='open'||p.state==='prep'||p.state==='ready'||p.joinBy>at-24*H;});
}
PS.resolve=function(s,until){
  if(s.dead||until<=s.at)return s;
  var t=T(),ks=t.res,n=0,B,i,k,j,b,r,tt,cap;
  function cand(time,pri,kind,ref){
    if(time<s.at)time=s.at;
    if(time<B.t||(time===B.t&&pri<B.pri)){B.t=time;B.pri=pri;B.kind=kind;B.ref=ref;}
  }
  for(;;){
    if(++n>t.maxIter){try{SG.log&&SG.log.err('PS.resolve','döngü sınırı');}catch(e){}s.at=until;break;}
    SG.AI.ensurePlan(s,until);
    cap=SG.Eco.cap(s);
    for(i=0;i<ks.length;i++){k=ks[i];if(s.full[k]&&s.res[k]<cap-0.01)s.full[k]=0;}
    r=SG.Eco.rates(s,s.at);
    B={t:until,pri:99,kind:'until',ref:null};
    for(i=0;i<s.q.length;i++)cand(s.q[i].t1,1,'job',s.q[i]);
    for(i=0;i<s.fleet.length;i++){
      j=s.fleet[i];
      if(j.state==='out')cand(j.mid,2,'shmid',j);
      else if(j.state==='back'||j.state==='lost')cand(j.t1,2,'shret',j);
    }
    for(i=0;i<s.bld.length;i++){b=s.bld[i];if(b.dmgUntil>0)cand(b.dmgUntil,1,'repair',b);}
    if(s.plan.list.length)cand(s.plan.list[0].at,3,'plan',s.plan.list[0]);
    for(i=0;i<s.pend.length;i++){var p=s.pend[i];if(p.state==='open'||p.state==='prep'||p.state==='ready')cand(p.joinBy,2.5,'pend',p);}
    for(i=0;i<s.rivals.length;i++){var rv=s.rivals[i];if(rv.state==='dying')cand(rv.killAt,4,'rkill',rv);}
    if(s.dying)cand(s.dying.killAt,5,'skill',null);
    if(s.at<SG.Eco.capEnd(s)){
      cand(SG.Eco.capEnd(s),0,'sleep',null);
      tt=SG.Eco.nextStarve(s,r);if(tt!=null)cand(tt,0.5,'starve',null);
      var nf=SG.Eco.nextFull(s,r);if(nf)cand(nf.t,0.6,'full',nf);
    }
    SG.Eco.integrate(s,s.at,B.t);
    s.at=B.t;
    if(B.kind==='until')break;
    switch(B.kind){
      case 'job':i=s.q.indexOf(B.ref);if(i>=0)s.q.splice(i,1);jobDone(s,B.ref);break;
      case 'shmid':SG.Log.onMid(s,B.ref);break;
      case 'shret':SG.Log.onReturn(s,B.ref);break;
      case 'repair':B.ref.dmgUntil=0;PS.log(s,s.at,'build',SG.TUNE.bld[B.ref.type].ad+' onarıldı.');break;
      case 'plan':
        s.plan.list.shift();
        if(B.ref.kind==='att')SG.War.onAttack(s,B.ref);else SG.Ev.onPoll(s,B.ref);
        pruneEnded(s,s.at);break;
      case 'pend':SG.Ev.expire(s,B.ref,s.at);pruneEnded(s,s.at);break;
      case 'rkill':SG.AI.onGone(s,B.ref,s.at);break;
      case 'skill':die(s);break;
      case 'starve':s.res.food=0;PS.log(s,s.at,'eco','Gıda bitti: üretim yavaşladı.');break;
      case 'full':s.res[B.ref.k]=SG.Eco.cap(s);s.full[B.ref.k]=1;PS.log(s,s.at,'eco','Depo doldu: '+t.resAd[B.ref.k]+'.');break;
      case 'sleep':break;
    }
    if(s.dead)break;
  }
  return s;
};

/* ---------- oturum: çevrimiçi tick, açılış raporu ---------- */
PS.tick=function(s,now){
  if(s.dead)return s;
  now=Math.max(now,s.at);
  PS.resolve(s,now);
  if(now>s.seen)s.seen=now;
  return s;
};
PS.sync=function(s,now){PS.tick(s,now);return s.at;};
PS.open=function(s,now){
  if(s.dead)return null;
  now=Math.max(now,s.at);
  var at0=s.seen,res0=SG.K.copy(s.res),away=now-s.seen;
  PS.resolve(s,now);
  s.seen=Math.max(s.seen,now);
  var minMs=T().report.minMin*60000;
  if(away<minMs){s.lastReport=null;return null;}
  var lines=[],i,e,gained={},k;
  for(i=0;i<s.log.length;i++){e=s.log[i];if(e.t>at0&&e.t<=now)lines.push({t:e.t,kind:e.k,text:e.x});}
  for(k in s.res)gained[k]=Math.round((s.res[k]-res0[k])*10)/10;
  s.lastReport={from:at0,to:now,awayMs:away,capped:away>SG.Eco.capH(s)*H,lines:lines,gained:gained,spent:{},shown:false};
  return s.lastReport;
};
PS.report=function(s){return s.lastReport||null;};

/* ---------- gelecek olaylar (bildirim ve arayüz) ---------- */
PS.nextEvents=function(s,horizonMs){
  var out=[],i,j,t=T();
  SG.AI.ensurePlan(s,s.at+(horizonMs||t.planWindowH*H));
  s.q.forEach(function(j){out.push({t:j.t1,kind:'job',sub:j.kind,id:j.id});});
  s.fleet.forEach(function(f){if(f.state==='out')out.push({t:f.mid,kind:'ship',sub:'mid',id:f.id});if(f.state!=='idle')out.push({t:f.t1,kind:'ship',sub:f.state==='lost'?'rebuild':'return',id:f.id});});
  s.bld.forEach(function(b){if(b.dmgUntil>s.at)out.push({t:b.dmgUntil,kind:'repair',id:'b'+b.slot});});
  s.plan.list.forEach(function(e){out.push({t:e.at,kind:e.kind,id:e.id,type:e.type,m:e.m,warnAt:e.kind==='att'?e.at-t.warnMin*60000:null});});
  s.pend.forEach(function(p){if(p.state==='open'||p.state==='prep'||p.state==='ready')out.push({t:p.joinBy,kind:'pend',id:p.id,state:p.state});});
  s.rivals.forEach(function(r){if(r.state==='dying')out.push({t:r.killAt,kind:'rkill',id:r.id});});
  if(s.dying)out.push({t:s.dying.killAt,kind:'skill',id:'self'});
  var f=SG.Eco.fullAt(s);for(var k in f)if(f[k]!=null)out.push({t:f[k],kind:'full',id:k});
  out.sort(function(a,b){return a.t-b.t;});
  return out;
};

/* ---------- arayüz özeti ---------- */
PS.summary=function(s){
  var t=T(),r=SG.Eco.rates(s);
  return {at:s.at,seen:s.seen,name:s.name,civ:s.civ,res:s.res,rates:r,cap:SG.Eco.cap(s),pop:SG.Eco.pop(s),food:{starving:SG.Eco.starving(s,s.at)},
    troops:s.troops,troopCap:SG.Bld.troopCap(s),troopCount:SG.Bld.troopCount(s,true),
    def:SG.War.defPower(s,s.at),att:SG.War.attPower(s),war:s.war,dying:s.dying,dead:s.dead,
    uyku:SG.Eco.uyku(s),capEnd:SG.Eco.capEnd(s),fullAt:SG.Eco.fullAt(s),
    rivals:s.rivals.map(function(x){var o=SG.AI.info(x);o.intel=s.intel[x.id]||null;return o;}),
    fleet:SG.Log.list(s),q:s.q.slice(),pend:SG.Ev.openPend(s),slots:SG.Bld.list(s)};
};

/* ---------- eylemler ---------- */
function dead(s){return s.dead?{ok:false,err:'Gezegen yok oldu: yeni yumurta seçmelisin.'}:null;}
function act(s,now,fn){var d=dead(s);if(d)return d;var n=PS.sync(s,now);return fn(n);}
PS.build=function(s,slot,type,now){return act(s,now,function(n){return SG.Bld.build(s,slot,type,n);});};
PS.upgrade=function(s,slot,now){return act(s,now,function(n){return SG.Bld.upgrade(s,slot,n);});};
PS.cancel=function(s,qid,now){return act(s,now,function(n){return SG.Bld.cancel(s,qid,n);});};
PS.train=function(s,unit,cnt,now){return act(s,now,function(n){return SG.Bld.train(s,unit,cnt,n);});};
PS.collect=function(s,slot,now){return act(s,now,function(n){return SG.Bld.collect(s,slot,n);});};
PS.decide=function(s,pendId,decision,now){return act(s,now,function(n){return SG.Ev.decide(s,pendId,decision,n);});};
PS.scout=function(s,rivalId,now){return act(s,now,function(n){return SG.AI.scout(s,rivalId,n);});};
PS.attack=function(s,rivalId,maneuver,now){return act(s,now,function(n){return SG.War.launch(s,rivalId,maneuver,n);});};
PS.sendShip=function(s,rivalId,now){return act(s,now,function(n){return SG.Log.send(s,rivalId||null,n);});};
PS.rescue=function(s,now){return act(s,now,function(n){return SG.War.rescue(s,n);});};
PS.maneuver=function(s,id,m,now){var d=dead(s);if(d)return d;return SG.Ev.maneuver(s,id,m,now!=null?now:s.at);};

/* ---------- kayıt: sg3_<kullanıcı>_{p,b0..b2,hall,set} ---------- */
var ENV=1,NB=3,mem={},store=null,probed=false,lastStamp=0,lastBk={};
function enc(n){n=String(n).trim();var h='';function fnv(x){var q=2166136261>>>0;for(var i=0;i<x.length;i++){q^=x.charCodeAt(i);q=Math.imul(q,16777619)>>>0;}return q>>>0;}
  if(n.length>40){h='~'+fnv(n).toString(36);n=n.slice(0,40);}
  return n.replace(/[^A-Za-z0-9]/g,function(c){return'_'+c.charCodeAt(0).toString(16)+'_';})+h;}
function sum(str){return SG.K.hash(str).toString(36)+'.'+str.length.toString(36);}   // 07-save sum() ile aynı biçim
function pre(user){return 'sg3_'+enc(user)+'_';}
function getStore(){
  if(probed)return store;probed=true;
  try{var ls=window.localStorage;if(ls){var k='sg3__probe';ls.setItem(k,'1');ls.removeItem(k);store=ls;}}catch(e){store=null;}
  return store;
}
function rawGet(k){if(Object.prototype.hasOwnProperty.call(mem,k))return mem[k];var st=getStore();if(!st)return null;try{return st.getItem(k);}catch(e){return null;}}
function rawSet(k,v){var st=getStore();if(st){try{st.setItem(k,v);delete mem[k];return true;}catch(e){}}mem[k]=v;return false;}
function rawDel(k){delete mem[k];var st=getStore();if(st){try{st.removeItem(k);}catch(e){}}}
PS._store={reset:function(){mem={};store=null;probed=false;lastBk={};},mem:function(){return mem;},use:function(st){store=st;probed=true;}};
function isObj(o){return o&&typeof o==='object'&&!Array.isArray(o);}
function num(v,d){return(typeof v==='number'&&isFinite(v))?v:d;}
/* kayıttan gelen durumu doğrula ve eksik alanları tamamla */
PS.norm=function(s){
  if(!isObj(s)||s.v!==3||typeof s.seed!=='string'||!SG.Civ.get(s.civ))return null;
  var t=T(),k;
  s.at=num(s.at,NaN);s.born=num(s.born,NaN);s.seen=num(s.seen,s.at);
  if(!isFinite(s.at)||!isFinite(s.born))return null;
  if(!isObj(s.res))return null;
  t.res.forEach(function(k){s.res[k]=Math.max(0,num(s.res[k],0));});
  ['bld','fleet','q','pend','popq','log'].forEach(function(a){if(!Array.isArray(s[a]))s[a]=[];});
  if(!isObj(s.troops))s.troops={};
  t.unitOrder.forEach(function(u){s.troops[u]=Math.max(0,Math.floor(num(s.troops[u],0)));});
  if(!isObj(s.plan)||!Array.isArray(s.plan.list))s.plan={cursor:0,list:[]};
  s.plan.cursor=Math.max(0,Math.floor(num(s.plan.cursor,0)));
  if(!Array.isArray(s.rivals)||s.rivals.length!==t.rivalCount)return null;
  if(!isObj(s.war))s.war={streak:0,lastDefeatAt:0,shieldUntil:0,wins:0,losses:0};
  if(!isObj(s.intel))s.intel={};if(!isObj(s.stats))s.stats={};if(!isObj(s.full))s.full={};
  s.seq=Math.floor(num(s.seq,0));s.rev=Math.floor(num(s.rev,0));
  if(s.dying&&!isFinite(num(s.dying.killAt,NaN)))s.dying=null;
  s.bld=s.bld.filter(function(b){return isObj(b)&&t.bld[b.type]&&b.slot>=0&&b.slot<t.slots;});
  s.bld.forEach(function(b){b.lv=Math.max(0,Math.min(t.maxLv,Math.floor(num(b.lv,0))));b.dmgUntil=num(b.dmgUntil,0);b.colAt=num(b.colAt,0);b.job=b.job||0;});
  return s;
};
function stamp(){var n=SG.Clock.now();if(n<=lastStamp)n=lastStamp+1;return(lastStamp=n);}
function pack(s){
  var d;try{d=JSON.stringify(s);}catch(e){return null;}
  if(!d||d.length>T().save.maxBytes)return null;
  var m=sum(d);
  return {d:d,sum:m,env:JSON.stringify({f:ENV,v:3,sum:m,saved:stamp(),d:d})};
}
function parseEnv(raw){
  if(typeof raw!=='string')return null;
  try{var e=JSON.parse(raw);if(isObj(e)&&e.f===ENV&&typeof e.d==='string'&&e.sum===sum(e.d))return e;}catch(x){}
  return null;
}
function unpack(raw){
  var e=parseEnv(raw);if(!e)return null;
  var s;try{s=JSON.parse(e.d);}catch(x){return null;}
  s=PS.norm(s);if(!s)return null;
  return {s:s,saved:typeof e.saved==='number'?e.saved:0};
}
function bks(user){
  var out=[],i,raw,e;
  for(i=0;i<NB;i++){raw=rawGet(pre(user)+'b'+i);if(raw==null)continue;e=parseEnv(raw);out.push({ix:i,raw:raw,saved:e?e.saved:-1,valid:!!e});}
  return out;
}
PS.save=function(s){
  try{
    if(!s||!s.user)return false;
    s.rev++;
    var p=pack(s);if(!p){s.rev--;return false;}
    var u=s.user,key=pre(u)+'p',cur=rawGet(key);
    if(cur!=null&&parseEnv(cur)){
      var l=bks(u),last=0;l.forEach(function(b){if(b.saved>last)last=b.saved;});
      var now=SG.Clock.now();
      if(!l.length||now-Math.max(last,lastBk[u]||0)>T().save.backupGapMs){
        var slot=-1,i;
        for(i=0;i<NB;i++)if(!l.some(function(b){return b.ix===i;})){slot=i;break;}
        if(slot<0){var old=Infinity;l.forEach(function(b){if(b.saved<old){old=b.saved;slot=b.ix;}});}
        rawSet(pre(u)+'b'+slot,cur);lastBk[u]=now;
      }
    }
    var ok=rawSet(key,p.env);
    if(s.dead&&s.hallRec&&!s.hallDone){PS.hallAdd(u,s.hallRec);s.hallDone=true;}
    return ok;
  }catch(e){try{SG.log&&SG.log.err('PS.save',e);}catch(_){}return false;}
};
PS.load=function(userKey){
  PS.lastLoad={recovered:false,from:'p'};
  try{
    var raw=rawGet(pre(userKey)+'p'),r=raw!=null?unpack(raw):null;
    if(r)return r.s;
    var l=bks(userKey).filter(function(b){return b.valid;}).sort(function(a,b){return b.saved-a.saved;}),i;
    for(i=0;i<l.length;i++){
      var rr=unpack(l[i].raw);
      if(rr){PS.lastLoad={recovered:true,from:'b'+l[i].ix,corrupt:raw!=null};rawSet(pre(userKey)+'p',l[i].raw);return rr.s;}
    }
    PS.lastLoad={recovered:false,from:null,corrupt:raw!=null};
  }catch(e){try{SG.log&&SG.log.err('PS.load',e);}catch(_){}}
  return null;
};
PS.clear=function(userKey){var p=pre(userKey),i;rawDel(p+'p');for(i=0;i<NB;i++)rawDel(p+'b'+i);delete lastBk[userKey];};
PS.hall=function(userKey){
  var raw=rawGet(pre(userKey)+'hall');
  try{var a=raw?JSON.parse(raw):[];return Array.isArray(a)?a:[];}catch(e){return [];}
};
PS.hallAdd=function(userKey,rec){var a=PS.hall(userKey);a.push(rec);if(a.length>200)a.shift();rawSet(pre(userKey)+'hall',JSON.stringify(a));return a;};
PS.settings=function(userKey){try{var o=JSON.parse(rawGet(pre(userKey)+'set')||'{}');return isObj(o)?o:{};}catch(e){return {};}};
PS.setSettings=function(userKey,o){rawSet(pre(userKey)+'set',JSON.stringify(o||{}));return o;};
/* yok olmuş gezegenin yerine yeni yumurta: kaydı siler, sıfır miras */
PS.newLife=function(userKey,now,opts){PS.clear(userKey);return PS.create(userKey,now,opts);};
PS.keyOf=function(userKey,part){return pre(userKey)+part;};
})();
