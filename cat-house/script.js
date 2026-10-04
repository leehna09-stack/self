// ===== 변수 (맨 위에서 먼저 만들기) =====

// 수정 중인 일정의 번호표 (빈 글자면 새 일정 추가 중)
let editingId = "";

// 상세창에 열려 있는 날짜
let currentDetailDate = "";

// 지금 달력에서 보고 있는 장소 ("산본집" 또는 "제주도")
let viewPlace = "산본집";

// 지금 보고 있는 달 (처음에는 오늘이 속한 달)
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0=1월, 1=2월, ... 11=12월

// 가족 이름 목록
const people = ["엄마", "아빠", "한나", "한비"];

// 장소 목록
const placeList = ["산본집", "제주도", "송정지구"];

// 각 사람의 평소 위치 (일정이 없는 날의 기본값)
const defaultPlaces = {
  "엄마": "제주도",
  "아빠": "제주도",
  "한나": "송정지구",
  "한비": "산본집"
};

// 일정을 담아둘 배열 (인터넷 저장소에서 받아와서 채워져요)
const schedules = [];

// 보고 있는 달의 사진들 ("2026-10-05" → [{ id, image, by, savedAt }, ...] 오래된 것이 앞)
let photos = {};

// 하루(장소별)에 남길 수 있는 사진 수, 그리고 직전에 그린 사진 수 (늘었는지 확인용)
const MAX_PHOTOS = 5;
let photoBusy = false; // 사진을 올리는 중인지
let lastPhotoCount = 0;

// 보고 있는 달의 날씨·한줄평 ("2026-10-05" → { weather, note, noteBy ... })
let days = {};

// 날씨 종류 (저장은 key로, 화면에는 icon)
const weatherList = [
  { key: "sun", icon: "☀️", label: "맑음" },
  { key: "cloud", icon: "⛅", label: "구름" },
  { key: "overcast", icon: "☁️", label: "흐림" },
  { key: "rain", icon: "🌧️", label: "비" },
  { key: "typhoon", icon: "🌀", label: "태풍" }
];

// 상세창에 열린 날짜의 한줄평들 / 수정 중인 한줄평 번호표 / 하루 최대 개수
let notes = [];
let editingNoteId = "";
const MAX_NOTES = 10;

// 새 소식(다른 사람이 올린 사진·한줄평) 기록과, 어디까지 확인했는지 저장하는 이름표
let activity = [];
const SEEN_KEY = "catHouseSeen";
let seenFallback = Date.now();
const READ_KEY = "catHouseRead";
const NOTIF_KEEP_MS = 14 * 24 * 60 * 60 * 1000;  // 새 소식은 2주 동안 목록에 남김
let readFallback = {};

// 지금 쓰는 사람 이름 (이 폰에 저장해 둠)
const USER_KEY = "catHouseUser";

// 인터넷 저장소에 연결됐는지
let cloudConnected = false;

// 가족 코드를 이 폰에 저장해 두는 이름표
const CODE_KEY = "catHouseFamilyCode";

// ===== 날짜/위치 계산 =====

// 연, 월, 일 숫자를 "2026-10-05" 같은 글자로 바꿔주는 함수
function makeDateString(year, month, day) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return year + "-" + m + "-" + d;
}

// 어떤 날짜에 그 사람이 어디 있는지 알려주는 함수
function getPlace(person, date) {
  for (let i = 0; i < schedules.length; i++) {
    const s = schedules[i];
    if (s.person === person && date >= s.startDate && date <= s.endDate) {
      return s.place;
    }
  }
  return defaultPlaces[person];
}

// 특정 날짜에 산본집에 사람이 있는지 (true/false)
function hasPersonAtHome(dateString) {
  for (let i = 0; i < people.length; i++) {
    if (getPlace(people[i], dateString) === "산본집") {
      return true;
    }
  }
  return false;
}

// 그 날짜가 빈집 며칠째인지 (사람이 있는 날이면 0)
function getEmptyDays(dateString) {
  let count = 0;
  let current = new Date(dateString);

  // 하루씩 거슬러 올라가며 빈집인 날을 센다 (최대 60일까지만 확인)
  for (let i = 0; i < 60; i++) {
    const str = makeDateString(current.getFullYear(), current.getMonth(), current.getDate());
    if (hasPersonAtHome(str)) {
      break;
    }
    count = count + 1;
    current.setDate(current.getDate() - 1);
  }
  return count;
}

// 번호표(id)로 일정 하나 찾기
function findSchedule(id) {
  for (let i = 0; i < schedules.length; i++) {
    if (schedules[i].id === id) {
      return schedules[i];
    }
  }
  return null;
}

// ===== 가족 코드 / 인터넷 저장소 연결 =====

// 이 폰에 저장된 가족 코드 꺼내기
function getSavedCode() {
  try {
    return localStorage.getItem(CODE_KEY) || "";
  } catch (e) {
    return "";
  }
}

// 이 폰에 저장된 사용자 이름 꺼내기
function getUser() {
  try {
    const name = localStorage.getItem(USER_KEY) || "";
    return people.indexOf(name) >= 0 ? name : "";
  } catch (e) {
    return "";
  }
}

// 하단에 현재 사용자 표시
function updateUserInfo() {
  const name = getUser();
  document.getElementById("userInfo").textContent = name === "" ? "" : "👤 " + name;
}

// 사용자 선택창 열기
function openUserModal() {
  // 아직 사용자를 안 골랐으면 닫기 버튼을 숨김
  document.getElementById("userCloseBtn").style.display = getUser() === "" ? "none" : "";
  document.getElementById("userModal").classList.remove("hidden");
}

// 사용자 선택창 닫기 (이미 골랐을 때만)
function closeUserModal() {
  if (getUser() === "") {
    return;
  }
  document.getElementById("userModal").classList.add("hidden");
}

// 사용자 선택
function chooseUser(name) {
  try {
    localStorage.setItem(USER_KEY, name);
  } catch (e) {
    alert("이 브라우저에서는 저장할 수 없어요. 시크릿 모드가 아닌지 확인해 주세요.");
    return;
  }
  document.getElementById("userModal").classList.add("hidden");
  updateUserInfo();
  updateBell();
}

// 사용자를 아직 안 골랐으면 선택창을 띄움
function ensureUser() {
  updateUserInfo();
  if (getUser() === "") {
    openUserModal();
  }
}

// 가족 코드 입력창 열기
function openCodeModal() {
  document.getElementById("familyCodeInput").value = "";
  // 저장된 코드가 없으면 닫기 버튼을 숨김 (코드 없이는 못 쓰니까)
  document.getElementById("codeCloseBtn").style.display =
    getSavedCode() === "" ? "none" : "";
  document.getElementById("codeModal").classList.remove("hidden");
  document.getElementById("familyCodeInput").focus();
}

