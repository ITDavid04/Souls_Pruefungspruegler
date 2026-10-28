/* Die Welt, frei nach Dante: sechs Kreise hinab (AP1), der Zwischenprüfer im Eis, sechs Gesimse den Läuterungsberg
   hinauf (AP2), oben hinter der Feuerwand der Prüfungsausschuss. Bosse und Titel wie im AP1 und AP2 Reinprügler.
   lf 1 bis 6 sind die Lernfelder der AP1, lf 7 bis 12 die Prüfungsbereiche der AP2 (siehe tools/extract_ap2.py). */

export const AKTE = [
  { akt: 1, name: 'Der Abstieg', zusatz: 'AP1 · Sechs Kreise hinab' },
  { akt: 2, name: 'Der Aufstieg', zusatz: 'AP2 · Sechs Gesimse hinauf' }
];

export const KREISE = [
  {
    lf: 1, akt: 1, nr: 'Erster Kreis', name: 'Die Lastenwälzer', bild: 'kreis-04', lfName: 'Unternehmen und eigene Rolle', kurz: 'LF1',
    zitat: 'Schwere Lasten wälzen sie gegeneinander, die Sachziele wider die Formalziele, und brüllen einander an: Wer hat hier Prokura? Wer haftet mit seinem Privatvermögen? Keiner weiß es, und die Last rollt weiter.',
    boss: 'Die Matrix\u00ADorganisation', bossZusatz: 'Dienerin zweier Herren', titel: 'Vogt der Vollmachten'
  },
  {
    lf: 2, akt: 1, nr: 'Zweiter Kreis', name: 'Der Blutfluss', bild: 'kreis-08', lfName: 'Arbeitsplätze ausstatten', kurz: 'LF2',
    zitat: 'Im siedenden Strom stehen jene, die mit bloßer Hand ins offene Gehäuse griffen. Ein Funke nur, unsichtbar und lautlos, und die Platine war verloren. Am Ufer warten die, die ohne Angebotsvergleich bestellten, auf eine Lieferung, die nie kommt.',
    boss: 'Der Lieferverzug', bossZusatz: 'Wächter der Nachfrist', titel: 'Schmied der Arbeitsplätze'
  },
  {
    lf: 3, akt: 1, nr: 'Dritter Kreis', name: 'Der Sturm', bild: 'kreis-03', lfName: 'Clients in Netzwerke einbinden', kurz: 'LF3',
    zitat: 'Ein Wirbelsturm ohne Rast treibt jene umher, die dem Glanz der Datenblätter erlagen. Sie schworen auf die Bruttorate, und nun peitscht sie der Wind der geteilten Bandbreite.',
    boss: 'Der Broadcast-Sturm', bossZusatz: 'Herr der Schleifen', titel: 'Wächter der Adressen'
  },
  {
    lf: 4, akt: 1, nr: 'Vierter Kreis', name: 'Der Schlamm', bild: 'kreis-06', lfName: 'Schutzbedarfsanalyse', kurz: 'LF4',
    zitat: 'Kalter, schwerer Regen fällt auf die Maßlosen, die jedem Benutzer alle Rechte gaben. Über ihnen bellt der dreiköpfige Wächter aus drei Mäulern: Vertraulichkeit! Integrität! Verfügbarkeit!',
    boss: 'Der Kumulations\u00ADeffekt', bossZusatz: 'Summe aller Schrecken', titel: 'Hüter der Schutzziele'
  },
  {
    lf: 5, akt: 1, nr: 'Fünfter Kreis', name: 'Die Stadt Dis', bild: 'kreis-09', lfName: 'Software und Daten', kurz: 'LF5',
    zitat: 'In glühenden Gräbern liegen die Ketzer, die lehrten, ein Spiegel sei eine Sicherung. Daneben jene, deren Schleife nie ein Abbruchkriterium fand. Sie zählen noch immer.',
    boss: 'Die Endlosschleife', bossZusatz: 'die niemals bricht', titel: 'Bändiger der Schleifen'
  },
  {
    lf: 6, akt: 1, nr: 'Sechster Kreis', name: 'Der Styx', bild: 'kreis-05', lfName: 'Serviceanfragen bearbeiten', kurz: 'LF6',
    zitat: 'Im schwarzen Sumpf schlagen die Zornigen aufeinander ein. Sie brüllten den Drucker an und den Kunden dazu, und keiner von ihnen schrieb je ein Ticket.',
    boss: 'Der eskalierte Kunde', bossZusatz: 'Fürst der offenen Tickets', titel: 'Schließer der Tickets'
  },
  /* Der Aufstieg: die Reihenfolge folgt Dantes Gesimsen von unten nach oben, nicht der Nummer im Reinprügler */
  {
    lf: 7, akt: 2, nr: 'Erstes Gesims', name: 'Gesims des Stolzes', bild: 'gesims-stolz', lfName: 'Algorithmen und OOP', kurz: 'AP2',
    zitat: 'Gebeugt unter Felsbrocken, so schwer wie ihr Aufrufstapel, schleppen sich jene, die glaubten, ihr Code brauche weder Abbruchbedingung noch Kommentar. In die Wand ist eine Spirale gemeißelt. Sie endet nie.',
    boss: 'Die Endlos\u00ADrekursion', bossZusatz: 'die ihren Abbruch vergaß', titel: 'Bezwinger der Rekursion'
  },
  {
    lf: 8, akt: 2, nr: 'Zweites Gesims', name: 'Gesims des Neides', bild: 'gesims-neid', lfName: 'Modellierung und Architektur', kurz: 'AP2',
    zitat: 'Mit verbundenen Augen lehnen sie aneinander, die fremden Klassen ihre Attribute neideten und von allem erbten, was nicht bei drei auf dem Baum war. Über ihnen leuchtet ein Klassendiagramm aus Sternen. Sie werden es nie sehen.',
    boss: 'Das Gottobjekt', bossZusatz: 'das alles weiß und alles tut', titel: 'Baumeister der Diagramme'
  },
  {
    lf: 11, akt: 2, nr: 'Drittes Gesims', name: 'Gesims des Zorns', bild: 'gesims-zorn', lfName: 'IT-Systeme und Sicherheit', kurz: 'AP2',
    zitat: 'Beißender Rauch, so dick, dass man die eigene Hand nicht sieht. Darin tasten die Zornigen nach dem einen Server, an dem alles hing. Irgendwo leuchtet eine rote Lampe. Keiner weiß, wofür.',
    boss: 'Der Single Point of Failure', bossZusatz: 'Herr des Stillstands', titel: 'Wächter der Verfügbarkeit'
  },
  {
    lf: 10, akt: 2, nr: 'Viertes Gesims', name: 'Gesims der Trägheit', bild: 'gesims-traegheit', lfName: 'Projekt und Qualität', kurz: 'AP2',
    zitat: 'Ohne Rast rennen hier jene, die den Puffer verschliefen und das Testen auf morgen schoben. Über ihnen ziehen Wolken wie Balken eines Gantt-Diagramms. Der kritische Weg ist lang, und sie sind spät dran.',
    boss: 'Der Scope Creep', bossZusatz: 'Fresser der Meilensteine', titel: 'Hüter des kritischen Wegs'
  },
  {
    lf: 12, akt: 2, nr: 'Fünftes Gesims', name: 'Gesims des Geizes', bild: 'gesims-geiz', lfName: 'Wirtschafts- und Sozialkunde', kurz: 'AP2',
    zitat: 'Bäuchlings, das Gesicht im Staub, liegen jene, die den Urlaub verfallen ließen und die Kündigungsfrist nicht kannten. Zwischen ihnen glänzen Münzen. Keiner hebt sie auf. Es ist kein Tarifvertrag dabei.',
    boss: 'Die Probezeit', bossZusatz: 'Herrin der zweiwöchigen Frist', titel: 'Kenner der Kündigungsfristen'
  },
  {
    lf: 9, akt: 2, nr: 'Sechstes Gesims', name: 'Gesims der Völlerei', bild: 'gesims-voellerei', lfName: 'Datenbanken und SQL', kurz: 'AP2',
    zitat: 'Abgemagert stehen sie unter einem umgedrehten Baum, die jede Tabelle mit jeder verbanden und nie genug Zeilen bekamen. Die Früchte hängen in Zeilen und Spalten. Ohne WHERE kommt keiner heran.',
    boss: 'Der kartesische JOIN', bossZusatz: 'Vervielfacher der Zeilen', titel: 'Fürst der Fremdschlüssel'
  }
];
/* Abseits des Weges: jederzeit offen, Gänge und Lagerfeuer wie in einem Kreis, aber mit den Kürzeln aus AP1 und AP2
   (data/kuerzel.json, aus der Abkürzungsjagd). Am Ende ein Boss mit drei Beschwörungen. Für die Ausschuss-Feuerwand zählt er nicht. */
