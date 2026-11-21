/* SpacEgg v3 — bildirim (SG.Notify): alarm listesini durumdan üretir; SGNative varsa köprüyü çağırır. Sessiz saat YOK. */
(function(){
'use strict';
var SG=window.SG=window.SG||{};
var H=3600000;
function T(){return SG.TUNE;}
var last={};            // id -> at (köprüye en son bildirilen)
var DEF={build:1,train:1,ship:1,yoklama:1,saldiri:1,yokolus:1,sefer:1};
var N=SG.Notify={
  prefs:DEF,
  /* tür açma/kapama: {build:1,train:1,ship:1,yoklama:1,saldiri:1,yokolus:1,sefer:1} */
  setPrefs:function(p){var o={},k;for(k in DEF)o[k]=(p&&p[k]===0)||(p&&p[k]===false)?0:1;N.prefs=o;return o;},
  native:function(){try{return (typeof SGNative!=='undefined'&&SGNative)?SGNative:null;}catch(e){return null;}},
  /* durumdan alarm listesi: en erken 20, her biri {id,at,kind,tur,title,text} */
  build:function(s){
    var out=[],now=s.at,pr=N.prefs,t=T();
    if(s.dead)return out;
    function add(id,at,tur,title,text){if(at>now&&pr[tur])out.push({id:id,at:at,tur:tur,title:title,text:text});}
    s.q.forEach(function(j){
      if(j.kind==='build'||j.kind==='upgrade')add('q:'+j.id,j.t1,'build','İnşaat tamamlandı','Bir yapı hazır.');
      else if(j.kind==='train')add('q:'+j.id,j.t1,'train','Birlikler hazır','Eğitim tamamlandı.');
      else if(j.kind==='prep')add('q:'+j.id,j.t1,'yoklama','Saldırı hazırlığı bitti','Saldırıyı onaylayabilirsin.');
      else if(j.kind==='march')add('q:'+j.id,j.t1,'sefer','Sefer döndü','Birlikler eve döndü.');
      else if(j.kind==='scout')add('q:'+j.id,j.t1,'sefer','İzci döndü','Keşif raporu hazır.');
    });
    s.fleet.forEach(function(f){
      if(f.state==='out')add('sh:'+f.id+':m',f.mid,'ship','Gemi hedefe vardı','Gemi dönüş yoluna çıkıyor.');
      if(f.state==='out'||f.state==='back')add('sh:'+f.id+':r',f.t1,'ship','Gemi döndü','Lojistik gemi limana indi.');
    });
    s.pend.forEach(function(p){
      if(p.state==='open'||p.state==='prep'||p.state==='ready')add('y:'+p.id,p.joinBy-t.notify.warnJoinMin*60000,'yoklama','Yoklama bitiyor','Katılma süresinin son saati.');
    });
    s.plan.list.forEach(function(e){
      if(e.at-s.at>24*H)return;
      if(e.kind==='att')add('a:'+e.id,e.at-t.warnMin*60000,'saldiri','Saldırı yaklaşıyor','Savunmanı hazırla.');
      else add('p:'+e.id,e.at,'yoklama','Yeni yoklama','Bir rakip saldırı planı ilan etti.');
    });
    if(s.dying){
      add('k:s1',s.dying.killAt-t.notify.warnKillMin*60000,'yokolus','Gezegen yok olmak üzere','Son 1 saat: Kurtarma yap.');
      add('k:s0',s.dying.killAt,'yokolus','Gezegen yok oldu','Yeni yumurta seçebilirsin.');
    }
    s.rivals.forEach(function(r){if(r.state==='dying')add('k:'+r.id,r.killAt,'yokolus','Rakip gezegen yok oluyor','Geri sayım bitti.');});
    out.sort(function(a,b){return a.at-b.at||(a.id<b.id?-1:1);});
    return out.slice(0,t.notify.max);
  },
  /* alarm listesini yeniden üretir; köprü varsa yalnız değişenleri iletir. Köprü yoksa no-op (liste yine döner). */
  sync:function(s){
    var list=N.build(s),nat=N.native(),map={},i,a;
    list.forEach(function(x){map[x.id]=x;});
    var rm=[],ad=[];
    for(var id in last)if(!map[id])rm.push(id);
    list.forEach(function(x){if(last[x.id]!==x.at)ad.push(x);});
    if(nat){
      try{
        rm.forEach(function(id){if(nat.cancel)nat.cancel(id);});
        ad.forEach(function(x){if(nat.schedule)nat.schedule(x.id,x.at,x.title,x.text);});
      }catch(e){try{SG.log&&SG.log.err('Notify',e);}catch(_){}}
    }
    last={};list.forEach(function(x){last[x.id]=x.at;});
    return {alarms:list,scheduled:ad.length,cancelled:rm.length,bridge:!!nat};
  },
  schedule:function(id,at,title,text){var nat=N.native();last[id]=at;if(nat&&nat.schedule){try{nat.schedule(id,at,title,text);}catch(e){}}},
  cancel:function(id){var nat=N.native();delete last[id];if(nat&&nat.cancel){try{nat.cancel(id);}catch(e){}}},
  cancelAll:function(){var nat=N.native();last={};if(nat&&nat.cancelAll){try{nat.cancelAll();}catch(e){}}},
  _last:function(){return last;}
};
})();
