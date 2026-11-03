/* 資格を選ぶ画面（#/）。資格が 1 つでも出す */
import { exams } from "../../exams";
import { href } from "../route";

export function ExamPicker() {
  return (
    <main class="page">
      <header class="stack">
        <h1>claude-cert-drill</h1>
        <p class="muted">Claude の資格の試験勉強。問題はすべて自作の非公式教材です。</p>
      </header>
      {exams.map(e => (
        <a key={e.id} class="card" href={href({ name: "home", examId: e.id })}>
          <div class="row between">
            <h2>{e.code}</h2>
            <span class="muted small">{e.questions.length} 問</span>
          </div>
          <p class="en" lang="en">
            {e.title}
          </p>
          <p class="muted small">{e.summary}</p>
        </a>
      ))}
      <a class="btn ghost" href={href({ name: "settings" })}>
        設定と記録
      </a>
    </main>
  );
}
