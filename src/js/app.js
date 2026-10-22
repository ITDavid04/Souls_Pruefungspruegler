/* Prüfungsprügler: Oberfläche und Spielablauf.
   Ablauf: Lagerfeuer -> Kreis wählen -> Gang (10 Karten) -> Lagerfeuer. Nach drei Lagerfeuern im Kreis öffnet das Nebeltor zum Boss.
   Alles liegt im localStorage: spp.spiel (Spielstand) und spp.prog (Lernkasten je Karte). */
import * as K from './kern.js';
import { KREISE, kreis, AUSSCHUSS, TITEL_BILD, TITEL_ZITAT, RAST, TREFFER, DANEBEN } from './welt.js';

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
const neuesSpiel = () => ({ v: 1, gestartet: false, stufe: 1, seelen: 0, verdient: 0, tode: 0, flakons: 3, blut: null, kreise: {}, lauf: null, zeige: null });
let S = Object.assign(neuesSpiel(), store.get(SPIEL, {}) || {});
let prog = store.get(PROG, {}) || {};
const sichern = () => { store.set(SPIEL, S); store.set(PROG, prog); };
const kz = lf => S.kreise[lf] || (S.kreise[lf] = { feuer: 0, boss: false });
const maxLeben = () => K.maxLeben(S.stufe);

const app = $('#app');

/* ---------- Hintergrund mit Überblendung ---------- */
let bgAktiv = 'a', bgName = null;
function hintergrund(name, art = ''){
  document.body.dataset.bg = art;
  if (name === bgName) return;
  bgName = name;
  const naechst = bgAktiv === 'a' ? 'b' : 'a', el = $('#bg-' + naechst);
  const zeigen = () => { el.classList.add('an'); $('#bg-' + bgAktiv).classList.remove('an'); bgAktiv = naechst; };
  if (!name) { el.style.backgroundImage = ''; zeigen(); return; }
  const im = new Image();
  im.onload = im.onerror = zeigen;
  im.src = 'img/' + name + '.webp';
  el.style.backgroundImage = 'url("' + im.src + '")';
}

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
const feuerPunkte = n => '<span class="feuer-punkte" aria-label="' + n + ' von ' + K.FEUER_ZUM_TOR + ' Lagerfeuern">' +
  Array.from({ length: K.FEUER_ZUM_TOR }, (_, i) => '<i class="' + (i < n ? 'an' : '') + '"></i>').join('') + '</span>';
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
function vibrieren(muster){ try { if (navigator.vibrate) navigator.vibrate(muster); } catch (e) {} }

