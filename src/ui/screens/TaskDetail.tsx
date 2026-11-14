/* 細目の要点と、その細目の問題の一覧（覚えた／まだ）。ここからその細目だけを練習できる */
import { questionsOfTask, tally } from "../../core/engine/progress";
import { isKnown, isLearning } from "../../core/engine/schedule";
import type { Exam } from "../../core/exam/types";
import { domainOfTask, findTask } from "../../core/exam/types";
import { itemKey } from "../../core/store/schema";
import { useData } from "../../app/store";
import { HelpTip } from "../HelpTip";
import { href } from "../route";

export function TaskDetail({ exam, taskId, now }: { exam: Exam; taskId: string; now: number }) {
  const data = useData();
  const task = findTask(exam, taskId);
  const domain = domainOfTask(exam, taskId);
  const back = href({ name: "domains", examId: exam.id });
  if (!task || !domain)
    return (
      <main class="page with-tabs">
        <a class="btn ghost" href={back}>
          ← 分野
        </a>
        <p>この細目は見つかりません。</p>
      </main>
    );
  const note = exam.notes[taskId];
  const statOf = (id: string) => data.items[itemKey(exam.id, id)];
  const qs = questionsOfTask(exam, taskId);
  const related = exam.questions.filter(q => q.tasks[0] !== taskId && q.tasks.includes(taskId));
  const t = tally(qs, statOf, now);
  const seenQs = [...qs, ...related].filter(q => statOf(q.id));
  const unseen = qs.length + related.length - seenQs.length;

  return (
    <main class="page with-tabs">
      <a class="btn ghost" href={back}>
        ← 分野
      </a>
      <header class="stack">
        <span class="muted small">
          {domain.id.toUpperCase()} {domain.ja}
        </span>
        <h1>
          <span class="tag">{task.id}</span> {task.ja}
        </h1>
        <p class="muted small en" lang="en">
          {task.title}
        </p>
      </header>

      <a class="btn primary block" href={href({ name: "practice", examId: exam.id, only: taskId })}>
        この細目を練習する（{qs.length + related.length} 問）
      </a>
      {exam.lessons?.[taskId] && (
        <a class="btn block" href={href({ name: "learn", examId: exam.id, taskId })}>
          教科書で読む
        </a>
      )}

      {note && (
        <section class="card">
          <h2>要点</h2>
          <ul class="points">
            {note.points.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {note.traps && (
            <>
              <h3>引っかかりやすい考え</h3>
              <ul class="points traps">
                {note.traps.map(p => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section class="stack">
        <h2>
          問題 <HelpTip id="learning" exam={exam} />{" "}
          <span class="muted small">
            覚えた {t.known} / {t.total}
          </span>
        </h2>
        {/* 解いた問題だけを要点つきで並べ、未解答は 1 行にまとめる（答えを見せないため要点は出さない。#35） */}
        {seenQs.map(q => {
          const s = statOf(q.id);
          const known = isKnown(s, now);
          const learning = isLearning(s, now);
          return (
            <div key={q.id} class="card tight">
              <div class="row between">
                <span class="muted small">
                  {exam.scenarios.find(x => x.id === q.scenario)?.ja ?? ""}
                  {q.tasks[0] !== taskId && "（関連）"}
                </span>
                <span class={known ? "okc small" : learning ? "small" : "ngc small"}>
                  {known ? "覚えた" : learning ? "あと 1 回" : "まだ"}
                </span>
              </div>
              <p class="small">{q.point}</p>
            </div>
          );
        })}
        {unseen > 0 && <p class="card tight muted small unseen">未解答 {unseen} 問。解くと、ここに要点が出ます。</p>}
      </section>
    </main>
  );
}
