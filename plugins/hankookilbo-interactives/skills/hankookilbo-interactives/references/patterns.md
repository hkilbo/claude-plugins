# 본문 패턴 — 데이터 파일, 페이지 패턴 A~F, React 아일랜드

> 본문(`src/pages/index.astro`)을 구성할 때 읽는다. 코드는 `assets/patterns/<패턴>/`에 있다 — 하나 골라 복사한다.

| 패턴 | 언제 | 복사할 파일 |
| --- | --- | --- |
| A. 단순 롱폼 | 글+사진이 세로로 이어지는 기사 | `assets/patterns/longform/index.astro` |
| B. 스크롤리텔링 | 고정 배경 + 스크롤 텍스트, 여정형·타임라인 | `assets/patterns/scrolly/index.astro`, `scrolly.scss` |
| C. React 아일랜드 | 상태가 있는 UI(비교 슬라이더, 퀴즈, 지도) | `assets/patterns/island/Counter.tsx` (예시) |
| D. 데이터 시각화 | 차트 | 아래 설명만 |
| E. 게임형 (`FLOW="game"`) | 화면 넘김·퀴즈·선택지·미니게임 | `assets/patterns/game/index.astro` |
| F. 모바일뷰 (`VIEW="mobile"`) | PC에서도 3:5 휴대폰 화면을 가운데 띄움 | `assets/patterns/mobile-view/_mobile_view.scss`, `mobile-view.ts` |

A~D는 스크롤형(`FLOW="scroll"`)이다. 헤더·추천 카드는 `Layout.astro`가 `wireScrollFlow()`로 자동 처리하므로 본문 코드가 할 일이 없다. E는 화면 전환마다 `setCommon()`을 쓴다(`common-area.md`).

## 데이터 파일 `src/data/data.ts`

본문 텍스트, 이미지 경로, 챕터 정보는 `.astro`에 하드코딩하지 않고 `src/data/*.ts`에 타입과 함께 둔다. 기자가 텍스트만 수정할 수 있게 하기 위해서다.

원문 `assets/template/src/data/data.ts`: `Story`(문단 배열·정렬·이미지·스텝 라벨) / `Chapter`(id·제목·배경·내비 노출·stories) 타입과 예시 1챕터.

## 패턴 A. 단순 롱폼

`main.longform > section.hero(h1, p.lead) + section.article(p, figure > img[loading=lazy] + figcaption)`. 스타일은 `longform.scss`를 새로 만든다.

## 패턴 B. 스크롤리텔링

핵심 구조: `position: sticky` 배경 컨테이너 + 각 `100vh` 이상의 `section`. `IntersectionObserver`로 화면 중앙에 들어온 섹션 인덱스를 배경에 전달한다.

구조: `.bg-container`(sticky, `100vh`/`100dvh`, `.bg-item`들을 `opacity`로 교체) + `.content-overlay > .story-section(min-height 100vh) > .story-box`. `<script>`의 IO는 `rootMargin: "-45% 0px -45% 0px"`(화면 중앙 10% 구간)로 현재 섹션을 잡아 배경을 바꾸고 `window`에 `section-change` CustomEvent를 쏜다. **공통영역용 IO와 섞지 않는다** — GNB·추천은 `wireScrollFlow`가 따로 본다.

## 패턴 C. React 아일랜드

React는 **상태가 필요한 부분만** 쓴다. Astro 스크립트와는 `window` CustomEvent로 통신한다.

`Counter.tsx`는 `section-change`를 받아 현재 챕터를 표시하는 최소 예시다. `index.astro`에서 `import Counter from "../components/Counter"` 후 `<Counter client:idle />`.

| 디렉티브              | 언제 쓰나                                                                  |
| --------------------- | -------------------------------------------------------------------------- |
| `client:load`         | 첫 화면에 바로 보이고 즉시 상호작용해야 하는 UI                            |
| `client:idle`         | 우선순위 낮은 UI (내비, 가이드)                                            |
| `client:visible`      | 스크롤해서 내려가야 보이는 UI (차트, 갤러리)                               |
| `client:only="react"` | **`window`, `document`, WebGL(three.js)을 쓰는 컴포넌트.** SSR을 건너뛴다. |

three.js / react-three-fiber는 반드시 `client:only="react"`로 마운트한다.

## 패턴 D. 데이터 시각화

- 정적 차트는 SVG를 `.astro`에서 데이터로 직접 그린다 (JS 0kb).
- 인터랙션(hover, 필터)이 필요하면 React 아일랜드 + `client:visible`.
- 외부 차트 라이브러리를 쓴다면 번들 크기를 먼저 확인한다. d3는 필요한 모듈만 (`d3-scale`, `d3-shape`) 설치한다.

