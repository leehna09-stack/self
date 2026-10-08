const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const n of [1, 2, 3]) {
    const svg = fs.readFileSync(path.join(__dirname, `icon-${n}.svg`), 'utf8');
    for (const s of [180, 192, 512]) {
      const p = await b.newPage({ viewport: { width: s, height: s } });
      await p.setContent(`<style>html,body{margin:0}svg{display:block;width:${s}px;height:${s}px}</style>${svg}`);
      await p.screenshot({ path: path.join(__dirname, `../../icons/d${n}-${s}.png`) });
      await p.close();
    }
  }
  // preview sheet with squircle mask
  const p = await b.newPage({ viewport: { width: 1000, height: 380 } });
  let html = '<body style="margin:0;background:#e9ebf2;display:flex;gap:40px;align-items:center;justify-content:center;height:380px">';
  for (const n of [1, 2, 3]) html += `<img src="data:image/png;base64,${fs.readFileSync(path.resolve(__dirname, `../../icons/d${n}-512.png`)).toString('base64')}" style="width:260px;height:260px;border-radius:23%;box-shadow:0 18px 36px rgba(20,30,70,.3)">`;
  await p.setContent(html + '</body>'); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(__dirname, 'icons-preview.png') });
  await b.close();
})();
