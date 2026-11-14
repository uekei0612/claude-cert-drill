/* 教科書と要点の検索（#41）。語を入れると、教科書の節と細目（要点・覚えること）が並ぶ。
   入れた語は URL に残す（戻ってきても同じ結果が出る）。問題文と選択肢は答えが見えるので探さない */
import { useMemo, useState } from "preact/hooks";
import { type Hit, buildIndex, normalize, search } from "../../core/engine/search";
import type { Exam } from "../../core/exam/types";
import { href } from "../route";

/** 見つかった語を強調する */
function Mark({ text, query }: { text: string; query: string }) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  // 印の位置は元の文の位置で数える。正規化で長さが変わる文字（「…」など）が混じるときは、小文字にするだけで探す
  const nfkc = normalize(text);
  const norm = nfkc.length === text.length ? nfkc : text.toLowerCase();
  if (!terms.length) return <>{text}</>;
  const parts: preact.ComponentChildren[] = [];
  let i = 0;
  while (i < text.length) {
    const hit = terms
      .map(t => ({ t, at: norm.indexOf(t, i) }))
      .filter(x => x.at >= 0)
      .sort((a, b) => a.at - b.at)[0];
    if (!hit) {
      parts.push(text.slice(i));
      break;
    }
    if (hit.at > i) parts.push(text.slice(i, hit.at));
    parts.push(<mark key={hit.at}>{text.slice(hit.at, hit.at + hit.t.length)}</mark>);
    i = hit.at + hit.t.length;
  }
  return <>{parts}</>;
}

const hitHref = (exam: Exam, h: Hit) =>
  h.kind === "section"
    ? href({ name: "learn", examId: exam.id, taskId: h.chapterId, section: h.section })
    : href({ name: "task", examId: exam.id, taskId: h.taskId });

export function Search({ exam, q }: { exam: Exam; q: string }) {
  const docs = useMemo(() => buildIndex(exam), [exam]);
  const [text, setText] = useState(q);
  const hits = useMemo(() => search(docs, text), [docs, text]);
  const sections = hits.filter(h => h.kind === "section");
  const tasks = hits.filter(h => h.kind === "task");
  const onInput = (v: string) => {
    setText(v);
    // URL に残す（履歴には積まない）
    history.replaceState(null, "", href({ name: "search", examId: exam.id, q: v.trim() || undefined }));
  };
  return (
    <main class="page with-tabs">
      <a class="btn ghost" href={href({ name: "learn", examId: exam.id })}>
        ← 教科書
      </a>
      <h1>検索</h1>
      <input
        type="search"
        class="search-box"
        value={text}
        placeholder="例：tool_choice、PostToolUse、CLAUDE.md"
        aria-label="教科書と要点を検索"
        autoFocus
        onInput={e => onInput(e.currentTarget.value)}
      />
      <p class="muted small">
        教科書の節と、細目の要点・問題の「覚えること」から探します。問題文と選択肢は、答えが見えるので探しません。
      </p>
      {text.trim() && hits.length === 0 && (
        <p>
          見つかりませんでした。語を短くするか、{exam.translations?.ja ? "英語の表記でも" : "別の言い方でも"}
          試してください。
        </p>
      )}
      {sections.length > 0 && (
        <section class="stack">
          <h2>
            教科書 <span class="muted small">{sections.length} 件</span>
          </h2>
          {sections.map(h => (
            <a key={`${h.chapterId}-${h.section}`} class="card tight" href={hitHref(exam, h)}>
              <span>{h.title}</span>
              <span class="muted small">
                <Mark text={h.snippet} query={text} />
              </span>
            </a>
          ))}
        </section>
      )}
      {tasks.length > 0 && (
        <section class="stack">
          <h2>
            細目の要点 <span class="muted small">{tasks.length} 件</span>
          </h2>
          {tasks.map(h => (
            <a key={h.taskId} class="card tight" href={hitHref(exam, h)}>
              <span>{h.title}</span>
              <span class="muted small">
                <Mark text={h.snippet} query={text} />
              </span>
            </a>
          ))}
        </section>
      )}
    </main>
  );
}
