/* 科目A の公開問題の図を、原文の図の配置をなぞって SVG で描き直したもの（#65）。
   描き直した図を使う問題は、出典に「一部改変」を添える */
import { arrow, box, circle, dot, line, shape, svg, text, wire } from "../../core/exam/figure";

type Pt = readonly [number, number];

/** a から b へ向かう線の端を、円の半径 r だけ縮める */
function trim(a: Pt, b: Pt, r: number): [Pt, Pt] {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  return [
    [a[0] + ux * r, a[1] + uy * r],
    [b[0] - ux * r, b[1] - uy * r],
  ];
}

interface Edge {
  readonly from: string;
  readonly to: string;
  /** 作業名（矢線の上） */
  readonly name?: string;
  /** 日数（矢線の下） */
  readonly days?: string;
  /** ダミー作業（点線） */
  readonly dummy?: boolean;
  /** 折れ線で回り込むときの途中の点。名前と日数は via[0]〜via[1] の中ほどに付ける */
  readonly via?: readonly Pt[];
}

/** アローダイアグラム。結合点は小さな円、作業は矢線（上に作業名、下に日数）、ダミー作業は点線の矢線 */
function arrowNet(
  w: number,
  h: number,
  nodes: Record<string, Pt>,
  edges: readonly Edge[],
  labels: readonly string[] = [],
): string {
  const r = 9;
  const parts: string[] = [];
  for (const e of edges) {
    const a = nodes[e.from]!;
    const b = nodes[e.to]!;
    const pts: Pt[] = [a, ...(e.via ?? []), b];
    const [s] = trim(pts[0]!, pts[1]!, r);
    const [, t] = trim(pts[pts.length - 2]!, pts[pts.length - 1]!, r);
    const path: Pt[] = [s, ...pts.slice(1, -1), t];
    parts.push(arrow(path, { dashed: e.dummy, tone: "accent" }));
    // 名前と日数：折れ線なら途中の区間、直線なら全体の中ほど。線の法線の向きに少し離す
    const [p, q] = e.via && e.via.length >= 2 ? [e.via[0]!, e.via[1]!] : [a, b];
    const [mx, my] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    let [nx, ny] = [(q[1] - p[1]) / len, -(q[0] - p[0]) / len];
    if (ny > 0) [nx, ny] = [-nx, -ny];
    if (e.name) parts.push(text(mx + nx * 9, my + ny * 9, e.name, { fs: 12 }));
    if (e.days) parts.push(text(mx - nx * 9, my - ny * 9, e.days, { fs: 12 }));
  }
  for (const [x, y] of Object.values(nodes)) parts.push(circle(x, y, r));
  return svg(w, h, [...parts, ...labels]);
}

/** 令和5年度 問10：Web アプリケーションのシステムの構成 */
export const r05q10 = (() => {
  const cx = 170;
  const bw = 140;
  const parts: string[] = [];
  // PC 3 台とインターネット
  for (const x of [118, 170, 222]) {
    parts.push(
      line([
        [x, 26],
        [cx + (x - cx) * 0.4, 44],
      ]),
    );
    parts.push(box(x - 18, 4, 36, 22, "PC", { fs: 12 }));
  }
  parts.push(circle(cx, 56, 62, "インターネット", { ry: 14, fs: 12 }));
  const stack: [string, string, string | readonly string[]][] = [
    ["ファイアウォール", "a", "HTTPS"],
    ["SSLアクセラレータ", "b", "HTTPS"],
    ["Webサーバ", "c", "HTTP"],
    ["データベースサーバ", "d", ["データベース", "アクセス用サービス"]],
  ];
  let y = 70;
  for (const [name, mark, proto] of stack) {
    parts.push(
      line([
        [cx, y],
        [cx, y + 30],
      ]),
    );
    parts.push(text(cx - 6, y + 15, proto, { fs: 11, anchor: "end" }));
    parts.push(text(cx + 8, y + 15, mark, { fs: 12, anchor: "start", bold: true }));
    parts.push(box(cx - bw / 2, y + 30, bw, 26, name, { fs: 12 }));
    y += 56;
  }
  return svg(340, y + 4, parts);
})();

