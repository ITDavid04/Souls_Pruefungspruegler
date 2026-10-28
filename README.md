# Prüfungsprügler

Lernkarten für die Abschlussprüfung Fachinformatik (AP1 und AP2) als Souls-like fürs Handy. Richtig bringt Seelen, falsch kostet Leben.
Wer stirbt, lässt seine Seelen bei der Karte liegen, die ihn erledigt hat, und holt sie sich im nächsten Gang zurück.
Installierbare Web-App (PWA), läuft nach dem ersten Besuch auch ohne Netz.

> **Stand:** Prototyp mit der ganzen Reise: 1134 Karten aus dem AP1 und AP2 Reinprügler, 12 Bosse, Zwischenboss, Endboss,
> dazu abseits des Weges die Katakomben der Kürzel mit 304 Abkürzungen und einem eigenen Boss,
> und zwischen den Karten Rätsel: Rechengegner, Botschaften, Mimic-Truhen und Restore-Notfälle.
> Dazu die Werkstatt mit Subnetz-Klappuhr, Rechenwerk und Zahlenwerk zum Ausprobieren,
> und als Erweiterung **das Pixelparadies**: sieben schwebende Inseln in 8 Bit, AP1 und AP2 nach Themen gemischt, mit Kombos, Bomben und Goldwürfeln.
> Das ganze Spiel lässt sich in zwei Varianten spielen: **Souls** (düster, gemalt) oder **Pixel** (alles in 8 Bit). Umschalten oben auf dem Titel.
> **Live:** https://itdavid04.github.io/Souls_Pruefungspruegler/

## Die Reise, frei nach Dante

| **Abschnitt** | **Prüfung** | **Was dort wartet** |
|---|---|---|
| Der Abstieg | AP1 | Sechs Höllenkreise, einer je Lernfeld (LF1 bis LF6), je ein Boss |
| Kokytos, Grund der Hölle | AP1 komplett | **Der Zwischenprüfer**, öffnet sich, wenn die sechs Bosse des Abstiegs liegen |
| Der Aufstieg | AP2 | Sechs Gesimse am Läuterungsberg, eines je Prüfungsbereich, je ein Boss |
| Der Gipfel, hinter der Feuerwand | AP1 und AP2 | **Der Prüfungsausschuss**, öffnet sich erst, wenn alle dreizehn Bosse liegen |
| Abseits des Weges | AP1 und AP2 | **Die Katakomben der Kürzel**, jederzeit offen, am Ende **der Akronymant** |
| Die Erweiterung | AP1 und AP2 gemischt | **Das Pixelparadies**, jederzeit offen: sieben Himmel als Inseln, je ein Wächter, ganz oben **der Große Glitch** |

Die Gesimse folgen Dantes Todsünden von unten nach oben:

| **Gesims** | **Prüfungsbereich** | **Boss** |
|---|---|---|
| Stolz | Algorithmen und OOP | Die Endlosrekursion |
| Neid | Modellierung und Architektur | Das Gottobjekt |
| Zorn | IT-Systeme und Sicherheit | Der Single Point of Failure |
| Trägheit | Projekt und Qualität | Der Scope Creep |
| Geiz | Wirtschafts- und Sozialkunde | Die Probezeit |
| Völlerei | Datenbanken und SQL | Der kartesische JOIN |

## Der Titel

Der Titel kommt bei jedem Start der App. Über dem Tor steht die Inschrift, darunter mit Kreide nachgetragen „Kleingedrucktes: Wer die Karten lernt,
kommt wieder raus.“ Von oben regnet ein roter Schleier herab, in der Toröffnung glimmt es rot, Augen öffnen sich dort und blinzeln,
und im Nebel flüstert es Prüfungsbegriffe, ab und zu auch „hat jemand meinen Kaffee gesehen“. Alle Lichter atmen langsam und ohne Pause.

Die Angst ist zum Spielen da, nicht für die Prüfung: lieber Augenzwinkern als Herzklopfen. Deshalb gibt es keinen Herzschlag
und kein Flackern, und jeder düstere Satz bekommt irgendwo einen Ausweg.
Augen und Glut liegen in einer Ebene mit den Maßen des Titelbilds (`TITEL_TOR` in `welt.js`), damit sie im Tor bleiben, egal wie groß der Bildschirm ist. Beim ersten Mal stehen die Regeln darunter.
Danach erinnert sich der Titel: an offene Gänge („Weiterkämpfen“ mit Ort und Karte), an liegengebliebene Seelen und daran, wie oft du gestorben bist.
Bei „Bewegung reduzieren“ bleibt alles still.

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

