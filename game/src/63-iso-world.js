/* SpacEgg v2.4 — izometrik dünya: arazi, su, bulut gölgesi, gece, kamera (Grafik 1)
   Mantıksal koordinat: karo (i,j) merkezi = ((i-j)*32, (i+j)*16). Kamera {x,y,zoom}: x,y ekran ortasındaki mantıksal nokta.
   t = saniye. Arazi (kara) bir kez offscreen önbelleğe çizilir; su/köpük/nehir/bulut kare başı ucuz çizilir. */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var Iso=SG.Iso=SG.Iso||{};
var N=24,HW=32,HH=16,PI=Math.PI,TAU=PI*2;

/* ---------- yardımcılar ---------- */
function hs(s){if(typeof s==='number')return s|0;s=String(s);var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h|0;}
function mk(seed){var a=seed|0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function rngOf(seed){return mk(hs(seed));}
function hash2(x,y){var h=Math.imul(x*374761393+y*668265263+7,1274126177);h^=h>>>13;h=Math.imul(h,1274126177);return((h^h>>>16)>>>0)/4294967296;}
function hex(h){return[parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)];}
function mix(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function sc(a,k){return[Math.min(255,a[0]*k),Math.min(255,a[1]*k),Math.min(255,a[2]*k)];}
function css(c,a){return a==null?'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')':'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+a+')';}
function lum(c){return .3*c[0]+.59*c[1]+.11*c[2];}
/* renk tonu kaydır, parlaklığı koru */
function tint(c,t,k){var m=mix(c,t,k),l=lum(m)||1;return sc(m,lum(c)/l*.97);}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function mkCv(w,h){var c=document.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c;}

/* ---------- 12 medeniyet paleti: duvar, çatı, vurgu, koyu, parıltı, atmosfer ---------- */
var CIVS=['kulhan','kirkbicak','lumeren','tuzdalga','cinar','ruzgarguder','buzag','kulluspor','karaoz','sesdokur','ruyag','ipekci'];
var RAW={
kulhan:['#9A6E5C','#E8452C','#FF9A3C','#3A2420','#FF8A2C','#8A2F1B'],
kirkbicak:['#DCCB86','#C9A227','#8DB600','#5A4A1E','#FFD84A','#C9A94A'],
lumeren:['#D6F0F6','#2FC9F0','#A5F2D0','#1E4A6A','#7DEBFF','#2E8FA8'],
tuzdalga:['#F0E3B2','#1FA9C9','#E5F6FF','#0F4A6E','#8FE3F5','#1B6E99'],
cinar:['#D9B26A','#4FAE5E','#EAF7E1','#5A3C1E','#B7F59A','#2F7A47'],
ruzgarguder:['#E8E4D0','#F2C14E','#7FB8E3','#3A4A6E','#FFE08A','#D9A441'],
buzag:['#DCEFF8','#6FC3E0','#3D6A8C','#35607E','#CFF3FF','#9FD4E6'],
kulluspor:['#A9B45E','#7FA32A','#C4E04A','#4A3A4E','#D8F060','#8C9A3A'],
karaoz:['#7A6AA2','#9A3BE0','#D77BFF','#1E1236','#C060FF','#241447'],
sesdokur:['#E9DDF5','#FF5CA8','#5CE1E6','#3A2766','#FFF3A8','#8E4DB5'],
ruyag:['#D8F4F0','#2EC4B6','#B388FF','#1F4A50','#B388FF','#3A8E9C'],
ipekci:['#E8D5B5','#C94F7C','#F2A65A','#5A3040','#F2A65A','#D98A5F']
};
var PALC={};
function civPal(id){
 if(id&&typeof id==='object')id=id.id;
 if(typeof id==='number')id=CIVS[((id%12)+12)%12];
 if(!RAW[id])id=CIVS[Math.abs(hs(id||'cinar'))%12];
 if(!PALC[id]){var r=RAW[id].map(hex);PALC[id]={id:id,wall:r[0],roof:r[1],accent:r[2],dark:r[3],glow:r[4],atm:r[5]};}
 return PALC[id];
}
Iso.civPal=civPal;Iso.CIVS=CIVS;Iso.util={mix:mix,sc:sc,css:css,hash2:hash2,mk:mk,hs:hs,mkCv:mkCv,tint:tint,lum:lum};

/* ---------- arazi üretimi ---------- */
function vnoise(tab,x,y){var xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);
 var a=tab[((xi&15)<<4)|(yi&15)],b=tab[(((xi+1)&15)<<4)|(yi&15)],c=tab[((xi&15)<<4)|((yi+1)&15)],d=tab[(((xi+1)&15)<<4)|((yi+1)&15)];
 return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;}
var DIR4=[[1,0],[0,1],[-1,0],[0,-1]];

