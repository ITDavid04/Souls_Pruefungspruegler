/* Spielregeln ohne Oberfläche: Lernkasten, Kartenwahl, Antworten prüfen, Werte für Leben und Seelen.
   Die Zahlen stammen aus dem AP1 Reinprügler, damit sich beide gleich anfühlen. */

export const rnd = n => Math.floor(Math.random() * n);
export const pick = a => a[rnd(a.length)];
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function wpick(arr, wf){
  const w = arr.map(wf), sum = w.reduce((a, b) => a + b, 0);
  let x = Math.random() * sum;
  for (let i = 0; i < arr.length; i++) { x -= w[i]; if (x <= 0) return arr[i]; }
  return arr[arr.length - 1];
}

/* ---------- Lernkasten: Fach 0 = neu, 1 = falsch, 5 = sitzt fest ---------- */
export const INTERVALL = [0, 0, 1, 3, 7, 14];
export const heute = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
export const leer = () => ({ b: 0, d: 0, r: 0, w: 0 });
export const stand = (prog, c) => prog[c.i] || leer();
export const faellig = (prog, c, t) => { const s = stand(prog, c); return s.b > 0 && s.d <= t; };
export const sitzt = (prog, c) => stand(prog, c).b >= 4;

export function eintragen(prog, c, gut, t = heute()){
  const s = Object.assign(leer(), prog[c.i]);
  if (gut) { s.r++; s.b = s.b === 0 ? 2 : Math.min(5, s.b + 1); }
  else { s.w++; s.b = 1; }
  s.d = t + INTERVALL[s.b];
  prog[c.i] = s;
  return s;
}
/* Nachprügeln in derselben Runde: nur Fehler zählen, das Fach bleibt */
export function fehlerNachtragen(prog, c, t = heute()){
  const s = Object.assign(leer(), prog[c.i]);
  s.w++; s.b = 1; s.d = t;
  prog[c.i] = s;
}

/* ---------- Kartenwahl ---------- */
export const GANG = 10, NEU_MAX = 7;

/* Ein Gang: zuerst der Blutfleck, dann fällige Karten, dann neue (in Themenreihenfolge), dann die wackligen */
export function gangPlanen(karten, prog, lf, blutId, t = heute()){
  const pool = karten.filter(c => c.l === lf);
  const q = [];
  const add = c => { if (q.length < GANG && !q.includes(c.i)) q.push(c.i); };
  if (blutId && pool.some(c => c.i === blutId)) q.push(blutId);
  pool.filter(c => faellig(prog, c, t))
    .sort((a, b) => stand(prog, a).b - stand(prog, b).b || stand(prog, a).d - stand(prog, b).d)
    .forEach(add);
  const neu = pool.filter(c => stand(prog, c).b === 0);
  const rest = pool.filter(c => stand(prog, c).b > 0 && !q.includes(c.i));
  const neuPlatz = rest.length ? Math.min(NEU_MAX, GANG - q.length) : GANG - q.length;
  neu.slice(0, neuPlatz).forEach(add);
  let r = rest.slice();
  while (q.length < GANG && r.length) {
    const c = wpick(r, c => { const s = stand(prog, c); return (6 - s.b) + (s.w > 0 ? 2 : 0); });
    add(c); r = r.filter(x => x !== c);
  }
  neu.forEach(add);
  return q;
}

/* Bosskarte: aus den Lernfeldern der Phase, schwache Karten öfter, nicht die letzten sechs.
   seltenheit: nur Kürzel dieser Seltenheit (die zweite Beschwörung des Akronymanten) */
export function bossKarte(karten, prog, lfs, zuletzt, seltenheit){
  const passt = c => lfs.includes(c.l) && (!seltenheit || c.r === seltenheit);
  let pool = karten.filter(c => passt(c) && !zuletzt.includes(c.i));
  if (!pool.length) pool = karten.filter(passt);
  return wpick(pool, c => { const s = stand(prog, c); return 1 + (s.w > 0 ? 3 : 0) + (s.b <= 1 ? 2 : 0); });
}

/* Ablenker: erst aus demselben Thema, dann aus dem Lernfeld */
export function ablenker(karten, c, n = 3){
  let gleich = karten.filter(x => x.l === c.l && x.t === c.t && x !== c && x.n !== c.n);
  if (gleich.length < n) gleich = gleich.concat(shuffle(karten.filter(x => x.l === c.l && x.t !== c.t)).slice(0, n - gleich.length));
  return shuffle(gleich).slice(0, n);
}

/* Fragetyp: je besser eine Karte sitzt, desto öfter muss sie eingetippt werden. Lange Begriffe tippt am Handy niemand gern. */
export const begriff = c => c.n.replace(/\s*\(.*?\)\s*/g, '').trim();
export function fragetyp(prog, c, boss){
  const b = stand(prog, c).b, tippbar = begriff(c).length <= 24;
  if (boss) return b >= 2 && tippbar ? 'tippen' : pick(['begriff', 'definition']);
  const wahl = b <= 1 ? ['begriff', 'begriff', 'definition'] : b <= 3 ? ['begriff', 'definition', 'tippen'] : ['tippen', 'tippen', 'definition'];
  const t = pick(wahl);
  return t === 'tippen' && !tippbar ? 'begriff' : t;
}

