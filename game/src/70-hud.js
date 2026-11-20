/* SpacEgg 2.0 — HUD yardımcıları (UI/UX): ikonlar, metin, rozetler, tercihler, toast, eğitim, panoya kopyalama */
(function(){
'use strict';
var h=SG.h;
var HUD=SG.HUD={};

/* ---- metin: SG.T2 varsa onu, yoksa yedeği kullan ---- */
HUD.T=function(path,fb){
  try{var o=SG.T2,p=String(path).split('.');for(var i=0;i<p.length&&o!=null;i++)o=o[p[i]];if(o!=null&&o!=='')return o;}catch(e){}
  return fb;
};
var ONB_FB=[
  {title:'Evrenine hoş geldin',text:'Tek parmakla kaydır, iki parmakla sıkıştırarak yakınlaş. Çift dokunmak bir nesneye odaklanır.'},
  {title:'Zamanı sen yönet',text:'Üstteki çubukla kozmik zamanı durdur, hızlandır ya da yavaşlat. Yıldızlar zamanla evrim geçirir.'},
  {title:'Gözlemle ve öğren',text:'Bir nesneye dokun. Her gözlem bir bilgi katmanı açar. Etiketler bilginin gerçek, basitleştirilmiş ya da kurgu olduğunu söyler.'},
  {title:'Hikâyeni takip et',text:'Günlük ve Keşifler sekmeleri evreninin tarihçesini tutar. Yedek almak için ekranın solundan sağa kaydır, menüyü aç.'}
];
HUD.onboardSteps=function(){
  var a=HUD.T('onboard',null);
  if(!Array.isArray(a)||a.length<1)return ONB_FB;
  var out=a.map(function(s,i){return typeof s==='string'?{title:(ONB_FB[i]&&ONB_FB[i].title)||'Rehber',text:s}:s;});
  out=out.concat([{id:'menu',target:'menu',title:'Menü solda',text:'Ekranın sol kenarından sağa kaydır ya da sol üstteki menü düğmesine dokun. Kayıtlar, ayarlar, hedefler ve daha fazlası orada.'}]);
  return out;
};

/* ---- ikonlar (24x24 çizgi) ---- */
var IC={
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  book:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  save:'<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h7V3M8 21v-7h8v7"/>',
  sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  play:'<path d="M8 5l11 7-11 7z"/>',
  camera:'<path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="3.2"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="18" r=".8"/>',
  up:'<path d="M6 15l6-6 6 6"/>',
  down:'<path d="M6 9l6 6 6-6"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  target:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  spark:'<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  down2:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  check:'<path d="M5 12l5 5 9-10"/>',
  warn:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  dice:'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>',
  edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  trash:'<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  exit:'<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h10"/>',
  back:'<path d="M15 5l-7 7 7 7"/>',
  user:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.1 1-1.1 1.8M12 17v.5"/>',
  volume:'<path d="M4 10v4h4l5 4V6l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
  mute:'<path d="M4 10v4h4l5 4V6l-5 4z"/><path d="M16 9l5 6M21 9l-5 6"/>',
  music:'<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  chevr:'<path d="M9 6l6 6-6 6"/>'
};
HUD.ic=function(name,size){
  var s=size||22;var el=document.createElement('span');el.className='h-ic';el.setAttribute('aria-hidden','true');
  el.innerHTML='<svg viewBox="0 0 24 24" width="'+s+'" height="'+s+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">'+(IC[name]||'')+'</svg>';
  return el;
};

/* ---- kimlik ayrıştırma: g0 / g0s12 / g0s12p2 / g0s12p2m1 ---- */
HUD.kindOf=function(id){
  if(!id)return null;id=String(id);
  if(/m\d+$/.test(id))return'm';if(/p\d+$/.test(id))return'p';if(/s\d+$/.test(id))return's';if(/^g\d+$/.test(id))return'g';return null;
};
HUD.parentId=function(id,kind){
  kind=kind||HUD.kindOf(id);id=String(id||'');
  if(kind==='m')return id.replace(/m\d+$/,'');if(kind==='p')return id.replace(/p\d+$/,'');if(kind==='s')return id.replace(/s\d+$/,'');return null;
};
HUD.idAtScale=function(id,scale){
  if(!id)return null;var m=/^(g\d+)(?:(s\d+)(?:(p\d+)(?:(m\d+))?)?)?$/.exec(String(id));if(!m)return null;
  if(scale==='galaxy')return m[1];if(scale==='system')return m[2]?m[1]+m[2]:null;if(scale==='planet')return m[3]?m[1]+m[2]+m[3]:null;return null;
};
HUD.SCALES=['universe','galaxy','system','planet'];
HUD.SCALE_TR={universe:'Evren',galaxy:'Galaksi',system:'Sistem',planet:'Gezegen'};

/* ---- bilimsel dürüstlük etiketi ---- */
var TAGLBL={gercek:{t:'Gerçek',g:'●',d:'Gerçek bilimsel veri ya da ilke'},basit:{t:'Basit',g:'◐',d:'Oyun için basitleştirilmiş'},kurgu:{t:'Kurgu',g:'◇',d:'Kurgusal, gerçek değil'}};
var TAGFB={cls:'gercek',lum:'gercek',mass:'gercek',temp:'basit',age:'basit',life:'basit',phase:'basit',a:'gercek',period:'basit',radius:'gercek',atm:'basit',water:'basit',albedo:'basit',habScore:'basit',habZone:'gercek',moons:'kurgu',type:'basit',kind:'gercek',starCount:'basit',arms:'gercek',planetCount:'kurgu'};
HUD.tagOf=function(key){var t=null;try{t=SG.U&&SG.U.TAGS&&SG.U.TAGS[key];}catch(e){}return TAGLBL[t]?t:(TAGFB[key]||'basit');};
HUD.tagBadge=function(tag){
  var d=TAGLBL[tag]||TAGLBL.basit;
  return h('span',{class:'h-tag h-tag-'+tag,title:d.d,'aria-label':d.d},h('span',{'aria-hidden':'true'},d.g+' '),d.t);
};

/* ---- sayı/zaman biçimleri ---- */
HUD.n=function(v,dec){if(v==null||isNaN(v))return'—';var d=dec==null?1:dec;var p=Math.pow(10,d);return String(Math.round(v*p)/p).replace('.',',');};
HUD.myr=function(v){if(v==null||isNaN(v))return'—';if(v<1)return'1 milyon yıldan az';if(v<1000)return HUD.n(v,0)+' milyon yıl';return HUD.n(v/1000,2)+' milyar yıl';};
HUD.cosmic=function(t){try{if(SG.U&&SG.U.cosmicLabel)return SG.U.cosmicLabel(t);}catch(e){}return HUD.myr(t);};
HUD.when=function(ts){
  if(!ts)return'—';var s=Math.max(0,(Date.now()-ts)/1000);
  if(s<60)return'az önce';if(s<3600)return Math.floor(s/60)+' dk önce';if(s<86400)return Math.floor(s/3600)+' sa önce';return Math.floor(s/86400)+' gün önce';
};
HUD.bytes=function(b){b=b||0;return b<1024?b+' B':b<1048576?HUD.n(b/1024,1)+' KB':HUD.n(b/1048576,2)+' MB';};

/* ---- tercihler: hareket azaltma, yüksek kontrast, yazı ölçeği ---- */
HUD.prefs={
  rm:function(){return!!SG.store.get('rm',false)||!!SG.RM;},
  hc:function(){return!!SG.store.get('hc',false);},
  ts:function(){var v=SG.store.get('ts',1);return(v===1.25||v===1.5)?v:1;}
};
HUD.applyPrefs=function(){
  try{
    var b=document.body;if(!b)return;
    if(SG.store.get('rm',false))SG.RM=true;
    b.classList.toggle('rm',!!(SG.RM));
    b.classList.toggle('hc',HUD.prefs.hc());
    document.documentElement.style.setProperty('--ts',String(HUD.prefs.ts()));
  }catch(e){SG.log.err('hud.applyPrefs',e);}
};
HUD.setRM=function(on){SG.store.set('rm',!!on);SG.RM=!!on||(function(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}})();HUD.applyPrefs();try{SG.bus.emit('prefs',{rm:SG.RM});}catch(e){}};
HUD.setHC=function(on){SG.store.set('hc',!!on);HUD.applyPrefs();try{SG.bus.emit('prefs',{hc:!!on});}catch(e){}};
HUD.setTS=function(v){SG.store.set('ts',v);HUD.applyPrefs();try{SG.bus.emit('prefs',{ts:v});}catch(e){}};
HUD.applyPrefs();

/* ---- parçalı denetim (segmented): [{v,label,aria}] ---- */
HUD.seg=function(o){
  var wrap=h('div',{class:'h-seg '+(o.cls||''),role:'group','aria-label':o.label||null});
  var btns=[];
  function paint(v){btns.forEach(function(b){var on=(b._v===v);b.setAttribute('aria-pressed',on?'true':'false');b.classList.toggle('on',on);});}
  o.items.forEach(function(it){
    var b=h('button',{type:'button',class:'h-segb','aria-label':it.aria||null,'aria-pressed':'false',onclick:function(){paint(it.v);o.onChange&&o.onChange(it.v);}});
    if(it.icon)b.appendChild(HUD.ic(it.icon,18));
    if(it.label!=null)b.appendChild(h('span',null,it.label));
    b._v=it.v;btns.push(b);wrap.appendChild(b);
  });
  wrap.set=paint;paint(o.value);
  return wrap;
};

/* ---- alt gezinme çubuğu (mevcut .nav görünümü) ---- */
HUD.nav=function(active){
  var items=[['cosmos','globe','Evren',null],['journal','book','Günlük','history'],['disc','star','Keşifler','disc']];
  var nav=h('nav',{class:'nav h-nav','aria-label':'Ana gezinme'});
  var btns={};
  items.forEach(function(it){
    var b=h('button',{type:'button','aria-label':it[2],'aria-current':it[0]===active?'page':null,onclick:function(){
      try{SG.A2&&SG.A2.ui&&SG.A2.ui('tap');}catch(e){}
      if(it[0]==='cosmos'){if(active==='cosmos')return;SG.go('cosmos');return;}
      if(it[0]===active)return;
      SG.go('journal',{tab:it[3]});}});
    var ic=HUD.ic(it[1],22);ic.classList.add('ic');b.appendChild(ic);b.appendChild(h('span',null,it[2]));
    btns[it[0]]=b;nav.appendChild(b);
  });
  nav.setActive=function(n){active=n;Object.keys(btns).forEach(function(k){if(k===n)btns[k].setAttribute('aria-current','page');else btns[k].removeAttribute('aria-current');});};
  return nav;
};

/* ---- menü (çekmece) düğmesi: ≥44 px, SG.Drawer varsa açar ---- */
HUD.menuBtn=function(){
  var b=h('button',{type:'button',class:'h-ibtn h-menu','aria-label':'Menüyü aç','aria-haspopup':'dialog','aria-expanded':'false',onclick:function(){
    try{SG.A2&&SG.A2.ui&&SG.A2.ui('open');}catch(e){}
    try{SG.Drawer&&SG.Drawer.open();}catch(e){SG.log.err('menuBtn',e);}
  }},HUD.ic('menu',22));
  b.setAttribute('data-dr-btn','1');
  return b;
};
/* ---- geri düğmesi (Kayıtlar/Ayarlar gibi çekmeceden açılan sayfalar) ---- */
HUD.backBtn=function(){
  var to=function(){return HUD.uni()?'cosmos':'create';};
  return h('button',{type:'button',class:'h-ibtn h-back','aria-label':'Evrene dön',onclick:function(){try{SG.A2&&SG.A2.ui&&SG.A2.ui('close');}catch(e){}SG.go(to());}},HUD.ic('back',22));
};

/* ---- olay toast'ı (kozmik olaylar, keşifler): kapsayıcı görünüm tarafından verilir ---- */
HUD.toastBox=function(){return h('div',{class:'h-toasts',role:'status','aria-live':'polite'});};
HUD.toast=function(box,o){
  if(!box)return null;
  while(box.children.length>=2)box.removeChild(box.firstChild);
  var el=h('button',{type:'button',class:'h-toast '+(o.cls||''),'aria-label':(o.text||'')+(o.onTap?' — odaklan':'')});
  if(o.icon)el.appendChild(HUD.ic(o.icon,20));
  var tx=h('span',{class:'h-toast-t'});if(o.title)tx.appendChild(h('b',null,o.title+' '));tx.appendChild(document.createTextNode(o.text||''));
  el.appendChild(tx);
  var gone=false;function bye(){if(gone)return;gone=true;el.classList.add('out');setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},SG.RM?0:300);}
  el.addEventListener('click',function(){try{o.onTap&&o.onTap();}catch(e){SG.log.err('hud.toast',e);}bye();});
  box.appendChild(el);setTimeout(bye,o.ms||5200);
  return el;
};

