/* Das Pixelparadies: Figuren in 8 Bit und der Knall.
   Jede Figur wird mit ein paar Rechtecken auf ein Raster gemalt (ein Buchstabe je Farbe, '.' ist durchsichtig).
   Danach bekommt alles einen dunklen Umriss, damit es vor hellem Himmel steht (außer den Zeichen in frei, etwa Dampf),
   und wird als SVG mit harten Kanten ausgegeben.
   Die Größe kommt aus dem CSS: --pw und --ph sind Breite und Höhe in Pixeln, --px die Größe eines Pixels. */

const UMRISS = '#1c1233';

/* Malt auf ein Raster w × h. fn bekommt r(x0, y0, x1, y1, z) für Rechtecke (Ecken eingeschlossen) und p(x, y, z) für Punkte. */
function malen(w, h, fn, umriss = true, frei = ''){
  const g = Array.from({ length: h }, () => Array(w).fill('.'));
  const p = (x, y, z) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = z; };
  const r = (x0, y0, x1, y1, z) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) p(x, y, z); };
  fn(r, p);
  if (umriss) {
    const voll = (x, y) => x >= 0 && y >= 0 && x < w && y < h && g[y][x] !== '.' && g[y][x] !== 'o' && !frei.includes(g[y][x]);
    const neu = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (g[y][x] === '.' && (voll(x + 1, y) || voll(x - 1, y) || voll(x, y + 1) || voll(x, y - 1))) neu.push([x, y]);
    for (const [x, y] of neu) g[y][x] = 'o';
  }
  return g.map(z => z.join(''));
}

/* Raster zu SVG; gleiche Farben nebeneinander werden zu einem Rechteck zusammengefasst */
function svg(karte, farben, klasse){
  const h = karte.length, w = karte[0].length;
  let r = '';
  karte.forEach((zeile, y) => {
    for (let x = 0; x < zeile.length;) {
      const z = zeile[x];
      if (z === '.') { x++; continue; }
      let n = 1;
      while (zeile[x + n] === z) n++;
      r += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + (farben[z] || UMRISS) + '"/>';
      x += n;
    }
  });
  return '<svg class="px ' + klasse + '" viewBox="0 0 ' + w + ' ' + h + '" style="--pw:' + w + ';--ph:' + h + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + r + '</svg>';
}

