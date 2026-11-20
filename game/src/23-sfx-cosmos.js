/* SpacEgg 2.2 — SG.CSfx: kozmik etkileşim sesleri (dijital uzay efektleri, saf kod sentezi, dosya yok)
   Nesne seçimi (gezegen/yıldız/galaksi/uydu), gözlem, karar, ölçek geçişi, hız, olaylar, keşif, fotoğraf.
   Ses parametreleri nesneden deterministik türetilir (aynı nesne hep aynı karakter).
   Çekirdek (synth) ctx + hedef düğüm alır: OfflineAudioContext ile de render edilebilir (CSfx.render).
   Canlıda SG.A.graph() ortak bağlamını kullanır; ikinci AudioContext AÇILMAZ; kalıcı duraklatma bayrağı YOK:
   her çalmada ctx.state, SG.A.state() (sessiz/ses) ve sayfa görünürlüğü o anda okunur. */
(function(){
'use strict';
var CS=SG.CSfx={};
var CAL=/*CAL*/{"planet_rocky":0.716,"planet_ocean":0.806,"planet_ice":0.718,"planet_gas":0.382,"planet_lava":0.505,"planet_desert":1.203,"planet_ringed":0.897,"moon":1.626,"star_M":0.83,"star_K":1.223,"star_G":1.148,"star_F":1.194,"star_A":1.165,"star_B":0.943,"star_O":0.952,"star_giant":0.332,"star_dwarf":1.044,"star_neutron":0.717,"star_blackhole":0.771,"star_protostar":0.67,"galaxy_spiral":0.641,"galaxy_barred":0.7,"galaxy_elliptical":0.717,"galaxy_irregular":0.912,"observe_1":1.299,"observe_2":1.541,"observe_3":0.818,"decision_flat":0.833,"decision_down":0.875,"decision_up":0.88,"decision_fail":0.985,"warp_out_system":0.911,"warp_out_galaxy":0.543,"warp_out_universe":0.586,"warp_in_planet":0.775,"warp_in_system":0.91,"warp_in_galaxy":0.545,"speed_0":1.075,"speed_1":1.425,"speed_2":1.555,"speed_3":1.398,"speed_4":1.14,"focus":1.074,"up":1.478,"home":0.647,"ev_supernova":0.278,"ev_nova":0.66,"ev_comet":0.579,"ev_nebula":0.511,"ev_birth":0.847,"ev_death":0.476,"ev_habitable":0.591,"ev_collision":0.409,"discovery":0.911,"badge":0.585,"photo":1.843}/*END*/;           // ses başına kazanç (RAPOR.md ölçümünden)
CS.CAL=CAL;
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function rng(seed){var a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function hash(s){s=String(s);var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function now(){return typeof performance!=='undefined'?performance.now():Date.now();}

/* ---------- ses ilkelleri ---------- */
function env(p,t,a,pk,d){ // tık yok: 0.0001'den başlar/biter, en az 8 ms atak
  a=Math.max(0.008,Math.min(a,d*0.8));
  p.setValueAtTime(0.0001,t);p.linearRampToValueAtTime(pk,t+a);p.exponentialRampToValueAtTime(0.0001,t+d);
}
function pn(c,m,p){if(!p||!c.createStereoPanner)return m;var s=c.createStereoPanner();s.pan.value=clamp(p,-1,1);s.connect(m);return s;}
function done(src,nodes){src.onended=function(){for(var i=0;i<nodes.length;i++){try{nodes[i].disconnect();}catch(e){}}};}
function osc(K,o){ // {t,d,f,f2,w,v,a,p,det,lp}
  var c=K.c,os=c.createOscillator(),g=c.createGain(),t=o.t,d=o.d,nodes=[os,g];K.n++;
  os.type=o.w||'sine';os.frequency.setValueAtTime(o.f,t);
  if(o.f2)os.frequency.exponentialRampToValueAtTime(o.f2,t+d*(o.k||1));
  if(o.det)os.detune.value=o.det;
  env(g.gain,t,o.a==null?0.012:o.a,o.v,d);
  var n=os;if(o.lp){var f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(o.lp,t);if(o.lp2)f.frequency.exponentialRampToValueAtTime(o.lp2,t+d);os.connect(f);n=f;nodes.push(f);}
  var pp=pn(c,K.m,o.p);if(pp!==K.m)nodes.push(pp);
  n.connect(g);g.connect(pp);os.start(t);os.stop(t+d+0.04);done(os,nodes);
  K.end=Math.max(K.end,t+d);
}
function fm(K,o){ // {t,d,f,f2,r(oran),i(indeks),v,a,p}
  var c=K.c,t=o.t,d=o.d,car=c.createOscillator(),mod=c.createOscillator(),mg=c.createGain(),g=c.createGain(),nodes=[car,mod,mg,g];K.n+=2;
  car.frequency.setValueAtTime(o.f,t);if(o.f2)car.frequency.exponentialRampToValueAtTime(o.f2,t+d);
  mod.frequency.setValueAtTime(o.f*o.r,t);if(o.f2)mod.frequency.exponentialRampToValueAtTime(o.f2*o.r,t+d);
  var dep=o.f*o.i;mg.gain.setValueAtTime(dep,t);mg.gain.exponentialRampToValueAtTime(Math.max(0.5,dep*0.02),t+d*0.8);
  mod.connect(mg);mg.connect(car.frequency);env(g.gain,t,o.a==null?0.006:o.a,o.v,d);
  var pp=pn(c,K.m,o.p);if(pp!==K.m)nodes.push(pp);
  car.connect(g);g.connect(pp);car.start(t);mod.start(t);car.stop(t+d+0.04);mod.stop(t+d+0.04);done(car,nodes);
  K.end=Math.max(K.end,t+d);
}
function nz(K,o){ // {t,d,type,f,f2,q,v,a,p,p2}
  var c=K.c,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=o.t,d=o.d,nodes=[s,f,g];K.n++;
  s.buffer=K.nb;s.loop=true;
  f.type=o.type||'bandpass';f.Q.value=o.q==null?1.5:o.q;f.frequency.setValueAtTime(o.f,t);
  if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+d);
  env(g.gain,t,o.a==null?0.01:o.a,o.v,d);
  var pp=pn(c,K.m,o.p);if(pp!==K.m){nodes.push(pp);if(o.p2!=null)pp.pan.linearRampToValueAtTime(clamp(o.p2,-1,1),t+d);}
  s.connect(f);f.connect(g);g.connect(pp);s.start(t,K.r()*1.5);s.stop(t+d+0.04);done(s,nodes);
  K.end=Math.max(K.end,t+d);
}
function bell(K,o){ // inharmonik çan: {t,d,f,v,p}
  var R=[1,2.76,5.4,8.93],A=[1,0.45,0.22,0.1],D=[1,0.65,0.45,0.3];
  for(var i=0;i<(K.rich?4:2);i++)osc(K,{t:o.t,d:o.d*D[i],f:o.f*R[i],v:o.v*A[i],a:0.006,p:o.p});
}
function blips(K,o){ // veri cıvıltısı: {t,f:[...],step,d,v,w,p}
  for(var i=0;i<o.f.length;i++)osc(K,{t:o.t+i*o.step,d:o.d,f:o.f[i],w:o.w||'square',v:o.v,a:0.004,lp:o.lp||2600,p:o.p==null?(K.r()*1.2-0.6):o.p});
}
function thud(K,o){osc(K,{t:o.t,d:o.d,f:o.f,f2:o.f2,v:o.v,a:0.006,k:0.7});nz(K,{t:o.t,d:Math.min(o.d,0.18),type:'lowpass',f:260,f2:90,q:0.7,v:o.v*0.45,a:0.004});}
function shim(K,o){ // parıltı: ince detune'lu sinüs demeti {t,d,f,n,v}
  var n=K.rich?o.n:Math.max(2,o.n>>1);
  for(var i=0;i<n;i++)osc(K,{t:o.t+i*0.025,d:o.d*(1-i*0.08),f:o.f*(1+i*0.5+(K.r()-0.5)*0.03),v:o.v/(1+i*0.4),a:0.04+i*0.02,p:(i%2?1:-1)*(0.25+K.r()*0.5)});
}
function am(K,o){ // genlik titreşimli ton {t,d,f,rate,v}
  var c=K.c,t=o.t,d=o.d,os=c.createOscillator(),lf=c.createOscillator(),lg=c.createGain(),bg=c.createGain(),g=c.createGain(),nodes=[os,lf,lg,bg,g];K.n+=2;
  os.type=o.w||'sine';os.frequency.setValueAtTime(o.f,t);if(o.f2)os.frequency.exponentialRampToValueAtTime(o.f2,t+d);
  lf.frequency.value=o.rate;lg.gain.value=0.5;bg.gain.value=0.5;lf.connect(lg);lg.connect(bg.gain);os.connect(bg);bg.connect(g);
  env(g.gain,t,o.a==null?0.02:o.a,o.v,d);var pp=pn(c,K.m,o.p);if(pp!==K.m)nodes.push(pp);g.connect(pp);
  os.start(t);lf.start(t);os.stop(t+d+0.04);lf.stop(t+d+0.04);done(os,nodes);K.end=Math.max(K.end,t+d);
}
function pad(K,o){ // yumuşak akor {t,d,f:[...],v,a,w,lp}
  for(var i=0;i<o.f.length;i++)osc(K,{t:o.t,d:o.d,f:o.f[i],v:o.v/(1+i*0.25),a:o.a,w:o.w||'sine',det:(i-1)*5,lp:o.lp,p:(i%2?0.4:-0.4)});
}
function arp(K,o){ // {t,f:[...],step,d,v,w}
  for(var i=0;i<o.f.length;i++)osc(K,{t:o.t+i*o.step,d:o.d,f:o.f[i],w:o.w||'triangle',v:o.v,a:0.006,p:((i%3)-1)*0.5});
}
var PENT=[1,1.125,1.25,1.5,1.667,2];
var NOTE={c5:523.25,e5:659.25,g5:783.99,c6:1046.5,e6:1318.5,g6:1568,a4:440,d5:587.33,f5:698.46};

/* ---------- ses tanımları: fn(K,P,t) -> süre ---------- */
var S={};
/* gezegen: P={type,size(0..1),warm(0..1),hz(bool),seed} */
function pf(P){return 1250*Math.pow(0.22,P.size);}  // küçük gezegen tiz, büyük pes
S.planet_rocky=function(K,P,t){var f=pf(P),d=0.5+P.size*0.35;
  fm(K,{t:t,d:d,f:f*1.5,r:2.76,i:3.2+P.warm*2,v:0.2,p:-0.2});
  nz(K,{t:t,d:0.07,f:2600,f2:1100,q:3,v:0.18,a:0.004,p:0.3});
  fm(K,{t:t+0.1,d:d*0.8,f:f*2.25,r:1.41,i:2,v:0.1,p:0.3});
  thud(K,{t:t,d:0.22,f:f*0.35,f2:f*0.12,v:0.14});
  if(K.rich)blips(K,{t:t+0.18,f:[f*3,f*4,f*3.5],step:0.05,d:0.07,v:0.05,lp:2200});
  return d+0.2;};
S.planet_ocean=function(K,P,t){var f=pf(P)*0.7,d=1.15;
  nz(K,{t:t,d:d,f:260+P.warm*200,f2:2200,q:4.5,v:0.2,a:0.35,p:-0.6,p2:0.5});
  var r=K.r;for(var i=0;i<4;i++)osc(K,{t:t+0.1+i*0.13+r()*0.05,d:0.14,f:f*(1.2+r()*0.8),f2:f*(2.4+r()),v:0.08,a:0.01,p:r()*1.2-0.6});
  pad(K,{t:t,d:d,f:[f*2,f*3,f*4.5],v:0.06,a:0.3,lp:3000});
  if(K.rich)shim(K,{t:t+0.2,d:0.9,f:f*5,n:3,v:0.035});
  return d+0.1;};
S.planet_ice=function(K,P,t){var f=pf(P)*2.2,d=0.9;
  for(var i=0;i<4;i++)bell(K,{t:t+i*0.065,d:d-i*0.08,f:f*[1,1.5,2,2.5][i]*(1+(K.r()-0.5)*0.02),v:0.09,p:(i-1.5)*0.35});
  nz(K,{t:t,d:0.85,type:'highpass',f:5000,f2:9000,q:0.7,v:0.05,a:0.25,p:0});
  if(K.rich)shim(K,{t:t+0.1,d:0.7,f:f*2,n:3,v:0.03});
  return d+0.2;};
S.planet_gas=function(K,P,t){var f=45+(1-P.size)*30,d=1.45;
  osc(K,{t:t,d:d,f:f,f2:f*1.15,v:0.3,a:0.3,k:0.6});
  var c=K.c,o=c.createOscillator(),lf=c.createOscillator(),lg=c.createGain(),fl=c.createBiquadFilter(),g=c.createGain(),nodes=[o,lf,lg,fl,g];K.n+=2;
  o.type='sawtooth';o.frequency.value=f*2;fl.type='lowpass';fl.Q.value=4;fl.frequency.setValueAtTime(220,t);fl.frequency.linearRampToValueAtTime(900,t+d*0.45);fl.frequency.linearRampToValueAtTime(260,t+d);
  lf.frequency.value=5+P.warm*3;lg.gain.value=90;lf.connect(lg);lg.connect(fl.frequency);o.connect(fl);fl.connect(g);env(g.gain,t,0.3,0.1,d);g.connect(K.m);
  o.start(t);lf.start(t);o.stop(t+d+0.04);lf.stop(t+d+0.04);done(o,nodes);K.end=Math.max(K.end,t+d);
  nz(K,{t:t,d:d,type:'lowpass',f:200,f2:700,q:1,v:0.12,a:0.4,p:-0.2,p2:0.3});
  if(K.rich)osc(K,{t:t+0.1,d:1.1,f:f*3,v:0.06,a:0.3,det:8});
  return d+0.1;};
S.planet_lava=function(K,P,t){var f=pf(P)*0.3,d=1.0,r=K.r;
  thud(K,{t:t,d:0.5,f:f*1.2,f2:f*0.5,v:0.3});
  var n=K.rich?9:5;for(var i=0;i<n;i++)nz(K,{t:t+0.05+r()*0.8,d:0.02+r()*0.05,type:'highpass',f:1500+r()*2500,q:1,v:0.12+r()*0.1,a:0.003,p:r()*1.4-0.7});
  osc(K,{t:t,d:d,f:f*2,w:'sawtooth',v:0.1,a:0.15,lp:300,lp2:140});
  nz(K,{t:t,d:0.9,type:'lowpass',f:500,f2:150,q:1,v:0.14,a:0.08});
  return d+0.1;};
S.planet_desert=function(K,P,t){var f=pf(P)*1.8,d=1.0;
  nz(K,{t:t,d:d,f:900+P.warm*400,f2:1800,q:1.3,v:0.14,a:0.4,p:-0.8,p2:0.8});
  osc(K,{t:t+0.15,d:0.6,f:f*2,v:0.1,a:0.01,p:0.3});
  fm(K,{t:t+0.15,d:0.35,f:f*2,r:3.5,i:1.5,v:0.05,p:0.3});
  if(K.rich)blips(K,{t:t+0.4,f:[f*3,f*2.5],step:0.1,d:0.06,v:0.04,w:'triangle'});
  return d+0.1;};
S.planet_ringed=function(K,P,t){var f=pf(P)*0.8,d=1.35;
  nz(K,{t:t,d:d,f:500,f2:3200,q:5,v:0.14,a:0.3,p:-1,p2:1});
  nz(K,{t:t+0.1,d:d-0.1,f:3000,f2:450,q:5,v:0.1,a:0.3,p:1,p2:-1});
  bell(K,{t:t+0.05,d:1.0,f:f*2,v:0.12,p:-0.3});
  pad(K,{t:t,d:d,f:[f*2,f*3,f*4],v:0.07,a:0.35});
  if(K.rich)shim(K,{t:t+0.3,d:1.0,f:f*5,n:3,v:0.035});
  return d+0.1;};
S.moon=function(K,P,t){var f=1500+P.size*1100;
  osc(K,{t:t,d:0.32,f:f,f2:f*0.97,v:0.16,a:0.005,p:0.4});
  osc(K,{t:t+0.08,d:0.3,f:f*1.5,v:0.09,a:0.005,p:-0.4});
  if(K.rich)blips(K,{t:t+0.15,f:[f*2,f*2.5],step:0.05,d:0.05,v:0.04,w:'triangle'});
  return 0.5;};
/* yıldız: P={cls,phase,seed} */
var STF={O:2800,B:2200,A:1700,F:1350,G:1000,K:760,M:520};
function starBase(K,P,t){
  var f=STF[P.cls]||1000,hot=f>1900,low=f<700;
  am(K,{t:t,d:0.9,f:f/4,rate:hot?14:low?4:8,v:0.16,a:0.1,w:'triangle',p:-0.2});
  nz(K,{t:t,d:1.0,type:'bandpass',f:f*1.2,f2:f*2.2,q:hot?3:1.2,v:0.09,a:0.35,p:-0.5,p2:0.5});
  osc(K,{t:t+0.05,d:0.4,f:f,f2:hot?f*1.5:f*1.02,v:0.14,a:0.006,p:0.3});
  if(hot)osc(K,{t:t,d:0.35,f:f*2,f2:f*4,v:0.07,a:0.01,w:'triangle',lp:6000});
  if(low)osc(K,{t:t,d:0.9,f:f/2,v:0.12,a:0.2});
  if(K.rich)blips(K,{t:t+0.2,f:[f*1.5,f*2,f*1.25],step:0.06,d:0.06,v:0.04,w:'square',lp:3500});
  return 1.05;}
S.star_O=S.star_B=S.star_A=S.star_F=S.star_G=S.star_K=S.star_M=starBase;
S.star_giant=function(K,P,t){var f=(STF[P.cls]||900)/6;
  osc(K,{t:t,d:1.5,f:f,f2:f*1.4,v:0.3,a:0.6,k:0.8});
  osc(K,{t:t,d:1.4,f:f*2,w:'sawtooth',v:0.09,a:0.55,lp:200,lp2:900});
  nz(K,{t:t,d:1.3,type:'lowpass',f:200,f2:900,q:0.8,v:0.12,a:0.6});
  thud(K,{t:t+0.55,d:0.6,f:f*1.4,f2:f*0.7,v:0.16});
  return 1.6;};
S.star_dwarf=function(K,P,t){var f=3000+(P.seed%500);
  osc(K,{t:t,d:0.6,f:f,f2:f*0.95,v:0.14,a:0.005,p:0.5});
  bell(K,{t:t+0.08,d:0.7,f:f*0.5,v:0.08,p:-0.4});
  nz(K,{t:t,d:0.4,type:'highpass',f:6000,f2:9000,q:0.7,v:0.04,a:0.1});
  if(K.rich)blips(K,{t:t+0.2,f:[f*1.2,f,f*1.5],step:0.04,d:0.04,v:0.04,w:'sine'});
  return 0.9;};
S.star_neutron=function(K,P,t){
  am(K,{t:t,d:0.9,f:1300,rate:38,v:0.17,a:0.03,p:-0.3});
  am(K,{t:t,d:0.9,f:1950,rate:55,v:0.07,a:0.03,p:0.3});
  nz(K,{t:t,d:0.7,type:'bandpass',f:5000,f2:2500,q:6,v:0.06,a:0.1});
  if(K.rich)osc(K,{t:t,d:0.6,f:90,v:0.12,a:0.05});
  return 1.0;};
S.star_blackhole=function(K,P,t){
  osc(K,{t:t,d:1.3,f:900,f2:50,v:0.18,a:0.04,k:0.9});
  osc(K,{t:t+0.1,d:1.2,f:1350,f2:70,v:0.1,a:0.04,k:0.9,w:'triangle',p:0.3});
  nz(K,{t:t,d:0.95,type:'bandpass',f:200,f2:3500,q:2,v:0.14,a:0.85,p:-0.4,p2:0.4}); // ters yankı: yavaş atak, ani kesim
  osc(K,{t:t+0.9,d:0.5,f:48,v:0.22,a:0.01});
  return 1.45;};
S.star_protostar=function(K,P,t){var r=K.r;
  osc(K,{t:t,d:1.0,f:180,f2:420,v:0.14,a:0.25});
  for(var i=0;i<(K.rich?7:4);i++)nz(K,{t:t+r()*0.8,d:0.03+r()*0.04,type:'highpass',f:1800+r()*1500,q:1,v:0.1,a:0.004,p:r()*1.2-0.6});
  nz(K,{t:t,d:1.0,type:'bandpass',f:600,f2:1400,q:1.5,v:0.07,a:0.4});
  return 1.1;};
/* galaksi: P={kind,seed} */
S.galaxy_spiral=function(K,P,t){var r=K.r;
  nz(K,{t:t,d:1.5,f:400,f2:2600,q:3,v:0.12,a:0.5,p:-1,p2:1});
  nz(K,{t:t+0.12,d:1.4,f:2400,f2:380,q:3,v:0.09,a:0.5,p:1,p2:-1});
  pad(K,{t:t,d:1.6,f:[110,165,220,329.6],v:0.1,a:0.5,lp:2500});
  if(K.rich)shim(K,{t:t+0.3,d:1.2,f:880,n:4,v:0.03});
  return 1.7;};
S.galaxy_barred=function(K,P,t){var d=S.galaxy_spiral(K,P,t);
  am(K,{t:t,d:1.4,f:55,rate:3,v:0.2,a:0.3,w:'sine'});return d;};
S.galaxy_elliptical=function(K,P,t){
  pad(K,{t:t,d:1.7,f:[98,147,196,294,392],v:0.11,a:0.65,lp:1800});
  nz(K,{t:t,d:1.6,type:'lowpass',f:300,f2:1200,q:0.7,v:0.1,a:0.7});
  if(K.rich)shim(K,{t:t+0.4,d:1.2,f:588,n:3,v:0.025});
  return 1.8;};
S.galaxy_irregular=function(K,P,t){var r=K.r,sc=[1,1.25,1.5,1.875,2.25];
  for(var i=0;i<(K.rich?11:6);i++)osc(K,{t:t+r()*1.2,d:0.15+r()*0.2,f:880*sc[(r()*5)|0]*(r()<0.5?1:2),v:0.07,a:0.005,p:r()*1.6-0.8,w:r()<0.3?'triangle':'sine'});
  pad(K,{t:t,d:1.5,f:[130.8,196,261.6],v:0.07,a:0.5,lp:2000});
  nz(K,{t:t,d:1.3,f:900,f2:1800,q:1,v:0.06,a:0.4,p:-0.5,p2:0.5});
  return 1.6;};
/* gözlem seviyeleri */
function sonar(K,t,f,n,gap,v){for(var i=0;i<n;i++)osc(K,{t:t+i*gap,d:0.28,f:f,f2:f*0.9,v:v*Math.pow(0.5,i),a:0.006,p:i%2?0.4:-0.4});}
S.observe_1=function(K,P,t){sonar(K,t,880,3,0.2,0.2);nz(K,{t:t,d:0.6,f:1600,f2:900,q:4,v:0.05,a:0.1});return 0.95;};
S.observe_2=function(K,P,t){var r=K.r;sonar(K,t,988,2,0.18,0.17);
  var seq=[];for(var i=0;i<(K.rich?9:5);i++)seq.push(660*PENT[(r()*6)|0]*(r()<0.4?2:1));
  blips(K,{t:t+0.3,f:seq,step:0.055,d:0.06,v:0.07});return 1.0;};
S.observe_3=function(K,P,t){sonar(K,t,1047,2,0.16,0.14);
  blips(K,{t:t+0.2,f:[880,1175,1568],step:0.05,d:0.05,v:0.05});
  arp(K,{t:t+0.4,f:[NOTE.c5,NOTE.e5,NOTE.g5,NOTE.c6],step:0.08,d:0.5,v:0.13});
  bell(K,{t:t+0.7,d:0.8,f:NOTE.c6*1.5,v:0.1});
  if(K.rich)shim(K,{t:t+0.6,d:0.8,f:2093,n:3,v:0.03});
  return 1.6;};
/* karar: P={ok,dir:-1|0|1} */
function decision(K,P,t){var up=P.dir>0,dn=P.dir<0,d=0.6;
  var a=up?300:dn?2600:900,b=up?2800:dn?260:1200;
  osc(K,{t:t,d:d,f:a*0.4,f2:b*0.4,w:'sawtooth',v:0.1,a:0.05,lp:a,lp2:b});
  nz(K,{t:t,d:d,f:a,f2:b,q:3,v:0.1,a:0.15,p:up?-0.5:0.5,p2:up?0.5:-0.5});
  blips(K,{t:t,f:up?[600,720,860,1020]:dn?[1020,860,720,600]:[760,760],step:0.07,d:0.06,v:0.06,w:'triangle'});
  if(P.ok){bell(K,{t:t+0.38,d:0.9,f:NOTE.e6,v:0.12,p:-0.3});bell(K,{t:t+0.46,d:0.9,f:NOTE.g6,v:0.1,p:0.3});if(K.rich)shim(K,{t:t+0.45,d:0.8,f:2637,n:3,v:0.03});return 1.4;}
  osc(K,{t:t+0.4,d:0.3,f:150,f2:110,w:'sawtooth',v:0.1,a:0.01,lp:500});osc(K,{t:t+0.4,d:0.3,f:158,f2:116,w:'sawtooth',v:0.08,a:0.01,lp:500});
  return 0.9;}
S.decision_up=S.decision_down=S.decision_flat=decision;
S.decision_fail=function(K,P,t){P.ok=false;return decision(K,P,t);};
/* ölçek geçişi: P={dir:'in'|'out',scale} */
function warp(K,P,t){var inn=P.dir==='in',d=0.9;
  var a=inn?250:3200,b=inn?3600:250;
  osc(K,{t:t,d:d,f:a*0.3,f2:b*0.3,w:'sawtooth',v:0.11,a:0.1,lp:a,lp2:b,k:0.9});
  nz(K,{t:t,d:d,f:a,f2:b,q:2.5,v:0.16,a:0.25,p:inn?-0.6:0.6,p2:inn?0.6:-0.6});
  if(K.rich)nz(K,{t:t,d:d*0.8,type:'highpass',f:inn?2000:7000,f2:inn?9000:2500,q:0.7,v:0.05,a:0.3});
  var ta=t+d*0.62,sc=P.scale;
  if(sc==='universe'){pad(K,{t:ta,d:1.1,f:[55,82.4,110,164.8],v:0.14,a:0.25,lp:1600});}
  else if(sc==='galaxy'){pad(K,{t:ta,d:1.0,f:[110,165,220,330],v:0.13,a:0.2,lp:2500});if(K.rich)shim(K,{t:ta,d:0.9,f:880,n:3,v:0.03});}
  else if(sc==='system'){bell(K,{t:ta,d:0.9,f:440,v:0.12,p:-0.3});bell(K,{t:ta+0.1,d:0.9,f:554,v:0.1,p:0.3});bell(K,{t:ta+0.2,d:0.9,f:659,v:0.09});}
  else{thud(K,{t:ta,d:0.5,f:110,f2:45,v:0.2});osc(K,{t:ta+0.05,d:0.5,f:1320,v:0.1,a:0.005,p:0.3});}
  return d+0.5;}
S.warp_in_galaxy=S.warp_in_system=S.warp_in_planet=S.warp_out_universe=S.warp_out_galaxy=S.warp_out_system=warp;
/* hız: P={ix} */
S.speed_0=function(K,P,t){osc(K,{t:t,d:0.45,f:900,f2:150,v:0.15,a:0.01,lp:1500,lp2:200});nz(K,{t:t,d:0.35,type:'lowpass',f:1500,f2:150,q:1,v:0.08,a:0.02});thud(K,{t:t+0.12,d:0.3,f:90,f2:50,v:0.12});return 0.6;};
S.speed_1=function(K,P,t){blips(K,{t:t,f:[620,930],step:0.07,d:0.1,v:0.1,w:'triangle',p:0});osc(K,{t:t,d:0.3,f:310,f2:420,v:0.08,a:0.02,lp:900});return 0.4;};
S.speed_2=function(K,P,t){nz(K,{t:t,d:0.5,f:400,f2:2400,q:2,v:0.18,a:0.12,p:-0.4,p2:0.4});osc(K,{t:t,d:0.45,f:180,f2:620,w:'sawtooth',v:0.07,a:0.06,lp:700,lp2:2200});blips(K,{t:t+0.05,f:[700,1050,1400],step:0.05,d:0.06,v:0.06,w:'triangle'});return 0.65;};
S.speed_3=function(K,P,t){nz(K,{t:t,d:0.65,f:350,f2:4200,q:2,v:0.2,a:0.15,p:-0.6,p2:0.6});osc(K,{t:t,d:0.6,f:160,f2:900,w:'sawtooth',v:0.09,a:0.08,lp:600,lp2:3500});blips(K,{t:t+0.04,f:[800,1200,1600,2000],step:0.045,d:0.05,v:0.06,w:'triangle'});return 0.8;};
S.speed_4=function(K,P,t){nz(K,{t:t,d:0.85,f:300,f2:6000,q:2.2,v:0.22,a:0.2,p:-0.8,p2:0.8});osc(K,{t:t,d:0.8,f:150,f2:1600,w:'sawtooth',v:0.1,a:0.1,lp:500,lp2:5000});blips(K,{t:t+0.05,f:[900,1350,1800,2250,2700],step:0.04,d:0.05,v:0.055,w:'triangle'});
  if(K.rich)shim(K,{t:t+0.45,d:0.5,f:2400,n:3,v:0.03});thud(K,{t:t+0.55,d:0.3,f:110,f2:55,v:0.12});return 1.0;};
/* gezinme */
S.focus=function(K,P,t){sonar(K,t,1320,2,0.13,0.14);osc(K,{t:t,d:0.3,f:2000,f2:1000,v:0.08,a:0.005,p:-0.5});osc(K,{t:t,d:0.3,f:500,f2:1000,v:0.08,a:0.005,p:0.5});
  blips(K,{t:t+0.18,f:[1500,2000],step:0.05,d:0.05,v:0.05,w:'triangle'});return 0.55;};
S.up=function(K,P,t){osc(K,{t:t,d:0.4,f:1100,f2:360,w:'triangle',v:0.12,a:0.01,lp:2400,lp2:600});nz(K,{t:t,d:0.4,f:1800,f2:500,q:2,v:0.07,a:0.08});osc(K,{t:t+0.18,d:0.3,f:260,v:0.1,a:0.01});return 0.6;};
S.home=function(K,P,t){pad(K,{t:t,d:0.9,f:[110,165,220,330],v:0.12,a:0.12,lp:2400});arp(K,{t:t+0.05,f:[NOTE.g5*0.5,NOTE.c5,NOTE.g5],step:0.07,d:0.4,v:0.07});nz(K,{t:t,d:0.6,f:700,f2:300,q:1.5,v:0.06,a:0.1});return 1.0;};
/* olaylar: P={sev 1..3} */
function sv(P){return clamp(0.8+0.15*(P.sev||1),0.7,1.2);}
S.ev_supernova=function(K,P,t){var v=sv(P);
  nz(K,{t:t,d:0.34,f:300,f2:5000,q:2,v:0.1*v,a:0.3});            // yükselen ön ses
  var h=t+0.3;thud(K,{t:h,d:1.5,f:100,f2:26,v:0.34*v});
  nz(K,{t:h,d:1.5,type:'lowpass',f:4500,f2:130,q:0.8,v:0.2*v,a:0.03,p:-0.3,p2:0.3});
  bell(K,{t:h+0.05,d:1.4,f:880,v:0.1*v,p:-0.5});bell(K,{t:h+0.15,d:1.3,f:1320,v:0.07*v,p:0.5});
  if(K.rich)shim(K,{t:h+0.2,d:1.2,f:1760,n:4,v:0.03*v});
  return 1.9;};
S.ev_nova=function(K,P,t){var v=sv(P);bell(K,{t:t,d:1.1,f:880,v:0.12*v,p:-0.3});bell(K,{t:t+0.12,d:1.1,f:1318,v:0.09*v,p:0.3});
  nz(K,{t:t,d:0.7,type:'highpass',f:2500,f2:7000,q:0.8,v:0.09*v,a:0.03});blips(K,{t:t+0.1,f:[1760,2349,1760],step:0.06,d:0.05,v:0.05*v});return 1.3;};
S.ev_comet=function(K,P,t){var v=sv(P);
  nz(K,{t:t,d:1.4,type:'highpass',f:6500,f2:900,q:0.9,v:0.12*v,a:0.15,p:-0.85,p2:0.85});
  osc(K,{t:t,d:1.3,f:2400,f2:900,v:0.07*v,a:0.03,p:-0.7});
  for(var i=0;i<(K.rich?5:3);i++)osc(K,{t:t+0.1+i*0.16,d:0.5,f:1800-i*220,v:0.05*v,a:0.006,p:-0.5+i*0.25});
  return 1.5;};
S.ev_nebula=function(K,P,t){var v=sv(P);
  pad(K,{t:t,d:1.6,f:[146.8,220,293.7,370],v:0.13*v,a:0.55,lp:2400});
  nz(K,{t:t,d:1.5,f:600,f2:1500,q:1.2,v:0.07*v,a:0.6,p:-0.5,p2:0.5});
  if(K.rich)shim(K,{t:t+0.4,d:1.1,f:740,n:4,v:0.03*v});return 1.7;};
S.ev_birth=function(K,P,t){var v=sv(P);
  osc(K,{t:t,d:0.6,f:200,f2:1200,v:0.1*v,a:0.1,w:'triangle',lp:3000});
  arp(K,{t:t+0.35,f:[392,494,587],step:0.1,d:0.9,v:0.1*v});thud(K,{t:t,d:0.7,f:98,f2:140,v:0.16*v});
  if(K.rich)shim(K,{t:t+0.5,d:1.0,f:1175,n:3,v:0.03*v});return 1.5;};
S.ev_death=function(K,P,t){var v=sv(P);
  osc(K,{t:t,d:1.5,f:800,f2:100,v:0.12*v,a:0.03,k:0.9});osc(K,{t:t+0.2,d:1.4,f:600,f2:75,w:'triangle',v:0.1*v,a:0.03,p:0.3});
  osc(K,{t:t,d:1.5,f:60,v:0.18*v,a:0.3});nz(K,{t:t,d:1.2,type:'lowpass',f:2000,f2:150,q:0.8,v:0.08*v,a:0.05});return 1.6;};
S.ev_habitable=function(K,P,t){var v=sv(P);
  arp(K,{t:t,f:[NOTE.c5,NOTE.e5,NOTE.g5,NOTE.c6],step:0.1,d:0.9,v:0.1*v});
  pad(K,{t:t,d:1.3,f:[261.6,329.6,392],v:0.08*v,a:0.2});
  if(K.rich)shim(K,{t:t+0.3,d:1.0,f:1568,n:4,v:0.03*v});return 1.5;};
S.ev_collision=function(K,P,t){var v=sv(P);
  thud(K,{t:t,d:0.9,f:110,f2:34,v:0.34*v});
  nz(K,{t:t,d:0.8,f:1500,f2:150,q:0.8,v:0.2*v,a:0.006,p:-0.3,p2:0.3});
  fm(K,{t:t,d:0.6,f:330,r:1.41,i:6,v:0.12*v,p:0.3});
  for(var i=0;i<(K.rich?6:3);i++)osc(K,{t:t+0.1+i*0.07,d:0.1,f:2400-i*300,w:'square',v:0.04*v,a:0.004,lp:3000,p:K.r()*1.4-0.7});
  return 1.2;};
S.discovery=function(K,P,t){var ch=[[261.6,329.6,392],[293.7,370,440],[329.6,392,523.3]];
  for(var i=0;i<3;i++)pad(K,{t:t+i*0.16,d:1.0,f:ch[i],v:0.09,a:0.1,w:'triangle',lp:3000});
  blips(K,{t:t+0.05,f:[1047,1319,1568,2093],step:0.06,d:0.06,v:0.05,w:'triangle'});
  arp(K,{t:t+0.5,f:[NOTE.c6,NOTE.e6,NOTE.g6],step:0.08,d:0.7,v:0.1});
  if(K.rich)shim(K,{t:t+0.6,d:0.9,f:2093,n:4,v:0.035});return 1.5;};
S.badge=function(K,P,t){
  arp(K,{t:t,f:[NOTE.c5,NOTE.e5,NOTE.g5,NOTE.c6,NOTE.e6,NOTE.g6],step:0.07,d:0.8,v:0.1});
  pad(K,{t:t+0.4,d:1.1,f:[261.6,329.6,392,523.3],v:0.1,a:0.05,lp:3500});
  bell(K,{t:t+0.5,d:1.1,f:2093,v:0.1});if(K.rich)shim(K,{t:t+0.5,d:1.0,f:3136,n:4,v:0.03});
  return 1.6;};
S.photo=function(K,P,t){
  nz(K,{t:t,d:0.05,f:3200,q:1.5,v:0.2,a:0.004,p:-0.2});nz(K,{t:t+0.07,d:0.07,f:1700,q:1.5,v:0.18,a:0.004,p:0.2});
  osc(K,{t:t+0.12,d:0.5,f:400,f2:3200,w:'triangle',v:0.07,a:0.04,lp:4000,k:0.9});
  blips(K,{t:t+0.5,f:[1568,2093],step:0.07,d:0.07,v:0.07,w:'sine'});return 0.8;};
CS.NAMES=Object.keys(S);

/* ---------- motor ---------- */
function mkNoise(c){var n=Math.floor(c.sampleRate*2),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0),a=7;
  for(var i=0;i<n;i++){a=(Math.imul(a,1664525)+1013904223)>>>0;d[i]=(a/4294967296)*2-1;}return b;}
function mkImpulse(c){var n=Math.floor(c.sampleRate*1.3),b=c.createBuffer(2,n,c.sampleRate);
  for(var ch=0;ch<2;ch++){var d=b.getChannelData(ch),a=ch?991:373;for(var i=0;i<n;i++){a=(Math.imul(a,1664525)+1013904223)>>>0;d[i]=((a/4294967296)*2-1)*Math.pow(1-i/n,3);}}
  return b;}
/* motor: E.play(ad,P,t0) -> süre (sn) */
CS.engine=function(c,dst,opt){
  opt=opt||{};var E={c:c,tier:opt.tier==null?1:opt.tier};
  E.out=c.createGain();E.out.gain.value=0.9;
  E.comp=c.createDynamicsCompressor();E.comp.threshold.value=-14;E.comp.knee.value=8;E.comp.ratio.value=8;E.comp.attack.value=0.003;E.comp.release.value=0.2;
  E.out.connect(E.comp);E.comp.connect(dst);
  E.nb=mkNoise(c);
  try{E.conv=c.createConvolver();E.conv.buffer=mkImpulse(c);E.send=c.createGain();E.send.gain.value=0.28;E.rv=c.createGain();E.rv.gain.value=0.7;E.send.connect(E.conv);E.conv.connect(E.rv);E.rv.connect(E.comp);}catch(e){E.conv=null;}
  E.play=function(name,P,t0,vol){
    var f=S[name];if(!f)return 0;
    var m=c.createGain();m.gain.value=(CS.CAL[name]||1)*(vol==null?1:vol);
    m.connect(E.out);var tier=E.tier;if(E.conv&&tier>=1){m.connect(E.send);}
    P=P||{};var K={c:c,m:m,nb:E.nb,r:rng(P.seed!=null?P.seed:hash(name)),rich:tier>=1,n:0,end:0};
    var t=t0==null?c.currentTime+0.01:t0,dur=0;
    try{dur=f(K,P,t)||0;}catch(e){try{SG.log.err('csfx:'+name,e);}catch(x){}}
    E.last=K;
    return dur;
  };
  return E;
};
/* çevrimdışı render: PCM [L,R] + sr. */
CS.render=function(name,P,opt){
  opt=opt||{};var sr=opt.sr||44100,len=opt.len||3.2;
  var oc=new OfflineAudioContext(2,Math.ceil(sr*len),sr);
  var E=CS.engine(oc,oc.destination,{tier:opt.tier==null?2:opt.tier});
  var dur=E.play(name,P,0.05,opt.vol);
  return oc.startRendering().then(function(b){return{L:b.getChannelData(0),R:b.getChannelData(1),sr:sr,dur:dur,voices:E.last?E.last.n:0};});
};
/* çevrimdışı dizi: [{name,P,at}] tek tamponda */
CS.renderSeq=function(list,opt){
  opt=opt||{};var sr=opt.sr||44100,end=0;list.forEach(function(x){end=Math.max(end,x.at+2.2);});
  var oc=new OfflineAudioContext(2,Math.ceil(sr*(end+0.5)),sr);
  var E=CS.engine(oc,oc.destination,{tier:opt.tier==null?2:opt.tier});
  list.forEach(function(x){E.play(x.name,x.P,x.at,x.vol);});
  return oc.startRendering().then(function(b){return{L:b.getChannelData(0),R:b.getChannelData(1),sr:sr};});
};

/* ---------- nesne → ses parametresi ---------- */
var LOGR0=Math.log(0.3),LOGR1=Math.log(13);
function planetP(o,id){var rad=+o.radius||1,sz=clamp((Math.log(Math.max(0.1,rad))-LOGR0)/(LOGR1-LOGR0),0,1);
  var T=+o.temp;if(!isFinite(T))T=288;return{type:o.type,size:sz,warm:clamp((T+50)/700,0,1),hz:!!o.habZone,seed:hash(id)};}
function nameFor(kind,o,id){
  if(kind==='p'){var t=o.type;return S['planet_'+t]?'planet_'+t:'planet_rocky';}
  if(kind==='m')return 'moon';
  if(kind==='s'){var ph=o.phase;if(ph==='giant'||ph==='dwarf'||ph==='neutron'||ph==='blackhole'||ph==='protostar')return 'star_'+ph;return S['star_'+o.cls]?'star_'+o.cls:'star_G';}
  if(kind==='g')return S['galaxy_'+o.kind]?'galaxy_'+o.kind:'galaxy_spiral';
  return null;}
CS.forObject=function(o,id,kind){ // -> {name,P}
  var name=nameFor(kind,o,id);if(!name)return null;
  var P=kind==='p'?planetP(o,id):kind==='m'?{size:clamp((+o.radius||0.1)/0.3,0,1),seed:hash(id)}:{cls:o.cls,phase:o.phase,kind:o.kind,seed:hash(id)};
  return{name:name,P:P};};

/* ---------- canlı çalma ---------- */
var LIVE={E:null,ctx:null},lastAt={},active=[];
var SCALEIX={universe:0,galaxy:1,system:2,planet:3};
function tier(){try{return SG.P&&SG.P.tier?SG.P.tier():1;}catch(e){return 1;}}
function hidden(){try{return document.visibilityState==='hidden'||document.hidden===true;}catch(e){return false;}}
function engine(){
  var g=null;try{g=SG.A&&SG.A.graph?SG.A.graph():null;}catch(e){}
  if(!g||!g.ctx||g.ctx.state!=='running'||hidden())return null;
  var st=null;try{st=SG.A.state();}catch(e){}
  if(st&&(st.muted||(st.vol&&st.vol.fx<=0)))return null;
  if(!LIVE.E||LIVE.ctx!==g.ctx){try{LIVE.E=CS.engine(g.ctx,g.fx||g.music,{tier:tier()});LIVE.ctx=g.ctx;}catch(e){SG.log.err('csfx:engine',e);LIVE.E=null;return null;}}
  LIVE.E.tier=tier();
  return LIVE.E;
}
/* ad,P → true (çaldı) | 'skip' (sınır/yineleme: yine de "işlendi") | false (ses yok/sessiz) */
CS.play=function(name,P,vol,key){
  try{
    if(!S[name])return false;
    var E=engine();if(!E)return false;
    var n=now(),k=key||name;
    if(lastAt[k]&&n-lastAt[k]<80)return 'skip';
    active=active.filter(function(x){return x>n;});
    if(active.length>=8)return 'skip';
    var dur=E.play(name,P,null,vol);if(!dur)return false;
    lastAt[k]=n;active.push(n+Math.min(dur,1.8)*1000);
    return true;
  }catch(e){try{SG.log.err('csfx:play',e);}catch(x){}return false;}
};
function curUni(){try{return SG.HUD&&SG.HUD.uni?SG.HUD.uni():null;}catch(e){return null;}}
function kindOf(id){var m=/^g\d+(s\d+)?(p\d+)?(m\d+)?$/.exec(id||'');if(!m)return null;return m[3]?'m':m[2]?'p':m[1]?'s':'g';}
CS.select=function(id,kind){
  var u=curUni();if(!u||!id)return false;kind=kind||kindOf(id);
  var o=null;try{o=SG.U.find(u,id);}catch(e){}if(!o)return false;
  var x=CS.forObject(o,id,kind);if(!x)return false;
  return CS.play(x.name,x.P,1,'sel:'+id);
};
CS.scale=function(sc,from){
  var a=SCALEIX[sc],b=SCALEIX[from];if(a==null||b==null||a===b)return false;
  var inn=a>b;return CS.play('warp_'+(inn?'in':'out')+'_'+sc,{dir:inn?'in':'out',scale:sc},1,'scale');
};
CS.speed=function(ix){ix=clamp(ix|0,0,4);return CS.play('speed_'+ix,{ix:ix},1,'speed');};
CS.observe=function(id,level){level=clamp(level|0,1,3);return CS.play('observe_'+level,{level:level},1,'obs');};
CS.decision=function(d){
  d=d||{};var fx=d.effects||[],up=0,dn=0;
  for(var i=0;i<fx.length;i++){if(fx[i].to>fx[i].from)up++;else if(fx[i].to<fx[i].from)dn++;}
  var dir=up>dn?1:dn>up?-1:0,ok=d.ok!==false;
  var name=!ok?'decision_fail':dir>0?'decision_up':dir<0?'decision_down':'decision_flat';
  return CS.play(name,{ok:ok,dir:dir},1,'dec');
};
var EVMAP={supernova:'ev_supernova',nova:'ev_nova',comet:'ev_comet',nebula:'ev_nebula','stellar-birth':'ev_birth',birth:'ev_birth','star-dies':'ev_death','habitable-shift':'ev_habitable',collision:'ev_collision',unlock:'discovery',discovery:'discovery'};
CS.event=function(type,sev){var n=EVMAP[type];if(!n)return false;return CS.play(n,{sev:sev||1},1,'ev:'+n);};

/* ---------- bağlantılar ---------- */
var B=SG.bus;
if(B){
  B.on('sfx:select',function(e){if(e&&e.id)CS.select(e.id,e.kind);});
  B.on('sfx:scale',function(e){if(e)CS.scale(e.scale,e.from);});
  B.on('sfx:speed',function(e){if(e)CS.speed(e.ix);});
  B.on('sfx:decision',function(e){CS.decision(e);});
  B.on('sfx:observe',function(e){if(e)CS.observe(e.id,e.level);});
  B.on('sfx:focus',function(){CS.play('focus',{},1,'focus');});
  B.on('sfx:up',function(){CS.play('up',{},1,'up');});
  B.on('sfx:home',function(){CS.play('home',{},1,'home');});
  B.on('sfx:photo',function(){CS.play('photo',{},1,'photo');});
  B.on('disc:badge',function(){CS.play('badge',{},1,'badge');});
}
/* A2.event çift çalmasın: kozmik olayları ben çalarım; ses yoksa/tanınmazsa eski yola düş. */
try{
  var A2=SG.A2;
  if(A2&&A2.event&&!A2._csfx){
    var orig=A2.event;A2._csfx=true;
    A2.event=function(type,sev){var n=EVMAP[type];if(n){var r=CS.event(type,sev);if(r)return r===true;}return orig.call(A2,type,sev);};
  }
}catch(e){}
})();
