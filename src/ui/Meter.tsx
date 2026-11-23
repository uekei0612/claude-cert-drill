/* 割合のバー。mark は目安線（合格の目安など）。
   sub は value の先に薄い色で足す割合（習熟のメーターの「あと 1 回」。#94）。同じ日の正解はまだ「覚えた」に
   数えないので、薄い色で見せないと、解き直しても何も起きないように見える */
export function Meter({ value, sub = 0, mark, label }: { value: number; sub?: number; mark?: number; label: string }) {
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const pct = Math.round(clamp(value) * 100);
  const withSub = Math.round(clamp(value + sub) * 100);
  return (
    <div class="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      {withSub > pct && <div class="fill sub" style={{ width: `${withSub}%` }} />}
      <div class="fill" style={{ width: `${pct}%` }} />
      {mark !== undefined && <div class="mark" style={{ left: `${Math.round(mark * 100)}%` }} />}
    </div>
  );
}

export const pct = (x: number): string => `${Math.round(x * 100)}%`;
