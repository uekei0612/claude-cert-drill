/* 教科書と要点を横断する検索（#41）。データはすべてアプリの中にあるので、その場で探す。
   探す対象は、教科書の節（見出し・本文・例題の問い）、細目（名前・要点・引っかかりやすい考え）、
   問題の「覚えること」。問題文と選択肢、例題の答えと解説は、答えが見えてしまうので対象にしない */
import type { Exam, LessonBlock } from "../exam/types";
import { PRIMER_ID, allTasks, lessonOrder } from "../exam/types";

export type Hit =
  /** 教科書の節。chapterId は細目 "1.1" か "intro"、section は節の位置 */
  | {
      readonly kind: "section";
      readonly chapterId: string;
      readonly section: number;
      readonly title: string;
      readonly snippet: string;
    }
  /** 細目（名前・要点）や、その細目の問題の「覚えること」 */
  | { readonly kind: "task"; readonly taskId: string; readonly title: string; readonly snippet: string };

/** Hit から snippet を除いたもの（種類ごとに除く） */
type WithoutSnippet<H> = H extends Hit ? Omit<H, "snippet"> : never;
type HitBase = WithoutSnippet<Hit>;

interface Doc {
  readonly hit: HitBase;
  readonly text: string;
}

/** 検索のための正規化：全角英数を半角に、大文字を小文字に（NFKC） */
export const normalize = (s: string): string => s.normalize("NFKC").toLowerCase();

/** 本文の部品を平文にする（例題は問いと選択肢だけ。答えと解説は入れない） */
function blockText(b: LessonBlock): string {
  if (typeof b === "string") return b;
  if ("list" in b) return b.list.join(" ");
  if ("steps" in b) return b.steps.join(" ");
  if ("note" in b) return b.note;
  if ("terms" in b) return b.terms.map(([t, d]) => `${t} ${d}`).join(" ");
  if ("figure" in b) return b.caption;
  if ("quiz" in b) return `${b.quiz} ${b.choices.join(" ")}`;
  return b.code;
}

const strip = (s: string) => s.replace(/`/g, "");

/** 検索する文書の一覧を作る（資格ごとに 1 回） */
export function buildIndex(exam: Exam): Doc[] {
  const docs: Doc[] = [];
  for (const id of lessonOrder(exam)) {
    const lesson = id === PRIMER_ID ? exam.primer : exam.lessons?.[id];
    if (!lesson) continue;
    const chapter = id === PRIMER_ID ? "はじめに" : id;
    lesson.sections.forEach((s, i) =>
      docs.push({
        hit: { kind: "section", chapterId: id, section: i, title: `${chapter} ${s.h}` },
        text: strip([s.h, ...s.body.map(blockText)].join(" ")),
      }),
    );
  }
  for (const t of allTasks(exam)) {
    const note = exam.notes[t.id];
    const points = exam.questions.filter(q => q.tasks[0] === t.id).map(q => q.point);
    docs.push({
      hit: { kind: "task", taskId: t.id, title: `${t.id} ${t.ja}` },
      text: strip([t.ja, t.title, ...(note?.points ?? []), ...(note?.traps ?? []), ...points].join(" ")),
    });
  }
  return docs;
}

/** 見つかった所の前後を切り出す */
function snippet(text: string, term: string, width = 40): string {
  const i = normalize(text).indexOf(term);
  if (i < 0) return text.slice(0, width * 2);
  const from = Math.max(0, i - width);
  const to = Math.min(text.length, i + term.length + width);
  return `${from > 0 ? "…" : ""}${text.slice(from, to)}${to < text.length ? "…" : ""}`;
}

/** 語を空白で区切り、すべてを含む文書を返す（見出し・名前に入っているものを先に）。最大 limit 件 */
export function search(docs: readonly Doc[], query: string, limit = 50): Hit[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { hit: Hit; score: number; order: number }[] = [];
  docs.forEach((d, order) => {
    const body = normalize(d.text);
    const title = normalize(d.hit.title);
    if (!terms.every(t => body.includes(t) || title.includes(t))) return;
    const score = terms.filter(t => title.includes(t)).length;
    scored.push({ hit: { ...d.hit, snippet: snippet(d.text, terms[0]!) } as Hit, score, order });
  });
  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map(x => x.hit);
}
