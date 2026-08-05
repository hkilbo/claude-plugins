# 표 · 차트 규격

실제 제작·렌더 검증을 거쳐 확정한 수치다. 이 값을 그대로 쓴다.

## 표

### 기본 규격

| 항목 | 값 |
|---|---|
| 위치 · 폭 | `x 0.6″`, `w 10.48″` |
| 헤더 | `GREEN_DEEP` 채움 · 흰 글자 12pt Bold · 가운데 정렬 |
| 본문 | 12pt · 첫 열 가운데 정렬 Bold, 나머지 좌측 정렬 |
| 교차행 | 짝수 행 `GREEN_MIST` 채움 |
| 괘선 | `RULE` 0.75pt |
| 셀 여백 | `margin: 0.09` |

### 행 높이 — 겹침을 막는 계산

**`rowH` 는 0.5″ 를 기본으로 한다.** 1.05″ 같은 큰 값을 쓰면 LibreOffice·PowerPoint 가 내용에 맞춰 행을 더 늘려 아래 요소를 덮는다.

표가 차지하는 실제 높이를 계산해 하단 요소 위치를 정한다.

```
표 하단 = y + (헤더 1행 + 본문 행 수) × rowH + 0.3″(여유)
```

예: `y 1.72″`, 4행 + 헤더, `rowH 0.5″` → 하단 약 `4.22″` → 다음 요소는 `4.9″` 부터.

셀 안에 두 줄 이상 들어가면 `rowH` 를 0.9~0.95″ 로 올리고, 그만큼 하단 여유를 더 둔다. **행 수 × rowH 가 4.8″ 를 넘으면 표를 두 장으로 나눈다.**

### 수치 표기

- 금액 · 지표: `412.6` `38.2` — 소수 첫째 자리까지
- 증감: `+9.6` `−0.3` — 부호를 붙이고, 음수는 하이픈이 아니라 `−`(U+2212)
- 비율: `102%` `48.5%`
- 감소 · 미달만 `RED` 로 표시한다. 증가에는 색을 쓰지 않는다

단위는 표 좌상단에 `( 단위 : 억원 )` 형식으로 11.25pt 로 둔다. 출처는 하단 캡션에 `단위: 억원 · 자료: ○○팀 집계 · YYYY.MM.DD 기준` 형식으로 둔다.

## 차트 — 공통

**pptxgenjs 의 네이티브 차트(`addChart`)를 쓴다.** 이미지로 렌더해 넣지 않는다.

| 항목 | 값 |
|---|---|
| 계열 색 | 아래 배정 순서를 따른다. 팔레트 외 색을 만들지 않는다 |
| 축 라벨 | `INK_SOFT` 10pt |
| 값 라벨 | `INK` 10pt, `dataLabelFormatCode` 를 **반드시 지정** |
| 세로 격자선 | `GREEN_LINE` 0.75pt |
| 가로(범주) 격자선 | `catGridLine: { style: 'none' }` |
| 차트 제목 | `showTitle: false` — 제목은 `sectionLabel` 로 슬라이드에 직접 쓴다 |

### 값 라벨 서식 코드 — 생략하면 반올림된다

`dataLabelFormatCode` 를 빼면 `96.4` 가 `96` 으로 표시된다. 항상 명시한다.

```js
dataLabelFormatCode: '0.0'      // 금액 · 지표 (96.4)
dataLabelFormatCode: '0"%"'     // 비율 (38%)
dataLabelFormatCode: '#,##0'    // 정수 대량 (1,250)
```

## 구성비 차트 (원형 · 도넛)

원형과 도넛 중 **하나만** 쓴다. 조각은 5개까지. 색은 큰 항목부터 아래 순서로 배정한다.

```js
const SLICE = ['14362D', '215732', '00A650', 'A8C6AF', 'D3DDD6'];
//              진녹      녹        밝은녹    회녹      연회녹
```

### 값 라벨은 조각 안에 넣지 않는다

