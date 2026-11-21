// SpacEgg v2.4 - Grafik 2: izometrik kita ikonlari, gemiler, rakip kureler
// SG.Iso.icon, SG.Iso.ship, SG.Iso.rivalPlanet (+ SG.Iso.civPal, SG.Iso.iconColor)
(function(){
'use strict';
var SG=window.SG||(window.SG={});var Iso=SG.Iso||(SG.Iso={});
var OL='#171428',LW=3.4,TAU=Math.PI*2;

// ---------- renk yardimcilari
var _hx={};
function rgb(h){var r=_hx[h];if(!r){r=_hx[h]=[parseInt(h.substr(1,2),16),parseInt(h.substr(3,2),16),parseInt(h.substr(5,2),16)];}return r;}
function hx2(n){n=Math.max(0,Math.min(255,Math.round(n)));return (n<16?'0':'')+n.toString(16);}
var _mx={};
function mix(a,b,t){var k=a+b+t,r=_mx[k];if(r)return r;var A=rgb(a),B=rgb(b);r=_mx[k]='#'+hx2(A[0]+(B[0]-A[0])*t)+hx2(A[1]+(B[1]-A[1])*t)+hx2(A[2]+(B[2]-A[2])*t);return r;}
function rgba(h,a){var c=rgb(h);return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';}

// ---------- medeniyet paleti: d koyu, p ana, a vurgu, l ek, atm atmosfer
var CIV={
 kulhan:{d:'#1A1210',p:'#E8452C',a:'#FF9A3C',l:'#5C2A1E',atm:'#8A2F1B'},
 kirkbicak:{d:'#2B2410',p:'#C9A227',a:'#8DB600',l:'#E8DCA0',atm:'#C9A94A'},
 lumeren:{d:'#0B1F3A',p:'#3DDCFF',a:'#A5F2D0',l:'#F4FBFF',atm:'#2E8FA8'},
 tuzdalga:{d:'#06314D',p:'#1FA9C9',a:'#F0E3B2',l:'#E5F6FF',atm:'#1B6E99'},
 cinar:{d:'#14301C',p:'#4FAE5E',a:'#D9B26A',l:'#EAF7E1',atm:'#2F7A47'},
 ruzgarguder:{d:'#1E2A44',p:'#F2C14E',a:'#E8E4D0',l:'#7FB8E3',atm:'#D9A441'},
 buzag:{d:'#0E2230',p:'#8FD3E8',a:'#F2FAFF',l:'#3D6A8C',atm:'#9FD4E6'},
 kulluspor:{d:'#1A1F10',p:'#7FA32A',a:'#C4E04A',l:'#5B3A5E',atm:'#8C9A3A'},
 karaoz:{d:'#05050A',p:'#3B1E6B',a:'#B13BFF',l:'#0F0F1E',atm:'#241447'},
 sesdokur:{d:'#2A1B4D',p:'#FF5CA8',a:'#5CE1E6',l:'#FFF3A8',atm:'#8E4DB5'},
 ruyag:{d:'#0B2B30',p:'#2EC4B6',a:'#B388FF',l:'#E8FFF8',atm:'#3A8E9C'},
 ipekci:{d:'#3A1F2B',p:'#F2A65A',a:'#E8D5B5',l:'#C94F7C',atm:'#D98A5F'}
};
var CIVDEF={d:'#1c2438',p:'#6f8fb8',a:'#e8c46a',l:'#dfe8f5',atm:'#5b7fb0'};
Iso.civPal=function(id){return CIV[id]||CIVDEF;};

// ---------- kaynak/ikon vurgu renkleri (balon, arayuz icin)
var IC={food:'#f2c14e',stone:'#b9ab9a',metal:'#9db0cf',energy:'#38d6ff',know:'#b99cff',credit:'#f6c445',
 build:'#e8a860',upgrade:'#4fdc7e',attack:'#ef6a5a',scout:'#3fb8e8',ship:'#e8eef8',shield:'#5aa0f0',clock:'#e8c46a',alert:'#ffb020',
 plus:'#3fcf78',check:'#3fcf78',cross:'#ef4f4f',menu:'#e9f0fb',planet:'#3b8fe0',city:'#a8bde0',fleet:'#a8c4ee',war:'#ff7a2e',diplomacy:'#e8d29a',collect:'#5fe08a'};
Iso.iconColor=function(n){return IC[n]||'#e8eef8';};

// ---------- cizim yardimcilari (64x64 tasarim uzayi, merkez 0,0)
var _p={};
function P(d){var p=_p[d];if(!p)p=_p[d]=new Path2D(d);return p;}
function pts(a){var s='M'+a[0]+' '+a[1];for(var i=2;i<a.length;i+=2)s+='L'+a[i]+' '+a[i+1];return s+'Z';}
// govde: dolgu, golge kirpma, ince koyu dis hat
function body(g,d,fill,shade){var p=P(d);g.fillStyle=fill;g.fill(p);if(shade){g.save();g.clip(p);shade();g.restore();}g.lineWidth=LW;g.strokeStyle=OL;g.lineJoin='round';g.lineCap='round';g.stroke(p);}
function fd(g,d,c){g.fillStyle=c;g.fill(P(d));}
function sd(g,d,c,w){g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';g.stroke(P(d));}
function circ(g,x,y,r,fill,stroke){g.beginPath();g.arc(x,y,r,0,TAU);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.lineWidth=LW;g.strokeStyle=OL;g.stroke();}}
function ell(g,x,y,rx,ry,rot,fill,stroke){g.beginPath();g.ellipse(x,y,rx,ry,rot||0,0,TAU);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.lineWidth=LW;g.strokeStyle=OL;g.stroke();}}
function rr(x,y,w,h,r){var s='M'+(x+r)+' '+y+'H'+(x+w-r)+'Q'+(x+w)+' '+y+' '+(x+w)+' '+(y+r)+'V'+(y+h-r)+'Q'+(x+w)+' '+(y+h)+' '+(x+w-r)+' '+(y+h)+'H'+(x+r)+'Q'+x+' '+(y+h)+' '+x+' '+(y+h-r)+'V'+(y+r)+'Q'+x+' '+y+' '+(x+r)+' '+y+'Z';return s;}
function star4(g,x,y,r,c){g.fillStyle=c;g.beginPath();g.moveTo(x,y-r);g.quadraticCurveTo(x,y,x+r,y);g.quadraticCurveTo(x,y,x,y+r);g.quadraticCurveTo(x,y,x-r,y);g.quadraticCurveTo(x,y,x,y-r);g.fill();}
function leftHalf(g,c,a){g.fillStyle=c;g.globalAlpha=a==null?1:a;g.fillRect(-40,-40,40,80);g.globalAlpha=1;}

// ---------- ikonlar
var ic={};
function grain(g,x,y,rot,c1,c2){g.save();g.translate(x,y);g.rotate(rot);
 ell(g,0,0,5.4,9.6,0,c1,true);
 g.save();g.beginPath();g.ellipse(0,0,5.4,9.6,0,0,TAU);g.clip();ell(g,2.8,1,4,9,0,c2);g.restore();
 ell(g,-1.6,-3,1.4,3.6,0,'rgba(255,255,255,.55)');
 g.lineWidth=2.8;g.strokeStyle=OL;g.beginPath();g.ellipse(0,0,5.4,9.6,0,0,TAU);g.stroke();g.restore();}
ic.food=function(g){
 body(g,'M0 30C-9 30 -17 25 -19 15C-10 16 -3 22 0 30Z','#52c05f',function(){fd(g,'M0 30L-2 14L-19 14Z','#33964a');});
 body(g,'M0 30C9 30 17 25 19 15C10 16 3 22 0 30Z','#52c05f',function(){fd(g,'M0 30L2 14L19 14Z','#33964a');});
 g.lineCap='round';g.strokeStyle=OL;g.lineWidth=7;g.beginPath();g.moveTo(0,30);g.lineTo(0,-6);g.stroke();
 g.strokeStyle='#7dd070';g.lineWidth=3.2;g.stroke();
 var c1='#f6c944',c2='#d38f1f';
 grain(g,-8.5,8,-.45,c1,c2);grain(g,8.5,8,.45,c1,c2);
 grain(g,-8.5,-8,-.45,c1,c2);grain(g,8.5,-8,.45,c1,c2);
 grain(g,0,-22,0,c1,c2);
};
ic.stone=function(g){
 var d=pts([-27,12,-24,-8,-10,-24,10,-22,25,-7,28,13,15,24,-14,24]);
 body(g,d,'#a99c8c',function(){
  fd(g,pts([-24,-8,-10,-24,10,-22,0,-6,-14,2,-27,12]),'#d1c6b6');
  fd(g,pts([0,-6,10,-22,25,-7,28,13,15,24,4,24,8,6]),'#75695c');
  g.strokeStyle='rgba(30,22,16,.4)';g.lineWidth=2;g.lineCap='round';g.beginPath();g.moveTo(0,-6);g.lineTo(-14,2);g.moveTo(0,-6);g.lineTo(8,6);g.lineTo(4,24);g.stroke();
 });
 fd(g,pts([-8,-18,2,-20,-2,-13,-9,-12]),'rgba(255,255,255,.55)');
};
function ingot(g,dx,dy,top,front,side){
 g.save();g.translate(dx,dy);
 body(g,pts([-26,8,-12,-1,24,-1,10,8,10,8,-26,8]),top);
 body(g,pts([-26,8,10,8,10,22,-26,22]),front,function(){fd(g,pts([-26,8,10,8,10,12,-26,12]),'rgba(255,255,255,.35)');});
 body(g,pts([10,8,24,-1,24,13,10,22]),side);
 g.restore();}
ic.metal=function(g){
 ingot(g,-2,4,'#e6eefb','#98abcc','#5c6d90');
 ingot(g,4,-14,'#f0f5ff','#a9bbd9','#667799');
 star4(g,-18,-18,7,'#fff');star4(g,22,-26,4,'#cfeaff');
};
ic.energy=function(g,o){
 var d=pts([9,-31,-15,4,-3,4,-9,31,17,-7,4,-7,15,-31]);
 body(g,d,'#27c7f2',function(){leftHalf(g,'#8aeeff',.9);
  g.save();g.translate(1,0);g.scale(.52,.62);fd(g,d,'rgba(255,255,255,.95)');g.restore();});
};
ic.know=function(g){
 body(g,'M-31 -8L-31 25Q-15 17 0 27Q15 17 31 25L31 -8Z','#6a45c9',function(){fd(g,'M-31 10L31 10L31 30L-31 30Z','rgba(20,10,60,.3)');});
 body(g,'M-27 -14Q-14 -20 0 -10L0 22Q-14 13 -27 18Z','#f1e8ff',function(){fd(g,'M-27 8L0 12L0 22Q-14 13 -27 18Z','#cdbdf5');});
 body(g,'M27 -14Q14 -20 0 -10L0 22Q14 13 27 18Z','#e2d6fb',function(){fd(g,'M27 8L0 12L0 22Q14 13 27 18Z','#b8a5ee');});
 g.strokeStyle='#8a6fd6';g.lineWidth=2.4;g.lineCap='round';g.beginPath();
 g.moveTo(-21,-6);g.quadraticCurveTo(-13,-9,-6,-3);g.moveTo(-21,1);g.quadraticCurveTo(-13,-2,-6,4);g.moveTo(-21,8);g.quadraticCurveTo(-13,5,-6,11);
 g.moveTo(21,-6);g.quadraticCurveTo(13,-9,6,-3);g.moveTo(21,1);g.quadraticCurveTo(13,-2,6,4);g.moveTo(21,8);g.quadraticCurveTo(13,5,6,11);g.stroke();
 star4(g,0,-24,9,'#ffd75a');
 g.fillStyle=OL;g.globalAlpha=.0;g.globalAlpha=1;
};
ic.credit=function(g){
 circ(g,0,0,29,'#d79a1f',true);
 circ(g,0,0,23,'#f7c849');
 g.save();g.beginPath();g.arc(0,0,23,0,TAU);g.clip();g.fillStyle='rgba(255,255,255,.4)';g.beginPath();g.ellipse(-8,-12,22,12,-.7,0,TAU);g.fill();
 g.fillStyle='rgba(150,90,10,.35)';g.beginPath();g.arc(8,10,24,0,TAU);g.arc(0,0,23,0,TAU,true);g.fill('evenodd');g.restore();
 g.lineWidth=2;g.strokeStyle='#b97b14';g.beginPath();g.arc(0,0,23,0,TAU);g.stroke();
 g.strokeStyle='#8f5a0c';g.lineWidth=5.2;g.lineCap='round';g.lineJoin='round';
 g.beginPath();g.moveTo(-7,-12);g.lineTo(-7,12);g.moveTo(-7,1);g.lineTo(8,-12);g.moveTo(-3,-3);g.lineTo(9,12);g.stroke();
 g.lineWidth=LW;g.strokeStyle=OL;g.beginPath();g.arc(0,0,29,0,TAU);g.stroke();
};
ic.build=function(g){
 g.save();g.rotate(.72);
 body(g,rr(-4.5,-6,9,36,3),'#b5793a',function(){fd(g,'M-5 -6H0V30H-5Z','#d19a58');fd(g,'M0 -6H5V30H0Z','rgba(60,30,10,.35)');});
 body(g,rr(-17,-26,34,18,4),'#c9d3e4',function(){fd(g,'M-17 -26H17V-19H-17Z','#eef3fb');fd(g,'M-17 -13H17V-8H-17Z','#8393b0');});
 body(g,rr(-9,-26,9,18,2),'#8393b0');
 g.restore();
 star4(g,22,-22,6,'#fff3b0');
};
ic.upgrade=function(g){
 var d=pts([0,-30,23,-4,10,-4,10,10,-10,10,-10,-4,-23,-4]);
 body(g,d,'#3fcf6e',function(){leftHalf(g,'#8cf0aa',.85);fd(g,'M-40 4H40V12H-40Z','rgba(0,60,20,.22)');});
 body(g,rr(-17,17,34,9,4.5),'#e8c46a',function(){fd(g,'M-20 17H20V21H-20Z','rgba(255,255,255,.45)');});
};
function sword(g,rot){g.save();g.rotate(rot);
 body(g,pts([0,-33,6,-26,6,10,-6,10,-6,-26]),'#dfe7f3',function(){fd(g,'M0 -33H8V12H0Z','#9fb0c9');});
 g.strokeStyle='rgba(60,70,100,.6)';g.lineWidth=1.8;g.beginPath();g.moveTo(0,-24);g.lineTo(0,6);g.stroke();
 body(g,rr(-14,9,28,6,3),'#ef6a4a',function(){fd(g,'M-14 9H14V12H-14Z','rgba(255,255,255,.4)');});
 body(g,rr(-3,15,6,12,2),'#8a5a2e');
 circ(g,0,29,4,'#e8b43a',true);
 g.restore();}
ic.attack=function(g){sword(g,-.78);sword(g,.78);circ(g,0,-2,0.01);star4(g,0,-4,7,'#fff0b0');};
ic.scout=function(g){
 var d='M-31 0Q0 -27 31 0Q0 27 -31 0Z';
 body(g,d,'#f4f8ff',function(){fd(g,'M-40 6Q0 30 40 6V30H-40Z','rgba(110,140,190,.35)');});
 circ(g,0,0,13,'#35b6ea',true);
 circ(g,0,0,13,null);
 g.save();g.beginPath();g.arc(0,0,13,0,TAU);g.clip();fd(g,'M-14 2H14V14H-14Z','#1f86c0');g.restore();
 circ(g,0,0,6,'#0e1a38');circ(g,-4,-4,2.8,'#fff');
};
ic.ship=function(g){
 g.save();g.rotate(.62);
 body(g,'M0 -33C13 -21 15 -3 11 15L-11 15C-15 -3 -13 -21 0 -33Z','#eef3fb',function(){fd(g,'M0 -40H20V20H0Z','#b4c2da');fd(g,'M-20 -40H-9V20H-20Z','rgba(255,255,255,.7)');fd(g,'M-20 -33H20V-20H-20Z','#ee5a42');});
 body(g,'M-11 3L-24 22L-11 17Z','#ee5a42');body(g,'M11 3L24 22L11 17Z','#c9402c');
 circ(g,0,-7,5.4,'#4ec3f0',true);
 body(g,'M-8 15L8 15L5 20L-5 20Z','#5c6d90');
 body(g,'M-6 20Q0 40 6 20Z','#ffb43a');
 g.restore();
};
ic.shield=function(g){
 var d='M0 -31L24 -23L24 2C24 16 12 26 0 32C-12 26 -24 16 -24 2L-24 -23Z';
 body(g,d,'#3a82e4',function(){leftHalf(g,'#74b6ff',.9);fd(g,'M-30 10H30V40H-30Z','rgba(10,30,100,.25)');});
 g.save();g.scale(.66,.66);g.translate(0,1);sd(g,d,'#f2cf6a',6.5);g.restore();
 star4(g,0,0,11,'#fff0b0');
};
ic.clock=function(g){
 g.save();g.translate(0,3);g.scale(.9,.9);
 body(g,rr(-5,-36,10,8,3),'#e8c46a');
 circ(g,0,2,28,'#e8c46a',true);
 circ(g,0,2,21.5,'#fbf6e6');
 g.save();g.beginPath();g.arc(0,2,21.5,0,TAU);g.clip();fd(g,'M-30 14H30V34H-30Z','rgba(170,140,90,.25)');g.restore();
 g.strokeStyle='#8a6a2e';g.lineWidth=2.6;g.lineCap='round';
 for(var i=0;i<4;i++){var a=i*Math.PI/2;g.beginPath();g.moveTo(Math.cos(a)*16,2+Math.sin(a)*16);g.lineTo(Math.cos(a)*19.5,2+Math.sin(a)*19.5);g.stroke();}
 g.strokeStyle='#1e2a52';g.lineWidth=4.2;g.beginPath();g.moveTo(0,2);g.lineTo(0,-12);g.stroke();
 g.lineWidth=3.6;g.beginPath();g.moveTo(0,2);g.lineTo(10,8);g.stroke();
 circ(g,0,2,3.4,'#ef5a42');
 g.restore();
};
ic.alert=function(g){
 var d='M0 -29L30 24L-30 24Z';
 g.lineJoin='round';
 body(g,d,'#ffb01f',function(){leftHalf(g,'#ffd763',.85);fd(g,'M-40 14H40V40H-40Z','rgba(150,60,0,.22)');});
 g.save();g.lineJoin='round';g.lineWidth=LW+1.6;g.strokeStyle=OL;g.stroke(P(d));g.restore();
 body(g,rr(-3.6,-10,7.2,20,3.6),'#2b1a14');circ(g,0,17,4,'#2b1a14');
};
function disc(g,fill,hi){circ(g,0,0,28,fill,true);
 g.save();g.beginPath();g.arc(0,0,28,0,TAU);g.clip();g.fillStyle=hi;g.beginPath();g.ellipse(-6,-14,26,14,-.5,0,TAU);g.fill();g.fillStyle='rgba(0,0,0,.18)';g.fillRect(-30,12,60,20);g.restore();
 g.lineWidth=LW;g.strokeStyle=OL;g.beginPath();g.arc(0,0,28,0,TAU);g.stroke();}
function wline(g,w){g.strokeStyle='#fff';g.lineWidth=w;g.lineCap='round';g.lineJoin='round';}
ic.plus=function(g){disc(g,'#33c46c','rgba(255,255,255,.3)');wline(g,8);g.beginPath();g.moveTo(-12,0);g.lineTo(12,0);g.moveTo(0,-12);g.lineTo(0,12);g.stroke();};
ic.check=function(g){disc(g,'#33c46c','rgba(255,255,255,.3)');wline(g,8);g.beginPath();g.moveTo(-12,1);g.lineTo(-3,11);g.lineTo(13,-10);g.stroke();};
ic.cross=function(g){disc(g,'#ea4848','rgba(255,255,255,.3)');wline(g,8);g.beginPath();g.moveTo(-11,-11);g.lineTo(11,11);g.moveTo(11,-11);g.lineTo(-11,11);g.stroke();};
ic.menu=function(g){
 var ys=[-22,-4,14];for(var i=0;i<3;i++)body(g,rr(-25,ys[i],50,10,5),'#eaf1fc',function(){fd(g,'M-30 -30H30V0H-30Z','rgba(255,255,255,.0)');});
};
ic.planet=function(g){
 g.save();g.rotate(-.42);
 g.beginPath();g.ellipse(0,0,32,9.5,0,Math.PI,TAU);g.lineWidth=LW+4.4;g.strokeStyle=OL;g.lineCap='butt';g.stroke();
 g.lineWidth=4;g.strokeStyle='#e8c46a';g.stroke();g.restore();
 circ(g,0,0,20,'#3d8fe2',true);
 g.save();g.beginPath();g.arc(0,0,20,0,TAU);g.clip();
 fd(g,'M-14 -12C-6 -18 4 -10 0 -3C-4 2 -12 0 -16 -4Z','#5ccf7a');fd(g,'M4 8C10 2 18 8 14 15C10 19 4 15 4 8Z','#5ccf7a');
 g.fillStyle='rgba(255,255,255,.28)';g.beginPath();g.ellipse(-8,-9,13,8,-.6,0,TAU);g.fill();
 g.fillStyle='rgba(10,20,80,.32)';g.beginPath();g.arc(9,9,22,0,TAU);g.arc(0,0,20,0,TAU,true);g.fill('evenodd');g.restore();
 circ(g,0,0,20,null,true);
 g.save();g.rotate(-.42);
 g.beginPath();g.ellipse(0,0,32,9.5,0,0,Math.PI);g.lineWidth=LW+4.4;g.strokeStyle=OL;g.stroke();g.lineWidth=4;g.strokeStyle='#f3d584';g.stroke();g.restore();
};
ic.city=function(g){
 body(g,rr(-28,-2,16,26,2),'#7e98c4',function(){fd(g,'M-20 -4H-10V26H-20Z','rgba(10,20,60,.25)');});
 body(g,rr(-10,-24,20,48,2),'#adc1e4',function(){fd(g,'M0 -26H12V26H0Z','rgba(10,20,60,.22)');});
 body(g,rr(10,-12,18,36,2),'#7e98c4',function(){fd(g,'M19 -14H30V26H19Z','rgba(10,20,60,.25)');});
 g.strokeStyle=OL;g.lineWidth=2.6;g.lineCap='round';g.beginPath();g.moveTo(0,-24);g.lineTo(0,-31);g.stroke();circ(g,0,-31,2,'#ff6a4a');
 g.fillStyle='#ffd76a';
 for(var r=0;r<4;r++){g.fillRect(-6,-18+r*10,4,5);g.fillRect(2,-18+r*10,4,5);}
 for(var r2=0;r2<2;r2++)g.fillRect(-23,4+r2*10,4,5);
 for(var r3=0;r3<3;r3++)g.fillRect(14,-6+r3*10,4,5);
};
function mship(g,x,y,s,c1,c2){g.save();g.translate(x,y);g.scale(s,s);
 body(g,'M0 -15L11 12L0 6L-11 12Z',c1,function(){fd(g,'M0 -15L11 12L0 6Z',c2);});
 circ(g,0,9,2.4,'#5ee6ff');g.restore();}
ic.fleet=function(g){mship(g,-17,12,1.15,'#c9d8f0','#7d93b8');mship(g,17,12,1.15,'#c9d8f0','#7d93b8');mship(g,0,-8,1.45,'#eef3fb','#8ea3c6');};
ic.war=function(g){
 var a=[],i,r;for(i=0;i<14;i++){r=i%2?15:31;a.push(Math.cos(i*Math.PI/7-1.57)*r,Math.sin(i*Math.PI/7-1.57)*r);}
 body(g,pts(a),'#ff6a24',function(){fd(g,'M-40 -40H0V40H-40Z','rgba(255,200,80,.35)');});
 var b=[];for(i=0;i<14;i++){r=i%2?8:19;b.push(Math.cos(i*Math.PI/7-1.57)*r,Math.sin(i*Math.PI/7-1.57)*r);}
 fd(g,pts(b),'#ffc93a');circ(g,0,0,6.5,'#fff6cf');
};
ic.diplomacy=function(g){
 body(g,rr(-17,-19,34,40,3),'#f3e4b8',function(){fd(g,'M0 -20H18V22H0Z','rgba(150,110,40,.18)');});
 g.strokeStyle='#b4954f';g.lineWidth=2.6;g.lineCap='round';g.beginPath();
 g.moveTo(-10,-9);g.lineTo(10,-9);g.moveTo(-10,-2);g.lineTo(10,-2);g.moveTo(-10,5);g.lineTo(2,5);g.stroke();
 body(g,rr(-23,-27,46,11,5.5),'#dcb96c',function(){fd(g,'M-23 -27H23V-23H-23Z','rgba(255,255,255,.4)');});
 body(g,rr(-23,17,46,11,5.5),'#c79f4e');
 circ(g,9,12,6.4,'#e24a3c',true);star4(g,9,12,3.4,'#ffd0c0');
};
ic.collect=function(g){
 body(g,pts([-29,6,-23,26,23,26,29,6]),'#c58a3a',function(){fd(g,'M-30 6H30V12H-30Z','#e2ac5a');fd(g,'M-30 18H30V30H-30Z','rgba(60,30,10,.28)');});
 body(g,pts([0,19,-17,-1,-7,-1,-7,-26,7,-26,7,-1,17,-1]),'#4fdc82',function(){leftHalf(g,'#9af2b8',.9);});
};
Iso.iconNames=Object.keys(ic);

// icerik: SG.Iso.icon(ctx,name,x,y,size,o)  x,y merkez; o:{alpha,glow:'#renk',dim,rot}
Iso.icon=function(c,name,x,y,size,o){
 var f=ic[name];if(!f)return;o=o||{};
 var s=size/64;c.save();c.translate(x,y);
 if(o.rot)c.rotate(o.rot);
 c.scale(s,s);
 if(o.glow){c.save();c.globalCompositeOperation='lighter';var gr=c.createRadialGradient(0,0,6,0,0,44);gr.addColorStop(0,rgba(typeof o.glow==='string'?o.glow:(IC[name]||'#ffffff'),.5));gr.addColorStop(1,rgba('#000000',0));c.fillStyle=gr;c.fillRect(-46,-46,92,92);c.restore();}
 c.globalAlpha=(o.alpha==null?1:o.alpha)*(o.dim?0.45:1);
 c.lineJoin='round';c.lineCap='round';
 f(c,o);
 c.restore();
};

// ======================================================= GEMILER
// SG.Iso.ship(ctx,kind,civId,x,y,ang,t,o) o:{flame:0..1|true, scale, trail:false, shadow:false}
var HULL={
 logi:'M25 0L19 -7L-16 -9L-22 -7L-23 -4L-23 4L-22 7L-16 9L19 7Z',
 war:'M30 0L12 -4L-8 -6L-19 -4L-21 0L-19 4L-8 6L12 4Z',
 scout:'M27 0L4 -3L-14 -3.4L-18 -1.6L-18 1.6L-14 3.4L4 3Z'
};
function shipPal(id){var q=Iso.civPal(id);var base=mix(q.p,'#e8eef8',.42);
 return {base:base,hi:mix(base,'#ffffff',.55),sh:mix(base,q.d,.5),dk:mix(q.d,'#000000',.3),p:q.p,a:q.a,gl:q.a};}
function flameDraw(c,x,len,wd,t,k){
 var f=Math.sin(t*38+k)*.18+Math.sin(t*23+k*2)*.12+1;
 var L=len*f;
 c.save();c.globalCompositeOperation='lighter';
 c.fillStyle='rgba(255,110,30,.55)';c.beginPath();c.moveTo(x,-wd);c.quadraticCurveTo(x-L*.6,-wd*.9,x-L,0);c.quadraticCurveTo(x-L*.6,wd*.9,x,wd);c.fill();
 c.fillStyle='rgba(255,200,70,.8)';c.beginPath();c.moveTo(x,-wd*.62);c.quadraticCurveTo(x-L*.45,-wd*.5,x-L*.68,0);c.quadraticCurveTo(x-L*.45,wd*.5,x,wd*.62);c.fill();
 c.fillStyle='rgba(255,255,230,.95)';c.beginPath();c.moveTo(x,-wd*.3);c.lineTo(x-L*.32,0);c.lineTo(x,wd*.3);c.fill();
 c.restore();}
function shipBody(c,kind,pal,o){
 var hull=P(HULL[kind]);
 c.lineJoin='round';c.lineCap='round';
 if(kind==='logi'){
  // arka motor blogu
  c.fillStyle=pal.dk;c.fillRect(-27,-7,5,14);
  c.fillStyle=pal.sh;c.fill(hull);
  c.fillStyle=pal.base;c.save();c.clip(hull);c.fillRect(-30,-12,70,12);c.restore();
  // konteynerler
  var cols=[pal.p,pal.a,pal.p,mix(pal.p,pal.a,.5)];
  for(var i=0;i<4;i++){var bx=-19+i*7.6;c.fillStyle=cols[i];c.fillRect(bx,-6.5,6.6,13);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(bx,-6.5,6.6,3.6);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(bx,3.4,6.6,3.1);c.strokeStyle='rgba(10,10,30,.55)';c.lineWidth=.8;c.strokeRect(bx,-6.5,6.6,13);}
  // kabin
  c.fillStyle=pal.hi;c.beginPath();c.moveTo(21,0);c.lineTo(15,-5);c.lineTo(12,-5);c.lineTo(12,5);c.lineTo(15,5);c.closePath();c.fill();
  c.fillStyle='#53d0ff';c.beginPath();c.moveTo(19,0);c.lineTo(16,-3.2);c.lineTo(14,-3.2);c.lineTo(14,3.2);c.lineTo(16,3.2);c.closePath();c.fill();
  c.lineWidth=1.6;c.strokeStyle=OL;c.stroke(hull);
 }else if(kind==='war'){
  var wing='M8 -3L-9 -19L-17 -19L-12 -3Z',wing2='M8 3L-9 19L-17 19L-12 3Z';
  c.fillStyle=pal.sh;c.fill(P(wing));c.fill(P(wing2));
  c.fillStyle=pal.p;c.fillRect(-18,-21,6,4);c.fillRect(-18,17,6,4);
  c.lineWidth=1.6;c.strokeStyle=OL;c.stroke(P(wing));c.stroke(P(wing2));c.strokeRect(-18,-21,6,4);c.strokeRect(-18,17,6,4);
  c.fillStyle=pal.base;c.fill(hull);
  c.save();c.clip(hull);c.fillStyle=pal.hi;c.fillRect(-30,-8,70,6);c.fillStyle=pal.sh;c.fillRect(-30,2,70,8);
  c.fillStyle=pal.p;c.fillRect(-14,-1.6,34,3.2);c.fillStyle=pal.dk;c.beginPath();c.moveTo(30,0);c.lineTo(21,-2.2);c.lineTo(21,2.2);c.fill();c.restore();
  c.fillStyle='#53d0ff';c.beginPath();c.ellipse(5,0,6,2.6,0,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.ellipse(4,-1,3,.9,0,0,TAU);c.fill();
  c.lineWidth=1.6;c.strokeStyle=OL;c.stroke(hull);
  c.fillStyle=pal.dk;c.fillRect(-24,-4.6,4,3.4);c.fillRect(-24,1.2,4,3.4);
 }else{
  var dw='M3 -2L-9 -11L-14 -11L-11 -2Z',dw2='M3 2L-9 11L-14 11L-11 2Z';
  c.fillStyle=pal.sh;c.fill(P(dw));c.fill(P(dw2));c.lineWidth=1.5;c.strokeStyle=OL;c.stroke(P(dw));c.stroke(P(dw2));
  c.fillStyle=pal.hi;c.fill(hull);
  c.save();c.clip(hull);c.fillStyle=pal.sh;c.fillRect(-30,.4,70,6);c.fillStyle=pal.p;c.fillRect(-16,-.9,18,1.8);c.restore();
  c.fillStyle='#53d0ff';c.beginPath();c.ellipse(7,0,4.2,1.7,0,0,TAU);c.fill();
  c.lineWidth=1.5;c.strokeStyle=OL;c.stroke(hull);
  c.fillStyle=pal.a;c.fillRect(-14,-9.6,2.4,2);c.fillRect(-14,7.6,2.4,2);
 }
}
var _sp={};
Iso.ship=function(c,kind,civId,x,y,ang,t,o){
 if(!HULL[kind])kind='logi';o=o||{};t=t||0;
 var s=(o.scale==null?1:o.scale)*(o.size?o.size/44:1);
 var pal=_sp[civId]||(_sp[civId]=shipPal(civId));
 var fl=o.flame===true?1:(+o.flame||0);
 var ca=Math.cos(ang||0),sa=Math.sin(ang||0);
 var tailX=kind==='logi'?-27:kind==='war'?-21:-18;
 // iz
 if(o.trail!==false&&fl>0){
  var tl=(kind==='scout'?70:kind==='war'?56:46)*s*fl,sx=x+ca*tailX*s,sy=y+sa*tailX*s,ex=sx-ca*tl,ey=sy-sa*tl;
  var gr=c.createLinearGradient(sx,sy,ex,ey);gr.addColorStop(0,rgba(pal.gl,.55));gr.addColorStop(1,rgba(pal.gl,0));
  c.save();c.lineCap='round';c.strokeStyle=gr;c.lineWidth=(kind==='logi'?7:kind==='war'?5:3)*s;c.beginPath();c.moveTo(sx,sy);c.lineTo(ex,ey);c.stroke();
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.4*s;c.globalAlpha=.7;c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+(ex-sx)*.7,sy+(ey-sy)*.7);c.stroke();c.restore();
 }
 // golge
 if(o.shadow!==false){c.save();c.fillStyle='rgba(0,0,20,.22)';c.beginPath();c.ellipse(x+3*s,y+13*s,20*s,5.5*s,0,0,TAU);c.fill();c.restore();}
 c.save();c.translate(x,y);c.rotate(ang||0);c.scale(s,ca<0?-s:s);
 // alt yuz (govde kalinligi)
 c.save();c.translate(0,2.8);c.fillStyle=pal.dk;c.fill(P(HULL[kind]));c.restore();
 if(fl>0){flameDraw(c,tailX+1,(kind==='logi'?14:kind==='war'?17:20)*fl,kind==='logi'?4:kind==='war'?3.2:2.2,t,x*.1+y*.07);}
 shipBody(c,kind,pal,o);
 c.restore();
};

// ======================================================= RAKIP KURELER
// SG.Iso.rivalPlanet(ctx,seed,civId,x,y,r,t,o) o:{dying:0..1,target:true|'#renk',halo:false}
function h3(ix,iy,iz,sd){var h=Math.imul(ix,374761393)+Math.imul(iy,668265263)+Math.imul(iz,1274126177)+Math.imul(sd,144665);h=Math.imul(h^h>>>13,1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function vn(x,y,z,sd){var ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;
 fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);
 var a=h3(ix,iy,iz,sd),b=h3(ix+1,iy,iz,sd),c=h3(ix,iy+1,iz,sd),d=h3(ix+1,iy+1,iz,sd),e=h3(ix,iy,iz+1,sd),f=h3(ix+1,iy,iz+1,sd),g=h3(ix,iy+1,iz+1,sd),h=h3(ix+1,iy+1,iz+1,sd);
 var x1=a+(b-a)*fx,x2=c+(d-c)*fx,x3=e+(f-e)*fx,x4=g+(h-g)*fx,y1=x1+(x2-x1)*fy,y2=x3+(x4-x3)*fy;return y1+(y2-y1)*fz;}
function fbm(x,y,z,sd){return vn(x,y,z,sd)*.5+vn(x*2.1,y*2.1,z*2.1,sd+7)*.28+vn(x*4.3,y*4.3,z*4.3,sd+13)*.15+vn(x*8.7,y*8.7,z*8.7,sd+29)*.07;}
function mk(w,h){var k=document.createElement('canvas');k.width=w;k.height=h;return k;}
var _pl={},_plN=0;
function planetSprite(seed,civId,S){
 var key=seed+'|'+civId+'|'+S,e=_pl[key];if(e)return e;
 if(_plN>40){_pl={};_plN=0;}
 var q=Iso.civPal(civId),rnd=SG.rng?SG.rng(seed*7+11):function(){return .5;};
 var M=Math.round(S*.22),W=S+M*2,R=S/2,C=W/2;
 var sc=1.4+rnd()*1.6,ox=rnd()*50,oy=rnd()*50,oz=rnd()*50,sdn=(seed*31+5)&1023,banded=rnd()<.3,sea=mix(q.d,q.p,.5),sea2=mix(q.d,q.p,.75),land=mix(q.a,q.p,.25),land2=mix(q.a,'#ffffff',.45),cap=mix(q.l,'#ffffff',.6),lvl=.46+rnd()*.12;
 if(civId==='kulhan'||civId==='karaoz'){sea=mix(q.d,q.p,.18);sea2=mix(q.d,q.p,.35);land=mix(q.p,q.a,.4);land2=q.a;}
 var sa=rgb(sea),sb=rgb(sea2),la=rgb(land),lb=rgb(land2),ca=rgb(cap),at=rgb(q.atm);
 var surf=mk(W,W),g=surf.getContext('2d');
 // halo
 var hg=g.createRadialGradient(C,C,R*.92,C,C,R*1.2);hg.addColorStop(0,rgba(q.atm,.55));hg.addColorStop(.5,rgba(q.atm,.16));hg.addColorStop(1,rgba(q.atm,0));g.fillStyle=hg;g.fillRect(0,0,W,W);
 var im=g.getImageData(0,0,W,W),dt=im.data,L=[-.5,-.55,.67],ll=Math.sqrt(L[0]*L[0]+L[1]*L[1]+L[2]*L[2]);L[0]/=ll;L[1]/=ll;L[2]/=ll;
 for(var py=0;py<W;py++)for(var px=0;px<W;px++){
  var dx=(px+.5-C)/R,dy=(py+.5-C)/R,d2=dx*dx+dy*dy;if(d2>1.04)continue;
  var d=Math.sqrt(d2),al=Math.max(0,Math.min(1,(1-d)*R*.9));if(al<=0)continue;
  var dz=Math.sqrt(Math.max(0,1-d2)),nx=dx,ny=dy,nz=dz;
  var u=nx*sc+ox,v=ny*sc+oy,w=nz*sc+oz;
  var hh=fbm(u,v,w,sdn);
  if(banded)hh=hh*.6+Math.sin(ny*7+hh*3)*.2+.2;
  var col0,col1,col2,isLand=hh>lvl;
  if(banded){var bv=.5+.5*Math.sin(ny*10+(fbm(u*.8,v*.8,w*.8,sdn+5)-.5)*7),bk=Math.max(0,Math.min(1,(bv-.5)*2.2+.5)),bm=fbm(u*.6,v*4.5,w*.6,sdn+9);isLand=false;
   var b2=Math.max(0,Math.min(1,bk*.8+(bm-.5)*.6+.1));col0=sb[0]+(la[0]-sb[0])*b2;col1=sb[1]+(la[1]-sb[1])*b2;col2=sb[2]+(la[2]-sb[2])*b2;hh=lvl-.01;}
  else if(isLand){var k=Math.min(1,(hh-lvl)*3.2);col0=la[0]+(lb[0]-la[0])*k;col1=la[1]+(lb[1]-la[1])*k;col2=la[2]+(lb[2]-la[2])*k;}
  else{var k2=Math.max(0,Math.min(1,(lvl-hh)*3));col0=sb[0]+(sa[0]-sb[0])*k2;col1=sb[1]+(sa[1]-sb[1])*k2;col2=sb[2]+(sa[2]-sb[2])*k2;}
  var pole=banded?0:Math.abs(ny)+ (fbm(u*2,v*2,w*2,sdn+3)-.5)*.35;
  if(pole>.86){var kc=Math.min(1,(pole-.86)*9);col0+=(ca[0]-col0)*kc;col1+=(ca[1]-col1)*kc;col2+=(ca[2]-col2)*kc;}
  // kabarti golgesi
  var hh2=fbm(u+L[0]*.12,v+L[1]*.12,w,sdn);var bump=(hh-hh2)*(isLand?5:1.5);
  var df=Math.max(0,nx*L[0]+ny*L[1]+nz*L[2]);var lit=.2+df*.95+bump;
  var rim=Math.pow(1-dz,2.4)*.7;
  var r0=col0*lit,r1=col1*lit,r2=col2*lit;
  r0+=at[0]*rim*(.3+df);r1+=at[1]*rim*(.3+df);r2+=at[2]*rim*(.3+df);
  if(!isLand&&df>.55){var sp=Math.pow(df,12)*70;r0+=sp;r1+=sp;r2+=sp;}
  var i=(py*W+px)*4,a0=dt[i+3]/255;
  dt[i]=r0*al+dt[i]*(1-al);dt[i+1]=r1*al+dt[i+1]*(1-al);dt[i+2]=r2*al+dt[i+2]*(1-al);dt[i+3]=Math.max(dt[i+3],al*255);
 }
 g.putImageData(im,0,0);
 // bulut seridi (genis, surukle)
 var cw=S*2,cl=mk(cw,S),cg=cl.getContext('2d'),ci=cg.getImageData(0,0,cw,S),cd=ci.data;
 for(var yy=0;yy<S;yy++)for(var xx=0;xx<cw;xx++){var an=xx/cw*TAU,rr_=2.2;var n=fbm(Math.cos(an)*rr_+9,yy/S*3.4,Math.sin(an)*rr_+4,sdn+91);var a=Math.max(0,(n-.5)*3.2);if(a>0){var j=(yy*cw+xx)*4;cd[j]=cd[j+1]=cd[j+2]=255;cd[j+3]=Math.min(210,a*210);}}
 cg.putImageData(ci,0,0);
 // golge ve ucurum kaplamasi
 var sh=mk(W,W),sg=sh.getContext('2d');
 var gr=sg.createRadialGradient(C-R*.38,C-R*.42,R*.12,C,C,R);gr.addColorStop(0,'rgba(0,0,20,0)');gr.addColorStop(.55,'rgba(0,0,20,.1)');gr.addColorStop(.85,'rgba(0,0,24,.48)');gr.addColorStop(1,'rgba(0,0,28,.78)');
 sg.fillStyle=gr;sg.beginPath();sg.arc(C,C,R,0,TAU);sg.fill();
 sg.lineWidth=Math.max(1,S/60);sg.strokeStyle='rgba(8,8,24,.75)';sg.beginPath();sg.arc(C,C,R-sg.lineWidth/2,0,TAU);sg.stroke();
 // catlak cizgileri (birim kure uzayi)
 var cr=[],cr0=SG.rng?SG.rng(seed*13+3):function(){return .5;};
 for(var n2=0;n2<8;n2++){var an2=cr0()*TAU,rad=.95,px_=Math.cos(an2)*rad,py_=Math.sin(an2)*rad,dir=an2+Math.PI+(cr0()-.5)*1.1,pl=[[px_,py_]],steps=7;
  for(var s2=0;s2<steps;s2++){dir+=(cr0()-.5)*1.3;var st=.17+cr0()*.1;px_+=Math.cos(dir)*st;py_+=Math.sin(dir)*st;pl.push([px_,py_]);}
  cr.push(pl);}
 e=_pl[key]={surf:surf,cl:cl,sh:sh,W:W,S:S,M:M,cr:cr,q:q,cw:cw};_plN++;return e;
}
Iso.rivalPlanetWarm=function(seed,civId,r){planetSprite(seed|0,civId,Math.max(48,Math.min(192,Math.ceil(r*4/16)*16)));};
Iso.rivalPlanet=function(c,seed,civId,x,y,r,t,o){
 o=o||{};t=t||0;seed=seed|0;
 var S=Math.max(48,Math.min(192,Math.ceil(r*4/16)*16));
 var e=planetSprite(seed,civId,S),k=(r*2)/e.S,W=e.W*k,hw=W/2,rr=r;
 var dy=+o.dying||0;
 c.save();
 if(o.halo!==false)c.drawImage(e.surf,x-hw,y-hw,W,W);else c.drawImage(e.surf,0,0,e.W,e.W,x-hw,y-hw,W,W);
 // bulutlar
 c.save();c.beginPath();c.arc(x,y,rr,0,TAU);c.clip();
 var off=((t*3+seed*13)%e.S)*(1);
 var ch=e.S*k,cwk=e.cw*k,ox=-(off*k)%cwk;
 c.globalAlpha=.55;
 c.drawImage(e.cl,x-rr+ox-0,y-rr,cwk,ch);c.drawImage(e.cl,x-rr+ox+cwk,y-rr,cwk,ch);
 c.globalAlpha=1;
 if(dy>0){c.fillStyle='rgba(60,6,0,'+(dy*.42)+')';c.fillRect(x-rr,y-rr,rr*2,rr*2);}
 c.restore();
 c.drawImage(e.sh,x-hw,y-hw,W,W);
 // catlaklar
 if(dy>0){
  var pulse=.65+.35*Math.sin(t*5+seed),n=e.cr.length,vis=dy*n;
  c.save();c.beginPath();c.arc(x,y,rr*.99,0,TAU);c.clip();
  c.lineCap='round';c.lineJoin='round';
  for(var pass=0;pass<2;pass++){
   if(pass===1)c.globalCompositeOperation='lighter';
   for(var i=0;i<n;i++){var f=Math.max(0,Math.min(1,vis-i));if(f<=0)continue;var pl=e.cr[i],m=Math.max(1,Math.round(f*(pl.length-1)));
    c.beginPath();for(var j=0;j<=m;j++){var px=x+pl[j][0]*rr,py=y+pl[j][1]*rr;if(j===0)c.moveTo(px,py);else c.lineTo(px,py);}
    if(pass===0){c.strokeStyle='rgba(10,0,0,.85)';c.lineWidth=Math.max(1.4,rr*.085);}
    else{c.strokeStyle='rgba(255,'+(110+80*pulse|0)+',40,'+(.55+.4*pulse)+')';c.lineWidth=Math.max(.8,rr*.04);}
    c.stroke();}
  }
  c.restore();
  if(dy>.35){c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(255,90,40,'+(dy*.35*(.6+.4*Math.sin(t*5+seed)))+')';c.lineWidth=Math.max(1.5,rr*.07);c.beginPath();c.arc(x,y,rr*1.02,0,TAU);c.stroke();c.restore();}
 }
 // hedef halkasi
 if(o.target){
  var tc=typeof o.target==='string'?o.target:'#ff6a4a',R2=rr*1.34,pp=.75+.25*Math.sin(t*4);
  c.lineWidth=Math.max(1.2,Math.min(3,rr*.05));c.strokeStyle=rgba(tc,.9*pp);c.lineCap='butt';
  c.setLineDash([Math.max(4,rr*.26),Math.max(3,rr*.2)]);c.lineDashOffset=-t*rr*.9;c.beginPath();c.arc(x,y,R2,0,TAU);c.stroke();c.setLineDash([]);
  c.strokeStyle=rgba(tc,pp);c.lineWidth=Math.max(1.6,Math.min(4,rr*.07));c.lineCap='round';
  for(var q4=0;q4<4;q4++){var a0=q4*Math.PI/2+Math.PI/4+t*.5;c.beginPath();c.arc(x,y,R2+rr*.12,a0-.16,a0+.16);c.stroke();}
  var ln=Math.min(9,rr*.2);c.lineWidth=Math.max(1.2,Math.min(3,rr*.05));c.beginPath();
  c.moveTo(x-R2-ln*.4,y);c.lineTo(x-R2+ln,y);c.moveTo(x+R2+ln*.4,y);c.lineTo(x+R2-ln,y);c.moveTo(x,y-R2-ln*.4);c.lineTo(x,y-R2+ln);c.moveTo(x,y+R2+ln*.4);c.lineTo(x,y+R2-ln);c.stroke();
 }
 c.restore();
};
})();