function gen(seed,civId){
 var r=rngOf(seed),T1=[],T2=[],T3=[],i,j,k;
 for(i=0;i<256;i++){T1.push(r());T2.push(r());T3.push(r());}
 var ci=11.5+(r()-.5)*2,cj=11.5+(r()-.5)*2,ra=9.4+r()*1.3,rb=9.4+r()*1.3,rot=r()*PI,cs=Math.cos(rot),sn=Math.sin(rot);
 var kind=new Uint8Array(N*N),hgt=new Float32Array(N*N);
 var ix=function(i,j){return j*N+i;};
 var inb=function(i,j){return i>=0&&j>=0&&i<N&&j<N;};
 for(j=0;j<N;j++)for(i=0;i<N;i++){
  var dx=i-ci,dy=j-cj,rx=(dx*cs+dy*sn)/ra,ry=(-dx*sn+dy*cs)/rb,d=Math.hypot(rx,ry);
  var n=vnoise(T1,i*.28,j*.28)*.6+vnoise(T2,i*.62+3,j*.62+5)*.4;
  var L=(1-d)+(n-.5)*.75;
  kind[ix(i,j)]=(L>.07&&i>0&&j>0&&i<N-1&&j<N-1)?2:0;
 }
 /* en büyük kara parçası */
 var comp=new Int16Array(N*N).fill(-1),best=-1,bestN=0,nc=0;
 for(j=0;j<N;j++)for(i=0;i<N;i++){if(kind[ix(i,j)]===0||comp[ix(i,j)]>=0)continue;
  var st=[[i,j]],cnt=0;comp[ix(i,j)]=nc;
  while(st.length){var p=st.pop();cnt++;for(k=0;k<4;k++){var a=p[0]+DIR4[k][0],b=p[1]+DIR4[k][1];if(inb(a,b)&&kind[ix(a,b)]&&comp[ix(a,b)]<0){comp[ix(a,b)]=nc;st.push([a,b]);}}}
  if(cnt>bestN){bestN=cnt;best=nc;}nc++;}
 for(i=0;i<N*N;i++)if(comp[i]!==best)kind[i]=0;
 /* iç göl kalmasın: kenardan taşan deniz dışındakiler kara olsun */
 var sea=new Uint8Array(N*N),q=[];
 for(i=0;i<N;i++){q.push([i,0],[i,N-1],[0,i],[N-1,i]);}
 while(q.length){var pp=q.pop();if(!inb(pp[0],pp[1])||sea[ix(pp[0],pp[1])]||kind[ix(pp[0],pp[1])])continue;sea[ix(pp[0],pp[1])]=1;for(k=0;k<4;k++)q.push([pp[0]+DIR4[k][0],pp[1]+DIR4[k][1]]);}
 for(i=0;i<N*N;i++)if(!kind[i]&&!sea[i])kind[i]=2;
 /* kıyıya uzaklık (kıyı karosu = 1) */
 var D=new Int16Array(N*N).fill(99);q=[];
 for(j=0;j<N;j++)for(i=0;i<N;i++){if(!kind[ix(i,j)])continue;var edge=false;for(k=0;k<4;k++){var a2=i+DIR4[k][0],b2=j+DIR4[k][1];if(!inb(a2,b2)||!kind[ix(a2,b2)])edge=true;}if(edge){D[ix(i,j)]=1;q.push([i,j]);}}
 for(var qi=0;qi<q.length;qi++){var c=q[qi],dd=D[ix(c[0],c[1])];for(k=0;k<4;k++){var a3=c[0]+DIR4[k][0],b3=c[1]+DIR4[k][1];if(inb(a3,b3)&&kind[ix(a3,b3)]&&D[ix(a3,b3)]>dd+1){D[ix(a3,b3)]=dd+1;q.push([a3,b3]);}}}
 var land=[],sx=0,sy=0;
 for(j=0;j<N;j++)for(i=0;i<N;i++)if(kind[ix(i,j)]){land.push([i,j]);sx+=i;sy+=j;}
 var cx=sx/land.length,cy=sy/land.length;
 /* köy merkezi (hall): kıyıdan en az 3 uzak, ağırlık merkezine yakın */
 var hall=null,hb=1e9;
 for(k=0;k<land.length;k++){var L2=land[k];if(D[ix(L2[0],L2[1])]<3)continue;var dq=Math.hypot(L2[0]-cx,L2[1]-(cy+.8));if(dq<hb){hb=dq;hall=L2;}}
 if(!hall)return null;
 /* dağlar: kuzey yarıda (i+j küçük), köyden uzak */
 var mc=[],tries=0;
 while(mc.length<2&&tries++<200){var c2=land[(r()*land.length)|0];if(D[ix(c2[0],c2[1])]<3)continue;if(Math.hypot(c2[0]-hall[0],c2[1]-hall[1])<5)continue;if(c2[0]+c2[1]>hall[0]+hall[1]-2)continue;
  var okc=true;for(k=0;k<mc.length;k++)if(Math.hypot(c2[0]-mc[k][0],c2[1]-mc[k][1])<4)okc=false;if(okc)mc.push([c2[0],c2[1],mc.length?.7+r()*.3:1.05,1.3+r()*.8]);}
 if(!mc.length)return null;
 for(j=0;j<N;j++)for(i=0;i<N;i++){if(!kind[ix(i,j)])continue;
  var m=0;for(k=0;k<mc.length;k++){var ddm=(i-mc[k][0])*(i-mc[k][0])+(j-mc[k][1])*(j-mc[k][1]);m+=mc[k][2]*Math.exp(-ddm/(2*mc[k][3]*mc[k][3]));}
  var h=Math.min(D[ix(i,j)]-1,6)/6*.22+m+(vnoise(T2,i*.5,j*.5)-.5)*.1;
  hgt[ix(i,j)]=h;
  var kd=2;
  if(h>.9)kd=6;else if(h>.5)kd=4;
  if(D[ix(i,j)]===1&&kd<4)kd=1;
  if(D[ix(i,j)]<=2&&kd>=4){kd=D[ix(i,j)]===1?1:2;}
  kind[ix(i,j)]=kd;}
 /* köy çevresi ova */
 for(j=0;j<N;j++)for(i=0;i<N;i++){if(!kind[ix(i,j)])continue;if(Math.hypot(i-hall[0],j-hall[1])<2.8&&kind[ix(i,j)]>=3){kind[ix(i,j)]=D[ix(i,j)]===1?1:2;hgt[ix(i,j)]=.05;}}
 /* orman */
 for(j=0;j<N;j++)for(i=0;i<N;i++){if(kind[ix(i,j)]!==2||D[ix(i,j)]<2)continue;
  var fn=vnoise(T3,i*.42+2,j*.42+1);if(fn>.58&&Math.hypot(i-hall[0],j-hall[1])>3.2)kind[ix(i,j)]=3;}
 /* nehir: dağ eteğinden kıyıya, uzaklık alanını azaltarak */
 var river=[],sBest=null,sd=-1;
 for(k=0;k<land.length;k++){var t2=land[k],kk=kind[ix(t2[0],t2[1])];if(kk!==4&&kk!==6&&!(kk===3))continue;var dv=D[ix(t2[0],t2[1])]+r()*1.5;if(kk===3)dv-=2;if(dv>sd&&Math.hypot(t2[0]-hall[0],t2[1]-hall[1])>4){sd=dv;sBest=t2;}}
 if(sBest&&D[ix(sBest[0],sBest[1])]>=4){
  var cur=sBest.slice();river.push(cur.slice());var lastd=[0,0];
  for(var guard=0;guard<40&&D[ix(cur[0],cur[1])]>1;guard++){
   var opts=[];for(k=0;k<4;k++){var na=cur[0]+DIR4[k][0],nb=cur[1]+DIR4[k][1];if(inb(na,nb)&&kind[ix(na,nb)]&&D[ix(na,nb)]<D[ix(cur[0],cur[1])]&&Math.hypot(na-hall[0],nb-hall[1])>2.6)opts.push(k);}
   if(!opts.length)break;
   var kc=opts[(r()*opts.length)|0];
   if(opts.length>1&&r()<.4){for(var o2=0;o2<opts.length;o2++)if(DIR4[opts[o2]][0]===lastd[0]&&DIR4[opts[o2]][1]===lastd[1])kc=opts[o2];}
   lastd=DIR4[kc];cur=[cur[0]+lastd[0],cur[1]+lastd[1]];river.push(cur.slice());}
  /* denize açıl */
  for(k=0;k<4;k++){var ea=cur[0]+DIR4[k][0],eb=cur[1]+DIR4[k][1];if(!inb(ea,eb)||!kind[ix(ea,eb)]){river.push([ea,eb]);break;}}
  if(river.length>=6){for(k=0;k<river.length;k++){var rt=river[k];if(inb(rt[0],rt[1])&&kind[ix(rt[0],rt[1])]&&kind[ix(rt[0],rt[1])]<4)kind[ix(rt[0],rt[1])]=5;}}else river=[];
 }else river=[];
 /* iskele (port): kıyı karosu, (i+1,j) ya da (i,j+1) deniz, nehir değil */
 var port=null,pb=1e9;
 for(k=0;k<land.length;k++){var pt=land[k],pi=pt[0],pj=pt[1];if(kind[ix(pi,pj)]!==1)continue;
  var sE=!inb(pi+1,pj)||!kind[ix(pi+1,pj)],sS=!inb(pi,pj+1)||!kind[ix(pi,pj+1)];if(!sE&&!sS)continue;
  var dist=Math.hypot(pi-hall[0],pj-hall[1]);if(dist<3.4)continue;
  /* iskele önü ve yanları açık olsun */
  var sc2=dist+r()*1.2+(sE&&sS?3:0);if(sc2<pb){pb=sc2;port={i:pi,j:pj,dir:sE?0:1};}}
 if(!port)return null;
 /* iniş pisti: köye 3-5 uzak, çevresi tam kara ova */
 var pad=null,pdb=1e9;
 for(k=0;k<land.length;k++){var pp2=land[k];if(kind[ix(pp2[0],pp2[1])]!==2)continue;var dh=Math.max(Math.abs(pp2[0]-hall[0]),Math.abs(pp2[1]-hall[1]));if(dh<3||dh>5)continue;
  var ok2=true;for(var a4=-1;a4<=1;a4++)for(var b4=-1;b4<=1;b4++){var q2=kind[ix(pp2[0]+a4,pp2[1]+b4)];if(!inb(pp2[0]+a4,pp2[1]+b4)||!q2||q2>3&&q2!==5||q2===5)ok2=false;}
  if(Math.hypot(pp2[0]-port.i,pp2[1]-port.j)<3)ok2=false;
  if(!ok2)continue;var sc3=Math.abs(dh-4)+r()*1.5-((pp2[0]+pp2[1])>(hall[0]+hall[1])?.8:0);if(sc3<pdb){pdb=sc3;pad={i:pp2[0],j:pp2[1]};}}
 if(!pad)return null;
 /* bina yuvaları */
 var slots=[{i:hall[0],j:hall[1],type:'hall'}],taken=[hall,[pad.i,pad.j],[port.i,port.j]];
 var cand=[];
 for(k=0;k<land.length;k++){var cc=land[k],kk2=kind[ix(cc[0],cc[1])];if(kk2!==2)continue;if(D[ix(cc[0],cc[1])]<2)continue;
  /* önünde (güney) orman/dağ olmasın: sprite bindirmesi */
  var bad=false;for(var a5=0;a5<=2;a5++)for(var b5=0;b5<=2;b5++){if(!a5&&!b5)continue;var kq=inb(cc[0]+a5,cc[1]+b5)?kind[ix(cc[0]+a5,cc[1]+b5)]:0;if(kq===4||kq===6||(kq===3&&a5+b5<=2))bad=true;}
  if(bad)continue;
  cand.push({i:cc[0],j:cc[1],s:Math.hypot(cc[0]-hall[0],cc[1]-hall[1])+r()*2.4});}
 cand.sort(function(a,b){return a.s-b.s;});
 for(var pass=0;pass<2&&slots.length<18;pass++){var gap=pass?1:2;
  for(k=0;k<cand.length&&slots.length<18;k++){var s=cand[k],okk=true;if(s.s>11)break;
   for(var t3=0;t3<taken.length;t3++)if(Math.max(Math.abs(s.i-taken[t3][0]),Math.abs(s.j-taken[t3][1]))<gap)okk=false;
   if(!okk)continue;slots.push({i:s.i,j:s.j});taken.push([s.i,s.j]);}}
 /* iskele yuvası en sonda */
 slots.push({i:port.i,j:port.j,type:'port'});
 if(slots.length<14)return null;
 return {n:N,kind:kind,hgt:hgt,slots:slots,pad:pad,port:port,river:river,seed:hs(seed),civ:civPal(civId).id};
}

