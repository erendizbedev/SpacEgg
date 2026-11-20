/* SpacEgg v1.0 — oyun verisi yükleyici ve doğrulayıcı (veri: #d-cins, #d-story) */
(function(){
'use strict';
var D=SG.D;
function load(id){
  try{var el=document.getElementById(id);if(!el)return null;return JSON.parse(el.textContent);}
  catch(e){SG.log.err('gamedata:'+id,e);return null;}
}
var cins=load('d-cins')||{},story=load('d-story')||[];
D.TYPES=cins.types||{};
D.TYPE_ORDER=['sav','med','loj','yik','yar'];
D.EGGS=cins.eggs||[];
D.PLANETKINDS=cins.planetKinds||{};
D.BADGES=cins.badges||[];
D.MISSIONS_META=cins.missionsMeta||{};
D.STAT_KEYS=cins.statKeys||[];
D.STORY=story;
D.EGG_BY_ID={};D.EGGS.forEach(function(e){D.EGG_BY_ID[e.id]=e;});
D.eggsOf=function(t){return D.EGGS.filter(function(e){return e.type===t;});};
D.type=function(id){return D.TYPES[id];};
D.egg=function(id){return D.EGG_BY_ID[id];};
D.level=function(t,n){var tp=D.TYPES[t];return tp?tp.levels[SG.clamp(n,1,tp.levels.length)-1]:null;};
D.rank=function(t,lvl){var tp=D.TYPES[t],r=null;if(!tp)return null;tp.ranks.forEach(function(x){if(lvl>=x.lvl)r=x;});return r;};
D.shopItem=function(t,id){var tp=D.TYPES[t];if(!tp)return null;for(var i=0;i<tp.shop.length;i++)if(tp.shop[i].id===id)return tp.shop[i];return null;};
D.action=function(t,id){var tp=D.TYPES[t];if(!tp)return null;for(var i=0;i<tp.actions.length;i++)if(tp.actions[i].id===id)return tp.actions[i];return null;};
D.chapter=function(id){for(var i=0;i<D.STORY.length;i++)if(D.STORY[i].id===id)return D.STORY[i];return null;};
// doğrulama
(function validate(){
  function bad(m){SG.log.err('gamedata',m);}
  if(D.TYPE_ORDER.some(function(t){return !D.TYPES[t];}))bad('eksik tip');
  if(D.EGGS.length!==40)bad('yumurta sayısı '+D.EGGS.length);
  D.TYPE_ORDER.forEach(function(t){
    var tp=D.TYPES[t];if(!tp)return;
    if(!tp.levels||tp.levels.length!==50)bad(t+' seviye sayısı');
    ['actions','shop','missions','events','res','ranks'].forEach(function(k){if(!tp[k]||!tp[k].length)bad(t+' '+k+' boş');});
    if(D.eggsOf(t).length!==8)bad(t+' yumurta sayısı');
    var ids={};tp.res.forEach(function(r){ids[r.id]=1;});
    tp.actions.forEach(function(a){Object.keys(a.cost||{}).forEach(function(k){if(!ids[k])bad(t+' eylem maliyeti '+a.id+':'+k);});});
  });
  D.EGGS.forEach(function(e){if(!D.TYPES[e.type])bad('yumurta tipi '+e.id);if(!e.palette||e.palette.length!==3)bad('palet '+e.id);e.planetKinds.forEach(function(k){if(!D.PLANETKINDS[k])bad('tür '+k);});});
  if(D.STORY.length!==15)bad('hikaye bölüm sayısı');
  // ikon doğrulama (SG.E yüklüyse)
  if(SG.E&&SG.E.ICONS){var miss={};
    (function walk(o){if(o&&typeof o==='object'){for(var k in o){if(k==='icon'&&typeof o[k]==='string'){if(!(SG.E.has?SG.E.has(o[k]):SG.E.ICONS[o[k]]))miss[o[k]]=1;}else walk(o[k]);}}})(cins);
    var m=Object.keys(miss);if(m.length)bad('eksik ikon: '+m.join(','));}
})();
})();
