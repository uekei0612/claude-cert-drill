/* 記録の形。localStorage のキーは 1 つ。読み込むときに版を見て移行し、値は 1 つずつ検証する
   （壊れた値は捨てて既定値に戻す。1 つの壊れた値で記録全体を失わないため） */
import { MAX_OPTIONS, MIN_OPTIONS } from "../exam/types";
import { parseDate } from "../engine/plan";
import { isPermutation } from "../engine/practice";
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
  /** 資格 ID → その資格だけの設定（#85）。無い項目は上の共通の値を使う */
  readonly exams?: Readonly<Record<string, ExamSettings>>;
  /** 資格 ID → 試験日（"YYYY-MM-DD"）。ホームに 1 日の目安を逆算して出す（#37） */
  readonly examDates?: Readonly<Record<string, string>>;
  /** ホームの「はじめての方へ」を閉じた（#50） */
  readonly introDone?: boolean;
}

/** 資格ごとの設定（#85）。CCAR-F は英語で 5 問、科目A は 20 問、のように資格で使い方が違う */
export interface ExamSettings {
  readonly practiceSize?: number;
  readonly lang?: QuestionLang;
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
  /** 見直し用：解いたときの選択肢の並び（問題 ID → 元の添字の並び）。見直しでも同じ記号で出す（#46） */
  readonly orders?: Readonly<Record<string, readonly number[]>>;
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

/** 練習の 1 問分の結果 */
export interface PracticeDone {
  readonly id: string;
  readonly ok: boolean;
  /** 勘で当たった */
  readonly guess?: boolean;
}

/** 練習で答えを取り消すときに戻す先：答える前の記録と、この答えでやり直しに足したかどうか */
export interface PracticeUndo {
  readonly prev?: ItemStat;
  readonly requeued: boolean;
  /** 答えた時刻（その日の回答から外すため） */
  readonly at: number;
}

/** 解いている途中の練習（ホームに戻っても続きから。#86） */
export interface ActivePractice {
  /** 絞り込み（無しは全部の問題から） */
  readonly only?: string;
  /** 出す問題の並び（間違えて回の最後に足した「やり直し」も含む） */
  readonly queue: readonly string[];
  /** 今の問題の位置 */
  readonly pos: number;
  readonly done: readonly PracticeDone[];
  /** やり直しに足した問題 */
  readonly requeued: readonly string[];
  /** 問題 ID → 表示する選択肢の順番 */
  readonly orders: Readonly<Record<string, readonly number[]>>;
  /** 今の問題で選んだ元の選択肢の添字（答えを見ている途中なら） */
  readonly chosen?: number;
  readonly undo?: PracticeUndo;
  readonly guess?: boolean;
  /** 最後に答えた時刻 */
  readonly updatedAt: number;
}

/** 問題ごとのメモ（#88）。なぜ間違えたか・どこで迷ったかを自分の言葉で残す */
export interface Note {
  readonly text: string;
  /** 書いた（直した）時刻 */
  readonly at: number;
}

export interface Data {
  readonly version: number;
  readonly settings: Settings;
  /** "<資格ID>:<問題ID>" → 記録 */
  readonly items: Readonly<Record<string, ItemStat>>;
  /** 資格 ID → 終えた模擬試験（新しい順、最大 20） */
  readonly mocks: Readonly<Record<string, readonly MockResult[]>>;
  readonly activeMock?: ActiveMock;
  /** 資格 ID → 解いている途中の練習（#86） */
  readonly practices?: Readonly<Record<string, ActivePractice>>;
  /** 後で振り返る印。"<資格ID>:<問題ID>" → 印を付けた時刻 */
  readonly saved?: Readonly<Record<string, number>>;
  /** 問題ごとのメモ。"<資格ID>:<問題ID>" → メモ（#88） */
  readonly notes?: Readonly<Record<string, Note>>;
  /** 日ごとの回答。"<資格ID>:<YYYY-MM-DD>" → [答えた数, 正解した数]。古いものから捨てて MAX_DAYS 日分まで（#38） */
  readonly days?: Readonly<Record<string, readonly [number, number]>>;
  /** 教科書の読んだ章。"<資格ID>:<章ID>"（章 ID は細目 "1.1" か "intro"）→ 読んだ時刻（#29） */
  readonly read?: Readonly<Record<string, number>>;
}

export const DEFAULT_SETTINGS: Settings = { practiceSize: 10, lang: "en", theme: "system" };
export const PRACTICE_SIZES = [5, 10, 20] as const;
export const MAX_MOCKS = 20;
/** メモの長さの上限（文字） */
export const MAX_NOTE = 2000;
/** 日ごとの回答を残す日数（資格をまたいだキーの数。約 1 年強） */
export const MAX_DAYS = 400;

/** 日ごとの回答のキー */
export const DAY_KEY_RE = /^[a-z0-9-]+:\d{4}-\d{2}-\d{2}$/;

/** 日ごとの回答を、日付の新しいほうから MAX_DAYS 件に切る */
export function capDays(days: Record<string, readonly [number, number]>): Record<string, readonly [number, number]> {
  const keys = Object.keys(days);
  if (keys.length <= MAX_DAYS) return days;
  const date = (k: string) => k.slice(k.indexOf(":") + 1);
  const keep = keys.sort((a, b) => date(b).localeCompare(date(a))).slice(0, MAX_DAYS);
  return Object.fromEntries(keep.map(k => [k, days[k]!]));
}

export const emptyData = (): Data => ({ version: VERSION, settings: DEFAULT_SETTINGS, items: {}, mocks: {} });

export const itemKey = (examId: string, questionId: string): string => `${examId}:${questionId}`;

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);
const num = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const KEY_RE = /^[a-z0-9-]+:[a-z0-9-]+$/;
/** 章の記録のキー（章 ID に "." を含む） */
const READ_KEY_RE = /^[a-z0-9-]+:[a-z0-9.-]+$/;