function make(seed,civId){
 var base=hs(seed),w=null;
 for(var tr=0;tr<40&&!w;tr++)w=gen(base+tr*7919,civId);
 if(!w)w=gen(1234567,civId);
 w._cache=null;w._vw=390;w._vh=800;
 return w;
}

/* ---------- projeksiyon ---------- */
function vsize(world,cam,o){
 var w=(o&&o.w)||cam.w||world._vw||390,h=(o&&o.h)||cam.h||world._vh||800;world._vw=w;world._vh=h;return[w,h];}
function toScreen(world,cam,i,j){
 var z=cam.zoom||1,w=cam.w||world._vw||390,h=cam.h||world._vh||800;
 return{x:w/2+((i-j)*HW-cam.x)*z,y:h/2+((i+j)*HH-cam.y)*z};}
function fromScreen(world,cam,x,y){
 var z=cam.zoom||1,w=cam.w||world._vw||390,h=cam.h||world._vh||800;
 var lx=(x-w/2)/z+cam.x,ly=(y-h/2)/z+cam.y;
 var fi=(lx/HW+ly/HH)/2,fj=(ly/HH-lx/HW)/2;
 return{i:Math.round(fi),j:Math.round(fj),fi:fi,fj:fj};}
/* tüm kıtayı sığdıran kamera */
function fitCam(world,w,h,pad){
 var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
 for(var j=0;j<N;j++)for(var i=0;i<N;i++){if(!world.kind[j*N+i])continue;var x=(i-j)*HW,y=(i+j)*HH;x0=Math.min(x0,x-HW);x1=Math.max(x1,x+HW);y0=Math.min(y0,y-HH-50);y1=Math.max(y1,y+HH+10);}
 pad=pad==null?8:pad;var z=Math.min((w-pad*2)/(x1-x0),(h-pad*2)/(y1-y0));
 return{x:(x0+x1)/2,y:(y0+y1)/2,zoom:z};}

