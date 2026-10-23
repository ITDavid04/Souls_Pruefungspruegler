# Prüfungsprügler

Lernkarten für die Abschlussprüfung Fachinformatik (AP1 und AP2) als Souls-like fürs Handy. Richtig bringt Seelen, falsch kostet Leben.
Wer stirbt, lässt seine Seelen bei der Karte liegen, die ihn erledigt hat, und holt sie sich im nächsten Gang zurück.
Installierbare Web-App (PWA), läuft nach dem ersten Besuch auch ohne Netz.

> **Stand:** Prototyp mit der ganzen Reise: 1134 Karten aus dem AP1 und AP2 Reinprügler, 12 Bosse, Zwischenboss, Endboss.
> **Live:** https://itdavid04.github.io/Souls_Pruefungspruegler/

## Die Reise, frei nach Dante

| **Abschnitt** | **Prüfung** | **Was dort wartet** |
|---|---|---|
| Der Abstieg | AP1 | Sechs Höllenkreise, einer je Lernfeld (LF1 bis LF6), je ein Boss |
| Kokytos, Grund der Hölle | AP1 komplett | **Der Zwischenprüfer**, öffnet sich, wenn die sechs Bosse des Abstiegs liegen |
| Der Aufstieg | AP2 | Sechs Gesimse am Läuterungsberg, eines je Prüfungsbereich, je ein Boss |
| Der Gipfel, hinter der Feuerwand | AP1 und AP2 | **Der Prüfungsausschuss**, öffnet sich erst, wenn alle dreizehn Bosse liegen |

Die Gesimse folgen Dantes Todsünden von unten nach oben:

| **Gesims** | **Prüfungsbereich** | **Boss** |
|---|---|---|
| Stolz | Algorithmen und OOP | Die Endlosrekursion |
| Neid | Modellierung und Architektur | Das Gottobjekt |
| Zorn | IT-Systeme und Sicherheit | Der Single Point of Failure |
| Trägheit | Projekt und Qualität | Der Scope Creep |
| Geiz | Wirtschafts- und Sozialkunde | Die Probezeit |
| Völlerei | Datenbanken und SQL | Der kartesische JOIN |

## So läuft ein Spiel

| **Schritt** | **Was passiert** |
|---|---|
| Lagerfeuer | Startseite. Stufe aufsteigen (kostet Seelen, +5 Leben je Stufe), Kreis oder Gesims wählen |
| Gang | 10 Karten, danach ein Lagerfeuer. Dauert drei bis vier Minuten, also eine Bahnfahrt |
| Fehler | Kostet Leben (20, bei Karten, die schon saßen, 30). Die Karte kommt drei Karten später noch einmal |
| Kaffeeflakon | Heilt 45 Leben, drei Stück je Gang, am Lagerfeuer wieder voll |
| Tod | „Du bist gestorben“, mit Begriff, Erklärung und Merksatz der Karte, die dich erledigt hat |
| Blutfleck | Deine Seelen bleiben bei dieser Karte und kommen beim nächsten Mal an diesem Ort zuerst. Richtig: Seelen zurück. Falsch oder woanders gestorben: weg |
| Nebeltor | Nach drei Lagerfeuern in einem Kreis oder Gesims offen. Fünf Treffer bringen den Boss zu Fall |
| Belohnung | Seelen, ein Titel und ein Kaffeeflakon mehr (bis 5). Danach wird der Kaffee stärker geröstet: +10 Heilung je Boss |
| Rückzug | Jederzeit zurück. Der Gang zählt dann nicht, die Seelen bleiben |

Am Berg ist alles eine Stufe härter: 5 Leben mehr Schaden je Fehler, dafür anderthalbmal so viele Seelen.

### Der Zwischenprüfer

Er steckt bis zur Brust im Eis, hat drei Gesichter und hieß früher Zwischenprüfung. Den neuen Namen hat er nie akzeptiert.
Jedes Gesicht fragt zwei Lernfelder ab und fällt nach drei Treffern. Im Eis ist der **Kaffee gefroren**: Der Kampf beginnt ohne Flakon,
mit jedem gefallenen Gesicht taut einer auf. Wer stirbt, ist erfroren. Wer gewinnt, klettert durch die Mitte der Erde zum Läuterungsberg.

