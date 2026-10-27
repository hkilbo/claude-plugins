# 구 프로젝트 · 레거시 — 새 프로젝트에는 해당 없음

> `hkUtilMoreInteractive`(구 더보기 위젯), `ArticleBar`(자체 헤더), 임베드 v1을 쓰는 **기존 프로젝트를 유지보수할 때만** 읽는다. 새 프로젝트는 읽지 않는다.

## 임베드 v1 → v2

| | v1 (`…/components/interactive-embed/v1/`) | v2 (`…/v2/`, 현재) |
| --- | --- | --- |
| GNB 숨김/바탕 | 헤더가 `data-scroll-container=".body-wrapper"`의 스크롤 방향을 직접 읽어 결정 | 호스트가 `<html data-gnb>`로 선언. 스크롤형은 `hkCommon.wireScrollFlow()` |
| 추천 카드 노출 | 본문 끝 sentinel + 첫 스크롤 이벤트 | `<html data-state="credits">` |
| 테마 | `html.dark` 클래스만 | `data-theme` 우선, `html.dark`는 호환 |
| 게임형 | 불가 (스크롤이 없으면 카드가 영영 안 뜸) | `data-gnb="menu"` + 로고 버튼, `hk-interactive-menu` 이벤트 |

- v1 프로젝트를 v2로 올리려면: `Layout.astro` 임베드 URL `v1` → `v2`, `data-scroll-container` 삭제, `<html>`에 5속성 선언, `META.ts`에 `FLOW`·`VIEW`·`THEME`, `hkCommon.js` 복사 + `wireScrollFlow()` 호출. 템플릿 원문은 `assets/template/`.
- v1 별칭은 운영 CDN에 그대로 남아 있다. 기존 기사는 손대지 않아도 동작한다.

## 구 더보기 위젯 `hkUtilMoreInteractive.min.js`

`interactive-embed.js`가 대체했다. 구 프로젝트의 `_byline.scss` 끝에 있던 `.next-articles.globalVariable` 테마 오버라이드는 `assets/legacy/_legacy-next-articles.scss`로 뺐다. 새 프로젝트에는 넣지 않는다. 구 프로젝트에서도 위젯을 떼면 같이 지운다.

## 자체 헤더 `article_bar.astro` / `ArticleBar`

인터랙티브 헤더 웹컴포넌트가 대체했다. 남아 있으면 헤더가 두 개가 된다. `self_check.js`가 `article-bar`를 발견하면 fail.

## 개편 전 통계

GTM `GTM-59599H7`, UA `UA-53476308-*`, GA4 `G-ZPZ8BHZPSJ`·`G-BZHTEE2B8L`, `hkFunc.js`(`Kakao.Link` v1 API 포함). 전부 금지. 현재는 GA4 `G-HR08PM6YWZ` 하나 + `hkAnalTag_hub.js`(jQuery 뒤).
