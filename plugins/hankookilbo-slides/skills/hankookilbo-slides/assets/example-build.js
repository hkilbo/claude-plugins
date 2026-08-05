/* 한국일보 공식 슬라이드 — pptxgenjs 예제
 * 이 파일이 제작의 필수 출발점이다. 반드시 이 파일을 복사해 내용만 교체한다.
 * 토큰과 헬퍼 함수를 처음부터 다시 작성하지 않는다.
 * 출력 경로(마지막 writeFile)만 실제 값으로 바꾼다.
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
let s = newSlide();
s.addShape(P.ShapeType.rect, { x: 2.34, y: 0, w: 9.36, h: H,
  fill: { color: GREEN_PALE }, line: { color: GREEN_PALE, width: 0 } });
s.addImage({ path: LOGO_TALL, x: 0.594, y: 0.969, w: 1.104, h: 2.135 });
s.addShape(P.ShapeType.line, { x: 2.86, y: 0.97, w: 8.14, h: 0, line: { color: INK, width: 1 } });
s.addText('Code Connect 도입 검토', { x: 2.86, y: 1.24, w: 8.73, h: 0.6,
  fontSize: 30, bold: true, color: INK, fontFace: F, margin: 0, valign: 'middle' });
s.addShape(P.ShapeType.line, { x: 2.86, y: 2.14, w: 8.14, h: 0, line: { color: INK, width: 1 } });
s.addText('플랫폼개발부문 ㅣ 2026년 7월 31일', { x: 2.86, y: 2.21, w: 8.95, h: 0.25,
  fontSize: 11.25, color: INK_SOFT, fontFace: F, margin: 0 });
s.addNotes('디자인과 코드를 잇는 마지막 연결을 자동화하는 Code Connect 도입 검토 보고입니다.');

/* ================= 2. CONTENTS ================= */
s = newSlide();
s.addShape(P.ShapeType.rect, { x: 2.34, y: 0, w: 9.36, h: H,
  fill: { color: GREEN_PALE }, line: { color: GREEN_PALE, width: 0 } });
s.addText('CONTENTS', { x: 3.08, y: 1.61, w: 3.5, h: 0.64, fontSize: 32.25,
  color: INK, fontFace: F, margin: 0, valign: 'middle' });
s.addShape(P.ShapeType.line, { x: 3.26, y: 2.27, w: 2.68, h: 0, line: { color: INK, width: 1 } });
const toc = [
  ['Ⅰ. 현황과 문제', 18, true, 3.14, 2.40],
  ['1. 디자인 시스템의 연결 단절', 16.5, false, 3.49, 2.86],
  ['2. 발생하는 비용', 16.5, false, 3.49, 3.28],
  ['Ⅱ. Code Connect 개요', 18, true, 3.14, 3.83],
  ['1. 정의와 산출물', 16.5, false, 3.49, 4.29],
  ['2. 매핑 동작 방식', 16.5, false, 3.49, 4.72],
  ['Ⅲ. 기대 효과와 도입 방안', 18, true, 3.14, 5.27],
  ['1. 도입 전후 비교 · AI 코드 생성', 16.5, false, 3.49, 5.73],
  ['2. 우리 조직의 도입 준비도', 16.5, false, 3.49, 6.13],
  ['3. 로드맵 · 남은 고려사항 · 제안', 16.5, false, 3.49, 6.53],
];
toc.forEach(t => s.addText(t[0], { x: t[3], y: t[4], w: 6.44, h: 0.5,
  fontSize: t[1], bold: t[2], color: INK, fontFace: F, margin: 0, valign: 'middle' }));

/* ================= 간지 Ⅰ ================= */
function divider(txt) {
  const d = newSlide();
  d.addShape(P.ShapeType.rect, { x: 2.34, y: 0, w: 9.36, h: H,
    fill: { color: GREEN_PALE }, line: { color: GREEN_PALE, width: 0 } });
  d.addText(txt, { x: 3.33, y: 3.20, w: 7.5, h: 0.62, fontSize: 32.25, bold: true,
    color: INK, fontFace: F, margin: 0, valign: 'middle' });
  return d;
}
divider('Ⅰ. 현황과 문제');

