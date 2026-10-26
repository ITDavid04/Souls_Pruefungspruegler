"""Holt die Kürzel aus der Abkürzungsjagd (eine HTML-Datei) ins Repository, für die Katakomben der Kürzel.

Aufruf (einmalig oder wenn die Abkürzungsjagd neue Kürzel bekommt):
    python3 -I tools/extract_kuerzel.py "~/Desktop/Reinprügler_APP/Abkürzungsjagd.html"

Schreibt data/kuerzel.json. Jede Zeile ist eine Karte im selben Lernkasten wie die übrigen:
    i     Kennung, "k-" und das Kürzel in Kleinbuchstaben (k-dns, k-i-v)
    l     13, die Katakomben
    t     Kategorie (Netzwerk, Hardware, ...)
    n     das Kürzel selbst
    lang  die Langform
    d     was dahintersteckt
    r     Seltenheit: 1 gewöhnlich, 2 selten, 3 legendär
    j     absichtlich falsche Spaß-Langform (nur bei manchen)
Gedankenstriche in der Vorlage (Rivest–Shamir–Adleman) werden zu Bindestrichen.

Reihenfolge: So kommen neue Kürzel in die Gänge. Jede Seltenheit wird gleichmäßig über die ganze Liste verteilt,
die legendären setzen etwas später ein (ab dem dritten Gang), und innerhalb einer Seltenheit wechseln die Kategorien reihum.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KATEGORIEN = {
    'net': 'Netzwerk', 'hw': 'Hardware', 'dev': 'Entwicklung', 'db': 'Datenbanken', 'sec': 'Sicherheit',
    'pm': 'Projekt und Service', 'ops': 'Betrieb und Cloud', 'law': 'Recht und Wirtschaft', 'org': 'Organisationen'
}
# Wo jede Seltenheit in der Liste einsetzt (Anteil der Liste) und wie weit sie sich streckt
EINSATZ = {1: (0.0, 0.92), 2: (0.02, 0.96), 3: (0.07, 0.93)}


def reihum(eintraege):
    """Innerhalb einer Seltenheit die Kategorien abwechseln, jede in ihrer Reihenfolge aus der Vorlage"""
    nach = {}
    for e in eintraege:
        nach.setdefault(e['t'], []).append(e)
    out = []
    while any(nach.values()):
        for t in KATEGORIEN.values():
            if nach.get(t):
                out.append(nach[t].pop(0))
    return out


def main(src):
    html = open(os.path.expanduser(src), encoding='utf-8').read()
    m = re.search(r'const RAW = `(.*?)`;', html, re.S)
    if not m:
        sys.exit('Keine Kürzel gefunden (const RAW fehlt)')
    karten = []
    for zeile in m.group(1).strip().split('\n'):
        teile = [x.strip() for x in zeile.split('|')]
        if len(teile) < 5:
            sys.exit('Zeile ohne fünf Felder: ' + zeile)
        a, lang, d, c, r = teile[:5]
        if c not in KATEGORIEN:
            sys.exit('Unbekannte Kategorie: ' + zeile)
        k = {
            'i': 'k-' + re.sub(r'[^a-z0-9]+', '-', a.lower()).strip('-'),
            'l': 13, 't': KATEGORIEN[c], 'n': a,
            'lang': lang.replace('–', '-').replace('—', '-'),
            'd': d.replace('–', '-').replace('—', '-'), 'r': int(r)
        }
        if len(teile) > 5 and teile[5]:
            k['j'] = teile[5]
        karten.append(k)
    ids = [k['i'] for k in karten]
    doppelt = {i for i in ids if ids.count(i) > 1}
    if doppelt:
        sys.exit('Doppelte Kennungen: ' + ', '.join(sorted(doppelt)))

    platz = []
    for r, (anfang, breite) in EINSATZ.items():
        gruppe = reihum([k for k in karten if k['r'] == r])
        for n, k in enumerate(gruppe):
            platz.append((anfang + breite * (n + 0.5) / len(gruppe), r, n, k))
    karten = [k for *_, k in sorted(platz, key=lambda p: p[:3])]

    out = os.path.join(ROOT, 'data', 'kuerzel.json')
    with open(out, 'w', encoding='utf-8') as f:
        f.write('[\n' + ',\n'.join(json.dumps(k, ensure_ascii=False, separators=(',', ':')) for k in karten) + '\n]\n')
    zahl = {r: sum(1 for k in karten if k['r'] == r) for r in (1, 2, 3)}
    print(f'{len(karten)} Kürzel nach data/kuerzel.json (gewöhnlich {zahl[1]}, selten {zahl[2]}, legendär {zahl[3]}, '
          f'{sum(1 for k in karten if "j" in k)} mit Spaß-Langform)')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
