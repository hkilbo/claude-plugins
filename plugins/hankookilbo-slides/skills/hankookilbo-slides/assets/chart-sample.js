/* 한국일보 공식 슬라이드 — pptxgenjs 예제
 * 표 · 차트 구현 예제. 표지 B + 손익표 + 구성비 도넛 + 추이 차트(막대+꺾은선).
 * 규격은 references/charts-tables.md 참고. 수치는 예시다.
 */
const pptxgen = require('pptxgenjs');
const P = new pptxgen();
P.defineLayout({ name: 'HK', width: 11.7, height: 8.27 });
P.layout = 'HK';
const W = 11.7, H = 8.27;

/* ---- 한국일보 공식 토큰 ---- */
const GREEN_DEEP = '14362D';
const GREEN      = '215732';
const GREEN_PALE = 'EEF8E0';
const GREEN_MIST = 'E8F8F6';
const GREEN_LINE = 'D3DDD6';
const RULE       = 'BFBFBF';
const INK        = '000000';
const INK_SOFT   = '3F4A44';
const RED        = 'C00000';
const WHITE      = 'FFFFFF';
const F = 'Malgun Gothic';

/* 자산 경로는 이 스크립트 위치에서 스스로 찾는다. 손으로 고치지 않는다.
 * 이 파일을 다른 곳으로 복사해 쓰려면 ASSETS 만 assets/ 절대 경로로 지정한다. */
const path = require('path');
const fs   = require('fs');
const ASSETS = process.env.HK_ASSETS || __dirname;

const LOGO_TOP   = path.join(ASSETS, 'logo-corner.png');    // 본문 우상단 로고
const LOGO_TALL  = path.join(ASSETS, 'logo-vertical.png');  // 표지 A · B · 엔딩 세로 로고
const COVER_B_ART = path.join(ASSETS, 'cover-b-artwork.png'); // 표지 B 하단 아트워크

/* 자산이 하나라도 없으면 즉시 중단한다.
 * 로고 없이 도형으로 표지를 대체하는 것은 규격 위반이다. */
for (const f of [LOGO_TOP, LOGO_TALL, COVER_B_ART]) {
  if (!fs.existsSync(f)) {
    console.error('[중단] 자산 파일을 찾을 수 없습니다: ' + f);
    console.error('  → HK_ASSETS 환경변수에 스킬의 assets/ 절대 경로를 지정하고 다시 실행하십시오.');
    console.error('  → 자산 없이 도형으로 대체 제작하지 마십시오. 규격이 깨집니다.');
    process.exit(1);
  }
}

const X0 = 0.48;              // 제목 좌측
const CX = 0.6;               // 본문 좌측
const CW = 10.48;             // 본문 폭

let pageNo = 0;
function newSlide() { pageNo += 1; return P.addSlide(); }

function chrome(s) {                      // 본문 장표 공통
  s.addImage({ path: LOGO_TOP, x: 10.78, y: 0.146, w: 0.458, h: 0.688 });
  s.addShape(P.ShapeType.line, { x: 0.27, y: 0.96, w: 11.16, h: 0,
    line: { color: RULE, width: 0.75 } });
  s.addText(String(pageNo), { x: 10.9, y: 7.78, w: 0.3, h: 0.27,
    fontSize: 12, fontFace: F, color: INK_SOFT, align: 'right', margin: 0 });
}

function title(s, t) {
  s.addText(t, { x: X0, y: 0.14, w: 10.51, h: 0.75, fontSize: 24.75, bold: true,
    color: INK, fontFace: F, margin: 0, valign: 'middle' });
}

function lead(s, t, y) {                  // 제목 아래 리드 문장
  s.addText(t, { x: CX, y: y || 1.2, w: CW, h: 0.4, fontSize: 15,
    color: INK_SOFT, fontFace: F, margin: 0, valign: 'top' });
}

function sectionLabel(s, t, x, y, w) {    // 영역 소제목 + 위 실선
  s.addShape(P.ShapeType.line, { x, y, w, h: 0, line: { color: GREEN_DEEP, width: 1.25 } });
  s.addText(t, { x, y: y + 0.08, w, h: 0.32, fontSize: 15, bold: true,
    color: GREEN, fontFace: F, margin: 0 });
}

