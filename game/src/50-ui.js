/* SpacEgg v1.0 — arayüz görünümleri */
(function(){
'use strict';
var h=SG.h,U=SG.UI;
var TYPE_ORDER=['sav','med','loj','yik','yar'];
var TYPE_FALLBACK={sav:{name:'Savaşçı',color:'#FF5A4D',icon:'war'},med:{name:'Medeniyet',color:'#46E39B',icon:'city'},loj:{name:'Lojistik',color:'#FFC83D',icon:'cargo'},yik:{name:'Yıkıcı',color:'#B15CFF',icon:'blackhole'},yar:{name:'Yaratıcı',color:'#4DD6FF',icon:'creation'}};
var CATS={gelistir:'Geliştir',savunma:'Savunma',saldiri:'Saldırı',uretim:'Üretim',diplomasi:'Diplomasi',kozmetik:'Görünüm'};
var G=function(){return SG.G||{};};
function types(){var T=SG.D&&SG.D.TYPES;if(!T)return TYPE_FALLBACK;if(Array.isArray(T)){var o={};T.forEach(function(x){o[x.id]=x;});return o;}return T;}
function T(id){var t=types()[id];return t||TYPE_FALLBACK[id]||{name:id||'',color:'#4DD6FF',icon:'planet'};}
function eggs(){var e=SG.D&&SG.D.EGGS;if(!e)return[];return Array.isArray(e)?e:Object.keys(e).map(function(k){return e[k];});}
function eggById(id){return eggs().filter(function(e){return e.id===id;})[0];}
function user(){try{return G().user&&G().user();}catch(e){return null;}}
function planet(){try{return G().planet&&G().planet();}catch(e){return null;}}
function g(fn){var a=Array.prototype.slice.call(arguments,1);try{var f=G()[fn];return f?f.apply(G(),a):{ok:false,err:'Bu özellik henüz hazır değil.'};}catch(e){SG.log.err('G.'+fn,e);return{ok:false,err:'Beklenmeyen hata.'};}}
var lastSnd={};
function snd(id,o){var n=Date.now();if(lastSnd[id]&&n-lastSnd[id]<110)return;lastSnd[id]=n;try{SG.A&&SG.A.play&&SG.A.play(id,o);}catch(e){}}
var FB={egg:'●',planet:'◐',map:'✦',coin:'¢',target:'◎',settings:'⚙',story:'☰',bolt:'⚡',lock:'🔒',close:'✕',back:'‹',satellite:'☄',sound:'♪',music:'♫'};
function ic(name,o){o=o||{};try{if(SG.E&&SG.E.icon){var el=SG.E.icon(name||'unknown',o);if(el&&el.nodeType)return el;}}catch(e){}
  var s=h('span',{class:'ic fbic',style:{fontSize:(o.size||20)+'px',color:o.color||'inherit'}},FB[name]||'•');return s;}
function setTheme(t){var a=document.getElementById('app');if(a){if(t)a.setAttribute('data-t',t);else a.removeAttribute('data-t');}}
function curType(){var p=planet();return p&&p.type?p.type:null;}
function vib(ms){try{if(!SG.RM&&navigator.vibrate)navigator.vibrate(ms||8);}catch(e){}}
function coinEl(n){return h('span',{class:'coin'},h('i'),SG.fmt.int(n==null?0:n));}
function priceNodes(price){
  if(price==null)return[h('span',{class:'mute'},'Ücretsiz')];
  if(typeof price==='number')return[coinEl(price)];
  var out=[];Object.keys(price).forEach(function(k){if(k==='coin')out.push(coinEl(price[k]));else{var r=resMeta(k);out.push(h('span',{class:'chip'},ic(r.icon,{size:14,color:r.color}),SG.fmt.num(price[k])+' '+(r.name||k)));}});return out;}
function resMeta(id){var p=planet();var t=T(p&&p.type);var rs=(t.res||[]).filter(function(r){return r.id===id;})[0];return rs||{id:id,name:id,icon:'atom',color:'#8f96b8'};}
function rewardText(r){if(!r)return'';var a=[];if(r.coin)a.push(r.coin+' coin');if(r.xp)a.push(r.xp+' XP');if(r.res)Object.keys(r.res).forEach(function(k){a.push(r.res[k]+' '+resMeta(k).name);});if(r.item)a.push(r.item);return a.join(' · ');}
function toast(d){
  if(!d)return;var box=document.getElementById('toasts');if(!box)return;
  var el=h('div',{class:'toast',role:'status',style:d.color?{'border-left-color':d.color}:null},ic(d.icon||'notify',{size:22,color:d.color}),h('span',null,d.text||''));
  box.appendChild(el);while(box.children.length>3)box.removeChild(box.firstChild);
  setTimeout(function(){el.classList.add('out');setTimeout(function(){el.parentNode&&el.parentNode.removeChild(el);},380);},d.kind==='long'?5200:2800);
}
U.toast=toast;
function floatText(txt,x,y,color){var f=h('div',{class:'float',style:{left:x+'px',top:y+'px',color:color||''}},txt);document.body.appendChild(f);setTimeout(function(){f.remove();},1250);}
/* modal */
var modalOpen=null;
function modal(build,opts){
  opts=opts||{};if(modalOpen)closeModal();
  var close=function(){closeModal();opts.onClose&&opts.onClose();};
  var body=h('div',{class:'md',role:'dialog','aria-modal':'true'});
  var mb=h('div',{class:'mb',onclick:function(e){if(e.target===mb&&!opts.sticky)close();}},body);
  build(body,close);document.body.appendChild(mb);modalOpen={el:mb,close:close,sticky:opts.sticky};
  var f=body.querySelector('input,button');if(f&&!opts.nofocus)try{f.focus({preventScroll:true});}catch(e){}
  return close;
}
function closeModal(){if(modalOpen){modalOpen.el.remove();modalOpen=null;}}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modalOpen&&!modalOpen.sticky)modalOpen.close();});
/* iskelet: nav */
var NAV=[['hub','Merkez','egg'],['world','Gezegen','planet'],['galaxy','Galaksi','map'],['shop','Mağaza','coin'],['missions','Görevler','target']];
function claimable(){try{var m=g('missions');var a=Array.isArray(m)?m:(m&&m.list)||[];return a.filter(function(x){return x&&x.done&&!x.claimed;}).length;}catch(e){return 0;}}
function navbar(active){
  var n=h('nav',{class:'nav','aria-label':'Ana gezinme'});
  NAV.forEach(function(it){
    var b=h('button',{type:'button','aria-label':it[1],'aria-current':it[0]===active?'page':null,onclick:function(){snd('ui_tab');SG.go(it[0]);}},ic(it[2],{size:22}),it[1]);
    if(it[0]==='missions'){var c=claimable();if(c)b.appendChild(h('span',{class:'dot'},String(c)));}
    n.appendChild(b);});
  return n;
}
function need(){if(!user()){setTimeout(function(){SG.go('login');},0);return false;}return true;}
function page(root,name,o){
  o=o||{};var t=o.type!==undefined?o.type:curType();setTheme(t);
  var v=h('div',{class:'v'+(o.nonav?' nonav':'')});root.appendChild(v);
  if(!o.nonav)root.appendChild(navbar(name));return v;
}
function topbar(title,sub,right){
  var u=user()||{};
  var t=h('div',{class:'top'},h('h1',null,title,sub?h('small',null,sub):null),right||null,
    h('div',{class:'coin','data-coins':'1'},h('i'),SG.fmt.int(u.coins||0)));
  return t;
}
function rnd(a){return a[Math.floor(Math.random()*a.length)];}
function randName(){var a=['Ka','Ve','Lu','Zo','Ni','Ar','Te','Mi','Sa','Quo','Xe','Hy','Or','Ela','Ba'],b=['ra','lo','ni','xa','th','ri','um','ve','so','kis','ron'],c=['a','on','is','ar','ex','ea','or','yn',''];return rnd(a)+rnd(b)+rnd(c)+' '+rnd(['I','II','III','Prime','b','c','Nova']);}
var cleanups=[];
function onUnmount(f){cleanups.push(f);}
function runCleanups(){cleanups.splice(0).forEach(function(f){try{f();}catch(e){SG.log.err('cleanup',e);}});}
function busOn(ev,fn){onUnmount(SG.bus.on(ev,fn));}
function refreshCoins(){SG.$$('[data-coins]').forEach(function(el){var u=user();if(u){el.textContent='';el.appendChild(h('i'));el.appendChild(document.createTextNode(SG.fmt.int(u.coins||0)));}});}
/* ---------- LOGIN ---------- */
var LDEF={brand:'SpacEgg',slogan:'Kendi gezegenini yarat, büyüt, koru.',by:'Fambo',byLine:'Geliştiren: Fambo',
  story:[{id:'kurgu',h:'Kurgu',p:'Bir galaksi yumurtası al, çatlat; içinden doğan gezegenin seviye seviye büyüsün.'}],
  pledge:{h:'Gelirin %10’u görme engellilere',p:'Projenin gelirinin sürekli %10’u görme engelli bireylere bağışlanacak.',pct:10},
  vision:{h:'Uzay ve blok zinciri',p:'Uzay ile blok zinciri teknolojisini birleştiriyoruz. İleride belirli bir seviyeden sonra gezegenini soğuk cüzdan olarak kullanabileceksin.'},
  roadmapNote:'Bu özellik henüz çalışmıyor; yol haritasında.',
  buttons:{login:'Giriş yap',register:'Kayıt ol',home:'Ana Sayfa',play:'Oyuna Başla',more:'Daha fazla'},footer:'SpacEgg © Fambo'};
