/* 模擬試験。答えは見せずに進み、最後にまとめて採点する。途中の状態は記録に保存し、閉じても続きから。
   時間はこの画面を開いている間だけ進む（閉じる・中断する・アプリを裏に回すと止まる）。
   時間切れになったらその時点で採点する（本番と同じく未回答は誤答） */
import { useEffect, useRef, useState } from "preact/hooks";
import { addUsed, mockLeft, planMock, scoreMock } from "../../engine/mock";
import { optionOrder } from "../../engine/practice";
import { seeded } from "../../engine/rng";
import type { Exam } from "../../exams/types";
import { abandonMock, finishMock, patchMock, startMock } from "../../store/actions";
import { getData, update, useData } from "../../store/store";
import { LangSwitch } from "../LangSwitch";
import { pct } from "../Meter";
import { QuestionCard } from "../QuestionCard";
import { go, href } from "../route";

/** 残り時間の表示（「1:02:03」「12:34」） */
export const fmt = (ms: number) => {
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
      usedMs: 0,
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
  /** 今回この画面を開いた時刻。隠れている間は無し（時間を進めない） */
  const since = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!m || m.examId !== exam.id) return;
    const key = m.startedAt;
    // 開いていた分を記録に足す。別の模擬試験に替わっていたら足さない
    const commit = () => {
      const s = since.current;
      if (s === undefined) return;
      const now = Date.now();
      since.current = now;
      update(d => (d.activeMock?.startedAt === key ? patchMock(d, x => addUsed(x, s, now)) : d));
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        commit();
        since.current = undefined;
      } else if (since.current === undefined) {
        since.current = Date.now();
      }
      setTick(Date.now());
    };
    since.current = document.visibilityState === "hidden" ? undefined : Date.now();
    document.addEventListener("visibilitychange", onVisibility);
    const tickId = setInterval(() => setTick(Date.now()), 1000);
    // アプリが裏で落とされても、使った時間を大きく取りこぼさないように
    const saveId = setInterval(commit, 15_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(tickId);
      clearInterval(saveId);
      commit();
      since.current = undefined;
    };
  }, [m?.startedAt]);

  const left = m ? mockLeft(m, since.current, tick) : 0;
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
      <a
        class="btn ghost"
        href={href({ name: "home", examId: exam.id })}
        title="途中の状態は残ります。時間も止まります"
      >
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
        <h1 class="sr-only">模擬試験の問題の一覧</h1>
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
      <h1 class="sr-only">模擬試験</h1>
      {header}
      <div class="progress" aria-hidden="true">
        <div style={{ width: `${(answered / ids.length) * 100}%` }} />
      </div>
      <div class="row between">
        <span class="muted small">
          {cursor + 1} / {ids.length} 問
        </span>
        <div class="row">
          <LangSwitch exam={exam} />
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
        lang={data.settings.lang}
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

/** 結果の推移（重み付けした正答率）。古い順に左から。点に触れると日時と値が出る。目安の線つき（#34）。
    目安の文字は左端に置く（新しい結果ほど目安に近く、右端の点と重なりやすいため） */
function Trend({ points, target }: { points: readonly { at: number; v: number }[]; target: number }) {
  const W = 300;
  const H = 72;
  const pad = { l: 8, r: 8, t: 8, b: 8 };
  const x = (i: number) => pad.l + (points.length === 1 ? 0 : (i * (W - pad.l - pad.r)) / (points.length - 1));
  const y = (v: number) => pad.t + (1 - Math.max(0, Math.min(1, v))) * (H - pad.t - pad.b);
  const when = (at: number) => new Date(at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
  return (
    <figure class="trend">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`正答率の推移：${points.map(p => `${pct(p.v)}`).join("、")}`}
      >
        <line class="trend-target" x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} />
        <text class="trend-label" x={pad.l} y={y(target) - 4} text-anchor="start">
          目安 {pct(target)}
        </text>
        <polyline class="trend-line" points={points.map((p, i) => `${x(i)},${y(p.v)}`).join(" ")} />
        {points.map((p, i) => (
          <g key={p.at} class="trend-pt">
            {/* 触れる範囲は点より大きく */}
            <circle class="hit" cx={x(i)} cy={y(p.v)} r={12}>
              <title>
                {when(p.at)}：{pct(p.v)}
              </title>
            </circle>
            <circle class="dot" cx={x(i)} cy={y(p.v)} r={4} />
          </g>
        ))}
      </svg>
      <figcaption class="muted small">
        重み付けした正答率の推移（古い順・{points.length} 回）。最新 {pct(points[points.length - 1]!.v)}
      </figcaption>
    </figure>
  );
}

function Intro({ exam, other }: { exam: Exam; other?: string }) {
  const f = exam.format;
  const per = Math.round(f.secondsPerQuestion / 60);
  const history = useData().mocks[exam.id] ?? [];
  // 今回出る問題数と時間（シナリオの組み合わせで少し変わりうるので、決まった種で 1 回組んで示す）
  const sample = planMock(exam, seeded(1));
  const n = sample.questionIds.length;
  const minutes = Math.round(sample.limitMs / 60_000);
  const sameAsReal = f.questions === n && f.minutes === minutes;
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
        <p class="mock-size">
          <strong>
            {n} 問・{minutes} 分
          </strong>
          <span class="muted small">
            {" "}
            （1 問 {per} 分。
            {sameAsReal
              ? "本番と同じ"
              : `本番は ${f.questions ?? "?"} 問・${f.minutes ?? "?"} 分。手元の問題で組むので本番より少なめ`}
            ）
          </span>
        </p>
        <p class="muted small">
          途中で閉じても続きからできます。時間はこの画面を開いている間だけ進み、中断したりアプリを閉じたりすると止まります。
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
          {history.length >= 2 && (
            <Trend points={[...history].reverse().map(h => ({ at: h.finishedAt, v: h.weighted }))} target={f.target} />
          )}
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
