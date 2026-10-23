"""Malt die Bilder für den Aufstieg (AP2) und färbt den Grund der Hölle ein.

Aufruf: python3 -I tools/berg_bilder.py   (schreibt nach src/img/, nur mit Pillow, ohne Zufall von außen)

Die Hölle (AP1) besteht aus gemalten Bildern. Der Läuterungsberg ist bewusst anders: Silhouetten im Morgenlicht,
Nebel, Sterne, wie ein Scherenschnitt. Wer aus der Hölle kommt, soll den Unterschied sehen.
    berg              der Berg vom Ufer aus, mit den vier Sternen
    gesims-stolz      Seelen unter Felsbrocken, in die Wand ist eine Spirale gemeißelt (Rekursion)
    gesims-neid       Seelen mit verbundenen Augen, am Himmel ein Klassendiagramm aus Sternen
    gesims-zorn       Rauch, ein einzelner Serverschrank mit roter Lampe
    gesims-traegheit  Seelen rennen unter Wolken wie Balken eines Gantt-Diagramms
    gesims-geiz       Seelen liegen bäuchlings zwischen verstreuten Münzen
    gesims-voellerei  ein umgedrehter Baum, die Früchte hängen in Zeilen und Spalten
    feuerwand         die Wand aus Feuer vor dem Gipfel
    kokytos           kreis-07 aus dem Reinprügler, eisblau eingefärbt, mit Schnee
Alle Motive stehen in der Bildmitte, weil das Handy im Hochformat nur die Mitte zeigt.
"""
import math
import os
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'src', 'img')
W, H = 1600, 900


# ---------- Werkzeuge ----------
def verlauf(stops, w=W, h=H):
    img = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
            if p0 <= t <= p1:
                u = (t - p0) / (p1 - p0) if p1 > p0 else 0
                d.line([(0, y), (w, y)], fill=tuple(int(c0[i] + (c1[i] - c0[i]) * u) for i in range(3)))
                break
    return img


def kamm(n, rauh, rnd):
    """Bergkamm per Mittelpunktverschiebung, Werte etwa zwischen -1 und 1"""
    size = 1
    while size < n:
        size *= 2
    p = [0.0] * (size + 1)
    p[0], p[size] = rnd.uniform(-1, 1), rnd.uniform(-1, 1)
    step, amp = size, 1.0
    while step > 1:
        half = step // 2
        for i in range(half, size, step):
            p[i] = (p[i - half] + p[i + half]) / 2 + rnd.uniform(-amp, amp)
        step, amp = half, amp * rauh
    m = max(abs(v) for v in p) or 1
    return [v / m for v in p[:n]]


