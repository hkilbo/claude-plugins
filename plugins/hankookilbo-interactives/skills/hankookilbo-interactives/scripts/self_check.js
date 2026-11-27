#!/usr/bin/env node
/**
 * self_check.js — 고정 규칙 자가진단 (외부 의존성 없음, 빌드 없음)
 *
 * 사용법: node self_check.js <프로젝트 폴더 경로>
 *
 * 프로젝트는 index.html 하나 + share.jpg·share_kakao.jpg (+본문 이미지·data/·따로 둔 css·js)다 (assets/template/index.html).
 * 필수 스크립트·메타, 메타끼리의 일치(주소·기사키·제목), 공통영역 블록, 공유 이미지, 폰트·용량 규칙을 검사한다.
 * references/template-overview.md 「필수 요건」이 바뀌면 아래 REQUIRED_KEYS 도 함께 바꾼다.
 */

const fs = require("fs");
const path = require("path");

// 인터랙티브 임베드(헤더·추천 카드) CDN 호스트 — 운영만. references/common-area.md 와 같은 값이어야 한다.
const WC_CDN_HOST = "assets.hankookilbo.com";

const REQUIRED_KEYS = [
  "G-HR08PM6YWZ", // GA4 — 이 스트림 하나 (개편 전 GTM/UA/다른 G-* 금지)
  "interactive/lib/js/jquery-3.4.1.min.js", // hkAnalTag_hub.js 가 $ 를 쓴다 — 통계 스크립트보다 앞
  "interactive/lib/js/hkAnalTag_hub.js", // 한국일보 통계 (Hmap 1.0)
  "components/interactive-embed/v2/interactive-embed.js?Nid=", // 임베드 v2 (Nid 대문자 N)
  "assets.hankookilbo.com/fonts/hk_fonts.css", // 웹폰트 CDN
  "t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js", // 카카오 SDK v2 (헤더와 같은 버전)
  "hk:nw_newsid",
  "hk:nw_pagecode",
  "og:image",
  "kakao_og_image",
  "twitter:card",
  'class="byline"',
  'class="share-tools"',
  'class="body-wrapper"',
  'class="full-loader"',
  "Copyright © The Hankook-Ilbo All rights reserved", // 바이라인 맨 끝 저작권 문구 (공통 푸터를 쓰지 않으므로 필수)
];
const REQUIRED_METAS = [
  ["property", "og:locale", "ko_KR"],
  ["property", "og:image:width", "1200"],
  ["property", "og:image:height", "630"],
  ["name", "twitter:image:width", "1200"],
  ["name", "twitter:image:height", "630"],
];
// 남아 있으면 안 되는 템플릿 자리 값 (주석은 빼고 본다)
const PLACEHOLDERS = ["{FOLDER_NAME}", "인터랙티브 제목", "공유 시 노출되는 한 줄 설명", "OOO", "A0000000000000000000"];
const COMMON_BLOCKS = ["hk-common-css", "hk-common-js"]; // <style id> / <script id> — 프로젝트가 고치지 않는 공통 블록
const SHARE_IMAGES = [
  { file: "share.jpg", width: 1200, height: 630, label: "페이스북·X" },
  { file: "share_kakao.jpg", width: 800, height: 800, label: "카카오톡" },
];
const MAX_TOTAL_SIZE_MB = 80; // 넉넉한 상한. 권장치(10MB)는 경고만
const FONT_FILE_EXT = /\.(woff2?|ttf|otf|eot)$/i;
const NOT_UPLOADED = ["node_modules", ".git", "qa-report", "brief.md", ".DS_Store"]; // 올리지 않는 것 — 용량·폰트 검사에서 뺀다

const rootDir = process.argv[2];
if (!rootDir || !fs.existsSync(rootDir)) {
  console.error(rootDir ? `폴더를 찾을 수 없습니다: ${rootDir}` : "사용법: node self_check.js <프로젝트 폴더 경로>");
  process.exit(1);
}

const results = [];
const check = (label, status, detail) => results.push({ label, status, detail: detail || "" }); // status: pass | fail | warn
const walk = (dir, list = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (NOT_UPLOADED.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    e.isDirectory() ? walk(full, list) : list.push(full);
  }
  return list;
};
const decode = (s) => (s ?? "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
const readMetaTags = (html) =>
  (html.match(/<meta\b[^>]*>/gi) || []).map((tag) =>
    Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((m) => [m[1].toLowerCase(), m[2] ?? m[3]])),
  );
