"""Zeichnet die App-Symbole: ein Lagerfeuer (drei Flammen als Tropfen) auf dunklem Grund.

Aufruf: python3 -I tools/icons.py   (schreibt nach src/icons/)
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'icons')
GRUND = (11, 9, 8)
FLAMMEN = [  # (Breite, Höhe, Mitte unten y, Farbe), Anteile der Bildgröße
    (0.46, 0.62, 0.80, (196, 70, 18)),
    (0.32, 0.46, 0.80, (236, 130, 50)),
    (0.17, 0.27, 0.80, (255, 226, 150)),
]


def tropfen(cx, unten, b, h, n=120):
    """Tropfen mit Spitze oben: x = sin(t) * sin(t/2)^1.4, y = cos(t)"""
    pts = []
    for k in range(n):
        t = 2 * math.pi * k / n
        x = math.sin(t) * math.sin(t / 2) ** 1.4
        y = math.cos(t)
        pts.append((cx + x * b / 2 * 1.35, unten - (1 - y) / 2 * h))
    # Spitze oben, Bauch unten: umdrehen
    top = min(p[1] for p in pts)
    bot = max(p[1] for p in pts)
    return [(px, top + bot - py) for px, py in pts]


def symbol(size, rand):
    im = Image.new('RGB', (size, size), GRUND)
    glut = Image.new('RGB', (size, size), GRUND)
    d = ImageDraw.Draw(glut)
    r = size * 0.42
    d.ellipse((size / 2 - r, size * 0.62 - r * 0.8, size / 2 + r, size * 0.62 + r * 0.8), fill=(70, 28, 10))
    glut = glut.filter(ImageFilter.GaussianBlur(size * 0.09))
    im.paste(glut)
    d = ImageDraw.Draw(im)
    s = size * (1 - 2 * rand)
    off = size * rand
    # Glut am Boden
    d.ellipse((off + s * 0.24, off + s * 0.76, off + s * 0.76, off + s * 0.86), fill=(60, 26, 10))
    for b, h, unten, farbe in FLAMMEN:
        d.polygon(tropfen(off + s / 2, off + s * unten, s * b, s * h), fill=farbe)
    return im


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, size, rand in (('icon-192.png', 192, 0.06), ('icon-512.png', 512, 0.06),
                             ('icon-maskable-512.png', 512, 0.16), ('apple-touch-icon.png', 180, 0.1)):
        symbol(size * 2, rand).resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name))
    pfade = []
    for b, h, unten, farbe in FLAMMEN:
        pts = tropfen(32, 64 * unten, 64 * b, 64 * h, 48)
        pfade.append('<path fill="#%02x%02x%02x" d="M%s Z"/>' % (farbe + (' L'.join('%.1f %.1f' % p for p in pts),)))
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0b0908"/>'
           '<ellipse cx="32" cy="52" rx="16" ry="3.5" fill="#3c1a0a"/>' + ''.join(pfade) + '</svg>\n')
    open(os.path.join(OUT, 'favicon.svg'), 'w').write(svg)
    print('Symbole nach src/icons/')


if __name__ == '__main__':
    main()
