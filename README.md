# Prüfungsprügler

Lernkarten für die AP1 (Fachinformatik, LF1 bis LF6) als Souls-like fürs Handy. Richtig bringt Seelen, falsch kostet Leben.
Wer stirbt, lässt seine Seelen bei der Karte liegen, die ihn erledigt hat, und holt sie sich im nächsten Gang zurück.
Installierbare Web-App (PWA), läuft nach dem ersten Besuch auch ohne Netz.

> **Stand:** Prototyp vom Kernablauf, 434 Karten aus dem AP1 Reinprügler.

## So läuft ein Spiel

| **Schritt** | **Was passiert** |
|---|---|
| Lagerfeuer | Startseite. Stufe aufsteigen (kostet Seelen, +5 Leben je Stufe), Kreis wählen |
| Kreis | Ein Kreis je Lernfeld, mit Bild und Zitat frei nach Dantes Inferno. Zeigt, wie viele Karten sitzen und fällig sind |
| Gang | 10 Karten, danach ein Lagerfeuer. Dauert drei bis vier Minuten, also eine Bahnfahrt |
| Fehler | Kostet Leben. Die Karte kommt drei Karten später noch einmal |
| Kaffeeflakon | Heilt 45 Leben, drei Stück je Gang, am Lagerfeuer wieder voll |
| Tod | „Du bist gestorben“, mit Begriff, Erklärung und Merksatz der Karte, die dich erledigt hat |
| Blutfleck | Deine Seelen bleiben bei dieser Karte. Sie kommt im nächsten Gang durch den Kreis zuerst. Richtig: Seelen zurück. Falsch oder woanders gestorben: weg |
| Nebeltor | Nach drei Lagerfeuern in einem Kreis offen. Dahinter der Boss des Lernfelds |
| Boss | Fünf richtige Antworten bringen ihn zu Fall, jeder Fehler kostet 35 Leben. Belohnung: 150 Seelen, ein Flakon mehr, ein Titel |
| Rückzug | Jederzeit zurück zum Lagerfeuer. Der Gang zählt dann nicht, die Seelen bleiben |

Geschlossene App mitten im Gang: Beim nächsten Öffnen geht es mit derselben Frage weiter.

## Fragen

| **Art** | **Wann** |
|---|---|
| Welcher Begriff ist gemeint? | vor allem bei neuen Karten |
| Welche Erklärung passt? | gemischt |
| Begriff eintippen | je besser eine Karte sitzt, desto öfter. Tippfehler zählen, lange Begriffe werden nie getippt |

Dahinter steckt ein Lernkasten mit fünf Fächern wie im Reinprügler (Wiederholung nach 0, 1, 3, 7 und 14 Tagen).
Ein Gang nimmt zuerst den Blutfleck, dann fällige Karten, dann neue in Themenreihenfolge, dann wacklige.

## Was drin ist und was bewusst nicht

Aus dem Reinprügler übernommen: Leben, Kaffeeflakon, Seelen, Stufen, Blutfleck, Lagerfeuer, Bosse und Titel, dazu die Zahlen
(Schaden 20, 30 bei Karten, die schon saßen, 35 im Bosskampf; 10 Seelen plus 5 je Fach).

Für den Prototyp weggelassen, weil sie doppelt sind oder fürs Handy zu viel:

| **System** | **Warum** |
|---|---|
| Licht und Schatten, Schatten-Gegner, Problemkinder | zeigen alle wie der Lernkasten, welches Thema nicht sitzt |
| Serie und Rekord | Druck, den wir in der Wiki-APP auch nicht wollen |
| Botschaften für Seelen | später als Tipp beim Eintippen denkbar |
| Sprint, Rechnen, Kasten, Stöbern | eigene Modi, nicht Teil des Kernablaufs |
| Prüfungsausschuss | als Ziel sichtbar (letzte Kachel), Kampf kommt später |

## Technik

Ohne Framework: `src/index.html`, `src/app.css`, `src/js/app.js` (Oberfläche), `src/js/kern.js` (Regeln), `src/js/welt.js` (Kreise, Texte).
Gespeichert wird nur auf dem Gerät: `spp.spiel` (Spielstand) und `spp.prog` (Lernkasten) im localStorage.

```bash
npm install
npm run build      # baut nach docs/
npm run serve      # http://localhost:8090, mit -- --lan auch im WLAN
npm test           # spielt die App einmal durch, Bildschirmfotos in tools/shots/
```

Karten und Bilder kommen aus dem AP1 Reinprügler:

```bash
python3 -I tools/extract_ap1.py "~/Desktop/Reinprügler_APP/ap1hölle-final.html"
```

Das schreibt `data/karten-ap1.json` und die Bilder als WebP nach `src/img/` (zusammen rund 770 KB statt 7,6 MB als JPEG).
Die App-Symbole zeichnet `python3 -I tools/icons.py`.

Veröffentlicht wird über GitHub Actions (`.github/workflows/pages.yml`) bei jedem Push auf `main`.
Einmalig nötig: im Repository unter Settings, Pages die Source auf „GitHub Actions“ stellen.

Schriften: Cinzel, Atkinson Hyperlegible und Cormorant Garamond (SIL Open Font License, liegen der App bei).