/* ---------- zemin paleti ---------- */
function groundCols(civ){
 var a=civPal(civ).atm;
 return{
  g1:tint([128,194,96],a,.3),g2:tint([92,166,80],a,.3),
  sand:tint([236,218,166],a,.18),sandD:tint([196,172,120],a,.2),
  forest:tint([66,138,78],a,.3),rock:[142,138,146],snow:[242,247,255],
  shallow:tint([74,204,216],a,.26),deep:tint([22,96,164],a,.28),
  riverC:tint([84,184,226],a,.12),dirt:[190,168,128]};
}

/* ---------- çizim ilkelleri (önbellek) ---------- */
function diamond(g,x,y,sx,sy){g.beginPath();g.moveTo(x,y-sy);g.lineTo(x+sx,y);g.lineTo(x,y+sy);g.lineTo(x-sx,y);g.closePath();}
function treeRound(g,x,y,s,col,r){
 g.fillStyle='rgba(20,36,50,.2)';g.beginPath();g.ellipse(x+4*s,y+1,9*s,3.4*s,0,0,TAU);g.fill();
 g.fillStyle='#6b4a2e';g.fillRect(x-1.3*s,y-7*s,2.6*s,7.5*s);
 var d=sc(col,.66),m=col,l=sc(mix(col,[230,250,150],.35),1.08);
 g.lineWidth=.9;g.strokeStyle='rgba(16,36,30,.6)';
 g.fillStyle=css(d);g.beginPath();g.arc(x,y-11*s,7.6*s,0,TAU);g.fill();g.stroke();
 g.fillStyle=css(m);g.beginPath();g.arc(x-1*s,y-12.4*s,6.4*s,0,TAU);g.fill();
 g.fillStyle=css(l);g.beginPath();g.arc(x-2.4*s,y-14.2*s,3.9*s,0,TAU);g.fill();
 g.fillStyle='rgba(255,255,230,.5)';g.beginPath();g.arc(x-3.6*s,y-15.4*s,1.5*s,0,TAU);g.fill();
}
function treePine(g,x,y,s,col){
 g.fillStyle='rgba(20,36,50,.2)';g.beginPath();g.ellipse(x+4*s,y+1,8*s,3*s,0,0,TAU);g.fill();
 g.fillStyle='#5e4029';g.fillRect(x-1.2*s,y-5*s,2.4*s,5.5*s);
 var dk=sc(col,.55),lt=sc(mix(col,[200,240,170],.15),1.05);
 g.lineWidth=.9;g.strokeStyle='rgba(12,34,26,.62)';
 var tiers=[[8.4,y-4*s,10*s],[6.6,y-10*s,9*s],[4.4,y-16*s,8*s]];
 for(var i=0;i<tiers.length;i++){var t=tiers[i],w=t[0]*s,b=t[1],h=t[2];
  g.fillStyle=css(dk);g.beginPath();g.moveTo(x,b-h);g.lineTo(x+w,b);g.lineTo(x-w,b);g.closePath();g.fill();g.stroke();
  g.fillStyle=css(lt);g.beginPath();g.moveTo(x,b-h);g.lineTo(x-w,b);g.lineTo(x-w*.15,b);g.closePath();g.fill();}
}
function peak(g,x,y,h,w,snow,jx,rock){
 /* gölge */
 g.fillStyle='rgba(20,28,50,.22)';g.beginPath();g.moveTo(x+4,y+10);g.lineTo(x+w+h*.5,y+4+h*.2);g.lineTo(x+w*.6,y+16);g.closePath();g.fill();
 var A=[x+jx,y-h],Lf=[x-w,y+3],M=[x+jx*.3+2,y+14],R=[x+w,y+2];
 var lit=sc(rock,1.12),dk=sc(rock,.66);
 g.lineJoin='round';g.lineWidth=1;g.strokeStyle='rgba(26,22,36,.7)';
 g.fillStyle=css(lit);g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(Lf[0],Lf[1]);g.lineTo(M[0],M[1]);g.closePath();g.fill();g.stroke();
 g.fillStyle=css(dk);g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(M[0],M[1]);g.lineTo(R[0],R[1]);g.closePath();g.fill();g.stroke();
 /* kaya yarığı */
 g.strokeStyle='rgba(30,24,40,.32)';g.lineWidth=.9;g.beginPath();g.moveTo(A[0]-w*.18,A[1]+h*.34);g.lineTo(Lf[0]+w*.7,M[1]-3);g.moveTo(A[0]+w*.2,A[1]+h*.4);g.lineTo(M[0]+w*.4,M[1]-4);g.stroke();
 g.fillStyle='rgba(255,255,255,.14)';g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(Lf[0]+w*.4,Lf[1]-h*.1);g.lineTo(A[0]-w*.12,A[1]+h*.5);g.closePath();g.fill();
 if(snow){
  var t=snow>1?.6:.42;
  var Lc=[A[0]+(Lf[0]-A[0])*t,A[1]+(Lf[1]-A[1])*t],Rc=[A[0]+(R[0]-A[0])*t,A[1]+(R[1]-A[1])*t],Mc=[A[0]+(M[0]-A[0])*(t*.8),A[1]+(M[1]-A[1])*(t*.8)];
  g.fillStyle='#f4f8ff';g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(Lc[0],Lc[1]);g.lineTo(Lc[0]+w*.2,Lc[1]-h*.07);g.lineTo(Mc[0]-w*.12,Mc[1]+2);g.lineTo(Mc[0]+w*.1,Mc[1]-3);g.lineTo(Rc[0]-w*.18,Rc[1]+3);g.lineTo(Rc[0],Rc[1]);g.closePath();g.fill();
  g.fillStyle='rgba(150,176,222,.85)';g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(Mc[0]+w*.1,Mc[1]-3);g.lineTo(Rc[0]-w*.18,Rc[1]+3);g.lineTo(Rc[0],Rc[1]);g.closePath();g.fill();
  g.strokeStyle='rgba(26,22,36,.55)';g.lineWidth=.9;g.beginPath();g.moveTo(Lc[0],Lc[1]);g.lineTo(A[0],A[1]);g.lineTo(Rc[0],Rc[1]);g.stroke();
 }
}
function hill(g,x,y,h,w,col){
 g.fillStyle='rgba(20,36,50,.2)';g.beginPath();g.ellipse(x+w*.25,y+5,w*1.05,6,0,0,TAU);g.fill();
 g.beginPath();g.moveTo(x-w,y+3);g.quadraticCurveTo(x-w*.55,y-h*1.25,x,y-h);g.quadraticCurveTo(x+w*.6,y-h*1.2,x+w,y+2);g.ellipse(x,y+3,w,6,0,0,PI,false);g.closePath();
 var gr=g.createLinearGradient(x-w,0,x+w,0);gr.addColorStop(0,css(sc(col,1.18)));gr.addColorStop(.5,css(col));gr.addColorStop(1,css(sc(col,.66)));
 g.fillStyle=gr;g.fill();g.lineWidth=1;g.strokeStyle='rgba(20,30,28,.6)';g.stroke();
 g.fillStyle='rgba(255,255,220,.16)';g.beginPath();g.ellipse(x-w*.25,y-h*.62,w*.38,h*.2,-.3,0,TAU);g.fill();
 g.fillStyle='rgba(120,116,124,.7)';g.beginPath();g.ellipse(x+w*.28,y-h*.2,w*.2,h*.1,.2,0,TAU);g.fill();
}
function bush(g,x,y,s,col){
 g.fillStyle='rgba(20,36,50,.18)';g.beginPath();g.ellipse(x+2*s,y+1,6*s,2.4*s,0,0,TAU);g.fill();
 g.lineWidth=.8;g.strokeStyle='rgba(16,36,30,.55)';
 g.fillStyle=css(sc(col,.7));g.beginPath();g.arc(x,y-3*s,4.4*s,0,TAU);g.fill();g.stroke();
 g.fillStyle=css(sc(col,1.1));g.beginPath();g.arc(x-1*s,y-4*s,2.8*s,0,TAU);g.fill();
}
function rockProp(g,x,y,s){
 g.lineWidth=.8;g.strokeStyle='rgba(26,22,36,.6)';
 g.fillStyle='#a6a2a8';g.beginPath();g.moveTo(x-4*s,y);g.lineTo(x-2*s,y-4*s);g.lineTo(x+2*s,y-4.4*s);g.lineTo(x+4.4*s,y);g.closePath();g.fill();g.stroke();
 g.fillStyle='#74707c';g.beginPath();g.moveTo(x+.5*s,y-4.2*s);g.lineTo(x+2*s,y-4.4*s);g.lineTo(x+4.4*s,y);g.lineTo(x+.5*s,y);g.closePath();g.fill();
}
function tuft(g,x,y,col){g.strokeStyle=css(col);g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x-1.4,y-3.4);g.moveTo(x+1,y);g.lineTo(x+1.2,y-4);g.moveTo(x+2,y);g.lineTo(x+3.4,y-2.8);g.stroke();}

