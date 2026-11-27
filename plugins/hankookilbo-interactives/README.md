# 한국일보 인터랙티브

한국일보 인터랙티브 기사 페이지를 공식 템플릿(설치·빌드 없는 `index.html` 한 파일)으로 만드는 플러그인입니다. 기획 인터뷰부터 제작, 브라우저에서 보며 고치기, 자체 점검, 전달용 zip 만들기까지 진행하고, 자주 쓰는 인터랙션에 어떤 라이브러리를 쓸지 정해진 규칙대로 고릅니다. 사내 제작자와 외주 제작사가 같은 플러그인을 씁니다.

## 설치

```bash
/plugin marketplace add hkilbo/claude-plugins
```

```bash
/plugin install hankookilbo-interactives@hankookilbo
```

설치 후 **새 세션부터** 스킬이 인식됩니다. 디자인 방향을 잡는 Anthropic 공식 `frontend-design` 플러그인이 함께 설치됩니다.
zip 을 풀어 `claude --plugin-dir <폴더>` 로 쓸 때는 이 플러그인이 자동으로 깔리지 않으므로 **먼저** `claude plugin install frontend-design@claude-plugins-official` 을 실행합니다. 안 깔려 있으면 플러그인이 아무 메시지 없이 로드되지 않습니다.

## 무엇을 할 수 있나

**인터랙티브 페이지 만들기** (`hankookilbo-interactives`) — "인터랙티브 페이지 만들어줘", "이 사진들로 스크롤 스토리 만들어줘" 처럼 말하면 기획 질문부터 시작합니다. 개발 지식이 없어도 질문에 답하면 됩니다.

1. 기획 인터뷰 — 연출 방식(스크롤 여정형, 예전/지금 비교 슬라이더, 타임라인, 지도 경로형, 풀스크린 갤러리, 화면 넘김 게임형), 크레딧 위치, 소재·원고, 메타 정보 확인
2. 공식 템플릿(`index.html` 한 파일)을 복사해 제작 — 설치·빌드가 없습니다. 한국일보 필수 스크립트·헤더·바이라인이 포함되고, 헤더·추천 카드는 `<html data-*>` 공통영역 API(v2)로 동작하고, 헤더 아이콘 색은 페이지 배경색을 보고 자동으로 맞춥니다
3. `localhost:3000`에 띄워 보면서 고치기 — 필수 식별자·메타 일치·헤더·GNB 동작 검사는 자동으로 돌고, 담당자는 브라우저에서 보고 고칠 곳만 말하면 됩니다
4. "마무리해줘"라고 하면 최종 검사 후 전달용 zip 생성 — zip 안에는 올릴 파일(`index.html`·`share.jpg`·`share_kakao.jpg`+본문 이미지·`data/`·따로 둔 `.css`·`.js`)만 들어 있어, 풀어서 S3에 그대로 올리면 됩니다

**라이브러리 고르기** (`hankookilbo-interactives-libs`) — 캐러셀, 스크롤 인터랙션, 지도, 지도 위 데이터, 상태 공유가 필요할 때 쓸 라이브러리와 붙이는 방법을 정합니다. 라이브러리 없이 CSS·vanilla JS로 충분한 경우도 함께 판단합니다.

## 한국일보 담당자에게 받아야 하는 것

- **기사 키**("A"+숫자 19자리) — 한국일보 기획팀이 발행합니다. 없으면 템플릿 자리 값으로 두고 `brief.md`에 남깁니다. 올리기 전에는 실제 값이 있어야 합니다.
- **올리기** — 스킬이 만든 zip을 풀어 나온 `<폴더명>` 폴더를 AWS 콘솔에서 S3 버킷의 `articles/` 아래에 그대로 올립니다. 올릴 권한이 없으면 zip을 한국일보 담당자에게 전달합니다.

## 화면 점검(스크린샷)을 쓰려면

자체 점검의 스크린샷 단계는 Playwright를 씁니다. 기기당 한 번만 설치합니다. 프로젝트 폴더가 아니라 홈 폴더의 `~/.hk-interactives`에 설치됩니다.

```bash
npm install --prefix ~/.hk-interactives playwright
```

```bash
npx --prefix ~/.hk-interactives playwright install chromium
```