## 패턴 E. 게임형 (화면 넘김) — `FLOW = "game"`

퀴즈·선택지·미니게임처럼 **페이지 스크롤 없이 한 화면씩 바뀌는** 형식. 공통영역은 화면 전환 코드가 `setCommon()`으로 직접 정한다. `Layout.astro`의 `wireScrollFlow()`는 `FLOW === "scroll"`에서만 돌므로 건드릴 게 없다.

`assets/patterns/game/index.astro`: `section.screen[data-screen]`들을 두고 `go(name)`이 하나만 `.is-on`으로 켠다. 화면별 공통영역 값은 `COMMON` 표 한 곳에 있다 — 화면이 늘면 행을 추가한다.

| 화면 | `setCommon` | 헤더·카드 |
| --- | --- | --- |
| `title` | `{ state: "intro", gnb: "transparent" }` | 투명 GNB. 시작 그림이 어두우면 `THEME`을 dark로 |
| `play` | `{ state: "play", gnb: "menu" }` | GNB 숨김 + 왼쪽 위 로고 버튼. 누르면 GNB가 내려오고 ✕ |
| `credits` | `{ state: "credits", gnb: "transparent" }` | 투명 GNB 고정 + 추천 카드 |

- 끝 화면의 "이전 화면 가기·처음부터 다시" 같은 버튼은 **프로젝트가** 만든다. 공통영역은 만들어 주지 않는다.
- GNB가 숨은 화면(`gnb=menu`)에서 나가기는 로고 버튼 → 내려온 GNB의 ‹·로고가 맡는다. 확인 창은 두지 않는다.
- 엔딩이 한 화면이고 아직 크레딧이 아니면 `play` 그대로 둔다. 추천 카드는 `credits`에서만 뜬다.

## 패턴 F. 모바일뷰 — `VIEW = "mobile"`

PC·태블릿에서도 **세로 3:5 휴대폰 화면(최대 480×800)을 GNB 아래 가운데에 띄우는** 형식. 주로 게임형과 조합한다. 폭 690 미만(휴대폰)에서는 화면이 창을 꽉 채우고 일반뷰와 같아진다.

- `assets/patterns/mobile-view/_mobile_view.scss`를 `src/styles/`에 복사하고 `style.sass`에 `@import 'mobile_view'`. 콘텐츠 루트에 `class="shell"`. 폭 690 이상에서 `.body-wrapper`가 바깥 판(`--site-bg`, 브라우저 라이트 #eee / 다크 #2a2a2a)이 되고 `.shell`이 3:5(최대 800 높이)로 가운데 뜬다. 모서리 태블릿 24 / PC 32.
- `assets/patterns/mobile-view/mobile-view.ts`를 `index.astro`의 `<script>`에 넣는다. 게임형이면 `syncOuterTheme(THEME)`로 바깥 GNB가 브라우저 테마를 따르고, "화면이 너무 작아요" 조건(`matchMedia`)에서 시계를 멈춘다.
- `<div class="hk-small"><p>화면이 너무 작아요</p><p>창을 키우거나 휴대폰을 세로로 돌려 주세요</p></div>`를 `.body-wrapper` 안에 둔다. 문구는 디자인 확정값으로 바꾼다.
- 폭 690 이상에서 GNB는 헤더가 CSS로 바깥에 고정한다(`data-gnb`가 `menu`여도 로고 버튼 없음). 프로젝트가 따로 할 일은 없다.
- 스크롤형 모바일뷰(`FLOW="scroll"`)는 `syncOuterTheme`를 부르지 않는다. `THEME` 고정이다.

## 공통 JS 유틸 (`assets/template/src/lib/js/_comm/`)

| 파일 | 함수 |
| --- | --- |
| `common.js` | `removeLoader()` — `body.loading` → `body.loaded` |
| `hkCommon.js` | 공통영역 제어 → `common-area.md` |
| `ioScroll.js` | `scrollChangeBgByTextBox(elements, bgContainer, activeClassName)` — 보이는 텍스트 박스와 같은 `data-id` 배경에 클래스 / `scrolladdClassToBgByTextBox(elements, bgContainer)` — 박스의 `data-class-name`을 배경에 토글 / `scrollPercentage(el)` — `.body-wrapper` 기준 진행률 0~1 |
| `util.js` | `addComma(x)`, `chunkArray(arr, size)` |
