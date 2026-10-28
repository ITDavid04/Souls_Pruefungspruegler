/* Prüfungsprügler: Oberfläche und Spielablauf.
   Ablauf: Lagerfeuer -> Kreis wählen -> Gang (10 Karten) -> Lagerfeuer. Nach drei Lagerfeuern im Kreis öffnet das Nebeltor zum Boss.
   Sechs Bosse im Abstieg (AP1) öffnen den Kokytos mit dem Zwischenprüfer; wer ihn besiegt, steigt den Berg hinauf (AP2).
   Liegen alle dreizehn, wartet hinter der Feuerwand der Prüfungsausschuss.
   Die Erweiterung, das Pixelparadies (#/himmel), ist jederzeit offen: sieben Inseln, Sprünge statt Gänge, Herzen, Kombos,
   Bomben und Goldwürfel, ganz oben der Große Glitch. Dort hat body data-welt="pixel", und app.css malt alles in 8 Bit.
   Alles liegt im localStorage: spp.spiel (Spielstand) und spp.prog (Lernkasten je Karte). */
import * as K from './kern.js';
import * as R from './raetsel.js';
import { AKTE, KREISE, KATAKOMBEN, SELTENHEIT, PHANTOM, KUERZEL_SPASS, KATEGORIEN, kreis, kreiseVon, ARENEN, BILD_LAGE, TITEL_BILD, BERG_BILD, ABSPANN_BILD, TITEL_TOR, TITEL_ZITAT, INSCHRIFT, INSCHRIFT_NACHTRAG, FLUESTERN_SPASS, WIEDERKEHR, DURCHGANG, RAST, RAST_BERG, TREFFER, DANEBEN, RAETSEL_AUFTRITT, RAETSEL_BOSS, RAETSEL_DANEBEN, MIMIC, WERKSTATT, WERKSTATT_SATZ, KLASSEN, PIXEL, HIMMEL_BILD, PIXEL_TITEL, PIXEL_BILDER, PIXEL_LAGER, INSELN, PIXEL_ARENEN, himmelVon, BOMBE, LANDUNG, ABSTURZ } from './welt.js';
import * as T from './ton.js';
import * as P from './pixel.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const zahl = n => Number(n).toLocaleString('de-DE');
const ruhig = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const KARTEN = JSON.parse($('#karten').textContent);
const KARTE = new Map(KARTEN.map(c => [c.i, c]));
const KUERZEL = KARTEN.filter(K.istKuerzel);
/* Pixelparadies: jede Begriffskarte bekommt ihre Insel (c.h). Für die Sprünge dort laufen die Themen reihum,
   abwechselnd aus AP1 und AP2, damit schon der erste Sprung gemischt ist und nicht Thema für Thema geht. */
for (const c of KARTEN) if (!K.istKuerzel(c)) c.h = himmelVon(c);
const HIMMEL_KARTEN = INSELN.flatMap(k => {
  const gruppen = new Map();
  for (const c of KARTEN) if (c.h === k.lf) { const g = c.l + '|' + c.t; if (!gruppen.has(g)) gruppen.set(g, []); gruppen.get(g).push(c); }
  const ap1 = [...gruppen.values()].filter(g => g[0].l <= 6), ap2 = [...gruppen.values()].filter(g => g[0].l > 6), reihe = [];
  for (let i = 0; i < Math.max(ap1.length, ap2.length); i++) { if (ap1[i]) reihe.push(ap1[i]); if (ap2[i]) reihe.push(ap2[i]); }
  const out = [];
  for (let i = 0; out.length < reihe.reduce((n, g) => n + g.length, 0); i++) for (const g of reihe) if (g[i]) out.push(g[i]);
  return out;
});

