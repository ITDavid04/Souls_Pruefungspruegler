/* Rätsel ohne Oberfläche: Rechengegner (Subnetze, Routing, VLAN, IPv6), Botschaften (einen falschen Rechenschritt finden),
   die Mimic-Truhe (Logikgatter) und Restore (Datensicherung zurückspielen).
   Viele Aufgaben würfelt ein Generator, dazu kommen die handverlesenen aus der Subnetz-Klappuhr.
   Ein Rätsel ist ein schlichtes Objekt ohne Funktionen, damit es im Spielstand liegen kann (auch als Blutfleck).
     art       rechnen, botschaft, mimic oder restore
     thema     steht oben rechts auf der Karte
     frage     HTML aus diesem Modul (nie aus Eingaben)
     felder    [{ label, art, soll }]   art: ip, zahl, praefix, v6kurz, v6voll, iid
     wahl      { optionen, richtig: [Index], mehrere }
     zusatz    'routing' oder 'vlan': die Routingtabelle oder der VLAN-Aufbau stehen mit auf der Karte
     zeilen, falsch, folge   bei Botschaften: der Rechenweg, die erste falsche Zeile, Folgefehler
     erklaerung              HTML, steht nach der Antwort da */
import { rnd, pick, wpick } from './kern.js';

const zahl = n => Number(n).toLocaleString('de-DE');
const hoch = (b, e) => b + '<sup>' + e + '</sup>';
const ORD = ['ersten', 'zweiten', 'dritten', 'vierten'];

/* ---------- IPv4 ---------- */
export const ipZahl = s => {
  const p = String(s).trim().replace(/,/g, '.').split('.');
  if (p.length !== 4) return null;
  let n = 0;
  for (const x of p) { if (!/^\d{1,3}$/.test(x) || +x > 255) return null; n = n * 256 + +x; }
  return n >>> 0;
};
export const ipText = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');
const maske = p => p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0;
const netz = (ip, p) => (ip & maske(p)) >>> 0;
const bcast = (ip, p) => (netz(ip, p) | (~maske(p) >>> 0)) >>> 0;
const oktett = (n, i) => (n >>> (24 - 8 * i)) & 255;
function privatIp(){
  const f = rnd(3);
  if (f === 0) return ipZahl('192.168.' + rnd(256) + '.' + rnd(256));
  if (f === 1) return ipZahl('10.' + rnd(256) + '.' + rnd(256) + '.' + rnd(256));
  return ipZahl('172.' + (16 + rnd(16)) + '.' + rnd(256) + '.' + rnd(256));
}
/* Eine Adresse, die weder Netz-ID noch Broadcast ist */
function rechnerIp(p){
  for (;;) { const ip = privatIp(); if (ip !== netz(ip, p) && ip !== bcast(ip, p)) return ip; }
}
/* Das angeschnittene Oktett: Index, Maskenwert, Blockgröße, Wert der Adresse dort, Anfang des Päckchens */
function schnitt(ip, p){
  const i = Math.min(3, Math.floor(p / 8)), mw = oktett(maske(p), i), block = 256 - mw, v = oktett(ip, i);
  return { i, mw, block, v, start: v - v % block };
}
function rechenweg(ip, p){
  const n = netz(ip, p), b = bcast(ip, p), h = 32 - p, s = schnitt(ip, p);
  const ende = 'Netz-ID ' + ipText(n) + ', Broadcast ' + ipText(b) + ', ' + hoch(2, h) + ' − 2 = ' + zahl(2 ** h - 2) + ' Rechner.';
  if (p % 8 === 0) return 'Bei /' + p + ' sind ' + p / 8 + ' Oktette fest, der Rest ist frei. ' + ende;
  return '/' + p + ' heißt ' + ipText(maske(p)) + '. Im ' + ORD[s.i] + ' Oktett steht ' + s.mw + ', Blockgröße 256 − ' + s.mw + ' = ' + s.block + '. ' +
    s.v + ' liegt im Päckchen ' + s.start + ' bis ' + (s.start + s.block - 1) + '. ' + ende;
}

