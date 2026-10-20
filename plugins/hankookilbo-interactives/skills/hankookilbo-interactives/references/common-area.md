# 공통영역 — 인터랙티브 헤더 · 추천 카드 (웹컴포넌트 v2)

> 헤더가 안 뜨거나, 숨김/바탕 전환이 이상하거나, 추천 카드 노출 시점을 바꿔야 할 때 읽는다.
> 코드: `assets/template/src/lib/js/_comm/hkCommon.js`(제어), `assets/template/src/layouts/Layout.astro`(선언). 게임형·모바일뷰 예시는 `patterns.md`.

## 헤더는 프로젝트가 만들지 않는다

`<head>`의 인터랙티브 임베드 스크립트(`interactive-embed.js`, 아래 표)가
`<interactive-header>`를 `body` 맨 앞에 자동으로 붙인다. 로고·홈 링크·로그인·공유(페이스북, X, 카카오톡, URL 복사)가
전부 그 안에 들어 있다.

- 프로젝트에 `article_bar.astro` 같은 자체 헤더를 만들지 않는다. 헤더가 두 개가 된다.
- 헤더가 언제 숨고 언제 바탕을 까는지는 **프로젝트가 `<html data-gnb>`로 정한다**(아래 "API"). 스크롤형은 `hkCommon.wireScrollFlow()`가, 게임형은 화면 전환 코드가 쓴다. 헤더 자체는 스크롤을 읽지 않는다.
- `<interactive-header>`를 CSS로 숨기거나 위치를 옮기지 않는다. **유일한 예외는 초기 로딩 화면(`body.loading`)이 떠 있는 동안**이다.
  헤더는 `.body-wrapper` 밖에 `position: fixed; z-index: 650`으로 붙고 `.body-wrapper`(`position: fixed`)는 별도 stacking context라,
  로더(`.full-loader`)의 `z-index: 3000`으로는 헤더를 덮을 수 없다. 그래서 `_full_loader.sass`에
  `body.loading interactive-header { opacity: 0 !important; pointer-events: none !important }`를 둔다 (`assets/template/src/styles/_full_loader.sass`에 포함). 로더가 걷히면(`body.loaded`) 자동으로 다시 보인다.
  `visibility: hidden`은 안 먹는다 — 헤더 shadow DOM 안의 `<header>`가 `visibility: visible`을 직접 갖고 있어 자식이 다시 보인다. `opacity`는 자식이 뒤집을 수 없다. `!important`는 헤더 `:host`의 자체 애니메이션(`wc-reveal`)보다 우선하기 위해 필요하다.
  이 한 줄 외에 헤더를 건드리는 CSS는 쓰지 않는다.
- 헤더의 공유 버튼은 `<head>`의 `og:title`, `og:description`, `og:image`, `kakao_og_image` 메타를 읽어 공유 카드를 만든다.
  이 네 개가 비어 있으면 공유 카드가 깨진다 (`Layout.astro`).
- 카카오 공유는 헤더가 카카오 SDK **v2**(`t1.kakaocdn.net/kakao_js_sdk/2.7.6`)로 처리한다. 프로젝트가 v1
  (`developers.kakao.com/sdk/js/kakao.min.js`)을 먼저 로드하면 헤더가 v2 로드를 건너뛰고 공유가 실패하므로 v1은 금지다.


## API — `<html data-*>`

인터랙티브 헤더와 추천 카드는 **`<html>`의 `data-*` 속성만 읽는다.** 스크롤·타이머·창 폭·브라우저 테마를 스스로 보지 않는다. 언제 GNB를 숨기고 언제 추천 카드를 띄울지는 프로젝트(호스트)가 속성을 바꿔서 정한다. 단일 상태 소스다.

| `<html>` 속성 | 값 | 없을 때 | 의미 |
| --- | --- | --- | --- |
| `data-flow` | `game` \| `scroll` | `scroll` | 인터랙티브 형태. `META.ts`의 `FLOW`. 표기용 — 헤더 동작은 이 값으로 갈리지 않는다 |
| `data-view` | `mobile` \| `normal` | `normal` | 뷰포트 형식. `META.ts`의 `VIEW`. `mobile`이면 폭 690 이상에서 GNB가 떠 있는 휴대폰 화면 바깥에 항상 보인다 |
| `data-state` | `intro` \| `play` \| `credits` | `intro` | 진행 단계. **추천 카드는 `credits`에서만 뜬다** |
| `data-gnb` | `transparent` \| `solid` \| `hidden` \| `menu` | `transparent` | GNB 상태. `menu` = GNB 숨김 + 왼쪽 위 로고 버튼(누르면 GNB가 내려옴). `hidden` = 버튼 없이 숨김만 |
| `data-theme` | `light` \| `dark` | `html.dark` 클래스 → 없으면 `light` | `META.ts`의 `THEME`. 투명 GNB면 아이콘 색, solid면 바탕 + 아이콘 색, 추천 카드 색 |

