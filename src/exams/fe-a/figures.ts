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

/* ---- 令和元年度 秋期 午前（#71） ---- */

/** 曲線（2 次ベジェ）の濃い線 */
const curve = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) =>
  `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" class="fw"/>`;

/** 令和元年度 秋期 問3：選択肢ア〜エの無向グラフ */
export const r01aQ3 = (() => {
  const names = ["a", "b", "c", "d", "e", "f"];
  const graphs: [string, string[]][] = [
    ["ア", ["ab", "cd", "de", "ef"]],
    ["イ", ["ab", "bc", "de", "ef"]],
    ["ウ", ["ab", "bc", "cd", "ef"]],
    ["エ", ["ab", "bc", "cd", "de", "ef"]],
  ];
  const r = 11;
  const parts: string[] = [];
  graphs.forEach(([label, straight], k) => {
    const y = 34 + k * 66;
    const x = (n: string) => 60 + names.indexOf(n) * 48;
    parts.push(text(16, y, label, { fs: 13, bold: true }));
    for (const [p, q] of straight.map(s => [s[0]!, s[1]!] as const))
      parts.push(
        wire([
          [x(p) + r, y],
          [x(q) - r, y],
        ]),
      );
    // どの選択肢にも c–e（上の弧）と b–d（下の弧）がある
    parts.push(curve(x("c") + 4, y - r + 1, x("d"), y - 34, x("e") - 4, y - r + 1));
    parts.push(curve(x("b") + 4, y + r - 1, x("c"), y + 34, x("d") - 4, y + r - 1));
    for (const n of names) parts.push(circle(x(n), y, r, n, { fs: 12 }));
  });
  return svg(340, 268, parts);
})();

/** 令和元年度 秋期 問5：選択肢ア〜エの分布のグラフ */
export const r01aQ5 = (() => {
  const parts: string[] = [];
  const W = 170;
  const H = 104;
  /** 曲線の点を折れ線で。f は 0〜1 の高さ */
  const plot = (ox: number, oy: number, f: (x: number) => number) => {
    const pts: Pt[] = [];
    for (let x = 0; x <= 140; x += 2) pts.push([ox + 18 + x, oy + 78 - 62 * f(x)]);
    return wire(pts);
  };
  const g = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s));
  const mark = (ox: number, oy: number, x: number, h: number, label: string) =>
    line(
      [
        [ox + 18 + x, oy + 78 - 62 * h],
        [ox + 18 + x, oy + 82],
      ],
      { dashed: true },
    ) + text(ox + 18 + x, oy + 92, label, { fs: 10 });
  const cell = (k: number) => [(k % 2) * W, Math.floor(k / 2) * H] as const;
  const axis = (ox: number, oy: number) =>
    line([
      [ox + 10, oy + 82],
      [ox + 164, oy + 82],
    ]);
  // ア：平均 60・標準偏差 10（山の中心 60、中心から 1 目盛りの 70 まで 10）
  {
    const [ox, oy] = cell(0);
    parts.push(text(ox + 10, oy + 10, "ア", { fs: 13, bold: true }), axis(ox, oy));
    parts.push(
      plot(ox, oy, x => g(x, 70, 20)),
      mark(ox, oy, 70, 1, "60"),
      mark(ox, oy, 90, g(90, 70, 20), "70"),
    );
    parts.push(text(ox + 18 + 80, oy + 72, "10", { fs: 9, tone: "muted" }));
  }
  // イ：とがった山（55・60・65、55〜65 の幅が 10）。目盛りの数字が重ならないよう 60 だけ 1 段下げる
  {
    const [ox, oy] = cell(1);
    parts.push(text(ox + 10, oy + 10, "イ", { fs: 13, bold: true }), axis(ox, oy));
    parts.push(plot(ox, oy, x => g(x, 70, 11)));
    parts.push(mark(ox, oy, 56, g(56, 70, 11), "55"), mark(ox, oy, 84, g(84, 70, 11), "65"));
    parts.push(
      line(
        [
          [ox + 18 + 70, oy + 16],
          [ox + 18 + 70, oy + 82],
        ],
        { dashed: true },
      ),
      text(ox + 18 + 70, oy + 100, "60", { fs: 10 }),
    );
    parts.push(text(ox + 18 + 77, oy + 72, "10", { fs: 9, tone: "muted" }));
  }
  // ウ：山が 2 つ（10 と 60）
  {
    const [ox, oy] = cell(2);
    parts.push(text(ox + 10, oy + 10, "ウ", { fs: 13, bold: true }), axis(ox, oy));
    parts.push(plot(ox, oy, x => 0.42 * g(x, 14, 7) + 0.18 * g(x, 50, 30) + g(x, 100, 10)));
    parts.push(mark(ox, oy, 14, 0.45, "10"), mark(ox, oy, 100, 1, "60"));
  }
  // エ：左にすそを引くゆがんだ山（50 と 60、その間が 10）
  {
    const [ox, oy] = cell(3);
    parts.push(text(ox + 10, oy + 10, "エ", { fs: 13, bold: true }), axis(ox, oy));
    const f = (x: number) => (x < 92 ? 0.25 + 0.75 * (x / 92) ** 2.2 : g(x, 92, 12));
    parts.push(plot(ox, oy, f), mark(ox, oy, 70, f(70), "50"), mark(ox, oy, 92, 1, "60"));
    parts.push(text(ox + 18 + 81, oy + 72, "10", { fs: 9, tone: "muted" }));
  }
  return svg(340, 2 * H, parts);
})();

