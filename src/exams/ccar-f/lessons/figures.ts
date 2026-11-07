/* 教科書 CCAR-F の図。座標は幅 340 の図の中の位置。文字が枠に収まるかはテストで確かめる */
import { arrow, box, line, svg, text } from "../../figure";

const S = { fs: 12, tone: "muted" } as const;

/** はじめに：ツールの 1 往復（アプリと Claude のやり取り） */
export const toolRoundTrip = svg(340, 246, [
  line(
    [
      [80, 42],
      [80, 240],
    ],
    { dashed: true },
  ),
  line(
    [
      [260, 42],
      [260, 240],
    ],
    { dashed: true },
  ),
  box(20, 10, 120, 32, "アプリ", { bold: true }),
  box(200, 10, 120, 32, "Claude", { bold: true }),
  text(170, 60, "① 質問＋ツールの一覧", { fs: 12 }),
  arrow([
    [80, 70],
    [258, 70],
  ]),
  text(170, 100, "② tool_use（呼びたい）", { fs: 12 }),
  arrow([
    [260, 110],
    [82, 110],
  ]),
  box(20, 136, 120, 28, "③ ツールを実行", { kind: "accent", fs: 12 }),
  text(170, 180, "④ tool_result（結果）", { fs: 12 }),
  arrow([
    [80, 190],
    [258, 190],
  ]),
  text(170, 220, "⑤ 答え（end_turn）", { fs: 12 }),
  arrow([
    [260, 230],
    [82, 230],
  ]),
  text(336, 150, ["②〜④を", "繰り返す"], { ...S, anchor: "end" }),
]);

/** はじめに：MCP は使う側と提供する側をつなぐ共通の決まり */
export const mcpBridge = svg(340, 166, [
  text(60, 12, "使う側", S),
  text(280, 12, "提供する側", S),
  box(10, 30, 100, 40, "Claude Code"),
  box(10, 110, 100, 40, ["自作の", "エージェント"], { fs: 12 }),
  box(140, 22, 60, 136, "MCP", { kind: "accent", bold: true }),
  box(230, 30, 100, 40, ["GitHub の", "MCP サーバー"], { fs: 12 }),
  box(230, 110, 100, 40, ["社内 DB の", "MCP サーバー"], { fs: 12 }),
  ...(
    [
      [110, 140, 50],
      [110, 140, 130],
      [200, 230, 50],
      [200, 230, 130],
    ] as const
  ).map(([a, b, y]) =>
    arrow(
      [
        [a + 2, y],
        [b - 2, y],
      ],
      { both: true },
    ),
  ),
]);

/** 1.1：エージェントループ */
export const agentLoop = svg(340, 262, [
  box(85, 10, 170, 36, "Messages API を呼ぶ"),
  box(85, 76, 170, 36, "stop_reason を見る", { kind: "accent" }),
  box(20, 150, 150, 36, "ツールを実行"),
  box(20, 216, 150, 36, "結果を会話に足す"),
  box(200, 150, 125, 36, "ループを抜ける", { kind: "ok" }),
  arrow([
    [170, 46],
    [170, 76],
  ]),
  arrow([
    [120, 112],
    [120, 150],
  ]),
  text(126, 131, '"tool_use"', { ...S, anchor: "start" }),
  arrow([
    [230, 112],
    [230, 150],
  ]),
  text(236, 131, '"end_turn"', { ...S, anchor: "start" }),
  arrow([
    [95, 186],
    [95, 216],
  ]),
  arrow(
    [
      [20, 234],
      [8, 234],
      [8, 28],
      [85, 28],
    ],
    { tone: "accent" },
  ),
]);

/** 1.2：ハブ＆スポーク */
export const hubAndSpoke = svg(340, 180, [
  box(95, 10, 150, 40, "コーディネーター", { kind: "accent", bold: true }),
  ...(
    [
      [10, "検索役"],
      [125, "分析役"],
      [240, "まとめ役"],
    ] as const
  ).map(([x, l]) => box(x, 120, 90, 40, l)),
  arrow(
    [
      [125, 52],
      [57, 118],
    ],
    { both: true },
  ),
  arrow(
    [
      [170, 52],
      [170, 118],
    ],
    { both: true },
  ),
  arrow(
    [
      [215, 52],
      [283, 118],
    ],
    { both: true },
  ),
  text(16, 80, ["依頼と", "報告"], { ...S, anchor: "start" }),
  text(112.5, 140, "×", { fs: 15, tone: "ng", bold: true }),
  text(227.5, 140, "×", { fs: 15, tone: "ng", bold: true }),
  text(170, 172, "サブエージェント同士は直接やり取りしない", S),
]);

