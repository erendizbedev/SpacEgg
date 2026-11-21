/* SpacEgg v3 — savaş çözümleyici (SG.War): güç hesabı, saf resolve, saldırı/sefer uygulaması, kurtarma */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var H=3600000;
function T(){return SG.TUNE;}
var War=SG.War={};
function cmul(id,k){var c=SG.Civ.get(id);var v=c&&c.mul&&c.mul[k];return typeof v==='number'?v:1;}
/* ---- güç ---- */
War.wallFrac=function(s,t){
  var b=null,i;for(i=0;i<s.bld.length;i++)if(s.bld[i].type==='wall'&&s.bld[i].lv>0){b=s.bld[i];break;}
  if(!b||b.dmgUntil>t)return 0;
  return T().wallBonus*b.lv;
};
/* ham savunma (medeniyet ve sur çarpanı yok) */
War.defRaw=function(s){
  var t=T(),p=t.baseDef+t.hallDef*SG.Bld.hallLv(s),u;
  for(u in s.troops)p+=(t.units[u]?t.units[u].def:0)*s.troops[u];
  return p;
};
/* bileşik savunma: yapay zekâ bandı bunu referans alır */
War.defPower=function(s,t){
  if(t==null)t=s.at;
  return War.defRaw(s)*cmul(s.civ,'def')*(1+War.wallFrac(s,t));
};
/* ham saldırı gücü; troops verilmezse gönderilebilir birlikler (nöbetçiler hariç) */
War.sendable=function(s){
  var o={},u,n,any=false;
  for(u in s.troops){if(u==='sentinel')continue;n=Math.floor(s.troops[u]*T().sendFrac);if(n>0){o[u]=n;any=true;}}
  return any?o:null;
};
War.attRaw=function(troops){var t=T(),p=0,u;for(u in troops)p+=(t.units[u]?t.units[u].att:0)*troops[u];return p;};
War.attPower=function(s,troops){
  if(!troops)troops=War.sendable(s)||{};
  return War.attRaw(troops)*cmul(s.civ,'atk');
};
/* ---- saf çözümleyici ----
   att:{power,civ,type,man,noCiv}  def:{power,civ,man,wall,res,prot,slots,noCiv}
   -> {winner:'att'|'def',ratio,A,D,lossA,lossD,loot:{res:amt},dmg:[slot],edge,log:[]} */