function ipv4Netz(gross){
  const p = gross ? 16 + rnd(8) : wpick([24, 25, 26, 27, 28, 29, 30], p => p === 24 ? 1 : 2), ip = rechnerIp(p), h = 32 - p;
  return {
    art: 'rechnen', thema: 'IPv4',
    frage: 'Für <code>' + ipText(ip) + '/' + p + '</code>: Netz-ID, Broadcast und Anzahl nutzbarer Rechner?',
    felder: [
      { label: 'Netz-ID', art: 'ip', soll: ipText(netz(ip, p)) },
      { label: 'Broadcast', art: 'ip', soll: ipText(bcast(ip, p)) },
      { label: 'Rechner', art: 'zahl', soll: String(2 ** h - 2) }
    ],
    erklaerung: rechenweg(ip, p)
  };
}
const ARTEN_ADRESSE = ['Ein Rechner (Host)', 'Die Netz-ID', 'Der Broadcast'];
function ipv4Art(){
  const p = pick([24, 25, 26, 27, 28, 29]), basis = privatIp(), n = netz(basis, p), b = bcast(basis, p), art = rnd(3);
  let ip = art === 1 ? n : art === 2 ? b : n + 1 + rnd(b - n - 1);
  /* Die Falle aus der Klappuhr: bei /24 sind .63 und .64 ganz normale Rechner */
  if (p === 24 && art === 0) ip = (n | pick([63, 64, 127, 128, 191, 192])) >>> 0;
  const s = schnitt(ip, p);
  return {
    art: 'rechnen', thema: 'IPv4',
    frage: 'Was ist <code>' + ipText(ip) + '/' + p + '</code>?',
    wahl: { optionen: ARTEN_ADRESSE, richtig: [art] },
    erklaerung: (p === 24 ? 'Bei /24 ist das ganze letzte Oktett frei, von 0 bis 255. '
      : 'Blockgröße 256 − ' + s.mw + ' = ' + s.block + '. ' + s.v + ' liegt im Päckchen ' + s.start + ' bis ' + (s.start + s.block - 1) + '. ') +
      'Die erste Adresse ist die Netz-ID, die letzte der Broadcast, alles dazwischen sind Rechner. <b>Frag nicht, was eine Adresse ist, frag, wozu sie gehört.</b>'
  };
}
function ipv4Direkt(){
  const p = pick([25, 26, 27, 28]), block = 2 ** (32 - p), basis = netz(privatIp(), 24);
  const grenze = basis + block * (1 + rnd(256 / block - 1));
  const a = grenze - 2 - rnd(Math.min(block - 3, 4));
  const gleich = Math.random() < 0.5;
  let b = gleich ? grenze - block + 1 + rnd(block - 3) : grenze + 1 + rnd(Math.min(block - 2, 5));
  if (b === a) b = a - 1;
  const sa = schnitt(a, p), sb = schnitt(b, p);
  return {
    art: 'rechnen', thema: 'IPv4',
    frage: '<code>' + ipText(a) + '/' + p + '</code> will an <code>' + ipText(b) + '/' + p + '</code> senden. Geht das direkt?',
    wahl: { optionen: ['Ja, gleiches Netz', 'Nein, über den Router'], richtig: [gleich ? 0 : 1] },
    erklaerung: 'Blockgröße ' + block + '. ' + sa.v + ' liegt im Päckchen ' + sa.start + ' bis ' + (sa.start + block - 1) + ', ' + sb.v + ' im Päckchen ' + sb.start + ' bis ' + (sb.start + block - 1) + '. ' +
      (gleich ? 'Gleiches Netz, der Absender stellt direkt zu.' : 'Zwei verschiedene Netze, der Absender gibt das Paket an sein Gateway.')
  };
}
function maskenWeg(p){
  const voll = Math.floor(p / 8), rest = p % 8, bits = [128, 64, 32, 16, 8, 4, 2, 1].slice(0, rest);
  return '/' + p + ' heißt ' + p + ' Einsen von links: ' + voll + (voll === 1 ? ' volles Oktett' : ' volle Oktette') + ' mit 255' +
    (rest ? ', dazu ' + rest + (rest === 1 ? ' Eins' : ' Einsen') + ' im nächsten Oktett: ' + bits.join(' + ') + ' = ' + bits.reduce((x, y) => x + y, 0) : '') + '. Ergibt ' + ipText(maske(p)) + '.';
}
function ipv4Maske(){
  const p = 17 + rnd(14);
  if (Math.random() < 0.5) return { art: 'rechnen', thema: 'IPv4', frage: 'Schreib <code>/' + p + '</code> als Subnetzmaske.', felder: [{ label: 'Maske', art: 'ip', soll: ipText(maske(p)) }], erklaerung: maskenWeg(p) };
  return { art: 'rechnen', thema: 'IPv4', frage: 'Welches Präfix hat die Maske <code>' + ipText(maske(p)) + '</code>?', felder: [{ label: 'Präfix', art: 'praefix', soll: String(p) }], erklaerung: maskenWeg(p) };
}
function ipv4Planung(){
  const gross = Math.random() < 0.4, basisP = gross ? 16 : 24, n = gross ? 5 + rnd(300) : 3 + rnd(38);
  const bits = Math.ceil(Math.log2(n)), np = basisP + bits, h = 32 - np;
  const basis = gross ? '172.' + (16 + rnd(16)) + '.0.0' : '192.168.' + rnd(256) + '.0';
  return {
    art: 'rechnen', thema: 'IPv4',
    frage: 'Das Netz <code>' + basis + '/' + basisP + '</code> soll in <b>' + n + ' gleich große Subnetze</b> geteilt werden. Neues Präfix und Rechner je Subnetz?',
    felder: [{ label: 'Neues Präfix', art: 'praefix', soll: String(np) }, { label: 'Rechner je Subnetz', art: 'zahl', soll: String(2 ** h - 2) }],
    erklaerung: n + ' Subnetze brauchen ' + bits + ' Bit' + (2 ** bits === n ? ', ' + hoch(2, bits) + ' = ' + n + ' passt genau' : ', denn ' + hoch(2, bits - 1) + ' = ' + 2 ** (bits - 1) + ' ist zu wenig und ' + hoch(2, bits) + ' = ' + 2 ** bits + ' reicht') +
      '. /' + basisP + ' + ' + bits + ' = /' + np + '. Für Rechner bleiben ' + h + ' Bit: ' + hoch(2, h) + ' − 2 = ' + zahl(2 ** h - 2) + '.'
  };
}

/* ---------- Botschaften: ein Gefallener hat gerechnet, genau eine Zeile ist falsch ---------- */
function botschaftIpv4(gross){
  const p = gross ? 17 + rnd(7) : 25 + rnd(6), ip = rechnerIp(p), n = netz(ip, p), b = bcast(ip, p), h = 32 - p, s = schnitt(ip, p);
  const zeilen = [
    'Maske: /' + p + ' = ' + ipText(maske(p)),
    'Blockgröße im ' + ORD[s.i] + ' Oktett: 256 − ' + s.mw + ' = ' + s.block,
    'Netz-ID: ' + ipText(n),
    'Broadcast: ' + ipText(b),
    'Nutzbare Rechner: ' + hoch(2, h) + ' − 2 = ' + zahl(2 ** h - 2)
  ];
  const fehler = [];
  const nachbar = p + (p >= 30 || Math.random() < 0.5 ? -1 : 1);
  fehler.push([0, 'Maske: /' + p + ' = ' + ipText(maske(nachbar)), 'Die Maske stimmt nicht: /' + p + ' ist <b>' + ipText(maske(p)) + '</b>. ' + ipText(maske(nachbar)) + ' wäre /' + nachbar + '.']);
  if (s.block <= 64) fehler.push([1, 'Blockgröße im ' + ORD[s.i] + ' Oktett: 256 − ' + s.mw + ' = ' + s.block * 2, 'Verrechnet: 256 − ' + s.mw + ' ist <b>' + s.block + '</b>.']);
  if (s.i === 3 && s.start !== 0) {
    const null_ = netz(ip, 24);
    fehler.push([2, 'Netz-ID: ' + ipText(null_), 'Klassischer Reflex: Die Netz-ID auf .0 gesetzt. ' + s.v + ' liegt aber im Päckchen ' + s.start + ' bis ' + (s.start + s.block - 1) + ', die Netz-ID ist <b>' + ipText(n) + '</b>. Die übrigen Zeilen stimmen.']);
  }
  fehler.push([2, 'Netz-ID: ' + ipText(n + 1), ipText(n + 1) + ' ist der erste Rechner. Die Netz-ID ist die erste Adresse des Päckchens: <b>' + ipText(n) + '</b>.']);
  fehler.push([3, 'Broadcast: ' + ipText(b + 1), 'Eins zu weit: ' + ipText(b + 1) + ' ist schon die Netz-ID des nächsten Päckchens. Der Broadcast ist <b>' + ipText(b) + '</b>.']);
  fehler.push([4, 'Nutzbare Rechner: ' + hoch(2, h) + ' = ' + zahl(2 ** h), 'Netz-ID und Broadcast sind keine Rechner: ' + hoch(2, h) + ' − 2 = <b>' + zahl(2 ** h - 2) + '</b>.']);
  const [falsch, zeile, erklaerung] = pick(fehler);
  zeilen[falsch] = zeile;
  return { art: 'botschaft', thema: 'IPv4', intro: 'Aufgabe: Netzdaten für <code>' + ipText(ip) + '/' + p + '</code>.', zeilen, falsch, folge: [], erklaerung };
}

