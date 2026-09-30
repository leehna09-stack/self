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

// 보고 있는 달의 사진들 ("2026-10-05" → 사진 데이터)
let photos = {};

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
}

// 인터넷 저장소에 연결
function connectCloud(code) {
  document.getElementById("codeInfo").textContent = "🔑 " + code.slice(0, 4) + "…";
  window.cloud.start(code, onCloudData, onCloudStatus);
  cloudConnected = true;
  watchMonthPhotos();
}

// 지금 보고 있는 달의 사진을 받아오기 시작
function watchMonthPhotos() {
  if (!cloudConnected) {
    return;
  }
  photos = {};
  window.cloud.watchPhotos(
    makeDateString(viewYear, viewMonth, 1),
    makeDateString(viewYear, viewMonth, 31),
    onPhotoData
  );
}

// 사진이 도착하거나 바뀌면 실행
function onPhotoData(map) {
  photos = map;
  drawCalendar();
  if (!document.getElementById("detailModal").classList.contains("hidden")) {
    drawDetailPhoto();
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

    // 사진이 있는 날은 표시
    if (photos[dateString]) {
      const mark = document.createElement("div");
      mark.className = "day-photo";
      mark.textContent = "📷";
      cell.appendChild(mark);
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
}

// ===== 일정 입력 =====

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
  for (let p = 0; p < placeList.length; p++) {
    const names = [];
    for (let i = 0; i < people.length; i++) {
      if (getPlace(people[i], dateString) === placeList[p]) {
        names.push(people[i]);
      }
    }
    const line = document.createElement("div");
    line.textContent = placeIcons[placeList[p]] + " " + placeList[p] + ": " +
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

  // 이 날짜에 걸친 일정 목록 (수정/삭제 버튼 포함)
  const list = document.getElementById("detailSchedules");
  list.innerHTML = "";
  let found = false;

  for (let i = 0; i < schedules.length; i++) {
    const s = schedules[i];
    const id = s.id;
    if (dateString >= s.startDate && dateString <= s.endDate) {
      found = true;
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

  if (!found) {
    const li = document.createElement("li");
    li.textContent = "등록된 일정이 없어요 (기본 위치)";
    list.appendChild(li);
  }

  drawDetailPhoto();

  document.getElementById("detailModal").classList.remove("hidden");
  if (!keepFocus) {
    document.querySelector("#detailModal .modal-title button").focus();
  }
}

// 상세창의 사진 칸 그리기
function drawDetailPhoto() {
  const box = document.getElementById("detailPhoto");
  box.innerHTML = "";

  const image = photos[currentDetailDate];
  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = currentDetailDate + " 사진";
    box.appendChild(img);
  }

  const addBtn = document.createElement("button");
  addBtn.textContent = image ? "📷 사진 바꾸기" : "📷 사진 올리기";
  addBtn.onclick = function () {
    document.getElementById("photoInput").click();
  };
  box.appendChild(addBtn);

  if (image) {
    const delBtn = document.createElement("button");
    delBtn.textContent = "사진 삭제";
    delBtn.onclick = deletePhoto;
    box.appendChild(delBtn);
  }
}

// 사진을 줄여서 글자(JPEG data URL)로 바꾸기 (긴 변 900px)
function shrinkPhoto(file) {
  return new Promise(function (resolve, reject) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      // 너무 크면 화질을 더 낮춰서 다시 만듦 (저장소 한도 약 1MB)
      let quality = 0.7;
      let result = canvas.toDataURL("image/jpeg", quality);
      while (result.length > 700000 && quality > 0.3) {
        quality = quality - 0.1;
        result = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(result);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했어요"));
    };
    img.src = url;
  });
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
  const date = currentDetailDate;
  shrinkPhoto(file).then(function (image) {
    return window.cloud.savePhoto(date, image);
  }).catch(function (err) {
    console.log("사진 저장 실패", err);
    alert("사진을 저장하지 못했어요. 인터넷 연결과 사진 파일을 확인해 주세요.");
  });
}

// 사진 삭제
function deletePhoto() {
  if (!confirm("이 날의 사진을 삭제할까요?")) {
    return;
  }
  window.cloud.removePhoto(currentDetailDate).catch(function (err) {
    console.log("사진 삭제 실패", err);
    alert("삭제하지 못했어요. 인터넷 연결을 확인해 주세요.");
  });
}

// 상세창 닫기
function closeDetail() {
  document.getElementById("detailModal").classList.add("hidden");
}

// 일정 수정: 입력창에 기존 내용을 채워서 열기
function editSchedule(id) {
  const s = findSchedule(id);
  if (s === null) {
    return;
  }
  editingId = id;
  closeDetail();

  const boxes = document.querySelectorAll('input[name="person"]');
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].checked = (boxes[i].value === s.person);
  }
  document.getElementById("place").value = s.place;
  document.getElementById("startDate").value = s.startDate;
  document.getElementById("endDate").value = s.endDate;
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
    closeForm();
    closeDetail();
    closeCodeModal();
  }
});

document.getElementById("photoInput").addEventListener("change", onPhotoChosen);

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
