/* 「覚えた」の判定（review・isKnown・isLearning）を、答え方の長い列で確かめる（#99）。
   決まり：日をあけて 2 回続けて正解すると覚えた（#28）。同じ日（朝 4 時で区切る。#93）に何度正解しても覚えたにならない。
   期限は日で数える（#90）。誤答・勘の正解で戻る（#27）。期限を間隔の分以上過ぎると外れる */
import { describe, expect, test } from "vitest";
import { seeded } from "./rng";
import {
  DAY,
  type ItemStat,
  KNOWN_INTERVAL,
  MAX_EASE,
  MAX_INTERVAL,
  MIN_EASE,
  dueOf,
  isKnown,
  isLearning,
  isStale,
  recordDate,
  review,
  reviewGuess,
} from "./schedule";

/** 端末の時刻で、11 月 d 日 h 時 m 分 */
const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).getTime();
const dayOf = (t: number) => recordDate(t).getTime();

type Kind = "ok" | "ng" | "guess";
const apply = (s: ItemStat | undefined, k: Kind, t: number): ItemStat =>
  k === "guess" ? reviewGuess(s, t) : review(s, k === "ok", t);

describe("同じ日の中では覚えたにならない（#28・#93）", () => {
  test("朝 4 時から翌朝 3:59 までに、どんな答え方を何回しても覚えたにならない", () => {
    const rng = seeded(1);
    const kinds: Kind[] = ["ok", "ok", "ok", "ng", "guess"];
    for (let t = 0; t < 2000; t++) {
      let s: ItemStat | undefined;
      // 4:00 〜 翌 3:59 のあいだの時刻を、昇順に 1〜12 個
      const times = Array.from(
        { length: 1 + Math.floor(rng() * 12) },
        () => at(5, 4) + Math.floor(rng() * (DAY - 1)),
      ).sort((a, b) => a - b);
      for (const time of times) {
        s = apply(s, kinds[Math.floor(rng() * kinds.length)]!, time);
        expect(isKnown(s, time)).toBe(false);
        expect(s.interval).toBeLessThanOrEqual(1);
      }
    }
  });
  test("0 時をまたいでも、4 時より前なら同じ日", () => {
    const a = review(undefined, true, at(5, 23, 30));
    const b = review(a, true, at(6, 3, 59));
    expect([b.interval, isKnown(b, at(6, 3, 59))]).toEqual([1, false]);
    const c = review(a, true, at(6, 4, 0));
    expect([c.interval, isKnown(c, at(6, 4, 0))]).toEqual([KNOWN_INTERVAL, true]);
  });
});

describe("日をあけて 2 回正解すると覚えた（#28・#90）", () => {
  test("1 回目が何時でも、次の日（朝 4 時以降）の正解で覚えたになる", () => {
    // 1 回目：5 日の 4:00 〜 6 日の 3:30 を 30 分おき。2 回目：次の日の 4:00 〜 翌 3:30 を 30 分おき
    for (let i = 0; i < 48; i++) {
      const first = at(5, 4) + i * 30 * 60_000;
      const a = review(undefined, true, first);
      expect(isLearning(a, first)).toBe(true);
      for (let j = 0; j < 48; j++) {
        const second = at(6, 4) + j * 30 * 60_000;
        const b = review(a, true, second);
        expect(isKnown(b, second), `${new Date(first).toString()} → ${new Date(second).toString()}`).toBe(true);
      }
    }
  });
  test("夜 21 時に正解して、翌朝 8 時に正解すると覚えた（#90）", () => {
    const b = review(review(undefined, true, at(5, 21)), true, at(6, 8));
    expect(isKnown(b, at(6, 8))).toBe(true);
  });
  test("何日あいても（期限を過ぎて忘れていそうでも）、2 回目の正解で覚えた", () => {
    for (const gap of [1, 2, 5, 30, 200]) {
      const b = review(review(undefined, true, at(1, 9)), true, at(1, 9) + gap * DAY);
      expect(isKnown(b, at(1, 9) + gap * DAY), `${gap} 日`).toBe(true);
    }
  });
});

