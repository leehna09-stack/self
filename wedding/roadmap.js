/* 결혼 로드맵 공통 로직 — 디자인 시안(design-a/b/c.html)이 공유한다.
   순서 원칙: 방향 합의 → 상견례 → 웨딩홀(날짜 확정) → 스드메·신혼집·신혼여행 → 혼수·본식 디테일 → 청첩장 → 막바지 → 혼인신고
   dueDays = 결혼식 며칠 전까지 끝내길 권장하는지 (음수는 결혼 후), h = 아이콘 타일 색상(hue) */
(function () {
'use strict';
const KEY = 'wedding-roadmap-v1';
const HALL_KEY = 'wedding-halls-v1';
const DAY = 864e5;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* 아이콘 글리프 (24x24, 라인) — 입체감은 CSS가 입힌다 */
const GL = {
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2 3 7h18Z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  box: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  gem: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6M2 9h20"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>'
};
const gl = n => `<svg class="gl" viewBox="0 0 24 24" aria-hidden="true">${GL[n]}</svg>`;

const STAGES = [
  { id: 's0', icon: 'compass', h: 212, title: '방향 맞추기', when: 'D-12개월 이전', dueDays: 365,
    why: '이후 모든 선택(웨딩홀·집·스드메)이 예산과 시기에서 갈라져요. 둘이 먼저 같은 그림을 그리는 단계예요.',
    tasks: [
      { id: 't0a', t: '희망 결혼 시기와 예식 규모(하객 수)를 둘이 이야기하기' },
      { id: 't0b', t: '총 예산과 양가 지원 범위를 대략 정하기', tip: '가용 자금에서 역산하세요. 참고: 한국소비자원 기준 웨딩홀 패키지+스드메 전국 평균 약 2,141만원(서울 강남 약 3,339만원)이에요.' },
      { id: 't0c', t: '부모님께 결혼 계획을 알리고 인사드리기' },
      { id: 't0d', t: '꼭 지키고 싶은 우선순위 3가지 정하기 (예: 웨딩홀, 신혼집, 신혼여행)', opt: true }
    ] },
  { id: 's1', icon: 'users', h: 28, title: '상견례', when: 'D-12~11개월', dueDays: 330,
    why: '양가가 공식적으로 만나 결혼 진행 방식의 큰 틀을 맞추는 자리예요.',
    tasks: [
      { id: 't1a', t: '양가 부모님과 가능한 날짜 조율하기', tip: '각자 부모님께 먼저 말씀드리고 날짜를 맞추는 순서가 매끄러워요.' },
      { id: 't1b', t: '참석 인원 확인 후 조용한 룸이 있는 식당 예약하기' },
      { id: 't1c', t: '예식·예물·주거 등 진행 방식을 금액 단정 없이 범위 위주로 대화하기', tip: '구체적인 금액은 나중에 따로 정해도 괜찮아요.' },
      { id: 't1d', t: '상견례 후 양가에 감사 연락 드리기', opt: true }
    ] },
  { id: 's2', icon: 'landmark', h: 340, title: '웨딩홀 계약 · 날짜 확정', when: 'D-12~10개월 (성수기 주말은 1년 전)', dueDays: 300, hall: true,
    link: { href: 'hall.html', label: '웨딩홀 비교 앱 열기' },
    why: '결혼식 날짜가 정해져야 나머지 모든 일정을 역산할 수 있어요. 가장 먼저 확정해야 하는 핵심 단계예요.',
    tasks: [
      { id: 't2a', t: '희망 날짜·시간대 후보 2~3개 정하기', tip: '3~4월 좋은 날·점심 시간대는 1년 전에 마감되기도 해요. 비수기는 2~3개월 전에도 예약되는 경우가 있어요.' },
      { id: 't2b', t: '웨딩홀 3곳 이상 투어하고 비교표에 기록하기', tip: '아래 웨딩홀 비교 앱에 대관료·식대·보증인원을 기록하고 별표(관심)로 비교해요.' },
      { id: 't2c', t: '식대에 음료·주류가 포함되는지, 보증인원, 추가 비용 확인하기' },
      { id: 't2d', t: '계약서에 상담 내용이 반영됐는지 확인하고 계약금 납부하기' },
      { id: 't2e', t: '확정된 결혼식 날짜를 이 앱 설정에 입력하기', tip: '입력하면 모든 단계의 권장 기한이 자동으로 계산돼요.' }
    ] },
  { id: 's3', icon: 'camera', h: 282, title: '스드메 (스튜디오·드레스·메이크업)', when: 'D-8~6개월', dueDays: 210,
    why: '인기 업체는 일찍 마감돼요. 웨딩홀을 잡은 뒤 바로 상담을 시작하는 편이 안전해요.',
    tasks: [
      { id: 't3a', t: '웨딩플래너 이용 여부 정하기', opt: true },
      { id: 't3b', t: '스튜디오·드레스·메이크업 업체 2~3곳 상담받기' },
      { id: 't3c', t: '추가 비용 확인하기 (원본 파일, 드레스 피팅비, 메이크업 추가 요금 등)', tip: '구두 설명 말고 계약서에 적혀 있는지 확인하세요. 한국소비자원 기준 스드메 패키지 전국 중앙값은 약 294만원이에요.' },
      { id: 't3d', t: '패키지 계약하고 촬영 일정 잡기' }
    ] },
  { id: 's4', icon: 'home', h: 148, title: '신혼집', when: 'D-6~4개월', dueDays: 150,
    why: '가장 큰 지출이라 혼수·이사 일정과 대출 일정이 모두 여기에 달려 있어요.',
    tasks: [
      { id: 't4a', t: '거주 지역·형태(전세/월세/매매)와 예산 정하기' },
      { id: 't4b', t: '신혼부부 대출·지원 제도 알아보기', tip: '혼인신고 후 전세대출 금리 우대 등이 있을 수 있어요. 조건은 바뀌므로 은행·기관에 직접 확인하세요.' },
      { id: 't4c', t: '매물을 보고 계약하기 (잔금·입주일이 결혼 일정과 맞는지 확인)' },
      { id: 't4d', t: '이사 업체·입주 일정 정하기', opt: true }
    ] },
  { id: 's5', icon: 'plane', h: 192, title: '신혼여행 · 예물 · 예단', when: 'D-6~4개월', dueDays: 150,
    why: '항공·숙소는 일찍 예약할수록 선택지가 많아요. 예물·예단은 양가와 미리 범위를 맞추면 갈등이 줄어요.',
    tasks: [
      { id: 't5a', t: '신혼여행 지역·기간을 정하고 항공·숙소 예약하기' },
      { id: 't5b', t: '여권 만료일 확인하기 (국가별 잔여 유효기간 요건 확인)' },
      { id: 't5c', t: '예물 범위를 상의하고 준비하기', tip: '요즘은 평소에도 착용하기 좋은 실속형을 고르는 경우가 많아요.' },
      { id: 't5d', t: '예단 여부와 범위를 양가와 상의하기', opt: true }
    ] },
  { id: 's6', icon: 'box', h: 38, title: '혼수 · 가전 · 가구', when: 'D-4~2개월', dueDays: 90,
    why: '신혼집이 정해져야 크기와 구조에 맞게 살 수 있어요. 배송 시기는 입주일에 맞춰요.',
    tasks: [
      { id: 't6a', t: '신혼집 구조·평수를 확인하고 필요한 목록 만들기' },
      { id: 't6b', t: '가전·가구를 비교해 구매하기 (이미 가진 것은 제외)' },
      { id: 't6c', t: '배송·설치 날짜를 입주 일정에 맞춰 조율하기' }
    ] },
  { id: 's7', icon: 'gem', h: 258, title: '본식 디테일 확정', when: 'D-3~1.5개월', dueDays: 60,
    why: '결혼식 당일 분위기를 결정하는 세부 사항을 마무리하는 단계예요.',
    tasks: [
      { id: 't7a', t: '드레스 가봉(피팅)하고 신랑 예복 맞춤·대여하기' },
      { id: 't7b', t: '본식 스냅·영상 작가 섭외하기' },
      { id: 't7c', t: '사회·축가(·주례) 섭외하고 식순 정하기' },
      { id: 't7d', t: '식사 메뉴·꽃 장식 등 웨딩홀 옵션 확정하기' },
      { id: 't7e', t: '혼주 메이크업·한복 예약하기' }
    ] },
  { id: 's8', icon: 'mail', h: 355, title: '청첩장 · 하객 정리', when: 'D-2~1개월', dueDays: 45,
    why: '하객 명단이 정리되어야 보증인원을 확정할 수 있어요.',
    tasks: [
      { id: 't8a', t: '양가·친구·직장 하객 명단 정리하기' },
      { id: 't8b', t: '청첩장 디자인 고르고 모바일 청첩장 만들기', tip: '디자인 선정은 6개월 전부터 미리 해도 돼요.' },
      { id: 't8c', t: '청첩장 전달·발송하기 (식 1~2개월 전)' },
      { id: 't8d', t: '참석 여부를 파악해 예상 인원 정리하기' }
    ] },
  { id: 's9', icon: 'clip', h: 172, title: '막바지 점검', when: 'D-2주~당일', dueDays: 7,
    why: '실수 없이 당일을 맞기 위한 최종 확인 단계예요.',
    tasks: [
      { id: 't9a', t: '웨딩홀에 최종 보증인원 알리기' },
      { id: 't9b', t: '업체별 잔금을 정리하고 당일 일정표 공유하기' },
      { id: 't9c', t: '축의금 접수 담당자 정하기' },
      { id: 't9d', t: '당일 준비물 챙기기 (신분증, 반지, 사례비 봉투 등)' },
      { id: 't9e', t: '신혼여행 짐 싸기·환전하기', opt: true }
    ] },
  { id: 's10', icon: 'heart', h: 328, title: '혼인신고 · 결혼 후 정리', when: '결혼식 직후~1개월', dueDays: -30,
    why: '법적으로 부부가 되는 절차와 주소·대출 등 생활 변경을 마무리해요.',
    tasks: [
      { id: 't10a', t: '혼인신고하기 (정부24 또는 관할 주민센터)', tip: '필요 서류와 절차는 바뀔 수 있으니 정부24나 주민센터에서 최신 기준을 확인하세요.' },
      { id: 't10b', t: '전입신고하고 신혼집 계약서 확정일자 받기' },
      { id: 't10c', t: '신혼부부 대출 금리 우대·세제 혜택 신청 가능 여부 확인하기' },
      { id: 't10d', t: '도와주신 분들께 감사 인사하고 사진·영상 수령 확인하기', opt: true }
    ] }
];

const DEF = { date: '', budget: 0, checks: {}, started: {}, memo: {}, est: {}, act: {}, custom: {} };
let S = load();
let openId = null;
let toastTimer;

function load() {
  try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return Object.assign({}, DEF); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('저장 공간이 부족하거나 막혀 있어요'); } }
function toast(msg) {
  const el = $('toast'); el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

const tasksOf = st => st.tasks.concat((S.custom[st.id] || []).map(c => ({ id: c.id, t: c.t, custom: true })));
const reqOf = st => tasksOf(st).filter(t => !t.opt);
const prog = st => { const r = reqOf(st); return { done: r.filter(t => S.checks[t.id]).length, total: r.length }; };
const isDone = st => { const p = prog(st); return p.done === p.total; };

function today() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function weddingDate() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(S.date)) return null;
  const [y, m, d] = S.date.split('-').map(Number); return new Date(y, m - 1, d);
}
const fmt = d => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
function dueOf(st) { const w = weddingDate(); return w ? new Date(w.getTime() - st.dueDays * DAY) : null; }
function hallStats() {
  try { const h = JSON.parse(localStorage.getItem(HALL_KEY)) || []; return { n: h.length, liked: h.filter(x => x.liked).length }; } catch { return { n: 0, liked: 0 }; }
}
const man = v => (Number(v) || 0).toLocaleString('ko-KR');
const tile = (st, state, cls = '') => `<span class="tile ${state} ${cls}" style="--h:${st.h}">${gl(st.icon)}${state === 'done' ? `<span class="bdg">${gl('check')}</span>` : state === 'lock' ? `<span class="bdg">${gl('lock')}</span>` : ''}</span>`;

