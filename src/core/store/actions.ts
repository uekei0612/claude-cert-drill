/* 記録を変える操作。画面からはここを呼ぶ */
import { type ItemStat, isWeak, review, reviewGuess } from "../engine/schedule";
import type { MockScore } from "../engine/mock";
import { dayKey } from "../engine/plan";
import type { Exam } from "../exam/types";
import {
  type ActiveMock,
  type ActivePractice,
  type Data,
  type ExamSettings,
  MAX_MOCKS,
  MAX_NOTE,
  type Note,
  type QuestionLang,
  type Settings,
  capDays,
  emptyData,
  itemKey,
} from "./schema";

/** 日ごとの回答に足す（取り消しでは負の数を足す。0 未満にはしない。#38） */
export function logDay(d: Data, examId: string, at: number, answered: number, correct: number): Data {
  const k = `${examId}:${dayKey(at)}`;
  const [a, c] = d.days?.[k] ?? [0, 0];
  const na = Math.max(0, a + answered);
  const nc = Math.min(na, Math.max(0, c + correct));
  const { [k]: _drop, ...rest } = d.days ?? {};
  if (na) return { ...d, days: capDays({ ...rest, [k]: [na, nc] }) };
  if (Object.keys(rest).length) return { ...d, days: rest };
  const { days: _none, ...without } = d;
  return without;
}

/** 資格の答えた日（"YYYY-MM-DD" → [答えた数, 正解した数]） */
export const daysOf = (d: Data, examId: string): Map<string, readonly [number, number]> =>
  new Map(
    Object.entries(d.days ?? {})
      .filter(([k]) => k.startsWith(`${examId}:`))
      .map(([k, v]) => [k.slice(examId.length + 1), v]),
  );

export const answer = (d: Data, examId: string, questionId: string, ok: boolean, now: number): Data => {
  const k = itemKey(examId, questionId);
  return logDay({ ...d, items: { ...d.items, [k]: review(d.items[k], ok, now) } }, examId, now, 1, ok ? 1 : 0);
};

/** 練習の答えを取り消す：答える前の記録（prev）に戻す。答える前に記録が無かったなら消す（#44） */
export const restoreItem = (d: Data, examId: string, questionId: string, prev: ItemStat | undefined): Data => {
  const k = itemKey(examId, questionId);
  const { [k]: _drop, ...rest } = d.items;
  return { ...d, items: prev ? { ...rest, [k]: prev } : rest };
};

/** 練習の答えを取り消す：問題の記録を答える前（prev）に戻し、その日の回答からも外す（#44・#38）。
    at は答えた時刻、ok はその答えが正解だったか */
export const undoAnswer = (
  d: Data,
  examId: string,
  questionId: string,
  prev: ItemStat | undefined,
  at: number,
  ok: boolean,
): Data => logDay(restoreItem(d, examId, questionId, prev), examId, at, -1, ok ? -1 : 0);

/** 正解のあとの「勘だった」を付ける・外す。答える前の記録（prev）から付け直す（#27）。
    その日の正解の数も合わせる（勘は正解に数えない） */
export const markGuess = (
  d: Data,
  examId: string,
  questionId: string,
  prev: ItemStat | undefined,
  guess: boolean,
  now: number,
): Data =>
  logDay(
    restoreItem(d, examId, questionId, guess ? reviewGuess(prev, now) : review(prev, true, now)),
    examId,
    now,
    0,
    guess ? -1 : 1,
  );

/** 後で振り返る印を付ける・外す */
export function toggleSaved(d: Data, examId: string, questionId: string, now: number): Data {
  const k = itemKey(examId, questionId);
  const { [k]: had, ...rest } = d.saved ?? {};
  return { ...d, saved: had === undefined ? { ...rest, [k]: now } : rest };
}

/** 問題のメモを書く・直す。前後の空白を除いて空なら消す（#88） */
export function setNote(d: Data, examId: string, questionId: string, text: string, now: number): Data {
  const k = itemKey(examId, questionId);
  const { [k]: _had, ...rest } = d.notes ?? {};
  const t = text.trim().slice(0, MAX_NOTE);
  if (t) return { ...d, notes: { ...rest, [k]: { text: t, at: now } } };
  if (Object.keys(rest).length) return { ...d, notes: rest };
  const { notes: _none, ...without } = d;
  return without;
}

export const noteOf = (d: Data, examId: string, questionId: string): Note | undefined =>
  d.notes?.[itemKey(examId, questionId)];

/** メモのある問題の ID（新しく書いた順） */
export const noteIds = (d: Data, examId: string): string[] =>
  Object.entries(d.notes ?? {})
    .filter(([k]) => k.startsWith(`${examId}:`))
    .sort((a, b) => b[1].at - a[1].at)
    .map(([k]) => k.slice(examId.length + 1));

/** 教科書の章に「読んだ」を付ける・外す（#29） */
export function setRead(d: Data, examId: string, chapterId: string, on: boolean, now: number): Data {
  const k = `${examId}:${chapterId}`;
  const { [k]: _had, ...rest } = d.read ?? {};
  return { ...d, read: on ? { ...rest, [k]: now } : rest };
}

/** 読んだ章の ID */
export const readChapters = (d: Data, examId: string): Set<string> =>
  new Set(
    Object.keys(d.read ?? {})
      .filter(k => k.startsWith(`${examId}:`))
      .map(k => k.slice(examId.length + 1)),
  );

