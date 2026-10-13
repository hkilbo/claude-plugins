# 한국일보 인터랙티브 기본 템플릿 (Astro + React)

> **이 문서 하나로 한국일보 인터랙티브 페이지 프로젝트를 처음부터 끝까지 만들 수 있습니다.**
> Claude, ChatGPT 등 AI 코딩 도구에 이 문서를 그대로 붙여 넣고
> "이 템플릿대로 프로젝트를 생성해줘"라고 하면 됩니다.
>
> 배포 주소 형식: `https://interactive.hankookilbo.com/v/{FOLDER_NAME}/`
> (기사 연결 주소: `https://www.hankookilbo.com/interactive/*`)

---

## 0. AI에게 이렇게 요청하세요

```
아래 "한국일보 인터랙티브 기본 템플릿" 문서를 기준으로 새 프로젝트를 만들어줘.

- 프로젝트 폴더명(FOLDER_NAME): ______
- 제목(HTML_TITLE): ______
- 설명(HTML_DESC): ______
- 기사 키(ARTICLE_KEY): A______   ← 통계 메타와 인터랙티브 임베드 스크립트의 Nid에 함께 들어감
- 게시일(POST_DATE): 2026.__.__
- 바이라인: ______

문서의 1~9장에 있는 파일들을 그대로 생성하고,
10장 "페이지 패턴" 중 [스크롤리텔링 / 단순 롱폼 / 데이터 시각화]를 골라
index.astro에 본문을 구성해줘.
"0-1. 필수 요건"의 항목은 하나도 빠뜨리지 말고,
12장 "규칙과 함정"을 반드시 지켜줘.
마지막에 npm run build를 실행해서 dist/index.html에
G-HR08PM6YWZ, hkAnalTag_hub.js, interactive-embed.js, byline이
모두 들어 있는지 grep으로 검증해줘.
```

AI가 작업 중 반드시 지켜야 하는 최상위 규칙 3가지:

1. **스크롤 컨테이너는 `window`가 아니라 `.body-wrapper`** 다. `window.scrollY`, `window.addEventListener("scroll")`은 동작하지 않는다.
2. **모든 정적 파일 경로는 상대 경로 `./img/...`** 다. (`/img/...` 금지) `astro.config.mjs`의 `base: "./"` 때문이다.
3. **메타 정보는 `src/utils/constant/META.ts` 한 곳**에서만 수정한다. Layout, Byline이 모두 이 파일을 읽는다.

---

## 0-1. 필수 요건 (절대 빠지면 안 되는 것)

아래 항목은 디자인, 주제, 패턴과 무관하게 **모든 한국일보 인터랙티브에 반드시 포함**된다. AI가 "간단하게 만들어달라"는 요청을 받아도 생략할 수 없다. 하나라도 빠지면 배포 불가.

### 빌드 산출물

| 항목　　　 | 값　　　　　　　　　　　　　　　　　　 | 이유　　　　　　　　　　　　　　　　　　　　　　　　　 |
| ---------- | -------------------------------------- | ------------------------------------------------------ |
| 출력 모드  | `output: "static"`　　　　　　　　　　 | FTP 정적 배포만 가능. SSR 서버 없음　　　　　　　　　  |
| 출력 폴더  | **`dist/`** (Astro 기본값, 변경 금지)  | FTP 업로드 스크립트와 QA 절차가 `dist/`를 기준으로 함  |
| 경로 기준  | `base: "./"`, `assetsPrefix: "./"`　　 | `/v/{FOLDER_NAME}/` 하위 폴더에서 동작　　　　　　　　 |
| 진입 파일  | `dist/index.html` 단일 페이지　　　　  | 다중 페이지 라우팅 금지　　　　　　　　　　　　　　　  |
| 압축　　　 | `astro-compress` 통합　　　　　　　　  | HTML/CSS/JS/이미지 자동 압축　　　　　　　　　　　　　 |

`astro.config.mjs`에 `outDir`을 별도로 지정하지 않는다. `build/`, `out/`, `public/` 등 다른 이름으로 바꾸지 않는다.

### 헤더 (인터랙티브 헤더 웹컴포넌트)

헤더는 프로젝트가 만들지 않는다. `<head>`의 인터랙티브 임베드 스크립트(`interactive-embed.js`, 아래 표)가
`<interactive-header>`를 `body` 맨 앞에 자동으로 붙인다. 로고·홈 링크·로그인·공유(페이스북, X, 카카오톡, URL 복사)가
전부 그 안에 들어 있다.

- 프로젝트에 `article_bar.astro` 같은 자체 헤더를 만들지 않는다. 헤더가 두 개가 된다.
- `<interactive-header>`를 CSS로 숨기거나 위치를 옮기지 않는다. **유일한 예외는 초기 로딩 화면(`body.loading`)이 떠 있는 동안**이다.
  헤더는 `.body-wrapper` 밖에 `position: fixed; z-index: 650`으로 붙고 `.body-wrapper`(`position: fixed`)는 별도 stacking context라,
  로더(`.full-loader`)의 `z-index: 3000`으로는 헤더를 덮을 수 없다. 그래서 `_full_loader.sass`에
  `body.loading interactive-header { opacity: 0 !important; pointer-events: none !important }`를 둔다 (7장 원문에 포함). 로더가 걷히면(`body.loaded`) 자동으로 다시 보인다.
  `visibility: hidden`은 안 먹는다 — 헤더 shadow DOM 안의 `<header>`가 `visibility: visible`을 직접 갖고 있어 자식이 다시 보인다. `opacity`는 자식이 뒤집을 수 없다. `!important`는 헤더 `:host`의 자체 애니메이션(`wc-reveal`)보다 우선하기 위해 필요하다.
  이 한 줄 외에 헤더를 건드리는 CSS는 쓰지 않는다.
- 헤더의 공유 버튼은 `<head>`의 `og:title`, `og:description`, `og:image`, `kakao_og_image` 메타를 읽어 공유 카드를 만든다.
  이 네 개가 비어 있으면 공유 카드가 깨진다 (5장 Layout 원문 참고).
- 카카오 공유는 헤더가 카카오 SDK **v2**(`t1.kakaocdn.net/kakao_js_sdk/2.7.6`)로 처리한다. 프로젝트가 v1
  (`developers.kakao.com/sdk/js/kakao.min.js`)을 먼저 로드하면 헤더가 v2 로드를 건너뛰고 공유가 실패하므로 v1은 금지다.

### 테마 (라이트 / 다크) — `<html class="dark">`

인터랙티브 헤더와 추천 카드는 `<html>`에 `dark` 클래스가 있는지 보고 테마를 정한다. 페이지 배경색과 반드시 맞춘다.

| 페이지 배경 | `<html>` | 헤더·추천 카드 |
| --- | --- | --- |
| 어두움 (템플릿 기본 `$bgBase: #111`) | `<html lang="ko" class="dark">` | 흰 로고·아이콘, 어두운 카드 |
| 밝음 | `<html lang="ko">` (클래스 없음) | 검은 로고·아이콘, 흰 카드 |

- 템플릿 기본값은 다크다. 5장 Layout 원문에 `class="dark"`가 들어 있다. 밝은 배경으로 바꾸면 `_variables.sass`의 `$bgBase`·`$fontColBase`와 함께 이 클래스를 뺀다.
- 둘이 어긋나면 헤더 로고가 배경과 같은 색이 돼 안 보인다 (어두운 배경 + 클래스 없음 = 검은 로고).
- 라이트와 다크 중 하나로 고정한다. 페이지 안에서 테마를 바꾸는 전환 기능은 만들지 않는다.
- `dark` 이외의 이름(`theme-dark`, `data-theme` 등)은 헤더가 읽지 않는다. `<body>`에 붙여도 안 된다.

### 바이라인 (콘텐츠 크레딧)

`src/components/Astro/byline.astro`를 `Layout.astro`의 `<slot />` **뒤**에 렌더한다. **이 콘텐츠의 크레딧 블록**이며
페이지의 맨 마지막 요소다.