War.resolve=function(att,def,seed){
  var t=T(),r=SG.K.rng('war#'+seed),log=[];
  var typ=att.type?t.atkTypes[att.type]:null;
  var aman=t.man.att[att.man]||t.man.att.duz,dman=t.man.def[def.man]||t.man.def.yok;
  var edge=SG.Civ.edge(att.civ,def.civ);
  var A=att.power*(att.noCiv?1:cmul(att.civ,'atk'))*edge*aman.att;
  if(att.type==='kusat')A*=cmul(att.civ,'siege');
  if(att.type==='golge')A*=cmul(att.civ,'shadow');
  var wall=(def.wall||0)/cmul(att.civ,'wallBreak');
  var D=def.power*(def.noCiv?1:cmul(def.civ,'def'))*(1+wall)*dman.def*(aman.def||1);
  var va=1+(r()*2-1)*t.variance,vd=1+(r()*2-1)*t.variance;
  A*=va;D*=vd;
  var ratio=A/Math.max(1e-9,D),win=A>D;
  var lossA,lossD;
  if(win){
    lossD=SG.K.clamp(t.lossLose+t.lossSlope*(ratio-1),t.lossLose,t.lossMax);
    lossA=t.lossWin*aman.lossOwn;
  }else{
    lossD=t.lossWin*ratio*ratio;
    lossA=SG.K.clamp(t.lossLose+t.lossSlope*(1/ratio-1),t.lossLose,t.lossMax)*aman.lossOwn*(dman.lossAtt||1);
  }
  var loot={},dmg=[];
  if(typ&&typ.noLoss){lossD=0;lossA=0;}
  if(win&&!(typ&&typ.noLoss)){
    var pct=SG.K.clamp(t.lootBase+t.lootSlope*(ratio-1)/0.5,t.lootBase,t.lootMax)*(typ?typ.loot:1)*aman.loot*cmul(att.civ,'loot')*(dman.lootMul||1);
    pct=Math.min(pct,t.lootMax*2);
    var ks=['food','stone','metal','energy','know'],pick=[],i;
    while(pick.length<t.lootRes&&ks.length){i=Math.floor(r()*ks.length);pick.push(ks.splice(i,1)[0]);}
    pick.forEach(function(k){
      var av=Math.max(0,(def.res[k]||0)-(def.prot||0)),a=Math.floor(av*pct);
      if(a>0)loot[k]=a;
    });
    var ac=Math.floor((def.res.credit||0)*t.lootCredit*Math.min(1,pct/t.lootMax));
    if(ac>0)loot.credit=ac;
    if(typ&&!typ.lootOnly&&typ.dmg>0&&def.slots&&def.slots.length){
      var cand=def.slots.slice(),n=Math.min(typ.dmg,cand.length);
      while(dmg.length<n){i=Math.floor(r()*cand.length);dmg.push(cand.splice(i,1)[0]);}
    }
  }
  log.push('Güç oranı '+Math.round(ratio*100)/100+' (saldırı '+Math.round(A)+' / savunma '+Math.round(D)+').');
  if(edge>1.01)log.push('Sınıf avantajı saldırıda (x'+Math.round(edge*100)/100+').');
  else if(edge<0.99)log.push('Sınıf dezavantajı saldırıda (x'+Math.round(edge*100)/100+').');
  return {winner:win?'att':'def',ratio:ratio,A:A,D:D,lossA:lossA,lossD:lossD,loot:loot,dmg:dmg,edge:edge,log:log};
};
/* ---- uygulama yardımcıları ---- */
function lose(troops,frac){
  var lost={},u,l;
  for(u in troops){l=Math.min(troops[u],Math.round(troops[u]*frac));if(l>0){troops[u]-=l;lost[u]=l;}}
  return lost;
}
War.lose=lose;
War.addLoot=function(s,loot){
  var cap=SG.Eco.cap(s),got={},lost={},k,room,add;
  for(k in loot){room=Math.max(0,cap-s.res[k]);add=Math.min(room,loot[k]);if(add>0){s.res[k]+=add;got[k]=add;}if(loot[k]-add>0)lost[k]=loot[k]-add;}
  return {got:got,lost:lost};
};
function unitText(lost){var t=T(),a=[],u;for(u in lost)a.push(lost[u]+' '+t.units[u].ad);return a.join(', ');}
function resText(o){var t=T(),a=[],k;for(k in o)a.push(Math.round(o[k])+' '+t.resAd[k]);return a.join(', ');}
War.resText=resText;War.unitText=unitText;
/* ---- rakip -> oyuncu saldırısı (plan olayı) ---- */
War.onAttack=function(s,ev){
  var t=T(),at=s.at,r=SG.AI.byId(s,ev.rid)||s.rivals[ev.slot];
  if(!r||r.state!=='alive')return;                           // saldıran yok oldu ya da yok oluş geri sayımında
  var typ=t.atkTypes[ev.type];
  if(s.war.shieldUntil>at){
    SG.PS.log(s,at,'war',r.name+' ('+typ.ad+') saldırısını koruma/kalkan karşıladı.');
    s.stats.blocked=(s.stats.blocked||0)+1;
    SG.Ev.pop(s,{kind:'rapor',tur:'savas',t:at,type:ev.type,tip:typ.ad,from:SG.AI.info(r),result:'engellendi',lines:[r.name+' saldırısı koruma altında engellendi.']});
    return;
  }
  var cap=SG.Eco.cap(s),dm=ev.m||'yok',D=War.defRaw(s),wall=War.wallFrac(s,at);
  var slots=s.bld.filter(function(b){return b.lv>0&&b.type!=='hall'&&b.dmgUntil<=at;}).map(function(b){return b.slot;});
  var Ap=SG.AI.power(s,r,at)*typ.ratio;
  var res=War.resolve({power:Ap,civ:r.civ,type:ev.type,man:'duz',noCiv:true},
    {power:D,civ:s.civ,man:dm,wall:wall,res:s.res,prot:t.protect*cap,slots:slots},ev.id);
  var lines=res.log.slice(),defeat=res.winner==='att';
  var man=t.man.def[dm]||t.man.def.yok;
  if(dm!=='yok')lines.unshift('Manevra: '+man.ad+'.');
  var lostT=lose(s.troops,res.lossD),lootApplied={};
  if(!defeat&&typ.noLoss){
    var rw=t.yuceReward,k;for(k in rw)s.res[k]=Math.min(Math.max(cap,s.res[k]),s.res[k]+rw[k]);
    lines.push('Yüce Sınav geçildi: '+resText(rw)+' ödül.');
  }
  if(defeat){
    for(var k2 in res.loot){var a=Math.min(s.res[k2],res.loot[k2]);s.res[k2]-=a;lootApplied[k2]=a;}
    res.dmg.forEach(function(sl){var b=SG.Bld.get(s,sl);if(b)b.dmgUntil=at+t.dmgH*H;});
    if(Object.keys(lootApplied).length)lines.push('Yağmalanan: '+resText(lootApplied)+'.');
    if(res.dmg.length)lines.push(res.dmg.length+' yapı hasar gördü; '+t.dmgH+' sa içinde yeniden yapılır.');
    else if(typ.lootOnly)lines.push('Yalnız kaynak yağması: yapılar sağlam.');
  }
  if(Object.keys(lostT).length)lines.push('Kayıp birlik: '+unitText(lostT)+'.');
  var w=s.war;
  if(defeat&&!typ.noLoss){
    w.streak++;w.lastDefeatAt=at;w.losses++;w.shieldUntil=at+t.shieldMin*60000;
    s.stats.defeats=(s.stats.defeats||0)+1;
    if(w.streak>=t.loseStreak&&!s.dying){
      s.dying={killAt:at+t.selfKillH*H,since:at};
      SG.Ev.pop(s,{kind:'kaybet',t:at,streak:w.streak,killAt:s.dying.killAt,hoursLeft:t.selfKillH,rescueCost:t.rescue.cost,from:SG.AI.info(r)});
      SG.PS.log(s,at,'kill','Üst üste '+w.streak+' yenilgi: gezegen yok oluş geri sayımında ('+t.selfKillH+' sa). Kurtarma mümkün.');
    }
  }else if(!defeat){
    w.wins++;s.stats.wins=(s.stats.wins||0)+1;
    w.streak=0;
    if(s.dying){s.dying=null;lines.push('Savunma kazanıldı: yok oluş geri sayımı iptal edildi (Kurtarma).');SG.PS.log(s,at,'kill','Savunma kazanıldı, yok oluş iptal.');}
  }
  SG.PS.log(s,at,'war',r.name+' '+typ.ad+': '+(defeat?'yenildin':'savundun')+'.');
  SG.Ev.pop(s,{kind:'rapor',tur:'savas',t:at,type:ev.type,tip:typ.ad,from:SG.AI.info(r),result:defeat?'kaybettin':'kazandin',
    ratio:Math.round(res.ratio*100)/100,lossTroops:lostT,lootLost:lootApplied,damaged:res.dmg,streak:w.streak,lines:lines});
};
/* ---- kurtarma: kalkan + onarım ---- */
War.rescue=function(s,now){
  var t=T();
  if(!s.dying)return {ok:false,err:'Kurtarılacak bir yok oluş yok.'};
  if(!SG.Bld.canAfford(s,t.rescue.cost))return {ok:false,err:'Kaynak yetmiyor.',missing:SG.Bld.missing(s,t.rescue.cost)};
  SG.Bld.pay(s,t.rescue.cost);
  s.dying=null;s.war.streak=0;s.war.shieldUntil=now+t.rescue.shieldH*H;
  s.bld.forEach(function(b){b.dmgUntil=0;});
  SG.PS.log(s,now,'kill','Kurtarma yapıldı: kalkan '+t.rescue.shieldH+' sa, yapılar onarıldı.');
  return {ok:true,shieldUntil:s.war.shieldUntil};
};
/* ---- oyuncu seferi ---- */
War.launch=function(s,rivalId,man,now){
  var t=T(),r=SG.AI.byId(s,rivalId);
  if(!r||r.state==='gone')return {ok:false,err:'Rakip bulunamadı.'};
  if(!t.man.att[man])man='duz';
  if(s.q.some(function(j){return j.kind==='march';}))return {ok:false,err:'Zaten bir sefer yolda.'};
  var send=War.sendable(s);
  if(!send)return {ok:false,err:'Saldıracak birlik yok (Nöbetçiler savunmada kalır).'};
  if(!SG.Bld.canAfford(s,t.attackCost))return {ok:false,err:'Sefer masrafı yetmiyor.',missing:SG.Bld.missing(s,t.attackCost)};
  SG.Bld.pay(s,t.attackCost);
  var u;for(u in send)s.troops[u]-=send[u];
  var id=SG.Bld.nid(s),t1=now+2*t.marchMin*60000*SG.K.mul(s,'prep');
  s.q.push({id:id,kind:'march',rival:rivalId,man:man,troops:send,t0:now,t1:t1,cost:t.attackCost});
  SG.PS.log(s,now,'war',r.name+' üzerine sefer çıktı ('+t.man.att[man].ad+').');
  return {ok:true,qid:id,t1:t1,sent:send};
};
War.finishMarch=function(s,j){
  var t=T(),at=j.t1,r=SG.AI.byId(s,j.rival),u;
  if(!r||r.state==='gone'){
    for(u in j.troops)s.troops[u]=(s.troops[u]||0)+j.troops[u];
    SG.PS.log(s,at,'war','Sefer boşa çıktı: hedef gezegen artık yok; birlikler döndü.');
    SG.Ev.pop(s,{kind:'rapor',tur:'sefer',t:at,result:'iptal',lines:['Hedef gezegen yok oldu; birlikler eve döndü.']});
    return;
  }
  var A=War.attRaw(j.troops),D=SG.AI.def(s,r,at);
  var res=War.resolve({power:A,civ:s.civ,type:null,man:j.man},
    {power:D,civ:r.civ,noCiv:true,man:'yok',wall:0,res:SG.AI.stockObj(s,r,at),prot:T().protect*SG.AI.stock(s,r,at),slots:[]},j.id);
  var win=res.winner==='att',lostT=lose(j.troops,res.lossA),lines=res.log.slice();
  for(u in j.troops)s.troops[u]=(s.troops[u]||0)+j.troops[u];
  var gl={got:{},lost:{}};
  if(win)gl=War.addLoot(s,res.loot);
  var yag=t.man.att[j.man].lootOnly,killed=false;
  if(win&&!yag&&r.state==='alive')killed=SG.AI.markDying(s,r,at,'oyuncu');
  if(Object.keys(lostT).length)lines.push('Kayıp birlik: '+unitText(lostT)+'.');
  if(win){lines.push('Ganimet: '+resText(gl.got)+'.');if(Object.keys(gl.lost).length)lines.push('Depoya sığmayan ganimet kayboldu: '+resText(gl.lost)+'.');}
  if(killed)lines.push(r.name+' gezegeni '+t.rivalKillH+' saat içinde yok olacak.');
  SG.PS.log(s,at,'war','Sefer: '+r.name+' '+(win?'yenildi':'seni püskürttü')+'.');
  s.stats[win?'raidWins':'raidLosses']=(s.stats[win?'raidWins':'raidLosses']||0)+1;
  SG.Ev.pop(s,{kind:'rapor',tur:'sefer',t:at,result:win?'kazandin':'kaybettin',rival:SG.AI.info(r),ratio:Math.round(res.ratio*100)/100,
    loot:gl.got,lootWasted:gl.lost,lossTroops:lostT,killAt:killed?r.killAt:null,lines:lines});
};
})();
