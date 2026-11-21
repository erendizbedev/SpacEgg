/* SpacEgg v3 — tek gezegen oyun ekranı (SG.view 'planet'): izometrik kıta sahnesi, HUD, sekmeler, popup'lar, yumurta akışı */
(function(){
'use strict';
var SG=window.SG,h=SG.h,Iso=SG.Iso,PS,TUNE,HR=3600000;
var RES=['food','stone','metal','energy','know','credit'];
var CHIPS=['food','stone','metal','energy','know','credit'];
var TABS=[['planet','Gezegen','planet'],['city','Şehir','city'],['fleet','Filo','fleet'],['war','Savaş','war']];
var UNITS_TR={sentinel:'Nöbetçi',spear:'Mızrakçı',archer:'Okçu',cannon:'Topçu'};
var V=null;                       // etkin görünüm durumu
var IC={},TH={};

/* ---------- yardımcılar ---------- */
function now(){return SG.Clock.now();}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function p2(n){return n<10?'0'+n:''+n;}
function tm(ms){var s=Math.max(0,Math.ceil(ms/1000)),hh=Math.floor(s/3600),mm=Math.floor(s%3600/60),ss=s%60;return hh?p2(hh)+':'+p2(mm)+':'+p2(ss):p2(mm)+':'+p2(ss);}
function nf(v){v=Math.floor((v||0)+1e-6);if(v>=100000)return Math.round(v/1000)+'K';if(v>=10000)return(v/1000).toFixed(1).replace('.',',')+'K';return SG.fmt.int(v);}
function rf(r){var a=Math.abs(r),t=a>=10?String(Math.round(a)):String(Math.round(a*10)/10).replace('.',',');return(r<0?'-':'+')+t+'/sa';}
function hn(s){return SG.hash(String(s))|0;}
function snd(id){try{if(SG.Sfx&&SG.Sfx.has&&SG.Sfx.has(id)){SG.Sfx.play(id);return;}SG.A2&&SG.A2.ui&&SG.A2.ui(id);}catch(e){}}
function native(fn,a){try{if(typeof SGNative!=='undefined'&&SGNative&&SGNative[fn])SGNative[fn](a);}catch(e){}}
function civ(id){return SG.Civ.get(id||(V&&V.s&&V.s.civ));}
function icon(name,size,cls){
  var k=name+size,u=IC[k];
  if(!u){var c=document.createElement('canvas');c.width=c.height=Math.ceil(size*2);var g=c.getContext('2d');g.scale(2,2);try{Iso.icon(g,name,size/2,size/2,size);}catch(e){SG.log.err('icon:'+name,e);}u=IC[k]=c.toDataURL();}
  var im=new Image();im.src=u;im.width=size;im.height=size;im.alt='';im.draggable=false;im.className='pl-ic'+(cls?' '+cls:'');return im;
}
function thumb(type,lv,size,civId){
  var k=type+lv+size+civId,u=TH[k];
  if(!u){var c=document.createElement('canvas');c.width=c.height=Math.ceil(size*2);var g=c.getContext('2d');g.scale(2,2);
    try{var m=Iso.building.measure(type,lv,civId,0),w=m.right-m.left+8,hh=26-m.top+6,sc=Math.min(size/w,size/hh)*.98;
      Iso.building(g,type,lv,civId,size/2-(m.left+m.right)/2*sc,size/2-(m.top+20)/2*sc,{scale:sc});}catch(e){SG.log.err('thumb',e);}
    u=TH[k]=c.toDataURL();}
  var im=new Image();im.src=u;im.width=size;im.height=size;im.alt='';im.draggable=false;im.className='pl-th';return im;
}
function resChips(o,miss,sign){
  var w=h('span',{class:'pl-rcs'}),k,n=0;
  for(var i=0;i<RES.length;i++){k=RES[i];if(!o||!(o[k]>0))continue;n++;
    w.appendChild(h('span',{class:'pl-rc'+(miss&&miss[k]?' bad':'')},icon(k,16),h('b',null,(sign||'')+nf(o[k]))));}
  if(!n)w.appendChild(h('span',{class:'pl-mut'},'—'));
  return w;
}
function btn(txt,cls,fn,icn,dis){
  var b=h('button',{type:'button',class:'pl-btn '+(cls||'')+(dis?' off':''),'aria-disabled':dis?'true':null});
  if(icn)b.appendChild(icon(icn,22));
  b.appendChild(h('span',null,txt));
  b.addEventListener('click',function(e){e.stopPropagation();if(V)fn(e);});
  return b;
}
function toast(txt,kind){
  if(!V||!V.root)return;
  if(V.toastEl&&V.toastEl.parentNode)V.toastEl.parentNode.removeChild(V.toastEl);
  var el=h('div',{class:'pl-toast '+(kind||''),role:'status'},txt);V.root.appendChild(el);V.toastEl=el;
  clearTimeout(V.toastT);V.toastT=setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},kind==='bad'?3600:2600);
}
function fail(r){
  var m=r&&r.err?r.err:'Olmadı.';
  if(r&&r.missing){var a=[],k;for(k in r.missing)a.push(r.missing[k]+' '+TUNE.resAd[k]);m+=' Eksik: '+a.join(', ')+'.';}
  toast(m,'bad');snd('error');
}
function night(ms){
  if(V&&V.nightOv!=null)return V.nightOv;
  var d=new Date(ms),hr=d.getHours()+d.getMinutes()/60;
  function ss(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x);}
  return hr>=12?ss(18,20.5,hr):1-ss(5,7.5,hr);
}

/* ---------- harita eşlemesi ---------- */
function wslot(k){var a=V.world.slots;return k===13?a[a.length-1]:a[k];}
function slotPos(k,cam){var w=wslot(k);return Iso.World.toScreen(V.world,cam||V.cam,w.i,w.j);}
function prodOf(b){var d=TUNE.bld[b.type];return d&&d.prod?d.prod:null;}
/* toplama önizlemesi: Bld.collect ile aynı formül */
function preview(b){
  var def=TUNE.bld[b.type],c=civ(),mul=c.mul||{},cap=SG.Eco.cap(V.s),k,v,o={},any=false;
  if(!def)return null;
  for(k in def.prod){
    v=def.prod[k]*TUNE.lvMul[b.lv]*(typeof mul[k]==='number'?mul[k]:1)*(c.main===k?TUNE.mainBonus:1)*TUNE.collect.min/60;
    v=Math.min(v,Math.max(0,cap-V.s.res[k]));
    if(v>=.5){o[k]=Math.round(v);any=true;}
  }
  return any?o:null;
}
function readyOf(b,t){return b.type&&b.lv>=1&&!b.job&&!b.damaged&&b.colAt<=t&&prodOf(b)&&Object.keys(prodOf(b)).length?preview(b):null;}

/* ---------- görünüm ---------- */
SG.view('planet',{
  mount:function(root,params){
    PS=SG.PS;TUNE=SG.TUNE;
    V={root:root,mode:'boot',tab:(params&&params.tab)||SG._plTab||'planet',sel:-1,rv:null,pops:[],popEl:null,t:0,acc1:0,acc2:0,accD:0,lastD:-1,paused:false,
       hits:{bub:[],bld:[],emp:[],riv:[]},cam:{x:0,y:0,zoom:1,w:390,h:800},tgt:null,dim:0,sig:'',ssig:'',fxs:null,nightOv:null,off:[],ptrs:{},riv:[],
       user:(SG.G&&SG.G.name&&SG.G.name())||'oyuncu',sheetTouch:false,lastSave:0,dirty:false,lastPlay:0,list:[],sm:null,egg:null};
    SG._plTab=null;
    V.tone=SG.store.get('eye','calm');
    var cs=getComputedStyle(document.documentElement);
    V.FM=(cs.getPropertyValue('--f-mono')||'monospace').trim()||'monospace';V.FB=(cs.getPropertyValue('--f-body')||'sans-serif').trim()||'sans-serif';
    build(root);
    on(window,'resize',resize);on(window,'sg-pause',onPause);on(window,'sg-resume',onResume);on(document,'visibilitychange',onVis);
    on({addEventListener:function(e,f){V.off.push(SG.bus.on(e,f));},removeEventListener:function(){}},'eye',function(d){V.tone=d&&d.v;});
    SG.loop.add('planet',loop);
    native('keepAwake',false);
    resize();
    boot();
  },
  unmount:function(){
    if(!V)return;
    try{if(V.s&&V.mode==='game')persist();}catch(e){}
    SG.loop.remove('planet');
    V.off.forEach(function(f){try{f();}catch(e){}});
    clearTimeout(V.toastT);clearTimeout(V.eggT);
    if(V.popEl&&V.popEl.parentNode)V.popEl.parentNode.removeChild(V.popEl);
    if(V.fxs)V.fxs.clear();
    native('keepAwake',false);
    V=null;
  }
});
function on(t,ev,fn,o){t.addEventListener(ev,fn,o);V.off.push(function(){t.removeEventListener(ev,fn,o);});}

/* ---------- iskelet ---------- */
function build(root){
  var cv=h('canvas',{class:'pl-cv','aria-label':'Gezegen sahnesi'});
  V.cv=cv;V.ctx=cv.getContext('2d');
  var wrap=h('div',{class:'pl'});V.wrap=wrap;
  /* üst çubuk */
  var menu=SG.HUD.menuBtn();menu.classList.add('pl-menu');
  V.nameEl=h('div',{class:'pl-name'});V.subEl=h('div',{class:'pl-sub'});
  V.shieldEl=h('div',{class:'pl-shield',hidden:'hidden'});
  var row=h('div',{class:'pl-row'},menu,h('div',{class:'pl-who'},V.nameEl,V.subEl),V.shieldEl);
  V.chipEl={};var grid=h('div',{class:'pl-chips'});
  CHIPS.forEach(function(k){
    var v=h('b',{class:'pl-cv1'}),r=h('span',{class:'pl-cr'}),el=h('div',{class:'pl-chip','data-k':k,role:'group','aria-label':TUNE.resAd[k]},icon(k,26),h('div',{class:'pl-ct'},v,r));
    V.chipEl[k]={el:el,v:v,r:r};grid.appendChild(el);});
  V.warnEl=h('div',{class:'pl-warn',hidden:'hidden',role:'alert'});
  V.strips=h('div',{class:'pl-strips'});
  V.jobs=h('div',{class:'pl-jobs'});
  V.top=h('div',{class:'pl-top'},row,grid,V.warnEl,V.strips,V.jobs);
  /* alt */
  V.sheet=h('div',{class:'pl-sheet',hidden:'hidden'});
  V.card=h('div',{class:'pl-card',hidden:'hidden'});
  V.act=h('div',{class:'pl-act'});
  V.bar=h('nav',{class:'pl-bar','aria-label':'Ana gezinme'});V.tabEl={};
  TABS.forEach(function(t){
    var b=h('button',{type:'button',class:'pl-tab','data-t':t[0],'aria-label':t[1],onclick:function(){snd('nav');setTab(t[0]);}},icon(t[2],28),h('span',null,t[1]),h('i',{class:'pl-dot',hidden:'hidden'}));
    V.tabEl[t[0]]=b;V.bar.appendChild(b);});
  V.bot=h('div',{class:'pl-bot'},V.sheet,V.card,V.act,V.bar);
  V.over=h('div',{class:'pl-over'});
  V.dynEl=h('div',{class:'pl-dyn',hidden:'hidden'});V.over.appendChild(V.dynEl);
  V.hud=h('div',{class:'pl-hud'},V.top,V.over,V.bot);
  wrap.appendChild(cv);wrap.appendChild(V.hud);root.appendChild(wrap);
  ['pointerdown','pointerup'].forEach(function(ev){V.sheet.addEventListener(ev,function(){V.sheetTouch=ev==='pointerdown';});});
  V.sheet.addEventListener('pointercancel',function(){V.sheetTouch=false;});
  inputs();
}
function resize(){
  if(!V||!V.wrap)return;
  var r=V.wrap.getBoundingClientRect(),W=Math.max(200,Math.round(r.width)),H=Math.max(300,Math.round(r.height));
  var tier=1;try{tier=SG.P&&SG.P.tier?SG.P.tier():1;}catch(e){}
  var dpr=Math.min(tier>=2?2:tier===1?1.5:1,window.devicePixelRatio||1);
  V.W=W;V.H=H;V.dpr=dpr;V.cv.width=Math.round(W*dpr);V.cv.height=Math.round(H*dpr);
  V.cam.w=W;V.cam.h=H;
  if(V.world){V.world._vw=W;V.world._vh=H;V.fit=Iso.World.fitCam(V.world,W,H,6);}
  if(V.egg&&V.egg.cv){V.egg.cv.width=Math.round(W*dpr);V.egg.cv.height=Math.round(H*dpr);}
  layoutRivals();
}

