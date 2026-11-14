import { describe, expect, test } from "vitest";
import { fixture, flatFixture, jaFixture } from "../engine/fixture";
import { type Exam, type Question, type StemBlock, blanksOf, optionText } from "./types";
import { validateExam } from "./validate";

/** 形の正しい小さな資格（fixture に要点と、長さのそろった選択肢を足す） */
const base: Exam = {
  ...fixture,
  notes: { "1.1": { points: ["a"] }, "1.2": { points: ["b"] }, "2.1": { points: ["c"] } },
  questions: fixture.questions.map(q => ({
    ...q,
    // 正解（0）を一番短くする
    options: q.options.map((o, i) => ({ ...o, text: i === 0 ? "a" : `option ${i}` })),
  })),
};
const has = (e: Exam, re: RegExp) => validateExam(e).some(m => re.test(m));
const withQ = (f: (q: Question) => Question): Exam => ({ ...base, questions: base.questions.map(f) });

describe("資格の形の検査（#53）", () => {
  test("形の正しい資格は何も言わない", () => {
    expect(validateExam(base)).toEqual([]);
  });
  test("ID と配点", () => {
    expect(has({ ...base, id: "Test_X" }, /小文字/)).toBe(true);
    expect(has({ ...base, domains: base.domains.map(d => ({ ...d, weight: 0.3 })) }, /配点の合計/)).toBe(true);
    expect(has({ ...base, domains: [{ ...base.domains[0]!, id: "x" }, base.domains[1]!] }, /d1/)).toBe(true);
  });
  test("問題：ID・正解・選択肢・細目", () => {
    expect(
      has(
        withQ(q => (q.id === "s1-01" ? { ...q, id: "s2-99" } : q)),
        /頭が/,
      ),
    ).toBe(true);
    expect(
      has(
        withQ(q => ({ ...q, answer: 7 })),
        /正解の位置/,
      ),
    ).toBe(true);
    expect(
      has(
        withQ(q => ({ ...q, tasks: ["9.9"] })),
        /細目 9\.9 が無い/,
      ),
    ).toBe(true);
    expect(has({ ...base, questions: base.questions.filter(q => q.tasks[0] !== "1.2") }, /1\.2/)).toBe(true);
  });
  test("選択肢は 2〜10 個。正解は選択肢の中。訳の選択肢は原文と同じ数（#54・#59）", () => {
    const five = withQ(q => ({
      ...q,
      options: [...q.options, { text: "option 4", why: "解説 4 の理由をここに書く" }],
    }));
    expect(validateExam(five)).toEqual([]);
    expect(
      has(
        withQ(q => ({ ...q, options: q.options.slice(0, 1) })),
        /2〜10/,
      ),
    ).toBe(true);
    const many = (n: number) =>
      withQ(q => ({
        ...q,
        options: Array.from({ length: n }, (_, i) => ({
          text: i ? `option ${i}` : "a",
          why: `解説 ${i} の理由をここに書く`,
        })),
      }));
    expect(validateExam(many(10))).toEqual([]);
    expect(has(many(11), /2〜10/)).toBe(true);
    expect(
      has(
        withQ(q => ({ ...q, answer: 4 })),
        /正解の位置/,
      ),
    ).toBe(true);
    const tr = {
      scenarios: Object.fromEntries(base.scenarios.map(s => [s.id, "シナリオの訳。二十字を超える長さにしておく。"])),
      questions: Object.fromEntries(
        base.questions.map(q => [
          q.id,
          { stem: "問題文の訳。二十字を超える長さにしておくための文。", options: ["あ", "い", "う"] },
        ]),
      ),
    };
    expect(has({ ...base, translations: { ja: tr } }, /訳の数が原文と違う/)).toBe(true);
  });
  test("要点の無い細目", () => {
    expect(has({ ...base, notes: {} }, /要点/)).toBe(true);
  });
  test("正解が一番長い選択肢に偏ると落とす（数が少ないうちは見ない）", () => {
    const long = withQ(q => ({
      ...q,
      options: q.options.map((o, i) => (i === q.answer ? { ...o, text: "the longest one" } : o)),
    }));
    expect(has(long, /一番長い/)).toBe(true);
    expect(has({ ...long, questions: long.questions.slice(0, 9) }, /一番長い/)).toBe(false);
  });
  test("シナリオの無い資格は、模擬試験の問題数が要る", () => {
    const flat: Exam = {
      ...base,
      scenarios: [],
      format: { ...base.format, scenariosPerExam: 0 },
      questions: base.questions.map(q => ({ ...q, scenario: undefined, id: `d${q.tasks[0][0]}-${q.id.slice(-2)}` })),
    };
    expect(has(flat, /maxQuestions/)).toBe(true);
    expect(has({ ...flat, format: { ...flat.format, maxQuestions: 10 } }, /maxQuestions/)).toBe(false);
  });
});

