/* SpacEgg 2.0 — SG.P: performans ölçümü ve otomatik kalite kademesi (hafif; kare başına O(1)) */
(function(){
'use strict';
var SG=window.SG;if(!SG)return;
var N=240,ring=new Float32Array(N),ri=0,rn=0;   // son 240 kare süresi (ms)
var skip=0,lastTier=-1;
var longCount=0,longMax=0,longTotal=0;
var MODE='auto',cur=1,hintTier=1,evalDone=0;
var NAMES=['low','mid','high'];

function cl(v,a,b){return v<a?a:v>b?b:v;}
function parse(v){ // SG.store 'quality' ile uyumlu: auto|low|mid|high|ultra|0..3
  if(v==null||v==='auto')return 'auto';
  if(typeof v==='number')return cl(v|0,0,2);
  var m={low:0,mid:1,high:2,ultra:2};
  return m[v]!=null?m[v]:'auto';
}
function hints(){
  var t=2,why=[];
  try{
    var dm=navigator.deviceMemory;if(dm){if(dm<=2){t=Math.min(t,0);why.push('bellek<=2');}else if(dm<=4){t=Math.min(t,1);why.push('bellek<=4');}}
    var hc=navigator.hardwareConcurrency;if(hc){if(hc<=2){t=Math.min(t,0);why.push('cekirdek<=2');}else if(hc<=4){t=Math.min(t,1);why.push('cekirdek<=4');}}
    var dpr=window.devicePixelRatio||1,sw=(screen.width||innerWidth)*dpr,sh=(screen.height||innerHeight)*dpr,px=sw*sh;
    if(px>5.5e6){t=Math.min(t,1);why.push('piksel>5.5M');}
    if(!dm&&!hc)t=Math.min(t,1);
  }catch(e){}
  return {tier:cl(t,0,2),why:why};
}
function apply(n,reason){
  n=cl(n|0,0,2);
  if(n===cur&&lastTier!==-1)return;
  cur=n;lastTier=n;
  SG.P._reason=reason||'';
  try{SG.bus.emit('p:tier',n);}catch(e){}
}
function stats(){
  var n=rn,arr=new Array(n),sum=0,i;
  for(i=0;i<n;i++){arr[i]=ring[i];sum+=arr[i];}
  if(!n)return {fps:0,p95:0,avg:0,n:0};
  var avg=sum/n;arr.sort(function(a,b){return a-b;});
  return {fps:1000/avg,p95:arr[Math.min(n-1,Math.floor(n*0.95))],avg:avg,n:n};
}
/* değerlendirme penceresi: sabit süre boyunca toplanan ortalama kare süresi */
var win={on:false,t:0,sum:0,n:0,len:6,phase:0},clock=0;
function startWin(phase){win.on=true;win.t=0;win.sum=0;win.n=0;win.phase=phase;}
function endWin(){
  win.on=false;
  if(win.n<60)return;                                // yeterli kare yok (gizli/çok yavaş): karar verme
  var fps=1000/(win.sum/win.n);
  decide(fps,win.phase);
}
function decide(fps,phase){
  SG.P._lastEval={fps:Math.round(fps*10)/10,phase:phase,tier:cur};
  if(MODE!=='auto')return;
  if(fps<40&&cur>0)apply(cur-1,'fps '+Math.round(fps)+' <40');
  else if(phase===2&&fps>=57&&cur<hintTier)apply(cur+1,'fps '+Math.round(fps)+' yukselt');
  evalDone++;
}
function frame(dt){
  if(skip>0){skip--;return;}
  var ms=dt*1000;
  ring[ri]=ms;ri=(ri+1)%N;if(rn<N)rn++;
  clock+=dt;
  if(win.on){win.t+=dt;win.sum+=ms;win.n++;if(win.t>=win.len)endWin();}
  else if(MODE==='auto'){
    if(evalDone===0&&win.phase===0&&clock>=1)startWin(1);       // 1 sn ısınma, sonra 6 sn
    else if(win.phase===1&&clock>=60)startWin(2);               // 60 sn sonra yeniden değerlendir
  }
}
function reset(){ri=0;rn=0;skip=5;}
var P=SG.P={
  tier:function(){return cur;},
  name:function(){return NAMES[cur];},
  mode:function(){return MODE;},
  setTier:function(v){
    if(v==='auto'||v==null){MODE='auto';SG.store.set('quality','auto');win.phase=0;evalDone=0;clock=0;win.on=false;apply(hints().tier,'auto');hintTier=cur;return cur;}
    var n=parse(v);if(n==='auto'){return P.setTier('auto');}
    MODE='manual';SG.store.set('quality',NAMES[n]);win.on=false;apply(n,'elle');return cur;
  },
  fps:function(){var s=stats();return Math.round(s.fps*10)/10;},
  report:function(){
    var s=stats(),mem=null;
    try{if(performance.memory)mem=Math.round(performance.memory.usedJSHeapSize/1048576*10)/10;}catch(e){}
    return {fps:Math.round(s.fps*10)/10,p95ms:Math.round(s.p95*10)/10,tier:cur,mode:MODE,mem:mem,
      longTasks:{count:longCount,maxMs:Math.round(longMax),totalMs:Math.round(longTotal)},
      hints:hints(),reason:P._reason||'',lastEval:P._lastEval||null,samples:s.n};
  },
  _test:{decide:function(fps){decide(fps,1);},frame:frame,hints:hints,reset:reset}
};
/* başlangıç: kayıtlı seçim varsa uygula, yoksa cihaz ipuçları */
(function init(){
  var saved=parse(SG.store.get('quality','auto'));
  var hv=hints();hintTier=hv.tier;
  if(saved==='auto'){MODE='auto';apply(hv.tier,'ipucu: '+(hv.why.join(',')||'yok'));}
  else{MODE='manual';apply(saved,'kayitli');}
  try{SG.loop.add('perf',frame);}catch(e){SG.log.err('perf',e);}
  window.addEventListener('sg-pause',function(){win.on=false;});
  window.addEventListener('sg-resume',function(){reset();if(MODE==='auto'&&win.phase===1)clock=Math.min(clock,59);});
  document.addEventListener('visibilitychange',function(){reset();});
  try{
    if(window.PerformanceObserver&&PerformanceObserver.supportedEntryTypes&&PerformanceObserver.supportedEntryTypes.indexOf('longtask')>=0){
      new PerformanceObserver(function(l){l.getEntries().forEach(function(e){longCount++;longTotal+=e.duration;if(e.duration>longMax)longMax=e.duration;});}).observe({entryTypes:['longtask']});
    }
  }catch(e){}
})();
})();
