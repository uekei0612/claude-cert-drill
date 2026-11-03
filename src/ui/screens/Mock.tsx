/* 模擬試験。答えは見せずに進み、最後にまとめて採点する。途中の状態は記録に保存し、閉じても続きから。
   時間切れになったらその時点で採点する（本番と同じく未回答は誤答） */
import { useEffect, useState } from "preact/hooks";
import { planMock, scoreMock } from "../../engine/mock";
import { optionOrder } from "../../engine/practice";
import { seeded } from "../../engine/rng";
import type { Exam } from "../../exams/types";
import { abandonMock, finishMock, patchMock, startMock } from "../../store/actions";
import { getData, update, useData } from "../../store/store";
import { QuestionCard } from "../QuestionCard";
import { go, href } from "../route";

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};

function submit(exam: Exam): void {
  const d = getData();
  const m = d.activeMock;
  if (!m || m.examId !== exam.id) return;
  const now = Date.now();
  update(x => finishMock(x, scoreMock(exam, m.questionIds, m.answers), now));
  go({ name: "mock-result", examId: exam.id, at: now });
}

function begin(exam: Exam): void {
  const rng = seeded(Math.floor(Math.random() * 2 ** 31));
  const p = planMock(exam, rng);
  const orders = Object.fromEntries(p.questionIds.map(id => [id, optionOrder(rng)]));
  update(d =>
    startMock(d, {
      examId: exam.id,
      questionIds: p.questionIds,
      scenarioIds: p.scenarioIds,
      startedAt: Date.now(),
      limitMs: p.limitMs,
      answers: {},
      flags: [],
      orders,
      cursor: 0,
    }),
  );
}