/** 令和5年度 問11：流れ図 */
export const r05q11 = (() => {
  const fs = 12;
  const diamond = (cx: number, cy: number) =>
    shape(`M${cx - 36} ${cy} L${cx} ${cy - 16} L${cx + 36} ${cy} L${cx} ${cy + 16} Z`) + text(cx, cy, "m : n", { fs });
  const terminal = (cx: number, y: number, label: string) =>
    shape(`M${cx - 20} ${y} H${cx + 20} A11 11 0 0 1 ${cx + 20} ${y + 22} H${cx - 20} A11 11 0 0 1 ${cx - 20} ${y} Z`) +
    text(cx, y + 11, label, { fs });
  const io = (cx: number, y: number, label: string) =>
    shape(`M${cx - 40} ${y} H${cx + 48} L${cx + 40} ${y + 24} H${cx - 48} Z`) + text(cx, y + 12, label, { fs });
  const num = (x: number, y: number, s: string) => text(x, y, s, { fs, tone: "muted" });
  return svg(340, 236, [
    terminal(70, 4, "開始"),
    arrow([
      [70, 26],
      [70, 38],
    ]),
    box(22, 38, 96, 40, ["m ← a", "n ← b"], { fs }),
    num(12, 46, "①"),
    arrow([
      [70, 78],
      [70, 108],
    ]),
    diamond(70, 125),
    num(26, 108, "②"),
    arrow([
      [106, 125],
      [138, 125],
    ]),
    text(120, 116, "≠", { fs }),
    diamond(175, 125),
    num(148, 103, "③"),
    arrow([
      [211, 125],
      [282, 125],
      [282, 164],
    ]),
    text(240, 114, "＜", { fs }),
    arrow([
      [175, 141],
      [175, 164],
    ]),
    text(186, 152, "＞", { fs }),
    arrow([
      [70, 141],
      [70, 164],
    ]),
    text(81, 152, "＝", { fs }),
    io(70, 165, "m の値を印字"),
    num(12, 160, "⑥"),
    box(126, 165, 98, 24, "m ← (m − n)", { fs: 11 }),
    num(122, 158, "④"),
    box(233, 165, 98, 24, "n ← (n − m)", { fs: 11 }),
    num(229, 158, "⑤"),
    // ④ と ⑤ のあと、②の前へ戻る
    line([
      [175, 189],
      [175, 202],
      [334, 202],
    ]),
    line([
      [282, 189],
      [282, 202],
    ]),
    arrow([
      [334, 202],
      [334, 94],
      [72, 94],
    ]),
    arrow([
      [70, 189],
      [70, 208],
    ]),
    terminal(70, 208, "終了"),
  ]);
})();

/** 令和5年度 問13：アローダイアグラム */
export const r05q13 = arrowNet(
  340,
  150,
  { s: [16, 75], a: [96, 75], top: [176, 25], bot: [176, 125], j: [256, 75], e: [326, 75] },
  [
    { from: "s", to: "a", name: "A", days: "4" },
    { from: "a", to: "top", name: "B", days: "6" },
    { from: "top", to: "j", name: "E", days: "5" },
    { from: "a", to: "j", name: "C", days: "8" },
    { from: "a", to: "bot", name: "D", days: "4" },
    { from: "bot", to: "j", name: "F", days: "4" },
    { from: "j", to: "e", name: "G", days: "5" },
  ],
);

/** 令和6年度 問3：CPU・キャッシュメモリ・主記憶の構成 */
export const r06q3 = svg(340, 108, [
  box(10, 4, 150, 98, "", { kind: "muted" }),
  text(20, 18, "CPU", { anchor: "start", fs: 12 }),
  box(28, 30, 114, 62, ["キャッシュ", "メモリ", "256kバイト"], { fs: 12 }),
  line([
    [160, 53],
    [200, 53],
  ]),
  box(200, 4, 120, 98, ["主記憶", "256Mバイト"], { fs: 12 }),
]);

/** 令和6年度 問13：アローダイアグラム（ダミー作業あり） */
export const r06q13 = arrowNet(
  340,
  155,
  { s: [14, 78], a: [80, 78], top: [164, 24], mid: [170, 78], bot: [176, 132], j: [254, 78], e: [326, 78] },
  [
    { from: "s", to: "a", name: "A", days: "30" },
    { from: "a", to: "top", name: "B", days: "5" },
    { from: "a", to: "mid", name: "C", days: "30" },
    { from: "a", to: "bot", name: "D", days: "20" },
    { from: "top", to: "mid", dummy: true },
    { from: "mid", to: "bot", dummy: true },
    { from: "top", to: "j", name: "E", days: "40" },
    { from: "mid", to: "j", name: "F", days: "25" },
    { from: "bot", to: "j", name: "G", days: "30" },
    { from: "j", to: "e", name: "H", days: "30" },
  ],
);