// 가족 코드 입력창 닫기 (저장된 코드가 있을 때만)
function closeCodeModal() {
  if (getSavedCode() === "") {
    return;
  }
  document.getElementById("codeModal").classList.add("hidden");
}

// "입장하기" 버튼: 코드를 검사하고 저장한 뒤 연결
function saveCode() {
  const code = document.getElementById("familyCodeInput").value.trim();

  if (!/^[A-Za-z0-9_-]{20,}$/.test(code)) {
    alert("가족 코드는 영문·숫자로 20글자 이상이에요. 공백이나 특수문자가 없는지 확인해 주세요.");
    return;
  }

  try {
    localStorage.setItem(CODE_KEY, code);
  } catch (e) {
    alert("이 브라우저에서는 코드를 저장할 수 없어요. 시크릿 모드가 아닌지 확인해 주세요.");
    return;
  }

  document.getElementById("codeModal").classList.add("hidden");
  connectCloud(code);
  ensureUser();
}

// 인터넷 저장소에 연결
function connectCloud(code) {
  document.getElementById("codeInfo").textContent = "🔑 " + code.slice(0, 4) + "…";
  window.cloud.start(code, onCloudData, onCloudStatus);
  cloudConnected = true;
  watchMonthPhotos();
  activity = [];
  window.cloud.watchActivity(Math.max(getSeen(), Date.now() - NOTIF_KEEP_MS), onActivityData);
}

// ===== 종 알림 (다른 사람이 올린 사진·한줄평) =====

// 마지막으로 새 소식을 확인한 시각 (처음이면 지금부터 셈)
function getSeen() {
  try {
    const saved = Number(localStorage.getItem(SEEN_KEY));
    if (saved > 0) {
      return saved;
    }
    localStorage.setItem(SEEN_KEY, String(seenFallback));
  } catch (e) {
    // 저장소를 못 쓰면 이번 접속 동안만 기억
  }
  return seenFallback;
}

// 눌러서 확인한 소식 목록 { 소식 id: 올라온 시각 }
function getReadMap() {
  try {
    const saved = JSON.parse(localStorage.getItem(READ_KEY));
    if (saved && typeof saved === "object") {
      return saved;
    }
  } catch (e) {
    // 저장소를 못 쓰면 이번 접속 동안만 기억
  }
  return readFallback;
}

// 소식들을 확인한 것으로 저장 (오래된 기록은 정리)
function markRead(items) {
  const map = getReadMap();
  const limit = Date.now() - NOTIF_KEEP_MS;
  const next = {};
  Object.keys(map).forEach(function (id) {
    if (map[id] > limit) {
      next[id] = map[id];
    }
  });
  items.forEach(function (a) {
    next[a.id] = a.at;
  });
  readFallback = next;
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(next));
  } catch (e) {
    // 저장소를 못 쓰면 이번 접속 동안만 기억
  }
}

// 아직 누르지 않은 새 소식 (내가 올린 건 제외, 최신이 위)
function getUnseen() {
  const seen = getSeen();
  const user = getUser();
  const readMap = getReadMap();
  const list = [];
  for (let i = 0; i < activity.length; i++) {
    const a = activity[i];
    if (a.at > seen && a.by !== user && !readMap[a.id]) {
      list.push(a);
    }
  }
  list.sort(function (x, y) {
    return y.at - x.at;
  });
  return list;
}

// 새 소식 기록이 도착하면 실행
function onActivityData(list) {
  activity = list;
  updateBell();
}

// 종 아이콘의 숫자 표시
function updateBell() {
  const count = getUnseen().length;
  const badge = document.getElementById("bellBadge");
  badge.hidden = (count === 0);
  badge.textContent = count > 9 ? "9+" : String(count);
  document.getElementById("bellBtn").setAttribute(
    "aria-label", count === 0 ? "새 소식" : "새 소식 " + count + "개");
}

// 종을 누르면 아직 안 누른 새 소식 목록을 보여줌 (소식을 눌러야 확인한 것으로 처리)
function openNotif() {
  drawNotifList();
  document.getElementById("notifModal").classList.remove("hidden");
  document.querySelector("#notifModal .modal-title .round-btn").focus();
}

// 새 소식 목록 그리기
function drawNotifList() {
  const list = document.getElementById("notifList");
  list.innerHTML = "";

  const unseen = getUnseen();
  if (unseen.length === 0) {
    const li = document.createElement("li");
    li.className = "note-empty";
    li.textContent = "새 소식이 없어요";
    list.appendChild(li);
  }

  for (let i = 0; i < unseen.length; i++) {
    const a = unseen[i];
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = a.by + " 님이 " + a.place + " " + a.date +
      (a.type === "photo" ? " 사진을 올렸어요 📷" : " 한줄평을 남겼어요 💬");
    btn.onclick = function () {
      gotoActivity(a);
    };
    li.appendChild(btn);
    list.appendChild(li);
  }

  document.getElementById("notifReadAllBtn").hidden = (unseen.length === 0);
}

// 지금 보이는 새 소식을 모두 읽은 것으로 처리 (창은 열어 둠)
function readAllNotif() {
  markRead(getUnseen());
  updateBell();
  drawNotifList();
}

// 새 소식창 닫기
function closeNotif() {
  document.getElementById("notifModal").classList.add("hidden");
}

// 새 소식을 누르면 그 소식만 확인 처리하고, 그 장소의 그 달 그 날짜를 열어 해당 소식이 있는 칸으로 이동
function gotoActivity(a) {
  markRead([a]);
  updateBell();
  closeNotif();
  viewPlace = a.place;
  viewYear = Number(a.date.slice(0, 4));
  viewMonth = Number(a.date.slice(5, 7)) - 1;
  drawCalendar();
  watchMonthPhotos();
  openDetail(a.date);
  // 사진 소식이면 사진 칸으로, 한줄평 소식이면 한줄평 칸으로 바로 내려가서 보여줌
  const target = document.getElementById(a.type === "photo" ? "photoSectionTitle" : "noteSection");
  target.scrollIntoView({ block: "start" });
}

// 지금 보고 있는 장소의 사진 저장 위치 (산본집과 제주도 사진은 따로 저장)
function photoCollection() {
  return viewPlace === "제주도" ? "jejuPhotos" : "photos";
}

// 지금 보고 있는 달의 사진을 받아오기 시작
function watchMonthPhotos() {
  if (!cloudConnected) {
    return;
  }
  photos = {};
  days = {};
  const start = makeDateString(viewYear, viewMonth, 1);
  const end = makeDateString(viewYear, viewMonth, 31);
  window.cloud.watchPhotos(photoCollection(), start, end, onPhotoData);
  window.cloud.watchDays(start, end, onDayData);
}

// 사진이 도착하거나 바뀌면 실행
function onPhotoData(map) {
  photos = map;
  drawCalendar();
  if (!document.getElementById("detailModal").classList.contains("hidden")) {
    drawDetailPhoto();
  }
}

