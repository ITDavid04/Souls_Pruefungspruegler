/* Die Tonebene: ein ruhiger Wind, prozedural aus Rauschen gebaut, ganz ohne Audiodateien.
   Er weht erst, nachdem der Finger das erste Mal getippt hat, weil der Browser Ton bis zum ersten
   Gestus sperrt. Alles schwillt langsam an und ab, nie plötzlich, passend zum ruhigen Ton des Spiels:
   kein Herzschlag, kein Zappeln. Wer den Tab wegklickt, bei dem schläft der Wind und wacht später wieder auf. */

const ZIEL = 0.05;        // Grundlautstärke, bewusst leise; mit Musik weht er leiser, damit sie nicht untergeht
const windZiel = () => musikAn ? ZIEL * 0.6 : ZIEL;
let ctx = null, master = null, windAn = false, an = true, entsperrt = false;

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
function fortsetzen(){ if (ctx && ctx.state === 'suspended') try { ctx.resume(); } catch (e) {} }

/* Der erste Gestus entsperrt den Ton; danach weht der Wind, wenn er angeschaltet ist */
export function wecken(){
  if (entsperrt) return;
  if (!sicherstellen()) return;
  entsperrt = true;
  fortsetzen();
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
  if (!ctx || !entsperrt || !(an || musikAn)) return;
  try { if (ja) ctx.resume(); else ctx.suspend(); } catch (e) {}
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

let musikAn = true, musikBus = null, hall = null, knisterBuf = null, spielt = null;
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
  musikBus = ctx.createGain(); musikBus.gain.value = MUSIK_PEGEL;
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

/* Den Wunsch aus dem Spiel umsetzen: anderer Ort blendet über, gleicher Ort ändert nur den Bossgrund */
function musikFolgen(){
  if (!ctx || !entsperrt) return;
  const key = musikAn && KLANGORTE[wunsch.ort] ? wunsch.ort : null;
  if (spielt && spielt.key !== key) { ortAbbauen(spielt); spielt = null; }
  if (!key) return;
  fortsetzen();
  musikBauen();
  if (!spielt) spielt = ortBauen(key);
  bossPegel(spielt, !!wunsch.boss);
}

/* Das Spiel sagt bei jeder Ansicht, wo man ist: Ort (lagerfeuer, hoelle, kokytos, katakomben, berg, gipfel oder null für Stille) und ob ein Boss kämpft */
export function musik(ort, boss = false){
  wunsch = { ort: ort || null, boss: !!boss };
  musikFolgen();
}

/* Der Boss fällt: der Bossgrund weicht, und ein langsamer Dur-Akkord löst alles auf */
export function musikSieg(){
  if (!spielt || !musikAn) return;
  const z = spielt, o = z.o, t = ctx.currentTime + 0.3;
  let f0 = o.grund; while (f0 < 160) f0 *= 2;
  clearTimeout(z.timer);
  [0, 4, 7, 12].forEach((st, i) => musikTon(z, f0 * Math.pow(2, st / 12), t + i * 0.55, o.pegel * 0.9));
  z.timer = setTimeout(() => phrase(z), 7000);
  wunsch.boss = false;
  bossPegel(z, false);
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
  if (ctx.state === 'suspended') try { ctx.resume(); } catch (e) {}
  return true;
}

/* Eine weiche Hülle ohne Knacken: leise an, leise aus (nie ganz auf null, sonst meckert der Rampenbefehl) */
function huelle(g, t0, spitze, dauer, anstieg){
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(spitze, t0 + (anstieg || 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer);
}

/* Ein Ton mit fallender oder steigender Tonhöhe */
function stimme(typ, f0, f1, t0, dauer, spitze, ziel){
  try {
    const o = ctx.createOscillator(); o.type = typ;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dauer);
    const g = ctx.createGain(); huelle(g, t0, spitze, dauer);
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

/* Nur zum Testen: der innere Stand, ohne etwas zu verändern */
export const zustand = () => ({ entsperrt, an, windAn, fxAn, fx: fxZahl, musikAn, musikOrt: spielt ? spielt.key : null, boss: !!(spielt && spielt.boss), toene: musikZahl, state: ctx ? ctx.state : 'kein' });