### Die Katakomben der Kürzel

Ein Nebengebiet, das vom ersten Tag an offen ist, also auch für alle, die nur AP2 lernen. Unten liegen 304 Abkürzungen aus der
Abkürzungsjagd: Netzwerk, Hardware, Entwicklung, Datenbanken, Sicherheit, Projekt, Betrieb, Recht und Organisationen.
Gänge, Lagerfeuer, Blutfleck und Nebeltor funktionieren wie in einem Kreis, nur die Fragen sind andere (siehe unten).

| **Seltenheit** | **Anzahl** | **Was sie ausmacht** |
|---|---|---|
| Gewöhnlich | 123 | Standardwissen, kommt ständig vor |
| Selten | 122 | sollte man kennen, bringt 1,2-mal so viele Seelen |
| Legendär | 59 | kennt kaum jemand. Dringt als **rotes Phantom** ein und bringt 1,6-mal so viele Seelen |

Die falschen Langformen sind gemein: Meist ist nur ein Wort gegen ein echtes Fachwort mit demselben Anfangsbuchstaben getauscht,
die Buchstaben passen also immer noch zum Kürzel. Ab und zu taucht eine Spaß-Langform auf („Power over Espresso“).
Wer sie wählt, bekommt „Schön wär’s.“ Nach jeder Antwort steht die echte Langform da, mit den Buchstaben des Kürzels in Glut.

**Das Gebeinhaus** ist das Sammelalbum darunter: Jedes Kürzel, das einmal richtig war, bekommt seine Nische mit Langform und Erklärung,
wer es dreimal hintereinander weiß, dem brennt davor eine Kerze. Nach Kategorie sortiert und durchsuchbar.

**Der Akronymant** wartet hinter dem Nebeltor. Er spricht nur in Abkürzungen und kämpft in drei Beschwörungen, zusammen zehn Treffer:
erst Kürzel aller Art, dann nur legendäre, am Ende nennt er die Langform und du tippst das Kürzel. 30 Leben je Fehler, Kaffee erlaubt.
Für die Feuerwand zum Ausschuss zählt er nicht, Belohnung und Titel gibt es trotzdem.

### Rätsel zwischen den Karten

An manchen Orten lauern zwischen den zehn Karten eines Gangs zusätzlich Rätsel. Sie kommen nicht in den Lernkasten,
viele werden jedes Mal neu gewürfelt, dazu kommen die handverlesenen Aufgaben aus der Subnetz-Klappuhr.

| **Rätsel** | **Was du tust** | **Wo** |
|---|---|---|
| Rechengegner | Netz-ID, Broadcast und Rechner ausrechnen, Maske und Präfix umrechnen, Subnetze planen, sagen, ob zwei Rechner direkt reden dürfen, durch welche Tür ein Router ein Paket schickt, wer einen Frame im VLAN bekommt, IPv6 kürzen und aufklappen, EUI-64 | Dritter Kreis, Gesims des Zorns (größere Netze und mehr IPv6) |
| Botschaft am Boden | Ein Gefallener hat seinen Rechenweg hinterlassen, eine Zeile lügt: die erste falsche antippen | Dritter Kreis, Gesims des Zorns |
| Mimic-Truhe | Zwei Hebel A und B umlegen, beobachten, was die Truhe ausgibt, dann ihr Gatter nennen. Richtig: ein Kaffeeflakon für diesen Lauf. Falsch: Sie beißt | Stadt Dis (LF5), Gesims des Stolzes |
| Der Server brennt | Vollsicherung, differentiell oder inkrementell: die Sicherungen in der richtigen Reihenfolge zurückspielen | Dritter Kreis, Gesims des Zorns |

Im Dritten Kreis und am Gesims des Zorns sind es zwei Rätsel je Gang, in der Stadt Dis und am Gesims des Stolzes eins.
Ein Rätsel bringt 20 Seelen, ein Fehler kostet 20 Leben, die Truhe beißt mit 30 (am Berg wie überall dort etwas mehr). Wer sich bei einer Adresse vertippt
(Buchstaben, fehlende Punkte), bekommt einen Hinweis statt Schaden; Kommas statt Punkten zählen, weil die Handy-Tastatur sie anbietet.
Wer an einem Rätsel stirbt, lässt die Seelen bei genau diesem Rätsel liegen, und es wartet im nächsten Gang als Erstes.
Die Bosse dieser Orte werfen einmal im Kampf selbst ein Rätsel.

