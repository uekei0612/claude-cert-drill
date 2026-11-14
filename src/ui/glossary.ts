/* アプリ独自の用語と、指標の定義（#50）。指標の横の「?」と、使い方のページの両方がここを読む。
   基準を変えたら（#27・#28・#32 など）ここも合わせる */
import { MAX_INTERVAL, RETRY_MS } from "../core/engine/schedule";
import type { Exam } from "../core/exam/types";

export type TermId =
  | "readiness"
  | "known"
  | "learning"
  | "notyet"
  | "due"
  | "spaced"
  | "guess"
  | "gain"
  | "task"
  | "domain"
  | "saved"
  | "streak"
  | "mock";

export interface Term {
  readonly id: TermId;
  readonly term: string;
  readonly def: (exam?: Exam) => string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export const TERMS: readonly Term[] = [
  {
    id: "readiness",
    term: "合格の目安",
    def: e =>
      `分野ごとの「覚えた問題」の割合を、本番の配点で重み付けしたもの。線は目安の ${pct(e?.format.target ?? 0.75)}（このアプリ独自の基準）。未解答の問題は覚えていない扱い。本番の合格基準は${e?.format.passing ?? "公式の発表"}で、点数への換算式は公開されていないので、点数は出しません。`,
  },
  {
    id: "known",
    term: "覚えた",
    def: () =>
      "日をあけて 2 回続けて正解し（次に出すまでの間隔が 3 日以上になった）、復習の期限を大きく（間隔の分以上）過ぎていない問題。1 回の正解や勘の正解では数えません。",
  },
  {
    id: "learning",
    term: "あと 1 回",
    def: () =>
      "直近は正解したが、まだ「覚えた」に数えない問題（1 回だけ正解した・期限を大きく過ぎた）。期限が来てからもう一度正解すると「覚えた」になります。",
  },
  { id: "notyet", term: "まだ", def: () => "直近の答えが誤答だった、または勘で当たった問題。" },
  {
    id: "due",
    term: "復習待ち",
    def: () => "次に出す時期（期限）が来ている問題。「今日の練習」は、復習待ちの問題から先に出します。",
  },
  {
    id: "spaced",
    term: "間隔反復",
    def: () =>
      `正解すると、次に出すまでの間隔が 1 日 → 3 日 → 約 2.3 倍ずつ延びます（最大 ${MAX_INTERVAL} 日。伸び率は正解するたびに少し上がり、間違えると下がる）。間違えると ${Math.round(RETRY_MS / 60000)} 分後にまた出し、同じ回の最後にも 1 度出します。期限前に正解しても間隔は延ばしません。`,
  },
  {
    id: "guess",
    term: "勘だった",
    def: () =>
      "正解しても勘だったときに付けます。「覚えた」に数えず、翌日もう一度出します。間違えたときの「取り消す」は、押し間違えたときに答える前の状態へ戻します。",
  },
  {
    id: "gain",
    term: "目安 +x（伸ばすと効く細目）",
    def: () =>
      "その細目の問題を全部覚えたときに、合格の目安が上がる幅（ポイント）。配点が大きく、まだ覚えていない問題が多い細目ほど大きくなります。",
  },
  {
    id: "task",
    term: "細目",
    def: e =>
      `試験ガイドの出題範囲の項目（例：${e?.domains[0]?.tasks[0]?.id ?? "1.1"}）。分野の下にあります。問題と教科書の章は細目ごとに作っています。`,
  },
  {
    id: "domain",
    term: "分野・配点",
    def: e =>
      `出題範囲の大きな区分（${e && e.domains.length > 1 ? `D1〜D${e.domains.length}` : "D1 など"}）と、本番でその分野から出る割合。`,
  },
  {
    id: "saved",
    term: "振り返り",
    def: () => "答えのあとに「☆ 後で振り返る」で印を付けた問題の一覧。印を付けた問題だけで練習もできます。",
  },
  {
    id: "streak",
    term: "続けた日数",
    def: () => "今日（今日まだ答えていなければ昨日）からさかのぼって、毎日 1 問以上答えた日数。",
  },
  {
    id: "mock",
    term: "練習と模擬試験",
    def: e =>
      `練習は 1 問ずつ答えてすぐ解説を読み、間隔反復で復習に戻します。模擬試験は本番と同じ形（${e?.format.questions ?? "?"} 問・${e?.format.minutes ?? "?"} 分）で、答えは最後にまとめて採点します。模擬試験の答えも、出した全問の記録に入ります。`,
  },
];

export const termOf = (id: TermId): Term => TERMS.find(t => t.id === id)!;

/** おすすめの進め方 */
export const STEPS: readonly { readonly title: string; readonly body: string }[] = [
  { title: "教科書の「はじめに」を読む", body: "どの章にも出てくる言葉と、部品どうしの関係をつかみます。" },
  {
    title: "章を読んだら、その細目を練習する",
    body: "1 問ずつ答えて解説を読みます。間違えた問題は時間をおいて自動で戻ってきます。",
  },
  {
    title: "毎日「今日の練習」で復習する",
    body: "期限の来た問題から出ます。合格の目安が上がっていくのを見ながら続けます。",
  },
  { title: "目安が近づいたら模擬試験", body: "本番と同じ形で時間を計って解き、間違えた問題を解き直します。" },
];
