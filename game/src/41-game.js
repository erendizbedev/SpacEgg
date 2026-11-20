/* SpacEgg v1.0 — oyun mantığı (SG.G) */
/* Teşekkür: bazı fikirler (uygulanan miktar dönüşü, maliyet eğrisi, süreli buff) continuum-engine'den (MIT, Peter Mares) esinlendi; kod kopyalanmadı. */
(function(){
'use strict';
var SG=window.SG,G=SG.G;
var VER=1,TYPES_ORDER=['sav','med','loj','yik','yar'],SPEEDS=[1,5,20,60],MAXL=50;
var U=null,NAME='',off=0,dirty=false,saveT=0,secT=0,lastBadge=0,report=null,galCache={};
G.version=VER;
function now(){return SG.now()+off;}
G.now=now;
function D(){return SG.D||{};}
function TYPE(id){return(D().TYPES||{})[id]||null;}
function EGG(id){var a=D().EGGS||[];for(var i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null;}
function emit(e,d){SG.bus.emit(e,d);}
function snd(id){emit('sound',id);}
function toast(text,icon,color,kind){emit('toast',{text:text,icon:icon||'notify',color:color||'',kind:kind||'info'});}
function fx(name,params){emit('fx',{name:name,params:params||{}});}
function num(v,d){return(typeof v==='number'&&isFinite(v))?v:(d||0);}
/* ---------- süre ölçeği (50 seviye ≈ 23,5 saat) ---------- */
var CUM=[];
(function(){var lo=1.0001,hi=1.3,T=23.54*3600,g;
  for(var i=0;i<60;i++){g=(lo+hi)/2;var s=150*(Math.pow(g,49)-1)/(g-1);if(s>T)hi=g;else lo=g;}
  var acc=0;CUM[0]=0;for(var n=1;n<=MAXL;n++){acc+=150*Math.pow(g,n-1);CUM[n]=acc;} /* CUM[n]: n. seviyeden çıkmak için gereken toplam süre */
  G.durOf=function(n){return 150*Math.pow(g,n-1);};
})();
G.cum=function(n){return CUM[SG.clamp(n,0,MAXL)];};
function lvF(l){return 1+0.07*l;}
/* ---------- hesap ---------- */
function users(){return SG.store.get('users',{})||{};}
function putUsers(u){SG.store.set('users',u);}
function ph(name,pass){return SG.hash(String(name).toLowerCase()+':'+pass+':sg1');}
function validName(n){return /^[a-z0-9_]{3,16}$/.test(n);}
function newUser(name){
  return{v:VER,name:name,created:now(),last:now(),coins:1000,xp:0,plvl:1,eggsOwned:[],planets:[],active:null,badges:[],
    settings:{vol:0.8,music:true,fx:true,quality:'auto',rm:false},mc:{},ms:{},story:{read:{},dec:{}},log:[],nextId:1};
}
function normalize(u){
  u.v=VER;u.coins=num(u.coins,0);u.xp=num(u.xp,0);u.plvl=u.plvl||1;u.eggsOwned=u.eggsOwned||[];u.planets=u.planets||[];
  u.badges=u.badges||[];u.settings=Object.assign({vol:0.8,music:true,fx:true,quality:'auto',rm:false},u.settings||{});
  u.mc=u.mc||{};u.ms=u.ms||{};u.story=u.story||{read:{},dec:{}};u.story.read=u.story.read||{};u.story.dec=u.story.dec||{};u.log=u.log||[];
  u.planets.forEach(function(p){
    p.res=p.res||{};p.stats=p.stats||{};p.devs=p.devs||{};p.cd=p.cd||{};p.sats=p.sats||[];p.log=p.log||[];p.friends=p.friends||[];
    p.rel=p.rel||{};p.unl=p.unl||{};p.pending=p.pending||[];p.speed=SPEEDS.indexOf(p.speed)>=0?p.speed:1;p.t=num(p.t);p.xp=num(p.xp);
    p.buffs=Array.isArray(p.buffs)?p.buffs.filter(function(b){return b&&typeof b.k==='string'&&isFinite(b.until);}):[];p.lvl=SG.clamp(p.lvl||1,1,MAXL);p.evT=num(p.evT,40);p.lastEv=p.lastEv||'';p.nat=p.nat||0;
  });
  if(!u.active||!getP(u.active,u))u.active=u.planets.length?u.planets[0].id:null;
  return u;
}
function getP(id,u){u=u||U;if(!u)return null;for(var i=0;i<u.planets.length;i++)if(u.planets[i].id===id)return u.planets[i];return null;}
G.hasAccount=function(name){name=String(name||'').toLowerCase();return !!users()[name]||name==='demo';};
G.register=function(name,pass){
  name=String(name||'').toLowerCase().trim();pass=String(pass||'');
  if(!validName(name))return{ok:false,err:'Kullanıcı adı 3-16 karakter; yalnızca a-z, 0-9 ve _ olabilir.'};
  if(pass.length<4)return{ok:false,err:'Parola en az 4 karakter olmalı.'};
  var us=users();if(us[name])return{ok:false,err:'Bu kullanıcı adı zaten kayıtlı.'};
  U=newUser(name);NAME=name;us[name]={h:ph(name,pass),d:U};putUsers(us);SG.store.del('session');report=null;afterLogin(false);
  return{ok:true,name:name,first:true};
};
G.login=function(name,pass){
  name=String(name||'').toLowerCase().trim();pass=String(pass||'');
  var us=users();
  if(name==='demo'&&!us.demo){var d=newUser('demo');d.coins=2000;us.demo={h:ph('demo','demo'),d:d};putUsers(us);}
  var rec=us[name];
  if(!rec){return{ok:false,err:name==='doktor'?'Doktor hesabı henüz oluşturulmadı: "Kayıt ol" ile parolanı belirle.':'Böyle bir kullanıcı yok. Kayıt ol.',needRegister:true};}
  if(rec.h!==ph(name,pass))return{ok:false,err:'Parola yanlış.'};
  U=normalize(rec.d);NAME=name;SG.store.del('session');report=null;afterLogin(true);return{ok:true,name:name};
};
G.logout=function(){
  try{SG.S&&SG.S.save&&SG.S.save();SG.S&&SG.S.setUser&&SG.S.setUser(null);}catch(e){}
  save();U=null;NAME='';hiddenAt=0;report=null;SG.store.del('session');galCache={};
  try{SG.A&&SG.A.music&&SG.A.music.stop&&SG.A.music.stop();}catch(e){}
  emit('view',{name:'logout'});
  try{if(SG.current&&SG.current()!=='login')SG.go('login');}catch(e){}
  return{ok:true};
};
G.user=function(){return U;};
G.name=function(){return NAME;};
function afterLogin(restore){
  normalize(U);galCache={};
  var gap=Math.max(0,(now()-num(U.last,now()))/1000);
  if(restore&&gap>20)offline(Math.min(gap,7*86400));
  U.planets.forEach(function(p){p.speed=1;});
  U.last=now();save();emit('coins',{coins:U.coins});emit('xp',{xp:U.xp,plvl:U.plvl});
}
G.init=function(){
  if(G._inited)return;G._inited=true;
  /* Oturum yalnızca bu sayfa örneğinin belleğinde yaşar: açılışta eski oturum geri yüklenmez, her açılışta kullanıcı kendi girer. */
  SG.store.del('session');U=null;NAME='';report=null;
  if(SG.loop)SG.loop.add('game',G.tick);
  bindVis();
};
/* sekme gizlenince kaydet; görünür olunca geçen süreyi offline() ile işle (gizliyken döngü durur) */
var hiddenAt=0,visBound=false;
function catchUp(){
  var h=hiddenAt;hiddenAt=0;if(!U||!h)return;
  var gap=Math.max(0,(now()-h)/1000);if(gap<=20)return;
  U.last=h;offline(Math.min(gap,7*86400));U.last=now();save();
  emit('coins',{coins:U.coins});emit('xp',{xp:U.xp,plvl:U.plvl,need:plNeed(U.plvl)});emit('res',{id:(G.planet()||{}).id,res:(G.planet()||{}).res});
  emit('offline',{report:report,secs:gap});
  if(report&&(report.lvl||report.coins||report.events))toast('Sen yokken '+SG.fmt.dur(gap)+' geçti'+(report.lvl?' · +'+report.lvl+' seviye':'')+(report.coins?' · +'+SG.fmt.num(report.coins)+' para':''),'planet','','info');
}
function onVis(){
  if(!U)return;
  if(document.hidden){hiddenAt=now();save();}else catchUp();
}
function bindVis(){if(visBound||typeof document==='undefined')return;visBound=true;document.addEventListener('visibilitychange',onVis);}
/* ---------- kayıt ---------- */
function save(){
  if(!U)return false;try{U.last=now();var us=users();var rec=us[NAME];if(!rec)return false;rec.d=U;putUsers(us);dirty=false;return true;}catch(e){SG.log.err('save',e);return false;}
}
G.save=save;
G.exportBackup=function(){if(!U)return'';var us=users();return JSON.stringify({sg:'SpacEgg',v:VER,name:NAME,h:us[NAME]?us[NAME].h:0,d:U});};
G.importBackup=function(txt){
  try{var o=typeof txt==='string'?JSON.parse(txt):txt;
    if(!o||o.sg!=='SpacEgg'||!o.d||!validName(String(o.name)))return{ok:false,err:'Geçersiz yedek dosyası.'};
    var us=users();var cur=us[o.name];if(cur&&NAME!==o.name&&cur.h!==o.h)return{ok:false,err:'Bu ad başka bir hesaba ait.'};
    us[o.name]={h:o.h,d:normalize(o.d)};putUsers(us);U=us[o.name].d;NAME=o.name;SG.store.del('session');report=null;galCache={};
    emit('coins',{coins:U.coins});return{ok:true,name:NAME};
  }catch(e){return{ok:false,err:'Yedek okunamadı.'};}
};
G.settings=function(){return U?U.settings:{};};
G.setSettings=function(o){if(!U)return;Object.assign(U.settings,o||{});dirty=true;};
/* ---------- oyuncu XP ---------- */
function plNeed(n){return Math.round(40*Math.pow(1.3,n-1));}
G.plNeed=plNeed;
function addXP(n){
  if(!U||!n)return;U.xp+=n;var up=false;
  while(U.xp>=plNeed(U.plvl)&&U.plvl<99){U.xp-=plNeed(U.plvl);U.plvl++;up=true;U.coins+=50*U.plvl;snd('plvlup');emit('plvl',{plvl:U.plvl});toast('Oyuncu seviyesi '+U.plvl+' · +'+(50*U.plvl)+' para','levelup','#FFD400','levelup');emit('coins',{coins:U.coins});}
  emit('xp',{xp:U.xp,plvl:U.plvl,need:plNeed(U.plvl)});dirty=true;
}
function addCoins(n){if(!U||!n)return;U.coins=Math.max(0,U.coins+n);emit('coins',{coins:U.coins,delta:n});dirty=true;}
function mc(k,n){if(!U)return;U.mc[k]=(U.mc[k]||0)+(n==null?1:n);}
/* ---------- gezegen oluşturma ---------- */
function coordFor(seed,gal){var r=SG.rng(seed^0x5a5a);var g=gal||(1+Math.floor(r()*9));return{gal:g,coord:'G'+g+'·'+(100+Math.floor(r()*900))+'·'+(100+Math.floor(r()*900))+'·'+(1+Math.floor(r()*99))};}
G.buyEgg=function(eggId){
  if(!U)return{ok:false,err:'Giriş yapılmamış.'};var e=EGG(eggId);if(!e)return{ok:false,err:'Yumurta bulunamadı.'};
  if(U.coins<e.price)return{ok:false,err:'Yeterli para yok (test modu parası).'};
  addCoins(-e.price);U.eggsOwned.push(e.id);mc('buyegg');snd('coin');toast(e.name+' yumurtası alındı (TEST MODU)','egg','','ok');save();checkAll();return{ok:true,egg:e};
};
G.eggs=function(){return U?U.eggsOwned.slice():[];};
G.hatch=function(eggId,name){
  if(!U)return{ok:false,err:'Giriş yapılmamış.'};var i=U.eggsOwned.indexOf(eggId);if(i<0)return{ok:false,err:'Bu yumurta sende yok.'};
  var e=EGG(eggId);if(!e)return{ok:false,err:'Yumurta bulunamadı.'};
  name=String(name||'').trim().replace(/[<>]/g,'').slice(0,24);if(name.length<2)return{ok:false,err:'Gezegen adı en az 2 karakter olmalı.'};
  U.eggsOwned.splice(i,1);
  var seed=SG.hash(NAME+':'+name+':'+(U.nextId++)+':'+Math.floor(now()/1000));var r=SG.rng(seed);
  var kinds=(e.planetKinds&&e.planetKinds.length)?e.planetKinds:Object.keys(D().PLANETKINDS||{rocky:1});
  var c=coordFor(seed);var t=TYPE(e.type);var res={};(t&&t.res||[]).forEach(function(x){res[x.id]=20;});var st0=Object.assign({},t&&t.start||{},e.perk&&e.perk.start||{});for(var k0 in st0)res[k0]=st0[k0];
  var p={id:'p'+SG.uid(),name:name,egg:e.id,type:e.type,seed:seed,born:now(),hatchAt:now()+num(e.hatchSec,20)*1000,hatched:false,lvl:1,xp:0,t:0,
    res:res,coord:c.coord,gal:c.gal,kind:SG.pick(kinds,r),sats:[],devs:{},stats:{},log:[],cd:{},missions:{},friends:[],rel:{},unl:{},pending:[],speed:1,evT:40,lastEv:'',nat:0,en:100};
  U.planets.push(p);U.active=p.id;mc('egghatch');snd('egg_crack');save();return{ok:true,planet:p};
};
G.planet=function(){return U?getP(U.active):null;};
G.planets=function(){return U?U.planets:[];};
G.setActive=function(id){if(U&&getP(id)){U.active=id;galCache={};dirty=true;return{ok:true};}return{ok:false,err:'Gezegen yok.'};};
G.setSpeed=function(n){var p=G.planet();if(!p||SPEEDS.indexOf(n)<0)return{ok:false};p.speed=n;return{ok:true,speed:n};};
G.progress=function(p){p=p||G.planet();if(!p||!p.hatched)return{lvl:0,frac:0,left:0};
  if(p.lvl>=MAXL)return{lvl:p.lvl,frac:1,left:0,max:true};
  var eff=p.t+p.xp*0.5,a=CUM[p.lvl-1],b=CUM[p.lvl];return{lvl:p.lvl,frac:SG.clamp((eff-a)/(b-a),0,1),left:Math.max(0,(b-eff)/p.speed),dur:b-a};};
G.levelInfo=function(p){p=p||G.planet();var t=p&&TYPE(p.type);return t&&t.levels?t.levels[p.lvl-1]||null:null;};
G.rank=function(p){p=p||G.planet();var t=p&&TYPE(p.type);var r=null;(t&&t.ranks||[]).forEach(function(x){if(p.lvl>=x.lvl)r=x;});return r;};
/* ---------- etki / maliyet ---------- */
function cdMul(p){return 1-SG.clamp(st(p,'cd')*0.01,0,0.5);}
/* ---------- süreli buff listesi (taban p.stats değişmez; kayıt: p.buffs) ---------- */
var clock=0; /* offline/ilerletme sırasında sanal an; 0 ise gerçek an */
function tNow(){return clock||now();}
function st(p,k){ /* etkin değer = (taban + Σadd) × Πmul, yalnız süresi dolmamış buff'lar */
  var v=num(p.stats[k]),a=0,m=1,bs=p.buffs;if(bs&&bs.length){var t=tNow();for(var i=0;i<bs.length;i++){var b=bs[i];if(b.k===k&&b.until>t){a+=num(b.add);m*=(typeof b.mul==='number'?b.mul:1);}}}
  return(v+a)*m;
}
function pruneBuffs(p){var bs=p.buffs;if(!bs||!bs.length)return;var t=tNow(),j=0;for(var i=0;i<bs.length;i++)if(bs[i].until>t)bs[j++]=bs[i];if(j<bs.length)bs.length=j;}
/* addBuff(p,'prod_all',{add:5,mul:1.2,dur:120,id:'kaynak'}): aynı id+anahtar yenilenir (yığılmaz) */
function addBuff(p,k,o){
  o=o||{};var dur=num(o.dur,0);if(!k||!(dur>0))return null;if(!p.buffs)p.buffs=[];var id=o.id||k;
  var b=null;for(var i=0;i<p.buffs.length;i++)if(p.buffs[i].k===k&&p.buffs[i].id===id){b=p.buffs[i];break;}
  if(!b){b={k:k,id:id};p.buffs.push(b);if(p.buffs.length>24)p.buffs.shift();}
  b.add=num(o.add);b.mul=(typeof o.mul==='number'&&o.mul>0)?o.mul:1;b.until=tNow()+dur*1000;dirty=true;return b;
}
G.st=function(k,p){p=p||G.planet();return p?st(p,k):0;};
G.addBuff=function(k,o,p){p=p||G.planet();return p?addBuff(p,k,o):null;};
G.buffs=function(p){p=p||G.planet();if(!p||!p.buffs)return[];var t=tNow();return p.buffs.filter(function(b){return b.until>t;}).map(function(b){return{k:b.k,id:b.id,add:b.add,mul:b.mul,left:(b.until-t)/1000};});};
function cap(p){return(200+60*p.lvl)*(1+st(p,'cap')*0.01);}
G.cap=cap;
function canPay(p,cost){
  for(var k in(cost||{})){var n=cost[k];if(k==='coin'||k==='coins'){if(U.coins<n)return'Para yetersiz.';}else if(num(p.res[k])<n)return'Kaynak yetersiz: '+resName(p,k)+'.';}
  return'';
}
function pay(p,cost){for(var k in(cost||{})){var n=cost[k];if(k==='coin'||k==='coins')addCoins(-n);else p.res[k]=Math.max(0,num(p.res[k])-n);}emit('res',{id:p.id,res:p.res});}
function resName(p,id){var t=TYPE(p.type);var r=null;(t&&t.res||[]).forEach(function(x){if(x.id===id)r=x;});return r?r.name:id;}
function addRes(p,id,n){var old=num(p.res[id]),c=cap(p);var v=SG.clamp(old+n,0,Math.max(c,old));p.res[id]=v;return v-old;} /* uygulanan gerçek farkı döndürür (depo doluysa n'den az) */
function addSat(p,kind,reason){
  if(p.sats.length>=8+st(p,'sats'))return null;var r=SG.rng(p.seed+p.sats.length*77);
  var names=['Lyra','Orin','Tavi','Kesa','Nuru','Elmo','Vega','Sora','Ibis','Mira'];var s={id:'s'+SG.uid(),name:p.name+' '+SG.pick(names,r),kind:kind&&typeof kind==='string'?kind:SG.pick(['kayalik','buzlu','volkanik','tozlu'],r),per:Math.round(40+r()*200+p.sats.length*60),hp:100};
  p.sats.push(s);fx('satellite_launch',{sat:s});snd('satellite_launch');toast(s.name+' uydusu yörüngede','satellite','','ok');return s;
}
function applyEffect(p,e,quiet){
  var out=[];if(!e)return'';
  var rs=e.res;if(rs){for(var k in rs){var n=rs[k];if(typeof n!=='number')continue;var d=addRes(p,k,n);out.push((d>=0?'+':'')+SG.fmt.num(d)+' '+resName(p,k)+(n>0&&d<n-0.5?' (depo dolu)':''));}emit('res',{id:p.id,res:p.res});}
  var c=e.coin!=null?e.coin:e.coins;if(c){addCoins(c);out.push((c>=0?'+':'')+SG.fmt.num(c)+' para');}
  if(e.xp){p.xp+=e.xp*(1+st(p,'xp')*0.01);addXP(e.xp);out.push('+'+e.xp+' XP');}
  if(e.stat){for(var s in e.stat){p.stats[s]=num(p.stats[s])+e.stat[s];}}
  if(e.buff){[].concat(e.buff).forEach(function(b){if(b&&b.stat){addBuff(p,b.stat,b);out.push('+'+(b.add!=null?b.add:'x'+b.mul)+' '+b.stat+' ('+num(b.dur)+' sn)');}});}
  if(e.unlock){p.unl[e.unlock]=true;out.push('açıldı: '+e.unlock);}
  if(e.item){p.unl[e.item]=true;}
  if(e.sat)addSat(p,e.sat);
  if(e.fx)fx(typeof e.fx==='string'?e.fx:e.fx.name,typeof e.fx==='object'?e.fx:{});
  if(e.sound)snd(e.sound);
  return out.join(', ');
}
function logP(p,text,cat){p.log.unshift({t:now(),text:text,cat:cat||''});if(p.log.length>120)p.log.length=120;dirty=true;}
/* ---------- hız / metrik ---------- */
function metric(m,p){
  p=p||G.planet();if(!U)return 0;
  if(m==='lvl')return U.planets.reduce(function(a,x){return Math.max(a,x.hatched?x.lvl:0);},0);
  if(m==='plvl')return U.plvl;if(m==='planets')return U.planets.filter(function(x){return x.hatched;}).length;
  if(m==='eggs')return U.mc.buyegg||0;if(m==='sats')return U.planets.reduce(function(a,x){return a+x.sats.length;},0);
  if(m==='coins')return U.coins;
  if(m.indexOf('res:')===0)return p?num(p.res[m.slice(4)]):0;
  if(m==='act')return U.mc.act||0;
  return U.mc[m]||0;
}
function dayKey(){var d=new Date(now());return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
/* ---------- görevler ---------- */
function missionList(p){var t=p&&TYPE(p.type);return t&&t.missions?t.missions:[];}
function mstate(m){
  var s=U.ms[m.id];var inst=(m.goal.metric==='lvl'||m.goal.metric.indexOf('res:')===0||m.goal.metric==='plvl'||m.goal.metric==='coins');
  if(!s||(m.kind==='daily'&&s.day!==dayKey())){s=U.ms[m.id]={base:inst?0:metric(m.goal.metric),claimed:false,day:dayKey()};dirty=true;}
  return s;
}
G.missions=function(){
  var p=G.planet();if(!p||!U)return[];
  return missionList(p).map(function(m){
    var locked=(m.minLvl||0)>p.lvl;var s=locked?{base:0,claimed:false}:mstate(m);
    var inst=(m.goal.metric==='lvl'||m.goal.metric.indexOf('res:')===0||m.goal.metric==='plvl'||m.goal.metric==='coins');
    var prog=locked?0:Math.max(0,inst?metric(m.goal.metric,p):metric(m.goal.metric,p)-s.base);
    var o=Object.assign({},m);o.progress=Math.min(prog,m.goal.n);o.done=prog>=m.goal.n;o.claimed=!!s.claimed;o.locked=locked;return o;
  });
};
G.claim=function(id){
  var p=G.planet();if(!p)return{ok:false,err:'Gezegen yok.'};
  var l=G.missions().filter(function(m){return m.id===id;})[0];if(!l)return{ok:false,err:'Görev yok.'};
  if(l.locked)return{ok:false,err:'Görev kilitli.'};if(l.claimed)return{ok:false,err:'Ödül alındı.'};if(!l.done)return{ok:false,err:'Görev bitmedi.'};
  U.ms[id].claimed=true;var rw=l.reward||{};var txt=applyEffect(p,rw);
  snd('mission');emit('mission',{id:id,reward:rw});toast('Görev tamam: '+l.name+(txt?' · '+txt:''),l.icon||'mission','#39FF14','mission');mc('missiondone');save();checkAll();return{ok:true,reward:rw};
};
/* ---------- rozetler ---------- */
function checkBadges(){
  if(!U)return;(D().BADGES||[]).forEach(function(b){
    if(U.badges.indexOf(b.id)>=0)return;if(metric(b.metric)>=b.n){U.badges.push(b.id);snd('badge');emit('badge',b);toast('Rozet: '+b.name,b.icon||'badge','#FFD400','badge');addXP(10);dirty=true;}
  });
}
function checkAll(){checkBadges();}
G.badges=function(){return(D().BADGES||[]).map(function(b){return Object.assign({},b,{got:!!U&&U.badges.indexOf(b.id)>=0,progress:U?Math.min(metric(b.metric),b.n):0});});};
/* ---------- dokunma / eylem ---------- */
var lastTap=0;
G.tap=function(x,y){
  var p=G.planet();if(!p||!p.hatched)return{ok:false};
  mc('tap');p.xp+=1;var gain=0.4*prodRate(p,null);var t=TYPE(p.type);if(t&&t.res&&t.res.length){var r=t.res[Math.floor(Math.random()*t.res.length)];addRes(p,r.id,gain*5);}
  addXP(1);var tt=Date.now();if(tt-lastTap>150){snd('planet_touch');lastTap=tt;}emit('tap',{x:x,y:y,planet:p.id});dirty=true;return{ok:true};
};
G.act=function(actionId,targetId){
  var p=G.planet();if(!p||!p.hatched)return{ok:false,err:'Gezegen henüz doğmadı.'};var t=TYPE(p.type);var a=null;(t&&t.actions||[]).forEach(function(x){if(x.id===actionId)a=x;});
  if(!a)return{ok:false,err:'Eylem yok.'};var rd=num(p.cd[a.id]);if(rd>now())return{ok:false,err:'Bekleme süresi: '+SG.fmt.dur((rd-now())/1000)};
  var er=canPay(p,a.cost);if(er){snd('ui_err');return{ok:false,err:er};}
  pay(p,a.cost);p.cd[a.id]=now()+num(a.cd,10)*1000*cdMul(p)/Math.max(1,Math.sqrt(p.speed));
  var eff=a.effect||{},kind=eff.kind||'build',extra={},txt='';mc('act');mc('act:'+a.id);addXP(10);p.xp+=6;
  if(kind==='attack'){var tg=targetId?node(p,targetId):autoTarget(p,'foe');if(!tg){refund(p,a);return{ok:false,err:'Saldıracak hedef yok (dost gezegen seçilemez).'};}extra=doAttack(p,tg,num(eff.power,1));if(eff.xp)p.xp+=eff.xp;txt=extra.text;}
  else if(kind==='trade'){var tt=targetId?node(p,targetId):autoTarget(p,'trade');if(!tt){refund(p,a);return{ok:false,err:'Ticaret yapılacak gezegen yok.'};}txt=applyEffect(p,eff)+' · '+tt.name;mc('trade');fx('trade_ship',{to:tt.id});}
  else if(kind==='befriend'){var bt=targetId?node(p,targetId):autoTarget(p,'friend');if(!bt){refund(p,a);return{ok:false,err:'Dost olunacak gezegen kalmadı.'};}extra=doBefriend(p,bt,true);txt=applyEffect(p,{xp:eff.xp})+(extra.friend?' · '+bt.name+' dost':' · '+bt.name+' reddetti');}
  else if(kind==='satellite'){var sv=addSat(p,null);txt=sv?sv.name+' fırlatıldı':'Uydu sınırı doldu';applyEffect(p,{xp:eff.xp});}
  else if(kind==='colony'){p.colonies=num(p.colonies)+1;txt='Koloni #'+p.colonies+' (üretim +%4)';applyEffect(p,{xp:eff.xp});}
  else if(kind==='defend'){var dv=num(eff.stat&&eff.stat.def,3)*4;p.buff={def:dv,until:now()+num(eff.dur,120)*1000};txt='Savunma +'+dv+' ('+num(eff.dur,120)+' sn)';applyEffect(p,{xp:eff.xp});}
  else if(kind==='mine'){mc('mine');txt=applyEffect(p,eff);if(p.sats.length)txt+=' (uydu desteği)';}
  else{var e2=Object.assign({},eff);if(e2.stat)e2.stat=e2.stat;txt=applyEffect(p,e2);}
  if(kind==='attack'||kind==='trade'||kind==='befriend'){var snd2=eff.sound;if(snd2&&kind!=='attack')snd(snd2);}
  else{if(eff.fx&&kind!=='build'&&kind!=='research'&&kind!=='create'){}}
  if(!eff.sound&&kind==='build')snd(actSound(p.type));if(!eff.fx&&kind==='build')fx(actFx(p.type),{target:targetId});
  logP(p,a.name+(txt?': '+txt:''),'act');toast(a.name+(txt?' · '+txt:''),a.icon||'tech_unlock','','ok');checkAll();dirty=true;return Object.assign({ok:true,text:txt},extra.win!=null?{win:extra.win}:{});
};
function refund(p,a){for(var k in(a.cost||{})){if(k==='coin')addCoins(a.cost[k]);else p.res[k]=num(p.res[k])+a.cost[k];}delete p.cd[a.id];}
function autoTarget(p,mode){var g=G.galaxy().filter(function(n){return true;});
  if(mode==='foe')g=g.filter(function(n){return !n.friend;}).sort(function(a,b){return a.def-b.def;});
  else if(mode==='trade')g=g.filter(function(n){return n.relation!=='dusman';}).sort(function(a,b){return(b.friend?1:0)-(a.friend?1:0)||a.dist-b.dist;});
  else g=g.filter(function(n){return !n.friend;}).sort(function(a,b){return a.dist-b.dist;});
  return g[0]||null;}
function actSound(ty){return{sav:'war_horn',med:'city',loj:'cargo',yik:'explosion',yar:'creation'}[ty]||'ui_ok';}
function actFx(ty){return{sav:'shield',med:'city_lights',loj:'trade_ship',yik:'impact',yar:'creation'}[ty]||'life';}
G.actions=function(){var p=G.planet();var t=p&&TYPE(p.type);return((t&&t.actions)||[]).map(function(a){var rd=num(p.cd[a.id]);var o=Object.assign({},a);o.ready=rd<=now();o.wait=Math.max(0,(rd-now())/1000);o.afford=!canPay(p,a.cost);return o;});};
/* ---------- mağaza ---------- */
/* n. kopya fiyatı: yalnız limit>1 ürünlerde taban*costCoef^n (varsayılan 1.15; ürün başına costCoef verisiyle ayarlanır); limit<=1 sabit */
function unitPrice(it,n){
  var c=(it.limit||0)>1?(typeof it.costCoef==='number'&&it.costCoef>=1?it.costCoef:1.15):1,o={};
  for(var k in(it.price||{}))o[k]=n>0&&c>1?Math.round(it.price[k]*Math.pow(c,n)):it.price[k];
  return o;
}
G.shop=function(){
  var p=G.planet();var t=p&&TYPE(p.type);if(!p||!t)return[];
  return(t.shop||[]).map(function(it){
    var n=num(p.devs[it.id]);var lim=it.limit||0;var o=Object.assign({},it);o.boughtN=n;o.owned=n>0;
    o.locked=(it.minLvl||0)>p.lvl;o.reason=o.locked?'Seviye '+it.minLvl+' gerekir':(lim&&n>=lim?'Limit doldu':'');o.soldOut=!!(lim&&n>=lim);o.basePrice=it.price;o.price=unitPrice(it,n);o.afford=!canPay(p,o.price);return o;
  });
};
G.buy=function(itemId){
  var p=G.planet();var t=p&&TYPE(p.type);if(!p||!p.hatched)return{ok:false,err:'Gezegen henüz doğmadı.'};
  var it=null;(t.shop||[]).forEach(function(x){if(x.id===itemId)it=x;});if(!it)return{ok:false,err:'Ürün yok.'};
  if((it.minLvl||0)>p.lvl){snd('ui_err');return{ok:false,err:'Seviye '+it.minLvl+' gerekir.'};}
  var n=num(p.devs[it.id]);if(it.limit&&n>=it.limit){snd('ui_err');return{ok:false,err:'Alım limiti doldu.'};}
  var price=unitPrice(it,n);var er=canPay(p,price);if(er){snd('ui_err');return{ok:false,err:er};}
  pay(p,price);p.devs[it.id]=n+1;var txt=applyEffect(p,it.effect);mc('buy');addXP(6);p.xp+=4;
  snd((it.effect&&it.effect.sound)||'coin_big');logP(p,it.name+' alındı'+(txt?': '+txt:''),'shop');toast(it.name+(txt?' · '+txt:''),it.icon||'coin','','ok');checkAll();save();return{ok:true,text:txt};
};
/* ---------- üretim ve seviye ---------- */
function prodRate(p,resId){
  var t=TYPE(p.type);var inc=(t&&t.income)||{};var lv=1+0.1*(p.lvl-1);var col=1+0.04*(st(p,'colonies')+num(p.colonies));
  function one(id){var b=num(inc[id],0.5)*0.25*lv*col;return b*(1+(st(p,'prod_'+id)+st(p,'prod_all'))*0.01);}
  if(resId)return one(resId);var s2=0,n2=0;(t&&t.res||[]).forEach(function(x){s2+=one(x.id);n2++;});return n2?s2/n2:0.1;
}
G.rates=function(p){p=p||G.planet();var o={};if(!p)return o;var t=TYPE(p.type);(t&&t.res||[]).forEach(function(x){o[x.id]=prodRate(p,x.id)*p.speed;});return o;};
function levelUps(p,silent){
  var up=false;while(p.lvl<MAXL&&(p.t+p.xp*0.5)>=CUM[p.lvl]){p.lvl++;up=true;var li=TYPE(p.type)&&TYPE(p.type).levels?TYPE(p.type).levels[p.lvl-1]:null;
    addXP(20);if(!silent){snd('levelup');fx('creation',{lvl:p.lvl});emit('lvl',{id:p.id,lvl:p.lvl,info:li});toast('Gezegen seviye '+p.lvl+(li?' · '+li.name:''),'levelup','#39FF14','levelup');}
    logP(p,'Seviye '+p.lvl+(li?' — '+li.name:''),'lvl');naturalMoons(p);}
  return up;
}
function naturalMoons(p){var r=SG.rng(p.seed+9001);var want=[5,15,28,40].filter(function(L){return p.lvl>=L;}).length;
  var allow=1+Math.floor(r()*3);want=Math.min(want,allow+0);while(p.nat<want&&p.sats.length<8){p.nat++;addSat(p,null);}
}
function hatchDone(p,silent){p.hatched=true;p.lvl=1;p.en=100;p.evT=40;mc('hatch');if(!silent){snd('egg_hatch');fx('creation',{});emit('hatch',{id:p.id,planet:p});toast(p.name+' doğdu!','planet','','levelup');}logP(p,'Gezegen doğdu','lvl');naturalMoons(p);checkAll();}
function stepPlanet(p,dt,simNow,isOff){clock=simNow-dt*1000;try{stepPlanet0(p,dt,simNow,isOff);}finally{clock=0;}}
function stepPlanet0(p,dt,simNow,isOff){
  pruneBuffs(p);
  if(!p.hatched){if(simNow>=p.hatchAt)hatchDone(p,isOff);return;}
  var sp=isOff?1:p.speed;p.t+=dt*sp;levelUps(p,isOff);
  var t=TYPE(p.type);if(t&&t.res)t.res.forEach(function(x){addRes(p,x.id,prodRate(p,x.id)*dt*sp);});
  U.coins+=Math.min(dt,isOff?1000:dt)*0.02*(p.lvl+1)*(1+st(p,'coin')*0.01)*sp*0.3;
  p.evT-=dt*sp;if(p.evT<=0){spawnEvent(p,isOff,simNow);p.evT=45*lvF(p.lvl)*(0.7+0.6*Math.random());}
  for(var i=p.pending.length-1;i>=0;i--){if(simNow>=p.pending[i].exp)autoDecide(p,p.pending[i],isOff);}
  p.sats.forEach(function(s){if(s.hp<100)s.hp=Math.min(100,s.hp+dt*0.01);});
}
G.tick=function(dt){
  if(!U)return;dt=Math.min(dt,5);var n=now();
  U.planets.forEach(function(p){stepPlanet(p,dt,n,false);});
  secT+=dt;saveT+=dt;
  if(secT>=1){secT=0;var p=G.planet();if(p)emit('res',{id:p.id,res:p.res,tick:true});emit('coins',{coins:U.coins,tick:true});checkAll();}
  if(saveT>=5){saveT=0;save();}
};
/* ---------- çevrimdışı ---------- */
function offline(gap){
  var start=num(U.last)||now();var rep={secs:gap,planets:[],coins:0,events:0,lvl:0};var c0=U.coins;var step=gap>3600?30:10;
  var muted=true;var saveEmit=SG.bus.emit;SG.bus.emit=function(ev,d){if(ev==='sound'||ev==='fx'||ev==='toast')return;saveEmit.call(SG.bus,ev,d);};
  try{
    U.planets.forEach(function(p){
      var l0=p.lvl,r0=JSON.parse(JSON.stringify(p.res)),ev0=p.log.length,wasHatched=p.hatched;
      var t=0;while(t<gap){var d=Math.min(step,gap-t);t+=d;stepPlanet(p,d,start+t*1000,true);}
      var gained={};for(var k in p.res){var g=num(p.res[k])-num(r0[k]);if(g>0.5)gained[k]=Math.round(g);}
      rep.planets.push({id:p.id,name:p.name,lvlFrom:l0,lvlTo:p.lvl,res:gained,events:p.offEv||0,hatched:!wasHatched&&p.hatched});rep.lvl+=p.lvl-l0;rep.events+=p.offEv||0;p.offEv=0;
    });
  }finally{SG.bus.emit=saveEmit;}
  rep.coins=Math.round(U.coins-c0);report=rep;
}
G.offlineReport=function(){return report;};G.clearReport=function(){report=null;};
/* ---------- olaylar ---------- */
var FALLBACK_EV=[
  {id:'f1',name:'Sakin gün',cat:'uzy',icon:'planet',minLvl:1,w:2,text:'Gezegende olağanüstü bir şey olmadı; sistem dengede.',outcome:{xp:2}},
  {id:'f2',name:'Meteor yağmuru',cat:'ast',icon:'explosion',minLvl:2,w:1,text:'Küçük göktaşları atmosferde yandı.',fx:'impact',sound:'impact',outcome:{xp:3}},
  {id:'f3',name:'Güneş fırtınası',cat:'yil',icon:'storm',minLvl:3,w:1,text:'Yıldız parladı. Kalkan karar verecek.',fx:'storm',sound:'storm',choices:[{label:'Kalkanı güçlendir',cost:{coin:10},outcome:{xp:6,text:'Zarar yok.'}},{label:'Karşıla',outcome:{xp:2,text:'Hafif hasar.'}}]}
];
function evPool(p){var t=TYPE(p.type);var a=(t&&t.events&&t.events.length)?t.events:FALLBACK_EV;return a.filter(function(e){return(e.minLvl||1)<=p.lvl;});}
function spawnEvent(p,isOff,simNow){
  var pool=evPool(p);if(!pool.length)return;
  var tot=0;pool.forEach(function(e){tot+=(e.w||1)*(e.id===p.lastEv?0.2:1);});var r=Math.random()*tot,ev=pool[0];
  for(var i=0;i<pool.length;i++){r-=(pool[i].w||1)*(pool[i].id===p.lastEv?0.2:1);if(r<=0){ev=pool[i];break;}}
  p.lastEv=ev.id;mc('event');
  if(isOff)p.offEv=(p.offEv||0)+1;
  if(ev.choices&&ev.choices.length){
    var uid0='e'+SG.uid();var pe={uid:uid0,id:uid0,eventId:ev.id,name:ev.name,text:ev.text,icon:ev.icon,cat:ev.cat,choices:ev.choices,exp:simNow+90000,t:simNow};
    if(isOff){autoDecide(p,pe,true);return;}
    p.pending.push(pe);if(p.pending.length>3)autoDecide(p,p.pending[0],false);
    if(ev.fx)fx(ev.fx,{});snd(ev.sound||'notify');emit('event',{planet:p.id,event:pe,pending:true});toast(ev.name+' — karar bekliyor',ev.icon||'notify','#FFC83D','event');
  }else{
    var txt=applyEffect(p,ev.outcome||ev.effect||{xp:2});logP(p,ev.name+(txt?': '+txt:''),ev.cat||'event');
    if(!isOff){if(ev.fx)fx(ev.fx,{});snd(ev.sound||'notify');emit('event',{planet:p.id,event:{name:ev.name,text:ev.text,icon:ev.icon,cat:ev.cat,result:txt}});toast(ev.name+(txt?' · '+txt:''),ev.icon||'notify','','event');}
  }
  p.xp+=1;if(!isOff)checkAll();
}
function removePending(p,pe){var i=p.pending.indexOf(pe);if(i>=0)p.pending.splice(i,1);}
function autoDecide(p,pe,silent){
  var idx=0;for(var i=0;i<pe.choices.length;i++){if(!pe.choices[i].cost||!canPay(p,pe.choices[i].cost)){idx=i;if(!pe.choices[i].cost)break;}}
  var best=-1;pe.choices.forEach(function(c,k){if(!c.cost&&best<0)best=k;});if(best>=0)idx=best;
  resolve(p,pe,idx,silent,true);
}
function resolve(p,pe,idx,silent,auto){
  var ch=pe.choices[idx];if(!ch)return{ok:false,err:'Seçenek yok.'};
  if(ch.cost){var er=canPay(p,ch.cost);if(er){if(auto){ch=pe.choices.filter(function(c){return !c.cost;})[0]||{outcome:{}};}else return{ok:false,err:er};}else pay(p,ch.cost);}
  var o=ch.outcome||{};var txt=applyEffect(p,o);removePending(p,pe);addXP(8);
  var msg=(o.text?o.text+' ':'')+(txt?'('+txt+')':'');logP(p,pe.name+' → '+(ch.label||'')+(msg?' · '+msg:''),pe.cat||'event');
  if(!silent){snd((o.xp||0)>=4?'choice_good':'choice_bad');emit('event',{planet:p.id,event:{name:pe.name,text:o.text||'',icon:pe.icon,cat:pe.cat,result:txt},resolved:true,auto:!!auto});toast(pe.name+': '+(o.text||ch.label||''),pe.icon||'notify','','event');}
  return{ok:true,text:o.text||'',res:txt};
}
G.events=function(){var p=G.planet();return p?p.log.slice(0,40):[];};
G.pending=function(){var p=G.planet();return p&&p.pending.length?p.pending[0]:null;};
G.pendingAll=function(){var p=G.planet();return p?p.pending.slice():[];};
G.decide=function(eventId,idx){
  var p=G.planet();if(!p)return{ok:false,err:'Gezegen yok.'};var pe=null;
  p.pending.forEach(function(x){if(!pe&&(x.uid===eventId||x.eventId===eventId))pe=x;});if(!pe)return{ok:false,err:'Bekleyen olay yok.'};
  var r=resolve(p,pe,idx,false,false);if(r.ok){mc('decision');checkAll();dirty=true;}else snd('ui_err');return r;
};
/* ---------- galaksi / NPC ---------- */
var SYL=['ka','ve','lo','mi','ra','zu','ne','ti','or','an','el','su','da','pe','xi','um','ha','so'];
function npcName(r){var n=2+Math.floor(r()*2),s='';for(var i=0;i<n;i++)s+=SG.pick(SYL,r);return s.charAt(0).toUpperCase()+s.slice(1)+'-'+(1+Math.floor(r()*99));}
function relOf(p,n){return p.rel[n.id]||'tarafsiz';}
G.galaxy=function(){
  var p=G.planet();if(!p||!p.hatched)return[];
  var bucket=Math.floor(p.lvl/5),key=p.id+':'+bucket;var base=galCache[key];
  if(!base){var r=SG.rng(p.seed^0x77aa);base=[];var rr=SG.rng(p.seed+bucket*131);var cn=p.coord.split('·');var px=+cn[1],py=+cn[2];
    for(var i=0;i<12;i++){var ty=TYPES_ORDER[Math.floor(rr()*5)];var lv=SG.clamp(p.lvl+Math.round((rr()-0.5)*8),1,MAXL);
      var cc=coordFor(Math.floor(rr()*4e9),p.gal+(rr()<0.25?1:0));var cx=+cc.coord.split('·')[1],cy=+cc.coord.split('·')[2];
      base.push({id:'n'+p.seed.toString(36)+i,name:npcName(rr),type:ty,lvl:lv,coord:cc.coord,gal:cc.gal,dist:Math.round(Math.sqrt((cx-px)*(cx-px)+(cy-py)*(cy-py))*10)/10+(cc.gal===p.gal?0:400),kind:null,npc:true,power:Math.round(lv*10*(ty==='sav'?1.5:ty==='yik'?1.3:1)*(0.8+rr()*0.4)),def:Math.round(lv*8*(0.8+rr()*0.5))});}
    galCache[key]=base;}
  return base.map(function(n){var o=Object.assign({},n);o.relation=relOf(p,n);o.friend=p.friends.indexOf(n.id)>=0;o.cd=Math.max(0,(num(p.cd['atk:'+n.id])-now())/1000);return o;});
};
function node(p,id){var g=G.galaxy();for(var i=0;i<g.length;i++)if(g[i].id===id)return g[i];return null;}
function myPower(p){var t={sav:1.5,yik:1.3}[p.type]||1;return(p.lvl*10+st(p,'atk')*5)*t;}
function myDef(p){var b=(p.buff&&p.buff.until>now())?p.buff.def:0;return p.lvl*8+st(p,'def')*4+st(p,'resist')*3+st(p,'thorns')*2+b;}
G.power=function(){var p=G.planet();return p?{atk:Math.round(myPower(p)),def:Math.round(myDef(p))}:{atk:0,def:0};};
function doBefriend(p,n,free){
  if(p.friends.indexOf(n.id)>=0)return{ok:false,err:'Zaten dost.'};
  var cost=free?0:Math.round(30+n.lvl*4);if(U.coins<cost){snd('ui_err');return{ok:false,err:'Para yetersiz ('+cost+').'};}if(cost)addCoins(-cost);
  var chance=SG.clamp(0.6+(p.rel[n.id]==='dusman'?-0.3:0)+(st(p,'friends')+st(p,'trade'))*0.03,0.2,0.95);
  if(Math.random()<chance){p.friends.push(n.id);p.rel[n.id]='dost';addXP(8);p.xp+=5;snd('peace');fx('trade_ship',{to:n.id});toast(n.name+' artık dost','trade','#46E39B','ok');logP(p,n.name+' ile dostluk kuruldu','dip');checkAll();dirty=true;return{ok:true,friend:true};}
  snd('choice_bad');toast(n.name+' reddetti','signal','','info');return{ok:true,friend:false};
}
G.befriend=function(id){var p=G.planet();var n=p&&node(p,id);if(!n)return{ok:false,err:'Hedef yok.'};return doBefriend(p,n,false);};
G.trade=function(id,offer){
  var p=G.planet();var n=p&&node(p,id);if(!n)return{ok:false,err:'Hedef yok.'};var t=TYPE(p.type);offer=offer||{};
  if(p.rel[id]==='dusman'){snd('ui_err');return{ok:false,err:'Düşman gezegen ticaret yapmaz.'};}
  var give=offer.give||{},tot=0;for(var k in give){if(num(p.res[k])<give[k])return{ok:false,err:'Yetersiz: '+resName(p,k)};tot+=give[k];}
  if(tot<=0)return{ok:false,err:'Verilecek kaynak seç.'};
  var get=offer.get||null;var ratio=(p.friends.indexOf(id)>=0?1.05:0.85);
  if(!get){get={};var rs=(t&&t.res||[]).map(function(x){return x.id;}).filter(function(x){return !(x in give);});if(!rs.length)rs=Object.keys(give);get[SG.pick(rs,SG.rng(now()%99999))]=tot*ratio;}
  var gt=0;for(var g in get)gt+=get[g];if(gt>tot*ratio*1.001){snd('ui_err');return{ok:false,err:'Teklif reddedildi: oran '+ratio.toFixed(2)+' üstüne çıkamaz.'};}
  pay(p,give);var gotReal={};for(var h in get)gotReal[h]=addRes(p,h,get[h]);emit('res',{id:p.id,res:p.res});mc('trade');addXP(7);p.xp+=5;
  snd('trade');fx('trade_ship',{to:id});toast('Ticaret: '+n.name,'trade','','ok');logP(p,'Ticaret: '+n.name,'tic');checkAll();dirty=true;return{ok:true,gave:give,got:gotReal};
};
function doAttack(p,n,pm){
  var atk=myPower(p)*pm*(0.85+Math.random()*0.3),def=n.def*(0.85+Math.random()*0.3);var pw=SG.clamp(0.5+(atk-def)/(2*(atk+def))+st(p,'luck')*0.005,0.1,0.9);
  p.cd['atk:'+n.id]=now()+60000;p.rel[n.id]='dusman';mc('attack');snd('attack_launch');fx('war_strike',{to:n.id});var win=Math.random()<pw;var t=TYPE(p.type);var txt='';
  if(win){var loot=(10+n.lvl*3)*(1+st(p,'loot')*0.05);var gl={};(t&&t.res||[]).forEach(function(x){var q=loot*(0.4+Math.random()*0.6);gl[x.id]=Math.round(addRes(p,x.id,q));});
    emit('res',{id:p.id,res:p.res});addXP(15);p.xp+=12;snd('hit');txt='Zafer! Ganimet alındı.';toast(txt+' '+n.name,'attack','#FF5A4D','ok');logP(p,'Saldırı kazanıldı: '+n.name,'sav');checkAll();dirty=true;return{ok:true,win:true,loot:gl,text:txt,chance:pw};}
  var lose={};(t&&t.res||[]).forEach(function(x){var q=num(p.res[x.id])*0.1*(1-SG.clamp(st(p,'resist')*0.02,0,0.8));p.res[x.id]=Math.max(0,num(p.res[x.id])-q);lose[x.id]=Math.round(q);});
  emit('res',{id:p.id,res:p.res});snd('shield_hit');txt='Saldırı püskürtüldü; kayıp verdin.';toast(txt,'shield','','info');logP(p,'Saldırı başarısız: '+n.name,'sav');dirty=true;return{ok:true,win:false,lost:lose,text:txt,chance:pw};
}
G.attack=function(id){
  var p=G.planet();var n=p&&node(p,id);if(!n)return{ok:false,err:'Hedef yok.'};if(p.friends.indexOf(id)>=0)return{ok:false,err:'Dost gezegene saldırılmaz. Önce dostluğu bozmalısın.'};
  var cd=num(p.cd['atk:'+id]);if(cd>now())return{ok:false,err:'Bekleme: '+SG.fmt.dur((cd-now())/1000)};
  var t=TYPE(p.type),a=null;(t&&t.actions||[]).forEach(function(x){if(x.effect&&x.effect.kind==='attack')a=x;});
  if(a){var rd=num(p.cd[a.id]);if(rd>now())return{ok:false,err:'Saldırı eylemi bekliyor: '+SG.fmt.dur((rd-now())/1000)};var er=canPay(p,a.cost);if(er){snd('ui_err');return{ok:false,err:er};}pay(p,a.cost);p.cd[a.id]=now()+num(a.cd,60)*1000*cdMul(p);}
  return doAttack(p,n,a&&a.effect?num(a.effect.power,1):1);
};
G.mine=function(satId){
  var p=G.planet();if(!p||!p.hatched)return{ok:false,err:'Gezegen henüz doğmadı.'};if(!p.sats.length)return{ok:false,err:'Maden için önce bir uydu gerekir.'};
  var s=null;p.sats.forEach(function(x){if(!s&&(!satId||x.id===satId))s=x;});if(!s)return{ok:false,err:'Uydu yok.'};
  var cd=num(p.cd['mine:'+s.id]);if(cd>now())return{ok:false,err:'Uydu soğuyor: '+SG.fmt.dur((cd-now())/1000)};
  var t=TYPE(p.type);var rs=t&&t.res||[];if(!rs.length)return{ok:false,err:'Kaynak yok.'};
  var q=(3+p.lvl*0.8)*(1+st(p,'mine')*0.1)*(0.5+s.hp/200);var r=rs[Math.floor(Math.random()*rs.length)];
  var q0=q;q=addRes(p,r.id,q);s.hp=Math.max(10,s.hp-3);p.cd['mine:'+s.id]=now()+30000;emit('res',{id:p.id,res:p.res});mc('mine');addXP(4);p.xp+=3;
  snd('mine');fx('mine_beam',{sat:s.id});logP(p,s.name+' madeni: +'+Math.round(q)+' '+r.name+(q<q0-0.5?' (depo dolu)':''),'loj');checkAll();dirty=true;return{ok:true,res:r.id,amount:q,sat:s.id};
};
G.sats=function(){var p=G.planet();return p?p.sats.slice():[];};
G.link=function(satId){var p=G.planet();var s=p&&p.sats.filter(function(x){return x.id===satId;})[0];if(!s)return{ok:false};s.hp=Math.min(100,s.hp+10);snd('satellite_link');return{ok:true};};
/* ---------- hikâye ---------- */
G.story=function(){
  var p=G.planet();var lv=U?Math.max(p?p.lvl:0,metric('lvl')):0;var st=D().STORY||[];
  return st.map(function(s){var o=Object.assign({},s);o.unlocked=lv>=s.minLvl;o.read=!!(U&&U.story.read[s.id]);o.chosen=(U&&U.story.dec[s.id]!=null)?U.story.dec[s.id]:null;return o;});
};
G.readStory=function(id){
  if(!U)return{ok:false};var s=G.story().filter(function(x){return x.id===id;})[0];if(!s||!s.unlocked)return{ok:false,err:'Bölüm kilitli.'};
  if(!U.story.read[id]){U.story.read[id]=1;addXP(6);mc('story');snd('notify');checkAll();dirty=true;}return{ok:true,story:s};
};
G.decideStory=function(id,idx){
  if(!U)return{ok:false};var s=G.story().filter(function(x){return x.id===id;})[0];if(!s||!s.unlocked||!s.decision)return{ok:false,err:'Karar yok.'};
  if(U.story.dec[id]!=null)return{ok:false,err:'Karar verildi.'};var opts=s.decision.options||s.decision.choices||[];if(idx<0||idx>=opts.length)return{ok:false,err:'Seçenek yok.'};
  U.story.dec[id]=idx;mc('storydec');addXP(10);snd('choice_good');toast('Kararın kaydedildi','story','','ok');save();return{ok:true,ending:G.ending()};
};
G.ending=function(){
  if(!U)return null;var tally={},last=null;(D().STORY||[]).forEach(function(s){if(s.decision&&U.story.dec[s.id]!=null){var o=(s.decision.options||s.decision.choices||[])[U.story.dec[s.id]];var e=o&&(o.end||o.ending||o.id);if(e){tally[e]=(tally[e]||0)+1;last=e;}}});
  var best=null,bn=0,tie=false;for(var k in tally){if(tally[k]>bn){bn=tally[k];best=k;tie=false;}else if(tally[k]===bn)tie=true;}
  return tie?last:best;
};
/* ---------- test ---------- */
G._reset=function(){U=null;NAME='';off=0;galCache={};report=null;G._inited=false;};
G.advance=function(sec){ /* sanal zaman ilerlet (testler ve fastForward) */
  if(!U)return;var step=sec>3600?30:5,t=0;
  var o=SG.bus.emit;SG.bus.emit=function(ev,d){if(ev==='sound'||ev==='fx')return;o.call(SG.bus,ev,d);};
  try{while(t<sec){var d=Math.min(step,sec-t);t+=d;off+=d*1000;U.planets.forEach(function(p){stepPlanet(p,d,now(),false);});}}finally{SG.bus.emit=o;}
  checkAll();dirty=true;
};
G.pass=function(){
  var issues=[];if(!U)return{ok:false,issues:['kullanıcı yok']};
  if(!isFinite(U.coins)||U.coins<0)issues.push('para bozuk '+U.coins);
  U.planets.forEach(function(p){for(var k in p.res){if(!isFinite(p.res[k])||p.res[k]<0)issues.push(p.name+' '+k+'='+p.res[k]);}
    if(!isFinite(p.t)||!isFinite(p.xp))issues.push(p.name+' t/xp NaN');if(p.lvl<1||p.lvl>MAXL)issues.push('seviye '+p.lvl);});
  return{ok:!issues.length,issues:issues};
};
try{
  var qs=(typeof location!=='undefined'&&location.search)||'';
  if(/[?&]test=1/.test(qs)){SG.test={state:function(){return U;},
    addBuff:G.addBuff,st:G.st,forceLvl:function(n){var p=G.planet();if(!p)return false;if(!p.hatched)hatchDone(p,true);n=SG.clamp(n,1,MAXL);p.t=Math.max(p.t,CUM[n-1]);levelUps(p,true);return p.lvl;},
    fastForward:function(sec){G.advance(sec);return G.pass();},pass:G.pass,errors:function(){return SG.log.list;}};}
}catch(e){}
})();
