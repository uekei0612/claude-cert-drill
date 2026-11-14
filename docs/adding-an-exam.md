# 資格の足し方

資格は `src/exams/<資格ID>/` に置くデータだけで足せる。画面・出題・記録（`src/core`・`src/ui`）は変えない。
命名規則は [design.md](design.md#命名規則)、層の分け方は [design.md の構成](design.md#構成)。

## 1. フォルダを作る

```
src/exams/ccar-p/
  meta.ts        一覧に出す情報（すぐ読む）
  exam.ts        中身（資格を開いたときに読む）
  questions/     問題（シナリオごと、無ければ分野ごとに 1 ファイル）
  notes.ts       細目ごとの要点
  lessons/       教科書（無くてもよい）
  ja.ts          問題文の訳（英語の資格だけ。無くてもよい）
  ccar-p.test.ts この資格だけの決まり（無くてもよい）
```

資格 ID は公式の試験コードの小文字（`CCAR-P` → `ccar-p`）。記録のキー（`ccar-p:s1-03`）になるので、出したあとは変えない。

## 2. meta.ts（一覧の情報）

```ts
import type { ExamMeta } from "../../core/exam/types";

export const meta: ExamMeta = {
  id: "ccar-p",
  code: "CCAR-P",
  title: "Claude Certified Architect – Professional",
  summary: "日本語の短い説明",
  // lang: "ja",          // 問題文が日本語で書かれた資格（無ければ英語）。日本語の資格は訳（ja.ts）を持たない
  // options: { labels: "kana", shuffle: false }, // 記号をア〜にし、選択肢を混ぜない（無ければ A〜・混ぜる）
  format: {
    questions: 60, // 本番の問題数（表示用）
    minutes: 120, // 本番の時間（表示用）
    secondsPerQuestion: 120, // 模擬試験の 1 問あたり
    scenariosPerExam: 4, // 模擬試験で選ぶシナリオの数（シナリオの無い資格は 0）
    // maxQuestions: 50,    // シナリオの無い資格は必須（模擬試験の問題数）
    passing: "スケールスコア 720 / 1000", // 公式の合格基準（表示用）
    target: 0.75, // このアプリの合格の目安（配点で重み付けした正答率）
  },
};
```

## 3. exam.ts（中身）

```ts
import type { Domain, Exam } from "../../core/exam/types";
import { meta } from "./meta";
import { notes } from "./notes";
import { questions } from "./questions";

const domains: Domain[] = [
  { id: "d1", title: "公式の名前（原文の言語）", ja: "日本語名", weight: 0.6, tasks: [{ id: "1.1", title: "…", ja: "…" }] },
  { id: "d2", title: "…", ja: "…", weight: 0.4, tasks: [{ id: "2.1", title: "…", ja: "…" }] },
];

export const ccarP: Exam = {
  ...meta,
  domains,
  scenarios: [], // シナリオの無い資格は空。問題 ID は d1-01 の形
  questions,
  notes,
  // lessons, primer, translations: { ja } は、あれば足す
  outOfScope: [],
  sources: [{ label: "分野・配点", note: "公式の試験ガイドによる" }],
};
```

問題の形：

```ts
{
  id: "d1-01",              // シナリオがあれば s1-01
  tasks: ["1.1"],           // 先頭が主たる細目
  stem: "問題文（原文の言語）",
  options: [                // 2〜10 個。text は原文の言語、why は日本語
    { text: "…", why: "正解。…" },
    { text: "…", why: "…" },
    { text: "…", why: "…" },
    { text: "…", why: "…" },
  ],
  answer: 0,                // 正解の位置（1 つだけ）
  // keepOrder: true,       // 混ぜる資格でも、この問題は混ぜない（並びに意味のある選択肢）
  point: "この問題で覚えること（日本語 1 行）",
}
```

## 4. 一覧に足す

`src/exams/index.ts` に 1 行足す。`exam.ts` は `import()` で読む（静的に import すると全資格が最初の JS に入る。`src/layers.test.ts` が落とす）。

```ts
import { meta as ccarP } from "./ccar-p/meta";

export const catalog = createCatalog([
  { meta: ccarF, load: () => import("./ccar-f/exam").then(m => m.ccarF) },
  { meta: ccarP, load: () => import("./ccar-p/exam").then(m => m.ccarP) },
]);
```

## 5. 検査を通す

```sh
docker compose run --rm dev npm run check
```

- `src/exams/exams.test.ts` が、載せているすべての資格に `validateExam`（`src/core/exam/validate.ts`）をかける。
  ID の形・配点の合計・全細目に問題と要点があること・選択肢の数・解説の長さ・訳の対応などを見る
- 「正解が一番長い選択肢」に偏っていないかも見る（問題が 10 問を超えてから）。書いたあとに長さを測り、誤答に理由を足して揃える
- その資格だけの決まり（例：「はじめに」に必ず説明する言葉）は `src/exams/<資格ID>/<資格ID>.test.ts` に書く

画面が形の違う資格でも動くことは `src/ui/screens/screens.test.tsx` が、シナリオ無し・5 択と 3 択・教科書と訳なしのテスト用の資格（`src/core/engine/fixture.ts` の `flatFixture`）と、
日本語が原文・記号がア〜・混ぜない・8 択と 10 択の入ったテスト用の資格（`jaFixture`）で確かめている。

## できないこと（足すなら基盤を直す）

- 複数選択の問題（正解は 1 つだけ）
- 11 択以上（PC のキーが数字の 1〜9 と 0 で尽きる）
- 画面と解説は日本語だけ。問題文の原文は英語か日本語（`lang`）で、訳は英語の資格の日本語訳（`ja`）だけ

## 別の資格群のアプリにするとき

`src/app/config.ts`（名前・説明・免責・保存キー・解説を頼む相手）と `src/exams/index.ts`、
`vite.config.ts` の `base`（Pages のパス）、`public/` のアイコンを替える。`src/core` と `src/ui` はそのまま使える。