test("形の違う資格（シナリオ無し・5 択と 3 択・教科書と訳なし）も形の検査を通る（#56）", () => {
  expect(validateExam(flatFixture)).toEqual([]);
});

test("問題文の部品と解答群の表の形（#60）", () => {
  const bq = jaFixture.questions.find(x => x.columns)!;
  const withB = (f: (q: Question) => Question): Exam => ({
    ...jaFixture,
    questions: jaFixture.questions.map(q => (q.id === bq.id ? f(q) : q)),
  });
  const msgs = (e: Exam) => validateExam(e).join("\n");
  expect(msgs(withB(q => ({ ...q, columns: ["a"] })))).toMatch(/cells の数/);
  // 空欄 ［a］ ［b］ と列の名前が合わない（#62）
  expect(msgs(withB(q => ({ ...q, columns: ["a", "c"] })))).toMatch(/空欄（a b）と解答群の列の名前（a c）が合わない/);
  expect(msgs(withB(q => ({ ...q, columns: undefined })))).toMatch(/columns）が無い/);
  expect(
    msgs(withB(q => ({ ...q, options: [...q.options.slice(0, 3), { text: "x ← 0", why: "混ぜた選択肢の解説" }] }))),
  ).toMatch(/text で書いてある/);
  expect(
    msgs(withB(q => ({ ...q, stem: [...(q.stem as readonly StemBlock[]), { table: [["1", "2"], ["3"]] }] }))),
  ).toMatch(/列の数がそろっていない/);
  expect(
    msgs(
      withB(q => ({ ...q, stem: [{ code: "x" }, "あとから段落を書いた問題文の例で、四十字を超えるようにしてある。"] })),
    ),
  ).toMatch(/文（段落）で始める/);
  expect(
    msgs(withB(q => ({ ...q, stem: ["`sum の閉じていない問題文の例で、四十字を超えるようにしてある文。"] }))),
  ).toMatch(/` の数/);
});

test("断り書きと出典の形（#61）", () => {
  expect(has({ ...base, notice: "" }, /断り書き/)).toBe(true);
  expect(
    has(
      withQ(q => ({ ...q, source: { label: " " } })),
      /出典の名前/,
    ),
  ).toBe(true);
  expect(
    has(
      withQ(q => ({ ...q, source: { label: "公開問題 問1", url: "http://example.com" } })),
      /出典の URL/,
    ),
  ).toBe(true);
  expect(validateExam(withQ(q => ({ ...q, source: { label: "公開問題 問1", url: "https://example.com/a" } })))).toEqual(
    [],
  );
});

test("日本語が原文の資格は形の検査を通り、日本語の訳を持たせると落ちる（#57）", () => {
  expect(validateExam(jaFixture)).toEqual([]);
  const tr = {
    scenarios: {},
    questions: Object.fromEntries(
      jaFixture.questions.map(q => [q.id, { stem: q.stem, options: q.options.map(o => optionText(q, o)) }]),
    ),
  };
  expect(validateExam({ ...jaFixture, translations: { ja: tr } }).some(m => /原文が日本語/.test(m))).toBe(true);
});

test("問題文の空欄の名前を、段落・プログラム・表・箇条書きから拾う（#62）", () => {
  expect(blanksOf("［a］ と ［β］ と ［a］")).toEqual(["a", "β"]);
  expect(
    blanksOf(["段落 ［a］", { code: "x ← ［b］" }, { head: ["［c］"], table: [["［d］"]] }, { list: ["［e］"] }]),
  ).toEqual(["a", "b", "c", "d", "e"]);
  // 半角の [a] や大文字は空欄ではない
  expect(blanksOf("arr[a] と ［A］")).toEqual([]);
  // 記号の無い空欄（空欄が 1 つだけの問題。#64）は名前として数えない
  expect(blanksOf(["次の ［］ に入れる", { code: "x ← ［］" }])).toEqual([]);
});

test("出典のある問題は、正解が一番長い選択肢の偏りの検査から外す（#64）", () => {
  // どの問題も正解（0）を一番長くする
  const longest = withQ(q => ({
    ...q,
    options: q.options.map((o, i) => ({ ...o, text: i === 0 ? "the longest option text" : `option ${i}` })),
  }));
  expect(has(longest, /正解が一番長い/)).toBe(true);
  const sourced: Exam = {
    ...longest,
    questions: longest.questions.map(q => ({ ...q, source: { label: "公開問題" } })),
  };
  expect(has(sourced, /正解が一番長い/)).toBe(false);
});
