# 캐러셀: react-slick

## 설치

```bash
npm i react-slick slick-carousel
npm i -D @types/react-slick
```

`package.json`에 `react-slick`, `slick-carousel`, `@types/react-slick`이 모두 있으면 건너뛴다.

## 기본 패턴

CSS는 컴포넌트 파일 맨 위에서 import한다. 화살표는 `<div>`가 아니라 `<button>`으로 만들고 `aria-label`을 준다.

```tsx
// src/components/StepCarousel.tsx
import Slider, { type Settings, type CustomArrowProps } from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const MOBILE_BREAKPOINT_PX = 800;
const SLIDE_SPEED_MS = 500;

type Step = { src: string; alt: string };

const ArrowButton = ({
  direction,
  onClick,
}: CustomArrowProps & { direction: "prev" | "next" }) => {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      className={`carousel-arrow carousel-arrow--${direction}`}
      aria-label={isPrev ? "이전 슬라이드" : "다음 슬라이드"}
      onClick={onClick}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="24" fill="#202020" />
        <path
          d={isPrev ? "M27 14L17 24L27 34" : "M21 14L31 24L21 34"}
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

const StepCarousel = ({ steps }: { steps: Step[] }) => {
  const settings: Settings = {
    dots: true,
    infinite: false,
    speed: SLIDE_SPEED_MS,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: <ArrowButton direction="prev" />,
    nextArrow: <ArrowButton direction="next" />,
    lazyLoad: "ondemand",
    // breakpoint 이하 너비에서 적용된다 (mobileFirst: false 기본값)
    responsive: [{ breakpoint: MOBILE_BREAKPOINT_PX, settings: { arrows: false } }],
  };

  return (
    <Slider {...settings} className="step-carousel">
      {steps.map((step) => (
        <div className="step-carousel__slide" key={step.src}>
          <img src={step.src} alt={step.alt} loading="lazy" decoding="async" />
        </div>
      ))}
    </Slider>
  );
};

export default StepCarousel;
```

`responsive` 옵션이 있으므로 `window.innerWidth`를 읽는 `isMobile` state를 따로 만들지 않는다.

## Astro에서 마운트

```astro
---
import StepCarousel from "../components/StepCarousel.tsx";
import { steps } from "../data/data";
---
<!-- 첫 화면 밖이면 client:visible, 첫 화면 안이면 client:load -->
<StepCarousel client:visible steps={steps} />
```

react-slick 자체는 SSR이 가능하므로 `client:only`가 필수는 아니다. 다만 컴포넌트가 `window`를 직접 읽는다면 `client:only="react"`로 바꾼다.

## 모바일에서 PC와 다른 슬라이드를 보여줄 때

이미지 세트 자체가 달라지면 `responsive`로는 해결되지 않는다. 이 경우에만 `useEffect`에서 `matchMedia`로 판별한다.

```tsx
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
  const onChange = () => setIsMobile(media.matches);
  onChange();
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}, []);

const steps = isMobile ? mobileSteps : pcSteps;
```

## 스타일 오버라이드

slick 클래스는 컴포넌트 밖에서 렌더되므로 `.scss`에서 `:global()`로 잡는다.

```scss
// src/styles/step-carousel.scss
@import "variables";
@import "utils";

$carousel-arrow-offset: 60px;

.step-carousel {
  position: relative;

  :global(.slick-list),
  :global(.slick-track) {
    height: 100%;
  }

  :global(.slick-dots) {
    bottom: -32px;
    li button::before {
      color: #fff;
      opacity: 0.4;
    }
    li.slick-active button::before {
      opacity: 1;
    }
  }
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  z-index: 1;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  background: none;
  transform: translateY(-50%);
  cursor: pointer;

  &--prev { left: $carousel-arrow-offset; }
  &--next { right: $carousel-arrow-offset; }

  @include mobile {
    display: none;
  }
}
```

## 자주 하는 실수

- `slick-theme.css`를 빼먹으면 dots가 렌더되지 않는다.
- 슬라이드 자식에 `key`로 `index`를 쓰면 데이터가 바뀔 때 이미지가 섞인다. 고유 값(`src`, `id`)을 쓴다.
- 모달 안에서 슬라이더를 열면 초기 너비가 0으로 계산될 수 있다. 모달이 열린 뒤 마운트되도록 조건부 렌더(`{isOpen && <Slider />}`)로 처리한다.
- `infinite: true`에 슬라이드가 `slidesToShow`보다 적으면 복제 슬라이드가 생긴다. 슬라이드 수가 적으면 `infinite: false`.
