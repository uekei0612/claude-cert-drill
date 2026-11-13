/* 後で振り返る印を付けた問題の一覧。開くと答えと解説が読め、印を外せる。印を付けた問題だけで練習もできる */
import { useState } from "preact/hooks";
import type { Exam } from "../../exams/types";
import { savedIds } from "../../store/actions";
import { getData, useData } from "../../store/store";
import { LangSwitch } from "../LangSwitch";
import { QuestionCard } from "../QuestionCard";
import { SaveButton } from "../SaveButton";
import { href } from "../route";

export function Saved({ exam }: { exam: Exam }) {
  const data = useData();
  const byId = new Map(exam.questions.map(q => [q.id, q]));
  // 並びは開いたときのまま保つ（印を外してもその場では消さない。押し間違えたら付け直せるように）
  const [ids] = useState(() => savedIds(getData(), exam.id).filter(id => byId.has(id)));
  const [open, setOpen] = useState<string | undefined>();
  const count = savedIds(data, exam.id).filter(id => byId.has(id)).length;

  return (
    <main class="page with-tabs">
      <h1>振り返り</h1>
      {!ids.length ? (
        <section class="card">
          <p>まだ印を付けた問題はありません。</p>
          <p class="muted small">
            練習や模擬試験の見直しで、答えを表示したあとに「☆ 後で振り返る」を押すと、ここに集まります。
          </p>
        </section>
      ) : (
        <>
          <p class="muted small">
            印を付けた問題 {count}{" "}
            問（新しく付けた順）。開くと答えと解説が読めます。選択肢は元の並び（A〜D）で出すので、練習のときと記号が違うことがあります。
          </p>
          {count > 0 && (
            <a class="btn primary block" href={href({ name: "practice", examId: exam.id, only: "saved" })}>
              この {count} 問を練習する
            </a>
          )}
          <section class="stack">
            <div class="row end">
              <LangSwitch exam={exam} />
            </div>
            {ids.map(id => {
              const q = byId.get(id)!;
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
                      <span class="muted small">{q.point}</span>
                    </span>
                  </button>
                  {open === id && (
                    <QuestionCard
                      exam={exam}
                      q={q}
                      order={[0, 1, 2, 3]}
                      reveal={true}
                      scenarioOpen={false}
                      lang={data.settings.lang}
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
