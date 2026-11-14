/* 文の中の `…` をコードにする inline と、問題文の部品（段落・コード・表・図・箇条書き。#60）を描く部品 */
import type { ComponentChildren } from "preact";
import type { Stem, StemBlock } from "../core/exam/types";

/** 文の中の `…` をコードとして出す */
export function inline(text: string): ComponentChildren[] {
  return text
    .split(/(`[^`]+`)/)
    .map((part, i) =>
      part.length > 2 && part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part,
    );
}

function StemPart({ b }: { b: StemBlock }) {
  if (typeof b === "string") return <p>{inline(b)}</p>;
  if ("code" in b)
    return (
      <pre class="code" data-lang={b.lang}>
        <code>{b.code}</code>
      </pre>
    );
  if ("table" in b)
    return (
      <div class="qtable-wrap">
        <table class="qtable">
          {b.head && (
            <thead>
              <tr>
                {b.head.map((h, i) => (
                  <th key={i}>{inline(h)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {b.table.map((row, i) => (
              <tr key={i}>
                {row.map((c, j) => (
                  <td key={j}>{inline(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if ("figure" in b)
    return (
      <figure class="fig">
        {/* 図は資格のデータの中で自分で組んだ SVG（外からの入力ではない） */}
        <div
          class="fig-svg"
          role="img"
          aria-label={b.caption.replace(/`/g, "")}
          dangerouslySetInnerHTML={{ __html: b.figure }}
        />
        <figcaption>{inline(b.caption)}</figcaption>
      </figure>
    );
  return (
    <ul>
      {b.list.map((x, i) => (
        <li key={i}>{inline(x)}</li>
      ))}
    </ul>
  );
}

/** 問題文などの原文・訳。文 1 つなら span、部品の並びなら div で包む */
export function RichText({ value, lang, cls }: { value: Stem; lang: string; cls?: string }) {
  if (typeof value === "string")
    return (
      <span lang={lang} class={cls}>
        {inline(value)}
      </span>
    );
  return (
    <div lang={lang} class={["rich", cls].filter(Boolean).join(" ")}>
      {value.map((b, i) => (
        <StemPart key={i} b={b} />
      ))}
    </div>
  );
}
