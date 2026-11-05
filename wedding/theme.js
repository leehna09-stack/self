/* 웨딩홀 비교 화면(견적 보드) — 한 줄에 총액 막대(와인)와 거리 막대(청록)를 나란히 놓아, 위에서 아래로 훑으며 비교한다.
   hall.js의 훅(window.HALL_UI)으로 카드·목록 위 영역을 바꾼다. */
window.HALL_UI = (() => {
  let A;                                    // hall.js가 setup에서 넘겨주는 도구 모음
  let openId = null;                        // 펼친 행 (B처럼 한 번에 하나만)
  let reveal = null;                        // 방금 펼친 행: 화면 밖으로 잘렸으면 보이게 스크롤
  let focusId = null;                       // 요약 칩을 눌러 이동할 행
  const CHIPS = [['all', '전체'], ['cheap', '저가순'], ['expensive', '고가순'], ['near', '가까운순'], ['far', '먼순']];

  // 막대 길이는 "전체 목록" 기준이라 검색해도 기준이 흔들리지 않는다
  function scale() {
    const ts = A.halls.map(h => A.total(h)).filter(n => n != null), ds = A.halls.map(h => A.distFor(h)).filter(n => n != null);
    return { maxP: Math.max(0, ...ts), minP: Math.min(...ts), nP: ts.length, maxD: Math.max(0, ...ds), minD: Math.min(...ds), nD: ds.length };
  }
  const pct = (v, max) => (max > 0 ? Math.max(10, Math.round(v / max * 100)) : 0);

  function cells(h, S) {
    const t = A.total(h), d = A.distFor(h);
    const bestP = t != null && S.nP > 1 && t === S.minP, bestD = d != null && S.nD > 1 && d === S.minD;
    const price = t == null
      ? '<span class="cell pend"><em>상담전</em></span>'
      : `<span class="cell cp${bestP ? ' best' : ''}"><i style="width:${pct(t, S.maxP)}%"></i><em>${A.fmtPrice(t)}</em>${bestP ? '<u>최저</u>' : ''}</span>`;
    const dist = d == null
      ? `<span class="cell pend"><em>${h.lat != null || A.needsGeo(h) ? '거리 계산 중…' : '거리 미확인'}</em></span>`
      : `<span class="cell cd${bestD ? ' best' : ''}"><i style="width:${pct(d, S.maxD)}%"></i><em>${d}km</em>${bestD ? '<u>최단</u>' : ''}</span>`;
    return price + dist;
  }

  function details(h) {
    const { esc, icon, fmtPrice, total } = A, meal = h.meal && h.guests ? h.meal * h.guests : 0;
    const addr = A.addrOf(h), link = A.linkOf(h);
    return `<div class="qmore">
      <div class="qsum">대관료 ${fmtPrice(h.price)}${meal ? ` + 식대 ${h.meal}만×${h.guests}명 (${fmtPrice(meal)})` : ''}</div>
      ${(h.extras || []).map(e => `<div class="qsum alt">${esc(e.label)} · 총액 ${fmtPrice(total(h, e.price))}</div>`).join('')}
      ${addr ? `<div class="qsum">${icon('pin')} ${esc(addr)}</div>` : ''}
      ${h.phone ? `<div class="qsum"><a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${esc(h.phone)}</a></div>` : ''}
      ${link ? `<div class="qsum"><a href="${esc(link)}" target="_blank" rel="noopener">지도에서 보기</a></div>` : ''}
      ${h.memo ? `<div class="qmemo">${esc(h.memo)}</div>` : ''}
      ${h.photos?.length ? `<button type="button" class="qphoto" data-id="${h.id}" data-act="view">${icon('photo')} 사진 ${h.photos.length}장 보기</button>` : ''}
    </div>`;
  }

  function syncChips() {
    document.querySelectorAll('#chips .chip').forEach(c => { const on = c.dataset.sort === A.sort; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    const lg = document.querySelector('#legend .lgd'); if (lg) lg.textContent = `${A.curOrigin().name}에서 거리`;
  }

  return {
    setup(api) {
      A = api;
      // 정렬 칩: 한 번 누르면 바뀐다 (원래 드롭다운은 숨기고 값만 공유)
      const bar = document.createElement('div'); bar.id = 'chips'; bar.className = 'chips'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', '정렬');
      bar.innerHTML = CHIPS.map(([v, t]) => `<button type="button" class="chip" data-sort="${v}">${t}</button>`).join('');
      document.querySelector('.searchrow').after(bar);
      bar.onclick = e => { const c = e.target.closest('.chip'); if (!c) return; const sel = document.getElementById('sort'); sel.value = c.dataset.sort; sel.dispatchEvent(new Event('change')); };
      const lg = document.createElement('div'); lg.id = 'legend'; lg.className = 'legend'; lg.innerHTML = '<span class="lgp">총액</span><span class="lgd"></span>';
      document.querySelector('.countrow').append(lg);
      // 행 펼치기/접기, 요약 칩으로 이동
      document.addEventListener('click', e => {
        const f = e.target.closest('[data-act="focus"]'); if (f) { focusId = f.dataset.id; A.rerender(); return; }
        const row = e.target.closest('.qrow'); if (!row || e.target.closest('a, [data-act]')) return;
        const id = row.dataset.id; openId = openId === id ? null : id; reveal = openId; A.rerender();
      });
    },
    lead() {
      const S = scale(); if (!A.halls.length) return '';
      const bp = S.nP > 1 ? A.halls.filter(h => A.total(h) === S.minP)[0] : null, bd = S.nD > 1 ? A.halls.filter(h => A.distFor(h) === S.minD)[0] : null;
      if (!bp && !bd) return '';
      const f = (cls, label, h, val) => `<button type="button" class="fact ${cls}" data-act="focus" data-id="${h.id}"><span>${label}</span><b>${A.esc(h.name)}</b><em>${val}</em></button>`;
      return `<div class="facts">${bp ? f('fp', '가장 저렴', bp, A.fmtPrice(S.minP)) : '<span></span>'}${bd ? f('fd', '가장 가까움', bd, S.minD + 'km') : '<span></span>'}</div>`;
    },
    cardHtml(h) {
      const S = scale(), isOpen = openId === h.id, addr = A.addrOf(h);
      return `<article class="qrow${isOpen ? ' open' : ''}${h.liked ? ' liked' : ''}" data-id="${h.id}">
        <div class="qtop">
          <button type="button" class="qname" aria-expanded="${isOpen}">${A.esc(h.name)}</button>
          <button class="starbtn${h.liked ? ' on' : ''}" data-id="${h.id}" data-act="like" aria-pressed="${!!h.liked}" aria-label="관심" title="관심">${A.icon('star', h.liked ? 'on' : '')}</button>
          ${isOpen ? `<div class="tools">
            <a class="tool navi" href="${A.esc(A.dirUrl(h))}" target="_blank" rel="noopener" aria-label="길찾기" title="길찾기">${A.icon('nav')}</a>
            <button class="tool" data-id="${h.id}" data-act="edit" aria-label="수정" title="수정">${A.icon('edit')}</button>
            <button class="tool danger" data-id="${h.id}" data-act="del" aria-label="삭제" title="삭제">${A.icon('trash')}</button>
          </div>` : '<span class="qcaret" aria-hidden="true"></span>'}
        </div>
        <div class="qbars">${cells(h, S)}</div>
        <div class="qaddr">${addr ? A.esc(addr) : '주소 없음'}</div>
        ${isOpen ? details(h) : ''}
      </article>`;
    },
    afterRender() {
      syncChips();
      if (reveal) {                                                    // 펼친 행이 화면 아래로 잘리면 보이게
        const el = document.querySelector(`.qrow[data-id="${reveal}"]`); reveal = null;
        if (el) el.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      if (focusId) {
        const el = document.querySelector(`.qrow[data-id="${focusId}"]`); focusId = null;
        if (el) { el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1400); }
      }
    }
  };
})();
