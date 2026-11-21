/* SpacEgg v2.4 — izometrik bina sprite'ları (Grafik 1)
   SG.Iso.building(ctx,type,lv,civId,x,y,o) — 11 tür x 5 seviye x 12 medeniyet. Sprite offscreen önbelleğe bir kez çizilir.
   Birim: u,v karo birimi (karo elması -0.5..0.5), z piksel. Ekran: x=(u-v)*32, y=(u+v)*16-z. */
(function(){
'use strict';
var SG=window.SG,Iso=SG.Iso,U=Iso.util,civPal=Iso.civPal,glowTex=Iso.glowTex;
var mix=U.mix,sc=U.sc,mkCv=U.mkCv,PI=Math.PI,TAU=PI*2;
var g,CP,NK=0,DYN,SHM=false,SHP,TOP,LEFT,RIGHT,DIRN=0;
var INK='rgba(24,16,34,.78)';
var STONE=[172,170,176],WOOD=[158,110,66],DWOOD=[104,70,46],METAL=[150,164,184],ROCK=[150,140,136];

function P(u,v,z){return[(u-v)*32,(u+v)*16-(z||0)];}
function nt(c){return NK?[c[0]*(1-.58*NK),c[1]*(1-.52*NK),Math.min(255,c[2]*(1-.3*NK)+16*NK)]:c;}
function cs(c,a){c=nt(c);return a==null?'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')':'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+a+')';}
function tone(c,m){
 if(m===0)return[Math.min(255,c[0]*1.03+24),Math.min(255,c[1]*1.03+22),Math.min(255,c[2]*1.03+16)];
 if(m===1)return[c[0]*.86,c[1]*.86,c[2]*.9];
 return[c[0]*.58+4,c[1]*.58+6,c[2]*.66+22];}
function hull(p){p=p.slice().sort(function(a,b){return a[0]-b[0]||a[1]-b[1];});if(p.length<3)return p;
 var cr=function(o,a,b){return(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);},lo=[],up=[],i;
 for(i=0;i<p.length;i++){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p[i])<=0)lo.pop();lo.push(p[i]);}
 for(i=p.length-1;i>=0;i--){while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p[i])<=0)up.pop();up.push(p[i]);}
 up.pop();lo.pop();return lo.concat(up);}
function shp(pts,h){var sx=h*.6,sy=h*.3,all=pts.slice();for(var i=0;i<pts.length;i++)all.push([pts[i][0]+sx,pts[i][1]+sy]);SHP.push(hull(all));}
function shRect(u0,v0,u1,v1,h){shp([P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1)],h);}
function shEll(cx,cy,rx,ry,h){var pts=[];for(var i=0;i<10;i++){var a=i/10*TAU;pts.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]);}shp(pts,h);}
function trk(p){if(p[1]<TOP)TOP=p[1];if(p[0]<LEFT)LEFT=p[0];if(p[0]>RIGHT)RIGHT=p[0];}
function poly(pts,fill,stroke,lw){
 g.beginPath();g.moveTo(pts[0][0],pts[0][1]);trk(pts[0]);
 for(var i=1;i<pts.length;i++){g.lineTo(pts[i][0],pts[i][1]);trk(pts[i]);}
 g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||1.1;g.stroke();}}
function lin(a,b,col,w){g.strokeStyle=col;g.lineWidth=w||1;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
function face(pts,c,m,k){
 var yt=1e9,yb=-1e9,i;for(i=0;i<pts.length;i++){if(pts[i][1]<yt)yt=pts[i][1];if(pts[i][1]>yb)yb=pts[i][1];}
 var gr=g.createLinearGradient(0,yt,0,yb+.01),t=tone(c,m);
 if(m===0){gr.addColorStop(0,cs(sc(t,1.04)));gr.addColorStop(1,cs(sc(t,.95)));}
 else{gr.addColorStop(0,cs(sc(t,1.08)));gr.addColorStop(1,cs(sc(t,.8)));}
 poly(pts,gr,INK,k||1.1);}

/* ---------- ilkeller ---------- */
function fp(B,f,a,b){var z=B[4]+(B[5]-B[4])*b;return f==='L'?P(B[0]+(B[2]-B[0])*a,B[3],z):P(B[2],B[3]+(B[1]-B[3])*a,z);}
function fq(B,f,a0,b0,a1,b1){return[fp(B,f,a0,b0),fp(B,f,a1,b0),fp(B,f,a1,b1),fp(B,f,a0,b1)];}
function box(u0,v0,u1,v1,z0,z1,c,o){
 o=o||{};
 if(SHM){shRect(u0,v0,u1,v1,z1);return[u0,v0,u1,v1,z0,z1];}
 var B=[u0,v0,u1,v1,z0,z1];
 face(fq(B,'L',0,0,1,1),c,1);face(fq(B,'R',0,0,1,1),c,2);
 if(!o.notop){
  var tp=[P(u0,v0,z1),P(u1,v0,z1),P(u1,v1,z1),P(u0,v1,z1)];
  var gr=g.createLinearGradient(tp[3][0],tp[3][1],tp[1][0],tp[1][1]);var t0=o.top||c;
  gr.addColorStop(0,cs(sc(tone(t0,0),1.06)));gr.addColorStop(1,cs(sc(tone(t0,0),.94)));poly(tp,gr,INK,1.1);}
 /* doku */
 var tx=o.tex;
 if(tx){g.strokeStyle='rgba(20,14,28,.16)';g.lineWidth=.8;g.beginPath();
  var h=z1-z0,n=Math.max(1,Math.round(h/(tx==='plank'?99:4.2)));
  if(tx!=='plank'){for(var k=1;k<n;k++){var b=k/n,a=fp(B,'L',0,b),c2=fp(B,'L',1,b);g.moveTo(a[0],a[1]);g.lineTo(c2[0],c2[1]);a=fp(B,'R',0,b);c2=fp(B,'R',1,b);g.moveTo(a[0],a[1]);g.lineTo(c2[0],c2[1]);}}
  if(tx==='plank'||tx==='stone'){var nv=Math.max(2,Math.round(Math.abs(u1-u0)*32/(tx==='plank'?3.6:6)));for(k=1;k<nv;k++){a=fp(B,'L',k/nv,0);c2=fp(B,'L',k/nv,1);g.moveTo(a[0],a[1]);g.lineTo(c2[0],c2[1]);}
   nv=Math.max(2,Math.round(Math.abs(v1-v0)*32/(tx==='plank'?3.6:6)));for(k=1;k<nv;k++){a=fp(B,'R',k/nv,0);c2=fp(B,'R',k/nv,1);g.moveTo(a[0],a[1]);g.lineTo(c2[0],c2[1]);}}
  g.stroke();}
 /* parlak kenarlar */
 lin(P(u0,v1,z1),P(u1,v1,z1),'rgba(255,255,255,.4)',.9);lin(P(u1,v1,z1),P(u1,v0,z1),'rgba(255,255,255,.18)',.9);
 lin(P(u1,v1,z0+.5),P(u1,v1,z1),'rgba(255,255,255,.28)',.9);
 return B;}
function eave(B,k){ /* saçak altı gölgesi */
 if(SHM)return;var q=fq(B,'L',0,1-k,1,1),r=fq(B,'R',0,1-k,1,1);
 poly(q,'rgba(20,12,30,.2)');poly(r,'rgba(10,6,20,.2)');}
function gable(u0,v0,u1,v1,z,rh,c,o){
 o=o||{};var ov=o.ov==null?.05:o.ov,W=o.wall||CP.wall;
 if(SHM){shRect(u0,v0,u1,v1,z+rh*.6);return;}
 var U0=u0-ov,U1=u1+ov,V0=v0-ov,V1=v1+ov,um=(u0+u1)/2,vm=(v0+v1)/2,i,n=3;
 if(o.alongV){
  poly([P(u0,v1,z),P(u1,v1,z),P(um,v1,z+rh)],cs(tone(W,1)),INK,1.1);
  var s=[P(U1,V1,z-.5),P(U1,V0,z-.5),P(um,V0,z+rh),P(um,V1,z+rh)];
  var gr=g.createLinearGradient(0,s[2][1],0,s[0][1]);gr.addColorStop(0,cs(sc(tone(c,2),1.18)));gr.addColorStop(1,cs(sc(tone(c,2),.88)));poly(s,gr,INK,1.1);
  g.strokeStyle='rgba(10,6,20,.22)';g.lineWidth=.8;g.beginPath();for(i=1;i<=n;i++){var t=i/(n+1),a=P(U1+(um-U1)*t,V1,z-.5+(rh+.5)*t),b=P(U1+(um-U1)*t,V0,z-.5+(rh+.5)*t);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);}g.stroke();
  lin(P(um,V1,z+rh),P(um,V0,z+rh),'rgba(255,255,255,.4)',1.1);
  lin(P(U1,V1,z-.5),P(um,V1,z+rh),cs(sc(c,.55)),1.8);
 }else{
  poly([P(u1,v1,z),P(u1,v0,z),P(u1,vm,z+rh)],cs(tone(W,2)),INK,1.1);
  var s2=[P(U0,V1,z-.5),P(U1,V1,z-.5),P(U1,vm,z+rh),P(U0,vm,z+rh)];
  var gr2=g.createLinearGradient(0,s2[2][1],0,s2[0][1]);gr2.addColorStop(0,cs(sc(tone(c,0),1.06)));gr2.addColorStop(1,cs(sc(tone(c,1),.92)));poly(s2,gr2,INK,1.1);
  g.strokeStyle='rgba(10,6,20,.2)';g.lineWidth=.8;g.beginPath();for(i=1;i<=n;i++){var t2=i/(n+1),a2=P(U0,V1+(vm-V1)*t2,z-.5+(rh+.5)*t2),b2=P(U1,V1+(vm-V1)*t2,z-.5+(rh+.5)*t2);g.moveTo(a2[0],a2[1]);g.lineTo(b2[0],b2[1]);}g.stroke();
  lin(P(U0,vm,z+rh),P(U1,vm,z+rh),'rgba(255,255,255,.45)',1.1);
  lin(P(U1,V1,z-.5),P(U1,vm,z+rh),cs(sc(c,.55)),1.8);
 }}
function hip(u0,v0,u1,v1,z,rh,c,o){
 o=o||{};var ov=o.ov==null?.05:o.ov;
 if(SHM){shRect(u0,v0,u1,v1,z+rh*.5);return;}
 var U0=u0-ov,U1=u1+ov,V0=v0-ov,V1=v1+ov,um=(u0+u1)/2,vm=(v0+v1)/2,rl=(o.rl||0)*(u1-u0)/2;
 var A=P(um-rl,vm,z+rh),B2=P(um+rl,vm,z+rh);
 var gr=g.createLinearGradient(0,A[1],0,P(U0,V1,z)[1]);gr.addColorStop(0,cs(sc(tone(c,0),1.08)));gr.addColorStop(1,cs(sc(tone(c,1),.95)));
 poly([P(U0,V1,z-.5),P(U1,V1,z-.5),B2,A],gr,INK,1.1);
 var g2=g.createLinearGradient(0,A[1],0,P(U1,V1,z)[1]);g2.addColorStop(0,cs(sc(tone(c,2),1.15)));g2.addColorStop(1,cs(sc(tone(c,2),.85)));
 poly([P(U1,V1,z-.5),P(U1,V0,z-.5),B2],g2,INK,1.1);
 lin(P(U1,V1,z-.5),B2,'rgba(255,255,255,.3)',1);
 if(rl)lin(A,B2,'rgba(255,255,255,.4)',1.1);}
