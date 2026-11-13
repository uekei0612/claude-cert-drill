/* 記録の形。localStorage のキーは 1 つ。読み込むときに版を見て移行し、値は 1 つずつ検証する
   （壊れた値は捨てて既定値に戻す。1 つの壊れた値で記録全体を失わないため） */
import type { ItemStat } from "../engine/schedule";

export const VERSION = 1;

/** 問題文の言語。en＝英語（本番と同じ）、peek＝英語で、訳はタップで開く、both＝英語の下に日本語、ja＝日本語 */
export type QuestionLang = "en" | "peek" | "both" | "ja";
export const QUESTION_LANGS: readonly QuestionLang[] = ["en", "peek", "both", "ja"];

/** 見た目。system＝端末に合わせる */
export type Theme = "system" | "light" | "dark";
export const THEMES: readonly Theme[] = ["system", "light", "dark"];

export interface Settings {
  /** 1 回の練習の問題数 */
  readonly practiceSize: number;
  readonly lang: QuestionLang;
  readonly theme: Theme;
  /** 前回開いた資格（起動時にそこへ） */
  readonly lastExam?: string;
}

export interface MockResult {
  readonly finishedAt: number;
  readonly correct: number;
  readonly total: number;
  readonly weighted: number;
  readonly scenarioIds: readonly string[];
  /** 分野 ID → [正解, 問題数] */
  readonly byDomain: Readonly<Record<string, readonly [number, number]>>;
  /** 見直し用：出した問題（出した順）と、選んだ元の選択肢の添字 */
  readonly questionIds?: readonly string[];
  readonly answers?: Readonly<Record<string, number>>;
}

/** 解いている途中の模擬試験（閉じても続きから） */
export interface ActiveMock {
  readonly examId: string;
  readonly questionIds: readonly string[];
  readonly scenarioIds: readonly string[];
  /** 始めた時刻。この模擬試験を見分ける印に使う（残り時間の計算には使わない） */
  readonly startedAt: number;
  readonly limitMs: number;
  /** これまでに使った時間（ms）。時間は画面を開いている間だけ進む */
  readonly usedMs: number;
  /** 問題 ID → 選んだ元の選択肢の添字 */
  readonly answers: Readonly<Record<string, number>>;
  readonly flags: readonly string[];
  /** 問題 ID → 表示する選択肢の順番 */
  readonly orders: Readonly<Record<string, readonly number[]>>;
  /** 今見ている問題の位置 */
  readonly cursor: number;
}

export interface Data {
  readonly version: number;
  readonly settings: Settings;
  /** "<資格ID>:<問題ID>" → 記録 */
  readonly items: Readonly<Record<string, ItemStat>>;
  /** 資格 ID → 終えた模擬試験（新しい順、最大 20） */
  readonly mocks: Readonly<Record<string, readonly MockResult[]>>;
  readonly activeMock?: ActiveMock;
  /** 後で振り返る印。"<資格ID>:<問題ID>" → 印を付けた時刻 */
  readonly saved?: Readonly<Record<string, number>>;
}

export const DEFAULT_SETTINGS: Settings = { practiceSize: 10, lang: "en", theme: "system" };
export const PRACTICE_SIZES = [5, 10, 20] as const;
export const MAX_MOCKS = 20;

export const emptyData = (): Data => ({ version: VERSION, settings: DEFAULT_SETTINGS, items: {}, mocks: {} });

export const itemKey = (examId: string, questionId: string): string => `${examId}:${questionId}`;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);
const num = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const KEY_RE = /^[a-z0-9-]+:[a-z0-9-]+$/;

function item(x: unknown): ItemStat | undefined {
  if (!isObj(x)) return undefined;
  const { ease, interval, due, tries, correct, last } = x;
  if (![ease, interval, due, tries, correct].every(num)) return undefined;
  if ((ease as number) <= 0 || (interval as number) < 0 || (tries as number) < (correct as number)) return undefined;
  return {
    ease: ease as number,
    interval: interval as number,
    due: due as number,
    tries: tries as number,
    correct: correct as number,
    last: num(last) ? last : (due as number),
  };
}

