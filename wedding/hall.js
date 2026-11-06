/* 웨딩홀 비교 — 화면 골격과 로직. 디자인(시안)은 hall.css 위에 덮어쓰고, 필요하면 window.HALL_UI 훅으로 카드 모양을 바꾼다.
   훅(선택): cardHtml(h, ctx) · lead(ctx) 목록 위 영역 HTML · afterRender(ctx) · setup(api) 첫 렌더 직전 한 번 */
document.body.insertAdjacentHTML('beforeend', `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="i-gem" viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6M2 9h20"/></symbol>
  <symbol id="i-table" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-cal" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></symbol>
  <symbol id="i-nav" viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></symbol>
  <symbol id="i-alert" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></symbol>
  <symbol id="i-photo" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></symbol>
  <symbol id="i-back" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>
  <symbol id="i-edit" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></symbol>
  <symbol id="i-trash" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></symbol>
  <symbol id="i-map" viewBox="0 0 24 24"><path d="M3 6 9 3l6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></symbol>
  <symbol id="i-enter" viewBox="0 0 24 24"><path d="m9 10-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></symbol>
  <symbol id="i-camera" viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></symbol>
  <symbol id="i-wallet" viewBox="0 0 24 24"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></symbol>
</svg>
<main class="wrap">
  <header>
    <div class="ttl">
      <h1><svg class="i" aria-hidden="true"><use href="#i-gem"/></svg> 웨딩홀 비교</h1>
    </div>
    <div class="hbtns">
      <button class="hico" id="addBtn" aria-label="예식장 추가" title="예식장 추가"><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg></button>
      <button class="hico star" id="cmpBtn" aria-label="관심 예식장 비교표" title="관심 예식장 비교표"><svg class="i" aria-hidden="true"><use href="#i-star"/></svg></button>
      <button class="hico" id="originBtn" aria-label="기준 주소 설정" title="기준 주소 설정"><svg class="i" aria-hidden="true"><use href="#i-map"/></svg></button>
    </div>
  </header>

  <div class="toolbar">
    <form class="searchrow" id="searchForm" role="search">
      <input id="q" type="search" aria-label="예식장 검색" placeholder="예식장 이름·메모 검색" enterkeyhint="search">
      <button class="btn primary" type="submit" id="searchBtn"><svg class="i" aria-hidden="true"><use href="#i-search"/></svg> 검색</button>
    </form>
    <div class="countrow">
      <div class="count" id="count" aria-live="polite"></div>
      <select id="sort" class="sortsel" aria-label="정렬">
        <option value="all">전체</option>
        <option value="cheap">저가순</option>
        <option value="expensive">고가순</option>
        <option value="far">거리먼순</option>
        <option value="near">거리가까운순</option>
      </select>
    </div>
  </div>

  <div id="lead"></div>
  <div class="grid" id="list"></div>
</main>

<dialog id="dlg" aria-labelledby="dlgTitle">
  <form class="edit" id="form">
    <h2 id="dlgTitle">예식장 추가</h2>
    <div class="namerow2">
      <label>예식장 이름 *<input name="name" required maxlength="60" enterkeyhint="go"></label>
      <div class="fld">
        <span class="lbl">지도 링크</span>
        <div class="inwrap">
          <input name="link" maxlength="500" inputmode="url" autocomplete="off" aria-label="지도 링크 (카카오맵·네이버지도)" enterkeyhint="go" placeholder="링크 붙여넣기">
          <button type="button" class="enterbtn" id="linkGo" aria-label="자동입력" title="이름·링크로 주소·전화번호 자동입력"><svg class="i" aria-hidden="true"><use href="#i-enter"/></svg></button>
        </div>
      </div>
    </div>
    <div class="hint" id="lookHint" aria-live="polite">이름이나 링크를 넣고 ↵ 를 누르면 주소·전화번호가 자동 입력돼요</div>
    <div class="cands" id="cands"></div>
    <details class="manual" id="manual">
      <summary>직접 입력하기</summary>
      <div class="manualbody">
        <label>주소 (자동 입력 · 직접 수정 가능)<input name="addr" maxlength="300" placeholder="자동으로 채워지지 않으면 직접 입력해 주세요"></label>
        <label>전화번호<input name="phone" type="tel" inputmode="tel" maxlength="30"></label>
      </div>
    </details>
    <div class="hint" id="distHint" aria-live="polite">입력하면 기준 위치에서의 거리가 자동 계산돼요</div>
    <label>상담 예정일 · 상담일<input name="visit" type="date"></label>
    <div class="hint" id="visitHint" aria-live="polite"></div>
    <fieldset class="cost" id="cost">
    <div class="row2">
      <label>대관료(만원)<input name="price" type="number" min="0" step="any" inputmode="decimal" placeholder="상담전"></label>
      <div class="fld">
        <span class="lbl">월별·요일별 대관료(선택)</span>
        <button type="button" class="btn" id="addEx">+ 요금 추가</button>
      </div>
    </div>
    <div id="extras"></div>
    <div class="row2">
      <label>식대 1인(만원)<input name="meal" type="number" min="0" step="any" inputmode="decimal"></label>
      <label>보증인원(명)<input name="guests" type="number" min="0" inputmode="numeric"></label>
    </div>
    <div class="hint" id="totalHint" aria-live="polite"></div>
    </fieldset>
    <label>메모<textarea name="memo" rows="3" placeholder="주차, 홀 분위기, 연회장 등"></textarea></label>
    <button type="button" class="btn" id="photoBtn"><svg class="i" aria-hidden="true"><use href="#i-photo"/></svg> 사진 추가</button>
    <input id="files" class="sr-only" type="file" accept="image/*" multiple tabindex="-1" aria-hidden="true">
    <input id="camInput" class="sr-only" type="file" accept="image/*" capture="environment" tabindex="-1" aria-hidden="true">
    <div class="thumbs" id="thumbs"></div>
    <div class="foot">
      <button type="button" class="btn" id="cancel">취소</button>
      <button type="submit" class="btn primary" id="saveBtn">저장</button>
    </div>
  </form>
</dialog>



<dialog id="cmp" aria-labelledby="ch">
  <div class="edit">
    <h2 id="ch">관심 예식장 비교</h2>
    <div id="cmpBody"></div>
    <div class="foot"><button type="button" class="btn" id="cmpClose">닫기</button></div>
  </div>
</dialog>

<dialog id="psheet" class="psheet" aria-label="사진 추가 방법">
  <button type="button" class="pbtn" id="pCam"><svg class="i" aria-hidden="true"><use href="#i-camera"/></svg> 카메라로 촬영</button>
  <button type="button" class="pbtn" id="pAlbum"><svg class="i" aria-hidden="true"><use href="#i-photo"/></svg> 앨범에서 선택</button>
  <button type="button" class="pbtn cancel" id="pCancel">취소</button>
</dialog>

<dialog id="lb" class="lightbox" aria-label="사진 크게 보기"><div id="lbBody"></div></dialog>

`);
const UI = window.HALL_UI || {};
const KEY = 'wedding-halls-v1';
const OKEY = 'wedding-origins-v1';
const $ = id => document.getElementById(id);
const icon = (n, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const DEFAULT_ORIGIN = { id: 'home', name: '집', addr: '경기 군포시 송부로96번길 12 B동 (15885)', lat: 37.3157307, lon: 126.9237265 };

let halls = load();
let O = loadOrigins();
let cur = O.defId;      // 현재 기준 위치 id
let sort = 'all';
let query = '';          // 검색 버튼을 눌러 확정한 검색어
let editing = null;     // 수정 중인 id (없으면 신규)
let draftPhotos = [];   // 편집창의 사진 임시 목록
let draftExtras = [];   // 편집창의 월별·요일별 요금 임시 목록
let draftGeo = null;    // 주소 입력 시 미리 찾은 좌표 {addr, geo}
let warnedAddr = null;  // 좌표를 못 찾아 한 번 경고한 주소
let busy = '';          // 거리 계산 진행 상태 문구

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(halls)); }
  catch { alert('저장 공간이 부족합니다. 사진 수를 줄이거나 일부 예식장을 삭제해 주세요.'); }
}
function loadOrigins() {
  try {
    const o = JSON.parse(localStorage.getItem(OKEY));
    if (o?.list?.length) return { list: o.list, defId: o.list.some(x => x.id === o.defId) ? o.defId : o.list[0].id };
  } catch {}
  return { list: [DEFAULT_ORIGIN], defId: DEFAULT_ORIGIN.id };
}
const saveO = () => { try { localStorage.setItem(OKEY, JSON.stringify(O)); } catch {} };
const curOrigin = () => O.list.find(o => o.id === cur) || O.list[0];

