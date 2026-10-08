const { chromium } = require('/opt/node-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const types = { '.html': 'text/html', '.png': 'image/png', '.json': 'application/json', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
}).listen(8765);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = path.join(__dirname, 'shots'); fs.mkdirSync(out, { recursive: true });
  for (const n of [1, 2, 3]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem('gagyebu.user.v1', '한나');
        const memos = [['쿠팡 로켓프레쉬','식비'],['롯데슈퍼','식비'],['다이소','생활용품'],['신사정육 육회','식비'],['칫솔','생활용품'],['이마트 장보기','식비'],['세탁세제','생활용품'],['치킨','식비'],['택배비','기타'],['과일','식비']];
        const amts = [24570,19800,6800,46000,10140,91960,15400,23900,3500,12880];
        const list = []; let k = 0;
        [[7,31],[8,31],[9,30],[10,8]].forEach(([m,last]) => { for (let d = 1; d <= last; d++) { if ((d * 7 + m) % 3 === 0) continue; const i = (d + m) % 10; list.push({ id: 'x' + (k++), who: (d + m) % 2 ? '한나' : '동일', date: `2026-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, cat: memos[i][1], amount: amts[i] + d * 130, memo: memos[i][0] }); if (d % 9 === 0) list.push({ id: 'y' + (k++), who: '동일', date: `2026-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, cat: '식비', amount: 120000, memo: '외식 모임' }); } });
        localStorage.setItem('gagyebu.entries.v1', JSON.stringify(list));
        localStorage.setItem('gagyebu.goals.v1', JSON.stringify({ '2026-10': 900000, '2026-09': 800000, '2026-08': 800000, '2026-07': 800000 }));
      } catch (e) {}
    });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('pageerror', n, e.message));
    await p.route(/gstatic|googleapis|jsdelivr/, r => r.abort());
    await p.goto(`http://localhost:8765/design-${n}.html`); await p.waitForTimeout(900);
    await p.screenshot({ path: `${out}/d${n}-1-home.png` });
    await p.evaluate(() => window.scrollTo(0, 560)); await p.waitForTimeout(500);
    await p.screenshot({ path: `${out}/d${n}-2-cal.png` });
    await p.evaluate(() => window.scrollTo(0, 1250)); await p.waitForTimeout(500);
    await p.screenshot({ path: `${out}/d${n}-3-list.png` });
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
    await p.click('#fabAdd'); await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/d${n}-4-sheet.png` });
    await p.click('#cancelBtn'); await p.waitForTimeout(200);
    await p.click('#ratioBtn'); await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/d${n}-5-ratio.png` });
    await ctx.close();
  }
  await b.close(); srv.close();
})();
