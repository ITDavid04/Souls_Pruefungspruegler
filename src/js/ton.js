/* Die Tonebene: ein ruhiger Wind, prozedural aus Rauschen gebaut, ganz ohne Audiodateien.
   Er weht erst, nachdem der Finger das erste Mal getippt hat, weil der Browser Ton bis zum ersten
   Gestus sperrt. Alles schwillt langsam an und ab, nie plötzlich, passend zum ruhigen Ton des Spiels:
   kein Herzschlag, kein Zappeln. Wer den Tab wegklickt, bei dem schläft der Wind und wacht später wieder auf. */

const ZIEL = 0.05;        // Grundlautstärke, bewusst leise; mit Musik weht er leiser, damit sie nicht untergeht
const windZiel = () => musikAn ? ZIEL * 0.6 : ZIEL;
let ctx = null, master = null, windAn = false, an = true, entsperrt = false, versteckt = false;

/* Den Audiokontext erst beim ersten Gestus bauen, sonst meckert der Browser und es kostet Akku */
function sicherstellen(){
  if (ctx) return true;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    /* Unterbricht das Handy den Ton (Anruf, andere App, Sperrbildschirm), gleich wieder anlaufen;
       klappt das ohne Gestus nicht, holt ihn das nächste Tippen zurück */
    ctx.onstatechange = () => { if (ctx.state !== 'running') fortsetzen(); };
    return true;
  } catch (e) { return false; }
}