export const KATAKOMBEN = {
  lf: 13, akt: 0, nr: 'Abseits des Weges', name: 'Die Katakomben der Kürzel', bild: 'katakomben', kampfBild: 'kreis-02',
  lfName: 'Abkürzungen aus AP1 und AP2', kurz: 'Kürzel', wo: 'in den Katakomben der Kürzel',
  zitat: 'Neben dem Lagerfeuer führt eine Treppe hinab. Unten liegen sie in Nischen, Schädel an Schädel, jeder mit ein paar Buchstaben auf der Stirn. Keiner weiß mehr, wofür sie standen. In der Prüfung fragt man trotzdem danach.',
  boss: 'Der Akronymant', bossZusatz: 'Er ruft die Kürzel aus ihren Gräbern', titel: 'Entzifferer der Kürzel',
  seelen: 200, schaden: 30, phasenWort: 'Beschwörung',
  schluss: 'Der Akronymant zerfällt zu drei Buchstaben. Keiner weiß, wofür sie standen. Du schon.',
  regeln: [
    'Drei Beschwörungen, zusammen <b>zehn Treffer</b>.',
    'Erst ruft er Kürzel aller Art, dann nur <b>legendäre</b>, am Ende nennt er die Langform, und du <b>tippst</b> das Kürzel.',
    'Jeder Fehler kostet <b>30 Leben</b>. Kaffee ist erlaubt, Fliehen auch.'
  ],
  phasen: [
    { name: 'Der Akronymant', zusatz: 'Er spricht nur in Abkürzungen', lfs: [13], treffer: 4, ende: 'Der Akronymant taumelt und greift nach den tiefsten Nischen.',
      auftritt: 'Der Akronymant hebt die Knochenhand: „IMHO ist hier für dich EOL. ASAP.“',
      treffer_: ['„Das war … korrekt. FYI.“', 'Ein Schädel in der Wand nickt dir zu.', 'Der Akronymant verliert einen Buchstaben.'],
      fehler: ['„LOL.“ Er sagt es, wie man es schreibt.', 'Aus einer Nische kichert es in Großbuchstaben.', '„RTFM, Sterblicher.“'] },
    { name: 'Die legendären Toten', zusatz: 'Kürzel, die kaum jemand kennt', lfs: [13], seltenheit: 3, treffer: 3, ende: 'Die Ältesten sinken in ihre Gräber zurück.',
      auftritt: 'Er ruft die Ältesten aus den tiefsten Nischen. Ihre Namen kennt kaum jemand. Du gleich schon.',
      treffer_: ['Ein Ältester zerfällt zu Staub und Buchstaben.', '„Woher weißt du das?“', 'Selbst die Wand ist beeindruckt.'],
      fehler: ['Der Älteste lächelt. Er hat Zeit, er ist legendär.', '„Kennt kaum jemand. Du auch nicht.“', 'Staub rieselt von der Decke.'] },
    { name: 'Der Akronymant, rückwärts', zusatz: 'Langform rein, Kürzel raus', lfs: [13], typ: 'tippen', treffer: 3, ende: 'Ihm gehen die Buchstaben aus.',
      auftritt: '„Genug gewählt. Jetzt schreib es selbst.“ Er nennt die Langform und wartet.',
      treffer_: ['Er murmelt die Buchstaben nach. Sie gehören jetzt dir.', '„Groß- und Kleinschreibung zählt nicht. Ich zähle trotzdem mit.“', 'Ein Buchstabe fällt ihm aus dem Mund.'],
      fehler: ['„Fast. Also nicht.“', 'Er schreibt deine Antwort in den Staub und wischt sie wieder weg.', '„TL;DR: falsch.“'] }
  ]
};
const GEBIETE = KREISE.concat([KATAKOMBEN]);
export const kreis = lf => GEBIETE.find(k => k.lf === lf);
export const kreiseVon = akt => KREISE.filter(k => k.akt === akt);
/* Seltenheit der Kürzel wie in der Abkürzungsjagd; legendäre dringen als rote Phantome ein */
export const SELTENHEIT = { 1: 'Gewöhnlich', 2: 'Selten', 3: 'Legendär' };
export const PHANTOM = [
  'Ein rotes Phantom ist eingedrungen.',
  'Ein legendäres Kürzel kriecht aus seiner Nische. Kennt kaum jemand. Gleich du.',
  'Rotes Phantom erscheint. Es hofft, dass du es nicht kennst.',
  'Etwas Altes regt sich in der Wand. Es bringt mehr Seelen.'
];
export const KUERZEL_SPASS = 'Schön wär’s.';
export const KATEGORIEN = ['Netzwerk', 'Hardware', 'Entwicklung', 'Datenbanken', 'Sicherheit', 'Projekt und Service', 'Betrieb und Cloud', 'Recht und Wirtschaft', 'Organisationen'];

/* Arenen ohne Gänge: nur ein Bosskampf mit mehreren Phasen und eigenen Regeln.
   kaffee: 'ja' wie immer, 'gefroren' = erst leer, je gefallener Phase taut ein Flakon auf, 'nein' = gar keiner.
   zeit: Sekunden je Frage (0 = ohne Uhr). tippfehler: Leben, die ein Tippfehler trotz Treffer kostet. */
