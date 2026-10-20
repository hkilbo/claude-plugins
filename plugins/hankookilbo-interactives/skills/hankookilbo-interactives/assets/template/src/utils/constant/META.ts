//@ts-nocheck

export const HTML_TITLE = "인터랙티브 제목";
export const HTML_DESC = "공유 시 노출되는 한 줄 설명 (80자 이내 권장)";
export const THIS_URL = "https://interactive.hankookilbo.com/v/{FOLDER_NAME}/"; // 끝에 / 필수
export const PAGE_CODE = "hk_news_read_A0000000000000000000"; // "hk_news_read_" + ARTICLE_KEY
export const ARTICLE_KEY = "A0000000000000000000"; // 연결 기사 키 (A + 19자리)
export const FOLDER_NAME = "{FOLDER_NAME}"; // FTP 폴더명, 영문 소문자 + 하이픈/언더스코어

export const FLOW = "scroll"; // "scroll" | "game" — 인터랙티브 형태 (1단계 인터뷰). <html data-flow>
export const VIEW = "normal"; // "normal" | "mobile" — 뷰포트 형식. mobile 은 PC 에서도 3:5 휴대폰 화면을 가운데 띄운다. <html data-view>
export const THEME = "dark"; // "dark" | "light" — 페이지 배경. _variables.sass $bgBase 와 맞춘다. <html data-theme class="dark">

export const POST_DATE = "2026.01.01"; // 바이라인 게시일

export const BYLINE_MEMBERS = [
  { dept: "취재", members: "OOO·OOO 기자" },
  { dept: "사진", members: "OOO 기자" },
  { dept: "영상", members: "OOO PD" },
  { dept: "인터랙티브 기획 제작", members: "OOO, OOO" },
];
