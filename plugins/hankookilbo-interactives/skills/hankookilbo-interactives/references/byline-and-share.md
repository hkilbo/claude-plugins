# 바이라인 · 공유 3종

> 바이라인(크레딧 블록)이나 공유 버튼을 고칠 때 읽는다. 코드는 모두 `assets/template/index.html`에 있다 — 내용은 `<div class="byline">`, 스타일은 `hk-common-css` 블록의 `.byline …` 규칙, 공유 동작은 `hk-common-js` 블록의 `[data-share]` 클릭 처리.

## 바이라인 (콘텐츠 크레딧)

`.byline`은 `.body-wrapper` 안, `<main>` **뒤**에 있다. **이 콘텐츠의 크레딧 블록**이며 페이지의 맨 마지막 요소다.
`data-credits="end"`면 공통 블록이 숨김 자리(`.byline-holder`)로 옮겨 두고, `hkCommon.showCredits(target)`이 마지막 화면으로 옮긴다 (`common-area.md`).

안에 있는 것, 위에서부터:

| 요소 | 고치나 | 내용 |
| --- | --- | --- |
| `.title` | ○ | 제목. `<title>`과 같아야 한다 (`self_check.js`가 검사) |
| `.post-date` | ○ | `Posted by` + 게시일 |
| `<dl>` 줄 | ○ | 역할(`<dt>`)과 이름(`<dd>`). 줄을 필요한 만큼 늘리거나 줄인다 |
| `<ul class="share-tools">` | ✕ | 공유 3종(페이스북, X, URL 복사). 버튼의 `data-share` 값이 동작을 정한다. 원본과 다르면 `self_check.js`가 경고한다 |
| `<p class="copy">` | ✕ | 저작권 문구 두 줄 — `세상을 보는 균형, 한국일보` / `Copyright © The Hankook-Ilbo All rights reserved` |

- 공유 3종은 상단 인터랙티브 헤더의 공유와 똑같이 동작한다 — 현재 페이지 주소를 읽으므로 어느 쪽을 눌러도 같은 주소·같은 카드가 나간다. **카카오톡 공유는 바이라인에 넣지 않는다** (2026-11-25 결정) — 헤더의 공유 버튼이 맡는다. 카카오 SDK v2는 헤더가 쓰므로 `<head>`의 로드는 유지한다.
- 관련 기사 카드는 넣지 않는다 (2026-09-28 결정). `interactive-embed.js`의 하단 추천 카드가 맡는다 (`common-area.md`).
- 저작권 문구를 바꾸지 않는다. 회사 공통 푸터를 쓰지 않으므로 페이지의 저작권 표기는 이 두 줄뿐이다.

스타일은 기존 인터랙티브(smishing)의 바이라인과 같은 모양이다. 수치는 `hk-common-css` 블록에 있다.

| 요소 | 모양 |
| --- | --- |
| 전체 | 가운데 정렬, 요소 사이 24px, 폭은 최대 360px. 높이는 내용만큼이고 위아래 여백이 120px씩이다(화면 한 장으로 늘리지 않는다) |
| 제목 | 28px, 굵기 900, 글자색 그대로 |
| 게시일 | 12px, 글자색의 60%. 제목과 12px 간격 |
| 제작진 | 한 줄에 역할(굵기 700, 글자색의 80%)과 이름(글자색의 60%)을 10px 간격으로. 줄 사이 12px |
| 공유 버튼 | 40px 버튼 세 개, 6px 간격. 아이콘은 기존 인터랙티브의 아이콘을 그대로 옮긴 것이라 서로 크기가 맞는다 — 다시 그리거나 바꾸지 않는다 |
| 저작권 문구 | 14px, 글자색의 60%, 두 줄 |

- 색은 모두 `--font-col-base`에서 나온다. 배경이 밝으면 글자색만 어둡게 바꾸면 된다.
- `data-credits="end"`면 위 여백이 32px이다 — 크레딧 화면의 "이전 화면"·"처음으로" 버튼 줄 바로 아래에 붙는다. 그 버튼 줄은 화면 위에서 120px 내려 시작하게 프로젝트가 만든다.
- 모양을 바꾸려면 블록을 고치지 말고 프로젝트 스타일에서 `.byline …` 선택자로 덮어쓴다.

## 공유 3종

| 버튼 | 동작 |
| --- | --- |
| 페이스북 (`data-share="fb"`) | `facebook.com/sharer/sharer.php?u=<현재 주소>` 새 창. 카드 내용은 페이스북이 그 주소의 `og:*` 메타를 읽어 만든다 |
| X (`data-share="twt"`) | `twitter.com/intent/tweet?text=<문서 제목> <현재 주소>` 새 창 |
| URL 복사 (`data-share="url"`) | `location.href` 전체를 복사하고 "주소가 복사되었습니다." 알림 (실패 시 "복사 실패!") |

현재 주소 = `location.origin + location.pathname` (쿼리·해시 제외). 값은 누를 때 읽는다. 스테이징에서 누르면 스테이징 주소, 운영에서 누르면 운영 주소가 나간다 — 헤더와 같다.
로컬(`localhost`)에서 누르면 localhost 주소가 나가므로 페이스북·X가 카드 내용을 읽지 못한다 — 로컬에서는 버튼 동작만 확인한다.
`hkFunc.js`는 넣지 않는다 — 그 안의 `Kakao.Link`(SDK v1)는 헤더가 쓰는 v2에서 없어서 호출하면 오류다.

## 자주 나는 문제

- 공유 카드가 비어 있다 → `<head>`의 `og:title`, `og:description`, `og:image`, `kakao_og_image` 중 하나가 비었거나 주소가 틀렸다. `index.html`의 메타를 채운다 (`template-overview.md` 「`index.html`에서 고칠 곳」).
- 카카오 공유가 오류 → `Kakao.Link`(v1 API) 호출이나 v1 SDK(`developers.kakao.com/sdk/js/kakao.min.js`) 로드. 둘 다 금지(`self_check.js`가 검사).
- 공유 버튼을 눌러도 반응이 없다 → 버튼의 `data-share` 속성을 지웠거나 `hk-common-js` 블록이 빠졌다. 템플릿에서 다시 복사한다.
