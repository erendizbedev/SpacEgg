/* sanal oyuncu: gerçek eylem API'sini kullanır (replay ve denge testleri) */
'use strict';
var H=3600000;
/* profile: {pBuild, train:true, shield:true, join:true, rescue:true} */
exports.act=function(SG,s,now,prof,rg){
  if(s.dead)return;
  SG.PS.open(s,now);
  var T=SG.TUNE,pop=SG.Ev.drain(s),i,r;
  pop.forEach(function(p){
    if(p.kind==='kaybet'&&prof.rescue){SG.PS.rescue(s,now);}
    if(p.kind==='yoklama'&&prof.join){
      if(p.phase==='teklif'&&p.canJoin&&rg()<prof.join)SG.PS.decide(s,p.pendId,'join',now);
      else if(p.phase==='hazir')SG.PS.decide(s,p.pendId,'confirm',now);
    }
  });
  if(s.dead)return;
  /* yapı: önce yükseltmeler, sonra yeni bina */
  if(prof.build){
    var order=['quarry','farm','house','barracks','depot','mine','hall','wall','power','lab','port'];
    var lvs=SG.Bld.list(s),done=0;
    order.forEach(function(type){
      if(done>=2)return;
      var has=lvs.filter(function(x){return x.type===type;});
      if(has.length){
        has.sort(function(a,b){return a.lv-b.lv;});
        var r=SG.PS.upgrade(s,has[0].slot,now);if(r.ok)done++;
      }
      if(!has.length||has.length<T.bld[type].max&&rg()<0.3){
        var free=-1;for(var k=0;k<T.slots;k++)if(!SG.Bld.get(s,k)){free=k;break;}
        if(free>=0&&type!=='hall'){var r2=SG.PS.build(s,free,type,now);if(r2.ok)done++;}
      }
    });
  }
  if(prof.train&&s.res.food>200&&s.res.stone>80){
    var cap=SG.Bld.troopCap(s)-SG.Bld.troopCount(s,true);
    ['cannon','archer','spear','sentinel'].forEach(function(u){
      if(cap<=0)return;
      var n=Math.min(cap,10);
      for(;n>=1;n--){var rr=SG.PS.train(s,u,n,now);if(rr.ok){cap-=n;break;}}
    });
  }
  if(prof.shield){
    SG.PS.nextEvents(s,24*H).forEach(function(e){
      if(e.kind==='att'&&e.m==='yok'&&e.t-now<=6*H)SG.PS.maneuver(s,e.id,'kalkan',now);
    });
  }
  if(prof.ship&&SG.Bld.lv(s,'port')>0&&rg()<0.7)SG.PS.sendShip(s,null,now);
  if(prof.attack&&rg()<prof.attack){
    var alive=s.rivals.filter(function(x){return x.state==='alive';});
    if(alive.length){var tg=alive[Math.floor(rg()*alive.length)];SG.PS.attack(s,tg.id,'duz',now);}
  }
  if(prof.collect){s.bld.forEach(function(b){if(b.lv>0)SG.PS.collect(s,b.slot,now);});}
  if(prof.scout&&rg()<0.3){var a2=s.rivals[Math.floor(rg()*s.rivals.length)];SG.PS.scout(s,a2.id,now);}
  SG.Notify.sync(s);
};
exports.PROF={
  passive:{},
  normal:{build:1,train:1,join:0.5,rescue:1,ship:1,collect:1},
  active:{build:1,train:1,join:0.8,rescue:1,shield:1,ship:1,collect:1,attack:0.3,scout:1}
};
