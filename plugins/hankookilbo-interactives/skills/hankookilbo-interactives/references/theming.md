# 테마 · 변수 · 폰트 · 스타일 규칙

> 색을 바꾸거나(라이트/다크), 폰트 크기·브레이크포인트 변수를 쓰거나, 새 스타일 파일을 만들 때 읽는다.
> 코드: `assets/template/src/styles/` (`style.sass`, `_variables.sass`, `_utils.sass`, `_full_loader.sass`, `_byline.scss`).

## 테마는 `META.ts`의 `THEME` 하나로 정한다

| 페이지 배경 | `META.ts` | Layout이 만드는 `<html>` | `_variables.sass` | 헤더·추천 카드 |
| --- | --- | --- | --- | --- |
| 어두움 (템플릿 기본) | `THEME = "dark"` | `class="dark" data-theme="dark"` | `$bgBase: #111`, `$fontColBase: #fff` | 흰 로고·아이콘, 어두운 카드 |
| 밝음 | `THEME = "light"` | `data-theme="light"` (class 없음) | `$bgBase` 밝은 색, `$fontColBase` 어두운 색 | 검은 로고·아이콘, 흰 카드 |

- 셋(`THEME`, `class="dark"`, `$bgBase` 밝기)이 어긋나면 헤더 로고가 배경과 같은 색이 돼 안 보인다. `self_check.js`가 fail 처리한다.
- `class="dark"`는 구 CDN 호환용으로 `data-theme`과 함께 둔다. 직접 쓰지 말고 `THEME`에서 나오게 둔다.
- 라이트와 다크 중 하나로 고정한다. 페이지 안에서 바꾸는 전환 기능은 만들지 않는다. 유일한 예외는 모바일뷰·게임형의 PC(`patterns.md` 패턴 F, `syncOuterTheme`).
- `dark` 이외의 이름(`theme-dark` 등)이나 `<body>`에 붙인 클래스는 헤더가 읽지 않는다.

## `style.sass` (진입점)

`@use 'base'` → `@use 'full_loader'` → `@use 'byline'` → 프로젝트 스타일 `@use`. 적은 순서대로 CSS가 나오므로 리셋(`_base.sass`)이 항상 먼저다. `_base.sass`에 reset, `html, body { overflow: hidden }`, `.body-wrapper`(실제 스크롤 컨테이너, `position: fixed`), `.hidden`(시각적 숨김) 유틸이 있다. `.body-wrapper` 구조를 바꾸지 않는다.

Sass `@import`는 쓰지 않는다 — Dart Sass 1.80+가 폐기 경고를 찍고 3.0에서 사라진다. `@use`는 파일 맨 위에만 올 수 있다.

## `_variables.sass`

| 변수 | 값 / 용도 |
| --- | --- |
| `$wrapper-width` | 900px |
| `$fontBase`, `$fontSerif` | `'Pretendard Variable'…`, `'NanumMyeongjo'`. 서체 이름은 여기서만 |
| `$font12` … `$font38` | PC 기준 이름, 모바일에서 `clamp()`로 축소. `px` 직접 지정은 14px 이하 캡션에만 |
| `$bgBase`, `$bgBaseBlur`, `$fontColBase` | 배경·반투명 배경·글자색. `THEME`과 맞춘다 |
| `$z-gnb` 100, `$z-main` 10, `$z-layer` 200 | z-index |
| `$easing` | `cubic-bezier(0.17, 0.67, 0.21, 1)` |
| `$mobile-width` 800, `$tablet-limit` 1200, `$tablet-width` 1440 | 브레이크포인트. `768px` 같은 임의 값을 새로 만들지 않는다 |

## `_utils.sass` 믹스인·함수

`@include mobile`(~800px), `@include tablet`(801~1440), `@include tablet-limit`(801~1200), `@include clear`, `rem()`, `em()`, `rem-ratio()`.

```scss
.section {
  padding: 80px 0;
  font-size: $font18;
  @include mobile { padding: 40px 20px; }
}
```

## 웹폰트 — 사내 CDN (`_fonts.scss` 없음)

폰트 파일을 저장소나 `public/fonts/`에 두지 않는다 (**예외: 아이콘 폰트 `public/addon/icon_font/`** ). `Layout.astro` `<head>`에서
사내 CDN의 `https://assets.hankookilbo.com/fonts/hk_fonts.css`를 링크하면 아래
서체가 제공된다 (`Layout.astro`).

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


## `_full_loader.sass`

초기 로딩 화면. `body.loading`일 때 `.full-loader`가 `z-index: 3000`으로 덮고, 로더가 걷히면(`body.loaded`) 사라진다. 끝에 `body.loading interactive-header { opacity: 0 !important; pointer-events: none !important }`가 있다 — 헤더를 건드리는 유일한 예외다(`common-area.md`). `visibility`가 아니라 `opacity`를 쓰는 이유: 헤더 shadow DOM 안 `<header>`가 `visibility: visible`을 직접 가져 자식이 다시 보이지만 `opacity`는 자식이 뒤집을 수 없다. `!important`는 헤더 `:host`의 `wc-reveal` 애니메이션보다 우선하기 위해 필요하다.

## 스타일 규칙

- `.sass`(들여쓰기)와 `.scss`(중괄호)를 혼용한다. 기존 파일 문법을 따르고, 새 파일은 `.scss`로 만든다.
- 컴포넌트 스타일은 컴포넌트 파일에서 `import "../styles/xxx.scss"`로 가져오거나 `style.sass`에 `@use` 한다. 두 방식을 한 파일에 섞지 않는다.
- 변수, 믹스인을 쓰는 `.scss`/`.sass`는 파일 맨 위에 `@use "variables" as *; @use "utils" as *;`를 둔다. `@use`는 파일마다 따로 필요하다(`style.sass`가 불러도 다른 파일로 전파되지 않는다).
- 폰트 크기는 `$font16` 같은 변수를 쓴다. `px` 직접 지정은 14px 이하의 캡션에만 허용한다.
- 매직 넘버는 변수로 뺀다. 예: `$story-box-max-width: 640px`.
- 테마는 `META.ts`의 `THEME` 하나로 정한다. Layout이 `<html data-theme>`와 `class="dark"`를 만든다. 둘 중 하나로 고정하고 전환 기능은 만들지 않는다 (`common-area.md`). 예외는 `patterns.md` 패턴 F 게임형의 PC(`syncOuterTheme`)뿐이다.