const FIGUREN = {
  /* Bit, der kleine Prüfling: ein weißer Würfel mit einer Kaffeetasse als Hut */
  bit: [malen(12, 16, (r, p) => {
    p(4, 0, 's'); p(5, 1, 's'); p(6, 0, 's'); p(7, 1, 's');
    r(3, 3, 7, 6, 'C'); r(7, 3, 7, 6, 'c'); r(3, 3, 7, 3, 'H');
    p(8, 4, 'c'); p(9, 4, 'c'); p(9, 5, 'c'); p(8, 6, 'c'); p(9, 6, 'c');
    r(2, 8, 9, 13, 'w'); r(9, 8, 9, 13, 'g'); r(2, 13, 9, 13, 'g');
    r(3, 9, 3, 10, 'k'); r(7, 9, 7, 10, 'k');
    p(2, 11, 'r'); p(8, 11, 'r'); r(5, 11, 5, 11, 'k');
    r(3, 14, 3, 14, 'w'); r(7, 14, 7, 14, 'w');
  }, true, 's'), { C: '#ff8a3a', c: '#c8601e', H: '#ffb878', s: '#dff3ff', w: '#ffffff', g: '#c9cfe6', k: UMRISS, r: '#ff8fb0' }],

  herz: [malen(9, 8, (r, p) => {
    r(1, 1, 2, 1, 'R'); r(5, 1, 6, 1, 'R'); r(0, 2, 7, 3, 'R'); r(1, 4, 6, 4, 'R'); r(2, 5, 5, 5, 'R'); r(3, 6, 4, 6, 'R');
    p(1, 2, 'H'); p(2, 2, 'H'); p(1, 3, 'H'); r(6, 3, 7, 3, 'D'); r(5, 4, 6, 4, 'D');
  }), { R: '#ff3b5c', H: '#ffd0da', D: '#c81e44' }],
  herzLeer: [malen(9, 8, (r) => {
    r(1, 1, 2, 1, 'R'); r(5, 1, 6, 1, 'R'); r(0, 2, 7, 3, 'R'); r(1, 4, 6, 4, 'R'); r(2, 5, 5, 5, 'R'); r(3, 6, 4, 6, 'R');
  }), { R: '#3d2f63', o: '#8a7ab8' }],

  /* Goldwürfel, schräg von oben: helle Deckfläche, links Gold, rechts Schatten */
  wuerfel: [malen(12, 12, (r, p) => {
    r(4, 1, 7, 1, 'T'); r(2, 2, 9, 2, 'T'); r(1, 3, 10, 3, 'T');
    r(1, 4, 5, 9, 'L'); r(6, 4, 10, 9, 'R'); r(3, 4, 8, 4, 'T'); r(5, 5, 6, 5, 'T');
    r(2, 10, 5, 10, 'L'); r(6, 10, 9, 10, 'R'); r(5, 11, 6, 11, 'R');
    p(4, 2, 'W'); p(2, 6, 'W');
  }), { T: '#fff0a0', L: '#ffc83a', R: '#e0961a', W: '#ffffff' }],
  splitter: [malen(7, 7, (r, p) => {
    r(3, 1, 3, 1, 'T'); r(2, 2, 4, 2, 'T'); r(1, 3, 2, 4, 'L'); r(3, 3, 5, 4, 'R'); r(2, 5, 4, 5, 'R'); p(3, 3, 'T');
  }), { T: '#fff0a0', L: '#ffc83a', R: '#e0961a' }],
  splitterLeer: [malen(7, 7, (r) => {
    r(3, 1, 3, 1, 'T'); r(2, 2, 4, 2, 'T'); r(1, 3, 5, 4, 'T'); r(2, 5, 4, 5, 'T');
  }), { T: '#3d2f63', o: '#6a5a98' }],

  bombe: [malen(14, 16, (r, p) => {
    r(5, 7, 10, 7, 'B'); r(3, 8, 12, 9, 'B'); r(2, 10, 13, 13, 'B'); r(3, 14, 12, 14, 'B'); r(5, 15, 10, 15, 'B');
    r(6, 5, 9, 6, 'G'); r(6, 5, 9, 5, 'g');
    r(4, 9, 5, 9, 'h'); p(3, 10, 'h'); p(4, 10, 'h'); p(3, 11, 'h');
    r(11, 12, 12, 13, 'D'); r(9, 14, 12, 14, 'D');
    p(9, 4, 'f'); p(10, 3, 'f'); p(11, 2, 'f');
    p(12, 1, 'Y'); p(13, 0, 'Y'); p(13, 2, 'Y'); p(12, 0, 'W');
  }), { B: '#2e2c52', h: '#8a88c8', D: '#1a1834', G: '#9aa0b8', g: '#c8ccdc', f: '#d8a860', Y: '#ffd23a', W: '#ffffff' }],

  kiste: [malen(16, 13, (r, p) => {
    r(2, 1, 13, 4, 'b'); r(1, 3, 14, 4, 'b'); r(1, 5, 14, 11, 'b');
    r(1, 4, 14, 4, 'Y'); r(1, 8, 14, 8, 'Y'); r(4, 1, 4, 11, 'Y'); r(11, 1, 11, 11, 'Y');
    r(1, 11, 14, 11, 'd'); r(13, 5, 14, 10, 'd');
    r(7, 6, 8, 9, 'Y'); p(7, 7, 'k'); p(8, 7, 'k'); r(7, 8, 8, 8, 'k');
    p(3, 2, 'H'); p(6, 2, 'H');
  }), { b: '#c8702a', d: '#7a3a18', Y: '#ffd23a', H: '#ffb060', k: UMRISS }],

  /* ---------- Die Wächter der Inseln ---------- */
  golem: [malen(24, 24, (r, p) => {
    r(8, 1, 15, 3, 'Y'); r(5, 4, 18, 4, 'Y'); r(9, 1, 10, 1, 'W'); r(14, 2, 15, 3, 'y');
    r(6, 5, 17, 10, 'S'); r(16, 5, 17, 10, 's');
    r(8, 6, 9, 6, 's'); r(14, 6, 15, 6, 's'); r(8, 7, 9, 7, 'E'); r(14, 7, 15, 7, 'E'); r(10, 9, 13, 9, 'k');
    r(4, 11, 19, 19, 'S'); r(18, 11, 19, 19, 's'); p(6, 18, 's'); p(7, 17, 's'); p(16, 12, 's');
    r(6, 13, 17, 16, 'k'); r(7, 14, 15, 15, 'G'); r(16, 14, 16, 15, 'd'); r(7, 14, 15, 14, 'g');
    r(1, 11, 3, 16, 'S'); r(20, 11, 22, 16, 'S'); r(1, 17, 3, 19, 's'); r(20, 17, 22, 19, 's');
    r(6, 20, 10, 22, 'S'); r(13, 20, 17, 22, 'S'); r(9, 20, 10, 22, 's'); r(16, 20, 17, 22, 's');
  }), { Y: '#ffc83a', y: '#e0961a', W: '#fff0a0', S: '#b8bccc', s: '#8288a4', E: '#ffe14a', k: UMRISS, G: '#36d27a', g: '#8af0b0', d: '#4a4e68' }],

  drache: [malen(24, 24, (r, p) => {
    r(19, 1, 23, 1, 'Y'); r(19, 7, 23, 7, 'Y'); r(20, 2, 22, 2, 'S'); r(21, 3, 21, 4, 'S'); r(20, 5, 22, 6, 'S');
    r(12, 7, 18, 11, 'g'); r(13, 6, 16, 6, 'g'); p(14, 8, 'G'); p(16, 9, 'G');
    r(5, 12, 19, 20, 'G'); r(8, 15, 16, 20, 'B'); r(9, 16, 15, 16, 'b'); r(9, 18, 15, 18, 'b');
    r(2, 6, 11, 12, 'G'); r(0, 9, 3, 12, 'G'); p(1, 10, 'k'); r(4, 4, 4, 5, 'W'); r(8, 4, 8, 5, 'W');
    r(5, 7, 8, 7, 'g'); r(5, 8, 8, 8, 'k');
    r(0, 12, 6, 12, 'g');
    r(19, 16, 22, 18, 'G'); r(22, 14, 23, 16, 'g');
    r(7, 21, 9, 22, 'g'); r(15, 21, 17, 22, 'g');
  }), { G: '#36c88a', g: '#1f9a6a', B: '#ffc890', b: '#e8a060', W: '#fff4d8', k: UMRISS, Y: '#c8a060', S: '#ffe14a' }],

  gespenst: [malen(24, 24, (r, p) => {
    r(8, 2, 15, 2, 'W'); r(6, 3, 17, 4, 'W'); r(5, 5, 18, 18, 'W'); r(16, 5, 18, 18, 'g');
    r(5, 19, 7, 20, 'W'); r(10, 19, 13, 20, 'W'); r(16, 19, 18, 20, 'g'); r(6, 21, 6, 21, 'W'); r(11, 21, 12, 21, 'W'); r(17, 21, 17, 21, 'g');
    r(1, 9, 4, 11, 'W'); r(1, 12, 2, 12, 'W'); r(19, 9, 22, 11, 'g'); r(21, 12, 22, 12, 'g');
    r(7, 8, 9, 11, 'k'); r(14, 8, 16, 11, 'k'); p(7, 8, 'L'); p(14, 8, 'L');
    r(6, 13, 7, 13, 'P'); r(16, 13, 17, 13, 'P');
    r(10, 13, 13, 16, 'k'); r(11, 14, 12, 15, 'W'); p(13, 13, 'W'); p(10, 16, 'W');
  }), { W: '#ffffff', g: '#d8d0f4', k: UMRISS, L: '#8a7ab8', P: '#ff9ac8' }],

  spaghetti: [malen(24, 24, (r, p) => {
    r(20, 1, 20, 3, 'S'); r(22, 1, 22, 3, 'S'); r(21, 1, 21, 14, 'S'); r(20, 4, 22, 4, 'S');
    r(8, 2, 9, 5, 'N'); r(13, 1, 14, 5, 'N'); r(17, 4, 18, 6, 'N');
    r(4, 6, 19, 13, 'N');
    for (let i = 0; i < 14; i++) { p(4 + i, 6 + (i * 3) % 8, 'n'); p(18 - i, 7 + (i * 5) % 7, 'n'); }
    r(6, 8, 9, 10, 'M'); r(14, 8, 17, 10, 'M'); p(7, 9, 'W'); p(8, 9, 'k'); p(15, 9, 'W'); p(16, 9, 'k');
    r(10, 11, 13, 11, 'k'); r(5, 12, 6, 13, 'R'); r(16, 12, 17, 13, 'R'); r(11, 12, 12, 12, 'R');
    r(2, 14, 21, 16, 'B'); r(2, 15, 21, 15, 'b'); r(4, 17, 19, 19, 'B'); r(7, 20, 16, 21, 'B'); r(17, 14, 21, 16, 'c'); r(15, 17, 19, 19, 'c');
  }), { N: '#ffd860', n: '#e0a830', M: '#b84a2a', W: '#ffffff', k: UMRISS, R: '#e83a3a', B: '#eef4ff', b: '#4a8ae8', c: '#c8d4ee', S: '#c8ccdc' }],

  hai: [malen(24, 24, (r, p) => {
    r(0, 1, 4, 4, 'W'); p(1, 2, 'R'); p(2, 3, 'R'); p(3, 2, 'R');
    p(4, 5, 'k'); p(5, 6, 'k'); p(5, 7, 'k'); p(6, 8, 'k');
    r(11, 5, 13, 9, 'H'); r(12, 4, 12, 4, 'H');
    r(6, 9, 18, 9, 'H'); r(3, 10, 20, 17, 'H'); r(1, 12, 3, 16, 'H'); r(4, 10, 20, 10, 'h');
    r(4, 15, 18, 17, 'W'); r(20, 7, 22, 11, 'H'); r(20, 15, 22, 19, 'H'); r(21, 6, 22, 6, 'H');
    r(6, 11, 7, 12, 'k'); p(6, 11, 'W'); r(5, 10, 8, 10, 'd');
    r(1, 14, 9, 14, 'k'); p(2, 15, 'W'); p(4, 15, 'W'); p(6, 15, 'W'); p(8, 15, 'W'); p(3, 13, 'W'); p(5, 13, 'W'); p(7, 13, 'W');
    r(13, 12, 13, 13, 'd'); r(15, 12, 15, 13, 'd'); r(10, 18, 13, 19, 'H');
  }), { H: '#6a8ac8', h: '#9ab4e8', d: '#3a5a98', W: '#ffffff', R: '#ff3b5c', k: UMRISS }],

  rolle: [malen(24, 24, (r, p) => {
    r(2, 1, 21, 3, 'p'); r(1, 2, 1, 2, 'd'); r(22, 2, 22, 2, 'd'); r(2, 3, 21, 3, 'd');
    r(4, 4, 19, 19, 'P'); r(18, 4, 19, 19, 'q');
    r(2, 20, 21, 22, 'p'); r(2, 20, 21, 20, 'd'); r(1, 21, 1, 21, 'd'); r(22, 21, 22, 21, 'd');
    r(6, 6, 9, 6, 'k'); r(14, 6, 17, 6, 'k'); p(9, 5, 'k'); p(14, 5, 'k');
    r(7, 7, 9, 9, 'k'); r(14, 7, 16, 9, 'k'); p(7, 7, 'W'); p(14, 7, 'W');
    r(8, 11, 15, 13, 'k'); p(9, 11, 'W'); p(11, 11, 'W'); p(13, 11, 'W'); p(10, 13, 'W'); p(12, 13, 'W'); p(14, 13, 'W');
    r(6, 15, 17, 15, 't'); r(6, 17, 15, 17, 't'); r(6, 19, 12, 19, 't');
    r(0, 10, 3, 12, 'P'); r(20, 10, 23, 12, 'P');
  }), { p: '#e8c890', d: '#b8945a', P: '#fff4d8', q: '#e8dcb8', k: UMRISS, W: '#ffffff', t: '#b8a888' }],

  bluescreen: [malen(24, 24, (r) => {
    r(2, 2, 21, 16, 'F'); r(20, 2, 21, 16, 'f'); r(4, 4, 19, 14, 'B'); r(4, 4, 19, 4, 'b');
    r(7, 7, 8, 8, 'W'); r(7, 10, 8, 11, 'W'); r(13, 6, 13, 6, 'W'); r(12, 7, 12, 11, 'W'); r(13, 12, 13, 12, 'W');
    r(15, 11, 17, 13, 'W'); r(16, 12, 16, 12, 'B');
    r(10, 17, 13, 19, 'f'); r(6, 20, 17, 21, 'F'); r(6, 21, 17, 21, 'f');
    r(0, 8, 1, 12, 'F'); r(22, 8, 23, 12, 'F');
  }), { F: '#e0e4f0', f: '#a8acc0', B: '#2a6ae8', b: '#4a8af8', W: '#ffffff' }],

  glitch: [malen(24, 24, (r, p) => {
    r(6, 3, 17, 3, 'K'); r(4, 4, 19, 19, 'K'); r(6, 20, 17, 20, 'K');
    r(9, 1, 10, 2, 'K'); r(2, 8, 3, 10, 'K'); r(20, 12, 21, 15, 'K'); r(15, 21, 16, 22, 'K'); r(19, 5, 20, 6, 'K');
    r(3, 6, 3, 17, 'C'); r(20, 6, 20, 11, 'M'); r(0, 15, 6, 15, 'C'); r(17, 6, 23, 6, 'M'); r(5, 18, 12, 18, 'Y');
    r(8, 8, 15, 13, 'W'); r(10, 9, 13, 12, 'M'); r(11, 10, 12, 11, 'k'); p(10, 9, 'W');
    r(8, 15, 15, 16, 'k'); p(9, 15, 'W'); p(11, 16, 'W'); p(13, 15, 'W'); p(15, 16, 'W');
    p(5, 5, 'L'); p(6, 4, 'L');
  }), { K: '#2a1250', L: '#5a3a9a', C: '#2af0ff', M: '#ff2a8a', Y: '#ffe14a', W: '#ffffff', k: '#05030f', o: '#05030f' }]
};
/* Das Lagerfeuer im Pixelstil: Steinkreis, Scheite, ein Schwert in der Glut. Die Flammen gibt es in zwei Bildern,
   die sich abwechseln; sie haben keinen Umriss, damit sie weich wirken. */
