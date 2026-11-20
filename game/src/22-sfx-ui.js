/* SpacEgg 2.2 — SG.Sfx: arayüz / tıklama sesleri "dijital uzay efektleri" (tamamen kod sentezi, dosya yok)
   Katmanlar: FM çan, sonar darbesi, bit-ezilmiş arpej, veri cıvıltısı, süzgeç süpürmeli gürültü, parıltı, alt-ses darbesi, stereo, kısa yankı.
   Çekirdek (Kit) BaseAudioContext + hedef düğüm alır -> OfflineAudioContext ile de çalışır (Sfx.synth).
   Canlı: Sfx.play(id,{v,pan,vol}); SG.A2.ui(kind) ve SG.A.play('ui_*') bu motora yönlendirilir (hata/uyuşmazlıkta eski sese düşer).
   Kalıcı "duraklat" bayrağı yok: her çağrıda SG.A.graph()/state() sorgulanır (v1.0.2 sessizlik dersi). */
(function(){
'use strict';
var SG=window.SG;if(!SG)return;
var Sfx=SG.Sfx={};
var PENT=[0,2,4,7,9];
function P(i){var oc=Math.floor(i/5),s=PENT[((i%5)+5)%5]+12*oc;return 261.63*Math.pow(2,s/12);}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
function logErr(w,e){try{SG.log&&SG.log.err&&SG.log.err(w,e);}catch(x){}}
function tierNow(){try{return SG.P&&SG.P.tier?SG.P.tier():1;}catch(e){return 1;}}
/*CAL*/var CAL={"tap":0.837,"tap-alt":1.197,"nav":1.414,"back":1.392,"open":1.933,"close":1.473,"sheet-open":1.483,"sheet-close":1.708,"drawer-open":1.697,"drawer-close":1.521,"drawer-drag":2.074,"toggle-on":1.097,"toggle-off":1.191,"slider-tick":1.512,"select":1.033,"confirm":1.055,"cancel":1.708,"error":0.955,"warning":1.294,"unlock":1.023,"badge":1.43,"toast-info":1.974,"toast-event":1.585,"toast-discovery":1.082,"speed-pause":0.785,"speed-1":1.33,"speed-10":1.598,"speed-100":1.239,"speed-1000":1.236,"photo-shutter":1.277,"copy":1.675,"export-done":1.463,"import-ok":1.457,"save-ok":1.603,"tutorial-next":1.596,"login-ok":1.439,"login-error":0.965,"egg-crack":1.09,"focus":2.322,"reward":1.367,"delete":0.848,"expand":1.707,"collapse":1.828,"scan":1.661};/*END*/

/* ---------- ortak kaynaklar (bağlam başına) ---------- */
var CC=typeof WeakMap!=='undefined'?new WeakMap():null;
function cache(c){var k=CC.get(c);if(!k){k={};CC.set(c,k);}return k;}
function noiseBuf(c,pink){
  var k=cache(c),n=pink?'p':'w';if(k[n])return k[n];
  var len=Math.floor(c.sampleRate*1.5),b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0),a=1234567,l=0;
  for(var i=0;i<len;i++){a=(Math.imul(a,1664525)+1013904223)|0;var w=((a>>>8)/8388608)-1;if(pink){l=l*0.93+w*0.07;d[i]=l*3.4;}else d[i]=w;}
  k[n]=b;return b;
}
function reverbFor(c,out){
  var k=cache(c);if(k.rev&&k.rev.out===out)return k.rev;
  var sr=c.sampleRate,len=Math.floor(sr*0.55),ir=c.createBuffer(2,len,sr),a=777;
  for(var ch=0;ch<2;ch++){var d=ir.getChannelData(ch),y=0;
    for(var i=0;i<len;i++){a=(Math.imul(a,1664525)+1013904223)|0;var w=((a>>>8)/8388608)-1,t=i/sr;y+=0.55*(w*Math.exp(-t*7.5)-y);d[i]=y*1.6;}
    // dijital erken yansımalar
    var e1=Math.floor(sr*(0.011+ch*0.004)),e2=Math.floor(sr*(0.023+ch*0.006));d[e1]+=0.5;d[e2]-=0.3;}
  var cv=c.createConvolver();cv.buffer=ir;var inp=c.createGain(),w=c.createGain();w.gain.value=0.42;
  inp.connect(cv);cv.connect(w);w.connect(out);
  k.rev={out:out,inp:inp};return k.rev;
}
function shaperCurve(bits){
  var n=512,cu=new Float32Array(n),lv=Math.pow(2,bits-1);
  for(var i=0;i<n;i++){var x=i/(n-1)*2-1;cu[i]=Math.round(x*lv)/lv;}
  return cu;
}
function env(p,t,att,dur,v){
  att=Math.min(att,dur*0.4);
  p.setValueAtTime(0,t);p.linearRampToValueAtTime(v,t+att);
  p.exponentialRampToValueAtTime(Math.max(0.0001,v*0.002),t+dur);p.linearRampToValueAtTime(0,t+dur+0.012);
}

/* ---------- sentez takımı ---------- */
function Kit(c,out,o){
  o=o||{};
  var K={c:c,out:out,t0:o.t0==null?c.currentTime+0.01:o.t0,tier:o.tier==null?1:o.tier,rv:o.rv||null,o:o.opts||{}};
  var r=o.rnd||Math.random;K.r=r;
  K.k=1+(r()*2-1)*0.045;                 // her çalışta ±%4,5 perde
  K.tj=1+(r()*2-1)*0.05;                 // ±%5 zamanlama
  var crushers={};
  K.hi=K.tier>=1;K.max=K.tier>=2;
  K.f=function(f){return f*K.k;};
  K.T=function(at){return K.t0+(at||0)*K.tj;};
  function crushBus(bits){
    if(crushers[bits])return crushers[bits];
    var pre=c.createGain(),sh=c.createWaveShaper(),post=c.createGain();
    pre.gain.value=4;post.gain.value=0.25;sh.curve=shaperCurve(bits);
    pre.connect(sh);sh.connect(post);post.connect(out);crushers[bits]=pre;return pre;
  }
  /* düğümü çıkışa bağla: pan, yankı gönderimi, bit ezme */
  function route(n,p){
    var e=n;
    if(p.pan&&c.createStereoPanner){var sp=c.createStereoPanner();sp.pan.value=clamp(p.pan,-1,1);n.connect(sp);e=sp;}
    if(p.crush&&K.hi)e.connect(crushBus(p.crush));else e.connect(out);
    if(p.send&&K.rv&&K.hi){var s=c.createGain();s.gain.value=p.send;e.connect(s);s.connect(K.rv);}
  }
  K.osc=function(p){
    var t=K.T(p.at),dur=p.dur,os=c.createOscillator();os.type=p.type||'sine';
    var f=K.f(p.f);os.frequency.setValueAtTime(f,t);
    if(p.f2)os.frequency.exponentialRampToValueAtTime(Math.max(20,K.f(p.f2)),t+(p.glide||dur));
    if(p.det)os.detune.value=p.det;
    var g=c.createGain();env(g.gain,t,p.att==null?0.004:p.att,dur,p.vol==null?0.2:p.vol);
    var n=os;
    if(p.lp){var fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=p.lp;fl.Q.value=p.q||0.7;os.connect(fl);n=fl;}
    n.connect(g);route(g,p);os.start(t);os.stop(t+dur+0.04);return os;
  };
  /* FM çan / ping */
  K.fm=function(p){
    var t=K.T(p.at),dur=p.dur,f=K.f(p.f);
    var ca=c.createOscillator(),mo=c.createOscillator(),mg=c.createGain();
    ca.type='sine';mo.type='sine';ca.frequency.value=f;mo.frequency.value=f*(p.ratio||2.01);
    var i1=f*(p.idx==null?3:p.idx),i2=f*(p.idx2==null?0.05:p.idx2);
    mg.gain.setValueAtTime(i1,t);mg.gain.exponentialRampToValueAtTime(Math.max(0.01,i2),t+dur*0.8);
    mo.connect(mg);mg.connect(ca.frequency);
    var g=c.createGain();env(g.gain,t,p.att==null?0.003:p.att,dur,p.vol==null?0.2:p.vol);
    ca.connect(g);route(g,p);
    ca.start(t);mo.start(t);ca.stop(t+dur+0.04);mo.stop(t+dur+0.04);
  };
  K.noise=function(p){
    var t=K.T(p.at),dur=p.dur;
    var s=c.createBufferSource();s.buffer=noiseBuf(c,p.pink);
    var fl=c.createBiquadFilter();fl.type=p.type||'bandpass';fl.frequency.setValueAtTime(K.f(p.f||2000),t);
    if(p.f2)fl.frequency.exponentialRampToValueAtTime(Math.max(40,K.f(p.f2)),t+dur);
    fl.Q.value=p.q||1.2;
    var g=c.createGain();env(g.gain,t,p.att==null?0.006:p.att,dur,p.vol==null?0.15:p.vol);
    s.connect(fl);fl.connect(g);route(g,p);
    s.start(t,(K.r()*0.5));s.stop(t+dur+0.04);
  };
  /* alt-ses darbesi */
  K.sub=function(p){K.osc({at:p.at,f:p.f||110,f2:p.f2||48,glide:p.glide,dur:p.dur||0.2,vol:p.vol==null?0.28:p.vol,att:0.006,type:'sine'});};
  /* parıltı: ince inharmonik osilatörler */
  K.shimmer=function(p){
    var n=K.max?4:K.hi?3:1,R_=[1,2.003,3.011,5.02];
    for(var i=0;i<n;i++)K.osc({at:(p.at||0)+i*0.012,f:p.f*R_[i],dur:p.dur*(1-i*0.14),vol:(p.vol||0.05)/(1+i*0.7),att:0.01,pan:p.pan==null?(i%2?0.4:-0.4):p.pan,send:p.send==null?0.5:p.send,det:i*3});
  };
  /* bit-ezilmiş arpej: notes = frekans dizisi */
  K.arp=function(p){
    var n=p.notes,st=p.step||0.05;
    for(var i=0;i<n.length;i++)K.osc({at:(p.at||0)+i*st,f:n[i],dur:p.dur||st*1.8,vol:(p.vol||0.12)*(p.fade?Math.pow(p.fade,i):1),type:p.type||'square',lp:p.lp||3600,crush:p.crush==null?5:p.crush,pan:p.pan,send:p.send==null?0.25:p.send,att:0.002});
  };
  /* veri cıvıltısı: rastgele ızgaraya oturan kısa kare dalga darbeleri */
  K.chatter=function(p){
    var n=K.hi?p.n:Math.ceil(p.n/2),rr=K.r;
    for(var i=0;i<n;i++){
      var f=P(Math.floor(p.lo+rr()*(p.hi-p.lo)));
      K.osc({at:(p.at||0)+i*(p.span/n)+rr()*0.006,f:f,dur:0.022+rr()*0.02,vol:p.vol||0.06,type:'square',lp:5000,crush:4,pan:(rr()*2-1)*0.6,send:0.15,att:0.001});
    }
  };
  /* sonar / radar darbesi: ping + azalan yankılar */
  K.sonar=function(p){
    var n=K.hi?(p.echoes||2):0,gap=p.gap||0.11;
    for(var i=0;i<=n;i++)K.fm({at:(p.at||0)+i*gap,f:p.f*(1-i*0.01),ratio:p.ratio||1.5,idx:p.idx||2,dur:p.dur*(1-i*0.12),vol:p.vol*Math.pow(0.5,i),pan:p.pan==null?(i%2?0.5:-0.3):p.pan,send:0.4});
  };
  return K;
}

/* ---------- ses tanımları: fn(K,o) -> süre (sn). o.v 0..1, o.pan, o.n (zincir) ---------- */
var D={},INFO={};
function def(id,title,desc,fn){D[id]=fn;INFO[id]={id:id,ad:title,aciklama:desc};}
function pn(o){return o.pan||0;}

def('tap','Dokunuş','Genel tıklama: FM ping + dijital tık',function(K,o){
  K.fm({f:P(10),ratio:2.01,idx:2.6,dur:0.22,vol:0.2,pan:pn(o),send:0.3});
  K.osc({f:1900,f2:800,dur:0.035,vol:0.07,type:'square',lp:4200,crush:5});
  K.noise({f:6500,q:2,dur:0.018,vol:0.05,type:'bandpass'});
  K.shimmer({f:P(14),dur:0.2,vol:0.03});
  return 0.24;});
var chain={n:0,at:0};
def('tap-alt','Dokunuş (zincir)','Arka arkaya basınca perdesi yükselen dijital damla',function(K,o){
  var n=o.n!=null?o.n:0,f=P(5+n*1);
  K.fm({f:f,ratio:3,idx:2.4,dur:0.2,vol:0.19,pan:pn(o),send:0.25});
  K.osc({f:f*2,dur:0.05,vol:0.06,type:'square',lp:4000,crush:4,at:0.03});
  K.noise({f:5000,q:2,dur:0.015,vol:0.04});
  return 0.2;});
def('nav','Sekme geçişi','Yan yana sayfa: veri kayması + kısa çan',function(K,o){
  K.osc({f:600,f2:1500,dur:0.09,vol:0.1,type:'triangle',lp:3500,pan:pn(o)*0.6-0.2});
  K.fm({at:0.05,f:P(9),ratio:2.5,idx:2,dur:0.2,vol:0.17,pan:pn(o)*0.6+0.2,send:0.35});
  K.chatter({at:0.02,n:3,span:0.08,lo:10,hi:16,vol:0.04});
  return 0.28;});
def('back','Geri','Aşağı süpürme + alçak çan',function(K,o){
  K.osc({f:1300,f2:480,dur:0.12,vol:0.12,type:'triangle',lp:3200});
  K.fm({at:0.04,f:P(5),ratio:1.5,idx:2,dur:0.2,vol:0.16,send:0.3});
  K.noise({f:3600,f2:600,q:1.5,dur:0.12,vol:0.06});
  return 0.28;});
def('open','Aç','Yükselen süpürme + 3 nota bit-ezilmiş arpej',function(K,o){
  K.osc({f:300,f2:1600,dur:0.2,vol:0.1,type:'sine',send:0.3});
  K.arp({at:0.06,notes:[P(5),P(7),P(10)],step:0.055,vol:0.1,pan:-0.2});
  K.noise({f:500,f2:4200,q:1.4,dur:0.22,vol:0.07,att:0.05});
  K.shimmer({at:0.1,f:P(12),dur:0.3,vol:0.04});
  return 0.42;});
def('close','Kapat','Alçalan süpürme + 3 nota ters arpej',function(K,o){
  K.osc({f:1500,f2:260,dur:0.2,vol:0.1,type:'sine',send:0.3});
  K.arp({at:0.02,notes:[P(10),P(7),P(5)],step:0.055,vol:0.1,pan:0.2});
  K.noise({f:4200,f2:400,q:1.4,dur:0.2,vol:0.06});
  return 0.38;});
def('sheet-open','Panel aç','Alttan yükselen hava akışı + yumuşak ping',function(K,o){
  K.noise({f:350,f2:2600,q:0.9,dur:0.3,vol:0.09,att:0.08,pink:1});
  K.sub({f:70,f2:120,dur:0.25,vol:0.12});
  K.fm({at:0.12,f:P(8),ratio:2,idx:1.6,dur:0.3,vol:0.15,send:0.4});
  K.fm({at:0.2,f:P(12),ratio:2,idx:1.6,dur:0.3,vol:0.1,send:0.4,pan:0.3});
  return 0.5;});
def('sheet-close','Panel kapat','Aşağı süzülen hava + alçak tık',function(K,o){
  K.noise({f:2400,f2:300,q:0.9,dur:0.25,vol:0.08,pink:1});
  K.fm({f:P(12),ratio:2,idx:1.4,dur:0.22,vol:0.12,send:0.3});
  K.sub({at:0.18,f:90,f2:50,dur:0.14,vol:0.14});
  return 0.4;});
def('drawer-open','Çekmece aç','Geniş süpürme, yükselen parıltı akoru ve alt-ses',function(K,o){
  K.noise({f:200,f2:3400,q:0.8,dur:0.4,vol:0.1,att:0.12,pink:1,pan:-0.3});
  K.sub({f:80,f2:150,dur:0.35,vol:0.15});
  K.arp({at:0.08,notes:[P(2),P(5),P(7),P(10),P(12)],step:0.05,vol:0.08,pan:-0.4});
  K.shimmer({at:0.2,f:P(10),dur:0.4,vol:0.05});
  K.fm({at:0.3,f:P(14),ratio:2.76,idx:1.8,dur:0.3,vol:0.1,send:0.5});
  return 0.62;});
def('drawer-close','Çekmece kapat','Ters süpürme, inen akor ve yumuşak kapanış',function(K,o){
  K.noise({f:3400,f2:180,q:0.8,dur:0.35,vol:0.09,pink:1,pan:-0.2});
  K.arp({notes:[P(12),P(10),P(7),P(5),P(2)],step:0.045,vol:0.07,pan:-0.3});
  K.sub({at:0.28,f:100,f2:44,dur:0.2,vol:0.16});
  K.shimmer({at:0.1,f:P(7),dur:0.3,vol:0.03});
  return 0.55;});
def('drawer-drag','Çekmece sürükle','Sürüklerken hafif dijital tık (perde ilerlemeye bağlı)',function(K,o){
  var v=o.v==null?0.5:o.v,f=900+v*1500;
  K.osc({f:f,f2:f*0.7,dur:0.03,vol:0.07,type:'square',lp:4000,crush:5});
  K.noise({f:3000+v*3000,q:2.5,dur:0.02,vol:0.04});
  K.osc({f:f*1.5,dur:0.2,vol:0.1,type:'sine',pan:-0.3,att:0.01});
  return 0.2;});
def('toggle-on','Anahtar açık','Yükselen çift blip',function(K,o){
  K.arp({notes:[P(7),P(10)],step:0.045,vol:0.14,type:'square',crush:5});
  K.fm({at:0.05,f:P(12),ratio:2,idx:1.8,dur:0.13,vol:0.13,send:0.3});
  K.noise({f:5500,q:2,dur:0.012,vol:0.04});
  return 0.2;});
def('toggle-off','Anahtar kapalı','Alçalan çift blip',function(K,o){
  K.arp({notes:[P(10),P(5)],step:0.045,vol:0.13,type:'square',crush:5});
  K.fm({at:0.05,f:P(5),ratio:2,idx:1.6,dur:0.13,vol:0.11,send:0.25});
  return 0.19;});
def('slider-tick','Kaydırıcı tık','Değere bağlı perdede kısa damla',function(K,o){
  var v=o.v==null?0.5:o.v,d=Math.round(v*9),f=P(3+d);
  K.fm({f:f,ratio:2.01,idx:1.8,dur:0.24,vol:0.15,pan:pn(o),send:0.2});
  K.noise({f:6000,q:3,dur:0.01,vol:0.03});
  return 0.14;});
def('select','Seçim','Sonar darbesi + veri cıvıltısı',function(K,o){
  K.sonar({f:P(10),dur:0.26,vol:0.17,echoes:2,gap:0.1,pan:pn(o)});
  K.chatter({n:4,span:0.08,lo:12,hi:18,vol:0.04});
  K.osc({f:420,f2:900,dur:0.08,vol:0.06,type:'triangle',lp:2800});
  return 0.5;});
def('confirm','Onay','Yükselen 3 nota + parıltılı çan',function(K,o){
  K.arp({notes:[P(5),P(8),P(10)],step:0.06,vol:0.11,type:'triangle',crush:6,dur:0.12});
  K.fm({at:0.15,f:P(12),ratio:2.76,idx:2.4,dur:0.34,vol:0.2,send:0.5});
  K.shimmer({at:0.17,f:P(14),dur:0.3,vol:0.04});
  K.noise({f:7000,q:2,dur:0.015,vol:0.04,at:0.15});
  return 0.5;});
def('cancel','İptal','Alçalan yumuşak iki nota',function(K,o){
  K.osc({f:P(7),f2:P(5),dur:0.14,vol:0.14,type:'triangle',lp:2400,send:0.2});
  K.osc({at:0.09,f:P(5),f2:P(2),dur:0.17,vol:0.13,type:'triangle',lp:2000,send:0.2});
  K.noise({f:2800,f2:500,q:1.4,dur:0.12,vol:0.04});
  return 0.3;});
def('error','Hata','Uyumsuz çift testere + bit-ezilmiş buzzer',function(K,o){
  for(var i=0;i<2;i++){
    K.osc({at:i*0.13,f:220,f2:170,dur:0.12,vol:0.13,type:'sawtooth',lp:1100,crush:4});
    K.osc({at:i*0.13,f:233*1.06,f2:176,dur:0.12,vol:0.1,type:'square',lp:900,crush:4,det:12});
  }
  K.sub({f:90,f2:55,dur:0.2,vol:0.16});
  K.noise({f:900,f2:200,q:1,dur:0.18,vol:0.05,at:0.1});
  return 0.36;});
def('warning','Uyarı','Üç darbeli radar alarmı',function(K,o){
  for(var i=0;i<3;i++)K.fm({at:i*0.13,f:i%2?660:880,ratio:1,idx:3,dur:0.11,vol:0.14,pan:i%2?0.3:-0.3,send:0.3});
  K.arp({at:0.02,notes:[440,440,440],step:0.13,vol:0.06,type:'square',crush:4});
  K.sub({f:100,f2:80,dur:0.3,vol:0.1});
  return 0.5;});
def('unlock','Kilit açıldı','Yükselen arpej, parıltı örtüsü, süpürme ve alt-ses',function(K,o){
  K.noise({f:300,f2:7000,q:1,dur:0.35,vol:0.08,att:0.18});
  K.sub({f:60,f2:130,dur:0.35,vol:0.14});
  K.arp({at:0.05,notes:[P(5),P(7),P(9),P(10),P(12),P(14)],step:0.06,vol:0.1,type:'triangle',crush:7,dur:0.2,send:0.4});
  K.fm({at:0.38,f:P(17),ratio:2.76,idx:2.8,dur:0.38,vol:0.18,send:0.6});
  K.shimmer({at:0.3,f:P(14),dur:0.4,vol:0.06});
  return 0.7;});
def('badge','Rozet','Çan basamağı ve yüksek kıvılcım',function(K,o){
  var n=[P(12),P(14),P(17)];
  for(var i=0;i<3;i++)K.fm({at:i*0.1,f:n[i],ratio:2.76,idx:2.2,dur:0.4,vol:0.14,pan:(i-1)*0.4,send:0.5});
  K.chatter({at:0.25,n:6,span:0.22,lo:15,hi:22,vol:0.045});
  K.shimmer({at:0.2,f:P(19),dur:0.35,vol:0.03});
  return 0.66;});
def('toast-info','Bildirim','Gelen iletim: veri cıvıltısı + ping',function(K,o){
  K.chatter({n:4,span:0.09,lo:10,hi:16,vol:0.05});
  K.fm({at:0.1,f:P(11),ratio:3,idx:1.8,dur:0.22,vol:0.15,send:0.4,pan:0.2});
  return 0.34;});
def('toast-event','Olay bildirimi','Radar süpürmesi + alçak sonar',function(K,o){
  K.noise({f:400,f2:3000,q:2,dur:0.22,vol:0.06,att:0.06,pan:-0.4});
  K.sonar({at:0.08,f:P(6),dur:0.3,vol:0.16,echoes:2,gap:0.12,ratio:1.5});
  K.osc({at:0.02,f:140,f2:70,dur:0.2,vol:0.1,type:'sine'});
  return 0.5;});
def('toast-discovery','Keşif bildirimi','Işıltılı yükselen parıltı ve kıvılcım',function(K,o){
  K.shimmer({f:P(10),dur:0.5,vol:0.07});
  K.arp({notes:[P(10),P(12),P(14),P(17)],step:0.08,vol:0.09,type:'sine',crush:8,dur:0.25,send:0.5});
  K.chatter({at:0.2,n:6,span:0.3,lo:16,hi:23,vol:0.04});
  K.sub({f:55,f2:90,dur:0.45,vol:0.1});
  K.fm({at:0.3,f:P(19),ratio:2.76,idx:2.2,dur:0.4,vol:0.12,send:0.6});
  return 0.7;});
def('speed-pause','Hız: duraklat','Güç kapanma: alçalan süpürme ve düşük vuruş',function(K,o){
  K.osc({f:900,f2:140,dur:0.26,vol:0.13,type:'sine',send:0.3});
  K.sub({f:120,f2:40,dur:0.26,vol:0.18});
  K.noise({f:2400,f2:200,q:1.3,dur:0.2,vol:0.05});
  K.fm({at:0.05,f:P(3),ratio:1.5,idx:1.5,dur:0.2,vol:0.1});
  return 0.34;});
def('speed-1','Hız ×1','Tek net düşük ping',function(K,o){
  K.fm({f:P(5),ratio:2,idx:2,dur:0.2,vol:0.18,send:0.35});
  K.osc({f:P(10),dur:0.08,vol:0.05,type:'square',lp:3000,crush:5,at:0.03});
  return 0.24;});
function spdSnd(id,ttl,notes,step,swp,sub){
  def(id,ttl,'Hız basamağı: yükselen karakter',function(K,o){
    K.arp({notes:notes,step:step,vol:0.11,type:'square',crush:5,dur:step*1.7,pan:-0.2});
    K.osc({f:swp[0],f2:swp[1],dur:step*notes.length+0.08,vol:0.07,type:'sawtooth',lp:swp[1]*0.8,send:0.3});
    K.noise({f:600,f2:swp[1]*2,q:1.5,dur:step*notes.length+0.05,vol:0.04});
    if(sub)K.sub({f:60,f2:sub,dur:0.2,vol:0.12});
    K.fm({at:step*notes.length,f:notes[notes.length-1]*2,ratio:2.01,idx:1.6,dur:0.18,vol:0.1,send:0.4});
    return step*notes.length+0.25;});
}
spdSnd('speed-10','Hız ×10',[P(5),P(8)],0.055,[300,900],0);
spdSnd('speed-100','Hız ×100',[P(5),P(8),P(10),P(12)],0.045,[350,1700],90);
spdSnd('speed-1000','Hız ×1000 (warp)',[P(5),P(7),P(10),P(12),P(14),P(15),P(17),P(19)],0.032,[200,3200],120);
def('photo-shutter','Fotoğraf','Çift tıklamalı deklanşör, servo ve dijital bip',function(K,o){
  K.noise({f:4200,q:1.5,dur:0.012,vol:0.12});
  K.noise({at:0.045,f:3000,q:1.5,dur:0.03,vol:0.1});
  K.osc({at:0.01,f:2200,f2:600,dur:0.07,vol:0.06,type:'square',lp:4500,crush:5});
  K.sub({at:0.01,f:140,f2:70,dur:0.1,vol:0.14});
  K.fm({at:0.11,f:P(17),ratio:2,idx:1.2,dur:0.15,vol:0.1,send:0.4});
  return 0.28;});
def('copy','Kopyala','Hızlı çift blip + sonar yankısı',function(K,o){
  K.arp({notes:[P(9),P(12)],step:0.04,vol:0.12,type:'square',crush:5});
  K.fm({at:0.08,f:P(14),ratio:3,idx:1.4,dur:0.14,vol:0.1,send:0.4});
  return 0.22;});
def('export-done','Dışa aktarma bitti','Dışarı doğru süpürme, veri akışı ve onay',function(K,o){
  K.noise({f:2800,f2:400,q:1.2,dur:0.2,vol:0.06,pink:1,pan:0.4});
  K.chatter({n:6,span:0.2,lo:8,hi:16,vol:0.045});
  K.arp({at:0.22,notes:[P(7),P(10),P(12)],step:0.07,vol:0.1,type:'triangle',crush:7,dur:0.2});
  K.fm({at:0.42,f:P(14),ratio:2.76,idx:2.2,dur:0.3,vol:0.15,send:0.5});
  return 0.7;});
def('import-ok','İçe aktarma tamam','İçeri akan veri + onay',function(K,o){
  K.noise({f:400,f2:2800,q:1.2,dur:0.2,vol:0.06,pink:1,pan:-0.4});
  K.chatter({n:6,span:0.2,lo:16,hi:8,vol:0.045});
  K.arp({at:0.2,notes:[P(5),P(8),P(10)],step:0.07,vol:0.1,type:'triangle',crush:7,dur:0.2});
  K.fm({at:0.4,f:P(12),ratio:2.76,idx:2.2,dur:0.3,vol:0.15,send:0.5});
  return 0.68;});
def('save-ok','Kaydedildi','Kristal çift ping',function(K,o){
  K.fm({f:P(10),ratio:3.5,idx:1.8,dur:0.2,vol:0.14,pan:-0.3,send:0.4});
  K.fm({at:0.09,f:P(14),ratio:3.5,idx:1.8,dur:0.3,vol:0.14,pan:0.3,send:0.5});
  K.shimmer({at:0.1,f:P(17),dur:0.25,vol:0.03});
  K.osc({f:1500,dur:0.025,vol:0.04,type:'square',crush:5});
  return 0.42;});
def('tutorial-next','Rehber ileri','Yumuşak iki notalı çağrı',function(K,o){
  K.fm({f:P(7),ratio:2,idx:1.6,dur:0.18,vol:0.15,send:0.35});
  K.fm({at:0.1,f:P(9),ratio:2,idx:1.6,dur:0.24,vol:0.15,send:0.4,pan:0.2});
  K.shimmer({at:0.12,f:P(12),dur:0.2,vol:0.025});
  return 0.34;});
def('login-ok','Giriş başarılı','Sistem açılışı: alt-ses, akor parıltısı ve yükselen arpej',function(K,o){
  K.sub({f:50,f2:110,dur:0.4,vol:0.15});
  K.noise({f:200,f2:5000,q:1,dur:0.35,vol:0.07,att:0.15,pink:1});
  K.arp({at:0.12,notes:[P(0),P(4),P(7),P(10),P(14)],step:0.07,vol:0.1,type:'triangle',crush:7,dur:0.2,send:0.4});
  K.shimmer({at:0.3,f:P(10),dur:0.4,vol:0.06});
  K.fm({at:0.46,f:P(15),ratio:2.76,idx:2.4,dur:0.3,vol:0.15,send:0.6});
  return 0.76;});
def('login-error','Giriş reddedildi','Alçak çift bip ve inen tını',function(K,o){
  K.osc({f:300,dur:0.1,vol:0.14,type:'square',lp:1200,crush:4});
  K.osc({at:0.15,f:300,dur:0.1,vol:0.14,type:'square',lp:1200,crush:4});
  K.osc({at:0.3,f:260,f2:150,dur:0.2,vol:0.12,type:'sawtooth',lp:900,crush:5});
  K.sub({at:0.3,f:80,f2:45,dur:0.22,vol:0.14});
  return 0.52;});
def('egg-crack','Yumurta çatlağı','Çatırdayan dijital parçacıklar, düşük vuruş ve ışıltı',function(K,o){
  var rr=K.r;
  for(var i=0;i<6;i++)K.noise({at:rr()*0.35,f:2800+rr()*3500,q:3,dur:0.014+rr()*0.01,vol:0.12,pan:(rr()*2-1)*0.7});
  K.sub({f:150,f2:70,dur:0.25,vol:0.2});
  K.osc({f:420,f2:180,dur:0.18,vol:0.08,type:'square',lp:2200,crush:4,at:0.02});
  K.shimmer({at:0.2,f:P(14),dur:0.4,vol:0.05});
  K.chatter({at:0.25,n:5,span:0.25,lo:14,hi:22,vol:0.04});
  return 0.62;});
def('focus','Odak','Çok hafif yüksek ping',function(K,o){
  K.fm({f:P(15),ratio:2,idx:1,dur:0.24,vol:0.1,pan:pn(o),send:0.3});
  K.shimmer({f:P(17),dur:0.12,vol:0.015});
  return 0.14;});
def('reward','Ödül','Parlak iki nota ve kıvılcım',function(K,o){
  K.fm({f:P(10),ratio:2.01,idx:2,dur:0.12,vol:0.16,send:0.3});
  K.fm({at:0.07,f:P(12),ratio:2.01,idx:2,dur:0.3,vol:0.17,send:0.5});
  K.chatter({at:0.1,n:5,span:0.15,lo:17,hi:23,vol:0.04});
  return 0.42;});
def('delete','Sil','Parçalanma: ezilmiş gürültü ve inen darbe',function(K,o){
  K.noise({f:4500,f2:300,q:1,dur:0.2,vol:0.1,type:'bandpass'});
  K.osc({f:500,f2:90,dur:0.18,vol:0.1,type:'sawtooth',lp:1600,crush:4});
  K.sub({f:110,f2:42,dur:0.26,vol:0.16});
  K.chatter({n:5,span:0.18,lo:5,hi:12,vol:0.04});
  return 0.32;});
def('expand','Genişlet','Açılan ses: kısa yükselen çift ping',function(K,o){
  K.osc({f:500,f2:1100,dur:0.08,vol:0.09,type:'triangle',lp:3000});
  K.fm({at:0.05,f:P(10),ratio:2,idx:1.6,dur:0.18,vol:0.14,send:0.35});
  return 0.24;});
def('collapse','Daralt','Kapanan ses: kısa inen çift ping',function(K,o){
  K.osc({f:1100,f2:480,dur:0.08,vol:0.09,type:'triangle',lp:3000});
  K.fm({at:0.05,f:P(7),ratio:2,idx:1.6,dur:0.16,vol:0.13,send:0.3});
  return 0.22;});
def('scan','Tarama','Radar süpürmesi, tek darbe ve veri',function(K,o){
  K.noise({f:300,f2:5200,q:3,dur:0.32,vol:0.07,att:0.08,pan:-0.5});
  K.sonar({at:0.2,f:P(12),dur:0.3,vol:0.15,echoes:2,gap:0.1});
  K.chatter({at:0.1,n:5,span:0.18,lo:12,hi:20,vol:0.035});
  return 0.55;});

/* ---------- v1 / eski kimlikler ---------- */
var ALIAS={ui_tap:'tap',ui_menu:'open',ui_back:'back',ui_tab:'nav',ui_ok:'confirm',ui_err:'error',ui_toggle:'toggle-on',
  egg_crack:'egg-crack',badge:'badge',notify:'toast-info',
  press:'tap',click:'tap',tick:'slider-tick'};
Sfx.alias=ALIAS;
var PRIO={'unlock':1,'badge':1,'login-ok':1,'login-error':1,'error':1,'confirm':1,'egg-crack':1};
var LONGS={'unlock':1,'badge':1,'login-ok':1,'toast-discovery':1,'speed-1000':1,'drawer-open':1,'drawer-close':1,'export-done':1,'import-ok':1};

/* ---------- katalog ---------- */
Sfx.ids=function(){return Object.keys(D);};
Sfx.has=function(id){return !!(D[id]||D[ALIAS[id]]);};
Sfx.catalog=function(){return Object.keys(D).map(function(k){var i=INFO[k];return{id:k,ad:i.ad,aciklama:i.aciklama,v1:Object.keys(ALIAS).filter(function(a){return ALIAS[a]===k;})};});};

/* ---------- sentez (canlı ve çevrimdışı ortak): hedef 'out' düğümüne yazar, süre döner ---------- */
Sfx.synth=function(c,out,id,o){
  o=o||{};id=D[id]?id:ALIAS[id];var fn=D[id];if(!fn)return 0;
  var K=Kit(c,out,{tier:o.tier==null?tierNow():o.tier,rnd:o.rnd,t0:o.t0,opts:o,rv:o.rv===undefined?null:o.rv});
  var dur=fn(K,o)||0.3;
  return dur*K.tj+0.05;
};
Sfx._tier=tierNow;
Sfx._reverb=reverbFor;
Sfx._cal=function(){return CAL;};

/* ---------- canlı çalma ---------- */
var last={},active=[],lastWhy='';
Sfx.why=function(){return lastWhy;};
function gr(){try{return SG.A&&SG.A.graph?SG.A.graph():undefined;}catch(e){return undefined;}}
function ast(){try{return SG.A&&SG.A.state?SG.A.state():null;}catch(e){return null;}}
Sfx.play=function(id,o){
  o=o||{};
  try{
    var real=D[id]?id:ALIAS[id];
    if(!real){lastWhy='unknown';return false;}
    var G=gr();
    if(!G||!G.ctx){lastWhy='noctx';return false;}
    var st=ast();
    if(st&&(st.muted||(st.vol&&st.vol.fx<=0)||(st.music&&st.music.paused))){lastWhy='muted';return false;}
    var c=G.ctx;
    if(c.state!=='running'){lastWhy='suspended';return false;}
    var now=Date.now();
    if(last[real]&&now-last[real]<60){lastWhy='throttled';return false;}
    active=active.filter(function(x){return x>now;});
    if(active.length>=8&&!PRIO[real]){lastWhy='busy';return false;}
    if(real==='tap-alt'&&o.n==null){chain.n=(now-chain.at<650)?Math.min(chain.n+1,8):0;chain.at=now;o=Object.assign({},o,{n:chain.n});}
    last[real]=now;
    var target=G.fx||G.music;if(!target){lastWhy='noctx';return false;}
    var scale=(CAL[real]||1)*(o.vol==null?1:clamp(o.vol,0,2));
    var g=c.createGain();g.gain.value=scale;g.connect(target);
    var tr=tierNow(),rvIn=null;
    if(tr>=1){var rv=reverbFor(c,target);rvIn=c.createGain();rvIn.gain.value=scale;rvIn.connect(rv.inp);}
    var dur=Sfx.synth(c,g,real,{v:o.v,pan:o.pan,n:o.n,tier:tr,rv:rvIn,t0:c.currentTime+0.008});
    active.push(now+dur*1000);
    setTimeout(function(){try{g.disconnect();if(rvIn)rvIn.disconnect();}catch(e){}},(dur+1.6)*1000);
    lastWhy='ok';return true;
  }catch(e){logErr('sfx:play',e);lastWhy='fail';return false;}
};
/* sürükleme tıkı (çekmece): ilerleme 0..1, her ~%12'de bir tık */
var dragB=-1,dragAt=0;
Sfx.drag=function(p){
  try{
    p=clamp(p,0,1);var b=Math.floor(p*8);
    if(b===dragB)return false;dragB=b;
    var now=Date.now();if(now-dragAt<70)return false;dragAt=now;
    return Sfx.play('drawer-drag',{v:p});
  }catch(e){return false;}
};
Sfx.dragReset=function(){dragB=-1;};

/* ---------- entegrasyon: eski API'leri yeni motora yönlendir ---------- */
var FALL={noctx:1,suspended:1,fail:1};   // bu nedenlerde eski ses/yeniden-kilit mantığı çalışsın
function install(){
  try{
    var A=SG.A;
    if(A&&A.play&&!A.play._sfx){
      var orig=A.play;
      var w=function(id,opts){
        var real=ALIAS[id];
        if(real){
          var ok=Sfx.play(real,opts);
          if(ok)return true;
          if(!FALL[lastWhy])return false;
        }
        return orig.apply(A,arguments);
      };
      w._sfx=1;w._orig=orig;A.play=w;
    }
    var A2=SG.A2;
    if(A2&&A2.ui&&!A2.ui._sfx){
      var o2=A2.ui;
      var u=function(kind){
        try{
          var k=D[kind]?kind:(ALIAS[kind]||'tap');
          if(Sfx.play(k))return true;
          if(!FALL[lastWhy])return false;
        }catch(e){logErr('sfx:ui',e);}
        return o2.apply(A2,arguments);
      };
      u._sfx=1;u._orig=o2;A2.ui=u;
    }
    if(SG.bus&&SG.bus.on&&!install._bus){
      install._bus=1;
      SG.bus.on('drawer',function(d){Sfx.dragReset();Sfx.play(d&&d.open?'drawer-open':'drawer-close');});
    }
  }catch(e){logErr('sfx:install',e);}
}
Sfx.install=install;
install();
})();
