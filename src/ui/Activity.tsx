/* 続けた日数と、直近 12 週の日ごとの回答のカレンダー（#38）。
   列が週（左が古い）、行が曜日（日〜土）。色の濃さは答えた数（1 色の濃淡。0 は地の色）。
   セルに触れると日付・答えた数・正解の数が出る。読み上げには全体の要約を渡す */
import { dayKey, streak } from "../engine/plan";
import { HelpTip } from "./HelpTip";

const WEEKS = 12;
const LEVELS = [1, 5, 10, 20]; // この数以上で 1〜4 段目
const level = (n: number) => LEVELS.filter(x => n >= x).length;

export function Activity({ days, now }: { days: ReadonlyMap<string, readonly [number, number]>; now: number }) {
  const today = new Date(now);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // 左上＝WEEKS 週前の日曜
  const start = new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - t0.getDay() - (WEEKS - 1) * 7);
  const cells: { key: string; date: Date; n: number; ok: number; future: boolean }[] = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = dayKey(date.getTime());
    const [n, ok] = days.get(key) ?? [0, 0];
    cells.push({ key, date, n, ok, future: date > t0 });
  }
  const shown = cells.filter(c => !c.future);
  const activeDays = shown.filter(c => c.n > 0).length;
  const total = shown.reduce((a, c) => a + c.n, 0);
  const run = streak(new Set([...days].filter(([, [n]]) => n > 0).map(([k]) => k)), now);
  const todayKey = dayKey(now);
  return (
    <section class="card tight activity" aria-labelledby="act-h">
      <div class="row between">
        <h2 id="act-h">
          続けた日数 {run} 日 <HelpTip id="streak" />
        </h2>
        <span class="muted small">今日 {days.get(todayKey)?.[0] ?? 0} 問</span>
      </div>
      <div class="cal" role="img" aria-label={`直近 ${WEEKS} 週で ${activeDays} 日・合計 ${total} 問に答えました`}>
        {cells.map(c => (
          <span
            key={c.key}
            class={`cell l${level(c.n)} ${c.future ? "future" : ""} ${c.key === todayKey ? "today" : ""}`}
            title={c.future ? undefined : `${c.date.getMonth() + 1}/${c.date.getDate()}：${c.n} 問（正解 ${c.ok}）`}
          />
        ))}
      </div>
      <div class="row between muted small">
        <span>
          直近 {WEEKS} 週で {activeDays} 日・{total} 問
        </span>
        <span class="cal-legend" aria-hidden="true">
          少 <span class="cell l0" />
          <span class="cell l1" />
          <span class="cell l2" />
          <span class="cell l3" />
          <span class="cell l4" /> 多
        </span>
      </div>
    </section>
  );
}
