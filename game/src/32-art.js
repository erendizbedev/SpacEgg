/* SpacEgg v1.0 — sanat: logo, kelime işareti ve dikey kahraman illüstrasyon (hepsi kod, dış dosya yok) */
(function(){
'use strict';
var SG=window.SG=window.SG||{};var A=SG.Art=SG.Art||{};
var TAU=Math.PI*2,PI=Math.PI,sin=Math.sin,cos=Math.cos,sqrt=Math.sqrt,abs=Math.abs,nid=0;
function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function mk(w,h){var c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;}
function rgba(c,a){return'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';}
function free(c){if(c){c.width=c.height=0;}}

/* ---------- LOGO ---------- */
function eggD(w,h){var a=w/2,t=-h/2,b=h/2;
  return'M0 '+t+'C'+w*.36+' '+t+' '+a+' '+h*.14+' '+a+' '+h*.2+'C'+a+' '+h*.4+' '+w*.28+' '+b+' 0 '+b+'C'+(-w*.28)+' '+b+' '+(-a)+' '+h*.4+' '+(-a)+' '+h*.2+'C'+(-a)+' '+h*.14+' '+(-w*.36)+' '+t+' 0 '+t+'Z';}
function iconBody(p){
  var egg=eggD(50,66);
  return'<defs>'+
  '<radialGradient id="'+p+'e" cx=".36" cy=".26" r=".95"><stop offset="0" stop-color="#FFF6CF"/><stop offset=".36" stop-color="#FFCE4A"/><stop offset=".76" stop-color="#F28A2E"/><stop offset="1" stop-color="#A63F2A"/></radialGradient>'+
  '<linearGradient id="'+p+'r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B15CFF"/><stop offset=".55" stop-color="#4DD6FF"/><stop offset="1" stop-color="#F2FDFF"/></linearGradient>'+
  '<radialGradient id="'+p+'g"><stop offset="0" stop-color="#8FF6FF" stop-opacity=".95"/><stop offset="1" stop-color="#8FF6FF" stop-opacity="0"/></radialGradient>'+
  '<clipPath id="'+p+'f"><rect x="-20" y="58" width="150" height="80"/></clipPath>'+
  '<clipPath id="'+p+'c"><path transform="translate(50 54)" d="'+egg+'"/></clipPath></defs>'+
  '<g transform="rotate(-24 50 58)"><ellipse cx="50" cy="58" rx="43" ry="13.5" fill="none" stroke="url(#'+p+'r)" stroke-width="3.4" opacity=".9"/></g>'+
  '<path transform="translate(50 54)" d="'+egg+'" fill="url(#'+p+'e)"/>'+
  '<path transform="translate(50 54)" d="'+egg+'" fill="none" stroke="#7A2E14" stroke-opacity=".35" stroke-width="1"/>'+
  '<g clip-path="url(#'+p+'c)"><circle cx="48" cy="48" r="16" fill="url(#'+p+'g)"/>'+
  '<path d="M43 30L49 39L44 45L51 53L46 60L50 70" fill="none" stroke="#6FE9FF" stroke-opacity=".6" stroke-width="4.2" stroke-linejoin="round"/>'+
  '<path d="M43 30L49 39L44 45L51 53L46 60L50 70" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>'+
  '<ellipse cx="38" cy="38" rx="6.5" ry="12" transform="rotate(-18 38 38)" fill="#fff" fill-opacity=".34"/>'+
  '<ellipse cx="50" cy="86" rx="30" ry="14" fill="#5A1E3C" fill-opacity=".28"/></g>'+
  '<g transform="rotate(-24 50 58)"><ellipse cx="50" cy="58" rx="43" ry="13.5" fill="none" stroke="url(#'+p+'r)" stroke-width="3.4" clip-path="url(#'+p+'f)"/>'+
  '<circle cx="93" cy="58" r="8" fill="url(#'+p+'g)"/><path d="M93 51.5L94.6 56.4L99.5 58L94.6 59.6L93 64.5L91.4 59.6L86.5 58L91.4 56.4Z" fill="#fff"/></g>'+
  '<circle cx="13" cy="20" r="1.3" fill="#fff"/><circle cx="24" cy="10" r=".9" fill="#CFE8FF"/><circle cx="86" cy="82" r="1.1" fill="#fff" fill-opacity=".85"/>';
}
A.logoSVG=function(px){var p='sl'+(++nid)+'_';px=px||96;
  return'<svg xmlns="http://www.w3.org/2000/svg" width="'+px+'" height="'+px+'" viewBox="0 0 100 100" role="img" aria-label="SpacEgg">'+iconBody(p)+'</svg>';};
A.wordmarkSVG=function(h){var p='sw'+(++nid)+'_';h=h||48;var w=Math.round(h*4.9);
  return'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 245 50" role="img" aria-label="SpacEgg">'+
  '<svg x="0" y="0" width="50" height="50" viewBox="0 0 100 100">'+iconBody(p)+'</svg>'+
  '<defs><linearGradient id="'+p+'t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#BFE9FF"/></linearGradient>'+
  '<linearGradient id="'+p+'y" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A0"/><stop offset="1" stop-color="#F59A2C"/></linearGradient></defs>'+
  '<text x="57" y="35" font-family="Inter,\'Segoe UI\',Roboto,system-ui,sans-serif" font-size="31" font-weight="800" textLength="186" lengthAdjust="spacingAndGlyphs" letter-spacing=".5">'+
  '<tspan fill="url(#'+p+'t)">Space</tspan><tspan fill="url(#'+p+'y)">Egg</tspan></text></svg>';};

/* ---------- ortak çizim yardımcıları ---------- */
function glow(c,x,y,r,col,a){var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,a));g.addColorStop(.4,rgba(col,a*.35));g.addColorStop(1,rgba(col,0));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function glowSprite(col,px){var c=mk(px,px),x=c.getContext('2d');glow(x,px/2,px/2,px/2,col,1);return c;}
function flareSprite(col,px){var c=mk(px,px),x=c.getContext('2d'),h=px/2;glow(x,h,h,h*.32,col,.95);
  var g=x.createLinearGradient(0,h,px,h);g.addColorStop(0,rgba(col,0));g.addColorStop(.5,rgba(col,.9));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(0,h-1,px,2);
  g=x.createLinearGradient(h,0,h,px);g.addColorStop(0,rgba(col,0));g.addColorStop(.5,rgba(col,.9));g.addColorStop(1,rgba(col,0));x.fillStyle=g;x.fillRect(h-1,0,2,px);
  x.fillStyle='#fff';x.beginPath();x.arc(h,h,px*.035,0,TAU);x.fill();return c;}
function trailSprite(col,w,h){var c=mk(w,h),x=c.getContext('2d');var g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,rgba(col,0));g.addColorStop(.6,rgba(col,.35));g.addColorStop(1,rgba([255,255,255],.95));
  x.fillStyle=g;x.beginPath();x.moveTo(0,h/2);x.quadraticCurveTo(w*.6,h*.05,w,h*.18);x.lineTo(w,h*.82);x.quadraticCurveTo(w*.6,h*.95,0,h/2);x.fill();return c;}
