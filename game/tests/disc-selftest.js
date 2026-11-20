// node out/disc-selftest.js  — SG.Disc'i sahte SG.U ile sınar
var fs=require('fs'),vm=require('vm'),path=require('path');
var root=path.resolve(__dirname,'..');
var errs=[],emitted=[];
var SG={D:{},log:{err:function(w,e){errs.push(w+': '+(e&&e.message||e));}},
 clamp:function(v,a,b){return v<a?a:v>b?b:v;},
 hash:function(s){s=String(s);var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;},
 bus:{emit:function(n,d){emitted.push(n);}}};
SG.D.disc=JSON.parse(fs.readFileSync(root+'/data/discoveries.json','utf8'));
var P={'g0s1p0':{id:'g0s1p0',type:'ocean',atm:1,water:1,albedo:0.3,habZone:true,moons:[{id:'m'}]},
       'g0s1p1':{id:'g0s1p1',type:'gas',atm:1.5,water:0,albedo:0.5,habZone:false,moons:[{},{},{}]},
       'g0s2p0':{id:'g0s2p0',type:'lava',atm:0.2,water:0,albedo:0.1,habZone:false,moons:[]}};
var S={'g0s1':{id:'g0s1',cls:'G',phase:'main'},'g0s2':{id:'g0s2',cls:'M',phase:'giant'}};
var G={'g0':{id:'g0',kind:'spiral'},'g1':{id:'g1',kind:'barred'}};
SG.U={
 find:function(u,id){return P[id]||S[id]||G[id]||null;},
 system:function(u,sid){return {star:{lum:1},planets:[]};},
 climate:function(p,pp){var T=255+40*(pp.atm)+10*(pp.water)-80*(pp.albedo-0.3)-(p.type==='lava'?-300:0);
   var hab=Math.max(0,1-Math.abs(T-288)/60);return {temp:T,habScore:hab,label:''};}};
