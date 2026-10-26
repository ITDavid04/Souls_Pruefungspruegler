/* Werkstatt-Kopfzeile: Wer mitten in einem Gang oder Kampf hergekommen ist, geht zurück in den Kampf, alle anderen zum Lagerfeuer.
   Der Spielstand liegt im selben localStorage wie die App (spp.spiel). "?zurueck" sagt der App, dass der Titel diesmal übersprungen wird. */
(function () {
  var zurueck = document.getElementById('werkstatt-zurueck');
  if (!zurueck) return;
  try {
    var s = JSON.parse(localStorage.getItem('spp.spiel') || 'null');
    if (s && s.lauf && s.lauf.leben > 0) zurueck.textContent = 'Zurück zum Kampf';
  } catch (e) {}
})();