// 날씨·한줄평이 도착하거나 바뀌면 실행
function onDayData(map) {
  days = map;
  drawCalendar();
  if (!document.getElementById("detailModal").classList.contains("hidden")) {
    drawDetailWeather();
    drawDetailPhoto();
    buildNotes();
    drawDetailNotes();
  }
}

// 저장소에서 일정이 도착하면 실행 (처음 + 누군가 바꿀 때마다)
function onCloudData(list) {
  // 같은 사람 일정이 겹치면 시작일이 더 늦은 일정이 우선
  list.sort(function (a, b) {
    if (a.startDate < b.startDate) return 1;
    if (a.startDate > b.startDate) return -1;
    return 0;
  });

  schedules.length = 0;
  for (let i = 0; i < list.length; i++) {
    schedules.push(list[i]);
  }

  drawCalendar();

  // 일정 변경창이 열려 있으면 목록도 새로고침
  if (!document.getElementById("manageModal").classList.contains("hidden")) {
    drawManageList();
  }

  // 날짜 상세창이 열려 있으면 내용도 새로고침
  if (!document.getElementById("detailModal").classList.contains("hidden")) {
    openDetail(currentDetailDate, true);
  }
}

// 연결 상태를 화면 아래 줄에 표시
function onCloudStatus(status, errorCode) {
  const box = document.getElementById("syncStatus");
  if (status === "online") {
    box.textContent = "✓ 가족과 공유 중";
  } else if (status === "syncing") {
    box.textContent = "동기화 중…";
  } else if (status === "connecting") {
    box.textContent = "연결 중…";
  } else if (errorCode === "permission-denied") {
    box.textContent = "⚠ 접근이 거부됐어요 (규칙 확인 필요)";
  } else {
    box.textContent = "⚠ 연결 오류 (" + (errorCode || "알 수 없음") + ")";
  }
}

// 앱이 열리면 가족 코드 확인 후 연결
function startSync() {
  const code = getSavedCode();
  if (code === "") {
    openCodeModal();
  } else {
    connectCloud(code);
    ensureUser();
  }
}

// ===== 달력 =====

// 달력을 그리는 함수
function drawCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  document.getElementById("monthTitle").innerHTML =
    "<small>" + viewYear + "</small>" + (viewMonth + 1) + "월";

  document.getElementById("placeTitle").textContent =
    (viewPlace === "산본집" ? "🏠 " : "🌴 ") + viewPlace;

  const weekNames = ["일", "월", "화", "수", "목", "금", "토"];
  for (let i = 0; i < 7; i++) {
    const head = document.createElement("div");
    head.className = "week-name";
    head.textContent = weekNames[i];
    calendar.appendChild(head);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    calendar.appendChild(empty);
  }

  const now = new Date();
  const todayString = makeDateString(now.getFullYear(), now.getMonth(), now.getDate());

  for (let d = 1; d <= lastDate; d++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";

    const dateString = makeDateString(viewYear, viewMonth, d);

    if (dateString === todayString) {
      cell.classList.add("today");
      cell.setAttribute("aria-current", "date");
    }

    // 날짜 숫자
    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = d;
    cell.appendChild(number);

    // 보고 있는 장소에 있는 사람 이름
    const nameBox = document.createElement("div");
    nameBox.className = "day-names";
    for (let i = 0; i < people.length; i++) {
      if (getPlace(people[i], dateString) === viewPlace) {
        const line = document.createElement("div");
        line.textContent = people[i];
        nameBox.appendChild(line);
      }
    }
    cell.appendChild(nameBox);

    // 산본집 화면에서 아무도 없으면 빈집 일수 + 색 표시
    if (viewPlace === "산본집" && !hasPersonAtHome(dateString)) {
      const emptyDays = getEmptyDays(dateString);
      const label = document.createElement("div");
      label.className = "day-empty-text";
      label.textContent = "빈집 " + emptyDays + "일차";
      cell.appendChild(label);

      if (emptyDays === 2) {
        cell.classList.add("warn-yellow");
      } else if (emptyDays === 3) {
        cell.classList.add("warn-orange");
      } else if (emptyDays >= 4) {
        cell.classList.add("warn-red");
      }
    }

    // 날씨(제주도)·사진·밥줬어요·치웠어요 아이콘은 한 줄로 나란히
    const marks = document.createElement("div");
    marks.className = "day-marks";
    const day = days[dateString];

    // 제주도 달력: 날씨 표시
    if (viewPlace === "제주도") {
      const weather = day ? findWeather(day.weather) : null;
      if (weather) {
        const w = document.createElement("span");
        w.className = "day-weather";
        w.textContent = weather.icon;
        marks.appendChild(w);
      }
    }

    // 사진이 있는 날은 표시 (산본집·제주도 각각의 사진)
    if (photos[dateString] && photos[dateString].length > 0) {
      const mark = document.createElement("span");
      mark.className = "day-photo";
      mark.textContent = "📷";
      marks.appendChild(mark);
    }

    // 산본집 달력: 밥줬어요 / 치웠어요 표시
    if (viewPlace === "산본집" && day) {
      for (let i = 0; i < careList.length; i++) {
        if (day[careList[i].key] === true) {
          const c = document.createElement("span");
          c.className = "day-care";
          c.textContent = careList[i].icon;
          marks.appendChild(c);
        }
      }
    }

    if (marks.children.length > 0) {
      cell.appendChild(marks);
    }

    // 날짜 칸을 누르면 상세창 열기
    cell.onclick = function () {
      openDetail(dateString);
    };

    calendar.appendChild(cell);
  }
}

// ◀ ▶ 버튼을 누르면 달을 바꾸는 함수
function changeMonth(step) {
  viewMonth = viewMonth + step;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear = viewYear - 1;
  }
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear = viewYear + 1;
  }
  drawCalendar();
  watchMonthPhotos();
}

// 산본집 ↔ 제주도 전환
function switchPlace() {
  viewPlace = (viewPlace === "산본집") ? "제주도" : "산본집";
  drawCalendar();
  watchMonthPhotos();
}

// ===== 일정 입력 =====

// ===== 기간 고르는 달력 (시작일 → 종료일 순서로 누르기) =====

// 기간 달력이 보여주는 달
let pickYear = new Date().getFullYear();
let pickMonth = new Date().getMonth();

// 시작일·종료일 칸의 값이 바뀐 뒤 기간 달력을 다시 맞춤 (시작일이 있는 달로 이동)
function syncPicker() {
  const start = document.getElementById("startDate").value;
  const base = start === "" ? new Date() : new Date(start + "T00:00:00");
  pickYear = base.getFullYear();
  pickMonth = base.getMonth();
  drawRangePicker();
}