const fmtPrice = m => { if (m == null || isNaN(m)) return '상담전'; m = Math.round(m); return m >= 10000 ? (m / 10000).toFixed(m % 10000 ? 1 : 0) + '억' : m.toLocaleString() + '만원'; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isUrl = s => /^https?:/i.test(s || '');
// 총액 = 대관료 + 식대 × 보증인원
// 총액 = 대관료 + 식대 × 보증인원 (대관료를 안 적었으면 null = 상담전)
const total = (h, base = h.price) => base == null || isNaN(base) ? null : base + (h.meal && h.guests ? h.meal * h.guests : 0);
// 금액순 비교: 상담전(null)은 저가순·고가순 모두 맨 뒤로
const byPrice = dir => (a, b) => { const x = total(a), y = total(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return dir * (x - y); };
// 현재 기준 위치에서의 거리(km). 옛 수동 입력값은 기본 위치(집)에서만 사용
// 등록된 모든 기준 주소(집 + 그 외)에서의 거리 [{o, km, k}] — 계산 전이면 km=null
function distsOf(h) { return O.list.map(o => { const d = h.dists?.[o.id]; return { o, km: d ? d.km : (h.lat == null && h.distance != null && o.id === O.defId ? h.distance : null), k: d?.k }; }); }
function distFor(h) {
  const d = h.dists?.[cur];
  if (d) return d.km;
  return h.lat == null && h.distance != null && cur === 'home' ? h.distance : null;
}

// ───────── 주소 → 좌표 → 거리 ─────────
const inKorea = (lat, lon) => lat > 33 && lat < 39 && lon > 124 && lon < 132;
function coordsFromLink(text) {
  let u; try { u = new URL(text); } catch { return undefined; }   // undefined = 링크 아님
  const q = u.searchParams, c = (q.get('c') || '').split(',').map(Number);
  let lat = +(q.get('lat') || q.get('y')), lon = +(q.get('lng') || q.get('x'));
  if (c.length >= 2 && c[0] && c[1]) {
    if (Math.abs(c[0]) > 1000) { // 새 네이버지도는 웹 메르카토르 좌표
      lon = c[0] / 6378137 * 180 / Math.PI;
      lat = (2 * Math.atan(Math.exp(c[1] / 6378137)) - Math.PI / 2) * 180 / Math.PI;
    } else { lon = c[0]; lat = c[1]; }
  }
  return inKorea(lat, lon) ? { lat, lon } : null;                 // null = 링크지만 좌표 없음
}
let lastNom = 0; // Nominatim은 초당 1회 제한
async function nomGet(qs) {
  const wait = lastNom + 1100 - Date.now();
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastNom = Date.now();
  const r = await fetch('https://nominatim.openstreetmap.org/' + qs);
  return r.json();
}
const nominatim = q => nomGet('search?format=json&limit=1&countrycodes=kr&q=' + encodeURIComponent(q));
const KAKAO_DENIED = '카카오 API 사용이 거부됐어요. REST API 키와, 카카오 개발자 콘솔의 “카카오맵” 사용 설정을 확인해 주세요.';
// 상담일: 날짜만 저장('YYYY-MM-DD'). 오늘 포함 앞날이면 예정, 지난 날이면 완료
const WD = ['일', '월', '화', '수', '목', '금', '토'];
function visitInfo(h) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(h.visit || ''); if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]), t = new Date(); t.setHours(0, 0, 0, 0);
  const diff = Math.round((d - t) / 864e5), md = `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`;
  const plan = diff >= 0, tag = plan ? '상담 예정' : '상담 완료';
  return { plan, ask: !plan && h.price == null, diff, md, tag, short: `${md} ${plan ? '예정' : '완료'}`, label: `${md} · ${tag}${diff === 0 ? ' (오늘)' : plan ? ` (D-${diff})` : ''}` };
}
const kakaoKey = () => { try { return localStorage.getItem('wedding-kakao-key') || ''; } catch { return ''; } };
const kakaoStatus = () => { try { return localStorage.getItem('wedding-kakao-status') || ''; } catch { return ''; } };
function markKakao(st) { if (kakaoStatus() === st) return; try { st ? localStorage.setItem('wedding-kakao-status', st) : localStorage.removeItem('wedding-kakao-status'); } catch {} }
async function geocode(text) {
  const link = coordsFromLink(text);
  if (link) return link;
  if (link === null) throw new Error('이 링크에는 위치 정보가 없어요. 주소를 입력해 주세요.');
  const key = kakaoKey();
  if (key) {
    for (const api of ['address', 'keyword']) {
      let r;
      try { r = await fetch(`https://dapi.kakao.com/v2/local/search/${api}.json?size=1&query=${encodeURIComponent(text)}`, { headers: { Authorization: 'KakaoAK ' + key } }); }
      catch { throw new Error('카카오 주소 검색에 연결하지 못했어요.'); }
      if (r.status === 401 || r.status === 403) { markKakao('bad'); throw new Error(KAKAO_DENIED); }
      if (r.ok) markKakao('ok');
      const d = (await r.json()).documents?.[0];
      if (d) return { lat: +d.y, lon: +d.x };
    }
  }
  const road = text.replace(/\(.*?\)/g, '').match(/^(.*?(?:로|길)\s?\d+(?:-\d+)?)/);
  for (const q of [...new Set([text, road && road[1]])].filter(Boolean)) {
    try {
      const j = await nominatim(q);
      if (j[0]) return { lat: +j[0].lat, lon: +j[0].lon };
    } catch { throw new Error('주소 검색 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'); }
  }
  throw new Error('주소를 찾지 못했어요. 도로명주소로 다시 입력해 주세요.');
}
// ───────── 지도 링크 해석 / 예식장 정보 자동 입력 ─────────
const addrOf = h => (isUrl(h.addr) ? '' : h.addr || '');
const linkOf = h => { const l = h.link || (isUrl(h.addr) ? h.addr : ''); return isUrl(l) ? l : ''; };
const geoSrc = h => addrOf(h) || linkOf(h);                      // 좌표를 찾을 때 쓰는 텍스트
const needsGeo = h => h.lat == null && !h.geoFail && !!(addrOf(h) || coordsFromLink(linkOf(h)));
const URL_RE = /https?:\/\/[^\s<>"']+/i;
const decode = s => { try { return decodeURIComponent(s); } catch { return s; } };
function splitShare(text) {                                      // 공유 문구에서 링크와 이름 후보를 분리
  const m = text.match(URL_RE);
  if (!m) return { url: '', label: text.trim() };
  return { url: m[0], label: text.replace(m[0], '').split('\n').map(x => x.trim()).find(Boolean) || '' };
}
// 카카오맵·네이버지도 링크에서 브라우저만으로 읽을 수 있는 것(장소 ID·좌표·이름)만 뽑는다
function parseMapLink(text) {
  const out = { kind: null, id: null, lat: null, lon: null, name: '', short: false };
  let u; try { u = new URL(text); } catch { return out; }
  const host = u.hostname, path = decode(u.pathname), q = u.searchParams;
  if (/(^|\.)(kko\.to|naver\.me)$/.test(host)) { out.short = true; return out; }   // 단축 링크는 열어 볼 수 없다
  const c = coordsFromLink(text);
  if (c) { out.lat = c.lat; out.lon = c.lon; }
  if (/kakao\.com$/.test(host)) {
    out.kind = 'kakao';
    out.id = (path.match(/^\/(\d{5,})\/?$/) || [])[1] || q.get('itemId') || q.get('id') || null;
    const m = path.match(/\/link\/(?:map|to|from)\/([^,/]+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (m) { out.name = m[1]; if (inKorea(+m[2], +m[3])) { out.lat = +m[2]; out.lon = +m[3]; } }
    if (!out.name) out.name = q.get('q') || '';
  } else if (/naver\.com$/.test(host)) {
    out.kind = 'naver';
    out.id = (path.match(/\/place\/(\d+)/) || path.match(/\/(?:restaurant|hospital|beauty|accommodation)\/(\d+)/) || [])[1] || null;
    const sm = path.match(/\/search\/([^/]+)/);
    if (sm) out.name = sm[1];
  }
  return out;
}
async function kakaoApi(path, params) {
  let r;
  try { r = await fetch('https://dapi.kakao.com/v2/local/' + path + '?' + new URLSearchParams(params), { headers: { Authorization: 'KakaoAK ' + kakaoKey() } }); }
  catch { throw new Error('카카오 검색에 연결하지 못했어요.'); }
  if (r.status === 401 || r.status === 403) { markKakao('bad'); throw new Error(KAKAO_DENIED); }
  if (r.ok) markKakao('ok');
  if (!r.ok) throw new Error('카카오 검색에 실패했어요. 잠시 후 다시 시도해 주세요.');
  return r.json();
}
const kPlace = d => ({ id: d.id, name: d.place_name, addr: d.road_address_name || d.address_name || '', phone: d.phone || '',
  lat: +d.y, lon: +d.x, url: d.place_url || '', cat: (d.category_name || '').split(' > ').slice(-2).join(' > ') });
const nomAddr = a => [...new Set([a.state, a.city || a.county, a.borough || a.city_district, a.suburb, a.road, a.house_number].filter(Boolean))].join(' ');
const weddingLike = p => /웨딩|결혼|예식/.test(p.cat + p.name);
async function reverseAddr(pt) {
  try {
    if (kakaoKey()) {
      const d = (await kakaoApi('geo/coord2address.json', { x: pt.lon, y: pt.lat })).documents?.[0];
      if (d) return d.road_address?.address_name || d.address?.address_name || '';
    } else {
      const j = await nomGet(`reverse?format=jsonv2&zoom=18&accept-language=ko&lat=${pt.lat}&lon=${pt.lon}`);
      if (j.address) return nomAddr(j.address);
    }
  } catch {}
  return '';
}
async function findPlaces(name, info) {
  if (kakaoKey()) {                                              // 이름으로 장소 검색: 주소·전화·좌표·장소 링크
    const base = { query: name, size: 8 };
    let docs = [];
    if (info.lat != null) docs = (await kakaoApi('search/keyword.json', { ...base, x: info.lon, y: info.lat, radius: 3000, sort: 'distance' })).documents || [];
    if (!docs.length) docs = (await kakaoApi('search/keyword.json', base)).documents || [];
    return docs.map(kPlace);
  }
  const j = await nomGet('search?format=json&limit=5&addressdetails=1&accept-language=ko&countrycodes=kr&q=' + encodeURIComponent(name));
  return j.map(x => ({ id: 'osm' + x.place_id, name: x.name || name, addr: x.address ? nomAddr(x.address) : '', phone: '', lat: +x.lat, lon: +x.lon, url: '', cat: 'OpenStreetMap' }));
}
function formLoc() {
  const f = $('form');
  let addr = f.addr.value.trim(), link = f.link.value.trim();
  if (isUrl(addr)) { link = link || addr; addr = ''; }
  if (link && !isUrl(link)) link = '';
  return { addr, link, gt: addr || link };
}
let lookJob = 0, lastLook = '', draftCands = [];
function applyPlace(p) {
  const f = $('form');
  $('manual').open = true;                                        // 자동 입력된 주소·전화번호를 보여 준다
  if (!f.name.value.trim()) f.name.value = p.name;
  f.addr.value = p.addr;
  if (p.phone) f.phone.value = p.phone;
  if (!f.link.value.trim() && p.url) f.link.value = p.url;
  draftGeo = { addr: formLoc().gt, geo: { lat: p.lat, lon: p.lon } };
  $('cands').innerHTML = '';
  setHint($('lookHint'), `${p.name}${p.addr ? ' · ' + p.addr : ''}${p.approx ? ' (링크 지도 중심 기준, 주소를 확인해 주세요)' : ''}`, false, true);
  showDistance({ lat: p.lat, lon: p.lon });
}
async function lookup(force) {
  const f = $('form'), hint = $('lookHint');
  const sh = splitShare(f.link.value);
  if (sh.url) {
    if (sh.url !== f.link.value.trim()) f.link.value = sh.url;
    if (!f.name.value.trim() && sh.label) f.name.value = sh.label.slice(0, 60);
  } else if (sh.label) {                                         // 링크 칸에 이름을 적은 경우
    if (!f.name.value.trim()) f.name.value = sh.label.slice(0, 60);
    f.link.value = '';
  }
  const link = f.link.value.trim(), name = f.name.value.trim(), stamp = name + '|' + link;
  if (!force && stamp === lastLook) return;
  lastLook = stamp;
  const info = parseMapLink(link), q = name || info.name, my = ++lookJob;
  $('cands').innerHTML = '';
  if (!q && info.lat == null) {
    setHint(hint, info.short ? '단축 링크(naver.me, kko.to)는 위치를 읽을 수 없어요. 예식장 이름을 입력하거나, 주소창에 보이는 전체 링크를 붙여넣어 주세요.' : '예식장 이름이나 지도 링크를 먼저 입력해 주세요.', true);
    return;
  }
  setHint(hint, '정보를 찾는 중…');
  try {
    let list = q ? await findPlaces(q, info) : [];
    if (my !== lookJob) return;
    if (!list.length && info.lat != null)                        // 검색 결과가 없으면 링크 좌표로 주소만 채움
      list = [{ id: '', name: q, addr: await reverseAddr(info), phone: '', lat: info.lat, lon: info.lon, url: '', cat: '', approx: true }];
    if (my !== lookJob) return;
    if (!list.length) throw new Error(kakaoKey()
      ? '검색 결과가 없어요. 이름을 줄여서 다시 해보거나 주소를 직접 입력해 주세요.'
      : '위치를 찾지 못했어요. 카카오 REST API 키를 설정하면 이름만으로도 찾을 수 있어요. 아니면 주소를 직접 입력해 주세요.');
    list.sort((a, b) => weddingLike(b) - weddingLike(a));        // 웨딩홀·예식장 분류를 앞으로
    let pick = info.kind === 'kakao' && info.id ? list.find(x => x.id === info.id) : null;
    if (!pick) { const w = list.filter(weddingLike); pick = list.length === 1 ? list[0] : w.length === 1 ? w[0] : null; }
    if (pick) applyPlace(pick);
    else {
      draftCands = list;
      $('cands').innerHTML = list.map((x, i) => `<button type="button" class="cand" data-i="${i}"><b>${esc(x.name)}</b><span>${esc(x.addr)}${x.cat ? ' · ' + esc(x.cat) : ''}</span></button>`).join('');
      setHint(hint, `후보 ${list.length}곳 — 맞는 곳을 선택해 주세요.`);
    }
  } catch (err) {
    if (my === lookJob) setHint(hint, err instanceof TypeError ? '검색 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.' : err.message, true);
  }
}

function straightKm(a, b) {
  const t = x => x * Math.PI / 180, dLat = t(b.lat - a.lat), dLon = t(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
async function distanceKm(from, to) {
  try { // 자동차 도로 기준
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`);
    const j = await r.json();
    if (j.routes?.[0]) return { km: Math.round(j.routes[0].distance / 100) / 10, k: '도로' };
  } catch {}
  return { km: Math.round(straightKm(from, to) * 10) / 10, k: '직선' };
}

// 현재 기준 위치에 대해 거리가 없는 예식장을 차례로 계산 (옛 데이터는 주소로 좌표도 찾음)
let job = 0;
async function ensureDistances() {
  const my = ++job, orgs = O.list.slice();
  const todo = halls.filter(h => needsGeo(h) || (h.lat != null && orgs.some(o => !h.dists?.[o.id])));
  let n = 0;
  for (const h of todo) {
    if (my !== job) return;
    busy = `거리 계산 중 (${++n}/${todo.length})`; render();
    try {
      if (h.lat == null) { const g = await geocode(geoSrc(h)); h.lat = g.lat; h.lon = g.lon; }
      for (const o of orgs) if (!h.dists?.[o.id]) (h.dists ??= {})[o.id] = await distanceKm(o, h);
    } catch { if (h.lat == null) h.geoFail = true; }
    save();
  }
  if (my === job) { busy = ''; render(); }
}

// ───────── 목록 ─────────
function visible() {
  const q = query.toLowerCase();
  let r = halls.filter(h => !q || [h.name, h.memo, h.addr, h.phone].filter(Boolean).join(' ').toLowerCase().includes(q));
  // 거리 미확인 항목은 거리순(가까운순·먼순 모두)에서 맨 뒤로
  const near = h => distFor(h) ?? Infinity;
  const far = h => distFor(h) ?? -1;
  const by = {
    cheap: byPrice(1),
    expensive: byPrice(-1),
    near: (a, b) => near(a) - near(b) || byPrice(1)(a, b),
    far: (a, b) => far(b) - far(a) || byPrice(1)(a, b),
    all: (a, b) => b.created - a.created,          // 전체: 최근 등록한 순
  }[sort];
  return r.sort(by);
}

function dirUrl(h) {
  if (h.lat == null) return linkOf(h) || 'https://map.naver.com/p/search/' + encodeURIComponent(addrOf(h) || h.name);
  const o = curOrigin(), nm = s => encodeURIComponent(s.replace(/,/g, ' '));
  return `https://map.naver.com/p/directions/${o.lon},${o.lat},${nm(o.name)}/${h.lon},${h.lat},${nm(h.name)}/-/car`;
}
function distText(h) {
  const d = h.dists?.[cur], km = distFor(h);
  const pin = icon('pin') + ' ';
  if (km != null) return `${pin}${esc(curOrigin().name)}에서 ${km}km${d?.k === '직선' ? ' (직선)' : ''}`;
  return pin + (h.lat != null || needsGeo(h) ? '거리 계산 중…' : '거리 미확인');
}

// 카드 한 장의 HTML (시안이 window.HALL_UI.cardHtml 로 바꿔 쓸 수 있다). 버튼은 data-act(like/edit/del/view)를 유지해야 한다.
function cardHtml(h, ctx) {
  const t = total(h), { priced, min, max } = ctx;
  return `
  <article class="card">
    <div class="body">
      <div class="namerow">
        <div class="nm">
          <div class="name">${esc(h.name)}</div>
          <button class="starbtn${h.liked ? ' on' : ''}" data-id="${h.id}" data-act="like" aria-pressed="${!!h.liked}" aria-label="관심" title="관심">${icon('star', h.liked ? 'on' : '')}</button>
        </div>
        <div class="tools">
          <a class="tool navi" href="${esc(dirUrl(h))}" target="_blank" rel="noopener" aria-label="길찾기" title="길찾기">${icon('nav')}</a>
          <button class="tool" data-id="${h.id}" data-act="edit" aria-label="수정" title="수정">${icon('edit')}</button>
          <button class="tool danger" data-id="${h.id}" data-act="del" aria-label="삭제" title="삭제">${icon('trash')}</button>
        </div>
      </div>
      <div class="price${t == null ? ' pending' : ''}">${fmtPrice(t)}${priced.length > 1 && t === min ? '<span class="badge">최저가</span>' : ''}${priced.length > 1 && t === max && max !== min ? '<span class="badge">최고가</span>' : ''}</div>
      ${h.meal && h.guests ? `<div class="meta">대관료 ${fmtPrice(h.price)} + 식대 ${h.meal}만×${h.guests}명</div>` : ''}
      ${h.extras?.length ? `<ul class="ex">${h.extras.map(e => `<li>${esc(e.label)}: ${fmtPrice(total(h, e.price))}</li>`).join('')}</ul>` : ''}
      <div class="meta locrow"><span class="dist">${distText(h)}</span>${addrOf(h) ? `<span class="addr">${esc(addrOf(h))}</span>` : ''}</div>
      ${h.phone ? `<div class="meta"><a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${esc(h.phone)}</a></div>` : ''}
      ${linkOf(h) ? `<div class="meta"><a href="${esc(linkOf(h))}" target="_blank" rel="noopener">지도에서 보기</a></div>` : ''}
      ${h.memo ? `<div class="memo">${esc(h.memo)}</div>` : ''}
    </div>
    ${h.photos?.length ? `<div class="actions"><button class="btn wide" data-id="${h.id}" data-act="view">${icon('photo')} 사진 ${h.photos.length}장 보기</button></div>` : ''}
  </article>`;
}

function render() {
  const r = visible();
  const priced = halls.map(h => total(h)).filter(n => n != null);          // 상담전은 최저가·최고가 비교에서 제외
  const min = Math.min(...priced), max = Math.max(...priced);
  const ctx = { rows: r, priced, min, max, api: API };
  $('count').innerHTML = `총 <b>${halls.length}</b>건` + (query ? ` · 검색 ${r.length}건` : '') + (busy ? ` · ${esc(busy)}` : '');
  $('lead').innerHTML = UI.lead ? UI.lead(ctx) : '';
  $('list').innerHTML = r.length ? r.map(h => (UI.cardHtml || cardHtml)(h, ctx)).join('')
    : `<div class="empty">${halls.length ? '검색 결과가 없어요.' : '아직 등록된 예식장이 없어요.<br><button class="btn primary" data-act="add">' + icon('plus') + ' 예식장 추가</button>'}</div>`;
  if (UI.afterRender) UI.afterRender(ctx);
}

// ───────── 기준 주소 (설정 시트 안에서 관리) ─────────
const homeId = () => O.defId;
function renderOrigins() {
  const box = $('olist'); if (!box) return;
  box.innerHTML = O.list.map(o => `
    <div class="orow">
      <div><b>${esc(o.name)}</b>${o.id === cur ? ' <span class="badge on">막대 기준</span>' : ''}
        <div class="meta">${esc(o.addr)}</div></div>
      <div class="oact">
        ${o.id === cur ? '' : `<button type="button" class="btn" data-oid="${esc(o.id)}" data-oact="use">막대에 표시</button>`}
        <button type="button" class="btn" data-oid="${esc(o.id)}" data-oact="edit">수정</button>
        ${o.id === homeId() ? '' : `<button type="button" class="btn danger" data-oid="${esc(o.id)}" data-oact="del">삭제</button>`}
      </div>
    </div>`).join('');
}
// 목록 막대에 보여 줄 기준 주소를 바꾸면 가까운순으로 정렬한다 (모든 주소의 거리는 펼치면 함께 보인다)
function setOrigin(id) {
  cur = id; sort = 'near'; $('sort').value = 'near';
  renderOrigins(); render(); ensureDistances();
}

// ───────── 사진 / 편집창 ─────────
// 사진을 가로 1000px 이하 JPEG로 줄여서 저장 공간을 아낀다
function shrink(file) {
  return new Promise((ok, fail) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 1000 / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); fail(); };
    img.src = url;
  });
}

function drawThumbs() {
  $('thumbs').innerHTML = draftPhotos.map((p, i) =>
    `<div class="thumb"><img src="${p}" alt=""><button type="button" data-i="${i}" aria-label="사진 삭제">×</button></div>`).join('');
}
function drawExtras() {
  $('extras').innerHTML = draftExtras.map((e, i) => `
    <div class="exrow">
      <input data-i="${i}" data-k="label" value="${esc(e.label)}" placeholder="예: 토요일 12시 / 10월 / 평일" maxlength="40">
      <input data-i="${i}" data-k="price" type="number" min="0" step="any" inputmode="decimal" value="${esc(e.price)}" placeholder="대관료(만원)">
      <button type="button" class="x" data-del="${i}" aria-label="삭제">×</button>
    </div>`).join('');
}
function updateTotal() {
  const f = $('form'), price = parseFloat(f.price.value);
  if (isNaN(price)) {                                              // 대관료를 안 적었으면 상담전
    const meal = (parseFloat(f.meal.value) || 0) * (parseInt(f.guests.value) || 0);
    $('totalHint').innerHTML = meal ? `${icon('wallet')} 대관료 상담전 · 식대 합계 ${fmtPrice(meal)}` : '';
    return;
  }
  const t = total({ price, meal: parseFloat(f.meal.value) || 0, guests: parseInt(f.guests.value) || 0 });
  $('totalHint').innerHTML = `${icon('wallet')} 총 예상 ${fmtPrice(t)} (대관료 + 식대×보증인원)`;
}
// 상담 예정일(오늘 포함)이 있으면 아직 상담 전이라 금액을 못 적는다. 날짜가 지나면 상담 결과 금액을 적는다.
const LOOK_TIP = '이름이나 링크를 넣고 ↵ 를 누르면 주소·전화번호가 자동 입력돼요';
let stash = null;   // 잠글 때 치워 둔 값 — 날짜를 바꿔 잠금이 풀리면 되돌린다
function applyVisitLock() {
  const f = $('form'), v = visitInfo({ visit: f.visit.value }), lock = !!v?.plan, box = $('cost');
  if (lock && !box.disabled) { stash = { price: f.price.value, meal: f.meal.value, guests: f.guests.value, extras: draftExtras }; f.price.value = f.meal.value = f.guests.value = ''; draftExtras = []; }
  else if (!lock && stash) { f.price.value = stash.price; f.meal.value = stash.meal; f.guests.value = stash.guests; draftExtras = stash.extras; stash = null; }
  box.disabled = lock; drawExtras(); updateTotal();
  setHint($('visitHint'), lock ? '상담 전이라 금액은 상담일이 지난 뒤에 입력할 수 있어요.' : v ? '상담은 어땠나요? 상담 결과 금액을 입력해 주세요.' : '');
}
function setHint(el, msg, err, ok) {
  el.innerHTML = (err ? icon('alert') + ' ' : ok ? icon('check') + ' ' : '') + esc(msg);
  el.className = 'hint' + (err ? ' err' : ok ? ' ok' : '');
}

function openEditor(id) {
  editing = id;
  const h = halls.find(x => x.id === id);
  const f = $('form');
  f.reset();
  $('dlgTitle').textContent = h ? '예식장 수정' : '예식장 추가';
  f.name.value = h?.name ?? '';
  f.addr.value = h ? addrOf(h) : '';
  f.link.value = h ? linkOf(h) : '';
  f.phone.value = h?.phone ?? '';
  $('manual').open = !!(h && (addrOf(h) || h.phone));             // 값이 있을 때만 펼쳐 둔다
  f.price.value = h?.price ?? '';
  f.meal.value = h?.meal ?? '';
  f.guests.value = h?.guests ?? '';
  f.memo.value = h?.memo ?? '';
  f.visit.value = h?.visit ?? ''; stash = null; $('cost').disabled = false;
  draftPhotos = [...(h?.photos ?? [])];
  draftExtras = (h?.extras ?? []).map(e => ({ ...e }));
  draftGeo = null; warnedAddr = null; lastLook = ''; draftCands = []; previewJob++; lookJob++;
  $('cands').innerHTML = ''; setHint($('lookHint'), ''); $('lookHint').textContent = LOOK_TIP;
  setHint($('distHint'), '');
  drawThumbs(); drawExtras(); updateTotal(); applyVisitLock();
  $('dlg').showModal();
}

// 위치가 정해지면 기준 위치에서의 거리를 미리 보여준다
async function showDistance(geo) {
  const hint = $('distHint'), key = formLoc().gt;
  setHint(hint, '거리 계산 중…');
  const rs = await Promise.all(O.list.map(async o => ({ o, d: await distanceKm(o, geo) })));
  if (formLoc().gt === key)
    setHint(hint, rs.map(r => `${esc(r.o.name)} ${r.d.km}km${r.d.k === '직선' ? '(직선)' : ''}`).join(' · '), false, true);
}
// 주소를 직접 고치고 칸을 벗어나면 다시 좌표를 찾는다
let previewJob = 0;   // 창을 닫았다 다시 열어도 이전 검색 결과가 끼어들지 않게 한다
async function previewDistance() {
  const { gt } = formLoc(), hint = $('distHint'), my = ++previewJob;
  if (!gt) { setHint(hint, ''); return; }
  if (draftGeo?.addr === gt) return showDistance(draftGeo.geo);
  setHint(hint, '거리 계산 중…');
  try {
    const geo = await geocode(gt);
    if (my !== previewJob) return;
    draftGeo = { addr: gt, geo };
    await showDistance(geo);
  } catch (e) { if (my === previewJob) setHint(hint, e.message, true); }
}

$('addBtn').onclick = () => openEditor(null);
$('originBtn').onclick = () => window.openSettings?.();
$('cancel').onclick = () => $('dlg').close();
$('form').addr.onchange = previewDistance;
$('form').link.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); lookup(true); } });
$('linkGo').onclick = () => lookup(true);
$('form').name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); lookup(true); } });
$('cands').onclick = e => { const b = e.target.closest('.cand'); if (b) applyPlace(draftCands[+b.dataset.i]); };
['price', 'meal', 'guests'].forEach(n => $('form')[n].addEventListener('input', updateTotal));
$('form').visit.addEventListener('input', applyVisitLock);
$('form').visit.addEventListener('change', applyVisitLock);
$('addEx').onclick = () => { draftExtras.push({ label: '', price: '' }); drawExtras(); };
$('extras').oninput = e => { const { i, k } = e.target.dataset; if (i != null) draftExtras[+i][k] = e.target.value; };
$('extras').onclick = e => { const i = e.target.dataset.del; if (i != null) { draftExtras.splice(+i, 1); drawExtras(); } };
async function addPhotos(input) {
  for (const f of input.files) {
    try { draftPhotos.push(await shrink(f)); } catch { alert(f.name + ' 파일을 읽을 수 없어요.'); }
  }
  input.value = '';
  drawThumbs();
}
$('files').onchange = e => addPhotos(e.target);
$('camInput').onchange = e => addPhotos(e.target);
// 사진 추가: 카메라 촬영 / 앨범 선택 중에서 고른다
$('photoBtn').onclick = () => $('psheet').showModal();
$('pCancel').onclick = () => $('psheet').close();
$('pCam').onclick = () => { $('psheet').close(); $('camInput').click(); };
$('pAlbum').onclick = () => { $('psheet').close(); $('files').click(); };
$('psheet').addEventListener('click', e => { if (e.target === $('psheet')) $('psheet').close(); });
$('thumbs').onclick = e => {
  const i = e.target.dataset.i;
  if (i != null) { draftPhotos.splice(+i, 1); drawThumbs(); }
};

