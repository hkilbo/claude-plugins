# 테마 · CSS 변수 · 폰트 · 스타일 규칙

> 페이지 배경색을 바꾸거나, 글자 크기 변수·모바일 분기를 쓰거나, 스타일을 쓸 때 읽는다.
> 코드: `assets/template/index.html`의 `hk-common-css` 블록(변수 기본값, 고치지 않는다)과 그 아래 "프로젝트 스타일" `<style>`(덮어쓰는 곳).

## 헤더 아이콘 색은 배경색으로 자동으로 정해진다

제작자가 라이트/다크를 고르지 않는다. 공통 블록이 GNB 뒤 배경색의 밝기를 재서 `<html data-theme>`을 쓰고, 같은 색을 `<meta name="theme-color">`에 쓴다(`common-area.md`). 배경색은 `.body-wrapper` → `body` → `html` 순서로 읽고, 반투명이면 뒤 요소의 색과 섞는다.

| 페이지 배경 `--bg-base` | `data-theme` | 헤더·추천 카드 |
| --- | --- | --- |
| 어두움 (템플릿 기본 `#111`, `--font-col-base: #fff`) | `dark` | 흰 로고·아이콘, 어두운 카드 |
| 밝음 (`--font-col-base`는 어두운 색으로) | `light` | 검은 로고·아이콘, 흰 카드 |

- 기준은 WCAG 상대 휘도 0.179다. 그보다 밝으면 `light`(검정 아이콘).
- `.body-wrapper`·`body`·`html` 배경은 **단색만** 쓴다. 템플릿은 `body`와 `.body-wrapper`를 `--bg-base`로 칠한다. 이미지·그라데이션은 `.body-wrapper` 안의 요소에 둔다. `self_check.js`가 `--bg-base` 값과 이 세 요소의 배경 선언을 검사하고, `qa_playwright.js`가 실제 계산값을 한 번 더 본다.
- 로드 직후 GNB 영역을 덮는 `position: fixed` 레이어 규칙은 `common-area.md` 「API — `<html data-*>`」.
- 실행 중에 배경색을 바꿔도 된다(예: 챕터마다 밝기 전환). 이 세 요소의 `class`나 `style`로 바꾸면 GNB 아이콘 색이 따라간다. 배경 transition이 끝날 때도 다시 판정한다.
- `data-theme`이나 `dark` 클래스를 직접 쓰지 않는다. `<body>`에 붙인 테마 클래스는 헤더가 읽지 않는다.

## CSS 변수

기본값은 `hk-common-css` 블록의 `:root`에 있다.

| 변수 | 값 / 용도 |
| --- | --- |
| `--bg-base`, `--font-col-base` | 페이지 배경색·글자색. 기본 `#111` / `#fff`. `--bg-base`는 단색만 — 헤더 아이콘 색을 이 밝기로 자동 판정한다 |
| `--font-base`, `--font-serif` | 고딕(`'Pretendard Variable'…`) / 명조(`'NanumMyeongjo'`). 서체 이름은 직접 쓰지 않는다 |
| `--font-14` `--font-16` `--font-18` `--font-20` `--font-26` `--font-32` `--font-38` | 글자 크기. PC 기준 이름이고 좁은 화면에서 `clamp()`로 줄어든다 |
| `--easing` | `cubic-bezier(0.17, 0.67, 0.21, 1)` |
| `--gnb-h` | GNB 높이. 64px, 1280px 이상 76px |
| `--screen-h` | GNB 아래 한 화면 (`100dvh - var(--gnb-h)`). 높이 규칙은 `structure.md` 「지켜야 하는 것」 |
| `--sticky-top` | 화면 맨 위에 붙이는 sticky 요소의 `top` |

- **바꾸는 법**: 블록 안의 값을 고치지 않는다. "프로젝트 스타일" `<style>`의 `:root`에서 같은 이름으로 덮어쓴다. 템플릿에 `--bg-base`·`--font-col-base` 두 줄이 예시로 들어 있다.
- 프로젝트 전용 값(본문 폭, 강조색 등)도 같은 `:root`에 변수로 둔다. 예: `--story-box-max-width: 640px`.
- `--gnb-h`·`--screen-h`·`--sticky-top`은 덮어쓰지 않는다. 헤더 높이와 맞춘 값이다.
- 모바일 분기는 `@media (max-width:800px)` 하나만 쓴다(공통 블록에는 없으므로 프로젝트 스타일에 직접 쓴다). `768px` 같은 임의 값을 새로 만들지 않는다.

## 웹폰트 — 사내 CDN

폰트 파일을 프로젝트에 두지 않는다. 템플릿 `<head>`가 사내 CDN의 `https://assets.hankookilbo.com/fonts/hk_fonts.css`를 링크하고, 아래 서체가 제공된다.

| CSS `font-family` 값    | 굵기            | 비고                                         |
| ----------------------- | --------------- | -------------------------------------------- |
| `'Pretendard Variable'` | 45~920 (가변)   | 동적 서브셋 — 화면에 쓰인 글자 조각만 받는다 |
| `'NanumMyeongjo'`       | 400 / 700 / 800 | woff2                                        |

`hk_fonts.css`에는 `font-display: swap`이 걸려 있다. 폰트가 늦게 오면 기본 서체로
먼저 그려졌다가 바뀌는데, 로딩 화면이 웹폰트가 준비될 때까지 기다렸다가
걷히므로 사용자 눈에는 보이지 않는다.

`NotoSerifKR`, `NanumSquareNeo` 등 CDN에 없는 서체는 쓰지 않는다 (`@font-face`를 프로젝트에 직접 선언하지 않는다).
다른 서체가 꼭 필요하면 그 글자를 이미지로 만들어 넣는 것을 권한다. 제목처럼 짧은 글자에 쓰고, 이미지의 `alt`에 같은 글자를 적는다.

로컬 확인: 로컬 서버(`localhost:3000`)와 서비스 도메인(`www.hankookilbo.com`)이
CDN의 CORS 허용 목록에 있어야 폰트가 뜬다. 기본 서체로만 보이고 콘솔에 CORS
에러가 있으면 코드 문제가 아니라 CDN 허용 목록 문제이므로 프론트개발팀에 문의한다.

## 로딩 화면

`hk-common-css` 블록의 `.full-loader` 규칙이다. `body.loading`일 때 `.full-loader`가 화면을 덮고 한국일보 공통 로더(회색 원 + 도는 초록 호)가 돈다. 이미지 두 장은 파일이 아니라 데이터로 블록 안에 들어 있다. 배경은 `#282828` 고정이다. 페이지 리소스와 웹폰트가 준비되면 공통 블록이 걷는다(`body.loaded`). 로딩 중에는 헤더도 가린다 — 헤더를 건드리는 유일한 예외이고 이유는 `common-area.md`에 있다.

## 스타일 규칙

- 글자 크기는 `var(--font-16)` 같은 변수를 쓴다. `px` 직접 지정은 14px 이하의 캡션에만 허용한다.
- 반복해서 쓰는 숫자는 프로젝트 `:root` 변수로 뺀다.
- 바이라인·로딩 화면처럼 공통 블록에 있는 스타일을 바꾸려면 블록을 고치지 말고 "프로젝트 스타일"에서 같은 선택자로 덮어쓴다.
