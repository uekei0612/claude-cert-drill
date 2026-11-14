/* テスト用の小さな資格。2 分野（配点 0.6 / 0.4）、3 シナリオ、問題 12 問 */
import type { Exam, Question } from "../exam/types";

const q = (id: string, scenario: string, task: string): Question => ({
  id,
  scenario,
  tasks: [task],
  stem: `Question ${id} stem long enough to pass the length check in the content test.`,
  options: [0, 1, 2, 3].map(i => ({
    text: `option ${i}`,
    why: `解説 ${i} の理由をここに書く`,
  })),
  answer: 0,
  point: "要点",
});

export const fixture: Exam = {
  id: "test-x",
  code: "TEST-X",
  title: "Test",
  summary: "テスト",
  domains: [
    {
      id: "d1",
      title: "A",
      ja: "A",
      weight: 0.6,
      tasks: [
        { id: "1.1", title: "a1", ja: "a1" },
        { id: "1.2", title: "a2", ja: "a2" },
      ],
    },
    { id: "d2", title: "B", ja: "B", weight: 0.4, tasks: [{ id: "2.1", title: "b1", ja: "b1" }] },
  ],
  scenarios: ["s1", "s2", "s3"].map(id => ({ id, title: id, ja: id, context: "ctx", domains: ["d1"] })),
  questions: [
    q("s1-01", "s1", "1.1"),
    q("s1-02", "s1", "1.1"),
    q("s1-03", "s1", "1.2"),
    q("s1-04", "s1", "2.1"),
    q("s2-01", "s2", "1.1"),
    q("s2-02", "s2", "1.2"),
    q("s2-03", "s2", "2.1"),
    q("s2-04", "s2", "2.1"),
    q("s3-01", "s3", "1.2"),
    q("s3-02", "s3", "2.1"),
    q("s3-03", "s3", "1.1"),
    q("s3-04", "s3", "2.1"),
  ],
  notes: {},
  outOfScope: [],
  format: { secondsPerQuestion: 120, scenariosPerExam: 2, passing: "", target: 0.75 },
  sources: [],
};

/* 形の違うテスト用の資格（#56）。シナリオ無し・5 択と 3 択が混ざる・教科書も訳も無い。
   画面と基盤が CCAR-F の形（シナリオ・4 択・教科書・訳）を前提にしていないかを確かめる */
const flatQ = (id: string, task: string, n: number, answer: number): Question => ({
  id,
  tasks: [task],
  stem: `Flat question ${id}: which option is the best choice for this situation described here?`,
  options: Array.from({ length: n }, (_, i) => ({
    text: i === answer ? `pick ${i}` : `choice number ${i}`,
    why: `選択肢 ${i} がそうである理由の説明`,
  })),
  answer,
  point: `${id} で覚えること`,
});

export const flatFixture: Exam = {
  id: "flat-x",
  code: "FLAT-X",
  title: "Flat exam without scenarios",
  summary: "シナリオの無い 5 択と 3 択の資格",
  domains: [
    { id: "d1", title: "First", ja: "一つ目", weight: 0.5, tasks: [{ id: "1.1", title: "f1", ja: "一の一" }] },
    {
      id: "d2",
      title: "Second",
      ja: "二つ目",
      weight: 0.5,
      tasks: [
        { id: "2.1", title: "s1", ja: "二の一" },
        { id: "2.2", title: "s2", ja: "二の二" },
      ],
    },
  ],
  scenarios: [],
  questions: [
    flatQ("d1-01", "1.1", 5, 4),
    flatQ("d1-02", "1.1", 3, 1),
    flatQ("d2-01", "2.1", 5, 2),
    flatQ("d2-02", "2.2", 3, 0),
    flatQ("d2-03", "2.2", 5, 0),
  ],
  notes: {
    "1.1": { points: ["要点 1.1"] },
    "2.1": { points: ["要点 2.1"] },
    "2.2": { points: ["要点 2.2"], traps: ["罠"] },
  },
  outOfScope: [],
  format: { minutes: 10, secondsPerQuestion: 60, scenariosPerExam: 0, maxQuestions: 4, passing: "70%", target: 0.7 },
  sources: [],
};