export const ARENEN = {
  kokytos: {
    id: 'kokytos', akt: 1, nr: 'Grund der Hölle', name: 'Kokytos', bild: 'kokytos', ort: 'Der gefrorene See',
    zitat: 'Ganz unten, wo die Hölle zu Eis gefriert, steckt er bis zur Brust im See. Drei Gesichter, sechs Flügel, und jedes Gesicht kaut auf einer Prüfungsfrage. Früher hieß er Zwischenprüfung. Den neuen Namen hat er nie akzeptiert.',
    boss: 'Der Zwischen\u00ADprüfer', bossZusatz: 'Dreigesichtig, im Eis des Kokytos', titel: 'Bezwinger der Zwischenprüfung',
    voraus: [1, 2, 3, 4, 5, 6], schaden: 35, kaffee: 'gefroren', zeit: 0, tippfehler: 0, seelen: 300, phasenWort: 'Gesicht',
    schluss: 'Das Eis bricht. Alle drei Gesichter schweigen …',
    regeln: [
      'Drei Gesichter, je <b>drei Treffer</b>. Jedes Gesicht fragt zwei Lernfelder ab.',
      'Im Eis ist der <b>Kaffee gefroren</b>. Fällt ein Gesicht, taut ein Flakon auf.',
      'Jeder Fehler kostet <b>35 Leben</b>. Wer flieht, darf wiederkommen.'
    ],
    phasen: [
      { name: 'Das rote Gesicht', zusatz: 'Wirtschaft und Arbeitsplatz', lfs: [1, 2], treffer: 3, ende: 'Das rote Gesicht erstarrt im Eis.',
        auftritt: 'Das rote Gesicht öffnet die Augen: „Was kostet das, und wer haftet dafür?“',
        treffer_: ['Das rote Gesicht knirscht mit den Zähnen.', 'Ein Riss läuft durch das Eis.', '„Hm. Und die Umsatzsteuer?“'],
        fehler: ['„Netto oder brutto? Sie wissen es nicht.“', 'Das rote Gesicht lacht. Der See bebt.', '„Das hätte die Matrixorganisation besser gewusst.“'] },
      { name: 'Das bleiche Gesicht', zusatz: 'Netz und Schutz', lfs: [3, 4], treffer: 3, ende: 'Das bleiche Gesicht erstarrt im Eis.',
        auftritt: 'Das rote Gesicht erstarrt. Das bleiche wendet sich dir zu: „Welche Adresse? Welches Schutzziel?“',
        treffer_: ['Das bleiche Gesicht blinzelt. Eis bröckelt.', '„Korrekt. Leider.“', 'Ein Flügel friert fest.'],
        fehler: ['„Broadcast. Immer Broadcast.“', 'Ein kalter Wind fegt über den See.', '„Vertraulichkeit hätten Sie haben können.“'] },
      { name: 'Das schwarze Gesicht', zusatz: 'Code und Kunde', lfs: [5, 6], treffer: 3, ende: 'Das schwarze Gesicht erstarrt im Eis.',
        auftritt: 'Das bleiche Gesicht erstarrt. Das schwarze flüstert: „Und wenn die Schleife nicht endet, wen rufen Sie an?“',
        treffer_: ['Das schwarze Gesicht verstummt kurz.', '„Ticket angenommen.“', 'Das Eis knackt laut.'],
        fehler: ['„Ein Fehler. Wie oft noch? Endlos?“', 'Das schwarze Gesicht lächelt. Das ist schlimmer.', '„Eskalationsstufe zwei.“'] }
    ]
  },
  gipfel: {
    id: 'gipfel', akt: 2, nr: 'Der Gipfel', name: 'Hinter der Feuerwand', bild: 'feuerwand', kampfBild: 'ausschuss', ort: 'Der Prüfungsraum',
    zitat: 'Wer zum Gipfel will, muss durch das Feuer. Dahinter ein Raum mit einem langen Tisch, drei Stühlen und einem vierten, einzelnen. Drei sitzen am Tisch, und keiner von ihnen lächelt. Der vierte Stuhl ist für dich.',
    boss: 'Der Prüfungs\u00ADausschuss', bossZusatz: 'Drei Prüfende, ein Stuhl', titel: 'Mit Brief und Siegel',
    voraus: [1, 2, 3, 4, 5, 6, 'kokytos', 7, 8, 9, 10, 11, 12], schaden: 40, kaffee: 'nein', zeit: 20, tippfehler: 10, seelen: 1000, phasenWort: 'Prüfer',
    schluss: 'Der Vorsitz legt den Stift weg und schließt die Akte …',
    regeln: [
      'Drei Prüfende nacheinander, je <b>vier Treffer</b>. Fragen aus AP1 und AP2.',
      '<b>20 Sekunden</b> je Frage. <b>Kein Kaffee</b> im Prüfungsraum.',
      'Jeder Fehler kostet <b>40 Leben</b>, ein Tippfehler <b>10</b>. Wer den Raum verlässt, ist durchgefallen.'
    ],
    phasen: [
      { name: 'Die Beauftragte der Arbeitgeber', zusatz: 'Wirtschaft, Projekt, WiSo', lfs: [1, 2, 10, 12], treffer: 4, ende: 'Die Beauftragte der Arbeitgeber legt den Stift weg. Keine Fragen mehr.',
        auftritt: 'Die Beauftragte der Arbeitgeber schiebt dir ein Blatt hin: „Rechnen Sie mir das vor. Mit Rechenweg.“',
        treffer_: ['„Gut. Und was kostet uns das?“', 'Sie macht einen Haken. Einen kleinen.', '„Das hätte ich gern schriftlich. Ach, haben Sie ja.“'],
        fehler: ['„Das rechnen wir lieber nochmal. Sie, nicht ich.“', 'Sie notiert etwas. Es ist länger als ein Haken.', '„Interessant. Falsch, aber interessant.“'] },
      { name: 'Der Beauftragte der Arbeitnehmer', zusatz: 'Schutz, Sicherheit, Service', lfs: [4, 6, 11], treffer: 4, ende: 'Der Beauftragte der Arbeitnehmer nickt und reicht das Wort weiter.',
        auftritt: 'Der Beauftragte der Arbeitnehmer lehnt sich zurück: „Und wie erklären Sie das dem Kunden?“',
        treffer_: ['„Das würde sogar der Kunde verstehen.“', 'Er nickt. Fast freundlich.', '„Verfügbarkeit gesichert. Weiter.“'],
        fehler: ['„Der Kunde hätte jetzt aufgelegt.“', 'Er seufzt so, dass du es hörst.', '„Datenschutz ist kein Wahlfach.“'] },
      { name: 'Die Lehrkraft der Berufsschule', zusatz: 'Netze, Software, Code, Daten', lfs: [3, 5, 7, 8, 9], treffer: 4, ende: 'Die Lehrkraft der Berufsschule klappt den Rahmenlehrplan zu.',
        auftritt: 'Die Lehrkraft der Berufsschule klappt den Rahmenlehrplan auf: „So steht das aber nicht drin. Erklären Sie mal.“',
        treffer_: ['„So steht es tatsächlich drin.“', 'Sie lächelt. Kurz. Dann nicht mehr.', '„Das haben Sie nicht von mir. Aber richtig.“'],
        fehler: ['„Das haben wir im zweiten Lehrjahr gemacht.“', 'Sie schreibt ein Fragezeichen an den Rand.', '„Und das Klassendiagramm dazu?“'] }
    ]
  }
};

/* Wo das Handy im Hochformat hinschauen soll, wenn das Wichtige nicht in der Bildmitte steht */
export const BILD_LAGE = { kokytos: '92% 22%' };
export const TITEL_BILD = 'kreis-00';
/* Wo im Titelbild (1600 × 900) die Toröffnung liegt: Augen nur dort, die Glut in der Mitte.
   Bänder als [x von, x bis, y von, y bis]; oben läuft der Bogen spitz zu, deshalb ist das erste Band schmaler. */
