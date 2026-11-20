#!/usr/bin/env python3
"""SpacEgg v1.0 derleyici: src/*.js (ada göre sıralı) + css/*.css + data/*.json -> dist/SpacEgg.html
Kullanım: python3 -I build.py [--min]"""
import glob, json, os, re, subprocess, sys
root = os.path.dirname(os.path.abspath(__file__))
def rd(p): return open(p, encoding='utf-8').read()
tpl = rd(os.path.join(root, 'template.html'))
js = '\n'.join('/* ==== %s ==== */\n%s' % (os.path.basename(p), rd(p)) for p in sorted(glob.glob(os.path.join(root, 'src', '*.js'))))
css = '\n'.join(rd(p) for p in sorted(glob.glob(os.path.join(root, 'css', '*.css'))))
def data(name):
    p = os.path.join(root, 'data', name + '.json')
    if not os.path.exists(p): return 'null'
    obj = json.loads(rd(p))  # geçerli JSON şart
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
if '--min' in sys.argv:
    tools = '/home/claude/tools/node_modules/.bin'
    tmp = os.path.join(root, 'dist', '_t'); os.makedirs(tmp, exist_ok=True)
    open(tmp + '/a.js', 'w', encoding='utf-8').write(js)
    r = subprocess.run([tools + '/terser', tmp + '/a.js', '-c', '-m', '--comments', 'false', '--ecma', '2018', '-o', tmp + '/b.js'], capture_output=True, text=True)
    if r.returncode == 0: js = rd(tmp + '/b.js')
    else: print('terser yok/hata, küçültme atlandı', r.stderr[:200])
    open(tmp + '/a.css', 'w', encoding='utf-8').write(css)
    r = subprocess.run([tools + '/esbuild', tmp + '/a.css', '--minify', '--loader:.css=css'], capture_output=True, text=True)
    if r.returncode == 0: css = r.stdout
out = tpl.replace('/*CSS*/', '', 1).replace('<style>\n\n</style>', '<style>' + css.replace('\\', '\\\\') .replace('\\\\', '\\') + '</style>', 1)
out = out.replace('/*DATA:ver*/', data('version')).replace('/*DATA:disc*/', data('discoveries')).replace('/*DATA:cins*/', data('CINS')).replace('/*DATA:story*/', data('story-main'))
out = out.replace('/*JS*/', js.replace('</script', '<\\/script'), 1)
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
dst = os.path.join(root, 'dist', 'SpacEgg.html')
open(dst, 'w', encoding='utf-8').write(out)
print('ok', dst, len(out.encode('utf-8')), 'bayt')
