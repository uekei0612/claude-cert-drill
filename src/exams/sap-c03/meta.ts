/* SAP-C03 の一覧に出す情報（#101）。資格を開く前に読むのはここだけで、問題・訳（exam.ts）は開いたときに読む */
import type { ExamMeta } from "../../core/exam/types";

export const meta: ExamMeta = {
  id: "sap-c03",
  code: "SAP-C03",
  aliases: ["AWS SAP"],
  title: "AWS Certified Solutions Architect – Professional",
  summary:
    "クラウド向けの設計・セキュリティとガバナンス・コスト・回復性と移行・運用の自動化について、AWS での設計判断を問う上級の資格（生成 AI の組み込みも含む）。",
  notice:
    "問題・解説・要点はすべて自作の非公式教材です。AWS（Amazon Web Services）とは関係がありません。本番の複数選択の問題も、ここでは択一で出します。",
  format: {
    questions: 75,
    minutes: 180,
    secondsPerQuestion: 144,
    scenariosPerExam: 0,
    maxQuestions: 75,
    passing: "スケールスコア 750 / 1000",
    target: 0.75,
  },
};
