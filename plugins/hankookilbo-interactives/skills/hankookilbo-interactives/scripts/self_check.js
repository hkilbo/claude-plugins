#!/usr/bin/env node
/**
 * self_check.js — 고정 규칙 자가진단 (외부 의존성 없음)
 *
 * 사용법: node self_check.js <프로젝트 폴더 경로>
 *
 * references/hk-interactive-template.md "0-1. 필수 요건 / 빌드 후 자동 검증"에
 * 나오는 grep 체크리스트를 그대로 구현한 것 + 이 스킬의 고정 규칙(폰트는 CDN만 사용,
 * 로더 이미지, 용량 상한, META.ts 실제 값)을 추가로 검사합니다.
 *
 * 주의: hk-interactive-template.md가 갱신되면(식별자 추가/변경) 아래
 * REQUIRED_DIST_KEYS도 함께 갱신해야 합니다.
 */

const fs = require("fs");
const path = require("path");

// hk-interactive-template.md 0-1장 "빌드 후 자동 검증"과 동일한 목록
const REQUIRED_DIST_KEYS = [
  "G-HR08PM6YWZ", // GA4 — 이 스트림 하나로 통일 (개편 전 GTM/UA/다른 G-* 금지, 아래 1-0 검사)
  "www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js", // 한국일보 통계 (Hmap 1.0), www 절대 경로
  "components/interactive-embed/v1/interactive-embed.js?Nid=", // 인터랙티브 임베드 (Nid 대문자 N)
  "iconFont.css",
  "assets.hankookilbo.com/fonts/hk_fonts.css", // 웹폰트 CDN (템플릿 7장)
  "t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js", // 카카오 SDK v2 (인터랙티브 헤더와 동일 버전)
  "hk:nw_newsid",
  "hk:nw_pagecode",
  "og:image",
  "kakao_og_image", // 카카오 공유 카드 이미지 메타 (인터랙티브 헤더 공유가 읽음)
  "twitter:card",
  "byline",
  "body-wrapper",
  "full-loader",
  "Copyright © Hankookilbo", // 바이라인 맨 끝 저작권 문구 (공통 푸터를 쓰지 않으므로 필수)
];

// META.ts에 남아있으면 안 되는 템플릿 기본값(=아직 안 채운 상태) 표시
const META_PLACEHOLDER_MARKERS = [
  "{FOLDER_NAME}",
  "인터랙티브 제목",
  "OOO",
  "A0000000000000000000",
];

const MAX_TOTAL_SIZE_MB = 80; // 넉넉한 상한. 템플릿 권장치(10MB)는 별도 안내만.

// 폰트는 사내 CDN(hk_fonts.css)만 쓴다. 프로젝트 안에 폰트 파일/@font-face가 있으면 실패.
const FONT_FILE_EXT = /\.(woff2?|ttf|otf|eot)$/i;
const STYLE_FILE_EXT = /\.(sass|scss|css|astro|tsx|jsx)$/i;

const rootDir = process.argv[2];
if (!rootDir) {
  console.error("사용법: node self_check.js <프로젝트 폴더 경로>");
  process.exit(1);
}
if (!fs.existsSync(rootDir)) {
  console.error(`폴더를 찾을 수 없습니다: ${rootDir}`);
  process.exit(1);
}

const results = [];
function check(label, status, detail) {
  // status: "pass" | "fail" | "warn"
  results.push({ label, status, detail: detail || "" });
}

function getAllFiles(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".astro"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) getAllFiles(full, list);
    else list.push(full);
  }
  return list;
}

// 1. dist/index.html 존재
const distIndex = path.join(rootDir, "dist", "index.html");
if (!fs.existsSync(distIndex)) {
  check("dist/index.html 존재", "fail", "npm run build를 먼저 실행하세요.");
} else {
  check("dist/index.html 존재", "pass");

  const html = fs.readFileSync(distIndex, "utf-8");
  const missingKeys = REQUIRED_DIST_KEYS.filter((k) => !html.includes(k));
  check(
    "필수 식별자 " + REQUIRED_DIST_KEYS.length + "종 (GA4/카카오/한국일보 통계/공통요소)",
    missingKeys.length === 0 ? "pass" : "fail",
    missingKeys.length ? `누락: ${missingKeys.join(", ")}` : ""
  );
}

