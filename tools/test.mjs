/* Automatischer Test der gebauten App in docs/ mit dem installierten Chrome (puppeteer-core).
   npm test                -> spielt einmal alles durch, Bildschirmfotos nach tools/shots/
   CHROME=/pfad npm test   -> falls Chrome woanders liegt
   CI=1 npm test           -> wie auf GitHub (ohne Sandbox)
   Prüft: Titel, Lagerfeuer, Gang bis zum Lagerfeuer, Tod mit Blutfleck, Seelen zurückholen, Weiterspielen nach Neuladen,
   Rückzug, Kaffee, Eintippen mit Tippfehler, Nebeltor und Boss, Stufenaufstieg, Installierbarkeit, Start ohne Netz,
   keine Fehler in der Konsole. Gewartet wird auf Zustände, nie fest. */
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
  if (f.typ === 'tippen') {
    if (richtig) {
      let wort = await begriffVon(page, f.id);
      if (tippfehler) wort = wort.slice(0, -2) + wort.slice(-1);
      await page.waitForSelector('#eingabe', { visible: true });
      await page.$eval('#eingabe', (e, w) => { e.value = w; }, wort);
      await page.$eval('#tippen button[type=submit]', b => b.click());
    } else await klick(page, '#passen');
  } else {
    const n = richtig ? f.optionen.indexOf(f.id) : f.optionen.findIndex(id => id !== f.id);
    await klick(page, `.option[data-n="${n}"]`);
  }
  await warte(page, () => { const S = JSON.parse(localStorage.getItem('spp.spiel')); return !S.lauf || S.lauf.frage.beantwortet; });
}
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
  await page.goto(BASE, { waitUntil: 'networkidle0' });

  await ansicht(page, 'titel');
  check('Titel beim ersten Start mit Regeln und Spuk', await page.$eval('.logo', e => e.textContent.includes('prügler')) && await page.$('.titel .regeln') !== null && await page.$('.bg .spuk canvas') !== null);
  await sleep(2600);
  await foto(page, '01-titel');

  await durchTitel(page);
  await ansicht(page, 'hub');
  check('Nach dem Titel ist der Spuk weg', await page.$('.bg .spuk') === null && !(await page.evaluate(() => document.body.classList.contains('flackert'))));
  const kacheln = await page.$$eval('.kacheln .kachel', k => k.length);
  const zu = await page.$$eval('.kacheln .kachel.zu', k => k.map(e => e.querySelector('.kachel-name').textContent.replace(/\u00AD/g, '')));
  check('Lagerfeuer: sechs Kreise, Zwischenprüfer, Berg und Ausschuss noch zu', kacheln === 9 && zu.join() === 'Der Zwischenprüfer,Der Läuterungsberg,Der Prüfungsausschuss', `${kacheln} Kacheln, zu: ${zu.join(', ')}`);
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
  check('Gang am Berg: Karten aus AP2', g0.lauf.plan.every(i => i.startsWith('ap2-1-')), g0.lauf.plan.slice(0, 2).join());
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
  await foto(d, '29-desktop-titel');
  await durchTitel(d);
  await ansicht(d, 'hub');
  await sleep(1000);
  await foto(d, '30-desktop-lagerfeuer');
  await klick(d, 'a.kachel[href="#/kreis/3"]');
  await ansicht(d, 'kreis-seite');
  await sleep(1000);
  await foto(d, '31-desktop-kreis');
  await klick(d, '#gang');
  await ansicht(d, 'kampf');
  await antworte(d, false);
  await sleep(500);
  await foto(d, '32-desktop-kampf');
  await klick(d, '#rueckzug');
  await klick(d, '#rz-ja');
  await d.goto(BASE + '#/', { waitUntil: 'networkidle0' });
  await ansicht(d, 'hub');
  await d.$eval('.spielstand', e => { e.open = true; });
  await klick(d, '#probe');
  await warte(d, () => JSON.parse(localStorage.getItem('spp.spiel')).probe === true);
  check('Desktop: Prototyp-Schalter öffnet den Berg', await d.$$eval('.kachel.berg-kachel', k => k.length) === 6);
  await d.goto(BASE + '#/gipfel', { waitUntil: 'networkidle0' });
  await ansicht(d, 'arena-gipfel');
  await sleep(1000);
  await foto(d, '33-desktop-gipfel');
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
