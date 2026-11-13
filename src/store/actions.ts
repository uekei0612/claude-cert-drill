/* 記録を変える操作。画面からはここを呼ぶ */
import { type ItemStat, review, reviewGuess } from "../engine/schedule";
import type { MockScore } from "../engine/mock";
import { type ActiveMock, type Data, MAX_MOCKS, type Settings, emptyData, itemKey } from "./schema";

export const answer = (d: Data, examId: string, questionId: string, ok: boolean, now: number): Data => {
  const k = itemKey(examId, questionId);
  return { ...d, items: { ...d.items, [k]: review(d.items[k], ok, now) } };
};

/** 練習の答えを取り消す：答える前の記録（prev）に戻す。答える前に記録が無かったなら消す（#44） */
export const restoreItem = (d: Data, examId: string, questionId: string, prev: ItemStat | undefined): Data => {
  const k = itemKey(examId, questionId);
  const { [k]: _drop, ...rest } = d.items;
  return { ...d, items: prev ? { ...rest, [k]: prev } : rest };
};

/** 正解のあとの「勘だった」を付ける・外す。答える前の記録（prev）から付け直す（#27） */
export const markGuess = (
  d: Data,
  examId: string,
  questionId: string,
  prev: ItemStat | undefined,
  guess: boolean,
  now: number,
): Data => restoreItem(d, examId, questionId, guess ? reviewGuess(prev, now) : review(prev, true, now));

/** 後で振り返る印を付ける・外す */
export function toggleSaved(d: Data, examId: string, questionId: string, now: number): Data {
  const k = itemKey(examId, questionId);
  const { [k]: had, ...rest } = d.saved ?? {};
  return { ...d, saved: had === undefined ? { ...rest, [k]: now } : rest };
}

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

export const setSettings = (d: Data, s: Partial<Settings>): Data => ({ ...d, settings: { ...d.settings, ...s } });

/** 資格の試験日を決める・消す（date が空なら消す） */
export function setExamDate(d: Data, examId: string, date: string): Data {
  const { [examId]: _drop, ...rest } = d.settings.examDates ?? {};
  return setSettings(d, { examDates: date ? { ...rest, [examId]: date } : rest });
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
  };
  const mocks = { ...d.mocks, [m.examId]: [result, ...(d.mocks[m.examId] ?? [])].slice(0, MAX_MOCKS) };
  return { ...abandonMock(d), items, mocks };
}

/** 資格 1 つ分の記録を消す */
export function resetExam(d: Data, examId: string): Data {
  const items = Object.fromEntries(Object.entries(d.items).filter(([k]) => !k.startsWith(`${examId}:`)));
  const { [examId]: _drop, ...mocks } = d.mocks;
  const mine = ([k]: [string, unknown]) => !k.startsWith(`${examId}:`);
  const saved = Object.fromEntries(Object.entries(d.saved ?? {}).filter(mine));
  const read = Object.fromEntries(Object.entries(d.read ?? {}).filter(mine));
  const cleared = { ...d, items, mocks, saved, read };
  return d.activeMock?.examId === examId ? abandonMock(cleared) : cleared;
}

export const resetAll = (): Data => emptyData();