- `HTML_TITLE`, `POST_DATE`
- `BYLINE_MEMBERS` 제작진 목록
- 관련 기사 카드와 공유 버튼은 넣지 않는다 (2026-09-28 결정). 둘 다 `interactive-embed.js`가 맡는다.
  공유 4종(페이스북, X, 카카오톡, URL 복사)은 인터랙티브 헤더에, 추천 기사는 하단 추천 카드에 있다. 한국일보 앱 웹뷰에서도 헤더 공유 버튼이 동작한다.
- 맨 끝에 저작권 문구 `세상을 보는 균형, 한국일보 Copyright © Hankookilbo`를 넣는다 (`<p class="copy">`). 문구를 바꾸지 않는다.
  회사 공통 푸터를 쓰지 않으므로 페이지의 저작권 표기는 이 한 줄뿐이다.

### `<head>` 필수 스크립트와 메타

아래는 `Layout.astro`에 **원문 그대로** 들어가야 한다. ID 값 하나도 바꾸지 않는다.

| 구분                                            | 내용                                                                                        | 식별자                                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Google Analytics (GA4)                          | gtag.js 1종. 개편 전 스트림(GTM `GTM-59599H7`, UA `UA-53476308-*`, GA4 `G-ZPZ8BHZPSJ`·`G-BZHTEE2B8L`)은 넣지 않는다 | `G-HR08PM6YWZ`                                                                                                                 |
| jQuery                                          | `hkAnalTag_hub.js`가 `$`를 쓴다. **통계 스크립트보다 앞에** 로드한다 (뒤에 두면 `$ is not defined`로 Hmap 수집이 안 된다) | `https://code.jquery.com/jquery-3.7.1.min.js`                                                                                  |
| 한국일보 통계 (Hmap 1.0)                        | `hkAnalTag_hub.js` — www 절대 경로, jQuery 다음. `hkFunc.js`는 쓰지 않는다                   | `https://www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js`                                                                          |
| 한국일보 통계 메타                              | `hk:nw_newsid`, `hk:nw_press`, `hk:nw_presscode`, `hk:nw_title`, `hk:nw_pagecode`           | META.ts에서 주입                                                                                                               |
| 인터랙티브 임베드 (헤더 웹컴포넌트 + 추천 카드) | `interactive-embed.js?Nid={ARTICLE_KEY}` + `data-scroll-container=".body-wrapper"` — 사내 CDN, `Nid`는 대문자 N | `https://assets.hankookilbo.com/components/interactive-embed/v1/interactive-embed.js`                                          |
| 카카오 SDK **v2**                               | `t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js` + `Kakao.init(...)` (초기화 여부 확인 후) | 앱키 `e62df5186f0758def8f14c53e64d7b9d`. 인터랙티브 헤더가 같은 v2를 쓴다. v1(`developers.kakao.com/sdk/js/kakao.min.js`) 금지 |
| 아이콘 폰트                                     | `iconFont.css`                                                                              | `https://interactive.hankookilbo.com/addon/icon_font/iconFont.css`                                                             |
| 웹폰트 (Pretendard Variable, NanumMyeongjo)     | `hk_fonts.css` — 사내 CDN, 폰트 파일을 저장소에 두지 않는다                                 | `https://assets.hankookilbo.com/fonts/hk_fonts.css`                                                                            |
| OG / Twitter / 카카오                           | `og:locale` ko_KR, `og:title`, `og:description`, `og:image`(+`og:image:width` 1200·`og:image:height` 630), `twitter:*` 전체(+`twitter:image:width`·`height`) + `<meta name="kakao_og_image">`(800×800, 절대 경로) | META.ts에서 주입. 인터랙티브 헤더의 공유 카드가 이 메타를 읽는다                                                               |
| 파비콘                                          | `//image.hankookilbo.com/o/img/favicon.ico`                                                 |                                                                                                                                |

전체 원문은 5장 `Layout.astro`에 있다. GA와 GTM 스크립트는 반드시 `<script is:inline>`으로 써서 Astro가 번들링하지 않게 한다.

#### 인터랙티브 임베드 스크립트 (`interactive-embed.js`)

프론트개발팀이 웹컴포넌트로 만든 **한국일보 인터랙티브 헤더**와 **인터랙티브 추천 카드**를
스크립트 한 줄로 붙이는 로더다. 구 `hkUtilMoreInteractive.min.js`(더보기 위젯)를 대체한다.

```html
<script is:inline src={`https://assets.hankookilbo.com/components/interactive-embed/v1/interactive-embed.js?Nid=${ARTICLE_KEY}`} data-scroll-container=".body-wrapper"></script>
```

- **`Nid=기사ID`는 필수**다. 값은 `META.ts`의 `ARTICLE_KEY`(A + 19자리)를 그대로 넣는다. 파라미터 이름은
  **대문자 N**(`Nid`)이어야 한다 — 스크립트가 `searchParams.get("Nid")`로 읽으므로 `nid`, `NID`는 무시된다.
- 이 스크립트가 하는 일: ① 헤더 프래그먼트(`interactive-header.html`)를 받아 `<interactive-header>`를
  `body` 맨 앞에 붙이고 `header.js`로 살린다 ② `Nid`가 있으면 `interactive-recommend.js?Nid=…`를 로드해
  화면 하단 추천 카드를 띄운다. 추천 후보에서 **현재 기사(`Nid`)를 제외**하므로 값이 틀리면 자기 기사가 추천에 뜬다.
- **`data-scroll-container=".body-wrapper"`는 필수**다. 값도 이대로 고정이다. 이 속성이 있어야 헤더가 `.body-wrapper` 스크롤을 따라 숨고, 추천 카드가 본문 끝에서 뜬다.
- **CDN은 운영 주소 `https://assets.hankookilbo.com` 하나만 쓴다.** `assets-dev.`, `assets-stg.` 주소는 로컬 테스트용으로도 소스에 남기지 않는다 (`self_check.js`가 실패 처리).
- 추천 카드만 끄려면 `<script … data-recommend="false">`. 헤더는 끌 수 없다.
- `v1` 별칭 경로라 프론트개발팀이 새 버전을 승격해도 소비 코드는 바뀌지 않는다. 버전을 고정하지 않는다.
- 로컬(`localhost:3000`)과 `interactive.hankookilbo.com`에서 헤더가 안 뜨고 콘솔에 `Access to fetch … blocked by CORS`가
  나오면 CDN 허용 목록 문제다(7장 웹폰트와 같은 정책). 코드 문제가 아니므로 프론트개발팀에 문의한다.

### `<body>` 필수 구조

```html
<body class="loading">
  <div class="body-wrapper">
    <div class="full-loader"></div>
    <slot />
    <Byline />
  </div>
</body>
```

`<interactive-header>`는 임베드 스크립트가 런타임에 `body` 맨 앞(`.body-wrapper` 바깥)에 붙인다. 소스에 직접 쓰지 않는다.

`body-wrapper`는 모바일 인앱 브라우저(카카오톡, 네이버, 사파리)의 상·하단 바 대응용 실제 스크롤 컨테이너다. 이 구조를 풀거나 `<slot />`을 `body-wrapper` 밖으로 꺼내지 않는다.

### 빌드 후 자동 검증

`npm run build` 직후 아래 명령이 모두 통과해야 한다. AI는 프로젝트 생성 마지막 단계에서 이 검증을 반드시 실행한다.

```bash
npm run build && \
test -f dist/index.html && echo "OK dist/index.html" && \
for key in G-HR08PM6YWZ code.jquery.com/jquery-3.7.1.min.js www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js \
           interactive-embed.js iconFont.css hk_fonts.css kakao.min.js \
           hk:nw_newsid hk:nw_pagecode og:locale og:image og:image:width twitter:image:width kakao_og_image twitter:card \
           byline body-wrapper full-loader data-scroll-container; do
  grep -q "$key" dist/index.html && echo "OK $key" || echo "MISSING $key"
done
```

추가로 `grep -q 'Copyright © Hankookilbo' dist/index.html`로 바이라인 저작권 문구를 확인한다. `MISSING`이 하나라도 출력되면 배포하지 않는다. `grep -c 'developers.kakao.com/sdk' dist/index.html`은 **0**이어야 한다 (카카오 SDK v1 금지). `grep -cE 'GTM-59599H7|UA-53476308|G-ZPZ8BHZPSJ|G-BZHTEE2B8L|hkFunc\.js' dist/index.html`도 **0**이어야 한다 (개편 전 통계 스크립트 금지). 추가로 `grep -o 'interactive-embed.js?Nid=[A-Z0-9]*' dist/index.html`의
값이 `META.ts`의 `ARTICLE_KEY`와 같은지 확인한다 (`A0000000000000000000`이면 미발급 상태).