/* 뼈대 주입 */
document.body.insertAdjacentHTML('beforeend', `
<main class="wrap">
  <header class="nav">
    <div><p class="eyebrow">작은 걸음부터 하나씩</p><h1>결혼 로드맵</h1></div>
    <button class="iconbtn" id="setBtn" aria-label="설정">${gl('gear')}</button>
  </header>
  <div id="app"></div>
  <p class="note">단계 순서와 권장 시기는 웨딩홀·스드메·청첩장 준비 일정에 관한 공개 체크리스트와 가이드를 종합한 일반적인 기준이에요. 시즌·지역·업체 사정에 따라 달라질 수 있어요. 비용(한국소비자원 참가격 기준 웨딩홀 패키지+스드메 전국 평균 약 2,141만원)과 대출·세제·혼인신고 서류는 바뀔 수 있으니 반드시 해당 기관에서 최신 기준을 확인하세요. 모든 기록은 이 브라우저에만 저장돼요.</p>
</main>
<nav class="tabbar" aria-label="메뉴">
  <button class="tab on" id="tabHome" aria-current="page">${gl('list')}<span>로드맵</span></button>
  <a class="tab" href="hall.html">${gl('landmark')}<span>웨딩홀</span></a>
  <button class="tab" id="tabSet">${gl('gear')}<span>설정</span></button>
</nav>
<dialog id="sdlg" aria-labelledby="sh">
  <form class="sheet" id="sform" method="dialog">
    <div class="grab" aria-hidden="true"></div>
    <h2 id="sh">설정</h2>
    <label>결혼식 날짜 <small>정해지면 입력하세요. 단계별 권장 기한이 계산돼요.</small>
      <input type="date" id="fDate">
    </label>
    <label>총 예산 (만원)
      <input type="number" id="fBudget" min="0" inputmode="numeric" placeholder="예: 5000">
    </label>
    <div class="sublbl">백업</div>
    <div class="actions">
      <button type="button" class="btn sm" id="exp">내보내기</button>
      <label class="btn sm filebtn">가져오기<input type="file" id="imp" accept="application/json" hidden></label>
      <button type="button" class="btn sm danger" id="reset">전체 초기화</button>
    </div>
    <div class="foot">
      <button type="button" class="btn" id="sclose">닫기</button>
      <button type="submit" class="btn primary">저장</button>
    </div>
  </form>
</dialog>
<div class="toast" id="toast" role="status" hidden></div>`);