/** 1.2：親とサブエージェントの文脈は分かれている */
export const subagentContext = svg(340, 170, [
  box(10, 10, 115, 150, []),
  text(67.5, 28, "コーディネーター", { fs: 12, bold: true }),
  text(67.5, 82, ["会話の全体", "ツールの結果", "決めたこと"], { fs: 12 }),
  box(215, 10, 115, 150, []),
  text(272.5, 28, "サブエージェント", { fs: 12, bold: true }),
  text(272.5, 82, ["渡された文字列", "読んだファイル", "検索の結果"], { fs: 12 }),
  text(272.5, 138, "（親には戻らない）", { fs: 12, tone: "muted" }),
  text(170, 44, ["プロンプトの", "文字列だけ"], { fs: 12, tone: "accent" }),
  arrow(
    [
      [127, 62],
      [213, 62],
    ],
    { tone: "accent" },
  ),
  text(170, 104, ["最後の", "報告だけ"], { fs: 12, tone: "accent" }),
  arrow(
    [
      [213, 122],
      [127, 122],
    ],
    { tone: "accent" },
  ),
]);

/** 1.5：フックが動く位置 */
export const hookPoints = svg(340, 278, [
  ...(
    [
      [10, "Claude が呼ぶと決める", "plain"],
      [66, "PreToolUse", "accent"],
      [122, "ツールを実行", "plain"],
      [178, "PostToolUse", "accent"],
      [234, "Claude が結果を読む", "plain"],
    ] as const
  ).map(([y, l, kind]) => box(15, y, 165, 34, l, { kind, bold: kind === "accent" })),
  ...[44, 100, 156, 212].map(y =>
    arrow([
      [97.5, y],
      [97.5, y + 22],
    ]),
  ),
  text(192, 83, ["止める（deny）", "書き換える・確認する"], { fs: 12, anchor: "start" }),
  text(192, 139, "ここで実際に動く", { ...S, anchor: "start" }),
  text(192, 188, ["情報を足す", "結果を差し替える"], { fs: 12, anchor: "start" }),
  text(192, 214, "取り消しはできない", { fs: 12, anchor: "start", tone: "ng" }),
]);

/** 1.6：固定のパイプラインと動的な分解 */
export const twoDecompositions = svg(340, 180, [
  text(10, 16, "固定のパイプライン：工程は前もって決まっている", { fs: 12, anchor: "start", bold: true }),
  box(10, 30, 92, 32, "洗い出す"),
  box(124, 30, 92, 32, "整理する"),
  box(238, 30, 92, 32, "報告する"),
  arrow([
    [102, 46],
    [122, 46],
  ]),
  arrow([
    [216, 46],
    [236, 46],
  ]),
  text(10, 90, "動的な分解：調べながら決める", { fs: 12, anchor: "start", bold: true }),
  box(10, 104, 84, 32, "構造をつかむ", { fs: 12 }),
  box(116, 104, 96, 32, "重要な所を探す", { fs: 12 }),
  box(234, 104, 96, 32, "計画して進める", { fs: 12, kind: "accent" }),
  arrow([
    [94, 120],
    [114, 120],
  ]),
  arrow([
    [212, 120],
    [232, 120],
  ]),
  arrow(
    [
      [282, 136],
      [282, 156],
      [52, 156],
      [52, 138],
    ],
    { tone: "accent", dashed: true },
  ),
  text(167, 168, "分かったことで計画を直す", { fs: 12, tone: "accent" }),
]);

/** 1.6・4.6：2 段のレビュー */
export const twoPassReview = svg(340, 196, [
  ...[10, 93, 176, 259].map((x, i) => box(x, 10, 70, 28, `${"abcd"[i]}.ts`, { fs: 12 })),
  ...[10, 93, 176, 259].map(x =>
    arrow([
      [x + 35, 38],
      [x + 35, 60],
    ]),
  ),
  ...[10, 93, 176, 259].map((x, i) => box(x, 62, 70, 30, `${"abcd"[i]} の中`, { fs: 12 })),
  ...[10, 93, 176, 259].map(x =>
    arrow([
      [x + 35, 92],
      [x + 35 + (170 - (x + 35)) * 0.35, 128],
    ]),
  ),
  box(10, 130, 320, 34, "2 段目：ファイルをまたぐ流れを見る", { kind: "accent" }),
  text(170, 180, "1 段目（中段）はファイルごと、2 段目でまとめて見る", S),
]);

/** 1.7：再開と分岐 */
export const sessionFork = svg(340, 200, [
  text(10, 12, "会話の履歴の流れ", { ...S, anchor: "start" }),
  box(10, 30, 130, 44, ["セッション A", "認証を分析"]),
  box(192, 30, 138, 44, ["A の続き", "リファクタリング"]),
  text(166, 42, "--resume", { fs: 12, tone: "accent" }),
  arrow(
    [
      [140, 54],
      [190, 54],
    ],
    { tone: "accent" },
  ),
  box(192, 110, 138, 44, ["セッション B（分岐）", "OAuth2 で考える"], { fs: 12 }),
  arrow(
    [
      [75, 74],
      [75, 132],
      [190, 132],
    ],
    { tone: "accent" },
  ),
  text(133, 122, "--fork-session", { fs: 12, tone: "accent" }),
  text(10, 172, "A は変わらない。B は A の履歴のコピーから始まる", { ...S, anchor: "start" }),
  text(10, 190, "ファイルは A も B も同じものを見る（コピーされない）", { fs: 12, anchor: "start", tone: "ng" }),
]);

