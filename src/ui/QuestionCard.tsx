/* 1 問の表示。シナリオ（畳める）→ 問題文 → 選択肢。
   reveal のときは、選択肢ごとに正誤と解説を出す（誤答の解説がそのまま弱点の地図になる） */
import type { Exam, Question } from "../exams/types";
import { domainOf, findTask } from "../exams/types";

const LETTERS = ["A", "B", "C", "D"];

export interface QuestionCardProps {
  readonly exam: Exam;
  readonly q: Question;
  /** 表示する選択肢の順番（元の添字） */
  readonly order: readonly number[];
  /** 選んだ元の添字 */
  readonly chosen?: number;
  readonly reveal: boolean;
  readonly onChoose?: (original: number) => void;
  /** シナリオを最初から開いておくか（シナリオが変わった最初の問題など） */
  readonly scenarioOpen?: boolean;
}

export function QuestionCard({ exam, q, order, chosen, reveal, onChoose, scenarioOpen }: QuestionCardProps) {
  const scenario = exam.scenarios.find(s => s.id === q.scenario);
  const task = findTask(exam, q.tasks[0]);
  const domain = domainOf(exam, q);
  return (
    <article class="qcard">
      {scenario && (
        <details class="scenario" open={scenarioOpen}>
          <summary>
            <span class="tag">シナリオ {scenario.id.slice(1)}</span> {scenario.ja}
          </summary>
          <p class="en" lang="en">
            <strong>{scenario.title}.</strong> {scenario.context}
          </p>
        </details>
      )}
      <p class="stem en" lang="en">
        {q.stem}
      </p>
      <ol class="options" role="list">
        {order.map((orig, i) => {
          const o = q.options[orig]!;
          const isAnswer = orig === q.answer;
          const isChosen = orig === chosen;
          const state = reveal ? (isAnswer ? "ok" : isChosen ? "ng" : "dim") : isChosen ? "chosen" : "";
          return (
            <li key={orig}>
              <button
                class={`option ${state}`}
                disabled={reveal || !onChoose}
                aria-pressed={isChosen}
                onClick={() => onChoose?.(orig)}
              >
                <span class="letter">{LETTERS[i]}</span>
                <span class="en" lang="en">
                  {o.text}
                </span>
              </button>
              {reveal && (
                <p class={`why ${isAnswer ? "ok" : "ng"}`}>
                  <strong>{isAnswer ? "正解" : isChosen ? "あなたの答え・誤り" : "誤り"}</strong>　{o.why}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {reveal && (
        <div class="point">
          <p>
            <strong>覚えること</strong>　{q.point}
          </p>
          <p class="muted small">
            {domain?.id.toUpperCase()} {domain?.ja} ／ {task?.id} {task?.ja}
          </p>
        </div>
      )}
    </article>
  );
}
