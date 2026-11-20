#!/bin/sh
# Kullanım: tests/run-selftest.sh  (out/save-selftest.html üretir ve headless Chrome'da çalıştırır)
cd "$(dirname "$0")/.." || exit 1
python3 -I - <<'PY'
core=open('src/00-core.js',encoding='utf-8').read();save=open('src/07-save.js',encoding='utf-8').read();t=open('tests/save-selftest.src.js',encoding='utf-8').read()
h='<!DOCTYPE html><meta charset="utf-8"><title>SG.S selftest</title><body><div id="app"></div><script>window.__E=[];window.addEventListener("error",function(e){window.__E.push(e.message+" @"+e.lineno);document.title="HATA "+e.message+" @"+e.lineno;var p=document.createElement("pre");p.id="out";p.textContent="HATA "+e.message+" satir "+e.lineno+" "+(window.__D||"");document.body.appendChild(p);});</script><script>\n'+core+'\n</script><script>\n'+save+'\n</script><script>\n'+t+'\n</script>'
open('out/save-selftest.html','w',encoding='utf-8').write(h)
PY
timeout 90 google-chrome --headless=new --no-sandbox --disable-gpu --virtual-time-budget=8000 --dump-dom "file://$PWD/out/save-selftest.html" 2>/dev/null | python3 -I -c "
import sys,re,html
d=sys.stdin.read()
t=re.search(r'<title>(.*?)</title>',d);print(t.group(1) if t else 'başlık yok')
m=re.search(r'<pre id=\"out\">(.*?)</pre>',d,re.S)
if not m: print(d[:300]); sys.exit(1)
L=html.unescape(m.group(1)).split('\n')
print('\n'.join(l for l in L if not l.startswith('PASS')))
"