function cylG(cx,cy,rx,c){var gr=g.createLinearGradient(cx-rx,0,cx+rx,0);gr.addColorStop(0,cs(sc(tone(c,0),1.05)));gr.addColorStop(.35,cs(tone(c,1)));gr.addColorStop(1,cs(sc(tone(c,2),.9)));return gr;}
function cyl(u,v,r,z0,z1,c,o){
 o=o||{};var rx=r*45.25,ry=r*22.6,b=P(u,v,z0),t=P(u,v,z1);
 if(SHM){shEll(b[0],b[1],rx,ry,z1-z0);return;}
 trk([b[0]-rx,t[1]-ry]);trk([b[0]+rx,t[1]-ry]);
 g.beginPath();g.moveTo(b[0]-rx,t[1]);g.lineTo(b[0]-rx,b[1]);g.ellipse(b[0],b[1],rx,ry,0,PI,0,true);g.lineTo(b[0]+rx,t[1]);g.closePath();
 g.fillStyle=cylG(b[0],b[1],rx,c);g.fill();g.strokeStyle=INK;g.lineWidth=1.1;g.stroke();
 if(o.bands)for(var i=0;i<o.bands.length;i++){var bz=z0+(z1-z0)*o.bands[i],by=P(u,v,bz)[1];g.strokeStyle=o.bandc?cs(o.bandc):'rgba(10,8,20,.3)';g.lineWidth=o.bandw||1.2;g.beginPath();g.ellipse(b[0],by,rx,ry,0,0,PI);g.stroke();}
 g.beginPath();g.ellipse(t[0],t[1],rx,ry,0,0,TAU);g.fillStyle=cs(sc(tone(o.top||c,0),1.04));g.fill();g.stroke();
 g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=.9;g.beginPath();g.ellipse(t[0],t[1],rx-1,ry-.6,0,PI*1.05,PI*1.55);g.stroke();}
function cone(u,v,r,z,h,c){
 var rx=r*45.25,ry=r*22.6,b=P(u,v,z),a=[b[0],b[1]-h];
 if(SHM){shEll(b[0],b[1],rx,ry,h*.5);return;}
 trk([b[0],a[1]]);trk([b[0]-rx,b[1]]);trk([b[0]+rx,b[1]]);
 g.beginPath();g.moveTo(b[0]-rx,b[1]);g.lineTo(a[0],a[1]);g.lineTo(b[0]+rx,b[1]);g.ellipse(b[0],b[1],rx,ry,0,0,PI);g.closePath();
 var gr=g.createLinearGradient(b[0]-rx,0,b[0]+rx,0);gr.addColorStop(0,cs(sc(tone(c,0),1.1)));gr.addColorStop(.45,cs(tone(c,1)));gr.addColorStop(1,cs(sc(tone(c,2),.9)));
 g.fillStyle=gr;g.fill();g.strokeStyle=INK;g.lineWidth=1.1;g.stroke();}
function dome(u,v,r,z,c,o){
 o=o||{};var rx=r*45.25,ry=r*22.6,b=P(u,v,z);
 if(SHM){shEll(b[0],b[1],rx,ry,rx*.8);return;}
 trk([b[0],b[1]-rx]);trk([b[0]-rx,b[1]]);trk([b[0]+rx,b[1]]);
 g.beginPath();g.arc(b[0],b[1],rx,PI,TAU,false);g.ellipse(b[0],b[1],rx,ry,0,0,PI,false);g.closePath();
 var gr=g.createRadialGradient(b[0]-rx*.4,b[1]-rx*.55,rx*.1,b[0],b[1]-rx*.1,rx*1.15);
 if(o.glass){gr.addColorStop(0,cs(sc(mix(c,[255,255,255],.55),1)));gr.addColorStop(.5,cs(c));gr.addColorStop(1,cs(sc(c,.45)));}
 else{gr.addColorStop(0,cs(sc(tone(c,0),1.12)));gr.addColorStop(.5,cs(tone(c,1)));gr.addColorStop(1,cs(sc(tone(c,2),.85)));}
 g.fillStyle=gr;g.fill();g.strokeStyle=INK;g.lineWidth=1.1;g.stroke();
 g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.2;g.beginPath();g.arc(b[0],b[1],rx*.78,PI*1.12,PI*1.45);g.stroke();
 if(o.ribs){g.strokeStyle=cs(sc(o.ribc||[30,50,80],1),.45);g.lineWidth=.9;g.beginPath();g.ellipse(b[0],b[1],rx*.5,rx,0,PI,TAU);g.moveTo(b[0]-rx,b[1]);g.quadraticCurveTo(b[0],b[1]+ry*1.2-rx*.3,b[0]+rx,b[1]);g.stroke();}}
function dyn(o){if(!SHM)DYN.push(o);}
function flag(u,v,z,h,c,w){
 if(SHM)return;var b=P(u,v,z),t=P(u,v,z+h);trk(t);
 lin(b,t,cs([70,52,40]),1.5);
 g.fillStyle=cs([240,200,90]);g.beginPath();g.arc(t[0],t[1],1.3,0,TAU);g.fill();
 dyn({k:'flag',x:t[0],y:t[1]+1,w:w||10,h:(w||10)*.62,c:cs(c),d:cs(sc(c,.62))});}
function smoke(u,v,z,s){dyn({k:'smoke',x:P(u,v,z)[0],y:P(u,v,z)[1],s:s||1,n:NK});}
function win(B,f,a,b,wa,wb){
 if(SHM)return;var q=fq(B,f,a,b,a+wa,b+wb);
 if(NK>0){var gr=g.createLinearGradient(0,q[2][1],0,q[0][1]);gr.addColorStop(0,'#fff6bd');gr.addColorStop(1,'#ffb347');poly(q,gr,'rgba(40,20,10,.8)',.8);
  var cx=(q[0][0]+q[2][0])/2,cy=(q[0][1]+q[2][1])/2;g.save();g.globalCompositeOperation='lighter';var rg=g.createRadialGradient(cx,cy,0,cx,cy,9);rg.addColorStop(0,'rgba(255,190,90,'+(.55*NK)+')');rg.addColorStop(1,'rgba(255,190,90,0)');g.fillStyle=rg;g.fillRect(cx-9,cy-9,18,18);g.restore();}
 else{var gr2=g.createLinearGradient(0,q[2][1],0,q[0][1]);gr2.addColorStop(0,'#d6efff');gr2.addColorStop(1,'#6fa8d8');poly(q,gr2,'rgba(24,30,60,.85)',.9);
  var m=fp(B,f,a+wa/2,b),m2=fp(B,f,a+wa/2,b+wb);lin(m,m2,'rgba(24,30,60,.45)',.7);}}
function door(B,f,a,wa,hb,c){
 if(SHM)return;var pts=[fp(B,f,a,0),fp(B,f,a,hb*.6)],i,n=5;
 for(i=0;i<=n;i++){var an=PI*i/n;pts.push(fp(B,f,a+wa*(.5-.5*Math.cos(an)),hb*.6+hb*.4*Math.sin(an)));}
 pts.push(fp(B,f,a+wa,hb*.6),fp(B,f,a+wa,0));
 var outer=pts;poly(outer,cs(c),INK,1.1);
 var cx=a+wa*.18,w2=wa*.64,pts2=[fp(B,f,cx,0),fp(B,f,cx,hb*.55)];for(i=0;i<=n;i++){var an2=PI*i/n;pts2.push(fp(B,f,cx+w2*(.5-.5*Math.cos(an2)),hb*.55+hb*.33*Math.sin(an2)));}
 pts2.push(fp(B,f,cx+w2,hb*.55),fp(B,f,cx+w2,0));poly(pts2,cs(NK?[40,24,16]:[58,34,22]),null);}
function plinth(c,s,th,pat){
 var a=s/2,gr,L=[P(-a,a,-th),P(a,a,-th),P(a,a,0),P(-a,a,0)],R=[P(a,a,-th),P(a,-a,-th),P(a,-a,0),P(a,a,0)];
 poly(L,cs(sc(c,.62)),INK,1.1);poly(R,cs(sc(c,.46)),INK,1.1);
 var tp=[P(-a,-a),P(a,-a),P(a,a),P(-a,a)];
 gr=g.createLinearGradient(0,tp[0][1],0,tp[2][1]);gr.addColorStop(0,cs(sc(c,1.1)));gr.addColorStop(1,cs(sc(c,.95)));poly(tp,gr,INK,1.1);
 if(pat){g.strokeStyle='rgba(20,14,28,.12)';g.lineWidth=.8;g.beginPath();var n=pat,k;
  for(k=1;k<n;k++){var t=-a+2*a*k/n,p1=P(t,-a),p2=P(t,a),p3=P(-a,t),p4=P(a,t);g.moveTo(p1[0],p1[1]);g.lineTo(p2[0],p2[1]);g.moveTo(p3[0],p3[1]);g.lineTo(p4[0],p4[1]);}g.stroke();}
 lin(tp[3],tp[2],'rgba(255,255,255,.35)',.9);}
function block(u0,v0,u1,v1,z0,fl,fh,rh,o){
 o=o||{};var W=o.wall||CP.wall,R=o.roof||CP.roof,h=fl*fh,z1=z0+h,B=box(u0,v0,u1,v1,z0,z1,W,{tex:o.tex}),k,f;
 if(!SHM){
  eave(B,.1);
  var nl=Math.max(1,Math.round((u1-u0)/.17)),nr=Math.max(1,Math.round((v1-v0)/.17)),da=o.da==null?.5:o.da;
  if(!o.nowin)for(f=0;f<fl;f++){var b0=(f*fh+fh*.3)/h,bh=fh*.46/h;
   for(k=0;k<nl;k++){if(f===0&&o.door==='L'&&Math.abs((k+.5)/nl-da)<.62/nl)continue;win(B,'L',(k+.28)/nl,b0,.44/nl,bh);}
   for(k=0;k<nr;k++){if(f===0&&o.door==='R'&&Math.abs((k+.5)/nr-da)<.62/nr)continue;win(B,'R',(k+.28)/nr,b0,.44/nr,bh);}}
  if(o.door)door(B,o.door,da-.1,.2,fh*.66/h,o.dc||CP.accent);
  if(o.band){var bz=o.band;poly(fq(B,'L',0,bz-.04,1,bz+.04),cs(CP.accent),null);poly(fq(B,'R',0,bz-.04,1,bz+.04),cs(sc(CP.accent,.6)),null);}
 }
 if(o.roof!=='none'&&rh>0){
  var ridgeV=o.ridge?o.ridge==='v':(v1-v0)>(u1-u0)+.001;
  if(o.hip)hip(u0,v0,u1,v1,z1,rh,R,{ov:o.ov,rl:o.rl});
  else gable(u0,v0,u1,v1,z1,rh,R,{alongV:ridgeV,wall:W,ov:o.ov});
  if(o.chim&&!SHM){var cu=u0+(u1-u0)*.72,cv=(v0+v1)/2-.05;box(cu-.035,cv-.03,cu+.035,cv+.03,z1+rh*.45,z1+rh+4,STONE,{tex:'brick'});smoke(cu,cv,z1+rh+5,1);}
 }
 return{B:B,z:z1,top:z1+rh};}
