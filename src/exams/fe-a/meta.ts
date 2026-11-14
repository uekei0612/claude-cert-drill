/* 基本情報技術者試験 科目A の一覧に出す情報（#65）。資格を開く前に読むのはここだけ */
import type { ExamMeta } from "../../core/exam/types";

export const meta: ExamMeta = {
  id: "fe-a",
  code: "FE-A",
  title: "基本情報技術者試験 科目A",
  summary: "IPA の国家試験。テクノロジ・マネジメント・ストラテジの知識を問う四肢択一の小問（本番 60 問・90 分）。",
  lang: "ja",
  // IPA の問題の記号（ア〜エ）と並びのまま出す（公式の解答例と記号が合う）
  options: { labels: "kana", shuffle: false },
  notice:
    "問題は IPA（情報処理推進機構）が公開している基本情報技術者試験の公開問題で、問題ごとに出典を示しています（図を描き直したものなどは「一部改変」）。解説と要点は自作の非公式教材で、IPA とは関係がありません。",
  format: {
    questions: 60,
    minutes: 90,
    secondsPerQuestion: 90,
    scenariosPerExam: 0,
    maxQuestions: 60,
    passing: "科目A の評価点 600 / 1000（IRT による採点）",
    target: 0.6,
  },
};
