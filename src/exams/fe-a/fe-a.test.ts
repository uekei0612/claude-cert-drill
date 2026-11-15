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

/** IPA の解答例（令和元年度 秋期 午前 問1〜問80。#71） */
const R01A_KEY =
  "エウウアアウエウエイウエアイアウエウウエ" +
  "イイウエイウイイウエイイイイイイエウアウ" +
  "イウイエエイアエイウイウウイイアエアエイ" +
  "イアイウイアエアエウアアウエウウウイウア";
/** 令和元年度 秋期 午前のうち、サンプル問題セットと同じ問題（載せない） */
const R01A_DUP = [1, 9, 10, 11, 17, 20, 25, 36, 44, 46, 53, 76, 78];

/** IPA の解答例（平成31年度 春期 午前 問1〜問80。#71） */
const H31H_KEY =
  "ウウエウイアエアウイエウエエエイアエアエ" +
  "エイアウウイイイウエアエエアウアウアアア" +
  "イアアウイアイウアアイエエイイアエアエエ" +
  "イエイイアエイイイイエエエウイエアエエウ";
/** 平成31年度 春期 午前のうち、サンプル問題セットと同じ問題（載せない） */
const H31H_DUP = [3, 9, 10, 14, 19, 28, 33, 34, 38, 53, 55, 57, 59, 65, 71, 72];

/** IPA の解答例（平成30年度 秋期 午前 問1〜問80。#71） */
const H30A_KEY =
  "エウアエウウエエエウウエエイウイウアエウ" +
  "エイエイアエイウアエエウエウアアエウイア" +
  "エウウエウエイウイイエエイエアイイエエエ" +
  "エウイイアイアエエアイエエエウウイアエア";
/** 平成30年度 秋期 午前のうち、すでに載せている問題と同じもの（載せない）。問6・74 は令和8・5年度の公開問題、問25・32 は令和6年度の公開問題、残りはサンプル問題セット */
const H30A_DUP = [6, 7, 11, 25, 31, 32, 41, 74];

/** IPA の解答例（平成30年度 春期 午前 問1〜問80。#73） */
const H30H_KEY =
  "アエウアウウウエエイウエアイアウエアイア" +
  "ウエアエエイイアエウエエアアアエウイアイ" +
  "アエエウイウイイエエエウイアアイエイアイ" +
  "イエウアエイイイウアアエウイウアイエエウ";
/** 平成30年度 春期 午前のうち、すでに載せている問題と同じもの（載せない）。問36 は令和5年度の公開問題、残りはサンプル問題セット */
const H30H_DUP = [4, 17, 24, 36, 41, 60, 65, 74, 80];

/* 平成29年度 秋期 午前の解答例（#74） */
const H29A_KEY =
  "アアウイウイイエエアイウアアアアアウエア" +
  "イウウアイエウイアエアイエエイアイエアウ" +
  "エウイエウウイイイウウエエエイアアエイア" +
  "ウエエエアアウエアイイエエイアイエウイウ";
const H29A_DUP = [18, 34, 48, 49, 59];

/* 平成29年度 春期 午前の解答例（#74） */
const H29H_KEY =
  "エエイアアイウエエエエイイウアウエアイア" +
  "ウアアイイエエアウウアイアイウイイアウウ" +
  "ウウウエアアウエイイウウエウアウエウイア" +
  "イウイエイイアウイウイウイエウイイウエウ";
const H29H_DUP = [8, 10, 17, 31, 32, 35, 36, 43, 44, 51, 52, 56, 61, 65, 66, 67, 72];

/* 平成28年度 秋期 午前の解答例（#75） */
const H28A_KEY =
  "ウエアエアイイウアエウアウエエウアウアイ" +
  "ウエアエウイアアウエエイイイイアアアウエ" +
  "イアエアウエエエウエアアイエアイエアイア" +
  "ウエアイウウエエアイエウエエウイイエアア";
const H28A_DUP = [6, 22, 23, 24, 25, 38, 42, 49, 59, 73, 75];

/* 平成28年度 春期 午前の解答例（#75） */
const H28H_KEY =
  "ウウエウアエウイアウイアウエウウイアウウ" +
  "アエウイイアアイアエエイウウアイアウイイ" +
  "ウエイウウイウウアイエイイエウウアアイウ" +
  "エウイウエエイイイエアエウイウアアエエア";
const H28H_DUP = [14, 20, 25, 27, 28, 35, 36, 46, 51, 58, 59, 66, 78];

/* 平成27年度 秋期 午前の解答例（#76） */
const H27A_KEY =
  "ウエエイエエアウアイアエウエウアエエアア" +
  "エウウエウウエイイエエアアイイアアウイウ" +
  "イアアアイエウエウエイアウエイウアアイウ" +
  "イアエエアウイアアエウエイイエイイウアア";
