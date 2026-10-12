# 스크롤 인터랙션: IntersectionObserver + GSAP ScrollTrigger

## 0. 가장 먼저 기억할 것

이 스택의 스크롤 컨테이너는 **`.body-wrapper`** 다. 다음은 동작하지 않는다.

```js
window.scrollY;                              // 항상 0
window.addEventListener("scroll", fn);       // 발화하지 않음
document.documentElement.scrollTop;          // 항상 0
```

- `IntersectionObserver`는 `root: null`(뷰포트 기준)로 두어도 정상 동작한다.
- GSAP ScrollTrigger는 기본 `scroller`가 `window`이므로 **반드시 `.body-wrapper`로 바꿔야** 한다.
- `position: sticky`는 `.body-wrapper` 안에서 정상 동작한다.

## 1. 1단계: IntersectionObserver만으로 해결되는 경우

챕터 전환, 배경 교체, 진입 시 클래스 토글은 GSAP 없이 만든다. `position: sticky` 배경 + `100vh` 섹션 + IO가 기본 구조다.

```astro
<!-- src/pages/index.astro 또는 컴포넌트 -->
<main class="scrolly">
  <div class="bg-container">
    {chapters.map((ch, i) => <div class="bg-item" data-index={i} style={`background-image:url(${ch.bg})`} />)}
  </div>
  <div class="content-overlay">
    {chapters.map((ch, i) => (
      <section class="story-section" data-index={i}>
        <div class="story-box"><h2>{ch.title}</h2></div>
      </section>
    ))}
  </div>
</main>

<script>
  // 화면 세로 중앙 10% 구간에 들어올 때만 트리거
  const CENTER_BAND_ROOT_MARGIN = "-45% 0px -45% 0px";
  const bgItems = document.querySelectorAll<HTMLElement>(".bg-item");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = Number(entry.target.getAttribute("data-index"));
        bgItems.forEach((bg, i) => bg.classList.toggle("on", i === index));
        // React 아일랜드(지도, 차트)에 알린다
        window.dispatchEvent(new CustomEvent<number>("section-change", { detail: index }));
      });
    },
    { root: null, rootMargin: CENTER_BAND_ROOT_MARGIN, threshold: 0 },
  );

  document.querySelectorAll(".story-section").forEach((section) => observer.observe(section));
</script>
```

`lib/js/_comm/ioScroll.js`에 `scrollChangeBgByTextBox`, `scrolladdClassToBgByTextBox`가 있으면 그것을 재사용해도 된다. 같은 파일의 `scrollPercentage`는 `window.scrollY`를 쓰므로 이 스택에서는 쓰지 않는다.

## 2. 2단계: GSAP ScrollTrigger가 필요한 경우

다음 중 하나가 필요할 때만 GSAP를 설치한다.

- `scrub`: 스크롤 위치에 비례해 값이 바뀌는 애니메이션 (막대가 자라는 차트, 카운터, 마스크 이동)
- `pin`: 어떤 요소를 스크롤 구간 동안 고정하고 그 사이에 여러 단계를 재생
- timeline: 여러 요소를 순서와 겹침을 조절해 움직임

```bash
npm i gsap
```

### Astro `<script>`에서 쓰는 패턴

```astro
<script>
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";

  gsap.registerPlugin(ScrollTrigger);
  // 이 한 줄이 없으면 아무 트리거도 동작하지 않는다
  ScrollTrigger.defaults({ scroller: ".body-wrapper" });

  const SCRUB_SMOOTHING_SEC = 0.5;
  const PIN_DISTANCE_VH = 300;

  // scrub: 막대 차트가 스크롤에 따라 자란다
  document.querySelectorAll<HTMLElement>(".chart-step").forEach((step) => {
    gsap.fromTo(
      step.querySelector(".bar"),
      { scaleY: 0 },
      {
        scaleY: 1,
        transformOrigin: "bottom",
        ease: "none",
        scrollTrigger: {
          trigger: step,
          start: "top 80%",
          end: "bottom 60%",
          scrub: SCRUB_SMOOTHING_SEC,
        },
      },
    );
  });

  // pin: 한 화면을 고정하고 3단계 타임라인 재생
  const pinTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".pin-section",
      start: "top top",
      end: `+=${PIN_DISTANCE_VH}%`,
      pin: ".pin-target",
      scrub: true,
    },
  });
  pinTimeline
    .to(".pin-step-1", { autoAlpha: 1 })
    .to(".pin-step-1", { autoAlpha: 0 })
    .to(".pin-step-2", { autoAlpha: 1 })
    .to(".pin-step-2", { autoAlpha: 0 })
    .to(".pin-step-3", { autoAlpha: 1 });

  // 로더가 사라지고 이미지가 로드된 뒤 위치를 다시 계산한다
  window.addEventListener("load", () => ScrollTrigger.refresh());
</script>
```

