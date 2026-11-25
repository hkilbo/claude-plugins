---
name: hankookilbo-interactives-libs
description: Library selection rules and ready-to-use patterns for Hankook Ilbo interactive news pages (one static index.html with no build step, libraries loaded by CDN <script>, scroll container ".body-wrapper"). Carousel/slider → CSS scroll-snap first, Swiper (CDN) when autoplay/loop/pagination/thumbs is needed. Scroll interaction/scrollytelling → IntersectionObserver first, GSAP ScrollTrigger when scrub/pin/timeline is needed. Map → mapbox-gl. Data on a map → deck.gl MapboxOverlay. Shared state across widgets → plain object + subscribe function in the project script (no state library). Use when building, reviewing, or asked which library to use for 인터랙티브, 스크롤리텔링, 캐러셀, 슬라이더, 지도, 데이터 시각화, 퀴즈, 계산기, 상태 공유 features.
---

# 한국일보 인터랙티브 라이브러리 규칙

인터랙티브 페이지에서 반복되는 5가지 요구(캐러셀, 스크롤 인터랙션, 지도, 지도 위 데이터, 위젯 간 상태 공유)에
**어떤 라이브러리를 쓰고 어떻게 붙이는지** 정한 규칙이다. 팀원 누가 만들어도 같은 스택이 나오게 하는 것이 목적이다.

**첫 번째 규칙: CSS와 순수 JS로 충분하면 라이브러리를 넣지 않는다.**

## 전제 스택

- 페이지는 `index.html` 파일 하나다. 빌드 단계가 없다. CSS는 `<style id="project-style">`(아래에서 "프로젝트 스타일"), JS는 맨 아래 `<script id="project-script">`("프로젝트 스크립트")에 쓴다.
- 프레임워크(React·Vue·Svelte)와 패키지 설치가 필요한 도구는 쓰지 않는다. 라이브러리는 CDN `<script>`로만 로드한다.
- 스크롤 컨테이너는 `window`가 아니라 **`.body-wrapper`** 다. `html, body`는 `overflow: hidden`.
- 정적 파일 경로는 항상 상대 경로 `./img/...`, `./data/...`.
- `hk-common-css` / `hk-common-js` 블록은 고치지 않는다. 공통 기능은 전역 `hkCommon`으로 쓴다.
- `hankookilbo-interactives` 스킬의 규칙을 먼저 따른다. 이 스킬은 그 위에 라이브러리 규칙을 얹는다.

## 라이브러리 선택표

| 요구 | 쓰는 것 | 쓰지 않는 것 (대체 제안 금지) |
| --- | --- | --- |
| 캐러셀, 슬라이더, 이미지 스텝 가이드 | CSS `scroll-snap` (라이브러리 없음). 자동 재생·무한 반복·페이지네이션·썸네일 연동이 필요하면 Swiper | embla, keen-slider, splide, 터치·드래그 직접 구현 |
| 스크롤 진입 시 클래스 토글, 챕터 전환, 배경 교체 | `IntersectionObserver` 직접 작성 | AOS, scrollama, 직접 scroll 이벤트 계산 |
| 스크롤 진행률에 묶인 애니메이션, pin, 타임라인 | GSAP + ScrollTrigger (`scroller: ".body-wrapper"`) | locomotive-scroll, lenis, anime.js |
| 지도 표시, 카메라 이동, 마커, 단순 GeoJSON | mapbox-gl | leaflet, google maps, openlayers |
| 지도 위 대량 데이터, 데이터 기반 시각 인코딩, 히트맵, 아크 | deck.gl `MapboxOverlay` | kepler.gl, mapbox 네이티브 레이어로 수천 개 렌더, d3 SVG 오버레이 |
| 위젯 둘 이상이 같은 상태를 공유 (퀴즈 진행, 필터, 계산기 입력) | 프로젝트 스크립트의 일반 객체 + `subscribe` 함수 (라이브러리 없음) | 상태 라이브러리 일체, `window` 전역 변수 |

사용자가 위 표 밖의 라이브러리를 명시적으로 요구하면 표의 선택지를 한 줄로 제안하고, 사용자가 다시 확인하면 요구대로 진행한다.

## 판단 규칙

**캐러셀은 가벼운 순서로 고른다.**

1. 옆으로 넘기는 슬라이드 줄이면 CSS `scroll-snap` + 이전/다음 버튼 → Swiper를 로드하지 않는다.
2. 자동 재생, 무한 반복, 페이지네이션(dots), 썸네일 연동 중 하나라도 필요하다 → Swiper.