/* ================= 3. 연결 단절 ================= */
s = newSlide(); chrome(s);
title(s, '1. 현황과 문제 _ ① 디자인 시스템의 연결 단절');
lead(s, '컴포넌트는 Figma에 있고 코드도 있습니다. 문제는 둘을 잇는 것이 사람의 기억이라는 점입니다.');
table(s,
  ['구분', '현재 상태', '결과'],
  [
    ['번역 비용', '디자이너는 ‘Primary / Large’, 개발자는 variant="primary" size="lg"', '컴포넌트를 쓸 때마다 매핑을 머릿속에서 다시 수행'],
    ['컨텍스트 전환', 'Figma → 스토리북 → 사내 문서 → 코드로 이동', '컴포넌트 하나 사용에 창 전환 4회'],
    ['중복 구현', '기존 컴포넌트를 찾기 어려워 새로 작성', '동일 기능 컴포넌트가 코드베이스에 누적'],
    ['기준 부재', '진실의 출처(Source of Truth)가 도구마다 다름', '디자인·코드 간 불일치가 상시 발생'],
  ],
  [1.9, 4.6, 3.98], 1.75, 0.82);
note(s, '· 도구가 없어서 생기는 문제가 아니라, 마지막 연결 단계가 자동화되어 있지 않아 생기는 문제입니다.');
caption(s, '자료: Figma 블로그 · Bumble · GitHub · HP 디자인시스템 담당자 라운드테이블');

/* ================= 4. 발생 비용 ================= */
s = newSlide(); chrome(s);
title(s, '2. 현황과 문제 _ ② 발생하는 비용');
lead(s, '한 번의 큰 사고가 아니라, 스프린트마다 반복되는 작은 마찰의 총합입니다.');
{
  const items = [
    ['QA 반려 증가', '‘디자인과 다릅니다’ 티켓의 상당수가 컴포넌트 오사용에서 출발합니다.'],
    ['코드베이스 팽창', '중복 컴포넌트가 쌓이면 유지보수 대상이 함께 늘어납니다.'],
    ['시스템 채택률 하락', '쓰기 불편한 시스템은 쓰이지 않습니다. 투자한 만큼 회수되지 않습니다.'],
    ['온보딩 지연', '신규 입사자가 ‘우리 방식’을 익히는 데 걸리는 시간이 길어집니다.'],
  ];
  const bw = (CW - 0.36) / 2, bh = 1.55;
  items.forEach((it, i) => {
    const x = CX + (i % 2) * (bw + 0.36);
    const y = 1.8 + Math.floor(i / 2) * (bh + 0.35);
    s.addShape(P.ShapeType.rect, { x, y, w: bw, h: bh,
      fill: { color: WHITE }, line: { color: GREEN_LINE, width: 1 } });
    s.addShape(P.ShapeType.rect, { x, y, w: bw, h: 0.44,
      fill: { color: GREEN_DEEP }, line: { color: GREEN_DEEP, width: 0 } });
    s.addText(it[0], { x: x + 0.2, y: y + 0.04, w: bw - 0.4, h: 0.36, fontSize: 13.5,
      bold: true, color: WHITE, fontFace: F, margin: 0, valign: 'middle' });
    s.addText('· ' + it[1], { x: x + 0.2, y: y + 0.58, w: bw - 0.4, h: 0.85, fontSize: 12,
      color: INK, fontFace: F, margin: 0, lineSpacing: 19, valign: 'top' });
  });
}
s.addShape(P.ShapeType.rect, { x: CX, y: 5.35, w: CW, h: 0.95,
  fill: { color: GREEN_PALE }, line: { color: GREEN_LINE, width: 0.75 } });
s.addText('HP 사례에서 보고된 핵심 효과는 “개발자가 구현 여부를 확인하러 별도 사이트로 이동하던 컨텍스트 전환 자체가 사라진다”는 점이었습니다.',
  { x: CX + 0.25, y: 5.5, w: CW - 0.5, h: 0.65, fontSize: 13, color: GREEN_DEEP,
    fontFace: F, margin: 0, lineSpacing: 20, valign: 'middle' });
caption(s, '자료: Figma 블로그 ‘Unlocking the power of Code Connect’ (2024)');

/* ================= 간지 Ⅱ ================= */
divider('Ⅱ. Code Connect 개요');

