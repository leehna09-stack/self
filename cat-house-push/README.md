# 푸시 알림 (앱을 닫아도 오는 알림)

새 사진·한줄평이 올라오면 올린 사람을 뺀 가족 기기에 알림이 갑니다.

## 구성

| 파일 | 역할 |
|---|---|
| `../cat-house/firebase-messaging-sw.js` | 앱이 닫혀 있어도 알림을 띄우는 서비스 워커 |
| `../cat-house/index.html`, `script.js` | 알림 허용 버튼, 기기 주소(토큰) 저장 |
| `functions/index.js` | 새 소식이 생기면 푸시를 보내는 서버 기능 |
| `firestore.rules` | 기기 주소(`pushTokens`)를 저장할 수 있게 한 전체 규칙 |

## 준비 순서

1. **Blaze 요금제**: Firebase 콘솔 → 왼쪽 아래 요금제 → Blaze(종량제)로 변경 (카드 등록, 가족 규모에서는 거의 0원)
2. **웹 푸시 인증서 키**: Firebase 콘솔 → 프로젝트 설정(톱니바퀴) → 클라우드 메시징 → "웹 푸시 인증서" → 키 쌍 생성 → 나온 공개키를 `cat-house/index.html`의 `VAPID_KEY`에 넣기
3. **Firestore 위치 확인**: Firebase 콘솔 → Firestore Database → 데이터 위치 확인 후 `functions/index.js`의 `REGION` 맞추기
4. **규칙 게시**: `firestore.rules` 전체를 콘솔 → Firestore → 규칙에 붙여 넣고 게시
5. **서버 기능 배포** (PC, Node 20 이상):
   ```
   npm install -g firebase-tools
   firebase login
   cd cat-house-push/functions && npm install && cd ..
   firebase deploy --only functions
   ```
6. **기기에서 허용**: 각 가족 폰에서 사이트를 열고 처음 화면을 누르면 알림 허용창이 뜹니다. "허용"을 누르면 끝이고, 별도 켜기 버튼은 없습니다.

## 참고

- 안드로이드 크롬과 PC 크롬에서 동작합니다. 아이폰은 사파리에서 "홈 화면에 추가"한 앱에서만 됩니다(iOS 16.4 이상).
- 🍚·💩 표시는 알림을 보내지 않습니다.
- 알림을 끄려면 브라우저의 사이트 설정(주소창 왼쪽 아이콘 → 권한)에서 알림을 "차단"으로 바꿉니다.