/* ---------- kara önbelleği ---------- */
function build(world,rs){
 var C=groundCols(world.civ),K=world.kind,H=world.hgt;
 var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,i,j,k;
 for(j=0;j<N;j++)for(i=0;i<N;i++){if(!K[j*N+i])continue;var x=(i-j)*HW,y=(i+j)*HH;x0=Math.min(x0,x-HW-10);x1=Math.max(x1,x+HW+10);y0=Math.min(y0,y-HH-64);y1=Math.max(y1,y+HH+22);}
 var cv=mkCv((x1-x0)*rs,(y1-y0)*rs),g=cv.getContext('2d');
 g.scale(rs,rs);g.translate(-x0,-y0);g.lineJoin='round';g.lineCap='round';
 var land=function(i,j){return i>=0&&j>=0&&i<N&&j<N&&K[j*N+i]>0;};
 /* sığ su haresi */
 var lp=new Path2D();
 for(j=0;j<N;j++)for(i=0;i<N;i++){if(!K[j*N+i])continue;var cx=(i-j)*HW,cy=(i+j)*HH+4;lp.moveTo(cx,cy-HH);lp.lineTo(cx+HW,cy);lp.lineTo(cx,cy+HH);lp.lineTo(cx-HW,cy);lp.closePath();}
 var ws=[[78,.10],[58,.14],[40,.18],[26,.22],[14,.26]];
 for(k=0;k<ws.length;k++){g.strokeStyle=css(C.shallow,ws[k][1]);g.lineWidth=ws[k][0];g.stroke(lp);}
 /* toprak ve karo üstleri, painter sırası */
 var order=[];
 for(var d=0;d<2*N-1;d++)for(i=Math.max(0,d-N+1);i<=Math.min(d,N-1);i++){j=d-i;if(K[j*N+i])order.push([i,j]);}
 var slotSet={};for(k=0;k<world.slots.length;k++)slotSet[world.slots[k].i+','+world.slots[k].j]=1;
 for(k=0;k<order.length;k++){
  i=order[k][0];j=order[k][1];var kd=K[j*N+i],cx2=(i-j)*HW,cy2=(i+j)*HH,hv=H[j*N+i],rn=hash2(i,j),rn2=hash2(j+31,i+7);
  var nz=hash2(i>>1,j>>1)*.5+rn*.5;
  var col;
  if(kd===1)col=mix(C.sand,C.sandD,rn*.25);
  else if(kd===2)col=mix(C.g1,C.g2,nz);
  else if(kd===3)col=mix(C.forest,sc(C.forest,.8),rn);
  else if(kd===4)col=mix(C.rock,mix(C.g2,C.rock,.4),rn*.5);
  else if(kd===6)col=mix(C.snow,[205,222,244],rn*.4);
  else col=mix(C.g1,C.sand,.35);
  if(kd===2||kd===3)col=sc(col,1+((i+j)%2?.012:-.008));
  /* sahil dik kenarı (güneye bakan yüzler) */
  var seaE=!land(i+1,j),seaS=!land(i,j+1);
  var th=kd===1||kd===5?8:8;
  if(seaS||seaE){
   var bl=[cx2-HW,cy2],bb=[cx2,cy2+HH],br=[cx2+HW,cy2];
   if(seaS){var gr=g.createLinearGradient(0,cy2,0,cy2+HH+th);gr.addColorStop(0,css(sc(C.sandD,.98)));gr.addColorStop(.35,css(sc(C.sandD,.78)));gr.addColorStop(1,css(sc([110,86,70],.82)));
    g.fillStyle=gr;g.beginPath();g.moveTo(bl[0],bl[1]);g.lineTo(bb[0],bb[1]);g.lineTo(bb[0],bb[1]+th);g.lineTo(bl[0],bl[1]+th);g.closePath();g.fill();
    g.strokeStyle='rgba(40,28,24,.5)';g.lineWidth=.9;g.stroke();
    g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.3;g.beginPath();g.moveTo(bl[0]+1,bl[1]+th);g.lineTo(bb[0],bb[1]+th);g.stroke();}
   if(seaE){var gr2=g.createLinearGradient(0,cy2,0,cy2+HH+th);gr2.addColorStop(0,css(sc(C.sandD,.7)));gr2.addColorStop(.35,css(sc(C.sandD,.58)));gr2.addColorStop(1,css(sc([90,70,64],.78)));
    g.fillStyle=gr2;g.beginPath();g.moveTo(bb[0],bb[1]);g.lineTo(br[0],br[1]);g.lineTo(br[0],br[1]+th);g.lineTo(bb[0],bb[1]+th);g.closePath();g.fill();
    g.strokeStyle='rgba(40,28,24,.5)';g.lineWidth=.9;g.stroke();
    g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1.3;g.beginPath();g.moveTo(bb[0],bb[1]+th);g.lineTo(br[0]-1,br[1]+th);g.stroke();}
  }
  g.fillStyle=css(col);g.strokeStyle=css(col);g.lineWidth=1.1;diamond(g,cx2,cy2,HW,HH);g.fill();g.stroke();
  /* kıyı ıslak şeridi ve kuru kenar */
  if(kd===1){
   g.save();diamond(g,cx2,cy2,HW,HH);g.clip();
   var edges=[[!land(i-1,j),cx2-HW,cy2,cx2,cy2-HH],[!land(i,j-1),cx2,cy2-HH,cx2+HW,cy2],[seaE,cx2+HW,cy2,cx2,cy2+HH],[seaS,cx2,cy2+HH,cx2-HW,cy2]];
   for(var e=0;e<4;e++)if(edges[e][0]){g.strokeStyle='rgba(120,100,70,.28)';g.lineWidth=7;g.beginPath();g.moveTo(edges[e][1],edges[e][2]);g.lineTo(edges[e][3],edges[e][4]);g.stroke();
    g.strokeStyle='rgba(255,255,240,.28)';g.lineWidth=2.4;g.stroke();}
   g.restore();
   if(rn2>.55){g.fillStyle='rgba(255,246,226,.9)';g.beginPath();g.arc(cx2+(rn-.5)*28,cy2+(rn2-.5)*10,1.2,0,TAU);g.fill();}
  }
  else if(kd===2||kd===5){
   for(var q=0;q<4;q++){var u=hash2(i*7+q,j*3),v=hash2(i+q,j*5+1);var px=cx2+(u-v)*HW*.82,py=cy2+(u+v-1)*HH*.82;if(slotSet[i+','+j]&&Math.abs(px-cx2)+Math.abs(py-cy2)*2<44)continue;
    if(q<2)tuft(g,px,py,sc(col,1.18));else if(hash2(i+q,j+9)>.55){var fc=[[255,170,206],[255,238,150],[170,230,255]][(i+j+q)%3];g.fillStyle=css(fc);g.beginPath();g.arc(px,py-1,1.3,0,TAU);g.fill();}}
  }
  else if(kd===3){g.fillStyle='rgba(20,60,40,.18)';g.beginPath();g.ellipse(cx2,cy2,22,9,0,0,TAU);g.fill();}
 }
 /* yuva zeminleri (boş yer işaretleri) ve iniş pisti */
 for(k=0;k<world.slots.length;k++){var sl=world.slots[k],sx=(sl.i-sl.j)*HW,sy=(sl.i+sl.j)*HH;
  g.fillStyle='rgba(222,206,160,.5)';g.strokeStyle='rgba(255,252,230,.75)';g.lineWidth=1.2;g.setLineDash([4,3]);diamond(g,sx,sy,HW*.8,HH*.8);g.fill();g.stroke();g.setLineDash([]);}
 (function(){var p=world.pad,x=(p.i-p.j)*HW,y=(p.i+p.j)*HH;
  g.fillStyle='rgba(20,28,48,.3)';diamond(g,x+2,y+3,HW*.96,HH*.96);g.fill();
  var gr=g.createLinearGradient(x-HW,y,x+HW,y);gr.addColorStop(0,'#aab4c4');gr.addColorStop(1,'#7e8aa0');
  g.fillStyle=gr;g.strokeStyle='rgba(30,36,56,.75)';g.lineWidth=1.2;diamond(g,x,y,HW*.94,HH*.94);g.fill();g.stroke();
  g.fillStyle='#4a5670';g.beginPath();g.ellipse(x,y,25,12.5,0,0,TAU);g.fill();
  g.strokeStyle='#e9f0fa';g.lineWidth=1.6;g.beginPath();g.ellipse(x,y,25,12.5,0,0,TAU);g.stroke();
  g.strokeStyle='#ffd64a';g.lineWidth=1.8;g.beginPath();g.ellipse(x,y,16,8,0,0,TAU);g.stroke();
  var P=function(u,v){return[x+(u-v)*HW,y+(u+v)*HH];};
  g.strokeStyle='#f4f8ff';g.lineWidth=2.4;g.beginPath();var a=P(-.17,-.14),b=P(-.17,.14);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);a=P(.17,-.14);b=P(.17,.14);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);a=P(-.17,0);b=P(.17,0);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();})();
 /* nehir */
 if(world.river.length>1){
  var pts=world.river.map(function(r){return[(r[0]-r[1])*HW,(r[0]+r[1])*HH];});
  var path=function(){g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(var n=1;n<pts.length-1;n++){var m=[(pts[n][0]+pts[n+1][0])/2,(pts[n][1]+pts[n+1][1])/2];g.quadraticCurveTo(pts[n][0],pts[n][1],m[0],m[1]);}g.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]);};
  g.strokeStyle=css(C.sandD,.9);g.lineWidth=21;path();g.stroke();
  g.strokeStyle=css(C.sand,.95);g.lineWidth=18;path();g.stroke();
  g.strokeStyle=css(mix(C.riverC,[20,80,140],.25));g.lineWidth=13;path();g.stroke();
  g.strokeStyle=css(C.riverC);g.lineWidth=9;path();g.stroke();
  g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=3;path();g.stroke();
 }
 /* süs ve nesneler: painter sırası */
 var rr=rngOf(world.seed^0x5bd1e995);
 for(k=0;k<order.length;k++){
  i=order[k][0];j=order[k][1];var kd2=K[j*N+i],cx3=(i-j)*HW,cy3=(i+j)*HH,sl2=slotSet[i+','+j];
  if(kd2===3){
   var nt=3+(rr()*2|0);
   var pts2=[];for(var t=0;t<nt;t++)pts2.push([(rr()-.5)*40,(rr()-.5)*16,rr()]);
   pts2.sort(function(a,b){return a[1]-b[1];});
   for(t=0;t<pts2.length;t++){var tp=pts2[t],gc=mix(C.forest,[110,180,90],tp[2]*.5),s2=.85+tp[2]*.4;
    if((i*3+j+t)%3===0)treePine(g,cx3+tp[0],cy3+tp[1]+4,s2,sc(gc,.9));else treeRound(g,cx3+tp[0],cy3+tp[1]+4,s2,gc,rr);}
  }else if(kd2===2&&!sl2&&(world.pad.i!==i||world.pad.j!==j)){
   if(hash2(i+5,j+11)>.78){var ox=(hash2(i,j+3)-.5)*34,oy=(hash2(i+3,j)-.5)*14;treeRound(g,cx3+ox,cy3+oy+4,.8+hash2(i,j)*.25,mix(C.g2,[80,150,70],.4),rr);}
   else if(hash2(i+8,j+2)>.86)bush(g,cx3+(hash2(i,j+9)-.5)*34,cy3+(hash2(i+9,j)-.5)*12+3,1,mix(C.g2,[80,150,70],.4));
   else if(hash2(i+2,j+6)>.93)rockProp(g,cx3+(hash2(i,j+1)-.5)*30,cy3+(hash2(i+1,j)-.5)*10+3,1);
  }else if(kd2===1&&hash2(i+4,j+4)>.82){rockProp(g,cx3+(hash2(i,j+2)-.5)*30,cy3+(hash2(i+2,j)-.5)*10+3,.8);}
  else if(kd2===4||kd2===6){
   var hv2=H[j*N+i],edgeLow=Math.max(0,1-(hv2-.5)/.4),hh=18+Math.min(1.2,hv2)*34*(1-edgeLow*.25)+hash2(i,j+13)*14-edgeLow*6,w=27+hash2(j,i+5)*8,jx=(hash2(i+1,j+4)-.5)*18;
   var rock=kd2===6?[166,170,186]:mix([158,150,148],[124,118,130],hash2(i,j));
   if(kd2===4&&hv2<.66){var hc=mix(C.g2,[130,124,120],.28+hash2(i+2,j)*.12);
    hill(g,cx3-14,cy3+4,hh*.4+6,w*.56,sc(hc,.96));hill(g,cx3+8,cy3+2,hh*.5+7,w*.66,hc);
    if(hash2(i,j+3)>.5)hill(g,cx3+22,cy3+5,hh*.3+4,w*.4,sc(hc,1.06));
   }else{
   if(hash2(i+6,j)>.4){peak(g,cx3-17,cy3+3,hh*.52,w*.62,0,jx*.4,rock);}
   if(hash2(i,j+8)>.5){peak(g,cx3+18,cy3+4,hh*.44,w*.55,0,-jx*.3,rock);}
   peak(g,cx3,cy3,hh,w,kd2===6?2:(hv2>.72?1:0),jx,rock);}
  }
 }
 /* haze: kıyıda hafif ışık */
 return{cv:cv,rs:rs,x0:x0,y0:y0,w:(x1-x0),h:(y1-y0)};
}

