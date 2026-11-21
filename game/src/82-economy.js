/* SpacEgg v3 — ekonomi (SG.Eco): üretim, tüketim, depo, parçalı doğrusal entegrasyon */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var EPS=1e-6,H=3600000;
function T(){return SG.TUNE;}
function zero(){var o={};T().res.forEach(function(k){o[k]=0;});return o;}
var Eco=SG.Eco={
  EPS:EPS,
  pop:function(s){
    var p=T().pop,n=p.base,i,b;
    for(i=0;i<s.bld.length;i++){b=s.bld[i];if(b.lv<=0)continue;if(b.type==='hall')n+=p.hall*b.lv;else if(b.type==='house')n+=p.house*b.lv;}
    return n;
  },
  cap:function(s){
    var t=T(),c=t.capBase,i,b,d=0;
    for(i=0;i<s.bld.length;i++){b=s.bld[i];if(b.lv<=0)continue;if(b.type==='hall')c+=t.capHall*b.lv;else if(b.type==='depot')d+=t.capDepot[b.lv]||0;}
    return Math.round(c+d*SG.K.mul(s,'depot'));
  },
  capH:function(s){return T().offlineCapH*SG.K.mul(s,'offlineCap');},
  /* üretimin durduğu an: son görülme + çevrimdışı tavan */
  capEnd:function(s){return s.seen+Eco.capH(s)*H;},
  /* brüt saatlik üretim (t anında; hasarlı yapı üretmez) */
  gross:function(s,t){
    var t0=T(),out=zero(),civ=SG.Civ.get(s.civ),mul=civ.mul||{},i,b,def,k,v;
    for(i=0;i<s.bld.length;i++){
      b=s.bld[i];if(b.lv<=0||b.dmgUntil>t)continue;
      def=t0.bld[b.type];if(!def)continue;
      for(k in def.prod){
        v=def.prod[k]*t0.lvMul[b.lv];
        if(typeof mul[k]==='number')v*=mul[k];
        if(civ.main===k)v*=t0.mainBonus;
        out[k]+=v;
      }
    }
    return out;
  },
  cons:function(s){return Eco.pop(s)*T().foodPerPop;},
  starving:function(s,t){
    if(s.res.food>EPS)return false;
    return Eco.gross(s,t).food-Eco.cons(s)<0;
  },
  /* net saatlik oran (arayüz: SG.Eco.rates(s)); tavan sonrası "uyku" sıfır */
  rates:function(s,t){
    if(t==null)t=s.at;
    if(t>=Eco.capEnd(s))return zero();
    var g=Eco.gross(s,t),c=Eco.cons(s),k,out=zero();
    if(s.res.food<=EPS&&g.food-c<0){var m=T().starveMul;for(k in g)out[k]=g[k]*m;out.food=0;return out;}
    for(k in g)out[k]=g[k];
    out.food=g.food-c;
    return out;
  },
  uyku:function(s){return s.at>=Eco.capEnd(s);},
  integrate:function(s,a,b){
    if(b<=a)return;
    var r=Eco.rates(s,a),cap=Eco.cap(s),dt=(b-a)/H,ks=T().res,i,k,v,lim;
    for(i=0;i<ks.length;i++){
      k=ks[i];v=s.res[k]+r[k]*dt;
      if(r[k]>0){lim=Math.max(cap,s.res[k]);if(v>lim)v=lim;}
      if(v<0)v=0;
      s.res[k]=v;
    }
  },
  /* sıradaki açlık anı (gıda biter) ve depo dolma anı; r = rates(s,s.at) */
  nextStarve:function(s,r){
    if(s.res.food>EPS&&r.food<0)return s.at+Math.max(1,Math.ceil(s.res.food/(-r.food)*H));
    return null;
  },
  nextFull:function(s,r){
    var cap=Eco.cap(s),ks=T().res,best=null,i,k,t;
    for(i=0;i<ks.length;i++){
      k=ks[i];
      if(r[k]>0&&!s.full[k]&&s.res[k]<cap-1e-9){
        t=s.at+Math.max(1,Math.ceil((cap-s.res[k])/r[k]*H));
        if(!best||t<best.t)best={t:t,k:k};
      }
    }
    return best;
  },
  /* arayüz/bildirim: şimdiki oranlarla her kaynağın dolma anı (ms) ya da null */
  fullAt:function(s){
    var r=Eco.rates(s),cap=Eco.cap(s),o={},ks=T().res,k;
    for(var i=0;i<ks.length;i++){k=ks[i];o[k]=(r[k]>0&&s.res[k]<cap)?s.at+Math.ceil((cap-s.res[k])/r[k]*H):null;}
    return o;
  }
};
})();