const LAGER = {
  holz: [malen(24, 30, (r, p) => {
    r(11, 0, 12, 0, 'P'); r(11, 1, 12, 4, 'G'); p(11, 2, 'g'); r(7, 5, 16, 6, 'Q'); r(7, 5, 16, 5, 'q');
    r(11, 7, 12, 23, 'B'); r(11, 7, 11, 23, 'b');
    r(3, 22, 9, 23, 'H'); r(14, 22, 20, 23, 'H'); r(5, 24, 18, 25, 'h'); r(9, 21, 14, 22, 'H');
    for (const x of [1, 5, 9, 13, 17, 21]) { r(x, 26, x + 2, 28, 'S'); r(x, 26, x + 2, 26, 's'); }
  }), { P: '#ffd23a', G: '#7a4a22', g: '#b0703a', Q: '#c8ccdc', q: '#ffffff', B: '#e8ecf8', b: '#ffffff', H: '#8a4a1e', h: '#5a2e12', S: '#8a90a8', s: '#c8ccdc' }],
  flammeA: [malen(24, 30, (r) => {
    r(7, 14, 16, 25, 'O'); r(5, 18, 18, 25, 'O'); r(9, 9, 13, 13, 'O'); r(14, 11, 15, 13, 'O'); r(6, 15, 6, 17, 'O');
    r(8, 16, 15, 25, 'Y'); r(10, 12, 12, 15, 'Y'); r(9, 20, 14, 25, 'W');
  }, false), { O: '#ff6a1e', Y: '#ffd23a', W: '#fff4c0' }],
  flammeB: [malen(24, 30, (r) => {
    r(6, 15, 17, 25, 'O'); r(4, 19, 19, 25, 'O'); r(10, 8, 14, 14, 'O'); r(7, 12, 8, 14, 'O'); r(17, 16, 17, 18, 'O');
    r(8, 17, 16, 25, 'Y'); r(11, 11, 13, 16, 'Y'); r(9, 21, 15, 25, 'W');
  }, false), { O: '#ff7a2a', Y: '#ffe14a', W: '#fffbe0' }]
};
export function lagerfeuer(klasse = ''){
  const bild = n => svg(LAGER[n][0], Object.assign({ o: UMRISS }, LAGER[n][1]), 'px-lager-' + n);
  return '<div class="px-feuer' + (klasse ? ' ' + klasse : '') + '" aria-hidden="true">' + bild('flammeA') + bild('flammeB') + bild('holz') + '<b></b><b></b><b></b><b></b></div>';
}

