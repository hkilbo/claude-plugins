# 공통영역 — 인터랙티브 헤더 · 추천 카드 (웹컴포넌트 v2)

> 헤더가 안 뜨거나, 숨김/바탕 전환이 이상하거나, 추천 카드 노출 시점을 바꿔야 할 때 읽는다.
> 코드: `assets/template/index.html` — `<html>` 태그(선언), `<head>`의 임베드 스크립트, `hk-common-js` 블록(제어). 스크롤 없는 한 화면 페이지에서 부르는 법은 `structure.md`.

## 헤더는 프로젝트가 만들지 않는다

`<head>`의 인터랙티브 임베드 스크립트(`interactive-embed.js`)가
`<interactive-header>`를 `body` 맨 앞에 자동으로 붙인다. 로고·홈 링크·로그인·공유(페이스북, X, 카카오톡, URL 복사)가
전부 그 안에 들어 있다.

- 프로젝트에 자체 헤더를 만들지 않는다. 헤더가 두 개가 된다.
- 헤더가 언제 숨고 언제 바탕을 까는지는 **템플릿이 `<html data-gnb>`로 정한다**(아래 "API"). `hk-common-js` 블록이 쓴다. 헤더 자체는 스크롤을 읽지 않는다.
- `<interactive-header>`를 CSS로 숨기거나 위치를 옮기지 않는다. **유일한 예외는 초기 로딩 화면(`body.loading`)이 떠 있는 동안**이다.
  헤더는 `.body-wrapper` 밖에 `position: fixed; z-index: 650`으로 붙고 `.body-wrapper`(`position: fixed`)는 별도 stacking context라,
  로더(`.full-loader`)의 `z-index: 3000`으로는 헤더를 덮을 수 없다. 그래서 `hk-common-css` 블록에
  `body.loading interactive-header { opacity: 0 !important; pointer-events: none !important }`가 들어 있다. 로더가 걷히면(`body.loaded`) 자동으로 다시 보인다.
  `visibility: hidden`은 안 먹는다 — 헤더 shadow DOM 안의 `<header>`가 `visibility: visible`을 직접 갖고 있어 자식이 다시 보인다. `opacity`는 자식이 뒤집을 수 없다. `!important`는 헤더 `:host`의 자체 애니메이션(`wc-reveal`)보다 우선하기 위해 필요하다.
  이 한 줄 외에 헤더를 건드리는 CSS는 쓰지 않는다.
- 헤더의 공유 버튼은 `<head>`의 `og:title`, `og:description`, `og:image`, `kakao_og_image` 메타를 읽어 공유 카드를 만든다.
  이 네 개가 비어 있으면 공유 카드가 깨진다.
- 카카오 공유는 헤더가 카카오 SDK **v2**(`t1.kakaocdn.net/kakao_js_sdk/2.7.6`)로 처리한다. 프로젝트가 v1
  (`developers.kakao.com/sdk/js/kakao.min.js`)을 먼저 로드하면 헤더가 v2 로드를 건너뛰고 공유가 실패하므로 v1은 금지다.


## API — `<html data-*>`

인터랙티브 헤더와 추천 카드는 **`<html>`의 `data-*` 속성만 읽는다.** 스크롤·타이머·창 폭·페이지 배경을 스스로 보지 않는다. 템플릿의 `hk-common-js` 블록이 속성을 바꿔서 정한다. 단일 상태 소스다.

| `<html>` 속성 | 값 | 없을 때 | 의미 |
| --- | --- | --- | --- |
| `data-state` | `intro` \| `play` \| `credits` | `intro` | 진행 단계. **추천 카드는 `credits`에서만 뜬다** |
| `data-gnb` | `transparent` \| `solid` \| `hidden` | `transparent` | GNB 상태. `hidden` = 숨김, `solid` = 바탕을 깐 GNB |
| `data-theme` | `light` \| `dark` | `light` | 투명 GNB면 아이콘 색, solid면 바탕 + 아이콘 색, 추천 카드 색. **공통 블록이 배경색을 보고 자동으로 쓴다** |

