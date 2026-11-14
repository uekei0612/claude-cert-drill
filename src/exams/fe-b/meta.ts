/* 基本情報技術者試験 科目B の一覧に出す情報（#64）。資格を開く前に読むのはここだけ */
import type { ExamMeta } from "../../core/exam/types";

export const meta: ExamMeta = {
  id: "fe-b",
  code: "FE-B",
  title: "基本情報技術者試験 科目B",
  summary:
    "IPA の国家試験。擬似言語で書いたプログラムを読む問題（アルゴリズムとプログラミング）と、情報セキュリティの事例の問題。",
  lang: "ja",
  // IPA の問題の記号（ア〜）と並びのまま出す（公式の解答例と記号が合う）
  options: { labels: "kana", shuffle: false },
  notice:
    "問題は IPA（情報処理推進機構）が公開している基本情報技術者試験の公開問題で、問題ごとに出典を示しています（図を表に置き換えるなど画面に合わせて変えたものは「一部改変」）。解説と要点は自作の非公式教材で、IPA とは関係がありません。",
  format: {
    questions: 20,
    minutes: 100,
    secondsPerQuestion: 300,
    scenariosPerExam: 0,
    maxQuestions: 20,
    passing: "科目B の評価点 600 / 1000（IRT による採点）",
    target: 0.6,
  },
};
