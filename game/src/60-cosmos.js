/* SpacEgg 2.0 — SG.R: Evren→Galaksi→Sistem→Gezegen kesintisiz ölçekli Canvas 2D çizim motoru (ARCH-2.0 §3.3)
   Tek sürekli yakınlaştırma değişkeni k (piksel / evren birimi). Her nesnenin evren birimi cinsinden gerçek yarıçapı vardır;
   ekranda büyüdükçe üst katman soluyor, alt katman beliriyor. SG.Sp varsa onunla, yoksa yerleşik yedek çizimlerle çalışır. */
(function(){
'use strict';
var SG=window.SG;if(!SG)return;
var TAU=Math.PI*2,abs=Math.abs,sqrt=Math.sqrt,pow=Math.pow,min=Math.min,max=Math.max,floor=Math.floor,cos=Math.cos,sin=Math.sin,log=Math.log,exp=Math.exp;
function cl(v,a,b){return v<a?a:v>b?b:v;}
function sm(x){x=x<0?0:x>1?1:x;return x*x*(3-2*x);}
function hf(s){return(SG.hash(String(s))%100000)/100000;}
function now(){return(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();}
function nm(c,x){return c!=null&&c.toFixed?c:x;}
var CLSC={O:'#8fa8ff',B:'#a8bdff',A:'#d4deff',F:'#fff6e6',G:'#ffe7a3',K:'#ffbd78',M:'#ff8d63'};
var PT={rocky:['#b79a7e','#5a4636','#6f5a48'],ocean:['#4a9be0','#0f3560','#3e8a52'],ice:['#e6f4ff','#7ea7c4','#ffffff'],gas:['#e0b27a','#8a5530','#f3d9a8'],lava:['#f06a32','#2b0e08','#ffd27a'],desert:['#e0b366','#7a5428','#f0d090'],ringed:['#dcc796','#8a7550','#f5e6bd']};
var KIND={g:'galaxy',s:'star',p:'planet',m:'moon'};
var ID_RE=/^(g\d+)(?:s(\d+)(?:p(\d+)(?:m(\d+))?)?)?$/;
function kindOf(id){var m=ID_RE.exec(id||'');if(!m)return null;return m[4]!=null?'m':m[3]!=null?'p':m[2]!=null?'s':'g';}
function parentOf(id){var m=ID_RE.exec(id||'');if(!m)return null;if(m[4]!=null)return m[1]+'s'+m[2]+'p'+m[3];if(m[3]!=null)return m[1]+'s'+m[2];if(m[2]!=null)return m[1];return null;}
function rgb(hex){var n=parseInt(hex.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];}
function SP(){return SG.Sp||null;}
function tierNow(){try{if(SG.P&&SG.P.tier){var t=SG.P.tier();if(t===0||t===1||t===2)return t;}}catch(e){}return-1;}

/* ---------- ortak önbellekli yedek sprite'lar ---------- */
var glowC={},opt0={q:2};
function glowSprite(col){var c=glowC[col];if(c)return c;var s=64,cv=document.createElement('canvas');cv.width=cv.height=s;var g=cv.getContext('2d'),c3=rgb(col);
  var gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.1,'rgba('+c3[0]+','+c3[1]+','+c3[2]+',.9)');gr.addColorStop(.35,'rgba('+c3[0]+','+c3[1]+','+c3[2]+',.28)');gr.addColorStop(1,'rgba('+c3[0]+','+c3[1]+','+c3[2]+',0)');
  g.fillStyle=gr;g.fillRect(0,0,s,s);return glowC[col]=cv;}
function starF(s){var m=s.mass>0?s.mass:1,ph=s.phase;
  if(ph==='giant')return 3.2;if(ph==='dwarf')return .3;if(ph==='neutron')return .16;if(ph==='blackhole')return .3;if(ph==='protostar')return 1.5;
  return cl(pow(m,.55),.45,3.2);}
function starCol(s){var ph=s.phase,c=s.cls||'G';
  if(ph==='giant')return(c==='O'||c==='B'||c==='A'||c==='F')?'#ffd9a8':'#ff7a4d';if(ph==='dwarf')return'#dfe9ff';if(ph==='neutron')return'#bfeaff';
  if(ph==='blackhole')return'#ff9a40';if(ph==='protostar')return'#ff9f7a';return CLSC[c]||'#fff2d0';}
function orbitF(a,i,n){var lt=log(1+2*cl(a>0?a:1,.02,300))/log(601);return .35*(.14+.86*lt)+.65*(.15+.85*(i+.5)/n);}

/* ---------- arka plan (yıldız karoları + bulutsu), kaliteye göre önbellekli ---------- */
var bgC={};
function bgPack(q,seed){var key=q+':'+seed,o=bgC[key];if(o)return o;o={};var N=[110,200,320][q],T=512;
  function tile(n,big,sd){var cv=document.createElement('canvas');cv.width=cv.height=T;var g=cv.getContext('2d'),r=SG.rng('bg'+sd+key);
    for(var i=0;i<n;i++){var x=r()*T,y=r()*T,b=r(),sz=big?(.7+b*1.3):(.4+b*.7),t=r(),col=t<.12?'#ffd9b0':t<.3?'#bcd0ff':'#ffffff';g.globalAlpha=(big?.55:.3)+b*.45;g.fillStyle=col;
      if(sz>1.1){g.beginPath();g.arc(x,y,sz,0,TAU);g.fill();}else g.fillRect(x,y,sz*1.4,sz*1.4);}
    return cv;}
  var ctx0=document.createElement('canvas').getContext('2d');
  o.a=ctx0.createPattern(tile(N*2,false,1),'repeat');o.b=ctx0.createPattern(tile(floor(N/3),true,2),'repeat');
  var ne=document.createElement('canvas');ne.width=ne.height=[96,160,256][q];var g=ne.getContext('2d'),r=SG.rng('neb'+seed),S=ne.width;
  for(var i=0;i<7;i++){var x=r()*S,y=r()*S,rad=S*(.22+r()*.35),h=(r()<.5?215:285)+r()*50,gr=g.createRadialGradient(x,y,0,x,y,rad);
    gr.addColorStop(0,'hsla('+h+',70%,45%,.20)');gr.addColorStop(1,'hsla('+h+',70%,30%,0)');g.fillStyle=gr;g.fillRect(0,0,S,S);}
  o.neb=ne;return bgC[key]=o;}

/* ---------- gezegen/uydu yedek çizimi ---------- */
function ringArc(c,x,y,r,front,tilt){c.save();c.translate(x,y);c.rotate(tilt);c.scale(1,.3);
  c.lineCap='butt';var ws=[.34,.2,.08],cs=['rgba(225,205,160,.55)','rgba(180,155,110,.5)','rgba(240,225,190,.55)'],rr=[1.85,2.25,2.6];
  for(var i=0;i<3;i++){c.strokeStyle=cs[i];c.lineWidth=r*ws[i];c.beginPath();c.arc(0,0,r*rr[i]*.82,front?0:Math.PI,front?Math.PI:TAU);c.stroke();}
  c.restore();}
function planetFB(c,p,pe,x,y,r,lx,ly,t,q){
  var pal=PT[p.type]||PT.rocky,ring=p.type==='ringed',gas=ring||p.type==='gas',atm=nm(p.atm,.5);
  if(ring)ringArc(c,x,y,r,false,-.35);
  if(r>6&&atm>.12){var ag=c.createRadialGradient(x,y,r*.94,x,y,r*1.3);ag.addColorStop(0,'rgba(140,190,255,'+(.14+.3*cl(atm,0,1)).toFixed(2)+')');ag.addColorStop(1,'rgba(140,190,255,0)');c.fillStyle=ag;c.beginPath();c.arc(x,y,r*1.3,0,TAU);c.fill();}
  c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();
  var g=c.createRadialGradient(x+lx*r*.4,y+ly*r*.4,r*.05,x,y,r*1.08);g.addColorStop(0,pal[0]);g.addColorStop(.7,pal[0]);g.addColorStop(1,pal[1]);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  if(r>7){var f=pe.feat;
    if(gas){c.save();c.translate(x,y);c.rotate(f[0]*.5-.25);var nb=9,bh=2*r/nb;
      for(var b=0;b<nb;b++){c.globalAlpha=.12+.22*f[1+b];c.fillStyle=(b&1)?pal[1]:pal[2];c.fillRect(-r,-r+b*bh+bh*.1,2*r,bh*.8);}
      c.globalAlpha=.35;c.fillStyle=pal[1];var sx=cos(t*.04+f[10]*6)*r*.5;c.beginPath();c.ellipse(sx,r*(f[11]-.5)*.9,r*.22,r*.1,0,0,TAU);c.fill();c.restore();c.globalAlpha=1;}
    else{var nbl=p.type==='ice'?4:8,lon0=t*.05;c.fillStyle=pal[2];
      for(var i=0;i<nbl;i++){var lon=f[i*3]*TAU+lon0,lat=(f[i*3+1]-.5)*2.2,cs=cos(lon);if(cs<.05)continue;var px=x+sin(lon)*cos(lat)*r,py=y+sin(lat)*r,sz=r*(.12+f[i*3+2]*.28);
        c.globalAlpha=(p.type==='lava'?.85:.8)*cs;c.beginPath();c.ellipse(px,py,sz*cs,sz,0,0,TAU);c.fill();}
      if(p.type==='ice'||p.type==='ocean'){c.globalAlpha=.75;c.fillStyle='#fff';c.beginPath();c.ellipse(x,y-r*.95,r*.55,r*.22,0,0,TAU);c.fill();c.beginPath();c.ellipse(x,y+r*.95,r*.5,r*.2,0,0,TAU);c.fill();}
      if(p.type==='lava'){c.globalCompositeOperation='lighter';c.globalAlpha=.5;c.strokeStyle='#ff9a40';c.lineWidth=max(1,r*.025);for(var j=0;j<4;j++){var a0=f[12+j]*TAU+t*.04;c.beginPath();c.arc(x+cos(a0)*r*.3,y+sin(a0)*r*.3,r*(.3+f[16+j]*.4),a0,a0+1.2);c.stroke();}c.globalCompositeOperation='source-over';}
      c.globalAlpha=1;
      if(q>=1&&r>30&&atm>.35&&p.type!=='lava'){c.fillStyle='#fff';var lc=t*.09;for(var m=0;m<6;m++){var ln=f[m*3+1]*TAU+lc,la=(f[m*3+2]-.5)*1.9,cc=cos(ln);if(cc<.05)continue;c.globalAlpha=.22*cc;c.beginPath();c.ellipse(x+sin(ln)*cos(la)*r,y+sin(la)*r,r*.3*cc,r*.06,0,0,TAU);c.fill();}c.globalAlpha=1;}}
  }
  var sg=c.createLinearGradient(x+lx*r,y+ly*r,x-lx*r*.8,y-ly*r*.8);sg.addColorStop(0,'rgba(0,0,12,0)');sg.addColorStop(.42,'rgba(0,0,12,0)');sg.addColorStop(1,'rgba(0,0,12,.88)');c.fillStyle=sg;c.fillRect(x-r,y-r,r*2,r*2);
  c.restore();
  if(ring)ringArc(c,x,y,r,true,-.35);}
function moonFB(c,x,y,r,lx,ly){c.save();c.beginPath();c.arc(x,y,r,0,TAU);c.clip();var g=c.createRadialGradient(x+lx*r*.4,y+ly*r*.4,r*.05,x,y,r*1.05);g.addColorStop(0,'#c9c6c0');g.addColorStop(1,'#5b5852');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  if(r>9){c.fillStyle='rgba(60,58,54,.45)';c.beginPath();c.arc(x-r*.3,y+r*.2,r*.18,0,TAU);c.arc(x+r*.35,y-r*.3,r*.12,0,TAU);c.fill();}
  var sg=c.createLinearGradient(x+lx*r,y+ly*r,x-lx*r*.8,y-ly*r*.8);sg.addColorStop(0,'rgba(0,0,12,0)');sg.addColorStop(.42,'rgba(0,0,12,0)');sg.addColorStop(1,'rgba(0,0,12,.9)');c.fillStyle=sg;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
function starBody(c,x,y,r,col,ph,t,q,so){
  if(so&&r>=10){var sp=SP();if(sp&&sp.star){try{opt0.q=q;sp.star(c,so,x,y,r,t,opt0);return;}catch(e){SG.log.err('Sp.star',e);sp.star=null;}}}
  if(ph==='blackhole'){c.fillStyle='#000';c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.save();c.globalCompositeOperation='lighter';c.strokeStyle=col;c.globalAlpha=.8;c.lineWidth=max(1,r*.5);c.beginPath();c.ellipse(x,y,r*2.1,r*.7,-.4,0,TAU);c.stroke();c.restore();return;}
  c.save();c.globalCompositeOperation='lighter';var gs=glowSprite(col),gr=r*(q>=2?4.4:3.4);c.drawImage(gs,x-gr,y-gr,gr*2,gr*2);c.restore();
  var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.55,col);g.addColorStop(1,col);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}

/* ---------- galaksi yoğunluk sprite'ı (yedek): gerçek yıldız konumlarından çizilir → iç görünümle hizalı ---------- */
function buildGalSprite(gm,ge,q){var S=[128,200,300][q],cv=document.createElement('canvas');cv.width=cv.height=S;var g=cv.getContext('2d'),r=SG.rng('gs'+gm.id),hue=gm.hue||220,h2=S/2;
  g.globalCompositeOperation='lighter';
  var bg=g.createRadialGradient(h2,h2,0,h2,h2,h2*.5);bg.addColorStop(0,'rgba(255,236,200,.55)');bg.addColorStop(.35,'rgba(255,214,160,.16)');bg.addColorStop(1,'rgba(255,214,160,0)');g.fillStyle=bg;g.fillRect(0,0,S,S);
  var st=ge.d.stars,n=st.length,u=S/2.3;
  for(var i=0;i<n;i++){var s=st[i],px=h2+s.x*u,py=h2+s.y*u,col=CLSC[s.cls]||'#fff';
    g.globalAlpha=.8;g.fillStyle=col;g.fillRect(px-.6,py-.6,1.4,1.4);
    for(var j=0;j<4;j++){g.globalAlpha=.3;g.fillRect(px+(r()-.5)*S*.05,py+(r()-.5)*S*.05,1.1,1.1);}
    if(i%5===0){var hg=g.createRadialGradient(px,py,0,px,py,S*.06);hg.addColorStop(0,'hsla('+hue+',80%,62%,.16)');hg.addColorStop(1,'hsla('+hue+',80%,50%,0)');g.globalAlpha=1;g.fillStyle=hg;g.fillRect(px-S*.06,py-S*.06,S*.12,S*.12);}}
  return cv;}
var blobC={};
function blob(hue){var k=floor(hue/12),c=blobC[k];if(c)return c;var S=64;c=document.createElement('canvas');c.width=c.height=S;var g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,235,205,.9)');gr.addColorStop(.3,'hsla('+hue+',70%,70%,.35)');gr.addColorStop(1,'hsla('+hue+',70%,50%,0)');g.fillStyle=gr;g.fillRect(0,0,S,S);return blobC[k]=c;}

/* =============================== ÖRNEK ================================ */
function create(canvas,o){
  o=o||{};
  var ctx=canvas.getContext('2d',{alpha:false})||canvas.getContext('2d');
  var uni=null,gmap={},webEdges=[],selected=null,follow=null,hoverId=null;
  var insT=0,insB=0;
  var W=300,H=300,dpr=1,cx=0,cy=0,k=200,anim=null,kT=0,zaX=0,zaY=0,vx=0,vy=0,paused=false,dead=false,tVis=0,acc=0;
  var tierForced=null,localTier=2,lastTier=-9,rmForced=null,lbScale=1,lastScale='universe',loopName='R'+(++SG.R._n);
  var gc={},sc={},keys={},ptrs={},nPtr=0,dragging=false,downT=0,lastTapT=0,lastTapX=0,lastTapY=0,pinchD=0,fpsAcc=0,fpsN=0,fpsLow=0,fpsT=0,msE=0,fpsV=60,listeners=[];
  var PKN=1600,pkId=new Array(PKN),pkK=new Array(PKN),pkX=new Float32Array(PKN),pkY=new Float32Array(PKN),pkR=new Float32Array(PKN),pkN=0;
  var LBN=64,lbT=new Array(LBN),lbX=new Float32Array(LBN),lbY=new Float32Array(LBN),lbA=new Float32Array(LBN),lbS=new Float32Array(LBN),lbP=new Uint8Array(LBN),lbN=0,rcX=new Float32Array(LBN),rcY=new Float32Array(LBN),rcW=new Float32Array(LBN),rcH=new Float32Array(LBN),rcN=0;
  var selOn=false,selX=0,selY=0,selR=0;
  var vW=0,vH=0,vcx=0,vcy=0,vk=1,vq=2,vphoto=false,vrm=false,vt=0,vc=ctx;
  var gBest=null,gBestR=0,sysBestE=null,sysBestI=-1,sysBestPx=0,sysBestD=1e9,plBest=null,plBestR=0,plBestD=1e9,plBestPrU=0,ctxStarId=null,ctxGalId=null,sysCount=0,genBudget=0;
  var nearIdx=new Int16Array(8),nearD=new Float32Array(8),nearN=0,sysQ=new Int16Array(6),sysQg=new Array(6),sysQn=0;
  var TG={x:0,y:0,k:1,kind:'g'};
  var opt={q:2,light:{x:1,y:0},climate:null};

  function rm(){return rmForced!==null?rmForced:!!SG.RM;}
  function tier(){if(tierForced!==null)return tierForced;var t=tierNow();return t>=0?t:localTier;}
  function mn(){return min(W,H);}
  function kmin(){return mn()/2.6;}
  function kmax(){var c=4e7;if(plBest&&plBestPrU>0&&plBestD<3*plBestR){c=min(c,1.6*max(W,H)/plBestPrU);}return max(c,kmin()*1.5);}
  function clampK(v){return cl(v,kmin(),kmax());}

  /* ---- veri erişimi (önbellekli) ---- */
  function gal(gm){var e=gc[gm.id],t=now();
    if(e&&e.d&&t-e.t<e.ref)return e;
    if(!e)e=gc[gm.id]={gm:gm,d:null,t:0,ref:6000,xs:null,ys:null,sr:null,col:null,sz:null,idx:{},sprite:null,spriteQ:-1,sysU:gm.r*.004};
    if(!e.d&&t-e.t<1500&&e.t)return e;
    var t0=now(),d=null;try{d=SG.U.galaxy(uni,gm.id);}catch(x){SG.log.err('R.galaxy',x);}
    var dur=now()-t0;if(dur>12)e.ref=60000;e.t=t;
    if(d&&d.stars){e.d=d;var n=d.stars.length;if(!e.xs||e.xs.length!==n){e.xs=new Float64Array(n);e.ys=new Float64Array(n);e.sr=new Float32Array(n);e.sz=new Float32Array(n);e.col=new Array(n);e.idx={};e.tx=new Float32Array(n);e.ty=new Float32Array(n);e.tr=new Float32Array(n);e.tf=new Uint8Array(n);e.ci=new Uint8Array(n);e.pal=[];}
      e.pal.length=0;
      for(var i=0;i<n;i++){var s=d.stars[i],f=starF(s);e.xs[i]=gm.x+s.x*gm.r;e.ys[i]=gm.y+s.y*gm.r;e.sz[i]=f;e.sr[i]=e.sysU*.045*min(f,2.6);e.col[i]=starCol(s);var pc=e.pal.indexOf(e.col[i]);if(pc<0){pc=e.pal.length;e.pal.push(e.col[i]);}e.ci[i]=pc;e.idx[s.id]=i;}}
    return e;}
  function sysOf(ge,i){var s=ge.d.stars[i],e=sc[s.id],t=now();
    if(e&&e.d&&t-e.t<e.ref)return e;
    if(e&&!e.d&&t-e.t<2000)return e;
    if(!e){if(genBudget<=0)return null;genBudget--;e=sc[s.id]={d:null,t:0,ref:6000,pl:[],star:s};}
    var t0=now(),d=null;try{d=SG.U.system(uni,s.id);}catch(x){SG.log.err('R.system',x);}
    var dur=now()-t0;if(dur>12)e.ref=60000;e.t=t;
    if(d&&d.planets){e.d=d;var ps=d.planets,n=ps.length,order=ps.slice().sort(function(a,b){return a.a-b.a;});
      var pl=[];for(var j=0;j<n;j++){var p=ps[j],rank=order.indexOf(p),f=new Float32Array(24),rr=SG.rng('pf'+p.id);for(var q=0;q<24;q++)f[q]=rr();
        var ms=p.moons||[],mo=[];for(var m=0;m<ms.length;m++){var mm=ms[m];mo.push({m:mm,rat:cl((mm.radius>0?mm.radius:.1)/max(p.radius>0?p.radius:1,.1),.08,.45),ph:hf(mm.id)*TAU,w:1.1/(1+.9*m),oi:2.4+1.1*m});}
        pl.push({p:p,orf:orbitF(p.a,rank,n),prf:.028*(.55+.45*sqrt(max(p.radius>0?p.radius:1,.1))),ph:hf(p.id)*TAU,w:min(.9,.12/pow(max(p.a>0?p.a:1,.1),1.5)),feat:f,moons:mo,sx:0,sy:0,spx:0});}
      e.pl=pl;e.star=d.star||s;}
    return e;}
  function orbAng(pe,t){var p=pe.p;if(SG.U&&SG.U.orbitPos){try{var a=SG.U.orbitPos(p,t);if(a&&isFinite(a.angle))return a.angle;}catch(x){}}return pe.ph+t*pe.w;}

  /* ---- hedef çözümleme (focus/follow) ---- */
  var PW=[0,0,0];
  function plWorld(ge,i,pe,t){var a=orbAng(pe,t),R=ge.sysU*pe.orf;PW[0]=ge.xs[i]+cos(a)*R;PW[1]=ge.ys[i]+sin(a)*R;PW[2]=a;return PW;}
  function resolve(id,full){
    var kd=kindOf(id);if(!kd||!uni)return null;var m=ID_RE.exec(id),gm=gmap[m[1]];if(!gm)return null;
    TG.kind=kd;var mw=mn();
    if(kd==='g'){TG.x=gm.x;TG.y=gm.y;TG.k=.42*mw/gm.r;return TG;}
    var ge=gal(gm);if(!ge||!ge.d)return null;var sid=m[1]+'s'+m[2],si=ge.idx[sid];if(si==null)return null;
    if(kd==='s'){TG.x=ge.xs[si];TG.y=ge.ys[si];TG.k=.4*mw/ge.sysU;return TG;}
    genBudget=3;var se=sysOf(ge,si);if(!se||!se.d)return null;var pid=sid+'p'+m[3],pe=null,pi=-1;
    for(var i=0;i<se.pl.length;i++)if(se.pl[i].p.id===pid){pe=se.pl[i];pi=i;break;}
    if(!pe)return null;var w=plWorld(ge,si,pe,tVis),pr=ge.sysU*pe.prf,nm2=pe.moons.length;
    if(kd==='p'){TG.x=w[0];TG.y=w[1];var pxr=cl(.5/(2.8+1.1*max(0,nm2-1)),.1,.3);if(!nm2)pxr=.3;TG.k=pxr*mw/pr;return TG;}
    var me=null;for(var j=0;j<pe.moons.length;j++)if(pe.moons[j].m.id===id){me=pe.moons[j];break;}
    if(!me)return null;var ma=me.ph+tVis*me.w,mr=pr*me.oi;TG.x=w[0]+cos(ma)*mr;TG.y=w[1]+sin(ma)*mr;TG.k=.16*mw/(pr*me.rat);return TG;}

  /* ---- boyut / kalite ---- */
  function resize(){var rc=canvas.getBoundingClientRect(),w=rc.width||canvas.clientWidth||(canvas.parentNode&&canvas.parentNode.clientWidth)||300,h=rc.height||canvas.clientHeight||(canvas.parentNode&&canvas.parentNode.clientHeight)||300;
    var t=tier(),cap=[1.25,1.75,2.5][t],d=min(window.devicePixelRatio||1,cap);W=max(40,w);H=max(40,h);dpr=d;
    var pw=floor(W*d),ph=floor(H*d);if(canvas.width!==pw)canvas.width=pw;if(canvas.height!==ph)canvas.height=ph;lastTier=t;
    if(!uni){cx=0;cy=0;k=kmin();}else if(k<kmin())k=kmin();}

  /* ---- görünüm sürücüleri ---- */
  function zoomAbout(kn,ax,ay){cx+=(ax-W/2)*(1/k-1/kn);cy+=(ay-H/2)*(1/k-1/kn);k=kn;}
  function setAnim(id,home){
    var r=home?null:resolve(id);if(!home&&!r)return false;
    var k1=home?kmin():r.k;var dur=rm()?.12:cl(.9+.34*abs(log(k1/k)/Math.LN10),.9,3.4);
    anim={id:id,home:!!home,x0:cx,y0:cy,k0:k,t:0,dur:dur};kT=0;vx=vy=0;return true;}
  function stepAnim(dt){var a=anim;a.t+=dt;var u=min(1,a.t/a.dur),e=u<.5?4*u*u*u:1-pow(-2*u+2,3)/2,tx,ty,tk;
    if(a.home){tx=0;ty=0;tk=kmin();}else{var r=resolve(a.id);if(!r){anim=null;return;}tx=r.x;ty=r.y;tk=r.k;}
    var kk=a.k0*pow(tk/a.k0,e),s;if(abs(1/tk-1/a.k0)>1e-12&&abs(log(tk/a.k0))>.05)s=(1/kk-1/a.k0)/(1/tk-1/a.k0);else s=e;
    s=cl(s,0,1);cx=a.x0+(tx-a.x0)*s;cy=a.y0+(ty-a.y0)*s;k=kk;
    if(u>=1){cx=tx;cy=ty;k=tk;anim=null;var kd=a.home?null:kindOf(a.id);follow=(kd==='p'||kd==='m')?a.id:null;}}
  function update(dt){
    if(anim){stepAnim(dt);}
    else{
      var sp=420*dt;
      if(keys.ArrowLeft||keys.a)pan(sp,0);if(keys.ArrowRight||keys.d)pan(-sp,0);if(keys.ArrowUp||keys.w)pan(0,sp);if(keys.ArrowDown||keys.s)pan(0,-sp);
      if(keys['+']||keys['=']){kT=clampK((kT>0?kT:k)*pow(2,1.6*dt));zaX=W/2;zaY=H/2;}
      if(keys['-']||keys._){kT=clampK((kT>0?kT:k)*pow(2,-1.6*dt));zaX=W/2;zaY=H/2;}
      if(!nPtr&&(vx||vy)){if(!follow){cx-=vx*dt/k;cy-=vy*dt/k;}var dec=exp(-dt*4.5);vx*=dec;vy*=dec;if(abs(vx)+abs(vy)<2)vx=vy=0;}
      if(kT>0){var kn=k*pow(kT/k,rm()?1:1-exp(-dt*11));if(abs(log(kT/k))<.003)kn=kT;zoomAbout(kn,follow?W/2:zaX,follow?H/2:zaY);if(kn===kT)kT=0;}
      if(follow&&!dragging){var r=resolve(follow);if(r){cx=r.x;cy=r.y;}}
    }
    var kc=kmax();if(k>kc)k=kc;if(k<kmin())k=kmin();cx=cl(cx,-1.6,1.6);cy=cl(cy,-1.6,1.6);}
  function pan(dx,dy){follow=null;cx-=dx/k;cy-=dy/k;}

  /* ---- yardımcılar: seçim/etiket ---- */
  function addPick(id,kd,x,y,r){if(vphoto||pkN>=PKN)return;pkId[pkN]=id;pkK[pkN]=kd;pkX[pkN]=x;pkY[pkN]=y;pkR[pkN]=r;pkN++;if(id===selected){selOn=true;selX=x;selY=y;selR=r;}}
  function addLabel(t,x,y,a,sz,prio){if(vphoto||lbN>=LBN||a<.02)return;lbT[lbN]=t;lbX[lbN]=x;lbY[lbN]=y;lbA[lbN]=a;lbS[lbN]=sz||12;lbP[lbN]=prio?1:0;lbN++;}
  function selectId(id,notify){selected=id;if(notify&&o.onSelect){try{o.onSelect(id,id?kindOf(id):null);}catch(e){SG.log.err('R.onSelect',e);}}}

  /* ======================== ÇİZİM ======================== */
  function draw(c,Wv,Hv,ccx,ccy,kk,photo,q,t){
    vc=c;vW=Wv;vH=Hv;vcx=ccx;vcy=ccy;vk=kk;vq=q;vphoto=photo;vt=t;vrm=rm();
    var mnn=min(Wv,Hv),zl=log(kk/(mnn/2.6))/Math.LN10;
    sysQn=0;if(!photo){pkN=0;lbN=0;selOn=false;gBest=null;gBestR=0;sysBestE=null;sysBestI=-1;sysBestPx=0;sysBestD=1e9;plBest=null;plBestD=1e9;sysCount=0;genBudget=2;}
    c.setTransform(photo?1:dpr,0,0,photo?1:dpr,0,0);
    c.globalAlpha=1;c.globalCompositeOperation='source-over';
    drawBg(c,Wv,Hv,ccx,ccy,zl,q);
    if(!uni)return;
    var gs=uni.galaxies,n=gs.length,i,mw=Math.max(Wv,Hv);
    /* kozmik ağ */
    var maxR=0;for(i=0;i<n;i++)maxR=max(maxR,gs[i].r*kk);
    var wa=1-sm((maxR-30)/70);
    if(wa>.01&&q>=1){c.strokeStyle='#7a96ff';c.lineWidth=1;c.globalAlpha=.07*wa;c.beginPath();
      for(i=0;i<webEdges.length;i+=2){var a=gs[webEdges[i]],b=gs[webEdges[i+1]];c.moveTo((a.x-ccx)*kk+Wv/2,(a.y-ccy)*kk+Hv/2);c.lineTo((b.x-ccx)*kk+Wv/2,(b.y-ccy)*kk+Hv/2);}c.stroke();c.globalAlpha=1;}
    /* galaksiler */
    for(i=0;i<n;i++){var gm=gs[i],gx=(gm.x-ccx)*kk+Wv/2,gy=(gm.y-ccy)*kk+Hv/2,R=gm.r*kk;
      if(gx+R*1.3<0||gx-R*1.3>Wv||gy+R*1.3<0||gy-R*1.3>Hv)continue;
      var u=sm((R-40)/100);
      if(!photo){var dc=sqrt((gx-Wv/2)*(gx-Wv/2)+(gy-Hv/2)*(gy-Hv/2));if(dc<R*1.05&&(!gBest||R>gBestR)){gBest=gm;gBestR=R;}}
      if(u<.995)drawGalSprite(c,gm,gx,gy,R,u,q,t);
      if(u>.01)drawGalInterior(c,gm,gx,gy,R,u,q,t,mw);
      if(!photo){if(u<.5)addPick(gm.id,'g',gx,gy,max(R*.9,6));
        if(selected===gm.id&&u>=.5){selOn=true;selX=gx;selY=gy;selR=min(R*1.04,mw*3);}
        var la=sm((R-5)/25)*(1-sm((R-120)/140));if(la>.02)addLabel(gm.name,gx,gy+R*.78+12,la,12,selected===gm.id);}
    }
    c.globalAlpha=1;
    /* yıldız sistemleri (en üstte) */
    for(var s=0;s<sysQn;s++)drawSystem(c,sysQg[s],sysQ[s],q,t,Wv,Hv);
    c.globalAlpha=1;c.globalCompositeOperation='source-over';
  }
  var bgCv=null,bgCx=null,bgOx=1e9,bgOy=1e9,bgZ=1e9,bgQ=-1,bgW=0,bgH=0,bgD=0;
  function drawBg(c,Wv,Hv,ccx,ccy,zl,q){
    var bp=bgPack(q,uni?uni.seed:'x'),ox=-ccx*90,oy=-ccy*90;
    if(vphoto){paintBg(c,Wv,Hv,ox,oy,zl,q,bp);return;}
    var pw=floor(Wv*dpr),ph=floor(Hv*dpr),zq=floor(zl*40);
    if(!bgCv||bgCv.width!==pw||bgCv.height!==ph){bgCv=document.createElement('canvas');bgCv.width=pw;bgCv.height=ph;bgCx=bgCv.getContext('2d',{alpha:false});bgOx=1e9;}
    if(abs(ox-bgOx)>.4||abs(oy-bgOy)>.4||zq!==bgZ||q!==bgQ||Wv!==bgW||Hv!==bgH||dpr!==bgD){
      bgOx=ox;bgOy=oy;bgZ=zq;bgQ=q;bgW=Wv;bgH=Hv;bgD=dpr;bgCx.setTransform(dpr,0,0,dpr,0,0);paintBg(bgCx,Wv,Hv,ox,oy,zl,q,bp);}
    c.globalAlpha=1;c.drawImage(bgCv,0,0,Wv,Hv);}
  function paintBg(c,Wv,Hv,ox,oy,zl,q,bp){
    c.globalAlpha=1;c.globalCompositeOperation='source-over';c.fillStyle='#03040b';c.fillRect(0,0,Wv,Hv);
    var fade=1-.55*sm(zl/4),na=.6*(1-sm(zl/3.2)),ns=max(Wv,Hv)*1.5*(1+.07*max(0,zl));
    if(na>.02){c.globalAlpha=na;c.drawImage(bp.neb,Wv/2-ns/2+ox*.15,Hv/2-ns/2+oy*.15,ns,ns);}
    var t1x=((ox*.5)%512+512)%512,t1y=((oy*.5)%512+512)%512,t2x=(ox%512+512)%512,t2y=(oy%512+512)%512;
    c.globalAlpha=fade;c.save();c.translate(t1x,t1y);c.fillStyle=bp.a;c.fillRect(-t1x,-t1y,Wv,Hv);c.restore();
    if(q>=1||fade>.7){c.save();c.translate(t2x,t2y);c.fillStyle=bp.b;c.fillRect(-t2x,-t2y,Wv,Hv);c.restore();}
    c.globalAlpha=1;}
  function drawGalSprite(c,gm,gx,gy,R,u,q,t){
    var a=1-u,sp=SP();
    if(sp&&sp.galaxy){try{c.globalAlpha=a;sp.galaxy(c,gm,gx,gy,max(R,2),vrm?0:t,{q:q});c.globalAlpha=1;
        if(selected===gm.id&&!vphoto){}return;}catch(e){SG.log.err('Sp.galaxy',e);sp.galaxy=null;}}
    var tilt=.45+.5*hf(gm.id),ti=tilt+(1-tilt)*u,rot=(gm.rot||0)*(1-u)+(vrm?0:t*.015*(1-u));
    var ge=gc[gm.id],spr=null;
    if(ge&&ge.d){if(ge.sprite&&ge.spriteQ===q)spr=ge.sprite;else if(vphoto||genBudget>0){if(!vphoto)genBudget--;ge.sprite=buildGalSprite(gm,ge,q);ge.spriteQ=q;spr=ge.sprite;}}
    else if(!vphoto&&uni&&genBudget>0&&R>3){genBudget--;gal(gm);}
    c.save();c.translate(gx,gy);c.rotate(rot);c.scale(1,ti);c.globalCompositeOperation='lighter';
    if(R<3){c.globalAlpha=a;var bl=blob(gm.hue||220),bs=max(R*2.6,7);c.drawImage(bl,-bs/2,-bs/2,bs,bs);}
    else if(spr){c.globalAlpha=a;var d=R*2.3;c.drawImage(spr,-d/2,-d/2,d,d);}
    else{c.globalAlpha=a*.8;var bl2=blob(gm.hue||220),d2=R*2.4;c.drawImage(bl2,-d2/2,-d2/2,d2,d2);}
    c.restore();c.globalAlpha=1;}
  function drawGalInterior(c,gm,gx,gy,R,u,q,t,mw){
    var ge=gal(gm);if(!ge||!ge.d)return;var xs=ge.xs,ys=ge.ys,sz=ge.sz,sr=ge.sr,st=ge.d.stars,n=st.length,W2=vW/2,H2=vH/2,i,tx=ge.tx,ty=ge.ty,tr=ge.tr,tf=ge.tf,ci=ge.ci;
    if(q>=1&&R<1400){var ha=.22*u*(1-sm((R-250)/700));if(ha>.01&&ge.sprite&&ge.spriteQ===q){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=ha;var d=R*2.3;c.drawImage(ge.sprite,gx-d/2,gy-d/2,d,d);c.restore();}}
    var sysPx=ge.sysU*vk,dm=(sysPx>45);nearN=0;var any=false;
    for(i=0;i<n;i++){
      var px=(xs[i]-vcx)*vk+W2,py=(ys[i]-vcy)*vk+H2;tf[i]=0;
      if(px<-60||px>vW+60||py<-60||py>vH+60){if(!dm||px<-sysPx*1.4||px>vW+sysPx*1.4||py<-sysPx*1.4||py>vH+sysPx*1.4)continue;}
      if(dm&&sysQn<6){var inV=px>-sysPx*1.15&&px<vW+sysPx*1.15&&py>-sysPx*1.15&&py<vH+sysPx*1.15;
        if(inV){sysQ[sysQn]=i;sysQg[sysQn]=ge;sysQn++;
          if(!vphoto){var dd=sqrt((px-W2)*(px-W2)+(py-H2)*(py-H2));if(dd<sysBestD){sysBestD=dd;sysBestE=ge;sysBestI=i;sysBestPx=sysPx;}}
          continue;}}
      var rr=sr[i]*vk,dotR=.6+.55*sqrt(sz[i]);if(rr>dotR)dotR=rr;
      tx[i]=px;ty[i]=py;tr[i]=dotR;tf[i]=dotR>=6?2:1;any=true;
      if(!vphoto){if(u>.3)addPick(st[i].id,'s',px,py,dotR);
        var d2=(px-W2)*(px-W2)+(py-H2)*(py-H2);if(d2<26000&&u>.6&&sysPx<45){var jj=nearN;if(nearN<8)nearN++;else if(d2>=nearD[7])continue;else jj=7;
          while(jj>0&&nearD[jj-1]>d2){nearD[jj]=nearD[jj-1];nearIdx[jj]=nearIdx[jj-1];jj--;}nearD[jj]=d2;nearIdx[jj]=i;}}
    }
    if(any){
      c.globalCompositeOperation='lighter';
      if(q>=1){c.globalAlpha=u*.5;var thr=q>=2?1.3:1.9,gk=q>=2?3.6:3;
        for(i=0;i<n;i++){if(tf[i]!==1||tr[i]<thr)continue;var g2=tr[i]*gk;c.drawImage(glowSprite(ge.pal[ci[i]]),tx[i]-g2,ty[i]-g2,g2*2,g2*2);}}
      c.globalAlpha=u;
      for(var pi=0;pi<ge.pal.length;pi++){c.fillStyle=ge.pal[pi];var arcs=false;
        for(i=0;i<n;i++){if(tf[i]!==1||ci[i]!==pi)continue;var dr=tr[i];
          if(dr>1.7){if(!arcs){c.beginPath();arcs=true;}var ra=dr*.75;c.moveTo(tx[i]+ra,ty[i]);c.arc(tx[i],ty[i],ra,0,TAU);}else c.fillRect(tx[i]-dr*.5,ty[i]-dr*.5,dr,dr);}
        if(arcs)c.fill();}
      c.globalCompositeOperation='source-over';
      for(i=0;i<n;i++){if(tf[i]!==2)continue;starBody(c,tx[i],ty[i],tr[i],ge.pal[ci[i]],st[i].phase,t,q,st[i]);}
    }
    c.globalCompositeOperation='source-over';c.globalAlpha=1;
    if(!vphoto&&u>.6&&sysPx<45){var lim=min(nearN,R>400?6:3);for(i=0;i<lim;i++){var ii=nearIdx[i];addLabel(st[ii].name,(xs[ii]-vcx)*vk+W2,(ys[ii]-vcy)*vk+H2+sz[ii]*3+11,u*(.9-.08*i),11,st[ii].id===selected);}}
  }
  function drawSystem(c,ge,i,q,t,Wv,Hv){
    var se=sysOf(ge,i),s=ge.d.stars[i],sysU=ge.sysU,sysPx=sysU*vk,sx=(ge.xs[i]-vcx)*vk+Wv/2,sy=(ge.ys[i]-vcy)*vk+Hv/2,aS=sm((sysPx-45)/90),col=ge.col[i];
    var srPx=max(sysU*.045*min(ge.sz[i],2.6)*vk,.6+.55*sqrt(ge.sz[i]));
    if(!se||!se.d){c.globalAlpha=1;starBody(c,sx,sy,max(srPx,1.5),col,s.phase,t,q);return;}
    sysCount++;var pl=se.pl,np=pl.length,j,m;
    /* yaşanabilir kuşak (basit model) */
    if(q>=1&&aS>.3){var lum=s.lum>0?s.lum:pow(max(s.mass,.1),3.3),ai=sqrt(lum/1.1),ao=sqrt(lum/.53),ri=sysPx*orbitF(ai,0,1)*.9,ro=sysPx*orbitF(ao,0,1)*1.1;
      if(ro<Wv*5&&ro>ri){c.globalAlpha=.06*aS;c.fillStyle='#50e090';c.beginPath();c.arc(sx,sy,ro,0,TAU);c.arc(sx,sy,ri,0,TAU,true);c.fill();}}
    c.globalAlpha=1;
    /* yörüngeler */
    c.lineWidth=1;
    for(j=0;j<np;j++){var pe=pl[j],orr=sysPx*pe.orf;if(orr>Wv*6)continue;c.globalAlpha=(pe.p.id===selected?.5:.16)*aS;c.strokeStyle=pe.p.id===selected?'#8fd0ff':'#a8bfff';c.beginPath();c.arc(sx,sy,orr,0,TAU);c.stroke();}
    c.globalAlpha=1;
    /* yıldız */
    starBody(c,sx,sy,srPx,col,s.phase,vrm?0:t,q,s);
    if(!vphoto){addPick(s.id,'s',sx,sy,srPx);if(aS>.5)addLabel(s.name,sx,sy+srPx*1.6+12,aS,12,s.id===selected);}
    /* gezegenler */
    for(j=0;j<np;j++){var pe2=pl[j],p=pe2.p,ang=orbAng(pe2,vrm?0:t),orr2=sysPx*pe2.orf,ppx=sx+cos(ang)*orr2,ppy=sy+sin(ang)*orr2,prU=sysU*pe2.prf,prPx=prU*vk;
      if(ppx<-prPx*3-80||ppx>Wv+prPx*3+80||ppy<-prPx*3-80||ppy>Hv+prPx*3+80){
        if(prPx*(2.4+1.1*pe2.moons.length)<Wv*.6)continue;}
      var lx=sx-ppx,ly=sy-ppy,ld=sqrt(lx*lx+ly*ly)||1;lx/=ld;ly/=ld;
      var al=sm((sysPx-30)/60);c.globalAlpha=al;
      var pal=PT[p.type]||PT.rocky;
      if(prPx<3.2){var dr=max(prPx,1.7);c.fillStyle=pal[0];c.beginPath();c.arc(ppx,ppy,dr,0,TAU);c.fill();if(q>=1){c.globalAlpha=al*.25;c.beginPath();c.arc(ppx,ppy,dr*2,0,TAU);c.fill();}c.globalAlpha=1;}
      else{
        /* uydular: gezegenin gerisi/önü gerek yok; uydu yörüngeleri önce */
        var drawn=false,sp=SP(),mAl=sm((prPx-14)/30);
        if(mAl>.02&&pe2.moons.length){c.lineWidth=1;c.strokeStyle='#a8bfff';for(m=0;m<pe2.moons.length;m++){var me=pe2.moons[m];c.globalAlpha=.14*mAl*al;c.beginPath();c.arc(ppx,ppy,prPx*me.oi,0,TAU);c.stroke();}}
        c.globalAlpha=1;
        if(sp&&sp.planet&&prPx>6){try{opt.q=q;opt.light.x=lx;opt.light.y=ly;opt.climate=null;sp.planet(c,p,ppx,ppy,prPx,vrm?0:t,opt);drawn=true;}catch(e){SG.log.err('Sp.planet',e);sp.planet=null;}}
        if(!drawn)planetFB(c,p,pe2,ppx,ppy,prPx,lx,ly,vrm?0:t,q);
        if(mAl>.02){for(m=0;m<pe2.moons.length;m++){var me2=pe2.moons[m],ma=me2.ph+(vrm?0:t*me2.w),mr=prPx*me2.oi,mx=ppx+cos(ma)*mr,my=ppy+sin(ma)*mr,mrp=max(prPx*me2.rat,1.4);
          c.globalAlpha=mAl;var dm2=false;if(sp&&sp.moon&&mrp>6){try{opt.q=q;opt.light.x=lx;opt.light.y=ly;sp.moon(c,me2.m,mx,my,mrp,vrm?0:t,opt);dm2=true;}catch(e2){SG.log.err('Sp.moon',e2);sp.moon=null;}}
          if(!dm2){if(mrp<3){c.fillStyle='#bdbab2';c.beginPath();c.arc(mx,my,mrp,0,TAU);c.fill();}else moonFB(c,mx,my,mrp,lx,ly);}
          if(!vphoto){addPick(me2.m.id,'m',mx,my,mrp);if(prPx>40)addLabel(me2.m.name,mx,my+mrp+11,mAl*.9,11,me2.m.id===selected);}}
          c.globalAlpha=1;}
      }
      if(!vphoto){addPick(p.id,'p',ppx,ppy,max(prPx,1.7)*(prPx<3.2?1:1));
        if(sysPx>110&&al>.5&&(sysPx<900||p.id===selected))addLabel(p.name,ppx,ppy+max(prPx,2)+12,al*(1-sm((sysPx-1500)/800)),11,p.id===selected);
        var dd2=sqrt((ppx-Wv/2)*(ppx-Wv/2)+(ppy-Hv/2)*(ppy-Hv/2));if(dd2<plBestD){plBestD=dd2;plBest=pe2;plBestR=max(prPx,1.5);plBestPrU=prU;}}
    }
    c.globalAlpha=1;
  }
  function drawOverlay(c){
    var i;c.setTransform(dpr,0,0,dpr,0,0);
    if(selOn&&selR<5*max(W,H)){var rr=max(selR*1.3+5,14),a=vrm?0:tVis*.6;c.save();c.strokeStyle='#8fd0ff';c.lineWidth=1.4;c.globalAlpha=.9;c.setLineDash([5,5]);c.lineDashOffset=-a*10;c.beginPath();c.arc(selX,selY,rr,0,TAU);c.stroke();c.setLineDash([]);
      c.globalAlpha=.9;var L=6;c.beginPath();c.moveTo(selX-rr-L,selY);c.lineTo(selX-rr+2,selY);c.moveTo(selX+rr-2,selY);c.lineTo(selX+rr+L,selY);c.moveTo(selX,selY-rr-L);c.lineTo(selX,selY-rr+2);c.moveTo(selX,selY+rr-2);c.lineTo(selX,selY+rr+L);c.stroke();c.restore();}
    if(lbN){c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=3;c.strokeStyle='rgba(3,4,11,.85)';rcN=0;
      var lastS=-1;
      for(var pass=1;pass>=0;pass--)for(i=0;i<lbN;i++){if(lbP[i]!==pass)continue;var sz=lbS[i]*lbScale;
        if(lbX[i]<-80||lbX[i]>W+80||lbY[i]<-20||lbY[i]>H+20)continue;
        var tw=lbT[i].length*sz*.56+6,th=sz+4,hit=false;
        if(!pass){for(var j=0;j<rcN;j++){if(abs(lbX[i]-rcX[j])<(tw+rcW[j])*.5&&abs(lbY[i]-rcY[j])<(th+rcH[j])*.5){hit=true;break;}}if(hit)continue;}
        if(rcN<LBN){rcX[rcN]=lbX[i];rcY[rcN]=lbY[i];rcW[rcN]=tw;rcH[rcN]=th;rcN++;}
        if(sz!==lastS){c.font='500 '+sz.toFixed(1)+'px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';lastS=sz;}
        c.globalAlpha=lbA[i];c.strokeText(lbT[i],lbX[i],lbY[i]);c.fillStyle='#dfe8ff';c.fillText(lbT[i],lbX[i],lbY[i]);}
      c.globalAlpha=1;}
  }
  function computeScale(){var mw=mn(),sc2='universe',h=lastScale==='universe'?1:.85;
    if(gBest&&gBestR>.3*mw*h)sc2='galaxy';
    if(sc2==='galaxy'&&sysBestE&&sysBestPx>.22*mw*h&&sysBestD<1.3*sysBestPx)sc2='system';
    if(sc2==='system'&&plBest&&plBestR>.07*mw*h&&plBestD<2.5*plBestR)sc2='planet';
    ctxGalId=gBest?gBest.id:null;ctxStarId=(sc2==='system'||sc2==='planet')&&sysBestE?sysBestE.d.stars[sysBestI].id:null;
    if(sc2!==lastScale){lastScale=sc2;if(o.onScale){try{o.onScale(sc2);}catch(e){SG.log.err('R.onScale',e);}}}}

  /* ---- döngü ---- */
  function tick(dt){
    if(dead||paused)return;
    var t0=now();
    var tr=tier();if(tr!==lastTier)resize();
    acc+=dt;if(tr===0&&acc<.031)return;dt=min(acc,.1);acc=0;
    /* yerel yedek kalite denetimi (SG.P yoksa) */
    fpsAcc+=dt;fpsN++;if(fpsAcc>=1){fpsV=fpsN/fpsAcc;fpsAcc=0;fpsN=0;if(tierNow()<0&&tierForced===null){fpsT++;if(fpsV<42){fpsLow++;if(fpsLow>=3&&localTier>0){localTier--;fpsLow=0;}}else fpsLow=0;}}
    if(!rm())tVis+=dt;
    update(dt);
    draw(ctx,W,H,cx,cy,k,false,tr,tVis);
    computeScale();drawOverlay(ctx);
    for(var i=0;i<listeners.length;i++){try{listeners[i](dt);}catch(e){SG.log.err('R.frame',e);}}
    var d=now()-t0;msE=msE?msE*.92+d*.08:d;
  }
  function start(){if(SG.loop)SG.loop.add(loopName,tick);}
  function stop(){if(SG.loop)SG.loop.remove(loopName);}

  /* ---- girdi ---- */
  function lp(e){var rc=canvas.getBoundingClientRect();return[e.clientX-rc.left,e.clientY-rc.top];}
  function pick(x,y){var best=-1,bs=1e9;for(var i=0;i<pkN;i++){var dx=pkX[i]-x,dy=pkY[i]-y,d=sqrt(dx*dx+dy*dy),hr=max(pkR[i],22);if(d>hr)continue;
      var sc=d-pkR[i]*.5-(pkK[i]==='m'?5:pkK[i]==='p'?4:pkK[i]==='s'?1:0);if(sc<bs){bs=sc;best=i;}}
    return best>=0?pkId[best]:null;}
  function onDown(e){if(dead)return;try{canvas.setPointerCapture(e.pointerId);}catch(x){}var p=lp(e);ptrs[e.pointerId]={x:p[0],y:p[1],sx:p[0],sy:p[1],t:now()};nPtr++;
    if(nPtr===1){dragging=false;downT=now();vx=vy=0;}
    if(nPtr===2){var a=twoP();pinchD=a[0];dragging=true;anim=null;kT=0;}
    if(canvas.focus)try{canvas.focus({preventScroll:true});}catch(x){}}
  function twoP(){var ids=Object.keys(ptrs),a=ptrs[ids[0]],b=ptrs[ids[1]];if(!a||!b)return[1,0,0];var dx=a.x-b.x,dy=a.y-b.y;return[sqrt(dx*dx+dy*dy)||1,(a.x+b.x)/2,(a.y+b.y)/2];}
  var lastMx=0,lastMy=0,lastMt=0;
  function onMove(e){var q=ptrs[e.pointerId];if(!q){if(e.pointerType==='mouse'){var h=lp(e);hoverId=pick(h[0],h[1]);canvas.style.cursor=hoverId?'pointer':'grab';}return;}
    var p=lp(e);
    if(nPtr===2){var a=twoP(),pd=pinchD,pmx=lastMx,pmy=lastMy;q.x=p[0];q.y=p[1];var b=twoP();if(pd>0&&b[0]>0){var f=b[0]/pd;zoomAbout(clampK(k*f),follow?W/2:b[1],follow?H/2:b[2]);if(!follow){cx-=(b[1]-a[1])/k;cy-=(b[2]-a[2])/k;}}pinchD=b[0];return;}
    var dx=p[0]-q.x,dy=p[1]-q.y;q.x=p[0];q.y=p[1];
    if(!dragging){var mdx=p[0]-q.sx,mdy=p[1]-q.sy;if(mdx*mdx+mdy*mdy>49){dragging=true;anim=null;kT=0;canvas.style.cursor='grabbing';}else return;}
    follow=null;cx-=dx/k;cy-=dy/k;var t=now(),dtm=max(8,t-lastMt)/1000;lastMt=t;vx=vx*.6+(dx/dtm)*.4;vy=vy*.6+(dy/dtm)*.4;}
  function onUp(e){var q=ptrs[e.pointerId];if(!q)return;var p=lp(e);delete ptrs[e.pointerId];nPtr=max(0,nPtr-1);try{canvas.releasePointerCapture(e.pointerId);}catch(x){}
    canvas.style.cursor='grab';
    if(nPtr===1){dragging=true;vx=vy=0;return;}
    if(nPtr>0)return;
    if(!dragging&&now()-downT<600){var id=pick(p[0],p[1]),t=now();
      if(t-lastTapT<330&&abs(p[0]-lastTapX)<26&&abs(p[1]-lastTapY)<26){lastTapT=0;
        if(id){selectId(id,true);focus(id,{animate:true});}else{kT=clampK(k*2.4);zaX=p[0];zaY=p[1];if(rm()){var kn=kT;kT=0;zoomAbout(kn,p[0],p[1]);}}}
      else{lastTapT=t;lastTapX=p[0];lastTapY=p[1];selectId(id,true);}}
    dragging=false;}
  function onWheel(e){if(dead)return;e.preventDefault();anim=null;var p=lp(e),d=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?400:1);kT=clampK((kT>0?kT:k)*pow(2,-d*.0022));zaX=p[0];zaY=p[1];if(rm()){var kn=kT;kT=0;zoomAbout(kn,follow?W/2:p[0],follow?H/2:p[1]);}}
  function onKey(e){if(dead||e.altKey||e.ctrlKey||e.metaKey)return;var key=e.key;
    if(key==='ArrowLeft'||key==='ArrowRight'||key==='ArrowUp'||key==='ArrowDown'||key==='+'||key==='='||key==='-'||key==='_'||(key.length===1&&'awds'.indexOf(key)>=0)){keys[key]=1;anim=null;if(key.indexOf('Arrow')===0)follow=null;e.preventDefault();return;}
    if(key==='Escape'){up();e.preventDefault();return;}
    if(key==='Home'){home();e.preventDefault();return;}
    if(key==='Enter'){if(selected)focus(selected,{animate:true});else{var b=nearestPick();if(b){selectId(b,true);focus(b,{animate:true});}}e.preventDefault();return;}
    if(key==='['||key===']'){cyclePick(key===']'?1:-1);e.preventDefault();}}
  function onKeyUp(e){delete keys[e.key];}
  function nearestPick(){var b=null,bd=1e9;for(var i=0;i<pkN;i++){var dx=pkX[i]-W/2,dy=pkY[i]-H/2,d=dx*dx+dy*dy;if(d<bd){bd=d;b=pkId[i];}}return b;}
  function cyclePick(dir){if(!pkN)return;var cur=-1,i;for(i=0;i<pkN;i++)if(pkId[i]===selected){cur=i;break;}var ni=cur<0?0:(cur+dir+pkN)%pkN;selectId(pkId[ni],true);}
  function onBlur(){keys={};}
  function onPause(){paused=true;stop();}
  function onResume(){if(paused&&!dead){paused=false;acc=0;start();}}

  /* ---- genel API ---- */
  function setUniverse(u){uni=u||null;gmap={};gc={};sc={};selected=null;follow=null;anim=null;kT=0;webEdges=[];
    if(uni&&uni.galaxies){var gs=uni.galaxies;for(var i=0;i<gs.length;i++){gmap[gs[i].id]=gs[i];}
      for(i=0;i<gs.length;i++){var b1=-1,b2=-1,d1=1e9,d2=1e9;for(var j=0;j<gs.length;j++){if(j===i)continue;var d=(gs[i].x-gs[j].x)*(gs[i].x-gs[j].x)+(gs[i].y-gs[j].y)*(gs[i].y-gs[j].y);if(d<d1){d2=d1;b2=b1;d1=d;b1=j;}else if(d<d2){d2=d;b2=j;}}
        if(b1>=0)webEdges.push(i,b1);if(b2>=0)webEdges.push(i,b2);}}
    cx=0;cy=0;k=kmin();lastScale='universe';pkN=0;}
  function focus(id,op){op=op||{};if(!uni)return false;if(!kindOf(id))return false;var r=resolve(id);if(!r)return false;
    selected=id;var kd=kindOf(id);
    if(op.animate===false||rm()&&op.animate!==true){anim=null;kT=0;cx=r.x;cy=r.y;k=clampK(r.k);follow=(kd==='p'||kd==='m')?id:null;}
    else{setAnim(id,false);follow=null;}
    if(op.notify&&o.onSelect){try{o.onSelect(id,kd);}catch(e){SG.log.err('R.onSelect',e);}}return true;}
  function up(){var sc2=lastScale,id=null;
    if(sc2==='planet'){var kd=selected?kindOf(selected):null;if(kd==='m')id=parentOf(selected);else id=ctxStarId||(kd==='p'?parentOf(selected):null);}
    else if(sc2==='system')id=ctxGalId||(ctxStarId?parentOf(ctxStarId):null);
    else if(sc2==='galaxy'){home();return true;}
    else return false;
    if(!id){home();return true;}
    return focus(id,{animate:true});}
  function home(){if(!uni)return;selected=null;follow=null;setAnim(null,true);}
  function dispose(){if(dead)return;dead=true;stop();canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onUp);canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('keydown',onKey);canvas.removeEventListener('keyup',onKeyUp);canvas.removeEventListener('blur',onBlur);canvas.removeEventListener('contextmenu',noCtx);
    window.removeEventListener('resize',resize);window.removeEventListener('sg-pause',onPause);window.removeEventListener('sg-resume',onResume);if(ro&&ro.disconnect)ro.disconnect();gc={};sc={};listeners=[];}
  function noCtx(e){e.preventDefault();}
  function photo(po){po=po||{};return new Promise(function(res,rej){try{
    var w=po.w||1080,h=po.h||1920,cv=document.createElement('canvas');cv.width=w;cv.height=h;var c=cv.getContext('2d'),f=min(w/W,h/H);
    var savedGB=genBudget;genBudget=99;draw(c,w,h,cx,cy,k*f,true,2,tVis);genBudget=savedGB;
    c.setTransform(1,0,0,1,0,0);res(cv.toDataURL(po.type||'image/png',po.quality||.92));}catch(e){rej(e);}});}

  var r={setUniverse:setUniverse,focus:focus,up:up,home:home,
    scale:function(){return lastScale;},selected:function(){return selected;},
    setQuality:function(q){tierForced=(q===0||q===1||q===2)?q:null;resize();},
    setReducedMotion:function(b){rmForced=(b===null||b===undefined)?null:!!b;},
    setLabelScale:function(v){lbScale=cl(+v||1,.8,2);},
    setInset:function(o){try{var t=Math.max(0,Math.round((o&&o.top)||0)),b=Math.max(0,Math.round((o&&o.bottom)||0));if(t===insT&&b===insB)return;insT=t;insB=b;canvas.style.top=t?t+'px':'';canvas.style.height=(t||b)?'calc(100% - '+(t+b)+'px)':'';resize();}catch(e){SG.log&&SG.log.err('R.setInset',e);}},
    resize:resize,pause:onPause,resume:onResume,destroy:dispose,pick:pick,photo:photo,
    on:function(ev,fn){if(ev==='frame'&&typeof fn==='function')listeners.push(fn);return r;},
    off:function(ev,fn){var i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);return r;},
    camera:function(){return{x:cx,y:cy,k:k,kmin:kmin()};},
    stats:function(){return{fps:Math.round(fpsV),ms:Math.round(msE*100)/100,tier:tier(),dpr:dpr,picks:pkN,systems:sysCount};},
    _test:{setCam:function(x,y,kk){anim=null;follow=null;kT=0;cx=x;cy=y;k=kk;},tick:tick,resolve:function(id){var t=resolve(id);return t?{x:t.x,y:t.y,k:t.k}:null;},picks:function(){var a=[];for(var i=0;i<pkN;i++)a.push([pkId[i],pkK[i],pkX[i],pkY[i],pkR[i]]);return a;}}};
  canvas.style.touchAction='none';canvas.style.display=canvas.style.display||'block';canvas.style.cursor='grab';
  if(canvas.tabIndex<0||canvas.getAttribute('tabindex')==null)canvas.setAttribute('tabindex','0');
  if(!canvas.getAttribute('role'))canvas.setAttribute('role','application');
  if(!canvas.getAttribute('aria-label'))canvas.setAttribute('aria-label','Evren haritası. Ok tuşlarıyla kaydır, artı ve eksiyle yakınlaştır, Enter ile odakla, Esc ile bir üst ölçeğe çık.');
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onUp);
  canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('keydown',onKey);canvas.addEventListener('keyup',onKeyUp);canvas.addEventListener('blur',onBlur);canvas.addEventListener('contextmenu',noCtx);
  window.addEventListener('resize',resize);window.addEventListener('sg-pause',onPause);window.addEventListener('sg-resume',onResume);
  var ro=null;try{if(window.ResizeObserver){ro=new ResizeObserver(function(){if(!dead)resize();});ro.observe(canvas);}}catch(e){}
  resize();if(o.uni)setUniverse(o.uni);start();
  return r;}