/* ---------- IPv6 ---------- */
const V6 = {
  lesen(s){
    s = String(s).trim().toLowerCase();
    if (!/^[0-9a-f:]+$/.test(s)) return null;
    const teile = s.split('::');
    if (teile.length > 2) return 'doppelt';
    const l = teile[0] ? teile[0].split(':') : [], r = teile.length === 2 && teile[1] ? teile[1].split(':') : [];
    if (teile.length === 1 && l.length !== 8) return null;
    if (teile.length === 2 && l.length + r.length > 7) return null;
    const alle = l.concat(Array(teile.length === 2 ? 8 - l.length - r.length : 0).fill('0'), r);
    if (alle.some(g => !/^[0-9a-f]{1,4}$/.test(g))) return null;
    return { gruppen: alle.map(g => g.padStart(4, '0')) };
  },
  /* Kürzen nach RFC 5952: führende Nullen weg, die längste Kette aus mindestens zwei Nullgruppen (bei Gleichstand die erste) wird :: */
  kurz(gruppen){
    let bs = -1, bl = 0;
    for (let i = 0; i < 8;) {
      if (gruppen[i] === '0000') { let j = i; while (j < 8 && gruppen[j] === '0000') j++; if (j - i > bl && j - i >= 2) { bs = i; bl = j - i; } i = j; } else i++;
    }
    const g = gruppen.map(x => x.replace(/^0+(?=.)/, ''));
    return bs < 0 ? g.join(':') : g.slice(0, bs).join(':') + '::' + g.slice(bs + bl).join(':');
  },
  voll: gruppen => gruppen.join(':')
};
const hex = (n, stellen) => n.toString(16).padStart(stellen, '0');
function v6Gruppen(){
  if (Math.random() < 0.3) return ['fe80', '0000', '0000', '0000'].concat(Array.from({ length: 4 }, () => hex(rnd(65536), 4)));
  const g = ['2001', '0db8'].concat(Array.from({ length: 6 }, () => Math.random() < 0.35 ? hex(rnd(256), 4) : hex(rnd(65536), 4)));
  const s = 2 + rnd(4), l = 2 + rnd(Math.min(3, 8 - s - 1));
  for (let i = s; i < s + l; i++) g[i] = '0000';
  if (Math.random() < 0.4) { const e = pick([2, 3, 4, 5, 6, 7].filter(i => i < s - 1 || i > s + l)); if (e !== undefined) g[e] = '0000'; }
  return g;
}
function v6Kurz(){
  const g = v6Gruppen(), k = V6.kurz(g);
  return {
    art: 'rechnen', thema: 'IPv6',
    frage: 'Kürze so weit wie möglich: <code>' + V6.voll(g) + '</code>',
    felder: [{ label: 'Gekürzt', art: 'v6kurz', soll: k }],
    erklaerung: 'Erst die führenden Nullen jeder Gruppe weg, dann die längste Kette aus Nullgruppen zu ::. Das geht nur einmal, eine einzelne Nullgruppe bleibt als 0 stehen. Ergibt <b>' + k + '</b>.'
  };
}
function v6Voll(){
  const g = v6Gruppen(), k = V6.kurz(g), links = k.includes('::') ? k.split('::')[0] : '', rechts = k.includes('::') ? k.split('::')[1] : '';
  const da = (links ? links.split(':').length : 0) + (rechts ? rechts.split(':').length : 0);
  return {
    art: 'rechnen', thema: 'IPv6',
    frage: 'Klappe vollständig auf, alle 32 Ziffern: <code>' + k + '</code>',
    felder: [{ label: 'Ausgeschrieben', art: 'v6voll', soll: V6.voll(g) }],
    erklaerung: (k.includes('::') ? da + ' Gruppen stehen da, :: steht also für ' + (8 - da) + ' Nullgruppen. ' : '') + 'Jede Gruppe vorne mit Nullen auf vier Ziffern auffüllen: <b>' + V6.voll(g) + '</b>.'
  };
}
function v6Planung(){
  if (Math.random() < 0.4) {
    const p = pick([48, 52, 56, 60]);
    return { art: 'rechnen', thema: 'IPv6', frage: 'Wie viele /64-Netze stecken in einem <code>/' + p + '</code>?', felder: [{ label: 'Anzahl', art: 'zahl', soll: String(2 ** (64 - p)) }],
      erklaerung: (64 - p) + ' Bit Unterschied: ' + hoch(2, 64 - p) + ' = <b>' + zahl(2 ** (64 - p)) + '</b>.' };
  }
  const n = 3 + rnd(298), bits = Math.ceil(Math.log2(n)), basis = '2001:db8:' + rnd(65536).toString(16) + '::/48';
  return {
    art: 'rechnen', thema: 'IPv6',
    frage: 'Sie haben <code>' + basis + '</code> und brauchen <b>' + n + ' Subnetze</b>. Welches Präfix bekommen die Subnetze?',
    felder: [{ label: 'Neues Präfix', art: 'praefix', soll: String(48 + bits) }],
    erklaerung: n + ' Subnetze brauchen ' + bits + ' Bit' + (2 ** bits === n ? '' : ', denn ' + hoch(2, bits - 1) + ' = ' + 2 ** (bits - 1) + ' ist zu wenig') + '. Subnetze sind kleiner, das Präfix wird länger: /48 + ' + bits + ' = <b>/' + (48 + bits) + '</b>.' +
      (bits % 4 === 0 ? ' Das sind genau ' + bits / 4 + (bits === 4 ? ' Hex-Stelle.' : ' Hex-Stellen.') : '')
  };
}
function eui64(){
  const b = [rnd(64) * 4].concat(Array.from({ length: 5 }, () => rnd(256))), H = n => hex(n, 2);
  const mac = b.map(x => H(x).toUpperCase()).join(':'), erst = b[0] ^ 2;
  const iid = [H(erst) + H(b[1]), H(b[2]) + 'ff', 'fe' + H(b[3]), H(b[4]) + H(b[5])].join(':');
  return {
    art: 'rechnen', thema: 'IPv6',
    frage: 'EUI-64: Welche Interface-ID entsteht aus der MAC <code>' + mac + '</code>?',
    felder: [{ label: 'Interface-ID (4 Gruppen)', art: 'iid', soll: iid }],
    erklaerung: 'Aufschneiden: ' + b.slice(0, 3).map(H).join(':').toUpperCase() + ' | FF:FE | ' + b.slice(3).map(H).join(':').toUpperCase() +
      '. Dann das siebte Bit des ersten Bytes umdrehen: ' + H(b[0]).toUpperCase() + ' wird ' + H(erst).toUpperCase() + '. Ergibt <b>' + iid + '</b>.'
  };
}

