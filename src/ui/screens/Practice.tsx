/* 練習。1 問ずつ答えてすぐ解説を見る。答えはその場で記録する（途中でやめても残る）。
   解いている途中の回も記録に残し、同じ絞り込みで開けば続きから（ホームのカードからも。#86）。
   間違えた問題は、その回の最後にもう一度出す（1 回だけ）。
   間違えたときは、押し間違いなら次の問題へ進むまでは答えを取り消せる（記録も答える前に戻す。#44）。
   正解したときは「勘だった」を付けられる。勘の正解は覚えたに数えず、1 日後にもう一度出す（#27）。
   回の終わりには、解いた問題の一覧を出す（#103） */
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  HARD_ONLY,
  NEW_ONLY,
  idsOnly,
  optionOrder,
  orderFor,
  parseIdsOnly,
  planPractice,
} from "../../core/engine/practice";
import { seeded } from "../../core/engine/rng";
import { type ItemStat, dueOf, isKnown, isLearning } from "../../core/engine/schedule";
import type { Exam } from "../../core/exam/types";
import { findTask } from "../../core/exam/types";
import {
  answer,
  clearPractice,
  langOf,
  markGuess,
  noteIds,
  practiceOf,
  practiceSizeOf,
  savePractice,
  savedIds,
  weakIds,
  toggleSaved,
  undoAnswer,
} from "../../core/store/actions";
import { type ActivePractice, itemKey } from "../../core/store/schema";
import { getData, update, useData } from "../../app/store";
import { LangSwitch } from "../LangSwitch";
import { dueDayText } from "../dueDay";
import { QuestionCard } from "../QuestionCard";
import { SaveButton } from "../SaveButton";
import { SolvedList } from "../SolvedList";
import { optionIndex, optionKeys, useKeys } from "../keys";
import { type PracticeStart, type Route, href, routeLabel } from "../route";

/** 画面で持つ回の状態（記録に残す形から時刻を除いたもの） */
type Session = Omit<ActivePractice, "updatedAt">;

export function onlyLabel(exam: Exam, only?: string): string | undefined {
  if (!only) return undefined;
  if (only === "saved") return "振り返り";
  if (only === "weak") return "苦手";
  if (only === "notes") return "メモ";
  if (only === NEW_ONLY) return "新しい問題";
  if (only === HARD_ONLY) return "難しい問題";
  if (parseIdsOnly(only)) return "解き直し";
  if (/^d\d+$/.test(only)) return exam.domains.find(d => d.id === only)?.ja;
  if (/^s\d+$/.test(only)) return exam.scenarios.find(s => s.id === only)?.ja;
  const t = findTask(exam, only);
  return t ? `${t.id} ${t.ja}` : undefined;
}

/** 振り返りの画面から始める絞り込み（印を付けた問題・苦手な問題・メモのある問題）。やめると振り返りへ戻る */
const fromReview = (only?: string): boolean => only === "saved" || only === "weak" || only === "notes";

/** 振り返りの画面の、その絞り込みの一覧 */
const reviewRoute = (examId: string, only?: string): Route =>
  only === "weak" || only === "notes" ? { name: "saved", examId, view: only } : { name: "saved", examId };

/** 1 回分を組む。印を付けた問題（only が "saved"）・苦手な問題（"weak"。#87）・メモのある問題（"notes"。#88）・
    名指しの問題（"q:…"）は、
    回の長さで切らずに全部出す。
    新しい問題（"new"。#104）は、まだ解いていない問題だけから回の長さの分を選ぶ（復習が溜まっても新しい問題に進めるように） */
