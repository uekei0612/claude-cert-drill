/* 練習の 1 回分の組み立て。
   期限切れ（古い順）→ 未出題（配点 ×（1 − その分野の覚えた割合）で重み付けして選ぶ）→ 期限前（近い順）。
   問題が少ない資格なので、同じ回に同じ問題は入れない（足りなければ短い回になる） */
import type { Exam, Question } from "../exam/types";
import { domainOf } from "../exam/types";
import { type StatOf, questionsOfDomain, ratio, tally } from "./progress";
import { type Rng, pickWeighted, shuffle } from "./rng";

export interface PracticeOptions {
  readonly size?: number;
  /** 1 回に入れる未出題の上限 */
  readonly maxNew?: number;
  /** 出題を絞る（細目 "1.1"、分野 "d1"、シナリオ "s1"） */
  readonly only?: string;
  /** 出題をこの問題に絞る（後で振り返る印を付けた問題など。only より優先） */
  readonly ids?: readonly string[];
}

/** 問題を名指しする絞り込み（"q:s1-01,s2-03"）。間違えた問題だけを解き直すときに使う（#39） */
export const idsOnly = (ids: readonly string[]): string => `q:${ids.join(",")}`;

/** 問題を名指しする絞り込みなら、その問題 ID の並び。ほかの絞り込みなら無し */
export const parseIdsOnly = (only?: string): string[] | undefined =>
  only?.startsWith("q:") ? only.slice(2).split(",").filter(Boolean) : undefined;

export function filterQuestions(exam: Exam, only?: string): Question[] {
  if (!only) return [...exam.questions];
  if (/^d\d+$/.test(only)) return questionsOfDomain(exam, only);
  if (/^s\d+$/.test(only)) return exam.questions.filter(q => q.scenario === only);
  return exam.questions.filter(q => q.tasks.includes(only));
}

export function planPractice(
  exam: Exam,
  statOf: StatOf,
  now: number,
  rng: Rng,
  { size = 10, maxNew = 6, only, ids }: PracticeOptions = {},
): string[] {
  const pool = ids ? exam.questions.filter(q => ids.includes(q.id)) : filterQuestions(exam, only);
  const due = pool
    .filter(q => statOf(q.id) && statOf(q.id)!.due <= now)
    .sort((a, b) => statOf(a.id)!.due - statOf(b.id)!.due);
  const fresh = shuffle(
    rng,
    pool.filter(q => !statOf(q.id)),
  );
  const ahead = pool
    .filter(q => statOf(q.id) && statOf(q.id)!.due > now)
    .sort((a, b) => statOf(a.id)!.due - statOf(b.id)!.due);

  // 分野の弱さ：配点 ×（1 − 覚えた割合）。全部覚えた分野にも少しは回す
  const weakness = new Map(
    exam.domains.map(d => [d.id, d.weight * (1.05 - ratio(tally(questionsOfDomain(exam, d.id), statOf, now)))]),
  );
  const takeFresh = (n: number): Question[] => {
    const out: Question[] = [];
    while (out.length < n && fresh.length) {
      const i = pickWeighted(rng, fresh, q => weakness.get(domainOf(exam, q)?.id ?? "") ?? 0);
      out.push(...fresh.splice(i, 1));
    }
    return out;
  };

  const picked: Question[] = due.slice(0, size);
  picked.push(...takeFresh(Math.min(maxNew, size - picked.length)));
  picked.push(...ahead.slice(0, Math.max(0, size - picked.length)));
  picked.push(...takeFresh(size - picked.length));
  return shuffle(rng, picked).map(q => q.id);
}

/** 元の並び（0, 1, …, n−1） */
export const naturalOrder = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** 表示する選択肢の順番（位置で覚えないように混ぜる）。返すのは元の添字の並び */
export const optionOrder = (rng: Rng, n: number): number[] => shuffle(rng, naturalOrder(n));

/** 0〜n−1 の並べ替えか */
export const isPermutation = (order: readonly number[], n: number): boolean =>
  order.length === n && naturalOrder(n).every(i => order.includes(i));

/** 記録にある選択肢の並びを使う。この問題の並べ替えになっていなければ（選択肢の数が変わったなど）元の並び */
export const orderFor = (q: Question, saved?: readonly number[]): readonly number[] =>
  saved && isPermutation(saved, q.options.length) ? saved : naturalOrder(q.options.length);
