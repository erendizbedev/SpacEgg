/* SpacEgg 2.0 — açılış (intro): dikey sahne, logo + büyük sarmal galaksi. Yalnız 'intro' görünümü. */
(function(){
'use strict';
var AUTO_MS=3600,TAP_AFTER=700,OUT_MS=520;
var TIERS=[{S:768,N:9000,bg:1500,dpr:1.25,fps:30},{S:1024,N:20000,bg:2400,dpr:1.5,fps:60},{S:1280,N:36000,bg:3400,dpr:2,fps:60}];
var PI2=Math.PI*2,TILT=.66;
function tier(){var t=1;try{if(SG.P&&SG.P.tier)t=SG.P.tier();}catch(e){}return t<0?0:t>2?2:t|0;}
function cv(w,h){var c=document.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c;}
function pow2(n){var p=256;while(p<n&&p<2048)p<<=1;return p;}
function rgba(r,g,b,a){return'rgba('+(r|0)+','+(g|0)+','+(b|0)+','+a+')';}
function mix(a,b,t){return a+(b-a)*t;}
function gauss(r){return r()+r()+r()+r()-2;}                 /* yaklaşık normal, ±2 */

/* yumuşak ışık lekesi (önbellekli, küçük) */
var blobCache={};
function blob(key,r,g,b){
  if(blobCache[key])return blobCache[key];
  var c=cv(64,64),x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,rgba(r,g,b,1));gr.addColorStop(.25,rgba(r,g,b,.45));gr.addColorStop(.6,rgba(r,g,b,.1));gr.addColorStop(1,rgba(r,g,b,0));
  x.fillStyle=gr;x.fillRect(0,0,64,64);return(blobCache[key]=c);
}

/* ---- galaksi dokusu: kollar, toz şeritleri, HII bölgeleri, kenar yumuşatma ---- */
function makeGalaxy(S,N){
  var c=cv(S,S),x=c.getContext('2d'),R=S*.47,cx=S/2,cy=S/2,rng=SG.rng('intro-galaxy-v2'),i;
  x.globalCompositeOperation='lighter';
  /* disk sisi */
  var hz=x.createRadialGradient(cx,cy,0,cx,cy,R);
  hz.addColorStop(0,'rgba(255,214,160,.30)');hz.addColorStop(.18,'rgba(220,190,200,.16)');hz.addColorStop(.5,'rgba(120,140,235,.09)');hz.addColorStop(1,'rgba(60,80,200,0)');
  x.fillStyle=hz;x.fillRect(0,0,S,S);
  var h=R*.34,norm=1-Math.exp(-R/h),W=2.55,wts=[.34,.34,.16,.16];
  var bW=blob('w',255,236,210),bB=blob('b',150,180,255),bC=blob('c',190,210,255),bP=blob('p',255,120,175),bO=blob('o',255,200,140);
  function arm(r2){var q=r2(),a=0;for(;a<3;a++){q-=wts[a];if(q<0)break;}return a;}
  function place(r,a,sig){var th=a*Math.PI/2+W*Math.log(1+r/(R*.16))+gauss(rng)*sig;return[cx+Math.cos(th)*r,cy+Math.sin(th)*r,th];}
  for(i=0;i<N;i++){
    var bar=rng()<.05,disk=!bar&&rng()<.3,r,px,py,t,sz,al;
    if(bar){var u=(rng()-.5)*2*R*.26,v=gauss(rng)*R*.022,ba=.55;px=cx+Math.cos(ba)*u-Math.sin(ba)*v;py=cy+Math.sin(ba)*u+Math.cos(ba)*v;r=Math.sqrt((px-cx)*(px-cx)+(py-cy)*(py-cy));}
    else if(disk){r=-h*1.25*Math.log(1-rng()*(1-Math.exp(-R/(h*1.25))));var ta=rng()*PI2;px=cx+Math.cos(ta)*r;py=cy+Math.sin(ta)*r;}
    else{r=-h*Math.log(1-rng()*norm);var a=arm(rng),p=place(r,a,.2+.5*(r/R));px=p[0];py=p[1];}
    t=Math.min(1,r/R);
    var big=rng()<.15;
    var cr=mix(255,150,Math.pow(t,.7)),cg=mix(228,182,Math.pow(t,.7)),cb=mix(176,255,Math.pow(t,.7));
    if(big){sz=mix(16,46,rng())*S/1024*(.7+.6*t);al=.05+.11*rng();x.globalAlpha=al;x.drawImage(t<.25?bW:(rng()<.5?bB:bC),px-sz/2,py-sz/2,sz,sz);}
    else{sz=(rng()<.07?2.2:1.1)*S/1024*(1+rng()*.8);al=(.22+.6*rng())*(1-t*.35);x.globalAlpha=al;x.fillStyle=rgba(cr,cg,cb,1);x.fillRect(px,py,sz,sz);}
  }
  /* HII bölgeleri: kolların dış yarısında pembe parıltılar */
  for(i=0;i<Math.round(N/70);i++){var rr=R*(.3+.62*rng()),aa=arm(rng),pp=place(rr,aa,.14+.3*(rr/R)),s2=mix(18,52,rng())*S/1024;
    x.globalAlpha=.16+.22*rng();x.drawImage(rng()<.7?bP:bO,pp[0]-s2/2,pp[1]-s2/2,s2,s2);}
  /* toz şeritleri: kolların iç kenarında koyu lekeler */
  x.globalCompositeOperation='source-over';
  var bd=blob('d',12,10,30);
  for(i=0;i<Math.round(N/55);i++){
    var rd=R*(.1+.78*rng()),ad=rng()<.5?0:1,pd=place(rd,ad,.04+.12*(rd/R)),th2=pd[2]-.12-.05*rng(),
        dx=cx+Math.cos(th2)*rd,dy=cy+Math.sin(th2)*rd,sd=mix(16,48,rng())*S/1024*(.6+rd/R);
    x.globalAlpha=.05+.09*rng();x.drawImage(bd,dx-sd/2,dy-sd/2,sd,sd);
  }
  /* kenar yumuşatma */
  x.globalCompositeOperation='destination-in';x.globalAlpha=1;
  var m=x.createRadialGradient(cx,cy,R*.55,cx,cy,R*1.02);m.addColorStop(0,'rgba(0,0,0,1)');m.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=m;x.fillRect(0,0,S,S);
  /* kenar yumuşatma yıldızları da bastırdığı için tüm içerik zaten alfa içinde; arka planda boşluk kalır */
  return c;
}

/* ---- çekirdek parıltısı (sabit, dönmez) ---- */
function makeCore(S){
  var c=cv(S,S),x=c.getContext('2d'),m=S/2;
  x.globalCompositeOperation='lighter';
  var g=x.createRadialGradient(m,m,0,m,m,m);
  g.addColorStop(0,'rgba(255,252,240,1)');g.addColorStop(.05,'rgba(255,240,205,.95)');g.addColorStop(.14,'rgba(255,210,150,.55)');
  g.addColorStop(.34,'rgba(255,170,110,.20)');g.addColorStop(.65,'rgba(190,130,170,.07)');g.addColorStop(1,'rgba(120,100,200,0)');
  x.fillStyle=g;x.fillRect(0,0,S,S);
  /* bar parıltısı */
  x.save();x.translate(m,m);x.rotate(.55);x.scale(1,.2);
  var g2=x.createRadialGradient(0,0,0,0,0,m*.55);g2.addColorStop(0,'rgba(255,225,175,.28)');g2.addColorStop(.5,'rgba(255,190,130,.08)');g2.addColorStop(1,'rgba(255,170,110,0)');
  x.fillStyle=g2;x.fillRect(-m,-m*5,S,S*5);x.restore();
  return c;
}

/* ---- arka plan: boşluk, bulutsu, yıldız tozu ---- */
function makeBg(w,h,gx,gy,gd,cfg){
  var c=cv(w,h),x=c.getContext('2d'),rng=SG.rng('intro-bg-v2'),i;
  var g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#03040c');g.addColorStop(.55,'#070a1e');g.addColorStop(1,'#04050d');
  x.fillStyle=g;x.fillRect(0,0,w,h);
  x.globalCompositeOperation='lighter';
  var halo=x.createRadialGradient(gx,gy,0,gx,gy,gd*.75);halo.addColorStop(0,'rgba(110,80,200,.30)');halo.addColorStop(.5,'rgba(60,70,170,.12)');halo.addColorStop(1,'rgba(30,40,120,0)');
  x.fillStyle=halo;x.fillRect(0,0,w,h);
  var cols=[[90,60,190],[40,110,200],[170,60,150],[60,160,190]],neb=Math.round(7+cfg.bg/500);
  for(i=0;i<neb;i++){var cc=cols[i%4],s=mix(.35,.9,rng())*Math.max(w,h)*.7,nx=rng()*w,ny=rng()*h;
    var b=blob('n'+(i%4),cc[0],cc[1],cc[2]);x.globalAlpha=.05+.08*rng();x.drawImage(b,nx-s/2,ny-s/2,s,s);}
  x.globalAlpha=1;
  var hue=[[255,240,225],[200,215,255],[255,215,170],[170,200,255]];
  for(i=0;i<cfg.bg;i++){
    var px=rng()*w,py=rng()*h,k=rng(),r=k<.012?mix(1.6,2.6,rng()):k<.1?mix(1,1.5,rng()):mix(.45,.9,rng()),hc=hue[(rng()*4)|0];
    x.globalAlpha=k<.012?.95:.25+.6*rng();x.fillStyle=rgba(hc[0],hc[1],hc[2],1);
    x.fillRect(px,py,r,r);
    if(k<.012){x.globalAlpha=.25;x.drawImage(blob('s',hc[0],hc[1],hc[2]),px-8,py-8,16,16);}
  }
  x.globalAlpha=1;
  return c;
}

SG.view('intro',{
  mount:function(root){
    var st={dead:false,paused:false,done:false,t0:0,t:0,lastDraw:-1,ptx:0,pty:0,px:0,py:0,timers:[],unl:[],tr:tier()};
    var wrap=SG.h('div',{class:'in-wrap',role:'region','aria-label':'SpacEgg açılış'});
    var bgc=SG.h('canvas',{class:'in-bg','aria-hidden':'true'});
    var canvas=SG.h('canvas',{class:'in-cv','aria-hidden':'true'});
    var logo=SG.h('div',{class:'in-logo','aria-hidden':'true'});
    try{logo.innerHTML=SG.Art&&SG.Art.logoSVG?SG.Art.logoSVG(96):'';}catch(e){SG.log.err('intro:logo',e);}
    var title=SG.h('h1',{class:'in-title',text:'SpacEgg'});
    var slogan=SG.h('p',{class:'in-slogan',lang:'en',text:(SG.T2&&SG.T2.slogan)||'Create a universe. Witness its story.'});
    var cta=SG.h('button',{class:'in-cta',type:'button','aria-label':'Başla'},SG.h('span',{class:'in-cta-t',text:'Dokun ve başla'}));
    var fam=SG.h('p',{class:'in-fam',text:'Fambo tarafından geliştirildi'});
    var head=SG.h('header',{class:'in-head'},logo,title);
    var foot=SG.h('footer',{class:'in-foot'},slogan,cta,fam);
    wrap.appendChild(bgc);wrap.appendChild(canvas);wrap.appendChild(head);wrap.appendChild(foot);root.appendChild(wrap);
    if(SG.RM)wrap.classList.add('rm');

    var ctx=canvas.getContext('2d'),W=0,H=0,dpr=1,gal=null,core=null,bg=null,stars=[],D=0,gx=0,gy=0,cfg=TIERS[st.tr];
    function build(){
      cfg=TIERS[st.tr];
      var rc=wrap.getBoundingClientRect();W=Math.max(1,Math.round(rc.width||window.innerWidth));H=Math.max(1,Math.round(rc.height||window.innerHeight));
      dpr=Math.min(window.devicePixelRatio||1,cfg.dpr);
      canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
      D=Math.max(W*2.3,H*.5);gx=W/2;gy=H*(W<H?.58:.55);
      var S=Math.min(cfg.S,pow2(D*dpr));
      var t0=performance.now();
      gal=makeGalaxy(S,Math.round(cfg.N*S/cfg.S));core=makeCore(Math.min(512,S/2));
      bg=makeBg(Math.round(W*1.08*dpr),Math.round(H*1.08*dpr),(gx+W*.04)*dpr,(gy+H*.04)*dpr,D*dpr,cfg);
      bgc.width=bg.width;bgc.height=bg.height;bgc.getContext('2d').drawImage(bg,0,0);bgc.style.width=(W*1.08)+'px';bgc.style.height=(H*1.08)+'px';bgc.style.left=(-.04*W)+'px';bgc.style.top=(-.04*H)+'px';bg=null;
      var r=SG.rng('intro-stars');stars=[];
      for(var i=0;i<7;i++)stars.push({x:r()*W,y:r()*H*.9,s:mix(5,11,r()),ph:r()*PI2,sp:mix(.5,1.3,r()),h:r()<.5?[200,220,255]:[255,230,200]});
      st.buildMs=Math.round(performance.now()-t0);
    }
    function ease(x){x=x<0?0:x>1?1:x;return 1-Math.pow(1-x,3);}
    function draw(t){
      var c=ctx,rm=SG.RM;
      c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
      /* paralaks: arka plan ve galaksi farklı kayar */
      st.px+=(st.ptx-st.px)*.05;st.py+=(st.pty-st.py)*.05;
      var drift=rm?0:Math.sin(t*.07)*3;
      c.clearRect(0,0,canvas.width,canvas.height);
      bgc.style.transform='translate3d('+(st.px*-10+drift).toFixed(1)+'px,'+(st.py*-7).toFixed(1)+'px,0)';
      var k=rm?1:ease(t/1.6),zoom=rm?1:1+.14*(1-ease(t/2.6));
      c.setTransform(dpr,0,0,dpr,0,0);
      var ang=rm?.4:.4+t*.012;
      c.save();c.translate(gx+st.px*10,gy+st.py*7);c.scale(zoom,zoom*TILT);c.rotate(ang);
      c.globalAlpha=k;c.drawImage(gal,-D/2,-D/2,D,D);c.restore();
      c.save();c.translate(gx+st.px*10,gy+st.py*7);c.scale(zoom,zoom*TILT*1.15);c.globalCompositeOperation='lighter';
      var cs=D*.5,pulse=rm?1:1+.035*Math.sin(t*.9);c.globalAlpha=k*.62;c.drawImage(core,-cs/2*pulse,-cs/2*pulse,cs*pulse,cs*pulse);c.restore();
      /* parlak yıldızlar: ışın ve titreme */
      c.globalCompositeOperation='lighter';
      for(var i=0;i<stars.length;i++){var s=stars[i],tw=rm?.85:.6+.4*Math.sin(t*s.sp+s.ph),r2=s.s*tw,a=k*(.55+.4*tw);
        c.globalAlpha=a*.5;c.drawImage(blob('st'+i%2,s.h[0],s.h[1],s.h[2]),s.x-r2*2,s.y-r2*2,r2*4,r2*4);
        c.globalAlpha=a;c.fillStyle=rgba(s.h[0],s.h[1],s.h[2],1);
        c.fillRect(s.x-r2*1.6,s.y-.5,r2*3.2,1);c.fillRect(s.x-.5,s.y-r2*1.6,1,r2*3.2);}
      c.globalAlpha=1;c.globalCompositeOperation='source-over';
    }
    function go(){
      if(st.done||st.dead)return;st.done=true;
      wrap.classList.add('out');
      var nav=function(){if(st.dead||(SG.current&&SG.current()!=='intro'))return;var u=null;try{u=SG.G&&SG.G.user&&SG.G.user();}catch(e){}
        SG.go(u?(SG.homeRoute?SG.homeRoute():'hub'):'login');};
      if(SG.RM)nav();else st.timers.push(setTimeout(nav,OUT_MS));
    }
    function onTap(e){if(performance.now()-st.t0<TAP_AFTER)return;go();}
    cta.addEventListener('click',function(e){e.stopPropagation();if(performance.now()-st.t0>=TAP_AFTER)go();});
    wrap.addEventListener('click',onTap);
    function onMove(e){var r=wrap.getBoundingClientRect();st.ptx=((e.clientX-r.left)/r.width-.5)*2;st.pty=((e.clientY-r.top)/r.height-.5)*2;}
    if(!SG.RM)wrap.addEventListener('pointermove',onMove);
    function onKey(e){if(e.key==='Enter'||e.key===' '||e.key==='Escape'){e.preventDefault();if(performance.now()-st.t0>=TAP_AFTER)go();}}
    document.addEventListener('keydown',onKey);
    function onP(){st.paused=true;}function onR(){st.paused=false;st.lastDraw=-1;}
    window.addEventListener('sg-pause',onP);window.addEventListener('sg-resume',onR);
    var rzT=0;function onRz(){clearTimeout(rzT);rzT=setTimeout(function(){if(st.dead)return;try{build();draw(st.t);}catch(e){SG.log.err('intro:resize',e);}},160);}
    window.addEventListener('resize',onRz);
    st.unl.push(function(){window.removeEventListener('sg-pause',onP);window.removeEventListener('sg-resume',onR);window.removeEventListener('resize',onRz);document.removeEventListener('keydown',onKey);});

    try{build();}catch(e){SG.log.err('intro:build',e);}
    st.t0=performance.now();
    try{draw(0);}catch(e){SG.log.err('intro:draw0',e);}
    if(!SG.RM){
      SG.loop.add('intro',function(dt,tt){
        if(st.dead||st.paused)return;
        st.t=(performance.now()-st.t0)/1000;
        var gap=1/TIERS[st.tr].fps;if(st.lastDraw>=0&&st.t-st.lastDraw<gap*.9)return;
        st.lastDraw=st.t;
        var m0=performance.now();
        try{draw(st.t);}catch(e){SG.log.err('intro:draw',e);SG.loop.remove('intro');}
        st.frameMs=(st.frameMs||0)*.9+(performance.now()-m0)*.1;
      });
    }
    st.timers.push(setTimeout(function(){if(!st.dead)go();},AUTO_MS));
    wrap.classList.add('in-on');
    SG._intro=st;
    st.cleanup=function(){
      st.dead=true;try{SG.loop.remove('intro');}catch(e){}
      st.timers.forEach(clearTimeout);st.unl.forEach(function(f){try{f();}catch(e){}});
      gal=core=bg=null;try{bgc.width=bgc.height=1;canvas.width=canvas.height=1;}catch(e){}
    };
  },
  unmount:function(){var st=SG._intro;if(st&&st.cleanup)st.cleanup();SG._intro=null;}
});
})();