/* ---------- açılış: altın döngü ---------- */
function boot(){
  var s=null;
  try{s=PS.load(V.user);}catch(e){SG.log.err('PS.load',e);}
  if(!s){V.s=null;startEgg(null);return;}
  V.s=s;
  if(s.dead){startEgg(s.dead?{life:s.hallRec,planet:{name:s.name,civ:s.civ,civAd:civ(s.civ).ad}}:null);return;}
  try{PS.open(s,now());}catch(e){SG.log.err('PS.open',e);}
  beginGame();
  drain();
}
function beginGame(){
  var s=V.s;
  V.mode='game';V.egg=null;
  V.world=Iso.World.make(s.seed,s.civ);
  V.world._vw=V.W;V.world._vh=V.H;
  V.fit=Iso.World.fitCam(V.world,V.W,V.H,6);
  V.order=[];for(var k=0;k<14;k++)V.order.push(k);
  V.order.sort(function(a,b){var A=wslot(a),B=wslot(b);return(A.i+A.j)-(B.i+B.j);});
  var xs=[],ys=[];for(var j=0;j<24;j++)for(var i=0;i<24;i++)if(V.world.kind[j*24+i]){xs.push((i-j)*32);ys.push((i+j)*16);}
  V.bx=[Math.min.apply(null,xs),Math.max.apply(null,xs)];V.by=[Math.min.apply(null,ys),Math.max.apply(null,ys)];
  V.fxs=Iso.fx.new(hn(s.id));
  V.wrap.classList.remove('is-egg');V.wrap.classList.add('is-game');
  var hl=wslot(0);V.cam.zoom=clamp(Math.max(V.fit.zoom*1.2,.82),.5,1.8);
  refreshList();setTab(V.tab,true);focusPt((hl.i-hl.j)*32,(hl.i+hl.j)*16+30,true);
  refresh(true);
  persist();
}
function refreshList(){V.list=SG.Bld.list(V.s);V.sm=PS.summary(V.s);}
function persist(){
  if(!V||!V.s)return;
  try{PS.save(V.s);SG.Notify.sync(V.s);}catch(e){SG.log.err('persist',e);}
  V.lastSave=now();V.dirty=false;
}
function onPause(){if(!V||V.paused)return;V.paused=true;if(V.s&&V.mode==='game')persist();}
function onResume(){
  if(!V||!V.paused)return;V.paused=false;
  if(V.s&&V.mode==='game'&&!V.s.dead){try{PS.open(V.s,now());}catch(e){SG.log.err('resume',e);}refreshList();refresh(true);drain();}
}
function onVis(){if(document.hidden)onPause();else onResume();}

/* ---------- ana döngü: 30 fps sahne, 1 sn mantık ---------- */
function loop(dt){
  if(!V||V.paused)return;
  V.t+=dt;V.acc1+=dt;V.accD+=dt;
  if(V.mode==='egg'){drawEgg(dt);return;}
  if(V.mode!=='game'||!V.s)return;
  if(V.acc1>=1){
    V.acc1=0;
    try{PS.tick(V.s,now());}catch(e){SG.log.err('tick',e);}
    refreshList();drain();
    if(V.s.dead){handleDead();return;}
    refresh(false);
    if(now()-V.lastSave>20000)persist();
  }
  if(V.accD<.031)return;
  var d=Math.min(V.accD,.1);V.accD=0;
  draw(d);
}
function drain(){
  var p=[];try{p=SG.Ev.drain(V.s);}catch(e){SG.log.err('drain',e);}
  if(p.length){V.dirty=true;snd('toast-event');p.forEach(function(x){V.pops.push(x);});showNext();}
}
function handleDead(){
  var s=V.s,self=null;
  V.pops=V.pops.filter(function(p){if(p.kind==='yokolus'&&p.who==='self'){self=p;return false;}return true;});
  try{PS.save(s);}catch(e){}
  if(V.popEl)closePop();
  V.pops=[];
  startEgg(self?{life:self.life,planet:self.planet}:{life:s.hallRec,planet:{name:s.name,civ:s.civ,civAd:civ(s.civ).ad}});
}

/* ---------- sekmeler ---------- */
function setTab(t,force){
  if(!force&&V.tab===t){if(t!=='planet'){}return;}
  V.tab=t;
  Object.keys(V.tabEl).forEach(function(k){V.tabEl[k].setAttribute('aria-current',k===t?'page':'false');});
  V.rv=null;
  if(t!=='planet'){V.sel=-1;}
  V.wrap.setAttribute('data-tab',t);
  V.sheet.hidden=(t==='planet');V.act.hidden=(t!=='planet');
  V.ssig='';refresh(true);
  layoutRivals();
}

/* ---------- arayüz yenileme (1 sn) ---------- */
function refresh(force){
  var s=V.s,sm=V.sm,t=now(),c=civ(),k;
  if(!sm)return;
  V.nameEl.textContent=s.name;
  var hl=SG.Bld.hallLv(s);
  V.subEl.textContent=c.ad+' · '+c.sinif+' · Merkez Sv.'+hl;
  /* kaynaklar */
  var cap=sm.cap,fullL=[];
  CHIPS.forEach(function(k){
    var ch=V.chipEl[k],v=s.res[k],r=sm.rates[k],full=v>=cap-1&&r>=0&&(sm.rates[k]>0||v>=cap-1);
    ch.v.textContent=nf(v);
    ch.r.textContent=sm.uyku&&r===0?'uyku':(v>=cap-1&&k!=='credit'?'DOLU':rf(r));
    var f=k!=='credit'&&v>=cap-1;if(f)fullL.push(TUNE.resAd[k]);
    ch.el.classList.toggle('full',f);ch.el.classList.toggle('neg',r<0);
    ch.el.setAttribute('aria-label',TUNE.resAd[k]+' '+nf(v)+(f?' depo dolu':' '+rf(r)));
  });
  if(fullL.length){V.warnEl.hidden=false;V.warnEl.textContent='Depo doldu: '+fullL.join(', ')+'. Harca ya da depoyu büyüt.';}
  else if(sm.food&&sm.food.starving){V.warnEl.hidden=false;V.warnEl.textContent='Gıda bitti: halk aç, üretim yavaşladı.';}
  else V.warnEl.hidden=true;
  /* kalkan */
  var sh=s.war.shieldUntil-t;
  V.shieldEl.hidden=!(sh>0);if(sh>0){V.shieldEl.textContent='';V.shieldEl.appendChild(icon('shield',22));V.shieldEl.appendChild(h('span',null,'KALKAN '+tm(sh)));}
  /* kendi yok oluş sayacı */
  if(s.dying){V.dynEl.hidden=false;V.dynEl.textContent='YOK OLUYOR '+tm(s.dying.killAt-t);}else V.dynEl.hidden=true;
  buildJobs(force);buildStrips(force);buildAct();
  if(V.tab==='planet')buildCard(force);else buildSheet(force);
  badges();
  tickText();
  if(V.dirty&&t-V.lastSave>600)persist();
}
function tickText(){
  var t=now(),els=V.wrap.querySelectorAll('[data-cd]');
  for(var i=0;i<els.length;i++){var e=els[i],v=+e.getAttribute('data-cd')-t;e.textContent=(e.getAttribute('data-pre')||'')+tm(v);
    var bar=e.getAttribute('data-bar');if(bar){var b=V.wrap.querySelector('[data-pb="'+bar+'"]'),a=e.getAttribute('data-t0');if(b&&a)b.style.width=Math.round(clamp((t-(+a))/Math.max(1,(+e.getAttribute('data-cd'))-(+a)),0,1)*100)+'%';}}
}
function badges(){
  var s=V.s,war=SG.Ev.openPend(s).length>0||V.attack,fl=s.fleet.some(function(f){return f.state==='back'&&f.t1-now()<60000;});
  var d=V.tabEl.war.querySelector('.pl-dot');d.hidden=!war;
  d=V.tabEl.fleet.querySelector('.pl-dot');d.hidden=!fl;
}

/* ---------- iş kuyruğu çipleri ---------- */
function jobList(){
  var s=V.s,a=[],n=SG.Bld.builders(s);
  s.q.forEach(function(j){
    var o={id:j.id,t1:j.t1,t0:j.t0};
    if(j.kind==='build'||j.kind==='upgrade'){var d=TUNE.bld[j.type];o.ic=j.kind==='build'?'build':'upgrade';o.tx=d.ad+' Sv.'+j.lv;o.go=function(){setTab('planet');selectSlot(j.slot,true);};}
    else if(j.kind==='train'){o.ic='fleet';o.tx=UNITS_TR[j.unit]+' ×'+j.n;o.go=function(){setTab('fleet');};}
    else if(j.kind==='scout'){o.ic='scout';var r=SG.AI.byId(s,j.rival);o.tx='Keşif'+(r?': '+r.name:'');o.go=function(){setTab('war');};}
    else if(j.kind==='prep'){o.ic='clock';o.tx='Saldırı hazırlığı';o.go=function(){setTab('war');};}
    else if(j.kind==='march'){o.ic='attack';var r2=SG.AI.byId(s,j.rival);o.tx='Sefer'+(r2?': '+r2.name:'');o.go=function(){setTab('war');};}
    else return;
    a.push(o);});
  s.fleet.forEach(function(f){
    if(f.state==='out'||f.state==='back'){a.push({id:f.id,t1:f.t1,t0:f.t0,ic:'ship',tx:f.state==='out'?'Gemi yolda':'Gemi dönüyor',go:function(){setTab('fleet');}});}
    else if(f.state==='lost')a.push({id:f.id,t1:f.t1,t0:f.t0,ic:'alert',tx:'Gemi yapılıyor',go:function(){setTab('fleet');}});});
  a.sort(function(x,y){return x.t1-y.t1;});
  return a;
}
function buildJobs(force){
  var a=jobList(),sig=a.map(function(x){return x.id+x.tx;}).join('|');
  if(sig===V.jsig&&!force)return;V.jsig=sig;
  V.jobs.textContent='';V.jobs.hidden=!a.length;
  a.forEach(function(x){
    V.jobs.appendChild(h('button',{type:'button',class:'pl-job',onclick:function(){snd('tap');x.go();}},icon(x.ic,22),h('span',{class:'pl-jt'},x.tx),h('b',{class:'pl-jc','data-cd':x.t1,'data-t0':x.t0})));});
}

