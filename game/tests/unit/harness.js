/* node vm yükleyici: DOM yok, SG taslağı; 80-89 ada göre sırayla */
'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm');
var SRC=path.join(__dirname,'..','..','src');
exports.files=fs.readdirSync(SRC).filter(function(f){return /^8\d-.*\.js$/.test(f);}).sort();
exports.load=function(opts){
  opts=opts||{};
  var ctx={console:console,Math:Math,JSON:JSON,Date:opts.date||Date};
  ctx.window=ctx;ctx.SG={};
  if(opts.storage)ctx.localStorage=opts.storage;
  if(opts.native)ctx.SGNative=opts.native;
  vm.createContext(ctx);
  exports.files.forEach(function(f){vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});});
  return ctx.SG;
};
exports.memStorage=function(){var d={};return {getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null;},setItem:function(k,v){d[k]=String(v);},removeItem:function(k){delete d[k];},key:function(i){return Object.keys(d)[i]||null;},get length(){return Object.keys(d).length;},_d:d};};
