/* 出題をテストで再現できるよう、乱数は引数で渡す */
export type Rng = () => number;

/** 種から決まる乱数（mulberry32） */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(rng: Rng, xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** 重みつきで 1 つ選ぶ（重みが全部 0 なら一様） */
export function pickWeighted<T>(rng: Rng, xs: readonly T[], weight: (x: T) => number): number {
  const ws = xs.map(x => Math.max(0, weight(x)));
  const sum = ws.reduce((a, b) => a + b, 0);
  if (sum <= 0) return Math.floor(rng() * xs.length);
  let r = rng() * sum;
  for (let i = 0; i < ws.length; i++) {
    r -= ws[i]!;
    if (r < 0) return i;
  }
  return xs.length - 1;
}
