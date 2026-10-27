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

/* Nur zum Testen: der innere Stand, ohne etwas zu verändern */
export const zustand = () => ({ entsperrt, an, windAn, state: ctx ? ctx.state : 'kein' });