export function Mock({ exam }: { exam: Exam }) {
  const data = useData();
  const m = data.activeMock;
  const [list, setList] = useState(false);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    if (!m || m.examId !== exam.id) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [m?.startedAt]);

  const left = m ? m.startedAt + m.limitMs - tick : 0;
  useEffect(() => {
    if (m && m.examId === exam.id && left <= 0) submit(exam);
  }, [left <= 0]);

  if (!m || m.examId !== exam.id) return <Intro exam={exam} other={m ? m.examId : undefined} />;

  const byId = new Map(exam.questions.map(q => [q.id, q]));
  const ids = m.questionIds.filter(id => byId.has(id));
  const answered = ids.filter(id => m.answers[id] !== undefined).length;
  const cursor = Math.min(m.cursor, ids.length - 1);
  const id = ids[cursor]!;
  const q = byId.get(id)!;
  const prev = cursor > 0 ? byId.get(ids[cursor - 1]!) : undefined;
  const flagged = m.flags.includes(id);
  const setCursor = (c: number) => {
    update(d => patchMock(d, x => ({ ...x, cursor: c })));
    setList(false);
    scrollTo(0, 0);
  };
  const confirmSubmit = () => {
    const rest = ids.length - answered;
    if (confirm(rest ? `未回答が ${rest} 問あります（誤答として数えます）。提出しますか？` : "提出して採点しますか？"))
      submit(exam);
  };

  const header = (
    <header class="mock-head">
      <a class="btn ghost" href={href({ name: "home", examId: exam.id })} title="途中の状態は残ります">
        中断
      </a>
      <span class={`timer ${left < 5 * 60 * 1000 ? "ngc" : ""}`} aria-label="残り時間">
        {fmt(left)}
      </span>
      <button class="btn ghost" onClick={() => setList(!list)}>
        {list ? "問題へ" : `一覧 ${answered}/${ids.length}`}
      </button>
    </header>
  );

  if (list)
    return (
      <main class="page drill">
        {header}
        <p class="muted small">番号を押すとその問題へ。旗は見直したい問題の印です。</p>
        <div class="qgrid">
          {ids.map((x, i) => (
            <button
              key={x}
              class={`qnum ${m.answers[x] !== undefined ? "done" : ""} ${m.flags.includes(x) ? "flag" : ""} ${i === cursor ? "here" : ""}`}
              onClick={() => setCursor(i)}
              aria-label={`${i + 1} 問目${m.answers[x] !== undefined ? "・回答済み" : ""}${m.flags.includes(x) ? "・旗" : ""}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button class="btn primary block" onClick={confirmSubmit}>
          提出して採点する
        </button>
        <button
          class="btn ghost block"
          onClick={() => {
            if (confirm("この模擬試験をやめて、記録を残さずに消しますか？")) {
              update(abandonMock);
              go({ name: "home", examId: exam.id });
            }
          }}
        >
          記録を残さずにやめる
        </button>
      </main>
    );

  return (
    <main class="page drill">
      {header}
      <div class="progress" aria-hidden="true">
        <div style={{ width: `${(answered / ids.length) * 100}%` }} />
      </div>
      <div class="row between">
        <span class="muted small">
          {cursor + 1} / {ids.length} 問
        </span>
        <button
          class={`btn ghost small ${flagged ? "flag-on" : ""}`}
          aria-pressed={flagged}
          onClick={() =>
            update(d =>
              patchMock(d, x => ({ ...x, flags: flagged ? x.flags.filter(f => f !== id) : [...x.flags, id] })),
            )
          }
        >
          {flagged ? "⚑ 旗を外す" : "⚐ 旗を立てる"}
        </button>
      </div>
      <QuestionCard
        key={id}
        exam={exam}
        q={q}
        order={m.orders[id] ?? [0, 1, 2, 3]}
        chosen={m.answers[id]}
        reveal={false}
        onChoose={orig => update(d => patchMock(d, x => ({ ...x, answers: { ...x.answers, [id]: orig } })))}
        scenarioOpen={!prev || prev.scenario !== q.scenario}
      />
      <div class="sticky-next">
        <button class="btn" disabled={cursor === 0} onClick={() => setCursor(cursor - 1)}>
          ← 前へ
        </button>
        {cursor + 1 < ids.length ? (
          <button class="btn primary" onClick={() => setCursor(cursor + 1)}>
            次へ →
          </button>
        ) : (
          <button class="btn primary" onClick={() => setList(true)}>
            一覧と提出
          </button>
        )}
      </div>
    </main>
  );
}

function Intro({ exam, other }: { exam: Exam; other?: string }) {
  const f = exam.format;
  const per = Math.round(f.secondsPerQuestion / 60);
  const history = useData().mocks[exam.id] ?? [];
  return (
    <main class="page with-tabs">
      <h1>模擬試験</h1>
      <section class="card">
        <p>
          {f.scenariosPerExam
            ? `本番と同じく、${exam.scenarios.length} 個のシナリオから ${f.scenariosPerExam} 個をランダムに選んで出します。`
            : "分野の配点に合わせて問題を選びます。"}
          答えは最後にまとめて採点します（未回答は誤答）。
        </p>
        <p class="muted small">
          制限時間は 1 問 {per} 分。本番は {f.questions ?? "?"} 問・{f.minutes ?? "?"}{" "}
          分ですが、このアプリでは手元の問題で組むので、 問題数は少なめです。途中で閉じても続きからできます。
        </p>
        {other && <p class="ngc small">別の資格（{other}）の模擬試験が途中です。始めるとそちらは消えます。</p>}
        <button
          class="btn primary block"
          onClick={() => {
            if (!other || confirm("途中の模擬試験を消して始めますか？")) begin(exam);
          }}
        >
          始める
        </button>
      </section>
      {history.length > 0 && (
        <section class="stack">
          <h2>これまでの結果</h2>
          {history.map(h => (
            <a
              key={h.finishedAt}
              class="card tight"
              href={href({ name: "mock-result", examId: exam.id, at: h.finishedAt })}
            >
              <div class="row between">
                <span>
                  {new Date(h.finishedAt).toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span class={h.weighted >= f.target ? "okc" : "ngc"}>{Math.round(h.weighted * 100)}%</span>
              </div>
              <span class="muted small">
                {h.correct} / {h.total} 問正解
              </span>
            </a>
          ))}
        </section>
      )}
    </main>
  );
}
