/* Prüfungsprügler: Oberfläche und Spielablauf.
   Ablauf: Lagerfeuer -> Kreis wählen -> Gang (10 Karten) -> Lagerfeuer. Nach drei Lagerfeuern im Kreis öffnet das Nebeltor zum Boss.
   Sechs Bosse im Abstieg (AP1) öffnen den Kokytos mit dem Zwischenprüfer; wer ihn besiegt, steigt den Berg hinauf (AP2).
   Liegen alle dreizehn, wartet hinter der Feuerwand der Prüfungsausschuss.
   Alles liegt im localStorage: spp.spiel (Spielstand) und spp.prog (Lernkasten je Karte). */
import * as K from './kern.js';
import { AKTE, KREISE, kreis, kreiseVon, ARENEN, BILD_LAGE, TITEL_BILD, BERG_BILD, ABSPANN_BILD, TITEL_ZITAT, INSCHRIFT, WIEDERKEHR, DURCHGANG, RAST, RAST_BERG, TREFFER, DANEBEN } from './welt.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const zahl = n => Number(n).toLocaleString('de-DE');
const ruhig = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const KARTEN = JSON.parse($('#karten').textContent);
const KARTE = new Map(KARTEN.map(c => [c.i, c]));

const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k){ try { localStorage.removeItem(k); } catch (e) {} }
};
const SPIEL = 'spp.spiel', PROG = 'spp.prog';
const neuesSpiel = () => ({
  v: 2, gestartet: false, stufe: 1, seelen: 0, verdient: 0, tode: 0, antworten: 0, flakons: 3, roestung: 0, ng: 0,
  blut: null, kreise: {}, arenen: {}, aufstieg: false, bestanden: 0, probe: false, lauf: null, zeige: null
});
let S = Object.assign(neuesSpiel(), store.get(SPIEL, {}) || {});
let prog = store.get(PROG, {}) || {};
/* Spielstände aus dem ersten Prototyp: Ort hieß dort lf, der Boss hatte nur Lebenspunkte */
if (S.blut && S.blut.ort === undefined) S.blut.ort = S.blut.lf;
if (S.lauf && S.lauf.ort === undefined) S.lauf.ort = S.lauf.lf;
if (S.lauf && S.lauf.art === 'boss' && S.lauf.phase === undefined) Object.assign(S.lauf, { phase: 0, phaseTreffer: K.BOSS_TREFFER - (S.lauf.bossLeben ?? K.BOSS_TREFFER) });
if (S.zeige && S.zeige.ort === undefined && S.zeige.lf !== undefined) S.zeige.ort = S.zeige.lf;

const sichern = () => { store.set(SPIEL, S); store.set(PROG, prog); };
const kz = lf => S.kreise[lf] || (S.kreise[lf] = { feuer: 0, boss: false });
const az = id => S.arenen[id] || (S.arenen[id] = { boss: false, versuche: 0 });
const besiegt = ort => typeof ort === 'number' ? kz(ort).boss : az(ort).boss;
const aufstiegOffen = () => S.aufstieg || S.probe;
const kreisOffen = lf => kreis(lf).akt === 1 || aufstiegOffen();
const arenaOffen = id => S.probe || ARENEN[id].voraus.every(besiegt);
const fehlend = id => ARENEN[id].voraus.filter(o => !besiegt(o)).length;
const maxLeben = () => K.maxLeben(S.stufe);
const heilung = () => K.heilung(S.roestung);

/* Alles, was ein Kampfort braucht. Ein Kreis ist eine Arena mit einer Phase und den üblichen Regeln. */
function ortDaten(ort){
  if (typeof ort === 'string') return ARENEN[ort];
  const k = kreis(ort);
  return Object.assign({}, k, {
    id: ort, ort: k.name, kaffee: 'ja', zeit: 0, tippfehler: 0, seelen: K.bossSeelen(k.akt), phasenWort: '',
    phasen: [{ name: k.boss, zusatz: k.bossZusatz, lfs: [ort], treffer: K.BOSS_TREFFER }]
  });
}
const ortSeite = ort => typeof ort === 'number' ? '#/kreis/' + ort : '#/' + ort;
const bossName = ort => ortDaten(ort).boss;

const app = $('#app');

/* ---------- Hintergrund mit Überblendung, dazu Schnee oder Glut ---------- */
let bgAktiv = 'a', bgName = null;
function hintergrund(name, art = '', wetter = ''){
  document.body.dataset.bg = art;
  document.body.dataset.wetter = wetter;
  if (name === bgName) return;
  bgName = name;
  const naechst = bgAktiv === 'a' ? 'b' : 'a', el = $('#bg-' + naechst);
  const zeigen = () => { el.classList.add('an'); $('#bg-' + bgAktiv).classList.remove('an'); bgAktiv = naechst; };
  if (!name) { el.style.backgroundImage = ''; zeigen(); return; }
  const im = new Image();
  im.onload = im.onerror = zeigen;
  im.src = 'img/' + name + '.webp';
  el.style.backgroundImage = 'url("' + im.src + '")';
  el.style.backgroundPosition = BILD_LAGE[name] || '';
}
const wetterVon = ort => ort === 'kokytos' ? 'schnee' : ort === 'gipfel' ? 'glut' : '';

/* ---------- Kleine Bausteine ---------- */
/* Lagerfeuer: Holz, ein Schwert im Feuer, drei Flammen, Funken */
const FLAMME = '<div class="flamme" aria-hidden="true"><svg viewBox="0 -34 100 168">' +
  '<defs>' +
    '<linearGradient id="fl-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c2c0a"/><stop offset="1" stop-color="#f07a2a"/></linearGradient>' +
    '<linearGradient id="fl-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ee8a34"/><stop offset="1" stop-color="#ffd06a"/></linearGradient>' +
    '<linearGradient id="fl-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6a0"/><stop offset="1" stop-color="#fffbe8"/></linearGradient>' +
  '</defs>' +
  '<g class="schwert"><rect x="48" y="-30" width="4" height="130" rx="1" fill="#8d8a86"/><rect x="40" y="-16" width="20" height="4" rx="2" fill="#6d6560"/><rect x="48.5" y="-34" width="3" height="16" fill="#4a3a30"/></g>' +
  '<g class="holz"><rect x="10" y="118" width="80" height="9" rx="4.5" fill="#3a2414" transform="rotate(-9 50 122)"/><rect x="10" y="118" width="80" height="9" rx="4.5" fill="#4a2e18" transform="rotate(9 50 122)"/></g>' +
  '<path class="fl fl-a" fill="url(#fl-a)" d="M50 4C58 30 84 46 84 82C84 108 68 124 50 124C32 124 16 108 16 82C16 60 28 50 34 34C37 48 42 54 46 56C46 36 42 22 50 4Z"/>' +
  '<path class="fl fl-b" fill="url(#fl-b)" d="M50 34C56 54 72 66 72 90C72 110 62 122 50 122C38 122 28 110 28 90C28 74 38 66 42 54C45 64 48 68 50 70C50 58 48 46 50 34Z"/>' +
  '<path class="fl fl-c" fill="url(#fl-c)" d="M50 66C55 80 62 88 62 100C62 114 57 121 50 121C43 121 38 114 38 100C38 88 46 80 50 66Z"/>' +
  '</svg><b></b><b></b><b></b><b></b></div>';
const TASSE = '<svg class="tasse" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2.5c-1 1.2 1 2 0 3.5M12 2.5c-1 1.2 1 2 0 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".7"/><path d="M4 8h13v6.5A5.5 5.5 0 0 1 11.5 20h-2A5.5 5.5 0 0 1 4 14.5Z" fill="currentColor"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 22h15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const feuerPunkte = n => '<span class="feuer-punkte" aria-label="' + n + ' von ' + K.FEUER_ZUM_TOR + ' Lagerfeuern">' +
  Array.from({ length: K.FEUER_ZUM_TOR }, (_, i) => '<i class="' + (i < n ? 'an' : '') + '"></i>').join('') + '</span>';