/* ---------- Handverlesen aus der Subnetz-Klappuhr ---------- */
const F = (frage, felder, erklaerung, thema = 'IPv4', zusatz) => ({ art: 'rechnen', thema, frage, felder: felder.map(([label, art, soll]) => ({ label, art, soll })), erklaerung, zusatz });
const W = (frage, optionen, richtig, erklaerung, thema = 'IPv4', zusatz, mehrere = false) => ({ art: 'rechnen', thema, frage, wahl: { optionen, richtig, mehrere }, erklaerung, zusatz });
const B = (intro, zeilen, falsch, erklaerung, thema = 'IPv4', zusatz, folge = []) => ({ art: 'botschaft', thema, intro, zeilen, falsch, folge, erklaerung, zusatz });
const TUEREN = ['Internet', 'eth0', 'eth1', 'eth2', 'eth3', 'eth4', 'eth5'];
const pcs = ohne => [1, 2, 3, 4, 5, 6, 7, 8].filter(n => n !== ohne).map(n => 'PC ' + n);
const pcIndex = (ohne, liste) => liste.map(n => [1, 2, 3, 4, 5, 6, 7, 8].filter(x => x !== ohne).indexOf(n));

const FEST = {
  ipv4: [
    F('Für <code>192.168.10.77/24</code>: Netz-ID, Broadcast und Anzahl nutzbarer Rechner?', [['Netz-ID', 'ip', '192.168.10.0'], ['Broadcast', 'ip', '192.168.10.255'], ['Rechner', 'zahl', '254']],
      'Drei Oktette fest, das letzte frei: Netz-ID .0, Broadcast .255, dazwischen 254 Rechner.'),
    F('Für <code>192.168.1.60/26</code>: Netz-ID, Broadcast und Anzahl Rechner?', [['Netz-ID', 'ip', '192.168.1.0'], ['Broadcast', 'ip', '192.168.1.63'], ['Rechner', 'zahl', '62']],
      'Blockgröße 256 − 192 = 64. Die 60 liegt im Päckchen 0 bis 63. Erste Zahl Netz-ID, letzte Broadcast, 64 − 2 = 62 Rechner.'),
    F('Für <code>192.168.1.130/26</code>: Netz-ID und Broadcast?', [['Netz-ID', 'ip', '192.168.1.128'], ['Broadcast', 'ip', '192.168.1.191']],
      'Die Päckchen sind 0 bis 63, 64 bis 127, 128 bis 191, 192 bis 255. 130 liegt im dritten, die Netz-ID endet hier also nicht auf .0.'),
    F('Für <code>10.0.5.9/30</code>, ein typisches Netz zwischen zwei Routern: Netz-ID, Broadcast, Anzahl Rechner?', [['Netz-ID', 'ip', '10.0.5.8'], ['Broadcast', 'ip', '10.0.5.11'], ['Rechner', 'zahl', '2']],
      '/30 heißt Blockgröße 4. Die 9 liegt im Päckchen 8 bis 11. Von vier Adressen sind nur zwei nutzbar, genau richtig für zwei Router.'),
    W('Was ist <code>172.16.0.63/26</code>?', ARTEN_ADRESSE, [2], 'Das erste Päckchen geht von 0 bis 63. Die letzte Adresse ist der Broadcast.'),
    W('Und <code>172.16.0.64/26</code>?', ARTEN_ADRESSE, [1], 'Mit 64 beginnt ein neues Päckchen. Die erste Adresse ist dessen Netz-ID.'),
    W('Gleiche Zahl, andere Maske: Was ist <code>172.16.0.63/24</code>?', ARTEN_ADRESSE, [0], 'Bei /24 ist .63 ein ganz normaler Rechner. <b>Frag nicht, was eine Adresse ist, frag, wozu sie gehört.</b> Die Maske entscheidet.'),
    F('Etwas größer: <code>172.20.37.200/20</code>. Netz-ID, Broadcast und Anzahl Rechner?', [['Netz-ID', 'ip', '172.20.32.0'], ['Broadcast', 'ip', '172.20.47.255'], ['Rechner', 'zahl', '4094']],
      '/20 endet im dritten Oktett, die Maske steht dort auf 240, Blockgröße 16: 37 liegt in 32 bis 47. Netz-ID 172.20.32.0, Broadcast 172.20.47.255. 12 freie Bit: ' + hoch(2, 12) + ' − 2 = 4094.'),
    W('<code>192.168.5.62/27</code> will an <code>192.168.5.66/27</code> senden. Geht das direkt?', ['Ja, gleiches Netz', 'Nein, über den Router'], [1],
      '/27 heißt Blockgröße 32. Päckchen 32 bis 63 und 64 bis 95: zwei verschiedene Netze. Der Absender gibt das Paket an sein Gateway.')
  ],
  ipv4Botschaft: [
    B('Aufgabe: Netzdaten für <code>192.168.1.100/26</code>.', ['Blockgröße: 256 − 192 = 64', 'Netz-ID: 192.168.1.0', 'Broadcast: 192.168.1.127', 'Erster Rechner: 192.168.1.65'], 1,
      '100 liegt in 64 bis 127, die Netz-ID ist <b>192.168.1.64</b>. Klassischer Reflex: .0 hinschreiben. Die übrigen Zeilen passen zu .64.'),
    B('Aufgabe: Adressbereich für <code>10.1.1.0/30</code>.', ['Blockgröße: 4', 'Netz-ID: 10.1.1.0', 'Nutzbare Rechner: 10.1.1.0 bis 10.1.1.3', 'Broadcast: 10.1.1.3'], 2,
      'Nutzbar sind nur <b>10.1.1.1 und 10.1.1.2</b>. .0 ist die Netz-ID, .3 der Broadcast.'),
    B('Aufgabe: Netzdaten für <code>192.168.0.0/23</code>.', ['Maske: 255.255.254.0', 'Im dritten Oktett Blockgröße 2: Das Netz umfasst 192.168.0.x und 192.168.1.x', 'Broadcast: 192.168.0.255', 'Rechner: ' + hoch(2, 9) + ' − 2 = 510'], 2,
      'Der Broadcast ist die letzte Adresse des ganzen Päckchens: <b>192.168.1.255</b>. 192.168.0.255 ist hier ein ganz normaler Rechner.'),
    B('Aufgabe: Wie viele Rechner passen in <code>192.168.3.0/25</code>?', ['Maske: 255.255.255.128', 'Freie Bit: 32 − 25 = 7', 'Rechner: ' + hoch(2, 7) + ' = 128', 'Broadcast: 192.168.3.127'], 2,
      hoch(2, 7) + ' = 128 Adressen, davon Netz-ID und Broadcast abziehen: <b>126 Rechner</b>.')
  ],
  router: [
    W('Ein Paket an <code>10.20.3.70</code> kommt an. Durch welche Tür geht es raus?', TUEREN, [6], 'Passt auf /0, /8, /16, /24 und 10.20.3.64/26. Die längste Maske gewinnt: eth5.', 'Routing', 'routing'),
    W('Ziel <code>10.20.3.10</code>. Welche Tür?', TUEREN, [5], '10 liegt im Päckchen 10.20.3.0/26, Büro Technik: eth4.', 'Routing', 'routing'),
    W('Ziel <code>10.20.3.200</code>. Welche Tür?', TUEREN, [4], 'Die beiden Büros decken nur 0 bis 127 ab. Genauester Treffer ist Etage 3 (/24): eth3.', 'Routing', 'routing'),
    W('Ziel <code>10.20.99.1</code>. Welche Tür?', TUEREN, [2], 'Nicht Etage 3, aber Standort Berlin (/16) passt: eth1.', 'Routing', 'routing'),
    W('Ziel <code>10.30.1.1</code>. Welche Tür?', TUEREN, [3], '10.30.x.x ist Standort Hamburg (/16): eth2.', 'Routing', 'routing'),
    W('Ziel <code>10.99.0.1</code>. Welche Tür?', TUEREN, [1], 'Kein Standort passt, nur das Firmennetz 10.0.0.0/8 (und /0). Die längere Maske gewinnt: eth0.', 'Routing', 'routing'),
    W('Ziel <code>8.8.8.8</code>. Welche Tür?', TUEREN.concat('Paket wird verworfen'), [0], 'Nur 0.0.0.0/0 passt, der Notausgang ins Internet.', 'Routing', 'routing')
  ],
  routerBotschaft: [
    B('Ziel <code>10.20.3.70</code>, Tabelle wie oben.', ['0.0.0.0/0 passt', '10.20.3.0/24 passt', '10.20.3.64/26 passt', 'Mehrere passen, also gewinnt die erste passende Zeile der Tabelle: Internet'], 3,
      'Es gewinnt nicht die erste, sondern die <b>längste Maske</b>: 10.20.3.64/26, also eth5.', 'Routing', 'routing'),
    B('Ziel <code>10.20.3.70</code>, Tabelle wie oben.', ['Maske /26 = 255.255.255.192', '10.20.3.70 UND 255.255.255.192 = 10.20.3.0', 'Also passt Büro Technik (10.20.3.0/26), Ausgang eth4'], 1,
      '70 liegt im Päckchen 64 bis 127, das Ergebnis ist <b>10.20.3.64</b>. Zeile 3 ist nur ein Folgefehler, richtig wäre Büro Verwaltung, eth5.', 'Routing', 'routing', [2]),
    B('Ziel <code>192.168.7.7</code>, Tabelle wie oben.', ['10.0.0.0/8 passt nicht', 'Keine /16- oder /24-Zeile passt', 'Keine Zeile passt, das Paket wird verworfen'], 2,
      '0.0.0.0/0 passt <b>immer</b>. Das Paket geht über die Default-Route ins Internet.', 'Routing', 'routing')
  ],
  vlan: [
    W('Die MAC-Tabellen sind leer. <b>PC 1 schickt an PC 5.</b> Welche PCs bekommen den Frame am Kabel, auch wenn sie ihn danach verwerfen?', pcs(1), pcIndex(1, [2, 5]),
      'Geflutet wird nur VLAN 10: PC 2 bekommt ihn und verwirft ihn, über den Trunk kommt er zu PC 5. PC 3, 4, 6, 7 und 8 sehen nichts.', 'VLAN', 'vlan', true),
    W('Direkt danach <b>antwortet PC 5 an PC 1</b>. Wer bekommt diesen Frame?', pcs(5), pcIndex(5, [1]),
      'Beide Switches kennen PC 1 jetzt. Der Frame geht gezielt, nur PC 1 bekommt ihn.', 'VLAN', 'vlan', true),
    W('Tabellen leer. <b>PC 3 sendet einen Broadcast.</b> Wer bekommt ihn?', pcs(3), pcIndex(3, [4, 6, 7]),
      'Alle in VLAN 20: PC 4, PC 6 und PC 7. Das VLAN ist die Grenze des Broadcasts.', 'VLAN', 'vlan', true),
    W('Tabellen leer. <b>PC 3 schickt an PC 8.</b> Wer bekommt den Frame am Kabel?', pcs(3), pcIndex(3, [4, 6, 7]),
      'Geflutet wird VLAN 20: PC 4, 6 und 7 verwerfen ihn. PC 8 in VLAN 30 bekommt ihn nie.', 'VLAN', 'vlan', true),
    W('Auf welchem Kabel trägt ein Frame von PC 1 an PC 5 einen VLAN-Tag?', ['PC 1 zu Switch 1', 'Switch 1 zu Switch 2 (Trunk)', 'Switch 2 zu PC 5', 'Auf allen dreien'], [1],
      'Nur auf dem Trunk. Die PCs wissen nichts von VLANs, der Switch klebt den Tag drauf und nimmt ihn wieder ab.', 'VLAN', 'vlan'),
    W('PC 1 (VLAN 10) soll mit PC 3 (VLAN 20) reden. Was wird gebraucht?', ['Ein zusätzliches Kabel zwischen den Switches', 'Ein Router oder Layer-3-Switch', 'Eine größere MAC-Tabelle', 'Den Tag am Trunk entfernen'], [1],
      'Zwischen VLANs vermittelt nur ein Router, genau wie zwischen zwei Subnetzen.', 'VLAN', 'vlan')
  ],
  vlanBotschaft: [
    B('Tabellen leer, PC 1 schickt an PC 5.', ['Switch 1 lernt: MAC von PC 1 hängt an Port 1', 'Switch 1 kennt PC 5 nicht und flutet an alle Ports, auch an PC 3 und PC 4', 'Über den Trunk geht der Frame mit Tag 10'], 1,
      'Geflutet wird nur <b>innerhalb von VLAN 10</b>: an PC 2 und den Trunk. PC 3 und PC 4 sind in VLAN 20.', 'VLAN', 'vlan'),
    B('Tabellen leer, PC 1 schickt an PC 5.', ['PC 1 schickt den Frame ohne Tag an Switch 1', 'Switch 1 trägt die Ziel-MAC (PC 5) mit Port 1 in seine Tabelle ein', 'Switch 1 flutet in VLAN 10'], 1,
      'Der Switch lernt immer die <b>Absender</b>-MAC, nur von ihr weiß er, an welchem Port sie hängt.', 'VLAN', 'vlan'),
    B('Tabellen leer, PC 1 schickt an PC 5.', ['Switch 1 flutet in VLAN 10 und auf den Trunk', 'Auf dem Trunk trägt der Frame den Tag 10', 'Switch 2 gibt den Frame mit Tag 10 an PC 5 weiter'], 2,
      'Am Access-Port nimmt Switch 2 den Tag <b>wieder ab</b>. PC 5 bekommt einen ganz normalen Frame.', 'VLAN', 'vlan')
  ],
  v6: [
    F('Kürze so weit wie möglich: <code>2001:0db8:0000:0000:0000:ff00:0042:8329</code>', [['Gekürzt', 'v6kurz', '2001:db8::ff00:42:8329']],
      'Führende Nullen weg ergibt 2001:db8:0:0:0:ff00:42:8329, die drei Nullgruppen werden zu ::.', 'IPv6'),
    F('Kürze: <code>fe80:0000:0000:0000:0204:61ff:fe9d:f156</code>', [['Gekürzt', 'v6kurz', 'fe80::204:61ff:fe9d:f156']],
      'Drei Nullgruppen werden zu ::, und auch in 0204 steckt eine führende Null.', 'IPv6'),
    F('Kürze: <code>2001:0db8:0000:0001:0000:0000:0000:0001</code>', [['Gekürzt', 'v6kurz', '2001:db8:0:1::1']],
      ':: darf nur einmal vorkommen, also nimmt man die längste Kette. Die einzelne Nullgruppe bleibt als 0 stehen.', 'IPv6'),
    F('Klappe vollständig auf, alle 32 Ziffern: <code>2001:db8::1</code>', [['Ausgeschrieben', 'v6voll', '2001:0db8:0000:0000:0000:0000:0000:0001']],
      'Zwei Gruppen links, eine rechts: :: steht für fünf Nullgruppen.', 'IPv6'),
    F('Sie haben <code>2001:db8:abcd::/48</code> und brauchen <b>60 Subnetze</b>. Welches Präfix bekommen die Subnetze?', [['Neues Präfix', 'praefix', '54']],
      '60 Subnetze brauchen 6 Bit, denn ' + hoch(2, 5) + ' = 32 ist zu wenig und ' + hoch(2, 6) + ' = 64 reicht: /48 + 6 = /54.', 'IPv6'),
    F('Sie haben <code>2001:db8:abcd::/48</code> und brauchen <b>16 Subnetze</b>. Welches Präfix?', [['Neues Präfix', 'praefix', '52']],
      '16 = ' + hoch(2, 4) + ': 4 Bit, genau eine Hex-Stelle. /52.', 'IPv6'),
    F('Wie viele /64-Netze stecken in einem <code>/56</code>?', [['Anzahl', 'zahl', '256']], '8 Bit Unterschied: ' + hoch(2, 8) + ' = 256.', 'IPv6'),
    F('EUI-64: Welche Interface-ID entsteht aus der MAC <code>00:1A:2B:3C:4D:5E</code>?', [['Interface-ID (4 Gruppen)', 'iid', '021a:2bff:fe3c:4d5e']],
      'Aufschneiden, FF:FE rein, zweite Ziffer um 2 wackeln: 00:1A:2B | FF:FE | 3C:4D:5E, dann 00 wird 02. Ergibt 021a:2bff:fe3c:4d5e.', 'IPv6')
  ],
  v6Botschaft: [
    B('Aufgabe: Kürze <code>2001:0db8:0000:0000:0001:0000:0000:0001</code>.', ['Führende Nullen weg: 2001:db8:0:0:1:0:0:1', 'Beide Nullketten zu ::, also 2001:db8::1::1'], 1,
      'Nur <b>ein</b> :: ist erlaubt. Bei zwei gleich langen Ketten wird die erste gekürzt: <b>2001:db8::1:0:0:1</b>.', 'IPv6'),
    B('Aufgabe: <code>2001:db8:abcd::/48</code>, 200 Subnetze.', ['200 Subnetze brauchen 8 Bit (' + hoch(2, 8) + ' = 256)', '8 Bit sind 2 Hex-Stellen', 'Neues Präfix: /48 − 8 = /40'], 2,
      'Subnetze sind kleiner, das Präfix wird länger: <b>/48 + 8 = /56</b>.', 'IPv6'),
    B('Aufgabe: EUI-64 aus <code>00:1A:2B:3C:4D:5E</code>.', ['Aufschneiden: 00:1A:2B | 3C:4D:5E', 'FF:FE rein: 00:1A:2B:FF:FE:3C:4D:5E', 'Siebtes Bit umdrehen: 00 wird 01', 'Interface-ID: 011a:2bff:fe3c:4d5e'], 2,
      'Das siebte Bit hat den Wert 2: <b>00 wird 02</b>. Zeile 4 ist ein Folgefehler, richtig ist 021a:2bff:fe3c:4d5e.', 'IPv6', undefined, [3])
  ]
};
/* Die Routingtabelle und der VLAN-Aufbau, auf die sich die Aufgaben beziehen */
export const ROUTEN = [['Internet', '0.0.0.0/0', 'Internet'], ['Firmennetz', '10.0.0.0/8', 'eth0'], ['Standort Berlin', '10.20.0.0/16', 'eth1'], ['Standort Hamburg', '10.30.0.0/16', 'eth2'],
  ['Etage 3', '10.20.3.0/24', 'eth3'], ['Büro Technik', '10.20.3.0/26', 'eth4'], ['Büro Verwaltung', '10.20.3.64/26', 'eth5']];