/** 令和6年度 問19：散布図（右下がり） */
export const r06q19 = (() => {
  // 原文の図と同じく、x が大きいほど y が小さい点の集まり（位置は描き直したもの）
  const pts: Pt[] = [
    [118, 30],
    [124, 36],
    [134, 32],
    [130, 42],
    [142, 38],
    [150, 30],
    [146, 46],
    [158, 36],
    [154, 52],
    [166, 32],
    [170, 44],
    [164, 58],
    [176, 30],
    [180, 50],
    [186, 40],
    [178, 64],
    [190, 56],
    [196, 46],
    [192, 70],
    [202, 52],
    [206, 62],
    [200, 76],
    [212, 56],
    [216, 70],
    [210, 82],
    [222, 66],
    [226, 76],
    [222, 88],
    [234, 86],
  ];
  return svg(340, 120, [
    arrow([
      [100, 104],
      [100, 8],
    ]),
    arrow([
      [100, 104],
      [250, 104],
    ]),
    text(92, 12, "y", { fs: 12 }),
    text(256, 104, "x", { fs: 12 }),
    text(92, 112, "0", { fs: 11 }),
    ...pts.map(([x, y]) => dot(x, y + 4, 2.2)),
  ]);
})();

/** 令和7年度 問3：2 分探索木 */
export const r07q3 = (() => {
  const at: Record<string, Pt> = {
    a: [170, 20],
    b: [95, 64],
    c: [245, 64],
    d: [55, 108],
    e: [135, 108],
    f: [205, 108],
    g: [285, 108],
  };
  const edges = [
    ["a", "b"],
    ["a", "c"],
    ["b", "d"],
    ["b", "e"],
    ["c", "f"],
    ["c", "g"],
  ] as const;
  return svg(340, 128, [
    ...edges.map(([p, q]) => line([at[p]!, at[q]!])),
    ...Object.entries(at).map(([k, [x, y]]) => circle(x, y, 14, k)),
  ]);
})();

/** 令和7年度 問14：アローダイアグラム（開始・終了とダミー作業あり） */
export const r07q14 = arrowNet(
  340,
  190,
  {
    s: [16, 92],
    a: [70, 92],
    e: [100, 142],
    b: [132, 92],
    g: [168, 44],
    c: [204, 92],
    d: [266, 92],
    t: [322, 92],
  },
  [
    { from: "s", to: "a", name: "A", days: "3" },
    { from: "a", to: "b", name: "B", days: "6" },
    { from: "a", to: "e", name: "E", days: "5" },
    { from: "e", to: "b", dummy: true },
    { from: "b", to: "g", name: "G", days: "11" },
    { from: "g", to: "c", dummy: true },
    { from: "b", to: "c", name: "C", days: "8" },
    {
      from: "a",
      to: "c",
      name: "F",
      days: "14",
      via: [
        [92, 18],
        [180, 18],
      ],
    },
    { from: "c", to: "d", name: "D", days: "6" },
    {
      from: "b",
      to: "d",
      name: "H",
      days: "15",
      via: [
        [150, 168],
        [246, 168],
      ],
    },
    { from: "d", to: "t", name: "I", days: "5" },
  ],
  [text(16, 112, "開始", { fs: 11 }), text(322, 112, "終了", { fs: 11 })],
);

/** NAND 素子（左上が x, y。幅 44・高さ 30）。入力は y＋7 と y＋23、出力は x＋44, y＋15 */
const nand = (x: number, y: number) =>
  shape(`M${x} ${y} H${x + 22} A15 15 0 0 1 ${x + 22} ${y + 30} H${x} Z`) +
  `<circle cx="${x + 40.5}" cy="${y + 15}" r="3.5" class="fg"/>`;

/** 入力を 2 本に分けて NAND に入れる（入力を束ねた NAND は否定と同じ） */
const tied = (fromX: number, y: number, gateX: number) =>
  wire([
    [fromX, y],
    [gateX - 8, y],
  ]) +
  wire([
    [gateX - 8, y - 8],
    [gateX - 8, y + 8],
  ]) +
  wire([
    [gateX - 8, y - 8],
    [gateX, y - 8],
  ]) +
  wire([
    [gateX - 8, y + 8],
    [gateX, y + 8],
  ]) +
  dot(gateX - 8, y, 2.5);

