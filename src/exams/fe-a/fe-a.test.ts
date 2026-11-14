/* 基本情報 科目A だけの決まり（#65）。どの資格にもかける形の検査は core/exam/validate.ts */
import { expect, test } from "vitest";
import { optionLabel } from "../../core/exam/types";
import { feA as exam } from "./exam";

/** IPA の解答例（科目A 公開問題 問1〜問20）。問題を写し間違えて答えの位置がずれたら落ちる */
const KEY: Record<number, string> = {
  5: "ウウエエイウイエウウエウエウエイウウエア",
  6: "ウエイエウアウウウエウエウウエエアエエア",
  7: "エイイウアウエエウアウエエエウエイエエイ",
  8: "イウイイイイエアウウアウアエウアイアアイ",
};

test("どの問題にも出典があり、答えが IPA の解答例と同じ", () => {
  const seen: string[] = [];
  for (const q of exam.questions) {
    const m = q.source?.label.match(/^令和(\d)年度 基本情報技術者試験 科目A 公開問題 問(\d+)$/);
    expect(m, q.id).toBeTruthy();
    const [year, no] = [Number(m![1]), Number(m![2])];
    expect(optionLabel(exam, q.answer), `${q.id}（令和${year}年度 問${no}）`).toBe(KEY[year]![no - 1]);
    expect(q.source?.url).toMatch(new RegExp(`/20\\d\\dr0${year}_fe_kamoku_a_qs\\.pdf$`));
    seen.push(`${year}-${no}`);
  }
  // 公開されている 4 年度 × 20 問が、重ならずに全部ある
  expect(new Set(seen).size).toBe(80);
  expect(seen.length).toBe(80);
});

test("配点は公開問題の分野の比と同じ", () => {
  const n = exam.questions.length;
  for (const d of exam.domains) {
    const k = exam.questions.filter(q => q.tasks[0].startsWith(`${d.id.slice(1)}.`)).length;
    expect(d.weight, d.id).toBeCloseTo(k / n, 6);
  }
});
