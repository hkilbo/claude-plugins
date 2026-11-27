# 템플릿 개요 — 새 프로젝트 세팅, 고칠 곳, 규칙, 검사, 올리기

> 한국일보 인터랙티브 템플릿은 **파일 하나**(`assets/template/index.html`)다. 설치도 빌드도 없다. 새 인터랙티브를 시작할 때 이 문서를 먼저 읽는다.
> 코드는 전부 그 파일에 있다. 이 문서는 "무엇을 어디에, 왜"만 적는다.
> 올리는 곳: S3 `articles/<폴더명>/` → 페이지 주소 `https://www.hankookilbo.com/interactive/<폴더명>/`

## 목차

1. [프로젝트 만들기](#1-프로젝트-만들기)
2. [`index.html`에서 고칠 곳](#2-indexhtml에서-고칠-곳)
3. [고치지 않는 곳 — 공통 블록 두 개](#3-고치지-않는-곳--공통-블록-두-개)
4. [필수 요건 (절대 빠지면 안 되는 것)](#4-필수-요건)
5. [규칙과 함정](#5-규칙과-함정)
6. [보기 · 검사 · 올리기](#6-보기--검사--올리기)
7. [올리기 전 확인](#7-올리기-전-확인)
8. [문의](#문의)

다른 상황은 다른 파일을 읽는다: 헤더·추천 카드 → `common-area.md` / 바이라인·공유 → `byline-and-share.md` / 색·폰트 → `theming.md` / 본문 구조 규칙(스크롤 컨테이너·높이·본문 글·한 화면 페이지) → `structure.md` / 구 프로젝트 → `legacy.md`.

---

## 1. 프로젝트 만들기

프로젝트 폴더를 만들고 `assets/template/index.html`을 복사한다. 복사할 것은 이 파일 하나다.

```bash
mkdir <폴더명> && cp <스킬폴더>/assets/template/index.html <폴더명>/
```

프로젝트 폴더에 있는 것:

| 파일 | 올리나 | 비고 |
| --- | --- | --- |
| `index.html` | ○ | 템플릿을 복사해 고친 것. 메타·스타일·본문·스크립트가 다 들어 있다 |
| `share.jpg` | ○ | 1200×630 JPG. 페이스북·X 공유 카드 |
| `share_kakao.jpg` | ○ | 800×800 JPG. 카카오톡 공유 카드 |
| 본문 이미지·영상·데이터 (예: `img/`, `data/`) | ○ | 있을 때만. `index.html`에서 상대 경로로 쓴다 |
| 따로 둔 `.css`·`.js` | ○ | 프로젝트가 커서 나눌 때만. `self_check.js`가 함께 검사한다 |
| `brief.md`, `qa-report/` | ✕ | 작업 기록. 검사의 용량 계산에서도 빠진다 |

- 공유 이미지 2장은 템플릿에 들어 있지 않다. **프로젝트마다 새로 만든다.** 담당자가 주지 않으면 대표 사진으로 만들어 승인받는다. 없거나, JPG가 아니거나, 크기가 정확히 1200×630 / 800×800이 아니면 `self_check.js`가 실패 처리한다.
- 따로 복사할 공통 이미지·아이콘 파일은 없다. 로딩 화면(한국일보 공통 로더 이미지)은 템플릿 안에 데이터로 들어 있고, 바이라인 공유 아이콘은 템플릿 안의 SVG다.
- 폰트 파일은 두지 않는다. 웹폰트는 CDN에서 온다 (`theming.md`).

## 2. `index.html`에서 고칠 곳

고칠 곳은 다섯 군데다: ① `<head>`의 메타 값 ② `<style id="project-style">`(이 스킬에서 "프로젝트 스타일"이라 부른다) ③ `<main>` 본문 ④ 바이라인 제작진·게시일 ⑤ 파일 맨 아래 `<script id="project-script">`("프로젝트 스크립트"). 템플릿에는 주석이 없다. 블록은 `id`로 찾는다.

값을 모아 두는 파일이 따로 없다. **같은 값이 여러 곳에 반복되므로 아래 표대로 전부 바꾼다.** 어긋난 곳은 `self_check.js`의 "메타 일치" 검사가 잡는다.

| 값 | 쓰는 곳 | 규칙 |
| --- | --- | --- |
| 제목 | `<title>`, 바이라인 `.title` | 제목 그대로. `[인터랙티브]`나 `\| 한국일보` 같은 접두·접미를 붙이지 않는다 |
| | `og:title`, `twitter:title`, `hk:nw_title` | `[인터랙티브] ` + 제목 |
| 설명 | `description`, `og:description`, `twitter:description` | 셋이 같은 문장. 80자 이내 권장 |
| 주소 | `og:url`, `twitter:url` | `https://www.hankookilbo.com/interactive/<폴더명>/` — 끝에 `/` 필수 |
| | `og:image`, `twitter:image` | 주소 + `share.jpg` |
| | `kakao_og_image` | 주소 + `share_kakao.jpg` |
| 기사 키 | `hk:nw_newsid` | `A` + 숫자 19자리 |
| | `hk:nw_pagecode` | `hk_news_read_` + 기사 키 |
| | 임베드 스크립트의 `?Nid=` | 같은 기사 키. `Nid`는 대문자 N |
| 게시일 | 바이라인 `.post-date` | `Posted by 2026. 01. 01` 형식 |
| 제작진 | 바이라인 `<dl>` 줄 | 역할(`<dt>`)과 이름(`<dd>`). 줄은 필요한 만큼 늘리거나 줄인다 |
| 크레딧 위치 | `<html data-credits>` | `bottom` 또는 `end` (`common-area.md`) |

- 템플릿 자리 값(`{FOLDER_NAME}`, `인터랙티브 제목`, `공유 시 노출되는 한 줄 설명`, `OOO`, `A0000000000000000000`)이 하나라도 남으면 `self_check.js`가 실패한다.
- `<html>`에는 `data-state="intro" data-gnb="transparent"`도 선언돼 있다. 지우거나 바꾸지 않는다.
- `data-theme`과 `<meta name="theme-color">`는 실행 중에 페이지 배경색으로 채워진다. 손으로 쓰지 않는다.

## 3. 고치지 않는 곳 — 공통 블록 두 개

`index.html`에는 `id`로 구분된 공통 블록이 두 개 있다. **프로젝트는 이 안을 고치지 않는다.**

| 블록 | 들어 있는 것 |
| --- | --- |
| `<style id="hk-common-css">` | 리셋, CSS 변수(색·서체·글자 크기·`--gnb-h`·`--screen-h`·`--sticky-top`), `.body-wrapper`, 로딩 화면, 바이라인 스타일 |
| `<script id="hk-common-js">` | 전역 `window.hkCommon`. GNB·크레딧·헤더 아이콘 색 자동 처리, 바이라인 공유 3종, 핀치줌 차단, 로딩 화면 걷기 |

- `self_check.js`가 두 블록을 스킬 원본과 비교한다. 다르면 경고, 블록이 없으면 실패다. 일부러 고친 게 아니면 템플릿에서 그 블록을 다시 복사한다.
- 색·서체를 바꿀 때는 블록이 아니라 그 아래 "프로젝트 스타일"에서 변수를 덮어쓴다 (`theming.md`).
- 프로젝트 코드는 `hkCommon.showCredits(target)`처럼 전역으로 부른다. 불러오는 구문이 필요 없다. 함수 목록은 `common-area.md`.

## 4. 필수 요건

아래 항목은 디자인, 주제, 연출과 무관하게 **모든 한국일보 인터랙티브에 반드시 포함**된다. "간단하게 만들어달라"는 요청을 받아도 생략할 수 없다. 하나라도 빠지면 올릴 수 없다. 전부 템플릿에 들어 있으므로 **지우지 않으면 된다.**

### 4-1. `<head>` 필수 스크립트와 메타

원문 그대로 둔다. ID 값 하나도 바꾸지 않는다.

| 구분 | 내용 | 식별자 |
| --- | --- | --- |
| Google Analytics (GA4) | gtag.js 1종. 개편 전 스트림(GTM `GTM-59599H7`, UA `UA-53476308-*`, GA4 `G-ZPZ8BHZPSJ`·`G-BZHTEE2B8L`)은 넣지 않는다 | `G-HR08PM6YWZ` |
| jQuery | `hkAnalTag_hub.js`가 `$`를 쓴다. **통계 스크립트보다 앞에** 로드한다 (뒤에 두면 `$ is not defined`로 Hmap 수집이 안 된다) | `https://www.hankookilbo.com/interactive/lib/js/jquery-3.4.1.min.js` |
| 한국일보 통계 (Hmap 1.0) | `hkAnalTag_hub.js` — jQuery 다음. `hkFunc.js`는 쓰지 않는다 | `https://www.hankookilbo.com/interactive/lib/js/hkAnalTag_hub.js` |
| 한국일보 통계 메타 | `hk:nw_newsid`, `hk:nw_press`, `hk:nw_presscode`, `hk:nw_title`, `hk:nw_pagecode` | 2장 표의 기사 키·제목 |
| 인터랙티브 임베드 v2 (헤더 웹컴포넌트 + 추천 카드) | `interactive-embed.js?Nid=<기사 키>` — 사내 CDN, `Nid`는 대문자 N. 동작은 `<html data-*>`로 정한다 (`common-area.md`) | `https://assets.hankookilbo.com/components/interactive-embed/v2/interactive-embed.js` |
| 카카오 SDK **v2** | `t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js` + `Kakao.init(...)` (초기화 여부 확인 후) | 앱키 `e62df5186f0758def8f14c53e64d7b9d`. 인터랙티브 헤더가 같은 v2를 쓴다. v1(`developers.kakao.com/sdk/js/kakao.min.js`) 금지 |
| 웹폰트 (Pretendard Variable, NanumMyeongjo) | `hk_fonts.css` — 사내 CDN. 폰트 파일을 프로젝트에 두지 않는다 | `https://assets.hankookilbo.com/fonts/hk_fonts.css` |
| OG / Twitter / 카카오 | `og:locale` ko_KR, `og:title`, `og:description`, `og:image`(+`og:image:width` 1200·`og:image:height` 630), `twitter:*` 전체(+`twitter:image:width`·`height`), `kakao_og_image`(800×800, 절대 경로) | 2장 표의 값. 인터랙티브 헤더의 공유 카드가 이 메타를 읽는다 |
| 파비콘 | `//image.hankookilbo.com/o/img/favicon.ico` | |

### 4-2. `<body>` 구조

`<body class="loading">` 안에 `.body-wrapper`가 있고, 그 안에 `.full-loader` → `<main>`(본문) → `.byline`(바이라인) 순서다.

- `.body-wrapper`는 모바일 인앱 브라우저(카카오톡, 네이버, 사파리)의 상·하단 바 대응용 실제 스크롤 컨테이너다. 화면 전체 크기 그대로이고 페이지의 유일한 스크롤 영역이다. 이 구조를 풀거나 본문을 `.body-wrapper` 밖으로 꺼내지 않는다.
- `.body-wrapper`의 위 여백(`--gnb-h`)만큼 첫 요소가 GNB 아래에서 시작한다. 크기는 GNB 상태와 상관없이 바뀌지 않는다.
- `<interactive-header>`는 임베드 스크립트가 실행 중에 `body` 맨 앞(`.body-wrapper` 바깥)에 붙인다. 소스에 직접 쓰지 않는다.
- `data-credits="end"`면 공통 블록이 바이라인을 숨김 자리(`.byline-holder`)로 옮겨 두었다가 `hkCommon.showCredits(target)`이 꺼낸다.

### 4-3. 헤더 · 추천 카드 (공통영역)

헤더는 프로젝트가 만들지 않는다. 임베드 스크립트가 붙이고 추천 카드도 띄운다. 언제 숨고 언제 뜨는지는 공통 블록이 `<html data-*>`로 정한다. **규칙 전체는 `common-area.md`.** 자체 헤더를 만들지 않고, `<interactive-header>`를 CSS로 건드리지 않는다.

### 4-4. 바이라인

제목·게시일·제작진·공유 3종·저작권 문구. 본문 뒤, `.body-wrapper` 안에 있다. **규칙은 `byline-and-share.md`.**

## 5. 규칙과 함정

AI가 반드시 지켜야 한다.

### 스크롤

- **스크롤 컨테이너는 `.body-wrapper`다.** `html, body`는 `overflow: hidden`이다.
- 다음 코드는 **동작하지 않는다**: `window.scrollY`, `window.addEventListener("scroll")`, `document.documentElement.scrollTop`, `window.scrollTo()`.
- 대신: `document.querySelector(".body-wrapper").scrollTop`, `.addEventListener("scroll")`, `.scrollTo()`.
- `IntersectionObserver`는 `root: null`로 두어도 정상 동작한다 (뷰포트 기준).
- `element.scrollIntoView({ behavior: "smooth" })`는 정상 동작한다.
- `position: sticky`는 `.body-wrapper` 안에서 동작한다. 단 **화면 맨 위에 붙이려면 `top: var(--sticky-top)`** 을 쓴다. `.body-wrapper`의 위 여백이 sticky 기준선이라 `top: 0`은 GNB 높이만큼 아래에 붙고, GNB가 숨으면 그 자리에 빈 띠가 남는다.
- `position: fixed` 요소는 `.body-wrapper` 바깥 기준(뷰포트)으로 붙는다. 이것은 의도된 동작이다.
- **GNB·추천 카드를 스크롤로 직접 조작하지 않는다.** 공통 블록이 맡는다. 콘텐츠용 IntersectionObserver와 섞지 않는다. `data-credits="end"`면 `hkCommon.showCredits(target)`·`hkCommon.hideCredits()`만 부른다.

### 경로

- 이미지·영상·따로 둔 `.css`·`.js`는 **상대 경로**로 쓴다 (`img/photo.jpg`).
- `/img/...`처럼 `/`로 시작하면 올린 뒤 404가 난다. 페이지가 `/interactive/<폴더명>/` 아래에서 열리기 때문이다.
- 메타의 공유 이미지 주소만 절대 주소다 (2장 표).

### 뷰포트, 모바일

- 기본은 PC·모바일을 반응형 하나로 만드는 것이다. 담당자가 원하면 PC 가운데에 세로 휴대폰 화면을 띄우는 크롭뷰로 만들어도 된다.
- 크롭뷰로 만들어도 헤더와 추천 카드는 창 전체를 기준으로 표시된다. 크롭 영역 안에 맞춰지지 않는다.
- 화면 높이(`--screen-h`)와 GNB 여백 규칙은 `structure.md` 「지켜야 하는 것」의 **높이**.
- `--gnb-h`는 64px, 1280px 이상에서 76px다(헤더 높이와 같다). 숫자를 직접 쓰지 말고 변수를 쓴다.
- 높이는 `100vh` 다음 줄에 `100dvh`를 한 번 더 써서 폴백을 만든다.
- 모바일 분기는 `@media (max-width:800px)` 하나를 기본으로 쓴다. `768px` 같은 임의 값을 새로 만들지 않는다.
- 핀치줌은 공통 블록에서 차단된다. 이미지 확대가 필요하면 확대 UI를 따로 만든다.
- 카카오톡 인앱 브라우저에서 `100vh`가 주소창을 포함한다. `.body-wrapper` 구조가 이를 해결하므로 구조를 바꾸지 않는다.

### 스크립트

- 프로젝트 스크립트는 파일 맨 아래 "프로젝트 스크립트" `<script>`에 쓴다. 공통 블록 뒤라서 `hkCommon`이 이미 있다.
- 따로 둔 `.js`와 CDN 라이브러리는 `hk-common-js` 블록 **뒤**, 프로젝트 스크립트 **앞**에서 불러온다. 라이브러리 CSS `<link>`는 프로젝트 스타일 앞에 둔다. `<head>`의 필수 스크립트 순서는 건드리지 않는다.
- 설치·빌드가 필요한 것(UI 프레임워크, 번들러, CSS 전처리기)은 쓰지 않는다. 라이브러리는 CDN에서 불러온다 (`hankookilbo-interactives-libs` 스킬).
- 기사 글을 스크립트로 그려 넣지 않는다 (`structure.md`).

### 스타일

`theming.md`에 있다. 요지: 색·서체·글자 크기는 CSS 변수(`--bg-base`, `--font-base`, `--font-16` …), 바꿀 때는 "프로젝트 스타일"에서 덮어쓰기, 배경(`.body-wrapper`·`body`·`html`)은 단색.

### 접근성

- 아이콘만 있는 버튼에는 `aria-label`.
- 이미지에는 의미 있는 `alt`. 장식용은 `alt=""`.
- 클릭 요소는 `<button>` 또는 `<a>`. `<div onclick>` 금지.
- 자동재생 영상은 `muted playsinline` 필수, 음소거 해제 버튼 제공.

### 성능

- 첫 화면 밖 이미지는 `loading="lazy" decoding="async"`.
- 영상은 `preload="metadata"`, 포스터 이미지 필수.
- 배경 사진은 1920px 폭, JPG 품질 75~80, 300KB 이하. 모바일 전용 배경은 1080px 폭을 따로 둔다(`<picture>` 또는 미디어쿼리로 교체).
- PNG는 투명이 필요할 때만. 그 외 JPG 또는 WebP.
- 올리는 파일 전체 10MB 이하가 목표다. 80MB를 넘으면 `self_check.js`가 실패 처리한다.

### 금지

- `<head>`의 GA4, `hk:` 메타, 한국일보 통계 스크립트, 인터랙티브 임베드 스크립트 삭제 또는 수정. `Nid`를 소문자 `nid`로 쓰는 것도 금지.
- `hk-common-css`·`hk-common-js` 블록 수정.
- 바이라인을 지우거나 `.body-wrapper` 밖으로 이동. 바이라인의 공유 3종·저작권 문구 삭제·변경.
- 자체 헤더(구 ArticleBar 등) 추가, `<interactive-header>` 숨김·이동. 헤더는 임베드 스크립트가 붙이는 것 하나만 쓴다.
- 카카오 SDK v1(`developers.kakao.com/sdk/js/kakao.min.js`) 로드, `Kakao.Link` 호출. 인터랙티브 헤더의 v2와 충돌해 공유가 깨진다.
- 폰트 파일(woff/woff2/ttf/otf/eot)을 프로젝트에 두는 것, `@font-face` 직접 선언. 웹폰트는 `hk_fonts.css`(CDN)만 쓴다.
- 임베드 CDN을 `assets-dev.`·`assets-stg.` 주소로 쓰는 것. 운영 주소 `assets.hankookilbo.com`만 쓴다.

## 6. 보기 · 검사 · 올리기

### 보기

프로젝트 폴더에서 `python3 -m http.server 3000`을 백그라운드로 띄우고 `http://localhost:3000`을 연다.

- **포트는 3000이어야 한다.** 사내 CDN(폰트·헤더)과 추천 카드 API의 CORS 허용 origin이 `localhost:3000`이다. 다른 포트면 추천 카드가 비고 헤더가 막힌다.
- 파일을 더블클릭해 `file://`로 열면 같은 이유로 헤더·폰트·추천 카드가 안 뜬다.
- 고친 것은 새로고침하면 보인다.

### 검사

빌드가 없으므로 고친 뒤 바로 돌린다. `<스킬폴더>`는 `SKILL.md`가 있는 폴더다.

`node <스킬폴더>/scripts/self_check.js <프로젝트폴더>` — 파일만 읽어 검사한다. ✕가 하나라도 있으면 올리지 않는다.

| 묶음 | 보는 것 |
| --- | --- |
| 필수 | 필수 식별자(4장), 공유 메타 크기 값, 바이라인 공유 3종 |
| 금지 | 카카오 SDK v1·`Kakao.Link`, 개편 전 통계, jQuery가 통계 스크립트보다 앞인지, 자체 헤더, 임베드 CDN 호스트 |
| 메타 일치 | 주소 / 기사 키 / 제목·설명이 2장 표대로 서로 같은지, 템플릿 자리 값이 남았는지 |
| 공통영역 | `<html data-*>` 초기값, 공통 블록 두 개와 `<ul class="share-tools">`가 원본과 같은지(다르면 경고), `data-credits="end"`인데 `showCredits(` 호출이 없는지, 배경 단색, `window` 스크롤 사용(경고) |
| 폰트·용량 | 폰트 파일·`@font-face` 없음, 80MB 이하(10MB 초과는 경고) |
| 공유 이미지 | `share.jpg` 1200×630, `share_kakao.jpg` 800×800, 둘 다 JPG |

기사 키가 자리 값(`A0000000000000000000`)이거나 세 곳이 서로 다르면 실패, 형식만 `A`+19자리가 아니면 경고다. 미발급이면 자리 값으로 두고 `brief.md`에 남긴다.

`node <스킬폴더>/scripts/qa_playwright.js --entry ./index.html --out ./qa-report [--sections "<챕터 선택자>"]` — 프로젝트 폴더에서 돌린다. 실제 Chromium으로 연다.

- 보는 것: 헤더 마운트, `<html data-*>` 초기값·테마, 첫 요소가 GNB 아래에서 시작하는지, GNB 스크롤 규칙, 크레딧·추천 카드, 웹폰트, 콘솔 에러. `qa-report/`에 결과와 스크린샷(모바일·태블릿·PC)을 남긴다.
- 3000에 이 페이지가 이미 떠 있으면 그 서버를 그대로 쓴다. 다른 페이지가 떠 있으면 멈춘다. 아무것도 없으면 잠깐 직접 띄운다.
- `--sections`를 주면 챕터마다 한 장씩 찍는다. 찍는 위치는 `--anchor-mobile`·`--anchor-desktop`(0~1)으로 옮긴다.
- `data-credits="end"`의 마지막 화면은 자동으로 못 간다. 담당자가 직접 확인한다.
- Playwright 설치(기기당 한 번, 프로젝트 폴더 밖)는 `SKILL.md` 「3단계 — 보면서 고치기」.

### 올리기

스킬은 **풀어서 그대로 올리면 되는 zip**까지 만든다 (`SKILL.md` 「4단계」). 올리는 일은 그 뒤에 사람이 한다.

1. `self_check.js`가 모두 통과하는지 확인한다.
2. 프로젝트 폴더의 바로 위에서 zip을 만든다. `brief.md`·`qa-report/`·`.git/`·`node_modules/`·`.DS_Store`는 넣지 않는다. zip 안에는 `<폴더명>/` 폴더 하나와 올릴 파일만 있다.
3. 올릴 때: zip을 풀어 나온 `<폴더명>` 폴더를 AWS 콘솔에서 S3 버킷의 `articles/` 아래에 그대로 올린다. 결과 경로는 `articles/<폴더명>/index.html`이다.
4. 업로드할 때 Cache-Control을 `no-cache, must-revalidate`로 지정하면 수정본이 바로 반영된다.

## 7. 올리기 전 확인

스크립트가 못 보는 것만 적는다. 나머지는 6장 검사가 본다.

```
[ ] 로딩 화면(한국일보 공통 로더)이 떠 있는 동안 헤더가 보이지 않고, 걷힌 뒤 헤더가 나타남
[ ] 헤더 로고·아이콘이 페이지 배경 위에서 잘 보임
[ ] data-credits="end": 마지막 화면 전에는 추천 카드가 안 뜨고, 마지막 화면에서 바이라인과 추천 카드가 함께 뜸
[ ] 추천 카드에 자기 기사가 없음 (있으면 기사 키가 틀린 것)
[ ] 헤더 공유 4종(페이스북, X, 카카오톡, URL 복사) 동작 — 카카오 카드에 share_kakao.jpg 가 뜸
[ ] 바이라인 공유 3종(페이스북, X, URL 복사) 동작 — URL 복사는 "주소가 복사되었습니다." 알림
[ ] 바이라인 제작진·게시일이 맞고 맨 끝에 저작권 문구가 있음
[ ] 모바일 크롬, 사파리, 카카오톡 인앱, 네이버 인앱에서 스크롤. iOS 사파리 하단 주소창 겹침 없음
[ ] 이미지·영상 404 없음, 사진마다 출처 표기
[ ] 텍스트 오탈자 최종 확인 (기자 컨펌)
```

## 문의

디지털미디어부 인터랙티브 제작팀. 헤더·추천 카드·CDN(CORS) 문제는 프론트개발팀.
