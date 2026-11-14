/* Claude に解説を頼むときに貼る文。問題 1 問・教科書の章・節を、読める平文（Markdown 寄り）にする。
   原文に訳があれば「（訳）」として添える（Claude には原文、自分には訳）。
   選択肢の記号は画面に出ている並びに合わせる（「C を選んだ」が画面と食い違わないように） */
import type { Exam, Lesson, LessonBlock, LessonSection, Question } from "../core/exam/types";
import { domainOf, findTask, optionLetter } from "../core/exam/types";

/** 資格の名前（「CCAR-F（Claude Certified Architect – Foundations）」） */
const examName = (exam: Exam) => `${exam.code}（${exam.title}）`;

const withJa = (en: string, ja: string | undefined, indent = "") => (ja ? `${en}\n${indent}（訳）${ja}` : en);

export interface QuestionCopy {
  readonly exam: Exam;
  readonly q: Question;
  /** 画面に出している選択肢の順番（元の添字） */
  readonly order: readonly number[];
  /** 選んだ元の添字（未回答なら無し） */
  readonly chosen?: number;
}

/** 問題の前半（頼む文・分野・シナリオ・問題・選択肢）。答えと解説は含めない */
function questionHead({ exam, q, order }: QuestionCopy, ask: string): string[] {
  const ja = exam.translations?.ja;
  const tq = ja?.questions[q.id];
  const scenario = exam.scenarios.find(s => s.id === q.scenario);
  const domain = domainOf(exam, q);
  const task = findTask(exam, q.tasks[0]);
  const out: string[] = [`${examName(exam)}の試験勉強をしています。次の練習問題（非公式の自作問題）${ask}`];
  if (domain && task) out.push(`分野：${domain.id.toUpperCase()} ${domain.ja} ／ 細目：${task.id} ${task.ja}`);
  if (scenario)
    out.push(
      `■ シナリオ：${scenario.ja}\n${withJa(`${scenario.title}. ${scenario.context}`, ja?.scenarios[scenario.id])}`,
    );
  out.push(`■ 問題\n${withJa(q.stem, tq?.stem)}`);
  out.push(
    `■ 選択肢\n${order.map((orig, i) => `${optionLetter(i)}. ${withJa(q.options[orig]!.text, tq?.options[orig], "   ")}`).join("\n")}`,
  );
  return out;
}

/** 答える前の問題 1 問。正解・解説・覚えることは入れず、答えを言わずにヒントだけを頼む（#36） */
export function hintText(c: Omit<QuestionCopy, "chosen">): string {
  return [
    ...questionHead(
      c,
      "を解いています。答えはまだ言わないでください。どこに注目すればよいか、考え方のヒントだけをください。",
    ),
  ].join("\n\n");
}

/** 答えを見たあとの問題 1 問 */
export function questionText(c: QuestionCopy): string {
  const { q, order, chosen } = c;
  const letter = (orig: number) => optionLetter(order.indexOf(orig));
  const out = questionHead(c, "について教えてください。");
  const answer = `■ 正解：${letter(q.answer)}`;
  out.push(
    chosen === undefined
      ? answer
      : `${answer}\n■ 私の答え：${letter(chosen)}（${chosen === q.answer ? "正解" : "不正解"}）`,
  );
  out.push(
    `■ アプリの解説\n${order
      .map(orig => {
        const why = q.options[orig]!.why.replace(/^正解。/, "");
        return `${letter(orig)}（${orig === q.answer ? "正解" : "誤り"}）：${why}`;
      })
      .join("\n")}`,
  );
  out.push(`■ 覚えること\n${q.point}`);
  return out.join("\n\n");
}

function blockText(b: LessonBlock): string {
  if (typeof b === "string") return b;
  if ("list" in b) return b.list.map(x => `- ${x}`).join("\n");
  if ("steps" in b) return b.steps.map((x, i) => `${i + 1}. ${x}`).join("\n");
  if ("note" in b) return `【${b.kind === "warn" ? "間違えやすい" : "ポイント"}】${b.note}`;
  if ("terms" in b) return b.terms.map(([t, d]) => `- ${t}：${d}`).join("\n");
  if ("figure" in b) return `［図］${b.caption}`;
  if ("quiz" in b)
    return [
      `［例題］${b.quiz}`,
      b.choices.map((c, i) => `${optionLetter(i)}. ${c}`).join("\n"),
      `答え：${optionLetter(b.answer)}　${b.why}`,
    ].join("\n");
  return `\`\`\`${b.lang ?? ""}\n${b.code}\n\`\`\``;
}

const sectionBody = (s: LessonSection) => `## ${s.h}\n\n${s.body.map(blockText).join("\n\n")}`;

const lessonIntro = (exam: Exam, chapter: string) =>
  `${examName(exam)}の試験勉強をしています。次は教科書（非公式の自作教材）の「${chapter}」の章`;

/** 教科書の 1 節。chapter は章の名前（「1.1 エージェントループの設計と実装」） */
export function sectionText(exam: Exam, chapter: string, s: LessonSection): string {
  return `${lessonIntro(exam, chapter)}の一部です。この内容について教えてください。\n\n${sectionBody(s)}`;
}

/** 教科書の 1 章（リード・各節・まとめ・公式ドキュメント） */
export function lessonText(exam: Exam, chapter: string, lesson: Lesson): string {
  const out = [`${lessonIntro(exam, chapter)}です。この内容について教えてください。`, `# ${chapter}`, lesson.lead];
  for (const s of lesson.sections) out.push(sectionBody(s));
  if (lesson.summary.length) out.push(`## この章のまとめ\n\n${lesson.summary.map(x => `- ${x}`).join("\n")}`);
  if (lesson.refs.length)
    out.push(`## 公式ドキュメント\n\n${lesson.refs.map(r => `- ${r.label}: ${r.url}`).join("\n")}`);
  return out.join("\n\n");
}
