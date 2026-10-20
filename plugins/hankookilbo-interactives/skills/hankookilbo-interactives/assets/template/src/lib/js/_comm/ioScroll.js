const options = {
  root: null,
  rootMargin: "0px 0px 0px 0px",
  threshold: 0.5,
};

/**
 * 텍스트 박스가 보이면 같은 data-id를 가진 배경 자식에 activeClassName 부여
 *
 * <section class="bg-con">
 *   <div class="bg-con-inner" data-id="a"></div>
 *   <div class="bg-con-inner" data-id="b"></div>
 * </section>
 * <section>
 *   <div class="para-con" data-id="a">…</div>
 *   <div class="para-con" data-id="b">…</div>
 * </section>
 */
export function scrollChangeBgByTextBox(
  elements,
  bgContainer,
  activeClassName,
) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = bgContainer.querySelector(
        `[data-id="${entry.target.dataset.id}"]`,
      );
      if (!target) return;
      target.classList.toggle(activeClassName, entry.isIntersecting);
    });
  }, options);
  elements.forEach((el) => io.observe(el));
}

/**
 * 텍스트 박스가 보이면 그 박스의 data-class-name을 배경 컨테이너에 부여
 *
 * <section class="bg-con"></section>
 * <div class="para-con" data-class-name="up">1</div>
 * <div class="para-con" data-class-name="down">2</div>
 */
export function scrolladdClassToBgByTextBox(elements, bgContainer) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      bgContainer.classList.toggle(
        entry.target.dataset.className,
        entry.isIntersecting,
      );
    });
  }, options);
  elements.forEach((el) => io.observe(el));
}

/**
 * 컨테이너 기준 스크롤 진행률 (0 ~ 1). 스크롤 컨테이너는 .body-wrapper.
 *
 * const wrapper = document.querySelector(".body-wrapper");
 * wrapper.addEventListener("scroll", () => {
 *   const p = scrollPercentage(section);
 * });
 */
export function scrollPercentage(containerElement) {
  const wrapper = document.querySelector(".body-wrapper");
  const start = containerElement.offsetTop;
  const height = containerElement.offsetHeight;
  const percentage =
    (wrapper.scrollTop - start) / (height - wrapper.clientHeight);
  return Math.min(1, Math.max(0, percentage));
}
