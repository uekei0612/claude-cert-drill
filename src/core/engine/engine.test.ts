import { describe, expect, test } from "vitest";
import { fixture, flatFixture, jaFixture } from "./fixture";
import { addUsed, mockLeft, planMock, scoreMock } from "./mock";
import { filterQuestions, idsOnly, isPermutation, optionOrder, orderFor, parseIdsOnly, planPractice } from "./practice";
import { questionsOfDomain, questionsOfTask, readiness, tally, weakestTasks } from "./progress";
import { dailyPlan, dayKey, daysUntil, parseDate, streak } from "./plan";
import { seeded } from "./rng";
import {
  DAY,
  type ItemStat,
  RETRY_MS,
  WEAK_LAPSES,
  isKnown,
  isLearning,
  isDue,
  isWeak,
  review,
  reviewGuess,
} from "./schedule";

const NOW = Date.UTC(2026, 10, 4);

describe("期限は日で数える（#90）", () => {
  // 端末の時刻で、1 日目の 21 時・2 日目の 8 時
  const at = (day: number, hour: number) => new Date(2026, 10, 20 + day, hour).getTime();
  test("前日の夜に正解した問題を翌朝に正解すると、間隔が延びて覚えたになる", () => {
    const a = review(undefined, true, at(1, 21));
    expect(isDue(a, at(2, 0) - 1)).toBe(false);
    expect(isDue(a, at(2, 8))).toBe(true);
    const b = review(a, true, at(2, 8));
    expect(b.interval).toBe(3);
    expect(isKnown(b, at(2, 8))).toBe(true);
  });
  test("同じ日のうちの 2 回目の正解では延ばさない", () => {
    const a = review(undefined, true, at(1, 8));
    expect(review(a, true, at(1, 23)).interval).toBe(1);
  });
  test("前の記録（期限が時刻のまま）も日でそろえて読む。誤答のやり直しは時刻のまま", () => {
    const old: ItemStat = { ease: 2.3, interval: 1, due: at(2, 21), tries: 1, correct: 1, last: at(1, 21) };
    expect(isDue(old, at(2, 8))).toBe(true);
    const ng = review(undefined, false, at(1, 21));
    expect(isDue(ng, at(1, 21) + RETRY_MS - 1)).toBe(false);
    expect(isDue(ng, at(1, 21) + RETRY_MS)).toBe(true);
    // 勘の正解の「翌日」も日で数える
    expect(isDue(reviewGuess(undefined, at(1, 21)), at(2, 8))).toBe(true);
  });
  test("練習の組み立ても、その日になった問題を復習として先に出す", () => {
    const stats: Record<string, ItemStat> = { "s1-01": review(undefined, true, at(1, 21)) };
    const ids = planPractice(fixture, id => stats[id], at(2, 8), seeded(1), { size: 3, maxNew: 0 });
    expect(ids).toContain("s1-01");
  });
  test("23:30 の正解と 0:30 の正解は同じ日。翌朝 4 時から次の日（#93）", () => {
    const a = review(undefined, true, new Date(2026, 10, 21, 23, 30).getTime());
    expect(review(a, true, new Date(2026, 10, 22, 0, 30).getTime()).interval).toBe(1);
    expect(isDue(a, new Date(2026, 10, 22, 3, 59).getTime())).toBe(false);
    expect(review(a, true, new Date(2026, 10, 22, 4, 0).getTime()).interval).toBe(3);
  });
});

