"""Holt die Karten aus dem AP2 Reinprügler (eine HTML-Datei) ins Repository.

Aufruf (einmalig oder wenn der Reinprügler neue Karten bekommt):
    python3 -I tools/extract_ap2.py "~/Desktop/Reinprügler_APP/ap2-reinpruegler-ae.html"

Schreibt data/karten-ap2.json. Damit sich AP1 und AP2 nicht in die Quere kommen, bekommt jede Karte
"ap2-" vor die Kennung, und die Lernfelder 1 bis 6 werden zu den Gesimsen 7 bis 12.
Die Bilder im AP2 Reinprügler sind dieselben wie im AP1 Reinprügler und werden nicht gebraucht.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main(src):
    html = open(os.path.expanduser(src), encoding='utf-8').read()
    m = re.search(r'<script type="application/json" id="cards">(.*?)</script>', html, re.S)
    if not m:
        sys.exit('Keine Karten gefunden (script#cards fehlt)')
    cards = json.loads(m.group(1))
    for c in cards:
        c['i'] = 'ap2-' + c['i']
        c['l'] = c['l'] + 6
    out = os.path.join(ROOT, 'data', 'karten-ap2.json')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('[\n' + ',\n'.join(json.dumps(c, ensure_ascii=False, separators=(',', ':')) for c in cards) + '\n]\n')
    print(f'{len(cards)} Karten nach data/karten-ap2.json')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
