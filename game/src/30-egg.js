/* SpacEgg v1.0 — yumurta çizimi (SG.E.draw/canvas/crack) + SVG ikon seti (SG.E.ICONS/icon) */
(function(){
'use strict';
var E=SG.E;
var PI=Math.PI,TAU=PI*2,sin=Math.sin,cos=Math.cos;

/* ---------- renk yardımcıları ---------- */
var tcx=document.createElement('canvas').getContext('2d'),cc={};
function rgb(c){
  if(cc[c])return cc[c];var r=[255,255,255];
  try{tcx.fillStyle='#fff';tcx.fillStyle=c;var s=tcx.fillStyle;
    if(s.charAt(0)==='#')r=[parseInt(s.substr(1,2),16),parseInt(s.substr(3,2),16),parseInt(s.substr(5,2),16)];
    else{var m=/rgba?\(([^)]+)\)/.exec(s);if(m){var p=m[1].split(',');r=[+p[0],+p[1],+p[2]];}}}catch(e){}
  cc[c]=r;return r;
}
function rgba(c,a){var r=rgb(c);a=a<0?0:a>1?1:a;return'rgba('+r[0]+','+r[1]+','+r[2]+','+a.toFixed(3)+')';}
function mix(a,b,t){var x=rgb(a),y=rgb(b);return'rgb('+Math.round(x[0]+(y[0]-x[0])*t)+','+Math.round(x[1]+(y[1]-x[1])*t)+','+Math.round(x[2]+(y[2]-x[2])*t)+')';}

/* ---------- yumurta parametreleri (yumurta başına bir kez) ---------- */
var FAKE=['#8fe3ff','#3a7bd5','#14204d'];
function prep(egg){
  if(egg._e)return egg._e;
  var id=String(egg.id||egg.name||'x'),h=SG.hash(id),r=SG.rng(h);
  var pal=(egg.palette&&egg.palette.length?egg.palette.slice():FAKE.slice());
  while(pal.length<3)pal.push(pal[pal.length-1]);
  pal=pal.map(function(c){var q=rgb(c),l=(.2126*q[0]+.7152*q[1]+.0722*q[2])/255;return l>.78?mix(c,'#1a1030',Math.min(.5,(l-.7)*1.4)):c;});
  var glow=typeof egg.glow==='string'?egg.glow:mix(pal[0],'#ffffff',0.35);
  var P={id:id,pal:pal,glow:glow,gi:typeof egg.glow==='number'?egg.glow:0.7,pat:egg.pattern||'benekli',v:h%4,h:h,
    ar:0.72+r()*0.08,tilt:(r()-0.5)*0.1,ph:r()*TAU,sp:0.8+r()*0.5,
    rar:egg.rarity==='efsane'?2:egg.rarity==='nadir'?1:0,D:{}};
  var D=P.D,v=P.v,i,n;
  switch(P.pat){
    case'benekli':n=16+v*5;D.sp=[];for(i=0;i<n;i++)D.sp.push({x:(r()-.5)*.95,y:(r()-.5)*.95,r:.03+r()*.09*(1+v*.3),c:Math.floor(r()*3),ph:r()*TAU});break;
    case'catlakli':n=5+v;D.cr=[];for(i=0;i<n;i++){var a=i/n*TAU+r()*.4,pts=[],rad=.95;for(var k=0;k<7;k++){var aa=a+(r()-.5)*.28;pts.push([cos(aa)*rad*.5,sin(aa)*rad*.62]);rad-=.14;a+=(r()-.5)*.22;}
        D.cr.push({p:pts,w:1+r()*1.1,ph:r()*TAU});}
      D.sp=[];for(i=0;i<22;i++)D.sp.push({x:(r()-.5),y:(r()-.5),r:.02+r()*.05});break;
    case'halkali':D.n=3+v%3+1;D.tl=-.35+v*.2;D.rg=[];for(i=0;i<D.n;i++)D.rg.push({y:(i+.5)/D.n-.5,w:.025+r()*.05,c:i%3,ph:r()*TAU});break;
    case'kristal':n=8+v*2;D.n=n;D.out=[];D.in=[];for(i=0;i<n;i++){var an=i/n*TAU+(r()-.5)*.25;D.out.push([cos(an)*.62,sin(an)*.75]);D.in.push([cos(an+.2)*(.28+r()*.1),sin(an+.2)*(.34+r()*.12)]);}
      D.c=[(r()-.5)*.1,(r()-.5)*.1];D.sh=[];for(i=0;i<n*3;i++)D.sh.push(r());break;
    case'akis':D.n=4+v;D.b=[];for(i=0;i<D.n;i++)D.b.push({y:(i+.5)/D.n-.5,a:.05+r()*.07,f:3+r()*3,s:.7+r()*1.1,ph:r()*TAU,c:i%3});break;
    case'yildizli':D.st=[];for(i=0;i<30;i++)D.st.push({x:(r()-.5)*.95,y:(r()-.5)*.98,s:.008+r()*.02,sp:1+r()*3,ph:r()*TAU});
      D.nb=[];for(i=0;i<3;i++)D.nb.push({x:(r()-.5)*.5,y:(r()-.5)*.6,r:.28+r()*.2,c:i%3,sp:.2+r()*.3,ph:r()*TAU});break;
    case'dalga':D.l=[];for(i=0;i<4;i++)D.l.push({y:-.05+i*.14,a:.025+r()*.02,f:5+r()*3,s:.6+r()*.9,ph:r()*TAU,c:i%3});break;
    case'ates':D.f=[];n=9;for(i=0;i<n;i++)D.f.push({x:(i/(n-1)-.5)*.95+(r()-.5)*.08,h:.4+r()*.4,w:.07+r()*.05,sp:3+r()*3,ph:r()*TAU});
      D.em=[];for(i=0;i<14;i++)D.em.push({x:(r()-.5)*.8,sp:.15+r()*.3,ph:r(),s:.008+r()*.012});break;
    default:break;
  }
  D.sk=[];n=7+P.rar*5;for(i=0;i<n;i++)D.sk.push({a:r()*TAU,r:.58+r()*.28,sp:(r()-.5)*.8,s:.012+r()*.02,tw:1+r()*2.5,ph:r()*TAU});
  egg._e=P;return P;
}

/* ---------- yumurta yolu ---------- */
function eggPath(ctx,w,h){
  var a=w/2,b=h/2;
  ctx.beginPath();ctx.moveTo(0,-b);
  ctx.bezierCurveTo(a*.62,-b,a,-h*.22,a,h*.12);
  ctx.bezierCurveTo(a,h*.36,a*.58,b,0,b);
  ctx.bezierCurveTo(-a*.58,b,-a,h*.36,-a,h*.12);
  ctx.bezierCurveTo(-a,-h*.22,-a*.62,-b,0,-b);
  ctx.closePath();
}
function spark(ctx,x,y,s,col,al){
  ctx.fillStyle=rgba(col,al);ctx.beginPath();
  ctx.moveTo(x,y-s);ctx.quadraticCurveTo(x,y,x+s,y);ctx.quadraticCurveTo(x,y,x,y+s);ctx.quadraticCurveTo(x,y,x-s,y);ctx.quadraticCurveTo(x,y,x,y-s);ctx.fill();
}

/* ---------- desenler (yerel koordinat: merkez 0,0; w,h yumurta boyutu) ---------- */
var PATS={
  benekli:function(c,P,w,h,t){
    var D=P.D,pal=P.pal;
    for(var i=0;i<D.sp.length;i++){var s=D.sp[i],x=s.x*w,y=s.y*h,r=s.r*w*(1+.08*sin(t*1.3+s.ph));
      var col=s.c===0?mix(pal[0],'#ffffff',.3):pal[s.c];
      var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,.9));g.addColorStop(.7,rgba(col,.55));g.addColorStop(1,rgba(col,0));
      c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
  },
  catlakli:function(c,P,w,h,t){
    var D=P.D,pal=P.pal;
    c.fillStyle=rgba(pal[2],.45);c.fillRect(-w,-h,w*2,h*2);
    for(var i=0;i<D.sp.length;i++){var s=D.sp[i];c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.arc(s.x*w,s.y*h,s.r*w,0,TAU);c.fill();}
    var pulse=.6+.4*sin(t*1.8);
    c.lineCap='round';c.lineJoin='round';
    for(var j=0;j<D.cr.length;j++){var k=D.cr[j];
      c.beginPath();for(var q=0;q<k.p.length;q++){var X=k.p[q][0]*w,Y=k.p[q][1]*h;q?c.lineTo(X,Y):c.moveTo(X,Y);}
      c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=k.w*w*.014+1.4;c.stroke();
      c.globalCompositeOperation='lighter';c.strokeStyle=rgba(P.glow,.3*pulse);c.lineWidth=k.w*w*.05+3;c.stroke();
      c.strokeStyle=rgba(mix(P.glow,'#ffffff',.5),(.65+.35*sin(t*2.4+k.ph))*pulse);c.lineWidth=k.w*w*.012+.7;c.stroke();c.globalCompositeOperation='source-over';}
  },
  halkali:function(c,P,w,h,t){
    var D=P.D,pal=P.pal;
    for(var pass=0;pass<2;pass++){
      for(var i=0;i<D.rg.length;i++){var r=D.rg[i],y=(r.y+sin(t*.5+r.ph)*.02)*h;
        c.beginPath();c.ellipse(0,y,w*.7,w*.17,D.tl,pass?0:PI,pass?PI:TAU);
        var col=pal[r.c];
        c.strokeStyle=rgba(pass?mix(col,'#ffffff',.35):mix(col,'#000000',.3),pass?.88:.5);
        c.lineWidth=r.w*h*(pass?1:.8);c.lineCap='butt';c.stroke();
        if(pass){c.strokeStyle=rgba('#ffffff',.18);c.lineWidth=Math.max(1,r.w*h*.22);c.stroke();}}
    }
  },
  kristal:function(c,P,w,h,t){
    var D=P.D,pal=P.pal,n=D.n,cx=D.c[0]*w,cy=D.c[1]*h,i;
    function pt(a){return[a[0]*w,a[1]*h];}
    c.lineJoin='round';
    for(i=0;i<n;i++){var j=(i+1)%n,o1=pt(D.out[i]),o2=pt(D.out[j]),i1=pt(D.in[i]),i2=pt(D.in[j]);
      var s1=D.sh[i*3],s2=D.sh[i*3+1],s3=D.sh[i*3+2];
      c.beginPath();c.moveTo(cx,cy);c.lineTo(i1[0],i1[1]);c.lineTo(i2[0],i2[1]);c.closePath();
      c.fillStyle=s1>.5?rgba('#ffffff',.04+s1*.14):rgba('#000000',.06+s1*.3);c.fill();c.strokeStyle=rgba('#ffffff',.2);c.lineWidth=1;c.stroke();
      c.beginPath();c.moveTo(i1[0],i1[1]);c.lineTo(o1[0],o1[1]);c.lineTo(o2[0],o2[1]);c.lineTo(i2[0],i2[1]);c.closePath();
      c.fillStyle=s2>.5?rgba(pal[0],.18+s2*.35):rgba(pal[2],.15+s2*.4);c.fill();c.stroke();
      c.beginPath();c.moveTo(i1[0],i1[1]);c.lineTo(o1[0],o1[1]);c.lineTo(i2[0],i2[1]);c.closePath();
      c.fillStyle=s3>.5?rgba('#ffffff',.03+s3*.1):rgba('#000000',.04+s3*.22);c.fill();}
    var u=((t*.32+P.ph*.1)%1.8)-.4;c.globalCompositeOperation='lighter';
    var g=c.createLinearGradient(-w*.7+u*w*1.6,-h*.5,-w*.2+u*w*1.6,h*.5);
    g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,rgba('#ffffff',.26));g.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=g;c.fillRect(-w,-h,w*2,h*2);c.globalCompositeOperation='source-over';
  },
  akis:function(c,P,w,h,t){
    var D=P.D,pal=P.pal;c.save();if(P.v%2)c.rotate(PI/2);
    c.globalCompositeOperation='lighter';c.lineCap='round';
    var W=P.v%2?h:w,H=P.v%2?w:h;
    for(var pass=0;pass<2;pass++)for(var i=0;i<D.b.length;i++){var b=D.b[i];
      c.beginPath();for(var x=-W*.7;x<=W*.7;x+=W*.04){var y=b.y*H+sin(x/W*b.f*TAU*.5+t*b.s+b.ph)*b.a*H;x<=-W*.7+1?c.moveTo(x,y):c.lineTo(x,y);}
      c.strokeStyle=rgba(pass?mix(pal[b.c],'#ffffff',.3):pal[b.c],pass?.5:.3);c.lineWidth=pass?H*.03:H*.11;c.stroke();}
    c.restore();c.globalCompositeOperation='source-over';
  },
  yildizli:function(c,P,w,h,t){
    var D=P.D,pal=P.pal,i;
    c.fillStyle='rgba(4,7,28,.55)';c.fillRect(-w,-h,w*2,h*2);
    c.globalCompositeOperation='lighter';
    for(i=0;i<D.nb.length;i++){var n=D.nb[i],x=(n.x+sin(t*n.sp+n.ph)*.08)*w,y=(n.y+cos(t*n.sp*.8+n.ph)*.06)*h,r=n.r*h;
      var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(pal[n.c],.7));g.addColorStop(1,rgba(pal[n.c],0));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
    c.globalCompositeOperation='source-over';
    for(i=0;i<D.st.length;i++){var s=D.st[i],al=.45+.55*sin(t*s.sp+s.ph);al=al<0?0:al;var X=s.x*w,Y=s.y*h,R=s.s*w;
      c.fillStyle=rgba('#ffffff',al);c.beginPath();c.arc(X,Y,R*.55,0,TAU);c.fill();
      if(R>.014*w){c.strokeStyle=rgba('#ffffff',al*.7);c.lineWidth=.8;c.beginPath();c.moveTo(X-R*2.2,Y);c.lineTo(X+R*2.2,Y);c.moveTo(X,Y-R*2.2);c.lineTo(X,Y+R*2.2);c.stroke();}}
    var u=(t*.3+P.ph)%4;if(u<.5){var p=u/.5;c.strokeStyle=rgba('#ffffff',(1-p)*.9);c.lineWidth=1.2;c.beginPath();c.moveTo(-w*.4+p*w*.6,-h*.35+p*h*.25);c.lineTo(-w*.4+p*w*.6-w*.18,-h*.35+p*h*.25-h*.12);c.stroke();}
  },
  dalga:function(c,P,w,h,t){
    var D=P.D,pal=P.pal;
    for(var i=0;i<D.l.length;i++){var l=D.l[i],base=(l.y+sin(t*.6+l.ph)*.02)*h;
      c.beginPath();c.moveTo(-w,h);for(var x=-w*.65;x<=w*.65;x+=w*.05){c.lineTo(x,base+sin(x/w*l.f+t*l.s+l.ph)*l.a*h);}c.lineTo(w,h);c.closePath();
      c.fillStyle=rgba(i%2?mix(pal[l.c],'#000000',.15):pal[l.c],.5+i*.08);c.fill();
      c.beginPath();for(var x2=-w*.65;x2<=w*.65;x2+=w*.05){var yy=base+sin(x2/w*l.f+t*l.s+l.ph)*l.a*h;x2<=-w*.65+1?c.moveTo(x2,yy):c.lineTo(x2,yy);}
      c.strokeStyle=rgba('#ffffff',.38);c.lineWidth=1.2;c.stroke();}
  },
  ates:function(c,P,w,h,t){
    var D=P.D,pal=P.pal,i;
    c.fillStyle=rgba(pal[2],.5);c.fillRect(-w,-h,w*2,h*2);
    c.globalCompositeOperation='lighter';
    var base=h*.52;
    for(i=0;i<D.f.length;i++){var f=D.f[i],ht=f.h*h*(.85+.15*sin(t*f.sp+f.ph)),x=f.x*w,wd=f.w*w*(1.1+.2*sin(t*f.sp*.7+f.ph)),sw=sin(t*f.sp*.6+f.ph)*wd*.8;
      var g=c.createLinearGradient(0,base,0,base-ht);g.addColorStop(0,rgba(pal[0],.95));g.addColorStop(.5,rgba(pal[1],.75));g.addColorStop(1,rgba(pal[1],0));
      c.fillStyle=g;c.beginPath();c.moveTo(x-wd,base);c.quadraticCurveTo(x-wd*.5,base-ht*.5,x+sw,base-ht);c.quadraticCurveTo(x+wd*.5,base-ht*.5,x+wd,base);c.closePath();c.fill();}
    for(i=0;i<D.em.length;i++){var e=D.em[i],p=(t*e.sp+e.ph)%1;c.fillStyle=rgba(mix(pal[0],'#ffffff',.5),(1-p)*.9);c.beginPath();c.arc(e.x*w+sin(t*2+i)*w*.03,base-p*h*.95,e.s*w*(1-p*.5),0,TAU);c.fill();}
    c.globalCompositeOperation='source-over';
  }
};
PATS.default=PATS.benekli;