// 기간 달력 ◀ ▶ 버튼
function rangeMove(step) {
  pickMonth = pickMonth + step;
  if (pickMonth < 0) {
    pickMonth = 11;
    pickYear = pickYear - 1;
  }
  if (pickMonth > 11) {
    pickMonth = 0;
    pickYear = pickYear + 1;
  }
  drawRangePicker();
}

// 기간 달력에서 날짜를 눌렀을 때
// 처음 누르면 시작일, 다음에 누르면 종료일 (이미 둘 다 있으면 새로 시작)
function pickDate(dateString) {
  const startBox = document.getElementById("startDate");
  const endBox = document.getElementById("endDate");

  if (startBox.value === "" || endBox.value !== "") {
    startBox.value = dateString;
    endBox.value = "";
  } else if (dateString < startBox.value) {
    startBox.value = dateString;
  } else {
    endBox.value = dateString;
  }
  drawRangePicker();
}

// 기간 달력 그리기
function drawRangePicker() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  document.getElementById("rangeMonthTitle").textContent =
    pickYear + "년 " + (pickMonth + 1) + "월";

  let summary = "시작일을 골라 주세요";
  if (start !== "") {
    summary = start + " ~ " + (end === "" ? "종료일을 골라 주세요" : end);
  }
  document.getElementById("rangeSummary").textContent = summary;

  const box = document.getElementById("rangeCalendar");
  box.innerHTML = "";

  const weekNames = ["일", "월", "화", "수", "목", "금", "토"];
  for (let i = 0; i < 7; i++) {
    const head = document.createElement("div");
    head.className = "range-week";
    head.textContent = weekNames[i];
    box.appendChild(head);
  }

  const firstDay = new Date(pickYear, pickMonth, 1).getDay();
  const lastDate = new Date(pickYear, pickMonth + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    box.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= lastDate; d++) {
    const ds = makeDateString(pickYear, pickMonth, d);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "range-day";
    cell.textContent = d;

    const last = end === "" ? start : end;
    if (start !== "" && ds >= start && ds <= last) {
      cell.classList.add("in-range");
    }
    if (ds === start) {
      cell.classList.add("range-edge");
    }
    if (ds === last && start !== "") {
      cell.classList.add("range-edge");
    }

    cell.onclick = function () {
      pickDate(ds);
    };
    box.appendChild(cell);
  }
}

// 일정 입력창 열기 (새 일정)
function openForm() {
  editingId = "";
  const boxes = document.querySelectorAll('input[name="person"]');
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].checked = false;
  }
  const t = new Date();
  document.getElementById("startDate").value =
    makeDateString(t.getFullYear(), t.getMonth(), t.getDate());
  document.getElementById("endDate").value = "";
  syncPicker();
  document.getElementById("saveBtn").textContent = "일정 추가";
  document.getElementById("formModal").classList.remove("hidden");
  document.querySelector("#formModal .modal-title button").focus();
}

// 일정 입력창 닫기
function closeForm() {
  editingId = "";
  document.getElementById("saveBtn").textContent = "일정 추가";
  document.getElementById("formModal").classList.add("hidden");
}

// 오늘부터 N일(오늘 포함)로 시작일·종료일 칸을 채움
function setPeriod(days) {
  const today = new Date();
  const end = new Date();
  end.setDate(today.getDate() + days - 1);

  document.getElementById("startDate").value =
    makeDateString(today.getFullYear(), today.getMonth(), today.getDate());
  document.getElementById("endDate").value =
    makeDateString(end.getFullYear(), end.getMonth(), end.getDate());
  syncPicker();
}

// "일정 추가" (또는 "수정 저장") 버튼을 눌렀을 때 실행되는 함수
function addSchedule() {
  const checked = document.querySelectorAll('input[name="person"]:checked');
  const place = document.getElementById("place").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (checked.length === 0) {
    alert("한 명 이상 선택해 주세요.");
    return;
  }

  if (startDate === "" || endDate === "") {
    alert("시작일과 종료일을 모두 입력해 주세요.");
    return;
  }

  if (endDate < startDate) {
    alert("종료일은 시작일보다 빠를 수 없어요.");
    return;
  }

  if (!window.cloud || getSavedCode() === "") {
    alert("아직 가족 코드로 연결되지 않았어요. 잠시 후 다시 시도해 주세요.");
    return;
  }

  // 새로 넣을 일정 (선택한 사람마다 하나씩)
  const items = [];
  for (let i = 0; i < checked.length; i++) {
    items.push({
      person: checked[i].value,
      place: place,
      startDate: startDate,
      endDate: endDate
    });
  }

  // 수정 중이면 기존 일정은 지우고 새로 저장
  const removeIds = [];
  if (editingId !== "") {
    removeIds.push(editingId);
  }

  window.cloud.save(removeIds, items).catch(function (e) {
    console.log("저장 실패", e);
    alert("저장하지 못했어요. 인터넷 연결과 가족 코드를 확인해 주세요.");
  });

  closeForm();
}

// ===== 날짜 상세 =====

// 날짜 상세창 열기 (keepFocus가 true면 포커스를 옮기지 않음)
function openDetail(dateString, keepFocus) {
  currentDetailDate = dateString;
  document.getElementById("detailTitle").textContent =
    new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    }).format(new Date(dateString + "T00:00:00"));

  const placeIcons = { "산본집": "🏠", "제주도": "🌴", "송정지구": "🏢" };

  // 장소별로 누가 있는지
  const placeBox = document.getElementById("detailPlaces");
  placeBox.innerHTML = "";
  const shownPlaces = ["산본집", "제주도"];
  for (let p = 0; p < shownPlaces.length; p++) {
    const names = [];
    for (let i = 0; i < people.length; i++) {
      if (getPlace(people[i], dateString) === shownPlaces[p]) {
        names.push(people[i]);
      }
    }
    const line = document.createElement("div");
    line.textContent = placeIcons[shownPlaces[p]] + " " + shownPlaces[p] + ": " +
      (names.length > 0 ? names.join(", ") : "없음");
    placeBox.appendChild(line);
  }

  // 빈집이면 경고
  if (!hasPersonAtHome(dateString)) {
    const warn = document.createElement("div");
    warn.className = "detail-warn";
    warn.textContent = "🐱 빈집 " + getEmptyDays(dateString) + "일차";
    placeBox.appendChild(warn);
  }

  // 날씨는 제주도 달력에서만
  document.getElementById("weatherSection").hidden = (viewPlace !== "제주도");
  drawDetailWeather();
  if (!keepFocus) {
    // 새로 열 때는 첫 사진부터 보여줌
    lastPhotoCount = (photos[dateString] || []).length;
    document.getElementById("detailPhoto").innerHTML = "";
  }
  drawDetailPhoto();
  if (!keepFocus) {
    startNotes();
  }

  document.getElementById("detailModal").classList.remove("hidden");
  if (!keepFocus) {
    document.querySelector("#detailModal .modal-title button").focus();
  }
}