/** 令和元年度 秋期 問13：割込み A・B の発生のタイミング（0〜5 ミリ秒） */
export const r01aQ13 = (() => {
  const x0 = 96;
  const unit = 44;
  const X = (ms: number) => x0 + ms * unit;
  const parts: string[] = [];
  for (let i = 0; i <= 10; i++)
    parts.push(
      line(
        [
          [X(i / 2), 10],
          [X(i / 2), 92],
        ],
        { dashed: true },
      ),
    );
  const row = (y: number, label: string, at: number[]) => {
    parts.push(text(8, y, label, { anchor: "start", fs: 11 }));
    parts.push(
      arrow([
        [X(0), y],
        [X(5) + 18, y],
      ]),
    );
    for (const t of at)
      parts.push(
        arrow(
          [
            [X(t), y - 22],
            [X(t), y - 1],
          ],
          { tone: "accent" },
        ),
      );
  };
  row(40, "割込み A の発生", [1, 2.5, 3.5]);
  row(84, "割込み B の発生", [0, 5]);
  for (let i = 0; i <= 5; i++) parts.push(text(X(i), 104, String(i), { fs: 11 }));
  parts.push(text(X(5) + 4, 120, "時間（ミリ秒）", { anchor: "end", fs: 10, tone: "muted" }));
  return svg(340, 126, parts);
})();

/** 令和元年度 秋期 問21：データ・ストローブ・クロックの波形。1 目盛りはクロックの 1/4 周期 */
export const r01aQ21 = (() => {
  const slots = 42;
  const x0 = 64;
  const sw = 270 / slots;
  const clock = [0, 0, ...Array.from({ length: 40 }, (_, i) => (i % 4 < 2 ? 1 : 0))];
  // データ：0〜6 が 1、7〜18 が 0、19〜27 が 1、28〜32 が 0、33〜41 が 1
  const data = Array.from({ length: slots }, (_, i) => (i <= 6 || (i >= 19 && i <= 27) || i >= 33 ? 1 : 0));
  const strobe = Array.from({ length: slots }, (_, i) => (i === 36 || i === 37 ? 1 : 0));
  const rows: [string, number[]][] = [
    ["データ", data],
    ["ストローブ", strobe],
    ["クロック", clock],
  ];
  const parts: string[] = [];
  // クロックの立上りエッジ（10 回）に点線
  for (let k = 0; k < 10; k++) {
    const x = x0 + (2 + 4 * k) * sw;
    parts.push(
      line(
        [
          [x, 6],
          [x, 104],
        ],
        { dashed: true },
      ),
    );
  }
  rows.forEach(([name, lv], r) => {
    const hi = 12 + r * 34;
    const lo = hi + 16;
    parts.push(text(4, (hi + lo) / 2, name, { anchor: "start", fs: 11 }));
    const pts: Pt[] = [];
    lv.forEach((v, i) => pts.push([x0 + i * sw, v ? hi : lo], [x0 + (i + 1) * sw, v ? hi : lo]));
    parts.push(wire(pts));
  });
  parts.push(
    arrow([
      [x0, 112],
      [x0 + 274, 112],
    ]),
    text(x0 + 274, 124, "時間", { anchor: "end", fs: 10, tone: "muted" }),
  );
  return svg(340, 130, parts);
})();

