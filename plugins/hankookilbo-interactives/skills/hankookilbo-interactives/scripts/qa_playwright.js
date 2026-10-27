#!/usr/bin/env node
/**
 * qa_playwright.js — 데스크톱/모바일 뷰포트 스크린샷 + 콘솔 에러 체크
 *
 * 사용법:
 *   npm install playwright --no-save   (최초 1회)
 *   npx playwright install chromium    (최초 1회)
 *   node qa_playwright.js --entry ./dist/index.html --out ./qa-report [--port 3000]
 *                         [--sections ".step, .era-card"] [--anchor-mobile 0.5] [--anchor-desktop 0.5]
 *
 * --sections: 챕터(섹션) 요소 선택자. 주면 모바일·PC에서 챕터마다 한 장씩 화면을 찍는다
 *             (mobile-01.png, desktop-01.png …). 담당자 확인용 스크린샷은 이걸로 만든다.
 *             .body-wrapper가 스크롤 컨테이너라 fullPage 캡처는 마지막 화면 한 장뿐이기 때문이다.
 * --anchor-mobile / --anchor-desktop:
 *             챕터 요소의 위쪽 끝을 화면 높이의 어느 지점(0~1)에 두고 찍을지. 없으면 요소 가운데를
 *             화면 가운데에 맞춘다. 모바일에서 고정 그림이 화면 위쪽을 차지해 글이 가려지면
 *             --anchor-mobile을 그림 아래 지점(예: 0.5)으로 준다. --anchor는 둘 다에 적용.
 *
 * dist/를 http://localhost:3000 으로 잠깐 띄운 뒤(내장 정적 서버, 외부 의존성 없음)
 * 실제 브라우저(Chromium)로 열어 여러 화면 크기에서 스크린샷을 찍고, 콘솔 에러/
 * 실패한 네트워크 요청/웹폰트 로드 여부를 qa-report/report.json + 스크린샷으로
 * 저장합니다. 클로드는 이 스크린샷을 직접 보고 레이아웃 문제를 스스로 판단해서
 * 고치세요 (이 스크립트는 "찍어서 보여주기"만 하고, 시각적 판단은 하지 않습니다).
 *
 * file:// 로 열지 않는 이유: 웹폰트 CDN(assets.hankookilbo.com)이 CORS로 origin을
 * 확인하는데, file:// 의 origin은 "null"이라 폰트가 절대 안 뜹니다. localhost:3000은
 * Astro 개발 서버(astro.config.mjs server.port)와 같은 origin이라 CDN·추천 카드 API
 * 허용 목록에 등록돼 있습니다. 개발 서버가 떠 있으면 포트가 겹치니 먼저 끄세요.
 *
 */

const path = require("path");
const fs = require("fs");
const http = require("http");

const DEFAULT_PORT = 3000; // Astro 개발 서버와 동일 — CDN·추천 카드 API CORS 허용 origin
const EXPECTED_FONT_FAMILIES = ["Pretendard Variable", "NanumMyeongjo"]; // hk_fonts.css 제공 서체
const FONT_CDN_HOST = "assets.hankookilbo.com";
const SECTION_SETTLE_MS = 1800; // 챕터 전환 애니메이션(대개 0.8~1.6초)이 끝난 뒤 찍는다

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { entry: "./dist/index.html", out: "./qa-report", port: DEFAULT_PORT, sections: null, anchorMobile: null, anchorDesktop: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--entry") out.entry = args[++i];
    if (args[i] === "--out") out.out = args[++i];
    if (args[i] === "--port") out.port = Number(args[++i]) || DEFAULT_PORT;
    if (args[i] === "--sections") out.sections = args[++i];
    if (args[i] === "--anchor") out.anchorMobile = out.anchorDesktop = Number(args[++i]);
    if (args[i] === "--anchor-mobile") out.anchorMobile = Number(args[++i]);
    if (args[i] === "--anchor-desktop") out.anchorDesktop = Number(args[++i]);
  }
  return out;
}

/** dist/ 폴더를 localhost 로 잠깐 서빙하는 최소 정적 서버 */
function serveStatic(rootDir, port) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    let filePath = path.join(rootDir, urlPath);
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

/**
 * playwright는 보통 프로젝트 폴더에 설치한다 (`npm install playwright --no-save`).
 * 이 스크립트는 스킬 폴더에 있어서 그냥 require하면 프로젝트의 node_modules를 못 찾는다.
 * 그래서 현재 폴더 → 진입 파일 폴더와 그 상위(프로젝트 루트) → 스킬 폴더 순으로 찾는다.
 */