/* ---------- ana çizim ---------- */
function draw(ctx,egg,t,size,o){
  o=o||{};var P=prep(egg),pal=P.pal;
  var h=size*.64,w=h*P.ar;
  var fl=o.noFloat?0:sin(t*1.15+P.ph)*size*.014;
  var sh=o.shake||0;
  var cx=size/2+(sh?sin(t*47)*sh:0),cy=size*.5+fl+(sh?cos(t*53)*sh*.5:0);
  var gb=o.glowBoost||0;
  ctx.save();if(o.alpha!=null)ctx.globalAlpha=o.alpha;
  /* zemin gölgesi */
  var sa=.3-fl/size*2;
  ctx.save();ctx.translate(size/2,size*.5+h*.52+size*.02);ctx.scale(1,.2);
  var gs=ctx.createRadialGradient(0,0,0,0,0,w*.7);gs.addColorStop(0,'rgba(0,0,0,'+(sa*.8).toFixed(3)+')');gs.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gs;ctx.beginPath();ctx.arc(0,0,w*.7,0,TAU);ctx.fill();ctx.restore();
  /* hale */
  var br=.8+.2*sin(t*1.5+P.ph),ga=Math.min(1,(.2+.18*P.rar)*P.gi*br+gb*.4);
  ctx.save();ctx.globalCompositeOperation='lighter';
  var AR=Math.min(size*.5,h*(.8+.08*P.rar));var ag=ctx.createRadialGradient(cx,cy,h*.2,cx,cy,AR);
  ag.addColorStop(0,rgba(P.glow,ga*1.2));ag.addColorStop(.55,rgba(pal[1],ga*.5));ag.addColorStop(1,rgba(pal[1],0));
  ctx.fillStyle=ag;ctx.fillRect(0,0,size,size);
  if(P.rar===2){ctx.strokeStyle=rgba(P.glow,.14*br);ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,Math.min(size*.47,h*(.7+.03*sin(t*1.1))),0,TAU);ctx.stroke();}
  ctx.restore();
  /* gövde */
  ctx.save();ctx.translate(cx,cy);ctx.rotate(P.tilt+(sh?sin(t*31)*sh*.012:0));
  eggPath(ctx,w,h);
  var bg=ctx.createRadialGradient(-w*.18,-h*.2,h*.04,0,0,h*.62);
  bg.addColorStop(0,pal[0]);bg.addColorStop(.5,pal[1]);bg.addColorStop(1,pal[2]);
  ctx.fillStyle=bg;ctx.fill();
  ctx.save();ctx.clip();
  try{(PATS[P.pat]||PATS.default)(ctx,P,w,h,t);}catch(e){SG.log.err('egg:'+P.pat,e);}
  /* kenar karartma */
  var ed=ctx.createRadialGradient(-w*.12,-h*.1,h*.2,0,0,h*.62);
  ed.addColorStop(0,'rgba(0,0,0,0)');ed.addColorStop(.65,'rgba(0,0,0,.05)');ed.addColorStop(1,'rgba(0,0,0,.58)');
  ctx.fillStyle=ed;ctx.fillRect(-w,-h,w*2,h*2);
  /* alt-sağ yansıyan ışık */
  ctx.globalCompositeOperation='lighter';
  var rl=ctx.createRadialGradient(w*.22,h*.38,0,w*.22,h*.38,h*.38);
  rl.addColorStop(0,rgba(P.glow,.38*P.gi+gb*.2));rl.addColorStop(1,rgba(P.glow,0));
  ctx.fillStyle=rl;ctx.fillRect(-w,-h,w*2,h*2);
  ctx.globalCompositeOperation='source-over';
  /* ışık parlaması */
  ctx.save();ctx.translate(-w*.2,-h*.24);ctx.rotate(-.55);ctx.scale(1,1.7);
  var sp=ctx.createRadialGradient(0,0,0,0,0,w*.17);sp.addColorStop(0,'rgba(255,255,255,.62)');sp.addColorStop(.5,'rgba(255,255,255,.18)');sp.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sp;ctx.beginPath();ctx.arc(0,0,w*.17,0,TAU);ctx.fill();ctx.restore();
  ctx.restore();
  eggPath(ctx,w,h);ctx.strokeStyle=rgba(P.glow,.28+gb*.3);ctx.lineWidth=1.3;ctx.stroke();
  ctx.restore();
  /* parıltılar */
  ctx.save();ctx.globalCompositeOperation='lighter';
  var D=P.D;for(var i=0;i<D.sk.length;i++){var k=D.sk[i],a=k.a+t*k.sp,al=.5+.5*sin(t*k.tw+k.ph);
    spark(ctx,cx+cos(a)*k.r*w*1.15,cy+sin(a)*k.r*h*.78,k.s*size*(.6+.6*al),mix(P.glow,'#ffffff',.4),al*.9);}
  ctx.restore();
  ctx.restore();
  return{cx:cx,cy:cy,w:w,h:h,tilt:P.tilt,P:P};
}

