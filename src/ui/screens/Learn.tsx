/* 教科書。目次（はじめに → 分野 → 細目）と章。章は前後の章へ順に読み進められる。
   章と節は、Claude に解説を頼めるようにまとめてコピーできる。
   章の終わり（まとめの後）まで読み進めると「読んだ」を自動で付ける。手で外せる（#29） */
import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { questionsOfTask, ratio, tally } from "../../core/engine/progress";
import type { Exam, Lesson, LessonBlock } from "../../core/exam/types";
import { PRIMER_ID, domainOfTask, findTask, lessonOrder, optionLetter } from "../../core/exam/types";
import { readChapters, setRead } from "../../core/store/actions";
import { itemKey } from "../../core/store/schema";
import { update, useData } from "../../app/store";
import { CopyButton } from "../CopyButton";
import { Meter } from "../Meter";
import { lessonText, sectionText } from "../copyText";
import { href } from "../route";

/** 章の名前（「はじめに」の章は教科書の題、ほかは細目の名前） */
export const chapterTitle = (exam: Exam, id: string): string =>
  id === PRIMER_ID ? (exam.primer?.title ?? id) : (findTask(exam, id)?.ja ?? id);

/** 章の番号の札（「はじめに」は 0） */
export const chapterTag = (id: string): string => (id === PRIMER_ID ? "0" : id);

