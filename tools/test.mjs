/* Automatischer Test der gebauten App in docs/ mit dem installierten Chrome (puppeteer-core).
   npm test                -> spielt einmal alles durch, Bildschirmfotos nach tools/shots/
   CHROME=/pfad npm test   -> falls Chrome woanders liegt
   CI=1 npm test           -> wie auf GitHub (ohne Sandbox)
   Prüft: Titel, Lagerfeuer, Gang bis zum Lagerfeuer, Tod mit Blutfleck, Seelen zurückholen, Weiterspielen nach Neuladen,
   Rückzug, Kaffee, Eintippen mit Tippfehler, Nebeltor und Boss, Stufenaufstieg, Ruhiger Modus, AP2-Abkürzung, Katakomben der Kürzel mit Gebeinhaus
   und Akronymant, Rätsel (Rechengegner, Botschaft, Mimic-Truhe, Restore, Tod durch ein Rätsel, Rätsel im Bosskampf),
   Werkstatt (Sprung aus einem falschen Rätsel, Rückweg ohne Titel, Breite am Handy, nichts aus dem Netz),
   Installierbarkeit, Start ohne Netz (auch die Werkstatt), keine Fehler in der Konsole. Gewartet wird auf Zustände, nie fest. */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { start } from './serve.mjs';

const SHOTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'shots');
const PORT = 8093, BASE = `http://localhost:${PORT}/`;
const results = [];
const check = (name, pass, info = '') => { results.push({ name, pass: !!pass, info }); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

await mkdir(SHOTS, { recursive: true });
const server = await start(PORT);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  headless: 'new',
  args: process.env.CI ? ['--no-sandbox'] : []
});

function watch(page, label){
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(`${label} Konsole: ${m.text()}`); });
  page.on('pageerror', e => errs.push(`${label} Skriptfehler: ${e.message}`));
  page.on('requestfailed', r => { if (r.url().startsWith(BASE)) errs.push(`${label} Anfrage fehlgeschlagen: ${r.url()} ${r.failure() && r.failure().errorText}`); });
  return errs;
}
const spiel = page => page.evaluate(() => JSON.parse(localStorage.getItem('spp.spiel') || 'null'));
const setze = (page, fn, arg) => page.evaluate((src, a) => {
  const S = JSON.parse(localStorage.getItem('spp.spiel'));
  new Function('S', 'a', src)(S, a);
  localStorage.setItem('spp.spiel', JSON.stringify(S));
}, fn, arg);
const warte = (page, fn, arg) => page.waitForFunction(fn, { timeout: 10000 }, arg);
const ansicht = (page, cls) => warte(page, c => { const m = document.querySelector('#app > main'); return m && m.classList.contains(c); }, cls);
const klick = async (page, sel) => { await page.waitForSelector(sel, { visible: true, timeout: 10000 }); await page.$eval(sel, b => b.click()); };
const foto = async (page, name, full = false) => { await sleep(80); await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: full }); };
const begriffVon = (page, id) => page.evaluate(i => JSON.parse(document.getElementById('karten').textContent).find(c => c.i === i).n, id);

/* Eine Frage beantworten, richtig oder falsch, und warten, bis die Antwort gespeichert ist */
async function antworte(page, richtig, tippfehler = false){
  const S = await spiel(page), f = S.lauf.frage;
  if (f.typ === 'raetsel') await loese(page, f.raetsel, richtig);
  else if (f.typ === 'tippen') {
    if (richtig) {
      let wort = await begriffVon(page, f.id);
      if (tippfehler) wort = wort.slice(0, -2) + wort.slice(-1);
      await page.waitForSelector('#eingabe', { visible: true });
      await page.$eval('#eingabe', (e, w) => { e.value = w; }, wort);
      await page.$eval('#tippen button[type=submit]', b => b.click());
    } else await klick(page, '#passen');
  } else {
    /* Kürzel-Fragen merken sich die richtige Antwort in ok, die übrigen sind Kartenkennungen */
    const ri = f.ok != null ? f.ok : f.optionen.indexOf(f.id);
    const n = richtig ? ri : f.optionen.findIndex((x, i) => i !== ri);
    await klick(page, `.option[data-n="${n}"]`);
  }
  await warte(page, () => { const S = JSON.parse(localStorage.getItem('spp.spiel')); return !S.lauf || S.lauf.frage.beantwortet; });
}
/* Ein Rätsel so lösen, wie man es von Hand täte, oder bewusst danebenliegen */
async function loese(page, r, richtig){
  if (r.art === 'rechnen' && r.felder) {
    if (!richtig) return klick(page, '#passen');
    for (let k = 0; k < r.felder.length; k++) await page.$eval('#feld-' + k, (e, v) => { e.value = v; }, r.felder[k].soll);
    return klick(page, '#felder button[type=submit]');
  }
  if (r.art === 'rechnen') {
    const w = r.wahl;
    if (!w.mehrere) return klick(page, `.option[data-n="${richtig ? w.richtig[0] : w.optionen.findIndex((_, i) => !w.richtig.includes(i))}"]`);
    if (!richtig) return klick(page, '#passen');
    for (const n of w.richtig) await klick(page, `.option[data-n="${n}"]`);
    return klick(page, '#zuschlagen');
  }
  if (r.art === 'botschaft') return klick(page, `.zeile-knopf[data-k="${richtig ? r.falsch : (r.falsch + 1) % r.zeilen.length}"]`);
  if (r.art === 'mimic') return klick(page, `.gatter-knopf[data-g="${richtig ? r.gatter : r.gatter === 'AND' ? 'OR' : 'AND'}"]`);
  if (r.art === 'restore') {
    if (!richtig) return klick(page, '#passen');
    for (const t of r.soll) await klick(page, `#restore .medium[data-t="${t}"]`);
    return klick(page, '#zurueckspielen');
  }
}
/* Ein bestimmtes Rätsel als aktuelle Frage stellen (gewürfelt von raetsel.js wie in der App) */
const raetselStellen = (page, name) => page.evaluate(async name => {
  const R = await import('./js/raetsel.js');
  const r = R.erzeugen(name), S = JSON.parse(localStorage.getItem('spp.spiel'));
  const f = { id: null, typ: 'raetsel', raetsel: r, nachgeholt: false, auftritt: false, blut: false, beantwortet: false };
  if (r.art === 'mimic') Object.assign(f, { a: 0, b: 0, proben: { '00': R.gatter(r.gatter).f(0, 0) } });
  if (r.art === 'restore') f.folge = [];
  S.lauf.frage = f;
  localStorage.setItem('spp.spiel', JSON.stringify(S));
  return r;
}, name);
async function weiter(page){
  const vor = await spiel(page);
  await klick(page, '#weiter');
  await warte(page, v => localStorage.getItem('spp.spiel') !== v, JSON.stringify(vor));
}
/* Der Titel kommt bei jedem Start; durchklicken und warten, bis er weg ist */
async function durchTitel(page){
  await ansicht(page, 'titel');
  await klick(page, '#los');
  await warte(page, () => { const m = document.querySelector('#app > main'); return m && !m.classList.contains('titel') && !document.body.classList.contains('abstieg'); });
}
async function neuLaden(page, warten = 'networkidle0'){
  await page.reload({ waitUntil: warten });
  await durchTitel(page);
}
/* Eine Kürzel-Frage gezielt stellen; die Antworten würfelt kern.js wie in der App. spass: so lange würfeln, bis die Spaß-Langform dabei ist */
const kuerzelFrage = (page, n, typ, spass = false) => page.evaluate(async (n, typ, spass) => {
  const K = await import('./js/kern.js');
  const ku = JSON.parse(document.getElementById('karten').textContent).filter(K.istKuerzel), c = ku.find(x => x.n === n);
  let w = null;
  for (let i = 0; i < 80; i++) {
    w = typ === 'langform' ? K.langformOptionen(ku, c) : typ === 'erklaerung' ? K.kuerzelOptionen(ku, c) : null;
    if (!spass || w.optionen.includes(c.j)) break;
  }
  const S = JSON.parse(localStorage.getItem('spp.spiel'));
  S.lauf.frage = { id: c.i, typ, nachgeholt: false, auftritt: false, blut: false, optionen: w && w.optionen, ok: w ? w.ok : null, beantwortet: false };
  localStorage.setItem('spp.spiel', JSON.stringify(S));
  return c;
}, n, typ, spass);
const karteVon = (page, id) => page.evaluate(i => JSON.parse(document.getElementById('karten').textContent).find(c => c.i === i), id);
/* Einen Bosskampf komplett richtig spielen, bis ein großer Bildschirm erscheint */
async function bossRichtig(page){
  for (let i = 0; i < 40; i++) {
    const S = await spiel(page);
    if (!S.lauf) return S;
    if (S.lauf.frage.beantwortet) await weiter(page); else await antworte(page, true);
  }
  throw new Error('Bosskampf endet nicht');
}
/* Einen Gang komplett richtig spielen, bis das Lagerfeuer erscheint */
async function gangRichtig(page){
  for (let i = 0; i < 30; i++) {
    const S = await spiel(page);
    if (!S.lauf) return S;
    if (S.lauf.frage.beantwortet) await weiter(page);
    else await antworte(page, true);
  }
  throw new Error('Gang endet nicht');
}