// 상세창의 사진 칸 그리기
function drawDetailPhoto() {
  const box = document.getElementById("detailPhoto");
  // 다시 그려도 보던 사진 위치를 유지하려고 미리 기억
  const oldStrip = box.querySelector(".photo-strip");
  const oldScroll = oldStrip ? oldStrip.scrollLeft : 0;
  box.innerHTML = "";

  const list = photos[currentDetailDate] || [];
  const user = getUser();

  if (list.length > 0) {
    // 좌우로 밀어서 넘기는 사진 띠
    const strip = document.createElement("div");
    strip.className = "photo-strip";

    const counter = document.createElement("div");
    counter.className = "photo-count";
    counter.textContent = "1 / " + list.length;

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const slide = document.createElement("div");
      slide.className = "photo-slide";

      // 세로 비율(3:4) 틀 안에 사진을 맞춰 넣음 (가로 사진은 틀 안에서 작게 보이고, 누르면 크게 열림)
      const frame = document.createElement("div");
      frame.className = "photo-frame";
      const img = document.createElement("img");
      img.src = p.image;
      img.alt = currentDetailDate + " 사진 " + (i + 1);
      frame.appendChild(img);
      frame.onclick = function () {
        openPhotoViewer(p.image, img.alt);
      };
      slide.appendChild(frame);

      const by = document.createElement("div");
      by.className = "photo-by";
      by.textContent = p.by ? "📷 " + p.by + " 님이 올렸어요" : "📷";
      slide.appendChild(by);

      // 내가 올린 사진(올린 사람이 기록되지 않은 옛 사진 포함)만 삭제 버튼 표시
      if (!p.by || p.by === user) {
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "icon-btn photo-del";
        delBtn.textContent = "✕";
        delBtn.setAttribute("aria-label", "사진 삭제");
        delBtn.onclick = function () {
          deletePhoto(p.id);
        };
        slide.appendChild(delBtn);
      }

      strip.appendChild(slide);
    }

    // 지금 보고 있는 사진 번호 표시
    strip.addEventListener("scroll", function () {
      // (창이 아직 안 열려 폭이 0일 때는 1번째로 봄)
      const n = Math.round(strip.scrollLeft / (strip.clientWidth || 1)) + 1;
      counter.textContent = Math.min(n, list.length) + " / " + list.length;
    });

    box.appendChild(strip);
    box.appendChild(counter);

    // 사진이 새로 늘었으면 가장 최근 사진(맨 오른쪽)으로 이동
    strip.scrollLeft = list.length > lastPhotoCount ? strip.scrollWidth : oldScroll;
    strip.dispatchEvent(new Event("scroll"));
  }
  lastPhotoCount = list.length;

  // 카메라 / 앨범 / 밥줬어요 / 치웠어요 버튼은 줄바꿈 없이 한 줄에
  const actions = document.createElement("div");
  actions.className = "photo-actions";
  box.appendChild(actions);

  // 카메라로 바로 찍기 / 앨범(갤러리·구글 포토 등)에서 고르기를 나눠서 항상 둘 다 고를 수 있게
  const cameraBtn = document.createElement("button");
  cameraBtn.type = "button";
  cameraBtn.className = "photo-add";
  cameraBtn.textContent = "📷 카메라";
  cameraBtn.disabled = photoBusy;
  cameraBtn.onclick = function () {
    document.getElementById("cameraInput").click();
  };
  actions.appendChild(cameraBtn);

  const albumBtn = document.createElement("button");
  albumBtn.type = "button";
  albumBtn.className = "photo-add";
  albumBtn.textContent = "🖼 앨범 " + list.length + "/" + MAX_PHOTOS;
  albumBtn.disabled = photoBusy;
  albumBtn.onclick = function () {
    document.getElementById("photoInput").click();
  };
  actions.appendChild(albumBtn);

  // 산본집 날짜에만: 밥줬어요 / 치웠어요 표시 (제주도 날씨처럼 같은 걸 다시 누르면 해제)
  if (viewPlace === "산본집") {
    const day = days[currentDetailDate] || {};
    for (let i = 0; i < careList.length; i++) {
      const c = careList[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "care-btn";
      btn.textContent = c.icon + " " + c.label;
      btn.setAttribute("aria-pressed", day[c.key] === true ? "true" : "false");
      btn.onclick = function () {
        toggleCare(c.key, day[c.key] !== true);
      };
      actions.appendChild(btn);
    }
  }

  if (photoBusy) {
    const busyNote = document.createElement("div");
    busyNote.className = "photo-by";
    busyNote.id = "photoBusyNote";
    busyNote.textContent = "사진 올리는 중이에요… 잠시만 기다려 주세요";
    box.appendChild(busyNote);
  }

  if (list.length >= MAX_PHOTOS) {
    const note = document.createElement("div");
    note.className = "photo-by";
    note.textContent = "5장이 넘으면 가장 오래된 사진이 자동으로 지워져요";
    box.appendChild(note);
  }
}

// 일정 시간 안에 끝나지 않으면 실패로 처리 (조용히 멈추는 일이 없게)
function withTimeout(promise, ms, message) {
  return new Promise(function (resolve, reject) {
    const timer = setTimeout(function () {
      reject(new Error(message));
    }, ms);
    promise.then(function (value) {
      clearTimeout(timer);
      resolve(value);
    }, function (error) {
      clearTimeout(timer);
      reject(error);
    });
  });
}

// 캔버스를 JPEG 글자로 (너무 크면 화질을 낮춰서 다시, 저장소 한도 약 1MB)
function encodeCanvas(canvas) {
  let quality = 0.7;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > 700000 && quality > 0.3) {
    quality = quality - 0.1;
    result = canvas.toDataURL("image/jpeg", quality);
  }
  return result;
}

// 사진을 줄여서 글자(JPEG data URL)로 바꾸기 (긴 변 900px)
function shrinkPhoto(file) {
  return readPhoto(file).then(function (pic) {
    const scale = Math.min(1, 900 / Math.max(pic.width, pic.height));
    const base = document.createElement("canvas");
    base.width = Math.max(1, Math.round(pic.width * scale));
    base.height = Math.max(1, Math.round(pic.height * scale));
    const ctx = base.getContext("2d");
    // PNG처럼 투명한 사진이 까맣게 저장되지 않도록 흰 배경을 먼저 깔기
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, base.width, base.height);
    ctx.drawImage(pic.source, 0, 0, base.width, base.height);
    if (pic.close) {
      pic.close();
    }
    let result = encodeCanvas(base);
    // 그래도 크면 크기를 20%씩 더 줄여서 한도 안에 넣기
    let side = Math.max(base.width, base.height);
    while (result.length > 700000 && side > 300) {
      side = Math.round(side * 0.8);
      const ratio = side / Math.max(base.width, base.height);
      const small = document.createElement("canvas");
      small.width = Math.max(1, Math.round(base.width * ratio));
      small.height = Math.max(1, Math.round(base.height * ratio));
      small.getContext("2d").drawImage(base, 0, 0, small.width, small.height);
      result = encodeCanvas(small);
    }
    if (!result.startsWith("data:image/jpeg")) {
      throw new Error("사진을 JPEG로 바꾸지 못했어요");
    }
    return result;
  });
}