const H27A_DUP = [1, 2, 6, 8, 15, 18, 21, 30, 42, 51, 55, 58, 61, 63, 65, 71, 72, 77, 78];

/* 平成27年度 春期 午前の解答例（#76） */
const H27H_KEY =
  "ウアエイイアエアアウアウエアイエエイウエ" +
  "アウウエエウアエイエエイウウイアイウアウ" +
  "イアイイイウウエウウウウイエイウアイエア" +
  "エアウウウウウイエアエイウイイウウイエア";
const H27H_DUP = [
  1, 4, 9, 10, 13, 18, 23, 28, 29, 31, 32, 33, 35, 38, 42, 46, 51, 54, 56, 60, 62, 64, 69, 70, 71, 73, 75, 77,
];

/* 平成26年度 秋期 午前の解答例（#77） */
const H26A_KEY =
  "エアエエイアエエエイイウイエウイイウエウ" +
  "ウエウエエイエウアアアウアエウイウエウウ" +
  "アイウエアウアイエエアウウイエエアイアウ" +
  "エウエエイエウエウエイイウウウウイイエウ";
const H26A_DUP = [3, 9, 10, 11, 18, 19, 21, 31, 34, 40, 44, 45, 48, 53, 54, 62, 64, 65, 67, 68, 79];

/* 平成26年度 春期 午前の解答例（#77） */
const H26H_KEY =
  "アウエウウウイアエエイアエエアイイウアエ" +
  "エウアウアイウエイウエエウエアアウエアエ" +
  "アウエウエイアイイイウエエエウアイアエア" +
  "アイイウアエイアエエエアイイイウエエアア";
const H26H_DUP = [
  2, 18, 19, 20, 21, 26, 29, 31, 33, 36, 38, 39, 41, 44, 45, 50, 53, 54, 57, 58, 60, 62, 63, 67, 69, 71, 73, 77, 79,
];

/* 平成25年度 秋期 午前の解答例（#78） */
const H25A_KEY =
  "ウアウウウアエアイウイイアイウエアウアア" +
  "ウアエウイウアエエアイイエウアイウウイエ" +
  "イイウウウイウエアイウエアエウイアウイイ" +
  "エウアイイエイアイイアウエアウアイエウア";
const H25A_DUP = [
  4, 5, 17, 18, 22, 23, 28, 33, 40, 41, 44, 45, 52, 54, 55, 57, 59, 60, 61, 62, 66, 68, 69, 70, 71, 73, 75, 76, 77, 78,
];

/* 平成25年度 春期 午前の解答例（#78） */
const H25H_KEY =
  "イウウアウアイイアアイイエアアアエウアウ" +
  "エエエウイイウイイアイウアイウイアイウア" +
  "ウアエエイエイアイイアアアアイアアウイイ" +
  "アウエイイエウイエアウイエエアウエウアイ";
const H25H_DUP = [
  7, 8, 9, 10, 12, 15, 17, 18, 23, 24, 25, 28, 32, 34, 37, 39, 40, 41, 42, 45, 50, 51, 53, 55, 56, 57, 58, 59, 62, 63,
  65, 66, 68, 69, 70, 71, 74, 77, 79,
];

/* 平成24年度 秋期 午前の解答例（#79） */
const H24A_KEY =
  "ウイアイイイイイウエウエウアエエウウエエ" +
  "アイエイエアイイアエウウエエイイイウイア" +
  "イイアウエイエイエアイエエアウウイエイア" +
  "ウイアアアウウエアアアエウエウウイイイウ";
const H24A_DUP = [
  10, 11, 12, 13, 14, 16, 19, 21, 23, 25, 28, 34, 35, 36, 37, 38, 39, 40, 41, 42, 44, 45, 47, 48, 50, 51, 52, 53, 55,
  57, 64, 66, 67, 68, 69, 70, 71, 72, 73, 76, 78,
];

/* 平成24年度 春期 午前の解答例（#79） */
const H24H_KEY =
  "ウアエイエイエイウイアウウアウアイイエウ" +
  "アイウウウウウイアウウエエエウウウウイイ" +
  "ウエアイウアウイアウウウウウアエイイアエ" +
  "イエエエウイアエイイエアエエイイイエイエ";
const H24H_DUP = [8, 9, 11, 16, 18, 21, 28, 29, 34, 35, 36, 37, 45, 47, 50, 61, 64, 68, 71, 73, 78];

/* 平成23年度 秋期 午前の解答例（#80） */
const H23A_KEY =
  "イウウウイエアエアエイイイイエウウエウア" +
  "アウアエエイイエウアエアエエアエウウイエ" +
  "アエイウエエイエウイエアアアウイイエイイ" +
  "エイウイアイイウウエアエウイアウイエエイ";
