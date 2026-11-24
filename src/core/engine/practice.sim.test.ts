/* 練習の組み立て（planPractice）を、何日も解き続ける使い方で確かめる（#97・#98）。
   1 回分の例だけのテストでは「同じ日の期限が同点で問題 ID の順になる」「復習が溜まると新しい問題が入らない」を
   見逃したので、毎日解き続けたときに回の組み方が守るべき決まりを、すべての回で確かめる */
import { describe, expect, test } from "vitest";
import type { Exam, Question } from "../exam/types";
import { fixture } from "./fixture";
import { planPractice } from "./practice";
import { type Rng, seeded } from "./rng";
import { type ItemStat, dueOf, isDue, review } from "./schedule";

/** fixture の問題を写して、問題の多い資格を作る（ID は s1-01… を n 問） */
function bigExam(n: number): Exam {
  const base = fixture.questions;
  const questions: Question[] = Array.from({ length: n }, (_, i) => {
    const src = base[i % base.length]!;
    return { ...src, id: `${src.scenario}-${String(i + 1).padStart(3, "0")}` };
  });
  return { ...fixture, questions };
}

const day = (d: number, hour = 9) => new Date(2026, 10, 1 + d, hour).getTime();

interface Check {
  readonly ids: string[];
  readonly stats: Readonly<Record<string, ItemStat>>;
  readonly now: number;
  readonly size: number;
  readonly maxNew: number;
}

/** 1 回分が守るべき決まり。破っていればその説明を返す */
function violations(exam: Exam, { ids, stats, now, size, maxNew }: Check): string[] {
  const out: string[] = [];
  const seen = (id: string) => !!stats[id];
  const due = exam.questions.filter(q => isDue(stats[q.id], now));
  const fresh = exam.questions.filter(q => !seen(q.id));
  const picked = new Set(ids);
  const pickedFresh = ids.filter(id => !seen(id)).length;
  const pickedAhead = ids.filter(id => seen(id) && !isDue(stats[id], now));

  if (picked.size !== ids.length) out.push("同じ回に同じ問題がある");
  if (ids.length !== Math.min(size, exam.questions.length)) out.push(`回の長さ ${ids.length}（${size} のはず）`);

  // #98：未出題が残っていれば、回の 3 分の 1（maxNew と残りの数まで）は新しい問題
  const reserved = Math.min(maxNew, fresh.length, Math.ceil(size / 3));
  if (pickedFresh < reserved) out.push(`新しい問題が ${pickedFresh} 問（${reserved} 問は入るはず）`);
  if (pickedFresh > Math.max(maxNew, size - due.length - pickedAhead.length))
    out.push(`新しい問題が多すぎる（${pickedFresh}）`);

  // 期限切れは古い日から。入らなかった期限切れより新しい日の期限切れが入っていない
  const left = due.filter(q => !picked.has(q.id));
  if (left.length) {
    const oldestLeft = Math.min(...left.map(q => dueOf(stats[q.id]!)));
    const late = due.filter(q => picked.has(q.id) && dueOf(stats[q.id]!) > oldestLeft);
    if (late.length) out.push(`古い期限切れより新しい期限切れを先に入れた（${late.map(q => q.id).join(" ")}）`);
    // 期限切れが残っているのに、期限前を入れない
    if (pickedAhead.length) out.push(`期限切れが残っているのに期限前を入れた（${pickedAhead.join(" ")}）`);
  }
  return out;
}

/** 毎日 sessions 回ずつ解き続ける。正解の確率は p。すべての回で決まりを確かめる */
function simulate(exam: Exam, { days = 30, sessions = 2, size = 10, maxNew = 6, p = 0.7, seed = 1 } = {}) {
  const rng: Rng = seeded(seed);
  const stats: Record<string, ItemStat> = {};
  const problems: string[] = [];
  let allSeenOn: number | undefined;
  const firstPicks: string[][] = [];
  for (let d = 0; d < days; d++)
    for (let s = 0; s < sessions; s++) {
      const now = day(d, 9 + s * 3);
      const ids = planPractice(exam, id => stats[id], now, seeded(seed * 1000 + d * 10 + s), { size, maxNew });
      for (const v of violations(exam, { ids, stats, now, size, maxNew }))
        problems.push(`${d} 日目 ${s + 1} 回目：${v}`);
      firstPicks.push(ids);
      for (const id of ids) stats[id] = review(stats[id], rng() < p, now);
      if (allSeenOn === undefined && exam.questions.every(q => stats[q.id])) allSeenOn = d;
    }
  return { problems, allSeenOn, stats, firstPicks };
}

