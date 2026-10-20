// 패턴 F 의 <script> — 게임형이면 바깥 GNB 가 브라우저 테마를 따르고, 안내가 떠 있는 동안 시계를 멈춘다
import { syncOuterTheme } from "../lib/js/_comm/hkCommon.js";
import { FLOW, THEME } from "../utils/constant/META";
if (FLOW === "game") syncOuterTheme(THEME);
const tooSmall = matchMedia("(min-width: 690px) and (max-width: 1279.98px) and (max-height: 563.98px), (min-width: 1280px) and (max-height: 575.98px)");
const syncSmall = () => window.gameClock?.hold("small", tooSmall.matches);
tooSmall.addEventListener("change", syncSmall); syncSmall();
