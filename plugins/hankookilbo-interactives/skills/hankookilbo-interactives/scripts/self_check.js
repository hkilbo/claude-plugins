#!/usr/bin/env node
/**
 * self_check.js — 고정 규칙 자가진단 (외부 의존성 없음)
 *
 * 사용법: node self_check.js <프로젝트 폴더 경로>
 *
 * references/hk-interactive-template.md "0-1. 필수 요건 / 빌드 후 자동 검증"에
 * 나오는 grep 체크리스트를 그대로 구현한 것 + 이 스킬의 고정 규칙(폰트는 CDN만 사용,
 * 공유 이미지 2장(존재·PNG·픽셀 크기), 로더 이미지, 용량 상한, META.ts 실제 값)을 추가로 검사합니다.
 *
 * 주의: hk-interactive-template.md가 갱신되면(식별자 추가/변경) 아래
 * REQUIRED_DIST_KEYS도 함께 갱신해야 합니다.
 */

const fs = require("fs");
const path = require("path");

// 인터랙티브 임베드(헤더·추천 카드) CDN 호스트. 템플릿 0-1장과 같은 값이어야 한다.
// TODO(release): v2 운영 승격 후 "assets.hankookilbo.com" 으로 바꾼다
const WC_CDN_HOST = "assets-dev.hankookilbo.com";

// hk-interactive-template.md 0-1장 "빌드 후 자동 검증"과 동일한 목록
const REQUIRED_DIST_KEYS = [
  "G-HR08PM6YWZ", // GA4 — 이 스트림 하나로 통일 (개편 전 GTM/UA/다른 G-* 금지, 아래 1-0 검사)
  "code.jquery.com/jquery-3.7.1.min.js", // hkAnalTag_hub.js 가 $ 를 쓴다 — 통계 스크립트보다 앞 (아래 1-0b 순서 검사)
  "www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js", // 한국일보 통계 (Hmap 1.0), www 절대 경로
  "components/interactive-embed/v2/interactive-embed.js?Nid=", // 인터랙티브 임베드 v2 (Nid 대문자 N). v1 은 <html data-*> 를 읽지 않는다
  "addon/icon_font/iconFont.css", // 아이콘 폰트 — public/addon/icon_font/ 상대 경로 (아래 4-1 검사)
  "assets.hankookilbo.com/fonts/hk_fonts.css", // 웹폰트 CDN (템플릿 7장)
  "t1.kakaocdn.net/kakao_js_sdk/2.7.6/kakao.min.js", // 카카오 SDK v2 (인터랙티브 헤더와 동일 버전)
  "hk:nw_newsid",
  "hk:nw_pagecode",
  "og:image",
  "kakao_og_image", // 카카오 공유 카드 이미지 메타 (800×800, 인터랙티브 헤더 공유가 읽음)
  "twitter:card",
  "byline",
  "share-tools", // 바이라인 공유 4종 (ShareLinks.astro)
  "body-wrapper",
  "full-loader",
  "data-flow", // 공통영역 API 5종 — 값 검사는 아래 1-1b
  "data-view",
  "data-state",
  "data-gnb",
  "data-theme",
  "Copyright © Hankookilbo", // 바이라인 맨 끝 저작권 문구 (공통 푸터를 쓰지 않으므로 필수)
];

// 공유 메타 — 값까지 맞아야 한다. 압축기(astro-compress)가 따옴표를 빼고 속성 순서를 바꾸므로 문자열이 아니라 태그를 읽어 비교한다
const REQUIRED_METAS = [
  ["property", "og:locale", "ko_KR"],
  ["property", "og:image:width", "1200"], // 공유 카드 크기 명시 (1200×630)
  ["property", "og:image:height", "630"],
  ["name", "twitter:image:width", "1200"],
  ["name", "twitter:image:height", "630"],
];
function readMetaTags(html) {
  return (html.match(/<meta\b[^>]*>/gi) || []).map((tag) => {
    const attrs = {};
    for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4];
    }
    return attrs;
  });
}