/* ---------- Kürzel aus den Katakomben ----------
   Eine Kürzel-Karte hat n (das Kürzel), lang (die Langform), d (was dahintersteckt), r (Seltenheit) und manchmal j (Spaß-Langform).
   Drei Fragen: langform (Kürzel steht da, Langform wählen), erklaerung (Erklärung steht da, Kürzel wählen),
   tippen (Langform steht da, Kürzel eintippen). Die Antworten sind hier Texte, keine Kartenkennungen. */
export const KATAKOMBEN = 13;
export const istKuerzel = c => c.lang !== undefined;
/* Seltene Kürzel bringen mehr Seelen */
export const SELTEN_SEELEN = { 1: 1, 2: 1.2, 3: 1.6 };
export function kuerzelTyp(prog, c, boss, zwang){
  if (zwang) return zwang;
  const b = stand(prog, c).b;
  if (boss) return b >= 2 ? 'tippen' : pick(['langform', 'erklaerung']);
  return pick(b <= 1 ? ['langform', 'langform', 'erklaerung'] : b <= 3 ? ['langform', 'erklaerung', 'tippen'] : ['tippen', 'tippen', 'langform']);
}
const mischen = (liste, richtig) => { const optionen = shuffle(liste); return { optionen, ok: optionen.indexOf(richtig) }; };

/* Falsche Langformen wie in der Abkürzungsjagd: ein Wort gegen ein echtes Fachwort mit demselben Anfangsbuchstaben tauschen.
   Die Buchstaben passen dann immer noch zum Kürzel, genau das ist die Falle. */