const kreisMarke = k => k.nr + ' · ' + (k.akt === 1 ? 'LF' + k.lf : 'AP2');
function kreisZahlen(lf){
  const t = K.heute(), pool = KARTEN.filter(c => c.l === lf);
  return {
    gesamt: pool.length,
    sitzen: pool.filter(c => K.sitzt(prog, c)).length,
    faellig: pool.filter(c => K.faellig(prog, c, t)).length,
    neu: pool.filter(c => K.stand(prog, c).b === 0).length
  };
}
function fokus(sel){ setTimeout(() => { const el = $(sel); if (el) el.focus({ preventScroll: true }); }, 50); }
/* Vibrieren erlaubt Chrome erst, wenn auf der Seite schon einmal getippt wurde (die Prüfungsuhr kann vorher ablaufen) */
function vibrieren(muster){
  try { if (navigator.vibrate && !(navigator.userActivation && !navigator.userActivation.hasBeenActive)) navigator.vibrate(muster); } catch (e) {}
}

/* ---------- Ansichten ---------- */
let rastSatz = null;
/* Der Titel kommt bei jedem Start der App, nicht nur beim ersten; erst danach geht es dorthin, wo man war */
let titelGezeigt = false, aufraeumen = null;
function render(){
  stoppeUhr();
  if (aufraeumen) { aufraeumen(); aufraeumen = null; }
  document.documentElement.classList.toggle('im-kampf', titelGezeigt && !!S.lauf && !S.zeige);
  if (!titelGezeigt) return titel();
  if (S.zeige) return zeige();
  if (S.lauf) return kampf();
  let m = location.hash.match(/^#\/kreis\/(\d+)$/);
  if (m && kreis(Number(m[1])) && kreisOffen(Number(m[1]))) return kreisSeite(Number(m[1]));
  m = location.hash.match(/^#\/(kokytos|gipfel)$/);
  if (m) return arenaSeite(m[1]);
  return lagerfeuer();
}
window.addEventListener('hashchange', () => { rastSatz = null; render(); window.scrollTo(0, 0); });

/* Titel: bei jedem Start. Wer zum ersten Mal hier ist, bekommt die Regeln, alle anderen einen Satz, der sich erinnert. */
function titel(){
  hintergrund(TITEL_BILD, 'titel', 'nebel');
  const erstes = !S.gestartet, L = S.lauf;
  const bosse = KREISE.filter(k => kz(k.lf).boss).length + Object.keys(ARENEN).filter(id => besiegt(id)).length;
  let satz = TITEL_ZITAT, knopf = 'Hinabsteigen', klein = '';
  if (!erstes) {
    satz = L ? WIEDERKEHR.lauf : S.blut ? WIEDERKEHR.blut.replace('{seelen}', zahl(S.blut.seelen))
      : S.tode > 1 ? WIEDERKEHR.tode.replace('{tode}', zahl(S.tode)) : S.tode === 1 ? WIEDERKEHR.tod1 : K.pick(WIEDERKEHR.sonst);
    knopf = L && L.leben > 0 && !S.zeige ? 'Weiterkämpfen' : 'Am Lagerfeuer erwachen';
    if (L && L.leben > 0 && !S.zeige) {
      const O = ortDaten(L.ort);
      klein = esc(O.ort) + ' · ' + (L.art === 'boss' ? esc(O.phasen[L.phase].name) : 'Karte ' + (L.pos + 1) + ' von ' + L.plan.length);
    }
  }
  app.innerHTML =
    '<main class="titel' + (erstes ? ' erstes' : '') + '">' +
      '<p class="inschrift" aria-hidden="true">' + esc(INSCHRIFT) + '</p>' +
      '<div class="titel-unten">' +
        '<p class="ueber">AP1 und AP2 · Fachinformatik</p>' +
        '<h1 class="logo">Prüfungs&shy;prügler</h1>' +
        '<blockquote class="zitat">' + esc(satz) + '</blockquote>' +
        (erstes ? '' : '<p class="titel-stand">Stufe <b>' + S.stufe + '</b> · <b>' + zahl(S.seelen) + '</b> Seelen · <b>' + bosse + '</b> von 14 Bossen · <b>' + zahl(S.tode) + '</b> ' + (S.tode === 1 ? 'Tod' : 'Tode') + '</p>') +
        '<button type="button" class="knopf haupt" id="los">' + knopf + (klein ? '<small>' + klein + '</small>' : '') + '</button>' +
        (erstes ? '<ul class="regeln">' +
          '<li><b>Richtig</b> bringt Seelen, <b>falsch</b> kostet Leben.</li>' +
          '<li><b>Stirbst du</b>, bleiben deine Seelen bei der Karte, die dich erledigt hat. Beantworte sie im nächsten Gang richtig, und sie gehören wieder dir.</li>' +
          '<li><b>Drei Lagerfeuer</b> in einem Kreis öffnen das Nebeltor zum Boss.</li>' +
          '<li>Unten im Eis wartet der <b>Zwischenprüfer</b>. Dahinter geht es den Berg der AP2 hinauf, bis zum <b>Prüfungsausschuss</b>.</li>' +
        '</ul>' : '') +
      '</div>' +
    '</main>';
  let los = false;
  $('#los').addEventListener('click', () => {
    if (los) return;
    los = true;
    S.gestartet = true; sichern();
    const weiter = () => { titelGezeigt = true; render(); window.scrollTo(0, 0); };
    if (ruhig()) return weiter();
    document.body.classList.add('abstieg');
    setTimeout(() => { weiter(); requestAnimationFrame(() => document.body.classList.remove('abstieg')); }, 700);
  });
  aufraeumen = spuk();
  fokus('#los');
}

/* Der Spuk auf dem Titel: Asche, Augen im Torbogen, geflüsterte Begriffe, flackerndes Licht. Läuft nur dort und nie bei weniger Bewegung. */
function spuk(){
  if (ruhig()) return null;
  const huelle = document.createElement('div');
  huelle.className = 'spuk';
  huelle.setAttribute('aria-hidden', 'true');
  huelle.innerHTML = '<div class="tor-glut"></div><canvas class="asche"></canvas><div class="augen"></div><div class="fluestern"></div>';
  $('.bg').appendChild(huelle);
  const uhren = [];
  const spaeter = (fn, ms) => uhren.push(setTimeout(fn, ms));

  /* Asche steigt auf, ein paar Funken dazwischen */
  const cv = $('.asche', huelle), ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0, raf = 0;
  const groesse = () => { W = cv.width = Math.floor(window.innerWidth * dpr); H = cv.height = Math.floor(window.innerHeight * dpr); };
  groesse();
  window.addEventListener('resize', groesse);
  const neu = anfang => ({
    x: Math.random() * W, y: anfang ? Math.random() * H : H + 10 * dpr, r: (Math.random() * 1.5 + 0.4) * dpr,
    vy: -(Math.random() * 0.35 + 0.08) * dpr, vx: (Math.random() - 0.5) * 0.25 * dpr, a: Math.random() * 0.45 + 0.12,
    glut: Math.random() < 0.16, t: Math.random() * 6.28
  });
  const teile = Array.from({ length: 70 }, () => neu(true));
  const zeichnen = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of teile) {
      p.t += 0.02; p.x += p.vx + Math.sin(p.t) * 0.3 * dpr; p.y += p.vy;
      if (p.y < -10 * dpr) Object.assign(p, neu(false));
      ctx.fillStyle = p.glut ? 'rgba(255,130,50,' + p.a + ')' : 'rgba(205,198,190,' + (p.a * 0.7) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    raf = requestAnimationFrame(zeichnen);
  };
  zeichnen();

  /* Augen öffnen sich im dunklen Torbogen, blinzeln, schließen sich wieder; höchstens zwei Paare gleichzeitig */
  const augen = $('.augen', huelle);
  const auge = () => {
    if (augen.childElementCount < 2) {
      const e = document.createElement('i');
      e.className = 'auge';
      const breit = window.innerWidth > window.innerHeight;
      e.style.left = (breit ? 42 + Math.random() * 14 : 34 + Math.random() * 28) + '%';
      e.style.top = (breit ? 14 + Math.random() * 24 : 9 + Math.random() * 18) + 'vh';
      e.style.setProperty('--s', (0.6 + Math.random() * 0.8).toFixed(2));
      e.style.setProperty('--dauer', (4 + Math.random() * 3).toFixed(1) + 's');
      augen.appendChild(e);
      spaeter(() => e.remove(), 7500);
    }
    spaeter(auge, 2600 + Math.random() * 3200);
  };
  spaeter(auge, 1600);

  /* Geflüsterte Begriffe aus den Karten, kaum zu lesen */
  const fluestern = $('.fluestern', huelle);
  const fluester = () => {
    const w = document.createElement('span');
    w.textContent = '… ' + K.pick(KARTEN).n.replace(/\s*\(.*?\)\s*/g, '').toLowerCase() + ' …';
    w.style.left = (4 + Math.random() * 56) + '%';
    w.style.top = (6 + Math.random() * 84) + '%';
    fluestern.appendChild(w);
    spaeter(() => w.remove(), 7000);
    spaeter(fluester, 1700 + Math.random() * 1800);
  };
  spaeter(fluester, 900);

  /* Das Licht flackert, als wäre irgendwo eine Röhre kaputt */
  const flackern = () => {
    document.body.classList.add('flackert');
    spaeter(() => document.body.classList.remove('flackert'), 90 + Math.random() * 220);
    if (Math.random() < 0.4) spaeter(() => { document.body.classList.add('flackert'); spaeter(() => document.body.classList.remove('flackert'), 70); }, 260);
    spaeter(flackern, 3000 + Math.random() * 6000);
  };
  spaeter(flackern, 2400);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', groesse);
    uhren.forEach(clearTimeout);
    document.body.classList.remove('flackert');
    huelle.remove();
  };
}