/** NOT 素子（入力の左端 x、高さの中心 y）。出力は x ＋ 22 */
const notGate = (x: number, y: number) =>
  shape(`M${x} ${y - 8} L${x + 16} ${y} L${x} ${y + 8} Z`) + `<circle cx="${x + 19}" cy="${y}" r="3" class="fg"/>`;
/** AND 素子（左上 x, y、高さ 30）。出力は x ＋ 33, y ＋ 15 */
const andGate = (x: number, y: number) => shape(`M${x} ${y} H${x + 18} A15 15 0 0 1 ${x + 18} ${y + 30} H${x} Z`);
/** OR 素子（左上 x, y、高さ 30）。出力は x ＋ 40, y ＋ 15 */
const orGate = (x: number, y: number) =>
  shape(
    `M${x} ${y} Q${x + 12} ${y + 15} ${x} ${y + 30} Q${x + 28} ${y + 30} ${x + 40} ${y + 15} Q${x + 28} ${y} ${x} ${y} Z`,
  );

/** 令和元年度 秋期 問22：NOT・AND・OR の回路 */
export const r01aQ22 = svg(340, 124, [
  text(26, 22, "A", { fs: 12 }),
  text(26, 38, "B", { fs: 12 }),
  // A → NOT → 上の AND
  wire([
    [34, 22],
    [100, 22],
  ]),
  notGate(100, 22),
  wire([
    [122, 22],
    [150, 22],
  ]),
  // B → 上の AND
  wire([
    [34, 38],
    [150, 38],
  ]),
  andGate(150, 15),
  // A の分岐 → 下の AND
  wire([
    [70, 22],
    [70, 94],
    [150, 94],
  ]),
  dot(70, 22),
  // B の分岐 → NOT → 下の AND
  wire([
    [54, 38],
    [54, 108],
    [100, 108],
  ]),
  dot(54, 38),
  notGate(100, 108),
  wire([
    [122, 108],
    [150, 108],
  ]),
  andGate(150, 86),
  // 2 つの AND → OR
  wire([
    [183, 30],
    [206, 30],
    [206, 57],
    [234, 57],
  ]),
  wire([
    [183, 101],
    [206, 101],
    [206, 73],
    [234, 73],
  ]),
  orGate(230, 50),
  wire([
    [270, 65],
    [294, 65],
  ]),
  text(304, 65, "X", { fs: 12 }),
]);

/** 令和元年度 秋期 問33：利用者宅内の LAN とインターネットの接続 */
export const r01aQ33 = svg(340, 116, [
  box(4, 18, 240, 92, "", { kind: "muted", dashed: true }),
  text(244, 10, "利用者宅内", { anchor: "end", fs: 10, tone: "muted" }),
  box(12, 28, 40, 22, "PC", { fs: 11 }),
  text(32, 64, "⋮", { fs: 11 }),
  box(12, 78, 40, 22, "PC", { fs: 11 }),
  line([
    [52, 39],
    [66, 62],
  ]),
  line([
    [52, 89],
    [66, 66],
  ]),
  box(66, 52, 44, 24, "ハブ", { fs: 11 }),
  line([
    [110, 64],
    [122, 64],
  ]),
  box(122, 52, 58, 24, "装置A", { fs: 11 }),
  line([
    [180, 64],
    [192, 64],
  ]),
  box(192, 52, 46, 24, "ONU", { fs: 11 }),
  wire([
    [238, 64],
    [266, 64],
  ]),
  text(270, 44, ["光ファイバ", "ケーブル"], { fs: 9, tone: "muted" }),
  `<ellipse cx="300" cy="72" rx="34" ry="18" class="fb"/>`,
  text(300, 72, ["インター", "ネット"], { fs: 9 }),
]);