**스크롤 인터랙션은 가벼운 순서로 고른다.**

1. CSS `position: sticky` + `IntersectionObserver`로 클래스 토글만으로 되는가 → GSAP를 로드하지 않는다.
2. 스크롤 위치에 **비례**해 값이 변해야 하는가 (`scrub`), 요소를 스크롤 구간 동안 **고정**해야 하는가 (`pin`), 여러 요소를 **순서대로** 움직여야 하는가 (timeline) → GSAP ScrollTrigger.
3. GSAP를 써도 "어느 섹션이 보이는가" 판단은 IntersectionObserver 쪽에 두고, `section-change` CustomEvent로 지도·차트 코드에 알린다. 두 시스템이 같은 것을 감지하게 만들지 않는다.

**지도 데이터는 양과 인코딩으로 고른다.**

| 상황 | 선택 |
| --- | --- |
| 지점 수백 개 이하, 스타일이 고정, 행정구역 채색(choropleth) | mapbox 네이티브 `addSource` + `addLayer` + 데이터 기반 expression |
| 지점 수천 개 이상, 값에 따라 크기·색이 바뀜, 툴팁에 원본 데이터 노출 | deck.gl `ScatterplotLayer`, `GeoJsonLayer` |
| 출발·도착 흐름, 밀도, 격자 집계, 시간 애니메이션 | deck.gl `ArcLayer`, `HeatmapLayer`, `HexagonLayer` |

deck.gl은 항상 mapbox-gl 인스턴스 위에 `MapboxOverlay`로 얹는다. `new deck.DeckGL()`로 지도를 하나 더 만들지 않는다.

**상태는 위젯 경계로 고른다.**

1. 위젯 하나 안의 값 → 그 위젯 코드의 지역 변수. 공유 객체를 만들지 않는다.
2. 위젯 둘 이상이 같은 값을 읽고 쓴다 → 공유 객체 하나 + `subscribe` 함수.
3. "어느 섹션이 보이는가"는 여전히 `section-change` CustomEvent(scroll.md). 공유 객체로 대체하지 않는다.
4. 게임을 멈출 이유(피드백 화면 등)는 `hkCommon.createPause()`가 모은다. 공유 객체에 따로 두지 않는다.

## 공통 규칙

- **로드 전 확인**: `index.html`에 이미 `<script src>`로 로드돼 있으면 다시 넣지 않는다. 없으면 각 레퍼런스 문서의 태그를 쓴다.
- **로드 위치**: 라이브러리 `<script src>`는 `<script id="hk-common-js">…</script>` 뒤, 프로젝트 스크립트 바로 앞에 둔다. 라이브러리 CSS `<link>`는 프로젝트 스타일 바로 앞에 둔다(프로젝트 스타일이 덮어쓸 수 있게). `async`·`defer`를 붙이지 않는다.
- **버전 고정**: jsDelivr 주소에 정확한 버전(`gsap@3.15.1`)을 적는다. `@latest`, `@3` 같은 범위는 쓰지 않는다. 레퍼런스에 없는 라이브러리의 버전은 설치 시점의 최신 안정판을 확인해 고정한다.
- **전역 빌드 우선**: `<script src>`로 전역(`gsap`, `Swiper`, `mapboxgl`, `deck`)을 쓴다. 전역 빌드가 없는 라이브러리만 `<script type="module">` 안에서 전체 CDN URL(`https://esm.sh/<패키지>@<버전>`, `https://cdn.jsdelivr.net/npm/<패키지>@<버전>/+esm`)로 불러오고, 그 라이브러리를 쓰는 코드도 같은 module 스크립트에 둔다.
- **기능마다 블록으로 감싼다**: 프로젝트 스크립트는 스코프가 하나다. `const map`, `const observer` 같은 이름이 겹치면 스크립트 전체가 SyntaxError로 멈춘다. 기능 하나를 `{ ... }` 블록에 넣고, 공유 상태와 여러 기능이 쓰는 상수만 블록 밖에 둔다.
- **본문은 HTML로**: 슬라이드·챕터 글과 이미지 `alt`는 `<main>`에 직접 쓴다. 스크립트로 그려 넣지 않는다.
- **다시 만들 때는 먼저 정리**: 같은 요소에 인스턴스를 두 번 만들지 않는다. 다시 만들어야 하면 먼저 `map.remove()`, `swiper.destroy()`, `observer.disconnect()`, `ScrollTrigger.getAll().forEach((t) => t.kill())`.
- **매직 넘버는 상수로**: `FLY_DURATION_MS`, `SCRUB_SMOOTHING_SEC`, `MOBILE_BREAKPOINT_PX = 800` 처럼 이름을 붙인다. 브레이크포인트는 800px 하나만 쓴다.
- **화면 높이·색**: GNB 아래 한 화면은 `var(--screen-h)`, GNB 높이는 `var(--gnb-h)`. 화면을 꽉 채우는 sticky 배경은 scroll.md의 `top` 값을 따른다. 라이브러리 UI(화살표, dots) 색은 `var(--font-col-base)`, `var(--bg-base)`에 맞춘다.
- **모션 접근성**: `prefers-reduced-motion: reduce`에서는 GSAP 애니메이션과 mapbox `flyTo`를 즉시 이동(`jumpTo`, `duration: 0`)으로 바꾸고 캐러셀 자동 재생을 끈다.
- **토큰**: mapbox 토큰은 공개 토큰(`pk.`)만, 프로젝트 스크립트의 `MAPBOX_TOKEN` 상수 한 곳에 둔다. 페이지 소스에 그대로 노출되므로 Mapbox 대시보드에서 토큰의 URL 제한을 서비스 주소(`https://www.hankookilbo.com/interactive/*`)로 걸어 둔다.