/* ================= 5. 정의 ================= */
s = newSlide(); chrome(s);
title(s, '3. Code Connect 개요 _ ① 정의와 산출물');
lead(s, 'Figma 컴포넌트가 코드베이스의 어떤 컴포넌트인지 선언해두면, Dev Mode는 범용 CSS 대신 실제 컴포넌트와 props를 보여줍니다.');
{
  const cw2 = (CW - 0.4) / 2;
  sectionLabel(s, '도입 전 · Dev Mode 기본 출력', CX, 1.85, cw2);
  codeBlock(s, { x: CX, y: 2.35, w: cw2, h: 2.0, fill: 'F5F7F6', text:
'/* 우리 시스템과 무관한 범용 스니펫 */\n.frame {\n  display: flex;\n  padding: 12px 20px;\n  background: #215732;\n  border-radius: 8px;\n}' });
  sectionLabel(s, '도입 후 · Code Connect 적용', CX + cw2 + 0.4, 1.85, cw2);
  codeBlock(s, { x: CX + cw2 + 0.4, y: 2.35, w: cw2, h: 2.0, fill: GREEN_MIST, text:
'// 그대로 붙여 쓸 수 있는 우리 코드\nimport { Button } from "@hk/ui"\n\n<Button variant="primary" size="lg">\n  저장하기\n</Button>' });
}
table(s,
  ['산출물', '내용', '관리 방식'],
  [
    ['매핑 파일', '컴포넌트별 *.figma.ts 선언 파일', '코드베이스에 함께 저장 · PR 리뷰 대상'],
    ['Dev Mode 표시', '디자인 선택 시 실제 컴포넌트·props 노출', 'Figma 팀 라이브러리와 자동 연동'],
    ['MCP 연결', 'AI 도구가 참조할 수 있는 컴포넌트 정의', 'CLI 또는 UI 어느 방식이든 MCP 서버로 연결'],
  ],
  [2.1, 4.5, 3.88], 4.6, 0.62);
caption(s, '자료: Figma 도움말 ‘Code Connect’ · ‘Figma MCP collection’');

/* ================= 6. 매핑 방식 ================= */
s = newSlide(); chrome(s);
title(s, '4. Code Connect 개요 _ ② 매핑 동작 방식');
lead(s, '매핑은 자동 추측이 아니라 선언입니다. 한 번 정의하면 이후 모든 인스턴스에 자동 적용됩니다.');
{
  sectionLabel(s, '매핑 선언 예시', CX, 1.85, 5.9);
  codeBlock(s, { x: CX, y: 2.35, w: 5.9, h: 3.1, text:
"// Button.figma.ts\nconst label   = instance.getString('Label')\nconst variant = instance.getEnum('Variant', {\n  'Primary':   'primary',\n  'Secondary': 'secondary',\n})\nconst disabled = instance.getBoolean('Disabled')\n\nexport default {\n  example: figma.code`<Button ... />`,\n  imports: ['import { Button } from \"@hk/ui\"'],\n}" });
  const x2 = CX + 6.2, w2 = CW - 6.2;
  sectionLabel(s, '속성 유형별 대응', x2, 1.85, w2);
  const rows = [
    ['TEXT', '라벨 · 제목 등 텍스트 값을 그대로 전달'],
    ['VARIANT', 'Figma의 ‘Primary’를 코드의 primary로 대응'],
    ['BOOLEAN', '토글·비활성 상태를 코드 prop으로 반영'],
    ['INSTANCE SWAP', '교체 가능한 아이콘을 동적으로 렌더링'],
  ];
  rows.forEach((r, i) => {
    const y = 2.35 + i * 0.78;
    s.addShape(P.ShapeType.rect, { x: x2, y, w: w2, h: 0.68,
      fill: { color: i % 2 ? GREEN_MIST : WHITE }, line: { color: GREEN_LINE, width: 0.75 } });
    s.addText(r[0], { x: x2 + 0.15, y: y + 0.05, w: w2 - 0.3, h: 0.26, fontSize: 11.5,
      bold: true, color: GREEN, fontFace: F, margin: 0 });
    s.addText(r[1], { x: x2 + 0.15, y: y + 0.33, w: w2 - 0.3, h: 0.3, fontSize: 11.5,
      color: INK, fontFace: F, margin: 0 });
  });
}
note(s, '· 매핑 정의는 코드베이스에 파일로 존재하므로 리뷰 · 버전관리 · CI의 대상이 됩니다.');