/* ---------- şeritler: kendi yok oluş, saldırı uyarısı, yoklama ---------- */
function attackWarn(){
  var s=V.s,t=now(),ev=null,a;
  try{a=PS.nextEvents(s,3*HR);}catch(e){return null;}
  for(var i=0;i<a.length;i++)if(a[i].kind==='att'&&a[i].warnAt!=null&&a[i].warnAt<=t&&a[i].t>t){ev=a[i];break;}
  return ev;
}
function buildStrips(force){
  var s=V.s,t=now(),items=[];
  if(s.dying)items.push({k:'dying',cls:'bad'});
  var at=attackWarn();V.attack=at;
  if(at)items.push({k:'att',cls:'bad',ev:at});
  SG.Ev.openPend(s).forEach(function(p){items.push({k:'pend',cls:'bad',p:p});});
  var sig=items.map(function(x){return x.k+(x.p?x.p.id+x.p.state:x.ev?x.ev.id+(x.ev.m||''):'');}).join('|')+(V.sm.res.energy>=120?1:0);
  if(sig===V.strSig&&!force)return;V.strSig=sig;
  V.strips.textContent='';
  if(V.tab==='war')setTimeout(function(){if(V&&V.tab==='war')layoutRivals();},0);
  items.slice(0,2).forEach(function(x){
    var el;
    if(x.k==='dying'){
      var c=TUNE.rescue.cost,ok=SG.Bld.canAfford(s,c);
      el=h('div',{class:'pl-strip bad',role:'alert'},icon('alert',30),h('div',{class:'pl-st'},h('b',null,'GEZEGEN YOK OLUYOR'),h('span',null,'Kalan ',h('em',{'data-cd':s.dying.killAt}))),
        btn('Kurtar','gold',function(){doRescue();},null,!ok));
    }else if(x.k==='att'){
      var m=x.ev.m||'yok';
      el=h('div',{class:'pl-strip bad',role:'alert'},icon('attack',30),h('div',{class:'pl-st'},h('b',null,'SALDIRI GELİYOR'),h('span',null,'Varışa ',h('em',{'data-cd':x.ev.t}),' · '+TUNE.man.def[m].ad)),
        btn('Manevra','gold',function(){maneuverDef(x.ev);}));
    }else{
      var p=x.p,a=SG.AI.byId(s,p.a),b=SG.AI.byId(s,p.b),nm=(a?a.name:'?')+' → '+(b?b.name:'?');
      var line,btns=[];
      if(p.state==='open'){line=h('span',null,'Katılmak için ',h('em',{'data-cd':p.joinBy}));btns=[btn('Katıl','gold',function(){decide(p.id,'join');}),btn('Geç','ghost',function(){decide(p.id,'skip');})];}
      else if(p.state==='prep'){line=h('span',null,'Hazırlık ',h('em',{'data-cd':p.prepEnd}));btns=[btn('Geç','ghost',function(){decide(p.id,'skip');})];}
      else{line=h('span',null,'Hazır! Onay için ',h('em',{'data-cd':p.joinBy}));btns=[btn('Onayla','gold',function(){showPop(pendPop(p,'hazir'));}),btn('Geç','ghost',function(){decide(p.id,'skip');})];}
      el=h('div',{class:'pl-strip bad',role:'alert'},icon('alert',30),h('div',{class:'pl-st',onclick:function(){snd('tap');showPop(pendPop(p,p.state==='open'?'teklif':'hazir'));}},h('b',null,'YOKLAMA · '+nm),line),h('div',{class:'pl-sb'},btns));
    }
    V.strips.appendChild(el);});
  if(items.length>2)V.strips.appendChild(h('div',{class:'pl-more'},'+'+(items.length-2)+' bildirim daha'));
}
function pendPop(p,phase){
  var s=V.s,a=SG.AI.byId(s,p.a),b=SG.AI.byId(s,p.b),t=now();
  return {kind:'yoklama',phase:phase,pendId:p.id,from:a?SG.AI.info(a):null,target:b?SG.AI.info(b):null,
    power:{from:a?Math.round(SG.AI.power(s,a,t)):0,target:b?Math.round(SG.AI.def(s,b,t)):0,band:b?SG.AI.band(s,b,t):'denk'},
    edge:b?Math.round(SG.Civ.edge(s.civ,b.civ)*100)/100:1,joinBy:p.joinBy,prepEnd:p.prepEnd,prepMin:Math.round(TUNE.prepMin*SG.K.mul(s,'prep')),
    canJoin:!!SG.War.sendable(s),choices:phase==='teklif'?['join','skip']:['confirm','skip'],again:true};
}
function decide(id,act){
  var r=PS.decide(V.s,id,act,now());
  if(!r.ok){fail(r);return;}
  snd(act==='skip'?'cancel':'confirm');
  if(act==='join')toast('Hazırlık başladı: '+tm(r.prepEnd-now())+' sonra onaylayabilirsin.');
  changed();drain();
}
function doRescue(){
  var r=PS.rescue(V.s,now());
  if(!r.ok){fail(r);return;}
  snd('unlock');toast('Kurtarma tamam: kalkan açıldı, yapılar onarıldı.','ok');changed();
}
function maneuverDef(ev){
  var s=V.s,opts=Object.keys(TUNE.man.def);
  var body=h('div',null,h('p',{class:'pl-p'},'Saldırı gelmeden önce savunma manevrası seçebilirsin. Saldırının varışına ',h('b',{'data-cd':ev.t}),' var.'));
  opts.forEach(function(m){
    var d=TUNE.man.def[m],cur=(ev.m||'yok')===m,tx=[];
    if(d.def&&d.def!==1)tx.push('Savunma ×'+String(d.def).replace('.',','));
    if(d.lossAtt)tx.push('Saldırgan kaybı ×'+String(d.lossAtt).replace('.',','));
    if(d.lootMul&&d.lootMul!==1)tx.push('Yağma ×'+String(d.lootMul).replace('.',','));
    var row=h('button',{type:'button',class:'pl-opt'+(cur?' cur':''),onclick:function(){
      var r=PS.maneuver(s,ev.id,m,now());if(!r.ok){fail(r);return;}snd('select');ev.m=m;closePop();changed();toast('Manevra: '+d.ad,'ok');}},
      h('b',null,d.ad),h('span',null,tx.join(' · ')||'Ek etki yok'),d.cost?resChips(d.cost):null);
    body.appendChild(row);});
  modal({title:'Savunma manevrası',tone:'bad',ic:'shield',body:body,acts:[btn('Kapat','ghost',closePop)],dismiss:true});
}

/* ---------- ana eylem: depoyu topla ---------- */
function collectAll(){
  var t=now(),got={},n=0,s=V.s;
  V.list.forEach(function(b){
    if(!readyOf(b,t))return;
    var r=PS.collect(s,b.slot,t);
    if(r.ok){n++;var p=slotPos(b.slot);var k;for(k in r.gained){got[k]=(got[k]||0)+r.gained[k];V.fxs.emit('bubble',p.x,p.y-30,{icon:k,text:'+'+Math.round(r.gained[k])});}
      V.fxs.emit('spark',p.x,p.y-10,{n:5});}});
  if(!n){var nx=nextReady();toast(nx?'Henüz hazır değil: '+tm(nx-t)+' sonra.':'Toplanacak üretim yok.');return;}
  snd('reward');
  var a=[];RES.forEach(function(k){if(got[k])a.push('+'+Math.round(got[k])+' '+TUNE.resAd[k]);});
  toast('Toplandı: '+a.join(', '),'ok');changed();
}
function nextReady(){
  var t=now(),m=0;V.list.forEach(function(b){if(b.type&&b.lv>=1&&prodOf(b)&&Object.keys(prodOf(b)).length&&!b.job&&b.colAt>t&&(!m||b.colAt<m))m=b.colAt;});return m;
}
function buildAct(){
  var t=now(),n=0;V.list.forEach(function(b){if(readyOf(b,t))n++;});
  var nx=n?0:nextReady(),sig=n+'|'+(nx?1:0);
  if(!nx&&V.actSig===sig&&V.act.firstChild)return;
  if(nx){
    if(!V.actCd||V.actSig!==sig){V.act.textContent='';V.actCd=h('em',{'data-cd':nx});
      V.actBtn=h('button',{type:'button',class:'pl-main wait',onclick:function(){snd('tap');collectAll();}},icon('collect',30),h('span',{class:'pl-mt'},h('b',null,'Depoyu topla'),h('span',null,'Hazır olmasına ',V.actCd)));V.act.appendChild(V.actBtn);}
    else V.actCd.setAttribute('data-cd',nx);
  }else{
    V.act.textContent='';V.actCd=null;
    V.actBtn=h('button',{type:'button',class:'pl-main'+(n?'':' wait'),onclick:function(){snd('tap');collectAll();}},icon('collect',30),h('span',{class:'pl-mt'},h('b',null,'Depoyu topla'),h('span',null,n?n+' yapı hazır':'Toplanacak üretim yok')));V.act.appendChild(V.actBtn);
  }
  V.actSig=sig;
}
function changed(){V.dirty=true;refreshList();V.ssig='';V.strSig='';V.jsig='';refresh(true);persist();}

/* ---------- seçili bina kartı ---------- */
function selectSlot(k,focus){
  V.sel=k;V.cardSig='';
  if(focus){var w=wslot(k);focusPt((w.i-w.j)*32,(w.i+w.j)*16);}
  refresh(true);
}
function buildCard(force){
  var s=V.s,k=V.sel,t=now();
  if(k<0){V.card.hidden=true;V.cardSig='';return;}
  var b=V.list[k];if(!b||!b.type){V.card.hidden=true;return;}
  var def=TUNE.bld[b.type],job=b.job,up=(!job&&b.lv>=1)?SG.Bld.canUpgrade(s,k):null,rd=readyOf(b,t);
  var sig=[k,b.type,b.lv,job?job.id:0,up?(up.ok?1:up.err):0,rd?1:0,b.damaged?1:0,V.info?1:0,Math.floor(t/20000)].join('|');
  if(sig===V.cardSig&&!force)return;V.cardSig=sig;
  V.card.hidden=false;V.card.textContent='';
  var mid=h('div',{class:'pl-cm'}),right=h('div',{class:'pl-ca'});
  var lvT=b.lv>=1?b.lv:1;
  mid.appendChild(h('div',{class:'pl-ctitle'},h('b',null,def.ad),h('span',null,' · Sv.'+(job&&job.kind==='build'?'1 (inşaat)':b.lv)),
    h('button',{type:'button',class:'pl-x','aria-label':'Kartı kapat',onclick:function(){V.sel=-1;refresh(true);}},icon('cross',22))));
  if(job){
    var kind=job.kind==='build'?'İnşaat':'Yükseltme';
    mid.appendChild(h('div',{class:'pl-cline'},h('span',null,kind+' · kalan '),h('b',{'data-cd':job.t1,'data-bar':'c','data-t0':job.t0})));
    mid.appendChild(h('div',{class:'pl-pbar'},h('i',{'data-pb':'c'})));
    right.appendChild(btn('İptal et','ghost',function(){var r=PS.cancel(s,job.id,now());if(!r.ok){fail(r);return;}snd('cancel');V.sel=job.kind==='build'?-1:V.sel;toast('İptal edildi: bedelin %80\'i iade.');changed();},'cross'));
  }else{
    var pr=SG.Bld.TYPES[b.type].uretim(b.lv),pk=Object.keys(pr);
    var pl=[];pk.forEach(function(q){if(pr[q]>0)pl.push('+'+Math.round(pr[q])+'/sa '+TUNE.resAd[q]);});
    mid.appendChild(h('div',{class:'pl-cline'},h('span',{class:'pl-mut'},b.damaged?'Hasarlı: onarım bekleniyor':(pl.length?'Üretim '+pl.join(', '):'Üretim yok'))));
    if(V.info)mid.appendChild(h('p',{class:'pl-info'},def.acik));
    if(up){
      if(b.lv>=TUNE.maxLv)mid.appendChild(h('div',{class:'pl-cline'},h('span',{class:'pl-mut'},'En üst seviye')));
      else{
        var line=h('div',{class:'pl-cline'},resChips(up.cost||SG.Bld.costFor(s,b.type,b.lv+1),up.missing));
        line.appendChild(h('span',{class:'pl-time'},icon('clock',16),h('b',null,tm((up.secs||SG.Bld.secsFor(s,b.type,b.lv+1))*1000))));
        mid.appendChild(line);
        if(!up.ok)mid.appendChild(h('div',{class:'pl-why'},up.err));
      }
      right.appendChild(btn(b.lv>=TUNE.maxLv?'Üst seviye':'Yükselt','gold',function(){doUpgrade(k);},'upgrade',!up.ok));
    }
    if(rd)right.appendChild(btn('Topla','ok',function(){doCollect(k);},'collect'));
    right.appendChild(btn(V.info?'Gizle':'Bilgi','ghost',function(){V.info=!V.info;V.cardSig='';buildCard(true);},'diplomacy'));
  }
  V.card.appendChild(h('div',{class:'pl-cth'},thumb(b.type,lvT,64,s.civ)));
  V.card.appendChild(mid);V.card.appendChild(right);
}
function doUpgrade(k){
  var r=PS.upgrade(V.s,k,now());if(!r.ok){fail(r);return;}
  snd('confirm');var p=slotPos(k);V.fxs.emit('ring',p.x,p.y,{r:44});V.fxs.emit('dust',p.x,p.y,{n:10});
  toast('Yükseltme başladı: '+tm(r.t1-now()),'ok');changed();
}
function doCollect(k){
  var b=V.list[k],p=slotPos(k),r=PS.collect(V.s,k,now());
  if(!r.ok){fail(r);return;}
  snd('reward');var q;for(q in r.gained)V.fxs.emit('bubble',p.x,p.y-30,{icon:q,text:'+'+Math.round(r.gained[q])});V.fxs.emit('spark',p.x,p.y-10,{n:6});
  changed();
}