const FUELL = new Set('of the and for to a on as in by der die das den und für mit von per gegen'.split(' '));
const wortkern = w => w.replace(/[,()]/g, '');
const WORTSCHATZ = new WeakMap();
function wortschatz(kuerzel){
  if (!WORTSCHATZ.has(kuerzel)) {
    const woerter = new Map(), echt = new Set(kuerzel.map(x => x.lang.toLowerCase()));
    for (const x of kuerzel) for (const w of x.lang.split(/\s+/)) {
      const k = wortkern(w);
      if (k.length < 3 || FUELL.has(k.toLowerCase()) || /[-äöüß]/.test(k)) continue;
      if (!woerter.has(k[0])) woerter.set(k[0], new Set());
      woerter.get(k[0]).add(k);
    }
    WORTSCHATZ.set(kuerzel, { woerter, echt });
  }
  return WORTSCHATZ.get(kuerzel);
}
function vertauscht(kuerzel, c, n){
  const { woerter, echt } = wortschatz(kuerzel), ws = c.lang.split(/(\s+)/);
  if (ws.filter(w => w.trim() && !FUELL.has(wortkern(w).toLowerCase())).length < 2) return [];
  const stellen = ws.map((w, i) => i).filter(i => { const k = wortkern(ws[i]); return k.length >= 3 && !FUELL.has(k.toLowerCase()) && woerter.has(k[0]) && woerter.get(k[0]).size > 1; });
  const out = new Set();
  for (let t = 0; t < 40 && out.size < n && stellen.length; t++) {
    const i = pick(stellen), k = wortkern(ws[i]), andere = [...woerter.get(k[0])].filter(o => o !== k && o.length >= k.length / 2 && o.length <= k.length * 2);
    if (!andere.length) continue;
    const kopie = ws.slice(); kopie[i] = ws[i].replace(k, pick(andere));
    const s = kopie.join('');
    if (!echt.has(s.toLowerCase())) out.add(s);
  }
  return [...out];
}
/* Vier Langformen: die echte, vertauschte, aufgefüllt mit ähnlichen echten; die Spaß-Langform nur manchmal */
export function langformOptionen(kuerzel, c){
  const opts = [c.lang], spass = c.j && Math.random() < 0.5, ziel = spass ? 3 : 4;
  for (const v of shuffle(vertauscht(kuerzel, c, 4))) if (opts.length < ziel && !opts.includes(v)) opts.push(v);
  const worte = s => s.split(/\s+/).length;
  const aehnlich = o => (o.t === c.t ? 2 : 0) + (worte(o.lang) === worte(c.lang) ? 1 : 0) + (o.n[0].toUpperCase() === c.n[0].toUpperCase() ? 1 : 0) + Math.random();
  for (const o of kuerzel.filter(o => o !== c).map(o => [aehnlich(o), o]).sort((a, b) => b[0] - a[0]).map(p => p[1])) {
    if (opts.length >= ziel) break;
    if (!opts.includes(o.lang)) opts.push(o.lang);
  }
  if (spass) opts.push(c.j);
  return mischen(opts, c.lang);
}
/* Vier Kürzel zu einer Erklärung: lieber aus derselben Kategorie und mit demselben Anfangsbuchstaben */
export function kuerzelOptionen(kuerzel, c){
  const aehnlich = o => (o.t === c.t ? 2 : 0) + (o.n[0].toUpperCase() === c.n[0].toUpperCase() ? 1 : 0) + (Math.abs(o.n.length - c.n.length) <= 1 ? 1 : 0) + Math.random() * 1.5;
  const andere = kuerzel.filter(o => o !== c && o.n.toLowerCase() !== c.n.toLowerCase()).map(o => [aehnlich(o), o]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(p => p[1].n);
  return mischen([c.n].concat(andere), c.n);
}
/* Welche Buchstaben der Langform das Kürzel bilden: möglichst viele treffen, Wortanfänge bevorzugen. Liefert die Stellen. */
export function kuerzelStellen(kuerzel, lang){
  const L = lang.split(''), n = L.length;
  const buchstaben = kuerzel.split('').filter(z => /[A-Za-zÄÖÜäöü0-9]/.test(z)).map(z => z.toLowerCase());
  const anfang = i => i === 0 || /[\s\-\/(,]/.test(L[i - 1]) || (L[i] !== L[i].toLowerCase() && /[a-zäöü]/.test(L[i - 1]));
  const memo = new Map();
  const best = (k, p) => {
    if (k === buchstaben.length) return { s: 0, weg: [] };
    const key = k * 1000 + p;
    if (memo.has(key)) return memo.get(key);
    let res = best(k + 1, p);
    for (let i = p; i < n; i++) if (L[i].toLowerCase() === buchstaben[k]) {
      const r = best(k + 1, i + 1), s = r.s + 10 + (anfang(i) ? 3 : 0);
      if (s > res.s) res = { s, weg: [i].concat(r.weg) };
    }
    memo.set(key, res);
    return res;
  };
  return new Set(best(0, 0).weg);
}
/* In der Erklärung das Kürzel selbst verdecken, sonst verrät die Frage die Antwort ("Projekt hinter der OWASP Top 10", "aktuell WPA3") */
export const verdeckt = c => c.d.replace(new RegExp('(^|[^A-Za-zÄÖÜäöü])' + c.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[0-9]*(?![A-Za-zÄÖÜäöü0-9])', 'gi'), '$1…');

/* ---------- Eingetippte Antworten ---------- */
export const norm = s => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[\s\-_.\/,:;'"„“]/g, '');
export function lev(a, b){
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
/* 'ok', 'tippfehler' (zählt), 'falsch' oder 'leer' */
export function pruefeEingabe(c, eingabe){
  const x = norm(eingabe);
  if (!x) return 'leer';
  const formen = [c.n].concat(c.a || []).map(norm).filter(Boolean);
  if (formen.includes(x)) return 'ok';
  for (const f of formen) if (f.length >= 6 && lev(x, f) <= (f.length >= 12 ? 2 : 1)) return 'tippfehler';
  return 'falsch';
}

/* ---------- Leben, Seelen, Stufen ---------- */
export const maxLeben = stufe => Math.min(200, 100 + 5 * (stufe - 1));
export const stufenPreis = stufe => Math.round(60 * Math.pow(1.15, stufe - 1));
export const FLAKON = 45, FLAKON_MAX = 5, ROESTUNG = 10, ROESTUNG_MAX = 6, BOSS_TREFFER = 5, FEUER_ZUM_TOR = 3;
/* Ist der Flakon-Vorrat voll, macht jeder weitere Boss den Kaffee stärker: +10 Leben je Röstung */
export const heilung = roestung => FLAKON + ROESTUNG * (roestung || 0);
export const bossSeelen = akt => akt === 2 ? 250 : 150;
/* Neues Spiel+: Seelen und Schaden wachsen mit jedem Durchgang */
export const ngSeelen = ng => 1 + 0.5 * (ng || 0);
export const ngSchaden = ng => 1 + 0.25 * (ng || 0);
/* Fach vor der Antwort: wer eine Karte schon konnte, bekommt mehr Seelen, und ein Fehler tut mehr weh.
   Am Berg (AP2) ist alles eine Stufe härter und bringt anderthalbmal so viele Seelen. */
export const seelenFuer = (fachVorher, boss, akt = 1, ng = 0) =>
  Math.round((10 + 5 * Math.max(0, fachVorher - 1) + (boss ? 15 : 0)) * (akt === 2 ? 1.5 : 1) * ngSeelen(ng));
export const schadenFuer = (fachVorher, boss, akt = 1, ng = 0) =>
  Math.round(((boss ? 35 : fachVorher >= 3 ? 30 : 20) + (akt === 2 ? 5 : 0)) * ngSchaden(ng));