/* ================= 간지 Ⅲ ================= */
divider('Ⅲ. 기대 효과와 도입 방안');

/* ================= 7. 전후 비교 ================= */
s = newSlide(); chrome(s);
title(s, '5. 기대 효과 _ ① 도입 전후 업무 흐름 비교');
lead(s, '같은 화면을 만드는 과정에서 사라지는 단계와 남는 단계를 정리했습니다.');
table(s,
  ['단계', '도입 전', '도입 후'],
  [
    ['코드 확보', 'Dev Mode의 범용 CSS를 수작업으로 옮김', 'Dev Mode에서 실제 컴포넌트와 props를 바로 확보'],
    ['사용법 확인', '문서 사이트로 이동해 구현 여부 확인', '에디터를 떠나지 않고 확인'],
    ['컴포넌트 선택', '찾지 못하면 새로 작성', '기존 컴포넌트를 재사용'],
    ['품질 확인', 'QA에서 ‘디자인과 다름’으로 반려', '구현 단계에서 불일치가 감소'],
    ['AI 활용', 'div 중심의 범용 코드가 생성됨', '사내 라이브러리를 import하는 코드가 생성됨'],
  ],
  [1.75, 4.3, 4.43], 1.8, 0.72);
note(s, '· 표의 ‘도입 후’는 Figma가 공개한 도입 기업 사례에서 공통적으로 보고된 변화입니다. 사내 수치는 파일럿 이후 측정이 필요합니다.');

/* ================= 8. AI ================= */
s = newSlide(); chrome(s);
title(s, '6. 기대 효과 _ ② AI 코드 생성 정확도');
lead(s, 'Figma MCP로 AI 에이전트가 디자인을 읽을 때, Code Connect 유무가 결과물의 성격을 바꿉니다.');
{
  const items = [
    ['정확도', '실제 소스를 참조', '컴포넌트 이름 · 경로 · props를 추측하지 않고 연결된 정의에서 가져옵니다.'],
    ['토큰 준수', '디자인 토큰 자동 적용', '하드코딩된 색상 · 간격 대신 변수와 토큰이 반영된 코드가 생성됩니다.'],
    ['재사용', '새로 만들지 않음', '기존 컴포넌트와 패턴을 재사용해 리뷰 반려 물량 자체가 줄어듭니다.'],
  ];
  const bw = (CW - 0.6) / 3;
  items.forEach((it, i) => {
    const x = CX + i * (bw + 0.3);
    s.addShape(P.ShapeType.rect, { x, y: 1.85, w: bw, h: 2.5,
      fill: { color: WHITE }, line: { color: GREEN_LINE, width: 1 } });
    s.addShape(P.ShapeType.rect, { x, y: 1.85, w: bw, h: 0.44,
      fill: { color: GREEN_DEEP }, line: { color: GREEN_DEEP, width: 0 } });
    s.addText(it[0], { x: x + 0.2, y: 1.89, w: bw - 0.4, h: 0.36, fontSize: 13.5,
      bold: true, color: WHITE, fontFace: F, margin: 0, valign: 'middle' });
    s.addText(it[1], { x: x + 0.2, y: 2.45, w: bw - 0.4, h: 0.35, fontSize: 13,
      bold: true, color: GREEN, fontFace: F, margin: 0 });
    s.addText('· ' + it[2], { x: x + 0.2, y: 2.85, w: bw - 0.4, h: 1.35, fontSize: 12,
      color: INK, fontFace: F, margin: 0, lineSpacing: 19, valign: 'top' });
  });
}
s.addShape(P.ShapeType.rect, { x: CX, y: 4.65, w: CW, h: 0.85,
  fill: { color: GREEN_PALE }, line: { color: GREEN_LINE, width: 0.75 } });
s.addText('Code Connect는 CLI와 UI 두 가지 방식으로 설정할 수 있으며, 어느 쪽이든 결과가 MCP 서버로 연결되어 AI 도구에 노출됩니다.',
  { x: CX + 0.25, y: 4.78, w: CW - 0.5, h: 0.6, fontSize: 13, color: GREEN_DEEP,
    fontFace: F, margin: 0, valign: 'middle' });