const H23A_DUP = [
  1, 6, 8, 9, 11, 13, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 37, 39, 40, 41, 42, 43, 46, 47, 48, 52, 56,
  58, 64, 68, 70, 71, 72, 75, 77, 78, 79,
];

/* 平成23年度 特別試験 午前の解答例（#80） */
const H23TOKU_KEY =
  "アエイウエイアアエイエエウエウアアウアア" +
  "アイエエアウエイアエアウエアイエイウアイ" +
  "エエウウイアアエウイアウアエウエウアアイ" +
  "ウアイアアイエウエイウウイイウエアイアエ";
const H23TOKU_DUP = [
  4, 6, 8, 11, 20, 21, 25, 26, 27, 31, 33, 34, 37, 38, 42, 44, 50, 52, 54, 55, 56, 57, 59, 60, 61, 62, 66, 67, 70, 71,
  72, 76,
];

/* 平成22年度 秋期 午前の解答例（#81） */
const H22A_KEY =
  "イアエアウウイアエウイアアアエイイエエイ" +
  "アアイウエエアイアウエアウアイアイイエイ" +
  "エイイウエアイイアアエイイエエエイイエア" +
  "エエウイウイイアイアエエエイアウイアイウ";
const H22A_DUP = [
  2, 4, 5, 7, 8, 9, 11, 12, 13, 16, 18, 20, 21, 22, 24, 28, 32, 33, 34, 35, 36, 38, 40, 42, 43, 44, 47, 48, 49, 51, 52,
  53, 59, 63, 64, 68, 70, 72, 77, 78, 79, 80,
];

/* 平成22年度 春期 午前の解答例（#81） */
const H22H_KEY =
  "アウウアウイイウイイウウエアウエイイアウ" +
  "ウエウウエウエイイウエウイエアエウエアウ" +
  "アイイアエウイエエエイアアウウイイイアエ" +
  "ウエイイアアアウイエアイエアウウウウウエ";
const H22H_DUP = [
  2, 4, 5, 10, 12, 18, 19, 23, 24, 25, 26, 27, 31, 32, 36, 37, 39, 43, 44, 45, 48, 49, 58, 59, 61, 63, 64, 65, 69, 70,
  71, 73,
];

/* 平成21年度 秋期 午前の解答例（#82） */
const H21A_KEY =
  "エアウアアウウエウイウアエアアイエウエア" +
  "ウアウイウウウウウウアウイエアエイウエエ" +
  "アウウイウアイアイイエアウウアエアアイエ" +
  "ウイエイウイエイエウウエイイウエウウウウ";
const H21A_DUP = [
  6, 10, 12, 13, 18, 21, 22, 24, 30, 31, 34, 36, 38, 42, 43, 44, 47, 50, 56, 57, 63, 64, 66, 67, 68, 69, 72, 75, 76,
];

/* 平成21年度 春期 午前の解答例（#82） */
const H21H_KEY =
  "ウアアエウエアウエエウアウアアエアアイイ" +
  "ウアエイアウエウエウイウエアエエエアウウ" +
  "イエエイイウエウエウエエイイウアエアウイ" +
  "ウエアイエアエウウアウアエエイイイエアエ";
const H21H_DUP = [
  1, 2, 3, 7, 8, 9, 11, 12, 14, 15, 16, 20, 23, 25, 26, 29, 34, 35, 36, 37, 41, 43, 46, 47, 49, 53, 55, 58, 60, 61, 65,
  66, 68, 69, 70, 72, 77, 78,
];

const sampleQs = exam.questions.filter(q => q.source?.label.includes("サンプル問題セット"));
const gozenQs = exam.questions.filter(q => q.source?.label.includes("午前"));
const publicQs = exam.questions.filter(q => !sampleQs.includes(q) && !gozenQs.includes(q));

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