function kachel(k){
  const z = kreisZahlen(k.lf), st = kz(k.lf);
  const zustand = st.boss ? '<span class="marke gold">Bezwungen</span>' : st.feuer >= K.FEUER_ZUM_TOR ? '<span class="marke nebel">Nebeltor offen</span>' : '';
  return '<li><a class="kachel' + (k.akt === 2 ? ' berg-kachel' : '') + '" href="#/kreis/' + k.lf + '" style="--bild:url(img/' + k.bild + '-klein.webp)">' +
    '<span class="kachel-nr">' + kreisMarke(k) + '</span>' +
    '<strong class="kachel-name">' + esc(k.name) + '</strong>' +
    '<span class="kachel-lf">' + esc(k.lfName) + '</span>' +
    '<span class="kachel-fuss">' + feuerPunkte(st.feuer) + zustand + (S.blut && S.blut.ort === k.lf ? '<span class="marke blut">Blutfleck</span>' : '') + '</span>' +
    '<span class="kachel-zahlen">' + z.sitzen + ' von ' + z.gesamt + ' sitzen' + (z.faellig ? ' · <b>' + z.faellig + ' fällig</b>' : '') + '</span>' +
  '</a></li>';
}
function arenaKachel(id){
  const a = ARENEN[id], offen = arenaOffen(id), fest = besiegt(id), rest = fehlend(id);
  const text = fest ? (id === 'gipfel' ? 'Bestanden. Der Stuhl ist leer.' : 'Bezwungen. Das Eis schweigt.')
    : offen ? (id === 'gipfel' ? 'Das Feuer brennt. Der Stuhl wartet.' : 'Das Eis knackt. Er wartet.')
    : 'Erst wenn alle ' + (id === 'gipfel' ? 'dreizehn Bosse' : 'sechs Bosse des Abstiegs') + ' liegen. Noch ' + rest + '.';
  return '<li><a class="kachel arena arena-' + id + (offen || fest ? '' : ' zu') + '" href="#/' + id + '" style="--bild:url(img/' + a.bild + '-klein.webp)">' +
    '<span class="kachel-nr">' + esc(a.nr) + '</span>' +
    '<strong class="kachel-name">' + esc(a.boss) + '</strong>' +
    '<span class="kachel-lf">' + text + '</span>' +
    '<span class="kachel-fuss">' + (fest ? '<span class="marke gold">' + (id === 'gipfel' ? 'Bestanden' : 'Bezwungen') + '</span>' : offen ? '<span class="marke nebel">Offen</span>' : '') +
      (S.blut && S.blut.ort === id ? '<span class="marke blut">Blutfleck</span>' : '') + '</span>' +
  '</a></li>';
}

/* Lagerfeuer: Startseite mit Stufe, Abstieg, Zwischenprüfer, Aufstieg und Gipfel */
function lagerfeuer(){
  const berg = aufstiegOffen();
  hintergrund(berg ? BERG_BILD : null, berg ? 'lager-berg' : 'feuer');
  if (!rastSatz) rastSatz = K.pick(berg ? RAST.concat(RAST_BERG, RAST_BERG) : RAST);
  const preis = K.stufenPreis(S.stufe), kann = S.seelen >= preis && maxLeben() < 200;
  const blutOrt = S.blut ? ortDaten(S.blut.ort) : null;
  const bosseIn = akt => kreiseVon(akt).filter(k => kz(k.lf).boss).length;
  const titelListe = KREISE.filter(k => kz(k.lf).boss).map(k => k.titel).concat(Object.keys(ARENEN).filter(id => besiegt(id)).map(id => ARENEN[id].titel));
  app.innerHTML =
    '<main class="hub">' +
      '<section class="feuerstelle">' +
        FLAMME +
        '<h1 class="gold-titel">Lagerfeuer</h1>' +
        '<p class="rast">' + esc(rastSatz) + '</p>' +
        (S.ng ? '<p class="ng-marke">Neues Spiel+' + (S.ng > 1 ? ' ' + S.ng : '') + '</p>' : '') +
      '</section>' +
      '<section class="werte" aria-label="Dein Stand">' +
        '<div><span>Stufe</span><b>' + S.stufe + '</b></div>' +
        '<div><span>Seelen</span><b class="seelen-zahl">' + zahl(S.seelen) + '</b></div>' +
        '<div><span>Leben</span><b>' + maxLeben() + '</b></div>' +
        '<div><span>Kaffee</span><b>' + S.flakons + '</b>' + (S.roestung ? '<small>je +' + heilung() + '</small>' : '') + '</div>' +
      '</section>' +
      '<button type="button" class="knopf aufstieg" id="aufstieg"' + (kann ? '' : ' disabled') + '>' +
        (maxLeben() >= 200 ? 'Höchste Stufe erreicht' : kann ? 'Stufe aufsteigen · ' + zahl(preis) + ' Seelen' : 'Stufe ' + (S.stufe + 1) + ' für ' + zahl(preis) + ' Seelen') +
        '<small>' + (maxLeben() >= 200 ? 'Mehr Leben gibt es nicht' : '+5 Leben je Stufe') + '</small></button>' +
      (blutOrt ? '<p class="hinweis blut-hinweis"><b>' + zahl(S.blut.seelen) + ' Seelen</b> liegen ' + (typeof S.blut.ort === 'number' ? 'im ' + esc(blutOrt.nr) + ', ' + esc(blutOrt.name) : 'bei ' + esc(blutOrt.boss)) + '. Hol sie dir, bevor du woanders stirbst.</p>' : '') +
      '<h2 class="abschnitt"><span>' + AKTE[0].name + '</span><small>' + AKTE[0].zusatz + ' · ' + bosseIn(1) + ' von 6 Bossen</small></h2>' +
      '<ul class="kacheln">' + kreiseVon(1).map(kachel).join('') + arenaKachel('kokytos') + '</ul>' +
      '<h2 class="abschnitt berg-abschnitt"><span>' + AKTE[1].name + '</span><small>' + AKTE[1].zusatz + (berg ? ' · ' + bosseIn(2) + ' von 6 Bossen' : '') + '</small></h2>' +
      '<ul class="kacheln">' +
        (berg ? kreiseVon(2).map(kachel).join('')
          : '<li><div class="kachel zu berg-zu" style="--bild:url(img/' + BERG_BILD + '-klein.webp)">' +
              '<span class="kachel-nr">Jenseits des Eises</span><strong class="kachel-name">Der Läuterungsberg</strong>' +
              '<span class="kachel-lf">Hinter dem Zwischenprüfer. Wer durch das Eis geht, sieht den Berg.</span></div></li>') +
        arenaKachel('gipfel') +
      '</ul>' +
      '<details class="spielstand"><summary>Spielstand</summary>' +
        '<p>' + zahl(S.verdient) + ' Seelen verdient · ' + zahl(S.antworten) + ' Antworten · ' + S.tode + ' ' + (S.tode === 1 ? 'Tod' : 'Tode') + ' · ' + KARTEN.filter(c => K.stand(prog, c).b > 0).length + ' von ' + zahl(KARTEN.length) + ' Karten gesehen</p>' +
        (titelListe.length ? '<p class="titel-liste"><b>Deine Titel:</b> ' + titelListe.map(esc).join(' · ') + '</p>' : '') +
        '<label class="probe"><input type="checkbox" id="probe"' + (S.probe ? ' checked' : '') + '> Prototyp: alle Tore offen <small>Zum Ansehen. Bosse zählen erst, wenn du sie besiegst.</small></label>' +
        '<button type="button" class="knopf leise" id="installieren" hidden>App installieren</button>' +
        '<div class="loeschen" id="loeschen"><button type="button" class="knopf leise gefahr" id="loeschen-frage">Spielstand löschen</button></div>' +
      '</details>' +
    '</main>';
  $('#aufstieg').addEventListener('click', () => {
    const p = K.stufenPreis(S.stufe);
    if (S.seelen < p || maxLeben() >= 200) return;
    S.seelen -= p; S.stufe++; sichern(); render();
    const w = $('.werte'); if (w) w.classList.add('aufgestiegen');
    fokus('#aufstieg');
  });
  $('#probe').addEventListener('change', e => { S.probe = e.target.checked; sichern(); render(); $('.spielstand').open = true; fokus('#probe'); });
  $('#loeschen-frage').addEventListener('click', () => {
    $('#loeschen').innerHTML = '<span>Alles löschen, auch den Lernstand?</span><button type="button" class="knopf leise gefahr" id="loeschen-ja">Ja, löschen</button><button type="button" class="knopf leise" id="loeschen-nein">Abbrechen</button>';
    $('#loeschen-ja').addEventListener('click', () => { store.del(SPIEL); store.del(PROG); S = neuesSpiel(); prog = {}; location.hash = ''; render(); });
    $('#loeschen-nein').addEventListener('click', render);
    fokus('#loeschen-nein');
  });
  installKnopf();
}

