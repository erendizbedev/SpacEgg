#!/usr/bin/env python3
"""SG.A2 doğrulama (headless Chrome + playwright). Kullanım: python3 -I out/a2-verify.py"""
import os,sys,time,json
from playwright.sync_api import sync_playwright
root=os.path.dirname(os.path.abspath(__file__))
res=[];fail=[]
def chk(n,ok,info=''):
    res.append((n,ok,info));
    if not ok: fail.append(n)
    print(('OK  ' if ok else 'FAIL'),n,info)
with sync_playwright() as p:
    br=p.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--autoplay-policy=no-user-gesture-required','--no-sandbox'])
    for page_name in('a2-test.html','a2-test-shared.html'):
        pg=br.new_page();errs=[]
        pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file://'+os.path.join(root,page_name));pg.wait_for_timeout(300)
        pg.mouse.click(10,10)  # kullanıcı dokunuşu
        pg.evaluate("SG.A.unlock();SG.A2.start()");pg.wait_for_timeout(1800)
        pg.evaluate("SG.A2._tap()");pg.wait_for_timeout(3500)
        st=pg.evaluate("SG.A2.state()");r=pg.evaluate("rms()")
        tag=page_name.replace('.html','')
        chk(tag+': kuruldu',st['built'] and st['ctx']=='running',json.dumps(st))
        chk(tag+': mod',st['shared']==(page_name.endswith('shared.html')),'shared=%s'%st['shared'])
        chk(tag+': ortam sesi var (rms>0.0003)',r>0.0003,'rms=%.5f'%r)
        for s in('galaxy','system','planet','universe'):
            pg.evaluate("SG.A2.setScale('%s')"%s);pg.wait_for_timeout(2200)
            r=pg.evaluate("rms()");chk(tag+': ölçek '+s,r>0.0003,'rms=%.5f'%r)
        rs=[]
        for ix in(0,1,4):
            pg.evaluate("SG.A2.setSpeed(%d)"%ix);pg.wait_for_timeout(2500);rs.append(pg.evaluate("rms()"))
        chk(tag+': hız 0/1/4 sessizleşmez',min(rs)>0.0001,'rms=%s'%['%.5f'%x for x in rs])
        pg.evaluate("SG.A2.setSpeed(1);SG.A2.setScale('system')")
        evs=['supernova','nova','comet','nebula','stellar-birth','star-dies','habitable-shift','collision','unlock']
        ok=[]
        for e in evs:
            ok.append(pg.evaluate("SG.A2.event('%s',2)"%e));pg.wait_for_timeout(1300)
        chk(tag+': olaylar çalıştı',sum(1 for x in ok if x)>=8,str(ok))
        chk(tag+': bilinmeyen olay false',pg.evaluate("SG.A2.event('yok')")==False)
        chk(tag+': ui sesleri',all(pg.evaluate("SG.A2.ui('%s')"%k) is not None for k in('tap','open','close','unlock','error')))
        # pause/resume
        pg.evaluate("window.dispatchEvent(new Event('sg-pause'))");pg.wait_for_timeout(1700)
        sp=pg.evaluate("SG.A2.state().ctx")
        if page_name=='a2-test.html': chk(tag+': sg-pause -> suspended',sp=='suspended',sp)
        pg.evaluate("window.dispatchEvent(new Event('sg-resume'))");pg.wait_for_timeout(1800)
        chk(tag+': sg-resume -> running',pg.evaluate("SG.A2.state().ctx")=='running',pg.evaluate("SG.A2.state().ctx"))
        if page_name=='a2-test.html':
            pg.evaluate("window.dispatchEvent(new Event('sg-pause'))");pg.wait_for_timeout(7800)
            chk(tag+': takılı pause 6 sn sonra kendiliğinden açılır (yarış yok)',pg.evaluate("SG.A2.state().ctx")=='running',pg.evaluate("SG.A2.state().ctx"))
        # mute/vol
        pg.evaluate("SG.A.mute(true)");pg.wait_for_timeout(2500);rm=pg.evaluate("rms()")
        if page_name=='a2-test.html': chk(tag+': mute sessiz (kendi ana kazancı)',rm<0.005,'rms=%.5f'%rm)
        else: chk(tag+': mute -> SG.A.state().muted (ortak graf: sessize alma SG.A ana kazancında, tap öncesi ölçer)',pg.evaluate("SG.A.state().muted")==True)
        pg.evaluate("SG.A.mute(false)");pg.wait_for_timeout(2500)
        chk(tag+': mute kalkınca geri gelir',pg.evaluate("rms()")>0.0003,'rms=%.5f'%pg.evaluate("rms()"))
        # düşük kademe
        pg.evaluate("SG.P={tier:function(){return 0;}};SG.bus.emit('p:tier',0)");pg.wait_for_timeout(2500)
        st0=pg.evaluate("SG.A2.state()");chk(tag+': tier0 daha az düğüm',st0['built'] and st0['nodes']<st['nodes'],'%s -> %s'%(st['nodes'],st0['nodes']))
        pg.evaluate("SG.A2.stop()");pg.wait_for_timeout(2500)
        chk(tag+': stop',pg.evaluate("SG.A2.state().built")==False)
        chk(tag+': konsol hatası yok',not errs and not pg.evaluate("SG.log.list.length"),str(errs[:3])+str(pg.evaluate("SG.log.list")))
        pg.close()
    # AudioContext yok
    pg=br.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script("window.AudioContext=undefined;window.webkitAudioContext=undefined;")
    pg.goto('file://'+os.path.join(root,'a2-test.html'));pg.mouse.click(5,5)
    out=pg.evaluate("[SG.A2.start(),SG.A2.setScale('planet'),SG.A2.setSpeed(3),SG.A2.event('comet'),SG.A2.ui('tap'),SG.A2.stop(),SG.A2.state().built]")
    pg.wait_for_timeout(1500)
    chk('AudioContext yok: no-op, hata yok',not errs and out[-1]==False,str(out)+str(errs))
    br.close()
print('\nSONUÇ: %d/%d geçti'%(len(res)-len(fail),len(res)))
sys.exit(1 if fail else 0)
