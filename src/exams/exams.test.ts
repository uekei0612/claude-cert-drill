/* 載せているすべての資格の形を検査する。問題は手で書くので、形の誤りはここで落とす */
import { describe, expect, test } from "vitest";
import { exams } from "./index";
import { allTasks } from "./types";

describe.each(exams.map(e => [e.id, e] as const))("%s", (_id, exam) => {
  const tasks = allTasks(exam);
  const taskIds = new Set(tasks.map(t => t.id));
  const scenarioIds = new Set(exam.scenarios.map(s => s.id));

  test("資格の ID は小文字・ハイフン、試験コードと対応する", () => {
    expect(exam.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(exam.id).toBe(exam.code.toLowerCase());
  });

  test("分野の ID と配点：d<番号>、配点の合計は 1", () => {
    exam.domains.forEach((d, i) => expect(d.id).toBe(`d${i + 1}`));
    const sum = exam.domains.reduce((a, d) => a + d.weight, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  test("細目の ID は分野の番号で始まり、重複しない", () => {
    for (const d of exam.domains) d.tasks.forEach((t, i) => expect(t.id).toBe(`${d.id.slice(1)}.${i + 1}`));
    expect(taskIds.size).toBe(tasks.length);
  });

  test("シナリオの ID は s<番号>、主な分野は実在する", () => {
    exam.scenarios.forEach((s, i) => {
      expect(s.id).toBe(`s${i + 1}`);
      for (const d of s.domains) expect(exam.domains.some(x => x.id === d)).toBe(true);
    });
  });

  test("要点は実在する細目にだけあり、すべての細目にある", () => {
    for (const k of Object.keys(exam.notes)) expect(taskIds.has(k), k).toBe(true);
    for (const t of tasks) expect(exam.notes[t.id]?.points.length, t.id).toBeGreaterThan(0);
  });

  test("模擬試験の設定がシナリオの数と合う", () => {
    expect(exam.format.scenariosPerExam).toBeLessThanOrEqual(exam.scenarios.length);
    if (!exam.scenarios.length) expect(exam.format.maxQuestions).toBeGreaterThan(0);
    expect(exam.format.target).toBeGreaterThan(0);
    expect(exam.format.target).toBeLessThan(1);
  });

  describe("問題", () => {
    test("ID は資格の中で一意、形は <シナリオ or 分野>-<2 桁>", () => {
      const ids = exam.questions.map(q => q.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const q of exam.questions) {
        expect(q.id).toMatch(/^[sd]\d+-\d{2}$/);
        expect(q.id.split("-")[0]).toBe(q.scenario ?? `d${q.tasks[0].split(".")[0]}`);
      }
    });

    test("正解が一番長い選択肢になっている問題は 4 割まで（長さで当てられないように）", () => {
      const longest = exam.questions.filter(q => {
        const lens = q.options.map(o => o.text.length);
        return lens[q.answer] === Math.max(...lens);
      });
      expect(longest.length / Math.max(1, exam.questions.length), longest.map(q => q.id).join(" ")).toBeLessThanOrEqual(
        0.4,
      );
    });

    test.each(exam.questions.map(q => [q.id, q] as const))("%s", (_qid, q) => {
      if (exam.scenarios.length) expect(scenarioIds.has(q.scenario ?? ""), "シナリオ").toBe(true);
      for (const t of q.tasks) expect(taskIds.has(t), `細目 ${t}`).toBe(true);
      expect(new Set(q.tasks).size).toBe(q.tasks.length);
      expect(q.options).toHaveLength(4);
      expect([0, 1, 2, 3]).toContain(q.answer);
      expect(q.stem.trim().length).toBeGreaterThan(40);
      expect(q.point.trim().length).toBeGreaterThan(0);
      const texts = q.options.map(o => o.text.trim());
      expect(new Set(texts).size, "選択肢が重複").toBe(4);
      for (const o of q.options) {
        expect(o.text.trim().length).toBeGreaterThan(0);
        expect(o.why.trim().length, "選択肢ごとの解説").toBeGreaterThan(10);
      }
      // 本番の 4 択は 1 つだけが正解。「上のすべて」などは使わない
      expect(texts.some(t => /all of the above|none of the above/i.test(t))).toBe(false);
    });
  });
});