export const TITEL_TOR = { breite: 1600, hoehe: 900, glut: [803, 248, 125], augen: [[792, 814, 188, 214], [770, 836, 214, 308]] };
export const BERG_BILD = 'berg';
export const ABSPANN_BILD = 'kreis-01';
export const TITEL_ZITAT = 'Hier unten wimmern jene, die nie wählten, nie tippten, nie aufdeckten. Ewig jagen sie einem leeren Auswahlfeld nach. Du nicht. Du steigst hinab, durch das Eis, und auf der anderen Seite wieder hinauf.';
/* Über dem Tor auf dem Titel, frei nach Inferno, Gesang III */
export const INSCHRIFT = 'Ihr, die ihr eintretet, lasst alle Hoffnung fahren';
/* Darunter, wie mit Kreide nachgetragen: Angst nur zum Spaß, nicht vor der echten Prüfung */
export const INSCHRIFT_NACHTRAG = 'Kleingedrucktes: Wer die Karten lernt, kommt wieder raus.';
/* Zwischen die geflüsterten Begriffe mischt sich ab und zu einer von diesen */
export const FLUESTERN_SPASS = ['hat jemand meinen kaffee gesehen', 'nur noch eine karte', 'war das jetzt brutto oder netto', 'gibt es davon ein backup', 'ist das prüfungsrelevant', 'ich hab doch gelernt', 'wo ist das nächste lagerfeuer', 'drei lagerfeuer, dann wird es besser'];
/* Für alle, die schon einmal hier waren; {tode} und {seelen} werden eingesetzt */
export const WIEDERKEHR = {
  lauf: 'Du hast den Gang nicht beendet. Die Karte wartet noch auf dich. Sie hat Zeit.',
  blut: 'Irgendwo da unten liegen noch {seelen} deiner Seelen. Manchmal flüstern sie deinen Namen.',
  tode: '{tode} Mal bist du gestorben. Das Tor hat mitgezählt.',
  tod1: 'Einmal bist du schon gestorben. Das Tor hat es nicht vergessen.',
  sonst: ['Du warst schon einmal hier. Die Karten erinnern sich an dich.', 'Das Tor steht offen. Es war nie geschlossen.', 'Unten brennt noch dein Lagerfeuer. Hinter dir fällt das Tor ins Schloss.']
};
export const DURCHGANG = 'Du kletterst am Pelz des Zwischenprüfers hinab, tiefer als jede Hölle, durch die Mitte der Erde. Irgendwo dreht sich alles um, und plötzlich ist unten oben. Du trittst ins Freie. Über dir stehen vier Sterne, die noch niemand gesehen hat. Vor dir, mitten im Meer, ein Berg.';

/* Sätze am Lagerfeuer, zufällig; am Berg kommen eigene dazu */
export const RAST = [
  'Das Feuer knistert. Es fragt nicht, in welchem Fach du gerade steckst.',
  'Kein Backup, kein Mitleid. Aber hier darfst du kurz sitzen.',
  'Jemand hat einen Kaffeebecher am Feuer vergessen. Er ist noch warm.',
  'Die Karten warten draußen im Dunkeln. Sie haben Zeit. Du auch, ein bisschen.',
  'Ein alter Zettel am Boden: „Sachziel = WAS, Formalziel = WIE erfolgreich.“ Die Handschrift kommt dir bekannt vor.',
  'Irgendwo weiter unten fällt ein Broadcast in eine Schleife. Hier oben ist es still.',
  'Das Feuer brennt ein bisschen heller, wenn du dich hinsetzt.',
  'Wer rastet, rostet nicht. Wer nie rastet, vergisst.',
  'Neben dem Feuer führt eine Treppe hinab. Von unten murmelt es in Großbuchstaben.',
  'Über dem Feuer flackert ein buntes Quadrat in der Luft. Es passt hier überhaupt nicht hin. Gerade deshalb.'
];
export const RAST_BERG = [
  'Von hier oben sieht die Hölle klein aus. Sie war es nicht.',
  'Der Morgen riecht nach frischem Kaffee und nach Fachgespräch.',
  'Ein Engel geht vorbei und streicht einen Fehler von deiner Stirn. Es sind noch ein paar übrig.',
  'Am Hang sagt jemand „SELECT * FROM Feuer“. Das Feuer antwortet mit allem.',
  'Die Probezeit beträgt hier oben angeblich sechs Monate. Niemand hat nachgezählt.',
  'Jemand hat den Gipfel in ein Gantt-Diagramm eingetragen. Der Balken ist sehr lang.'
];

/* Die Werkstatt: Werkzeuge zum Ausprobieren, ohne Leben und Seelen (src/werkstatt, aus tools/werkstatt.py) */
export const WERKSTATT = [
  ['klappuhr.html', 'Subnetz-Klappuhr', 'Subnetze, Router, VLAN und IPv6'],
  ['rechenwerk.html', 'Rechenwerk', 'Binär addieren, Gatter, Masken'],
  ['zahlenwerk.html', 'Zahlenwerk', 'Zahlensysteme, KB und KiB']
];
export const WERKSTATT_SATZ = 'Hier wird nicht gekämpft. Hier wird nachgesehen.';

/* Rätsel zwischen den Karten: wie sie auftreten. Düster, aber mit Augenzwinkern */
export const RAETSEL_AUFTRITT = {
  rechnen: [
    'Ein Rechengegner stellt sich dir in den Weg. Er hält dir einen Zettel hin.',
    'Aus dem Sturm taumelt ein Rechengegner. Auf seiner Stirn steht eine Adresse.',
    'Ein Rechengegner. Er rechnet nicht mit dir. Du mit ihm schon.',
    'Jemand hat eine Maske verloren. Ihr Besitzer will wissen, wozu sie gehört.'
  ],
  botschaft: [
    'Am Boden liegt eine Botschaft, in den Stein geritzt. Ein Gefallener hat hier gerechnet. Eine Zeile lügt.',
    'Eine leuchtende Botschaft am Boden: „Rechenweg voraus.“ Einer der Schritte stimmt nicht.',
    'Jemand hat hier seinen Rechenweg hinterlassen. Er ist nicht mehr da. Der Fehler schon.'
  ],
  mimic: [
    'Im Gang steht eine Truhe. Sie atmet.',
    'Eine Truhe mit zwei Schlössern, A und B. Zu schön, um wahr zu sein.',
    'Die Truhe zuckt, als du näher kommst. Wer ihren wahren Namen kennt, darf sie öffnen.'
  ],
  restore: [
    'Ein Bote stürzt herein: „Der Server brennt!“ Er drückt dir den Sicherungsplan in die Hand.',
    'Rauch aus dem Serverraum. Irgendwo piept eine USV. Jetzt zählt nur, was gesichert ist.',
    'Die Platte ist hinüber. Der Chef steht hinter dir und sagt nichts. Das ist schlimmer.'
  ]
};
export const RAETSEL_BOSS = '{boss} hält inne und wirft dir ein Rätsel hin.';
/* Nach einem falschen Rätsel: es kommt nicht wieder, also auch kein „gleich nochmal“ */
export const RAETSEL_DANEBEN = ['Hinfallen ist erlaubt. Liegenbleiben nicht.', 'Das war Aufwärmen.', 'Rechenwege lügen nicht. Rechnende manchmal.', 'Das sitzt beim nächsten Mal.'];
export const MIMIC = { auf: 'Du nennst ihren wahren Namen. Die Truhe seufzt und klappt auf.', biss: 'Die Truhe beißt zu. Sie hieß anders.' };

/* Wenn eine Antwort sitzt oder danebengeht: kurze Zeilen, selten */
export const TREFFER = ['Sauber.', 'Sitzt.', 'Der Gegner wankt.', 'So sieht das aus.'];
export const DANEBEN = ['Hinfallen ist erlaubt. Liegenbleiben nicht.', 'Die Karte kommt gleich wieder. Du auch.', 'Daneben. Merk dir den Merksatz.', 'Das war Aufwärmen.'];

