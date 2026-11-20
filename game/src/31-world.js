/* SpacEgg v1.0 — dünya render: yıldız akışı, gezegen, efektler, galaksi haritası (2B canvas, WebGL yok)
   Fikir kaynakları (kod kopyalanmadı, hepsi bu dosyada sıfırdan yazıldı):
   - dgreenheck/threejs-procedural-planets (MIT, (c) 2023 Daniel Greenheck): kabartma gölgelendirme, bulut yoğunluk sapması, gezegen başına arazi parametresi fikirleri.
   - Lucas Moura / space-3d (Unlicense, kamu malı): alan bükmeli fbm bulutsu, pow(rand,4) yıldız parlaklığı, tohumdan palet, üstel hale fikirleri.
   - realtime-planet-shader (GPL): YALNIZCA genel teknik fikir (güneşe duyarlı atmosfer, hava kütlesi, halka gölgesi, Fresnel); koddan hiçbir şey alınmadı. */
(function(){
'use strict';
var SG=window.SG;if(!SG)return;
var W=SG.W=SG.W||{};
var TAU=Math.PI*2,PI=Math.PI;
function cl(v,a,b){return v<a?a:v>b?b:v;}
function sm(a,b,x){var t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);}
function dpr(){return Math.min(1.5,window.devicePixelRatio||1);}
function pc(c){
  if(Array.isArray(c))return c;
  if(typeof c!=='string')return [255,255,255];
  var m=/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if(!m){m=/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/.exec(c);return m?[+m[1],+m[2],+m[3]]:[255,255,255];}
  var h=m[1];if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var n=parseInt(h,16);return [n>>16,(n>>8)&255,n&255];
}
function rgba(c,a){return 'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+a+')';}
function mixc(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
var seq=0;

/* ---------- kalite (4 kademe: 0 düşük, 1 orta, 2 yüksek, 3 ultra; auto 2'den başlar) ---------- */
function qParse(v){
  if(v==null||v==='auto')return {auto:true,q:2};
  if(typeof v==='number')return {auto:false,q:cl(v|0,0,3)};
  var m={low:0,mid:1,high:3,ultra:3};
  return m[v]!=null?{auto:false,q:m[v]}:{auto:true,q:2};
}
function QMon(owner,budget){
  var m={n:0,sum:0,work:0,t:0,good:0,downAt:-99,tt:0};
  m.tick=function(dt,work,now){
    if(!owner.qAuto)return;
    m.n++;m.sum+=dt;m.work+=work;m.t+=dt;m.tt=now;
    if(m.t<1.6)return;
    var avg=m.sum/m.n,aw=m.work/m.n;
    if(avg>budget*1.5&&owner.q>0){owner.setTier(owner.q-1);m.downAt=now;m.good=0;}
    else if(aw<budget*0.3&&avg<budget*1.2&&owner.q<3&&now-m.downAt>25){m.good++;if(m.good>=3){owner.setTier(owner.q+1);m.good=0;}}
    else m.good=0;
    m.n=0;m.sum=0;m.work=0;m.t=0;
  };
  return m;
}

/* ---------- gürültü ---------- */
function Noise(seed){
  var r=SG.rng(seed>>>0),p=new Uint8Array(512),v=new Float32Array(256),i,j,t;
  for(i=0;i<256;i++){p[i]=i;v[i]=r();}
  for(i=255;i>0;i--){j=(r()*(i+1))|0;t=p[i];p[i]=p[j];p[j]=t;}
  for(i=0;i<256;i++)p[i+256]=p[i];
  return function(x,y,z){
    var xf=Math.floor(x),yf=Math.floor(y),zf=Math.floor(z),xi=xf&255,yi=yf&255,zi=zf&255;
    x-=xf;y-=yf;z-=zf;
    var u=x*x*(3-2*x),w=y*y*(3-2*y),s=z*z*(3-2*z);
    var a=p[xi]+yi,b=p[xi+1]+yi,aa=p[a]+zi,ab=p[a+1]+zi,ba=p[b]+zi,bb=p[b+1]+zi;
    var x00=v[p[aa]]+(v[p[ba]]-v[p[aa]])*u,x10=v[p[ab]]+(v[p[bb]]-v[p[ab]])*u;
    var x01=v[p[aa+1]]+(v[p[ba+1]]-v[p[aa+1]])*u,x11=v[p[ab+1]]+(v[p[bb+1]]-v[p[ab+1]])*u;
    var y0=x00+(x10-x00)*w,y1=x01+(x11-x01)*w;
    return y0+(y1-y0)*s;
  };
}
function fbm(n,x,y,z,o){var s=0,a=0.5,f=1,t=0;for(var k=0;k<o;k++){s+=a*n(x*f,y*f,z*f);t+=a;a*=0.5;f*=2.03;}return s/t;}
function fbmP(n,x,y,z,o,pe,lc){var s=0,a=0.5,f=1,t=0;for(var k=0;k<o;k++){s+=a*n(x*f,y*f,z*f);t+=a;a*=pe;f*=lc;}return s/t;}
function ridge(v){return 1-Math.abs(2*v-1);}
var TV2_AT=1794916800000; /* bu zamandan sonra doğan gezegenler (veya p.tv===2) yeni arazi parametresi alır; eski kayıtlı haritalar değişmez */

/* ---------- gezegen türleri (varsayılan paletler; SG.D.PLANETKINDS üstüne yazar) ---------- */
var KINDS={
  okyanus:{name:'Okyanus',base:[[6,24,80],[30,120,200],[215,200,140]],atmo:[90,160,255],ter:1,S:0.53,cloud:1,life:1},
  orman:{name:'Orman',base:[[8,40,70],[30,120,150],[40,110,50]],atmo:[110,230,160],ter:1,S:0.46,cloud:1,life:1,veg0:3},
  derin:{name:'Derin okyanus',base:[[2,14,60],[14,70,150],[120,200,230]],atmo:[70,150,255],ter:1,S:0.74,cloud:1,life:1},
  col:{name:'Çöl',base:[[150,95,45],[214,165,95],[240,215,160]],atmo:[255,190,120],cloud:0.35},
  kayalik:{name:'Kayalık',base:[[60,56,54],[122,112,102],[180,170,158]],atmo:[200,200,210],cloud:0},
  lav:{name:'Lav',base:[[20,10,10],[120,25,8],[255,150,30]],atmo:[255,120,40],cloud:0},
  buz:{name:'Buz',base:[[120,160,200],[200,225,245],[250,253,255]],atmo:[190,220,255],cloud:0.4},
  gaz:{name:'Gaz devi',base:[[120,80,50],[205,160,110],[240,220,180]],atmo:[255,220,170],cloud:0,gas:1,ringP:0.5},
  buzdev:{name:'Buz devi',base:[[20,50,140],[60,120,210],[170,215,250]],atmo:[120,170,255],cloud:0,gas:1,ringP:0.3},
  karbon:{name:'Karbon',base:[[18,18,22],[48,42,50],[130,110,95]],atmo:[150,130,120],cloud:0},
  kthon:{name:'Kthonyen çekirdek',base:[[24,6,6],[90,18,12],[255,110,40]],atmo:[255,100,60],cloud:0},
  pulsar:{name:'Pulsar gezegeni',base:[[50,40,90],[130,110,190],[220,205,255]],atmo:[190,150,255],cloud:0,aurora:1},
  serbest:{name:'Serbest gezegen',base:[[6,8,20],[18,26,50],[90,120,170]],atmo:[100,130,200],cloud:0},
  mininept:{name:'Mini-Neptün',base:[[60,120,160],[110,185,210],[200,235,240]],atmo:[140,230,240],cloud:0,gas:1,ringP:0.15},
  mars:{name:'Kızıl kayalık',base:[[70,30,20],[150,70,44],[210,130,90]],atmo:[230,150,110],cloud:0.15},
  zumrut:{name:'Zümrüt dev',base:[[20,70,50],[70,150,90],[200,235,170]],atmo:[150,240,170],cloud:0,gas:1,ringP:0.2},
  ay:{name:'Ay',base:[[70,70,74],[128,126,122],[190,188,182]],atmo:[200,200,200],cloud:0}
};
var KLIST=['okyanus','orman','derin','col','kayalik','lav','buz','gaz','buzdev','karbon','kthon','pulsar','serbest','mininept'];
W.kinds=function(){return KLIST.slice();};
function kindInfo(id){
  var k=KINDS[id]||KINDS.kayalik,o={},p;
  for(p in k)o[p]=k[p];
  var ov=SG.D&&SG.D.PLANETKINDS&&SG.D.PLANETKINDS[id];
  if(ov){
    if(ov.base&&ov.base.length>=3)o.base=[pc(ov.base[0]),pc(ov.base[1]),pc(ov.base[2])];
    if(ov.atmo)o.atmo=pc(ov.atmo);
    if(ov.ring!=null)o.ringP=ov.ring?1:0;
    if(ov.name)o.name=ov.name;
  }
  o.id=id;return o;
}
function lvBucket(l){
  l=Math.max(1,l|0);
  if(l<=8)return l<=4?l:5;
  if(l<=14)return l;
  if(l<22)return 15;
  return 22+Math.floor((l-22)/4)*4;
}

/* ---------- doku üretimi (boylam-enlem, dikişsiz 3B gürültü) ---------- */
var tmp=[0,0,0];
function C3(a,b,c,t,o){
  t=t<0?0:t>1?1:t;
  if(t<0.5){var u=t*2;o[0]=a[0]+(b[0]-a[0])*u;o[1]=a[1]+(b[1]-a[1])*u;o[2]=a[2]+(b[2]-a[2])*u;}
  else{var w=t*2-1;o[0]=b[0]+(c[0]-b[0])*w;o[1]=b[1]+(c[1]-b[1])*w;o[2]=b[2]+(c[2]-b[2])*w;}
}
function CM(o,c,t){o[0]+=(c[0]-o[0])*t;o[1]+=(c[1]-o[1])*t;o[2]+=(c[2]-o[2])*t;}
var SNOW=[240,246,252],ROCKD=[58,48,42],ROCKL=[124,108,94],FOR1=[22,84,36],FOR2=[70,128,48],TUND=[150,162,140],DESERT=[205,165,104],COAST=[70,200,205],BASALT=[34,28,28],LAVA1=[180,40,10],LAVA2=[255,170,40];
/* kabartma: yükseklikten (3x3 bulanık + merkezî fark) doğu/kuzey eğimi, Int8; ışık bileşeni paint'te ekranda uygulanır */
function reliefMaps(hg,TW,TH){
  var N=TW*TH,hb=new Float32Array(N),sE=new Int8Array(N),sN=new Int8Array(N),u,v;
  for(v=0;v<TH;v++){var v0=v>0?v-1:0,v1=v<TH-1?v+1:TH-1;
    for(u=0;u<TW;u++){var u0=u>0?u-1:TW-1,u1=u<TW-1?u+1:0;
      hb[v*TW+u]=(hg[v0*TW+u0]+2*hg[v0*TW+u]+hg[v0*TW+u1]+2*hg[v*TW+u0]+4*hg[v*TW+u]+2*hg[v*TW+u1]+hg[v1*TW+u0]+2*hg[v1*TW+u]+hg[v1*TW+u1])/16;}}
  for(v=0;v<TH;v++){var la=(0.5-(v+0.5)/TH)*PI,du=(TAU/TW)*Math.max(0.2,Math.cos(la)),dv=PI/TH,a=v>0?v-1:0,b=v<TH-1?v+1:TH-1;
    for(u=0;u<TW;u++){var l=u>0?u-1:TW-1,r=u<TW-1?u+1:0,k=v*TW+u;
      var e=Math.round((hb[v*TW+r]-hb[v*TW+l])/(2*du)*40),n=Math.round(-(hb[b*TW+u]-hb[a*TW+u])/((b-a)*dv)*40);
      sE[k]=e<-127?-127:e>127?127:e;sN[k]=n<-127?-127:n>127?127:n;}}
  return {sE:sE,sN:sN};
}
function genTex(info,seed,lvl,type,TW,TH,relief,tv){
  var N=TW*TH,rgba=new Uint8ClampedArray(N*4),wm=new Uint8Array(N),cd=new Uint8Array(N),ct=new Uint8Array(N),em=new Uint8Array(N),hg=relief?new Float32Array(N):null;
  var n1=Noise(seed),n2=Noise(seed^0x9e3779b9),n3=Noise(seed^0x51ed270b),n4=Noise((seed*7+13)>>>0);
  var pal=info.base,pw=pal[0],pm=pal[1],ph=pal[2],kind=info.id,o=[0,0,0];
  var heat=cl((4-lvl)/3,0,1),seaK=cl((lvl-3)/3,0,1);
  var life=!!info.life,veg=life?cl((lvl-(info.veg0||8))/(info.veg0?4:6),0,1):0;
  var cityStart=type==='med'?14:22,cityAmt=info.ter?cl((lvl-cityStart)/20,0,1):0;
  var cloudK=info.cloud?cl((lvl-3)/3,0,1)*info.cloud:0;
  if(info.gas)cloudK=0;
  var gasShift=((seed>>>3)%100)/100;
  var tF=1.6,tP=0.5,tL=2.03,tC=1.7;
  if(tv===2){var pr=SG.rng((seed^0x7f4a7c15)>>>0);tF=1.15+pr()*1.0;tP=0.40+pr()*0.18;tL=1.9+pr()*0.35;tC=1.45+pr()*0.6;}
  for(var v=0;v<TH;v++){
    var lat=(0.5-(v+0.5)/TH)*PI,cla=Math.cos(lat),sla=Math.sin(lat),a=Math.abs(lat)/(PI/2);
    for(var u=0;u<TW;u++){
      var lon=(u+0.5)/TW*TAU,x=cla*Math.cos(lon),y=sla,z=cla*Math.sin(lon),i=v*TW+u;
      var h=fbmP(n1,x*tF+3,y*tF,z*tF,5,tP,tL);h=cl((h-0.5)*tC+0.5,0,1);
      var w=0,e_=0,c_=0,hv=h;
      var h2=n2(x*2.2,y*2.2,z*2.2);
      if(info.ter){
        var S=info.S*seaK; // su yok -> bazalt
        var tmpH=h;
        if(tmpH<S&&seaK>0.2){
          var depth=cl((S-tmpH)/S,0,1);
          C3(pm,pw,pw,Math.pow(depth,0.7)*1.4,o);
          var coast=1-sm(0,0.07,S-tmpH);
          if(coast>0&&seaK>0.5)CM(o,COAST,coast*0.5);
          if(kind==='derin'&&lvl>=6){var pl=fbm(n3,x*3,y*3,z*3,3);if(pl>0.58)CM(o,[30,160,120],sm(0.58,0.75,pl)*0.4);}
          w=255;hv=S;
        }else{
          var el=cl((tmpH-S)/(1-S+1e-3),0,1);
          var temp=1-a*1.15+(h2-0.5)*0.25-el*0.5,moist=n3(x*2.6,y*2.6,z*2.6);
          C3(ROCKD,ROCKL,ROCKL,el*1.2+(h2-0.5)*0.4,o);
          if(seaK<0.2)CM(o,BASALT,0.7);
          if(veg>0){
            var bio=[0,0,0];
            if(temp>0.55&&moist<0.42&&kind!=='orman'){C3(DESERT,DESERT,[225,190,130],h2,bio);}
            else if(temp<0.26){bio[0]=TUND[0];bio[1]=TUND[1];bio[2]=TUND[2];}
            else C3(FOR1,FOR2,FOR2,moist*1.3-0.1,bio);
            if(kind==='orman'&&temp>=0.26)C3(FOR1,FOR2,[90,150,60],moist,bio);
            CM(o,bio,veg*0.95);
            if(el<0.04&&seaK>0.5)CM(o,[214,200,150],0.7*veg);
          }
          var snow=Math.max(sm(0.2,0.04,temp),sm(0.74,0.9,el));
          if(snow>0&&seaK>=0.5)CM(o,SNOW,snow);
          if(cityAmt>0&&temp>0.12&&el<0.6){
            var cn=fbm(n4,x*3.5,y*3.5,z*3.5,3),thr=0.8-0.2*cityAmt;
            if(cn>thr)c_=cl((cn-thr)/(1-thr)*3.5,0,1)*255;
          }
        }
        if(heat>0){
          var rr=ridge(fbm(n3,x*2.4,y*2.4,z*2.4,4)),crack=sm(0.72,0.95,rr);
          var crust=[20+h*30,12+h*14,10+h*10];
          CM(o,crust,heat*0.9);
          CM(o,LAVA2,heat*crack*0.9);
          if(crack>0)e_=Math.max(e_,heat*crack*255);
          if(heat>0.9&&h<0.45){CM(o,LAVA1,0.5);e_=Math.max(e_,170);}
        }
        if(cloudK>0){var cc=fbm(n4,x*1.5+7,y*2.2,z*1.5,5),th0=0.5+(1-Math.min(1,cloudK/info.cloud))*0.2;cd[i]=cl(sm(th0,th0+0.24,cc)*255,0,255);}
      }else if(info.gas){
        hv=0.5;
        var wob=fbm(n1,x*1.4,y*0.6+3,z*1.4,4)-0.5;
        var bands=kind==='gaz'?10:kind==='buzdev'?6:4;
        var bv=lat*bands+wob*(kind==='mininept'?1.2:2.6)+gasShift*6.28;
        var t=0.5+0.5*Math.sin(bv),fine=fbm(n2,x*5,y*18,z*5,3);
        t=cl(t*0.62+fine*0.5-0.1+(kind==='mininept'?0.1:0),0,1);
        C3(pw,pm,ph,t,o);
        if(kind==='mininept'){CM(o,[210,240,245],0.22);}
        if(kind==='gaz'||kind==='buzdev'){
          var slat=kind==='gaz'?-0.34:0.25,slon=(gasShift*TAU+2.2)%TAU,dl=Math.abs(lon-slon);if(dl>PI)dl=TAU-dl;
          var dd=(dl/0.42)*(dl/0.42)+((lat-slat)/0.17)*((lat-slat)/0.17);
          if(dd<1){CM(o,kind==='gaz'?[190,70,48]:[10,30,90],(1-dd)*0.85);}
          else if(dd<1.8)CM(o,[240,230,210],(1.8-dd)*0.08);
        }
      }else if(kind==='col'){
        var dn=Math.sin((x*4+z*2.5+y*1.5+fbm(n1,x,y,z,3)*5)*2.2);
        C3(pw,pm,ph,0.45+0.25*dn+(h-0.5)*0.9,o);hv=h*0.7+dn*0.05;
        if(h>0.72)CM(o,[84,60,46],sm(0.72,0.84,h)*0.85);
        if(a>0.88)CM(o,SNOW,sm(0.88,0.97,a)*0.85);
        if(cloudK>0){var c2=fbm(n4,x*1.2,y*2.0,z*1.2,4);cd[i]=cl(sm(0.58,0.8,c2)*255,0,255);}
      }else if(kind==='kayalik'||kind==='ay'||kind==='serbest'||kind==='mars'){
        C3(pw,pm,ph,h*0.9+0.05,o);
        if(kind==='serbest'&&h>0.6)CM(o,ph,sm(0.6,0.8,h)*0.5);
        var q=3.2,px=x*q,py=y*q,pz=z*q,fx=Math.floor(px),fy=Math.floor(py),fz=Math.floor(pz);
        var hh=SG.hash(((fx*73856093)^(fy*19349663)^(fz*83492791)^seed)>>>0)/4294967296;
        if(hh>0.45){
          var cx=fx+0.3+0.4*((hh*37)%1),cy=fy+0.3+0.4*((hh*91)%1),cz=fz+0.3+0.4*((hh*53)%1);
          var d=Math.sqrt((px-cx)*(px-cx)+(py-cy)*(py-cy)+(pz-cz)*(pz-cz)),rc=0.18+0.22*((hh*17)%1);
          if(d<rc){CM(o,[30,28,28],0.45*(1-d/rc)+0.15);hv-=0.10*(1-(d/rc)*(d/rc));}
          else if(d<rc*1.18){CM(o,[220,214,200],0.22);hv+=0.035;}
        }
        if(kind!=='serbest'){var fl=ridge(fbm(n3,x*3,y*3,z*3,3));if(fl>0.94)CM(o,[30,26,26],0.35);}
      }else if(kind==='lav'){
        C3(pw,[48,32,30],[70,50,44],h,o);
        var rr2=ridge(fbm(n3,x*2.2,y*2.2,z*2.2,4)),lake=sm(0.42,0.36,h);
        if(lake>0){C3(pm,ph,[255,230,120],fbm(n2,x*4,y*4,z*4,3),tmpC());CM(o,tmpC(),lake);e_=Math.max(e_,lake*255);}
        var cr=sm(0.8,0.96,rr2);CM(o,pm,cr*0.8);CM(o,ph,cr*cr*0.9);e_=Math.max(e_,cr*230);
      }else if(kind==='buz'){
        C3(pw,pm,ph,h*0.8+0.2,o);hv=h*0.45+0.28;
        var rr3=ridge(fbm(n3,x*3,y*3,z*3,4));if(rr3>0.9)CM(o,[70,110,170],sm(0.9,0.97,rr3)*0.8);
        if(a>0.85)CM(o,[255,255,255],0.5*sm(0.85,0.96,a));
        if(cloudK>0){var c3=fbm(n4,x*1.3,y*2.1,z*1.3,4);cd[i]=cl(sm(0.6,0.82,c3)*200,0,255);}
      }else if(kind==='karbon'){
        C3(pw,pm,pm,h,o);
        var rr4=ridge(fbm(n3,x*2.6,y*2.6,z*2.6,4));
        if(rr4>0.93){CM(o,ph,sm(0.93,0.985,rr4)*0.9);e_=Math.max(e_,40);}
      }else if(kind==='kthon'){
        C3(pw,pm,pm,h*1.1,o);
        var rr5=ridge(fbm(n3,x*2.4,y*2.4,z*2.4,4)),g5=sm(0.8,0.95,rr5);
        CM(o,ph,g5*0.95);e_=Math.max(e_,g5*255);
        if(h<0.34){CM(o,[255,150,60],0.6);e_=Math.max(e_,200);}
      }else if(kind==='pulsar'){
        C3(pw,pm,ph,h*0.8+0.1+0.12*Math.sin(lat*14+h*3),o);
        var rr6=ridge(fbm(n3,x*3,y*3,z*3,3));if(rr6>0.92)CM(o,ph,0.5);
      }else{C3(pw,pm,ph,h,o);}
      var k4=i*4;rgba[k4]=o[0];rgba[k4+1]=o[1];rgba[k4+2]=o[2];rgba[k4+3]=255;
      wm[i]=w;ct[i]=c_;em[i]=e_;if(hg)hg[i]=hv;
    }
  }
  var rm=hg?reliefMaps(hg,TW,TH):null;
  return {W:TW,H:TH,rgba:rgba,wm:wm,cd:cd,ct:ct,em:em,hasCloud:cloudK>0,cloudK:cloudK,sE:rm?rm.sE:null,sN:rm?rm.sN:null};
}
var _tc=[0,0,0];function tmpC(){return _tc;}
var texC={},texKeys=[];
function getTex(info,seed,lvl,type,tier,tv){
  var TW=[192,256,320,384][tier];
  var key=info.id+'|'+seed+'|'+lvBucket(lvl)+'|'+(type==='med'?'m':'x')+'|'+TW+'|'+(info.base[0].join(',')+info.base[1].join(','))+'|'+tv;
  var t=texC[key];if(t)return t;
  t=genTex(info,seed>>>0,lvBucket(lvl),type,TW,TW>>1,tier>=2,tv);
  texC[key]=t;texKeys.push(key);
  while(texKeys.length>7){delete texC[texKeys.shift()];}
  return t;
}

/* ---------- küre geometrisi önbelleği ---------- */
var geoC={},geoKeys=[];
var SUN=(function(){var l=[-0.78,-0.28,0.56],n=Math.sqrt(l[0]*l[0]+l[1]*l[1]+l[2]*l[2]);return [l[0]/n,l[1]/n,l[2]/n];})();
/* qc: 0 düşük (eski yol), 1 orta+, 2 yüksek+ (kabartma dizileri) */
function geo(R,tilt,qc){
  qc=qc|0;
  var key=R+'|'+tilt.toFixed(2)+'|'+qc,g=geoC[key];if(g)return g;
  var D=2*R,N=D*D;
  g={R:R,D:D,alpha:new Uint8Array(N),lonU:new Float32Array(N),latV:new Float32Array(N),shade:new Float32Array(N),night:new Float32Array(N),rim:new Float32Array(N),spec:new Float32Array(N),lt:qc>=2?new Float32Array(N):null,ln:qc>=2?new Float32Array(N):null,dq:qc>=1?new Uint8Array(N):null,fres:qc>=1?new Float32Array(N):null,glow2:qc>=1?new Float32Array(N):null,rs:{}};
  var L=[SUN[0],SUN[1],SUN[2]];
  var H=[L[0],L[1],L[2]+1],hl=Math.sqrt(H[0]*H[0]+H[1]*H[1]+H[2]*H[2]);H[0]/=hl;H[1]/=hl;H[2]/=hl;
  var ct=Math.cos(tilt),st=Math.sin(tilt);
  for(var py=0;py<D;py++)for(var px=0;px<D;px++){
    var i=py*D+px,x=(px+0.5-R)/R,y=(py+0.5-R)/R,r2=x*x+y*y,r=Math.sqrt(r2);
    var al=cl((1-r)*R+0.5,0,1);
    if(al<=0)continue;
    g.alpha[i]=(al*255)|0;
    var z=Math.sqrt(Math.max(0,1-r2)),xr=x*ct-y*st,yr=x*st+y*ct;
    var lat=Math.asin(cl(-yr,-1,1)),lon=Math.atan2(xr,z);
    g.lonU[i]=lon/TAU+0.5;g.latV[i]=0.5-lat/PI;
    var d=x*L[0]+y*L[1]+z*L[2];
    g.shade[i]=0.045+0.955*sm(-0.1,0.7,d);
    g.night[i]=sm(0.22,-0.2,d);
    if(qc>=1){var am=1/Math.max(z,0.12)-1;g.rim[i]=Math.pow(1-Math.exp(-0.6*am),1.6)*0.85;g.dq[i]=(((g.shade[i]-0.045)/0.955)*255+0.5)|0;var f1=1-z,f2=f1*f1;g.fres[i]=0.02+0.98*f2*f2*f1;}
    else g.rim[i]=Math.pow(1-z,3);
    if(qc>=2){var l0=L[0]*ct-L[1]*st,l1=L[0]*st+L[1]*ct,sl=Math.sin(lon),co=Math.cos(lon),sp=Math.sin(lat),cp=Math.cos(lat);
      g.lt[i]=l0*co-L[2]*sl;g.ln[i]=-l0*sp*sl-l1*cp-L[2]*sp*co;}
    var nh=x*H[0]+y*H[1]+z*H[2];g.spec[i]=nh>0?Math.pow(nh,70)*sm(0,0.4,d):0;
    if(qc>=1)g.glow2[i]=nh>0?Math.pow(nh,9)*sm(0,0.4,d):0;
  }
  geoC[key]=g;geoKeys.push(key);
  while(geoKeys.length>10)delete geoC[geoKeys.shift()];
  return g;
}

/* küre boyama: yüzey + bulut + şehir ışığı + atmosfer kenarı */
function paint(g,tex,img,rotU,cloudU,atmo,atmoK,cityK,shadowOn,bil,fx){
  var d=img.data,N=g.D*g.D,TW=tex.W,TH=tex.H,rgba=tex.rgba,wm=tex.wm,cd=tex.cd,ct=tex.ct,em=tex.em;
  var al=g.alpha,lonU=g.lonU,latV=g.latV,shade=g.shade,night=g.night,rim=g.rim,spec=g.spec,lt=g.lt,ln=g.ln,sE=tex.sE,sN=tex.sN,RK=0.006,dq=g.dq,fres=g.fres,glow2=g.glow2,lut=fx&&fx.lut,rsa=fx&&fx.rsa;
  if(!lt)sE=null;
  var cK=tex.hasCloud?1:0,ar=atmo[0],ag=atmo[1],ab=atmo[2],cityOn=cityK>0.01;
  for(var i=0;i<N;i++){
    var a=al[i],o=i*4;
    if(!a){d[o+3]=0;continue;}
    var u=lonU[i]+rotU;u-=Math.floor(u);
    var iy=(latV[i]*TH)|0;if(iy>=TH)iy=TH-1;
    var ti=iy*TW+((u*TW)|0),sh=shade[i],br,bg,bb;
    if(bil){
      var fu=u*TW-0.5,fv=latV[i]*TH-0.5,x0=Math.floor(fu),y0=Math.floor(fv),ax=fu-x0,ay=fv-y0,x1=x0+1,y1=y0+1;
      if(x0<0)x0+=TW;if(x1>=TW)x1-=TW;if(y0<0)y0=0;if(y1<0)y1=0;if(y0>=TH)y0=TH-1;if(y1>=TH)y1=TH-1;
      var a00=(y0*TW+x0)*4,a10=(y0*TW+x1)*4,a01=(y1*TW+x0)*4,a11=(y1*TW+x1)*4,w00=(1-ax)*(1-ay),w10=ax*(1-ay),w01=(1-ax)*ay,w11=ax*ay;
      br=rgba[a00]*w00+rgba[a10]*w10+rgba[a01]*w01+rgba[a11]*w11;
      bg=rgba[a00+1]*w00+rgba[a10+1]*w10+rgba[a01+1]*w01+rgba[a11+1]*w11;
      bb=rgba[a00+2]*w00+rgba[a10+2]*w10+rgba[a01+2]*w01+rgba[a11+2]*w11;
    }else{var t4=ti*4;br=rgba[t4];bg=rgba[t4+1];bb=rgba[t4+2];}
    if(rsa)sh*=rsa[i]/255;
    if(sE&&sh>0.03){var rl=-(sE[ti]*lt[i]+sN[ti]*ln[i])*RK;sh*=1+(rl<-0.6?-0.6:rl>0.6?0.6:rl);}
    var r=br*sh,gg=bg*sh,b=bb*sh,e=em[ti];
    if(lut){var tq=dq[i];r*=lut[tq];gg*=lut[256+tq];b*=lut[512+tq];}
    if(e){var ef=e/255;r+=(br-r)*ef;gg+=(bg-gg)*ef;b+=(bb-b)*ef;}
    var sp=spec[i],cdv=0;
    if(cK){
      var cu=lonU[i]+cloudU;cu-=Math.floor(cu);var ci=iy*TW+((cu*TW)|0);
      cdv=cd[ci]/255;
      if(shadowOn&&!cdv){var cs=lonU[i]+cloudU+0.007;cs-=Math.floor(cs);var sd=cd[iy*TW+((cs*TW)|0)]/255;if(sd>0.15){var dk=1-sd*0.38;r*=dk;gg*=dk;b*=dk;}}
      if(cdv>0.02){var cs2=0.1+0.9*sh,k=cdv*0.9;r+=(246*cs2+ar*0.05-r)*k;gg+=(248*cs2+ag*0.05-gg)*k;b+=(252*cs2+ab*0.05-b)*k;sp*=1-cdv;}
    }
    if(sp>0.01&&wm[ti]){sp*=0.55;r+=225*sp;gg+=235*sp;b+=255*sp;}
    if(fres&&wm[ti]){var F=fres[i]*(0.25+0.75*sh)*(1-cdv)*0.7;r+=ar*F;gg+=ag*F;b+=ab*F;var g2=glow2[i]*0.22*(1-cdv);r+=200*g2;gg+=220*g2;b+=255*g2;}
    if(cityOn){var nt=night[i];if(nt>0.02){var cv=ct[ti]/255;if(cv>0){cv=cv*nt*cityK*(1-cdv*0.75);r+=255*cv;gg+=190*cv;b+=96*cv;}}}
    var rm=rim[i]*atmoK;
    if(rm>0.01){var lit=0.2+0.8*sh;rm*=lit*0.95;r+=ar*rm;gg+=ag*rm;b+=ab*rm;}
    d[o]=r;d[o+1]=gg;d[o+2]=b;d[o+3]=a;
  }
}

/* küçük gezegen sprite'ı (galaksi, geçen gezegenler, uydular) */
var sprC={};
function sprite(kind,seed,lvl,D,type,opts){
  var key=kind+'|'+seed+'|'+lvl+'|'+D+'|'+(opts&&opts.ring?1:0);
  if(sprC[key])return sprC[key];
  var info=kindInfo(kind),R=Math.max(10,D>>1),tier=D>=100?1:0;
  var TW=D>=100?192:128,tex=genTex(info,(seed>>>0),lvBucket(lvl),type||'x',TW,TW>>1),g=geo(R,0.25);
  var cv=document.createElement('canvas'),pad=opts&&opts.ring?R:0;
  cv.width=cv.height=2*R+pad*2;
  var ctx=cv.getContext('2d'),oc=document.createElement('canvas');oc.width=oc.height=2*R;
  var oc2=oc.getContext('2d'),img=oc2.createImageData(2*R,2*R);
  paint(g,tex,img,0.2,0.5,info.atmo,info.ter||info.gas?0.7:0.25,0.8,false,true);oc2.putImageData(img,0,0);
  if(opts&&opts.ring)drawRingHalf(ctx,R+pad,R+pad,R,opts.ringSeed||seed,kind,true,info);
  ctx.drawImage(oc,pad,pad);
  if(opts&&opts.ring)drawRingHalf(ctx,R+pad,R+pad,R,opts.ringSeed||seed,kind,false,info);
  sprC[key]=cv;return cv;
}

/* halkalar: back=true -> gezegenin arkasındaki yarım */
var ringC={};
function ringBands(seed,info){
  var k=seed+'|'+info.id;if(ringC[k])return ringC[k];
  var r=SG.rng((seed^0xabc)>>>0),bands=[],x=1.32;
  var base=info.id==='buzdev'||info.id==='buz'?[200,225,245]:info.id==='gaz'?[222,200,160]:[190,180,170];
  while(x<2.15){
    var wd=0.025+r()*0.09;
    if(!(x>1.72&&x<1.8))bands.push({r1:x,r2:x+wd,a:0.2+r()*0.55,l:0.78+r()*0.3});
    x+=wd+r()*0.025;
  }
  ringC[k]={bands:bands,col:base};return ringC[k];
}
/* ---- pişmiş sprite'lar: atmosfer halesi (güneşe duyarlı) ve halka (karşılıklı gölgeli) ---- */
var DZ=(function(){var r=SG.rng(99),a=new Float32Array(64),i;for(i=0;i<64;i++)a[i]=r()-0.5;return a;})();
function mkCv(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function twiLut(ak){var t=new Float32Array(768),i,k;for(i=0;i<256;i++){k=Math.pow(1-i/255,2)*ak*0.8;t[i]=Math.exp(-k*0.30);t[256+i]=Math.exp(-k*0.80);t[512+i]=Math.exp(-k*1.90);}return t;}
var haloC={},haloK=[];
function getHalo(R,atmo,ak){
  var key=R+'|'+atmo[0]+','+atmo[1]+','+atmo[2]+'|'+((ak*100)|0),h=haloC[key];if(h)return h;
  var P=Math.ceil(R*1.42),D=P*2,cv=mkCv(D,D),c=cv.getContext('2d'),im=c.createImageData(D,D),d=im.data;
  var lx=SUN[0],ly=SUN[1],ll=Math.sqrt(lx*lx+ly*ly)||1,H=0.055,st=(0.5*ak+0.06)*1.25,WR=255,WG=150,WB=90;
  lx/=ll;ly/=ll;
  for(var y=0;y<D;y++)for(var x=0;x<D;x++){
    var px=(x+0.5-P)/R,py=(y+0.5-P)/R,b=Math.sqrt(px*px+py*py);
    if(b<0.88||b>1.42)continue;
    var hh=b-1,dens=hh<0?Math.exp(hh/0.02):Math.exp(-hh/H);
    var s=(px*lx+py*ly)/b,lit=0.06+0.94*sm(-0.35,0.45,s),tw=Math.max(0,1-Math.abs(s-0.05)*2.2)*0.5;
    var a=dens*lit*st*255+DZ[(x*7+y*13)&63];
    if(a<=0.5)continue;
    var i=(y*D+x)*4;
    d[i]=atmo[0]+(WR-atmo[0])*tw;d[i+1]=atmo[1]+(WG-atmo[1])*tw;d[i+2]=atmo[2]+(WB-atmo[2])*tw;d[i+3]=a>255?255:a;
  }
  c.putImageData(im,0,0);
  h={cv:cv,P:P};haloC[key]=h;haloK.push(key);while(haloK.length>6)delete haloC[haloK.shift()];
  return h;
}
var RSQ=0.27,RMIN=1.3,RSPAN=1.02,RN=612;
function ringTable(rb){
  if(rb.lut)return rb.lut;
  var A=new Float32Array(RN),Lm=new Float32Array(RN),i,b,x;
  for(i=0;i<RN;i++){x=RMIN+i/(RN-1)*RSPAN;for(b=0;b<rb.bands.length;b++){var bd=rb.bands[b];if(x>=bd.r1&&x<bd.r2){A[i]=bd.a;Lm[i]=bd.l;break;}}}
  rb.lut={A:A,L:Lm};return rb.lut;
}
var ringSC={},ringSK=[];
/* halka, ekran çerçevesinde (döndürülmüş) pişirilir: yeniden örnekleme bulanıklığı/boncuklanma olmaz */
function getRing(Rb,rb,ang){
  var key=Rb+'|'+ang.toFixed(3)+'|'+rb.col.join(','),h=ringSC[key];if(h)return h;
  var lt=ringTable(rb),A=lt.A,Lm=lt.L,sE=RSQ,cE=Math.sqrt(1-sE*sE),ca=Math.cos(ang),sa=Math.sin(ang);
  var lx=ca*SUN[0]+sa*SUN[1],ly=-sa*SUN[0]+ca*SUN[1],lz=SUN[2],RM=2.34;
  var hw=Math.ceil(Rb*RM*Math.sqrt(ca*ca+sE*sE*sa*sa))+2,hh=Math.ceil(Rb*RM*Math.sqrt(sa*sa+sE*sE*ca*ca))+2,W2=hw*2,H2=hh*2;
  var cvB=mkCv(W2,H2),cvF=mkCv(W2,H2),cB=cvB.getContext('2d'),cF=cvF.getContext('2d'),iB=cB.createImageData(W2,H2),iF=cF.createImageData(W2,H2),dB=iB.data,dF=iF.data;
  var col=rb.col,k1=(RN-1)/RSPAN,SM=[-0.4,-0.2,0,0.2,0.4];
  for(var y=0;y<H2;y++){
    var sy=(y+0.5-hh)/Rb;
    for(var x=0;x<W2;x++){
      var sx=(x+0.5-hw)/Rb,X=ca*sx+sa*sy,Y=-sa*sx+ca*sy,w=Y/sE,rad=Math.sqrt(X*X+w*w);
      if(rad<RMIN-0.02||rad>RMIN+RSPAN+0.02)continue;
      var gm=Math.sqrt(X*X+w*w/(sE*sE))/rad/Rb,asum=0,lsum=0,q,ri,av;
      for(q=0;q<5;q++){ri=((rad+SM[q]*gm-RMIN)*k1)|0;if(ri<0||ri>=RN)continue;av=A[ri];asum+=av;lsum+=av*Lm[ri];}
      if(asum<=0)continue;
      var Z=w*cE,front=w>0,lum=lsum/asum,a=asum/5,t=X*lx+Y*ly+Z*lz,sh=1;
      if(t<0){var d2=X*X+Y*Y+Z*Z-t*t;sh=sm(0.85,1.15,Math.sqrt(d2>0?d2:0));}
      var kk=0.35+0.65*sh,i=(y*W2+x)*4,dd=front?dF:dB;
      dd[i]=col[0]*lum*kk;dd[i+1]=col[1]*lum*kk;dd[i+2]=col[2]*lum*kk;dd[i+3]=a*(front?1:0.85)*255;
    }
  }
  cB.putImageData(iB,0,0);cF.putImageData(iF,0,0);
  h={back:cvB,front:cvF,hw:hw,hh:hh};ringSC[key]=h;ringSK.push(key);while(ringSK.length>4)delete ringSC[ringSK.shift()];
  return h;
}
/* halkanın gezegene düşürdüğü gölge: yüzey pikseli başına 255=aydınlık */
function getRingShadow(g,rb,ang){
  var key=ang.toFixed(3)+'|'+rb.col.join(','),o=g.rs[key];if(o)return o;
  var lt=ringTable(rb),A=lt.A,D=g.D,R=g.R,N=D*D,sE=RSQ,cE=Math.sqrt(1-sE*sE),ca=Math.cos(ang),sa=Math.sin(ang);
  var lx=ca*SUN[0]+sa*SUN[1],ly=-sa*SUN[0]+ca*SUN[1],lz=SUN[2],nl=cE*ly-sE*lz,k1=(RN-1)/RSPAN;
  o=new Uint8Array(N);for(var i=0;i<N;i++)o[i]=255;
  if(Math.abs(nl)>0.001)for(var py=0;py<D;py++)for(var px=0;px<D;px++){
    i=py*D+px;if(!g.alpha[i])continue;
    var x=(px+0.5-R)/R,y=(py+0.5-R)/R,r2=x*x+y*y,z=Math.sqrt(Math.max(0,1-r2)),X=ca*x+sa*y,Y=-sa*x+ca*y;
    var t=-(cE*Y-sE*z)/nl;if(t<=0)continue;
    var hx=X+t*lx,hy=Y+t*ly,hz=z+t*lz,rad=Math.sqrt(hx*hx+hy*hy+hz*hz),ri=((rad-RMIN)*k1)|0;
    if(ri<0||ri>=RN)continue;
    var av=A[ri];if(av>0)o[i]=255*(1-0.8*av);
  }
  g.rs[key]=o;return o;
}
function drawRingBaked(ctx,cx,cy,k,sp,front){
  ctx.drawImage(front?sp.front:sp.back,cx-sp.hw*k,cy-sp.hh*k,sp.hw*2*k,sp.hh*2*k);
}
function drawRingHalf(ctx,cx,cy,R,seed,kind,back,info,ang,sq){
  var rb=ringBands(seed,info);ang=ang==null?-0.28:ang;sq=sq||0.27;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(ang);ctx.scale(1,sq);
  var a0=back?PI:0,a1=back?TAU:PI;
  for(var i=0;i<rb.bands.length;i++){
    var b=rb.bands[i];
    ctx.beginPath();ctx.arc(0,0,b.r2*R,a0,a1);ctx.arc(0,0,b.r1*R,a1,a0,true);ctx.closePath();
    ctx.fillStyle=rgba([rb.col[0]*b.l,rb.col[1]*b.l,rb.col[2]*b.l],b.a*(back?0.85:1));
    ctx.fill();
  }
  ctx.restore();
}

/* ---------- parçacık havuzu ---------- */
var SPC={fire:[255,150,50],hot:[255,230,160],smoke:[118,114,120],ash:[158,144,134],spark:[255,222,130],water:[130,195,255],ice:[205,238,255],green:[110,255,150],purple:[190,130,255],white:[255,255,255],gold:[255,215,120],red:[255,70,50],cyan:[100,230,255],dust:[178,142,104]};
var NORMAL={smoke:1,ash:1,dust:1};
var sprs={};
function gl(key){
  var s=sprs[key];if(s)return s;
  var c=SPC[key]||[255,255,255],cv=document.createElement('canvas');cv.width=cv.height=48;
  var x=cv.getContext('2d'),g=x.createRadialGradient(24,24,0,24,24,24);
  g.addColorStop(0,rgba(c,1));g.addColorStop(0.35,rgba(c,0.55));g.addColorStop(1,rgba(c,0));
  x.fillStyle=g;x.fillRect(0,0,48,48);sprs[key]=cv;return cv;
}
function Pool(n){
  var p={n:n,x:new Float32Array(n),y:new Float32Array(n),vx:new Float32Array(n),vy:new Float32Array(n),ax:new Float32Array(n),ay:new Float32Array(n),life:new Float32Array(n),max:new Float32Array(n),size:new Float32Array(n),grow:new Float32Array(n),drag:new Float32Array(n),a0:new Float32Array(n),spr:new Array(n),add:new Uint8Array(n),next:0,live:0};
  p.cap=n;
  p.spawn=function(x,y,vx,vy,life,size,grow,key,ax,ay,drag,a0){
    if(p.live>=p.cap)return;
    var i=-1,k;
    for(k=0;k<n;k++){var j=(p.next+k)%n;if(p.life[j]<=0){i=j;break;}}
    if(i<0){i=p.next;}
    p.next=(i+1)%n;
    p.x[i]=x;p.y[i]=y;p.vx[i]=vx;p.vy[i]=vy;p.life[i]=life;p.max[i]=life;p.size[i]=size;p.grow[i]=grow||0;p.spr[i]=gl(key);p.add[i]=NORMAL[key]?0:1;
    p.ax[i]=ax||0;p.ay[i]=ay||0;p.drag[i]=drag==null?0:drag;p.a0[i]=a0==null?1:a0;
  };
  p.update=function(dt){
    var live=0;
    for(var i=0;i<n;i++){
      if(p.life[i]<=0)continue;
      p.life[i]-=dt;if(p.life[i]<=0)continue;live++;
      var dr=Math.max(0,1-p.drag[i]*dt);
      p.vx[i]=(p.vx[i]+p.ax[i]*dt)*dr;p.vy[i]=(p.vy[i]+p.ay[i]*dt)*dr;
      p.x[i]+=p.vx[i]*dt;p.y[i]+=p.vy[i]*dt;p.size[i]+=p.grow[i]*dt;
    }
    p.live=live;
  };
  p.setCap=function(c){p.cap=c;};
  p.draw=function(ctx){
    var pass,i;
    for(pass=0;pass<2;pass++){
      ctx.globalCompositeOperation=pass?'lighter':'source-over';
      for(i=0;i<n;i++){
        if(p.life[i]<=0||p.add[i]!==pass)continue;
        var t=p.life[i]/p.max[i],a=(t<0.2?t/0.2:1)*(pass?1:0.8)*p.a0[i]*Math.min(1,(1-t)*8+0.2);
        var s=p.size[i];if(s<=0)continue;
        ctx.globalAlpha=cl(a,0,1);
        ctx.drawImage(p.spr[i],p.x[i]-s,p.y[i]-s,s*2,s*2);
      }
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  };
  p.clear=function(){for(var i=0;i<n;i++)p.life[i]=0;};
  return p;
}

/* ---------- SG.W.stars : aşağı akan derinlikli yıldız + bulutsu + geçen gezegenler ---------- */
var PASS=[
  {kind:'gaz',seed:11,lvl:30,ring:1},{kind:'buzdev',seed:23,lvl:12},{kind:'mars',seed:5,lvl:10},
  {kind:'okyanus',seed:41,lvl:16},{kind:'lav',seed:8,lvl:6},{kind:'zumrut',seed:77,lvl:20},
  {kind:'ay',seed:3,lvl:10},{kind:'buz',seed:19,lvl:12,ring:1},{kind:'karbon',seed:31,lvl:10},{kind:'pulsar',seed:61,lvl:10}
];
/* alan bükmeli (domain-warp) fbm bulutsu: idle'a ertelenmiş, satır dilimli pişirme (ana iş parçacığını tutmaz).
   y ekseni daire üzerine yazılır (dikey dikişsiz); wrapX ise x'te çapraz geçişle dikişsiz yapar. */
var nbF=0,nbY=0;
function nebField(n,X,py,pz){
  var dx=0,dy=0,dz=0,sc=4;
  for(var s=0;s<3;s++){
    var nx=n(X*sc+dx,py*sc+dy,pz*sc+dz),ny=n(py*sc+dy,pz*sc+dz,X*sc+dx+7.3),nz=n(pz*sc+dz,X*sc+dx+3.1,py*sc+dy+11.7);
    dx=nx;dy=ny;dz=nz;sc*=0.5;
  }
  var f=n(X*sc+dx,py*sc+dy,pz*sc+dz)*1.35;nbF=f>1?1:f;nbY=dy;
}
function later(fn){
  if(window.requestIdleCallback)window.requestIdleCallback(function(){fn();},{timeout:1500});
  else setTimeout(fn,40);
}
function nebulaJob(cols,seed,w,h,wrapX,done){
  var n=Noise(seed),cv=mkCv(w,h),cx=cv.getContext('2d'),id=cx.createImageData(w,h),px=id.data,c0=cols[0],c1=cols[1],y=0,R=2;
  function row(){
    var a=y/h*TAU,py=Math.cos(a)*R,pz=Math.sin(a)*R,i=y*w*4;
    for(var xx=0;xx<w;xx++){
      var t=xx/w,X=t*3,f,dy;
      nebField(n,X,py,pz);f=nbF;dy=nbY;
      if(wrapX){var f1=f,y1=dy;nebField(n,X-3,py,pz);f=f1*(1-t)+nbF*t;dy=y1*(1-t)+nbY*t;}
      px[i++]=c0[0]+(c1[0]-c0[0])*dy;px[i++]=c0[1]+(c1[1]-c0[1])*dy;px[i++]=c0[2]+(c1[2]-c0[2])*dy;
      px[i++]=Math.pow(f,5)*255;
    }
  }
  function pump(){
    var t0=performance.now();
    try{while(y<h&&performance.now()-t0<7){row();y++;}}catch(e){SG.log.err('nebula',e);return;}
    if(y<h)later(pump);else{cx.putImageData(id,0,0);done(cv);}
  }
  later(pump);
}
W.stars=function(canvas,opts){
  opts=opts||{};
  var ctx=canvas.getContext('2d'),id='st'+(++seq),qp=qParse(opts.quality!=null?opts.quality:SG.store.get('quality','auto'));
  var v={q:qp.q,qAuto:qp.auto,running:false,w:0,h:0,dpr:1},mon=QMon(v,1/30);
  var NS=[56,100,160,230],MAXP=[1,1,2,2];
  var stars=[],tiles=[],planets=[],shoot=null,acc=0,tt=0,vis=true,dead=false,io=null,nextPass=1.2,nextShoot=3+Math.random()*3,lastPass=-1;
  var r=SG.rng(opts.seed!=null?opts.seed:SG.hash(id+Date.now())),spd=opts.speed||1;
  var SC=[[170,200,255],[255,255,255],[255,244,214],[255,205,150],[255,165,125]],tails=[],bgG=null,bgGh=0,nebBusy=false,gen=0;
  function starCol(){var u=r();return u<0.2?0:u<0.52?1:u<0.78?2:u<0.93?3:4;}
  function tailSpr(ci){
    var t=tails[ci];if(t)return t;
    t=mkCv(4,64);var x=t.getContext('2d'),g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,rgba(SC[ci],0));g.addColorStop(1,rgba(SC[ci],1));
    x.fillStyle=g;x.fillRect(0,0,4,64);tails[ci]=t;return t;
  }
  function bakeTiles(){
    if(nebBusy||tiles.length)return;nebBusy=true;var g0=gen,tw=v.q>=2?128:96,th=tw*2;
    function add(cv,sp,al){if(dead||g0!==gen)return;tiles.push({cv:cv,sp:sp,al:al,t0:(SG.RM||!v.running)?-9:tt});if(SG.RM||!v.running)draw(0);}
    nebulaJob([[70,120,255],[190,90,240]],101,tw,th,false,function(c1){
      add(c1,0.016,0.5);
      nebulaJob([[255,90,170],[70,170,255]],202,tw,th,false,function(c2){add(c2,0.026,0.38);});
    });
  }
  function mk(){
    stars=[];var n=NS[v.q];
    for(var i=0;i<n;i++){var z=Math.pow(r(),1.7);stars.push({x:r(),y:r(),z:z,ph:r()*TAU,ci:starCol(),m:Math.pow(r(),4)});}
    stars.sort(function(a,b){return a.z-b.z;});
    if(v.q>=1)bakeTiles();
  }
  v.setTier=function(n){v.q=cl(n|0,0,3);mk();v.resize();};
  v.setQuality=function(x){var p=qParse(x);v.qAuto=p.auto;v.setTier(p.q);};
  v.resize=function(){
    var w=canvas.clientWidth||canvas.width||300,h=canvas.clientHeight||canvas.height||500,d=v.q===0?1:dpr();
    if(v.q===0&&dpr()>1)d=1;
    v.w=w;v.h=h;v.dpr=d;canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
    ctx.setTransform(d,0,0,d,0,0);
    if(!v.running||SG.RM)draw(0);
  };
  function spawnPass(){
    if(planets.length>=MAXP[v.q])return;
    var k=(r()*PASS.length)|0;if(k===lastPass)k=(k+1)%PASS.length;lastPass=k;
    var d=PASS[k],sz=0.22+r()*0.28;
    try{
      var sp=sprite(d.kind,d.seed,d.lvl,v.q>=2?112:88,'x',d.ring?{ring:1,ringSeed:d.seed}:null);
      planets.push({spr:sp,x:0.12+r()*0.76,y:-0.25,s:sz,vy:0.03+r()*0.035,vx:(r()-0.5)*0.01,rot:(r()-0.5)*0.5,a:0});
    }catch(e){SG.log.err('stars:pass',e);}
  }
  function ribbons(){
    if(v.q<1)return;
    ctx.globalCompositeOperation='lighter';
    for(var i=0;i<tiles.length;i++){
      var t=tiles[i],sc=v.w/192,th=Math.round(384*sc),oy=Math.floor((tt*t.sp*v.h*spd)%th);
      ctx.globalAlpha=t.al*(opts.dim||1)*Math.min(1,(tt-t.t0)*0.7);
      for(var y=oy-th;y<v.h;y+=th)ctx.drawImage(t.cv,0,y,v.w,th);
    }
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  function drawStars(a,b,dt){
    var w=v.w,h=v.h,fast=v.q>=1;
    for(var i=a;i<b;i++){
      var s=stars[i],z=s.z,sp=(0.02+0.58*z*z)*spd;
      s.y+=sp*dt;if(s.y>1.02){s.y-=1.05;s.x=r();}
      var x=s.x*w,y=s.y*h,tw=0.65+0.35*Math.sin(tt*(1.2+z*2)+s.ph),sz=(0.5+z*1.7)*(0.85+0.5*s.m);
      var al=(0.35+0.65*z)*tw*(0.55+0.9*s.m),c=SC[s.ci];if(al>1)al=1;
      if(fast&&z>0.55){
        var len=sp*h*0.09+2;
        ctx.globalAlpha=al;ctx.drawImage(tailSpr(s.ci),x-sz*0.5,y-len,sz,len);ctx.globalAlpha=1;
      }
      ctx.fillStyle=rgba(c,al);
      if(z>0.8){ctx.beginPath();ctx.arc(x,y,sz*0.8,0,TAU);ctx.fill();}
      else ctx.fillRect(x-sz*0.5,y-sz*0.5,sz,sz);
    }
  }
  function draw(dt){
    var w=v.w,h=v.h;
    if(opts.transparent)ctx.clearRect(0,0,w,h);
    else{if(!bgG||bgGh!==h){bgG=ctx.createLinearGradient(0,0,0,h);bgG.addColorStop(0,'#03040c');bgG.addColorStop(1,'#080a1c');bgGh=h;}ctx.fillStyle=bgG;ctx.fillRect(0,0,w,h);}
    ribbons();
    var split=0;while(split<stars.length&&stars[split].z<0.5)split++;
    drawStars(0,split,dt);
    for(var i=planets.length-1;i>=0;i--){
      var p=planets[i];p.y+=p.vy*dt;p.x+=p.vx*dt;p.a=Math.min(1,p.a+dt*0.8);
      var sw=p.s*w,sh=sw*(p.spr.height/p.spr.width),py=p.y*h;
      if(py-sh>h){planets.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.a*0.92*(opts.dim||1);ctx.translate(p.x*w,py);ctx.rotate(p.rot);
      ctx.drawImage(p.spr,-sw/2,-sh/2,sw,sh);ctx.restore();
    }
    drawStars(split,stars.length,dt);
    if(shoot){
      shoot.t+=dt;var k=shoot.t/shoot.d;
      if(k>=1)shoot=null;
      else{
        var x=shoot.x+shoot.dx*k,y=shoot.y+shoot.dy*k,tl=0.16,gx=x-shoot.dx*tl,gy=y-shoot.dy*tl;
        var g2=ctx.createLinearGradient(gx,gy,x,y);g2.addColorStop(0,'rgba(255,255,255,0)');g2.addColorStop(1,'rgba(255,255,255,'+(0.85*(1-k))+')');
        ctx.strokeStyle=g2;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(x,y);ctx.stroke();
      }
    }
  }
  var heavyView=false;
  var viewOff=SG.bus.on('view',function(d){heavyView=!!d&&(d.name==='world'||d.name==='galaxy'||d.name==='egg');});
  function step(dt,t){
    if(dead||!canvas.isConnected&&!v.manual){return;}
    if(!vis)return;
    acc+=dt;if(acc<(heavyView?1/15:1/31))return;
    var d=acc;acc=0;tt+=d;
    var t0=performance.now();
    nextPass-=d;if(nextPass<=0){spawnPass();nextPass=4+r()*5;}
    nextShoot-=d;if(nextShoot<=0&&v.q>=1&&!shoot){nextShoot=5+r()*8;var a=0.5+r()*0.35;shoot={x:(0.3+r()*0.7)*v.w,y:r()*0.35*v.h,dx:-v.w*0.35,dy:v.h*0.2*(0.6+r()*0.6),t:0,d:0.8+r()*0.4};}
    draw(d);
    mon.tick(d,performance.now()-t0,tt);
  }
  v.start=function(){
    if(v.running||dead)return v;
    v.running=true;mk();v.resize();
    if(SG.RM){draw(0);return v;}
    SG.loop.add('w:'+id,step);
    try{if('IntersectionObserver' in window){io=new IntersectionObserver(function(e){vis=e[0].isIntersecting;});io.observe(canvas);}}catch(e){}
    return v;
  };
  v.stop=function(){v.running=false;SG.loop.remove('w:'+id);if(io){io.disconnect();io=null;}return v;};
  v.destroy=function(){dead=true;gen++;v.stop();viewOff&&viewOff();stars=[];planets=[];tiles=[];};
  v.drawOnce=function(){draw(0);};
  v.onResize=function(){v.resize();};
  return v;
};

/* ---------- SG.W.planet : prosedürel gezegen + uydular + efektler ---------- */
var hexPat=null;
function hexTile(){
  if(hexPat)return hexPat;
  var c=document.createElement('canvas');c.width=36;c.height=62;var x=c.getContext('2d');
  x.strokeStyle='rgba(160,240,255,0.9)';x.lineWidth=1.2;x.beginPath();
  var s=12;
  function hx(cx,cy){for(var i=0;i<6;i++){var a=PI/3*i+PI/6,px=cx+Math.cos(a)*s,py=cy+Math.sin(a)*s;if(i)x.lineTo(px,py);else x.moveTo(px,py);}x.closePath();}
  hx(18,15.5);hx(0,46.5);hx(36,46.5);hx(18,-15.5);hx(18,46.5+0);
  x.stroke();hexPat=c;return c;
}
function ease(t){t=cl(t,0,1);return t*t*(3-2*t);}
function bell(t){return Math.sin(cl(t,0,1)*PI);}
function bez(a,c,b,k){var u=1-k;return u*u*a+2*u*k*c+k*k*b;}
W.planet=function(canvas,opts){
  opts=opts||{};
  var ctx=canvas.getContext('2d'),id='pl'+(++seq),qp=qParse(opts.quality!=null?opts.quality:SG.store.get('quality','auto'));
  var v={q:qp.q,qAuto:qp.auto,running:false,w:0,h:0,cx:0,cy:0,R:0,dpr:1,planet:null,rotU:0,cloudU:0,shake:0,cityBoost:1,auroraK:0};
  var mon=QMon(v,1/58),pool=Pool(760),fxs=[],tapCb=null,tt=0,frame=0,vis=true,dead=false,io=null;
  var off=document.createElement('canvas'),offc=null,img=null,geoO=null,tex=null,info=KINDS.kayalik&&kindInfo('kayalik');
  var kindId='kayalik',seed=1,tilt=0.25,rotSpd=0.016,ringOn=false,ringAng=-0.28,tcol=[111,168,255],atmoK=0.5,Rpx=48,dirty=true,satM={},busOff=null,lastFx={},haloS=null,ringS=null,fxo=null;
  var QF=[0.3,0.55,0.8,1],PAINT=[3,2,2,2],RP=[48,64,88,116]; /* yüksek/ultra: yüzey 30 fps boyanır (dönüş ~0.3 px/kare, fark görünmez); yeni gölgelendirme maliyetini karşılar */
  function qf(n){return Math.max(1,Math.round(n*QF[v.q]));}
  function typeColor(t){var T=SG.D&&SG.D.TYPES&&SG.D.TYPES[t];return pc(T&&T.color||'#6fa8ff');}
  function prep(){
    pool.setCap([110,200,360,700][v.q]);
    var p=v.planet;if(!p||!v.R)return;
    seed=(typeof p.seed==='number'?p.seed:SG.hash(p.seed||p.id||p.name||'x'))>>>0;
    var known=p.kind&&(KINDS[p.kind]||(SG.D&&SG.D.PLANETKINDS&&SG.D.PLANETKINDS[p.kind]));
    kindId=known?p.kind:KLIST[seed%KLIST.length];
    info=kindInfo(kindId);
    tilt=0.12+((seed>>>5)%30)/100;rotSpd=0.012+((seed>>>9)%20)/1600;
    ringOn=p.ring!=null?!!p.ring:!!(info.ringP&&((seed>>>11)%100)/100<info.ringP);
    ringAng=-tilt;
    Rpx=Math.max(24,Math.min(RP[v.q],Math.ceil(v.R*v.dpr)));
    var lv=p.lvl||1,qc=v.q>=2?2:v.q;
    atmoK=info.gas?0.85:(kindId==='kayalik'||kindId==='ay'||kindId==='mars'||kindId==='karbon'||kindId==='serbest'?0.18:cl(0.25+(lv-3)/3*0.75,0.25,1)*0.9);
    geoO=geo(Rpx,tilt,qc);tex=getTex(info,seed,lv,p.type,v.q,(p.tv===2||p.born>=TV2_AT)?2:1);
    haloS=null;ringS=null;fxo=null;
    if(v.q>=1){
      fxo={lut:atmoK>0.2?twiLut(atmoK):null,rsa:null};
      try{
        haloS=getHalo(Rpx,info.atmo,atmoK);
        if(ringOn){var rb=ringBands(seed,info);ringS=getRing(Rpx,rb,ringAng);fxo.rsa=getRingShadow(geoO,rb,ringAng);}
      }catch(e){SG.log.err('world:bake',e);haloS=null;ringS=null;fxo.rsa=null;}
    }
    off.width=off.height=2*Rpx;offc=off.getContext('2d');img=offc.createImageData(2*Rpx,2*Rpx);
    tcol=typeColor(p.type);
    dirty=true;
  }
  function layout(){
    var w=v.w,h=v.h,n=v.planet&&v.planet.sats?Math.min(6,v.planet.sats.length):0;
    var ext=Math.max(opts.fit||1.75,ringOn?2.2:0,n?1.42+0.2*(n-1)+0.15:0);
    v.R=Math.max(20,Math.min(w*0.5/ext,h*0.5/1.32,230));
    v.cx=w/2;v.cy=h/2;
  }
  v.resize=function(){
    var w=canvas.clientWidth||canvas.width||300,h=canvas.clientHeight||canvas.height||300,d=dpr();
    v.w=w;v.h=h;v.dpr=d;canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);
    layout();prep();if(!v.running||SG.RM)draw(0);
  };
  v.setPlanet=function(p){v.planet=p||null;satM={};if(!v.w){v.resize();return v;}layout();prep();if(!v.running||SG.RM)draw(0);return v;};
  v.setTier=function(n){v.q=cl(n|0,0,3);prep();};
  v.setQuality=function(x){var p=qParse(x);v.qAuto=p.auto;v.setTier(p.q);};
  v.onTap=function(fn){tapCb=fn;return v;};
  v.clearFx=function(){fxs.length=0;pool.clear();v.shake=0;v.cityBoost=1;v.auroraK=0;};

  /* ----- yardımcılar ----- */
  function tgt(p){
    var R=v.R,x,y;
    if(p.lat!=null&&p.lon!=null){var la=p.lat*PI/180,lo=cl(p.lon,-80,80)*PI/180;x=Math.cos(la)*Math.sin(lo);y=-Math.sin(la);}
    else if(p.x!=null&&p.y!=null){x=(p.x*(p.px?1:v.w)-v.cx)/R;y=(p.y*(p.px?1:v.h)-v.cy)/R;}
    else{var a=Math.random()*TAU,rr=Math.sqrt(Math.random())*0.7;x=Math.cos(a)*rr;y=Math.sin(a)*rr;}
    var d=Math.sqrt(x*x+y*y);if(d>0.94){x*=0.94/d;y*=0.94/d;d=0.94;}
    return {x:v.cx+x*R,y:v.cy+y*R,d:d,ang:Math.atan2(y,x)};
  }
  function ring(x,y,rad,d,ang,lw,col,al){
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.scale(Math.max(0.22,Math.sqrt(Math.max(0,1-d*d))),1);
    ctx.beginPath();ctx.arc(0,0,rad,0,TAU);ctx.lineWidth=lw;ctx.strokeStyle=rgba(col,al);ctx.stroke();ctx.restore();
  }
  function decal(T,rad,col,al){
    ctx.save();ctx.translate(T.x,T.y);ctx.rotate(T.ang);ctx.scale(Math.max(0.22,Math.sqrt(Math.max(0,1-T.d*T.d))),1);
    var g=ctx.createRadialGradient(0,0,0,0,0,rad);g.addColorStop(0,rgba(col,al));g.addColorStop(0.6,rgba(col,al*0.55));g.addColorStop(1,rgba(col,0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rad,0,TAU);ctx.fill();ctx.restore();
  }
  function glow(x,y,rad,col,al){
    var g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,rgba(col,al));g.addColorStop(0.4,rgba(col,al*0.4));g.addColorStop(1,rgba(col,0));
    ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
  }
  function toCenter(x,y,m){var dx=v.cx-x,dy=v.cy-y,l=Math.sqrt(dx*dx+dy*dy)||1;return [dx/l*m,dy/l*m];}
  function add(o,dur){o.t=0;o.dur=dur;fxs.push(o);return o;}
  function burst(x,y,n,key,sp,life,size,grow,ax,ay,drag){
    for(var i=0;i<n;i++){var a=Math.random()*TAU,s=sp*(0.35+Math.random()*0.65);
      pool.spawn(x,y,Math.cos(a)*s,Math.sin(a)*s,life*(0.6+Math.random()*0.6),size*(0.6+Math.random()*0.7),grow,key,ax||0,ay||0,drag==null?1.2:drag);}
  }
  function bolt(x0,y0,x1,y1,seg,j){
    var pts=[[x0,y0]];
    for(var i=1;i<seg;i++){var k=i/seg;pts.push([x0+(x1-x0)*k+(Math.random()-0.5)*j,y0+(y1-y0)*k+(Math.random()-0.5)*j*0.5]);}
    pts.push([x1,y1]);return pts;
  }
  function polyline(pts){ctx.beginPath();for(var i=0;i<pts.length;i++){if(i)ctx.lineTo(pts[i][0],pts[i][1]);else ctx.moveTo(pts[i][0],pts[i][1]);}ctx.stroke();}
  function clipDisc(extra){ctx.beginPath();ctx.arc(v.cx,v.cy,v.R*(extra||1),0,TAU);ctx.clip();}
  function edgePoint(p,fallbackAng){
    if(p&&p.from&&p.from.x!=null)return {x:p.from.x*v.w,y:p.from.y*v.h};
    var a=fallbackAng!=null?fallbackAng:(-PI*0.15-Math.random()*PI*0.7);
    var rr=v.R*(2.6+Math.random()*0.5),x=v.cx+Math.cos(a)*rr,y=v.cy+Math.sin(a)*rr;
    return {x:cl(x,6,v.w-6),y:cl(y,6,v.h-6)};
  }

  /* ----- efektler ----- */
  var FX={};
  FX.impact=function(p){
    var T=tgt(p),R=v.R,dx=(Math.random()<0.5?-1:1)*(0.45+Math.random()*0.4),dy=-1,l=Math.sqrt(dx*dx+dy*dy);dx/=l;dy/=l;
    var S={x:T.x+dx*R*3.2,y:T.y+dy*R*3.2},HIT=0.75,o=add({boom:false,fl:0},5.2),hx=S.x,hy=S.y;
    o.upd=function(dt){
      var t=o.t;
      if(t<HIT){var k=t/HIT;k=k*k*(1.4-0.4*k);hx=S.x+(T.x-S.x)*k;hy=S.y+(T.y-S.y)*k;
        for(var i=0;i<qf(3);i++)pool.spawn(hx+(Math.random()-0.5)*4,hy+(Math.random()-0.5)*4,-dx*30*Math.random(),-dy*30*Math.random(),0.5,R*0.05+Math.random()*3,-4,Math.random()<0.5?'fire':'smoke',0,0,1);}
      if(!o.boom&&t>=HIT){o.boom=true;o.fl=1;v.shake=Math.max(v.shake,1.4);
        var g=toCenter(T.x,T.y,R*1.2);
        burst(T.x,T.y,qf(20),'fire',R*1.0,1.0,R*0.09,R*0.14,0,0,2);
        burst(T.x,T.y,qf(8),'hot',R*0.5,0.45,R*0.16,R*0.6,0,0,3);
        burst(T.x,T.y,qf(22),'spark',R*1.7,1.3,3,-2,g[0],g[1],0.6);
        for(var j=0;j<qf(16);j++){var a=Math.random()*TAU;pool.spawn(T.x,T.y,Math.cos(a)*R*0.2+Math.cos(T.ang)*R*0.15*T.d,Math.sin(a)*R*0.2+Math.sin(T.ang)*R*0.15*T.d-R*0.08,2.4+Math.random()*1.8,R*0.07,R*0.11,'smoke',0,-R*0.02,0.5);}
        burst(T.x,T.y,qf(12),'dust',R*0.5,2.2,R*0.045,R*0.07,0,0,1.5);}
      o.fl=Math.max(0,o.fl-dt*2.2);
    };
    o.surf=function(){
      var t=o.t-HIT;if(t<0)return;
      decal(T,R*0.1,[20,14,12],0.5*(1-t/4.4));
      decal(T,R*0.06,[255,130,40],0.6*Math.max(0,1-t/2));
      var rr=Math.min(1,t/1.7)*R*0.58;
      ring(T.x,T.y,rr,T.d,T.ang,3,[255,225,180],0.55*Math.max(0,1-t/1.7));
      ring(T.x,T.y,rr*0.7,T.d,T.ang,6,[200,170,130],0.25*Math.max(0,1-t/1.5));
    };
    o.over=function(){
      var t=o.t;ctx.globalCompositeOperation='lighter';
      if(t<HIT){
        var len=R*1.2,g=ctx.createLinearGradient(hx-dx*len,hy-dy*len,hx,hy);g.addColorStop(0,'rgba(255,140,40,0)');g.addColorStop(1,'rgba(255,230,170,0.9)');
        ctx.strokeStyle=g;ctx.lineWidth=R*0.05;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(hx-dx*len,hy-dy*len);ctx.lineTo(hx,hy);ctx.stroke();
        glow(hx,hy,R*0.2,[255,210,140],0.95);
      }
      if(o.fl>0)glow(T.x,T.y,R*(0.28+(1-o.fl)*0.5),[255,200,120],o.fl*0.95);
      ctx.globalCompositeOperation='source-over';
    };
  };
  FX.quake=function(p){
    var T=tgt(p),R=v.R,o=add({},3.8),cr=[];
    for(var i=0;i<9;i++){var a=Math.random()*TAU,pts=[[0,0]],len=R*(0.1+Math.random()*0.22),x=0,y=0;
      for(var k=1;k<=5;k++){a+=(Math.random()-0.5)*0.9;x+=Math.cos(a)*len/5;y+=Math.sin(a)*len/5;pts.push([x,y]);}cr.push(pts);}
    o.upd=function(dt){
      var t=o.t;v.shake=Math.max(v.shake,2.0*Math.max(0,1-t/3.0));
      if(t<2.4)for(var i=0;i<qf(2);i++){var a=Math.random()*TAU,rr=Math.min(t,1.6)*R*0.3*(0.6+Math.random()*0.5);
        pool.spawn(T.x+Math.cos(a)*rr,T.y+Math.sin(a)*rr*0.6,(Math.random()-0.5)*14,-14-Math.random()*20,1.3,R*0.04,R*0.05,'dust',0,0,1);}
    };
    o.surf=function(){
      var t=o.t;
      for(var i=0;i<3;i++){var tt2=t-i*0.22;if(tt2<0)continue;var k=Math.min(1,tt2/1.5);ring(T.x,T.y,k*R*0.7,T.d,T.ang,5-i,[255,214,160],0.6*(1-k));}
      ctx.save();ctx.translate(T.x,T.y);ctx.rotate(T.ang);ctx.scale(Math.max(0.3,Math.sqrt(Math.max(0,1-T.d*T.d))),1);
      ctx.strokeStyle='rgba(18,10,8,'+(0.8*Math.max(0,1-t/3.6))+')';ctx.lineWidth=2;ctx.lineJoin='round';
      for(var c=0;c<cr.length;c++){var kk=Math.min(1,t/0.6),pts=cr[c];ctx.beginPath();for(var q=0;q<pts.length;q++){var px=pts[q][0]*kk,py=pts[q][1]*kk;if(q)ctx.lineTo(px,py);else ctx.moveTo(px,py);}ctx.stroke();}
      ctx.restore();
      decal(T,R*0.12,[255,140,60],0.35*Math.max(0,1-t/1.2));
    };
  };
  FX.volcano=function(p){
    var T=tgt(p),R=v.R,o=add({},6.2),ox=Math.cos(T.ang)*T.d,oy=Math.sin(T.ang)*T.d,fl=[];
    for(var i=0;i<6;i++){var a=Math.random()*TAU,ln=R*(0.12+Math.random()*0.2);fl.push([a,ln]);}
    o.upd=function(dt){
      var t=o.t,g=toCenter(T.x,T.y,R*1.5);
      if(t<3.4){
        for(var i=0;i<qf(3);i++){
          var dx=ox*0.9+(Math.random()-0.5)*0.8,dy=oy*0.9-0.95+(Math.random()-0.5)*0.3,l=Math.sqrt(dx*dx+dy*dy)||1,s=R*(0.9+Math.random()*1.0);
          var k=Math.random();pool.spawn(T.x,T.y,dx/l*s,dy/l*s,0.9+Math.random()*0.9,R*(0.02+Math.random()*0.03),-R*0.01,k<0.3?'hot':k<0.7?'fire':'red',g[0],g[1],0.2);
        }
        if(Math.random()<0.9)pool.spawn(T.x,T.y,ox*R*0.45+(Math.random()-0.5)*R*0.1,(oy-0.7)*R*0.45,2.8+Math.random()*1.4,R*0.04,R*0.07,'smoke',0,-R*0.01,0.7);
        if(Math.random()<0.4)pool.spawn(T.x,T.y,ox*R*0.5+(Math.random()-0.5)*R*0.3,(oy-0.8)*R*0.5,3.2,R*0.03,R*0.06,'ash',0,R*0.015,0.6);
      }else if(t<5.4&&Math.random()<0.5){
        pool.spawn(T.x+(Math.random()-0.5)*R*0.5,T.y-R*0.3-Math.random()*R*0.3,(Math.random()-0.5)*8,R*0.08,2.2,R*0.012,0,'ash',0,0,0.2);
      }
    };
    o.surf=function(){
      var t=o.t,k=ease(t/1.2),fade=t<3.6?1:Math.max(0,1-(t-3.6)/2.6);
      decal(T,R*0.1*(0.8+0.2*Math.sin(t*14)),[255,120,30],0.75*fade);
      ctx.save();ctx.translate(T.x,T.y);ctx.rotate(T.ang);ctx.scale(Math.max(0.3,Math.sqrt(Math.max(0,1-T.d*T.d))),1);
      ctx.lineCap='round';ctx.strokeStyle='rgba(255,'+(100+Math.random()*50|0)+',30,'+0.75*fade+')';ctx.lineWidth=2.4;
      for(var i=0;i<fl.length;i++){var a=fl[i][0],ln=fl[i][1]*k;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(a)*ln*0.6+Math.sin(a)*ln*0.2,Math.sin(a)*ln*0.6,Math.cos(a)*ln,Math.sin(a)*ln);ctx.stroke();}
      ctx.restore();
    };
    o.over=function(){var f=o.t<3.4?1:Math.max(0,1-(o.t-3.4)/1.6);if(f>0){ctx.globalCompositeOperation='lighter';glow(T.x,T.y,R*0.35,[255,130,40],0.45*f);ctx.globalCompositeOperation='source-over';}};
  };
  FX.supernova=function(p){
    var R=v.R,S={x:v.cx-R*(2.6+Math.random()*0.6)*(Math.random()<0.5?1:-1),y:v.cy-R*(1.5+Math.random()*0.5)};
    if(p&&p.from){S=edgePoint(p);} S.x=cl(S.x,10,v.w-10);S.y=cl(S.y,10,v.h-10);
    var o=add({},4.6),big=Math.max(v.w,v.h);
    o.upd=function(dt){
      var t=o.t;v.shake=Math.max(v.shake,0.6*Math.max(0,1-t/2));
      if(t<0.6&&Math.random()<0.8)burst(S.x,S.y,qf(5),'gold',R*1.4,1.2,R*0.05,0,0,0,0.8);
    };
    o.surf=function(){
      var rw=ease(o.t/3.2)*big*1.05,w=R*0.9,al=0.7*(1-ease((o.t-2.6)/1.8));
      if(al<=0.01)return;
      var g=ctx.createRadialGradient(S.x,S.y,Math.max(0,rw-w),S.x,S.y,rw+w*0.5);
      g.addColorStop(0,'rgba(255,230,170,0)');g.addColorStop(0.6,'rgba(255,240,200,'+al+')');g.addColorStop(1,'rgba(255,200,120,0)');
      ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(v.cx-R,v.cy-R,R*2,R*2);ctx.globalCompositeOperation='source-over';
    };
    o.over=function(){
      var t=o.t;ctx.globalCompositeOperation='lighter';
      var fa=t<0.12?t/0.12:Math.max(0,1-(t-0.12)/1.6);fa=fa*fa*0.75;
      if(fa>0.01){var fr=Math.sqrt(v.w*v.w+v.h*v.h)/2,fg=ctx.createRadialGradient(v.cx,v.cy,0,v.cx,v.cy,fr);fg.addColorStop(0,'rgba(255,246,225,'+fa+')');fg.addColorStop(0.65,'rgba(255,240,215,'+fa*0.6+')');fg.addColorStop(1,'rgba(255,240,215,0)');ctx.fillStyle=fg;ctx.fillRect(0,0,v.w,v.h);}
      var sa=Math.max(0,1-t/3.2);glow(S.x,S.y,R*(0.6+t*1.4),[255,235,190],sa);
      ctx.strokeStyle='rgba(255,245,220,'+sa*0.8+')';ctx.lineWidth=2;var L=R*(0.8+t*1.2);
      ctx.beginPath();ctx.moveTo(S.x-L,S.y);ctx.lineTo(S.x+L,S.y);ctx.moveTo(S.x,S.y-L);ctx.lineTo(S.x,S.y+L);ctx.stroke();
      var rr=ease(t/3.4)*big*1.05;ctx.strokeStyle='rgba(255,215,150,'+0.7*Math.max(0,1-t/3.4)+')';ctx.lineWidth=7*(1-t/4.6)+1;ctx.beginPath();ctx.arc(S.x,S.y,rr,0,TAU);ctx.stroke();
      ctx.globalCompositeOperation='source-over';
    };
  };
  FX.war_strike=function(p){
    var n=p.n||(p.kind==='missile'?2:3),R=v.R,strikes=[],o=add({},2.6+n*0.2);
    for(var i=0;i<n;i++){
      var T=tgt(p.x!=null?{x:p.x+(Math.random()-0.5)*0.06,y:p.y+(Math.random()-0.5)*0.06}:{}),kind=p.kind||(Math.random()<0.5?'laser':'missile');
      strikes.push({d:i*0.18,T:T,kind:kind,S:edgePoint(p),done:false,sc:0,dur:kind==='laser'?0.32:0.95});
    }
    o.upd=function(dt){
      for(var i=0;i<strikes.length;i++){var s=strikes[i],t=o.t-s.d;if(t<0)continue;
        if(s.kind==='missile'&&t<s.dur&&Math.random()<0.9){var k=t/s.dur,c=s.cp||(s.cp={x:(s.S.x+s.T.x)/2+(Math.random()-0.5)*R,y:Math.min(s.S.y,s.T.y)-R*0.6});
          var mx=bez(s.S.x,c.x,s.T.x,k),my=bez(s.S.y,c.y,s.T.y,k);pool.spawn(mx,my,(Math.random()-0.5)*10,(Math.random()-0.5)*10,0.6,R*0.03,-2,Math.random()<0.5?'fire':'smoke',0,0,1.5);}
        if(!s.done&&t>=s.dur){s.done=true;s.sc=1;v.shake=Math.max(v.shake,0.6);burst(s.T.x,s.T.y,qf(8),'fire',R*0.6,0.7,R*0.05,R*0.08,0,0,2);burst(s.T.x,s.T.y,qf(10),'spark',R*1.0,0.9,2.5,-1,0,0,1);burst(s.T.x,s.T.y,qf(5),'smoke',R*0.25,1.8,R*0.04,R*0.06,0,-R*0.02,0.8);}
        if(s.sc>0)s.sc=Math.max(0,s.sc-dt*1.8);
      }
    };
    o.surf=function(){for(var i=0;i<strikes.length;i++){var s=strikes[i],t=o.t-s.d-s.dur;if(t>0)decal(s.T,R*0.06,[22,14,12],0.55*Math.max(0,1-t/2.2));}};
    o.over=function(){
      ctx.globalCompositeOperation='lighter';
      for(var i=0;i<strikes.length;i++){var s=strikes[i],t=o.t-s.d;if(t<0)continue;
        if(s.kind==='laser'){
          if(t<s.dur+0.12){var a=t<s.dur?1:1-(t-s.dur)/0.12;
            ctx.lineCap='round';ctx.strokeStyle=rgba([255,70,60],0.35*a);ctx.lineWidth=R*0.07;ctx.beginPath();ctx.moveTo(s.S.x,s.S.y);ctx.lineTo(s.T.x,s.T.y);ctx.stroke();
            ctx.strokeStyle=rgba([255,235,225],0.95*a);ctx.lineWidth=R*0.022;ctx.beginPath();ctx.moveTo(s.S.x,s.S.y);ctx.lineTo(s.T.x,s.T.y);ctx.stroke();
            glow(s.T.x,s.T.y,R*0.18,[255,160,110],a);}
        }else if(t<s.dur){
          var k=t/s.dur,c=s.cp||{x:s.T.x,y:s.T.y},mx=bez(s.S.x,c.x,s.T.x,k),my=bez(s.S.y,c.y,s.T.y,k);
          glow(mx,my,R*0.1,[255,200,140],1);ctx.fillStyle='rgba(255,255,255,0.95)';ctx.beginPath();ctx.arc(mx,my,R*0.018,0,TAU);ctx.fill();
        }
        if(s.sc>0)glow(s.T.x,s.T.y,R*(0.2+(1-s.sc)*0.3),[255,190,110],s.sc);
      }
      ctx.globalCompositeOperation='source-over';
    };
  };
  function shipPath(ctx2,s,k){
    ctx2.beginPath();ctx2.moveTo(s*1.7,0);ctx2.lineTo(s*0.4,-s*0.5);ctx2.lineTo(-s*1.0,-s*0.55);ctx2.lineTo(-s*1.2,-s*0.2);ctx2.lineTo(-s*1.2,s*0.2);ctx2.lineTo(-s*1.0,s*0.55);ctx2.lineTo(s*0.4,s*0.5);ctx2.closePath();
  }
  FX.trade_ship=function(p){
    var R=v.R,o=add({},4.6),dirIn=p.dir!=='out',T=p.x!=null?tgt(p):tgt({x:(v.cx+R*0.45*Math.cos(-0.9))/v.w,y:(v.cy+R*0.55*Math.sin(-0.9))/v.h});
    var P0={x:cl(v.cx+R*2.0,10,v.w-10),y:cl(v.cy-R*1.15,10,v.h-10)},C={x:P0.x-R*0.5,y:Math.min(P0.y,T.y)-R*0.35};
    var land=false;
    function pos(k){return {x:bez(P0.x,C.x,T.x,k),y:bez(P0.y,C.y,T.y,k)};}
    o.k=function(){var k=ease(o.t/o.dur);return dirIn?k:1-k;};
    o.upd=function(dt){
      var k=o.k(),q=pos(k),k2=cl(k+(dirIn?-0.02:0.02),0,1),q2=pos(k2);
      var mv=o.t<o.dur*0.96;
      if(mv)for(var i=0;i<qf(2);i++)pool.spawn(q.x+(q2.x-q.x)*2,q.y+(q2.y-q.y)*2,(q2.x-q.x)*30+(Math.random()-0.5)*6,(q2.y-q.y)*30+(Math.random()-0.5)*6,0.5,R*0.03,-2,Math.random()<0.6?'cyan':'fire',0,0,2);
      if(dirIn&&!land&&o.t>=o.dur*0.9){land=true;burst(T.x,T.y,qf(10),'dust',R*0.25,1.4,R*0.035,R*0.05,0,0,1.2);burst(T.x,T.y,qf(8),'gold',R*0.4,1.1,R*0.03,0,0,0,1.5);}
      if(!dirIn&&!land&&o.t<0.05){land=true;burst(T.x,T.y,qf(10),'dust',R*0.25,1.4,R*0.035,R*0.05,0,0,1.2);}
    };
    o.over=function(){
      var k=o.k(),q=pos(k),q2=pos(cl(k+0.02,0,1)),ang=Math.atan2(q2.y-q.y,q2.x-q.x)+(dirIn?PI:0);
      var s=R*(0.05+0.075*(1-k)),al=dirIn?(o.t<0.3?o.t/0.3:1)*(o.t>o.dur*0.9?Math.max(0,1-(o.t-o.dur*0.9)/(o.dur*0.1)):1):(o.t<o.dur*0.12?o.t/(o.dur*0.12):o.t>o.dur*0.85?Math.max(0,1-(o.t-o.dur*0.85)/(o.dur*0.15)):1);
      if(al<=0.01)return;
      ctx.save();ctx.translate(q.x,q.y);ctx.rotate(ang);ctx.globalAlpha=al;
      shipPath(ctx,s);var g=ctx.createLinearGradient(0,-s,0,s);g.addColorStop(0,'#c8d2e6');g.addColorStop(1,'#5a647c');ctx.fillStyle=g;ctx.fill();
      ctx.fillStyle='#ff9a3c';ctx.fillRect(-s*0.7,-s*0.3,s*0.5,s*0.6);
      ctx.fillStyle='#7fe0ff';ctx.beginPath();ctx.arc(s*0.55,0,s*0.2,0,TAU);ctx.fill();
      ctx.globalCompositeOperation='lighter';glow(-s*1.3,0,s*1.2,[120,220,255],0.9);ctx.restore();
    };
    o.surf=function(){var t=dirIn?o.t-o.dur*0.9:o.t;if(t>0&&t<1.8)ring(T.x,T.y,t*R*0.22,T.d,T.ang,2,[255,230,170],0.5*(1-t/1.8));};
  };
  FX.mine_beam=function(p){
    var R=v.R,T=tgt(p),S=(p.from&&p.from.x!=null)?{x:p.from.x*v.w,y:p.from.y*v.h}:{x:cl(v.cx+R*1.55,8,v.w-8),y:cl(v.cy-R*1.15,8,v.h-8)},o=add({},3.6);
    o.upd=function(dt){
      var env=o.t<0.3?o.t/0.3:o.t>o.dur-0.4?Math.max(0,(o.dur-o.t)/0.4):1;
      if(env<=0.1)return;var dx=S.x-T.x,dy=S.y-T.y,l=Math.sqrt(dx*dx+dy*dy)||1;
      for(var i=0;i<qf(2);i++){var k=Math.random();pool.spawn(T.x+(Math.random()-0.5)*R*0.08,T.y+(Math.random()-0.5)*R*0.08,dx/l*R*(0.9+Math.random()*0.7),dy/l*R*(0.9+Math.random()*0.7)-R*0.2,0.9,R*0.018+Math.random()*R*0.012,-1,k<0.35?'gold':k<0.7?'dust':'spark',0,0,0.6);}
      if(Math.random()<0.5)pool.spawn(T.x,T.y,(Math.random()-0.5)*R*0.5,-R*0.3-Math.random()*R*0.3,0.6,R*0.02,R*0.02,'dust',0,R*0.4,1);
    };
    o.over=function(){
      var env=o.t<0.3?o.t/0.3:o.t>o.dur-0.4?Math.max(0,(o.dur-o.t)/0.4):1;if(env<=0.01)return;
      ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
      ctx.strokeStyle=rgba([255,200,90],0.22*env);ctx.lineWidth=R*0.06;ctx.beginPath();ctx.moveTo(S.x,S.y);ctx.lineTo(T.x,T.y);ctx.stroke();
      ctx.strokeStyle=rgba([255,235,170],0.8*env);ctx.lineWidth=R*0.018*(1+0.3*Math.sin(o.t*30));ctx.setLineDash([R*0.08,R*0.05]);ctx.lineDashOffset=-o.t*R*1.5;
      ctx.beginPath();ctx.moveTo(S.x,S.y);ctx.lineTo(T.x,T.y);ctx.stroke();ctx.setLineDash([]);
      glow(T.x,T.y,R*0.2,[255,210,120],env*(0.7+0.3*Math.sin(o.t*22)));glow(S.x,S.y,R*0.1,[255,230,170],env);
      ctx.globalCompositeOperation='source-over';
    };
    o.surf=function(){var t=o.t;ring(T.x,T.y,R*0.05+((t*1.4)%1)*R*0.12,T.d,T.ang,2,[255,220,150],0.5*(1-(t*1.4)%1));};
  };
  FX.shield=function(p){
    var R=v.R,o=add({hits:[]},3.0),T=p.x!=null||p.hit?tgt(p):null;
    function hit(P){o.hits.push({a:Math.atan2(P.y-v.cy,P.x-v.cx),t:0});}
    if(T)hit(T);else hit({x:v.cx+Math.cos(-0.7)*R,y:v.cy+Math.sin(-0.7)*R});
    o.upd=function(dt){for(var i=0;i<o.hits.length;i++)o.hits[i].t+=dt;};
    o.over=function(){
      var t=o.t,env=t<0.3?t/0.3:t>o.dur-0.6?Math.max(0,(o.dur-t)/0.6):1;if(env<=0)return;
      var rb=R*1.14,fl=0.85+0.15*Math.sin(t*18);
      ctx.save();ctx.globalCompositeOperation='lighter';
      var g=ctx.createRadialGradient(v.cx,v.cy,R*0.8,v.cx,v.cy,rb);g.addColorStop(0,'rgba(80,200,255,0)');g.addColorStop(0.75,'rgba(80,200,255,'+0.07*env+')');g.addColorStop(1,'rgba(120,230,255,'+0.6*env*fl+')');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(v.cx,v.cy,rb,0,TAU);ctx.fill();
      ctx.save();ctx.beginPath();ctx.arc(v.cx,v.cy,rb,0,TAU);ctx.clip();
      ctx.globalAlpha=0.22*env*fl;ctx.fillStyle=ctx.createPattern(hexTile(),'repeat');ctx.fillRect(v.cx-rb,v.cy-rb,rb*2,rb*2);ctx.globalAlpha=1;
      for(var i=0;i<o.hits.length;i++){var h=o.hits[i],hx=v.cx+Math.cos(h.a)*rb,hy=v.cy+Math.sin(h.a)*rb,k=h.t/1.4;
        if(k<1){var rr=k*R*0.9;ctx.strokeStyle='rgba(220,250,255,'+0.85*(1-k)*env+')';ctx.lineWidth=3*(1-k)+1;ctx.beginPath();ctx.arc(hx,hy,rr,0,TAU);ctx.stroke();glow(hx,hy,R*0.25*(1-k*0.5),[160,240,255],(1-k)*env);}}
      ctx.restore();ctx.restore();
    };
  };
  FX.satellite_launch=function(p){
    var R=v.R,T=tgt({lat:62,lon:(p.lon!=null?p.lon:12)}),O={x:cl(v.cx+R*1.62,8,v.w-8),y:cl(v.cy-R*0.4,8,v.h-8)},C={x:T.x+R*0.05,y:T.y-R*1.5},o=add({},4.8),pad=false,arr=false;
    function pos(k){return {x:bez(T.x,C.x,O.x,k),y:bez(T.y,C.y,O.y,k)};}
    o.upd=function(dt){
      var k=ease(o.t/3.3);
      if(!pad){pad=true;burst(T.x,T.y,qf(12),'fire',R*0.4,0.8,R*0.05,R*0.06,0,0,2);burst(T.x,T.y,qf(8),'smoke',R*0.2,1.6,R*0.04,R*0.05,0,-R*0.1,1);}
      if(o.t<3.3){var q=pos(k);for(var i=0;i<qf(3);i++)pool.spawn(q.x,q.y,(Math.random()-0.5)*14,(Math.random()-0.5)*14+10,0.9,R*0.032,-R*0.012,Math.random()<0.5?'fire':'smoke',0,0,1.5);}
      if(!arr&&o.t>=3.3){arr=true;burst(O.x,O.y,qf(18),'cyan',R*0.6,1.0,R*0.03,0,0,0,1.4);burst(O.x,O.y,qf(8),'white',R*0.3,0.8,R*0.04,0,0,0,1.4);}
    };
    o.over=function(){
      var k=ease(o.t/3.3);
      if(o.t<3.3){var q=pos(k),q2=pos(Math.min(1,k+0.02)),a=Math.atan2(q2.y-q.y,q2.x-q.x),s=R*0.045;
        ctx.save();ctx.translate(q.x,q.y);ctx.rotate(a);ctx.fillStyle='#e8eef8';ctx.beginPath();ctx.moveTo(s*2,0);ctx.lineTo(0,-s*0.6);ctx.lineTo(-s*1.4,-s*0.6);ctx.lineTo(-s*1.4,s*0.6);ctx.lineTo(0,s*0.6);ctx.closePath();ctx.fill();
        ctx.globalCompositeOperation='lighter';glow(-s*1.6,0,s*1.4,[255,160,70],1);ctx.restore();}
      else{var f=Math.max(0,1-(o.t-3.3)/1.3);ctx.globalCompositeOperation='lighter';glow(O.x,O.y,R*0.22*(0.5+f),[160,240,255],f);ctx.strokeStyle='rgba(220,250,255,'+f+')';ctx.lineWidth=1.5;var L=R*0.16*f+R*0.04;
        ctx.beginPath();ctx.moveTo(O.x-L,O.y);ctx.lineTo(O.x+L,O.y);ctx.moveTo(O.x,O.y-L);ctx.lineTo(O.x,O.y+L);ctx.stroke();ctx.globalCompositeOperation='source-over';}
    };
  };
  FX.creation=function(p){
    var R=v.R,o=add({burst:false},5.0);
    o.upd=function(dt){
      var t=o.t;
      if(t<2.0)for(var i=0;i<qf(2);i++){var a=Math.random()*TAU,rr=R*(1.7+Math.random()*0.5),x=v.cx+Math.cos(a)*rr,y=v.cy+Math.sin(a)*rr,sp=R*(0.7+Math.random()*0.4);
        pool.spawn(x,y,-Math.cos(a)*sp+Math.sin(a)*sp*0.7,-Math.sin(a)*sp-Math.cos(a)*sp*0.7,1.4,R*0.03,-R*0.01,Math.random()<0.5?'gold':'hot',-Math.cos(a)*sp*0.5,-Math.sin(a)*sp*0.5,0.6);}
      if(!o.burst&&t>=2.0){o.burst=true;v.shake=Math.max(v.shake,0.8);burst(v.cx,v.cy,qf(60),'hot',R*1.5,1.6,R*0.05,0,0,0,0.9);burst(v.cx,v.cy,qf(30),'gold',R*1.0,2.0,R*0.035,0,0,0,0.6);}
    };
    o.surf=function(){var t=o.t,a=bell(t/o.dur)*0.38;ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,215,130,'+a+')';ctx.fillRect(v.cx-R,v.cy-R,R*2,R*2);ctx.globalCompositeOperation='source-over';};
    o.over=function(){
      var t=o.t;ctx.globalCompositeOperation='lighter';
      glow(v.cx,v.cy,R*(0.8+bell(t/o.dur)*1.3),[255,205,120],0.55*bell(t/o.dur));
      if(t>=2.0){var k=(t-2.0)/2.0;if(k<1){ctx.strokeStyle='rgba(255,230,170,'+0.85*(1-k)+')';ctx.lineWidth=5*(1-k)+1;ctx.beginPath();ctx.arc(v.cx,v.cy,R*(1.05+k*1.2),0,TAU);ctx.stroke();}
        var f=Math.max(0,1-(t-2.0)/0.5);if(f>0){var fr2=Math.sqrt(v.w*v.w+v.h*v.h)/2,fg2=ctx.createRadialGradient(v.cx,v.cy,0,v.cx,v.cy,fr2);fg2.addColorStop(0,'rgba(255,240,200,'+0.4*f+')');fg2.addColorStop(1,'rgba(255,240,200,0)');ctx.fillStyle=fg2;ctx.fillRect(0,0,v.w,v.h);}}
      ctx.globalCompositeOperation='source-over';
    };
  };
  FX.life=function(p){
    var R=v.R,o=add({},4.8);
    o.upd=function(dt){
      var t=o.t;if(t<3.8)for(var i=0;i<qf(2);i++){var a=Math.random()*TAU,rr=Math.sqrt(Math.random())*0.85*R;
        pool.spawn(v.cx+Math.cos(a)*rr,v.cy+Math.sin(a)*rr,(Math.random()-0.5)*8,-R*0.12-Math.random()*R*0.1,1.4+Math.random(),R*0.02+Math.random()*R*0.015,0,Math.random()<0.7?'green':'spark',0,0,0.3);}
    };
    o.surf=function(){var t=o.t;ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(90,255,150,'+0.14*bell(t/o.dur)+')';ctx.fillRect(v.cx-R,v.cy-R,R*2,R*2);ctx.globalCompositeOperation='source-over';};
    o.over=function(){
      ctx.globalCompositeOperation='lighter';
      for(var i=0;i<3;i++){var k=((o.t*0.55)+i/3)%1;ctx.strokeStyle='rgba(120,255,170,'+0.45*(1-k)*bell(o.t/o.dur)+')';ctx.lineWidth=2.5*(1-k)+0.5;ctx.beginPath();ctx.arc(v.cx,v.cy,R*(1.02+k*0.5),0,TAU);ctx.stroke();}
      ctx.globalCompositeOperation='source-over';
    };
  };
  FX.city_lights=function(p){
    var R=v.R,o=add({},5.6);
    o.upd=function(dt){
      var t=o.t;v.cityBoost=1+1.6*bell(t/o.dur);
      for(var i=0;i<qf(2);i++){var x=0.1+Math.random()*0.7,y=-0.35+Math.random()*1.0,d=Math.sqrt(x*x+y*y);if(d>0.92||Math.random()>bell(t/o.dur)+0.15)continue;
        pool.spawn(v.cx+x*R,v.cy+y*R,0,0,0.7+Math.random()*0.8,R*0.012+Math.random()*R*0.012,0,'gold',0,0,0);}
    };
    o.end=function(){v.cityBoost=1;};
  };
  FX.flood=function(p){
    var R=v.R,T=tgt(p),o=add({},5.4);
    o.upd=function(dt){
      var t=o.t;if(t<4.2)for(var i=0;i<qf(2);i++)pool.spawn(v.cx+(Math.random()*2-1)*R,v.cy-R*1.05,-R*0.1,R*(1.2+Math.random()*0.5),0.7,R*0.012,0,'water',0,0,0);
    };
    o.surf=function(){
      var t=o.t,k=t<2.6?ease(t/2.6):1-ease((t-3.4)/2.0);k=cl(k,0,1);
      ctx.fillStyle='rgba(40,110,210,'+0.14*bell(t/o.dur)+')';ctx.fillRect(v.cx-R,v.cy-R,R*2,R*2);
      var L=v.cy+R-k*R*1.15;
      ctx.beginPath();ctx.moveTo(v.cx-R,v.cy+R);ctx.lineTo(v.cx-R,L);
      for(var x=-R;x<=R;x+=R*0.1)ctx.lineTo(v.cx+x,L+Math.sin(x*0.05+t*4)*R*0.02);
      ctx.lineTo(v.cx+R,v.cy+R);ctx.closePath();
      var g=ctx.createLinearGradient(0,L,0,v.cy+R);g.addColorStop(0,'rgba(120,190,255,0.62)');g.addColorStop(1,'rgba(30,90,200,0.62)');ctx.fillStyle=g;ctx.fill();
      for(var i=0;i<3;i++){var r2=((t*0.9)+i/3)%1;ring(T.x,T.y,r2*R*0.4,T.d,T.ang,2,[200,230,255],0.5*(1-r2));}
    };
  };
  FX.ice=function(p){
    var R=v.R,T=tgt(p),o=add({},5.4);
    o.upd=function(dt){var t=o.t;if(t<4)for(var i=0;i<qf(2);i++){var a=Math.random()*TAU,rr=Math.random()*ease(t/2.4)*R*0.9;
      pool.spawn(T.x+Math.cos(a)*rr,T.y+Math.sin(a)*rr,(Math.random()-0.5)*6,R*0.04+Math.random()*R*0.04,1.6,R*0.014+Math.random()*R*0.01,0,'ice',0,0,0.2);}};
    o.surf=function(){
      var t=o.t,k=ease(t/2.4),env=t<3.6?1:Math.max(0,1-(t-3.6)/1.8);
      ctx.fillStyle='rgba(150,200,255,'+0.1*bell(t/o.dur)+')';ctx.fillRect(v.cx-R,v.cy-R,R*2,R*2);
      var rr=R*1.5*k,g=ctx.createRadialGradient(T.x,T.y,0,T.x,T.y,Math.max(1,rr));g.addColorStop(0,'rgba(230,246,255,'+0.7*env+')');g.addColorStop(0.7,'rgba(200,232,255,'+0.4*env+')');g.addColorStop(1,'rgba(200,232,255,0)');
      ctx.fillStyle=g;ctx.fillRect(v.cx-R,v.cy-R,R*2,R*2);
      ctx.strokeStyle='rgba(255,255,255,'+0.85*env+')';ctx.lineWidth=1.6;ctx.lineCap='round';
      for(var i=0;i<8;i++){var a=i*PI/4,L=R*0.2*k;ctx.beginPath();ctx.moveTo(T.x,T.y);ctx.lineTo(T.x+Math.cos(a)*L,T.y+Math.sin(a)*L);ctx.stroke();
        var bx=T.x+Math.cos(a)*L*0.6,by=T.y+Math.sin(a)*L*0.6;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(a+0.7)*L*0.3,by+Math.sin(a+0.7)*L*0.3);ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(a-0.7)*L*0.3,by+Math.sin(a-0.7)*L*0.3);ctx.stroke();}
    };
  };
  FX.storm=function(p){
    var R=v.R,T=p.global?{x:v.cx,y:v.cy,d:0,ang:0}:tgt(p),o=add({next:0.3,bolts:[],fl:0},5.8);
    o.upd=function(dt){
      var t=o.t;
      if(t<5)for(var i=0;i<qf(2);i++)pool.spawn(T.x+(Math.random()-0.5)*R*1.2,T.y-R*0.6,R*0.12,R*(1.0+Math.random()*0.5),0.6,R*0.011,0,'water',0,0,0);
      o.next-=dt;if(o.next<=0&&t<5){o.next=0.35+Math.random()*0.8;var bx=T.x+(Math.random()-0.5)*R*0.8;
        o.bolts.push({p:bolt(bx,T.y-R*0.75,bx+(Math.random()-0.5)*R*0.3,T.y+(Math.random()-0.5)*R*0.1,7,R*0.3),t:0});o.fl=1;
        burst(bx,T.y,qf(4),'white',R*0.3,0.3,R*0.02,0,0,0,2);}
      for(var b=o.bolts.length-1;b>=0;b--){o.bolts[b].t+=dt;if(o.bolts[b].t>0.22)o.bolts.splice(b,1);}
      o.fl=Math.max(0,o.fl-dt*5);
    };
    o.surf=function(){
      var t=o.t,env=bell(t/o.dur);
      ctx.fillStyle='rgba(20,26,44,'+0.3*env+')';ctx.fillRect(v.cx-R,v.cy-R,R*2,R*2);
      ctx.lineCap='round';
      for(var a=0;a<4;a++){ctx.strokeStyle='rgba(225,232,245,'+0.3*env+')';ctx.lineWidth=R*0.07;ctx.beginPath();
        for(var s=0;s<=24;s++){var kk=s/24,ang=a*PI/2+kk*3.4+t*0.9,rr=kk*R*0.75;var x=T.x+Math.cos(ang)*rr,y=T.y+Math.sin(ang)*rr*0.9;if(s)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}
      if(o.fl>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(170,195,255,'+0.3*o.fl+')';ctx.fillRect(v.cx-R,v.cy-R,R*2,R*2);ctx.globalCompositeOperation='source-over';}
    };
    o.over=function(){
      ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';
      for(var b=0;b<o.bolts.length;b++){var a=1-o.bolts[b].t/0.22;ctx.strokeStyle='rgba(120,160,255,'+0.5*a+')';ctx.lineWidth=R*0.045;polyline(o.bolts[b].p);ctx.strokeStyle='rgba(255,255,255,'+a+')';ctx.lineWidth=R*0.014;polyline(o.bolts[b].p);}
      ctx.globalCompositeOperation='source-over';
    };
  };
  FX.blackhole=function(p){
    var R=v.R,B={x:cl(v.cx+R*1.7,R*0.5,v.w-R*0.5),y:cl(v.cy-R*0.85,R*0.5,v.h-R*0.5)},o=add({},6.6);
    if(p.x!=null){B.x=p.x*v.w;B.y=p.y*v.h;}
    function env(){var t=o.t;return ease(t/1.0)*(1-ease((t-(o.dur-1.4))/1.4));}
    o.upd=function(dt){
      var e=env();v.shake=Math.max(v.shake,0.3*e);
      if(e>0.3)for(var i=0;i<qf(2);i++){var a=Math.random()*TAU,rr=R*(0.7+Math.random()*0.5),x=B.x+Math.cos(a)*rr,y=B.y+Math.sin(a)*rr*0.6,sp=R*0.7;
        pool.spawn(x,y,-Math.sin(a)*sp,Math.cos(a)*sp*0.6,1.2,R*0.02,-R*0.012,Math.random()<0.5?'purple':'white',(B.x-x)*2.2,(B.y-y)*2.2,0.2);}
    };
    o.over=function(){
      var e=env();if(e<=0.01)return;var rb=R*0.3*e,t=o.t;
      ctx.save();ctx.globalCompositeOperation='lighter';glow(B.x,B.y,rb*3.6,[150,90,255],0.5*e);glow(B.x,B.y,rb*2.2,[255,150,80],0.4*e);ctx.globalCompositeOperation='source-over';
      function disc(front){
        ctx.save();ctx.translate(B.x,B.y);ctx.rotate(-0.38);ctx.scale(1,0.27);
        for(var i=0;i<9;i++){
          var r1=rb*(1.15+i*0.2),w=rb*0.16,col=mixc([255,245,220],[150,70,230],i/8);
          ctx.beginPath();ctx.arc(0,0,r1,front?0:PI,front?PI:TAU);ctx.lineWidth=w;ctx.strokeStyle=rgba(col,(0.75-i*0.06)*e);
          ctx.setLineDash([rb*(0.9+i*0.2),rb*0.25]);ctx.lineDashOffset=-t*rb*(3.0-i*0.25);ctx.globalCompositeOperation='lighter';ctx.stroke();
        }
        ctx.setLineDash([]);ctx.restore();
      }
      disc(false);
      ctx.globalCompositeOperation='source-over';ctx.fillStyle='#000';ctx.beginPath();ctx.arc(B.x,B.y,rb,0,TAU);ctx.fill();
      ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,225,190,'+0.9*e+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(B.x,B.y,rb*1.06,0,TAU);ctx.stroke();
      ctx.strokeStyle='rgba(255,170,90,'+0.35*e+')';ctx.lineWidth=5;ctx.beginPath();ctx.arc(B.x,B.y,rb*1.12,0,TAU);ctx.stroke();
      disc(true);ctx.restore();
    };
  };
  FX.aurora=function(p){var o=add({},5.5);o.upd=function(dt){v.auroraK=bell(o.t/o.dur);};o.end=function(){v.auroraK=0;};};
  FX.pulse=function(p){
    var R=v.R,T=tgt({x:p.x,y:p.y,px:1}),o=add({},1.0),col=tcol;
    burst(T.x,T.y,qf(10),'white',R*0.6,0.7,R*0.025,0,0,0,1.5);burst(T.x,T.y,qf(8),'spark',R*0.5,0.8,R*0.02,0,0,0,1.5);
    o.surf=function(){for(var i=0;i<3;i++){var tt2=o.t-i*0.11;if(tt2<0)continue;var k=Math.min(1,tt2/0.7);ring(T.x,T.y,k*R*0.5,T.d,T.ang,3-i*0.7,[255,255,255].map(function(c,j){return c*0.55+col[j]*0.45;}),0.7*(1-k));}
      decal(T,R*0.14,col,0.4*Math.max(0,1-o.t/0.5));};
  };
  v.pulse=function(x,y){FX.pulse({x:x,y:y});};
  var NAMES=['impact','quake','volcano','supernova','war_strike','trade_ship','mine_beam','shield','satellite_launch','creation','life','city_lights','flood','ice','storm','blackhole','aurora'];
  v.fxNames=NAMES;
  v.fx=function(name,p){
    var f=FX[name];if(!f||!v.R)return null;
    var now=performance.now();if(lastFx[name]&&now-lastFx[name]<60)return null;lastFx[name]=now;
    if(SG.RM&&(name==='supernova'||name==='storm'||name==='blackhole'))p=p||{};
    try{f(p||{});}catch(e){SG.log.err('fx:'+name,e);}
    return v;
  };

  /* ----- çizim ----- */
  function satOf(s,i){
    var m=satM[s.id||i];
    if(!m){var h=SG.hash((s.id||s.name||i)+'');m={phase:(h%1000)/1000*TAU,kind:KINDS[s.kind]?s.kind:['ay','kayalik','buz','lav','col','mars'][h%6],size:0.09+((h>>>5)%40)/1000,spr:null,seed:h};satM[s.id||i]=m;}
    return m;
  }
  function orbit(i){var a=v.R*(1.42+0.2*i);a=Math.max(8,Math.min(a,v.w*0.5-8));return {a:a,b:a*0.3,ang:-0.28+i*0.035};}
  function drawSats(front,ox,oy){
    var p=v.planet,sats=p&&p.sats?p.sats:null;if(!sats)return;
    var n=Math.min(6,sats.length);
    for(var i=0;i<n;i++){
      var s=sats[i],m=satOf(s,i),ob=orbit(i),per=s.per>0?s.per:9*Math.pow(1+0.7*i,1.5);
      var th=m.phase+tt*TAU/Math.max(4,per),sn=Math.sin(th),cs=Math.cos(th),ca=Math.cos(ob.ang),sa=Math.sin(ob.ang);
      var lx=ob.a*cs,ly=ob.b*sn,x=v.cx+ox+lx*ca-ly*sa,y=v.cy+oy+lx*sa+ly*ca;
      var isFront=sn>0;
      if(front!==isFront)continue;
      var rs=v.R*m.size*(0.82+0.3*sn);
      if(!m.spr)m.spr=sprite(m.kind,m.seed,12,40,'x');
      ctx.drawImage(m.spr,x-rs,y-rs,rs*2,rs*2);
    }
  }
  function orbitLines(front,ox,oy){
    var p=v.planet,n=p&&p.sats?Math.min(6,p.sats.length):0;if(!n)return;
    ctx.lineWidth=1;ctx.strokeStyle='rgba(180,210,255,0.13)';
    for(var i=0;i<n;i++){var ob=orbit(i);ctx.save();ctx.translate(v.cx+ox,v.cy+oy);ctx.rotate(ob.ang);ctx.beginPath();ctx.ellipse(0,0,ob.a,ob.b,0,front?0:PI,front?PI:TAU);ctx.stroke();ctx.restore();}
  }
  function aurora(ox,oy){
    var k=Math.max(info.aurora?0.8:0,v.auroraK);if(k<=0.02||v.q<1)return;
    var R=v.R,px=v.cx+ox-R*Math.sin(tilt)*0.9,py=v.cy+oy-R*Math.cos(tilt)*0.78;
    ctx.save();ctx.beginPath();ctx.arc(v.cx+ox,v.cy+oy,R,0,TAU);ctx.clip();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    for(var i=0;i<4;i++){
      var rr=R*(0.16+i*0.07),col=i%2?[190,120,255]:[110,255,180];ctx.strokeStyle=rgba(col,0.32*k);ctx.lineWidth=R*0.05;ctx.beginPath();
      for(var s=0;s<=28;s++){var a=s/28*TAU,w=Math.sin(a*3+tt*1.6+i)*R*0.025;var x=px+Math.cos(a)*(rr+w),y=py+Math.sin(a)*(rr+w)*0.5;if(s)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
      ctx.stroke();
    }
    ctx.restore();
  }
  function draw(dt){
    if(!v.R||!v.w)return;
    var R=v.R,w=v.w,h=v.h;
    ctx.clearRect(0,0,w,h);
    if(dirty){dirty=false;}
    var ox=0,oy=0;
    if(v.shake>0.01&&!SG.RM){var a=v.shake*R*0.035;ox=(Math.random()-0.5)*2*a;oy=(Math.random()-0.5)*2*a;v.shake*=Math.pow(0.04,dt||0.016);}
    // yan sahne parıltısı
    ctx.globalCompositeOperation='lighter';
    var gp=ctx.createRadialGradient(v.cx+ox,v.cy+oy,R*0.7,v.cx+ox,v.cy+oy,Math.max(R*0.8,Math.min(R*2.1,w*0.5,h*0.5)));gp.addColorStop(0,rgba(tcol,0.22));gp.addColorStop(1,rgba(tcol,0));
    ctx.fillStyle=gp;ctx.fillRect(0,0,w,h);
    if(haloS&&v.planet){var hk=R/Rpx;ctx.drawImage(haloS.cv,v.cx+ox-haloS.P*hk,v.cy+oy-haloS.P*hk,haloS.P*2*hk,haloS.P*2*hk);}
    else{var at=info?info.atmo:[120,160,255],g2=ctx.createRadialGradient(v.cx+ox,v.cy+oy,R*0.96,v.cx+ox,v.cy+oy,R*1.26);
    g2.addColorStop(0,rgba(at,0.5*atmoK+0.06));g2.addColorStop(1,rgba(at,0));ctx.fillStyle=g2;ctx.beginPath();ctx.arc(v.cx+ox,v.cy+oy,R*1.26,0,TAU);ctx.fill();}
    ctx.globalCompositeOperation='source-over';
    if(!v.planet||!tex){return;}
    orbitLines(false,ox,oy);
    if(ringOn){if(ringS)drawRingBaked(ctx,v.cx+ox,v.cy+oy,R/Rpx,ringS,false);else drawRingHalf(ctx,v.cx+ox,v.cy+oy,R,seed,kindId,true,info,ringAng,0.27);}
    drawSats(false,ox,oy);
    if(!v.noPaint){
      if(frame%PAINT[v.q]===0||!v.painted){
        v.rotU+=rotSpd*(dt||0)*PAINT[v.q];v.cloudU+=rotSpd*1.35*(dt||0)*PAINT[v.q];
        paint(geoO,tex,img,v.rotU,v.cloudU,info.atmo,atmoK,(v.planet.lvl>=(v.planet.type==='med'?14:22)||v.cityBoost>1?1:0.9)*v.cityBoost,v.q>=2,v.q>=1,fxo);
        offc.putImageData(img,0,0);v.painted=true;
      }
    }
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(off,v.cx+ox-R,v.cy+oy-R,R*2,R*2);
    aurora(ox,oy);
    if(fxs.length){
      ctx.save();ctx.translate(ox,oy);
      ctx.save();clipDisc();for(var i=0;i<fxs.length;i++)if(fxs[i].surf)fxs[i].surf();ctx.restore();ctx.restore();
    }
    if(ringOn){if(ringS)drawRingBaked(ctx,v.cx+ox,v.cy+oy,R/Rpx,ringS,true);else drawRingHalf(ctx,v.cx+ox,v.cy+oy,R,seed,kindId,false,info,ringAng,0.27);}
    orbitLines(true,ox,oy);drawSats(true,ox,oy);
    for(var j=0;j<fxs.length;j++)if(fxs[j].over)fxs[j].over();
    pool.draw(ctx);
  }
  function step(dt,t){
    if(dead||!v.running||!vis||!canvas.isConnected)return;
    tt+=dt;frame++;
    var t0=performance.now();
    for(var i=fxs.length-1;i>=0;i--){var f=fxs[i];f.t+=dt;if(f.upd)f.upd(dt);if(f.t>=f.dur){if(f.end)f.end();fxs.splice(i,1);}}
    pool.update(dt);
    draw(SG.RM?0:dt);
    mon.tick(dt,performance.now()-t0,tt);
  }
  v.start=function(){
    if(v.running||dead)return v;
    v.running=true;v.resize();
    if(opts.bus!==false)busOff=SG.bus.on('fx',function(d){if(!d||!d.name)return;var pp={};if(d.params)for(var k in d.params)pp[k]=d.params[k];if(d.x!=null)pp.x=d.x;if(d.y!=null)pp.y=d.y;v.fx(d.name,pp);});
    if(SG.RM){draw(0);return v;}
    SG.loop.add('w:'+id,step);
    try{if('IntersectionObserver' in window){io=new IntersectionObserver(function(e){vis=e[0].isIntersecting;});io.observe(canvas);}}catch(e){}
    canvas.style.touchAction=canvas.style.touchAction||'manipulation';
    canvas.addEventListener('pointerdown',onDown);
    return v;
  };
  function onDown(e){
    var r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*(v.w/r.width),y=(e.clientY-r.top)*(v.h/r.height);
    var dx=x-v.cx,dy=y-v.cy,d=Math.sqrt(dx*dx+dy*dy);
    if(d<=v.R*1.06){v.pulse(x,y);}
    if(tapCb){try{tapCb(x,y,{nx:dx/v.R,ny:dy/v.R,onPlanet:d<=v.R*1.06});}catch(er){SG.log.err('tap',er);}}
  }
  v.stop=function(){v.running=false;SG.loop.remove('w:'+id);canvas.removeEventListener('pointerdown',onDown);if(io){io.disconnect();io=null;}if(busOff){busOff();busOff=null;}return v;};
  v.destroy=function(){dead=true;v.stop();fxs.length=0;pool.clear();v.planet=null;};
  return v;
};

/* üstel düşüşlü hale sprite'ı (çekirdekte beyaza karışır) ve doğrusal tek renk hale; kare başı gradient yerine önbellekli drawImage */
function sunSprite(c){
  var k='sun'+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0),sp=sprs[k];if(sp)return sp;
  var D=256,cv=mkCv(D,D),x=cv.getContext('2d'),g=x.createRadialGradient(D/2,D/2,0,D/2,D/2,D/2);
  for(var i=0;i<=12;i++){var d=i/12,e=Math.exp(-d*2.6)*(1-d*d),w=Math.max(0,1-d*4);
    g.addColorStop(d,'rgba('+((c[0]+(255-c[0])*w)|0)+','+((c[1]+(255-c[1])*w)|0)+','+((c[2]+(255-c[2])*w)|0)+','+e.toFixed(4)+')');}
  x.fillStyle=g;x.fillRect(0,0,D,D);sprs[k]=cv;return cv;
}
function haloSpr(c){
  var k='hal'+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0),sp=sprs[k];if(sp)return sp;
  var cv=mkCv(64,64),x=cv.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,rgba(c,1));g.addColorStop(1,rgba(c,0));
  x.fillStyle=g;x.fillRect(0,0,64,64);sprs[k]=cv;return cv;
}
/* ---------- SG.W.galaxy : galaksi / yakın gezegen haritası ---------- */
var REL={dost:{c:[70,230,150],t:'Dost'},dusman:{c:[255,80,80],t:'Düşman'},tarafsiz:{c:[170,176,196],t:'Tarafsız'}};
function relOf(r){return REL[r]||REL[(r||'').replace('ş','s').replace('ü','u')]||REL.tarafsiz;}
function typeInfo(t){var T=SG.D&&SG.D.TYPES&&SG.D.TYPES[t];return {c:pc(T&&T.color||'#8aa4ff'),n:T&&T.name||''};}
W.galaxy=function(canvas,opts){
  opts=opts||{};
  var ctx=canvas.getContext('2d'),id='gx'+(++seq),qp=qParse(opts.quality!=null?opts.quality:SG.store.get('quality','auto'));
  var v={q:qp.q,qAuto:qp.auto,running:false,w:0,h:0,dpr:1},mon=QMon(v,1/58);
  var nodes=[],selfN=null,sel=null,selCb=null,cam={x:0,y:0,z:1},camT=null,bg=null,tt=0,frame=0,vis=true,dead=false,io=null,maxD=1;
  var ptr={},drag=null,pinch=null,vel={x:0,y:0},built=0;
  var ZMIN=0.3,ZMAX=3.4,neb=null,bgSeed=(opts.seed!=null?(opts.seed>>>0):777),NEBPAL=[[[110,100,255],[255,90,170]],[[70,200,230],[110,100,255]],[[255,140,70],[255,80,120]],[[90,230,160],[60,150,230]],[[190,120,255],[70,200,230]]];
  function mkBg(){
    var w=Math.max(2,v.w),h=Math.max(2,v.h),c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d'),r=SG.rng(bgSeed);
    var g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#04050f');g.addColorStop(1,'#070a1b');x.fillStyle=g;x.fillRect(0,0,w,h);
    if(neb){x.globalCompositeOperation='lighter';x.globalAlpha=0.5;x.imageSmoothingEnabled=true;x.drawImage(neb,0,0,w,h);x.globalAlpha=1;x.globalCompositeOperation='source-over';}
    var TINT=[[255,255,255],[200,220,255],[255,230,200],[220,200,255]],n=Math.round(w*h/900),i;
    for(i=0;i<n;i++){var m=Math.pow(r(),4),sz=m>0.5?1.7:m>0.12?1.1:0.7,a=0.15+m*0.85,t=TINT[(r()*4)|0];x.fillStyle='rgba('+t[0]+','+t[1]+','+t[2]+','+a.toFixed(2)+')';x.fillRect(r()*w,r()*h,sz,sz);}
    return c;
  }
  function bakeNeb(){
    var pr=SG.rng((bgSeed^0x5bd1e995)>>>0),P=NEBPAL[(pr()*NEBPAL.length)|0];
    nebulaJob(P,((bgSeed*31+7)>>>0),96,96,true,function(cv){if(dead)return;neb=cv;bg=mkBg();if(!v.running||SG.RM)draw(0);});
  }
  v.resize=function(){
    var w=canvas.clientWidth||canvas.width||300,h=canvas.clientHeight||canvas.height||300,d=dpr();
    v.w=w;v.h=h;v.dpr=d;canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);
    bg=mkBg();if(!v.running||SG.RM)draw(0);
  };
  v.setTier=function(n){v.q=cl(n|0,0,3);};
  v.setQuality=function(x){var p=qParse(x);v.qAuto=p.auto;v.setTier(p.q);};
  function sizeOf(lvl){return 16+Math.min(50,lvl||1)*0.32;}
  v.setNodes=function(list,self){
    var me=self||opts.self||(SG.G&&SG.G.planet&&(function(){try{return SG.G.planet();}catch(e){return null;}})());
    selfN=me?{id:me.id||'self',name:me.name||'Senin gezegenin',type:me.type,lvl:me.lvl||1,coord:me.coord||'',kind:me.kind,seed:me.seed,sats:me.sats||[],me:true,x:0,y:0,size:sizeOf(me.lvl)+6,relation:'self',dist:0}:null;
    nodes=[];maxD=1;(list||[]).forEach(function(n){if(n.dist>maxD)maxD=n.dist;});
    (list||[]).forEach(function(n,idx){
      var h=SG.hash(n.id||n.name||'n'),ang=idx*2.399963+((h%1000)/1000)*0.7,r=130+Math.pow((n.dist||maxD*0.5)/maxD,0.75)*320;
      nodes.push({id:n.id,name:n.name,type:n.type,lvl:n.lvl||1,coord:n.coord||'',dist:n.dist||0,relation:n.relation||'tarafsiz',npc:n.npc,kind:KINDS[n.kind]?n.kind:null,seed:h,sats:n.sats,x:Math.cos(ang)*r,y:Math.sin(ang)*r,size:sizeOf(n.lvl),spr:null,phase:(h%1000)/1000*TAU,raw:n});
    });
    for(var it=0;it<45;it++){
      for(var i=0;i<nodes.length;i++)for(var j=i+1;j<nodes.length;j++){
        var a=nodes[i],b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||0.01,md=(a.size+b.size)*1.15+22;
        if(d<md){var p=(md-d)/2/d;a.x-=dx*p;a.y-=dy*p;b.x+=dx*p;b.y+=dy*p;}
      }
      for(i=0;i<nodes.length;i++){var n=nodes[i],dd=Math.sqrt(n.x*n.x+n.y*n.y)||1,mn=70+n.size+(selfN?selfN.size:0);if(dd<mn){n.x*=mn/dd;n.y*=mn/dd;}}
    }
    if(sel){var f=null;for(i=0;i<nodes.length;i++)if(nodes[i].id===sel.id)f=nodes[i];sel=f;}
    fxLayout();
    v.fit();return v;
  };
  v.nodes=function(){return nodes.map(function(n){return n.raw;});};
  v.fit=function(){
    var x0=-60,x1=60,y0=-60,y1=60;
    for(var i=0;i<nodes.length;i++){var n=nodes[i],m=n.size+34;x0=Math.min(x0,n.x-m);x1=Math.max(x1,n.x+m);y0=Math.min(y0,n.y-m);y1=Math.max(y1,n.y+m);}
    var z=Math.min((v.w||300)/(x1-x0),(v.h||300)/(y1-y0));
    cam.x=(x0+x1)/2;cam.y=(y0+y1)/2;cam.z=cl(z,ZMIN,1.4);camT=null;return v;
  };
  v.onSelect=function(fn){selCb=fn;return v;};
  v.selected=function(){return sel?sel.raw||selfN:null;};
  v.select=function(idv,focus){
    var f=null;if(idv!=null){for(var i=0;i<nodes.length;i++)if(nodes[i].id===idv)f=nodes[i];if(!f&&selfN&&selfN.id===idv)f=selfN;}
    sel=f;sel&&(sel.selT=0);
    if(f&&focus)camT={x:f.x,y:f.y,z:Math.max(cam.z,1.1)};
    if(selCb){try{selCb(f?(f.raw||{id:f.id,name:f.name,type:f.type,lvl:f.lvl,coord:f.coord,me:true}):null);}catch(e){SG.log.err('onSelect',e);}}
    return v;
  };
  v.center=function(idv){var f=null;if(idv==null||idv==='self')f=selfN||{x:0,y:0};else for(var i=0;i<nodes.length;i++)if(nodes[i].id===idv)f=nodes[i];if(f)camT={x:f.x,y:f.y,z:cam.z};return v;};
  v.setZoom=function(z){cam.z=cl(z,ZMIN,ZMAX);return v;};
  function sx(x){return (x-cam.x)*cam.z+v.w/2;}
  function sy(y){return (y-cam.y)*cam.z+v.h/2;}
  function pick(x,y){
    var best=null,bd=1e9,all=selfN?nodes.concat([selfN]):nodes;
    for(var i=0;i<all.length;i++){var n=all[i],dx=sx(n.x)-x,dy=sy(n.y)-y,d=Math.sqrt(dx*dx+dy*dy),rr=Math.max(20,n.size*cam.z+12);if(d<rr&&d<bd){bd=d;best=n;}}
    return best;
  }
  /* ----- dokunma / fare ----- */
  function pos(e){var r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(v.w/r.width),y:(e.clientY-r.top)*(v.h/r.height)};}
  function onDown(e){
    var p=pos(e);ptr[e.pointerId]=p;try{canvas.setPointerCapture(e.pointerId);}catch(_){}
    var ids=Object.keys(ptr);camT=null;vel.x=vel.y=0;
    if(ids.length===1){drag={x:p.x,y:p.y,cx:cam.x,cy:cam.y,moved:false,t:performance.now()};pinch=null;}
    else if(ids.length===2){var a=ptr[ids[0]],b=ptr[ids[1]];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:cam.z};drag=null;}
  }
  function onMove(e){
    if(!ptr[e.pointerId])return;var p=pos(e),old=ptr[e.pointerId];ptr[e.pointerId]=p;
    var ids=Object.keys(ptr);
    if(ids.length===1&&drag){
      var dx=p.x-drag.x,dy=p.y-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>6)drag.moved=true;
      if(drag.moved){cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;vel.x=-(p.x-old.x)/cam.z;vel.y=-(p.y-old.y)/cam.z;}
    }else if(ids.length>=2&&pinch){
      var a=ptr[ids[0]],b=ptr[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y)||1,mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      var wx=(mx-v.w/2)/cam.z+cam.x,wy=(my-v.h/2)/cam.z+cam.y;
      cam.z=cl(pinch.z*d/pinch.d,ZMIN,ZMAX);cam.x=wx-(mx-v.w/2)/cam.z;cam.y=wy-(my-v.h/2)/cam.z;
    }
  }
  function onUp(e){
    var p=ptr[e.pointerId];delete ptr[e.pointerId];try{canvas.releasePointerCapture(e.pointerId);}catch(_){}
    var ids=Object.keys(ptr);
    if(drag&&!ids.length){
      if(!drag.moved&&p){var n=pick(p.x,p.y);if(n){if(sel===n)v.select(null);else v.select(n.id);}else if(sel)v.select(null);}
      drag=null;
    }
    if(ids.length<2)pinch=null;
    if(ids.length===1){var q=ptr[ids[0]];drag={x:q.x,y:q.y,cx:cam.x,cy:cam.y,moved:true,t:performance.now()};}
  }
  function onWheel(e){
    e.preventDefault();var p=pos(e),f=Math.exp(-e.deltaY*0.0015),wx=(p.x-v.w/2)/cam.z+cam.x,wy=(p.y-v.h/2)/cam.z+cam.y;
    cam.z=cl(cam.z*f,ZMIN,ZMAX);cam.x=wx-(p.x-v.w/2)/cam.z;cam.y=wy-(p.y-v.h/2)/cam.z;camT=null;
  }
  /* ----- çizim ----- */
  function nodeSprite(n){
    if(n.spr)return n.spr;
    if(built>=3)return null;built++;
    var kid=n.kind||KLIST[n.seed%KLIST.length],info=kindInfo(kid),ring=!!(info.ringP&&((n.seed>>>11)%100)/100<info.ringP);
    n.spr=sprite(kid,n.seed,n.lvl,64,n.type,ring?{ring:1,ringSeed:n.seed}:null);n.ring=ring;return n.spr;
  }
  function drawNode(n,isSelf){
    var x=sx(n.x),y=sy(n.y),r=n.size*cam.z;
    if(x<-r*3||x>v.w+r*3||y<-r*3||y>v.h+r*3)return;
    var spr=nodeSprite(n),ti=typeInfo(n.type),rl=isSelf?{c:[255,230,140]}:relOf(n.relation);
    ctx.globalCompositeOperation='lighter';
    var gg=ctx.createRadialGradient(x,y,r*0.6,x,y,r*(isSelf?3.2:2.3));gg.addColorStop(0,rgba(ti.c,isSelf?0.4:0.26));gg.addColorStop(1,rgba(ti.c,0));
    ctx.fillStyle=gg;ctx.fillRect(x-r*3.3,y-r*3.3,r*6.6,r*6.6);ctx.globalCompositeOperation='source-over';
    if(spr){var s2=r*2*(n.ring?2:1);ctx.drawImage(spr,x-s2/2,y-s2/2,s2,s2);}
    else{ctx.fillStyle=rgba(ti.c,0.6);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
    // uydular
    var sc=n.sats?(typeof n.sats==='number'?n.sats:n.sats.length):Math.min(3,Math.floor((n.lvl||1)/14));
    if(sc>0&&cam.z>0.55){for(var i=0;i<Math.min(4,sc);i++){var a=tt*(0.9-i*0.18)+(n.phase||0)+i*2.1,orx=r*(1.5+i*0.3),ory=orx*0.32,px=x+Math.cos(a)*orx,py=y+Math.sin(a)*ory;ctx.fillStyle='rgba(225,232,245,'+(Math.sin(a)>0?0.95:0.5)+')';ctx.beginPath();ctx.arc(px,py,Math.max(1.3,r*0.09),0,TAU);ctx.fill();}}
    // ilişki halkası
    ctx.lineWidth=isSelf?2:1.4;ctx.strokeStyle=rgba(rl.c,isSelf?0.9:0.65);ctx.beginPath();ctx.arc(x,y,r*1.14+(isSelf?3+Math.sin(tt*3)*1.5:0),0,TAU);ctx.stroke();
    if(isSelf){ctx.strokeStyle='rgba(255,230,140,'+(0.4-0.3*((tt*0.8)%1))+')';ctx.beginPath();ctx.arc(x,y,r*(1.2+((tt*0.8)%1)*0.9),0,TAU);ctx.stroke();}
    if(cam.z>=0.75||isSelf||n===sel){
      ctx.font='600 '+Math.max(10,Math.min(13,11*cam.z+2))+'px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='top';
      var lb=isSelf?(n.name+' · SEN'):n.name;ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillText(lb,x+1,y+r*1.35+1);ctx.fillStyle=isSelf?'#ffe9a0':'#e6ecff';ctx.fillText(lb,x,y+r*1.35);
    }
  }
  function card(n){
    var x=sx(n.x),y=sy(n.y),r=n.size*cam.z,ti=typeInfo(n.type),rl=n.me?{c:[255,230,140],t:'Senin gezegenin'}:relOf(n.relation);
    var lines=[n.name,'Sev '+n.lvl+(ti.n?' · '+ti.n:''),n.coord||'',n.me?'':('Mesafe: '+(n.dist!=null?SG.fmt.num(n.dist):'?'))];
    lines=lines.filter(Boolean);var cw=156,ch=16*lines.length+30;
    var cx=cl(x-cw/2,6,v.w-cw-6),below=y+r*1.9+ch+8<v.h,cy=below?y+r*1.75+10:y-r*1.75-ch-10;cy=cl(cy,6,v.h-ch-6);
    ctx.save();ctx.fillStyle='rgba(8,12,30,0.88)';ctx.strokeStyle=rgba(ti.c,0.8);ctx.lineWidth=1.2;
    ctx.beginPath();if(ctx.roundRect)ctx.roundRect(cx,cy,cw,ch,10);else ctx.rect(cx,cy,cw,ch);ctx.fill();ctx.stroke();
    ctx.textAlign='left';ctx.textBaseline='top';
    for(var i=0;i<lines.length;i++){ctx.font=(i===0?'700 13px':'500 11px')+' system-ui,sans-serif';ctx.fillStyle=i===0?'#fff':i===1?rgba(ti.c,1):'#a9b4d6';ctx.fillText(lines[i],cx+10,cy+8+i*16);}
    var chip=rl.t;ctx.font='700 10px system-ui,sans-serif';var tw=ctx.measureText(chip).width+14,chx=cx+10,chy=cy+ch-20;
    ctx.fillStyle=rgba(rl.c,0.22);ctx.strokeStyle=rgba(rl.c,0.9);ctx.beginPath();if(ctx.roundRect)ctx.roundRect(chx,chy,tw,15,7);else ctx.rect(chx,chy,tw,15);ctx.fill();ctx.stroke();
    ctx.fillStyle=rgba(rl.c,1);ctx.fillText(chip,chx+7,chy+3);ctx.restore();
  }
  function reticle(n){
    var x=sx(n.x),y=sy(n.y),r=n.size*cam.z+10,k=Math.min(1,(n.selT=(n.selT||0)+0.05));
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle='rgba(120,230,255,'+0.9*k+')';ctx.lineWidth=1.6;ctx.setLineDash([6,5]);ctx.lineDashOffset=-tt*18;
    ctx.beginPath();ctx.arc(x,y,r*(1.5-0.3*k),0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.lineWidth=2.4;var s=r*1.55,l=Math.min(14,r*0.5);
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(c){var px=x+c[0]*s,py=y+c[1]*s;ctx.beginPath();ctx.moveTo(px,py-c[1]*l);ctx.lineTo(px,py);ctx.lineTo(px-c[0]*l,py);ctx.stroke();});
    ctx.restore();
  }
  /* ----- galaksi efektleri: kuyruklu yildiz, alevli meteor, buz devleri (tohumlu, havuzlu) ----- */
  var FX=null,fxR=450,iceList=[],iceNodes=[],frs=((bgSeed^0x9e3779b9)>>>0)||1;
  function fr(){frs^=frs<<13;frs>>>=0;frs^=frs>>>17;frs^=frs<<5;frs>>>=0;return frs/4294967296;}
  function fxTail(k){
    var key='fxt'+k,s=sprs[key];if(s)return s;
    var cv,x,i,t,g,hw0,hw1,al;
    if(k==='ion'){
      cv=mkCv(256,32);x=cv.getContext('2d');
      for(i=0;i<5;i++){
        hw0=0.5+i*0.45;hw1=2.5+i*2.4;al=0.2+0.09*(4-i);
        g=x.createLinearGradient(0,0,256,0);
        g.addColorStop(0,'rgba(215,240,255,'+Math.min(1,al*1.7).toFixed(2)+')');g.addColorStop(0.3,'rgba(120,180,255,'+al.toFixed(2)+')');g.addColorStop(1,'rgba(70,110,255,0)');
        x.fillStyle=g;x.beginPath();x.moveTo(0,16-hw0);x.lineTo(256,16-hw1);x.lineTo(256,16+hw1);x.lineTo(0,16+hw0);x.closePath();x.fill();
      }
    }else if(k==='dust'){
      cv=mkCv(256,96);x=cv.getContext('2d');
      for(i=0;i<=50;i++){
        t=i/50;var u=1-t,px=2*u*t*150+t*t*250,py=u*u*10+2*u*t*14+t*t*78,rd=2.5+t*t*18,a2=0.3*Math.pow(1-t,1.25)+0.02;
        g=x.createRadialGradient(px,py,0,px,py,rd);g.addColorStop(0,'rgba(255,236,196,'+a2.toFixed(3)+')');g.addColorStop(1,'rgba(255,214,150,0)');
        x.fillStyle=g;x.fillRect(px-rd,py-rd,rd*2,rd*2);
      }
    }else{
      cv=mkCv(160,32);x=cv.getContext('2d');
      for(i=0;i<4;i++){
        hw0=1+i*0.9;hw1=3+i*3.3;al=0.34+0.1*(3-i);
        g=x.createLinearGradient(0,0,160,0);
        g.addColorStop(0,'rgba(255,250,225,'+Math.min(1,al*1.5).toFixed(2)+')');g.addColorStop(0.2,'rgba(255,175,60,'+al.toFixed(2)+')');g.addColorStop(0.55,'rgba(255,90,30,'+(al*0.6).toFixed(2)+')');g.addColorStop(1,'rgba(150,25,15,0)');
        x.fillStyle=g;x.beginPath();x.moveTo(0,16-hw0);x.lineTo(160,16-hw1);x.lineTo(160,16+hw1);x.lineTo(0,16+hw0);x.closePath();x.fill();
      }
    }
    sprs[key]=cv;return cv;
  }
  function fxInit(){
    var PC=240;
    FX={sHot:haloSpr([255,245,215]),sSpark:haloSpr([255,225,150]),sFire:haloSpr([255,120,40]),sRed:haloSpr([200,50,30]),sSmoke:haloSpr([120,116,124]),sIce:haloSpr([170,225,255]),sComa:haloSpr([190,225,255]),
      ion:fxTail('ion'),dust:fxTail('dust'),flame:fxTail('flame'),
      P:{n:0,cap:PC,x:new Float32Array(PC),y:new Float32Array(PC),vx:new Float32Array(PC),vy:new Float32Array(PC),age:new Float32Array(PC),life:new Float32Array(PC),sz:new Float32Array(PC),k:new Uint8Array(PC)},
      comets:[{id:0,on:false,k:0},{id:1,on:false,k:0}],meteors:[{on:false,acc:0,acf:0,acs:0},{on:false,acc:0,acf:0,acs:0}],mNext:tt+2.5,mK:0,last:tt};
    planComet(FX.comets[0],0,tt+3.5);planComet(FX.comets[1],0,tt+14);
  }
  function planComet(c,k,t0){
    var r=SG.rng((Math.imul(bgSeed,2654435761)^(c.id*40503+k*9973+101))>>>0),R=fxR*1.3,a=r()*TAU,d=r()<0.5?1:-1,b=a+PI+(r()-0.5)*0.9,ca=a+d*PI/2+(r()-0.5)*0.5,cr=fxR*(0.85+r()*0.35);
    c.Ax=Math.cos(a)*R;c.Ay=Math.sin(a)*R;c.Bx=Math.cos(b)*R;c.By=Math.sin(b)*R;c.Cx=Math.cos(ca)*cr;c.Cy=Math.sin(ca)*cr;
    c.dur=22+r()*10;c.t0=t0;c.k=k;c.gap=(v.q>=2?8:14)+r()*(v.q>=2?10:14);c.x=c.y=c.vx=c.vy=0;c.near=c.env=0;
  }
  function pEmit(x,y,vx,vy,life,sz,k){
    var P=FX.P,n=P.n;if(n>=P.cap)return;
    P.x[n]=x;P.y[n]=y;P.vx[n]=vx;P.vy[n]=vy;P.age[n]=0;P.life[n]=life;P.sz[n]=sz;P.k[n]=k;P.n=n+1;
  }
  function isIce(n){var kid=n.kind||KLIST[n.seed%KLIST.length];return kid==='buzdev'||kid==='buz';}
  function placeIce(){
    iceList=[];iceNodes=[];
    var r=SG.rng((bgSeed^0x1ce1ce5)>>>0),all=selfN?nodes.concat([selfN]):nodes,i,j,tries;
    for(i=0;i<3;i++){
      for(tries=0;tries<20;tries++){
        var a=r()*TAU,rad=fxR*(0.45+r()*0.6),s=20+r()*14,x=Math.cos(a)*rad,y=Math.sin(a)*rad,ok=true,dx,dy,md;
        for(j=0;j<all.length&&ok;j++){dx=all[j].x-x;dy=all[j].y-y;md=(all[j].size+s)*1.35+40;if(dx*dx+dy*dy<md*md)ok=false;}
        for(j=0;j<iceList.length&&ok;j++){dx=iceList[j].x-x;dy=iceList[j].y-y;md=(iceList[j].size+s)*1.35+50;if(dx*dx+dy*dy<md*md)ok=false;}
        if(ok){var sd=(r()*4294967296)>>>0;iceList.push({x:x,y:y,size:s,seed:sd,ring:r()<0.55,phase:r()*TAU,glint:0,spr:null});break;}
      }
    }
    for(i=0;i<nodes.length;i++){if(isIce(nodes[i])){nodes[i].glint=0;iceNodes.push(nodes[i]);}}
  }
  function fxLayout(){
    var m=0,i,d;for(i=0;i<nodes.length;i++){d=Math.sqrt(nodes[i].x*nodes[i].x+nodes[i].y*nodes[i].y)+nodes[i].size;if(d>m)m=d;}
    fxR=Math.max(320,m+40);placeIce();
  }
  function iceSprite(g){
    if(g.spr)return g.spr;if(built>=3)return null;built++;
    g.spr=sprite('buzdev',g.seed,14,64,null,g.ring?{ring:1,ringSeed:g.seed}:null);return g.spr;
  }
  function glintNear(x,y){
    var i,g,dx,dy,md,cnt=v.q>=2?3:(v.q===1?1:0);
    for(i=0;i<cnt&&i<iceList.length;i++){g=iceList[i];dx=g.x-x;dy=g.y-y;md=g.size*3+70;if(dx*dx+dy*dy<md*md)g.glint=1;}
    if(v.q>=1)for(i=0;i<iceNodes.length;i++){g=iceNodes[i];dx=g.x-x;dy=g.y-y;md=g.size*3+70;if(dx*dx+dy*dy<md*md)g.glint=1;}
  }
  function fxUpdate(edt){
    var i,c,m,u,w,d,P=FX.P,n,a,q=v.q,nC=q>=2?2:1,nM=q>=2?2:1,act=0;
    // kuyruklu yildizlar
    for(i=0;i<nC;i++){
      c=FX.comets[i];
      while(tt>=c.t0+c.dur)planComet(c,c.k+1,c.t0+c.dur+c.gap);
      c.on=tt>=c.t0;
      if(c.on){
        u=(tt-c.t0)/c.dur;w=1-u;
        c.x=w*w*c.Ax+2*w*u*c.Cx+u*u*c.Bx;c.y=w*w*c.Ay+2*w*u*c.Cy+u*u*c.By;
        c.vx=2*w*(c.Cx-c.Ax)+2*u*(c.Bx-c.Cx);c.vy=2*w*(c.Cy-c.Ay)+2*u*(c.By-c.Cy);
        d=Math.sqrt(c.x*c.x+c.y*c.y);c.near=cl(1-d/(fxR*1.3),0,1);c.env=Math.min(1,u*8,(1-u)*8);
        if(q>=2&&edt>0&&fr()<edt*5)pEmit(c.x+(fr()-0.5)*6,c.y+(fr()-0.5)*6,c.x/(d||1)*14+(fr()-0.5)*10,c.y/(d||1)*14+(fr()-0.5)*10,0.9+fr()*0.6,3+fr()*2.5,3);
        glintNear(c.x,c.y);
      }
    }
    // alevli meteorlar
    for(i=0;i<2;i++){
      m=FX.meteors[i];if(!m.on)continue;
      u=(tt-m.t0)/m.dur;if(u>=1){m.on=false;continue;}
      m.x=m.sx+m.dx*m.L*u;m.y=m.sy+m.dy*m.L*u;m.env=Math.min(1,u*6,(1-u)*6);act++;
      glintNear(m.x,m.y);
      if(edt>0&&q>=1){
        var spd=m.L/m.dur;
        m.acc+=edt*(q>=2?60:40);
        while(m.acc>=1){m.acc-=1;pEmit(m.x+(fr()-0.5)*5,m.y+(fr()-0.5)*5,-m.dx*spd*0.1+(fr()-0.5)*50,-m.dy*spd*0.1+(fr()-0.5)*50,0.35+fr()*0.4,3+fr()*3,0);}
        if(q>=2){
          m.acf+=edt*26;while(m.acf>=1){m.acf-=1;pEmit(m.x+(fr()-0.5)*6,m.y+(fr()-0.5)*6,-m.dx*spd*0.06+(fr()-0.5)*24,-m.dy*spd*0.06+(fr()-0.5)*24,0.5+fr()*0.4,7+fr()*5,1);}
          m.acs+=edt*14;while(m.acs>=1){m.acs-=1;pEmit(m.x+(fr()-0.5)*8,m.y+(fr()-0.5)*8,-m.dx*spd*0.04+(fr()-0.5)*16,-m.dy*spd*0.04+(fr()-0.5)*16,1+fr()*0.8,8+fr()*6,2);}
        }
      }
    }
    if(tt>=FX.mNext&&act<nM){
      var all=nodes.length+(selfN?1:0);
      if(all){
        var r=SG.rng((Math.imul(bgSeed,1597)+FX.mK*7919+17)>>>0),b,th,dx,dy,side,off,L;FX.mK++;
        b=(a=(r()*all)|0)<nodes.length?nodes[a]:selfN;
        m=FX.meteors[0].on?FX.meteors[1]:FX.meteors[0];
        th=r()*TAU;dx=Math.cos(th);dy=Math.sin(th);side=r()<0.5?-1:1;off=(b.size*(1.5+r()*1.3)+8)*side;L=380+r()*160;
        m.sx=b.x-dx*L*0.5-dy*off;m.sy=b.y-dy*L*0.5+dx*off;m.dx=dx;m.dy=dy;m.L=L;m.dur=1.1+r()*0.7;m.t0=tt;m.on=true;m.acc=m.acf=m.acs=0;m.x=m.sx;m.y=m.sy;m.env=0;
        FX.mNext=tt+(q>=2?2.2+r()*3.5:4+r()*6);
      }else FX.mNext=tt+3;
    }
    // buz devi parilti sonumu
    for(i=0;i<iceList.length;i++)if(iceList[i].glint>0)iceList[i].glint=Math.max(0,iceList[i].glint-edt*1.1);
    for(i=0;i<iceNodes.length;i++)if(iceNodes[i].glint>0)iceNodes[i].glint=Math.max(0,iceNodes[i].glint-edt*1.1);
    // parcaciklar
    if(edt>0){
      var dr=Math.pow(0.35,edt);
      for(i=P.n-1;i>=0;i--){
        if((P.age[i]+=edt)>=P.life[i]){n=--P.n;P.x[i]=P.x[n];P.y[i]=P.y[n];P.vx[i]=P.vx[n];P.vy[i]=P.vy[n];P.age[i]=P.age[n];P.life[i]=P.life[n];P.sz[i]=P.sz[n];P.k[i]=P.k[n];continue;}
        P.x[i]+=P.vx[i]*edt;P.y[i]+=P.vy[i]*edt;P.vx[i]*=dr;P.vy[i]*=dr;
      }
    }
  }
  function fxTick(){
    if(!FX)fxInit();
    var edt=cl(tt-FX.last,0,0.1);FX.last=tt;fxUpdate(edt);
  }
  function tailDraw(spr,x,y,ang,len,hgt,oy,al,flip){
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);if(flip)ctx.scale(1,-1);ctx.globalAlpha=al;ctx.drawImage(spr,0,-hgt*oy,len,hgt);ctx.restore();
  }
  function starDraw(x,y,r,tw,gl){
    var a=Math.max(tw-0.45,0)*1.2+gl;if(a<0.05)return;
    var len=r*(0.8+a*1.4)+4;x+=r*0.4;y-=r*0.4;
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a>1?1:a;ctx.strokeStyle='rgb(215,242,255)';ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(x-len,y);ctx.lineTo(x+len,y);ctx.moveTo(x,y-len*0.9);ctx.lineTo(x,y+len*0.9);ctx.stroke();
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  }
  function fxIceDraw(){
    if(!FX)return;
    var cnt=v.q>=2?3:(v.q===1?1:0),i,g,x,y,r,tw,hr,s2,spr;
    for(i=0;i<cnt&&i<iceList.length;i++){
      g=iceList[i];x=sx(g.x);y=sy(g.y);r=g.size*cam.z;
      if(x<-r*4||x>v.w+r*4||y<-r*4||y>v.h+r*4)continue;
      tw=0.5+0.5*Math.sin(tt*2.1+g.phase);hr=r*(2.4+g.glint*2.5);
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.2+0.08*tw+g.glint*0.5;ctx.drawImage(FX.sIce,x-hr,y-hr,hr*2,hr*2);
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=0.92;spr=iceSprite(g);
      if(spr){s2=r*2*(g.ring?2:1);ctx.drawImage(spr,x-s2/2,y-s2/2,s2,s2);}
      else{ctx.fillStyle='rgb(120,190,235)';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
      ctx.globalAlpha=1;starDraw(x,y,r,tw,g.glint);
    }
  }
  function fxFrostDraw(){
    if(!FX||v.q<1)return;
    var i,g,x,y,r,tw,hr;
    for(i=0;i<iceNodes.length;i++){
      g=iceNodes[i];x=sx(g.x);y=sy(g.y);r=g.size*cam.z;
      if(x<-r*4||x>v.w+r*4||y<-r*4||y>v.h+r*4)continue;
      tw=0.5+0.5*Math.sin(tt*1.7+(g.phase||0));
      if(v.q>=2&&g.glint>0.03){hr=r*(2.6+g.glint*2);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.1+0.08*tw+g.glint*0.45;ctx.drawImage(FX.sIce,x-hr,y-hr,hr*2,hr*2);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
      starDraw(x,y,r,tw,g.glint);
    }
  }
  function fxFlyDraw(){
    if(!FX)return;
    var P=FX.P,n=P.n,i,f,x,y,sz,k,sp,al,z=cl(cam.z,0.5,2),c,m,r1,r2,ang,nC=v.q>=2?2:1;
    if(n){
      for(i=0;i<n;i++){
        if(P.k[i]!==2)continue;
        f=P.age[i]/P.life[i];x=sx(P.x[i]);y=sy(P.y[i]);if(x<-40||x>v.w+40||y<-40||y>v.h+40)continue;sz=P.sz[i]*(1+f*2.2)*z;
        ctx.globalAlpha=(f<0.15?f/0.15:1)*(1-f)*0.2;ctx.drawImage(FX.sSmoke,x-sz,y-sz,sz*2,sz*2);
      }
      ctx.globalCompositeOperation='lighter';
      for(i=0;i<n;i++){
        k=P.k[i];if(k===2)continue;
        f=P.age[i]/P.life[i];x=sx(P.x[i]);y=sy(P.y[i]);if(x<-40||x>v.w+40||y<-40||y>v.h+40)continue;
        if(k===0){sp=f<0.3?FX.sHot:FX.sSpark;al=(1-f)*0.9;sz=P.sz[i]*(1-0.5*f)*z;}
        else if(k===1){sp=f<0.5?FX.sFire:FX.sRed;al=(1-f)*0.65;sz=P.sz[i]*(1+f*0.6)*z;}
        else{sp=FX.sIce;al=(1-f)*0.8;sz=P.sz[i]*(1-0.3*f)*z;}
        ctx.globalAlpha=al;ctx.drawImage(sp,x-sz,y-sz,sz*2,sz*2);
      }
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    }
    for(i=0;i<nC;i++){
      c=FX.comets[i];if(!c.on)continue;
      x=sx(c.x);y=sy(c.y);if(x<-380||x>v.w+380||y<-380||y>v.h+380)continue;
      ang=Math.atan2(c.y,c.x);
      ctx.globalCompositeOperation='lighter';
      tailDraw(FX.ion,x,y,ang,(120+170*c.near)*z,26*z,0.5,0.85*c.env,false);
      if(v.q>=1)tailDraw(FX.dust,x,y,ang,(90+120*c.near)*z,(70+40*c.near)*z,10/96,0.8*c.env,(-Math.sin(ang)*c.vx+Math.cos(ang)*c.vy)>0);
      r1=(13+9*c.near)*z;r2=5.5*z;
      ctx.globalAlpha=0.85*c.env;ctx.drawImage(FX.sComa,x-r1,y-r1,r1*2,r1*2);
      ctx.globalAlpha=c.env;ctx.drawImage(FX.sHot,x-r2,y-r2,r2*2,r2*2);
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    }
    for(i=0;i<2;i++){
      m=FX.meteors[i];if(!m.on)continue;
      x=sx(m.x);y=sy(m.y);if(x<-300||x>v.w+300||y<-300||y>v.h+300)continue;
      z=cl(cam.z,0.6,1.5);ang=Math.atan2(m.dy,m.dx)+PI;
      ctx.globalCompositeOperation='lighter';
      tailDraw(FX.flame,x,y,ang,150*z,24*z,0.5,0.95*m.env,false);
      r1=22*z;r2=10*z;
      ctx.globalAlpha=0.8*m.env;ctx.drawImage(FX.sFire,x-r1,y-r1,r1*2,r1*2);
      ctx.globalAlpha=m.env;ctx.drawImage(FX.sHot,x-r2,y-r2,r2*2,r2*2);
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    }
  }
  function draw(dt){
    var w=v.w,h=v.h;if(!w)return;
    fxTick();
    if(bg){var ox=(((-cam.x*0.2*cam.z)%w)+w)%w,oy=(((-cam.y*0.2*cam.z)%h)+h)%h;
      for(var a=-1;a<=0;a++)for(var b=-1;b<=0;b++)ctx.drawImage(bg,ox+a*w,oy+b*h,w,h);}
    var cx0=sx(0),cy0=sy(0),tc=selfN?typeInfo(selfN.type).c:[120,150,255];
    ctx.globalCompositeOperation='lighter';
    var S=420*cam.z;ctx.globalAlpha=0.5;ctx.drawImage(sunSprite(tc),cx0-S,cy0-S,S*2,S*2);ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';
    // menzil halkaları
    ctx.lineWidth=1;ctx.setLineDash([3,7]);ctx.strokeStyle='rgba(150,180,255,0.14)';
    for(var rr=1;rr<=3;rr++){var R2=(120+rr*100)*cam.z;ctx.beginPath();ctx.arc(cx0,cy0,R2,0,TAU);ctx.stroke();}
    ctx.setLineDash([]);
    // bağlantılar
    if(selfN){
      for(var i=0;i<nodes.length;i++){
        var n=nodes[i],rl=relOf(n.relation),isS=n===sel,x1=sx(n.x),y1=sy(n.y);
        ctx.strokeStyle=rgba(rl.c,isS?0.95:0.3);ctx.lineWidth=isS?2:1;
        if(n.relation!=='dost'&&n.relation!=='dusman'||false)ctx.setLineDash([4,6]);
        ctx.beginPath();ctx.moveTo(cx0,cy0);ctx.lineTo(x1,y1);ctx.stroke();ctx.setLineDash([]);
        if(v.q>=2&&(n.relation==='dost'||n.relation==='dusman')){
          var k=(tt*0.35+n.phase/TAU)%1,dx=cx0+(x1-cx0)*(n.relation==='dusman'?1-k:k),dy=cy0+(y1-cy0)*(n.relation==='dusman'?1-k:k);
          ctx.globalCompositeOperation='lighter';glow(dx,dy,7,rl.c,0.9);ctx.globalCompositeOperation='source-over';
        }
      }
    }
    fxIceDraw();
    for(i=0;i<nodes.length;i++)drawNode(nodes[i],false);
    if(selfN)drawNode(selfN,true);
    fxFrostDraw();fxFlyDraw();
    if(sel){reticle(sel);card(sel);}
  }
  function glow(x,y,rad,col,al){ctx.globalAlpha=al;ctx.drawImage(haloSpr(col),x-rad,y-rad,rad*2,rad*2);ctx.globalAlpha=1;}
  function step(dt){
    if(dead||!v.running||!vis||!canvas.isConnected)return;
    tt+=dt;frame++;if(v.q===0&&frame%2)return;
    var t0=performance.now();built=0;
    if(!drag||!drag.moved){if(Math.abs(vel.x)+Math.abs(vel.y)>0.01&&!pinch){cam.x+=vel.x;cam.y+=vel.y;var f=Math.pow(0.02,dt);vel.x*=f;vel.y*=f;}}
    if(camT){var k=1-Math.pow(0.0008,dt);cam.x+=(camT.x-cam.x)*k;cam.y+=(camT.y-cam.y)*k;cam.z+=(camT.z-cam.z)*k;if(Math.abs(camT.x-cam.x)+Math.abs(camT.y-cam.y)<0.5)camT=null;}
    draw(dt);mon.tick(dt,performance.now()-t0,tt);
  }
  v.start=function(){
    if(v.running||dead)return v;
    v.running=true;v.resize();bakeNeb();
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);canvas.addEventListener('wheel',onWheel,{passive:false});
    if(SG.RM){draw(0);return v;}
    SG.loop.add('w:'+id,step);
    try{if('IntersectionObserver' in window){io=new IntersectionObserver(function(e){vis=e[0].isIntersecting;});io.observe(canvas);}}catch(e){}
    return v;
  };
  v.stop=function(){v.running=false;SG.loop.remove('w:'+id);['pointerdown','pointermove','pointerup','pointercancel'].forEach(function(n){canvas.removeEventListener(n,{pointerdown:onDown,pointermove:onMove,pointerup:onUp,pointercancel:onUp}[n]);});canvas.removeEventListener('wheel',onWheel);if(io){io.disconnect();io=null;}return v;};
  v.destroy=function(){dead=true;v.stop();nodes=[];selfN=null;sel=null;FX=null;iceList=[];iceNodes=[];};
  v.redraw=function(){draw(0);};
  return v;
};
W.sprite=sprite;
W.kindInfo=function(id){return kindInfo(id);};
W.ready=true;
})();
