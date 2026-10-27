/** 초기 로딩 화면 제거 */
export function removeLoader() {
  document.body.classList.remove("loading");
  document.body.classList.add("loaded");
}
