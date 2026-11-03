/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

/* develop 版（vite build --mode develop）は本番と同じ Pages の /claude-cert-drill/dev/ に置く。
   記録の保存先は src/store/store.ts で分ける（同じドメインなので localStorage は共有される） */
export default defineConfig(({ mode }) => {
  const develop = mode === "develop";
  return {
    base: develop ? "/claude-cert-drill/dev/" : "/claude-cert-drill/",
    plugins: [
      preact(),
      VitePWA({
        // 新しい版は UpdatePrompt が切り替える（練習・模擬試験の途中は待つので autoUpdate にはしない）
        registerType: "prompt",
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: develop ? "claude-cert-drill dev" : "claude-cert-drill",
          short_name: develop ? "cert dev" : "cert-drill",
          description: "Claude の資格（CCAR-F など）の試験勉強",
          lang: "ja",
          start_url: "./",
          scope: "./",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#b4532a",
          icons: [
            { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png}"],
          cleanupOutdatedCaches: true,
          // 本番の service worker が /dev/ を開いたときに本番の画面を返さないよう外す
          navigateFallbackDenylist: develop ? [] : [/^\/claude-cert-drill\/dev\//],
        },
      }),
    ],
    // dev サーバーには NPM の TCP 転送経由（almalinux-dev.ukuenokei.duckdns.org:8009）でも入る
    server: { strictPort: true, allowedHosts: ["almalinux-dev.ukuenokei.duckdns.org"] },
    test: { include: ["src/**/*.test.{ts,tsx}"], environment: "happy-dom" },
  };
});
