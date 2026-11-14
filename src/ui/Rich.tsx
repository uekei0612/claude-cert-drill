/* 文の中の `…` をコードにする inline と、問題文の部品（段落・コード・表・図・箇条書き。#60）を描く部品。
   問題文の中の空欄 ［a］ は枠で囲んだ記号にする（#62） */
import type { ComponentChildren } from "preact";
import type { Stem, StemBlock } from "../core/exam/types";

/** 空欄 ［a］ を split したとき、奇数番目に空欄が来るようにした形（BLANK と同じ字の範囲） */
const BLANK_SPLIT = /(［[a-zα-ω]{0,2}］)/;

/** 文の中の空欄 ［a］ を枠付きの記号にする */
function blanks(text: string): ComponentChildren[] {
  return text.split(BLANK_SPLIT).map((part, i) =>
    i % 2 ? (
      <span key={i} class={part.length > 2 ? "blank" : "blank anon"}>
        <span class="sr-only">空欄</span>
        {part.length > 2 ? part.slice(1, -1) : "\u00a0"}
      </span>
    ) : (
      part
    ),
  );
}

/** 問題文などの文。`…` はコード、［a］ は空欄 */
function rich(text: string): ComponentChildren[] {
  return text
    .split(/(`[^`]+`)/)
    .map((part, i) =>
      part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
        <code key={i}>{blanks(part.slice(1, -1))}</code>
      ) : (
        <span key={i}>{blanks(part)}</span>
      ),
    );
}

/** 文の中の `…` をコードとして出す */
export function inline(text: string): ComponentChildren[] {
  return text
    .split(/(`[^`]+`)/)
    .map((part, i) =>
      part.length > 2 && part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part,
    );
}

function StemPart({ b }: { b: StemBlock }) {
  if (typeof b === "string") return <p>{rich(b)}</p>;
  if ("code" in b)
    return (
      <pre class="code" data-lang={b.lang}>
        <code>{blanks(b.code)}</code>
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
                  <th key={i}>{rich(h)}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {b.table.map((row, i) => (
              <tr key={i}>
                {row.map((c, j) => (
                  <td key={j}>{rich(c)}</td>
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
        <figcaption>{rich(b.caption)}</figcaption>
      </figure>
    );
  return (
    <ul>
      {b.list.map((x, i) => (
        <li key={i}>{rich(x)}</li>
      ))}
    </ul>
  );
}

/** 問題文などの原文・訳。文 1 つなら span、部品の並びなら div で包む */
export function RichText({ value, lang, cls }: { value: Stem; lang: string; cls?: string }) {
  if (typeof value === "string")
    return (
      <span lang={lang} class={cls}>
        {rich(value)}
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
