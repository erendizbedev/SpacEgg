/* SpacEgg 2.0 — SG.A2: ölçeğe bağlı ortam sesi + olay vurguları (kod sentezi, dosya yok)
   SG.A (20-audio.js) üzerine kurulur: SG.A.graph() varsa aynı AudioContext ve müzik/fx veri yolları kullanılır
   (duraklat/sürdür/ses/sessiz orada yönetilir); yoksa kendi hafif bağlamıyla çalışır. AudioContext yoksa tüm çağrılar no-op. */
(function(){
'use strict';
var A2=SG.A2={};
var SCALES=['universe','galaxy','system','planet'];
/* ölçek başına parametreler: f=3 osilatör frekansı, g=kazançları, n=gürültü süzgeci, bells=seyrek tını */
var SC={
  universe:{f:[41.2,55,82.4],g:[0.50,0.34,0.14],nt:'lowpass',nf:170,nq:0.7,ng:0.20,lfo:0.05,ld:0.25,bells:0},
  galaxy:  {f:[73.4,110,146.8],g:[0.26,0.28,0.24],nt:'bandpass',nf:900,nq:0.5,ng:0.10,lfo:0.07,ld:0.35,bells:0},
  system:  {f:[65.4,98,196],g:[0.28,0.20,0.12],nt:'lowpass',nf:420,nq:0.7,ng:0.09,lfo:0.09,ld:0.30,bells:1},
  planet:  {f:[49,73.4,98],g:[0.34,0.16,0.10],nt:'bandpass',nf:520,nq:0.8,ng:0.30,lfo:0.12,ld:0.55,bells:2}
};
/* hız basamakları (SG.U.SPEEDS indeksi): süzgeç ağzı, genel seviye, perde kayması (cent), gürültü çarpanı */
var SPD={cut:[700,3500,4200,5200,6500],lvl:[0.55,1,1,0.95,0.9],det:[0,0,25,60,110],noi:[0.7,1,1.15,1.4,1.7]};
var BELLS=[293.7,329.6,370,440,493.9,587.3,740];
var W={want:false,scale:'universe',speed:1,hold:0,gestured:false,nextBell:0,lastEv:{},evCount:[]};
var G=null,own=null;      // G: kurulu ses grafı; own: kendi bağlamım (ortak graf yoksa)
var timers=[];
function hidden(){try{return document.visibilityState==='hidden'||document.hidden===true;}catch(e){return false;}}
function tier(){try{return SG.P&&SG.P.tier?SG.P.tier():1;}catch(e){return 1;}}
function aState(){try{return SG.A&&SG.A.state?SG.A.state():null;}catch(e){return null;}}
function sharedGraph(){try{return SG.A&&SG.A.graph?SG.A.graph():undefined;}catch(e){return undefined;}} // undefined: API yok; null: henüz kilit açık değil
/* ---------- bağlam ---------- */
function getTarget(){
  var sg=sharedGraph();
  if(sg===undefined){ // bağımsız mod
    if(!W.gestured)return null;
    if(!own){
      var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
      try{
        var c=new AC({latencyHint:'playback'});
        var m=c.createGain();var lim=c.createDynamicsCompressor();lim.threshold.value=-16;lim.ratio.value=8;
        m.connect(lim);lim.connect(c.destination);
        own={ctx:c,master:m,paused:false};
      }catch(e){SG.log.err('a2:ctx',e);return null;}
    }
    return {ctx:own.ctx,amb:own.master,ev:own.master,shared:false};
  }
  if(!sg||!sg.ctx)return null;
  return {ctx:sg.ctx,amb:sg.music||sg.fx,ev:sg.fx||sg.music,shared:true};
}
function noiseBuf(c){
  var n=c.sampleRate*2,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0),l=0;
  for(var i=0;i<n;i++){var w=Math.random()*2-1;l=(l*0.96+w*0.04);d[i]=l*3.2;} // kahverengi-pembe gürültü
  return b;
}
/* ---------- kurulum / kaldırma ---------- */
function build(t){
  var c=t.ctx,tr=tier();
  var o={t:t,ctx:c,osc:[],og:[],tr:tr};
  o.out=c.createGain();o.out.gain.value=0;
  o.sf=c.createBiquadFilter();o.sf.type='lowpass';o.sf.frequency.value=SPD.cut[1];o.sf.Q.value=0.4;
  o.sf.connect(o.out);o.out.connect(t.amb);
  var types=['sine','triangle','sine'],nOsc=tr>=1?3:2;
  for(var i=0;i<nOsc;i++){
    var os=c.createOscillator();os.type=types[i];os.frequency.value=SC.universe.f[i];
    var g=c.createGain();g.gain.value=0;os.connect(g);g.connect(o.sf);os.start();o.osc.push(os);o.og.push(g);
  }
  if(tr>=2){ // parıltı katmanı (yalnız yüksek kademe)
    var sh=c.createOscillator();sh.type='sine';sh.frequency.value=SC.universe.f[2]*2;
    var sg=c.createGain();sg.gain.value=0;sh.connect(sg);sg.connect(o.sf);sh.start();o.osc.push(sh);o.og.push(sg);o.shim=true;
  }
  var ns=c.createBufferSource();ns.buffer=noiseBuf(c);ns.loop=true;
  o.nf=c.createBiquadFilter();o.nf.type='lowpass';o.nf.frequency.value=SC.universe.nf;
  o.ng=c.createGain();o.ng.gain.value=0;ns.connect(o.nf);o.nf.connect(o.ng);o.ng.connect(o.sf);ns.start();o.ns=ns;
  var lf=c.createOscillator();lf.frequency.value=0.05;var lg=c.createGain();lg.gain.value=40;lf.connect(lg);lg.connect(o.nf.frequency);lf.start();o.lfo=lf;o.lg=lg;
  o.bell=c.createGain();o.bell.gain.value=1;o.bell.connect(o.out);
  return o;
}
function destroy(o,fade){
  if(!o)return;
  var c=o.ctx;
  try{var t=c.currentTime;o.out.gain.cancelScheduledValues(t);o.out.gain.setTargetAtTime(0,t,fade/3);}catch(e){}
  setTimeout(function(){
    try{o.osc.forEach(function(x){try{x.stop();}catch(e){}x.disconnect();});o.og.forEach(function(x){x.disconnect();});
      o.ns.stop();o.ns.disconnect();o.nf.disconnect();o.ng.disconnect();o.lfo.stop();o.lfo.disconnect();o.lg.disconnect();o.sf.disconnect();o.out.disconnect();o.bell.disconnect();}catch(e){}
  },fade*1000+300);
}
function level(){ // ortam seviyesi (ortak graf: müzik veri yolu zaten ölçekler)
  var base=0.45,st=aState();
  if(!G||!st)return base;
  if(G.t.shared)return base;
  if(st.muted)return 0;
  return base*SG.clamp(st.vol.master,0,1)*SG.clamp(st.vol.music,0,1); // ortak grafla aynı toplam seviye
}
function apply(immediate){
  if(!G)return;
  var c=G.ctx,t=c.currentTime,p=SC[W.scale]||SC.universe,ix=SG.clamp(W.speed|0,0,4);
  var tc=immediate?0.01:2.0;
  function set(par,v,k){par.cancelScheduledValues(t);par.setTargetAtTime(v,t,k==null?tc:k);}
  for(var i=0;i<G.osc.length;i++){
    var fi=G.shim&&i===G.osc.length-1?p.f[2]*2:p.f[i],gi=G.shim&&i===G.osc.length-1?0.05:p.g[i]*(SG.RM?0.8:1);
    set(G.osc[i].frequency,fi);set(G.og[i].gain,gi*0.9);
    try{set(G.osc[i].detune,SPD.det[ix],1.5);}catch(e){}
  }
  G.nf.type=p.nt;set(G.nf.frequency,p.nf);set(G.nf.Q,p.nq);
  set(G.ng.gain,p.ng*SPD.noi[ix],1.5);
  var lr=SG.RM?0.02:p.lfo;set(G.lfo.frequency,lr);set(G.lg.gain,p.nf*p.ld*(SG.RM?0.2:1));
  set(G.sf.frequency,SPD.cut[ix],1.2);
  set(G.out.gain,level()*SPD.lvl[ix],immediate?0.01:1.5);
}
/* ---------- bağlam yaşam döngüsü ---------- */
function running(){return !!(G&&G.ctx.state==='running'&&!hidden());}
function ensure(){
  if(!W.want)return;
  var t=getTarget();
  if(!t){if(G&&sharedGraph()===null){G=null;}return;}
  if(G&&(G.ctx!==t.ctx||G.tr!==tier())){var old=G;G=null;destroy(old,0.4);}
  if(!G){
    try{G=build(t);}catch(e){SG.log.err('a2:build',e);G=null;return;}
    apply(false);
  }
  if(!t.shared&&t.ctx.state==='suspended'&&shouldRunOwn()){try{t.ctx.resume();}catch(e){}}
}
function shouldRunOwn(){
  var st=aState();
  return !hidden()&&!(st&&st.music&&st.music.paused)&&Date.now()>=W.hold;
}
function ownPauseSync(){ // kalıcı bayrak yok: her saniye saatten ve SG.A durumundan türetilir
  if(!own)return;
  var c=own.ctx,run=shouldRunOwn();
  try{
    if(run&&c.state==='suspended')c.resume();
    else if(!run&&c.state==='running')c.suspend();
  }catch(e){}
  var st=aState();
  if(st&&own.master){var v=st.muted?0:SG.clamp(st.vol.master,0,1);own.master.gain.setTargetAtTime(v,c.currentTime,0.1);}
}
/* ---------- tını (sistem / gezegen) ---------- */
function bell(o){
  var c=o.ctx,t=c.currentTime+0.02,f=BELLS[Math.floor(Math.random()*BELLS.length)]*(Math.random()<0.3?0.5:1);
  var os=c.createOscillator(),g=c.createGain();os.type='sine';os.frequency.value=f;
  var amp=0.035*(W.scale==='planet'?0.7:1);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+0.03);g.gain.exponentialRampToValueAtTime(0.0002,t+3.2);
  os.connect(g);g.connect(o.bell);os.start(t);os.stop(t+3.4);
  os.onended=function(){try{g.disconnect();}catch(e){}};
}
function bellTick(){
  if(!G||!running())return;
  var p=SC[W.scale];if(!p||!p.bells||tier()<1)return;
  var now=Date.now();if(now<W.nextBell)return;
  var ix=SG.clamp(W.speed|0,0,4);
  if(ix===0){W.nextBell=now+4000;return;}
  W.nextBell=now+(p.bells===2?7000+Math.random()*7000:3200+Math.random()*5200)/(ix>=3?1.6:1);
  try{bell(G);}catch(e){SG.log.err('a2:bell',e);}
}
/* ---------- olay sesleri (kısa, yumuşak) ---------- */
function evBus(){var t=getTarget();return t&&t.ctx.state==='running'?t:null;}
function tone(t,c,dst,t0,f,dur,vol,type,f2){
  var os=c.createOscillator(),g=c.createGain();os.type=type||'sine';os.frequency.setValueAtTime(f,t0);
  if(f2)os.frequency.exponentialRampToValueAtTime(f2,t0+dur);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+Math.min(0.04,dur/4));g.gain.exponentialRampToValueAtTime(0.0002,t0+dur);
  os.connect(g);g.connect(dst);os.start(t0);os.stop(t0+dur+0.05);
  os.onended=function(){try{g.disconnect();}catch(e){}};
}
function swoosh(c,dst,t0,dur,f1,f2,vol){
  var s=c.createBufferSource();s.buffer=noiseBuf(c);var bp=c.createBiquadFilter();bp.type='bandpass';bp.Q.value=2.5;
  bp.frequency.setValueAtTime(f1,t0);bp.frequency.exponentialRampToValueAtTime(f2,t0+dur);
  var g=c.createGain();g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+dur*0.3);g.gain.exponentialRampToValueAtTime(0.0002,t0+dur);
  s.connect(bp);bp.connect(g);g.connect(dst);s.start(t0);s.stop(t0+dur+0.05);
  s.onended=function(){try{g.disconnect();bp.disconnect();}catch(e){}};
}
var EV={
  supernova:function(c,d,t,v){swoosh(c,d,t,2.6,2200,160,0.5*v);tone(0,c,d,t,110,2.4,0.16*v,'sine',38);tone(0,c,d,t+0.05,220,1.6,0.05*v,'triangle',70);return 2.8;},
  nova:function(c,d,t,v){tone(0,c,d,t,880,1.1,0.06*v,'sine');tone(0,c,d,t+0.12,1318,1.2,0.04*v,'sine');swoosh(c,d,t,0.9,3000,900,0.12*v);return 1.4;},
  comet:function(c,d,t,v){swoosh(c,d,t,2.2,5200,700,0.2*v);tone(0,c,d,t,1568,1.8,0.04*v,'sine',784);tone(0,c,d,t+0.25,1175,1.8,0.03*v,'sine',587);return 2.4;},
  nebula:function(c,d,t,v){[146.8,220,293.7,370].forEach(function(f,i){tone(0,c,d,t+i*0.25,f,3.2,0.05*v,'sine');});return 3.8;},
  'stellar-birth':function(c,d,t,v){[392,494,587].forEach(function(f,i){tone(0,c,d,t+i*0.22,f,1.9,0.055*v,'sine');});tone(0,c,d,t,98,2.2,0.08*v,'sine');return 2.6;},
  'star-dies':function(c,d,t,v){tone(0,c,d,t,392,2.4,0.06*v,'sine',196);tone(0,c,d,t+0.3,294,2.4,0.05*v,'sine',147);return 3;},
  'habitable-shift':function(c,d,t,v){tone(0,c,d,t,659,1.4,0.05*v,'sine');tone(0,c,d,t+0.18,880,1.6,0.045*v,'sine');return 2;},
  collision:function(c,d,t,v){tone(0,c,d,t,90,0.9,0.2*v,'sine',40);swoosh(c,d,t,0.7,900,120,0.3*v);return 1.2;},
  unlock:function(c,d,t,v){[523,659,784,1047].forEach(function(f,i){tone(0,c,d,t+i*0.09,f,1.1,0.05*v,'sine');});return 1.6;}
};
EV.discovery=EV.unlock;
EV.birth=EV['stellar-birth'];
A2.event=function(type,severity){
  try{
    var f=EV[type];if(!f)return false;
    var t=evBus();if(!t||!W.want)return false;
    var st=aState();if(st&&(st.muted||(st.vol&&st.vol.fx<=0)))return false;
    var now=Date.now();
    if(W.lastEv[type]&&now-W.lastEv[type]<500)return false;
    W.evCount=W.evCount.filter(function(x){return x>now;});
    if(W.evCount.length>=4)return false;
    W.lastEv[type]=now;
    var c=t.ctx,g=c.createGain();g.gain.value=1;g.connect(t.ev);
    var v=SG.clamp(0.8+0.15*((severity|0)||1),0.6,1.2);
    var dur=f(c,g,c.currentTime+0.02,v)||1;
    W.evCount.push(now+Math.min(dur,3)*1000);
    setTimeout(function(){try{g.disconnect();}catch(e){}},(dur+1)*1000);
    return true;
  }catch(e){SG.log.err('a2:event',e);return false;}
};
var UIMAP={tap:'ui_tap',open:'ui_menu',close:'ui_back',unlock:'tech_unlock',error:'ui_err'};
A2.ui=function(kind){
  try{
    var id=UIMAP[kind];if(!id)return false;
    if(SG.A&&SG.A.play&&SG.A.play(id))return true;
    if(kind==='unlock')return A2.event('unlock');
    var t=evBus();if(!t||!W.want)return false;
    var c=t.ctx,g=c.createGain();g.connect(t.ev);var f=kind==='error'?180:kind==='close'?440:660;
    tone(0,c,g,c.currentTime+0.01,f,0.12,0.06,'sine',kind==='error'?140:f*1.25);
    setTimeout(function(){try{g.disconnect();}catch(e){}},600);return true;
  }catch(e){SG.log.err('a2:ui',e);return false;}
};
/* ---------- genel API ---------- */
A2.start=function(){
  W.want=true;
  try{ensure();if(G)apply(false);}catch(e){SG.log.err('a2:start',e);}
  return true;
};
A2.stop=function(){
  W.want=false;
  var o=G;G=null;if(o)destroy(o,1.6);
};
A2.setScale=function(name){
  if(SCALES.indexOf(name)<0)return false;
  W.scale=name;W.nextBell=Date.now()+2500;
  if(G)apply(false);
  return true;
};
A2.setSpeed=function(ix){
  ix=SG.clamp(ix|0,0,4);W.speed=ix;
  if(G)apply(false);
  return true;
};
A2.state=function(){
  return{want:W.want,scale:W.scale,speed:W.speed,built:!!G,shared:!!(G&&G.t.shared),ctx:G?G.ctx.state:(own?own.ctx.state:'none'),tier:tier(),
    nodes:G?(G.osc.length*2+6):0};
};
A2._tap=function(){ // test için: ortam çıkışına analizör bağlar
  if(!G)return null;
  if(G.an)return G.an;
  var an=G.ctx.createAnalyser();an.fftSize=1024;G.out.connect(an);G.an=an;return an;
};
/* ---------- bağlantılar ---------- */
function gesture(){
  W.gestured=true;
  if(own&&own.ctx.state==='suspended'&&shouldRunOwn()){try{own.ctx.resume();}catch(e){}}
  if(W.want)ensure();
}
['pointerdown','touchend','keydown','click'].forEach(function(ev){document.addEventListener(ev,gesture,true);});
window.addEventListener('sg-pause',function(){W.hold=Date.now()+6000;ownPauseSync();});
window.addEventListener('sg-resume',function(){W.hold=0;ownPauseSync();if(W.want)ensure();});
document.addEventListener('visibilitychange',function(){ownPauseSync();});
window.addEventListener('pageshow',function(){ownPauseSync();});
try{SG.bus.on('u:event',function(e){if(e&&e.type)A2.event(e.type,e.severity);});
SG.bus.on('disc:unlock',function(){A2.event('unlock');});
SG.bus.on('p:tier',function(){if(W.want)ensure();});}catch(e){}
timers.push(setInterval(function(){
  try{ensure();ownPauseSync();bellTick();
    if(G&&G.ctx.state==='running'){ // ses/sessiz ayarı değiştiyse seviyeyi güncelle (yumuşak)
      var t=G.ctx.currentTime;G.out.gain.setTargetAtTime(level()*SPD.lvl[SG.clamp(W.speed|0,0,4)],t,0.6);
    }
  }catch(e){SG.log.err('a2:tick',e);}
},1000));
})();