describe("忘れた回数と苦手（#87）", () => {
  test("初見の誤答と、同じ回のやり直しでの誤答は数えない", () => {
    let s = review(undefined, false, NOW);
    s = review(s, false, NOW + RETRY_MS);
    s = review(s, false, NOW + 2 * RETRY_MS);
    expect(s.lapses).toBeUndefined();
    expect(isWeak(s)).toBe(false);
  });
  test("覚えかけ（間隔 1 日以上）になってから間違えると 1 回。2 回で苦手", () => {
    let s = review(undefined, true, NOW);
    s = review(s, false, NOW + DAY);
    expect(s.lapses).toBe(1);
    expect(isWeak(s)).toBe(false);
    // やり直しで続けて間違えても増えない
    s = review(s, false, NOW + DAY + RETRY_MS);
    expect(s.lapses).toBe(1);
    // また覚えかけにしてから忘れる
    s = review(s, true, NOW + 2 * DAY);
    s = review(s, true, NOW + 3 * DAY);
    expect(s.lapses).toBe(1);
    s = review(s, false, NOW + 7 * DAY);
    expect(s.lapses).toBe(WEAK_LAPSES);
    expect(isWeak(s)).toBe(true);
    // 覚え直しても苦手のまま（また忘れやすい問題として残す）
    s = review(review(s, true, NOW + 8 * DAY), true, NOW + 9 * DAY);
    expect(isKnown(s, NOW + 9 * DAY)).toBe(true);
    expect(isWeak(s)).toBe(true);
  });
  test("勘の正解でも回数は残る。勘のあと（間隔 0）の誤答は数えない", () => {
    const learned = review(review(undefined, true, NOW), false, NOW + DAY);
    const g = reviewGuess(learned, NOW + 2 * DAY);
    expect(g.lapses).toBe(1);
    expect(review(g, false, NOW + 3 * DAY).lapses).toBe(1);
  });
});

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
    expect(isKnown(s, NOW + 1000)).toBe(false);
  });
  test("勘の正解は覚えた・覚えかけに入れず、1 日後に出す。ease は変えない（#27）", () => {
    const known = review(review(undefined, true, NOW), true, NOW + DAY);
    const g = reviewGuess(known, NOW + 4 * DAY);
    expect(g.interval).toBe(0);
    expect(g.due).toBe(NOW + 5 * DAY);
    expect(g.ease).toBe(known.ease);
    expect(g.correct).toBe(known.correct + 1);
    expect(isKnown(g, NOW + 4 * DAY)).toBe(false);
    expect(isLearning(g, NOW + 4 * DAY)).toBe(false);
    // 初めての問題でも同じ
    const first = reviewGuess(undefined, NOW);
    expect(first).toMatchObject({ interval: 0, due: NOW + DAY, tries: 1, correct: 1 });
    // 勘のあと、期限に正解すれば覚えかけから始め直す
    expect(review(first, true, NOW + DAY).interval).toBe(1);
  });
  test("期限前の正解では延ばさない", () => {
    const a = review(undefined, true, NOW);
    const b = review(a, true, NOW + 1000);
    expect(b.interval).toBe(a.interval);
    expect(b.tries).toBe(2);
  });
});

