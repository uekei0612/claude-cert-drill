/* 模擬試験の結果と見直し。分野ごとの正答率、配点で重み付けした正答率と目安線、1 問ずつの見直し */
import { useState } from "preact/hooks";
import { idsOnly, orderFor } from "../../core/engine/practice";
import type { Exam } from "../../core/exam/types";
import { useData } from "../../app/store";
import { Meter, pct } from "../Meter";
import { LangSwitch } from "../LangSwitch";
import { QuestionCard, stemOf } from "../QuestionCard";
import { SaveButton } from "../SaveButton";
import { href } from "../route";

export function MockResult({ exam, at }: { exam: Exam; at: number }) {
  const data = useData();
  const r = data.mocks[exam.id]?.find(x => x.finishedAt === at);
  const [open, setOpen] = useState<string | undefined>();
  // 全問を並べると長いので、まずは間違えた（未回答を含む）問題だけ
  const [onlyWrong, setOnlyWrong] = useState(true);
  const back = href({ name: "mock", examId: exam.id });
  if (!r)
    return (
      <main class="page with-tabs">
        <p>この結果は見つかりません。</p>
        <a class="btn" href={back}>
          模擬試験へ
        </a>
      </main>
    );

  const target = exam.format.target;
  const byId = new Map(exam.questions.map(q => [q.id, q]));
  const ids = (r.questionIds ?? []).filter(id => byId.has(id));
  const wrong = ids.filter(id => r.answers?.[id] !== byId.get(id)!.answer);
  const shown = onlyWrong ? wrong : ids;

  return (
    <main class="page with-tabs">
      <a class="btn ghost" href={back}>
        ← 模擬試験
      </a>
      <h1>模擬試験の結果</h1>
      <section class="card">
        <div class="row between">
          <span>配点で重み付けした正答率</span>
          <span class={`big ${r.weighted >= target ? "okc" : "ngc"}`}>{pct(r.weighted)}</span>
        </div>
        <Meter value={r.weighted} mark={target} label="重み付けした正答率" />
        <p class="small">
          {r.weighted >= target ? "目安に届きました。" : `目安（${pct(target)}）まであと ${pct(target - r.weighted)}。`}
          <span class="muted">
            {" "}
            {r.correct} / {r.total} 問正解・{new Date(r.finishedAt).toLocaleString("ja-JP")}
          </span>
        </p>
        <p class="muted small">
          目安はこのアプリの独自の基準です。本番の合格基準は{exam.format.passing}で、換算式は公開されていません。
        </p>
      </section>
      {wrong.length > 0 && (
        <a class="btn primary block" href={href({ name: "practice", examId: exam.id, only: idsOnly(wrong) })}>
          間違えた（未回答を含む）{wrong.length} 問を練習する
        </a>
      )}

      <section class="stack">
        <h2>分野ごと</h2>
        {exam.domains.map(d => {
          const [c, t] = r.byDomain[d.id] ?? [0, 0];
          if (!t) return null;
          return (
            <a key={d.id} class="card tight" href={href({ name: "practice", examId: exam.id, only: d.id })}>
              <div class="row between">
                <span>
                  <span class="tag">{d.id.toUpperCase()}</span> {d.ja}
                </span>
                <span class={c / t >= target ? "okc" : "ngc"}>
                  {c} / {t}
                </span>
              </div>
              <Meter value={c / t} mark={target} label={`${d.ja}の正答率`} />
            </a>
          );
        })}
      </section>

      {ids.length > 0 && (
        <section class="stack">
          <div class="row between">
            <h2>見直し</h2>
            <LangSwitch exam={exam} />
          </div>
          <label class="check">
            <input type="checkbox" checked={onlyWrong} onChange={e => setOnlyWrong(e.currentTarget.checked)} />
            間違えた問題だけ
          </label>
          {shown.map(id => {
            const q = byId.get(id)!;
            const chosen = r.answers?.[id];
            const ok = chosen === q.answer;
            const i = ids.indexOf(id);
            return (
              <div key={id} class="card tight">
                <button
                  class="review-row"
                  onClick={() => setOpen(open === id ? undefined : id)}
                  aria-expanded={open === id}
                >
                  <span class={ok ? "okc" : "ngc"}>{ok ? "○" : chosen === undefined ? "－" : "×"}</span>
                  <span>
                    {i + 1}. <span class="tag">{q.tasks[0]}</span>
                    <span class="small row-stem" lang={data.settings.lang === "ja" ? "ja" : "en"}>
                      {stemOf(exam, q, data.settings.lang)}
                    </span>
                  </span>
                </button>
                {open === id && (
                  <>
                    <QuestionCard
                      exam={exam}
                      q={q}
                      order={orderFor(q, r.orders?.[id])}
                      chosen={chosen}
                      reveal={true}
                      scenarioOpen={false}
                      lang={data.settings.lang}
                      learnLink
                    />
                    <div class="row end">
                      <SaveButton examId={exam.id} questionId={id} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
