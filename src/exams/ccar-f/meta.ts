/* CCAR-F の一覧に出す情報（#55）。資格を開く前に読むのはここだけで、問題・教科書・訳（exam.ts）は開いたときに読む */
import type { ExamMeta } from "../../core/exam/types";

export const meta: ExamMeta = {
  id: "ccar-f",
  code: "CCAR-F",
  aliases: ["CCA-F"],
  title: "Claude Certified Architect – Foundations",
  summary:
    "Claude Code・Claude Agent SDK・Claude API・MCP を使った本番システムの設計判断を問う、Anthropic の基礎の技術資格。",
  notice: "問題と教科書はすべて自作の非公式教材です。Anthropic とは関係がありません。",
  format: {
    questions: 60,
    minutes: 120,
    secondsPerQuestion: 120,
    scenariosPerExam: 4,
    passing: "スケールスコア 720 / 1000",
    target: 0.75,
  },
};
