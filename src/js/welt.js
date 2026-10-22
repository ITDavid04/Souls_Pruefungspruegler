/* Die Welt: sechs Kreise, einer je Lernfeld, frei nach Dantes Inferno. Bosse und Titel wie im AP1 Reinprügler. */

export const KREISE = [
  {
    lf: 1, nr: 'Erster Kreis', name: 'Die Lastenwälzer', bild: 'kreis-04', lfName: 'Unternehmen und eigene Rolle',
    zitat: 'Schwere Lasten wälzen sie gegeneinander, die Sachziele wider die Formalziele, und brüllen einander an: Wer hat hier Prokura? Wer haftet mit seinem Privatvermögen? Keiner weiß es, und die Last rollt weiter.',
    boss: 'Die Matrixorganisation', bossZusatz: 'Dienerin zweier Herren', titel: 'Vogt der Vollmachten'
  },
  {
    lf: 2, nr: 'Zweiter Kreis', name: 'Der Blutfluss', bild: 'kreis-08', lfName: 'Arbeitsplätze ausstatten',
    zitat: 'Im siedenden Strom stehen jene, die mit bloßer Hand ins offene Gehäuse griffen. Ein Funke nur, unsichtbar und lautlos, und die Platine war verloren. Am Ufer warten die, die ohne Angebotsvergleich bestellten, auf eine Lieferung, die nie kommt.',
    boss: 'Der Lieferverzug', bossZusatz: 'Wächter der Nachfrist', titel: 'Schmied der Arbeitsplätze'
  },
  {
    lf: 3, nr: 'Dritter Kreis', name: 'Der Sturm', bild: 'kreis-03', lfName: 'Clients in Netzwerke einbinden',
    zitat: 'Ein Wirbelsturm ohne Rast treibt jene umher, die dem Glanz der Datenblätter erlagen. Sie schworen auf die Bruttorate, und nun peitscht sie der Wind der geteilten Bandbreite.',
    boss: 'Der Broadcast-Sturm', bossZusatz: 'Herr der Schleifen', titel: 'Wächter der Adressen'
  },
  {
    lf: 4, nr: 'Vierter Kreis', name: 'Der Schlamm', bild: 'kreis-06', lfName: 'Schutzbedarfsanalyse',
    zitat: 'Kalter, schwerer Regen fällt auf die Maßlosen, die jedem Benutzer alle Rechte gaben. Über ihnen bellt der dreiköpfige Wächter aus drei Mäulern: Vertraulichkeit! Integrität! Verfügbarkeit!',
    boss: 'Der Kumulationseffekt', bossZusatz: 'Summe aller Schrecken', titel: 'Hüter der Schutzziele'
  },
  {
    lf: 5, nr: 'Fünfter Kreis', name: 'Die Stadt Dis', bild: 'kreis-09', lfName: 'Software und Daten',
    zitat: 'In glühenden Gräbern liegen die Ketzer, die lehrten, ein Spiegel sei eine Sicherung. Daneben jene, deren Schleife nie ein Abbruchkriterium fand. Sie zählen noch immer.',
    boss: 'Die Endlosschleife', bossZusatz: 'die niemals bricht', titel: 'Bändiger der Schleifen'
  },
  {
    lf: 6, nr: 'Sechster Kreis', name: 'Der Styx', bild: 'kreis-05', lfName: 'Serviceanfragen bearbeiten',
    zitat: 'Im schwarzen Sumpf schlagen die Zornigen aufeinander ein. Sie brüllten den Drucker an und den Kunden dazu, und keiner von ihnen schrieb je ein Ticket.',
    boss: 'Der eskalierte Kunde', bossZusatz: 'Fürst der offenen Tickets', titel: 'Schließer der Tickets'
  }
];
export const kreis = lf => KREISE.find(k => k.lf === lf);

export const AUSSCHUSS = {
  name: 'Der Prüfungsausschuss', bild: 'ausschuss',
  zitat: 'Drei sitzen am langen Tisch, und keiner von ihnen lächelt. Vor ihnen steht ein einzelner Stuhl. Er ist für dich.'
};

export const TITEL_BILD = 'kreis-00';
export const TITEL_ZITAT = 'Hier unten wimmern jene, die nie wählten, nie tippten, nie aufdeckten. Ewig jagen sie einem leeren Auswahlfeld nach. Du nicht. Du steigst hinab.';

/* Sätze am Lagerfeuer, zufällig */
export const RAST = [
  'Das Feuer knistert. Es fragt nicht, in welchem Fach du gerade steckst.',
  'Kein Backup, kein Mitleid. Aber hier darfst du kurz sitzen.',
  'Jemand hat einen Kaffeebecher am Feuer vergessen. Er ist noch warm.',
  'Die Karten warten draußen im Dunkeln. Sie haben Zeit. Du auch, ein bisschen.',
  'Ein alter Zettel am Boden: „Sachziel = WAS, Formalziel = WIE erfolgreich.“ Die Handschrift kommt dir bekannt vor.',
  'Irgendwo weiter unten fällt ein Broadcast in eine Schleife. Hier oben ist es still.',
  'Das Feuer brennt ein bisschen heller, wenn du dich hinsetzt.',
  'Wer rastet, rostet nicht. Wer nie rastet, vergisst.'
];

/* Wenn eine Antwort sitzt oder danebengeht: kurze Zeilen, selten */
export const TREFFER = ['Sauber.', 'Sitzt.', 'Der Gegner wankt.', 'So sieht das aus.'];
export const DANEBEN = ['Hinfallen ist erlaubt. Liegenbleiben nicht.', 'Die Karte kommt gleich wieder. Du auch.', 'Daneben. Merk dir den Merksatz.', 'Das war Aufwärmen.'];