function note(s, t) {                     // 하단 안내 문장
  s.addText(t, { x: CX, y: 7.0, w: CW, h: 0.5, fontSize: 12,
    color: INK_SOFT, fontFace: F, margin: 0, lineSpacing: 18, valign: 'top' });
}

function caption(s, t) {
  s.addText(t, { x: CX, y: 7.55, w: CW, h: 0.25, fontSize: 11.25,
    color: '7F7F7F', fontFace: F, margin: 0 });
}

function table(s, head, rows, colW, y, rowH) {
  const th = head.map(h => ({
    text: h,
    options: { bold: true, color: WHITE, fill: { color: GREEN_DEEP }, fontSize: 12,
      align: 'center', valign: 'middle' }
  }));
  const body = rows.map((r, ri) => r.map((c, ci) => ({
    text: c,
    options: {
      fontSize: 12, color: INK, valign: 'middle',
      align: ci === 0 ? 'center' : 'left',
      bold: ci === 0,
      fill: { color: ri % 2 ? GREEN_MIST : WHITE }
    }
  })));
  s.addTable([th].concat(body), {
    x: CX, y, w: CW, colW, fontFace: F,
    border: { type: 'solid', color: RULE, pt: 0.75 },
    rowH: rowH || 0.55, margin: 0.09, valign: 'middle'
  });
}

function codeBlock(s, o) {
  s.addShape(P.ShapeType.rect, { x: o.x, y: o.y, w: o.w, h: o.h,
    fill: { color: o.fill || 'F5F7F6' }, line: { color: GREEN_LINE, width: 0.75 } });
  s.addText(o.text, { x: o.x + 0.16, y: o.y + 0.14, w: o.w - 0.32, h: o.h - 0.28,
    fontSize: 11, fontFace: 'Courier New', color: INK, margin: 0,
    lineSpacing: 17, valign: 'top' });
}

/* ---- 표지 A: 연녹 면형 (기본) ---- */
function coverA(titleText, metaText) {
  const s = newSlide();
  s.addShape(P.ShapeType.rect, { x: 2.34, y: 0, w: 9.36, h: H,
    fill: { color: GREEN_PALE }, line: { color: GREEN_PALE, width: 0 } });
  s.addImage({ path: LOGO_TALL, x: 0.594, y: 0.969, w: 1.104, h: 2.135 });
  s.addShape(P.ShapeType.line, { x: 2.86, y: 0.97, w: 8.14, h: 0, line: { color: INK, width: 1 } });
  s.addText(titleText, { x: 2.86, y: 1.24, w: 8.73, h: 0.6,
    fontSize: 30, bold: true, color: INK, fontFace: F, margin: 0, valign: 'middle' });
  s.addShape(P.ShapeType.line, { x: 2.86, y: 2.14, w: 8.14, h: 0, line: { color: INK, width: 1 } });
  s.addText(metaText, { x: 2.86, y: 2.21, w: 8.95, h: 0.25,
    fontSize: 11.25, color: INK_SOFT, fontFace: F, margin: 0 });
  return s;
}

/* ---- 표지 B: 하단 아트워크형 ---- */
function coverB(titleText, metaText) {
  const s = newSlide();
  s.addImage({ path: LOGO_TALL, x: 0.427, y: 0.344, w: 0.698, h: 1.354 });
  s.addText(titleText, { x: 0.385, y: 2.146, w: 10.312, h: 0.692,
    fontSize: 36, bold: true, color: GREEN_DEEP, fontFace: F, margin: 0, valign: 'middle' });
  s.addText(metaText, { x: 0.396, y: 2.896, w: 8.949, h: 0.276,
    fontSize: 12.75, color: INK_SOFT, fontFace: F, margin: 0 });
  s.addImage({ path: COVER_B_ART, x: 0.031, y: 3.156, w: 11.479, h: 5.021 });
  return s;
}


/* ================= 1. 표지 ================= */
{
  const s = coverB('2026년 미디어사업본부 상반기 손익 실적', '한국일보 ㅣ 미디어사업본부 ㅣ 2026년 7월 31일');
  s.addNotes('상반기 손익 실적과 사업 구성비, 분기 추이를 보고합니다. 수치는 예시입니다.');
}

