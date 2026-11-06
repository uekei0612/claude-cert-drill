/* 載せているすべての資格の形を検査する。問題は手で書くので、形の誤りはここで落とす */
import { describe, expect, test } from "vitest";
import { exams } from "./index";
import { overflows } from "./figure";
import { PRIMER_ID, allTasks, type Lesson } from "./types";

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

  test("教科書は実在する細目にだけあり、章の形がそろっている", () => {
    const lessons = exam.lessons ?? {};
    for (const k of Object.keys(lessons)) expect(taskIds.has(k), k).toBe(true);
    const chapters: [string, Lesson][] = [
      ...(exam.primer ? [[PRIMER_ID, exam.primer] as [string, Lesson]] : []),
      ...Object.entries(lessons),
    ];
    for (const [k, l] of chapters) {
      expect(l.lead.length, k).toBeGreaterThan(0);
      expect(l.sections.length, k).toBeGreaterThan(1);
      for (const s of l.sections) expect(s.body.length, `${k} ${s.h}`).toBeGreaterThan(0);
      // 見出しは章の中で一意（画面の key に使う）。「この章のまとめ」は画面が足すので使わない
      expect(new Set(l.sections.map(s => s.h)).size, k).toBe(l.sections.length);
      expect(
        l.sections.some(s => s.h.includes("まとめ")),
        k,
      ).toBe(false);
      expect(l.summary.length, `${k} まとめ`).toBeGreaterThan(1);
      expect(l.refs.length, k).toBeGreaterThan(0);
      for (const r of l.refs) expect(r.url, k).toMatch(/^https:\/\//);
      // `…` の数が合わないと、コードの表示が崩れる
      const texts = l.sections.flatMap(s =>
        s.body.flatMap(b => {
          if (typeof b === "string") return [b];
          if ("list" in b) return [...b.list];
          if ("steps" in b) return [...b.steps];
          if ("note" in b) return [b.note];
          if ("terms" in b) return b.terms.flat();
          if ("figure" in b) return [b.caption];
          if ("quiz" in b) return [b.quiz, ...b.choices, b.why];
          return [];
        }),
      );
      for (const t of [l.lead, ...l.summary, ...texts]) expect((t.match(/`/g) ?? []).length % 2, `${k}: ${t}`).toBe(0);
      // 用語・手順・箇条書き・選択肢の中で同じ項目が重ならない（画面の key に使う）
      for (const s of l.sections)
        for (const b of s.body) {
          const items: readonly string[] =
            typeof b === "string"
              ? []
              : "terms" in b
                ? b.terms.map(t => t[0])
                : "list" in b
                  ? b.list
                  : "steps" in b
                    ? b.steps
                    : "quiz" in b
                      ? b.choices
                      : [];
          expect(new Set(items).size, `${k} ${s.h}`).toBe(items.length);
        }
      // 図は SVG で、説明がある
      for (const s of l.sections)
        for (const b of s.body)
          if (typeof b !== "string" && "figure" in b) {
            expect(b.figure.startsWith("<svg "), `${k} ${s.h}`).toBe(true);
            expect(b.caption.trim().length, `${k} ${s.h}`).toBeGreaterThan(10);
          }
    }
  });

  test("図の文字はどれも枠に収まる", () => {
    expect(overflows).toEqual([]);
  });

  test("教科書の各章（はじめにを除く）に、「試験での考え方」の例題が 1 問ずつある", () => {
    const quizzes = Object.entries(exam.lessons ?? {}).map(([k, l]) => {
      const found = l.sections.flatMap(s =>
        s.body.flatMap(b => (typeof b !== "string" && "quiz" in b ? [[s.h, b] as const] : [])),
      );
      expect(found.length, k).toBe(1);
      const [h, q] = found[0]!;
      expect(h, k).toBe("試験での考え方");
      expect(q.choices.length, k).toBeGreaterThanOrEqual(3);
      expect(q.choices.length, k).toBeLessThanOrEqual(4);
      expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length, k).toBe(true);
      expect(q.why.trim().length, k).toBeGreaterThan(20);
      return [k, q] as const;
    });
    if (!quizzes.length) return;
    // 正解の位置が偏らない（どの位置も 4 割まで）
    const at = [0, 1, 2, 3].map(i => quizzes.filter(([, q]) => q.answer === i).length);
    for (const n of at) expect(n / quizzes.length, at.join(" ")).toBeLessThanOrEqual(0.4);
    // 正解が一番長い選択肢になっている例題は半分まで（長さで当てられないように）
    const longest = quizzes.filter(([, q]) => {
      const lens = q.choices.map(c => c.length);
      return lens[q.answer] === Math.max(...lens);
    });
    expect(longest.length / quizzes.length, longest.map(([k]) => k).join(" ")).toBeLessThanOrEqual(0.5);
  });

  test("模擬試験の設定がシナリオの数と合う", () => {
    expect(exam.format.scenariosPerExam).toBeLessThanOrEqual(exam.scenarios.length);
    if (!exam.scenarios.length) expect(exam.format.maxQuestions).toBeGreaterThan(0);
    expect(exam.format.target).toBeGreaterThan(0);
    expect(exam.format.target).toBeLessThan(1);
  });

  describe.each(Object.entries(exam.translations ?? {}))("訳（%s）", (_lang, tr) => {
    test("すべてのシナリオと問題に訳があり、余分な ID は無い", () => {
      expect(Object.keys(tr!.scenarios).sort()).toEqual([...scenarioIds].sort());
      expect(Object.keys(tr!.questions).sort()).toEqual(exam.questions.map(q => q.id).sort());
    });
    test("訳でも、正解が一番長い選択肢になっている問題は 4 割まで", () => {
      const longest = exam.questions.filter(q => {
        const lens = tr!.questions[q.id]!.options.map(o => o.length);
        return lens[q.answer] === Math.max(...lens);
      });
      expect(longest.length / Math.max(1, exam.questions.length), longest.map(q => q.id).join(" ")).toBeLessThanOrEqual(
        0.4,
      );
    });
    test("訳は空でなく、選択肢は 4 つで重複しない", () => {
      for (const v of Object.values(tr!.scenarios)) expect(v.trim().length).toBeGreaterThan(20);
      for (const [id, t] of Object.entries(tr!.questions)) {
        expect(t.stem.trim().length, id).toBeGreaterThan(20);
        expect(t.options, id).toHaveLength(4);
        expect(new Set(t.options.map(o => o.trim())).size, id).toBe(4);
        for (const o of t.options) expect(o.trim().length, id).toBeGreaterThan(0);
      }
    });
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

    test("すべての細目に、それを主たる細目とする問題が 1 問以上ある", () => {
      const missing = tasks.filter(t => !exam.questions.some(q => q.tasks[0] === t.id)).map(t => t.id);
      expect(missing).toEqual([]);
    });

    test("すべてのシナリオに問題がある", () => {
      const missing = exam.scenarios.filter(s => !exam.questions.some(q => q.scenario === s.id)).map(s => s.id);
      expect(missing).toEqual([]);
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
