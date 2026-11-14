/* 1 問の表示。シナリオ（畳める）→ 問題文 → 選択肢。
   reveal のときは、選択肢ごとに正誤と解説を出す（誤答の解説がそのまま弱点の地図になる）。
   lang で問題文の言語を選ぶ（訳が無い問題は原文で出す）。peek は原文だけを出し、「訳を見る」を押すか
   答えたら併記に変わる（原文を先に読ませるため。訳を開くのはその問題だけで、次の問題ではまた閉じる）。
   原文の言語は資格が決める（#57。日本語が原文の資格には訳が無いので、いつも原文で出る）。
   答えを見たあとは、問題・選択肢・解説をまとめて Claude に貼れるようにコピーのボタンを出す。
   答える前は、hintCopy のときだけ、問題と選択肢だけ（答え・解説なし）でヒントを頼む文を写すボタンを出す（#36）。
   learnLink のときは、覚えることの下にその細目の教科書の章へのリンクを出す（間違えた直後に読めるように。#26）。
   練習の途中では出さない（章へ移ると練習の残りが消えるため、練習は結果の画面から読む） */
import { useLayoutEffect, useRef, useState } from "preact/hooks";
import { APP } from "../app/config";
import type { Exam, ExamMeta, Question } from "../core/exam/types";
import { domainOf, findTask, optionLetter } from "../core/exam/types";
import type { QuestionLang } from "../core/store/schema";
import { CopyButton } from "./CopyButton";
import { hintText, questionText } from "./copyText";
import { href } from "./route";
import { srcAttrs } from "./src";

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
  /** 答えを見たあとに、教科書の章へのリンクを出すか */
  readonly learnLink?: boolean;
  /** 答える前に、答えを含めない「ヒント用」のコピーを出すか（練習だけ。模擬試験の最中は出さない） */
  readonly hintCopy?: boolean;
}

/** 答えを押したあと、押した選択肢を押す前と同じ画面の位置に戻す。
    答えると各選択肢の下に解説が入り（表示が「訳を見る」なら問題文に訳も入り）、押した選択肢がその分だけ下にずれる。
    iPhone の Safari はこのずれをブラウザが打ち消さないので、描画の前に自分でスクロールして戻す。
    戻した位置で下の「次へ」の帯に隠れるなら、その分だけ上げる */
function keepInPlace(el: HTMLElement, top: number): void {
  const r = el.getBoundingClientRect();
  let dy = r.top - top;
  const bar = document.querySelector(".sticky-next");
  const limit = (bar ? bar.getBoundingClientRect().top : innerHeight) - 8;
  const hidden = r.bottom - dy - limit;
  if (hidden > 0) dy += Math.min(hidden, r.top - dy - 8);
  if (Math.abs(dy) >= 1) scrollBy(0, dy);
}

/** 一覧の行の見出しに使う問題文（言語の設定が「日本語」で訳があれば訳、ほかは原文）。
    「覚えること」は答えそのものなので、一覧では見せない（#47） */
export const stemOf = (exam: Exam, q: Question, lang: QuestionLang): string =>
  (lang === "ja" && exam.translations?.ja?.questions[q.id]?.stem) || q.stem;

/** 一覧の行の見出し（stemOf）の言語 */
export const stemLang = (exam: Exam, lang: QuestionLang): string =>
  lang === "ja" && exam.translations?.ja ? "ja" : srcAttrs(exam).lang;

/** 原文・訳・併記のどれかで文を出す */
function Text({
  exam,
  src,
  ja,
  lang,
}: {
  exam: Pick<ExamMeta, "lang">;
  src: string;
  ja?: string;
  lang: Exclude<QuestionLang, "peek">;
}) {
  if (lang === "ja" && ja) return <span lang="ja">{ja}</span>;
  const original = <span {...srcAttrs(exam)}>{src}</span>;
  if (lang === "both" && ja)
    return (
      <>
        {original}
        <span class="ja-sub" lang="ja">
          {ja}
        </span>
      </>
    );
  return original;
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
  learnLink = false,
  hintCopy = false,
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
  // 押した選択肢と、押したときの画面上の位置（描き直したら 1 回だけ使って捨てる）
  const anchor = useRef<{ orig: number; top: number } | undefined>(undefined);
  const list = useRef<HTMLOListElement>(null);
  useLayoutEffect(() => {
    const a = anchor.current;
    anchor.current = undefined;
    if (!a || !reveal) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-orig="${a.orig}"]`);
    if (el) keepInPlace(el, a.top);
  });
  return (
    <article class="qcard">
      {scenario && (
        <details class="scenario" open={scenarioOpen}>
          <summary>
            <span class="tag">シナリオ {scenario.id.slice(1)}</span> {scenario.ja}
          </summary>
          <p>
            {shown !== "ja" && <strong {...srcAttrs(exam)}>{scenario.title}. </strong>}
            <Text exam={exam} src={scenario.context} ja={ja?.scenarios[scenario.id]} lang={shown} />
          </p>
        </details>
      )}
      <p class="stem">
        <Text exam={exam} src={q.stem} ja={tq?.stem} lang={shown} />
      </p>
      {peeking && tq && shown === "en" && (
        <button class="btn ghost peek" onClick={() => setOpenedId(q.id)}>
          訳を見る
        </button>
      )}
      <ol class="options" role="list" ref={list}>
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
                data-orig={orig}
                onClick={e => {
                  anchor.current = { orig, top: e.currentTarget.getBoundingClientRect().top };
                  onChoose?.(orig);
                }}
              >
                <span class="letter">{optionLetter(i)}</span>
                <span class="otext">
                  <Text exam={exam} src={o.text} ja={tq?.options[orig]} lang={shown} />
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
          {learnLink && task && exam.lessons?.[task.id] && (
            <a class="tap small learn-link" href={href({ name: "learn", examId: exam.id, taskId: task.id })}>
              教科書で読む（{task.id}）→
            </a>
          )}
        </div>
      )}
      {reveal && (
        <div class="row end">
          <CopyButton
            label={`${APP.assistant} に聞く用にコピー`}
            text={() => questionText({ exam, q, order, chosen })}
          />
        </div>
      )}
      {!reveal && hintCopy && (
        <div class="row end">
          <CopyButton cls="hint" label="ヒントを聞く用にコピー（答えなし）" text={() => hintText({ exam, q, order })} />
        </div>
      )}
    </article>
  );
}
