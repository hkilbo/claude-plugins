import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import compress from "astro-compress";

// 로컬 개발 포트는 3000으로 고정한다. 사내 CDN(폰트·헤더)과 추천 카드 API의 CORS 허용 origin이 localhost:3000이다
const LOCAL_PORT = 3000;

// https://astro.build/config
export default defineConfig({
  integrations: [react(), compress()],
  output: "static",
  base: "./",
  build: {
    assetsPrefix: "./",
  },
  server: {
    port: LOCAL_PORT,
  },
});
