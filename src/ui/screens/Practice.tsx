/* 練習。1 問ずつ答えてすぐ解説を見る。答えはその場で記録する（途中でやめても残る）。
   解いている途中の回も記録に残し、同じ絞り込みで開けば続きから（ホームのカードからも。#86）。
   間違えた問題は、その回の最後にもう一度出す（1 回だけ）。
   間違えたときは、押し間違いなら次の問題へ進むまでは答えを取り消せる（記録も答える前に戻す。#44）。
   正解したときは「勘だった」を付けられる。勘の正解は覚えたに数えず、1 日後にもう一度出す（#27） */
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { idsOnly, optionOrder, orderFor, parseIdsOnly, planPractice } from "../../core/engine/practice";
import { seeded } from "../../core/engine/rng";
import type { Exam } from "../../core/exam/types";
import { findTask } from "../../core/exam/types";
import {
  answer,
  clearPractice,
  langOf,
  markGuess,
  practiceOf,
  practiceSizeOf,
  savePractice,
  savedIds,
  toggleSaved,
  undoAnswer,
} from "../../core/store/actions";
import { type ActivePractice, itemKey } from "../../core/store/schema";
import { getData, update, useData } from "../../app/store";
import { LangSwitch } from "../LangSwitch";
import { QuestionCard } from "../QuestionCard";
import { SaveButton } from "../SaveButton";
import { optionIndex, optionKeys, useKeys } from "../keys";
import { type PracticeStart, href } from "../route";

/** 画面で持つ回の状態（記録に残す形から時刻を除いたもの） */
type Session = Omit<ActivePractice, "updatedAt">;

export function onlyLabel(exam: Exam, only?: string): string | undefined {
  if (!only) return undefined;
  if (only === "saved") return "振り返り";
  if (parseIdsOnly(only)) return "解き直し";
  if (/^d\d+$/.test(only)) return exam.domains.find(d => d.id === only)?.ja;
  if (/^s\d+$/.test(only)) return exam.scenarios.find(s => s.id === only)?.ja;
  const t = findTask(exam, only);
  return t ? `${t.id} ${t.ja}` : undefined;
}

/** 1 回分を組む。印を付けた問題（only が "saved"）と名指しの問題（"q:…"）は、回の長さで切らずに全部出す */
function plan(exam: Exam, only: string | undefined, now: number, seed: number): string[] {
  const d = getData();
  const ids = only === "saved" ? savedIds(d, exam.id) : parseIdsOnly(only);
  return planPractice(exam, id => d.items[itemKey(exam.id, id)], now, seeded(seed), {
    size: ids ? ids.length : practiceSizeOf(d, exam.id),
    maxNew: ids ? ids.length : undefined,
    only,
    ids,
  });
}

/** 新しい回を組む（選択肢の並びも決める） */
function freshSession(exam: Exam, only: string | undefined, now: number, seed: number): Session {
  const queue = plan(exam, only, now, seed);
  const rng = seeded(seed + 7);
  const byId = new Map(exam.questions.map(q => [q.id, q]));
  const orders = Object.fromEntries(
    queue.flatMap(id => (byId.has(id) ? [[id, optionOrder(rng, exam, byId.get(id)!)] as const] : [])),
  );
  return { ...(only ? { only } : {}), queue, pos: 0, done: [], requeued: [], orders };
}

/** 記録に残した途中の回のうち、同じ絞り込みのもの */
function resumable(exam: Exam, only: string | undefined): Session | undefined {
  const p = practiceOf(getData(), exam);
  if (!p || (p.only ?? "") !== (only ?? "")) return undefined;
  const { updatedAt: _t, ...s } = p;
  return s;
}

/** 出せる問題が無いとき：理由と、次に行ける先を出す（行き止まりにしない。#49） */
function EmptyPractice({ exam, only }: { exam: Exam; only?: string }) {
  const all = href({ name: "practice", examId: exam.id });
  const reason =
    only === "saved"
      ? "後で振り返る印を付けた問題がありません。練習で答えたあとに「☆ 後で振り返る」を押すと、ここで練習できます。"
      : parseIdsOnly(only)
        ? "解き直す問題が見つかりません（問題が入れ替わった可能性があります）。"
        : only
          ? `「${onlyLabel(exam, only) ?? only}」に当てはまる問題がありません。`
          : "この資格には、まだ問題がありません。";
  return (
    <section class="card stack">
      <p>{reason}</p>
      {exam.questions.length > 0 && (
        <a class="btn primary block" href={all}>
          全部の問題から練習する
        </a>
      )}
      {only && only !== "saved" && !parseIdsOnly(only) && (
        <a class="btn block" href={href({ name: "domains", examId: exam.id })}>
          分野と細目を選び直す
        </a>
      )}
    </section>
  );
}

