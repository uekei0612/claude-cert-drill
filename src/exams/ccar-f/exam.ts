/* Claude Certified Architect – Foundations（CCAR-F）。
   分野・細目の名前と配点は Anthropic の試験ガイド（Version 0.1）に合わせる。
   シナリオの文・要点・問題はすべて自分の言葉で書く（ガイドの本文やサンプル問題は載せない）。 */
import type { Domain, Exam, Scenario } from "../../core/exam/types";
import { ja } from "./ja";
import { meta } from "./meta";
import { lessons, primer } from "./lessons";
import { notes } from "./notes";
import { questions } from "./questions";

const domains: Domain[] = [
  {
    id: "d1",
    title: "Agentic Architecture & Orchestration",
    ja: "エージェント設計とオーケストレーション",
    weight: 0.27,
    tasks: [
      {
        id: "1.1",
        title: "Design and implement agentic loops for autonomous task execution",
        ja: "エージェントループの設計と実装",
      },
      {
        id: "1.2",
        title: "Orchestrate multi-agent systems with coordinator-subagent patterns",
        ja: "コーディネーターとサブエージェントによる連携",
      },
      {
        id: "1.3",
        title: "Configure subagent invocation, context passing, and spawning",
        ja: "サブエージェントの起動と文脈の渡し方",
      },
      {
        id: "1.4",
        title: "Implement multi-step workflows with enforcement and handoff patterns",
        ja: "手順の強制と引き継ぎ",
      },
      {
        id: "1.5",
        title: "Apply Agent SDK hooks for tool call interception and data normalization",
        ja: "フックによるツール呼び出しの介入と正規化",
      },
      { id: "1.6", title: "Design task decomposition strategies for complex workflows", ja: "複雑な作業の分解" },
      { id: "1.7", title: "Manage session state, resumption, and forking", ja: "セッションの再開と分岐" },
    ],
  },
  {
    id: "d2",
    title: "Tool Design & MCP Integration",
    ja: "ツール設計と MCP",
    weight: 0.18,
    tasks: [
      {
        id: "2.1",
        title: "Design effective tool interfaces with clear descriptions and boundaries",
        ja: "ツールの説明と境界の設計",
      },
      { id: "2.2", title: "Implement structured error responses for MCP tools", ja: "MCP ツールの構造化エラー" },
      {
        id: "2.3",
        title: "Distribute tools appropriately across agents and configure tool choice",
        ja: "ツールの配分と tool_choice",
      },
      { id: "2.4", title: "Integrate MCP servers into Claude Code and agent workflows", ja: "MCP サーバーの組み込み" },
      {
        id: "2.5",
        title: "Select and apply built-in tools (Read, Write, Edit, Bash, Grep, Glob) effectively",
        ja: "組み込みツールの使い分け",
      },
    ],
  },
  {
    id: "d3",
    title: "Claude Code Configuration & Workflows",
    ja: "Claude Code の設定とワークフロー",
    weight: 0.2,
    tasks: [
      {
        id: "3.1",
        title: "Configure CLAUDE.md files with appropriate hierarchy, scoping, and modular organization",
        ja: "CLAUDE.md の階層と分割",
      },
      { id: "3.2", title: "Create and configure custom slash commands and skills", ja: "スラッシュコマンドとスキル" },
      {
        id: "3.3",
        title: "Apply path-specific rules for conditional convention loading",
        ja: "パスごとのルール（.claude/rules）",
      },
      {
        id: "3.4",
        title: "Determine when to use plan mode vs direct execution",
        ja: "プランモードと直接実行の使い分け",
      },
      {
        id: "3.5",
        title: "Apply iterative refinement techniques for progressive improvement",
        ja: "反復による改善の進め方",
      },
      { id: "3.6", title: "Integrate Claude Code into CI/CD pipelines", ja: "CI/CD への組み込み" },
    ],
  },
  {
    id: "d4",
    title: "Prompt Engineering & Structured Output",
    ja: "プロンプト設計と構造化出力",
    weight: 0.2,
    tasks: [
      {
        id: "4.1",
        title: "Design prompts with explicit criteria to improve precision and reduce false positives",
        ja: "明確な基準で誤検出を減らす",
      },
      {
        id: "4.2",
        title: "Apply few-shot prompting to improve output consistency and quality",
        ja: "few-shot で出力を揃える",
      },
      {
        id: "4.3",
        title: "Enforce structured output using tool use and JSON schemas",
        ja: "tool use と JSON スキーマで構造化出力",
      },
      {
        id: "4.4",
        title: "Implement validation, retry, and feedback loops for extraction quality",
        ja: "検証・再試行・フィードバック",
      },
      { id: "4.5", title: "Design efficient batch processing strategies", ja: "バッチ処理の設計" },
      {
        id: "4.6",
        title: "Design multi-instance and multi-pass review architectures",
        ja: "別インスタンス・複数パスのレビュー",
      },
    ],
  },
  {
    id: "d5",
    title: "Context Management & Reliability",
    ja: "コンテキスト管理と信頼性",
    weight: 0.15,
    tasks: [
      {
        id: "5.1",
        title: "Manage conversation context to preserve critical information across long interactions",
        ja: "長い対話で重要な情報を保つ",
      },
      {
        id: "5.2",
        title: "Design effective escalation and ambiguity resolution patterns",
        ja: "エスカレーションと曖昧さの解消",
      },
      {
        id: "5.3",
        title: "Implement error propagation strategies across multi-agent systems",
        ja: "マルチエージェントでのエラーの伝え方",
      },
      {
        id: "5.4",
        title: "Manage context effectively in large codebase exploration",
        ja: "大きなコードベースの探索とコンテキスト",
      },
      {
        id: "5.5",
        title: "Design human review workflows and confidence calibration",
        ja: "人のレビューと確信度の較正",
      },
      {
        id: "5.6",
        title: "Preserve information provenance and handle uncertainty in multi-source synthesis",
        ja: "出典の保持と不確かさの扱い",
      },
    ],
  },
];