// 1-0. 금지 항목: 카카오 SDK v1, 개편 전 통계 스크립트, 자체 헤더(구 ArticleBar)
if (fs.existsSync(distIndex)) {
  const html = fs.readFileSync(distIndex, "utf-8");
  const v1 = /developers\.kakao\.com\/sdk\/js\/kakao\.min\.js/.test(html);
  check("카카오 SDK v1 미사용", v1 ? "fail" : "pass",
    v1 ? "developers.kakao.com/sdk/js/kakao.min.js 가 있습니다. 인터랙티브 헤더의 v2와 충돌하므로 제거하고 Layout의 v2(t1.kakaocdn.net …/2.7.6)만 쓰세요." : "");
  const legacyAnalytics = [...new Set(html.match(/GTM-59599H7|UA-53476308-\d|G-ZPZ8BHZPSJ|G-BZHTEE2B8L|hkFunc\.js/g) || [])];
  check("개편 전 통계 스크립트 없음 (GA4는 G-HR08PM6YWZ 하나)", legacyAnalytics.length ? "fail" : "pass",
    legacyAnalytics.length ? `개편 전 식별자가 있습니다: ${legacyAnalytics.join(", ")} — Layout.astro에서 지우고 템플릿 5장의 gtag 스니펫(G-HR08PM6YWZ)과 hkAnalTag_hub.js만 두세요.` : "");
  const ownHeader = /class="article-bar"/.test(html);
  check("자체 헤더(article-bar) 없음", ownHeader ? "fail" : "pass",
    ownHeader ? "헤더는 interactive-embed.js가 붙이는 <interactive-header> 하나만 씁니다. article-bar 를 제거하세요." : "");
}