// 사진 파일을 통째로 먼저 읽어 두기 (구글 포토 등에서 고른 사진이 나중에 못 읽히는 일을 막음)
function readFileBytes(file) {
  const failMessage = "사진 파일을 읽지 못했어요. 구글 포토의 사진이라면 먼저 폰에 저장한 뒤 다시 골라 주세요";
  if (file.arrayBuffer) {
    return file.arrayBuffer().then(function (buffer) {
      return new Blob([buffer], { type: file.type || "image/jpeg" });
    }, function () {
      throw new Error(failMessage);
    });
  }
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () {
      resolve(new Blob([reader.result], { type: file.type || "image/jpeg" }));
    };
    reader.onerror = function () {
      reject(new Error(failMessage));
    };
    reader.readAsArrayBuffer(file);
  });
}

// 방법 1: createImageBitmap (큰 사진·회전 정보에 강함)
function decodeWithBitmap(blob) {
  if (!window.createImageBitmap) {
    return Promise.reject(new Error("createImageBitmap 없음"));
  }
  return createImageBitmap(blob, { imageOrientation: "from-image" }).catch(function () {
    return createImageBitmap(blob);
  }).then(function (bmp) {
    return {
      source: bmp,
      width: bmp.width,
      height: bmp.height,
      close: function () {
        bmp.close();
      }
    };
  });
}

// 방법 2: <img>로 읽기
function decodeWithImage(blob) {
  return new Promise(function (resolve, reject) {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) {
        reject(new Error("크기를 알 수 없는 사진"));
        return;
      }
      resolve({ source: img, width: width, height: height });
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("img 읽기 실패"));
    };
    img.src = url;
  });
}

// HEIC/HEIF 사진인지 확인 (갤럭시·아이폰의 "고효율" 사진은 Chrome이 못 읽어요)
function isHeicPhoto(file, blob) {
  const name = (file.name || "").toLowerCase();
  if (/hei[cf]/.test(file.type || "") || /\.(heic|heif)$/.test(name)) {
    return Promise.resolve(true);
  }
  // 이름·형식이 비어 있어도 파일 머리말(ftyp + heic 계열 이름표)로 한 번 더 확인
  return blob.slice(0, 32).arrayBuffer().then(function (buffer) {
    const head = new TextDecoder("latin1").decode(new Uint8Array(buffer));
    return head.indexOf("ftyp") === 4 && /(heic|heix|hevc|hevx|heim|heis|mif1|msf1)/.test(head);
  }, function () {
    return false;
  });
}

// HEIC 변환 도구는 필요할 때만 불러와요 (같은 폴더의 heic2any.min.js)
function loadHeicLib() {
  if (window.heic2any) {
    return Promise.resolve();
  }
  return new Promise(function (resolve, reject) {
    const tag = document.createElement("script");
    tag.src = "heic2any.min.js";
    tag.onload = function () {
      resolve();
    };
    tag.onerror = function () {
      reject(new Error("HEIC 변환 도구를 불러오지 못했어요"));
    };
    document.head.appendChild(tag);
  });
}

// HEIC 사진을 JPEG로 바꾸기
function convertHeic(blob) {
  return loadHeicLib().then(function () {
    return withTimeout(window.heic2any({ blob: blob, toType: "image/jpeg", quality: 0.8 }), 60000,
      "HEIC 사진 변환 시간이 너무 오래 걸려요");
  }).then(function (result) {
    return Array.isArray(result) ? result[0] : result;
  });
}

// 사진 읽기 (방법 1 → 방법 2, 각각 20초 제한)
function decodePhoto(blob) {
  return withTimeout(decodeWithBitmap(blob), 20000, "읽기 시간 초과").catch(function () {
    return withTimeout(decodeWithImage(blob), 20000, "읽기 시간 초과");
  });
}

// 사진 파일 읽기: 파일을 먼저 통째로 읽고, 못 읽으면 HEIC인지 확인해서 JPEG로 바꾼 뒤 다시 읽기
function readPhoto(file) {
  return readFileBytes(file).then(function (blob) {
    return decodePhoto(blob).catch(function (firstError) {
      return isHeicPhoto(file, blob).then(function (isHeic) {
        if (!isHeic) {
          throw firstError;
        }
        return convertHeic(blob).then(decodePhoto);
      });
    }).catch(function (error) {
      throw new Error("사진을 읽지 못했어요 (" + (file.type || "형식 알 수 없음") + "). " +
        (error && error.message ? "[" + error.message + "] " : "") + "다른 사진으로 다시 올려 주세요");
    });
  });
}

// 사진 올리는 중 표시 켜고 끄기 (그동안 버튼을 막아서 중복 업로드 방지)
function setPhotoBusy(busy) {
  photoBusy = busy;
  drawDetailPhoto();
}

// 사진 크게 보기 팝업 (사진이나 바깥쪽을 누르면 닫힘)
function openPhotoViewer(src, alt) {
  closePhotoViewer();
  const viewer = document.createElement("div");
  viewer.id = "photoViewer";
  viewer.setAttribute("role", "dialog");
  viewer.setAttribute("aria-modal", "true");
  viewer.setAttribute("aria-label", "사진 크게 보기");
  viewer.onclick = closePhotoViewer;

  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  viewer.appendChild(img);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "round-btn";
  close.textContent = "✕";
  close.setAttribute("aria-label", "닫기");
  close.onclick = closePhotoViewer;
  viewer.appendChild(close);

  document.body.appendChild(viewer);
}

function closePhotoViewer() {
  const viewer = document.getElementById("photoViewer");
  if (viewer) {
    viewer.remove();
  }
}