try {
  /* ---------- Handy ---------- */
  /* Standardprofil (frisch von puppeteer), denn im Inkognito-Fenster ist nichts installierbar */
  const ctx = browser.defaultBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  const errs = watch(page, 'Handy');
  /* Alles muss vom eigenen Server kommen, auch in der Werkstatt (keine Google-Schriften) */
  const fremd = [];
  page.on('request', r => { const u = r.url(); if (!u.startsWith(BASE) && !u.startsWith('data:') && !u.startsWith('blob:')) fremd.push(u); });
  await page.goto(BASE, { waitUntil: 'networkidle0' });

  await ansicht(page, 'titel');
  check('Titel beim ersten Start mit Regeln und Spuk', await page.$eval('.logo', e => e.textContent.includes('prügler')) && await page.$('.titel .regeln') !== null && await page.$('.bg .spuk canvas') !== null && await page.$('.tor-schrift .kritzel') !== null);
  /* Augen: über einige Sekunden messen, wo sie auftauchen, und ins Titelbild (1600 × 900) zurückrechnen */
  const augenOrte = [];
  for (let i = 0; i < 16; i++) {
    augenOrte.push(...await page.evaluate(() => {
      const eb = document.querySelector('.tor-ebene').getBoundingClientRect();
      return [...document.querySelectorAll('.auge')].map(a => { const r = a.getBoundingClientRect(); return [((r.left + r.width / 2) - eb.left) / eb.width * 1600, ((r.top + r.height / 2) - eb.top) / eb.height * 900]; });
    }));
    await sleep(400);
  }
  const ausserhalb = augenOrte.filter(([x, y]) => !(x >= 765 && x <= 841 && y >= 183 && y <= 313));
  check('Augen erscheinen nur in der Toröffnung', augenOrte.length > 0 && !ausserhalb.length, augenOrte.length + ' Messungen' + (ausserhalb.length ? ', außerhalb: ' + ausserhalb.map(p => p.map(Math.round).join('/')).join(' ') : ''));
  await foto(page, '01-titel');

  await durchTitel(page);
  await ansicht(page, 'hub');
  check('Nach dem Titel ist der Spuk weg', await page.$('.bg .spuk') === null);
  const kacheln = await page.$$eval('.kacheln .kachel', k => k.length);
  const zu = await page.$$eval('.kacheln .kachel.zu', k => k.map(e => e.querySelector('.kachel-name').textContent.replace(/\u00AD/g, '')));
  check('Lagerfeuer: sechs Kreise, Katakomben offen, Zwischenprüfer, Berg und Ausschuss noch zu', kacheln === 10 && zu.join() === 'Der Zwischenprüfer,Der Läuterungsberg,Der Prüfungsausschuss' && await page.$('a.kachel.katakomben-kachel[href="#/kreis/13"]') !== null, `${kacheln} Kacheln, zu: ${zu.join(', ')}`);
  await sleep(1000);
  await foto(page, '02-lagerfeuer', true);

  await klick(page, 'a.kachel[href="#/kreis/1"]');
  await ansicht(page, 'kreis-seite');
  check('Kreis zeigt Zitat und Nebeltor-Ziel', await page.$eval('.tor-zu', e => e.textContent.includes('3 Lagerfeuern')));
  await sleep(1000);
  await foto(page, '03-kreis');

  await klick(page, '#gang');
  await ansicht(page, 'kampf');
  const s0 = await spiel(page);
  check('Gang hat 10 Karten aus LF1', s0.lauf.plan.length === 10 && s0.lauf.plan.every(i => i.startsWith('1-')), s0.lauf.plan.length + ' Karten');
  await foto(page, '04-frage');
  await antworte(page, true);
  const s1 = await spiel(page);
  check('Treffer bringt Seelen', s1.seelen > 0 && s1.lauf.richtig === 1, `${s1.seelen} Seelen`);
  await sleep(500);
  await foto(page, '05-treffer');

  /* Weiterspielen nach dem Neuladen: dieselbe Karte, kein Würfeln */
  await weiter(page);
  const vorNeu = (await spiel(page)).lauf.frage;
  await page.reload({ waitUntil: 'networkidle0' });
  await ansicht(page, 'titel');
  check('Titel kommt bei jedem Start, mitten im Gang mit „Weiterkämpfen“', await page.$eval('#los', e => e.textContent.startsWith('Weiterkämpfen')) && await page.$('.titel .regeln') === null);
  await sleep(2600);
  await foto(page, '01b-titel-wiederkehr');
  await durchTitel(page);
  await ansicht(page, 'kampf');
  const nachNeu = (await spiel(page)).lauf.frage;
  check('Nach dem Neuladen geht es mit derselben Frage weiter', vorNeu.id === nachNeu.id && vorNeu.typ === nachNeu.typ);

  const s2 = await gangRichtig(page);
  await ansicht(page, 'feuer-gross');
  check('Gang endet am Lagerfeuer, Feuer 1 von 3', s2.zeige && s2.zeige.art === 'feuer' && s2.kreise[1].feuer === 1);
  await sleep(2400);
  await foto(page, '06-lagerfeuer-entzuendet');
  await klick(page, '#weiter');
  await ansicht(page, 'kreis-seite');

  /* Tod: nur falsch antworten, Kaffee einmal trinken */
  await klick(page, '#gang');
  await ansicht(page, 'kampf');
  const seelenVorTod = (await spiel(page)).seelen;
  await antworte(page, false);
  const nachFehler = await spiel(page);
  check('Fehler kostet Leben und die Karte kommt wieder', nachFehler.lauf.leben === 80 && nachFehler.lauf.plan.length === 11, `Leben ${nachFehler.lauf.leben}`);
  await sleep(400);
  await foto(page, '07-daneben');
  await klick(page, '#flakon');
  await warte(page, () => JSON.parse(localStorage.getItem('spp.spiel')).lauf.flakons === 2);
  check('Kaffee heilt bis zum Maximum', (await spiel(page)).lauf.leben === 100);
  for (let i = 0; i < 20; i++) {
    const S = await spiel(page);
    if (!S.lauf || S.lauf.leben <= 0) break;
    if (S.lauf.frage.beantwortet) await weiter(page); else await antworte(page, false);
  }
  await ansicht(page, 'tod');
  const tot = await spiel(page);
  check('Tod: Seelen liegen als Blutfleck bei der Karte', tot.seelen === 0 && tot.blut && tot.blut.seelen === seelenVorTod && tot.blut.id === tot.zeige.id && tot.tode === 1, JSON.stringify(tot.blut));
  check('Todesbildschirm nennt den Begriff', await page.$eval('.tod-begriff', (e, n) => e.textContent === n, await begriffVon(page, tot.blut.id)));
  await sleep(2600);
  await foto(page, '08-tod');
  await klick(page, '#weiter');
  await ansicht(page, 'hub');
  check('Lagerfeuer zeigt, wo die Seelen liegen', await page.$eval('.blut-hinweis', e => e.textContent.includes('Erster Kreis')));

  /* Blutfleck holen */
  await klick(page, 'a.kachel[href="#/kreis/1"]');
  await ansicht(page, 'kreis-seite');
  await klick(page, '#gang');
  await ansicht(page, 'kampf');
  const sb = await spiel(page);
  check('Blutfleck-Karte kommt als Erstes', sb.lauf.frage.id === sb.blut.id && sb.lauf.frage.blut && await page.$('.karte .blut-hinweis') !== null);
  await antworte(page, true);
  const zurueck = await spiel(page);
  check('Richtig beantwortet: Seelen zurück', zurueck.blut === null && zurueck.seelen >= seelenVorTod + 10, `${zurueck.seelen} Seelen`);

  /* Eintippen mit Tippfehler: Frage auf Tippen stellen und neu laden */
  await weiter(page);
  const lang = await page.evaluate(() => JSON.parse(document.getElementById('karten').textContent).find(c => c.l === 1 && c.n.replace(/\s*\(.*?\)\s*/g, '').length >= 8 && c.n.length <= 20).i);
  await setze(page, 'S.lauf.frage = { id: a, typ: "tippen", optionen: null, beantwortet: false, nachgeholt: false, blut: false };', lang);
  await neuLaden(page);
  await ansicht(page, 'kampf');
  await antworte(page, true, true);
  check('Tippfehler zählt als Treffer', await page.$eval('.urteil', e => e.classList.contains('knapp')));
  await sleep(400);
  await foto(page, '09-tippen');

  /* Rückzug */
  await klick(page, '#rueckzug');
  await klick(page, '#rz-ja');
  await ansicht(page, 'kreis-seite');
  check('Rückzug führt zurück in den Kreis, Seelen bleiben', (await spiel(page)).lauf === null && (await spiel(page)).seelen > 0);

  /* Nebeltor und Boss */
  await setze(page, 'S.kreise[1].feuer = 3;');
  await neuLaden(page);
  await ansicht(page, 'kreis-seite');
  await klick(page, '#tor');
  await ansicht(page, 'nebel');
  await sleep(600);
  await foto(page, '10-nebeltor');
  await klick(page, '#weiter');
  await ansicht(page, 'ist-boss');
  await foto(page, '11-boss');
  const vorBoss = await spiel(page);
  for (let i = 0; i < 12; i++) {
    const S = await spiel(page);
    if (!S.lauf) break;
    if (S.lauf.frage.beantwortet) await weiter(page); else await antworte(page, true);
  }
  await ansicht(page, 'sieg');
  const sieg = await spiel(page);
  check('Boss fällt nach fünf Treffern, Splitter und Seelen', sieg.kreise[1].boss && sieg.flakons === 4 && sieg.seelen >= vorBoss.seelen + 150, `Flakons ${sieg.flakons}`);
  await sleep(2400);
  await foto(page, '12-sieg');
  await klick(page, '#weiter');
  await ansicht(page, 'kreis-seite');

  /* Zwischenprüfer: erst zu, dann gefrorener Kaffee, drei Gesichter, danach der Durchgang */
  await page.goto(BASE + '#/kokytos', { waitUntil: 'networkidle0' });
  await ansicht(page, 'arena-kokytos');
  const vor = await page.$$eval('.voraus li', l => l.map(e => e.className));
  check('Kokytos zeigt, welche Bosse noch fehlen', vor.length === 6 && vor.filter(c => c === 'erfuellt').length === 1 && await page.$('#tor') === null, vor.join());
  await setze(page, 'for (const n of [2, 3, 4, 5, 6]) S.kreise[n] = { feuer: 3, boss: true };');
  await neuLaden(page);
  await ansicht(page, 'arena-kokytos');
  await sleep(900);
  await foto(page, '13-kokytos');
  await klick(page, '#tor');
  await ansicht(page, 'tor-kokytos');
  await klick(page, '#weiter');
  await ansicht(page, 'ist-boss');
  const k0 = await spiel(page);
  check('Im Eis ist der Kaffee gefroren', k0.lauf.flakons === 0 && await page.$eval('#flakon', b => b.disabled && b.classList.contains('gefroren')) && await page.$('.auftritt') !== null);
  await foto(page, '14-zwischenpruefer');
  for (let i = 0; i < 3; i++) { await antworte(page, true); if (i < 2) await weiter(page); }
  const k1 = await spiel(page);
  check('Nach drei Treffern fällt das erste Gesicht und ein Flakon taut auf', k1.lauf.phase === 1 && k1.lauf.flakons === 1, `Phase ${k1.lauf.phase}, Flakons ${k1.lauf.flakons}`);
  await weiter(page);
  check('Das nächste Gesicht tritt auf', await page.$eval('.boss-name', e => e.textContent.startsWith('Das bleiche Gesicht')) && await page.$('.auftritt') !== null);
  await bossRichtig(page);
  await ansicht(page, 'sieg');
  const k2 = await spiel(page);
  check('Zwischenprüfer besiegt: Aufstieg offen, 300 Seelen, Splitter', k2.arenen.kokytos.boss && k2.aufstieg && k2.flakons === 5 && k2.zeige.durchgang, `Flakons ${k2.flakons}`);
  await klick(page, '#weiter');
  await ansicht(page, 'durchgang');
  await sleep(1200);
  await foto(page, '15-durchgang');
  await klick(page, '#weiter');
  await ansicht(page, 'hub');
  const bergK = await page.$$eval('.kachel.berg-kachel', k => k.length);
  check('Am Lagerfeuer stehen jetzt die sechs Gesimse', bergK === 6, bergK + ' Gesimse');
  await sleep(1200);
  await foto(page, '16-lagerfeuer-berg', true);

  /* Ein Gang am Berg: AP2-Karten, mehr Schaden */
  await klick(page, 'a.kachel[href="#/kreis/7"]');
  await ansicht(page, 'am-berg');
  await sleep(1000);
  await foto(page, '17-gesims');
  await klick(page, '#gang');
  await ansicht(page, 'kampf');
  const g0 = await spiel(page);
  check('Gang am Berg: Karten aus AP2 und eine Mimic-Truhe', g0.lauf.plan.filter(i => i !== '?').every(i => i.startsWith('ap2-1-')) && g0.lauf.plan.filter(i => i === '?').length === 1, g0.lauf.plan.slice(0, 2).join());
  await antworte(page, false);
  check('Am Berg kostet ein Fehler 25 Leben', (await spiel(page)).lauf.leben === 75, 'Leben ' + (await spiel(page)).lauf.leben);
  await sleep(400);
  await foto(page, '18-gesims-kampf');
  await klick(page, '#rueckzug');
  await klick(page, '#rz-ja');
  await ansicht(page, 'am-berg');

  /* Der Prüfungsausschuss: Uhr, kein Kaffee, durchfallen, dann bestehen und Neues Spiel+ */
  await setze(page, 'for (const n of [7, 8, 9, 10, 11, 12]) S.kreise[n] = { feuer: 3, boss: true };');
  await page.goto(BASE + '#/gipfel', { waitUntil: 'networkidle0' });
  await neuLaden(page);
  await ansicht(page, 'arena-gipfel');
  await sleep(900);
  await foto(page, '19-gipfel');
  await klick(page, '#tor');
  await ansicht(page, 'tor-gipfel');
  await klick(page, '#weiter');
  await ansicht(page, 'ist-boss');
  check('Prüfungsraum: Uhr läuft, kein Kaffee', await page.$('#uhr') !== null && await page.$eval('#flakon', b => b.disabled && b.classList.contains('verboten')));
  await sleep(1500);
  await foto(page, '20-ausschuss');
  await antworte(page, true);
  await weiter(page);
  const lebenVorUhr = (await spiel(page)).lauf.leben;
  await setze(page, 'S.lauf.frage.bis = Date.now() - 1000;');
  await neuLaden(page);
  await warte(page, () => JSON.parse(localStorage.getItem('spp.spiel')).lauf.frage.beantwortet);
  const u = await spiel(page);
  check('Abgelaufene Uhr zählt als Fehler, auch nach dem Neuladen', u.lauf.frage.zeit && u.lauf.leben === lebenVorUhr - 40, `Leben ${u.lauf.leben}`);
  for (let i = 0; i < 20; i++) {
    const S = await spiel(page);
    if (!S.lauf || S.lauf.leben <= 0) break;
    if (S.lauf.frage.beantwortet) await weiter(page); else await antworte(page, false);
  }
  await ansicht(page, 'durchgefallen');
  const df = await spiel(page);
  check('Durchgefallen: Blutfleck liegt im Prüfungsraum', df.blut && df.blut.ort === 'gipfel' && df.arenen.gipfel.versuche === 1);
  await sleep(2600);
  await foto(page, '21-durchgefallen');
  await klick(page, '#weiter');
  await page.goto(BASE + '#/gipfel', { waitUntil: 'networkidle0' });
  await ansicht(page, 'arena-gipfel');
  await klick(page, '#tor');
  await klick(page, '#weiter');
  await ansicht(page, 'ist-boss');
  const zweiter = await spiel(page);
  check('Zweiter Versuch beginnt mit der Blutfleck-Karte', zweiter.lauf.frage.id === df.blut.id);
  await bossRichtig(page);
  await ansicht(page, 'abspann');
  const best = await spiel(page);
  check('Bestanden: Ausschuss besiegt, Abspann läuft', best.arenen.gipfel.boss && best.bestanden === 1 && best.arenen.gipfel.versuche === 2);
  await sleep(4000);
  await foto(page, '22-bestanden');
  await klick(page, '#ngplus');
  await ansicht(page, 'hub');
  const ng = await spiel(page);
  check('Neues Spiel+: Bosse stehen wieder, Lagerfeuer und Aufstieg bleiben', ng.ng === 1 && !ng.kreise[1].boss && ng.kreise[1].feuer === 3 && !ng.arenen.gipfel.boss && ng.aufstieg);

  /* Stufe aufsteigen */
  await setze(page, 'S.seelen = 1000;');
  await page.goto(BASE + '#/', { waitUntil: 'networkidle0' });
  await neuLaden(page);
  await ansicht(page, 'hub');
  await klick(page, '#aufstieg');
  await warte(page, () => JSON.parse(localStorage.getItem('spp.spiel')).stufe === 2);
  check('Stufe kostet 60 Seelen und gibt 5 Leben', (await spiel(page)).seelen === 940 && await page.$eval('.werte div:nth-child(3) b', e => e.textContent === '105'));
  await sleep(1000);
  await foto(page, '23-lagerfeuer-ngplus', true);

  /* Katakomben der Kürzel: Gang mit Kürzeln, Spaß-Langform, rotes Phantom, Gebeinhaus, der Akronymant */
  await klick(page, 'a.kachel[href="#/kreis/13"]');
  await ansicht(page, 'in-katakomben');
  check('Katakomben: Seite mit Gang und Gebeinhaus', await page.$('#gang') !== null && await page.$eval('#gebeinhaus', e => e.textContent.includes('304 Kürzeln')));
  await sleep(1000);
  await foto(page, '24-katakomben');
  await klick(page, '#gang');
  await ansicht(page, 'kampf');
  const kk = await spiel(page);
  check('Gang in den Katakomben: zehn Kürzel, eigene Antworten', kk.lauf.plan.length === 10 && kk.lauf.plan.every(i => i.startsWith('k-')) && (kk.lauf.frage.typ === 'tippen' || kk.lauf.frage.optionen.length === 4), kk.lauf.plan.slice(0, 3).join() + ' ' + kk.lauf.frage.typ);
  await kuerzelFrage(page, 'DNS', 'langform');
  await neuLaden(page);
  await ansicht(page, 'kampf');
  check('Wofür steht DNS: vier Langformen, die echte dabei', await page.$eval('.frage.kuerzel-gross', e => e.textContent === 'DNS') && (await page.$$eval('.option', o => o.map(e => e.textContent))).filter(t => t === 'Domain Name System').length === 1);
  await foto(page, '25-kuerzel-frage');
  await antworte(page, true);
  check('Treffer zeigt die Langform mit den Buchstaben des Kürzels', await page.$$eval('.loesung mark', m => m.map(e => e.textContent).join('')) === 'DNS');
  await sleep(400);
  await foto(page, '26-kuerzel-treffer');
  await weiter(page);
  const vorSpass = (await spiel(page)).lauf.leben;
  const poe = await kuerzelFrage(page, 'PoE', 'langform', true);
  await neuLaden(page);
  await ansicht(page, 'kampf');
  const sp = (await spiel(page)).lauf.frage;
  await klick(page, `.option[data-n="${sp.optionen.indexOf(poe.j)}"]`);
  await warte(page, () => JSON.parse(localStorage.getItem('spp.spiel')).lauf.frage.beantwortet);
  check('Spaß-Langform gewählt: Schaden und „Schön wär’s.“', (await spiel(page)).lauf.leben < vorSpass && await page.$eval('.spruch', e => e.textContent === 'Schön wär’s.'), poe.j);
  await sleep(400);
  await foto(page, '27-power-over-espresso');
  await weiter(page);
  const vorPhantom = (await spiel(page)).seelen;
  await kuerzelFrage(page, 'CoAP', 'tippen');
  await neuLaden(page);
  await ansicht(page, 'kampf');
  check('Legendäres Kürzel dringt als rotes Phantom ein', await page.$('.karte.phantom-karte .phantom') !== null && await page.$eval('.rang', e => e.textContent === 'Legendär'));
  await sleep(700);
  await foto(page, '28-rotes-phantom');
  await antworte(page, true);
  const ph = await spiel(page);
  check('Phantom vertrieben: mehr Seelen als sonst', ph.seelen - vorPhantom === Math.round(10 * 1.5 * 1.6) && await page.$eval('.seelen-zeile', e => e.textContent.includes('Rotes Phantom vertrieben')), `+${ph.seelen - vorPhantom}`);
  await klick(page, '#rueckzug');
  await klick(page, '#rz-ja');
  await ansicht(page, 'in-katakomben');

  /* Gebeinhaus: gefundene Kürzel, Kategorien, Suche, Nische öffnen */
  await klick(page, '#gebeinhaus');
  await ansicht(page, 'gebeinhaus');
  const nischen = await page.$$eval('.nische', n => n.length), gefunden = await page.$$eval('.nische:not(.leer)', n => n.map(e => e.dataset.i));
  check('Gebeinhaus: 304 Nischen, DNS und CoAP gefunden, PoE nicht', nischen === 304 && gefunden.includes('k-dns') && gefunden.includes('k-coap') && !gefunden.includes('k-poe'), `${nischen} Nischen, gefunden: ${gefunden.join(', ')}`);
  await sleep(1000);
  await foto(page, '29-gebeinhaus');
  await klick(page, '.chip[data-t="Netzwerk"]');
  check('Kategorie Netzwerk zeigt 58 Nischen', await page.$$eval('.nische', n => n.length) === 58);
  await page.$eval('#gb-suche', e => { e.value = 'coap'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await klick(page, '.nische[data-i="k-coap"]');
  await page.waitForSelector('#nische-blatt:not([hidden])');
  check('Nische zeigt Langform und Erklärung', await page.$eval('#nische-blatt', e => e.textContent.includes('Constrained Application Protocol') && e.textContent.includes('1× richtig')));
  await sleep(500);
  await foto(page, '30-nische');
  await klick(page, '#nb-zu');

  /* Der Akronymant: drei Beschwörungen, die zweite nur legendär, die dritte nur tippen */
  await setze(page, 'S.kreise[13].feuer = 3;');
  await page.goto(BASE + '#/kreis/13', { waitUntil: 'networkidle0' });
  await neuLaden(page);
  await ansicht(page, 'in-katakomben');
  await klick(page, '#tor');
  await ansicht(page, 'nebel');
  check('Nebeltor nennt die Regeln des Akronymanten', await page.$eval('.regeln', e => e.textContent.includes('zehn Treffer')));
  await sleep(600);
  await foto(page, '31-akronymant-tor');
  await klick(page, '#weiter');
  await ansicht(page, 'ist-boss');
  await foto(page, '32-akronymant');
  for (let i = 0; i < 4; i++) { await antworte(page, true); await weiter(page); }
  const b1 = await spiel(page);
  check('Zweite Beschwörung: nur legendäre Kürzel', b1.lauf.phase === 1 && (await karteVon(page, b1.lauf.frage.id)).r === 3, `Phase ${b1.lauf.phase}`);
  for (let i = 0; i < 3; i++) { await antworte(page, true); await weiter(page); }
  const b2 = await spiel(page);
  check('Dritte Beschwörung: Kürzel eintippen', b2.lauf.phase === 2 && b2.lauf.frage.typ === 'tippen' && await page.$eval('.frage.langform-gross', e => e.textContent.length > 3), `Phase ${b2.lauf.phase}, ${b2.lauf.frage.typ}`);
  await foto(page, '33-akronymant-rueckwaerts');
  await bossRichtig(page);
  await ansicht(page, 'sieg');
  const ak = await spiel(page);
  check('Akronymant besiegt: Titel und stärkerer Kaffee', ak.kreise[13].boss && ak.zeige.belohnung === 'roestung' && await page.$eval('.gold-text', e => e.textContent === 'Entzifferer der Kürzel'));
  await sleep(2400);
  await foto(page, '34-akronymant-sieg');
  await klick(page, '#weiter');
  await ansicht(page, 'in-katakomben');
  await page.goto(BASE + '#/', { waitUntil: 'networkidle0' });
  await ansicht(page, 'hub');
  check('Lagerfeuer führt den Titel des Akronymanten', await page.$eval('.titel-liste', e => e.textContent.includes('Entzifferer der Kürzel')));

  /* Rätsel im Dritten Kreis (Neues Spiel+ läuft: Seelen ×1,5, Schaden ×1,25) */
  await klick(page, 'a.kachel[href="#/kreis/3"]');
  await ansicht(page, 'kreis-seite');
  check('Dritter Kreis nennt seine Rätsel', await page.$eval('.raetsel-hinweis', e => e.textContent.includes('Rechengegner') && e.textContent.includes('Restore')) && await page.$eval('#gang small', e => e.textContent.includes('2 Rätsel')));
  await klick(page, '#gang');
  await ansicht(page, 'kampf');
  const rp = (await spiel(page)).lauf.plan;
  check('Gang im Dritten Kreis: zehn Karten und zwei Rätsel dazwischen', rp.length === 12 && rp.filter(x => x === '?').length === 2 && rp[0] !== '?', rp.join(' '));
  await raetselStellen(page, 'ipv4Netz');
  await neuLaden(page);
  await ansicht(page, 'kampf');
  await page.$eval('#feld-0', e => { e.value = 'zehn punkt null'; });
  await page.$eval('#felder button[type=submit]', b => b.click());
  check('Rechengegner: ungültige Adresse zählt nicht, sondern wird erklärt', await page.$eval('#feld-meldung', e => e.textContent.includes('IPv4')) && !(await spiel(page)).lauf.frage.beantwortet);
  await foto(page, '35-rechengegner');
  const vorRechnen = (await spiel(page)).seelen;
  await antworte(page, true);
  check('Rechengegner gelöst: 30 Seelen', (await spiel(page)).seelen - vorRechnen === 30 && await page.$eval('.urteil-wort', e => e.textContent === 'Gelöst'), `+${(await spiel(page)).seelen - vorRechnen}`);
  await sleep(400);
  await foto(page, '36-rechengegner-geloest');
  await weiter(page);
  await raetselStellen(page, 'botschaftIpv4');
  await neuLaden(page);
  await ansicht(page, 'kampf');
  await sleep(700);
  await foto(page, '37-botschaft');
  const vorBotschaft = (await spiel(page)).lauf.leben;
  await antworte(page, false);
  check('Botschaft: falsche Zeile kostet 25 Leben, die lügende wird gezeigt', (await spiel(page)).lauf.leben === vorBotschaft - 25 && await page.$('.zeile-knopf.luegt') !== null && await page.$('.zeile-knopf.daneben') !== null);
  await sleep(400);
  await foto(page, '38-botschaft-daneben');
  await klick(page, '#flakon');
  await warte(page, () => JSON.parse(localStorage.getItem('spp.spiel')).lauf.flakons === 4);
  await weiter(page);
  await raetselStellen(page, 'mimic');
  await neuLaden(page);
  await ansicht(page, 'kampf');
  await klick(page, '#schalter-a');
  await klick(page, '#schalter-b');
  const proben = (await spiel(page)).lauf.frage.proben;
  check('Mimic-Truhe: Hebel verraten die Wahrheitstabelle Zeile für Zeile', Object.keys(proben).sort().join() === '00,10,11' && (await page.$$eval('.proben td:last-child', t => t.map(e => e.textContent))).filter(x => x === '?').length === 1, JSON.stringify(proben));
  await sleep(600);
  await foto(page, '39-mimic');
  await antworte(page, true);
  check('Mimic-Truhe geöffnet: ein Kaffeeflakon für diesen Lauf', (await spiel(page)).lauf.flakons === 5 && await page.$('.truhe.offen') !== null && await page.$eval('.seelen-zeile', e => e.textContent.includes('Kaffeeflakon')));
  await sleep(600);
  await foto(page, '40-mimic-offen');
  await weiter(page);
  await raetselStellen(page, 'restore');
  await neuLaden(page);
  await ansicht(page, 'kampf');
  await sleep(700);
  await foto(page, '41-restore');
  await antworte(page, true);
  check('Restore in der richtigen Reihenfolge zurückgespielt', (await spiel(page)).lauf.frage.gut === true && await page.$$eval('.medium.soll', m => m.length) >= 1);
  await sleep(400);
  await foto(page, '42-restore-geloest');

  /* Tod durch die Truhe: der Blutfleck ist das Rätsel selbst und wartet im nächsten Gang zuerst */
  await weiter(page);
  const truhe = await raetselStellen(page, 'mimic');
  await setze(page, 'S.lauf.leben = 10;');
  const seelenVorBiss = (await spiel(page)).seelen;
  await neuLaden(page);
  await ansicht(page, 'kampf');
  await antworte(page, false);
  await ansicht(page, 'tod');
  const biss = await spiel(page);
  check('Tod durch die Mimic-Truhe: Blutfleck ist das Rätsel', biss.blut && biss.blut.raetsel && biss.blut.raetsel.gatter === truhe.gatter && biss.blut.seelen === seelenVorBiss && await page.$eval('.tod-begriff', e => e.textContent === 'Mimic-Truhe'));
  await sleep(2600);
  await foto(page, '43-tod-durch-truhe');
  await klick(page, '#weiter');
  await ansicht(page, 'hub');
  await klick(page, 'a.kachel[href="#/kreis/3"]');
  await ansicht(page, 'kreis-seite');
  check('Kreis sagt, dass das Rätsel zuerst wartet', await page.$eval('.blut-hinweis', e => e.textContent.includes('Rätsel')));
  await klick(page, '#gang');
  await ansicht(page, 'kampf');
  const bf = await spiel(page);
  check('Nächster Gang beginnt mit derselben Truhe', bf.lauf.plan[0] === '?blut' && bf.lauf.frage.blut && bf.lauf.frage.raetsel.gatter === truhe.gatter);
  await antworte(page, true);
  check('Truhe gelöst: Seelen zurück', (await spiel(page)).blut === null && (await spiel(page)).seelen >= seelenVorBiss);
  await klick(page, '#rueckzug');
  await klick(page, '#rz-ja');
  await ansicht(page, 'kreis-seite');

  /* Der Broadcast-Sturm wirft einmal im Kampf ein Rätsel */
  await klick(page, '#tor');
  await ansicht(page, 'nebel');
  await klick(page, '#weiter');
  await ansicht(page, 'ist-boss');
  let bossRaetsel = null;
  for (let i = 0; i < 20; i++) {
    const S = await spiel(page);
    if (!S.lauf) break;
    if (S.lauf.frage.raetsel && !bossRaetsel) { bossRaetsel = S.lauf.frage; await sleep(500); await foto(page, '44-boss-raetsel'); }
    if (S.lauf.frage.beantwortet) await weiter(page); else await antworte(page, true);
  }
  await ansicht(page, 'sieg');
  check('Broadcast-Sturm: ein Rätsel im Kampf, dann besiegt', bossRaetsel && bossRaetsel.bossName === 'Der Broadcast-Sturm' && (await spiel(page)).kreise[3].boss, bossRaetsel ? bossRaetsel.raetsel.art : 'kein Rätsel');
  await klick(page, '#weiter');
  await ansicht(page, 'kreis-seite');
  await page.goto(BASE + '#/', { waitUntil: 'networkidle0' });
  await ansicht(page, 'hub');

  /* Werkstatt: vom Lagerfeuer erreichbar, Sprung aus einem falschen Rätsel, Rückweg ohne Titel */
  check('Lagerfeuer zeigt die drei Werkzeuge der Werkstatt', (await page.$$eval('.werkstatt-liste a', a => a.map(e => e.getAttribute('href')))).join() === 'werkstatt/klappuhr.html,werkstatt/rechenwerk.html,werkstatt/zahlenwerk.html');
  await klick(page, 'a.kachel[href="#/kreis/3"]');
  await ansicht(page, 'kreis-seite');
  await klick(page, '#gang');
  await ansicht(page, 'kampf');
  const sprung = await raetselStellen(page, 'ipv4Netz');
  await neuLaden(page);
  await ansicht(page, 'kampf');
  await antworte(page, false);
  const ziel = await page.$eval('.werkstatt-sprung', a => a.getAttribute('href'));
  check('Falsches Rätsel bietet die Werkstatt an, auf genau diese Aufgabe gestellt', ziel === 'werkstatt/' + sprung.werkstatt && ziel.includes('tab=clock'), ziel);
  await sleep(400);
  await foto(page, '45-werkstatt-sprung');
  const vorWerkstatt = (await spiel(page)).lauf.frage;
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.$eval('.werkstatt-sprung', a => a.click())]);
  await page.waitForSelector('#werkstatt-zurueck');
  const ip = new URLSearchParams(sprung.werkstatt.split('#')[1]).get('ip');
  await warte(page, v => document.getElementById('ipIn') && document.getElementById('ipIn').value === v, ip);
  check('Klappuhr steht auf der Adresse aus dem Rätsel, der Weg zurück führt in den Kampf', await page.$eval('#werkstatt-zurueck', e => e.textContent === 'Zurück zum Kampf') && await page.$eval('#pfx', e => e.value) === new URLSearchParams(sprung.werkstatt.split('#')[1]).get('p'), ip);
  await sleep(600);
  await foto(page, '46-werkstatt-klappuhr');
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.$eval('#werkstatt-zurueck', a => a.click())]);
  await ansicht(page, 'kampf');
  const nachWerkstatt = await spiel(page);
  check('Zurück aus der Werkstatt: ohne Titel in denselben Kampf', nachWerkstatt.lauf.frage.beantwortet && JSON.stringify(nachWerkstatt.lauf.frage.raetsel) === JSON.stringify(vorWerkstatt.raetsel) && await page.evaluate(() => !location.search));
  await klick(page, '#rueckzug');
  await klick(page, '#rz-ja');
  await ansicht(page, 'kreis-seite');
  const breiten = [];
  for (const seite of ['klappuhr.html#tab=v6&plan=2001%3Adb8%3Aabcd%3A%3A%2F48&n=60', 'rechenwerk.html#gatter', 'zahlenwerk.html']) {
    await page.goto(BASE + 'werkstatt/' + seite, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#werkstatt-zurueck');
    await sleep(300);
    breiten.push(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
    if (seite.startsWith('rechenwerk')) { await sleep(400); await foto(page, '47-werkstatt-rechenwerk'); }
  }
  check('Werkstatt passt aufs Handy, nichts ragt seitlich heraus', breiten.every(b => b <= 0), breiten.join(', '));
  check('Werkstatt lädt nichts aus dem Netz', fremd.length === 0, fremd.slice(0, 3).join(' '));
  await page.goto(BASE + '#/', { waitUntil: 'networkidle0' });
  await durchTitel(page);
  await ansicht(page, 'hub');

  /* App: Manifest, installierbar, Service Worker, ohne Netz */
  const cdp = await page.createCDPSession();
  const man = await cdp.send('Page.getAppManifest');
  check('Manifest ohne Fehler', man.errors.length === 0, man.errors.map(e => e.message).join('; '));
  await page.evaluate(() => navigator.serviceWorker.ready);
  const inst = await cdp.send('Page.getInstallabilityErrors');
  check('Chrome hält die App für installierbar', inst.installabilityErrors.length === 0, inst.installabilityErrors.map(e => e.errorId).join(', '));
  await page.reload({ waitUntil: 'networkidle0' });
  await durchTitel(page);
  check('Service Worker übernimmt nach dem Neuladen', await page.evaluate(() => !!navigator.serviceWorker.controller));
  await page.setOfflineMode(true);
  for (const t of ctx.targets()) if (t.type() === 'service_worker') { const s = await t.createCDPSession(); await s.send('Network.enable'); await s.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); }
  await neuLaden(page, 'load');
  await ansicht(page, 'hub');
  const bilderOffline = await page.evaluate(async () => (await Promise.all([...document.querySelectorAll('.kachel')].map(k => fetch(getComputedStyle(k).backgroundImage.match(/url\("([^"]+)"\)/)[1]).then(r => r.ok, () => false)))).every(Boolean));
  check('Startet ohne Netz, Bilder inklusive', bilderOffline);
  await page.goto(BASE + 'werkstatt/rechenwerk.html', { waitUntil: 'load' });
  check('Werkstatt ohne Netz', await page.$('#werkstatt-zurueck') !== null && await page.$eval('h1', e => e.textContent.includes('Rechenwerk')));
  await page.setOfflineMode(false);
  check('Handy: keine Fehler in der Konsole', errs.length === 0, errs.slice(0, 3).join(' | '));
  await page.close();

  /* ---------- Desktop ---------- */
  const dctx = await browser.createBrowserContext();
  const d = await dctx.newPage();
  await d.setViewport({ width: 1440, height: 900 });
  const derrs = watch(d, 'Desktop');
  await d.goto(BASE, { waitUntil: 'networkidle0' });
  await sleep(2600);
  await foto(d, '49-desktop-titel');
  await durchTitel(d);
  await ansicht(d, 'hub');
  await sleep(1000);
  await foto(d, '50-desktop-lagerfeuer');
  await klick(d, 'a.kachel[href="#/kreis/3"]');
  await ansicht(d, 'kreis-seite');
  await sleep(1000);
  await foto(d, '51-desktop-kreis');
  await klick(d, '#gang');
  await ansicht(d, 'kampf');
  await antworte(d, false);
  await sleep(500);
  await foto(d, '52-desktop-kampf');
  await klick(d, '#rueckzug');
  await klick(d, '#rz-ja');
  await d.goto(BASE + '#/', { waitUntil: 'networkidle0' });
  await ansicht(d, 'hub');
  await d.$eval('.spielstand', e => { e.open = true; });
  await klick(d, '#nurAp2');
  await warte(d, () => JSON.parse(localStorage.getItem('spp.spiel')).nurAp2 === true);
  const ap2Berg = await d.$$eval('.kachel.berg-kachel', k => k.length) === 6;
  await d.goto(BASE + '#/kreis/1', { waitUntil: 'networkidle0' });
  await ansicht(d, 'kreis-seite');
  const ap1Zu = await d.$('#tor') === null && await d.$('.tor-zu') !== null;
  check('Desktop: AP2-Abkürzung öffnet nur den Berg, AP1 bleibt zu', ap2Berg && ap1Zu, `Berg ${ap2Berg}, AP1 zu ${ap1Zu}`);
  await foto(d, '59-desktop-nur-ap2', true);
  await d.goto(BASE + '#/', { waitUntil: 'networkidle0' });
  await ansicht(d, 'hub');
  await d.$eval('.spielstand', e => { e.open = true; });
  await klick(d, '#nurAp2');
  await warte(d, () => JSON.parse(localStorage.getItem('spp.spiel')).nurAp2 === false);
  await klick(d, '#probe');
  await warte(d, () => JSON.parse(localStorage.getItem('spp.spiel')).probe === true);
  check('Desktop: Prototyp-Schalter öffnet den Berg', await d.$$eval('.kachel.berg-kachel', k => k.length) === 6);
  await setze(d, 'S.frieden = true; S.lauf = null; S.zeige = null;');
  await d.goto(BASE + '#/kreis/3', { waitUntil: 'networkidle0' });
  await neuLaden(d);
  await ansicht(d, 'kreis-seite');
  await klick(d, '#gang');
  await ansicht(d, 'kampf');
  const hudRuhig = await d.$('.hud .ruhig-marke') !== null && await d.$('.hud .leben') === null && await d.$('#flakon') === null;
  const vorFalsch = (await spiel(d)).lauf.leben;
  await antworte(d, false);
  const sRuhig = await spiel(d);
  check('Desktop: Ruhiger Modus, falsch kostet kein Leben und kein Tod', hudRuhig && sRuhig.lauf && sRuhig.lauf.leben === vorFalsch && sRuhig.tode === 0, `Leben ${sRuhig.lauf && sRuhig.lauf.leben} von ${vorFalsch}, HUD ${hudRuhig}`);
  await foto(d, '60-desktop-ruhiger-modus');
  await setze(d, 'S.frieden = false; S.lauf = null; S.zeige = null;');
  await neuLaden(d);
  await d.goto(BASE + '#/gipfel', { waitUntil: 'networkidle0' });
  await ansicht(d, 'arena-gipfel');
  await sleep(1000);
  await foto(d, '53-desktop-gipfel');
  await d.goto(BASE + '#/kreis/13', { waitUntil: 'networkidle0' });
  await ansicht(d, 'in-katakomben');
  await sleep(1000);
  await foto(d, '54-desktop-katakomben');
  await d.goto(BASE + '#/gebeinhaus', { waitUntil: 'networkidle0' });
  await ansicht(d, 'gebeinhaus');
  await sleep(1000);
  await foto(d, '55-desktop-gebeinhaus');
  await d.goto(BASE + 'werkstatt/klappuhr.html#tab=router&ziel=10.20.3.70', { waitUntil: 'networkidle0' });
  await d.waitForSelector('#werkstatt-zurueck');
  check('Desktop: Werkstatt ohne laufenden Kampf führt zum Lagerfeuer', await d.$eval('#werkstatt-zurueck', e => e.textContent === 'Zum Lagerfeuer') && await d.$eval('#dst', e => e.value === '10.20.3.70'));
  await sleep(1200);
  await foto(d, '56-desktop-klappuhr');
  await d.goto(BASE + 'werkstatt/rechenwerk.html#gatter', { waitUntil: 'networkidle0' });
  await sleep(600);
  await foto(d, '57-desktop-rechenwerk');
  await d.goto(BASE + 'werkstatt/zahlenwerk.html', { waitUntil: 'networkidle0' });
  await sleep(600);
  await foto(d, '58-desktop-zahlenwerk');
  check('Desktop: keine Fehler in der Konsole', derrs.length === 0, derrs.slice(0, 3).join(' | '));
  await dctx.close();
} catch (e) {
  check('Test lief ohne Abbruch', false, e.stack);
} finally {
  await browser.close();
  server.close();
}

const bad = results.filter(r => !r.pass);
for (const r of results) console.log(`${r.pass ? 'OK  ' : 'FEHL'} ${r.name}${r.info ? '  (' + r.info + ')' : ''}`);
console.log(`\n${results.length - bad.length} von ${results.length} Prüfungen bestanden, Bildschirmfotos in tools/shots/`);
process.exit(bad.length ? 1 : 0);