describe("progress", () => {
  /** 日をあけて 2 回続けて正解した記録（1 日 → 3 日。最後に答えたのは NOW + 1 日） */
  const twice = () => review(review(undefined, true, NOW), true, NOW + DAY);
  test("未解答は覚えていない扱い、配点で重み付け", () => {
    const stats: Record<string, ItemStat> = {};
    expect(readiness(fixture, id => stats[id], NOW)).toBe(0);
    // d1（0.6）の 6 問をすべて、日をあけて 2 回続けて正解
    for (const q of fixture.questions.filter(q => q.tasks[0]!.startsWith("1."))) stats[q.id] = twice();
    expect(readiness(fixture, id => stats[id], NOW + DAY)).toBeCloseTo(0.6);
  });
  test("1 回の正解ではまだ覚えた扱いにしない（覚えかけ）。日をあけてもう 1 回正解すると覚えた", () => {
    const once = review(undefined, true, NOW);
    expect(isKnown(once, NOW)).toBe(false);
    expect(isLearning(once, NOW)).toBe(true);
    // 同じ日にもう一度正解しても延びない
    expect(isKnown(review(once, true, NOW + 1000), NOW + 1000)).toBe(false);
    const s = twice();
    expect(s.interval).toBe(3);
    expect(isKnown(s, NOW + DAY)).toBe(true);
    expect(isLearning(s, NOW + DAY)).toBe(false);
  });
  test("期限を間隔の分以上過ぎると覚えたから外す（期限を少し過ぎただけなら数え、復習待ちにも入る）", () => {
    const s = twice(); // 期限は NOW + 4 日、間隔 3 日
    const near = tally(fixture.questions.slice(0, 1), () => s, NOW + 6 * DAY);
    expect(near).toEqual({ total: 1, known: 1, learning: 0, seen: 1, due: 1 });
    const far = tally(fixture.questions.slice(0, 1), () => s, NOW + 8 * DAY);
    // 期限を大きく過ぎた問題は「あと 1 回」（期限に正解すれば覚えたに戻る）
    expect(far).toEqual({ total: 1, known: 0, learning: 1, seen: 1, due: 1 });
    expect(isLearning(s, NOW + 8 * DAY)).toBe(true);
    // 期限が来てから正解すれば、また覚えた
    const again = review(s, true, NOW + 8 * DAY);
    expect(isKnown(again, NOW + 8 * DAY)).toBe(true);
  });
  test("ホーム・分野・細目の数字は同じ基準（細目の和が分野、分野の配点重み付けが目安）", () => {
    const stats: Record<string, ItemStat> = { "s1-01": twice(), "s1-02": review(undefined, true, NOW) };
    const at = NOW + DAY;
    const statOf = (id: string) => stats[id];
    for (const d of fixture.domains) {
      const dt = tally(questionsOfDomain(fixture, d.id), statOf, at);
      const sum = d.tasks.reduce((a, t) => a + tally(questionsOfTask(fixture, t.id), statOf, at).known, 0);
      expect(sum).toBe(dt.known);
    }
    expect(tally(fixture.questions, statOf, at).known).toBe(1);
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
  test("期限が同じ日の問題どうしはランダムに選ぶ（問題 ID の順にならない。#97）", () => {
    // 全問を同じ日々に正解して、期限はどれも同じ日（期限は日で数えるので同点）
    const at = (day: number, hour: number) => new Date(2026, 10, 20 + day, hour).getTime();
    const stats = Object.fromEntries(
      fixture.questions.map(q => [q.id, review(review(undefined, true, at(1, 9)), true, at(2, 9))]),
    );
    const firsts = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const ids = planPractice(fixture, id => stats[id], at(10, 9), seeded(seed), { size: 3, maxNew: 0 });
      expect(ids).toHaveLength(3);
      firsts.add([...ids].sort().join());
    }
    expect(firsts.size).toBeGreaterThan(10);
  });
  test("復習が回の数より多くても、未出題が残っていれば回の 3 分の 1 は新しい問題（#98）", () => {
    const seen = fixture.questions.slice(0, 8);
    const stats = Object.fromEntries(seen.map(q => [q.id, review(undefined, false, NOW - DAY)]));
    const ids = planPractice(fixture, id => stats[id], NOW, seeded(3), { size: 6 });
    expect(ids).toHaveLength(6);
    expect(ids.filter(id => !stats[id])).toHaveLength(2);
    // 未出題が無ければ全部を復習に使う
    const all = Object.fromEntries(fixture.questions.map(q => [q.id, review(undefined, false, NOW - DAY)]));
    expect(planPractice(fixture, id => all[id], NOW, seeded(3), { size: 6 })).toHaveLength(6);
    // maxNew: 0 なら取っておかない
    expect(planPractice(fixture, id => stats[id], NOW, seeded(3), { size: 6, maxNew: 0 }).every(id => stats[id])).toBe(
      true,
    );
  });
  test("期限の古い日のほうを先に入れる（同じ日の中だけ混ぜる）", () => {
    const old = review(undefined, false, NOW - 3 * DAY);
    const stats = Object.fromEntries(
      fixture.questions.map(q => [q.id, q.id === "s3-04" ? old : review(undefined, false, NOW - DAY)]),
    );
    for (let seed = 0; seed < 20; seed++)
      expect(planPractice(fixture, id => stats[id], NOW, seeded(seed), { size: 1, maxNew: 0 })).toEqual(["s3-04"]);
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
  test("選択肢の順番は 0〜n−1 の並べ替え（#54）", () => {
    const five = flatFixture.questions.find(q => q.options.length === 5)!;
    expect([...optionOrder(seeded(5), fixture, fixture.questions[0]!)].sort()).toEqual([0, 1, 2, 3]);
    expect([...optionOrder(seeded(5), flatFixture, five)].sort()).toEqual([0, 1, 2, 3, 4]);
  });
  test("混ぜない資格と、keepOrder の問題は元の並び（#58）", () => {
    const q = fixture.questions[0]!;
    const mixed = [1, 2, 3, 4, 5, 6].map(s => optionOrder(seeded(s), fixture, q).join(""));
    expect(mixed.some(o => o !== "0123")).toBe(true);
    for (const s of [1, 2, 3, 4, 5, 6]) {
      expect(optionOrder(seeded(s), fixture, { ...q, keepOrder: true })).toEqual([0, 1, 2, 3]);
      expect(optionOrder(seeded(s), jaFixture, jaFixture.questions[0]!)).toEqual([0, 1, 2, 3]);
    }
    // 混ぜていたころの並びが記録に残っていても、元の並びで出す
    expect(orderFor(jaFixture, jaFixture.questions[0]!, [3, 1, 0, 2])).toEqual([0, 1, 2, 3]);
    expect(orderFor(fixture, { ...q, keepOrder: true }, [3, 1, 0, 2])).toEqual([0, 1, 2, 3]);
  });
  test("記録にある並びは、その問題の並べ替えのときだけ使う（選択肢の数が変わったら元の並び）", () => {
    const q = fixture.questions[0]!;
    expect(orderFor(fixture, q, [3, 1, 0, 2])).toEqual([3, 1, 0, 2]);
    expect(orderFor(fixture, q, [4, 1, 0, 2, 3])).toEqual([0, 1, 2, 3]);
    expect(orderFor(fixture, q, [0, 0, 1, 2])).toEqual([0, 1, 2, 3]);
    expect(orderFor(fixture, q)).toEqual([0, 1, 2, 3]);
    expect(isPermutation([1, 0], 2)).toBe(true);
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

describe("試験日からの逆算（#37）", () => {
  // ローカルの 2026-11-10 の昼
  const noon = new Date(2026, 10, 10, 12).getTime();
  test("日付を読む。ありえない日付や形の違うものは無し", () => {
    expect(parseDate("2026-11-20")).toBe(new Date(2026, 10, 20).getTime());
    expect(parseDate("2026-02-30")).toBeUndefined();
    expect(parseDate("2026/11/20")).toBeUndefined();
  });
  test("あと何日：当日は 0、前日は 1、過ぎたら負（時刻によらない）", () => {
    expect(daysUntil(parseDate("2026-11-10")!, noon)).toBe(0);
    expect(daysUntil(parseDate("2026-11-11")!, new Date(2026, 10, 10, 23, 59).getTime())).toBe(1);
    expect(daysUntil(parseDate("2026-11-09")!, noon)).toBe(-1);
  });
  test("1 日の目安：残りを試験の前日までの日数で割り、切り上げる", () => {
    expect(dailyPlan(parseDate("2026-11-20")!, noon, 101, 31)).toEqual({
      daysLeft: 10,
      newToday: 11,
      chaptersToday: 4,
    });
    expect(dailyPlan(parseDate("2026-11-20")!, noon, 0, 0)).toEqual({ daysLeft: 10, newToday: 0, chaptersToday: 0 });
  });
  test("当日は復習だけ。過ぎたら出さない", () => {
    expect(dailyPlan(parseDate("2026-11-10")!, noon, 50, 5)).toEqual({ daysLeft: 0, newToday: 0, chaptersToday: 0 });
    expect(dailyPlan(parseDate("2026-11-09")!, noon, 50, 5)).toBeUndefined();
  });
});

describe("続けた日数（#38）", () => {
  const at = (d: number, h = 12) => new Date(2026, 10, d, h).getTime();
  test("今日からさかのぼって続いた日数。今日まだなら昨日から数える", () => {
    const days = new Set([dayKey(at(8)), dayKey(at(9)), dayKey(at(10))]);
    expect(streak(days, at(10))).toBe(3);
    expect(streak(days, at(11))).toBe(3);
    expect(streak(days, at(12))).toBe(0);
    expect(streak(new Set([dayKey(at(10)), dayKey(at(8))]), at(10))).toBe(1);
  });
  test("日付はローカルの暦で、朝 4 時に翌日になる（0〜4 時は前の日。#93）", () => {
    expect(dayKey(at(10, 23))).toBe("2026-11-10");
    expect(dayKey(at(11, 0))).toBe("2026-11-10");
    expect(dayKey(at(11, 3))).toBe("2026-11-10");
    expect(dayKey(at(11, 4))).toBe("2026-11-11");
  });
  test("深夜 0 時すぎに答えた日も、前の日として続けた日数に数える（#93）", () => {
    expect(streak(new Set(["2026-11-10"]), at(11, 1))).toBe(1);
  });
});