---

## 1. 기술 스택

| 구분               | 선택                                               | 버전 (2026.09 기준)   |
| ------------------ | -------------------------------------------------- | --------------------- |
| 프레임워크         | Astro (static output)                              | ^5.16                 |
| UI 아일랜드        | React                                              | ^19.2                 |
| 스타일             | Sass / SCSS (`.sass` 들여쓰기 문법 + `.scss` 혼용) | ^1.66                 |
| 압축               | astro-compress                                     | ^2.3                  |
| 3D (선택)          | three, @react-three/fiber, @react-three/drei       | ^0.182 / ^9.5 / ^10.7 |
| 슬라이더 (선택)    | react-slick, slick-carousel                        | ^0.31 / ^1.8          |
| 손그림 강조 (선택) | rough-notation, roughjs                            | ^0.5 / ^4.6           |
| 이미지 확대 (선택) | medium-zoom                                        | ^1.1                  |
| 포맷터             | prettier + prettier-plugin-astro                   | ^3.7 / ^0.14          |
| 런타임             | Node 22, npm 10                                    |                       |

Vue, Svelte 등 다른 프레임워크는 쓰지 않는다. 정적 HTML은 `.astro`, 상태가 있는 UI만 `.tsx`로 만든다.

---

## 2. 프로젝트 구조

```
{FOLDER_NAME}/
├── public/
│   ├── favicon.svg
│   └── img/
│       ├── ogimage.png        # 1200x630  (페이스북/X OG) — 필수, self_check.js가 크기 검사
│       ├── ogimage_kakao.png  # 800x800   (카카오톡 공유) — 필수, self_check.js가 크기 검사
│       ├── common/            # 로더, 로고, SNS 아이콘 (템플릿 공통, 수정 금지)
│       └── ...                # 프로젝트 이미지
├── src/
│   ├── components/
│   │   ├── Astro/
│   │   │   └── byline.astro        # 하단 바이라인 (제목 + 게시일 + 제작진). 헤더는 임베드 스크립트가 붙임
│   │   ├── Intro.astro             # 프로젝트별 컴포넌트 (예시)
│   │   └── SomeIsland.tsx          # React 아일랜드 (필요 시)
│   ├── data/
│   │   └── data.ts                 # 본문 데이터 (타입 포함)
│   ├── layouts/
│   │   └── Layout.astro            # <head> 메타, 애널리틱스, body-wrapper
│   ├── lib/js/_comm/
│   │   ├── common.js               # removeLoader
│   │   ├── ioScroll.js             # IntersectionObserver 기반 스크롤 유틸
│   │   └── util.js                 # addComma, chunkArray
│   ├── pages/
│   │   └── index.astro             # 유일한 페이지
│   ├── styles/
│   │   ├── style.sass              # 진입점 (reset + import)
│   │   ├── _variables.sass         # 폰트 크기, 색, z-index, 브레이크포인트
│   │   ├── _utils.sass             # mobile/tablet 믹스인
│   │   ├── _full_loader.sass       # 초기 로딩 화면
│   │   ├── _byline.scss
│   │   └── *.scss                  # 컴포넌트별 스타일
│   ├── utils/constant/
│   │   └── META.ts                 # ★ 단일 진실 공급원
│   └── env.d.ts
├── .gitignore
├── .prettierrc
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. 설정 파일 (그대로 생성)

### `package.json`

```json
{
  "name": "{FOLDER_NAME}",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/react": "^4.4.2",
    "@types/react": "^19.2.9",
    "@types/react-dom": "^19.2.3",
    "astro": "^5.16.4",
    "astro-compress": "^2.3.9",
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "prettier": "^3.7.4",
    "prettier-plugin-astro": "^0.14.1",
    "sass": "^1.66.1"
  }
}
```

선택 패키지는 필요할 때만 추가한다.

```bash
# 3D 배경, WebGL 갤러리
npm i three @react-three/fiber @react-three/drei @types/three
# 슬라이더
npm i react-slick slick-carousel @types/react-slick
# 손그림 강조 (밑줄, 박스, 동그라미)
npm i rough-notation roughjs
# 이미지 클릭 확대
npm i medium-zoom
```

### `astro.config.mjs`

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import compress from "astro-compress";

// 로컬 개발 포트는 3000으로 고정한다. 사내 CDN(폰트·헤더)과 추천 카드 API의 CORS 허용 origin이 localhost:3000이다
const LOCAL_PORT = 3000;

// https://astro.build/config
export default defineConfig({
  integrations: [react(), compress()],
  output: "static",
  base: "./",
  build: {
    assetsPrefix: "./",
  },
  server: {
    port: LOCAL_PORT,
  },
});
```

`server.port: 3000`은 빼거나 바꾸지 않는다. Astro 기본값(4321)으로 띄우면 추천 카드 API가 CORS로 막혀 추천 카드가 비고,
CDN 허용 목록도 3000 기준으로 관리된다.

`base: "./"`와 `assetsPrefix: "./"`는 FTP로 어느 하위 폴더에 올려도 동작하게 하는 핵심 설정이다. 절대 바꾸지 않는다.

### `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

### `src/env.d.ts`

```ts
/// <reference types="astro/client" />
```

### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### `.gitignore`

```
# build output
dist/
# generated types
.astro/

# dependencies
node_modules/

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# environment variables
.env
.env.production

# macOS-specific files
.DS_Store

# intelliJ IDEA
.idea
```

### `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[astro]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "prettier.documentSelectors": ["**/*.astro"],
  "files.associations": {
    "*.astro": "astro"
  }
}
```

---

## 4. `src/utils/constant/META.ts` (★ 가장 먼저 채울 파일)

```ts
//@ts-nocheck

export const HTML_TITLE = "인터랙티브 제목";
export const HTML_DESC = "공유 시 노출되는 한 줄 설명 (80자 이내 권장)";
export const THIS_URL = "https://interactive.hankookilbo.com/v/{FOLDER_NAME}/"; // 끝에 / 필수
export const PAGE_CODE = "hk_news_read_A0000000000000000000"; // "hk_news_read_" + ARTICLE_KEY
export const ARTICLE_KEY = "A0000000000000000000"; // 연결 기사 키 (A + 19자리)
export const FOLDER_NAME = "{FOLDER_NAME}"; // FTP 폴더명, 영문 소문자 + 하이픈/언더스코어

export const POST_DATE = "2026.01.01"; // 바이라인 게시일

export const BYLINE_MEMBERS = [
  { dept: "취재", members: "OOO·OOO 기자" },
  { dept: "사진", members: "OOO 기자" },
  { dept: "영상", members: "OOO PD" },
  { dept: "인터랙티브 기획 제작", members: "OOO, OOO" },
];
```

| 항목                          | 어디에 쓰이나                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `HTML_TITLE`                  | `<title>`, OG/Twitter title (`[인터랙티브] ` 접두어 자동), 바이라인, 헤더 공유 카드              |
| `HTML_DESC`                   | OG/Twitter description                                                                           |
| `THIS_URL`                    | og:url, twitter:url                                                                              |
| `PAGE_CODE`, `ARTICLE_KEY`    | 사내 통계 메타 `hk:nw_pagecode`, `hk:nw_newsid`, 인터랙티브 임베드 `interactive-embed.js?Nid=`   |
| `FOLDER_NAME`                 | OG 이미지 절대 경로 (`/v/{FOLDER_NAME}/img/ogimage.png`, `kakao_og_image`용 `ogimage_kakao.png`) |
| `POST_DATE`, `BYLINE_MEMBERS` | 바이라인                                                                                         |

---

## 5. `src/layouts/Layout.astro`

한국일보 공통 `<head>`: OG, 사내 통계 메타, 웹폰트 CDN, 아이콘폰트 CDN, 카카오 SDK, GA/GTM, 인터랙티브 임베드(헤더+추천), 한국일보 통계 스크립트. **0-1장 필수 요건에 해당하며 삭제, 수정, ID 변경을 금지한다.** 프로젝트에 따라 추가할 수 있는 것은 카카오 지도 SDK, lottie 같은 프로젝트 전용 라이브러리뿐이다.

```astro
---
//@ts-nocheck
import {
  HTML_TITLE,
  HTML_DESC,
  THIS_URL,
  PAGE_CODE,
  ARTICLE_KEY,
  FOLDER_NAME,
} from "../utils/constant/META";
import Byline from "../components/Astro/byline.astro";