/* ---------- Die Bosse des Hauptspiels, für den Spielstil Pixel ---------- */
const GESICHT = (haut, schatten) => [malen(24, 24, (r, p) => {
  r(4, 2, 19, 20, 'H'); r(16, 2, 19, 20, 'h'); r(6, 21, 17, 22, 'h');
  r(2, 8, 3, 13, 'H'); r(20, 8, 21, 13, 'h');
  r(6, 7, 9, 8, 'k'); r(14, 7, 17, 8, 'k'); r(7, 9, 9, 10, 'E'); r(14, 9, 16, 10, 'E'); p(8, 9, 'k'); p(15, 9, 'k');
  r(10, 11, 13, 14, 'h'); r(7, 16, 16, 18, 'k'); p(8, 16, 'W'); p(10, 16, 'W'); p(13, 16, 'W'); p(15, 16, 'W');
  r(4, 0, 19, 2, 'I'); r(2, 1, 3, 4, 'I'); r(20, 1, 21, 4, 'I'); p(6, 3, 'W'); p(12, 3, 'W');
}), { H: haut, h: schatten, k: UMRISS, E: '#ffe14a', W: '#ffffff', I: '#bfe8ff' }];
const PRUEFER = (haar, hemd, hemdSchatten, extra) => [malen(24, 24, (r, p) => {
  r(7, 1, 16, 4, 'A'); r(6, 3, 7, 8, 'A'); r(16, 3, 17, 8, 'A');
  r(7, 4, 16, 12, 'S'); r(15, 4, 16, 12, 's');
  r(9, 7, 10, 7, 'k'); r(13, 7, 14, 7, 'k'); r(10, 10, 13, 10, 'm');
  if (extra === 'brille') { r(8, 6, 11, 8, 'G'); r(12, 6, 15, 8, 'G'); r(9, 7, 10, 7, 'k'); r(13, 7, 14, 7, 'k'); }
  r(4, 13, 19, 23, 'C'); r(17, 13, 19, 23, 'c'); r(10, 13, 13, 16, 'W'); p(11, 14, 'R'); p(12, 14, 'R'); r(11, 15, 12, 18, 'R');
  r(1, 18, 22, 20, 'T'); r(1, 18, 22, 18, 't'); r(3, 16, 8, 17, 'W');
  if (extra === 'stift') { r(18, 12, 18, 17, 'Y'); p(18, 11, 'k'); }
  if (extra === 'buch') { r(15, 14, 21, 17, 'B'); r(18, 14, 18, 17, 'W'); }
}), { A: haar, S: '#f0c8a0', s: '#d8a880', k: UMRISS, m: '#a0503a', G: '#ffffff', C: hemd, c: hemdSchatten, W: '#ffffff', R: '#c81e44', T: '#8a4a1e', t: '#b0703a', Y: '#ffd23a', B: '#2a6ad8' }];
Object.assign(FIGUREN, {
  matrix: [malen(24, 24, (r, p) => {
    r(4, 8, 19, 22, 'B'); for (let x = 4; x <= 19; x += 5) r(x, 8, x, 22, 'b'); for (let y = 8; y <= 22; y += 5) r(4, y, 19, y, 'b');
    r(3, 2, 9, 7, 'S'); r(14, 2, 20, 7, 'S'); r(3, 0, 9, 1, 'R'); r(14, 0, 20, 1, 'G');
    p(4, 4, 'k'); p(6, 4, 'k'); p(17, 4, 'k'); p(19, 4, 'k'); r(5, 6, 7, 6, 'k'); r(16, 6, 18, 6, 'k');
    r(0, 12, 3, 13, 'S'); r(20, 12, 23, 13, 'S'); r(0, 14, 1, 16, 'S'); r(22, 14, 23, 16, 'S');
  }), { B: '#5a8ae8', b: '#2a4aa8', S: '#f0c8a0', R: '#ff3b5c', G: '#36d27a', k: UMRISS }],
  lieferverzug: [malen(24, 24, (r, p) => {
    r(3, 7, 20, 22, 'K'); r(17, 7, 20, 22, 'k'); r(3, 4, 20, 7, 'L'); r(10, 4, 13, 22, 'T');
    r(6, 11, 8, 13, 'W'); r(15, 11, 17, 13, 'W'); p(7, 12, 'x'); p(16, 12, 'x'); r(5, 10, 8, 10, 'x'); r(15, 10, 18, 10, 'x');
    r(7, 17, 16, 18, 'x'); r(19, 0, 23, 4, 'W'); p(21, 1, 'x'); p(21, 2, 'x'); p(22, 2, 'x');
  }), { K: '#d8a060', k: '#b8844a', L: '#e8b878', T: '#f4e2a0', W: '#ffffff', x: UMRISS }],
  broadcast: [malen(24, 24, (r, p) => {
    r(4, 6, 19, 8, 'C'); r(6, 9, 17, 11, 'c'); r(7, 12, 16, 14, 'C'); r(9, 15, 14, 17, 'c'); r(10, 18, 13, 20, 'C'); r(11, 21, 12, 23, 'c');
    r(11, 0, 12, 5, 'A'); p(11, 0, 'R'); p(12, 0, 'R');
    p(8, 1, 'W'); p(7, 2, 'W'); p(15, 1, 'W'); p(16, 2, 'W'); p(5, 2, 'W'); p(4, 3, 'W'); p(18, 2, 'W'); p(19, 3, 'W');
    r(8, 7, 9, 7, 'k'); r(14, 7, 15, 7, 'k'); r(9, 10, 14, 10, 'k');
  }), { C: '#7ad0ff', c: '#3a8ac8', A: '#c8ccdc', R: '#ff3b5c', W: '#ffe14a', k: UMRISS }],
  kumulation: [malen(24, 24, (r, p) => {
    r(2, 14, 21, 22, 'R'); r(4, 7, 19, 13, 'Y'); r(7, 1, 16, 6, 'G');
    r(9, 3, 9, 3, 'k'); r(14, 3, 14, 3, 'k'); r(7, 9, 8, 10, 'k'); r(15, 9, 16, 10, 'k'); r(5, 16, 7, 18, 'k'); r(16, 16, 18, 18, 'k');
    r(10, 11, 13, 11, 'k'); r(8, 20, 15, 20, 'k'); p(10, 5, 'k'); p(13, 5, 'k');
  }), { R: '#ff3b5c', Y: '#ffd23a', G: '#36d27a', k: UMRISS }],
  schleife: [malen(24, 24, (r, p) => {
    for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2, x = Math.round(12 + Math.cos(a) * 8), y = Math.round(12 + Math.sin(a) * 8); r(x - 1, y - 1, x + 1, y + 1, i % 8 < 4 ? 'G' : 'g'); }
    r(15, 1, 21, 6, 'G'); p(19, 2, 'k'); r(20, 5, 22, 5, 'R'); p(22, 6, 'R'); r(13, 3, 14, 4, 'g');
    r(10, 10, 13, 13, 'W'); p(11, 11, 'k');
  }), { G: '#5cc23a', g: '#2f8a2a', R: '#ff3b5c', W: '#ffffff', k: UMRISS }],
  kunde: [malen(24, 24, (r, p) => {
    r(6, 4, 17, 15, 'R'); r(15, 4, 17, 15, 'r'); r(5, 2, 18, 4, 'A');
    r(7, 7, 10, 7, 'k'); r(13, 7, 16, 7, 'k'); r(8, 8, 9, 9, 'W'); r(14, 8, 15, 9, 'W'); p(9, 9, 'k'); p(14, 9, 'k');
    r(9, 12, 14, 13, 'k'); r(10, 12, 13, 12, 'W');
    r(4, 16, 19, 23, 'C'); r(18, 10, 21, 16, 'P'); r(19, 11, 20, 12, 'S');
    p(3, 0, 'D'); p(4, 1, 'D'); p(20, 0, 'D'); p(19, 1, 'D'); p(11, 0, 'D');
  }), { R: '#ff7a6a', r: '#e04a3a', A: '#5a3a1a', W: '#ffffff', k: UMRISS, C: '#2a6ad8', P: '#3a3f55', S: '#7ad0ff', D: '#e8ecf8' }],
  rekursion: [malen(24, 24, (r, p) => {
    r(0, 0, 23, 23, 'A'); r(3, 3, 20, 20, 'B'); r(6, 6, 17, 17, 'A'); r(8, 8, 15, 15, 'B'); r(10, 10, 13, 13, 'A');
    p(11, 11, 'k'); p(12, 11, 'k'); r(11, 13, 12, 13, 'k');
    r(4, 4, 6, 5, 'E'); r(17, 4, 19, 5, 'E');
  }, false), { A: '#8f5cff', B: '#ffd23a', k: UMRISS, E: '#ffffff' }],
  gottobjekt: [malen(24, 24, (r, p) => {
    r(4, 3, 19, 20, 'W'); r(4, 3, 19, 7, 'H'); r(4, 12, 19, 12, 'L'); r(6, 14, 15, 14, 'L'); r(6, 16, 13, 16, 'L'); r(6, 18, 16, 18, 'L'); r(6, 9, 14, 9, 'L');
    r(9, 4, 14, 6, 'W'); r(11, 4, 12, 6, 'E'); p(11, 5, 'k');
    for (const [x, y] of [[0, 6], [0, 11], [0, 16], [20, 6], [20, 11], [20, 16]]) r(x, y, x + 3, y + 1, 'W');
    r(6, 21, 7, 23, 'W'); r(16, 21, 17, 23, 'W'); r(1, 0, 3, 2, 'Y'); r(20, 0, 22, 2, 'Y');
  }), { W: '#fff8e6', H: '#ffd23a', L: '#b8b0d8', E: '#8f5cff', k: UMRISS, Y: '#ffd23a' }],
  join: [malen(24, 24, (r, p) => {
    r(1, 3, 22, 21, 'W'); for (let x = 1; x <= 22; x += 4) r(x, 3, x, 21, 'L'); for (let y = 3; y <= 21; y += 3) r(1, y, 22, y, 'L');
    r(1, 3, 22, 5, 'H');
    for (let i = 0; i < 9; i++) { p(7 + i, 8 + i, 'R'); p(8 + i, 8 + i, 'R'); p(16 - i, 8 + i, 'R'); p(15 - i, 8 + i, 'R'); }
    r(5, 0, 6, 2, 'H'); r(17, 0, 18, 2, 'H');
  }), { W: '#ffffff', L: '#c8cce0', H: '#36c8e8', R: '#ff3b5c' }],
  scopecreep: [malen(24, 24, (r, p) => {
    r(3, 8, 20, 22, 'G'); r(5, 5, 18, 8, 'G'); r(8, 3, 15, 5, 'G'); r(18, 8, 20, 22, 'g');
    r(8, 10, 9, 12, 'k'); r(14, 10, 15, 12, 'k'); r(9, 16, 14, 17, 'k');
    for (const [x, y] of [[4, 6], [16, 4], [1, 14], [19, 17], [6, 19], [12, 1]]) { r(x, y, x + 3, y + 3, 'Y'); p(x, y, 'y'); }
  }), { G: '#8be04a', g: '#5cc23a', k: UMRISS, Y: '#ffe14a', y: '#e0a830' }],
  spof: [malen(24, 24, (r, p) => {
    r(5, 2, 18, 23, 'S'); r(16, 2, 18, 23, 's'); for (let y = 12; y < 22; y += 3) { r(7, y, 15, y + 1, 's'); p(14, y, 'L'); }
    r(7, 4, 16, 10, 'W'); r(9, 5, 14, 9, 'R'); r(11, 6, 12, 8, 'k'); p(10, 5, 'W');
    r(0, 18, 4, 19, 'K'); r(19, 15, 23, 16, 'K');
  }), { S: '#3a3f5a', s: '#2a2e44', W: '#ffffff', R: '#ff3b5c', k: UMRISS, L: '#5aff8a', K: '#1c1233' }],
  probezeit: [malen(24, 24, (r, p) => {
    r(5, 1, 18, 2, 'H'); r(5, 21, 18, 22, 'H'); r(6, 3, 17, 5, 'G'); r(8, 6, 15, 8, 'G'); r(10, 9, 13, 13, 'G'); r(8, 14, 15, 16, 'G'); r(6, 17, 17, 20, 'G');
    r(8, 4, 15, 5, 'S'); r(11, 10, 12, 14, 'S'); r(7, 18, 16, 20, 'S');
    r(8, 7, 9, 7, 'k'); r(14, 7, 15, 7, 'k'); r(0, 9, 5, 16, 'P'); r(1, 11, 4, 11, 'L'); r(1, 13, 4, 13, 'L'); p(3, 15, 'R');
  }), { H: '#8a4a1e', G: '#d8f4ff', S: '#ffd23a', k: UMRISS, P: '#ffffff', L: '#8a90a8', R: '#ff3b5c' }],
  akronymant: [malen(24, 24, (r, p) => {
    r(5, 2, 18, 9, 'M'); r(7, 0, 16, 2, 'M'); r(3, 10, 20, 23, 'M'); r(16, 10, 20, 23, 'm');
    r(8, 4, 15, 9, 'B'); r(9, 5, 10, 6, 'E'); r(13, 5, 14, 6, 'E'); r(10, 8, 13, 8, 'k');
    r(0, 13, 3, 15, 'B'); r(21, 9, 23, 11, 'B'); r(22, 3, 22, 8, 'S'); p(22, 2, 'E');
    r(8, 14, 9, 18, 'Y'); r(12, 14, 14, 14, 'Y'); r(13, 15, 13, 18, 'Y');
  }), { M: '#2a1a4a', m: '#1a1036', B: '#e8dcc0', E: '#ff4a2a', k: UMRISS, S: '#8a90a8', Y: '#ffd23a' }],
  gesichtRot: GESICHT('#ff6a5a', '#d04a3a'),
  gesichtBleich: GESICHT('#f4ecd8', '#d0c8b0'),
  gesichtSchwarz: GESICHT('#4a3a5a', '#2e2440'),
  prueferin: PRUEFER('#3a2a1a', '#2a6ad8', '#1f4ea8', 'stift'),
  pruefer: PRUEFER('#c8c8d0', '#5a5a6a', '#44444f', 'brille'),
  lehrkraft: PRUEFER('#d0702a', '#36a870', '#24804f', 'buch')
});
const BOSS_FIGUR = { 1: 'matrix', 2: 'lieferverzug', 3: 'broadcast', 4: 'kumulation', 5: 'schleife', 6: 'kunde', 7: 'rekursion', 8: 'gottobjekt', 9: 'join', 10: 'scopecreep', 11: 'spof', 12: 'probezeit', 13: 'akronymant',
  kokytos: ['gesichtRot', 'gesichtBleich', 'gesichtSchwarz'], gipfel: ['prueferin', 'pruefer', 'lehrkraft'] };
