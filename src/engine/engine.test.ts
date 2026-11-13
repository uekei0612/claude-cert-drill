import { describe, expect, test } from "vitest";
import { fixture } from "./fixture";
import { addUsed, mockLeft, planMock, scoreMock } from "./mock";
import { filterQuestions, idsOnly, optionOrder, parseIdsOnly, planPractice } from "./practice";
import { readiness, tally, weakestTasks } from "./progress";
import { seeded } from "./rng";
import { DAY, type ItemStat, RETRY_MS, isKnown, review } from "./schedule";

const NOW = Date.UTC(2026, 10, 4);

describe("review", () => {
  test("正解で 1 日 → 3 日 → ease 倍に延びる", () => {
    let s = review(undefined, true, NOW);
    expect(s.interval).toBe(1);
    s = review(s, true, s.due);
    expect(s.interval).toBe(3);
    s = review(s, true, s.due);
    expect(s.interval).toBe(Math.round(3 * (2.3 + 0.1)));
  });
  test("誤答で間隔は 0、10 分後に期限", () => {
    const s = review(review(undefined, true, NOW), false, NOW + 1000);
    expect(s.interval).toBe(0);
    expect(s.due).toBe(NOW + 1000 + RETRY_MS);
    expect(isKnown(s)).toBe(false);
  });
  test("期限前の正解では延ばさない", () => {
    const a = review(undefined, true, NOW);
    const b = review(a, true, NOW + 1000);
    expect(b.interval).toBe(a.interval);
    expect(b.tries).toBe(2);
  });
});

describe("progress", () => {
  test("未解答は覚えていない扱い、配点で重み付け", () => {
    const stats: Record<string, ItemStat> = {};
    expect(readiness(fixture, id => stats[id], NOW)).toBe(0);
    // d1（0.6）の 6 問をすべて正解
    for (const q of fixture.questions.filter(q => q.tasks[0]!.startsWith("1.")))
      stats[q.id] = review(undefined, true, NOW);
    expect(readiness(fixture, id => stats[id], NOW)).toBeCloseTo(0.6);
  });
  test("期限切れでも直近が正解なら覚えた数に入り、復習待ちにも入る", () => {
    const s = review(undefined, true, NOW);
    const t = tally(fixture.questions.slice(0, 1), () => s, NOW + 2 * DAY);
    expect(t).toEqual({ total: 1, known: 1, seen: 1, due: 1 });
  });
  test("弱い細目は配点の大きい分野の未習得から", () => {
    const w = weakestTasks(fixture, () => undefined, NOW, 3);
    expect(w[0]!.taskId).toBe("2.1"); // 0.4 × 5/5 ＞ 0.6 × 4/7（1.1）
  });
});

describe("planPractice", () => {
  test("同じ回に同じ問題を入れない。問題数を超えない", () => {
    const ids = planPractice(fixture, () => undefined, NOW, seeded(1), { size: 30, maxNew: 30 });
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(fixture.questions.length);
  });
  test("期限切れを先に入れる", () => {
    const stats: Record<string, ItemStat> = { "s3-04": { ...review(undefined, false, NOW - DAY) } };
    const ids = planPractice(fixture, id => stats[id], NOW, seeded(2), { size: 1, maxNew: 0 });
    expect(ids).toEqual(["s3-04"]);
  });
  test("未出題は配点の大きい・弱い分野から多く選ぶ", () => {
    let d1 = 0;
    for (let seed = 0; seed < 200; seed++) {
      const [id] = planPractice(fixture, () => undefined, NOW, seeded(seed), { size: 1 });
      if (fixture.questions.find(q => q.id === id)!.tasks[0]!.startsWith("1.")) d1++;
    }
    // d1 は 7 問（配点 0.6）、d2 は 5 問（0.4）。d1 を引く確率は 4.2 / 6.2 ≒ 68%
    expect(d1).toBeGreaterThan(100);
    expect(d1).toBeLessThan(160);
  });
  test("絞り込み：細目・分野・シナリオ", () => {
    expect(filterQuestions(fixture, "1.2").map(q => q.id)).toEqual(["s1-03", "s2-02", "s3-01"]);
    expect(filterQuestions(fixture, "d2")).toHaveLength(5);
    expect(filterQuestions(fixture, "s2")).toHaveLength(4);
  });
  test("ids を渡すとその問題だけから出す（無い ID は無視）", () => {
    const ids = planPractice(fixture, () => undefined, NOW, seeded(4), {
      size: 10,
      maxNew: 10,
      only: "d1",
      ids: ["s2-02", "s3-04", "nope"],
    });
    expect([...ids].sort()).toEqual(["s2-02", "s3-04"]);
  });
  test("選択肢の順番は 0〜3 の並べ替え", () => {
    expect([...optionOrder(seeded(5))].sort()).toEqual([0, 1, 2, 3]);
  });
});

