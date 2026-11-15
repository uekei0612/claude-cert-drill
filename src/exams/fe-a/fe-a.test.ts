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

/** IPA の解答例（科目A サンプル問題セット 問1〜問60。#68） */
const SAMPLE_KEY =
  "エエエアイエイウエウウイエエエ" +
  "アエエエエアイアイアエイエアア" +
  "エアウウイアエイイイウエウエイ" +
  "エエイアアエアエエイエウイイウ";

const sampleQs = exam.questions.filter(q => q.source?.label.includes("サンプル問題セット"));
const publicQs = exam.questions.filter(q => !sampleQs.includes(q));

test("どの問題にも出典があり、答えが IPA の解答例と同じ", () => {
  const seen: string[] = [];
  for (const q of publicQs) {
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

test("サンプル問題セットの 60 問が重ならずにあり、答えが IPA の解答例と同じ", () => {
  expect(SAMPLE_KEY.length).toBe(60);
  const seen = new Set<number>();
  for (const q of sampleQs) {
    const m = q.source?.label.match(/^基本情報技術者試験 科目A サンプル問題セット 問(\d+)$/);
    expect(m, q.id).toBeTruthy();
    const no = Number(m![1]);
    expect(optionLabel(exam, q.answer), `${q.id}（サンプル 問${no}）`).toBe(SAMPLE_KEY[no - 1]);
    expect(q.source?.url).toMatch(/fe_kamoku_a_set_sample_qs\.pdf$/);
    // サンプル問題セットの並び：問1〜41 がテクノロジ系、問42〜48 がマネジメント系、問49〜60 がストラテジ系
    const area = no <= 41 ? "1." : no <= 48 ? "2." : "3.";
    expect(q.tasks[0].startsWith(area), `${q.id}（サンプル 問${no}）の分野`).toBe(true);
    seen.add(no);
  }
  expect(seen.size).toBe(60);
  expect(sampleQs.length).toBe(60);
});

test("配点は公開問題の分野の比と同じ", () => {
  const n = exam.questions.length;
  for (const d of exam.domains) {
    const k = exam.questions.filter(q => q.tasks[0].startsWith(`${d.id.slice(1)}.`)).length;
    expect(d.weight, d.id).toBeCloseTo(k / n, 6);
  }
});

test("教科書：はじめにと、どの細目にも章がある（#69）", () => {
  expect(exam.primer?.title).toBeTruthy();
  const tasks = exam.domains.flatMap(d => d.tasks.map(t => t.id));
  expect(Object.keys(exam.lessons ?? {}).sort()).toEqual(tasks.sort());
});
