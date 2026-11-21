/* SpacEgg v3 — lojistik gemi (SG.Log): 90 dk gidiş-dönüş, ganimet depoyu aşmaz */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var H=3600000;
function T(){return SG.TUNE;}
var Log=SG.Log={};
Log.ensureFleet=function(s){
  var n=T().ship.count[SG.Bld.lv(s,'port')]||0;
  while(s.fleet.length<n){s.seq=(s.seq||0)+1;s.fleet.push({id:'sh'+s.seq,state:'idle',t0:0,t1:0,mid:0,target:null,trip:0,cargo:null});}
};
Log.roundMs=function(s){return T().shipRoundMin*60000*SG.K.mul(s,'shipTime');};
Log.cargoCap=function(s){return T().ship.cargo[SG.Bld.lv(s,'port')]||0;};
Log.idle=function(s){for(var i=0;i<s.fleet.length;i++)if(s.fleet[i].state==='idle')return s.fleet[i];return null;};
/* rivalId=null: ticaret rotası (kaynak toplama); rivalId: o gezegene yağma seferi */
Log.send=function(s,rivalId,now){
  var port=SG.Bld.lv(s,'port');
  if(port<1)return {ok:false,err:'Önce Liman yapmalısın.'};
  Log.ensureFleet(s);
  var sh=Log.idle(s);
  if(!sh)return {ok:false,err:'Boş gemi yok.'};
  var r=null;
  if(rivalId){r=SG.AI.byId(s,rivalId);if(!r||r.state==='gone')return {ok:false,err:'Rakip bulunamadı.'};}
  var rd=Log.roundMs(s);
  sh.trip++;sh.state='out';sh.t0=now;sh.mid=now+Math.round(rd/2);sh.t1=now+Math.round(rd);sh.target=rivalId||null;sh.cargo=null;
  SG.PS.log(s,now,'ship',r?'Lojistik gemi '+r.name+' üzerine yağmaya çıktı.':'Lojistik gemi ticaret rotasına çıktı.');
  return {ok:true,shipId:sh.id,mid:sh.mid,t1:sh.t1};
};
/* yolun yarısı: toplama/yağma sonucu belirlenir */
Log.onMid=function(s,sh){
  var t=T(),at=sh.mid,rg=SG.K.rng(s.seed+'#ship#'+sh.id+'#'+sh.trip),cap=Log.cargoCap(s),cargo={},ks,k;
  if(!sh.target){
    var civ=SG.Civ.get(s.civ);
    k=(civ.main&&rg()<0.6)?civ.main:['food','stone','metal','energy'][Math.floor(rg()*4)];
    cargo[k]=Math.round(cap*(0.7+0.3*rg())*(civ.main===k?t.mainBonus:1));
  }else{
    var r=SG.AI.byId(s,sh.target);
    if(!r||r.state==='gone'){cargo={};}
    else{
      var D=SG.War.defPower(s,at),ratio=SG.AI.power(s,r,at)/Math.max(1,D);
      var risk=SG.K.clamp(t.ship.riskBase+0.1*(ratio-0.5),t.ship.riskBase,t.ship.riskMax);
      if(rg()<risk){
        sh.state='lost';sh.t1=at+t.ship.rebuildH*H;sh.cargo=null;sh.target=null;
        SG.PS.log(s,at,'ship','Lojistik gemi yolda kayboldu; '+t.ship.rebuildH+' sa içinde yeniden yapılır.');
        SG.Ev.pop(s,{kind:'gemi',t:at,shipId:sh.id,result:'kayip',gained:{},lost:{},shipLost:true,rebuildAt:sh.t1,rival:SG.AI.info(r)});
        return;
      }
      var st=SG.AI.stock(s,r,at)*t.ship.raidFrac*(r.state==='dying'?t.ship.dyingBonus:1)*SG.K.mul(s,'loot');
      var all=['food','stone','metal','energy','know'],n=2,per=cap/n,i;
      for(i=0;i<n;i++){k=all.splice(Math.floor(rg()*all.length),1)[0];cargo[k]=Math.floor(Math.min(per,st));}
    }
  }
  sh.state='back';sh.cargo=cargo;
};
/* dönüş: kargo depoya, kapasiteyi aşan kısım kaybolur */
Log.onReturn=function(s,sh){
  var at=sh.t1;
  if(sh.state==='lost'){sh.state='idle';sh.cargo=null;SG.PS.log(s,at,'ship','Lojistik gemi yeniden hazır.');return;}
  var gl=SG.War.addLoot(s,sh.cargo||{}),r=sh.target?SG.AI.byId(s,sh.target):null;
  var wasTarget=sh.target;
  sh.state='idle';sh.cargo=null;sh.target=null;
  var txt=Object.keys(gl.got).length?SG.War.resText(gl.got):'boş';
  SG.PS.log(s,at,'ship','Lojistik gemi döndü: '+txt+'.'+(Object.keys(gl.lost).length?' (Depo dolu: '+SG.War.resText(gl.lost)+' kayboldu)':''));
  s.stats.trips=(s.stats.trips||0)+1;
  SG.Ev.pop(s,{kind:'gemi',t:at,shipId:sh.id,result:'dondu',gained:gl.got,lost:gl.lost,shipLost:false,target:wasTarget});
};
Log.list=function(s){return s.fleet.map(function(f){return {id:f.id,state:f.state,t0:f.t0,mid:f.mid,t1:f.t1,target:f.target,progress:f.state==='idle'?0:Math.max(0,Math.min(1,(s.at-f.t0)/Math.max(1,f.t1-f.t0)))};});};
})();