export const VLAN_AUFBAU = [{ name: 'Switch 1', pcs: [[1, 10], [2, 10], [3, 20], [4, 20]] }, { name: 'Switch 2', pcs: [[5, 10], [6, 20], [7, 20], [8, 30]] }];

/* ---------- Mimic-Truhe: welches Gatter steckt drin? ---------- */
export const GATTER = [
  { id: 'AND', de: 'UND', f: (a, b) => a & b, satz: 'UND (AND) gibt nur dann 1, wenn A und B beide 1 sind.' },
  { id: 'OR', de: 'ODER', f: (a, b) => a | b, satz: 'ODER (OR) gibt 1, sobald mindestens ein Eingang 1 ist.' },
  { id: 'XOR', de: 'Exklusiv-ODER', f: (a, b) => a ^ b, satz: 'Exklusiv-ODER (XOR) gibt 1, wenn genau ein Eingang 1 ist.' },
  { id: 'NAND', de: 'NICHT-UND', f: (a, b) => (a & b) ^ 1, satz: 'NICHT-UND (NAND) gibt nur bei A = 1 und B = 1 eine 0, sonst immer 1. Aus NAND allein lässt sich jedes andere Gatter bauen.' },
  { id: 'NOR', de: 'NICHT-ODER', f: (a, b) => (a | b) ^ 1, satz: 'NICHT-ODER (NOR) gibt nur bei A = 0 und B = 0 eine 1.' },
  { id: 'XNOR', de: 'Äquivalenz', f: (a, b) => (a ^ b) ^ 1, satz: 'Äquivalenz (XNOR) gibt 1, wenn A und B gleich sind.' },
  { id: 'NOT', de: 'NICHT (nur A)', f: a => a ^ 1, satz: 'NICHT (NOT) dreht nur A um. B ist der Truhe egal.' }
];
export const gatter = id => GATTER.find(g => g.id === id);
function mimic(){
  const g = wpick(GATTER, g => g.id === 'NOT' ? 0.5 : 1);
  return { art: 'mimic', thema: 'Logik', gatter: g.id, frage: 'Welches Gatter steckt in der Truhe?', erklaerung: g.satz };
}

