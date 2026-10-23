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
5. **서버 기능 배포** (PC, Node 22 이상):
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

## 버그 제보 → 카카오톡 ("나에게 보내기")

앱의 🐞 버그제보에 적은 글(최대 50자)이 한나관리자의 카카오톡 "나와의 채팅"으로 옵니다.
앱은 `families/{가족코드}/bugReports`에 글을 저장하고, 서버 기능 `sendBugToKakao`가 그 글을 카카오톡으로 보냅니다.

### 카카오 쪽 준비 (한 번만)

1. https://developers.kakao.com → 내 애플리케이션 → 애플리케이션 추가하기 (이름 예: 가족소식통)
2. 앱 키에서 **REST API 키**를 복사해 둡니다.
3. 제품 설정 → **카카오 로그인** → 활성화 ON, **Redirect URI**에 `https://localhost:3000/oauth` 등록
4. 카카오 로그인 → **동의항목**에서 **카카오톡 메시지 전송(talk_message)**을 "선택 동의"로 설정
5. (보안 탭의 **Client Secret**을 사용 설정했다면 그 값도 복사해 둡니다.)
6. 브라우저에서 아래 주소를 엽니다(`REST_API_KEY` 자리에 키를 넣음). 한나 계정으로 로그인하고 동의합니다.
   ```
   https://kauth.kakao.com/oauth/authorize?client_id=REST_API_KEY&redirect_uri=https://localhost:3000/oauth&response_type=code&scope=talk_message
   ```
   로그인 뒤 주소창이 `https://localhost:3000/oauth?code=XXXX` 로 바뀝니다(페이지는 안 열려도 됨). `code=` 뒤의 값을 복사합니다. 이 코드는 몇 분 안에 써야 합니다.
7. Cloud Shell(또는 PC 터미널)에서 토큰을 받습니다.
   ```
   curl -X POST https://kauth.kakao.com/oauth/token \
     -d grant_type=authorization_code \
     -d client_id=REST_API_KEY \
     -d redirect_uri=https://localhost:3000/oauth \
     -d code=XXXX
   ```
   (Client Secret을 쓰면 `-d client_secret=시크릿`을 추가) 결과의 `refresh_token` 값을 복사합니다.
8. Firebase 콘솔 → Firestore Database → 데이터 → **컬렉션 시작**: 컬렉션 ID `config`, 문서 ID `kakao`, 필드 3개(모두 문자열)
   - `restApiKey` = REST API 키
   - `refreshToken` = 7번에서 받은 refresh_token
   - `clientSecret` = (사용할 때만) 클라이언트 시크릿
   이 문서는 앱에서 읽을 수 없고 서버 기능만 읽습니다.
9. 규칙(`firestore.rules`)을 다시 게시하고, 서버 기능을 다시 배포합니다 (`firebase deploy --only functions`).

### 참고
- 리프레시 토큰은 약 2개월 유효하고, 카카오가 새 토큰을 주면 서버가 `config/kakao`에 자동으로 갱신해 둡니다. 두 달 넘게 버그 제보가 없으면 만료될 수 있어서, 그때는 6~8번을 다시 하면 됩니다.
- 전송에 실패하면 해당 `bugReports` 문서에 `kakaoSent: false`와 `kakaoError`가 남습니다.
