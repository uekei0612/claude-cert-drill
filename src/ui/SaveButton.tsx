/* 後で振り返る印を付ける・外すボタン。練習・模擬試験の見直し・振り返りの一覧で同じものを使う */
import { toggleSaved } from "../core/store/actions";
import { itemKey } from "../core/store/schema";
import { update, useData } from "../app/store";

export function SaveButton({ examId, questionId }: { examId: string; questionId: string }) {
  const on = useData().saved?.[itemKey(examId, questionId)] !== undefined;
  return (
    <button
      class={`btn ghost small save ${on ? "on" : ""}`}
      aria-pressed={on}
      onClick={() => update(d => toggleSaved(d, examId, questionId, Date.now()))}
    >
      {on ? "★ 振り返りに入れた" : "☆ 後で振り返る"}
    </button>
  );
}