/* ---------- Restore: der Server brennt, welche Sicherungen spielst du zurück? ---------- */
export const TAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const TAGE_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
/* Je Tag: VOLL, DIFF oder INKR und die Größe in GB; Tage ab dem Ausfall gibt es noch nicht */
export function woche(r){
  return TAGE.map((_, t) => {
    if (t >= r.ausfall) return null;
    if (r.voll.includes(t)) return { art: 'VOLL', gb: r.vollGb };
    const letzteVoll = Math.max(...r.voll.filter(v => v < t));
    return { art: r.plan === 'diff' ? 'DIFF' : 'INKR', gb: r.plan === 'diff' ? (t - letzteVoll) * r.gb : r.gb };
  });
}
function restore(){
  const plan = Math.random() < 0.5 ? 'diff' : 'inkr', voll = Math.random() < 0.3 ? [0, 3] : [0], ausfall = 2 + rnd(5), gb = 2 + rnd(4);
  const letzte = ausfall - 1, start = Math.max(...voll.filter(v => v <= letzte));
  const soll = plan === 'diff' ? (letzte === start ? [start] : [start, letzte]) : Array.from({ length: letzte - start + 1 }, (_, i) => start + i);
  const art = plan === 'diff' ? 'differentiell' : 'inkrementell';
  return {
    art: 'restore', thema: 'Datensicherung', plan, voll, ausfall, gb, vollGb: 40, soll,
    frage: 'Sonntags läuft eine Vollsicherung' + (voll.length > 1 ? ', mittwochs eine zweite' : '') + ', an den übrigen Tagen wird ' + art + ' gesichert. ' +
      'Am <b>' + TAGE_LANG[ausfall] + 'morgen</b> fällt die Platte aus, die letzte Sicherung lief am ' + TAGE_LANG[letzte] + 'abend. Welche Sicherungen spielst du zurück, und in welcher Reihenfolge?',
    erklaerung: (letzte === start ? 'Die letzte Sicherung war selbst eine Vollsicherung, sie reicht allein. '
      : plan === 'diff' ? 'Differentiell heißt: alles seit der letzten Vollsicherung. Also die Vollsicherung vom ' + TAGE_LANG[start] + ' und nur das letzte Diff vom ' + TAGE_LANG[letzte] + '. Zwei Medien, das Backup war langsam, der Restore ist schnell. '
        : 'Inkrementell heißt: nur seit der letzten Sicherung, egal welcher Art. Also die Vollsicherung vom ' + TAGE_LANG[start] + ' und dann jedes Inkrement der Reihe nach bis ' + TAGE_LANG[letzte] + '. ' + soll.length + ' Medien, und keins darf fehlen. ') +
      (start === 3 && letzte > 3 ? 'Die Vollsicherung vom Mittwoch ist die jüngste, alles davor braucht es nicht mehr.' : '')
  };
}

