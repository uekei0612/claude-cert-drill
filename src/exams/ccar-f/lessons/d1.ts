/* 教科書 D1：エージェント設計とオーケストレーション。仕様は公式ドキュメントで確かめた（2026-11-04） */
import type { Lesson } from "../../types";

const SDK = "https://code.claude.com/docs/en/agent-sdk";
const API = "https://platform.claude.com/docs/en";

export const d1: Record<string, Lesson> = {
  "1.1": {
    lead: "Claude にツールを渡し、次に何をするかを Claude 自身に選ばせる「エージェントループ」の回し方と、正しい止め方を学びます。",
    sections: [
      {
        h: "ループの形",
        body: [
          "エージェントループは、Messages API の呼び出しを繰り返すだけの単純な仕組みです。Claude は呼び出しのたびに、答えを返すか、ツールを使いたいと伝えてきます。どちらなのかは応答の `stop_reason` に出ます。",
          {
            list: [
              '`stop_reason` が `"tool_use"`：応答の中の `tool_use` ブロック（`id`・`name`・`input`）に従ってツールを実行し、結果を会話に足して、もう一度呼ぶ',
              '`stop_reason` が `"end_turn"`：Claude が答え終えた。ループを抜ける',
            ],
          },
          "次にどのツールを呼ぶか、あるいはもう答えるかは、Claude が直前のツールの結果を読んで決めます。プログラムが決めるのは「回し続けるか」だけです。",
        ],
      },
      {
        h: "最小のループ（TypeScript）",
        body: [
          {
            lang: "ts",
            code: `const messages = [{ role: "user", content: question }];
while (true) {
  const res = await client.messages.create({ model, max_tokens: 4096, tools, messages });
  messages.push({ role: "assistant", content: res.content }); // 応答はそのまま履歴へ
  if (res.stop_reason !== "tool_use") break;                  // end_turn なら終わり

  const results = [];
  for (const block of res.content) {
    if (block.type !== "tool_use") continue;
    const out = await runTool(block.name, block.input);
    results.push({
      type: "tool_result",
      tool_use_id: block.id,          // どの呼び出しへの結果か
      content: out.text,
      is_error: out.failed,           // 失敗したら true
    });
  }
  messages.push({ role: "user", content: results }); // 結果は user の発言として返す
}`,
          },
        ],
      },
      {
        h: "結果の返し方の決まり",
        body: [
          {
            list: [
              "`tool_result` は `user` ロールのメッセージに入れ、ツールを呼んだ `assistant` のメッセージの直後に置く。間に別のメッセージを挟めない",
              "同じメッセージに文章も足すなら、`tool_result` を先に並べ、文章はその後ろ",
              "1 回の応答で複数のツールが呼ばれたら（並列のツール呼び出し）、すべての結果を 1 つの `user` メッセージにまとめて返す",
              "ツールが失敗したら `is_error: true` を付け、何が起きて次に何をすればよいかを書く（「failed」だけでは Claude が立て直せない）",
            ],
          },
          "API はサーバー側に会話を持ちません。毎回、それまでの会話の全体（ツールの呼び出しと結果を含む）を `messages` に入れて送ります。",
        ],
      },
      {
        h: "止め方を間違えない",
        body: [
          "終わったかどうかは `stop_reason` で判断します。次のやり方はどれも壊れます。",
          {
            list: [
              "応答の文章に「完了しました」などの言葉があるかで判定する：言い回しは毎回変わる",
              "応答に文章が含まれていたら完了とみなす：Claude はツールを呼ぶ前に「天気を調べます」のような前置きをよく書く。文章とツール呼び出しは同じ応答に並ぶ",
              "回数の上限を主な止め方にする：上限は暴走を止める安全装置で、作業が終わったことを意味しない",
            ],
          },
          "ほかの値も扱います。`max_tokens` は出力が途中で切れたことを、`refusal` は Claude が応じなかったことを表します。どちらも「答え終えた」ではありません。",
        ],
      },
      {
        h: "Agent SDK ではループを SDK が回す",
        body: [
          "Claude Agent SDK の `query()` は、このループ（ツールの実行と結果の返却）を内部で回します。アプリは流れてくるメッセージを読み、最後の `result` メッセージで結果を受け取ります。",
          "`maxTurns`（Python は `max_turns`）や `maxBudgetUsd` で上限を決められます。上限に当たると `result` の `subtype` が `error_max_turns`・`error_max_budget_usd` になります。成功した終わりの `success` と区別して扱います。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "「ツールの結果を見て次の行動を Claude に選ばせる」のがエージェントで、手順を決め打ちした決定木はエージェントではありません。選択肢に「文言で終わりを判定」「回数で止める」が出てきたら、`stop_reason` を見る答えを選びます。",
        ],
      },
    ],
    refs: [
      {
        label: "Handle tool calls（tool_result の形と is_error）",
        url: `${API}/agents-and-tools/tool-use/handle-tool-calls`,
      },
      { label: "Define tools（ツールの定義）", url: `${API}/agents-and-tools/tool-use/define-tools` },
      { label: "How the agent loop works（Agent SDK）", url: `${SDK}/agent-loop` },
    ],
  },

  "1.2": {
    lead: "1 つのコーディネーターが複数のサブエージェントに仕事を割り振る構成（ハブ＆スポーク）の作り方と、つまずきやすい点を学びます。",
    sections: [
      {
        h: "ハブ＆スポーク",
        body: [
          "コーディネーター（ハブ）が依頼を受け、調べる・分析する・まとめる、といった仕事をサブエージェント（スポーク）に渡します。サブエージェント同士は直接やり取りせず、情報もエラーもすべてコーディネーターを通ります。",
          "こうしておくと、何が起きているかをコーディネーターが全部見られ、エラーの扱い方も 1 か所に揃います。サブエージェントが直接ほかのサブエージェントを呼び合う作りは、流れを追えなくなります。",
        ],
      },
      {
        h: "サブエージェントは記憶を持ち越さない",
        body: [
          "サブエージェントは自分だけの文脈で、まっさらな状態から始まります。親の会話もツールの結果も見えません。親から渡るのは、サブエージェントを起動するときのプロンプトの文字列だけです。",
          "サブエージェントが途中で読んだファイルや検索結果は、サブエージェントの中に留まります。親に戻るのは最後のメッセージ（報告）だけです。これが「文脈を分ける」利点で、親の文脈が調査の細部で埋まりません。",
          "つまり、サブエージェントに必要な情報（前の工程の結果、ファイルのパス、決めたこと）は、プロンプトにすべて書いて渡す必要があります。",
        ],
      },
      {
        h: "分解はコーディネーターの仕事",
        body: [
          {
            list: [
              "問いに合わせて、呼ぶサブエージェントを選ぶ。毎回すべてのサブエージェントを順に通す必要はない",
              "調べる範囲を、重なりが出ないように分ける（小テーマ別、情報源の種類別など）",
              "まとめた結果に穴がないかを確かめ、穴があれば的を絞って再度依頼し、まとめ直す（反復）",
            ],
          },
          "よくある失敗は、分解が狭すぎることです。たとえば「国内の再生可能エネルギーの動向」を調べるのに、コーディネーターが太陽光の小テーマにしか分けなければ、各サブエージェントが完璧に仕事をしても、風力や地熱がまるごと抜けます。このとき原因はサブエージェントではなく、コーディネーターの分解にあります。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "最終的な報告に抜けがあるとき、まず疑うのは分解の段階です。サブエージェント同士を直接つなぐ選択肢、コーディネーターを通さずに情報を流す選択肢は、観測と制御を失うので選びません。",
        ],
      },
    ],
    refs: [
      { label: "Subagents in the SDK", url: `${SDK}/subagents` },
      { label: "Create custom subagents（Claude Code）", url: "https://code.claude.com/docs/en/sub-agents" },
    ],
  },

  "1.3": {
    lead: "Agent SDK でサブエージェントを定義して起動する方法と、サブエージェントに文脈を渡す方法を学びます。",
    sections: [
      {
        h: "定義と起動",
        body: [
          "サブエージェントは `query()` の `agents` オプションに名前ごとに定義します（`AgentDefinition`）。Claude は `Agent` ツールでサブエージェントを起動します。",
          {
            lang: "ts",
            code: `for await (const message of query({
  prompt: "認証モジュールのセキュリティを確認して",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Agent"], // Agent を承認なしで使えるように
    agents: {
      "code-reviewer": {
        description: "コードレビューの専門家。品質・安全性の確認に使う", // いつ使うか
        prompt: "あなたはセキュリティに詳しいレビュアーです…",          // サブエージェントのシステムプロンプト
        tools: ["Read", "Grep", "Glob"],                                 // 使えるツール（読むだけ）
        model: "sonnet",
      },
    },
  },
})) { /* … */ }`,
          },
          {
            list: [
              "`description`：いつこのサブエージェントを使うか。Claude はこれを見て呼ぶ相手を選ぶ",
              "`prompt`：サブエージェントのシステムプロンプト（役割と振る舞い）",
              "`tools`：使えるツールの許可リスト。書かなければ、サブエージェントが使えるツールをすべて引き継ぐ。書いたツール以外はサブエージェントにまったく見えない",
              "`disallowedTools`：引き継いだツールから外したいものを書く",
            ],
          },
          "`Agent` ツールは、Claude Code v2.1.63 より前は `Task` という名前でした。古い資料や試験の文章では `Task` と書かれていることがありますが、同じものです。",
          "ファイル（`.claude/agents/` の Markdown）でも定義できます。同じ名前ならコードで渡した定義が優先されます。",
        ],
      },
      {
        h: "文脈の渡し方",
        body: [
          "サブエージェントに渡るのは `Agent` ツールのプロンプトの文字列だけです（フォークしたサブエージェントは例外で、会話をコピーして始まります）。共有メモリはありません。",
          {
            list: [
              "前の工程の結果は、削りすぎずに必要な分をプロンプトに入れる（例：まとめ役には、検索の結果と文書の分析結果の両方を渡す）",
              "本文と、出典などのメタデータ（URL、文書名、ページ）を分けて構造化して渡すと、まとめるときに出典が消えない",
              "コーディネーターがサブエージェントに渡すプロンプトには、細かい手順より、目的と品質の基準（何をもって十分とするか）を書く。手順を決め打ちすると、サブエージェントが状況に合わせられない",
            ],
          },
        ],
      },
      {
        h: "並列に動かす",
        body: [
          "独立した調査は、コーディネーターが 1 回の応答で `Agent` ツールを複数呼ぶことで並列に進みます。全体の時間は、一番遅いサブエージェントの時間で決まります（順に呼べば合計になります）。",
          "Agent SDK の既定では、起動したサブエージェントはバックグラウンドで動き、報告は後のターンに届きます。次の行動に報告が要るときは、Claude はその場で待ちます。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "「サブエージェントが前の結果を知らない」場面では、プロンプトに明示して渡す答えを選びます。「サブエージェントは親の会話を引き継ぐ」「共有の記憶がある」という前提の選択肢は誤りです。起動できないときは、コーディネーターの `allowedTools` に `Agent` があるかを見ます。",
        ],
      },
    ],
    refs: [
      { label: "Subagents in the SDK（AgentDefinition・Agent ツール）", url: `${SDK}/subagents` },
      {
        label: "Create custom subagents（Claude Code のファイル定義）",
        url: "https://code.claude.com/docs/en/sub-agents",
      },
    ],
  },

  "1.4": {
    lead: "必ず守らせたい手順をプロンプトではなくプログラムで強制する方法と、人に引き継ぐときの渡し方を学びます。",
    sections: [
      {
        h: "プロンプトは確率的",
        body: [
          "システムプロンプトに「返金の前に必ず本人確認をする」と書いても、守られる確率は 100% になりません。CLAUDE.md の指示も同じで、公式ドキュメントも「CLAUDE.md は文脈であって強制される設定ではない。Claude の判断に関係なく止めたいなら PreToolUse フックを使う」と書いています。",
          "お金が動く、データが消えるなど、1 回の取りこぼしも許されない手順は、プログラムで強制します。",
        ],
      },
      {
        h: "前提が済むまで止めるゲート",
        body: [
          "たとえば「`get_customer` で本人確認が済むまで `process_refund` を呼ばせない」なら、ツールを呼ぶ前のフックで状態を見て止めます。",
          {
            lang: "ts",
            code: `const verified = new Set<string>(); // 本人確認が済んだ顧客（get_customer の結果を見て足す）

const refundGate: HookCallback = async input => {
  const pre = input as PreToolUseHookInput;
  const { customer_id } = pre.tool_input as { customer_id: string };
  if (verified.has(customer_id)) return {};          // 通す
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "先に get_customer で本人確認をしてください", // Claude に理由を伝える
    },
  };
};
// SDK の自作ツールは MCP サーバーとして渡すので、名前は mcp__<サーバー名>__<ツール名> になる
// options.hooks = { PreToolUse: [{ matcher: "mcp__support__process_refund", hooks: [refundGate] }] }`,
          },
          "止めるだけでなく理由を返すと、Claude は先に本人確認をする、という正しい流れに戻れます。ツールの実装の中で状態を確かめて、エラーを返す作りでも構いません。大事なのは、判断がプログラムの側にあることです。",
        ],
      },
      {
        h: "人に引き継ぐときの渡し方",
        body: [
          "人の担当者は、エージェントと顧客の会話の全文を読む時間がありません。引き継ぐときは、読めばすぐ動ける構造化した要約を渡します。",
          {
            list: [
              "顧客 ID と本人確認の状況",
              "問題の内容と、分かった原因",
              "関係する金額・注文番号・日付",
              "エージェントが試したこと",
              "推奨する対応と、引き継ぐ理由",
            ],
          },
        ],
      },
      {
        h: "用件が複数あるとき",
        body: [
          "1 つの問い合わせに「注文の遅れ」と「請求の誤り」が混ざっているなら、用件ごとに分けて調べ（独立していれば並列に）、最後に 1 つの回答にまとめます。片方だけ答えて終わる、片方を人に回してもう片方を放置する、という作りは避けます。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "「プロンプトを強める」「例を足す」「大文字で強調する」は確率を上げるだけです。手順の順序が必ず守られる必要があると問題文が言っていたら、プログラムで止める答え（フック・ゲート・ツール側の検査）を選びます。",
        ],
      },
    ],
    refs: [
      { label: "Hooks（Agent SDK）", url: `${SDK}/hooks` },
      {
        label: "How Claude remembers your project（CLAUDE.md は強制ではない）",
        url: "https://code.claude.com/docs/en/memory",
      },
    ],
  },

  "1.5": {
    lead: "フックで、ツールの呼び出しを実行の前に止めたり、結果を Claude が読む前に整えたりする方法を学びます。",
    sections: [
      {
        h: "フックとは",
        body: [
          "フックは、エージェントの決まった時点（ツールを呼ぶ前、ツールが結果を返した後、止まる時、など）で動く自分のコードです。Claude の判断を介さずに必ず動くので、確実に効きます。",
          {
            list: [
              "`PreToolUse`：ツールを呼ぶ前。止める・入力を書き換える・承認を求める",
              "`PostToolUse`：ツールが結果を返した後。結果に情報を足す・結果を差し替える",
              "ほかに `Stop`、`SubagentStart`／`SubagentStop`、`PreCompact`、`UserPromptSubmit` など",
            ],
          },
          "Agent SDK では `options.hooks` に、イベント名ごとに `matcher`（対象のツール名。`Write|Edit` のような並びや `^mcp__` のような正規表現も書ける）とコールバックを渡します。Claude Code では `settings.json` の `hooks` にシェルのコマンドとして書けます。",
        ],
      },
      {
        h: "PreToolUse：方針に反する呼び出しを止める",
        body: [
          "コールバックは `hookSpecificOutput` を返します。",
          {
            list: [
              '`permissionDecision`：`"allow"`（承認なしで通す）・`"deny"`（止める）・`"ask"`（人に確認）・`"defer"`（呼び出しを保留してターンを終える。後で再開できる）',
              "`permissionDecisionReason`：理由。止めたときは Claude に伝わる",
              '`updatedInput`：ツールの入力を書き換える。`"allow"` と組み合わせれば、書き換えた入力を承認なしで通す。元の入力を直接いじらず、新しいオブジェクトを返す',
            ],
          },
          "何も言うことがなければ `{}` を返します。複数のフックが別々の判断を返したときは、`deny` ＞ `defer` ＞ `ask` ＞ `allow` の順で厳しいほうが勝ちます。",
          "例：一定額を超える返金を止めて、人への引き継ぎに回す。止めた理由に「人に引き継ぐ」と書けば、Claude は引き継ぎの流れに進みます。",
          "シェルのコマンドのフックでは、終了コード `2` が「止める」です（標準エラーの文が理由になる）。`1` などほかのコードはエラーとして記録されるだけで、呼び出しは止まりません。",
        ],
      },
      {
        h: "PostToolUse：結果を整える",
        body: [
          "入力には `tool_name`・`tool_input`・`tool_response`（ツールが返した結果）が入ります。",
          {
            list: [
              "`additionalContext`：結果の横に情報を足す（「この日付は UTC」など）",
              "`updatedToolOutput`：Claude が読む前に結果を差し替える。値はそのツールの出力と同じ形にする",
            ],
          },
          "使いどころは、形式が揃っていないデータの正規化です。ある MCP ツールは日付を Unix 時刻で、別のツールは「2026/11/04」で返し、状態をコード（`3`）で返す、という状況なら、PostToolUse でどれも ISO 8601 の日付と意味の分かる状態名に揃えてから Claude に渡します。Claude に「形式の違いに気を付けて」と頼むより確実です。",
          "ツールはフックが動いた時点で実行済みです。PostToolUse では実行を取り消せません。止めたいなら PreToolUse です。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "「必ず」守らせたい業務ルール（金額の上限、触ってはいけないファイル）は PreToolUse、ツールの結果の形をそろえたいなら PostToolUse。プロンプトに書く選択肢より、フックの選択肢を選びます。",
        ],
      },
    ],
    refs: [
      { label: "Intercept and control agent behavior with hooks（Agent SDK）", url: `${SDK}/hooks` },
      { label: "Hooks reference（Claude Code）", url: "https://code.claude.com/docs/en/hooks" },
    ],
  },

  "1.6": {
    lead: "大きな作業をどう分けるか。手順を固定するやり方と、途中の発見に合わせて分け直すやり方の使い分けを学びます。",
    sections: [
      {
        h: "固定のパイプライン（プロンプトチェーン）",
        body: [
          "やることが前もって分かっている作業は、工程を順につなぎます。たとえばコードレビューなら「ファイルごとに問題を洗い出す → 全体をまとめる」。各工程の入力と出力が決まっているので、結果が安定し、どこで失敗したかも分かります。",
        ],
      },
      {
        h: "動的な分解",
        body: [
          "調べてみないと何をすべきか分からない作業では、最初に全部の手順を決められません。「古いコードにテストを足す」なら、次の順で進め、途中で分かったことに合わせて計画を直します。",
          {
            list: [
              "構造をつかむ（どんなモジュールがあり、どう依存しているか）",
              "影響の大きい所を見つける（よく使われる、壊れると困る、テストがない）",
              "優先順位をつけた計画を立てる",
              "進めながら、見つかった依存関係に合わせて計画を直す",
            ],
          },
        ],
      },
      {
        h: "大きなレビューは 2 段に分ける",
        body: [
          "20 近いファイルを 1 回で全部レビューさせると、注意が散って、ファイルによって細かく見たり見落としたりします。同じ種類のバグが、あるファイルでは指摘され、別のファイルでは見逃される、ということが起きます。",
          {
            list: [
              "1 段目：ファイルごとに、そのファイルの中の問題を見る（局所的な確認）",
              "2 段目：ファイルをまたぐデータの流れや呼び出しの整合を見る（統合の確認）",
            ],
          },
          "大きい文脈を持つモデルに替えても、注意が散る問題は消えません。分けることで解決します。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "手順が予測できる → パイプライン、予測できない → 動的な分解、を見分けます。レビューの質がファイルによってばらつく話なら、ファイルごとと統合の 2 段に分ける答えを選びます。",
        ],
      },
    ],
    refs: [
      {
        label: "Building effective AI agents（Anthropic）",
        url: "https://www.anthropic.com/research/building-effective-agents",
      },
      { label: "Subagents in the SDK", url: `${SDK}/subagents` },
    ],
  },

  "1.7": {
    lead: "セッションを続ける・特定のセッションに戻る・分岐させる、の使い分けと、続けないほうがよい場面を学びます。",
    sections: [
      {
        h: "3 つの戻り方",
        body: [
          "セッションは、プロンプト・ツールの呼び出しと結果・応答をすべて含む会話の記録です。SDK と CLI が自動でディスクに保存します。",
          {
            list: [
              "続ける（continue）：今のディレクトリの一番新しいセッションを続ける。CLI は `--continue`、SDK（TypeScript）は `continue: true`",
              "再開（resume）：セッション ID を指定して、そのセッションを続ける。CLI は `--resume <ID>`、SDK は `resume: sessionId`",
              "分岐（fork）：元の履歴をコピーした新しいセッションを作る。元は変わらない。CLI は `--resume` に `--fork-session`、SDK は `resume` と一緒に `forkSession: true`（Python は `fork_session=True`）",
            ],
          },
          "セッション ID は `result` メッセージの `session_id` で取れます（CLI なら `--output-format json` の出力）。",
          {
            lang: "bash",
            code: `session_id=$(claude -p "認証モジュールを分析して" --output-format json | jq -r '.session_id')
claude -p "分析をもとにリファクタリングして" --resume "$session_id"
claude -p "JWT ではなく OAuth2 で考えると？" --resume "$session_id" --fork-session`,
          },
        ],
      },
      {
        h: "分岐の使いどころ",
        body: [
          "共通の分析を済ませたあとで、2 つのやり方（JWT と OAuth2、ライブラリ A と B）を別々に試したいときに分岐します。それぞれのセッションは独立して再開できます。",
          "分岐するのは会話だけで、ファイルは分かれません。分岐した側がファイルを書き換えれば、同じディレクトリの全セッションにその変更が見えます。",
        ],
      },
      {
        h: "再開より新しく始めるほうがよい場面",
        body: [
          "再開したセッションには、前に読んだ時点のファイルの内容が残っています。その後でファイルが変わっていると、古い内容をもとに答えることがあります。",
          {
            list: [
              "変わったファイルが分かっているなら、再開して「このファイルが変わった」と伝え、そこだけ読み直させる",
              "前のツールの結果の多くが古くなっているなら、要点の要約を入れた新しいセッションで始めるほうが確実",
            ],
          },
          "セッションのファイルは作った端末にしかありません。CI など別の環境で続きをやるときについて、公式ドキュメントは、必要な結果（分析、決めたこと、差分）をアプリの側で持ち、新しいセッションのプロンプトに渡すやり方を挙げ、セッションのファイルを運ぶより確実なことが多いとしています。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "「同じ分析から別のやり方を比べたい」→ 分岐。「昨日の続き」→ 再開。「コードが大きく変わった」→ 変わった所を伝えるか、要約を入れて新しく始める。何も伝えずにそのまま再開する選択肢は、古い結果で答えるので誤りです。",
        ],
      },
    ],
    refs: [
      { label: "Work with sessions（Agent SDK）", url: `${SDK}/sessions` },
      { label: "Run Claude Code programmatically（CLI の続け方）", url: "https://code.claude.com/docs/en/headless" },
    ],
  },
};