### Die Werkstatt

Drei Werkzeuge aus dem Reinprügler-Ordner, zum Ausprobieren ohne Leben und Seelen: die **Subnetz-Klappuhr** (Subnetze,
Router, Switch und VLAN, IPv6), das **Rechenwerk** (binär addieren, Volladdierer, Gatter, Netzmaske als UND, „Welches Gatter
steckt im Kasten?“) und das **Zahlenwerk** (Zahlensysteme, KB gegen KiB, Leitungsrechner). Sie liegen als eigene Seiten
in der App, laufen offline und tragen den Souls-Anstrich; erreichbar vom Lagerfeuer.

Nach einem falschen Rätsel und auf dem Todesbildschirm steht „In der Werkstatt nachsehen“. Die Klappuhr ist dann schon auf
genau diese Aufgabe gestellt (Adresse und Präfix, die Routingtabelle mit dem Ziel, der VLAN-Frame, das IPv6-Beispiel),
nach einer Mimic-Truhe öffnet das Rechenwerk die Gatterwand. Oben führt „Zurück zum Kampf“ ohne Titel wieder in den Gang.
Den Übungsteil der Klappuhr (Vorhersagen, Fehler finden) gibt es nur im Spiel, als Rätsel.

### Klassen

Am Lagerfeuer wählst du eine Klasse, jederzeit frei wechselbar. Jede gibt einen Titel, eine eigene Klangfarbe im Kampf und eine sanfte Gabe, ganz ohne Nachteile:

- **Krieger (Mainframe)** hat mehr Leben und hält mehr aus. Klang: Stahl.
- **Magier (Rootmancer)** bekommt mehr Seelen für jede richtige Antwort. Klang: Feuer.
- **Priester (Recoveron)** hat SafeMode: einmal je Gang überlebt er den tödlichen Treffer bei 1 Leben. Klang: heiliger Schimmer.

Ohne Klasse spielt sich alles wie bisher, die Klangfarbe im Kampf richtet sich dann nach dem Ort.

### Ruhiger Modus und AP2-Abkürzung

Unter „Spielstand“ liegen zwei Schalter zum Lernen ohne Druck:

- **Ruhiger Modus** nimmt Leben und Tod heraus. Falsche Antworten kosten nichts, es gibt keinen Blutfleck und kein Sterben. Im Kampf verschwinden Lebensbalken und Kaffee, stattdessen brennt oben ein ruhiger Kerzenpunkt. Seelen und Stufen laufen weiter.
- **Nur AP2 lernen** öffnet den Läuterungsberg sofort, auch ohne den Zwischenprüfer. Die AP1 bleibt dabei gesperrt. Der Schalter ist nur sichtbar, solange der Berg nicht ohnehin schon offen ist.

### Musik

Unter „Spielstand“ liegt der Schalter „Musik“ (Voreinstellung an). Nach dem ersten Tippen spielt leise, prozedural erzeugte Musik ohne Takt: einzelne weiche Töne aus einer festen Tonleiter über einem atmenden Grundton, ganz ohne Audiodateien. Jeder Ort klingt anders: das Lagerfeuer warm, die Hölle dunkel mit leiser Glut, der Kokytos gläsern, die Katakomben hohl, der Berg nach Glocken, der Gipfel nach feierlichen Quinten. Beim Ortswechsel blendet sie langsam über. Im Bosskampf wird sie nicht schneller, sondern tiefer, und fällt der Boss, löst ein Dur-Akkord alles auf. Mit Musik weht der Wind etwas leiser. Das Pixelparadies bleibt vorerst still. Die Hörprobe zum Abstimmen liegt in `tools/hoerprobe/`.

### Wind

Unter „Spielstand“ liegt der Schalter „Wind“. Ist er an (Voreinstellung), weht nach dem ersten Tippen ein ruhiger, prozedural erzeugter Wind, ganz ohne Audiodateien. Er schwillt langsam an und ab, nie plötzlich, und schläft, wenn der Tab im Hintergrund liegt. Ton beginnt erst nach dem ersten Tippen, weil der Browser ihn bis dahin sperrt.

### Kampfklang

