/* 資格の内容の型。資格ごとの違い（問題数・時間・シナリオの有無・合格の目安）はここに持ち、
   出題・記録・画面はこの型だけを読む。命名規則は docs/design.md。 */

/** 資格の一覧に出す軽い情報（#55）。中身（問題・教科書・訳）を読み込まなくても分かること */
export interface ExamMeta {
  /** 公式の試験コードを小文字・ハイフン（"ccar-f"）。記録のキーになるので変えない */
  readonly id: string;
  /** 公式の試験コード（"CCAR-F"） */
  readonly code: string;
  /** 旧称など（"CCA-F"）。表示だけに使う */
  readonly aliases?: readonly string[];
  readonly title: string;
  /** 日本語の短い説明 */
  readonly summary: string;
  readonly format: ExamFormat;
  /** 問題文・選択肢・シナリオの原文の言語（#57）。無ければ "en"。"ja" の資格は訳を持たない */
  readonly lang?: SourceLang;
  /** 選択肢の記号と、混ぜるか（#58）。無ければ A〜 で、表示のたびに混ぜる */
  readonly options?: OptionStyle;
}

/** 選択肢の出し方（#58） */
export interface OptionStyle {
  /** 記号。latin＝A B C …、kana＝ア イ ウ …（IPA の試験の記号）。無ければ latin */
  readonly labels?: OptionLabels;
  /** 表示のたびに選択肢を混ぜるか。無ければ混ぜる（位置で覚えないように）。
      混ぜない資格は、公式の問題の記号と答えがそのまま合い、数値の選択肢も小さい順のまま並ぶ */
  readonly shuffle?: boolean;
}

export type OptionLabels = "latin" | "kana";

/** 問題の原文の言語 */
export type SourceLang = "en" | "ja";

/** 資格の原文の言語 */
export const sourceLang = (exam: Pick<ExamMeta, "lang">): SourceLang => exam.lang ?? "en";

/** 資格の中身。一覧の情報（ExamMeta）に、分野・問題・教科書などを足したもの */
export interface Exam extends ExamMeta {
  readonly domains: readonly Domain[];
  readonly scenarios: readonly Scenario[];
  readonly questions: readonly Question[];
  /** 細目ごとの要点（日本語）。キーは細目の ID */
  readonly notes: Readonly<Record<string, Note>>;
  /** 教科書（日本語）。キーは細目の ID。無い資格もある */
  readonly lessons?: Readonly<Record<string, Lesson>>;
  /** 教科書の「はじめに」（細目に入る前の基礎と用語）。目次の先頭に出す */
  readonly primer?: Primer;
  /** 出題範囲外（日本語） */
  readonly outOfScope: readonly string[];
  /** 出どころと、数字の確からしさ（画面の「この試験について」に出す） */
  readonly sources: readonly { readonly label: string; readonly note: string }[];
  /** 問題文・選択肢・シナリオの訳。キーは言語（"ja"）。原文が正で、訳は読むための補助。原文が日本語の資格は持たない */
  readonly translations?: Readonly<Partial<Record<TranslationLang, Translation>>>;
}

export type TranslationLang = "ja";

export interface Translation {
  /** シナリオ ID → 状況の説明 */
  readonly scenarios: Readonly<Record<string, string>>;
  /** 問題 ID → 問題文と選択肢（選択肢は原文と同じ並び） */
  readonly questions: Readonly<Record<string, QuestionTranslation>>;
}

export interface QuestionTranslation {
  readonly stem: Stem;
  /** 原文と同じ並び・同じ数 */
  readonly options: readonly string[];
}

export interface ExamFormat {
  /** 本番の問題数（表示用。模擬試験は手元の問題で組む） */
  readonly questions?: number;
  /** 本番の時間（分） */
  readonly minutes?: number;
  /** 模擬試験の 1 問あたりの秒数 */
  readonly secondsPerQuestion: number;
  /** 模擬試験で選ぶシナリオの数（シナリオの無い資格は 0） */
  readonly scenariosPerExam: number;
  /** 模擬試験の問題数の上限（シナリオの無い資格で使う） */
  readonly maxQuestions?: number;
  /** 公式の合格基準（表示用、例 "スケールスコア 720 / 1000"） */
  readonly passing: string;
  /** このアプリでの合格の目安（配点で重み付けした正答率、0〜1） */
  readonly target: number;
}