/** 2.4：MCP のスコープと優先順位 */
export const mcpScopes = svg(340, 192, [
  text(28, 12, "強い", { fs: 12, tone: "accent", bold: true }),
  arrow(
    [
      [28, 22],
      [28, 168],
    ],
    { tone: "accent" },
  ),
  text(28, 182, "弱い", S),
  box(58, 24, 272, 44, ["ローカル（既定）", "自分だけ・このプロジェクトだけ"], { fs: 12 }),
  box(58, 76, 272, 44, ["プロジェクト（.mcp.json）", "チームで共有（リポジトリに入る）"], { fs: 12, kind: "accent" }),
  box(58, 128, 272, 44, ["ユーザー", "自分だけ・全プロジェクト"], { fs: 12 }),
]);

/** 3.1：CLAUDE.md の読まれ方 */
export const claudeMdLoading = svg(340, 212, [
  box(10, 10, 190, 30, "~/.claude/CLAUDE.md", { fs: 12 }),
  box(10, 50, 190, 30, "repo/CLAUDE.md", { fs: 12 }),
  box(10, 90, 190, 30, "repo/CLAUDE.local.md", { fs: 12 }),
  text(208, 25, "① 起動時に読む", { fs: 12, anchor: "start" }),
  text(208, 65, "② 起動時に読む", { fs: 12, anchor: "start" }),
  text(208, 105, "③ 起動時に読む", { fs: 12, anchor: "start" }),
  line(
    [
      [10, 134],
      [330, 134],
    ],
    { dashed: true },
  ),
  text(10, 148, "ここから下は、触ったときに読む", { ...S, anchor: "start" }),
  box(30, 162, 190, 30, "packages/api/CLAUDE.md", { fs: 12 }),
  text(228, 177, ["④ api の中の", "ファイルを触ったら"], { fs: 12, anchor: "start" }),
]);

/** 4.4：検証して直させる */
export const validateRetry = svg(340, 252, [
  box(20, 10, 160, 34, "抜き出す"),
  box(20, 74, 160, 34, "プログラムで検証", { kind: "accent" }),
  box(220, 74, 105, 34, "使う", { kind: "ok" }),
  box(20, 148, 160, 50, ["直させる：元の文書・", "前の結果・検証エラー"], { fs: 12 }),
  arrow([
    [100, 44],
    [100, 72],
  ]),
  arrow([
    [180, 91],
    [218, 91],
  ]),
  text(199, 80, "合う", S),
  arrow([
    [100, 108],
    [100, 146],
  ]),
  text(106, 127, "合わない", { ...S, anchor: "start" }),
  arrow(
    [
      [20, 173],
      [8, 173],
      [8, 27],
      [18, 27],
    ],
    { tone: "accent" },
  ),
  box(20, 214, 305, 30, "原文に無い情報は出てこない → null にして人へ", { kind: "ng", fs: 12 }),
]);

/** 4.5：締め切りから提出の間隔を逆算する */
export const batchDeadline = svg(340, 146, [
  text(20, 30, "依頼が届く", { fs: 12, anchor: "start" }),
  arrow([
    [26, 40],
    [26, 68],
  ]),
  text(120, 30, "提出", { fs: 12 }),
  arrow([
    [120, 40],
    [120, 68],
  ]),
  text(332, 30, "締め切り", { fs: 12, anchor: "end", tone: "ng" }),
  line(
    [
      [320, 40],
      [320, 118],
    ],
    { tone: "ng", dashed: true },
  ),
  box(20, 70, 100, 30, "提出を待つ", { kind: "muted", fs: 12 }),
  box(120, 70, 200, 30, "処理（最大 24）", { kind: "accent", fs: 12 }),
  line([
    [20, 118],
    [320, 118],
  ]),
  ...(
    [
      [20, "0 時間"],
      [120, "12"],
      [220, "24"],
      [320, "36"],
    ] as const
  ).map(
    ([x, l], i) =>
      line([
        [x, 114],
        [x, 122],
      ]) + text(x, 134, l, i === 0 ? { ...S, anchor: "start" } : S),
  ),
]);

/** 5.1：毎回のプロンプトの中身（事実は要約の外） */
export const contextLayout = svg(340, 250, [
  box(10, 10, 320, 230, []),
  text(22, 26, "毎回のプロンプト", { fs: 12, anchor: "start", bold: true }),
  box(24, 40, 292, 32, "システムプロンプト"),
  box(24, 80, 292, 32, "事実のブロック（要約しない・毎回入れる）", { kind: "accent", fs: 12 }),
  box(24, 120, 292, 32, "古い会話の要約", { kind: "muted", dashed: true }),
  box(24, 160, 292, 32, "最近の会話"),
  box(24, 200, 292, 32, "今の質問（最後に置く）"),
]);