/* Die drei Klassen (leichte Variante): je ein Titel, eine Klangfarbe im Kampf und eine sanfte Gabe, ohne Nachteile. Frei am Lagerfeuer wählbar. */
export const KLASSEN = [
  { id: 'krieger', name: 'Krieger', titel: 'Mainframe', klang: 'stahl', gabe: 'Mehr Leben. Du hältst mehr aus.' },
  { id: 'magier', name: 'Magier', titel: 'Rootmancer', klang: 'feuer', gabe: 'Mehr Seelen für jede richtige Antwort.' },
  { id: 'priester', name: 'Priester', titel: 'Recoveron', klang: 'heilig', gabe: 'SafeMode: einmal je Gang überlebst du den tödlichen Treffer bei 1 Leben.' }
];

/* ---------- Die Erweiterung: das Pixelparadies ----------
   Dantes dritter Teil, in 8 Bit: sieben Himmel als schwebende Inseln, ganz oben der Große Glitch.
   Die Inseln mischen AP1 und AP2 nach Themen (Ort 21 bis 27). Welche Karte auf welcher Insel liegt, sagt himmelVon:
   erst die Ausnahmen nach Lernfeld und Thema, sonst das Lernfeld. So landet jede Karte irgendwo, auch neue Themen.
   Hier oben stirbt niemand: Wer alle Herzen verliert, fällt auf eine Wolke. Es zählen Goldwürfel, Kombos und Bomben. */
export const HIMMEL_BILD = 'himmel-karte';
/* Spielstil Pixel: das ganze Spiel in 8 Bit. Jedes gemalte Bild hat ein Gegenstück in Pixeln (aus tools/pixel_bilder.py),
   das Lagerfeuer bekommt einen Nachthimmel. Regeln und Karten bleiben gleich, nur das Aussehen wechselt. */
