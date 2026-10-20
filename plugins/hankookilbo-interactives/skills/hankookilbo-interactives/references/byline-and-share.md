# 바이라인 · 공유 4종

> 바이라인(크레딧 블록)이나 공유 버튼을 고칠 때 읽는다. 코드: `assets/template/src/components/Astro/byline.astro`, `ShareLinks.astro`, `assets/template/src/styles/_byline.scss`.

## 바이라인 (콘텐츠 크레딧)

`src/components/Astro/byline.astro`를 `Layout.astro`의 `<slot />` **뒤**에 렌더한다. **이 콘텐츠의 크레딧 블록**이며
페이지의 맨 마지막 요소다.

- `HTML_TITLE`, `POST_DATE`
- `BYLINE_MEMBERS` 제작진 목록
- 공유 4종(페이스북, X, 카카오톡, URL 복사)을 제작진 아래, 저작권 문구 위에 넣는다 — `ShareLinks.astro`. 상단 인터랙티브
  헤더의 공유와 똑같이 동작한다 — 현재 페이지 주소, `<head>`의 `og:title`·`og:description`·`kakao_og_image` 메타를 읽는다. 카카오는 SDK v2 `Kakao.Share`만 쓴다 (`Kakao.Link`는 v1 — 금지).
- 관련 기사 카드는 넣지 않는다 (2026-09-28 결정). `interactive-embed.js`의 하단 추천 카드가 맡는다.
- 맨 끝에 저작권 문구 `세상을 보는 균형, 한국일보 Copyright © Hankookilbo`를 넣는다 (`<p class="copy">`). 문구를 바꾸지 않는다.
  회사 공통 푸터를 쓰지 않으므로 페이지의 저작권 표기는 이 한 줄뿐이다.


구조(`byline.astro`): `.byline > .wrapper` 안에 `.logo .title`(HTML_TITLE) → `.post-date`(Posted by POST_DATE) → `dl`(부서/제작진 × BYLINE_MEMBERS) → `<ShareLinks class="share-tools" />` → `p.copy`(저작권). 관련 기사 카드는 넣지 않는다 — 추천은 공통영역 카드가 맡는다(`common-area.md`).

스타일 `_byline.scss`: `min-height: 100lvh`, 가운데 정렬, `@include byline-font`(14px, `$fontColBase`). 공유 아이콘은 `iconFont.css`의 `icon-hk-sns-*` 클래스(40px). 모바일은 여백만 줄인다. 구 "더보기 위젯" 오버라이드는 `legacy.md`로 뺐다.

## 공유 4종 (`ShareLinks.astro`)

바이라인의 공유 4종(페이스북, X, 카카오톡, URL 복사). **상단 인터랙티브 헤더(`header.js`)의 공유와 똑같이 동작한다** — 어느 쪽을 눌러도 같은 주소·같은 카드가 나간다.

| 버튼 | 동작 |
| --- | --- |
| 페이스북 | `facebook.com/sharer/sharer.php?u=<현재 주소>` 새 창. 카드 내용은 페이스북이 그 주소의 `og:*` 메타를 읽어 만든다 |
| X | `twitter.com/intent/tweet?text=<문서 제목> <현재 주소>` 새 창 |
| 카카오톡 | SDK v2 `Kakao.Share.sendDefault` — 제목 `og:title`, 설명 `og:description`, 이미지 `kakao_og_image`, 링크 현재 주소, "자세히 보기" 버튼. 앱 웹뷰에서는 `KAKAO_SHARE` 메시지로 앱에 넘긴다 |
| URL 복사 | `location.href` 전체를 복사하고 "주소가 복사되었습니다." 알림 (실패 시 "복사 실패!") |

현재 주소 = `location.origin + location.pathname` (쿼리·해시 제외). 스테이징에서 누르면 스테이징 주소, 운영에서 누르면 운영 주소가 나간다 — 헤더와 같다.
로컬(`localhost`)에서 누르면 localhost 주소가 나가므로 페이스북·X·카카오가 카드 내용을 읽지 못한다 — 로컬에서는 버튼 동작만 확인한다.
**카카오는 SDK v2 `Kakao.Share`를 쓴다** — `hkFunc.js`의 `Kakao.Link`(v1)는 v2에서 없어서 호출하면 오류다. `hkFunc.js`를 넣지 않는 이유다.


동작 원리(`ShareLinks.astro`의 `<script is:inline>`): 값은 빌드 때가 아니라 누를 때 읽는다. `og:title`·`og:description`·`kakao_og_image` 메타 → 카카오 `Kakao.Share.sendDefault`(feed, "자세히 보기" 버튼). 앱 웹뷰(`window.ReactNativeWebView`)에서는 `KAKAO_SHARE` 메시지로 앱에 넘긴다. `Kakao.Share`는 `init` 뒤에 생기므로 존재 확인 전에 `Kakao.init(앱키)`를 먼저 한다.

## 자주 나는 문제

- 공유 카드가 비어 있다 → `<head>`의 `og:title`, `og:description`, `og:image`, `kakao_og_image` 중 하나가 비었다. `META.ts`를 채운다.
- 카카오 공유가 오류 → `Kakao.Link`(v1 API) 호출이나 v1 SDK(`developers.kakao.com/sdk/js/kakao.min.js`) 로드. 둘 다 금지(`self_check.js`가 검사).
- 아이콘이 빈 네모 → `iconFont.css`를 CDN 주소로 링크한 것. `./addon/icon_font/iconFont.css` 상대 경로로.