caption(s, '자료: Figma 도움말 ‘Improve code generation with Figma’s Code Connect UI’');

/* ================= 9. 도입 준비도 ================= */
s = newSlide(); chrome(s);
title(s, '7. 도입 방안 _ ① 우리 조직의 도입 준비도');
lead(s, 'Code Connect 도입을 막는 통상적인 장벽은 플랜 요건과 전담 인력 부재입니다. 우리 조직은 이 두 가지가 이미 해결되어 있습니다.');
{
  const th = ['구분', 'Code Connect 요구 조건', '우리 조직 현황', '판정'].map(h => ({
    text: h, options: { bold: true, color: WHITE, fill: { color: GREEN_DEEP },
      fontSize: 12, align: 'center', valign: 'middle' } }));
  const rows = [
    ['Figma 플랜', 'Organization 이상 플랜 필요', 'Organization 요금제 사용 중', '충족'],
    ['컴포넌트 게시', '팀 라이브러리에 게시된 컴포넌트', '디자인시스템 라이브러리 운영 중', '충족'],
    ['전담 인력', '컴포넌트 구조 · 네이밍을 관리할 담당자', '디자인시스템 담당 디자이너 보유', '충족'],
    ['코드 측 준비', '매핑 대상이 되는 공용 UI 컴포넌트', '사내 UI 라이브러리 정리 수준 점검 필요', '확인 필요'],
  ];
  const body = rows.map((r, ri) => r.map((c, ci) => {
    const ok = ci === 3 && c === '충족';
    return { text: c, options: {
      fontSize: 12, fontFace: F, valign: 'middle',
      align: (ci === 0 || ci === 3) ? 'center' : 'left',
      bold: ci === 0 || ci === 3,
      color: ok ? WHITE : INK,
      fill: { color: ok ? GREEN_DEEP : (ri % 2 ? GREEN_MIST : WHITE) } } };
  }));
  s.addTable([th].concat(body), {
    x: CX, y: 1.8, w: CW, colW: [1.6, 3.45, 3.95, 1.48], fontFace: F,
    border: { type: 'solid', color: RULE, pt: 0.75 }, rowH: 0.62, margin: 0.09, valign: 'middle' });
}
s.addShape(P.ShapeType.rect, { x: CX, y: 5.15, w: CW, h: 1.0,
  fill: { color: GREEN_PALE }, line: { color: GREEN_LINE, width: 0.75 } });
s.addText('다른 조직에서는 플랜 승인과 전담 인력 확보에 수개월이 걸립니다. 우리는 그 단계를 이미 지나 있어, 남은 것은 매핑 작업 자체뿐입니다.',
  { x: CX + 0.25, y: 5.28, w: CW - 0.5, h: 0.75, fontSize: 13.5, bold: true,
    color: GREEN_DEEP, fontFace: F, margin: 0, lineSpacing: 21, valign: 'middle' });
note(s, '· 4개 조건 중 3개가 이미 충족된 상태입니다. 코드 측 준비 상태만 파일럿 착수 전에 함께 점검하면 됩니다.');

/* ================= 10. 로드맵 ================= */
s = newSlide(); chrome(s);
title(s, '8. 도입 방안 _ ② 단계별 로드맵');
lead(s, '전제 조건이 이미 충족되어 있어, 첫 단계부터 실제 매핑에 들어갈 수 있습니다.');
table(s,
  ['단계', '과제', '주요 활동', '기간'],
  [
    ['1단계', '대상 선정', '· 사용 빈도 기준으로 고빈도 컴포넌트 5~10개 선정\n· 담당 디자이너와 컴포넌트 구조 확인', '3일'],
    ['2단계', '파일럿 매핑', '· Button, Input, Toggle 등 단순 컴포넌트부터 매핑\n· Dev Mode 출력 검증', '2주'],
    ['3단계', '워크플로 편입', '· 매핑 파일을 코드 리뷰 대상에 포함\n· 신규 컴포넌트는 연결을 필수 절차로 지정', '1개월'],
    ['4단계', '확장과 측정', '· 매핑 커버리지 확대\n· 재사용률 · QA 반려 건수 측정', '분기 단위'],
  ],
  [1.3, 2.3, 6.08, 0.8], 1.75, 0.95);
