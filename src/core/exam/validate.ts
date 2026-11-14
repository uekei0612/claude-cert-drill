/* 資格の形の検査（#53）。問題と教科書は手で書くので、形の誤りをここで見つける。
   どの資格にも同じ検査をかける（src/exams/exams.test.ts）。資格だけの決まりは、その資格のフォルダのテストに書く。
   返すのは「どこ: 何が」の並び。空なら形は正しい */
import { PRIMER_ID, type Exam, type Lesson, type LessonBlock, allTasks } from "./types";

/** 偏りの検査（正解が一番長い選択肢・正解の位置）は、この数から見る（少ないうちは偏って当たり前） */
export const MIN_SAMPLE = 10;
/** 正解が一番長い選択肢になっている問題の割合の上限（長さで当てられないように） */
export const MAX_LONGEST_RATIO = 0.4;

/** 文の中の `…` の数が合っていない（コードの表示が崩れる） */
const oddTicks = (t: string) => (t.match(/`/g) ?? []).length % 2 !== 0;

/** 正解が一番長い選択肢になっているか */
const answerIsLongest = (texts: readonly string[], answer: number) => {
  const lens = texts.map(t => t.length);
  return lens[answer] === Math.max(...lens);
};

/** 部品の中の文 */
function blockTexts(b: LessonBlock): string[] {
  if (typeof b === "string") return [b];
  if ("list" in b) return [...b.list];
  if ("steps" in b) return [...b.steps];
  if ("note" in b) return [b.note];
  if ("terms" in b) return b.terms.flat();
  if ("figure" in b) return [b.caption];
  if ("quiz" in b) return [b.quiz, ...b.choices, b.why];
  return [];
}

/** 部品の中の項目（画面の key に使うので重ならない） */
function blockItems(b: LessonBlock): readonly string[] {
  if (typeof b === "string") return [];
  if ("terms" in b) return b.terms.map(t => t[0]);
  if ("list" in b) return b.list;
  if ("steps" in b) return b.steps;
  if ("quiz" in b) return b.choices;
  return [];
}

export function validateExam(exam: Exam): string[] {
  const out: string[] = [];
  const bad = (where: string, what: string) => out.push(`${where}: ${what}`);
  const tasks = allTasks(exam);
  const taskIds = new Set(tasks.map(t => t.id));
  const scenarioIds = new Set(exam.scenarios.map(s => s.id));

  // 資格・分野・細目・シナリオの ID（命名規則は docs/design.md）
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(exam.id)) bad(exam.id, "資格の ID は小文字・数字・ハイフン");
  if (exam.id !== exam.code.toLowerCase()) bad(exam.id, `資格の ID は試験コード（${exam.code}）の小文字`);
  if (!exam.domains.length) bad(exam.id, "分野が無い");
  exam.domains.forEach((d, i) => {
    if (d.id !== `d${i + 1}`) bad(d.id, `分野の ID は並びの順に d${i + 1}`);
    if (!d.tasks.length) bad(d.id, "細目が無い");
    d.tasks.forEach((t, j) => {
      if (t.id !== `${i + 1}.${j + 1}`) bad(t.id, `細目の ID は分野の番号から ${i + 1}.${j + 1}`);
    });
  });
  const weights = exam.domains.reduce((a, d) => a + d.weight, 0);
  if (Math.abs(weights - 1) > 1e-6) bad(exam.id, `配点の合計が 1 でない（${weights}）`);
  if (taskIds.size !== tasks.length) bad(exam.id, "細目の ID が重複している");
  exam.scenarios.forEach((s, i) => {
    if (s.id !== `s${i + 1}`) bad(s.id, `シナリオの ID は並びの順に s${i + 1}`);
    for (const d of s.domains) if (!exam.domains.some(x => x.id === d)) bad(s.id, `主な分野 ${d} が無い`);
  });

  // 模擬試験の形
  const f = exam.format;
  if (f.scenariosPerExam > exam.scenarios.length) bad("format", "模擬試験のシナリオの数が、シナリオの数より多い");
  if (!exam.scenarios.length && !(f.maxQuestions && f.maxQuestions > 0))
    bad("format", "シナリオの無い資格は maxQuestions（模擬試験の問題数）が要る");
  if (!(f.target > 0 && f.target < 1)) bad("format", "合格の目安（target）は 0 と 1 の間");
  if (!(f.secondsPerQuestion > 0)) bad("format", "1 問あたりの秒数が無い");

  // 要点
  for (const k of Object.keys(exam.notes)) if (!taskIds.has(k)) bad(`notes.${k}`, "その細目が無い");
  for (const t of tasks) if (!exam.notes[t.id]?.points.length) bad(t.id, "要点（notes）が無い");

  // 教科書
  for (const k of Object.keys(exam.lessons ?? {})) if (!taskIds.has(k)) bad(`lessons.${k}`, "その細目が無い");
  const chapters: [string, Lesson][] = [
    ...(exam.primer ? [[PRIMER_ID, exam.primer] as [string, Lesson]] : []),
    ...Object.entries(exam.lessons ?? {}),
  ];
  for (const [k, l] of chapters) {
    if (!l.lead.trim()) bad(k, "リード文が無い");
    if (l.sections.length < 2) bad(k, "節は 2 つ以上");
    if (new Set(l.sections.map(s => s.h)).size !== l.sections.length) bad(k, "節の見出しが重なっている");
    if (l.summary.length < 2) bad(k, "まとめは 2 行以上");
    if (!l.refs.length) bad(k, "公式ドキュメント（refs）が無い");
    for (const r of l.refs) if (!/^https:\/\//.test(r.url)) bad(k, `refs の URL が https でない（${r.url}）`);
    for (const t of [l.lead, ...l.summary]) if (oddTicks(t)) bad(k, `\` の数が合わない：${t}`);
    for (const s of l.sections) {
      const at = `${k} ${s.h}`;
      if (!s.body.length) bad(at, "本文が無い");
      // 「この章のまとめ」は画面が足すので、節の見出しには使わない
      if (s.h.includes("まとめ")) bad(at, "見出しに「まとめ」は使わない（画面が足す）");
      for (const b of s.body) {
        for (const t of blockTexts(b)) if (oddTicks(t)) bad(at, `\` の数が合わない：${t}`);
        const items = blockItems(b);
        if (new Set(items).size !== items.length) bad(at, "項目が重なっている");
        if (typeof b === "string") continue;
        if ("figure" in b) {
          if (!b.figure.startsWith("<svg ")) bad(at, "図が SVG でない");
          if (b.caption.trim().length <= 10) bad(at, "図の説明が短い");
        }
        if ("quiz" in b) {
          if (b.choices.length < 3 || b.choices.length > 4) bad(at, "例題の選択肢は 3〜4 個");
          if (!(Number.isInteger(b.answer) && b.answer >= 0 && b.answer < b.choices.length))
            bad(at, "例題の正解の位置が選択肢の外");
          if (b.why.trim().length <= 20) bad(at, "例題の解説が短い");
        }
      }
    }
  }
  const quizzes = chapters.flatMap(([, l]) =>
    l.sections.flatMap(s => s.body.flatMap(b => (typeof b !== "string" && "quiz" in b ? [b] : []))),
  );
  if (quizzes.length >= MIN_SAMPLE) {
    const positions = [0, 1, 2, 3].map(i => quizzes.filter(q => q.answer === i).length);
    if (positions.some(n => n / quizzes.length > 0.4))
      bad("例題", `正解の位置が偏っている（位置ごとの数 ${positions.join(" ")}。どれも 4 割まで）`);
    const longest = quizzes.filter(q => answerIsLongest(q.choices, q.answer)).length;
    if (longest / quizzes.length > 0.5) bad("例題", `正解が一番長い選択肢の例題が半分を超える（${longest}）`);
  }

  // 問題
  const ids = exam.questions.map(q => q.id);
  if (new Set(ids).size !== ids.length) bad(exam.id, "問題の ID が重複している");
  for (const q of exam.questions) {
    if (!/^[sd]\d+-\d{2}$/.test(q.id)) bad(q.id, "問題の ID は <シナリオ or 分野>-<2 桁>");
    else if (q.id.split("-")[0] !== (q.scenario ?? `d${q.tasks[0].split(".")[0]}`))
      bad(q.id, "問題の ID の頭が、シナリオ（無ければ主たる細目の分野）と合わない");
    if (exam.scenarios.length && !scenarioIds.has(q.scenario ?? "")) bad(q.id, `シナリオ ${q.scenario} が無い`);
    for (const t of q.tasks) if (!taskIds.has(t)) bad(q.id, `細目 ${t} が無い`);
    if (new Set(q.tasks).size !== q.tasks.length) bad(q.id, "細目が重なっている");
    if (q.options.length !== 4) bad(q.id, "選択肢は 4 つ");
    if (![0, 1, 2, 3].includes(q.answer)) bad(q.id, "正解の位置が選択肢の外");
    if (q.stem.trim().length <= 40) bad(q.id, "問題文が短い");
    if (!q.point.trim()) bad(q.id, "覚えること（point）が無い");
    const texts = q.options.map(o => o.text.trim());
    if (new Set(texts).size !== texts.length) bad(q.id, "選択肢が重複している");
    for (const o of q.options) {
      if (!o.text.trim()) bad(q.id, "空の選択肢がある");
      if (o.why.trim().length <= 10) bad(q.id, "選択肢ごとの解説が短い");
    }
    // 本番の択一は 1 つだけが正解。「上のすべて」などは使わない
    if (texts.some(t => /all of the above|none of the above/i.test(t))) bad(q.id, "「上のすべて」などは使わない");
  }
  const missingTasks = tasks.filter(t => !exam.questions.some(q => q.tasks[0] === t.id)).map(t => t.id);
  if (missingTasks.length) bad(exam.id, `主たる細目の問題が無い細目：${missingTasks.join(" ")}`);
  const missingScenarios = exam.scenarios.filter(s => !exam.questions.some(q => q.scenario === s.id)).map(s => s.id);
  if (missingScenarios.length) bad(exam.id, `問題の無いシナリオ：${missingScenarios.join(" ")}`);
  checkLongest(
    "問題",
    exam.questions.map(q => [q.id, q.options.map(o => o.text), q.answer]),
    bad,
  );

  // 訳
  for (const [lang, tr] of Object.entries(exam.translations ?? {})) {
    if (!tr) continue;
    const where = `訳（${lang}）`;
    const same = (a: readonly string[], b: readonly string[]) => [...a].sort().join() === [...b].sort().join();
    if (!same(Object.keys(tr.scenarios), [...scenarioIds])) bad(where, "シナリオの訳が、シナリオと 1 対 1 でない");
    if (!same(Object.keys(tr.questions), ids)) bad(where, "問題の訳が、問題と 1 対 1 でない");
    for (const [id, v] of Object.entries(tr.scenarios)) if (v.trim().length <= 20) bad(`${where} ${id}`, "訳が短い");
    for (const [id, t] of Object.entries(tr.questions)) {
      if (t.stem.trim().length <= 20) bad(`${where} ${id}`, "問題文の訳が短い");
      if (t.options.length !== 4) bad(`${where} ${id}`, "選択肢の訳は 4 つ");
      if (new Set(t.options.map(o => o.trim())).size !== t.options.length) bad(`${where} ${id}`, "選択肢の訳が重複");
      if (t.options.some(o => !o.trim())) bad(`${where} ${id}`, "空の選択肢の訳がある");
    }
    checkLongest(
      where,
      exam.questions.flatMap(q => {
        const t = tr.questions[q.id];
        return t ? [[q.id, t.options, q.answer] as const] : [];
      }),
      bad,
    );
  }
  return out;
}

/** 正解が一番長い選択肢になっている問題が多すぎないか */
function checkLongest(
  where: string,
  qs: readonly (readonly [string, readonly string[], number])[],
  bad: (where: string, what: string) => void,
): void {
  if (qs.length < MIN_SAMPLE) return;
  const longest = qs.filter(([, texts, answer]) => answerIsLongest(texts, answer)).map(([id]) => id);
  if (longest.length / qs.length > MAX_LONGEST_RATIO)
    bad(
      where,
      `正解が一番長い選択肢の問題が ${Math.round(MAX_LONGEST_RATIO * 100)}% を超える（${longest.length} / ${qs.length}：${longest.join(" ")}）`,
    );
}
