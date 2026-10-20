// 한국일보 공통영역(인터랙티브 헤더·추천 카드) 제어. 상태는 <html data-*> 하나로 선언한다 (템플릿 0-1장).
const root = document.documentElement;

/** 진행 단계·GNB 를 한 번에 쓴다. 예: setCommon({ state: "credits", gnb: "transparent" }). 값이 null 이면 속성을 지운다 */
export function setCommon(attrs) {
  for (const [k, v] of Object.entries(attrs)) v == null ? delete root.dataset[k] : (root.dataset[k] = v);
}

/**
 * 스크롤형(FLOW="scroll") 자동 배선. Layout.astro 가 호출한다.
 *  - 맨 위: intro·transparent / 내리면 hidden / 올리면 solid (state=play)
 *  - 크레딧(바이라인) 윗선이 화면 아래 ratio(기본 40%) 선에 닿거나 맨 아래면 credits·transparent — 추천 카드가 뜬다
 *  - credits 동안은 스크롤이 GNB 를 건드리지 않는다. 벗어나면 play 로 돌아간다
 */
export function wireScrollFlow({
  scroller = document.querySelector(".body-wrapper"),
  creditsEl = document.querySelector(".byline"),
  ratio = 0.4,
} = {}) {
  if (!scroller || !creditsEl) return;
  let last = 0;
  scroller.addEventListener(
    "scroll",
    () => {
      const y = scroller.scrollTop;
      if (root.dataset.state !== "credits" && y !== last) {
        setCommon(y <= 8 ? { state: "intro", gnb: "transparent" } : { state: "play", gnb: y > last ? "hidden" : "solid" });
      }
      last = y;
    },
    { passive: true },
  );
  const atBottom = () => scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
  new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting || atBottom()) setCommon({ state: "credits", gnb: "transparent" });
      else if (root.dataset.state === "credits") setCommon({ state: "play" });
    },
    { root: scroller, rootMargin: `0px 0px -${Math.round(ratio * 100)}% 0px` },
  ).observe(creditsEl);
}

/** 게임 중 메뉴(로고 버튼) 열림/닫힘. open 이면 시계를 멈춘다. 시계가 없는 게임은 안 붙여도 된다 */
export function onMenu(cb) {
  document.addEventListener("hk-interactive-menu", (e) => cb(e.detail.open));
}

/** 추천 카드 노출("shown") / 닫기("dismissed") */
export function onRecommend(cb) {
  document.addEventListener("hk-interactive-recommend", (e) => cb(e.detail.state));
}

/**
 * 모바일뷰(VIEW="mobile") + 게임형(FLOW="game") 의 PC·태블릿(폭 690 이상)만 바깥 GNB 가 브라우저 라이트/다크를 따른다.
 * 휴대폰 폭에서는 META.THEME 로 돌아온다. 폭·스킴 분기는 헤더가 아니라 여기(호스트)서 한다. 패턴 F 에서만 호출한다.
 */
export function syncOuterTheme(theme) {
  const wide = matchMedia("(min-width: 690px)");
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const t = wide.matches ? (scheme.matches ? "dark" : "light") : theme;
    setCommon({ theme: t });
    root.classList.toggle("dark", t === "dark");
    root.style.setProperty("--hk-gnb-solid-bg", scheme.matches ? "#2a2a2a" : "#eee");
  };
  wide.addEventListener("change", apply);
  scheme.addEventListener("change", apply);
  apply();
}