/** 令和元年度 秋期 問45：DFD の例 */
export const r01aQ45 = svg(340, 132, [
  box(14, 14, 56, 30, "", {}),
  arrow([
    [70, 29],
    [98, 29],
  ]),
  circle(114, 29, 15),
  arrow([
    [124, 41],
    [146, 62],
  ]),
  wire([
    [128, 64],
    [176, 64],
  ]),
  wire([
    [128, 76],
    [176, 76],
  ]),
  arrow([
    [158, 78],
    [178, 100],
  ]),
  circle(190, 108, 15),
  arrow([
    [201, 97],
    [222, 78],
  ]),
  circle(234, 66, 15),
  arrow([
    [249, 66],
    [272, 66],
  ]),
  box(274, 51, 56, 30, "", {}),
]);

/** 令和元年度 秋期 問52：アローダイアグラム（ダミー作業あり） */
export const r01aQ52 = arrowNet(
  340,
  150,
  { s: [16, 78], n1: [78, 26], n2: [124, 128], n3: [232, 128], n4: [262, 26], e: [324, 78] },
  [
    { from: "s", to: "n1", name: "A", days: "1" },
    { from: "s", to: "n2", name: "B", days: "5" },
    { from: "n1", to: "n2", name: "C", days: "3" },
    { from: "n1", to: "n4", name: "D", days: "3" },
    { from: "n2", to: "n3", name: "E", days: "4" },
    { from: "n3", to: "n4", dummy: true },
    { from: "n3", to: "e", name: "F", days: "5" },
    { from: "n4", to: "e", name: "G", days: "4" },
  ],
);

/* ---- 平成31年度 春期 午前（#71） ---- */

/** 平成31年度 春期 問5：選択肢の 4 つの 2 分木（どれも同じ形で、値だけが違う） */
export const h31hQ5 = (() => {
  // 根・左・右・左の左・左の右・右の左・右の右・右の左の左・右の左の右
  const trees: [string, number[]][] = [
    ["ア", [1, 2, 3, 4, 5, 6, 7, 8, 9]],
    ["イ", [4, 2, 8, 1, 3, 6, 9, 5, 7]],
    ["ウ", [7, 6, 8, 4, 5, 3, 9, 1, 2]],
    ["エ", [9, 7, 8, 1, 2, 5, 6, 3, 4]],
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
    [5, 7],
    [5, 8],
  ];
  const parts: string[] = [];
  trees.forEach(([name, v], k) => {
    const ox = (k % 2) * 170;
    const oy = Math.floor(k / 2) * 128;
    const at: Pt[] = [
      [ox + 92, oy + 16],
      [ox + 54, oy + 46],
      [ox + 130, oy + 46],
      [ox + 34, oy + 78],
      [ox + 74, oy + 78],
      [ox + 112, oy + 78],
      [ox + 152, oy + 78],
      [ox + 94, oy + 110],
      [ox + 130, oy + 110],
    ];
    parts.push(text(ox + 12, oy + 14, name, { fs: 13, bold: true }));
    for (const [p, c] of edges) parts.push(line([at[p]!, at[c]!]));
    v.forEach((n, i) => parts.push(circle(at[i]![0], at[i]![1], 11, String(n), { fs: 11 })));
  });
  return svg(340, 252, parts);
})();

