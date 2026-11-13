/* 試験日からの逆算（#37）。残りの未解答の問題と未読の章を、試験の前日までの日数で割って 1 日の目安にする。
   試験日の当日は数えない（前日までに終える）。日付は端末の暦（ローカルの 0 時）で数える */
import { DAY } from "./schedule";

/** "YYYY-MM-DD" をその日のローカルの 0 時にする。形が違えば無し */
export function parseDate(s: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // 2 月 30 日のような日付は捨てる
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3]))
    return undefined;
  return d.getTime();
}

const startOfDay = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/** 試験日まであと何日か（今日が試験日なら 0、過ぎていれば負） */
export const daysUntil = (examDate: number, now: number): number => Math.round((examDate - startOfDay(now)) / DAY);

export interface DailyPlan {
  /** 試験日まであと何日（今日が試験日なら 0） */
  readonly daysLeft: number;
  /** 今日解く新しい問題の数 */
  readonly newToday: number;
  /** 今日読む章の数 */
  readonly chaptersToday: number;
}

/** 1 日の目安。試験日を過ぎていたら無し。今日が試験日なら、新しい問題と章は 0（復習だけ） */
export function dailyPlan(examDate: number, now: number, unseen: number, unread: number): DailyPlan | undefined {
  const daysLeft = daysUntil(examDate, now);
  if (daysLeft < 0) return undefined;
  if (daysLeft === 0) return { daysLeft, newToday: 0, chaptersToday: 0 };
  return { daysLeft, newToday: Math.ceil(unseen / daysLeft), chaptersToday: Math.ceil(unread / daysLeft) };
}

/** その時刻のローカルの日付（"YYYY-MM-DD"）。日ごとの記録のキーに使う（#38） */
export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 続けた日数：今日（今日まだ答えていなければ昨日）からさかのぼって、答えた日が続いている日数 */
export function streak(active: ReadonlySet<string>, now: number): number {
  const day = new Date(now);
  let t = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  if (!active.has(dayKey(t.getTime()))) t = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
  let n = 0;
  while (active.has(dayKey(t.getTime()))) {
    n++;
    t = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
  }
  return n;
}
