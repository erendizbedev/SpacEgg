/* SpacEgg v3 — olaylar (SG.Ev): yoklama akışı (12 sa pencere, Katıl=hazırlan), popup kuyruğu, drain */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var H=3600000;
function T(){return SG.TUNE;}
var Ev=SG.Ev={};
var POPMAX=40;
Ev.pop=function(s,o){
  s.seq=(s.seq||0)+1;o.id='pp'+s.seq;
  s.popq.push(o);if(s.popq.length>POPMAX)s.popq.shift();
  return o;
};
Ev.pendById=function(s,id){for(var i=0;i<s.pend.length;i++)if(s.pend[i].id===id)return s.pend[i];return null;};
Ev.openPend=function(s){return s.pend.filter(function(p){return p.state==='open'||p.state==='prep'||p.state==='ready';});};
function yPopup(s,p,phase){
  var a=SG.AI.byId(s,p.a),b=SG.AI.byId(s,p.b);
  var A=a?SG.AI.power(s,a,s.at):0,B=b?SG.AI.def(s,b,s.at):0;
  return {kind:'yoklama',t:s.at,phase:phase,pendId:p.id,
    from:a?SG.AI.info(a):null,target:b?SG.AI.info(b):null,
    power:{from:Math.round(A),target:Math.round(B),band:b?SG.AI.band(s,b,s.at):'denk'},
    edge:b?Math.round(SG.Civ.edge(s.civ,b.civ)*100)/100:1,
    joinBy:p.joinBy,prepEnd:p.prepEnd,prepMin:Math.round(T().prepMin*SG.K.mul(s,'prep')),
    choices:phase==='teklif'?['join','skip']:['confirm','skip']};
}
/* plan olayı: rakip, başka bir rakibe saldırı planı ilan eder */
Ev.onPoll=function(s,ev){
  var a=s.rivals[ev.a],b=s.rivals[ev.b];
  if(!a||!b||a.state!=='alive'||b.state!=='alive')return;
  var p={id:'y'+ev.id,kind:'yoklama',offerAt:s.at,joinBy:s.at+T().pollH*H,a:a.id,b:b.id,state:'open',prepEnd:0,m:'duz'};
  s.pend.push(p);
  SG.PS.log(s,s.at,'yoklama',a.name+', '+b.name+' gezegenine saldırı planı ilan etti ('+T().pollH+' sa içinde katılabilirsin).');
  Ev.pop(s,yPopup(s,p,'teklif'));
};
Ev.prepDone=function(s,j){
  var p=Ev.pendById(s,j.pend);
  if(!p||p.state!=='prep')return;
  p.state='ready';
  SG.PS.log(s,j.t1,'yoklama','Saldırı hazırlığı bitti: onaylayabilirsin.');
  Ev.pop(s,yPopup(s,p,'hazir'));
};
/* pencere doldu: bedelsiz kapanır (kaçırıldı); katılmayan planda rakipler kendi arasında savaşır */
Ev.expire=function(s,p,at){
  if(p.state!=='open'&&p.state!=='prep'&&p.state!=='ready')return;
  var was=p.state;
  p.state='missed';
  s.q=s.q.filter(function(j){return !(j.kind==='prep'&&j.pend===p.id);});
  var a=SG.AI.byId(s,p.a),b=SG.AI.byId(s,p.b);
  SG.PS.log(s,at,'yoklama','Yoklama penceresi kapandı (kaçırıldı).');
  if(a&&b&&a.state==='alive'&&b.state==='alive'){
    var res=SG.War.resolve({power:SG.AI.power(s,a,at),civ:a.civ,type:null,man:'duz',noCiv:true},
      {power:SG.AI.def(s,b,at),civ:b.civ,noCiv:true,man:'yok',wall:0,res:{},prot:0,slots:[]},p.id+'#ai');
    if(res.winner==='att')b.hurtUntil=at+12*H;
    SG.PS.log(s,at,'yoklama',a.name+', '+b.name+' gezegenine saldırdı: '+(res.winner==='att'?'kazandı':'yenildi')+'.');
  }
  if(was==='prep'||was==='ready')Ev.pop(s,{kind:'yoklama',t:at,phase:'kacirildi',pendId:p.id,from:a?SG.AI.info(a):null,target:b?SG.AI.info(b):null,choices:[]});
};
/* oyuncu kararı */
Ev.decide=function(s,pendId,act,now){
  var t=T(),p=Ev.pendById(s,pendId);
  if(!p)return {ok:false,err:'Yoklama bulunamadı.'};
  if(now>=p.joinBy)return {ok:false,err:'Pencere kapandı.'};
  var a=SG.AI.byId(s,p.a),b=SG.AI.byId(s,p.b);
  if(act==='skip'){
    if(p.state!=='open'&&p.state!=='prep'&&p.state!=='ready')return {ok:false,err:'Bu yoklama zaten kapandı.'};
    s.q=s.q.filter(function(j){return !(j.kind==='prep'&&j.pend===p.id);});
    p.state='skipped';
    SG.PS.log(s,now,'yoklama','Yoklamaya katılmadın (bedelsiz).');
    return {ok:true,state:'skipped'};
  }
  if(!a||!b||a.state!=='alive'||b.state!=='alive')return {ok:false,err:'Gezegenlerden biri artık saldırıya uygun değil.'};
  if(act==='join'){
    if(p.state!=='open')return {ok:false,err:'Zaten hazırlanıyorsun ya da kapandı.'};
    if(!SG.War.sendable(s))return {ok:false,err:'Katılacak saldırı birliğin yok (Nöbetçiler savunmada kalır).'};
    var prep=Math.round(t.prepMin*SG.K.mul(s,'prep'))*60000;
    if(now+prep>p.joinBy)return {ok:false,err:'Hazırlık süresi pencereye sığmıyor.'};
    var id=SG.Bld.nid(s);
    s.q.push({id:id,kind:'prep',pend:p.id,t0:now,t1:now+prep});
    p.state='prep';p.prepEnd=now+prep;
    SG.PS.log(s,now,'yoklama','Saldırıya hazırlanıyorsun ('+Math.round(prep/60000)+' dk).');
    return {ok:true,state:'prep',prepEnd:p.prepEnd,qid:id};
  }
  if(act==='confirm'){
    if(p.state!=='ready')return {ok:false,err:'Henüz hazır değilsin.'};
    var send=SG.War.sendable(s);
    if(!send)return {ok:false,err:'Saldıracak birlik kalmadı.'};
    var u,own=SG.War.attPower(s,send),ally=SG.AI.power(s,a,now)*t.joinAlly;
    var res=SG.War.resolve({power:own+ally,civ:s.civ,type:null,man:p.m||'duz',noCiv:true},
      {power:SG.AI.def(s,b,now),civ:b.civ,noCiv:true,man:'yok',wall:0,res:SG.AI.stockObj(s,b,now),prot:t.protect*SG.AI.stock(s,b,now),slots:[]},p.id+'#join');
    var win=res.winner==='att',sent=JSON.parse(JSON.stringify(send));
    for(u in sent)s.troops[u]-=sent[u];
    var lostT=SG.War.lose(sent,res.lossA);
    for(u in sent)s.troops[u]+=sent[u];
    var gl=win?SG.War.addLoot(s,res.loot):{got:{},lost:{}};
    var killed=win?SG.AI.markDying(s,b,now,'oyuncu'):false;
    p.state='done';
    var lines=res.log.slice();
    lines.unshift(a.name+' ile birlikte '+b.name+' gezegenine saldırdın.');
    if(Object.keys(lostT).length)lines.push('Kayıp birlik: '+SG.War.unitText(lostT)+'.');
    if(win)lines.push('Ganimet payı: '+SG.War.resText(gl.got)+'.');
    if(killed)lines.push(b.name+' gezegeni '+t.rivalKillH+' saat içinde yok olacak.');
    SG.PS.log(s,now,'yoklama','Ortak saldırı: '+(win?'kazanıldı':'kaybedildi')+'.');
    s.stats[win?'joinWins':'joinLosses']=(s.stats[win?'joinWins':'joinLosses']||0)+1;
    var pop=Ev.pop(s,{kind:'rapor',tur:'katil',t:now,result:win?'kazandin':'kaybettin',ally:SG.AI.info(a),rival:SG.AI.info(b),
      ratio:Math.round(res.ratio*100)/100,loot:gl.got,lossTroops:lostT,killAt:killed?b.killAt:null,lines:lines});
    return {ok:true,state:'done',won:win,loot:gl.got,lossTroops:lostT,killAt:killed?b.killAt:null,popup:pop.id};
  }
  return {ok:false,err:'Bilinmeyen karar.'};
};
/* manevra: savunma (plan saldırısı) ya da katılım saldırısı (yoklama) için */
Ev.maneuver=function(s,id,m,now){
  var t=T(),ev=null,i;
  for(i=0;i<s.plan.list.length;i++)if(s.plan.list[i].id===id&&s.plan.list[i].kind==='att'){ev=s.plan.list[i];break;}
  if(ev){
    if(!t.man.def[m])return {ok:false,err:'Bilinmeyen savunma manevrası.'};
    if(ev.at<=now)return {ok:false,err:'Saldırı zaten geldi.'};
    var old=ev.m||'yok';
    if(old===m)return {ok:true,m:m};
    if(old==='kalkan')SG.Bld.refund(s,t.man.def.kalkan.cost,1);
    if(m==='kalkan'){
      var c=t.man.def.kalkan.cost;
      if(!SG.Bld.canAfford(s,c)){if(old==='kalkan')SG.Bld.pay(s,c);return {ok:false,err:'Kalkan için enerji yetmiyor.',missing:SG.Bld.missing(s,c)};}
      SG.Bld.pay(s,c);
    }
    ev.m=m;
    return {ok:true,m:m};
  }
  var p=Ev.pendById(s,id);
  if(p){
    if(!t.man.att[m])return {ok:false,err:'Bilinmeyen saldırı manevrası.'};
    if(p.state!=='open'&&p.state!=='prep'&&p.state!=='ready')return {ok:false,err:'Yoklama kapandı.'};
    p.m=m;return {ok:true,m:m};
  }
  return {ok:false,err:'Saldırı ya da yoklama bulunamadı.'};
};
/* arayüzün göstereceği sıradaki popup'lar (en eskisi önce); eyleme dönük olmayanlar düşer */
Ev.drain=function(s){
  var out=[],lr=s.lastReport;
  if(lr&&!lr.shown&&lr.lines.length){lr.shown=true;out.push({kind:'rapor',tur:'yokken',t:lr.to,from:lr.from,to:lr.to,awayMs:lr.awayMs,capped:lr.capped,lines:lr.lines.map(function(l){return l.text;}),gained:lr.gained,spent:lr.spent,id:'pp0'});}
  var q=s.popq.slice();s.popq=[];
  q.sort(function(a,b){return a.t-b.t;});
  q.forEach(function(p){
    if(p.kind==='yoklama'&&p.phase!=='kacirildi'){
      var pd=Ev.pendById(s,p.pendId);
      if(!pd||s.at>=pd.joinBy)return;
      if(p.phase==='teklif'&&pd.state!=='open')return;
      if(p.phase==='hazir'&&pd.state!=='ready')return;
      p.canJoin=!!SG.War.sendable(s);
    }
    out.push(p);
  });
  return out;
};
})();