/* Welche Figur ein Boss im Pixelstil hat, je Ort und Phase */
export const bossFigur = (ort, phase = 0) => { const f = BOSS_FIGUR[ort]; return Array.isArray(f) ? f[Math.min(phase, f.length - 1)] : f; };

/* Welche Figur zu welchem Wächter gehört */
export const WAECHTER = { 21: 'golem', 22: 'drache', 23: 'gespenst', 24: 'spaghetti', 25: 'hai', 26: 'rolle', 27: 'bluescreen', glitch: 'glitch' };

const FERTIG = new Map();
export function figur(name, klasse = ''){
  const key = name + '|' + klasse;
  if (!FERTIG.has(key)) { const [karte, farben] = FIGUREN[name]; FERTIG.set(key, svg(karte, Object.assign({ o: UMRISS }, farben), 'px-' + name + (klasse ? ' ' + klasse : ''))); }
  return FERTIG.get(key);
}

/* Herzen in einer Reihe, volle zuerst */
export const herzen = (n, max) => Array.from({ length: max }, (_, i) => figur(i < n ? 'herz' : 'herzLeer', 'herz-zelle')).join('');
/* Der Beutel: acht Splitter bis zum nächsten Goldwürfel */
export const beutel = (n, je = 8) => Array.from({ length: je }, (_, i) => figur(i < n ? 'splitter' : 'splitterLeer', 'splitter-zelle')).join('');

