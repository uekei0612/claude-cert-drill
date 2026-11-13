/* 練習。1 問ずつ答えてすぐ解説を見る。答えはその場で記録する（途中でやめても残る）。
   間違えた問題は、その回の最後にもう一度出す（1 回だけ）。
   押し間違えたときのために、次の問題へ進むまでは答えを取り消せる（記録も答える前に戻す。#44） */
import { useMemo, useState } from "preact/hooks";
import { optionOrder, planPractice } from "../../engine/practice";
import { seeded } from "../../engine/rng";
import type { Exam } from "../../exams/types";
import { findTask } from "../../exams/types";
import type { ItemStat } from "../../engine/schedule";
import { answer, restoreItem, savedIds } from "../../store/actions";
import { itemKey } from "../../store/schema";
import { getData, update, useData } from "../../store/store";
import { LangSwitch } from "../LangSwitch";
import { QuestionCard } from "../QuestionCard";
import { SaveButton } from "../SaveButton";
import { href } from "../route";

interface Done {
  readonly id: string;
  readonly ok: boolean;
}

/** 取り消すときに戻す先：答える前の記録と、この答えでやり直しに足したかどうか */
interface Undo {
  readonly prev: ItemStat | undefined;
  readonly requeued: boolean;
}

function onlyLabel(exam: Exam, only?: string): string | undefined {
  if (!only) return undefined;
  if (only === "saved") return "振り返り";
  if (/^d\d+$/.test(only)) return exam.domains.find(d => d.id === only)?.ja;
  if (/^s\d+$/.test(only)) return exam.scenarios.find(s => s.id === only)?.ja;
  const t = findTask(exam, only);
  return t ? `${t.id} ${t.ja}` : undefined;
}

/** 1 回分を組む。印を付けた問題（only が "saved"）は、回の長さで切らずに全部出す */
function plan(exam: Exam, only: string | undefined, now: number, seed: number): string[] {
  const d = getData();
  const ids = only === "saved" ? savedIds(d, exam.id) : undefined;
  return planPractice(exam, id => d.items[itemKey(exam.id, id)], now, seeded(seed), {
    size: ids ? ids.length : d.settings.practiceSize,
    maxNew: ids ? ids.length : undefined,
    only,
    ids,
  });
}

