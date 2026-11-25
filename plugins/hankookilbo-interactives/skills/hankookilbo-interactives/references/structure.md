# 본문 구조 규칙 — 본문 글, 높이, 코드 자리, 한 화면 페이지

> 본문(`index.html`의 `<main>`, "프로젝트 스타일", "프로젝트 스크립트")을 짤 때 읽는다. 정해진 본문 패턴은 없다 — 연출은 브리프와 `frontend-design`이 정하고, 라이브러리는 `hankookilbo-interactives-libs` 스킬이 정한다. 여기 있는 건 어떤 연출이든 지켜야 하는 구조 규칙뿐이다.

## 지켜야 하는 것

- **스크롤 컨테이너는 `.body-wrapper` 하나다.** `window.scrollY`·`window.addEventListener("scroll")`은 동작하지 않는다. 스크롤 위치는 `.body-wrapper`의 `scrollTop`으로 읽는다. 스크롤 연동 라이브러리는 libs 스킬 `reference/scroll.md`.
- **높이**: 첫 화면과 스크롤 없는 페이지의 화면은 `var(--screen-h)`(= `100dvh - var(--gnb-h)`, GNB 아래 한 화면). `100dvh`를 쓰면 GNB 높이만큼 넘쳐 첫 화면 아래가 잘리고, 스크롤 없어야 할 페이지에 스크롤이 생겨 그 스크롤에 GNB가 숨는다. 그 밖의 섹션과 장식용 sticky 배경은 자유다 — 장식용 배경은 `100dvh`여도 된다(첫 화면에서 아래쪽이 GNB만큼 잘릴 뿐). GNB 자리는 `.body-wrapper` 위 여백이 이미 비워 둔다. **첫 요소만** GNB 아래에서 시작하고, 스크롤한 뒤에는 콘텐츠가 GNB 밑으로 지나가도 된다(그때 GNB는 숨었거나 바탕이 있다). 콘텐츠에 `padding-top: 64px` 같은 GNB 여백을 또 주지 않는다 — 두 번 비어 보인다.
- **공통영역은 건드리지 않는다.** 헤더·추천 카드는 `hk-common-js` 블록이 자동으로 처리한다. 본문 코드가 할 일은 `data-credits="end"`일 때 `hkCommon.showCredits(target)`·`hkCommon.hideCredits()`를 부르는 것뿐이다(`common-area.md`). 본문의 IntersectionObserver·ScrollTrigger에서 `dataset.gnb`·`dataset.state`를 쓰지 않는다.
- **기사 글은 `<main>` 안에 HTML로 직접 쓴다.** 스크립트로 그려 넣으면 검색과 공유 미리보기에 보이지 않는다. 스크립트 안의 데이터 객체는 퀴즈 문항·차트 수치처럼 **상호작용에 쓰는 데이터**에만 쓴다.
- **코드 자리**: 스타일은 두 번째 `<style>`("프로젝트 스타일"), 스크립트는 마지막 `<script>`("프로젝트 스크립트"). 길어지면 `.css`·`.js` 파일을 `index.html` 옆에 두고 상대 경로로 불러와도 된다(`self_check.js`가 함께 검사한다). 따로 둔 스크립트는 `hk-common-js` 블록 뒤에서 불러온다.
- **`index.html`에 안내·설명 주석을 남기지 않는다.** 파일이 그대로 게시되어 브라우저의 페이지 소스 보기에 주석이 보인다. 메모는 `brief.md`에 적는다. 뻔하지 않은 프로젝트 로직을 설명하는 한 줄 코드 주석은 괜찮다.
- **라이브러리는 CDN에서 불러온다.** 설치·빌드가 없다. 무엇을 어떻게 불러올지는 libs 스킬.
- 이미지는 `loading="lazy"`, 사진마다 캡션에 출처. 외부 링크는 `target="_blank" rel="noopener"`.

## 스크롤 연동 본문 (스크롤리텔링·타임라인)

고정 배경 + 섹션이면 `position: sticky; top: var(--sticky-top)` 배경(`top: 0`이면 GNB 높이만큼 아래에 붙는다) + 각 섹션 `min-height`. 현재 섹션은 `IntersectionObserver`로 잡고(`rootMargin: "-45% 0px -45% 0px"`면 화면 가운데 10% 구간) 배경을 바꾼다. **공통영역용 감지와 섞지 않는다** — GNB·추천 카드는 공통 블록이 `.body-wrapper` 스크롤을 따로 본다. 스크럽·핀이 필요하면 libs 스킬 `reference/scroll.md`(GSAP ScrollTrigger, scroller 지정).

## 데이터 시각화

- 정적 차트는 SVG를 `<main>`에 직접 쓴다 (스크립트 없이 보인다).
- 인터랙션(hover, 필터)이 필요하면 프로젝트 스크립트로 붙인다. 수치는 스크립트의 데이터 객체에 둔다.
- 차트 라이브러리를 쓴다면 CDN에서 필요한 모듈만 불러온다 (d3라면 `d3-scale`, `d3-shape`).

## 스크롤 없는 한 화면 페이지 — `data-credits="end"`

퀴즈·선택지·미니게임처럼 **페이지 스크롤 없이 한 화면씩 바뀌는** 페이지. 스크롤이 없으니 크레딧 전까지 투명 GNB 그대로다(화면 안의 목록·패널이 `overflow-y: auto`로 안쪽에서 스크롤돼도 된다 — GNB는 `.body-wrapper` 스크롤만 본다). 프로젝트는 크레딧에 들어가고 나가는 순간만 알린다.

- 루트 요소를 `height: var(--screen-h); overflow: hidden`으로 고정하고 화면들을 그 안에 겹쳐 둔다. 화면을 어떻게 바꾸는지(직접 만든 함수, 게임 엔진의 씬 전환)는 자유다.
- 끝 화면으로 갈 때 `hkCommon.showCredits(target)`(`target` = 바이라인을 넣을 요소), 크레딧에서 다른 화면으로 돌아갈 때 `hkCommon.hideCredits()`. `<html>`의 `data-credits`는 `"end"`. `"bottom"`이면 바이라인이 본문 뒤에 붙어 스크롤이 생기고 그 스크롤에 GNB가 숨는다. `end`인데 `showCredits(target)` 호출이 없으면 `self_check.js`가 실패 처리한다.
- **크레딧 화면 = 바이라인 + 추천 카드.** `data-credits="end"`면 공통 블록이 바이라인을 숨김 자리(`.byline-holder`)에 두고, `showCredits(target)`가 `target` 안으로 옮겨 온다. 크레딧 화면이 길어 안에서 스크롤돼도 된다.
- "이전 화면·처음으로" 같은 버튼은 프로젝트가 만든다. 엔딩이 한 화면이고 아직 크레딧이 아니면 `showCredits(target)`를 부르지 않는다. 추천 카드는 크레딧에서만 뜬다.
- **타이머는 선택이다.** 시간 제한·애니메이션 루프가 있을 때만 `hkCommon.createPause()`를 쓴다. 자동으로 걸리는 이유는 없다. 게임이 `pause.hold("feedback", true)`처럼 이유를 걸고 `false`로 푼다. `createPause({ onChange })`로 멈춤/재개 순간을 받을 수 있다(영상·오디오 일시정지). `window.gameClock` 같은 전역은 만들지 않는다.

`hkCommon`의 함수 전체는 `common-area.md` 「`hkCommon` — 프로젝트가 쓰는 쪽」.
