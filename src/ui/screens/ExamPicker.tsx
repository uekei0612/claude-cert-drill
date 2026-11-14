/* 資格を選ぶ画面（#/）。資格が 1 つでも出す */
import { APP } from "../../app/config";
import { catalog } from "../../exams";
import { href } from "../route";

export function ExamPicker() {
  return (
    <main class="page">
      <header class="stack">
        <h1>{APP.name}</h1>
        <p class="muted">{APP.tagline}</p>
      </header>
      {catalog.list.map(e => (
        <a key={e.id} class="card" href={href({ name: "home", examId: e.id })}>
          <div class="row between">
            <h2>{e.code}</h2>
            {e.format.questions && e.format.minutes && (
              <span class="muted small">
                本番 {e.format.questions} 問・{e.format.minutes} 分
              </span>
            )}
          </div>
          <p class="en" lang="en">
            {e.title}
          </p>
          <p class="muted small">{e.summary}</p>
        </a>
      ))}
      <div class="row wrap">
        <a class="btn ghost" href={href({ name: "help" })}>
          使い方
        </a>
        <a class="btn ghost" href={href({ name: "settings" })}>
          設定と記録
        </a>
      </div>
    </main>
  );
}