function plan(exam: Exam, only: string | undefined, now: number, seed: number): string[] {
  const d = getData();
  if (only === NEW_ONLY) {
    const size = practiceSizeOf(d, exam.id);
    const ids = exam.questions.filter(q => !d.items[itemKey(exam.id, q.id)]).map(q => q.id);
    return planPractice(exam, id => d.items[itemKey(exam.id, id)], now, seeded(seed), { size, maxNew: size, ids });
  }
  const ids =
    only === "saved"
      ? savedIds(d, exam.id)
      : only === "weak"
        ? weakIds(d, exam)
        : only === "notes"
          ? noteIds(d, exam.id).filter(id => exam.questions.some(q => q.id === id))
          : parseIdsOnly(only);
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

/** 正解したあとの、覚えたへの進み具合（#92）。同じ日に何度正解しても「覚えた」に進まないので、
    この正解で何が変わったか・いつ解けば覚えたに入るかを出す（出さないと、解き直しても何も起きないように見える） */
function KnownNote({ s, prev }: { s?: ItemStat; prev?: ItemStat }) {
  if (!s) return null;
  const now = Date.now();
  if (isKnown(s, now))
    return (
      <p class="small known-note okc">
        {isKnown(prev, now) ? "覚えた問題です。" : "✓「覚えた」に入りました。"}次の復習は {dueDayText(dueOf(s), now)}。
      </p>
    );
  if (!isLearning(s, now)) return null;
  return (
    <p class="small known-note">
      あと 1 回：{dueDayText(dueOf(s), now)} 以降にもう一度正解すると「覚えた」に入ります（同じ日の正解は数えません）
    </p>
  );
}

/** 出せる問題が無いとき：理由と、次に行ける先を出す（行き止まりにしない。#49） */
function EmptyPractice({ exam, only }: { exam: Exam; only?: string }) {
  const all = href({ name: "practice", examId: exam.id });
  const reason =
    only === "saved"
      ? "後で振り返る印を付けた問題がありません。練習で答えたあとに「☆ 後で振り返る」を押すと、ここで練習できます。"
      : only === "weak"
        ? "苦手な問題はありません。一度覚えた問題を 2 回以上間違えると、ここで練習できます。"
        : only === "notes"
          ? "メモを書いた問題がありません。答えたあとの「✎ メモを書く」で書いた問題を、ここで練習できます。"
          : only === NEW_ONLY
            ? "まだ解いていない問題はありません。全部の問題を一度は解きました。復習の溜まった問題から練習しましょう。"
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
      {only && only !== NEW_ONLY && only !== HARD_ONLY && !fromReview(only) && !parseIdsOnly(only) && (
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
  back: from,
  now,
}: {
  exam: Exam;
  only?: string;
  start?: PracticeStart;
  /** 来た画面（やめる・終えたときの戻り先。無ければホームか振り返り。#91） */
  back?: Route;
  now: number;
}) {
  const data = useData();
  const lang = langOf(data, exam.id);
  const statOf = (id: string) => data.items[itemKey(exam.id, id)];
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
  const backRoute: Route = from ?? (fromReview(only) ? reviewRoute(exam.id, only) : { name: "home", examId: exam.id });
  const back = href(backRoute);
  const backLabel = routeLabel(backRoute);
  const label = onlyLabel(exam, only);

  if (!queue.length)
    return (
      <main class="page">
        <a class="btn ghost" href={back}>
          ← {backLabel}
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
          ← {backLabel}
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
    // この回に出た問題の今の状態（#92）。同じ日の正解では「覚えた」に進まないので、次にいつ解けばよいかを出す
    const ids = [...new Set(done.map(d => d.id))];
    const knownNow = ids.filter(id => isKnown(statOf(id), Date.now())).length;
    const learningDues = ids
      .map(statOf)
      .filter(s => isLearning(s, Date.now()))
      .map(s => dueOf(s!));
    const nextDue = learningDues.length ? Math.min(...learningDues) : undefined;
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
          <p class="small known-summary">
            この回の {ids.length} 問のうち、覚えた {knownNow} 問
            {nextDue !== undefined &&
              `・あと 1 回 ${learningDues.length} 問（${dueDayText(nextDue, Date.now())}から、もう一度正解すると覚えたに入ります）`}
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
                  <a
                    class="tap small learn-link"
                    href={href({ name: "learn", examId: exam.id, taskId: q.tasks[0], back: backRoute })}
                  >
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
            href={href({ name: "practice", examId: exam.id, only: idsOnly(missed.map(q => q.id)), back: from })}
          >
            {missedLabel} {missed.length} 問をもう一度
          </a>
        )}
        <button class={`btn block ${missed.length ? "" : "primary"}`} onClick={restart}>
          続けてもう 1 回
        </button>
        <a class="btn block" href={back}>
          {backLabel}へ
        </a>
        {/* この回で解いた問題（#103）。1 回目の答えで印を付け、押すと問題・自分の答え・解説を開く。
            章へのリンクは出さない（章から戻るとこの画面は残っていない。章は上の「覚えること」から） */}
        <section class="stack">
          <h2>解いた問題</h2>
          <SolvedList
            exam={exam}
            items={firstTry.map((d, i) => ({
              id: d.id,
              no: i + 1,
              result: d.guess ? "guess" : d.ok ? "ok" : "ng",
              ...(d.chosen !== undefined ? { chosen: d.chosen } : {}),
              order: orderFor(exam, byId.get(d.id)!, s.orders[d.id]),
            }))}
          />
        </section>
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
      done: [...done, { id, ok, chosen: orig }],
      undo: { ...(prevStat ? { prev: prevStat } : {}), requeued: requeue, at },
      ...(requeue ? { queue: [...queue, id], requeued: [...s.requeued, id] } : {}),
    });
  };

  /** 正解に「勘だった」を付ける・外す */
  const toggleGuess = () => {
    if (!undo) return;
    const on = !guess;
    update(d => markGuess(d, exam.id, id, undo.prev, on, Date.now()));
    commit({
      ...s,
      done: [
        ...done.slice(0, -1),
        { id, ok: true, ...(on ? { guess: true } : {}), ...(chosen !== undefined ? { chosen } : {}) },
      ],
      guess: on,
    });
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
        {/* 名前は 1 行に収めて長ければ省略し、問題の位置は折り返さない（#95） */}
        <span class="muted small head-label" title={label}>
          {label && <span class="head-name">{label}・</span>}
          <span class="head-pos">
            {isRetry ? `やり直し ${pos - base + 1} / ${retries}` : `${pos + 1} / ${base}`}
            {!isRetry && retries > 0 && `（やり直し +${retries}）`}
          </span>
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
        learnLink
        // 章から戻ったら、この回の続き（同じ問題の解説）から。やめる・終えたときの戻り先も持っていく（#102）
        learnBack={{
          name: "practice",
          examId: exam.id,
          ...(only ? { only } : {}),
          start: "resume",
          ...(from ? { back: from } : {}),
        }}
        scenarioOpen={!prev || prev.scenario !== q.scenario}
        lang={lang}
      />
      <p class="kbd-hint muted small">
        キー：{optionKeys(exam, order.length)}で選ぶ・Enter で次へ・S で振り返りに入れる
      </p>
      {revealed && (
        <div class="sticky-next stacked">
          {/* 正解したあとの、覚えたへの進み具合。画面の下の帯に出して、スクロールしなくても見えるようにする（#92） */}
          {chosen === q.answer && !guess && <KnownNote s={statOf(id)} prev={undo?.prev} />}
          <div class="sticky-row">
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
        </div>
      )}
    </main>
  );
}