function loadPlaywright(entryPath) {
  const searchPaths = [process.cwd(), path.dirname(entryPath), path.dirname(path.dirname(entryPath)), __dirname];
  try {
    return require(require.resolve("playwright", { paths: searchPaths }));
  } catch (e) {
    return null;
  }
}

async function main() {
  const { entry, out, port, sections, anchorMobile, anchorDesktop } = parseArgs();
  const entryPath = path.resolve(entry);

  const playwright = loadPlaywright(entryPath);
  if (!playwright) {
    console.error(
      "playwright가 설치되어 있지 않습니다. 프로젝트 폴더에서 먼저 다음을 실행하세요:\n" +
      "  npm install playwright --no-save\n" +
      "  npx playwright install chromium"
    );
    process.exit(1);
  }
  const { chromium } = playwright;

  if (!fs.existsSync(entryPath)) {
    console.error(`진입 파일을 찾을 수 없습니다: ${entryPath}`);
    process.exit(1);
  }
  const rootDir = path.dirname(entryPath);
  let server;
  try {
    server = await serveStatic(rootDir, port);
  } catch (e) {
    console.error(
      `localhost:${port} 를 열 수 없습니다 (${e.code || e.message}). ` +
      `Astro 개발 서버(npm run dev)가 켜져 있으면 끄고 다시 실행하세요.`
    );
    process.exit(1);
  }
  const url = `http://localhost:${port}/${path.basename(entryPath)}`;

  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const report = { url, viewports: [], consoleErrors: [], failedRequests: [], fonts: null, embed: null };

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    const consoleErrors = [];
    const failedRequests = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("requestfailed", (req) => {
      failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
    });

    await page.goto(url, { waitUntil: "load", timeout: 15000 }).catch((e) => {
      consoleErrors.push("페이지 로드 실패: " + e.message);
    });

    // 인터랙티브 임베드(헤더 웹컴포넌트 + 추천 카드) 마운트 확인 (첫 뷰포트에서 한 번만)
    if (!report.embed) {
      await page.waitForTimeout(3000); // 임베드 로더가 프래그먼트를 fetch해 붙일 시간
      report.embed = await page
        .evaluate(() => {
          const embedScript = [...document.scripts].find((s) => /interactive-embed\.js/.test(s.src));
          const nid = embedScript ? new URL(embedScript.src).searchParams.get("Nid") : null;
          const header = document.querySelector("interactive-header");
          return {
            scriptPresent: Boolean(embedScript),
            nid,
            headerMounted: Boolean(header && header.shadowRoot),
            headerIsFirstInBody: Boolean(header && document.body.firstElementChild === header),
            // 공통영역 API (references/common-area.md) — <html data-*> 초기값
            html: ["flow", "view", "state", "gnb", "theme"].reduce((o, k) => ((o[k] = document.documentElement.dataset[k] ?? null), o), {}),
            recommendMounted: Boolean(document.querySelector("interactive-recommend")),
          };
        })
        .catch((e) => ({ error: e.message }));
    }

    // 웹폰트 로드 확인 (첫 뷰포트에서 한 번만). CDN CORS 문제면 여기서 바로 드러난다.
    if (!report.fonts) {
      report.fonts = await page
        .evaluate(async (expected) => {
          if (!document.fonts) return { supported: false };
          await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 8000))]);
          const faces = [...document.fonts];
          const byFamily = {};
          for (const f of faces) {
            const fam = f.family.replace(/^["']|["']$/g, "");
            byFamily[fam] = byFamily[fam] || { loaded: 0, error: 0, unloaded: 0 };
            byFamily[fam][f.status === "loaded" ? "loaded" : f.status === "error" ? "error" : "unloaded"]++;
          }
          return {
            supported: true,
            status: document.fonts.status,
            expected: expected.map((fam) => ({
              family: fam,
              declared: Boolean(byFamily[fam]),
              loaded: Boolean(byFamily[fam] && byFamily[fam].loaded > 0),
              error: Boolean(byFamily[fam] && byFamily[fam].error > 0),
            })),
            families: byFamily,
          };
        }, EXPECTED_FONT_FAMILIES)
        .catch((e) => ({ supported: false, error: e.message }));
    }

    // 챕터별 화면 캡처 (담당자 확인용). 태블릿은 장수를 줄이려고 건너뛴다
    const sectionShots = [];
    if (sections && vp.name !== "tablet") {
      const anchor = vp.name === "mobile" ? anchorMobile : anchorDesktop;
      const count = await page.$$eval(sections, (els) => els.length).catch(() => 0);
      if (!count) consoleErrors.push(`--sections "${sections}" 에 맞는 요소가 없습니다`);
      for (let i = 0; i < count; i++) {
        await page
          .evaluate(
            ([sel, i, anchor]) => {
              const el = document.querySelectorAll(sel)[i];
              const wrapper = document.querySelector(".body-wrapper");
              const r = el.getBoundingClientRect();
              const h = wrapper ? wrapper.clientHeight : window.innerHeight;
              const dy = anchor == null ? r.top + r.height / 2 - h / 2 : r.top - h * anchor;
              wrapper ? wrapper.scrollBy(0, dy) : window.scrollBy(0, dy);
            },
            [sections, i, Number.isFinite(anchor) ? anchor : null]
          )
          .catch(() => {});
        await page.waitForTimeout(SECTION_SETTLE_MS);
        const shot = path.join(out, `${vp.name}-${String(i + 1).padStart(2, "0")}.png`);
        await page.screenshot({ path: shot }).catch(() => {});
        sectionShots.push(shot);
      }
      // 다음 단계(끝까지 스크롤)를 위해 맨 위로
      await page.evaluate(() => (document.querySelector(".body-wrapper") || document.scrollingElement).scrollTo(0, 0)).catch(() => {});
    }

    // 스크롤 끝까지 내려보며 lazy-load 요소 및 스크롤 관련 오류 유발
    // 주의: 이 템플릿은 window가 아니라 .body-wrapper가 실제 스크롤 컨테이너다.
    // (html, body는 overflow:hidden) .body-wrapper가 없으면 구식 페이지로 보고
    // window를 fallback으로 사용한다.
    await page.evaluate(async () => {
      const container = document.querySelector(".body-wrapper") || window;
      const getScrollHeight = () =>
        container === window
          ? document.body.scrollHeight
          : container.scrollHeight;
      const doScroll = (y) =>
        container === window ? window.scrollBy(0, y) : (container.scrollTop += y);

      await new Promise((resolve) => {
        let total = 0;
        const step = 400;
        const timer = setInterval(() => {
          doScroll(step);
          total += step;
          if (total >= getScrollHeight()) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    }).catch(() => {});

    // 스크롤형: 끝에 닿았으니 wireScrollFlow 가 credits 로 바꿨어야 하고 추천 카드가 떠 있어야 한다 (첫 뷰포트에서 한 번만)
    if (report.embed && !report.embed.error && report.embed.creditsReached === undefined) {
      await page.waitForTimeout(1500);
      Object.assign(
        report.embed,
        await page
          .evaluate(() => ({
            creditsReached: document.documentElement.dataset.state === "credits",
            endGnb: document.documentElement.dataset.gnb ?? null,
            recommendVisible: Boolean(document.querySelector("interactive-recommend")?.shadowRoot?.querySelector("aside")),
          }))
          .catch(() => ({})),
      );
    }

    // .body-wrapper 구조라 fullPage도 현재 화면(= 페이지 끝, 바이라인) 한 장이 된다
    const screenshotPath = path.join(out, `${vp.name}-end.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    report.viewports.push({
      name: vp.name,
      width: vp.width,
      height: vp.height,
      screenshot: screenshotPath,
      sectionShots,
      consoleErrorCount: consoleErrors.length,
      failedRequestCount: failedRequests.length,
    });
    report.consoleErrors.push(...consoleErrors.map((m) => `[${vp.name}] ${m}`));
    report.failedRequests.push(...failedRequests.map((r) => ({ viewport: vp.name, ...r })));

    await context.close();
  }

  await browser.close();
  server.close();

  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));

  console.log(`\n=== QA 스크린샷 완료: ${out} ===`);
  report.viewports.forEach((v) => {
    console.log(`  ${v.name} (${v.width}x${v.height}): ${v.screenshot} — 콘솔에러 ${v.consoleErrorCount}건, 실패요청 ${v.failedRequestCount}건`);
    if (v.sectionShots.length) console.log(`    챕터별 ${v.sectionShots.length}장: ${v.name}-01.png ~ ${v.name}-${String(v.sectionShots.length).padStart(2, "0")}.png`);
  });
  if (report.fonts && report.fonts.supported) {
    console.log("\n웹폰트 (CDN hk_fonts.css):");
    for (const f of report.fonts.expected) {
      const mark = f.loaded ? "✓" : !f.declared || f.error ? "✕" : "-";
      const note = f.loaded
        ? "로드됨"
        : !f.declared
          ? "선언 없음 — Layout.astro에 hk_fonts.css 링크가 있는지 확인"
          : f.error
            ? "로드 실패 — CDN CORS 허용 목록(localhost:3000) 문제일 가능성. 프론트개발팀 확인"
            : "미사용 — 이 서체를 쓰는 요소가 첫 화면에 없음 (정상일 수 있음)";
      console.log(`  ${mark} ${f.family}: ${note}`);
    }
    const fontCdnFailures = report.failedRequests.filter((r) => r.url.includes(FONT_CDN_HOST));
    if (fontCdnFailures.length) {
      console.log(`  ! ${FONT_CDN_HOST} 요청 실패 ${fontCdnFailures.length}건 — 코드 문제가 아니라 CDN 허용 목록 문제입니다.`);
    }
  }
  if (report.embed && !report.embed.error) {
    const e = report.embed;
    console.log("\n인터랙티브 임베드 (interactive-embed.js):");
    if (!e.scriptPresent) {
      console.log("  ✕ 스크립트 없음 — Layout.astro <head>에 interactive-embed.js?Nid=${ARTICLE_KEY} 가 있어야 합니다.");
    } else {
      console.log(`  ${e.nid ? "✓" : "✕"} Nid=${e.nid || "(없음 — 대문자 N으로 ?Nid=${ARTICLE_KEY} 붙이기)"}`);
      const headerFetchFailed = report.failedRequests.some((r) => r.url.includes("interactive-header.html"));
      console.log(
        `  ${e.headerMounted ? "✓" : "✕"} 헤더 <interactive-header>: ${
          e.headerMounted
            ? e.headerIsFirstInBody ? "마운트됨 (body 맨 앞)" : "마운트됨 (body 맨 앞이 아님 — 다른 요소가 앞에 있음)"
            : headerFetchFailed
              ? "프래그먼트 fetch 실패 — CDN CORS 허용 목록(localhost:3000) 문제일 가능성. 프론트개발팀 확인"
              : "마운트 안 됨"
        }`
      );
      const h = e.html || {};
      const declared = ["flow", "view", "state", "gnb", "theme"].filter((k) => h[k]);
      console.log(
        `  ${declared.length === 5 ? "✓" : "✕"} 공통영역 API <html data-*>: ${
          declared.length === 5
            ? Object.entries(h).map(([k, v]) => `${k}=${v}`).join(" ")
            : `누락 ${["flow", "view", "state", "gnb", "theme"].filter((k) => !h[k]).join(", ")} — Layout.astro <html> 에 선언 (assets/template/src/layouts/Layout.astro)`
        }`
      );
      console.log(`  ${e.recommendMounted ? "✓" : "-"} 추천 카드 <interactive-recommend>: ${e.recommendMounted ? "마운트됨 (data-state=\"credits\" 에서 표시)" : "없음 (Nid 없음 또는 data-recommend=\"false\")"}`);
      if (h.flow === "scroll" && e.creditsReached !== undefined) {
        console.log(`  ${e.creditsReached ? "✓" : "✕"} 스크롤형 끝: data-state=${e.creditsReached ? "credits" : `${document_state(e)} — wireScrollFlow() 가 Layout 에서 호출되는지, 바이라인(.byline)이 있는지 확인`} / gnb=${e.endGnb}`);
        console.log(`  ${e.recommendVisible ? "✓" : "✕"} 스크롤형 끝: 추천 카드 ${e.recommendVisible ? "표시됨" : "안 보임 (후보 없음·API 실패·credits 미진입)"}`);
      } else if (h.flow === "game") {
        console.log("  - 게임형: 진행 화면 로고 버튼·끝 화면 추천 카드는 자동 확인 불가 — 담당자 확인 항목 (references/template-overview.md QA 체크리스트)");
      }
    }
  }
  if (report.consoleErrors.length) {
    console.log("\n콘솔 에러:");
    report.consoleErrors.forEach((e) => console.log("  - " + e));
  }
  if (report.failedRequests.length) {
    console.log("\n실패한 네트워크 요청:");
    report.failedRequests.forEach((r) => console.log(`  - [${r.viewport}] ${r.url} (${r.failure || ""})`));
  }
}

function document_state(e) {
  return e.creditsReached ? "credits" : "credits 아님";
}

main();
