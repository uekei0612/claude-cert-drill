/* 問題ごとの間隔反復（簡易 SM-2）。時刻は引数で受け取り、テストで差し替える。
   判断問題は一度正解しても理由を忘れやすいので、最初の間隔は短め（1 日 → 3 日 → 以降は ease 倍） */

export interface ItemStat {
  /** 間隔の伸び率 */
  readonly ease: number;
  /** 次に出すまでの日数（0 = 直近の回答が誤答、または未習得） */
  readonly interval: number;
  /** 次に出す時刻（ms） */
  readonly due: number;
  readonly tries: number;
  readonly correct: number;
  /** 最後に答えた時刻（ms） */
  readonly last: number;
}

export const DAY = 24 * 60 * 60 * 1000;
export const START_EASE = 2.3;
export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;
export const MAX_INTERVAL = 90;
/** 間違えた問題は 10 分後に期限が来る */
export const RETRY_MS = 10 * 60 * 1000;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** 1 回答えたあとの記録。正解なら間隔を延ばし、誤答なら 0 に戻す。
    期限前の正解（同じ回での 2 回目や先取り）では間隔を延ばさない */
export function review(prev: ItemStat | undefined, ok: boolean, now: number): ItemStat {
  const s = prev ?? { ease: START_EASE, interval: 0, due: now, tries: 0, correct: 0, last: now };
  const tries = s.tries + 1;
  if (!ok)
    return {
      ease: clamp(s.ease - 0.2, MIN_EASE, MAX_EASE),
      interval: 0,
      due: now + RETRY_MS,
      tries,
      correct: s.correct,
      last: now,
    };
  const correct = s.correct + 1;
  if (prev && s.interval > 0 && s.due > now) return { ...s, tries, correct, last: now };
  const interval = clamp(s.interval < 1 ? 1 : s.interval < 3 ? 3 : Math.round(s.interval * s.ease), 1, MAX_INTERVAL);
  return {
    ease: clamp(s.ease + 0.05, MIN_EASE, MAX_EASE),
    interval,
    due: now + interval * DAY,
    tries,
    correct,
    last: now,
  };
}

/** 勘で当たった正解（#27）。当たりの回数には数えるが、間隔は 0 に戻して覚えた・覚えかけに入れず、
    1 日後にもう一度出す（誤答の 10 分より長く、正解の 1 日と同じ）。ease は変えない（分かっていなかっただけで、
    間違えたわけではない） */
export function reviewGuess(prev: ItemStat | undefined, now: number): ItemStat {
  const s = prev ?? { ease: START_EASE, interval: 0, due: now, tries: 0, correct: 0, last: now };
  return { ease: s.ease, interval: 0, due: now + DAY, tries: s.tries + 1, correct: s.correct + 1, last: now };
}

/** 覚えた扱いにする間隔（日）。1 回の正解（間隔 1 日）ではまだ数えず、
    日をあけて 2 回続けて正解する（間隔が 3 日になる）と数える（#28） */
export const KNOWN_INTERVAL = 3;

/** 期限を間隔の分以上過ぎた問題か（前に答えてから間隔の 2 倍以上たった。忘れているかもしれない） */
export const isStale = (s: ItemStat, now: number): boolean => now - s.due > s.interval * DAY;

/** 覚えた扱いの問題か：日をあけて 2 回以上続けて正解していて、期限を大きく過ぎていない。
    合格の目安・分野・細目の「覚えた」はすべてこれで数える */
export const isKnown = (s: ItemStat | undefined, now: number): boolean =>
  !!s && s.interval >= KNOWN_INTERVAL && !isStale(s, now);

/** 覚えかけ：直近は正解だが、まだ覚えた扱いでない（もう 1 回、期限が来てから正解すれば覚えた） */
export const isLearning = (s: ItemStat | undefined, now: number): boolean => !!s && s.interval >= 1 && !isKnown(s, now);

/** 期限が来ている問題か */
export const isDue = (s: ItemStat | undefined, now: number): boolean => !!s && s.due <= now;