/* ============== Büyük Patlama (evren oluştur ekranı) ============== */
function bigBang(canvas,seed){
  var c=canvas.getContext('2d',{alpha:false})||canvas.getContext('2d'),rg=SG.rng('bb'+seed),dead=false,t=0,last=0,raf=0,W=300,H=300,dpr=1,N=0;
  var tr=tierNow(),q=tr<0?1:tr;N=[260,420,640][q];
  var X=new Float32Array(N),Y=new Float32Array(N),SX=new Float32Array(N),SY=new Float32Array(N),S=new Float32Array(N),P=new Float32Array(N),CI=new Uint8Array(N),SZ=new Float32Array(N);
  var COLS=['#bcd0ff','#fff2d0','#ffd0a0','#ffffff','#ffb4c8','#a0e0ff'],arms=2+Math.floor(rg()*3),tw=1.4+rg()*1.2;
  for(var i=0;i<N;i++){var a=rg()*TAU,s=pow(rg(),.55);X[i]=cos(a)*s;Y[i]=sin(a)*s;S[i]=.4+rg()*.6;CI[i]=floor(rg()*COLS.length);SZ[i]=.6+rg()*1.6;P[i]=rg();
    var rr=pow(rg(),.8)*.9,arm=floor(rg()*arms),th=arm*TAU/arms+rr*tw*3+(rg()-.5)*.35;SX[i]=cos(th)*rr;SY[i]=sin(th)*rr*.62;}
  function rs(){var rc=canvas.getBoundingClientRect();W=max(40,rc.width||canvas.clientWidth||300);H=max(40,rc.height||canvas.clientHeight||300);dpr=min(window.devicePixelRatio||1,[1.25,1.75,2.5][q]);
    if(canvas.width!==floor(W*dpr)||canvas.height!==floor(H*dpr)){canvas.width=floor(W*dpr);canvas.height=floor(H*dpr);}}
  var reduce=!!SG.RM;
  function frame(ts){if(dead)return;raf=requestAnimationFrame(frame);if(document.hidden){last=0;return;}if(!last)last=ts;var dt=min(.05,(ts-last)/1000);last=ts;
    if(!reduce)t+=dt;else t=6;rs();var spin=reduce?0:max(0,t-3)*.05;
    c.setTransform(dpr,0,0,dpr,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.fillStyle='#02030a';c.fillRect(0,0,W,H);
    var R=min(W,H)*.46,mx=W/2,my=H/2,exp1=1-exp(-t*1.6),form=sm((t-1.1)/2.6);
    c.globalCompositeOperation='lighter';
    /* ilk parlama */
    var fl=max(0,1-t/1.6);if(fl>0.01){var fr=R*(.15+exp1*1.1),fg=c.createRadialGradient(mx,my,0,mx,my,fr);fg.addColorStop(0,'rgba(255,255,255,'+Math.min(1,fl*1.2).toFixed(3)+')');fg.addColorStop(.3,'rgba(255,220,170,'+(fl*.5).toFixed(3)+')');fg.addColorStop(1,'rgba(255,200,150,0)');c.fillStyle=fg;c.fillRect(0,0,W,H);}
    var ca=cos(spin*t),sa=sin(spin*t);
    for(var i=0;i<N;i++){var ex=X[i]*R*exp1*S[i]*1.5,ey=Y[i]*R*exp1*S[i]*1.5,fx=SX[i]*R*1.05,fy=SY[i]*R*1.05,rx=fx*ca-fy*sa,ry=fx*sa+fy*ca;
      var x=mx+ex+(rx-ex)*form,y=my+ey+(ry-ey)*form,al=min(1,t*1.8)*(.5+.5*P[i]);
      c.globalAlpha=al;c.fillStyle=COLS[CI[i]];var sz=SZ[i]*(1.2-.3*form);if(sz>1.5){c.beginPath();c.arc(x,y,sz*.7,0,TAU);c.fill();}else c.fillRect(x,y,sz,sz);}
    var cg=c.createRadialGradient(mx,my,0,mx,my,R*.5);cg.addColorStop(0,'rgba(255,230,190,'+(.55*form).toFixed(3)+')');cg.addColorStop(1,'rgba(255,200,150,0)');c.globalAlpha=1;c.fillStyle=cg;c.fillRect(0,0,W,H);
    c.globalCompositeOperation='source-over';c.globalAlpha=1;
    if(reduce){cancelAnimationFrame(raf);}}
  raf=requestAnimationFrame(frame);
  return{stop:function(){dead=true;cancelAnimationFrame(raf);}};}

SG.R={_n:0,create:create,bigBang:bigBang,kindOf:kindOf,parentOf:parentOf,KIND_NAMES:KIND};
})();
