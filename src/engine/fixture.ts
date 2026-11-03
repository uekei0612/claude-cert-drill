/* テスト用の小さな資格。2 分野（配点 0.6 / 0.4）、3 シナリオ、問題 12 問 */
import type { Exam, Question } from "../exams/types";

const q = (id: string, scenario: string, task: string): Question => ({
  id,
  scenario,
  tasks: [task],
  stem: `Question ${id} stem long enough to pass the length check in the content test.`,
  options: [0, 1, 2, 3].map(i => ({
    text: `option ${i}`,
    why: `解説 ${i} の理由をここに書く`,
  })) as unknown as Question["options"],
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
