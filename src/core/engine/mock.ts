/* 模擬試験。本番と同じくシナリオをランダムに選び、その問題をシナリオごとにまとめて出す。
   本番の問題数（format.questions）があれば、それをシナリオの数で割った数ずつ選ぶ（本番と同じ長さにする）。
   シナリオの無い資格は、配点に比例して分野から問題を選ぶ。採点はまとめて最後に行う */
import type { Exam, Question } from "../exam/types";
import { domainOf } from "../exam/types";
import { questionsOfDomain } from "./progress";
import { type Rng, shuffle } from "./rng";

export interface MockPlan {
  readonly questionIds: string[];
  readonly scenarioIds: string[];
  /** 制限時間（ms） */
  readonly limitMs: number;
}

export function planMock(exam: Exam, rng: Rng): MockPlan {
  const f = exam.format;
  if (exam.scenarios.length && f.scenariosPerExam > 0) {
    const withQuestions = exam.scenarios.filter(s => exam.questions.some(q => q.scenario === s.id));
    const chosen = shuffle(rng, withQuestions)
      .slice(0, f.scenariosPerExam)
      .sort((a, b) => exam.scenarios.indexOf(a) - exam.scenarios.indexOf(b));
    const perScenario = f.questions ? Math.ceil(f.questions / f.scenariosPerExam) : Infinity;
    const questionIds = chosen.flatMap(s =>
      shuffle(
        rng,
        exam.questions.filter(q => q.scenario === s.id),
      )
        .slice(0, perScenario)
        .map(q => q.id),
    );
    return {
      questionIds,
      scenarioIds: chosen.map(s => s.id),
      limitMs: questionIds.length * f.secondsPerQuestion * 1000,
    };
  }
  const n = Math.min(f.maxQuestions ?? exam.questions.length, exam.questions.length);
  const picked: Question[] = [];
  for (const d of exam.domains) {
    const k = Math.round(n * d.weight);
    picked.push(...shuffle(rng, questionsOfDomain(exam, d.id)).slice(0, k));
  }
  const questionIds = shuffle(rng, picked)
    .slice(0, n)
    .map(q => q.id);
  return { questionIds, scenarioIds: [], limitMs: questionIds.length * f.secondsPerQuestion * 1000 };
}

/* 時間は模擬試験の画面を開いている間だけ進む（閉じたり中断したりすると止まる）。
   開始時刻からの差で数えると、一晩おいて開いた瞬間に時間切れで採点されてしまうため（#42）。
   記録には「これまでに使った時間」だけを持ち、今回画面を開いた時刻（since）は画面の側で持つ */
export interface MockClock {
  readonly limitMs: number;
  /** これまでに使った時間（ms）。今回開いている分は含まない */
  readonly usedMs: number;
}

/** 残り時間。since は今回画面を開いた時刻（隠れている間は無し） */
export function mockLeft(m: MockClock, since: number | undefined, now: number): number {
  return m.limitMs - m.usedMs - (since === undefined ? 0 : Math.max(0, now - since));
}

/** 今回開いていた時間（since から now まで）を、使った時間に足す */
export function addUsed<T extends MockClock>(m: T, since: number, now: number): T {
  return { ...m, usedMs: m.usedMs + Math.max(0, now - since) };
}

export interface DomainScore {
  readonly domainId: string;
  readonly correct: number;
  readonly total: number;
}

export interface MockScore {
  readonly correct: number;
  readonly total: number;
  /** 正解した問題の ID */
  readonly correctIds: string[];
  readonly byDomain: DomainScore[];
  /** 出た分野の配点で重み付けした正答率（出なかった分野は除いて配点を割り直す） */
  readonly weighted: number;
  readonly passed: boolean;
}

/** answers は問題 ID → 選んだ元の選択肢の添字（未回答は無し＝誤答） */
export function scoreMock(
  exam: Exam,
  questionIds: readonly string[],
  answers: Readonly<Record<string, number>>,
): MockScore {
  const byId = new Map(exam.questions.map(q => [q.id, q]));
  const acc = new Map(exam.domains.map(d => [d.id, { correct: 0, total: 0 }]));
  let correct = 0;
  const correctIds: string[] = [];
  for (const id of questionIds) {
    const q = byId.get(id);
    if (!q) continue;
    const d = acc.get(domainOf(exam, q)?.id ?? "");
    const ok = answers[id] === q.answer;
    if (ok) {
      correct++;
      correctIds.push(id);
    }
    if (d) {
      d.total++;
      if (ok) d.correct++;
    }
  }
  const byDomain = exam.domains.map(d => ({ domainId: d.id, ...acc.get(d.id)! }));
  const present = exam.domains.filter(d => acc.get(d.id)!.total > 0);
  const wsum = present.reduce((a, d) => a + d.weight, 0);
  const weighted = wsum
    ? present.reduce((a, d) => a + (d.weight / wsum) * (acc.get(d.id)!.correct / acc.get(d.id)!.total), 0)
    : 0;
  const total = questionIds.filter(id => byId.has(id)).length;
  return { correct, total, correctIds, byDomain, weighted, passed: weighted >= exam.format.target };
}
