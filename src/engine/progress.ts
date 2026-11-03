/* 習熟の集計。問題は主たる細目（tasks[0]）で数える。
   「合格の目安」は、分野ごとの「覚えた問題の割合」を配点で重み付けしたもの。
   まだ解いていない問題は覚えていない扱い（本番の未回答が誤答なのと同じく、安全側に倒す） */
import type { Exam, Question } from "../exams/types";
import { domainOf } from "../exams/types";
import { type ItemStat, isDue, isKnown } from "./schedule";

export type StatOf = (questionId: string) => ItemStat | undefined;

export interface Tally {
  readonly total: number;
  /** 直近の回答が正解 */
  readonly known: number;
  /** 一度でも解いた */
  readonly seen: number;
  /** 期限が来ている */
  readonly due: number;
}

export function tally(qs: readonly Question[], statOf: StatOf, now: number): Tally {
  let known = 0;
  let seen = 0;
  let due = 0;
  for (const q of qs) {
    const s = statOf(q.id);
    if (s) seen++;
    if (isKnown(s)) known++;
    if (isDue(s, now)) due++;
  }
  return { total: qs.length, known, seen, due };
}

export const ratio = (t: Tally): number => (t.total ? t.known / t.total : 0);

export const questionsOfTask = (exam: Exam, taskId: string): Question[] =>
  exam.questions.filter(q => q.tasks[0] === taskId);

export const questionsOfDomain = (exam: Exam, domainId: string): Question[] =>
  exam.questions.filter(q => domainOf(exam, q)?.id === domainId);

/** 配点で重み付けした「覚えた割合」（0〜1）。問題の無い分野は 0 として数える */
export function readiness(exam: Exam, statOf: StatOf, now: number): number {
  return exam.domains.reduce((a, d) => a + d.weight * ratio(tally(questionsOfDomain(exam, d.id), statOf, now)), 0);
}

/** 期限が来ている問題の数 */
export const dueCount = (exam: Exam, statOf: StatOf, now: number): number =>
  exam.questions.filter(q => isDue(statOf(q.id), now)).length;

/** 伸ばすと合格の目安が一番上がる細目の順（配点 ×（1 − 覚えた割合）÷ その分野の問題数） */
export function weakestTasks(exam: Exam, statOf: StatOf, now: number, n = 3): { taskId: string; gain: number }[] {
  const out: { taskId: string; gain: number }[] = [];
  for (const d of exam.domains) {
    const inDomain = questionsOfDomain(exam, d.id).length;
    if (!inDomain) continue;
    for (const t of d.tasks) {
      const tl = tally(questionsOfTask(exam, t.id), statOf, now);
      if (!tl.total) continue;
      out.push({ taskId: t.id, gain: (d.weight * (tl.total - tl.known)) / inDomain });
    }
  }
  return out
    .filter(x => x.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, n);
}
