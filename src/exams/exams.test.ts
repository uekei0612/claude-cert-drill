/* 載せているすべての資格に、基盤の形の検査（core/exam/validate.ts）をかける。
   資格だけの決まりは、その資格のフォルダのテストに書く（例 ccar-f/ccar-f.test.ts） */
import { describe, expect, test } from "vitest";
import { exams } from ".";
import { overflows } from "../core/exam/figure";
import { validateExam } from "../core/exam/validate";

describe.each(exams.map(e => [e.id, e] as const))("%s", (_id, exam) => {
  test("資格の形が正しい", () => {
    expect(validateExam(exam)).toEqual([]);
  });
});

test("資格の ID は重ならない", () => {
  expect(new Set(exams.map(e => e.id)).size).toBe(exams.length);
});

test("図の文字はどれも枠に収まる", () => {
  expect(overflows).toEqual([]);
});
