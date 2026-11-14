/* 載せているすべての資格に、基盤の形の検査（core/exam/validate.ts）をかける。
   資格だけの決まりは、その資格のフォルダのテストに書く（例 ccar-f/ccar-f.test.ts） */
import { describe, expect, test } from "vitest";
import { catalog } from ".";
import type { Exam } from "../core/exam/types";
import { overflows } from "../core/exam/figure";
import { validateExam } from "../core/exam/validate";

const exams = (await Promise.all(catalog.list.map(m => catalog.load(m.id)))) as Exam[];

describe.each(exams.map(e => [e.id, e] as const))("%s", (_id, exam) => {
  test("資格の形が正しい", () => {
    expect(validateExam(exam)).toEqual([]);
  });
});

test("一覧の情報と中身がそろっている（中身は一覧の情報をそのまま持つ）", () => {
  catalog.list.forEach((m, i) => {
    const e = exams[i]!;
    expect({ id: e.id, code: e.code, title: e.title, summary: e.summary, format: e.format }).toEqual({
      id: m.id,
      code: m.code,
      title: m.title,
      summary: m.summary,
      format: m.format,
    });
  });
});

test("図の文字はどれも枠に収まる", () => {
  expect(overflows).toEqual([]);
});