/** 新形式の前の午前（#71）。回ごとの解答例と、サンプル問題セットと重なるので載せない問題 */
/** area：解答例の分野の欄（T・M・S）。問61 がマネジメント系の回など、既定の区切りと違う回だけ書く */
const GOZEN: { name: string; file: string; key: string; dup: number[]; area?: string }[] = [
  { name: "令和元年度 秋期", file: "2019r01a_fe_am_qs.pdf", key: R01A_KEY, dup: R01A_DUP },
  { name: "平成31年度 春期", file: "2019h31h_fe_am_qs.pdf", key: H31H_KEY, dup: H31H_DUP },
  { name: "平成30年度 秋期", file: "2018h30a_fe_am_qs.pdf", key: H30A_KEY, dup: H30A_DUP },
  { name: "平成30年度 春期", file: "2018h30h_fe_am_qs.pdf", key: H30H_KEY, dup: H30H_DUP },
  { name: "平成29年度 秋期", file: "2017h29a_fe_am_qs.pdf", key: H29A_KEY, dup: H29A_DUP },
  { name: "平成29年度 春期", file: "2017h29h_fe_am_qs.pdf", key: H29H_KEY, dup: H29H_DUP },
  { name: "平成28年度 秋期", file: "2016h28a_fe_am_qs.pdf", key: H28A_KEY, dup: H28A_DUP },
  {
    name: "平成28年度 春期",
    file: "2016h28h_fe_am_qs.pdf",
    key: H28H_KEY,
    dup: H28H_DUP,
    area: "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTMMMMMMMMMMMSSSSSSSSSSSSSSSSSSS",
  },
  { name: "平成27年度 秋期", file: "2015h27a_fe_am_qs.pdf", key: H27A_KEY, dup: H27A_DUP },
  {
    name: "平成27年度 春期",
    file: "2015h27h_fe_am_qs.pdf",
    key: H27H_KEY,
    dup: H27H_DUP,
    area: "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTMMMMMMMMMMSSSSSSSSSSSSSSSSSSS",
  },
  { name: "平成26年度 秋期", file: "2014h26a_fe_am_qs.pdf", key: H26A_KEY, dup: H26A_DUP },
  { name: "平成26年度 春期", file: "2014h26h_fe_am_qs.pdf", key: H26H_KEY, dup: H26H_DUP },
  { name: "平成25年度 秋期", file: "2013h25a_fe_am_qs.pdf", key: H25A_KEY, dup: H25A_DUP },
  { name: "平成25年度 春期", file: "2013h25h_fe_am_qs.pdf", key: H25H_KEY, dup: H25H_DUP },
  { name: "平成24年度 秋期", file: "2012h24a_fe_am_qs.pdf", key: H24A_KEY, dup: H24A_DUP },
  { name: "平成24年度 春期", file: "2012h24h_fe_am_qs.pdf", key: H24H_KEY, dup: H24H_DUP },
  { name: "平成23年度 秋期", file: "2011h23a_fe_am_qs.pdf", key: H23A_KEY, dup: H23A_DUP },
  { name: "平成23年度 特別試験", file: "2011h23tokubetsu_fe_am_qs.pdf", key: H23TOKU_KEY, dup: H23TOKU_DUP },
  { name: "平成22年度 秋期", file: "2010h22a_fe_am_qs.pdf", key: H22A_KEY, dup: H22A_DUP },
  { name: "平成22年度 春期", file: "2010h22h_fe_am_qs.pdf", key: H22H_KEY, dup: H22H_DUP },
  { name: "平成21年度 秋期", file: "2009h21a_fe_am_qs.pdf", key: H21A_KEY, dup: H21A_DUP },
  { name: "平成21年度 春期", file: "2009h21h_fe_am_qs.pdf", key: H21H_KEY, dup: H21H_DUP },
];

test.each(GOZEN)("$name 午前：すでに載せている問題と重ならない問題が全部あり、答えが IPA の解答例と同じ（#71）", g => {
  expect(g.key.length).toBe(80);
  const qs = gozenQs.filter(q => q.source?.label.startsWith(`${g.name} `));
  const seen = new Set<number>();
  for (const q of qs) {
    const m = q.source?.label.match(new RegExp(`^${g.name} 基本情報技術者試験 午前 問(\\d+)$`));
    expect(m, q.id).toBeTruthy();
    const no = Number(m![1]);
    expect(g.dup, `${q.id}（問${no}）は載せない問題（すでに載せている問題と同じか，今の範囲から外れる）`).not.toContain(
      no,
    );
    expect(optionLabel(exam, q.answer), `${q.id}（${g.name} 午前 問${no}）`).toBe(g.key[no - 1]);
    expect(q.source?.url?.endsWith(`/${g.file}`), q.id).toBe(true);
    // 解答例の分野：既定は問1〜50 がテクノロジ系、問51〜60 がマネジメント系、問61〜80 がストラテジ系
    const area = g.area
      ? { T: "1.", M: "2.", S: "3." }[g.area[no - 1] as "T" | "M" | "S"]
      : no <= 50
        ? "1."
        : no <= 60
          ? "2."
          : "3.";
    expect(q.tasks[0].startsWith(area), `${q.id}（問${no}）の分野`).toBe(true);
    seen.add(no);
  }
  expect(seen.size).toBe(80 - g.dup.length);
  expect(qs.length).toBe(80 - g.dup.length);
});

test("午前の問題は、載せている回のどれかのもの（#71）", () => {
  expect(gozenQs.length).toBe(GOZEN.reduce((n, g) => n + 80 - g.dup.length, 0));
});
