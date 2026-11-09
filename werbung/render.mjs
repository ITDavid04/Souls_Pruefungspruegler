/* Rechnet das Werbevideo aus werbung/video.html Bild für Bild und setzt den Ton aus werbung/ton.py darunter.
   Vorher einmal: npm run build (Schriften kommen aus docs/fonts).
   node werbung/render.mjs            -> werbung/pruefungspruegler-werbung.mp4
   node werbung/render.mjs --probe    -> nur Standbilder nach werbung/probe/ (zum schnellen Nachsehen)
   node werbung/render.mjs --schau    -> nur der Webserver, das Video läuft dann im Browser in Schleife
   Braucht playwright (Chromium), ffmpeg und für den Ton python3 mit numpy. */
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HIER, '..');
const PORT = Number(process.env.PORT || 8097);
const AUS = path.join(HIER, 'pruefungspruegler-werbung.mp4');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const server = createServer(async (req, res) => {
  try {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const st = file.startsWith(ROOT + path.sep) ? await stat(file).catch(() => null) : null;
    if (!st || !st.isFile()) { res.writeHead(404).end('Nicht gefunden'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch (e) { res.writeHead(500).end(String(e)); }
});
await new Promise(ok => server.listen(PORT, '127.0.0.1', ok));
const URL_ = `http://localhost:${PORT}/werbung/video.html`;

if (process.argv.includes('--schau')) { console.log('Video läuft auf ' + URL_); }
else {
  const { chromium } = createRequire(import.meta.url)('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('Fehler in der Seite:', e.message); process.exitCode = 1; });
  await page.goto(URL_ + '?bild');
  await page.evaluate(() => window.bereit);
  const { DAUER, FPS } = await page.evaluate(() => ({ DAUER: window.DAUER, FPS: window.FPS }));

  if (process.argv.includes('--probe')) {
    const dir = path.join(HIER, 'probe'); await mkdir(dir, { recursive: true });
    const arg = process.argv[process.argv.indexOf('--probe') + 1];
    const zeiten = arg && !arg.startsWith('--') ? arg.split(',').map(Number) : Array.from({ length: 50 }, (_, i) => i * .5 + .25);
    for (const t of zeiten) { await page.evaluate(t => window.render(t), t); await page.screenshot({ path: path.join(dir, `t${t.toFixed(2).padStart(5, '0')}.jpg`), quality: 80 }); }
    console.log(zeiten.length + ' Standbilder in werbung/probe/');
  } else {
    const ton = path.join(HIER, 'ton.wav');
    const py = spawnSync('python3', [path.join(HIER, 'ton.py'), ton], { stdio: 'inherit' });
    if (py.status !== 0) throw new Error('Ton ließ sich nicht erzeugen');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', ton,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
      '-c:a', 'aac', '-b:a', '256k', '-af', 'loudnorm=I=-14:TP=-1.2:LRA=9', '-ar', '48000', '-movflags', '+faststart', '-t', String(DAUER), AUS], { stdio: ['pipe', 'inherit', 'inherit'] });
    const fertig = new Promise((ok, nein) => ff.on('close', c => c === 0 ? ok() : nein(new Error('ffmpeg endet mit ' + c))));
    const n = Math.round(DAUER * FPS);
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.render(t), i / FPS);
      const bild = await page.screenshot({ type: 'jpeg', quality: 100 });
      if (!ff.stdin.write(bild)) await new Promise(ok => ff.stdin.once('drain', ok));
      if (i % 75 === 0) console.log(`Bild ${i} von ${n}`);
    }
    ff.stdin.end(); await fertig;
    console.log('Fertig: ' + path.relative(ROOT, AUS));
  }
  await browser.close(); server.close();
}
