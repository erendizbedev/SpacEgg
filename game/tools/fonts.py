#!/usr/bin/env python3
"""SpacEgg yazı tipi gömücü: npm @fontsource paketlerinden woff2 dosyalarını base64 ile css/05-fonts.css içine yazar.
Kullanım: python3 -I tools/fonts.py   (önce: cd /home/claude/tools && npm i @fontsource/... paketleri; bkz. FAMILIES)
Not: latin ve latin-ext ayrı dosyalardır; ikisi de aynı aileye bağlanır ve unicode-range ile seçilir
(range'siz yazılırsa son bildirim kazanır, ğ ş İ gibi harfler düşerdi)."""
import base64, os, sys
NM = os.environ.get('FONT_NM', '/home/claude/tools/node_modules')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'
# (aile adı, ağırlık, stil, [(paket, dosya-öneki, aralık)])
V = '@fontsource-variable/'
S = '@fontsource/'
FAMILIES = [
 ('SG Logo',    '800',     'normal', [(S+'orbitron/files/orbitron-latin-800-normal.woff2', LATIN)]),   # latin-ext yok: ğşİ Michroma'dan düşer
 ('SG Wide',    '400',     'normal', [(S+'michroma/files/michroma-latin-400-normal.woff2', LATIN), (S+'michroma/files/michroma-latin-ext-400-normal.woff2', EXT)]),
 ('SG Title',   '400 800', 'normal', [(V+'syne/files/syne-latin-wght-normal.woff2', LATIN), (V+'syne/files/syne-latin-ext-wght-normal.woff2', EXT)]),
 ('SG HUD',     '200 800', 'normal', [(V+'oxanium/files/oxanium-latin-wght-normal.woff2', LATIN), (V+'oxanium/files/oxanium-latin-ext-wght-normal.woff2', EXT)]),
 ('SG Journal', '100 900', 'normal', [(V+'fraunces/files/fraunces-latin-wght-normal.woff2', LATIN), (V+'fraunces/files/fraunces-latin-ext-wght-normal.woff2', EXT)]),
 ('SG Journal', '100 900', 'italic', [(V+'fraunces/files/fraunces-latin-wght-italic.woff2', LATIN), (V+'fraunces/files/fraunces-latin-ext-wght-italic.woff2', EXT)]),
 ('SG Menu',    '200 800', 'normal', [(V+'bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2', LATIN), (V+'bricolage-grotesque/files/bricolage-grotesque-latin-ext-wght-normal.woff2', EXT)]),
 ('SG Body',    '300 900', 'normal', [(V+'figtree/files/figtree-latin-wght-normal.woff2', LATIN), (V+'figtree/files/figtree-latin-ext-wght-normal.woff2', EXT)]),
 ('SG Mono',    '500',     'normal', [(S+'jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2', LATIN), (S+'jetbrains-mono/files/jetbrains-mono-latin-ext-500-normal.woff2', EXT)]),
 ('SG Tag',     '600',     'normal', [(S+'chakra-petch/files/chakra-petch-latin-600-normal.woff2', LATIN), (S+'chakra-petch/files/chakra-petch-latin-ext-600-normal.woff2', EXT)]),
]
out = ['/* ÜRETİLDİ: tools/fonts.py — elle düzenleme. Yazı tipleri: Orbitron, Michroma, Syne, Oxanium, Fraunces, Bricolage Grotesque, Figtree, JetBrains Mono, Chakra Petch (SIL OFL 1.1) */']
total = 0
for fam, w, st, files in FAMILIES:
    for rel, rng in files:
        p = os.path.join(NM, rel)
        if not os.path.exists(p):
            sys.exit('YOK: ' + p)
        b = open(p, 'rb').read(); total += len(b)
        out.append("@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}" % (fam, st, w, base64.b64encode(b).decode(), rng))
dst = os.path.join(ROOT, 'css', '05-fonts.css')
open(dst, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('ok', dst, 'woff2 toplam', total, 'bayt (', round(total / 1024), 'KB ), css', os.path.getsize(dst), 'bayt')