/** 令和8年度 問6：NAND 素子 4 個の回路 */
export const r08q6 = svg(340, 112, [
  text(14, 30, "A", { fs: 12 }),
  text(14, 84, "B", { fs: 12 }),
  tied(22, 30, 50),
  nand(50, 15),
  tied(22, 84, 50),
  nand(50, 69),
  wire([
    [94, 30],
    [118, 30],
    [118, 49],
    [140, 49],
  ]),
  wire([
    [94, 84],
    [118, 84],
    [118, 65],
    [140, 65],
  ]),
  nand(140, 42),
  tied(184, 57, 214),
  nand(214, 42),
  wire([
    [258, 57],
    [284, 57],
  ]),
  text(294, 57, "Y", { fs: 12 }),
]);

/** タイミングチャート。levels は時間の区切りごとの 0／1 */
export function timing(rows: readonly (readonly [string, readonly (0 | 1)[]])[]): string {
  const x0 = 46;
  const slots = rows[0]![1].length;
  const sw = 270 / slots;
  const rh = 40;
  const parts: string[] = [];
  for (let i = 1; i < slots; i++)
    parts.push(
      line(
        [
          [x0 + i * sw, 4],
          [x0 + i * sw, rows.length * rh],
        ],
        { dashed: true },
      ),
    );
  rows.forEach(([name, levels], r) => {
    const hi = r * rh + 10;
    const lo = r * rh + 32;
    parts.push(text(12, (hi + lo) / 2, name, { fs: 12 }));
    parts.push(text(32, hi, "1", { fs: 10, tone: "muted" }));
    parts.push(text(32, lo, "0", { fs: 10, tone: "muted" }));
    const pts: Pt[] = [];
    levels.forEach((v, i) => {
      const y = v ? hi : lo;
      pts.push([x0 + i * sw, y], [x0 + (i + 1) * sw, y]);
    });
    parts.push(wire(pts));
  });
  return svg(340, rows.length * rh + 4, parts);
}

/* ---- 科目A サンプル問題セット（#68） ---- */

const FS_FLOW = 12;
/** 流れ図の端子（開始・終了）。cx は中心、y は上端（高さ 22） */
const terminal = (cx: number, y: number, label: string) =>
  shape(`M${cx - 22} ${y} H${cx + 22} A11 11 0 0 1 ${cx + 22} ${y + 22} H${cx - 22} A11 11 0 0 1 ${cx - 22} ${y} Z`) +
  text(cx, y + 11, label, { fs: FS_FLOW });
/** ループ端（始まり）：上の角を落とした六角形 */
const loopStart = (x: number, y: number, w: number, h: number, label: string | readonly string[]) =>
  shape(`M${x + 9} ${y} H${x + w - 9} L${x + w} ${y + 9} V${y + h} H${x} V${y + 9} Z`) +
  text(x + w / 2, y + h / 2 + 2, label, { fs: FS_FLOW });
/** ループ端（終わり）：下の角を落とした六角形 */
const loopEnd = (x: number, y: number, w: number, h: number, label: string) =>
  shape(`M${x} ${y} H${x + w} V${y + h - 9} L${x + w - 9} ${y + h} H${x + 9} L${x} ${y + h - 9} Z`) +
  text(x + w / 2, y + h / 2 - 2, label, { fs: FS_FLOW });
/** 処理の箱（角の丸くない四角） */
const proc = (x: number, y: number, w: number, h: number, label: string) =>
  shape(`M${x} ${y} H${x + w} V${y + h} H${x} Z`) + text(x + w / 2, y + h / 2, label, { fs: FS_FLOW });
/** 上下の部品をつなぐ矢印 */
const down = (x: number, y1: number, y2: number) =>
  arrow([
    [x, y1],
    [x, y2],
  ]);

/** 縦に並べた流れ図。部品は [種類, 高さ, 文字] */
function flow(parts: readonly (readonly ["term" | "proc" | "start" | "end", number, string | readonly string[]])[]) {
  const cx = 170;
  const w = 150;
  const out: string[] = [];
  let y = 4;
  parts.forEach(([kind, h, label], i) => {
    if (i > 0) {
      out.push(down(cx, y, y + 12));
      y += 12;
    }
    const x = cx - w / 2;
    if (kind === "term") out.push(terminal(cx, y, label as string));
    else if (kind === "proc") out.push(proc(x, y, w, h, label as string));
    else if (kind === "start") out.push(loopStart(x, y, w, h, label));
    else out.push(loopEnd(x, y, w, h, label as string));
    y += h;
  });
  return svg(340, y + 4, out);
}

