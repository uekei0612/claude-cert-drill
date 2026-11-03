/* 資格の内容の型。資格ごとの違い（問題数・時間・シナリオの有無・合格の目安）はここに持ち、
   出題・記録・画面はこの型だけを読む。命名規則は docs/design.md。 */

export interface Exam {
  /** 公式の試験コードを小文字・ハイフン（"ccar-f"）。記録のキーになるので変えない */
  readonly id: string;
  /** 公式の試験コード（"CCAR-F"） */
  readonly code: string;
  /** 旧称など（"CCA-F"）。表示だけに使う */
  readonly aliases?: readonly string[];
  readonly title: string;
  /** 日本語の短い説明 */
  readonly summary: string;
  readonly domains: readonly Domain[];
  readonly scenarios: readonly Scenario[];
  readonly questions: readonly Question[];
  /** 細目ごとの要点（日本語）。キーは細目の ID */
  readonly notes: Readonly<Record<string, Note>>;
  /** 出題範囲外（日本語） */
  readonly outOfScope: readonly string[];
  readonly format: ExamFormat;
  /** 出どころと、数字の確からしさ（画面の「この試験について」に出す） */
  readonly sources: readonly { readonly label: string; readonly note: string }[];
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
  /** 公式の英語名 */
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
  /** 公式の英語名 */
  readonly title: string;
  /** 日本語名 */
  readonly ja: string;
}

export interface Scenario {
  /** "s1" */
  readonly id: string;
  readonly title: string;
  readonly ja: string;
  /** 状況の説明（英語。試験ガイドの文の転載ではなく自分の言葉で） */
  readonly context: string;
  /** 主に問われる分野 */
  readonly domains: readonly string[];
}

export interface Option {
  /** 英語 */
  readonly text: string;
  /** なぜ正解か／なぜ誤りか（日本語） */
  readonly why: string;
}

export interface Question {
  /** "<シナリオ>-<2 桁>"（"s1-03"）。記録のキーなので変えない */
  readonly id: string;
  readonly scenario?: string;
  /** 細目の ID。先頭が主たる細目（集計はこれで行う） */
  readonly tasks: readonly [string, ...string[]];
  /** 英語 */
  readonly stem: string;
  readonly options: readonly [Option, Option, Option, Option];
  readonly answer: 0 | 1 | 2 | 3;
  /** この問題で覚えること 1 行（日本語） */
  readonly point: string;
}

export interface Note {
  /** 要点（日本語、1 行ずつ） */
  readonly points: readonly string[];
  /** 引っかけになりやすい考え（日本語） */
  readonly traps?: readonly string[];
}

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
