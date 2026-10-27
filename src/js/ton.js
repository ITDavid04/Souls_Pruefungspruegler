/* Die Tonebene: ein ruhiger Wind, prozedural aus Rauschen gebaut, ganz ohne Audiodateien.
   Er weht erst, nachdem der Finger das erste Mal getippt hat, weil der Browser Ton bis zum ersten
   Gestus sperrt. Alles schwillt langsam an und ab, nie plötzlich, passend zum ruhigen Ton des Spiels:
   kein Herzschlag, kein Zappeln. Wer den Tab wegklickt, bei dem schläft der Wind und wacht später wieder auf. */

const ZIEL = 0.05;        // Grundlautstärke, bewusst leise
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

function einblenden(){ if (ctx) try { master.gain.setTargetAtTime(ZIEL, ctx.currentTime, 2.5); } catch (e) {} }
function ausblenden(){ if (ctx) try { master.gain.setTargetAtTime(0, ctx.currentTime, 1.2); } catch (e) {} }
function fortsetzen(){ if (ctx && ctx.state === 'suspended') try { ctx.resume(); } catch (e) {} }

/* Der erste Gestus entsperrt den Ton; danach weht der Wind, wenn er angeschaltet ist */
export function wecken(){
  if (entsperrt) return;
  if (!sicherstellen()) return;
  entsperrt = true;
  fortsetzen();
  if (an) { windBauen(); einblenden(); }
}

/* Schalter im Spielstand: an oder aus. Vor dem ersten Gestus merkt er sich nur den Wunsch */
export function setzen(ein){
  an = !!ein;
  if (!entsperrt) return;
  fortsetzen();
  if (an) { windBauen(); einblenden(); } else ausblenden();
}

/* Tab sichtbar oder versteckt: den Wind schlafen legen und wieder wecken */
export function sichtbar(ja){
  if (!ctx || !entsperrt || !an) return;
  try { if (ja) ctx.resume(); else ctx.suspend(); } catch (e) {}
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
export const zustand = () => ({ entsperrt, an, windAn, fxAn, fx: fxZahl, state: ctx ? ctx.state : 'kein' });