/** サンプル 問2：10 進数を 2 進数に変換する流れ図 */
export const sampleAQ2 = flow([
  ["term", 22, "開始"],
  ["proc", 26, "j を入力"],
  ["start", 40, ["変換", "k：1，1，8（注）"]],
  ["proc", 26, "a"],
  ["proc", 26, "b"],
  ["end", 30, "変換"],
  ["term", 22, "終了"],
]);

/** サンプル 問6：二重ループの流れ図 */
export const sampleAQ6 = flow([
  ["term", 22, "開始"],
  ["start", 40, ["ループ 1", "i：0，1，7（注）"]],
  ["start", 40, ["ループ 2", "j：0，1，7（注）"]],
  ["proc", 26, "a"],
  ["end", 30, "ループ 2"],
  ["end", 30, "ループ 1"],
  ["term", 22, "終了"],
]);

/** サンプル 問4：オートマトンの状態遷移図（矢印のラベルは 入力／出力） */
export const sampleAQ4 = (() => {
  const r = 18;
  const s1: Pt = [96, 74];
  const s2: Pt = [180, 74];
  const s3: Pt = [264, 74];
  const lbl = (x: number, y: number, s: string) => text(x, y, s, { fs: 12 });
  return svg(340, 140, [
    // 初期状態を指す矢印
    arrow(
      [
        [42, s1[1]],
        [s1[0] - r - 2, s1[1]],
      ],
      { tone: "accent" },
    ),
    // S1 の自己ループ 0／0、S3 の自己ループ 1／1
    arrow([
      [s1[0] - 9, s1[1] - r + 2],
      [s1[0] - 16, 30],
      [s1[0] + 16, 30],
      [s1[0] + 9, s1[1] - r + 2],
    ]),
    lbl(s1[0], 18, "0／0"),
    arrow([
      [s3[0] - 9, s3[1] - r + 2],
      [s3[0] - 16, 30],
      [s3[0] + 16, 30],
      [s3[0] + 9, s3[1] - r + 2],
    ]),
    lbl(s3[0], 18, "1／1"),
    // S1 → S2（1／0）と S2 → S1（0／0）
    arrow([
      [s1[0] + r, s1[1] - 6],
      [s2[0] - r - 1, s2[1] - 6],
    ]),
    lbl(138, 56, "1／0"),
    arrow([
      [s2[0] - r, s2[1] + 6],
      [s1[0] + r + 1, s1[1] + 6],
    ]),
    lbl(138, 92, "0／0"),
    // S2 → S3（1／1）
    arrow([
      [s2[0] + r, s2[1]],
      [s3[0] - r - 1, s3[1]],
    ]),
    lbl(222, 62, "1／1"),
    // S3 → S1（0／0）：下を回る
    arrow([
      [s3[0], s3[1] + r],
      [s3[0], 120],
      [s1[0], 120],
      [s1[0], s1[1] + r + 1],
    ]),
    lbl(222, 130, "0／0"),
    circle(s1[0], s1[1], r, "S₁", { fs: 12 }),
    circle(s2[0], s2[1], r, "S₂", { fs: 12 }),
    circle(s3[0], s3[1], r, "S₃", { fs: 12 }),
  ]);
})();

/** サンプル 問5：選択肢ア〜エの 2 分木。null は節が無い所 */
export const sampleAQ5 = (() => {
  // 根・左・右・左の左・左の右・右の左・右の右
  const trees: [string, (number | null)[]][] = [
    ["ア", [16, 15, 19, 10, 14, null, null]],
    ["イ", [17, 14, 19, 10, 16, 18, null]],
    ["ウ", [18, 16, 19, 15, 14, null, 20]],
    ["エ", [20, 18, 19, 10, 14, 15, 16]],
  ];
  const r = 11;
  const parts: string[] = [];
  trees.forEach(([name, v], k) => {
    const ox = (k % 2) * 170;
    const oy = Math.floor(k / 2) * 104;
    const at: Pt[] = [
      [ox + 92, oy + 16],
      [ox + 54, oy + 50],
      [ox + 130, oy + 50],
      [ox + 32, oy + 86],
      [ox + 76, oy + 86],
      [ox + 108, oy + 86],
      [ox + 152, oy + 86],
    ];
    parts.push(text(ox + 12, oy + 14, name, { fs: 13, bold: true }));
    const edges: [number, number][] = [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [2, 6],
    ];
    for (const [p, c] of edges) if (v[c] !== null) parts.push(line([at[p]!, at[c]!]));
    v.forEach((n, i) => {
      if (n !== null) parts.push(circle(at[i]![0], at[i]![1], r, String(n), { fs: 11 }));
    });
  });
  return svg(340, 204, parts);
})();