export function Practice({ exam, only, now }: { exam: Exam; only?: string; now: number }) {
  const lang = useData().settings.lang;
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [round, setRound] = useState(0);
  const initial = useMemo(() => plan(exam, only, now, seed + round), [exam, only, seed, round]);

  const [queue, setQueue] = useState<string[]>(initial);
  const [pos, setPos] = useState(0);
  const [chosen, setChosen] = useState<number | undefined>();
  const [done, setDone] = useState<Done[]>([]);
  const [requeued, setRequeued] = useState<ReadonlySet<string>>(new Set());
  const [undo, setUndo] = useState<Undo | undefined>();
  const orders = useMemo(() => {
    const rng = seeded(seed + round + 7);
    return new Map(initial.map(id => [id, optionOrder(rng)]));
  }, [initial]);

  const restart = () => {
    const next = plan(exam, only, Date.now(), seed + round + 1);
    setRound(round + 1);
    setQueue(next);
    setPos(0);
    setChosen(undefined);
    setUndo(undefined);
    setDone([]);
    setRequeued(new Set());
  };

  const byId = new Map(exam.questions.map(q => [q.id, q]));
  const back = href(only === "saved" ? { name: "saved", examId: exam.id } : { name: "home", examId: exam.id });
  const label = onlyLabel(exam, only);

  if (!queue.length)
    return (
      <main class="page">
        <a class="btn ghost" href={back}>
          ← 戻る
        </a>
        <p>{only === "saved" ? "印を付けた問題がありません。" : "出せる問題がありません。"}</p>
      </main>
    );

  if (pos >= queue.length) {
    const firstTry = done.filter((d, i) => done.findIndex(x => x.id === d.id) === i);
    const ok = firstTry.filter(d => d.ok).length;
    const missed = firstTry.filter(d => !d.ok).map(d => byId.get(d.id)!);
    return (
      <main class="page">
        <h1>おつかれさまでした</h1>
        <section class="card">
          <p class="big">
            {ok} / {firstTry.length} 問
          </p>
          <p class="muted small">1 回目の答えで数えています（やり直した問題は数えない）。</p>
        </section>
        {missed.length > 0 && (
          <section class="stack">
            <h2>間違えた問題で覚えること</h2>
            {missed.map(q => (
              <div key={q.id} class="card tight">
                <span class="muted small">
                  {q.tasks[0]} {findTask(exam, q.tasks[0])?.ja}
                </span>
                <p>{q.point}</p>
              </div>
            ))}
          </section>
        )}
        <button class="btn primary block" onClick={restart}>
          続けてもう 1 回
        </button>
        <a class="btn block" href={back}>
          {only === "saved" ? "振り返りへ" : "ホームへ"}
        </a>
      </main>
    );
  }

  const id = queue[pos]!;
  const q = byId.get(id)!;
  const prev = pos > 0 ? byId.get(queue[pos - 1]!) : undefined;
  const revealed = chosen !== undefined;
  const isRetry = queue.indexOf(id) !== pos;

  const choose = (orig: number) => {
    if (revealed) return;
    const ok = orig === q.answer;
    const requeue = !ok && !requeued.has(id);
    setChosen(orig);
    setDone([...done, { id, ok }]);
    setUndo({ prev: getData().items[itemKey(exam.id, id)], requeued: requeue });
    update(d => answer(d, exam.id, id, ok, Date.now()));
    if (requeue) {
      setQueue([...queue, id]);
      setRequeued(new Set([...requeued, id]));
    }
  };

  /** 答えを取り消して、選び直せるようにする */
  const cancel = () => {
    if (!undo) return;
    update(d => restoreItem(d, exam.id, id, undo.prev));
    setDone(done.slice(0, -1));
    if (undo.requeued) {
      setQueue(queue.slice(0, -1));
      setRequeued(new Set([...requeued].filter(x => x !== id)));
    }
    setUndo(undefined);
    setChosen(undefined);
  };

  const next = () => {
    setChosen(undefined);
    setUndo(undefined);
    setPos(pos + 1);
    scrollTo(0, 0);
  };

  return (
    <main class="page drill">
      <h1 class="sr-only">練習</h1>
      <header class="row between drill-head">
        <a class="btn ghost" href={back}>
          やめる
        </a>
        <span class="muted small head-label">
          {label && `${label}・`}
          {pos + 1} / {queue.length}
          {isRetry && "（やり直し）"}
        </span>
      </header>
      <LangSwitch exam={exam} />
      <div class="progress" aria-hidden="true">
        <div style={{ width: `${(pos / queue.length) * 100}%` }} />
      </div>
      <QuestionCard
        exam={exam}
        q={q}
        order={orders.get(id) ?? [0, 1, 2, 3]}
        chosen={chosen}
        reveal={revealed}
        onChoose={choose}
        scenarioOpen={!prev || prev.scenario !== q.scenario}
        lang={lang}
      />
      {revealed && (
        <div class="sticky-next">
          <div class="verdict">
            <strong class={chosen === q.answer ? "okc" : "ngc"}>{chosen === q.answer ? "正解" : "不正解"}</strong>
            {undo && (
              <button
                class="btn ghost small undo"
                onClick={cancel}
                title="押し間違えたときに。記録も答える前に戻します"
              >
                ↶ 取り消す
              </button>
            )}
          </div>
          <SaveButton examId={exam.id} questionId={id} />
          <button class="btn primary" onClick={next}>
            {pos + 1 < queue.length ? "次へ" : "結果を見る"}
          </button>
        </div>
      )}
    </main>
  );
}
