/* 模擬試験の組み方・採点・時間を、多くの種と資格の形で確かめる（#99）。
   1 回分の例だけでは見逃しが出たので（#97・#98）、組むたびに守るべき決まりを、すべての回で確かめる */
import { describe, expect, test } from "vitest";
import type { Domain, Exam, Question } from "../exam/types";
import { domainOf } from "../exam/types";
import { fixture, flatFixture } from "./fixture";
import { addUsed, domainCounts, mockLeft, planMock, scoreMock } from "./mock";
import { type Rng, seeded } from "./rng";

const SEEDS = Array.from({ length: 300 }, (_, i) => i);

/** シナリオのある資格：scenarios 個 × 各 per 問（細目は 1.1・1.2・2.1 を順に回す）。本番は total 問を pick シナリオから */
function scenarioExam(scenarios: number, per: number | number[], total: number | undefined, pick: number): Exam {
  const tasks = ["1.1", "1.2", "2.1"];
  const ss = Array.from({ length: scenarios }, (_, i) => `s${i + 1}`);
  const questions: Question[] = ss.flatMap((s, si) =>
    Array.from({ length: Array.isArray(per) ? per[si]! : per }, (_, i) => ({
      ...fixture.questions[0]!,
      id: `${s}-${String(i + 1).padStart(2, "0")}`,
      scenario: s,
      tasks: [tasks[i % tasks.length]!],
    })),
  );
  return {
    ...fixture,
    scenarios: ss.map(id => ({ id, title: id, ja: id, context: "ctx", domains: ["d1"] })),
    questions,
    format: { ...fixture.format, questions: total, scenariosPerExam: pick, secondsPerQuestion: 120 },
  };
}

/** シナリオの無い資格：分野ごとの配点と問題数を指定。本番は maxQuestions 問 */
function flatExam(weights: number[], counts: number[], maxQuestions: number): Exam {
  const domains: Domain[] = weights.map((w, i) => ({
    id: `d${i + 1}`,
    title: `D${i + 1}`,
    ja: `分野${i + 1}`,
    weight: w,
    tasks: [{ id: `${i + 1}.1`, title: "t", ja: "t" }],
  }));
  const questions: Question[] = counts.flatMap((n, di) =>
    Array.from({ length: n }, (_, i) => ({
      ...flatFixture.questions[0]!,
      id: `d${di + 1}-${String(i + 1).padStart(2, "0")}`,
      tasks: [`${di + 1}.1`],
    })),
  );
  return { ...flatFixture, domains, questions, format: { ...flatFixture.format, maxQuestions } };
}

/** シナリオのある模擬試験が守る決まり */
function scenarioViolations(exam: Exam, rng: Rng): string[] {
  const out: string[] = [];
  const m = planMock(exam, rng);
  const f = exam.format;
  const byId = new Map(exam.questions.map(q => [q.id, q]));
  const withQ = exam.scenarios.filter(s => exam.questions.some(q => q.scenario === s.id));
  const per = f.questions ? Math.ceil(f.questions / f.scenariosPerExam) : Infinity;

  if (new Set(m.questionIds).size !== m.questionIds.length) out.push("同じ問題が 2 度出る");
  if (m.questionIds.some(id => !byId.has(id))) out.push("無い問題が出る");
  if (new Set(m.scenarioIds).size !== m.scenarioIds.length) out.push("同じシナリオを 2 度選んだ");
  if (m.scenarioIds.length !== Math.min(f.scenariosPerExam, withQ.length))
    out.push(`シナリオが ${m.scenarioIds.length} 個`);
  if (m.scenarioIds.some(s => !withQ.some(x => x.id === s))) out.push("問題の無いシナリオを選んだ");
  // シナリオは資格の並び順。問題はシナリオごとにまとまって、その並びで出る
  const order = m.scenarioIds.map(s => exam.scenarios.findIndex(x => x.id === s));
  if (order.some((v, i) => i > 0 && v < order[i - 1]!)) out.push("シナリオが資格の並び順でない");
  const runs = m.questionIds.map(id => byId.get(id)?.scenario).filter((s, i, a) => s !== a[i - 1]);
  if (runs.join() !== m.scenarioIds.join()) out.push(`問題がシナリオごとにまとまっていない（${runs.join(" ")}）`);
  // 各シナリオから、本番の数（足りなければあるだけ）
  for (const s of m.scenarioIds) {
    const has = exam.questions.filter(q => q.scenario === s).length;
    const got = m.questionIds.filter(id => byId.get(id)?.scenario === s).length;
    if (got !== Math.min(has, per)) out.push(`${s} から ${got} 問（${Math.min(has, per)} 問のはず）`);
  }
  if (m.limitMs !== m.questionIds.length * f.secondsPerQuestion * 1000) out.push("制限時間が問題数 × 1 問の時間でない");
  return out;
}