import "../styles/style.sass";
---

<!DOCTYPE html>
<!-- class="dark": 페이지 배경이 어두울 때. 인터랙티브 헤더·추천 카드가 이 클래스를 읽어 다크 테마가 된다. 밝은 배경이면 뺀다 (0-1장 "테마") -->
<html lang="ko" class="dark">
  <head>
    <title>{HTML_TITLE} | 한국일보</title>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="description" content={HTML_DESC} />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />

    <!-- Open Graph -->
    <meta property="og:site_name" content="한국일보" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={THIS_URL} />
    <meta property="og:title" content={`[인터랙티브] ${HTML_TITLE}`} />
    <meta property="og:description" content={HTML_DESC} />
    <meta
      property="og:image"
      content={`https://interactive.hankookilbo.com/v/${FOLDER_NAME}/img/ogimage.png`}
    />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <!-- 카카오톡 공유 카드 이미지 (800x800, 절대 경로). 인터랙티브 헤더의 카카오 공유가 이 메타를 읽는다 -->
    <meta
      name="kakao_og_image"
      content={`https://interactive.hankookilbo.com/v/${FOLDER_NAME}/img/ogimage_kakao.png`}
    />
    <meta property="article:author" content="https://www.facebook.com/hkilbo" />
    <meta property="article:publisher" content="https://www.facebook.com/hkilbo" />

    <!-- Twitter -->
    <meta name="twitter:site" content="@hankookilbo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content={THIS_URL} />
    <meta name="twitter:title" content={`[인터랙티브] ${HTML_TITLE}`} />
    <meta name="twitter:description" content={HTML_DESC} />
    <meta
      name="twitter:image"
      content={`https://interactive.hankookilbo.com/v/${FOLDER_NAME}/img/ogimage.png`}
    />
    <meta
      name="twitter:image:src"
      content={`https://interactive.hankookilbo.com/v/${FOLDER_NAME}/img/ogimage.png`}
    />
    <meta name="twitter:image:width" content="1200" />
    <meta name="twitter:image:height" content="630" />
    <meta name="twitter:creator" content="@hankookilbo" />

    <link
      rel="icon"
      href="//image.hankookilbo.com/o/img/favicon.ico"
      type="image/x-icon"
    />

    <!-- 한국일보 사내 통계 메타 -->
    <meta name="hk:nw_newsid" content={ARTICLE_KEY} />
    <meta name="hk:nw_press" content="한국일보" />
    <meta name="hk:nw_presscode" content="hk" />
    <meta name="hk:nw_title" content={`[인터랙티브] ${HTML_TITLE}`} />
    <meta name="hk:nw_pagecode" content={PAGE_CODE} />

    <!-- 웹폰트 (사내 CDN): Pretendard Variable + NanumMyeongjo. 폰트 파일을 저장소에 두지 않는다 (7장 참고) -->
    <link rel="preconnect" href="https://assets.hankookilbo.com" crossorigin="anonymous" />
    <link rel="stylesheet" href="https://assets.hankookilbo.com/fonts/hk_fonts.css" />

    <!-- 한국일보 아이콘 폰트 (로고, SNS 아이콘) -->
    <link
      rel="stylesheet"
      href="https://interactive.hankookilbo.com/addon/icon_font/iconFont.css"
    />

    <!-- 카카오 SDK v2 (공유). 인터랙티브 헤더(header.js)가 같은 주소의 v2를 쓰므로 반드시 이 주소·버전을 유지한다.
         v1(developers.kakao.com/sdk/js/kakao.min.js)을 넣으면 헤더 카카오 공유가 깨진다 (0-1장 참고) -->
    <script
      is:inline
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js"
      integrity="sha384-WAtVcQYcmTO/N+C1N+1m6Gp8qxh+3NlnP7X1U7qP6P5dQY/MsRBNTh+e1ahJrkEm"
      crossorigin="anonymous"
    ></script>
    <script is:inline>
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init("e62df5186f0758def8f14c53e64d7b9d");
      }
    </script>

    <!-- Google tag (gtag.js) — GA4 G-HR08PM6YWZ 하나로 통일. 개편 전 스트림(GTM·UA·다른 G-*)은 넣지 않는다 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-HR08PM6YWZ"></script>
    <script is:inline>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", "G-HR08PM6YWZ");
    </script>

    <!-- 한국일보 인터랙티브 임베드: 헤더 웹컴포넌트 + 추천 카드 (0-1장 참고). Nid는 대문자 N, 값은 META.ts의 ARTICLE_KEY -->
    <script
      is:inline
      src={`https://assets.hankookilbo.com/components/interactive-embed/v1/interactive-embed.js?Nid=${ARTICLE_KEY}`}
      data-scroll-container=".body-wrapper"
    ></script>

    <!-- jQuery — 아래 통계 스크립트(hkAnalTag_hub.js)가 $ 를 쓴다. 반드시 통계 스크립트보다 앞 -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js" is:inline></script>
    <!-- 한국일보 통계 (Hmap 1.0) — www 절대 경로 -->
    <script src="https://www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js" is:inline></script>
  </head>

  <body class="loading">
    <!-- 인터랙티브 헤더(<interactive-header>)는 head의 interactive-embed.js가 이 지점(body 맨 앞)에 자동으로 붙인다 -->
    <!-- body-wrapper :: 모바일 카카오/사파리 등 인앱 브라우저 상·하단 NAV바 고정용 스크롤 컨테이너 -->
    <div class="body-wrapper">
      <div class="full-loader"></div>
      <slot />
      <Byline />
    </div>

    <script>
      import { removeLoader } from "../lib/js/_comm/common.js";

      // iOS Safari 핀치줌 차단
      document.addEventListener(
        "touchmove",
        (event) => {
          if (event.touches.length > 1) event.preventDefault();
        },
        { passive: false }
      );

      // 로더 제거: 페이지 리소스(load)와 웹폰트(document.fonts.ready)가 모두 준비된 뒤.
      // 웹폰트는 load 이벤트를 기다리지 않으므로 fonts.ready를 함께 기다려야
      // 로더가 걷힌 직후 서체가 바뀌는 순간(FOUT)이 보이지 않는다.
      // 무거운 에셋(3D, 영상)이 있으면 해당 컴포넌트에서 직접 removeLoader()를 호출한다.
      const pageLoaded =
        document.readyState === "complete"
          ? Promise.resolve()
          : new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
      Promise.all([pageLoaded, fontsReady]).then(() => removeLoader());
    </script>
  </body>
</html>
```

통계 스크립트(`hkAnalTag_hub.js`)는 `www.hankookilbo.com` 절대 경로라 로컬에서도 로드된다. 콘솔에 404가 나면 경로를 확인한다. 콘솔에 `$ is not defined`가 나면 jQuery가 통계 스크립트 뒤에 있는 것이다 — 순서를 바꾼다 (`self_check.js`가 검사).

---

## 6. 공통 컴포넌트

### `src/components/Astro/byline.astro`

```astro
---
//@ts-nocheck
import {
  HTML_TITLE,
  BYLINE_MEMBERS,
  POST_DATE,
} from "../../utils/constant/META";
---

<div class="byline">
  <!-- 관련 기사 카드·공유 버튼은 넣지 않는다. 추천 카드와 공유 4종은 interactive-embed.js(헤더·하단 추천 카드)가 맡는다 -->
  <div class="wrapper">
    <div class="logo">
      <div class="title"><span>{HTML_TITLE}</span></div>
    </div>
    <div class="post-date"><p>Posted by {POST_DATE}</p></div>

    {
      BYLINE_MEMBERS.map((item) => (
        <dl>
          <dt>{item.dept}</dt>
          <dd>{item.members}</dd>
        </dl>
      ))
    }

    <p class="copy">세상을 보는 균형, 한국일보 Copyright © Hankookilbo</p>
  </div>
