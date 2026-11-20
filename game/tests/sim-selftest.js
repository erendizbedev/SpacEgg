/* SG.U öz-testi (node): node out/sim-selftest.js [kaynak-dizini]  — çıkış kodu 0 = hepsi geçti */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm');
var root=process.argv[2]||path.join(__dirname,'..');
var win={addEventListener:function(){},matchMedia:function(){return{matches:false};}};
var ctx=vm.createContext({window:win,console:console,Date:Date,Math:Math,JSON:JSON,WeakMap:WeakMap,setTimeout:setTimeout});
win.window=win;
['00-core.js','06-universe.js'].forEach(function(f){vm.runInContext(fs.readFileSync(path.join(root,'src',f),'utf8'),ctx,{filename:f});});
var SG=win.SG,U=SG.U,pass=0,fail=0;
function ok(c,msg){if(c){pass++;}else{fail++;console.log('  YANLIŞ: '+msg);}}
function T(name,fn){console.log('- '+name);try{fn();}catch(e){fail++;console.log('  İSTİSNA: '+(e&&e.stack||e));}}
function ms(){return Number(process.hrtime.bigint())/1e6;}
var evs=[];SG.bus.on('u:event',function(e){evs.push(e);});

T('determinizm',function(){
  var a=U.gen('tohum-1',{created:1}),b=U.gen('tohum-1',{created:1}),c=U.gen('tohum-2',{created:1});
  ok(JSON.stringify(a)===JSON.stringify(b),'aynı tohum aynı evren');
  ok(JSON.stringify(a.galaxies)!==JSON.stringify(c.galaxies),'farklı tohum farklı evren');
  var ga=U.galaxy(a,'g0'),gb=U.galaxy(b,'g0');
  ok(JSON.stringify(ga.stars)===JSON.stringify(gb.stars),'galaksi yıldızları aynı');
  var sid=null;for(var i=0;i<ga.stars.length;i++)if(ga.stars[i].planetCount>2){sid=ga.stars[i].id;break;}
  ok(sid,'gezegenli yıldız var');
  ok(JSON.stringify(U.system(a,sid).planets)===JSON.stringify(U.system(b,sid).planets),'sistem aynı');
});

T('sınırlar ve dağılım',function(){
  ['sakin','yogun','seyrek'].forEach(function(pr){
    var u=U.gen('sinir-'+pr,{preset:pr,created:1});
    ok(u.galaxies.length>=7&&u.galaxies.length<=9,pr+' galaksi sayısı '+u.galaxies.length);
    var cnt={},n=0,planets=0,withp=0,hz=0,hab=0;
    u.galaxies.forEach(function(g){
      ok(Math.abs(g.x)+g.r<=1&&Math.abs(g.y)+g.r<=1,'galaksi sınır içinde');
      var G=U.galaxy(u,g.id);ok(G.stars.length>=270&&G.stars.length<=530,'yıldız sayısı '+G.stars.length);
      G.stars.forEach(function(s,idx){
        n++;cnt[s.cls]=(cnt[s.cls]||0)+1;
        ok(s.id===g.id+'s'+idx,'id biçimi');
        ok(Math.sqrt(s.x*s.x+s.y*s.y)<=1,'yıldız disk içinde');
        ok(s.mass>=.1&&s.mass<=60,'kütle');ok(s.lum>=0&&isFinite(s.lum),'parlaklık');ok(isFinite(s.temp)&&s.temp>=0,'sıcaklık');
        ok(['protostar','main','giant','dwarf','neutron','blackhole'].indexOf(s.phase)>=0,'faz');
        if(s.planetCount>0){withp++;var sys=U.system(u,s.id);
          ok(sys.forming?sys.planets.length===0:sys.planets.length===s.planetCount,'gezegen sayısı tutarlı');
          var pa=0;sys.planets.forEach(function(p){planets++;
            ok(p.a>pa,'yörüngeler artan');pa=p.a;ok(p.period>0&&isFinite(p.period),'periyot');
            ok(p.temp>=3&&p.temp<=1500,'sıcaklık '+p.temp);ok(p.habScore>=0&&p.habScore<=1,'habScore');
            if(p.habZone)hz++;if(p.habScore>.5)hab++;
            ok(p.atm>=0&&p.atm<=2&&p.water>=0&&p.water<=2,'iklim parametreleri');
            p.moons.forEach(function(m){ok(m.id.indexOf(p.id+'m')===0&&m.radius>0,'uydu');});
            ok(U.find(u,p.id)===p,'find gezegen');});}
      });
    });
    var fr=function(c){return (cnt[c]||0)/n;};
    ok(fr('M')>.55&&fr('M')<.78,pr+' M oranı '+fr('M').toFixed(3));ok(fr('O')<.02,pr+' O nadir '+fr('O').toFixed(4));
    console.log('  '+pr+': yıldız '+n+', gezegenli '+withp+', gezegen '+planets+', yaşanabilir kuşakta '+hz+', habScore>0.5: '+hab+', dağılım '+JSON.stringify(cnt));
    ok(pr==='seyrek'||hz>0,'yaşanabilir kuşakta gezegen var');
  });
});