describe("毎日解き続けたときの練習の組み方（#97・#98）", () => {
  const exam = bigExam(120);

  test.each([
    { p: 0.3, label: "ほとんど間違える" },
    { p: 0.7, label: "7 割正解" },
    { p: 1, label: "全部正解" },
  ])("$label：すべての回で決まりを守る", ({ p }) => {
    for (const seed of [1, 2, 3]) expect(simulate(exam, { p, seed }).problems).toEqual([]);
  });

  test("回の長さや新しい問題の上限を変えても決まりを守る", () => {
    for (const [size, maxNew] of [
      [5, 6],
      [10, 2],
      [20, 6],
      [3, 1],
    ] as const)
      expect(simulate(exam, { size, maxNew, p: 0.4 }).problems, `size ${size} maxNew ${maxNew}`).toEqual([]);
  });

  test("復習が溜まっても、新しい問題に辿り着ける（全問を見終える）", () => {
    // ほとんど間違える人でも、1 日 2 回 × 10 問なら、120 問を 30 日以内に一度は見る
    const { allSeenOn } = simulate(exam, { p: 0.2, days: 40 });
    expect(allSeenOn).toBeDefined();
    expect(allSeenOn!).toBeLessThan(30);
  });

  test("同じ状態から組む回は、種が違えば顔ぶれが変わる（問題 ID の順で決まらない）", () => {
    const { stats } = simulate(exam, { p: 0.5, days: 15 });
    const now = day(15);
    const due = exam.questions.filter(q => isDue(stats[q.id], now)).map(q => q.id);
    expect(due.length).toBeGreaterThan(10);
    const runs = 300;
    const count = new Map<string, number>();
    for (let s = 0; s < runs; s++)
      for (const id of planPractice(exam, id => stats[id], now, seeded(s), { size: 10, maxNew: 0 }))
        count.set(id, (count.get(id) ?? 0) + 1);
    // 古い日から 10 枠を埋めたときの、境目の日の期限切れ。この日の問題どうしは同点なので、どれも選ばれることがあり、
    // どれも毎回は選ばれない（問題 ID の順で決めていると、ID の若いものだけが毎回選ばれる）
    const byDay = [...due].sort((a, b) => dueOf(stats[a]!) - dueOf(stats[b]!));
    const edge = dueOf(stats[byDay[9]!]!);
    const before = byDay.filter(id => dueOf(stats[id]!) < edge);
    const group = byDay.filter(id => dueOf(stats[id]!) === edge);
    expect(group.length, "境目の日の問題が枠より多い状態で確かめる").toBeGreaterThan(10 - before.length);
    for (const id of before) expect(count.get(id), `${id} は古い日なので毎回入る`).toBe(runs);
    for (const id of group) {
      expect(count.get(id) ?? 0, id).toBeGreaterThan(0);
      expect(count.get(id) ?? 0, id).toBeLessThan(runs);
    }
  });

  test("回の中の並びも混ざっている（復習・新しい問題がひとかたまりにならない）", () => {
    const { stats } = simulate(exam, { p: 0.5, days: 5 });
    let freshFirst = 0;
    for (let s = 0; s < 200; s++) {
      const ids = planPractice(exam, id => stats[id], day(5), seeded(s), { size: 9, maxNew: 3 });
      if (!stats[ids[0]!]) freshFirst++;
    }
    // 新しい問題は 9 問中 3 問なので、先頭に来るのはおよそ 3 分の 1
    expect(freshFirst).toBeGreaterThan(30);
    expect(freshFirst).toBeLessThan(110);
  });
});
