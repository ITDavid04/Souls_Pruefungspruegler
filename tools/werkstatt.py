"""Holt die drei Werkzeuge aus dem Reinprügler-Ordner in die Werkstatt der App (src/werkstatt/).

Aufruf (einmalig oder wenn ein Werkzeug eine neue Fassung bekommt):
    python3 -I tools/werkstatt.py "~/Desktop/Reinprügler_APP"

Liest subnetz-klappuhr.html, rechenwerk.html und zahlenwerk.html und schreibt klappuhr.html, rechenwerk.html und zahlenwerk.html.
Dabei passiert:
- Google-Schriften fliegen raus (offline geht das nicht); die Schriftnamen der Werkzeuge zeigen in werkstatt.css auf die Schriften der App
- dunkles Farbschema fest, darüber der Souls-Anstrich aus werkstatt.css, oben die Kopfzeile der Werkstatt
- Gedankenstriche werden umgeschrieben (der Build lehnt sie in eigenen Texten ab)
- Klappuhr: der Übungsteil (Vorhersagen, Fehler finden) entfällt, den gibt es im Spiel als Rätsel; dafür lässt sie sich per Link
  voreinstellen, zum Beispiel klappuhr.html#tab=clock&ip=192.168.1.60&p=26 (Sprung aus einem falschen Rätsel)
- Rechenwerk: die Abschnitte bekommen Anker (#addieren, #faelle, #schaltung, #maske, #gatter, #kasten)
Bricht ab, wenn eine Ersetzung nicht mehr passt oder danach noch ein Gedankenstrich übrig ist.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIEL = os.path.join(ROOT, 'src', 'werkstatt')
REITER = [('klappuhr.html', 'Klappuhr'), ('rechenwerk.html', 'Rechenwerk'), ('zahlenwerk.html', 'Zahlenwerk')]


def ersetze(text, paare, datei):
    for alt, neu in paare:
        if alt not in text:
            sys.exit(f'{datei}: Stelle nicht gefunden: {alt[:70]}')
        text = text.replace(alt, neu)
    return text


def kopf(text, datei, titel):
    """Schriften raus, Werkstatt-Stil und Kopfzeile rein, dunkles Schema fest"""
    text = re.sub(r'<link rel="preconnect"[^>]*>\n?', '', text)
    text = re.sub(r'<link href="https://fonts\.googleapis\.com[^>]*>\n?', '', text)
    text = text.replace('<html lang="de">', '<html lang="de" data-theme="dark">', 1)
    text = re.sub(r'<title>.*?</title>', f'<title>{titel} · Werkstatt · Prüfungsprügler</title>', text, count=1)
    text = text.replace('</head>', '<meta name="theme-color" content="#0b0908">\n<meta name="color-scheme" content="dark">\n'
                        '<link rel="icon" href="../icons/favicon.svg" type="image/svg+xml">\n<link rel="stylesheet" href="werkstatt.css">\n</head>', 1)
    reiter = ''.join(f'<a href="{d}"' + (' aria-current="page"' if d == datei else '') + f'>{n}</a>' for d, n in REITER)
    nav = ('<nav class="werkstatt-kopf" aria-label="Werkstatt">'
           '<a class="werkstatt-zurueck" id="werkstatt-zurueck" href="../?zurueck">Zum Lagerfeuer</a>'
           '<span class="werkstatt-name">Die Werkstatt</span>'
           f'<span class="werkstatt-reiter">{reiter}</span></nav>\n')
    text = text.replace('<body>\n', '<body>\n' + nav, 1)
    text = text.replace('</body>', '<script src="werkstatt.js"></script>\n</body>', 1)
    return text


def klappuhr(text):
    # Übungsteil raus: Modusleisten, Übungsflächen, die Übungs-Engine samt Aufgaben und die Modus-Umschaltung
    text = re.sub(r'\n\s*<div class="bar modebar"[^\n]*', '', text)
    text = re.sub(r'\n\s*<div class="panel tr-panel hidden">[^\n]*', '', text)
    a, b = text.index('/* ---------- Übungs-Engine'), text.index('/* ---------- Werkzeug-Ansichten laden')
    text = text[:a] + text[b:]
    a, b = text.index('/* ---------- Modus-Umschaltung pro Reiter'), text.index('/* ---------- Tabs ----------')
    text = text[:a] + text[b:]
    text = ersetze(text, [
        ('Frag nicht, was eine Adresse ist – frag, wozu sie gehört.', 'Frag nicht, was eine Adresse ist, frag, wozu sie gehört.'),
        ('wie der Rechner – nur für jede Zeile', 'wie der Rechner, nur für jede Zeile'),
        ('<b>längste Maske</b> – die genaueste Schablone', '<b>längste Maske</b>, die genaueste Schablone'),
        ('ein Trunk – dort bekommt jeder Frame', 'ein Trunk, dort bekommt jeder Frame'),
        ('noch leer – der erste Frame wird geflutet', 'noch leer, der erste Frame wird geflutet'),
        ('16 Stellungen (0–f)', '16 Stellungen (0 bis f)'),
        ('Gib eine Adresse ein – lang oder gekürzt', 'Gib eine Adresse ein, lang oder gekürzt'),
        ('<b>::</b> werden – sonst weiß niemand', '<b>::</b> werden, sonst weiß niemand'),
        ('<td>nein – dafür Multicast', '<td>nein, dafür Multicast'),
        ('"klappt frei (0–255)"', '"klappt frei (0 bis 255)"'),
        ('"Netz-ID – kein Rechner"', '"Netz-ID, kein Rechner"'),
        ('"Broadcast – kein Rechner"', '"Broadcast, kein Rechner"'),
        ('"Host – hier darf ein Rechner wohnen"', '"Host: hier darf ein Rechner wohnen"'),
        ('${st}–${st+block-1}', '${st} bis ${st+block-1}'),
        ('<span class="warn">– das ist die Netz-ID, kein Rechner!</span>', '<span class="warn">Achtung, das ist die Netz-ID, kein Rechner!</span>'),
        ('<span class="warn">– das ist der Broadcast, kein Rechner!</span>', '<span class="warn">Achtung, das ist der Broadcast, kein Rechner!</span>'),
        ('A stellt direkt zu – kein Router nötig.', 'A stellt direkt zu, kein Router nötig.'),
        ('Hostbits gesetzt – Netz-ID wäre', 'Hostbits gesetzt, Netz-ID wäre'),
        ('</b> – Zielnetz ist', '</b>, Zielnetz ist'),
        ('VLAN geändert – Tabellen geleert.', 'VLAN geändert, Tabellen geleert.'),
        ('Der Frame kommt nie an – dafür braucht es einen Router.', 'Der Frame kommt nie an, dafür braucht es einen Router.'),
        (':"–";', ':"keins";'),
        ('Blattgrenze – der einfache Fall.', 'Blattgrenze, der einfache Fall.'),
        ('Genau wie bei IPv4 – nur mit 16 statt 256', 'Genau wie bei IPv4, nur mit 16 statt 256'),
        ('Zweimal :: ist verboten – dann weiß niemand', 'Zweimal :: ist verboten, dann weiß niemand'),
        ('</b> – sie zählen hoch', '</b>, sie zählen hoch'),
        ('Kleiner als /64 – in der Praxis vermeiden', 'Kleiner als /64, in der Praxis vermeiden'),
        ('Das letzte Blatt klappt in Päckchen – Prüfungsfalle!', 'Das letzte Blatt klappt in Päckchen. Prüfungsfalle!'),
    ], 'klappuhr')
    # Voreinstellung per Link, nach dem Start der Werkzeuge
    start = 'buildHex(); renderV6(); renderShort(); renderPlan(); renderEui();'
    if start not in text:
        sys.exit('klappuhr: Startzeile nicht gefunden')
    text = text.replace(start, start + '''

/* ---------- Sprung aus dem Prüfungsprügler: #tab=clock&ip=192.168.1.60&p=26 (a, b: zwei Rechner),
   #tab=router&ziel=10.20.3.70, #tab=vlan&von=1&an=5 (vor=1,5: ein Frame vorher), #tab=v6&kurz=… oder &plan=…&n=… oder &mac=… ---------- */
(function(){
  const q=new URLSearchParams(location.hash.slice(1)), tab=q.get("tab");
  if(!tab) return;
  const knopf=document.querySelector('[data-tab="'+tab+'"]'); if(knopf) knopf.click();
  setTimeout(()=>{
    if(tab==="clock"&&q.get("ip")) lookClock(q.get("ip"),+q.get("p")||24,q.get("a"),q.get("b"));
    if(tab==="router"&&q.get("ziel")) lookRoute(q.get("ziel"));
    if(tab==="vlan"&&q.get("von")) lookVlan(+q.get("von"),q.get("an")==="bc"?"bc":+q.get("an"),q.get("vor")?q.get("vor").split(",").map(Number):null);
    if(tab==="v6"){ if(q.get("kurz")) lookV6short(q.get("kurz")); else if(q.get("plan")) lookPlan(q.get("plan"),+q.get("n")); else if(q.get("mac")) lookEui(q.get("mac")); }
  },60);
})();''')
    return text


def rechenwerk(text):
    anker = [('Spalte für Spalte, von rechts', 'addieren'), ('Die Fälle, die dabei vorkommen', 'faelle'), ('Dieselben Regeln als Schaltung', 'schaltung'),
             ('Wozu die Gatter sonst gut sind', 'maske'), ('Alle Gatter auf einmal', 'gatter'), ('Welches Gatter steckt im Kasten?', 'kasten')]
    for titel, id_ in anker:
        m = re.search(r'<section([^>]*)>(\s*)<h2>' + re.escape(titel), text)
        if not m:
            sys.exit('rechenwerk: Abschnitt nicht gefunden: ' + titel)
        text = text[:m.start()] + f'<section id="{id_}"{m.group(1)}>{m.group(2)}<h2>{titel}' + text[m.end():]
    text = ersetze(text, [
        ('"AND — ', '"AND: '), ('"NOT — ', '"NOT: '), ('"OR — ', '"OR: '), ('"XOR — ', '"XOR: '),
        ('ohne Übertrag von rechts — der Halbaddierer', 'ohne Übertrag von rechts: der Halbaddierer'),
        ('mit Übertrag von rechts — daraus wird der Volladdierer', 'mit Übertrag von rechts: daraus wird der Volladdierer'),
        ('hineinpasst — bei acht Bit heißt das Überlauf', 'hineinpasst. Bei acht Bit heißt das Überlauf'),
        ('unterscheiden — eine Unterschiedskarte', 'unterscheiden: eine Unterschiedskarte'),
    ], 'rechenwerk')
    return text.replace(' — ', ', ')


def zahlenwerk(text):
    text = ersetze(text, [
        ('Überlauf — alle Stellen waren voll', 'Überlauf: alle Stellen waren voll'),
        ('In Reihenfolge — das erste Zeichen ist die Null', 'In Reihenfolge: das erste Zeichen ist die Null'),
        ('ist mir kein verabschiedetes IEC-Pendant bekannt — da bin ich unsicher, prüf das nach, falls du es in Unterlagen schreibst.',
         'ist kein verabschiedetes IEC-Gegenstück bekannt. Wer es in Unterlagen schreibt, schlägt besser nach.'),
        ('"Ziffern 0–9, A–F"', '"Ziffern 0 bis 9, A bis F"'),
        ('braucht ein Zeichen — " + symbol(0)', 'braucht ein Zeichen: " + symbol(0)'),
        ('["—","",0,null]', '["(keine)","",0,null]'),
        ('<td class="mid">—</td>', '<td class="mid">·</td>'),
    ], 'zahlenwerk')
    return text.replace(' — ', ', ')


def main(quelle):
    quelle = os.path.expanduser(quelle)
    os.makedirs(ZIEL, exist_ok=True)
    for name, ziel, titel, umbau in (('subnetz-klappuhr.html', 'klappuhr.html', 'Subnetz-Klappuhr', klappuhr),
                                      ('rechenwerk.html', 'rechenwerk.html', 'Rechenwerk', rechenwerk),
                                      ('zahlenwerk.html', 'zahlenwerk.html', 'Zahlenwerk', zahlenwerk)):
        text = open(os.path.join(quelle, name), encoding='utf-8').read()
        text = kopf(umbau(text), ziel, titel)
        rest = [m.start() for m in re.finditer('[–—]', text)]
        if rest:
            sys.exit(f'{ziel}: noch {len(rest)} Gedankenstrich(e), zum Beispiel: {text[max(0, rest[0] - 60):rest[0] + 20]!r}')
        if 'googleapis' in text:
            sys.exit(f'{ziel}: Google-Schriften noch drin')
        open(os.path.join(ZIEL, ziel), 'w', encoding='utf-8').write(text)
        print(f'{ziel}: {len(text) // 1024} KB')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
