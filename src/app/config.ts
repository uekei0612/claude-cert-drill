/* このアプリの名前と文言（#52）。同じ基盤で別の資格アプリを作るときに変えるのは、ここと資格の一覧（exams/index.ts）。
   画面・記録・manifest（vite.config.ts）・index.html はここを読む。
   id は保存キーと書き出しの印に使う。今のアプリで変えると、今までの記録と書き出したファイルが読めなくなる */
export const APP = {
  /** 保存キー（develop・開発は `<id>-dev`）と、書き出した記録の印 */
  id: "claude-cert-drill",
  /** 画面・タブ・ホーム画面に出す名前（2026-11-14 に資格全般向けへ。#63。id・リポ名・URL は claude-cert-drill のまま） */
  name: "cert-drill",
  /** ホーム画面のアイコンの下に出す短い名前 */
  shortName: "cert-drill",
  /** manifest と検索結果の説明 */
  description: "資格の試験勉強（Claude の資格 CCAR-F・基本情報技術者試験など）",
  /** 資格一覧の見出しの下 */
  tagline: "資格の試験勉強。問題は自作か、公開されている過去問題を出典付きで載せています。",
  /** 使い方・設定の下に出す断り書き（資格によらない文。資格ごとの文は ExamMeta.notice。#61） */
  disclaimer: "試験の勉強のための非公式の教材です。",
  /** 解説を頼む相手（「◯◯に聞く用にコピー」） */
  assistant: "Claude",
  /** ブラウザの帯の色（manifest と index.html） */
  themeColor: "#b4532a",
} as const;