- `index.html`의 `<html>`에는 `data-state="intro" data-gnb="transparent"`와 `data-credits`(아래 "GNB 상태와 크레딧")를 선언한다. 진행 중 변경은 공통 블록이 한다. `data-credits`는 템플릿만 읽는다 — 헤더·카드는 모르는 속성이라 무시한다.
- `data-flow`, `data-view`, `data-gnb`의 `menu` 값, `class="dark"`는 템플릿이 쓰지 않는다. WC v2는 이미 배포된 기사를 위해 계속 읽을 뿐이다. 새 프로젝트에서 직접 쓰지 않는다.
- **테마는 자동이다.** 공통 블록이 `.body-wrapper` → `body` → `html` 순서로 배경색을 읽는다(반투명이면 뒤 요소의 색과 섞는다). WCAG 상대 휘도가 0.179보다 크면 `light`(검정 아이콘), 아니면 `dark`(흰 아이콘)다. 끝까지 투명하면 `light`. 같은 색을 `<meta name="theme-color">`에도 쓴다.
- 세 요소의 `class`·`style`이 바뀌거나 배경 transition이 끝나면 다시 판정한다. 그래서 실행 중에 배경색을 바꿔도 GNB 아이콘 색이 따라간다.
- 판정이 맞으려면 두 가지를 지킨다. ① `.body-wrapper`·`body`·`html` 배경은 단색(`--bg-base`)만 쓴다. 이미지·그라데이션은 `.body-wrapper` 안의 요소에 둔다. ② 로드 직후 GNB 영역을 덮는 `position: fixed` 레이어(인트로 영상, 오버레이)를 두지 않는다. fixed 레이어는 `top: var(--gnb-h)`부터 시작한다. 어기면 로고가 배경과 같은 색으로 보인다.

헤더·카드가 프로젝트에 알려 주는 이벤트(`document`에 `CustomEvent`):

| 이벤트 | `detail` | 시점 |
| --- | --- | --- |
| `hk-interactive-recommend` | `{ state: "shown" \| "dismissed" }` | 추천 카드 노출 / 닫기 |

WC는 `hk-interactive-menu`도 보내지만 `gnb=menu`에서만 생기므로 템플릿 페이지에서는 나오지 않는다.

## GNB 상태와 크레딧

모든 페이지에 같은 규칙이다. 공통 블록이 `.body-wrapper` 스크롤 하나만 보고 정한다.

| 상황 | `data-state` | `data-gnb` |
| --- | --- | --- |
| 로드 직후, 맨 위(`.body-wrapper` scrollTop ≤ 8px) | `intro` | `transparent` |
| 아래로 스크롤 | `play` | `hidden` |
| 위로 스크롤 | `play` | `solid` |
| 크레딧 | `credits` | `solid` |

- 맨 위를 벗어나는 순간 바로 `hidden`이 된다. 그 뒤 방향 전환은 24px 이상 움직였을 때만 한다.
- 게임 안의 목록·패널처럼 안쪽에서 스크롤되는 영역은 세지 않는다.
- 스크롤이 없는 페이지는 스크롤 이벤트가 없으니 크레딧 전까지 `intro·transparent` 그대로다.
- `credits`인 동안에는 스크롤이 GNB를 바꾸지 않는다.

**크레딧 = 바이라인 + 추천 카드.** 둘은 항상 함께 나온다. 추천 카드는 WC가 `state=credits`에서 띄우고, 바이라인 위치는 템플릿이 맡는다. 언제 들어갈지는 `<html data-credits>`로 정한다.

| `data-credits` | 바이라인 | 들어가는 때 | 떠나는 때 |
| --- | --- | --- | --- |
| `bottom` (기본) | 본문 끝(`<main>` 뒤, 템플릿 기본 위치) | 바이라인 윗선이 화면 위에서 60% 지점에 닿거나 맨 아래에 오면 `credits·solid` | 위로 올라가 벗어나면 `play·solid` (scrollTop ≤ 8px이면 `intro·transparent`) |
| `end` | 크레딧 전에는 숨김 자리(`.byline-holder`)에 있어 흐름에 없다 | 프로젝트가 `hkCommon.showCredits(target)`을 부르면 바이라인을 `target` 안으로 옮기고 `credits·solid` | `hkCommon.hideCredits()`를 부르면 바이라인을 숨김 자리로 되돌리고, 맨 위면 `intro·transparent`, 아니면 `play·solid` |

