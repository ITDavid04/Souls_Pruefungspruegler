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

/* Bosskarte: aus den Lernfeldern der Phase, schwache Karten öfter, nicht die letzten sechs */
export function bossKarte(karten, prog, lfs, zuletzt){
  let pool = karten.filter(c => lfs.includes(c.l) && !zuletzt.includes(c.i));
  if (!pool.length) pool = karten.filter(c => lfs.includes(c.l));
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