/* ---------- çatlama (progress 0..1; >1: patlama, 1..1.4) ---------- */
function crackData(P){
  if(P.D.ck)return P.D.ck;var r=SG.rng(P.h^0x9e37),K=[],n=7;
  for(var i=0;i<n;i++){var a=-PI/2+(i/n)*TAU+(r()-.5)*.5,pts=[[0,0]],x=0,y=0,len=.12+r()*.1;
    for(var s=0;s<8;s++){a+=(r()-.5)*.9;x+=cos(a)*len;y+=sin(a)*len*1.2;pts.push([x,y]);}
    K.push({p:pts,st:i/n*.55+r()*.05});}
  P.D.ck=K;return K;
}
function crack(ctx,egg,progress,t,size){
  var P=prep(egg),p=Math.max(0,progress),q=Math.min(1,p);
  var o={shake:q*q*size*.011*(q>.15?1:0),glowBoost:q,noFloat:q>.3};
  if(p>1)o.alpha=Math.max(0,1-(p-1)*3.2);
  var g=draw(ctx,egg,t,size,o);
  var cx=g.cx,cy=g.cy,w=g.w,h=g.h,K=crackData(P);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(g.tilt);
  if(p>1)ctx.globalAlpha=o.alpha;
  eggPath(ctx,w,h);ctx.save();ctx.clip();
  ctx.globalCompositeOperation='lighter';
  var lg=ctx.createRadialGradient(0,0,0,0,0,h*.6);lg.addColorStop(0,rgba(mix(P.glow,'#ffffff',.6),q*.65));lg.addColorStop(1,rgba(P.glow,0));
  ctx.fillStyle=lg;ctx.fillRect(-w,-h,w*2,h*2);ctx.globalCompositeOperation='source-over';
  ctx.lineCap='round';ctx.lineJoin='round';
  for(var i=0;i<K.length;i++){var k=K[i],gp=(q-k.st)/(1-k.st);if(gp<=0)continue;gp=Math.min(1,gp);
    var segs=gp*(k.p.length-1),full=Math.floor(segs),fr=segs-full;
    ctx.beginPath();ctx.moveTo(k.p[0][0]*w,k.p[0][1]*h);
    for(var s=1;s<=full;s++)ctx.lineTo(k.p[s][0]*w,k.p[s][1]*h);
    if(full<k.p.length-1){var A=k.p[full],B=k.p[full+1];ctx.lineTo((A[0]+(B[0]-A[0])*fr)*w,(A[1]+(B[1]-A[1])*fr)*h);}
    ctx.strokeStyle='rgba(0,0,0,.7)';ctx.lineWidth=3.2;ctx.stroke();
    ctx.strokeStyle=rgba(P.glow,.35+.4*q);ctx.lineWidth=2.4;ctx.stroke();
    ctx.strokeStyle=rgba('#ffffff',.55+.4*q);ctx.lineWidth=1;ctx.stroke();}
  ctx.restore();
  if(q>.45){ /* çatlaklardan dışarı ışın */
    ctx.globalCompositeOperation='lighter';var ba=(q-.45)/.55;
    for(var j=0;j<K.length;j++){var an=-PI/2+(j/K.length)*TAU+.15,len=h*(.55+ba*.55);
      var bg=ctx.createLinearGradient(0,0,cos(an)*len,sin(an)*len);bg.addColorStop(0,rgba('#ffffff',.5*ba));bg.addColorStop(1,rgba(P.glow,0));
      ctx.strokeStyle=bg;ctx.lineWidth=2+ba*5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(cos(an)*len,sin(an)*len);ctx.stroke();}
    ctx.globalCompositeOperation='source-over';}
  if(p>1){ /* patlama parlaması + halka + kırıntılar */
    var b=Math.min(1,(p-1)/.4);ctx.globalAlpha=1;ctx.globalCompositeOperation='lighter';
    var fg=ctx.createRadialGradient(0,0,0,0,0,h*(.5+b*1.1));fg.addColorStop(0,'rgba(255,255,255,'+(1-b*.5).toFixed(3)+')');fg.addColorStop(.35,rgba(P.glow,.6*(1-b)));fg.addColorStop(1,rgba(P.glow,0));
    ctx.fillStyle=fg;ctx.fillRect(-size,-size,size*2,size*2);
    ctx.strokeStyle=rgba('#ffffff',.8*(1-b));ctx.lineWidth=3*(1-b)+.5;ctx.beginPath();ctx.arc(0,0,h*(.35+b*.85),0,TAU);ctx.stroke();
    var rr=SG.rng(P.h^77);for(var m=0;m<14;m++){var ang=rr()*TAU,d=h*(.2+b*(.4+rr()*.7));spark(ctx,cos(ang)*d,sin(ang)*d,size*.012*(1+rr()*1.5)*(1-b*.6),P.glow,1-b);}
    ctx.globalCompositeOperation='source-over';}
  ctx.restore();
}

/* ---------- animasyonlu canvas ---------- */
var cnt=0;
function canvas(egg,size,o){
  o=o||{};size=size||120;
  var dpr=Math.min(1.5,window.devicePixelRatio||1),cv=document.createElement('canvas'),ctx=cv.getContext('2d');
  cv.width=Math.round(size*dpr);cv.height=Math.round(size*dpr);cv.style.width=size+'px';cv.style.height=size+'px';cv.className='egg-cv';
  var name='egg:'+(++cnt),vis=true,io=null,acc=0,dead=false,T=Math.random()*10,E0=egg;
  function render(){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);
    var pr=typeof o.progress==='function'?o.progress():o.progress;
    try{(pr!=null&&pr>0)?crack(ctx,E0,pr,T,size):draw(ctx,E0,T,size,o);}catch(e){SG.log.err('egg.canvas',e);}
  }
  cv.setEgg=function(e){E0=e;if(SG.RM||o.paused)render();};
  cv.redraw=render;
  cv.destroy=function(){dead=true;SG.loop.remove(name);if(io){io.disconnect();io=null;}};
  if('IntersectionObserver' in window){io=new IntersectionObserver(function(en){vis=en[0].isIntersecting;});io.observe(cv);}
  if(SG.RM||o.paused){render();return cv;}
  render();
  SG.loop.add(name,function(dt){
    if(dead||!vis)return;if(!cv.isConnected&&cv._seen){cv.destroy();return;}if(cv.isConnected)cv._seen=true;
    T+=dt;acc+=dt;if(acc<(o.fps?1/o.fps:1/30))return;acc=0;render();
  });
  return cv;
}
E.draw=draw;E.crack=crack;E.canvas=canvas;