$('form').onsubmit = async e => {
  e.preventDefault();
  const f = $('form'), btn = $('saveBtn'), { addr, link, gt } = formLoc();
  const old = halls.find(x => x.id === editing);
  btn.disabled = true;
  try {
    // 좌표: 주소·링크가 그대로면 기존 값, 아니면 자동 입력으로 찾은 값, 없으면 새로 검색
    let geo = null;
    const keep = old && addrOf(old) === addr && linkOf(old) === link && old.lat != null;
    if (keep) geo = { lat: old.lat, lon: old.lon };
    else if (draftGeo?.addr === gt) geo = draftGeo.geo;
    else if (gt && warnedAddr !== gt) {
      setHint($('distHint'), '주소로 위치를 찾는 중…');
      try { geo = await geocode(gt); }
      catch (err) {
        warnedAddr = gt;
        setHint($('distHint'), err.message + ' 그대로 저장하려면 저장을 다시 눌러 주세요(거리는 표시되지 않아요).', true);
        return;
      }
    }
    const data = {
      name: f.name.value.trim(),
      addr,
      link,
      phone: f.phone.value.trim(),
      price: f.price.value === '' ? null : Number(f.price.value),   // 비워 두면 상담전
      meal: f.meal.value === '' ? null : Number(f.meal.value),
      guests: f.guests.value === '' ? null : Math.round(Number(f.guests.value)),
      extras: draftExtras.filter(x => x.label.trim() && x.price !== '' && !isNaN(x.price)).map(x => ({ label: x.label.trim(), price: Number(x.price) })),
      memo: f.memo.value.trim(),
      visit: f.visit.value || '',
      photos: draftPhotos,
      lat: geo?.lat ?? null, lon: geo?.lon ?? null,
      dists: keep ? old.dists ?? {} : {},
      geoFail: !geo,
      distance: null,
    };
    if (geo) for (const o of O.list) if (!data.dists[o.id]) data.dists[o.id] = await distanceKm(o, geo);
    if (old) Object.assign(old, data);
    else halls.push({ id: String(Date.now()), created: Date.now(), liked: false, ...data });
    save(); render();
    $('dlg').close();
    ensureDistances();
  } finally { btn.disabled = false; }
};

