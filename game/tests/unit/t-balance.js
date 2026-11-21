'use strict';
var h=require('./harness.js'),bot=require('./bot.js'),assert=require('assert');
var DAY=86400000,T0=1700000000000;
function sim(kind,i,SG){
  var prof=bot.PROF[kind],per={passive:0.4,normal:3,active:8}[kind];
  var seed='bal#'+kind+'#'+i,rg=SG.rng(seed+'#sess');
  var s=SG.PS.create('b'+i,T0,{seed:seed}),times=[],d,k;
  for(d=0;d<30;d++){
    var n=per<1?(rg()<per?1:0):Math.round(per);
    for(k=0;k<n;k++)times.push(T0+d*DAY+Math.floor(rg()*DAY));
  }
  times.sort(function(a,b){return a-b;});
  var brg=SG.rng(seed+'#bot'),ever=false;
  for(k=0;k<times.length&&!s.dead;k++){
    bot.act(SG,s,times[k],prof,brg);
    if(s.dying||s.war.streak>=3)ever=true;
  }
  if(!s.dead)SG.PS.resolve(s,T0+30*DAY);
  if(s.dead||s.war.streak>=3)ever=true;
  return {dead:!!s.dead,ever:ever||(s.stats.defeats||0)>=3&&!!s.dying,defeats:s.stats.defeats||0,wins:s.stats.wins||0,hall:SG.Bld.hallLv(s),life:s.dead?(s.dead.at-T0)/DAY:30};
}
exports.tests={
  '1000 sanal oyuncu denge özeti (ezilme oranı)':function(){
    var SG=h.load(),N={passive:200,normal:600,active:200},out={},t0=Date.now();
    Object.keys(N).forEach(function(kind){
      var r={n:N[kind],dead:0,ever:0,def:0,win:0,hall:0,life:0};
      for(var i=0;i<N[kind];i++){
        SG.Clock.fake(T0);
        var x=sim(kind,i,SG);
        r.dead+=x.dead?1:0;r.ever+=x.ever?1:0;r.def+=x.defeats;r.win+=x.wins;r.hall+=x.hall;r.life+=x.life;
      }
      out[kind]=r;
    });
    console.log('       tür      oyuncu  yok oluş  ezilme(geri sayım)  yenilgi/oy  zafer/oy  ort.Merkez  ort.ömür(gün)');
    var all={n:0,dead:0,ever:0};
    Object.keys(out).forEach(function(k){
      var r=out[k];all.n+=r.n;all.dead+=r.dead;all.ever+=r.ever;
      console.log('       '+(k+'          ').slice(0,9)+(r.n+'     ').slice(0,8)+(Math.round(r.dead/r.n*1000)/10+'%      ').slice(0,10)+(Math.round(r.ever/r.n*1000)/10+'%                  ').slice(0,20)+(Math.round(r.def/r.n*10)/10+'          ').slice(0,12)+(Math.round(r.win/r.n*10)/10+'         ').slice(0,10)+(Math.round(r.hall/r.n*10)/10+'          ').slice(0,12)+Math.round(r.life/r.n*10)/10);
    });
    console.log('       toplam ezilme oranı (geri sayıma girenler): '+Math.round(all.ever/all.n*1000)/10+'%, yok olanlar: '+Math.round(all.dead/all.n*1000)/10+'%  ['+(Date.now()-t0)+' ms]');
    assert.ok(out.normal.ever/out.normal.n<=0.15,'normal oyuncu ezilme oranı %15 üstü: '+out.normal.ever/out.normal.n);
    assert.ok(out.active.ever/out.active.n<=0.05,'etkin oyuncu ezilme oranı %5 üstü');
    assert.ok(out.passive.ever/out.passive.n>out.normal.ever/out.normal.n,'ihmal eden ezilmeli');
    assert.ok(out.normal.hall/out.normal.n>=2,'normal oyuncu ilerlemeli');
  }
};