/* kıyı kenarları (köpük) mantıksal koordinatta */
function coastPath(world){
 if(world._coast)return world._coast;
 var K=world.kind,p=new Path2D(),i,j;
 var L=function(a,b){return a>=0&&b>=0&&a<N&&b<N&&K[b*N+a]>0;};
 for(j=0;j<N;j++)for(i=0;i<N;i++){if(!K[j*N+i])continue;var x=(i-j)*HW,y=(i+j)*HH+2;
  if(!L(i-1,j)){p.moveTo(x-HW,y);p.lineTo(x,y-HH);}
  if(!L(i,j-1)){p.moveTo(x,y-HH);p.lineTo(x+HW,y);}
  if(!L(i+1,j)){p.moveTo(x+HW,y);p.lineTo(x,y+HH);}
  if(!L(i,j+1)){p.moveTo(x,y+HH);p.lineTo(x-HW,y);}}
 world._coast=p;return p;}
function riverPath(world){
 if(world._rp)return world._rp;
 var pts=world.river.map(function(r){return[(r[0]-r[1])*HW,(r[0]+r[1])*HH];}),p=new Path2D();
 if(pts.length>1){p.moveTo(pts[0][0],pts[0][1]);for(var n=1;n<pts.length-1;n++){var m=[(pts[n][0]+pts[n+1][0])/2,(pts[n][1]+pts[n+1][1])/2];p.quadraticCurveTo(pts[n][0],pts[n][1],m[0],m[1]);}p.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]);}
 world._rp=p;return p;}

