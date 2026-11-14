/* CCAR-F だけの決まり。どの資格にもかける形の検査は core/exam/validate.ts */
import { describe, expect, test } from "vitest";
import { ccarF as exam } from "./exam";

describe("「はじめに」", () => {
  const primer = exam.primer!;
  test("章に何度も出る基本の言葉を先に説明している", () => {
    const defined = new Set<string>();
    for (const sec of primer.sections)
      for (const b of sec.body) {
        if (typeof b !== "string" && "terms" in b) for (const [t] of b.terms) defined.add(t.replaceAll("`", ""));
      }
    // 1.1 より前に意味が分かっていないと読めない言葉（リクエストと応答の形、ツールの往復、止まる理由）
    const core = [
      "model",
      "max_tokens",
      "system",
      "messages",
      "メッセージ",
      "ブロック",
      "end_turn",
      "tool_use",
      "stop_sequence",
      "pause_turn",
      "refusal",
      "name",
      "description",
      "input_schema",
      "セッション",
      "組み込みツール",
      "CI",
    ];
    for (const t of core) expect(defined.has(t), `「はじめに」に ${t} の説明が無い`).toBe(true);
  });
  test("リクエストと応答の実物（tool_use / tool_result を含む）を見せている", () => {
    const code = primer.sections.flatMap(sec =>
      sec.body.flatMap(b => (typeof b !== "string" && "code" in b ? [b.code] : [])),
    );
    for (const key of ['"messages"', '"stop_reason"', '"tool_use"', '"tool_result"', '"input_schema"'])
      expect(
        code.some(c => c.includes(key)),
        `「はじめに」のコード例に ${key} が無い`,
      ).toBe(true);
  });
});

test("教科書の各章（はじめにを除く）に、「試験での考え方」の例題が 1 問ずつある", () => {
  for (const [k, l] of Object.entries(exam.lessons ?? {})) {
    const found = l.sections.flatMap(s => s.body.flatMap(b => (typeof b !== "string" && "quiz" in b ? [s.h] : [])));
    expect(found, k).toEqual(["試験での考え方"]);
  }
});

test("模擬試験は本番と同じ 60 問（4 シナリオ × 15 問）を組める", () => {
  expect(exam.format.questions).toBe(60);
  expect(exam.format.scenariosPerExam).toBe(4);
  for (const s of exam.scenarios)
    expect(exam.questions.filter(q => q.scenario === s.id).length, s.id).toBeGreaterThanOrEqual(15);
});