function settings(x: unknown): Settings {
  if (!isObj(x)) return DEFAULT_SETTINGS;
  const size = (PRACTICE_SIZES as readonly unknown[]).includes(x.practiceSize)
    ? (x.practiceSize as number)
    : DEFAULT_SETTINGS.practiceSize;
  const lastExam = typeof x.lastExam === "string" && /^[a-z0-9-]+$/.test(x.lastExam) ? x.lastExam : undefined;
  const lang = (QUESTION_LANGS as readonly unknown[]).includes(x.lang)
    ? (x.lang as QuestionLang)
    : DEFAULT_SETTINGS.lang;
  const theme = (THEMES as readonly unknown[]).includes(x.theme) ? (x.theme as Theme) : DEFAULT_SETTINGS.theme;
  const base: Settings = { practiceSize: size, lang, theme };
  return lastExam ? { ...base, lastExam } : base;
}

const strArr = (x: unknown): x is string[] => Array.isArray(x) && x.every(s => typeof s === "string");

function answersOf(x: Obj): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(x)) if (num(v) && Number.isInteger(v) && v >= 0 && v <= 3) out[k] = v;
  return out;
}

function mockResult(x: unknown): MockResult | undefined {
  if (!isObj(x)) return undefined;
  const { finishedAt, correct, total, weighted, scenarioIds, byDomain } = x;
  if (![finishedAt, correct, total, weighted].every(num)) return undefined;
  if (!Array.isArray(scenarioIds) || !scenarioIds.every(s => typeof s === "string")) return undefined;
  if (!isObj(byDomain)) return undefined;
  const bd: Record<string, readonly [number, number]> = {};
  for (const [k, v] of Object.entries(byDomain))
    if (Array.isArray(v) && v.length === 2 && v.every(num)) bd[k] = [v[0] as number, v[1] as number];
  const base: MockResult = {
    finishedAt: finishedAt as number,
    correct: correct as number,
    total: total as number,
    weighted: weighted as number,
    scenarioIds,
    byDomain: bd,
  };
  if (!strArr(x.questionIds) || !isObj(x.answers)) return base;
  return { ...base, questionIds: x.questionIds, answers: answersOf(x.answers) };
}

function activeMock(x: unknown): ActiveMock | undefined {
  if (!isObj(x)) return undefined;
  const { examId, questionIds, scenarioIds, startedAt, limitMs, answers, flags, orders, cursor } = x;
  if (typeof examId !== "string" || !strArr(questionIds) || !strArr(scenarioIds) || !strArr(flags)) return undefined;
  if (![startedAt, limitMs].every(num) || !isObj(answers) || !isObj(orders)) return undefined;
  const ans = answersOf(answers);
  const ord: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(orders))
    if (Array.isArray(v) && v.length === 4 && [...v].sort().join() === "0,1,2,3") ord[k] = v as number[];
  return {
    examId,
    questionIds,
    scenarioIds,
    startedAt: startedAt as number,
    limitMs: limitMs as number,
    // 使った時間を持たない記録（#42 より前）は、時間を使っていない扱い。
    // 前の数え方（開始時刻からの差）に合わせると、閉じていた分で時間切れになるため
    usedMs: num(x.usedMs) && x.usedMs >= 0 ? Math.min(x.usedMs, limitMs as number) : 0,
    answers: ans,
    flags,
    orders: ord,
    cursor: num(cursor) ? Math.max(0, Math.min(questionIds.length - 1, Math.floor(cursor))) : 0,
  };
}

/** どんな値からでも、正しい形の記録を作る（読み込み・取り込みの両方で使う） */
export function parseData(raw: unknown): Data {
  if (!isObj(raw)) return emptyData();
  // 版が新しすぎる記録（新しいアプリで書き出したもの）も、分かる値だけ読む
  const items: Record<string, ItemStat> = {};
  if (isObj(raw.items))
    for (const [k, v] of Object.entries(raw.items)) {
      const s = item(v);
      if (s && KEY_RE.test(k)) items[k] = s;
    }
  const mocks: Record<string, MockResult[]> = {};
  if (isObj(raw.mocks))
    for (const [k, v] of Object.entries(raw.mocks))
      if (Array.isArray(v))
        mocks[k] = v
          .map(mockResult)
          .filter((m): m is MockResult => !!m)
          .sort((a, b) => b.finishedAt - a.finishedAt)
          .slice(0, MAX_MOCKS);
  const saved: Record<string, number> = {};
  if (isObj(raw.saved)) for (const [k, v] of Object.entries(raw.saved)) if (num(v) && KEY_RE.test(k)) saved[k] = v;
  const am = activeMock(raw.activeMock);
  const data: Data = { version: VERSION, settings: settings(raw.settings), items, mocks };
  const withSaved = Object.keys(saved).length ? { ...data, saved } : data;
  return am ? { ...withSaved, activeMock: am } : withSaved;
}