/* bulut gölgesi lekesi */
var BLOB=null;
function blob(){
 if(BLOB)return BLOB;var c=mkCv(128,64),g=c.getContext('2d');
 var sp=[[64,32,50,24],[34,36,30,16],[96,34,32,18],[60,22,28,14],[82,44,26,12]];
 for(var i=0;i<sp.length;i++){var s=sp[i],gr=g.createRadialGradient(s[0],s[1],0,s[0],s[1],s[2]);gr.addColorStop(0,'rgba(10,24,60,.55)');gr.addColorStop(.6,'rgba(10,24,60,.22)');gr.addColorStop(1,'rgba(10,24,60,0)');
  g.save();g.translate(s[0],s[1]);g.scale(1,s[3]/s[2]);g.translate(-s[0],-s[1]);g.fillStyle=gr;g.fillRect(s[0]-s[2],s[1]-s[2],s[2]*2,s[2]*2);g.restore();}
 BLOB=c;return c;}
var GLOWC={};
function glowTex(col){var k=col.join();if(GLOWC[k])return GLOWC[k];var c=mkCv(64,64),g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,css(col,1));gr.addColorStop(.35,css(col,.4));gr.addColorStop(1,css(col,0));g.fillStyle=gr;g.fillRect(0,0,64,64);GLOWC[k]=c;return c;}
Iso.glowTex=glowTex;