export const PIXEL_BILDER = {
  'kreis-04': 'px-lastenwaelzer', 'kreis-08': 'px-blutfluss', 'kreis-03': 'px-sturm', 'kreis-06': 'px-schlamm', 'kreis-09': 'px-dis', 'kreis-05': 'px-styx',
  'gesims-stolz': 'px-stolz', 'gesims-neid': 'px-neid', 'gesims-zorn': 'px-zorn', 'gesims-traegheit': 'px-traegheit', 'gesims-geiz': 'px-geiz', 'gesims-voellerei': 'px-voellerei',
  'katakomben': 'px-katakomben', 'kreis-02': 'px-akronymant', 'kokytos': 'px-kokytos', 'feuerwand': 'px-feuerwand', 'ausschuss': 'px-ausschuss',
  'berg': 'px-berg', 'kreis-01': 'himmel-karte', 'kreis-00': 'himmel-karte'
};
export const PIXEL_LAGER = 'px-lager';
/* Der bunte Titel: kommt, wenn die Startwelt das Pixelparadies ist oder alles im Pixelstil läuft */
export const PIXEL_TITEL = {
  reise: 'Hinab durch die Kreise, durch das Eis, hinauf auf den Berg und darüber in die Wolken. Diesmal in 8 Bit. Die Karten sind dieselben, die Farben nicht.',
  zitat: 'Über dem Gipfel schweben sieben Inseln aus Pixeln. Spring rein, sammle Goldwürfel, und wenn du fällst, fängt dich eine Wolke.',
  lauf: 'Du hängst noch mitten im Sprung. Die Karte schwebt und wartet auf dich.',
  sonst: ['Die Inseln haben auf dich gewartet. Eine hat sogar gewunken.', 'Bit ist schon wach. Bit war nie weg.', 'Die Wolken sind frisch aufgeschüttelt.', 'Irgendwo oben tickt eine Lunte. Nur zur Info.'],
  regeln: [
    '<b>Richtig</b> bringt Seelen und Würfelsplitter, <b>falsch</b> kostet ein Herz.',
    'Wer hintereinander richtig liegt, baut eine <b>Kombo</b>. Alle fünf Treffer knallt es.',
    'Manche Karten kommen mit <b>Lunte</b>: schnell antworten, sonst BOOM.',
    'Unten am Lagerfeuer liegt das düstere Spiel. Beide teilen sich den Lernstand.'
  ],
  regelnReise: [
    '<b>Richtig</b> bringt Seelen, <b>falsch</b> kostet Leben.',
    '<b>Stirbst du</b>, bleiben deine Seelen bei der Karte, die dich erledigt hat. Hol sie dir im nächsten Gang zurück.',
    '<b>Drei Lagerfeuer</b> in einem Kreis öffnen das Nebeltor zum Boss.',
    'Oben auf dem Titel lässt sich jederzeit zurück auf <b>Souls</b> schalten. Der Lernstand bleibt.'
  ]
};
export const PIXEL = {
  name: 'Das Pixelparadies', zusatz: 'Sieben Himmel in 8 Bit',
  riss: 'Neben dem Lagerfeuer flackert ein Quadrat in der Luft. Es ist bunter als alles hier unten.',
  zitat: 'Über dem Gipfel, wo Dante das Paradies vermutete, hat jemand den Himmel in 8 Bit nachgebaut. Die Sonne ist eckig, die Wolken auch, und alles leuchtet ein bisschen zu sehr. Hier oben stirbt niemand. Man fällt höchstens auf eine Wolke.',
  regeln: [
    '<b>Richtig</b> bringt Seelen und Würfelsplitter. <b>Acht Splitter</b> ergeben einen Goldwürfel.',
    '<b>Kombo:</b> Wer hintereinander richtig liegt, bekommt mehr Splitter. Alle fünf Treffer knallt es.',
    '<b>Bomben:</b> Manche Karten kommen mit brennender Lunte. Schnell richtig heißt entschärft, zu langsam oder falsch kostet zwei Herzen.',
    '<b>Fünf Herzen</b> je Sprung. Wer fällt, landet auf einer Wolke: ganze Würfel bleiben, lose Splitter fallen mit.',
    '<b>Drei Goldwürfel</b> öffnen das Würfeltor zum Wächter der Insel. Wer alle sieben besiegt, darf zum Großen Glitch.',
    'Hier oben wird gemischt: Jede Insel holt sich ihr Thema aus AP1 und AP2. Was du hier lernst, zählt auch unten.'
  ]
};
export const INSELN = [
  {
    lf: 21, akt: 3, nr: 'Erster Himmel', planet: 'Mond', name: 'Die Mondinsel', bild: 'himmel-mond', sprite: 'insel-mond', lfName: 'Projekt, Qualität und Service', kurz: 'Mond',
    zitat: 'Im Mondhimmel wohnen bei Dante die Wankelmütigen, die ihre Gelübde brachen. Hier oben sind es Lastenhefte, Abnahmen und SLAs. Auf der Insel steht eine Baustelle. Sie ist zu 90 Prozent fertig. Seit Monaten.',
    boss: 'Der Neunzig-Prozent-Golem', bossZusatz: 'seit Monaten fast fertig', titel: 'Bezwinger der letzten zehn Prozent',
    auftritt: 'Der Golem stemmt sich aus der Baustelle: „Ich bin fast fertig. Nur noch kurz testen.“',
    treffer_: ['Der Fortschrittsbalken springt auf 91 Prozent. Dann auf 89.', '„Das stand so nicht im Lastenheft!“', 'Ein Ziegel fällt ab. Ein Meilenstein auch.'],
    fehler: ['„Das machen wir im nächsten Sprint.“', 'Der Golem schiebt die Deadline. Auf dich.', '„Läuft bei mir.“']
  },
  {
    lf: 22, akt: 3, nr: 'Zweiter Himmel', planet: 'Merkur', name: 'Die Merkurinsel', bild: 'himmel-merkur', sprite: 'insel-merkur', lfName: 'Netze und Protokolle', kurz: 'Merkur',
    zitat: 'Merkur war der Götterbote. Auf seiner Insel fliegen Pakete von Mast zu Mast, und jedes will wissen, wohin. Ab und zu kommt eins an. Meistens etwas später.',
    boss: 'Der Lag-Drache', bossZusatz: 'kommt immer etwas später an', titel: 'Herr über Ping und Paket',
    auftritt: 'Ein Drache gähnt. Drei Sekunden später hörst du es.',
    treffer_: ['Der Drache zuckt. Mit Verzögerung.', 'Paket angekommen. Bestätigung folgt.', '„Time to live abgelaufen“, murmelt er.'],
    fehler: ['Der Drache schickt einen Broadcast. An alle. Auch an dich.', 'Paket verloren. Kein Wunder, war UDP.', '„Bei mir ist der Ping grün.“']
  },
  {
    lf: 23, akt: 3, nr: 'Dritter Himmel', planet: 'Venus', name: 'Die Venusinsel', bild: 'himmel-venus', sprite: 'insel-venus', lfName: 'Datenbanken und Datenmodelle', kurz: 'Venus',
    zitat: 'Im Venushimmel finden sich bei Dante die Liebenden. Hier oben finden sich Tabellen, und zwar über Fremdschlüssel. Wer zu niemandem gehört, ist NULL. Das ist nicht dasselbe wie nichts.',
    boss: 'Das NULL-Gespenst', bossZusatz: 'weder wahr noch falsch', titel: 'Bändiger der NULL',
    auftritt: 'Etwas schwebt herein. Es ist nicht da. Es ist aber auch nicht nicht da.',
    treffer_: ['Das Gespenst wird durchsichtiger. Noch durchsichtiger als vorher.', '„IS NULL? IS NOT NULL? Ich weiß es selbst nicht.“', 'Ein Fremdschlüssel rastet ein.'],
    fehler: ['„NULL gleich NULL? Unbekannt.“', 'Das Gespenst kichert dreiwertig.', 'Eine Zeile verschwindet im JOIN.']
  },
  {
    lf: 24, akt: 3, nr: 'Vierter Himmel', planet: 'Sonne', name: 'Die Sonneninsel', bild: 'himmel-sonne', sprite: 'insel-sonne', lfName: 'Code und Modellierung', kurz: 'Sonne',
    zitat: 'Im Sonnenhimmel leuchten bei Dante die Weisen. Hier oben leuchten Klammern, Klassen und Diagramme. Ganz oben auf dem Turm glüht eine goldene Kugel. Sie ist sauber gekapselt.',
    boss: 'Der Spaghetticode', bossZusatz: 'ein Gericht ohne Struktur', titel: 'Koch des sauberen Codes',
    auftritt: 'Aus dem Turm quillt etwas Gelbes. Es hat keinen Anfang, kein Ende und vierzehn GOTOs.',
    treffer_: ['Eine Nudel wird refaktoriert.', '„Wer hat hier Kommentare geschrieben?“', 'Die Kopplung lockert sich.'],
    fehler: ['Die Nudeln verknoten sich neu. Jetzt mit Seiteneffekt.', '„Funktioniert doch. Frag nicht, warum.“', 'Irgendwo fliegt eine Exception. Niemand fängt sie.']
  },
  {
    lf: 25, akt: 3, nr: 'Fünfter Himmel', planet: 'Mars', name: 'Die Marsinsel', bild: 'himmel-mars', sprite: 'insel-mars', lfName: 'Sicherheit und Datenschutz', kurz: 'Mars',
    zitat: 'Im Marshimmel stehen bei Dante die Streiter. Hier oben steht eine Burg mit drei Mauern: Vertraulichkeit, Integrität, Verfügbarkeit. Davor kreist etwas im Wasser und schickt dringende Mails.',
    boss: 'Der Phishing-Hai', bossZusatz: '„Ihr Konto wurde gesperrt“', titel: 'Schrecken der Phisher',
    auftritt: 'Ein Hai taucht auf und hält dir einen Link hin: „Bitte bestätigen Sie hier Ihr Passwort. Dringend.“',
    treffer_: ['Der Hai beißt auf Granit. Auf zwei Faktoren Granit.', 'Die Mail landet im Spam.', '„Woher wusstest du das?“'],
    fehler: ['Du hast auf den Link geklickt. Der Hai grinst.', '„Ihr Passwort lautete Passwort123.“', 'Der Hai schreibt dir als Chef. Mit Tippfehlern.']
  },
  {
    lf: 26, akt: 3, nr: 'Sechster Himmel', planet: 'Jupiter', name: 'Die Jupiterinsel', bild: 'himmel-jupiter', sprite: 'insel-jupiter', lfName: 'Wirtschaft und Recht', kurz: 'Jupiter',
    zitat: 'Im Jupiterhimmel sitzen bei Dante die Gerechten. Hier oben steht ein Tempel mit einem Paragrafen im Giebel, daneben glänzen Münzen. Unter allem steht etwas sehr klein geschrieben.',
    boss: 'Das Kleingedruckte', bossZusatz: 'liest sich selbst nie', titel: 'Leser des Kleingedruckten',
    auftritt: 'Eine Schriftrolle entrollt sich, und entrollt sich, und entrollt sich: „Es gelten unsere AGB.“',
    treffer_: ['Ein Absatz wird unwirksam.', '„Das steht da doch gar nicht!“ Doch.', 'Die Rolle verliert eine Fußnote.'],
    fehler: ['„Siehe Paragraf 14, Absatz 3, Satz 2.“', 'Die Frist ist gerade abgelaufen. Natürlich.', 'Das Kleingedruckte wird noch kleiner.']
  },
  {
    lf: 27, akt: 3, nr: 'Siebter Himmel', planet: 'Saturn', name: 'Die Saturninsel', bild: 'himmel-saturn', sprite: 'insel-saturn', lfName: 'Hardware und Betrieb', kurz: 'Saturn',
    zitat: 'Im Saturnhimmel schweigen bei Dante die Stillen. Hier oben summen nur die Lüfter. Der Planet am Himmel sieht von der Seite aus wie eine Festplatte. Hoffentlich gibt es ein Backup.',
    boss: 'Der Bluescreen', bossZusatz: 'ist auf ein Problem gestoßen', titel: 'Neustarter der Welten',
    auftritt: 'Alles wird blau. Ein Bildschirm stapft heran: „Wir sammeln nur ein paar Fehlerinformationen.“',
    treffer_: ['Der Bluescreen startet neu. Wieder.', 'Ein Lüfter dreht hoch. Er klingt erleichtert.', '„0 Prozent abgeschlossen.“ Dann 20.'],
    fehler: ['„Ein Treiber hat sich verabschiedet.“', 'Der RAID-Verbund schaut weg.', 'Irgendwo piept eine USV.']
  }
];
GEBIETE.push(...INSELN);
/* Wohin eine Karte gehört: das Lernfeld gibt die Insel vor, einzelne Themen ziehen woandershin */
const HIMMEL_LF = { 1: 26, 2: 27, 3: 22, 4: 25, 5: 24, 6: 21, 7: 24, 8: 24, 9: 23, 10: 21, 11: 27, 12: 26 };
const HIMMEL_THEMA = {
  21: { 1: ['Geschäftsprozesse', 'Teamphasen', 'Kommunikation und Präsentation'], 2: ['Kundenanforderungen', 'Übergabe und Abnahme'], 5: ['Fehler und Testverfahren', 'Teststufen und Anforderungen'], 8: ['EPK', 'BPMN', 'Geschäftsprozesse'] },
  22: { 8: ['REST & HTTP', 'Schnittstellen & Formate'], 11: ['Netzgrundlagen', 'IP-Adressierung', 'Protokolle & Dienste', 'VLAN & VPN'] },
  23: { 5: ['Datenbanken', 'Datenmodellierung'] },
  24: { 10: ['Werkzeuge und Sprachen', 'Versionsverwaltung und CI/CD'] },
  25: { 3: ['Zugangskontrolle', 'Sicherheit & Verschlüsselung'], 9: ['SQL-Sicherheit'], 11: ['Netzsicherheit', 'Schutzziele & Angriffe', 'Kryptografie', 'Zugriffsschutz', 'Datenschutz', 'Betroffenenrechte', 'ISMS & Prüfung'] },
  26: { 2: ['Softwarelizenzen', 'Bewertungsverfahren', 'Kalkulation', 'Kaufvertrag', 'Kaufvertragsarten', 'Kaufvertragsstörungen', 'Beschaffung und Lager', 'Rechtsvorschriften'], 6: ['IT-Verträge', 'Finanzierung'], 10: ['Kunde und Recht', 'Wirtschaftlichkeit'] },
  27: { 3: ['Datensicherung & Speicher', 'Betrieb & Verfügbarkeit'], 10: ['Automatisierung und CPS'] }
};
const HIMMEL_KARTE = new Map();
for (const [insel, je] of Object.entries(HIMMEL_THEMA)) for (const [lf, themen] of Object.entries(je)) for (const t of themen) HIMMEL_KARTE.set(lf + '|' + t, Number(insel));
export const himmelVon = c => HIMMEL_KARTE.get(c.l + '|' + c.t) || HIMMEL_LF[c.l] || null;
export const inselVon = lf => INSELN.find(k => k.lf === lf);