/* ---------- yapı menüsü ---------- */
function openBuildMenu(slot){
  var s=V.s,body=h('div',{class:'pl-bm'});
  TUNE.bldOrder.forEach(function(type){
    if(type==='hall')return;
    if((slot===13)!==(type==='port'))return;
    var d=TUNE.bld[type],c=SG.Bld.canBuild(s,slot,type),cost=c.cost||SG.Bld.costFor(s,type,1),secs=c.secs||SG.Bld.secsFor(s,type,1);
    var pr=SG.Bld.TYPES[type].uretim(1),pl=[];Object.keys(pr).forEach(function(q){if(pr[q]>0)pl.push('+'+Math.round(pr[q])+'/sa '+TUNE.resAd[q]);});
    var row=h('button',{type:'button',class:'pl-brow'+(c.ok?'':' off'),'aria-disabled':c.ok?null:'true',onclick:function(){
      if(!c.ok){fail(c);return;}
      var r=PS.build(s,slot,type,now());if(!r.ok){fail(r);return;}
      snd('confirm');closePop();var p=slotPos(slot);V.fxs.emit('dust',p.x,p.y,{n:14});V.fxs.emit('ring',p.x,p.y,{r:44});
      toast(d.ad+' inşaatı başladı: '+tm(r.t1-now()),'ok');V.sel=slot;V.cardSig='';changed();}},
      thumb(type,1,52,s.civ),
      h('div',{class:'pl-bi'},h('b',null,d.ad),h('span',{class:'pl-mut'},pl.length?pl.join(', '):d.acik.split('.')[0]),
        h('div',{class:'pl-cline'},resChips(cost,c.missing),h('span',{class:'pl-time'},icon('clock',16),h('b',null,tm(secs*1000)))),
        c.ok?null:h('div',{class:'pl-why'},c.err)));
    body.appendChild(row);});
  modal({title:slot===13?'Liman yeri':'Yapı seç',tone:'cyan',ic:'build',body:body,acts:[btn('Kapat','ghost',closePop)],dismiss:true,sheet:true});
}

/* ---------- alt panel (Şehir / Filo / Savaş) ---------- */
function sheetSig(){
  var s=V.s;
  return V.tab+'|'+V.rv+'|'+s.q.map(function(j){return j.id;}).join(',')+'|'+s.fleet.map(function(f){return f.id+f.state;}).join(',')+'|'+V.list.map(function(b){return(b.type||'-')+b.lv+(b.job?1:0)+(b.damaged?1:0);}).join('')+'|'+UNITS_ORDER().map(function(u){return s.troops[u];}).join(',')+'|'+s.rivals.map(function(r){return r.id+r.state;}).join(',')+'|'+Math.floor(now()/10000);
}
function UNITS_ORDER(){return TUNE.unitOrder;}
function buildSheet(force){
  var sg=sheetSig();
  if(sg===V.ssig&&!force)return;
  if(V.sheetTouch&&!force&&V.ssig.split('|')[0]===V.tab)return;
  V.ssig=sg;
  var top=V.sheet.scrollTop;V.sheet.textContent='';
  if(V.tab==='city')sheetCity();else if(V.tab==='fleet')sheetFleet();else if(V.tab==='war')sheetWar();
  V.sheet.scrollTop=top;
  tickText();
}
function head(title,sub){return h('div',{class:'pl-sh'},h('b',null,title),sub?h('span',{class:'pl-mut'},sub):null);}
function stat(label,val){return h('div',{class:'pl-stat'},h('span',null,label),h('b',null,val));}
function sheetCity(){
  var s=V.s,sm=V.sm,E=V.sheet;
  E.appendChild(h('div',{class:'pl-stats'},stat('Nüfus',String(sm.pop)),stat('Depo',nf(sm.cap)),stat('Birlik',sm.troopCount+'/'+sm.troopCap),stat('İnşaat',SG.Bld.builders(s)+'/'+TUNE.builders)));
  E.appendChild(head('Binalar','Satıra dokun: haritada göster'));
  var empty=[];
  V.list.forEach(function(b,k){
    if(!b.type){empty.push(k);return;}
    var d=TUNE.bld[b.type],st,job=b.job;
    if(job)st=h('span',null,(job.kind==='build'?'İnşaat ':'Yükseltme ')+'',h('b',{'data-cd':job.t1}));
    else if(b.damaged)st=h('span',{class:'pl-bad'},'Hasarlı');
    else{var pr=SG.Bld.TYPES[b.type].uretim(b.lv),a=[];Object.keys(pr).forEach(function(q){if(pr[q]>0)a.push('+'+Math.round(pr[q])+' '+TUNE.resAd[q]);});st=h('span',{class:'pl-mut'},a.length?a.join(', ')+'/sa':d.acik.split('.')[0]);}
    var up=(!job&&b.lv>=1&&b.lv<TUNE.maxLv)?SG.Bld.canUpgrade(s,k):null;
    var row=h('div',{class:'pl-lrow',role:'button',tabindex:'0',onclick:function(){snd('select');setTab('planet');selectSlot(k,true);}},
      thumb(b.type,Math.max(1,b.lv),44,s.civ),h('div',{class:'pl-li'},h('b',null,d.ad+' · Sv.'+(b.lv||1)),st));
    if(up)row.appendChild(btn('Yükselt','gold sm',function(){doUpgrade(k);},null,!up.ok));
    E.appendChild(row);});
  if(empty.length){
    E.appendChild(head('Boş yerler',empty.length+' yer'));
    var g=h('div',{class:'pl-egrid'});
    empty.forEach(function(k){g.appendChild(btn(k===13?'Liman yeri':'Yer '+k,'ghost',function(){openBuildMenu(k);},'plus'));});
    E.appendChild(g);}
}
function sheetFleet(){
  var s=V.s,E=V.sheet,t=now();
  E.appendChild(head('Birlikler','Birlik '+V.sm.troopCount+'/'+V.sm.troopCap));
  UNITS_ORDER().forEach(function(u){
    var d=TUNE.units[u],ok=SG.Bld.unitOk(s,u),n=s.troops[u]||0,qn=0;
    s.q.forEach(function(j){if(j.kind==='train'&&j.unit===u)qn+=j.n;});
    var row=h('div',{class:'pl-urow'+(ok.ok?'':' lock')},
      h('div',{class:'pl-ui'},h('b',null,d.ad),h('span',{class:'pl-mut'},'Sayı '+n+(qn?' (+'+qn+' eğitimde)':'')+' · Saldırı '+d.att+' · Savunma '+d.def),
        ok.ok?h('div',{class:'pl-cline'},resChips(SG.Bld.unitCost(s,u,1)),h('span',{class:'pl-time'},icon('clock',16),h('b',null,tm(SG.Bld.unitSecs(s,u,1)*1000)))):h('div',{class:'pl-why'},ok.err)));
    var bs=h('div',{class:'pl-ub'});
    [1,5].forEach(function(c){bs.appendChild(btn('+'+c,'gold sm',function(){
      var r=PS.train(s,u,c,now());if(!r.ok){fail(r);return;}snd('confirm');toast(c+' '+d.ad+' eğitiliyor: '+tm(r.t1-now()),'ok');changed();},null,!ok.ok));});
    row.appendChild(bs);E.appendChild(row);});
  var tq=s.q.filter(function(j){return j.kind==='train';});
  if(tq.length){E.appendChild(head('Eğitim sırası'));
    tq.forEach(function(j){E.appendChild(h('div',{class:'pl-lrow'},icon('fleet',28),h('div',{class:'pl-li'},h('b',null,UNITS_TR[j.unit]+' ×'+j.n),h('span',null,'Kalan ',h('b',{'data-cd':j.t1}))),
      btn('İptal','ghost sm',function(){var r=PS.cancel(s,j.id,now());if(!r.ok){fail(r);return;}snd('cancel');toast('İptal edildi: bedelin %80\'i iade.');changed();})));});}
  E.appendChild(head('Lojistik gemiler',SG.Bld.lv(s,'port')?'Kargo kapasitesi '+nf(SG.Log.cargoCap(s)):null));
  if(!SG.Bld.lv(s,'port')){
    E.appendChild(h('p',{class:'pl-p'},'Gemi için Liman gerekir. Şehir sekmesinden Liman yerini seç.'));
    E.appendChild(btn('Liman yap','gold',function(){setTab('city');openBuildMenu(13);},'build'));
  }else{
    s.fleet.forEach(function(f,i){
      var lab=f.state==='idle'?'Limanda hazır':f.state==='out'?(t<f.mid?'Gidiyor':'Dönüyor'):f.state==='back'?'Dönüyor':'Yapılıyor';
      var tgt=f.target?(SG.AI.byId(s,f.target)||{}).name:'Ticaret rotası';
      var row=h('div',{class:'pl-srow'},icon('ship',34),h('div',{class:'pl-si'},h('b',null,'Gemi '+(i+1)+' · '+lab),
        f.state==='idle'?h('span',{class:'pl-mut'},'Gidiş 45 dk · dönüş 45 dk'):h('span',{class:'pl-mut'},(f.state==='lost'?'Yeniden yapılıyor ':tgt+' · kalan '),h('b',{'data-cd':f.t1,'data-bar':'s'+i,'data-t0':f.t0})),
        f.state==='idle'?null:h('div',{class:'pl-pbar'},h('i',{'data-pb':'s'+i}))));
      E.appendChild(row);});
    var idle=SG.Log.idle(s);
    E.appendChild(btn(idle?'Lojistik gönder (ticaret rotası)':'Boş gemi yok','gold',function(){
      var r=PS.sendShip(s,null,now());if(!r.ok){fail(r);return;}snd('confirm');toast('Gemi yola çıktı: '+tm(r.t1-now())+' sonra dönecek.','ok');changed();},'ship',!idle));
    E.appendChild(h('p',{class:'pl-p pl-mut'},'Savaş sekmesinden bir rakibe yağma seferi de gönderebilirsin. Ganimet depo kapasitesini aşamaz.'));
  }
}
function sheetWar(){
  var s=V.s,sm=V.sm,E=V.sheet,t=now();
  if(V.rv){
    var r=SG.AI.byId(s,V.rv);if(r){rivalCard(r);return;}V.rv=null;}
  E.appendChild(h('div',{class:'pl-stats'},stat('Savunma',nf(sm.def)),stat('Saldırı',nf(sm.att)),stat('Zafer',String(s.war.wins)),stat('Yenilgi',String(s.war.losses))));
  if(s.war.shieldUntil>t)E.appendChild(h('div',{class:'pl-note'},icon('shield',22),h('span',null,'Kalkan açık: '),h('b',{'data-cd':s.war.shieldUntil})));
  E.appendChild(head('Rakip gezegenler','Gezegene ya da satıra dokun'));
  s.rivals.forEach(function(r){
    var inf=SG.AI.info(r),it=s.intel[r.id],band=it?bandTr(it.band):'Bilinmiyor';
    var st=r.state==='dying'?h('b',{class:'pl-bad'},'YOK OLUYOR ',h('em',{'data-cd':r.killAt})):h('span',{class:'pl-mut'},inf.civAd+' · '+inf.sinif+' · '+band);
    E.appendChild(h('div',{class:'pl-lrow',role:'button',tabindex:'0',onclick:function(){snd('select');V.rv=r.id;V.ssig='';refresh(true);}},
      h('div',{class:'pl-dotc',style:{background:inf.pal.c1}}),h('div',{class:'pl-li'},h('b',null,inf.ad),st),h('span',{class:'pl-chv'},'›')));});
}
function bandTr(b){return b==='zayif'?'Zayıf':b==='guclu'?'Güçlü':b==='denk'?'Denk':'Bilinmiyor';}
function rivalCard(r){
  var s=V.s,E=V.sheet,inf=SG.AI.info(r),c=SG.Civ.get(r.civ),it=s.intel[r.id],t=now();
  E.appendChild(h('div',{class:'pl-rh'},btn('‹ Liste','ghost sm',function(){V.rv=null;V.ssig='';refresh(true);}),h('div',{class:'pl-li'},h('b',null,inf.ad),h('span',{class:'pl-mut'},inf.civAd+' · '+inf.sinif+' · Lider '+inf.lider))));
  if(r.state==='dying')E.appendChild(h('div',{class:'pl-note bad'},icon('alert',22),h('span',null,'Gezegen yok oluyor: ',h('b',{'data-cd':r.killAt}),' · yağma seferi bonuslu')));
  var hint=SG.Civ.hint(s.civ,r.civ),edge=Math.round(SG.Civ.edge(s.civ,r.civ)*100)/100;
  E.appendChild(h('div',{class:'pl-stats'},stat('Sınıf etkisi',(hint==='guclu'?'Üstün':hint==='zayif'?'Düşük':'Denk')+' ×'+String(edge).replace('.',',')),stat('Gücün',nf(V.sm.att)),stat('Rakip',it?nf(it.power):'?')));
  var bar=h('div',{class:'pl-band'},h('i',{class:'z'},'Zayıf'),h('i',{class:'d'},'Denk'),h('i',{class:'g'},'Güçlü'));
  var bb=it?it.band:null;if(bb){bar.setAttribute('data-b',bb);}
  E.appendChild(h('div',{class:'pl-bandw'},h('span',{class:'pl-mut'},'Güç bandı '+(it?'· keşif '+SG.fmt.dur((t-it.at)/1000)+' önce':'· bilinmiyor, keşfet')),bar));
  if(it&&it.loot)E.appendChild(h('div',{class:'pl-cline'},h('span',{class:'pl-mut'},'Tahmini ganimet '),resChips(typeof it.loot==='object'?it.loot:null)));
  var sc=s.q.filter(function(j){return j.kind==='scout'&&j.rival===r.id})[0],mc=s.q.filter(function(j){return j.kind==='march';})[0];
  var acts=h('div',{class:'pl-acts'});
  acts.appendChild(btn(sc?'Keşif sürüyor':'Keşfet','ghost',function(){
    var q=PS.scout(s,r.id,now());if(!q.ok){fail(q);return;}snd('scan');toast('İzci gönderildi: '+tm(TUNE.scoutMin*60000)+' sonra rapor.','ok');changed();},'scout',!!sc));
  acts.appendChild(btn(mc?'Sefer yolda':'Saldır','red',function(){attackMenu(r);},'attack',!!mc));
  acts.appendChild(btn('Lojistik sefer','gold',function(){
    var q=PS.sendShip(s,r.id,now());if(!q.ok){fail(q);return;}snd('confirm');toast('Gemi yağmaya çıktı: '+tm(q.t1-now())+' sonra dönecek.','ok');changed();},'ship',!SG.Bld.lv(s,'port')||!SG.Log.idle(s)));
  E.appendChild(acts);
  E.appendChild(h('p',{class:'pl-p pl-mut'},'Keşif '+nf(TUNE.scoutCost.credit)+' Kredi, saldırı '+nf(TUNE.attackCost.credit)+' Kredi tutar. Saldırıda birliklerinin %70\'i (Nöbetçiler hariç) gider, gidiş-dönüş '+(TUNE.marchMin*2)+' dk sürer.'));
}
function attackMenu(r){
  var s=V.s,sel='duz',body=h('div',null,h('p',{class:'pl-p'},r.name+' gezegenine saldırı için manevra seç.'));
  var rows=[];
  Object.keys(TUNE.man.att).forEach(function(m){
    var d=TUNE.man.att[m],tx=[];
    if(d.att!==1)tx.push('Güç ×'+String(d.att).replace('.',','));
    if(d.def)tx.push('Rakip savunma ×'+String(d.def).replace('.',','));
    if(d.loot!==1)tx.push('Ganimet ×'+String(d.loot).replace('.',','));
    if(d.lossOwn!==1)tx.push('Kayıp ×'+String(d.lossOwn).replace('.',','));
    if(d.lootOnly)tx.push('Yalnız yağma, rakip yok olmaz');
    var row=h('button',{type:'button',class:'pl-opt'+(m===sel?' cur':''),onclick:function(){sel=m;rows.forEach(function(x){x.el.classList.toggle('cur',x.m===m);});snd('select');}},h('b',null,d.ad),h('span',null,tx.join(' · ')||'Dengeli'));
    rows.push({el:row,m:m});body.appendChild(row);});
  var sendable=SG.War.sendable(s);
  if(sendable)body.appendChild(h('p',{class:'pl-p pl-mut'},'Gidecek birlik: '+SG.War.unitText(sendable)+'.'));
  else body.appendChild(h('p',{class:'pl-why'},'Saldıracak birlik yok. Filo sekmesinden birlik eğit (Nöbetçiler savunmada kalır).'));
  modal({title:'Saldırı manevrası',tone:'bad',ic:'attack',body:body,acts:[btn('Vazgeç','ghost',closePop),btn('Saldır · '+TUNE.attackCost.credit+' Kredi','red',function(){
    var q=PS.attack(s,r.id,sel,now());if(!q.ok){fail(q);return;}snd('confirm');closePop();toast('Sefer yola çıktı: '+tm(q.t1-now())+' sonra döner.','ok');changed();},'attack',!sendable)],dismiss:true});
}

