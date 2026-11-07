/* 資格のホーム。いちばん上に合格の目安、次に「今日の練習」、伸ばすと効く細目、分野ごとの習熟 */
import { dueCount, questionsOfDomain, readiness, ratio, tally, weakestTasks } from "../../engine/progress";
import type { Exam } from "../../exams/types";
import { findTask } from "../../exams/types";
import { itemKey } from "../../store/schema";
import { useData } from "../../store/store";
import { Meter, pct } from "../Meter";
import { href } from "../route";

export function Home({ exam, now }: { exam: Exam; now: number }) {
  const data = useData();
  const statOf = (id: string) => data.items[itemKey(exam.id, id)];
  const ready = readiness(exam, statOf, now);
  const all = tally(exam.questions, statOf, now);
  const due = dueCount(exam, statOf, now);
  const weak = weakestTasks(exam, statOf, now, 3);
  const active = data.activeMock?.examId === exam.id ? data.activeMock : undefined;
  const lastMock = data.mocks[exam.id]?.[0];
  const target = exam.format.target;

  return (
    <main class="page with-tabs">
      <header class="row between">
        <div>
          <h1>{exam.code}</h1>
          <p class="muted small en" lang="en">
            {exam.title}
          </p>
        </div>
        <a class="btn ghost small" href={href({ name: "picker" })}>
          資格一覧
        </a>
      </header>

      <section class="card" aria-labelledby="ready-h">
        <div class="row between">
          <h2 id="ready-h">合格の目安</h2>
          <span class={`big ${ready >= target ? "okc" : ""}`}>{pct(ready)}</span>
        </div>
        <Meter value={ready} mark={target} label="合格の目安" />
        <p class="muted small">
          配点で重み付けした「覚えた問題」の割合。線は目安の {pct(target)}（独自の基準）。未解答は覚えていない扱い。
          {all.seen < all.total && ` 未解答 ${all.total - all.seen} 問。`}
        </p>
      </section>

      {active && (
        <a class="card notice" href={href({ name: "mock", examId: exam.id })}>
          <strong>模擬試験の途中です</strong>
          <span class="small">
            {Object.keys(active.answers).length} / {active.questionIds.length} 問に回答済み。続きから再開する
          </span>
        </a>
      )}

      <a class="btn primary block" href={href({ name: "practice", examId: exam.id })}>
        {due ? `今日の練習（復習 ${due} 問から）` : all.seen < all.total ? "練習する（新しい問題から）" : "練習する"}
      </a>

      {weak.length > 0 && (
        <section class="stack" aria-labelledby="weak-h">
          <h2 id="weak-h">伸ばすと効く細目</h2>
          {weak.map(w => {
            const t = findTask(exam, w.taskId);
            return (
              <a key={w.taskId} class="card tight" href={href({ name: "task", examId: exam.id, taskId: w.taskId })}>
                <div class="row between">
                  <span>
                    <span class="tag">{w.taskId}</span> {t?.ja}
                  </span>
                  <span class="muted small">+{(w.gain * 100).toFixed(1)}pt</span>
                </div>
              </a>
            );
          })}
        </section>
      )}

      <section class="stack" aria-labelledby="dom-h">
        <div class="row between">
          <h2 id="dom-h">分野</h2>
          <a class="small tap" href={href({ name: "domains", examId: exam.id })}>
            細目ごとに見る
          </a>
        </div>
        {exam.domains.map(d => {
          const t = tally(questionsOfDomain(exam, d.id), statOf, now);
          return (
            <a key={d.id} class="card tight" href={href({ name: "practice", examId: exam.id, only: d.id })}>
              <div class="row between">
                <span>
                  <span class="tag">{d.id.toUpperCase()}</span> {d.ja}
                </span>
                <span class="muted small">配点 {pct(d.weight)}</span>
              </div>
              <Meter value={ratio(t)} label={`${d.ja}の習熟`} />
              <span class="muted small">
                覚えた {t.known} / {t.total} 問{t.due ? `・復習待ち ${t.due}` : ""}
              </span>
            </a>
          );
        })}
      </section>

      {lastMock && (
        <a class="card tight" href={href({ name: "mock-result", examId: exam.id, at: lastMock.finishedAt })}>
          <div class="row between">
            <span>前回の模擬試験</span>
            <span class={lastMock.weighted >= target ? "okc" : "ngc"}>{pct(lastMock.weighted)}</span>
          </div>
          <span class="muted small">
            {new Date(lastMock.finishedAt).toLocaleDateString("ja-JP")}・{lastMock.correct} / {lastMock.total} 問正解
          </span>
        </a>
      )}
    </main>
  );
}