function item(x: unknown): ItemStat | undefined {
  if (!isObj(x)) return undefined;
  const { ease, interval, due, tries, correct, last } = x;
  if (![ease, interval, due, tries, correct].every(num)) return undefined;
  if ((ease as number) <= 0 || (interval as number) < 0 || (tries as number) < (correct as number)) return undefined;
  const base: ItemStat = {
    ease: ease as number,
    interval: interval as number,
    due: due as number,
    tries: tries as number,
    correct: correct as number,
    last: num(last) ? last : (due as number),
  };
  // 忘れた回数（#87）。間違えた回数を超える値は壊れているので捨てる
  const { lapses } = x;
  return num(lapses) && Number.isInteger(lapses) && lapses > 0 && lapses <= base.tries - base.correct
    ? { ...base, lapses }
    : base;
}

const isSize = (x: unknown): x is number => (PRACTICE_SIZES as readonly unknown[]).includes(x);
const isLang = (x: unknown): x is QuestionLang => (QUESTION_LANGS as readonly unknown[]).includes(x);

/** 資格ごとの設定。知らない値の項目だけ捨て、空になった資格は残さない */
function examSettings(x: unknown): Record<string, ExamSettings> {
  const out: Record<string, ExamSettings> = {};
  if (!isObj(x)) return out;
  for (const [k, v] of Object.entries(x)) {
    if (!/^[a-z0-9-]+$/.test(k) || !isObj(v)) continue;
    const s: ExamSettings = {
      ...(isSize(v.practiceSize) ? { practiceSize: v.practiceSize } : {}),
      ...(isLang(v.lang) ? { lang: v.lang } : {}),
    };
    if (Object.keys(s).length) out[k] = s;
  }
  return out;
}

function settings(x: unknown): Settings {
  if (!isObj(x)) return DEFAULT_SETTINGS;
  const size = isSize(x.practiceSize) ? x.practiceSize : DEFAULT_SETTINGS.practiceSize;
  const lastExam = typeof x.lastExam === "string" && /^[a-z0-9-]+$/.test(x.lastExam) ? x.lastExam : undefined;
  const lang = isLang(x.lang) ? x.lang : DEFAULT_SETTINGS.lang;
  const theme = (THEMES as readonly unknown[]).includes(x.theme) ? (x.theme as Theme) : DEFAULT_SETTINGS.theme;
  const base: Settings = { practiceSize: size, lang, theme };
  const examDates: Record<string, string> = {};
  if (isObj(x.examDates))
    for (const [k, v] of Object.entries(x.examDates))
      if (/^[a-z0-9-]+$/.test(k) && typeof v === "string" && parseDate(v) !== undefined) examDates[k] = v;
  const exams = examSettings(x.exams);
  const withExams = Object.keys(exams).length ? { ...base, exams } : base;
  const withDates0 = Object.keys(examDates).length ? { ...withExams, examDates } : withExams;
  const withDates = x.introDone === true ? { ...withDates0, introDone: true } : withDates0;
  return lastExam ? { ...withDates, lastExam } : withDates;
}

const strArr = (x: unknown): x is string[] => Array.isArray(x) && x.every(s => typeof s === "string");

function answersOf(x: Obj): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(x)) if (num(v) && Number.isInteger(v) && v >= 0 && v < MAX_OPTIONS) out[k] = v;
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
  const withAnswers = { ...base, questionIds: x.questionIds, answers: answersOf(x.answers) };
  return isObj(x.orders) ? { ...withAnswers, orders: ordersOf(x.orders) } : withAnswers;
}

