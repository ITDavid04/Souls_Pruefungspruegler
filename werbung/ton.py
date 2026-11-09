"""Ton zum Werbevideo: Musik und Geräusche, alles gerechnet, nichts aufgenommen.
Aufruf: python3 werbung/ton.py werbung/ton.wav   (braucht numpy)
96 Schläge je Minute, die Zeiten passen zu den Schnitten in video.html."""
import sys, wave
import numpy as np

SR = 44100
DAUER = 25.0
N = int(SR * DAUER)
B = 0.625                                  # ein Schlag
rng = np.random.default_rng(11)
L = np.zeros(N + SR * 4); R = np.zeros(N + SR * 4)   # trocken
HL = np.zeros_like(L); HR = np.zeros_like(R)         # Anteil für den Hall


def lege(sig, t, pan=0.0, laut=1.0, hall=0.0):
    i = int(t * SR); n = min(len(sig), len(L) - i)
    if n <= 0: return
    l = np.cos((pan + 1) * np.pi / 4) * laut; r = np.sin((pan + 1) * np.pi / 4) * laut
    L[i:i + n] += sig[:n] * l; R[i:i + n] += sig[:n] * r
    if hall: HL[i:i + n] += sig[:n] * l * hall; HR[i:i + n] += sig[:n] * r * hall


def zeit(d): return np.arange(int(d * SR)) / SR


def filt(sig, tief=None, hoch=None, steil=4):
    """Sanfter Filter über das Spektrum: tief = Tiefpass bei Hz, hoch = Hochpass bei Hz."""
    sp = np.fft.rfft(sig); f = np.fft.rfftfreq(len(sig), 1 / SR)
    if tief: sp *= 1 / np.sqrt(1 + (f / tief) ** (2 * steil))
    if hoch: sp *= 1 - 1 / np.sqrt(1 + (f / hoch) ** (2 * steil))
    return np.fft.irfft(sp, len(sig))


def huelle(d, an=0.01, ab=0.1):
    t = zeit(d); return np.clip(t / an, 0, 1) * np.clip((d - t) / ab, 0, 1)


def flaeche(freqs, d, hell=900, an=0.25, ab=0.6):
    """Dunkle Streicherfläche: leicht verstimmte Sägezähne, weich gefiltert."""
    t = zeit(d); s = np.zeros(len(t))
    for f in freqs:
        for v in (-0.006, 0.0, 0.007):
            ff = f * (1 + v); ph = rng.random() * 6.28
            for k in range(1, 9): s += np.sin(2 * np.pi * ff * k * t + ph * k) / k
    return filt(s / (len(freqs) * 3), tief=hell) * huelle(d, an, ab)


def zupf(f, d=0.5, hell=1.0):
    t = zeit(d); s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (5 + 3 * k)) / k ** (1.6 - 0.4 * hell) for k in range(1, 7))
    return s * np.clip(t / 0.003, 0, 1)


def pauke(tief=48, d=0.7, hart=1.0):
    t = zeit(d); f = tief + 80 * np.exp(-t * 26); ph = 2 * np.pi * np.cumsum(f) / SR
    koerper = np.sin(ph) * np.exp(-t * 6.5)
    fell = filt(rng.standard_normal(len(t)), tief=1800, hoch=120) * np.exp(-t * 55) * 0.5 * hart
    return np.tanh((koerper + fell) * 1.6)


def einschlag(d=3.2, tief=34):
    t = zeit(d); f = tief + 70 * np.exp(-t * 9); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    krach = filt(rng.standard_normal(len(t)), tief=2600, hoch=60) * np.exp(-t * 7) * 0.7
    luft = filt(rng.standard_normal(len(t)), tief=7000, hoch=1500) * np.exp(-t * 3.0) * 0.16
    return np.tanh((sub * 1.3 + krach) * 1.5) + luft


def sog(d=0.6, von=300, bis=6000):
    """Anschwellendes Rauschen vor einem Schnitt."""
    t = zeit(d); x = t / d; r = rng.standard_normal(len(t)); aus = np.zeros(len(t)); teile = 24
    for i in range(teile):
        a, b = int(len(t) * i / teile), int(len(t) * (i + 1) / teile); m = von * (bis / von) ** ((i + .5) / teile)
        seg = filt(r, tief=m * 1.5, hoch=m * 0.6, steil=2)[a:b]; aus[a:b] = seg
    return aus * x ** 2.5 * np.clip((d - t) / 0.02, 0, 1)