/* ================= 2. 손익표 ================= */
{
  const s = newSlide(); chrome(s);
  title(s, '1. 상반기 실적 _ ① 총괄경영손익');
  s.addText('( 단위 : 억원 )', { x: CX, y: 1.42, w: 3, h: 0.25,
    fontSize: 11.25, color: INK_SOFT, fontFace: F, margin: 0 });
  table(s,
    ['구분', '2025년 실적', '2026년 목표', '1~6월 실적', '7~12월 (E)', '연간 합계', '목표대비', '달성률'],
    [
      ['매 출 액', '412.6', '450.0', '218.4', '241.2', '459.6', '+9.6', '102%'],
      ['영업이익', '38.2', '45.0', '20.1', '25.4', '45.5', '+0.5', '101%'],
      ['경상이익', '35.7', '42.0', '18.6', '23.1', '41.7', '−0.3', '99%'],
      ['당기순이익', '27.4', '32.0', '14.2', '17.9', '32.1', '+0.1', '100%'],
    ],
    [1.5, 1.28, 1.28, 1.28, 1.28, 1.28, 1.24, 1.34], 1.72, 0.5);

  sectionLabel(s, '주요 특이사항', CX, 4.9, CW);
  s.addText('· 상반기 매출은 목표의 48.5% 를 달성해 계획 대비 정상 진도입니다.\n' +
            '· 경상이익은 하반기 신규 사업 초기 비용 반영으로 목표를 소폭 하회할 전망입니다.\n' +
            '· 사업별 매출·영업이익 현황은 별첨 장표를 함께 확인하십시오.',
    { x: CX + 0.05, y: 5.45, w: CW, h: 1.2, fontSize: 13, color: INK,
      fontFace: F, margin: 0, lineSpacing: 24, valign: 'top' });
  note(s, '· 7~12월 (E) 는 추정치입니다. 하반기 실적 확정 후 갱신이 필요합니다.');
  caption(s, '단위: 억원 · 자료: 경영관리팀 집계 · 2026.06.30 기준');
}

/* ================= 3. 구성비 차트 (도넛) ================= */
{
  const s = newSlide(); chrome(s);
  title(s, '2. 상반기 실적 _ ② 사업별 매출 구성비');
  lead(s, '상반기 매출 218.4억원의 사업별 비중입니다. 광고와 구독이 전체의 3분의 2를 차지합니다.');

  const SLICE = ['14362D', '215732', '00A650', 'A8C6AF', 'D3DDD6'];
  sectionLabel(s, '사업별 매출 구성', CX, 1.85, 5.3);
  s.addChart(P.ChartType.doughnut, [{
    name: '매출 구성비',
    labels: ['광고', '구독', '행사·전시', '콘텐츠 판매', '기타'],
    values: [38, 29, 16, 11, 6],
  }], {
    x: CX, y: 2.35, w: 5.3, h: 3.6,
    holeSize: 50,
    chartColors: SLICE,
    showLegend: false,
    showValue: false,
    showTitle: false, dataBorder: { pt: 2, color: 'FFFFFF' },
  });

  const x2 = CX + 5.7, w2 = CW - 5.7;
  sectionLabel(s, '비중 · 금액 · 전년 대비', x2, 1.85, w2);
  const rows = [
    ['광고', '38%', '83.0', '+6.2%'],
    ['구독', '29%', '63.3', '+11.4%'],
    ['행사 · 전시', '16%', '34.9', '−2.1%'],
    ['콘텐츠 판매', '11%', '24.0', '+18.7%'],
    ['기타', '6%', '13.2', '+3.0%'],
  ];
  rows.forEach((r, i) => {
    const y = 2.35 + i * 0.62;
    s.addShape(P.ShapeType.rect, { x: x2, y, w: w2, h: 0.54,
      fill: { color: i % 2 ? GREEN_MIST : WHITE }, line: { color: GREEN_LINE, width: 0.75 } });
    s.addShape(P.ShapeType.rect, { x: x2 + 0.14, y: y + 0.19, w: 0.16, h: 0.16,
      fill: { color: SLICE[i] }, line: { color: SLICE[i], width: 0 } });
    s.addText(r[0], { x: x2 + 0.4, y: y + 0.13, w: 1.55, h: 0.3, fontSize: 12,
      bold: true, color: INK, fontFace: F, margin: 0 });
    s.addText(r[1], { x: x2 + 1.95, y: y + 0.13, w: 0.6, h: 0.3, fontSize: 12,
      bold: true, color: GREEN_DEEP, fontFace: F, align: 'right', margin: 0 });
    s.addText(r[2], { x: x2 + 2.6, y: y + 0.13, w: 0.7, h: 0.3, fontSize: 12,
      color: INK, fontFace: F, align: 'right', margin: 0 });
    s.addText(r[3], { x: x2 + 3.35, y: y + 0.13, w: 0.85, h: 0.3, fontSize: 12,
      color: r[3].indexOf('−') === 0 ? RED : GREEN, fontFace: F, align: 'right', margin: 0 });
  });
  s.addText('· 콘텐츠 판매가 전년 대비 18.7% 성장해 증가율이 가장 높습니다.\n· 행사·전시는 소폭 감소했으나 하반기 대회 일정으로 회복이 예상됩니다.',
    { x: x2, y: 5.6, w: w2, h: 0.8, fontSize: 12, color: INK_SOFT,
      fontFace: F, margin: 0, lineSpacing: 20, valign: 'top' });
  caption(s, '단위: % · 억원 · 자료: 경영관리팀 집계 · 2026.06.30 기준');
}