- 어느 쪽인지는 제작자가 고른다(인터뷰 4번). 단 `bottom`은 바이라인이 본문 뒤에 붙어 스크롤 없는 페이지에 스크롤이 생기고 그 스크롤에 GNB가 숨는다 — 스크롤 없는 페이지는 `end`. 스크롤되는 페이지에서도 롱폼 끝의 퀴즈를 다 풀어야 크레딧을 보여 주려면 `end`.
- `showCredits(target)`은 스크롤을 옮기지 않는다. 바이라인이 화면에 들어오게 할지는 프로젝트가 정한다.
- `end`에서 크레딧까지 가지 않고 나간 독자는 바이라인을 보지 못한다.
- 60% 지점은 상수 `CREDITS_RATIO = 0.4`(화면 아래 40% 선 = 위에서 60%)다. 공통 블록 안에 있어 설정으로 바꿀 수 없다. 바꾸려면 블록을 고쳐야 하고, 그러면 `self_check.js`가 원본과 다르다고 경고한다.


## 임베드 스크립트 (`interactive-embed.js`)

프론트개발팀이 웹컴포넌트로 만든 **한국일보 인터랙티브 헤더**와 **인터랙티브 추천 카드**를
스크립트 한 줄로 붙이는 로더다. 구 `hkUtilMoreInteractive.min.js`(더보기 위젯)를 대체한다.
템플릿 `<head>`의 `<script src="…/interactive-embed/v2/interactive-embed.js?Nid=…">` 한 줄이다. 고칠 것은 주소 끝의 `?Nid=` 값 하나다.

- **`Nid=기사ID`는 필수**다. 값은 `hk:nw_newsid` 메타와 같은 기사 키(A + 19자리)다. `self_check.js`가 둘이 같은지 검사한다. 파라미터 이름은
  **대문자 N**(`Nid`)이어야 한다 — 스크립트가 `searchParams.get("Nid")`로 읽으므로 `nid`, `NID`는 무시된다.
- 이 스크립트가 하는 일: ① 헤더 프래그먼트(`interactive-header.html`)를 받아 `<interactive-header>`를
  `body` 맨 앞에 붙이고 `header.js`로 살린다 ② `Nid`가 있으면 `interactive-recommend.js?Nid=…`를 로드해
  화면 하단 추천 카드를 띄운다. 추천 후보에서 **현재 기사(`Nid`)를 제외**하므로 값이 틀리면 자기 기사가 추천에 뜬다.
- `data-scroll-container`는 **쓰지 않는다**(v1 전용이었다 — `legacy.md`). v2 헤더·카드는 스크롤을 읽지 않고 `<html data-*>`만 본다.
- **CDN은 운영 주소 `https://assets.hankookilbo.com` 하나만 쓴다.** `assets-dev.`, `assets-stg.` 주소는 로컬 테스트용으로도 소스에 남기지 않는다 (`self_check.js`가 실패 처리).
- 추천 카드만 끄려면 `<script … data-recommend="false">`. 헤더는 끌 수 없다.
- `v2` 별칭 경로라 프론트개발팀이 패치를 승격해도 소비 코드는 바뀌지 않는다. 버전을 고정하지 않는다. `v1`은 `<html data-*>`를 읽지 않는 구 버전이다 — 새 프로젝트는 쓰지 않는다.
- 로컬(`localhost:3000`)이나 서비스 주소(`www.hankookilbo.com`)에서 헤더가 안 뜨고 콘솔에 `Access to fetch … blocked by CORS`가
  나오면 CDN 허용 목록 문제다(`theming.md` 웹폰트와 같은 정책). 코드 문제가 아니므로 프론트개발팀에 문의한다.
  파일을 `file://`로 열었을 때도 같은 증상이다 — `localhost:3000`으로 연다.