/* Zwei Sekunden weiches Rauschen als Schleife, eher dumpf als zischend */
function rauschQuelle(){
  const laenge = Math.floor(ctx.sampleRate * 2);
  const buf = ctx.createBuffer(1, laenge, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < laenge; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99 * b0 + 0.045 * w;
    b1 = 0.95 * b1 + 0.10 * w;
    b2 = 0.80 * b2 + 0.20 * w;
    d[i] = (b0 + b1 + b2) * 0.2;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

/* Den Wind einmal aufbauen: Rauschen durch einen tiefen Filter, zwei träge Schwinger für Böen und Schwellen */
function windBauen(){
  if (windAn || !ctx) return;
  windAn = true;
  try {
    const quelle = rauschQuelle();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    lp.Q.value = 0.4;
    const g = ctx.createGain();
    g.gain.value = 0.6;
    quelle.connect(lp); lp.connect(g); g.connect(master);
    quelle.start();

    /* Langsame Böen: der Filter wandert über etwa sechzehn Sekunden auf und ab */
    const boe = ctx.createOscillator();
    boe.type = 'sine'; boe.frequency.value = 0.06;
    const boeTiefe = ctx.createGain(); boeTiefe.gain.value = 180;
    boe.connect(boeTiefe); boeTiefe.connect(lp.frequency); boe.start();

    /* Langsames Schwellen: die Lautstärke atmet über etwa zweiundzwanzig Sekunden */
    const atem = ctx.createOscillator();
    atem.type = 'sine'; atem.frequency.value = 0.045;
    const atemTiefe = ctx.createGain(); atemTiefe.gain.value = 0.22;
    atem.connect(atemTiefe); atemTiefe.connect(g.gain); atem.start();
  } catch (e) { windAn = false; }
}

function einblenden(){ if (ctx) try { master.gain.setTargetAtTime(windZiel(), ctx.currentTime, 2.5); } catch (e) {} }
function ausblenden(){ if (ctx) try { master.gain.setTargetAtTime(0, ctx.currentTime, 1.2); } catch (e) {} }
/* Nicht nur 'suspended': Safari meldet nach einer Unterbrechung 'interrupted', und auch daraus muss der Ton zurück */
function fortsetzen(){
  if (!ctx || versteckt || ctx.state === 'running' || ctx.state === 'closed') return;
  try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
/* Ein winziger stiller Ton im Gestus: so lassen auch ältere iPhones den Ton heraus */
function stilleSpielen(){
  try { const q = ctx.createBufferSource(); q.buffer = ctx.createBuffer(1, 1, 22050); q.connect(ctx.destination); q.start(0); } catch (e) {}
}

/* Jedes Tippen weckt den Ton: das erste entsperrt ihn und lässt den Wind wehen, jedes weitere holt ihn zurück,
   falls Browser oder Handy ihn zwischendurch angehalten haben */
export function wecken(){
  if (!sicherstellen()) return;
  fortsetzen();
  if (entsperrt) return;
  entsperrt = true;
  stilleSpielen();
  if (an) { windBauen(); einblenden(); }
  musikFolgen();
}

/* Schalter im Spielstand: an oder aus. Vor dem ersten Gestus merkt er sich nur den Wunsch */
export function setzen(ein){
  an = !!ein;
  if (!entsperrt) return;
  fortsetzen();
  if (an) { windBauen(); einblenden(); } else ausblenden();
}

/* Tab sichtbar oder versteckt: Wind und Musik schlafen legen und wieder wecken */
export function sichtbar(ja){
  versteckt = !ja;
  if (!ctx || !entsperrt) return;
  if (ja) fortsetzen();
  else try { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}

/* Die Musik: kein Lied in Schleife, sondern einzelne weiche Töne aus einer festen Tonleiter, die langsam
   kommen und gehen, über einem atmenden Grundton. Kein Takt, kein Puls, nichts wiederholt sich erkennbar.
   Jeder Ort hat Tonleiter, Klangfarbe, Hall und Tempo; beim Ortswechsel blenden sie über gut vier Sekunden
   ineinander. Im Bosskampf wird es nicht schneller, sondern tiefer. Erprobt in tools/hoerprobe. */
const MUSIK_PEGEL = 0.28;  // klar über dem Wind, deutlich unter den Kampfklängen
const KLANGORTE = {
  lagerfeuer: { grund: 196.0, leiter: [0, 2, 4, 7, 9], lage: [-3, 7], start: 2,
    klang: 'warm', abstand: [2.5, 5], fluss: [0.7, 1.2], phrase: [2, 4], pegel: 0.11, bordun: [-12, -5], bordunPegel: 0.05, filter: 1500, hall: 0.35, glut: true },
  hoelle: { grund: 82.41, leiter: [0, 1, 5, 7, 8], lage: [2, 10], start: 5,
    klang: 'weich', abstand: [4.5, 8], fluss: [1.0, 1.6], phrase: [1, 3], pegel: 0.11, bordun: [0, 7], bordunPegel: 0.055, filter: 900, hall: 0.55, glut: true },
  kokytos: { grund: 246.94, leiter: [0, 2, 7, 9], lage: [0, 8], start: 3,
    klang: 'glas', abstand: [7, 12], fluss: [1.4, 2.2], phrase: [1, 2], pegel: 0.06, bordun: [-24], bordunPegel: 0.035, filter: 5000, hall: 0.9 },
  katakomben: { grund: 73.42, leiter: [0, 3, 5, 7, 10], lage: [3, 11], start: 5,
    klang: 'weich', abstand: [5, 9], fluss: [1.1, 1.8], phrase: [1, 2], pegel: 0.12, bordun: [0, 7], bordunPegel: 0.06, filter: 800, hall: 0.85 },
  berg: { grund: 174.61, leiter: [0, 2, 4, 7, 9], lage: [0, 9], start: 4,
    klang: 'glocke', abstand: [4, 7], fluss: [0.8, 1.3], phrase: [1, 3], pegel: 0.095, bordun: [-12, -5], bordunPegel: 0.045, filter: 2600, hall: 0.7 },
  gipfel: { grund: 130.81, leiter: [0, 5, 7], lage: [0, 7], start: 3,
    klang: 'feier', abstand: [5, 8], fluss: [1.2, 1.8], phrase: [1, 2], pegel: 0.09, bordun: [-12, -5], bordunPegel: 0.05, filter: 2000, hall: 0.65, quinte: true }
};
/* Teiltöne je Klangfarbe: [Wellenform, Frequenzfaktor, Anteil] und die Hülle [Anstieg, Ausklang] in Sekunden */
const TEILTOENE = {
  weich: [['sine', 1, 1], ['triangle', 1, 0.35]],
  warm: [['triangle', 1, 1], ['sine', 2, 0.15]],
  glas: [['sine', 1, 1], ['sine', 2.76, 0.22], ['sine', 5.4, 0.06]],
  glocke: [['sine', 1, 1], ['sine', 2, 0.35], ['sine', 3.01, 0.14], ['sine', 4.2, 0.06]],
  feier: [['triangle', 1, 1], ['sine', 2, 0.2]]
};
const TON_HUELLE = { weich: [1.4, 5.5], warm: [0.5, 4.2], glas: [0.06, 6.5], glocke: [0.03, 5], feier: [0.9, 5.5] };

let musikAn = true, musikLaut = 1, musikBus = null, hall = null, knisterBuf = null, spielt = null;
let wunsch = { ort: null, boss: false }, musikZahl = 0;
const zufall = (a, b) => a + Math.random() * (b - a);
const ganz = (a, b) => Math.floor(zufall(a, b + 1));
function hz(o, stufe){
  const n = o.leiter.length, okt = Math.floor(stufe / n), i = ((stufe % n) + n) % n;
  return o.grund * Math.pow(2, (o.leiter[i] + 12 * okt) / 12);
}

/* Musikbus und Hall erst bauen, wenn wirklich Musik spielt */
function musikBauen(){
  if (musikBus) return;
  musikBus = ctx.createGain(); musikBus.gain.value = MUSIK_PEGEL * musikLaut;
  const weich = ctx.createBiquadFilter(); weich.type = 'lowpass'; weich.frequency.value = 6000;
  musikBus.connect(weich); weich.connect(ctx.destination);
  /* Ein großer, dunkler Raum: Rauschen, das über gut vier Sekunden verklingt */
  const len = Math.floor(ctx.sampleRate * 4.5), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let kanal = 0; kanal < 2; kanal++) {
    const d = buf.getChannelData(kanal); let b = 0;
    for (let i = 0; i < len; i++) { b = 0.6 * b + 0.4 * (Math.random() * 2 - 1); d[i] = b * Math.exp(-i / (ctx.sampleRate * 1.1)); }
  }
  hall = ctx.createConvolver(); hall.buffer = buf; hall.connect(musikBus);
  knisterBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.03), ctx.sampleRate);
  const k = knisterBuf.getChannelData(0);
  for (let i = 0; i < k.length; i++) k[i] = Math.random() * 2 - 1;
  pxRausch = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const r = pxRausch.getChannelData(0);
  for (let i = 0; i < r.length; i++) r[i] = Math.random() * 2 - 1;
}

/* Einen Ort aufbauen: Grundton, Bossgrund (anfangs stumm) und der Taktgeber für die Töne */
function ortBauen(key){
  const o = KLANGORTE[key], t = ctx.currentTime;
  const bus = ctx.createGain(); bus.gain.value = 0.0001; bus.connect(musikBus);
  const send = ctx.createGain(); send.gain.value = o.hall; bus.connect(send); send.connect(hall);
  bus.gain.setTargetAtTime(1, t, 1.3);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(o.filter, 900); lp.Q.value = 0.5; lp.connect(bus);
  const bordunG = ctx.createGain(); bordunG.gain.value = o.bordunPegel; bordunG.connect(lp);
  const quellen = [];
  const schwinger = (typ, f, pegel, ziel) => {
    const osc = ctx.createOscillator(); osc.type = typ; osc.frequency.value = f;
    const g = ctx.createGain(); g.gain.value = pegel;
    osc.connect(g); g.connect(ziel); osc.start(); quellen.push(osc);
  };
  o.bordun.forEach((st, i) => {
    const f = o.grund * Math.pow(2, st / 12), anteil = i ? 0.6 : 1;
    schwinger('triangle', f, 0.6 * anteil, bordunG);
    schwinger('sine', f * 1.0016, 0.5 * anteil, bordunG);   // leicht verstimmt, schwebt sehr langsam
  });
  /* Der Grundton atmet über knapp dreißig Sekunden */
  const atem = ctx.createOscillator(); atem.frequency.value = 0.035;
  const atemTiefe = ctx.createGain(); atemTiefe.gain.value = o.bordunPegel * 0.35;
  atem.connect(atemTiefe); atemTiefe.connect(bordunG.gain); atem.start(); quellen.push(atem);
  /* Bosskampf: eine Oktave und eine Quinte unter dem Grundton */
  const bossG = ctx.createGain(); bossG.gain.value = 0.0001; bossG.connect(lp);
  const tief = o.grund * Math.pow(2, (o.bordun[0] - 12) / 12);
  schwinger('triangle', tief, 0.7, bossG);
  schwinger('triangle', tief * Math.pow(2, 7 / 12), 0.4, bossG);

  const z = { key, o, bus, send, bossG, quellen, lebt: true, boss: false, pos: o.start, timer: 0, glutTimer: 0 };
  z.timer = setTimeout(() => phrase(z), 1800);
  if (o.glut) z.glutTimer = setTimeout(() => glut(z), 1200);
  return z;
}

function ortAbbauen(z){
  z.lebt = false; clearTimeout(z.timer); clearTimeout(z.glutTimer);
  const t = ctx.currentTime;
  try {
    z.bus.gain.cancelScheduledValues(t); z.bus.gain.setValueAtTime(z.bus.gain.value, t);
    z.bus.gain.setTargetAtTime(0.0001, t, 1.3);
  } catch (e) {}
  setTimeout(() => { z.quellen.forEach(q => { try { q.stop(); } catch (e) {} }); z.bus.disconnect(); z.send.disconnect(); }, 9000);
}

/* Eine kurze Tonfolge von ein bis vier Tönen, dann eine lange Pause */
function phrase(z){
  if (!z.lebt) return;
  if (ctx.state !== 'running') { z.timer = setTimeout(() => phrase(z), 1000); return; }
  const o = z.o, n = ganz(o.phrase[0], o.phrase[1]);
  let t = ctx.currentTime + 0.05;
  for (let i = 0; i < n; i++) {
    schritt(z);
    let f = hz(o, z.pos);
    if (z.boss && Math.random() < 0.6) f /= 2;
    musikTon(z, f, t, o.pegel * (i ? 0.8 : 1));
    if (o.quinte && Math.random() < 0.5) musikTon(z, f * 1.5, t + 0.15, o.pegel * 0.55);
    t += zufall(o.fluss[0], o.fluss[1]);
  }
  const pause = (t - ctx.currentTime) + zufall(o.abstand[0], o.abstand[1]) * (z.boss ? 1.2 : 1);
  z.timer = setTimeout(() => phrase(z), pause * 1000);
}

/* Meist ein Schritt zum Nachbarton, selten ein Sprung, und sanft zurück zur Mitte */
function schritt(z){
  const [lo, hi] = z.o.lage, mitte = (lo + hi) / 2, r = Math.random();
  let s = r < 0.35 ? 1 : r < 0.7 ? -1 : r < 0.82 ? 2 : r < 0.94 ? -2 : (Math.random() < 0.5 ? 3 : -3);
  if (Math.abs(z.pos - mitte) > (hi - lo) / 3 && Math.sign(s) === Math.sign(z.pos - mitte) && Math.random() < 0.6) s = -s;
  z.pos += s;
  if (z.pos > hi) z.pos = hi - 1;
  if (z.pos < lo) z.pos = lo + 1;
}

/* Ein einzelner Ton: langsam an, lange aus, irgendwo zwischen links und rechts */
function musikTon(z, f, t, p){
  try {
    const o = z.o, [anstieg, ausklang] = TON_HUELLE[o.klang];
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.filter;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (pan.pan) pan.pan.value = zufall(-0.45, 0.45);
    lp.connect(pan); pan.connect(z.bus);
    TEILTOENE[o.klang].forEach(([typ, faktor, anteil], i) => {
      const osc = ctx.createOscillator(); osc.type = typ; osc.frequency.value = f * faktor;
      const g = ctx.createGain(), spitze = Math.max(0.0002, p * anteil), aus = ausklang / (1 + i * 0.6);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(spitze, t + anstieg);
      g.gain.exponentialRampToValueAtTime(0.0001, t + anstieg + aus);
      osc.connect(g); g.connect(lp); osc.start(t); osc.stop(t + anstieg + aus + 0.1);
    });
    musikZahl++;
  } catch (e) {}
}

/* Leise Glut: ab und zu ein winziges Knistern */
function glut(z){
  if (!z.lebt) return;
  if (ctx.state === 'running') {
    const t = ctx.currentTime, n = ganz(1, 3);
    for (let i = 0; i < n; i++) knister(z, t + i * zufall(0.02, 0.07));
  }
  z.glutTimer = setTimeout(() => glut(z), zufall(0.25, 2.2) * 1000);
}
function knister(z, t){
  try {
    const src = ctx.createBufferSource(); src.buffer = knisterBuf;
    const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = zufall(1800, 4200); flt.Q.value = 1.5;
    const g = ctx.createGain(), dauer = zufall(0.008, 0.025);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(zufall(0.012, 0.03), t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    src.connect(flt); flt.connect(g); g.connect(z.bus);
    src.start(t); src.stop(t + 0.035);
  } catch (e) {}
}

function bossPegel(z, an){
  if (z.boss === an) return;
  z.boss = an;
  const t = ctx.currentTime;
  try { z.bossG.gain.cancelScheduledValues(t); z.bossG.gain.setTargetAtTime(an ? z.o.bordunPegel * 1.3 : 0.0001, t, 1.6); } catch (e) {}
}

/* Die Pixelmusik: kurze, eigene Themen über acht Takte in Schleife, wie auf alten Handkonsolen.
   Die Melodie spielt eine Pulswelle, darunter ein Dreiecksbass, Arpeggios und Rauschen als Schlagzeug.
   Notiert wird pro Takt in Achteln: Note (C5, F#4, Bb4), "-" hält die Note, "." ist Pause.
   Bass, Begleitung und Schlagzeug ergeben sich aus den Akkorden und dem Stil des Stücks. Erprobt in tools/hoerprobe/pixel.html. */
const PIXEL_PEGEL = 0.62;  // relativ zum Musikbus: die Pixelmusik bleibt unter den 8-Bit-Treffern
const PIXEL_STUECKE = {
  'px-karte': { bpm: 138, lead: { welle: 'puls25' }, arp: 'arp16', bass: 'gehen', drums: 'kick',
    akkorde: 'D | G | D | A | Bm | G | Em A | D',
    melodie: 'D5 - - A4 D5 E5 F#5 - | G5 - F#5 E5 D5 - B4 - | A4 - D5 - F#5 - A5 - | G5 F#5 E5 - - - . . | F#5 - - D5 B4 - D5 - | G5 - - F#5 G5 A5 B5 - | A5 - G5 - E5 - C#5 - | D5 - - - . . . .' },
  'px-mond': { bpm: 96, lead: { welle: 'dreieck' }, arp: 'arp8', bass: 'halbe', drums: 'hats',
    akkorde: 'F | G | Em | Am | F | G | F | F',
    melodie: 'C5 - - - A4 - C5 - | B4 - - - D5 - G5 - | E5 - - - D5 - B4 - | C5 - - - - - . . | A5 - - - G5 - F5 - | D5 - - - B4 - G4 - | A4 - C5 - E5 - G5 - | F5 - - - - - . .' },
  'px-merkur': { bpm: 160, lead: { welle: 'puls12' }, arp: 'arp16', bass: 'treiben', drums: 'leicht',
    akkorde: 'Em | D | C | D | Em | D | C | B',
    melodie: 'E5 . G5 A5 B5 . A5 G5 | F#5 . D5 E5 F#5 . A5 F#5 | G5 . E5 G5 C6 . B5 A5 | B5 - A5 - F#5 - D5 - | E5 . G5 A5 B5 . D6 B5 | A5 . F#5 A5 D6 . C6 A5 | G5 . E5 G5 C6 B5 A5 G5 | F#5 - D#5 - B4 - - .' },
  'px-venus': { bpm: 132, takt: 6, lead: { welle: 'puls25' }, arp: 'walzer', bass: 'walzer', drums: 'walzer',
    akkorde: 'Bb | Gm | Eb | F | Bb | Gm | Cm F | Bb',
    melodie: 'F5 - - D5 - Bb4 | G5 - - Bb5 - G5 | Bb5 - - G5 - Eb5 | F5 - - - . . | D5 - F5 Bb5 - A5 | G5 - - F5 - D5 | Eb5 - C5 A4 - C5 | Bb4 - - - . .' },
  'px-sonne': { bpm: 126, lead: { welle: 'puls50' }, arp: 'stakkato', bass: 'gehen', drums: 'kick',
    akkorde: 'C | F | C | G | Am | F | G | C',
    melodie: 'G4 . C5 . E5 - G5 - | A5 - - G5 F5 - C5 - | E5 - G5 - C6 - G5 - | D5 - - - B4 - G4 - | A4 - C5 E5 A5 - G5 - | F5 - A5 - C6 - A5 - | G5 - F5 E5 D5 - B4 D5 | C5 - - - . . G4 .' },
  'px-mars': { bpm: 112, lead: { welle: 'puls25', gate: 0.75 }, arp: 'stakkato', bass: 'marsch', drums: 'marsch',
    akkorde: 'Am | Am | F | G | Am | Dm | E | Am',
    melodie: 'A4 - - A4 C5 - E5 - | A5 - G5 - E5 - C5 - | F5 - - E5 D5 - C5 - | B4 - - - G4 - - . | A4 - - A4 C5 - E5 - | F5 - E5 - D5 - A5 - | G#5 - - E5 B4 - G#4 - | A4 - - - . . . .' },
  'px-jupiter': { bpm: 92, lead: { welle: 'puls50', doppel: true }, arp: 'akkord', bass: 'halbe', drums: 'feier',
    akkorde: 'Eb | Ab | Bb | Eb | Cm | Ab | Bb | Eb',
    melodie: 'Eb5 - - - Bb4 - Eb5 F5 | Ab5 - - - G5 - Eb5 - | F5 - - - D5 - Bb4 - | Eb5 - - - - - . . | G5 - - - Eb5 - G5 Ab5 | Bb5 - - - C6 - Ab5 - | G5 - F5 - D5 - F5 - | Eb5 - - - - - . .' },
  'px-saturn': { bpm: 104, lead: { welle: 'puls12', echo: true }, arp: 'arp16', bass: 'gehen', drums: 'hats',
    akkorde: 'Dm | G | Dm | G | C | F | G | A',
    melodie: 'D5 - F5 - A5 - G5 F5 | B4 - - D5 G5 - F5 D5 | A4 - D5 - F5 - E5 D5 | B4 - - - G4 - - . | E5 - G5 - C6 - B5 G5 | A5 - - G5 F5 - C5 - | D5 - G5 - B5 - A5 G5 | E5 - - C#5 A4 - - .' },
  'px-waechter': { bpm: 150, boss: true, lead: { welle: 'puls50', gate: 0.8 }, arp: 'arp16', bass: 'treiben', drums: 'treiben',
    akkorde: 'Cm | Cm | Ab | Bb | Cm | Cm | Ab | G',
    melodie: 'C5 . C5 . Eb5 - D5 C5 | G5 - - F5 Eb5 - D5 - | Eb5 . Eb5 . C5 - Ab4 C5 | D5 - Bb4 - F5 - D5 - | C5 . C5 . Eb5 - G5 - | C6 - - Bb5 G5 - Eb5 - | Ab5 - G5 F5 Eb5 - C5 Eb5 | D5 - - - B4 - G4 -' },
  'px-glitch': { bpm: 144, boss: true, glitch: true, lead: { welle: 'puls25', gate: 0.85 }, arp: 'arp16', bass: 'treiben', drums: 'treiben',
    akkorde: 'Em | C | D | B | Em | C | Am | B',
    melodie: 'E5 G5 B5 . E5 G5 B5 . | C6 - B5 G5 E5 - G5 - | F#5 A5 D6 . F#5 A5 D6 . | D#6 - B5 - F#5 - D#5 - | E5 G5 B5 . G5 B5 E5 . | C6 - - B5 A5 - G5 - | E5 - A5 - C6 - B5 A5 | B5 - - - F#5 - D#5 -' },
  'px-rast': { bpm: 84, lead: { welle: 'dreieck' }, arp: 'arp8', bass: 'halbe', drums: 'keine',
    akkorde: 'G | Em | C | D | G | Em | Am D | G',
    melodie: 'B4 - - - D5 - G5 - | E5 - - - D5 - B4 - | C5 - - - E5 - G5 - | F#5 - - - - - . . | G5 - - - A5 - B5 - | G5 - - - E5 - D5 - | C5 - E5 - D5 - F#5 - | G5 - - - - - . .' },
  'px-hoelle': { bpm: 108, lead: { welle: 'puls25' }, arp: 'arp8', bass: 'gehen', drums: 'hats',
    akkorde: 'Em | F | Em | F | Am | G | F | E',
    melodie: 'E5 - . B4 E5 - G5 - | F5 - - E5 F5 - A5 - | G5 - F5 - E5 - B4 - | C5 - - - A4 - - . | A4 - C5 - E5 - A5 - | G5 - F5 - D5 - B4 - | C5 - F5 - A5 - G5 F5 | E5 - - - B4 - G#4 -' },
  'px-katakomben': { bpm: 100, lead: { welle: 'puls25', gate: 0.45 }, arp: 'keiner', bass: 'marsch', drums: 'hats',
    akkorde: 'Am | E | Am | E | Dm | Am | E | Am',
    melodie: 'A4 . C5 . E5 . D5 C5 | B4 . G#4 . E4 . . . | A4 . C5 . E5 . A5 . | G#5 . E5 . B4 . . . | D5 . F5 . A5 . F5 D5 | C5 . E5 . A4 . . . | B4 . D5 . E5 . G#5 . | A5 . . . A4 . . .' },
  'px-kokytos': { bpm: 80, lead: { welle: 'dreieck' }, arp: 'glocke16', bass: 'halbe', drums: 'keine',
    akkorde: 'Bm | G | D | A | Bm | G | Em | F#',
    melodie: 'F#5 - - - D5 - B4 - | G5 - - - D5 - B4 - | A5 - - - F#5 - D5 - | E5 - - - - - . . | B5 - - - F#5 - D5 - | G5 - - - B5 - D6 - | B5 - - - G5 - E5 - | F#5 - - - A#4 - C#5 -' },
  'px-berg': { bpm: 120, lead: { welle: 'puls25' }, arp: 'arp16', bass: 'gehen', drums: 'leicht',
    akkorde: 'A | E | F#m | D | A | E | D E | A',
    melodie: 'E5 - A5 - - B5 C#6 - | B5 - - - G#5 - E5 - | A5 - - - F#5 - C#5 - | D5 - F#5 - A5 - - - | C#6 - - - B5 - A5 - | G#5 - - - E5 - B4 - | F#5 - A5 - G#5 - B5 - | A5 - - - - - . .' },
  'px-gipfel': { bpm: 96, lead: { welle: 'puls50' }, arp: 'akkord', bass: 'halbe', drums: 'feier',
    akkorde: 'F | C | Dm | Bb | F | C | Bb C | F',
    melodie: 'C5 - - - F5 - - - | E5 - - - G5 - - - | F5 - - - A5 - - - | Bb5 - - - - - . . | A5 - - - C6 - A5 - | G5 - - - E5 - C5 - | D5 - F5 - E5 - G5 - | F5 - - - - - . .' }
};

/* Noten und Akkorde lesen */
const HALBTON = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midiVon = (name, okt) => 12 * (okt + 1) + HALBTON[name[0]] + (name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0);
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
const AKKORD_ART = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], dim: [0, 3, 6] };
function notenwert(t){ const m = t.match(/^([A-G][#b]?)(\d)$/); return midiVon(m[1], Number(m[2])); }
function akkordVon(t){ const m = t.match(/^([A-G][#b]?)(.*)$/); return { grund: midiVon(m[1], 2), toene: AKKORD_ART[m[2]] || AKKORD_ART[''] }; }
/* Ein Stück in Sechzehntel zerlegen: wann welche Melodienote beginnt und welcher Akkord gilt */
const gelesen = {};
function lesen(key){
  if (gelesen[key]) return gelesen[key];
  const st = PIXEL_STUECKE[key], achtel = st.takt || 8, n16 = achtel * 2;
  const takte = st.melodie.split('|').map(t => t.trim()).filter(Boolean).map(t => t.split(/\s+/));
  const akk = st.akkorde.split('|').map(t => t.trim().split(/\s+/).map(akkordVon));
  const len = takte.length * n16, mel = {};
  let offen = null;
  takte.flat().forEach((tok, i) => {
    if (tok === '-') { if (offen) offen.d += 2; return; }
    offen = null;
    if (tok === '.') return;
    offen = mel[i * 2] = { m: notenwert(tok), d: 2 };
  });
  const akkordBei = s => { s = ((s % len) + len) % len; const teile = akk[Math.floor(s / n16) % akk.length]; return teile[Math.floor((s % n16) / (n16 / teile.length))]; };
  return gelesen[key] = { len, n16, mel, akkordBei };
}

/* Pulswellen wie auf alten Konsolen: 12,5, 25 oder 50 Prozent Tastverhältnis */
let pxRausch = null, pxZahl = 0;
const pxWellen = {};
function pxWelle(art){
  if (pxWellen[art]) return pxWellen[art];
  const duty = { puls12: 0.125, puls25: 0.25, puls50: 0.5 }[art], n = 48;
  const re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
  return pxWellen[art] = ctx.createPeriodicWave(re, im);
}
/* Ein Ton mit kurzer Hülle; lange Töne bekommen ein leichtes Vibrato */
function pxTon(ziel, art, f, t, dauer, pegel, extra = {}){
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    if (art === 'dreieck') o.type = 'triangle'; else o.setPeriodicWave(pxWelle(art));
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(pegel, t + 0.006);
    g.gain.setTargetAtTime(pegel * 0.72, t + 0.006, 0.09);
    g.gain.setTargetAtTime(0, t + dauer, 0.025);
    if (dauer > 0.3 && !extra.ohneVibrato) {
      const lfo = ctx.createOscillator(), tiefe = ctx.createGain();
      lfo.frequency.value = 5.5; tiefe.gain.setValueAtTime(0, t); tiefe.gain.linearRampToValueAtTime(f * 0.006, t + 0.35);
      lfo.connect(tiefe); tiefe.connect(o.frequency); lfo.start(t); lfo.stop(t + dauer + 0.2);
    }
    if (extra.knick) { o.frequency.setValueAtTime(f, t + dauer * 0.6); o.frequency.exponentialRampToValueAtTime(f * 0.89, t + dauer); }
    o.connect(g); g.connect(ziel);
    o.start(t); o.stop(t + dauer + 0.2);
    pxZahl++;
  } catch (e) {}
}
function pxRauschen(ziel, t, dauer, pegel, typ, freq){
  try {
    const q = ctx.createBufferSource(); q.buffer = pxRausch;
    const f = ctx.createBiquadFilter(); f.type = typ; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(pegel, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dauer);
    q.connect(f); f.connect(g); g.connect(ziel);
    q.start(t, Math.random() * 0.5); q.stop(t + dauer + 0.02);
  } catch (e) {}
}
function pxTrommel(ziel, t, start, ende, dauer, pegel){
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(start, t); o.frequency.exponentialRampToValueAtTime(ende, t + dauer);
    g.gain.setValueAtTime(pegel, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dauer);
    o.connect(g); g.connect(ziel); o.start(t); o.stop(t + dauer + 0.02);
  } catch (e) {}
}

/* Ein Stück starten: eigener Bus, kurz eingeblendet, ein Taktgeber plant immer ein Stück voraus */
function pxStarten(key){
  const st = PIXEL_STUECKE[key], noten = lesen(key), sek16 = 60 / st.bpm / 4, t = ctx.currentTime;
  const bus = ctx.createGain(); bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(PIXEL_PEGEL, t + 0.4); bus.connect(musikBus);
  let leadBus = bus;
  if (st.lead.echo) {
    leadBus = ctx.createGain(); leadBus.connect(bus);
    const verz = ctx.createDelay(1); verz.delayTime.value = sek16 * 3;
    const rueck = ctx.createGain(); rueck.gain.value = 0.3;
    const nass = ctx.createGain(); nass.gain.value = 0.35;
    leadBus.connect(verz); verz.connect(rueck); rueck.connect(verz); verz.connect(nass); nass.connect(bus);
  }
  const z = { key, px: true, st, noten, sek16, bus, leadBus, schritt: 0, zeit: t + 0.08 };
  z.timer = setInterval(() => pxPlanen(z), 25);
  pxPlanen(z);
  return z;
}
function pxStoppen(z, aus = 0.5){
  clearInterval(z.timer);
  const t = ctx.currentTime;
  try { z.bus.gain.cancelScheduledValues(t); z.bus.gain.setValueAtTime(z.bus.gain.value, t); z.bus.gain.linearRampToValueAtTime(0, t + aus); } catch (e) {}
  setTimeout(() => z.bus.disconnect(), (aus + 2) * 1000);
}
function pxPlanen(z){
  if (ctx.state !== 'running') return;
  if (z.zeit < ctx.currentTime) z.zeit = ctx.currentTime + 0.05;   // nach dem Aufwachen nicht alles nachholen
  while (z.zeit < ctx.currentTime + 0.12) {
    pxSechzehntel(z, z.schritt, z.zeit);
    z.schritt = (z.schritt + 1) % z.noten.len;
    z.zeit += z.sek16;
  }
}
function pxSechzehntel(z, s, t){
  const { st, noten, sek16 } = z, i = s % noten.n16, a = noten.akkordBei(s), viertel = noten.n16 === 12 ? 3 : 4;
  /* Melodie; im Großen Glitch stolpert sie manchmal oder knickt ab */
  const m = noten.mel[s];
  if (m) {
    const f = midiHz(m.m), dauer = m.d * sek16 * (st.lead.gate || 0.92), pegel = st.lead.welle === 'dreieck' ? 0.12 : 0.07;
    if (st.glitch && Math.random() < 0.12) {
      for (let k = 0; k < 3; k++) pxTon(z.leadBus, st.lead.welle, f * (k === 1 ? 2 : 1), t + k * sek16 / 2, sek16 * 0.4, pegel, { ohneVibrato: true });
    } else {
      pxTon(z.leadBus, st.lead.welle, f, t, dauer, pegel, { knick: st.glitch && Math.random() < 0.1 });
      if (st.lead.doppel) pxTon(z.leadBus, 'dreieck', f / 2, t, dauer, 0.09);
    }
  }
  /* Bass: Dreieck, Grundton und Quinte */
  const g = a.grund < 40 ? a.grund + 12 : a.grund, quinte = g + 7;
  const bass = (mm, d) => pxTon(z.bus, 'dreieck', midiHz(mm), t, d * sek16, 0.15, { ohneVibrato: true });
  if (st.bass === 'halbe' && i % 8 === 0) bass(g, 7.5);
  if (st.bass === 'gehen' && i % 4 === 0) bass((i / 4) % 2 ? quinte : g, 3.4);
  if (st.bass === 'marsch' && i % 4 === 0) bass((i / 4) % 2 ? quinte : g, 1.6);
  if (st.bass === 'treiben' && i % 2 === 0) bass((i / 2) % 2 ? g + 12 : g, 1.5);
  if (st.bass === 'walzer' && i === 0) bass(g, 3.5);
  /* Begleitung aus den Akkordtönen */
  const toene = a.toene.map(x => a.grund + 24 + x), arp = (art, mm, d, p) => pxTon(z.bus, art, midiHz(mm), t, d * sek16, p, { ohneVibrato: true });
  if (st.arp === 'arp16') arp('puls12', toene[i % toene.length] + 12, 0.85, 0.022);
  if (st.arp === 'arp8' && i % 2 === 0) arp('puls12', toene[(i / 2) % toene.length] + 12, 1.7, 0.022);
  if (st.arp === 'glocke16' && Math.random() < 0.5) arp('dreieck', toene[i % toene.length] + 24, 0.9, 0.05);
  if (st.arp === 'stakkato' && i % 4 === 2) toene.forEach(mm => arp('puls25', mm + 12, 0.8, 0.014));
  if (st.arp === 'walzer' && (i === 4 || i === 8)) toene.forEach(mm => arp('puls25', mm + 12, 1.4, 0.014));
  if (st.arp === 'akkord' && (i === 0 || noten.akkordBei(s - 1) !== a)) {
    const lang = i === 0 && noten.akkordBei(s + noten.n16 - 1) === a ? noten.n16 : noten.n16 / 2;
    toene.forEach(mm => arp('puls50', mm, lang * 0.95, 0.012));
  }
  /* Schlagzeug aus Rauschen, ohne Doppelschlag */
  const hat = p => pxRauschen(z.bus, t, 0.03, p, 'highpass', 7000);
  const snare = p => { pxRauschen(z.bus, t, 0.13, p, 'bandpass', 1900); pxTrommel(z.bus, t, 220, 160, 0.06, p * 0.8); };
  const kick = () => pxTrommel(z.bus, t, 130, 45, 0.13, 0.16);
  const zwei = i === viertel && viertel === 4, vier = i === 3 * viertel;
  if (st.drums === 'hats' && i % 4 === 2) hat(0.018);
  if (st.drums === 'leicht') { if (i % 2 === 0) hat(i % 4 === 2 ? 0.02 : 0.01); if (zwei || vier) snare(0.035); }
  if (st.drums === 'kick') { if (i % 2 === 0) hat(i % 4 === 2 ? 0.02 : 0.01); if (zwei || vier) snare(0.035); if (i === 0 || i === 8) kick(); }
  if (st.drums === 'treiben') { hat(i % 2 ? 0.008 : 0.016); if (zwei || vier) snare(0.04); if (i === 0 || i === 8) kick(); }
  if (st.drums === 'marsch') { if (zwei || vier) snare(0.04); if (i >= 13 && Math.floor(s / noten.n16) % 2 === 1) snare(0.018); if (i === 0) kick(); }
  if (st.drums === 'feier') { if (i === 0) pxTrommel(z.bus, t, 95, 62, 0.45, 0.2); if (i === 0 && Math.floor(s / noten.n16) % 4 === 0) pxRauschen(z.bus, t, 1.2, 0.015, 'highpass', 5000); }
  if (st.drums === 'walzer') { if (i === 0) kick(); if (i === 4 || i === 8) hat(0.016); }
}

/* Den Wunsch aus dem Spiel umsetzen: anderer Ort blendet über, gleicher Ort ändert nur den Bossgrund */
let ruheBis = 0, ruheTimer = 0;
function musikFolgen(){
  if (!ctx || !entsperrt) return;
  const key = musikAn && (KLANGORTE[wunsch.ort] || PIXEL_STUECKE[wunsch.ort]) ? wunsch.ort : null;
  if (spielt && spielt.key !== key) { if (spielt.px) pxStoppen(spielt); else ortAbbauen(spielt); spielt = null; }
  if (!key) return;
  /* Nach einem Pixelsieg schweigt die Musik kurz, damit die Fanfare allein klingt */
  const warten = ruheBis - ctx.currentTime;
  if (warten > 0) { clearTimeout(ruheTimer); ruheTimer = setTimeout(musikFolgen, warten * 1000 + 50); return; }
  fortsetzen();
  musikBauen();
  if (!spielt) spielt = PIXEL_STUECKE[key] ? pxStarten(key) : ortBauen(key);
  if (!spielt.px) bossPegel(spielt, !!wunsch.boss);
}

/* Das Spiel sagt bei jeder Ansicht, wo man ist: Ort (lagerfeuer, hoelle, kokytos, katakomben, berg, gipfel, ein Pixelstück px-… oder null für Stille) und ob ein Boss kämpft */
export function musik(ort, boss = false){
  wunsch = { ort: ort || null, boss: !!boss };
  musikFolgen();
}

/* Der Boss fällt: der Bossgrund weicht, und ein langsamer Dur-Akkord löst alles auf */
export function musikSieg(){
  if (!spielt || !musikAn) return;
  if (spielt.px) { pxStoppen(spielt, 0.2); spielt = null; ruheBis = ctx.currentTime + 1.8; musikFolgen(); return; }
  const z = spielt, o = z.o, t = ctx.currentTime + 0.3;
  let f0 = o.grund; while (f0 < 160) f0 *= 2;
  clearTimeout(z.timer);
  [0, 4, 7, 12].forEach((st, i) => musikTon(z, f0 * Math.pow(2, st / 12), t + i * 0.55, o.pegel * 0.9));
  z.timer = setTimeout(() => phrase(z), 7000);
  wunsch.boss = false;
  bossPegel(z, false);
}

/* Regler im Spielstand: Lautstärke der Musik von 0 bis 100, 50 ist der Grundpegel.
   Die Kurve ist gebogen wie bei einem echten Lautstärkeknopf, ganz rechts sind es rund 9 dB mehr. */
export function setzenLautstaerke(prozent){
  musikLaut = Math.pow(Math.max(0, Math.min(100, Number(prozent) || 0)) / 50, 1.5);
  if (musikBus) try { musikBus.gain.setTargetAtTime(MUSIK_PEGEL * musikLaut, ctx.currentTime, 0.08); } catch (e) {}
}

/* Schalter im Spielstand: Musik an oder aus; der Wind weht mit Musik etwas leiser */
export function setzenMusik(ein){
  musikAn = !!ein;
  if (!entsperrt) return;
  if (an) einblenden();
  musikFolgen();
}

/* Kampfklang: kurze Einzelklänge beim Antworten im Kampf. Eigener Bus, lauter als der Wind,
   aber kein schriller Alarm. Jeder Klang baut sich aus Rauschstößen und Tönen auf und klingt von selbst aus. */
let fx = null, fxAn = true, fxZahl = 0;

function fxBus(){
  if (!ctx) return false;
  if (!fx) { fx = ctx.createGain(); fx.gain.value = 0.35; fx.connect(ctx.destination); }
  fortsetzen();
  return true;
}

/* Eine weiche Hülle ohne Knacken: leise an, leise aus (nie ganz auf null, sonst meckert der Rampenbefehl) */
function huelle(g, t0, spitze, dauer, anstieg){
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(spitze, t0 + (anstieg || 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
}

/* Ein Ton mit fallender oder steigender Tonhöhe */
function stimme(typ, f0, f1, t0, dauer, spitze, ziel, anstieg){
  try {
    const o = ctx.createOscillator(); o.type = typ;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dauer);
    const g = ctx.createGain(); huelle(g, t0, spitze, dauer, anstieg);
    o.connect(g); g.connect(ziel || fx);
    o.start(t0); o.stop(t0 + dauer + 0.03);
  } catch (e) {}
}

/* Ein kurzer Rauschstoß durch einen Filter: Schwung, Knistern, dumpfer Schlag */
function rauschStoss(t0, dauer, spitze, filterTyp, f, Q){
  try {
    const laenge = Math.max(1, Math.ceil(ctx.sampleRate * dauer));
    const buf = ctx.createBuffer(1, laenge, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < laenge; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type = filterTyp; flt.frequency.value = f; if (Q) flt.Q.value = Q;
    const g = ctx.createGain(); huelle(g, t0, spitze, dauer);
    src.connect(flt); flt.connect(g); g.connect(fx);
    src.start(t0); src.stop(t0 + dauer + 0.03);
  } catch (e) {}
}

/* Rauschen, dessen Filter wandert: Fauchen eines Feuerballs, Zischen, Verpuffen. anstieg steuert, wie weich es kommt */
function rauschZug(t0, dauer, spitze, filterTyp, f0, f1, Q, anstieg){
  try {
    const laenge = Math.max(1, Math.ceil(ctx.sampleRate * dauer));
    const buf = ctx.createBuffer(1, laenge, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < laenge; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const flt = ctx.createBiquadFilter(); flt.type = filterTyp; flt.Q.value = Q || 1;
    flt.frequency.setValueAtTime(f0, t0); flt.frequency.exponentialRampToValueAtTime(f1, t0 + dauer);
    const g = ctx.createGain(); huelle(g, t0, spitze, dauer, anstieg);
    src.connect(flt); flt.connect(g); g.connect(fx);
    src.start(t0); src.stop(t0 + dauer + 0.03);
  } catch (e) {}
}
/* Ein Klangkörper aus mehreren Teiltönen, die verschieden lang nachklingen: Klinge, Schildrand, Glocke */
function koerper(f, teile, t0, spitze){
  teile.forEach(([faktor, anteil, dauer]) => stimme('sine', f * faktor, f * faktor, t0, dauer, spitze * anteil));
}

/* Die Klassen klingen im Kampf nach ihrer Waffe. Richtig: Der Krieger schneidet mit singender Klinge, der Magier wirft
   einen Feuerball, der Priester schlägt eine helle Glocke. Falsch: Der Krieger fängt den Hieb mit dem Schild,
   dem Magier verpufft der Zauber, die Glocke des Priesters klingt gedämpft. */
/* Die Klinge singt hoch und klar: eng liegende, unharmonische Teiltöne zwischen 2,8 und 6 kHz, die gegeneinander schweben */
const KLINGE = [[2821, 0.3, 0.45], [4156, 0.8, 0.9], [4285, 0.7, 0.85], [4393, 0.5, 0.6], [5577, 0.5, 0.8], [5943, 0.45, 0.75], [6008, 1, 0.7]];
const SCHILD = [[1, 1, 0.32], [1.58, 0.6, 0.22], [2.31, 0.3, 0.14]];
const GLOCKE = [[1, 1, 1.6], [2, 0.45, 1.1], [2.76, 0.3, 0.8], [5.4, 0.12, 0.4]];
function klasseKlingt(art, gut, t0){
  if (art === 'stahl') {
    if (gut) {
      rauschZug(t0, 0.22, 0.07, 'bandpass', 5500, 9500, 0.8, 0.17);           // die Klinge zischt heran
      const t = t0 + 0.2, v = 0.97 + Math.random() * 0.06;
      rauschStoss(t, 0.09, 0.5, 'bandpass', 3800, 0.6);                        // der Schnitt
      stimme('sine', 560, 320, t, 0.09, 0.1);
      KLINGE.forEach(([f, anteil, dauer]) => stimme('sine', f * v, f * v, t + 0.015, dauer, 0.07 * anteil, null, 0.004));  // das helle Singen der Klinge
    } else {
      rauschStoss(t0, 0.16, 0.36, 'lowpass', 320);                             // der Hieb trifft den Schild
      stimme('sine', 125, 62, t0, 0.24, 0.38);
      rauschStoss(t0, 0.05, 0.2, 'bandpass', 820, 3);                          // Holz und Beschlag
      koerper(310, SCHILD, t0 + 0.005, 0.07);                                  // der Schildrand dröhnt kurz nach
    }
  } else if (art === 'feuer') {
    if (gut) {
      rauschZug(t0, 0.32, 0.22, 'bandpass', 320, 2300, 1.6, 0.22);            // der Feuerball faucht heran
      stimme('sine', 180, 330, t0 + 0.04, 0.26, 0.06);
      const t = t0 + 0.3;
      rauschStoss(t, 0.5, 0.3, 'lowpass', 900);                                // Einschlag
      stimme('sine', 95, 38, t, 0.5, 0.28);
      for (let i = 0; i < 6; i++) rauschStoss(t + 0.05 + i * (0.04 + Math.random() * 0.05), 0.03, 0.09, 'bandpass', 2000 + Math.random() * 2600, 3);  // Glut prasselt
    } else {
      rauschZug(t0, 0.3, 0.12, 'bandpass', 1900, 360, 2, 0.02);               // der Zauber verpufft
      stimme('triangle', 520, 140, t0, 0.28, 0.08);
      rauschStoss(t0 + 0.06, 0.14, 0.28, 'lowpass', 300);
      stimme('sine', 140, 88, t0 + 0.06, 0.18, 0.28);
    }
  } else if (art === 'heilig') {
    if (gut) {
      koerper(1046.5, GLOCKE, t0, 0.07);                                       // zwei helle Glocken, die zweite eine Quinte höher
      koerper(1568, GLOCKE, t0 + 0.12, 0.05);
      stimme('sine', 523, 784, t0, 0.6, 0.05);                                 // ein warmer Schein darunter
      rauschZug(t0, 0.7, 0.025, 'highpass', 5000, 9000, 0.7, 0.3);             // ein Hauch Luft
      stimme('triangle', 300, 110, t0, 0.14, 0.16);
    } else {
      rauschStoss(t0, 0.12, 0.26, 'lowpass', 300);
      stimme('sine', 150, 92, t0, 0.16, 0.28);
      koerper(392, GLOCKE.map(([f, a, d]) => [f, a, d * 0.3]), t0 + 0.05, 0.06); // die Glocke, mit der Hand gedämpft
    }
  }
}
const KLASSEN_KLANG = new Set(['stahl', 'feuer', 'heilig']);

/* Jeder Ort klingt anders: die Hölle knistert, die Katakomben raunen tief, der Berg schimmert hell, der Gipfel klingt nach Stahl */
function faerbung(art, t0){
  if (art === 'feuer') { for (let i = 0; i < 4; i++) rauschStoss(t0 + 0.02 + i * 0.03, 0.05, 0.1, 'bandpass', 1700 + Math.random() * 1300, 3); }
  else if (art === 'schatten') { stimme('sine', 92, 60, t0, 0.5, 0.11); stimme('sine', 138, 104, t0, 0.5, 0.05); }
  else if (art === 'heilig') { stimme('sine', 1320, 1320, t0, 0.5, 0.07); stimme('sine', 1980, 1980, t0, 0.42, 0.035); }
  else { stimme('triangle', 2100, 1900, t0, 0.28, 0.06); }
}
/* Ohne Klasse richtet sich die Klangfarbe nach dem Ort: Hölle Feuer, Katakomben Schatten, Berg heilig, sonst Stahl */
const ORT_KLANG = { 0: 'schatten', 1: 'feuer', 2: 'heilig' };

/* Treffer oder daneben: der Hauptklang beim Antworten im Kampf */
export function schlag(info){
  if (!fxAn || !fxBus()) return;
  fxZahl++;
  const t0 = ctx.currentTime, akt = info && info.akt;
  /* Mit gewählter Klasse klingt ihre Waffe; der Fall des Bosses und die Mimic-Truhe klingen wie immer */
  if (info && KLASSEN_KLANG.has(info.klang) && !info.mimic) {
    klasseKlingt(info.klang, !!info.gut, t0);
    if (info.gut && info.wucht) { stimme('sine', 72, 44, t0 + 0.12, 0.6, 0.45); rauschStoss(t0 + 0.12, 0.28, 0.22, 'lowpass', 380); }
    return;
  }
  if (info && info.gut) {
    rauschStoss(t0, 0.09, 0.2, 'highpass', 900);
    stimme('triangle', 320, 90, t0 + 0.045, 0.18, 0.4);
    faerbung((info && info.klang) || ORT_KLANG[akt] || 'stahl', t0 + 0.045);
    if (info.wucht) { stimme('sine', 72, 44, t0 + 0.045, 0.6, 0.45); rauschStoss(t0 + 0.045, 0.28, 0.22, 'lowpass', 380); }
  } else if (info && info.mimic) {
    rauschStoss(t0, 0.07, 0.32, 'bandpass', 720, 2);
    stimme('sawtooth', 190, 70, t0, 0.13, 0.26);
  } else {
    rauschStoss(t0, 0.12, 0.26, 'lowpass', 300);
    stimme('sine', 150, 92, t0, 0.16, 0.3);
  }
}

/* Ein Schluck Kaffee: ein warmer, steigender Ton */
export function heilen(){
  if (!fxAn || !fxBus()) return;
  fxZahl++;
  const t0 = ctx.currentTime;
  stimme('sine', 520, 790, t0, 0.5, 0.26);
  stimme('sine', 790, 790, t0 + 0.08, 0.4, 0.1);
}

/* Stufenaufstieg: ein kleiner, heller Aufstieg */
export function aufstieg(){
  if (!fxAn || !fxBus()) return;
  fxZahl++;
  const t0 = ctx.currentTime;
  [523, 659, 784, 1046].forEach((f, i) => stimme('triangle', f, f, t0 + i * 0.09, 0.22, 0.24));
}

/* Das Pixelparadies klingt nach 8 Bit: Rechteck- und Dreieckswellen, kurze Tonfolgen, ein Knall aus Rauschen.
   Läuft über denselben Bus und denselben Schalter wie der Kampfklang. stufe macht Kombos von Mal zu Mal höher. */
const NOTE = { C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, B5: 988, C6: 1047, E6: 1319, G6: 1568, C7: 2093 };
export function chip(art, stufe = 0){
  if (!fxAn || !fxBus()) return;
  fxZahl++;
  const t0 = ctx.currentTime, folge = (noten, abstand, dauer, typ = 'square', laut = .09) =>
    noten.forEach((n, i) => stimme(typ, NOTE[n] || n, NOTE[n] || n, t0 + i * abstand, dauer, laut));
  if (art === 'treffer') folge(['E5', 'B5'], .055, .09);
  else if (art === 'splitter') { folge(['B5'], 0, .05); stimme('square', NOTE.E6, NOTE.E6, t0 + .05, .16, .08); }
  else if (art === 'daneben') { stimme('square', 300, 90, t0, .26, .1); rauschStoss(t0, .08, .12, 'lowpass', 900); }
  else if (art === 'wuerfel') { folge(['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], .065, .12, 'square', .08); folge(['C6', 'E6', 'G6', 'C7'], .065, .2, 'triangle', .1); }
  else if (art === 'kombo') folge(['C5', 'E5', 'G5', 'C6'].map(n => NOTE[n] * Math.pow(2, Math.min(4, stufe) / 12)), .05, .09, 'square', .08);
  else if (art === 'boom') {
    rauschStoss(t0, .55, .5, 'lowpass', 1100);
    rauschStoss(t0 + .02, .3, .3, 'bandpass', 420, 1.2);
    stimme('square', 140, 38, t0, .5, .22);
    stimme('triangle', 90, 30, t0, .7, .3);
  }
  else if (art === 'entschaerft') { folge(['G6', 'C7'], .07, .12, 'triangle', .1); rauschStoss(t0, .05, .08, 'highpass', 3000); }
  else if (art === 'herz') folge(['C5', 'G5', 'C6'], .07, .14, 'triangle', .14);
  else if (art === 'absturz') { stimme('square', 900, 110, t0, .75, .09); stimme('triangle', 450, 55, t0 + .05, .75, .1); }
  else if (art === 'sieg') { folge(['G5', 'G5', 'G5'], .11, .09, 'square', .09); stimme('square', NOTE.C6, NOTE.C6, t0 + .36, .45, .1); stimme('triangle', NOTE.E6, NOTE.E6, t0 + .36, .5, .1); }
  else if (art === 'tor') folge(['C5', 'G5', 'C6', 'G5', 'C6', 'E6'], .08, .1, 'triangle', .12);
}

/* Schalter im Spielstand: Kampfklang an oder aus */
export function setzenFx(ein){ fxAn = !!ein; }

/* Nur zum Testen: alle Stücke, die musik() kennt */
export const musikStuecke = () => Object.keys(KLANGORTE).concat(Object.keys(PIXEL_STUECKE));

/* Nur zum Testen: so tun, als hätte das Handy den Ton angehalten */
export const aussetzen = () => ctx ? ctx.suspend() : null;

/* Nur zum Testen: der innere Stand, ohne etwas zu verändern */
export const zustand = () => ({ entsperrt, an, windAn, fxAn, fx: fxZahl, musikAn, lautstaerke: Math.round(musikLaut * 100) / 100, musikOrt: spielt ? spielt.key : null, boss: !!(spielt && spielt.boss), toene: musikZahl, pxToene: pxZahl, state: ctx ? ctx.state : 'kein' });
