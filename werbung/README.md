# Werbevideo

`pruefungspruegler-werbung.mp4`: 25 Sekunden im Hochformat (1080 x 1920, 30 Bilder je Sekunde, mit Ton) für Reels, TikTok und Shorts.

| **Zeit** | **Szene** | **Text im Bild** |
|---|---|---|
| 0,0 s | Der Haken | Du bist gestorben. Todesursache: eine Lernkarte. |
| 2,5 s | Der Name | Prüfungsprügler. Lernkarten als Souls-like. |
| 5,6 s | Kampf | Richtig bringt Seelen. |
| 8,1 s | Kampf | Falsch kostet Leben. |
| 10,0 s | Tod und Blutfleck | Stirbst du, bleiben deine Seelen liegen. Hol sie dir zurück. |
| 13,1 s | Nebeltor | 14 Bosse, vier davon mit Namen, dann „Gegner bezwungen“ |
| 17,5 s | Was drin ist | Souls oder Pixel, 1.438 Karten, offline, 0 € |
| 20,6 s | Aufruf | Wer die Karten lernt, kommt wieder raus. Jetzt hinabsteigen. |

Geschnitten ist auf 96 Schläge je Minute, jeder Schnitt und jeder Treffer liegt auf einem Schlag.
Die wichtigen Texte halten oben und unten Abstand, damit die Bedienflächen der Plattformen nichts verdecken.

## Woraus es besteht

| **Datei** | **Aufgabe** |
|---|---|
| `video.html` | Das Video als Seite. `render(t)` setzt jedes Bild allein aus der Zeit, deshalb ist jedes Bild wiederholbar |
| `screens/` | Echte Bildschirme der App (390 x 844, doppelt aufgelöst), nichts nachgebaut |
| `ton.py` | Musik und Geräusche, mit numpy gerechnet, keine fremden Aufnahmen und keine Lizenzfragen |
| `render.mjs` | Macht aus Seite und Ton die MP4 |

Die Hintergründe kommen aus `src/img`, die Schriften aus `docs/fonts`.

## Neu rechnen

```
npm run build
node werbung/render.mjs            # ganze MP4, dauert ein paar Minuten
node werbung/render.mjs --probe    # nur Standbilder nach werbung/probe/
node werbung/render.mjs --schau    # Vorschau im Browser, in Schleife
```

Gebraucht werden playwright mit Chromium, ffmpeg und python3 mit numpy. Texte und Zeiten stehen oben in `video.html` (`T`, `BOSSE`), die Töne dazu in `ton.py`.