/* Kreis oder Gesims: Bild, Zitat, Stand, Gang oder Nebeltor */
function kreisSeite(lf){
  const k = kreis(lf), st = kz(lf), z = kreisZahlen(lf);
  hintergrund(k.bild, 'kreis');
  const torOffen = st.feuer >= K.FEUER_ZUM_TOR && !st.boss;
  app.innerHTML =
    '<main class="kreis-seite' + (k.akt === 2 ? ' am-berg' : '') + '">' +
      '<a class="zurueck" href="#/">Zum Lagerfeuer</a>' +
      '<header class="kreis-kopf">' +
        '<p class="ueber">' + kreisMarke(k) + '</p>' +
        '<h1 class="kreis-name">' + esc(k.name) + '</h1>' +
        '<p class="kreis-lf">' + esc(k.lfName) + '</p>' +
      '</header>' +
      '<blockquote class="zitat">' + esc(k.zitat) + '</blockquote>' +
      '<section class="kreis-stand">' +
        '<p>' + feuerPunkte(st.feuer) + ' <span>' + (st.feuer >= K.FEUER_ZUM_TOR ? 'Alle Lagerfeuer brennen' : 'Lagerfeuer ' + st.feuer + ' von ' + K.FEUER_ZUM_TOR) + '</span></p>' +
        '<p class="zahlen"><b>' + z.sitzen + '</b> von ' + z.gesamt + ' sitzen · <b>' + z.faellig + '</b> fällig · <b>' + z.neu + '</b> neu</p>' +
        (S.blut && S.blut.ort === lf ? '<p class="blut-hinweis">Dein Blutfleck liegt hier: <b>' + zahl(S.blut.seelen) + ' Seelen</b>. Die Karte kommt als Erstes.</p>' : '') +
      '</section>' +
      '<div class="aktionen">' +
        '<button type="button" class="knopf haupt" id="gang">Gang beginnen<small>' + K.GANG + ' Karten, am Ende ein Lagerfeuer</small></button>' +
        (torOffen || (S.probe && !st.boss) ? '<button type="button" class="knopf nebeltor" id="tor">Nebeltor durchschreiten<small>' + esc(k.boss) + ' wartet</small></button>'
          : st.boss ? '<p class="bezwungen"><b>' + esc(k.boss) + '</b> liegt im Staub. Titel: <b>' + esc(k.titel) + '</b></p>'
          : '<p class="tor-zu">Das Nebeltor öffnet sich nach ' + K.FEUER_ZUM_TOR + ' Lagerfeuern. Dahinter: ' + esc(k.boss) + '.</p>') +
      '</div>' +
    '</main>';
  $('#gang').addEventListener('click', () => gangStart(lf));
  const tor = $('#tor');
  if (tor) tor.addEventListener('click', () => { S.zeige = { art: 'tor', ort: lf }; sichern(); render(); });
  fokus('#gang');
}

/* Kokytos und Gipfel: Zitat, welche Bosse noch fehlen, dann das Tor */
function arenaSeite(id){
  const a = ARENEN[id], offen = arenaOffen(id), fest = besiegt(id);
  hintergrund(a.bild, 'arena-' + id, wetterVon(id));
  const liste = a.voraus.map(o => {
    const ok = besiegt(o);
    return '<li class="' + (ok ? 'erfuellt' : 'offen') + '"><span class="haken" aria-hidden="true">' + (ok ? '✓' : '') + '</span>' + esc(bossName(o)) + '<span class="sr">' + (ok ? ' bezwungen' : ' noch nicht bezwungen') + '</span></li>';
  }).join('');
  const knopf = id === 'gipfel' ? 'Durch das Feuer gehen' : 'Aufs Eis treten';
  app.innerHTML =
    '<main class="kreis-seite arena-seite arena-' + id + '">' +
      '<a class="zurueck" href="#/">Zum Lagerfeuer</a>' +
      '<header class="kreis-kopf">' +
        '<p class="ueber">' + esc(a.nr) + ' · ' + esc(a.name) + '</p>' +
        '<h1 class="kreis-name">' + esc(a.boss) + '</h1>' +
        '<p class="kreis-lf">' + esc(a.bossZusatz) + '</p>' +
      '</header>' +
      '<blockquote class="zitat">' + esc(a.zitat) + '</blockquote>' +
      '<section class="kreis-stand">' +
        '<p>' + (fest ? 'Bezwungen' + (id === 'gipfel' ? ', bestanden im ' + az(id).versuche + '. Versuch' : '') + '.'
          : !offen ? 'Noch ' + fehlend(id) + ' von ' + a.voraus.length + ' Bossen stehen im Weg.'
          : fehlend(id) ? 'Prototyp-Schalter: Das Tor ist offen, obwohl noch ' + fehlend(id) + ' Bosse stehen.' : 'Der Weg ist frei.') + '</p>' +
        '<ul class="voraus" aria-label="Diese Bosse müssen liegen">' + liste + '</ul>' +
        (S.blut && S.blut.ort === id ? '<p class="blut-hinweis">Dein Blutfleck liegt hier: <b>' + zahl(S.blut.seelen) + ' Seelen</b>. Die Karte kommt als Erstes.</p>' : '') +
      '</section>' +
      '<div class="aktionen">' +
        (fest ? '<p class="bezwungen">Titel: <b>' + esc(a.titel) + '</b></p>'
          : offen ? '<button type="button" class="knopf ' + (id === 'gipfel' ? 'feuertor' : 'eistor') + '" id="tor">' + knopf + '<small>' + esc(a.boss) + ' wartet</small></button>'
          : '<p class="tor-zu">' + (id === 'gipfel' ? 'Die Feuerwand lässt nur durch, wer alle dreizehn Bosse besiegt hat.' : 'Das Eis trägt erst, wenn alle sechs Bosse des Abstiegs liegen.') + '</p>') +
      '</div>' +
    '</main>';
  const tor = $('#tor');
  if (tor) { tor.addEventListener('click', () => { S.zeige = { art: 'tor', ort: id }; sichern(); render(); }); fokus('#tor'); }
}

/* ---------- Kampf ---------- */
function laufStart(art, ort, extra){
  const O = ortDaten(ort);
  S.lauf = Object.assign({
    art, ort, leben: maxLeben(), flakons: O.kaffee === 'ja' ? S.flakons : 0, richtig: 0, gesamt: 0, plus: 0,
    blutOffen: !!(S.blut && S.blut.ort === ort), frage: null
  }, extra);
  S.lauf.frage = neueFrage();
  sichern(); letzteLeben = S.lauf.leben; render(); window.scrollTo(0, 0);
}
const gangStart = lf => laufStart('gang', lf, { plan: K.gangPlanen(KARTEN, prog, lf, S.blut && S.blut.ort === lf ? S.blut.id : null), pos: 0, nach: {} });
function bossStart(ort){
  if (typeof ort === 'string') az(ort).versuche++;
  laufStart('boss', ort, { phase: 0, phaseTreffer: 0, phaseNeu: ortDaten(ort).phasen.length > 1, zuletzt: [] });
}

