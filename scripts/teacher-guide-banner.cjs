// Animated banner for /resources/ linking to the teacher career guide. The motion explains one idea:
// a classroom duty, then the same work in an employer's words (the guide's page-6 table, TRANSLATE).
// Renders frames with Playwright (animations paused and stepped), then ffmpeg encodes animated WebP.
// Usage: node scripts/teacher-guide-banner.cjs (needs Playwright, ffmpeg with libwebp, and python3 + Pillow).
const { chromium } = require('playwright');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const R = path.resolve(__dirname, '..');
const NM = R + '/node_modules/@fontsource-variable';
const S = fs.mkdtempSync(path.join(os.tmpdir(), 'tg-banner-'));
const OUT = `${R}/public/images/reports/classroom-to-instructional-design`;
const b64 = (p) => fs.readFileSync(p).toString('base64');
const img = (n) => `data:image/webp;base64,${b64(`${R}/public/images/reports/classroom-to-instructional-design/${n}.webp`)}`;
const logo = fs.readFileSync(R + '/brand/logo-wordmark.svg', 'utf8');

// Four rows of the guide's own table (page 6), copied from src/data/reports/classroom-to-instructional-design.ts.
const ROWS = [
  ['Planned units and sequences of lessons', 'Course mapping and sequencing'],
  ['Wrote learning intentions and success criteria', 'Measurable learning objectives'],
  ['Designed tests, tasks and rubrics', 'Assessment design'],
  ["Changed a lesson when it wasn't working", 'Formative evaluation and iteration'],
];
const STEP = 3; // seconds per row
const LOOP = STEP * ROWS.length;
const FPS = 12;

const css = (W, H, m) => `
@font-face{font-family:F;src:url(file://${NM}/fraunces/files/fraunces-latin-full-normal.woff2) format('woff2');font-weight:100 900;}
@font-face{font-family:N;src:url(file://${NM}/newsreader/files/newsreader-latin-opsz-normal.woff2) format('woff2');font-weight:200 800;}
@font-face{font-family:IT;src:url(file://${NM}/inter-tight/files/inter-tight-latin-wght-normal.woff2) format('woff2');font-weight:100 900;}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{background:#f6c847;color:#16181d;font-family:N;position:relative}
.k{font:700 ${m ? 30 : 17}px/1.2 IT;letter-spacing:.12em;text-transform:uppercase}
.h{font-family:F;font-weight:800;letter-spacing:-.02em;line-height:1.02}
.pill{display:inline-block;font:800 ${m ? 30 : 22}px/1 IT;letter-spacing:.08em;text-transform:uppercase;padding:${m ? '24px 32px' : '18px 24px'};border-radius:999px;background:#16181d;color:#f6c847;white-space:nowrap}
.logo svg{height:${m ? 44 : 32}px;width:auto;display:block}
.card{position:absolute;background:#f7f4ee;border:3px solid #16181d;box-shadow:10px 10px 0 #16181d}
.row{position:absolute;inset:0;padding:${m ? '40px 44px' : '26px 30px'};opacity:0;animation:row ${LOOP}s linear infinite}
.lab{font:700 ${m ? 22 : 16}px/1 IT;letter-spacing:.12em;text-transform:uppercase;color:#3a3c42}
.did{font-size:${m ? 42 : 25}px;line-height:1.2;margin:${m ? '16px 0 0' : '12px 0 0'};animation:did ${LOOP}s linear infinite;animation-delay:inherit}
.arrow{font:800 ${m ? 46 : 34}px/1 IT;color:#c0391b;margin:${m ? '26px 0 22px' : '12px 0 10px'};animation:term ${LOOP}s linear infinite;animation-delay:inherit}
.term{font-family:F;font-weight:800;font-size:${m ? 56 : 33}px;line-height:1.05;letter-spacing:-.015em;margin-top:${m ? 16 : 12}px;animation:term ${LOOP}s linear infinite;animation-delay:inherit}
.tl{animation:term ${LOOP}s linear infinite;animation-delay:inherit}
.dots{position:absolute;display:flex;gap:10px}
.dot{width:${m ? 16 : 12}px;height:${m ? 16 : 12}px;border-radius:50%;border:2px solid #16181d;position:relative;overflow:hidden}
.dot i{position:absolute;inset:0;background:#16181d;opacity:0;animation:dot ${LOOP}s linear infinite}
/* one row is on screen for the first quarter of the loop; each row is delayed by STEP */
@keyframes row{0%{opacity:0}2.5%{opacity:1}22%{opacity:1}24.5%{opacity:0}100%{opacity:0}}
@keyframes did{0%{transform:translateY(14px)}4%{transform:none}100%{transform:none}}
@keyframes term{0%,8%{opacity:0;transform:translateY(16px)}12%{opacity:1;transform:none}100%{opacity:1;transform:none}}
@keyframes dot{0%{opacity:1}24.9%{opacity:1}25%{opacity:0}100%{opacity:0}}
.page{position:absolute;width:${m ? 240 : 190}px;border-radius:4px;box-shadow:0 18px 36px rgba(22,24,29,.3);transform-origin:50% 100%}
.p3{transform:rotate(-14deg) translateX(-30px)}
.p2{transform:rotate(-7deg) translateX(-14px)}
/* the pages hold still: motion is kept for the translation it explains (design.md §7) */
@keyframes fan3{0%,100%{transform:rotate(-14deg) translateX(-30px)}50%{transform:rotate(-18deg) translateX(-44px)}}
@keyframes fan2{0%,100%{transform:rotate(-7deg) translateX(-14px)}50%{transform:rotate(-9deg) translateX(-22px)}}
@keyframes fan1{0%,100%{transform:rotate(0deg)}50%{transform:rotate(1deg)}}
.cv{transform:rotate(6deg) translateX(18px)}
`;