Unter „Spielstand“ liegt der Schalter „Kampfklang“ (Voreinstellung an). Beim Antworten im Kampf klingt ein kurzer, prozedural erzeugter Ton: ein Treffer bei richtig, ein dumpfer Schlag bei falsch, ein Biss an der Mimic-Truhe. Jeder Ort klingt etwas anders (die Hölle knistert, die Katakomben raunen, der Berg schimmert, der Gipfel klingt nach Stahl). Auch der Kaffeeschluck und der Stufenaufstieg haben ihren Klang. Alles läuft auf derselben Tonebene wie der Wind.

### Prototyp-Schalter

Unter „Spielstand“ öffnet „Prototyp: alle Tore offen“ den Berg, alle Nebeltore und beide Arenen, ohne dass Bosse als besiegt gelten.
Damit lässt sich alles ansehen, ohne erst die AP1 durchzuspielen. Vor einer breiteren Veröffentlichung kommt er raus.


## Das Pixelparadies (Erweiterung)

Dantes dritter Teil, in 8 Bit. Über dem Lagerfeuer flackert ein buntes Quadrat in der Luft, dahinter liegt das Gegenteil von Hölle und Berg:
heller Himmel, schwebende Inseln wie in Fez, kräftige Farben mit dunklen Umrissen, ein bisschen Leuchten wie bei Ori. Hier oben stirbt niemand,
man fällt höchstens auf eine Wolke. Es ist vom ersten Tag an offen, auch für alle, die nur AP2 lernen.

Die sieben Inseln folgen Dantes Himmeln von unten nach oben. Jede holt sich ihr Thema **aus AP1 und AP2 zugleich**, und die Themen laufen
im Sprung reihum, abwechselnd aus beiden Prüfungen. Der Lernkasten ist derselbe wie unten: Was oben sitzt, sitzt auch in den Kreisen und Gesimsen.

| **Himmel** | **Thema** | **Karten** | **Wächter** |
|---|---|---|---|
| Mond | Projekt, Qualität und Service | 204 | Der Neunzig-Prozent-Golem |
| Merkur | Netze und Protokolle | 100 | Der Lag-Drache |
| Venus | Datenbanken und Datenmodelle | 90 | Das NULL-Gespenst |
| Sonne | Code und Modellierung | 216 | Der Spaghetticode |
| Mars | Sicherheit und Datenschutz | 142 | Der Phishing-Hai |
| Jupiter | Wirtschaft und Recht | 252 | Das Kleingedruckte |
| Saturn | Hardware und Betrieb | 130 | Der Bluescreen |
| Fixsternhimmel | alle sieben | | **Der Große Glitch**, drei Formen |

Welche Karte auf welcher Insel liegt, steht in `welt.js` (`himmelVon`): Das Lernfeld gibt die Insel vor, einzelne Themen ziehen woandershin
(zum Beispiel „Kaufvertrag“ aus LF2 nach Jupiter, „Netzsicherheit“ aus der AP2 nach Mars). So landet jede Karte irgendwo, auch neue Themen.

| **Regel** | **Was passiert** |
|---|---|
| Sprung | 10 Karten, am Ende landest du auf einer Wolke. Statt Lebensbalken gibt es **fünf Herzen**, ein Fehler kostet eins |
| Kombo | Richtig hintereinander zählt hoch. Ab ×5 gibt es zwei Splitter je Treffer, ab ×10 drei, und alle fünf Treffer knallt es |
| Goldwürfel | **Acht Splitter** sind ein Goldwürfel. Er ist sofort sicher. Die Landung bringt zwei Splitter extra, ein fehlerfreier Sprung eine **Schatzkiste** mit einem Goldwürfel |
| Bomben | Zwei Karten je Sprung kommen mit brennender **Lunte** (15 Sekunden, auch nach dem Neuladen). Richtig heißt entschärft und zwei Splitter extra, falsch oder zu langsam kostet zwei Herzen und es macht BOOM. Mit Lunte wird nie getippt |
| Absturz | Alle Herzen weg: Du fällst auf eine Wolke. Keine Seelen verloren, kein Blutfleck, kein Tod. Nur die losen Splitter im Beutel fallen mit, ganze Goldwürfel bleiben. Die Karte, die dich runtergeschubst hat, steht mit Erklärung da |
| Abspringen | Jederzeit auf eine Wolke abspringen: Der Sprung zählt nicht, Seelen, Splitter und Würfel nimmst du mit |
| Würfeltor | **Drei Goldwürfel** auf einer Insel öffnen das Tor zu ihrem Wächter: acht Treffer, jede dritte Frage mit Lunte, ab Kombo ×3 trifft jeder Treffer **doppelt** |
| Herzcontainer | Jeder Wächter gibt beim ersten Sieg ein Herz mehr für alle Sprünge, dazu 200 Seelen und einen Titel |
| Der Große Glitch | Offen, wenn alle sieben Wächter liegen. Drei Formen (Mond bis Sonne, Mars bis Saturn, alles), zusammen 13 Treffer. Er wirft jede zweite Frage eine Bombe, in der letzten Form jede |

