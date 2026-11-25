/* 解いた問題の一覧（#103）。練習の終わりと模擬試験の結果の見直しで使う。
   1 行に ○・×・勘・未回答の印、番号、細目、問題文の冒頭を出し、押すと問題・自分の答え・解説を開く */
import { useState } from "preact/hooks";
import type { Exam } from "../core/exam/types";
import { langOf } from "../core/store/actions";
import { useData } from "../app/store";
import { QuestionCard, stemLang, stemOf } from "./QuestionCard";
import type { Route } from "./route";
import { SaveButton } from "./SaveButton";

export interface SolvedItem {
  readonly id: string;
  /** 一覧での番号（1 から） */
  readonly no: number;
  /** ok＝正解、guess＝勘で正解、ng＝誤り、none＝答えていない */
  readonly result: "ok" | "guess" | "ng" | "none";
  /** 選んだ元の選択肢の添字（記録に無ければ無し） */
  readonly chosen?: number;
  /** 表示する選択肢の順番 */
  readonly order: readonly number[];
}

const MARK = { ok: "○", guess: "勘", ng: "×", none: "－" } as const;
const MARK_LABEL = { ok: "正解", guess: "勘で正解", ng: "誤り", none: "未回答" } as const;

export function SolvedList({
  exam,
  items,
  learnBack,
}: {
  exam: Exam;
  items: readonly SolvedItem[];
  /** 開いた問題から教科書の章へ移れるときの戻り先（無ければ章へのリンクを出さない） */
  learnBack?: Route;
}) {
  const data = useData();
  const lang = langOf(data, exam.id);
  const [open, setOpen] = useState<string | undefined>();
  const byId = new Map(exam.questions.map(q => [q.id, q]));
  return (
    <div class="stack solved-list">
      {items.map(it => {
        const q = byId.get(it.id);
        if (!q) return null;
        return (
          <div key={it.id} class="card tight">
            <button
              class="review-row"
              onClick={() => setOpen(open === it.id ? undefined : it.id)}
              aria-expanded={open === it.id}
            >
              <span class={it.result === "ok" ? "okc" : "ngc"} aria-label={MARK_LABEL[it.result]}>
                {MARK[it.result]}
              </span>
              <span>
                {it.no}. <span class="tag">{q.tasks[0]}</span>
                <span class="small row-stem" lang={stemLang(exam, lang)}>
                  {stemOf(exam, q, lang)}
                </span>
              </span>
            </button>
            {open === it.id && (
              <>
                <QuestionCard
                  exam={exam}
                  q={q}
                  order={it.order}
                  chosen={it.chosen}
                  reveal={true}
                  scenarioOpen={false}
                  lang={lang}
                  learnLink={!!learnBack}
                  learnBack={learnBack}
                />
                <div class="row end">
                  <SaveButton examId={exam.id} questionId={it.id} />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
