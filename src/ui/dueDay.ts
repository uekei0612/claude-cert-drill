/* 期限の日の言い方（#92）。「あと 1 回」の問題を、いつ解けば「覚えた」に入るかを出すのに使う */
import { DAY, startOfDay } from "../core/engine/schedule";

/** 今日（過ぎた日も含む）・明日 11/24・11/26 */
export function dueDayText(t: number, now: number): string {
  const days = Math.round((startOfDay(t) - startOfDay(now)) / DAY);
  if (days <= 0) return "今日";
  const d = new Date(t);
  const md = `${d.getMonth() + 1}/${d.getDate()}`;
  return days === 1 ? `明日 ${md}` : md;
}