function crenel(u0,v0,u1,v1,z,hh,c,n){
 var k,m=.085,t;
 for(k=0;k<n;k++){t=(k+.5)/n;box(u0+(u1-u0)*t-m/2,v0-.01,u0+(u1-u0)*t+m/2,v0+.06,z,z+hh,c);}
 for(k=0;k<n;k++){t=(k+.5)/n;box(u0-.01,v0+(v1-v0)*t-m/2,u0+.06,v0+(v1-v0)*t+m/2,z,z+hh,c);}
 for(k=0;k<n;k++){t=(k+.5)/n;box(u0+(u1-u0)*t-m/2,v1-.06,u0+(u1-u0)*t+m/2,v1+.01,z,z+hh,c);}
 for(k=0;k<n;k++){t=(k+.5)/n;box(u1-.06,v0+(v1-v0)*t-m/2,u1+.01,v0+(v1-v0)*t+m/2,z,z+hh,c);}}
function crate(u,v,s,h,c,z){z=z||0;box(u-s,v-s,u+s,v+s,z,z+h,c,{tex:'plank'});
 if(!SHM){var B=[u-s,v-s,u+s,v+s,z,z+h];lin(fp(B,'L',.5,0),fp(B,'L',.5,1),'rgba(20,10,10,.3)',.8);}}
function barrel(u,v,c,h){cyl(u,v,.06,0,h||8,c,{bands:[.3,.7],bandc:[40,30,30],bandw:1});}
function tree(u,v,s,c){
 if(SHM){var b0=P(u,v);shEll(b0[0],b0[1],6*s,3*s,12*s);return;}
 var b=P(u,v),cc=c||[74,150,84];trk([b[0],b[1]-20*s]);
 g.fillStyle=cs([104,72,44]);g.fillRect(b[0]-1.2*s,b[1]-6*s,2.4*s,6*s);
 g.lineWidth=1;g.strokeStyle=INK;g.fillStyle=cs(sc(cc,.7));g.beginPath();g.arc(b[0],b[1]-11*s,6.6*s,0,TAU);g.fill();g.stroke();
 g.fillStyle=cs(cc);g.beginPath();g.arc(b[0]-1*s,b[1]-12*s,5.4*s,0,TAU);g.fill();
 g.fillStyle=cs(sc(mix(cc,[220,250,150],.4),1.05));g.beginPath();g.arc(b[0]-2*s,b[1]-13.6*s,3*s,0,TAU);g.fill();}
function fence(u0,v0,u1,v1,n,h){
 if(SHM)return;var k;h=h||5;
 for(k=0;k<=n;k++){var t=k/n,a=P(u0+(u1-u0)*t,v0+(v1-v0)*t,0),b=P(u0+(u1-u0)*t,v0+(v1-v0)*t,h);lin(a,b,cs(sc(WOOD,.8)),1.6);}
 lin(P(u0,v0,h*.8),P(u1,v1,h*.8),cs(WOOD),1.2);lin(P(u0,v0,h*.4),P(u1,v1,h*.4),cs(WOOD),1.2);}
function ground(u0,v0,u1,v1,c,z){poly([P(u0,v0,z||0),P(u1,v0,z||0),P(u1,v1,z||0),P(u0,v1,z||0)],cs(c),'rgba(24,16,34,.45)',.9);}
function stripes(u0,v0,u1,v1,c1,c2,n,z){ /* ekin sıraları: u boyunca */
 if(SHM)return;ground(u0,v0,u1,v1,c1,z);var k;
 for(k=0;k<n;k+=2){var a=v0+(v1-v0)*k/n,b=v0+(v1-v0)*(k+1)/n;poly([P(u0,a,z||0),P(u1,a,z||0),P(u1,b,z||0),P(u0,b,z||0)],cs(c2),null);}
 g.strokeStyle='rgba(255,255,220,.22)';g.lineWidth=.8;g.beginPath();for(k=0;k<n;k++){var q=v0+(v1-v0)*(k+.5)/n,s1=P(u0+.02,q,z||0),s2=P(u1-.02,q,z||0);g.moveTo(s1[0],s1[1]);g.lineTo(s2[0],s2[1]);}g.stroke();}
function rockBox(u0,v0,u1,v1,z0,z1,c){return box(u0,v0,u1,v1,z0,z1,c,{tex:'stone'});}
function beam(a,b,w,c){if(SHM)return;lin(a,b,'rgba(24,16,34,.8)',w+1.4);lin(a,b,cs(c),w);}
function glowDyn(x,y,r,col,a){dyn({k:'glow',x:x,y:y,r:r,c:col,a:a||1});}
function crystal(x,y,h,w,c){
 if(SHM)return;trk([x,y-h]);
 poly([[x-w,y],[x-w*.3,y-h*.55],[x,y-h],[x+w*.3,y-h*.5],[x+w,y]],cs(sc(c,1.05)),INK,1);
 poly([[x,y-h],[x+w*.3,y-h*.5],[x+w,y],[x+w*.1,y]],cs(sc(c,.65)),null);
 lin([x-w*.4,y-2],[x-w*.1,y-h*.65],'rgba(255,255,255,.6)',.9);}

/* ---------- binalar ---------- */
var FN={},PL={
 hall:[[222,208,172],1.0,3,6],farm:[[142,106,66],.98,2,0],mine:[[158,146,132],.96,3,0],quarry:[[190,186,178],.98,3,0],
 power:[[104,114,132],.96,3,0],lab:[[214,224,236],.96,3,4],barracks:[[190,160,118],.98,3,0],wall:[[176,170,160],.9,3,0],
 port:[[214,196,150],.96,3,0],depot:[[184,180,172],.98,3,4],house:[[216,202,168],.86,3,0]};

FN.house=function(L){
 var W=CP.wall,R=CP.roof;
 if(L===1){block(-.2,-.15,.2,.15,0,1,13,10,{door:'L',da:.5});tree(.34,-.3,.7);}
 else if(L===2){fence(-.4,.3,.3,.4,6);block(-.25,-.18,.25,.18,0,1,15,12,{door:'L',da:.3,chim:true});tree(.36,-.28,.8);}
 else if(L===3){block(-.3,-.2,.2,.2,0,2,12,13,{door:'L',da:.28,chim:true,band:.5});block(.2,-.14,.42,.14,0,1,11,9,{ridge:'v',roof:R});tree(-.36,-.34,.8);}
 else if(L===4){block(-.1,-.42,.2,-.16,0,2,12,12,{ridge:'v',nowin:false});block(-.34,-.16,.2,.22,0,2,12,14,{door:'L',da:.3,chim:true,band:.5});block(.2,-.04,.42,.2,0,1,10,8,{ridge:'v'});tree(-.4,-.4,.9);fence(-.34,.34,.36,.4,7);}
 else{block(-.2,-.44,.14,-.2,0,2,12,11,{ridge:'v'});block(.2,-.2,.46,.14,0,2,12,11,{ridge:'v',door:'L'});
  block(-.28,-.2,.2,.24,0,3,12,14,{hip:true,rl:.4,door:'L',da:.4,band:.34,chim:true,dc:CP.accent});
  flag(-.04,.0,36+14,10,CP.accent,9);tree(-.42,-.36,1);tree(.34,.34,.8);fence(-.46,.3,.1,.46,6);}
};

FN.farm=function(L){
 var G1=[230,190,82],G2=[198,152,52],V1=[120,192,84],V2=[84,152,62],BW=mix(CP.wall,[196,112,76],.55);
 stripes(.04,-.3,.45,-.04,G1,G2,6);
 stripes(.06,.0,.45,.45,V1,V2,7);
 if(L>=2&&L<5)stripes(-.45,.0,-.04,.45,L%2?G1:V1,L%2?G2:V2,7);
 if(L===1)block(-.38,-.4,-.16,-.18,0,1,11,8,{wall:BW,tex:'plank',door:'L',da:.5,nowin:true});
 else block(-.44,-.44,-.18,-.18,0,1,L>=3?15:13,L>=4?12:10,{wall:BW,tex:'plank',door:'L',da:.5,nowin:true,ridge:'u'});
 if(L>=3){var sh=L>=5?30:26;cyl(-.1,-.34,.085,0,sh,[214,216,222],{bands:[.3,.62],bandc:[90,100,120]});cone(-.1,-.34,.09,sh,8,CP.roof);}
 if(L>=2&&!SHM){
  var s=P(.3,.2,0);lin(s,[s[0],s[1]-12],cs(DWOOD),1.6);lin([s[0]-5,s[1]-8],[s[0]+5,s[1]-8],cs(DWOOD),1.6);g.fillStyle=cs([228,196,110]);g.beginPath();g.arc(s[0],s[1]-13,2.2,0,TAU);g.fill();g.strokeStyle=INK;g.lineWidth=.8;g.stroke();
  poly([[s[0]-4,s[1]-14.5],[s[0]+4,s[1]-14.5],[s[0],s[1]-19]],cs(CP.roof),INK,.8);}
 if(L>=4){
  var wu=.37,wv=-.37;
  box(wu-.1,wv-.1,wu+.1,wv+.1,0,5,STONE,{tex:'stone'});
  var b=P(wu,wv,5),t=P(wu,wv,L>=5?44:38);
  if(!SHM){g.beginPath();g.moveTo(b[0]-9,b[1]);g.lineTo(t[0]-5,t[1]);g.lineTo(t[0]+5,t[1]);g.lineTo(b[0]+9,b[1]);g.ellipse(b[0],b[1],9,4.5,0,0,PI);g.closePath();
   var gr=g.createLinearGradient(b[0]-9,0,b[0]+9,0);gr.addColorStop(0,cs(sc(CP.wall,1.05)));gr.addColorStop(1,cs(sc(CP.wall,.6)));g.fillStyle=gr;g.fill();g.strokeStyle=INK;g.lineWidth=1.1;g.stroke();trk([t[0],t[1]-12]);
   g.fillStyle=cs(CP.roof);g.beginPath();g.moveTo(t[0]-6.5,t[1]+1);g.lineTo(t[0],t[1]-9);g.lineTo(t[0]+6.5,t[1]+1);g.ellipse(t[0],t[1]+1,6.5,3,0,0,PI);g.closePath();g.fill();g.stroke();}
  else shEll(b[0],b[1],9,4.5,34);
  dyn({k:'blades',x:t[0]+2,y:t[1]+3,len:L>=5?19:16,n:4,c:cs([240,236,224]),c2:cs(CP.accent)});}
 if(L>=5){
  var B=box(-.45,-.02,-.12,.44,0,9,[190,230,240],{notop:true});
  if(!SHM){poly(fq(B,'L',0,0,1,1),'rgba(180,235,250,.4)',INK,1);poly(fq(B,'R',0,0,1,1),'rgba(120,190,220,.5)',INK,1);}
  gable(-.45,-.02,-.12,.44,9,8,[200,240,250],{wall:[200,240,250],ov:0,alongV:true});
  if(!SHM){for(var k=1;k<4;k++)lin(fp(B,'L',k/4,0),fp(B,'L',k/4,1),'rgba(30,60,80,.4)',.8);}}
};