function neueFrage(){
  const L = S.lauf, boss = L.art === 'boss';
  let id, nachgeholt = false, auftritt = false;
  if (boss) {
    const ph = ortDaten(L.ort).phasen[L.phase];
    id = L.blutOffen && S.blut ? S.blut.id : K.bossKarte(KARTEN, prog, ph.lfs, L.zuletzt).i;
    L.zuletzt = L.zuletzt.concat(id).slice(-6);
    auftritt = !!L.phaseNeu; L.phaseNeu = false;
  } else {
    id = L.plan[L.pos];
    if (id.startsWith('!')) { id = id.slice(1); nachgeholt = true; }
  }
  const c = KARTE.get(id), typ = K.fragetyp(prog, c, boss);
  return {
    id, typ, nachgeholt, auftritt,
    blut: !!(L.blutOffen && S.blut && S.blut.id === id),
    optionen: typ === 'tippen' ? null : K.shuffle([c].concat(K.ablenker(KARTEN, c))).map(x => x.i),
    beantwortet: false
  };
}

const TYP_TEXT = { begriff: 'Welcher Begriff ist gemeint?', definition: 'Welche Erklärung passt?', tippen: 'Begriff eintippen' };
let letzteLeben = null;
function kampf(){
  const L = S.lauf, f = L.frage, c = KARTE.get(f.id), O = ortDaten(L.ort), boss = L.art === 'boss', mx = maxLeben();
  const ph = boss ? O.phasen[L.phase] : null;
  hintergrund(boss && O.kampfBild ? O.kampfBild : O.bild, boss ? (typeof L.ort === 'string' ? 'arena-' + L.ort : 'boss') : 'kampf', wetterVon(L.ort));
  const pct = v => Math.max(0, Math.min(100, v / mx * 100));
  const vorher = letzteLeben === null ? L.leben : letzteLeben;
  const fertig = boss ? '' : '<span class="schritte" aria-label="Karte ' + (L.pos + 1) + ' von ' + L.plan.length + '">' +
    L.plan.map((_, i) => '<i class="' + (i < L.pos || (i === L.pos && f.beantwortet) ? 'an' : i === L.pos ? 'jetzt' : '') + '"></i>').join('') + '</span>';
  const frage = f.typ === 'definition' ? '<p class="frage begriff-gross">' + esc(c.n) + '</p>' : '<p class="frage">' + esc(c.d) + '</p>';
  let antwort = '';
  if (f.typ === 'tippen') {
    antwort = '<form class="tippen" id="tippen" autocomplete="off">' +
      '<input type="text" id="eingabe" enterkeyhint="send" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Begriff eintippen"' +
        (f.beantwortet ? ' readonly value="' + esc(f.eingabe || '') + '" class="' + (f.gut ? 'ok' : 'falsch') + '"' : '') + '>' +
      '<div class="tippen-knoepfe">' +
        '<button type="submit" class="knopf haupt"' + (f.beantwortet ? ' disabled' : '') + '>Zuschlagen</button>' +
        '<button type="button" class="knopf leise" id="passen"' + (f.beantwortet ? ' disabled' : '') + '>Keine Ahnung</button>' +
      '</div></form>';
  } else {
    antwort = '<div class="optionen" role="group" aria-label="Antworten">' + f.optionen.map((id, n) => {
      const o = KARTE.get(id), txt = f.typ === 'begriff' ? o.n : o.d;
      let cls = '';
      if (f.beantwortet) cls = id === f.id ? ' ok' : n === f.gewaehlt ? ' falsch' : ' blass';
      return '<button type="button" class="option' + (f.typ === 'definition' ? ' lang' : '') + cls + '" data-n="' + n + '"' + (f.beantwortet ? ' disabled' : '') + '>' + esc(txt) + '</button>';
    }).join('') + '</div>';
  }
  const kaffeeVerboten = O.kaffee === 'nein';
  const phasenAnzeige = boss && O.phasen.length > 1
    ? '<span class="phase">' + esc(O.phasenWort) + ' ' + (L.phase + 1) + ' von ' + O.phasen.length + '</span>' : '';
  app.innerHTML =
    '<main class="kampf' + (boss ? ' ist-boss' : '') + '">' +
      '<header class="hud">' +
        '<div class="leben" role="meter" aria-label="Leben" aria-valuemin="0" aria-valuemax="' + mx + '" aria-valuenow="' + L.leben + '">' +
          '<div class="balken"><i class="spur" style="width:' + pct(vorher) + '%"></i><i class="wert" style="width:' + pct(L.leben) + '%"></i></div>' +
          '<span class="leben-zahl">' + L.leben + ' / ' + mx + '</span>' +
        '</div>' +
        '<button type="button" class="flakon' + (kaffeeVerboten ? ' verboten' : O.kaffee === 'gefroren' ? ' gefroren' : '') + '" id="flakon"' +
          (kaffeeVerboten || L.flakons <= 0 || L.leben <= 0 || L.leben >= mx ? ' disabled' : '') +
          ' aria-label="' + (kaffeeVerboten ? 'Kein Kaffee im Prüfungsraum' : 'Kaffeeflakon trinken, plus ' + heilung() + ' Leben, noch ' + L.flakons) + '">' +
          TASSE + '<b>' + (kaffeeVerboten ? '0' : L.flakons) + '</b></button>' +
        '<span class="seelen-hud"><b>' + zahl(S.seelen) + '</b> Seelen</span>' +
      '</header>' +
      '<div class="lauf-kopf">' +
        '<button type="button" class="rueckzug" id="rueckzug"' + (L.leben <= 0 ? ' disabled' : '') + '>' + (L.ort === 'gipfel' ? 'Raum verlassen' : 'Rückzug') + '</button>' +
        '<span class="lauf-ort">' + esc(O.ort) + '</span>' + fertig +
      '</div>' +
      (boss ? '<div class="bossbalken"><span class="boss-name">' + esc(ph.name) + '<small>' + esc(ph.zusatz) + '</small></span>' + phasenAnzeige +
        '<div class="balken"><i style="width:' + ((ph.treffer - L.phaseTreffer) / ph.treffer * 100) + '%"></i></div></div>' : '') +
      '<section class="karte" id="karte">' +
        (f.auftritt && !f.beantwortet ? '<p class="auftritt">' + esc(ph.auftritt) + '</p>' : '') +
        '<p class="karte-kopf"><span>' + TYP_TEXT[f.typ] + '</span><span class="thema">' + esc(c.t) + '</span></p>' +
        (O.zeit && boss && !f.beantwortet ? '<div class="uhr" id="uhr" aria-hidden="true"><i></i><span></span></div>' : '') +
        (f.blut && !f.beantwortet ? '<p class="blut-hinweis">Dein Blutfleck. <b>' + zahl(S.blut.seelen) + ' Seelen</b> liegen bei dieser Karte.</p>' : '') +
        (f.nachgeholt && !f.beantwortet ? '<p class="nach-hinweis">Die kennst du von eben.</p>' : '') +
        frage + antwort +
        '<div class="rueckmeldung" id="rueckmeldung" aria-live="polite">' + (f.beantwortet ? rueckmeldung(c, f) : '') + '</div>' +
      '</section>' +
      '<div class="rueckzug-frage" id="rueckzug-frage" hidden></div>' +
    '</main>' +
    (f.beantwortet ? '<div class="weiter-leiste"><button type="button" class="knopf haupt" id="weiter">' + weiterText() + '</button></div>' : '');
  /* Lebensbalken: die helle Spur folgt dem Schaden mit Verzögerung */
  if (vorher !== L.leben) requestAnimationFrame(() => requestAnimationFrame(() => { const s = $('.spur'); if (s) s.style.width = pct(L.leben) + '%'; }));
  letzteLeben = L.leben;

  $('#flakon').addEventListener('click', trinken);
  $('#rueckzug').addEventListener('click', rueckzugFragen);
  if (f.beantwortet) { $('#weiter').addEventListener('click', weiter); fokus('#weiter'); return; }
  if (f.typ === 'tippen') {
    $('#tippen').addEventListener('submit', e => { e.preventDefault(); tippenPruefen(); });
    $('#passen').addEventListener('click', () => antworten(false, { eingabe: '' }));
    fokus('#eingabe');
  } else {
    $$('.option').forEach(b => b.addEventListener('click', () => { const n = Number(b.dataset.n); antworten(f.optionen[n] === f.id, { gewaehlt: n }); }));
  }
  starteUhr();
}

