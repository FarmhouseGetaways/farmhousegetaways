/* How long does one cat take to draw, and one stage? The budget is 16.7ms a
 * frame for two cats plus a stage plus the HUD, and this game has been
 * unplayable once already because nobody measured.
 *
 *     node tools/perf.mjs
 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome'].find(existsSync);
const files = [...readFileSync(join(ROOT,'index.html'),'utf8').matchAll(/<script src="src\/([^"]+)"><\/script>/g)].map(m=>m[1]).filter(f=>f!=='main.js');
const SRC = files.map(f => readFileSync(join(ROOT,'src',f),'utf8')).join('\n;\n');
const html = `<!doctype html><meta charset="utf-8"><body><canvas id="c" width="768" height="448"></canvas>
<script>${SRC}<\/script><script>
window.__run = () => {
  const x = document.getElementById('c').getContext('2d');
  x.setTransform(2,0,0,2,0,0);
  const out = [];
  /* The MINIMUM over several batches, not the mean. Anything else on the
     machine — another agent rendering a screenshot, a build — inflates a
     mean by a factor of two and makes the number useless. The fastest batch
     is the one that got a clean run at the CPU, and that is the honest
     cost of the drawing. */
  const time = (label, fn) => {
    fn(); fn();
    let best = Infinity;
    for (let batch = 0; batch < 6; batch++) {
      const t0 = performance.now();
      for (let k = 0; k < 25; k++) fn();
      /* Canvas 2D in Chromium is DEFERRED: fill() records into a display
         list and rasterises later, so timing the calls alone measures the
         recording and reports a tenth of the truth. Reading one pixel back
         forces the flush, which is what actually costs the frame. */
      x.getImageData(0, 0, 1, 1);
      best = Math.min(best, (performance.now() - t0) / 25);
    }
    out.push([label, +best.toFixed(2)]);
  };
  for (const chr of CF.ROSTER) {
    const j = CF.Rig.solve(CF.Pose.stand, 1, chr.build);
    time('cat ' + chr.id, () => { x.save(); x.translate(190,172); x.scale(1,-1);
      CF.Rig.drawCat(x, j, chr.palette, {eyes:'angry', t:0, vx:0}); x.restore(); });
  }
  /* Where does a cat's time go? Silhouette mode runs the same shape paths
     and the same contour pass and then stops, so the gap between the two is
     everything after it: cel shading, the muscle pass, the kit and the head. */
  for (const chr of [CF.ROSTER[0]]) {
    const j = CF.Rig.solve(CF.Pose.stand, 1, chr.build);
    time('  contour+paths', () => { x.save(); x.translate(190,172); x.scale(1,-1);
      CF.Rig.drawCat(x, j, chr.palette, {silhouette:'#000'}); x.restore(); });
  }
  /* the same cat at each detail level, so the dial can be judged */
  for (const lvl of [1, 0]) {
    CF.Rig.setDetail(lvl);
    const chr = CF.ROSTER[0];
    const j = CF.Rig.solve(CF.Pose.stand, 1, chr.build);
    time('  detail ' + lvl, () => { x.save(); x.translate(190,172); x.scale(1,-1);
      CF.Rig.drawCat(x, j, chr.palette, {eyes:'angry'}); x.restore(); });
  }
  CF.Rig.setDetail(2);
  /* The full-screen passes every stage pays for, whatever it draws. */
  const K = CF.StageKit;
  time('  sky', () => K.sky(x, [[0,'#25121f'],[0.5,'#4d2432'],[1,'#7d3d33']], 0, 172));
  time('  deepen', () => K.deepen(x, { air: '#6b4038', haze: 0.2, floorDark: 0.3 }));
  time('  vignette', () => K.vignette(x, 0.3));
  time('  nearLip', () => K.nearLip(x, 13, 0.4));
  time('  grain floor', () => K.grain(x, -60, 56, ['#6d4a2c', '#bd854e'], 0.1));
  for (const s of CF.Stages) {
    if (s.init) s.init();
    time('stage ' + s.id, () => { s.drawBack(x,-80,400,0.8); CF.StageKit.deepen(x, s.air||null);
      if (s.drawFore) s.drawFore(x,-80,400,0.8); });
  }
  return out;
};
<\/script></body>`;
writeFileSync(join(ROOT,'dist','.perf.html'), html);
const b = await chromium.launch({ executablePath: EXE, args:['--no-sandbox','--disable-gpu','--use-gl=swiftshader'] });
const page = await b.newPage();
await page.goto('file://' + join(ROOT,'dist','.perf.html'), { waitUntil:'load' });
const rows = await page.evaluate(() => window.__run());
await b.close();
const cats = rows.filter(r => r[0].startsWith('cat')).map(r => r[1]);
const stages = rows.filter(r => r[0].startsWith('stage')).map(r => r[1]);
for (const [l,v] of rows) console.log(l.padEnd(16), String(v).padStart(6), 'ms');
const worst = Math.max(...cats) * 2 + Math.max(...stages);
console.log('\nworst case: two of the heaviest cats + the heaviest stage =',
  worst.toFixed(1), 'ms   (budget 16.7, software rendering, no GPU)');
if (worst > 15) console.log('OVER BUDGET — this will drop frames on a machine with no GPU');