describe("模擬試験の組み方：シナリオのある資格（#99）", () => {
  test.each([
    { label: "CCAR-F の形（6 シナリオ × 30 問・60 問・4 シナリオ）", exam: scenarioExam(6, 30, 60, 4) },
    { label: "本番の問題数が無い（シナリオの問題を全部）", exam: scenarioExam(5, 8, undefined, 3) },
    { label: "問題の少ないシナリオがある", exam: scenarioExam(6, [30, 30, 5, 30, 0, 30], 60, 4) },
    { label: "問題のあるシナリオが選ぶ数より少ない", exam: scenarioExam(4, [10, 0, 0, 10], 40, 4) },
    { label: "割り切れない問題数（50 問・4 シナリオ）", exam: scenarioExam(6, 20, 50, 4) },
    { label: "テスト用の小さな資格", exam: fixture },
  ])("$label：どの種でも決まりを守る", ({ exam }) => {
    const problems = SEEDS.flatMap(s => scenarioViolations(exam, seeded(s)).map(v => `種 ${s}：${v}`));
    expect(problems.slice(0, 5)).toEqual([]);
  });

  test("どのシナリオも、どの問題も、いつかは出る（偏って一部しか出ないことがない）", () => {
    const exam = scenarioExam(6, 30, 60, 4);
    const scen = new Map<string, number>();
    const qs = new Set<string>();
    for (const s of SEEDS) {
      const m = planMock(exam, seeded(s));
      for (const id of m.scenarioIds) scen.set(id, (scen.get(id) ?? 0) + 1);
      for (const id of m.questionIds) qs.add(id);
    }
    // 6 つから 4 つを選ぶので、どのシナリオも 3 分の 2 ほど（300 回で 200 回前後）
    for (const s of exam.scenarios) expect(scen.get(s.id) ?? 0, s.id).toBeGreaterThan(160);
    for (const s of exam.scenarios) expect(scen.get(s.id) ?? 0, s.id).toBeLessThan(240);
    expect(qs.size).toBe(exam.questions.length);
  });

  test("種が違えば、同じシナリオの中の問題の顔ぶれも変わる", () => {
    const exam = scenarioExam(6, 30, 60, 4);
    const s1 = new Set<string>();
    for (const s of SEEDS.slice(0, 50)) {
      const m = planMock(exam, seeded(s));
      const ids = m.questionIds.filter(id => id.startsWith("s1-"));
      if (ids.length) s1.add([...ids].sort().join());
    }
    expect(s1.size).toBeGreaterThan(10);
  });
});