/* ---------- savaş sekmesi: gökte rakip gezegenler ---------- */
function layoutRivals(){
  if(!V||!V.s||!V.W)return;
  V.riv=[];V.over.querySelectorAll('.pl-rl').forEach(function(e){e.remove();});
  if(V.tab!=='war')return;
  var W=V.W,top=V.top.getBoundingClientRect().bottom+4,bt=V.sheet.getBoundingClientRect().top-4,rowH=Math.max(100,(bt-top)/2),R=clamp((rowH-56)/2,20,Math.min(34,W/4*.36));
  V.s.rivals.forEach(function(r,i){
    var x=W*(.125+.25*(i%4)),y=top+rowH*(Math.floor(i/4)+.5)-6;
    var inf=SG.AI.info(r);
    var lab=h('div',{class:'pl-rl',style:{left:x+'px',top:(y-R-24)+'px'}},h('em',{class:'pl-rt',hidden:'hidden'}),null);
    var nm=h('div',{class:'pl-rn',style:{left:x+'px',top:(y+R+4)+'px'}},h('b',null,inf.ad),h('span',null,inf.sinif));
    nm.classList.add('pl-rl');
    V.over.appendChild(lab);V.over.appendChild(nm);
    V.riv.push({r:r,x:x,y:y,R:R,t:lab.firstChild});});
}