/** 印を付けた問題の ID（新しく付けた順） */
export const savedIds = (d: Data, examId: string): string[] =>
  Object.entries(d.saved ?? {})
    .filter(([k]) => k.startsWith(`${examId}:`))
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k.slice(examId.length + 1));

/** 苦手な問題の ID（忘れた回数の多い順、同じなら最後に答えたのが新しい順。#87）。
    今の問題に無い ID は除く */
export function weakIds(d: Data, exam: Pick<Exam, "id" | "questions">): string[] {
  const stat = (id: string) => d.items[itemKey(exam.id, id)];
  return exam.questions
    .filter(q => isWeak(stat(q.id)))
    .sort((a, b) => stat(b.id)!.lapses! - stat(a.id)!.lapses! || stat(b.id)!.last - stat(a.id)!.last)
    .map(q => q.id);
}

export const setSettings = (d: Data, s: Partial<Settings>): Data => ({ ...d, settings: { ...d.settings, ...s } });

/** その資格で使う 1 回の問題数（資格ごとの値が無ければ共通の値。#85） */
export const practiceSizeOf = (d: Data, examId: string): number =>
  d.settings.exams?.[examId]?.practiceSize ?? d.settings.practiceSize;

/** その資格で使う問題文の言語（資格ごとの値が無ければ共通の値。#85） */
export const langOf = (d: Data, examId: string): QuestionLang => d.settings.exams?.[examId]?.lang ?? d.settings.lang;

/** その資格だけの設定を変える（#85） */
export const setExamSettings = (d: Data, examId: string, s: ExamSettings): Data =>
  setSettings(d, { exams: { ...d.settings.exams, [examId]: { ...d.settings.exams?.[examId], ...s } } });

/** 資格の試験日を決める・消す（date が空なら消す） */
export function setExamDate(d: Data, examId: string, date: string): Data {
  const { [examId]: _drop, ...rest } = d.settings.examDates ?? {};
  return setSettings(d, { examDates: date ? { ...rest, [examId]: date } : rest });
}

/** 途中の練習を残す（資格ごとに 1 つ。前のものは置き換える。#86） */
export const savePractice = (d: Data, examId: string, p: ActivePractice): Data => ({
  ...d,
  practices: { ...d.practices, [examId]: p },
});

/** 途中の練習を捨てる */
export function clearPractice(d: Data, examId: string): Data {
  if (!d.practices?.[examId]) return d;
  const { [examId]: _drop, ...rest } = d.practices;
  if (Object.keys(rest).length) return { ...d, practices: rest };
  const { practices: _none, ...without } = d;
  return without;
}

/** 続きから始められる途中の練習。問題が入れ替わって見つからない問題があれば無し（#86） */
export function practiceOf(d: Data, exam: Pick<Exam, "id" | "questions">): ActivePractice | undefined {
  const p = d.practices?.[exam.id];
  if (!p) return undefined;
  const ids = new Set(exam.questions.map(q => q.id));
  return p.queue.every(id => ids.has(id)) ? p : undefined;
}

export const startMock = (d: Data, m: ActiveMock): Data => ({ ...d, activeMock: m });

export const patchMock = (d: Data, f: (m: ActiveMock) => ActiveMock): Data =>
  d.activeMock ? { ...d, activeMock: f(d.activeMock) } : d;

export const abandonMock = (d: Data): Data => {
  const { activeMock: _drop, ...rest } = d;
  return rest;
};

/** 模擬試験を終える。結果を残し、出した問題すべての記録（間隔反復）にも反映する（未回答は誤答） */
export function finishMock(d: Data, score: MockScore, now: number): Data {
  const m = d.activeMock;
  if (!m) return d;
  const items = { ...d.items };
  const ok = new Set(score.correctIds);
  for (const id of m.questionIds) {
    const k = itemKey(m.examId, id);
    items[k] = review(items[k], ok.has(id), now);
  }
  const result = {
    finishedAt: now,
    correct: score.correct,
    total: score.total,
    weighted: score.weighted,
    scenarioIds: m.scenarioIds,
    byDomain: Object.fromEntries(score.byDomain.map(b => [b.domainId, [b.correct, b.total] as const])),
    questionIds: m.questionIds,
    answers: m.answers,
    orders: m.orders,
  };
  const mocks = { ...d.mocks, [m.examId]: [result, ...(d.mocks[m.examId] ?? [])].slice(0, MAX_MOCKS) };
  return logDay({ ...abandonMock(d), items, mocks }, m.examId, now, m.questionIds.length, score.correct);
}

/** 資格 1 つ分の記録を消す */
export function resetExam(d: Data, examId: string): Data {
  const items = Object.fromEntries(Object.entries(d.items).filter(([k]) => !k.startsWith(`${examId}:`)));
  const { [examId]: _drop, ...mocks } = d.mocks;
  const mine = ([k]: [string, unknown]) => !k.startsWith(`${examId}:`);
  const saved = Object.fromEntries(Object.entries(d.saved ?? {}).filter(mine));
  const notes = Object.fromEntries(Object.entries(d.notes ?? {}).filter(mine));
  const read = Object.fromEntries(Object.entries(d.read ?? {}).filter(mine));
  const days = Object.fromEntries(Object.entries(d.days ?? {}).filter(mine));
  const cleared = { ...clearPractice(d, examId), items, mocks, saved, notes, read, days };
  return d.activeMock?.examId === examId ? abandonMock(cleared) : cleared;
}

export const resetAll = (): Data => emptyData();