function mound(x,y,h,w,c,jx){
 if(SHM){shEll(x+4,y+6,w*.9,6,h*.6);return;}
 var A=[x+jx,y-h],Lf=[x-w,y+4],M=[x+2,y+15],R=[x+w,y+3],gr;
 var Nl=[A[0]+(Lf[0]-A[0])*.52-w*.1,A[1]+(Lf[1]-A[1])*.52-1],Nr=[A[0]+(R[0]-A[0])*.45+w*.12,A[1]+(R[1]-A[1])*.45-2];
 trk(A);
 gr=g.createLinearGradient(0,A[1],0,M[1]);gr.addColorStop(0,cs(sc(tone(c,0),1.05)));gr.addColorStop(1,cs(sc(tone(c,1),.9)));
 poly([A,Nl,Lf,M],gr,INK,1.2);
 gr=g.createLinearGradient(0,A[1],0,M[1]);gr.addColorStop(0,cs(sc(tone(c,2),1.15)));gr.addColorStop(1,cs(sc(tone(c,2),.8)));
 poly([A,M,R,Nr],gr,INK,1.2);
 g.strokeStyle='rgba(20,12,24,.26)';g.lineWidth=.9;g.beginPath();
 for(var k=1;k<4;k++){var t=k/4,a=[A[0]+(Lf[0]-A[0])*t,A[1]+(Lf[1]-A[1])*t],b=[A[0]+(M[0]-A[0])*t,A[1]+(M[1]-A[1])*t],c2=[A[0]+(R[0]-A[0])*t,A[1]+(R[1]-A[1])*t];g.moveTo(a[0],a[1]);g.lineTo(b[0]-1,b[1]-1);g.lineTo(c2[0],c2[1]);}
 g.stroke();
 lin(A,Lf,'rgba(255,255,255,.35)',1);lin(A,M,'rgba(255,255,255,.18)',1);}
FN.mine=function(L){
 var RK=mix([128,114,108],CP.dark,.2),w=24+L*3.4,h=26+L*5.2;
 if(L>=3)mound(-17,2,h*.55,w*.5,mix(RK,[150,130,118],.3),-3);
 mound(0,-5,h,w,RK,-4);
 if(L<3)mound(-15,3,h*.45,w*.46,mix(RK,[150,130,118],.3),3);
 else mound(17,4,h*.36,w*.38,mix(RK,[150,130,118],.3),-2);
 /* tünel ağzı: sol yüze yatık yay */
 if(!SHM){
  var Lf=[-w,-1],M=[2,10],sl=(M[1]-Lf[1])/(M[0]-Lf[0]),bx=Lf[0]+(M[0]-Lf[0])*.5,by=Lf[1]+(M[1]-Lf[1])*.5;
  g.save();g.translate(bx,by);g.transform(1,sl,0,1,0,0);
  g.beginPath();g.moveTo(-8,1);g.lineTo(-8,-9);g.arc(0,-9,8,PI,0);g.lineTo(8,1);g.closePath();g.fillStyle=cs(WOOD);g.fill();g.strokeStyle=INK;g.lineWidth=1.1;g.stroke();
  g.beginPath();g.moveTo(-5.6,1);g.lineTo(-5.6,-9);g.arc(0,-9,5.6,PI,0);g.lineTo(5.6,1);g.closePath();
  var gr=g.createLinearGradient(0,-15,0,1);gr.addColorStop(0,'#0a0610');gr.addColorStop(1,'#2c1e1c');g.fillStyle=gr;g.fill();
  g.strokeStyle=cs(DWOOD);g.lineWidth=1.8;g.beginPath();g.moveTo(-6.6,-7);g.lineTo(6.6,-7);g.stroke();
  g.restore();
  trk([bx,by-18]);
  if(L>=2){var lx=bx-9,ly=by-7+sl*(-9);g.fillStyle='#ffc84a';g.beginPath();g.arc(lx,ly,1.8,0,TAU);g.fill();glowDyn(lx,ly,11,[255,190,80],.9);}
  /* ray */
  g.strokeStyle=cs(METAL);g.lineWidth=1.2;g.beginPath();g.moveTo(bx-3,by+2);g.lineTo(bx-12,by+9);g.moveTo(bx+3,by+3);g.lineTo(bx-6,by+10);g.stroke();
  g.strokeStyle=cs(DWOOD);g.lineWidth=1.5;g.beginPath();for(var q=0;q<3;q++){g.moveTo(bx-4-q*3.6,by+4+q*1.8+1);g.lineTo(bx-1-q*3.6,by+4+q*1.8+4);}g.stroke();
 }
 /* vagon + cevher */
 if(L>=2){var cu=-.22,cv=.3;box(cu-.07,cv-.06,cu+.07,cv+.06,3,10,[124,98,78],{tex:'plank'});
  if(!SHM){var cp=P(cu,cv,10);crystal(cp[0]-2,cp[1]+1,6,3.4,[200,214,232]);crystal(cp[0]+2,cp[1]+1,5,3,mix(CP.accent,[255,255,255],.2));}
  cyl(cu-.05,cv+.06,.03,0,3,[60,56,60]);cyl(cu+.05,cv-.06,.03,0,3,[60,56,60]);}
 var oc=[[.3,.2],[.4,.08],[.26,.34]];
 for(var k=0;k<Math.min(3,1+(L>>1));k++){var q2=P(oc[k][0],oc[k][1]);crystal(q2[0],q2[1]+2,9+k*2,4.8,k?mix(CP.accent,[255,255,255],.2):[190,206,226]);}
 if(L>=3){
  var hu=.32,hv=-.3,A=P(hu-.1,hv+.1,0),Bp=P(hu+.1,hv-.1,0),T=P(hu,hv,48);
  if(!SHM){beam(A,[T[0]-1.5,T[1]],2.4,DWOOD);beam(Bp,[T[0]+1.5,T[1]],2.4,DWOOD);beam([A[0]+3,A[1]-16],[Bp[0]-3,Bp[1]-16],1.6,DWOOD);beam([A[0]+6,A[1]-30],[Bp[0]-6,Bp[1]-30],1.4,DWOOD);trk([T[0],T[1]-6]);
   g.fillStyle=cs([60,56,64]);g.beginPath();g.arc(T[0],T[1],6,0,TAU);g.fill();g.strokeStyle=INK;g.lineWidth=1;g.stroke();}
  else shRect(hu-.1,hv-.1,hu+.1,hv+.1,30);
  dyn({k:'wheel',x:T[0],y:T[1],r:5.4,c:cs(CP.accent)});}
 if(L>=4)block(.1,-.1,.34,.1,0,1,12,7,{wall:mix(WOOD,CP.wall,.3),tex:'plank',nowin:true,roof:CP.roof});
 if(L>=5){var q5=P(.1,.4);crystal(q5[0],q5[1],15,5.4,mix(CP.accent,[255,255,255],.1));glowDyn(q5[0],q5[1]-8,16,CP.glow,.8);
  q5=P(.42,.3);crystal(q5[0],q5[1],11,4,mix(CP.glow,[255,255,255],.2));glowDyn(q5[0],q5[1]-6,12,CP.glow,.7);}
};

FN.quarry=function(L){
 var ST=[204,198,188],ST2=[226,218,202],rh=9+(L>=4?2:0);
 var sz=[0,.38,.42,.45,.47,.48][L];
 box(-sz,-sz,sz,sz,0,rh,ST,{tex:'stone',notop:true});
 if(!SHM){
  var o=[P(-sz,-sz,rh),P(sz,-sz,rh),P(sz,sz,rh),P(-sz,sz,rh)];
  var gr=g.createLinearGradient(0,o[0][1],0,o[2][1]);gr.addColorStop(0,cs(sc(ST,1.12)));gr.addColorStop(1,cs(sc(ST,.98)));poly(o,gr,INK,1.1);
  var ins=sz*.66,i2=[P(-ins,-ins,rh),P(ins,-ins,rh),P(ins,ins,rh),P(-ins,ins,rh)];
  g.save();g.beginPath();g.moveTo(i2[0][0],i2[0][1]);for(var k=1;k<4;k++)g.lineTo(i2[k][0],i2[k][1]);g.closePath();g.clip();
  g.fillStyle=cs([70,64,72]);g.fillRect(-60,-50,120,90);
  var levels=L<=2?2:3,dep=7+L*1.6,cur=ins,zt=rh;
  for(var lv=0;lv<levels;lv++){var z2=zt-dep/levels,inn=cur*.74,dk=1-.1*lv;
   poly([P(-cur,-cur,zt),P(cur,-cur,zt),P(cur,-cur,z2),P(-cur,-cur,z2)],cs(sc(ST,.95*dk)),'rgba(20,14,28,.6)',.9);
   poly([P(-cur,-cur,zt),P(-cur,cur,zt),P(-cur,cur,z2),P(-cur,-cur,z2)],cs(sc(ST,.62*dk)),'rgba(20,14,28,.6)',.9);
   poly([P(-inn,-inn,z2),P(inn,-inn,z2),P(inn,inn,z2),P(-inn,inn,z2)],cs(sc(ST2,.88*dk)),'rgba(20,14,28,.5)',.9);cur=inn;zt=z2;}
  g.restore();
  g.strokeStyle='rgba(20,14,28,.6)';g.lineWidth=1.2;g.beginPath();g.moveTo(i2[0][0],i2[0][1]);for(k=1;k<4;k++)g.lineTo(i2[k][0],i2[k][1]);g.closePath();g.stroke();
  lin(i2[3],i2[2],'rgba(255,255,255,.5)',1);lin(i2[2],i2[1],'rgba(255,255,255,.25)',1);
 }
 var BL=[[.34,.1],[.34,.3],[.2,.4]],nb=Math.min(3,L+1);
 for(var b=0;b<nb;b++)box(BL[b][0]-.09,BL[b][1]-.07,BL[b][0]+.09,BL[b][1]+.07,rh,rh+8+(b===0&&L>=3?6:0),ST2,{tex:'stone'});
 if(L>=2)box(-.46,.3,-.28,.46,0,9,ST2,{tex:'stone'});
 if(L>=2){var mu=-.36,mv=-.36,mh=40+(L>=5?8:0);box(mu-.045,mv-.045,mu+.045,mv+.045,rh,mh,[206,152,70]);
  var top=P(mu,mv,mh),tip=P(.1,-.02,mh);
  beam(top,tip,2.2,[222,172,72]);beam(top,[top[0]-14,top[1]+5],1.8,[206,152,70]);trk([top[0],top[1]-6]);
  dyn({k:'hook',x1:tip[0]-3,y1:tip[1],len:L>=5?28:24,c:cs([236,230,214])});
  if(!SHM){g.fillStyle=cs(CP.accent);g.beginPath();g.arc(top[0],top[1]-3,2.2,0,TAU);g.fill();g.strokeStyle=INK;g.lineWidth=.8;g.stroke();}}
 if(L>=4){box(-.34,.12,-.18,.28,rh,rh+7,[132,108,82],{tex:'plank'});}
 if(L>=5){box(.1,-.47,.26,-.37,rh,34,[206,152,70]);box(.18,-.47,.22,.1,34,37,[222,172,72]);}
};