$('list').onclick = e => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  if (t.dataset.act === 'add') return openEditor(null);
  const h = halls.find(x => x.id === t.dataset.id);
  if (t.dataset.act === 'edit') openEditor(h.id);
  else if (t.dataset.act === 'like') { h.liked = !h.liked; save(); render(); }
  else if (t.dataset.act === 'del') {
    if (confirm(`“${h.name}”을(를) 삭제할까요?`)) { halls = halls.filter(x => x !== h); save(); render(); }
  } else if (t.dataset.act === 'view') { $('lbBody').innerHTML = h.photos.map(x => `<img src="${x}" alt="">`).join(''); $('lb').showModal(); }
};
$('lb').onclick = () => $('lb').close();

// ───────── 기준 위치 관리창 ─────────
window.addEventListener('wedding-kakao-changed', () => { lastLook = ''; });
let editingO = null; // 수정 중인 기준 주소 id (없으면 신규 추가)
const oHint = (t, err, ok) => { const el = $('oHint'); if (el) setHint(el, t, err, ok); };
function resetOForm() {
  editingO = null; document.querySelectorAll('#oform input').forEach(i => { i.value = ''; });
  $('oTitle').textContent = '기준 주소 추가'; $('oadd').textContent = '추가'; $('oCancelEdit').hidden = true;
}
// 설정 시트의 "기준 주소" 칸을 관리 화면으로 바꿔 넣는다 (집 주소 수정 · 그 외 주소 추가/삭제)
function initOriginUI() {
  const sec = document.getElementById('wsOrig'); if (!sec || $('olist')) return;
  sec.insertAdjacentHTML('beforeend', `
    <div id="olist"></div>
    <div class="sect" id="oTitle">기준 주소 추가</div>
    <div class="oform" id="oform" role="group" aria-label="기준 주소">
      <input name="oname" maxlength="20" placeholder="이름 (예: 회사, 부모님 댁)" aria-label="이름">
      <input name="oaddr" maxlength="300" placeholder="주소 또는 네이버지도 링크" aria-label="주소">
      <div class="hint" id="oHint" aria-live="polite"></div>
      <div class="row"><button type="button" class="btn" id="oCancelEdit" hidden>수정 취소</button><button type="button" class="btn primary" id="oadd">추가</button></div>
    </div>`);
  sec.querySelector('#wsOrigGo')?.remove();
  $('oform').oname = sec.querySelector('[name=oname]'); $('oform').oaddr = sec.querySelector('[name=oaddr]');
  $('oCancelEdit').onclick = () => { resetOForm(); oHint(''); };
  $('olist').onclick = e => {
    const b = e.target.closest('[data-oact]'); if (!b) return;
    const id = b.dataset.oid, o = O.list.find(x => x.id === id), act = b.dataset.oact;
    if (act === 'use') setOrigin(id);
    else if (act === 'edit') {
      const f = $('oform'); editingO = id; f.oname.value = o.name; f.oaddr.value = o.addr;
      $('oTitle').textContent = `수정 — ${o.name}`; $('oadd').textContent = '저장'; $('oCancelEdit').hidden = false; oHint(''); f.oaddr.focus();
    } else if (act === 'del' && confirm(`“${o.name}” 주소를 삭제할까요?`)) {
      O.list = O.list.filter(x => x.id !== id); halls.forEach(h => { if (h.dists) delete h.dists[id]; }); save(); saveO();
      if (cur === id) setOrigin(O.defId); else { renderOrigins(); render(); }
    }
  };
  $('oadd').onclick = async () => {
    const f = $('oform'), btn = $('oadd'), name = f.oname.value.trim(), addr = f.oaddr.value.trim();
    if (!name || !addr) return oHint('이름과 주소를 모두 입력해 주세요.', true);
    const old = O.list.find(x => x.id === editingO);
    btn.disabled = true; oHint('위치를 찾는 중…');
    try {
      if (old) {
        if (old.addr !== addr) { const g = await geocode(addr); old.lat = g.lat; old.lon = g.lon; halls.forEach(h => { if (h.dists) delete h.dists[old.id]; }); save(); }
        old.name = name; old.addr = addr; saveO(); resetOForm(); oHint(`“${name}” 수정됨`, false, true);
      } else {
        const g = await geocode(addr);
        O.list.push({ id: 'o' + Date.now(), name, addr, lat: g.lat, lon: g.lon }); saveO(); resetOForm();
        oHint(`“${name}” 추가됨 — 등록된 예식장의 거리도 계산해요.`, false, true);
      }
      renderOrigins(); render(); ensureDistances();
    } catch (err) { oHint(err.message, true); }
    finally { btn.disabled = false; }
  };
  renderOrigins();
}
window.addEventListener('wedding-sheet-ready', initOriginUI); initOriginUI();