</div>
```

---

## 7. 스타일

### `src/styles/style.sass` (진입점)

```sass
@import 'variables'
@import 'utils'

*
  box-sizing: border-box

// 모바일 카카오/사파리 인앱 브라우저 상·하단 NAV바 고정: html/body는 스크롤하지 않는다
html, body
  height: 100%
  overflow: hidden
  overflow-x: hidden
  overscroll-behavior-y: none

body
  margin: 0
  padding: 0
  font-family: $fontBase
  background-color: $bgBase
  color: $fontColBase
  min-height: 100%

  // 실제 스크롤 컨테이너
  .body-wrapper
    position: fixed
    top: 0
    padding: 0
    width: 100%
    height: 100%
    overflow-y: scroll
    overflow-x: hidden
    background-color: $bgBase
    -webkit-overflow-scrolling: touch
    border: 1px transparent solid
    border-right: unset

main
  display: block
  background-color: $bgBase

a
  color: inherit
  text-decoration: none
img
  border: 0
  max-width: 100%
button
  cursor: pointer
input, button, select
  font: inherit
  cursor: pointer
label
  cursor: pointer
ul, ol
  list-style: none
  margin: 0
  padding: 0
h1, h2, h3, h4, h5, h6, p
  margin: 0
  padding: 0

.hidden
  position: absolute
  width: 1px
  height: 1px
  overflow: hidden
  clip: rect(0,0,0,0)

@import 'full_loader'
@import 'byline'

// 프로젝트별 스타일은 아래에 추가
// @import 'intro'
```

### `src/styles/_variables.sass`

```sass
@use 'sass:math'

// size
$wrapper-width: 900px

// font family — 파일은 사내 CDN(hk_fonts.css)이 제공한다. 이름은 여기서만 정한다 (7장 참고)
$fontBase: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, sans-serif
$fontSerif: 'NanumMyeongjo', serif

// font size: PC 기준 이름, 모바일에서 clamp로 축소
$fontCalc: calc( -0.5214rem + 3.6952vw)
$font12: clamp(10px, $fontCalc, 12px)
$font13: clamp(11px, $fontCalc, 13px)
$font14: clamp(12px, $fontCalc, 14px)
$font15: clamp(13px, $fontCalc, 15px)
$font16: clamp(14px, $fontCalc, 16px)
$font18: clamp(15px, $fontCalc, 18px)
$font20: clamp(18px, $fontCalc, 20px)
$font22: clamp(20px, $fontCalc, 22px)
$font26: clamp(22px, $fontCalc, 26px)
$font32: clamp(24px, $fontCalc, 32px)
$font36: clamp(26px, $fontCalc, 36px)
$font38: clamp(28px, $fontCalc, 38px)

// colors (다크 테마 기본, 프로젝트마다 변경). 밝은 배경으로 바꾸면 Layout의 <html>에서 class="dark"도 뺀다 (0-1장 "테마")
$bgBase: #111
$bgBaseBlur: rgba(255,255,255,0.6)
$fontColBase: #fff

// z-index
$z-gnb: 100
$z-main: 10
$z-layer: 200

// utils
$easing: cubic-bezier(0.17, 0.67, 0.21, 1)

// media query
$mobile-width: 800
$tablet-limit: 1200
$tablet-width: 1440
$tablet-ratio: math.div($tablet-width, 100)
```

### `src/styles/_utils.sass`

```sass
@use 'sass:math'

@mixin clear()
  &::after
    content: ''
    display: block
    clear: both

// 801px ~ 1440px
@mixin tablet
  @media (min-width: ($mobile-width + 1) + px) and (max-width: $tablet-width + px)
    @content

// 801px ~ 1200px
@mixin tablet-limit
  @media (min-width: ($mobile-width + 1) + px) and (max-width: $tablet-limit + px)
    @content

// ~ 800px
@mixin mobile
  @media (max-width: $mobile-width + px)
    @content

@function rem($pixels, $context: 16)
  @return #{ math.div($pixels, $context) }rem

@function em($pixels, $context: 16)
  @return #{ math.div($pixels, $context) }em

