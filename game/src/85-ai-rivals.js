/* SpacEgg v3 — yapay zekâ rakipler (SG.AI): güç eğrisi, olay planı, keşif, yok oluş */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var H=3600000,DAY=86400000;
function T(){return SG.TUNE;}
var SYL=['ka','vo','ren','tal','mi','sa','du','ne','ri','os','yan','el','zor','ba','lu','em','tar','hi'];
var AI=SG.AI={};
AI.name=function(rg){var n=2+Math.floor(rg()*2),o='',i;for(i=0;i<n;i++)o+=SYL[Math.floor(rg()*SYL.length)];return o.charAt(0).toUpperCase()+o.slice(1)+'-'+(1+Math.floor(rg()*9));};
AI.newRival=function(s,slot,gen,bornAt){
  var t=T(),rg=SG.K.rng(s.seed+'#r'+slot+'#'+gen),civ=SG.Civ.LIST[Math.floor(rg()*SG.Civ.LIST.length)];
  return {id:'r'+slot+'_'+gen,slot:slot,gen:gen,civ:civ.id,name:AI.name(rg),
    p0:t.ai.p0[0]+rg()*(t.ai.p0[1]-t.ai.p0[0]),k:t.ai.k[0]+rg()*(t.ai.k[1]-t.ai.k[0]),pMax:t.ai.pMax[0]+rg()*(t.ai.pMax[1]-t.ai.pMax[0]),
    born:bornAt,state:'alive',killAt:null,hurtUntil:0,by:null};
};
AI.init=function(s){s.rivals=[];for(var i=0;i<T().rivalCount;i++)s.rivals.push(AI.newRival(s,i,0,s.born));};
AI.byId=function(s,id){for(var i=0;i<s.rivals.length;i++)if(s.rivals[i].id===id)return s.rivals[i];return null;};
AI.info=function(r){var c=SG.Civ.get(r.civ);return {id:r.id,ad:r.name,civ:r.civ,civAd:c.ad,sinif:c.sinif,state:r.state,killAt:r.killAt,lider:c.lider.ad,pal:c.pal};};
/* doğal güç eğrisi: p0 x e^(k x gün), tavanlı */
AI.nat=function(r,t){return Math.min(r.pMax,r.p0*Math.exp(r.k*Math.max(0,t-r.born)/DAY));};
/* oyuncu savunmasına 0,6-1,5 bandında uyumlu güç (ezilme önlemi) */
AI.power=function(s,r,t,D){
  var b=T().band,ref=Math.max(D!=null?D:SG.War.defPower(s,t),T().ai.refMin);
  var p=SG.K.clamp(AI.nat(r,t),b.lo*ref,b.hi*ref);
  if(r.hurtUntil>t)p*=T().ai.hurtMul;
  return p;
};
AI.def=function(s,r,t){return AI.power(s,r,t)*T().ai.defK;};
AI.stock=function(s,r,t){return T().ai.stockBase+T().ai.stockPer*AI.power(s,r,t);};
AI.stockObj=function(s,r,t){var v=AI.stock(s,r,t),o={};T().res.forEach(function(k){o[k]=v;});return o;};
/* oyuncunun saldırı gücüne göre rakip bandı */
AI.band=function(s,r,t){
  var A=SG.War.attPower(s,null)*SG.Civ.edge(s.civ,r.civ),D=Math.max(1,AI.def(s,r,t)),q=A/D;
  return q>1.15?'zayif':q<0.85?'guclu':'denk';
};
/* ---------- olay planı: tohumlu, 72 sa pencereler, pencere indeksine bağlı (üretim zamanından bağımsız) ---------- */
function pickType(w,at,s,rg){
  var t=T(),day=(at-s.born)/DAY,tot=0,list=[],id,d;
  for(id in t.atkTypes){
    d=t.atkTypes[id];
    if(day<d.minDay)continue;
    if(d.gapDays&&(w%Math.max(1,Math.round(d.gapDays/(t.planWindowH/24)))!==0))continue;
    list.push(id);tot+=d.w;
  }
  var x=rg()*tot,i;
  for(i=0;i<list.length;i++){x-=t.atkTypes[list[i]].w;if(x<0)return list[i];}
  return list.length?list[list.length-1]:'akin';
}
AI.genPlan=function(s,w){
  var t=T(),W=t.planWindowH*H,start=s.born+w*W,rg=SG.K.rng(s.seed+'#plan#'+w),out=[],i;
  var nA=Math.floor(t.atkPerDay*t.planWindowH/24+rg());
  var usedGap={};
  for(i=0;i<nA;i++){
    var at=start+Math.floor(rg()*W),slot=Math.floor(rg()*t.rivalCount),ty=pickType(w,at,s,rg);
    if(t.atkTypes[ty].gapDays){if(usedGap[ty])ty='kusat';else usedGap[ty]=1;}
    if(at<s.born+t.graceH*H)continue;
    out.push({id:'e'+w+'a'+i,at:at,kind:'att',slot:slot,type:ty,m:'yok'});
  }
  var nP=Math.floor(t.pollPerDay*t.planWindowH/24+rg());
  for(i=0;i<nP;i++){
    var pa=start+Math.floor(rg()*W),a=Math.floor(rg()*t.rivalCount),b=Math.floor(rg()*(t.rivalCount-1));
    if(b>=a)b++;
    out.push({id:'e'+w+'p'+i,at:pa,kind:'poll',a:a,b:b});
  }
  out.sort(function(x,y){return x.at-y.at||(x.id<y.id?-1:1);});
  return out;
};
AI.ensurePlan=function(s,until){
  var W=T().planWindowH*H,ch=false;
  while(s.born+s.plan.cursor*W<=until){
    var l=AI.genPlan(s,s.plan.cursor);for(var i=0;i<l.length;i++)s.plan.list.push(l[i]);
    s.plan.cursor++;ch=true;
  }
  if(ch)s.plan.list.sort(function(x,y){return x.at-y.at||(x.id<y.id?-1:1);});
};
/* ---------- keşif ---------- */
AI.scout=function(s,rivalId,now){
  var t=T(),r=AI.byId(s,rivalId);
  if(!r||r.state==='gone')return {ok:false,err:'Rakip bulunamadı.'};
  if(s.q.some(function(j){return j.kind==='scout'&&j.rival===rivalId;}))return {ok:false,err:'Bu rakibe izci zaten gitti.'};
  if(!SG.Bld.canAfford(s,t.scoutCost))return {ok:false,err:'Kaynak yetmiyor.',missing:SG.Bld.missing(s,t.scoutCost)};
  SG.Bld.pay(s,t.scoutCost);
  var id=SG.Bld.nid(s);
  s.q.push({id:id,kind:'scout',rival:rivalId,t0:now,t1:now+t.scoutMin*60000,cost:t.scoutCost});
  return {ok:true,qid:id,t1:now+t.scoutMin*60000};
};
AI.finishScout=function(s,j){
  var t=T(),r=AI.byId(s,j.rival),at=j.t1;
  if(!r||r.state==='gone'){SG.PS.log(s,at,'scout','İzci boş döndü: gezegen artık yok.');return;}
  var rg=SG.K.rng(s.seed+'#scout#'+j.id),civ=SG.Civ.get(r.civ),hide=(civ.mul||{}).scoutHide;
  if(hide&&rg()>hide){
    SG.PS.log(s,at,'scout',r.name+': izci yer altı ağında kayboldu, bilgi yok.');
    SG.Ev.pop(s,{kind:'rapor',tur:'izci',t:at,rival:AI.info(r),ok:false,lines:[r.name+' gezegeninin yer altı ağı keşfi engelledi.']});
    return;
  }
  var err=1+(rg()*2-1)*t.ai.errScout,fake=(civ.mul||{}).fake||1;
  var p=AI.def(s,r,at)*err*fake,stock=AI.stock(s,r,at)*err;
  var band=AI.band(s,r,at),edge=SG.Civ.edge(s.civ,r.civ);
  s.intel[r.id]={at:at,power:Math.round(p),band:band,loot:Math.round(stock*t.lootMax)};
  SG.PS.log(s,at,'scout',r.name+' keşfedildi: '+(band==='zayif'?'zayıf':band==='guclu'?'güçlü':'denk')+'.');
  SG.Ev.pop(s,{kind:'rapor',tur:'izci',t:at,ok:true,rival:AI.info(r),power:Math.round(p),band:band,edge:Math.round(edge*100)/100,
    hint:SG.Civ.hint(s.civ,r.civ),loot:Math.round(stock*t.lootMax),
    lines:[r.name+' ('+SG.Civ.get(r.civ).ad+'): tahmini güç '+Math.round(p)+', ganimet ≈ '+Math.round(stock*t.lootMax)+' / kaynak.']});
};
/* ---------- yok oluş ---------- */
AI.markDying=function(s,r,at,by){
  if(r.state!=='alive')return false;
  r.state='dying';r.killAt=at+T().rivalKillH*H;r.by=by||'oyuncu';
  SG.PS.log(s,at,'rival',r.name+' gezegeni yok oluş geri sayımında ('+T().rivalKillH+' sa).');
  return true;
};
AI.onGone=function(s,r,at){
  var i=s.rivals.indexOf(r),ng=(r.gen||0)+1;
  SG.PS.log(s,at,'rival',r.name+' gezegeni yok oldu.');
  s.stats.rivalsKilled=(s.stats.rivalsKilled||0)+1;
  SG.Ev.pop(s,{kind:'yokolus',who:'rival',t:at,rival:AI.info(r)});
  if(i>=0)s.rivals[i]=AI.newRival(s,r.slot,ng,at);   // yerine yeni rakip doğar
};
})();
