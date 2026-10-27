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