/* Ganz oben, über den sieben Himmeln: eine Arena mit drei Formen. Er wirft Bomben (bomben: jede n-te Frage). */
export const PIXEL_ARENEN = {
  glitch: {
    id: 'glitch', akt: 3, nr: 'Über den sieben Himmeln', name: 'Der Fixsternhimmel', kurz: 'Fixsterne', bild: 'himmel-glitch', sprite: 'insel-glitch', ort: 'Der Fixsternhimmel',
    zitat: 'Über dem siebten Himmel hört das Bild auf, sauber zu sein. Sterne flackern, Wolken haben Störstreifen, und mittendrin klafft ein Riss. Darin sitzt der, der alles verpixelt hat. Er findet es eigentlich ganz schön so.',
    boss: 'Der Große Glitch', bossZusatz: 'Er hat den Himmel verpixelt', titel: 'Held in acht Bit',
    voraus: [21, 22, 23, 24, 25, 26, 27], kaffee: 'ja', zeit: 0, tippfehler: 0, seelen: 500, phasenWort: 'Form',
    schluss: 'Der Große Glitch zerfällt in Pixel. Sie bleiben hier oben. Sie sehen gut aus.',
    regeln: [
      'Drei Formen, zusammen <b>dreizehn Treffer</b>. Fragen von allen sieben Inseln.',
      'Er wirft <b>Bomben</b>: jede zweite Frage, in der letzten Form jede.',
      'Jeder Fehler kostet <b>ein Herz</b>, eine Bombe <b>zwei</b>. Ab Kombo ×3 triffst du doppelt.'
    ],
    phasen: [
      { name: 'Der Große Glitch', zusatz: 'Erste Form: Mond bis Sonne', lfs: [21, 22, 23, 24], treffer: 4, bomben: 2, ende: 'Die erste Form zerfällt in Störstreifen.',
        auftritt: 'Der Riss flackert. Etwas spricht in Störgeräuschen: „Ihr Fortschritt wurde nicht gespeichert.“ Dann lacht es. War ein Witz.',
        treffer_: ['Ein Pixel fällt aus ihm heraus. Es ist magenta.', '„Bitte warten … Bitte warten …“', 'Der Glitch ruckelt.'],
        fehler: ['„Fehler 418: Ich bin eine Teekanne.“', 'Das Bild springt. Du auch.', '„Schon mal aus- und wieder eingeschaltet?“'] },
      { name: 'Der Glitch, gespiegelt', zusatz: 'Zweite Form: Mars bis Saturn', lfs: [25, 26, 27], treffer: 4, bomben: 2, ende: 'Das Spiegelbild bekommt einen Sprung.',
        auftritt: 'Er dreht sich um. Von hinten sieht er genauso aus, nur seitenverkehrt.',
        treffer_: ['„Das war … korrekt. Gespiegelt auch.“', 'Ein Störstreifen reißt ab.', 'Sein Spiegelbild hält sich die Stirn.'],
        fehler: ['„Links ist das neue Rechts.“', 'Er kopiert deinen Fehler. Zweimal.', 'Die Farben vertauschen sich kurz.'] },
      { name: 'Der Kernel-Glitch', zusatz: 'Letzte Form: alle sieben Himmel', lfs: [21, 22, 23, 24, 25, 26, 27], treffer: 5, bomben: 1, ende: 'Der Kernel-Glitch friert ein.',
        auftritt: 'Alles wird schwarz. Dann alles gleichzeitig bunt. „Letzte Form. Ab jetzt wird nicht mehr gewartet.“',
        treffer_: ['Ein Speicherblock wird frei.', 'Der Glitch flackert schneller. Das ist gut.', '„Das war nicht im Testplan!“'],
        fehler: ['„Segmentation fault. Bei dir.“', 'Die Lunte war kürzer als gedacht.', 'Der Riss wird kurz breiter.'] }
    ]
  }
};

/* Bomben auf den Karten, Landung und Absturz: kurze Sätze, fröhlich statt düster */
export const BOMBE = {
  auftritt: ['Diese Karte tickt.', 'Achtung, Lunte! Antworte, bevor es knallt.', 'Jemand hat eine Bombe an die Frage gebunden. Warum auch immer.', 'Es zischt. Die Frage brennt an einem Ende.'],
  entschaerft: 'Entschärft!',
  knall: 'BOOM. Die Bombe ist hochgegangen.'
};
export const LANDUNG = [
  'Weich gelandet. Die Wolke federt nach.',
  'Eine Wolke fängt dich auf. Sie riecht nach Zuckerwatte und Kaffee.',
  'Unten am Lagerfeuer hat das keiner gesehen. Schade eigentlich.',
  'Die Insel summt zufrieden. Oder das sind die Lüfter.',
  'Ein Vogel aus acht Pixeln setzt sich neben dich. Er sagt nichts. Er ist ein Vogel.'
];
export const ABSTURZ = [
  'Plopp. Eine Wolke. Weich, aber peinlich.',
  'Du fällst, aber nicht tief. Nur bis zur nächsten Wolke.',
  'Die Wolke fängt dich auf und tut so, als wäre nichts gewesen.',
  'Kurz war alles Himmel. Dann war alles Wolke.'
];

/* Die Anleitung für Neue: der rote Faden, wie Ariadnes Faden durchs Labyrinth.
   Die Teile sind kurzes HTML (nur <p>, <ol>, <ul>, <li>, <b>), die Zahlen stammen aus kern.js. */