/** サンプル 問14：サーバ・クライアント・プリンタを LAN でつないだ構成（並びは描き直した） */
export const sampleAQ14 = (() => {
  const bus = 60;
  const parts: string[] = [
    wire([
      [8, bus],
      [332, bus],
    ]),
  ];
  const top: [number, string][] = [
    [35, "サーバ"],
    [135, "プリンタ"],
    [235, "プリンタ"],
  ];
  for (const [x, s] of top) {
    parts.push(
      line([
        [x + 35, 38],
        [x + 35, bus],
      ]),
    );
    parts.push(box(x, 10, 70, 28, s, { fs: 12 }));
  }
  for (const x of [20, 127, 234]) {
    parts.push(
      line([
        [x + 43, bus],
        [x + 43, 82],
      ]),
    );
    parts.push(box(x, 82, 86, 28, "クライアント", { fs: 12 }));
  }
  parts.push(text(318, bus - 9, "LAN", { fs: 11, tone: "muted" }));
  return svg(340, 116, parts);
})();

/** サンプル 問15：送信タスク → バッファ → 受信タスク */
export const sampleAQ15 = svg(340, 60, [
  box(4, 10, 84, 34, "送信タスク", { fs: 12 }),
  arrow([
    [88, 27],
    [126, 27],
  ]),
  text(107, 38, "S", { fs: 12 }),
  box(128, 6, 84, 42, ["バッファ", "サイズ：L"], { fs: 12 }),
  arrow([
    [212, 27],
    [250, 27],
  ]),
  text(231, 38, "R", { fs: 12 }),
  box(252, 10, 84, 34, "受信タスク", { fs: 12 }),
]);

/** サンプル 問22：UML のクラス図（部署と従業員の関連「所属する」） */
export const sampleAQ22 = svg(340, 64, [
  line([
    [110, 38],
    [226, 38],
  ]),
  box(40, 24, 70, 28, "部署", { fs: 12 }),
  box(226, 24, 76, 28, "従業員", { fs: 12 }),
  text(168, 14, "◀ 所属する", { fs: 12 }),
  text(132, 52, "1..＊", { fs: 11 }),
  text(204, 52, "0..＊", { fs: 11 }),
]);

/** サンプル 問44：アローダイアグラム */
export const sampleAQ44 = arrowNet(
  340,
  162,
  {
    s: [16, 80],
    a: [70, 80],
    t1: [148, 18],
    t2: [210, 18],
    m1: [148, 80],
    m2: [210, 80],
    j: [276, 80],
    lo: [148, 144],
    e: [324, 144],
  },
  [
    { from: "s", to: "a", name: "A", days: "2" },
    { from: "a", to: "t1", name: "B", days: "2" },
    { from: "t1", to: "t2", name: "E", days: "2" },
    { from: "t2", to: "j", name: "H", days: "2" },
    { from: "a", to: "m1", name: "C", days: "1" },
    { from: "m1", to: "m2", name: "F", days: "3" },
    { from: "m2", to: "j", name: "I", days: "1" },
    { from: "a", to: "lo", name: "D", days: "4" },
    { from: "lo", to: "e", name: "G", days: "3" },
    { from: "j", to: "e", name: "J", days: "4" },
  ],
);

/** サンプル 問60：派遣元企業・派遣先企業・労働者の関係（太線が問われている関係） */
export const sampleAQ60 = svg(340, 140, [
  arrow(
    [
      [158, 26],
      [212, 58],
    ],
    { both: true },
  ),
  arrow(
    [
      [104, 38],
      [104, 102],
    ],
    { both: true },
  ),
  // 太線：同じ矢印の線を太くする（矢じりも線の太さに合わせて大きくなる）
  arrow(
    [
      [210, 79],
      [160, 111],
    ],
    { both: true, tone: "accent" },
  ).replace("<path ", '<path style="stroke-width:3" '),
  box(54, 10, 100, 28, "派遣元企業", { fs: 12 }),
  box(216, 54, 100, 28, "派遣先企業", { fs: 12 }),
  box(54, 102, 100, 28, "労働者", { fs: 12 }),
]);