function LT(){
  var t=null;try{t=SG.TXT&&SG.TXT.login;}catch(e){}
  if(!t||typeof t!=='object')return LDEF;
  var o={};
  Object.keys(LDEF).forEach(function(k){
    var d=LDEF[k],v=t[k];
    if(Array.isArray(d))o[k]=(Array.isArray(v)&&v.length)?v:d;
    else if(d&&typeof d==='object'){var m={};Object.keys(d).forEach(function(j){m[j]=(v&&v[j]!=null)?v[j]:d[j];});o[k]=m;}
    else o[k]=v!=null?v:d;
  });
  return o;
}
function artCall(fn,a,b){try{var A=SG.Art;if(A&&typeof A[fn]==='function')return A[fn](a,b);}catch(e){SG.log.err('Art.'+fn,e);}return null;}
function paras(txt){return String(txt==null?'':txt).split(/\n\s*\n/).filter(Boolean).map(function(s){return h('p',null,s);});}
function firstBit(txt){var s=String(txt||'').replace(/\s+/g,' ').trim();var m=/^(.{40,150}?[.!?…])(\s|$)/.exec(s);return m?m[1]:(s.length>140?s.slice(0,137)+'…':s);}
/* ---- giriş modülü yardımcıları (v1.0.5) ---- */
function vico(d,sz){var s=h('span',{class:'ico','aria-hidden':'true'});s.innerHTML='<svg viewBox="0 0 24 24" width="'+(sz||20)+'" height="'+(sz||20)+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false">'+d+'</svg>';return s;}
var P_EYE='<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  P_EYEOFF='<path d="M3 3l18 18"/><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 7.6A16.6 16.6 0 0 0 2 12s3.6 6 10 6c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  P_EXIT='<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4"/><path d="M16 8l4 4-4 4"/><path d="M20 12H9"/>',
  P_LOCK='<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>';
function doLogout(){g('logout');SG.UI._offShown=false;snd('ui_back');}
function avatar(){
  var el=h('span',{class:'av','aria-hidden':'true'});
  el.innerHTML='<svg viewBox="0 0 64 80" width="56" height="70" focusable="false"><defs><radialGradient id="lgav-g" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="#fff4c4"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="#c2761a"/></radialGradient></defs>'
    +'<path class="av-sh" d="M32 3C19 3 8 27 8 46c0 17 11 31 24 31s24-14 24-31C56 27 45 3 32 3z"/>'
    +'<path class="av-fl" fill="url(#lgav-g)" d="M32 3C19 3 8 27 8 46c0 17 11 31 24 31s24-14 24-31C56 27 45 3 32 3z"/>'
    +'<path class="av-cr cr1" d="M27 13l5 8-6 6 5 8"/><path class="av-cr cr2" d="M42 32l-5 5 6 6-4 6"/>'
    +'<ellipse class="av-hi" cx="23" cy="25" rx="5" ry="10" transform="rotate(16 23 25)"/></svg>';
  return el;
}
function ffield(id,label,o){
  o=o||{};
  var inp=h('input',{class:'ff-in',id:id,type:o.type||'text',placeholder:' ',autocomplete:o.ac||'off',autocapitalize:'none',autocorrect:'off',spellcheck:'false','aria-describedby':id+'-m',maxlength:o.max||null,enterkeyhint:o.ek||null});
  var lab=h('label',{class:'ff-lab','for':id},label);
  var msg=h('div',{class:'ff-msg',id:id+'-m','aria-live':'polite'});
  var box=h('div',{class:'ff'},h('div',{class:'ff-w'},inp,lab,o.extra||null),msg);
  function state(k,t){box.classList.remove('bad','ok');if(k)box.classList.add(k);msg.className='ff-msg'+(k?' '+k:'');msg.textContent=t||'';inp.setAttribute('aria-invalid',k==='bad'?'true':'false');}
  return{box:box,inp:inp,msg:msg,state:state};
}
function pwScore(p,n){
  if(!p)return{lv:0,txt:''};
  if(p.length<4)return{lv:1,txt:'Çok kısa'};
  var weak=['1234','12345','123456','1111','0000','parola','password','sifre','şifre','qwerty','spacegg','demo'];
  if(weak.indexOf(p.toLowerCase())>=0||p.toLowerCase()===n)return{lv:1,txt:'Tahmin etmesi kolay'};
  var s=0;if(p.length>=6)s++;if(p.length>=8)s++;if(/[a-z]/.test(p)&&/[A-Z]/.test(p))s++;if(/\d/.test(p)&&/[a-zA-Z]/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;if(p.length>=12)s++;
  return s<=1?{lv:1,txt:'Zayıf'}:s===2?{lv:2,txt:'Orta'}:s<=4?{lv:3,txt:'İyi'}:{lv:4,txt:'Güçlü'};
}
SG.view('login',{
  mount:function(root){
    setTheme(null);
    var L=LT(),B=L.buttons;
    var v=h('div',{class:'v nonav lg'});root.appendChild(v);
    var line=h('div',{class:'type-line lg-line','aria-live':'polite'});
    var mode='in',busy=false,tch={n:false,p:false,q:false},initFocus=false;
    var av=avatar();
    var ttl=h('h2',{class:'lgm-t',id:'lgm-t'},'Hoş geldin, kaşif');
    var sub=h('p',{class:'lgm-s',id:'lgm-s'},'Gezegenine ulaşmak için giriş yap.');
    var segIn=h('button',{type:'button',role:'tab',id:'lgt-in','aria-selected':'true','aria-controls':'lgm-panel',tabindex:'0'},'Giriş'),
        segUp=h('button',{type:'button',role:'tab',id:'lgt-up','aria-selected':'false','aria-controls':'lgm-panel',tabindex:'-1'},B.register);
    var nameF=ffield('ln','Kullanıcı adı',{max:16,ek:'next'});
    var eye=h('button',{class:'ff-eye',type:'button','aria-label':'Parolayı göster','aria-pressed':'false'},vico(P_EYE));
    var passF=ffield('lp','Parola',{type:'password',ac:'new-password',ek:'go',extra:eye});
    var pass2F=ffield('lp2','Parolayı tekrar yaz',{type:'password',ac:'new-password',ek:'go'});
    var name=nameF.inp,pass=passF.inp,pass2=pass2F.inp;
    var capsMsg=h('div',{class:'ff-caps','aria-live':'polite'});
    var rNl=h('li',null,'3-16 karakter'),rNc=h('li',null,'a-z, 0-9 ve _');
    var rulesN=h('ul',{class:'rules','aria-label':'Kullanıcı adı kuralları',hidden:true},rNl,rNc);
    var pwTxt=h('div',{class:'pw-txt',role:'status'});
    var pwBar=h('div',{class:'pw',hidden:true},h('div',{class:'pw-bar','aria-hidden':'true'},h('i'),h('i'),h('i'),h('i')),pwTxt);
    pass2F.box.hidden=true;
    var err=h('div',{class:'err lgm-err',role:'alert'});
    var go=h('button',{class:'btn block lgm-go',type:'submit'},h('span',{class:'lgm-gt'},B.login));
    var demoB=h('button',{class:'btn ghost sm block',type:'button'},'demo ile dene');
    var form=h('form',{class:'lgm-form',novalidate:true,autocomplete:'off'},nameF.box,rulesN,passF.box,capsMsg,pwBar,pass2F.box,err,go);
    var panel=h('div',{id:'lgm-panel',role:'tabpanel','aria-labelledby':'lgt-in'},form);
    var card=h('div',{class:'card lgm'},
      h('div',{class:'lgm-hd'},av,h('div',null,ttl,sub)),
      h('div',{class:'seg',role:'tablist','aria-label':'Giriş veya kayıt'},segIn,segUp),
      panel,h('div',{class:'lgm-alt'},demoB),
      h('p',{class:'lgm-note'},vico(P_LOCK,14),' Güvenliğin için her açılışta giriş istenir.'));
    /* --- kahraman (hero) --- */
    var cv=h('canvas',{class:'lg-cv','aria-hidden':'true'});
    var cvBox=h('div',{class:'lg-cvbox','aria-hidden':'true'},cv);
    var logoBox=h('div',{class:'lg-logo','aria-hidden':'true'});
    var lsvg=artCall('logoSVG',92);
    if(typeof lsvg==='string'&&lsvg)logoBox.innerHTML=lsvg;else logoBox.appendChild(h('span',{class:'lg-egg'}));
    var title=h('h1',{class:'lg-title',tabindex:'-1','aria-label':L.brand});
    var wsvg=artCall('wordmarkSVG',46);
    if(typeof wsvg==='string'&&wsvg){var wb=h('span',{class:'lg-wm','aria-hidden':'true'});wb.innerHTML=wsvg;title.appendChild(wb);}
    else title.appendChild(h('span',{class:'brand','aria-hidden':'true'},'Spac',h('b',null,'Egg')));
    var homeBtn=h('button',{class:'lg-home',type:'button'},h('span',{class:'lg-hi','aria-hidden':'true'},'⌂'),B.home);
    var byChip=h('div',{class:'lg-by'},h('span',{class:'lg-by1'},'Geliştiren'),h('b',null,L.by));
    var ctaPlay=h('button',{class:'btn lg-cta',type:'button'},B.play);
    var ctaMore=h('button',{class:'btn ghost lg-cta',type:'button'},B.more,h('span',{'aria-hidden':'true'},' ↓'));
    var hd=h('div',{class:'lg-hd'},logoBox,title,h('p',{class:'lg-slogan'},L.slogan),line,byChip,h('div',{class:'lg-ctas'},ctaPlay,ctaMore));
    var shade=h('div',{class:'lg-shade','aria-hidden':'true'});
    var hero=h('section',{class:'lg-hero','aria-label':L.brand},cvBox,shade,homeBtn,hd);
    /* --- tanıtım kartları --- */
    var folds=[];
    function fold(id,ttl,nodes,o){
      o=o||{};var open=!!o.open;
      var more=h('span',{class:'lg-more'},open?'Daha az':B.more);
      var btn=h('button',{class:'lg-ch',type:'button','aria-expanded':String(open),'aria-controls':'lgb-'+id},
        h('span',{class:'lg-ct'},ttl,o.tag?h('span',{class:'lg-tag'},o.tag):null),
        o.preview?h('span',{class:'lg-pv'},o.preview):null,more);
      var body=h('div',{class:'lg-b',id:'lgb-'+id,role:'region','aria-label':ttl},h('div',{class:'lg-bi'},nodes));
      var el=h('article',{class:'lg-card'+(o.cls?' '+o.cls:'')+(open?' open':'')},btn,body);
      function set(x){open=!!x;el.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));more.textContent=open?'Daha az':B.more;}
      btn.onclick=function(){snd('ui_tap');set(!open);};
      var f={el:el,set:set};folds.push(f);return f;
    }
    var intro=h('section',{class:'lg-intro',id:'lg-intro','aria-label':'SpacEgg nedir'});
    intro.appendChild(h('h2',{class:'lg-h2'},'SpacEgg nedir?'));
    L.story.forEach(function(s,i){
      s=s||{};intro.appendChild(fold('s'+(s.id||i),s.h||'',paras(s.p),{open:i===0,preview:firstBit(s.p)}).el);});
    var P=L.pledge,pct=Number(P.pct)||10;
    intro.appendChild(h('article',{class:'lg-pledge'},
      h('div',{class:'lg-pct','aria-hidden':'true'},h('b',null,'%'+pct),h('small',null,'sürekli')),
      h('div',{class:'lg-pt'},h('h2',null,P.h),paras(P.p))));
    var V=L.vision;
    var vnodes=paras(V.p);
    if(L.roadmapNote)vnodes.push(h('p',{class:'lg-note'},h('span',{class:'lg-tag warn'},'Planlanıyor'),' ',L.roadmapNote));
    intro.appendChild(fold('vizyon',V.h,vnodes,{cls:'lg-vision',tag:'Planlanıyor',preview:firstBit(V.p)}).el);
    var foot=h('footer',{class:'lg-ft'},h('div',{class:'lg-ftby'},'Geliştiren ',h('b',null,L.by)),h('p',{class:'tiny mute'},L.footer),
      h('p',{class:'tiny mute'},'Hesap bu cihazda saklanır. Ödemeler test modundadır, gerçek para çekilmez.'));
    var formSec=h('section',{class:'lg-form',id:'lg-form','aria-label':'Giriş'},card);
    var homeRow=h('button',{class:'btn ghost block lg-home2',type:'button'},h('span',{'aria-hidden':'true'},'⌂ '),B.home);
    var col=h('div',{class:'lg-col'},hero,formSec,homeRow,intro,foot);
    v.appendChild(col);
    /* --- davranış --- */
    /* --- davranış: giriş modülü --- */
    var NAME_RE=/^[a-z0-9_]{3,16}$/;
    function setGlow(full){
      var n=name.value.trim().toLowerCase(),ok=NAME_RE.test(n),pl=pass.value.length;
      var gv=(n?0.15:0)+(ok?0.3:0)+(pl>=4?0.3:(pl?0.1:0));
      if(mode==='up'){if(pass2.value&&pass2.value===pass.value&&pl>=4)gv+=0.25;}else if(ok&&pl>=4)gv+=0.25;
      av.style.setProperty('--g',String(full?1:Math.min(1,gv)));
      av.classList.toggle('k1',ok);av.classList.toggle('k2',ok&&pl>=4);
    }
    function wob(){if(SG.RM)return;av.classList.remove('wob');void av.offsetWidth;av.classList.add('wob');}
    av.addEventListener('animationend',function(){av.classList.remove('wob');});
    function nameMsg(){
      var n=name.value.trim();
      if(!n)return tch.n?'Kullanıcı adını yaz.':'';
      if(/[^a-z0-9_]/.test(n))return 'Yalnızca a-z, 0-9 ve _ kullan. Türkçe harf ve boşluk olmaz.';
      if(n.length<3)return tch.n?'En az 3 karakter olmalı.':'';
      return '';
    }
    function refreshName(){
      var n=name.value.trim().toLowerCase(),m=nameMsg();
      if(mode==='up'){rNl.className=(n.length>=3&&n.length<=16)?'met':'';rNc.className=(n&&!/[^a-z0-9_]/.test(n))?'met':'';}
      if(m){nameF.state('bad',m);return false;}
      if(mode==='up'&&NAME_RE.test(n)){
        var taken=false;try{taken=!!g('hasAccount',n);}catch(e){}
        if(taken){nameF.state('bad','Bu kullanıcı adı alınmış. Başka bir ad dene.');return false;}
        nameF.state('ok','✓ Bu ad uygun.');return true;
      }
      nameF.state(null,'');return NAME_RE.test(n);
    }
    function refreshPass(){
      var p=pass.value;
      if(mode==='up'){
        pwBar.hidden=!p;
        var s=pwScore(p,name.value.trim().toLowerCase());
        pwBar.setAttribute('data-lv',String(s.lv));
        [].forEach.call(pwBar.firstChild.children,function(i,k){i.className=k<s.lv?'on':'';});
        pwTxt.textContent=p?'Parola gücü: '+s.txt:'';
        if(p&&p.length<4){passF.state(tch.p?'bad':null,tch.p?'En az 4 karakter olmalı.':'');return false;}
        passF.state(null,'');return p.length>=4;
      }
      passF.state(null,'');return !!p;
    }
    function refreshPass2(){
      if(mode!=='up')return true;
      var a=pass.value,b=pass2.value;
      if(!b){pass2F.state(tch.q?'bad':null,tch.q?'Parolayı tekrar yaz.':'');return false;}
      if(a!==b){pass2F.state('bad','Parolalar aynı değil.');return false;}
      pass2F.state('ok','✓ Parolalar eşleşiyor.');return true;
    }
    function setMode(m,quiet){
      mode=m;var up=m==='up';
      segIn.setAttribute('aria-selected',String(!up));segUp.setAttribute('aria-selected',String(up));
      segIn.tabIndex=up?-1:0;segUp.tabIndex=up?0:-1;
      panel.setAttribute('aria-labelledby',up?'lgt-up':'lgt-in');
      go.firstChild.textContent=up?'Hesap oluştur':B.login;
      ttl.textContent=up?'Yeni bir kaşif doğuyor':'Hoş geldin, kaşif';
      sub.textContent=up?'Bir ad seç, parolanı belirle. Hesabın bu cihazda saklanır.':'Gezegenine ulaşmak için giriş yap.';
      rulesN.hidden=!up;pass2F.box.hidden=!up;pwBar.hidden=!up||!pass.value;
      err.textContent='';pass2.value='';tch.p=false;tch.q=false;
      refreshName();refreshPass();refreshPass2();setGlow();
      if(!quiet)snd('ui_tab');
    }
    segIn.onclick=function(){setMode('in');};segUp.onclick=function(){setMode('up');};
    [segIn,segUp].forEach(function(b){b.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();var up=(b===segIn);setMode(up?'up':'in');(up?segUp:segIn).focus();}});});
    name.addEventListener('input',function(){
      var s=name.selectionStart,lo=name.value.toLowerCase();
      if(lo!==name.value){name.value=lo;try{name.setSelectionRange(s,s);}catch(e){}}
      err.textContent='';refreshName();refreshPass();setGlow();wob();
    });
    name.addEventListener('blur',function(){tch.n=true;refreshName();});
    pass.addEventListener('input',function(){err.textContent='';refreshPass();refreshPass2();setGlow();wob();});
    pass.addEventListener('blur',function(){tch.p=true;refreshPass();});
    pass2.addEventListener('input',function(){err.textContent='';refreshPass2();setGlow();wob();});
    pass2.addEventListener('blur',function(){tch.q=true;refreshPass2();});
    function capsCheck(e){var on=false;try{on=!!(e&&e.getModifierState&&e.getModifierState('CapsLock'));}catch(x){}capsMsg.textContent=on?'Caps Lock açık':'';}
    [pass,pass2].forEach(function(i){i.addEventListener('keydown',capsCheck);i.addEventListener('keyup',capsCheck);i.addEventListener('blur',function(){capsMsg.textContent='';});});
    eye.addEventListener('pointerdown',function(e){e.preventDefault();});
    eye.onclick=function(){
      var show=pass.type==='password';
      pass.type=show?'text':'password';pass2.type=show?'text':'password';
      eye.setAttribute('aria-pressed',String(show));eye.setAttribute('aria-label',show?'Parolayı gizle':'Parolayı göster');
      eye.textContent='';eye.appendChild(vico(show?P_EYEOFF:P_EYE));snd('ui_toggle');
    };
    function fail(m,fld){
      if(m)err.textContent=m;
      card.classList.remove('shake');void card.offsetWidth;card.classList.add('shake');
      snd('ui_err');vib(30);if(fld){try{fld.focus();}catch(e){}}
    }
    function unbusy(){
      busy=false;go.classList.remove('busy');go.removeAttribute('aria-busy');go.firstChild.textContent=mode==='up'?'Hesap oluştur':B.login;
      [name,pass,pass2].forEach(function(i){i.readOnly=false;});
    }
    function run(n,p){
      var r=mode==='in'?g('login',n,p):g('register',n,p);
      if(!r||!r.ok){
        unbusy();var m=(r&&r.err)||'İşlem tamamlanamadı. Bir kez daha dene.';
        if(r&&r.needRegister){
          err.textContent='';err.appendChild(document.createTextNode(m+' '));
          err.appendChild(h('button',{class:'lgm-lnk',type:'button',onclick:function(){setMode('up');name.value=n;refreshName();pass.focus();}},'Hesap oluştur'));
          return fail('',name);
        }
        if(/Parola yanl/.test(m)){passF.state('bad','Parola yanlış. Bir daha dene.');pass.value='';setGlow();return fail('',pass);}
        if(/zaten kay/.test(m)){nameF.state('bad',m);return fail('',name);}
        return fail(m,null);
      }
      snd('ui_ok');setGlow(true);av.classList.add('hatch');
      var done=function(){if(!v.isConnected)return;SG.UI._offShown=false;SG.go(SG.homeRoute?SG.homeRoute():'hub');};
      if(SG.RM)done();else setTimeout(done,560);
    }
    function submit(e){
      if(e&&e.preventDefault)e.preventDefault();
      if(busy)return;
      tch.n=tch.p=tch.q=true;err.textContent='';
      var n=name.value.trim().toLowerCase(),p=pass.value;
      if(!n){nameF.state('bad','Kullanıcı adını yaz.');return fail('Kullanıcı adı boş.',name);}
      if(!refreshName())return fail('',name);
      if(!p){passF.state('bad','Parolayı yaz.');return fail('Parola boş.',pass);}
      if(mode==='up'){
        if(!refreshPass())return fail('',pass);
        if(!pass2.value){pass2F.state('bad','Parolayı tekrar yaz.');return fail('',pass2);}
        if(!refreshPass2())return fail('',pass2);
      }
      busy=true;go.classList.add('busy');go.setAttribute('aria-busy','true');
      go.firstChild.textContent=mode==='up'?'Hesap oluşturuluyor…':'Giriş yapılıyor…';
      [name,pass,pass2].forEach(function(i){i.readOnly=true;});
      if(SG.RM)run(n,p);else setTimeout(function(){if(v.isConnected)run(n,p);},260);
    }
    form.addEventListener('submit',submit);
    demoB.onclick=function(){
      if(busy)return;
      if(mode!=='in')setMode('in',true);
      name.value='demo';pass.value='demo';refreshName();refreshPass();setGlow();snd('ui_tap');submit();
    };
    function reveal(el){setTimeout(function(){if(initFocus)return;try{el.scrollIntoView({block:'center',behavior:SG.RM?'auto':'smooth'});}catch(e){}},280);}
    form.addEventListener('focusin',function(e){if(e.target&&e.target.tagName==='INPUT')reveal(e.target);});
    var vvh=null;
    if(window.visualViewport){vvh=function(){var a=document.activeElement;if(a&&a.tagName==='INPUT'&&form.contains(a))reveal(a);};window.visualViewport.addEventListener('resize',vvh);}
    onUnmount(function(){if(vvh&&window.visualViewport)window.visualViewport.removeEventListener('resize',vvh);});
    setGlow();
    requestAnimationFrame(function(){
      try{if(window.matchMedia&&matchMedia('(pointer:fine)').matches&&v.isConnected){initFocus=true;name.focus({preventScroll:true});setTimeout(function(){initFocus=false;},500);}}catch(e){}
    });
    function scrollToEl(el,focus){
      try{el.scrollIntoView({behavior:SG.RM?'auto':'smooth',block:'start'});}catch(e){v.scrollTop=el.offsetTop;}
      if(focus)setTimeout(function(){try{focus.focus({preventScroll:true});}catch(e){}},SG.RM?0:450);
    }
    function goHome(){
      snd('ui_menu');
      if(user()){SG.go(SG.homeRoute?SG.homeRoute():'hub');return;}
      folds.forEach(function(f){f.set(true);});
      try{v.scrollTo({top:0,behavior:SG.RM?'auto':'smooth'});}catch(e){v.scrollTop=0;}
      setTimeout(function(){try{title.focus({preventScroll:true});}catch(e){}},SG.RM?0:450);
    }
    homeBtn.onclick=goHome;homeRow.onclick=goHome;
    ctaPlay.onclick=function(){snd('ui_tap');scrollToEl(formSec,name);};
    ctaMore.onclick=function(){snd('ui_tap');scrollToEl(intro);};
    /* hero tuvali */
    var ctl=null,visible=true,sized=false;
    var qv=SG.store.get('quality','auto');
    var qn=(typeof qv==='number')?qv:({low:0,mid:1,high:3,ultra:3}[qv]!=null?{low:0,mid:1,high:3,ultra:3}[qv]:2);
    var staticOnly=!!SG.RM||qn<=0;
    function size(){
      var w=cvBox.clientWidth||hero.clientWidth||360,hh=cvBox.clientHeight||hero.clientHeight||640;
      var dpr=Math.min(window.devicePixelRatio||1,qn>=2?1.75:1.25);
      var pw=Math.max(2,Math.round(w*dpr)),ph=Math.max(2,Math.round(hh*dpr));
      if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}
      return[w,hh,dpr];
    }
    function paintStatic(){var s=size();artCall('heroStatic',cv);return s;}
    requestAnimationFrame(function(){
      if(!v.isConnected)return;
      var s=size();sized=true;
      if(staticOnly){artCall('heroStatic',cv);}
      else{ctl=artCall('hero',cv,{q:qn});if(!ctl||typeof ctl.start!=='function'){ctl=null;artCall('heroStatic',cv);}else{try{ctl.resize&&ctl.resize(s[0],s[1],s[2]);if(visible&&!document.hidden)ctl.start();}catch(e){SG.log.err('hero',e);ctl=null;}}}
    });
    function runHero(on){if(!ctl)return;try{on?ctl.start():ctl.stop();}catch(e){}}
    var io=null;
    if('IntersectionObserver' in window){
      io=new IntersectionObserver(function(es){var e=es[es.length-1];visible=!!(e&&e.isIntersecting);runHero(visible&&!document.hidden);},{root:null,threshold:0.02});
      io.observe(hero);
    }
    function onVis(){runHero(visible&&!document.hidden);}
    function onPause(){runHero(false);}
    function onResume(){runHero(visible&&!document.hidden);}
    function onResize(){if(!sized)return;var s=size();if(ctl){try{ctl.resize&&ctl.resize(s[0],s[1],s[2]);}catch(e){}}else artCall('heroStatic',cv);}
    document.addEventListener('visibilitychange',onVis);
    window.addEventListener('sg-pause',onPause);window.addEventListener('sg-resume',onResume);
    window.addEventListener('resize',onResize);
    /* kaydırma: hafif paralaks ve solma */
    var raf=0;
    function onScroll(){
      if(SG.RM||raf)return;
      raf=requestAnimationFrame(function(){
        raf=0;var y=v.scrollTop,hh=hero.offsetHeight||600;
        cvBox.style.transform='translate3d(0,'+Math.round(Math.min(y,hh)*0.28)+'px,0)';
        hd.style.opacity=String(Math.max(0,Math.min(1,1.15-y/(hh*0.62))));
      });
    }
    v.addEventListener('scroll',onScroll,{passive:true});
    /* daktilo satırı */
    var msg='Sınırlı sayıda gezegen var.',i=0,timer;
    if(SG.RM){line.textContent=msg;}else{line.appendChild(h('span',{class:'caret'}));
      timer=setInterval(function(){i++;line.textContent=msg.slice(0,i);var c=h('span',{class:'caret'});line.appendChild(c);if(i>=msg.length)clearInterval(timer);},70);}
    onUnmount(function(){
      clearInterval(timer);if(raf)cancelAnimationFrame(raf);
      v.removeEventListener('scroll',onScroll);
      document.removeEventListener('visibilitychange',onVis);
      window.removeEventListener('sg-pause',onPause);window.removeEventListener('sg-resume',onResume);
      window.removeEventListener('resize',onResize);
      if(io){io.disconnect();io=null;}
      if(ctl){try{ctl.stop();}catch(e){}ctl=null;}
    });
  },
  unmount:runCleanups
});
/* ---------- HUB ---------- */
SG.view('hub',{
  mount:function(root){
    if(!need())return;
    var u=user();var v=page(root,'hub',{type:curType()});
    var plv=u.plvl||1,xp=u.xp||0;
    var need_=Math.round(40*Math.pow(1.22,plv-1));
    v.appendChild(h('div',{class:'wrap'},
      topbar('Merhaba, '+(u.name||'kaşif'),'Oyuncu seviyesi '+plv,h('div',{class:'top-act'},h('button',{class:'exit-btn',type:'button','aria-label':'Çıkış yap',onclick:doLogout},vico(P_EXIT,18),h('span',null,'Çıkış')),h('button',{class:'icon-btn','aria-label':'Ayarlar',onclick:function(){snd('ui_menu');SG.go('settings');}},ic('settings',{size:22})))),
      h('div',{class:'card flat'},h('div',{class:'row'},h('b',null,'Seviye '+plv),h('span',{class:'mute small grow',style:{textAlign:'right'}},SG.fmt.int(xp)+' XP')),h('div',{class:'bar',style:{marginTop:'8px'}},h('i',{style:{width:Math.min(100,xp%need_/need_*100||0)+'%'}}))),
      h('div',{class:'grid2'},
        h('button',{class:'btn',onclick:function(){snd('ui_menu');SG.go('egg');}},ic('egg',{size:20}),'Yumurta mağazası'),
        h('button',{class:'btn ghost',onclick:function(){snd('ui_menu');SG.go('story');}},ic('story',{size:20}),'Hikâye'))));
    var wrap=v.firstChild;
    var ps=[];try{ps=g('planets')||[];if(!Array.isArray(ps))ps=[];}catch(e){}
    wrap.appendChild(h('h2',null,'Gezegenlerin'));
    var act=planet();
    if(!ps.length)wrap.appendChild(h('div',{class:'card flat'},h('p',null,'Henüz gezegenin yok.'),h('p',{class:'mute small'},'Bir yumurta seç, çatlat ve gezegenini büyütmeye başla.'),h('button',{class:'btn',onclick:function(){SG.go('egg');}},'Yumurta seç')));
    ps.forEach(function(p){
      var t=T(p.type);var isAct=act&&act.id===p.id;
      wrap.appendChild(h('button',{class:'card item btn-card',style:{display:'flex',width:'100%',textAlign:'left','--tc':t.color,borderLeftColor:t.color},onclick:function(){g('setActive',p.id);snd('ui_ok');SG.go('world');}},
        h('div',{class:'pic',style:{color:t.color}},ic(t.icon||'planet',{size:26})),
        h('div',{class:'grow'},h('b',null,p.name),h('div',{class:'small mute'},t.name+' · Seviye '+(p.lvl||1)+' · '+(p.coord||''))),
        isAct?h('span',{class:'chip tc'},'Aktif'):h('span',{class:'chip'},p.hatched===false?'Çatlıyor':'Aç')));
    });
    var owned=(u.eggsOwned||[]).filter(function(id){return !ps.some(function(p){return p.egg===id;});});
    if(owned.length){wrap.appendChild(h('h2',null,'Çatlamayı bekleyen yumurtalar'));
      owned.forEach(function(id){var e=eggById(id)||{name:id,type:'sav'};var t=T(e.type);
        wrap.appendChild(h('div',{class:'card item',style:{borderLeftColor:t.color}},h('div',{class:'pic',style:{color:t.color}},ic('egg',{size:24})),h('div',{class:'grow'},h('b',null,e.name),h('div',{class:'small mute'},t.name)),h('button',{class:'btn sm',onclick:function(){SG.go('egg',{hatch:id});}},'Çatlat')));});}
    if(!SG.UI._offShown){SG.UI._offShown=true;var rep=null;try{rep=G().offlineReport&&G().offlineReport();}catch(e){}if(rep)setTimeout(function(){offlineModal(rep);},350);}
  },
  unmount:runCleanups
});
function offlineModal(r){
  modal(function(b,close){
    b.appendChild(h('h2',null,'Sen yokken'));
    var lines=[];
    if(typeof r==='string')lines=[r];
    else if(Array.isArray(r))lines=r.map(String);
    else{var secs=r.secs||r.sec||r.away||r.dur;if(secs)lines.push('Yaklaşık '+SG.fmt.dur(secs)+' uzakta kaldın.');
      (r.planets||[]).forEach(function(pl){
        var l=pl.name+': seviye '+pl.lvlFrom+(pl.lvlTo>pl.lvlFrom?' → '+pl.lvlTo:' (değişmedi)');if(pl.hatched)l+=' · yumurtan çatladı';lines.push(l);
        var g=pl.res||{};var parts=Object.keys(g).slice(0,4).map(function(k){return '+'+SG.fmt.num(g[k])+' '+resMeta(k).name;});if(parts.length)lines.push(parts.join(' · '));});
      if(typeof r.events==='number'&&r.events)lines.push(SG.fmt.int(r.events)+' olay yaşandı (kararsız olanlar senin adına verildi).');
      else if(Array.isArray(r.events))r.events.forEach(function(x){lines.push(typeof x==='string'?x:(x.text||x.name||''));});
      if(r.coins)lines.push('+'+SG.fmt.int(r.coins)+' coin');if(r.xp)lines.push('+'+SG.fmt.int(r.xp)+' XP');if(r.text)lines.push(r.text);}
    if(!lines.length)lines=['Gezegenin sen yokken ilerlemeye devam etti.'];
    b.appendChild(h('ul',{class:'loop'},lines.map(function(l){return h('li',null,l);})));
    b.appendChild(h('button',{class:'btn block',style:{marginTop:'14px'},onclick:function(){snd('ui_ok');close();}},'Devam et'));
  });
}
/* ---------- YUMURTA MAĞAZASI ---------- */
var eggTab=null;
SG.view('egg',{
  mount:function(root,params){
    if(!need())return;
    var u=user();eggTab=eggTab||curType()||'sav';
    setTheme(eggTab);
    var v=page(root,'hub',{type:eggTab});var wrap=h('div',{class:'wrap'});v.appendChild(wrap);
    wrap.appendChild(topbar('Yumurtalar','Tipini seç, yolunu belirle',h('button',{class:'icon-btn','aria-label':'Geri',onclick:function(){SG.go('hub');}},ic('back',{size:22}))));
    var tabs=h('div',{class:'tabs',role:'tablist'});var body=h('div');wrap.appendChild(tabs);wrap.appendChild(body);
    var live=[];
    function clearLive(){live.splice(0).forEach(function(c){try{c.destroy&&c.destroy();}catch(e){}});}
    onUnmount(clearLive);
    function owned(id){return(user().eggsOwned||[]).indexOf(id)>=0;}
    function draw(){
      clearLive();tabs.textContent='';body.textContent='';setTheme(eggTab);
      TYPE_ORDER.forEach(function(id){var t=T(id);tabs.appendChild(h('button',{class:'tab',type:'button',role:'tab','aria-selected':String(id===eggTab),style:{'--tc':t.color},onclick:function(){eggTab=id;snd('ui_tab');draw();}},ic(t.icon,{size:20}),t.name));});
      var t=T(eggTab);
      body.appendChild(h('div',{class:'card typehead'},h('h2',{style:{color:t.color}},t.name),h('p',{class:'small'},t.desc||''),t.goal?h('p',{class:'small mute'},'Hedef: '+t.goal):null,t.loop&&t.loop.length?h('ul',{class:'loop'},t.loop.map(function(x){return h('li',null,x);})):null));
      var gal=h('div',{class:'gallery'});body.appendChild(gal);
      var list=eggs().filter(function(e){return e.type===eggTab;});
      if(!list.length)gal.appendChild(h('div',{class:'card flat'},'Bu tipin yumurtaları yükleniyor.'));
      list.forEach(function(e){
        var art=h('div',{class:'art'});
        try{if(SG.E&&SG.E.canvas){var c=SG.E.canvas(e,110);art.appendChild(c);live.push(c);}else art.appendChild(ic('egg',{size:60,color:t.color}));}catch(x){art.appendChild(ic('egg',{size:60,color:t.color}));}
        var has=owned(e.id);var btn=h('button',{class:'btn block',type:'button'});
        btn.appendChild(has?document.createTextNode('Çatlat'):h('span',{class:'row',style:{gap:'8px'}},document.createTextNode('Satın al'),coinEl(e.price)));
        btn.onclick=function(){
          if(has){hatchFlow(e);return;}
          var r=g('buyEgg',e.id);
          if(!r||!r.ok){toast({text:(r&&r.err)||'Satın alınamadı.',icon:'lock',color:'#FF5A4D'});snd('ui_err');return;}
          snd('coin_big');vib(14);var rc=btn.getBoundingClientRect();floatText('-'+e.price,rc.left+rc.width/2,rc.top,'#ffd76a');refreshCoins();toast({text:e.name+' yumurtası senin.',icon:'egg',color:t.color});draw();
        };
        gal.appendChild(h('article',{class:'egg'},art,h('h3',null,e.name),
          h('div',{class:'meta'},h('span',{class:'chip '+(e.rarity||'')},{yaygin:'Yaygın',nadir:'Nadir',efsane:'Efsane'}[e.rarity]||'Yaygın'),e.strategy?h('span',{class:'chip tc'},e.strategy):null,e.hatchSec?h('span',{class:'chip'},SG.fmt.dur(e.hatchSec)):null),
          h('div',{class:'d'},e.desc||''),btn));
      });
    }
    draw();
    if(params&&params.hatch){var e0=eggById(params.hatch);if(e0){eggTab=e0.type;draw();setTimeout(function(){hatchFlow(e0);},200);}}
    busOn('coins',refreshCoins);
  },
  unmount:runCleanups
});
function hatchFlow(e){
  var t=T(e.type);
  modal(function(b,close){
    var inp=h('input',{class:'inp',maxlength:'22',value:randName(),'aria-label':'Gezegen adı'});
    b.appendChild(h('h2',null,'Gezegenine ad ver'));b.appendChild(h('p',{class:'mute small'},e.name+' yumurtası çatlayınca bu isimle doğacak.'));
    b.appendChild(h('div',{class:'row'},inp,h('button',{class:'icon-btn','aria-label':'Rastgele ad',onclick:function(){inp.value=randName();snd('ui_tap');}},ic('creation',{size:22}))));
    b.appendChild(h('div',{class:'err',id:'hf-err'}));
    b.appendChild(h('button',{class:'btn block',onclick:function(){
      var nm=inp.value.trim();if(nm.length<2){SG.$('#hf-err',b).textContent='Ad en az 2 karakter olmalı.';snd('ui_err');return;}
      var r=g('hatch',e.id,nm);if(!r||!r.ok){SG.$('#hf-err',b).textContent=(r&&r.err)||'Çatlatılamadı.';snd('ui_err');return;}
      close();crackScene(e,function(){SG.go('world');});}},'Çatlat'));
  });
}
function crackScene(e,done){
  var cv=h('canvas',{width:260,height:260,style:{width:'260px',height:'260px',maxWidth:'80vw'}});
  var ov=h('div',{class:'mb',style:{alignItems:'center'}},h('div',{style:{textAlign:'center'}},cv,h('p',{style:{marginTop:'10px',fontWeight:'700'}},'Yumurta çatlıyor…')));
  document.body.appendChild(ov);snd('egg_crack');
  var ctx=cv.getContext('2d'),t0=performance.now(),dur=SG.RM?600:3400,fin=false,played=false;
  (function f(now){
    var t=(now-t0)/1000,p=Math.min(1,(now-t0)/dur);ctx.clearRect(0,0,260,260);
    try{if(SG.E&&SG.E.crack)SG.E.crack(ctx,e,p,t,260);else if(SG.E&&SG.E.draw)SG.E.draw(ctx,e,t,260);}catch(x){}
    if(p>.7&&!played){played=true;snd('egg_hatch');vib(40);}
    if(p<1)requestAnimationFrame(f);else if(!fin){fin=true;setTimeout(function(){ov.remove();done();},350);}
  })(t0);
}
/* ---------- DÜNYA ---------- */
var ACT_CD={};
SG.view('world',{
  mount:function(root){
    if(!need())return;
    var p=planet();
    if(!p){setTheme(null);var v0=page(root,'world',{type:null});v0.appendChild(h('div',{class:'wrap'},topbar('Gezegen'),h('div',{class:'card flat'},h('p',null,'Henüz bir gezegenin yok.'),h('p',{class:'mute small'},'Önce bir yumurta seç ve çatlat.'),h('button',{class:'btn',onclick:function(){SG.go('egg');}},'Yumurta seç'))));return;}
    var t=T(p.type);setTheme(p.type);
    var wd=h('div',{class:'world'});root.appendChild(wd);
    var cv=h('canvas',{class:'pl','aria-label':'Gezegen görünümü, dokunarak etkileşim'});wd.appendChild(cv);
    var view=null;
    try{if(SG.W&&SG.W.planet){view=SG.W.planet(cv,{});view.setPlanet(p);view.onTap&&view.onTap(function(x,y){var r=g('tap',x,y);snd('planet_touch');vib(6);view.pulse&&view.pulse(x,y);});view.start&&view.start();}}catch(e){SG.log.err('world.planet',e);}
    onUnmount(function(){try{view&&view.destroy&&view.destroy();}catch(e){}});
    /* üst HUD */
    var tickIn=h('div'),tick=h('div',{class:'tick','aria-hidden':'true'},tickIn);
    var nameEl=h('h1',null,p.name),lvEl=h('b',null),xpBar=h('i');
    var resEl=h('div',{class:'res'});
    var top=h('div',{class:'hud t'},tick,h('div',{class:'pname'},h('span',{class:'ic',style:{color:t.color}},ic(t.icon,{size:26})),nameEl,h('div',{class:'lvbox'},lvEl,h('div',{class:'bar',style:{marginTop:'4px'}},xpBar))),resEl);
    wd.appendChild(top);
    /* yan düğmeler */
    var speedVal=SG.speed||1;var sp=h('div',{class:'speed',role:'group','aria-label':'Zaman hızı'});
    [1,5,20,60].forEach(function(s){sp.appendChild(h('button',{type:'button','aria-pressed':String(s===speedVal),onclick:function(){SG.speed=s;SG.store.set('speed',s);SG.$$('button',sp).forEach(function(b){b.setAttribute('aria-pressed',String(b.textContent==='×'+s));});snd('ui_toggle');}},'×'+s));});
    var side=h('div',{class:'sidebtns'},
      h('button',{class:'icon-btn','aria-label':'Uydular',onclick:function(){snd('ui_menu');satModal();}},ic('satellite',{size:22})),
      h('button',{class:'icon-btn','aria-label':'Günlük',onclick:function(){snd('ui_menu');logModal();}},ic('story',{size:20})));
    wd.appendChild(side);
    /* alt HUD */
    var evBox=h('div'),dock=h('div',{class:'dock'});
    var bot=h('div',{class:'hud b'},evBox,sp,dock);wd.appendChild(bot);wd.appendChild(navbar('world'));
    var acts=(t.actions||[]);var actEls={};
    acts.forEach(function(a){
      var ring=h('div',{class:'ring'},ic(a.icon||'bolt',{size:22}));
      var cost=h('span',{class:'cost'},costText(a.cost));
      var b=h('button',{class:'act',type:'button','aria-label':a.name,title:a.desc||'',onclick:function(){
        var r=g('act',a.id);
        if(!r||!r.ok){toast({text:(r&&r.err)||'Şu an yapılamaz.',icon:'lock',color:'#FF5A4D'});snd('ui_err');b.classList.add('shake');setTimeout(function(){b.classList.remove('shake');},400);return;}
        snd('ui_ok');vib(10);}},ring,h('span',null,a.name),cost);
      dock.appendChild(b);actEls[a.id]={b:b,ring:ring,cost:cost,a:a};});
    if(!acts.length)dock.appendChild(h('div',{class:'evtoast'},'Bu tipin eylemleri yükleniyor.'));
    /* çatlama bekleme */
    var wait=null,eggc=null,waitTxt=null;
    function eggWait(){
      var e=eggById(p.egg);wait=h('div',{class:'eggwait'});waitTxt=h('p',{style:{fontWeight:'700',marginTop:'8px',textShadow:'0 2px 10px #000'}});
      var inner=h('div',null);try{if(SG.E&&SG.E.canvas&&e){eggc=SG.E.canvas(e,180);inner.appendChild(eggc);}}catch(x){}inner.appendChild(waitTxt);wait.appendChild(inner);wd.insertBefore(wait,top);
    }
    if(p.hatched===false)eggWait();
    onUnmount(function(){try{eggc&&eggc.destroy&&eggc.destroy();}catch(e){}});
    function update(){
      var pp=planet();if(!pp)return;
      if(pp.id!==p.id){SG.go('world');return;}
      p=pp;
      if(wait){if(p.hatched!==false){SG.go('world');return;}
        var e=eggById(p.egg)||{},end=(p.hatchAt)||(p.born+(e.hatchSec||30)*1000);waitTxt.textContent='Çatlamaya '+SG.fmt.dur((end-Date.now())/1000);}
      lvEl.textContent='Seviye '+(p.lvl||1);
      var lv=(t.levels||[])[ (p.lvl||1)-1],nx=(t.levels||[])[p.lvl||1];
      var need=nx&&nx.xp?nx.xp:(lv&&lv.xp)||100,prev=lv&&lv.xp&&(p.lvl>1)?(t.levels[p.lvl-2]||{}).xp||0:0;
      xpBar.style.width=Math.max(2,Math.min(100,((p.xp||0)-prev)/Math.max(1,need-prev)*100||0))+'%';
      /* kaynaklar */
      var rs=t.res||[];
      if(resEl.children.length!==rs.length+0){resEl.textContent='';rs.forEach(function(r){resEl.appendChild(h('div',{class:'rs','data-r':r.id},ic(r.icon,{size:18,color:r.color}),h('span',{class:'rv'})));});}
      rs.forEach(function(r){var el=resEl.querySelector('[data-r="'+r.id+'"] .rv');if(el){var val=SG.fmt.num((p.res||{})[r.id]||0);if(el.textContent!==val){if(el.textContent)el.parentNode.classList.add('up');setTimeout(function(){el.parentNode&&el.parentNode.classList.remove('up');},700);el.textContent=val;}}});
      /* eylemler */
      acts.forEach(function(a){var o=actEls[a.id];var left=cdLeft(p,a);var can=hasRes(p,a.cost);
        o.ring.style.setProperty('--p',left>0&&a.cd?Math.max(0,1-left/a.cd):1);o.b.classList.toggle('cd',left>0);o.b.classList.toggle('bad',!can);
        o.cost.textContent=left>0?Math.ceil(left)+' sn':costText(a.cost);});
      /* şerit */
      var evs=[];try{evs=g('events')||[];if(!Array.isArray(evs))evs=[];}catch(e){}
      var last=evs[0]||evs[evs.length-1];
      var items=[p.name,t.name+' gezegeni',(p.coord||''),'Seviye '+(p.lvl||1)+(lv?' · '+lv.name:'')];
      if(last)items.push(last.text||last.name||'');
      var key=items.join('|');if(tickIn.getAttribute('data-k')!==key){tickIn.setAttribute('data-k',key);tickIn.textContent='';for(var k=0;k<2;k++)items.forEach(function(s){if(s)tickIn.appendChild(h('span',null,s));});}
      /* bekleyen olay */
      if(!modalOpen){var pend=null;try{pend=G().pending&&G().pending();}catch(e){}if(Array.isArray(pend))pend=pend[0];if(pend)eventModal(pend);}
      /* günlük olay kartları */
      var show=evs.slice(0,2);var ek=show.map(function(x){return x.id||x.text;}).join('|');
      if(evBox.getAttribute('data-k')!==ek){evBox.setAttribute('data-k',ek);evBox.textContent='';show.forEach(function(x){evBox.appendChild(h('div',{class:'evtoast'},ic(x.icon||'notify',{size:20,color:t.color}),h('span',null,x.text||x.name||'')));});}
    }
    update();var acc=0;SG.loop.add('ui-world',function(dt){acc+=dt;if(acc>=.25){acc=0;update();}});onUnmount(function(){SG.loop.remove('ui-world');});
    busOn('fx',function(d){try{view&&view.fx&&d&&view.fx(d.name,d.params||d);}catch(e){SG.log.err('fx',e);}});
    busOn('lvl',function(){setTimeout(function(){try{view&&view.setPlanet(planet());}catch(e){}},50);});
    busOn('coins',refreshCoins);
  },
  unmount:function(){runCleanups();modalOpen&&closeModal();}
});
function costText(c){if(!c)return'Bedava';return Object.keys(c).map(function(k){return SG.fmt.num(c[k])+(k==='coin'?' ¢':' '+(resMeta(k).name||k).slice(0,6));}).join(' ');}
function hasRes(p,c){if(!c)return true;var u=user()||{};return Object.keys(c).every(function(k){return k==='coin'?(u.coins||0)>=c[k]:((p.res||{})[k]||0)>=c[k];});}
function cdLeft(p,a){var v=p.cd&&p.cd[a.id];if(!v)return 0;if(v>1e12)return Math.max(0,(v-Date.now())/1000);return Math.max(0,v);}
function eventModal(ev){
  modal(function(b,close){
    var t=T(curType());
    b.appendChild(h('div',{class:'row'},ic(ev.icon||'notify',{size:30,color:t.color}),h('h2',{style:{margin:0}},ev.name||'Olay')));
    b.appendChild(h('p',{style:{marginTop:'10px'}},ev.text||''));
    var ch=ev.choices||[];
    if(!ch.length)b.appendChild(h('button',{class:'btn block',onclick:function(){g('decide',ev.id,0);close();}},'Tamam'));
    ch.forEach(function(c,i){b.appendChild(h('button',{class:'choice',onclick:function(){
      var r=g('decide',ev.id,i);close();snd(r&&r.ok?'choice_good':'choice_bad');
      var tx=(r&&r.text)||(c.outcome&&c.outcome.text)||(r&&r.err);if(tx)toast({text:tx,icon:ev.icon,color:t.color,kind:'long'});}},c.label,c.cost?h('small',null,'Bedel: '+costText(c.cost)):null));});
  },{sticky:true});
  snd('notify');
}
function satModal(){
  var p=planet();if(!p)return;
  modal(function(b,close){
    b.appendChild(h('h2',null,'Uydular'));
    var sats=p.sats||[];
    if(!sats.length)b.appendChild(h('p',{class:'mute'},'Bu gezegenin uydusu yok. Mağazadan uydu gönderebilirsin.'));
    sats.forEach(function(s){b.appendChild(h('div',{class:'card item flat'},h('div',{class:'pic'},ic('satellite',{size:24})),h('div',{class:'grow'},h('b',null,s.name||'Uydu'),h('div',{class:'bar',style:{marginTop:'6px'}},h('i',{style:{width:Math.max(3,Math.min(100,s.hp==null?100:s.hp))+'%'}}))),h('button',{class:'btn sm',onclick:function(){var r=g('mine',s.id);snd(r&&r.ok?'mine':'ui_err');toast({text:(r&&(r.text||r.err))||(r&&r.ok?'Uydu çalışıyor.':'Yapılamadı.'),icon:'mine'});}},'Madenle')));});
    b.appendChild(h('button',{class:'btn ghost block',style:{marginTop:'8px'},onclick:close},'Kapat'));
  });
}
function logModal(){
  var p=planet();if(!p)return;
  modal(function(b,close){
    b.appendChild(h('h2',null,'Gezegen günlüğü'));
    var l=(p.log||[]).slice(-14).reverse();
    if(!l.length)b.appendChild(h('p',{class:'mute'},'Henüz kayıt yok.'));
    l.forEach(function(x){b.appendChild(h('p',{class:'small'},typeof x==='string'?x:(x.text||x.name||'')));});
    b.appendChild(h('button',{class:'btn ghost block',style:{marginTop:'8px'},onclick:close},'Kapat'));
  });
}
/* ---------- galaksi gezegen kartı: renk yardımcıları (.pc-*) ---------- */
var PC_TX={sav:'#FF6F61',med:'#46E39B',loj:'#FFC83D',yik:'#C58BFF',yar:'#4DD6FF'};
var PC_REL={dost:['#5CEBA6','Dost'],dusman:['#FF7A6E','Düşman'],tarafsiz:['#B4BCDD','Tarafsız']};
function pcHex(c,a){var m=/^#?([0-9a-f]{6})$/i.exec(c||'');if(!m)return c;var v=parseInt(m[1],16);return 'rgba('+(v>>16&255)+','+(v>>8&255)+','+(v&255)+','+a+')';}
function pcHeat(l){l=+l||1;return l<=10?['#7FC8FF','Yeni']:l<=20?['#46E39B','Gelişen']:l<=30?['#FFC83D','Olgun']:l<=40?['#FF9A3D','Güçlü']:['#FF6A5C','Efsane'];}
function pcCell(label,val,color,cls,wide){return h('div',{class:'pc-cell'+(wide?' wide':'')},h('div',{class:'pc-lab'},label),h('div',{class:'pc-val'+(cls?' '+cls:''),style:color?{color:color}:{}},val));}
/* ---------- GALAKSİ ---------- */
SG.view('galaxy',{
  mount:function(root){
    if(!need())return;var p=planet();var t=T(p&&p.type);setTheme(p&&p.type);
    var wd=h('div',{class:'gal'});root.appendChild(wd);
    var cv=h('canvas',{'aria-label':'Galaksi haritası'});wd.appendChild(cv);
    var nodes=[];try{nodes=g('galaxy')||[];if(!Array.isArray(nodes))nodes=[];}catch(e){}
    var view=null;
    try{if(SG.W&&SG.W.galaxy){view=SG.W.galaxy(cv,{seed:SG.hash(String(p&&p.gal!=null?p.gal:(p&&p.id)||'g'))});view.onSelect&&view.onSelect(select);view.resize&&view.resize();view.setNodes&&view.setNodes(nodes);view.start&&view.start();window.addEventListener('resize',onGalResize);}}catch(e){SG.log.err('galaxy',e);}
    function onGalResize(){try{view&&view.resize&&view.resize();}catch(e){}}
    onUnmount(function(){window.removeEventListener('resize',onGalResize);try{view&&view.destroy&&view.destroy();}catch(e){}});
    wd.appendChild(h('div',{class:'hud t'},topbar('Galaksi',nodes.length+' gezegen menzilde')));
    var panel=h('div',{class:'tpanel',hidden:true});wd.appendChild(panel);wd.appendChild(navbar('galaxy'));
    if(!nodes.length||!view){var fl=h('div',{style:{position:'absolute',left:'12px',right:'12px',top:'110px'},class:'wrap'});nodes.forEach(function(n){fl.appendChild(h('button',{class:'card item',style:{width:'100%',textAlign:'left'},onclick:function(){select(n);}},h('div',{class:'grow'},h('b',null,n.name),h('div',{class:'small mute'},T(n.type).name+' · Seviye '+n.lvl+' · '+n.coord)),h('span',{class:'chip'},n.relation||'tarafsız')));});if(!view)wd.appendChild(fl);}
    function select(n){
      if(!n){panel.hidden=true;return;}
      var nt=T(n.type);snd('ui_menu');panel.hidden=false;panel.textContent='';
      var f=nodes.filter(function(x){return x.id===n.id;})[0]||n;
      var tx=PC_TX[n.type]||nt.color,hv=pcHeat(n.lvl),rl=PC_REL[n.relation]||PC_REL.tarafsiz;
      var nf=function(v){return SG.fmt&&SG.fmt.num?SG.fmt.num(v):String(v);};
      var cells=[pcCell('Koordinat',n.coord||'—','#6FE3FF','pc-coord',true),
        pcCell('Uzaklık',n.dist!=null?nf(n.dist)+' ışık yılı':'—','#C9B6FF')];
      if(f.gal!=null)cells.push(pcCell('Galaksi','G-'+f.gal,'#9FB4FF'));
      cells.push(pcCell('İlişki',h('span',{class:'pc-rel',style:{color:rl[0],borderColor:pcHex(rl[0],.6),background:pcHex(rl[0],.12)}},rl[1])));
      if(f.power!=null)cells.push(pcCell('Güç',nf(f.power),'#FF9A7A'));
      if(f.def!=null)cells.push(pcCell('Savunma',nf(f.def),'#7FD9FF'));
      if(n.npc)cells.push(pcCell('Durum','Sahipsiz','#FFD34D','pc-warn'));
      if(f.cd>0)cells.push(pcCell('Bekleme',Math.ceil(f.cd)+' sn','#FFD34D','pc-warn'));
      var im=/^[^.!?]*[.!?]/.exec(nt.desc||'');var info=im?im[0]:(nt.tag||'');
      panel.appendChild(h('div',{class:'card pc',style:{borderLeftColor:nt.color,borderColor:pcHex(nt.color,.45),marginBottom:0}},
        h('div',{class:'row pc-head'},ic(nt.icon,{size:26,color:nt.color}),
          h('div',{class:'grow pc-id'},h('b',{class:'pc-name',style:{color:tx,textShadow:'0 0 10px '+pcHex(nt.color,.55)}},n.name),h('div',{class:'pc-type',style:{color:tx}},nt.name)),
          h('span',{class:'pc-lvl',style:{color:hv[0],borderColor:pcHex(hv[0],.75),background:pcHex(hv[0],.14)}},'Sv '+n.lvl+' · '+hv[1]),
          h('button',{class:'icon-btn','aria-label':'Kapat',onclick:function(){panel.hidden=true;}},ic('close',{size:18}))),
        h('div',{class:'pc-grid'},cells),
        info?h('p',{class:'pc-info'},info):null,
        h('div',{class:'row'},
          h('button',{class:'btn sm grow',onclick:function(){tradeModal(n);}},'Ticaret'),
          h('button',{class:'btn ghost sm grow',onclick:function(){var r=g('befriend',n.id);snd(r&&r.ok&&r.friend!==false?'peace':'ui_err');toast({text:(r&&(r.text||r.err))||(r&&r.ok?(r.friend===false?'Teklif reddedildi.':'Dostluk kuruldu.'):'Olmadı.'),icon:'peace'});}},'Dost ol'),
          h('button',{class:'btn danger sm grow',onclick:function(){var r=g('attack',n.id);snd(r&&r.ok?'attack_launch':'ui_err');toast({text:(r&&(r.text||r.err))||(r&&r.ok?'Saldırı başladı.':'Saldırı yapılamadı.'),icon:'war'});}},'Saldır'))));
    }
  },
  unmount:function(){runCleanups();modalOpen&&closeModal();}
});
function tradeModal(n){
  var p=planet();var t=T(p&&p.type);
  modal(function(b,close){
    b.appendChild(h('h2',null,n.name+' ile ticaret'));b.appendChild(h('p',{class:'mute small'},'Göndermek istediğin kaynağı seç. Miktar elindekinin onda biri kadardır.'));
    (t.res||[]).forEach(function(r){var have=(p.res||{})[r.id]||0,amt=Math.max(1,Math.floor(have/10));
      b.appendChild(h('button',{class:'choice'+(have<1?' off':''),onclick:function(){var res=g('trade',n.id,{give:(function(){var o={};o[r.id]=amt;return o;})()});close();snd(res&&res.ok?'trade':'ui_err');toast({text:(res&&(res.text||res.err))||(res&&res.ok?'Takas tamam: '+Object.keys(res.got||{}).map(function(k){return '+'+SG.fmt.num(res.got[k])+' '+resMeta(k).name;}).join(', '):'Takas olmadı.'),icon:'trade'});}},h('span',{class:'row'},ic(r.icon,{size:20,color:r.color}),h('span',null,SG.fmt.num(amt)+' '+r.name)),h('small',null,'Elinde '+SG.fmt.num(have))));});
    b.appendChild(h('button',{class:'btn ghost block',style:{marginTop:'10px'},onclick:close},'Vazgeç'));
  });
}
/* ---------- MAĞAZA ---------- */
var shopCat='hepsi';
SG.view('shop',{
  mount:function(root){
    if(!need())return;var p=planet();var v=page(root,'shop');var wrap=h('div',{class:'wrap'});v.appendChild(wrap);
    var t=T(p&&p.type);
    if(!p){wrap.appendChild(topbar('Mağaza'));wrap.appendChild(h('div',{class:'card flat'},h('p',null,'Mağaza gezegenin tipine göre açılır.'),h('button',{class:'btn',onclick:function(){SG.go('egg');}},'Yumurta seç')));return;}
    var head=h('div'),tabs=h('div',{class:'tabs'}),list=h('div');wrap.appendChild(head);wrap.appendChild(tabs);wrap.appendChild(list);
    function draw(){
      var items=[];try{items=g('shop');if(!Array.isArray(items))items=(items&&items.list)||[];}catch(e){}
      head.textContent='';head.appendChild(topbar(t.name+' mağazası',p.name));
      var cats=['hepsi'];items.forEach(function(i){if(i.cat&&cats.indexOf(i.cat)<0)cats.push(i.cat);});
      if(cats.indexOf(shopCat)<0)shopCat='hepsi';
      tabs.textContent='';cats.forEach(function(c){tabs.appendChild(h('button',{class:'tab',type:'button','aria-selected':String(c===shopCat),onclick:function(){shopCat=c;snd('ui_tab');draw();}},c==='hepsi'?'Hepsi':(CATS[c]||c)));});
      list.textContent='';
      items.filter(function(i){return shopCat==='hepsi'||i.cat===shopCat;}).forEach(function(it){
        var lock=!!it.locked,lim=it.limit?(it.boughtN||0)+'/'+it.limit:null,full=it.limit&&(it.boughtN||0)>=it.limit;
        var btn=h('button',{class:'btn sm'+(lock||full?' off':''),type:'button',onclick:function(){
          var r=g('buy',it.id);if(!r||!r.ok){toast({text:(r&&r.err)||'Satın alınamadı.',icon:'lock',color:'#FF5A4D'});snd('ui_err');return;}
          snd('coin');vib(12);refreshCoins();var rc=btn.getBoundingClientRect();floatText('✓',rc.left+rc.width/2,rc.top,'#46E39B');toast({text:it.name+' alındı.',icon:it.icon,color:t.color});
          row.classList.add('bought');setTimeout(draw,650);}},full?'Tükendi':lock?'Kilitli':'Al');
        var row=h('div',{class:'card item'+(lock?' lock':'')},h('div',{class:'pic'},ic(it.icon,{size:26})),
          h('div',{class:'grow'},h('b',null,it.name),h('div',{class:'small mute'},it.desc||''),h('div',{class:'row wrap2',style:{marginTop:'6px',gap:'6px'}},priceNodes(it.price),lim?h('span',{class:'chip'},lim):null,lock&&it.reason?h('span',{class:'chip'},it.reason):(it.minLvl>(p.lvl||1)?h('span',{class:'chip'},'Seviye '+it.minLvl):null))),btn);
        list.appendChild(row);});
      if(!list.children.length)list.appendChild(h('div',{class:'card flat'},'Bu kategoride şu an ürün yok.'));
    }
    draw();busOn('coins',function(){refreshCoins();});
  },
  unmount:runCleanups
});
/* ---------- GÖREVLER ---------- */
var misTab='gunluk';
SG.view('missions',{
  mount:function(root){
    if(!need())return;var v=page(root,'missions');var wrap=h('div',{class:'wrap'});v.appendChild(wrap);
    var head=h('div'),tabs=h('div',{class:'tabs'}),list=h('div');wrap.appendChild(head);wrap.appendChild(tabs);wrap.appendChild(list);
    function draw(){
      head.textContent='';head.appendChild(topbar('Görevler','Ödülleri topla'));tabs.textContent='';list.textContent='';
      [['gunluk','Günlük'],['zincir','Zincir'],['rozet','Rozetler']].forEach(function(x){tabs.appendChild(h('button',{class:'tab',type:'button','aria-selected':String(x[0]===misTab),onclick:function(){misTab=x[0];snd('ui_tab');draw();}},x[1]));});
      if(misTab==='rozet')return badges();
      var ms=[];try{ms=g('missions');if(!Array.isArray(ms))ms=(ms&&ms.list)||[];}catch(e){}
      var kind=misTab==='gunluk'?'daily':'chain';
      var f=ms.filter(function(m){return misTab==='gunluk'?m.kind==='daily':m.kind!=='daily';});
      f.forEach(function(m){
        var n=(m.goal&&m.goal.n)||m.n||1,pr=Math.min(n,m.progress||0),ready=m.done||pr>=n;
        var btn=h('button',{class:'btn sm'+(!ready||m.claimed?' off':''),type:'button',onclick:function(){var r=g('claim',m.id);if(!r||!r.ok){toast({text:(r&&r.err)||'Alınamadı.',icon:'lock'});snd('ui_err');return;}snd('mission');snd('coin_big');vib(20);refreshCoins();toast({text:'Ödül alındı: '+rewardText(m.reward),icon:m.icon,kind:'long'});draw();}},m.claimed?'Alındı':'Ödülü al');
        list.appendChild(h('div',{class:'card item'+(m.claimed?' lock':'')},h('div',{class:'pic'},ic(m.icon||'target',{size:26})),
          h('div',{class:'grow'},h('b',null,m.name),h('div',{class:'small mute'},m.desc||''),h('div',{class:'bar',style:{margin:'8px 0 4px'}},h('i',{style:{width:(pr/n*100)+'%'}})),h('div',{class:'tiny mute'},SG.fmt.int(pr)+' / '+SG.fmt.int(n)+(m.reward?' · '+rewardText(m.reward):''))),btn));});
      if(!f.length)list.appendChild(h('div',{class:'card flat'},h('p',null,'Şu an aktif görev yok.'),h('p',{class:'mute small'},'Gezegeninin seviyesi arttıkça yeni görevler açılır.')));
    }
    function badges(){
      var b=(SG.D&&SG.D.BADGES)||[],have=(user()||{}).badges||[];
      var gr=h('div',{class:'grid2'});list.appendChild(gr);
      b.forEach(function(x){var ok=have.indexOf(x.id)>=0;gr.appendChild(h('div',{class:'card flat'+(ok?'':' item lock'),style:{textAlign:'center',opacity:ok?1:.5,marginBottom:0}},h('div',{style:{color:ok?'var(--tc)':'var(--faint)',display:'grid',placeItems:'center',height:'40px'}},ic(ok?x.icon:'lock',{size:32})),h('b',{class:'small'},x.name),h('div',{class:'tiny mute'},x.desc||'')));});
      if(!b.length)list.appendChild(h('div',{class:'card flat'},'Rozetler yükleniyor.'));
    }
    draw();busOn('mission',draw);busOn('badge',draw);
  },
  unmount:runCleanups
});
/* ---------- HİKÂYE ---------- */
SG.view('story',{
  mount:function(root){
    if(!need())return;var v=page(root,'hub');var wrap=h('div',{class:'wrap'});v.appendChild(wrap);
    wrap.appendChild(topbar('Yankının Peşinde','Hikâye bölümleri',h('button',{class:'icon-btn','aria-label':'Geri',onclick:function(){SG.go('hub');}},ic('back',{size:22}))));
    var list=h('div');wrap.appendChild(list);
    function draw(){
      list.textContent='';var st=[];try{st=g('story');if(!Array.isArray(st))st=(st&&st.list)||[];}catch(e){}
      if(!st.length&&SG.D&&SG.D.STORY)st=SG.D.STORY;
      var plvl=(planet()||{}).lvl||1;
      st.forEach(function(ch,i){var lock=ch.locked!=null?ch.locked:(ch.minLvl||0)>plvl;
        list.appendChild(h('button',{class:'card item'+(lock?' lock':''),style:{display:'flex',width:'100%',textAlign:'left'},onclick:function(){if(lock){toast({text:'Bu bölüm seviye '+ch.minLvl+'\'de açılır.',icon:'lock'});snd('ui_err');return;}read(ch);}},
          h('div',{class:'pic'},ic(lock?'lock':'story',{size:24})),h('div',{class:'grow'},h('b',null,ch.title||('Bölüm '+(i+1))),h('div',{class:'small mute'},lock?'Seviye '+ch.minLvl+'\'de açılır':ch.read?'Okundu':'Yeni bölüm')),ch.read?null:(lock?null:h('span',{class:'chip tc'},'Yeni'))));});
      if(!st.length)list.appendChild(h('div',{class:'card flat'},'Hikâye bölümleri yükleniyor.'));
    }
    function read(ch){
      g('readStory',ch.id);snd('ui_menu');
      modal(function(b,close){
        b.appendChild(h('h2',null,ch.title||''));
        String(ch.text||'').split(/\n+/).forEach(function(par){b.appendChild(h('p',{style:{lineHeight:'1.6',maxWidth:'62ch'}},par));});
        var d=ch.decision;var fresh={};try{fresh=g('story').filter(function(x){return x.id===ch.id;})[0]||{};}catch(e){}
        var tl=ch.typeLines&&ch.typeLines[curType()];if(tl)b.appendChild(h('p',{style:{fontStyle:'italic',opacity:'.85'}},tl));
        var endTxt=ch.endings?(function(){var e=null;try{e=g('ending');}catch(_){}return e&&ch.endings[e];})():null;if(endTxt)b.appendChild(h('p',{style:{fontWeight:'700',marginTop:'12px'}},endTxt));
        if(d&&fresh.chosen!=null){var oo=d.choices||d.options||[];var co=oo[fresh.chosen];b.appendChild(h('p',{class:'small mute',style:{marginTop:'12px'}},'Kararın: '+(co&&(co.label||co.text||co)||'')));b.appendChild(h('button',{class:'btn block',style:{marginTop:'12px'},onclick:function(){close();draw();}},'Kapat'));}
        else if(d){var opts=d.choices||d.options||(Array.isArray(d)?d:[]);
          var qq=d.question||d.q;if(qq)b.appendChild(h('p',{style:{fontWeight:'700',marginTop:'12px'}},qq));
          opts.forEach(function(o,i){b.appendChild(h('button',{class:'choice',onclick:function(){var r=g('decideStory',ch.id,i);snd(r&&r.ok?'choice_good':'ui_err');close();if(r&&r.ok&&r.ending&&ch.id==='c12')toast({text:'Hikâyenin sonu belirlendi.',icon:'story',kind:'long'});draw();}},typeof o==='string'?o:(o.label||o.text||'')));});}
        else b.appendChild(h('button',{class:'btn block',style:{marginTop:'12px'},onclick:function(){close();draw();}},'Kapat'));
      },{onClose:draw});
    }
    draw();
  },
  unmount:function(){runCleanups();modalOpen&&closeModal();}
});
/* ---------- AYARLAR ---------- */
SG.view('settings',{
  mount:function(root){
    if(!need())return;var v=page(root,'hub');var wrap=h('div',{class:'wrap'});v.appendChild(wrap);
    wrap.appendChild(topbar('Ayarlar',SG.ver?'Sürüm '+SG.ver:'',h('button',{class:'icon-btn','aria-label':'Geri',onclick:function(){SG.go('hub');}},ic('back',{size:22}))));
    function slider(label,key,def){var val=SG.store.get('vol_'+key,def);
      return h('label',{class:'fld'},h('span',null,label+' · '+Math.round(val*100)+'%'),h('input',{class:'sl',type:'range',min:'0',max:'100',value:Math.round(val*100),'aria-label':label,oninput:function(e){var x=e.target.value/100;SG.store.set('vol_'+key,x);e.target.previousSibling.textContent=label+' · '+Math.round(x*100)+'%';try{SG.A&&SG.A.setVol&&SG.A.setVol(key,x);}catch(er){}},onchange:function(){snd('ui_tap');}}));}
    var muted=SG.store.get('mute',false);
    wrap.appendChild(h('div',{class:'card'},h('h3',null,'Ses'),slider('Genel ses','master',.8),slider('Müzik','music',.26),slider('Efektler','fx',.8),
      h('button',{class:'btn ghost block',type:'button',onclick:function(e){muted=!muted;SG.store.set('mute',muted);try{SG.A&&SG.A.mute&&SG.A.mute(muted);}catch(er){}e.currentTarget.textContent=muted?'Sesi aç':'Sesi kapat';snd('ui_toggle');}},muted?'Sesi aç':'Sesi kapat')));
    var q=SG.store.get('quality','auto');var qs=h('select',{class:'inp','aria-label':'Görüntü kalitesi',onchange:function(e){SG.store.set('quality',e.target.value);toast({text:'Kalite değişti. Gezegen ekranına dönünce uygulanır.',icon:'settings'});}});
    [['auto','Otomatik'],['low','Düşük'],['mid','Orta'],['high','Yüksek']].forEach(function(o){qs.appendChild(h('option',{value:o[0],selected:o[0]===q?true:null},o[1]));});
    var rm=SG.store.get('rm',false);
    wrap.appendChild(h('div',{class:'card'},h('h3',null,'Görüntü'),h('label',{class:'fld'},h('span',null,'Kalite'),qs),
      h('button',{class:'btn ghost block',type:'button',onclick:function(e){rm=!rm;SG.store.set('rm',rm);SG.RM=rm||SG.RM;document.body.classList.toggle('rm',rm);e.currentTarget.textContent=rm?'Hareketi geri aç':'Hareketi azalt';snd('ui_toggle');}},rm?'Hareketi geri aç':'Hareketi azalt')));
    var file=h('input',{type:'file',accept:'application/json,.json',hidden:true,onchange:function(e){var f=e.target.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){var r=g('importBackup',String(rd.result));toast({text:r&&r.ok?'Yedek yüklendi.':((r&&r.err)||'Yedek yüklenemedi.'),icon:'settings'});if(r&&r.ok)SG.go('hub');};rd.readAsText(f);}});
    wrap.appendChild(h('div',{class:'card'},h('h3',null,'Yedek'),h('p',{class:'small mute'},'Tarayıcı verisi silinirse yedek dosyası gezegenlerini kurtarır.'),
      h('div',{class:'row'},h('button',{class:'btn sm grow',onclick:function(){var d=g('exportBackup');var s=typeof d==='string'?d:JSON.stringify(d&&d.data!==undefined?d.data:d);var a=h('a',{href:URL.createObjectURL(new Blob([s],{type:'application/json'})),download:'spacegg-yedek.json'});document.body.appendChild(a);a.click();a.remove();toast({text:'Yedek indirildi.',icon:'settings'});}},'Yedeği indir'),
        h('button',{class:'btn ghost sm grow',onclick:function(){file.click();}},'Yedekten yükle')),file));
    wrap.appendChild(h('button',{class:'btn danger block',onclick:doLogout},'Çıkış yap'));
  },
  unmount:runCleanups
});
/* ---------- genel olaylar ---------- */
var evInit=false;
U.init=function(){
  if(evInit)return;evInit=true;
  document.addEventListener('pointerdown',function(e){
    var b=e.target.closest&&e.target.closest('.btn,.act,.tab,.choice,.icon-btn,.nav button');if(!b||SG.RM)return;
    var r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*1.6;var s=h('span',{class:'rip',style:{width:d+'px',height:d+'px',left:(e.clientX-r.left-d/2)+'px',top:(e.clientY-r.top-d/2)+'px'}});
    if(getComputedStyle(b).position==='static')b.style.position='relative';b.style.overflow=b.style.overflow||'hidden';b.appendChild(s);setTimeout(function(){s.remove();},600);vib(6);},{passive:true});
  SG.bus.on('toast',toast);
  SG.bus.on('sound',function(d){snd(typeof d==='string'?d:d&&d.id,d&&d.opts);});
  SG.bus.on('coins',function(d){var n=typeof d==='number'?d:(d&&d.delta);refreshCoins();if(n)floatText((n>0?'+':'')+SG.fmt.int(n),window.innerWidth-70,60+(window.visualViewport?0:0),n>0?'#ffd76a':'#ff9d94');});
  SG.bus.on('lvl',function(d){var n=d&&(d.lvl||d.n);toast({text:'Gezegenin '+(n?n+'. ':'yeni ')+'seviyeye ulaştı.',icon:'levelup',color:'#ffd76a',kind:'long'});snd('levelup');});
  SG.bus.on('plvl',function(d){var n=d&&(d.lvl||d.n);toast({text:'Oyuncu seviyen '+(n||'yükseldi')+'.',icon:'levelup',color:'#B15CFF',kind:'long'});snd('plvlup');});
  SG.bus.on('badge',function(d){toast({text:'Yeni rozet: '+((d&&(d.name||d.id))||''),icon:(d&&d.icon)||'badge',color:'#ffd76a',kind:'long'});snd('badge');});
  SG.bus.on('mission',function(d){toast({text:'Görev tamamlandı'+(d&&d.name?': '+d.name:'.'),icon:(d&&d.icon)||'mission',color:'#46E39B'});snd('mission');});
  SG.bus.on('hatch',function(){snd('egg_hatch');});
};
U.modal=modal;U.closeModal=closeModal;U.ic=ic;
})();
