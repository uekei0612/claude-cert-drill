/* 資格のホーム。いちばん上に合格の目安、次に「今日の練習」、伸ばすと効く細目、分野ごとの習熟 */
import { dailyPlan, parseDate } from "../../engine/plan";
import { dueCount, questionsOfDomain, readiness, ratio, tally, weakestTasks } from "../../engine/progress";
import type { Exam } from "../../exams/types";
import { PRIMER_ID, findTask, lessonOrder } from "../../exams/types";
import { daysOf, readChapters, savedIds, setSettings } from "../../store/actions";
import { PRACTICE_SIZES, itemKey } from "../../store/schema";
import { update, useData } from "../../store/store";
import { Activity } from "../Activity";
import { HelpTip } from "../HelpTip";
import { Meter, pct } from "../Meter";
import { STEPS } from "../glossary";
import { href } from "../route";
import { chapterTag, chapterTitle, nextChapter } from "./Learn";
import { fmt } from "./Mock";

export function Home({ exam, now }: { exam: Exam; now: number }) {
  const data = useData();
  const statOf = (id: string) => data.items[itemKey(exam.id, id)];
  const ready = readiness(exam, statOf, now);
  const all = tally(exam.questions, statOf, now);
  const read = readChapters(data, exam.id);
  const chapters = lessonOrder(exam);
  const readCount = chapters.filter(id => read.has(id)).length;
  const nextRead = nextChapter(exam, read);
  const examDate = data.settings.examDates?.[exam.id];
  const examAt = examDate ? parseDate(examDate) : undefined;
  const unseen = all.total - all.seen;
  const unread = chapters.length - readCount;
  const plan = examAt !== undefined ? dailyPlan(examAt, now, unseen, unread) : undefined;
  const due = dueCount(exam, statOf, now);
  const weak = weakestTasks(exam, statOf, now, 3);
  const active = data.activeMock?.examId === exam.id ? data.activeMock : undefined;
  const lastMock = data.mocks[exam.id]?.[0];
  const target = exam.format.target;
  const saved = savedIds(data, exam.id).filter(id => exam.questions.some(q => q.id === id)).length;

  return (
    <main class="page with-tabs">
      <header class="row between">
        <div>
          <h1>{exam.code}</h1>
          <p class="muted small en" lang="en">
            {exam.title}
          </p>
        </div>
        <nav class="row head-links" aria-label="ほかの画面">
          <a class="btn ghost small" href={href({ name: "settings" })}>
            設定
          </a>
          <a class="btn ghost small" href={href({ name: "picker" })}>
            資格一覧
          </a>
        </nav>
      </header>

      <section class="card" aria-labelledby="ready-h">
        <div class="row between">
          <h2 id="ready-h">
            合格の目安 <HelpTip id="readiness" exam={exam} />
          </h2>
          <span class={`big ${ready >= target ? "okc" : ""}`}>{pct(ready)}</span>
        </div>
        <Meter value={ready} mark={target} label="合格の目安" />
        <p class="muted small">
          配点で重み付けした「覚えた問題」
          <HelpTip id="known" exam={exam} />
          の割合。線は目安の {pct(target)}。{all.seen < all.total && `未解答 ${all.total - all.seen} 問。`}
        </p>
      </section>

      {plan && (
        <section class="card tight plan" aria-labelledby="plan-h">
          <div class="row between">
            <h2 id="plan-h">{plan.daysLeft ? `試験まであと ${plan.daysLeft} 日` : "今日が試験日です"}</h2>
            <span class="muted small">{examDate}</span>
          </div>
          <p class="small">
            {plan.daysLeft
              ? `今日の目安：復習 ${due} 問＋新しい問題 ${plan.newToday} 問${plan.chaptersToday ? `・教科書\u00a0${plan.chaptersToday}\u00a0章` : ""}`
              : `新しいことは増やさず、復習 ${due} 問と振り返りだけにしましょう。`}
          </p>
          {plan.daysLeft > 0 && (
            <p class="muted small">
              残り：未解答 {unseen} 問・未読 {unread} 章（試験の前日までの {plan.daysLeft} 日で割った数）
            </p>
          )}
        </section>
      )}

      {active && (
        <a class="card notice" href={href({ name: "mock", examId: exam.id })}>
          <strong>模擬試験の途中です</strong>
          <span class="small">
            {Object.keys(active.answers).length} / {active.questionIds.length} 問に回答済み・残り{" "}
            {fmt(active.limitMs - active.usedMs)}（時間は止まっています）。続きから再開する
          </span>
        </a>
      )}

      {!data.settings.introDone && (
        <section class="card intro" aria-labelledby="intro-h">
          <div class="row between">
            <h2 id="intro-h">はじめての方へ：進め方</h2>
            <button class="btn ghost small" onClick={() => update(d => setSettings(d, { introDone: true }))}>
              閉じる
            </button>
          </div>
          <ol class="steps help-steps">
            {STEPS.map(s => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                <span class="muted small">{s.body}</span>
              </li>
            ))}
          </ol>
          <div class="row wrap">
            {exam.primer && (
              <a class="btn primary" href={href({ name: "learn", examId: exam.id, taskId: PRIMER_ID })}>
                「はじめに」を読む
              </a>
            )}
            <a class="btn" href={href({ name: "practice", examId: exam.id })}>
              すぐ練習する
            </a>
            <a class="btn ghost" href={href({ name: "help" })}>
              使い方と用語
            </a>
          </div>
        </section>
      )}

      <div class="row between size-row">
        <span class="muted small" id="size-label">
          1 回の問題数
        </span>
        <div class="seg" role="group" aria-labelledby="size-label">
          {PRACTICE_SIZES.map(n => (
            <button
              key={n}
              class={n === data.settings.practiceSize ? "on" : ""}
              aria-pressed={n === data.settings.practiceSize}
              onClick={() => update(d => setSettings(d, { practiceSize: n }))}
            >
              {n} 問
            </button>
          ))}
        </div>
      </div>
      <a class="btn primary block" href={href({ name: "practice", examId: exam.id })}>
        {due ? `今日の練習（復習 ${due} 問から）` : all.seen < all.total ? "練習する（新しい問題から）" : "練習する"}
      </a>

      <a class="card tight" href={href({ name: "saved", examId: exam.id })}>
        <div class="row between">
          <span>★ 振り返り</span>
          <span class="muted small">{saved} 問</span>
        </div>
        {!saved && <span class="muted small">答えのあとの「☆ 後で振り返る」で印を付けた問題が集まります</span>}
      </a>

      {nextRead && (
        <a class="card tight" href={href({ name: "learn", examId: exam.id, taskId: nextRead })}>
          <div class="row between">
            <span>教科書の続き</span>
            <span class="muted small">
              読んだ {readCount} / {chapters.length} 章
            </span>
          </div>
          <span>
            <span class="tag">{chapterTag(nextRead)}</span> {chapterTitle(exam, nextRead)}
          </span>
        </a>
      )}

      {weak.length > 0 && (
        <section class="stack" aria-labelledby="weak-h">
          <h2 id="weak-h">
            伸ばすと効く細目 <HelpTip id="gain" exam={exam} />
          </h2>
          <p class="muted small">右の数字は、その細目の問題を全部覚えたときに合格の目安が上がる幅です。</p>
          {weak.map(w => {
            const t = findTask(exam, w.taskId);
            return (
              <div key={w.taskId} class="card tight split">
                <a class="card-main" href={href({ name: "task", examId: exam.id, taskId: w.taskId })}>
                  <div class="row between">
                    <span>
                      <span class="tag">{w.taskId}</span> {t?.ja}
                    </span>
                    <span
                      class="muted small"
                      aria-label={`全部覚えると目安が ${(w.gain * 100).toFixed(1)} ポイント上がる`}
                    >
                      目安 +{(w.gain * 100).toFixed(1)}
                    </span>
                  </div>
                  <span class="muted small">要点と問題 ›</span>
                </a>
                <a class="btn small go" href={href({ name: "practice", examId: exam.id, only: w.taskId })}>
                  練習 ▶
                </a>
              </div>
            );
          })}
        </section>
      )}

      <section class="stack" aria-labelledby="dom-h">
        <div class="row between">
          <h2 id="dom-h">
            分野 <HelpTip id="domain" exam={exam} />
          </h2>
          <a class="small tap" href={href({ name: "domains", examId: exam.id })}>
            細目ごとに見る
          </a>
        </div>
        {exam.domains.map(d => {
          const t = tally(questionsOfDomain(exam, d.id), statOf, now);
          return (
            <div key={d.id} class="card tight split">
              <a class="card-main" href={href({ name: "domains", examId: exam.id, domainId: d.id })}>
                <div class="row between">
                  <span>
                    <span class="tag">{d.id.toUpperCase()}</span> {d.ja}
                  </span>
                  <span class="muted small">配点 {pct(d.weight)}</span>
                </div>
                <Meter value={ratio(t)} label={`${d.ja}の習熟`} />
                <span class="muted small">
                  覚えた {t.known} / {t.total} 問{t.due ? `・復習待ち ${t.due}` : ""}・細目 ›
                </span>
              </a>
              <a class="btn small go" href={href({ name: "practice", examId: exam.id, only: d.id })}>
                練習 ▶
              </a>
            </div>
          );
        })}
      </section>

      <Activity days={daysOf(data, exam.id)} now={now} />

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
