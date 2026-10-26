/* Baut die App nach docs/ (nicht im Repository; der Workflow .github/workflows/pages.yml lädt docs/ zu GitHub Pages hoch).
   Aufruf: npm run build
   - setzt die Karten (data/karten-ap1.json, data/karten-ap2.json und die Kürzel aus data/kuerzel.json) in index.html ein
   - kopiert Skripte, Stil, Symbole, die benutzten Bilder, die Schriften und die Werkstatt (src/werkstatt, aus tools/werkstatt.py)
   - erzeugt den Service Worker mit Prüfsumme und Liste aller Dateien
   - bricht ab, wenn in den eigenen Texten Gedankenstriche stehen (in den Karten wird nur gezählt) */
import { readFile, writeFile, mkdir, rm, copyFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'docs');
const NM = path.join(ROOT, 'node_modules');

const read = p => readFile(p, 'utf8');
async function put(rel, data){
  const p = path.join(OUT, rel);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data);
}
async function copy(from, rel){
  const p = path.join(OUT, rel);
  await mkdir(path.dirname(p), { recursive: true });
  await copyFile(from, p);
}
async function walk(dir, base = dir){
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out.sort();
}
function noDashes(name, text){
  const hits = [...text.matchAll(/[–—]/g)];
  if (hits.length) throw new Error(`${name}: ${hits.length} Gedankenstrich(e), zum Beispiel bei Zeichen ${hits[0].index}`);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

/* Karten: AP1 (Lernfelder 1 bis 6), AP2 (Gesimse 7 bis 12) und die Kürzel der Katakomben (13) */
const karten = [];
for (const f of ['karten-ap1.json', 'karten-ap2.json', 'kuerzel.json']) karten.push(...JSON.parse(await read(path.join(ROOT, 'data', f))));
if (new Set(karten.map(c => c.i)).size !== karten.length) throw new Error('Doppelte Kartenkennung in data/');
const kartenJs = JSON.stringify(karten).replace(/</g, '\\u003c');
const mitStrich = karten.filter(c => /[–—]/.test(JSON.stringify(c))).length;

/* Seite, Skripte, Stil */
let html = await read(path.join(SRC, 'index.html'));
noDashes('src/index.html', html);
if (!html.includes('/*KARTEN*/')) throw new Error('Platzhalter /*KARTEN*/ fehlt');
await put('index.html', html.replace('/*KARTEN*/', () => kartenJs));
const css = await read(path.join(SRC, 'app.css'));
noDashes('src/app.css', css);
await put('app.css', css);
for (const f of await readdir(path.join(SRC, 'js'))) {
  const code = await read(path.join(SRC, 'js', f));
  noDashes('src/js/' + f, code);
  await put('js/' + f, code);
}
await copy(path.join(SRC, 'manifest.webmanifest'), 'manifest.webmanifest');
/* Werkstatt: Klappuhr, Rechenwerk, Zahlenwerk mit Stil und Kopfzeile; nichts davon darf aus dem Netz laden */
for (const f of await readdir(path.join(SRC, 'werkstatt'))) {
  const inhalt = await read(path.join(SRC, 'werkstatt', f));
  noDashes('src/werkstatt/' + f, inhalt);
  if (/(src|href)="https?:|url\(https?:|fonts\.googleapis/.test(inhalt)) throw new Error('src/werkstatt/' + f + ': lädt etwas aus dem Netz, offline geht das nicht');
  await put('werkstatt/' + f, inhalt);
}
for (const f of await readdir(path.join(SRC, 'icons'))) await copy(path.join(SRC, 'icons', f), 'icons/' + f);
await put('.nojekyll', '');

/* Bilder: nur die, die in welt.js vorkommen (groß und klein) */
const welt = await read(path.join(SRC, 'js', 'welt.js'));
const bilder = [...new Set([...welt.matchAll(/[bB]ild: '([a-z0-9-]+)'|_BILD = '([a-z0-9-]+)'/g)].map(m => m[1] || m[2]))];
for (const b of bilder) for (const s of ['', '-klein']) await copy(path.join(SRC, 'img', b + s + '.webp'), 'img/' + b + s + '.webp');

/* Schriften mit Lizenz */
const FONTS = [
  ['@fontsource-variable/cinzel', 'cinzel-latin-wght-normal.woff2', 'cinzel-OFL.txt'],
  ['@fontsource/atkinson-hyperlegible', 'atkinson-hyperlegible-latin-400-normal.woff2', 'atkinson-hyperlegible-OFL.txt'],
  ['@fontsource/atkinson-hyperlegible', 'atkinson-hyperlegible-latin-700-normal.woff2'],
  ['@fontsource/cormorant-garamond', 'cormorant-garamond-latin-500-italic.woff2', 'cormorant-garamond-OFL.txt']
];
for (const [pkg, file, lic] of FONTS) {
  await copy(path.join(NM, pkg, 'files', file), 'fonts/' + file);
  if (lic) await copy(path.join(NM, pkg, 'LICENSE'), 'fonts/LICENSES/' + lic);
}

/* Service Worker: Prüfsumme über alle Dateien, Liste zum Vorladen */
const files = (await walk(OUT)).filter(f => f !== '.nojekyll' && !f.startsWith('fonts/LICENSES/'));
const hash = createHash('sha256');
for (const f of files) { hash.update(f); hash.update(await readFile(path.join(OUT, f))); }
const version = hash.digest('hex').slice(0, 12);
let sw = await read(path.join(SRC, 'sw.js'));
noDashes('src/sw.js', sw);
await put('sw.js', sw.replace("'/*VERSION*/'", `'${version}'`).replace('/*PRECACHE*/[]', JSON.stringify(['./', ...files])));

let total = 0;
for (const f of await walk(OUT)) total += (await readFile(path.join(OUT, f))).length;
console.log(`docs/ gebaut: ${files.length + 1} Dateien vorgeladen, ${(total / 1024).toFixed(0)} KB gesamt, Version ${version}, ${karten.length} Karten (davon ${karten.filter(c => c.l === 13).length} Kürzel), ${bilder.length} Bilder`);
if (mitStrich) console.log(`Hinweis: ${mitStrich} Karten enthalten Gedankenstriche (Inhalt aus dem Reinprügler, nicht verändert)`);
