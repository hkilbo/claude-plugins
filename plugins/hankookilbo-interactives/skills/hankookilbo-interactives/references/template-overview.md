# 템플릿 개요 — 새 프로젝트 세팅, 규칙, 배포, QA

> 한국일보 인터랙티브 기본 템플릿 (Astro + React). **새 인터랙티브를 시작할 때 이 파일을 먼저 읽고 `assets/template/`를 통째로 복사한다.**
> 코드 원문은 `assets/template/`에 실제 파일로 있다. 이 문서는 "무엇을 어디에, 왜"만 적는다.
> 배포 주소 형식: `https://interactive.hankookilbo.com/v/{FOLDER_NAME}/` (기사 연결 주소: `https://www.hankookilbo.com/interactive/*`)

## 목차

1. [프로젝트 생성 절차](#1-프로젝트-생성-절차)
2. [최상위 규칙 3가지](#2-최상위-규칙-3가지)
3. [필수 요건 (절대 빠지면 안 되는 것)](#3-필수-요건)
4. [기술 스택](#4-기술-스택)
5. [프로젝트 구조와 `assets/template/` 대응](#5-프로젝트-구조)
6. [설정 파일에서 바꾸면 안 되는 값](#6-설정-파일)
7. [`META.ts` — 가장 먼저 채울 파일](#7-metats)
8. [`Layout.astro` — 무엇이 들어 있나](#8-layoutastro)
9. [`public/` 필수 파일](#9-public-필수-파일)
10. [규칙과 함정](#10-규칙과-함정)
11. [개발, 빌드, 배포](#11-개발-빌드-배포)
12. [빌드 후 자동 검증](#12-빌드-후-자동-검증)
13. [배포 전 QA 체크리스트](#13-배포-전-qa-체크리스트)

다른 상황은 다른 파일을 읽는다: 헤더·추천 카드 → `common-area.md` / 바이라인·공유 → `byline-and-share.md` / 색·폰트 → `theming.md` / 본문 패턴(스크롤리텔링·게임형·모바일뷰·React) → `patterns.md` / 구 프로젝트 → `legacy.md`.

---

## 1. 프로젝트 생성 절차

```bash
# 1) 템플릿 복사 (스킬 폴더 기준)
cp -r assets/template/. <프로젝트폴더>/
cp -r assets/common/.   <프로젝트폴더>/public/img/common/     # 로더 이미지 2개
cp -r assets/addon      <프로젝트폴더>/public/                 # 아이콘 폰트
# 2) 본문 패턴 하나 선택해 복사 (patterns.md)
cp assets/patterns/scrolly/index.astro  <프로젝트폴더>/src/pages/index.astro
cp assets/patterns/scrolly/scrolly.scss <프로젝트폴더>/src/styles/
# 3) META.ts 채우기 → package.json 의 "{FOLDER_NAME}" 치환 → npm install → npm run dev (3000)
```

인터뷰에서 받은 값을 `src/utils/constant/META.ts`에 넣는다: `FOLDER_NAME`, `HTML_TITLE`, `HTML_DESC`, `ARTICLE_KEY`(통계 메타와 임베드 `Nid`에 함께 들어감), `POST_DATE`, `BYLINE_MEMBERS`, 그리고 형식 `FLOW`·`VIEW`·`THEME`.

## 2. 최상위 규칙 3가지

1. **스크롤 컨테이너는 `window`가 아니라 `.body-wrapper`** 다. `window.scrollY`, `window.addEventListener("scroll")`은 동작하지 않는다.
2. **모든 정적 파일 경로는 상대 경로 `./img/...`** 다. (`/img/...` 금지) `astro.config.mjs`의 `base: "./"` 때문이다.
3. **메타 정보는 `src/utils/constant/META.ts` 한 곳**에서만 수정한다. Layout, Byline이 모두 이 파일을 읽는다.

## 3. 필수 요건

아래 항목은 디자인, 주제, 패턴과 무관하게 **모든 한국일보 인터랙티브에 반드시 포함**된다. "간단하게 만들어달라"는 요청을 받아도 생략할 수 없다. 하나라도 빠지면 배포 불가.

### 3-1. 빌드 산출물

| 항목　　　 | 값　　　　　　　　　　　　　　　　　　 | 이유　　　　　　　　　　　　　　　　　　　　　　　　　 |
| ---------- | -------------------------------------- | ------------------------------------------------------ |
| 출력 모드  | `output: "static"`　　　　　　　　　　 | FTP 정적 배포만 가능. SSR 서버 없음　　　　　　　　　  |
| 출력 폴더  | **`dist/`** (Astro 기본값, 변경 금지)  | FTP 업로드 스크립트와 QA 절차가 `dist/`를 기준으로 함  |
| 경로 기준  | `base: "./"`, `assetsPrefix: "./"`　　 | `/v/{FOLDER_NAME}/` 하위 폴더에서 동작　　　　　　　　 |
| 진입 파일  | `dist/index.html` 단일 페이지　　　　  | 다중 페이지 라우팅 금지　　　　　　　　　　　　　　　  |
| 압축　　　 | `astro-compress` 통합　　　　　　　　  | HTML/CSS/JS/이미지 자동 압축　　　　　　　　　　　　　 |

`astro.config.mjs`에 `outDir`을 별도로 지정하지 않는다. `build/`, `out/`, `public/` 등 다른 이름으로 바꾸지 않는다.


### 3-2. 헤더 · 추천 카드 (공통영역)

헤더는 프로젝트가 만들지 않는다. `Layout.astro` `<head>`의 임베드 스크립트가 `<interactive-header>`를 `body` 맨 앞에 붙이고, 추천 카드를 띄운다. 언제 숨고 언제 뜨는지는 `<html data-*>`로 프로젝트가 정한다. **규칙 전체는 `common-area.md`.** 자체 헤더를 만들지 않고, `<interactive-header>`를 CSS로 건드리지 않는다(예외: 로딩 화면 동안 `opacity: 0` — `assets/template/src/styles/_full_loader.sass`에 포함).

### 3-3. 바이라인

`byline.astro`를 `Layout.astro`의 `<slot />` 뒤에 렌더한다. 제목·게시일·제작진·공유 4종·저작권 문구. **규칙은 `byline-and-share.md`.**

### 3-4. `<head>` 필수 스크립트와 메타

아래는 `Layout.astro`에 **원문 그대로** 들어가야 한다. ID 값 하나도 바꾸지 않는다.

| 구분                                            | 내용                                                                                        | 식별자                                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Google Analytics (GA4)                          | gtag.js 1종. 개편 전 스트림(GTM `GTM-59599H7`, UA `UA-53476308-*`, GA4 `G-ZPZ8BHZPSJ`·`G-BZHTEE2B8L`)은 넣지 않는다 | `G-HR08PM6YWZ`                                                                                                                 |
| jQuery                                          | `hkAnalTag_hub.js`가 `$`를 쓴다. **통계 스크립트보다 앞에** 로드한다 (뒤에 두면 `$ is not defined`로 Hmap 수집이 안 된다) | `https://code.jquery.com/jquery-3.7.1.min.js`                                                                                  |
| 한국일보 통계 (Hmap 1.0)                        | `hkAnalTag_hub.js` — www 절대 경로, jQuery 다음. `hkFunc.js`는 쓰지 않는다                   | `https://www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js`                                                                          |
| 한국일보 통계 메타                              | `hk:nw_newsid`, `hk:nw_press`, `hk:nw_presscode`, `hk:nw_title`, `hk:nw_pagecode`           | META.ts에서 주입                                                                                                               |
| 인터랙티브 임베드 v2 (헤더 웹컴포넌트 + 추천 카드) | `interactive-embed.js?Nid={ARTICLE_KEY}` — 사내 CDN, `Nid`는 대문자 N. 동작은 `<html data-*>`로 정한다(`common-area.md`) | `https://assets.hankookilbo.com/components/interactive-embed/v2/interactive-embed.js`                                          |
| 카카오 SDK **v2**                               | `t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js` + `Kakao.init(...)` (초기화 여부 확인 후) | 앱키 `e62df5186f0758def8f14c53e64d7b9d`. 인터랙티브 헤더가 같은 v2를 쓴다. v1(`developers.kakao.com/sdk/js/kakao.min.js`) 금지 |
| 아이콘 폰트                                     | `iconFont.css` + `fonts/hk.*` — 스킬 `assets/addon/icon_font/`를 `public/addon/icon_font/`로 복사해 **상대 경로**로 링크. CDN 주소를 쓰면 로컬에서 CORS로 아이콘이 안 뜬다 | `./addon/icon_font/iconFont.css`                                                                                               |
| 웹폰트 (Pretendard Variable, NanumMyeongjo)     | `hk_fonts.css` — 사내 CDN, 폰트 파일을 저장소에 두지 않는다                                 | `https://assets.hankookilbo.com/fonts/hk_fonts.css`                                                                            |
| OG / Twitter / 카카오                           | `og:locale` ko_KR, `og:title`, `og:description`, `og:image`(+`og:image:width` 1200·`og:image:height` 630), `twitter:*` 전체(+`twitter:image:width`·`height`) + `<meta name="kakao_og_image">`(800×800, 절대 경로) | META.ts에서 주입. 인터랙티브 헤더의 공유 카드가 이 메타를 읽는다                                                               |
| 파비콘                                          | `//image.hankookilbo.com/o/img/favicon.ico`                                                 |                                                                                                                                |

전체 원문은 `assets/template/src/layouts/Layout.astro`에 있다. GA와 GTM 스크립트는 반드시 `<script is:inline>`으로 써서 Astro가 번들링하지 않게 한다.


### 3-5. `<body>` 필수 구조

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


## 4. 기술 스택

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


## 5. 프로젝트 구조

`assets/template/`가 아래 구조 그대로다(프로젝트 전용 파일·`public/img` 제외). 복사한 뒤 `package.json`의 `"{FOLDER_NAME}"`을 바꾼다.

```
{FOLDER_NAME}/
├── public/
│   ├── favicon.svg
│   ├── addon/icon_font/       # 아이콘 폰트 (iconFont.css + fonts/hk.*) — 스킬 assets 에서 복사, 수정 금지
│   └── img/
│       ├── ogimage.png        # 1200x630  (페이스북/X OG) — 필수, self_check.js가 크기 검사
│       ├── ogimage_kakao.png  # 800x800   (카카오톡 공유) — 필수, self_check.js가 크기 검사
│       ├── common/            # 로더, 로고, SNS 아이콘 (템플릿 공통, 수정 금지)
│       └── ...                # 프로젝트 이미지
├── src/
│   ├── components/
│   │   ├── Astro/
│   │   │   ├── ShareLinks.astro    # 바이라인 공유 4종 (페이스북·X·카카오·URL 복사)
│   │   │   └── byline.astro        # 하단 바이라인 (제목 + 게시일 + 제작진 + 공유 4종). 헤더는 임베드 스크립트가 붙임
│   │   ├── Intro.astro             # 프로젝트별 컴포넌트 (예시)
│   │   └── SomeIsland.tsx          # React 아일랜드 (필요 시)
│   ├── data/
│   │   └── data.ts                 # 본문 데이터 (타입 포함)
│   ├── layouts/
│   │   └── Layout.astro            # <head> 메타, 애널리틱스, body-wrapper
│   ├── lib/js/_comm/
│   │   ├── common.js               # removeLoader
│   │   ├── hkCommon.js             # 공통영역(헤더·추천) <html data-*> 제어 — setCommon, wireScrollFlow, placeByline, createPause
│   │   ├── ioScroll.js             # IntersectionObserver 기반 스크롤 유틸
│   │   └── util.js                 # addComma, chunkArray
│   ├── pages/
│   │   └── index.astro             # 유일한 페이지
│   ├── styles/
│   │   ├── style.sass              # 진입점 (reset + import)
│   │   ├── _variables.sass         # 폰트 크기, 색, z-index, 브레이크포인트
│   │   ├── _base.sass              # reset + .body-wrapper (style.sass 가 맨 먼저 @use)
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


| 스킬 위치 | 프로젝트 위치 | 비고 |
| --- | --- | --- |
| `assets/template/**` | 프로젝트 루트 | 설정·`src/` 공통 파일 전부 |
| `assets/common/*.png` | `public/img/common/` | 로더 이미지 |
| `assets/addon/icon_font/` | `public/addon/icon_font/` | 아이콘 폰트. 수정 금지 |
| `assets/patterns/<패턴>/` | `src/pages/index.astro`, `src/styles/`, `src/components/` | 본문 패턴 하나 (`patterns.md`) |

## 6. 설정 파일

원문은 `assets/template/`의 `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts`, `.prettierrc`, `.gitignore`, `.vscode/settings.json`. 그대로 쓰고 아래 값은 바꾸지 않는다.

- `astro.config.mjs` — `output: "static"`, `base: "./"`, `build.assetsPrefix: "./"`, `server.port: 3000`. 포트 3000은 사내 CDN(폰트·헤더)과 추천 카드 API의 CORS 허용 origin이다. Astro 기본값(4321)으로 띄우면 추천 카드가 비고 헤더 프래그먼트가 막힌다. `outDir`을 지정하지 않는다.
- `package.json` — 선택 패키지는 필요할 때만 추가한다.

```bash
npm i three @react-three/fiber @react-three/drei @types/three   # 3D 배경, WebGL 갤러리
npm i react-slick slick-carousel @types/react-slick             # 슬라이더
npm i rough-notation roughjs                                    # 손그림 강조
npm i medium-zoom                                               # 이미지 클릭 확대
```

## 7. `META.ts`

원문 `assets/template/src/utils/constant/META.ts`. 모든 상수를 실제 값으로 바꾼다(`self_check.js`가 템플릿 기본값을 잡는다).

| 항목                          | 어디에 쓰이나                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `HTML_TITLE`                  | `<title>`, OG/Twitter title (`[인터랙티브] ` 접두어 자동), 바이라인, 헤더 공유 카드              |
| `HTML_DESC`                   | OG/Twitter description                                                                           |
| `THIS_URL`                    | og:url, twitter:url                                                                              |
| `PAGE_CODE`, `ARTICLE_KEY`    | 사내 통계 메타 `hk:nw_pagecode`, `hk:nw_newsid`, 인터랙티브 임베드 `interactive-embed.js?Nid=`   |
| `FOLDER_NAME`                 | OG 이미지 절대 경로 (`/v/{FOLDER_NAME}/img/ogimage.png`, `kakao_og_image`용 `ogimage_kakao.png`) |
| `FLOW`, `VIEW`                | `<html data-flow data-view>`. `FLOW`에 따라 Layout이 `wireScrollFlow()`를 켠다(스크롤형)         |
| `THEME`                       | `<html data-theme>` + `class="dark"`. `$bgBase`와 맞춘다                                         |
| `POST_DATE`, `BYLINE_MEMBERS` | 바이라인                                                                                         |


## 8. `Layout.astro`

원문 `assets/template/src/layouts/Layout.astro`. 한국일보 공통 `<head>`(OG·통계 메타·웹폰트·아이콘 폰트·카카오 SDK v2·GA4·인터랙티브 임베드 v2·통계 스크립트)와 `<body class="loading"> > .body-wrapper > .full-loader + <slot /> + <Byline />` 구조. **삭제·수정·ID 변경 금지.** 추가할 수 있는 것은 카카오 지도 SDK, lottie 같은 프로젝트 전용 라이브러리뿐이다.

- `<html>`에 `class`(THEME) + `data-flow data-view data-state data-gnb data-theme`를 선언한다 → `common-area.md`.
- 하단 `<script>`가 `FLOW === "scroll"`이면 `wireScrollFlow()`를 켜고, 로더를 `load` + `document.fonts.ready` 뒤에 걷는다. 무거운 에셋(3D, 영상)이 있으면 해당 컴포넌트에서 직접 `removeLoader()`를 호출한다.
- 콘솔에 `$ is not defined`가 나면 jQuery가 통계 스크립트 뒤에 있는 것이다. 순서를 바꾼다(`self_check.js`가 검사).

## 9. `public/` 필수 파일

| 파일                                 | 규격       | 비고                                                |
| ------------------------------------ | ---------- | --------------------------------------------------- |
| `img/ogimage.png`                    | 1200 × 630 | 페이스북·X 공유 카드. **필수** — `self_check.js`가 존재·픽셀 크기를 검사한다 |
| `img/ogimage_kakao.png`              | 800 × 800  | 카카오톡 공유 카드 (`kakao_og_image` 메타가 가리킴). **필수** — 크기 검사 동일 |
| `img/common/full_loader_bg.png`      |            | 로더 배경 (스킬 `assets/common/`에서 복사)          |
| `img/common/full_loader_spinner.png` | 204 × 202  | 로더 스피너 (스킬 `assets/common/`에서 복사)        |
| `addon/icon_font/iconFont.css` + `fonts/hk.woff·ttf` | | 아이콘 폰트 (스킬 `assets/addon/icon_font/`에서 복사). 바이라인 공유 4종·로고 아이콘 |
| `favicon.svg`                        |            | 실제 파비콘은 Layout에서 CDN 사용                   |

`img/common/`의 로더 이미지 2개는 스킬의 `assets/common/`에 있는 실제 파일을 그대로 복사한다. 새로 만들 필요 없다.
`addon/icon_font/`도 스킬의 `assets/addon/icon_font/`를 폴더째 복사한다(`cp -r assets/addon <프로젝트>/public/`). 원본은
`https://interactive.hankookilbo.com/addon/icon_font/`인데, 그 서버가 다른 출처에 CORS를 허용하지 않아 CDN 주소로 링크하면 로컬(`localhost:3000`)에서
아이콘이 빈 네모로 보인다. 프로젝트 안에 두면 페이지와 같은 출처라 로컬·운영 모두 뜬다.

공유 이미지 2장은 **프로젝트마다 새로 만들어 올린다.** 담당자가 주지 않으면 대표 사진으로 만들어 승인받는다. 템플릿 자리 이미지인 채로, 또는 크기가 다른 채로 두면 `self_check.js`가 실패 처리하고 배포하지 않는다. 형식은 PNG, 크기는 정확히 1200×630 / 800×800.
**`public/fonts/` 폴더는 만들지 않는다.** 웹폰트는 CDN에서 온다 (`theming.md`). 프로젝트에 두는 폰트 파일은 아이콘 폰트(`public/addon/icon_font/fonts/hk.*`) 하나뿐이다.

이미지 최적화 기준:

- 배경 사진: 1920px 폭, JPG 품질 75~80, 300KB 이하
- 모바일 전용 배경: 1080px 폭 별도 제공 (`<picture>` 또는 `@include mobile` 배경 교체)
- PNG는 투명이 필요할 때만. 그 외 JPG 또는 WebP.


## 10. 규칙과 함정

AI가 반드시 지켜야 한다.

### 스크롤

- **스크롤 컨테이너는 `.body-wrapper`다.** `html, body`는 `overflow: hidden`이다.
- 다음 코드는 **동작하지 않는다**: `window.scrollY`, `window.addEventListener("scroll")`, `document.documentElement.scrollTop`, `window.scrollTo()`.
- 대신: `document.querySelector(".body-wrapper").scrollTop`, `.addEventListener("scroll")`, `.scrollTo()`.
- `IntersectionObserver`는 `root: null`로 두어도 정상 동작한다 (뷰포트 기준).
- `element.scrollIntoView({ behavior: "smooth" })`는 정상 동작한다.
- `position: sticky`는 `.body-wrapper` 안에서 정상 동작한다.
- `position: fixed` 요소는 `.body-wrapper` 바깥 기준(뷰포트)으로 붙는다. 이것은 의도된 동작이다.
- **GNB·추천 카드를 스크롤로 직접 조작하지 않는다.** `hkCommon.wireScrollFlow()` 하나가 맡는다(스크롤형). 콘텐츠용 IntersectionObserver와 섞지 않는다. 게임형은 `setCommon()`만 쓴다.

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

`theming.md`에 있다. 요지: `.sass`/`.scss` 혼용(새 파일은 `.scss`), 폰트 크기는 `$font16` 변수, 매직 넘버는 변수로, 테마는 `META.ts`의 `THEME` 하나로.

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
  (예외: 로딩 화면이 떠 있는 동안만 `body.loading interactive-header { opacity: 0 !important; pointer-events: none !important }` — `assets/template/src/styles/_full_loader.sass`)
- 카카오 SDK v1(`developers.kakao.com/sdk/js/kakao.min.js`) 로드. 인터랙티브 헤더의 v2와 충돌해 공유가 깨진다.
- `public/fonts/` 폴더, 폰트 파일(woff/woff2/ttf/otf/eot) 커밋, `@font-face` 직접 선언. 웹폰트는 `hk_fonts.css`(CDN)만 쓴다. 예외는 스킬이 주는 아이콘 폰트(`public/addon/icon_font/`)뿐이고, 그 안의 파일은 고치지 않는다.


## 11. 개발, 빌드, 배포

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
3. 아래 "빌드 후 자동 검증" 스크립트 실행. `MISSING` 0건 확인.
4. `dist/` 안의 **모든 파일**을 FTP로 `interactive.hankookilbo.com/v/{FOLDER_NAME}/`에 업로드.
5. `https://interactive.hankookilbo.com/v/{FOLDER_NAME}/` 접속 확인.
6. 기사 CMS에서 인터랙티브 URL을 연결 (`https://www.hankookilbo.com/interactive/...`).
7. OG 캐시 갱신: [페이스북 디버거](https://developers.facebook.com/tools/debug/), 카카오 공유 캐시 초기화.


## 12. 빌드 후 자동 검증

`npm run build` 직후 아래 명령이 모두 통과해야 한다. AI는 프로젝트 생성 마지막 단계에서 이 검증을 반드시 실행한다.

```bash
npm run build && \
test -f dist/index.html && echo "OK dist/index.html" && \
for key in G-HR08PM6YWZ code.jquery.com/jquery-3.7.1.min.js www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js \
           interactive-embed.js addon/icon_font/iconFont.css hk_fonts.css kakao.min.js \
           hk:nw_newsid hk:nw_pagecode og:locale og:image og:image:width twitter:image:width kakao_og_image twitter:card \
           byline share-tools body-wrapper full-loader data-flow data-view data-state data-gnb data-theme; do
  grep -q "$key" dist/index.html && echo "OK $key" || echo "MISSING $key"
done
```

추가로 `grep -q 'Copyright © Hankookilbo' dist/index.html`로 바이라인 저작권 문구를 확인한다. `MISSING`이 하나라도 출력되면 배포하지 않는다. `grep -c 'developers.kakao.com/sdk' dist/index.html`은 **0**이어야 한다 (카카오 SDK v1 금지). `grep -cE 'GTM-59599H7|UA-53476308|G-ZPZ8BHZPSJ|G-BZHTEE2B8L|hkFunc\.js' dist/index.html`도 **0**이어야 한다 (개편 전 통계 스크립트 금지). 추가로 `grep -o 'interactive-embed.js?Nid=[A-Z0-9]*' dist/index.html`의
값이 `META.ts`의 `ARTICLE_KEY`와 같은지 확인한다 (`A0000000000000000000`이면 미발급 상태).


## 13. 배포 전 QA 체크리스트

```
--- 필수 요건 ---
[ ] npm run build 산출물이 dist/ 에 생성됨 (dist/index.html 존재)
[ ] dist/index.html 에 G-HR08PM6YWZ 포함, 개편 전 ID(GTM-59599H7, UA-53476308-*, G-ZPZ8BHZPSJ, G-BZHTEE2B8L) 없음
[ ] dist/index.html 에 https://code.jquery.com/jquery-3.7.1.min.js 포함, hkAnalTag_hub.js 보다 앞
[ ] dist/index.html 에 https://www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js 포함 (hkFunc.js 없음)
[ ] dist/index.html 에 hk:nw_* 메타 5종 포함
[ ] dist/index.html 에 components/interactive-embed/v2/interactive-embed.js?Nid=<ARTICLE_KEY> 포함 (대문자 N, 값이 META.ts와 동일, v1 아님)
[ ] <html> 에 data-flow / data-view / data-state="intro" / data-gnb="transparent" / data-theme 5종 선언
[ ] data-theme · class="dark" 유무 · _variables.sass $bgBase 밝기 셋이 일치 (self_check.js)
[ ] 스크롤형: 끝까지 내리면 <html data-state="credits"> 가 되고 추천 카드가 뜸. 내리면 GNB 숨고 올리면 바탕 깔림
[ ] 게임형: 진행 화면에서 GNB 숨고 왼쪽 위 로고 버튼이 뜸 → 누르면 GNB 내려오고 ✕ → 끝 화면에서 추천 카드 (자기 기사 없음)
[ ] dist/index.html 에 assets.hankookilbo.com/fonts/hk_fonts.css 포함
[ ] dist/ 안에 폰트 파일(woff/woff2/ttf) 없음 — 예외: dist/addon/icon_font/fonts/hk.* (아이콘 폰트)
[ ] 바이라인 공유 아이콘 4종이 로컬(localhost:3000)에서도 그림으로 보임 (빈 네모면 iconFont.css 를 CDN 주소로 링크한 것)
[ ] 인터랙티브 헤더(<interactive-header>)가 body 맨 앞에 뜸 (임베드 스크립트가 붙임, 자체 헤더 없음)
[ ] 로딩 화면(스피너)이 떠 있는 동안 헤더가 보이지 않고, 로더가 걷힌 뒤 헤더가 나타남 (_full_loader.sass의 body.loading interactive-header { opacity: 0 !important } 규칙)
[ ] 헤더 로고·아이콘이 페이지 배경 위에서 보임 (THEME 과 $bgBase 일치)
[ ] dist/index.html 에 kakao_og_image 메타 포함, developers.kakao.com/sdk 없음
[ ] 바이라인(byline)이 본문 아래에 렌더됨
[ ] body.loading > .body-wrapper > .full-loader 구조 유지
[ ] 빌드 후 자동 검증 스크립트 MISSING 0건

--- 콘텐츠 ---
[ ] META.ts 6개 상수 + POST_DATE + BYLINE_MEMBERS 모두 실제 값
[ ] public/img/ogimage.png (1200x630), public/img/ogimage_kakao.png (800x800) 업로드, 빌드 후 dist/img/ 에도 복사됨 — self_check.js 크기 검사 통과
[ ] dist/index.html 에 og:locale ko_KR, og:image:width/height 1200/630, twitter:image:width/height 1200/630 포함
[ ] <title> "제목 | 한국일보" 확인
[ ] 인터랙티브 헤더 공유 4종 (페북, X, 카카오, URL 복사) 동작 — 카카오 카드에 ogimage_kakao.png가 뜸
[ ] 바이라인 공유 4종 (페북, X, 카카오, URL 복사) 동작 — 헤더 공유와 같은 카드가 뜸. URL 복사는 "주소가 복사되었습니다." 알림이 뜸. 헤더 공유와 같은 주소·카드. dist/index.html 에 Kakao.Link 없음(v1 API)
[ ] 바이라인 제작진, 게시일, 공유 4종, 맨 끝 저작권 문구 (관련 기사 카드 없음)
[ ] 인터랙티브 헤더(<interactive-header>)가 body 맨 앞에 뜨고, 크레딧(data-state="credits")에서 하단 추천 카드가 뜸 (자기 기사는 추천에 없음)
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


## 문의

디지털미디어부 인터랙티브 제작팀. 기존 프로젝트 참고: 「신군부 언론 통제」(media-control, 2026.03) 저장소의 `src/` 구조와 `Layout.astro`를 원본으로 삼았다.
