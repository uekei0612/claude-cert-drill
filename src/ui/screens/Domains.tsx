/* 分野 → 細目の一覧（習熟度）と、この試験について（出どころ・範囲外） */
import { useEffect } from "preact/hooks";
import { questionsOfTask, ratio, tally } from "../../core/engine/progress";
import type { Exam } from "../../core/exam/types";
import { itemKey } from "../../core/store/schema";
import { useData } from "../../app/store";
import { Meter, pct } from "../Meter";
import { href } from "../route";
import { showOfficial, srcAttrs } from "../src";

export function Domains({ exam, domainId, now }: { exam: Exam; domainId?: string; now: number }) {
  const data = useData();
  // ホームの分野カードから来たら、その分野の位置から見せる（画面を移ったときの先頭へのスクロールの後に）
  useEffect(() => {
    if (!domainId) return;
    const id = requestAnimationFrame(() => document.getElementById(`domain-${domainId}`)?.scrollIntoView());
    return () => cancelAnimationFrame(id);
  }, [domainId]);
  const statOf = (id: string) => data.items[itemKey(exam.id, id)];
  return (
    <main class="page with-tabs">
      <h1>分野と細目</h1>
      <p class="muted small">細目を押すと、要点とその細目だけの練習へ。</p>
      {exam.domains.map(d => (
        <section key={d.id} id={`domain-${d.id}`} class="stack domain-sec">
          <div class="row between">
            <h2>
              <span class="tag">{d.id.toUpperCase()}</span> {d.ja}
            </h2>
            <span class="muted small">配点 {pct(d.weight)}</span>
          </div>
          {showOfficial(d) && <p {...srcAttrs(exam, "muted small")}>{d.title}</p>}
          {d.tasks.map(t => {
            const tl = tally(questionsOfTask(exam, t.id), statOf, now);
            return (
              <a key={t.id} class="card tight" href={href({ name: "task", examId: exam.id, taskId: t.id })}>
                <div class="row between">
                  <span>
                    <span class="tag">{t.id}</span> {t.ja}
                  </span>
                  <span class="muted small">
                    {tl.known}/{tl.total}
                  </span>
                </div>
                <Meter value={ratio(tl)} label={`${t.ja}の習熟`} />
              </a>
            );
          })}
        </section>
      ))}

      <section class="card" aria-labelledby="about-h">
        <h2 id="about-h">この試験について</h2>
        <p class="small">{exam.summary}</p>
        <dl class="facts small">
          {exam.format.questions !== undefined && (
            <>
              <dt>本番</dt>
              <dd>
                {exam.format.questions} 問・{exam.format.minutes} 分・4 択
              </dd>
            </>
          )}
          <dt>合格</dt>
          <dd>{exam.format.passing}</dd>
          {exam.scenarios.length > 0 && (
            <>
              <dt>シナリオ</dt>
              <dd>
                {exam.scenarios.length} 個から {exam.format.scenariosPerExam} 個が出る
              </dd>
            </>
          )}
        </dl>
        <h3>出どころ</h3>
        <ul class="small">
          {exam.sources.map(s => (
            <li key={s.label}>
              <strong>{s.label}</strong>：{s.note}
            </li>
          ))}
        </ul>
      </section>

      <section class="card" aria-labelledby="oos-h">
        <h2 id="oos-h">出題範囲外</h2>
        <ul class="small">
          {exam.outOfScope.map(x => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