function render() {
  const cur = STAGES.findIndex(s => !isDone(s));
  if (openId === null) openId = cur >= 0 ? STAGES[cur].id : STAGES[STAGES.length - 1].id;

  let doneT = 0, totT = 0, est = 0, act = 0;
  STAGES.forEach(s => { const p = prog(s); doneT += p.done; totT += p.total; est += Number(S.est[s.id]) || 0; act += Number(S.act[s.id]) || 0; });
  const pct = totT ? Math.round(doneT / totT * 100) : 0;
  const doneStages = STAGES.filter(isDone).length;
  const C = 2 * Math.PI * 52;

  const w = weddingDate();
  let dd = '날짜 미정', ddSub = '웨딩홀 계약 후 설정에서 날짜를 입력하세요';
  if (w) {
    const n = Math.round((w - today()) / DAY);
    dd = n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : `D+${-n}`;
    ddSub = `${fmt(w)} 결혼식`;
  }

  let nowHtml;
  if (cur < 0) {
    nowHtml = `<div class="now alldone"><span class="nbody"><span class="lbl">완료</span><span class="t">모든 단계를 마쳤어요. 결혼을 축하해요!</span></span></div>`;
  } else {
    const st = STAGES[cur], p = prog(st);
    const nxt = reqOf(st).find(t => !S.checks[t.id]);
    nowHtml = `<div class="now">${tile(st, 'cur', 'lg')}
      <span class="nbody"><span class="lbl">지금 할 단계 · ${cur + 1}/${STAGES.length}</span>
      <span class="t">${esc(st.title)}</span>
      <span class="sub">${nxt ? '다음 할 일: ' + esc(nxt.t) : ''} (${p.done}/${p.total})</span></span>
      <button class="btn primary sm nbtn" data-act="open" data-id="${st.id}">이 단계 열기 ${gl('arrow')}</button></div>`;
  }

  const dots = STAGES.map((s, i) => `<i class="${isDone(s) ? 'd' : i === cur ? 'c' : ''}"></i>`).join('');
  const hero = `<section class="hero" aria-label="전체 진행 상황">
    <div class="ringbox" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="전체 진행률">
      <svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop class="rg1" offset="0"/><stop class="rg2" offset="1"/></linearGradient></defs>
        <circle class="rt" cx="60" cy="60" r="52"/><circle class="rp" cx="60" cy="60" r="52" stroke-dasharray="${(pct / 100 * C).toFixed(1)} ${C.toFixed(1)}"/></svg>
      <div class="ringtxt"><b>${pct}<small>%</small></b><span>진행</span></div>
    </div>
    <div class="heroinfo"><div class="dday">${dd}</div><div class="sub">${esc(ddSub)}</div><div class="sub">${doneStages}/${STAGES.length}단계 완료</div></div>
    <div class="dots" aria-hidden="true">${dots}</div>
    <div class="stats">
      <div class="stat"><b>${man(est)}만</b><span>예상 비용${S.budget ? ' / 예산 ' + man(S.budget) + '만' : ''}</span></div>
      <div class="stat"><b class="${S.budget && act > S.budget ? 'over' : ''}">${man(act)}만</b><span>실제 지출</span></div>
    </div>${nowHtml}</section>`;

  const list = STAGES.map((st, i) => {
    const p = prog(st), done = p.done === p.total;
    const isCur = i === cur, locked = !done && !isCur && !S.started[st.id] && i > cur;
    const open = openId === st.id;
    const due = dueOf(st);
    let meta = esc(st.when);
    if (due) {
      const late = !done && !locked && due < today();
      meta = `~${fmt(due)} 권장` + (late ? ' <span class="late">· 기한 지남</span>' : '');
    }
    const state = done ? 'done' : isCur ? 'cur' : locked ? 'lock' : 'todo';
    const cls = ['stage', done ? 'done' : isCur ? 'cur' : locked ? 'lock' : '', open ? 'open' : ''].join(' ');
    let body = '';
    if (open) {
      const tasks = tasksOf(st).map(t => {
        const on = !!S.checks[t.id];
        return `<li class="task ${on ? 'on' : ''}">
          <button class="chk" data-act="check" data-id="${t.id}" aria-pressed="${on}" aria-label="${esc(t.t)} ${on ? '완료됨' : '미완료'}" ${locked ? 'disabled' : ''}><span>${on ? gl('check') : ''}</span></button>
          <div class="tbody"><div class="tt">${esc(t.t)}${t.opt ? '<span class="opt">선택</span>' : ''}</div>${t.tip ? `<div class="tip">${esc(t.tip)}</div>` : ''}</div>
          ${t.custom ? `<button class="del" data-act="deltask" data-sid="${st.id}" data-id="${t.id}" aria-label="할 일 삭제">×</button>` : '<span></span>'}
        </li>`;
      }).join('');

      let hallBox = '';
      if (st.hall) {
        const h = hallStats();
        hallBox = `<div class="hallinfo"><div>저장된 웨딩홀 <b>${h.n}곳</b> · 관심 <b>${h.liked}곳</b></div>
          <a class="btn primary sm" href="${st.link.href}">${esc(st.link.label)}</a></div>`;
      }

      let foot = '';
      if (done) {
        const nx = STAGES[i + 1];
        foot = `<div class="donebox"><span>${gl('check')} 이 단계를 마쳤어요</span>${nx ? `<button class="btn sm" data-act="open" data-id="${nx.id}">다음: ${esc(nx.title)} ${gl('arrow')}</button>` : '<span>모든 단계 완료! 결혼을 축하해요</span>'}</div>`;
      }

      body = `<div class="sbody">
        <p class="why">${esc(st.why)}</p>
        ${locked ? `<div class="lockbox"><span>${gl('lock')} 앞 단계를 먼저 마치면 열려요. 미리 준비하고 싶다면 먼저 시작할 수 있어요.</span><button class="btn sm" data-act="start" data-id="${st.id}">먼저 시작하기</button></div>` : ''}
        ${hallBox}
        <ul class="tasks">${tasks}</ul>
        <form class="addrow" data-act="addtask" data-id="${st.id}"><input type="text" name="t" maxlength="80" placeholder="내 할 일 추가" aria-label="내 할 일 추가"><button class="btn sm" type="submit">추가</button></form>
        ${foot}
        <div class="money">
          <label>예상 비용 (만원)<input type="number" min="0" step="any" inputmode="decimal" data-field="est" data-id="${st.id}" value="${S.est[st.id] ?? ''}"></label>
          <label>실제 지출 (만원)<input type="number" min="0" step="any" inputmode="decimal" data-field="act" data-id="${st.id}" value="${S.act[st.id] ?? ''}"></label>
        </div>
        <label>메모 (업체 연락처, 계약 내용 등)<textarea rows="3" data-field="memo" data-id="${st.id}">${esc(S.memo[st.id] || '')}</textarea></label>
      </div>`;
    }
    return `<li class="${cls}"><button class="shead" data-act="toggle" data-id="${st.id}" aria-expanded="${open}">
      ${tile(st, state)}
      <span class="stxt"><span class="stitle">${esc(st.title)}</span><span class="smeta">${i + 1} · ${meta} · ${p.done}/${p.total}</span></span>
      <span class="chev">${gl('chev')}</span></button>${body}</li>`;
  }).join('');

  $('app').innerHTML = hero + `<h2 class="sect">단계별 로드맵</h2><ol class="timeline">${list}</ol>`;
}

