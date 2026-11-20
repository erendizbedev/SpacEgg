(function(){
var R=[],P=0,F=0;
function ok(c,n,x){if(c){P++;R.push('PASS '+n);}else{F++;R.push('FAIL '+n+(x!==undefined?' :: '+x:''));}}
function Fake(limit){this.d={};this.limit=limit||Infinity;this.sets=0;}
Fake.prototype={get length(){return Object.keys(this.d).length;},key:function(i){return Object.keys(this.d)[i]||null;},
  getItem:function(k){return Object.prototype.hasOwnProperty.call(this.d,k)?this.d[k]:null;},
  setItem:function(k,v){var t=0,o=this.d;for(var x in o)if(x!==k)t+=o[x].length+x.length;if(t+v.length+k.length>this.limit)throw new Error('QuotaExceededError');this.d[k]=String(v);this.sets++;},
  removeItem:function(k){delete this.d[k];}};
// SG.U taklidi (deterministik)
SG.U={gen:function(seed,o){var r=SG.rng(seed),g=[];for(var i=0;i<8;i++)g.push({id:'g'+i,name:'Galaksi '+i,kind:['spiral','barred','elliptical','irregular'][i%4],x:r()*2-1,y:r()*2-1,r:.1,rot:r()*6,hue:r()*360,arms:2,starCount:400});
  return{v:2,id:'u'+SG.hash(seed).toString(36),name:(o&&o.name)||'E',seed:seed,preset:(o&&o.preset)||'sakin',t:0,speedIx:1,created:Date.now(),galaxies:g,state:{observed:{},params:{},decisions:[],disc:{},events:[],journal:[]}};}};
var S=SG.S,T=S._test;
function fresh(lim){var f=new Fake(lim);T.reset();T.useStorage(f);S.setUser(null);return f;}
function enc64(o){return 'SGU2:'+btoa(unescape(encodeURIComponent(JSON.stringify(o))));}
function envFor(u,mut){var d=JSON.stringify(u);return enc64({f:'SGU2',v:u.v,sum:mut?'x.1':T.sum(d),d:d});}
S.init();

// 1 gidiş-dönüş
var f=fresh();S.setUser('doktor');
var u=S.create({name:'Deneme',seed:'abc',preset:'yogun'});
ok(u&&u.id&&u.name==='Deneme'&&u.preset==='yogun','create');
u.t=123.5;u.state.observed.g0s1=2;ok(S.save(true)===true,'save true');
T.reset();T.useStorage(f);S.setUser('doktor');
var a=S.active();ok(a&&a.t===123.5&&a.state.observed.g0s1===2&&a.galaxies.length===8,'active() yeniden yüklenir');
ok(S.list().length===1&&S.list()[0].name==='Deneme','list');
ok(JSON.stringify(a).length<20000,'boyut küçük: '+JSON.stringify(a).length);
// SG.U yok -> create hata
var saveU=SG.U;SG.U=null;var thrown=false;try{S.create({name:'x'});}catch(e){thrown=/SG\.U\.gen/.test(e.message);}SG.U=saveU;ok(thrown,'SG.U yokken create net hata');

// 2 bozuk ana kayıt -> yedekten kurtarma
f=fresh();S.setUser('doktor');u=S.create({name:'K',seed:'k1'});var id=u.id;
u.t=10;S.save(true);u.t=20;S.save(true);u.t=30;S.save(true);
ok(S.backups(id).length>=2,'yedekler var',S.backups(id).length);
var mk=T.kMain(id),raw=f.d[mk];f.d[mk]=raw.replace('"t":30','"t":31').replace(/(\\"t\\":)30/,'$131');
f.d[mk]=raw.slice(0,raw.length-30)+'BOZUK';
T.reset();T.useStorage(f);S.setUser('doktor');
var o=S.open(id);ok(o&&o.t<30&&o.t>=10,'bozuk kayıt yedekten kurtarıldı t='+(o&&o.t));
var st=S.status();ok(!st.ok&&st.recovered&&/yedeğinden/.test(st.msg),'status recovered',JSON.stringify(st));
ok(Object.keys(f.d).some(function(k){return k.indexOf('sg2_corrupt_')===0;}),'bozuk kopya saklandı');
S.clearStatus();ok(S.status().ok,'clearStatus');
ok(unpackOK(f.d[mk]),'ana kayıt onarıldı');
function unpackOK(r){return !!T.unpack(r).uni;}

// 3 bozuk + yedek yok
f=fresh();S.setUser('doktor');u=S.create({name:'Y',seed:'y1'});id=u.id;
for(var i=0;i<3;i++)rmKey(f,T.kBk(id,i));
f.d[T.kMain(id)]='{"f":1,"sum":"1.1","d":"xx"}';
T.reset();T.useStorage(f);S.setUser('doktor');
ok(S.open(id)===null&&S.status().error&&!S.status().ok,'yedeksiz bozuk: null + hata');
ok(Object.keys(f.d).some(function(k){return k.indexOf('sg2_corrupt_')===0;}),'yedeksiz bozuk: kopya saklandı');
function rmKey(f,k){delete f.d[k];}
// çöp JSON
f.d[T.kMain(id)]='%%%çöp';T.reset();T.useStorage(f);S.setUser('doktor');
ok(S.open(id)===null,'çöp metin: çökmez, null');
// indeks bozuk -> yeniden kur
f=fresh();S.setUser('doktor');var a1=S.create({name:'A',seed:'s1'}),b1=S.create({name:'B',seed:'s2'});
f.d[T.prefix()+'idx']='[{"id":"../x"}]';T.reset();T.useStorage(f);S.setUser('doktor');
ok(S.list().length===2,'indeks yeniden kuruldu: '+S.list().length);
f.d[T.prefix()+'idx']='çöp';T.reset();T.useStorage(f);S.setUser('doktor');ok(S.list().length===2,'indeks çöp -> yeniden');

// 4 kota dolu
f=fresh(900);S.setUser('doktor');
var q=S.create({name:'Kota',seed:'q1'});
ok(q&&S.status().mem&&!S.status().ok,'kota dolu: bellek yedeği + uyarı',JSON.stringify(S.status()));
q.t=77;var r1=S.save(true);ok(r1===false,'kota: save false döner, atmaz');
var q2=S.open(q.id);ok(q2&&q2.t===77,'kota: oturumda okunur');
ok(S.exportText(q.id)&&S.exportText(q.id).indexOf('SGU2:')===0,'kota: dışa aktarma çalışır');
// depolama yok
fresh();T.useStorage(null);S.setUser('doktor');
var n=S.create({name:'NoLS',seed:'n1'});ok(n&&S.status().mem,'localStorage yok: çalışır + uyarı');
n.t=5;S.save(true);ok(S.open(n.id).t===5&&S.list().length===1,'localStorage yok: kayıt-oku');

// 5 içe aktarma saldırıları
f=fresh();S.setUser('doktor');var base=SG.U.gen('imp',{});
function imp(t){return S.importText(t);}
ok(!imp(123).ok,'imp: sayı');
ok(!imp('merhaba').ok,'imp: yanlış biçim');
ok(!imp('SGU2:'+new Array(2*1024*1024+10).join('A')).ok,'imp: 2MB üstü');
ok(!imp('SGU2:@@@!!').ok,'imp: geçersiz base64');
ok(!imp('SGU2:'+btoa('degil json')).ok,'imp: base64 ama json değil');
ok(!imp(envFor(base,true)).ok,'imp: yanlış sağlama');
ok(!imp(enc64({f:'XXX',d:'{}',sum:'1.1'})).ok,'imp: yanlış f');
var evilBase=JSON.parse(JSON.stringify(base));
evilBase.state={observed:JSON.parse('{"__proto__":{"pwn":1},"constructor":{"x":1},"g0s1":9,"g0":-4,"../a":1}'),
  params:{p1:{atm:1e99,water:'x',albedo:0.3,'__proto__':{z:1}}},decisions:[{t:1,target:'../../etc',action:'a'},{t:1,target:'g0s1p1',action:'apply.atm'}],
  disc:{ok1:5,'__proto__':3},events:new Array(300).fill({id:'e',type:'<script>',t:1,target:'g0',galaxy:'g0',severity:99,text:'x'.repeat(2000)}),journal:[{t:1,kind:'A B',text:'<img onerror=1>'}],
  evilExtra:{a:1},__proto__x:1};
evilBase.name='<b>Ad\u0000\n</b>'+'x'.repeat(200);evilBase.t=-5;evilBase.speedIx=99;evilBase.preset='hack';evilBase.id='../../x';
evilBase.galaxies=[{id:'g0',name:'<>',x:99,y:NaN}];evilBase.admin=true;
var res=imp(envFor(evilBase));ok(res.ok,'imp: saldırı yükü temizlenerek kabul',JSON.stringify(res));
var iu=S.open(res.id);if(!iu){window.__D=("DBG "+JSON.stringify(S.status())+JSON.stringify(res)+JSON.stringify(T.unpack(T_raw(res.id))));}
ok(({}).pwn===undefined&&Object.prototype.pwn===undefined,'imp: prototype kirlenmedi');
ok(iu.state.observed.g0s1===3&&iu.state.observed.g0===0&&!('../a' in iu.state.observed)&&!hasOwn(iu.state.observed,'constructor'),'imp: observed temizlendi');
ok(iu.state.params.p1&&iu.state.params.p1.atm===1000&&iu.state.params.p1.water===undefined&&iu.state.params.p1.albedo===0.3,'imp: params sınırlandı');
ok(iu.state.decisions.length===1&&iu.state.decisions[0].target==='g0s1p1','imp: kararlar filtrelendi');
ok(iu.state.events.length===100&&iu.state.events[0].text.length===300&&iu.state.events[0].severity===3&&iu.state.events[0].type==='event','imp: olaylar sınırlandı');
ok(iu.state.journal[0].kind==='note','imp: journal');
ok(iu.state.evilExtra===undefined&&iu.admin===undefined,'imp: bilinmeyen alanlar atıldı');
ok(iu.name.indexOf('<')<0&&iu.name.length<=40&&!/[\u0000\n]/.test(iu.name),'imp: ad temizlendi');
ok(iu.t===0&&iu.speedIx===4&&iu.preset==='sakin','imp: aralıklar');
ok(iu.id!=='../../x'&&/^[A-Za-z0-9_-]+$/.test(iu.id),'imp: id güvenli');
ok(iu.galaxies.length===8,'imp: galaksiler tohumdan yeniden üretildi');
function T_raw(id){return f.d[T.kMain(id)];}
function hasOwn(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
var huge=JSON.parse(JSON.stringify(base));huge.state={events:new Array(400).fill({id:'e',text:'x'.repeat(4000)})};
ok(!imp(envFor(huge)).ok,'imp: 1,5 MB üstü evren reddedilir');
// kayıtlı ek state anahtarı
S.registerStateKey('seen');var ex=JSON.parse(JSON.stringify(base));ex.state={seen:{g0:1}};
var r2=imp(envFor(ex));ok(r2.ok&&S.open(r2.id).state.seen&&S.open(r2.id).state.seen.g0===1,'imp: kayıtlı ek anahtar korunur');
// aynı id -> yeni id
var good=S.exportText(S.list()[0].id);var c1=imp(good),c2=imp(good);ok(c1.ok&&c2.ok&&c1.id!==c2.id,'imp: aynı id → yeni id');
// gidiş-dönüş
var ex1=S.exportText(res.id);var back=imp(ex1);ok(back.ok&&S.open(back.id).state.observed.g0s1===3,'export→import gidiş-dönüş');
// Türkçe / emoji
f=fresh();S.setUser('doktor');var tu=S.create({name:'Gökçe Evreni ✨',seed:'çğş🌌'});var tx=S.exportText(tu.id);var ti=imp(tx);ok(ti.ok&&S.open(ti.id).name==='Gökçe Evreni ✨'&&S.open(ti.id).seed==='çğş🌌','UTF-8 güvenli dışa/içe aktarma');
// liste sınırı
f=fresh();S.setUser('doktor');for(i=0;i<24;i++)S.create({name:'U'+i,seed:'s'+i});ok(S.create({seed:'zz'})===null&&S.status().error,'24 evren sınırı');

// 6 iki sekme
f=fresh();S.setUser('doktor');u=S.create({name:'Sekme',seed:'t1'});id=u.id;u.t=1;S.save(true);
var cur=JSON.parse(f.d[T.kMain(id)]);var other=JSON.parse(cur.d);other.t=999;var pk=T.pack(other);
f.d[T.kMain(id)]=pk.env;
window.dispatchEvent(new StorageEvent('storage',{key:T.kMain(id),newValue:pk.env}));
ok(S.status().conflict,'iki sekme: storage olayı uyarı verir');
u.t=2;S.save(false);
var bk=S.backups(id).map(function(b){return b.t;});
ok(bk.indexOf(999)>=0,'iki sekme: diğer sekmenin sürümü yedeğe alındı',JSON.stringify(bk));
ok(S.open(id).t===2,'iki sekme: son yazan kazanır');

// 7 kullanıcı değişimi
f=fresh();S.setUser('ali');var ua=S.create({name:'AliEvren',seed:'a'});S.setUser('veli');ok(S.list().length===0&&S.active()===null,'kullanıcı değişimi: veli boş');
var uv=S.create({name:'VeliEvren',seed:'v'});S.setUser('ali');ok(S.list().length===1&&S.list()[0].name==='AliEvren'&&S.active().name==='AliEvren','kullanıcı değişimi: ali kendi evreni');
S.setUser('Ğüş/../x');var w=S.create({name:'W',seed:'w'});ok(w&&Object.keys(f.d).every(function(k){return /^sg2_[A-Za-z0-9_]+$/.test(k);}),'ad güvenli kodlandı: '+Object.keys(f.d).slice(0,2));
S.setUser('ali');ok(S.list().length===1,'ali etkilenmedi');
S.setUser(null);ok(S.list().length===0&&S.active()===null&&S.create({seed:'x'})===null,'kullanıcısız: boş, create null');
S.setUser('ali');ok(S.remove(S.list()[0].id)&&S.list().length===0&&S.active()===null,'remove');

// 8 autosave
f=fresh();S.setUser('doktor');u=S.create({name:'Auto',seed:'au'});var s0=f.sets;u.t=50;
S.autosave(10);ok(f.sets===s0,'autosave 10 sn: yazmaz');S.autosave(11);ok(f.sets>s0,'autosave ≥20 sn: yazar');
var s1=f.sets;S.autosave(25);ok(f.sets===s1,'değişmediyse yazmaz');
u.t=60;window.dispatchEvent(new Event('pagehide'));ok(JSON.parse(JSON.parse(f.d[T.kMain(u.id)]).d).t===60,'pagehide kaydeder');
u.t=70;window.dispatchEvent(new Event('sg-pause'));ok(JSON.parse(JSON.parse(f.d[T.kMain(u.id)]).d).t===70,'sg-pause kaydeder');
// yazma sırası: yedek ana kayıttan önce
f=fresh();S.setUser('doktor');u=S.create({name:'Sira',seed:'sr'});var log=[];var os=f.setItem;f.setItem=function(k,v){log.push(k);return os.call(f,k,v);};
u.t=9;S.save(true);var iB=log.findIndex(function(k){return k.indexOf('_b_')>0;}),iM=log.indexOf(T.kMain(u.id));ok(iB>=0&&iM>iB,'yazma sırası: önce yedek, sonra ana',JSON.stringify(log));
// yedek halkası 3 ile sınırlı + geri yükleme
for(i=0;i<8;i++){u.t=100+i;S.save(true);}
ok(S.backups(u.id).length<=3&&S.backups(u.id).length>=2,'yedek halkası ≤3: '+S.backups(u.id).length);
var bl=S.backups(u.id);var rs=S.restore(u.id,bl[bl.length-1].ix);ok(rs&&S.active().t===rs.t&&rs.t<107,'restore: '+(rs&&rs.t));

// 9 göç
var m1=T.migrate({v:1,seed:'x'});ok(m1&&m1.v===2&&m1.state,'migrate v1→v2');
var m3=T.migrate({v:2,seed:'x',state:{}},3);ok(m3&&m3.v===3&&m3.state.seen,'migrate v2→v3 (örnek)');
ok(T.migrate({v:99,seed:'x'})===null,'migrate: daha yeni sürüm reddedilir');
ok(T.migrate({v:0})===null&&T.migrate(null)===null&&T.migrate('x')===null,'migrate: geçersiz');
f=fresh();S.setUser('doktor');var nv=SG.U.gen('nv',{});nv.v=3;var rj=imp(envFor(nv));ok(!rj.ok&&/yeni/.test(rj.error),'import: v3 bu sürümde reddedilir');

document.title=(F?'FAIL ':'PASS ')+P+'/'+(P+F);
var pre=document.createElement('pre');pre.id='out';pre.textContent=R.join('\n');document.body.appendChild(pre);
})();