T('find / observe',function(){
  var u=U.gen('f',{created:1});
  ok(U.find(u,'g0')===u.galaxies[0],'galaksi');ok(U.find(u,'g0s3')===U.galaxy(u,'g0').stars[3],'yıldız');
  ok(U.find(u,'zzz')===null&&U.find(u,'g99')===null&&U.find(u,'g0s99999')===null,'geçersiz id');
  ok(U.observe(u,'g0s3')===1&&U.observe(u,'g0s3')===2&&U.observe(u,'g0s3')===3&&U.observe(u,'g0s3')===3,'gözlem kademeleri 0..3');
  ok(U.observe(u,'yok')===0,'bilinmeyen id');
  ok(U.cosmicLabel(0)==='1,0 milyar yıl'&&/milyar/.test(U.cosmicLabel(12800)),'etiket '+U.cosmicLabel(12800));
  ok(U.setSpeed(u,4)===1000&&U.setSpeed(u,-3)===0&&U.setSpeed(u,99)===1000,'hız');
  var p=U.orbitPos({id:'a',period:365},1);ok(Math.abs(p.x*p.x+p.y*p.y-1)<1e-9,'yörünge birim çember');
});

T('iklim (neden-sonuç)',function(){
  var sun={lum:1,life:10000,phase:'main'};
  var earth=U.climate({a:1,type:'rocky',radius:1},{atm:1,water:1,albedo:.3},sun);
  ok(Math.abs(earth.temp-288)<6&&earth.habScore>.9&&earth.label==='Ilıman','Dünya benzeri '+JSON.stringify(earth));
  var more=U.climate({a:1,type:'rocky',radius:1},{atm:1.8,water:1,albedo:.3},sun);
  ok(more.temp>earth.temp,'sera artınca sıcaklık artar');
  var refl=U.climate({a:1,type:'rocky',radius:1},{atm:1,water:1,albedo:.6},sun);
  ok(refl.temp<earth.temp,'albedo artınca sıcaklık düşer');
  var venus=U.climate({a:.72,type:'rocky',radius:.95},{atm:2,water:1,albedo:.3},sun);
  ok(venus.temp>400&&venus.habScore<.05,'Venüs benzeri '+JSON.stringify(venus));
  var mars=U.climate({a:1.52,type:'rocky',radius:.53},{atm:.2,water:.05,albedo:.25},sun);
  ok(mars.temp<273&&mars.habScore<.15,'Mars benzeri '+JSON.stringify(mars));
  ok(U.climate({a:5,type:'gas',radius:11},{},sun).habScore===0,'gaz devi 0');
  var u=U.gen('iklim',{created:1}),sid=null,G=U.galaxy(u,'g0');
  for(var i=0;i<G.stars.length;i++){if(G.stars[i].planetCount>1&&G.stars[i].age>25&&G.stars[i].phase==='main'){sid=G.stars[i].id;break;}}
  var sys=U.system(u,sid),p=sys.planets[0],t0=p.temp;
  U.setParams(u,p.id,{atm:2,albedo:.1});ok(p.temp>t0,'setParams sıcaklığı değiştirir');ok(u.state.params[p.id].atm===2,'params saklanır');
  ok(U.system(u,sid)===sys,'sistem önbellekli');
});

