/* SpacEgg 2.0 — SG.Disc: keşifler, kararlar (neden-sonuç), rozetler. Para/enerji yok. */
(function(){
'use strict';
var DATA=null,BYID={},ACT={},BADGES=[],CATS=[];
var LAST=typeof WeakMap!=='undefined'?new WeakMap():null;
var CLAMP={atm:[0,2],water:[0,2],albedo:[0.05,0.95]};

function load(){
  if(DATA)return DATA;
  try{var el=typeof document!=='undefined'&&document.getElementById('d-disc');if(el&&el.textContent)DATA=JSON.parse(el.textContent);}catch(e){SG.log.err('disc.load',e);}
  if(!DATA&&SG.D&&SG.D.disc)DATA=SG.D.disc;
  if(!DATA){DATA={discoveries:[],actions:[],badges:[]};SG.log.err('disc','veri (#d-disc) yok');}
  DATA.discoveries.forEach(function(d){BYID[d.id]=d;if(CATS.indexOf(d.cat)<0)CATS.push(d.cat);});
  DATA.actions.forEach(function(a){ACT[a.id]=a;});
  BADGES=DATA.badges||[];
  return DATA;
}
function kindOf(id){
  if(/^g\d+$/.test(id))return'g';
  if(/^g\d+s\d+$/.test(id))return's';
  if(/^g\d+s\d+p\d+$/.test(id))return'p';
  if(/^g\d+s\d+p\d+m\d+$/.test(id))return'm';
  return null;
}
function sysId(pid){var m=/^(g\d+s\d+)p\d+/.exec(pid);return m?m[1]:null;}
function galId(id){var m=/^(g\d+)/.exec(id);return m?m[1]:null;}
function st(uni){
  var s=uni.state||(uni.state={});
  s.observed=s.observed||{};s.params=s.params||{};s.decisions=s.decisions||[];s.disc=s.disc||{};
  s.events=s.events||[];s.journal=s.journal||[];
  s.flags=s.flags||{};s.scales=s.scales||{};s.speedsSeen=s.speedsSeen||{};s.base=s.base||{};
  return s;
}
function isBadgeKey(k){return k.indexOf('b_')===0;}
function discDone(s){var n=0;for(var k in s.disc)if(!isBadgeKey(k))n++;return n;}
function find(uni,id){try{return SG.U&&SG.U.find?SG.U.find(uni,id):null;}catch(e){SG.log.err('disc.find',e);return null;}}
function climateOf(uni,pid,p,params){
  try{
    var sid=sysId(pid),star=null;
    if(SG.U.system&&sid){var sy=SG.U.system(uni,sid);star=sy&&sy.star;}
    var pp=params||st(uni).params[pid]||{atm:p.atm,water:p.water,albedo:p.albedo};
    var c=SG.U.climate(p,pp,star);
    if(c&&typeof c.temp==='number')return c;
  }catch(e){SG.log.err('disc.climate',e);}
  return {temp:p.temp,habScore:p.habScore,label:''};
}

/* ---- Bağlam: bir değerlendirme turunda önbellekli türetilmiş veriler ---- */
function ctx(uni){
  var s=st(uni),c={uni:uni,s:s},cache={};
  function obsIds(kind,lv){var r=[];for(var id in s.observed){if(s.observed[id]>=(lv||1)&&(!kind||kindOf(id)===kind))r.push(id);}return r;}
  c.obsIds=obsIds;
  c.objs=function(kind){
    if(cache[kind])return cache[kind];
    var out=[];obsIds(kind,1).forEach(function(id){var o=find(uni,id);if(o)out.push(o);});
    return cache[kind]=out;
  };
  c.climates=function(){
    if(cache.cl)return cache.cl;
    var out=[];c.objs('p').forEach(function(p){var cl=climateOf(uni,p.id,p);out.push({p:p,temp:cl.temp,hab:cl.habScore});});
    return cache.cl=out;
  };
  return c;
}
function cnt(v,def){return typeof v==='number'?v:(v&&v.min!=null?v.min:def);}
var K={
  observed:function(v,c){var lv=v.level||1,n=0,o=c.s.observed;for(var id in o){if(o[id]>=lv&&(!v.kind||kindOf(id)===v.kind))n++;}return n>=(v.min||1);},
  gkind:function(v,c){var n=0;c.objs('g').forEach(function(g){if(g.kind===v.kind)n++;});return n>=(v.min||1);},
  scls:function(v,c){var n=0;c.objs('s').forEach(function(x){if(x.cls===v.cls)n++;});return n>=(v.min||1);},
  sphase:function(v,c){var n=0;c.objs('s').forEach(function(x){if(x.phase===v.phase)n++;});return n>=(v.min||1);},
  ptype:function(v,c){var n=0;c.objs('p').forEach(function(x){if(x.type===v.type)n++;});return n>=(v.min||1);},
  habZone:function(v,c){var n=0;c.objs('p').forEach(function(x){if(x.habZone)n++;});return n>=(v===true?1:cnt(v,1));},
  habScore:function(v,c){return c.climates().some(function(x){return x.hab>=v.min;});},
  temp:function(v,c){return c.climates().some(function(x){return x.temp>=(v.min==null?-1e9:v.min)&&x.temp<=(v.max==null?1e9:v.max);});},
  moons:function(v,c){var m=cnt(v,1);return c.objs('p').some(function(x){return x.moons&&x.moons.length>=m;});},
  spread:function(v,c){var g={};c.obsIds('s',1).forEach(function(id){g[galId(id)]=1;});return Object.keys(g).length>=cnt(v,1);},
  event:function(v,c){var t=typeof v==='string'?v:v.type,m=typeof v==='string'?1:(v.min||1),n=0;c.s.events.forEach(function(e){if(e.type===t)n++;});return n>=m;},
  events:function(v,c){return c.s.events.length>=cnt(v,1);},
  eventKinds:function(v,c){var k={};c.s.events.forEach(function(e){k[e.type]=1;});return Object.keys(k).length>=cnt(v,1);},
  decided:function(v,c){var a=typeof v==='string'?v:v.action,m=typeof v==='string'?1:(v.min||1),n=0;c.s.decisions.forEach(function(d){if(d.action===a)n++;});return n>=m;},
  decisions:function(v,c){return c.s.decisions.length>=cnt(v,1);},
  decidedKinds:function(v,c){var k={};c.s.decisions.forEach(function(d){k[d.action]=1;});return Object.keys(k).length>=cnt(v,1);},
  reverted:function(v,c){var n=0;c.s.decisions.forEach(function(d){if(d.rev)n++;});return n>=cnt(v,1);},
  scale:function(v,c){return !!c.s.scales[v];},
  scales:function(v,c){return Object.keys(c.s.scales).length>=cnt(v,1);},
  t:function(v,c){return c.uni.t>=(v.min||0);},
  speed:function(v,c){return !!c.s.speedsSeen[v.ix];},
  flag:function(v,c){return !!c.s.flags[v];},
  count:function(v,c){var n=0;for(var k in c.s.disc){if(isBadgeKey(k))continue;var d=BYID[k];if(d&&d.cat===v.cat)n++;}return n>=(v.min||1);},
  total:function(v,c){return discDone(c.s)>=cnt(v,1);},
  disc:function(v,c){return !!c.s.disc[v];},
  any:function(v,c){return v.some(function(n){return ev(n,c);});},
  all:function(v,c){return v.every(function(n){return ev(n,c);});}
};
function ev(need,c){
  if(!need)return true;
  for(var k in need){
    var f=K[k];
    if(!f){SG.log.err('disc','bilinmeyen koşul: '+k);return false;}
    var ok=false;try{ok=f(need[k],c);}catch(e){SG.log.err('disc.ev:'+k,e);}
    if(!ok)return false;
  }
  return true;
}
/* kısmi ilerleme 0..1 (tek anahtarlı basit koşullar için; yoksa null) */
function prog(need,c){
  try{
    var ks=Object.keys(need);if(ks.length!==1)return null;var k=ks[0],v=need[k];
    if(k==='observed'){var lv=v.level||1,n=0,o=c.s.observed;for(var id in o){if(o[id]>=lv&&(!v.kind||kindOf(id)===v.kind))n++;}return Math.min(1,n/(v.min||1));}
    if(k==='t')return Math.min(1,c.uni.t/(v.min||1));
    if(k==='events')return Math.min(1,c.s.events.length/cnt(v,1));
    if(k==='decisions')return Math.min(1,c.s.decisions.length/cnt(v,1));
    if(k==='scales')return Math.min(1,Object.keys(c.s.scales).length/cnt(v,1));
    if(k==='total')return Math.min(1,discDone(c.s)/cnt(v,1));
    if(k==='count'){var n2=0;for(var q in c.s.disc){var d=BYID[q];if(!isBadgeKey(q)&&d&&d.cat===v.cat)n2++;}return Math.min(1,n2/(v.min||1));}
  }catch(e){}
  return null;
}

/* ---- Ölçek/hız/bayrak bildirimleri (HUD çağırır) ---- */
function noteScale(uni,scale){if(!uni||!scale)return;var s=st(uni);if(!s.scales[scale]){s.scales[scale]=1;SG.Disc.check(uni);}}
function noteSpeed(uni,ix){if(!uni)return;var s=st(uni);if(!s.speedsSeen[ix]){s.speedsSeen[ix]=1;SG.Disc.check(uni);}}
function flag(uni,name){if(!uni||!name)return;var s=st(uni);if(!s.flags[name]){s.flags[name]=1;SG.Disc.check(uni);}}

function sig(uni,s){
  var n=0,lv=0;for(var k in s.observed){n++;lv+=s.observed[k];}
  return [n,lv,s.events.length,s.decisions.length,Object.keys(s.scales).length,Object.keys(s.speedsSeen).length,Object.keys(s.flags).length,Math.floor((uni.t||0)/10),Object.keys(s.disc).length,uni.speedIx].join('|');
}
function pubDef(d){return {id:d.id,title:d.title,desc:d.desc,cat:d.cat,hint:d.hint,tier:d.tier};}

/* ---- Kontrol: yeni açılan keşifleri döndürür ---- */
function check(uni){
  load();if(!uni)return[];
  var s=st(uni);
  if(typeof uni.speedIx==='number')s.speedsSeen[uni.speedIx]=1;
  var sg=sig(uni,s);
  if(LAST&&LAST.get(uni)===sg)return[];
  var out=[],c,pass,again=true;
  for(pass=0;pass<6&&again;pass++){
    again=false;c=ctx(uni);
    DATA.discoveries.forEach(function(d){
      if(s.disc[d.id])return;
      if(ev(d.need,c)){
        s.disc[d.id]=Date.now();again=true;out.push(pubDef(d));
        s.journal.push({t:uni.t,kind:'kesif',text:'Keşif: '+d.title+' — '+d.desc,target:null});
        try{SG.bus.emit('disc:unlock',pubDef(d));}catch(e){}
      }
    });
  }
  /* rozetler */
  c=ctx(uni);
  BADGES.forEach(function(b){
    var key='b_'+b.id;
    if(!s.disc[key]&&ev(b.need,c)){
      s.disc[key]=Date.now();
      s.journal.push({t:uni.t,kind:'rozet',text:'Rozet: '+b.title,target:null});
      try{SG.bus.emit('disc:badge',{id:b.id,title:b.title,desc:b.desc});}catch(e){}
    }
  });
  if(s.journal.length>400)s.journal.splice(0,s.journal.length-400);
  if(LAST)LAST.set(uni,sig(uni,s));
  return out;
}

/* ---- Liste / ilerleme ---- */
function list(uni){
  load();var s=uni?st(uni):null;
  return DATA.discoveries.map(function(d){
    var done=!!(s&&s.disc[d.id]),o=pubDef(d);
    if(s){o.done=done;o.at=done?s.disc[d.id]:null;}
    if(s&&d.secret&&!done){o.title='???';o.desc='Gizli keşif.';o.hint='';o.secret=true;}
    return o;
  });
}
function progress(uni){
  load();var s=st(uni),by={},done=0;
  DATA.discoveries.forEach(function(d){var b=by[d.cat]||(by[d.cat]={done:0,total:0});b.total++;if(s.disc[d.id]){b.done++;done++;}});
  var be=0;BADGES.forEach(function(b){if(s.disc['b_'+b.id])be++;});
  return {done:done,total:DATA.discoveries.length,byCat:by,badges:{earned:be,total:BADGES.length},title:title(uni)};
}
function badges(uni){
  load();var s=st(uni);
  return BADGES.map(function(b){return {id:b.id,title:b.title,desc:b.desc,earned:!!s.disc['b_'+b.id],at:s.disc['b_'+b.id]||null};});
}
function title(uni){
  load();var s=st(uni),t='Yeni Gözlemci';
  BADGES.forEach(function(b){if(s.disc['b_'+b.id])t=b.title;});
  return t;
}

/* ---- Hedefler: en çok 3 ipucu, merak kademesi ---- */
function goals(uni){
  load();var s=st(uni),done=discDone(s),maxTier=1+Math.floor(done/7);
  var c=ctx(uni),pool=DATA.discoveries.filter(function(d){return !s.disc[d.id]&&!d.secret&&(d.tier||1)<=maxTier;});
  var h=SG.hash(String(uni.seed||uni.id||'x'));
  pool.sort(function(a,b){
    if((a.tier||1)!==(b.tier||1))return(a.tier||1)-(b.tier||1);
    return(SG.hash(a.id)^h)-(SG.hash(b.id)^h);
  });
  var pick=[],cats={};
  pool.forEach(function(d){if(pick.length<3&&!cats[d.cat]){cats[d.cat]=1;pick.push(d);}});
  pool.forEach(function(d){if(pick.length<3&&pick.indexOf(d)<0)pick.push(d);});
  return pick.map(function(d){return {id:d.id,cat:d.cat,hint:d.hint,progress:prog(d.need,c)};});
}

/* ---- Kararlar ---- */
function n2(x){return(Math.round(x*100)/100).toFixed(2).replace('.',',');}
function planetBase(uni,pid,p){
  var s=st(uni);
  if(!s.base[pid])s.base[pid]={atm:p.atm,water:p.water,albedo:p.albedo};
  return s.base[pid];
}
function curParams(uni,pid,p){
  var s=st(uni),pp=s.params[pid];
  if(pp)return {atm:pp.atm,water:pp.water,albedo:pp.albedo};
  return {atm:p.atm,water:p.water,albedo:p.albedo};
}
function actions(uni,targetId){
  load();var s=st(uni),k=kindOf(targetId);if(k!=='p'&&k!=='g')return[];
  var lvl=s.observed[targetId]||0;
  return DATA.actions.filter(function(a){return a.target===k;}).map(function(a){
    var o={id:a.id,label:a.label,desc:a.desc,tag:a.tag,why:a.why,reverse:a.reverse||null,level:a.level||1,disabled:false};
    if(lvl<(a.level||1)){o.disabled=true;o.reason=lvl<1?'Önce gözlemle.':'Daha derin gözlem gerekir (seviye '+(a.level||1)+').';}
    return o;
  });
}
function applyOne(uni,pid,p,a){
  var s=st(uni),base=planetBase(uni,pid,p),before=curParams(uni,pid,p),after={atm:before.atm,water:before.water,albedo:before.albedo};
  if(a.restore){after={atm:base.atm,water:base.water,albedo:base.albedo};}
  else for(var key in a.delta){var r=CLAMP[key];after[key]=Math.round(SG.clamp(before[key]+a.delta[key],r[0],r[1])*100)/100;}
  var changed=['atm','water','albedo'].some(function(q){return Math.abs(after[q]-before[q])>1e-9;});
  if(!changed)return null;
  var c0=climateOf(uni,pid,p,before),c1=climateOf(uni,pid,p,after);
  s.params[pid]=after;
  var eff=[];
  ['atm','water','albedo'].forEach(function(q){if(Math.abs(after[q]-before[q])>1e-9)eff.push({k:q,from:before[q],to:after[q],target:pid});});
  eff.push({k:'temp',from:Math.round(c0.temp),to:Math.round(c1.temp),target:pid});
  eff.push({k:'habScore',from:Math.round(c0.habScore*100)/100,to:Math.round(c1.habScore*100)/100,target:pid});
  if(c0.habScore<0.5&&c1.habScore>=0.5)s.flags['made-habitable']=1;
  if(c0.habScore>=0.5&&c1.habScore<0.5)s.flags['lost-habitable']=1;
  return {pid:pid,eff:eff,c0:c0,c1:c1};
}
function apply(uni,targetId,actionId){
  load();if(!uni)return {ok:false,message:'Evren yok.',effects:[]};
  var s=st(uni),a=ACT[actionId],k=kindOf(targetId);
  if(!a)return {ok:false,message:'Bilinmeyen karar.',effects:[]};
  if(k!==a.target)return {ok:false,message:'Bu karar bu hedefe uygulanamaz.',effects:[]};
  var lvl=s.observed[targetId]||0;
  if(lvl<1)return {ok:false,message:'Önce gözlemle: bilmediğin bir şeye karar veremezsin.',effects:[]};
  if(lvl<(a.level||1))return {ok:false,message:'Daha derin gözlem gerekir (seviye '+(a.level||1)+').',effects:[]};
  var res=[],msg;
  if(k==='p'){
    var p=find(uni,targetId);if(!p)return {ok:false,message:'Gezegen bulunamadı.',effects:[]};
    var r=applyOne(uni,targetId,p,a);
    if(!r)return {ok:false,message:'Bu değer sınıra ulaştı; daha fazla değiştirilemez.',effects:[]};
    res.push(r);
    var t0=Math.round(r.c0.temp),t1=Math.round(r.c1.temp);
    msg=a.why+' Sıcaklık '+t0+' K → '+t1+' K, yaşanabilirlik %'+Math.round(r.c0.habScore*100)+' → %'+Math.round(r.c1.habScore*100)+'.';
  }else{
    var ids=Object.keys(s.observed).filter(function(id){return kindOf(id)==='p'&&galId(id)===targetId&&s.observed[id]>=1;});
    if(!ids.length)return {ok:false,message:'Önce bu galaksideki bir gezegeni gözlemle.',effects:[]};
    ids.forEach(function(pid){var p=find(uni,pid);if(!p)return;var r=applyOne(uni,pid,p,a);if(r)res.push(r);});
    if(!res.length)return {ok:false,message:'Bu galaksideki gezegenlerde değer sınıra ulaştı.',effects:[]};
    var up=0,dn=0;res.forEach(function(r){if(r.c1.temp>r.c0.temp)up++;else if(r.c1.temp<r.c0.temp)dn++;});
    msg=a.why+' '+res.length+' gezegen etkilendi: '+up+' tanesi ısındı, '+dn+' tanesi soğudu.';
  }
  var effects=[];res.forEach(function(r){effects=effects.concat(r.eff);});
  if(effects.length>40)effects=effects.slice(0,40);
  var rev=!!a.restore;
  /* ters karar mı? (bir kararın reverse'ü olarak tanımlanmış) */
  for(var id in ACT){if(ACT[id].reverse===actionId&&ACT[id].target===a.target){var used=s.decisions.some(function(d){return d.action===id&&d.target===targetId;});if(used)rev=true;}}
  s.decisions.push({t:uni.t,target:targetId,action:actionId,rev:rev?1:0});
  s.journal.push({t:uni.t,kind:'karar',text:a.label+': '+msg,target:targetId});
  var unlocked=check(uni);
  try{SG.bus.emit('d:decision',{target:targetId,action:actionId,effects:effects});}catch(e){}
  return {ok:true,message:msg,effects:effects,unlocked:unlocked};
}

SG.Disc={
  list:list,progress:progress,check:check,actions:actions,apply:apply,goals:goals,
  badges:badges,title:title,noteScale:noteScale,noteSpeed:noteSpeed,flag:flag,
  byId:function(id){load();return BYID[id]||null;},
  categories:function(){load();return CATS.slice();},
  _kind:kindOf
};
})();
