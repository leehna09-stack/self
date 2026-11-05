/* 앱 설치: 서비스워커 등록 + 설치 안내 배너.
   안드로이드·크롬: 설치 버튼(beforeinstallprompt) / 아이폰: 공유 → 홈 화면에 추가 안내. 이미 설치해서 열었으면 보이지 않는다. */
(function () {
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  const DISMISS_KEY = 'wedding-install-dismissed', HIDE_DAYS = 7;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inApp = /KAKAOTALK|NAVER\(inapp|Instagram|FBAN|FBAV|Line\//i.test(ua);
  const dismissed = () => { try { const t = +localStorage.getItem(DISMISS_KEY); return t && Date.now() - t < HIDE_DAYS * 864e5; } catch { return false; } };
  let deferred = null, bar = null;

  function css() {
    if (document.getElementById('install-css')) return;
    const st = document.createElement('style'); st.id = 'install-css';
    st.textContent = `.installbar{display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:9px 10px 9px 12px;border-radius:14px;background:var(--card,#fff);color:var(--text,#1c1c1e);box-shadow:0 1px 2px rgba(0,0,0,.06),0 6px 18px rgba(60,60,90,.08);font-size:12px;line-height:1.4}
.installbar img{width:34px;height:34px;border-radius:9px;flex:none;box-shadow:0 1px 3px rgba(0,0,0,.25)}
.installbar .it{flex:1;min-width:0}.installbar b{display:block;font-size:12px}.installbar span{color:var(--muted,#8a8a8e);font-size:11px;display:block}
.installbar button{border:0;border-radius:10px;min-height:34px;padding:0 12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.installbar .go{background:var(--accent,#ff2d55);color:#fff}.installbar .x{background:none;color:var(--muted,#8a8a8e);font-size:18px;padding:0 6px;min-width:30px}`;
    document.head.appendChild(st);
  }
  function show(kind) {
    if (bar || standalone() || dismissed()) return;
    const host = document.querySelector('main.wrap'); if (!host) return;
    css();
    bar = document.createElement('div'); bar.className = 'installbar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', '앱 설치 안내');
    const text = kind === 'prompt' ? ['앱으로 설치', '홈 화면에서 바로 열고, 인터넷이 없어도 볼 수 있어요.']
      : inApp ? ['앱으로 설치', '카카오톡·네이버 앱 안에서는 설치할 수 없어요. Safari나 Chrome으로 열어 주세요.']
      : ['앱으로 설치', '공유 버튼(□↑)을 누르고 “홈 화면에 추가”를 선택하세요.'];
    bar.innerHTML = `<img src="icon-192.png" alt=""><div class="it"><b>${text[0]}</b><span>${text[1]}</span></div>` +
      (kind === 'prompt' ? '<button type="button" class="go">설치</button>' : '') + '<button type="button" class="x" aria-label="닫기">×</button>';
    host.prepend(bar);
    bar.querySelector('.x').onclick = hide;
    const go = bar.querySelector('.go');
    if (go) go.onclick = async () => { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch {} deferred = null; hide(true); };
  }
  function hide(silent) {
    if (bar) { bar.remove(); bar = null; }
    if (silent !== true) { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {} }
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if (document.readyState === 'complete') show('prompt'); else window.addEventListener('load', () => show('prompt')); });
  window.addEventListener('appinstalled', () => hide(true));
  window.addEventListener('load', () => { if (ios && !deferred) show('ios'); });
  window.WeddingInstall = { show: () => { try { localStorage.removeItem(DISMISS_KEY); } catch {} show(deferred ? 'prompt' : 'ios'); } };
})();
