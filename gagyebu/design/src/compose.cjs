const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const names = { 1: '시안 1 · Soft Blue', 2: '시안 2 · Clay Rose' };
  const rows = ['1-home', '3-list', '4-sheet'];
  const img = f => 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'shots', f)).toString('base64');
  const icon = n => 'data:image/png;base64,' + fs.readFileSync(path.resolve(__dirname, `../../icons/d${n}-512.png`)).toString('base64');
  let html = '<body style="margin:0;background:#e8eaf1;font-family:sans-serif;padding:28px;width:780px"><div style="display:flex;gap:28px">';
  for (const n of [1, 2]) {
    html += `<div style="flex:1"><div style="display:flex;align-items:center;gap:14px;margin-bottom:16px"><img src="${icon(n)}" style="width:76px;height:76px;border-radius:23%;box-shadow:0 10px 22px rgba(20,30,70,.3)"><b style="font-size:22px;color:#1b2236">${names[n]}</b></div>`;
    for (const r of rows) html += `<img src="${img(`d${n}-${r}.png`)}" style="width:100%;border-radius:22px;margin-bottom:16px;box-shadow:0 10px 24px rgba(20,30,70,.22)">`;
    html += '</div>';
  }
  const p = await b.newPage({ viewport: { width: 1216, height: 800 } });
  await p.setContent(html + '</div></body>'); await p.waitForTimeout(500);
  await p.screenshot({ path: path.resolve(__dirname, '../preview.png'), fullPage: true });
  await b.close();
})();