템플릿 발표자 노트에는 "값은 흰 글자로 조각 안에" 라고 되어 있으나, **이 규칙은 밝은 조각에서 깨진다.** 연회녹(`D3DDD6`) 위 흰 글자는 읽히지 않고, 검정으로 바꾸면 진녹(`14362D`) 조각이 읽히지 않는다. `dataLabelPosition: 'outEnd'` 는 LibreOffice 가 무시하므로 신뢰할 수 없다.

**따라서 조각 안 값을 쓰지 않는다.**

```js
s.addChart(P.ChartType.doughnut, [{ name: '구성비', labels, values }], {
  x: CX, y: 2.35, w: 5.3, h: 3.6,
  holeSize: 50,
  chartColors: SLICE,
  showValue: false,          // 조각 안 값 없음
  showLegend: false,         // 범례도 쓰지 않음
  showTitle: false,
  dataBorder: { pt: 2, color: 'FFFFFF' },
});
```

대신 **차트 우측에 항목 목록을 둔다.** 색 칩(0.16″ 정사각, 조각과 같은 색) + 항목명 12pt Bold + 비중 12pt Bold `GREEN_DEEP` + 금액 + 전년 대비. 행 높이 0.62″, 교차행 `GREEN_MIST`, 테두리 `GREEN_LINE` 0.75pt.

차트는 형태를, 우측 목록은 수치를 담당하는 분업이다. 대비 문제가 원천적으로 없고 정보량은 더 많다.

## 추이 차트

상단 막대 + 하단 꺾은선 2단 구성이 기본이다. 한 장에 둘 다 넣을 때 막대 `h 2.5″`, 꺾은선 `h 2.0″` 로 두면 하단 캡션과 겹치지 않는다.

### 막대 — 단일 계열

```js
s.addChart(P.ChartType.bar, [{ name: '매출액', labels, values }], {
  x: CX, y: 1.8, w: CW, h: 2.5,
  barDir: 'col', barGapWidthPct: 60,
  chartColors: ['14362D'],
  showValue: true, dataLabelPosition: 'outEnd',
  dataLabelFontSize: 10, dataLabelColor: INK, dataLabelFormatCode: '0.0',
  valAxisHidden: true,                       // 값을 라벨로 보여주므로 축은 숨긴다
  catAxisLabelColor: INK_SOFT, catAxisLabelFontSize: 10,
  catGridLine: { style: 'none' }, valGridLine: { style: 'none' },
  showLegend: false, showTitle: false,
});
```

막대는 **단일 계열만** 쓴다. 여러 계열을 비교해야 하면 꺾은선으로 옮긴다. 누적 막대를 쓸 경우 `dataLabelPosition` 은 `ctr` · `inEnd` · `inBase` 중 하나여야 한다. `outEnd` 는 파일을 깨뜨린다.

### 꺾은선 — 3계열까지

강조 계열만 진녹으로 두고 나머지는 눌러 표현한다.

```js
chartColors: ['14362D', 'A8C6AF', 'BFBFBF'],   // 강조 · 보조 · 배경
lineSize: 2, lineDataSymbol: 'circle', lineDataSymbolSize: 6,
showLegend: true, legendPos: 'b', legendFontSize: 10, legendColor: INK,
valAxisLabelColor: INK_SOFT, valAxisLabelFontSize: 10,
catAxisLabelColor: INK_SOFT, catAxisLabelFontSize: 10,
valGridLine: { color: GREEN_LINE, size: 0.75 },
catGridLine: { style: 'none' },
showTitle: false,
```

꺾은선은 값 라벨을 붙이지 않는다. 점이 많아 겹친다. 축 라벨과 격자선으로 읽게 한다.

## 검수

차트를 넣은 장표는 **반드시 렌더를 눈으로 확인한다.** 아래는 XML 로 잡히지 않는다.

- 값 라벨이 반올림되어 표시됨 (`dataLabelFormatCode` 누락)
- 조각 · 막대 위 글자가 배경색과 저대비
- 표 하단이 다음 요소를 덮음
- 범례가 잘림
- 축 라벨이 겹침
