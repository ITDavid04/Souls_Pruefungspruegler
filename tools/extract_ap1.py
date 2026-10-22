"""Holt Karten und Bilder aus dem AP1 Reinprügler (eine HTML-Datei) ins Repository.

Aufruf (einmalig oder wenn der Reinprügler neue Karten bekommt):
    python3 -I tools/extract_ap1.py "~/Desktop/Reinprügler_APP/ap1hölle-final.html"

Schreibt:
    data/karten-ap1.json      alle Karten, eine je Zeile (i, l, t, n, a, d, m, x wie im Reinprügler)
    src/img/<name>.webp       Hintergründe, 1600 px breit
    src/img/<name>-klein.webp Vorschaubilder für die Kreise, 720 px breit
Braucht Pillow mit WebP (python3 -c "from PIL import features; print(features.check('webp'))").
"""
import base64
import io
import json
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(src):
    html = open(os.path.expanduser(src), encoding='utf-8').read()

    m = re.search(r'<script type="application/json" id="cards">(.*?)</script>', html, re.S)
    if not m:
        sys.exit('Keine Karten gefunden (script#cards fehlt)')
    cards = json.loads(m.group(1))
    out = os.path.join(ROOT, 'data', 'karten-ap1.json')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write('[\n' + ',\n'.join(json.dumps(c, ensure_ascii=False, separators=(',', ':')) for c in cards) + '\n]\n')
    print(f'{len(cards)} Karten nach data/karten-ap1.json')

    img_dir = os.path.join(ROOT, 'src', 'img')
    os.makedirs(img_dir, exist_ok=True)
    total = 0
    for name, b64 in re.findall(r'"hoelle/([a-z0-9-]+)\.jpg": "data:image/jpeg;base64,([A-Za-z0-9+/=]+)"', html):
        im = Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB')
        for suffix, width, quality in (('', 1600, 58), ('-klein', 720, 55)):
            copy = im.copy()
            copy.thumbnail((width, width))
            path = os.path.join(img_dir, f'{name}{suffix}.webp')
            copy.save(path, 'WEBP', quality=quality, method=6)
            total += os.path.getsize(path)
    print(f'Bilder nach src/img/, zusammen {total // 1024} KB')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
