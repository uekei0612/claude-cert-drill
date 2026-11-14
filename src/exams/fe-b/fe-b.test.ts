/* 基本情報 科目B だけの決まり（#64）。どの資格にもかける形の検査は core/exam/validate.ts */
import { expect, test } from "vitest";
import { optionLabel } from "../../core/exam/types";
import { feB as exam } from "./exam";

/** IPA の解答例（科目B 公開問題 問1〜問6）。問題を写し間違えて答えの位置がずれたら落ちる */
const KEY: Record<number, string> = { 5: "アクエエエア", 6: "イエエイオウ", 7: "カアイクオク", 8: "エカアエイケ" };

test("どの問題にも出典があり、答えが IPA の解答例と同じ", () => {
  const seen: string[] = [];
  for (const q of exam.questions) {
    const m = q.source?.label.match(/^令和(\d)年度 基本情報技術者試験 科目B 公開問題 問(\d)$/);
    expect(m, q.id).toBeTruthy();
    const [year, no] = [Number(m![1]), Number(m![2])];
    expect(optionLabel(exam, q.answer), `${q.id}（令和${year}年度 問${no}）`).toBe(KEY[year]![no - 1]);
    expect(q.source?.url).toMatch(new RegExp(`/20\\d\\dr0${year}_fe_kamoku_b_qs\\.pdf$`));
    seen.push(`${year}-${no}`);
  }
  // 公開されている 4 年度 × 6 問が、重ならずに全部ある
  expect(new Set(seen).size).toBe(24);
  expect(seen.length).toBe(24);
});

test("問6（情報セキュリティの事例）だけが情報セキュリティの分野", () => {
  for (const q of exam.questions) {
    const no = Number(q.source!.label.slice(-1));
    expect(q.tasks[0].startsWith("2."), q.id).toBe(no === 6);
  }
});