/** 次に読む章（読んでいない最初の章）。全部読んだら無し */
export const nextChapter = (exam: Exam, read: ReadonlySet<string>): string | undefined =>
  lessonOrder(exam).find(id => !read.has(id));

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
  if ("steps" in b)
    return (
      <ol class="steps">
        {b.steps.map(x => (
          <li key={x}>{inline(x)}</li>
        ))}
      </ol>
    );
  if ("note" in b)
    return (
      <aside class={`note ${b.kind}`}>
        <strong>{b.kind === "warn" ? "間違えやすい" : "ポイント"}</strong>
        <p>{inline(b.note)}</p>
      </aside>
    );
  if ("terms" in b)
    return (
      <dl class="terms">
        {b.terms.map(([t, d]) => (
          <div key={t}>
            <dt>{inline(t)}</dt>
            <dd>{inline(d)}</dd>
          </div>
        ))}
      </dl>
    );
  if ("figure" in b)
    return (
      <figure class="fig">
        {/* 図は教科書の中で自分で組んだ SVG（外からの入力ではない） */}
        <div
          class="fig-svg"
          role="img"
          aria-label={b.caption.replace(/`/g, "")}
          dangerouslySetInnerHTML={{ __html: b.figure }}
        />
        <figcaption>{inline(b.caption)}</figcaption>
      </figure>
    );
  if ("quiz" in b)
    return (
      <div class="quiz">
        <strong>例題</strong>
        <p>{inline(b.quiz)}</p>
        <ol>
          {b.choices.map(c => (
            <li key={c}>{inline(c)}</li>
          ))}
        </ol>
        <details>
          <summary>答えと考え方を見る</summary>
          <p>
            <strong>答え：{optionLetter(b.answer)}</strong> {inline(b.why)}
          </p>
        </details>
      </div>
    );
  return (
    <pre class="code" lang="en" data-lang={b.lang}>
      <code>{b.code}</code>
    </pre>
  );
}

/** 章の本文。節ごとに、Claude に貼るためのコピーのボタンを見出しの横に置く */
function Body({ exam, chapter, lesson }: { exam: Exam; chapter: string; lesson: Lesson }) {
  return (
    <>
      <p class="card lead">{inline(lesson.lead)}</p>

      {lesson.sections.map((s, i) => (
        <section key={s.h} id={`sec-${i}`} class="stack lesson-sec">
          <div class="row between sec-head">
            <h2>{s.h}</h2>
            <CopyButton label="コピー" done="コピー済み" text={() => sectionText(exam, chapter, s)} />
          </div>
          {s.body.map((b, k) => (
            <Block key={k} b={b} />
          ))}
        </section>
      ))}

      {lesson.summary.length > 0 && (
        <section class="card summary stack">
          <h2>この章のまとめ</h2>
          <ul class="points">
            {lesson.summary.map(x => (
              <li key={x}>{inline(x)}</li>
            ))}
          </ul>
        </section>
      )}

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
    </>
  );
}

/** 章の終わりまで読み進めたら（印の要素が画面に入ったら）1 回だけ onSeen を呼ぶ */
function useSeenAtEnd(onSeen: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || fired.current || typeof IntersectionObserver !== "function") return;
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting) && !fired.current) {
        fired.current = true;
        onSeen();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);
  return { ref, stop: () => (fired.current = true) };
}

/** 目次の章の札の右側：読んだ印 */
const ReadMark = ({ on }: { on: boolean }) =>
  on ? (
    <span class="okc small read-mark" aria-label="読んだ">
      ✓ 読んだ
    </span>
  ) : null;

export function Learn({ exam, taskId, section, now }: { exam: Exam; taskId?: string; section?: number; now: number }) {
  // 検索から来たら、その節の位置から見せる（画面を移ったときの先頭へのスクロールの後に。#41）
  useEffect(() => {
    if (section === undefined) return;
    const id = requestAnimationFrame(() => document.getElementById(`sec-${section}`)?.scrollIntoView());
    return () => cancelAnimationFrame(id);
  }, [section]);
  const data = useData();
  const lessons = exam.lessons ?? {};
  const primer = exam.primer;
  const order = lessonOrder(exam);
  const read = readChapters(data, exam.id);
  const chapter = (id: string) => href({ name: "learn", examId: exam.id, taskId: id });
  const titleOf = (id: string) => chapterTitle(exam, id);
  const tagOf = chapterTag;
  const isPrimer = taskId === PRIMER_ID;
  const lesson = !taskId ? undefined : isPrimer ? primer : lessons[taskId];
  const seen = useSeenAtEnd(
    () => {
      if (taskId && !readChapters(data, exam.id).has(taskId))
        update(d => setRead(d, exam.id, taskId, true, Date.now()));
    },
    !!lesson && !!taskId && !read.has(taskId),
  );

  if (!taskId) {
    const statOf = (id: string) => data.items[itemKey(exam.id, id)];
    const next = nextChapter(exam, read);
    const readCount = order.filter(id => read.has(id)).length;
    return (
      <main class="page with-tabs">
        <h1>教科書</h1>
        <p class="muted small">
          出題範囲を細目ごとに 1
          章ずつ解説します。初めてなら「はじめに」から順に読み、各章を読んだらその細目を練習してください。仕様は公式ドキュメントで確かめた内容です（各章の終わりにリンク）。
        </p>
        <a class="btn block search-entry" href={href({ name: "search", examId: exam.id })}>
          教科書と要点を検索
        </a>
        {order.length === 0 && <p>この資格の教科書はまだありません。</p>}
        {order.length > 0 && (
          <div class="row between">
            <span class="muted small">
              読んだ {readCount} / {order.length} 章
            </span>
            {next && readCount > 0 && (
              <a class="btn small" href={chapter(next)}>
                続きを読む（{tagOf(next)}）→
              </a>
            )}
          </div>
        )}
        {primer && (
          <a class="card tight" href={chapter(PRIMER_ID)}>
            <div class="row between">
              <span>
                <span class="tag">0</span> {primer.title}
              </span>
              <ReadMark on={read.has(PRIMER_ID)} />
            </div>
            <span class="muted small">{inline(primer.lead)}</span>
          </a>
        )}
        {exam.domains.map(d => {
          const ts = d.tasks.filter(t => lessons[t.id]);
          if (ts.length === 0) return null;
          return (
            <section key={d.id} class="stack">
              <h2>
                <span class="tag">{d.id.toUpperCase()}</span> {d.ja}
              </h2>
              {ts.map(t => {
                const tl = tally(questionsOfTask(exam, t.id), statOf, now);
                return (
                  <a key={t.id} class="card tight" href={chapter(t.id)}>
                    <div class="row between">
                      <span>
                        <span class="tag">{t.id}</span> {t.ja}
                      </span>
                      <ReadMark on={read.has(t.id)} />
                    </div>
                    <span class="muted small">{inline(lessons[t.id]!.lead)}</span>
                    {tl.total > 0 && (
                      <div class="row toc-meter">
                        <Meter value={ratio(tl)} label={`${t.ja}の習熟`} />
                        <span class="muted small">
                          覚えた {tl.known}/{tl.total}
                        </span>
                      </div>
                    )}
                  </a>
                );
              })}
            </section>
          );
        })}
      </main>
    );
  }

  const toc = href({ name: "learn", examId: exam.id });
  const task = findTask(exam, taskId);
  const domain = domainOfTask(exam, taskId);
  if (!lesson || (!isPrimer && (!task || !domain)))
    return (
      <main class="page with-tabs">
        <a class="btn ghost" href={toc}>
          ← 目次
        </a>
        <p>この章は見つかりません。</p>
      </main>
    );
  const chapterName = isPrimer ? titleOf(taskId) : `${taskId} ${titleOf(taskId)}`;
  const i = order.indexOf(taskId);
  const prev = i > 0 ? order[i - 1] : undefined;
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : undefined;

  return (
    <main class="page with-tabs lesson">
      <a class="btn ghost" href={toc}>
        ← 目次
      </a>
      <header class="stack">
        {domain && (
          <span class="muted small">
            {domain.id.toUpperCase()} {domain.ja}
          </span>
        )}
        <h1>
          <span class="tag">{tagOf(taskId)}</span> {titleOf(taskId)}
        </h1>
        {task && (
          <p class="muted small en" lang="en">
            {task.title}
          </p>
        )}
        <div class="row end">
          <CopyButton label="この章をコピー" text={() => lessonText(exam, chapterName, lesson)} />
        </div>
      </header>

      <Body exam={exam} chapter={chapterName} lesson={lesson} />

      <div ref={seen.ref} class="row between read-row">
        <span class={read.has(taskId) ? "okc small" : "muted small"}>
          {read.has(taskId) ? "✓ この章は読んだ" : "最後まで読むと「読んだ」になります"}
        </span>
        <button
          class="btn ghost small"
          aria-pressed={read.has(taskId)}
          onClick={() => {
            seen.stop();
            update(d => setRead(d, exam.id, taskId, !read.has(taskId), Date.now()));
          }}
        >
          {read.has(taskId) ? "読んだを外す" : "読んだにする"}
        </button>
      </div>

      {!isPrimer && (
        <div class="stack">
          <a class="btn primary block" href={href({ name: "practice", examId: exam.id, only: taskId })}>
            この細目を練習する
          </a>
          <a class="btn block" href={href({ name: "task", examId: exam.id, taskId })}>
            要点と問題の一覧
          </a>
        </div>
      )}

      <nav class="lesson-nav" aria-label="章">
        {prev && (
          <a class="card tight" href={chapter(prev)}>
            <span class="muted small">← 前の章</span>
            <span>
              <span class="tag">{tagOf(prev)}</span> {titleOf(prev)}
            </span>
          </a>
        )}
        {next && (
          <a class="card tight next" href={chapter(next)}>
            <span class="muted small">次の章 →</span>
            <span>
              <span class="tag">{tagOf(next)}</span> {titleOf(next)}
            </span>
          </a>
        )}
      </nav>
    </main>
  );
}