describe("戻るとき", () => {
  const known = review(review(undefined, true, at(5, 9)), true, at(6, 9));
  test("覚えた問題を間違えると、覚えた・覚えかけから外れ、忘れた回数が 1 増える", () => {
    const s = review(known, false, at(7, 9));
    expect([isKnown(s, at(7, 9)), isLearning(s, at(7, 9)), s.lapses]).toEqual([false, false, 1]);
  });
  test("勘で当たった正解は、覚えた・覚えかけに入れない（#27）", () => {
    for (const prev of [undefined, known, review(undefined, true, at(5, 9))]) {
      const s = reviewGuess(prev, at(9, 9));
      expect([isKnown(s, at(9, 9)), isLearning(s, at(9, 9))]).toEqual([false, false]);
    }
  });
  test("期限を間隔の分以上過ぎると覚えたから外れ、もう一度正解すると戻る", () => {
    const due = dueOf(known);
    const limit = due + known.interval * DAY;
    expect(isKnown(known, limit)).toBe(true);
    expect(isKnown(known, limit + 1)).toBe(false);
    expect(isLearning(known, limit + 1)).toBe(true);
    const again = review(known, true, limit + 1);
    expect(isKnown(again, limit + 1)).toBe(true);
  });
});

describe("答え方の長い列で、判定が答えの履歴と食い違わない（#99）", () => {
  /** 履歴から決まる「覚えた」：最後に続いている本物の正解（誤答・勘をはさまない）が 2 つ以上の日にまたがり、
      期限を大きく過ぎていない */
  function expectedKnown(history: { kind: Kind; t: number }[], s: ItemStat, now: number): boolean {
    const days = new Set<number>();
    for (let i = history.length - 1; i >= 0 && history[i]!.kind === "ok"; i--) days.add(dayOf(history[i]!.t));
    return days.size >= 2 && !isStale(s, now);
  }

  test.each([1, 2, 3, 4, 5])("種 %i：200 問 × 最大 40 回の答え方", seed => {
    const rng = seeded(seed);
    for (let item = 0; item < 200; item++) {
      let s: ItemStat | undefined;
      const history: { kind: Kind; t: number }[] = [];
      let t = at(1, 4) + Math.floor(rng() * DAY);
      let lapses = 0;
      const n = 1 + Math.floor(rng() * 40);
      for (let k = 0; k < n; k++) {
        // 次に答えるまで：数分（同じ回）・数時間・数日・数十日
        const r = rng();
        t +=
          r < 0.3
            ? Math.floor(rng() * 20 * 60_000)
            : r < 0.55
              ? Math.floor(rng() * 12 * 3_600_000)
              : r < 0.9
                ? Math.floor(rng() * 5 * DAY)
                : Math.floor(rng() * 60 * DAY);
        const kr = rng();
        const kind: Kind = kr < 0.65 ? "ok" : kr < 0.9 ? "ng" : "guess";
        if (kind === "ng" && s && s.interval >= 1) lapses++;
        s = apply(s, kind, t);
        history.push({ kind, t });

        const ctx = `問 ${item} の ${k + 1} 回目：${history.map(h => `${h.kind}@${new Date(h.t).toISOString()}`).join(" ")}`;
        // 何日か後に見たときも含めて、判定が履歴と合う
        for (const later of [t, t + DAY, t + 10 * DAY]) {
          expect(isKnown(s, later), ctx).toBe(expectedKnown(history, s, later));
          expect(isKnown(s, later) && isLearning(s, later), ctx).toBe(false);
          expect(isLearning(s, later), ctx).toBe(s.interval >= 1 && !isKnown(s, later));
        }
        expect(s.lapses ?? 0, ctx).toBe(lapses);
        expect(s.tries, ctx).toBe(history.length);
        expect(s.correct, ctx).toBe(history.filter(h => h.kind !== "ng").length);
        expect(s.interval).toBeLessThanOrEqual(MAX_INTERVAL);
        expect(s.ease).toBeGreaterThanOrEqual(MIN_EASE);
        expect(s.ease).toBeLessThanOrEqual(MAX_EASE);
        expect(s.last).toBe(t);
        expect(dueOf(s)).toBeGreaterThan(s.last - DAY);
      }
    }
  });
});