/* ---------- Was wo lauert ---------- */
const MACHER = {
  ipv4Netz: () => ipv4Netz(false), ipv4NetzGross: () => ipv4Netz(true), ipv4Art, ipv4Direkt, ipv4Maske, ipv4Planung,
  botschaftIpv4: () => botschaftIpv4(false), botschaftIpv4Gross: () => botschaftIpv4(true),
  v6Kurz, v6Voll, v6Planung, eui64, mimic, restore,
  festIpv4: () => pick(FEST.ipv4), festIpv4Botschaft: () => pick(FEST.ipv4Botschaft), festRouter: () => pick(FEST.router), festRouterBotschaft: () => pick(FEST.routerBotschaft),
  festVlan: () => pick(FEST.vlan), festVlanBotschaft: () => pick(FEST.vlanBotschaft), festV6: () => pick(FEST.v6), festV6Botschaft: () => pick(FEST.v6Botschaft)
};
/* Gewichte je Ort. LF3: Subnetze, Routing, VLAN, ein bisschen IPv6, Restore. LF5 und das Gesims des Stolzes: Logik.
   Gesims des Zorns: größere Netze, Subnetze planen, IPv6, Restore. */
const POOL = {
  3: { ipv4Netz: 3, ipv4Art: 2, ipv4Direkt: 1, ipv4Maske: 1, botschaftIpv4: 3, festIpv4: 2, festIpv4Botschaft: 1, festRouter: 1, festRouterBotschaft: 1, festVlan: 1, festVlanBotschaft: 1, v6Kurz: 1, restore: 2 },
  5: { mimic: 1 },
  7: { mimic: 1 },
  11: { ipv4NetzGross: 2, ipv4Planung: 2, botschaftIpv4Gross: 2, v6Kurz: 1, v6Voll: 1, v6Planung: 1, eui64: 1, festV6: 1, festV6Botschaft: 1, festRouter: 1, festVlan: 1, restore: 2 }
};
/* Wie viele Rätsel ein Gang an diesem Ort zusätzlich zu den zehn Karten bringt */
export const IM_GANG = { 3: 2, 5: 1, 7: 1, 11: 2 };
export const NAMEN = { rechnen: 'Rechengegner', botschaft: 'Botschaft am Boden', mimic: 'Mimic-Truhe', restore: 'Der Server brennt' };
export const MEHRZAHL = { rechnen: 'Rechengegner', botschaft: 'Botschaften', mimic: 'Mimic-Truhen', restore: 'Restore-Notfälle' };
export function arten(ort){
  const p = POOL[ort];
  if (!p) return [];
  return [...new Set(Object.keys(p).map(k => erzeugen(k).art))];
}
export const erzeugen = name => MACHER[name]();
export function fuer(ort){
  const p = POOL[ort];
  if (!p) return null;
  return erzeugen(wpick(Object.keys(p), k => p[k]));
}

