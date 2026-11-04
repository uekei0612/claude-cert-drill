/* 1 問の表示。シナリオ（畳める）→ 問題文 → 選択肢。
   reveal のときは、選択肢ごとに正誤と解説を出す（誤答の解説がそのまま弱点の地図になる）。
   lang で問題文の言語を選ぶ（訳が無い問題は英語で出す）。peek は英語だけを出し、「訳を見る」を押すか
   答えたら併記に変わる（英語を先に読ませるため。訳を開くのはその問題だけで、次の問題ではまた閉じる） */
import { useState } from "preact/hooks";
import type { Exam, Question } from "../exams/types";
import { domainOf, findTask } from "../exams/types";
import type { QuestionLang } from "../store/schema";

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
  readonly lang?: QuestionLang;
}

/** 英語・日本語・併記のどれかで文を出す */
function Text({ en, ja, lang }: { en: string; ja?: string; lang: Exclude<QuestionLang, "peek"> }) {
  if (lang === "ja" && ja) return <span lang="ja">{ja}</span>;
  if (lang === "both" && ja)
    return (
      <>
        <span class="en" lang="en">
          {en}
        </span>
        <span class="ja-sub" lang="ja">
          {ja}
        </span>
      </>
    );
  return (
    <span class="en" lang="en">
      {en}
    </span>
  );
}

export function QuestionCard({
  exam,
  q,
  order,
  chosen,
  reveal,
  onChoose,
  scenarioOpen,
  lang = "en",
}: QuestionCardProps) {
  const scenario = exam.scenarios.find(s => s.id === q.scenario);
  const task = findTask(exam, q.tasks[0]);
  const domain = domainOf(exam, q);
  const ja = exam.translations?.ja;
  const tq = ja?.questions[q.id];
  // 訳を開いた問題の ID（同じカードのまま次の問題に変わったら閉じた状態に戻す）
  const [openedId, setOpenedId] = useState<string | undefined>();
  const peeking = lang === "peek";
  const shown: Exclude<QuestionLang, "peek"> = peeking ? (reveal || openedId === q.id ? "both" : "en") : lang;
  return (
    <article class="qcard">
      {scenario && (
        <details class="scenario" open={scenarioOpen}>
          <summary>
            <span class="tag">シナリオ {scenario.id.slice(1)}</span> {scenario.ja}
          </summary>
          <p>
            {shown !== "ja" && (
              <strong class="en" lang="en">
                {scenario.title}.{" "}
              </strong>
            )}
            <Text en={scenario.context} ja={ja?.scenarios[scenario.id]} lang={shown} />
          </p>
        </details>
      )}
      <p class="stem">
        <Text en={q.stem} ja={tq?.stem} lang={shown} />
      </p>
      {peeking && tq && shown === "en" && (
        <button class="btn ghost peek" onClick={() => setOpenedId(q.id)}>
          訳を見る
        </button>
      )}
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
                <span class="otext">
                  <Text en={o.text} ja={tq?.options[orig]} lang={shown} />
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