## `hkCommon` — 프로젝트가 쓰는 쪽

`hk-common-js` 블록이 전역 `window.hkCommon`을 만든다. 프로젝트 스크립트는 불러오는 구문 없이 `hkCommon.함수()`로 부른다. 블록 자체는 고치지 않는다.

**자동으로 되는 것** (부를 것 없음): 배경색으로 `data-theme`·`theme-color` 정하기, 위 GNB 상태 표대로 `data-state`·`data-gnb` 쓰기, `data-credits="bottom"`이면 스크롤할 때마다 `.byline` 위치를 보고 크레딧으로 바꾸기, `"end"`면 바이라인을 숨김 자리로 옮겨 두기, 페이지 리소스와 웹폰트가 준비되면 로딩 화면 걷기.

| 함수 | 언제 | 하는 일 |
| --- | --- | --- |
| `hkCommon.showCredits(target)` | `data-credits="end"`, 마지막 화면에 들어갈 때 | 위 `data-credits` 표의 `end` 「들어가는 때」. `target`은 바이라인이 옮겨 갈 요소다. `target` 없이 부르면 바이라인을 제자리(본문 끝)에서 보여 준다 — 어느 쪽이든 바이라인과 추천 카드가 함께 나온다 |
| `hkCommon.hideCredits()` | `data-credits="end"`, "처음부터 다시"처럼 크레딧을 떠날 때 | 바이라인을 다시 숨긴다. 위 표의 `end` 「떠나는 때」 |
| `hkCommon.onRecommend(cb)` | 필요할 때 | `hk-interactive-recommend` 수신. `cb("shown" \| "dismissed")`. 해제 함수를 돌려준다 |
| `hkCommon.createPause({ onChange })` | **타이머·애니메이션 루프가 있는 게임만.** 없으면 부르지 않는다 | 멈출 이유 목록. `pause.paused`, `pause.hold(이유, on)`. 자동으로 걸리는 이유는 없다 — 게임이 직접 건다 |
| `hkCommon.removeLoader()` | 보통 부르지 않는다 (자동) | 로딩 화면을 걷는다 (`body.loading` → `body.loaded`) |
| `hkCommon.setCommon(attrs)`, `hkCommon.placeByline(target)` | 보통 직접 부르지 않는다 | 위 함수들이 쓰는 기본 함수. `<html data-*>`를 한 번에 쓴다(`null`이면 지움) / 바이라인을 `target` 안으로 옮긴다 |

콘텐츠 스크롤 코드(IO·ScrollTrigger)에서 `dataset.gnb`·`dataset.state`를 직접 쓰지 않는다.

## 자주 나는 문제

- **추천 카드가 안 뜬다** — `<html data-state>`가 `credits`로 바뀌는지 본다. `data-credits="bottom"`이면 `hk-common-js` 블록과 `.byline`이 있는지, `"end"`면 마지막 화면에서 `hkCommon.showCredits(target)`을 부르는지. `self_check.js`가 검사한다. 포트가 3000이 아니면 API가 CORS로 막혀 카드가 빈다.
- **GNB가 스크롤해도 안 숨는다** — v2는 스스로 스크롤을 읽지 않는다. `hk-common-js` 블록이 있어야 하고, 스크롤이 `.body-wrapper`에서 일어나야 한다. 안쪽 스크롤 영역은 세지 않는다.
- **스크롤 없어야 할 페이지에 스크롤이 생겨 GNB가 숨는다** — 원인은 둘 중 하나다. ① `data-credits="bottom"`: 바이라인이 본문 뒤에 붙어 스크롤이 생긴다. `"end"`로 바꾸고 마지막 화면에서 `hkCommon.showCredits(target)`을 부른다. ② 화면 높이를 `100dvh`로 잡아 GNB 높이만큼 넘쳤다. `var(--screen-h)`로 바꾼다(`structure.md`).