export const ANLEITUNG = {
  titel: 'Der rote Faden',
  unter: 'Ariadne gab Theseus einen Faden mit ins Labyrinth. Hier ist deiner.',
  teile: [
    ['Das Spiel in einer Minute',
      '<p>Der Prüfungsprügler packt über 1100 Lernkarten und 300 Kürzel für die AP1 und AP2 der Fachinformatik in ein Spiel. <b>Richtig</b> bringt Seelen, <b>falsch</b> kostet Leben. ' +
      'Im Hintergrund merkt sich ein Lernkasten, was du schon kannst, und holt jede Karte zurück, kurz bevor du sie vergessen hättest.</p>' +
      '<p>Alles beginnt am <b>Lagerfeuer</b>. Von dort wählst du, wohin es geht. Für den Anfang: der <b>Erste Kreis</b>.</p>'],
    ['Dein erster Gang',
      '<ol><li>Am Lagerfeuer einen Kreis antippen, zum Beispiel den Ersten Kreis.</li>' +
      '<li><b>Gang beginnen:</b> zehn Karten, etwa drei bis vier Minuten, also eine Bahnfahrt.</li>' +
      '<li>Antworten: den passenden Begriff wählen, die passende Erklärung wählen oder den Begriff eintippen. Je besser eine Karte sitzt, desto öfter wird getippt.</li>' +
      '<li>Nach der zehnten Karte rastest du an einem Lagerfeuer.</li>' +
      '<li>Drei Lagerfeuer in einem Kreis öffnen das <b>Nebeltor</b>. Dahinter wartet der Boss. Fünf Treffer, und er fällt.</li></ol>'],
    ['Leben, Kaffee und Tod',
      '<ul><li>Ein Fehler kostet 20 Leben, bei einer Karte, die schon saß, 30. Die Karte kommt drei Karten später noch einmal.</li>' +
      '<li>Der <b>Kaffeeflakon</b> oben im Kampf heilt 45 Leben. Drei Stück je Gang, am Lagerfeuer wird er wieder voll.</li>' +
      '<li>Stirbst du, bleiben deine Seelen als <b>Blutfleck</b> bei der Karte, die dich erledigt hat. Sie kommt im nächsten Gang an diesem Ort zuerst: richtig beantwortet, und die Seelen gehören wieder dir. Falsch beantwortet oder vorher woanders gestorben, und sie sind weg.</li>' +
      '<li><b>Rückzug</b> geht jederzeit. Der Gang zählt dann nicht, die Seelen behältst du.</li></ul>'],
    ['Seelen, Stufen und Klassen',
      '<ul><li>Mit Seelen steigst du am Lagerfeuer eine <b>Stufe</b> auf. Jede Stufe gibt 5 Leben mehr.</li>' +
      '<li>Jeder Boss bringt Seelen, einen <b>Titel</b> und einen Kaffeeflakon mehr (bis fünf), und danach heilt der Kaffee stärker.</li>' +
      '<li>Am Lagerfeuer wählst du eine <b>Klasse</b>, jederzeit wechselbar und ohne Nachteile: Der Krieger hält mehr aus, der Magier bekommt mehr Seelen, der Priester überlebt einmal je Gang den tödlichen Treffer.</li></ul>'],
    ['Der Weg durch die Prüfung',
      '<ol><li><b>Der Abstieg (AP1):</b> sechs Höllenkreise, einer je Lernfeld, jeder mit seinem Boss.</li>' +
      '<li><b>Kokytos:</b> Liegen alle sechs Bosse, wartet im Eis der <b>Zwischenprüfer</b>. Sein Kaffee ist gefroren und taut erst im Kampf auf.</li>' +
      '<li><b>Der Aufstieg (AP2):</b> sechs Gesimse am Läuterungsberg. Fehler tun etwas mehr weh, dafür gibt es anderthalbmal so viele Seelen.</li>' +
      '<li><b>Der Gipfel:</b> Liegen alle dreizehn Bosse, öffnet sich der <b>Prüfungsausschuss</b>: 20 Sekunden je Frage, kein Kaffee. Wer besteht, kann ein Neues Spiel+ beginnen.</li></ol>' +
      '<p>Du lernst nur für die AP2? Unter <b>Spielstand</b> öffnet „Nur AP2 lernen“ den Berg sofort.</p>'],
    ['Abseits des Weges',
      '<ul><li><b>Die Katakomben der Kürzel</b> sind von Anfang an offen: 304 Abkürzungen, am Ende der Akronymant. Jedes Kürzel, das du einmal richtig hattest, landet im <b>Gebeinhaus</b>, deinem Sammelalbum.</li>' +
      '<li>An manchen Orten lauern zwischen den Karten <b>Rätsel</b>: Subnetze ausrechnen, den falschen Schritt in einem Rechenweg finden, das Gatter einer Mimic-Truhe erraten oder Sicherungen in der richtigen Reihenfolge zurückspielen.</li>' +
      '<li>In der <b>Werkstatt</b> übst du ohne Leben und Seelen: Subnetz-Klappuhr, Rechenwerk und Zahlenwerk. Nach einem falschen Rätsel führt dich ein Knopf direkt zur passenden Aufgabe.</li></ul>'],
    ['Das Pixelparadies',
      '<p>Über dem Lagerfeuer schwebt ein buntes Quadrat. Dahinter liegen sieben Inseln in 8 Bit, von Anfang an offen, mit AP1 und AP2 nach Themen gemischt. Hier oben stirbt niemand.</p>' +
      '<ul><li>Ein <b>Sprung</b> hat zehn Karten. Statt Leben hast du fünf <b>Herzen</b>, ein Fehler kostet eins.</li>' +
      '<li>Richtig hintereinander baut eine <b>Kombo</b> auf und bringt mehr <b>Splitter</b>. Acht Splitter sind ein <b>Goldwürfel</b>.</li>' +
      '<li><b>Bomben</b> brennen 15 Sekunden: rechtzeitig richtig heißt entschärft, falsch oder zu langsam kostet zwei Herzen.</li>' +
      '<li>Alle Herzen weg? Du fällst weich auf eine Wolke und verlierst nur die losen Splitter.</li>' +
      '<li>Drei Goldwürfel öffnen das Tor zum <b>Wächter</b> der Insel. Liegen alle sieben, wartet ganz oben der <b>Große Glitch</b>.</li></ul>'],
    ['So lernt das Spiel mit dir',
      '<p>Hinter allem steckt ein <b>Lernkasten</b> mit fünf Fächern. Weißt du eine Karte, rutscht sie ein Fach weiter und kommt seltener wieder: nach einem, drei, sieben und vierzehn Tagen. Ein Fehler schickt sie zurück ins erste Fach.</p>' +
      '<p>Ein Gang nimmt zuerst den Blutfleck, dann fällige Karten, dann neue, dann wacklige. Ab dem vierten Fach <b>sitzt</b> eine Karte. Was du im Pixelparadies lernst, zählt auch unten, und umgekehrt.</p>'],
    ['Einstellungen unter Spielstand',
      '<ul><li><b>Souls oder Pixel:</b> das ganze Spiel düster gemalt oder in 8 Bit, auch oben auf dem Titel umschaltbar.</li>' +
      '<li><b>Im Pixelparadies starten:</b> bunter Titel, danach direkt zur Inselkarte.</li>' +
      '<li><b>Ruhiger Modus:</b> Lernen ohne Leben und Tod, Fehler kosten nichts.</li>' +
      '<li><b>Musik, Wind und Kampfklang</b> lassen sich einzeln an- und ausschalten.</li>' +
      '<li><b>App installieren:</b> auf den Startbildschirm legen, danach läuft alles auch ohne Netz.</li></ul>']
  ],
  schluss: 'Kleingedrucktes: Wer die Karten lernt, kommt wieder raus.'
};
