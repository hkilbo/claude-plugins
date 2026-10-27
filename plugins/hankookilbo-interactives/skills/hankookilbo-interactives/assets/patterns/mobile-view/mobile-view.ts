// 패턴 F 의 <script> (index.astro). 게임형일 때만: 폭 481 이상에서 바깥 GNB 가 브라우저 라이트/다크를 따른다.
// 스크롤형 모바일뷰는 할 일이 없다 — Layout 의 wireScrollFlow() 가 .shell 안 스크롤과 바이라인 위치를 맡는다.
// "화면이 너무 작아요" 안내는 CSS 가 띄운다. 타이머가 있는 게임이면 createPause() 가 그동안 멈춘다 (패턴 E).
import { syncOuterTheme } from "../lib/js/_comm/hkCommon.js";
import { FLOW, THEME } from "../utils/constant/META";

if (FLOW === "game") syncOuterTheme(THEME);
