/* 練習。1 問ずつ答えてすぐ解説を見る。答えはその場で記録する（途中でやめても残る）。
   間違えた問題は、その回の最後にもう一度出す（1 回だけ） */
import { useMemo, useState } from "preact/hooks";
import { optionOrder, planPractice } from "../../engine/practice";
import { seeded } from "../../engine/rng";
import type { Exam } from "../../exams/types";
import { findTask } from "../../exams/types";
import { answer } from "../../store/actions";
import { itemKey } from "../../store/schema";
import { getData, update, useData } from "../../store/store";
import { LangSwitch } from "../LangSwitch";
import { QuestionCard } from "../QuestionCard";
import { href } from "../route";

interface Done {
  readonly id: string;
  readonly ok: boolean;
}

function onlyLabel(exam: Exam, only?: string): string | undefined {
  if (!only) return undefined;
  if (/^d\d+$/.test(only)) return exam.domains.find(d => d.id === only)?.ja;
  if (/^s\d+$/.test(only)) return exam.scenarios.find(s => s.id === only)?.ja;
  const t = findTask(exam, only);
  return t ? `${t.id} ${t.ja}` : undefined;
}

export function Practice({ exam, only, now }: { exam: Exam; only?: string; now: number }) {
  const lang = useData().settings.lang;
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [round, setRound] = useState(0);
  const initial = useMemo(() => {
    const d = getData();
    return planPractice(exam, id => d.items[itemKey(exam.id, id)], now, seeded(seed + round), {
      size: d.settings.practiceSize,
      only,
    });
  }, [exam, only, seed, round]);

  const [queue, setQueue] = useState<string[]>(initial);
  const [pos, setPos] = useState(0);
  const [chosen, setChosen] = useState<number | undefined>();
  const [done, setDone] = useState<Done[]>([]);
  const [requeued, setRequeued] = useState<ReadonlySet<string>>(new Set());
  const orders = useMemo(() => {
    const rng = seeded(seed + round + 7);
    return new Map(initial.map(id => [id, optionOrder(rng)]));
  }, [initial]);

  const restart = () => {
    const d = getData();
    const next = planPractice(exam, id => d.items[itemKey(exam.id, id)], Date.now(), seeded(seed + round + 1), {
      size: d.settings.practiceSize,
      only,
    });
    setRound(round + 1);
    setQueue(next);
    setPos(0);
    setChosen(undefined);
    setDone([]);
    setRequeued(new Set());
  };

  const byId = new Map(exam.questions.map(q => [q.id, q]));
  const back = href({ name: "home", examId: exam.id });
  const label = onlyLabel(exam, only);

  if (!queue.length)
    return (
      <main class="page">
        <a class="btn ghost" href={back}>
          ← ホーム
        </a>
        <p>出せる問題がありません。</p>
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
          ホームへ
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
    setChosen(orig);
    setDone([...done, { id, ok }]);
    update(d => answer(d, exam.id, id, ok, Date.now()));
    if (!ok && !requeued.has(id)) {
      setQueue([...queue, id]);
      setRequeued(new Set([...requeued, id]));
    }
  };

  const next = () => {
    setChosen(undefined);
    setPos(pos + 1);
    scrollTo(0, 0);
  };

  return (
    <main class="page drill">
      <header class="row between">
        <a class="btn ghost" href={back}>
          やめる
        </a>
        <span class="muted small">
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
          <p class={chosen === q.answer ? "okc" : "ngc"}>
            <strong>{chosen === q.answer ? "正解" : "不正解"}</strong>
          </p>
          <button class="btn primary" onClick={next}>
            {pos + 1 < queue.length ? "次へ" : "結果を見る"}
          </button>
        </div>
      )}
    </main>
  );
}
