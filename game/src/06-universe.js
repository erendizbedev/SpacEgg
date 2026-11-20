/* SpacEgg 2.0 — 06-universe: SG.U (Simülasyon Çekirdeği)
   Saf mantık, DOM yok, deterministik (Math.random yok). Kozmik zaman birimi: Myr.
   Sözleşme: docs/ARCH-2.0.md §3.1 — ayrıntı: docs/SIMULASYON.md */
(function(){
'use strict';
var SG=window.SG;
var U=SG.U=SG.U||{};

var BASE_AGE=1000;                       // t=0 anında evren yaşı (Myr)
var SPEEDS=[0,1,10,100,1000];            // Myr / gerçek saniye
var GAP=7;                               // iki bildirim arası en az gerçek saniye
var QMAX=5;                              // bekleyen olay kuyruğu üst sınırı
var PRESETS={
  sakin:{gal:7,stars:360,pl:1,lam:.10},
  yogun:{gal:9,stars:480,pl:1.2,lam:.16},
  seyrek:{gal:7,stars:300,pl:.7,lam:.07}
};
var GREEK='bcdefghij';
var ROMAN=['I','II','III','IV','V','VI'];

function rr(r,a,b){return a+(b-a)*r();}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function r3(x){return Math.round(x*1000)/1000;}
function r4(x){return Math.round(x*10000)/10000;}
function gauss(r){var u=1-r(),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185307*v);}
function pick(a,r){return a[Math.floor(r()*a.length)];}

/* ---------- İsimler (kurgu) ---------- */
var ON=['b','d','k','l','m','n','r','s','t','v','z','kh','th','sh','gr','tr','el','or','ar'];
var VO=['a','e','i','o','u','ae','ia','ei'];
var CO=['','','n','r','s','l','x','m','th'];
function genName(r,n){var s='';for(var i=0;i<n;i++)s+=pick(ON,r)+pick(VO,r)+pick(CO,r);return s.charAt(0).toUpperCase()+s.slice(1);}

/* ---------- Yıldız fiziği (basit) ---------- */
function lumM(m){ // kütle–parlaklık (Güneş=1): parçalı kuvvet yasası
  if(m<.43)return .23*Math.pow(m,2.3);
  if(m<2)return Math.pow(m,4);
  if(m<55)return 1.4*Math.pow(m,3.5);
  return 32000*m;
}
var CLS=[ // sınıf, ağırlık, kütle aralığı, sıcaklık aralığı (K)
  ['M',.66,.1,.45,2400,3700],['K',.13,.45,.8,3700,5200],['G',.08,.8,1.04,5200,6000],
  ['F',.06,1.04,1.4,6000,7500],['A',.04,1.4,2.1,7500,10000],['B',.026,2.1,16,10000,30000],['O',.004,16,60,30000,45000]
];
var HT=[[2500,6],[3700,15],[5200,32],[6000,48],[7500,58],[10000,205],[30000,222],[45000,230]];
function hueOfT(T){
  if(T<=0)return 0;
  if(T>=45000)return 232;
  if(T<=HT[0][0])return HT[0][1];
  for(var i=1;i<HT.length;i++){if(T<=HT[i][0]){var a=HT[i-1],b=HT[i];return Math.round(a[1]+(b[1]-a[1])*(T-a[0])/(b[0]-a[0]));}}
  return 232;
}

/* Bir yıldızın o andaki durumu (yaşa göre saf fonksiyon) */
function evalStar(s,t){
  var a=s._a0+t,life=s.life,m=s.mass,pt=Math.min(5,life*.1),L,T,ph,f,p,d;
  s.age=a;
  if(a<pt){ph='protostar';var q=a<0?0:a/pt;L=s._lz*(a<0?.03:.03+.97*q);T=s._t0*(a<0?.7:.7+.3*q);}
  else if(m>=8){
    if(a<=life*.95){ph='main';f=a/life;L=s._lz*(1+.5*f);T=s._t0*(1+.08*f);}
    else if(a<=life){ph='giant';p=(a-.95*life)/(.05*life);L=s._lz*1.5*(1+8*p);T=s._t0*(1-.45*p);}
    else if(m<25){ph='neutron';L=1e-5;T=100000;s.planetCount=0;}
    else{ph='blackhole';L=0;T=0;s.planetCount=0;}
  }else{
    if(a<=life){ph='main';f=a/life;L=s._lz*(1+.5*f);T=s._t0*(1+.08*f);}
    else if(a<=life*1.12){ph='giant';p=(a-life)/(.12*life);L=s._lz*1.5*Math.pow(40,p);T=s._t0*(1-.45*p);}
    else{ph='dwarf';d=a-life*1.12;L=Math.max(1e-5,.02*Math.exp(-d/2000));T=Math.max(3000,25000*Math.exp(-d/3000));}
  }
  s.phase=ph;s.lum=L;s.temp=Math.round(T);s.hue=hueOfT(T);
}

/* ---------- Galaksiler ---------- */
function genGalaxies(seed,P,r){
  var gs=[],kinds=['spiral','spiral','barred','elliptical','elliptical','irregular'],pos=[];
  for(var i=0;i<P.gal;i++){
    var kind=pick(kinds,r),rad=rr(r,.08,.2),x=0,y=0,k=0;
    for(;k<200;k++){
      x=rr(r,-.98+rad,.98-rad);y=rr(r,-.98+rad,.98-rad);
      var ok=true;for(var j=0;j<pos.length;j++){var dx=pos[j].x-x,dy=pos[j].y-y,m=pos[j].r+rad+.06;if(dx*dx+dy*dy<m*m){ok=false;break;}}
      if(ok)break;
    }
    pos.push({x:x,y:y,r:rad});
    var nm=genName(r,2+Math.floor(r()*2));if(r()<.4)nm+=' '+genName(r,2);
    gs.push({id:'g'+i,name:nm,kind:kind,x:r4(x),y:r4(y),r:r4(rad),rot:r4(rr(r,0,6.2832)),hue:Math.floor(rr(r,0,360)),
      arms:kind==='spiral'?2+Math.floor(r()*3):kind==='barred'?2:0,starCount:Math.round(P.stars*rr(r,.9,1.1))});
  }
  return gs;
}

var BASE={},BASEKEYS=[];
function starXY(g,r,i){ // galaksi yerel birimde (-1..1) konum
  var x,y,k=g.kind,th,rad;
  if(k==='spiral'||k==='barred'){
    if(r()<.3){rad=Math.min(.4,Math.abs(gauss(r))*.16);th=rr(r,0,6.2832);x=Math.cos(th)*rad*(k==='barred'?1.8:1);y=Math.sin(th)*rad;}
    else{var arm=Math.floor(r()*g.arms),t=rr(r,.05,1);rad=.1+.88*t;th=6.2832*arm/g.arms+t*3.6+gauss(r)*.18;x=Math.cos(th)*rad;y=Math.sin(th)*rad;}
  }else if(k==='elliptical'){x=gauss(r)*.3;y=gauss(r)*.3*.65;}
  else{var c=i%5;var cx=Math.cos(c*1.9+g.hue)*.5,cy=Math.sin(c*2.3+g.hue)*.5;x=cx+gauss(r)*.16;y=cy+gauss(r)*.16;}
  var d=Math.sqrt(x*x+y*y);if(d>.98){x*=.98/d;y*=.98/d;}
  return [r4(x),r4(y)];
}
function planetCountOf(r,cls,P,dead){
  var c;
  if(cls==='O'||dead)return 0;
  if(cls==='M'){var u=r();c=u<.25?0:u<.55?1:u<.8?2:u<.92?3:4;}
  else if(cls==='B')c=clamp(Math.round(1.2+gauss(r)*1),0,3);
  else if(cls==='A')c=clamp(Math.round(2+gauss(r)*1.4),0,5);
  else c=clamp(Math.round(3.5+gauss(r)*1.8),1,8);
  return clamp(Math.round(c*P.pl),0,8);
}
function baseStars(seed,g,P){
  var key=seed+'|'+g.id;
  if(BASE[key])return BASE[key];
  var r=SG.rng('G:'+seed+':'+g.id),out=[],names={};
  for(var i=0;i<g.starCount;i++){
    var u=r(),acc=0,c=CLS[0];
    for(var j=0;j<CLS.length;j++){acc+=CLS[j][1];if(u<=acc||j===CLS.length-1){c=CLS[j];break;}}
    var lo=c[2],hi=c[3],m=Math.exp(rr(r,Math.log(lo),Math.log(hi))),fr=(Math.log(m)-Math.log(lo))/(Math.log(hi)-Math.log(lo));
    var T0=c[4]*Math.pow(c[5]/c[4],fr),lm=lumM(m),lz=lm/1.25,life=clamp(10000*m/lm,3,1e6),a0,dead=false;
    u=r();
    if(u<.06)a0=-rr(r,20,1500);
    else if(life<BASE_AGE&&r()<.4){dead=true;a0=life*(m>=8?rr(r,1.02,1.6):rr(r,1.15,1.9));}
    else a0=rr(r,0,Math.min(BASE_AGE,life*.96));
    var nm=genName(r,2+Math.floor(r()*2)),tries=0;
    while(names[nm]&&tries++<5)nm=genName(r,2+Math.floor(r()*2));
    if(names[nm])nm+=' '+(i+1);names[nm]=1;
    var xy=starXY(g,r,i);
    out.push({id:g.id+'s'+i,name:nm,x:xy[0],y:xy[1],cls:c[0],mass:r3(m),t0:T0,lz:lz,life:Math.round(life*100)/100,a0:a0,
      pc:planetCountOf(r,c[0],P,dead&&m>=8)});
  }
  BASE[key]=out;BASEKEYS.push(key);
  if(BASEKEYS.length>36){delete BASE[BASEKEYS.shift()];}
  return out;
}

/* ---------- Evren meta (kayda yazılmaz) ---------- */
var METAS=typeof WeakMap!=='undefined'?new WeakMap():null;
function meta(uni){
  var M=METAS.get(uni);
  if(M)return M;
  uni.state=uni.state||{};var S=uni.state;
  S.observed=S.observed||{};S.params=S.params||{};S.decisions=S.decisions||[];S.disc=S.disc||{};S.events=S.events||[];S.journal=S.journal||[];
  if(typeof uni.t!=='number')uni.t=0;
  if(typeof uni.speedIx!=='number')uni.speedIx=1;
  M={gal:{},sys:{},sysOrder:[],sched:null,si:0,nb:Math.ceil(uni.t),q:[],credit:GAP*.5,lastFull:uni.t,dropped:0,counter:0};
  METAS.set(uni,M);return M;
}
function P_(uni){return PRESETS[uni.preset]||PRESETS.sakin;}

U.galaxy=function(uni,gid){
  if(!uni||!uni.galaxies)return null;
  var M=meta(uni),G=M.gal[gid];
  if(G)return G;
  var g=null;for(var i=0;i<uni.galaxies.length;i++)if(uni.galaxies[i].id===gid){g=uni.galaxies[i];break;}
  if(!g)return null;
  var base=baseStars(uni.seed,g,P_(uni)),stars=new Array(base.length);
  for(var k=0;k<base.length;k++){
    var b=base[k],s={id:b.id,name:b.name,x:b.x,y:b.y,cls:b.cls,mass:b.mass,lum:0,temp:0,age:0,life:b.life,phase:'main',hue:0,planetCount:b.pc,
      _a0:b.a0,_lz:b.lz,_t0:b.t0};
    evalStar(s,uni.t);stars[k]=s;
  }
  G={id:gid,stars:stars};M.gal[gid]=G;return G;
};

/* ---------- İklim (basit) ---------- */
function labelOfT(T){return T<223?'Dondurucu':T<273?'Soğuk':T<=303?'Ilıman':T<=353?'Sıcak':'Kavurucu';}
U.climate=function(planet,params,star){
  params=params||{};
  var L=star&&star.lum>0?star.lum:0,a=Math.max(.01,planet.a||1);
  var atm=params.atm!=null?params.atm:(planet.atm!=null?planet.atm:1);
  var water=params.water!=null?params.water:(planet.water!=null?planet.water:1);
  var alb=params.albedo!=null?params.albedo:(planet.albedo!=null?planet.albedo:.3);
  var gas=planet.type==='gas'||planet.type==='ringed';
  var Teq=278.5*Math.pow(L,.25)*Math.pow(1-alb,.25)/Math.sqrt(a),T;
  if(gas)T=Teq;
  else{
    T=Teq+33*Math.pow(Math.max(0,atm),1.3)*(.6+.4*Math.min(water,2));
    if(T>340&&water>0)T+=Math.min(500,(T-340)*1.5)*Math.min(1,water);
  }
  T=clamp(T,3,1500);
  var fT=(T>=275&&T<=301)?1:Math.exp(-Math.pow((T<275?275-T:T-301)/22,2));
  var fW=water<.6?.15+.85*water/.6:water<=1.4?1:Math.max(.7,1-(water-1.4)*.5);
  var fA=atm<.4?.1+.9*Math.max(0,atm)/.4:atm<=1.5?1:Math.max(.5,1-(atm-1.5));
  var rd=planet.radius||1,fR=rd<.6?rd/.6:rd<=1.8?1:Math.max(0,1-(rd-1.8)/1.2);
  var tf={rocky:1,ocean:1,desert:.9,ice:.8,lava:.1,gas:0,ringed:0}[planet.type];if(tf==null)tf=.5;
  var life=star&&star.life?star.life:1500,sF=Math.min(1,life/1500)*(star&&star.phase==='protostar'?.3:1);
  var hs=gas?0:fT*fW*fA*fR*tf*sF;
  return {temp:Math.round(T*10)/10,habScore:Math.round(clamp(hs,0,1)*1000)/1000,label:labelOfT(T)};
};

/* ---------- Yıldız sistemleri ---------- */
function hz(L){return [Math.sqrt(L/1.1),Math.sqrt(L/.53)];}
function typeOf(r,a,Lr){
  var T=255*Math.pow(Lr,.25)/Math.sqrt(a),u=r(),frost=a>2.7*Math.sqrt(Lr);
  if(frost)return u<.38?'gas':u<.55?'ringed':'ice';
  if(T>650)return u<.6?'lava':u<.85?'desert':u<.95?'rocky':'gas';
  if(T>200)return u<.5?'rocky':u<.75?'ocean':u<.9?'desert':'ice';
  return u<.4?'rocky':u<.85?'ice':'desert';
}
var RAD={rocky:[.4,1.8],ocean:[.8,2],desert:[.5,1.4],lava:[.4,1.5],ice:[.3,4.5],gas:[6,13],ringed:[6,11]};
var DEF={rocky:[1,.5,.3],ocean:[1.1,1.6,.3],desert:[.6,.05,.25],lava:[1.2,0,.1],ice:[.3,1,.6],gas:[2,0,.34],ringed:[2,0,.34]};
function genSystem(uni,star){
  var r=SG.rng('S:'+uni.seed+':'+star.id),n=star.planetCount,planets=[];
  var Lr=star._lz*1.25,a0=Math.max(.012,Math.sqrt(Lr)*rr(r,.12,.4)),ratio=rr(r,1.4,1.85);
  for(var i=0;i<n;i++){
    var a=a0*Math.pow(ratio,i)*rr(r,.93,1.07),type=typeOf(r,a,Lr),rg=RAD[type],gas=type==='gas'||type==='ringed';
    var rad=r3(rr(r,rg[0],rg[1])),mass=gas?1.2*Math.pow(rad,2.3):Math.pow(rad,3.5);
    var d=DEF[type],dv={atm:r3(clamp(d[0]*rr(r,.7,1.3),0,2)),water:r3(clamp(d[1]*rr(r,.6,1.4),0,2)),albedo:r3(clamp(d[2]+rr(r,-.05,.05),.02,.9))};
    var pid=star.id+'p'+i,pname=star.name+' '+GREEK.charAt(i%GREEK.length),moons=[],mc=0,u=r();
    if(gas)mc=1+Math.floor(r()*4);else if(type==='ice')mc=u<.4?0:u<.75?1:2;else mc=u<.55?0:u<.85?1:2;
    for(var k=0;k<mc;k++)moons.push({id:pid+'m'+k,name:pname+' '+ROMAN[k],a:Math.round((60+rr(r,40,160)*(k+1))*(gas?3:1)),radius:r3(rr(r,.02,.28)),period:r3(rr(r,1,40))});
    planets.push({id:pid,name:pname,a:r4(a),period:Math.round(365.25*Math.sqrt(a*a*a/star.mass)*100)/100,radius:rad,mass:r3(mass),type:type,
      temp:0,atm:dv.atm,water:dv.water,albedo:dv.albedo,moons:moons,habZone:false,habScore:0,hue:Math.floor(rr(r,0,360)),_d:dv});
  }
  return planets;
}
function syncSystem(uni,sys){
  var star=sys.star,S=uni.state;
  if(star.planetCount===0&&sys.planets.length)sys.planets=[];
  var z=hz(Math.max(1e-9,star.lum));sys.hzIn=r4(star.lum>0?z[0]:0);sys.hzOut=r4(star.lum>0?z[1]:0);
  for(var i=0;i<sys.planets.length;i++){
    var p=sys.planets[i],o=S.params[p.id];
    p.atm=o&&o.atm!=null?o.atm:p._d.atm;p.water=o&&o.water!=null?o.water:p._d.water;p.albedo=o&&o.albedo!=null?o.albedo:p._d.albedo;
    var c=U.climate(p,null,star);p.temp=c.temp;p.habScore=c.habScore;p.habLabel=c.label;
    p.habZone=star.lum>0&&p.a>=sys.hzIn&&p.a<=sys.hzOut;
  }
}
U.system=function(uni,sid){
  if(!uni||!uni.galaxies)return null;
  var m=/^(g\d+)s(\d+)$/.exec(sid);if(!m)return null;
  var G=U.galaxy(uni,m[1]);if(!G)return null;
  var star=G.stars[+m[2]];if(!star)return null;
  var M=meta(uni),sys=M.sys[sid];
  if(sys&&sys.forming&&star.age>=20){delete M.sys[sid];sys=null;}
  if(!sys){
    var forming=star.age<20;
    sys={id:sid,star:star,planets:forming?[]:genSystem(uni,star),forming:forming,hzIn:0,hzOut:0};
    M.sys[sid]=sys;M.sysOrder.push(sid);
    if(M.sysOrder.length>6)delete M.sys[M.sysOrder.shift()];
  }
  syncSystem(uni,sys);
  return sys;
};
U.setParams=function(uni,pid,patch){
  var m=/^(g\d+s\d+)p\d+$/.exec(pid);if(!m||!patch)return null;
  var sys=U.system(uni,m[1]);if(!sys)return null;
  var p=null;for(var i=0;i<sys.planets.length;i++)if(sys.planets[i].id===pid)p=sys.planets[i];
  if(!p)return null;
  var o=uni.state.params[pid]=uni.state.params[pid]||{};
  if(patch.atm!=null)o.atm=clamp(+patch.atm||0,0,2);
  if(patch.water!=null)o.water=clamp(+patch.water||0,0,2);
  if(patch.albedo!=null)o.albedo=clamp(+patch.albedo||0,.02,.9);
  syncSystem(uni,sys);return p;
};

U.find=function(uni,id){
  if(!uni||typeof id!=='string')return null;
  var m=/^g(\d+)(?:s(\d+)(?:p(\d+)(?:m(\d+))?)?)?$/.exec(id);if(!m)return null;
  var gid='g'+m[1];
  if(m[2]==null){for(var i=0;i<uni.galaxies.length;i++)if(uni.galaxies[i].id===gid)return uni.galaxies[i];return null;}
  var G=U.galaxy(uni,gid);if(!G)return null;
  var s=G.stars[+m[2]];if(!s)return null;
  if(m[3]==null)return s;
  var sys=U.system(uni,gid+'s'+m[2]);if(!sys)return null;
  var p=sys.planets[+m[3]];if(!p)return null;
  if(m[4]==null)return p;
  return p.moons[+m[4]]||null;
};

/* ---------- Gen ---------- */
U.gen=function(seed,opts){
  opts=opts||{};seed=String(seed==null?'':seed);
  var preset=PRESETS[opts.preset]?opts.preset:'sakin',P=PRESETS[preset],r=SG.rng('U:'+seed+':'+preset);
  var created=opts.created||Date.now();
  var uni={v:2,id:'u'+(SG.hash(seed+'|'+created)>>>0).toString(36),name:opts.name||(genName(r,2+Math.floor(r()*2))+' Evreni'),seed:seed,preset:preset,
    t:0,speedIx:1,created:created,galaxies:genGalaxies(seed,P,r),
    state:{observed:{},params:{},decisions:[],disc:{},events:[],journal:[]}};
  return uni;
};

/* ---------- Zaman ve olaylar ---------- */
U.SPEEDS=SPEEDS;U.BASE_AGE=BASE_AGE;
U.setSpeed=function(uni,ix){ix=clamp(Math.round(+ix||0),0,SPEEDS.length-1);uni.speedIx=ix;return SPEEDS[ix];};
U.cosmicLabel=function(t){
  var a=BASE_AGE+(t||0),n;
  if(a<1000)return Math.round(a)+' milyon yıl';
  if(a<1e6){n=(a/1000).toFixed(1).replace('.',',');return n+' milyar yıl';}
  n=(a/1e6).toFixed(2).replace('.',',');return n+' trilyon yıl';
};

function gidOf(id){var m=/^(g\d+)/.exec(id);return m?m[1]:'';}
function mkEvent(M,type,t,target,sev,text){
  return {id:'e'+(SG.hash(type+target+Math.round(t*100))>>>0).toString(36)+(M.counter++).toString(36),type:type,t:Math.round(t*100)/100,target:target,galaxy:gidOf(target),severity:sev,text:text};
}
function textFor(kind,s,t0,M,uni){
  var n=s.name;
  switch(kind){
    case'nebula':return['nebula',1,n+' çevresindeki gaz bulutu çökmeye başladı.'];
    case'birth':return['stellar-birth',1,n+' adlı yeni bir yıldız doğdu.'];
    case'shift1':return['habitable-shift',1,n+' giderek parlaklaşıyor; yaşanabilir kuşak dışa doğru kayıyor.'];
    case'shift2':return['habitable-shift',2,n+' belirgin biçimde ısındı; yaşanabilir kuşak hızla kayıyor.'];
    case'giant':return['habitable-shift',2,n+' kızıl deve dönüşüyor; yaşanabilir kuşak dışa kaydı.'];
    case'dwarf':return['star-dies',2,n+' dış katmanlarını savurdu ve beyaz cüceye dönüştü.'];
    case'supernova':return['supernova',3,n+' süpernova olarak patladı; geriye '+(s.mass<25?'bir nötron yıldızı':'bir kara delik')+' kaldı.'];
  }
  return null;
}
function buildSched(uni,M){
  var list=[],t0=uni.t;
  for(var gi=0;gi<uni.galaxies.length;gi++){
    var G=U.galaxy(uni,uni.galaxies[gi].id);
    for(var i=0;i<G.stars.length;i++){
      var s=G.stars[i],a0=s._a0,life=s.life,m=s.mass,pc=s.planetCount,pt=Math.min(5,life*.1);
      var add=function(age,kind){var tt=age-a0;if(tt>t0&&tt<1e6)list.push({t:tt,s:s,k:kind});};
      add(-10,'nebula');add(0,'birth');add(pt,null);
      if(pc>0&&m>=.5&&m<=3){add(.55*life,'shift1');add(.85*life,'shift2');}
      if(m>=8){add(.95*life,null);add(life,'supernova');}
      else{add(life,pc>0?'giant':null);add(1.12*life,'dwarf');}
    }
  }
  list.sort(function(x,y){return x.t-y.t||(x.s.id<y.s.id?-1:1);});
  M.sched=list;M.si=0;
}
U.warm=function(uni){var M=meta(uni);if(!M.sched)buildSched(uni,M);return uni;};

function queue(M,ev){
  var q=M.q;q.push(ev);
  if(q.length>QMAX){var w=0;for(var i=1;i<q.length;i++)if(q[i].severity<q[w].severity)w=i;q.splice(w,1);M.dropped++;}
}
function randomCandidate(uni,M,k){
  var r=SG.rng('E:'+uni.seed+':'+k),P=P_(uni);
  if(r()>=P.lam)return;
  var tt=k+r(),u=r(),gal=uni.galaxies[Math.floor(r()*uni.galaxies.length)],G=U.galaxy(uni,gal.id),s,i,ev;
  if(u<.6){ // kuyruklu yıldız
    for(i=0;i<40;i++){s=G.stars[Math.floor(r()*G.stars.length)];if(s.planetCount>0&&(s.phase==='main'||s.phase==='giant'))break;s=null;}
    if(s)queue(M,mkEvent(M,'comet',tt,s.id,1,'Bir kuyruklu yıldız '+s.name+' sisteminden geçti.'));
  }else if(u<.85){
    queue(M,mkEvent(M,'nebula',tt,gal.id,1,gal.name+' galaksisinde yeni bir yıldız bulutsusu parladı.'));
  }else if(u<.97){
    for(i=0;i<60;i++){s=G.stars[Math.floor(r()*G.stars.length)];if(s.phase==='dwarf')break;s=null;}
    if(s)queue(M,mkEvent(M,'nova',tt,s.id,2,'Beyaz cüce '+s.name+' ani bir parlama yaşadı (nova).'));
  }else{
    var o=uni.galaxies[Math.floor(r()*uni.galaxies.length)];
    if(o.id!==gal.id)queue(M,mkEvent(M,'collision',tt,gal.id,2,gal.name+' ve '+o.name+' galaksileri birbirine yaklaşıyor.'));
  }
}
function emit(uni,ev){
  var S=uni.state;
  S.events.push(ev);if(S.events.length>100)S.events.shift();
  S.journal.push({t:ev.t,kind:'event',text:ev.text,target:ev.target});if(S.journal.length>300)S.journal.shift();
  try{if(SG.bus&&SG.bus.emit)SG.bus.emit('u:event',ev);}catch(e){}
}
U.step=function(uni,dtMyr){
  if(!uni||!(dtMyr>0))return [];
  var M=meta(uni);if(!M.sched)buildSched(uni,M);
  var t1=uni.t+dtMyr,gi,i,G;uni.t=t1;
  for(gi=0;gi<uni.galaxies.length;gi++){G=M.gal[uni.galaxies[gi].id];if(G){var st=G.stars;for(i=0;i<st.length;i++){var x=st[i];x.age=x._a0+t1;if(x.phase==='giant'||x.phase==='protostar')evalStar(x,t1);}}}
  var sc=M.sched;
  while(M.si<sc.length&&sc[M.si].t<=t1){
    var e=sc[M.si++];evalStar(e.s,t1);
    if(e.k){var d=textFor(e.k,e.s);if(d)queue(M,mkEvent(M,d[0],e.t,e.s.id,d[1],d[2]));}
  }
  if(t1-M.lastFull>=20){
    M.lastFull=t1;
    for(gi=0;gi<uni.galaxies.length;gi++){G=M.gal[uni.galaxies[gi].id];if(G)for(i=0;i<G.stars.length;i++)evalStar(G.stars[i],t1);}
  }
  var last=Math.floor(t1)-1;
  if(last-M.nb>400)M.nb=last-400;
  while(M.nb<=last){randomCandidate(uni,M,M.nb);M.nb++;}
  for(var k=0;k<M.sysOrder.length;k++){var sy=M.sys[M.sysOrder[k]];if(sy)syncSystem(uni,sy);}
  var sp=SPEEDS[uni.speedIx],dtReal=sp>0?dtMyr/sp:dtMyr;
  M.credit=Math.min(GAP,M.credit+dtReal);
  var out=[];
  if(M.credit>=GAP&&M.q.length){
    var q=M.q,b=0;
    for(i=1;i<q.length;i++)if(q[i].severity>q[b].severity||(q[i].severity===q[b].severity&&q[i].t<q[b].t))b=i;
    var ev=q.splice(b,1)[0];M.credit-=GAP;emit(uni,ev);out.push(ev);
  }
  return out;
};
U.tick=function(uni,dtSec){return U.step(uni,dtSec*SPEEDS[uni.speedIx||0]);};

/* ---------- Gözlem ve yörünge ---------- */
U.observe=function(uni,id){
  if(!U.find(uni,id))return 0;
  var o=uni.state.observed,l=Math.min(3,(o[id]||0)+1);o[id]=l;return l;
};
U.orbitPos=function(p,ts){
  var per=clamp(6*Math.sqrt((p.period||30)/365.25),6,160),ph=(SG.hash(p.id||'x')%6283)/1000,ang=ph+ts*6.283185307/per;
  return {x:Math.cos(ang),y:Math.sin(ang),angle:ang};
};

/* ---------- Bilimsel dürüstlük etiketleri ---------- */
U.TAGS={
  starClass:'gercek',starMass:'basit',luminosity:'basit',lifetime:'basit',phase:'basit',temp:'basit',starColor:'basit',
  orbitPeriod:'gercek',orbitSpacing:'basit',habZone:'basit',planetType:'basit',planetRadius:'basit',planetMass:'basit',
  atm:'basit',water:'basit',albedo:'basit',habScore:'kurgu',moons:'kurgu',galaxyKind:'gercek',galaxyLayout:'basit',galaxyPos:'kurgu',
  events:'basit',eventRates:'kurgu',cosmicTime:'basit',names:'kurgu',orbitVisual:'kurgu'
};
U._meta=function(uni){return meta(uni);};
})();