**Startwelt:** Unter „Spielstand“ (oder auf der Inselkarte mit „Hier starten“) lässt sich das Pixelparadies als Startwelt wählen.
Dann kommt beim Start ein bunter Titel mit drei schwebenden Inseln statt Tor und Spuk, und danach geht es direkt zur Inselkarte.
Ein laufender Kampf geht wie immer vor.

Seelen gibt es oben wie unten, Stufe und Kaffee gelten auch: Ein Flakon heilt zwei Herzen. Der Krieger hat ein Herz mehr, der Magier bekommt mehr Seelen,
der Priester fängt den letzten Treffer bei einem Herzen ab. Im Ruhigen Modus gibt es keine Bomben und Fehler kosten keine Herzen.
Klang: kurze 8-Bit-Töne (Münze, Würfel-Fanfare, Knall, Absturz) über denselben Schalter „Kampfklang“. Bei „Bewegung reduzieren“ bleibt
vom Knall nur der Schriftzug, ohne Funken und Beben.

Alles Bunte hängt an `body[data-welt="pixel"]` in `app.css`. Die Figuren (Bit, der kleine Prüfling mit der Kaffeetasse als Hut, die Wächter,
Herzen, Würfel, Bombe, Schatzkiste) zeichnet `src/js/pixel.js` als Pixel-SVG mit Umriss, dazu den Knall mit eckigen Funken.
Himmel, Inseln und die Szenen für den Spielstil Pixel malt `python3 -I tools/pixel_bilder.py` Pixel für Pixel in kleiner Auflösung (verlustfreies WebP, zusammen etwa 250 KB),
die App vergrößert sie ohne Glätten.


## Zwei Varianten: Souls oder Pixel

Oben rechts auf dem Titel (und unter „Spielstand“) liegt der Schalter **Souls | Pixel**. Er wirkt sofort und gilt für das ganze Spiel.
Regeln, Karten, Lernstand, Seelen und Blutfleck bleiben gleich, es wechselt nur das Aussehen:

| **Was** | **Souls** | **Pixel** |
|---|---|---|
| Titel | Das Tor mit Augen, Flüstern und rotem Schleier | Drei schwebende Inseln, Bit, ein Logo, das hereinknallt |
| Lagerfeuer | Gemalte Flamme mit Schwert | Pixelfeuer mit Schwert und eckigen Funken unter Sternen |
| Kreise, Gesimse, Arenen | Die gemalten Bilder des Reinprüglers und die Silhouetten am Berg | Eigene Pixelszenen: Lastenwälzer, Blutfluss, Sturm, Cerberus im Schlamm, Stadt Dis, Styx, die sechs Gesimse, Katakomben, Kokytos, Feuerwand, Prüfungsraum |
| Bosse | Name und Balken | Jeder Boss als Pixelfigur, im Kampf, am Nebeltor und beim Sieg (beim Zwischenprüfer und im Ausschuss je Phase eine eigene) |
| Werkstatt | Dunkler Souls-Anstrich | Heller Originalanstrich der Werkzeuge, Kopfzeile in 8 Bit |

Am Handy steht die Szene eines Ortes gerahmt oben auf der Seite, als Vollbild wäre dort nur ein schmaler Ausschnitt zu sehen;
am breiten Bildschirm füllt sie den ganzen Hintergrund. Der Spielstil ist unabhängig von der Startwelt: Wer will, spielt düster
und startet trotzdem im Pixelparadies, oder umgekehrt.

Technik: `S.stil` ist `souls` oder `pixel`. Im Pixelstil trägt `body` immer `data-welt="pixel"`, und `app.css` malt alle Ansichten
in 8 Bit. Jedes gemalte Bild hat ein Gegenstück (`PIXEL_BILDER` in `welt.js`), das `tools/pixel_bilder.py` zeichnet.
Die Bossfiguren und das Pixelfeuer stehen in `src/js/pixel.js`, die Werkstatt liest den Stil in `src/werkstatt/werkstatt-stil.js`.