/* ---------- Ansichten ---------- */
let rastSatz = K.pick(RAST);
function render(){
  document.documentElement.classList.toggle('im-kampf', !!S.lauf && !S.zeige);
  if (!S.gestartet) return titel();
  if (S.zeige) return zeige();
  if (S.lauf) return kampf();
  const m = location.hash.match(/^#\/kreis\/([1-6])$/);
  if (m) return kreisSeite(Number(m[1]));
  return lagerfeuer();
}
window.addEventListener('hashchange', () => { rastSatz = K.pick(RAST); render(); window.scrollTo(0, 0); });

/* Titel: nur beim ersten Start */
function titel(){
  hintergrund(TITEL_BILD, 'titel');
  app.innerHTML =
    '<main class="titel">' +
      '<p class="ueber">AP1 · Fachinformatik</p>' +
      '<h1 class="logo">Prüfungs&shy;prügler</h1>' +
      '<blockquote class="zitat">' + esc(TITEL_ZITAT) + '</blockquote>' +
      '<ul class="regeln">' +
        '<li><b>Richtig</b> bringt Seelen, <b>falsch</b> kostet Leben.</li>' +
        '<li><b>Stirbst du</b>, bleiben deine Seelen bei der Karte, die dich erledigt hat. Beantworte sie im nächsten Gang richtig, und sie gehören wieder dir.</li>' +
        '<li><b>Drei Lagerfeuer</b> in einem Kreis öffnen das Nebeltor zum Boss.</li>' +
      '</ul>' +
      '<button type="button" class="knopf haupt" id="los">Hinabsteigen</button>' +
    '</main>';
  $('#los').addEventListener('click', () => { S.gestartet = true; sichern(); location.hash = ''; render(); });
  fokus('#los');
}

/* Lagerfeuer: Startseite mit Stufe und den Kreisen */
function lagerfeuer(){
  hintergrund(null, 'feuer');
  const preis = K.stufenPreis(S.stufe), kann = S.seelen >= preis && maxLeben() < 200;
  const blutKreis = S.blut ? kreis(S.blut.lf) : null;
  const alleBosse = KREISE.every(k => kz(k.lf).boss);
  const kacheln = KREISE.map(k => {
    const z = kreisZahlen(k.lf), st = kz(k.lf);
    const zustand = st.boss ? '<span class="marke gold">Bezwungen</span>' : st.feuer >= K.FEUER_ZUM_TOR ? '<span class="marke nebel">Nebeltor offen</span>' : '';
    return '<li><a class="kachel" href="#/kreis/' + k.lf + '" style="--bild:url(img/' + k.bild + '-klein.webp)">' +
      '<span class="kachel-nr">' + k.nr + ' · LF' + k.lf + '</span>' +
      '<strong class="kachel-name">' + esc(k.name) + '</strong>' +
      '<span class="kachel-lf">' + esc(k.lfName) + '</span>' +
      '<span class="kachel-fuss">' + feuerPunkte(st.feuer) + zustand + (S.blut && S.blut.lf === k.lf ? '<span class="marke blut">Blutfleck</span>' : '') + '</span>' +
      '<span class="kachel-zahlen">' + z.sitzen + ' von ' + z.gesamt + ' sitzen' + (z.faellig ? ' · <b>' + z.faellig + ' fällig</b>' : '') + '</span>' +
    '</a></li>';
  }).join('');
  app.innerHTML =
    '<main class="hub">' +
      '<section class="feuerstelle">' +
        FLAMME +
        '<h1 class="gold-titel">Lagerfeuer</h1>' +
        '<p class="rast">' + esc(rastSatz) + '</p>' +
      '</section>' +
      '<section class="werte" aria-label="Dein Stand">' +
        '<div><span>Stufe</span><b>' + S.stufe + '</b></div>' +
        '<div><span>Seelen</span><b class="seelen-zahl">' + zahl(S.seelen) + '</b></div>' +
        '<div><span>Leben</span><b>' + maxLeben() + '</b></div>' +
        '<div><span>Kaffee</span><b>' + S.flakons + '</b></div>' +
      '</section>' +
      '<button type="button" class="knopf aufstieg" id="aufstieg"' + (kann ? '' : ' disabled') + '>' +
        (maxLeben() >= 200 ? 'Höchste Stufe erreicht' : kann ? 'Stufe aufsteigen · ' + zahl(preis) + ' Seelen' : 'Stufe ' + (S.stufe + 1) + ' für ' + zahl(preis) + ' Seelen') +
        '<small>' + (maxLeben() >= 200 ? 'Mehr Leben gibt es nicht' : '+5 Leben je Stufe') + '</small></button>' +
      (blutKreis ? '<p class="hinweis blut-hinweis"><b>' + zahl(S.blut.seelen) + ' Seelen</b> liegen im ' + esc(blutKreis.nr) + ', ' + esc(blutKreis.name) + '. Hol sie dir, bevor du woanders stirbst.</p>' : '') +
      '<h2 class="abschnitt">Die Kreise</h2>' +
      '<ul class="kacheln">' + kacheln +
        '<li><div class="kachel zu' + (alleBosse ? ' wach' : '') + '" style="--bild:url(img/' + AUSSCHUSS.bild + '-klein.webp)">' +
          '<span class="kachel-nr">Jenseits der Kreise</span><strong class="kachel-name">' + esc(AUSSCHUSS.name) + '</strong>' +
          '<span class="kachel-lf">' + (alleBosse ? 'Der Stuhl wartet. Im Prototyp noch nicht.' : 'Erst wenn alle sechs Bosse liegen.') + '</span>' +
        '</div></li>' +
      '</ul>' +
      '<details class="spielstand"><summary>Spielstand</summary>' +
        '<p>' + zahl(S.verdient) + ' Seelen verdient · ' + S.tode + ' ' + (S.tode === 1 ? 'Tod' : 'Tode') + ' · ' + KARTEN.filter(c => K.stand(prog, c).b > 0).length + ' von ' + KARTEN.length + ' Karten gesehen</p>' +
        '<button type="button" class="knopf leise" id="installieren" hidden>App installieren</button>' +
        '<div class="loeschen" id="loeschen"><button type="button" class="knopf leise gefahr" id="loeschen-frage">Spielstand löschen</button></div>' +
      '</details>' +
    '</main>';
  $('#aufstieg').addEventListener('click', () => {
    const p = K.stufenPreis(S.stufe);
    if (S.seelen < p || maxLeben() >= 200) return;
    S.seelen -= p; S.stufe++; sichern(); render();
    const w = $('.werte'); if (w) { w.classList.add('aufgestiegen'); }
    fokus('#aufstieg');
  });
  $('#loeschen-frage').addEventListener('click', () => {
    $('#loeschen').innerHTML = '<span>Alles löschen, auch den Lernstand?</span><button type="button" class="knopf leise gefahr" id="loeschen-ja">Ja, löschen</button><button type="button" class="knopf leise" id="loeschen-nein">Abbrechen</button>';
    $('#loeschen-ja').addEventListener('click', () => { store.del(SPIEL); store.del(PROG); S = neuesSpiel(); prog = {}; location.hash = ''; render(); });
    $('#loeschen-nein').addEventListener('click', render);
    fokus('#loeschen-nein');
  });
  installKnopf();
}

/* Kreis: Bild, Zitat, Stand, Gang oder Nebeltor */
function kreisSeite(lf){
  const k = kreis(lf), st = kz(lf), z = kreisZahlen(lf);
  hintergrund(k.bild, 'kreis');
  const torOffen = st.feuer >= K.FEUER_ZUM_TOR && !st.boss;
  app.innerHTML =
    '<main class="kreis-seite">' +
      '<a class="zurueck" href="#/">Zum Lagerfeuer</a>' +
      '<header class="kreis-kopf">' +
        '<p class="ueber">' + k.nr + ' · LF' + lf + '</p>' +
        '<h1 class="kreis-name">' + esc(k.name) + '</h1>' +
        '<p class="kreis-lf">' + esc(k.lfName) + '</p>' +
      '</header>' +
      '<blockquote class="zitat">' + esc(k.zitat) + '</blockquote>' +
      '<section class="kreis-stand">' +
        '<p>' + feuerPunkte(st.feuer) + ' <span>' + (st.feuer >= K.FEUER_ZUM_TOR ? 'Alle Lagerfeuer brennen' : 'Lagerfeuer ' + st.feuer + ' von ' + K.FEUER_ZUM_TOR) + '</span></p>' +
        '<p class="zahlen"><b>' + z.sitzen + '</b> von ' + z.gesamt + ' sitzen · <b>' + z.faellig + '</b> fällig · <b>' + z.neu + '</b> neu</p>' +
        (S.blut && S.blut.lf === lf ? '<p class="blut-hinweis">Dein Blutfleck liegt hier: <b>' + zahl(S.blut.seelen) + ' Seelen</b>. Die Karte kommt als Erstes.</p>' : '') +
      '</section>' +
      '<div class="aktionen">' +
        '<button type="button" class="knopf haupt" id="gang">Gang beginnen<small>' + K.GANG + ' Karten, am Ende ein Lagerfeuer</small></button>' +
        (torOffen ? '<button type="button" class="knopf nebeltor" id="tor">Nebeltor durchschreiten<small>' + esc(k.boss) + ' wartet</small></button>'
          : st.boss ? '<p class="bezwungen"><b>' + esc(k.boss) + '</b> liegt im Staub. Titel: <b>' + esc(k.titel) + '</b></p>'
          : '<p class="tor-zu">Das Nebeltor öffnet sich nach ' + K.FEUER_ZUM_TOR + ' Lagerfeuern. Dahinter: ' + esc(k.boss) + '.</p>') +
      '</div>' +
    '</main>';
  $('#gang').addEventListener('click', () => gangStart(lf));
  const tor = $('#tor');
  if (tor) tor.addEventListener('click', () => { S.zeige = { art: 'tor', lf }; sichern(); render(); });
  fokus('#gang');
}

/* ---------- Kampf ---------- */
function laufStart(art, lf, extra){
  S.lauf = Object.assign({ art, lf, leben: maxLeben(), flakons: S.flakons, richtig: 0, gesamt: 0, plus: 0, blutOffen: !!(S.blut && S.blut.lf === lf), frage: null }, extra);
  S.lauf.frage = neueFrage();
  sichern(); letzteLeben = S.lauf.leben; render(); window.scrollTo(0, 0);
}
const gangStart = lf => laufStart('gang', lf, { plan: K.gangPlanen(KARTEN, prog, lf, S.blut && S.blut.id), pos: 0, nach: {} });
const bossStart = lf => laufStart('boss', lf, { bossLeben: K.BOSS_TREFFER, zuletzt: [] });

function neueFrage(){
  const L = S.lauf, boss = L.art === 'boss';
  let id, nachgeholt = false;
  if (boss) {
    id = L.blutOffen && S.blut ? S.blut.id : K.bossKarte(KARTEN, prog, L.lf, L.zuletzt).i;
    L.zuletzt = L.zuletzt.concat(id).slice(-6);
  } else {
    id = L.plan[L.pos];
    if (id.startsWith('!')) { id = id.slice(1); nachgeholt = true; }
  }
  const c = KARTE.get(id), typ = K.fragetyp(prog, c, boss);
  return {
    id, typ, nachgeholt,
    blut: !!(L.blutOffen && S.blut && S.blut.id === id),
    optionen: typ === 'tippen' ? null : K.shuffle([c].concat(K.ablenker(KARTEN, c))).map(x => x.i),
    beantwortet: false
  };
}

const TYP_TEXT = { begriff: 'Welcher Begriff ist gemeint?', definition: 'Welche Erklärung passt?', tippen: 'Begriff eintippen' };
let letzteLeben = null;
function kampf(){
  const L = S.lauf, f = L.frage, c = KARTE.get(f.id), k = kreis(L.lf), boss = L.art === 'boss', mx = maxLeben();
  hintergrund(k.bild, boss ? 'boss' : 'kampf');
  const pct = v => Math.max(0, Math.min(100, v / mx * 100));
  const vorher = letzteLeben === null ? L.leben : letzteLeben;
  const fertig = boss ? '' : '<span class="schritte" aria-label="Karte ' + (L.pos + 1) + ' von ' + L.plan.length + '">' +
    L.plan.map((_, i) => '<i class="' + (i < L.pos || (i === L.pos && f.beantwortet) ? 'an' : i === L.pos ? 'jetzt' : '') + '"></i>').join('') + '</span>';
  let frage = '';
  if (f.typ === 'definition') frage = '<p class="frage begriff-gross">' + esc(c.n) + '</p>';
  else frage = '<p class="frage">' + esc(c.d) + '</p>';
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
  app.innerHTML =
    '<main class="kampf' + (boss ? ' ist-boss' : '') + '">' +
      '<header class="hud">' +
        '<div class="leben" role="meter" aria-label="Leben" aria-valuemin="0" aria-valuemax="' + mx + '" aria-valuenow="' + L.leben + '">' +
          '<div class="balken"><i class="spur" style="width:' + pct(vorher) + '%"></i><i class="wert" style="width:' + pct(L.leben) + '%"></i></div>' +
          '<span class="leben-zahl">' + L.leben + ' / ' + mx + '</span>' +
        '</div>' +
        '<button type="button" class="flakon" id="flakon"' + (L.flakons <= 0 || L.leben <= 0 || L.leben >= mx ? ' disabled' : '') + ' aria-label="Kaffeeflakon trinken, plus ' + K.FLAKON + ' Leben, noch ' + L.flakons + '">' +
          '<svg class="tasse" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2.5c-1 1.2 1 2 0 3.5M12 2.5c-1 1.2 1 2 0 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".7"/><path d="M4 8h13v6.5A5.5 5.5 0 0 1 11.5 20h-2A5.5 5.5 0 0 1 4 14.5Z" fill="currentColor"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 22h15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><b>' + L.flakons + '</b></button>' +
        '<span class="seelen-hud"><b>' + zahl(S.seelen) + '</b> Seelen</span>' +
      '</header>' +
      '<div class="lauf-kopf">' +
        '<button type="button" class="rueckzug" id="rueckzug"' + (L.leben <= 0 ? ' disabled' : '') + '>Rückzug</button>' +
        '<span class="lauf-ort">' + esc(k.name) + '</span>' + fertig +
      '</div>' +
      (boss ? '<div class="bossbalken"><span class="boss-name">' + esc(k.boss) + '<small>' + esc(k.bossZusatz) + '</small></span>' +
        '<div class="balken"><i style="width:' + (L.bossLeben / K.BOSS_TREFFER * 100) + '%"></i></div></div>' : '') +
      '<section class="karte" id="karte">' +
        '<p class="karte-kopf"><span>' + TYP_TEXT[f.typ] + '</span><span class="thema">' + esc(c.t) + '</span></p>' +
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
}

function weiterText(){
  const L = S.lauf;
  if (L.leben <= 0) return 'Weiter';
  if (L.art === 'boss') return L.bossLeben <= 0 ? 'Der Boss fällt' : 'Weiter';
  return L.pos + 1 >= L.plan.length ? 'Zum Lagerfeuer' : 'Weiter';
}

function rueckmeldung(c, f){
  const urteil = f.gut ? (f.tippfehler ? 'Fast, zählt' : 'Treffer') : 'Daneben';
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
  const f = L.frage;
  const c = KARTE.get(f.id), boss = L.art === 'boss', fachVorher = K.stand(prog, c).b;
  Object.assign(f, info, { beantwortet: true, gut });
  if (f.nachgeholt) { if (!gut) K.fehlerNachtragen(prog, c); }
  else K.eintragen(prog, c, gut);
  L.gesamt++;
  const zeilen = [];
  if (gut) {
    L.richtig++;
    const g = f.nachgeholt ? 5 : K.seelenFuer(fachVorher, boss);
    S.seelen += g; S.verdient += g; L.plus += g;
    zeilen.push('+' + g + ' Seelen');
    if (f.blut && S.blut) { S.seelen += S.blut.seelen; L.plus += S.blut.seelen; zeilen.push('Seelen zurückgeholt: +' + zahl(S.blut.seelen)); S.blut = null; L.blutOffen = false; }
    if (boss) { L.bossLeben--; zeilen.push(L.bossLeben > 0 ? 'Treffer. Noch ' + L.bossLeben + ' bis zum Fall.' : 'Der Boss wankt …'); }
    if (Math.random() < 0.2) f.spruch = K.pick(TREFFER);
  } else {
    const d = K.schadenFuer(fachVorher, boss);
    L.leben = Math.max(0, L.leben - d);
    zeilen.push('−' + d + ' Leben' + (!boss && fachVorher >= 3 ? ', die Karte saß schon, das tut mehr weh' : ''));
    if (f.blut && S.blut) { zeilen.push('Deine ' + zahl(S.blut.seelen) + ' Seelen versickern im Boden.'); S.blut = null; L.blutOffen = false; }
    if (!boss && L.leben > 0 && !L.nach[c.i]) {
      L.plan.splice(Math.min(L.plan.length, L.pos + 4), 0, '!' + c.i);
      L.nach[c.i] = true;
      zeilen.push('Sie kommt in drei Karten wieder.');
    }
    if (L.leben > 0 && Math.random() < 0.35) f.spruch = K.pick(DANEBEN);
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
  if (L.art === 'boss' && L.bossLeben <= 0) return bossSieg();
  if (L.art === 'gang') { L.pos++; if (L.pos >= L.plan.length) return gangEnde(); }
  L.frage = neueFrage();
  sichern(); render(); window.scrollTo(0, 0);
}

function trinken(){
  const L = S.lauf, mx = maxLeben();
  if (!L || L.leben <= 0 || L.flakons <= 0 || L.leben >= mx) return;
  L.leben = Math.min(mx, L.leben + K.FLAKON); L.flakons--;
  sichern();
  const antwortStand = L.frage.beantwortet;
  render();
  const h = $('.hud'); if (h) h.classList.add('geheilt');
  if (!antwortStand && L.frage.typ === 'tippen') fokus('#eingabe');
}

function rueckzugFragen(){
  if (!S.lauf || S.lauf.leben <= 0) return;
  const box = $('#rueckzug-frage'), boss = S.lauf.art === 'boss';
  box.hidden = false;
  box.innerHTML = '<p>' + (boss ? 'Fliehen? Der Boss erholt sich, du behältst deine Seelen.' : 'Zum Lagerfeuer zurückziehen? Dieser Gang zählt nicht, deine Seelen behältst du.') + '</p>' +
    '<div class="zeile"><button type="button" class="knopf leise" id="rz-ja">' + (boss ? 'Fliehen' : 'Zurückziehen') + '</button><button type="button" class="knopf haupt" id="rz-nein">Weiterkämpfen</button></div>';
  $('#rz-ja').addEventListener('click', () => { const lf = S.lauf.lf; S.lauf = null; sichern(); location.hash = '#/kreis/' + lf; render(); });
  $('#rz-nein').addEventListener('click', () => { box.hidden = true; box.innerHTML = ''; });
  fokus('#rz-nein');
}

function gangEnde(){
  const L = S.lauf, st = kz(L.lf), vorher = st.feuer;
  if (st.feuer < K.FEUER_ZUM_TOR) st.feuer++;
  S.zeige = { art: 'feuer', lf: L.lf, richtig: L.richtig, gesamt: L.gesamt, plus: L.plus, feuer: st.feuer, neu: vorher < K.FEUER_ZUM_TOR, tor: vorher < K.FEUER_ZUM_TOR && st.feuer >= K.FEUER_ZUM_TOR && !st.boss };
  S.lauf = null; sichern(); render();
}

function sterben(){
  const L = S.lauf;
  if (!L) return render();
  const id = L.frage.id, verloren = S.blut ? S.blut.seelen : 0, fallen = S.seelen;
  S.blut = fallen > 0 ? { id, lf: L.lf, seelen: fallen } : null;
  S.zeige = { art: 'tod', id, fallen, verloren, boss: L.art === 'boss' };
  S.seelen = 0; S.tode++; S.lauf = null;
  sichern(); render();
}

function bossSieg(){
  const L = S.lauf, st = kz(L.lf), erst = !st.boss;
  st.boss = true;
  S.seelen += K.BOSS_SEELEN; S.verdient += K.BOSS_SEELEN;
  const splitter = erst && S.flakons < K.FLAKON_MAX;
  if (splitter) S.flakons++;
  S.zeige = { art: 'sieg', lf: L.lf, splitter };
  S.lauf = null; sichern(); render();
}

/* ---------- Große Bildschirme: Tod, Lagerfeuer, Nebeltor, Sieg ---------- */
function zeige(){
  const z = S.zeige;
  const schliessen = ziel => () => { S.zeige = null; sichern(); if (ziel !== undefined) location.hash = ziel; render(); window.scrollTo(0, 0); };
  if (z.art === 'tod') {
    const c = KARTE.get(z.id);
    hintergrund(null, 'tod');
    app.innerHTML =
      '<main class="gross tod" role="alertdialog" aria-modal="true" aria-labelledby="tod-titel">' +
        '<div class="band"><h1 id="tod-titel">Du bist gestorben</h1></div>' +
        '<div class="gross-inhalt spaet">' +
          '<p class="tod-von">Erledigt von</p>' +
          '<p class="tod-begriff">' + esc(c.n) + '</p>' +
          '<p class="tod-def">' + esc(c.d) + '</p>' +
          (c.m ? '<p class="merke"><b>Merke:</b> ' + esc(c.m) + '</p>' : '') +
          '<p class="tod-seelen">' + (z.fallen ? '<b>' + zahl(z.fallen) + ' Seelen</b> liegen jetzt bei dieser Karte. Im nächsten Gang durch diesen Kreis kommt sie zuerst. Richtig beantwortet, holst du sie zurück. Falsch, und sie sind weg.' : 'Du hattest keine Seelen dabei. Wenigstens das.') +
            (z.verloren ? ' Die ' + zahl(z.verloren) + ' Seelen vom letzten Mal sind versickert.' : '') + '</p>' +
          '<button type="button" class="knopf haupt" id="weiter">Am Lagerfeuer erwachen</button>' +
        '</div>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen(''));
    fokus('#weiter');
    return;
  }
  const k = kreis(z.lf);
  if (z.art === 'feuer') {
    hintergrund(null, 'feuer');
    app.innerHTML =
      '<main class="gross feuer-gross" role="dialog" aria-modal="true" aria-labelledby="feuer-titel">' +
        FLAMME.replace('class="flamme"', 'class="flamme gross-flamme"') +
        '<div class="band gold"><h1 id="feuer-titel">' + (z.neu ? 'Lagerfeuer entzündet' : 'Rast am Lagerfeuer') + '</h1></div>' +
        '<div class="gross-inhalt spaet">' +
          '<p class="bilanz"><b>' + z.richtig + '</b> von ' + z.gesamt + ' richtig · <b>+' + zahl(z.plus) + '</b> Seelen</p>' +
          '<p>' + feuerPunkte(z.feuer) + '</p>' +
          '<p>' + (z.tor ? 'Alle Lagerfeuer im Kreis brennen. <b>Das Nebeltor ist offen.</b> Dahinter wartet ' + esc(k.boss) + '.' : z.neu ? 'Lagerfeuer ' + z.feuer + ' von ' + K.FEUER_ZUM_TOR + ' im Kreis ' + esc(k.name) + '.' : 'Leben und Kaffee sind wieder voll.') + '</p>' +
          '<button type="button" class="knopf haupt" id="weiter">Weiter</button>' +
        '</div>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen('#/kreis/' + z.lf));
    fokus('#weiter');
    return;
  }
  if (z.art === 'tor') {
    hintergrund(k.bild, 'tor');
    app.innerHTML =
      '<main class="gross nebel" role="dialog" aria-modal="true" aria-labelledby="tor-titel">' +
        '<div class="nebel-schleier" aria-hidden="true"></div>' +
        '<p class="ueber">Hinter dem Nebeltor</p>' +
        '<h1 class="boss-gross" id="tor-titel">' + esc(k.boss) + '<small>' + esc(k.bossZusatz) + '</small></h1>' +
        '<ul class="regeln">' +
          '<li><b>' + K.BOSS_TREFFER + ' richtige Antworten</b> bringen den Boss zu Fall.</li>' +
          '<li>Jeder Fehler kostet <b>35 Leben</b>. Fragen aus dem ganzen Lernfeld, die wackligen öfter.</li>' +
          '<li>Karten, die schon sitzen sollten, musst du eintippen.</li>' +
        '</ul>' +
        '<div class="zeile"><button type="button" class="knopf haupt" id="weiter">Eintreten</button><button type="button" class="knopf leise" id="zurueck">Noch nicht</button></div>' +
      '</main>';
    $('#weiter').addEventListener('click', () => { S.zeige = null; bossStart(z.lf); });
    $('#zurueck').addEventListener('click', schliessen('#/kreis/' + z.lf));
    fokus('#weiter');
    return;
  }
  if (z.art === 'sieg') {
    hintergrund(k.bild, 'sieg');
    app.innerHTML =
      '<main class="gross sieg" role="dialog" aria-modal="true" aria-labelledby="sieg-titel">' +
        '<div class="band gold"><h1 id="sieg-titel">Gegner bezwungen</h1></div>' +
        '<div class="gross-inhalt spaet">' +
          '<p class="boss-gross klein-boss">' + esc(k.boss) + '</p>' +
          '<p class="bilanz"><b>+' + K.BOSS_SEELEN + '</b> Seelen' + (z.splitter ? ' · Kaffeeflakon-Splitter: jetzt <b>' + S.flakons + '</b> Flakons' : '') + '</p>' +
          '<p>Titel errungen: <b class="gold-text">' + esc(k.titel) + '</b></p>' +
          '<button type="button" class="knopf haupt" id="weiter">Weiter</button>' +
        '</div>' +
      '</main>';
    $('#weiter').addEventListener('click', schliessen('#/kreis/' + z.lf));
    fokus('#weiter');
  }
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
