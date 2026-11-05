/* 시안 B · 가성비 맵 — 가로=집에서 거리, 세로=총액인 산점도. 왼쪽 아래(가깝고 저렴)가 한눈에 보이고,
   점의 번호가 아래 카드 번호와 같다. hall.js의 훅(window.HALL_UI)으로 목록 위 영역과 카드를 바꾼다. */
window.HALL_UI = (() => {
  let A;
  let sel = null, scrollTo = null;                       // 선택한 예식장(점·카드가 함께 강조되고 카드가 펼쳐진다)
  const W = 340, H = 206, PL = 36, PR = 10, PT = 14, PB = 32;
  const nice = v => { if (!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) if (m * p >= v) return m * p; return 10 * p; };
  const med = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const axisP = m => (m >= 10000 ? (m / 10000).toFixed(m % 10000 ? 1 : 0) + '억' : m.toLocaleString());

  function points(ctx) {
    return ctx.rows.map((h, i) => ({ h, n: i + 1, x: A.distFor(h), y: A.total(h) })).filter(p => p.x != null && p.y != null);
  }

  function chart(ctx) {
    const pts = points(ctx), rest = ctx.rows.map((h, i) => ({ h, n: i + 1 })).filter(r => !pts.some(p => p.h === r.h));
    const { esc } = A;
    let body = '';
    if (!pts.length) {
      body = `<div class="vempty">총액과 거리가 모두 있는 예식장이 있으면 여기에 점으로 나타나요.</div>`;
    } else {
      const xMax = nice(Math.max(...pts.map(p => p.x)) * 1.12), yMax = nice(Math.max(...pts.map(p => p.y)) * 1.12);
      const sx = x => PL + x / xMax * (W - PL - PR), sy = y => H - PB - y / yMax * (H - PT - PB);
      const yT = [0, 1, 2, 3].map(i => yMax * i / 3), xT = [0, 1, 2, 3, 4].map(i => xMax * i / 4);
      const fx = v => (v >= 10 ? Math.round(v) : +v.toFixed(1));
      const grid = yT.map(v => `<line class="gy" x1="${PL}" x2="${W - PR}" y1="${sy(v)}" y2="${sy(v)}"/><text class="tk" x="${PL - 6}" y="${sy(v) + 3}" text-anchor="end">${axisP(Math.round(v))}</text>`).join('')
        + xT.map(v => `<line class="gx" x1="${sx(v)}" x2="${sx(v)}" y1="${PT}" y2="${H - PB}"/><text class="tk" x="${sx(v)}" y="${H - PB + 13}" text-anchor="middle">${fx(v)}</text>`).join('');
      // 평균(중앙값)보다 가깝고 저렴한 구역
      let sweet = '', inSweet = () => false;
      if (pts.length >= 3) {
        const mx = med(pts.map(p => p.x)), my = med(pts.map(p => p.y));
        sweet = `<rect class="sweet" x="${PL}" y="${sy(my)}" width="${sx(mx) - PL}" height="${H - PB - sy(my)}" rx="6"/><text class="sweetlb" x="${PL + 7}" y="${sy(my) + 13}">가깝고 저렴</text>`;
        inSweet = p => p.x <= mx && p.y <= my;
      }
      // 겹치는 점은 옆으로 살짝 밀어서 둘 다 누를 수 있게 한다
      const placed = [];
      const dots = pts.map(p => {
        let cx = sx(p.x); const cy = sy(p.y);
        for (let k = 0; k < 6 && placed.some(q => Math.hypot(q.cx - cx, q.cy - cy) < 17); k++) cx += 16;
        placed.push({ cx, cy });
        const cls = 'pt' + (sel === p.h.id ? ' sel' : inSweet(p) ? ' good' : '');
        return `<g class="${cls}" data-act="pick" data-id="${p.h.id}" tabindex="0" role="button" aria-label="${p.n}번 ${esc(p.h.name)}, ${A.fmtPrice(p.y)}, ${p.x}킬로미터"><circle cx="${cx}" cy="${cy}" r="10"/><text x="${cx}" y="${cy + 3.5}" text-anchor="middle">${p.n}</text></g>`;
      });
      // 선택한 점이 다른 점에 가려지지 않도록 맨 위에 그린다
      const order = dots.map((d, i) => ({ d, s: pts[i].h.id === sel })).sort((a, b) => a.s - b.s).map(o => o.d).join('');
      body = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="가성비 맵: 가로는 ${esc(A.curOrigin().name)}에서 거리, 세로는 총액">${sweet}${grid}<text class="ax" x="${PL}" y="9">총액(만원)</text><text class="ax" x="${W - PR}" y="${H - 3}" text-anchor="end">${esc(A.curOrigin().name)}에서 거리(km)</text>${order}</svg>`;
    }
    const restHtml = rest.length ? `<div class="vrest"><span>점으로 못 그린 곳</span>${rest.map(r => `<button type="button" class="vchip" data-act="pick" data-id="${r.h.id}"><b>${r.n}</b>${esc(r.h.name)} · ${A.total(r.h) == null ? '상담전' : '거리 미확인'}</button>`).join('')}</div>` : '';
    return `<section class="vmap" aria-label="가성비 맵"><div class="vhead"><b>가성비 맵</b><span class="vkey"><i></i>평균보다 가깝고 저렴</span></div>${body}${restHtml}</section>`;
  }

  function more(h) {
    const { esc, icon, fmtPrice, total } = A, addr = A.addrOf(h), link = A.linkOf(h), meal = h.meal && h.guests ? h.meal * h.guests : 0;
    return `<div class="vmore">
      <div class="vsum">대관료 ${fmtPrice(h.price)}${meal ? ` + 식대 ${h.meal}만×${h.guests}명 (${fmtPrice(meal)})` : ''}</div>
      ${(h.extras || []).map(e => `<div class="vsum alt">${esc(e.label)} · 총액 ${fmtPrice(total(h, e.price))}</div>`).join('')}
      ${addr ? `<div class="vsum">${icon('pin')} ${esc(addr)}</div>` : ''}
      ${h.phone ? `<div class="vsum"><a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${esc(h.phone)}</a></div>` : ''}
      ${link ? `<div class="vsum"><a href="${esc(link)}" target="_blank" rel="noopener">지도에서 보기</a></div>` : ''}
      ${h.memo ? `<div class="vmemo">${esc(h.memo)}</div>` : ''}
      ${h.photos?.length ? `<button type="button" class="vphoto" data-id="${h.id}" data-act="view">${icon('photo')} 사진 ${h.photos.length}장 보기</button>` : ''}
    </div>`;
  }

  return {
    setup(api) {
      A = api;
      document.addEventListener('click', e => {
        const pick = e.target.closest('[data-act="pick"]');
        if (pick) { const id = pick.dataset.id; sel = sel === id ? null : id; scrollTo = sel; A.rerender(); return; }
        const card = e.target.closest('.vcard');
        if (card && !e.target.closest('a, button')) { const id = card.dataset.id; sel = sel === id ? null : id; A.rerender(); }
      });
      document.addEventListener('keydown', e => { const pt = e.target.closest?.('.pt'); if (pt && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pt.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    },
    lead(ctx) { return ctx.rows.length ? chart(ctx) : ''; },
    cardHtml(h, ctx) {
      const { esc, icon, fmtPrice } = A, t = A.total(h), d = A.distFor(h), n = ctx.rows.indexOf(h) + 1, on = sel === h.id;
      const onChart = t != null && d != null, addr = A.addrOf(h);
      const best = t != null && ctx.priced.length > 1 && t === ctx.min ? '<span class="badge">최저가</span>' : '';
      const dist = d != null ? `${d}km` : (h.lat != null || A.needsGeo(h) ? '거리 계산 중…' : '거리 미확인');
      return `<article class="vcard${on ? ' sel' : ''}" data-id="${h.id}">
        <span class="vnum${onChart ? '' : ' off'}" aria-label="${n}번">${n}</span>
        <div class="vmain">
          <div class="vl1"><span class="vname">${esc(h.name)}</span><button class="starbtn${h.liked ? ' on' : ''}" data-id="${h.id}" data-act="like" aria-pressed="${!!h.liked}" aria-label="관심" title="관심">${icon('star', h.liked ? 'on' : '')}</button></div>
          <div class="vl2"><b class="vp${t == null ? ' pend' : ''}">${fmtPrice(t)}</b>${best}<span class="vd${d == null ? ' pend' : ''}">${icon('pin')} ${dist}</span></div>
          <div class="vl3">${addr ? esc(addr) : '주소 없음'}</div>
        </div>
        <div class="tools">
          <a class="tool navi" href="${esc(A.dirUrl(h))}" target="_blank" rel="noopener" aria-label="길찾기" title="길찾기">${icon('nav')}</a>
          <button class="tool" data-id="${h.id}" data-act="edit" aria-label="수정" title="수정">${icon('edit')}</button>
          <button class="tool danger" data-id="${h.id}" data-act="del" aria-label="삭제" title="삭제">${icon('trash')}</button>
        </div>
        ${on ? more(h) : ''}
      </article>`;
    },
    afterRender() {
      if (scrollTo) {
        const el = document.querySelector(`.vcard[data-id="${scrollTo}"]`); scrollTo = null;
        if (el) el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
    }
  };
})();