- 초기값은 `Layout.astro`의 `<html>`에 선언한다(`Layout.astro`). 진행 중 변경은 `src/lib/js/_comm/hkCommon.js`의 `setCommon()`으로 한다(`hkCommon.js`).
- `class="dark"`는 `THEME === "dark"`일 때 `data-theme`과 **함께** 둔다. 구 CDN 호환용이며 Layout이 자동으로 만든다. 둘이 어긋나게 직접 쓰지 않는다.
- `_variables.sass`의 `$bgBase`는 `THEME`과 맞춘다(어두운 배경 = `dark`). 어긋나면 헤더 로고가 배경과 같은 색이 돼 안 보인다. `self_check.js`가 셋의 일치를 검사한다.
- 라이트와 다크 중 하나로 고정한다. 페이지 안에서 바꾸는 전환 기능은 만들지 않는다. 예외는 **모바일뷰·게임형의 PC**뿐이다(`patterns.md` 패턴 F `syncOuterTheme`).

헤더·카드가 프로젝트에 알려 주는 이벤트(`document`에 `CustomEvent`):

| 이벤트 | `detail` | 시점 |
| --- | --- | --- |
| `hk-interactive-menu` | `{ open: boolean }` | `data-gnb="menu"`에서 로고 버튼·✕·Esc로 GNB를 열고 닫을 때. 타이머가 있는 게임은 `open`인 동안 멈춘다(`createPause`가 자동 처리) |
| `hk-interactive-recommend` | `{ state: "shown" \| "dismissed" }` | 추천 카드 노출 / 닫기 |

형식별로 언제 어떤 값을 쓰는지는 `patterns.md` 패턴 B(스크롤형)·E(게임형)·F(모바일뷰)에 있다. 요약:

| 형식 | 초기화면 | 진행 중 | 끝(크레딧) |
| --- | --- | --- | --- |
| 스크롤형 (`wireScrollFlow`가 자동) | `state=intro gnb=transparent` | 내리면 `gnb=hidden`, 올리면 `gnb=solid`, `state=play` | 바이라인이 화면 60%에 닿으면 `state=credits gnb=transparent` |
| 게임형 (화면 전환마다 `setCommon`) | `state=intro gnb=transparent` | `state=play gnb=menu` | `state=credits gnb=transparent` |


## 임베드 스크립트 (`interactive-embed.js`)

프론트개발팀이 웹컴포넌트로 만든 **한국일보 인터랙티브 헤더**와 **인터랙티브 추천 카드**를
스크립트 한 줄로 붙이는 로더다. 구 `hkUtilMoreInteractive.min.js`(더보기 위젯)를 대체한다.

```html
<script is:inline src={`https://assets.hankookilbo.com/components/interactive-embed/v2/interactive-embed.js?Nid=${ARTICLE_KEY}`}></script>
```

- **`Nid=기사ID`는 필수**다. 값은 `META.ts`의 `ARTICLE_KEY`(A + 19자리)를 그대로 넣는다. 파라미터 이름은
  **대문자 N**(`Nid`)이어야 한다 — 스크립트가 `searchParams.get("Nid")`로 읽으므로 `nid`, `NID`는 무시된다.
- 이 스크립트가 하는 일: ① 헤더 프래그먼트(`interactive-header.html`)를 받아 `<interactive-header>`를
  `body` 맨 앞에 붙이고 `header.js`로 살린다 ② `Nid`가 있으면 `interactive-recommend.js?Nid=…`를 로드해
  화면 하단 추천 카드를 띄운다. 추천 후보에서 **현재 기사(`Nid`)를 제외**하므로 값이 틀리면 자기 기사가 추천에 뜬다.
- `data-scroll-container`는 **쓰지 않는다**(v1 전용이었다). v2 헤더·카드는 스크롤을 읽지 않고 `<html data-*>`만 본다.
- **CDN은 운영 주소 `https://assets.hankookilbo.com` 하나만 쓴다.** `assets-dev.`, `assets-stg.` 주소는 로컬 테스트용으로도 소스에 남기지 않는다 (`self_check.js`가 실패 처리).
- 추천 카드만 끄려면 `<script … data-recommend="false">`. 헤더는 끌 수 없다.
- `v2` 별칭 경로라 프론트개발팀이 패치를 승격해도 소비 코드는 바뀌지 않는다. 버전을 고정하지 않는다. `v1`은 `<html data-*>`를 읽지 않는 구 버전이다 — 새 프로젝트는 쓰지 않는다.
- 로컬(`localhost:3000`)과 `interactive.hankookilbo.com`에서 헤더가 안 뜨고 콘솔에 `Access to fetch … blocked by CORS`가
  나오면 CDN 허용 목록 문제다(`theming.md` 웹폰트와 같은 정책). 코드 문제가 아니므로 프론트개발팀에 문의한다.