/** 選択肢の並び（0〜n−1 の並べ替えだけを残す。n は MIN_OPTIONS〜MAX_OPTIONS） */
function ordersOf(x: Obj): Record<string, number[]> {
  const ord: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(x))
    if (
      Array.isArray(v) &&
      v.length >= MIN_OPTIONS &&
      v.length <= MAX_OPTIONS &&
      v.every(num) &&
      isPermutation(v as number[], v.length)
    )
      ord[k] = v as number[];
  return ord;
}

function activeMock(x: unknown): ActiveMock | undefined {
  if (!isObj(x)) return undefined;
  const { examId, questionIds, scenarioIds, startedAt, limitMs, answers, flags, orders, cursor } = x;
  if (typeof examId !== "string" || !strArr(questionIds) || !strArr(scenarioIds) || !strArr(flags)) return undefined;
  if (![startedAt, limitMs].every(num) || !isObj(answers) || !isObj(orders)) return undefined;
  const ans = answersOf(answers);
  const ord = ordersOf(orders);
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

const int = (x: unknown): x is number => num(x) && Number.isInteger(x) && x >= 0;

function practiceDone(x: unknown): PracticeDone | undefined {
  if (!isObj(x) || typeof x.id !== "string" || typeof x.ok !== "boolean") return undefined;
  return x.guess === true && x.ok ? { id: x.id, ok: true, guess: true } : { id: x.id, ok: x.ok };
}

/** 途中の練習。形が崩れていれば丸ごと捨てる（中途半端に直すと回の数え方が合わなくなる） */
function activePractice(x: unknown): ActivePractice | undefined {
  if (!isObj(x)) return undefined;
  const { only, queue, pos, done, requeued, orders, chosen, undo, updatedAt } = x;
  if (!strArr(queue) || !queue.length || !strArr(requeued) || !Array.isArray(done) || !isObj(orders)) return undefined;
  if (!int(pos) || pos >= queue.length || !num(updatedAt)) return undefined;
  if (only !== undefined && typeof only !== "string") return undefined;
  const ds = done.map(practiceDone);
  if (!ds.every(d => d)) return undefined;
  const base: ActivePractice = {
    ...(typeof only === "string" ? { only } : {}),
    queue,
    pos,
    done: ds as PracticeDone[],
    requeued,
    orders: ordersOf(orders),
    updatedAt,
  };
  if (!int(chosen) || chosen >= MAX_OPTIONS) return base;
  const u =
    isObj(undo) && typeof undo.requeued === "boolean" && num(undo.at)
      ? { ...(item(undo.prev) ? { prev: item(undo.prev) } : {}), requeued: undo.requeued, at: undo.at }
      : undefined;
  return { ...base, chosen, ...(u ? { undo: u } : {}), ...(x.guess === true ? { guess: true } : {}) };
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
  const notes: Record<string, Note> = {};
  if (isObj(raw.notes))
    for (const [k, v] of Object.entries(raw.notes))
      if (KEY_RE.test(k) && isObj(v) && typeof v.text === "string" && v.text.trim() && num(v.at))
        notes[k] = { text: v.text.slice(0, MAX_NOTE), at: v.at };
  const days: Record<string, readonly [number, number]> = {};
  if (isObj(raw.days))
    for (const [k, v] of Object.entries(raw.days))
      if (
        DAY_KEY_RE.test(k) &&
        Array.isArray(v) &&
        v.length === 2 &&
        v.every(n => num(n) && Number.isInteger(n) && n >= 0) &&
        (v[1] as number) <= (v[0] as number)
      )
        days[k] = [v[0] as number, v[1] as number];
  const read: Record<string, number> = {};
  if (isObj(raw.read)) for (const [k, v] of Object.entries(raw.read)) if (num(v) && READ_KEY_RE.test(k)) read[k] = v;
  const am = activeMock(raw.activeMock);
  const practices: Record<string, ActivePractice> = {};
  if (isObj(raw.practices))
    for (const [k, v] of Object.entries(raw.practices)) {
      const p = activePractice(v);
      if (p && /^[a-z0-9-]+$/.test(k)) practices[k] = p;
    }
  const data0: Data = { version: VERSION, settings: settings(raw.settings), items, mocks };
  const data = Object.keys(practices).length ? { ...data0, practices } : data0;
  const withSaved = Object.keys(saved).length ? { ...data, saved } : data;
  const withNotes = Object.keys(notes).length ? { ...withSaved, notes } : withSaved;
  const withRead = Object.keys(read).length ? { ...withNotes, read } : withNotes;
  const capped = capDays(days);
  const withDays = Object.keys(capped).length ? { ...withRead, days: capped } : withRead;
  return am ? { ...withDays, activeMock: am } : withDays;
}
