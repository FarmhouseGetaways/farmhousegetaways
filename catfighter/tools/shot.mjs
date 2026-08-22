/* Render the game's art to a PNG, headless, so a change can be LOOKED at.
 *
 *   node tools/shot.mjs cats  out.png [scale]           all six, a few poses
 *   node tools/shot.mjs cat   out.png <id> [poses] [sc] one cat, big
 *   node tools/shot.mjs head  out.png [ids]             faces, close up
 *   node tools/shot.mjs strip out.png <id> <move>       a move, cel by cel
 *   node tools/shot.mjs stage out.png <id> [camX]       one stage + two cats
 *   node tools/shot.mjs stages out.png                  all six stages
 *   node tools/shot.mjs fight out.png [stageIdx] [frames]   the real game
 *
 * Everything is drawn through the real shipping files — the list comes from
 * index.html, so a new cat or stage file is picked up without editing this.
 *
 * Judge art at the size it ships at. The game draws 384x224 and the cats are
 * about ninety pixels tall in it; a detail that only reads at 8x is not a
 * detail, it is noise. `cats` and `stages` render at game scale on purpose.
 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
             '/opt/pw-browsers/chromium/chrome']
  .find(p => existsSync(p));

const [mode, out, ...rest] = process.argv.slice(2);
if (!mode || !out) { console.error(readFileSync(new URL(import.meta.url)).toString().slice(0, 900)); process.exit(1); }

const files = [...readFileSync(join(ROOT, 'index.html'), 'utf8')
  .matchAll(/<script src="src\/([^"]+)"><\/script>/g)].map(m => m[1]).filter(f => f !== 'main.js');
const SRC = files.map(f => readFileSync(join(ROOT, 'src', f), 'utf8')).join('\n;\n');

/* Every mode is a function of (ctx-less) page globals; each returns the
   canvas size it wants and paints into it. */
