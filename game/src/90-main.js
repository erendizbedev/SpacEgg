/* SpacEgg v1.0 — açılış */
(function(){
'use strict';
SG.speed=SG.store.get('speed',1);if(!(SG.speed>0))SG.speed=1;
SG.homeRoute=function(){
  try{var nm=SG.G&&SG.G.name&&SG.G.name();if(SG.S&&SG.S.setUser&&nm){SG.S.setUser(nm);var a=SG.S.active&&SG.S.active();if(!a){var l=SG.S.list&&SG.S.list();if(l&&l.length)a=SG.S.open(l[0].id);}return 'planet';}}catch(e){SG.log.err('homeRoute',e);}
  return'hub';
};
SG.guard=function(n){
  var u=null;try{u=SG.G&&SG.G.user&&SG.G.user();}catch(e){}
  if(!u)return n==='intro'?'intro':'login';
  if(n==='login'||n==='intro')return SG.homeRoute();
  return n;
};
function unlockOnce(){
  try{SG.A&&SG.A.unlock&&SG.A.unlock();}catch(e){}
  try{var v=SG.store.get('vol_master',.8);SG.A&&SG.A.setVol&&(SG.A.setVol('master',v),SG.A.setVol('music',SG.store.get('vol_music',.26)),SG.A.setVol('fx',SG.store.get('vol_fx',.8)));if(SG.store.get('mute',false))SG.A.mute(true);}catch(e){}
  ctxMusic(SG.current());
  ['pointerdown','touchend','keydown','click'].forEach(function(ev){document.removeEventListener(ev,unlockOnce,true);});
}
['pointerdown','touchend','keydown','click'].forEach(function(ev){document.addEventListener(ev,unlockOnce,true);});
var MCTX={intro:'login',login:'login',hub:'hub',egg:'hub',shop:'shop',world:'world',galaxy:'galaxy',missions:'hub',story:'hub',settings:'hub',create:'galaxy',cosmos:'galaxy',planet:'world',journal:'hub',saves:'hub',prefs:'hub'};
function ctxMusic(name){try{if(!SG.A||!SG.A.music)return;SG.A.music.start(MCTX[name]||'hub');var p=SG.G&&SG.G.planet&&SG.G.planet();if(p){SG.A.music.setType&&SG.A.music.setType(p.type);SG.A.music.setEra&&SG.A.music.setEra(Math.min(8,Math.floor(((p.lvl||1)-1)/6)));}}catch(e){}}
function boot(){
  try{if(document.fonts&&document.fonts.load){document.fonts.load('600 13px "SG HUD"');document.fonts.load('700 20px "SG Title"');}}catch(e){}
  if(SG.store.get('rm',false)){SG.RM=true;document.body.classList.add('rm');}
  var bg=document.getElementById('bg');
  if(!bg){bg=document.createElement('canvas');bg.id='bg';document.body.insertBefore(bg,document.body.firstChild);}
  try{if(SG.W&&SG.W.stars){var st=SG.W.stars(bg,{});st.start&&st.start();window.addEventListener('resize',function(){st.resize&&st.resize();});SG._stars=st;}}catch(e){SG.log.err('stars',e);}
  SG.UI.init&&SG.UI.init();
  try{SG.HUD&&SG.HUD.applyPrefs&&SG.HUD.applyPrefs();SG.HUD&&SG.HUD.applyQuality&&SG.HUD.applyQuality();}catch(e){SG.log.err('hud-prefs',e);}
  SG.bus.on('view',function(d){if(SG.A&&SG.A.state)ctxMusic(d.name);});
  try{SG.G&&SG.G.init&&SG.G.init();}catch(e){SG.log.err('G.init',e);}
  SG.loop.add('game',function(dt){try{SG.S&&SG.S.autosave&&SG.S.autosave(dt);}catch(e){SG.log.err('autosave',e);}try{SG.G&&SG.G.tick&&SG.G.tick(dt*(SG.speed||1));}catch(e){SG.log.err('tick',e);}});
  var q=location.search||'';
  if((/[?&]test=1/.test(q)||location.hash==='#test')&&!SG.test){
    SG.test={state:function(){return{user:SG.G.user&&SG.G.user(),planet:SG.G.planet&&SG.G.planet(),view:SG.current(),errors:SG.log.list.slice()};},
      forceLvl:function(){return false;},fastForward:function(sec){SG.G.advance&&SG.G.advance(sec);return true;},pass:function(){return SG.log.list.length===0;},errors:function(){return SG.log.list.slice();}};
  }
  try{if(SG.hasView&&SG.hasView('intro')&&!SG.G.user()&&!/^#\/intro/.test(location.hash))history.replaceState(null,'','#/intro');}catch(e){}
  SG.start();
  window.addEventListener('pagehide',function(){try{SG.G&&SG.G.save&&SG.G.save();}catch(e){}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