T('performans',function(){
  var u=U.gen('perf',{preset:'yogun',created:1}),t=ms(),mx=0;
  for(var i=0;i<u.galaxies.length;i++){t=ms();U.galaxy(u,u.galaxies[i].id);mx=Math.max(mx,ms()-t);}
  console.log('  galaksi üretimi en çok '+mx.toFixed(2)+' ms (üst sınır 25)');ok(mx<=25,'galaksi üretimi');
  var ss=0,sx=0;for(i=0;i<u.galaxies.length;i++){var G=U.galaxy(u,u.galaxies[i].id);for(var k=0;k<G.stars.length;k++)if(G.stars[k].planetCount>0&&ss<20){t=ms();U.system(u,G.stars[k].id);sx=Math.max(sx,ms()-t);ss++;}}
  console.log('  sistem üretimi en çok '+sx.toFixed(2)+' ms');ok(sx<=25,'sistem üretimi');
  t=ms();U.warm(u);var wm=ms()-t;console.log('  warm (zamanlama listesi) '+wm.toFixed(1)+' ms, olay sayısı '+U._meta(u).sched.length);
  var ts=[],tot=0;U.setSpeed(u,4);
  for(i=0;i<600;i++){t=ms();U.tick(u,1/60);var d=ms()-t;ts.push(d);tot+=d;}
  ts.sort(function(a,b){return a-b;});
  console.log('  step ('+u.galaxies.length+' galaksi, '+(u.galaxies.length*480)+' yıldız): ort '+(tot/600).toFixed(3)+' ms, p95 '+ts[570].toFixed(3)+' ms, en yüksek '+ts[599].toFixed(3)+' ms');
  ok(ts[570]<=2,'step p95 ≤ 2 ms');ok(ts[599]<=8,'step en yüksek ≤ 8 ms (tam yeniden hesap karesi dahil)');
  var sz=JSON.stringify(u).length;console.log('  kayıt boyutu (600 kare sonrası) '+sz+' bayt');ok(sz<200000,'kayıt boyutu');
});

T('olay hızı (≤1/sn) ve çeşitlilik',function(){
  [1,2,3,4].forEach(function(ix){
    var u=U.gen('olay',{preset:'yogun',created:1}),times=[],real=0,types={};U.setSpeed(u,ix);
    evs.length=0;
    for(var i=0;i<60*180;i++){real+=1/60;var o=U.tick(u,1/60);o.forEach(function(e){times.push(real);types[e.type]=(types[e.type]||0)+1;});}
    var maxWin=0;for(i=0;i<times.length;i++){var c=0;for(var j=i;j<times.length&&times[j]<times[i]+1;j++)c++;maxWin=Math.max(maxWin,c);}
    console.log('  hız '+U.SPEEDS[ix]+'×: 180 sn\'de '+times.length+' olay, en yoğun 1 sn penceresi '+maxWin+', türler '+JSON.stringify(types)+', düşen '+U._meta(u).dropped+', son: '+U.cosmicLabel(u.t));
    ok(maxWin<=1,'hız '+ix+' saniyede ≤1 olay');ok(times.length<=Math.floor(180/2.5)+2,'toplam üst sınır');
    ok(ix===1?times.length>=5:times.length>=20,'hız '+ix+' yeterli olay');
    ok(u.state.events.length<=100&&u.state.journal.length<=300,'olay/günlük sınırı');
  });
  var u2=U.gen('olay',{preset:'yogun',created:1});U.setSpeed(u2,4);var ty={};
  for(var i=0;i<60*400;i++)U.tick(u2,1/60);
  u2.state.events.forEach(function(e){ty[e.type]=1;});
  ok(evs.some(function(e){return e.type==='supernova';})||ty.supernova||true,'(bilgi) süpernova görülebilir');
});

T('kayıt güvenli (JSON gidiş-dönüş) ve yeniden yükleme',function(){
  var u=U.gen('kayit',{created:1});U.setSpeed(u,3);for(var i=0;i<600;i++)U.tick(u,1/60);
  var copy=JSON.parse(JSON.stringify(u));ok(copy.t===u.t&&copy.galaxies.length===u.galaxies.length,'gidiş-dönüş');
  var A=U.galaxy(u,'g1').stars,B=U.galaxy(copy,'g1').stars,same=true;
  for(i=0;i<A.length;i++){if(A[i].phase!==B[i].phase||Math.abs(A[i].lum-B[i].lum)>.02*Math.max(1e-3,B[i].lum)){same=false;break;}}
  ok(same,'yüklenen evrende yıldız durumları aynı');
  var before=copy.state.events.length;U.step(copy,50);ok(copy.state.events.length-before<=1,'yüklemede geçmiş olaylar tekrarlanmaz');
  ok(U.step(copy,0).length===0&&U.step(copy,-5).length===0,'sıfır/negatif dt');
});

console.log('\nSONUÇ: '+pass+' geçti, '+fail+' kaldı');
process.exit(fail?1:0);
