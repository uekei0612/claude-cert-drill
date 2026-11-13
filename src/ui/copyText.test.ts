import { describe, expect, test } from "vitest";
import { exams } from "../exams";
import { PRIMER_ID } from "../exams/types";
import { hintText, lessonText, questionText, sectionText } from "./copyText";

const exam = exams.find(e => e.id === "ccar-f")!;
const q = exam.questions.find(x => x.id === "s1-01")!;
const ja = exam.translations!.ja!;

describe("questionText", () => {
  // 画面では元の 3・1・0・2 番目を A〜D として出している
  const order = [3, 1, 0, 2];
  const text = questionText({ exam, q, order, chosen: 2 });

  test("シナリオ・問題文・選択肢を、英語の原文と訳の両方で入れる", () => {
    expect(text).toContain(q.stem);
    expect(text).toContain(`（訳）${ja.questions[q.id]!.stem}`);
    expect(text).toContain(exam.scenarios[0]!.context);
    expect(text).toContain(`（訳）${ja.scenarios.s1}`);
    for (const o of q.options) expect(text).toContain(o.text);
  });

  test("選択肢の記号は画面の並びに合わせる", () => {
    expect(q.answer).toBe(0);
    expect(text).toContain(`A. ${q.options[3]!.text}`);
    expect(text).toContain(`C. ${q.options[0]!.text}`);
    expect(text).toContain("■ 正解：C");
    expect(text).toContain("■ 私の答え：D（不正解）");
  });

  test("解説は選択肢ごとに正誤を付け、覚えることと細目も入れる", () => {
    expect(text).toContain(`C（正解）：${q.options[0]!.why.replace(/^正解。/, "")}`);
    expect(text).toContain(`A（誤り）：${q.options[3]!.why}`);
    expect(text).toContain(q.point);
    expect(text).toContain("細目：1.1");
  });

  test("未回答（振り返りの一覧）なら自分の答えは書かない", () => {
    expect(questionText({ exam, q, order: [0, 1, 2, 3] })).not.toContain("私の答え");
  });

  test("全問で組める（記号が ? にならない）", () => {
    for (const x of exam.questions) {
      const t = questionText({ exam, q: x, order: [0, 1, 2, 3], chosen: 1 });
      expect(t).not.toContain("：?");
      expect(t).toContain(x.point);
    }
  });
});

describe("hintText（答える前のヒント用。#36）", () => {
  const order = [3, 1, 0, 2];
  const text = hintText({ exam, q, order });
  test("問題・シナリオ・選択肢は入れ、並びは画面に合わせる", () => {
    expect(text).toContain(q.stem);
    expect(text).toContain(exam.scenarios[0]!.context);
    expect(text).toContain(`A. ${q.options[3]!.text}`);
    expect(text).toContain("答えはまだ言わないでください");
  });
  test("正解・解説・覚えることは入れない（全問で）", () => {
    for (const x of exam.questions) {
      const t = hintText({ exam, q: x, order: [0, 1, 2, 3] });
      expect(t).not.toMatch(/■ (正解|私の答え|アプリの解説|覚えること)/);
      expect(t).not.toContain(x.point);
      for (const o of x.options) expect(t).not.toContain(o.why);
    }
  });
});

describe("教科書", () => {
  const lesson = exam.lessons!["1.1"]!;

  test("章は見出し・リード・全節・まとめ・公式ドキュメントを入れる", () => {
    const text = lessonText(exam, "1.1 エージェントループの設計と実装", lesson);
    expect(text).toContain("# 1.1 エージェントループの設計と実装");
    expect(text).toContain(lesson.lead);
    for (const s of lesson.sections) expect(text).toContain(`## ${s.h}`);
    for (const x of lesson.summary) expect(text).toContain(`- ${x}`);
    for (const r of lesson.refs) expect(text).toContain(r.url);
  });

  test("図は説明文に、例題は選択肢と答えに、コードは囲みにする", () => {
    const text = lessonText(exam, "1.1", lesson);
    expect(text).not.toContain("<svg");
    expect(text).toMatch(/［図］/);
    expect(text).toMatch(/［例題］[\s\S]*\nA\. [\s\S]*答え：[A-D]　/);
    expect(text).toContain("```");
  });

  test("節だけを写すと、その節だけが入る", () => {
    const [s0, s1] = lesson.sections;
    const text = sectionText(exam, "1.1", s0!);
    expect(text).toContain(`## ${s0!.h}`);
    expect(text).not.toContain(`## ${s1!.h}`);
  });

  test("はじめにを含む全章で組める", () => {
    for (const l of [exam.primer!, ...Object.values(exam.lessons!)]) {
      const text = lessonText(exam, PRIMER_ID, l);
      expect(text).not.toContain("[object Object]");
      expect(text).not.toContain("undefined");
    }
  });
});
