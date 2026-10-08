#!/usr/bin/env python3
"""index.html(원본)을 건드리지 않고, 시안 3종(design-1/2/3.html)과 매니페스트를 만들어요.
사용법: python3 design/build.py   (gagyebu 폴더 어디서든 실행 가능)"""
import json, pathlib, re

D = pathlib.Path(__file__).resolve().parent
ROOT = D.parent
SRC = D / 'src'
html0 = (ROOT / 'index.html').read_text(encoding='utf-8')
common = (SRC / 'common.css').read_text(encoding='utf-8')

THEMES = {
    1: dict(name='Soft Blue', scheme='light', theme='#2563eb', bgc='#ffffff'),
    2: dict(name='Clay Rose', scheme='light', theme='#d6406a', bgc='#ffffff'),
}

def sub1(s, old, new):
    assert s.count(old) == 1, ('못 찾았거나 여러 개예요:', old[:60], s.count(old))
    return s.replace(old, new)

HEADER = '''<header class="top">
    <div class="navrow">
      <div class="who" id="who" role="tablist" aria-label="지금 쓰는 사람"></div>
      <div class="navicons">
        <button type="button" class="icon-btn bell" id="bellBtn" aria-label="새 소식">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          <span class="badge" id="bellBadge" hidden></span>
        </button>
        <button type="button" class="icon-btn nudge" id="nudgeBtn" aria-label="상대에게 지출 입력요청 보내기">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>
        </button>
        <button type="button" class="icon-btn ratiobtn" id="ratioBtn" aria-label="한나와 동일의 지출 비율 보기" title="지출 비율 보기">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
        </button>
      </div>
    </div>
    <div class="hero-title">
      <img class="brand" src="icons/d@N@-192.png" alt="" width="62" height="62">
      <div><p class="eyebrow">우리 둘의 살림 기록</p><h1>알뜰살뜰 가계부</h1></div>
    </div>
  </header>'''

TABBAR = '''<!-- 위쪽 미니 제목 + 아래쪽 탭바 (iOS 앱 느낌) -->
<div class="mininav" id="miniNav" aria-hidden="true"><img src="icons/d@N@-192.png" alt="">알뜰살뜰 가계부</div>
<nav class="tabbar" aria-label="화면 이동">
  <button type="button" data-go="sec-home" class="on"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V10"/></svg>홈</button>
  <button type="button" data-go="sec-cal"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>달력</button>
  <button type="button" class="fab" id="fabAdd" aria-label="오늘 지출 입력"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
  <button type="button" data-go="sec-list"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>내역</button>
  <button type="button" data-go="sec-cmp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V11M12 20V5M19 20v-7"/></svg>비교</button>
</nav>
<script>
(function () {
  var bar = document.querySelector('.tabbar'), mini = document.getElementById('miniNav');
  var btns = [].slice.call(bar.querySelectorAll('[data-go]'));
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(id) {
    var el = document.getElementById(id); if (!el) return;
    var y = id === 'sec-home' ? 0 : el.getBoundingClientRect().top + window.scrollY - 58;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-go')); }); });
  document.getElementById('fabAdd').addEventListener('click', function () {
    var d = document.querySelector('.day.today') || document.querySelector('.day'); if (d) d.click();
  });
  function onScroll() {
    var line = window.innerHeight * 0.4, cur = btns[0];
    btns.forEach(function (b) { var el = document.getElementById(b.getAttribute('data-go')); if (el && el.getBoundingClientRect().top <= line) cur = b; });
    btns.forEach(function (b) { b.classList.toggle('on', b === cur); });
    mini.classList.toggle('show', window.scrollY > 70);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); window.addEventListener('load', onScroll); setTimeout(onScroll, 600); onScroll();
})();
</script>
'''

CAT_JS = '''  // 내역 줄 앞의 입체 아이콘(분류별 그림 + 사람별 색)
  var CAT_SVG = {
    '식비': '<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3v11"/>',
    '생활용품': '<path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    '기타': '<circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/>'
  };
  function catIcon(e) {
    var s = h('span', { class: 'cico ' + (e.who === PEOPLE[0] ? 'ca' : 'cb'), 'aria-hidden': 'true' });
    s.innerHTML = '<svg viewBox="0 0 24 24">' + (CAT_SVG[e.cat] || CAT_SVG['기타']) + '</svg>';
    return s;
  }

  function renderList() {'''