/* ================= 4. 추이 차트 ================= */
{
  const s = newSlide(); chrome(s);
  title(s, '3. 상반기 실적 _ ③ 분기별 추이');

  sectionLabel(s, '분기 매출액 (막대 · 단일 계열)', CX, 1.3, CW);
  s.addChart(P.ChartType.bar, [{
    name: '매출액',
    labels: ['25.1Q', '25.2Q', '25.3Q', '25.4Q', '26.1Q', '26.2Q'],
    values: [96.4, 101.8, 103.2, 111.2, 105.7, 112.7],
  }], {
    x: CX, y: 1.8, w: CW, h: 2.5,
    barDir: 'col', barGapWidthPct: 60,
    chartColors: ['14362D'],
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 10, dataLabelColor: INK,
    dataLabelFormatCode: '0.0',
    valAxisHidden: true, catAxisLabelColor: INK_SOFT, catAxisLabelFontSize: 10,
    catGridLine: { style: 'none' }, valGridLine: { style: 'none' },
    showLegend: false, showTitle: false,
  });

  sectionLabel(s, '사업별 매출 추이 (꺾은선 · 3계열)', CX, 4.45, CW);
  s.addChart(P.ChartType.line, [
    { name: '광고',   labels: ['25.1Q','25.2Q','25.3Q','25.4Q','26.1Q','26.2Q'], values: [38.1,40.2,39.8,43.6,40.4,42.6] },
    { name: '구독',   labels: ['25.1Q','25.2Q','25.3Q','25.4Q','26.1Q','26.2Q'], values: [26.4,27.9,29.1,30.8,30.6,32.7] },
    { name: '행사·전시', labels: ['25.1Q','25.2Q','25.3Q','25.4Q','26.1Q','26.2Q'], values: [18.2,19.4,20.1,21.0,17.1,17.8] },
  ], {
    x: CX, y: 4.95, w: CW, h: 2.0,
    chartColors: ['14362D', 'A8C6AF', 'BFBFBF'],
    lineSize: 2, lineDataSymbol: 'circle', lineDataSymbolSize: 6,
    showLegend: true, legendPos: 'b', legendFontSize: 10, legendColor: INK,
    valAxisLabelColor: INK_SOFT, valAxisLabelFontSize: 10,
    catAxisLabelColor: INK_SOFT, catAxisLabelFontSize: 10,
    valGridLine: { color: GREEN_LINE, size: 0.75 }, catGridLine: { style: 'none' },
    showTitle: false,
  });
  caption(s, '단위: 억원 · 자료: 경영관리팀 집계 · 2026.06.30 기준');
}

/* ================= 5. 엔딩 ================= */
{
  const s = newSlide();
  s.addImage({ path: LOGO_TALL, x: 5.27, y: 2.875, w: 1.104, h: 2.135 });
}

P.writeFile({ fileName: './out.pptx' }).then(() => console.log('done'));