const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k){ try { localStorage.removeItem(k); } catch (e) {} }
};
const SPIEL = 'spp.spiel', PROG = 'spp.prog';
const neuesSpiel = () => ({
  v: 2, gestartet: false, stufe: 1, seelen: 0, verdient: 0, tode: 0, antworten: 0, flakons: 3, roestung: 0, ng: 0,
  blut: null, kreise: {}, arenen: {}, aufstieg: false, bestanden: 0, probe: false, nurAp2: false, frieden: false, wind: true, kampfklang: true, klasse: null, lauf: null, zeige: null,
  startwelt: 'lagerfeuer', stil: 'souls',
  himmel: { herzen: 0, wuerfel: 0, abstuerze: 0, kombo: 0, besucht: false }
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
const aufstiegOffen = () => S.aufstieg || S.probe || S.nurAp2;
const kreisOffen = lf => kreis(lf).akt !== 2 || aufstiegOffen();
const ARENA = id => ARENEN[id] || PIXEL_ARENEN[id];
const arenaOffen = id => S.probe || ARENA(id).voraus.every(besiegt);
const fehlend = id => ARENA(id).voraus.filter(o => !besiegt(o)).length;
const grundLeben = () => K.maxLeben(S.stufe);
const istKlasse = id => S.klasse === id;
const KLASSE = id => KLASSEN.find(k => k.id === id);
const klassenKlang = () => { const k = KLASSE(S.klasse); return k ? k.klang : null; };
const seelenGabe = g => istKlasse('magier') ? Math.round(g * 1.15) : g;
const maxLeben = () => istKlasse('krieger') ? Math.round(grundLeben() * 1.2) : grundLeben();
const heilung = () => K.heilung(S.roestung);
const friede = () => !!S.frieden;
/* Pixelparadies: Inseln und die Glitch-Arena haben akt 3. Herzen statt Lebenspunkte; Herzcontainer gibt es von den Wächtern. */
const istPixel = O => !!O && O.akt === 3;
const iz = lf => { const z = kz(lf); if (z.splitter === undefined) Object.assign(z, { splitter: 0, wuerfel: 0 }); return z; };
const herzMax = () => Math.min(K.HERZEN_MAX, K.HERZEN + (S.himmel.herzen || 0) + (istKlasse('krieger') ? 1 : 0));
const lebenMax = O => istPixel(O) ? herzMax() : maxLeben();
const pixelWelt = () => { document.body.dataset.welt = 'pixel'; };
/* Spielstil: 'souls' (düster, gemalt) oder 'pixel' (das ganze Spiel in 8 Bit, gleiche Regeln) */
const pixelStil = () => S.stil === 'pixel';
const bildVon = name => pixelStil() && PIXEL_BILDER[name] || name;

/* Alles, was ein Kampfort braucht. Ein Kreis ist eine Arena mit einer Phase und den üblichen Regeln;
   die Katakomben bringen eigene Phasen, Seelen und Regeln mit. */
function ortDaten(ort){
  if (typeof ort === 'string') return ARENA(ort);
  const k = kreis(ort), px = k.akt === 3;
  return Object.assign({
    kaffee: 'ja', zeit: 0, tippfehler: 0, seelen: px ? K.PIXEL_SEELEN : K.bossSeelen(k.akt), phasenWort: '',
    phasen: [{ name: k.boss, zusatz: k.bossZusatz, lfs: [ort], treffer: px ? K.PIXEL_BOSS_LP : K.BOSS_TREFFER, bomben: px ? K.PIXEL_BOSS_BOMBE : 0, auftritt: k.auftritt, treffer_: k.treffer_, fehler: k.fehler }]
  }, k, { id: ort, ort: k.name });
}
/* Wie man durch einen Ort geht, für die Sätze nach Tod und Rast */
const gangOrt = O => O.akt === 0 ? 'durch die Katakomben' : O.akt === 2 ? 'über dieses Gesims' : 'durch diesen Kreis';
const ortSeite = ort => typeof ort === 'number' ? (kreis(ort).akt === 3 ? '#/insel/' : '#/kreis/') + ort : '#/' + ort;
const bossName = ort => ortDaten(ort).boss;

const app = $('#app');

/* ---------- Hintergrund mit Überblendung, dazu Schnee oder Glut ---------- */
let bgAktiv = 'a', bgName = null;
function hintergrund(name, art = '', wetter = ''){
  /* Im Pixelstil tauscht jedes gemalte Bild gegen sein Gegenstück in Pixeln; ohne Bild brennt das Lagerfeuer unter Sternen */
  if (pixelStil()) name = name ? bildVon(name) : art === 'tod' || art === 'tod-pruefung' ? null : PIXEL_LAGER;
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
const wetterVon = ort => ort === 'kokytos' ? 'schnee' : ort === 'gipfel' ? 'glut' : ort === K.KATAKOMBEN ? 'staub' : istPixel(ortDaten(ort)) ? 'funken' : '';

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
const kreisMarke = k => k.nr + ' · ' + k.kurz;
function kreisZahlen(lf){
  const t = K.heute(), pool = KARTEN.filter(c => K.imOrt(c, lf));
  return {
    gesamt: pool.length,
    gefunden: pool.filter(c => K.stand(prog, c).r > 0).length,
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
/* Zurück aus der Werkstatt (../?zurueck): ohne Titel dorthin, wo man war */
if (new URLSearchParams(location.search).has('zurueck')) {
  titelGezeigt = true;
  history.replaceState(null, '', location.pathname + location.hash);
}
function render(){
  stoppeUhr();
  if (aufraeumen) { aufraeumen(); aufraeumen = null; }
  document.documentElement.classList.toggle('im-kampf', titelGezeigt && !!S.lauf && !S.zeige);
  document.body.dataset.welt = pixelStil() ? 'pixel' : '';
  T.musik(...musikDerAnsicht());
  if (!titelGezeigt) return titel();
  if (S.zeige) return zeige();
  if (S.lauf) return kampf();
  let m = location.hash.match(/^#\/(kreis|insel)\/(\d+)$/);
  if (m && kreis(Number(m[2])) && kreisOffen(Number(m[2]))) return kreis(Number(m[2])).akt === 3 ? inselSeite(Number(m[2])) : kreisSeite(Number(m[2]));
  m = location.hash.match(/^#\/(kokytos|gipfel)$/);
  if (m) return arenaSeite(m[1]);
  if (location.hash === '#/gebeinhaus') return gebeinhaus();
  if (location.hash === '#/himmel') return himmelKarte();
  if (location.hash === '#/glitch') return glitchSeite();
  return lagerfeuer();
}
window.addEventListener('hashchange', () => { rastSatz = null; render(); window.scrollTo(0, 0); });

/* Musik je Ansicht: welcher Ort klingt und ob gerade ein Boss kämpft (oder hinter dem Tor wartet).
   Im Pixelparadies und im Pixelstil spielt statt der leisen Klänge ein 8-Bit-Thema (px-…), im Bosskampf das der Wächter. */
function klangVon(ort){
  if (ort === 'kokytos' || ort === 'gipfel') return ort;
  if (ort === 'glitch') return 'px-karte';
  if (typeof ort !== 'number' || !kreis(ort)) return null;
  const k = kreis(ort);
  return k.akt === 3 ? (k.planet ? 'px-' + k.planet.toLowerCase() : 'px-karte') : ['katakomben', 'hoelle', 'berg'][k.akt];
}
function ortsKlang(){
  const z = S.zeige, L = S.lauf;
  if (z) return z.art === 'feuer' ? ['lagerfeuer'] : z.art === 'durchgang' ? ['berg'] : z.art === 'bestanden' ? ['gipfel'] : [klangVon(z.ort), z.art === 'tor', z.ort];
  if (L) return [klangVon(L.ort), L.art === 'boss' && !L.gefallen, L.ort];
  const m = location.hash.match(/^#\/(kreis|insel)\/(\d+)$/);
  if (m && kreis(Number(m[2])) && kreisOffen(Number(m[2]))) return [klangVon(Number(m[2]))];
  if (location.hash === '#/kokytos' || location.hash === '#/gipfel') return [location.hash.slice(2)];
  if (location.hash === '#/gebeinhaus') return ['katakomben'];
  if (location.hash === '#/himmel' || location.hash === '#/glitch') return ['px-karte'];
  return ['lagerfeuer'];
}
function musikDerAnsicht(){
  if (!titelGezeigt) return [startHimmel() || pixelStil() ? 'px-karte' : 'hoelle'];
  const [klang, boss, ort] = ortsKlang();
  if (!klang || !(klang.startsWith('px-') || pixelStil())) return [klang, boss];
  if (boss) return [ort === 'glitch' ? 'px-glitch' : 'px-waechter'];
  return [klang.startsWith('px-') ? klang : klang === 'lagerfeuer' ? 'px-rast' : 'px-' + klang];
}

/* Titel: bei jedem Start. Wer zum ersten Mal hier ist, bekommt die Regeln, alle anderen einen Satz, der sich erinnert. */
/* Startwelt: Wer im Pixelparadies startet, bekommt den bunten Titel und landet danach auf der Inselkarte */
const startHimmel = () => S.startwelt === 'himmel';
/* Der Schalter oben auf beiden Titeln: Souls oder Pixel, wirkt sofort */
const stilWahl = () => '<div class="stil-wahl" role="group" aria-label="Spielstil">' +
  [['souls', 'Souls'], ['pixel', 'Pixel']].map(([id, name]) => '<button type="button" class="stil-knopf" data-stil="' + id + '" aria-pressed="' + (S.stil === id) + '">' + name + '</button>').join('') + '</div>';
function stilBinden(){
  $$('.stil-knopf').forEach(b => b.addEventListener('click', () => {
    if (S.stil === b.dataset.stil) return;
    S.stil = b.dataset.stil; sichern(); render();
    if (pixelStil()) T.chip('tor');
    fokus('.stil-knopf[data-stil="' + S.stil + '"]');
  }));
}
function titel(){
  if (startHimmel() || pixelStil()) return pixelTitel();
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
    '<main class="titel' + (erstes ? ' erstes' : '') + '">' + stilWahl() +
      '<div class="tor-schrift" aria-hidden="true"><p class="inschrift">' + esc(INSCHRIFT) + '</p><p class="kritzel">' + esc(INSCHRIFT_NACHTRAG) + '</p></div>' +
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
  stilBinden();
  fokus('#los');
}

/* Der bunte Titel: drei schwebende Inseln, Bit in der Mitte, kein Spuk. Danach geht es zur Inselkarte, außer ein Kampf läuft noch. */
function pixelTitel(){
  pixelWelt();
  hintergrund(HIMMEL_BILD, 'pixel', 'funken');
  const erstes = !S.gestartet, L = S.lauf, mitten = L && L.leben > 0 && !S.zeige;
  const himmel = startHimmel();
  const satz = mitten ? PIXEL_TITEL.lauf : erstes || !himmel ? (himmel ? PIXEL_TITEL.zitat : PIXEL_TITEL.reise) : K.pick(PIXEL_TITEL.sonst);
  const klein = mitten ? esc(ortDaten(L.ort).ort) + ' · ' + (L.art === 'boss' ? esc(ortDaten(L.ort).phasen[L.phase].name) : 'Karte ' + (L.pos + 1) + ' von ' + L.plan.length) : '';
  const waechter = INSELN.filter(k => kz(k.lf).boss).length;
  app.innerHTML =
    '<main class="titel px-titel-seite' + (erstes ? ' erstes' : '') + '">' + stilWahl() +
      '<div class="px-buehne" aria-hidden="true">' +
        '<img class="px-insel buehne-links" src="img/insel-merkur.webp" alt="" width="112" height="124">' +
        '<span class="buehne-mitte"><img class="px-insel" src="img/insel-sonne.webp" alt="" width="112" height="124">' + P.figur('bit', 'buehne-bit') + '</span>' +
        '<img class="px-insel buehne-rechts" src="img/insel-venus.webp" alt="" width="112" height="124">' +
      '</div>' +
      '<div class="titel-unten">' +
        '<p class="ueber">AP1 und AP2 · Fachinformatik</p>' +
        '<h1 class="logo px-logo">Prüfungs&shy;prügler</h1>' +
        '<p class="px-unter">' + (himmel ? esc(PIXEL.name) + ' · ' + esc(PIXEL.zusatz) : 'Die ganze Reise in 8 Bit') + '</p>' +
        '<blockquote class="px-dialog">' + esc(satz) + '</blockquote>' +
        (erstes ? '' : '<p class="titel-stand px-stand">' + (himmel ? '<b>' + zahl(S.himmel.wuerfel || 0) + '</b> Goldwürfel · <b>' + waechter + '</b> von 7 Wächtern · ' : '<b>' + zahl(S.tode) + '</b> ' + (S.tode === 1 ? 'Tod' : 'Tode') + ' · ') + 'Stufe <b>' + S.stufe + '</b> · <b>' + zahl(S.seelen) + '</b> Seelen</p>') +
        '<button type="button" class="knopf haupt" id="los">' + (mitten ? 'Weiterkämpfen' : himmel ? (erstes ? 'Losspringen' : 'Weiterspringen') : erstes ? 'Hinabsteigen' : 'Zum Lagerfeuer') + (klein ? '<small>' + klein + '</small>' : '<small class="blinken">Start drücken</small>') + '</button>' +
        (erstes ? '<ul class="regeln px-regeln px-dialog">' + (himmel ? PIXEL_TITEL.regeln : PIXEL_TITEL.regelnReise).map(r => '<li>' + r + '</li>').join('') + '</ul>' : '') +
      '</div>' +
    '</main>';
  let los = false;
  $('#los').addEventListener('click', () => {
    if (los) return;
    los = true;
    S.gestartet = true; sichern();
    T.chip('tor');
    if (himmel && !S.lauf && !S.zeige && (location.hash === '' || location.hash === '#/')) history.replaceState(null, '', '#/himmel');
    titelGezeigt = true; render(); window.scrollTo(0, 0);
  });
  stilBinden();
  fokus('#los');
}

/* Der Spuk auf dem Titel: roter Schleier, der von oben herabregnet, Augen in der Toröffnung, geflüsterte Begriffe.
   Läuft nur dort und nie bei weniger Bewegung. Augen und Glut hängen an einer Ebene in Bild-Koordinaten,
   die genauso liegt wie das Titelbild (cover, mittig) und mit ihm atmet, damit sie im Tor bleiben. */
function spuk(){
  if (ruhig()) return null;
  const huelle = document.createElement('div');
  huelle.className = 'spuk';
  huelle.setAttribute('aria-hidden', 'true');
  huelle.innerHTML = '<canvas class="regen"></canvas><div class="tor-ebene"><div class="tor-glut"></div><div class="augen"></div></div><div class="fluestern"></div>';
  $('.bg').appendChild(huelle);
  const uhren = [];
  const spaeter = (fn, ms) => uhren.push(setTimeout(fn, ms));
  const T = TITEL_TOR, ebene = $('.tor-ebene', huelle), cv = $('.regen', huelle), ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0, raf = 0;
  const lage = () => {
    W = cv.width = Math.floor(window.innerWidth * dpr); H = cv.height = Math.floor(window.innerHeight * dpr);
    const s = Math.max(window.innerWidth / T.breite, window.innerHeight / T.hoehe);
    Object.assign(ebene.style, { width: T.breite * s + 'px', height: T.hoehe * s + 'px', left: (window.innerWidth - T.breite * s) / 2 + 'px', top: (window.innerHeight - T.hoehe * s) / 2 + 'px' });
    ebene.style.setProperty('--b', s);
  };
  lage();
  window.addEventListener('resize', lage);
  const glut = $('.tor-glut', ebene);
  Object.assign(glut.style, { left: T.glut[0] / T.breite * 100 + '%', top: T.glut[1] / T.hoehe * 100 + '%', width: T.glut[2] * 2 / T.breite * 100 + '%' });

  /* Roter Schleier: feine Fäden fallen von oben und vergehen, bevor sie die Mitte erreichen */
  const neu = anfang => ({
    x: Math.random() * (W + 200 * dpr) - 100 * dpr, y: anfang ? Math.random() * H * 0.8 : -Math.random() * H * 0.25,
    l: (Math.random() * 28 + 14) * dpr, v: (Math.random() * 2 + 1.4) * dpr, a: Math.random() * 0.34 + 0.18, w: (Math.random() < 0.35 ? 1.6 : 1) * dpr
  });
  const faeden = Array.from({ length: 160 }, () => neu(true));
  const zeichnen = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (const f of faeden) {
      f.y += f.v; f.x += f.v * 0.12;
      const rest = 1 - f.y / (H * 0.85);
      if (rest <= 0) { Object.assign(f, neu(false)); continue; }
      ctx.strokeStyle = 'rgba(176,20,14,' + (f.a * Math.min(1, rest * 1.6)).toFixed(3) + ')';
      ctx.lineWidth = f.w;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - f.l * 0.12, f.y - f.l); ctx.stroke();
    }
    raf = requestAnimationFrame(zeichnen);
  };
  zeichnen();

  /* Augen öffnen sich in der Toröffnung, blinzeln, schließen sich wieder; höchstens zwei Paare gleichzeitig */
  const augen = $('.augen', ebene);
  const auge = () => {
    if (augen.childElementCount < 2) {
      const band = K.pick(T.augen), e = document.createElement('i');
      e.className = 'auge';
      e.style.left = (band[0] + Math.random() * (band[1] - band[0])) / T.breite * 100 + '%';
      e.style.top = (band[2] + Math.random() * (band[3] - band[2])) / T.hoehe * 100 + '%';
      e.style.setProperty('--s', (0.6 + Math.random() * 0.6).toFixed(2));
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
    w.textContent = '… ' + (Math.random() < 0.22 ? K.pick(FLUESTERN_SPASS) : K.pick(KARTEN).n.replace(/\s*\(.*?\)\s*/g, '').toLowerCase()) + ' …';
    w.style.left = (4 + Math.random() * 56) + '%';
    w.style.top = (6 + Math.random() * 84) + '%';
    fluestern.appendChild(w);
    spaeter(() => w.remove(), 7000);
    spaeter(fluester, 1700 + Math.random() * 1800);
  };
  spaeter(fluester, 900);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', lage);
    uhren.forEach(clearTimeout);
    huelle.remove();
  };
}

function kachel(k){
  const z = kreisZahlen(k.lf), st = kz(k.lf);
  const zustand = st.boss ? '<span class="marke gold">Bezwungen</span>' : st.feuer >= K.FEUER_ZUM_TOR ? '<span class="marke nebel">Nebeltor offen</span>' : '';
  return '<li><a class="kachel' + (k.akt === 2 ? ' berg-kachel' : k.akt === 0 ? ' katakomben-kachel' : '') + '" href="#/kreis/' + k.lf + '" style="--bild:url(img/' + bildVon(k.bild) + '-klein.webp)">' +
    '<span class="kachel-nr">' + kreisMarke(k) + '</span>' +
    '<strong class="kachel-name">' + esc(k.name) + '</strong>' +
    '<span class="kachel-lf">' + esc(k.lfName) + '</span>' +
    '<span class="kachel-fuss">' + feuerPunkte(st.feuer) + zustand + (S.blut && S.blut.ort === k.lf ? '<span class="marke blut">Blutfleck</span>' : '') + '</span>' +
    '<span class="kachel-zahlen">' + (k.akt === 0 ? z.gefunden + ' von ' + z.gesamt + ' gefunden' : z.sitzen + ' von ' + z.gesamt + ' sitzen') + (z.faellig ? ' · <b>' + z.faellig + ' fällig</b>' : '') + '</span>' +
  '</a></li>';
}
function arenaKachel(id){
  const a = ARENEN[id], offen = arenaOffen(id), fest = besiegt(id), rest = fehlend(id);
  const text = fest ? (id === 'gipfel' ? 'Bestanden. Der Stuhl ist leer.' : 'Bezwungen. Das Eis schweigt.')
    : offen ? (id === 'gipfel' ? 'Das Feuer brennt. Der Stuhl wartet.' : 'Das Eis knackt. Er wartet.')
    : 'Erst wenn alle ' + (id === 'gipfel' ? 'dreizehn Bosse' : 'sechs Bosse des Abstiegs') + ' liegen. Noch ' + rest + '.';
  return '<li><a class="kachel arena arena-' + id + (offen || fest ? '' : ' zu') + '" href="#/' + id + '" style="--bild:url(img/' + bildVon(a.bild) + '-klein.webp)">' +
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
  const preis = K.stufenPreis(S.stufe), kann = S.seelen >= preis && grundLeben() < 200;
  const blutOrt = S.blut ? ortDaten(S.blut.ort) : null;
  const bosseIn = akt => kreiseVon(akt).filter(k => kz(k.lf).boss).length;
  const titelListe = KREISE.concat([KATAKOMBEN], INSELN).filter(k => kz(k.lf).boss).map(k => k.titel).concat(Object.keys(ARENEN).concat(Object.keys(PIXEL_ARENEN)).filter(id => besiegt(id)).map(id => ARENA(id).titel));
  const waechter = INSELN.filter(k => kz(k.lf).boss).length;
  app.innerHTML =
    '<main class="hub">' +
      '<section class="feuerstelle">' +
        (pixelStil() ? P.lagerfeuer() : FLAMME) +
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
        (grundLeben() >= 200 ? 'Höchste Stufe erreicht' : kann ? 'Stufe aufsteigen · ' + zahl(preis) + ' Seelen' : 'Stufe ' + (S.stufe + 1) + ' für ' + zahl(preis) + ' Seelen') +
        '<small>' + (grundLeben() >= 200 ? 'Mehr Leben gibt es nicht' : '+5 Leben je Stufe') + '</small></button>' +
      (blutOrt ? '<p class="hinweis blut-hinweis"><b>' + zahl(S.blut.seelen) + ' Seelen</b> liegen ' + (blutOrt.wo ? esc(blutOrt.wo) : typeof S.blut.ort === 'number' ? 'im ' + esc(blutOrt.nr) + ', ' + esc(blutOrt.name) : 'bei ' + esc(blutOrt.boss)) + '. Hol sie dir, bevor du woanders stirbst.</p>' : '') +
      '<section class="klassen" aria-label="Deine Klasse">' +
        '<h2 class="abschnitt"><span>Deine Klasse</span><small>' + (S.klasse ? esc(KLASSE(S.klasse).name + ' · ' + KLASSE(S.klasse).titel) : 'frei wählbar') + '</small></h2>' +
        '<ul class="klassen-liste">' + KLASSEN.map(k =>
          '<li><button type="button" class="klasse-karte' + (S.klasse === k.id ? ' gewaehlt' : '') + '" data-klasse="' + k.id + '" aria-pressed="' + (S.klasse === k.id) + '">' +
            '<b class="klasse-name">' + esc(k.name) + '</b><span class="klasse-titel">' + esc(k.titel) + '</span>' +
            '<span class="klasse-gabe">' + esc(k.gabe) + '</span></button></li>').join('') + '</ul>' +
        (S.klasse ? '<button type="button" class="knopf leise klasse-ab" id="klasse-ab">Klasse ablegen</button>' : '') +
      '</section>' +
      '<h2 class="abschnitt"><span>' + AKTE[0].name + '</span><small>' + AKTE[0].zusatz + ' · ' + bosseIn(1) + ' von 6 Bossen</small></h2>' +
      '<ul class="kacheln">' + kreiseVon(1).map(kachel).join('') + arenaKachel('kokytos') + '</ul>' +
      '<h2 class="abschnitt berg-abschnitt"><span>' + AKTE[1].name + '</span><small>' + AKTE[1].zusatz + (berg ? ' · ' + bosseIn(2) + ' von 6 Bossen' : '') + '</small></h2>' +
      '<ul class="kacheln">' +
        (berg ? kreiseVon(2).map(kachel).join('')
          : '<li><div class="kachel zu berg-zu" style="--bild:url(img/' + bildVon(BERG_BILD) + '-klein.webp)">' +
              '<span class="kachel-nr">Jenseits des Eises</span><strong class="kachel-name">Der Läuterungsberg</strong>' +
              '<span class="kachel-lf">Hinter dem Zwischenprüfer. Wer durch das Eis geht, sieht den Berg.</span></div></li>') +
        arenaKachel('gipfel') +
      '</ul>' +
      '<h2 class="abschnitt katakomben-abschnitt"><span>' + esc(KATAKOMBEN.nr) + '</span><small>Jederzeit offen · ' + zahl(KUERZEL.length) + ' Kürzel aus AP1 und AP2</small></h2>' +
      '<ul class="kacheln">' + kachel(KATAKOMBEN) + '</ul>' +
      '<h2 class="abschnitt pixel-abschnitt"><span>Die Erweiterung</span><small>' + esc(PIXEL.riss) + '</small></h2>' +
      '<a class="px-riss" href="#/himmel" style="--bild:url(img/' + HIMMEL_BILD + '-klein.webp)">' +
        '<span class="riss-bild" aria-hidden="true"><img class="px-insel" src="img/insel-sonne.webp" alt="" width="112" height="124">' + P.figur('bit', 'riss-bit') + '</span>' +
        '<span class="riss-text"><span class="riss-nr">Jederzeit offen · ' + PIXEL.zusatz + '</span><strong class="riss-name">' + esc(PIXEL.name) + '</strong>' +
          '<span class="riss-lf">Sieben Inseln, AP1 und AP2 nach Themen gemischt. Kombos, Bomben, Goldwürfel.</span>' +
          '<span class="riss-fuss"><b>' + zahl(S.himmel.wuerfel || 0) + '</b> Goldwürfel · <b>' + waechter + '</b> von 7 Wächtern' + (besiegt('glitch') ? ' · Glitch besiegt' : '') + '</span></span>' +
      '</a>' +
      '<h2 class="abschnitt werkstatt-abschnitt"><span>Die Werkstatt</span><small>' + esc(WERKSTATT_SATZ) + '</small></h2>' +
      '<ul class="werkstatt-liste">' + WERKSTATT.map(([seite, name, was]) => '<li><a href="werkstatt/' + seite + '"><b>' + esc(name) + '</b><span>' + esc(was) + '</span></a></li>').join('') + '</ul>' +
      '<details class="spielstand"><summary>Spielstand</summary>' +
        '<p>' + zahl(S.verdient) + ' Seelen verdient · ' + zahl(S.antworten) + ' Antworten · ' + S.tode + ' ' + (S.tode === 1 ? 'Tod' : 'Tode') + ' · ' + KARTEN.filter(c => K.stand(prog, c).b > 0).length + ' von ' + zahl(KARTEN.length) + ' Karten gesehen' +
          (S.raetsel && S.raetsel.versucht ? ' · ' + S.raetsel.geloest + ' von ' + S.raetsel.versucht + ' Rätseln gelöst' : '') + '</p>' +
        (titelListe.length ? '<p class="titel-liste"><b>Deine Titel:</b> ' + titelListe.map(esc).join(' · ') + '</p>' : '') +
        '<label class="probe"><input type="checkbox" id="stil"' + (pixelStil() ? ' checked' : '') + '> Pixelstil für das ganze Spiel <small>Alle Kreise, Gesimse und Arenen in 8 Bit. Regeln und Lernstand bleiben gleich.</small></label>' +
        '<label class="probe"><input type="checkbox" id="startwelt"' + (startHimmel() ? ' checked' : '') + '> Im Pixelparadies starten <small>Bunter Titel, danach direkt zur Inselkarte. Das Lagerfeuer bleibt einen Schritt entfernt.</small></label>' +
        '<label class="probe"><input type="checkbox" id="frieden"' + (S.frieden ? ' checked' : '') + '> Ruhiger Modus <small>Ohne Leben und Tod. Lernen ohne Sterben.</small></label>' +
        '<label class="probe"><input type="checkbox" id="musik"' + (S.musik !== false ? ' checked' : '') + '> Musik <small>Jeder Ort klingt eigen, im Pixelstil als 8-Bit-Abenteuer.</small></label>' +
        '<label class="probe"><input type="checkbox" id="wind"' + (S.wind !== false ? ' checked' : '') + '> Wind <small>Ein ruhiger Wind nach dem ersten Tippen.</small></label>' +
        '<label class="probe"><input type="checkbox" id="kampfklang"' + (S.kampfklang !== false ? ' checked' : '') + '> Kampfklang <small>Kurze Klänge beim Antworten im Kampf.</small></label>' +
        (!S.aufstieg ? '<label class="probe"><input type="checkbox" id="nurAp2"' + (S.nurAp2 ? ' checked' : '') + '> Nur AP2 lernen <small>Öffnet den Läuterungsberg sofort, ohne den Zwischenprüfer.</small></label>' : '') +
        '<label class="probe"><input type="checkbox" id="probe"' + (S.probe ? ' checked' : '') + '> Prototyp: alle Tore offen <small>Zum Ansehen. Bosse zählen erst, wenn du sie besiegst.</small></label>' +
        '<button type="button" class="knopf leise" id="installieren" hidden>App installieren</button>' +
        '<div class="loeschen" id="loeschen"><button type="button" class="knopf leise gefahr" id="loeschen-frage">Spielstand löschen</button></div>' +
      '</details>' +
    '</main>';
  $('#aufstieg').addEventListener('click', () => {
    const p = K.stufenPreis(S.stufe);
    if (S.seelen < p || grundLeben() >= 200) return;
    S.seelen -= p; S.stufe++; sichern(); render(); T.aufstieg();
    const w = $('.werte'); if (w) w.classList.add('aufgestiegen');
    fokus('#aufstieg');
  });
  $$('.klasse-karte').forEach(b => b.addEventListener('click', () => { S.klasse = b.dataset.klasse; sichern(); T.schlag({ gut: true, klang: klassenKlang() }); render(); fokus('.klasse-karte.gewaehlt'); }));
  const klasseAb = $('#klasse-ab'); if (klasseAb) klasseAb.addEventListener('click', () => { S.klasse = null; sichern(); render(); fokus('.klasse-karte'); });
  $('#probe').addEventListener('change', e => { S.probe = e.target.checked; sichern(); render(); $('.spielstand').open = true; fokus('#probe'); });
  $('#stil').addEventListener('change', e => { S.stil = e.target.checked ? 'pixel' : 'souls'; sichern(); render(); $('.spielstand').open = true; fokus('#stil'); });
  $('#startwelt').addEventListener('change', e => { S.startwelt = e.target.checked ? 'himmel' : 'lagerfeuer'; sichern(); });
  const friedenKnopf = $('#frieden'); if (friedenKnopf) friedenKnopf.addEventListener('change', e => { S.frieden = e.target.checked; sichern(); render(); $('.spielstand').open = true; fokus('#frieden'); });
  const ap2Knopf = $('#nurAp2'); if (ap2Knopf) ap2Knopf.addEventListener('change', e => { S.nurAp2 = e.target.checked; sichern(); render(); $('.spielstand').open = true; fokus('#nurAp2'); });
  const musikKnopf = $('#musik'); if (musikKnopf) musikKnopf.addEventListener('change', e => { S.musik = e.target.checked; sichern(); T.setzenMusik(S.musik); });
  const windKnopf = $('#wind'); if (windKnopf) windKnopf.addEventListener('change', e => { S.wind = e.target.checked; sichern(); T.setzen(S.wind); });
  const kkKnopf = $('#kampfklang'); if (kkKnopf) kkKnopf.addEventListener('change', e => { S.kampfklang = e.target.checked; sichern(); T.setzenFx(S.kampfklang); });
  $('#loeschen-frage').addEventListener('click', () => {
    $('#loeschen').innerHTML = '<span>Alles löschen, auch den Lernstand?</span><button type="button" class="knopf leise gefahr" id="loeschen-ja">Ja, löschen</button><button type="button" class="knopf leise" id="loeschen-nein">Abbrechen</button>';
    $('#loeschen-ja').addEventListener('click', () => { store.del(SPIEL); store.del(PROG); S = neuesSpiel(); prog = {}; location.hash = ''; render(); });
    $('#loeschen-nein').addEventListener('click', render);
    fokus('#loeschen-nein');
  });
  installKnopf();
}

/* Im Pixelstil steht die Szene am Handy gerahmt oben auf der Seite; als Vollbild wäre sie dort nur ein Ausschnitt */
const buehnenbild = bild => pixelStil() ? '<figure class="px-buehnenbild" style="--szene:url(img/' + bildVon(bild) + '.webp)" aria-hidden="true"></figure>' : '';

/* Kreis oder Gesims: Bild, Zitat, Stand, Gang oder Nebeltor */
function kreisSeite(lf){
  const k = kreis(lf), st = kz(lf), z = kreisZahlen(lf);
  hintergrund(k.bild, 'kreis');
  const torOffen = st.feuer >= K.FEUER_ZUM_TOR && !st.boss;
  app.innerHTML =
    '<main class="kreis-seite' + (k.akt === 2 ? ' am-berg' : k.akt === 0 ? ' in-katakomben' : '') + '">' +
      '<a class="zurueck" href="#/">Zum Lagerfeuer</a>' + buehnenbild(k.bild) +
      '<header class="kreis-kopf">' +
        '<p class="ueber">' + kreisMarke(k) + '</p>' +
        '<h1 class="kreis-name">' + esc(k.name) + '</h1>' +
        '<p class="kreis-lf">' + esc(k.lfName) + '</p>' +
      '</header>' +
      '<blockquote class="zitat">' + esc(k.zitat) + '</blockquote>' +
      '<section class="kreis-stand">' +
        '<p>' + feuerPunkte(st.feuer) + ' <span>' + (st.feuer >= K.FEUER_ZUM_TOR ? 'Alle Lagerfeuer brennen' : 'Lagerfeuer ' + st.feuer + ' von ' + K.FEUER_ZUM_TOR) + '</span></p>' +
        '<p class="zahlen"><b>' + z.sitzen + '</b> von ' + z.gesamt + ' sitzen · <b>' + z.faellig + '</b> fällig · <b>' + z.neu + '</b> neu</p>' +
        (R.IM_GANG[lf] ? '<p class="raetsel-hinweis">Zwischen den Karten lauern hier ' + R.arten(lf).map(a => R.MEHRZAHL[a]).join(', ').replace(/, ([^,]*)$/, ' und $1') + '.</p>' : '') +
        (S.blut && S.blut.ort === lf ? '<p class="blut-hinweis">Dein Blutfleck liegt hier: <b>' + zahl(S.blut.seelen) + ' Seelen</b>. ' + (S.blut.raetsel ? 'Das Rätsel, das dich erledigt hat, wartet als Erstes.' : 'Die Karte kommt als Erstes.') + '</p>' : '') +
      '</section>' +
      '<div class="aktionen">' +
        '<button type="button" class="knopf haupt" id="gang">Gang beginnen<small>' + K.GANG + ' Karten' + (R.IM_GANG[lf] ? ' und ' + (R.IM_GANG[lf] === 1 ? 'ein Rätsel' : R.IM_GANG[lf] + ' Rätsel') : '') + ', am Ende ein Lagerfeuer</small></button>' +
        (torOffen || (S.probe && !st.boss) ? '<button type="button" class="knopf nebeltor" id="tor">Nebeltor durchschreiten<small>' + esc(k.boss) + ' wartet</small></button>'
          : st.boss ? '<p class="bezwungen"><b>' + esc(k.boss) + '</b> liegt im Staub. Titel: <b>' + esc(k.titel) + '</b></p>'
          : '<p class="tor-zu">Das Nebeltor öffnet sich nach ' + K.FEUER_ZUM_TOR + ' Lagerfeuern. Dahinter: ' + esc(k.boss) + '.</p>') +
        (lf === K.KATAKOMBEN ? '<a class="knopf" href="#/gebeinhaus" id="gebeinhaus">Das Gebeinhaus<small>' + z.gefunden + ' von ' + z.gesamt + ' Kürzeln gefunden</small></a>' : '') +
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
      '<a class="zurueck" href="#/">Zum Lagerfeuer</a>' + buehnenbild(a.bild) +
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

/* ---------- Das Pixelparadies ---------- */
const wuerfelReihe = n => Array.from({ length: K.WUERFEL_ZUM_TOR }, (_, i) => P.figur('wuerfel', 'wuerfel-zelle' + (i < n ? '' : ' leer'))).join('');
/* Woher die Karten einer Insel kommen: Lernfelder der AP1 als LF, Prüfungsbereiche der AP2 mit Namen */
function inselQuellen(lf){
  const l = [...new Set(KARTEN.filter(c => c.h === lf).map(c => c.l))].sort((a, b) => a - b);
  return l.map(x => x <= 6 ? 'LF' + x : kreis(x).lfName).join(' · ');
}

/* Die Inselkarte: sieben Inseln übereinander wie ein Turm, ganz oben der Riss. Bit steht auf der ersten Insel ohne besiegten Wächter. */
function himmelKarte(){
  pixelWelt();
  hintergrund(HIMMEL_BILD, 'pixel', 'funken');
  const erstes = !S.himmel.besucht;
  if (erstes) { S.himmel.besucht = true; sichern(); }
  const waechter = INSELN.filter(k => kz(k.lf).boss).length, hier = (INSELN.find(k => !kz(k.lf).boss) || INSELN[INSELN.length - 1]).lf;
  const G = PIXEL_ARENEN.glitch, gOffen = arenaOffen('glitch'), gFest = besiegt('glitch');
  const stock = (k, i) => {
    const z = iz(k.lf), zz = kreisZahlen(k.lf), fest = z.boss, tor = !fest && z.wuerfel >= K.WUERFEL_ZUM_TOR;
    return '<li class="stock ' + (i % 2 ? 'rechts' : 'links') + (fest ? ' bezwungen' : '') + (k.lf === hier ? ' hier' : '') + '">' +
      '<a class="stock-link" href="#/insel/' + k.lf + '">' +
        '<span class="stock-bild" style="--verzug:' + (-i * .7).toFixed(1) + 's" aria-hidden="true"><img class="px-insel" src="img/' + k.sprite + '.webp" alt="" width="112" height="124">' +
          (k.lf === hier ? P.figur('bit', 'stock-bit') : '') + (fest ? P.figur(P.WAECHTER[k.lf], 'stock-waechter besiegt') : '') + '</span>' +
        '<span class="stock-schild"><span class="riss-nr">' + esc(k.nr) + ' · ' + esc(k.planet) + '</span>' +
          '<strong class="stock-name">' + esc(k.name) + '</strong><span class="stock-thema">' + esc(k.lfName) + '</span>' +
          '<span class="stock-wuerfel" aria-label="' + Math.min(z.wuerfel, K.WUERFEL_ZUM_TOR) + ' von ' + K.WUERFEL_ZUM_TOR + ' Goldwürfeln">' + wuerfelReihe(z.wuerfel) + '</span>' +
          '<span class="stock-fuss">' + (fest ? '<span class="px-marke gold">Wächter besiegt</span>' : tor ? '<span class="px-marke lila">Würfeltor offen</span>' : '') +
            '<span>' + zz.sitzen + ' von ' + zz.gesamt + ' sitzen' + (zz.faellig ? ' · <b>' + zz.faellig + ' fällig</b>' : '') + '</span></span></span>' +
      '</a></li>';
  };
  app.innerHTML =
    '<main class="himmel-karte px-seite">' +
      '<a class="zurueck" href="#/">Zum Lagerfeuer</a>' +
      '<header class="px-kopf">' +
        '<p class="ueber">Die Erweiterung</p>' +
        '<h1 class="px-titel">' + esc(PIXEL.name) + '</h1>' +
        '<p class="px-unter">' + esc(PIXEL.zusatz) + '</p>' +
      '</header>' +
      '<blockquote class="px-dialog">' + esc(PIXEL.zitat) + '</blockquote>' +
      (erstes ? '<ul class="regeln px-regeln px-dialog">' + PIXEL.regeln.map(r => '<li>' + r + '</li>').join('') + '</ul>' : '') +
      '<section class="px-werte" aria-label="Dein Stand im Pixelparadies">' +
        '<div>' + P.figur('wuerfel', 'wert-figur') + '<b>' + zahl(S.himmel.wuerfel || 0) + '</b><span>Goldwürfel</span></div>' +
        '<div>' + P.figur('herz', 'wert-figur') + '<b>' + herzMax() + '</b><span>Herzen</span></div>' +
        '<div>' + P.figur('golem', 'wert-figur') + '<b>' + waechter + '/7</b><span>Wächter</span></div>' +
        '<div>' + P.figur('bombe', 'wert-figur') + '<b>×' + (S.himmel.kombo || 0) + '</b><span>Beste Kombo</span></div>' +
      '</section>' +
      '<button type="button" class="knopf leise px-start" id="hier-starten" aria-pressed="' + startHimmel() + '">' + (startHimmel() ? 'Startwelt: Pixelparadies' : 'Hier starten') +
        '<small>' + (startHimmel() ? 'Die App startet bunt und landet hier. Antippen, um wieder am Lagerfeuer zu erwachen.' : 'Bunter Titel, danach direkt auf diese Karte') + '</small></button>' +
      '<ol class="turm" reversed>' +
        '<li class="stock gipfel-stock' + (gOffen || gFest ? '' : ' zu') + (gFest ? ' bezwungen' : '') + '">' +
          '<a class="stock-link" href="#/glitch">' +
            '<span class="stock-bild" aria-hidden="true"><img class="px-insel" src="img/' + G.sprite + '.webp" alt="" width="112" height="124">' + (gFest ? '' : P.figur('glitch', 'stock-glitch')) + '</span>' +
            '<span class="stock-schild"><span class="riss-nr">' + esc(G.nr) + '</span><strong class="stock-name">' + esc(G.boss) + '</strong>' +
              '<span class="stock-thema">' + (gFest ? 'Besiegt. Die Pixel sind geblieben.' : gOffen ? 'Der Riss steht offen. Er wartet.' : 'Erst wenn alle sieben Wächter liegen. Noch ' + fehlend('glitch') + '.') + '</span>' +
              (gFest ? '<span class="stock-fuss"><span class="px-marke gold">Besiegt</span></span>' : gOffen ? '<span class="stock-fuss"><span class="px-marke lila">Offen</span></span>' : '') + '</span>' +
          '</a></li>' +
        INSELN.slice().reverse().map((k, i) => stock(k, i + 1)).join('') +
      '</ol>' +
      (erstes ? '' : '<details class="px-dialog px-mehr"><summary>Regeln im Pixelparadies</summary><ul class="regeln px-regeln">' + PIXEL.regeln.map(r => '<li>' + r + '</li>').join('') + '</ul></details>') +
    '</main>';
  $('#hier-starten').addEventListener('click', () => {
    S.startwelt = startHimmel() ? 'lagerfeuer' : 'himmel'; sichern();
    const b = $('#hier-starten');
    b.setAttribute('aria-pressed', String(startHimmel()));
    b.innerHTML = (startHimmel() ? 'Startwelt: Pixelparadies' : 'Hier starten') + '<small>' + (startHimmel() ? 'Die App startet bunt und landet hier. Antippen, um wieder am Lagerfeuer zu erwachen.' : 'Bunter Titel, danach direkt auf diese Karte') + '</small>';
    T.chip(startHimmel() ? 'splitter' : 'daneben');
  });
  /* Wer wiederkommt, landet bei seiner Insel; beim ersten Mal bleiben die Regeln oben im Blick */
  if (!erstes) requestAnimationFrame(() => { const h = $('.stock.hier'); if (h && location.hash === '#/himmel') h.scrollIntoView({ block: 'center' }); });
}

/* Eine Insel: groß, schwebend, mit Bit auf dem Gras. Darunter Goldwürfel, Beutel, Lernstand, Sprung und Würfeltor. */
function inselSeite(lf){
  const k = kreis(lf), z = iz(lf), zz = kreisZahlen(lf), torOffen = !z.boss && (z.wuerfel >= K.WUERFEL_ZUM_TOR || S.probe);
  pixelWelt();
  hintergrund(k.bild, 'pixel', 'funken');
  app.innerHTML =
    '<main class="insel-seite px-seite">' +
      '<a class="zurueck" href="#/himmel">Zur Inselkarte</a>' +
      '<header class="px-kopf">' +
        '<p class="ueber">' + esc(k.nr) + ' · ' + esc(k.planet) + '</p>' +
        '<h1 class="px-titel">' + esc(k.name) + '</h1>' +
        '<p class="px-unter">' + esc(k.lfName) + '</p>' +
      '</header>' +
      '<figure class="insel-gross" aria-hidden="true"><img class="px-insel" src="img/' + k.sprite + '.webp" alt="" width="112" height="124">' +
        P.figur('bit', 'insel-bit') + (torOffen ? P.figur(P.WAECHTER[lf], 'insel-waechter') : '') + '</figure>' +
      '<blockquote class="px-dialog">' + esc(k.zitat) + '</blockquote>' +
      '<section class="px-panel insel-stand">' +
        '<p class="stand-zeile">' + wuerfelReihe(z.wuerfel) + '<span><b>' + Math.min(z.wuerfel, K.WUERFEL_ZUM_TOR) + ' von ' + K.WUERFEL_ZUM_TOR + '</b> Goldwürfeln' + (z.wuerfel > K.WUERFEL_ZUM_TOR ? ' (' + z.wuerfel + ' gesammelt)' : '') + '</span></p>' +
        '<p class="stand-zeile">' + P.beutel(z.splitter, K.SPLITTER_JE_WUERFEL) + '<span><b>' + z.splitter + ' von ' + K.SPLITTER_JE_WUERFEL + '</b> Splittern im Beutel</span></p>' +
        '<p class="zahlen"><b>' + zz.sitzen + '</b> von ' + zz.gesamt + ' sitzen · <b>' + zz.faellig + '</b> fällig · <b>' + zz.neu + '</b> neu</p>' +
        '<p class="quellen">Gemischt aus ' + esc(inselQuellen(lf)) + '</p>' +
      '</section>' +
      '<div class="aktionen">' +
        '<button type="button" class="knopf haupt" id="gang">Losspringen<small>' + K.GANG + ' Karten, ' + (friede() ? 'ruhig und ohne Bomben' : K.BOMBEN_JE_SPRUNG + ' davon mit Lunte') + ', am Ende eine Wolke</small></button>' +
        (torOffen ? '<button type="button" class="knopf px-tor" id="tor">Würfeltor öffnen<small>' + esc(k.boss) + ' wartet</small></button>'
          : z.boss ? '<p class="bezwungen">' + esc(k.boss) + ' ist besiegt. Titel: <b>' + esc(k.titel) + '</b></p>'
          : '<p class="tor-zu">Das Würfeltor öffnet sich mit ' + K.WUERFEL_ZUM_TOR + ' Goldwürfeln. Dahinter: ' + esc(k.boss) + '.</p>') +
      '</div>' +
    '</main>';
  $('#gang').addEventListener('click', () => gangStart(lf));
  const tor = $('#tor');
  if (tor) tor.addEventListener('click', () => { S.zeige = { art: 'tor', ort: lf }; sichern(); render(); T.chip('tor'); });
  fokus('#gang');
}

/* Ganz oben: der Riss mit dem Großen Glitch, offen erst, wenn alle sieben Wächter liegen */
function glitchSeite(){
  const G = PIXEL_ARENEN.glitch, offen = arenaOffen('glitch'), fest = besiegt('glitch');
  pixelWelt();
  hintergrund(G.bild, 'pixel', 'funken');
  app.innerHTML =
    '<main class="glitch-seite px-seite">' +
      '<a class="zurueck" href="#/himmel">Zur Inselkarte</a>' +
      '<header class="px-kopf">' +
        '<p class="ueber">' + esc(G.nr) + ' · ' + esc(G.name) + '</p>' +
        '<h1 class="px-titel">' + esc(G.boss) + '</h1>' +
        '<p class="px-unter">' + esc(G.bossZusatz) + '</p>' +
      '</header>' +
      '<figure class="insel-gross" aria-hidden="true"><img class="px-insel" src="img/' + G.sprite + '.webp" alt="" width="112" height="124">' + (fest ? '' : P.figur('glitch', 'insel-waechter')) + '</figure>' +
      '<blockquote class="px-dialog">' + esc(G.zitat) + '</blockquote>' +
      '<section class="px-panel insel-stand">' +
        '<p>' + (fest ? 'Besiegt. Titel: <b>' + esc(G.titel) + '</b>' : !offen ? 'Noch ' + fehlend('glitch') + ' von 7 Wächtern stehen im Weg.' : fehlend('glitch') ? 'Prototyp-Schalter: Der Riss ist offen, obwohl noch ' + fehlend('glitch') + ' Wächter stehen.' : 'Alle sieben Wächter liegen. Der Riss ist offen.') + '</p>' +
        '<ul class="voraus px-voraus" aria-label="Diese Wächter müssen liegen">' + G.voraus.map(o => {
          const ok = besiegt(o);
          return '<li class="' + (ok ? 'erfuellt' : 'offen') + '">' + P.figur(P.WAECHTER[o], 'voraus-figur' + (ok ? '' : ' schatten')) + '<span>' + esc(kreis(o).boss) + '<span class="sr">' + (ok ? ' besiegt' : ' noch nicht besiegt') + '</span></span></li>';
        }).join('') + '</ul>' +
      '</section>' +
      '<div class="aktionen">' +
        (fest ? '' : offen ? '<button type="button" class="knopf px-tor" id="tor">In den Riss springen<small>' + esc(G.boss) + ' wartet</small></button>'
          : '<p class="tor-zu">Der Riss lässt nur durch, wer alle sieben Wächter besiegt hat.</p>') +
      '</div>' +
    '</main>';
  const tor = $('#tor');
  if (tor) { tor.addEventListener('click', () => { S.zeige = { art: 'tor', ort: 'glitch' }; sichern(); render(); T.chip('tor'); }); fokus('#tor'); }
}

/* Gebeinhaus unter den Katakomben: jedes Kürzel, das einmal richtig war, bekommt seine Nische.
   Wer es dreimal hintereinander weiß (Fach 4 im Lernkasten), dem brennt davor eine Kerze. */
let gbKategorie = '', gbSuche = '';
function gebeinhaus(){
  hintergrund(KATAKOMBEN.bild, 'gebeinhaus', 'staub');
  const gefunden = c => K.stand(prog, c).r > 0;
  const anteil = t => { const l = KUERZEL.filter(c => !t || c.t === t); return l.filter(gefunden).length + '/' + l.length; };
  app.innerHTML =
    '<main class="gebeinhaus">' +
      '<a class="zurueck" href="#/kreis/' + K.KATAKOMBEN + '">Zu den Katakomben</a>' +
      '<header class="gb-kopf">' +
        '<p class="ueber">Unter den Katakomben</p>' +
        '<h1 class="kreis-name">Das Gebeinhaus</h1>' +
        '<p class="kreis-lf"><b>' + KUERZEL.filter(gefunden).length + '</b> von ' + zahl(KUERZEL.length) + ' Kürzeln gefunden · <b>' + KUERZEL.filter(c => K.sitzt(prog, c)).length + '</b> mit Kerze</p>' +
      '</header>' +
      '<blockquote class="zitat">Jedes Kürzel, das du einmal richtig hattest, bekommt hier seine Nische. Wer es dreimal hintereinander weiß, dem brennt davor eine Kerze.</blockquote>' +
      '<div class="gb-filter" role="group" aria-label="Kategorie">' + [''].concat(KATEGORIEN).map(t =>
        '<button type="button" class="chip" data-t="' + esc(t) + '" aria-pressed="' + (gbKategorie === t) + '">' + esc(t || 'Alle') + ' <small>' + anteil(t) + '</small></button>').join('') + '</div>' +
      '<input type="search" class="gb-suche" id="gb-suche" placeholder="Kürzel suchen" aria-label="Kürzel suchen" autocomplete="off" spellcheck="false" value="' + esc(gbSuche) + '">' +
      '<ul class="nischen" id="nischen"></ul>' +
      '<div class="nische-blatt" id="nische-blatt" role="dialog" aria-labelledby="nb-titel" hidden></div>' +
    '</main>';
  const zeichnen = () => {
    const q = gbSuche.trim().toLowerCase();
    const liste = KUERZEL.filter(c => (!gbKategorie || c.t === gbKategorie) && (!q || c.n.toLowerCase().includes(q) || (gefunden(c) && c.lang.toLowerCase().includes(q))))
      .sort((a, b) => a.n.localeCompare(b.n, 'de', { sensitivity: 'base' }));
    $('#nischen').innerHTML = liste.length ? liste.map(c => {
      const da = gefunden(c);
      return '<li><button type="button" class="nische r' + c.r + (da ? '' : ' leer') + (K.sitzt(prog, c) ? ' kerze' : '') + '" data-i="' + c.i + '">' +
        '<span class="ni-k">' + esc(c.n) + '</span><span class="ni-l">' + (da ? esc(c.lang) : '? ? ?') + '</span></button></li>';
    }).join('') : '<li class="nichts">Hier liegt nichts. Noch nicht.</li>';
  };
  zeichnen();
  const blatt = $('#nische-blatt');
  let von = null;
  const zu = () => { blatt.hidden = true; blatt.innerHTML = ''; if (von && document.contains(von)) von.focus({ preventScroll: true }); };
  const zeigen = c => {
    const s = K.stand(prog, c), da = s.r > 0;
    blatt.innerHTML = '<div class="nb-innen">' +
      '<p class="karte-kopf"><span>' + esc(c.t) + '</span><b class="rang r' + c.r + '">' + SELTENHEIT[c.r] + '</b></p>' +
      '<p class="kuerzel-gross" id="nb-titel">' + esc(c.n) + '</p>' +
      (da ? '<p class="loesung">' + markiert(c) + '</p><p class="merke">' + esc(c.d) + '</p>' + (c.j ? '<p class="spruch">Inoffiziell: „' + esc(c.j) + '“</p>' : '')
        : '<p class="hinweis">Noch nicht gefunden. Es liegt irgendwo da unten in einem Gang und wartet.</p>') +
      '<p class="klein">' + s.r + '× richtig, ' + s.w + '× falsch' + (K.sitzt(prog, c) ? ' · die Kerze brennt' : '') + '</p>' +
      '<button type="button" class="knopf leise" id="nb-zu">Schließen</button></div>';
    blatt.hidden = false;
    $('#nb-zu').addEventListener('click', zu);
    fokus('#nb-zu');
  };
  $('.gb-filter').addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    gbKategorie = b.dataset.t;
    $$('.gb-filter .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    zeichnen();
  });
  $('#gb-suche').addEventListener('input', e => { gbSuche = e.target.value; zeichnen(); });
  $('#nischen').addEventListener('click', e => { const b = e.target.closest('.nische'); if (b) { von = b; zeigen(KARTE.get(b.dataset.i)); } });
  const taste = e => { if (e.key === 'Escape' && !blatt.hidden) zu(); };
  document.addEventListener('keydown', taste);
  aufraeumen = () => document.removeEventListener('keydown', taste);
}

/* ---------- Kampf ---------- */
function laufStart(art, ort, extra){
  const O = ortDaten(ort);
  S.lauf = Object.assign({
    art, ort, leben: lebenMax(O), flakons: O.kaffee === 'ja' ? S.flakons : 0, richtig: 0, gesamt: 0, plus: 0,
    blutOffen: !!(S.blut && S.blut.ort === ort), frage: null
  }, istPixel(O) ? { kombo: 0, besteKombo: 0, wuerfelNeu: 0 } : {}, extra);
  S.lauf.frage = neueFrage();
  sichern(); letzteLeben = S.lauf.leben; render(); window.scrollTo(0, 0);
}
/* Ein Gang: zehn Karten, an manchen Orten zusätzlich Rätsel (gleichmäßig verteilt); ein Rätsel als Blutfleck kommt zuerst */
function gangStart(lf){
  /* Im Pixelparadies heißt der Gang Sprung: Karten aus HIMMEL_KARTEN (Themen reihum), zwei Bomben, der Beutel der Insel */
  if (kreis(lf).akt === 3) return laufStart('gang', lf, { plan: K.gangPlanen(HIMMEL_KARTEN, prog, lf, null), pos: 0, nach: {}, beutel: iz(lf).splitter, bomben: K.bombenPlan(K.GANG) });
  const blut = S.blut && S.blut.ort === lf ? S.blut : null;
  const plan = K.gangPlanen(KARTEN, prog, lf, blut && !blut.raetsel ? blut.id : null), n = R.IM_GANG[lf] || 0;
  for (let k = n; k >= 1; k--) plan.splice(Math.round(plan.length * k / (n + 1)), 0, '?');
  if (blut && blut.raetsel) plan.unshift('?blut');
  laufStart('gang', lf, { plan, pos: 0, nach: {} });
}
/* Bosse an Rätsel-Orten werfen einmal im Kampf ein Rätsel, als zweite bis vierte Frage */
function bossStart(ort){
  if (typeof ort === 'string') az(ort).versuche++;
  const O = ortDaten(ort);
  laufStart('boss', ort, { phase: 0, phaseTreffer: 0, phaseNeu: O.phasen.length > 1 || istPixel(O), zuletzt: [], raetselBei: R.IM_GANG[ort] ? 1 + K.rnd(3) : -1 });
}
/* Eine Rätsel-Frage; die Mimic-Truhe merkt sich die Hebel und was sie schon verraten hat */
function raetselFrage(r, extra){
  const f = Object.assign({ id: null, typ: 'raetsel', raetsel: r, nachgeholt: false, auftritt: false, blut: false, beantwortet: false }, extra);
  if (r.art === 'mimic') Object.assign(f, { a: 0, b: 0, proben: { '00': R.gatter(r.gatter).f(0, 0) } });
  if (r.art === 'restore') f.folge = [];
  return f;
}

/* Im Pixelparadies kommen manche Fragen mit Lunte: im Sprung nach Plan, beim Wächter jede dritte, beim Glitch nach seiner Form.
   Eingetippt wird mit brennender Lunte nicht, die Frage wird dann zur Auswahl. */
function mitBombe(f){
  const L = S.lauf, O = ortDaten(L.ort);
  if (!istPixel(O) || friede() || f.raetsel) return f;
  const n = L.art === 'boss' ? O.phasen[L.phase].bomben : 0;
  if (!(L.art === 'boss' ? n && L.gesamt % n === n - 1 : (L.bomben || []).includes(L.gesamt))) return f;
  if (f.typ === 'tippen') { const c = KARTE.get(f.id); f.typ = 'begriff'; f.optionen = K.shuffle([c].concat(K.ablenker(KARTEN, c))).map(x => x.i); }
  f.bombe = true;
  return f;
}

function neueFrage(){
  return mitBombe(frageWuerfeln());
}
function frageWuerfeln(){
  const L = S.lauf, boss = L.art === 'boss';
  let id, nachgeholt = false, auftritt = false;
  if (boss) {
    const ph = ortDaten(L.ort).phasen[L.phase];
    auftritt = !!L.phaseNeu; L.phaseNeu = false;
    if (L.blutOffen && S.blut && S.blut.raetsel) return raetselFrage(S.blut.raetsel, { blut: true, auftritt });
    if (L.gesamt === L.raetselBei) { L.raetselBei = -1; return raetselFrage(R.fuer(L.ort), { auftritt, bossName: ph.name }); }
    id = L.blutOffen && S.blut ? S.blut.id : K.bossKarte(KARTEN, prog, ph.lfs, L.zuletzt, ph.seltenheit).i;
    L.zuletzt = L.zuletzt.concat(id).slice(-6);
  } else {
    id = L.plan[L.pos];
    if (id === '?blut') return raetselFrage(S.blut && S.blut.raetsel ? S.blut.raetsel : R.fuer(L.ort), { blut: !!(L.blutOffen && S.blut && S.blut.raetsel) });
    if (id === '?') return raetselFrage(R.fuer(L.ort), {});
    if (id.startsWith('!')) { id = id.slice(1); nachgeholt = true; }
  }
  const c = KARTE.get(id), blut = !!(L.blutOffen && S.blut && S.blut.id === id);
  /* Kürzel: die Antworten sind Texte, ok zeigt auf die richtige */
  if (K.istKuerzel(c)) {
    const typ = K.kuerzelTyp(prog, c, boss, boss ? ortDaten(L.ort).phasen[L.phase].typ : null);
    const wahl = typ === 'langform' ? K.langformOptionen(KUERZEL, c) : typ === 'erklaerung' ? K.kuerzelOptionen(KUERZEL, c) : null;
    return { id, typ, nachgeholt, auftritt, blut, optionen: wahl ? wahl.optionen : null, ok: wahl ? wahl.ok : null, beantwortet: false };
  }
  const typ = K.fragetyp(prog, c, boss);
  return {
    id, typ, nachgeholt, auftritt,
    blut: !!(L.blutOffen && S.blut && S.blut.id === id),
    optionen: typ === 'tippen' ? null : K.shuffle([c].concat(K.ablenker(KARTEN, c))).map(x => x.i),
    beantwortet: false
  };
}

const TYP_TEXT = {
  begriff: 'Welcher Begriff ist gemeint?', definition: 'Welche Erklärung passt?', tippen: 'Begriff eintippen',
  'k-langform': 'Wofür steht das Kürzel?', 'k-erklaerung': 'Welches Kürzel ist gemeint?', 'k-tippen': 'Kürzel eintippen'
};
/* Die Langform mit den Buchstaben, aus denen das Kürzel besteht */
function markiert(c){
  const st = K.kuerzelStellen(c.n, c.lang);
  return c.lang.split('').map((z, i) => st.has(i) ? '<mark>' + esc(z) + '</mark>' : esc(z)).join('');
}
const streu = s => s.split('').reduce((h, z) => (h * 31 + z.charCodeAt(0)) >>> 0, 7);
let letzteLeben = null;
function kampf(){
  const L = S.lauf, f = L.frage, r = f.raetsel, c = r ? null : KARTE.get(f.id), O = ortDaten(L.ort), boss = L.art === 'boss', px = istPixel(O), mx = lebenMax(O);
  const ph = boss ? O.phasen[L.phase] : null;
  if (px) { pixelWelt(); hintergrund(O.bild, 'pixel', 'funken'); }
  else hintergrund(boss && O.kampfBild ? O.kampfBild : O.bild, boss ? (typeof L.ort === 'string' ? 'arena-' + L.ort : 'boss') : 'kampf', wetterVon(L.ort));
  const pct = v => Math.max(0, Math.min(100, v / mx * 100));
  const vorher = letzteLeben === null ? L.leben : letzteLeben;
  const fertig = boss ? '' : '<span class="schritte" aria-label="Karte ' + (L.pos + 1) + ' von ' + L.plan.length + '">' +
    L.plan.map((_, i) => '<i class="' + (i < L.pos || (i === L.pos && f.beantwortet) ? 'an' : i === L.pos ? 'jetzt' : '') + '"></i>').join('') + '</span>';
  const kurz = !r && K.istKuerzel(c), phantom = kurz && c.r === 3 && !boss;
  const frage = r ? '' : kurz
    ? (f.typ === 'langform' ? '<p class="frage kuerzel-gross">' + esc(c.n) + '</p>'
      : f.typ === 'erklaerung' ? '<p class="frage">' + esc(K.verdeckt(c)) + '</p>'
      : '<p class="frage langform-gross">' + esc(c.lang) + '</p><p class="klein">' + esc(K.verdeckt(c)) + '</p>')
    : f.typ === 'definition' ? '<p class="frage begriff-gross">' + esc(c.n) + '</p>' : '<p class="frage">' + esc(c.d) + '</p>';
  let antwort = '';
  if (r) antwort = raetselHtml(f);
  else if (f.typ === 'tippen') {
    antwort = '<form class="tippen" id="tippen" autocomplete="off">' +
      '<input type="text" id="eingabe" enterkeyhint="send" autocomplete="off" autocapitalize="' + (kurz ? 'characters' : 'off') + '" autocorrect="off" spellcheck="false" aria-label="' + (kurz ? 'Kürzel' : 'Begriff') + ' eintippen"' +
        (f.beantwortet ? ' readonly value="' + esc(f.eingabe || '') + '" class="' + (f.gut ? 'ok' : 'falsch') + '"' : '') + '>' +
      '<div class="tippen-knoepfe">' +
        '<button type="submit" class="knopf haupt"' + (f.beantwortet ? ' disabled' : '') + '>Zuschlagen</button>' +
        '<button type="button" class="knopf leise" id="passen"' + (f.beantwortet ? ' disabled' : '') + '>Keine Ahnung</button>' +
      '</div></form>';
  } else {
    antwort = '<div class="optionen' + (kurz && f.typ === 'erklaerung' ? ' kuerzel-wahl' : '') + '" role="group" aria-label="Antworten">' + f.optionen.map((x, n) => {
      const txt = kurz ? x : f.typ === 'begriff' ? KARTE.get(x).n : KARTE.get(x).d, richtig = kurz ? n === f.ok : x === f.id;
      let cls = '';
      if (f.beantwortet) cls = richtig ? ' ok' : n === f.gewaehlt ? ' falsch' : ' blass';
      return '<button type="button" class="option' + (f.typ === 'definition' ? ' lang' : '') + cls + '" data-n="' + n + '"' + (f.beantwortet ? ' disabled' : '') + '>' + esc(txt) + '</button>';
    }).join('') + '</div>';
  }
  const kaffeeVerboten = O.kaffee === 'nein';
  const phasenAnzeige = boss && O.phasen.length > 1
    ? '<span class="phase">' + esc(O.phasenWort) + ' ' + (L.phase + 1) + ' von ' + O.phasen.length + '</span>' : '';
  app.innerHTML =
    '<main class="kampf' + (boss ? ' ist-boss' : '') + '">' +
      '<header class="hud' + (friede() ? ' ruhig' : '') + '">' +
        (friede() ? '<span class="ruhig-marke">Ruhiger Modus</span>' :
          (px ? '<div class="leben px-herzen' + (L.leben < vorher ? ' verloren' : '') + '" role="meter" aria-label="Herzen" aria-valuemin="0" aria-valuemax="' + mx + '" aria-valuenow="' + L.leben + '">' + P.herzen(L.leben, mx) + '</div>' :
          '<div class="leben" role="meter" aria-label="Leben" aria-valuemin="0" aria-valuemax="' + mx + '" aria-valuenow="' + L.leben + '">' +
            '<div class="balken"><i class="spur" style="width:' + pct(vorher) + '%"></i><i class="wert" style="width:' + pct(L.leben) + '%"></i></div>' +
            '<span class="leben-zahl">' + L.leben + ' / ' + mx + '</span>' +
          '</div>') +
          '<button type="button" class="flakon' + (kaffeeVerboten ? ' verboten' : O.kaffee === 'gefroren' ? ' gefroren' : '') + '" id="flakon"' +
            (kaffeeVerboten || L.flakons <= 0 || L.leben <= 0 || L.leben >= mx ? ' disabled' : '') +
            ' aria-label="' + (kaffeeVerboten ? 'Kein Kaffee im Prüfungsraum' : 'Kaffeeflakon trinken, plus ' + (px ? K.KAFFEE_HERZEN + ' Herzen' : heilung() + ' Leben') + ', noch ' + L.flakons) + '">' +
            TASSE + '<b>' + (kaffeeVerboten ? '0' : L.flakons) + '</b></button>') +
        '<span class="seelen-hud"><b>' + zahl(S.seelen) + '</b> Seelen</span>' +
      '</header>' +
      '<div class="lauf-kopf">' +
        '<button type="button" class="rueckzug" id="rueckzug"' + (L.leben <= 0 ? ' disabled' : '') + '>' + (L.ort === 'gipfel' ? 'Raum verlassen' : px && !boss ? 'Abspringen' : 'Rückzug') + '</button>' +
        (px ? P.figur('bit', 'kampf-bit' + (f.beantwortet ? (f.gut ? ' hops' : ' autsch') : '')) : '') +
        '<span class="lauf-ort">' + esc(px ? O.kurz : O.ort) + '</span>' + fertig +
      '</div>' +
      (px ? pixelLeiste(L, boss) : '') +
      (boss && px ? '<div class="bossbalken px-boss">' + P.figur(P.WAECHTER[L.ort], 'boss-figur' + (f.beantwortet ? (f.gut ? ' getroffen' : ' lacht') : '')) +
          '<div class="px-boss-info"><span class="boss-name">' + esc(ph.name) + '<small>' + esc(ph.zusatz) + '</small></span>' + phasenAnzeige +
          '<div class="px-lp" role="meter" aria-label="Treffer bis zum Fall" aria-valuemin="0" aria-valuemax="' + ph.treffer + '" aria-valuenow="' + (ph.treffer - L.phaseTreffer) + '">' +
            Array.from({ length: ph.treffer }, (_, i) => '<i class="' + (i < ph.treffer - L.phaseTreffer ? 'an' : '') + '"></i>').join('') + '</div></div></div>'
        : boss ? '<div class="bossbalken' + (pixelStil() ? ' mit-figur' : '') + '">' + (pixelStil() ? P.figur(P.bossFigur(L.ort, L.phase), 'boss-figur' + (f.beantwortet ? (f.gut ? ' getroffen' : ' lacht') : '')) + '<div class="px-boss-info">' : '') +
          '<span class="boss-name">' + esc(ph.name) + '<small>' + esc(ph.zusatz) + '</small></span>' + phasenAnzeige +
          '<div class="balken"><i style="width:' + ((ph.treffer - L.phaseTreffer) / ph.treffer * 100) + '%"></i></div></div>' + (pixelStil() ? '</div>' : '') : '') +
      '<section class="karte' + (phantom ? ' phantom-karte' : '') + (r ? ' raetsel-karte raetsel-' + r.art : '') + (f.bombe ? ' bombe-karte' + (f.beantwortet ? (f.gut ? ' entschaerft' : ' explodiert') : '') : '') + '" id="karte">' +
        (f.bombe && !f.beantwortet ? '<div class="bombe-kopf">' + P.figur('bombe', 'bombe-figur') + '<p>' + esc(BOMBE.auftritt[streu(f.id) % BOMBE.auftritt.length]) + '</p></div>' : '') +
        (f.auftritt && !f.beantwortet && ph.auftritt ? '<p class="auftritt">' + esc(ph.auftritt) + '</p>' : '') +
        (phantom && !f.beantwortet ? '<p class="phantom">' + esc(PHANTOM[streu(c.i) % PHANTOM.length]) + '</p>' : '') +
        (r && !f.beantwortet ? '<p class="raetsel-auftritt">' + esc(raetselSatz(f)) + '</p>' : '') +
        '<p class="karte-kopf"><span>' + (r ? R.NAMEN[r.art] : TYP_TEXT[(kurz ? 'k-' : '') + f.typ]) + '</span><span class="thema">' + esc(r ? r.thema : c.t) + (kurz ? ' <b class="rang r' + c.r + '">' + SELTENHEIT[c.r] + '</b>' : '') + '</span></p>' +
        (((O.zeit && boss) || f.bombe) && !f.beantwortet ? '<div class="uhr' + (f.bombe ? ' lunte' : '') + '" id="uhr" aria-hidden="true"><i></i><span></span></div>' : '') +
        (f.blut && !f.beantwortet ? '<p class="blut-hinweis">Dein Blutfleck. <b>' + zahl(S.blut.seelen) + ' Seelen</b> liegen bei ' + (r ? 'diesem Rätsel' : 'dieser Karte') + '.</p>' : '') +
        (f.nachgeholt && !f.beantwortet ? '<p class="nach-hinweis">Die kennst du von eben.</p>' : '') +
        frage + antwort +
        '<div class="rueckmeldung" id="rueckmeldung" aria-live="polite">' + (f.beantwortet ? (r ? raetselRueckmeldung(f) : rueckmeldung(c, f)) : '') + '</div>' +
      '</section>' +
      '<div class="rueckzug-frage" id="rueckzug-frage" hidden></div>' +
    '</main>' +
    (f.beantwortet ? '<div class="weiter-leiste"><button type="button" class="knopf haupt" id="weiter">' + weiterText() + '</button></div>' : '');
  /* Lebensbalken: die helle Spur folgt dem Schaden mit Verzögerung */
  if (vorher !== L.leben) requestAnimationFrame(() => requestAnimationFrame(() => { const s = $('.spur'); if (s) s.style.width = pct(L.leben) + '%'; }));
  letzteLeben = L.leben;

  const flakonKnopf = $('#flakon'); if (flakonKnopf) flakonKnopf.addEventListener('click', trinken);
  $('#rueckzug').addEventListener('click', rueckzugFragen);
  if (f.beantwortet) { $('#weiter').addEventListener('click', weiter); fokus('#weiter'); return; }
  if (r) raetselBinden(f);
  else if (f.typ === 'tippen') {
    $('#tippen').addEventListener('submit', e => { e.preventDefault(); tippenPruefen(); });
    $('#passen').addEventListener('click', () => antworten(false, { eingabe: '' }));
    fokus('#eingabe');
  } else {
    $$('.option').forEach(b => b.addEventListener('click', () => { const n = Number(b.dataset.n); antworten(kurz ? n === f.ok : f.optionen[n] === f.id, { gewaehlt: n }); }));
  }
  starteUhr();
}

/* ---------- Rätsel auf der Karte ---------- */
function raetselSatz(f){
  const r = f.raetsel;
  if (f.bossName) return RAETSEL_BOSS.replace('{boss}', f.bossName);
  const s = RAETSEL_AUFTRITT[r.art];
  return s[streu(r.frage || r.intro || r.art) % s.length];
}
/* Routingtabelle oder VLAN-Aufbau, wenn eine Aufgabe sich darauf bezieht */
function zusatzHtml(z){
  if (z === 'routing') return '<div class="tabelle-huelle"><table class="routen"><caption>Routingtabelle</caption><tr><th>Ziel</th><th>Netz</th><th>Tür</th></tr>' +
    R.ROUTEN.map(([n, netz, tuer]) => '<tr><td>' + esc(n) + '</td><td>' + netz + '</td><td>' + tuer + '</td></tr>').join('') + '</table></div>';
  if (z === 'vlan') return '<div class="vlan-plan">' + R.VLAN_AUFBAU.map((sw, i) =>
    (i ? '<p class="trunk">Port 5 an beiden Switches: Trunk, trägt alle VLANs</p>' : '') +
    '<div class="switch"><b>' + sw.name + '</b><span class="pcs">' + sw.pcs.map(([pc, v]) => '<span class="pc v' + v + '">PC ' + pc + '<small>VLAN ' + v + '</small></span>').join('') + '</span></div>').join('') + '</div>';
  return '';
}
const FELD_ART = { ip: 'inputmode="decimal"', zahl: 'inputmode="numeric"', praefix: 'inputmode="numeric"', v6kurz: 'inputmode="text"', v6voll: 'inputmode="text"', iid: 'inputmode="text"' };
function raetselHtml(f){
  const r = f.raetsel, aus = f.beantwortet ? ' disabled' : '';
  const knoepfe = (haupt, id) => f.beantwortet ? '' : '<div class="tippen-knoepfe"><button type="' + (id ? 'button' : 'submit') + '" class="knopf haupt"' + (id ? ' id="' + id + '"' : '') + '>' + haupt + '</button><button type="button" class="knopf leise" id="passen">Keine Ahnung</button></div>';
  if (r.art === 'rechnen') {
    let h = '<div class="frage raetsel-frage">' + r.frage + '</div>' + zusatzHtml(r.zusatz);
    if (r.felder) return h + '<form class="felder" id="felder" autocomplete="off" novalidate>' + r.felder.map((x, k) =>
      '<label class="feld"><span>' + esc(x.label) + '</span><input type="text" id="feld-' + k + '" ' + FELD_ART[x.art] + ' autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="' + (k === r.felder.length - 1 ? 'send' : 'next') + '"' +
        (f.beantwortet ? ' readonly value="' + esc((f.werte || [])[k] || '') + '" class="' + ((f.ergebnis || [])[k] ? 'ok' : 'falsch') + '"' : '') + '></label>').join('') +
      '<p class="feld-meldung" id="feld-meldung" aria-live="polite"></p>' + knoepfe('Zuschlagen') + '</form>';
    const w = r.wahl, gewaehlt = f.gewaehlt || [], auswahl = f.auswahl || [];
    return h + (w.mehrere && !f.beantwortet ? '<p class="klein">Mehrere Antworten möglich.</p>' : '') +
      '<div class="optionen' + (w.optionen.length > 4 ? ' eng' : '') + '" role="group" aria-label="Antworten">' + w.optionen.map((o, n) => {
        const cls = f.beantwortet ? (w.richtig.includes(n) ? ' ok' : gewaehlt.includes(n) ? ' falsch' : ' blass') : auswahl.includes(n) ? ' gewaehlt' : '';
        return '<button type="button" class="option' + cls + '" data-n="' + n + '"' + (w.mehrere ? ' aria-pressed="' + auswahl.includes(n) + '"' : '') + aus + '>' + esc(o) + '</button>';
      }).join('') + '</div>' + (w.mehrere ? knoepfe('Zuschlagen', 'zuschlagen') : '');
  }
  if (r.art === 'botschaft') return '<div class="frage raetsel-frage">' + r.intro + '</div>' + zusatzHtml(r.zusatz) +
    '<ol class="botschaft">' + r.zeilen.map((z, k) => {
      const cls = !f.beantwortet ? '' : k === r.falsch ? ' luegt' : k === f.gewaehlt ? ' daneben' : (r.folge || []).includes(k) ? ' folge' : '';
      return '<li><button type="button" class="zeile-knopf' + cls + '" data-k="' + k + '"' + aus + '><span class="nr">' + (k + 1) + '</span><span class="text">' + z + '</span></button></li>';
    }).join('') + '</ol>' + (f.beantwortet ? '' : '<p class="botschaft-ruf">Tipp die erste Zeile an, die lügt.</p><button type="button" class="knopf leise" id="passen">Keine Ahnung</button>');
  if (r.art === 'mimic') return '<div class="frage raetsel-frage">' + r.frage + '</div><div class="mimic" id="mimic">' + mimicInnen(f) + '</div>' +
    '<div class="optionen gatter-wahl" role="group" aria-label="Gatter">' + R.GATTER.map(g => {
      const cls = !f.beantwortet ? '' : g.id === r.gatter ? ' ok' : g.id === f.gewaehltG ? ' falsch' : ' blass';
      return '<button type="button" class="option gatter-knopf' + cls + '" data-g="' + g.id + '"' + aus + '><b>' + esc(g.de) + '</b>' + (g.de.startsWith(g.id) ? '' : '<small>' + g.id + '</small>') + '</button>';
    }).join('') + '</div>';
  if (r.art === 'restore') return '<div class="frage raetsel-frage">' + r.frage + '</div><div id="restore">' + restoreInnen(f) + '</div>' + knoepfe('Zurückspielen', 'zurueckspielen');
  return '';
}
/* Die Truhe: zwei Hebel, ihre Antwort, und was sie bisher verraten hat; nach der Antwort die ganze Wahrheitstabelle */
const TRUHE = '<svg class="truhe-bild" viewBox="0 0 120 92" aria-hidden="true">' +
  '<ellipse class="schein" cx="60" cy="44" rx="44" ry="20"/>' +
  '<rect x="12" y="44" width="96" height="42" rx="4" fill="#4e3219" stroke="#22140a" stroke-width="2"/>' +
  '<rect x="12" y="60" width="96" height="6" fill="#8a6a36"/><rect x="53" y="54" width="14" height="16" rx="2" fill="#c9a24a" stroke="#5c4413"/>' +
  '<path class="zaehne" d="M18 46 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8" fill="#efe6d0"/>' +
  '<g class="deckel"><path d="M12 46 Q60 8 108 46 Z" fill="#5d3c1f" stroke="#22140a" stroke-width="2"/><path d="M12 46 Q60 8 108 46" fill="none" stroke="#8a6a36" stroke-width="5" stroke-dasharray="2 22"/></g>' +
  '<g class="augen-truhe"><ellipse cx="46" cy="47" rx="3.2" ry="1.6"/><ellipse cx="74" cy="47" rx="3.2" ry="1.6"/></g></svg>';
function mimicInnen(f){
  const r = f.raetsel, g = R.gatter(r.gatter), q = g.f(f.a, f.b), aus = f.beantwortet ? ' disabled' : '';
  return '<div class="truhe' + (f.beantwortet ? (f.gut ? ' offen' : ' biss') : '') + '">' + TRUHE + '</div>' +
    '<div class="hebel">' +
      '<button type="button" class="schalter" id="schalter-a" aria-pressed="' + (f.a === 1) + '"' + aus + '>A <b>' + f.a + '</b></button>' +
      '<button type="button" class="schalter" id="schalter-b" aria-pressed="' + (f.b === 1) + '"' + aus + '>B <b>' + f.b + '</b></button>' +
      '<span class="lampe' + (q ? ' an' : '') + '">Truhe <b>' + q + '</b></span>' +
    '</div>' +
    '<table class="proben"><tr><th>A</th><th>B</th><th>Truhe</th></tr>' + ['00', '01', '10', '11'].map(k => {
      const wert = f.beantwortet ? g.f(+k[0], +k[1]) : k in f.proben ? f.proben[k] : '?';
      return '<tr' + (k === '' + f.a + f.b && !f.beantwortet ? ' class="jetzt"' : '') + '><td>' + k[0] + '</td><td>' + k[1] + '</td><td>' + wert + '</td></tr>';
    }).join('') + '</table>';
}
/* Die Woche: Vollsicherungen, Diffs oder Inkremente mit Größe; angetippt wird in der Reihenfolge des Zurückspielens */
function restoreInnen(f){
  const r = f.raetsel, w = R.woche(r), folge = f.folge || [], aus = f.beantwortet ? ' disabled' : '';
  return '<div class="woche" role="group" aria-label="Sicherungen der Woche">' + R.TAGE.map((t, i) => {
    if (i === r.ausfall) return '<div class="medium brand"><b>' + t + '</b><span>Ausfall</span></div>';
    if (!w[i]) return '<div class="medium spaeter"><b>' + t + '</b></div>';
    const pos = folge.indexOf(i);
    const cls = ' ' + w[i].art.toLowerCase() + (f.beantwortet ? (r.soll.includes(i) ? ' soll' : pos >= 0 ? ' falsch' : '') : pos >= 0 ? ' gewaehlt' : '');
    return '<button type="button" class="medium' + cls + '" data-t="' + i + '"' + aus + '><b>' + t + '</b><span>' + w[i].art + '</span><small>' + w[i].gb + ' GB</small>' + (pos >= 0 ? '<i>' + (pos + 1) + '</i>' : '') + '</button>';
  }).join('') + '</div>' +
  '<p class="folge" id="folge">' + (folge.length ? 'Zurückspielen: ' + folge.map(i => R.TAGE[i]).join(' → ') : 'Noch keine Sicherung gewählt.') + '</p>';
}
function raetselBinden(f){
  const r = f.raetsel, passen = $('#passen');
  if (passen) passen.addEventListener('click', () => antworten(false, { gepasst: true }));
  if (r.art === 'rechnen' && r.felder) {
    $('#felder').addEventListener('submit', e => {
      e.preventDefault();
      const werte = r.felder.map((_, k) => $('#feld-' + k).value), erg = r.felder.map((x, k) => R.pruefeFeld(x, werte[k]));
      const ungueltig = erg.find(x => x.ungueltig);
      if (ungueltig) { $('#feld-meldung').textContent = ungueltig.ungueltig; fokus('#feld-' + erg.indexOf(ungueltig)); return; }
      const warum = (erg.find(x => x.warum) || {}).warum;
      antworten(erg.every(x => x.ok), { werte, ergebnis: erg.map(x => !!x.ok), warum });
    });
    fokus('#feld-0');
  } else if (r.art === 'rechnen') {
    const w = r.wahl;
    $$('.option').forEach(b => b.addEventListener('click', () => {
      const n = Number(b.dataset.n);
      if (!w.mehrere) return antworten(w.richtig.length === 1 && w.richtig[0] === n, { gewaehlt: [n] });
      f.auswahl = (f.auswahl || []).includes(n) ? f.auswahl.filter(x => x !== n) : (f.auswahl || []).concat(n);
      b.classList.toggle('gewaehlt'); b.setAttribute('aria-pressed', String(f.auswahl.includes(n)));
    }));
    if (w.mehrere) $('#zuschlagen').addEventListener('click', () => {
      const a = (f.auswahl || []).slice().sort((x, y) => x - y);
      if (!a.length) return;
      antworten(a.length === w.richtig.length && w.richtig.every(x => a.includes(x)), { gewaehlt: a });
    });
  } else if (r.art === 'botschaft') {
    $$('.zeile-knopf').forEach(b => b.addEventListener('click', () => { const k = Number(b.dataset.k); antworten(k === r.falsch, { gewaehlt: k }); }));
  } else if (r.art === 'mimic') {
    const hebel = () => {
      $$('.schalter').forEach(b => b.addEventListener('click', () => {
        if (b.id === 'schalter-a') f.a ^= 1; else f.b ^= 1;
        f.proben['' + f.a + f.b] = R.gatter(r.gatter).f(f.a, f.b);
        sichern();
        $('#mimic').innerHTML = mimicInnen(f);
        hebel();
        fokus('#' + b.id);
      }));
    };
    hebel();
    $$('.gatter-knopf').forEach(b => b.addEventListener('click', () => antworten(b.dataset.g === r.gatter, { gewaehltG: b.dataset.g })));
  } else if (r.art === 'restore') {
    const tippen = () => $$('#restore .medium[data-t]').forEach(b => b.addEventListener('click', () => {
      const t = Number(b.dataset.t);
      f.folge = f.folge.includes(t) ? f.folge.filter(x => x !== t) : f.folge.concat(t);
      sichern();
      $('#restore').innerHTML = restoreInnen(f);
      tippen();
      fokus('#restore .medium[data-t="' + t + '"]');
    }));
    tippen();
    $('#zurueckspielen').addEventListener('click', () => {
      if (!f.folge.length) { $('#folge').textContent = 'Wähl zuerst die Sicherungen, in der Reihenfolge, in der sie zurückgespielt werden.'; return; }
      antworten(f.folge.join() === r.soll.join(), { folge: f.folge.slice() });
    });
  }
}
function raetselRueckmeldung(f){
  const r = f.raetsel;
  return '<div class="urteil ' + (f.gut ? 'ok' : 'falsch') + '">' +
    '<p class="urteil-wort">' + (f.zeit ? 'Zeit um' : f.gut ? 'Gelöst' : 'Daneben') + '</p>' +
    (f.warum ? '<p class="klein">' + esc(f.warum) + '</p>' : '') +
    '<p class="loesung raetsel-loesung">' + R.loesung(r) + '</p>' +
    '<p class="merke">' + r.erklaerung + '</p>' +
    (f.zeilen && f.zeilen.length ? '<p class="seelen-zeile">' + f.zeilen.map(esc).join(' · ') + '</p>' : '') +
    (f.spruch ? '<p class="spruch">' + esc(f.spruch) + '</p>' : '') +
    (!f.gut ? werkstattSprung(r) : '') +
  '</div>';
}
/* Nach einem falschen Rätsel: in der Werkstatt nachsehen, das Werkzeug steht schon auf genau dieser Aufgabe */
function werkstattSprung(r){
  if (!r.werkstatt) return '';
  const name = R.werkzeug(r.werkstatt);
  return '<a class="knopf leise werkstatt-sprung" href="werkstatt/' + esc(r.werkstatt) + '">In der Werkstatt nachsehen<small>' +
    (name === 'Klappuhr' ? 'Die Klappuhr steht schon auf dieser Aufgabe' : 'Im Rechenwerk stehen alle Gatter an der Wand') + '</small></a>';
}

/* Prüfungsuhr: die Frist steht in der Frage, Neuladen hilft also nicht */
let uhr = null;
function stoppeUhr(){ if (uhr) { clearInterval(uhr); uhr = null; } }
function starteUhr(){
  const L = S.lauf, f = L.frage, O = ortDaten(L.ort);
  /* Die Prüfungsuhr läuft nur im Bosskampf mit Frist, die Lunte an jeder Bombe */
  const sek = f.bombe ? K.BOMBE_SEK : L.art === 'boss' ? O.zeit : 0;
  if (!sek || f.beantwortet) return;
  if (!f.bis) { f.bis = Date.now() + sek * 1000; sichern(); }
  const tick = () => {
    if (!S.lauf || S.lauf.frage !== f || f.beantwortet) { stoppeUhr(); return; }
    const rest = Math.max(0, f.bis - Date.now()), el = $('#uhr');
    if (el) {
      el.querySelector('i').style.width = (rest / (sek * 1000) * 100) + '%';
      el.querySelector('span').textContent = Math.ceil(rest / 1000) + ' s';
      el.classList.toggle('knapp', rest < 5000);
    }
    if (rest <= 0) { stoppeUhr(); const e = $('#eingabe'); antworten(false, { zeit: true, eingabe: e ? e.value : '' }); }
  };
  tick();
  uhr = setInterval(tick, 200);
}

function weiterText(){
  const L = S.lauf, px = istPixel(ortDaten(L.ort));
  if (L.leben <= 0) return px ? 'Fallen' : 'Weiter';
  if (L.art === 'boss') return L.gefallen ? (L.ort === 'gipfel' ? 'Die Akte schließen' : L.ort === 'glitch' ? 'Der Glitch zerfällt' : px ? 'Der Wächter fällt' : 'Der Boss fällt') : 'Weiter';
  return L.pos + 1 >= L.plan.length ? (px ? 'Landen' : 'Zum Lagerfeuer') : 'Weiter';
}
/* Unter dem Kopf im Pixelparadies: die Kombo, im Sprung dazu der Beutel und neue Goldwürfel */
function pixelLeiste(L, boss){
  const k = L.kombo || 0;
  return '<div class="px-leiste">' +
    '<span class="kombo' + (k >= 3 ? ' heiss' : '') + (k >= 5 ? ' gluehend' : '') + '" aria-label="Kombo ' + k + '">Kombo <b>×' + k + '</b>' + (boss && K.kritisch(k) ? '<small>Volltreffer</small>' : '') + '</span>' +
    (L.beutel !== undefined && !boss ? '<span class="px-beutel" aria-label="' + L.beutel + ' von ' + K.SPLITTER_JE_WUERFEL + ' Splittern im Beutel">' + P.beutel(L.beutel, K.SPLITTER_JE_WUERFEL) + '</span>' +
      (L.wuerfelNeu ? '<span class="gw-neu">+' + L.wuerfelNeu + P.figur('wuerfel', 'gw-figur') + '</span>' : '') : '') +
  '</div>';
}

function rueckmeldung(c, f){
  const urteil = f.zeit ? 'Zeit um' : f.gut ? (f.tippfehler ? 'Fast, zählt' : 'Treffer') : 'Daneben';
  return '<div class="urteil ' + (f.gut ? (f.tippfehler ? 'knapp' : 'ok') : 'falsch') + '">' +
    '<p class="urteil-wort">' + urteil + '</p>' +
    (f.typ === 'tippen' && !f.gut && f.eingabe ? '<p class="klein">Deine Antwort: „' + esc(f.eingabe) + '“</p>' : '') +
    (K.istKuerzel(c)
      ? '<p class="loesung"><span class="kuerzel-name">' + esc(c.n) + '</span> = ' + markiert(c) + '</p><p class="merke">' + esc(c.d) + '</p>'
      : '<p class="loesung">' + esc(c.n) + (c.a && c.a.length ? ' <span class="klein">(' + esc(c.a.slice(0, 3).join(', ')) + ')</span>' : '') + '</p>' +
        (c.m ? '<p class="merke"><b>Merke:</b> ' + esc(c.m) + '</p>' : '')) +
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
  const f = L.frage, O = ortDaten(L.ort), akt = O.akt, r = f.raetsel, px = istPixel(O);
  const c = r ? null : KARTE.get(f.id), boss = L.art === 'boss', fachVorher = r ? 0 : K.stand(prog, c).b, kurz = !r && K.istKuerzel(c);
  const ph = boss ? O.phasen[L.phase] : null, mehrphasig = boss && O.phasen.length > 1;
  Object.assign(f, info, { beantwortet: true, gut });
  /* Rätsel kommen nicht in den Lernkasten, sie werden nur gezählt */
  if (r) { S.raetsel = S.raetsel || { geloest: 0, versucht: 0 }; S.raetsel.versucht++; if (gut) S.raetsel.geloest++; }
  else if (f.nachgeholt) { if (!gut) K.fehlerNachtragen(prog, c); }
  else K.eintragen(prog, c, gut);
  L.gesamt++; S.antworten = (S.antworten || 0) + 1;
  const zeilen = [];
  if (gut) {
    L.richtig++;
    const g = seelenGabe(r ? K.raetselSeelen(boss, akt, S.ng) : f.nachgeholt ? 5 : Math.round(K.seelenFuer(fachVorher, boss, akt, S.ng) * (kurz ? K.SELTEN_SEELEN[c.r] : 1)));
    S.seelen += g; S.verdient += g; L.plus += g;
    zeilen.push('+' + g + ' Seelen');
    /* Die Mimic-Truhe öffnet sich: ein Kaffeeflakon für diesen Lauf, oder Seelen, wenn keiner mehr passt */
    if (r && r.art === 'mimic') {
      if (O.kaffee === 'ja' && L.flakons < K.FLAKON_MAX) { L.flakons++; zeilen.push('In der Truhe liegt ein Kaffeeflakon'); }
      else { const x = seelenGabe(Math.round(K.MIMIC_SEELEN * K.ngSeelen(S.ng))); S.seelen += x; S.verdient += x; L.plus += x; zeilen.push('In der Truhe liegen Seelen: +' + x); }
    }
    if (kurz && c.r === 3 && !boss && !f.nachgeholt) zeilen.push('Rotes Phantom vertrieben');
    if (f.blut && S.blut) { S.seelen += S.blut.seelen; L.plus += S.blut.seelen; zeilen.push('Seelen zurückgeholt: +' + zahl(S.blut.seelen)); S.blut = null; L.blutOffen = false; }
    if (px) pixelTreffer(L, f, boss, zeilen);
    if (boss) {
      /* Im Pixelparadies trifft eine Kombo ab drei doppelt */
      const schlag = px && K.kritisch(L.kombo) ? 2 : 1;
      L.phaseTreffer = Math.min(ph.treffer, L.phaseTreffer + schlag);
      if (schlag > 1) { f.volltreffer = true; zeilen.push('Volltreffer! Die Kombo trifft doppelt.'); }
      if (L.phaseTreffer >= ph.treffer) {
        if (L.phase + 1 < O.phasen.length) {
          zeilen.push(ph.ende || ph.name + ' fällt.');
          L.phase++; L.phaseTreffer = 0; L.phaseNeu = true;
          if (O.kaffee === 'gefroren' && L.flakons < S.flakons) { L.flakons++; zeilen.push('Ein Kaffeeflakon taut auf.'); }
        } else { L.gefallen = true; f.fall = true; zeilen.push(O.schluss || 'Der Boss wankt …'); }
      } else zeilen.push('Treffer. Noch ' + (ph.treffer - L.phaseTreffer) + (mehrphasig ? ' bei ' + ph.name : ' bis zum Fall') + '.');
    }
    if (f.tippfehler && O.tippfehler && !friede()) {
      L.leben = Math.max(1, L.leben - O.tippfehler);
      zeilen.push('Der Vorsitz runzelt die Stirn über die Rechtschreibung: −' + O.tippfehler + ' Leben');
    }
    if (boss && ph.treffer_) f.spruch = K.pick(ph.treffer_);
    else if (Math.random() < 0.2) f.spruch = K.pick(TREFFER);
    if (r && r.art === 'mimic') f.spruch = MIMIC.auf;
  } else {
    const d = friede() ? 0 : px ? (f.bombe ? K.BOMBE_HERZEN : 1) : (r && r.art === 'mimic' ? K.schadenFuer(3, boss, akt, S.ng) : boss && O.schaden ? Math.round(O.schaden * K.ngSchaden(S.ng)) : K.schadenFuer(fachVorher, boss, akt, S.ng));
    L.leben = Math.max(0, L.leben - d);
    if (f.zeit) zeilen.push(f.bombe ? 'Die Lunte ist abgebrannt' : 'Die Zeit ist um');
    if (px) {
      if (f.bombe) f.knall = true;
      if (L.kombo >= 3) zeilen.push('Die Kombo ×' + L.kombo + ' reißt.');
      L.kombo = 0;
    }
    if (friede()) zeilen.push('Daneben.');
    else if (px) zeilen.push(f.bombe ? BOMBE.knall + ' −' + d + ' Herzen' : '−1 Herz');
    else {
      zeilen.push((r && r.art === 'mimic' ? 'Biss: ' : '') + '−' + d + ' Leben' + (!r && !boss && fachVorher >= 3 ? ', die Karte saß schon, das tut mehr weh' : ''));
      if (f.blut && S.blut) { zeilen.push('Deine ' + zahl(S.blut.seelen) + ' Seelen versickern im Boden.'); S.blut = null; L.blutOffen = false; }
    }
    if (!r && !boss && L.leben > 0 && !L.nach[c.i]) {
      L.plan.splice(Math.min(L.plan.length, L.pos + 4), 0, '!' + c.i);
      L.nach[c.i] = true;
      zeilen.push('Sie kommt in drei Karten wieder.');
    }
    if (boss && ph.fehler) f.spruch = K.pick(ph.fehler);
    else if (L.leben > 0 && Math.random() < 0.35) f.spruch = K.pick(r ? RAETSEL_DANEBEN : DANEBEN);
    if (kurz && f.typ === 'langform' && f.optionen[f.gewaehlt] === c.j) f.spruch = KUERZEL_SPASS;
    if (r && r.art === 'mimic') f.spruch = MIMIC.biss;
  }
  if (L.leben <= 0 && istKlasse('priester') && !L.safeMode) { L.leben = 1; L.safeMode = true; zeilen.push('SafeMode fängt dich bei ' + (px ? 'einem Herzen.' : '1 Leben.')); }
  if (boss && f.blut) L.blutOffen = false;
  f.zeilen = zeilen;
  sichern();
  render();
  const rm = $('#rueckmeldung');
  if (rm) rm.scrollIntoView({ block: 'end', behavior: ruhig() ? 'auto' : 'smooth' });
  if (gut) seelenFliegen(zeilen[0]);
  else { blitz(); vibrieren(L.leben <= 0 ? [90, 60, 240] : 70); }
  if (px) pixelKnall(L, f, gut);
  else T.schlag({ gut, akt: O.akt, klang: klassenKlang(), wucht: !!(gut && L.gefallen), mimic: !!(r && r.art === 'mimic') });
  if (f.fall) { T.musikSieg(); if (!px && pixelStil()) T.chip('sieg'); }
  if (L.leben <= 0) setTimeout(() => { if (S.lauf && S.lauf.leben <= 0) sterben(); }, ruhig() ? 0 : 1300);
}

/* Ein Treffer im Pixelparadies: Kombo hoch, Bombe entschärft, im Sprung Splitter in den Beutel.
   Acht Splitter werden sofort zu einem Goldwürfel, und der ist sicher, auch wenn man danach fällt. */
function pixelTreffer(L, f, boss, zeilen){
  L.kombo = (L.kombo || 0) + 1;
  L.besteKombo = Math.max(L.besteKombo || 0, L.kombo);
  S.himmel.kombo = Math.max(S.himmel.kombo || 0, L.kombo);
  if (K.knall(L.kombo)) { f.knall = 'kombo'; zeilen.push('Kombo ×' + L.kombo + '!'); }
  if (f.bombe) { f.entschaerft = true; zeilen.push(BOMBE.entschaerft + (boss || L.beutel === undefined ? '' : ' +' + K.BOMBE_SPLITTER + ' Splitter extra')); }
  if (boss || L.beutel === undefined) return;
  const n = K.splitterFuer(L.kombo) + (f.bombe ? K.BOMBE_SPLITTER : 0);
  L.beutel += n;
  zeilen.push('+' + n + ' Splitter');
  while (L.beutel >= K.SPLITTER_JE_WUERFEL) {
    L.beutel -= K.SPLITTER_JE_WUERFEL;
    wuerfelDazu(L.ort); L.wuerfelNeu++; f.wuerfel = true;
    zeilen.push('Ein Goldwürfel!');
  }
}
function wuerfelDazu(ort){ iz(ort).wuerfel++; S.himmel.wuerfel = (S.himmel.wuerfel || 0) + 1; }

/* Klang und Knall nach einer Antwort; immer nur der größte Effekt, damit es nicht durcheinander kracht */
function pixelKnall(L, f, gut){
  const k = $('#karte'), r = k ? k.getBoundingClientRect() : null, mitte = r ? { x: r.left + r.width / 2, y: Math.max(80, r.top + Math.min(r.height, window.innerHeight) / 3) } : {};
  if (!gut) {
    if (f.knall) { T.chip('boom'); P.boom(Object.assign({ text: 'BOOM!', klein: 'Die Bombe ist hochgegangen', art: 'knall-bombe', farben: ['#ff3b5c', '#ff8a1e', '#ffd23a', '#2e2c52', '#ffffff'], stark: 1.3 }, mitte)); }
    else T.chip('daneben');
    return;
  }
  T.chip('treffer');
  if (L.gefallen) { T.chip('boom'); setTimeout(() => T.chip('sieg'), 250); P.boom(Object.assign({ text: 'K.O.!', klein: 'Der Wächter wankt', stark: 1.8 }, mitte)); }
  else if (f.wuerfel) { T.chip('wuerfel'); P.boom(Object.assign({ text: 'Goldwürfel!', art: 'knall-gold', farben: ['#ffd23a', '#fff0a0', '#e0961a', '#ffffff'], stark: 1.2 }, mitte)); }
  else if (f.knall === 'kombo') { T.chip('kombo', L.kombo / 5); T.chip('boom'); P.boom(Object.assign({ text: 'BOOM!', klein: 'Kombo ×' + L.kombo }, mitte)); }
  else if (f.entschaerft) { T.chip('entschaerft'); P.boom(Object.assign({ text: 'Entschärft!', art: 'knall-klein', stark: .6, farben: ['#36d27a', '#33d6ff', '#ffffff'] }, mitte)); }
  else if (f.volltreffer) { T.chip('kombo', 1); P.boom(Object.assign({ text: 'Volltreffer!', art: 'knall-klein', stark: .7 }, mitte)); }
  else T.chip('splitter');
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
  const L = S.lauf, O = L ? ortDaten(L.ort) : null, mx = lebenMax(O), px = istPixel(O);
  if (!L || L.leben <= 0 || L.flakons <= 0 || L.leben >= mx || O.kaffee === 'nein') return;
  L.leben = Math.min(mx, L.leben + (px ? K.KAFFEE_HERZEN : heilung())); L.flakons--;
  if (px) T.chip('herz'); else T.heilen();
  sichern();
  const antwortStand = L.frage.beantwortet;
  render();
  const h = $('.hud'); if (h) h.classList.add('geheilt');
  if (!antwortStand && L.frage.typ === 'tippen') fokus('#eingabe');
}

function rueckzugFragen(){
  if (!S.lauf || S.lauf.leben <= 0) return;
  const box = $('#rueckzug-frage'), L = S.lauf, boss = L.art === 'boss', pruefung = L.ort === 'gipfel', px = istPixel(ortDaten(L.ort));
  box.hidden = false;
  box.innerHTML = '<p>' + (pruefung ? (friede() ? 'Den Prüfungsraum verlassen?' : 'Den Prüfungsraum verlassen? Das zählt als durchgefallen.')
      : px ? (boss ? 'Wegfliegen? Der Wächter erholt sich, Seelen und Würfel behältst du.' : 'Auf eine Wolke abspringen? Der Sprung zählt nicht, aber Seelen, Splitter und Goldwürfel nimmst du mit.')
      : boss ? 'Fliehen? Der Boss erholt sich, du behältst deine Seelen.'
      : 'Zum Lagerfeuer zurückziehen? Dieser Gang zählt nicht, deine Seelen behältst du.') + '</p>' +
    '<div class="zeile"><button type="button" class="knopf leise" id="rz-ja">' + (pruefung ? 'Verlassen' : px && !boss ? 'Abspringen' : boss ? 'Fliehen' : 'Zurückziehen') + '</button><button type="button" class="knopf haupt" id="rz-nein">' + (pruefung ? 'Bleiben' : 'Weiterkämpfen') + '</button></div>';
  $('#rz-ja').addEventListener('click', () => {
    if (pruefung && !friede()) { L.leben = 0; sichern(); sterben(); return; }
    if (px && L.beutel !== undefined) iz(L.ort).splitter = L.beutel;
    const ort = L.ort; S.lauf = null; sichern(); location.hash = ortSeite(ort); render();
  });
  $('#rz-nein').addEventListener('click', () => { box.hidden = true; box.innerHTML = ''; });
  fokus('#rz-nein');
}

function gangEnde(){
  if (istPixel(ortDaten(S.lauf.ort))) return landung();
  const L = S.lauf, st = kz(L.ort), vorher = st.feuer;
  if (st.feuer < K.FEUER_ZUM_TOR) st.feuer++;
  S.zeige = { art: 'feuer', ort: L.ort, richtig: L.richtig, gesamt: L.gesamt, plus: L.plus, feuer: st.feuer, neu: vorher < K.FEUER_ZUM_TOR, tor: vorher < K.FEUER_ZUM_TOR && st.feuer >= K.FEUER_ZUM_TOR && !st.boss };
  S.lauf = null; sichern(); render();
}

function sterben(){
  const L = S.lauf;
  if (!L) return render();
  if (istPixel(ortDaten(L.ort))) return absturz();
  const id = L.frage.id, raetsel = L.frage.raetsel || null, verloren = S.blut ? S.blut.seelen : 0, fallen = S.seelen;
  S.blut = fallen > 0 ? { id, raetsel, ort: L.ort, seelen: fallen } : null;
  S.zeige = { art: 'tod', id, raetsel, fallen, verloren, ort: L.ort };
  S.seelen = 0; S.tode++; S.lauf = null;
  sichern(); render();
}

function bossSieg(){
  if (istPixel(ortDaten(S.lauf.ort))) return pixelSieg();
  const L = S.lauf, O = ortDaten(L.ort), erst = !besiegt(L.ort);
  if (typeof L.ort === 'number') kz(L.ort).boss = true; else az(L.ort).boss = true;
  const g = seelenGabe(Math.round(O.seelen * K.ngSeelen(S.ng)));
  S.seelen += g; S.verdient += g;
  let belohnung = '';
  if (erst && S.flakons < K.FLAKON_MAX) { S.flakons++; belohnung = 'splitter'; }
  else if (erst && S.roestung < K.ROESTUNG_MAX) { S.roestung++; belohnung = 'roestung'; }
  if (L.ort === 'gipfel') { S.bestanden = (S.bestanden || 0) + 1; S.zeige = { art: 'bestanden', seelen: g }; }
  else S.zeige = { art: 'sieg', ort: L.ort, belohnung, seelen: g, durchgang: L.ort === 'kokytos' && !S.aufstieg };
  if (L.ort === 'kokytos') S.aufstieg = true;
  S.lauf = null; sichern(); render();
}

/* ---------- Pixelparadies: Landung, Absturz, Sieg ----------
   Landung: Ende des Sprungs. Lande-Bonus in den Beutel, ein fehlerfreier Sprung öffnet eine Schatzkiste mit einem Goldwürfel.
   Absturz: alle Herzen weg. Keine Seelen verloren, kein Blutfleck, nur die losen Splitter im Beutel fallen mit. */
function landung(){
  const L = S.lauf, z = iz(L.ort), perfekt = L.gesamt > 0 && L.richtig === L.gesamt;
  L.beutel += K.LANDE_BONUS;
  while (L.beutel >= K.SPLITTER_JE_WUERFEL) { L.beutel -= K.SPLITTER_JE_WUERFEL; wuerfelDazu(L.ort); L.wuerfelNeu++; }
  if (perfekt) { wuerfelDazu(L.ort); L.wuerfelNeu++; }
  z.splitter = L.beutel; z.feuer = (z.feuer || 0) + 1;
  S.zeige = { art: 'landung', ort: L.ort, richtig: L.richtig, gesamt: L.gesamt, plus: L.plus, kombo: L.besteKombo || 0, neu: L.wuerfelNeu, splitter: z.splitter, perfekt,
    tor: !z.boss && z.wuerfel >= K.WUERFEL_ZUM_TOR && z.wuerfel - L.wuerfelNeu < K.WUERFEL_ZUM_TOR, satz: K.pick(LANDUNG) };
  S.lauf = null; sichern(); render();
  if (perfekt) setTimeout(() => { T.chip('wuerfel'); P.boom({ text: 'Perfekt!', klein: 'Schatzkiste: ein Goldwürfel', art: 'knall-gold', farben: ['#ffd23a', '#fff0a0', '#e0961a', '#ffffff', '#36d27a'] }); }, ruhig() ? 0 : 500);
  else T.chip('herz');
}
function absturz(){
  const L = S.lauf, verloren = L.beutel || 0;
  if (L.beutel !== undefined) iz(L.ort).splitter = 0;
  S.himmel.abstuerze = (S.himmel.abstuerze || 0) + 1;
  S.zeige = { art: 'absturz', ort: L.ort, id: L.frage.id, bombe: !!L.frage.bombe, verloren, neu: L.wuerfelNeu || 0, satz: K.pick(ABSTURZ) };
  S.lauf = null; sichern(); render();
  T.chip('absturz');
}
function pixelSieg(){
  const L = S.lauf, O = ortDaten(L.ort), erst = !besiegt(L.ort), insel = typeof L.ort === 'number';
  if (insel) kz(L.ort).boss = true; else az(L.ort).boss = true;
  const g = seelenGabe(O.seelen);
  S.seelen += g; S.verdient += g;
  let herz = false;
  if (erst && insel && (S.himmel.herzen || 0) < K.HERZCONTAINER_MAX) { S.himmel.herzen = (S.himmel.herzen || 0) + 1; herz = true; }
  S.zeige = { art: 'sieg', ort: L.ort, seelen: g, herz, kombo: L.besteKombo || 0 };
  S.lauf = null; sichern(); render();
  const feuerwerk = n => { for (let i = 0; i < n; i++) setTimeout(() => P.boom({ text: i ? '' : (insel ? 'Sieg!' : 'Gerettet!'), stark: 1.4, x: window.innerWidth * (.25 + Math.random() * .5), y: window.innerHeight * (.2 + Math.random() * .3) }), i * 420); };
  setTimeout(() => { T.chip('sieg'); if (!ruhig()) feuerwerk(insel ? 2 : 5); }, ruhig() ? 0 : 600);
}

/* Neues Spiel+: alle Bosse stehen wieder auf, Lernstand, Stufe, Lagerfeuer und Kaffee bleiben */
function neuesSpielPlus(){
  S.ng = (S.ng || 0) + 1;
  for (const k of KREISE.concat([KATAKOMBEN])) kz(k.lf).boss = false;
  for (const id of Object.keys(ARENEN)) az(id).boss = false;
  S.zeige = null; sichern(); location.hash = ''; render(); window.scrollTo(0, 0);
}

/* ---------- Große Bildschirme: Tod, Lagerfeuer, Tor, Sieg, Durchgang, Bestanden ---------- */
function zeige(){
  const z = S.zeige;
  const schliessen = ziel => () => { S.zeige = null; sichern(); if (ziel !== undefined) location.hash = ziel; render(); window.scrollTo(0, 0); };
  const O = z.ort !== undefined ? ortDaten(z.ort) : null;
  if (istPixel(O)) return pixelZeige(z, O, schliessen);
  if (z.art === 'tod') {
    const r = z.raetsel, c = r ? null : KARTE.get(z.id), arena = typeof z.ort === 'string', kurz = !r && K.istKuerzel(c);
    const titel = z.ort === 'gipfel' ? 'Durchgefallen' : z.ort === 'kokytos' ? 'Du bist erfroren' : 'Du bist gestorben';
    hintergrund(null, z.ort === 'gipfel' ? 'tod-pruefung' : 'tod');
    app.innerHTML =
      '<main class="gross tod' + (z.ort === 'gipfel' ? ' durchgefallen' : z.ort === 'kokytos' ? ' erfroren' : '') + '" role="alertdialog" aria-modal="true" aria-labelledby="tod-titel">' +
        '<div class="band"><h1 id="tod-titel">' + titel + '</h1></div>' +
        (pixelStil() ? '<div class="px-szene" aria-hidden="true">' + P.figur('bit', 'szene-bit tot') + '<i class="px-wolke"></i></div>' : '') +
        '<div class="gross-inhalt spaet">' +
          '<p class="tod-von">' + (z.ort === 'gipfel' ? 'Der Ausschuss hat entschieden, wegen' : 'Erledigt von') + '</p>' +
          '<p class="tod-begriff">' + esc(r ? R.NAMEN[r.art] : c.n) + '</p>' +
          (kurz ? '<p class="tod-lang">' + markiert(c) + '</p>' : '') +
          (r ? '<div class="tod-def">' + (r.frage || r.intro) + '</div><p class="merke"><b>Lösung:</b> ' + R.loesung(r) + '</p>' + werkstattSprung(r)
            : '<p class="tod-def">' + esc(c.d) + '</p>' + (c.m ? '<p class="merke"><b>Merke:</b> ' + esc(c.m) + '</p>' : '')) +
          '<p class="tod-seelen">' + (z.fallen ? '<b>' + zahl(z.fallen) + ' Seelen</b> liegen jetzt bei ' + (r ? 'diesem Rätsel' : 'dieser Karte') + '. ' + (arena ? 'Beim nächsten Versuch' : 'Im nächsten Gang ' + gangOrt(O)) +
            (r ? ' wartet es zuerst. Richtig gelöst' : ' kommt sie zuerst. Richtig beantwortet') + ', holst du sie zurück. Falsch, und sie sind weg.' : 'Du hattest keine Seelen dabei. Wenigstens das.') +
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
        (pixelStil() ? P.lagerfeuer('gross-feuer') : FLAMME.replace('class="flamme"', 'class="flamme gross-flamme"')) +
        '<div class="band gold"><h1 id="feuer-titel">' + (z.neu ? 'Lagerfeuer entzündet' : 'Rast am Lagerfeuer') + '</h1></div>' +
        '<div class="gross-inhalt spaet">' +
          '<p class="bilanz"><b>' + z.richtig + '</b> von ' + z.gesamt + ' richtig · <b>+' + zahl(z.plus) + '</b> Seelen</p>' +
          '<p>' + feuerPunkte(z.feuer) + '</p>' +
          '<p>' + (z.tor ? 'Alle Lagerfeuer brennen. <b>Das Nebeltor ist offen.</b> Dahinter wartet ' + esc(O.boss) + '.' : z.neu ? 'Lagerfeuer ' + z.feuer + ' von ' + K.FEUER_ZUM_TOR + ' ' + (O.akt === 0 ? 'in den Katakomben' : 'im ' + (O.akt === 2 ? '' : 'Kreis ') + esc(O.name)) + '.' : 'Leben und Kaffee sind wieder voll.') + '</p>' +
          '<button type="button" class="knopf haupt" id="weiter">Weiter</button>' +
        '</div>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen(ortSeite(z.ort)));
    fokus('#weiter');
    return;
  }
  if (z.art === 'tor') {
    const arena = typeof z.ort === 'string';
    const regeln = O.regeln || [
      '<b>' + K.BOSS_TREFFER + ' richtige Antworten</b> bringen den Boss zu Fall.',
      'Jeder Fehler kostet <b>' + K.schadenFuer(0, true, O.akt, S.ng) + ' Leben</b>. Fragen aus dem ganzen ' + (O.akt === 2 ? 'Prüfungsbereich' : 'Lernfeld') + ', die wackligen öfter.',
      'Karten, die schon sitzen sollten, musst du eintippen.'
    ];
    hintergrund(O.kampfBild || O.bild, arena ? 'arena-' + z.ort : 'tor', wetterVon(z.ort));
    app.innerHTML =
      '<main class="gross nebel' + (arena ? ' tor-' + z.ort : '') + '" role="dialog" aria-modal="true" aria-labelledby="tor-titel">' +
        (arena ? '' : '<div class="nebel-schleier" aria-hidden="true"></div>') +
        '<p class="ueber">' + (z.ort === 'gipfel' ? 'Hinter der Feuerwand' : z.ort === 'kokytos' ? 'Auf dem gefrorenen See' : 'Hinter dem Nebeltor') + '</p>' +
        (pixelStil() ? '<div class="waechter-auftritt">' + P.figur(P.bossFigur(z.ort), 'waechter-gross') + '</div>' : '') +
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
          (pixelStil() ? '<div class="px-szene sieg-szene" aria-hidden="true">' + P.figur(P.bossFigur(z.ort, 9), 'szene-waechter besiegt') + P.figur('bit', 'szene-bit jubel') + '</div>' : '') +
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

/* Die großen Bildschirme im Pixelparadies: Würfeltor, Landung, Absturz, Sieg */
function pixelZeige(z, O, schliessen){
  pixelWelt();
  const insel = typeof z.ort === 'number', figur = P.WAECHTER[z.ort];
  if (z.art === 'tor') {
    hintergrund(O.bild, 'pixel', 'funken');
    const regeln = O.regeln || [
      '<b>' + K.PIXEL_BOSS_LP + ' Treffer</b> bringen den Wächter zu Fall. Ab Kombo ×3 triffst du <b>doppelt</b>.',
      'Jede dritte Frage kommt mit <b>Lunte</b>. Fragen von der ganzen Insel, die wackligen öfter.',
      'Jeder Fehler kostet <b>ein Herz</b>, eine Bombe <b>zwei</b>. Kaffee ist erlaubt.'
    ];
    app.innerHTML =
      '<main class="gross px-gross px-tor-gross" role="dialog" aria-modal="true" aria-labelledby="tor-titel">' +
        '<p class="ueber">' + (insel ? 'Hinter dem Würfeltor' : 'Im Riss') + '</p>' +
        '<div class="waechter-auftritt">' + P.figur(figur, 'waechter-gross') + '</div>' +
        '<h1 class="px-titel px-boss-titel" id="tor-titel">' + esc(O.boss) + '<small>' + esc(O.bossZusatz) + '</small></h1>' +
        '<ul class="regeln px-regeln px-dialog">' + regeln.map(r => '<li>' + r + '</li>').join('') + '</ul>' +
        '<div class="zeile"><button type="button" class="knopf haupt" id="weiter">Kämpfen</button><button type="button" class="knopf leise" id="zurueck">Noch nicht</button></div>' +
      '</main>';
    $('#weiter').addEventListener('click', () => { S.zeige = null; bossStart(z.ort); });
    $('#zurueck').addEventListener('click', schliessen(ortSeite(z.ort)));
    fokus('#weiter');
    return;
  }
  if (z.art === 'landung') {
    hintergrund(O.bild, 'pixel', 'funken');
    app.innerHTML =
      '<main class="gross px-gross landung" role="dialog" aria-modal="true" aria-labelledby="landung-titel">' +
        '<div class="px-band"><h1 class="px-titel" id="landung-titel">' + (z.perfekt ? 'Perfekter Sprung!' : 'Gelandet!') + '</h1></div>' +
        '<div class="px-szene" aria-hidden="true">' + P.figur('bit', 'szene-bit hops') + '<i class="px-wolke"></i></div>' +
        '<p class="px-satz">' + esc(z.satz) + '</p>' +
        '<div class="px-panel px-bilanz">' +
          '<p><b>' + z.richtig + '</b> von ' + z.gesamt + ' richtig · beste Kombo <b>×' + z.kombo + '</b> · <b>+' + zahl(z.plus) + '</b> Seelen</p>' +
          (z.neu ? '<p class="neu-wuerfel">' + Array.from({ length: Math.min(z.neu, 6) }, () => P.figur('wuerfel', 'bilanz-wuerfel')).join('') + '<span><b>' + z.neu + '</b> ' + (z.neu === 1 ? 'neuer Goldwürfel' : 'neue Goldwürfel') + '</span></p>'
            : '<p>Diesmal kein ganzer Goldwürfel. Der Beutel ist trotzdem voller.</p>') +
          '<p class="stand-zeile">' + P.beutel(z.splitter, K.SPLITTER_JE_WUERFEL) + '<span><b>' + z.splitter + ' von ' + K.SPLITTER_JE_WUERFEL + '</b> Splittern im Beutel, ' + K.LANDE_BONUS + ' davon fürs Landen</span></p>' +
          (z.perfekt ? '<p class="schatz">' + P.figur('kiste', 'schatz-kiste') + '<span>Kein einziger Fehler: Die Schatzkiste gibt dir <b>einen Goldwürfel extra</b>.</span></p>' : '') +
          (z.tor ? '<p class="tor-auf"><b>Das Würfeltor ist offen.</b> Dahinter wartet ' + esc(O.boss) + '.</p>' : '') +
        '</div>' +
        '<button type="button" class="knopf haupt" id="weiter">Weiter</button>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen(ortSeite(z.ort)));
    fokus('#weiter');
    return;
  }
  if (z.art === 'absturz') {
    const c = KARTE.get(z.id);
    hintergrund(O.bild, 'pixel', 'funken');
    app.innerHTML =
      '<main class="gross px-gross absturz" role="alertdialog" aria-modal="true" aria-labelledby="absturz-titel">' +
        '<div class="px-band rot"><h1 class="px-titel" id="absturz-titel">Abgestürzt!</h1></div>' +
        '<div class="px-szene" aria-hidden="true">' + P.figur('bit', 'szene-bit faellt') + '<i class="px-wolke"></i></div>' +
        '<p class="px-satz">' + esc(z.satz) + '</p>' +
        '<div class="px-panel px-absturz-karte">' +
          '<p class="tod-von">' + (z.bombe ? 'Weggesprengt von' : 'Runtergeschubst von') + '</p>' +
          '<p class="tod-begriff">' + esc(c.n) + '</p>' +
          '<p class="tod-def">' + esc(c.d) + '</p>' + (c.m ? '<p class="merke"><b>Merke:</b> ' + esc(c.m) + '</p>' : '') +
        '</div>' +
        '<p class="px-hinweis">' + (z.verloren ? '<b>' + z.verloren + ' lose Splitter</b> sind mit dir gefallen. ' : '') +
          (z.neu === 1 ? 'Dein neuer Goldwürfel bleibt. ' : z.neu ? 'Deine ' + z.neu + ' neuen Goldwürfel bleiben. ' : 'Ganze Goldwürfel bleiben immer. ') + 'Seelen verlierst du hier oben keine.</p>' +
        '<button type="button" class="knopf haupt" id="weiter">' + (insel ? 'Zurück auf die Insel' : 'Zurück zum Riss') + '</button>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen(ortSeite(z.ort)));
    fokus('#weiter');
    return;
  }
  if (z.art === 'sieg') {
    hintergrund(O.bild, 'pixel', 'funken');
    app.innerHTML =
      '<main class="gross px-gross px-sieg" role="dialog" aria-modal="true" aria-labelledby="sieg-titel">' +
        '<div class="px-band gold"><h1 class="px-titel" id="sieg-titel">' + (insel ? 'Wächter besiegt!' : 'Der Himmel ist gerettet!') + '</h1></div>' +
        '<div class="px-szene sieg-szene" aria-hidden="true">' + P.figur(figur, 'szene-waechter besiegt') + P.figur('bit', 'szene-bit jubel') + '</div>' +
        '<p class="px-satz">' + esc(O.schluss || O.boss + ' zerfällt in Pixel. Die Insel atmet auf.') + '</p>' +
        '<div class="px-panel px-bilanz">' +
          '<p><b>+' + zahl(z.seelen) + '</b> Seelen · beste Kombo <b>×' + z.kombo + '</b></p>' +
          (z.herz ? '<p class="neu-herz">' + P.figur('herz', 'bilanz-herz') + '<span><b>Herzcontainer!</b> Ab jetzt hast du <b>' + herzMax() + ' Herzen</b> je Sprung.</span></p>' : '') +
          '<p>Titel errungen: <b class="px-gold">' + esc(O.titel) + '</b></p>' +
          (!insel ? '<p>Alle sieben Himmel und der Riss darüber. Wer so weit gesprungen ist, für den ist die echte Prüfung nur noch eine Insel mehr.</p>' : '') +
        '</div>' +
        '<button type="button" class="knopf haupt" id="weiter">' + (insel ? 'Weiter' : 'Zur Inselkarte') + '</button>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen(insel ? ortSeite(z.ort) : '#/himmel'));
    fokus('#weiter');
  }
}

/* Abspann nach dem Ausschuss */
function abspann(z){
  hintergrund(ABSPANN_BILD, 'abspann');
  const alleTitel = KREISE.map(k => k.titel).concat(Object.values(ARENEN).map(a => a.titel), kz(K.KATAKOMBEN).boss ? [KATAKOMBEN.titel] : []);
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
        zeile('Abseits des Weges', esc(KATAKOMBEN.boss) + (kz(K.KATAKOMBEN).boss ? ', zu drei Buchstaben zerfallen' : ' wartet noch in den Katakomben. Er hat Zeit.')) +
        zeile('Die Kreise und Gesimse', 'Dante Alighieri, der von alledem nichts wusste') +
        zeile('Kaffee', 'ja, sehr viel') +
        zeile('Karten', zahl(KARTEN.length - KUERZEL.length) + ' Begriffe aus AP1 und AP2<br>' + zahl(KUERZEL.length) + ' Kürzel in den Katakomben') +
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

/* Die Tonebene: der Wunsch aus dem Spielstand, der erste Gestus weckt den Wind, versteckte Tabs schlafen */
T.setzenMusik(S.musik !== false);
T.setzen(S.wind !== false);
T.setzenFx(S.kampfklang !== false);
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => T.wecken(), { once: true }));
document.addEventListener('visibilitychange', () => T.sichtbar(!document.hidden));