export interface Domain {
  /** "d1" */
  readonly id: string;
  /** 公式の名前（原文の言語。日本語名と同じなら画面には 1 度だけ出す） */
  readonly title: string;
  /** 日本語名 */
  readonly ja: string;
  /** 配点（0〜1）。全分野の合計は 1 */
  readonly weight: number;
  readonly tasks: readonly Task[];
}

export interface Task {
  /** 公式の番号（"1.1"）。分野の番号で始まる */
  readonly id: string;
  /** 公式の名前（原文の言語） */
  readonly title: string;
  /** 日本語名 */
  readonly ja: string;
}

export interface Scenario {
  /** "s1" */
  readonly id: string;
  readonly title: string;
  readonly ja: string;
  /** 状況の説明（原文の言語。試験ガイドの文の転載ではなく自分の言葉で） */
  readonly context: string;
  /** 主に問われる分野 */
  readonly domains: readonly string[];
}

/** 選択肢。文 1 つか、解答群の表の 1 行（#60） */
export type Option = TextOption | CellOption;

export interface TextOption {
  /** 原文の言語。`…` はコードとして出す */
  readonly text: string;
  /** なぜ正解か／なぜ誤りか（日本語） */
  readonly why: string;
}

/** 解答群の表の 1 行（「a と b の組合せ」など。#60）。cells は問題の columns と同じ並び・同じ数 */
export interface CellOption {
  readonly cells: readonly string[];
  readonly why: string;
}

/** 問題文の部品（#60）。段落（文字列。`…` はコード）・コード・表・図・箇条書き */
export type StemBlock =
  | string
  | { readonly code: string; readonly lang?: string }
  /** 表。head は見出しの行（無くてもよい）。行の数はそろえる */
  | { readonly table: readonly (readonly string[])[]; readonly head?: readonly string[] }
  /** 図。figure は SVG の文字列（core/exam/figure.ts で組む）、caption は図の説明（読み上げにも使う） */
  | { readonly figure: string; readonly caption: string }
  | { readonly list: readonly string[] };

/** 問題文。文 1 つか、部品の並び（プログラムや表を含む問題。#60） */
export type Stem = string | readonly StemBlock[];

export interface Question {
  /** "<シナリオ>-<2 桁>"（"s1-03"）。記録のキーなので変えない */
  readonly id: string;
  readonly scenario?: string;
  /** 細目の ID。先頭が主たる細目（集計はこれで行う） */
  readonly tasks: readonly [string, ...string[]];
  /** 原文の言語。文 1 つか、部品の並び（#60） */
  readonly stem: Stem;
  /** 解答群の列の名前（["a", "b"]。#60）。あれば選択肢はすべて cells で書き、表の形で出す */
  readonly columns?: readonly string[];
  /** MIN_OPTIONS〜MAX_OPTIONS 個。資格の中でそろっていなくてもよい（#54） */
  readonly options: readonly Option[];
  /** 正解の位置（0 始まり）。正解は 1 つだけ */
  readonly answer: number;
  /** 混ぜる資格でも、この問題の選択肢は混ぜない（並びに意味があるとき。#58） */
  readonly keepOrder?: boolean;
  /** この問題で覚えること 1 行（日本語） */
  readonly point: string;
}

export interface Note {
  /** 要点（日本語、1 行ずつ） */
  readonly points: readonly string[];
  /** 引っかけになりやすい考え（日本語） */
  readonly traps?: readonly string[];
}

/** 教科書の 1 章（細目 1 つ）。文の中の `…` はコードとして表示する */
export interface Lesson {
  /** この章で身につけること（1〜2 文） */
  readonly lead: string;
  readonly sections: readonly LessonSection[];
  /** この章のまとめ（覚えておくこと、1 行ずつ） */
  readonly summary: readonly string[];
  /** 公式ドキュメント。仕様を確かめた出どころ */
  readonly refs: readonly { readonly label: string; readonly url: string }[];
}