def glocke(f, d=4.0, dunkel=1.0):
    t = zeit(d); teil = [(0.5, 1.0, 1.2), (1.0, 0.9, 1.6), (1.19, 0.55, 2.2), (1.5, 0.4, 2.6), (2.0, 0.5, 3.0), (2.51, 0.28, 3.8), (3.0, 0.2, 4.6), (4.2, 0.12, 6)]
    s = sum(a * np.sin(2 * np.pi * f * m * t + i) * np.exp(-t * z * dunkel) for i, (m, a, z) in enumerate(teil))
    return s * np.clip(t / 0.004, 0, 1)


def klick(d=0.05):
    t = zeit(d); return (np.sin(2 * np.pi * 1900 * t) * 0.6 + filt(rng.standard_normal(len(t)), hoch=2500)) * np.exp(-t * 110)


def stimme(f, d, an=0.08, ab=0.5):
    """Heller Chorton mit etwas Beben für die Melodie am Schluss."""
    t = zeit(d); vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.4, 0, 1); ph = 2 * np.pi * np.cumsum(f * vib) / SR
    s = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph) + 0.08 * np.sin(5 * ph)
    return s * huelle(d, an, ab)


n_ = {'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
def hz(name):
    return 440 * 2 ** ((n_[name[:-1]] + 12 * (int(name[-1]) + 1) - 69) / 12)
def hzs(*namen): return [hz(x) for x in namen]

# ---------------- Musik ----------------
AKKORDE = [  # Beginn, Ende, Töne der Fläche, Töne zum Zupfen, Lautstärke der Fläche
    (2.5, 5.625, hzs('D2', 'A2', 'D3', 'F3', 'A3'), hzs('D4', 'A4', 'F4', 'A4'), 1.0),
    (5.625, 8.125, hzs('Bb1', 'F2', 'Bb2', 'D3', 'F3'), hzs('D4', 'F4', 'Bb4', 'F4'), 0.85),
    (8.125, 9.375, hzs('G1', 'D2', 'G2', 'Bb2', 'D3'), hzs('D4', 'G4', 'Bb4', 'G4'), 0.85),
    (9.375, 10.0, hzs('A1', 'E2', 'A2', 'C#3', 'E3'), [], 0.9),
    (10.0, 13.125, hzs('D1', 'D2', 'Eb2'), [], 0.75),
    (13.125, 15.0, hzs('D2', 'A2', 'D3', 'F3', 'A3'), hzs('D4', 'A4', 'D5', 'A4'), 1.0),
    (15.0, 16.25, hzs('A1', 'E2', 'A2', 'C#3', 'E3'), hzs('E4', 'A4', 'C#5', 'A4'), 1.0),
    (16.25, 17.5, hzs('Bb1', 'F2', 'Bb2', 'D3', 'F3', 'D4'), [], 1.1),
    (17.5, 19.0625, hzs('F1', 'C2', 'F2', 'A2', 'C3'), hzs('C4', 'F4', 'A4', 'F4'), 0.9),
    (19.0625, 20.625, hzs('C2', 'G2', 'C3', 'E3', 'G3'), hzs('E4', 'G4', 'C5', 'G4'), 0.95),
    (20.625, 25.2, hzs('D2', 'A2', 'D3', 'F3', 'A3', 'D4'), hzs('D4', 'A4', 'D5', 'F5'), 1.15),
]
for a, e, fl, zu, laut in AKKORDE:
    d = e - a + 0.5
    hell = 520 if a == 10.0 else 1100 if a >= 20 else 850
    s = flaeche(fl, d, hell=hell, an=0.12 if a != 10.0 else 0.5, ab=0.55)
    lege(s, a, -0.25, 0.20 * laut, hall=0.5); lege(np.roll(s, 211), a, 0.25, 0.20 * laut, hall=0.5)
    bass = filt(sum(np.sin(2 * np.pi * fl[0] * k * zeit(d)) / k for k in (1, 2, 3)), tief=160) * huelle(d, 0.05, 0.4)
    lege(bass, a, 0, 0.26 * laut)
    if zu:  # Achtel-Ostinato
        i = 0; t = a
        while t < e - 0.01:
            lege(zupf(zu[i % len(zu)], 0.5, hell=0.8), t, 0.35 if i % 2 else -0.35, 0.085 * (1.25 if i % 4 == 0 else 1), hall=0.6)
            i += 1; t += B / 2

# Pauken: Muster in Schlägen je Abschnitt
def trommeln(a, e, muster, laut=1.0, klein=False):
    t = a
    while t < e - 0.01:
        for pos, st in muster:
            tt = t + pos * B
            if tt < e - 0.01: lege(pauke(46 if st > 0.8 else 62, 0.6, hart=st), tt, 0.1 if st > 0.8 else -0.2, 0.5 * st * laut, hall=0.25)
        if klein:
            for k in range(16):
                tt = t + k * B / 4
                if tt < e - 0.01: lege(klick(0.03), tt, 0.5 if k % 2 else -0.5, 0.035 * (1.6 if k % 4 == 2 else 1))
        t += 4 * B
STARK = [(0, 1), (1.5, .6), (2, .9), (3, .6), (3.5, .7)]
RUHIG = [(0, 1), (2, .7), (3.5, .5)]
trommeln(2.5, 5.625, STARK, 0.9)
trommeln(5.625, 9.375, RUHIG, 0.75)
trommeln(13.125, 16.25, [(0, 1), (0.5, .5), (1, .9), (1.5, .6), (2, 1), (2.5, .5), (3, .9), (3.5, .7)], 1.0, klein=True)
trommeln(17.5, 20.625, STARK, 0.8, klein=True)
trommeln(20.625, 23.4, STARK, 0.95, klein=True)

# Schlussmelodie
for name, a, d in [('A4', 20.625, B), ('D5', 21.25, B), ('F5', 21.875, B * 1.5), ('E5', 22.8125, B * .5), ('D5', 23.125, 2.1)]:
    lege(stimme(hz(name), d + 0.25), a, 0, 0.12, hall=1.0); lege(stimme(hz(name) * 2, d + 0.25), a, 0.3, 0.03, hall=1.0)

# ---------------- Geräusche ----------------
lege(glocke(hz('D2'), 4.5, dunkel=0.8), 0.08, 0, 0.5, hall=0.9)              # Du bist gestorben
lege(einschlag(2.4, 30), 0.08, 0, 0.42, hall=0.3)
lege(filt(flaeche(hzs('D1', 'D2', 'Ab2'), 2.6, hell=420, an=0.6, ab=0.3), tief=500), 0.0, 0, 0.5, hall=0.4)
lege(glocke(hz('D3'), 2.5, dunkel=1.5), 1.3, 0.2, 0.12, hall=1.0)             # Todesursache
lege(sog(0.55), 1.95, 0, 0.3, hall=0.3)
lege(einschlag(3.4, 32), 2.5, 0, 0.95, hall=0.45)                              # Titel
lege(glocke(hz('D4'), 3.0, dunkel=1.2), 2.5, 0, 0.1, hall=1.0)
lege(sog(0.4, 400, 5000), 5.225, 0, 0.2); lege(einschlag(2.0, 40), 5.625, 0, 0.5, hall=0.3)
lege(klick(), 6.775, 0, 0.5)                                                   # Tipp
for i, nn in enumerate(['A5', 'D6', 'F#6']):                                   # Treffer
    lege(zupf(hz(nn), 0.9, hell=0.3), 6.875 + i * 0.07, 0.2, 0.22, hall=1.0)
lege(glocke(hz('D5'), 1.6, dunkel=2.2), 6.875, 0, 0.08, hall=1.0)
lege(sog(0.3, 500, 4000), 7.825, 0, 0.16); lege(pauke(40, 0.9), 8.125, 0, 0.6, hall=0.3)
lege(klick(), 9.275, 0, 0.5)
t_ = zeit(0.9)                                                                  # Fehler: tiefer, schiefer Schlag
lege(np.tanh((np.sin(2 * np.pi * 61 * t_) + np.sin(2 * np.pi * 86.5 * t_) + 0.5 * np.sign(np.sin(2 * np.pi * 122 * t_))) * 1.4) * np.exp(-t_ * 5) * np.clip(t_ / .004, 0, 1), 9.375, 0, 0.42, hall=0.3)
lege(einschlag(1.4, 44), 9.375, 0, 0.5)
lege(glocke(hz('D2'), 4.0, dunkel=0.9), 10.0, 0, 0.55, hall=0.9)               # Tod
lege(einschlag(2.6, 28), 10.0, 0, 0.6, hall=0.3)
for i, nn in enumerate(['D4', 'A4', 'D5', 'F5']):                              # Hol sie dir zurück
    lege(zupf(hz(nn), 1.4, hell=0.2), 11.5625 + i * 0.11, -0.3 + i * 0.2, 0.2, hall=1.0)
lege(sog(0.75, 250, 7000), 12.375, 0, 0.34, hall=0.3)
lege(einschlag(3.2, 30), 13.125, 0, 1.0, hall=0.45)                            # Bosse
for i in range(4):                                                              # Namen schlagen ein
    lege(einschlag(0.9, 52), 13.75 + i * B, (-0.4, 0.4, -0.2, 0.2)[i], 0.42, hall=0.3)
    lege(filt(rng.standard_normal(int(SR * .25)), hoch=3000) * np.exp(-zeit(.25) * 20), 13.75 + i * B, 0, 0.1, hall=0.5)
lege(sog(0.3, 600, 8000), 15.95, 0, 0.25)
lege(einschlag(2.6, 36), 16.25, 0, 0.8, hall=0.4)                              # Gegner bezwungen
for i, nn in enumerate(['Bb4', 'D5', 'F5', 'Bb5']):
    lege(glocke(hz(nn), 2.2, dunkel=1.6), 16.25 + i * 0.05, -0.4 + i * 0.27, 0.07, hall=1.0)
lege(filt(rng.standard_normal(int(SR * 1.6)), hoch=5000) * np.exp(-zeit(1.6) * 3.2), 16.25, 0, 0.09, hall=0.6)
lege(einschlag(1.8, 42), 17.5, 0, 0.5, hall=0.3)
lege(sog(0.7, 800, 5000)[::-1] * 0.6 + sog(0.7, 800, 5000), 18.0, -0.3, 0.1)   # Wischer hin
lege(sog(0.7, 800, 5000), 19.5, 0.3, 0.1)                                       # und zurück
for i, nn in enumerate(['F5', 'A5', 'C6']):                                     # die drei Zahlen
    lege(glocke(hz(nn), 1.4, dunkel=2.5), 18.125 + i * B, 0.4, 0.1, hall=1.0); lege(klick(), 18.125 + i * B, 0.4, 0.25)
lege(sog(0.6, 300, 8000), 20.025, 0, 0.36, hall=0.3)
lege(einschlag(3.8, 30), 20.625, 0, 1.0, hall=0.5)                             # Schluss
lege(glocke(hz('D3'), 4.2, dunkel=0.8), 20.625, 0, 0.2, hall=1.0)
for i, nn in enumerate(['D5', 'A5', 'D6']):                                     # Knopf
    lege(zupf(hz(nn), 1.2, hell=0.2), 22.125 + i * 0.06, 0, 0.14, hall=1.0)

# ---------------- Hall, Mischung, Datei ----------------
def hall_antwort(d=2.6, seed=1):
    r = np.random.default_rng(seed); t = zeit(d); ir = r.standard_normal(len(t)) * np.exp(-t * 2.6); ir[:int(.012 * SR)] *= 0.2
    return filt(ir, tief=5200, hoch=180, steil=2)
def falte(x, ir):
    n = len(x) + len(ir); return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x)]
wl = falte(HL, hall_antwort(seed=1)); wr = falte(HR, hall_antwort(seed=2))
wl /= max(1e-9, np.abs(wl).max()); wr /= max(1e-9, np.abs(wr).max())
spitze = max(np.abs(L).max(), np.abs(R).max())
l = L / spitze + wl * 0.22; r = R / spitze + wr * 0.22
mix = np.stack([l, r], 1)[:N]
aus = np.clip((DAUER - np.arange(N) / SR) / 0.9, 0, 1) ** 1.5              # am Ende ausblenden
mix = np.tanh(mix * 1.9) * aus[:, None]
mix = mix / np.abs(mix).max() * 0.89
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'ton.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('Ton geschrieben:', round(DAUER, 2), 's')
