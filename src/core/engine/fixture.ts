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
  notice: "テスト用の資格の断り書き（自作）",
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
  notice: "テスト用の資格の断り書き（自作）",
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

/* 日本語が原文のテスト用の資格（#57〜）。基本情報技術者試験のような形：シナリオ無し・訳なし・分野の公式名が日本語・
   選択肢の記号はア〜で、混ぜない（#58）。
   画面と基盤が「原文は英語」を前提にしていないかを確かめる */
const jaQ = (id: string, task: string, stem: string, options: readonly string[], answer: number): Question => ({
  id,
  tasks: [task],
  stem,
  options: options.map((text, i) => ({
    text,
    why: i === answer ? `正解。${text} が条件に合う理由の説明` : `${text} は条件に合わない理由の説明`,
  })),
  answer,
  point: `${id} で覚えること`,
});

export const jaFixture: Exam = {
  id: "ja-x",
  code: "JA-X",
  lang: "ja",
  options: { labels: "kana", shuffle: false },
  title: "日本語のテスト試験",
  summary: "問題文が日本語の資格",
  notice: "テスト用の資格の断り書き（自作）",
  domains: [
    {
      id: "d1",
      title: "テクノロジ系",
      ja: "テクノロジ系",
      weight: 0.7,
      tasks: [
        { id: "1.1", title: "基礎理論", ja: "基礎理論" },
        { id: "1.2", title: "アルゴリズムとプログラミング", ja: "アルゴリズムとプログラミング" },
      ],
    },
    {
      id: "d2",
      title: "マネジメント系",
      ja: "マネジメント系",
      weight: 0.3,
      tasks: [{ id: "2.1", title: "プロジェクトマネジメント", ja: "プロジェクトマネジメント" }],
    },
  ],
  scenarios: [],
  questions: [
    jaQ(
      "d1-01",
      "1.1",
      "10 進数の 13 を 2 進数で表したものはどれか。次の中から正しいものを選べ。",
      ["1011", "1101", "1110", "0111"],
      1,
    ),
    jaQ(
      "d1-02",
      "1.1",
      "2 進数の 1010 と 0110 の排他的論理和を求めた結果はどれか。次の中から選べ。",
      ["1100", "0010", "1110", "1000"],
      0,
    ),
    jaQ(
      "d1-03",
      "1.2",
      "要素数 n の配列を二分探索するときの、比較回数の最大値のオーダはどれか。次の中から選べ。",
      ["n", "log n", "n log n", "n の 2 乗"],
      1,
    ),
    jaQ(
      "d1-04",
      "1.2",
      "後入れ先出し（LIFO）でデータを出し入れするデータ構造はどれか。次の中から最も適切なものを選べ。",
      ["キュー", "スタック", "ヒープ", "木"],
      1,
    ),
    // 科目B の解答群のような、選択肢の多い問題（#59）
    jaQ(
      "d1-05",
      "1.2",
      "配列の要素を先頭から順に調べ、値が x と等しい最初の要素の位置を返す。空欄に入れる字句として適切なものはどれか。",
      ["i ← i + 1", "i ← i − 1", "i ← 0", "i ← n", "x ← x + 1", "x ← 0", "n ← n − 1", "n ← i"],
      0,
    ),
    jaQ(
      "d1-06",
      "1.1",
      "16 進数の 0F と 2 進数の 101 を足した値を 10 進数で表したものはどれか。次の中から正しいものを選べ。",
      ["10", "11", "12", "13", "14", "15", "16", "17", "18", "20"],
      9,
    ),
    // 科目B のような、プログラムと表を含む問題文と、解答群の表（#60）
    {
      id: "d1-07",
      tasks: ["1.2"],
      stem: [
        "次の関数 `sum` は、引数の配列の要素の合計を返す。プログラム中の ［a］ と ［b］ に入れる字句の適切な組合せはどれか。",
        {
          code: [
            "○整数型: sum(整数型の配列: arr)",
            "  整数型: s ← 0",
            "  整数型: i",
            "  for (i を 1 から arr の要素数 まで 1 ずつ増やす)",
            "    s ← ［a］",
            "  endfor",
            "  return ［b］",
          ].join("\n"),
        },
        { head: ["引数", "戻り値"], table: [["{1, 2, 3}", "6"]] },
      ],
      columns: ["a", "b"],
      options: [
        { cells: ["s + arr[i]", "s"], why: "正解。s に要素を足していき、最後に s を返す" },
        { cells: ["s + arr[i]", "i"], why: "i は最後の添字で、合計ではない" },
        { cells: ["s + i", "s"], why: "添字 i を足すと 1 + 2 + 3 になり、要素の値ではない" },
        { cells: ["arr[i]", "s"], why: "s を上書きするので、最後の要素しか残らない" },
      ],
      answer: 0,
      point: "合計は「s ← s + 要素」で、ループの外で返す",
      source: { label: "テスト用の公開問題 問1", modified: true, url: "https://example.com/q1" },
    },
    jaQ(
      "d2-01",
      "2.1",
      "プロジェクトの作業を階層的に分解して、成果物と作業の範囲を明確にした図はどれか。次の中から選べ。",
      ["WBS", "アローダイアグラム", "ガントチャート", "管理図"],
      0,
    ),
    jaQ(
      "d2-02",
      "2.1",
      "クリティカルパス上の作業が 2 日遅れたとき、プロジェクト全体の完了日はどうなるか。次の中から選べ。",
      ["変わらない", "1 日遅れる", "2 日遅れる", "1 日早まる"],
      2,
    ),
  ],
  notes: {
    "1.1": { points: ["基数の変換"] },
    "1.2": { points: ["探索と整列"] },
    "2.1": { points: ["スケジュール管理"] },
  },
  outOfScope: [],
  format: {
    questions: 60,
    minutes: 90,
    secondsPerQuestion: 90,
    scenariosPerExam: 0,
    maxQuestions: 5,
    passing: "600 / 1000",
    target: 0.6,
  },
  sources: [],
};
