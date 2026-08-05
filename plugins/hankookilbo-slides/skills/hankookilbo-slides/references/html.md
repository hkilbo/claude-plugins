# HTML 슬라이드 구현 규격

pptx 와 동일한 내용·배치를 웹에서 재현한다. 단일 파일로 만들어 파일 하나만 열면 되도록 한다.

## 캔버스

슬라이드 크기를 `1170 × 827px` 로 고정한다 (11.7″ × 8.27″ × 100). pptx 의 인치 좌표에 100을 곱하면 그대로 px 좌표가 된다.

```css
#stage { width: 1170px; height: 827px; position: relative; transform-origin: center center; }
.slide { position: absolute; inset: 0; background: var(--paper); display: none; overflow: hidden; }
.slide.active { display: block; }
```

브라우저 크기에 맞춰 `transform: scale()` 로 축소한다.

```js
function fit(){
  var s = Math.min(window.innerWidth/1170, window.innerHeight/827) * 0.95;
  document.getElementById('stage').style.transform = 'scale(' + s + ')';
}
window.addEventListener('resize', fit); fit();
```

## 토큰

```css
:root{
  --green-deep:#14362D; --green:#215732; --green-pale:#EEF8E0;
  --green-mist:#E8F8F6; --green-line:#D3DDD6; --rule:#BFBFBF;
  --ink:#000000; --ink-soft:#3F4A44; --mute:#7F7F7F; --paper:#FFFFFF;
}
body{ font-family:"Malgun Gothic","맑은 고딕","Apple SD Gothic Neo",sans-serif; }
```

폰트 크기는 pptx 와 같은 pt 값을 그대로 쓴다 (`font-size: 24.75pt` 등). px 로 환산하지 않는다.

## 공통 크롬

```css
.logo-top{ position:absolute; right:46px; top:14px; width:46px }
.rule-top{ position:absolute; left:27px; right:27px; top:96px; height:1px; background:var(--rule) }
.pageno{ position:absolute; right:48px; bottom:26px; font-size:12pt; color:var(--ink-soft) }
h1.title{ position:absolute; left:48px; top:14px; width:1051px; height:75px;
  font-size:24.75pt; font-weight:700; line-height:75px }
.lead{ position:absolute; left:60px; top:118px; width:1048px; font-size:15pt;
  color:var(--ink-soft); line-height:1.45 }
.body{ position:absolute; left:60px; width:1048px }
.note{ position:absolute; left:60px; top:700px; width:1048px; font-size:12pt; color:var(--ink-soft) }
.caption{ position:absolute; left:60px; top:755px; font-size:11.25pt; color:var(--mute) }
```

## 표

```css
table{ width:100%; border-collapse:collapse; font-size:12pt }
th{ background:var(--green-deep); color:#fff; font-weight:700; padding:11px 10px;
    text-align:center; border:1px solid var(--rule) }
td{ padding:11px 12px; border:1px solid var(--rule); line-height:1.5; vertical-align:middle }
tr:nth-child(even) td{ background:var(--green-mist) }
td.k{ text-align:center; font-weight:700 }
```

열 너비는 `<colgroup><col style="width:18%">` 로 지정한다.

## 표지 · 간지

```css
.pale-panel{ position:absolute; left:234px; top:0; width:936px; height:100%; background:var(--green-pale) }
.cover-logo{ position:absolute; left:59px; top:97px; width:110px }
.cover-line{ position:absolute; left:286px; width:814px; height:1px; background:var(--ink) }
.cover-title{ position:absolute; left:286px; top:124px; width:873px; height:60px;
  font-size:30pt; font-weight:700; line-height:60px }
.cover-meta{ position:absolute; left:286px; top:221px; font-size:11.25pt; color:var(--ink-soft) }
.divider-title{ position:absolute; left:333px; top:320px; font-size:32.25pt; font-weight:700 }
```

표지 B(하단 아트워크형)는 연녹 면 없이 흰 배경.

```css
.coverb-logo{ position:absolute; left:43px; top:34px; width:70px }
.coverb-title{ position:absolute; left:39px; top:215px; width:1031px;
  font-size:36pt; font-weight:700; color:var(--green-deep) }
.coverb-meta{ position:absolute; left:40px; top:290px; font-size:12.75pt; color:var(--ink-soft) }
.coverb-art{ position:absolute; left:3px; top:316px; width:1148px; height:502px }
```

`.coverb-art` 에 `assets/cover-b-artwork.png` 를 base64 로 넣는다. 이 아트워크가 없으면 표지 B 가 아니다.

## 로고 삽입

로고를 base64 로 인라인한다. 외부 파일 의존이 없어야 한다.

```python
import base64
def b64(path):
    return 'data:image/png;base64,' + base64.b64encode(open(path,'rb').read()).decode()
```

`assets/logo-corner.png` → 본문 우상단, `assets/logo-vertical.png` → 표지·엔딩.

## 조작

방향키 · 스페이스 · PageUp/PageDown 으로 이동하고, 우하단에 이전/다음 버튼과 `현재 / 전체` 카운터를 둔다.

## 생성 방식

슬라이드 수가 많으면 Python 스크립트로 HTML 문자열을 조립한다. 템플릿 HTML 에 `__SLIDES__` 자리표를 두고 치환하는 구조가 관리하기 쉽다.

**주의** — Python `%` 포매팅으로 조립할 때 CSS 의 `%` 는 `%%` 로 escape 한다. f-string 을 쓰면 `{` `}` 를 escape 해야 한다.

## 검수

이 환경에 헤드리스 브라우저가 없으면 렌더 확인이 불가능하다. 그 경우 요소 좌표와 높이를 계산해 겹침 여부를 점검하고, **렌더 검증을 하지 못했다는 사실을 사용자에게 알린다.**
