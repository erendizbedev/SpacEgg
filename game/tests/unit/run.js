/* node tests/unit/run.js — mantık çekirdeği testleri (DOM yok) */
'use strict';
var fs=require('fs'),path=require('path');
var only=process.argv[2]||'';
var files=fs.readdirSync(__dirname).filter(function(f){return /^t-.*\.js$/.test(f);}).sort();
var pass=0,fail=0,failed=[];
files.forEach(function(f){
  if(only&&f.indexOf(only)<0)return;
  var m=require(path.join(__dirname,f));
  Object.keys(m.tests).forEach(function(name){
    var t0=Date.now();
    try{m.tests[name]();pass++;console.log('  ok   '+f.replace('.js','')+' :: '+name+' ('+(Date.now()-t0)+' ms)');}
    catch(e){fail++;failed.push(f+' :: '+name);console.log('  FAIL '+f+' :: '+name+'\n       '+String(e&&e.stack||e).split('\n').slice(0,4).join('\n       '));}
  });
});
console.log('\n'+pass+' geçti, '+fail+' kaldı');
if(fail){console.log('Kalanlar:\n - '+failed.join('\n - '));process.exit(1);}
