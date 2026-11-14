/* 使い方と用語（#50）。おすすめの進め方と、画面に出るアプリ独自の用語をまとめる。
   用語の文は「?」と同じ glossary から読む */
import { APP } from "../../app/config";
import { useData } from "../../app/store";
import { STEPS, TERMS } from "../glossary";
import { href } from "../route";
import { useExam } from "../useExam";
import { catalog } from "../../exams";

export function Help() {
  const last = useData().settings.lastExam;
  // 用語の説明に資格の数字（目安・本番の問題数）を入れる。読み込むまでは資格なしの文で出す
  const loading = useExam(last);
  const exam = loading.status === "ready" ? loading.exam : undefined;
  const meta = last ? catalog.find(last) : undefined;
  return (
    <main class={`page ${meta ? "with-tabs" : ""}`}>
      <a class="btn ghost" href={meta ? href({ name: "home", examId: meta.id }) : href({ name: "picker" })}>
        ← {meta ? "ホーム" : "資格一覧"}
      </a>
      <h1>使い方</h1>
      <section class="card stack" aria-labelledby="steps-h">
        <h2 id="steps-h">おすすめの進め方</h2>
        <ol class="steps help-steps">
          {STEPS.map(s => (
            <li key={s.title}>
              <strong>{s.title}</strong>
              <span class="muted small">{s.body}</span>
            </li>
          ))}
        </ol>
      </section>
      <section class="card stack" aria-labelledby="terms-h">
        <h2 id="terms-h">用語と指標</h2>
        <dl class="glossary">
          {TERMS.map(t => (
            <div key={t.id} id={`term-${t.id}`}>
              <dt>{t.term}</dt>
              <dd class="small">{t.def(exam)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p class="muted small">{APP.disclaimer}</p>
    </main>
  );
}
