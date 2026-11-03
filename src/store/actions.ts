/* 記録を変える操作。画面からはここを呼ぶ */
import { review } from "../engine/schedule";
import type { MockScore } from "../engine/mock";
import { type ActiveMock, type Data, MAX_MOCKS, type Settings, emptyData, itemKey } from "./schema";

export const answer = (d: Data, examId: string, questionId: string, ok: boolean, now: number): Data => {
  const k = itemKey(examId, questionId);
  return { ...d, items: { ...d.items, [k]: review(d.items[k], ok, now) } };
};

export const setSettings = (d: Data, s: Partial<Settings>): Data => ({ ...d, settings: { ...d.settings, ...s } });

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
  };
  const mocks = { ...d.mocks, [m.examId]: [result, ...(d.mocks[m.examId] ?? [])].slice(0, MAX_MOCKS) };
  return { ...abandonMock(d), items, mocks };
}

/** 資格 1 つ分の記録を消す */
export function resetExam(d: Data, examId: string): Data {
  const items = Object.fromEntries(Object.entries(d.items).filter(([k]) => !k.startsWith(`${examId}:`)));
  const { [examId]: _drop, ...mocks } = d.mocks;
  const cleared = { ...d, items, mocks };
  return d.activeMock?.examId === examId ? abandonMock(cleared) : cleared;
}

export const resetAll = (): Data => emptyData();
