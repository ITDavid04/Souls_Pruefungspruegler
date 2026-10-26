"""Malt das Bild für die Katakomben der Kürzel.

Aufruf: python3 -I tools/katakomben_bild.py   (schreibt src/img/katakomben.webp und katakomben-klein.webp, nur mit Pillow)

Ein Gewölbegang in Fluchtpunkt-Perspektive: Spitzbögen hintereinander, in den Wänden Nischen mit Schädeln,
auf den Schlusssteinen der vorderen Bögen eingemeißelte Kürzel, Kerzen am Boden. Ganz hinten glüht ein Raum,
und darin steht eine Gestalt: der Akronymant. Das Motiv steht mittig, weil das Handy im Hochformat nur die Mitte zeigt.
Die Werkzeuge (Textur, Leuchten, Nebel, Figur, Korn) kommen aus tools/berg_bilder.py.
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont  # noqa: E402

from berg_bilder import W, H, figur, korn_und_rand, leuchten, nebel, speichern, textur  # noqa: E402

VX, VY = 800, 470          # Fluchtpunkt
TIEFE = 9                  # Rahmen 0 (vorn, außerhalb des Bildes) bis 9 (hinten)
SCHRIFT = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
KUERZEL = ['TLA', 'DNS', 'ACID', 'SSH', 'CRUD', 'RAID']


def mass(k):
    s = 1.7 / (1 + 0.7 * k)
    return {'s': s, 'hw': 520 * s, 'boden': VY + 430 * s, 'kaempfer': VY - 120 * s, 'scheitel': VY - 820 * s}


def bogen(m, innen=0.0, n=28):
    """Umriss eines Spitzbogens: unten links hoch, über den Scheitel, rechts wieder runter.
    Zwei Kreisbögen, deren Mittelpunkte auf der Kämpferlinie gegenüber liegen."""
    hw = m['hw'] - innen
    links, rechts = VX - hw, VX + hw
    boden, kaempfer = m['boden'], m['kaempfer']
    hoch = m['kaempfer'] - m['scheitel'] - innen
    c = max(0.0, (hoch * hoch - hw * hw) / (2 * hw))
    r = hw + c
    oben = math.atan2(hoch, c)              # Winkel am Scheitel, vom rechten Mittelpunkt aus gesehen
    pts = [(links, boden), (links, kaempfer)]
    for i in range(1, n + 1):
        a = math.pi - (math.pi - oben) * i / n
        pts.append((VX + c + r * math.cos(a), kaempfer - r * math.sin(a)))
    for x, y in reversed(pts[2:-1]):
        pts.append((2 * VX - x, y))
    pts += [(rechts, kaempfer), (rechts, boden)]
    return pts


def mische(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def bilinear(q, u, v):
    """q = (vorn oben, hinten oben, hinten unten, vorn unten), u nach hinten, v nach unten"""
    oben = mische(q[0], q[1], u)
    unten = mische(q[3], q[2], u)
    return mische(oben, unten, v)


def flaeche_hell(img, punkte, quelle, hell):
    maske = Image.new('L', img.size, 0)
    ImageDraw.Draw(maske).polygon(punkte, fill=255)
    img.paste(ImageEnhance.Brightness(quelle).enhance(hell), (0, 0), maske)


def schaedel(d, cx, cy, b, hell, rnd):
    """Schädel von vorn: Kalotte, Kiefer, Augenhöhlen, Nase, Zähne. Gedämpft, nicht weiß."""
    ton = rnd.uniform(0.78, 1.0)
    knochen = tuple(int(c * hell * ton) for c in (164, 146, 116))
    schatten = tuple(int(c * hell * ton * 0.45) for c in (164, 146, 116))
    h = b * 1.05
    d.ellipse([cx - b / 2, cy - h / 2, cx + b / 2, cy + h * 0.28], fill=knochen)
    d.rounded_rectangle([cx - b * 0.3, cy + h * 0.05, cx + b * 0.3, cy + h * 0.48], radius=max(1, b * 0.12), fill=knochen)
    for sx in (-1, 1):
        ex, ey, er = cx + sx * b * 0.19, cy - h * 0.02, b * 0.13
        d.ellipse([ex - er, ey - er * 0.9, ex + er, ey + er * 1.05], fill=(8, 5, 4))
    d.polygon([(cx, cy + h * 0.1), (cx - b * 0.06, cy + h * 0.22), (cx + b * 0.06, cy + h * 0.22)], fill=(14, 9, 7))
    if b > 14:
        for i in range(-2, 3):
            x = cx + i * b * 0.09
            d.line([(x, cy + h * 0.32), (x, cy + h * 0.45)], fill=schatten, width=1)
    if b > 10 and rnd.random() < 0.3:   # Glanz auf der Kalotte, nicht bei allen
        d.ellipse([cx - b * 0.36, cy - h * 0.44, cx - b * 0.08, cy - h * 0.2], fill=tuple(min(255, int(c * 1.12)) for c in knochen))


def wand(img, d, q, hell, rnd, seite):
    """Nischen mit Schädeln in eine Wandfläche (perspektivisch verzerrt)"""
    for u0, u1 in ((0.1, 0.42), (0.56, 0.88)):
        for v0, v1 in ((0.06, 0.3), (0.38, 0.62), (0.7, 0.92)):
            pts = []
            for i in range(9):   # Bogen oben
                a = math.pi * i / 8
                uu = u0 + (u1 - u0) * (0.5 - 0.5 * math.cos(a))
                pts.append(bilinear(q, uu, v0 + (v1 - v0) * 0.28 * (1 - math.sin(a))))
            pts += [bilinear(q, u1, v1), bilinear(q, u0, v1)]
            d.polygon(pts, fill=(10, 7, 6))
            breite = abs(bilinear(q, u1, 0.5)[0] - bilinear(q, u0, 0.5)[0])
            hoehe = abs(bilinear(q, (u0 + u1) / 2, v1)[1] - bilinear(q, (u0 + u1) / 2, v0)[1])
            # unten Knochen quer gestapelt, darauf zwei oder drei Schädel nebeneinander
            for j in range(3):
                a, b2 = bilinear(q, u0 + 0.04, v1 - 0.02 - j * 0.03), bilinear(q, u1 - 0.04, v1 - 0.02 - j * 0.03)
                d.line([a, b2], fill=tuple(int(c * hell * 0.7) for c in (150, 132, 104)), width=max(1, int(hoehe * 0.05)))
            zahl = 3 if breite > 70 else 2 if breite > 26 else 1
            b = min(breite * 0.9 / zahl, hoehe * 0.5)
            if b <= 3:
                continue
            for z in range(zahl):
                uu = u0 + (u1 - u0) * (z + 0.5) / zahl
                mx, my = bilinear(q, uu, v0 + (v1 - v0) * 0.62)
                schaedel(d, mx + rnd.uniform(-1, 1) * b * 0.06, my + rnd.uniform(-1, 1) * b * 0.05, b * rnd.uniform(0.9, 1.0), hell, rnd)


def main():
    rnd = random.Random(13)
    img = Image.new('RGB', (W, H), (12, 8, 6))
    stein = textur((70, 56, 44), rnd, staerke=30)
    rippe = textur((92, 76, 60), rnd, staerke=24)
    d = ImageDraw.Draw(img)

    # Ganz hinten: ein glühender Raum
    ende = mass(TIEFE)
    d.polygon(bogen(ende), fill=(120, 54, 20))
    img = leuchten(img, VX, ende['boden'] - 60 * ende['s'] * 4, 420, (255, 150, 70), 0.9)
    d = ImageDraw.Draw(img)

    for k in range(TIEFE - 1, -1, -1):
        nah, fern = mass(k), mass(k + 1)
        hell = 0.32 + 0.78 * ((k + 1) / TIEFE) ** 1.4      # je weiter hinten, desto mehr Glut
        # Boden
        boden = [(VX - nah['hw'], nah['boden']), (VX + nah['hw'], nah['boden']), (VX + fern['hw'], fern['boden']), (VX - fern['hw'], fern['boden'])]
        flaeche_hell(img, boden, stein, hell * 0.75)
        # Gewölbe: zwischen den beiden Bogenlinien oberhalb der Kämpfer
        gn, gf = bogen(nah)[1:-1], bogen(fern)[1:-1]
        flaeche_hell(img, gn + list(reversed(gf)), stein, hell * 0.62)
        # Wände links und rechts, mit Nischen
        for seite in (-1, 1):
            q = [(VX + seite * nah['hw'], nah['kaempfer']), (VX + seite * fern['hw'], fern['kaempfer']),
                 (VX + seite * fern['hw'], fern['boden']), (VX + seite * nah['hw'], nah['boden'])]
            flaeche_hell(img, q, stein, hell * 0.9)
            d = ImageDraw.Draw(img)
            for v in (0.33, 0.66):   # Mauerfugen
                d.line([bilinear(q, 0, v), bilinear(q, 1, v)], fill=(int(24 * hell), int(17 * hell), int(12 * hell)), width=max(1, int(3 * nah['s'])))
            wand(img, d, q, hell, rnd, seite)
        # Fugen im Boden
        d = ImageDraw.Draw(img)
        for t in (-0.6, -0.2, 0.2, 0.6):
            d.line([(VX + t * nah['hw'], nah['boden']), (VX + t * fern['hw'], fern['boden'])], fill=(int(20 * hell), int(14 * hell), int(10 * hell)), width=max(1, int(4 * nah['s'])))
        # Rippe am hinteren Rahmen dieses Abschnitts: Steinbogen, der in den Gang ragt
        dicke = 46 * fern['s']
        maske = Image.new('L', img.size, 0)
        md = ImageDraw.Draw(maske)
        md.polygon(bogen(fern), fill=255)
        md.polygon(bogen(fern, innen=dicke), fill=0)
        img.paste(ImageEnhance.Brightness(rippe).enhance(min(1.25, hell * 1.15)), (0, 0), maske)
        d = ImageDraw.Draw(img)
        d.line(bogen(fern, innen=dicke)[1:-1], fill=(int(150 * hell), int(110 * hell), int(70 * hell)), width=max(1, int(2 * fern['s'] * 2)))

    # Die Gestalt im glühenden Raum: Kapuze, ein Stab, zwei glimmende Augen
    d = ImageDraw.Draw(img)
    hf = (ende['boden'] - ende['kaempfer']) * 0.95
    fx, fy = VX, ende['boden'] + 2
    figur(d, fx, fy, hf * 1.035, (190, 96, 40), 'stehen')
    figur(d, fx, fy, hf, (16, 9, 6), 'stehen')
    d.line([(fx + hf * 0.26, fy), (fx + hf * 0.3, fy - hf * 1.12)], fill=(16, 9, 6), width=max(2, int(hf * 0.03)))
    for sx in (-1, 1):
        ax, ay = fx + 0.012 * hf + sx * hf * 0.035, fy - hf * 0.86
        d.ellipse([ax - hf * 0.012, ay - hf * 0.007, ax + hf * 0.012, ay + hf * 0.007], fill=(255, 170, 80))
    img = leuchten(img, fx, fy - hf * 0.86, hf * 0.12, (255, 110, 40), 0.5)

    # Eingemeißelte Kürzel auf den Schlusssteinen der vorderen Bögen
    d = ImageDraw.Draw(img)
    for k, wort in zip(range(3, 9), KUERZEL):
        m = mass(k)
        dicke = 46 * m['s']
        y = m['scheitel'] + dicke * 1.4
        groesse = max(10, int(46 * m['s']))
        f = ImageFont.truetype(SCHRIFT, groesse)
        hell = 0.32 + 0.78 * (k / TIEFE) ** 1.4
        d.text((VX + 1, y + 1), wort, font=f, anchor='mm', fill=(int(170 * hell + 40), int(130 * hell + 30), int(90 * hell + 20)))
        d.text((VX, y), wort, font=f, anchor='mm', fill=(12, 7, 5))

    # Kerzen am Fuß der Wände
    for k in range(1, 8):
        m = mass(k)
        for seite in (-1, 1):
            if rnd.random() < 0.3:
                continue
            x = VX + seite * m['hw'] * rnd.uniform(0.8, 0.9)
            y = m['boden'] - 4 * m['s']
            hk, bk = 70 * m['s'], 12 * m['s']
            d = ImageDraw.Draw(img)
            d.rectangle([x - bk / 2, y - hk, x + bk / 2, y], fill=(196, 176, 140))
            d.ellipse([x - bk * 0.45, y - hk - bk * 1.6, x + bk * 0.45, y - hk], fill=(255, 214, 140))
            img = leuchten(img, x, y - hk - bk, 260 * m['s'] + 30, (255, 140, 60), 0.55)
    img = leuchten(img, VX, 860, 520, (150, 60, 20), 0.35)
    nebel(img, 820, 160, (70, 52, 40), 1.4, rnd)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    speichern(korn_und_rand(img, rand=0.6), 'katakomben')


if __name__ == '__main__':
    main()