const SCENES = {
cats: (a) => `
  const SC = ${Number(a[0]) || 1.9};
  const POSES = ['stand','walkF2','fierce','sweep','jumpKick','guardHigh'];
  /* Tall enough for the whole cat. The first version cropped every head off
     at the top, which is a bad way to judge a silhouette. */
  const CW = Math.round(120*SC/1.9), CH = Math.round(215*SC/1.9);
  size(CW*POSES.length, CH*CF.ROSTER.length);
  bg('#7c7c86');
  CF.ROSTER.forEach((chr,row)=>POSES.forEach((pn,col)=>{
    const j = CF.Rig.solve(CF.Pose[pn]||CF.Pose.stand, SC, chr.build);
    clipCell(col*CW,row*CH,CW,CH, ()=>{
      ctx.translate(col*CW+CW/2, row*CH+CH-Math.round(26*SC/1.9));
      ctx.scale(1,-1);
      CF.Rig.drawCat(ctx,j,chr.palette,{eyes:'angry'});
    });
    label(chr.id+' '+pn, col*CW+4, row*CH+11);
    frame(col*CW,row*CH,CW,CH);
  }));`,

cat: (a) => `
  const ID='${a[0]||'gracie'}', POSES=${JSON.stringify((a[1]||'stand,fierce,sweep,jumpKick').split(','))}, SC=${Number(a[2])||3.0};
  const CW=Math.round(105*SC), CH=Math.round(165*SC);
  size(CW*POSES.length, CH); bg('#7c7c86');
  const chr=CF.byId(ID);
  POSES.forEach((pn,col)=>{
    const j=CF.Rig.solve(CF.Pose[pn]||CF.Pose.stand, SC, chr.build);
    clipCell(col*CW,0,CW,CH, ()=>{
      ctx.translate(col*CW+CW/2, CH-Math.round(20*SC));
      ctx.scale(1,-1);
      CF.Rig.drawCat(ctx,j,chr.palette,{eyes:'angry'});
    });
    label(ID+' '+pn, col*CW+6, 16); frame(col*CW,0,CW,CH);
  });`,

head: (a) => `
  const IDS=${JSON.stringify((a[0]||'').split(',').filter(Boolean))};
  const R = IDS.length ? IDS.map(i=>CF.byId(i)) : CF.ROSTER;
  const CW=230, CH=230, COLS=Math.min(3,R.length);
  size(CW*COLS, CH*Math.ceil(R.length/COLS)); bg('#6e6e78');
  R.forEach((chr,i)=>{
    const j=CF.Rig.solve(CF.Pose.stand, 7.0, chr.build);
    const col=i%COLS, row=(i/COLS)|0;
    clipCell(col*CW,row*CH,CW,CH, ()=>{
      ctx.translate(col*CW+CW/2-j.head.x, row*CH+CH*0.52+j.head.y);
      ctx.scale(1,-1);
      CF.Rig.drawCat(ctx,j,chr.palette,{eyes: i%2?'angry':'normal', mouth: i%3===2?'open':null});
    });
    label(chr.id+(i%2?' angry':' normal'), col*CW+6, row*CH+16);
    frame(col*CW,row*CH,CW,CH);
  });`,

strip: (a) => `
  const ID='${a[0]||'gracie'}', MV='${a[1]||'fierce'}';
  const chr=CF.byId(ID), m=chr.moves[MV];
  if(!m) throw new Error('no move '+MV+' on '+ID+' — have: '+Object.keys(chr.moves).join(' '));
  const total=m.startup+m.active+m.recovery;
  const cels=[]; for(let f=0;f<total;f++){const c=CF.Anim.celFrame(m.anim,f); if(!cels.length||cels[cels.length-1]!==c) cels.push(c);}
  const SC=2.4, CW=Math.round(100*SC), CH=Math.round(160*SC);
  size(CW*cels.length, CH); bg('#7c7c86');
  cels.forEach((f,i)=>{
    const j=CF.Rig.solve(CF.Anim.sample(m.anim,f,m), SC, chr.build);
    clipCell(i*CW,0,CW,CH, ()=>{
      ctx.translate(i*CW+CW/2, CH-Math.round(20*SC)); ctx.scale(1,-1);
      CF.Rig.drawCat(ctx,j,chr.palette,{eyes:'angry'});
    });
    const active = f>=m.startup && f<m.startup+m.active;
    label('f'+f+(active?'  HIT':''), i*CW+6, 16, active?'#ff9c6a':'#fff');
    frame(i*CW,0,CW,CH);
  });`,

stage: (a) => `
  const ID='${a[0]||'barn'}', CAM=${Number(a[1])||-60};
  const K=CF.StageKit, Z=2;
  const s=CF.Stages.find(x=>x.id===ID)||CF.Stages[0];
  size(384*Z,224*Z);
  const c=document.createElement('canvas'); c.width=384; c.height=224;
  const x=c.getContext('2d');
  for(let k=0;k<60;k++) Object.keys(s).forEach(key=>{ if(s[key]&&s[key].p&&s[key].update) s[key].update(); });
  s.drawBack(x,CAM,420,0.85); K.deepen(x, s.air||null);
  [[150,CF.ROSTER[0],1],[248,CF.ROSTER[3],-1]].forEach(([px,ch,f])=>{
    x.fillStyle='rgba(0,0,0,.34)'; x.beginPath(); x.ellipse(px,173,17,4,0,0,Math.PI*2); x.fill();
    const j=CF.Rig.solve(CF.Pose.stand,1,ch.build);
    x.save(); x.translate(px,172); x.scale(f,-1); CF.Rig.drawCat(x,j,ch.palette,{eyes:'angry'}); x.restore();
  });
  if(s.drawFore) s.drawFore(x,CAM,420,0.85);
  K.nearLip(x,13,0.40);
  ctx.imageSmoothingEnabled=false; ctx.drawImage(c,0,0,384,224,0,0,384*Z,224*Z);
  label(s.name, 8, 18);`,

stages: () => `
  const K=CF.StageKit, Z=2, COLS=2, N=CF.Stages.length;
  size(384*Z*COLS, 224*Z*Math.ceil(N/COLS)); bg('#111');
  const CAMS=[-40,-40,-60,-200,-60,-60];
  CF.Stages.forEach((s,i)=>{
    for(let k=0;k<60;k++) Object.keys(s).forEach(key=>{ if(s[key]&&s[key].p&&s[key].update) s[key].update(); });
    const c=document.createElement('canvas'); c.width=384; c.height=224;
    const x=c.getContext('2d');
    s.drawBack(x,CAMS[i]||-60,420+i*40,0.85); K.deepen(x,s.air||null);
    [[150,CF.ROSTER[i%6],1],[248,CF.ROSTER[(i+3)%6],-1]].forEach(([px,ch,f])=>{
      x.fillStyle='rgba(0,0,0,.34)'; x.beginPath(); x.ellipse(px,173,17,4,0,0,Math.PI*2); x.fill();
      const j=CF.Rig.solve(CF.Pose.stand,1,ch.build);
      x.save(); x.translate(px,172); x.scale(f,-1); CF.Rig.drawCat(x,j,ch.palette,{eyes:'angry'}); x.restore();
    });
    if(s.drawFore) s.drawFore(x,CAMS[i]||-60,420+i*40,0.85);
    K.nearLip(x,13,0.40);
    const ox=(i%COLS)*384*Z, oy=((i/COLS)|0)*224*Z;
    ctx.imageSmoothingEnabled=false; ctx.drawImage(c,0,0,384,224,ox,oy,384*Z,224*Z);
    label(s.name, ox+8, oy+20); frame(ox,oy,384*Z,224*Z);
  });`
};