// ───────── 비교표 ─────────
$('cmpBtn').onclick = () => {
  const L = halls.filter(h => h.liked).sort(byPrice(1));
  $('cmpBody').innerHTML = L.length < 2
    ? '<div class="empty">비교하려면 “관심” 표시한 예식장이 2곳 이상 필요해요.</div>'
    : (() => {
      const best = (vals, fn) => { const v = vals.filter(x => x != null); return v.length > 1 ? fn(...v) : null; };
      const totals = L.map(h => total(h)), dists = L.map(distFor);
      const bt = best(totals, Math.min), bd = best(dists, Math.min);
      const row = (label, cell) => `<tr><th class="rl">${label}</th>${L.map(cell).join('')}</tr>`;
      return `<div class="tblwrap"><table>
        <tr><th class="rl"></th>${L.map(h => `<th>${esc(h.name)}</th>`).join('')}</tr>
        ${row('총액', h => `<td class="${total(h) != null && total(h) === bt ? 'best' : ''}">${fmtPrice(total(h))}</td>`)}
        ${row('대관료', h => `<td>${fmtPrice(h.price)}</td>`)}
        ${row('식대 1인', h => `<td>${h.meal ? h.meal + '만원' : '-'}</td>`)}
        ${row('보증인원', h => `<td>${h.guests ? h.guests + '명' : '-'}</td>`)}
        ${row('요금표', h => `<td>${h.extras?.length ? h.extras.map(x => `${esc(x.label)}: ${fmtPrice(total(h, x.price))}`).join('<br>') : '-'}</td>`)}
        ${O.list.map(o => row(`거리 · ${esc(o.name)}`, h => { const d = h.dists?.[o.id]?.km ?? (o.id === cur ? distFor(h) : null); return `<td class="${d != null && o.id === cur && d === bd ? 'best' : ''}">${d != null ? d + 'km' : '-'}</td>`; })).join('')}
        ${row('주소', h => `<td>${esc(addrOf(h) || '-')}${linkOf(h) ? `<br><a href="${esc(linkOf(h))}" target="_blank" rel="noopener">지도 링크</a>` : ''}</td>`)}
        ${row('전화', h => `<td>${h.phone ? `<a href="tel:${esc(h.phone.replace(/[^\d+]/g, ''))}">${esc(h.phone)}</a>` : '-'}</td>`)}
        ${row('상담', h => { const v = visitInfo(h); return `<td>${v ? esc(v.label) : '-'}</td>`; })}
        ${row('메모', h => `<td>${esc(h.memo || '-')}</td>`)}
      </table></div><div class="hint" style="margin-top:6px">강조 표시는 최저 총액 / “${esc(curOrigin().name)}”에서 가장 가까운 곳</div>`;
    })();
  $('cmp').showModal();
};
$('cmpClose').onclick = () => $('cmp').close();

$('sort').onchange = e => { sort = e.target.value; render(); };
$('searchForm').onsubmit = e => { e.preventDefault(); query = $('q').value.trim(); render(); };
$('q').addEventListener('input', () => { if (query && !$('q').value.trim()) { query = ''; render(); } });   // 검색어를 지우면 전체 목록

$('sort').value = sort;
const API = { esc, icon, fmtPrice, total, byPrice, distFor, distsOf, setOrigin, addrOf, linkOf, dirUrl, distText, visitInfo, curOrigin, isUrl, needsGeo, rerender: () => render(), get halls() { return halls; }, get origins() { return O.list; }, get curId() { return cur; }, get sort() { return sort; } };
window.HALL_API = API;
if (UI.setup) UI.setup(API);
renderOrigins();
render();
ensureDistances();
// 로드맵 화면의 설정에서 넘어오면 설정 시트를 바로 연다
{ const q = new URLSearchParams(location.search); if (q.get('settings') === '1' || q.get('origins') === '1') { history.replaceState(null, '', location.pathname); window.addEventListener('load', () => window.openSettings?.()); } }