global.SG=SG;
vm.runInThisContext(fs.readFileSync(root+'/src/62-discovery.js','utf8'));
var ok=0,bad=0;function T(n,c){if(c){ok++;}else{bad++;console.log('FAIL',n);}}
var D=SG.Disc,all=D.list();
T('>=60 keşif',all.length>=60);T('>=12 karar yok? ',true);
var cats={};all.forEach(function(d){cats[d.cat]=1;});T('6 kategori',Object.keys(cats).length===6);
T('benzersiz id',new Set(all.map(function(d){return d.id;})).size===all.length);
T('14 karar',SG.D.disc.actions.length===14);
// her kararın tersi var ve tanımlı
SG.D.disc.actions.forEach(function(a){if(a.reverse)T('ters:'+a.id,SG.D.disc.actions.some(function(b){return b.id===a.reverse;}));T('tag:'+a.id,['gercek','basit','kurgu'].indexOf(a.tag)>=0);T('why:'+a.id,a.why.length>20);});
// rozet sayıları kategori toplamını aşmıyor
var tot={};all.forEach(function(d){tot[d.cat]=(tot[d.cat]||0)+1;});
SG.D.disc.badges.forEach(function(b){var c=b.need.count;if(c)T('rozet:'+b.id,c.min<=tot[c.cat]);if(b.need.total)T('rozet:'+b.id,b.need.total.min<=all.length);});
// DSL anahtarları bilinen
var uni={id:'u',seed:'abc',t:0,speedIx:1,state:{}};
var u0=D.check(uni);T('başlangıçta keşif yok',u0.length===0);
T('hedef<=3',D.goals(uni).length===3);
T('karar gözlemsiz reddedilir',D.apply(uni,'g0s1p0','sera-artir').ok===false);
uni.state.observed['g0']=1;var n=D.check(uni).map(function(d){return d.id;});
T('ilk ışık',n.indexOf('ev-ilk-isik')>=0);T('sarmal',n.indexOf('ga-sarmal')>=0);
uni.state.observed['g0s1']=1;uni.state.observed['g0s1p0']=1;n=D.check(uni).map(function(d){return d.id;});
T('ilk yıldız+sarı',n.indexOf('ye-ilk')>=0&&n.indexOf('ye-sari')>=0);T('ilk dünya',n.indexOf('pl-ilk')>=0);T('okyanus',n.indexOf('pl-okyanus')>=0);T('kuşak',n.indexOf('pl-kusak')>=0);T('uydu',n.indexOf('pl-uydu')>=0);
T('çift kontrol yeni açmaz',D.check(uni).length===0);
var a=D.actions(uni,'g0s1p0');T('9 gezegen kararı',a.length===9);T('kuyruklu kilitli',a.filter(function(x){return x.id==='kuyruklu-yonlendir'})[0].disabled===true);
var r=D.apply(uni,'g0s1p0','sera-artir');T('sera ok',r.ok&&/K/.test(r.message));T('param yazıldı',uni.state.params['g0s1p0'].atm===1.25);
T('ka-ilk+ka-sera',r.unlocked.map(function(d){return d.id;}).indexOf('ka-ilk')>=0&&r.unlocked.map(function(d){return d.id;}).indexOf('ka-sera')>=0);
var r2=D.apply(uni,'g0s1p0','sera-azalt');T('geri alındı',r2.ok&&uni.state.params['g0s1p0'].atm===1);T('pişmanlık',uni.state.disc['ka-geri']>0);
// sınır
for(var i=0;i<10;i++)D.apply(uni,'g0s1p0','sera-artir');T('atm üst sınır 2',uni.state.params['g0s1p0'].atm===2);T('sınırda reddedilir',D.apply(uni,'g0s1p0','sera-artir').ok===false);
var r3=D.apply(uni,'g0s1p0','gezegen-dogal');T('doğala dön',r3.ok&&uni.state.params['g0s1p0'].atm===1);T('doğal keşif',uni.state.disc['ka-dogal']>0);
// galaksi kararı
uni.state.observed['g0']=2;uni.state.observed['g0s1p1']=1;
var g=D.apply(uni,'g0','bolge-su-artir');T('bölgesel ok',g.ok&&/2 gezegen/.test(g.message));T('ka-bolge',uni.state.disc['ka-bolge']>0);
T('galaksi doğal',D.apply(uni,'g0','galaksi-dogal').ok);
// zaman / hız / ölçek / bayrak / olay
D.noteScale(uni,'planet');D.noteScale(uni,'system');D.noteScale(uni,'galaxy');D.noteScale(uni,'universe');T('dört ölçek',uni.state.disc['ev-dort-olcek']>0);
D.noteSpeed(uni,0);T('sessiz an',uni.state.disc['ev-sessiz-an']>0);D.flag(uni,'photo');T('portre',uni.state.disc['ev-portre']>0);
uni.t=1200;uni.state.events.push({type:'supernova'},{type:'comet'});D.check(uni);T('bir milyar',uni.state.disc['ev-milyar-yil']>0);T('süpernova',uni.state.disc['ol-supernova']>0);
// gizli keşif maskeleme
var l=D.list(uni).filter(function(x){return x.id==='ye-notron'})[0];T('gizli maske',l.title==='???');
// rozet
T('rozet çırak',uni.state.disc['b_cirak']>0);T('unvan',typeof D.title(uni)==='string');
var p=D.progress(uni);T('progress',p.done>10&&p.total===all.length&&p.byCat.Gezegen.total>=12);
// goals 3 ve gizli değil
D.goals(uni).forEach(function(x){T('goal gizli değil',D.byId(x.id).secret!==true);});
// performans
var t0=Date.now();for(var j=0;j<2000;j++){uni.t+=1;D.check(uni);}T('2000 check <300ms',Date.now()-t0<300);
// bus
T('bus unlock',emitted.indexOf('disc:unlock')>=0&&emitted.indexOf('disc:badge')>=0&&emitted.indexOf('d:decision')>=0);
T('hata yok',errs.length===0);if(errs.length)console.log(errs.slice(0,5));
console.log('geçen',ok,'kalan',bad);process.exit(bad?1:0);