/** 教科書の「はじめに」。細目の章と同じ形に、目次での名前を足したもの */
export interface Primer extends Lesson {
  readonly title: string;
}

export interface LessonSection {
  readonly h: string;
  readonly body: readonly LessonBlock[];
}

/** 段落（文字列）・箇条書き・番号つきの手順・注意の枠・用語・図・例題・コード */
export type LessonBlock =
  | string
  | { readonly list: readonly string[] }
  | { readonly steps: readonly string[] }
  /** point：覚えておきたいこと、warn：間違えやすいこと */
  | { readonly note: string; readonly kind: "point" | "warn" }
  /** [言葉, 説明] の並び */
  | { readonly terms: readonly (readonly [string, string])[] }
  /** 図。figure は SVG の文字列（src/exams/figure.ts で組む）、caption は図の説明（読み上げにも使う） */
  | { readonly figure: string; readonly caption: string }
  /** 例題。選択肢は 3〜4 個、answer は正解の位置（0 始まり）、why は答えの理由と他の選択肢が誤りの理由 */
  | { readonly quiz: string; readonly choices: readonly string[]; readonly answer: number; readonly why: string }
  | { readonly code: string; readonly lang?: string };

/** 1 問の選択肢の数（#54・#59）。基本情報の科目B の解答群（ア〜コ）まで。
    PC のキーは数字の 1〜9 と 0（10 個目）で選ぶ。英字の A〜E は 5 個目まで（F は模擬試験の旗） */
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

const LABELS: Record<OptionLabels, string> = { latin: "ABCDEFGHIJ", kana: "アイウエオカキクケコ" };

/** 資格の選択肢の記号の種類 */
export const optionLabels = (exam: Pick<ExamMeta, "options">): OptionLabels => exam.options?.labels ?? "latin";

/** 選択肢の記号（0 → "A" または "ア"） */
export const optionLabel = (exam: Pick<ExamMeta, "options">, i: number): string => LABELS[optionLabels(exam)][i] ?? "?";

/** この問題の選択肢を、表示のたびに混ぜるか */
export const shufflesOptions = (exam: Pick<ExamMeta, "options">, q: Pick<Question, "keepOrder">): boolean =>
  (exam.options?.shuffle ?? true) && !q.keepOrder;

/** 問題文の部品を平文にする（コピー以外の、一覧の見出し・検査・長さの比較に使う） */
export function stemBlockText(b: StemBlock): string {
  if (typeof b === "string") return b;
  if ("code" in b) return b.code;
  if ("table" in b) return [...(b.head ? [b.head] : []), ...b.table].map(r => r.join(" ")).join(" ");
  if ("figure" in b) return b.caption;
  return b.list.join(" ");
}

/** 問題文を平文にする */
export const stemText = (stem: Stem): string => (typeof stem === "string" ? stem : stem.map(stemBlockText).join(" "));

/** 選択肢を平文にする。表の形は「a：x、b：y」 */
export const optionText = (q: Pick<Question, "columns">, o: Option): string =>
  "text" in o ? o.text : o.cells.map((c, i) => `${q.columns?.[i] ?? ""}：${c}`).join("、");

/** 教科書の「はじめに」の ID（URL の #/<資格>/learn/intro） */
export const PRIMER_ID = "intro";

/** 教科書の章を読む順（はじめに → 分野 → 細目。章のある細目だけ） */
export const lessonOrder = (exam: Exam): string[] => [
  ...(exam.primer ? [PRIMER_ID] : []),
  ...exam.domains.flatMap(d => d.tasks.map(t => t.id)).filter(id => exam.lessons?.[id]),
];

/** 細目の ID から分野を引く */
export function domainOfTask(exam: Exam, taskId: string): Domain | undefined {
  return exam.domains.find(d => d.tasks.some(t => t.id === taskId));
}

export function findTask(exam: Exam, taskId: string): Task | undefined {
  for (const d of exam.domains) for (const t of d.tasks) if (t.id === taskId) return t;
  return undefined;
}

export const allTasks = (exam: Exam): Task[] => exam.domains.flatMap(d => d.tasks);

/** 問題の主たる細目の分野 */
export const domainOf = (exam: Exam, q: Question): Domain | undefined => domainOfTask(exam, q.tasks[0]);
