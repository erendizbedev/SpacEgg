/* SpacEgg 2.0 — görünümler (UI/UX): create, cosmos, journal, saves, prefs */
(function(){
'use strict';
var h=SG.h,HUD=SG.HUD,T=HUD.T;

var PHASE={protostar:'Öncül yıldız',main:'Ana dizi',giant:'Devleşme',dwarf:'Beyaz cüce',neutron:'Nötron yıldızı',blackhole:'Kara delik'};
var PTYPE={rocky:'Kayaç',ocean:'Okyanus',ice:'Buz',gas:'Gaz devi',lava:'Lav',desert:'Çöl',ringed:'Halkalı gaz devi'};
var GKIND={spiral:'Sarmal',barred:'Çubuklu sarmal',elliptical:'Eliptik',irregular:'Düzensiz'};
var KIND_TR={g:'Galaksi',s:'Yıldız',p:'Gezegen',m:'Uydu'};
var EVICON={supernova:'spark',nova:'spark',comet:'star','stellar-birth':'star','star-dies':'spark',nebula:'globe','habitable-shift':'target',collision:'spark',disc:'star'};
var SPEEDLBL=[['pause','Duraklat',null],['','Normal hız: saniyede 1 milyon yıl','1×'],['','Hızlı: saniyede 10 milyon yıl','10×'],['','Çok hızlı: saniyede 100 milyon yıl','100×'],['','En hızlı: saniyede 1 milyar yıl','1000×']];
var FXL={temp:['Sıcaklık',function(v){return HUD.n(v,0)+' K ('+HUD.n(v-273.15,0)+' °C)';}],habScore:['Yaşanabilirlik',function(v){return'%'+HUD.n(v*100,0);}],atm:['Atmosfer',function(v){return HUD.n(v,2);}],water:['Su',function(v){return HUD.n(v,2);}],albedo:['Yansıtma',function(v){return HUD.n(v,2);}]};
function num(v){return v==null?'—':Number(v).toLocaleString('tr-TR');}
var ROWS={
 g:[['kind','Tür',0,function(v){return GKIND[v]||v;}],['starCount','Yıldız sayısı (yaklaşık)',1,num],['arms','Sarmal kol sayısı',2,function(v){return String(v);}],['r','Göreli boyut',3,function(v){return'%'+HUD.n(v*100,0);}]],
 s:[['cls','Tayf sınıfı',0,function(v){return String(v);}],['phase','Evre',0,function(v){return PHASE[v]||v;}],['mass','Kütle (Güneş = 1)',1,function(v){return HUD.n(v,2);}],['lum','Parlaklık (Güneş = 1)',1,function(v){return HUD.n(v,2);}],['temp','Yüzey sıcaklığı',2,function(v){return HUD.n(v,0)+' K';}],['age','Yaş',2,HUD.myr],['life','Tahmini ömür',3,HUD.myr],['planetCount','Gezegen sayısı',3,function(v){return String(v);}]],
 p:[['type','Tür',0,function(v){return PTYPE[v]||v;}],['a','Yıldıza uzaklık',1,function(v){return HUD.n(v,2)+' AU';}],['radius','Yarıçap (Dünya = 1)',1,function(v){return HUD.n(v,2);}],['period','Yıl uzunluğu',1,function(v){return HUD.n(v,0)+' gün';}],['temp','Sıcaklık',2,FXL.temp[1]],['atm','Atmosfer yoğunluğu',2,function(v){return HUD.n(v,2);}],['water','Su miktarı',2,function(v){return HUD.n(v,2);}],['habScore','Yaşanabilirlik',3,FXL.habScore[1]],['habZone','Yaşanabilir kuşak',3,function(v){return v?'Evet':'Hayır';}],['moons','Uydu sayısı',3,function(v){return String(v&&v.length!=null?v.length:v);}]],
 m:[['radius','Yarıçap (Dünya = 1)',0,function(v){return HUD.n(v,2);}],['a','Gezegene uzaklık',1,function(v){return HUD.n(v,3)+' AU';}]]
};

/* ortak sayfa iskeleti (create dışındaki sayfalar) */
function page(root,title,sub,active){
  var v=h('div',{class:'v hv-page'+(active?'':' nonav')});var w=h('div',{class:'wrap'});
  w.appendChild(h('div',{class:'top'},h('h1',null,title,sub?h('small',null,sub):null)));
  v.appendChild(w);root.appendChild(v);if(active)root.appendChild(HUD.nav(active));
  return w;
}
function btn(label,cls,fn,icon,aria){
  var b=h('button',{type:'button',class:'btn '+(cls||''),'aria-label':aria||null,onclick:fn});
  if(icon)b.appendChild(HUD.ic(icon,18));b.appendChild(h('span',null,label));return b;
}
function rnd(n){var s='',a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';try{var u=new Uint32Array(n);crypto.getRandomValues(u);for(var i=0;i<n;i++)s+=a[u[i]%a.length];}catch(e){for(var j=0;j<n;j++)s+=a[Math.floor(Math.random()*a.length)];}return s;}
var NAMEA=['Aurora','Kalyra','Nadir','Selene','Tavira','Vesper','Zefir','Orena','Lumira','Astra','Neris','Kaelum'];
var NAMEB=['Evreni','Sonsuzluğu','Kozmosu','Bahçesi','Âlemi','Rüyası'];
function randName(){return NAMEA[Math.floor(Math.random()*NAMEA.length)]+' '+NAMEB[Math.floor(Math.random()*NAMEB.length)];}
function announce(box,msg){if(box){box.textContent='';setTimeout(function(){box.textContent=msg;},30);}}

/* =========================== CREATE =========================== */
SG.view('create',{
  mount:function(root){
    var st={bb:null,tm:null,busy:false,preset:'sakin'};this._st=st;
    var saves=[];try{saves=SG.S.list()||[];}catch(e){SG.log.err('create.list',e);}
    var v=h('div',{class:'v hv-page nonav hv-create'});var w=h('div',{class:'wrap'});v.appendChild(w);
    w.appendChild(h('div',{class:'top'},h('h1',null,T('create.title','Evreni yarat'),h('small',null,T('slogan','Hiçlikten bir evren yarat. Galaksileri keşfet. Yıldızların ve dünyaların hikâyesini şekillendir.')))));
    var cv=h('canvas',{class:'h-bb','aria-hidden':'true'});
    w.appendChild(h('div',{class:'h-bbwrap'},cv,h('div',{class:'h-bbcap'},T('create.caption','Bu tohumdan doğacak evrenin ilk anı'))));
    var name=h('input',{class:'inp',type:'text',maxlength:'28',value:randName(),autocomplete:'off',id:'cr-name','aria-describedby':'cr-name-h'});
    var seed=h('input',{class:'inp',type:'text',maxlength:'32',value:rnd(8),autocomplete:'off',autocapitalize:'characters',spellcheck:'false',id:'cr-seed','aria-describedby':'cr-seed-h'});
    var err=h('div',{class:'h-err',role:'alert'});
    function startBB(){
      if(st.bb){try{st.bb.stop();}catch(e){}st.bb=null;}
      try{if(SG.R&&SG.R.bigBang){st.bb=SG.R.bigBang(cv,seed.value||'x');}}catch(e){SG.log.err('create.bigBang',e);}
    }
    w.appendChild(h('div',{class:'card'},
      h('label',{class:'fld',for:'cr-name'},h('span',null,'Evrenin adı'),name),
      h('div',{id:'cr-name-h',class:'tiny mute'},'En fazla 28 karakter.'),
      h('div',{style:{height:'10px'}}),
      h('label',{class:'fld',for:'cr-seed'},h('span',null,'Tohum'),
        h('div',{class:'row'},seed,h('button',{type:'button',class:'btn ghost sm h-sq','aria-label':'Rastgele tohum üret',onclick:function(){seed.value=rnd(8);startBB();HUD.sound('tap');}},HUD.ic('dice',22)))),
      h('div',{id:'cr-seed-h',class:'tiny mute'},'Aynı tohum her zaman aynı evreni üretir. Paylaşabilirsin.')));
    var grp=h('div',{class:'h-presets',role:'radiogroup','aria-label':'Evren ön ayarı'});
    var PS=[['sakin','Sakin','Dengeli yapı, az olay, huzurlu keşif.'],['yogun','Yoğun','Çok sayıda nesne, sık kozmik olaylar.'],['seyrek','Seyrek','Geniş boşluklar, az ama etkileyici nesneler.']];
    function paintP(){Array.prototype.forEach.call(grp.children,function(b){var on=b._v===st.preset;b.setAttribute('aria-checked',on?'true':'false');b.classList.toggle('on',on);b.tabIndex=on?0:-1;});}
    PS.forEach(function(p,i){
      var b=h('button',{type:'button',class:'h-preset',role:'radio','aria-checked':'false',onclick:function(){st.preset=p[0];paintP();HUD.sound('tap');},
        onkeydown:function(e){var d=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;if(!d)return;e.preventDefault();var n=PS[(i+d+PS.length)%PS.length][0];st.preset=n;paintP();grp.children[(i+d+PS.length)%PS.length].focus();}},
        h('b',null,p[1]),h('span',{class:'small mute'},p[2]));
      b._v=p[0];grp.appendChild(b);
    });
    w.appendChild(h('h2',null,'Ön ayar'));w.appendChild(grp);paintP();
    w.appendChild(err);
    var go=btn('Evreni yarat','block h-cta',function(){
      if(st.busy)return;
      var n=(name.value||'').trim(),s=(seed.value||'').trim();
      if(!n){err.textContent='Evrenine bir ad ver.';name.focus();HUD.sound('error');return;}
      if(!s){s=rnd(8);seed.value=s;}
      st.busy=true;go.classList.add('off');err.textContent='';
      try{
        var u=SG.S.create({name:n,seed:s,preset:st.preset});
        if(!u)throw new Error('Evren oluşturulamadı');
        HUD.sound('unlock');SG.go('cosmos');
      }catch(e){SG.log.err('create',e);err.textContent='Evren oluşturulamadı. Bir kez daha dene.';st.busy=false;go.classList.remove('off');HUD.sound('error');}
    },'spark');
    w.appendChild(h('div',{class:'h-sticky'},go));
    if(saves.length){w.appendChild(h('div',{style:{height:'8px'}}));w.appendChild(btn('Kayıtlı evrenlerim ('+saves.length+')','ghost block',function(){SG.go('saves');},'save'));}
    seed.addEventListener('input',function(){clearTimeout(st.tm);st.tm=setTimeout(startBB,450);});
    root.appendChild(v);
    setTimeout(startBB,60);
  },
  unmount:function(){var st=this._st;if(!st)return;clearTimeout(st.tm);if(st.bb){try{st.bb.stop();}catch(e){}}this._st=null;}
});

/* =========================== COSMOS =========================== */
SG.view('cosmos',{
  mount:function(root,params){
    var uni=HUD.uni();
    if(!uni){setTimeout(function(){SG.go('create');},0);return;}
    var st={uni:uni,alive:true,r:null,scale:'universe',focus:null,sel:null,offs:[],lastToast:0,lastTime:'',acc:0,discT:0,goalsOpen:true,paused:false,sheetOpen:true,onb:null,result:null};
    this._st=st;
    var view=h('div',{class:'hv','data-scale':'universe'});
    var cv=h('canvas',{class:'h-canvas',tabindex:'0',role:'img','aria-label':'Evren sahnesi. Kaydırmak için sürükle, yakınlaşmak için sıkıştır. Klavyede ok tuşları, artı ve eksi, Escape ile üst ölçeğe çık. Liste düğmesi nesneleri liste olarak verir.'});
    var live=h('div',{class:'h-sr',role:'status','aria-live':'polite'});
    /* üst çubuk */
    var nameEl=h('div',{class:'h-name'},uni.name||'Evren');
    var timeEl=h('div',{class:'h-time num'},HUD.ic('clock',14),h('span',null,HUD.cosmic(uni.t)));
    var timeTx=timeEl.lastChild;
    var bList=h('button',{type:'button',class:'h-ibtn','aria-label':'Nesneleri liste olarak göster',onclick:function(){openList();}},HUD.ic('list',22));
    var bPhoto=h('button',{type:'button',class:'h-ibtn','aria-label':'Fotoğraf modu',onclick:function(){photoMode(true);}},HUD.ic('camera',22));
    var speed=HUD.seg({cls:'h-speed',label:'Zaman hızı',value:uni.speedIx==null?1:uni.speedIx,items:SPEEDLBL.map(function(s,i){return{v:i,icon:s[0]||null,label:s[2],aria:s[1]};}),onChange:function(ix){
      try{SG.U.setSpeed(uni,ix);}catch(e){uni.speedIx=ix;}try{SG.A2&&SG.A2.setSpeed(ix);}catch(e){}
      announce(live,ix===0?'Zaman durdu':'Zaman hızı: '+SPEEDLBL[ix][2]);
    }});
    var bUp=h('button',{type:'button',class:'h-ibtn h-up','aria-label':'Bir üst ölçeğe çık',onclick:function(){up();}},HUD.ic('up',22));
    var crumbs=h('nav',{class:'h-crumbs','aria-label':'Konum'});
    var toasts=HUD.toastBox();
    var top=h('header',{class:'h-top2'},
      h('div',{class:'h-r1'},h('div',{class:'grow'},nameEl,timeEl),bList,bPhoto),
      h('div',{class:'h-r2'},speed,bUp),crumbs,toasts);
    /* alt sayfa: alt panel + hedefler */
    var sheet=h('section',{class:'h-sheet',hidden:'hidden','aria-label':'Seçili nesne'});
    var goals=h('aside',{class:'h-goals','aria-label':'Hedef ipuçları'});
    var nav=HUD.nav('cosmos');
    var pbar=h('div',{class:'h-photobar',hidden:'hidden'},btn('Çek','','',null),btn('Kapat','ghost',function(){photoMode(false);},'close'));
    var shot=pbar.firstChild;shot.addEventListener('click',function(){takePhoto();});shot.insertBefore(HUD.ic('camera',18),shot.firstChild);
    view.appendChild(cv);view.appendChild(top);view.appendChild(goals);view.appendChild(sheet);view.appendChild(nav);view.appendChild(pbar);view.appendChild(live);
    root.appendChild(view);

    /* --- sahne --- */
    try{
      st.r=SG.R.create(cv,{uni:uni,
        onSelect:function(id,kind){st.sel=id||null;if(id){HUD.sound('tap');}openSheet(id);},
        onScale:function(sc){onScale(sc);}});
      st.r.setQuality&&st.r.setQuality(SG.P&&SG.P.tier?SG.P.tier():1);
      st.r.setReducedMotion&&st.r.setReducedMotion(!!SG.RM);
      if(SG.test)SG.test.r=st.r;
    }catch(e){SG.log.err('cosmos.R',e);}
    var R=st.r;

    function up(){HUD.sound('close');try{R&&R.up();}catch(e){SG.log.err('cosmos.up',e);}}
    function focusTo(id){
      if(!id||!R)return;
      st.focus=id;st.sel=id;try{R.focus(id,{animate:!SG.RM});}catch(e){SG.log.err('cosmos.focus',e);}
      openSheet(id);
    }
    function refId(){return st.sel||st.focus||(R&&R.selected&&R.selected())||null;}
    function nameOf(id){try{var o=SG.U.find(uni,id);return o&&o.name||id;}catch(e){return id;}}
    function onScale(sc){
      setTimeout(function(){try{inset();}catch(e){}},40);
      st.scale=sc;view.setAttribute('data-scale',sc);
      var s=R&&R.selected&&R.selected();if(s)st.focus=s;
      paintCrumbs();try{SG.A2&&SG.A2.setScale(sc);}catch(e){}
      announce(live,'Ölçek: '+HUD.SCALE_TR[sc]);
      bUp.hidden=sc==='universe';
    }
    function paintCrumbs(){
      crumbs.textContent='';var sc=st.scale,idx=HUD.SCALES.indexOf(sc);
      if(idx<=0){crumbs.hidden=true;return;}crumbs.hidden=false;
      var ref=refId();
      for(var i=0;i<=idx;i++){
        (function(i){
          var lv=HUD.SCALES[i],id=i===0?null:HUD.idAtScale(ref,lv);if(i>0&&!id)return;
          var last=i===idx;
          if(i>0)crumbs.appendChild(h('span',{class:'h-sep','aria-hidden':'true'},'›'));
          crumbs.appendChild(h('button',{type:'button',class:'h-crumb'+(last?' on':''),'aria-current':last?'location':null,onclick:function(){if(last)return;HUD.sound('tap');if(i===0){R&&R.home();}else focusTo(id);}},i===0?'Evren':nameOf(id)));
        })(i);
      }
      crumbs.scrollLeft=crumbs.scrollWidth;
    }

    /* --- alt panel --- */
    function observe(id){
      var lv=0;try{lv=SG.U.observe(uni,id);}catch(e){SG.log.err('cosmos.observe',e);}
      HUD.sound('open');announce(live,'Gözlem tamamlandı. Bilgi düzeyi '+lv+' / 3');
      try{var n=SG.Disc&&SG.Disc.check?SG.Disc.check(uni):[];}catch(e){}
      try{SG.S.autosave&&SG.S.save&&SG.S.save();}catch(e){}
      openSheet(id,true);
    }
    function fxText(fx){
      var d=FXL[fx.k]||[fx.k,function(v){return HUD.n(v,2);}];
      var up=fx.to>fx.from,same=fx.to===fx.from;
      return h('li',null,h('span',{class:'k'},d[0]),h('span',{class:'ft num'},d[1](fx.from),' → ',h('b',null,d[1](fx.to)),' ',h('span',{class:'dl','aria-label':same?'değişmedi':up?'arttı':'azaldı'},same?'●':up?'▲':'▼')));
    }
    function inset(){try{if(R&&R.setInset)var cb=crumbs.getBoundingClientRect(),vb=cv.parentNode?cv.parentNode.getBoundingClientRect().top:0;R.setInset({top:Math.max(0,Math.round(cb.bottom-vb+4)),bottom:sheet.hidden?0:(sheet.offsetHeight+70)});}catch(e){}}
    function openSheet(id,keepOpen){
      var pb=sheet.querySelector('.h-sh-body'),pscroll=pb&&keepOpen?pb.scrollTop:0,wasMin=keepOpen&&sheet.classList.contains('min');
      sheet.textContent='';
      if(!id){sheet.hidden=true;st.result=null;paintGoals();inset();return;}
      var obj=null;try{obj=SG.U.find(uni,id);}catch(e){SG.log.err('cosmos.find',e);}
      var kind=HUD.kindOf(id);if(!obj||!kind){sheet.hidden=true;return;}
      if(!keepOpen)st.result=null;
      var depth0=['g','s','p','m'].indexOf(kind)+1,same=depth0===HUD.SCALES.indexOf(st.scale);
      st.sheetOpen=true;sheet.hidden=false;sheet.classList.toggle('min',keepOpen?wasMin:same);
      var minNow=sheet.classList.contains('min');
      var lv=((uni.state&&uni.state.observed)||{})[id]||0;
      var head=h('div',{class:'h-sh-head'},
        h('div',{class:'grow'},h('h2',null,obj.name||id),h('div',{class:'row small mute'},h('span',{class:'chip tc'},KIND_TR[kind]),h('span',{class:'h-pips',role:'img','aria-label':'Gözlem düzeyi '+lv+' / 3'},[0,1,2].map(function(i){return h('i',{class:i<lv?'on':''});})),h('span',null,lv>=3?'Tam gözlendi':'Gözlem '+lv+' / 3'))),
        lv<3?h('button',{type:'button',class:'h-ibtn h-eye','aria-label':'Gözlemle',onclick:function(){observe(id);}},HUD.ic('eye',22)):null,
        h('button',{type:'button',class:'h-ibtn','aria-label':minNow?'Paneli genişlet':'Paneli küçült','aria-expanded':minNow?'false':'true',onclick:function(e){var min=sheet.classList.toggle('min');e.currentTarget.setAttribute('aria-expanded',min?'false':'true');e.currentTarget.setAttribute('aria-label',min?'Paneli genişlet':'Paneli küçült');e.currentTarget.firstChild.replaceWith(HUD.ic(min?'up':'down',22));inset();}},HUD.ic(minNow?'up':'down',22)),
        h('button',{type:'button',class:'h-ibtn','aria-label':'Paneli kapat',onclick:function(){st.sel=null;sheet.hidden=true;paintGoals();inset();}},HUD.ic('close',22)));
      sheet.appendChild(head);
      var body=h('div',{class:'h-sh-body'});
      /* kademeli bilgi */
      var list=h('dl',{class:'h-props'});var locked=0;
      (ROWS[kind]||[]).forEach(function(r){
        var val=obj[r[0]];if(val==null)return;
        if(r[2]>lv){locked++;return;}
        list.appendChild(h('div',{class:'h-prop'},h('dt',null,r[1]),h('dd',{class:'num'},r[3](val),' ',HUD.tagBadge(HUD.tagOf(r[0])))));
      });
      body.appendChild(list);
      if(locked>0||lv<3)body.appendChild(h('div',{class:'h-lock small mute'},HUD.ic('lock',16),h('span',null,lv<3?'Gözlemledikçe yeni bilgiler açılır. Henüz '+locked+' özellik gizli.':'')));
      /* düğmeler */
      var acts=h('div',{class:'h-actrow'});
      if(lv<3)acts.appendChild(btn('Gözlemle','',function(){observe(id);},'eye'));
      var depth=['g','s','p','m'].indexOf(kind)+1;
      if(kind!=='m'&&(depth>HUD.SCALES.indexOf(st.scale)||refId()!==id||true)&&!(st.focus===id&&HUD.SCALES.indexOf(st.scale)===depth))acts.appendChild(btn('Odaklan','ghost',function(){focusTo(id);},'target'));
      body.appendChild(acts);
      /* kararlar */
      var A=[];try{A=SG.Disc&&SG.Disc.actions?SG.Disc.actions(uni,id)||[]:[];}catch(e){SG.log.err('cosmos.actions',e);}
      if(A.length){
        body.appendChild(h('h3',{class:'h-sec'},'Kararlar'));
        if(lv<1)body.appendChild(h('div',{class:'small mute'},'Karar vermek için önce gözlemle.'));
        else A.forEach(function(a){
          body.appendChild(h('button',{type:'button',class:'h-act',onclick:function(){
            var res=null;try{res=SG.Disc.apply(uni,id,a.id);}catch(e){SG.log.err('cosmos.apply',e);}
            st.result=res||{ok:false,message:'Karar uygulanamadı.'};HUD.sound(st.result.ok?'unlock':'error');
            try{SG.S.save&&SG.S.save();}catch(e){}
            announce(live,st.result.message||'');openSheet(id,true);
          }},h('b',null,a.label),a.tag?HUD.tagBadge(a.tag):null,h('span',{class:'small mute'},a.desc||'')));
        });
        if(st.result){
          var rb=h('div',{class:'h-result '+(st.result.ok?'h-good':'h-poor'),role:'status'},h('b',null,st.result.message||''));
          if(st.result.effects&&st.result.effects.length){var ul=h('ul',{class:'h-fx'});st.result.effects.forEach(function(fx){ul.appendChild(fxText(fx));});rb.appendChild(h('div',{class:'tiny mute'},'Önce → Sonra'));rb.appendChild(ul);}
          body.appendChild(rb);
        }
      }
      sheet.appendChild(body);paintGoals();paintCrumbs();
      var rbn=body.querySelector('.h-result');
      if(rbn&&keepOpen&&!minNow){try{rbn.scrollIntoView({block:'nearest'});}catch(e){}}else if(pscroll){body.scrollTop=pscroll;}
      inset();
    }

    /* --- hedefler --- */
    function paintGoals(){
      goals.textContent='';
      var g=[];try{g=SG.Disc&&SG.Disc.goals?SG.Disc.goals(uni)||[]:[];}catch(e){}
      goals.hidden=!g.length||!sheet.hidden||!!st.onb;
      if(goals.hidden)return;
      var open=st.goalsOpen;
      goals.appendChild(h('button',{type:'button',class:'h-goals-h','aria-expanded':open?'true':'false',onclick:function(){st.goalsOpen=!st.goalsOpen;paintGoals();}},HUD.ic('spark',16),h('span',{class:'grow'},'Hedefler'),HUD.ic(open?'down':'up',16)));
      if(open){var ul=h('ul',null);g.slice(0,3).forEach(function(d){ul.appendChild(h('li',null,d.hint||d.title));});goals.appendChild(ul);}
    }

    /* --- liste modu --- */
    var listEl=null;
    function listItems(){
      var sc=st.scale,ref=refId();
      try{
        if(sc==='universe')return{title:'Galaksiler',items:uni.galaxies.map(function(g){return{id:g.id,name:g.name,sub:GKIND[g.kind]||''};})};
        if(sc==='galaxy'){var gid=HUD.idAtScale(ref,'galaxy');if(!gid)return null;var gx=SG.U.galaxy(uni,gid);return{title:'Yıldızlar',items:gx.stars.map(function(s){return{id:s.id,name:s.name,sub:'Sınıf '+s.cls+' · '+(PHASE[s.phase]||'')};})};}
        if(sc==='system'){var sid=HUD.idAtScale(ref,'system');if(!sid)return null;var sy=SG.U.system(uni,sid);var a=[{id:sy.star.id,name:sy.star.name,sub:'Yıldız · sınıf '+sy.star.cls}];sy.planets.forEach(function(p){a.push({id:p.id,name:p.name,sub:PTYPE[p.type]||''});});return{title:'Sistemdeki nesneler',items:a};}
        var pid=HUD.idAtScale(ref,'planet');if(!pid)return null;var pl=SG.U.find(uni,pid);var b=[{id:pid,name:pl.name,sub:'Gezegen'}];(pl.moons||[]).forEach(function(m){b.push({id:m.id,name:m.name,sub:'Uydu'});});return{title:'Gezegen ve uydular',items:b};
      }catch(e){SG.log.err('cosmos.listItems',e);return null;}
    }
    function openList(){
      closeList();var d=listItems();
      if(!d){announce(live,'Bu ölçekte listelenecek nesne yok.');return;}
      var q=h('input',{type:'search',class:'inp h-search',placeholder:'Ada göre ara','aria-label':'Nesnelerde ara'});
      var ul=h('ul',{class:'h-listul',role:'list'});
      function fill(){
        ul.textContent='';var t=(q.value||'').toLocaleLowerCase('tr'),n=0;
        d.items.forEach(function(it){
          if(t&&it.name.toLocaleLowerCase('tr').indexOf(t)<0)return;if(n>=80)return;n++;
          var lv=((uni.state&&uni.state.observed)||{})[it.id]||0;
          ul.appendChild(h('li',null,h('button',{type:'button',class:'h-li',onclick:function(){closeList();var k=HUD.kindOf(it.id),dep=['g','s','p','m'].indexOf(k)+1;if(dep>HUD.SCALES.indexOf(st.scale)&&k!=='m')focusTo(it.id);else{st.sel=it.id;try{R&&R.focus&&R.focus(it.id,{animate:!SG.RM});}catch(e){}openSheet(it.id);}}},
            h('span',{class:'grow'},h('b',null,it.name),h('span',{class:'small mute'},it.sub)),h('span',{class:'h-pips','aria-hidden':'true'},[0,1,2].map(function(i){return h('i',{class:i<lv?'on':''});})))));
        });
        if(!n)ul.appendChild(h('li',{class:'small mute',style:{padding:'12px'}},'Eşleşen nesne yok.'));
      }
      q.addEventListener('input',fill);fill();
      listEl=h('div',{class:'h-overlay',role:'dialog','aria-modal':'true','aria-label':d.title},
        h('div',{class:'h-ov-card'},h('div',{class:'row'},h('h2',{class:'grow'},d.title),h('button',{type:'button',class:'h-ibtn','aria-label':'Listeyi kapat',onclick:closeList},HUD.ic('close',22))),d.items.length>12?q:null,ul));
      view.appendChild(listEl);var f=listEl.querySelector('button');if(f)f.focus();
    }
    function closeList(){if(listEl&&listEl.parentNode)listEl.parentNode.removeChild(listEl);listEl=null;}

    /* --- fotoğraf modu --- */
    var prev=null;
    function photoMode(on){view.classList.toggle('photo',on);pbar.hidden=!on;if(on)announce(live,'Fotoğraf modu açık. Çek düğmesi ile kareyi kaydet.');else{closePrev();}}
    function closePrev(){if(prev&&prev.parentNode)prev.parentNode.removeChild(prev);prev=null;}
    function takePhoto(){
      if(!R||!R.photo){announce(live,'Fotoğraf şu an alınamıyor.');return;}
      Promise.resolve(R.photo({hud:false,w:1080,h:1920})).then(function(url){
        if(!st.alive||!url)return;closePrev();
        var img=h('img',{class:'h-shot',src:url,alt:'Evrenin fotoğrafı'});
        var msg=h('div',{class:'small mute',role:'status'},'Görüntüye uzun basarak da kaydedebilirsin.');
        var fname='spacegg-'+(uni.name||'evren').replace(/[^\wÇĞİÖŞÜçğıöşü-]+/g,'-')+'.png';
        var acts=h('div',{class:'row wrap2'});
        acts.appendChild(btn('İndir','sm',function(){try{var a=h('a',{href:url,download:fname});document.body.appendChild(a);a.click();a.remove();msg.textContent='İndirme başlatıldı.';}catch(e){msg.textContent='İndirilemedi. Görüntüye uzun bas.';}},'down2'));
        if(navigator.share)acts.appendChild(btn('Paylaş','sm ghost',function(){
          try{fetch(url).then(function(r){return r.blob();}).then(function(b){var f=new File([b],fname,{type:'image/png'});var d={files:[f],title:'SpacEgg',text:(uni.name||'Evrenim')+' — SpacEgg'};if(navigator.canShare&&!navigator.canShare(d))d={title:'SpacEgg',text:(uni.name||'Evrenim')+' — SpacEgg'};return navigator.share(d);}).catch(function(){msg.textContent='Paylaşım iptal edildi.';});}catch(e){msg.textContent='Paylaşılamadı.';}
        },'share'));
        acts.appendChild(btn('Kapat','sm ghost',closePrev,'close'));
        prev=h('div',{class:'h-overlay h-prev',role:'dialog','aria-modal':'true','aria-label':'Fotoğraf önizleme'},h('div',{class:'h-ov-card'},img,acts,msg));
        view.appendChild(prev);HUD.sound('unlock');
      }).catch(function(e){SG.log.err('cosmos.photo',e);announce(live,'Fotoğraf alınamadı.');});
    }

    /* --- olaylar --- */
    st.offs.push(SG.bus.on('u:event',function(ev){
      if(!st.alive||!ev)return;var now=Date.now();
      var sev=ev.severity||1;
      if(uni.speedIx>=3&&sev<2)return;
      if(now-st.lastToast<2500&&sev<3)return;st.lastToast=now;
      try{SG.A2&&SG.A2.event(ev.type);}catch(e){}
      HUD.toast(toasts,{icon:EVICON[ev.type]||'spark',title:HUD.cosmic(ev.t)+' ·',text:ev.text||ev.type,cls:'sev'+sev,onTap:ev.target?function(){focusTo(ev.target);}:null});
    }));
    st.offs.push(SG.bus.on('disc:unlock',function(d){
      if(!st.alive||!d)return;HUD.sound('unlock');
      HUD.toast(toasts,{icon:'star',title:'Keşif:',text:d.title||'',cls:'disc',ms:6000});paintGoals();
    }));
    st.offs.push(SG.bus.on('p:tier',function(n){try{R&&R.setQuality&&R.setQuality(n);}catch(e){}}));
    st.offs.push(SG.bus.on('prefs',function(){try{R&&R.setReducedMotion&&R.setReducedMotion(!!SG.RM);}catch(e){}}));

    /* --- simülasyon döngüsü: kozmik zaman, keşif denetimi, otomatik kayıt --- */
    SG.loop.add('cosmos-sim',function(dt){
      if(!st.alive||st.paused)return;
      var sp=(SG.U&&SG.U.SPEEDS?SG.U.SPEEDS[uni.speedIx==null?1:uni.speedIx]:0)||0;
      if(sp>0){try{SG.U.step(uni,dt*sp);}catch(e){SG.log.err('cosmos.step',e);}}
      st.acc+=dt;
      if(st.acc>=.25){st.acc=0;var tx=HUD.cosmic(uni.t);if(tx!==st.lastTime){st.lastTime=tx;timeTx.textContent=tx;}}
      st.discT+=dt;if(st.discT>=1){st.discT=0;try{SG.Disc&&SG.Disc.check&&SG.Disc.check(uni);}catch(e){}}
      try{SG.S&&SG.S.autosave&&SG.S.autosave(dt);}catch(e){}
    });
    function onP(){st.paused=true;try{R&&R.pause&&R.pause();}catch(e){}try{SG.S&&SG.S.save&&SG.S.save();}catch(e){}try{SG.A2&&SG.A2.stop&&SG.A2.stop();}catch(e){}}
    function onR(){st.paused=false;try{R&&R.resume&&R.resume();}catch(e){}try{SG.A2&&SG.A2.start&&SG.A2.start();}catch(e){}}
    function onKey(e){
      if(e.key==='Escape'){if(prev){closePrev();return;}if(listEl){closeList();return;}if(view.classList.contains('photo')){photoMode(false);return;}if(!sheet.hidden&&st.sel){st.sel=null;sheet.hidden=true;paintGoals();return;}up();}
    }
    var onRes=function(){try{R&&R.resize&&R.resize();}catch(e){}};
    window.addEventListener('sg-pause',onP);window.addEventListener('sg-resume',onR);window.addEventListener('resize',onRes);document.addEventListener('keydown',onKey);
    st.cleanup=function(){window.removeEventListener('sg-pause',onP);window.removeEventListener('sg-resume',onR);window.removeEventListener('resize',onRes);document.removeEventListener('keydown',onKey);};
    if(window.ResizeObserver){try{st.ro=new ResizeObserver(onRes);st.ro.observe(cv);}catch(e){}}

    bUp.hidden=true;crumbs.hidden=true;paintGoals();
    try{SG.A2&&SG.A2.start&&SG.A2.start();SG.A2&&SG.A2.setScale('universe');SG.A2&&SG.A2.setSpeed(uni.speedIx);}catch(e){}
    if(HUD.needsOnboarding()){st.onb=HUD.onboarding(view,{targets:['.h-canvas','.h-speed','.h-canvas','.h-nav'],onDone:function(){st.onb=null;paintGoals();}});paintGoals();}
    if(params&&params.focus)setTimeout(function(){if(st.alive)focusTo(params.focus);},60);
  },
  unmount:function(){
    var st=this._st;if(!st)return;st.alive=false;
    try{SG.loop.remove('cosmos-sim');}catch(e){}
    st.offs.forEach(function(f){try{f();}catch(e){}});st.cleanup&&st.cleanup();
    if(st.ro){try{st.ro.disconnect();}catch(e){}}
    try{st.r&&st.r.destroy&&st.r.destroy();}catch(e){}
    try{SG.S&&SG.S.save&&SG.S.save();}catch(e){}
    try{SG.A2&&SG.A2.stop&&SG.A2.stop();}catch(e){}
    this._st=null;
  }
});

/* =========================== JOURNAL =========================== */
SG.view('journal',{
  mount:function(root){
    var uni=HUD.uni();var w=page(root,T('journal.title','Günlük'),uni?uni.name:'',"journal");
    if(!uni){w.appendChild(h('div',{class:'card'},h('p',null,'Henüz bir evrenin yok.'),btn('Evren yarat','block',function(){SG.go('create');},'spark')));return;}
    var tab='history';
    var body=h('div');
    var seg=HUD.seg({label:'Günlük bölümleri',value:tab,items:[{v:'history',label:'Tarihçe'},{v:'disc',label:'Keşifler'},{v:'badge',label:'Rozetler'}],onChange:function(v){tab=v;paint();}});
    w.appendChild(seg);w.appendChild(body);
    function prog(){try{return SG.Disc.progress(uni);}catch(e){return{done:0,total:0,byCat:{}};}}
    function paint(){
      body.textContent='';
      if(tab==='history'){
        var j=((uni.state&&uni.state.journal)||[]).slice().sort(function(a,b){return(b.t||0)-(a.t||0);}).slice(0,100);
        body.appendChild(h('h2',null,'Kozmik tarihçe'));
        if(!j.length){body.appendChild(h('div',{class:'card flat'},h('p',{class:'mute'},T('journal.empty','Henüz kayda değer bir olay yok. Zamanı hızlandır; evrenin hikâyesi kendiliğinden yazılır.'))));return;}
        var ol=h('ol',{class:'h-tl'});
        j.forEach(function(e){
          var li=h('li',{class:'h-tl-i'},h('span',{class:'h-tl-dot','aria-hidden':'true'},HUD.ic(EVICON[e.kind]||'spark',16)),
            h('div',{class:'grow'},h('div',{class:'tiny mute num'},HUD.cosmic(e.t)),h('div',null,e.text||e.kind)));
          if(e.target)li.appendChild(h('button',{type:'button',class:'h-ibtn','aria-label':'Olay yerine git: '+(e.text||''),onclick:function(){SG.go('cosmos',{focus:e.target});}},HUD.ic('target',20)));
          ol.appendChild(li);
        });body.appendChild(ol);
      }else if(tab==='disc'){
        var p=prog(),pc=p.total?Math.round(p.done/p.total*100):0;
        body.appendChild(h('h2',null,'Keşifler'));
        body.appendChild(h('div',{class:'card'},h('div',{class:'row'},h('b',{class:'grow'},p.done+' / '+p.total+' keşif'),h('span',{class:'mute num'},'%'+pc)),h('div',{class:'bar',role:'progressbar','aria-valuemin':'0','aria-valuemax':String(p.total),'aria-valuenow':String(p.done),'aria-label':'Keşif ilerlemesi'},h('i',{style:{width:pc+'%'}}))));
        var L=[];try{L=SG.Disc.list()||[];}catch(e){}
        var cats={};L.forEach(function(d){(cats[d.cat||'Diğer']=cats[d.cat||'Diğer']||[]).push(d);});
        Object.keys(cats).forEach(function(c){
          var bc=(p.byCat&&p.byCat[c])||{done:0,total:cats[c].length};
          body.appendChild(h('h2',null,c+' ',h('span',{class:'mute small num'},bc.done+'/'+bc.total)));
          cats[c].forEach(function(d){
            var t=uni.state&&uni.state.disc&&uni.state.disc[d.id];
            body.appendChild(t?h('div',{class:'card h-disc'},HUD.ic('star',20),h('div',{class:'grow'},h('b',null,d.title),h('div',{class:'small'},d.desc),h('div',{class:'tiny mute'},HUD.when(t)))):
              h('div',{class:'card flat h-disc locked'},HUD.ic('lock',20),h('div',{class:'grow'},h('b',null,'Kilitli keşif'),h('div',{class:'small mute'},d.hint||'Evreni keşfetmeye devam et.'))));
          });
        });
      }else{
        var p2=prog(),cs=Object.keys(p2.byCat||{});
        body.appendChild(h('h2',null,'Rozetler'));
        if(!cs.length)body.appendChild(h('div',{class:'card flat'},h('p',{class:'mute'},'Rozetler keşiflerle açılır.')));
        var gr=h('div',{class:'grid2'});
        cs.forEach(function(c){
          var b=p2.byCat[c],f=b.total?b.done/b.total:0;
          var tier=f>=1?'Usta':f>=2/3?'Kaşif':f>=1/3?'Gözlemci':null;
          gr.appendChild(h('div',{class:'card h-badge'+(tier?' on':''),role:'group','aria-label':c+' rozeti: '+(tier||'henüz yok')},HUD.ic(tier?'star':'lock',28),h('b',null,c),h('span',{class:'small '+(tier?'':'mute')},tier||('Kilitli · '+b.done+'/'+b.total))));
        });body.appendChild(gr);
      }
    }
    paint();
  }
});

/* =========================== SAVES =========================== */
SG.view('saves',{
  mount:function(root){
    var w=page(root,T('saves.title','Kayıtlar'),'Evrenlerin burada saklanır','saves');
    var st=this._st={timer:null,bk:null,exp:null};
    var body=h('div');
    function status(){try{var s=SG.S.status&&SG.S.status();if(s&&s.msg)return h('div',{class:'h-banner '+(s.ok?'h-b-ok':'h-b-warn'),role:'status'},HUD.ic(s.ok?'check':'warn',18),h('span',null,s.msg));}catch(e){}return null;}
    function paint(){
      body.textContent='';var sb=status();if(sb)body.appendChild(sb);
      var list=[];try{list=SG.S.list()||[];}catch(e){SG.log.err('saves.list',e);}
      var act=HUD.uni();
      body.appendChild(btn('Yeni evren yarat','block',function(){SG.go('create');},'plus'));
      body.appendChild(h('h2',null,'Evrenlerim ('+list.length+')'));
      if(!list.length)body.appendChild(h('div',{class:'card flat'},h('p',{class:'mute'},'Henüz kayıtlı evren yok.')));
      list.forEach(function(s){body.appendChild(card(s,act&&act.id===s.id));});
      if(st.exp)body.appendChild(exportBox());
      body.appendChild(h('h2',null,'İçe aktar'));
      var ta=h('textarea',{class:'inp h-ta',rows:'4',placeholder:'SGU2: ile başlayan yedek metnini buraya yapıştır','aria-label':'İçe aktarılacak yedek metni',spellcheck:'false'});
      var msg=h('div',{class:'small',role:'status'});
      body.appendChild(h('div',{class:'card'},ta,h('div',{style:{height:'8px'}}),btn('İçe aktar','block ghost',function(){
        var t=(ta.value||'').trim();if(!t){msg.textContent='Önce yedek metnini yapıştır.';return;}
        var r=null;try{r=SG.S.importText(t);}catch(e){SG.log.err('saves.import',e);}
        if(r&&r.ok){HUD.sound('unlock');paint();}else{HUD.sound('error');msg.className='small h-bad';msg.textContent=(r&&r.error)||'İçe aktarılamadı.';}
      },'down2'),msg));
    }
    function card(s,isAct){
      var c=h('div',{class:'card h-save'+(isAct?' h-open':'')});
      var nm=h('b',{class:'h-sv-name'},s.name||'Adsız evren');
      var head=h('div',{class:'row'},h('div',{class:'grow'},nm,h('div',{class:'small mute num'},HUD.cosmic(s.t)+' · Tohum '+s.seed)),isAct?h('span',{class:'chip tc'},'Açık'):null);
      c.appendChild(head);
      c.appendChild(h('div',{class:'tiny mute'},'Kaydedildi: '+HUD.when(s.saved)+' · '+HUD.bytes(s.bytes)));
      var row=h('div',{class:'row wrap2 h-btns'});
      row.appendChild(btn(isAct?'Devam et':'Aç','sm',function(){var u=null;try{u=SG.S.open(s.id);}catch(e){SG.log.err('saves.open',e);}if(u)SG.go('cosmos');else{HUD.sound('error');}},'globe'));
      row.appendChild(btn('Adlandır','sm ghost',function(){
        var inp=h('input',{class:'inp',type:'text',maxlength:'28',value:s.name||'','aria-label':'Yeni ad'});
        var ok=btn('Kaydet','sm',function(){var v=(inp.value||'').trim();if(v){try{SG.S.rename(s.id,v);}catch(e){}}paint();},'check');
        var no=btn('Vazgeç','sm ghost',paint,'close');
        head.firstChild.replaceChild(inp,nm);row.textContent='';row.appendChild(ok);row.appendChild(no);inp.focus();inp.select();
      },'edit'));
      row.appendChild(btn('Dışa aktar','sm ghost',function(){var t='';try{t=SG.S.exportText(s.id)||'';}catch(e){SG.log.err('saves.export',e);}st.exp={id:s.id,name:s.name,text:t};paint();},'share'));
      var del=btn('Sil','sm danger',function(){
        if(del._arm){try{SG.S.remove(s.id);}catch(e){}HUD.sound('close');paint();return;}
        del._arm=true;del.lastChild.textContent='Emin misin? Sil';del.setAttribute('aria-label','Silmeyi onayla');clearTimeout(del._t);del._t=setTimeout(function(){del._arm=false;del.lastChild.textContent='Sil';del.removeAttribute('aria-label');},4000);
      },'trash');
      row.appendChild(del);c.appendChild(row);
      /* yedekler */
      var bkBox=h('div',{class:'h-bk',hidden:'hidden'});
      var bt=h('button',{type:'button',class:'h-link','aria-expanded':'false',onclick:function(e){
        var open=bkBox.hidden;bkBox.hidden=!open;e.currentTarget.setAttribute('aria-expanded',open?'true':'false');
        if(open){bkBox.textContent='';var b=[];try{b=SG.S.backups(s.id)||[];}catch(er){}
          if(!b.length)bkBox.appendChild(h('div',{class:'small mute'},'Bu evren için yedek yok.'));
          b.forEach(function(k){var rb=btn('Geri yükle','sm ghost',function(){
            if(!rb._arm){rb._arm=true;rb.lastChild.textContent='Onayla: şimdiki durum yedeğin yerine geçer';return;}
            var u=null;try{u=SG.S.restore(s.id,k.ix);}catch(er2){SG.log.err('saves.restore',er2);}
            rb._arm=false;if(u){HUD.sound('unlock');paint();}else{HUD.sound('error');rb.lastChild.textContent='Geri yüklenemedi';}
          },'clock');
          bkBox.appendChild(h('div',{class:'row h-bkr'},h('div',{class:'grow small'},'Yedek '+(k.ix+1),h('span',{class:'mute'},' · '+HUD.when(k.saved)+' · '+HUD.cosmic(k.t))),rb));});}
      }},'Yedekler');
      c.appendChild(bt);c.appendChild(bkBox);return c;
    }
    function exportBox(){
      var ta=h('textarea',{class:'inp h-ta',rows:'5',readonly:'readonly','aria-label':'Yedek metni',spellcheck:'false'});ta.value=st.exp.text;
      var msg=h('div',{class:'small',role:'status'});
      return h('div',{class:'card h-export'},h('div',{class:'row'},h('b',{class:'grow'},'Yedek: '+(st.exp.name||'evren')),h('button',{type:'button',class:'h-ibtn','aria-label':'Yedek kutusunu kapat',onclick:function(){st.exp=null;paint();}},HUD.ic('close',22))),
        h('p',{class:'small mute'},'Bu metni güvenli bir yere kaydet. Başka cihazda İçe aktar ile evrenini geri getirirsin.'),ta,h('div',{style:{height:'8px'}}),
        btn('Panoya kopyala','block',function(){HUD.copy(ta.value,ta).then(function(ok){msg.className='small '+(ok?'h-ok':'h-bad');msg.textContent=ok?'Kopyalandı.':'Kopyalanamadı. Metni seçip elle kopyala.';});},'copy'),msg);
    }
    w.appendChild(body);paint();
  },
  unmount:function(){this._st=null;}
});

/* =========================== PREFS =========================== */
SG.view('prefs',{
  mount:function(root){
    var w=page(root,T('prefs.title','Ayarlar'),'Erişilebilirlik, ses ve kalite','prefs');
    var st=this._st={timer:null};
    function sw(label,desc,get,set){
      var on=get();var b=h('button',{type:'button',class:'h-sw',role:'switch','aria-checked':on?'true':'false','aria-label':label,onclick:function(){on=!on;b.setAttribute('aria-checked',on?'true':'false');set(on);HUD.sound('tap');}},h('i',null));
      return h('div',{class:'h-setrow'},h('div',{class:'grow'},h('b',null,label),h('div',{class:'small mute'},desc)),b);
    }
    /* erişilebilirlik */
    w.appendChild(h('h2',null,'Erişilebilirlik'));
    w.appendChild(h('div',{class:'card'},
      sw('Hareketi azalt','Parçacıkları ve sürekli hareketi kapatır, geçişleri kısaltır.',function(){return HUD.prefs.rm();},function(v){HUD.setRM(v);}),
      sw('Yüksek kontrast','Metin ve çizgileri belirginleştirir.',function(){return HUD.prefs.hc();},function(v){HUD.setHC(v);}),
      h('div',{class:'h-setrow col'},h('b',null,'Yazı boyutu'),HUD.seg({label:'Yazı boyutu',value:HUD.prefs.ts(),items:[{v:1,label:'%100'},{v:1.25,label:'%125'},{v:1.5,label:'%150'}],onChange:function(v){HUD.setTS(v);}}))));
    /* ses */
    w.appendChild(h('h2',null,'Ses'));
    var muted=!!SG.store.get('mute',false);
    function slider(label,key,def){var val=SG.store.get('vol_'+key,def);var sp=h('span',null,label+' · %'+Math.round(val*100));
      return h('label',{class:'fld'},sp,h('input',{class:'sl',type:'range',min:'0',max:'100',value:Math.round(val*100),'aria-label':label,oninput:function(e){var x=e.target.value/100;SG.store.set('vol_'+key,x);sp.textContent=label+' · %'+Math.round(x*100);try{SG.A&&SG.A.setVol&&SG.A.setVol(key,x);}catch(er){}}}));}
    var mb=btn(muted?'Sesi aç':'Sesi kapat','ghost block',function(){muted=!muted;SG.store.set('mute',muted);try{SG.A&&SG.A.mute&&SG.A.mute(muted);}catch(e){}mb.lastChild.textContent=muted?'Sesi aç':'Sesi kapat';HUD.sound('tap');});
    w.appendChild(h('div',{class:'card'},slider('Genel ses','master',.8),slider('Müzik','music',.26),slider('Efektler','fx',.8),mb));
    /* kalite */
    w.appendChild(h('h2',null,'Kalite'));
    var q=SG.store.get('q2','auto');
    var info=h('div',{class:'small mute num',role:'status'});
    function qinfo(){try{var t=SG.P.tier(),n=['Düşük','Orta','Yüksek'][t]||'—';info.textContent='Şu an: '+n+' · '+HUD.n(SG.P.fps(),0)+' FPS'+(q==='auto'?' (otomatik)':'');}catch(e){info.textContent='';}}
    w.appendChild(h('div',{class:'card'},HUD.seg({label:'Grafik kalitesi',value:q,items:[{v:'auto',label:'Otomatik'},{v:0,label:'Düşük'},{v:1,label:'Orta'},{v:2,label:'Yüksek'}],onChange:function(v){q=v;SG.store.set('q2',v);try{SG.P.setTier(v);}catch(e){SG.log.err('prefs.tier',e);}qinfo();}}),
      h('div',{style:{height:'8px'}}),info,h('p',{class:'tiny mute',style:{marginTop:'6px'}},'Düşük kalite pili ve ısıyı korur. Otomatik, cihazına göre seçer.')));
    qinfo();st.timer=setInterval(qinfo,1500);
    /* diğer */
    w.appendChild(h('h2',null,'Diğer'));
    w.appendChild(h('div',{class:'card'},
      btn('Başlangıç rehberini yeniden göster','ghost block',function(){HUD.resetOnboarding();SG.go(HUD.uni()?'cosmos':'create');},'spark'),
      h('div',{style:{height:'8px'}}),
      btn('Eski SpacEgg’i aç (v1)','ghost block',function(){SG.go('hub');},'globe'),
      h('p',{class:'tiny mute',style:{marginTop:'6px'}},'Önceki gezegen büyütme oyunun olduğu gibi duruyor.')));
    w.appendChild(h('div',{class:'card flat'},btn('Çıkış yap','danger block',function(){try{SG.S&&SG.S.save&&SG.S.save();}catch(e){}try{SG.G.logout();}catch(e){SG.go('login');}},'exit'),
      h('p',{class:'tiny mute',style:{marginTop:'8px',textAlign:'center'}},'SpacEgg '+(SG.ver||'2.0'))));
  },
  unmount:function(){var st=this._st;if(st)clearInterval(st.timer);this._st=null;}
});

HUD.applyQuality=function(){try{var q=SG.store.get('q2','auto');if(q!=='auto'&&SG.P&&SG.P.setTier)SG.P.setTier(q);}catch(e){}};
})();