/* ---------- Der Knall ----------
   Eckige Funken fliegen aus einem Punkt, fallen mit Schwerkraft und verglühen, dazu ein großer Schriftzug und ein kurzes Beben.
   Bei weniger Bewegung bleibt nur der Schriftzug, ganz ohne Flug und Beben. */
const BUNT = ['#ffd23a', '#ff8a1e', '#ff3b5c', '#36d27a', '#33d6ff', '#8f5cff', '#ffffff'];
export function boom({ text = 'BOOM!', klein = '', farben = BUNT, x = null, y = null, stark = 1, art = '' } = {}){
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const schrift = document.createElement('div');
  schrift.className = 'px-knall' + (art ? ' ' + art : '');
  schrift.setAttribute('aria-hidden', 'true');
  schrift.innerHTML = '<b>' + text + '</b>' + (klein ? '<small>' + klein + '</small>' : '');
  document.body.appendChild(schrift);
  setTimeout(() => schrift.remove(), 1500);
  if (ruhig) return;
  const app = document.querySelector('.app');
  if (app) { app.classList.remove('beben'); void app.offsetWidth; app.classList.add('beben'); setTimeout(() => app.classList.remove('beben'), 450); }
  const cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.className = 'px-funken';
  cv.width = Math.floor(window.innerWidth * dpr); cv.height = Math.floor(window.innerHeight * dpr);
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const ox = (x === null ? window.innerWidth / 2 : x) * dpr, oy = (y === null ? window.innerHeight * .42 : y) * dpr;
  const teile = Array.from({ length: Math.round(56 * stark) }, () => {
    const a = Math.random() * Math.PI * 2, v = (2 + Math.random() * 7 * stark) * dpr;
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3 * dpr, s: (2 + Math.floor(Math.random() * 3)) * 2 * dpr, f: farben[Math.floor(Math.random() * farben.length)], t: 0, l: 50 + Math.random() * 40 };
  });
  let raf = 0;
  const schritt = () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    let lebt = false;
    for (const t of teile) {
      t.t++;
      if (t.t > t.l) continue;
      lebt = true;
      t.x += t.vx; t.y += t.vy; t.vy += .32 * dpr; t.vx *= .98;
      ctx.globalAlpha = Math.max(0, 1 - t.t / t.l);
      ctx.fillStyle = t.f;
      const s = Math.round(t.s);
      ctx.fillRect(Math.round(t.x / 2) * 2, Math.round(t.y / 2) * 2, s, s);
    }
    if (lebt) raf = requestAnimationFrame(schritt); else cv.remove();
  };
  raf = requestAnimationFrame(schritt);
  setTimeout(() => { cancelAnimationFrame(raf); cv.remove(); }, 2500);
}