// META.ts에 남아있으면 안 되는 템플릿 기본값(=아직 안 채운 상태) 표시
const META_PLACEHOLDER_MARKERS = [
  "{FOLDER_NAME}",
  "인터랙티브 제목",
  "OOO",
  "A0000000000000000000",
];

const MAX_TOTAL_SIZE_MB = 80; // 넉넉한 상한. 템플릿 권장치(10MB)는 별도 안내만.

// 폰트는 사내 CDN(hk_fonts.css)만 쓴다. 프로젝트 안에 폰트 파일/@font-face가 있으면 실패.
// 예외: 스킬이 주는 아이콘 폰트 (public/addon/icon_font/ → dist/addon/icon_font/)
const FONT_FILE_EXT = /\.(woff2?|ttf|otf|eot)$/i;
const ICON_FONT_DIR = ["addon", "icon_font"];
const ICON_FONT_FILES = ["iconFont.css", "fonts/hk.woff", "fonts/hk.ttf"];
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

// 1-0a. 공유 메타 값 (og:locale, og/twitter 이미지 크기) + 바이라인 공유 버튼
if (fs.existsSync(distIndex)) {
  const html = fs.readFileSync(distIndex, "utf-8");
  const metas = readMetaTags(html);
  const missingMetas = REQUIRED_METAS.filter(([attr, key, value]) => !metas.some((m) => m[attr] === key && m.content === value))
    .map(([attr, key, value]) => `<meta ${attr}="${key}" content="${value}">`);
  check("공유 메타 (og:locale ko_KR, og·twitter 이미지 1200×630)", missingMetas.length ? "fail" : "pass",
    missingMetas.length ? `누락 또는 값 다름: ${missingMetas.join(", ")} — 템플릿 5장 Layout 원문을 확인하세요.` : "");
  const shareKinds = ["fb", "twt", "kkt", "url"].filter((k) => !new RegExp(`data-share=["']?${k}\\b`).test(html));
  check("바이라인 공유 4종 (ShareLinks.astro)", shareKinds.length ? "fail" : "pass",
    shareKinds.length ? `빠진 버튼: ${shareKinds.join(", ")} — 템플릿 6장 ShareLinks.astro 를 바이라인에 넣으세요.` : "");
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
  // jQuery 가 통계 스크립트보다 뒤면 hkAnalTag_hub.js 가 `$ is not defined` 로 멈춰 Hmap 수집이 안 된다 (운영 페이지에서 실측)
  const jqueryAt = html.indexOf("code.jquery.com/jquery-3.7.1.min.js");
  const hubAt = html.indexOf("www.hankookilbo.com/Inc/Js/hkAnalTag_hub.js");
  if (jqueryAt >= 0 && hubAt >= 0) {
    check("jQuery 가 통계 스크립트(hkAnalTag_hub.js)보다 앞", jqueryAt < hubAt ? "pass" : "fail",
      jqueryAt < hubAt ? "" : "hkAnalTag_hub.js 가 jQuery 보다 먼저 실행됩니다. Layout.astro 에서 jquery-3.7.1.min.js <script> 를 hkAnalTag_hub.js 앞으로 옮기세요.");
  }
  // hkFunc.js 의 shareKakaotalk 가 쓰는 Kakao.Link 는 SDK v1 API — v2(2.7.6) 에서는 없어서 호출하면 오류
  const kakaoV1Api = /Kakao\.Link\b/.test(html);
  check("카카오 v1 API(Kakao.Link) 미사용", kakaoV1Api ? "fail" : "pass",
    kakaoV1Api ? "Kakao.Link 호출이 있습니다 (hkFunc.js 등). SDK v2 에서는 Kakao.Share.sendDefault 를 씁니다 — 템플릿 6장 ShareLinks.astro 를 쓰세요." : "");
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

// 1-1b. 공통영역 API: <html> 에 data-flow / data-view / data-state="intro" / data-gnb="transparent" / data-theme 가 허용값으로 있는지 (템플릿 0-1장)
// 압축기가 따옴표를 뺄 수 있어 태그를 읽어 속성별로 본다. 이 값이 없으면 헤더는 기본값(투명 고정)으로만 서고 추천 카드는 안 뜬다
const HTML_ATTRS = {
  "data-flow": ["scroll", "game"],
  "data-view": ["normal", "mobile"],
  "data-state": ["intro"],
  "data-gnb": ["transparent"],
  "data-theme": ["light", "dark"],
};
let htmlDataset = {};
if (fs.existsSync(distIndex)) {
  const html = fs.readFileSync(distIndex, "utf-8");
  const htmlTag = (html.match(/<html\b[^>]*>/i) || [""])[0];
  const bad = [];
  for (const [attr, allowed] of Object.entries(HTML_ATTRS)) {
    const v = (htmlTag.match(new RegExp(`\\b${attr}=["']?([^"'\\s>]*)`, "i")) || [])[1];
    htmlDataset[attr] = v;
    if (v === undefined) bad.push(`${attr} 없음`);
    else if (!allowed.includes(v)) bad.push(`${attr}="${v}" (허용: ${allowed.join("|")})`);
  }
  check("공통영역 API <html data-*> 5종", bad.length ? "fail" : "pass",
    bad.length
      ? `${bad.join(", ")} — Layout.astro 의 <html> 에 data-flow={FLOW} data-view={VIEW} data-state="intro" data-gnb="transparent" data-theme={THEME} 를 선언하세요 (템플릿 5장).`
      : Object.entries(htmlDataset).map(([k, v]) => `${k.slice(5)}=${v}`).join(" "));
}

// 1-1c. 임베드 CDN 호스트는 WC_CDN_HOST 하나만. 다른 환경 주소가 섞이면 배포 페이지가 엉뚱한 서버를 부른다
if (fs.existsSync(distIndex)) {
  const html = fs.readFileSync(distIndex, "utf-8");
  const hosts = [...new Set((html.match(/assets(?:-dev|-stg)?\.hankookilbo\.com(?=\/components\/)/g) || []))];
  const wrong = hosts.filter((h) => h !== WC_CDN_HOST);
  check(`임베드 CDN 호스트 = ${WC_CDN_HOST}`, wrong.length ? "fail" : "pass",
    wrong.length ? `다른 CDN 주소가 있습니다: ${wrong.join(", ")} — https://${WC_CDN_HOST} 로 바꾸세요 (템플릿 0-1장).` : "");
}

// 1-2. 테마: <html data-theme> · class="dark" 유무 · 페이지 배경($bgBase) 밝기 셋이 같은 쪽인지 (템플릿 0-1장 "공통영역 API")
// 소스는 META.ts 의 THEME 하나다. 어긋나면 코드 오류이고, 헤더 로고가 배경과 같은 색이 돼 안 보인다
const DARK_BG_LUMINANCE_MAX = 0.5; // 0(검정) ~ 1(흰색). 이보다 어두우면 다크 배경으로 본다
const variablesPath = path.join(rootDir, "src", "styles", "_variables.sass");
if (fs.existsSync(distIndex) && fs.existsSync(variablesPath)) {
  const html = fs.readFileSync(distIndex, "utf-8");
  const htmlTag = (html.match(/<html\b[^>]*>/i) || [""])[0];
  const htmlClass = (htmlTag.match(/\bclass=["']?([^"'>]*)/i) || [])[1] || "";
  const hasDark = /(^|\s)dark(\s|$)/.test(htmlClass);
  const themeAttr = htmlDataset["data-theme"];
  const bgHex = (fs.readFileSync(variablesPath, "utf-8").match(/\$bgBase:\s*#([0-9a-f]{3}|[0-9a-f]{6})\b/i) || [])[1];
  if (!bgHex) {
    check("테마(<html class=\"dark\">)와 배경색 일치", "warn", "_variables.sass에서 $bgBase(#hex)를 읽지 못해 확인을 건너뜀. 배경이 어두우면 <html class=\"dark\">인지 직접 확인하세요.");
  } else {
    const full = bgHex.length === 3 ? bgHex.split("").map((c) => c + c).join("") : bgHex;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const bgIsDark = 0.2126 * r + 0.7152 * g + 0.0722 * b < DARK_BG_LUMINANCE_MAX;
    const themeIsDark = themeAttr === "dark";
    const ok = bgIsDark === hasDark && bgIsDark === themeIsDark;
    check("테마(data-theme · class=\"dark\" · $bgBase) 일치", ok ? "pass" : "fail",
      ok ? `$bgBase #${bgHex} → ${themeAttr}`
        : `$bgBase #${bgHex}(${bgIsDark ? "어두움" : "밝음"}), data-theme="${themeAttr || "없음"}", class="dark" ${hasDark ? "있음" : "없음"} — 셋이 다릅니다. META.ts 의 THEME 을 배경에 맞추세요 (Layout 이 data-theme 과 class 를 THEME 에서 만듭니다).`);
  }
}

// 1-2b. 형식별 배선: 스크롤형은 Layout 이 wireScrollFlow() 를, 게임형은 화면 전환이 setCommon({state:"credits"}) 를 써야 추천 카드가 뜬다 (템플릿 8장·10장 패턴 E)
{
  const layoutPath = path.join(rootDir, "src", "layouts", "Layout.astro");
  const flow = htmlDataset["data-flow"];
  if (flow && fs.existsSync(layoutPath)) {
    const layout = fs.readFileSync(layoutPath, "utf-8");
    const hasWire = /wireScrollFlow\s*\(/.test(layout);
    if (flow === "scroll") {
      check("스크롤형 배선 (Layout wireScrollFlow)", hasWire ? "pass" : "fail",
        hasWire ? "" : 'Layout.astro 에 `if (FLOW === "scroll") wireScrollFlow();` 가 없습니다. 내려도 GNB 가 안 숨고 추천 카드가 안 뜹니다 (템플릿 5장·8장).');
    } else {
      const srcFiles = [];
      const walk = (dir) => { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); fs.statSync(p).isDirectory() ? walk(p) : /\.(astro|tsx?|jsx?)$/.test(f) && srcFiles.push(p); } };
      walk(path.join(rootDir, "src"));
      const hasCredits = srcFiles.some((f) => { const t = fs.readFileSync(f, "utf-8"); return /setCommon\s*\(/.test(t) && /["']credits["']/.test(t); });
      check("게임형 배선 (setCommon credits)", hasCredits ? "pass" : "fail",
        hasCredits ? "" : '끝 화면 전환에 `setCommon({ state: "credits", gnb: "transparent" })` 가 없습니다. 추천 카드가 영영 안 뜹니다 (템플릿 10장 패턴 E).');
    }
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

// 4-0. 공유 이미지 2장 — 파일이 있고 PNG 이며 픽셀 크기가 정확한지 (템플릿 11장)
const SHARE_IMAGES = [
  { file: "ogimage.png", width: 1200, height: 630, label: "페이스북·X" },
  { file: "ogimage_kakao.png", width: 800, height: 800, label: "카카오톡" },
];
function readPngSize(file) {
  const buf = fs.readFileSync(file);
  const isPng = buf.length > 24 && buf.toString("hex", 0, 8) === "89504e470d0a1a0a" && buf.toString("ascii", 12, 16) === "IHDR";
  return isPng ? { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) } : null;
}
for (const img of SHARE_IMAGES) {
  const label = `공유 이미지 ${img.file} (${img.label}, ${img.width}×${img.height})`;
  const file = path.join(rootDir, "public", "img", img.file);
  if (!fs.existsSync(file)) {
    check(label, "fail", `public/img/${img.file} 이 없습니다. ${img.width}×${img.height} PNG 로 만들어 올리세요 — 공유 카드가 깨집니다.`);
    continue;
  }
  const size = readPngSize(file);
  if (!size) {
    check(label, "fail", `public/img/${img.file} 이 PNG 가 아닙니다. 확장자만 바꾸지 말고 PNG 로 저장하세요.`);
    continue;
  }
  if (size.width !== img.width || size.height !== img.height) {
    check(label, "fail", `크기가 ${size.width}×${size.height} 입니다. 정확히 ${img.width}×${img.height} 으로 다시 만드세요.`);
    continue;
  }
  // 배포되는 건 dist/ 다 — public/ 에만 있고 dist/ 에 없으면(빌드 전 추가, 빌드 생략) 공유 카드가 깨진다
  const distFile = path.join(rootDir, "dist", "img", img.file);
  if (!fs.existsSync(distFile)) {
    check(label, "fail", `public/img/${img.file} 은 맞는데 dist/img/${img.file} 이 없습니다. npm run build 를 다시 실행하세요.`);
    continue;
  }
  // 바이트 크기는 비교하지 않는다 — 압축기(astro-compress)가 PNG 를 다시 압축한다. 픽셀 크기와 빌드 시점으로 본다
  const distSize = readPngSize(distFile);
  if (!distSize || distSize.width !== img.width || distSize.height !== img.height) {
    check(label, "fail", `dist/img/${img.file} 크기가 ${distSize ? distSize.width + "×" + distSize.height : "읽을 수 없음"} 입니다. npm run build 를 다시 실행하세요.`);
  } else if (fs.statSync(distFile).mtimeMs < fs.statSync(file).mtimeMs) {
    check(label, "fail", `public/img/${img.file} 이 마지막 빌드 뒤에 바뀌었습니다. npm run build 를 다시 실행하세요.`);
  } else {
    check(label, "pass", "public/·dist/ 모두 확인");
  }
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

// 4-1. 아이콘 폰트 — 프로젝트 안에 있고, 상대 경로로 링크하는지 (CDN 링크는 로컬에서 CORS 로 아이콘이 빈 네모)
{
  const missingIcon = ["public", "dist"].flatMap((top) =>
    ICON_FONT_FILES.map((f) => path.join(top, ...ICON_FONT_DIR, f)).filter((rel) => !fs.existsSync(path.join(rootDir, rel)))
  );
  check("아이콘 폰트 (public/·dist/ addon/icon_font/)", missingIcon.length ? "fail" : "pass",
    missingIcon.length
      ? `누락: ${missingIcon.slice(0, 4).join(", ")}${missingIcon.length > 4 ? ` 외 ${missingIcon.length - 4}개` : ""} — 스킬의 assets/addon 을 public/ 에 복사(cp -r assets/addon public/)하고 npm run build 를 다시 실행하세요.`
      : "");
  if (fs.existsSync(distIndex)) {
    const html = fs.readFileSync(distIndex, "utf-8");
    const cdnLink = /interactive\.hankookilbo\.com\/addon\/icon_font\/iconFont\.css/.test(html);
    check("아이콘 폰트 상대 경로 링크", cdnLink ? "fail" : "pass",
      cdnLink ? "iconFont.css 를 CDN 주소로 링크하고 있습니다. 로컬에서 CORS 로 아이콘이 안 뜹니다 — ./addon/icon_font/iconFont.css 로 바꾸세요." : "");
  }
}

// 5. 폰트는 CDN만 — 프로젝트/산출물 안에 폰트 파일이나 @font-face가 있으면 실패
const projectFiles = ["public", "src", "dist"]
  .map((d) => path.join(rootDir, d))
  .filter((d) => fs.existsSync(d))
  .flatMap((d) => getAllFiles(d));
const isIconFont = (f) => path.relative(rootDir, f).split(path.sep).slice(1, 3).join("/") === ICON_FONT_DIR.join("/");
const fontFiles = projectFiles.filter((f) => FONT_FILE_EXT.test(f) && !isIconFont(f));
check(
  "폰트 파일 없음 (웹폰트는 CDN hk_fonts.css만, 아이콘 폰트 제외)",
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
