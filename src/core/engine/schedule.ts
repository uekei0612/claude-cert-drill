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
  /** 忘れた回数：覚えかけ以上（次の間隔が 1 日以上）になっていたのに間違えた回数（#87）。
      同じ回のやり直しで続けて間違えた分は数えない（初見でつまずいた問題と、覚えても忘れる問題を分けるため）。
      0 のときは持たない（この項目ができる前の記録も 0 として扱う） */
  readonly lapses?: number;
}

export const DAY = 24 * 60 * 60 * 1000;
export const START_EASE = 2.3;
export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;
export const MAX_INTERVAL = 90;
/** 間違えた問題は 10 分後に期限が来る */
export const RETRY_MS = 10 * 60 * 1000;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** 1 日の区切り（時）。0〜4 時に解いた分は前の日として数える（#93）。0 時で区切ると、23:30 と 0:30 の正解が
    「日をあけて 2 回」になり、1 時間で覚えたに入ってしまう。Anki の既定（Next day starts at 4AM）と同じ */
export const DAY_START_HOUR = 4;

/** その時刻が属する日（記録上の日）の暦の日付。その日の 0 時の Date（端末の時刻） */
export function recordDate(t: number): Date {
  const d = new Date(t - DAY_START_HOUR * 60 * 60 * 1000);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** その時刻が属する日の始まり（その日の朝 4 時） */
export function startOfDay(t: number): number {
  const d = recordDate(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), DAY_START_HOUR).getTime();
}

/** 期限が来る時刻（#90）。1 日以上先の期限（正解のあとの間隔・勘の翌日）は、時刻ではなくその日の始まり（朝 4 時。#93）から来たことにする。
    時刻のままだと、前日の夜 21 時に正解した問題を翌朝 8 時に正解しても「期限前」になり、間隔が延びない
    （夜に解いて朝に解く使い方では、いつまでも覚えたにならない）。誤答の 10 分後のやり直しは時刻のまま。
    保存している期限は変えず、読むときにそろえる（前の記録もそのまま直る） */
export const dueOf = (s: ItemStat): number =>
  s.interval >= 1 || s.due - s.last >= DAY / 2 ? startOfDay(s.due) : s.due;

/** 1 回答えたあとの記録。正解なら間隔を延ばし、誤答なら 0 に戻す。
    期限前の正解（同じ回での 2 回目や先取り）では間隔を延ばさない */
export function review(prev: ItemStat | undefined, ok: boolean, now: number): ItemStat {
  const s = prev ?? { ease: START_EASE, interval: 0, due: now, tries: 0, correct: 0, last: now };
  const tries = s.tries + 1;
  if (!ok)
    return withLapses(
      {
        ease: clamp(s.ease - 0.2, MIN_EASE, MAX_EASE),
        interval: 0,
        due: now + RETRY_MS,
        tries,
        correct: s.correct,
        last: now,
      },
      (s.lapses ?? 0) + (s.interval >= 1 ? 1 : 0),
    );
  const correct = s.correct + 1;
  if (prev && s.interval > 0 && dueOf(s) > now) return { ...s, tries, correct, last: now };
  const interval = clamp(s.interval < 1 ? 1 : s.interval < 3 ? 3 : Math.round(s.interval * s.ease), 1, MAX_INTERVAL);
  return withLapses(
    {
      ease: clamp(s.ease + 0.05, MIN_EASE, MAX_EASE),
      interval,
      due: now + interval * DAY,
      tries,
      correct,
      last: now,
    },
    s.lapses ?? 0,
  );
}

/** 忘れた回数を付ける（0 なら項目ごと持たない。前の記録と同じ形に保つ） */
function withLapses(s: ItemStat, lapses: number): ItemStat {
  const { lapses: _drop, ...rest } = s;
  return lapses > 0 ? { ...rest, lapses } : rest;
}

/** 勘で当たった正解（#27）。当たりの回数には数えるが、間隔は 0 に戻して覚えた・覚えかけに入れず、
    1 日後にもう一度出す（誤答の 10 分より長く、正解の 1 日と同じ）。ease は変えない（分かっていなかっただけで、
    間違えたわけではない） */
export function reviewGuess(prev: ItemStat | undefined, now: number): ItemStat {
  const s = prev ?? { ease: START_EASE, interval: 0, due: now, tries: 0, correct: 0, last: now };
  return withLapses(
    { ease: s.ease, interval: 0, due: now + DAY, tries: s.tries + 1, correct: s.correct + 1, last: now },
    s.lapses ?? 0,
  );
}

/** 覚えた扱いにする間隔（日）。1 回の正解（間隔 1 日）ではまだ数えず、
    日をあけて 2 回続けて正解する（間隔が 3 日になる）と数える（#28） */
export const KNOWN_INTERVAL = 3;

/** 期限を間隔の分以上過ぎた問題か（前に答えてから間隔の 2 倍以上たった。忘れているかもしれない） */
export const isStale = (s: ItemStat, now: number): boolean => now - dueOf(s) > s.interval * DAY;

/** 覚えた扱いの問題か：日をあけて 2 回以上続けて正解していて、期限を大きく過ぎていない。
    合格の目安・分野・細目の「覚えた」はすべてこれで数える */
export const isKnown = (s: ItemStat | undefined, now: number): boolean =>
  !!s && s.interval >= KNOWN_INTERVAL && !isStale(s, now);

/** 覚えかけ：直近は正解だが、まだ覚えた扱いでない（もう 1 回、期限が来てから正解すれば覚えた） */
export const isLearning = (s: ItemStat | undefined, now: number): boolean => !!s && s.interval >= 1 && !isKnown(s, now);

/** 苦手にする忘れた回数（#87）。1 回忘れるのは普通なので、2 回目から */
export const WEAK_LAPSES = 2;

/** 苦手な問題か：覚えかけ以上になってから 2 回以上間違えた（今覚えているかは問わない。また忘れやすい問題なので） */
export const isWeak = (s: ItemStat | undefined): boolean => (s?.lapses ?? 0) >= WEAK_LAPSES;

/** 期限が来ている問題か */
export const isDue = (s: ItemStat | undefined, now: number): boolean => !!s && dueOf(s) <= now;