/* ---------- ana çizim ---------- */
function draw(ctx,world,cam,t,opts){
 opts=opts||{};t=t||0;
 var z=cam.zoom||1,vs=vsize(world,cam,opts),w=vs[0],h=vs[1],night=clamp(opts.night||0,0,1);
 var C=groundCols(world.civ);
 var m=ctx.getTransform?ctx.getTransform():null,dpr=m?Math.hypot(m.a,m.b):1;
 /* kara önbelleği: ihtiyaç duyulan çözünürlük */
 var need=clamp(Math.ceil(z*dpr*2)/2,.5,2),cc=world._cache;
 if(!cc||cc.rs<need||cc.rs>need*2.01)world._cache=cc=build(world,need);
 ctx.save();
 /* deniz */
 var cx0=w/2+(-cam.x)*z,cy0=h/2+(368-cam.y)*z;
 var gr=ctx.createRadialGradient(cx0,cy0,20*z,cx0,cy0,Math.max(w,h)*.95);
 gr.addColorStop(0,css(mix(C.shallow,C.deep,.28)));gr.addColorStop(.5,css(mix(C.shallow,C.deep,.62)));gr.addColorStop(1,css(sc(C.deep,.82)));
 ctx.fillStyle=gr;ctx.fillRect(0,0,w,h);
 ctx.translate(w/2-cam.x*z,h/2-cam.y*z);ctx.scale(z,z);
 var vx0=cam.x-w/2/z-40,vx1=cam.x+w/2/z+40,vy0=cam.y-h/2/z-40,vy1=cam.y+h/2/z+40;
 /* dalga çizgileri */
 var cw=56,ch=28,ia=Math.floor(vx0/cw),ib=Math.ceil(vx1/cw),ja=Math.floor(vy0/ch),jb=Math.ceil(vy1/ch);
 var A=new Path2D(),B=new Path2D(),G=[];
 for(var jj=ja;jj<=jb;jj++)for(var ii=ia;ii<=ib;ii++){
  var hh=hash2(ii,jj);if(hh<.42)continue;
  var x=ii*cw+hash2(ii+9,jj)*cw,y=jj*ch+hash2(ii,jj+9)*ch;
  var fi=((x/HW)+(y/HH))/2,fj=((y/HH)-(x/HW))/2,ti=Math.round(fi),tj=Math.round(fj);
  if(ti>=0&&tj>=0&&ti<N&&tj<N&&world.kind[tj*N+ti]&&Math.abs(fi-ti)<.7&&Math.abs(fj-tj)<.7)continue;
  var ph=Math.sin(t*1.1+hh*40),P=ph>.2?A:B;
  var len=7+hh*8;P.moveTo(x-len,y);P.quadraticCurveTo(x-len*.5,y-3,x,y);P.quadraticCurveTo(x+len*.5,y+3,x+len,y);
  if(hh>.9)G.push(x,y,hh);}
 ctx.lineWidth=1.5;ctx.strokeStyle='rgba(255,255,255,.34)';ctx.stroke(A);
 ctx.lineWidth=1.2;ctx.strokeStyle='rgba(255,255,255,.14)';ctx.stroke(B);
 /* kıyı dalga halkaları (kara örter) */
 var cp=coastPath(world),ph2=(t*.28)%1;
 ctx.lineJoin='round';
 for(var q=0;q<2;q++){var pp=(ph2+q*.5)%1;ctx.strokeStyle='rgba(255,255,255,'+((1-pp)*.3).toFixed(3)+')';ctx.lineWidth=3+pp*18;ctx.stroke(cp);}
 /* kara */
 ctx.drawImage(cc.cv,cc.x0,cc.y0,cc.w,cc.h);
 /* köpük çizgisi */
 ctx.save();ctx.lineCap='round';
 ctx.strokeStyle='rgba(255,255,255,'+(.55+.2*Math.sin(t*1.6)).toFixed(3)+')';ctx.lineWidth=1.8;ctx.setLineDash([7,5]);ctx.lineDashOffset=-t*9;ctx.stroke(cp);
 ctx.setLineDash([]);ctx.restore();
 /* nehir akışı */
 if(world.river.length>1){var rp=riverPath(world);ctx.save();ctx.lineCap='round';ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.8;ctx.setLineDash([3,12]);ctx.lineDashOffset=-t*14;ctx.stroke(rp);
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.2;ctx.setLineDash([2,9]);ctx.lineDashOffset=-t*10+5;ctx.translate(2,-2);ctx.stroke(rp);ctx.restore();}
 /* iniş pisti ışıkları */
 var pd=world.pad,px=(pd.i-pd.j)*HW,py=(pd.i+pd.j)*HH;
 for(var L=0;L<8;L++){var a=L/8*TAU,on=(Math.floor(t*3)+L)%8<3?1:.25;var lx=px+Math.cos(a)*25,ly=py+Math.sin(a)*12.5;
  ctx.globalAlpha=on;ctx.fillStyle='#7fe8ff';ctx.beginPath();ctx.arc(lx,ly,1.7,0,TAU);ctx.fill();
  if(on>.9||night>.2){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(on>.9?.7:.25)*(1+night*.4);ctx.drawImage(glowTex([110,226,255]),lx-6,ly-6,12,12);ctx.globalCompositeOperation='source-over';}}
 ctx.globalAlpha=1;
 /* su parıltısı */
 ctx.globalCompositeOperation='lighter';
 for(var gi=0;gi<G.length;gi+=3){var tw=Math.sin(t*2.2+G[gi+2]*30)*.5+.5;if(tw<.3)continue;ctx.strokeStyle=night>.4?'rgba(190,210,255,'+tw*.9+')':'rgba(255,248,220,'+tw*.9+')';ctx.lineWidth=1;
  var gx=G[gi],gy=G[gi+1],s=2+tw*2.4;ctx.beginPath();ctx.moveTo(gx-s,gy);ctx.lineTo(gx+s,gy);ctx.moveTo(gx,gy-s*.6);ctx.lineTo(gx,gy+s*.6);ctx.stroke();}
 ctx.globalCompositeOperation='source-over';
 /* bulut gölgeleri */
 if(night<.7){var bl=blob(),span=1700;
  for(var b=0;b<4;b++){var bx=((t*(6+b*2)+b*520)%span)-span/2+(b%2?120:-60),by=140+b*170+Math.sin(b*3.1)*80,bs=2.4+b*.35;
   ctx.globalAlpha=(.3-b*.02)*(1-night*1.2);ctx.drawImage(bl,bx-64*bs,by-32*bs,128*bs,64*bs);}
  ctx.globalAlpha=1;}
 ctx.restore();
 /* gece */
 if(night>0){ctx.save();ctx.globalCompositeOperation='multiply';var k=night;ctx.fillStyle='rgb('+(255-k*172|0)+','+(255-k*148|0)+','+(255-k*78|0)+')';ctx.fillRect(0,0,w,h);ctx.restore();}
}

Iso.World={make:make,draw:draw,toScreen:toScreen,fromScreen:fromScreen,fitCam:fitCam,N:N,
 clear:function(w){if(w){w._cache=null;}}};
})();
