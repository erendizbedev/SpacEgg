/* SpacEgg v1.0 — ses motoru (saf WebAudio, harici dosya yok) */
(function(){
'use strict';
var SG=window.SG,A=SG.A;
var R_=Math.random,RATE=1;
/*CAL*/var CAL={"ui_tap":1.027,"ui_menu":1.148,"ui_back":1.149,"ui_tab":1.224,"ui_ok":1.003,"ui_err":1.044,"ui_toggle":1.123,"coin":1.37,"coin_big":1.239,"notify":1.089,"levelup":0.903,"plvlup":0.882,"mission":1.049,"badge":0.641,"egg_tap":1.158,"egg_crack":1.337,"egg_hatch":1.11,"planet_touch":1.285,"quake":0.829,"impact":0.433,"explosion":0.435,"volcano":0.803,"rain":2.053,"storm":0.871,"wind":3.153,"thunder":1.316,"ice":1.729,"fire":1.961,"flood":1.104,"life_human":2.294,"life_animal":1.348,"life_bird":2.493,"life_sea":0.9,"life_insect":6,"crowd":2.984,"city":1.688,"machine":1.366,"chem":2.379,"lab":1.374,"mine":0.578,"drill":1.273,"cargo":0.769,"ship_launch":1.5,"ship_arrive":1.131,"trade":1.5,"attack_launch":0.638,"hit":0.616,"shield_up":0.999,"shield_hit":0.865,"warp":1.007,"satellite_launch":1.986,"satellite_link":1.471,"signal":1.449,"blackhole":0.576,"supernova":0.386,"creation":1.04,"seed_grow":1.294,"tech_unlock":1.265,"war_horn":1.61,"peace":0.946,"choice_good":1.393,"choice_bad":1.688};/*END*/
/*MCAL*/var MCAL={"yanki":1.625,"sessiz":1.6,"merkez":1.954,"dukkan":1.943,"galaksi":1.577,"sav-ates":1.925,"sav-davul":1.837,"sav-zafer":1.92,"med-tarla":1.926,"med-sehir":1.933,"med-isik":1.766,"loj-yol":1.929,"loj-maden":1.667,"loj-yildiz":1.895,"yik-golge":1.733,"yik-kor":1.536,"yik-bosluk":1.593,"yar-tohum":1.803,"yar-isik":1.794,"yar-sonsuz":1.963};/*END*/
var PEAK_T=0.30;
/* ---------- yardımcılar ---------- */
var CC=new WeakMap();
function cache(c){var k=CC.get(c);if(!k){k={};CC.set(c,k);}return k;}
function noiseBuf(c,brown){
  var k=cache(c),n=brown?'b':'w';if(k[n])return k[n];
  var len=Math.floor(c.sampleRate*3.2),b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0),r=SG.rng(brown?7:3),last=0;
  for(var i=0;i<len;i++){var w=r()*2-1;if(brown){last=(last+0.02*w)/1.02;d[i]=last*3.5;}else d[i]=w;}
  k[n]=b;return b;
}
function env(p,t,att,dur,v,rel){
  if(att>=dur)att=dur*0.4;
  p.setValueAtTime(0,t);p.linearRampToValueAtTime(v,t+att);
  if(rel){var r=Math.min(rel,dur-att);p.linearRampToValueAtTime(v,t+dur-r);p.linearRampToValueAtTime(0,t+dur);}
  else{p.exponentialRampToValueAtTime(Math.max(1e-4,v*0.001),t+dur);p.linearRampToValueAtTime(0,t+dur+0.02);}
}
function tone(c,out,rev,t,p){
  var o=c.createOscillator();o.type=p.type||'sine';
  var f=(p.f||440)*RATE;o.frequency.setValueAtTime(f,t);
  if(p.f2)o.frequency.exponentialRampToValueAtTime(Math.max(20,p.f2*RATE),t+(p.glide||p.dur));
  if(p.det)o.detune.value=p.det;
  var g=c.createGain(),dur=p.dur,v=p.vol==null?0.3:p.vol;
  env(g.gain,t,p.att==null?0.008:p.att,dur,v,p.rel);
  var n=o;
  if(p.lp){var fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=p.lp;fl.Q.value=p.q||0.5;o.connect(fl);n=fl;}
  if(p.vib){var lf=c.createOscillator(),lg=c.createGain();lf.frequency.value=p.vib[0];lg.gain.value=f*p.vib[1];lf.connect(lg);lg.connect(o.frequency);lf.start(t);lf.stop(t+dur+0.05);}
  n.connect(g);var e=g;
  if(p.pan&&c.createStereoPanner){var sp=c.createStereoPanner();sp.pan.value=p.pan;g.connect(sp);e=sp;}
  e.connect(out);
  if(p.send){var s=c.createGain();s.gain.value=p.send;e.connect(s);s.connect(rev);}
  o.start(t);o.stop(t+dur+0.04);
}
function noise(c,out,rev,t,p){
  var s=c.createBufferSource();s.buffer=noiseBuf(c,p.brown);
  var fl=c.createBiquadFilter();fl.type=p.type||'lowpass';fl.frequency.setValueAtTime(p.f||1000,t);
  if(p.f2)fl.frequency.exponentialRampToValueAtTime(p.f2,t+p.dur);
  fl.Q.value=p.q||0.7;
  var g=c.createGain();env(g.gain,t,p.att==null?0.01:p.att,p.dur,p.vol==null?0.3:p.vol,p.rel);
  var n=fl;s.connect(fl);
  if(p.am){var a=c.createGain(),l=c.createOscillator(),lg=c.createGain();a.gain.value=1-p.am[1];l.frequency.value=p.am[0];lg.gain.value=p.am[1];l.connect(lg);lg.connect(a.gain);fl.connect(a);n=a;l.start(t);l.stop(t+p.dur+0.05);}
  n.connect(g);g.connect(out);
  if(p.send){var sd=c.createGain();sd.gain.value=p.send;g.connect(sd);sd.connect(rev);}
  s.start(t,R_()*0.4);s.stop(t+p.dur+0.04);
}
function bell(c,o,v,t,f,dur,vol,send){
  var sd=send==null?0.35:send;
  tone(c,o,v,t,{f:f,dur:dur,vol:vol,send:sd,att:0.004});
  tone(c,o,v,t,{f:f*2.76,dur:dur*0.45,vol:vol*0.28,att:0.003,send:sd*0.5});
  tone(c,o,v,t,{f:f*5.4,dur:dur*0.2,vol:vol*0.08,att:0.002});
}
function sparkle(c,o,v,t,n,span,vol){for(var i=0;i<n;i++)tone(c,o,v,t+R_()*span,{f:2000+R_()*3500,dur:0.12+R_()*0.15,vol:vol,send:0.5,att:0.003});}
function bubbles(c,o,v,t,n,span,vol,lo,hi){for(var i=0;i<n;i++){var f=lo+R_()*(hi-lo);tone(c,o,v,t+R_()*span,{f:f,f2:f*(1.4+R_()*0.8),dur:0.05+R_()*0.06,vol:vol,att:0.004,send:0.25});}}
var VOW={a:[800,1150,2800],o:[450,800,2830],u:[350,600,2700],e:[400,1600,2700],i:[270,2140,2950]};
function voice(c,o,v,t,f0,dur,vol,v1,v2){
  var s=c.createOscillator();s.type='sawtooth';s.frequency.setValueAtTime(f0*RATE,t);
  var l=c.createOscillator(),lg=c.createGain();l.frequency.value=5.2;lg.gain.value=f0*0.012;l.connect(lg);lg.connect(s.frequency);
  var g=c.createGain();env(g.gain,t,Math.min(0.3,dur*0.3),dur,vol,Math.min(0.5,dur*0.35));
  var a=VOW[v1],b=VOW[v2||v1],amp=[1,0.55,0.25];
  for(var i=0;i<3;i++){var f=c.createBiquadFilter();f.type='bandpass';f.Q.value=7+i*2;f.frequency.setValueAtTime(a[i],t);f.frequency.linearRampToValueAtTime(b[i],t+dur);var ga=c.createGain();ga.gain.value=amp[i];s.connect(f);f.connect(ga);ga.connect(g);}
  g.connect(o);var sd=c.createGain();sd.gain.value=0.6;g.connect(sd);sd.connect(v);
  s.start(t);s.stop(t+dur+0.04);l.start(t);l.stop(t+dur+0.04);
}
function call(c,o,v,t,pts,dur,vol,type){
  var os=c.createOscillator();os.type=type||'triangle';
  os.frequency.setValueAtTime(pts[0][1]*RATE,t);
  for(var i=1;i<pts.length;i++)os.frequency.linearRampToValueAtTime(pts[i][1]*RATE,t+pts[i][0]*dur);
  var fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=2600;
  var g=c.createGain();env(g.gain,t,dur*0.2,dur,vol,dur*0.5);
  os.connect(fl);fl.connect(g);g.connect(o);var sd=c.createGain();sd.gain.value=0.35;g.connect(sd);sd.connect(v);
  os.start(t);os.stop(t+dur+0.04);
}
function PF(i){var oc=Math.floor(i/5),s=[0,2,4,7,9][((i%5)+5)%5]+12*oc;return 261.63*Math.pow(2,s/12);}
/* ---------- ses tarifleri: f(c,out,rev,t,x) -> bildirilen süre ---------- */
var R={};
R.ui_tap=function(c,o,v,t){tone(c,o,v,t,{f:PF(7),dur:0.09,vol:0.22,send:0.15});return 0.1;};
R.ui_menu=function(c,o,v,t){tone(c,o,v,t,{f:PF(5),dur:0.12,vol:0.2,type:'triangle',lp:3000,send:0.2});tone(c,o,v,t+0.06,{f:PF(7),dur:0.14,vol:0.2,type:'triangle',lp:3000,send:0.2});return 0.22;};
R.ui_back=function(c,o,v,t){tone(c,o,v,t,{f:PF(7),dur:0.12,vol:0.2,type:'triangle',lp:3000,send:0.2});tone(c,o,v,t+0.06,{f:PF(5),dur:0.14,vol:0.2,type:'triangle',lp:3000,send:0.2});return 0.22;};
R.ui_tab=function(c,o,v,t){tone(c,o,v,t,{f:PF(8),dur:0.12,vol:0.18,send:0.12});return 0.14;};
R.ui_ok=function(c,o,v,t){tone(c,o,v,t,{f:PF(5),dur:0.18,vol:0.22,send:0.3});tone(c,o,v,t+0.09,{f:PF(8),dur:0.28,vol:0.22,send:0.3});return 0.4;};
R.ui_err=function(c,o,v,t){tone(c,o,v,t,{f:233,f2:200,dur:0.2,vol:0.22,type:'triangle',lp:900,send:0.1});tone(c,o,v,t+0.12,{f:196,f2:165,dur:0.22,vol:0.22,type:'triangle',lp:900,send:0.1});return 0.38;};
R.ui_toggle=function(c,o,v,t){tone(c,o,v,t,{f:520,f2:740,glide:0.08,dur:0.1,vol:0.2,send:0.1});return 0.12;};
R.coin=function(c,o,v,t){tone(c,o,v,t,{f:PF(10),dur:0.09,vol:0.2,send:0.2});tone(c,o,v,t+0.07,{f:PF(12),dur:0.3,vol:0.22,send:0.3});return 0.4;};
R.coin_big=function(c,o,v,t){var n=[10,12,13,14];for(var i=0;i<4;i++)tone(c,o,v,t+i*0.07,{f:PF(n[i]),dur:0.3,vol:0.2,send:0.3});sparkle(c,o,v,t+0.2,4,0.3,0.03);return 0.75;};
R.notify=function(c,o,v,t){bell(c,o,v,t,PF(8),0.5,0.2);bell(c,o,v,t+0.12,PF(10),0.7,0.2);return 0.85;};
R.levelup=function(c,o,v,t){var n=[5,7,8,10,12];for(var i=0;i<5;i++)bell(c,o,v,t+i*0.12,PF(n[i]),0.6,0.16);[5,7,8].forEach(function(k){tone(c,o,v,t,{f:PF(k),dur:1.3,att:0.2,rel:0.6,vol:0.05,send:0.4});});sparkle(c,o,v,t+0.5,6,0.8,0.03);return 1.5;};
R.plvlup=function(c,o,v,t){var n=[3,5,7,8,10,12,14];for(var i=0;i<7;i++)bell(c,o,v,t+i*0.1,PF(n[i]),0.55,0.15);bell(c,o,v,t+0.7,PF(15),1.0,0.18,0.5);[5,8,10].forEach(function(k){tone(c,o,v,t,{f:PF(k),dur:1.8,att:0.25,rel:0.8,vol:0.05,send:0.4});});sparkle(c,o,v,t+0.6,8,1.0,0.03);return 1.85;};
R.mission=function(c,o,v,t){var n=[5,8,10];for(var i=0;i<3;i++)bell(c,o,v,t+i*0.14,PF(n[i]),0.6,0.2);return 1.1;};
R.badge=function(c,o,v,t){[8,10,12].forEach(function(k){bell(c,o,v,t,PF(k),1.0,0.14,0.45);});sparkle(c,o,v,t+0.1,6,0.7,0.035);return 1.4;};
R.egg_tap=function(c,o,v,t){tone(c,o,v,t,{f:320,f2:200,dur:0.09,vol:0.25,send:0.1});noise(c,o,v,t,{type:'bandpass',f:1200,q:2,dur:0.04,vol:0.08});return 0.12;};
R.egg_crack=function(c,o,v,t){for(var i=0;i<6;i++)noise(c,o,v,t+R_()*0.6,{type:'highpass',f:2500,dur:0.02,vol:0.18});tone(c,o,v,t,{f:140,f2:90,dur:0.4,vol:0.15,lp:400,send:0.2});return 0.8;};
R.egg_hatch=function(c,o,v,t){noise(c,o,v,t,{type:'bandpass',f:400,f2:3000,q:1.5,att:0.8,dur:1.0,vol:0.1,send:0.3});tone(c,o,v,t,{f:PF(0),dur:1.0,att:0.7,vol:0.1,send:0.3});var n=[5,8,10,12];for(var i=0;i<4;i++)bell(c,o,v,t+0.9+i*0.13,PF(n[i]),0.9,0.16,0.5);sparkle(c,o,v,t+1.0,8,1.0,0.03);return 2.3;};
R.planet_touch=function(c,o,v,t,x){var d=[7,8,10,12];var f=PF(d[Math.floor(R_()*d.length)]);tone(c,o,v,t,{f:f,dur:0.6,vol:0.2,send:0.4,att:0.004});tone(c,o,v,t,{f:f*3.01,dur:0.2,vol:0.04,att:0.003});return 0.65;};
R.quake=function(c,o,v,t){noise(c,o,v,t,{brown:1,f:90,f2:60,q:1,att:0.3,dur:2.2,vol:0.6,am:[7,0.5]});tone(c,o,v,t,{f:42,f2:34,dur:2.2,att:0.3,vol:0.25});for(var i=0;i<5;i++)noise(c,o,v,t+0.2+R_()*1.6,{type:'bandpass',f:600,q:1,dur:0.08,vol:0.08});return 2.3;};
R.impact=function(c,o,v,t){tone(c,o,v,t,{f:160,f2:38,glide:0.35,dur:0.9,vol:0.5});noise(c,o,v,t,{type:'bandpass',f:500,f2:200,dur:0.6,vol:0.35});noise(c,o,v,t,{brown:1,f:200,dur:1.2,vol:0.4,send:0.3});return 1.4;};
R.explosion=function(c,o,v,t){noise(c,o,v,t,{f:2500,f2:180,q:0.5,dur:1.8,vol:0.4,send:0.35});tone(c,o,v,t,{f:120,f2:30,dur:1.3,vol:0.45});for(var i=0;i<6;i++)noise(c,o,v,t+0.2+R_()*1.0,{type:'highpass',f:2500,dur:0.05,vol:0.06});return 2.0;};
R.volcano=function(c,o,v,t){noise(c,o,v,t,{brown:1,f:140,q:1,att:0.5,dur:2.3,vol:0.5,am:[5,0.4]});for(var i=0;i<5;i++)noise(c,o,v,t+0.3+R_()*1.7,{type:'bandpass',f:900,q:2,dur:0.15,vol:0.12});tone(c,o,v,t,{f:55,dur:2.3,att:0.5,vol:0.2});return 2.4;};
R.rain=function(c,o,v,t){noise(c,o,v,t,{type:'highpass',f:2500,q:0.5,att:0.5,rel:0.6,dur:2.0,vol:0.12});for(var i=0;i<18;i++)tone(c,o,v,t+R_()*1.8,{f:1800+R_()*2400,dur:0.03,vol:0.04,att:0.002});return 2.1;};
R.storm=function(c,o,v,t){noise(c,o,v,t,{type:'highpass',f:2200,att:0.5,rel:0.6,dur:2.2,vol:0.14});noise(c,o,v,t,{brown:1,f:300,att:0.6,rel:0.6,dur:2.2,vol:0.35,am:[0.9,0.5]});noise(c,o,v,t+0.2,{type:'bandpass',f:400,f2:900,q:2,att:0.6,rel:0.5,dur:1.8,vol:0.15});return 2.4;};
R.wind=function(c,o,v,t){noise(c,o,v,t,{type:'bandpass',f:300,f2:900,q:3,att:0.7,rel:0.7,dur:2.2,vol:0.25});noise(c,o,v,t,{type:'bandpass',f:800,f2:400,q:3,att:0.7,rel:0.7,dur:2.2,vol:0.15});return 2.3;};
R.thunder=function(c,o,v,t){noise(c,o,v,t,{brown:1,f:260,f2:90,att:0.05,dur:2.4,vol:0.6,am:[9,0.4]});noise(c,o,v,t,{f:1200,f2:200,dur:0.8,vol:0.25});return 2.45;};
R.ice=function(c,o,v,t){for(var i=0;i<10;i++)tone(c,o,v,t+R_()*0.8,{f:2400+R_()*2800,dur:0.25,vol:0.1,send:0.5,att:0.002});noise(c,o,v,t,{type:'highpass',f:6000,dur:0.12,vol:0.05});return 1.2;};
R.fire=function(c,o,v,t){noise(c,o,v,t,{f:900,att:0.2,rel:0.4,dur:1.8,vol:0.14});for(var i=0;i<16;i++)noise(c,o,v,t+R_()*1.7,{type:'bandpass',f:1500+R_()*1500,q:1,dur:0.015+R_()*0.02,vol:0.15});return 1.9;};
R.flood=function(c,o,v,t){noise(c,o,v,t,{f:500,f2:1100,att:0.8,rel:0.6,dur:2.2,vol:0.35});bubbles(c,o,v,t+0.3,10,1.7,0.07,250,700);return 2.3;};
R.life_human=function(c,o,v,t){var f=[131,165,196],d=[0,0.12,0.25],a=[['a','o'],['u','a'],['o','u']];for(var i=0;i<3;i++)voice(c,o,v,t+d[i],f[i],1.6-d[i],0.14,a[i][0],a[i][1]);return 1.9;};
R.life_animal=function(c,o,v,t){call(c,o,v,t,[[0,400],[0.4,620],[1,380]],0.5,0.2);call(c,o,v,t+0.7,[[0,450],[0.5,700],[1,420]],0.55,0.18);return 1.3;};
R.life_bird=function(c,o,v,t){var q=[0,0.1,0.2,0.3];for(var i=0;i<4;i++)tone(c,o,v,t+q[i],{f:2600+i*150,f2:3600,dur:0.08,vol:0.12,send:0.3});for(var j=0;j<6;j++)tone(c,o,v,t+0.55+j*0.05,{f:3200+(j%2)*500,dur:0.04,vol:0.09,send:0.3});return 1.0;};
R.life_sea=function(c,o,v,t){call(c,o,v,t,[[0,180],[0.5,320],[1,140]],2.0,0.25,'sine');tone(c,o,v,t,{f:360,f2:280,dur:1.8,att:0.5,vol:0.04,send:0.4});bubbles(c,o,v,t+0.5,4,1.6,0.06,300,800);return 2.3;};
R.life_insect=function(c,o,v,t){[3800,4300].forEach(function(f,i){var s=c.createOscillator();s.type='sawtooth';s.frequency.value=f*RATE;var b=c.createBiquadFilter();b.type='bandpass';b.frequency.value=f;b.Q.value=6;var a=c.createGain();a.gain.value=0.1;var l=c.createOscillator(),lg=c.createGain();l.frequency.value=38+i*6;lg.gain.value=0.1;l.connect(lg);lg.connect(a.gain);var g=c.createGain();env(g.gain,t+i*0.15,0.1,1.0,0.12,0.3);s.connect(b);b.connect(a);a.connect(g);g.connect(o);s.start(t+i*0.15);s.stop(t+i*0.15+1.05);l.start(t+i*0.15);l.stop(t+i*0.15+1.05);});return 1.2;};
R.crowd=function(c,o,v,t){[450,800,1300,2000].forEach(function(f){noise(c,o,v,t,{type:'bandpass',f:f,q:1.2,att:0.6,rel:0.6,dur:2.2,vol:0.08,am:[2+R_()*3,0.6]});});voice(c,o,v,t+0.2,131,1.6,0.05,'a');voice(c,o,v,t+0.5,196,1.5,0.05,'o');return 2.4;};
R.city=function(c,o,v,t){[110,165,220].forEach(function(f){tone(c,o,v,t,{f:f,att:0.5,rel:0.6,dur:2.0,vol:0.05,send:0.2});});noise(c,o,v,t,{type:'bandpass',f:700,q:0.8,att:0.5,rel:0.6,dur:2.0,vol:0.05,am:[0.7,0.5]});tone(c,o,v,t+0.5,{f:PF(10),dur:0.05,vol:0.04});tone(c,o,v,t+1.3,{f:PF(10),dur:0.05,vol:0.04});return 2.1;};
R.machine=function(c,o,v,t){for(var i=0;i<8;i++){tone(c,o,v,t+i*0.14,{f:70,type:'sawtooth',dur:0.09,vol:0.2,lp:300});noise(c,o,v,t+i*0.14,{type:'bandpass',f:1800,dur:0.03,vol:0.05});}bell(c,o,v,t+1.2,520,0.3,0.12);return 1.55;};
R.chem=function(c,o,v,t){bubbles(c,o,v,t,14,1.4,0.1,300,900);noise(c,o,v,t,{type:'highpass',f:5000,att:0.3,dur:1.5,vol:0.04});return 1.6;};
R.lab=function(c,o,v,t){bell(c,o,v,t,PF(12),0.4,0.12);bell(c,o,v,t+0.2,PF(14),0.5,0.1);bubbles(c,o,v,t,6,1.0,0.08,300,900);return 1.2;};
R.mine=function(c,o,v,t){[0,0.3].forEach(function(d,i){var k=i?0.6:1;tone(c,o,v,t+d,{f:110,f2:55,dur:0.25,vol:0.45*k});tone(c,o,v,t+d,{f:880,dur:0.5,type:'triangle',vol:0.1*k,send:0.3});noise(c,o,v,t+d,{type:'bandpass',f:1500,dur:0.05,vol:0.2*k});});return 1.0;};
R.drill=function(c,o,v,t){tone(c,o,v,t,{f:90,type:'sawtooth',dur:0.9,att:0.1,rel:0.2,vol:0.2,lp:500,vib:[24,0.04]});noise(c,o,v,t,{type:'bandpass',f:2000,q:2,dur:0.9,att:0.1,rel:0.2,vol:0.08,am:[26,0.8]});return 1.0;};
R.cargo=function(c,o,v,t){tone(c,o,v,t,{f:70,f2:90,dur:1.3,att:0.5,vol:0.25});noise(c,o,v,t,{f:300,dur:1.3,att:0.5,vol:0.1});tone(c,o,v,t+1.1,{f:100,f2:60,dur:0.2,vol:0.35});noise(c,o,v,t+1.1,{type:'bandpass',f:900,dur:0.04,vol:0.15});return 1.5;};
R.ship_launch=function(c,o,v,t){noise(c,o,v,t,{type:'bandpass',f:300,f2:3000,q:1,att:0.3,dur:1.6,vol:0.25});tone(c,o,v,t,{f:90,f2:500,dur:1.5,vol:0.2,lp:1500});return 1.7;};
R.ship_arrive=function(c,o,v,t){noise(c,o,v,t,{type:'bandpass',f:3000,f2:400,q:1,dur:1.4,vol:0.2});tone(c,o,v,t,{f:500,f2:110,dur:1.3,vol:0.15,lp:1500});bell(c,o,v,t+0.9,PF(8),0.6,0.15);return 1.7;};
R.trade=function(c,o,v,t){tone(c,o,v,t,{f:PF(10),dur:0.1,vol:0.2,send:0.2});tone(c,o,v,t+0.1,{f:PF(12),dur:0.12,vol:0.2,send:0.2});bell(c,o,v,t+0.22,PF(14),0.5,0.16);noise(c,o,v,t,{type:'bandpass',f:2000,dur:0.12,vol:0.04});return 0.9;};
R.attack_launch=function(c,o,v,t){noise(c,o,v,t,{type:'bandpass',f:2400,f2:400,q:1.2,dur:0.8,vol:0.28});tone(c,o,v,t,{f:440,f2:110,dur:0.7,type:'sawtooth',lp:1200,vol:0.15});tone(c,o,v,t,{f:80,dur:0.2,vol:0.3});return 0.9;};
R.hit=function(c,o,v,t){tone(c,o,v,t,{f:200,f2:60,dur:0.3,vol:0.45});noise(c,o,v,t,{type:'bandpass',f:800,dur:0.15,vol:0.3});return 0.4;};
R.shield_up=function(c,o,v,t){[7,10,12].forEach(function(k){tone(c,o,v,t,{f:PF(k),f2:PF(k)*1.5,dur:1.0,att:0.35,vol:0.1,send:0.4});});noise(c,o,v,t,{type:'highpass',f:5000,att:0.4,dur:1.0,vol:0.04});bell(c,o,v,t+0.5,PF(12),0.6,0.12);return 1.2;};
R.shield_hit=function(c,o,v,t){bell(c,o,v,t,900,0.45,0.22,0.4);tone(c,o,v,t,{f:1250,dur:0.2,vol:0.1});noise(c,o,v,t,{type:'bandpass',f:3000,dur:0.04,vol:0.1});return 0.5;};
R.warp=function(c,o,v,t){tone(c,o,v,t,{f:90,f2:1400,dur:1.3,att:0.2,vol:0.2,send:0.2});tone(c,o,v,t,{f:135,f2:2100,dur:1.3,att:0.2,vol:0.1});noise(c,o,v,t,{type:'bandpass',f:500,f2:4000,q:3,dur:1.2,vol:0.15});tone(c,o,v,t+1.2,{f:60,dur:0.3,vol:0.3});return 1.55;};
R.satellite_launch=function(c,o,v,t){noise(c,o,v,t,{type:'bandpass',f:400,f2:2500,q:1,dur:0.8,vol:0.2});[10,12,14].forEach(function(k,i){tone(c,o,v,t+0.8+i*0.1,{f:PF(k),dur:0.06,vol:0.15,send:0.3});});return 1.2;};
R.satellite_link=function(c,o,v,t){tone(c,o,v,t,{f:PF(10),dur:0.1,vol:0.18,send:0.5});tone(c,o,v,t+0.15,{f:PF(10),dur:0.1,vol:0.18,send:0.5});tone(c,o,v,t+0.3,{f:PF(14),dur:0.3,vol:0.2,send:0.5});return 0.7;};
R.signal=function(c,o,v,t){[0,0.18,0.36].forEach(function(d){tone(c,o,v,t+d,{f:1100,dur:0.08,vol:0.2,send:0.3});});tone(c,o,v,t+0.55,{f:1400,dur:0.3,vol:0.12,send:0.6});return 0.95;};
R.blackhole=function(c,o,v,t){tone(c,o,v,t,{f:90,f2:28,att:0.4,dur:2.3,vol:0.4});noise(c,o,v,t,{brown:1,f:160,f2:50,att:0.6,dur:2.3,vol:0.5});tone(c,o,v,t,{f:2000,f2:300,dur:1.6,vol:0.05,send:0.4});return 2.4;};
R.supernova=function(c,o,v,t){noise(c,o,v,t,{type:'bandpass',f:300,f2:6000,q:1,att:1.0,dur:1.4,vol:0.2});tone(c,o,v,t+1.1,{f:100,f2:30,dur:1.2,vol:0.5});noise(c,o,v,t+1.1,{f:3000,f2:200,dur:1.2,vol:0.35,send:0.3});[5,8,12].forEach(function(k){bell(c,o,v,t+1.15,PF(k),1.2,0.08,0.5);});return 2.4;};
R.creation=function(c,o,v,t){[0,2,4].forEach(function(k){tone(c,o,v,t,{f:PF(k),att:0.8,rel:0.8,dur:2.2,vol:0.07,send:0.4});});for(var i=0;i<8;i++)bell(c,o,v,t+0.3+i*0.2,PF(5+i),0.5,0.1,0.5);sparkle(c,o,v,t+0.4,8,1.6,0.03);return 2.4;};
R.seed_grow=function(c,o,v,t){[2,4,5,7,8].forEach(function(k,i){tone(c,o,v,t+i*0.12,{f:PF(k),type:'triangle',dur:0.25,vol:0.2,lp:2500,send:0.2});tone(c,o,v,t+i*0.12,{f:PF(k)*4,dur:0.06,vol:0.04});});return 1.0;};
R.tech_unlock=function(c,o,v,t){[7,10,14].forEach(function(k,i){bell(c,o,v,t+i*0.08,PF(k),0.6,0.14,0.4);});sparkle(c,o,v,t,5,0.4,0.03);tone(c,o,v,t,{f:2000,dur:0.1,vol:0.05});return 1.2;};
R.war_horn=function(c,o,v,t){[98,98.6].forEach(function(f){tone(c,o,v,t,{f:f,f2:f*1.12,glide:1.2,type:'sawtooth',lp:700,att:0.4,rel:0.5,dur:1.5,vol:0.1,send:0.3});});tone(c,o,v,t,{f:147,type:'sawtooth',lp:700,att:0.4,rel:0.5,dur:1.5,vol:0.05});return 1.6;};
R.peace=function(c,o,v,t){[5,7,10].forEach(function(k){tone(c,o,v,t,{f:PF(k),att:0.5,rel:0.8,dur:1.8,vol:0.09,send:0.4});});bell(c,o,v,t+0.5,PF(12),0.9,0.1,0.5);return 1.9;};
R.choice_good=function(c,o,v,t){tone(c,o,v,t,{f:PF(7),dur:0.3,vol:0.2,send:0.3});tone(c,o,v,t+0.1,{f:PF(10),dur:0.35,vol:0.2,send:0.3});return 0.6;};
R.choice_bad=function(c,o,v,t){tone(c,o,v,t,{f:PF(2),type:'triangle',lp:800,dur:0.3,vol:0.18,send:0.2});tone(c,o,v,t+0.12,{f:PF(0),type:'triangle',lp:800,dur:0.3,vol:0.18,send:0.2});return 0.6;};
A.IDS=('ui_tap ui_menu ui_back ui_tab ui_ok ui_err ui_toggle coin coin_big notify levelup plvlup mission badge egg_tap egg_crack egg_hatch planet_touch quake impact explosion volcano rain storm wind thunder ice fire flood life_human life_animal life_bird life_sea life_insect crowd city machine chem lab mine drill cargo ship_launch ship_arrive trade attack_launch hit shield_up shield_hit warp satellite_launch satellite_link signal blackhole supernova creation seed_grow tech_unlock war_horn peace choice_good choice_bad').split(' ');
A._R=R;
/* ---------- yankı ---------- */
function createRev(c,dest,wet){
  var len=Math.floor(c.sampleRate*1.3),ir=c.createBuffer(2,len,c.sampleRate),r=SG.rng(11);
  for(var ch=0;ch<2;ch++){var d=ir.getChannelData(ch),y=0;for(var i=0;i<len;i++){var x=(r()*2-1)*Math.exp(-i/c.sampleRate*5.2);y+=0.45*(x-y);d[i]=y;}}
  var cv=c.createConvolver();cv.buffer=ir;var inp=c.createGain(),w=c.createGain();w.gain.value=wet==null?0.5:wet;
  inp.connect(cv);cv.connect(w);w.connect(dest);return inp;
}
/* ---------- müzik üreteci ---------- */
var SCALES={pent:[0,2,4,7,9],mpent:[0,3,5,7,10],dor:[0,2,3,5,7,9,10],lyd:[0,2,4,6,7,9,11],aeo:[0,2,3,5,7,8,10],phr:[0,1,3,5,7,8,10],mix:[0,2,4,5,7,9,10],whole:[0,2,4,6,8,10]};
var P=[
 {id:'yanki',name:'Yankı',ctx:'login',root:57,scale:'dor',prog:[0,5,3,4],bpm:54,wave:'triangle',lp:1400,div:1,aprob:0.5,bell:0.35,drone:1},
 {id:'sessiz',name:'Sessiz Kapı',ctx:'login',root:55,scale:'mpent',prog:[0,3,0,4],bpm:50,wave:'sine',lp:1200,div:0.5,aprob:0.6,bell:0.4,drone:1},
 {id:'merkez',name:'Merkez Üs',ctx:'hub',root:62,scale:'lyd',prog:[0,4,5,3],bpm:62,wave:'triangle',lp:1800,div:1,aprob:0.55,bell:0.3},
 {id:'dukkan',name:'Yıldız Pazarı',ctx:'shop',root:55,scale:'mix',prog:[0,3,4,0],bpm:78,wave:'triangle',lp:2200,div:2,aprob:0.4,bell:0.25},
 {id:'galaksi',name:'Galaksi Rüzgârı',ctx:'galaxy',root:52,scale:'lyd',prog:[0,2,4,2],bpm:50,wave:'sine',lp:1500,div:0.5,aprob:0.5,bell:0.4,bed:0.05,drone:1},
 {id:'sav-ates',name:'Ateş Çizgisi',type:'sav',root:50,scale:'phr',prog:[0,1,0,4],bpm:84,wave:'sawtooth',lp:900,div:1,aprob:0.45,bell:0.1,bass:'walk',perc:1},
 {id:'sav-davul',name:'Sessiz Davul',type:'sav',root:57,scale:'aeo',prog:[0,5,3,6],bpm:92,wave:'triangle',lp:1100,div:1,aprob:0.35,bell:0.12,bass:'walk',perc:1},
 {id:'sav-zafer',name:'Zafer Eşiği',type:'sav',root:48,scale:'mix',prog:[0,4,5,3],bpm:88,wave:'sawtooth',lp:1000,div:1,aprob:0.4,bell:0.2,bass:'walk',perc:1},
 {id:'med-tarla',name:'Altın Tarla',type:'med',root:55,scale:'pent',prog:[0,3,4,0],bpm:66,wave:'triangle',lp:1800,div:1,aprob:0.5,bell:0.3},
 {id:'med-sehir',name:'Işık Şehri',type:'med',root:60,scale:'lyd',prog:[0,4,3,5],bpm:72,wave:'triangle',lp:2000,div:1,aprob:0.55,bell:0.35},
 {id:'med-isik',name:'Ortak Işık',type:'med',root:53,scale:'pent',prog:[0,2,3,4],bpm:70,wave:'sine',lp:2200,div:1,aprob:0.45,bell:0.5},
 {id:'loj-yol',name:'Kervan Yolu',type:'loj',root:52,scale:'dor',prog:[0,3,4,3],bpm:76,wave:'triangle',lp:1600,div:2,aprob:0.4,bell:0.15,bass:1,perc:2},
 {id:'loj-maden',name:'Derin Damar',type:'loj',root:47,scale:'aeo',prog:[0,5,4,5],bpm:68,wave:'triangle',lp:900,div:1,aprob:0.3,bell:0.2,drone:1,bass:1},
 {id:'loj-yildiz',name:'Yıldız Hattı',type:'loj',root:57,scale:'mix',prog:[0,4,3,4],bpm:80,wave:'triangle',lp:1800,div:2,aprob:0.4,bell:0.2,bass:1,perc:2},
 {id:'yik-golge',name:'Gölge Sınırı',type:'yik',root:42,scale:'phr',prog:[0,1,0,5],bpm:56,wave:'sawtooth',lp:700,div:0.5,aprob:0.4,bell:0.15,drone:1},
 {id:'yik-kor',name:'Kor Sessizlik',type:'yik',root:48,scale:'aeo',prog:[0,6,5,6],bpm:48,wave:'sine',lp:800,div:0.5,aprob:0.5,bell:0.3,drone:1},
 {id:'yik-bosluk',name:'Boşluğun Kenarı',type:'yik',root:50,scale:'whole',prog:[0,2,4,1],bpm:52,wave:'triangle',lp:1000,div:0.5,aprob:0.45,bell:0.3,drone:1,bed:0.04},
 {id:'yar-tohum',name:'İlk Tohum',type:'yar',root:62,scale:'pent',prog:[0,2,3,4],bpm:64,wave:'sine',lp:2000,div:1,aprob:0.55,bell:0.4},
 {id:'yar-isik',name:'Doğan Işık',type:'yar',root:57,scale:'lyd',prog:[0,4,5,2],bpm:60,wave:'sine',lp:2200,div:1,aprob:0.5,bell:0.45},
 {id:'yar-sonsuz',name:'Sonsuz Bahçe',type:'yar',root:64,scale:'pent',prog:[0,3,2,4],bpm:58,wave:'triangle',lp:2400,div:1,aprob:0.55,bell:0.5}
];
var SHIFT={sav:0,med:2,loj:5,yik:-3,yar:7};
function scheduleBar(c,dest,rev,t,bi,Pr,era,shift,rng){
  era=SG.clamp(era|0,0,8);
  var beat=60/(Pr.bpm*(1+era*0.012)),bar=beat*4,sc=SCALES[Pr.scale],n=sc.length,rootM=Pr.root+shift;
  var deg=Pr.prog[bi%Pr.prog.length];
  function mid(d,oc){var o=Math.floor(d/n);return rootM+sc[((d%n)+n)%n]+12*(o+(oc||0));}
  function hz(m){return 440*Math.pow(2,(m-69)/12);}
  var tn=[mid(deg),mid(deg+2),mid(deg+4)],lpv=Pr.lp*(1+era*0.1),k,i;
  var pa=Math.min(1.6,bar*0.4);
  for(k=0;k<3;k++){[-7,7].forEach(function(dt){tone(c,dest,rev,t,{f:hz(tn[k]),type:Pr.wave,det:dt,lp:lpv,dur:bar+1.0,att:pa,rel:1.0,vol:0.035,send:0.3});});}
  if(era>=3)tone(c,dest,rev,t,{f:hz(tn[0]+12),dur:bar+0.8,att:pa,rel:0.8,vol:0.02,send:0.4});
  if(era>=2||Pr.bass){
    tone(c,dest,rev,t,{f:hz(tn[0]-12),dur:bar*0.96,att:0.05,rel:0.3,vol:0.09});
    if(Pr.bass==='walk'){tone(c,dest,rev,t+beat,{f:hz(tn[2]-12),dur:beat*0.9,att:0.03,rel:0.2,vol:0.06});tone(c,dest,rev,t+2*beat,{f:hz(tn[1]-12),dur:beat*0.9,att:0.03,rel:0.2,vol:0.06});}
  }
  if(Pr.drone)tone(c,dest,rev,t,{f:hz(rootM-24),dur:bar+1.5,att:1.2,rel:1.2,vol:0.07});
  var div=Pr.div*(era>=5?2:1),steps=Math.max(1,Math.round(4*div)),prob=Pr.aprob*(0.35+0.65*Math.min(1,era/4)),pat=[0,1,2,1];
  for(i=0;i<steps;i++){if(rng()<prob){var ix=pat[i%4]%3,m=tn[ix]+12*(1+(rng()<0.25?1:0)),sd=beat/div;tone(c,dest,rev,t+i*sd,{f:hz(m),type:'triangle',dur:Math.min(0.9,sd*2.6),att:0.006,vol:0.06,send:0.35,lp:lpv*1.6});}}
  for(i=0;i<4;i++){if(rng()<Pr.bell*(0.5+era/12)){bell(c,dest,rev,t+i*beat,hz(mid(deg+Math.floor(rng()*5),2)),1.4,0.035,0.6);}}
  if(Pr.perc===1){
    if(era>=1){tone(c,dest,rev,t,{f:100,f2:48,dur:0.22,vol:0.11,lp:300});tone(c,dest,rev,t+2*beat,{f:100,f2:48,dur:0.22,vol:0.09,lp:300});}
    if(era>=2)for(i=0;i<4;i++)noise(c,dest,rev,t+i*beat+beat/2,{type:'bandpass',f:3500,dur:0.03,vol:0.025});
  }else if(Pr.perc===2){for(i=0;i<4;i++)tone(c,dest,rev,t+i*beat,{f:60,dur:0.2,vol:0.06,lp:200});}
  if(Pr.bed)noise(c,dest,rev,t,{type:'bandpass',f:500,f2:700,q:2,dur:bar+0.8,att:0.8,rel:0.8,vol:Pr.bed});
  if(era>=7)tone(c,dest,rev,t,{f:hz(tn[1]+24),dur:bar,att:1,rel:1,vol:0.018,send:0.7});
  return bar;
}
function pickPreset(ctxName,type,era){
  if(ctxName==='login')return SG.pick([0,1],Math.random);
  if(ctxName==='hub')return 2;
  if(ctxName==='shop')return 3;
  if(ctxName==='galaxy')return 4;
  var idx=[];P.forEach(function(p,i){if(p.type===type)idx.push(i);});
  if(!idx.length)return 2;
  return idx[Math.min(idx.length-1,Math.floor(SG.clamp(era,0,8)/3))];
}
A.music={presets:P};
/* ---------- canlı motor ---------- */
var S={ctx:null,master:null,comp:null,fxBus:null,musicBus:null,duck:null,fxRev:null,musRev:null,
  unlocked:false,paused:false,muted:false,vol:{master:1,music:0.26,fx:0.8},wantCtx:null,type:null,era:0,cur:null,played:0,skipped:0,lastGesture:0};
var saved=SG.store.get('audio',null);
if(saved){if(saved.vol)for(var kk in saved.vol)if(typeof saved.vol[kk]==='number')S.vol[kk]=SG.clamp(saved.vol[kk],0,1);S.muted=!!saved.muted;}
function persist(){SG.store.set('audio',{vol:S.vol,muted:S.muted});}
function ensure(){
  if(S.ctx)return S.ctx;
  var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  var c;try{c=new AC({latencyHint:'interactive'});}catch(e){SG.log.err('audio',e);return null;}
  S.ctx=c;S.born=Date.now();S.badSince=0;
  S.master=c.createGain();S.master.gain.value=S.muted?0:S.vol.master;
  S.comp=c.createDynamicsCompressor();S.comp.threshold.value=-14;S.comp.knee.value=12;S.comp.ratio.value=6;S.comp.attack.value=0.003;S.comp.release.value=0.2;
  S.master.connect(S.comp);S.comp.connect(c.destination);
  S.fxBus=c.createGain();S.fxBus.gain.value=S.vol.fx;S.fxBus.connect(S.master);
  S.musicBus=c.createGain();S.musicBus.gain.value=S.vol.music;S.musicBus.connect(S.master);
  S.duck=c.createGain();S.duck.gain.value=1;S.duck.connect(S.musicBus);
  S.fxRev=createRev(c,S.fxBus,0.5);S.musRev=createRev(c,S.duck,0.7);
  return c;
}
function tryResume(){
  var c=S.ctx;if(!c||c.state==='running')return;
  try{var pr=c.resume();if(pr&&pr.catch)pr.catch(function(){});}catch(e){}
}
A.unlock=function(){
  var c=ensure();if(!c)return false;
  S.lastGesture=Date.now();
  tryResume();
  if(!S.unlocked){
    try{var b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}catch(e){}
    S.unlocked=true;
    if(S.wantCtx&&!S.cur)startTrack(true);
  }
  return true;
};
/* ---------- duraklat / sürdür ----------
   Kural: duraklatma kilidi asla kalıcı olamaz. Dokunuş/tuş uygulamanın ön planda olduğunu kanıtlar ve her şeyi açar;
   görünürken 1,5 sn sonra (Java'dan gelen sg-pause için 6 sn sonra) bekçi de açar. */
var LIVE=[],PS={at:0,hold:false};
function isHidden(){try{return document.visibilityState==='hidden'||document.hidden===true;}catch(e){return false;}}
A.pauseAll=function(){
  S.paused=true;PS.at=Date.now();
  LIVE.forEach(function(t){try{t.pauseEls();}catch(e){}});
  if(S.ctx&&S.ctx.state==='running'){try{S.ctx.suspend();}catch(e){}}
};
A.resumeAll=function(){
  S.paused=false;PS.hold=false;
  if(S.ctx&&S.unlocked)tryResume();
  LIVE.forEach(function(t){try{t.resumeEls();}catch(e){}});
  if(S.wantCtx&&!S.cur&&S.unlocked&&S.ctx)startTrack(true);
};
A.gesture=function(){
  A.unlock();
  if(S.paused)A.resumeAll();else tryResume();
  var c=S.cur;if(c&&c.retry){try{c.retry();}catch(e){}}
};
['pointerdown','touchend','keydown','click'].forEach(function(ev){document.addEventListener(ev,function(){A.gesture();},{passive:true,capture:true});});
document.addEventListener('visibilitychange',function(){if(isHidden())A.pauseAll();else A.resumeAll();});
window.addEventListener('pagehide',function(){if(isHidden())A.pauseAll();});
window.addEventListener('pageshow',function(){if(!isHidden())A.resumeAll();});
window.addEventListener('focus',function(){if(!isHidden()&&S.paused&&!PS.hold)A.resumeAll();});
window.addEventListener('sg-pause',function(){PS.hold=true;A.pauseAll();PS.hold=true;});
window.addEventListener('sg-resume',function(){A.resumeAll();});
/* bekçi: duraklatma takılı kalmasın, ses bağlamı canlansın (1 sn) */
function rebuildCtx(){
  var old=S.ctx;if(!old)return;
  var oc=S.cur;S.cur=null;
  if(oc){try{if(oc.isFile)oc.kill();else clearInterval(oc.timer);}catch(e){}}
  try{old.close();}catch(e){}
  S.ctx=S.master=S.comp=S.fxBus=S.musicBus=S.duck=S.fxRev=S.musRev=null;S.unlocked=false;S.badSince=0;S.rebuilt=(S.rebuilt||0)+1;S.lastRebuild=Date.now();
  A.unlock();
}
setInterval(function(){
  var now=Date.now();
  if(S.paused&&!isHidden()&&now-PS.at>(PS.hold?6000:1500))A.resumeAll();
  var c=S.ctx;
  if(c&&S.unlocked&&!S.paused&&!isHidden()){
    if(c.state==='running')S.badSince=0;
    else{
      tryResume();
      if(!S.badSince)S.badSince=now;
      else if(now-S.badSince>3000&&S.lastGesture>=S.born&&now-(S.lastRebuild||0)>10000)rebuildCtx();
    }
  }
},1000);
var recent=[],lastId={},longEnds=[];
var LONGGAP={};'quake impact explosion volcano rain storm wind thunder fire flood crowd city machine blackhole supernova creation warp life_human life_animal life_bird life_sea life_insect egg_hatch levelup plvlup'.split(' ').forEach(function(k){LONGGAP[k]=1;});
var PRIO={levelup:1,plvlup:1,egg_hatch:1,badge:1,mission:1};
A.play=function(id,opts){
  opts=opts||{};var r=R[id];if(!r)return false;
  var c=S.ctx;if(!c||!S.unlocked||S.paused||S.muted||S.vol.fx<=0)return false;
  if(c.state!=='running'){tryResume();return false;}
  var now=performance.now();
  longEnds=longEnds.filter(function(x){return x>now;});
  if(!opts.force){
    var gap=LONGGAP[id]?400:(id.indexOf('ui_')===0?70:140);
    if(lastId[id]&&now-lastId[id]<gap){S.skipped++;return false;}
    recent=recent.filter(function(x){return now-x<500;});
    if((recent.length>=4||(longEnds.length>=3&&LONGGAP[id]))&&!PRIO[id]){S.skipped++;return false;}
  }
  lastId[id]=now;recent.push(now);
  var g=c.createGain();g.gain.value=(CAL[id]||1)*(opts.vol==null?1:opts.vol);
  var out=g;
  if(opts.pan&&c.createStereoPanner){var sp=c.createStereoPanner();sp.pan.value=SG.clamp(opts.pan,-1,1);g.connect(sp);out=sp;}
  out.connect(S.fxBus);var v=c.createGain();v.gain.value=CAL[id]||1;v.connect(S.fxRev);
  var dur=0;
  var sr=R_,sRate=RATE;R_=opts.r||Math.random;RATE=opts.rate||1;
  try{dur=r(c,g,v,c.currentTime+0.01,opts);}catch(e){SG.log.err('play:'+id,e);}
  R_=sr;RATE=sRate;
  S.played++;
  var long_=dur>=0.9;if(long_)longEnds.push(now+Math.min(dur,3)*1000);
  if(dur>=0.9&&S.duck){var t=c.currentTime;S.duck.gain.cancelScheduledValues(t);S.duck.gain.setTargetAtTime(0.55,t,0.05);S.duck.gain.setTargetAtTime(1,t+dur,0.4);}
  setTimeout(function(){try{g.disconnect();v.disconnect();if(out!==g)out.disconnect();}catch(e){}},(dur+1.8)*1000);
  return true;
};
A.graph=function(){return S.ctx&&S.unlocked?{ctx:S.ctx,music:S.musicBus,fx:S.fxBus}:null;};
A.setVol=function(kind,val){
  val=SG.clamp(+val||0,0,1);S.vol[kind]=val;persist();
  var c=S.ctx;if(!c)return;var t=c.currentTime;
  var node=kind==='master'?(S.muted?null:S.master):kind==='music'?S.musicBus:kind==='fx'?S.fxBus:null;
  if(node){node.gain.cancelScheduledValues(t);node.gain.setTargetAtTime(val,t,0.05);}
};
A.mute=function(b){
  S.muted=!!b;persist();var c=S.ctx;if(!c)return;var t=c.currentTime;
  S.master.gain.cancelScheduledValues(t);S.master.gain.setTargetAtTime(S.muted?0:S.vol.master,t,S.muted?0.5:0.4);
};
function barLenOf(Pr,era){return 4*60/(Pr.bpm*(1+SG.clamp(era,0,8)*0.012));}
function Track(pi,fadeIn){
  var c=S.ctx;this.pi=pi;this.P=P[pi];this.lvl=c.createGain();this.lvl.gain.value=MCAL[this.P.id]||1;
  this.g=c.createGain();this.g.gain.value=0;this.lvl.connect(this.g);this.g.connect(S.duck);
  this.bar=0;this.next=c.currentTime+0.1;this.rng=SG.rng(SG.hash(this.P.id)+Math.floor(Date.now()/60000));this.last=Date.now();
  var self=this;this.timer=setInterval(function(){self.tick();},250);this.tick();
  var t=c.currentTime,n=64,cv=new Float32Array(n);for(var i=0;i<n;i++)cv[i]=Math.sin(i/(n-1)*Math.PI/2);
  this.g.gain.setValueAtTime(0,t);this.g.gain.setValueCurveAtTime(cv,t,fadeIn);
}
Track.prototype.tick=function(){
  var c=S.ctx;if(!c)return;this.last=Date.now();
  if(c.state!=='running')return;
  if(this.next<c.currentTime-1)this.next=c.currentTime+0.05;
  var shift=this.P.type?0:(SHIFT[S.type]||0),n=0;
  while(this.next<c.currentTime+2.5&&n++<4){
    var bl=scheduleBar(c,this.lvl,S.musRev,this.next,this.bar++,this.P,S.era,shift,this.rng);this.next+=bl;
  }
};
Track.prototype.fadeOut=function(sec,done){
  var c=S.ctx,t=c.currentTime,n=64,cv=new Float32Array(n),i,self=this;
  for(i=0;i<n;i++)cv[i]=Math.cos(i/(n-1)*Math.PI/2)*(this.g.gain.value>0.001?1:1);
  clearInterval(this.timer);
  try{this.g.gain.cancelScheduledValues(t);var cur=Math.max(0.0001,this.g.gain.value);for(i=0;i<n;i++)cv[i]*=cur;this.g.gain.setValueCurveAtTime(cv,t+0.01,sec);}catch(e){}
  setTimeout(function(){try{self.g.disconnect();self.lvl.disconnect();}catch(e){}if(done)done();},(sec+0.3)*1000);
};
/* ---------- dosya tabanlı müzik: Android kabuğunda kayıtlı Opus döngüler (CPU yok, cızırtı yok) ---------- */
var FILEMODE=location.protocol==='file:'&&!/[?&]nofile=1/.test(location.search),fileBroken=false,XF=4;
/*FG*/var FG=[0.749,0.779,0.88,0.961,1.009,1.001,0.978,1.066,0.64,1.01,0.939,0.94,0.934,1.014,0.666,0.984,0.949,0.771,0.918,1.098];/*END*/
function fname(pi){return 'audio/m'+(pi<9?'0':'')+(pi+1)+'.ogg';}
function disposeEl(a){try{a.pause();a.removeAttribute('src');a.load();}catch(e){}}
function FileTrack(pi,fadeIn){
  var self=this;this.pi=pi;this.P=P[pi];this.isFile=true;this.f=0;this.ft=1;this.fr=1/Math.max(0.05,fadeIn);
  this.inst=[];this.last=Date.now();this.born=Date.now();this.denied=0;this.dead=false;LIVE.push(this);this.spawn(1,1,0,'play');
  this.timer=setInterval(function(){self.tick();},40);
}
FileTrack.prototype.spawn=function(x,xt,xr,st){
  var self=this,a=new Audio(),it={el:a,x:x,xt:xt,xr:xr,st:st,rt:0,t0:Date.now(),nx:null,ct:-1,cts:Date.now(),stall:0};
  a.preload='auto';a.loop=false;a.volume=0;
  a.addEventListener('error',function(){self.fail();});
  a.src=fname(this.pi);this.inst.push(it);
  if(st==='play'&&!S.paused)this.playEl(a);
  return it;
};
FileTrack.prototype.playEl=function(a){
  var self=this;
  try{var pr=a.play();if(pr&&pr.catch)pr.catch(function(e){
    if(!e)return;
    if(e.name==='NotSupportedError')self.fail();
    else if(e.name==='NotAllowedError'&&S.lastGesture>=self.born&&!isHidden()&&++self.denied>=4)self.fail();
  });}catch(e){}
};
FileTrack.prototype.retry=function(){var self=this;this.inst.forEach(function(it){if(it.st!=='pre'&&it.el.paused&&!it.el.ended){it.cts=Date.now();self.playEl(it.el);}});};
FileTrack.prototype.fail=function(){
  if(this.dead)return;
  var first=!fileBroken;fileBroken=true;
  var wasCur=S.cur===this,pi=this.pi;this.kill();
  if(first)SG.log.err('audio',new Error('müzik dosyası açılamadı, sentez kullanılıyor'));
  if(wasCur&&S.ctx&&S.unlocked&&S.wantCtx&&!S.paused)S.cur=new Track(pi,3);
};
FileTrack.prototype.kill=function(){
  this.dead=true;clearInterval(this.timer);
  this.inst.forEach(function(it){disposeEl(it.el);});this.inst=[];
  var i=LIVE.indexOf(this);if(i>=0)LIVE.splice(i,1);
};
FileTrack.prototype.pauseEls=function(){this.inst.forEach(function(it){if(it.st!=='pre'){try{it.el.pause();}catch(e){}}});};
FileTrack.prototype.resumeEls=function(){var self=this;this.inst.forEach(function(it){it.cts=Date.now();it.stall=0;if(it.st!=='pre'&&!it.el.ended)self.playEl(it.el);});};
FileTrack.prototype.tick=function(){
  this.last=Date.now();if(S.paused||this.dead)return;
  var dt=0.04,i,it,a,d=this.ft-this.f,st,e;
  if(d!==0){st=this.fr*dt;this.f=Math.abs(d)<=st?this.ft:this.f+(d>0?st:-st);}
  var mv=S.master?S.master.gain.value:S.vol.master,dk=S.duck?S.duck.gain.value:1;
  var base=Math.min(1,(FG[this.pi]||1)*S.vol.music*mv*dk)*this.f,now=Date.now();
  for(i=this.inst.length-1;i>=0;i--){
    it=this.inst[i];a=it.el;
    e=it.xt-it.x;if(e!==0){st=it.xr*dt;it.x=Math.abs(e)<=st?it.xt:it.x+(e>0?st:-st);}
    if(it.st==='out'&&it.x<=0){disposeEl(a);this.inst.splice(i,1);continue;}
    if(it.st!=='pre'){
      a.volume=Math.max(0,Math.min(1,base*it.x));
      if(a.paused&&!a.ended&&now-it.t0>400&&now-it.rt>1000){it.rt=now;this.playEl(a);}
      if(it.st==='play'&&!isHidden()){
        var ct=a.currentTime;
        if(ct!==it.ct){it.ct=ct;it.cts=now;it.stall=0;}
        else if(!a.ended&&now-it.cts>3500){it.cts=now;it.stall++;this.playEl(a);if(it.stall>=3){this.fail();return;}}
      }
    }
  }
  var cur=null;for(i=this.inst.length-1;i>=0;i--)if(this.inst[i].st==='play'){cur=this.inst[i];break;}
  if(!cur)return;
  a=cur.el;
  if(isFinite(a.duration)&&a.duration>XF+2){
    var rem=a.duration-a.currentTime;
    if(!cur.nx&&rem<9)cur.nx=this.spawn(0,0,0,'pre');
    if(cur.nx&&cur.nx.st==='pre'&&rem<=XF){
      var n=cur.nx;n.st='play';n.xt=1;n.xr=1/XF;cur.st='out';cur.xt=0;cur.xr=1/XF;
      try{n.el.currentTime=0;}catch(e2){}this.playEl(n.el);
    }
  }
  if(a.ended&&cur.st==='play'){cur.st='out';cur.xt=0;cur.xr=1/0.3;if(cur.nx&&cur.nx.st==='pre'){cur.nx.st='play';cur.nx.xt=1;cur.nx.xr=1/0.3;this.playEl(cur.nx.el);}else this.spawn(0,1,1/0.3,'play');}
};
FileTrack.prototype.fadeOut=function(sec,done){
  var self=this;this.ft=0;this.fr=1/Math.max(0.05,sec);
  setTimeout(function(){self.kill();if(done)done();},(sec+0.3)*1000);
};
function makeTrack(pi,fade){return(FILEMODE&&!fileBroken)?new FileTrack(pi,fade):new Track(pi,fade);}
function startTrack(first){
  if(!S.ctx||!S.unlocked||!S.wantCtx||S.paused)return;
  var pi=pickPreset(S.wantCtx,S.type,S.era);
  if(S.cur&&S.cur.pi===pi)return;
  var old=S.cur;S.cur=makeTrack(pi,first||!old?3:6);
  if(old)old.fadeOut(6);
}
A.music.start=function(ctxName){
  S.wantCtx=ctxName||'hub';
  if(S.cur&&S.cur.P.type===undefined&&pickPreset(S.wantCtx,S.type,S.era)===S.cur.pi)return;
  if(S.unlocked)startTrack(false);
};
A.music.stop=function(fade){
  S.wantCtx=null;var old=S.cur;S.cur=null;if(old&&S.ctx)old.fadeOut(fade==null?2:fade);
};
A.music.setEra=function(n){S.era=SG.clamp(n|0,0,8);if(S.wantCtx==='world'&&S.unlocked)startTrack(false);};
A.music.setType=function(tp){S.type=tp||null;if((S.wantCtx==='world'||S.wantCtx)&&S.unlocked)startTrack(false);};
A.music.current=function(){return S.cur?{id:S.cur.P.id,name:S.cur.P.name}:null;};
A.state=function(){return{unlocked:S.unlocked,ctx:S.ctx?S.ctx.state:'none',muted:S.muted,vol:{master:S.vol.master,music:S.vol.music,fx:S.vol.fx},
  music:{ctx:S.wantCtx,type:S.type,era:S.era,preset:S.cur?S.cur.P.id:null,playing:!!S.cur,src:S.cur?(S.cur.isFile?'file':'synth'):null,paused:!!S.paused},played:S.played,skipped:S.skipped};};
/* 2 sn izleme */
setInterval(function(){
  var c=S.ctx;if(!c||!S.unlocked||S.paused)return;
  if(c.state!=='running'&&Date.now()-S.lastGesture<600000){try{c.resume();}catch(e){}return;}
  if(S.wantCtx&&c.state==='running'){
    if(!S.cur)startTrack(true);
    else if(Date.now()-S.cur.last>3500){var pi=S.cur.pi,o=S.cur;S.cur=null;try{o.fadeOut(1);}catch(e){}S.cur=makeTrack(pi,2);}
  }
},2000);
/* ---------- çevrimdışı test yardımcıları ---------- */
A._offlineSound=function(id,o){
  o=o||{};var sr=22050,len=Math.floor(sr*4);
  var c=new OfflineAudioContext(2,len,sr),out=c.createGain();out.gain.value=o.nocal?1:(CAL[id]||1);out.connect(c.destination);
  var rv=createRev(c,out,o.norev?0:0.5),g=c.createGain();g.gain.value=1;g.connect(out);
  var v=c.createGain();v.connect(rv);
  var sr_=R_,sa=RATE;R_=SG.rng(o.seed||5);RATE=1;var dur=R[id](c,g,v,0.01,{});R_=sr_;RATE=sa;
  return c.startRendering().then(function(b){
    var L=b.getChannelData(0),Rr=b.getChannelData(1),pk=0,end=0,sum=0,i,x;
    for(i=0;i<L.length;i++){x=Math.max(Math.abs(L[i]),Math.abs(Rr[i]));if(x>pk)pk=x;if(x>0.002)end=i;sum+=L[i]*L[i];}
    var head=Math.max(Math.abs(L[0]),Math.abs(L[1])),tail=0;for(i=L.length-Math.floor(sr*0.02);i<L.length;i++)tail=Math.max(tail,Math.abs(L[i]));
    var first=0;for(i=0;i<L.length;i++){if(Math.abs(L[i])>0.002){first=i;break;}}
    return{id:id,peak:pk,declared:dur,audible:(end-first)/sr,rms:Math.sqrt(sum/L.length),head:head,tail:tail};
  });
};
/* kayıt aracı: bir parçayı mono, tam bar sayılı döngü + xf sn devam olarak çevrimdışı çizer */
A._renderLoop=function(pi,era,target,sr,xf){
  var Pr=P[pi],bar=barLenOf(Pr,era),nb=Math.max(4,4*Math.round(target/(4*bar))),L=nb*bar,total=L+xf;
  var c=new OfflineAudioContext(1,Math.floor(sr*total),sr),out=c.createGain();out.gain.value=1;out.connect(c.destination);
  var lvl=c.createGain();lvl.gain.value=MCAL[Pr.id]||1;lvl.connect(out);
  var rv=createRev(c,out,0.7),rng=SG.rng(SG.hash(Pr.id)+7),t=0.1,bi=0;
  while(t<total-0.01){t+=scheduleBar(c,lvl,rv,t,bi++,Pr,era,0,rng);}
  return c.startRendering().then(function(b){return{pcm:b.getChannelData(0),bars:nb,bar:bar,L:L,id:Pr.id};});
};
A._offlineTrack=function(pi,era,secs,type){
  var sr=22050,len=Math.floor(sr*secs),c=new OfflineAudioContext(2,len,sr),Pr=P[pi];
  var out=c.createGain();out.gain.value=1;out.connect(c.destination);
  var lvl=c.createGain();lvl.gain.value=1;lvl.connect(out);var rv=createRev(c,out,0.7),rng=SG.rng(99),t=0.05,bi=0,shift=Pr.type?0:(SHIFT[type]||0);
  while(t<secs-0.01){t+=scheduleBar(c,lvl,rv,t,bi++,Pr,era,shift,rng);}
  return c.startRendering().then(function(b){
    var L=b.getChannelData(0),pk=0,sum=0,cnt=0,i,from=Math.floor(sr*4);
    for(i=0;i<L.length;i++){var x=Math.abs(L[i]);if(x>pk)pk=x;if(i>=from){sum+=L[i]*L[i];cnt++;}}
    var head=Math.max(Math.abs(L[0]),Math.abs(L[1]));
    return{id:Pr.id,era:era,peak:pk,rms:Math.sqrt(sum/Math.max(1,cnt)),head:head,barSec:barLenOf(Pr,era)};
  });
};
})();
