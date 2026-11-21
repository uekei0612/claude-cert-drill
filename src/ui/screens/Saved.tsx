/* 振り返り。後で振り返る印を付けた問題と、苦手な問題（覚えたあとに何度も間違えた。#87）の一覧を切り替えて見る。
   開くと答えと解説が読め、印を外せる。一覧の問題だけで練習もできる */
import { useState } from "preact/hooks";
import { naturalOrder } from "../../core/engine/practice";
import { isKnown, isLearning } from "../../core/engine/schedule";
import { type Exam, optionLabel } from "../../core/exam/types";
import { langOf, savedIds, weakIds } from "../../core/store/actions";
import { itemKey } from "../../core/store/schema";
import { getData, useData } from "../../app/store";
import { LangSwitch } from "../LangSwitch";
import { QuestionCard, stemLang, stemOf } from "../QuestionCard";
import { SaveButton } from "../SaveButton";
import { HelpTip } from "../HelpTip";
import { type ReviewView, href } from "../route";

/** 今の習熟（一覧の行に添える） */
function stateLabel(s: Parameters<typeof isKnown>[0], now: number): string {
  if (isKnown(s, now)) return "今は覚えた";
  if (isLearning(s, now)) return "あと 1 回";
  return "まだ";
}

export function Saved({ exam, view, now }: { exam: Exam; view?: ReviewView; now: number }) {
  const data = useData();
  const byId = new Map(exam.questions.map(q => [q.id, q]));
  const weak = view === "weak";
  const listOf = (d: typeof data) => (weak ? weakIds(d, exam) : savedIds(d, exam.id).filter(id => byId.has(id)));
  // 並びは開いたときのまま保つ（印を外してもその場では消さない。押し間違えたら付け直せるように）
  const [ids] = useState(() => listOf(getData()));
  const [open, setOpen] = useState<string | undefined>();
  const count = listOf(data).length;
  const savedCount = savedIds(data, exam.id).filter(id => byId.has(id)).length;
  const weakCount = weakIds(data, exam).length;
  const lang = langOf(data, exam.id);

  return (
    <main class="page with-tabs">
      <h1>
        振り返り <HelpTip id={weak ? "weak" : "saved"} exam={exam} />
      </h1>
      <nav class="seg review-views" aria-label="振り返りの一覧">
        <a
          class={weak ? "" : "on"}
          aria-current={weak ? undefined : "page"}
          href={href({ name: "saved", examId: exam.id })}
        >
          ★ 印 {savedCount}
        </a>
        <a
          class={weak ? "on" : ""}
          aria-current={weak ? "page" : undefined}
          href={href({ name: "saved", examId: exam.id, view: "weak" })}
        >
          苦手 {weakCount}
        </a>
      </nav>
      {!ids.length ? (
        <section class="card">
          {weak ? (
            <>
              <p>今は苦手な問題はありません。</p>
              <p class="muted small">
                一度正解して覚えかけになった問題を、あとで 2
                回以上間違えると、ここに集まります（この一覧ができる前の間違いは数えていません）。
              </p>
            </>
          ) : (
            <>
              <p>まだ印を付けた問題はありません。</p>
              <p class="muted small">
                練習や模擬試験の見直しで、答えを表示したあとに「☆ 後で振り返る」を押すと、ここに集まります。
              </p>
            </>
          )}
        </section>
      ) : (
        <>
          <p class="muted small">
            {weak
              ? `覚えたあとに 2 回以上間違えた問題 ${count} 問（忘れた回数の多い順）。解説と教科書の章を読み直してから練習すると効きます。`
              : `印を付けた問題 ${count} 問（新しく付けた順）。`}
            開くと答えと解説が読めます。
            {exam.options?.shuffle === false
              ? ""
              : `選択肢は元の並び（${optionLabel(exam, 0)} から順）で出すので、練習のときと記号が違うことがあります。`}
          </p>
          {count > 0 && (
            <a
              class="btn primary block"
              href={href({ name: "practice", examId: exam.id, only: weak ? "weak" : "saved" })}
            >
              この {count} 問を練習する
            </a>
          )}
          <section class="stack">
            <div class="row end">
              <LangSwitch exam={exam} />
            </div>
            {ids.map(id => {
              const q = byId.get(id)!;
              const s = data.items[itemKey(exam.id, id)];
              return (
                <div key={id} class="card tight">
                  <button
                    class="review-row"
                    onClick={() => setOpen(open === id ? undefined : id)}
                    aria-expanded={open === id}
                  >
                    <span aria-hidden="true">{open === id ? "▾" : "▸"}</span>
                    <span>
                      <span class="tag">{q.tasks[0]}</span>
                      {weak && s && (
                        <span class="tag weak-tag">
                          忘れた {s.lapses ?? 0} 回・{stateLabel(s, now)}
                        </span>
                      )}
                      <span class="small row-stem" lang={stemLang(exam, lang)}>
                        {stemOf(exam, q, lang)}
                      </span>
                    </span>
                  </button>
                  {open === id && (
                    <QuestionCard
                      exam={exam}
                      q={q}
                      order={naturalOrder(q.options.length)}
                      reveal={true}
                      scenarioOpen={false}
                      lang={lang}
                      learnLink
                    />
                  )}
                  <div class="row end">
                    <SaveButton examId={exam.id} questionId={id} />
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
