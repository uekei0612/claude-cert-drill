/* 科目B の問題の図を、原文の図の配置をなぞって SVG で描き直したもの（#66）。
   描き直した図を使う問題は、出典に「一部改変」を添える */
import { arrow, circle, line, svg, text, wire } from "../../core/exam/figure";

type Pt = readonly [number, number];

/** サンプル問題 問9：14 個の節の 2 分木（○の中は節番号。子が一つなら左の子） */
export const sampleQ9 = (() => {
  const leaf = (k: number) => 22 + k * 42.3;
  const at: Record<number, Pt> = {
    1: [170, 18],
    2: [85, 62],
    3: [255, 62],
    4: [(leaf(0) + leaf(1)) / 2, 106],
    5: [(leaf(2) + leaf(3)) / 2, 106],
    6: [(leaf(4) + leaf(5)) / 2, 106],
    7: [(leaf(6) + leaf(7)) / 2, 106],
  };
  for (let k = 0; k < 7; k++) at[8 + k] = [leaf(k), 150];
  const edges: [number, number][] = [
    [1, 2],
    [1, 3],
    [2, 4],
    [2, 5],
    [3, 6],
    [3, 7],
    [4, 8],
    [4, 9],
    [5, 10],
    [5, 11],
    [6, 12],
    [6, 13],
    [7, 14],
  ];
  return svg(340, 168, [
    ...edges.map(([p, q]) => line([at[p]!, at[q]!])),
    ...Object.entries(at).map(([k, [x, y]]) => circle(x, y, 13, k, { fs: 12 })),
  ]);
})();

/** 三目並べの盤面（cells は 9 文字。x＝×、o＝○、空白＝空き）。左上が x, y、1 マス 15 */
function board(x: number, y: number, cells: string): string {
  const c = 15;
  const parts: string[] = [];
  for (let i = 0; i <= 3; i++) {
    parts.push(
      wire([
        [x, y + i * c],
        [x + 3 * c, y + i * c],
      ]),
      wire([
        [x + i * c, y],
        [x + i * c, y + 3 * c],
      ]),
    );
  }
  [...cells].forEach((ch, i) => {
    if (ch === " ") return;
    parts.push(text(x + (i % 3) * c + c / 2, y + Math.floor(i / 3) * c + c / 2, ch === "x" ? "×" : "○", { fs: 11 }));
  });
  return parts.join("");
}

/** サンプル問題 問15：三目並べの状態遷移 */
export const sampleQ15 = (() => {
  const w = 45;
  // 盤の中心の x と上端の y、盤面
  const nodes: Record<string, [number, number, string]> = {
    root: [170, 16, "xoxxoo   "],
    a: [70, 98, "xoxxooo  "],
    m: [170, 98, "xoxxoo o "],
    b: [270, 98, "xoxxoo  o"],
    a1: [32, 192, "xoxxooox "],
    a2: [108, 192, "xoxxooo x"],
    b1: [232, 192, "xoxxoox o"],
    b2: [308, 192, "xoxxoo xo"],
    a1x: [32, 286, "xoxxoooxo"],
    a2x: [108, 286, "xoxxoooox"],
    b2x: [308, 286, "xoxxoooxo"],
  };
  const parts: string[] = [];
  const bottom = (k: string): Pt => [nodes[k]![0], nodes[k]![1] + w];
  const top = (k: string): Pt => [nodes[k]![0], nodes[k]![1]];
  const edges: [string, string][] = [
    ["root", "a"],
    ["root", "m"],
    ["root", "b"],
    ["a", "a1"],
    ["a", "a2"],
    ["b", "b1"],
    ["b", "b2"],
    ["a1", "a1x"],
    ["a2", "a2x"],
    ["b2", "b2x"],
  ];
  for (const [p, q] of edges) {
    const [x2, y2] = top(q);
    parts.push(arrow([bottom(p), [x2, y2 - 2]]));
  }
  parts.push(text(140, 72, "A", { fs: 12, bold: true }), text(200, 72, "B", { fs: 12, bold: true }));
  for (const [x, y, cells] of Object.values(nodes)) parts.push(board(x - w / 2, y, cells));
  parts.push(text(170, 8, "根の状態", { fs: 10 }));
  const note = (k: string, lines: [string, string]) =>
    parts.push(text(nodes[k]![0], nodes[k]![1] + w + 15, lines, { fs: 10 }));
  note("m", ["勝ち", "評価値 10"]);
  note("b1", ["負け", "評価値 －10"]);
  note("a1x", ["引き分け", "評価値 0"]);
  note("a2x", ["勝ち", "評価値 10"]);
  note("b2x", ["引き分け", "評価値 0"]);
  return svg(340, 362, parts);
})();