/** 平成31年度 春期 問7：引き算の繰返しで最大公約数を求める流れ図 */
export const h31hQ7 = svg(340, 232, [
  terminal(170, 4, "開始"),
  down(170, 26, 38),
  shape("M120 38 H220 V72 H120 Z"),
  text(170, 55, ["L ← A", "S ← B"], { fs: FS_FLOW }),
  down(170, 72, 112),
  // 判断 L：S
  shape("M170 112 L216 130 L170 148 L124 130 Z"),
  text(170, 130, "L：S", { fs: FS_FLOW }),
  // L ＞ S：左へ
  line([
    [124, 130],
    [64, 130],
  ]),
  arrow([
    [64, 130],
    [64, 116],
  ]),
  text(110, 120, "＞", { fs: FS_FLOW }),
  shape("M14 92 H114 V116 H14 Z"),
  text(64, 104, "L ←（L － S）", { fs: FS_FLOW }),
  arrow([
    [64, 92],
    [64, 84],
    [170, 84],
  ]),
  // L ＜ S：右へ
  line([
    [216, 130],
    [276, 130],
  ]),
  arrow([
    [276, 130],
    [276, 116],
  ]),
  text(230, 120, "＜", { fs: FS_FLOW }),
  shape("M226 92 H326 V116 H226 Z"),
  text(276, 104, "S ←（S － L）", { fs: FS_FLOW }),
  arrow([
    [276, 92],
    [276, 84],
    [170, 84],
  ]),
  // L ＝ S：下へ
  down(170, 148, 162),
  text(182, 155, "＝", { fs: FS_FLOW }),
  shape("M120 162 H220 V196 H120 Z"),
  text(170, 179, ["A，B，L", "の出力"], { fs: FS_FLOW }),
  down(170, 196, 206),
  terminal(170, 206, "終了"),
]);

/** 平成31年度 春期 問22：入力 A，B と出力 X をもつ論理回路（中身は伏せてある） */
export const h31hQ22 = svg(340, 64, [
  text(112, 20, "A", { fs: 12 }),
  wire([
    [120, 20],
    [140, 20],
  ]),
  text(112, 44, "B", { fs: 12 }),
  wire([
    [120, 44],
    [140, 44],
  ]),
  shape("M140 8 H210 V56 H140 Z"),
  wire([
    [210, 32],
    [230, 32],
  ]),
  text(238, 32, "X", { fs: 12 }),
]);

/** 平成31年度 春期 問77：特性要因図の一部（b の矢印が，a へ向かう矢印に合流する） */
export const h31hQ77 = svg(340, 108, [
  arrow([
    [70, 22],
    [226, 22],
  ]),
  box(228, 8, 60, 28, "a", { fs: 12 }),
  arrow([
    [126, 74],
    [162, 24],
  ]),
  box(96, 74, 60, 28, "b", { fs: 12 }),
]);

/* ---- 平成30年度 秋期 午前（#71） ---- */

/** 平成30年度 秋期 問15：東京と福岡を結ぶ実線の回線と，大阪を経由する破線の迂回回線 */
export const h30aQ15 = svg(340, 112, [
  line([
    [88, 88],
    [252, 88],
  ]),
  line(
    [
      [82, 76],
      [146, 32],
    ],
    { dashed: true },
  ),
  line(
    [
      [194, 32],
      [258, 76],
    ],
    { dashed: true },
  ),
  circle(170, 24, 26, "大阪", { ry: 16 }),
  circle(60, 88, 28, "福岡", { ry: 16 }),
  circle(280, 88, 28, "東京", { ry: 16 }),
]);

/** 平成30年度 秋期 問26：部門・所属履歴・社員のクラス図（a，b が問われている多重度） */
export const h30aQ26 = svg(340, 64, [
  line([
    [70, 38],
    [134, 38],
  ]),
  line([
    [214, 38],
    [272, 38],
  ]),
  box(4, 24, 66, 28, "部門", { fs: 12 }),
  box(134, 24, 80, 28, "所属履歴", { fs: 12 }),
  box(272, 24, 64, 28, "社員", { fs: 12 }),
  text(80, 16, "1", { fs: 12 }),
  text(122, 16, "a", { fs: 13, tone: "accent", bold: true }),
  text(226, 16, "b", { fs: 13, tone: "accent", bold: true }),
  text(262, 16, "1", { fs: 12 }),
]);