// 사진을 고르면 줄여서 저장
function onPhotoChosen(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) {
    return;
  }
  if (!cloudConnected) {
    alert("아직 가족 코드로 연결되지 않았어요. 잠시 후 다시 시도해 주세요.");
    return;
  }
  const user = getUser();
  if (user === "") {
    openUserModal();
    return;
  }
  if (photoBusy) {
    return;
  }
  const date = currentDetailDate;
  const collectionName = photoCollection();
  setPhotoBusy(true);
  shrinkPhoto(file).then(function (image) {
    // 넣고 나서 MAX_PHOTOS장을 넘는 만큼 오래된 사진부터 지움
    const current = photos[date] || [];
    const overflow = current.length + 1 - MAX_PHOTOS;
    const deleteIds = [];
    for (let i = 0; i < overflow; i++) {
      deleteIds.push(current[i].id);
    }
    // 인터넷이 불안정하면 저장이 끝없이 대기할 수 있어서 30초 제한
    return withTimeout(window.cloud.addPhoto(collectionName, date, image, user, deleteIds), 30000,
      "저장이 오래 걸려요. 인터넷이 연결되면 자동으로 올라갈 수 있으니 잠시 뒤 확인해 주세요");
  }).catch(function (err) {
    console.log("사진 저장 실패", err);
    alert("사진을 올리지 못했어요.\n" + (err.message || err.code || "알 수 없는 오류") +
      (err.code ? "\n(오류 코드: " + err.code + ")" : ""));
  }).then(function () {
    setPhotoBusy(false);
  });
}

// 사진 삭제
function deletePhoto(id) {
  if (!confirm("이 사진을 삭제할까요?")) {
    return;
  }
  window.cloud.removePhoto(photoCollection(), id).catch(function (err) {
    console.log("사진 삭제 실패", err);
    alert("삭제하지 못했어요. 인터넷 연결을 확인해 주세요.");
  });
}

// key로 날씨 정보 찾기 (없으면 null)
function findWeather(key) {
  for (let i = 0; i < weatherList.length; i++) {
    if (weatherList[i].key === key) {
      return weatherList[i];
    }
  }
  return null;
}

// 상세창의 날씨 선택 버튼 그리기 (같은 걸 다시 누르면 해제)
function drawDetailWeather() {
  const box = document.getElementById("detailWeather");
  box.innerHTML = "";

  const day = days[currentDetailDate];
  const selected = day ? day.weather : "";

  for (let i = 0; i < weatherList.length; i++) {
    const w = weatherList[i];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = w.icon + " " + w.label;
    btn.setAttribute("aria-pressed", w.key === selected ? "true" : "false");
    btn.onclick = function () {
      chooseWeather(w.key === selected ? "" : w.key);
    };
    box.appendChild(btn);
  }
}

// 산본집 돌봄 표시 (누가·언제는 남기지 않고 그날 했는지만 표시)
const careList = [
  { key: "fed", icon: "🍚", label: "밥줬어요" },
  { key: "cleaned", icon: "💩", label: "치웠어요" }
];

// 밥줬어요 / 치웠어요 표시 저장
function toggleCare(key, value) {
  if (!cloudConnected) {
    alert("아직 가족 코드로 연결되지 않았어요. 잠시 후 다시 시도해 주세요.");
    return;
  }
  const fields = {};
  fields[key] = value;
  window.cloud.saveDay(currentDetailDate, fields).catch(function (err) {
    console.log("돌봄 표시 저장 실패", err);
    alert("저장하지 못했어요. 인터넷 연결을 확인해 주세요." +
      (err && err.code ? "\n(" + err.code + ")" : ""));
  });
}

// 날씨 저장
function chooseWeather(key) {
  const user = getUser();
  if (user === "") {
    openUserModal();
    return;
  }
  if (!cloudConnected) {
    alert("아직 가족 코드로 연결되지 않았어요. 잠시 후 다시 시도해 주세요.");
    return;
  }
  window.cloud.saveDay(currentDetailDate, { weather: key, weatherBy: user }).catch(function (err) {
    console.log("날씨 저장 실패", err);
    alert("저장하지 못했어요. 인터넷 연결을 확인해 주세요.");
  });
}

// ===== 한줄평 (하루 최대 10개, 넘치면 오래된 것부터 삭제) =====

// 상세창을 열 때: 그 날짜의 한줄평 받아오기 시작
function startNotes() {
  notes = [];
  rawNotes = [];
  resetNoteForm();
  drawDetailNotes();
  if (cloudConnected) {
    window.cloud.watchNotes(currentDetailDate, onNotesData);
  }
}

// 저장소에서 받은 한줄평 (장소 구분 전)
let rawNotes = [];

// 한줄평이 도착하거나 바뀌면 실행
function onNotesData(list) {
  rawNotes = list;
  buildNotes();
  drawDetailNotes();
}

// 보고 있는 장소의 한줄평 목록 만들기 (오래된 것이 위, 새 것이 아래)
// - 장소가 없는 옛날 글은 산본집 글로 봄
// - 맨 처음 방식(하루 한 줄, days에 저장)으로 쓴 글도 산본집에 보여줌
function buildNotes() {
  const list = [];
  for (let i = 0; i < rawNotes.length; i++) {
    if ((rawNotes[i].place || "산본집") === viewPlace) {
      list.push(rawNotes[i]);
    }
  }

  const day = days[currentDetailDate];
  if (viewPlace === "산본집" && day && day.note) {
    list.push({
      id: "legacy",
      text: day.note,
      by: day.noteBy || "",
      createdAt: 0
    });
  }

  list.sort(function (a, b) {
    return a.createdAt - b.createdAt;
  });
  notes = list;
}

// 입력칸을 새 한줄평 쓰기 상태로 되돌림
function resetNoteForm() {
  editingNoteId = "";
  document.getElementById("noteInput").value = "";
  document.getElementById("noteSaveBtn").textContent = "저장";
  document.getElementById("noteCancelBtn").hidden = true;
}

// 한줄평을 남긴 시각을 24시간 기준 "시:분"으로 (옛날 글은 시각이 없어 빈칸)
// 그 날짜가 아닌 다른 날에 남긴 글이면 "월/일"도 같이 보여줌
function formatNoteTime(createdAt, noteDate) {
  if (typeof createdAt !== "number" || createdAt < 1000000000000) {
    return "";
  }
  const d = new Date(createdAt);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const writtenDate = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
  const prefix = writtenDate === noteDate ? "" : (d.getMonth() + 1) + "/" + d.getDate() + " ";
  return " · " + prefix + hh + ":" + mm;
}

// 상세창의 한줄평 목록 그리기 (내가 쓴 글에만 ✏️ ✕ 표시)
function drawDetailNotes() {
  const list = document.getElementById("detailNote");
  list.innerHTML = "";

  if (notes.length === 0) {
    const li = document.createElement("li");
    li.className = "note-empty";
    li.textContent = "아직 한줄평이 없어요";
    list.appendChild(li);
    return;
  }

  const user = getUser();
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.className = "note-text";
    text.textContent = "“" + n.text + "” ";
    const by = document.createElement("small");
    by.textContent = "— " + n.by + formatNoteTime(n.createdAt, n.date || currentDetailDate);
    text.appendChild(by);
    li.appendChild(text);

    if (user !== "" && n.by === user) {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.textContent = "✏️";
      editBtn.setAttribute("aria-label", "한줄평 수정");
      editBtn.onclick = function () {
        startEditNote(n.id);
      };
      li.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "icon-btn";
      delBtn.textContent = "✕";
      delBtn.setAttribute("aria-label", "한줄평 삭제");
      delBtn.onclick = function () {
        deleteNote(n.id);
      };
      li.appendChild(delBtn);
    }

    list.appendChild(li);
  }
}