/* Prüfungsuhr: die Frist steht in der Frage, Neuladen hilft also nicht */
let uhr = null;
function stoppeUhr(){ if (uhr) { clearInterval(uhr); uhr = null; } }
function starteUhr(){
  const L = S.lauf, f = L.frage, O = ortDaten(L.ort);
  if (!O.zeit || L.art !== 'boss' || f.beantwortet) return;
  if (!f.bis) { f.bis = Date.now() + O.zeit * 1000; sichern(); }
  const tick = () => {
    if (!S.lauf || S.lauf.frage !== f || f.beantwortet) { stoppeUhr(); return; }
    const rest = Math.max(0, f.bis - Date.now()), el = $('#uhr');
    if (el) {
      el.querySelector('i').style.width = (rest / (O.zeit * 1000) * 100) + '%';
      el.querySelector('span').textContent = Math.ceil(rest / 1000) + ' s';
      el.classList.toggle('knapp', rest < 5000);
    }
    if (rest <= 0) { stoppeUhr(); const e = $('#eingabe'); antworten(false, { zeit: true, eingabe: e ? e.value : '' }); }
  };
  tick();
  uhr = setInterval(tick, 200);
}

function weiterText(){
  const L = S.lauf;
  if (L.leben <= 0) return 'Weiter';
  if (L.art === 'boss') return L.gefallen ? (L.ort === 'gipfel' ? 'Die Akte schließen' : 'Der Boss fällt') : 'Weiter';
  return L.pos + 1 >= L.plan.length ? 'Zum Lagerfeuer' : 'Weiter';
}

function rueckmeldung(c, f){
  const urteil = f.zeit ? 'Zeit um' : f.gut ? (f.tippfehler ? 'Fast, zählt' : 'Treffer') : 'Daneben';
  return '<div class="urteil ' + (f.gut ? (f.tippfehler ? 'knapp' : 'ok') : 'falsch') + '">' +
    '<p class="urteil-wort">' + urteil + '</p>' +
    (f.typ === 'tippen' && !f.gut && f.eingabe ? '<p class="klein">Deine Antwort: „' + esc(f.eingabe) + '“</p>' : '') +
    '<p class="loesung">' + esc(c.n) + (c.a && c.a.length ? ' <span class="klein">(' + esc(c.a.slice(0, 3).join(', ')) + ')</span>' : '') + '</p>' +
    (c.m ? '<p class="merke"><b>Merke:</b> ' + esc(c.m) + '</p>' : '') +
    (f.zeilen && f.zeilen.length ? '<p class="seelen-zeile">' + f.zeilen.map(esc).join(' · ') + '</p>' : '') +
    (f.spruch ? '<p class="spruch">' + esc(f.spruch) + '</p>' : '') +
  '</div>';
}

function tippenPruefen(){
  const eingabe = $('#eingabe').value, r = K.pruefeEingabe(KARTE.get(S.lauf.frage.id), eingabe);
  if (r === 'leer') { fokus('#eingabe'); return; }
  antworten(r !== 'falsch', { eingabe, tippfehler: r === 'tippfehler' });
}

function antworten(gut, info){
  const L = S.lauf;
  if (!L || L.frage.beantwortet) return;
  stoppeUhr();
  const f = L.frage, O = ortDaten(L.ort), akt = O.akt;
  const c = KARTE.get(f.id), boss = L.art === 'boss', fachVorher = K.stand(prog, c).b;
  const ph = boss ? O.phasen[L.phase] : null, mehrphasig = boss && O.phasen.length > 1;
  Object.assign(f, info, { beantwortet: true, gut });
  if (f.nachgeholt) { if (!gut) K.fehlerNachtragen(prog, c); }
  else K.eintragen(prog, c, gut);
  L.gesamt++; S.antworten = (S.antworten || 0) + 1;
  const zeilen = [];
  if (gut) {
    L.richtig++;
    const g = f.nachgeholt ? 5 : K.seelenFuer(fachVorher, boss, akt, S.ng);
    S.seelen += g; S.verdient += g; L.plus += g;
    zeilen.push('+' + g + ' Seelen');
    if (f.blut && S.blut) { S.seelen += S.blut.seelen; L.plus += S.blut.seelen; zeilen.push('Seelen zurückgeholt: +' + zahl(S.blut.seelen)); S.blut = null; L.blutOffen = false; }
    if (boss) {
      L.phaseTreffer++;
      if (L.phaseTreffer >= ph.treffer) {
        if (L.phase + 1 < O.phasen.length) {
          zeilen.push(ph.ende || ph.name + ' fällt.');
          L.phase++; L.phaseTreffer = 0; L.phaseNeu = true;
          if (O.kaffee === 'gefroren' && L.flakons < S.flakons) { L.flakons++; zeilen.push('Ein Kaffeeflakon taut auf.'); }
        } else { L.gefallen = true; zeilen.push(O.schluss || 'Der Boss wankt …'); }
      } else zeilen.push('Treffer. Noch ' + (ph.treffer - L.phaseTreffer) + (mehrphasig ? ' bei ' + ph.name : ' bis zum Fall') + '.');
    }
    if (f.tippfehler && O.tippfehler) {
      L.leben = Math.max(1, L.leben - O.tippfehler);
      zeilen.push('Der Vorsitz runzelt die Stirn über die Rechtschreibung: −' + O.tippfehler + ' Leben');
    }
    if (mehrphasig && ph.treffer_) f.spruch = K.pick(ph.treffer_);
    else if (Math.random() < 0.2) f.spruch = K.pick(TREFFER);
  } else {
    const d = boss && O.schaden ? Math.round(O.schaden * K.ngSchaden(S.ng)) : K.schadenFuer(fachVorher, boss, akt, S.ng);
    L.leben = Math.max(0, L.leben - d);
    if (f.zeit) zeilen.push('Die Zeit ist um');
    zeilen.push('−' + d + ' Leben' + (!boss && fachVorher >= 3 ? ', die Karte saß schon, das tut mehr weh' : ''));
    if (f.blut && S.blut) { zeilen.push('Deine ' + zahl(S.blut.seelen) + ' Seelen versickern im Boden.'); S.blut = null; L.blutOffen = false; }
    if (!boss && L.leben > 0 && !L.nach[c.i]) {
      L.plan.splice(Math.min(L.plan.length, L.pos + 4), 0, '!' + c.i);
      L.nach[c.i] = true;
      zeilen.push('Sie kommt in drei Karten wieder.');
    }
    if (mehrphasig && ph.fehler) f.spruch = K.pick(ph.fehler);
    else if (L.leben > 0 && Math.random() < 0.35) f.spruch = K.pick(DANEBEN);
  }
  if (boss && f.blut) L.blutOffen = false;
  f.zeilen = zeilen;
  sichern();
  render();
  const rm = $('#rueckmeldung');
  if (rm) rm.scrollIntoView({ block: 'end', behavior: ruhig() ? 'auto' : 'smooth' });
  if (gut) seelenFliegen(zeilen[0]);
  else { blitz(); vibrieren(L.leben <= 0 ? [90, 60, 240] : 70); }
  if (L.leben <= 0) setTimeout(() => { if (S.lauf && S.lauf.leben <= 0) sterben(); }, ruhig() ? 0 : 1300);
}

function weiter(){
  const L = S.lauf;
  if (!L) return render();
  if (L.leben <= 0) return sterben();
  if (L.art === 'boss' && L.gefallen) return bossSieg();
  if (L.art === 'gang') { L.pos++; if (L.pos >= L.plan.length) return gangEnde(); }
  L.frage = neueFrage();
  sichern(); render(); window.scrollTo(0, 0);
}

function trinken(){
  const L = S.lauf, mx = maxLeben();
  if (!L || L.leben <= 0 || L.flakons <= 0 || L.leben >= mx || ortDaten(L.ort).kaffee === 'nein') return;
  L.leben = Math.min(mx, L.leben + heilung()); L.flakons--;
  sichern();
  const antwortStand = L.frage.beantwortet;
  render();
  const h = $('.hud'); if (h) h.classList.add('geheilt');
  if (!antwortStand && L.frage.typ === 'tippen') fokus('#eingabe');
}