/* ---------- popup'lar ---------- */
function modal(o){
  if(V.popEl)closePop(true);
  var tone=o.tone||'cyan';
  var body=h('div',{class:'pl-mbody'});body.appendChild(o.body);
  var md=h('div',{class:'pl-md '+tone+(o.sheet?' sheetmd':''),role:'dialog','aria-modal':'true','aria-label':o.title},
    h('div',{class:'pl-mh'},o.ic?icon(o.ic,30):null,h('b',null,o.title)),body,h('div',{class:'pl-mact'},o.acts||[]));
  var mb=h('div',{class:'pl-mb',onclick:function(e){if(e.target===mb&&o.dismiss)closePop();}},md);
  V.wrap.appendChild(mb);V.popEl=mb;V.popO=o;
  tickText();
  var f=md.querySelector('.pl-mact button');
  return md;
}
function closePop(silent){
  var e=V.popEl;if(!e)return;
  if(e.parentNode)e.parentNode.removeChild(e);V.popEl=null;
  if(V.popO&&V.popO.onClose)V.popO.onClose();V.popO=null;
  if(!silent){snd('close');setTimeout(function(){if(V)showNext();},120);}
}
function showNext(){
  if(!V||V.popEl||V.mode!=='game'||!V.pops.length)return;
  showPop(V.pops.shift());
}
function lines(a){var d=h('div',{class:'pl-lines'});(a||[]).forEach(function(x){d.appendChild(h('div',{class:'pl-line'},x));});return d;}
function gainBox(g,sign){
  var o={},any=false,k;if(!g)return null;for(k in g)if(g[k]>0.5){o[k]=g[k];any=true;}
  return any?resChips(o,null,sign||'+'):null;
}
function rivName(r){return r?r.ad:'?';}
function showPop(p){
  if(!V||!p)return;
  var ok=btn('Tamam','gold',function(){closePop();}),body=h('div'),acts=[ok],title='Haber',tone='cyan',ic='alert';
  if(p.kind==='yoklama')return popYoklama(p);
  if(p.kind==='rapor'){
    if(p.tur==='yokken'){
      title='Sen yokken';ic='clock';
      body.appendChild(h('p',{class:'pl-p'},SG.fmt.dur(p.awayMs/1000)+' uzaktaydın.'+(p.capped?' Birikim '+Math.round(SG.Eco.capH(V.s))+' saatte durdu.':'')));
      var g=gainBox(p.gained);if(g){body.appendChild(h('div',{class:'pl-cline'},h('span',{class:'pl-mut'},'Kazanç '),g));}
      body.appendChild(lines((p.lines||[]).slice(-14)));
    }else if(p.tur==='savas'){
      var w=p.result==='kazandin'||p.result==='engellendi';tone=w?'ok':'bad';ic=w?'shield':'attack';
      title=p.result==='engellendi'?'Saldırı püskürtüldü':w?'Savunma kazanıldı':'Savunma yenildi';
      body.appendChild(h('p',{class:'pl-p'},rivName(p.from)+' · '+p.tip+' · güç oranı '+String(p.ratio).replace('.',',')));
      if(p.lootLost&&gainBox(p.lootLost))body.appendChild(h('div',{class:'pl-cline'},h('span',{class:'pl-bad'},'Kaybedilen '),gainBox(p.lootLost,'-')));
      if(p.lossTroops&&Object.keys(p.lossTroops).length)body.appendChild(h('p',{class:'pl-p'},'Kayıp birlik: '+SG.War.unitText(p.lossTroops)+'.'));
      if(p.damaged&&p.damaged.length)body.appendChild(h('p',{class:'pl-p'},p.damaged.length+' yapı hasar gördü; onarım bekleniyor.'));
      body.appendChild(lines(p.lines));
    }else if(p.tur==='sefer'||p.tur==='katil'){
      var win=p.result==='kazandin';tone=win?'ok':p.result==='iptal'?'cyan':'bad';ic='attack';
      title=p.tur==='katil'?(win?'Ortak saldırı kazanıldı':'Ortak saldırı kaybedildi'):(win?'Sefer kazanıldı':p.result==='iptal'?'Sefer iptal':'Sefer kaybedildi');
      var rv=p.rival;body.appendChild(h('p',{class:'pl-p'},(rv?rv.ad+' gezegeni · ':'')+'güç oranı '+String(p.ratio==null?'—':p.ratio).replace('.',',')));
      var lg=gainBox(p.loot);if(lg)body.appendChild(h('div',{class:'pl-cline'},h('span',{class:'pl-mut'},'Ganimet '),lg));
      if(p.lootWasted&&gainBox(p.lootWasted))body.appendChild(h('div',{class:'pl-cline'},h('span',{class:'pl-mut'},'Depoya sığmayan '),gainBox(p.lootWasted)));
      if(p.lossTroops&&Object.keys(p.lossTroops).length)body.appendChild(h('p',{class:'pl-p'},'Kayıp birlik: '+SG.War.unitText(p.lossTroops)+'.'));
      if(p.killAt)body.appendChild(h('div',{class:'pl-note bad'},icon('alert',22),h('span',null,'Gezegen yok oluyor: '),h('b',{'data-cd':p.killAt})));
      body.appendChild(lines(p.lines));
    }else if(p.tur==='izci'){
      title=p.ok?'Keşif raporu':'Keşif başarısız';ic='scout';tone=p.ok?'cyan':'bad';
      if(p.ok){body.appendChild(h('p',{class:'pl-p'},rivName(p.rival)+' · güç '+nf(p.power)+' · band: '+bandTr(p.band)+' · sınıf etkisi ×'+String(p.edge).replace('.',',')));
        var lo=gainBox(typeof p.loot==='object'?p.loot:null);if(lo)body.appendChild(h('div',{class:'pl-cline'},h('span',{class:'pl-mut'},'Tahmini ganimet '),lo));}
      body.appendChild(lines(p.lines));
    }
  }else if(p.kind==='gemi'){
    ic='ship';
    if(p.result==='kayip'||p.shipLost){title='Gemi kayboldu';tone='bad';body.appendChild(h('p',{class:'pl-p'},'Lojistik gemi yolda kayboldu; '+(p.rebuildAt?tm(p.rebuildAt-now())+' içinde':'bir süre sonra')+' yeniden yapılır.'));}
    else{title='Gemi döndü';tone='ok';var gg=gainBox(p.gained);body.appendChild(h('p',{class:'pl-p'},'Kargo depoya aktarıldı.'));if(gg)body.appendChild(h('div',{class:'pl-cline'},gg));
      if(p.lost&&gainBox(p.lost))body.appendChild(h('div',{class:'pl-cline'},h('span',{class:'pl-bad'},'Depoya sığmadı '),gainBox(p.lost,'-')));}
    var gs=document.createElement('div');
  }else if(p.kind==='yokolus'){
    if(p.who==='rival'){title='Gezegen yok oldu';ic='war';tone='bad';body.appendChild(h('p',{class:'pl-p'},rivName(p.rival)+' gezegeni yok oldu. Yerine yeni bir rakip doğdu.'));
      if(V.world&&p.rival){var q=V.riv.filter(function(x){return x.r.name===p.rival.ad;})[0];if(q&&V.tab==='war')V.fxs.emit('crack',q.x,q.y,{r:q.R*1.4,life:1.6});}}
    else{V.pops.unshift(p);return handleDead();}
  }else if(p.kind==='kaybet'){
    title='Gezegenin tehlikede';ic='alert';tone='bad';
    body.appendChild(h('p',{class:'pl-p'},p.streak+' kez üst üste yenildin. '+rivName(p.from)+' sonrası gezegenin 24 saat içinde yok olacak.'));
    body.appendChild(h('div',{class:'pl-note bad'},icon('clock',22),h('span',null,'Kalan '),h('b',{'data-cd':p.killAt})));
    body.appendChild(h('p',{class:'pl-p'},'Bir savunmayı kazanırsan geri sayım iptal olur. Kurtarma bedeli:'));
    body.appendChild(h('div',{class:'pl-cline'},resChips(p.rescueCost||TUNE.rescue.cost,SG.Bld.missing(V.s,p.rescueCost||TUNE.rescue.cost))));
    acts=[btn('Sonra','ghost',function(){closePop();}),btn('Kurtar','gold',function(){var r=PS.rescue(V.s,now());if(!r.ok){fail(r);return;}snd('unlock');closePop();toast('Kurtarma tamam: kalkan açıldı.','ok');changed();},'shield',!SG.Bld.canAfford(V.s,p.rescueCost||TUNE.rescue.cost))];
  }
  modal({title:title,tone:tone,ic:ic,body:body,acts:acts});
  snd(tone==='bad'?'warning':tone==='ok'?'reward':'toast-info');
}
function popYoklama(p){
  var s=V.s,body=h('div'),acts,title,tone='bad',pid=p.pendId;
  var pd=SG.Ev.pendById(s,pid);
  if(p.phase==='kacirildi'){
    title='Fırsat kaçtı';body.appendChild(h('p',{class:'pl-p'},rivName(p.from)+' ve '+rivName(p.target)+' arasındaki saldırıya hazırlandın ama onaylamadın. Pencere kapandı, bedel yok.'));
    modal({title:title,tone:'cyan',ic:'clock',body:body,acts:[btn('Tamam','gold',function(){closePop();})]});snd('toast-info');return;
  }
  var bandT=bandTr(p.power.band);
  body.appendChild(h('p',{class:'pl-p'},h('b',null,rivName(p.from)),' ('+(p.from?p.from.civAd:'')+') ',h('b',null,rivName(p.target)),' gezegenine saldırı planı ilan etti.'));
  body.appendChild(h('div',{class:'pl-stats'},stat('Saldıran',nf(p.power.from)),stat('Hedef savunma',nf(p.power.target)),stat('Hedef band',bandT),stat('Sınıf etkisi','×'+String(p.edge).replace('.',','))));
  var cd=p.phase==='teklif'?p.joinBy:p.joinBy;
  body.appendChild(h('div',{class:'pl-note bad'},icon('clock',22),h('span',null,p.phase==='teklif'?'Karar için kalan ':'Onay için kalan '),h('b',{'data-cd':cd})));
  if(p.phase==='teklif'){
    title='Saldırı yoklaması';
    body.appendChild(h('p',{class:'pl-p'},'Katılırsan '+p.prepMin+' dk hazırlanırsın, sonra saldırıyı onaylarsın. Geçersen bedel yok.'));
    if(!p.canJoin)body.appendChild(h('p',{class:'pl-why'},'Saldıracak birliğin yok (Nöbetçiler savunmada kalır). Önce Filo sekmesinden birlik eğit.'));
    acts=[btn('Geç','ghost',function(){var r=PS.decide(s,pid,'skip',now());if(!r.ok){fail(r);return;}snd('cancel');closePop();changed();}),
      btn('Katıl','gold',function(){var r=PS.decide(s,pid,'join',now());if(!r.ok){fail(r);return;}snd('confirm');closePop();toast('Hazırlık başladı: '+tm(r.prepEnd-now())+' sonra onayla.','ok');changed();},'attack',!p.canJoin)];
  }else{
    title='Saldırıya hazırsın';
    var cur=(pd&&pd.m)||'duz',rows=[];
    body.appendChild(h('p',{class:'pl-p'},'Manevra seç, sonra saldırıyı onayla:'));
    Object.keys(TUNE.man.att).forEach(function(m){
      var d=TUNE.man.att[m],tx=[];if(d.att!==1)tx.push('Güç ×'+String(d.att).replace('.',','));if(d.loot!==1)tx.push('Ganimet ×'+String(d.loot).replace('.',','));if(d.lossOwn!==1)tx.push('Kayıp ×'+String(d.lossOwn).replace('.',','));if(d.lootOnly)tx.push('Yalnız yağma');
      var row=h('button',{type:'button',class:'pl-opt'+(m===cur?' cur':''),onclick:function(){var r=PS.maneuver(s,pid,m,now());if(!r.ok){fail(r);return;}cur=m;rows.forEach(function(x){x.el.classList.toggle('cur',x.m===m);});snd('select');}},h('b',null,d.ad),h('span',null,tx.join(' · ')||'Dengeli'));
      rows.push({el:row,m:m});body.appendChild(row);});
    acts=[btn('Geç','ghost',function(){var r=PS.decide(s,pid,'skip',now());if(!r.ok){fail(r);return;}snd('cancel');closePop();changed();}),
      btn('Saldırıyı onayla','red',function(){var r=PS.decide(s,pid,'confirm',now());if(!r.ok){fail(r);return;}snd(r.won?'unlock':'warning');closePop();changed();drain();},'attack')];
  }
  modal({title:title,tone:tone,ic:'alert',body:body,acts:acts,onClose:null});
  snd('warning');
}