### Der Prüfungsausschuss

Drei Prüfende nacheinander, je vier Treffer, Fragen aus AP1 und AP2: die Beauftragte der Arbeitgeber, der Beauftragte der Arbeitnehmer
und die Lehrkraft der Berufsschule. **20 Sekunden** je Frage, auch nach dem Neuladen, **kein Kaffee**, 40 Leben je Fehler,
ein Tippfehler kostet 10. Wer den Raum verlässt, ist durchgefallen. Wer besteht, bekommt den Abspann und kann ein **Neues Spiel+** beginnen:
Alle Bosse stehen wieder auf, Seelen ×1,5 und Schaden ×1,25 je Durchgang, Lernstand, Stufe und Lagerfeuer bleiben.

### Prototyp-Schalter

Unter „Spielstand“ öffnet „Prototyp: alle Tore offen“ den Berg, alle Nebeltore und beide Arenen, ohne dass Bosse als besiegt gelten.
Damit lässt sich alles ansehen, ohne erst die AP1 durchzuspielen. Vor einer breiteren Veröffentlichung kommt er raus.

## Fragen

| **Art** | **Wann** |
|---|---|
| Welcher Begriff ist gemeint? | vor allem bei neuen Karten |
| Welche Erklärung passt? | gemischt |
| Begriff eintippen | je besser eine Karte sitzt, desto öfter. Tippfehler zählen, lange Begriffe werden nie getippt |

Dahinter steckt ein Lernkasten mit fünf Fächern wie im Reinprügler (Wiederholung nach 0, 1, 3, 7 und 14 Tagen).
Ein Gang nimmt zuerst den Blutfleck, dann fällige Karten, dann neue in Themenreihenfolge, dann wacklige.

## Bilder

Die Hölle besteht aus den gemalten Bildern des Reinprüglers. Der Berg ist bewusst anders: Silhouetten im Morgenlicht, mit jedem
Gesims ein bisschen heller. Jedes Gesims versteckt ein Motiv aus seinem Prüfungsbereich, etwa eine gemeißelte Spirale (Rekursion),
ein Klassendiagramm aus Sternen, Wolken wie ein Gantt-Diagramm oder einen Baum, dessen Früchte in Zeilen und Spalten hängen.
Gemalt werden sie von `tools/berg_bilder.py` (nur Pillow, immer gleiches Ergebnis). Der Kokytos ist ein eisblau eingefärbtes Bild aus dem Reinprügler.

## Technik

Ohne Framework: `src/index.html`, `src/app.css`, `src/js/app.js` (Oberfläche und Ablauf), `src/js/kern.js` (Regeln), `src/js/welt.js` (Kreise, Gesimse, Arenen, Texte).
Gespeichert wird nur auf dem Gerät: `spp.spiel` (Spielstand) und `spp.prog` (Lernkasten) im localStorage.

```bash
npm install
npm run build      # baut nach docs/
npm run serve      # http://localhost:8090, mit -- --lan auch im WLAN
npm test           # spielt die ganze Reise einmal durch, Bildschirmfotos in tools/shots/
```

Karten und Bilder kommen aus dem AP1 und AP2 Reinprügler:

```bash
python3 -I tools/extract_ap1.py "~/Desktop/Reinprügler_APP/ap1hölle-final.html"
```

```bash
python3 -I tools/extract_ap2.py "~/Desktop/Reinprügler_APP/ap2-reinpruegler-ae.html"
```

```bash
python3 -I tools/berg_bilder.py
```

Die AP2-Karten bekommen dabei `ap2-` vor die Kennung und die Gesimse 7 bis 12 als Lernfeld, damit sie sich nicht mit der AP1 überschneiden.
Die App-Symbole zeichnet `python3 -I tools/icons.py`.

Veröffentlicht wird über GitHub Actions (`.github/workflows/pages.yml`) bei jedem Push auf `main`.

Schriften: Cinzel, Atkinson Hyperlegible und Cormorant Garamond (SIL Open Font License, liegen der App bei).
