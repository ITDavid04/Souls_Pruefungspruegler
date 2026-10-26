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
  'Neben dem Feuer führt eine Treppe hinab. Von unten murmelt es in Großbuchstaben.'
];
export const RAST_BERG = [
  'Von hier oben sieht die Hölle klein aus. Sie war es nicht.',
  'Der Morgen riecht nach frischem Kaffee und nach Fachgespräch.',
  'Ein Engel geht vorbei und streicht einen Fehler von deiner Stirn. Es sind noch ein paar übrig.',
  'Am Hang sagt jemand „SELECT * FROM Feuer“. Das Feuer antwortet mit allem.',
  'Die Probezeit beträgt hier oben angeblich sechs Monate. Niemand hat nachgezählt.',
  'Jemand hat den Gipfel in ein Gantt-Diagramm eingetragen. Der Balken ist sehr lang.'
];

/* Wenn eine Antwort sitzt oder danebengeht: kurze Zeilen, selten */
export const TREFFER = ['Sauber.', 'Sitzt.', 'Der Gegner wankt.', 'So sieht das aus.'];
export const DANEBEN = ['Hinfallen ist erlaubt. Liegenbleiben nicht.', 'Die Karte kommt gleich wieder. Du auch.', 'Daneben. Merk dir den Merksatz.', 'Das war Aufwärmen.'];