def build(n, t):
    s = html0
    s = sub1(s, '<meta name="color-scheme" content="light">', '<meta name="color-scheme" content="%s">' % t['scheme'])
    s = sub1(s, '<meta name="theme-color" content="#2b68e0">', '<meta name="theme-color" content="%s">' % t['theme'])
    s = sub1(s, '<link rel="manifest" href="manifest.json">', '<link rel="manifest" href="manifest-%d.json">' % n)
    s = sub1(s, '<link rel="icon" href="icon-192.png">', '<link rel="icon" href="icons/d%d-192.png">' % n)
    s = sub1(s, '<link rel="apple-touch-icon" href="icon-192.png">', '<link rel="apple-touch-icon" href="icons/d%d-180.png">' % n)
    s = sub1(s, '<meta name="apple-mobile-web-app-title" content="알뜰살뜰">',
             '<meta name="apple-mobile-web-app-title" content="알뜰살뜰">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">')
    theme_css = (SRC / ('theme-%d.css' % n)).read_text(encoding='utf-8')
    s = sub1(s, '</style>\n</head>', '/* ===== 시안 %d: %s ===== */\n%s\n%s\n</style>\n</head>' % (n, t['name'], theme_css, common))
    s, k = re.subn(r'<header class="top">.*?</header>', lambda m: HEADER.replace('@N@', str(n)), s, count=1, flags=re.S)
    assert k == 1
    s = sub1(s, '<section class="card" aria-labelledby="monthTitle">', '<section class="card" id="sec-home" aria-labelledby="monthTitle">')
    s = sub1(s, '<section class="card cal" aria-label="달력">', '<section class="card cal" id="sec-cal" aria-label="달력">')
    s = sub1(s, '<section aria-labelledby="listTitle">', '<section id="sec-list" aria-labelledby="listTitle">')
    s = sub1(s, '<section class="card" style="margin-top:12px" aria-labelledby="cmpTitle">', '<section class="card" id="sec-cmp" aria-labelledby="cmpTitle">')
    s = sub1(s, '  function renderList() {', CAT_JS)
    s = sub1(s, "h('div', { class: 'row' },\n              h('div', { class: 'main' },", "h('div', { class: 'row' },\n              catIcon(e),\n              h('div', { class: 'main' },")
    # 앱 설치 안내: 카톡·네이버 같은 앱 속 브라우저에서는 설치가 안 되므로 따로 안내
    s = sub1(s, "var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);",
             "var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);\n    var inapp = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\\/|DaumApps|; wv\\)/i.test(navigator.userAgent);")
    s = sub1(s, "$('#installMsg').textContent = ios\n",
             "$('#installMsg').textContent = inapp\n      ? '카카오톡·네이버 같은 앱 안에서는 설치할 수 없어요. 오른쪽 위 메뉴에서 \"다른 브라우저로 열기\"를 눌러 크롬(아이폰은 Safari)에서 다시 열어 주세요.'\n      : ios\n")
    s = sub1(s, '<div id="toast" role="status"', TABBAR.replace('@N@', str(n)) + '\n<div id="toast" role="status"')
    (ROOT / ('design-%d.html' % n)).write_text(s, encoding='utf-8')

    m = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    m['start_url'] = './design-%d.html' % n
    m['id'] = './design-%d.html' % n
    m['theme_color'] = t['theme']; m['background_color'] = t['bgc']
    m['icons'] = [{'src': 'icons/d%d-%d.png' % (n, sz), 'sizes': '%dx%d' % (sz, sz), 'type': 'image/png', 'purpose': p}
                  for sz in (192, 512) for p in ('any', 'maskable')]
    (ROOT / ('manifest-%d.json' % n)).write_text(json.dumps(m, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

for n, t in THEMES.items():
    build(n, t)
print('ok')