FN.power=function(L){
 var MT=[132,146,170],MT2=[96,106,128],GLw=CP.glow,AC=CP.accent;
 var B=box(-.4,-.2,.04,.26,0,16+L*1.5,MT2,{tex:'plank'});
 if(!SHM){
  poly(fq(B,'L',.1,.2,.9,.75),'rgba(18,24,40,.5)',null);
  for(var k=0;k<4;k++){var a=.14+k*.2;poly(fq(B,'L',a,.3,a+.12,.66),cs(mix(GLw,[255,255,255],.2)),INK,.7);}
  lin(fp(B,'R',.5,0),fp(B,'R',.5,1),'rgba(255,255,255,.12)',.8);
  /* yıldırım */
  var cx=fp(B,'R',.5,.5),bs=[[0,-6],[-3.4,.4],[-.6,.4],[-2.4,6],[3.4,-1],[.4,-1],[2.6,-6]];
  poly(bs.map(function(p){return[cx[0]+p[0]*.9,cx[1]+p[1]*.9];}),'#ffe44a','rgba(60,40,0,.8)',.8);}
 /* ana silindir */
 cyl(.26,.02,.12+(L>=3?.02:0),0,26+L*4,MT,{bands:[.18,.52,.86],bandc:mix(GLw,[255,255,255],.1),bandw:2});
 if(!SHM){var bt=P(.26,.02,26+L*4);glowDyn(bt[0],bt[1],12,GLw,.7);}
 if(L>=2)cyl(.28,.34,.075,0,14,MT,{bands:[.5],bandc:GLw,bandw:1.6});
 if(L>=2&&!SHM){lin(P(.04,.2,6),P(.2,.3,6),cs([70,76,92]),3);}
 if(L>=3){cyl(-.28,-.36,.06,0,46,[170,172,180],{bands:[.1,.3,.5,.7,.9],bandc:[200,60,50],bandw:3});smoke(-.28,-.36,46,1.4);}
 if(L>=4){ /* bobin kulesi */
  var bu=.36,bv=-.34,a=P(bu-.08,bv+.08,0),b=P(bu+.08,bv-.08,0),t=P(bu,bv,48);
  beam(a,[t[0]-1,t[1]+4],1.8,[150,156,170]);beam(b,[t[0]+1,t[1]+4],1.8,[150,156,170]);if(!SHM){beam([a[0]+3,a[1]-18],[b[0]-3,b[1]-18],1.3,[150,156,170]);beam([a[0]+1.4,a[1]-32],[b[0]-1.4,b[1]-32],1.2,[150,156,170]);
   g.fillStyle=cs(mix(GLw,[255,255,255],.4));g.beginPath();g.arc(t[0],t[1],5,0,TAU);g.fill();g.strokeStyle=INK;g.lineWidth=1;g.stroke();trk([t[0],t[1]-8]);}
  else shRect(bu-.08,bv-.08,bu+.08,bv+.08,30);
  glowDyn(t[0],t[1],20,GLw,1);dyn({k:'arc',x:t[0],y:t[1],r:15,c:cs(mix(GLw,[255,255,255],.5))});}
 if(L>=5){dome(.0,.36,.14,0,mix(GLw,[255,255,255],.1),{glass:true});var d5=P(.0,.36,12);glowDyn(d5[0],d5[1],24,GLw,1);dyn({k:'arc',x:d5[0],y:d5[1]-2,r:12,c:cs(mix(GLw,[255,255,255],.6))});}
};

FN.lab=function(L){
 var WH=mix(CP.wall,[240,246,252],.55),GL=mix(CP.accent,[150,200,255],.35),DM=mix(CP.accent,CP.roof,.35);
 var h0=[0,14,16,20,20,22][L];
 var s=[0,.3,.32,.36,.4,.42][L];
 var B=block(-s-.1,-s,s-.1,s,0,1,h0,0,{wall:WH,roof:'none',nowin:true});
 if(!SHM){poly(fq(B.B,'L',.08,.3,.92,.75),cs(sc(GL,.9)),INK,.9);lin(fp(B.B,'L',.5,.3),fp(B.B,'L',.5,.75),'rgba(20,40,70,.4)',.8);poly(fq(B.B,'R',.12,.3,.88,.75),cs(sc(GL,.55)),INK,.9);
  poly(fq(B.B,'L',0,.9,1,1),cs(CP.accent),null);}
 var dr=[0,.17,.18,.2,.22,.26][L];
 if(L>=4){box(-s-.08,-s+.02,s-.12,s-.02,h0,h0+10,WH);}
 var dbase=L>=4?h0+10:h0;
 dome(-.1,0,dr,dbase,GL,{glass:true,ribs:true});
 var dp=P(-.1,0,dbase+dr*45);
 if(!SHM){g.fillStyle='rgba(255,255,255,.9)';for(var i=0;i<4;i++){g.beginPath();g.arc(dp[0]-5+i*3.2,dp[1]+6+((i*5)%4),.8,0,TAU);g.fill();}}
 glowDyn(dp[0],dp[1]+6,dr*70,GL,.5);
 if(L>=2){var mp=P(.2,-.2,0),mt=P(.2,-.2,34+L*2);beam(mp,mt,1.8,[170,176,190]);dyn({k:'blink',x:mt[0],y:mt[1],c:[255,70,70]});}
 if(L>=3){ /* çanak */
  var du=.3,dv=.18,dpz=P(du,dv,0);box(du-.04,dv-.04,du+.04,dv+.04,0,8,[150,156,170]);
  var c0=P(du,dv,8);if(!SHM){g.save();g.translate(c0[0],c0[1]);g.rotate(-.5);g.beginPath();g.ellipse(0,-7,10,5,0,0,TAU);g.fillStyle=cs([226,232,240]);g.fill();g.strokeStyle=INK;g.lineWidth=1;g.stroke();
   g.fillStyle=cs([150,160,180]);g.beginPath();g.ellipse(.8,-6.4,6.4,3,0,0,TAU);g.fill();lin([0,-7],[5,-13],cs([70,76,90]),1.2);g.fillStyle='#ff6a4a';g.beginPath();g.arc(5,-13,1.4,0,TAU);g.fill();g.restore();trk([c0[0],c0[1]-20]);}}
 if(L>=4){dome(.28,-.26,.07,0,mix(CP.roof,GL,.4),{glass:true});}
 if(L>=5){var tp=P(-.1,0,dbase+dr*45+2);dyn({k:'orbit',x:tp[0],y:tp[1]+6,rx:dr*52,ry:dr*26,c:cs(CP.glow)});}
 if(L>=3&&!SHM&&false){}
};

FN.barracks=function(L){
 var SK=mix(STONE,CP.wall,.28),RF=CP.roof,AC=CP.accent;
 if(L===1){block(-.3,-.24,.14,.18,0,1,13,0,{wall:SK,tex:'stone',roof:'none',door:'L',da:.5,nowin:true});box(-.3,-.24,.14,.18,13,15,mix(SK,[90,90,100],.3),{});crenel(-.3,-.24,.14,.18,15,4,SK,3);flag(-.1,-.02,15,16,RF,10);}
 else if(L===2){block(-.38,-.3,.2,.2,0,1,16,0,{wall:SK,tex:'stone',roof:'none',door:'L',da:.5,nowin:true});crenel(-.38,-.3,.2,.2,16,4,SK,4);flag(-.1,-.05,16,16,RF,11);flag(.0,.0,16,14,AC,9);}
 else if(L===3){block(-.4,-.34,.2,.22,0,1,18,0,{wall:SK,tex:'stone',roof:'none',door:'L',da:.5,nowin:true});crenel(-.4,-.34,.2,.22,18,4,SK,4);
  cyl(-.34,.2,.075,0,26,SK,{});cone(-.34,.2,.09,26,12,RF);cyl(.18,-.3,.075,0,26,SK,{});cone(.18,-.3,.09,26,12,RF);flag(-.1,-.1,18,18,RF,11);}
 else{
  var h=L===4?22:24;
  block(-.42,-.4,.18,.26,0,1,h,0,{wall:SK,tex:'stone',roof:'none',door:'L',da:.5,nowin:true});
  box(-.3,-.28,.06,.14,h,h+14,SK,{tex:'stone'});crenel(-.3,-.28,.06,.14,h+14,4,SK,3);crenel(-.42,-.4,.18,.26,h,4,SK,5);
  var tz=h+10;[[-.4,.24],[.16,-.38]].forEach(function(c){cyl(c[0],c[1],.085,0,tz,SK,{});cone(c[0],c[1],.1,tz,13,RF);});
  if(L>=5){[[.16,.24],[-.4,-.38]].forEach(function(c){cyl(c[0],c[1],.085,0,tz+2,SK,{});cone(c[0],c[1],.1,tz+2,13,RF);});flag(-.12,-.07,h+14,22,RF,13);flag(-.4,.24,tz+13,10,AC,8);flag(.16,-.38,tz+13,10,AC,8);}
  else flag(-.12,-.07,h+14,20,RF,12);
 }
 /* talim alanı */
 if(L>=2){var u0=.26,v0=.04;
  [[u0,v0],[u0+.1,v0+.2]].slice(0,L>=3?2:1).forEach(function(p){var b=P(p[0],p[1]);if(SHM)return;lin(b,[b[0],b[1]-11],cs(DWOOD),2);lin([b[0]-5,b[1]-8],[b[0]+5,b[1]-8],cs(DWOOD),1.8);g.fillStyle=cs([226,196,120]);g.beginPath();g.arc(b[0],b[1]-13,2.4,0,TAU);g.fill();g.strokeStyle=INK;g.lineWidth=.8;g.stroke();});}
 if(L>=3&&!SHM){var r0=P(.12,.36);lin([r0[0]-6,r0[1]],[r0[0]+6,r0[1]],cs(DWOOD),1.6);lin([r0[0]-5,r0[1]],[r0[0]-5,r0[1]-8],cs(DWOOD),1.6);lin([r0[0]+5,r0[1]],[r0[0]+5,r0[1]-8],cs(DWOOD),1.6);lin([r0[0]-5,r0[1]-6],[r0[0]+5,r0[1]-6],cs(METAL),1.2);}
};

FN.wall=function(L){
 var SK=mix(STONE,CP.wall,.25),RF=CP.roof,hh=[0,9,13,17,21,25][L];
 if(L===1){ /* kazık çit */
  for(var k=0;k<9;k++){var u=-.46+k*.115,v=-.04;var b=P(u,v,0),t=P(u,v,hh+(k%2)*2);if(SHM)continue;lin(b,t,'rgba(24,16,34,.8)',3.8);lin(b,t,cs(sc(WOOD,.95+(k%3)*.06)),2.6);poly([[t[0]-1.9,t[1]],[t[0]+1.9,t[1]],[t[0],t[1]-4]],cs(sc(WOOD,1.1)),INK,.8);trk([t[0],t[1]-4]);}
  shRect(-.46,-.1,.46,.04,hh);
  box(-.44,-.07,.44,.03,0,3,mix(DWOOD,CP.dark,.2),{});
  return;}
 var th=L>=4?.12:.1;
 box(-.5,-th,.5,th,0,hh,SK,{tex:'stone'});
 crenel(-.5,-th,.5,th,hh,L>=4?5:4,SK,L>=3?7:6);
 if(L>=3){ /* kapı */
  var B=[-.5,-th,.5,th,0,hh];
  if(!SHM){var a0=.38,a1=.62,pts=[fp(B,'L',a0,0),fp(B,'L',a0,.5)],i;for(i=0;i<=6;i++){var an=PI*i/6;pts.push(fp(B,'L',.5-.12*Math.cos(an),.5+.4*Math.sin(an)));}pts.push(fp(B,'L',a1,.5),fp(B,'L',a1,0));poly(pts,cs([30,22,32]),INK,1.1);
   if(L>=5)for(i=1;i<4;i++)lin(fp(B,'L',a0+i*.06,0),fp(B,'L',a0+i*.06,.62),cs(METAL),.9);}}
 var tw=[0,0,0,.1,.12,.14][L],tzh=hh+(L>=4?10:6);
 if(L>=3){[-.4,.4].forEach(function(u){if(L>=5){cyl(u,0,tw*1.1,0,tzh+4,SK,{});cone(u,0,tw*1.2,tzh+4,13,RF);}else{box(u-tw,-tw,u+tw,tw,0,tzh,SK,{tex:'stone'});hip(u-tw,-tw,u+tw,tw,tzh,10,RF,{ov:.03});}});}
 if(L>=5&&!SHM){flag(0,0,hh+2,0.1,RF,1);}
 if(L>=4){flag(.4,0,tzh+(L>=5?17:10),11,RF,9);}
 if(L===2&&!SHM){for(var q=0;q<3;q++){var s=P(-.3+q*.3,.12);lin(s,[s[0],s[1]-4],cs(WOOD),2);}}
};

