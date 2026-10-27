"""Malt das Pixelparadies: Himmel und schwebende Inseln in 8 Bit.

Aufruf: python3 -I tools/pixel_bilder.py   (schreibt nach src/img/, nur mit Pillow, immer gleiches Ergebnis)

Hölle und Berg sind gemalt und düster. Das Pixelparadies ist das Gegenteil: kräftige Farben, harte Kanten,
dunkle Umrisse für Kontrast, ein bisschen Leuchten wie in einem Märchenwald. Alles wird Pixel für Pixel
in kleiner Auflösung gezeichnet; die App vergrößert es ohne Weichzeichnen (image-rendering: pixelated).
    himmel-karte         Taghimmel über der Inselkarte, eckige Sonne, ferne Inseln
    himmel-<insel>       je ein Himmel für die sieben Inseln (Mond, Merkur, Venus, Sonne, Mars, Jupiter, Saturn)
    himmel-glitch        Nachthimmel über dem Großen Glitch, mit Störstreifen
    insel-<insel>        die schwebende Insel selbst, freigestellt, mit einem Motiv aus ihrem Thema
    insel-glitch         die zerrissene Insel ganz oben
Die Himmel sind 320 × 180 groß, die Inseln 112 × 124. Wichtiges steht im Himmel mittig,
weil das Handy im Hochformat nur die Mitte zeigt.
"""
import math
import os
import random

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'src', 'img')
HW, HH = 320, 180          # Himmel
IW, IH = 112, 124          # Insel
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def hx(s, a=255):
    s = s.lstrip('#')
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), a)


def misch(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(4))


def dunkler(c, f):
    return (int(c[0] * f), int(c[1] * f), int(c[2] * f), c[3])


def heller(c, t):
    return misch(c, (255, 255, 255, c[3]), t)


UMRISS = hx('1c1233')


# ---------- Leinwand ----------
class Pixel:
    def __init__(self, w, h, grund=(0, 0, 0, 0)):
        self.w, self.h = w, h
        self.img = Image.new('RGBA', (w, h), grund)
        self.px = self.img.load()

    def p(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h and c is not None:
            if len(c) == 4 and c[3] < 255:
                alt = self.px[x, y]
                a = c[3] / 255
                if alt[3] == 0:
                    self.px[x, y] = c
                else:
                    self.px[x, y] = (int(alt[0] + (c[0] - alt[0]) * a), int(alt[1] + (c[1] - alt[1]) * a), int(alt[2] + (c[2] - alt[2]) * a), max(alt[3], c[3]))
            else:
                self.px[x, y] = c

    def g(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[x, y]
        return (0, 0, 0, 0)

    def rect(self, x0, y0, x1, y1, c):
        """beide Ecken eingeschlossen"""
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.p(x, y, c)

    def linie(self, x0, y0, x1, y1, c):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) or 1
        for i in range(n + 1):
            self.p(round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n), c)

    def kreis(self, cx, cy, r, c):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                if (x - cx + .5) ** 2 + (y - cy + .5) ** 2 <= r * r:
                    self.p(x, y, c)

    def umriss(self, farbe=UMRISS):
        """Ein Pixel dunkler Rand um alles, was nicht durchsichtig ist: Kontrast vor hellem Himmel"""
        voll = {(x, y) for y in range(self.h) for x in range(self.w) if self.px[x, y][3] > 200}
        for x, y in list(voll):
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n not in voll and 0 <= n[0] < self.w and 0 <= n[1] < self.h and self.px[n][3] < 120:
                    self.px[n] = farbe


# Winzige Schrift für Schilder, 3 × 5
SCHRIFT = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '011', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'], '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'], '%': ['101', '001', '010', '100', '101'], '{': ['011', '010', '110', '010', '011'],
    '}': ['110', '010', '011', '010', '110'], '§': ['011', '110', '101', '011', '110'], '?': ['111', '001', '011', '000', '010'],
    '<': ['001', '010', '100', '010', '001'], '>': ['100', '010', '001', '010', '100'], '/': ['001', '001', '010', '100', '100'],
    'O': ['111', '101', '101', '101', '111'], 'K': ['101', '110', '100', '110', '101'], ' ': ['000', '000', '000', '000', '000']
}


def schrift(c, x, y, text, farbe):
    for z in text:
        for j, zeile in enumerate(SCHRIFT[z]):
            for i, b in enumerate(zeile):
                if b == '1':
                    c.p(x + i, y + j, farbe)
        x += 4


# ---------- Himmel ----------
def himmel_verlauf(c, baender, steil=2.6):
    """Farbbänder von oben nach unten, an den Übergängen mit Bayer-Raster gemischt"""
    n = len(baender) - 1
    for y in range(c.h):
        f = y / (c.h - 1) * n
        i = min(n - 1, int(f))
        t = f - i
        t = max(0.0, min(1.0, (t - .5) * steil + .5))
        for x in range(c.w):
            c.px[x, y] = baender[i + 1] if t > (BAYER[y % 4][x % 4] + .5) / 16 else baender[i]


def leuchten(c, cx, cy, r0, r1, farbe, staerke=.55):
    """Ein Hof aus Ringen, gerastert statt weichgezeichnet"""
    for y in range(int(cy - r1), int(cy + r1) + 1):
        for x in range(int(cx - r1), int(cx + r1) + 1):
            d = math.hypot(x - cx + .5, y - cy + .5)
            if r0 <= d <= r1:
                t = (1 - (d - r0) / (r1 - r0)) * staerke
                stufe = round(t * 4) / 4
                if stufe > (BAYER[y % 4][x % 4] + .5) / 16 * .25 + .02:
                    alt = c.g(x, y)
                    c.p(x, y, misch(alt, farbe, stufe))