def textur(farbe, rnd, staerke=26, korn=2):
    """Fläche in einer Farbe mit Rauschen, damit sie nicht wie Plastik aussieht"""
    n = Image.effect_noise((W // korn, H // korn), 64).resize((W, H), Image.BICUBIC)
    dunkel = tuple(max(0, c - staerke) for c in farbe)
    hell = tuple(min(255, c + staerke) for c in farbe)
    return ImageOps.colorize(n, dunkel, hell)


def flaeche(img, punkte, quelle, alpha=255, blur=0):
    maske = Image.new('L', img.size, 0)
    ImageDraw.Draw(maske).polygon(punkte, fill=alpha)
    if blur:
        maske = maske.filter(ImageFilter.GaussianBlur(blur))
    if isinstance(quelle, tuple):
        quelle = Image.new('RGB', img.size, quelle)
    img.paste(quelle, (0, 0), maske)


def leuchten(img, cx, cy, r, farbe, staerke=1.0, exp=2.2):
    r = max(1, int(r))
    # radial_gradient erreicht 255 erst in den Ecken; gestreckt, damit der Schein schon am Rand des Quadrats endet
    g = ImageOps.invert(Image.radial_gradient('L').point(lambda v: min(255, int(v * 1.43)))).resize((2 * r, 2 * r), Image.BICUBIC)
    g = g.point(lambda v: int(min(255, (v / 255) ** exp * 255 * staerke)))
    maske = Image.new('L', img.size, 0)
    maske.paste(g, (int(cx - r), int(cy - r)))
    schein = Image.composite(Image.new('RGB', img.size, farbe), Image.new('RGB', img.size, (0, 0, 0)), maske)
    return ImageChops.screen(img, schein)


def nebel(img, y, hoehe, farbe, dichte, rnd, blur=28):
    n = Image.effect_noise((W // 10, H // 10), 70).resize(img.size, Image.BICUBIC).filter(ImageFilter.GaussianBlur(18))
    band = Image.new('L', img.size, 0)
    ImageDraw.Draw(band).rectangle([0, y - hoehe // 2, W, y + hoehe // 2], fill=255)
    band = band.filter(ImageFilter.GaussianBlur(max(1, hoehe // 3)))
    m = ImageChops.multiply(band, n.point(lambda v: max(0, min(255, int((v - 60) * dichte)))))
    img.paste(Image.new('RGB', img.size, farbe), (0, 0), m.filter(ImageFilter.GaussianBlur(blur // 4)))


def sterne(img, n, ymax, rnd, hell=(235, 235, 255)):
    d = ImageDraw.Draw(img)
    for _ in range(n):
        x, y = rnd.uniform(0, W), rnd.uniform(0, ymax) ** 1.0
        a = rnd.uniform(0.25, 1) * (1 - y / ymax) ** 0.6
        c = tuple(int(v * a) for v in hell)
        r = rnd.choice([0.6, 0.8, 1, 1, 1.4])
        d.ellipse([x - r, y - r, x + r, y + r], fill=tuple(max(a, b) for a, b in zip(c, img.getpixel((int(x), int(y))))))


def stern(img, x, y, groesse, farbe=(255, 250, 230)):
    img = leuchten(img, x, y, groesse * 5, farbe, 0.55)
    d = ImageDraw.Draw(img)
    d.line([(x - groesse * 3, y), (x + groesse * 3, y)], fill=farbe, width=1)
    d.line([(x, y - groesse * 3), (x, y + groesse * 3)], fill=farbe, width=1)
    d.ellipse([x - groesse * .6, y - groesse * .6, x + groesse * .6, y + groesse * .6], fill=farbe)
    return img


def korn_und_rand(img, korn=10, rand=0.55):
    n = Image.effect_noise(img.size, korn * 4).convert('RGB')
    img = Image.blend(img, ImageChops.overlay(img, n), 0.18)
    v = ImageOps.invert(Image.radial_gradient('L')).resize(img.size, Image.BICUBIC)
    v = v.point(lambda p: int(255 * (1 - rand) + p * rand))
    return ImageChops.multiply(img, Image.merge('RGB', (v, v, v)))


def brocken(cx, cy, r, rnd, n=10):
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n + rnd.uniform(-.18, .18)
        rr = r * rnd.uniform(.78, 1.08)
        pts.append((cx + math.cos(a) * rr * 1.18, cy + math.sin(a) * rr * .82))
    return pts


FORMEN = {
    # Punkte relativ zu Fußpunkt (x nach rechts, y nach oben), in Höhen h
    'stehen': [(-.21, 0), (-.17, .3), (-.13, .6), (-.11, .8), (-.06, .94), (.02, 1.0), (.09, .9), (.11, .74), (.14, .4), (.2, 0)],
    'gebeugt': [(-.24, 0), (-.2, .3), (-.08, .52), (.12, .6), (.3, .58), (.4, .5), (.37, .38), (.22, .36), (.16, .2), (.14, 0)],
    'sitzen': [(-.24, 0), (-.2, .22), (-.13, .44), (-.1, .56), (-.05, .66), (.03, .7), (.09, .62), (.1, .48), (.16, .26), (.26, 0)],
    'liegen': [(-.55, 0), (-.5, .1), (-.2, .16), (.2, .15), (.36, .2), (.48, .17), (.52, .06), (.5, 0)],
    'mager': [(-.1, 0), (-.08, .4), (-.07, .72), (-.06, .86), (-.02, .97), (.03, 1.0), (.07, .9), (.06, .7), (.07, .4), (.1, 0)],
    'rennen': [(-.3, 0), (-.18, .24), (-.04, .52), (.06, .74), (.12, .9), (.2, .97), (.27, .88), (.24, .7), (.2, .5), (.1, .26), (.12, 0)],
}


def figur(d, x, y, h, farbe, art='stehen', last=None, kante=None, rnd=None):
    """Kapuzengestalt als Scherenschnitt, auf Wunsch mit heller Kante zur Lichtseite"""
    pts = [(x + px * h, y - py * h) for px, py in FORMEN[art]]
    if kante:
        d.polygon([(px - 2, py - 1) for px, py in pts], fill=kante)
    d.polygon(pts, fill=farbe)
    if art == 'sitzen' and kante:   # verbundene Augen
        d.line([(x - h * .05, y - h * .58), (x + h * .1, y - h * .58)], fill=kante, width=2)
    if last:
        r = rnd or random.Random(int(x))
        b = brocken(x + h * .1, y - h * .84, h * .3, r)
        d.polygon([(px - 2, py - 2) for px, py in b], fill=tuple(min(255, c + 40) for c in last))
        d.polygon(b, fill=last)


def fels_textur(farbe, rnd, staerke=22):
    grob = Image.effect_noise((W // 6, H // 6), 64).resize((W, H), Image.BICUBIC)
    streifen = Image.effect_noise((W // 3, 6), 70).resize((W, H), Image.BICUBIC)
    n = ImageChops.add(grob.point(lambda v: v // 2), streifen.point(lambda v: v // 2))
    dunkel = tuple(max(0, c - staerke) for c in farbe)
    hell = tuple(min(255, c + staerke) for c in farbe)
    return ImageOps.colorize(n, dunkel, hell)


def strahlen(img, sx, sy, farbe, rnd, n=7, alpha=34):
    lage = Image.new('L', img.size, 0)
    d = ImageDraw.Draw(lage)
    for _ in range(n):
        a = rnd.uniform(math.pi * 1.05, math.pi * 1.95)
        b = rnd.uniform(.03, .07)
        lang = 1500
        d.polygon([(sx, sy), (sx + math.cos(a - b) * lang, sy + math.sin(a - b) * lang), (sx + math.cos(a + b) * lang, sy + math.sin(a + b) * lang)], fill=alpha)
    lage = lage.filter(ImageFilter.GaussianBlur(14))
    return ImageChops.screen(img, Image.composite(Image.new('RGB', img.size, farbe), Image.new('RGB', img.size, (0, 0, 0)), lage))


def gesims_grund(rnd, himmel, wolke, fels, kante, sonne=None, sternzahl=0):
    """Gemeinsamer Aufbau: Himmel, Wolkenmeer unter dir, Felswand rechts, Gesims quer durchs Bild"""
    img = verlauf(himmel)
    if sternzahl:
        sterne(img, sternzahl, H * 0.55, rnd)
    if sonne:
        img = leuchten(img, sonne[0], sonne[1], sonne[2], sonne[3], 0.9)
        img = strahlen(img, sonne[0], sonne[1], sonne[3], rnd)
    # ferne Gipfel über dem Wolkenmeer
    k = kamm(W, 0.55, rnd)
    flaeche(img, [(0, H)] + [(x, 566 + k[x] * 30) for x in range(0, W, 4)] + [(W, H)], tuple(int(c * .5 + w * .5) for c, w in zip(fels, wolke)), blur=2)
    nebel(img, 606, 130, wolke, 2.2, rnd)
    # Felswand rechts: gezackt, mit senkrechten Streifen, nach rechts dunkler
    k1, k2 = kamm(H, 0.62, rnd), kamm(H, 0.8, rnd)
    wand = [(W, 0)] + [(1190 - y * 0.24 + k1[y] * 46 + k2[y] * 12, y) for y in range(0, H, 3)] + [(W, H)]
    flaeche(img, wand, fels_textur(fels, rnd))
    schatten = Image.linear_gradient('L').rotate(90).resize(img.size).point(lambda v: int(max(0, v - 120) * .9))
    maske = Image.new('L', img.size, 0)
    ImageDraw.Draw(maske).polygon(wand, fill=255)
    img.paste(Image.new('RGB', img.size, (8, 8, 12)), (0, 0), ImageChops.multiply(maske, ImageOps.invert(schatten).point(lambda v: 255 - v)))
    d = ImageDraw.Draw(img)
    d.line([(1190 - y * 0.24 + k1[y] * 46 + k2[y] * 12, y) for y in range(0, H, 3)], fill=tuple(min(255, c + 30) for c in fels), width=2)
    # Gesims: Weg mit gezackter Abbruchkante, oben hell, darunter die Steilwand
    kg, kf = kamm(W, 0.55, rnd), kamm(W, 0.75, rnd)
    rand_y = [700 - x * 0.04 + kg[x] * 8 + kf[x] * 3 for x in range(W)]
    flaeche(img, [(0, H)] + [(x, rand_y[x]) for x in range(0, W, 2)] + [(W, H)], fels_textur(tuple(int(c * .7) for c in fels), rnd))
    oben = [(x, rand_y[x]) for x in range(0, W, 2)]
    flaeche(img, oben + [(x, rand_y[x] + 26 + kf[x] * 8) for x in range(W - 2, -1, -2)], fels_textur(tuple(int(c * 1.08) for c in fels), rnd, 16))
    d = ImageDraw.Draw(img)
    d.line(oben, fill=kante, width=2)
    for _ in range(26):
        x = rnd.uniform(60, W - 60)
        b = brocken(x, rand_y[int(x)] + 6, rnd.uniform(4, 11), rnd)
        d.polygon(b, fill=tuple(int(c * .6) for c in fels))
    return img, rand_y


def speichern(img, name):
    img = img.filter(ImageFilter.SMOOTH)
    for suffix, breite, q in (('', 1600, 62), ('-klein', 720, 58)):
        k = img.copy()
        k.thumbnail((breite, breite))
        k.save(os.path.join(IMG, f'{name}{suffix}.webp'), 'WEBP', quality=q, method=6)
    print(name)


# ---------- Die Bilder ----------
def berg():
    rnd = random.Random(7)
    img = verlauf([(0, (14, 16, 44)), (.35, (52, 40, 92)), (.55, (156, 92, 120)), (.68, (238, 170, 118)), (.72, (250, 214, 160)), (1, (30, 34, 60))])
    sterne(img, 260, H * .5, rnd)
    for x, y in ((310, 120), (360, 165), (300, 210), (255, 160)):   # die vier Sterne
        img = stern(img, x, y, 3.2)
    img = leuchten(img, 470, 650, 420, (255, 170, 90), 0.9)
    img = strahlen(img, 470, 650, (255, 190, 130), rnd, n=9, alpha=26)
    # Meer
    d = ImageDraw.Draw(img)
    for y in range(648, H):
        t = (y - 648) / (H - 648)
        d.line([(0, y), (W, y)], fill=(int(70 - 50 * t), int(62 - 40 * t), int(96 - 50 * t)))
    for _ in range(320):
        y = rnd.uniform(652, H)
        x = rnd.gauss(520, 260)
        lng = rnd.uniform(10, 60) * (1 - (y - 650) / 400)
        d.line([(x, y), (x + lng, y)], fill=(255, 196, 140) if rnd.random() < .6 else (180, 150, 190), width=1)
    # der Berg: unregelmäßig, mit Schulter rechts, Rinnen und vom Morgen links angeleuchtet
    k1, k2 = kamm(W, 0.58, rnd), kamm(W, 0.85, rnd)
    gipfel = 820

    def hang(x):
        u = (x - gipfel) / (560 if x < gipfel else 680)
        grund = max(0, 1 - abs(u)) ** (1.75 if x < gipfel else 1.5)
        schulter = 0.16 * max(0, 1 - abs((x - 1080) / 190)) ** 2 + 0.08 * max(0, 1 - abs((x - 560) / 120)) ** 2
        return 662 - (grund + schulter) * 560 + k1[x] * 52 * (grund + .2) + k2[x] * 12
    umriss = [(x, hang(x)) for x in range(200, 1520, 3)]
    flaeche(img, [(200, 664)] + umriss + [(1520, 664)], fels_textur((50, 44, 84), rnd, 16))
    maske = Image.new('L', img.size, 0)
    ImageDraw.Draw(maske).polygon([(200, 664)] + umriss + [(1520, 664)], fill=255)
    licht = Image.linear_gradient('L').rotate(90).resize(img.size)
    licht = ImageChops.multiply(maske, ImageOps.invert(licht).point(lambda v: int(max(0, v - 70) * .75)))
    img.paste(Image.new('RGB', img.size, (210, 130, 112)), (0, 0), licht.filter(ImageFilter.GaussianBlur(10)))
    d = ImageDraw.Draw(img)
    d.line(umriss, fill=(236, 170, 140), width=2)
    # Gesimse: sieben Bänder rund um den Berg, leicht wellig, mit winzigen Seelen
    for i in range(7):
        y = 610 - i * 66
        rx = 600 * max(0.05, 1 - (662 - y) / 560) ** 1.7
        ry = 14 + rx * .03
        pts = []
        for j in range(60):
            a = math.radians(8 + j * 164 / 59)
            px = gipfel + 10 + math.cos(a) * rx
            pts.append((px, y + math.sin(a) * ry + k2[int(px) % W] * 3))
        d.line(pts, fill=(28, 22, 40), width=4)
        d.line([(px, py - 2) for px, py in pts], fill=(236, 188, 150), width=1)
        for _ in range(int(12 * (1 - i / 8))):
            px, py = pts[rnd.randrange(4, 56)]
            d.ellipse([px - 1.4, py - 6, px + 1.4, py - 1], fill=(26, 20, 34))
    img = leuchten(img, gipfel + 8, hang(gipfel + 8) - 6, 70, (255, 150, 60), 1.0)   # Feuer auf dem Gipfel
    nebel(img, 650, 110, (230, 170, 160), 1.8, rnd)
    # Ufer, Boot, eine Gestalt
    ku = kamm(W, 0.6, rnd)
    flaeche(img, [(0, H)] + [(x, 812 + ku[x] * 18 + max(0, x - 900) * .25) for x in range(0, W, 4)] + [(W, H)], textur((20, 16, 24), rnd, 8))
    d = ImageDraw.Draw(img)
    d.polygon([(560, 790), (700, 790), (684, 806), (578, 806)], fill=(16, 12, 18))
    d.line([(632, 790), (640, 742)], fill=(16, 12, 18), width=3)
    figur(d, 470, 818, 70, (12, 10, 14), kante=(230, 160, 120))
    speichern(korn_und_rand(img), 'berg')


def stolz():
    rnd = random.Random(11)
    img, r = gesims_grund(rnd, [(0, (20, 30, 70)), (.45, (80, 96, 150)), (.66, (210, 200, 210)), (.72, (246, 226, 196)), (1, (80, 86, 120))],
                          (226, 222, 236), (70, 72, 98), (190, 194, 214), sonne=(560, 610, 300, (255, 220, 170)), sternzahl=90)
    d = ImageDraw.Draw(img)
    # Spirale (Rekursion) in die Felswand gemeißelt
    cx, cy, a, rr = 1290, 360, 0.0, 4.0
    pts = []
    while rr < 150:
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
        a += 0.12
        rr *= 1.0105
    d.line(pts, fill=(118, 120, 148), width=5)
    d.line([(x + 2, y + 2) for x, y in pts], fill=(42, 44, 62), width=2)
    for i, x in enumerate(range(420, 1160, 115)):
        h = 118 + i * 6
        figur(d, x, r[x] + 2, h, (24, 26, 40), 'gebeugt', last=(84, 84, 104) if i % 2 else (96, 94, 112), kante=(200, 196, 224), rnd=rnd)
    speichern(korn_und_rand(img), 'gesims-stolz')


def neid():
    rnd = random.Random(23)
    img, r = gesims_grund(rnd, [(0, (18, 14, 40)), (.5, (64, 52, 98)), (.7, (150, 126, 160)), (1, (60, 52, 80))],
                          (180, 170, 200), (62, 56, 82), (170, 160, 196), sonne=(800, 640, 240, (210, 170, 220)), sternzahl=220)
    # Klassendiagramm aus Sternen
    d = ImageDraw.Draw(img)
    kl = [(560, 120, 700, 210), (860, 80, 1010, 190), (720, 300, 860, 380), (980, 290, 1110, 370)]
    farbe = (224, 214, 255)
    for x0, y0, x1, y1 in kl:
        for p in ((x0, y0), (x1, y0), (x1, y1), (x0, y1)):
            img = stern(img, p[0], p[1], 1.6, farbe)
        d = ImageDraw.Draw(img)
        d.rectangle([x0, y0, x1, y1], outline=(150, 140, 200))
        d.line([(x0, y0 + 26), (x1, y0 + 26)], fill=(120, 110, 170))
    d.line([(700, 165), (860, 135)], fill=(150, 140, 200))
    d.line([(790, 210), (790, 300)], fill=(150, 140, 200))
    d.polygon([(790, 300), (782, 286), (798, 286)], outline=(190, 180, 240))
    d.line([(935, 190), (1040, 290)], fill=(150, 140, 200))
    d.polygon([(1040, 290), (1024, 284), (1034, 272)], outline=(190, 180, 240))
    for i, x in enumerate(range(450, 1150, 82)):
        figur(d, x, r[x] + 2, 104 + (i % 3) * 8, (24, 20, 36), 'sitzen', kante=(196, 178, 226))
    speichern(korn_und_rand(img), 'gesims-neid')


def zorn():
    rnd = random.Random(31)
    img, r = gesims_grund(rnd, [(0, (24, 20, 20)), (.5, (66, 56, 52)), (.75, (104, 86, 74)), (1, (40, 32, 30))],
                          (120, 104, 96), (50, 44, 42), (130, 110, 100), sonne=(780, 560, 260, (150, 70, 40)))
    d = ImageDraw.Draw(img)
    # ein einzelner Serverschrank, an dem alles hängt
    x0, x1, yb = 740, 860, r[800] + 4
    d.rectangle([x0, yb - 300, x1, yb], fill=(20, 18, 18))
    for y in range(int(yb - 284), int(yb - 20), 22):
        d.rectangle([x0 + 10, y, x1 - 10, y + 14], outline=(46, 40, 40))
        d.ellipse([x1 - 24, y + 5, x1 - 19, y + 10], fill=(40, 90, 50) if rnd.random() < .5 else (36, 34, 34))
    img = leuchten(img, x1 - 21, yb - 255, 60, (255, 40, 30), 1.0)
    d = ImageDraw.Draw(img)
    d.ellipse([x1 - 25, yb - 259, x1 - 17, yb - 251], fill=(255, 80, 60))
    for x in (520, 610, 990, 1080):
        figur(d, x, r[x] + 2, 120, (22, 18, 18), 'stehen', kante=(150, 84, 60))
    for y in (420, 560, 700):
        nebel(img, y, 260, (88, 78, 74), 2.6, rnd)
    speichern(korn_und_rand(img, rand=0.6), 'gesims-zorn')


def traegheit():
    rnd = random.Random(41)
    img, r = gesims_grund(rnd, [(0, (40, 24, 40)), (.4, (150, 70, 60)), (.62, (246, 150, 80)), (.7, (255, 214, 140)), (1, (90, 50, 50))],
                          (255, 200, 150), (80, 48, 44), (220, 160, 120), sonne=(820, 600, 340, (255, 190, 110)))
    # Wolken wie Balken eines Gantt-Diagramms
    d = ImageDraw.Draw(img)
    balken = [(420, 150, 760), (620, 205, 980), (900, 260, 1180), (560, 315, 700), (1000, 370, 1240)]
    for x0, y, x1 in balken:
        maske = Image.new('L', img.size, 0)
        ImageDraw.Draw(maske).rounded_rectangle([x0, y, x1, y + 26], 13, fill=200)
        img.paste(Image.new('RGB', img.size, (255, 222, 186)), (0, 0), maske.filter(ImageFilter.GaussianBlur(5)))
    d = ImageDraw.Draw(img)
    for i, x in enumerate(range(380, 1180, 100)):
        h = 116 + (i % 2) * 10
        for s in range(1, 4):
            d.line([(x - h * .3 - s * 14, r[x] - h * .3 - s * 6), (x - h * .3 - s * 14 - 40, r[x] - h * .3 - s * 6)], fill=(150, 90, 70), width=2)
        figur(d, x, r[x] + 2, h, (40, 22, 22), 'rennen', kante=(255, 196, 130))
    speichern(korn_und_rand(img), 'gesims-traegheit')


def geiz():
    rnd = random.Random(53)
    img, r = gesims_grund(rnd, [(0, (30, 24, 20)), (.45, (112, 84, 50)), (.66, (220, 176, 110)), (.72, (246, 214, 160)), (1, (70, 54, 40))],
                          (240, 210, 160), (72, 58, 42), (210, 176, 120), sonne=(760, 620, 300, (255, 210, 140)), sternzahl=60)
    d = ImageDraw.Draw(img)
    for i, x in enumerate(range(420, 1160, 150)):
        figur(d, x, r[x] + 4, 150, (30, 24, 18), 'liegen', kante=(250, 216, 150))
    for _ in range(90):
        x = rnd.uniform(380, 1200)
        y = r[int(x)] + rnd.uniform(6, 120)
        g = rnd.uniform(3, 6)
        d.ellipse([x - g, y - g * .5, x + g, y + g * .5], fill=(232, 190, 100) if rnd.random() < .7 else (160, 130, 80))
    # eine Schriftrolle (Arbeitsvertrag) am Boden
    d.rounded_rectangle([760, r[800] + 30, 900, r[800] + 52], 10, fill=(214, 196, 160))
    for y in (r[800] + 37, r[800] + 44):
        d.line([(778, y), (884, y)], fill=(150, 130, 100), width=1)
    speichern(korn_und_rand(img), 'gesims-geiz')


def voellerei():
    rnd = random.Random(67)
    img, r = gesims_grund(rnd, [(0, (12, 28, 34)), (.45, (40, 82, 84)), (.68, (150, 186, 160)), (.74, (214, 222, 180)), (1, (40, 60, 56))],
                          (200, 220, 200), (42, 62, 60), (160, 196, 170), sonne=(640, 630, 260, (220, 240, 190)), sternzahl=120)
    d = ImageDraw.Draw(img)
    # der umgedrehte Baum: Krone unten breit, oben schmal, Früchte in Zeilen und Spalten
    bx, by = 800, r[800]
    d.polygon([(bx - 14, by), (bx + 14, by), (bx + 8, by - 160), (bx - 8, by - 160)], fill=(26, 34, 32))
    # Krone aus vielen Blättertrauben, oben breiter als unten (Dantes umgedrehter Baum)
    maske = Image.new('L', img.size, 0)
    dm = ImageDraw.Draw(maske)
    for _ in range(90):
        t = rnd.random()
        y = by - 150 - t * 290
        breite = 110 + t * 190
        x = bx + rnd.uniform(-breite, breite)
        r0 = rnd.uniform(22, 44)
        dm.ellipse([x - r0, y - r0 * .8, x + r0, y + r0 * .8], fill=255)
    img.paste(textur((34, 58, 50), rnd, 18), (0, 0), maske.filter(ImageFilter.GaussianBlur(2)))
    d = ImageDraw.Draw(img)
    for zeile in range(5):
        y = by - 190 - zeile * 46
        breite = 150 + zeile * 34
        for spalte in range(7):
            x = bx - breite + spalte * (2 * breite / 6)
            img = leuchten(img, x, y, 16, (255, 200, 120), 0.5)
            d = ImageDraw.Draw(img)
            d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(236, 150, 70))
    for x in (520, 600, 1000, 1090):
        figur(d, x, r[x] + 2, 130, (18, 24, 24), 'mager', kante=(206, 232, 196))
    speichern(korn_und_rand(img), 'gesims-voellerei')


def feuerwand():
    rnd = random.Random(79)
    img = verlauf([(0, (6, 6, 14)), (.5, (24, 14, 22)), (.7, (90, 34, 20)), (1, (20, 10, 10))])
    sterne(img, 240, H * .45, rnd)
    img = leuchten(img, 800, 600, 700, (255, 110, 40), 0.85)
    # Flammenzungen über die ganze Breite
    lage = Image.new('RGB', img.size, (0, 0, 0))
    d = ImageDraw.Draw(lage)
    for schicht, (farbe, hoehe) in enumerate((((210, 60, 20), 420), ((250, 130, 40), 330), ((255, 210, 120), 220))):
        for _ in range(140 - schicht * 30):
            x = rnd.uniform(160, 1440)
            h = rnd.uniform(.5, 1) * hoehe * (1 - abs(x - 800) / 1100)
            b = rnd.uniform(26, 60) * (1 - schicht * .25)
            y = 690
            d.polygon([(x - b, y), (x - b * .5, y - h * .55), (x + rnd.uniform(-20, 20), y - h), (x + b * .5, y - h * .55), (x + b, y)], fill=farbe)
    lage = lage.filter(ImageFilter.GaussianBlur(5))
    img = ImageChops.screen(img, lage)
    img = ImageChops.screen(img, lage.filter(ImageFilter.GaussianBlur(40)))
    # Gesims im Vordergrund und eine Gestalt vor dem Feuer
    kg = kamm(W, 0.5, rnd)
    flaeche(img, [(0, H)] + [(x, 712 + kg[x] * 8) for x in range(0, W, 3)] + [(W, H)], textur((24, 14, 12), rnd, 10))
    d = ImageDraw.Draw(img)
    figur(d, 800, 760, 150, (8, 6, 6), 'stehen', kante=(255, 170, 80))
    for _ in range(160):
        x, y = rnd.gauss(800, 360), rnd.uniform(200, 690)
        d.ellipse([x - 1.2, y - 1.2, x + 1.2, y + 1.2], fill=(255, 190, 110))
    speichern(korn_und_rand(img, rand=0.6), 'feuerwand')


def kokytos():
    """kreis-07 (Riese in Ketten über der Schlucht) eisblau eingefärbt, mit Schnee"""
    rnd = random.Random(97)
    quelle = Image.open(os.path.join(IMG, 'kreis-07.webp')).convert('RGB').resize((W, H), Image.LANCZOS)
    grau = ImageOps.autocontrast(quelle.convert('L'), cutoff=1)
    img = ImageOps.colorize(grau, (4, 10, 22), (214, 236, 250), mid=(46, 86, 120), midpoint=110)
    img = leuchten(img, 1360, 140, 380, (120, 190, 255), 0.6)
    d = ImageDraw.Draw(img)
    for _ in range(900):
        x, y = rnd.uniform(0, W), rnd.uniform(0, H)
        g = rnd.choice([0.7, 1, 1, 1.4, 2])
        d.ellipse([x - g, y - g, x + g, y + g], fill=(220, 236, 250))
    nebel(img, 820, 200, (190, 220, 240), 2.0, rnd)
    speichern(korn_und_rand(img, rand=0.5), 'kokytos')


if __name__ == '__main__':
    for f in (berg, stolz, neid, zorn, traegheit, geiz, voellerei, feuerwand, kokytos):
        f()