FN.port=function(L){
 var D1=DIRN;function PB(a,b,z){return D1?P(b,a,z):P(a,b,z);}
 function bx(a0,b0,a1,b1,z0,z1,c,o){return D1?box(b0,a0,b1,a1,z0,z1,c,o):box(a0,b0,a1,b1,z0,z1,c,o);}
 var pierLen=[0,.72,.86,.96,1.03,1.08][L],DK=[176,130,82],pw=L>=4?.18:.15;
 /* iskele tahtası */
 var za=2.5;
 if(!SHM){
  var q=[PB(.05,-pw,za),PB(pierLen,-pw,za),PB(pierLen,pw,za),PB(.05,pw,za)];
  /* yan yüzler */
  poly([PB(.05,pw,za-3),PB(pierLen,pw,za-3),PB(pierLen,pw,za),PB(.05,pw,za)],cs(sc(DK,.62)),INK,1);
  poly([PB(pierLen,pw,za-3),PB(pierLen,-pw,za-3),PB(pierLen,-pw,za),PB(pierLen,pw,za)],cs(sc(DK,.46)),INK,1);
  var gr=g.createLinearGradient(q[0][0],q[0][1],q[2][0],q[2][1]);gr.addColorStop(0,cs(sc(DK,1.12)));gr.addColorStop(1,cs(sc(DK,.96)));poly(q,gr,INK,1.1);
  g.strokeStyle='rgba(40,24,12,.35)';g.lineWidth=.8;g.beginPath();for(var k=1;k<Math.round(pierLen*12);k++){var a=.05+k*(pierLen-.05)/Math.round(pierLen*12),p1=PB(a,-pw,za),p2=PB(a,pw,za);g.moveTo(p1[0],p1[1]);g.lineTo(p2[0],p2[1]);}g.stroke();
  /* direkler */
  for(k=0;k<=Math.round(pierLen*5);k++){var aa=.1+k*(pierLen-.1)/Math.round(pierLen*5),pb=PB(aa,pw,za);lin(pb,[pb[0],pb[1]-5],cs(DWOOD),1.8);if(L>=3&&k%2===0)lin(PB(aa,pw,za+5),PB(aa+.1,pw,za+5),cs(DWOOD),1);}
  if(L>=4){var tq=[PB(pierLen-.14,pw,za),PB(pierLen+.0,pw,za),PB(pierLen,.5,za),PB(pierLen-.14,.5,za)];
   poly([PB(pierLen-.14,.5,za-3),PB(pierLen,.5,za-3),PB(pierLen,.5,za),PB(pierLen-.14,.5,za)],cs(sc(DK,.62)),INK,1);poly(tq,cs(sc(DK,1.02)),INK,1.1);}
 }else{shp([PB(.05,-pw),PB(pierLen,-pw),PB(pierLen,pw),PB(.05,pw)],3);}
 /* depo */
 var WB=mix(CP.wall,[220,190,140],.35);
 if(L===1){bx(-.4,-.14,-.12,.14,0,10,WB,{tex:'plank'});if(D1)gable(-.14,-.4,.14,-.12,10,8,CP.roof,{wall:WB,alongV:false});else gable(-.4,-.14,-.12,.14,10,8,CP.roof,{wall:WB,alongV:true});}
 else{var h=L>=3?14:11;
  if(D1){block(-.14,-.44,.14,-.1,0,1,h,8,{wall:WB,tex:'plank',roof:CP.roof,ridge:'u',door:'L',da:.5,nowin:true});if(L>=4)block(-.4,-.3,-.18,-.12,0,1,h,8,{wall:WB,tex:'plank',ridge:'v',nowin:true});}
  else{block(-.44,-.14,-.1,.14,0,1,h,8,{wall:WB,tex:'plank',roof:CP.roof,ridge:'v',door:'R',da:.5,nowin:true});if(L>=4)block(-.3,-.4,-.12,-.18,0,1,h,8,{wall:WB,tex:'plank',ridge:'u',nowin:true});}}
 if(L>=2){var s=function(a,b,sz,hh2,c,z){if(D1)crate(b,a,sz,hh2,c,z);else crate(a,b,sz,hh2,c,z);};s(.34,pw-.05,.05,8,[196,140,70],za);if(L>=3)s(.45,-pw+.05,.05,8,mix(CP.roof,[200,160,90],.3),za);if(L>=3)s(.34,pw-.05,.04,6,[220,190,110],za+8);}
 /* vinç */
 if(L>=3){var cu=.2,cv=-pw-.04;var b=PB(cu,cv,za),t=PB(cu,cv,34);if(!SHM){beam(b,t,2.4,[200,150,70]);var tip=PB(cu+.3,cv+.08,34);beam(t,tip,2,[220,170,70]);beam(t,[t[0]-8,t[1]+8],1.4,[200,150,70]);dyn({k:'hook',x1:tip[0],y1:tip[1],len:18,c:cs([232,226,210])});trk([t[0],t[1]-4]);}else shp([b,[b[0]+4,b[1]]],20);}
 /* fener (L5) */
 if(L>=5){var fa=-.28,fb=.3;var fu=D1?fb:fa,fv=D1?fa:fb;cyl(fu,fv,.09,0,40,[236,232,226],{bands:[.3,.55,.8],bandc:CP.roof,bandw:5});cyl(fu,fv,.11,40,43,[90,80,90]);
  cyl(fu,fv,.06,43,50,[255,236,160],{});cone(fu,fv,.09,50,10,CP.roof);var lt=P(fu,fv,47);glowDyn(lt[0],lt[1],26,[255,236,150],1);}
 /* tekne */
 var bo={a:pierLen*.55,b:pw+.1};
 var bp=PB(bo.a,bo.b+.06,0);
 dyn({k:'boat',x:bp[0],y:bp[1],s:[0,.7,.8,1,1.1,1.5][L],flip:D1,c:cs(CP.roof),c2:cs(CP.wall),a:cs(CP.accent),two:L>=5,ro:L===1});
};

FN.depot=function(L){
 var WH=mix(CP.wall,[170,170,176],.35),RF=mix(CP.roof,[150,150,160],.25),CC=[[CP.roof],[CP.accent],[mix(CP.dark,[180,180,190],.3)],[[222,180,70]]];
 function cont(u,v,z,k){var c=[CP.roof,CP.accent,mix(CP.dark,[150,150,170],.4),[226,184,76]][k%4];var B=box(u-.1,v-.06,u+.1,v+.06,z,z+8,c,{});if(!SHM){for(var i=1;i<5;i++)lin(fp(B,'L',i/5,.05),fp(B,'L',i/5,.95),'rgba(20,10,20,.28)',.8);}}
 var WD=[0,.22,.26,.3,.3,.34][L];
 if(L===1){block(-.34,-.2,.0,.2,0,1,12,9,{wall:WH,tex:'plank',roof:RF,ridge:'u',nowin:true});}
 else if(L===2){block(-.44,-.24,.1,.16,0,1,14,10,{wall:WH,tex:'plank',roof:RF,ridge:'u',nowin:true});}
 else{block(-.46,-.38,.1,-.04,0,1,16,10,{wall:WH,tex:'plank',roof:RF,ridge:'u',nowin:true});
  if(L>=4)block(-.46,-.04,.1,.3,0,1,16,10,{wall:WH,tex:'plank',roof:RF,ridge:'u',nowin:true});}
 /* rulo kapı */
 var B=[-.44,-.24,.1,.16,0,14];
 if(L===1)B=[-.34,-.2,.0,.2,0,12];else if(L>=3)B=[-.46,L>=4?-.04:-.38,.1,L>=4?.3:-.04,0,16];
 if(!SHM){var dl=L>=3?.45:.4;poly(fq(B,'L',.18,0,.82,.74),cs(mix(CP.accent,[40,40,50],.3)),INK,1.1);
  for(var i=1;i<6;i++)lin(fp(B,'L',.18,i*.74/6),fp(B,'L',.82,i*.74/6),'rgba(10,10,20,.35)',.8);
  poly(fq(B,'L',.18,.74,.82,.82),cs([226,184,76]),INK,.8);}
 /* kasalar */
 var cr=[[.26,.1,.06,10,[196,140,70]],[.26,.28,.06,8,[168,120,60]],[.38,.18,.055,8,[204,152,76]],[.14,.34,.05,7,[210,160,90]]];
 for(var k=0;k<Math.min(4,L+1);k++)crate(cr[k][0],cr[k][1],cr[k][2],cr[k][3],mix(cr[k][4],CP.accent,.12));
 if(L>=2){barrel(.4,.36,mix(CP.accent,[90,70,60],.3));barrel(.3,.4,[150,110,70]);}
 if(L>=3){cont(.3,-.28,0,0);cont(.3,-.28,8,1);}
 if(L>=4){cont(.3,-.1,0,2);cont(.2,.36,0,3);}
 if(L>=5){cont(.3,-.28,16,2);cont(.3,-.1,8,0);box(.18,-.46,.24,-.4,0,30,[200,150,70]);box(.18,.28,.24,.34,0,30,[200,150,70]);box(.18,-.46,.24,.34,30,33,[220,170,70]);}
};

FN.hall=function(L){
 var W=CP.wall,R=CP.roof,A=CP.accent,GD=[246,206,90],WL=mix(W,[226,220,206],.3);
 if(L>=2){box(-.36,-.22,.42,.34,0,3,mix(W,[180,176,170],.5),{tex:'stone'});}
 if(L===1){block(-.3,-.22,.26,.22,0,1,16,13,{door:'L',da:.5,band:.5});flag(.0,.04,29,15,A,11);}
 else if(L===2){block(-.3,-.2,.3,.22,3,2,12,14,{door:'L',da:.5,band:.5,hip:true,rl:.5});box(-.08,-.1,.1,.08,3+24,3+24+10,WL,{tex:'stone'});hip(-.08,-.1,.1,.08,37,12,R,{ov:.03});flag(.0,-.01,49,12,A,10);}
 else if(L===3){
  block(.18,-.34,.42,.0,3,1,16,10,{ridge:'v',tex:'stone'});block(-.44,.0,.0,.28,3,1,16,10,{ridge:'u',tex:'stone'});
  block(-.28,-.26,.26,.24,3,3,11,14,{door:'L',da:.5,band:.37,hip:true,rl:.45});
  box(-.1,-.12,.1,.08,36,48,WL,{tex:'stone'});hip(-.1,-.12,.1,.08,48,15,R,{ov:.03});flag(0,-.02,63,13,A,11);}
 else if(L===4){
  block(.2,-.4,.44,-.04,3,2,10,10,{ridge:'v',tex:'stone'});block(-.46,.0,-.0,.3,3,2,10,10,{ridge:'u',tex:'stone'});
  block(-.3,-.28,.28,.26,3,3,12,16,{door:'L',da:.5,band:.37,hip:true,rl:.45});
  [[-.32,-.3],[.28,-.3],[-.32,.24]].forEach(function(c){cyl(c[0],c[1],.08,3,44,WL,{});cone(c[0],c[1],.095,44,12,R);});
  box(-.12,-.14,.12,.1,39,54,WL,{tex:'stone'});hip(-.12,-.14,.12,.1,54,17,R,{ov:.03});flag(0,-.02,71,14,A,12);}
 else{
  block(.2,-.42,.46,-.04,3,2,11,10,{ridge:'v',tex:'stone'});block(-.48,.0,-.0,.32,3,2,11,10,{ridge:'u',tex:'stone'});
  block(-.32,-.3,.3,.28,3,3,13,0,{door:'L',da:.5,band:.37,roof:'none'});
  box(-.35,-.33,.33,.31,42,46,WL,{tex:'stone'});
  [[-.34,-.32],[.3,-.32],[-.34,.26],[.3,.26]].forEach(function(c){cyl(c[0],c[1],.08,3,50,WL,{});cone(c[0],c[1],.095,50,13,R);});
  cyl(0,-.02,.2,46,58,WL,{bands:[.5],bandc:A,bandw:2});
  dome(0,-.02,.2,58,GD,{});
  cone(0,-.02,.028,67,12,GD);
  flag(0,-.02,79,13,A,13);
  var dg=P(0,-.02,60);glowDyn(dg[0],dg[1],26,GD,.6);
 }
};

