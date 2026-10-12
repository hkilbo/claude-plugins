---
name: hankookilbo-interactives-libs
description: Library selection rules and ready-to-use patterns for Hankook Ilbo interactive news pages (Astro static build + React islands, scroll container ".body-wrapper"). Carousel/slider → react-slick. Scroll interaction/scrollytelling → IntersectionObserver first, GSAP ScrollTrigger when scrub/pin/timeline is needed. Map → mapbox-gl. Data on a map → deck.gl MapboxOverlay. Shared state across React islands → zustand. Use when building, reviewing, or asked which library to use for 인터랙티브, 스크롤리텔링, 캐러셀, 슬라이더, 지도, 데이터 시각화, 퀴즈, 계산기, 상태 공유 features.
---

# 한국일보 인터랙티브 라이브러리 규칙

인터랙티브 페이지에서 반복되는 5가지 요구(캐러셀, 스크롤 인터랙션, 지도, 지도 위 데이터, 아일랜드 간 상태 공유)에
**어떤 라이브러리를 쓰고 어떻게 붙이는지** 정한 규칙이다. 팀원 누가 만들어도 같은 스택이 나오게 하는 것이 목적이다.

## 전제 스택

- Astro `output: "static"` + React 아일랜드(`.tsx`). Vue, Svelte 금지.
- 스크롤 컨테이너는 `window`가 아니라 **`.body-wrapper`** 다. `html, body`는 `overflow: hidden`.
- 정적 파일 경로는 항상 상대 경로 `./img/...`, `./data/...`.
- 프로젝트에 `INTERACTIVE_TEMPLATE.md`가 있으면 그 문서의 필수 요건과 "규칙과 함정"을 먼저 따른다. 이 스킬은 그 위에 라이브러리 규칙을 얹는다.

## 라이브러리 선택표

| 요구 | 쓰는 것 | 쓰지 않는 것 (대체 제안 금지) |
| --- | --- | --- |
| 캐러셀, 슬라이더, 이미지 스텝 가이드 | `react-slick` + `slick-carousel` CSS | swiper, embla, keen-slider, 직접 구현 |
| 스크롤 진입 시 클래스 토글, 챕터 전환, 배경 교체 | `IntersectionObserver` (직접 작성 또는 `lib/js/_comm/ioScroll.js`) | AOS, scrollama, 직접 scroll 이벤트 계산 |
| 스크롤 진행률에 묶인 애니메이션, pin, 타임라인 | `gsap` + `ScrollTrigger` (`scroller: ".body-wrapper"`) | framer-motion, locomotive-scroll, lenis, anime.js |
| 지도 표시, 카메라 이동, 마커, 단순 GeoJSON | `mapbox-gl` | leaflet, google maps, openlayers, react-map-gl |
| 지도 위 대량 데이터, 데이터 기반 시각 인코딩, 히트맵, 아크 | `@deck.gl/mapbox` `MapboxOverlay` + `@deck.gl/layers` | kepler.gl, mapbox 네이티브 레이어로 수천 개 렌더, d3 SVG 오버레이 |
| React 아일랜드 둘 이상이 같은 상태를 공유 (퀴즈 진행, 필터, 계산기 입력) | `zustand` (`src/stores/*Store.ts`) | redux, jotai, recoil, nanostores, `window` 전역 변수, 아일랜드 간 Context(불가능) |

사용자가 위 표 밖의 라이브러리를 명시적으로 요구하면 표의 선택지를 한 줄로 제안하고, 사용자가 다시 확인하면 요구대로 진행한다.

## 판단 규칙

**스크롤 인터랙션은 가벼운 순서로 고른다.**

1. CSS `position: sticky` + `IntersectionObserver`로 클래스 토글만으로 되는가 → GSAP 설치하지 않는다.
2. 스크롤 위치에 **비례**해 값이 변해야 하는가 (`scrub`), 요소를 스크롤 구간 동안 **고정**해야 하는가 (`pin`), 여러 요소를 **순서대로** 움직여야 하는가 (timeline) → GSAP ScrollTrigger.
3. GSAP를 써도 "어느 섹션이 보이는가" 판단은 IntersectionObserver 쪽에 두고, `section-change` CustomEvent로 React 아일랜드에 알린다. 두 시스템이 같은 것을 감지하게 만들지 않는다.

**지도 데이터는 양과 인코딩으로 고른다.**

| 상황 | 선택 |
| --- | --- |
| 지점 수백 개 이하, 스타일이 고정, 행정구역 채색(choropleth) | mapbox 네이티브 `addSource` + `addLayer` + 데이터 기반 expression |
| 지점 수천 개 이상, 값에 따라 크기·색이 바뀜, 툴팁에 원본 데이터 노출 | deck.gl `ScatterplotLayer`, `GeoJsonLayer` |
| 출발·도착 흐름, 밀도, 격자 집계, 시간 애니메이션 | deck.gl `ArcLayer`, `HeatmapLayer`, `HexagonLayer` |

deck.gl은 항상 mapbox-gl 인스턴스 위에 `MapboxOverlay`로 얹는다. `@deck.gl/react`의 `<DeckGL>`과 `react-map-gl`을 함께 써서 래퍼를 두 겹 만들지 않는다.

