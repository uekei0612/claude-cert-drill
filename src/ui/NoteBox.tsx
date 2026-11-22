/* 問題のメモ（#88）。答えを見たあとの問題カードに出す（答える前は出さない。メモが答えのヒントになるため）。
   書きかけは、入力欄から離れたとき・「完了」・画面を移るときに保存する（「次へ」を押しても消えないように）。
   呼ぶ側は問題ごとに key={問題 ID} で作り直す。1 文字ずつは保存しない（記録全体を書き直すので、問題の多い資格だと入力が重くなる） */
import { useEffect, useRef, useState } from "preact/hooks";
import { noteOf, setNote } from "../core/store/actions";
import { MAX_NOTE } from "../core/store/schema";
import { update, useData } from "../app/store";

export function NoteBox({ examId, questionId }: { examId: string; questionId: string }) {
  const note = noteOf(useData(), examId, questionId);
  // 書いている途中の文（書いていなければ undefined）
  const [draft, setDraft] = useState<string | undefined>();
  const pending = useRef<{ id: string; text: string } | undefined>(undefined);
  const save = () => {
    const p = pending.current;
    pending.current = undefined;
    if (p) update(d => setNote(d, examId, p.id, p.text, Date.now()));
  };
  // 画面を移る・次の問題へ進む（呼ぶ側が問題ごとに key で作り直す）ときに、書きかけを保存する
  useEffect(() => save, []);

  const edit = (text: string) => {
    pending.current = { id: questionId, text };
    setDraft(text);
  };
  const done = () => {
    save();
    setDraft(undefined);
  };

  if (draft !== undefined)
    return (
      <div class="note-box editing">
        <label class="small muted" for={`note-${questionId}`}>
          メモ（なぜ間違えたか・どこで迷ったか）
        </label>
        <textarea
          id={`note-${questionId}`}
          rows={3}
          maxLength={MAX_NOTE}
          value={draft}
          onInput={e => edit(e.currentTarget.value)}
          onBlur={save}
          ref={el => {
            // 開いたときに 1 度だけ入力欄へ（打ち始められるように）
            if (el && !el.dataset.focused) {
              el.dataset.focused = "1";
              el.focus();
            }
          }}
        />
        <div class="row end">
          <span class="muted small">{draft.trim() ? "" : "空のまま完了すると消えます"}</span>
          <button class="btn small note-done" onClick={done}>
            完了
          </button>
        </div>
      </div>
    );
  if (note)
    return (
      <div class="note-box">
        <p class="small note-text">
          <strong>メモ</strong>　{note.text}
        </p>
        <div class="row end">
          <button class="btn ghost small note-edit" onClick={() => setDraft(note.text)}>
            直す
          </button>
          <button
            class="btn ghost small note-delete"
            onClick={() => confirm("このメモを消しますか？") && update(d => setNote(d, examId, questionId, "", 0))}
          >
            消す
          </button>
        </div>
      </div>
    );
  return (
    <div class="row end">
      <button class="btn ghost small note-add" onClick={() => setDraft("")}>
        ✎ メモを書く
      </button>
    </div>
  );
}