/** 平成30年度 秋期 問52：アローダイアグラム（ダミー作業 2 本） */
export const h30aQ52 = arrowNet(
  340,
  160,
  { s: [16, 78], n2: [92, 78], n3: [204, 22], n4: [171, 78], n5: [171, 142], n6: [248, 78], e: [324, 78] },
  [
    { from: "s", to: "n2", name: "A", days: "10" },
    { from: "s", to: "n5", name: "B", days: "5" },
    { from: "n2", to: "n3", name: "C", days: "10" },
    { from: "n2", to: "n4", name: "D", days: "15" },
    { from: "n2", to: "n5", dummy: true },
    { from: "n4", to: "n3", dummy: true },
    { from: "n3", to: "n6", name: "E", days: "20" },
    { from: "n4", to: "n6", name: "F", days: "15" },
    { from: "n5", to: "n6", name: "G", days: "25" },
    { from: "n6", to: "e", name: "H", days: "10" },
  ],
);

/* ---- 平成30年度 春期 午前（#73） ---- */

/** 平成30年度 春期 問2：横 5 マス・縦 4 マスの格子。左下が P，右上が Q，R は P から右へ 2・上へ 2 の点 */
export const h30hQ2 = (() => {
  const [x0, y0, cw, ch] = [90, 112, 34, 24];
  const parts: string[] = [];
  for (let i = 0; i <= 5; i++)
    parts.push(
      line([
        [x0 + i * cw, y0],
        [x0 + i * cw, y0 - 4 * ch],
      ]),
    );
  for (let j = 0; j <= 4; j++)
    parts.push(
      line([
        [x0, y0 - j * ch],
        [x0 + 5 * cw, y0 - j * ch],
      ]),
    );
  const pt = (i: number, j: number, label: string, dx: number, dy: number) => [
    dot(x0 + i * cw, y0 - j * ch, 4.5),
    text(x0 + i * cw + dx, y0 - j * ch + dy, label, { fs: 13, bold: true }),
  ];
  parts.push(...pt(0, 0, "P", -12, 8), ...pt(5, 4, "Q", 13, -6), ...pt(2, 2, "R", -11, -9));
  return svg(340, 124, parts);
})();

/** 平成30年度 春期 問9：主記憶から，プロセッサ内の a を経て命令デコーダへ */
export const h30hQ9 = svg(340, 84, [
  box(112, 4, 224, 76, "", { kind: "muted" }),
  text(224, 18, "プロセッサ", { fs: 12 }),
  box(4, 34, 80, 30, "主記憶", { fs: 12 }),
  arrow([
    [84, 49],
    [124, 49],
  ]),
  box(124, 34, 86, 30, "a", { kind: "accent", fs: 13, bold: true }),
  arrow([
    [210, 49],
    [232, 49],
  ]),
  box(232, 34, 96, 30, "命令デコーダ", { fs: 12 }),
]);

/** 平成30年度 春期 問49：処理 1 → 判定（A＞6 or B＝0）→ Yes なら処理 2，No なら処理 2 を飛ばして合流 */
export const h30hQ49 = svg(340, 160, [
  line([
    [150, 2],
    [150, 10],
  ]),
  shape("M100 10 H200 V36 H100 Z"),
  text(150, 23, "処理 1", { fs: FS_FLOW }),
  down(150, 36, 50),
  shape("M150 50 L230 70 L150 90 L70 70 Z"),
  text(150, 70, "A＞6 or B＝0", { fs: FS_FLOW }),
  down(150, 90, 106),
  text(166, 98, "Yes", { fs: FS_FLOW, anchor: "start" }),
  shape("M100 106 H200 V132 H100 Z"),
  text(150, 119, "処理 2", { fs: FS_FLOW }),
  line([
    [150, 132],
    [150, 158],
  ]),
  line([
    [230, 70],
    [280, 70],
    [280, 146],
  ]),
  arrow([
    [280, 146],
    [152, 146],
  ]),
  text(250, 60, "No", { fs: FS_FLOW }),
]);

