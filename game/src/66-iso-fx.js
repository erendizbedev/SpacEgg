// SpacEgg v2.4 - Grafik 2: parcacik sistemi (duman, toz, alev, kivilcim, catlak, balon, halka, konfeti)
// SG.Iso.fx.new() -> {emit(kind,x,y,o), step(dt sn), draw(ctx), clear(), count}
(function(){
'use strict';
var SG=window.SG||(window.SG={});var Iso=SG.Iso||(SG.Iso={});
var TAU=Math.PI*2,MAXP=360,MAXADD=110;
var K={smoke:1,dust:2,flame:3,spark:4,crack:5,bubble:6,ring:7,confetti:8};
var ADD={3:1,4:1,5:1};
var FM='monospace';
try{var cs=getComputedStyle(document.documentElement).getPropertyValue('--f-mono').trim();if(cs)FM=cs;}catch(e){}
var mc=null;function mw(txt,font){if(!mc){mc=document.createElement('canvas').getContext('2d');}mc.font=font;return mc.measureText(txt).width;}
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function mkp(){return {k:0,x:0,y:0,vx:0,vy:0,life:1,age:0,sz:1,rot:0,vr:0,col:'#fff',col2:'#fff',a:1,g:0,dr:0,ex:null,n:0,w:0,fl:.5,add:0};}
function System(seed){
 this.r=(SG.rng?SG.rng(seed||1234):function(){return .5;});
 this.pool=[];this.free=[];this.act=[];this.nAdd=0;
 for(var i=0;i<MAXP;i++){var p=mkp();this.pool.push(p);this.free.push(p);}
}
var SP=System.prototype;
Object.defineProperty(SP,'count',{get:function(){return this.act.length;}});
SP.clear=function(){var a=this.act;while(a.length)this.free.push(a.pop());this.nAdd=0;};
SP.take=function(k){
 if(!this.free.length)return null;
 if(ADD[k]&&this.nAdd>=MAXADD)return null;
 var p=this.free.pop();this.act.push(p);if(ADD[k])this.nAdd++;
 p.k=k;p.age=0;p.rot=0;p.vr=0;p.g=0;p.dr=0;p.a=1;p.ex=null;p.n=0;p.fl=.5;p.add=ADD[k]?1:0;return p;
};
var CONF=['#ff5c7a','#ffd24a','#4fdc82','#4ec3f0','#b388ff','#ff9a3c','#ffffff'];
// emit: o:{n,color,seed,r,life,vx,vy,icon,text,flat}
SP.emit=function(kind,x,y,o){
 o=o||{};var k=K[kind];if(!k)return;var r=this.r,n=o.n,i,p,a,sp;
 if(k===1){ // duman
  n=n==null?1:n;
  for(i=0;i<n;i++){p=this.take(k);if(!p)return;p.x=x+(r()-.5)*(o.spread==null?6:o.spread);p.y=y;p.vx=(o.wind==null?6:o.wind)+(r()-.5)*5;p.vy=-(o.rise==null?18:o.rise)*(.7+r()*.6);
   p.life=(o.life||2.2)*(.75+r()*.5);p.sz=(o.size||5)*(.8+r()*.5);p.col=o.color||'#d8dde8';p.col2='#ffffff';p.a=o.alpha==null?.55:o.alpha;p.vr=0;}
 }else if(k===2){ // toz
  n=n==null?8:n;
  for(i=0;i<n;i++){p=this.take(k);if(!p)return;a=r()*TAU;sp=14+r()*26;p.x=x+Math.cos(a)*4;p.y=y+Math.sin(a)*2;p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp*.45-6;p.life=(o.life||.9)*(.7+r()*.6);
   p.sz=(o.size||5)*(.7+r()*.6);p.col=o.color||'#d9c39a';p.col2='#f3e6c4';p.a=.7;p.dr=2.2;}
 }else if(k===3){ // alev (inis)
  n=n==null?4:n;var dir=o.dir==null?Math.PI/2:o.dir;
  for(i=0;i<n;i++){p=this.take(k);if(!p)return;a=dir+(r()-.5)*.7;sp=(o.speed||90)*(.6+r()*.6);p.x=x+(r()-.5)*5;p.y=y;p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;
   p.life=(o.life||.45)*(.6+r()*.7);p.sz=(o.size||6)*(.7+r()*.6);p.col=o.color||'#ff8a2a';p.col2=o.core||'#ffe27a';p.a=.85;p.dr=1.2;}
 }else if(k===4){ // kivilcim
  n=n==null?6:n;
  for(i=0;i<n;i++){p=this.take(k);if(!p)return;a=(o.dir!=null?o.dir+(r()-.5)*1.6:r()*TAU);sp=(o.speed||70)*(.4+r()*.9);p.x=x;p.y=y;p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp-(o.up==null?40:o.up);
   p.life=(o.life||.7)*(.6+r()*.7);p.sz=1+r()*1.3;p.col=o.color||'#ffd25a';p.col2='#fff6d0';p.g=o.gravity==null?190:o.gravity;p.dr=.6;}
 }else if(k===5){ // yok olus catlagi: kollar buyur, parlar, sonra soner
  p=this.take(k);if(!p)return;var R=o.r||30,arms=o.arms||6,sd=[];
  for(i=0;i<arms;i++){var an=i/arms*TAU+(r()-.5)*.6,pl=[0,0],ln=R*(.6+r()*.5),px=0,py=0,dd=an;
   for(var s=0;s<4;s++){dd+=(r()-.5)*1.0;px+=Math.cos(dd)*ln/4;py+=Math.sin(dd)*ln/4;pl.push(px,py);}
   sd.push(pl);}
  p.x=x;p.y=y;p.ex=sd;p.life=o.life||1.6;p.sz=R;p.col=o.color||'#ff7a3a';p.col2='#ffd27a';p.fl=o.flat==null?.55:o.flat;
  if(o.debris!==false)this.emit('spark',x,y,{n:5,color:p.col,speed:60,up:20});
 }else if(k===6){ // toplama balonu
  p=this.take(k);if(!p)return;var txt=o.text!=null?String(o.text):(o.n!=null?'+'+o.n:'');
  p.x=x;p.y=y;p.life=o.life||1.8;p.col=o.color||(Iso.iconColor?Iso.iconColor(o.icon):'#f2c14e');p.ex={icon:o.icon||null,text:txt,w:txt?mw(txt,'700 12px '+FM):0};p.vy=-(o.rise==null?14:o.rise);
 }else if(k===7){ // halka
  p=this.take(k);if(!p)return;p.x=x;p.y=y;p.life=o.life||.7;p.sz=o.r0==null?4:o.r0;p.n=o.r1==null?(o.r||34):o.r1;p.col=o.color||'#7ee8ff';p.fl=o.flat==null?.5:o.flat;p.w=o.width||3;p.add=0;p.a=o.alpha==null?.9:o.alpha;
 }else if(k===8){ // konfeti
  n=n==null?36:n;var pal=o.colors||CONF;
  for(i=0;i<n;i++){p=this.take(k);if(!p)return;a=-Math.PI/2+(r()-.5)*(o.spread==null?2.4:o.spread);sp=(o.speed||230)*(.45+r()*.7);p.x=x+(r()-.5)*8;p.y=y;p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;
   p.life=(o.life||2)*(.7+r()*.6);p.sz=3.4+r()*3.4;p.col=pal[(r()*pal.length)|0];p.rot=r()*TAU;p.vr=(r()-.5)*12;p.g=340;p.dr=1.6;p.w=r()*TAU;p.a=1;}
 }
};
SP.step=function(dt){
 if(dt>1)dt/=1000;if(dt>.1)dt=.1;if(dt<=0)return;
 var a=this.act,i=0,p,add=0;
 while(i<a.length){p=a[i];p.age+=dt;
  if(p.age>=p.life){a[i]=a[a.length-1];a.pop();this.free.push(p);continue;}
  if(p.k!==5&&p.k!==6&&p.k!==7){
   if(p.dr){var f=Math.max(0,1-p.dr*dt);p.vx*=f;p.vy*=f;}
   p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=p.vr*dt;
  }else if(p.k===6){p.y+=p.vy*dt*(1-p.age/p.life);}
  if(p.add)add++;i++;}
 this.nAdd=add;
};
function ease(t){return t<0?0:t>1?1:t;}
SP.draw=function(c){
 var a=this.act,n=a.length;if(!n)return;var i,p,t,u;
 c.save();
 // 1) normal karisim: duman, toz, halka, konfeti, catlak tabani
 for(i=0;i<n;i++){p=a[i];u=p.age/p.life;
  switch(p.k){
  case 1:
   t=p.sz*(1+u*1.9);c.globalAlpha=p.a*(u<.15?u/.15:1-(u-.15)/.85)*(1-u*.2);
   c.fillStyle=p.col;c.beginPath();c.arc(p.x,p.y,t,0,TAU);c.fill();
   c.globalAlpha*=.6;c.fillStyle=p.col2;c.beginPath();c.arc(p.x-t*.25,p.y-t*.3,t*.55,0,TAU);c.fill();break;
  case 2:
   t=p.sz*(1+u*1.6);c.globalAlpha=p.a*(1-u);c.fillStyle=p.col;c.beginPath();c.ellipse(p.x,p.y,t,t*.7,0,0,TAU);c.fill();
   c.globalAlpha*=.6;c.fillStyle=p.col2;c.beginPath();c.ellipse(p.x-t*.2,p.y-t*.2,t*.55,t*.38,0,0,TAU);c.fill();break;
  case 7:
   t=p.sz+(p.n-p.sz)*(1-(1-u)*(1-u));c.globalAlpha=p.a*(1-u);c.strokeStyle=p.col;c.lineWidth=Math.max(.6,p.w*(1-u*.8));
   c.beginPath();c.ellipse(p.x,p.y,t,t*p.fl,0,0,TAU);c.stroke();break;
  case 8:
   c.globalAlpha=u>.75?(1-u)/.25:1;c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.scale(1,Math.cos(p.age*9+p.w));c.fillStyle=p.col;c.fillRect(-p.sz,-p.sz*.55,p.sz*2,p.sz*1.1);c.restore();break;
  case 5:
   c.globalAlpha=Math.min(1,(1-u)*2.2);c.strokeStyle='rgba(12,4,6,.9)';c.lineWidth=3;c.lineCap='round';c.lineJoin='round';this._arms(c,p,ease(u/.35));break;
  }
 }
 // 2) toplama balonlari
 for(i=0;i<n;i++){p=a[i];if(p.k!==6)continue;u=p.age/p.life;this._bubble(c,p,u);}
 // 3) ekleme karisimi (olculu): alev, kivilcim, catlak parlamasi
 c.globalCompositeOperation='lighter';
 for(i=0;i<n;i++){p=a[i];u=p.age/p.life;
  if(p.k===3){
   t=p.sz*(1-u*.65);c.globalAlpha=p.a*(1-u);c.lineCap='round';
   c.strokeStyle=p.col;c.lineWidth=t*2;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*.14,p.y-p.vy*.14);c.stroke();
   c.strokeStyle=p.col2;c.lineWidth=t*1.05;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*.08,p.y-p.vy*.08);c.stroke();
  }else if(p.k===4){
   c.globalAlpha=1-u;c.strokeStyle=u<.4?p.col2:p.col;c.lineWidth=p.sz;c.lineCap='round';c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*.045,p.y-p.vy*.045);c.stroke();
  }else if(p.k===5){
   c.globalAlpha=Math.min(1,(1-u)*2.2)*(.7+.3*Math.sin(p.age*22));c.strokeStyle=p.col;c.lineWidth=2.2;c.lineCap='round';c.lineJoin='round';this._arms(c,p,ease(u/.35));
   c.globalAlpha*=.8;c.strokeStyle=p.col2;c.lineWidth=.9;this._arms(c,p,ease(u/.35));
  }}
 c.restore();
};
SP._arms=function(c,p,g){
 var s=p.ex,i,j,pl,m,fl=p.fl;
 c.beginPath();
 for(i=0;i<s.length;i++){pl=s[i];m=2+Math.floor(g*(pl.length/2-1))*2;c.moveTo(p.x,p.y);
  for(j=2;j<m&&j<pl.length;j+=2)c.lineTo(p.x+pl[j]*g*1.0,p.y+pl[j+1]*g*fl);}
 c.stroke();
};
SP._bubble=function(c,p,u){
 var e=p.ex,ps=u<.14?(u/.14):1,sc=ps<1?(1-Math.pow(1-ps,3)*1.0)*1.0:1;if(u<.14){sc=1.14*Math.sin(ps*Math.PI*.5)+(ps>.7?-.14*((ps-.7)/.3):0);}
 var al=u>.78?(1-u)/.22:1,hh=24,ic=e.icon?18:0,tw=e.w,pad=7,gap=(ic&&tw)?4:0,w=pad*2+ic+gap+tw,x=p.x,y=p.y;
 c.save();c.translate(x,y);c.scale(sc,sc);c.globalAlpha=al;
 // golge
 c.fillStyle='rgba(0,0,20,.28)';rrect(c,-w/2+1,-hh-6+3,w,hh,hh/2);c.fill();
 // kuyruk
 c.fillStyle='rgba(12,20,42,.94)';c.beginPath();c.moveTo(-5,-7);c.lineTo(5,-7);c.lineTo(0,0);c.closePath();c.fill();
 rrect(c,-w/2,-hh-6,w,hh,hh/2);c.fill();
 c.lineWidth=1.6;c.strokeStyle=p.col;c.stroke();
 c.fillStyle='rgba(255,255,255,.1)';rrect(c,-w/2+3,-hh-4.5,w-6,hh/2-2,hh/4);c.fill();
 var cx=-w/2+pad;
 if(e.icon&&Iso.icon){Iso.icon(c,e.icon,cx+ic/2,-hh/2-6,ic);cx+=ic+gap;}
 if(e.text){c.font='700 12px '+FM;c.textBaseline='middle';c.textAlign='left';c.fillStyle='#fff7da';c.fillText(e.text,cx,-hh/2-5.5);}
 c.restore();
};
Iso.fx={new:function(seed){return new System(seed);},kinds:Object.keys(K),max:MAXP};
})();