// 1-1. interactive-embed.js?Nid= 값이 META.ts의 ARTICLE_KEY와 같은지
const metaPathForNid = path.join(rootDir, "src", "utils", "constant", "META.ts");
if (fs.existsSync(distIndex) && fs.existsSync(metaPathForNid)) {
  const html = fs.readFileSync(distIndex, "utf-8");
  const metaSrc = fs.readFileSync(metaPathForNid, "utf-8");
  const articleKey = (metaSrc.match(/ARTICLE_KEY\s*=\s*["'`]([^"'`]+)["'`]/) || [])[1];
  const nids = [...html.matchAll(/interactive-embed\.js\?Nid=([A-Za-z0-9]*)/g)].map((m) => m[1]);
  const lowerCase = /interactive-embed\.js\?nid=/i.test(html) && nids.length === 0;
  if (lowerCase) {
    check("인터랙티브 임베드 Nid 파라미터", "fail", "파라미터 이름이 대문자 N(`Nid`)이 아닙니다. 스크립트가 `nid`는 읽지 않습니다.");
  } else if (nids.length === 0) {
    check("인터랙티브 임베드 Nid 파라미터", "fail", "interactive-embed.js에 ?Nid= 가 없습니다. Layout.astro에서 `?Nid=${ARTICLE_KEY}`로 붙이세요.");
  } else if (!articleKey || nids.some((n) => n !== articleKey)) {
    check("인터랙티브 임베드 Nid = META.ts ARTICLE_KEY", "fail", `dist의 Nid(${nids.join(", ")})와 META.ts ARTICLE_KEY(${articleKey || "없음"})가 다릅니다. Nid를 하드코딩하지 말고 \${ARTICLE_KEY}를 쓰세요.`);
  } else if (!/^A\d{19}$/.test(articleKey)) {
    check("인터랙티브 임베드 Nid = META.ts ARTICLE_KEY", "warn", `형식이 A+19자리가 아닙니다 (${articleKey}). 기사키 미발급 상태면 COMPLETION.md에 남기세요.`);
  } else {
    check("인터랙티브 임베드 Nid = META.ts ARTICLE_KEY", "pass", articleKey);
  }
}

// 1-1b. 임베드 스크립트에 data-scroll-container=".body-wrapper"가 있는지
// 없으면 헤더가 .body-wrapper 스크롤을 따라 숨지 않고, 추천 카드가 본문 끝에서 뜨지 않는다
// 빌드 압축으로 따옴표가 빠질 수 있어 문자열 목록(REQUIRED_DIST_KEYS)이 아니라 정규식으로 본다
if (fs.existsSync(distIndex)) {
  const html = fs.readFileSync(distIndex, "utf-8");
  const embedTag = (html.match(/<script\b[^>]*interactive-embed\.js[^>]*>/i) || [])[0];
  if (embedTag) {
    const ok = /\bdata-scroll-container=(["']?)\.body-wrapper\1(?=[\s>])/i.test(embedTag);
    check("인터랙티브 임베드 data-scroll-container", ok ? "pass" : "fail",
      ok ? ".body-wrapper"
        : '임베드 스크립트에 data-scroll-container=".body-wrapper"가 없거나 값이 다릅니다. Layout.astro의 interactive-embed.js <script>에 그대로 붙이세요.');
  }
}

// 1-1c. CDN은 운영(assets.hankookilbo.com)만. dev·stg 주소가 남아 있으면 배포 페이지가 개발 서버를 부른다
if (fs.existsSync(distIndex)) {
  const html = fs.readFileSync(distIndex, "utf-8");
  const nonProd = [...new Set(html.match(/assets-(?:dev|stg)\.hankookilbo\.com[^"'\s>]*/g) || [])];
  check("CDN 운영 주소만 사용 (assets-dev/stg 없음)", nonProd.length ? "fail" : "pass",
    nonProd.length ? `개발·스테이징 CDN 주소가 있습니다: ${nonProd.join(", ")} — https://assets.hankookilbo.com 으로 바꾸세요 (템플릿 0-1장).` : "");
}

// 1-2. 테마: <html>의 dark 클래스가 페이지 배경($bgBase) 밝기와 맞는지 (템플릿 0-1장 "테마")
// 어긋나면 인터랙티브 헤더 로고가 배경과 같은 색이 돼 안 보인다
const DARK_BG_LUMINANCE_MAX = 0.5; // 0(검정) ~ 1(흰색). 이보다 어두우면 다크 배경으로 본다
const variablesPath = path.join(rootDir, "src", "styles", "_variables.sass");
if (fs.existsSync(distIndex) && fs.existsSync(variablesPath)) {
  const html = fs.readFileSync(distIndex, "utf-8");
  const htmlTag = (html.match(/<html\b[^>]*>/i) || [""])[0];
  const htmlClass = (htmlTag.match(/\bclass=["']?([^"'>]*)/i) || [])[1] || "";
  const hasDark = /(^|\s)dark(\s|$)/.test(htmlClass);
  const bgHex = (fs.readFileSync(variablesPath, "utf-8").match(/\$bgBase:\s*#([0-9a-f]{3}|[0-9a-f]{6})\b/i) || [])[1];
  if (!bgHex) {
    check("테마(<html class=\"dark\">)와 배경색 일치", "warn", "_variables.sass에서 $bgBase(#hex)를 읽지 못해 확인을 건너뜀. 배경이 어두우면 <html class=\"dark\">인지 직접 확인하세요.");
  } else {
    const full = bgHex.length === 3 ? bgHex.split("").map((c) => c + c).join("") : bgHex;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const bgIsDark = 0.2126 * r + 0.7152 * g + 0.0722 * b < DARK_BG_LUMINANCE_MAX;
    const ok = bgIsDark === hasDark;
    check("테마(<html class=\"dark\">)와 배경색 일치", ok ? "pass" : "warn",
      ok ? `$bgBase #${bgHex} → ${hasDark ? "dark" : "light"}`
        : bgIsDark
          ? `$bgBase #${bgHex}는 어두운데 <html>에 class="dark"가 없습니다. 헤더 로고가 검은색이라 안 보입니다. Layout.astro의 <html>에 class="dark"를 넣으세요.`
          : `$bgBase #${bgHex}는 밝은데 <html>에 class="dark"가 있습니다. 헤더 로고가 흰색이라 안 보입니다. class="dark"를 빼세요.`);
  }
}

// 1-3. 로딩 화면(body.loading)이 떠 있는 동안 인터랙티브 헤더를 가리는 규칙 (템플릿 0-1장 "헤더" 예외, 7장 _full_loader.sass)
// 헤더는 .body-wrapper 밖에 fixed(z-index 650)로 붙어서 로더의 z-index로는 덮이지 않는다
const fullLoaderPath = path.join(rootDir, "src", "styles", "_full_loader.sass");
if (fs.existsSync(fullLoaderPath)) {
  const src = fs.readFileSync(fullLoaderPath, "utf-8");
  const ok = /body\.loading\s+interactive-header\s*\n\s*opacity:\s*0\s*!important/.test(src);
  check("로딩 중 인터랙티브 헤더 숨김 (_full_loader.sass)", ok ? "pass" : "fail",
    ok ? "" : "_full_loader.sass에 `body.loading interactive-header` / `opacity: 0 !important` 규칙이 없거나 !important가 빠졌습니다. 스피너 위에 헤더가 겹쳐 보입니다 (visibility는 헤더 내부가 되돌리므로 opacity + !important 필수). 템플릿 7장 원문을 그대로 넣으세요.");
} else {
  check("로딩 중 인터랙티브 헤더 숨김 (_full_loader.sass)", "warn", "src/styles/_full_loader.sass를 찾을 수 없어 확인을 건너뜀");
}

// 2. astro.config.mjs에 outDir 지정 여부 (금지)
const astroConfigPath = path.join(rootDir, "astro.config.mjs");
if (fs.existsSync(astroConfigPath)) {
  const cfg = fs.readFileSync(astroConfigPath, "utf-8");
  check("astro.config.mjs에 outDir 미지정", /outDir/.test(cfg) ? "fail" : "pass",
    /outDir/.test(cfg) ? "outDir이 지정되어 있습니다. 산출물은 항상 dist/ 여야 합니다." : "");
  // 로컬 포트 3000 고정 (CDN·추천 카드 API CORS 허용 origin). 상수로 빼 둔 경우(LOCAL_PORT = 3000)도 인정
  const portOk = /port:\s*3000\b/.test(cfg) || (/port:\s*LOCAL_PORT\b/.test(cfg) && /LOCAL_PORT\s*=\s*3000\b/.test(cfg));
  check("astro.config.mjs 로컬 포트 3000", portOk ? "pass" : "warn",
    portOk ? "" : "server.port가 3000이 아닙니다. 기본값 4321로 띄우면 추천 카드 API가 CORS로 막힙니다. 템플릿 3장처럼 server: { port: 3000 }을 넣으세요.");
} else {
  check("astro.config.mjs 존재", "warn", "astro.config.mjs를 찾을 수 없어 outDir 체크를 건너뜀");
}

// 3. META.ts 값이 실제로 채워졌는지 (템플릿 기본값 잔존 여부)
const metaPath = path.join(rootDir, "src", "utils", "constant", "META.ts");
if (!fs.existsSync(metaPath)) {
  check("META.ts 존재", "fail", "src/utils/constant/META.ts를 찾을 수 없습니다.");
} else {
  const meta = fs.readFileSync(metaPath, "utf-8");
  const leftover = META_PLACEHOLDER_MARKERS.filter((m) => meta.includes(m));
  check(
    "META.ts 값이 실제 값으로 채워짐",
    leftover.length === 0 ? "pass" : "fail",
    leftover.length ? `템플릿 기본값이 남아있음: ${leftover.join(", ")}` : ""
  );
}

// 4. 로더 이미지 존재 (스킬 assets/common/에서 복사)
const loaderFiles = ["full_loader_bg.png", "full_loader_spinner.png"].map((f) =>
  path.join(rootDir, "public", "img", "common", f)
);
const missingLoader = loaderFiles.filter((f) => !fs.existsSync(f));
check(
  "로더 이미지 2개 존재 (public/img/common/)",
  missingLoader.length === 0 ? "pass" : "fail",
  missingLoader.length
    ? `누락: ${missingLoader.map((p) => path.relative(rootDir, p)).join(", ")} — 스킬의 assets/common/에서 복사하세요.`
    : ""
);

// 5. 폰트는 CDN만 — 프로젝트/산출물 안에 폰트 파일이나 @font-face가 있으면 실패
const projectFiles = ["public", "src", "dist"]
  .map((d) => path.join(rootDir, d))
  .filter((d) => fs.existsSync(d))
  .flatMap((d) => getAllFiles(d));
const fontFiles = projectFiles.filter((f) => FONT_FILE_EXT.test(f));
check(
  "폰트 파일 없음 (폰트는 CDN hk_fonts.css만 사용)",
  fontFiles.length === 0 ? "pass" : "fail",
  fontFiles.length
    ? `발견: ${fontFiles.slice(0, 5).map((p) => path.relative(rootDir, p)).join(", ")}${fontFiles.length > 5 ? ` 외 ${fontFiles.length - 5}개` : ""} — 삭제하고 CDN 서체($fontBase/$fontSerif)를 쓰세요.`
    : ""
);
const fontFaceFiles = projectFiles
  .filter((f) => f.startsWith(path.join(rootDir, "src")) && STYLE_FILE_EXT.test(f))
  .filter((f) => /@font-face/.test(fs.readFileSync(f, "utf-8")));
check(
  "@font-face 직접 선언 없음",
  fontFaceFiles.length === 0 ? "pass" : "fail",
  fontFaceFiles.length
    ? `발견: ${fontFaceFiles.map((p) => path.relative(rootDir, p)).join(", ")} — 서체 추가는 프론트개발팀에 hk_fonts.css 반영 요청.`
    : ""
);

// 6. 용량 (참고용 — 상한 초과만 fail, 템플릿 권장치 10MB 초과는 warn)
const distDir = path.join(rootDir, "dist");
const totalBytes = (fs.existsSync(distDir) ? getAllFiles(distDir) : []).reduce(
  (sum, f) => (fs.existsSync(f) ? sum + fs.statSync(f).size : sum), 0
);
const sizeMB = totalBytes / (1024 * 1024);
if (sizeMB > MAX_TOTAL_SIZE_MB) {
  check(`dist/ 용량 (${MAX_TOTAL_SIZE_MB}MB 이하)`, "fail", `현재 ${sizeMB.toFixed(1)}MB`);
} else if (sizeMB > 10) {
  check("dist/ 용량 (템플릿 권장치 10MB)", "warn", `현재 ${sizeMB.toFixed(1)}MB — 이미지 최적화 검토`);
} else {
  check(`dist/ 용량`, "pass", `현재 ${sizeMB.toFixed(1)}MB`);
}

// 결과 출력
console.log(`\n=== 자가진단 결과: ${rootDir} ===\n`);
let failCount = 0;
for (const r of results) {
  const mark = r.status === "pass" ? "✓" : r.status === "warn" ? "!" : "✕";
  console.log(`${mark} ${r.label}${r.detail ? " — " + r.detail : ""}`);
  if (r.status === "fail") failCount++;
}
console.log(`\n${failCount === 0 ? "모든 필수 항목 통과 — 배포 준비 완료" : failCount + "개 항목 실패 — 배포 전 수정 필요"}\n`);

process.exit(failCount === 0 ? 0 : 1);