// ✏️ 수정: 입력칸에 기존 글을 채움
function startEditNote(id) {
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].id === id) {
      editingNoteId = id;
      const input = document.getElementById("noteInput");
      input.value = notes[i].text;
      document.getElementById("noteSaveBtn").textContent = "수정 저장";
      document.getElementById("noteCancelBtn").hidden = false;
      input.focus();
      return;
    }
  }
}

// ✕ 삭제
function deleteNote(id) {
  if (!confirm("이 한줄평을 삭제할까요?")) {
    return;
  }
  if (editingNoteId === id) {
    resetNoteForm();
  }
  // 맨 처음 방식으로 쓴 글은 days 문서의 글을 비움
  const job = id === "legacy"
    ? window.cloud.saveDay(currentDetailDate, { note: "" })
    : window.cloud.removeNote(id);
  job.catch(function (err) {
    console.log("한줄평 삭제 실패", err);
    alert("삭제하지 못했어요. 인터넷 연결을 확인해 주세요.");
  });
}

// 한줄평 저장 (새로 쓰기 또는 수정 저장)
function saveNote() {
  const user = getUser();
  if (user === "") {
    openUserModal();
    return;
  }
  if (!cloudConnected) {
    alert("아직 가족 코드로 연결되지 않았어요. 잠시 후 다시 시도해 주세요.");
    return;
  }
  const text = document.getElementById("noteInput").value.trim().slice(0, 50);
  if (text === "") {
    return;
  }

  let job;
  if (editingNoteId === "legacy") {
    // 맨 처음 방식의 글을 고치면 새 방식으로 옮겨 저장 (작성 순서는 맨 위 유지)
    const oldBy = days[currentDetailDate] ? days[currentDetailDate].noteBy : user;
    job = window.cloud.addNote(
      currentDetailDate,
      { text: text, by: oldBy || user, place: "산본집", createdAt: 1 },
      []
    ).then(function () {
      return window.cloud.saveDay(currentDetailDate, { note: "" });
    });
  } else if (editingNoteId !== "") {
    job = window.cloud.updateNote(editingNoteId, text);
  } else {
    // 새 글을 넣으면 MAX_NOTES개를 넘는 만큼 오래된 것부터 지움
    // (옛날 방식 글은 개수에 넣지 않음)
    const real = notes.filter(function (n) {
      return n.id !== "legacy";
    });
    const overflow = real.length + 1 - MAX_NOTES;
    const deleteIds = [];
    for (let i = 0; i < overflow; i++) {
      deleteIds.push(real[i].id);
    }
    job = window.cloud.addNote(
      currentDetailDate,
      { text: text, by: user, place: viewPlace, createdAt: Date.now() },
      deleteIds
    );
  }

  job.catch(function (err) {
    console.log("한줄평 저장 실패", err);
    alert("저장하지 못했어요. 인터넷 연결을 확인해 주세요.\n(오류: " +
      (err.code || err.message || "알 수 없음") + ")");
  });
  resetNoteForm();
}

// 상세창 닫기
function closeDetail() {
  document.getElementById("detailModal").classList.add("hidden");
  if (window.cloud) {
    window.cloud.stopNotes();
  }
}

// ===== 일정 변경 (수정/삭제) =====

// 일정 변경창 열기
function openManage() {
  drawManageList();
  document.getElementById("manageModal").classList.remove("hidden");
  document.querySelector("#manageModal .modal-title button").focus();
}

// 일정 변경창 닫기
function closeManage() {
  document.getElementById("manageModal").classList.add("hidden");
}

// 등록된 일정 목록 그리기 (최근 시작일이 위로)
function drawManageList() {
  const list = document.getElementById("manageSchedules");
  list.innerHTML = "";

  if (schedules.length === 0) {
    const li = document.createElement("li");
    li.textContent = "등록된 일정이 없어요 (기본 위치)";
    list.appendChild(li);
    return;
  }

  // onCloudData가 이미 시작일이 늦은 순으로 정렬해 둠
  for (let i = 0; i < schedules.length; i++) {
    const s = schedules[i];
    const id = s.id;
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = s.person + " → " + s.place +
      " (" + s.startDate + " ~ " + s.endDate + ")";
    li.appendChild(text);

    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.onclick = function () {
      editSchedule(id);
    };
    li.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.onclick = function () {
      deleteSchedule(id);
    };
    li.appendChild(delBtn);

    list.appendChild(li);
  }
}

// 일정 수정: 입력창에 기존 내용을 채워서 열기
function editSchedule(id) {
  const s = findSchedule(id);
  if (s === null) {
    return;
  }
  editingId = id;
  closeManage();

  const boxes = document.querySelectorAll('input[name="person"]');
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].checked = (boxes[i].value === s.person);
  }
  document.getElementById("place").value = s.place;
  document.getElementById("startDate").value = s.startDate;
  document.getElementById("endDate").value = s.endDate;
  syncPicker();
  document.getElementById("saveBtn").textContent = "수정 저장";
  document.getElementById("formModal").classList.remove("hidden");
  document.querySelector("#formModal .modal-title button").focus();
}

// 일정 삭제
function deleteSchedule(id) {
  if (!confirm("이 일정을 삭제할까요?")) {
    return;
  }
  window.cloud.remove(id).catch(function (e) {
    console.log("삭제 실패", e);
    alert("삭제하지 못했어요. 인터넷 연결을 확인해 주세요.");
  });
}

// ===== 시작 =====

// Esc 키로 열려 있는 창 닫기
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (document.getElementById("photoViewer")) {
      closePhotoViewer();
      return;
    }
    closeForm();
    closeDetail();
    closeManage();
    closeNotif();
    closeCodeModal();
    closeUserModal();
  }
});

document.getElementById("photoInput").addEventListener("change", onPhotoChosen);
document.getElementById("cameraInput").addEventListener("change", onPhotoChosen);

// 옛날에 이 브라우저에 저장했던 일정은 더 이상 쓰지 않아서 정리
try {
  localStorage.removeItem("catHouseSchedules");
} catch (e) {
  // 저장소를 못 쓰는 환경이면 그냥 넘어감
}

// 일정이 비어 있는 상태로 달력을 먼저 그림
drawCalendar();

// 인터넷 저장소 연결이 준비되면 시작
if (window.cloud) {
  startSync();
} else {
  window.addEventListener("cloud-ready", startSync);
  // 10초가 지나도 준비가 안 되면 안내
  setTimeout(function () {
    if (!window.cloud) {
      document.getElementById("syncStatus").textContent =
        "⚠ 연결할 수 없어요. 인터넷을 확인해 주세요.";
    }
  }, 10000);
}
