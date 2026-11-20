/* SpacEgg v1.0 — çekirdek */
(function(){
'use strict';
var SG=window.SG={ver:'2.0.0',D:{},A:{},E:{},W:{},G:{},UI:{},test:null};
var mem={};
SG.log={list:[],err:function(where,e){var m=where+': '+(e&&e.message?e.message:e);SG.log.list.push(m);if(SG.log.list.length>200)SG.log.list.shift();try{console.error('[SG]',m);}catch(_){}} };
window.addEventListener('error',function(ev){SG.log.err('window',ev.error||ev.message);});
window.addEventListener('unhandledrejection',function(ev){SG.log.err('promise',ev.reason);});
try{var vj=document.getElementById('d-ver');var vo=vj?JSON.parse(vj.textContent):null;if(vo&&vo.version){SG.ver=vo.version;SG.verCode=vo.code;SG.codename=vo.codename;}}catch(e){}
SG.RM=false;
try{var mq=window.matchMedia('(prefers-reduced-motion: reduce)');SG.RM=!!mq.matches;mq.addEventListener&&mq.addEventListener('change',function(e){SG.RM=!!e.matches;});}catch(e){}
SG.clamp=function(v,a,b){return v<a?a:v>b?b:v;};
SG.lerp=function(a,b,t){return a+(b-a)*t;};
SG.hash=function(s){s=String(s);var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;};
SG.rng=function(seed){var a=(typeof seed==='number'?seed:SG.hash(seed))>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
SG.pick=function(arr,r){r=r||Math.random;return arr[Math.floor(r()*arr.length)];};
var uidN=0;SG.uid=function(){uidN++;return Date.now().toString(36)+uidN.toString(36)+Math.floor(Math.random()*1e6).toString(36);};
SG.$=function(sel,root){return(root||document).querySelector(sel);};
SG.$$=function(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));};
SG.h=function(tag,attrs){
  var el=document.createElement(tag);
  if(attrs){for(var k in attrs){if(!Object.prototype.hasOwnProperty.call(attrs,k))continue;var v=attrs[k];if(v==null||v===false)continue;
    if(k==='class')el.className=v;else if(k==='text')el.textContent=v;
    else if(k==='style'&&typeof v==='object'){for(var s in v)el.style.setProperty(s.indexOf('-')>=0||s.indexOf('--')===0?s:s.replace(/[A-Z]/g,function(m){return'-'+m.toLowerCase();}),v[s]);}
    else if(k.slice(0,2)==='on'&&typeof v==='function')el.addEventListener(k.slice(2).toLowerCase(),v);
    else el.setAttribute(k,v===true?'':v);}}
  for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c)){c.forEach(function(x){if(x!=null&&x!==false)el.appendChild(x.nodeType?x:document.createTextNode(String(x)));});}else el.appendChild(c.nodeType?c:document.createTextNode(String(c)));}
  return el;
};
SG.fmt={
  int:function(n){n=Math.round(n);return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.');},
  num:function(n){var a=Math.abs(n);if(a<1000)return String(Math.round(n*10)/10).replace('.',',');
    if(a<1e6)return(Math.round(n/100)/10+'').replace('.',',')+' bin';
    if(a<1e9)return(Math.round(n/1e5)/10+'').replace('.',',')+' milyon';
    if(a<1e12)return(Math.round(n/1e8)/10+'').replace('.',',')+' milyar';
    return(Math.round(n/1e11)/10+'').replace('.',',')+' trilyon';},
  dur:function(s){s=Math.max(0,Math.round(s));var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),x=s%60;
    if(d)return d+' g '+h+' sa';if(h)return h+' sa '+m+' dk';if(m)return m+' dk '+(x?x+' sn':'');return x+' sn';},
  ago:function(ms){return SG.fmt.dur(ms/1000)+' önce';}
};
SG.store={
  _p:'sg1_',
  get:function(k,d){try{var v=localStorage.getItem(SG.store._p+k);if(v==null)return k in mem?mem[k]:d;return JSON.parse(v);}catch(e){return k in mem?mem[k]:d;}},
  set:function(k,v){mem[k]=v;try{localStorage.setItem(SG.store._p+k,JSON.stringify(v));return true;}catch(e){return false;}},
  del:function(k){delete mem[k];try{localStorage.removeItem(SG.store._p+k);}catch(e){}}
};
var L={};
SG.bus={
  on:function(ev,fn){(L[ev]=L[ev]||[]).push(fn);return function(){SG.bus.off(ev,fn);};},
  off:function(ev,fn){var a=L[ev];if(!a)return;var i=a.indexOf(fn);if(i>=0)a.splice(i,1);},
  once:function(ev,fn){var off=SG.bus.on(ev,function(d){off();fn(d);});return off;},
  emit:function(ev,d){var a=L[ev];if(!a)return;a.slice().forEach(function(f){try{f(d);}catch(e){SG.log.err('bus:'+ev,e);}});}
};
var tasks={},order=[],last=0,running=false,T0=0;
function frame(ts){
  if(!running)return;
  if(document.hidden){last=0;requestAnimationFrame(frame);return;}
  if(!last)last=ts;var dt=Math.min(0.1,(ts-last)/1000);last=ts;if(dt<=0){requestAnimationFrame(frame);return;}
  if(!T0)T0=ts;var t=(ts-T0)/1000;
  for(var i=0;i<order.length;i++){var f=tasks[order[i]];if(f){try{f(dt,t);}catch(e){SG.log.err('loop:'+order[i],e);}}}
  requestAnimationFrame(frame);
}
SG.loop={
  add:function(name,fn){if(!tasks[name])order.push(name);tasks[name]=fn;if(!running){running=true;last=0;requestAnimationFrame(frame);}},
  remove:function(name){delete tasks[name];var i=order.indexOf(name);if(i>=0)order.splice(i,1);}
};
SG.now=function(){return Date.now();};
var views={},cur=null,curName='',ROUTES=['login','hub','egg','world','galaxy','shop','missions','story','settings','create','cosmos','journal','saves','prefs'];
SG.view=function(name,def){views[name]=def;};
SG.routes=ROUTES;
SG.current=function(){return curName;};
function render(name,params){
  if(ROUTES.indexOf(name)<0)name='login';
  var root=document.getElementById('app');
  if(cur&&cur.unmount){try{cur.unmount();}catch(e){SG.log.err('unmount',e);}}
  root.textContent='';curName=name;cur=views[name]||null;
  root.setAttribute('data-view',name);
  if(cur&&cur.mount){try{cur.mount(root,params||{});}catch(e){SG.log.err('mount:'+name,e);}}
  SG.bus.emit('view',{name:name,params:params});
}
SG.go=function(name,params){
  SG._params=params||{};
  var h='#/'+name;
  if(location.hash===h){render(name,SG._params);return;}
  location.hash=h;
};
window.addEventListener('hashchange',function(){
  var m=/^#\/([a-z]+)/.exec(location.hash);var n=m?m[1]:'login';
  var u0=null;try{u0=SG.G&&SG.G.user&&SG.G.user();}catch(e){}
  if(!u0&&n!=='login'){history.replaceState(null,'','#/login');n='login';}
  if(n===curName&&!SG._params)return;
  var p=SG._params;SG._params=null;render(n,p);
});
SG.start=function(){
  var m=/^#\/([a-z]+)/.exec(location.hash);var n=m?m[1]:'login';
  var guard=SG.guard?SG.guard(n):n;
  if(guard!==n){history.replaceState(null,'','#/'+guard);n=guard;}
  render(n,{});
};
})();
