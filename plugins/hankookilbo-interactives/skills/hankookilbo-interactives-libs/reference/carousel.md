# 캐러셀: CSS scroll-snap → Swiper

가벼운 순서로 고른다.

| 상황 | 선택 |
| --- | --- |
| 옆으로 넘기는 슬라이드 줄, 이전/다음 버튼 | CSS `scroll-snap`. 라이브러리 없음 |
| 자동 재생, 무한 반복, 페이지네이션(dots), 썸네일 연동 중 하나라도 필요 | Swiper |

두 방식 모두 슬라이드는 `<main>`에 HTML로 직접 쓴다. 화살표는 `<div>`가 아니라 `<button>`으로 만들고 `aria-label`을 준다.

## 1. CSS scroll-snap

`<ul>`은 템플릿이 `list-style`을 지우므로 `role="list"`를 주고, 키보드로 넘길 수 있게 `tabindex="0"`을 준다.

```html
<div class="snap-carousel">
  <ul class="snap-carousel__track" role="list" tabindex="0" aria-label="이용 방법 3단계">
    <li><img src="./img/step1.jpg" alt="1단계 설명" loading="lazy" decoding="async" /></li>
    <li><img src="./img/step2.jpg" alt="2단계 설명" loading="lazy" decoding="async" /></li>
    <li><img src="./img/step3.jpg" alt="3단계 설명" loading="lazy" decoding="async" /></li>
  </ul>
  <button type="button" class="snap-carousel__arrow" data-dir="-1" aria-label="이전 슬라이드">‹</button>
  <button type="button" class="snap-carousel__arrow" data-dir="1" aria-label="다음 슬라이드">›</button>
</div>
```

```css
.snap-carousel{position:relative}
.snap-carousel__track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none}
.snap-carousel__track::-webkit-scrollbar{display:none}
.snap-carousel__track>li{flex:0 0 100%;scroll-snap-align:center}
.snap-carousel__track img{display:block;width:100%}
.snap-carousel__arrow{position:absolute;top:50%;translate:0 -50%;width:48px;height:48px;border:0;border-radius:50%;background:var(--bg-base);color:var(--font-col-base)}
.snap-carousel__arrow[data-dir="-1"]{left:16px}
.snap-carousel__arrow[data-dir="1"]{right:16px}
/* 모션 축소 설정이면 버튼을 눌러도 즉시 이동한다 */
@media (prefers-reduced-motion:no-preference){.snap-carousel__track{scroll-behavior:smooth}}
/* 모바일은 손으로 넘긴다 */
@media (max-width:800px){.snap-carousel__arrow{display:none}}
```

```js
document.querySelectorAll(".snap-carousel").forEach((carousel) => {
  const track = carousel.querySelector(".snap-carousel__track");
  carousel.addEventListener("click", (e) => {
    const arrow = e.target.closest(".snap-carousel__arrow");
    if (arrow) track.scrollBy({ left: Number(arrow.dataset.dir) * track.clientWidth });
  });
});
```

## 2. Swiper

CSS `<link>`는 프로젝트 스타일 바로 앞, `<script src>`는 프로젝트 스크립트 바로 앞에 둔다. 전역 `Swiper`가 생긴다. 이미 로드돼 있으면 건너뛴다.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@14.4.0/swiper-bundle.min.css" />

<script src="https://cdn.jsdelivr.net/npm/swiper@14.4.0/swiper-bundle.min.js"></script>
```

```html
<div class="swiper step-carousel">
  <div class="swiper-wrapper">
    <div class="swiper-slide"><img src="./img/step1.jpg" alt="1단계 설명" loading="lazy" decoding="async" /></div>
    <div class="swiper-slide"><img src="./img/step2.jpg" alt="2단계 설명" loading="lazy" decoding="async" /></div>
    <div class="swiper-slide"><img src="./img/step3.jpg" alt="3단계 설명" loading="lazy" decoding="async" /></div>
  </div>
  <div class="swiper-pagination"></div>
  <button type="button" class="swiper-button-prev"></button>
  <button type="button" class="swiper-button-next"></button>
</div>
```

```js
{
  const SLIDE_SPEED_MS = 500;
  const AUTOPLAY_DELAY_MS = 4000;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const swiper = new Swiper(".step-carousel", {
    speed: reduceMotion ? 0 : SLIDE_SPEED_MS,
    loop: false,
    keyboard: { enabled: true },
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { prevEl: ".swiper-button-prev", nextEl: ".swiper-button-next" },
    // 화살표·dots 의 aria-label 을 Swiper 가 붙인다
    a11y: {
      prevSlideMessage: "이전 슬라이드",
      nextSlideMessage: "다음 슬라이드",
      paginationBulletMessage: "{{index}}번째 슬라이드로 이동",
    },
    // 자동 재생이 필요할 때만. 모션 축소 설정이면 끈다
    autoplay: reduceMotion ? false : { delay: AUTOPLAY_DELAY_MS, pauseOnMouseEnter: true },
  });
}
```

- 자동 재생을 켜면 정지 버튼을 함께 둔다: `swiper.autoplay.stop()` / `swiper.autoplay.start()`.
- 너비에 따라 설정이 달라지면 Swiper `breakpoints` 옵션(최소 너비 기준)을 쓴다. `window.innerWidth`를 읽는 `isMobile` 변수를 따로 만들지 않는다.

### 스타일 오버라이드

색은 Swiper의 CSS 변수로, 나머지는 "프로젝트 스타일"에서 클래스로 덮어쓴다.

```css
.step-carousel{--swiper-theme-color:var(--font-col-base)}
@media (max-width:800px){
  .step-carousel .swiper-button-prev,.step-carousel .swiper-button-next{display:none}
}
```

## 모바일에서 PC와 다른 이미지를 보여줄 때

스크립트 없이 `<picture>`로 처리한다.

```html
<picture>
  <source media="(max-width:800px)" srcset="./img/step1_m.jpg" />
  <img src="./img/step1.jpg" alt="1단계 설명" loading="lazy" decoding="async" />
</picture>
```

## 자주 하는 실수

- Swiper CSS `<link>`를 빼먹으면 슬라이드가 세로로 쌓인다.
- Swiper `<script src>`가 프로젝트 스크립트보다 뒤에 있으면 `Swiper is not defined`.
- 모달 안에서 캐러셀을 열면 초기 너비가 0으로 계산될 수 있다. 모달이 열린 뒤 `new Swiper()`를 부르거나, 열 때 `swiper.update()`를 부른다.
- `loop: true`에 슬라이드가 적으면 복제 슬라이드가 모자라 넘김이 어긋난다. 슬라이드 수가 적으면 `loop: false`.
- 슬라이드를 스크립트로 그려 넣으면 이미지 `alt`와 본문이 검색·공유 미리보기에서 빠진다.