@function rem-ratio($px)
  @return calc(#{ math.div($px, $tablet-width) } * 100vw)
```

사용 예:

```scss
.section {
  padding: 80px 0;
  font-size: $font18;
  @include mobile {
    padding: 40px 20px;
  }
}
```

### 웹폰트 — 사내 CDN 사용 (`_fonts.scss` 없음)

폰트 파일을 저장소나 `public/fonts/`에 두지 않는다. `Layout.astro` `<head>`에서
사내 CDN의 `https://assets.hankookilbo.com/fonts/hk_fonts.css`를 링크하면 아래
서체가 제공된다 (5장 Layout 원문 참고).

| CSS `font-family` 값    | 굵기            | 비고                                         |
| ----------------------- | --------------- | -------------------------------------------- |
| `'Pretendard Variable'` | 45~920 (가변)   | 동적 서브셋 — 화면에 쓰인 글자 조각만 받는다 |
| `'NanumMyeongjo'`       | 400 / 700 / 800 | woff2                                        |

`hk_fonts.css`에는 `font-display: swap`이 걸려 있다. 폰트가 늦게 오면 기본 서체로
먼저 그려졌다가 바뀌는데, Layout의 로더가 `document.fonts.ready`까지 기다렸다가
걷히므로 사용자 눈에는 보이지 않는다.

스타일에서는 서체 이름을 직접 쓰지 말고 `_variables.sass`의 `$fontBase`,
`$fontSerif`를 쓴다. `NotoSerifKR`, `NanumSquareNeo` 등 CDN에 없는 서체는 쓰지
않는다. 새 서체가 필요하면 `hk_fonts.css`에 추가해 달라고 프론트개발팀에 요청한다
(`@font-face`를 프로젝트에 직접 선언하지 않는다).

로컬 확인: 개발 서버(`localhost:3000`)와 배포 도메인(`interactive.hankookilbo.com`)이
CDN의 CORS 허용 목록에 있어야 폰트가 뜬다. 기본 서체로만 보이고 콘솔에 CORS
에러가 있으면 코드 문제가 아니라 CDN 허용 목록 문제이므로 프론트개발팀에 문의한다.

### `src/styles/_full_loader.sass`

```sass
.full-loader
  position: fixed
  top: 0
  left: 0
  width: 100%
  height: 100%
  background: #282828 url(../img/common/full_loader_bg.png) no-repeat 50% 50%
  transition: .1s
  visibility: hidden
  opacity: 0
  z-index: -1

  .loading &
    opacity: 1
    visibility: visible
    z-index: 3000
  &::after
    content: ''
    position: absolute
    top: 50%
    left: 50%
    margin: -101px 0 0 -102px
    width: 204px
    height: 202px
    background-image: url(../img/common/full_loader_spinner.png)
    animation: rotateLoader 1.5s infinite linear

@keyframes rotateLoader
  0%
    transform: rotate(0deg)
  100%
    transform: rotate(359deg)

// 로딩 화면이 떠 있는 동안 인터랙티브 헤더를 가린다 (0-1장 "헤더"의 유일한 예외).
// 헤더는 .body-wrapper 밖에 fixed(z-index 650)로 붙고 .body-wrapper는 별도 stacking context라
// .full-loader의 z-index 3000으로는 덮이지 않는다. 로더가 걷히면(body.loaded) 자동으로 다시 보인다.
// visibility/display가 아니라 opacity를 쓴다: 헤더 shadow DOM 안의 <header>가 visibility: visible을
// 직접 갖고 있어 호스트를 hidden으로 해도 자식이 다시 보인다. opacity는 자식이 뒤집을 수 없다.
// !important 필수: 헤더 :host의 자체 애니메이션(wc-reveal)보다 우선해야 한다
body.loading interactive-header
  opacity: 0 !important
  pointer-events: none !important
```

### `src/styles/_byline.scss`

```scss
@mixin byline-font {
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  letter-spacing: 0px;
  color: $fontColBase;
  font-family: $fontBase;
}

.byline {
  position: relative;
  background: none;
  padding: 40px 20px;
  min-height: 100lvh;
  text-align: center;
  z-index: 199;

  .logo .title {
    position: relative;
    margin-bottom: 28px;
    font-size: 14px;
    line-height: 2;
    font-weight: 700;
    font-family: $fontBase;
    color: $fontColBase;

    span {
      display: block;
      font-size: 18px;
      color: inherit;
    }
  }

  .post-date {
    margin-bottom: 28px;
    @include byline-font;
  }

  dl {
    margin: 0 0 14px;
    dt {
      display: block;
      padding-right: 7px;
      margin-bottom: 10px;
      @include byline-font;
      font-weight: 700;
    }
    dd {
      display: inline-block;
      margin: 0;
      @include byline-font;
    }
  }

  .copy {
    margin: 0;
    padding-bottom: 120px;
    @include byline-font;
    @include mobile {
      font-size: $font14;
    }
  }
}

// (구) "인터랙티브 더보기" 위젯 (hkUtilMoreInteractive) 테마 오버라이드 — 새 프로젝트는 interactive-embed.js를 쓰므로 해당 없음. 유지해도 무해
.next-articles.globalVariable {
  background: $bgBaseBlur;
  color: $fontColBase;

  h2 {
    color: inherit;
    span {
      color: inherit;
      font-family: $fontBase;
      font-weight: 700;
    }
  }
  .next-articles-close::after,
  .next-articles-close::before {
    border-top: 2px solid $fontColBase;
  }
  .all-link {
    color: $fontColBase;
    border: 1px solid $fontColBase;
    font-family: $fontBase;
    span.icon-hk-arrow_r:before {
      color: $fontColBase;
    }
  }
}
```

---

## 8. 공통 JS 라이브러리

### `src/lib/js/_comm/common.js`

```js
/** 초기 로딩 화면 제거 */
export function removeLoader() {
  document.body.classList.remove("loading");
  document.body.classList.add("loaded");
}
```

### `src/lib/js/_comm/ioScroll.js`

```js
const options = {
  root: null,
  rootMargin: "0px 0px 0px 0px",
  threshold: 0.5,
};

/**
 * 텍스트 박스가 보이면 같은 data-id를 가진 배경 자식에 activeClassName 부여
 *
 * <section class="bg-con">
 *   <div class="bg-con-inner" data-id="a"></div>
 *   <div class="bg-con-inner" data-id="b"></div>
 * </section>
 * <section>
 *   <div class="para-con" data-id="a">…</div>
 *   <div class="para-con" data-id="b">…</div>
 * </section>
 */
export function scrollChangeBgByTextBox(
  elements,
  bgContainer,
  activeClassName,
) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = bgContainer.querySelector(
        `[data-id="${entry.target.dataset.id}"]`,
      );
      if (!target) return;
      target.classList.toggle(activeClassName, entry.isIntersecting);
    });
  }, options);
  elements.forEach((el) => io.observe(el));
}

/**
 * 텍스트 박스가 보이면 그 박스의 data-class-name을 배경 컨테이너에 부여
 *
 * <section class="bg-con"></section>
 * <div class="para-con" data-class-name="up">1</div>
 * <div class="para-con" data-class-name="down">2</div>
 */
export function scrolladdClassToBgByTextBox(elements, bgContainer) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      bgContainer.classList.toggle(
        entry.target.dataset.className,
        entry.isIntersecting,
      );
    });
  }, options);
  elements.forEach((el) => io.observe(el));
}

/**
 * 컨테이너 기준 스크롤 진행률 (0 ~ 1). 스크롤 컨테이너는 .body-wrapper.
 *
 * const wrapper = document.querySelector(".body-wrapper");
 * wrapper.addEventListener("scroll", () => {
 *   const p = scrollPercentage(section);
 * });
 */
export function scrollPercentage(containerElement) {
  const wrapper = document.querySelector(".body-wrapper");
  const start = containerElement.offsetTop;
  const height = containerElement.offsetHeight;
  const percentage =
    (wrapper.scrollTop - start) / (height - wrapper.clientHeight);
  return Math.min(1, Math.max(0, percentage));
}
```

### `src/lib/js/_comm/util.js`

```js
/** 1234567 → "1,234,567" */
export function addComma(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 배열을 size 단위로 자름 */
export function chunkArray(arr, size) {
  const groups = [];
  for (let i = 0; i < arr.length; i += size) {
    groups.push(arr.slice(i, i + size));
  }
  return groups;
}
```

---

## 9. 데이터 파일 패턴 `src/data/data.ts`

본문 텍스트, 이미지 경로, 챕터 정보는 `.astro`에 하드코딩하지 않고 `src/data/*.ts`에 타입과 함께 둔다. 기자가 텍스트만 수정할 수 있게 하기 위해서다.

```ts
export interface Story {
  /** 문단 배열. HTML 문자열 허용 (set:html) */
  description: string[];
  align?: "left" | "right" | "center";
  title?: string;
  subtitle?: string;
  /** ./img/... 상대 경로 */
  image?: string;
  imageMaxWidth?: string;
  /** 타임라인 스텝 라벨 (있으면 스텝퍼 표시) */
  stepLabel?: string;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  /** 배경 이미지 ./img/... */
  bg?: string;
  /** 상단 챕터 내비에 노출 여부 */
  showNav?: boolean;
  stories: Story[];
}

export const chapters: Chapter[] = [
  {
    id: "ch1",
    title: "1장 제목",
    bg: "./img/bgs/ch1.jpg",
    showNav: true,
    stories: [
      {
        description: [
          "첫 문단입니다.",
          "두 번째 문단입니다. <strong>강조</strong> 가능.",
        ],
      },
    ],
  },
];
```

---

## 10. 페이지 패턴 (`src/pages/index.astro`)

### 패턴 A. 단순 롱폼

```astro
---
import Layout from "../layouts/Layout.astro";
import "../styles/longform.scss";
---

<Layout>
  <main class="longform">
    <section class="hero">
      <h1>제목</h1>
      <p class="lead">부제</p>
    </section>

    <section class="article">
      <p>본문…</p>
      <figure>
        <img src="./img/photo1.jpg" alt="설명" loading="lazy" />
        <figcaption>캡션</figcaption>
      </figure>
    </section>
  </main>
</Layout>
```

### 패턴 B. 스크롤리텔링 (고정 배경 + 스크롤 텍스트)

핵심 구조: `position: sticky` 배경 컨테이너 + 각 `100vh` 이상의 `section`. `IntersectionObserver`로 화면 중앙에 들어온 섹션 인덱스를 배경에 전달한다.

```astro
---
import Layout from "../layouts/Layout.astro";
import { chapters } from "../data/data";
import "../styles/scrolly.scss";
---

<Layout>
  <main class="scrolly">
    <!-- 배경 레이어 -->
    <div class="bg-container">
      {
        chapters.map((ch, i) => (
          <div class="bg-item" data-index={i} style={`background-image:url(${ch.bg})`} />
        ))
      }
    </div>

    <!-- 전경 레이어 -->
    <div class="content-overlay">
      {
        chapters.map((ch, i) => (
          <section class="story-section" data-index={i}>
            <div class="story-box">
              <h2>{ch.title}</h2>
              {ch.stories.map((s) => s.description.map((d) => <p set:html={d} />))}
            </div>
          </section>
        ))
      }
    </div>
  </main>
</Layout>

<script>
  const bgItems = document.querySelectorAll<HTMLElement>(".bg-item");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = Number(entry.target.getAttribute("data-index"));
        bgItems.forEach((bg, i) => bg.classList.toggle("on", i === index));

        // React 아일랜드에 알릴 때
        window.dispatchEvent(new CustomEvent("section-change", { detail: index }));
      });
    },
    // 화면 중앙 10% 구간에 들어올 때만 트리거
    { root: null, rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  document.querySelectorAll(".story-section").forEach((s) => observer.observe(s));
</script>
```

```scss
// src/styles/scrolly.scss
@import "variables";
@import "utils";

.scrolly {
  position: relative;
  width: 100%;
}

.bg-container {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  z-index: 0;
  overflow: hidden;
  background: #000;

  .bg-item {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    opacity: 0;
    transition: opacity 0.8s $easing;
    &.on {
      opacity: 1;
    }
  }
}

.content-overlay {
  position: relative;
  z-index: 1;
  pointer-events: none;
}

.story-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
}

.story-box {
  pointer-events: auto;
  max-width: 640px;
  padding: 32px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  border-radius: 8px;
  font-size: $font18;
  line-height: 1.8;

  h2 {
    font-family: $fontSerif;
    font-size: $font32;
    margin-bottom: 20px;
  }
  p + p {
    margin-top: 1em;
  }
  @include mobile {
    padding: 20px;
  }
}
```

### 패턴 C. React 아일랜드 (상태가 있는 UI)

React는 **상태가 필요한 부분만** 쓴다. Astro 스크립트와는 `window` CustomEvent로 통신한다.

```tsx
// src/components/Counter.tsx
import { useEffect, useState } from "react";
import "../styles/counter.scss";

const SECTION_CHANGE_EVENT = "section-change";

export default function Counter() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const onSectionChange = (e: Event) => {
      setActiveIndex((e as CustomEvent<number>).detail);
    };
    window.addEventListener(SECTION_CHANGE_EVENT, onSectionChange);
    return () =>
      window.removeEventListener(SECTION_CHANGE_EVENT, onSectionChange);
  }, []);

  return (
    <div className="counter" role="status" aria-live="polite">
      현재 챕터 {activeIndex + 1}
    </div>
  );
}
```

```astro
<!-- index.astro 안에서 -->
import Counter from "../components/Counter";

<Counter client:idle />
```

| 디렉티브              | 언제 쓰나                                                                  |
| --------------------- | -------------------------------------------------------------------------- |
| `client:load`         | 첫 화면에 바로 보이고 즉시 상호작용해야 하는 UI                            |
| `client:idle`         | 우선순위 낮은 UI (내비, 가이드)                                            |
| `client:visible`      | 스크롤해서 내려가야 보이는 UI (차트, 갤러리)                               |
| `client:only="react"` | **`window`, `document`, WebGL(three.js)을 쓰는 컴포넌트.** SSR을 건너뛴다. |

three.js / react-three-fiber는 반드시 `client:only="react"`로 마운트한다.

### 패턴 D. 데이터 시각화

- 정적 차트는 SVG를 `.astro`에서 데이터로 직접 그린다 (JS 0kb).
- 인터랙션(hover, 필터)이 필요하면 React 아일랜드 + `client:visible`.
- 외부 차트 라이브러리를 쓴다면 번들 크기를 먼저 확인한다. d3는 필요한 모듈만 (`d3-scale`, `d3-shape`) 설치한다.

---

## 11. `public/` 필수 파일

| 파일                                 | 규격       | 비고                                                |
| ------------------------------------ | ---------- | --------------------------------------------------- |
| `img/ogimage.png`                    | 1200 × 630 | 페이스북·X 공유 카드. **필수** — `self_check.js`가 존재·픽셀 크기를 검사한다 |
| `img/ogimage_kakao.png`              | 800 × 800  | 카카오톡 공유 카드 (`kakao_og_image` 메타가 가리킴). **필수** — 크기 검사 동일 |
| `img/common/full_loader_bg.png`      |            | 로더 배경 (스킬 `assets/common/`에서 복사)          |
| `img/common/full_loader_spinner.png` | 204 × 202  | 로더 스피너 (스킬 `assets/common/`에서 복사)        |
| `favicon.svg`                        |            | 실제 파비콘은 Layout에서 CDN 사용                   |

`img/common/`의 로더 이미지 2개는 스킬의 `assets/common/`에 있는 실제 파일을 그대로 복사한다. 새로 만들 필요 없다.

공유 이미지 2장은 **프로젝트마다 새로 만들어 올린다.** 담당자가 주지 않으면 대표 사진으로 만들어 승인받는다. 템플릿 자리 이미지인 채로, 또는 크기가 다른 채로 두면 `self_check.js`가 실패 처리하고 배포하지 않는다. 형식은 PNG, 크기는 정확히 1200×630 / 800×800.
**`public/fonts/` 폴더는 만들지 않는다.** 폰트는 CDN에서 온다 (7장 웹폰트).

이미지 최적화 기준:

- 배경 사진: 1920px 폭, JPG 품질 75~80, 300KB 이하
- 모바일 전용 배경: 1080px 폭 별도 제공 (`<picture>` 또는 `@include mobile` 배경 교체)
- PNG는 투명이 필요할 때만. 그 외 JPG 또는 WebP.

---

## 12. 규칙과 함정 (AI가 반드시 지켜야 함)

### 스크롤

- **스크롤 컨테이너는 `.body-wrapper`다.** `html, body`는 `overflow: hidden`이다.
- 다음 코드는 **동작하지 않는다**: `window.scrollY`, `window.addEventListener("scroll")`, `document.documentElement.scrollTop`, `window.scrollTo()`.
- 대신: `document.querySelector(".body-wrapper").scrollTop`, `.addEventListener("scroll")`, `.scrollTo()`.
- `IntersectionObserver`는 `root: null`로 두어도 정상 동작한다 (뷰포트 기준).
- `element.scrollIntoView({ behavior: "smooth" })`는 정상 동작한다.
- `position: sticky`는 `.body-wrapper` 안에서 정상 동작한다.
- `position: fixed` 요소는 `.body-wrapper` 바깥 기준(뷰포트)으로 붙는다. 이것은 의도된 동작이다.

### 경로

- `astro.config.mjs`의 `base: "./"` 때문에 **모든 public 경로는 `./`로 시작**한다.
  - `.astro`, `.tsx` 안: `<img src="./img/photo.jpg" />`
  - `.sass`, `.scss` 안: `background: url("../img/photo.jpg")`
- `/img/...` 절대 경로는 배포 후 404가 난다.
- `src/` 안의 이미지를 `import`하는 Astro 이미지 최적화(`astro:assets`)는 쓰지 않는다. 모두 `public/`에 둔다.

### 뷰포트, 모바일

- 높이는 `100vh` 다음 줄에 `100dvh`를 한 번 더 써서 폴백을 만든다.
- 브레이크포인트는 `@include mobile` (800px 이하) 하나를 기본으로 쓴다. `768px` 같은 임의 값을 새로 만들지 않는다.
- 핀치줌은 Layout에서 차단된다. 이미지 확대가 필요하면 `medium-zoom`을 쓴다.
- 카카오톡 인앱 브라우저에서 `100vh`가 주소창을 포함한다. `body-wrapper` 구조가 이를 해결하므로 구조를 바꾸지 않는다.

### 스크립트

- 외부 CDN 스크립트, 인라인 전역 스크립트는 `<script is:inline>`으로 쓴다. Astro가 번들링하지 않는다.
- `import`가 있는 스크립트는 `is:inline` 없이 `<script>`로 쓴다. Astro가 번들링한다.
- `.astro`의 `<script>`는 페이지에 한 번만 실행된다. 컴포넌트가 여러 번 렌더돼도 스크립트는 1회이므로 `querySelectorAll`로 전부 처리한다.
- React 컴포넌트에서 `window`를 쓰면 `useEffect` 안에서만 쓰거나 `client:only="react"`로 마운트한다.
- React 아일랜드 JSX에서 인접한 텍스트 표현식을 나란히 쓰지 않는다 (`{a} / {b}` 금지, `{`${a} / ${b}`}`로). `astro-compress`가 SSR의 텍스트 구분 주석을 지워 hydration 오류(React #418)가 난다.

### 스타일

- `.sass`(들여쓰기)와 `.scss`(중괄호)를 혼용한다. 기존 파일 문법을 따르고, 새 파일은 `.scss`로 만든다.
- 컴포넌트 스타일은 컴포넌트 파일에서 `import "../styles/xxx.scss"`로 가져오거나 `style.sass`에 `@import` 한다. 두 방식을 한 파일에 섞지 않는다.
- 컴포넌트 `.scss`에서 변수, 믹스인을 쓸 때는 파일 상단에 `@import "variables"; @import "utils";`를 추가한다.
- 폰트 크기는 `$font16` 같은 변수를 쓴다. `px` 직접 지정은 14px 이하의 캡션에만 허용한다.
- 매직 넘버는 변수로 뺀다. 예: `$story-box-max-width: 640px`.
- 테마는 `<html>`의 `dark` 클래스 하나로 정한다. 배경이 어두우면 `class="dark"`, 밝으면 없음. 둘 중 하나로 고정하고 전환 기능은 만들지 않는다 (0-1장 "테마").

### 접근성

- 아이콘만 있는 버튼에는 `aria-label`.
- 이미지에는 의미 있는 `alt`. 장식용은 `alt=""`.
- 클릭 요소는 `<button>` 또는 `<a>`. `<div onclick>` 금지.
- 자동재생 영상은 `muted playsinline` 필수, 음소거 해제 버튼 제공.

### 성능

- 첫 화면 밖 이미지는 `loading="lazy" decoding="async"`.
- 영상은 `preload="metadata"`, 포스터 이미지 필수.
- three.js는 필요한 프로젝트에만 설치한다. 기본 템플릿에 포함하지 않는다.
- `npm run build` 후 `dist/` 폴더 총 크기를 확인한다. 10MB 이하가 목표다 (폰트는 CDN이라 포함되지 않는다).

### 금지

- Vue, Svelte, Solid 등 React 외 UI 프레임워크.
- Tailwind. 기존 sass 시스템과 충돌한다.
- `output: "server"`, SSR 어댑터. 정적 FTP 배포만 가능하다.
- `META.ts` 이외 파일에 제목, URL, 기사 키 하드코딩.
- Layout의 GA/GTM/`hk:` 메타 태그, 한국일보 통계 스크립트, 인터랙티브 임베드 스크립트 삭제 또는 수정. `Nid`를 하드코딩하거나 소문자 `nid`로 쓰는 것도 금지 (항상 `${ARTICLE_KEY}`).
- `astro.config.mjs`에 `outDir` 지정 (산출물은 항상 `dist/`).
- Byline을 Layout에서 제거하거나 `body-wrapper` 밖으로 이동. 바이라인의 저작권 문구 삭제·변경.
- 자체 헤더(구 ArticleBar 등) 추가, `<interactive-header>` 숨김·이동. 헤더는 임베드 스크립트가 붙이는 것 하나만 쓴다.
  (예외: 로딩 화면이 떠 있는 동안만 `body.loading interactive-header { opacity: 0 !important; pointer-events: none !important }` — 0-1장 "헤더", 7장 `_full_loader.sass`)
- 카카오 SDK v1(`developers.kakao.com/sdk/js/kakao.min.js`) 로드. 인터랙티브 헤더의 v2와 충돌해 공유가 깨진다.
- `public/fonts/` 폴더, 폰트 파일(woff/woff2/ttf/otf/eot) 커밋, `@font-face` 직접 선언. 폰트는 `hk_fonts.css`(CDN)만 쓴다.

---

## 13. 개발, 빌드, 배포

```bash
# 설치
npm install

# 개발 서버 (http://localhost:3000 — astro.config.mjs의 server.port로 고정)
npm run dev

# 프로덕션 빌드 → dist/ (출력 폴더명 변경 금지)
npm run build

# 빌드 결과 로컬 확인
npm run preview
```

배포 절차:

1. `META.ts`의 `FOLDER_NAME`, `THIS_URL`, `ARTICLE_KEY`, `PAGE_CODE`가 실제 값인지 확인.
2. `npm run build`. 산출물은 반드시 `dist/`.
3. 0-1장 "빌드 후 자동 검증" 스크립트 실행. `MISSING` 0건 확인.
4. `dist/` 안의 **모든 파일**을 FTP로 `interactive.hankookilbo.com/v/{FOLDER_NAME}/`에 업로드.
5. `https://interactive.hankookilbo.com/v/{FOLDER_NAME}/` 접속 확인.
6. 기사 CMS에서 인터랙티브 URL을 연결 (`https://www.hankookilbo.com/interactive/...`).
7. OG 캐시 갱신: [페이스북 디버거](https://developers.facebook.com/tools/debug/), 카카오 공유 캐시 초기화.

---

## 14. 배포 전 QA 체크리스트

```
--- 필수 요건 (0-1장) ---
[ ] npm run build 산출물이 dist/ 에 생성됨 (dist/index.html 존재)
[ ] dist/index.html 에 G-HR08PM6YWZ 포함, 개편 전 ID(GTM-59599H7, UA-53476308-*, G-ZPZ8BHZPSJ, G-BZHTEE2B8L) 없음
[ ] dist/index.html 에 https://code.jquery.com/jquery-3.7.1.min.js 포함, hkAnalTag_hub.js 보다 앞
[ ] dist/index.html 에 https://www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js 포함 (hkFunc.js 없음)
[ ] dist/index.html 에 hk:nw_* 메타 5종 포함
[ ] dist/index.html 에 interactive-embed.js?Nid=<ARTICLE_KEY> 포함 (대문자 N, 값이 META.ts와 동일)
[ ] 임베드 스크립트에 data-scroll-container=".body-wrapper" 포함 (헤더 숨김·추천 카드가 .body-wrapper 스크롤을 따라간다)
[ ] dist/index.html 에 assets.hankookilbo.com/fonts/hk_fonts.css 포함
[ ] dist/ 안에 폰트 파일(woff/woff2/ttf) 없음
[ ] 인터랙티브 헤더(<interactive-header>)가 body 맨 앞에 뜸 (임베드 스크립트가 붙임, 자체 헤더 없음)
[ ] 로딩 화면(스피너)이 떠 있는 동안 헤더가 보이지 않고, 로더가 걷힌 뒤 헤더가 나타남 (_full_loader.sass의 body.loading interactive-header { opacity: 0 !important } 규칙)
[ ] <html>의 dark 클래스가 페이지 배경과 맞음 (어두운 배경 = class="dark") — 헤더 로고가 배경 위에서 보임
[ ] dist/index.html 에 kakao_og_image 메타 포함, developers.kakao.com/sdk 없음
[ ] 바이라인(byline)이 본문 아래에 렌더됨
[ ] body.loading > .body-wrapper > .full-loader 구조 유지
[ ] 0-1장 자동 검증 스크립트 MISSING 0건

--- 콘텐츠 ---
[ ] META.ts 6개 상수 + POST_DATE + BYLINE_MEMBERS 모두 실제 값
[ ] public/img/ogimage.png (1200x630), public/img/ogimage_kakao.png (800x800) 업로드, 빌드 후 dist/img/ 에도 복사됨 — self_check.js 크기 검사 통과
[ ] dist/index.html 에 og:locale ko_KR, og:image:width/height 1200/630, twitter:image:width/height 1200/630 포함
[ ] <title> "제목 | 한국일보" 확인
[ ] 인터랙티브 헤더 공유 4종 (페북, X, 카카오, URL 복사) 동작 — 카카오 카드에 ogimage_kakao.png가 뜸. 바이라인에 공유 버튼 없음
[ ] 바이라인 제작진, 게시일, 맨 끝 저작권 문구 (관련 기사 카드·공유 버튼 없음)
[ ] 인터랙티브 헤더(<interactive-header>)가 body 맨 앞에 뜨고, 스크롤 후 하단 추천 카드가 뜸 (자기 기사는 추천에 없음)
[ ] 모바일 크롬, 사파리, 카카오톡 인앱, 네이버 인앱에서 스크롤 확인
[ ] iOS 사파리 하단 주소창 겹침 없음
[ ] 콘솔 에러 0 (/Inc/Js/*.js 404는 로컬에서만 정상)
[ ] 모든 이미지 경로 ./ 상대경로, 404 없음
[ ] 로더가 콘텐츠 준비 후 사라짐
[ ] 서체가 Pretendard Variable / NanumMyeongjo로 렌더됨 (Network 탭 assets.hankookilbo.com/fonts 요청 200, CORS 에러 없음)
[ ] 첫 화면 밖 이미지 lazy 로딩
[ ] dist/ 폴더 크기 확인
[ ] 텍스트 오탈자 최종 확인 (기자 컨펌)
```

---

## 15. 문의

디지털미디어부 인터랙티브 제작팀.
기존 프로젝트 참고: 「신군부 언론 통제」(media-control, 2026.03) 저장소의 `src/` 구조와 `Layout.astro`를 원본으로 삼았다.