## Fragen

| **Art** | **Wann** |
|---|---|
| Welcher Begriff ist gemeint? | vor allem bei neuen Karten |
| Welche Erklärung passt? | gemischt |
| Begriff eintippen | je besser eine Karte sitzt, desto öfter. Tippfehler zählen, lange Begriffe werden nie getippt |

In den Katakomben sind es Kürzel-Fragen, ebenfalls nach Lernstand gemischt:

| **Art** | **Was dasteht** | **Was du tust** |
|---|---|---|
| Wofür steht das Kürzel? | das Kürzel, groß | aus vier Langformen die echte wählen |
| Welches Kürzel ist gemeint? | die Erklärung (das Kürzel selbst darin verdeckt) | aus vier Kürzeln wählen |
| Kürzel eintippen | die Langform | das Kürzel tippen, Groß- und Kleinschreibung egal |

Dahinter steckt ein Lernkasten mit fünf Fächern wie im Reinprügler (Wiederholung nach 0, 1, 3, 7 und 14 Tagen).
Ein Gang nimmt zuerst den Blutfleck, dann fällige Karten, dann neue in Themenreihenfolge, dann wacklige.

## Bilder

Die Hölle besteht aus den gemalten Bildern des Reinprüglers. Der Berg ist bewusst anders: Silhouetten im Morgenlicht, mit jedem
Gesims ein bisschen heller. Jedes Gesims versteckt ein Motiv aus seinem Prüfungsbereich, etwa eine gemeißelte Spirale (Rekursion),
ein Klassendiagramm aus Sternen, Wolken wie ein Gantt-Diagramm oder einen Baum, dessen Früchte in Zeilen und Spalten hängen.
Gemalt werden sie von `tools/berg_bilder.py` (nur Pillow, immer gleiches Ergebnis). Der Kokytos ist ein eisblau eingefärbtes Bild aus dem Reinprügler.
Die Katakomben malt `tools/katakomben_bild.py`: ein Gewölbegang mit Schädelnischen und Kerzen, auf den Schlusssteinen eingemeißelte Kürzel,
und ganz hinten im glühenden Raum steht der Akronymant. Hinter seinem Nebeltor wartet ein Bild aus dem Reinprügler mit einer großen schwarzen Tafel.

## Technik

Ohne Framework: `src/index.html`, `src/app.css`, `src/js/app.js` (Oberfläche und Ablauf), `src/js/kern.js` (Regeln), `src/js/raetsel.js` (Rätsel: Generatoren, Aufgaben aus der Klappuhr, Prüfen), `src/js/welt.js` (Kreise, Gesimse, Arenen, Inseln, Texte), `src/js/pixel.js` (Pixelfiguren und Knall), `src/js/ton.js` (Musik, Wind und Klänge).
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
python3 -I tools/extract_kuerzel.py "~/Desktop/Reinprügler_APP/Abkürzungsjagd.html"
```

```bash
python3 -I tools/berg_bilder.py
```

```bash
python3 -I tools/katakomben_bild.py
```

```bash
python3 -I tools/pixel_bilder.py
```

```bash
python3 -I tools/werkstatt.py "~/Desktop/Reinprügler_APP"
```

Die AP2-Karten bekommen dabei `ap2-` vor die Kennung und die Gesimse 7 bis 12 als Lernfeld, damit sie sich nicht mit der AP1 überschneiden.
Die Kürzel landen in `data/kuerzel.json` mit `k-` vor der Kennung und der 13 als Ort; neue kommen in die Gänge, über alle Kategorien gemischt,
die legendären ab dem dritten Gang.
`tools/werkstatt.py` holt die drei Werkzeuge nach `src/werkstatt/`: ohne Google-Schriften, ohne Gedankenstriche, mit Kopfzeile,
und die Klappuhr lässt sich per Link voreinstellen (`klappuhr.html#tab=clock&ip=192.168.1.60&p=26`). Den Anstrich liefert `src/werkstatt/werkstatt.css`.
Die App-Symbole zeichnet `python3 -I tools/icons.py`.

Veröffentlicht wird über GitHub Actions (`.github/workflows/pages.yml`) bei jedem Push auf `main`.

Schriften: Cinzel, Atkinson Hyperlegible, Cormorant Garamond und im Pixelparadies Pixelify Sans (SIL Open Font License, liegen der App bei).
