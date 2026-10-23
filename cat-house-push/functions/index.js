// 새 소식(사진·한줄평)이 올라오면 올린 사람을 뺀 가족 기기에 푸시 알림을 보냄

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

// 사이트 주소 (알림을 누르면 이 주소로 열림)
const SITE_URL = "https://leehna09-stack.github.io/self/cat-house/";

// Firestore 데이터베이스와 같은 지역으로 맞춰야 함 (Firebase 콘솔 > Firestore > 데이터 위치 확인)
// (이 프로젝트는 서울 = asia-northeast3)
const REGION = "asia-northeast3";

exports.notifyFamily = onDocumentCreated(
  { document: "families/{familyCode}/activity/{activityId}", region: REGION },
  async function (event) {
    const snap = event.data;
    if (!snap) {
      return;
    }
    const activity = snap.data();
    const familyCode = event.params.familyCode;

    const tokenSnap = await getFirestore()
      .collection("families").doc(familyCode).collection("pushTokens").get();

    // 올린 사람 본인 기기는 제외
    const targets = [];
    tokenSnap.forEach(function (doc) {
      if (doc.data().by !== activity.by) {
        targets.push(doc.id);
      }
    });
    if (targets.length === 0) {
      return;
    }

    const what = activity.type === "photo" ? "사진을 올렸어요 📷" : "한줄평을 남겼어요 💬";
    const link = SITE_URL + "?" + new URLSearchParams({
      date: activity.date,
      place: activity.place,
      type: activity.type,
      id: event.params.activityId
    }).toString();

    const messages = targets.map(function (token) {
      return {
        token: token,
        data: {
          title: "우리 가족 소식통",
          body: activity.by + " 님이 " + activity.place + " " + activity.date + " " + what,
          link: link,
          tag: event.params.activityId
        },
        webpush: { headers: { Urgency: "high", TTL: "86400" } }
      };
    });

    const result = await getMessaging().sendEach(messages);

    // 더 이상 쓸 수 없는 알림 주소는 정리
    const dead = [];
    result.responses.forEach(function (res, i) {
      if (!res.success && res.error) {
        const code = res.error.code;
        if (code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token" ||
            code === "messaging/invalid-argument") {
          dead.push(targets[i]);
        } else {
          console.log("푸시 전송 실패", code);
        }
      }
    });
    await Promise.all(dead.map(function (token) {
      return getFirestore()
        .collection("families").doc(familyCode).collection("pushTokens").doc(token).delete();
    }));
  }
);


// ===== 버그 제보 → 한나관리자 카카오톡 ("나에게 보내기") =====
// 카카오 키와 토큰은 Firestore의 config/kakao 문서에 저장 (앱에서는 읽을 수 없고 서버만 읽음)
//   restApiKey: 카카오 REST API 키, clientSecret: (사용 설정했다면) 클라이언트 시크릿, refreshToken: 리프레시 토큰

// 리프레시 토큰으로 새 액세스 토큰을 받음 (카카오가 새 리프레시 토큰을 주면 저장해 둠)
async function getKakaoAccessToken(db) {
  const ref = db.collection("config").doc("kakao");
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("config/kakao 문서가 없어요");
  }
  const cfg = snap.data();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: cfg.restApiKey,
    refresh_token: cfg.refreshToken
  });
  if (cfg.clientSecret) {
    body.set("client_secret", cfg.clientSecret);
  }
  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: body
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error("카카오 토큰 발급 실패: " + JSON.stringify(json));
  }
  if (json.refresh_token) {
    await ref.update({ refreshToken: json.refresh_token });
  }
  return json.access_token;
}

exports.sendBugToKakao = onDocumentCreated(
  { document: "families/{familyCode}/bugReports/{reportId}", region: REGION },
  async function (event) {
    const snap = event.data;
    if (!snap) {
      return;
    }
    const report = snap.data();
    const db = getFirestore();

    try {
      const accessToken = await getKakaoAccessToken(db);
      const when = new Date(report.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      const template = {
        object_type: "text",
        text: "🐞 버그 제보\n" + report.by + ": " + report.text + "\n" + when,
        link: { web_url: SITE_URL, mobile_web_url: SITE_URL },
        button_title: "앱 열기"
      };
      const res = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
        },
        body: new URLSearchParams({ template_object: JSON.stringify(template) })
      });
      const json = await res.json();
      if (!res.ok || json.result_code !== 0) {
        throw new Error("카카오 메시지 전송 실패: " + JSON.stringify(json));
      }
      await snap.ref.update({ kakaoSent: true });
    } catch (err) {
      console.error("버그 제보 카카오톡 전송 실패", err);
      await snap.ref.update({ kakaoSent: false, kakaoError: String(err.message || err).slice(0, 300) });
    }
  }
);