describe("模擬試験の組み方：シナリオの無い資格（#99）", () => {
  const cases = [
    { label: "基本情報 科目A の形（配点 863:171:333、60 問）", w: [863, 171, 333], n: [80, 30, 40], max: 60 },
    { label: "科目B の形（0.8 / 0.2、20 問）", w: [0.8, 0.2], n: [36, 8], max: 20 },
    { label: "配点が 3 等分（端数が出る）", w: [1, 1, 1], n: [20, 20, 20], max: 10 },
    { label: "配点が 4 等分で 6 問", w: [1, 1, 1, 1], n: [5, 5, 5, 5], max: 6 },
    { label: "配点の大きい分野の問題が少ない", w: [0.7, 0.3], n: [3, 30], max: 20 },
    { label: "全部の問題より本番が長い", w: [0.5, 0.5], n: [4, 3], max: 20 },
    { label: "テスト用の小さな資格", w: [0.5, 0.5], n: [2, 3], max: 4 },
  ];

  test.each(cases)("$label：本番の数だけ、重複なく出る", ({ w, n, max }) => {
    const sum = w.reduce((a, b) => a + b, 0);
    const exam = flatExam(
      w.map(x => x / sum),
      n,
      max,
    );
    const want = Math.min(max, exam.questions.length);
    for (const s of SEEDS) {
      const m = planMock(exam, seeded(s));
      expect(new Set(m.questionIds).size, `種 ${s}`).toBe(m.questionIds.length);
      expect(m.questionIds.length, `種 ${s}：${want} 問のはず`).toBe(want);
      expect(m.scenarioIds).toEqual([]);
    }
  });

  test("分野ごとの問題数は配点に比例する（問題が足りる分野は、配点 × 問題数から 1 問以内）", () => {
    const w = [863, 171, 333].map(x => x / 1367);
    const exam = flatExam(w, [80, 30, 40], 60);
    for (const s of SEEDS.slice(0, 50)) {
      const m = planMock(exam, seeded(s));
      for (const [i, d] of exam.domains.entries()) {
        const got = m.questionIds.filter(
          id =>
            domainOf(
              exam,
              exam.questions.find(q => q.id === id)!,
            )?.id === d.id,
        );
        expect(Math.abs(got.length - 60 * w[i]!), `${d.id}`).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("分野ごとの問題数（#100）", () => {
  test("合計はちょうど n。足りる分野は配点 × n から 1 問以内。どの分野も問題の数を超えない", () => {
    const rng = seeded(11);
    for (let t = 0; t < 2000; t++) {
      const k = 1 + Math.floor(rng() * 5);
      const w = Array.from({ length: k }, () => Math.floor(rng() * 10));
      const avail = Array.from({ length: k }, () => Math.floor(rng() * 30));
      const total = avail.reduce((a, b) => a + b, 0);
      const n = Math.floor(rng() * (total + 1));
      const c = domainCounts(w, avail, n);
      const ws = w.reduce((a, b) => a + b, 0) || 1;
      expect(
        c.reduce((a, b) => a + b, 0),
        JSON.stringify({ w, avail, n, c }),
      ).toBe(n);
      c.forEach((x, i) => expect(x).toBeLessThanOrEqual(avail[i]!));
      // どの分野も問題が足りるなら、配点どおりから 1 問以内
      if (w.some(x => x > 0) && w.every((x, i) => Math.ceil((n * x) / ws) <= avail[i]!))
        c.forEach((x, i) => expect(Math.abs(x - (n * w[i]!) / ws), JSON.stringify({ w, avail, n, c })).toBeLessThan(1));
    }
  });
  test("例：3 等分の 10 問は 4・3・3、配点の大きい分野が 3 問しかなければ残りをほかへ", () => {
    expect(domainCounts([1, 1, 1], [20, 20, 20], 10).sort()).toEqual([3, 3, 4]);
    expect(domainCounts([0.7, 0.3], [3, 30], 20)).toEqual([3, 17]);
    expect(domainCounts([863, 171, 333], [80, 30, 40], 60)).toEqual([38, 7, 15]);
  });
});

describe("模擬試験の採点（#99）", () => {
  const exam = scenarioExam(6, 30, 60, 4);
  const ids = planMock(exam, seeded(1)).questionIds;
  const right = Object.fromEntries(ids.map(id => [id, exam.questions.find(q => q.id === id)!.answer]));
  const wrong = Object.fromEntries(ids.map(id => [id, (right[id]! + 1) % 4]));

  test("全問正解は 100%・合格、全問不正解と未回答は 0%・不合格", () => {
    const all = scoreMock(exam, ids, right);
    expect([all.correct, all.total, all.weighted, all.passed]).toEqual([ids.length, ids.length, 1, true]);
    for (const a of [wrong, {}]) {
      const none = scoreMock(exam, ids, a);
      expect([none.correct, none.weighted, none.passed]).toEqual([0, 0, false]);
    }
  });

  test("どんな答え方でも、数が食い違わない（正解数・分野の合計・正答率の範囲）", () => {
    const rng = seeded(7);
    for (let t = 0; t < 300; t++) {
      // 正解・誤答・未回答を混ぜる
      const answers: Record<string, number> = {};
      for (const id of ids) {
        const r = rng();
        if (r < 0.5) answers[id] = right[id]!;
        else if (r < 0.8) answers[id] = wrong[id]!;
      }
      const sc = scoreMock(exam, ids, answers);
      const expected = ids.filter(id => answers[id] === right[id]);
      expect(sc.correct).toBe(expected.length);
      expect([...sc.correctIds].sort()).toEqual([...expected].sort());
      expect(sc.byDomain.reduce((a, d) => a + d.total, 0)).toBe(sc.total);
      expect(sc.byDomain.reduce((a, d) => a + d.correct, 0)).toBe(sc.correct);
      expect(sc.weighted).toBeGreaterThanOrEqual(0);
      expect(sc.weighted).toBeLessThanOrEqual(1);
      expect(sc.passed).toBe(sc.weighted >= exam.format.target);
    }
  });

  test("出なかった分野は除いて配点を割り直す（出た分野が 1 つなら、ただの正答率）", () => {
    const d2Only = ids.filter(id => exam.questions.find(q => q.id === id)!.tasks[0] === "2.1");
    const half = Object.fromEntries(d2Only.map((id, i) => [id, i % 2 ? right[id]! : wrong[id]!]));
    const sc = scoreMock(exam, d2Only, half);
    expect(sc.weighted).toBeCloseTo(Math.floor(d2Only.length / 2) / d2Only.length);
  });

  test("合格の線ちょうどは合格", () => {
    const four = ids.filter(id => exam.questions.find(q => q.id === id)!.tasks[0] === "2.1").slice(0, 4);
    const three = Object.fromEntries(four.slice(0, 3).map(id => [id, right[id]!]));
    expect(scoreMock(exam, four, three).passed).toBe(true); // 75% と目安 75%
  });

  test("資格に無い問題 ID は数えない", () => {
    const sc = scoreMock(exam, [...ids, "nope-01"], right);
    expect([sc.total, sc.correct, sc.weighted]).toEqual([ids.length, ids.length, 1]);
  });
});

describe("模擬試験の時間（#99）", () => {
  test("画面を開いていた時間だけが減る。閉じている間は減らない", () => {
    const rng = seeded(3);
    for (let t = 0; t < 100; t++) {
      let m = { limitMs: 60 * 60_000, usedMs: 0 };
      let now = 1e12;
      let open = 0;
      for (let k = 0; k < 10; k++) {
        const since = now;
        const stay = Math.floor(rng() * 10 * 60_000);
        now += stay;
        expect(mockLeft(m, since, now)).toBe(m.limitMs - open - stay);
        m = addUsed(m, since, now);
        open += stay;
        // 閉じている間（何時間でも）は減らない
        now += Math.floor(rng() * 12 * 3_600_000);
        expect(mockLeft(m, undefined, now)).toBe(m.limitMs - open);
      }
      expect(m.usedMs).toBe(open);
    }
  });

  test("端末の時計が戻っても、使った時間は減らない", () => {
    const m = { limitMs: 1000, usedMs: 300 };
    expect(addUsed(m, 2000, 1500).usedMs).toBe(300);
    expect(mockLeft(m, 2000, 1500)).toBe(700);
  });
});