/** 平成30年度 春期 問51：アローダイアグラム（作業 A〜F） */
export const h30hQ51 = arrowNet(
  340,
  132,
  { s: [24, 30], n2: [184, 30], e: [316, 30], n3: [100, 106], n4: [240, 106] },
  [
    { from: "s", to: "n2", name: "A", days: "6" },
    { from: "s", to: "n3", name: "B", days: "3" },
    { from: "n3", to: "n2", name: "C", days: "4" },
    { from: "n2", to: "e", name: "D", days: "2" },
    { from: "n3", to: "n4", name: "E", days: "4" },
    { from: "n4", to: "e", name: "F", days: "1" },
  ],
);

/* ---- 平成29年度 春期 午前（#74） ---- */

/** 平成29年度 春期 問14：稼働率 R の装置を 2 台並列にした組を，2 組直列につないだもの */
export const h29hQ14 = (() => {
  const pair = (x: number) => [
    line([
      [x, 22],
      [x, 58],
    ]),
    line([
      [x + 110, 22],
      [x + 110, 58],
    ]),
    ...[22, 58].flatMap(y => [
      line([
        [x, y],
        [x + 20, y],
      ]),
      box(x + 20, y - 12, 70, 24, "R", { fs: 13 }),
      line([
        [x + 90, y],
        [x + 110, y],
      ]),
    ]),
  ];
  return svg(340, 80, [
    line([
      [20, 40],
      [50, 40],
    ]),
    ...pair(50),
    line([
      [160, 40],
      [180, 40],
    ]),
    ...pair(180),
    line([
      [290, 40],
      [320, 40],
    ]),
  ]);
})();

/** 平成29年度 春期 問18：ルートの下に A・B，その下にも A・B が 3 階層続くディレクトリの木 */
export const h29hQ18 = (() => {
  const parts: string[] = [text(170, 12, "ルート", { fs: 12 })];
  const levels = [
    { y: 52, xs: [90, 250] },
    { y: 92, xs: [50, 130, 210, 290] },
    { y: 132, xs: [30, 70, 110, 150, 190, 230, 270, 310] },
  ];
  let parents = [{ x: 170, y: 12 }];
  for (const { y, xs } of levels) {
    xs.forEach((x, i) => {
      const p = parents[Math.floor(i / 2)]!;
      parts.push(
        line([
          [p.x, p.y + 8],
          [x, y - 9],
        ]),
        text(x, y, i % 2 === 0 ? "A" : "B", { fs: 13 }),
      );
    });
    parents = xs.map(x => ({ x, y }));
  }
  return svg(340, 144, parts);
})();

/** 平成29年度 春期 問22：x と y を素子 A と素子 B の両方に入れる半加算器。A の出力が z，B の出力が c */
export const h29hQ22 = svg(340, 100, [
  text(12, 20, "x", { fs: 13 }),
  text(12, 36, "y", { fs: 13 }),
  line([
    [22, 20],
    [120, 20],
  ]),
  line([
    [22, 36],
    [120, 36],
  ]),
  dot(60, 20, 3),
  dot(84, 36, 3),
  line([
    [60, 20],
    [60, 70],
    [120, 70],
  ]),
  line([
    [84, 36],
    [84, 86],
    [120, 86],
  ]),
  box(120, 12, 56, 32, "A", { fs: 13, bold: true }),
  box(120, 62, 56, 32, "B", { fs: 13, bold: true }),
  line([
    [176, 28],
    [204, 28],
  ]),
  line([
    [176, 78],
    [204, 78],
  ]),
  text(210, 28, "z（和の 1 桁目）", { fs: 12, anchor: "start" }),
  text(210, 78, "c（桁上げ）", { fs: 12, anchor: "start" }),
]);