**상태는 아일랜드 경계로 고른다.**

1. 아일랜드 하나 안의 값 → `useState`. 스토어를 만들지 않는다.
2. 아일랜드 둘 이상이 같은 값을 읽고 쓴다 → zustand 스토어 하나. 아일랜드는 각각 별개의 React 루트라 Context가 넘어가지 않는다.
3. "어느 섹션이 보이는가"는 여전히 `section-change` CustomEvent(scroll.md). 스토어로 대체하지 않는다.

## 공통 규칙

- **설치 전 확인**: `package.json`에 이미 있으면 재설치하지 않는다. 없으면 각 레퍼런스 문서의 설치 명령을 쓴다.
- **`window`·DOM에 닿는 라이브러리는 React 아일랜드에서** `useEffect` 안에서만 초기화하고, Astro에서는 `client:only="react"`로 마운트한다. mapbox-gl, deck.gl은 import 시점에 `window`를 읽으므로 `client:only` 필수.
- **정리(cleanup) 필수**: `useEffect` 반환 함수에서 `map.remove()`, `ctx.revert()`, `observer.disconnect()`, `removeEventListener`를 호출한다.
- **매직 넘버는 상수로**: `FLY_DURATION_MS`, `SCRUB_SMOOTHING_SEC`, `MOBILE_BREAKPOINT_PX = 800` 처럼 이름을 붙인다. 브레이크포인트는 템플릿의 `mobile` 믹스인과 같은 800px 하나만 쓴다.
- **모션 접근성**: `prefers-reduced-motion: reduce`에서는 GSAP 애니메이션과 mapbox `flyTo`를 즉시 이동(`jumpTo`, `duration: 0`)으로 바꾼다.
- **비밀값**: mapbox 토큰은 `.env`의 `PUBLIC_MAPBOX_TOKEN`으로 읽는다. 정적 빌드라 `dist`에 노출되므로 Mapbox 대시보드에서 토큰의 URL 제한을 `https://interactive.hankookilbo.com/*`로 걸어 둔다.
- **JSX 텍스트**: React 아일랜드에서 인접한 표현식을 나란히 쓰지 않는다 (`{a} / {b}` ✕ → `{`${a} / ${b}`}` ○). `astro-compress`가 SSR 텍스트 구분 주석 `<!-- -->`을 지워 hydration 오류 #418이 난다.
- **CSS import 위치**: 라이브러리 CSS(`slick.css`, `mapbox-gl.css`)는 그 라이브러리를 쓰는 `.tsx` 파일 맨 위에서 import한다. `style.sass`에 섞지 않는다.

## 작업 순서

1. 요구를 위 5가지 중 하나로 분류한다. 둘 이상이면 각각 분류한다.
2. 선택표에서 라이브러리를 정하고, 스크롤·지도는 판단 규칙으로 세부 방식을 정한다.
3. `package.json`을 읽어 설치 여부를 확인하고 필요한 것만 설치한다.
4. 해당 레퍼런스 문서의 패턴을 기준으로 컴포넌트를 작성한다. 데이터는 `src/data/*.ts` 또는 `public/data/*.json`에 둔다.
5. 아래 체크리스트로 검증하고 `npm run build`가 통과하는지 확인한다.

## 레퍼런스

- [reference/carousel.md](reference/carousel.md) — react-slick 설정, 커스텀 화살표, 모바일 대응, 스타일 오버라이드
- [reference/scroll.md](reference/scroll.md) — IntersectionObserver 패턴, GSAP ScrollTrigger를 `.body-wrapper`에 붙이는 법, pin과 scrub, React 아일랜드에서의 정리
- [reference/map.md](reference/map.md) — mapbox-gl 초기화, 스크롤 연동 카메라, 토큰 관리, deck.gl MapboxOverlay와 레이어 선택
- [reference/state.md](reference/state.md) — zustand 스토어 위치·이름, 아일랜드 간 공유 패턴, Astro 스크립트에서 `getState()`, `persist`

## 완료 체크리스트

- [ ] 선택표와 다른 라이브러리가 `package.json`에 추가되지 않았다.
- [ ] GSAP를 썼다면 `ScrollTrigger.defaults({ scroller: ".body-wrapper" })`가 한 번 호출된다.
- [ ] `window.scrollY`, `window.addEventListener("scroll")`을 새로 쓴 곳이 없다.
- [ ] mapbox-gl, deck.gl 컴포넌트는 `client:only="react"`로 마운트된다.
- [ ] zustand 스토어는 `src/stores/`에 있고, 아일랜드 하나만 쓰는 값은 `useState`로 남아 있다.
- [ ] 모든 `useEffect`에 정리 함수가 있다.
- [ ] 아이콘만 있는 버튼(슬라이드 화살표 등)에 `aria-label`이 있다.
- [ ] `.env`가 커밋되지 않고, 토큰은 `import.meta.env.PUBLIC_MAPBOX_TOKEN`으로만 읽는다.
- [ ] `npm run build` 후 `dist/index.html`이 생성되고 콘솔 에러가 없다.