/* ---- panoya kopyala (WebView güvenli) ---- */
HUD.copy=function(text,ta){
  function fb(){try{if(ta){ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);}return document.execCommand&&document.execCommand('copy');}catch(e){return false;}}
  try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text).then(function(){return true;},function(){return fb();});}catch(e){}
  return Promise.resolve(fb());
};

/* ---- ilk kullanım eğitimi (kaplama + vurgu) ---- */
HUD.onboarding=function(root,opts){
  var steps=HUD.onboardSteps();var targets=(opts&&opts.targets)||[];var i=0;var hl=null;
  var box=h('div',{class:'h-onb',role:'dialog','aria-modal':'false','aria-label':'Başlangıç rehberi'});
  function clearHL(){if(hl){hl.classList.remove('h-hl');hl=null;}}
  function done(){clearHL();if(box.parentNode)box.parentNode.removeChild(box);SG.store.set('onb2',true);opts&&opts.onDone&&opts.onDone();}
  function draw(){
    clearHL();var s=steps[i],last=i===steps.length-1;
    var sel=targets[i];if(sel){var t=root.querySelector(sel);if(t){t.classList.add('h-hl');hl=t;}}
    box.textContent='';
    box.appendChild(h('div',{class:'h-onb-n'},'Adım '+(i+1)+' / '+steps.length));
    box.appendChild(h('h3',null,s.title));box.appendChild(h('p',null,s.text));
    var dots=h('div',{class:'h-dots','aria-hidden':'true'});steps.forEach(function(_,k){dots.appendChild(h('i',{class:k===i?'on':''}));});
    box.appendChild(dots);
    box.appendChild(h('div',{class:'row'},
      h('button',{type:'button',class:'btn ghost sm',onclick:done},'Atla'),h('span',{class:'grow'}),
      h('button',{type:'button',class:'btn sm',onclick:function(){if(last)done();else{i++;draw();}}},last?'Başla':'Sonraki')));
    var nb=box.querySelector('.btn:not(.ghost)');if(nb)try{nb.focus({preventScroll:true});}catch(e){}
  }
  root.appendChild(box);draw();
  return{close:done};
};
HUD.needsOnboarding=function(){return!SG.store.get('onb2',false);};
HUD.resetOnboarding=function(){SG.store.set('onb2',false);};

/* ---- yardımcı: aktif evren ---- */
HUD.uni=function(){try{return SG.S&&SG.S.active?SG.S.active():null;}catch(e){SG.log.err('hud.uni',e);return null;}};
HUD.sound=function(n){try{SG.A2&&SG.A2.ui&&SG.A2.ui(n);}catch(e){}};
})();