## 작업 순서

1. 요구를 위 5가지 중 하나로 분류한다. 둘 이상이면 각각 분류한다.
2. 선택표에서 방식을 정하고, 캐러셀·스크롤·지도·상태는 판단 규칙으로 세부 방식을 정한다. 라이브러리 없이 되면 거기서 끝이다.
3. `index.html`을 읽어 로드 여부를 확인한다. 이미 `<script>`로 로드돼 있으면 건너뛰고 필요한 태그만 추가한다.
4. 해당 레퍼런스 문서의 패턴대로 마크업은 `<main>`, CSS는 "프로젝트 스타일", JS는 "프로젝트 스크립트"에 쓴다. 데이터는 프로젝트 스크립트의 상수로 두고, 크면 `index.html` 옆 `.js`·`.json` 파일로 빼 상대 경로(`./data/points.json`)로 읽는다.
5. 아래 체크리스트로 검증한다. `fetch`를 쓰는 페이지는 `file://`이 아니라 로컬 서버로 열어 확인한다.

## 레퍼런스

- [reference/carousel.md](reference/carousel.md) — CSS scroll-snap 패턴, Swiper 태그·설정, 접근성, 모바일 대응, 스타일 오버라이드
- [reference/scroll.md](reference/scroll.md) — IntersectionObserver 패턴, GSAP ScrollTrigger를 `.body-wrapper`에 붙이는 법, pin과 scrub, 모션 축소
- [reference/map.md](reference/map.md) — mapbox-gl 태그·초기화, 스크롤 연동 카메라, 토큰 관리, deck.gl MapboxOverlay와 레이어 선택
- [reference/state.md](reference/state.md) — 공유 객체 + `subscribe` 패턴, 새로고침 유지, `hkCommon.createPause()`

## 완료 체크리스트

- [ ] 선택표와 다른 라이브러리가 `<script>`로 추가되지 않았고, 쓰지 않는 라이브러리 태그가 남아 있지 않다.
- [ ] 모든 CDN 주소에 정확한 버전이 적혀 있다.
- [ ] 라이브러리 `<script src>`가 "프로젝트 스크립트"보다 앞에 있고, `hk-common-*` 블록은 원본 그대로다.
- [ ] GSAP를 썼다면 `ScrollTrigger.defaults({ scroller: ".body-wrapper" })`가 한 번 호출된다.
- [ ] `window.scrollY`, `window.addEventListener("scroll")`을 새로 쓴 곳이 없다.
- [ ] `document.documentElement.dataset.gnb` / `dataset.state`를 쓰는 프로젝트 코드가 없다.
- [ ] 위젯 하나만 쓰는 값은 지역 변수로 남아 있고, 공유 객체는 `window`에 붙어 있지 않다.
- [ ] 아이콘만 있는 버튼(슬라이드 화살표 등)에 `aria-label`이 있다.
- [ ] mapbox 토큰은 `pk.` 공개 토큰이고 `MAPBOX_TOKEN` 한 곳에만 있다.
- [ ] 브라우저에서 열었을 때 콘솔 에러가 없다.