const rows = () => ROWS.map(([did, term], i) => `
  <div class="row" style="animation-delay:${i * STEP}s">
    <p class="lab">In the classroom</p>
    <p class="did">${did}</p>
    <p class="arrow">↓</p>
    <p class="lab tl">In a job ad</p>
    <p class="term">${term}</p>
  </div>`).join('');
const dots = () => ROWS.map((_, i) => `<span class="dot"><i style="animation-delay:${i * STEP}s"></i></span>`).join('');
const fan = (x, y) => `
  <img class="page p3" src="${img('page-plan')}" style="left:${x}px;top:${y}px">
  <img class="page p2" src="${img('page-translate')}" style="left:${x}px;top:${y}px">
  <img class="page p1" src="${img('page-evidence')}" style="left:${x}px;top:${y}px">
  <img class="page cv" src="${img('cover')}" style="left:${x}px;top:${y}px">`;

// Desktop: 1200x400 layout drawn at 1.5x (1800x600).
const wide = () => `<div style="position:absolute;inset:0;transform:scale(1.5);transform-origin:0 0;width:1200px;height:400px">
  <div style="position:absolute;left:44px;top:40px;width:400px">
    <p class="k">Free career guide for teachers</p>
    <h2 class="h" style="font-size:42px;margin:16px 0 14px">From classroom to instructional design</h2>
    <p style="font-size:19px;line-height:1.4">You already do most of the work. Here's how to say it in an employer's words.</p>
  </div>
  <div style="position:absolute;left:44px;bottom:40px"><span class="pill">Get the free guide →</span></div>
  <div class="card" style="left:470px;top:40px;width:450px;height:296px">${rows()}</div>
  <div class="dots" style="left:470px;top:356px">${dots()}</div>
  ${fan(985, 80)}
</div>`;

// Phone: 900x1125 (4:5).
const tall = () => `
  <div style="position:absolute;left:56px;right:56px;top:56px">
    <p class="k">Free career guide for teachers</p>
    <h2 class="h" style="font-size:76px;margin:22px 0 0">From classroom to instructional design</h2>
  </div>
  <div class="card" style="left:56px;right:66px;top:330px;height:450px">${rows()}</div>
  <div class="dots" style="left:56px;top:808px">${dots()}</div>
  <div style="position:absolute;left:56px;bottom:56px"><span class="pill">Get the free guide →</span><div class="logo" style="margin-top:28px">${logo}</div></div>
  ${fan(650, 820)}`;

(async () => {
  const browser = await chromium.launch();
  for (const [name, W, H, body, m] of [['wide', 1800, 600, wide(), false], ['tall', 900, 1125, tall(), true]]) {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    const W0 = name === 'wide' ? 1200 : W, H0 = name === 'wide' ? 400 : H;
    fs.writeFileSync(`${S}/${name}.html`, `<!doctype html><meta charset=utf-8><style>${css(W, H, m)}</style><body>${body}</body>`);
    await page.goto(`file://${S}/${name}.html`);
    await page.evaluate(async () => { await Promise.all(['800 40px F','400 20px N','700 20px IT','800 20px IT'].map((f) => document.fonts.load(f))); await document.fonts.ready; });
    await page.waitForTimeout(300);
    const dir = `${S}/frames-${name}`;
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
    const N = LOOP * FPS;
    for (let f = 0; f < N; f++) {
      const t = (f / FPS) * 1000;
      await page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
      await page.screenshot({ path: `${dir}/${String(f).padStart(4, '0')}.png` });
    }
    // Still for reduced motion: the first row fully shown.
    await page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), 2000);
    await page.screenshot({ path: `${S}/still-${name}.png` });
    await page.close();
  }
  await browser.close();
  for (const name of ['wide', 'tall']) {
    execSync(`ffmpeg -loglevel error -y -framerate ${FPS} -i ${S}/frames-${name}/%04d.png -c:v libwebp_anim -lossless 0 -q:v 80 -compression_level 6 -loop 0 -an ${OUT}/banner-${name}.webp`);
    execSync(`python3 -c "from PIL import Image; Image.open('${S}/still-${name}.png').convert('RGB').save('${OUT}/banner-${name}-still.webp', quality=88)"`);
  }
  fs.rmSync(S, { recursive: true, force: true });
})();
