/* SpacEgg 2.0 — Çekmece menü (UI/UX): sol kenardan sağa kaydırınca açılır.
   API: SG.Drawer.open() / close() / toggle() / isOpen() / back() (açıksa kapatır, true döner) / enabled() */
(function(){
'use strict';
var h=SG.h,HUD=SG.HUD;
var D=SG.Drawer={};
var ENABLED={cosmos:1,journal:1,create:1};   // login/intro/prefs/saves/v1 görünümlerinde kapalı
var EDGE=22;                                 // sol kenar şeridi (px)
var edge=null,root=null,scrim=null,panel=null,bodyEl=null,headEl=null;
var isOpen=false,en=false,lastFocus=null,drag=null,suppressClick=0,built=false,statCache=null,toggles={};

function pw(){return Math.min(Math.round(window.innerWidth*.86),340);}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function rm(){return!!SG.RM;}

/* ---------- iskelet ---------- */
function build(){
  if(built)return;built=true;
  scrim=h('div',{class:'dr-scrim','aria-hidden':'true'});
  panel=h('aside',{class:'dr-panel',role:'dialog','aria-modal':'true','aria-label':'Menü',tabindex:'-1'});
  root=h('div',{class:'dr-root',hidden:'hidden'},scrim,panel);
  document.body.appendChild(root);
  scrim.addEventListener('click',function(){D.close();});
  /* panel içinde kaydırma sonrası oluşan sahte tıklamayı yut */
  root.addEventListener('click',function(e){if(suppressClick&&Date.now()-suppressClick<350){e.stopPropagation();e.preventDefault();suppressClick=0;}},true);
  window.addEventListener('resize',function(){if(isOpen)setX(pw());});
}
function setX(x){
  var w=pw();x=clamp(x,0,w);
  panel.style.width=w+'px';
  panel.style.transform='translate3d('+(x-w)+'px,0,0)';
  scrim.style.opacity=String(Math.round(x/w*60)/100);
  root.hidden=(x<=0);
  panel._x=x;
}
function settle(open){
  var w=pw();
  root.classList.remove('dr-drag');
  if(rm()){setX(open?w:0);if(!open)root.hidden=true;return;}
  root.classList.add('dr-anim');
  setX(open?w:0);
  clearTimeout(settle._t);
  settle._t=setTimeout(function(){root.classList.remove('dr-anim');if(!open)root.hidden=true;},260);
}
function menuBtns(v){var a=document.querySelectorAll('[data-dr-btn]');for(var i=0;i<a.length;i++)a[i].setAttribute('aria-expanded',v?'true':'false');}

/* sol kenar şeridi: touch-action:none, böylece tarayıcı yatay kaydırmayı/geri jestini çalmaz */
function mkEdge(){
  if(edge)return;
  edge=h('div',{class:'dr-edge','aria-hidden':'true'});
  document.body.appendChild(edge);
}
/* ---------- aç / kapat ---------- */
D.enabled=function(){return en;};
D.isOpen=function(){return isOpen;};
D.open=function(opt){
  if(!en||isOpen)return false;
  build();
  fill();
  isOpen=true;root.hidden=false;
  if(!(opt&&opt.dragging)){settle(true);}
  menuBtns(true);
  lastFocus=document.activeElement;
  document.body.classList.add('dr-lock');
  var c=panel.querySelector('.dr-close');
  setTimeout(function(){try{(c||panel).focus({preventScroll:true});}catch(e){}},rm()?0:60);
  try{SG.bus.emit('drawer',{open:true});}catch(e){}
  setTimeout(lazyStats,30);
  return true;
};
D.close=function(opt){
  if(!isOpen){return false;}
  isOpen=false;
  menuBtns(false);
  document.body.classList.remove('dr-lock');
  if(opt&&opt.instant){clearTimeout(settle._t);root.classList.remove('dr-anim','dr-drag');setX(0);root.hidden=true;}
  else settle(false);
  if(!(opt&&opt.nofocus)){try{if(lastFocus&&lastFocus.isConnected&&lastFocus.focus)lastFocus.focus({preventScroll:true});}catch(e){}}
  lastFocus=null;
  try{SG.bus.emit('drawer',{open:false});}catch(e){}
  return true;
};
D.toggle=function(){return isOpen?D.close():D.open();};
/* Android geri tuşu: Java onBackPressed önce bunu çağırmalı; true = tüketildi */
D.back=function(){if(isOpen){D.close();return true;}return false;};

function go(route,params){
  try{SG.A2&&SG.A2.ui&&SG.A2.ui('tap');}catch(e){}
  D.close({instant:true,nofocus:true});
  try{SG.go(route,params);}catch(e){SG.log.err('drawer.go',e);}
}

/* ---------- içerik ---------- */
function ic(n,s){var w=h('span',{class:'dr-ic'});w.appendChild(HUD.ic(n,s||22));return w;}
function row(icon,title,sub,fn,o){
  o=o||{};
  var b=h('button',{type:'button',class:'dr-row'+(o.cls?' '+o.cls:''),'aria-expanded':o.expand?'false':null,onclick:fn});
  b.appendChild(ic(icon));
  var tx=h('span',{class:'dr-tx'},h('span',{class:'dr-title'},title));
  if(sub!=null&&sub!=='')tx.appendChild(h('span',{class:'dr-sub'},sub));
  b.appendChild(tx);
  if(o.tag!=null&&o.tag!=='')b.appendChild(h('span',{class:'dr-tag'},o.tag));
  var ch=ic(o.expand?'down':'chevr',18);ch.classList.add('dr-ch');b.appendChild(ch);
  return b;
}
function section(title){return h('h2',{class:'dr-h'},title);}
function user(){try{return SG.G&&SG.G.name&&SG.G.name()||'';}catch(e){return'';}}
function prog(uni){try{return uni&&SG.Disc&&SG.Disc.progress?SG.Disc.progress(uni):null;}catch(e){return null;}}
function fmt(n){return n==null?'—':Number(n).toLocaleString('tr-TR');}

function fill(){
  var uni=HUD.uni(),pr=prog(uni);
  panel.textContent='';toggles={};
  /* başlık */
  var nm=user();
  var chips=h('div',{class:'dr-chips'});
  if(pr&&pr.title)chips.appendChild(h('span',{class:'dr-chip dr-tag'},pr.title));
  if(pr&&pr.badges)chips.appendChild(h('span',{class:'dr-chip'},HUD.ic('star',14),h('span',null,'Rozet '+pr.badges.earned+'/'+pr.badges.total)));
  if(uni)chips.appendChild(h('span',{class:'dr-chip num'},HUD.ic('clock',14),h('span',null,HUD.cosmic(uni.t))));
  headEl=h('header',{class:'dr-head'},
    h('div',{class:'dr-avatar','aria-hidden':'true'},HUD.ic('user',26)),
    h('div',{class:'dr-who'},h('div',{class:'dr-user'},nm||'Gezgin'),h('div',{class:'dr-uni'},uni?uni.name:'Henüz evren yok'),chips),
    h('button',{type:'button',class:'h-ibtn dr-close','aria-label':'Menüyü kapat',onclick:function(){D.close();}},HUD.ic('close',22)));
  panel.appendChild(headEl);
  bodyEl=h('div',{class:'dr-body'});panel.appendChild(bodyEl);

  /* --- EVREN --- */
  bodyEl.appendChild(section('Evren'));
  if(uni){
    var card=h('div',{class:'dr-card',role:'group','aria-label':'Evrenim'});
    card.appendChild(h('div',{class:'dr-card-h'},HUD.ic('globe',18),h('b',null,'Evrenim')));
    var grid=h('div',{class:'dr-stats'});
    [['g','Galaksi'],['s','Yıldız'],['p','Gezegen'],['o','Gözlenen']].forEach(function(k){
      grid.appendChild(h('div',{class:'dr-stat'},h('span',{class:'dr-n num','data-k':k[0]},'…'),h('span',{class:'dr-l'},k[1])));});
    card.appendChild(grid);
    card.appendChild(meter('Keşif ilerlemesi',pr?pr.done:0,pr?pr.total:0,'disc'));
    card.appendChild(meter('Galaksi gözlemi',0,uni.galaxies?uni.galaxies.length:0,'gal'));
    bodyEl.appendChild(card);
  }
  /* Evrenlerim (satır içi açılır liste) */
  var saves=[];try{saves=SG.S&&SG.S.list?SG.S.list()||[]:[];}catch(e){}
  var list=h('div',{class:'dr-sublist',hidden:'hidden',role:'list'});
  var rowU=row('layers','Evrenlerim',saves.length+' kayıtlı evren',function(){var o=list.hidden;list.hidden=!o;rowU.setAttribute('aria-expanded',o?'true':'false');rowU.classList.toggle('open',o);},{expand:true});
  bodyEl.appendChild(rowU);
  saves.forEach(function(s){
    var cur=uni&&uni.id===s.id;
    var it=h('button',{type:'button',class:'dr-item'+(cur?' cur':''),role:'listitem','aria-current':cur?'true':null,onclick:function(){
      if(cur){D.close();return;}
      try{SG.S.save();}catch(e){}
      var u=null;try{u=SG.S.open(s.id);}catch(e){SG.log.err('drawer.open',e);}
      if(u)go('cosmos');else{it.classList.add('bad');}
    }},h('span',{class:'dr-title'},s.name||'Adsız evren'),h('span',{class:'dr-sub num'},HUD.cosmic(s.t)+' · '+s.seed+(cur?' · açık':'')));
    list.appendChild(it);
  });
  if(!saves.length)list.appendChild(h('div',{class:'dr-empty'},'Henüz kayıtlı evren yok.'));
  bodyEl.appendChild(list);
  bodyEl.appendChild(row('plus','Yeni evren','Yeni bir tohumdan başla',function(){go('create');}));

  /* --- KAYIT --- */
  bodyEl.appendChild(section('Kayıt'));
  bodyEl.appendChild(row('save','Kayıtlar','Evrenlerini aç, adlandır, sil',function(){go('saves');}));
  bodyEl.appendChild(row('down2','Yedekler ve dışa aktar','Evrenini metin olarak yedekle',function(){go('saves',{focus:'export'});}));
  bodyEl.appendChild(row('copy','İçe aktar','Yedek metnini geri yükle',function(){go('saves',{focus:'import'});}));

  /* --- KEŞİF --- */
  bodyEl.appendChild(section('Keşif'));
  bodyEl.appendChild(row('book','Günlük','Kozmik tarihçe',function(){go('journal',{tab:'history'});}));
  bodyEl.appendChild(row('star','Keşifler ve rozetler',pr?pr.done+' / '+pr.total+' keşif':'',function(){go('journal',{tab:'disc'});},{tag:pr&&pr.badges?pr.badges.earned+'/'+pr.badges.total:''}));
  var gl=h('div',{class:'dr-sublist dr-goals',hidden:'hidden'});
  var goals=[];try{goals=uni&&SG.Disc&&SG.Disc.goals?SG.Disc.goals(uni)||[]:[];}catch(e){}
  goals.forEach(function(g){gl.appendChild(h('div',{class:'dr-goal'},h('span',{class:'dr-title'},g.hint||''),g.cat?h('span',{class:'dr-sub'},g.cat):null));});
  if(!goals.length)gl.appendChild(h('div',{class:'dr-empty'},uni?'Şu an ipucu yok. Evreni gezip gözlemledikçe yenileri belirir.':'Önce bir evren yarat.'));
  var rowG=row('target','Hedefler',goals.length?goals.length+' ipucu':'İpuçları',function(){var o=gl.hidden;gl.hidden=!o;rowG.setAttribute('aria-expanded',o?'true':'false');rowG.classList.toggle('open',o);},{expand:true});
  bodyEl.appendChild(rowG);bodyEl.appendChild(gl);

  /* --- ARAÇLAR --- */
  bodyEl.appendChild(section('Araçlar'));
  bodyEl.appendChild(row('camera','Fotoğraf modu','Arayüzsüz kare çek',function(){
    D.close({instant:true,nofocus:true});
    if(SG.current()==='cosmos')SG.bus.emit('hud:photo',{});else SG.go('cosmos',{photo:true});
  }));
  bodyEl.appendChild(quick());
  bodyEl.appendChild(row('sliders','Ayarlar','Erişilebilirlik, ses ve kalite',function(){go('prefs');}));
  bodyEl.appendChild(row('help','Rehber','Başlangıç rehberini yeniden göster',function(){HUD.resetOnboarding();go('cosmos');}));

  /* --- HAKKINDA --- */
  bodyEl.appendChild(section('Hakkında'));
  var ab=about();
  var rowA=row('info','Hakkında','SpacEgg, Fambo ve vizyon',function(){var o=ab.hidden;ab.hidden=!o;rowA.setAttribute('aria-expanded',o?'true':'false');rowA.classList.toggle('open',o);},{expand:true});
  bodyEl.appendChild(rowA);bodyEl.appendChild(ab);
  bodyEl.appendChild(row('globe','Eski SpacEgg (v1)','Gezegen büyütme oyunu olduğu gibi duruyor',function(){go('hub');}));
  bodyEl.appendChild(h('div',{class:'dr-ver num'},'SpacEgg '+(SG.ver||'2.0')+(SG.codename?' · '+SG.codename:'')+(SG.verCode?' · sürüm kodu '+SG.verCode:'')));
  bodyEl.appendChild(h('button',{type:'button',class:'btn danger block dr-out',onclick:function(){
    try{SG.A2&&SG.A2.ui&&SG.A2.ui('close');}catch(e){}
    D.close({instant:true,nofocus:true});
    try{SG.S&&SG.S.save&&SG.S.save();}catch(e){}
    try{SG.G.logout();}catch(e){SG.go('login');}
  }},HUD.ic('exit',18),h('span',null,'Çıkış yap')));
}

function meter(label,v,t,key){
  var p=t>0?Math.round(v/t*100):0;
  var bar=h('i',{style:{width:p+'%'}});
  var val=h('span',{class:'num'},fmt(v)+' / '+fmt(t)+' · %'+p);
  var m=h('div',{class:'dr-meter','data-m':key},h('div',{class:'dr-meter-t'},h('span',null,label),val),h('div',{class:'dr-bar',role:'progressbar','aria-label':label,'aria-valuemin':'0','aria-valuemax':String(t),'aria-valuenow':String(v)},bar));
  m._bar=bar;m._val=val;m._lab=label;m._pb=m.querySelector('.dr-bar');
  return m;
}
function setMeter(m,v,t){if(!m)return;var p=t>0?Math.round(v/t*100):0;m._bar.style.width=p+'%';m._val.textContent=fmt(v)+' / '+fmt(t)+' · %'+p;m._pb.setAttribute('aria-valuenow',String(v));m._pb.setAttribute('aria-valuemax',String(t));}

/* evren sayıları: yıldız/gezegen için galaksiler (önbellekli) taranır; kaydı büyütmez */
function lazyStats(){
  if(!isOpen)return;
  var uni=HUD.uni();if(!uni||!bodyEl)return;
  var key=uni.id+':'+(uni.galaxies||[]).length;
  var st=(statCache&&statCache.key===key)?statCache.v:null;
  if(!st){
    st={g:(uni.galaxies||[]).length,s:0,p:0};
    try{(uni.galaxies||[]).forEach(function(g){var d=SG.U.galaxy(uni,g.id);if(!d||!d.stars)return;st.s+=d.stars.length;for(var i=0;i<d.stars.length;i++)st.p+=d.stars[i].planetCount||0;});}
    catch(e){SG.log.err('drawer.stats',e);st.s=st.p=null;}
    statCache={key:key,v:st};
  }
  var ob=(uni.state&&uni.state.observed)||{},o=0,og=0;
  Object.keys(ob).forEach(function(k){if(ob[k]>0){o++;if(/^g\d+$/.test(k))og++;}});
  var set=function(k,v){var e=bodyEl.querySelector('.dr-n[data-k="'+k+'"]');if(e)e.textContent=fmt(v);};
  set('g',st.g);set('s',st.s);set('p',st.p);set('o',o);
  setMeter(bodyEl.querySelector('.dr-meter[data-m="gal"]'),og,st.g);
}

/* hızlı ayarlar */
function tile(icon,label,get,set){
  var on=get();
  var b=h('button',{type:'button',class:'dr-tile',role:'switch','aria-checked':on?'true':'false',onclick:function(){
    on=!on;b.setAttribute('aria-checked',on?'true':'false');try{set(on);}catch(e){SG.log.err('drawer.tile',e);}
    try{SG.A2&&SG.A2.ui&&SG.A2.ui('tap');}catch(e){}
  }});
  b.appendChild(HUD.ic(icon,22));b.appendChild(h('span',null,label));
  return b;
}
function quick(){
  var box=h('div',{class:'dr-quick',role:'group','aria-label':'Hızlı ayarlar'});
  box.appendChild(h('div',{class:'dr-quick-h'},HUD.ic('sliders',18),h('b',null,'Hızlı ayarlar')));
  var g=h('div',{class:'dr-tiles'});
  g.appendChild(tile('volume','Ses',function(){return!SG.store.get('mute',false);},function(on){SG.store.set('mute',!on);try{SG.A&&SG.A.mute&&SG.A.mute(!on);}catch(e){}}));
  g.appendChild(tile('music','Müzik',function(){return SG.store.get('vol_music',.26)>0;},function(on){
    var v=SG.store.get('vol_music',.26);
    if(on){var pv=SG.store.get('vol_music_prev',.26);v=pv>0?pv:.26;}else{if(v>0)SG.store.set('vol_music_prev',v);v=0;}
    SG.store.set('vol_music',v);try{SG.A&&SG.A.setVol&&SG.A.setVol('music',v);}catch(e){}}));
  g.appendChild(tile('spark','Hareketi azalt',function(){return HUD.prefs.rm();},function(on){HUD.setRM(on);}));
  g.appendChild(tile('eye','Yüksek kontrast',function(){return HUD.prefs.hc();},function(on){HUD.setHC(on);}));
  box.appendChild(g);
  box.appendChild(h('div',{class:'dr-quick-l'},'Yazı boyutu'));
  box.appendChild(HUD.seg({cls:'dr-seg',label:'Yazı boyutu',value:HUD.prefs.ts(),items:[{v:1,label:'%100'},{v:1.25,label:'%125'},{v:1.5,label:'%150'}],onChange:function(v){HUD.setTS(v);}}));
  box.appendChild(h('div',{class:'dr-quick-l'},'Grafik kalitesi'));
  var q=SG.store.get('q2','auto');
  box.appendChild(HUD.seg({cls:'dr-seg',label:'Grafik kalitesi',value:q,items:[{v:'auto',label:'Oto'},{v:0,label:'Düşük'},{v:1,label:'Orta'},{v:2,label:'Yüksek'}],onChange:function(v){SG.store.set('q2',v);try{SG.P.setTier(v);}catch(e){SG.log.err('drawer.tier',e);}}}));
  return box;
}

/* hakkında: metinler SG.TXT.login / SG.T2.about içinden; uydurma metin yok */
function about(){
  var box=h('div',{class:'dr-sublist dr-about',hidden:'hidden'});
  var L=(SG.TXT&&SG.TXT.login)||{},A=(SG.T2&&SG.T2.about)||{};
  box.appendChild(h('div',{class:'dr-ab-by'},h('b',null,'SpacEgg'),h('span',null,L.byLine||A.dev||'Fambo tarafından geliştirildi')));
  if(L.sloganEn)box.appendChild(h('p',{class:'dr-quote'},L.sloganEn));
  if(A.vision)box.appendChild(h('p',null,A.vision));
  if(A.principles&&A.principles.length){var ul=h('ul',{class:'dr-pr'});A.principles.forEach(function(t){ul.appendChild(h('li',null,t));});box.appendChild(ul);}
  if(L.pledge)box.appendChild(h('div',{class:'dr-ab-c'},h('b',null,L.pledge.h),h('p',null,L.pledge.p)));
  if(L.vision)box.appendChild(h('div',{class:'dr-ab-c'},h('b',null,L.vision.h),h('p',null,L.vision.p)));
  if(L.roadmapNote)box.appendChild(h('p',{class:'dr-note'},L.roadmapNote));
  if(L.footer)box.appendChild(h('p',{class:'dr-note'},L.footer));
  return box;
}

/* ---------- jestler ---------- */
function onDown(e){
  if(!en)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(drag)return;
  var w=pw();
  if(!isOpen){
    if(e.clientX>EDGE)return;
    build();
    drag={id:e.pointerId,x0:e.clientX,y0:e.clientY,t0:performance.now(),mode:'open',started:false,w:w,last:e.clientX,lt:performance.now(),v:0};
    e.stopPropagation();                      // canvas bu dokunuşu görmesin
  }else{
    var inR=root&&root.contains(e.target);
    if(!inR)return;
    drag={id:e.pointerId,x0:e.clientX,y0:e.clientY,t0:performance.now(),mode:'close',started:false,w:w,last:e.clientX,lt:performance.now(),v:0};
  }
}
function onMove(e){
  if(!drag||e.pointerId!==drag.id)return;
  var dx=e.clientX-drag.x0,dy=e.clientY-drag.y0,now=performance.now();
  if(!drag.started){
    var adx=Math.abs(dx),ady=Math.abs(dy);
    if(drag.mode==='open'&&adx>8&&adx>ady*1.2&&dx>0){
      drag.started=true;
      if(!isOpen){fill();root.hidden=false;root.classList.remove('dr-anim');root.classList.add('dr-drag');isOpen=true;lastFocus=document.activeElement;document.body.classList.add('dr-lock');menuBtns(true);setTimeout(lazyStats,30);}
    }else if(drag.mode==='close'&&adx>8&&adx>ady*1.2&&dx<0){
      drag.started=true;root.classList.remove('dr-anim');root.classList.add('dr-drag');
    }else if(ady>14&&ady>adx){drag=null;return;}   // dikey kaydırma: çekmece değil
    if(!drag){return;}
  }
  if(drag.started){
    var x=drag.mode==='open'?dx:drag.w+dx;
    setX(x);
    var dt=now-drag.lt;if(dt>0){drag.v=(e.clientX-drag.last)/dt;drag.last=e.clientX;drag.lt=now;}
    e.stopPropagation();
  }else if(drag.mode==='open'){e.stopPropagation();}
}
function onUp(e){
  if(!drag||e.pointerId!==drag.id)return;
  var d=drag;drag=null;
  if(d.started){
    e.stopPropagation();
    if(d.mode==='close')suppressClick=Date.now();
    var x=panel._x||0,w=d.w;
    var open=d.v>.45?true:d.v<-.45?false:x>w*.4;
    if(open){isOpen=true;settle(true);setTimeout(function(){var c=panel.querySelector('.dr-close');try{(c||panel).focus({preventScroll:true});}catch(er){}},rm()?0:80);try{SG.bus.emit('drawer',{open:true});}catch(er){}}
    else{isOpen=true;D.close();}
  }else if(d.mode==='open'){e.stopPropagation();}
}
function onCancel(e){
  if(!drag||e.pointerId!==drag.id)return;
  var d=drag;drag=null;
  if(d.started){var open=(panel._x||0)>d.w*.5;if(open){isOpen=true;settle(true);}else{isOpen=true;D.close();}}
}
document.addEventListener('pointerdown',onDown,true);
document.addEventListener('pointermove',onMove,true);
document.addEventListener('pointerup',onUp,true);
document.addEventListener('pointercancel',onCancel,true);

/* klavye: Esc kapatır, Tab odağı çekmecede tutar; Alt+M menüyü açar */
document.addEventListener('keydown',function(e){
  if(!en)return;
  if(!isOpen){
    if(e.altKey&&(e.key==='m'||e.key==='M')){e.preventDefault();D.open();}
    return;
  }
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();D.close();return;}
  if(e.key==='Tab'){
    var f=panel.querySelectorAll('button:not([disabled]),[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
    var vis=[];for(var i=0;i<f.length;i++){if(f[i].offsetParent!==null)vis.push(f[i]);}
    if(!vis.length)return;
    var a=document.activeElement,first=vis[0],last=vis[vis.length-1];
    if(!panel.contains(a)){e.preventDefault();first.focus();}
    else if(e.shiftKey&&a===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&a===last){e.preventDefault();first.focus();}
  }
},true);

/* görünüm değişimi: yalnız belirli görünümlerde etkin; açıksa anında kapan */
SG.bus.on('view',function(d){
  var n=d&&d.name;
  en=!!ENABLED[n];mkEdge();edge.hidden=!en;
  if(isOpen)D.close({instant:true,nofocus:true});
  if(!en&&root){root.hidden=true;}
  drag=null;
});
window.addEventListener('hashchange',function(){if(isOpen)D.close({instant:true,nofocus:true});});
window.addEventListener('sg-pause',function(){if(isOpen)D.close({instant:true,nofocus:true});});
/* yazı boyutu / kontrast değişince açık panel kendini tazelemez; ayarlar CSS değişkenleriyle zaten anında yansır */
})();
