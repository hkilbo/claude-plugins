// 한국일보 공통영역(인터랙티브 헤더·추천 카드) 제어. 상태는 <html data-*> 하나로 선언한다 (references/common-area.md).
const root = document.documentElement;
/** 스크롤형에서 내림/올림을 판정하는 최소 이동량(px) */
const SCROLL_DIR_PX = 24;

/** 진행 단계·GNB 를 한 번에 쓴다. 예: setCommon({ state: "credits", gnb: "transparent" }). 값이 null 이면 속성을 지운다 */
export function setCommon(attrs) {
  for (const [k, v] of Object.entries(attrs)) v == null ? delete root.dataset[k] : (root.dataset[k] = v);
}

/** 바이라인(Layout 이 .body-wrapper 끝에 렌더)을 target 안으로 옮긴다. 게임형 크레딧 화면·모바일뷰 떠 있는 화면에서 쓴다 */
export function placeByline(target) {
  const byline = document.querySelector(".byline");
  if (byline && target && byline.parentElement !== target) target.append(byline);
  return byline;
}

/**
 * 스크롤형(FLOW="scroll") 자동 배선. Layout.astro 가 호출한다.
 *  - 맨 위: intro·transparent / 내리면 hidden / 올리면 solid (state=play)
 *  - 크레딧(바이라인) 윗선이 화면 아래 ratio(기본 40%) 선에 닿거나 맨 아래면 credits·transparent — 추천 카드가 뜬다
 *  - credits 동안은 스크롤이 GNB 를 건드리지 않는다. 벗어나면 play 로 돌아간다
 *  - 모바일뷰(data-view="mobile")는 떠 있는 화면(.shell) 안에서 스크롤하므로 기본 scroller 가 .shell 이고, 바이라인도 그 안으로 옮긴다
 * 돌려주는 함수를 부르면 배선을 푼다 (형식을 새로고침 없이 바꿀 때만 필요하다).
 */
export function wireScrollFlow({ scroller, creditsEl, ratio = 0.4 } = {}) {
  const shell = root.dataset.view === "mobile" ? document.querySelector(".shell") : null;
  scroller ??= shell ?? document.querySelector(".body-wrapper");
  creditsEl ??= shell ? placeByline(shell) : document.querySelector(".byline");
  if (!scroller || !creditsEl) return () => {};
  // 방향 판정은 SCROLL_DIR_PX 이상 움직였을 때만 — 트랙패드 관성 꼬리(몇 px)로 GNB 가 숨었다 나타나지 않게
  let last = scroller.scrollTop;
  const onScroll = () => {
    const y = scroller.scrollTop;
    if (Math.abs(y - last) < SCROLL_DIR_PX && y > 8) return;
    if (root.dataset.state !== "credits" && y !== last) {
      setCommon(y <= 8 ? { state: "intro", gnb: "transparent" } : { state: "play", gnb: y > last ? "hidden" : "solid" });
    }
    last = y;
  };
  scroller.addEventListener("scroll", onScroll, { passive: true });
  const atBottom = () => scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
  const io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting || atBottom()) setCommon({ state: "credits", gnb: "transparent" });
      else if (root.dataset.state === "credits") setCommon({ state: "play" });
    },
    { root: scroller, rootMargin: `0px 0px -${Math.round(ratio * 100)}% 0px` },
  );
  io.observe(creditsEl);
  return () => {
    scroller.removeEventListener("scroll", onScroll);
    io.disconnect();
  };
}

/** 게임 중 메뉴(로고 버튼) 열림/닫힘. cb(open) */
export function onMenu(cb) {
  const listener = (e) => cb(e.detail.open);
  document.addEventListener("hk-interactive-menu", listener);
  return () => document.removeEventListener("hk-interactive-menu", listener);
}

/** 추천 카드 노출("shown") / 닫기("dismissed"). cb(state) */
export function onRecommend(cb) {
  const listener = (e) => cb(e.detail.state);
  document.addEventListener("hk-interactive-recommend", listener);
  return () => document.removeEventListener("hk-interactive-recommend", listener);
}

/** 모바일뷰 "화면이 너무 작아요" 조건. _mobile_view.scss 의 미디어 쿼리와 같아야 한다 */
export const TOO_SMALL_QUERY =
  "(min-width: 481px) and (max-width: 1279.98px) and (max-height: 563.98px), (min-width: 1280px) and (max-height: 575.98px)";

/**
 * 게임 일시정지 — **타이머·애니메이션 루프가 있는 게임만** 쓴다. 없으면 부르지 않아도 된다.
 * 멈출 이유가 하나라도 있으면 paused 가 true. 공통영역 사정 두 가지는 자동으로 연결된다:
 *  - "menu"  : 로고 버튼으로 GNB 를 연 동안 (hk-interactive-menu)
 *  - "small" : 모바일뷰에서 "화면이 너무 작아요" 안내가 떠 있는 동안 (_mobile_view.scss 와 같은 조건)
 * 게임 자체 사정은 pause.hold("feedback", true) 처럼 직접 건다.
 *
 *   const pause = createPause();
 *   setInterval(() => { if (pause.paused) return; tick(); }, 100);
 */
export function createPause({ onChange } = {}) {
  const reasons = new Set();
  const pause = {
    hold(reason, on) {
      const before = reasons.size > 0;
      on ? reasons.add(reason) : reasons.delete(reason);
      if (before !== reasons.size > 0) onChange?.(reasons.size > 0);
    },
    get paused() {
      return reasons.size > 0;
    },
    get reasons() {
      return [...reasons];
    },
  };
  onMenu((open) => pause.hold("menu", open));
  const tooSmall = matchMedia(TOO_SMALL_QUERY);
  const syncSmall = () => pause.hold("small", tooSmall.matches && root.dataset.view === "mobile");
  tooSmall.addEventListener("change", syncSmall);
  syncSmall();
  return pause;
}

/**
 * 모바일뷰(VIEW="mobile") + 게임형(FLOW="game") 의 PC·태블릿(폭 481 이상)만 바깥 GNB 가 브라우저 라이트/다크를 따른다.
 * 휴대폰 폭에서는 META.THEME 로 돌아온다. 폭·스킴 분기는 헤더가 아니라 여기(호스트)서 한다. 패턴 F 에서만 호출한다.
 */
export function syncOuterTheme(theme) {
  const wide = matchMedia("(min-width: 481px)"); // 헤더의 interactive-tab 브레이크포인트와 같다
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
  return () => {
    wide.removeEventListener("change", apply);
    scheme.removeEventListener("change", apply);
  };
}
