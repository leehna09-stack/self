// 새 소식(사진·한줄평)이 올라오면 올린 사람을 뺀 가족 기기에 푸시 알림을 보냄

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

// 사이트 주소 (알림을 누르면 이 주소로 열림)
const SITE_URL = "https://leehna09-stack.github.io/self/cat-house/";

// Firestore 데이터베이스와 같은 지역으로 맞춰야 함 (Firebase 콘솔 > Firestore > 데이터 위치 확인)
// 예: 서울 "asia-northeast3", 미국 멀티리전(nam5) "us-central1"
const REGION = "us-central1";

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