const scene = SCENES[mode];
const live = mode === 'fight';
if (!scene && !live) { console.error('unknown mode: ' + mode + ' — try ' + Object.keys(SCENES).concat('fight').join(', ')); process.exit(1); }

const body = live ? '' : scene(rest);
const page_html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#222">
<canvas id="c" width="10" height="10"></canvas>
<script>${SRC}<\/script>
<script>
const cv=document.getElementById('c'); let ctx=cv.getContext('2d');
function size(w,h){ cv.width=w; cv.height=h; ctx=cv.getContext('2d'); }
function bg(col){ ctx.fillStyle=col; ctx.fillRect(0,0,cv.width,cv.height); }
function frame(x,y,w,h){ ctx.strokeStyle='rgba(0,0,0,.22)'; ctx.strokeRect(x+.5,y+.5,w-1,h-1); }
function label(t,x,y,col){ ctx.save(); ctx.fillStyle='rgba(0,0,0,.55)';
  ctx.font='700 11px monospace'; const w=ctx.measureText(t).width;
  ctx.fillRect(x-3,y-10,w+6,14); ctx.fillStyle=col||'#fff'; ctx.fillText(t,x,y); ctx.restore(); }
function clipCell(x,y,w,h,fn){ ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip(); fn(); ctx.restore(); }
try { ${body} window.__ok=true; }
catch(e){ window.__err = e.message + '\\n' + (e.stack||'').split('\\n').slice(0,4).join('\\n'); }
<\/script></body>`;

const tmp = join(ROOT, 'dist', '.shot.html');
writeFileSync(tmp, page_html);

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader'] });
const errs = [];
try {
  if (live) {
    const idx = Number(rest[0]) || 0, frames = Number(rest[1]) || 240;
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + join(ROOT, 'index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(600);
    const url = await page.evaluate(({ idx, frames }) => {
      const g = window.CF.game;
      g.startMatch(CF.ROSTER[idx % 6], CF.ROSTER[(idx + 2) % 6], idx, 'arcade');
      for (let k = 0; k < frames; k++) g.step();
      g.render();
      return document.getElementById('screen').toDataURL('image/png');
    }, { idx, frames });
    writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  } else {
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + tmp, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__ok || window.__err, { timeout: 15000 }).catch(() => {});
    const err = await page.evaluate(() => window.__err);
    if (err) { console.error('SCENE FAILED:\n' + err); process.exitCode = 1; }
    else {
      const url = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
      writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    }
  }
} finally { await browser.close(); }

if (errs.length) { console.error('PAGE ERRORS:\n' + errs.join('\n')); process.exitCode = 1; }
else if (!process.exitCode) console.log('wrote ' + out);