var FNAME=Object.keys(FN);
var TYPES=['hall','farm','mine','quarry','power','lab','barracks','wall','port','depot','house'];
/* sprite sınırları: x0,x1,y0,y1 */
var BND={hall:[-72,72,-130,30],farm:[-64,64,-84,30],mine:[-64,64,-92,30],quarry:[-64,64,-96,30],power:[-64,64,-104,30],lab:[-64,64,-80,30],barracks:[-64,64,-92,30],wall:[-64,64,-88,30],port:[-72,72,-96,32],depot:[-64,64,-80,30],house:[-64,64,-100,30]};

/* ---------- önbellek ---------- */
var CACHE=new Map(),CAP=160;
function drawShadow(){
 var a=NK?.05:.075;g.save();
 for(var k=0;k<4;k++){g.fillStyle='rgba(28,22,56,'+(a*(1-.18*k)).toFixed(3)+')';g.strokeStyle=g.fillStyle;g.lineWidth=k*2.6;g.lineJoin='round';
  for(var i=0;i<SHP.length;i++){var h=SHP[i];if(!h.length)continue;g.beginPath();g.moveTo(h[0][0],h[0][1]);for(var j=1;j<h.length;j++)g.lineTo(h[j][0],h[j][1]);g.closePath();g.fill();if(k)g.stroke();}}
 g.restore();}
function damageFx(lv,d,type){
 var r=U.mk(U.hs(type)+lv*31),n=3+d*4,i;
 g.save();g.globalCompositeOperation='source-atop';
 var gr=g.createLinearGradient(0,-120,0,30);gr.addColorStop(0,'rgba(20,12,10,'+(.08+.06*d)+')');gr.addColorStop(1,'rgba(20,12,10,'+(.24+.08*d)+')');g.fillStyle=gr;g.fillRect(-100,-200,200,260);
 for(i=0;i<n;i++){var x=(r()-.5)*70,y=-r()*50-4,rr=6+r()*12;var rg=g.createRadialGradient(x,y,0,x,y,rr);rg.addColorStop(0,'rgba(18,10,8,.6)');rg.addColorStop(1,'rgba(18,10,8,0)');g.fillStyle=rg;g.fillRect(x-rr,y-rr,rr*2,rr*2);}
 g.strokeStyle='rgba(14,8,10,.85)';g.lineWidth=1.3;g.lineCap='round';
 for(i=0;i<d+1;i++){var x0=(r()-.5)*40,y0=-r()*36-6;g.beginPath();g.moveTo(x0,y0);for(var k=0;k<4;k++){x0+=(r()-.5)*9;y0+=4+r()*5;g.lineTo(x0,y0);}g.stroke();}
 /* kopan parçalar */
 g.fillStyle='rgba(16,10,12,.75)';
 for(i=0;i<d;i++){var hx=(r()-.5)*36,hy=-18-r()*22;g.beginPath();g.moveTo(hx,hy);g.lineTo(hx+7,hy+2);g.lineTo(hx+5,hy+9);g.lineTo(hx-2,hy+6);g.closePath();g.fill();}
 g.restore();}
function sprite(type,lv,civ,rs,nq,dq,dir){
 var key=type+'|'+lv+'|'+civ.id+'|'+rs+'|'+nq+'|'+dq+'|'+dir,s=CACHE.get(key);
 if(s){CACHE.delete(key);CACHE.set(key,s);return s;}
 var b=BND[type]||BND.house,w=b[1]-b[0],h=b[3]-b[2],cv=mkCv(Math.ceil(w*rs),Math.ceil(h*rs));
 g=cv.getContext('2d');g.scale(rs,rs);g.translate(-b[0],-b[2]);g.lineJoin='round';g.lineCap='round';
 CP=civ;NK=[0,.55,1][nq];DIRN=dir;TOP=1e9;LEFT=1e9;RIGHT=-1e9;
 var pl=PL[type],fn=FN[type];
 plinth(mix(pl[0],civ.dark,.1),pl[1],pl[2],pl[3]);
 if(NK){g.save();g.globalCompositeOperation='lighter';var rg=g.createRadialGradient(0,2,0,0,2,40);rg.addColorStop(0,'rgba(255,170,80,'+.2*NK+')');rg.addColorStop(1,'rgba(255,170,80,0)');g.fillStyle=rg;g.fillRect(-48,-30,96,64);g.restore();}
 SHM=true;SHP=[];DYN=[];fn(lv);SHM=false;drawShadow();
 DYN=[];TOP=1e9;LEFT=1e9;RIGHT=-1e9;fn(lv);
 var dyns=DYN,top=Math.min(TOP,-14);
 if(dq>0)damageFx(lv,dq,type);
 s={cv:cv,x0:b[0],y0:b[2],w:w,h:h,dyn:dyns,top:top,left:LEFT,right:RIGHT,rs:rs};
 CACHE.set(key,s);if(CACHE.size>CAP)CACHE.delete(CACHE.keys().next().value);
 return s;}

/* ---------- dinamik parçalar (önbellek dışı, ucuz) ---------- */
function drawDyn(ctx,S,t,night,o){
 var L=S.dyn,i,n=L.length;
 for(i=0;i<n;i++){var d=L[i];
  switch(d.k){
  case 'smoke':
   for(var k=0;k<4;k++){var p=((t*.45+k/4)%1),x=d.x+Math.sin(p*5+k*2)*2.4+p*9*d.s,y=d.y-p*26*d.s,r=(1.8+p*5.5)*d.s;
    ctx.fillStyle='rgba('+(d.n?150:244)+','+(d.n?156:240)+','+(d.n?176:238)+','+((1-p)*.62).toFixed(3)+')';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}break;
  case 'flag':
   var w=d.w,h=d.h,ph=t*5+d.x*.7;ctx.fillStyle=d.c;ctx.beginPath();ctx.moveTo(d.x,d.y);
   ctx.bezierCurveTo(d.x+w*.3,d.y+Math.sin(ph)*1.6-1,d.x+w*.65,d.y+Math.sin(ph+1.6)*2+1,d.x+w,d.y+Math.sin(ph+2.2)*1.6+1);
   ctx.lineTo(d.x+w*.9,d.y+h+Math.sin(ph+2.5)*1.4);ctx.bezierCurveTo(d.x+w*.62,d.y+h+Math.sin(ph+1.8)*2,d.x+w*.3,d.y+h+Math.sin(ph+.2)*1.6,d.x,d.y+h);ctx.closePath();ctx.fill();
   ctx.strokeStyle='rgba(24,16,34,.7)';ctx.lineWidth=.8;ctx.stroke();
   ctx.fillStyle=d.d;ctx.beginPath();ctx.moveTo(d.x,d.y+h*.55);ctx.lineTo(d.x+w*.8,d.y+h*.5+Math.sin(ph+1.8)*1.2);ctx.lineTo(d.x+w*.8,d.y+h*.8);ctx.lineTo(d.x,d.y+h);ctx.closePath();ctx.globalAlpha=.4;ctx.fill();ctx.globalAlpha=1;break;
  case 'blades':
   ctx.save();ctx.translate(d.x,d.y);ctx.rotate(t*1.1);
   for(var b=0;b<d.n;b++){ctx.rotate(TAU/d.n);ctx.fillStyle=d.c;ctx.strokeStyle='rgba(24,16,34,.8)';ctx.lineWidth=.9;ctx.beginPath();ctx.rect(1.4,-2.8,d.len,3.4);ctx.fill();ctx.stroke();ctx.fillStyle=d.c2;ctx.fillRect(3,-2.2,2,2.2);}
   ctx.fillStyle='#6b4a2e';ctx.beginPath();ctx.arc(0,0,2.2,0,TAU);ctx.fill();ctx.restore();break;
  case 'wheel':
   ctx.save();ctx.translate(d.x,d.y);ctx.rotate(-t*1.6);ctx.strokeStyle=d.c;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-d.r,0);ctx.lineTo(d.r,0);ctx.moveTo(0,-d.r);ctx.lineTo(0,d.r);ctx.moveTo(-d.r*.7,-d.r*.7);ctx.lineTo(d.r*.7,d.r*.7);ctx.moveTo(d.r*.7,-d.r*.7);ctx.lineTo(-d.r*.7,d.r*.7);ctx.stroke();
   ctx.strokeStyle='rgba(24,16,34,.7)';ctx.lineWidth=.9;ctx.beginPath();ctx.arc(0,0,d.r,0,TAU);ctx.stroke();ctx.restore();break;
  case 'hook':
   var sw=Math.sin(t*1.3)*2.2,hy=d.y1+d.len*.8+Math.sin(t*.9)*3;ctx.strokeStyle='rgba(24,16,34,.8)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(d.x1,d.y1);ctx.lineTo(d.x1+sw,hy);ctx.stroke();
   ctx.fillStyle=d.c;ctx.strokeStyle='rgba(24,16,34,.8)';ctx.beginPath();ctx.rect(d.x1+sw-3,hy,6,5);ctx.fill();ctx.stroke();break;
  case 'glow':
   if(d.a){var pu=.8+.2*Math.sin(t*3+d.x),nb=1+night*.8;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(1,d.a*.55*pu*nb);var gt=glowTex(d.c),rr=d.r;ctx.drawImage(gt,d.x-rr,d.y-rr,rr*2,rr*2);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}break;
  case 'arc':
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=d.c;ctx.lineWidth=1.2;var ph2=Math.floor(t*10);
   for(var a=0;a<3;a++){var seed=(ph2*7+a*13+Math.floor(d.x))%17,ang=(seed/17+a/3)*TAU,x0=d.x,y0=d.y;ctx.beginPath();ctx.moveTo(x0,y0);
    for(var s=1;s<=4;s++){var rr2=d.r*s/4,jj=((seed*s*3)%7-3)*1.1;ctx.lineTo(x0+Math.cos(ang)*rr2+Math.sin(ang)*jj,y0+Math.sin(ang)*rr2*.7-Math.cos(ang)*jj);}ctx.stroke();}
   ctx.restore();break;
  case 'blink':
   if(((t*1.4)%1)<.5){ctx.fillStyle='rgb('+d.c.join(',')+')';ctx.beginPath();ctx.arc(d.x,d.y-2,1.7,0,TAU);ctx.fill();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.7;ctx.drawImage(glowTex(d.c),d.x-8,d.y-10,16,16);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}break;
  case 'orbit':
   var an=t*1.2;ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(d.x,d.y,d.rx,d.ry,-.35,0,TAU);ctx.stroke();
   var ox=Math.cos(an)*d.rx,oy=Math.sin(an)*d.ry,cr=Math.cos(-.35),sr=Math.sin(-.35),px=d.x+ox*cr-oy*sr,py=d.y+ox*sr+oy*cr;
   ctx.fillStyle=d.c;ctx.beginPath();ctx.arc(px,py,2,0,TAU);ctx.fill();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.8;ctx.drawImage(glowTex([255,230,150]),px-7,py-7,14,14);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';break;
  case 'boat':
   ctx.save();ctx.translate(d.x,d.y+Math.sin(t*1.6)*1.2);ctx.rotate(Math.sin(t*1.2)*.03);ctx.scale(d.s*(d.flip?-1:1),d.s);
   ctx.fillStyle='rgba(20,40,70,.25)';ctx.beginPath();ctx.ellipse(2,3,14,4.5,0,0,TAU);ctx.fill();
   ctx.fillStyle=d.c;ctx.strokeStyle='rgba(24,16,34,.85)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-13,-3);ctx.lineTo(13,-3);ctx.lineTo(8,4);ctx.lineTo(-9,4);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(-12,-2.4,24,1.3);
   if(!d.ro){ctx.strokeStyle='#4a3524';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,-3);ctx.lineTo(0,-24);ctx.stroke();
    ctx.fillStyle=d.c2;ctx.strokeStyle='rgba(24,16,34,.8)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(1.5,-23);ctx.lineTo(1.5,-5);ctx.lineTo(11,-5);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=d.a;ctx.beginPath();ctx.moveTo(-1.5,-20);ctx.lineTo(-1.5,-5);ctx.lineTo(-9,-5);ctx.closePath();ctx.fill();ctx.stroke();
    if(d.two){ctx.strokeStyle='#4a3524';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-8,-3);ctx.lineTo(-8,-18);ctx.stroke();ctx.fillStyle=d.c2;ctx.beginPath();ctx.moveTo(-6.5,-17);ctx.lineTo(-6.5,-5);ctx.lineTo(-2,-5);ctx.closePath();ctx.fill();}}
   ctx.restore();break;
  }}}