describe("問題を名指しする絞り込み", () => {
  test("組んで読み戻せる。ほかの絞り込みは名指しでない", () => {
    expect(parseIdsOnly(idsOnly(["s1-01", "s2-03"]))).toEqual(["s1-01", "s2-03"]);
    expect(parseIdsOnly("1.1")).toBeUndefined();
    expect(parseIdsOnly("saved")).toBeUndefined();
    expect(parseIdsOnly(undefined)).toBeUndefined();
  });
  test("名指しした問題だけを、期限前でも全部出す", () => {
    const ids = ["s1-01", "s1-02", "s2-01"];
    const stat = { ease: 2.3, interval: 3, due: 2e12, tries: 1, correct: 1, last: 0 };
    const p = planPractice(fixture, id => (id === "s1-01" ? stat : undefined), 1e12, seeded(1), {
      size: ids.length,
      maxNew: ids.length,
      ids,
    });
    expect([...p].sort()).toEqual(ids);
  });
});

describe("mock", () => {
  test("シナリオを決まった数だけ選び、シナリオごとにまとめて出す", () => {
    const p = planMock(fixture, seeded(3));
    expect(p.scenarioIds).toHaveLength(2);
    expect(p.questionIds).toHaveLength(8);
    const order = p.questionIds.map(id => id.split("-")[0]);
    expect(order.slice(0, 4).every(s => s === p.scenarioIds[0])).toBe(true);
    expect(p.limitMs).toBe(8 * 120 * 1000);
  });
  test("本番の問題数があれば、シナリオごとにその割り当て分だけ選ぶ", () => {
    const exam = { ...fixture, format: { ...fixture.format, questions: 4 } };
    const p = planMock(exam, seeded(3));
    expect(p.questionIds).toHaveLength(4);
    for (const sid of p.scenarioIds) expect(p.questionIds.filter(id => id.startsWith(`${sid}-`))).toHaveLength(2);
    expect(p.limitMs).toBe(4 * 120 * 1000);
  });
  test("残り時間：画面を開いている間だけ減り、閉じている間は止まる", () => {
    const MIN = 60_000;
    const T0 = 1_000_000;
    let m = { limitMs: 30 * MIN, usedMs: 0 };
    expect(mockLeft(m, T0, T0 + 5 * MIN)).toBe(25 * MIN);
    // 5 分解いて閉じる
    m = addUsed(m, T0, T0 + 5 * MIN);
    // 一晩たってから開いても、閉じたときと同じ残り時間
    const reopen = T0 + 12 * 60 * MIN;
    expect(mockLeft(m, undefined, reopen)).toBe(25 * MIN);
    expect(mockLeft(m, reopen, reopen)).toBe(25 * MIN);
    expect(mockLeft(m, reopen, reopen + 3 * MIN)).toBe(22 * MIN);
  });
  test("残り時間：時計が戻っても増えない", () => {
    const m = { limitMs: 1000, usedMs: 200 };
    expect(mockLeft(m, 5000, 4000)).toBe(800);
    expect(addUsed(m, 5000, 4000).usedMs).toBe(200);
  });
  test("採点：未回答は誤答、出た分野で配点を割り直す", () => {
    const ids = ["s1-01", "s1-02", "s1-04"]; // d1 2 問、d2 1 問
    const s = scoreMock(fixture, ids, { "s1-01": 0, "s1-02": 1 });
    expect(s.correct).toBe(1);
    expect(s.byDomain.find(d => d.domainId === "d1")).toEqual({ domainId: "d1", correct: 1, total: 2 });
    expect(s.weighted).toBeCloseTo(0.6 * 0.5 + 0.4 * 0);
    expect(s.passed).toBe(false);
  });
});
