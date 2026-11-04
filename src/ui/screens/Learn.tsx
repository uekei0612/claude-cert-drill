/* 教科書。目次（分野 → 細目）と、細目ごとの章。章は前後の章へ順に読み進められる */
import type { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import type { Exam, LessonBlock } from "../../exams/types";
import { domainOfTask, findTask } from "../../exams/types";
import { href } from "../route";

/** 文の中の `…` をコードとして出す */
export function inline(text: string): ComponentChildren[] {
  return text
    .split(/(`[^`]+`)/)
    .map((part, i) =>
      part.length > 2 && part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part,
    );
}

function Block({ b }: { b: LessonBlock }) {
  if (typeof b === "string") return <p>{inline(b)}</p>;
  if ("list" in b)
    return (
      <ul class="points">
        {b.list.map(x => (
          <li key={x}>{inline(x)}</li>
        ))}
      </ul>
    );
  return (
    <pre class="code" lang="en" data-lang={b.lang}>
      <code>{b.code}</code>
    </pre>
  );
}

export function Learn({ exam, taskId }: { exam: Exam; taskId?: string }) {
  // 章を移ったら先頭から読む（ハッシュの移動では位置が残る）
  useEffect(() => scrollTo(0, 0), [taskId]);
  const lessons = exam.lessons ?? {};
  const order = exam.domains.flatMap(d => d.tasks.map(t => t.id)).filter(id => lessons[id]);

  if (!taskId) {
    return (
      <main class="page with-tabs">
        <h1>教科書</h1>
        <p class="muted small">
          出題範囲を細目ごとに 1
          章ずつ解説します。読んでからその細目を練習すると覚えやすくなります。仕様は公式ドキュメントで確かめた内容です（各章の終わりにリンク）。
        </p>
        {order.length === 0 && <p>この資格の教科書はまだありません。</p>}
        {exam.domains.map(d => {
          const ts = d.tasks.filter(t => lessons[t.id]);
          if (ts.length === 0) return null;
          return (
            <section key={d.id} class="stack">
              <h2>
                <span class="tag">{d.id.toUpperCase()}</span> {d.ja}
              </h2>
              {ts.map(t => (
                <a key={t.id} class="card tight" href={href({ name: "learn", examId: exam.id, taskId: t.id })}>
                  <span>
                    <span class="tag">{t.id}</span> {t.ja}
                  </span>
                  <span class="muted small">{inline(lessons[t.id]!.lead)}</span>
                </a>
              ))}
            </section>
          );
        })}
      </main>
    );
  }

  const lesson = lessons[taskId];
  const task = findTask(exam, taskId);
  const domain = domainOfTask(exam, taskId);
  const toc = href({ name: "learn", examId: exam.id });
  if (!lesson || !task || !domain)
    return (
      <main class="page with-tabs">
        <a class="btn ghost" href={toc}>
          ← 目次
        </a>
        <p>この章は見つかりません。</p>
      </main>
    );
  const i = order.indexOf(taskId);
  const prev = i > 0 ? order[i - 1] : undefined;
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : undefined;
  const titleOf = (id: string) => findTask(exam, id)?.ja ?? id;

  return (
    <main class="page with-tabs lesson">
      <a class="btn ghost" href={toc}>
        ← 目次
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

      <p class="card lead">{inline(lesson.lead)}</p>

      {lesson.sections.map(s => (
        <section key={s.h} class="stack">
          <h2>{s.h}</h2>
          {s.body.map((b, k) => (
            <Block key={k} b={b} />
          ))}
        </section>
      ))}

      {lesson.refs.length > 0 && (
        <section class="stack">
          <h2>公式ドキュメント</h2>
          <ul class="small">
            {lesson.refs.map(r => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noopener">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div class="stack">
        <a class="btn primary block" href={href({ name: "practice", examId: exam.id, only: taskId })}>
          この細目を練習する
        </a>
        <a class="btn block" href={href({ name: "task", examId: exam.id, taskId })}>
          要点と問題の一覧
        </a>
      </div>

      <nav class="lesson-nav" aria-label="章">
        {prev && (
          <a class="card tight" href={href({ name: "learn", examId: exam.id, taskId: prev })}>
            <span class="muted small">← 前の章</span>
            <span>
              <span class="tag">{prev}</span> {titleOf(prev)}
            </span>
          </a>
        )}
        {next && (
          <a class="card tight next" href={href({ name: "learn", examId: exam.id, taskId: next })}>
            <span class="muted small">次の章 →</span>
            <span>
              <span class="tag">{next}</span> {titleOf(next)}
            </span>
          </a>
        )}
      </nav>
    </main>
  );
}
