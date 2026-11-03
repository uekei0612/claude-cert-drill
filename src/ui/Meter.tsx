/* 割合のバー。mark は目安線（合格の目安など） */
export function Meter({ value, mark, label }: { value: number; mark?: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div class="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div class="fill" style={{ width: `${pct}%` }} />
      {mark !== undefined && <div class="mark" style={{ left: `${Math.round(mark * 100)}%` }} />}
    </div>
  );
}

export const pct = (x: number): string => `${Math.round(x * 100)}%`;