function scaffold(ctx,S,t,p){
 var h=Math.max(22,Math.min(84,-S.top-8)),a=.4,k;
 var C=[P(-a,a,0),P(a,a,0),P(a,-a,0)];
 ctx.save();ctx.lineCap='round';
 var Pt=function(u,v,z){return P(u,v,z);};
 /* tabla: kare direk, yatay kuşaklar, çaprazlar */
 ctx.strokeStyle='rgba(24,16,34,.85)';
 var poles=[[-a,a],[0,a],[a,a],[a,0],[a,-a]];
 var drawSet=function(w,col){
  ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();
  for(var i=0;i<poles.length;i++){var b=Pt(poles[i][0],poles[i][1],0),tp=Pt(poles[i][0],poles[i][1],h);ctx.moveTo(b[0],b[1]);ctx.lineTo(tp[0],tp[1]);}
  var lv=Math.max(2,Math.round(h/17));
  for(k=1;k<=lv;k++){var z=h*k/lv,l1=Pt(-a,a,z),l2=Pt(a,a,z),l3=Pt(a,-a,z);ctx.moveTo(l1[0],l1[1]);ctx.lineTo(l2[0],l2[1]);ctx.lineTo(l3[0],l3[1]);
   var z0=h*(k-1)/lv;for(var j=0;j<2;j++){var u0=-a+j*a,u1=u0+a,dd=(j+k)%2?[Pt(u0,a,z0),Pt(u1,a,z)]:[Pt(u0,a,z),Pt(u1,a,z0)];ctx.moveTo(dd[0][0],dd[0][1]);ctx.lineTo(dd[1][0],dd[1][1]);}
   for(j=0;j<2;j++){var v0=a-j*a,v1=v0-a,de=(j+k)%2?[Pt(a,v0,z0),Pt(a,v1,z)]:[Pt(a,v0,z),Pt(a,v1,z0)];ctx.moveTo(de[0][0],de[0][1]);ctx.lineTo(de[1][0],de[1][1]);}}
  ctx.stroke();};
 drawSet(2.3,'rgba(24,16,34,.75)');drawSet(1.1,'rgb(196,150,90)');
 /* ağ bezi */
 ctx.globalAlpha=.1;ctx.fillStyle='#fff';var q=[Pt(-a,a,0),Pt(a,a,0),Pt(a,a,h),Pt(-a,a,h)];ctx.beginPath();ctx.moveTo(q[0][0],q[0][1]);for(k=1;k<4;k++)ctx.lineTo(q[k][0],q[k][1]);ctx.fill();ctx.globalAlpha=1;
 /* çalışma: çekiç kıvılcımı ve toz */
 var ph=(t*2.2)%1,wk=Pt(.1,.1,h*Math.min(1,p+.05));
 for(k=0;k<3;k++){var pp=((t*.7+k/3)%1);ctx.fillStyle='rgba(222,206,176,'+((1-pp)*.55).toFixed(2)+')';ctx.beginPath();ctx.arc(-14+k*14+Math.sin(pp*4+k)*3,12-pp*14,2+pp*5,0,TAU);ctx.fill();}
 if(ph<.25){ctx.fillStyle='#ffe58a';ctx.beginPath();ctx.arc(wk[0]+3,wk[1]-2,1.6,0,TAU);ctx.arc(wk[0]-2,wk[1]-4,1.1,0,TAU);ctx.fill();}
 ctx.restore();}
function construct(ctx,S,p,t,rs){
 var top=S.top-3,bot=22,cut=bot-(bot-top)*Math.max(0,Math.min(1,p));
 /* temel */
 ctx.fillStyle='rgba(38,26,22,.28)';ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(34,0);ctx.lineTo(0,17);ctx.lineTo(-34,0);ctx.closePath();ctx.fill();
 ctx.fillStyle='#8a6a48';ctx.strokeStyle='rgba(24,16,34,.7)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(0,-14.5);ctx.lineTo(29,0);ctx.lineTo(0,14.5);ctx.lineTo(-29,0);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.strokeStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.moveTo(-15,-7);ctx.lineTo(14,7);ctx.moveTo(15,-7);ctx.lineTo(-14,7);ctx.stroke();
 /* hayalet */
 ctx.globalAlpha=.2;ctx.drawImage(S.cv,S.x0,S.y0,S.w,S.h);ctx.globalAlpha=1;
 ctx.save();ctx.beginPath();ctx.rect(-200,cut,400,300);ctx.clip();ctx.drawImage(S.cv,S.x0,S.y0,S.w,S.h);ctx.restore();
 if(p>.02&&p<.99){ctx.strokeStyle='rgba(255,236,170,.85)';ctx.lineWidth=1.1;ctx.setLineDash([4,3]);ctx.lineDashOffset=-t*8;ctx.beginPath();ctx.moveTo(-34,cut);ctx.lineTo(34,cut);ctx.stroke();ctx.setLineDash([]);}
 scaffold(ctx,S,t,p);}

function ring(ctx,t){
 var pu=.5+.5*Math.sin(t*3);ctx.save();
 ctx.fillStyle='rgba(255,226,120,'+(.1+.06*pu).toFixed(3)+')';ctx.beginPath();ctx.ellipse(0,0,40,20,0,0,TAU);ctx.fill();
 ctx.strokeStyle='rgba(255,214,90,.28)';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,0,40,20,0,0,TAU);ctx.stroke();
 ctx.strokeStyle='#ffd95a';ctx.lineWidth=2.4;ctx.setLineDash([10,6]);ctx.lineDashOffset=-t*18;ctx.beginPath();ctx.ellipse(0,0,40,20,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
 ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=.9;ctx.beginPath();ctx.ellipse(0,0,37,18.5,0,0,TAU);ctx.stroke();ctx.restore();}

function fire(ctx,S,t,d){
 var n=d>.66?3:d>.33?2:1;
 for(var i=0;i<n;i++){var x=-14+i*14+Math.sin(i*5)*3,y=S.top*.35+i*3-4,fl=Math.sin(t*14+i*3)*.5+.5;
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.85;ctx.drawImage(glowTex([255,140,50]),x-13,y-15,26,26);ctx.restore();
  ctx.fillStyle='#ff8a2a';ctx.beginPath();ctx.moveTo(x-4,y+4);ctx.quadraticCurveTo(x-5,y-4,x+Math.sin(t*9+i)*1.5,y-10-fl*4);ctx.quadraticCurveTo(x+5,y-3,x+4,y+4);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffe066';ctx.beginPath();ctx.moveTo(x-2,y+4);ctx.quadraticCurveTo(x-2.5,y-1,x,y-6-fl*2);ctx.quadraticCurveTo(x+2.5,y-1,x+2,y+4);ctx.closePath();ctx.fill();
  for(var k=0;k<2;k++){var p=((t*.6+k*.5+i*.3)%1);ctx.fillStyle='rgba(60,56,64,'+((1-p)*.5).toFixed(2)+')';ctx.beginPath();ctx.arc(x+Math.sin(p*5+k)*3+p*6,y-10-p*22,2+p*5,0,TAU);ctx.fill();}}}

/* ---------- genel API ---------- */
function building(ctx,type,lv,civId,x,y,o){
 o=o||{};if(!FN[type])return null;
 lv=Math.max(1,Math.min(5,lv|0||1));
 var civ=civPal(civId),scl=o.scale||1,t=o.t||0,night=Math.max(0,Math.min(1,o.night||0));
 var m=ctx.getTransform?ctx.getTransform():null,k=m?Math.hypot(m.a,m.b):1;
 var rs=Math.max(.5,Math.min(3,Math.ceil(scl*k*2-.001)/2));
 var nq=night>.75?2:night>.25?1:0,dm=o.damaged||0,dq=dm>.66?3:dm>.33?2:dm>.04?1:0,dir=type==='port'?(o.dir?1:0):0;
 var S=sprite(type,lv,civ,rs,nq,dq,dir);
 ctx.save();ctx.translate(x,y);ctx.scale(scl,scl);
 if(o.selected)ring(ctx,t);
 var pr=o.progress;
 if(pr!=null&&pr<1)construct(ctx,S,pr,t,rs);
 else{ctx.drawImage(S.cv,S.x0,S.y0,S.w,S.h);drawDyn(ctx,S,t,night,o);if(dq>1)fire(ctx,S,t,dm);}
 ctx.restore();
 return{x0:x+(S.left-4)*scl,x1:x+(S.right+4)*scl,y0:y+(S.top-6)*scl,y1:y+20*scl,top:S.top};
}
building.TYPES=TYPES;
building.clear=function(){CACHE.clear();};
building.stats=function(){return{cache:CACHE.size};};
building.measure=function(type,lv,civId,dir){var S=sprite(type,lv,civPal(civId),1,0,0,dir?1:0);return{top:S.top,left:S.left,right:S.right};};
Iso.building=building;
})();
