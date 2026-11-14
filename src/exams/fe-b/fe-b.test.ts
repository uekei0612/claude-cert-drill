/* 基本情報 科目B だけの決まり（#64）。どの資格にもかける形の検査は core/exam/validate.ts */
import { expect, test } from "vitest";
import { optionLabel } from "../../core/exam/types";
import { feB as exam } from "./exam";

/** IPA の解答例（科目B 公開問題 問1〜問6）。問題を写し間違えて答えの位置がずれたら落ちる */
const KEY: Record<number, string> = { 5: "アクエエエア", 6: "イエエイオウ", 7: "カアイクオク", 8: "エカアエイケ" };
/** サンプル問題（20 問）セットの解答例（#66） */
const SAMPLE_KEY = "カウカエオアカエウカアエウクアクカエエカ";

const publicQs = exam.questions.filter(q => q.source?.label.startsWith("令和"));
const sampleQs = exam.questions.filter(q => q.source?.label.includes("サンプル問題セット"));

test("どの問題にも出典がある（公開問題かサンプル問題）", () => {
  expect(publicQs.length + sampleQs.length).toBe(exam.questions.length);
});

test("公開問題の答えが IPA の解答例と同じ", () => {
  const seen: string[] = [];
  for (const q of publicQs) {
    const m = q.source!.label.match(/^令和(\d)年度 基本情報技術者試験 科目B 公開問題 問(\d)$/);
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

test("サンプル問題の答えが IPA の解答例と同じ（20 問が重ならずに全部ある）", () => {
  const seen = new Set<number>();
  for (const q of sampleQs) {
    const no = Number(q.source!.label.match(/問(\d+)$/)![1]);
    expect(optionLabel(exam, q.answer), `${q.id}（サンプル 問${no}）`).toBe(SAMPLE_KEY[no - 1]);
    expect(q.source?.url).toMatch(/fe_kamoku_b_set_sample_qs\.pdf$/);
    seen.add(no);
  }
  expect(seen.size).toBe(20);
  expect(sampleQs.length).toBe(20);
});

test("情報セキュリティの分野は、公開問題の問6 とサンプル問題の問17〜問20", () => {
  for (const q of exam.questions) {
    const no = Number(q.source!.label.match(/問(\d+)$/)![1]);
    const security = sampleQs.includes(q) ? no >= 17 : no === 6;
    expect(q.tasks[0].startsWith("2."), q.id).toBe(security);
  }
});
