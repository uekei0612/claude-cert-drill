import { describe, expect, test } from "vitest";
import { fixture } from "../engine/fixture";
import type { Exam, Question } from "./types";
import { validateExam } from "./validate";

/** 形の正しい小さな資格（fixture に要点と、長さのそろった選択肢を足す） */
const base: Exam = {
  ...fixture,
  notes: { "1.1": { points: ["a"] }, "1.2": { points: ["b"] }, "2.1": { points: ["c"] } },
  questions: fixture.questions.map(q => ({
    ...q,
    // 正解（0）を一番短くする
    options: q.options.map((o, i) => ({ ...o, text: i === 0 ? "a" : `option ${i}` })) as unknown as Question["options"],
  })),
};
const has = (e: Exam, re: RegExp) => validateExam(e).some(m => re.test(m));
const withQ = (f: (q: Question) => Question): Exam => ({ ...base, questions: base.questions.map(f) });

describe("資格の形の検査（#53）", () => {
  test("形の正しい資格は何も言わない", () => {
    expect(validateExam(base)).toEqual([]);
  });
  test("ID と配点", () => {
    expect(has({ ...base, id: "Test_X" }, /小文字/)).toBe(true);
    expect(has({ ...base, domains: base.domains.map(d => ({ ...d, weight: 0.3 })) }, /配点の合計/)).toBe(true);
    expect(has({ ...base, domains: [{ ...base.domains[0]!, id: "x" }, base.domains[1]!] }, /d1/)).toBe(true);
  });
  test("問題：ID・正解・選択肢・細目", () => {
    expect(
      has(
        withQ(q => (q.id === "s1-01" ? { ...q, id: "s2-99" } : q)),
        /頭が/,
      ),
    ).toBe(true);
    expect(
      has(
        withQ(q => ({ ...q, answer: 7 as Question["answer"] })),
        /正解の位置/,
      ),
    ).toBe(true);
    expect(
      has(
        withQ(q => ({ ...q, tasks: ["9.9"] })),
        /細目 9\.9 が無い/,
      ),
    ).toBe(true);
    expect(has({ ...base, questions: base.questions.filter(q => q.tasks[0] !== "1.2") }, /1\.2/)).toBe(true);
  });
  test("要点の無い細目", () => {
    expect(has({ ...base, notes: {} }, /要点/)).toBe(true);
  });
  test("正解が一番長い選択肢に偏ると落とす（数が少ないうちは見ない）", () => {
    const long = withQ(q => ({
      ...q,
      options: q.options.map((o, i) =>
        i === q.answer ? { ...o, text: "the longest one" } : o,
      ) as unknown as Question["options"],
    }));
    expect(has(long, /一番長い/)).toBe(true);
    expect(has({ ...long, questions: long.questions.slice(0, 9) }, /一番長い/)).toBe(false);
  });
  test("シナリオの無い資格は、模擬試験の問題数が要る", () => {
    const flat: Exam = {
      ...base,
      scenarios: [],
      format: { ...base.format, scenariosPerExam: 0 },
      questions: base.questions.map(q => ({ ...q, scenario: undefined, id: `d${q.tasks[0][0]}-${q.id.slice(-2)}` })),
    };
    expect(has(flat, /maxQuestions/)).toBe(true);
    expect(has({ ...flat, format: { ...flat.format, maxQuestions: 10 } }, /maxQuestions/)).toBe(false);
  });
});