function rueckzugFragen(){
  if (!S.lauf || S.lauf.leben <= 0) return;
  const box = $('#rueckzug-frage'), L = S.lauf, boss = L.art === 'boss', pruefung = L.ort === 'gipfel';
  box.hidden = false;
  box.innerHTML = '<p>' + (pruefung ? 'Den Prüfungsraum verlassen? Das zählt als durchgefallen.'
      : boss ? 'Fliehen? Der Boss erholt sich, du behältst deine Seelen.'
      : 'Zum Lagerfeuer zurückziehen? Dieser Gang zählt nicht, deine Seelen behältst du.') + '</p>' +
    '<div class="zeile"><button type="button" class="knopf leise" id="rz-ja">' + (pruefung ? 'Verlassen' : boss ? 'Fliehen' : 'Zurückziehen') + '</button><button type="button" class="knopf haupt" id="rz-nein">' + (pruefung ? 'Bleiben' : 'Weiterkämpfen') + '</button></div>';
  $('#rz-ja').addEventListener('click', () => {
    if (pruefung) { L.leben = 0; sichern(); sterben(); return; }
    const ort = L.ort; S.lauf = null; sichern(); location.hash = ortSeite(ort); render();
  });
  $('#rz-nein').addEventListener('click', () => { box.hidden = true; box.innerHTML = ''; });
  fokus('#rz-nein');
}

function gangEnde(){
  const L = S.lauf, st = kz(L.ort), vorher = st.feuer;
  if (st.feuer < K.FEUER_ZUM_TOR) st.feuer++;
  S.zeige = { art: 'feuer', ort: L.ort, richtig: L.richtig, gesamt: L.gesamt, plus: L.plus, feuer: st.feuer, neu: vorher < K.FEUER_ZUM_TOR, tor: vorher < K.FEUER_ZUM_TOR && st.feuer >= K.FEUER_ZUM_TOR && !st.boss };
  S.lauf = null; sichern(); render();
}

function sterben(){
  const L = S.lauf;
  if (!L) return render();
  const id = L.frage.id, verloren = S.blut ? S.blut.seelen : 0, fallen = S.seelen;
  S.blut = fallen > 0 ? { id, ort: L.ort, seelen: fallen } : null;
  S.zeige = { art: 'tod', id, fallen, verloren, ort: L.ort };
  S.seelen = 0; S.tode++; S.lauf = null;
  sichern(); render();
}

function bossSieg(){
  const L = S.lauf, O = ortDaten(L.ort), erst = !besiegt(L.ort);
  if (typeof L.ort === 'number') kz(L.ort).boss = true; else az(L.ort).boss = true;
  const g = Math.round(O.seelen * K.ngSeelen(S.ng));
  S.seelen += g; S.verdient += g;
  let belohnung = '';
  if (erst && S.flakons < K.FLAKON_MAX) { S.flakons++; belohnung = 'splitter'; }
  else if (erst && S.roestung < K.ROESTUNG_MAX) { S.roestung++; belohnung = 'roestung'; }
  if (L.ort === 'gipfel') { S.bestanden = (S.bestanden || 0) + 1; S.zeige = { art: 'bestanden', seelen: g }; }
  else S.zeige = { art: 'sieg', ort: L.ort, belohnung, seelen: g, durchgang: L.ort === 'kokytos' && !S.aufstieg };
  if (L.ort === 'kokytos') S.aufstieg = true;
  S.lauf = null; sichern(); render();
}

/* Neues Spiel+: alle Bosse stehen wieder auf, Lernstand, Stufe, Lagerfeuer und Kaffee bleiben */
function neuesSpielPlus(){
  S.ng = (S.ng || 0) + 1;
  for (const k of KREISE) kz(k.lf).boss = false;
  for (const id of Object.keys(ARENEN)) az(id).boss = false;
  S.zeige = null; sichern(); location.hash = ''; render(); window.scrollTo(0, 0);
}

/* ---------- Große Bildschirme: Tod, Lagerfeuer, Tor, Sieg, Durchgang, Bestanden ---------- */
function zeige(){
  const z = S.zeige;
  const schliessen = ziel => () => { S.zeige = null; sichern(); if (ziel !== undefined) location.hash = ziel; render(); window.scrollTo(0, 0); };
  const O = z.ort !== undefined ? ortDaten(z.ort) : null;
  if (z.art === 'tod') {
    const c = KARTE.get(z.id), arena = typeof z.ort === 'string';
    const titel = z.ort === 'gipfel' ? 'Durchgefallen' : z.ort === 'kokytos' ? 'Du bist erfroren' : 'Du bist gestorben';
    hintergrund(null, z.ort === 'gipfel' ? 'tod-pruefung' : 'tod');
    app.innerHTML =
      '<main class="gross tod' + (z.ort === 'gipfel' ? ' durchgefallen' : z.ort === 'kokytos' ? ' erfroren' : '') + '" role="alertdialog" aria-modal="true" aria-labelledby="tod-titel">' +
        '<div class="band"><h1 id="tod-titel">' + titel + '</h1></div>' +
        '<div class="gross-inhalt spaet">' +
          '<p class="tod-von">' + (z.ort === 'gipfel' ? 'Der Ausschuss hat entschieden, wegen' : 'Erledigt von') + '</p>' +
          '<p class="tod-begriff">' + esc(c.n) + '</p>' +
          '<p class="tod-def">' + esc(c.d) + '</p>' +
          (c.m ? '<p class="merke"><b>Merke:</b> ' + esc(c.m) + '</p>' : '') +
          '<p class="tod-seelen">' + (z.fallen ? '<b>' + zahl(z.fallen) + ' Seelen</b> liegen jetzt bei dieser Karte. ' + (arena ? 'Beim nächsten Versuch' : 'Im nächsten Gang durch diesen Kreis') + ' kommt sie zuerst. Richtig beantwortet, holst du sie zurück. Falsch, und sie sind weg.' : 'Du hattest keine Seelen dabei. Wenigstens das.') +
            (z.verloren ? ' Die ' + zahl(z.verloren) + ' Seelen vom letzten Mal sind versickert.' : '') + '</p>' +
          '<button type="button" class="knopf haupt" id="weiter">Am Lagerfeuer erwachen</button>' +
        '</div>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen(''));
    fokus('#weiter');
    return;
  }
  if (z.art === 'feuer') {
    hintergrund(null, 'feuer');
    app.innerHTML =
      '<main class="gross feuer-gross" role="dialog" aria-modal="true" aria-labelledby="feuer-titel">' +
        FLAMME.replace('class="flamme"', 'class="flamme gross-flamme"') +
        '<div class="band gold"><h1 id="feuer-titel">' + (z.neu ? 'Lagerfeuer entzündet' : 'Rast am Lagerfeuer') + '</h1></div>' +
        '<div class="gross-inhalt spaet">' +
          '<p class="bilanz"><b>' + z.richtig + '</b> von ' + z.gesamt + ' richtig · <b>+' + zahl(z.plus) + '</b> Seelen</p>' +
          '<p>' + feuerPunkte(z.feuer) + '</p>' +
          '<p>' + (z.tor ? 'Alle Lagerfeuer brennen. <b>Das Nebeltor ist offen.</b> Dahinter wartet ' + esc(O.boss) + '.' : z.neu ? 'Lagerfeuer ' + z.feuer + ' von ' + K.FEUER_ZUM_TOR + ' im ' + (O.akt === 2 ? '' : 'Kreis ') + esc(O.name) + '.' : 'Leben und Kaffee sind wieder voll.') + '</p>' +
          '<button type="button" class="knopf haupt" id="weiter">Weiter</button>' +
        '</div>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen(ortSeite(z.ort)));
    fokus('#weiter');
    return;
  }
  if (z.art === 'tor') {
    const arena = typeof z.ort === 'string';
    const regeln = arena ? O.regeln : [
      '<b>' + K.BOSS_TREFFER + ' richtige Antworten</b> bringen den Boss zu Fall.',
      'Jeder Fehler kostet <b>' + K.schadenFuer(0, true, O.akt, S.ng) + ' Leben</b>. Fragen aus dem ganzen ' + (O.akt === 2 ? 'Prüfungsbereich' : 'Lernfeld') + ', die wackligen öfter.',
      'Karten, die schon sitzen sollten, musst du eintippen.'
    ];
    hintergrund(arena && O.kampfBild ? O.kampfBild : O.bild, arena ? 'arena-' + z.ort : 'tor', wetterVon(z.ort));
    app.innerHTML =
      '<main class="gross nebel' + (arena ? ' tor-' + z.ort : '') + '" role="dialog" aria-modal="true" aria-labelledby="tor-titel">' +
        (arena ? '' : '<div class="nebel-schleier" aria-hidden="true"></div>') +
        '<p class="ueber">' + (z.ort === 'gipfel' ? 'Hinter der Feuerwand' : z.ort === 'kokytos' ? 'Auf dem gefrorenen See' : 'Hinter dem Nebeltor') + '</p>' +
        '<h1 class="boss-gross" id="tor-titel">' + esc(O.boss) + '<small>' + esc(O.bossZusatz) + '</small></h1>' +
        '<ul class="regeln">' + regeln.map(r => '<li>' + r + '</li>').join('') + '</ul>' +
        '<div class="zeile"><button type="button" class="knopf haupt" id="weiter">' + (z.ort === 'gipfel' ? 'Platz nehmen' : 'Eintreten') + '</button><button type="button" class="knopf leise" id="zurueck">Noch nicht</button></div>' +
      '</main>';
    $('#weiter').addEventListener('click', () => { S.zeige = null; bossStart(z.ort); });
    $('#zurueck').addEventListener('click', schliessen(ortSeite(z.ort)));
    fokus('#weiter');
    return;
  }
  if (z.art === 'sieg') {
    hintergrund(O.bild, 'sieg', wetterVon(z.ort));
    const belohnung = z.belohnung === 'splitter' ? ' · Kaffeeflakon-Splitter: jetzt <b>' + S.flakons + '</b> Flakons'
      : z.belohnung === 'roestung' ? ' · Der Kaffee ist stärker geröstet: heilt jetzt <b>' + heilung() + '</b>' : '';
    app.innerHTML =
      '<main class="gross sieg" role="dialog" aria-modal="true" aria-labelledby="sieg-titel">' +
        '<div class="band gold"><h1 id="sieg-titel">Gegner bezwungen</h1></div>' +
        '<div class="gross-inhalt spaet">' +
          '<p class="boss-gross klein-boss">' + esc(O.boss) + '</p>' +
          '<p class="bilanz"><b>+' + zahl(z.seelen) + '</b> Seelen' + belohnung + '</p>' +
          '<p>Titel errungen: <b class="gold-text">' + esc(O.titel) + '</b></p>' +
          '<button type="button" class="knopf haupt" id="weiter">' + (z.durchgang ? 'Hinab durch das Eis' : 'Weiter') + '</button>' +
        '</div>' +
      '</main>';
    $('#weiter').addEventListener('click', z.durchgang ? () => { S.zeige = { art: 'durchgang' }; sichern(); render(); window.scrollTo(0, 0); } : schliessen(ortSeite(z.ort)));
    fokus('#weiter');
    return;
  }
  if (z.art === 'durchgang') {
    hintergrund(BERG_BILD, 'durchgang');
    app.innerHTML =
      '<main class="gross durchgang" role="dialog" aria-modal="true" aria-labelledby="dg-titel">' +
        '<p class="ueber">Durch die Mitte der Erde</p>' +
        '<h1 class="boss-gross" id="dg-titel">Der Läuterungsberg<small>Sechs Gesimse, ganz oben das Feuer</small></h1>' +
        '<blockquote class="zitat">' + esc(DURCHGANG) + '</blockquote>' +
        '<p class="hinweis">Der Aufstieg ist offen: die sechs Prüfungsbereiche der AP2, ein Gesims nach dem anderen.</p>' +
        '<button type="button" class="knopf haupt" id="weiter">Den Berg ansehen</button>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen(''));
    fokus('#weiter');
    return;
  }
  if (z.art === 'bestanden') abspann(z);
}