- 스크롤러가 `<body>`가 아니므로 pin은 기본적으로 `pinType: "transform"`으로 동작한다. iOS에서 떨림이 보이면 `pinType: "fixed"`를 시도한다. `.body-wrapper`가 뷰포트를 꽉 채우므로 둘 다 유효하다.
- 위치 계산이 틀어지면 원인은 거의 항상 "트리거 위에 있는 이미지·폰트가 늦게 로드됨"이다. `ScrollTrigger.refresh()`를 `load` 뒤에 한 번 호출한다.
- 디버그는 `markers: true`. 커밋 전 반드시 제거한다.

### React 아일랜드에서 쓰는 패턴

`gsap.context`로 범위를 묶고 정리(cleanup)에서 `revert`한다. 반응형과 모션 축소는 `gsap.matchMedia`로 한 곳에서 처리한다.

```tsx
// src/components/ScrubChart.tsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.defaults({ scroller: ".body-wrapper" });

const MOBILE_BREAKPOINT_PX = 800;
const SCRUB_SMOOTHING_SEC = 0.5;

const ScrubChart = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia(rootRef);

    mm.add(
      {
        isDesktop: `(min-width: ${MOBILE_BREAKPOINT_PX + 1}px)`,
        isMobile: `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { isMobile, reduceMotion } = context.conditions ?? {};
        if (reduceMotion) {
          // 애니메이션 없이 최종 상태만 적용
          gsap.set(".bar", { scaleY: 1 });
          return;
        }
        gsap.fromTo(
          ".bar",
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: "bottom",
            ease: "none",
            stagger: isMobile ? 0 : 0.1,
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 80%",
              end: "bottom 60%",
              scrub: SCRUB_SMOOTHING_SEC,
            },
          },
        );
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <div ref={rootRef} className="scrub-chart">
      <div className="bar" />
      <div className="bar" />
      <div className="bar" />
    </div>
  );
};

export default ScrubChart;
```

Astro에서는 `<ScrubChart client:only="react" />`로 마운트한다. `gsap.matchMedia(rootRef)`에 ref를 넘기면 셀렉터가 그 컴포넌트 안으로 한정된다.

## 3. IO와 GSAP를 함께 쓸 때 역할 분담

| 역할 | 담당 |
| --- | --- |
| 지금 몇 번째 섹션인가 (이산 상태) | IntersectionObserver → `section-change` 이벤트 |
| 그 섹션 안에서 몇 % 진행했는가 (연속 값) | GSAP ScrollTrigger `scrub` |
| 지도·차트 아일랜드에 상태 전달 | `window.addEventListener("section-change", ...)` |

같은 섹션 감지를 IO와 ScrollTrigger `onEnter` 양쪽에 두면 순서가 어긋난다. 하나만 쓴다.

## 4. 함정

- `ScrollTrigger.defaults({ scroller })`를 빼고 개별 트리거마다 `scroller`를 쓰면 하나만 빼먹어도 그 트리거는 죽은 채로 조용히 실패한다. defaults로 한 번만 설정한다.
- Astro `<script>`는 컴포넌트가 여러 번 렌더돼도 1회만 실행된다. 트리거 대상은 `querySelectorAll`로 전부 잡는다.
- `.astro`에서 `import`가 있는 스크립트는 `is:inline`을 붙이지 않는다. Astro가 번들링해야 한다.
- 스크롤 중 `flyTo`나 무거운 DOM 갱신을 `scrub` 콜백(`onUpdate`)에 넣지 않는다. 연속 값은 CSS 변수나 transform만 바꾸고, 무거운 작업은 `section-change`에서 한다.