const app = $('app');
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'FORM') return;
  const { act, id } = b.dataset;
  if (act === 'toggle') { openId = openId === id ? '' : id; render(); }
  else if (act === 'open') {
    openId = id; render();
    const el = app.querySelector(`[data-act="toggle"][data-id="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  else if (act === 'start') { S.started[id] = true; save(); render(); }
  else if (act === 'check') {
    const st = STAGES.find(s => tasksOf(s).some(t => t.id === id));
    const was = isDone(st);
    S.checks[id] = !S.checks[id]; if (!S.checks[id]) delete S.checks[id];
    save(); render();
    if (!was && isDone(st)) toast(`'${st.title}' 단계를 마쳤어요`);
  }
  else if (act === 'deltask') {
    const sid = b.dataset.sid;
    S.custom[sid] = (S.custom[sid] || []).filter(c => c.id !== id); delete S.checks[id]; save(); render();
  }
});
app.addEventListener('submit', e => {
  const f = e.target.closest('[data-act="addtask"]'); if (!f) return;
  e.preventDefault();
  const t = f.t.value.trim(); if (!t) return;
  const id = f.dataset.id;
  (S.custom[id] = S.custom[id] || []).push({ id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t });
  save(); render();
  const inp = app.querySelector(`[data-act="addtask"][data-id="${id}"] input`); if (inp) inp.focus();
});
app.addEventListener('change', e => {
  const el = e.target.closest('[data-field="est"],[data-field="act"]'); if (!el) return;
  const v = el.value === '' ? '' : Math.max(0, Number(el.value) || 0);
  if (v === '') delete S[el.dataset.field][el.dataset.id]; else S[el.dataset.field][el.dataset.id] = v;
  save(); render();
});
app.addEventListener('input', e => {
  const el = e.target.closest('[data-field="memo"]'); if (!el) return;
  S.memo[el.dataset.id] = el.value; save();
});

/* 설정 시트 */
const openSettings = () => { $('fDate').value = S.date || ''; $('fBudget').value = S.budget || ''; $('sdlg').showModal(); };
$('setBtn').onclick = openSettings;
$('tabSet').onclick = openSettings;
$('tabHome').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
$('sclose').onclick = () => $('sdlg').close();
$('sdlg').addEventListener('click', e => { if (e.target === $('sdlg')) $('sdlg').close(); });
$('sform').onsubmit = () => {
  S.date = $('fDate').value || ''; S.budget = Math.max(0, Number($('fBudget').value) || 0);
  save(); render();
};
$('exp').onclick = () => {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'wedding-roadmap.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('imp').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!d || typeof d !== 'object' || Array.isArray(d)) throw 0;
    S = Object.assign({}, DEF, d); save(); openId = null; render(); $('sdlg').close(); toast('가져왔어요');
  } catch { toast('올바른 백업 파일이 아니에요'); }
  e.target.value = '';
};
$('reset').onclick = () => {
  if (!confirm('로드맵의 모든 체크와 기록을 지울까요? (웨딩홀 비교 데이터는 유지돼요)')) return;
  S = Object.assign({}, DEF); save(); openId = null; render(); $('sdlg').close();
};

render();
})();