/* Abspann nach dem Ausschuss */
function abspann(z){
  hintergrund(ABSPANN_BILD, 'abspann');
  const alleTitel = KREISE.map(k => k.titel).concat(Object.values(ARENEN).map(a => a.titel));
  const zeile = (h, t) => '<div><h2>' + h + '</h2><p>' + t + '</p></div>';
  app.innerHTML =
    '<main class="gross abspann" role="dialog" aria-modal="true" aria-labelledby="ab-titel">' +
      '<div class="band gold"><h1 id="ab-titel">Bestanden</h1></div>' +
      '<div class="rolle"><div class="rolle-innen">' +
        '<p class="rolle-gross">Prüfungsprügler</p>' +
        zeile('Mit Brief und Siegel', 'im ' + az('gipfel').versuche + '. Versuch vor dem Ausschuss · +' + zahl(z.seelen) + ' Seelen') +
        zeile('Deine Bilanz', zahl(S.antworten) + ' Antworten · ' + S.tode + ' ' + (S.tode === 1 ? 'Tod' : 'Tode') + ' · ' + zahl(S.verdient) + ' Seelen') +
        zeile('Deine Titel', alleTitel.map(esc).join('<br>')) +
        zeile('Die Bosse', KREISE.map(k => esc(k.boss)).join('<br>')) +
        zeile('Der Zwischenprüfer', 'hat den neuen Namen bis heute nicht akzeptiert') +
        zeile('Der Prüfungsausschuss', ARENEN.gipfel.phasen.map(p => esc(p.name)).join('<br>')) +
        zeile('Die Kreise und Gesimse', 'Dante Alighieri, der von alledem nichts wusste') +
        zeile('Kaffee', 'ja, sehr viel') +
        zeile('Karten', zahl(KARTEN.length) + ' Begriffe aus AP1 und AP2') +
        '<p>Keine Seele wurde ernsthaft verletzt.</p>' +
        '<p class="rolle-gross">Die echte Prüfung ist leichter.<br>Versprochen.</p>' +
      '</div></div>' +
      '<div class="zeile">' +
        '<button type="button" class="knopf haupt" id="ngplus">Neues Spiel+ beginnen<small>Alle Bosse stehen wieder auf. Seelen ×' + String(K.ngSeelen(S.ng + 1)).replace('.', ',') + ', Schaden ×' + String(K.ngSchaden(S.ng + 1)).replace('.', ',') + '</small></button>' +
        '<button type="button" class="knopf leise" id="bleiben">Oben bleiben</button>' +
      '</div>' +
    '</main>';
  $('#ngplus').addEventListener('click', neuesSpielPlus);
  $('#bleiben').addEventListener('click', () => { S.zeige = null; sichern(); location.hash = ''; render(); window.scrollTo(0, 0); });
  fokus('#bleiben');
}

/* ---------- Effekte ---------- */
function blitz(){
  if (ruhig()) return;
  const b = $('#blitz'); b.classList.remove('an'); void b.offsetWidth; b.classList.add('an');
  const k = $('#karte'); if (k) { k.classList.remove('wackeln'); void k.offsetWidth; k.classList.add('wackeln'); }
}
function seelenFliegen(text){
  const h = $('.seelen-hud');
  if (!h || ruhig()) return;
  const s = document.createElement('span');
  s.className = 'seelen-flug'; s.textContent = text; s.setAttribute('aria-hidden', 'true');
  h.appendChild(s);
  setTimeout(() => s.remove(), 1400);
}

/* ---------- App: Service Worker, Update, Installieren ---------- */
let installEvent = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; installKnopf(); });
function installKnopf(){
  const b = $('#installieren');
  if (!b || !installEvent) return;
  b.hidden = false;
  b.onclick = async () => { installEvent.prompt(); await installEvent.userChoice.catch(() => null); installEvent = null; b.hidden = true; };
}
function toast(html, knopf, fn){
  const t = $('#toast');
  t.innerHTML = '<span>' + html + '</span>' + (knopf ? '<button type="button" class="knopf leise">' + knopf + '</button>' : '');
  t.hidden = false;
  if (knopf) $('button', t).addEventListener('click', fn);
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  let neuLaden = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (neuLaden) location.reload(); });
  navigator.serviceWorker.register('sw.js').then(reg => {
    const bieten = w => toast('Eine neue Fassung ist da.', 'Neu laden', () => { neuLaden = true; w.postMessage('skipWaiting'); });
    if (reg.waiting && navigator.serviceWorker.controller) bieten(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) bieten(w); });
    });
  }).catch(() => {});
}

/* Wer mitten im Sterben die App geschlossen hat, wacht trotzdem am Lagerfeuer auf */
if (S.lauf && S.lauf.leben <= 0 && !S.zeige) sterben();
else render();
document.documentElement.classList.add('bereit');