function blob(c,x,y,r,col,a){var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,a));g.addColorStop(1,rgba(col,0));c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);}

/* ---------- galaksi sprite ---------- */
function spiral(sz,S,r,warm,cool,arms,turns){
  var c=mk(sz*S,sz*S),x=c.getContext('2d');x.scale(S,S);var h=sz/2,R=h*.94;x.globalCompositeOperation='lighter';
  glow(x,h,h,R*.55,warm,.55);glow(x,h,h,R*.14,[255,248,225],.9);
  var N=Math.round(1500*(sz/150)+700);
  for(var k=0;k<arms;k++){for(var i=0;i<N/arms;i++){
    var t=Math.pow(r(),.8),th=k*TAU/arms+t*turns+ (r()-.5)*.35,rad=t*R,sp=(.03+.1*t)*R;
    var px=h+cos(th)*rad+(r()-.5)*sp*2,py=h+sin(th)*rad+(r()-.5)*sp*2;
    var m=t,col=[warm[0]+(cool[0]-warm[0])*m|0,warm[1]+(cool[1]-warm[1])*m|0,warm[2]+(cool[2]-warm[2])*m|0];
    var a=(.12+r()*.4)*(1-t*.55),sr=.3+r()*(.8+t*.8);
    x.fillStyle=rgba(col,a);x.beginPath();x.arc(px,py,sr,0,TAU);x.fill();
    if(r()<.035){x.fillStyle=rgba([255,120,190],.5);x.beginPath();x.arc(px,py,sr*1.6,0,TAU);x.fill();}
    if(r()<.02){glow(x,px,py,3+r()*3,[190,225,255],.6);}}}
  for(k=0;k<arms;k++){for(var j=0;j<46;j++){var tt=.06+j/46*.94,th2=k*TAU/arms+tt*turns,rd=tt*R,mc=tt,cc=[warm[0]+(cool[0]-warm[0])*mc|0,warm[1]+(cool[1]-warm[1])*mc|0,warm[2]+(cool[2]-warm[2])*mc|0];
    glow(x,h+cos(th2)*rd,h+sin(th2)*rd,R*(.07+.06*tt),cc,.075*(1-tt*.5));}}
  glow(x,h,h,R*.9,cool,.05);glow(x,h,h,R*.3,warm,.3);
  return c;}