## `hkCommon.js` — 프로젝트가 쓰는 쪽

`assets/template/src/lib/js/_comm/hkCommon.js`. 헤더·카드는 속성만 읽으므로 **언제** 바꿀지는 여기서 정한다.

| 함수 | 언제 | 하는 일 |
| --- | --- | --- |
| `setCommon({ state, gnb, theme })` | 게임형 화면 전환마다 | `<html data-*>`를 한 번에 쓴다. `null`이면 속성을 지운다 |
| `wireScrollFlow({ scroller, creditsEl, ratio = 0.4 })` | 스크롤형. `Layout.astro`가 `FLOW === "scroll"`일 때 자동 호출 | 맨 위 `intro·transparent`, 내리면 `hidden`, 올리면 `solid`(`state=play`). 바이라인(`.byline`) 윗선이 화면 아래 40% 선에 닿거나 맨 아래면 `credits·transparent`. credits 동안은 스크롤이 GNB를 건드리지 않는다. 모바일뷰면 기본 scroller가 `.shell`이고 바이라인을 그 안으로 옮긴다. **해제 함수를 돌려준다** — 형식을 새로고침 없이 바꿀 때만 쓴다 |
| `placeByline(target)` | 게임형 크레딧 화면 | 바이라인을 `target` 안으로 옮긴다 (Layout은 본문 뒤에 렌더) |
| `createPause({ onChange })` | **타이머·애니메이션 루프가 있는 게임만.** 없으면 부르지 않는다 | 멈출 이유 목록. `pause.paused`, `pause.hold(이유, on)`. 로고 버튼 메뉴(`menu`)와 모바일뷰 "화면이 너무 작아요"(`small`)를 자동으로 건다 |
| `onMenu(cb)` | 메뉴 열림을 직접 받고 싶을 때 (보통은 `createPause`로 충분) | `hk-interactive-menu` 수신. `cb(open)`. 해제 함수를 돌려준다 |
| `onRecommend(cb)` | 필요할 때 | `hk-interactive-recommend` 수신. `cb("shown" \| "dismissed")`. 해제 함수를 돌려준다 |
| `syncOuterTheme(theme)` | **모바일뷰 + 게임형만** (패턴 F) | 폭 690 이상에서 `data-theme`을 브라우저 라이트/다크로, 휴대폰 폭에서 `THEME`로 되돌린다. `--hk-gnb-solid-bg`(#eee/#2a2a2a)도 같이 |

60% 규칙을 바꾸고 싶으면 `wireScrollFlow({ ratio: 0.5 })`처럼 인자만 바꾼다. 콘텐츠 스크롤 코드(IO·ScrollTrigger)에서 `dataset.gnb`를 직접 쓰지 않는다.

## 자주 나는 문제

- **추천 카드가 안 뜬다** — `<html data-state>`가 `credits`로 바뀌는지 본다. 스크롤형이면 `Layout.astro`의 `wireScrollFlow()` 호출과 `.byline` 존재, 게임형이면 끝 화면 전환의 `setCommon({ state: "credits" })`. `self_check.js`가 둘 다 검사한다. 포트가 3000이 아니면 API가 CORS로 막혀 카드가 빈다.
- **GNB가 스크롤해도 안 숨는다** — v2는 스스로 스크롤을 읽지 않는다. `data-flow="scroll"`이고 `wireScrollFlow()`가 돌아야 한다. `data-scroll-container`는 v1 전용이라 효과가 없다(`legacy.md`).
- **로고가 배경과 같은 색** — `META.ts`의 `THEME`과 `$bgBase`가 어긋난 것. `theming.md`.
- **헤더가 아예 안 뜨고 콘솔에 CORS** — CDN 허용 목록 문제(`localhost:3000`, `interactive.hankookilbo.com`). 코드 문제가 아니다. 프론트개발팀 문의.