/* ---------- Prüfen ---------- */
/* Ergebnis eines Feldes: { ok } oder { ungueltig: Satz } (zählt nicht, darf korrigiert werden), bei falsch manchmal ein warum */
export function pruefeFeld(feld, wert){
  const v = String(wert || '').trim();
  if (!v) return { ungueltig: 'Bitte alle Felder ausfüllen.' };
  if (feld.art === 'ip') {
    const n = ipZahl(v);
    return n === null ? { ungueltig: 'Das ist keine gültige IPv4-Adresse: vier Zahlen von 0 bis 255 mit Punkten.' } : { ok: n === ipZahl(feld.soll) };
  }
  if (feld.art === 'zahl') {
    const s = v.replace(/[.\s'’]/g, '');
    return /^\d+$/.test(s) ? { ok: Number(s) === Number(feld.soll) } : { ungueltig: 'Bitte eine ganze Zahl.' };
  }
  if (feld.art === 'praefix') {
    const s = v.replace('/', '').trim();
    return /^\d{1,3}$/.test(s) && +s <= 128 ? { ok: +s === Number(feld.soll) } : { ungueltig: 'Bitte ein Präfix wie /26.' };
  }
  if (feld.art === 'v6kurz' || feld.art === 'v6voll') {
    const r = V6.lesen(v), e = V6.lesen(feld.soll);
    if (r === 'doppelt') return feld.art === 'v6kurz' ? { ok: false, warum: 'Zweimal :: ist nicht erlaubt, sonst weiß niemand, wie viele Nullgruppen wohin gehören.' } : { ungueltig: 'Zweimal :: ist nicht erlaubt.' };
    if (!r) return { ungueltig: 'Das ist keine gültige IPv6-Adresse.' };
    const gleich = r.gruppen.join() === e.gruppen.join();
    if (feld.art === 'v6kurz') return !gleich ? { ok: false } : v.toLowerCase() === V6.kurz(e.gruppen) ? { ok: true } : { ok: false, warum: 'Die Adresse stimmt, geht aber noch kürzer.' };
    return v.toLowerCase() === feld.soll ? { ok: true } : gleich ? { ok: false, warum: 'Gleiche Adresse, aber gefragt waren alle 32 Ziffern.' } : { ok: false };
  }
  if (feld.art === 'iid') {
    const a = v.toLowerCase().split(':'), b = feld.soll.split(':');
    if (a.length !== 4 || a.some(x => !/^[0-9a-f]{1,4}$/.test(x))) return { ungueltig: 'Bitte vier Gruppen, zum Beispiel 021a:2bff:fe3c:4d5e.' };
    return { ok: a.every((x, i) => parseInt(x, 16) === parseInt(b[i], 16)) };
  }
  return { ok: false };
}
/* Die Lösung in einer Zeile, für die Rückmeldung und den Todesbildschirm */
export function loesung(r){
  if (r.art === 'rechnen') return r.felder ? r.felder.map(f => f.label + ': <b>' + (f.art === 'praefix' ? '/' : '') + (f.art === 'zahl' ? zahl(f.soll) : f.soll) + '</b>').join(' · ')
    : r.wahl.richtig.map(i => '<b>' + r.wahl.optionen[i] + '</b>').join(', ');
  if (r.art === 'botschaft') return 'Zeile ' + (r.falsch + 1) + ' lügt: „' + r.zeilen[r.falsch] + '“';
  if (r.art === 'mimic') { const g = gatter(r.gatter); return 'In der Truhe steckte <b>' + g.de + (g.de.startsWith(g.id) ? '' : ' (' + g.id + ')') + '</b>'; }
  if (r.art === 'restore') return r.soll.map(t => '<b>' + TAGE[t] + '</b> (' + (r.voll.includes(t) ? 'Voll' : r.plan === 'diff' ? 'Diff' : 'Inkr') + ')').join(' → ');
  return '';
}