note(s, '· Figma 권고 방식도 동일합니다. 토글이나 버튼처럼 단순한 컴포넌트부터 매핑해 방식을 익히는 것이 가장 안전한 출발점입니다.');

/* ================= 11. 남은 고려사항 ================= */
s = newSlide(); chrome(s);
title(s, '9. 도입 방안 _ ③ 남은 고려사항');
lead(s, '일반적으로 거론되는 진입 장벽 중 우리 조직에 남아 있는 항목만 정리했습니다.');
table(s,
  ['구분', '일반적 장벽', '우리 조직', '대응'],
  [
    ['플랜 요건', 'Free · Professional 플랜에서는 사용 불가', '[해결됨] Organization 요금제 사용 중', '추가 비용 · 승인 절차 없음'],
    ['전제 정리', '컴포넌트 구조 · 네이밍이 정리되어 있지 않으면 효과 반감', '[해결됨] 담당 디자이너가 라이브러리 관리', '기존 관리 체계를 그대로 활용'],
    ['초기 공수', '컴포넌트마다 매핑을 사람이 직접 정의해야 함', '[남은 과제] 매핑 인력 · 시간 확보 필요', '고빈도 컴포넌트로 범위를 좁혀 파일럿'],
    ['유지보수', '컴포넌트 변경 시 매핑도 함께 갱신 필요', '[남은 과제] 갱신 절차 미정', '매핑 파일을 코드베이스에 두고 PR 리뷰에 포함'],
  ],
  [1.45, 3.2, 3.1, 2.73], 1.8, 0.9);
note(s, '· 남은 과제는 두 가지 모두 절차 정의의 문제이며, 별도 예산이나 조직 승인이 필요하지 않습니다. 플랜 요건은 Figma 공개 문서 기준으로, 착수 전 관리자 재확인을 권합니다.');

/* ================= 12. 제안 ================= */
s = newSlide(); chrome(s);
title(s, '10. 결론 _ 파일럿 추진 제안');
{
  s.addShape(P.ShapeType.rect, { x: CX, y: 1.4, w: CW, h: 1.15,
    fill: { color: GREEN_DEEP }, line: { color: GREEN_DEEP, width: 0 } });
  s.addText('전제 조건은 이미 충족되어 있습니다.\n고빈도 컴포넌트 10개를 대상으로 2주 파일럿을 제안합니다', {
    x: CX + 0.35, y: 1.4, w: CW - 0.7, h: 1.15, fontSize: 18, bold: true,
    color: WHITE, fontFace: F, margin: 0, valign: 'middle' });

  sectionLabel(s, '측정 지표', CX, 2.9, CW);
  table(s,
    ['지표', '정의', '측정 시점'],
    [
      ['매핑 커버리지', '전체 게시 컴포넌트 중 Code Connect 연결 비율', '파일럿 종료 시'],
      ['컴포넌트 재사용률', '신규 화면 구현 시 기존 컴포넌트 사용 비율', '파일럿 전후 비교'],
      ['QA 반려 건수', '‘디자인과 다름’ 사유의 QA 티켓 수', '파일럿 전후 4주 비교'],
    ],
    [2.5, 5.5, 2.48], 3.40, 0.56);

  sectionLabel(s, '필요 사항', CX, 5.95, CW);
  s.addText('· 디자인시스템 담당 디자이너 1명 · 프론트엔드 개발자 1명, 각 주 4시간 내외\n· 추가 라이선스 구매나 플랜 상향 없음 — 현재 Organization 요금제로 즉시 착수 가능\n· 파일럿 결과에 따라 전체 라이브러리 확대 여부를 재검토',
    { x: CX + 0.05, y: 6.5, w: CW, h: 1.0, fontSize: 13, color: INK,
      fontFace: F, margin: 0, lineSpacing: 22, valign: 'top' });
}

/* ================= 12. 엔딩 ================= */
s = newSlide();
s.addImage({ path: LOGO_TALL, x: 5.27, y: 2.875, w: 1.104, h: 2.135 });

P.writeFile({ fileName: './out.pptx' })
  .then(() => console.log('done'));
