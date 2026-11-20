/* SpacEgg 2.0 — kayıt sistemi (SG.S)
   Sürümlü, kullanıcıya ayrık, 3 dönüşümlü yedekli, sağlama toplamlı kayıt. Ayrıntı: docs/KAYIT-SISTEMI.md */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var SCHEMA=2,ENV=1,MAXUNI=1500000,MAXTEXT=2*1024*1024,MAXLIST=24,NB=3,BK_GAP=90000,AUTO=20;
var ID=/^[A-Za-z0-9_-]{1,40}$/,KEY=/^[A-Za-z0-9_-]{1,40}$/;
var PRESETS=['sakin','yogun','seyrek'],KINDS=['spiral','barred','elliptical','irregular'];
var user=null,store=null,A=null,IDX=null,triedAct=false,acc=0,lastSum={},lastBk={},inited=false;
var mem={};                                  // yazılamayan kayıtların bellek yedeği
var msgs={mem:'',rec:'',conf:'',err:''};
var extra={};                                // modüllerin kaydettiği ek state anahtarları

/* ---------- yardımcılar ---------- */
function bad(k){return k==='__proto__'||k==='constructor'||k==='prototype';}
function hasOwn(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
function fnv(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function sum(s){var h=SG.hash?SG.hash(s):fnv(s);return h.toString(36)+'.'+s.length.toString(36);}
function num(v,lo,hi,d){return(typeof v==='number'&&isFinite(v))?(v<lo?lo:v>hi?hi:v):d;}
function int(v,lo,hi,d){var n=num(v,lo,hi,null);return n==null?d:Math.round(n);}
function str(v,max){if(typeof v!=='string')return'';return v.replace(/[\u0000-\u001f\u007f\u2028\u2029]/g,' ').slice(0,max);}
function nameOf(v){return str(v,40).replace(/[<>]/g,'').replace(/\s+/g,' ').trim();}
function now(){return Date.now();}
var lastStamp=0;function stamp(){var n=now();if(n<=lastStamp)n=lastStamp+1;return(lastStamp=n);}   // artan zaman damgası: aynı milisaniyede bile yedek sırası bozulmaz
function okId(id){return typeof id==='string'&&ID.test(id)&&!bad(id);}
function okKey(k){return typeof k==='string'&&KEY.test(k)&&!bad(k);}
function isObj(o){return o&&typeof o==='object'&&!Array.isArray(o);}
function clone(v){try{return JSON.parse(JSON.stringify(v),function(k,x){return bad(k)?undefined:x;});}catch(e){return undefined;}}
function enc(n){n=String(n).trim();var h='';if(n.length>40){h='~'+fnv(n).toString(36);n=n.slice(0,40);}return n.replace(/[^A-Za-z0-9]/g,function(c){return'_'+c.charCodeAt(0).toString(16)+'_';})+h;}
function P(){return user==null?null:'sg2_'+enc(user)+'_';}
function kMain(id){return P()+'u_'+id;}
function kBk(id,i){return P()+'b_'+id+'_'+i;}
function setErr(m){msgs.err=m;try{SG.bus&&SG.bus.emit('s:status',status());}catch(e){}}
function warn(k,m){msgs[k]=m;try{SG.bus&&SG.bus.emit('s:status',status());}catch(e){}}

/* ---------- depolama katmanı (localStorage + bellek yedeği) ---------- */
function probe(){try{var s=window.localStorage;var k='sg2__probe';s.setItem(k,'1');s.removeItem(k);return s;}catch(e){return null;}}
function hasMem(){for(var k in mem)if(hasOwn(mem,k))return true;return false;}
function rawGet(k){if(hasOwn(mem,k))return mem[k];if(!store)return null;try{return store.getItem(k);}catch(e){return null;}}
function rawSet(k,v){
  if(store){try{store.setItem(k,v);if(hasOwn(mem,k)){delete mem[k];if(!hasMem()&&store)msgs.mem='';}return true;}catch(e){}}
  mem[k]=v;
  warn('mem',store?'Cihaz belleği dolu: kayıt yalnız bu oturumda tutuluyor. Evreni dışa aktar.':'Bu cihazda kalıcı depolama yok: kayıt yalnız bu oturumda tutuluyor. Evreni dışa aktar.');
  return false;
}
function rawDel(k){delete mem[k];if(store){try{store.removeItem(k);}catch(e){}}}
function rawKeys(prefix){
  var out=[],seen={},k,i;
  for(k in mem)if(hasOwn(mem,k)&&k.indexOf(prefix)===0&&!seen[k]){seen[k]=1;out.push(k);}
  if(store){try{for(i=0;i<store.length;i++){k=store.key(i);if(k&&k.indexOf(prefix)===0&&!seen[k]){seen[k]=1;out.push(k);}}}catch(e){}}
  return out;
}

/* ---------- şema, göç, doğrulama ---------- */
var MIG={
  1:function(u){u.v=2;if(!isObj(u.state))u.state={};return u;},                 // v1 → v2
  2:function(u){u.v=3;if(!isObj(u.state))u.state={};if(!isObj(u.state.seen))u.state.seen={};return u;} // v2 → v3 (örnek/test iskeleti)
};
function migrate(u,target){
  target=target||SCHEMA;
  if(!isObj(u))return null;
  var v=typeof u.v==='number'&&isFinite(u.v)?Math.floor(u.v):1;
  if(v<1||v>target)return null;                   // geçersiz ya da bu uygulamadan yeni sürüm
  while(v<target){var f=MIG[v];if(!f)return null;u=f(u);v=u.v;}
  return u;
}
function shapeMap(src,cap,fn){var out={},n=0;if(!isObj(src))return out;for(var k in src){if(!hasOwn(src,k)||!okKey(k))continue;if(n>=cap)break;var v=fn(src[k]);if(v===undefined)continue;out[k]=v;n++;}return out;}
function shapeList(src,cap,fn){var out=[];if(!Array.isArray(src))return out;for(var i=0;i<src.length&&out.length<cap;i++){var v=fn(src[i]);if(v!==undefined)out.push(v);}return out;}
function shapeGalaxies(src){
  return shapeList(src,12,function(g){
    if(!isObj(g)||typeof g.id!=='string'||!/^g\d{1,3}$/.test(g.id))return undefined;
    return{id:g.id,name:nameOf(g.name)||g.id,kind:KINDS.indexOf(g.kind)>=0?g.kind:'irregular',x:num(g.x,-1,1,0),y:num(g.y,-1,1,0),
      r:num(g.r,0.01,0.5,0.1),rot:num(g.rot,-1000,1000,0),hue:num(g.hue,0,360,200),arms:int(g.arms,0,12,2),starCount:int(g.starCount,0,5000,300)};
  });
}
function shapeState(s,strict){
  s=isObj(s)?s:{};
  var st={};
  st.observed=shapeMap(s.observed,5000,function(v){return int(v,0,3,undefined);});
  st.params=shapeMap(s.params,1000,function(p){
    if(!isObj(p))return undefined;var o={},n=0;
    for(var k in p){if(!hasOwn(p,k)||!/^[a-z][A-Za-z]{0,15}$/.test(k)||bad(k)||n>=12)continue;var x=num(p[k],-1000,1000,undefined);if(x===undefined)continue;o[k]=x;n++;}
    return o;});
  st.decisions=shapeList(s.decisions,500,function(d){
    if(!isObj(d)||typeof d.target!=='string'||!okId(d.target)||typeof d.action!=='string'||!/^[A-Za-z0-9_.-]{1,64}$/.test(d.action))return undefined;
    return{t:num(d.t,0,1e9,0),target:d.target,action:d.action};});
  st.disc=shapeMap(s.disc,2000,function(v){return num(v,0,1e15,undefined);});
  st.events=shapeList(s.events,100,function(e){
    if(!isObj(e))return undefined;
    return{id:str(e.id,64),type:/^[a-z][a-z-]{0,23}$/.test(e.type)?e.type:'event',t:num(e.t,0,1e9,0),target:str(e.target,40),galaxy:str(e.galaxy,16),
      severity:int(e.severity,1,3,1),text:str(e.text,300)};});
  st.journal=shapeList(s.journal,500,function(j){
    if(!isObj(j))return undefined;
    return{t:num(j.t,0,1e15,0),kind:/^[a-z][a-z-]{0,23}$/.test(j.kind)?j.kind:'note',text:str(j.text,400),target:str(j.target,40)};});
  // modüllerin ek alanları: yalnız kendi verisi (JSON, ≤300 KB). Güvenilir kaynakta (strict=false) bilinmeyen anahtarlar da korunur.
  for(var k in s){
    if(!hasOwn(s,k)||bad(k)||hasOwn(st,k)||!/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(k))continue;
    if(strict&&!extra[k])continue;
    var c=clone(s[k]);if(c===undefined)continue;
    try{if(JSON.stringify(c).length>300000)continue;}catch(e){continue;}
    st[k]=c;
  }
  return st;
}
/* strict=true: güvenilmeyen girdi (içe aktarma) — yalnız bilinen alanlar, galaksiler tohumdan yeniden üretilir */
function shape(u,strict){
  if(!isObj(u))return null;
  var v=int(u.v,1,SCHEMA,null);if(v==null)return null;
  var seed=str(u.seed,64).trim();if(!seed)return null;
  var o={};
  if(!strict){for(var k in u){if(hasOwn(u,k)&&!bad(k)&&/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(k))o[k]=clone(u[k]);}}
  o.v=v;o.id=okId(u.id)?u.id:'';o.name=nameOf(u.name)||'Evren';o.seed=seed;
  o.preset=PRESETS.indexOf(u.preset)>=0?u.preset:'sakin';
  o.t=num(u.t,0,1e7,0);o.speedIx=int(u.speedIx,0,4,1);o.created=num(u.created,0,4e12,now());
  var g=null;
  if(strict||!Array.isArray(u.galaxies)){
    if(SG.U&&SG.U.gen){try{var gen=SG.U.gen(seed,{preset:o.preset,name:o.name});if(gen&&Array.isArray(gen.galaxies))g=shapeGalaxies(gen.galaxies);}catch(e){SG.log&&SG.log.err('S.shape.gen',e);}}
    if(!g)g=shapeGalaxies(u.galaxies);
  }else g=shapeGalaxies(u.galaxies);
  o.galaxies=g;
  o.state=shapeState(u.state,strict);
  return o;
}

/* ---------- paketleme ---------- */
function pack(u){
  var d;try{d=JSON.stringify(u);}catch(e){return null;}
  if(!d||d.length>MAXUNI)return null;
  var s=sum(d);
  return{d:d,sum:s,env:JSON.stringify({f:ENV,v:u.v,sum:s,saved:stamp(),t:u.t,d:d})};
}
function parseEnv(raw){
  if(typeof raw!=='string'||raw.length>MAXUNI+2000)return null;
  try{var e=JSON.parse(raw);if(isObj(e)&&e.f===ENV&&typeof e.d==='string'&&e.sum===sum(e.d))return e;}catch(x){}
  return null;
}
function unpack(raw){
  var e=parseEnv(raw);if(!e)return{err:'sağlama/biçim'};
  var u;try{u=JSON.parse(e.d);}catch(x){return{err:'json'};}
  u=migrate(u);if(!u)return{err:'sürüm'};
  u=shape(u,false);if(!u||!okId(u.id))return{err:'alan'};
  return{uni:u,saved:typeof e.saved==='number'?e.saved:0,sum:e.sum,bytes:raw.length};
}

/* ---------- indeks ---------- */
function meta(u,saved,bytes){return{id:u.id,name:u.name,seed:u.seed,t:u.t,saved:saved||now(),bytes:bytes||0};}
function bkList(id){
  var out=[];
  for(var i=0;i<NB;i++){var raw=rawGet(kBk(id,i));if(raw==null)continue;var e=parseEnv(raw);out.push({ix:i,saved:e?(typeof e.saved==='number'?e.saved:0):-1,t:e?e.t:0,raw:raw,valid:!!e});}
  return out;
}
function rebuildIdx(){
  var p=P(),ids={},out=[],keys=rawKeys(p+'u_').concat(rawKeys(p+'b_')),i;
  for(i=0;i<keys.length;i++){
    var rest=keys[i].slice(p.length),m=/^u_([A-Za-z0-9_-]{1,40})$/.exec(rest)||/^b_([A-Za-z0-9_-]{1,40})_[0-9]$/.exec(rest);
    if(m&&okId(m[1]))ids[m[1]]=1;
  }
  for(var id in ids){
    var r=unpack(rawGet(kMain(id))),best=r.uni?r:null;
    if(!best){var bl=bkList(id).sort(function(a,b){return b.saved-a.saved;});for(var j=0;j<bl.length&&!best;j++){var rr=unpack(bl[j].raw);if(rr.uni)best=rr;}}
    if(best)out.push(meta(best.uni,best.saved,best.bytes));
  }
  IDX=out;writeIdx();return out;
}
function loadIdx(){
  if(IDX)return IDX;
  if(!P())return(IDX=[]);
  var raw=rawGet(P()+'idx'),a=null;
  if(raw!=null){try{a=JSON.parse(raw);}catch(e){a=null;}}
  if(Array.isArray(a)){
    var ok=true,out=[];
    for(var i=0;i<a.length;i++){var m=a[i];if(!isObj(m)||!okId(m.id)){ok=false;break;}out.push({id:m.id,name:nameOf(m.name)||'Evren',seed:str(m.seed,64),t:num(m.t,0,1e7,0),saved:num(m.saved,0,4e12,0),bytes:num(m.bytes,0,1e8,0)});}
    if(ok)return(IDX=out);
  }
  if(raw==null&&rawKeys(P()+'u_').length===0&&rawKeys(P()+'b_').length===0)return(IDX=[]);
  return rebuildIdx();
}
function writeIdx(){if(P()&&IDX)rawSet(P()+'idx',JSON.stringify(IDX));}
function touch(m){loadIdx();for(var i=0;i<IDX.length;i++)if(IDX[i].id===m.id){IDX[i]=m;return;}IDX.push(m);}
function newId(){loadIdx();var id;do{id='u'+(SG.uid?SG.uid():fnv(String(now()+Math.random())).toString(36));id=id.replace(/[^A-Za-z0-9_-]/g,'').slice(0,40);}while(!okId(id)||IDX.some(function(m){return m.id===id;})||rawGet(kMain(id))!=null);return id;}

/* ---------- yedek ve kurtarma ---------- */
function pushBackup(id,raw,avoid){
  var l=bkList(id),slot=-1,i;
  for(i=0;i<NB;i++){if(i===avoid)continue;if(!l.some(function(b){return b.ix===i;})){slot=i;break;}}
  if(slot<0){var old=Infinity;for(i=0;i<l.length;i++){if(l[i].ix===avoid)continue;if(l[i].saved<old){old=l[i].saved;slot=l[i].ix;}}}
  if(slot<0)slot=0;
  var kb=kBk(id,slot);                         // yedek yazılamazsa sessizce atlanır; ana kayıt öncelikli (uyarı vermez)
  if(store){try{store.setItem(kb,raw);delete mem[kb];}catch(e){}}else mem[kb]=raw;
  lastBk[id]=now();
}
function archiveCorrupt(id,raw,why){
  if(raw==null)return'';
  var k='sg2_corrupt_'+now()+'_'+fnv(String(id)+String(raw.length)).toString(36);
  try{if(store){store.setItem(k,JSON.stringify({user:user,id:id,why:why,at:now(),raw:String(raw).slice(0,MAXUNI+2000)}));return k;}}catch(e){}
  return'';
}
function fmtDate(ms){try{var d=new Date(ms);return d.getDate()+'.'+(d.getMonth()+1)+'.'+d.getFullYear()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}catch(e){return'';}}
/* ana kaydı (gerekirse yedekten kurtararak) oku. Yan etki: durum mesajı, bozuk kopya arşivi, ana kaydın onarımı */
function readFor(id){
  if(!P()||!okId(id))return null;
  var raw=rawGet(kMain(id)),r;
  if(raw!=null){r=unpack(raw);if(r.uni&&r.uni.id===id){lastSum[id]=r.sum;return r;}}
  var arch=raw!=null?archiveCorrupt(id,raw,r&&r.err):'';
  var bl=bkList(id).filter(function(b){return b.valid;}).sort(function(a,b){return b.saved-a.saved;});
  for(var i=0;i<bl.length;i++){
    var rr=unpack(bl[i].raw);
    if(rr.uni&&rr.uni.id===id){
      rawSet(kMain(id),bl[i].raw);lastSum[id]=rr.sum;
      warn('rec',(raw!=null?'Kayıt bozuktu':'Kayıt bulunamadı')+'; '+fmtDate(bl[i].saved)+' yedeğinden kurtarıldı.'+(arch?' Bozuk kopya saklandı.':''));
      return rr;
    }
  }
  if(raw!=null||bl.length)setErr('Kayıt okunamadı ve sağlam yedek yok.'+(arch?' Bozuk kopya saklandı ('+arch+').':''));
  return null;
}

/* ---------- kaydetme ---------- */
function saveCore(forceWrite,forceBackup){
  if(!A||!P())return false;
  var id=A.id,p=pack(A);
  if(!p){setErr('Evren verisi çok büyük, kaydedilemedi.');return false;}
  if(!forceWrite&&lastSum[id]===p.sum)return true;
  var cur=rawGet(kMain(id));
  if(cur!=null){
    var e=parseEnv(cur);
    if(e){
      if(lastSum[id]&&e.sum!==lastSum[id]){pushBackup(id,cur);warn('conf','Evren başka bir sekmede de değişmişti; o sürüm yedeğe alındı.');}
      else if(forceBackup||now()-(lastBk[id]||bkInit(id))>BK_GAP)pushBackup(id,cur);
    }else archiveCorrupt(id,cur,'yazma-öncesi');
  }
  var persisted=rawSet(kMain(id),p.env);
  if(persisted&&!bkList(id).length)pushBackup(id,p.env);   // ilk kayıtta da en az bir sağlam yedek bulunsun
  lastSum[id]=p.sum;
  touch(meta(A,now(),p.env.length));writeIdx();
  rawSet(P()+'act',id);
  return persisted;
}
function bkInit(id){var l=bkList(id),m=0;for(var i=0;i<l.length;i++)if(l[i].saved>m)m=l[i].saved;lastBk[id]=m;return m;}

/* ---------- genel API ---------- */
var S=SG.S={
  schema:SCHEMA,
  init:function(){
    if(inited)return S;inited=true;
    store=probe();
    if(!store)warn('mem','Bu cihazda kalıcı depolama yok: kayıt yalnız bu oturumda tutuluyor. Evreni dışa aktar.');
    var flush=function(){try{saveCore(false,false);}catch(e){SG.log&&SG.log.err('S.flush',e);}};
    window.addEventListener('pagehide',flush);
    window.addEventListener('sg-pause',flush);
    document.addEventListener('visibilitychange',function(){if(document.hidden)flush();});
    window.addEventListener('storage',function(ev){
      try{
        if(!P()||!ev.key||ev.key.indexOf(P())!==0)return;
        if(ev.key===P()+'idx'){IDX=null;return;}
        if(A&&ev.key===kMain(A.id)&&ev.newValue){var e=parseEnv(ev.newValue);if(e&&e.sum!==lastSum[A.id])warn('conf','Evren başka bir sekmede değişti. Bu sekme kaydedince o sürüm yedeğe alınır.');}
      }catch(e){}
    });
    return S;
  },
  setUser:function(name){
    if(!inited)S.init();
    try{if(A&&P())saveCore(true,false);}catch(e){SG.log&&SG.log.err('S.setUser',e);}
    user=(name==null||String(name).trim()==='')?null:String(name);
    A=null;IDX=null;triedAct=false;acc=0;lastSum={};lastBk={};msgs.rec='';msgs.conf='';msgs.err='';
    return S;
  },
  user:function(){return user;},
  list:function(){
    if(!P())return[];loadIdx();
    if(A)for(var i=0;i<IDX.length;i++)if(IDX[i].id===A.id){IDX[i].t=A.t;IDX[i].name=A.name;}
    return IDX.slice().sort(function(a,b){return b.saved-a.saved;}).map(function(m){return{id:m.id,name:m.name,seed:m.seed,t:m.t,saved:m.saved,bytes:m.bytes};});
  },
  create:function(o){
    o=o||{};
    if(!P()){setErr('Önce giriş yapmalısın.');return null;}
    if(!SG.U||typeof SG.U.gen!=='function')throw new Error('SG.S.create: SG.U.gen yok — evren üretilemez (06-universe.js yüklenmedi)');
    loadIdx();
    if(IDX.length>=MAXLIST){setErr('En fazla '+MAXLIST+' evren saklanabilir. Birini silmelisin.');return null;}
    var seed=str(o.seed,64).trim()||(SG.uid?SG.uid():String(now()));
    var preset=PRESETS.indexOf(o.preset)>=0?o.preset:'sakin';
    var name=nameOf(o.name)||('Evren '+(IDX.length+1));
    var uni=SG.U.gen(seed,{preset:preset,name:name});
    if(!isObj(uni))throw new Error('SG.S.create: SG.U.gen evren döndürmedi');
    uni.name=name;uni.seed=seed;uni.preset=preset;
    if(!okId(uni.id)||IDX.some(function(m){return m.id===uni.id;})||rawGet(kMain(uni.id))!=null)uni.id=newId();
    if(typeof uni.v!=='number')uni.v=SCHEMA;
    var c=shape(uni,false);
    if(!c)throw new Error('SG.S.create: evren verisi geçersiz');
    if(A)saveCore(true,false);
    A=c;lastSum[c.id]=null;saveCore(true,false);
    return A;
  },
  active:function(){
    if(A)return A;
    if(!triedAct&&P()){triedAct=true;var id=rawGet(P()+'act');if(okId(id))S.open(id);}
    return A;
  },
  open:function(id){
    if(!P()||!okId(id))return null;
    if(A&&A.id===id)return A;
    if(A)saveCore(true,false);
    var r=readFor(id);if(!r)return null;
    A=r.uni;triedAct=true;rawSet(P()+'act',id);
    touch(meta(A,r.saved,r.bytes));writeIdx();
    return A;
  },
  save:function(force){return saveCore(!!force,!!force);},
  autosave:function(dt){acc+=(dt>0?dt:0);if(acc>=AUTO){acc=0;return saveCore(false,false);}return null;},
  remove:function(id){
    if(!P()||!okId(id))return false;
    loadIdx();
    if(A&&A.id===id){A=null;rawDel(P()+'act');}
    rawDel(kMain(id));for(var i=0;i<NB;i++)rawDel(kBk(id,i));
    IDX=IDX.filter(function(m){return m.id!==id;});writeIdx();
    delete lastSum[id];delete lastBk[id];
    return true;
  },
  rename:function(id,name){
    name=nameOf(name);if(!name||!P()||!okId(id))return false;
    if(A&&A.id===id){A.name=name;return saveCore(true,false)!==undefined;}
    var r=readFor(id);if(!r)return false;
    r.uni.name=name;var p=pack(r.uni);if(!p)return false;
    rawSet(kMain(id),p.env);lastSum[id]=p.sum;touch(meta(r.uni,now(),p.env.length));writeIdx();
    return true;
  },
  exportText:function(id){
    if(!P()||!okId(id))return null;
    var u=null;
    if(A&&A.id===id)u=A;else{var r=readFor(id);u=r&&r.uni;}
    if(!u)return null;
    var p=pack(u);if(!p)return null;
    var t='SGU2:'+b64e(JSON.stringify({f:'SGU2',v:u.v,sum:p.sum,d:p.d}));
    return t.length>MAXTEXT?null:t;
  },
  importText:function(text){
    try{
      if(!P())return{ok:false,error:'Önce giriş yapmalısın.'};
      if(typeof text!=='string')return{ok:false,error:'Metin değil.'};
      text=text.trim();
      if(text.length>MAXTEXT)return{ok:false,error:'Dosya çok büyük (en fazla 2 MB).'};
      if(text.indexOf('SGU2:')!==0)return{ok:false,error:'Biçim tanınmadı (SGU2: ile başlamalı).'};
      var b=text.slice(5).replace(/\s+/g,'');
      if(!b||!/^[A-Za-z0-9+/]+={0,2}$/.test(b)||b.length%4!==0)return{ok:false,error:'Bozuk veri (geçersiz karakter).'};
      var js;try{js=b64d(b);}catch(e){return{ok:false,error:'Bozuk veri (çözülemedi).'};}
      var e;try{e=JSON.parse(js);}catch(x){return{ok:false,error:'Bozuk veri (JSON).'};}
      if(!isObj(e)||e.f!=='SGU2'||typeof e.d!=='string'||e.d.length>MAXUNI)return{ok:false,error:'Biçim tanınmadı.'};
      if(e.sum!==sum(e.d))return{ok:false,error:'Sağlama toplamı uyuşmuyor: dosya değişmiş ya da eksik.'};
      var u;try{u=JSON.parse(e.d);}catch(x){return{ok:false,error:'Bozuk veri (evren).'};}
      u=migrate(u);if(!u)return{ok:false,error:'Bu evren daha yeni bir sürümden; güncelle.'};
      u=shape(u,true);if(!u)return{ok:false,error:'Evren verisi geçersiz.'};
      loadIdx();
      if(IDX.length>=MAXLIST)return{ok:false,error:'En fazla '+MAXLIST+' evren saklanabilir. Birini silmelisin.'};
      if(!okId(u.id)||IDX.some(function(m){return m.id===u.id;})||rawGet(kMain(u.id))!=null)u.id=newId();
      var p=pack(u);if(!p)return{ok:false,error:'Evren çok büyük.'};
      rawSet(kMain(u.id),p.env);pushBackup(u.id,p.env);lastSum[u.id]=p.sum;touch(meta(u,now(),p.env.length));writeIdx();
      return{ok:true,id:u.id,name:u.name};
    }catch(err){SG.log&&SG.log.err('S.import',err);return{ok:false,error:'İçe aktarılamadı.'};}
  },
  backups:function(id){
    if(!P()||!okId(id))return[];
    return bkList(id).filter(function(b){return b.valid;}).sort(function(a,b){return b.saved-a.saved;}).map(function(b){return{ix:b.ix,saved:b.saved,t:b.t};});
  },
  restore:function(id,ix){
    if(!P()||!okId(id)||!(ix>=0&&ix<NB))return null;
    var raw=rawGet(kBk(id,ix));if(raw==null)return null;
    var r=unpack(raw);if(!r.uni||r.uni.id!==id)return null;
    var cur=rawGet(kMain(id));if(cur!=null&&parseEnv(cur))pushBackup(id,cur,ix);
    rawSet(kMain(id),raw);lastSum[id]=r.sum;touch(meta(r.uni,r.saved,r.bytes));writeIdx();
    if(A&&A.id===id)A=r.uni;
    return r.uni;
  },
  status:function(){return status();},
  clearStatus:function(){msgs.rec='';msgs.conf='';msgs.err='';if(!hasMem()&&store)msgs.mem='';return status();},
  registerStateKey:function(k){if(typeof k==='string'&&/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(k)&&!bad(k))extra[k]=1;return S;}
};
function status(){
  var m=msgs.err||msgs.mem||msgs.rec||msgs.conf||'';
  return{ok:!m,msg:m,recovered:!!msgs.rec,mem:!!msgs.mem,conflict:!!msgs.conf,error:!!msgs.err};
}
function b64e(s){return btoa(unescape(encodeURIComponent(s)));}
function b64d(b){return decodeURIComponent(escape(atob(b)));}

/* test kancaları (üretimde zararsız) */
S._test={
  useStorage:function(s){store=s||null;},
  reset:function(){mem={};msgs={mem:'',rec:'',conf:'',err:''};A=null;IDX=null;triedAct=false;lastSum={};lastBk={};acc=0;},
  mem:function(){return mem;},unpack:unpack,shape:shape,migrate:migrate,pack:pack,sum:sum,kMain:kMain,kBk:kBk,prefix:P,NB:NB,probe:probe
};
})();
