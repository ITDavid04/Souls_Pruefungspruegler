/* Spielstil der App auch in der Werkstatt: Im Pixelstil zeigen die Werkzeuge ihren hellen Originalanstrich,
   Kopfzeile und Überschriften kommen in 8 Bit (werkstatt.css, html.px). Läuft im Kopf, damit nichts erst dunkel aufblitzt. */
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('spp.spiel') || 'null');
    if (s && s.stil === 'pixel') { document.documentElement.setAttribute('data-theme', 'light'); document.documentElement.classList.add('px'); }
  } catch (e) {}
})();