/* ---------- gezegenler ---------- */
function gasPlanet(c,x,y,R,r){
  c.save();c.beginPath();c.arc(x,y,R,0,TAU);c.clip();
  var g=c.createLinearGradient(x,y-R,x,y+R);g.addColorStop(0,'#7a45c4');g.addColorStop(.45,'#d8649f');g.addColorStop(1,'#4a2488');c.fillStyle=g;c.fillRect(x-R,y-R,2*R,2*R);
  c.save();c.translate(x,y);c.rotate(-.24);
  var pal=[[255,190,150],[120,60,200],[255,120,180],[90,40,160],[255,220,190],[200,80,170]];
  for(var i=0;i<12;i++){var by=-R+(i+r()*.5)*(2*R/12),bh=R*(.05+r()*.12),col=pal[i%pal.length];
    c.fillStyle=rgba(col,.22+r()*.22);c.beginPath();c.moveTo(-R,by);c.bezierCurveTo(-R*.3,by+(r()-.5)*R*.16,R*.3,by+(r()-.5)*R*.16,R,by);
    c.lineTo(R,by+bh);c.bezierCurveTo(R*.3,by+bh+(r()-.5)*R*.12,-R*.3,by+bh+(r()-.5)*R*.12,-R,by+bh);c.fill();}
  c.fillStyle='rgba(255,230,210,.45)';c.beginPath();c.ellipse(R*.22,R*.2,R*.2,R*.1,0,0,TAU);c.fill();c.fillStyle='rgba(120,40,110,.4)';c.beginPath();c.ellipse(R*.22,R*.2,R*.12,R*.06,0,0,TAU);c.fill();
  c.restore();
  g=c.createRadialGradient(x-R*.5,y-R*.45,R*.05,x-R*.2,y-R*.15,R*1.7);g.addColorStop(0,'rgba(255,235,255,.32)');g.addColorStop(.4,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(3,0,20,.88)');c.fillStyle=g;c.fillRect(x-R,y-R,2*R,2*R);
  c.restore();
  c.strokeStyle='rgba(255,200,250,.35)';c.lineWidth=1.2;c.beginPath();c.arc(x,y,R-.5,PI*1.05,PI*1.75);c.stroke();}
function ringHalf(c,x,y,R,back,r){
  c.save();c.translate(x,y);c.rotate(-.3);var n=16;
  for(var i=0;i<n;i++){var f=1.38+i*.056,a=.12+r()*.34;if(i%5===3)a*=.25;
    c.strokeStyle=i<5?rgba([255,210,170],a):i<11?rgba([210,160,255],a):rgba([140,210,255],a*.9);c.lineWidth=R*(.035+r()*.03);
    c.beginPath();c.ellipse(0,0,R*f,R*f*.26,0,back?PI:0,back?TAU:PI);c.stroke();}
  c.restore();}
function bigPlanet(c,W,H,u,r,cx,cy,R,hy){
  c.save();c.globalCompositeOperation='lighter';
  var g=c.createRadialGradient(cx,cy,R*.985,cx,cy,R*1.14);
  g.addColorStop(0,'rgba(130,245,255,.0)');g.addColorStop(.06,'rgba(140,248,255,.7)');g.addColorStop(.2,'rgba(90,170,255,.3)');g.addColorStop(.55,'rgba(110,60,230,.1)');g.addColorStop(1,'rgba(60,20,160,0)');
  c.fillStyle=g;c.beginPath();c.arc(cx,cy,R*1.14,0,TAU);c.fill();c.restore();
  c.save();c.beginPath();c.arc(cx,cy,R,0,TAU);c.clip();
  g=c.createLinearGradient(0,hy,0,hy+H*.4);g.addColorStop(0,'#123a5e');g.addColorStop(.12,'#0a2140');g.addColorStop(.5,'#060d26');g.addColorStop(1,'#02030c');c.fillStyle=g;c.fillRect(0,hy-10,W,H);
  function sy(x){return cy-sqrt(Math.max(0,R*R-(x-cx)*(x-cx)));}
  for(var i=0;i<46;i++){var x=r()*W,y=sy(x)+Math.pow(r(),1.3)*H*.2;
    blob(c,x,y,u*(.05+r()*.16),r()<.5?[30,130,150]:[100,70,170],.07+r()*.07);}
  c.globalCompositeOperation='lighter';blob(c,cx+(W*.8-cx)*.9,sy(W*.8)+H*.03,u*.7,[255,200,150],.07);blob(c,cx,sy(cx)+H*.05,u*.9,[40,150,190],.06);c.globalCompositeOperation='source-over';
  c.strokeStyle='rgba(200,240,255,.07)';c.lineWidth=2;for(i=0;i<12;i++){x=r()*W;y=sy(x)+r()*H*.14;c.beginPath();c.ellipse(x,y,u*(.1+r()*.2),u*.012,0,PI*.1,PI*.9);c.stroke();}
  var cl=[];for(i=0;i<10;i++){x=r()*W;cl.push([x,sy(x)+H*(.025+r()*.12)]);}
  for(i=0;i<260;i++){var q=cl[i%10],px=q[0]+(r()+r()+r()-1.5)*u*.22,py=q[1]+(r()+r()-1)*H*.05;if(py<sy(px)+2)continue;
    c.fillStyle=r()<.7?rgba([255,205,120],.3+r()*.6):rgba([160,235,255],.3+r()*.6);c.fillRect(px,py,.8+r()*1.1,.8+r()*1.1);}
  c.restore();
  c.save();c.beginPath();c.arc(cx,cy,R,PI*1.12,PI*1.88);c.lineCap='round';
  c.strokeStyle='rgba(150,235,255,.2)';c.lineWidth=7;c.stroke();c.strokeStyle='rgba(190,245,255,.45)';c.lineWidth=3;c.stroke();c.strokeStyle='rgba(235,252,255,.9)';c.lineWidth=1.3;c.stroke();c.restore();
  return sy;}

/* ---------- medeniyetler ---------- */
function civTowers(c,bx,by,ang,u,r,lights){
  c.save();c.translate(bx,by);c.rotate(ang);var w=.34*u,ca=cos(ang),sa=sin(ang);
  c.save();c.scale(1,.3);glow(c,0,0,.26*u,[255,170,90],.4);c.restore();
  var tops=[],n=15;
  for(var i=0;i<n;i++){
    var x=-w/2+i*(w/(n-1))+(r()-.5)*.01*u,mid=1-abs(i-7)/7.5,hg=u*(.035+mid*.1*(.55+r()*.45)+r()*.02),tw=u*(.013+r()*.012);
    var g=c.createLinearGradient(0,-hg,0,0);g.addColorStop(0,'#241d5c');g.addColorStop(1,'#07061a');c.fillStyle=g;c.fillRect(x-tw/2,-hg,tw,hg+1);
    c.fillStyle='rgba(130,225,255,.55)';c.fillRect(x-tw/2,-hg,Math.max(.7,u*.0015),hg);
    for(var yy=hg-u*.008;yy>u*.006;yy-=u*.0075){for(var k=0;k<2;k++){if(r()<.42){var wx=x-tw/2+tw*(.22+k*.42),wy=-yy;
      if(r()<.16){lights.push(bx+wx*ca-wy*sa,by+wx*sa+wy*ca,r()<.6?0:1,r()*6);}
      else{c.fillStyle=r()<.7?'rgba(255,214,130,.9)':'rgba(140,240,255,.9)';c.fillRect(wx,wy,u*.0032,u*.0032);}}}}
    if(r()<.55){c.strokeStyle='#2c2a66';c.lineWidth=.8;c.beginPath();c.moveTo(x,-hg);c.lineTo(x,-hg-u*(.015+r()*.025));c.stroke();c.fillStyle='rgba(255,90,100,.95)';c.fillRect(x-.7,-hg-u*.04,1.5,1.5);}
    if(hg>u*.09)tops.push([x,-hg]);}
  c.strokeStyle='rgba(90,235,255,.5)';c.lineWidth=1;
  for(i=0;i<tops.length-1;i++){var a=tops[i],b=tops[i+1];c.beginPath();c.moveTo(a[0],a[1]+2);c.quadraticCurveTo((a[0]+b[0])/2,Math.min(a[1],b[1])+u*.03,b[0],b[1]+2);c.stroke();}
  var top=tops[Math.floor(tops.length/2)]||[0,-u*.14];glow(c,top[0],top[1]-u*.01,u*.05,[120,240,255],.8);
  c.restore();}
function civDome(c,bx,by,ang,u,r,lights){
  c.save();c.translate(bx,by);c.rotate(ang);var rx=.15*u,ry=.105*u,ca=cos(ang),sa=sin(ang);
  glow(c,0,-ry*.5,rx*1.8,[70,255,220],.22);
  for(var i=0;i<13;i++){var f=(i/12-.5)*2,x=f*rx*1.55+(r()-.5)*u*.01,hg=u*(.04+r()*.1)*(1-abs(f)*.45),tw=u*(.012+r()*.014);
    var g=c.createLinearGradient(x,0,x,-hg);g.addColorStop(0,'rgba(60,255,210,.95)');g.addColorStop(.6,'rgba(150,170,255,.95)');g.addColorStop(1,'rgba(255,230,255,.98)');
    c.fillStyle=g;c.beginPath();c.moveTo(x-tw,0);c.lineTo(x-tw*.15,-hg);c.lineTo(x+tw*.7,-hg*.8);c.lineTo(x+tw,0);c.closePath();c.fill();
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=.7;c.beginPath();c.moveTo(x-tw*.2,-hg);c.lineTo(x-tw*.1,-hg*.2);c.stroke();}
  var g2=c.createRadialGradient(0,-ry*.25,ry*.05,0,-ry*.2,rx);g2.addColorStop(0,'rgba(200,255,250,.5)');g2.addColorStop(.6,'rgba(70,230,230,.28)');g2.addColorStop(1,'rgba(90,120,255,.34)');
  c.fillStyle=g2;c.beginPath();c.ellipse(0,0,rx,ry,0,PI,TAU);c.closePath();c.fill();
  for(i=0;i<8;i++){var bx2=(i/7-.5)*rx*1.5,bh=ry*(.25+r()*.4)*(1-abs(bx2/rx)*.6),bw=rx*.07;c.fillStyle='rgba(8,18,40,.78)';c.beginPath();c.moveTo(bx2-bw,0);c.lineTo(bx2-bw,-bh);c.arc(bx2,-bh,bw,PI,TAU);c.lineTo(bx2+bw,0);c.fill();
    var wx=bx2,wy=-bh*.55;if(r()<.5)lights.push(bx+wx*ca-wy*sa,by+wx*sa+wy*ca,0,r()*6);else{c.fillStyle='rgba(255,220,140,.95)';c.fillRect(wx-1,wy,2,2);}}
  c.strokeStyle='rgba(190,255,255,.4)';c.lineWidth=.8;for(i=1;i<6;i++){var a=PI+i*PI/6;c.beginPath();c.moveTo(0,0);c.lineTo(cos(a)*rx,sin(a)*ry);c.stroke();}
  for(i=1;i<4;i++){c.beginPath();c.ellipse(0,0,rx*(1-i*.22),ry*(1-i*.22),0,PI,TAU);c.stroke();}
  c.strokeStyle='rgba(215,255,255,.95)';c.lineWidth=1.6;c.beginPath();c.ellipse(0,0,rx,ry,0,PI,TAU);c.stroke();
  c.fillStyle='rgba(100,255,230,.5)';c.fillRect(-rx*1.05,-1,rx*2.1,2.2);
  c.restore();}
function platSprite(w,S,r){
  var pw=w*1.5,ph=w*1.2,c=mk(pw*S,ph*S),x=c.getContext('2d');x.scale(S,S);var cx=pw/2,top=ph*.5;
  var g=x.createLinearGradient(cx,top+w*.45,cx,top);g.addColorStop(0,'rgba(80,255,230,.0)');g.addColorStop(1,'rgba(80,255,230,.28)');
  x.fillStyle=g;x.beginPath();x.moveTo(cx-w*.3,top+w*.12);x.lineTo(cx-w*.5,top+w*.62);x.lineTo(cx+w*.5,top+w*.62);x.lineTo(cx+w*.3,top+w*.12);x.fill();
  g=x.createLinearGradient(cx,top,cx,top+w*.34);g.addColorStop(0,'#3a4f78');g.addColorStop(1,'#0a1228');x.fillStyle=g;
  x.beginPath();x.moveTo(cx-w*.5,top);x.quadraticCurveTo(cx-w*.38,top+w*.16,cx-w*.1,top+w*.36);x.lineTo(cx,top+w*.4);x.lineTo(cx+w*.1,top+w*.36);x.quadraticCurveTo(cx+w*.38,top+w*.16,cx+w*.5,top);x.closePath();x.fill();
  x.fillStyle='#6fe9ff';x.beginPath();x.ellipse(cx,top+w*.34,w*.025,w*.045,0,0,TAU);x.fill();
  x.fillStyle='#8fb4d8';x.beginPath();x.ellipse(cx,top,w*.5,w*.07,0,0,TAU);x.fill();
  x.fillStyle='#2b3f66';x.beginPath();x.ellipse(cx,top-w*.005,w*.46,w*.05,0,0,TAU);x.fill();
  var n=3+Math.floor(r()*3);for(var i=0;i<n;i++){var bx=cx+(i/(n-1)-.5)*w*.7,bh=w*(.1+r()*.16),bw=w*.055;
    x.fillStyle='#0b1430';x.beginPath();x.moveTo(bx-bw,top);x.lineTo(bx-bw,top-bh);if(r()<.5)x.arc(bx,top-bh,bw,PI,TAU);else{x.lineTo(bx,top-bh-bw*1.6);x.lineTo(bx+bw,top-bh);}x.lineTo(bx+bw,top);x.fill();
    x.fillStyle='rgba(255,220,140,.95)';x.fillRect(bx-1,top-bh*.6,1.6,1.6);x.fillStyle='rgba(120,240,255,.95)';x.fillRect(bx,top-bh*.3,1.6,1.6);}
  glow(x,cx,top-w*.3,w*.12,[120,240,255],.35);
  return{c:c,w:pw,h:ph,ax:cx,ay:top};}

/* ---------- uzay araçları (burun +x yönünde, birim = gövde uzunluğu) ---------- */
function shipSprite(kind,L,S,r){
  var pw=L*1.24,ph=L*(kind===1?.9:kind===2?.8:kind===3?.55:.42),c=mk(pw*S,ph*S),x=c.getContext('2d');x.scale(S,S);x.translate(pw/2,ph/2);x.scale(L,L);
  var lw=1/L;
  function vg(y0,y1,st){var g=x.createLinearGradient(0,y0,0,y1);for(var i=0;i<st.length;i++)g.addColorStop(st[i][0],st[i][1]);return g;}
  if(kind===1){
    function wing(s){var g=vg(0,s*.36,[[0,'#8fa7d6'],[1,'#26335c']]);x.fillStyle=g;x.beginPath();x.moveTo(.16,s*.05);x.lineTo(-.26,s*.33);x.lineTo(-.46,s*.35);x.lineTo(-.32,s*.07);x.closePath();x.fill();
      x.strokeStyle='rgba(180,230,255,.7)';x.lineWidth=lw;x.beginPath();x.moveTo(.16,s*.05);x.lineTo(-.26,s*.33);x.stroke();
      x.fillStyle=s<0?'#ff4a6a':'#4aff9a';x.beginPath();x.arc(-.46,s*.35,.018,0,TAU);x.fill();}
    wing(-1);wing(1);
    x.fillStyle=vg(-.1,.1,[[0,'#f4fbff'],[.45,'#9db8e6'],[.75,'#4b5f8c'],[1,'#18223f']]);
    x.beginPath();x.moveTo(.5,0);x.bezierCurveTo(.34,-.04,.22,-.085,.02,-.095);x.lineTo(-.34,-.085);x.lineTo(-.5,-.05);x.lineTo(-.5,.05);x.lineTo(-.34,.085);x.lineTo(.02,.095);x.bezierCurveTo(.22,.085,.34,.04,.5,0);x.fill();
    x.strokeStyle='rgba(255,255,255,.75)';x.lineWidth=lw*1.2;x.beginPath();x.moveTo(.5,0);x.bezierCurveTo(.34,-.04,.22,-.085,.02,-.095);x.lineTo(-.34,-.085);x.stroke();
    x.strokeStyle='rgba(20,30,60,.6)';x.lineWidth=lw*.8;x.beginPath();x.moveTo(-.2,-.09);x.lineTo(-.2,.09);x.moveTo(.05,-.094);x.lineTo(.05,.094);x.stroke();
    var gc=x.createLinearGradient(.1,0,.32,0);gc.addColorStop(0,'#59e7ff');gc.addColorStop(1,'#f2ffff');x.fillStyle=gc;x.beginPath();x.ellipse(.2,0,.12,.032,0,0,TAU);x.fill();
    glow(x,-.5,-.035,.07,[90,230,255],.9);glow(x,-.5,.035,.07,[90,230,255],.9);
  }else if(kind===2){
    x.fillStyle=vg(-.1,.1,[[0,'#eaffff'],[.4,'#7fd8e8'],[.8,'#2a5a86'],[1,'#10234a']]);x.beginPath();x.ellipse(.02,0,.38,.09,0,0,TAU);x.fill();
    x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(.08,-.03,.24,.02,0,0,TAU);x.fill();
    glow(x,.32,0,.09,[170,255,255],.9);
    var g=x.createLinearGradient(0,-.3,0,.3);g.addColorStop(0,'#c58aff');g.addColorStop(.5,'#5fe0ff');g.addColorStop(1,'#b15cff');
    x.strokeStyle='rgba(120,90,255,.35)';x.lineWidth=.085;x.beginPath();x.ellipse(-.06,0,.07,.31,0,0,TAU);x.stroke();
    x.strokeStyle=g;x.lineWidth=.04;x.beginPath();x.ellipse(-.06,0,.07,.31,0,0,TAU);x.stroke();
    for(var i=0;i<10;i++){var a=i/10*TAU;x.fillStyle=i%3?'#ffffff':'#ffd27a';x.beginPath();x.arc(-.06+cos(a)*.07,sin(a)*.31,.012,0,TAU);x.fill();}
    glow(x,-.4,-.045,.05,[160,120,255],.9);glow(x,-.4,0,.05,[160,120,255],.9);glow(x,-.4,.045,.05,[160,120,255],.9);
  }else if(kind===3){
    var gh=x.createLinearGradient(-.5,0,.5,0);gh.addColorStop(0,'#5a2cff');gh.addColorStop(.5,'#c04bff');gh.addColorStop(1,'#6fe9ff');
    x.fillStyle=gh;x.beginPath();x.moveTo(.5,0);x.lineTo(.12,-.11);x.lineTo(-.2,-.07);x.lineTo(-.5,-.025);x.lineTo(-.34,0);x.lineTo(-.5,.025);x.lineTo(-.2,.07);x.lineTo(.12,.11);x.closePath();x.fill();
    x.fillStyle='rgba(255,255,255,.28)';x.beginPath();x.moveTo(.5,0);x.lineTo(.12,-.11);x.lineTo(-.2,-.07);x.lineTo(-.34,0);x.closePath();x.fill();
    x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=lw;x.beginPath();x.moveTo(.5,0);x.lineTo(-.34,0);x.moveTo(.12,-.11);x.lineTo(.12,.11);x.stroke();
    glow(x,-.05,0,.2,[255,255,255],.45);x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.ellipse(0,0,.22,.016,0,0,TAU);x.fill();
    for(var s=-1;s<=1;s+=2){x.fillStyle='rgba(180,240,255,.9)';x.beginPath();x.moveTo(.0,s*.2);x.lineTo(.03,s*.23);x.lineTo(.0,s*.27);x.lineTo(-.03,s*.23);x.closePath();x.fill();glow(x,0,s*.23,.06,[140,230,255],.55);}
    glow(x,-.5,0,.06,[255,90,210],.9);
  }else{
    x.fillStyle=vg(-.13,.09,[[0,'#7b8db0'],[.4,'#394a6e'],[1,'#0b1226']]);
    x.beginPath();x.moveTo(.5,.005);x.lineTo(.38,-.07);x.lineTo(.05,-.075);x.lineTo(-.04,-.125);x.lineTo(-.18,-.125);x.lineTo(-.22,-.075);x.lineTo(-.46,-.08);x.lineTo(-.5,-.05);x.lineTo(-.5,.06);x.lineTo(-.46,.09);x.lineTo(.22,.09);x.lineTo(.38,.06);x.closePath();x.fill();
    x.strokeStyle='rgba(190,215,255,.55)';x.lineWidth=lw;x.beginPath();x.moveTo(.5,.005);x.lineTo(.38,-.07);x.lineTo(.05,-.075);x.lineTo(-.04,-.125);x.lineTo(-.18,-.125);x.lineTo(-.22,-.075);x.lineTo(-.46,-.08);x.stroke();
    for(var rr=0;rr<3;rr++)for(var xx=-.43;xx<.3;xx+=.021){if(r()<.72){x.fillStyle=r()<.8?'rgba(255,206,120,.95)':'rgba(130,235,255,.95)';x.fillRect(xx,-.04+rr*.038,.011,.007);}}
    x.fillStyle='rgba(140,240,255,.95)';x.fillRect(-.16,-.113,.1,.012);x.fillStyle='rgba(255,245,210,.95)';x.fillRect(.1,.055,.13,.014);
    x.strokeStyle='#44577c';x.lineWidth=lw;x.beginPath();x.moveTo(-.1,-.125);x.lineTo(-.1,-.18);x.stroke();x.fillStyle='#ff4a5a';x.beginPath();x.arc(-.1,-.18,.01,0,TAU);x.fill();
    for(var e=0;e<4;e++){var ey=-.045+e*.035;x.fillStyle='#1a233f';x.fillRect(-.52,ey-.013,.04,.026);glow(x,-.52,ey,.055,e%2?[255,140,70]:[255,210,150],.95);}
  }
  return{c:c,w:pw,h:ph,L:L};}

/* ---------- katmanları kur ---------- */
var MRG=12;
function build(W,H,S,q){
  var u=Math.min(W,H*.52),r=rng(20261117),L={W:W,H:H,S:S,q:q,u:u};
  var cx=W/2,R=1.15*Math.max(W,H*.5),hy=.745*H,cy=hy+R;L.cx=cx;L.cy=cy;L.R=R;
  function sy(x){return cy-sqrt(Math.max(0,R*R-(x-cx)*(x-cx)));}
  var base=mk((W+2*MRG)*S,(H+2*MRG)*S),c=base.getContext('2d');c.scale(S,S);c.translate(MRG,MRG);
  var g=c.createLinearGradient(0,-MRG,0,H+MRG);g.addColorStop(0,'#02010a');g.addColorStop(.28,'#080527');g.addColorStop(.6,'#150b44');g.addColorStop(.78,'#1c1458');g.addColorStop(1,'#050816');
  c.fillStyle=g;c.fillRect(-MRG,-MRG,W+2*MRG,H+2*MRG);
  c.globalCompositeOperation='lighter';
  var neb=[{x:.2,y:.30,w:.45,h:.22,c:[120,50,255],a:.075},{x:.78,y:.52,w:.4,h:.16,c:[20,190,200],a:.06},{x:.75,y:.12,w:.4,h:.14,c:[60,90,255],a:.08},{x:.3,y:.57,w:.4,h:.1,c:[255,60,170],a:.05},{x:.5,y:.08,w:.5,h:.08,c:[170,60,255],a:.05}];
  for(var i=0;i<neb.length;i++){var n=neb[i];for(var k=0;k<15;k++){blob(c,(n.x+(r()-.5)*n.w*1.3)*W,(n.y+(r()-.5)*n.h*1.4)*H,u*(.12+r()*.28),n.c,n.a*(.5+r()));}}
  c.globalCompositeOperation='source-over';
  for(i=0;i<9;i++){blob(c,r()*W,(.1+r()*.55)*H,u*(.1+r()*.2),[1,0,10],.28);}
  c.globalCompositeOperation='lighter';
  var ns=Math.round(W*H/820);for(i=0;i<ns;i++){var sz=.5+r()*r()*1.3,col=r()<.12?[255,220,170]:r()<.3?[170,200,255]:[235,242,255];c.fillStyle=rgba(col,.25+r()*.65);c.fillRect(r()*W,r()*H*.8,sz,sz);}
  c.globalCompositeOperation='source-over';
  /* halkalı gaz devi */
  var px=.235*W,py=.365*H,pr=.165*u;
  glow(c,px,py,pr*2.4,[190,90,255],.16);ringHalf(c,px,py,pr,true,r);gasPlanet(c,px,py,pr,r);ringHalf(c,px,py,pr,false,r);
  /* küçük uzak gezegen */
  var mx=.86*W,my=.275*H,mr=.034*u;c.save();c.beginPath();c.arc(mx,my,mr,0,TAU);c.clip();g=c.createRadialGradient(mx-mr*.4,my-mr*.4,mr*.1,mx,my,mr*1.2);g.addColorStop(0,'#bff4ff');g.addColorStop(.5,'#4a8fd0');g.addColorStop(1,'#0a1030');c.fillStyle=g;c.fillRect(mx-mr,my-mr,2*mr,2*mr);c.restore();
  /* büyük gezegen ve parlak yıldız */
  var sunx=.8*W;c.globalCompositeOperation='lighter';glow(c,sunx,sy(sunx)-2,u*.55,[255,230,190],.42);glow(c,sunx,sy(sunx)-2,u*.18,[255,255,245],.7);c.globalCompositeOperation='source-over';
  bigPlanet(c,W,H,u,r,cx,cy,R,hy);
  c.globalCompositeOperation='lighter';glow(c,sunx,sy(sunx)+1,u*.12,[255,255,255],.55);c.globalCompositeOperation='source-over';
  /* medeniyetler */
  var lights=[],pl=[];
  function ang(x){return Math.asin(SG_clamp((x-cx)/R,-1,1));}
  function SG_clamp(v,a,b){return v<a?a:v>b?b:v;}
  var x1=.2*W,x2=.5*W,x3=.82*W;
  civTowers(c,x1,sy(x1)+1,ang(x1),u,r,lights);civDome(c,x2,sy(x2)+1,ang(x2),u,r,lights);
  c.save();c.translate(x3,sy(x3)+1);c.rotate(ang(x3));c.fillStyle='#07091c';c.beginPath();c.moveTo(-.12*u,0);c.lineTo(-.08*u,-.028*u);c.lineTo(-.03*u,-.02*u);c.lineTo(.02*u,-.04*u);c.lineTo(.07*u,-.022*u);c.lineTo(.12*u,0);c.fill();
  glow(c,0,-.01*u,.2*u,[255,200,140],.14);c.restore();
  var plan=[[-.1,-.12,.13],[.03,-.2,.1],[.12,-.09,.08],[-.03,-.29,.065]],a3=ang(x3),ca=cos(a3),sa=sin(a3),by3=sy(x3)+1;
  for(i=0;i<plan.length;i++){var pp=plan[i],lx=pp[0]*u,ly=pp[1]*u,sp=platSprite(pp[2]*u,S,r);
    sp.x=x3+lx*ca-ly*sa;sp.y=by3+lx*sa+ly*ca;sp.ph=i*1.7;pl.push(sp);}
  L.base=base;if(lights.length>forQ(q))lights.length=forQ(q);L.lights=new Float32Array(lights);L.plats=pl;L.sy=sy;L.sunx=sunx;
  /* galaksiler */
  var gs=[{x:.72,y:.125,sz:.92*u,ft:.5,rot:-.45,warm:[255,226,170],cool:[130,170,255],arms:2,turns:4.6,seed:7},
          {x:.12,y:.075,sz:.34*u,ft:.62,rot:.5,warm:[255,200,230],cool:[160,150,255],arms:2,turns:3.6,seed:11},
          {x:.9,y:.46,sz:.44*u,ft:.28,rot:.7,warm:[255,236,200],cool:[150,200,255],arms:2,turns:3.2,seed:19}];
  L.gal=[];for(i=0;i<gs.length;i++){var G=gs[i];L.gal.push({c:spiral(G.sz,S,rng(G.seed*99),G.warm,G.cool,G.arms,G.turns),x:G.x*W,y:G.y*H,sz:G.sz,ft:G.ft,rot:G.rot});}
  /* galaksileri tabana pişir: kare başına büyük döndürmeli karıştırma yok */
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.9;
  for(i=0;i<L.gal.length;i++){var GG=L.gal[i];c.save();c.translate(GG.x,GG.y);c.rotate(GG.rot);c.scale(1,GG.ft);c.drawImage(GG.c,-GG.sz/2,-GG.sz/2,GG.sz,GG.sz);c.restore();free(GG.c);}
  c.restore();L.gal=[];
  /* yıldız ışıltıları */
  var nt=q>=3?44:q>=2?30:14;L.tw=new Float32Array(nt*5);
  for(i=0;i<nt;i++){var o=i*5;L.tw[o]=r()*W;L.tw[o+1]=r()*H*.74;L.tw[o+2]=r()*TAU;L.tw[o+3]=.6+r()*1.8;L.tw[o+4]=.8+r()*1.3;}
  L.flare=flareSprite([220,235,255],64);L.fl=[];for(i=0;i<(q>=2?7:3);i++)L.fl.push(r()*W,r()*H*.62,r()*TAU,.5+r()*.7);
  L.g_amb=glowSprite([255,200,120],24);L.g_cy=glowSprite([120,240,255],24);
  L.ss={t:3+r()*3,age:-1,x:0,y:0,vx:0,vy:0,spr:trailSprite([200,230,255],96,6)};
  /* uzay araçları */
  var sc=W/390,defs=[{k:3,len:.15*u,y:.215,x:.18,vx:13,d:1,amp:3,ph:1.2,col:[255,90,200]},
    {k:1,len:.29*u,y:.49,x:.55,vx:27,d:1,amp:2.5,ph:0,col:[90,225,255]},
    {k:2,len:.23*u,y:.555,x:.3,vx:11,d:-1,amp:3,ph:2.1,col:[150,120,255]},
    {k:4,len:.64*u,y:.605,x:.82,vx:6.5,d:-1,amp:1.6,ph:4,col:[255,170,70]}];
  L.ships=[];for(i=0;i<defs.length;i++){var d=defs[i];if(q<2&&d.k===3)continue;
    var s=shipSprite(d.k,d.len,S,rng(d.k*31));s.k=d.k;s.x=d.x*W;s.y0=d.y*H;s.vx=d.vx*sc;s.d=d.d;s.amp=d.amp;s.ph=d.ph;
    s.tr=trailSprite(d.col,128,16);s.trl=d.len*(d.k===4?.5:d.k===1?.7:.55);s.trh=d.len*(d.k===4?.14:.1);s.eg=glowSprite(d.col,32);L.ships.push(s);}
  return L;}

function forQ(q){return q>=3?320:q>=2?160:0;}
function dispose(L){if(!L)return;free(L.base);for(var i=0;i<L.gal.length;i++)free(L.gal[i].c);for(i=0;i<L.plats.length;i++)free(L.plats[i].c);
  for(i=0;i<L.ships.length;i++){free(L.ships[i].c);free(L.ships[i].tr);free(L.ships[i].eg);}free(L.flare);free(L.g_amb);free(L.g_cy);free(L.ss.spr);}

/* ---------- kare çizimi (ayırma yok) ---------- */
function draw(L,ctx,t,dt){
  var S=L.S,W=L.W,H=L.H,ox=sin(t*.11)*5,oy=cos(t*.09)*3.5,i,o,a;
  ctx.setTransform(S,0,0,S,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  ctx.drawImage(L.base,Math.round(ox)-MRG,Math.round(oy)-MRG,W+2*MRG,H+2*MRG);
  ctx.globalCompositeOperation='lighter';
  for(i=0;i<L.gal.length;i++){var G=L.gal[i],th=G.rot+t*.0035*(i+1),cs=cos(th),sn=sin(th),f=G.ft;
    ctx.globalAlpha=.9;ctx.setTransform(S*cs,S*sn,-S*sn*f,S*cs*f,S*(G.x+ox*1.6),S*(G.y+oy*1.6));ctx.drawImage(G.c,-G.sz/2,-G.sz/2,G.sz,G.sz);}
  ctx.setTransform(S,0,0,S,0,0);
  var tw=L.tw;ctx.fillStyle='#fff';
  for(i=0;i<tw.length;i+=5){a=.5+.5*sin(t*tw[i+3]+tw[i+2]);ctx.globalAlpha=a*a*.9;ctx.fillRect(tw[i]+ox*1.2,tw[i+1]+oy*1.2,tw[i+4],tw[i+4]);}
  var fl=L.fl;for(i=0;i<fl.length;i+=4){a=.5+.5*sin(t*(.7+fl[i+3])+fl[i+2]);ctx.globalAlpha=a*.8;var fs=14+fl[i+3]*16;ctx.drawImage(L.flare,fl[i]+ox*1.2-fs/2,fl[i+1]+oy*1.2-fs/2,fs,fs);}
  var lg=L.lights;
  for(i=0;i<lg.length;i+=4){a=.5+.5*sin(t*(1.2+lg[i+3]*.4)+lg[i+3]*3);ctx.globalAlpha=.25+.7*a;ctx.drawImage(lg[i+2]?L.g_cy:L.g_amb,lg[i]+ox-3.5,lg[i+1]+oy-3.5,7,7);}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  for(i=0;i<L.plats.length;i++){var p=L.plats[i];ctx.drawImage(p.c,p.x+ox-p.ax,p.y+oy+sin(t*.7+p.ph)*1.8-p.ay,p.w,p.h);}
  /* kayan yıldız */
  var ss=L.ss;if(L.q>=2){if(ss.age<0){ss.t-=dt;if(ss.t<=0){ss.age=0;ss.x=W*(.3+Math.random()*.6);ss.y=H*(.04+Math.random()*.25);ss.vx=-(260+Math.random()*120)*W/390;ss.vy=(110+Math.random()*60)*W/390;}}
    else{ss.age+=dt;ss.x+=ss.vx*dt;ss.y+=ss.vy*dt;if(ss.age>.7){ss.age=-1;ss.t=5+Math.random()*7;}else{ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-ss.age/.7;
      var ang=Math.atan2(ss.vy,ss.vx);ctx.setTransform(S*cos(ang),S*sin(ang),-S*sin(ang),S*cos(ang),S*ss.x,S*ss.y);ctx.drawImage(ss.spr,0,-1.5,-70*W/390,3);ctx.setTransform(S,0,0,S,0,0);}}}
  /* araçlar */
  for(i=0;i<L.ships.length;i++){var s=L.ships[i],span=s.L*1.2;s.x+=s.d*s.vx*dt;if(s.d>0&&s.x>W+span)s.x=-span;else if(s.d<0&&s.x<-span)s.x=W+span;
    var yy=s.y0+sin(t*.45+s.ph)*s.amp,fk=1+.1*sin(t*21+s.ph*5);
    ctx.setTransform(S*s.d,0,0,S,S*s.x,S*yy);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.9;ctx.drawImage(s.tr,-s.L*.5-s.trl*fk,-s.trh/2,s.trl*fk,s.trh);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.drawImage(s.c,-s.w/2,-s.h/2,s.w,s.h);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.8*fk;var eg=s.L*.2;ctx.drawImage(s.eg,-s.L*.5-eg/2,-eg/2,eg,eg);}
  ctx.setTransform(S,0,0,S,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}

function dprFor(q){var d=window.devicePixelRatio||1;return Math.max(1,Math.min(q>=3?2:q>=2?1.5:1,d));}
function getQ(o){var q=o&&o.q!=null?o.q:(SG.store&&SG.store.get?SG.store.get('quality',2):2);q=+q;return q>=0&&q<=3?q:2;}
function size(canvas,w,h){if(!w)w=canvas.clientWidth||canvas.offsetWidth||390;if(!h)h=canvas.clientHeight||canvas.offsetHeight||Math.round(w*19/9);return[Math.round(w),Math.round(h)];}

A.heroStatic=function(canvas,o){
  var q=getQ(o),wh=size(canvas,o&&o.w,o&&o.h),S=dprFor(Math.max(q,2)),W=wh[0],H=wh[1];
  canvas.width=Math.round(W*S);canvas.height=Math.round(H*S);
  var L=build(W,H,S,1),ctx=canvas.getContext('2d');draw(L,ctx,.0,0);dispose(L);};

A.hero=function(canvas,o){
  var q=getQ(o),W=0,H=0,S=1,L=null,ctx=null,raf=0,on=false,vis=true,last=0,tt=0,hid=false;
  function init(w,h){var wh=size(canvas,w,h);if(L&&wh[0]===W&&wh[1]===H)return;W=wh[0];H=wh[1];S=dprFor(q);
    canvas.width=Math.round(W*S);canvas.height=Math.round(H*S);dispose(L);L=build(W,H,S,q);ctx=ctx||canvas.getContext('2d',{alpha:false})||canvas.getContext('2d');}
  function tick(ts){raf=0;if(!on)return;if(!hid){if(!last)last=ts;var dt=Math.min(.1,(ts-last)/1000);last=ts;tt+=dt;draw(L,ctx,tt,dt);}raf=requestAnimationFrame(tick);}
  function schedule(){if(!raf&&on&&!hid)raf=requestAnimationFrame(tick);}
  function onVis(){hid=document.hidden||!vis;last=0;if(!hid)schedule();else if(raf){cancelAnimationFrame(raf);raf=0;}}
  function onPause(){vis=false;onVis();}function onResume(){vis=true;onVis();}
  function start(){if(on)return;on=true;init();hid=document.hidden;last=0;
    if(q<=0||SG.RM){draw(L,ctx,0,0);return;}
    document.addEventListener('visibilitychange',onVis);window.addEventListener('sg-pause',onPause);window.addEventListener('sg-resume',onResume);schedule();}
  function stop(){on=false;if(raf){cancelAnimationFrame(raf);raf=0;}
    document.removeEventListener('visibilitychange',onVis);window.removeEventListener('sg-pause',onPause);window.removeEventListener('sg-resume',onResume);
    dispose(L);L=null;W=H=0;}
  function resize(w,h){if(!on){return;}var wh=size(canvas,w,h);if(L&&wh[0]===W&&wh[1]===H)return;var keep=tt;L=(dispose(L),null);init(w,h);if(q<=0||SG.RM)draw(L,ctx,0,0);else draw(L,ctx,keep,0);}
  return{start:start,stop:stop,resize:resize,destroy:stop};};
})();