/* ---------- sahne: kamera ve girdi ---------- */
function focusPt(lx,ly,instant){
  var z=V.cam.zoom,top=V.top.getBoundingClientRect().bottom,bt=V.bot.getBoundingClientRect().top;
  if(V.tab!=='planet')bt=V.H-300;
  var cy=(top+Math.max(top+120,bt))/2,cx=V.W/2;
  var t={x:lx-(cx-V.W/2)/z,y:ly-(cy-V.H/2)/z};
  if(instant){V.cam.x=t.x;V.cam.y=t.y;V.tgt=null;}else V.tgt=t;
}
function clampCam(){
  var c=V.cam,z=c.zoom,mx=V.W/2/z*.6,my=V.H/2/z*.5;
  c.x=clamp(c.x,V.bx[0]-mx,V.bx[1]+mx);c.y=clamp(c.y,V.by[0]-my-40,V.by[1]+my);
}
function inputs(){
  var cv=V.cv,P=V.ptrs,st={mode:0};
  function xy(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  on(cv,'pointerdown',function(e){
    if(V.mode!=='game')return;
    var p=xy(e);P[e.pointerId]={x:p.x,y:p.y,sx:p.x,sy:p.y,t:performance.now()};
    try{cv.setPointerCapture(e.pointerId);}catch(er){}
    var ids=Object.keys(P);
    V.tgt=null;
    if(ids.length===1){st={mode:1,cx:V.cam.x,cy:V.cam.y,moved:false};}
    else if(ids.length===2){var a=P[ids[0]],b=P[ids[1]];st={mode:2,d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:V.cam.zoom,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,cx:V.cam.x,cy:V.cam.y,moved:true};}
  });
  on(cv,'pointermove',function(e){
    var q=P[e.pointerId];if(!q)return;var p=xy(e);q.x=p.x;q.y=p.y;
    var ids=Object.keys(P),c=V.cam;
    if(st.mode===1&&ids.length===1){
      var dx=p.x-q.sx,dy=p.y-q.sy;
      if(!st.moved&&Math.hypot(dx,dy)>8)st.moved=true;
      if(st.moved&&V.tab!=='war'){c.x=st.cx-dx/c.zoom;c.y=st.cy-dy/c.zoom;clampCam();}
    }else if(st.mode===2&&ids.length>=2){
      var a=P[ids[0]],b=P[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y)||1,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      var z=clamp(st.z*d/st.d,V.fit.zoom*.8,V.fit.zoom*3.4);
      var lx=(st.mx-V.W/2)/st.z+st.cx,ly=(st.my-V.H/2)/st.z+st.cy;
      c.zoom=z;c.x=lx-(mx-V.W/2)/z;c.y=ly-(my-V.H/2)/z;clampCam();
    }
  });
  function up(e){
    var q=P[e.pointerId];if(!q)return;
    var wasOne=Object.keys(P).length===1;delete P[e.pointerId];
    if(wasOne&&st.mode===1&&!st.moved&&e.type==='pointerup'&&performance.now()-q.t<600)tap(q.x,q.y);
    if(!Object.keys(P).length)st={mode:0};
    else if(Object.keys(P).length===1){var r=P[Object.keys(P)[0]];st={mode:1,cx:V.cam.x,cy:V.cam.y,moved:true};r.sx=r.x;r.sy=r.y;}
  }
  on(cv,'pointerup',up);on(cv,'pointercancel',up);
  on(cv,'wheel',function(e){
    if(V.mode!=='game'||V.tab==='war')return;e.preventDefault();
    var p=xy(e),c=V.cam,z0=c.zoom,z=clamp(z0*(e.deltaY<0?1.12:.89),V.fit.zoom*.8,V.fit.zoom*3.4);
    var lx=(p.x-V.W/2)/z0+c.x,ly=(p.y-V.H/2)/z0+c.y;c.zoom=z;c.x=lx-(p.x-V.W/2)/z;c.y=ly-(p.y-V.H/2)/z;clampCam();
  },{passive:false});
}
function inR(h2,x,y){return x>=h2.x0&&x<=h2.x1&&y>=h2.y0&&y<=h2.y1;}
function tap(x,y){
  var H=V.hits,i;
  if(V.tab==='war'){
    for(i=V.riv.length-1;i>=0;i--){var r=V.riv[i];if(Math.hypot(x-r.x,y-r.y)<=r.R+12){snd('select');V.rv=r.r.id;V.ssig='';refresh(true);return;}}
    return;
  }
  for(i=H.bub.length-1;i>=0;i--)if(inR(H.bub[i],x,y)){doCollect(H.bub[i].slot);return;}
  for(i=H.bld.length-1;i>=0;i--)if(inR(H.bld[i],x,y)){var k=H.bld[i].slot;snd('select');if(V.tab!=='planet')setTab('planet');selectSlot(k,false);return;}
  var z=V.cam.zoom;
  for(i=0;i<H.emp.length;i++){var e=H.emp[i];if(Math.pow((x-e.x)/(36*z),2)+Math.pow((y-e.y)/(20*z),2)<=1.15||Math.hypot(x-e.x,y-e.y)<24){snd('select');V.sel=-1;openBuildMenu(e.slot);return;}}
  if(V.sel>=0){V.sel=-1;refresh(true);}
}

/* ---------- sahne çizimi ---------- */
function rr(c,x,y,w,hh,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+hh,r);c.arcTo(x+w,y+hh,x,y+hh,r);c.arcTo(x,y+hh,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function pill(c,x,y,txt,o){
  o=o||{};c.font='800 13px '+V.FM;
  var tw=c.measureText(txt).width,iw=o.icon?20:0,w=tw+iw+16+(o.icon?3:0),hh=26,x0=x-w/2,y0=y-hh-6;
  c.save();c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=6;rr(c,x0,y0,w,hh,13);c.fillStyle=o.bg||'rgba(7,12,30,.92)';c.fill();c.restore();
  c.lineWidth=2;c.strokeStyle=o.col||'#ffd24a';rr(c,x0,y0,w,hh,13);c.stroke();
  c.fillStyle=o.col||'#ffd24a';c.beginPath();c.moveTo(x-5,y0+hh);c.lineTo(x,y0+hh+6);c.lineTo(x+5,y0+hh);c.closePath();c.fill();
  if(o.icon)Iso.icon(c,o.icon,x0+8+10,y0+hh/2,22);
  c.fillStyle='#fff';c.textBaseline='middle';c.textAlign='left';c.fillText(txt,x0+8+iw+(o.icon?3:0),y0+hh/2+1);
  return{x0:x0,x1:x0+w,y0:y0-4,y1:y0+hh+10};
}
function draw(dt){
  var c=V.ctx,W=V.W,H=V.H,cam=V.cam,t=V.t,tn=now(),s=V.s,z=cam.zoom,nt=night(tn);
  if(V.tgt){cam.x+=(V.tgt.x-cam.x)*.18;cam.y+=(V.tgt.y-cam.y)*.18;if(Math.abs(V.tgt.x-cam.x)+Math.abs(V.tgt.y-cam.y)<.5)V.tgt=null;}
  c.setTransform(V.dpr,0,0,V.dpr,0,0);
  Iso.World.draw(c,V.world,cam,t,{night:nt,w:W,h:H});
  tone(c,W,H);
  var hits=V.hits={bub:[],bld:[],emp:[],riv:[]};
  var pulse=.5+.5*Math.sin(t*3),i,k;
  /* boş yuvalar */
  if(V.tab==='planet'){
    for(i=0;i<14;i++){k=V.order[i];var b=V.list[k];if(b&&b.type)continue;
      var p=slotPos(k);
      c.save();c.translate(p.x,p.y);c.scale(z,z);
      c.fillStyle='rgba(120,230,255,'+(.10+.08*pulse)+')';c.beginPath();c.moveTo(0,-15);c.lineTo(31,0);c.lineTo(0,15);c.lineTo(-31,0);c.closePath();c.fill();
      c.strokeStyle='rgba(150,240,255,.85)';c.lineWidth=2/z*Math.max(.8,z);c.setLineDash([7,5]);c.lineDashOffset=-t*10;c.stroke();c.setLineDash([]);c.restore();
      Iso.icon(c,k===13?'ship':'plus',p.x,p.y-2,clamp(26*z/.6,24,38),{alpha:.7+.3*pulse});
      hits.emp.push({slot:k,x:p.x,y:p.y});}
  }
  /* binalar */
  for(i=0;i<14;i++){
    k=V.order[i];var bl=V.list[k];if(!bl||!bl.type)continue;
    var q=slotPos(k);
    if(q.x<-120||q.x>W+120||q.y<-160||q.y>H+120)continue;
    var o={t:t,scale:z,night:nt,selected:k===V.sel&&V.tab==='planet',dir:k===13?V.world.port.dir:0};
    var inJob=bl.job,jp=0;
    if(inJob){jp=clamp((tn-bl.job.t0)/Math.max(1,bl.job.t1-bl.job.t0),0,1);}
    if(bl.lv===0)o.progress=Math.max(.03,jp);
    if(bl.damaged)o.damaged=clamp((bl.dmgUntil-tn)/(TUNE.dmgH*HR),.15,1);
    var bd=Iso.building(c,bl.type,Math.max(1,bl.lv),s.civ,q.x,q.y,o);
    if(bd){
      hits.bld.push({slot:k,x0:bd.x0,x1:bd.x1,y0:bd.y0,y1:bd.y1});
      if(inJob){
        var rem=Math.max(0,bl.job.t1-tn);
        pill(c,(bd.x0+bd.x1)/2,bd.y0+2,tm(rem),{icon:bl.job.kind==='build'?'build':'upgrade',col:'#ffffff'});
        if(bl.lv===0&&Math.random()<.04)V.fxs.emit('dust',q.x+(Math.random()-.5)*30*z,q.y,{n:2});
      }else{
        var rd=readyOf(bl,tn);
        if(rd&&V.tab==='planet'){var kk=Object.keys(rd)[0],bob=Math.sin(t*3+k)*3;
          var hb=pill(c,(bd.x0+bd.x1)/2,bd.y0+4+bob,'+'+rd[kk],{icon:kk,col:Iso.iconColor?Iso.iconColor(kk):'#ffd24a'});hb.slot=k;hits.bub.push(hb);}
      }
    }
  }
  /* gemiler */
  ships(c,t,tn,z);
  /* fx */
  if(V.fxs){V.fxs.step(dt);V.fxs.draw(c);}
  /* savaş sekmesi: karartma + rakip gezegenler */
  var dimT=V.tab==='war'?.62:0;V.dim+=(dimT-V.dim)*.15;
  if(V.dim>.01){c.fillStyle='rgba(3,8,26,'+V.dim.toFixed(3)+')';c.fillRect(0,0,W,H);}
  if(V.tab==='war')rivals(c,t,tn);
  /* kendi yok oluş etiketi konumu */
  if(!V.dynEl.hidden){var hp=slotPos(0),tx='translate('+Math.round(hp.x)+'px,'+Math.round(hp.y-70*z)+'px) translate(-50%,-50%)';if(V.dynEl._tx!==tx){V.dynEl.style.transform=tx;V.dynEl._tx=tx;}
    if(Math.random()<.02)V.fxs.emit('crack',hp.x,hp.y,{r:60*z,life:1.4});}
}
/* göz rahatlığı: zemine sakin ton (binalar ve arayüz bundan sonra çizilir, kontrast bozulmaz) */
var TONES={calm:{m:'rgb(150,166,160)',s:.42},dark:{m:'rgb(96,110,118)',s:.55}};
function tone(c,W,H){
  var o=TONES[V.tone];if(!o)return;
  c.save();c.globalCompositeOperation='multiply';c.fillStyle=o.m;c.fillRect(0,0,W,H);
  c.globalCompositeOperation='saturation';c.globalAlpha=o.s;c.fillStyle='#808080';c.fillRect(0,0,W,H);c.restore();
}
function ships(c,t,tn,z){
  var s=V.s,pd=V.world.pad,P=Iso.World.toScreen(V.world,V.cam,pd.i,pd.j),n=0,fx=V.fxs;
  s.fleet.forEach(function(f,i){
    var off=[[-14,3],[14,-3],[0,10]][i%3],x=P.x+off[0]*z,y=P.y+off[1]*z-4*z,alt=0,fl=0;
    if(f.state==='lost')return;
    if(f.state==='out'){var e=tn-f.t0;if(e>9000)return;alt=Math.pow(clamp(e/9000,0,1),1.6)*420;fl=1;}
    else if(f.state==='back'){var r=f.t1-tn;if(r>9000)return;alt=Math.pow(clamp(r/9000,0,1),1.6)*420;fl=r>600?1:0;}
    var yy=y-alt*z;
    Iso.ship(c,'logi',s.civ,x,yy,-Math.PI/2,t,{scale:z*.95,flame:fl});
    if(fl){fx.emit('flame',x,yy+26*z,{n:1,dir:Math.PI/2,size:7});if(alt<80&&Math.random()<.5)fx.emit('dust',x,y+6*z,{n:2});}
  });
}
function rivals(c,t,tn){
  var s=V.s;
  V.riv.forEach(function(q){
    var r=q.r,dy=0;
    if(r.state==='dying')dy=clamp(1-(r.killAt-tn)/(TUNE.rivalKillH*HR),0,1);
    if(r.state==='gone')return;
    var sel=V.rv===r.id;
    if(sel){c.strokeStyle='#7ee8ff';c.lineWidth=3;c.beginPath();c.arc(q.x,q.y,q.R+7,0,Math.PI*2);c.stroke();}
    Iso.rivalPlanet(c,hn(r.id),r.civ,q.x,q.y,q.R,t,{dying:dy,target:sel});
    if(r.state==='dying'){
      q.t.hidden=false;q.t.textContent='YOK OLUYOR '+tm(r.killAt-tn);
      if(Math.random()<.025)V.fxs.emit('crack',q.x,q.y,{r:q.R*1.2,life:1.4});
    }else q.t.hidden=true;
  });
}

/* ================= YUMURTA AKIŞI ================= */
function startEgg(memo){
  V.mode='egg';V.pops=[];if(V.popEl)closePop(true);
  V.wrap.classList.remove('is-game');V.wrap.classList.add('is-egg');
  var L=V.wrap.querySelector('.pl-eggl');if(L)L.remove();
  native('keepAwake',true);
  var cv=h('canvas',{class:'pl-ecv'}),ui=h('div',{class:'pl-eui'}),layer=h('div',{class:'pl-eggl'},cv,ui);
  V.wrap.appendChild(layer);
  var E=V.egg={cv:cv,ctx:cv.getContext('2d'),ui:ui,layer:layer,taps:0,shake:0,open:0,phase:memo?'memo':'egg',t0:V.t,fx:Iso.fx.new(7),stars:[],cracks:[],memo:memo,done:false};
  cv.width=Math.round(V.W*V.dpr);cv.height=Math.round(V.H*V.dpr);
  var r=SG.rng('egg|'+V.user+'|'+now());
  for(var i=0;i<90;i++)E.stars.push([r(),r(),r()*1.6+.4,r()*6]);
  for(var a=0;a<3;a++){var pts=[],x=(r()-.5)*.5,y=-.2+a*.28,dir=r()*.6-.3+(a%2?.4:-.4);
    for(var j=0;j<7;j++){pts.push([x,y]);x+=Math.cos(dir+(a%2?0:Math.PI)+((j%2)?.5:-.5)*r())*.12;y+=.07+r()*.05;}
    E.cracks.push(pts);}
  E.sp=[];for(var q=0;q<26;q++)E.sp.push([r(),r(),r()*.06+.02]);
  if(memo)eggMemo();else eggIntro();
  if(!memo&&!V.s)V.s=null;
}
function eggMemo(){
  var E=V.egg,m=E.memo||{},l=m.life||{},ui=E.ui;ui.textContent='';
  var civAd=(m.planet&&m.planet.civAd)||l.civAd||'';
  ui.appendChild(h('div',{class:'pl-memo'},h('div',{class:'pl-mk'},'ANMA'),h('h2',null,(m.planet&&m.planet.name)||l.name||'Gezegen'),
    h('p',{class:'pl-p'},civAd+' gezegeni yok oldu.'),
    h('div',{class:'pl-stats'},stat('Ömür',SG.fmt.dur((l.lifeMs||0)/1000)),stat('Merkez Sv.',String(l.hallLv||1)),stat('Zafer',String(l.wins||0)),stat('Yenilgi',String(l.losses||0))),
    h('p',{class:'pl-p pl-mut'},'Miras kalmaz. Yeni yumurtadan rastgele bir medeniyet doğacak.'),
    btn('Yeni yumurta','gold big',function(){snd('select');eggIntro();},'planet')));
  E.phase='memo';
}
function eggIntro(){
  var E=V.egg,ui=E.ui;ui.textContent='';E.phase='egg';E.taps=0;E.t0=V.t;
  /* yeni durum bellekte; kayıt reveal sonunda */
  if(!V.s||V.s.dead){
    try{if(V.s&&V.s.dead){PS.save(V.s);V.s=PS.newLife(V.user,now());}else V.s=PS.create(V.user,now());}catch(e){SG.log.err('egg.create',e);}
  }
  E.hint=h('div',{class:'pl-ehint'},'Yumurtaya dokun');
  E.btn=btn('Çatlat (1/3)','gold big',function(){eggTap();},'planet');
  ui.appendChild(h('div',{class:'pl-eb'},E.hint,E.btn));
  E.cv.onpointerdown=function(e){if(E.phase==='egg')eggTap();};
}
function eggTap(){
  var E=V.egg;if(!E||E.phase!=='egg')return;
  E.taps++;E.shake=1;snd('egg-crack');
  var w=V.W,hh=V.H;
  E.fx.emit('spark',w/2,hh*.42,{n:8,color:'#ffd24a'});
  if(E.taps<3){E.btn.querySelector('span').textContent='Çatlat ('+(E.taps+1)+'/3)';E.hint.textContent=E.taps===1?'Çatlak büyüyor...':'Bir kez daha!';return;}
  E.phase='hatch';E.t0=V.t;E.btn.hidden=true;E.hint.textContent='';
  setTimeout(function(){if(!V||!V.egg)return;snd('unlock');var o=V.egg;o.phase='open';o.t0=V.t;o.fx.emit('ring',V.W/2,V.H*.42,{r:160,life:1,width:5,color:'#fff2a8'});o.fx.emit('confetti',V.W/2,V.H*.42,{n:70,speed:300});o.fx.emit('spark',V.W/2,V.H*.42,{n:30,color:'#fff2a8',speed:160});},700);
  V.eggT=setTimeout(function(){if(V&&V.egg)eggReveal();},2300);
}
function eggReveal(){
  var E=V.egg,s=V.s,c=civ(s.civ),ui=E.ui;E.phase='reveal';ui.textContent='';
  var pal=c.pal;
  var an=h('div',{class:'pl-an'});c.hayvanlar.forEach(function(a){an.appendChild(h('div',{class:'pl-animal'},h('b',null,a.ad),h('span',null,'Beceri '+a.skill+' · Saldırı '+a.atk)));});
  var card=h('div',{class:'pl-reveal',style:{'--c1':pal.c1,'--c2':pal.c2,'--c3':pal.c3}},
    h('div',{class:'pl-mk'},'YUMURTA ÇATLADI'),
    h('div',{class:'pl-rcn'},h('i',{style:{background:pal.c1}}),h('i',{style:{background:pal.c2}}),h('i',{style:{background:pal.c3}})),
    h('h2',null,c.ad),h('div',{class:'pl-cls'},c.sinif+' medeniyeti · Gezegenin: '+s.name),
    h('p',{class:'pl-quote'},'“'+c.slogan+'”'),
    h('div',{class:'pl-rrow'},h('span',null,'Lider'),h('b',null,c.lider.ad),h('em',null,'“'+c.lider.soz+'”')),
    h('div',{class:'pl-rrow'},h('span',null,'Yönetim'),h('b',null,c.yonetim.ad),h('em',null,c.yonetim.ozet)),
    h('div',{class:'pl-rrow'},h('span',null,'Hayvanlar')),an,
    btn('Gezegene git','gold big',function(){snd('confirm');enterWorld();},'planet'));
  ui.appendChild(card);
  snd('reward');
}
function enterWorld(){
  var E=V.egg;if(!E)return;
  clearTimeout(V.eggT);
  if(E.layer.parentNode)E.layer.parentNode.removeChild(E.layer);
  native('keepAwake',false);
  V.egg=null;
  try{PS.save(V.s);}catch(e){}
  V.tab='planet';V.sel=-1;
  beginGame();
  drain();
}
function drawEgg(dt){
  var E=V.egg;if(!E||!E.ctx)return;
  var c=E.ctx,W=V.W,H=V.H,t=V.t-E.t0,T=V.t;
  c.setTransform(V.dpr,0,0,V.dpr,0,0);
  var g=c.createRadialGradient(W/2,H*.42,10,W/2,H*.5,Math.max(W,H)*.8);
  g.addColorStop(0,'#2a2058');g.addColorStop(.5,'#10153a');g.addColorStop(1,'#04050f');
  c.fillStyle=g;c.fillRect(0,0,W,H);
  E.stars.forEach(function(s){var a=.35+.65*Math.abs(Math.sin(T*.8+s[3]));c.fillStyle='rgba(255,255,255,'+a.toFixed(2)+')';c.fillRect(s[0]*W,s[1]*H,s[2],s[2]);});
  if(E.phase==='memo'){drawEggBody(c,W,H,T,E,0,true);E.fx.step(dt);E.fx.draw(c);return;}
  if(E.shake>0)E.shake=Math.max(0,E.shake-dt*2.2);
  var cr=E.phase==='egg'?E.taps/3:1;
  var op=E.phase==='open'||E.phase==='reveal'?clamp(t/1.1,0,1):0;
  drawEggBody(c,W,H,T,E,op,false,cr);
  E.fx.step(dt);E.fx.draw(c);
}
function eggPath(c,rw,rh){
  c.beginPath();
  for(var i=0;i<=40;i++){var u=i/40*Math.PI,x=rw*Math.sin(u)*(1-.16*Math.cos(u)),y=-rh*Math.cos(u);if(i)c.lineTo(x,y);else c.moveTo(x,y);}
  for(i=40;i>=0;i--){u=i/40*Math.PI;c.lineTo(-rw*Math.sin(u)*(1-.16*Math.cos(u)),-rh*Math.cos(u));}
  c.closePath();
}
function drawEggBody(c,W,H,T,E,op,dim,cr){
  var cx=W/2,cy=H*.42,rw=Math.min(W*.27,118),rh=rw*1.3,sh=E.shake>0?Math.sin(T*50)*E.shake*7:0,wob=E.phase==='egg'?Math.sin(T*1.6)*.025+(E.shake>0?Math.sin(T*45)*E.shake*.09:0):0;
  cr=cr||0;
  /* ışıma */
  var gl=c.createRadialGradient(cx,cy,rw*.2,cx,cy,rw*(2.1+cr+op*2.4));
  gl.addColorStop(0,'rgba(255,226,120,'+(.25+cr*.35+op*.5)+')');gl.addColorStop(1,'rgba(255,200,80,0)');
  c.fillStyle=gl;c.fillRect(0,0,W,H);
  c.save();c.translate(cx+sh,cy);c.rotate(wob);
  function shell(top){
    c.save();
    if(op>0){var k=op*op;c.translate((top?-1:1)*k*rw*.55,(top?-1:1)*k*rh*.55);c.rotate((top?-1:1)*k*.5);
      c.beginPath();var zz=[[-2,-.02],[-.7,.08],[-.35,-.12],[0,.06],[.35,-.1],[.7,.08],[2,-.02]];
      c.moveTo(-rw*2,top?-rh*2:rh*2);zz.forEach(function(p){c.lineTo(p[0]*rw,p[1]*rh);});c.lineTo(rw*2,top?-rh*2:rh*2);c.closePath();c.clip();}
    eggPath(c,rw,rh);
    var bg=c.createRadialGradient(-rw*.3,-rh*.4,rw*.1,0,0,rh*1.1);bg.addColorStop(0,'#fff6dc');bg.addColorStop(.55,'#f2d9a6');bg.addColorStop(1,'#b98a52');
    c.fillStyle=bg;c.fill();c.lineWidth=3.5;c.strokeStyle='#2a1c14';c.stroke();
    c.save();eggPath(c,rw,rh);c.clip();
    c.fillStyle='rgba(120,70,40,.28)';E.sp.forEach(function(s){c.beginPath();c.ellipse((s[0]-.5)*rw*1.7,(s[1]-.5)*rh*1.8,s[2]*rw,s[2]*rw*.8,0,0,7);c.fill();});
    c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(-rw*.35,-rh*.42,rw*.12,rh*.2,-.5,0,7);c.fill();
    /* çatlaklar */
    var n=Math.ceil(cr*3-.001);
    for(var a=0;a<n&&a<E.cracks.length;a++){
      var pts=E.cracks[a],part=a<n-1?1:(cr*3-a);part=clamp(part,0,1);
      var m=Math.max(2,Math.round(pts.length*part));
      c.lineJoin='round';c.lineCap='round';
      c.strokeStyle='rgba(255,226,120,.9)';c.lineWidth=9;c.globalAlpha=.35;c.beginPath();for(var i=0;i<m;i++){var p=pts[i];if(i)c.lineTo(p[0]*rw*1.4,p[1]*rh*1.2);else c.moveTo(p[0]*rw*1.4,p[1]*rh*1.2);}c.stroke();
      c.globalAlpha=1;c.strokeStyle='#2a1c14';c.lineWidth=3;c.stroke();
    }
    c.restore();c.restore();
  }
  shell(false);shell(true);
  c.restore();
  if(op>0){var lg=c.createRadialGradient(cx,cy,0,cx,cy,rw*1.5);lg.addColorStop(0,'rgba(255,250,215,'+(.8*(1-op*.5))+')');lg.addColorStop(1,'rgba(255,230,140,0)');c.fillStyle=lg;c.fillRect(0,0,W,H);}
}

/* ---------- genel bağlantılar ---------- */
window.addEventListener('sg-route',function(e){
  try{var r=String(e&&e.detail||'');var m=/^planet(?:[:/](\w+))?/.exec(r);if(m){if(m[1]&&/^(city|fleet|war|planet)$/.test(m[1]))SG._plTab=m[1];SG.go('planet');}else if(r)SG.go(r);}catch(er){SG.log.err('sg-route',er);}
});
/* geri düğmesi artık gezegene döner (eski evren sayfaları: günlük, kayıtlar, ayarlar) */
if(SG.HUD){SG.HUD.backBtn=function(){return h('button',{type:'button',class:'h-ibtn h-back','aria-label':'Gezegene dön',onclick:function(){snd('back');SG.go('planet');}},SG.HUD.ic('back',22));};}
/* sınama/hata ayıklama kancası */
SG.PL={
  state:function(){return V&&V.s;},tick:function(){if(V&&V.s&&V.mode==='game'){V.acc1=1;}},
  tab:function(t){if(V)setTab(t);},select:function(k){if(V){if(k<0){V.sel=-1;refresh(true);}else selectSlot(k,true);}},rival:function(id){if(V){V.rv=id;V.ssig='';refresh(true);}},
  pop:function(p){if(V){V.pops.push(p);showNext();}},night:function(n){if(V)V.nightOv=n;},menu:function(k){if(V)openBuildMenu(k);},
  mode:function(){return V&&V.mode;},tap:function(){if(V)eggTap();},reveal:function(){if(V&&V.egg)eggReveal();},
  refresh:function(){if(V){refreshList();refresh(true);}},cam:function(){return V&&V.cam;},eggOpen:function(){if(V&&V.egg){V.egg.phase='open';V.egg.t0=V.t-1.5;}},
  attack:function(r){if(V)attackMenu(SG.AI.byId(V.s,r));},focus:function(k){if(V)selectSlot(k,true);}
};
})();