export function Practice({
  exam,
  only,
  start,
  now,
}: {
  exam: Exam;
  only?: string;
  start?: PracticeStart;
  now: number;
}) {
  const lang = langOf(useData(), exam.id);
  // キー操作（#40）。今の問題に合わせた処理を、描くたびに下で差し替える（結果の画面などでは無し）
  const onKey = useRef<((key: string) => boolean) | undefined>(undefined);
  onKey.current = undefined;
  useKeys(key => onKey.current?.(key));
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [round, setRound] = useState(0);
  // 途中の回（同じ絞り込み）があれば、start に従う。指定が無ければ「続きから／新しく」を選んでもらう（#86）
  const [paused] = useState(() => (start === "new" ? undefined : resumable(exam, only)));
  const [asking, setAsking] = useState(start === undefined && !!paused);
  const [s, setS] = useState<Session>(() => paused ?? freshSession(exam, only, now, seed));
  useEffect(() => {
    if (start === "new") update(d => clearPractice(d, exam.id));
  }, []);
  const { queue, pos, chosen, done, undo } = s;
  const requeued = new Set(s.requeued);
  const guess = !!s.guess;

  /** 回の状態を変え、記録にも残す。1 問も答えていない回は残さない（前の途中の回を消さない）。
      終わった回は消す */
  const commit = (next: Session) => {
    setS(next);
    if (next.pos >= next.queue.length) update(d => clearPractice(d, exam.id));
    else if (next.done.length) update(d => savePractice(d, exam.id, { ...next, updatedAt: Date.now() }));
  };

  const restart = () => {
    setRound(round + 1);
    commit(freshSession(exam, only, Date.now(), seed + round + 1));
  };

  const byId = useMemo(() => new Map(exam.questions.map(q => [q.id, q])), [exam]);
  const back = href(only === "saved" ? { name: "saved", examId: exam.id } : { name: "home", examId: exam.id });
  const label = onlyLabel(exam, only);

  if (!queue.length)
    return (
      <main class="page">
        <a class="btn ghost" href={back}>
          ← {only === "saved" ? "振り返り" : "ホーム"}
        </a>
        <EmptyPractice exam={exam} only={only} />
      </main>
    );

  if (asking && paused) {
    const base = paused.queue.length - paused.requeued.length;
    const answered = new Set(paused.done.map(d => d.id)).size;
    return (
      <main class="page">
        <a class="btn ghost" href={back}>
          ← {only === "saved" ? "振り返り" : "ホーム"}
        </a>
        <section class="card stack practice-choice">
          <h1>練習の途中です</h1>
          <p>
            {label && `${label}・`}
            {Math.min(answered, base)} / {base} 問に回答済み
          </p>
          <button class="btn primary block" onClick={() => setAsking(false)}>
            続きから再開する
          </button>
          <button
            class="btn block"
            onClick={() => {
              update(d => clearPractice(d, exam.id));
              setS(freshSession(exam, only, Date.now(), seed + 1));
              setAsking(false);
            }}
          >
            新しく始める
          </button>
          <p class="muted small">新しく始めると、途中の回は捨てます（答えた問題の記録は残ります）。</p>
        </section>
      </main>
    );
  }

  if (pos >= queue.length) {
    const firstTry = done.filter((d, i) => done.findIndex(x => x.id === d.id) === i);
    const ok = firstTry.filter(d => d.ok && !d.guess).length;
    const guessed = firstTry.filter(d => d.guess).length;
    const missed = firstTry.filter(d => !d.ok || d.guess).map(d => byId.get(d.id)!);
    const missedLabel = guessed ? "間違えた・勘の" : "間違えた";
    return (
      <main class="page">
        <h1>おつかれさまでした</h1>
        <section class="card">
          <p class="big">
            {ok} / {firstTry.length} 問
          </p>
          <p class="muted small">
            {guessed > 0 && `ほかに勘で当たった問題が ${guessed} 問。`}1
            回目の答えで数えています（やり直した問題は数えない）。
          </p>
        </section>
        {missed.length > 0 && (
          <section class="stack">
            <h2>{missedLabel}問題で覚えること</h2>
            {missed.map(q => (
              <div key={q.id} class="card tight">
                <span class="muted small">
                  {q.tasks[0]} {findTask(exam, q.tasks[0])?.ja}
                </span>
                <p>{q.point}</p>
                {exam.lessons?.[q.tasks[0]] && (
                  <a class="tap small learn-link" href={href({ name: "learn", examId: exam.id, taskId: q.tasks[0] })}>
                    教科書で読む（{q.tasks[0]}）→
                  </a>
                )}
              </div>
            ))}
          </section>
        )}
        {missed.length > 0 && (
          <a
            class="btn primary block"
            href={href({ name: "practice", examId: exam.id, only: idsOnly(missed.map(q => q.id)) })}
          >
            {missedLabel} {missed.length} 問をもう一度
          </a>
        )}
        <button class={`btn block ${missed.length ? "" : "primary"}`} onClick={restart}>
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
  // 元の問題数（間違えて回の最後に足した「やり直し」は数えない。#43）
  const base = queue.length - requeued.size;
  const isRetry = pos >= base;
  const retries = queue.length - base;

  /** 答えを見ていない状態の回（選んだ答え・取り消し・勘を外す） */
  const { chosen: _c, undo: _u, guess: _g, ...plain } = s;

  const choose = (orig: number) => {
    if (revealed) return;
    const ok = orig === q.answer;
    const requeue = !ok && !requeued.has(id);
    const at = Date.now();
    const prevStat = getData().items[itemKey(exam.id, id)];
    update(d => answer(d, exam.id, id, ok, at));
    commit({
      ...plain,
      chosen: orig,
      done: [...done, { id, ok }],
      undo: { ...(prevStat ? { prev: prevStat } : {}), requeued: requeue, at },
      ...(requeue ? { queue: [...queue, id], requeued: [...s.requeued, id] } : {}),
    });
  };

  /** 正解に「勘だった」を付ける・外す */
  const toggleGuess = () => {
    if (!undo) return;
    const on = !guess;
    update(d => markGuess(d, exam.id, id, undo.prev, on, Date.now()));
    commit({ ...s, done: [...done.slice(0, -1), { id, ok: true, ...(on ? { guess: true } : {}) }], guess: on });
  };

  /** 答えを取り消して、選び直せるようにする */
  const cancel = () => {
    if (!undo) return;
    update(d => undoAnswer(d, exam.id, id, undo.prev, undo.at, chosen === q.answer));
    const rest = { ...plain, done: done.slice(0, -1) };
    const back = undo.requeued
      ? { ...rest, queue: queue.slice(0, -1), requeued: s.requeued.filter(x => x !== id) }
      : rest;
    // 1 問目を取り消して答えが無くなった回は、記録からも消す（答えていない回は残さない）
    if (!back.done.length) update(d => clearPractice(d, exam.id));
    commit(back);
  };

  const next = () => {
    commit({ ...plain, pos: pos + 1 });
    scrollTo(0, 0);
  };

  const order = orderFor(exam, q, s.orders[id]);
  onKey.current = key => {
    const i = optionIndex(key, exam);
    if (!revealed && i >= 0 && i < order.length) {
      choose(order[i]!);
      return true;
    }
    if (revealed && key === "Enter") {
      next();
      return true;
    }
    if (revealed && (key === "s" || key === "S")) {
      update(d => toggleSaved(d, exam.id, id, Date.now()));
      return true;
    }
    return false;
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
          {isRetry ? `やり直し ${pos - base + 1} / ${retries}` : `${pos + 1} / ${base}`}
          {!isRetry && retries > 0 && `（やり直し +${retries}）`}
        </span>
        <LangSwitch exam={exam} />
      </header>
      <div class="progress" aria-hidden="true">
        <div style={{ width: `${isRetry ? 100 : (pos / base) * 100}%` }} />
      </div>
      <QuestionCard
        exam={exam}
        q={q}
        order={order}
        chosen={chosen}
        reveal={revealed}
        onChoose={choose}
        hintCopy
        scenarioOpen={!prev || prev.scenario !== q.scenario}
        lang={lang}
      />
      <p class="kbd-hint muted small">
        キー：{optionKeys(exam, order.length)}で選ぶ・Enter で次へ・S で振り返りに入れる
      </p>
      {revealed && (
        <div class="sticky-next">
          <div class="verdict">
            <strong class={chosen === q.answer ? "okc" : "ngc"}>{chosen === q.answer ? "正解" : "不正解"}</strong>
            {undo && chosen !== q.answer && (
              <button
                class="btn ghost small undo"
                onClick={cancel}
                title="押し間違えたときに。記録も答える前に戻します"
              >
                ↶ 取り消す
              </button>
            )}
            {undo && chosen === q.answer && (
              <button
                class={`btn ghost small guess ${guess ? "on" : ""}`}
                aria-pressed={guess}
                onClick={toggleGuess}
                title="勘で当たった正解は覚えたに数えず、明日もう一度出します"
              >
                {guess ? "☑ 勘だった" : "☐ 勘だった"}
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
