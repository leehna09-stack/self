/* 하단 고정바(웨딩홀 비교 · 로드맵 · 설정)와 설정 시트 — 웨딩홀 비교와 로드맵 두 화면이 함께 쓴다.
   설정 시트: 결혼식 날짜·총 예산(로드맵), 기본 주소 관리·카카오 키(웨딩홀), 전체 백업(내보내기·가져오기). */
(function () {
  const RKEY = 'wedding-roadmap-v1', HKEY = 'wedding-halls-v1', OKEY = 'wedding-origins-v1', KKEY = 'wedding-kakao-key';
  const here = /roadmap\.html$/.test(location.pathname) ? 'road' : 'hall';
  const gl = d => `<svg class="gl" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    hall: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2 3 7h18Z"/>',
    road: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    next: '<path d="m9 18 6-6-6-6"/>'
  };
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  document.body.insertAdjacentHTML('beforeend', `
<nav class="wtab" aria-label="주 메뉴"><div class="in">
  <a class="wt${here === 'hall' ? ' on' : ''}" href="index.html"${here === 'hall' ? ' aria-current="page"' : ''}>${gl(IC.hall)}<span>웨딩홀 비교</span></a>
  <a class="wt${here === 'road' ? ' on' : ''}" href="roadmap.html"${here === 'road' ? ' aria-current="page"' : ''}>${gl(IC.road)}<span>로드맵</span></a>
  <button type="button" class="wt" id="wtSet" aria-haspopup="dialog">${gl(IC.gear)}<span>설정</span></button>
</div></nav>
<dialog id="wsheet" aria-labelledby="wsTitle">
  <form class="ws" id="wsForm" method="dialog">
    <div class="grab" aria-hidden="true"></div>
    <h2 id="wsTitle">설정</h2>
    <section>
      <h3>결혼 일정</h3>
      <label>결혼식 날짜 <small>정하면 로드맵의 단계별 권장 기한이 계산돼요.</small><input type="date" id="wsDate"></label>
      <label>총 예산 (만원)<input type="number" id="wsBudget" min="0" inputmode="numeric" placeholder="예: 5000"></label>
    </section>
    <section>
      <h3>웨딩홀</h3>
      <button type="button" class="btn go" id="wsOrigins"><span>기본 주소 관리<small id="wsOriginName"></small></span>${gl(IC.next)}</button>
      <label>카카오 REST API 키 <small>이름만으로 주소·전화번호를 자동 입력해요.</small>
        <span class="keyline"><input type="text" id="wsKey" autocomplete="off" placeholder="developers.kakao.com에서 발급한 키"><button type="button" class="btn" id="wsKeySave">저장</button></span>
      </label>
      <div class="hint" id="wsKeyHint" aria-live="polite"></div>
    </section>
    <section>
      <h3>백업 (로드맵 · 웨딩홀 · 기본 주소)</h3>
      <div class="row">
        <button type="button" class="btn" id="wsExport">내보내기</button>
        <label class="btn" style="cursor:pointer">가져오기<input type="file" id="wsImport" accept="application/json" hidden></label>
        <button type="button" class="btn danger" id="wsReset">로드맵 초기화</button>
      </div>
      <div class="hint" id="wsMsg" aria-live="polite"></div>
    </section>
    <div class="foot"><button type="button" class="btn" id="wsClose">닫기</button><button type="submit" class="btn primary">저장</button></div>
  </form>
</dialog>`);

  const $ = id => document.getElementById(id), sheet = $('wsheet');
  const msg = (el, t, kind) => { el.textContent = t; el.className = 'hint' + (kind ? ' ' + kind : ''); };

  // 같은 탭을 다시 누르면 맨 위로
  document.querySelector('.wt.on')?.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  function open() {
    const R = read(RKEY, {}), O = read(OKEY, null), d = O?.list?.find(x => x.id === O.defId) || O?.list?.[0];
    $('wsDate').value = R.date || ''; $('wsBudget').value = R.budget || '';
    $('wsOriginName').textContent = d ? `${d.name} · ${d.addr}` : '집 (기본)';
    const k = localStorage.getItem(KKEY) || '', st = localStorage.getItem('wedding-kakao-status') || '';
    $('wsKey').value = k;
    msg($('wsKeyHint'), !k ? '키가 없으면 무료 OpenStreetMap 검색을 써요.' : st === 'bad' ? '저장된 키가 거부됐어요. 키를 확인해 주세요.' : st === 'ok' ? '연결돼 있어요.' : '키가 저장돼 있어요.', !k ? '' : st === 'bad' ? 'err' : 'ok');
    msg($('wsMsg'), ''); sheet.showModal();
  }
  $('wtSet').onclick = open;
  $('wsClose').onclick = () => sheet.close();
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

  $('wsForm').onsubmit = e => {
    e.preventDefault();
    const R = read(RKEY, {}); R.date = $('wsDate').value || ''; R.budget = Math.max(0, Number($('wsBudget').value) || 0);
    if (!write(RKEY, R)) return msg($('wsMsg'), '저장 공간이 부족하거나 막혀 있어요.', 'err');
    window.dispatchEvent(new Event('wedding-data-changed')); sheet.close();
  };

  // 웨딩홀: 기본 주소 관리 — 웨딩홀 화면이면 팝업을 바로 열고, 로드맵 화면이면 웨딩홀 화면으로 가서 연다
  $('wsOrigins').onclick = () => {
    if (typeof openOrigins === 'function') { sheet.close(); openOrigins(); } else location.href = 'index.html?origins=1';
  };
  // 카카오 키: 저장하면 바로 한 번 확인한다. 정상이면 웨딩홀 입력창에서 키 안내가 사라진다.
  const SKEY = 'wedding-kakao-status';
  const setStatus = st => { try { st ? localStorage.setItem(SKEY, st) : localStorage.removeItem(SKEY); } catch {} window.dispatchEvent(new Event('wedding-kakao-changed')); };
  $('wsKeySave').onclick = async () => {
    const v = $('wsKey').value.trim(), btn = $('wsKeySave'), hint = $('wsKeyHint');
    try { v ? localStorage.setItem(KKEY, v) : localStorage.removeItem(KKEY); } catch {}
    if (!v) { setStatus(''); return msg(hint, '키를 삭제했어요. 무료 OpenStreetMap 검색으로 돌아가요.', 'ok'); }
    btn.disabled = true; msg(hint, '키를 확인하는 중…');
    try {
      const r = await fetch('https://dapi.kakao.com/v2/local/search/keyword.json?size=1&query=' + encodeURIComponent('웨딩홀'), { headers: { Authorization: 'KakaoAK ' + v } });
      if (r.ok) { setStatus('ok'); msg(hint, '연결됐어요. 이제 웨딩홀 입력창에는 키 안내가 나오지 않아요.', 'ok'); }
      else if (r.status === 401 || r.status === 403) { setStatus('bad'); msg(hint, '키가 거부됐어요. REST API 키인지, 카카오맵 사용 설정이 켜져 있는지 확인해 주세요.', 'err'); }
      else { setStatus(''); msg(hint, '키를 저장했어요. 지금은 확인하지 못했어요(' + r.status + ').', ''); }
    } catch { setStatus(''); msg(hint, '키를 저장했어요. 네트워크 문제로 확인은 못 했어요.', ''); }
    btn.disabled = false;
  };
  window.openSettings = open;

  // 백업: 로드맵 + 웨딩홀 + 기본 주소 (카카오 키는 개인 키라 파일에 넣지 않는다)
  $('wsExport').onclick = () => {
    const data = { app: 'wedding', version: 2, exportedAt: new Date().toISOString(), roadmap: read(RKEY, null), halls: read(HKEY, []), origins: read(OKEY, null) };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = 'wedding-backup.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000); msg($('wsMsg'), '백업 파일을 저장했어요.', 'ok');
  };
  $('wsImport').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const d = JSON.parse(await f.text()); if (!d || typeof d !== 'object' || Array.isArray(d)) throw 0;
      const full = d.app === 'wedding';                                     // 새 백업(전체) 또는 예전 로드맵 전용 파일
      const plan = full ? { roadmap: d.roadmap, halls: d.halls, origins: d.origins } : { roadmap: d };
      if (plan.halls != null && !Array.isArray(plan.halls)) throw 0;
      if (plan.origins != null && !Array.isArray(plan.origins?.list)) throw 0;
      if (plan.roadmap != null && (typeof plan.roadmap !== 'object' || Array.isArray(plan.roadmap))) throw 0;
      if (!confirm('현재 기록을 백업 파일의 내용으로 바꿀까요? (파일에 없는 항목은 그대로 둬요)')) return;
      if (plan.roadmap != null) write(RKEY, plan.roadmap);
      if (plan.halls != null) write(HKEY, plan.halls);
      if (plan.origins != null) write(OKEY, plan.origins);
      location.reload();
    } catch { msg($('wsMsg'), '올바른 백업 파일이 아니에요.', 'err'); }
  };
  $('wsReset').onclick = () => {
    if (!confirm('로드맵의 모든 체크와 기록을 지울까요? (웨딩홀 기록은 그대로예요)')) return;
    try { localStorage.removeItem(RKEY); } catch {}
    location.reload();
  };
})();