const scenarios: Scenario[] = [
  {
    id: "s1",
    title: "Customer Support Resolution Agent",
    ja: "サポート対応エージェント",
    context:
      "Your company is building a customer support agent on the Claude Agent SDK. It handles open-ended requests such as returns, billing disputes, and account problems. The agent reaches backend systems through custom MCP tools: get_customer, lookup_order, process_refund, and escalate_to_human. The business goal is to resolve at least 80% of contacts on first touch, while still handing off to a human when that is the right call.",
    domains: ["d1", "d2", "d5"],
  },
  {
    id: "s2",
    title: "Code Generation with Claude Code",
    ja: "Claude Code での開発",
    context:
      "Your engineering team uses Claude Code day to day for writing new code, refactoring, debugging, and documentation. You are responsible for making it fit the team's workflow: shared CLAUDE.md configuration, custom slash commands and skills, and clear guidance on when to plan first and when to just make the change.",
    domains: ["d3", "d5"],
  },
  {
    id: "s3",
    title: "Multi-Agent Research System",
    ja: "マルチエージェントの調査システム",
    context:
      "You are building a research system on the Claude Agent SDK. A coordinator agent delegates work to specialist subagents: a web search agent, a document analysis agent, a synthesis agent, and a report writing agent. Given a topic, the system produces a thorough report in which every claim is backed by a citation.",
    domains: ["d1", "d2", "d5"],
  },
  {
    id: "s4",
    title: "Developer Productivity with Claude",
    ja: "開発生産性ツール",
    context:
      "You are building an internal developer assistant on the Claude Agent SDK. Engineers use it to get oriented in unfamiliar repositories, understand legacy code, scaffold boilerplate, and automate repetitive chores. The agent has the built-in tools (Read, Write, Edit, Bash, Grep, Glob) and also connects to several MCP servers.",
    domains: ["d2", "d3", "d1"],
  },
  {
    id: "s5",
    title: "Claude Code for Continuous Integration",
    ja: "CI/CD での Claude Code",
    context:
      "You are adding Claude Code to your CI/CD pipeline. On each pull request it reviews the change, proposes tests, and posts feedback. Developers will only keep reading the feedback if it is actionable and rarely wrong, so false positives are a primary concern.",
    domains: ["d3", "d4"],
  },
  {
    id: "s6",
    title: "Structured Data Extraction",
    ja: "構造化データの抽出",
    context:
      "You are building a pipeline that uses Claude to pull structured records out of unstructured documents such as invoices, contracts, and reports. Output is validated against JSON schemas before it is handed to downstream systems. Accuracy has to stay high, and unusual documents must be handled without breaking the pipeline.",
    domains: ["d4", "d5"],
  },
];

export const ccarF: Exam = {
  ...meta,
  domains,
  scenarios,
  questions,
  notes,
  lessons,
  primer,
  translations: { ja },
  outOfScope: [
    "Claude のファインチューニング、独自モデルの学習",
    "API の認証・課金・アカウント管理（OAuth、API キーのローテーションを含む）",
    "特定のプログラミング言語やフレームワークの詳しい実装（ツールとスキーマの設定に要る範囲を除く）",
    "MCP サーバーのデプロイやホスティング（インフラ、ネットワーク、コンテナ）",
    "Claude の内部構造・学習方法・重み、Constitutional AI・RLHF などの安全性の学習手法",
    "埋め込みモデル、ベクトルデータベースの実装",
    "computer use（ブラウザやデスクトップの操作）、画像の解析",
    "ストリーミング API、サーバー送信イベント（SSE）",
    "レート制限・クォータ・料金の計算",
    "特定のクラウド（AWS・GCP・Azure）の設定",
    "性能ベンチマーク、モデル同士の比較",
    "プロンプトキャッシュの実装の詳細（存在を知っている程度は範囲内）",
    "トークンの数え方、トークン化の仕組み",
  ],
  sources: [
    {
      label: "分野・配点・細目・シナリオ・合格点・範囲外",
      note: "Anthropic の試験ガイド（Version 0.1）による",
    },
    { label: "60 問・120 分", note: "第三者の試験対策サイトの情報。公式の案内で確かめること" },
    {
      label: "合格の目安 75%",
      note: "このアプリの独自の目安。公式の換算式は非公開で、720 / 1000 は正答率 72% という意味ではない",
    },
    { label: "問題・解説・要点", note: "このアプリで自作したもの。Anthropic の公式の問題ではない" },
  ],
};