const blockRe = (name) => new RegExp(`<(style|script) id="${name}">([\\s\\S]*?)</\\1>`);
const block = (html, name) => (html.match(blockRe(name)) || [])[2]?.trim();

const indexPath = path.join(rootDir, "index.html");
if (!fs.existsSync(indexPath)) {
  check("index.html 존재", "fail", "프로젝트 폴더 바로 아래에 index.html 이 없습니다. 스킬의 assets/template/index.html 을 복사해 시작하세요.");
} else {
  const html = fs.readFileSync(indexPath, "utf-8");
  const noComments = html.replace(/<!--[\s\S]*?-->/g, "");
  const metas = readMetaTags(html);
  const meta = (attr, key) => decode(metas.find((m) => m[attr] === key)?.content);
  const files = walk(rootDir);
  // 공통 블록 밖의 코드(프로젝트 스타일·스크립트 + 따로 둔 css/js 파일)
  const own = COMMON_BLOCKS.reduce((s, n) => s.replace(blockRe(n), ""), html);
  const ownCode = own + files.filter((f) => /\.(css|js|mjs)$/.test(f)).map((f) => fs.readFileSync(f, "utf-8")).join("\n");

  // 1. 필수 식별자
  const missingKeys = REQUIRED_KEYS.filter((k) => !html.includes(k));
  check(`필수 식별자 ${REQUIRED_KEYS.length}종 (GA4/카카오/한국일보 통계/공통요소)`, missingKeys.length ? "fail" : "pass",
    missingKeys.length ? `누락: ${missingKeys.join(", ")} — assets/template/index.html 과 비교하세요.` : "");
  const missingMetas = REQUIRED_METAS.filter(([a, k, v]) => meta(a, k) !== v).map(([a, k, v]) => `<meta ${a}="${k}" content="${v}">`);
  check("공유 메타 (og:locale ko_KR, og·twitter 이미지 1200×630)", missingMetas.length ? "fail" : "pass",
    missingMetas.length ? `누락 또는 값 다름: ${missingMetas.join(", ")}` : "");
  const shareKinds = ["fb", "twt", "url"].filter((k) => !new RegExp(`data-share=["']${k}["']`).test(html));
  check("바이라인 공유 3종 (페이스북·X·URL 복사)", shareKinds.length ? "fail" : "pass",
    shareKinds.length ? `빠진 버튼: ${shareKinds.join(", ")} — 템플릿의 <ul class="share-tools"> 를 그대로 두세요.` : "");

  // 2. 금지 항목
  const v1 = /developers\.kakao\.com\/sdk\/js\/kakao\.min\.js/.test(noComments);
  check("카카오 SDK v1 미사용", v1 ? "fail" : "pass", v1 ? "developers.kakao.com/sdk/js/kakao.min.js 가 있습니다. 헤더의 v2와 충돌하므로 지우세요." : "");
  const kakaoV1Api = /Kakao\.Link\b/.test(noComments);
  check("카카오 v1 API(Kakao.Link) 미사용", kakaoV1Api ? "fail" : "pass",
    kakaoV1Api ? "Kakao.Link 호출이 있습니다. 바이라인에는 카카오 공유를 두지 않습니다 — 헤더가 맡습니다 (references/byline-and-share.md)." : "");
  const legacy = [...new Set(noComments.match(/GTM-59599H7|UA-53476308-\d|G-ZPZ8BHZPSJ|G-BZHTEE2B8L|hkFunc\.js/g) || [])];
  check("개편 전 통계 스크립트 없음 (GA4는 G-HR08PM6YWZ 하나)", legacy.length ? "fail" : "pass", legacy.length ? `개편 전 식별자: ${legacy.join(", ")} — 지우세요.` : "");
  const [jqAt, hubAt] = ["interactive/lib/js/jquery-3.4.1.min.js", "interactive/lib/js/hkAnalTag_hub.js"].map((k) => html.indexOf(k));
  if (jqAt >= 0 && hubAt >= 0) check("jQuery 가 통계 스크립트(hkAnalTag_hub.js)보다 앞", jqAt < hubAt ? "pass" : "fail",
    jqAt < hubAt ? "" : "hkAnalTag_hub.js 가 jQuery 보다 먼저 실행됩니다. jquery <script> 를 앞으로 옮기세요.");
  const ownHeader = /class="article-bar"/.test(html);
  check("자체 헤더(article-bar) 없음", ownHeader ? "fail" : "pass", ownHeader ? "헤더는 interactive-embed.js 가 붙이는 <interactive-header> 하나만 씁니다." : "");
  const hosts = [...new Set(html.match(/assets(?:-dev|-stg)?\.hankookilbo\.com(?=\/components\/)/g) || [])].filter((h) => h !== WC_CDN_HOST);
  check(`임베드 CDN 호스트 = ${WC_CDN_HOST}`, hosts.length ? "fail" : "pass", hosts.length ? `다른 CDN 주소: ${hosts.join(", ")} — https://${WC_CDN_HOST} 로 바꾸세요.` : "");

  // 3. 메타 일치 — 값을 index.html 여러 곳에 직접 쓰므로 서로 어긋나지 않았는지 본다
  const url = meta("property", "og:url");
  const urlBad = [];
  if (!/^https:\/\/.+\/$/.test(url)) urlBad.push(`og:url "${url}" 은 https 로 시작하고 / 로 끝나야 합니다`);
  for (const [a, k, want] of [["name", "twitter:url", url], ["property", "og:image", url + "share.jpg"], ["name", "twitter:image", url + "share.jpg"], ["name", "kakao_og_image", url + "share_kakao.jpg"]]) {
    if (meta(a, k) !== want) urlBad.push(`${k} 는 "${want}" 여야 합니다 (지금 "${meta(a, k)}")`);
  }
  check("메타 일치: 주소 (og:url·twitter:url·공유 이미지 3개)", urlBad.length ? "fail" : "pass", urlBad.length ? urlBad.join(" / ") : url);

  const key = meta("name", "hk:nw_newsid");
  const nids = [...html.matchAll(/interactive-embed\.js\?Nid=([A-Za-z0-9]*)/g)].map((m) => m[1]);
  const keyBad = [];
  if (!nids.length) keyBad.push(/interactive-embed\.js\?nid=/i.test(html) ? "임베드 파라미터 이름이 대문자 N(`Nid`)이 아닙니다" : "interactive-embed.js 에 ?Nid= 가 없습니다");
  if (nids.some((n) => n !== key)) keyBad.push(`임베드 Nid(${nids.join(", ")})가 hk:nw_newsid(${key || "없음"})와 다릅니다`);
  if (meta("name", "hk:nw_pagecode") !== `hk_news_read_${key}`) keyBad.push(`hk:nw_pagecode 는 "hk_news_read_${key}" 여야 합니다 (지금 "${meta("name", "hk:nw_pagecode")}")`);
  if (keyBad.length) check("메타 일치: 기사 키 (hk:nw_newsid = Nid, pagecode)", "fail", keyBad.join(" / "));
  else if (!/^A\d{19}$/.test(key)) check("메타 일치: 기사 키 (hk:nw_newsid = Nid, pagecode)", "warn", `형식이 A+19자리가 아닙니다 (${key}). 기사키 미발급이면 brief.md 에 남기세요.`);
  else check("메타 일치: 기사 키 (hk:nw_newsid = Nid, pagecode)", "pass", key);

  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1]);
  const titleBad = [];
  if (!title) titleBad.push("<title> 이 비었습니다");
  if (/^\[인터랙티브\]|\|\s*한국일보$/.test(title)) titleBad.push(`<title> 은 제목 그대로여야 합니다 (접두·접미 없음): "${title}"`);
  for (const [a, k] of [["property", "og:title"], ["name", "twitter:title"], ["name", "hk:nw_title"]]) {
    if (meta(a, k) !== `[인터랙티브] ${title}`) titleBad.push(`${k} 는 "[인터랙티브] ${title}" 여야 합니다 (지금 "${meta(a, k)}")`);
  }
  const bylineTitle = decode((html.match(/class="byline"[\s\S]*?class="title"[^>]*>([^<]*)</) || [])[1]);
  if (bylineTitle !== title) titleBad.push(`바이라인 제목("${bylineTitle}")이 <title> 과 다릅니다`);
  const desc = meta("name", "description");
  for (const [a, k] of [["property", "og:description"], ["name", "twitter:description"]]) if (meta(a, k) !== desc) titleBad.push(`${k} 가 description 과 다릅니다`);
  check("메타 일치: 제목·설명 (<title>·og·twitter·hk:nw_title·바이라인)", titleBad.length ? "fail" : "pass", titleBad.length ? titleBad.join(" / ") : title);

  const leftover = PLACEHOLDERS.filter((m) => noComments.includes(m));
  check("템플릿 자리 값이 실제 값으로 채워짐", leftover.length ? "fail" : "pass", leftover.length ? `남아 있음: ${leftover.join(", ")}` : "");

  // 4. 공통영역 — <html> 초기값, 공통 블록, 크레딧 배선, 배경 단색 (references/common-area.md)
  const htmlTag = (html.match(/<html\b[^>]*>/i) || [""])[0];
  const attr = (n) => (htmlTag.match(new RegExp(`\\b${n}=["']([^"']*)["']`)) || [])[1];
  const attrBad = [["data-state", ["intro"]], ["data-gnb", ["transparent"]], ["data-credits", ["bottom", "end"]]]
    .filter(([n, ok]) => !ok.includes(attr(n))).map(([n, ok]) => `${n}="${attr(n) ?? "없음"}" (허용: ${ok.join("|")})`);
  check("공통영역 <html data-*> 초기값", attrBad.length ? "fail" : "pass",
    attrBad.length ? `${attrBad.join(", ")} — <html lang="ko" data-state="intro" data-gnb="transparent" data-credits="bottom|end">` : `state=${attr("data-state")} gnb=${attr("data-gnb")} credits=${attr("data-credits")}`);

  const originalPath = path.join(__dirname, "..", "assets", "template", "index.html");
  const original = fs.existsSync(originalPath) ? fs.readFileSync(originalPath, "utf-8") : null;
  for (const name of COMMON_BLOCKS) {
    const mine = block(html, name);
    if (!mine) check(`공통 블록 ${name}`, "fail", `id="${name}" 블록이 없습니다. GNB·크레딧·테마가 동작하지 않습니다 — assets/template/index.html 에서 복사하세요.`);
    else if (!original) check(`공통 블록 ${name}`, "warn", "스킬 원본(assets/template/index.html)을 찾지 못해 비교를 건너뜀");
    else check(`공통 블록 ${name} = 스킬 원본`, mine === block(original, name) ? "pass" : "warn",
      mine === block(original, name) ? "" : "원본과 다릅니다. 이 블록은 고치지 않는 곳입니다 — 일부러 고친 게 아니면 assets/template/index.html 에서 다시 복사하세요.");
  }
  // 공유 버튼 묶음도 원본 그대로여야 한다 — 서로 크기를 맞춘 아이콘이라 바꾸면 들쭉날쭉해진다
  const shareTools = (h) => (h.match(/<ul class="share-tools">[\s\S]*?<\/ul>/) || [])[0]?.replace(/\s+/g, " ");
  if (original && shareTools(html)) check("바이라인 공유 버튼 = 스킬 원본", shareTools(html) === shareTools(original) ? "pass" : "warn",
    shareTools(html) === shareTools(original) ? "" : '<ul class="share-tools"> 가 원본과 다릅니다. assets/template/index.html 에서 다시 복사하세요.');
  if (attr("data-credits") === "end") {
    const hasShow = /showCredits\s*\(/.test(ownCode);
    check('크레딧 배선 (data-credits="end" → showCredits)', hasShow ? "pass" : "fail",
      hasShow ? "" : '마지막 화면에서 hkCommon.showCredits(target) 를 부르는 곳이 없습니다. 바이라인·추천 카드가 영영 안 뜹니다 (references/structure.md).');
  }
  // 배경은 단색 — GNB 아이콘 색을 이 배경 밝기로 자동 판정한다. 실제 계산값은 qa_playwright.js 가 한 번 더 본다
  const bgBad = [];
  for (const m of ownCode.matchAll(/--bg-base\s*:\s*([^;}]+)/g)) if (/gradient\(|url\(/i.test(m[1])) bgBad.push(`--bg-base: ${m[1].trim()}`);
  for (const m of ownCode.matchAll(/(?:^|[}\s,])(html|body|\.body-wrapper)\s*(?:,[^{]*)?\{([^}]*)\}/g)) {
    const bg = (m[2].match(/background(?:-image)?\s*:\s*([^;]+)/) || [])[1];
    if (bg && /gradient\(|url\(/i.test(bg)) bgBad.push(`${m[1]} { background: ${bg.trim()} }`);
  }
  check("페이지 배경 단색 (--bg-base·html·body·.body-wrapper)", bgBad.length ? "fail" : "pass",
    bgBad.length ? `${bgBad.join(" / ")} — 이미지·그라데이션은 .body-wrapper 안의 요소에 두세요. 헤더 아이콘 색을 자동으로 정할 수 없습니다.` : "");
  const windowScroll = /window\.scrollY|window\.addEventListener\(\s*["']scroll/.test(ownCode);
  check("스크롤은 .body-wrapper 에서 읽음", windowScroll ? "warn" : "pass",
    windowScroll ? "window.scrollY / window 의 scroll 이벤트를 쓰고 있습니다. 이 템플릿은 .body-wrapper 가 스크롤 컨테이너라 동작하지 않습니다." : "");

  // 5. 폰트는 CDN 만
  const fontFiles = files.filter((f) => FONT_FILE_EXT.test(f));
  check("폰트 파일 없음 (웹폰트는 CDN hk_fonts.css 만)", fontFiles.length ? "fail" : "pass",
    fontFiles.length ? `발견: ${fontFiles.slice(0, 5).map((p) => path.relative(rootDir, p)).join(", ")} — 지우고 CDN 서체(var(--font-base)/var(--font-serif))를 쓰세요.` : "");
  const fontFace = /@font-face/.test(ownCode);
  check("@font-face 직접 선언 없음", fontFace ? "fail" : "pass", fontFace ? "CDN 2종만 씁니다. 다른 서체가 꼭 필요하면 그 글자를 이미지로 넣으세요." : "");

  // 6. 용량 — 올리는 파일만 (brief.md·qa-report 제외)
  const sizeMB = files.reduce((sum, f) => sum + fs.statSync(f).size, 0) / (1024 * 1024);
  if (sizeMB > MAX_TOTAL_SIZE_MB) check(`용량 (${MAX_TOTAL_SIZE_MB}MB 이하)`, "fail", `현재 ${sizeMB.toFixed(1)}MB`);
  else check("용량", sizeMB > 10 ? "warn" : "pass", `현재 ${sizeMB.toFixed(1)}MB${sizeMB > 10 ? " — 권장 10MB 초과, 이미지 최적화 검토" : ""}`);
}

// 7. 공유 이미지 2장 — 폴더 바로 아래에 JPG 로 있고 픽셀 크기가 정확한지
function readJpegSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null;
  for (let i = 2; i + 9 < buf.length; ) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }; // SOFn: 길이(2) 정밀도(1) 높이(2) 너비(2)
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}
for (const img of SHARE_IMAGES) {
  const label = `공유 이미지 ${img.file} (${img.label}, ${img.width}×${img.height})`;
  const file = path.join(rootDir, img.file);
  const size = fs.existsSync(file) ? readJpegSize(file) : undefined;
  if (size === undefined) check(label, "fail", `${img.file} 이 없습니다. ${img.width}×${img.height} JPG 로 만들어 index.html 옆에 두세요 — 공유 카드가 깨집니다.`);
  else if (!size) check(label, "fail", `${img.file} 이 JPG 가 아닙니다. 확장자만 바꾸지 말고 JPG 로 저장하세요.`);
  else if (size.width !== img.width || size.height !== img.height) check(label, "fail", `크기가 ${size.width}×${size.height} 입니다. 정확히 ${img.width}×${img.height} 으로 다시 만드세요.`);
  else check(label, "pass");
}

console.log(`\n=== 자가진단 결과: ${rootDir} ===\n`);
let failCount = 0;
for (const r of results) {
  console.log(`${r.status === "pass" ? "✓" : r.status === "warn" ? "!" : "✕"} ${r.label}${r.detail ? " — " + r.detail : ""}`);
  if (r.status === "fail") failCount++;
}
console.log(`\n${failCount === 0 ? "모든 필수 항목 통과 — 전달용 zip 을 만들어도 됩니다" : failCount + "개 항목 실패 — zip 을 만들기 전에 고치세요"}\n`);
process.exit(failCount === 0 ? 0 : 1);