/* =====================  İKONLAR  ===================== */
var I={};
function def(n,s){I[n]=s;}
/* --- UI --- */
def('menu','<path d="M4 7h16M4 12h16M4 17h16"/>');
def('back','<path d="M15 5l-7 7 7 7"/>');
def('close','<path d="M6 6l12 12M18 6L6 18"/>');
def('settings','<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.6"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/>');
def('sound','<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 010 6M18 6.5a8 8 0 010 11"/>');
def('mute','<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>');
def('music','<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>');
def('lock','<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/><path d="M12 15v2"/>');
def('unlock','<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 017.6-1.7"/>');
def('bolt','<path d="M13 2.5L5 13.5h6L10 21.5l8-11h-6z"/>');
def('coin','<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.6"/><path d="M12 9v6M10.2 10.6c0-.9.8-1.4 1.8-1.4s1.8.5 1.8 1.2-.8 1.1-1.8 1.4-1.8.6-1.8 1.4.8 1.2 1.8 1.2 1.8-.5 1.8-1.4"/>');
def('coin_stack','<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>');
def('target','<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>');
def('crosshair','<circle cx="12" cy="12" r="6.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>');
def('map','<path d="M3 6l6-2.2 6 2.2 6-2.2v14l-6 2.2-6-2.2-6 2.2z"/><path d="M9 3.8v14M15 6v14"/>');
def('satellite','<rect x="9.5" y="9.5" width="5" height="5" rx="1" transform="rotate(45 12 12)"/><path d="M4 8l4-4 3 3-4 4zM13 17l4-4 3 3-4 4z"/><path d="M5.5 18.5c1 .4 2 .4 3 0M3.5 20.5a8 8 0 004.5.5"/>');
def('planet','<circle cx="12" cy="12" r="5.4"/><ellipse cx="12" cy="12" rx="10.3" ry="3.3" transform="rotate(-24 12 12)"/>');
def('egg','<path d="M12 2.5C8.2 2.5 5 9 5 14a7 7 0 0014 0c0-5-3.2-11.5-7-11.5z"/><path d="M9 14a3 3 0 003 3"/>');
def('egg_crack','<path d="M12 2.5C8.2 2.5 5 9 5 14a7 7 0 0014 0c0-5-3.2-11.5-7-11.5z"/><path d="M6.2 12l3 2.2 2-3.2 2.4 3 2.4-2.2"/>');
def('home','<path d="M3.5 11.5L12 4l8.5 7.5M6 10v10h12V10"/><path d="M10 20v-5.5h4V20"/>');
def('user','<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c.8-4 3.7-6 7.5-6s6.7 2 7.5 6"/>');
def('users','<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c.6-3.5 3.1-5.3 6.5-5.3s5.9 1.8 6.5 5.3M16 5.5a3.4 3.4 0 010 6.5M18.5 14.8c1.9.6 3.1 2.3 3.5 5.2"/>');
def('plus','<path d="M12 5v14M5 12h14"/>');
def('minus','<path d="M5 12h14"/>');
def('check','<path d="M4.5 12.5l5 5 10-11"/>');
def('info','<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".9" fill="currentColor"/>');
def('warn','<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>');
def('help','<circle cx="12" cy="12" r="9"/><path d="M9.3 9.4a2.8 2.8 0 015.4.9c0 1.9-2.7 2.3-2.7 4"/><circle cx="12" cy="17.3" r=".9" fill="currentColor"/>');
def('star','<path d="M12 3l2.7 5.7 6.2.8-4.6 4.3 1.2 6.2L12 17l-5.5 3 1.2-6.2L3 9.5l6.2-.8z"/>');
def('heart','<path d="M12 20s-8-5-8-11a4.6 4.6 0 018-3 4.6 4.6 0 018 3c0 6-8 11-8 11z"/>');
def('search','<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>');
def('bell','<path d="M6 17V11a6 6 0 0112 0v6l1.5 2h-15z"/><path d="M10 21a2 2 0 004 0"/>');
def('clock','<circle cx="12" cy="12" r="9"/><path d="M12 6.5V12l3.5 2.5"/>');
def('gift','<rect x="3.5" y="9" width="17" height="4"/><path d="M5 13v7.5h14V13M12 9v11.5M12 9c-1.5-5-6-5-5-2.3C7.5 8 10 9 12 9zM12 9c1.5-5 6-5 5-2.3C16.5 8 14 9 12 9z"/>');
def('chart','<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12.5 16V8M17 16v-6"/>');
def('arrow_right','<path d="M4 12h16M14 6l6 6-6 6"/>');
def('arrow_up','<path d="M12 20V4M6 10l6-6 6 6"/>');
def('arrow_down','<path d="M12 4v16M6 14l6 6 6-6"/>');
def('chevron_down','<path d="M6 9l6 6 6-6"/>');
def('chevron_up','<path d="M6 15l6-6 6 6"/>');
def('chevron_right','<path d="M9 6l6 6-6 6"/>');
def('download','<path d="M12 3v12M6.5 10.5L12 16l5.5-5.5M4 20h16"/>');
def('upload','<path d="M12 16V4M6.5 9.5L12 4l5.5 5.5M4 20h16"/>');
def('refresh','<path d="M20 12a8 8 0 01-14.2 5M4 12a8 8 0 0114.2-5"/><path d="M18.5 3v4.5H14M5.5 21v-4.5H10"/>');
def('eye','<path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
def('book','<path d="M4 4.5h6.5a2 2 0 012 2V20a2 2 0 00-2-2H4zM20 4.5h-6.5a2 2 0 00-1 .3M20 4.5V18h-6.5a2 2 0 00-2 2"/>');
def('flag','<path d="M5 21V3.5M5 4.5h12l-2.5 4 2.5 4H5"/>');
def('key','<circle cx="8" cy="15" r="4.5"/><path d="M11.3 11.8L20 3M16.5 6.5l3 3M14 9l2 2"/>');
def('link','<path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1"/>');
def('sliders','<path d="M4 7h9M17 7h3M4 17h3M11 17h9M4 12h3M11 12h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/><circle cx="9" cy="12" r="2"/>');
def('crown','<path d="M3.5 18.5l-1-11 5.5 4.5L12 5l4 7 5.5-4.5-1 11z"/><path d="M4 21.5h16"/>');
def('trophy','<path d="M7.5 3.5h9v6.5a4.5 4.5 0 01-9 0zM7.5 5.5h-3a3 3 0 003.2 4.5M16.5 5.5h3a3 3 0 01-3.2 4.5M12 14.5V18M8.5 21h7M9.5 18h5"/>');
def('medal','<circle cx="12" cy="15" r="5.5"/><path d="M8 10L5.5 3h5l1.5 4M16 10l2.5-7h-5L12 7"/><path d="M12 12.5l1 2h2.2l-1.7 1.4.6 2.1L12 17l-2.1 1 .6-2.1L8.8 14.5H11z" fill="currentColor" stroke="none"/>');
def('badge','<circle cx="12" cy="10" r="6"/><path d="M8.5 15L7 21.5l5-2.5 5 2.5L15.5 15"/><path d="M12 7l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2L8.8 9.3 11 9z" fill="currentColor" stroke="none"/>');
def('list','<path d="M8.5 6h12M8.5 12h12M8.5 18h12"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>');
def('grid','<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/>');
def('dot','<circle cx="12" cy="12" r="3.5" fill="currentColor"/>');
def('unknown','<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9.5 9.5a2.5 2.5 0 014.8.8c0 1.7-2.3 2-2.3 3.7"/><circle cx="12" cy="17" r=".8" fill="currentColor"/>');
def('filter','<path d="M3.5 5h17l-6.5 8v6l-4 2v-8z"/>');
def('save','<path d="M5 3.5h11l3.5 3.5V20.5H5z"/><path d="M8 3.5v5h7v-5M8 20.5v-6h8v6"/>');
def('share','<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>');
def('copy','<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5V5.5a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2h3"/>');
def('trash','<path d="M4 6.5h16M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14M10 10.5v6M14 10.5v6"/>');
def('edit','<path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 013 3L8 18.5z"/><path d="M14.5 6l3 3"/>');
def('pin','<path d="M9 3.5h6l-1 6 3 3.5H7l3-3.5zM12 13v8"/>');
def('camera','<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7L10 4h4l1.5 3"/><circle cx="12" cy="13.5" r="3.5"/>');
def('cart','<path d="M2.5 4h3l2.5 11.5h10L20.5 8H6.5"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>');
def('bag','<path d="M5 8h14l1 12.5H4z"/><path d="M8.5 8V6.5a3.5 3.5 0 017 0V8"/>');
def('gauge','<path d="M4 17a9 9 0 1116 0"/><path d="M12 14l4-5"/><circle cx="12" cy="14" r="1.3" fill="currentColor"/>');
def('pause','<path d="M8 5v14M16 5v14"/>');
def('play','<path d="M7 4.5l12 7.5-12 7.5z"/>');
def('fast','<path d="M4 5l8 7-8 7zM12 5l8 7-8 7z"/>');
def('mission','<rect x="5" y="4.5" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 18h4"/>');
def('story','<path d="M6 4h12a1.5 1.5 0 011.5 1.5V18a2.5 2.5 0 01-2.5 2.5H6.5A2.5 2.5 0 014 18V6a2 2 0 012-2z"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>');
def('galaxy','<circle cx="12" cy="12" r="1.8" fill="currentColor"/><path d="M12 12c0-4 3-7 7-7M12 12c0 4-3 7-7 7M12 12c4 0 7-3 7-7 0 4 3 7 3 7M12 12c-4 0-7 3-7 7"/><path d="M12 12c2-3 6-3 8-1M12 12c-2 3-6 3-8 1"/>');
def('nebula','<path d="M5 15c-2-3 0-8 5-8 2 0 3 1 4.500 1 3 0 5.500 2.500 4 5.500-1 2-3 2.500-5 2-2 2-6 3-8.500-.500z"/><circle cx="9" cy="11" r=".8" fill="currentColor"/><circle cx="14.500" cy="13" r=".8" fill="currentColor"/><circle cx="12" cy="9.500" r=".6" fill="currentColor"/>');
def('shuffle','<path d="M3 7h3.500c5 0 4 10 9 10H21M3 17h3.500c1.500 0 2.500-1 3.500-2.500M13 8.500C14 7.500 14.500 7 16 7h5M18 4l3 3-3 3M18 14l3 3-3 3"/>');
def('wallet','<path d="M4 7.500A2.500 2.500 0 016.500 5H19v3"/><rect x="3.500" y="7.500" width="17" height="12" rx="2.500"/><circle cx="16.500" cy="13.500" r="1.300" fill="currentColor"/>');
def('globe','<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>');
def('cursor','<path d="M5 3.500l13 7-5.500 1.800L10 18z"/>');
def('tap','<path d="M9 11V5.500a1.800 1.800 0 013.600 0V11M12.600 10a1.700 1.700 0 013.400.3V12a1.700 1.700 0 013.200.5V16c0 3-2 5.500-5.500 5.500h-1.500c-2 0-3.500-1-4.800-3L4.500 14c-.6-1 .6-2.100 1.600-1.500L9 14.500"/>');
/* --- tip simgeleri --- */
def('war','<path d="M4 4l11.500 11.500M4 4v4.500M4 4h4.500M20 4L8.500 15.500M20 4v4.500M20 4h-4.500M6 18l-2.500 2.500M18 18l2.500 2.500M7.500 16.500L5 14M16.500 16.500L19 14"/>');
def('city','<path d="M3 21V10.500h6V21M9 21V4h7v17M16 21v-8h5v8M2 21h20"/><path d="M11.500 8h2M11.500 12h2M11.500 16h2M5 13.500h2M5 17h2M18 16h1"/>');
def('cargo','<path d="M3 7.500l9-4.500 9 4.500v9l-9 4.500-9-4.500z"/><path d="M3 7.500l9 4.500 9-4.500M12 12v9M7.500 5.300l9 4.500"/>');
def('blackhole','<circle cx="12" cy="12" r="3.300" fill="currentColor"/><ellipse cx="12" cy="12" rx="10.300" ry="3.600" transform="rotate(-24 12 12)"/><path d="M6 7.500a8 8 0 0112-1M18 16.500a8 8 0 01-12 1" opacity=".6"/>');
def('creation','<path d="M12 3l1.900 5.100L19 10l-5.100 1.900L12 17l-1.900-5.100L5 10l5.100-1.900z"/><path d="M19 15v5M16.500 17.500h5M5 17v3.500M3.300 18.700h3.400"/>');
/* --- kaynaklar --- */
def('iron','<path d="M4 18l2-6h12l2 6zM7 12l1.500-5h7L17 12M3 18h18"/>');
def('metal','<path d="M3.500 17l3-7h11l3 7zM7 10l1.500-4h7L17 10M3.500 17v2.500h17V17"/>');
def('gold','<path d="M3 18l2.500-5h5l2.500 5zM11 18l2.500-5h5L21 18z"/><path d="M7 13l2-4h5l2 4"/><path d="M12 5.500v1.500M9.500 6.500l.7 1M14.500 6.500l-.7 1"/>');
def('crystal','<path d="M12 2.500l5 6-5 13-5-13z"/><path d="M7 8.500h10M12 2.500v19M9.500 8.500L12 21.500l2.500-13"/>');
def('water','<path d="M12 3.500s6.500 7 6.500 11.500a6.500 6.500 0 01-13 0C5.500 10.500 12 3.500 12 3.500z"/><path d="M8.500 15a3.500 3.500 0 003.500 3.500"/>');
def('food','<path d="M12 7c-5 0-8 3-8 7 0 3.500 2.500 6 6 6 1 0 1.500-.5 2-.5s1 .5 2 .5c3.500 0 6-2.500 6-6 0-4-3-7-8-7z"/><path d="M12 7c0-2 1-3.500 3.500-4M12 7c-1-1.500-2.500-2-4.500-1.500"/>');
def('energy','<circle cx="12" cy="12" r="9"/><path d="M13 5.500L8.500 12.500H12L11 18.500l4.500-7H12z"/>');
def('fuel','<path d="M5 20.500V5.500a2 2 0 012-2h6a2 2 0 012 2v15M3.500 20.500h13M15 9.500h2.500a1.500 1.500 0 011.500 1.500v6a1.500 1.500 0 003 0V9l-3-3"/><path d="M7.500 7.500h5v4h-5z"/>');
def('uranium','<circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 10V3.500a8.500 8.500 0 017.500 4.500L14 11.300M10.300 13l-5.600 3.200A8.500 8.500 0 013.500 12c0-1.500.4-2.800 1.200-4M13.700 13l5.600 3.200A8.500 8.500 0 0112 20.500c-1.800 0-3.400-.5-4.700-1.500"/>');
def('carbon','<path d="M12 3l7 4v8l-7 4-7-4V7z"/><path d="M12 3v16M5 7l14 8M19 7L5 15"/>');
def('oxygen','<circle cx="9" cy="12" r="5"/><circle cx="17" cy="9" r="3"/><circle cx="17" cy="16.500" r="2"/>');
def('hydrogen','<circle cx="7" cy="12" r="3.500"/><circle cx="17" cy="12" r="2.500"/><path d="M10.500 12h4"/>');
def('silicon','<rect x="6" y="6" width="12" height="12" rx="1.500"/><rect x="9.500" y="9.500" width="5" height="5"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/>');
def('copper','<path d="M4 8c0-2 3.500-3.500 8-3.500s8 1.500 8 3.500-3.500 3.500-8 3.500S4 10 4 8z"/><path d="M4 8v8c0 2 3.500 3.500 8 3.500s8-1.500 8-3.500V8"/>');
def('lithium','<rect x="6" y="6" width="12" height="15" rx="2"/><path d="M10 3.500h4V6h-4zM12 10l-2.500 4h5L12 18"/>');
def('ice','<path d="M12 2.500v19M3.800 7.250l16.400 9.500M20.200 7.250L3.800 16.750M9.500 4.500L12 7l2.500-2.500M9.500 19.500L12 17l2.500 2.500"/>');
def('gas','<path d="M6 17.500a4 4 0 01.5-8A5.500 5.500 0 0117 8.500a4.500 4.500 0 011 9z"/><path d="M8 21h8M10 19v2M14 19v2" opacity=".7"/>');
def('population','<circle cx="12" cy="6.500" r="3"/><path d="M6.500 21v-7a5.500 5.500 0 0111 0v7"/><circle cx="4.500" cy="10" r="2"/><circle cx="19.500" cy="10" r="2"/>');
def('knowledge','<path d="M9 18h6M10 21h4M12 3a6.500 6.500 0 00-3.500 12v1.500h7V15A6.500 6.500 0 0012 3z"/><path d="M12 8v4M10.500 10h3" opacity=".7"/>');
def('dna','<path d="M7 3c0 6 10 6 10 12v6M17 3c0 6-10 6-10 12v6"/><path d="M8.300 6.500h7.400M8.300 17.500h7.400M9.700 11.500h4.600"/>');
def('atom','<circle cx="12" cy="12" r="1.800" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>');
def('molecule','<circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="20" r="2"/><path d="M6.500 7.500l3.200 2.800M17.500 7.500l-3.200 2.800M12 15v3"/>');
def('seed','<path d="M12 21v-9M12 12c0-4-2.500-6.500-7-6.500 0 4 2.500 6.500 7 6.500zM12 14c0-3.500 2.200-5.500 6.500-5.500 0 3.500-2.200 5.500-6.500 5.500z"/><path d="M8 21h8"/>');
def('wood','<path d="M5 8c0-1.700 3-3 7-3s7 1.300 7 3-3 3-7 3-7-1.300-7-3z"/><path d="M5 8v8c0 1.700 3 3 7 3s7-1.300 7-3V8"/><path d="M10 8c0-.6.900-1 2-1" opacity=".7"/>');
def('stone','<path d="M3.500 17l2-7 5-4 6 2.500 4 5-3 5.500z"/><path d="M5.500 10l5 2.500 6-4M10.500 12.500L9 19" opacity=".7"/>');
def('plasma','<circle cx="12" cy="12" r="4"/><path d="M12 3c-2 2-2 4 0 5M12 21c2-2 2-4 0-5M3 12c2 2 4 2 5 0M21 12c-2-2-4-2-5 0M5.700 5.700c2.500.300 3.500 1.800 3 3.500M18.300 18.300c-2.500-.3-3.500-1.800-3-3.500"/>');
def('darkmatter','<circle cx="12" cy="12" r="8" stroke-dasharray="2 2.500"/><circle cx="12" cy="12" r="4.500"/><circle cx="12" cy="12" r="1.300" fill="currentColor"/>');
def('antimatter','<circle cx="12" cy="12" r="9"/><path d="M8 15.500L12 7l4 8.500M9.200 13h5.600"/>');
def('sat','<path d="M12 3.500a8.500 8.500 0 100 17 8.500 8.500 0 000-17z"/><path d="M7 9.500h2.500M14 14h3M10 16.500h2" opacity=".7"/>');
/* --- yapılar / eylemler --- */
def('farm','<path d="M3 21V11l5-4 5 4v10M13 21v-6h8v6M2 21h20"/><path d="M6.500 21v-5h3v5M15.500 15v-2l2.500-1.500 2.500 1.500v2"/><path d="M17 8c0-2 .5-3.500 1.500-4.500" opacity=".7"/>');
def('mine','<path d="M5 20l9-9M13 4.500c3.500-.8 6.500 1 7.500 4-1.800-1.200-3.500-1.500-5-1L13 4.500zM13 4.500c-3 1-5 4-4.500 7"/><path d="M8.500 11.500l4 4" />');
def('factory','<path d="M3 21V9.500l6 3.500V9.500l6 3.500V4h4v17zM3 21h18"/><path d="M7 17h2M12 17h2M17 17h1"/>');
def('tower','<path d="M9 21l1-12h4l1 12M10 9L9 5h6l-1 4M12 5V2.500M8 14h8M12 2.500l3 1.500-3 1.500"/><path d="M6 21h12"/>');
def('lab','<path d="M9 3h6M10 3v6L4.500 18.500a2 2 0 001.800 3h11.400a2 2 0 001.800-3L14 9V3"/><path d="M7 15.500h10"/><circle cx="11" cy="18.500" r=".8" fill="currentColor"/><circle cx="14" cy="17" r=".7" fill="currentColor"/>');
def('port','<circle cx="12" cy="5.500" r="2.200"/><path d="M12 7.700V20.500M7.500 11H16.500M4 14c0 4 3.500 6.500 8 6.500s8-2.500 8-6.500M3 14h2M19 14h2"/>');
def('rocket','<path d="M12 2.500c3.500 2.500 5 6 5 10l-2 3.500H9l-2-3.500c0-4 1.500-7.500 5-10z"/><circle cx="12" cy="9.500" r="1.800"/><path d="M7 13l-3 3 1 4 4-2M17 13l3 3-1 4-4-2M10.500 19c.5 1.500 1 2.500 1.500 3 .5-.5 1-1.500 1.500-3"/>');
def('ship','<path d="M3 15h18l-2.500 5H5.500zM12 3v12M12 4l6 7.500H12M12 6.500L7 11.500h5"/>');
def('cannon','<path d="M4.500 15l11-6.500 3 5-11 6.500z"/><circle cx="7" cy="19.500" r="2.500"/><path d="M16 8.500l2-1.500M19 4l1.500-.5M20.500 8.500L22 8" />');
def('missile','<path d="M18.500 3.500c-6 0-10 4-12 9l5 5c5-2 9-6 9-12z"/><path d="M6.500 12.500l-3 1 3.500 3.500M11.500 17.500l-1 3L7 17M14.500 9.500a1.800 1.800 0 103.600 0 1.800 1.800 0 00-3.600 0zM3 21l3.500-3.500"/>');
def('radar','<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="15.500" cy="14.500" r=".9" fill="currentColor"/>');
def('wall','<path d="M3 5h18v14H3zM3 9.500h18M3 14.500h18M9 5v4.500M15 9.500v5M9 14.500V19"/>');
def('barracks','<path d="M3 20.500L12 4l9 16.500zM12 4v16.500M8 20.500l4-7 4 7"/><path d="M12 4V2M12 2l3 1-3 1"/>');
def('powerplant','<path d="M5 21l2-11h10l2 11zM8.500 10L9 4h6l.5 6"/><path d="M12 13l-2 3.500h4L12 20"/>');
def('solar','<path d="M4 13l3-8h10l3 8zM3 13h18v3H3zM12 5v8M7.500 9h9M12 16v5M8.500 21h7"/>');
def('reactor','<path d="M6 21l1-13h10l1 13zM8 8c0-3 1.500-5 4-5s4 2 4 5"/><circle cx="12" cy="14.500" r="2.200"/><path d="M12 12.300V10M9.800 15.600L8 17M14.200 15.600L16 17"/>');
def('school','<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.500V16c0 1.500 2.700 3 6 3s6-1.500 6-3v-4.500M22 9v6"/>');
def('market','<path d="M3 9l2-5h14l2 5zM3 9c0 1.700 1.300 3 3 3s3-1.300 3-3c0 1.700 1.300 3 3 3s3-1.300 3-3c0 1.700 1.300 3 3 3s3-1.300 3-3M5 12v8.500h14V12M10 20.500v-5h4v5"/>');
def('bank','<path d="M3 9l9-5.500L21 9zM5 9.500V17M9.300 9.500V17M14.700 9.500V17M19 9.500V17M3 20h18M4 17h16"/>');
def('road','<path d="M8 21L9.500 3M16 21L14.500 3M12 4v3M12 10v3.500M12 17v3.500"/>');
def('bridge','<path d="M2 15h20M2 18.500h20M5 15V9M19 15V9M5 9c2 4 5 6 7 6s5-2 7-6M9 15v-3M15 15v-3"/>');
def('house','<path d="M3.500 11.500L12 4l8.500 7.500M5.500 10v10.500h13V10"/><path d="M10 20.500v-6h4v6"/>');
def('temple','<path d="M3 9l9-5.500L21 9zM5.500 9.500V18M9.800 9.500V18M14.200 9.500V18M18.500 9.500V18M3.500 18h17M2.500 21h19"/>');
def('hospital','<rect x="3.500" y="5" width="17" height="16" rx="2"/><path d="M12 8.500v8M8 12.500h8M9 5V3h6v2"/>');
def('drill','<path d="M7 3.500h10l-1.500 5h-7zM12 8.500v4M10 12.500h4l-2 8-2-8z"/><path d="M8.500 6h7"/>');
def('truck','<path d="M2.500 6h11v10h-11zM13.500 9.500H18l3.500 3.500V16h-8"/><circle cx="7" cy="17.500" r="2"/><circle cx="17" cy="17.500" r="2"/>');
def('train','<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8.500 7h2M13.500 7h2M8 17l-2.500 4M16 17l2.500 4M8 14h.01M16 14h.01"/>');
def('crane','<path d="M6 21V8M4 21h5M6 8l12-5M6 8V5.500L18 3M18 3v10M16 13h4v3h-4zM6 12l5-2"/>');
def('warehouse','<path d="M3 21V9l9-5.500L21 9v12M7 21v-7h10v7M7 17.500h10M12 14v7"/>');
def('antenna','<path d="M12 12v9M8 21h8M8.500 12L12 7.500 15.500 12zM7 5.500a7 7 0 000 8M17 5.500a7 7 0 010 8M4.500 3a11 11 0 000 13M19.500 3a11 11 0 010 13" opacity=".9"/>');
def('telescope','<path d="M3 13.500l13-6 1.800 4-13 6zM17 7l3-1.500 1 2.500-3 1.500M9 17.500L7 21.500M12 16l2 5.500"/>');
def('drone','<rect x="9" y="10" width="6" height="4" rx="1.500"/><path d="M9 11L5 7.500M15 11l4-3.500M9 13l-4 3.500M15 13l4 3.500"/><circle cx="4.500" cy="7" r="2"/><circle cx="19.500" cy="7" r="2"/><circle cx="4.500" cy="17" r="2"/><circle cx="19.500" cy="17" r="2"/>');
def('robot','<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 8V4.500M12 3.500v.01M3 12.500v3M21 12.500v3"/><circle cx="9" cy="13" r="1.400" fill="currentColor"/><circle cx="15" cy="13" r="1.400" fill="currentColor"/><path d="M9.500 16.500h5"/>');
def('tank','<path d="M5 11h10l2 2.500h3.500v4h-17zM9 11V7.500h6L18 6"/><path d="M3.500 17.500h17" /><circle cx="7" cy="17.500" r="1.400"/><circle cx="12" cy="17.500" r="1.400"/><circle cx="17" cy="17.500" r="1.400"/>');
def('helmet','<path d="M4 15a8 8 0 0116 0v3.500H4zM4 15h16M12 7V4M9 15v3.500M15 15v3.500"/>');
def('laser','<path d="M3.500 17.500l5-5M7 15l2 2M7.500 11l5.500 5.500M13 12.500L21 4.500"/><path d="M17.500 3.500L21 7M19 3l-1 3" opacity=".8"/>');
def('bomb','<circle cx="10.500" cy="14.500" r="6.500"/><path d="M15 9.500l3-3M18 6.500l1.500-2M18.700 3.500l1.500 1M20.300 5.500l1.300-.5M7 13a3.500 3.500 0 013.500-3"/>');
def('nuke','<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.600" fill="currentColor"/><path d="M12 10.400V5.100a7 7 0 00-6 3.500l4.600 2.700M13.400 12.800l4.600 2.700a7 7 0 01-12 0l4.600-2.700" fill="currentColor" stroke="none" opacity=".35"/><path d="M13.400 11.200L18 8.500a7 7 0 00-6-3.400"/>');
def('shield','<path d="M12 3l8 3v6c0 5-3.500 8-8 9.500C7.500 20 4 17 4 12V6z"/>');
def('shield_check','<path d="M12 3l8 3v6c0 5-3.500 8-8 9.500C7.500 20 4 17 4 12V6z"/><path d="M8.500 12l2.500 2.500 4.500-5"/>');
def('shield_up','<path d="M12 3l8 3v6c0 5-3.500 8-8 9.500C7.500 20 4 17 4 12V6z"/><path d="M12 16v-7M9 12l3-3 3 3"/>');
def('sword','<path d="M5 19L18 6l2-3-.5.500 .500-.500-3 2L3 18zM3 21l3-3M15 6l3 3M8 14l2 2" />');
def('swords','<path d="M4 4l11 11M4 4v4M4 4h4M20 4L9 15M20 4v4M20 4h-4M5 19l2.500-2.500M19 19l-2.500-2.500M3 21l2-2M21 21l-2-2"/>');
def('handshake','<path d="M2 11l3.500-3 4 1 3-1.500 3 1.500L21.500 7l.5 5-3 5c-1 1.500-2.500 1-3.500.5L12 15.500c-1 1-2.500 1-3.500 0L6 13 2 11z"/><path d="M9.500 9l3 3M12 12l1.500 1.500"/>');
def('peace','<path d="M3 14c3-1 5-1 8 1 1.500.7 2.500.5 3 0l5-4c1-1 2.500-1.500 3-1l-3.500 5c-2 2.500-5 5-9 5-3 0-5-2-6.500-5z"/><path d="M14.500 15c-1-2-1.500-3.500-.5-6 .5-1.300 1.800-2.500 3.500-2.500"/>');
def('diplomacy','<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/><path d="M8 17l2 2M16 17l-2 2" opacity="0"/>');
def('spy','<path d="M2 12s3.700-7 10-7 10 7 10 7-3.700 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M12 9v6M9 12h6" opacity=".6"/>');
def('trade','<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>');
def('ship_launch','<path d="M12 3c3 2.500 4.500 6 4.500 10l-2 3h-5l-2-3C7.500 9 9 5.500 12 3z"/><circle cx="12" cy="9.500" r="1.600"/><path d="M9 19.500l-.5 2M12 19.500v2.500M15 19.500l.5 2M5 13l3 2M19 13l-3 2"/>');
def('orbit','<circle cx="12" cy="12" r="2.500"/><ellipse cx="12" cy="12" rx="9.500" ry="4.500" transform="rotate(-30 12 12)"/><circle cx="19" cy="8" r="1.300" fill="currentColor"/>');
def('wormhole','<circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="9"/><path d="M12 3c4 0 6 3 3 5M12 21c-4 0-6-3-3-5" opacity=".7"/>');
def('warp','<path d="M3 12h7M3 7h4M3 17h4M10 12c2-4 5-6 11-6-2 3-3 6-3 6s1 3 3 6c-6 0-9-2-11-6z"/>');
def('portal','<ellipse cx="12" cy="12" rx="6.500" ry="9"/><ellipse cx="12" cy="12" rx="3.200" ry="5.500"/><path d="M12 3c-3 0-6.500 4-6.500 9S9 21 12 21" opacity=".5"/>');
def('terraform','<circle cx="12" cy="12" r="9"/><path d="M5 14c2-3 4 0 6-2.500s3-3 5-2M12 21c0-3 2-4 3.500-6 1.500-2 3-2 5-1.500M8 5c1 2-.5 3-1 4.500"/>');
def('evolution','<path d="M12 21V11M12 11c-4 0-6-3-6-7 3 0 6 2 6 7zM12 14c0-3 2-5 6-5 0 3-2 5-6 5z"/><path d="M8 21h8"/>');
def('tech','<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>');
def('chip','<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M10 10h4v4h-4z"/>');
def('gear','<circle cx="12" cy="12" r="3.200"/><path d="M12 3l1.500 2.500 3-.500 1 2.800 2.800 1-.500 3L21 12l-2.200 2.200.500 3-2.800 1-1 2.800-3-.500L12 21l-1.500-2.500-3 .500-1-2.800-2.800-1 .500-3L3 12l2.200-2.200-.500-3 2.800-1 1-2.800 3 .500z"/>');
def('circuit','<circle cx="5" cy="6" r="1.700"/><circle cx="19" cy="6" r="1.700"/><circle cx="12" cy="19" r="1.700"/><path d="M6.700 6H12v4.500M17.300 6H15l-3 3v8.300M12 10.500V8"/>');
def('wifi','<path d="M2.500 9a14 14 0 0119 0M5.500 12.500a9.500 9.500 0 0113 0M8.500 16a5 5 0 017 0"/><circle cx="12" cy="19.500" r="1.200" fill="currentColor"/>');
def('battery','<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.500v3M7 10v4M11 10v4M15 10v4"/>');
def('magnet','<path d="M5 3.500h4v8a3 3 0 006 0v-8h4v8a7 7 0 01-14 0z"/><path d="M5 7.500h4M15 7.500h4"/>');
def('flask','<path d="M9 3h6M10 3v6l-5 9a2 2 0 001.700 3h10.600a2 2 0 001.700-3l-5-9V3"/><path d="M7.500 15.500h9"/>');
def('microscope','<path d="M8 21h10M10 17h4M9 3l4 1-3 8-4-1zM12 10c4 0 6 2.500 6 5.500s-2.500 4.500-6 4.500"/>');
def('cell','<ellipse cx="12" cy="12" rx="9" ry="7.500"/><circle cx="10.500" cy="11" r="2.800"/><circle cx="16" cy="15" r=".9" fill="currentColor"/><circle cx="15.500" cy="8.500" r=".9" fill="currentColor"/>');
/* --- olaylar --- */
def('volcano','<path d="M3 21l6-12h6l6 12zM9.500 9L8 6.500M14.500 9L16 6.500M12 8V3.500M10 5.500l2-2 2 2"/><path d="M8 15h8" opacity=".6"/>');
def('quake','<path d="M2 12h3.500l2-5 3 10 3-12 2.500 8H22"/><path d="M3 20h18" opacity=".6"/>');
def('rain','<path d="M6 14.500a4 4 0 01.5-8A5.500 5.500 0 0117 6.500a4.500 4.500 0 011 8.500z"/><path d="M8 17.500l-1 3M12 17.500l-1 3M16 17.500l-1 3"/>');
def('storm','<path d="M6 13.500a4 4 0 01.5-8A5.500 5.500 0 0117 5.500a4.500 4.500 0 011 8"/><path d="M12.500 11l-3 5h3.500l-2 5.500"/>');
def('wind','<path d="M3 8h11a2.500 2.500 0 10-2.500-2.500M3 12h16a3 3 0 11-3 3M3 16h7a2 2 0 11-2 2"/>');
def('thunder','<path d="M13 2.500L5 13.500h6L10 21.500l8-11h-6z"/><path d="M19 3l1.500 1.500M20.500 8H22M3 4l1.500 1.500" opacity=".6"/>');
def('fire','<path d="M12 21.500c-4 0-6.500-2.800-6.500-6.500 0-3 1.800-5 3.500-7 .6 1.600 1.500 2.500 2.500 3 0-3.500 1.500-6.500 3.500-8.500.5 4 4 5.500 4 11 0 4-2.500 8-7 8z"/><path d="M12 21.500c-1.800 0-3-1.200-3-3 0-1.500 1.300-2.500 2-3.500.7 1 2 2 2 3.500s-.5 3-1 3z" opacity=".7"/>');
def('flood','<path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M12 3.500s3 3 3 5.500a3 3 0 01-6 0c0-2.500 3-5.500 3-5.500z"/>');
def('meteor','<path d="M20 4L9.500 8.500 15.500 14.500z" opacity="0"/><circle cx="15" cy="15" r="5"/><path d="M11.500 11.500L3 3M10 14.500L4 12M14.500 10L12 4M13 13a2 2 0 011.500-1" />');
def('asteroid','<path d="M4.500 12l2-5.500 5-2.500 5.500 1.500 3 5-1.500 6-5.500 3.500-6-1.500z"/><circle cx="9.500" cy="11" r="1.500"/><circle cx="15" cy="14" r="1.100"/><circle cx="14" cy="8.500" r=".8"/>');
def('comet','<circle cx="17" cy="7" r="3.500"/><path d="M14.500 9.500L3 21M13 6L4 10.500M18 11l-5.500 8"/>');
def('supernova','<circle cx="12" cy="12" r="3.500"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.500 3.500M15.500 15.500L19 19M19 5l-3.500 3.500M8.500 15.500L5 19"/>');
def('aurora','<path d="M3 20c2-6 3-10 5-14M9 20c1.500-5 2-10 4-15M15 20c1-5 2-9 5-13" /><path d="M3 20h18" opacity=".6"/>');
def('drought','<circle cx="12" cy="9" r="4"/><path d="M12 1.500v2M4.500 4.500l1.500 1.500M19.500 4.500L18 6M2 9h2M20 9h2"/><path d="M3 21l3-3 3 3 3-3 3 3 3-3 3 3M3 17h18" opacity=".7"/>');
def('plague','<circle cx="12" cy="12" r="4.500"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/><circle cx="12" cy="2" r="1" fill="currentColor"/><circle cx="12" cy="22" r="1" fill="currentColor"/><circle cx="2" cy="12" r="1" fill="currentColor"/><circle cx="22" cy="12" r="1" fill="currentColor"/>');
def('eclipse','<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 000 18 6 9 0 010-18z" fill="currentColor"/>');
def('signal','<circle cx="12" cy="17" r="2" fill="currentColor"/><path d="M7.500 12.500a6.500 6.500 0 019 0M4.500 9.500a11 11 0 0115 0M12 19v3"/>');
def('ufo','<ellipse cx="12" cy="13" rx="9.500" ry="3.500"/><path d="M7.500 12c0-4 2-6 4.500-6s4.500 2 4.500 6M7 18l-2 3M12 17v4M17 18l2 3"/>');
def('alien','<path d="M12 3c-5 0-8 3.500-8 8 0 4 3 8 8 10 5-2 8-6 8-10 0-4.500-3-8-8-8z"/><path d="M6.500 10.500c1.500 0 3 1 3.500 2.500-1.500.500-3.500 0-3.500-2.500zM17.500 10.500c-1.500 0-3 1-3.500 2.500 1.500.500 3.500 0 3.500-2.500z" fill="currentColor" stroke="none"/>');
def('wave','<path d="M2 13c2-4 4-4 6 0s4 4 6 0 4-4 6 0M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M3 8c3-2 5 0 8 1" opacity=".6"/>');
def('tornado','<path d="M3 5h18M5 9h14M7 13h10M9 17h6M11 21h2"/>');
def('sun','<circle cx="12" cy="12" r="4.500"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>');
def('moon','<path d="M20 14.500A8.500 8.500 0 119.500 4a7 7 0 0010.500 10.500z"/>');
def('cloud','<path d="M6.500 18a4.500 4.500 0 01-.5-9 6 6 0 0111.500 1.500A3.800 3.800 0 0117.500 18z"/>');
def('explosion','<path d="M12 2l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z"/><circle cx="12" cy="12" r="2.500"/>');
def('radiation','<circle cx="12" cy="12" r="1.800" fill="currentColor"/><path d="M12 10.200L7.500 3.800A10 10 0 0116.500 3.800L12 10.200zM10.500 13.100L3 14.500A10 10 0 017.500 6.700M13.500 13.100L21 14.500A10 10 0 0116.500 6.700" opacity="0"/><path d="M9.500 9L6 3.500a9.500 9.500 0 0112 0L14.500 9a4 4 0 00-5 0zM9.500 15l-6.500.5a9.500 9.500 0 006 7.500l2-6.500a4 4 0 01-1.500-1.500zM14.500 15l6.500.5a9.500 9.500 0 01-6 7.500l-2-6.500a4 4 0 001.500-1.500z" opacity="0"/><path d="M12 12l-6.500-8.500M12 12l9.500-1M12 12l-3 10.500" opacity="0"/><path d="M9.800 10.200L7 5.500a8 8 0 0110 0l-2.800 4.700M10 13.800l-5.500-.5a8 8 0 003 6.500l3.800-4M14 13.800l5.500-.5a8 8 0 01-3 6.500l-3.800-4"/>');
def('gravity','<circle cx="12" cy="12" r="2.500" fill="currentColor"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.500 2.500M15.500 15.500L18 18M18 6l-2.500 2.500M8.500 15.500L6 18" opacity=".8"/><path d="M10.500 5.500L12 7l1.500-1.500M10.500 18.500L12 17l1.500 1.500"/>');
def('rainbow','<path d="M3 18a9 9 0 0118 0M6 18a6 6 0 0112 0M9 18a3 3 0 016 0"/>');
def('snow','<path d="M12 2.500v19M3.800 7.250l16.400 9.500M20.200 7.250L3.800 16.750M9.500 4.500L12 7l2.500-2.500M9.500 19.500L12 17l2.500 2.500"/>');
/* --- yaşam --- */
def('human','<circle cx="12" cy="5.500" r="2.800"/><path d="M12 9v7M7 11.500l5-2.500 5 2.500M9 21.500l3-5.500 3 5.500"/>');
def('crowd','<circle cx="12" cy="6.500" r="2.500"/><circle cx="5.500" cy="9.500" r="2"/><circle cx="18.500" cy="9.500" r="2"/><path d="M7.500 21v-5a4.500 4.500 0 019 0v5M1.500 20v-3.500a3.500 3.500 0 015-3M22.500 20v-3.500a3.500 3.500 0 00-5-3"/>');
def('animal','<ellipse cx="12" cy="16" rx="4.500" ry="3.800"/><circle cx="5.500" cy="11" r="1.900"/><circle cx="9.500" cy="6.500" r="1.900"/><circle cx="14.500" cy="6.500" r="1.900"/><circle cx="18.500" cy="11" r="1.900"/>');
def('paw','<ellipse cx="12" cy="16" rx="4.500" ry="3.800"/><circle cx="5.500" cy="11" r="1.900"/><circle cx="9.500" cy="6.500" r="1.900"/><circle cx="14.500" cy="6.500" r="1.900"/><circle cx="18.500" cy="11" r="1.900"/>');
def('bird','<path d="M3 15c3 0 5-1.500 7-4 1 1.200 2.500 1.800 4 1.500L21 7.500l-1 6c-.8 4.200-4.500 7-8.500 7-3.500 0-6-2-8.500-5.500z"/><circle cx="16" cy="8.500" r=".8" fill="currentColor"/><path d="M7 15c1.500 1.500 3.500 2 6 1.500" opacity=".7"/>');
def('fish','<path d="M3 12c3-5 8-6.500 13-3.500l5-2.500v12l-5-2.500c-5 3-10 1.500-13-3.500z"/><circle cx="8" cy="11" r=".9" fill="currentColor"/><path d="M12 9c1 1.500 1 4 0 6" opacity=".7"/>');
def('insect','<ellipse cx="12" cy="14" rx="3.500" ry="5.500"/><circle cx="12" cy="6.500" r="2"/><path d="M9 11L4 9M9 14H3M9 17l-5 2.500M15 11l5-2M15 14h6M15 17l5 2.500M10.500 5L9 2.500M13.500 5L15 2.500"/>');
def('plant','<path d="M12 21v-9M12 12c0-4-2.500-6.500-7-6.500 0 4 2.500 6.500 7 6.500zM12 15c0-3.500 2.200-5.500 6.500-5.500 0 3.500-2.200 5.500-6.500 5.500z"/><path d="M8 21h8"/>');
def('tree','<path d="M12 21v-6M12 15c-4 0-7-2.500-7-6 0-2 1-3.500 2.500-4.500C8 2.500 10 2 12 2s4 .5 4.500 2.500C18 5.500 19 7 19 9c0 3.500-3 6-7 6z"/><path d="M12 12l-2-2M12 14l3-3"/>');
def('flower','<circle cx="12" cy="9" r="2.200"/><path d="M12 6.800C12 4.500 13 3 14.500 3S17 4.500 14.500 6.500M14.200 9c2.300 0 3.800 1 3.800 2.500s-1.500 2.500-3.500.5M12 11.200c0 2.300-1 3.800-2.500 3.800S7 13.500 9.500 11.500M9.800 9C7.500 9 6 8 6 6.500S7.500 4 9.500 6" /><path d="M12 15v6.500M12 18c-2 0-3.500-.5-4.500-2M12 19c2 0 3.500-.5 4.500-2"/>');
def('leaf','<path d="M5 19C5 10 10 4 20 4c0 9-5 15-12 15"/><path d="M5 19c3-5 6-8 10-10"/>');
def('mushroom','<path d="M3.500 12.500C3.500 7 7.500 3.500 12 3.500s8.500 3.500 8.500 9z"/><path d="M9.500 12.500V19a2.500 2.500 0 005 0v-6.500"/><circle cx="8" cy="9" r="1.100" fill="currentColor"/><circle cx="14" cy="7.500" r="1.100" fill="currentColor"/><circle cx="16.500" cy="10.500" r=".8" fill="currentColor"/>');
def('whale','<path d="M2 14c2 3.500 6 5.500 10.500 5.500 4.500 0 8-2 9.500-5.500-1.500 0-2.500-1-2.500-2.500L22 8c-1.500 0-3.500 1-4.500 2.500C16.500 7 13.500 5 10 5 5.500 5 2 8.500 2 14z"/><circle cx="7" cy="12" r=".8" fill="currentColor"/><path d="M10 3.500c-.5-1.300.5-2 1-2M12 3c.5-1.200 1.500-1.500 2-1"/>');
def('microbe','<ellipse cx="12" cy="12" rx="8" ry="5.500" transform="rotate(35 12 12)"/><path d="M5.500 7l-2-1.500M9 4.500L8 2M19 17l2 1.500M15 19.500l1 2.500M18.500 6.500l2-1.500M5.500 17.500l-2 1.500"/><circle cx="11" cy="11" r="1" fill="currentColor"/><circle cx="14.500" cy="13.500" r=".8" fill="currentColor"/>');
def('dove','<path d="M3 14c3-1 5-1 8 1 1.500.7 2.500.5 3 0l5-4c1-1 2.500-1.500 3-1l-3.500 5c-2 2.500-5 5-9 5-3 0-5-2-6.500-5z"/>');
def('skull','<path d="M12 3.500c-4.500 0-7.500 3-7.500 7 0 2.500 1 4 2.500 5v3.500h10V15.500c1.500-1 2.500-2.500 2.500-5 0-4-3-7-7.500-7z"/><circle cx="9" cy="11" r="1.600" fill="currentColor"/><circle cx="15" cy="11" r="1.600" fill="currentColor"/><path d="M10.500 19v-2M13.500 19v-2"/>');
def('medic','<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>');
def('lightbulb','<path d="M9 18h6M10 21h4M12 3a6.500 6.500 0 00-3.500 12v1.500h7V15A6.500 6.500 0 0012 3z"/>');
def('hourglass','<path d="M6 3h12M6 21h12M7 3v4l5 5-5 5v4M17 3v4l-5 5 5 5v4"/>');
def('infinity','<path d="M12 12c-2-3-3.500-4.500-6-4.500a4.500 4.500 0 000 9c2.500 0 4-1.500 6-4.500s3.500-4.500 6-4.500a4.500 4.500 0 010 9c-2.500 0-4-1.500-6-4.500z"/>');
def('dice','<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.100" fill="currentColor"/><circle cx="15" cy="9" r="1.100" fill="currentColor"/><circle cx="12" cy="12" r="1.100" fill="currentColor"/><circle cx="9" cy="15" r="1.100" fill="currentColor"/><circle cx="15" cy="15" r="1.100" fill="currentColor"/>');
def('palette','<path d="M12 3a9 9 0 100 18c1.500 0 2-1 1.500-2s0-2 1.500-2h2.500a3 3 0 003-3C20.500 6.500 16.500 3 12 3z"/><circle cx="7.500" cy="11" r="1.200" fill="currentColor"/><circle cx="10" cy="7" r="1.200" fill="currentColor"/><circle cx="15" cy="7" r="1.200" fill="currentColor"/>');
def('hammer','<path d="M14 4.500l5.500 5.500-2.500 2.500-5.500-5.500zM12.500 9.500L4 18l2 2 8.500-8.500M10 6l3-2.500M17 13.500l2-2"/>');
def('wrench','<path d="M14.500 3.500a5 5 0 00-4.800 6.500L3.500 16.200a2 2 0 003 3l6.200-6.200a5 5 0 006.500-4.800l-3 3-3-.7-.7-3z"/>');
def('bug','<ellipse cx="12" cy="14" rx="4.500" ry="6"/><path d="M9 6.500a3 3 0 016 0M12 8v12M7.500 11H3M7.500 15H3M16.500 11H21M16.500 15H21M8 19l-3 2M16 19l3 2M8.500 8L6 5.500M15.500 8L18 5.500"/>');
def('percent','<circle cx="7.500" cy="7.500" r="2.500"/><circle cx="16.500" cy="16.500" r="2.500"/><path d="M19 5L5 19"/>');
def('route','<circle cx="6" cy="18" r="2.500"/><circle cx="18" cy="6" r="2.500"/><path d="M8.500 18H15a3 3 0 000-6H9a3 3 0 010-6h6.500"/>');
def('radar_scan','<path d="M4 20a11 11 0 0116-16M7 20a8 8 0 0113-13M10 20a5 5 0 018-8"/><circle cx="4.500" cy="19.500" r="1.200" fill="currentColor"/>');
def('construction','<path d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-6h6v6"/><path d="M3 9h18" opacity=".6"/>');
def('pickaxe','<path d="M5 20l9-9M13 4.500c3.500-.8 6.500 1 7.500 4-1.800-1.200-3.500-1.500-5-1L13 4.500zM13 4.500c-3 1-5 4-4.500 7"/>');

/* --- ek ikonlar (ICON-LIST uyumu) --- */
def('matter','<circle cx="8" cy="8" r="3"/><circle cx="16.500" cy="9" r="2.200"/><circle cx="10" cy="17" r="2.500"/><circle cx="17.500" cy="17" r="1.600"/><path d="M10.500 9.500l3.800-.5M9 11l.8 3.500M12 16.800l4-.100M16.800 11l.4 4.500"/>');
def('wheat','<path d="M12 21.500V8M12 8c-2 0-3.500-1.500-3.500-3.500C10.500 4.500 12 6 12 8zM12 8c2 0 3.500-1.500 3.500-3.500C13.500 4.500 12 6 12 8zM12 13c-2.500 0-4-1.500-4-4 2.500 0 4 1.500 4 4zM12 13c2.500 0 4-1.500 4-4-2.500 0-4 1.500-4 4zM12 18c-2.500 0-4-1.500-4-4 2.500 0 4 1.500 4 4zM12 18c2.500 0 4-1.500 4-4-2.500 0-4 1.500-4 4z"/>');
def('anchor','<circle cx="12" cy="5" r="2.200"/><path d="M12 7.200V21M7.500 11.500h9M4 14c.5 4 3.500 7 8 7s7.500-3 8-7M4 14l-1.500 1.500M20 14l1.500 1.500"/>');
def('compass','<circle cx="12" cy="12" r="9"/><path d="M15.800 8.200l-2 5.600-5.600 2 2-5.600z"/><circle cx="12" cy="12" r="1" fill="currentColor"/>');
def('mountain','<path d="M2.500 20l6.500-12 4 6.500 2.500-3.500 6 9z"/><path d="M7 11.500l2 1.500 1.500-2" opacity=".7"/>');
def('bone','<path d="M8.500 6a2.500 2.500 0 10-2.500 2.500L15.500 18A2.500 2.500 0 1018 15.500z"/><path d="M8.500 6A2.500 2.500 0 116 3.500M18 15.500A2.500 2.500 0 1120.500 18"/>');
def('wing','<path d="M3 17c1-6 5-11 12-12 3.500-.500 5 .500 6 2-3 .5-4 2-4 3 2 0 3 .5 4 1.500-3 .5-4.500 2-5 4 1.500 0 2.500.5 3 1.500-4 1-9 .5-11-1 .5 1.500 0 2.500-1 3z"/>');
def('ring','<ellipse cx="12" cy="14" rx="7.500" ry="6.500"/><ellipse cx="12" cy="14" rx="4.500" ry="3.800"/><path d="M9.500 5l2.500-2.500L14.500 5l-2.500 2.500z"/>');
def('banner','<path d="M5 21V3.500M5 4.500h14l-3.500 4.500L19 13.500H5"/><circle cx="5" cy="3" r="1" fill="currentColor"/>');
def('gem','<path d="M6.500 4h11l4 5.500L12 21 2.500 9.500z"/><path d="M2.500 9.500h19M9 4l-1.500 5.500L12 21l4.500-11.500L15 4M7.500 9.500L12 4l4.500 5.500"/>');
def('ore','<path d="M4 16l2-7 5-4 6.500 2 3 6-3 6.500H8z"/><path d="M9 11l3 2.500 4-3M12 13.500V19M8.500 16h4" opacity=".8"/>');
def('barrel','<ellipse cx="12" cy="5.500" rx="6.500" ry="2.500"/><path d="M5.500 5.500v13c0 1.400 2.900 2.500 6.500 2.500s6.500-1.100 6.500-2.500v-13M5.500 10c0 1.400 2.900 2.500 6.500 2.500s6.500-1.100 6.500-2.500M5.500 15c0 1.400 2.900 2.500 6.500 2.500s6.500-1.100 6.500-2.500"/>');
def('pipe','<path d="M3 8.500h8v7h8M3 8.500V6M3 8.500v3M11 8.500V5M19 15.500V19M19 15.500h2.500M3 11.500h0M19 12v7"/><rect x="2" y="6" width="3" height="5.500" rx=".8"/><rect x="17.500" y="12" width="3" height="7.500" rx=".8"/>');
def('beacon','<path d="M12 21.500V10M8.500 21.500h7M9.500 10l.5-3h4l.5 3zM12 7V4"/><path d="M7 5a7 7 0 000 4M17 5a7 7 0 010 4M4.500 3a11 11 0 000 8M19.500 3a11 11 0 010 8"/>');
def('swirl','<path d="M12 12c0-1.500 1.500-2 2.500-1.500s1.300 2.500-.5 3.500c-2 1-5 0-5.500-3-.5-3.500 2.500-6 6-5.500 4.500.7 6.500 5 4.500 9-2 4-8 5.500-12 2.500"/>');
def('tsunami','<path d="M2 18c2.500 0 3.500-2 4.500-4C8 10.500 11 7 15 7c3 0 5 1.800 5 4 0 1.500-1 2.500-2.500 2.500-1 0-2-.5-2-1.500M2 21c3 0 4-1.500 5.500-1.500s3 1.500 5 1.500 3.500-1.500 5-1.500S20 21 22 21"/>');
def('virus','<circle cx="12" cy="12" r="5"/><path d="M12 7V3M12 17v4M7 12H3M17 12h4M8.500 8.500L5.500 5.500M15.500 15.500l3 3M15.500 8.500l3-3M8.500 15.500l-3 3"/><circle cx="12" cy="2.500" r="1" fill="currentColor"/><circle cx="12" cy="21.500" r="1" fill="currentColor"/><circle cx="2.500" cy="12" r="1" fill="currentColor"/><circle cx="21.500" cy="12" r="1" fill="currentColor"/><circle cx="10.500" cy="10.500" r=".9" fill="currentColor"/><circle cx="13.500" cy="13" r=".9" fill="currentColor"/>');
def('fort','<path d="M3 21V8h3V5.500h2.500V8h7V5.500H18V8h3v13zM3 21h18M9.500 21v-5a2.500 2.500 0 015 0v5M3 12h18"/>');
def('spear','<path d="M4 20L17 7M15 4.500L20 4l-.500 5-3 .500zM3 21l2-2M7 17l2 2"/>');
def('scale','<path d="M12 3v18M7 21h10M4 7h16M4 7l-2.500 6a3.500 3 0 005 0zM20 7l-2.500 6a3.500 3 0 005 0z"/>');
def('brush','<path d="M20 3.500C16 5 11 9 9.500 13.500l2.500 2.500c4.500-1.500 8.500-6.500 8-12.500zM9.500 13.500c-3 0-4.500 2-4.500 4.500 0 1.500-.5 2.500-2 3 3.500 1 7 .5 9-1.500 1-1 1-2.500 0-3.500"/>');
def('mirror','<ellipse cx="12" cy="9.500" rx="6.500" ry="7"/><path d="M12 16.500V21M8.500 21h7M8 7c1-1.800 2.500-2.500 4-2.500" opacity=".8"/>');
def('feather','<path d="M20 4C11 3 6 8.500 5.500 16.500L4 20.500M5.500 16.500c4.500 1 9-1.500 11-6.500M9.500 14c2-1 4.500-3.500 6-6.500"/>');
def('nest','<path d="M3 12c0 5 4 8.500 9 8.500s9-3.500 9-8.500M3 12h18M5.500 15.500c3.500 1.800 9.500 1.800 13 0M7.500 18c2.500 1 6.500 1 9 0"/><ellipse cx="9.500" cy="9.500" rx="2" ry="2.600"/><ellipse cx="14.500" cy="9.500" rx="2" ry="2.600"/>');
def('pyramid','<path d="M12 3.500L3 20.500h18zM12 3.500v17M12 3.500L8 20.500"/><path d="M7.500 13l9 0" opacity=".7"/>');
def('dyson','<circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="12" r="8.500" stroke-dasharray="3 2"/><circle cx="12" cy="12" r="6" stroke-dasharray="2 2.500" opacity=".7"/>');
def('rail','<path d="M7 21L9 3M17 21L15 3M6.500 8h11M5.800 13h12.400M5 18h14"/>');
def('container','<rect x="3" y="6.500" width="18" height="11" rx="1"/><path d="M7 6.500v11M10.500 6.500v11M14 6.500v11M17.500 6.500v11"/>');
def('boiler','<rect x="5" y="8" width="14" height="12" rx="3"/><path d="M9 8V4h6v4M12 4V2M8 14h8M12 11v6M9.500 20v1.500M14.500 20v1.500"/><circle cx="12" cy="14" r="2.500"/>');
def('crater','<ellipse cx="12" cy="14" rx="9" ry="4.500"/><ellipse cx="12" cy="13" rx="5" ry="2.200"/><path d="M3 14c0-3 2-5 4-6.500M21 14c0-3-2-5-4-6.500" opacity=".7"/><path d="M12 3v3.500M8 4l1 2.500M16 4l-1 2.500"/>');
def('colony','<path d="M3 20h18M4 20v-5a8 8 0 0116 0v5"/><path d="M9 20v-4h6v4M12 7V4M10.500 4h3"/><circle cx="12" cy="12" r="1.200" fill="currentColor"/>');
def('scroll','<path d="M7 4h11a2 2 0 012 2v1.500H9M9 7.500V17a2.500 2.500 0 11-5 0v-1.500h5M7 4a2 2 0 00-2 2v9.500"/><path d="M12 11h5M12 14h4"/>');
def('mask','<path d="M3.500 7c3 1.500 6 2 8.500 2s5.500-.5 8.500-2c0 7-2.500 12-8.500 12S3.500 14 3.500 7z"/><path d="M7.500 11.500c1 .8 2 .8 3 0M13.500 11.500c1 .8 2 .8 3 0M9.500 15.500c1.500 1 3.500 1 5 0"/>');
def('pawn','<circle cx="12" cy="6.500" r="3"/><path d="M9 10.500h6L16 16H8zM6.500 21l1.500-5M17.500 21L16 16M5 21h14"/>');
def('torch','<path d="M10.500 12h3l1 9.500h-5zM12 12c-3-2-3-5 0-9 3 4 3 7 0 9z"/><path d="M8.500 12h7"/>');
def('hive','<path d="M12 2.500l4 2.300v4.400l-4 2.300-4-2.300V4.800zM8 11.500l4 2.300v4.400L8 20.500l-4-2.300v-4.400zM16 11.500l4 2.300v4.400l-4 2.300-4-2.300v-4.400z"/>');
def('coral','<path d="M12 21v-9M12 12c-2.500-.5-4-2-4-5M12 15c2.500 0 4-1.500 4-4.500M12 12c2-1 3-3 3-5.500M8 7V3.500M16 10.500V6.500M15 6.500V3M5 21h14" />');
def('dragon','<path d="M3 20c3 0 4-3 3-5.500S5 10 8 8.500c2-1 4-.5 5 1 1-1 2.500-1.500 4-1L20 4l1 5-2 2c.5 2-1 4-3 4.500-1 2-3 4.500-7 4.500z"/><circle cx="15" cy="8" r=".8" fill="currentColor"/><path d="M8 8.500L6.500 5M10 8L9.500 4.500"/>');
def('wolf','<path d="M3.500 5L8 8h8l4.500-3-1 8c-.5 3.500-3 6.500-7.500 8.500C7.500 19.500 4.500 16.500 4 13z"/><circle cx="9" cy="12" r=".9" fill="currentColor"/><circle cx="15" cy="12" r=".9" fill="currentColor"/><path d="M10.500 16.500h3l-1.500 1.500z"/>');
def('butterfly','<path d="M12 7v12M12 11C9 4 3 3 3.500 8c.5 3 3 4 8.500 3zM12 11c3-7 9-8 8.500-3-.5 3-3 4-8.500 3zM12 13c-3 1-7 1.500-6.500 4.500.5 2.500 4.500 2 6.500-1.500zM12 13c3 1 7 1.500 6.500 4.500-.5 2.500-4.500 2-6.500-1.500zM10.500 4L9 2M13.500 4L15 2"/>');
def('snake','<path d="M7 21c-3 0-4-3-2-4.500s5 0 8-1.500 3-5 .5-6.500S8.500 6 9.500 4 14 2.500 16 4.500"/><circle cx="16.500" cy="4.500" r=".8" fill="currentColor"/><path d="M18.500 3.500L21 2.500M19 5.500l2.500.5"/>');
def('troops','<circle cx="6" cy="7" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="7" r="2"/><path d="M3 14v-2a3 3 0 016 0v2M9 13.500v-2.500a3 3 0 016 0v2.500M15 14v-2a3 3 0 016 0v2M5 21V14h14v7"/>');
/* --- takma adlar (Türkçe + tip kimlikleri + olası alternatifler) --- */
var AL={event:'bell',levelup:'star',ok:'check',err:'warn',notify:'bell',  coins:'coin_stack',drop:'water',flame:'fire',lightning:'thunder',blast:'explosion',sprout:'plant',sparkle:'creation',speaker:'sound',helm:'anchor',sav:'war',med:'city',loj:'cargo',yik:'blackhole',yar:'creation',savasci:'war',medeniyet:'city',lojistik:'cargo',yikici:'blackhole',yaratici:'creation',
  kilic:'sword',kilic_:'swords',savas:'war',sehir:'city',ciftlik:'farm',maden:'mine',fabrika:'factory',kule:'tower',uydu:'satellite',kalkan:'shield',kara_delik:'blackhole',
  asteroit:'asteroid',volkan:'volcano',deprem:'quake',yagmur:'rain',firtina:'storm',ruzgar:'wind',simsek:'thunder',buz:'ice',ates:'fire',sel:'flood',goktasi:'meteor',
  kuyruklu_yildiz:'comet',supernova:'supernova',gezegen:'planet',yumurta:'egg',para:'coin',altin:'gold',kristal:'crystal',su:'water',yemek:'food',enerji:'energy',
  yakit:'fuel',uranyum:'uranium',karbon:'carbon',oksijen:'oxygen',hidrojen:'hydrogen',silikon:'silicon',bakir:'copper',lityum:'lithium',gaz:'gas',demir:'iron',
  nufus:'population',bilgi:'knowledge',insan:'human',hayvan:'animal',kus:'bird',balik:'fish',bocek:'insect',bitki:'plant',agac:'tree',cicek:'flower',hucre:'cell',
  roket:'rocket',gemi:'ship',top:'cannon',fuze:'missile',duvar:'wall',okul:'school',pazar:'market',banka:'bank',yol:'road',kopru:'bridge',ev:'house',tapinak:'temple',
  hastane:'hospital',sondaj:'drill',kamyon:'truck',tren:'train',vinc:'crane',depo:'warehouse',anten:'antenna',teleskop:'telescope',robot:'robot',tank:'tank',
  lazer:'laser',bomba:'bomb',nukleer:'nuke',baris:'peace',ticaret:'trade',ayarlar:'settings',ses:'sound',muzik:'music',kilit:'lock',hedef:'target',harita:'map',
  ayar:'settings',menu:'menu',geri:'back',kapat:'close',gorev:'mission',rozet:'badge',hikaye:'story',galaksi:'galaxy',bulutsu:'nebula',yildiz:'star',guneş:'sun',gunes:'sun',
  ay:'moon',bulut:'cloud',patlama:'explosion',radyasyon:'radiation',yercekimi:'gravity',manyetik:'magnet',atom:'atom',molekul:'molecule',dna:'dna',tohum:'seed',
  odun:'wood',tas:'stone',plazma:'plasma',kozmetik:'palette',diplomasi:'diplomacy',dost:'handshake',saldiri:'attack',savunma:'shield',uretim:'factory',gelistir:'evolution',
  attack:'target',defense:'shield',craft:'hammer',build:'construction',launch:'ship_launch',cargo_ship:'ship',spark:'creation',explode:'explosion',blackhole:'blackhole',
  hizmet:'wrench',teknoloji:'tech',yildirim:'thunder',kar:'snow',snowflake:'snow',drought:'drought',kuraklik:'drought',salgin:'plague',tutulma:'eclipse',sinyal:'signal',
  uzayli:'alien',dalga:'wave',kasirga:'tornado',gokkusagi:'rainbow',mantar:'mushroom',balina:'whale',mikrop:'microbe',kuru:'skull',kafatasi:'skull',ordu:'barracks',
  kisla:'barracks',santral:'powerplant',reaktor:'reactor',guneş_paneli:'solar',lab:'lab',laboratuvar:'lab',liman:'port',radar:'radar',sistem:'gear',dis:'gear'};
function norm(n){return String(n==null?'':n).toLowerCase().replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
function resolve(n){if(I[n])return n;var k=norm(n);if(I[k])return k;if(AL[k]&&I[AL[k]])return AL[k];var k2=k.replace(/_/g,'');for(var a in I)if(a.replace(/_/g,'')===k2)return a;return'unknown';}
E.ICONS=I;E.ALIAS=AL;E.has=function(n){return resolve(n)!=='unknown'||n==='unknown';};E.resolve=resolve;
function svgOf(name,o){
  o=o||{};var nm=resolve(name),sz=o.size||24,sw=o.stroke||1.7;
  return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="'+sz+'" height="'+sz+'" fill="none" stroke="currentColor" stroke-width="'+sw+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+I[nm]+'</svg>';
}
E.iconSvg=svgOf;
E.icon=function(name,o){
  o=o||{};var el=document.createElement('span');el.className='ic ic-'+resolve(name);
  el.style.display='inline-flex';el.style.width=el.style.height=(o.size||24)+'px';el.style.flex='none';el.style.alignItems='center';el.style.justifyContent='center';
  if(o.color)el.style.color=o.color;
  if(o.glow)el.style.filter='drop-shadow(0 0 '+(o.size?Math.max(3,o.size/6):4)+'px '+(o.glow===true?(o.color||'currentColor'):o.glow)+')';
  el.innerHTML=svgOf(name,o);
  if(o.fill){var s=el.firstChild;s.setAttribute('fill','currentColor');s.setAttribute('fill-opacity','0.18');}
  return el;
};
})();
