/* 教科書の図（SVG）を組み立てる小さな道具。色は CSS の変数（.fig の下）で付けるので、ダークでもそのまま読める。
   図の幅は 340 を基本にする（iPhone の幅で文字が 13px 前後に見える） */

export type Kind = "plain" | "accent" | "ok" | "ng" | "muted";
export type Tone = "text" | "muted" | "accent" | "ok" | "ng";
type Pt = readonly [number, number];

const FS = 13;
/** 図の幅（viewBox）。文字がこの外へ出ないかも確かめる */
const FIG_W = 340;
const TONE: Record<Tone, string> = { text: "ft", muted: "fs", accent: "fc", ok: "fo", ng: "fn" };

/** 文字列の幅の見積もり（全角 1 字＝文字の大きさ、半角は 0.62 字分） */
export function textWidth(s: string, fs = FS): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) < 0x2000 ? fs * 0.62 : fs;
  return w;
}

/** 枠からはみ出した文字（テストで 0 件を確かめる） */
export const overflows: string[] = [];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const n = (v: number) => (Math.round(v * 10) / 10).toString();

interface TextOpt {
  readonly fs?: number;
  readonly anchor?: "start" | "middle" | "end";
  readonly tone?: Tone;
  readonly bold?: boolean;
}

/** 文字（複数行なら y を中心に上下へ並べる） */
export function text(x: number, y: number, label: string | readonly string[], o: TextOpt = {}): string {
  const ls = typeof label === "string" ? [label] : label;
  const fs = o.fs ?? FS;
  const lh = fs * 1.35;
  const top = y - ((ls.length - 1) * lh) / 2;
  const anchor = o.anchor ?? "middle";
  for (const l of ls) {
    const w = textWidth(l, fs);
    const [a, b] = anchor === "start" ? [x, x + w] : anchor === "end" ? [x - w, x] : [x - w / 2, x + w / 2];
    if (a < 0 || b > FIG_W) overflows.push(`「${l}」が図の幅 ${FIG_W} からはみ出す`);
  }
  return ls
    .map(
      (l, i) =>
        `<text x="${n(x)}" y="${n(top + i * lh)}" font-size="${fs}" text-anchor="${o.anchor ?? "middle"}" dominant-baseline="central" class="${TONE[o.tone ?? "text"]}"${o.bold ? ' font-weight="700"' : ""}>${esc(l)}</text>`,
    )
    .join("");
}

interface BoxOpt {
  readonly kind?: Kind;
  readonly dashed?: boolean;
  readonly fs?: number;
  readonly bold?: boolean;
}

/** 角の丸い枠と、その中央の文字。文字が枠に収まらなければ overflows に記録する */
export function box(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string | readonly string[],
  o: BoxOpt = {},
): string {
  const ls = typeof label === "string" ? [label] : label;
  const fs = o.fs ?? FS;
  for (const l of ls) if (textWidth(l, fs) > w - 10) overflows.push(`「${l}」が幅 ${w} に収まらない`);
  if (ls.length * fs * 1.35 > h - 4) overflows.push(`「${ls.join("／")}」が高さ ${h} に収まらない`);
  const kind = o.kind ?? "plain";
  return (
    `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="8" class="fb k-${kind}${o.dashed ? " dash" : ""}"/>` +
    text(x + w / 2, y + h / 2, ls, { fs, tone: kind === "muted" ? "muted" : "text", bold: o.bold })
  );
}

/** 折れ線の矢印。both なら両端に矢じり */
export function arrow(
  pts: readonly Pt[],
  o: { both?: boolean; dashed?: boolean; tone?: "muted" | "accent" | "ng" } = {},
): string {
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join(" ");
  const tone = o.tone ?? "muted";
  const m = `url(#fig-ah-${tone})`;
  return `<path d="${d}" class="fa t-${tone}${o.dashed ? " dash" : ""}" marker-end="${m}"${o.both ? ` marker-start="${m}"` : ""}/>`;
}

/** 線（矢じりなし） */
export function line(pts: readonly Pt[], o: { dashed?: boolean; tone?: "muted" | "accent" | "ng" } = {}): string {
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${n(x)} ${n(y)}`).join(" ");
  return `<path d="${d}" class="fa t-${o.tone ?? "muted"}${o.dashed ? " dash" : ""}"/>`;
}

let seq = 0;

const marker = (tone: string, id: string) =>
  `<marker id="${id}-${tone}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fm t-${tone}"/></marker>`;

/** 図の全体。部品を並べて SVG の文字列にする */
export function svg(w: number, h: number, parts: readonly string[]): string {
  // 矢じり（marker）の id は、図ごとに変える（同じページに複数の図があっても重ならない）
  const id = `fig${++seq}`;
  const body = parts.join("").replaceAll("url(#fig-ah-", `url(#${id}-`);
  const defs = ["muted", "accent", "ng"].map(t => marker(t, id)).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
}