def sterne(c, n, rnd, y_max, farben=(hx('ffffff'), hx('fff4c0'), hx('c8e0ff'))):
    for _ in range(n):
        x, y = rnd.randrange(c.w), rnd.randrange(int(y_max))
        f = rnd.choice(farben)
        c.p(x, y, f)
        if rnd.random() < .12:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                c.p(x + dx, y + dy, misch(c.g(x + dx, y + dy), f, .5))


def wolke(c, x, y, breite, rnd, hell=hx('ffffff'), schatten=None):
    """Eine Pixelwolke wie in Fez: unten gerade, oben ein paar runde Buckel, der größte in der Mitte.
    Unten und rechts an jedem Buckel liegt Schatten, oben links eine helle Kante."""
    schatten = schatten or hx('cfe6f7')
    unten = y
    n = max(2, breite // 12)
    buckel = []
    for i in range(n):
        t = (i + .5) / n
        r = int(4 + (1 - abs(t - .5) * 2) * min(9, breite / 6) + rnd.randint(-1, 1))
        buckel.append((x + int(t * breite), unten - r // 2 - 1, max(3, r)))
    pixel = set()
    for (bx, by, r) in buckel:
        for yy in range(by - r, unten + 1):
            for xx in range(bx - r, bx + r + 1):
                if (xx - bx + .5) ** 2 + (yy - by + .5) ** 2 <= r * r:
                    pixel.add((xx, yy))
    for xx in range(x + 2, x + breite - 1):          # flacher Boden zwischen den Buckeln
        for yy in range(unten - 3, unten + 1):
            pixel.add((xx, yy))
    for (xx, yy) in pixel:
        unterkante = yy >= unten - 1
        rechts = (xx + 1, yy) not in pixel or (xx + 1, yy + 1) not in pixel and (xx, yy + 1) in pixel
        c.p(xx, yy, schatten if unterkante or (rechts and yy > unten - 6) else hell)
    rand = misch(hell, schatten, .35)
    for (xx, yy) in pixel:
        if (xx, yy - 1) not in pixel and (xx - 1, yy) in pixel and rnd.random() < .5:
            c.p(xx, yy + 1, rand)


def ferne_insel(c, cx, cy, b, farbe, rnd):
    """Eine kleine Insel weit weg, nur Umriss in Himmelsfarbe"""
    for r in range(0, b // 2):
        hw = b // 2 - r * rnd.choice([1, 1, 2])
        if hw <= 0:
            break
        c.rect(cx - hw, cy + r, cx + hw, cy + r, farbe)
    c.rect(cx - b // 2 - 1, cy - 1, cx + b // 2 + 1, cy, heller(farbe, .15))


def himmel_bauen(name, baender, rnd, koerper=None, wolken=8, sterne_n=0, fern=None, wolken_farbe=None):
    c = Pixel(HW, HH)
    himmel_verlauf(c, baender)
    if sterne_n:
        sterne(c, sterne_n, rnd, HH * .55)
    if koerper:
        koerper(c)
    for _ in range(fern or 0):
        ferne_insel(c, rnd.randrange(10, HW - 10), rnd.randrange(70, 140), rnd.randrange(8, 18), misch(baender[2], baender[0], .35), rnd)
    hell, schatten = wolken_farbe or (hx('ffffff'), hx('cfe6f7'))
    for i in range(wolken):
        y = int(30 + (i / max(1, wolken - 1)) * 125 + rnd.randint(-8, 8))
        wolke(c, rnd.randrange(-30, HW - 20), y, rnd.randrange(30, 84), rnd, hell, schatten)
    speichern(c.img.convert('RGB'), name, beide=True)


def sonne(c, cx, cy, r=13):
    """Eine runde, aber kantige Sonne mit Hof und acht Strahlenblöcken"""
    leuchten(c, cx, cy, r, r + 28, hx('fff6c8'), .6)
    for i in range(8):
        a = i * math.pi / 4
        for k in range(3):
            d = r + 4 + k
            c.rect(cx + round(math.cos(a) * d) - 1, cy + round(math.sin(a) * d) - 1, cx + round(math.cos(a) * d), cy + round(math.sin(a) * d), hx('ffe680'))
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            d = (x - cx + .5) ** 2 + (y - cy + .5) ** 2
            if d <= r * r:
                licht = (x - cx) + (y - cy) < -r * .95 and d > (r * .55) ** 2
                c.p(x, y, hx('fffbe8') if licht else hx('ffe14a') if d < (r * .8) ** 2 else hx('ffc83a'))


def mond(c, cx, cy, r=15):
    leuchten(c, cx, cy, r, r + 22, hx('e8e0ff'), .5)
    c.kreis(cx, cy, r, hx('f6f0d8'))
    for x, y, k in ((-5, -4, 3), (4, 3, 4), (-2, 7, 2), (7, -6, 2)):
        c.kreis(cx + x, cy + y, k, hx('ddd2b0'))
    for y in range(cy - r, cy + r + 1):             # Schatten rechts unten
        for x in range(cx - r, cx + r + 1):
            if (x - cx + .5) ** 2 + (y - cy + .5) ** 2 <= r * r and (x - cx) + (y - cy) > r * .9:
                c.p(x, y, hx('cfc2a0'))


def planet(c, cx, cy, r, baender, ring=None, fleck=None):
    leuchten(c, cx, cy, r, r + 14, heller(baender[0], .4), .35)
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx + .5) ** 2 + (y - cy + .5) ** 2 <= r * r:
                b = baender[int((y - cy + r) / (2 * r + 1) * len(baender)) % len(baender)]
                if (x - cx) + (y - cy) > r * .7:
                    b = dunkler(b, .78)
                c.p(x, y, b)
    if fleck:
        fx, fy, fr, ff = fleck
        for y in range(cy + fy - fr, cy + fy + fr + 1):
            for x in range(cx + fx - fr * 2, cx + fx + fr * 2 + 1):
                if ((x - cx - fx) / (fr * 1.8)) ** 2 + ((y - cy - fy) / fr) ** 2 <= 1:
                    c.p(x, y, ff)
    if ring:
        for y in range(cy - r - 8, cy + r + 9):
            for x in range(cx - r * 2 - 6, cx + r * 2 + 7):
                dy = y - cy - (x - cx) * .2
                e = ((x - cx) / (r * 2.2)) ** 2 + (dy / (r * .6)) ** 2
                vorn = dy > 0 or (x - cx) ** 2 + (y - cy) ** 2 > r * r
                if .55 <= e <= 1.0 and vorn:
                    c.p(x, y, ring[0] if e < .75 else ring[1])


# ---------- Insel ----------
GRAS = (hx('b4f25a'), hx('6cd43c'), hx('3aa832'), hx('257a2c'))
ERDE = [hx('e08a34'), hx('c86e26'), hx('b45e20'), hx('9a4c1a'), hx('7e3c16'), hx('663012')]
KRISTALL = (hx('d6b4ff'), hx('a87af0'), hx('7a4ad8'), hx('4e2c9a'))


def kachel(c, x, y, grund, rechts_dunkel=False):
    """Fez-Ziegel 6 × 6: oben und links Licht, unten und rechts Schatten, innen ein geschnitzter Rahmen"""
    if rechts_dunkel:
        grund = dunkler(grund, .86)
    hell, dunk, kern = heller(grund, .18), dunkler(grund, .72), dunkler(grund, .86)
    c.rect(x, y, x + 5, y + 5, grund)
    c.rect(x, y, x + 5, y, hell)
    c.rect(x, y, x, y + 5, hell)
    c.rect(x, y + 5, x + 5, y + 5, dunk)
    c.rect(x + 5, y, x + 5, y + 5, dunk)
    c.rect(x + 2, y + 2, x + 3, y + 3, kern)


def insel(c, cx, top, spalten, reihen, rnd, gras=GRAS, erde=ERDE, kristall=KRISTALL, ranken=5):
    """Eine schwebende Insel: Ziegelkörper, der sich stufig nach unten verjüngt, Gras mit Tropfen, Ranken, ein Kristall"""
    T = 6
    links = cx - spalten * T // 2
    a, b = 0, spalten
    zeilen = []
    ziel = max(1, spalten - 2)
    for r in range(reihen):
        zeilen.append((a, b))
        rest = reihen - r - 1
        noetig = (b - a) - 2
        if rest <= 0 or noetig <= 0:
            continue
        schritt = noetig / rest
        a += min(noetig // 2 + 1, max(0, int(schritt / 2 + rnd.random() * 1.2) if r else rnd.choice([0, 0, 1])))
        b -= min(noetig // 2 + 1, max(0, int(schritt / 2 + rnd.random() * 1.2) if r else rnd.choice([0, 1])))
        if b - a < 2:
            b = a + 2
    for r, (a, b) in enumerate(zeilen):
        for s in range(a, b):
            x = links + s * T
            kachel(c, x, top + r * T, erde[min(r, len(erde) - 1)], x + 3 > cx + T)
    unten = top + reihen * T
    la, lb = zeilen[-1]
    # Kristall unten in der Mitte
    kx0, kx1 = links + la * T - 2, links + lb * T + 1
    kh = rnd.randint(14, 20)
    for i in range(kh):
        w = (kx1 - kx0) * (1 - i / kh) / 2
        m = (kx0 + kx1) / 2
        for x in range(int(m - w), int(m + w) + 1):
            f = kristall[0] if x < m - w / 3 else kristall[1] if x < m + w / 4 else kristall[2]
            c.p(x, unten + i, f)
    c.p(int((kx0 + kx1) / 2) - 1, unten + 2, hx('ffffff'))
    leuchten_alpha(c, (kx0 + kx1) / 2, unten + kh / 2, 4, 14, kristall[1])
    # Wurzeln
    for _ in range(4):
        r = rnd.randrange(len(zeilen))
        a, b = zeilen[r]
        x = links + rnd.randint(a, b - 1) * T + rnd.randint(1, 4)
        y = top + (r + 1) * T
        if r + 1 < len(zeilen) and zeilen[r + 1][0] <= (x - links) // T < zeilen[r + 1][1]:
            continue
        for i in range(rnd.randint(3, 7)):
            c.p(x + (1 if i > 3 and i % 2 else 0), y + i, hx('5a3018'))
    # Gras: oben, mit Überhang und Tropfen über die Kante
    a, b = zeilen[0]
    x0, x1 = links + a * T - 1, links + b * T
    c.rect(x0, top - 2, x1, top + 1, gras[1])
    c.rect(x0, top - 3, x1, top - 3, gras[0])
    c.rect(x0, top + 1, x1, top + 1, gras[2])
    for x in range(x0, x1 + 1):
        if rnd.random() < .35:
            d = rnd.randint(1, 4)
            c.rect(x, top + 1, x, top + 1 + d, gras[2])
            c.p(x, top + 2 + d, gras[3])
        if rnd.random() < .18:
            c.p(x, top - 4, gras[0])
    for seite in (x0 - 1, x1 + 1):
        c.rect(seite, top - 2, seite, top + rnd.randint(2, 6), gras[2])
    # Ranken an den Kanten
    for _ in range(ranken):
        r = rnd.randrange(min(3, len(zeilen)))
        a, b = zeilen[r]
        x = links + (a * T - 1 if rnd.random() < .5 else b * T) + rnd.choice([0, 1])
        y = top + r * T + 1
        lang = rnd.randint(6, 20)
        for i in range(lang):
            c.p(x, y + i, gras[3] if i % 4 == 3 else gras[2])
            if i % 3 == 1:
                c.p(x + (1 if (i // 3) % 2 else -1), y + i, gras[1])
    return zeilen, links


def leuchten_alpha(c, cx, cy, r0, r1, farbe):
    for y in range(int(cy - r1), int(cy + r1) + 1):
        for x in range(int(cx - r1), int(cx + r1) + 1):
            d = math.hypot(x - cx, y - cy)
            if r0 <= d <= r1 and c.g(x, y)[3] == 0:
                t = 1 - (d - r0) / (r1 - r0)
                a = int(round(t * 3) / 3 * 90)
                if a and (BAYER[y % 4][x % 4] / 16) < t + .2:
                    c.p(x, y, (farbe[0], farbe[1], farbe[2], a))


# ---------- Bauten ----------
WAND, RAHMEN, TUER = hx('f4e2c4'), hx('8a3a5c'), hx('f08a2a')


def haus(c, x, y, w, h, rnd, wand=WAND, rahmen=RAHMEN, tuer=TUER, gras=GRAS):
    """Ein Fez-Häuschen: helle Wand mit farbigem Rahmen, Tür, Fenster, Grasdach. y ist die Unterkante."""
    c.rect(x, y - h + 1, x + w - 1, y, wand)
    c.rect(x, y - h + 1, x + w - 1, y - h + 1, rahmen)
    c.rect(x, y, x + w - 1, y, rahmen)
    c.rect(x, y - h + 1, x, y, rahmen)
    c.rect(x + w - 1, y - h + 1, x + w - 1, y, rahmen)
    c.rect(x + w - 4, y - h + 2, x + w - 2, y - 1, dunkler(wand, .9))     # Schattenseite
    tx = x + w // 2 - 2
    c.rect(tx, y - 7, tx + 3, y - 1, tuer)
    c.rect(tx, y - 7, tx + 3, y - 7, rahmen)
    c.p(tx + 3, y - 4, hx('5a2a10'))
    if w >= 14:
        fx = x + 2
        c.rect(fx, y - h + 4, fx + 3, y - h + 7, hx('7ad0ff'))
        c.rect(fx, y - h + 4, fx + 3, y - h + 4, rahmen)
        c.p(fx + 1, y - h + 5, hx('d8f4ff'))
    c.rect(x - 1, y - h - 1, x + w, y - h, gras[1])
    c.rect(x - 1, y - h - 2, x + w, y - h - 2, gras[0])
    for i in range(x - 1, x + w + 1):
        if rnd.random() < .3:
            c.rect(i, y - h + 1, i, y - h + rnd.randint(1, 3), gras[2])


def wuerfelbaum(c, x, y, rnd, krone=None, groesse=9):
    """Ein Baum mit würfelförmiger Krone"""
    krone = krone or (hx('8be04a'), hx('5cc23a'), hx('3a9230'))
    c.rect(x - 1, y - 6, x, y, hx('7a4a22'))
    c.rect(x, y - 6, x, y, hx('5a3418'))
    k0 = y - 6 - groesse
    c.rect(x - groesse // 2, k0, x + groesse // 2, y - 6, krone[1])
    c.rect(x - groesse // 2, k0, x + groesse // 2, k0, krone[0])
    c.rect(x - groesse // 2, k0, x - groesse // 2, y - 6, krone[0])
    c.rect(x + groesse // 2 - 1, k0 + 1, x + groesse // 2, y - 6, krone[2])
    c.rect(x - groesse // 2, y - 6, x + groesse // 2, y - 6, krone[2])
    for _ in range(4):
        c.p(rnd.randint(x - groesse // 2 + 1, x + groesse // 2 - 2), rnd.randint(k0 + 1, y - 8), krone[0])


def rohr(c, punkte, farbe=hx('3a3f55')):
    """Ein dickes Rohr wie in Fez, mit Lichtkante"""
    hell = heller(farbe, .25)
    for (x0, y0), (x1, y1) in zip(punkte, punkte[1:]):
        if x0 == x1:
            c.rect(x0 - 1, min(y0, y1), x0 + 1, max(y0, y1), farbe)
            c.rect(x0 - 1, min(y0, y1), x0 - 1, max(y0, y1), hell)
        else:
            c.rect(min(x0, x1), y0 - 1, max(x0, x1), y0 + 1, farbe)
            c.rect(min(x0, x1), y0 - 1, max(x0, x1), y0 - 1, hell)
    for x, y in punkte[1:-1]:
        c.rect(x - 2, y - 2, x + 2, y + 2, dunkler(farbe, .8))
        c.rect(x - 2, y - 2, x + 2, y - 2, hell)


def blinklicht(c, x, y, farbe):
    c.p(x, y, farbe)
    leuchten_alpha(c, x + .5, y + .5, 1, 5, farbe)


# ---------- Die sieben Inseln und der Glitch ----------
def insel_mond(rnd):
    """Projekt, Qualität und Service: eine Baustelle, die zu 90 Prozent fertig ist. Seit Monaten."""
    c = Pixel(IW, IH)
    top = 58
    insel(c, 56, top, 14, 7, rnd)
    haus(c, 16, top - 4, 20, 16, rnd)
    # Gerüst mit Kran
    gx = 62
    gelb, grau = hx('ffc83a'), hx('8a90a8')
    for x in (gx, gx + 12):
        c.rect(x, top - 34, x, top - 4, grau)
    for y in range(top - 34, top - 3, 6):
        c.rect(gx, y, gx + 12, y, hx('b07a3a'))
        c.rect(gx, y + 1, gx + 12, y + 1, hx('7a4a22'))
    for y in range(top - 34, top - 9, 6):
        c.linie(gx + 1, y + 5, gx + 11, y + 2, grau)
    c.rect(gx + 2, top - 22, gx + 10, top - 11, hx('f4e2c4'))     # halbes Haus im Gerüst
    c.rect(gx + 2, top - 22, gx + 10, top - 22, RAHMEN)
    c.rect(gx + 5, top - 18, gx + 7, top - 15, hx('7ad0ff'))
    c.rect(gx + 6, top - 50, gx + 7, top - 34, gelb)                # Kranmast
    c.rect(gx - 14, top - 50, gx + 22, top - 49, gelb)              # Ausleger
    for x in range(gx - 14, gx + 22, 3):
        c.p(x, top - 48, hx('c8901e'))
    c.rect(gx + 18, top - 49, gx + 21, top - 46, hx('6a6f88'))       # Gegengewicht
    c.rect(gx - 12, top - 48, gx - 12, top - 40, hx('3a3f55'))       # Seil mit Haken
    c.rect(gx - 14, top - 40, gx - 10, top - 37, hx('ff6a3a'))       # hängender Ziegel
    # Schild: 90 %
    c.rect(38, top - 18, 38, top - 4, hx('7a4a22'))
    c.rect(28, top - 26, 50, top - 16, hx('ffffff'))
    c.rect(28, top - 26, 50, top - 26, hx('ff4f6a'))
    c.rect(30, top - 18, 48, top - 17, hx('d8dde8'))
    c.rect(30, top - 18, 46, top - 17, hx('36c870'))                # Balken, fast voll
    schrift(c, 33, top - 24, '90%', hx('1c1233'))
    wuerfelbaum(c, 90, top - 4, rnd, groesse=9)
    c.umriss()
    return c


def insel_merkur(rnd):
    """Netze: ein Funkmast mit Blinklicht, ein Kabel mit einem Brief, Rohre wie in Fez"""
    c = Pixel(IW, IH)
    top = 58
    insel(c, 56, top, 14, 8, rnd)
    mx = 34
    stahl, stahl2 = hx('c8ccdc'), hx('8a90a8')
    for y in range(top - 46, top - 3):
        w = (y - (top - 46)) * 7 // 43
        c.p(mx - w, y, stahl)
        c.p(mx + w + 1, y, stahl2)
        if (y - top) % 6 == 0:
            c.rect(mx - w, y, mx + w + 1, y, stahl2)
    for y in range(top - 40, top - 6, 6):
        w0, w1 = (y - (top - 46)) * 7 // 43, (y + 6 - (top - 46)) * 7 // 43
        c.linie(mx - w0, y, mx + w1 + 1, y + 6, stahl2)
    c.rect(mx - 3, top - 36, mx - 2, top - 30, hx('f4f6ff'))         # Antennen
    c.rect(mx + 3, top - 30, mx + 4, top - 24, hx('f4f6ff'))
    blinklicht(c, mx, top - 48, hx('ff3a4a'))
    c.p(mx + 1, top - 48, hx('ff3a4a'))
    haus(c, 66, top - 4, 22, 18, rnd, rahmen=hx('2a6ab8'), tuer=hx('36c8e8'))
    rohr(c, [(84, top - 23), (84, top - 30), (96, top - 30), (96, top - 4)])
    # Kabel vom Mast zum Haus, durchhängend, mit Brief
    for i in range(0, 33):
        x = mx + 2 + i
        y = top - 34 + int(10 * math.sin(i / 32 * math.pi)) + i * 12 // 32
        c.p(x, y, hx('1c1233'))
    bx, by = mx + 14, top - 28
    c.rect(bx, by, bx + 6, by + 4, hx('ffffff'))
    c.linie(bx, by, bx + 3, by + 2, hx('ff4f6a'))
    c.linie(bx + 6, by, bx + 3, by + 2, hx('ff4f6a'))
    c.umriss()
    return c


def insel_venus(rnd):
    """Datenbanken: zwei Tabellen auf Pfosten, verbunden über einen Fremdschlüssel mit Herz"""
    c = Pixel(IW, IH)
    top = 58
    insel(c, 56, top, 14, 7, rnd, kristall=(hx('ffd0ec'), hx('ff8ac8'), hx('d84a9a'), hx('8a2a6a')))

    def tabelle(x, y, w, zeilen, kopf):
        c.rect(x + w // 2, y + 4 + zeilen * 4, x + w // 2, top - 4, hx('7a4a22'))
        c.rect(x, y, x + w, y + 4 + zeilen * 4, hx('ffffff'))
        c.rect(x, y, x + w, y + 3, kopf)
        for z in range(zeilen):
            yy = y + 4 + z * 4 + 3
            c.rect(x, yy, x + w, yy, hx('c8cce0'))
            c.rect(x + 2, yy - 2, x + 3, yy - 2, hx('ffc83a') if z == 0 else hx('8a90a8'))
            c.rect(x + 6, yy - 2, x + w - 3, yy - 2, hx('8a90a8'))
        c.rect(x + 5, y + 4, x + 5, y + 3 + zeilen * 4, hx('c8cce0'))

    tabelle(14, top - 36, 22, 4, hx('ff4f9a'))
    tabelle(70, top - 32, 22, 3, hx('8f5cff'))
    for x in range(37, 70):                                   # Beziehung mit Krähenfuß
        c.p(x, top - 28 + (x - 37) // 11, hx('1c1233'))
    c.linie(66, top - 26, 69, top - 28, hx('1c1233'))
    c.linie(66, top - 26, 69, top - 24, hx('1c1233'))
    hxm, hym = 51, top - 38                                    # Herz
    for j, zeile in enumerate(['0110110', '1111111', '1111111', '0111110', '0011100', '0001000']):
        for i, b in enumerate(zeile):
            if b == '1':
                c.p(hxm + i, hym + j, hx('ff7ab0') if (i + j) < 4 else hx('ff3a7a'))
    leuchten_alpha(c, hxm + 3.5, hym + 3, 4, 10, hx('ff7ab0'))
    wuerfelbaum(c, 48, top - 4, rnd, krone=(hx('ffb4dc'), hx('ff7ab8'), hx('d8489a')), groesse=8)
    wuerfelbaum(c, 98, top - 4, rnd, krone=(hx('ffb4dc'), hx('ff7ab8'), hx('d8489a')), groesse=7)
    c.umriss()
    return c


def insel_sonne(rnd):
    """Code und Modellierung: ein Turm aus Blöcken mit leuchtenden Klammern, oben eine goldene Kugel"""
    c = Pixel(IW, IH)
    top = 58
    insel(c, 56, top, 14, 8, rnd, kristall=(hx('fff4b0'), hx('ffd23a'), hx('e09a1a'), hx('9a5a10')))
    tx = 44
    stein, gold = hx('e8ecf8'), hx('ffc83a')
    for i, (w, h) in enumerate(((26, 12), (22, 12), (18, 12))):
        x = tx + (26 - w) // 2
        y1 = top - 4 - i * 12
        c.rect(x, y1 - h + 1, x + w - 1, y1, stein)
        c.rect(x, y1 - h + 1, x + w - 1, y1 - h + 1, gold)
        c.rect(x + w - 3, y1 - h + 2, x + w - 1, y1, hx('b8c0d8'))
        c.rect(x, y1, x + w - 1, y1, hx('b8c0d8'))
    c.rect(tx + 6, top - 13, tx + 18, top - 6, hx('1c2a5a'))     # Bildschirm mit { }
    schrift(c, tx + 7, top - 12, '{', hx('ffe14a'))
    schrift(c, tx + 14, top - 12, '}', hx('ffe14a'))
    c.rect(tx + 11, top - 10, tx + 12, top - 9, hx('5af0a0'))
    c.rect(tx + 8, top - 25, tx + 17, top - 19, hx('1c2a5a'))
    schrift(c, tx + 8, top - 24, '</>'[0:1], hx('7ad0ff'))
    schrift(c, tx + 11, top - 24, '/', hx('7ad0ff'))
    schrift(c, tx + 14, top - 24, '>', hx('7ad0ff'))
    c.kreis(tx + 13, top - 46, 5, gold)                          # goldene Kugel
    c.kreis(tx + 12, top - 47, 2, hx('fff4c0'))
    leuchten_alpha(c, tx + 13, top - 46, 6, 16, hx('ffe14a'))
    c.rect(tx + 12, top - 41, tx + 13, top - 40, gold)
    wuerfelbaum(c, 22, top - 4, rnd, groesse=10)
    wuerfelbaum(c, 88, top - 4, rnd, groesse=8)
    c.umriss()
    return c


def insel_mars(rnd):
    """Sicherheit: eine Burg mit Zinnen, Fallgitter, Fahne und einem Schild mit Schloss"""
    c = Pixel(IW, IH)
    top = 58
    insel(c, 56, top, 14, 7, rnd, erde=[hx('e0743a'), hx('c85a2a'), hx('a8441e'), hx('873418'), hx('6a2614')],
          kristall=(hx('ffc0b0'), hx('ff6a5a'), hx('d83a3a'), hx('8a1a2a')))
    mauer, mauer2 = hx('c8ccdc'), hx('9aa0b8')

    def zinnen(x0, x1, y):
        for x in range(x0, x1 + 1, 4):
            c.rect(x, y - 3, min(x + 1, x1), y - 1, mauer)

    c.rect(14, top - 18, 98, top - 4, mauer)                     # Mauer
    for y in range(top - 16, top - 4, 4):
        for x in range(14 + (y // 4 % 2) * 3, 98, 6):
            c.p(x, y, mauer2)
    zinnen(14, 98, top - 18)
    c.rect(40, top - 40, 72, top - 4, mauer)                     # Bergfried
    c.rect(68, top - 39, 72, top - 4, mauer2)
    zinnen(40, 72, top - 40)
    c.rect(49, top - 16, 63, top - 4, hx('3a1a2a'))             # Tor mit Fallgitter
    c.rect(50, top - 18, 62, top - 17, hx('3a1a2a'))
    for x in range(50, 63, 3):
        c.rect(x, top - 15, x, top - 5, hx('8a90a8'))
    for y in range(top - 14, top - 4, 3):
        c.rect(49, y, 63, y, hx('8a90a8'))
    sx, sy = 51, top - 35                                        # Schild mit Schloss
    for j, zeile in enumerate(['11111111111', '11111111111', '11111111111', '11111111111', '01111111110', '01111111110', '00111111100', '00011111000', '00001110000']):
        for i, b in enumerate(zeile):
            if b == '1':
                c.p(sx + i, sy + j, hx('2a6ad8') if i < 6 else hx('1f4ea8'))
    c.rect(sx + 4, sy + 2, sx + 6, sy + 4, hx('ffd23a'))
    c.p(sx + 5, sy + 3, hx('1c1233'))
    c.rect(sx + 5, sy + 4, sx + 5, sy + 5, hx('1c1233'))
    c.rect(56, top - 56, 56, top - 43, hx('5a3018'))            # Fahne
    c.rect(57, top - 56, 66, top - 51, hx('ff3a4a'))
    c.rect(57, top - 51, 63, top - 50, hx('d82a3a'))
    blinklicht(c, 20, top - 23, hx('ffb43a'))
    blinklicht(c, 92, top - 23, hx('ffb43a'))
    c.umriss()
    return c


def insel_jupiter(rnd):
    """Wirtschaft und Recht: ein kleiner Tempel mit Säulen und Paragraf, daneben Münzstapel"""
    c = Pixel(IW, IH)
    top = 58
    insel(c, 56, top, 14, 8, rnd, kristall=(hx('d8e4ff'), hx('8aa8ff'), hx('4a6ad8'), hx('2a3a8a')))
    marmor, marmor2 = hx('f8f4ec'), hx('cfc8b8')
    c.rect(26, top - 7, 86, top - 4, marmor2)                    # Stufen
    c.rect(29, top - 10, 83, top - 8, marmor)
    for x in (32, 44, 56, 68, 78):                               # Säulen
        c.rect(x, top - 32, x + 3, top - 11, marmor)
        c.rect(x + 3, top - 32, x + 3, top - 11, marmor2)
        c.rect(x - 1, top - 33, x + 4, top - 33, marmor2)
    c.rect(28, top - 37, 84, top - 34, marmor)                   # Gebälk
    c.rect(28, top - 34, 84, top - 34, marmor2)
    for i in range(0, 13):                                       # Giebel
        c.rect(29 + i * 2, top - 38 - i, 83 - i * 2, top - 38 - i, marmor if i < 12 else marmor2)
    c.rect(29, top - 38, 83, top - 38, hx('ffc83a'))
    schrift(c, 54, top - 47, '§', hx('8a5c1a'))
    leuchten_alpha(c, 56, top - 45, 3, 9, hx('ffe14a'))
    for x, n in ((12, 4), (18, 6), (92, 5)):                     # Münzstapel
        for i in range(n):
            y = top - 5 - i * 2
            c.rect(x, y, x + 4, y + 1, hx('ffd23a'))
            c.rect(x, y + 1, x + 4, y + 1, hx('c8901e'))
            c.p(x + 1, y, hx('fff4c0'))
    c.umriss()
    return c


def insel_saturn(rnd):
    """Hardware und Betrieb: zwei Serverschränke mit Leuchtdioden, eine Schüssel, ein Kabel"""
    c = Pixel(IW, IH)
    top = 58
    insel(c, 56, top, 14, 7, rnd, kristall=(hx('c0fff4'), hx('5af0d0'), hx('1fb8a8'), hx('0f6a6a')))
    for sx in (30, 46):
        c.rect(sx, top - 34, sx + 12, top - 4, hx('2a2e44'))
        c.rect(sx, top - 34, sx + 12, top - 34, hx('5a6080'))
        c.rect(sx, top - 34, sx, top - 4, hx('4a5070'))
        for y in range(top - 31, top - 6, 4):
            c.rect(sx + 2, y, sx + 10, y + 2, hx('3a3f5a'))
            c.rect(sx + 2, y, sx + 10, y, hx('4a5070'))
            led = rnd.choice([hx('5aff8a'), hx('5aff8a'), hx('3ad0ff'), hx('ffb43a')])
            c.p(sx + 9, y + 1, led)
            if rnd.random() < .5:
                c.p(sx + 7, y + 1, hx('5aff8a'))
    blinklicht(c, 39, top - 27, hx('5aff8a'))
    blinklicht(c, 55, top - 15, hx('3ad0ff'))
    # Schüssel auf einem Türmchen
    c.rect(78, top - 22, 80, top - 4, hx('8a90a8'))
    for i in range(0, 9):
        c.rect(70 + i, top - 30 + i // 2, 70 + i, top - 26 + i // 3, hx('e8ecf8'))
    for i in range(0, 9):
        c.rect(79 + i, top - 26 - i // 3 + 4, 79 + i, top - 26 + 4, hx('c8cce0'))
    c.linie(74, top - 28, 82, top - 34, hx('8a90a8'))
    blinklicht(c, 83, top - 35, hx('ff3a4a'))
    rohr(c, [(42, top - 4), (42, top - 1)], hx('3a3f55'))
    for x in range(60, 78):                                      # Kabel
        c.p(x, top - 8 + int(3 * math.sin((x - 60) / 17 * math.pi)), hx('1c1233'))
    haus(c, 88, top - 4, 14, 14, rnd, rahmen=hx('1fb8a8'), tuer=hx('5af0d0'))
    c.umriss()
    return c


def insel_glitch(rnd):
    """Ganz oben: eine zerrissene Insel, in der Mitte ein Riss ins Nichts, alles leicht verschoben"""
    c = Pixel(IW, IH)
    top = 54
    dunkel = [hx('6a4ac8'), hx('523aa8'), hx('3e2c8a'), hx('2e2070'), hx('221858')]
    gras = (hx('ff7ae0'), hx('d84ac8'), hx('9a2aa0'), hx('6a1a7a'))
    insel(c, 56, top, 14, 7, rnd, gras=gras, erde=dunkel, kristall=(hx('c0ffff'), hx('2af0ff'), hx('1a9ad8'), hx('1a4a8a')))
    # Riss: ein Streifen Nichts quer durch, die rechte Hälfte nach unten verschoben
    alt = c.img.copy()
    for y in range(c.h):
        for x in range(57, c.w):
            c.px[x, y] = alt.getpixel((x, y - 3)) if y >= 3 else (0, 0, 0, 0)
    for y in range(top - 6, top + 40):
        for x in range(55, 59):
            c.px[x, y] = (0, 0, 0, 0)
    # Tor ins Nichts
    for y in range(top - 34, top - 3):
        for x in range(42, 71):
            dx = (x - 56.5) / 14
            dy = (y - (top - 4)) / 30
            if dx * dx + dy * dy <= 1 and y < top - 3:
                rand = dx * dx + dy * dy > .7
                c.p(x, y, hx('2af0ff') if rand and x < 56 else hx('ff2a8a') if rand else hx('0a0418'))
    for _ in range(12):
        c.p(rnd.randint(48, 65), rnd.randint(top - 28, top - 8), rnd.choice([hx('ffffff'), hx('2af0ff'), hx('ff2a8a')]))
    # Störstreifen
    for _ in range(9):
        y = rnd.randint(8, IH - 8)
        x0 = rnd.randint(4, IW - 30)
        farbe = rnd.choice([hx('2af0ff', 200), hx('ff2a8a', 200), hx('ffe14a', 170)])
        c.rect(x0, y, x0 + rnd.randint(6, 26), y, farbe)
    c.umriss(hx('0a0418'))
    return c


# ---------- Speichern ----------
def speichern(img, name, beide=False):
    """Verlustfrei, damit jedes Pixel bleibt, wie es ist. Himmel gibt es auch als -klein (für die Kacheln, gleicher Inhalt)."""
    for suffix in ('', '-klein') if beide else ('',):
        img.save(os.path.join(IMG, f'{name}{suffix}.webp'), 'WEBP', lossless=True, quality=100, method=6)
    print(name)


def himmel_alle():
    weiss = (hx('ffffff'), hx('cfe6f7'))
    himmel_bauen('himmel-karte', [hx('1f5fc8'), hx('2f86e8'), hx('4cb0f6'), hx('84d8ff'), hx('c4f2ff')], random.Random(1),
                 lambda c: sonne(c, 176, 34), wolken=10, fern=5)
    himmel_bauen('himmel-mond', [hx('1c1650'), hx('34287a'), hx('5a40a8'), hx('9a6ad0'), hx('e8a8d0')], random.Random(2),
                 lambda c: mond(c, 160, 40), wolken=7, sterne_n=90, fern=3, wolken_farbe=(hx('f0e4ff'), hx('b8a0e0')))
    himmel_bauen('himmel-merkur', [hx('1f6ab8'), hx('3aa8e0'), hx('8ad8f0'), hx('ffd890'), hx('ff9a5a')], random.Random(3),
                 lambda c: sonne(c, 160, 150, 18), wolken=8, fern=4, wolken_farbe=(hx('fff6e8'), hx('ffcfa0')))
    himmel_bauen('himmel-venus', [hx('4a1a7a'), hx('8a2a9a'), hx('d04a9a'), hx('ff8aa8'), hx('ffd0a0')], random.Random(4),
                 lambda c: (leuchten(c, 160, 30, 2, 18, hx('fff0f8'), .7), c.rect(158, 28, 162, 32, hx('ffffff')), c.rect(156, 30, 164, 30, hx('ffffff')), c.rect(160, 26, 160, 34, hx('ffffff'))),
                 wolken=8, sterne_n=40, fern=3, wolken_farbe=(hx('ffe8f4'), hx('ffaacc')))
    himmel_bauen('himmel-sonne', [hx('1a7ad8'), hx('3aa8f8'), hx('7ad4ff'), hx('c8f0ff'), hx('fff4c0')], random.Random(5),
                 lambda c: sonne(c, 160, 44, 20), wolken=9, fern=5)
    himmel_bauen('himmel-mars', [hx('2a0a2a'), hx('6a1a3a'), hx('b0303a'), hx('ff6a3a'), hx('ffb060')], random.Random(6),
                 lambda c: planet(c, 160, 44, 18, [hx('e0603a'), hx('c84a2a'), hx('e0703a'), hx('b8402a')], fleck=(4, 4, 3, hx('8a2a1a'))),
                 wolken=7, sterne_n=50, fern=3, wolken_farbe=(hx('ffe0d0'), hx('ff9a7a')))
    himmel_bauen('himmel-jupiter', [hx('0c1040'), hx('1c2a80'), hx('3a50c0'), hx('6a8ae8'), hx('b0c8ff')], random.Random(7),
                 lambda c: planet(c, 160, 48, 24, [hx('f0d8b0'), hx('d8a070'), hx('f4e4c8'), hx('c88a5a'), hx('e8c8a0'), hx('b87a4a')], fleck=(7, 6, 4, hx('d8583a'))),
                 wolken=7, sterne_n=70, fern=4, wolken_farbe=(hx('eef2ff'), hx('a8b8f0')))
    himmel_bauen('himmel-saturn', [hx('04121e'), hx('0a2a3a'), hx('104a58'), hx('1a7a7a'), hx('4ac0b0')], random.Random(8),
                 lambda c: planet(c, 160, 50, 16, [hx('f0e0a0'), hx('d8c080'), hx('f4e8b8'), hx('c8a860')], ring=(hx('e8d8a8'), hx('a89868'))),
                 wolken=6, sterne_n=130, fern=3, wolken_farbe=(hx('d8fff8'), hx('7ac8c0')))
    def glitch_himmel(c):
        rnd = random.Random(99)
        for _ in range(16):
            y = rnd.randint(0, HH - 1)
            x0 = rnd.randint(0, HW - 40)
            f = rnd.choice([hx('ff2a8a'), hx('2af0ff'), hx('ffe14a')])
            c.rect(x0, y, x0 + rnd.randint(10, 60), y, misch(c.g(x0, y), f, .55))
        leuchten(c, 160, 70, 6, 46, hx('8a2aff'), .45)
    himmel_bauen('himmel-glitch', [hx('05030f'), hx('120828'), hx('24104a'), hx('3a1a6a'), hx('5a2a8a')], random.Random(9),
                 glitch_himmel, wolken=5, sterne_n=160, fern=4, wolken_farbe=(hx('4a3a7a'), hx('2a1f50')))


def inseln_alle():
    for name, fn, seed in (('mond', insel_mond, 11), ('merkur', insel_merkur, 12), ('venus', insel_venus, 13), ('sonne', insel_sonne, 14),
                           ('mars', insel_mars, 15), ('jupiter', insel_jupiter, 16), ('saturn', insel_saturn, 17), ('glitch', insel_glitch, 18)):
        speichern(fn(random.Random(seed)).img, 'insel-' + name)


if __name__ == '__main__':
    himmel_alle()
    inseln_alle()
