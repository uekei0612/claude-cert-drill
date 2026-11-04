/* 教科書 D2：ツール設計と MCP。仕様は公式ドキュメントで確かめた（2026-11-04） */
import type { Lesson } from "../../types";

const API = "https://platform.claude.com/docs/en";
const CC = "https://code.claude.com/docs/en";

export const d2: Record<string, Lesson> = {
  "2.1": {
    lead: "Claude が正しいツールを選べるように、ツールの説明と名前をどう書くかを学びます。",
    sections: [
      {
        h: "選ぶ手がかりは説明",
        body: [
          "Claude はツールの `name`・`description`・`input_schema` を読んで、どのツールを呼ぶかを決めます。公式ドキュメントは、説明を詳しく書くことを「ツールの性能に効く、群を抜いて大事な要素」としています。目安は 1 つのツールにつき 3〜4 文以上です。",
          {
            list: [
              "何をするツールか",
              "いつ使うか、いつ使わないか（似たツールとの境目）",
              "各引数の意味と、結果への影響",
              "返さない情報や制約（例：米国の取引所の銘柄だけ、など）",
            ],
          },
        ],
      },
      {
        h: "悪い例と良い例",
        body: [
          {
            lang: "json",
            code: `// 悪い：短すぎて、似たツールと区別できない
{ "name": "get_customer", "description": "Gets a customer." }
{ "name": "lookup_order", "description": "Looks up an order." }

// 良い：入力の形・使う場面・境目を書く
{
  "name": "lookup_order",
  "description": "注文番号（ORD- で始まる 8 桁）から注文の状態・金額・配送状況を返す。顧客が注文番号を示したときに使う。顧客の連絡先や過去の注文一覧は返さない（それは get_customer）。番号が分からないときは先に get_customer で顧客を特定する。",
  "input_schema": { "type": "object", "properties": { "order_id": { "type": "string", "description": "例: ORD-12345678" } }, "required": ["order_id"] }
}`,
          },
          "複雑な入力のツールには `input_examples`（スキーマに合う入力の例）を付けることもできます。",
        ],
      },
      {
        h: "重なりをなくす",
        body: [
          "役割が重なるツールが並ぶと、Claude は取り違えます。直し方は 2 つの方向があり、どちらも「曖昧さをなくす」ためです。",
          {
            list: [
              "何でもできる 1 つのツール（`analyze_document`）が、性質の違う仕事をまとめて抱えているなら、目的別に分ける（`extract_data_points`・`summarize_content`・`verify_claim_against_source`）",
              "ほとんど同じ操作が名前だけ違って並んでいるなら、1 つにまとめる（公式の指針も、関連する操作は `action` 引数で 1 つのツールにまとめると選択の曖昧さが減る、としている）",
              "サービスが複数あるなら、名前に接頭辞を付けて区別する（`github_list_prs`、`slack_send_message`）",
            ],
          },
        ],
      },
      {
        h: "システムプロンプトの言葉にも引っ張られる",
        body: [
          "システムプロンプトに「まず顧客を確認する」と書いてあると、「顧客」という言葉に引かれて `get_customer` ばかり呼ぶ、ということが起きます。ツールの説明を直しても選択が直らないときは、システムプロンプトの言い回しを見直します。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "ツールの取り違えには、まず説明を詳しくする答えが最も効き、費用も小さい。少数ショットの例を足す・別の分類器を挟む・ツールを減らす、は説明を直してから考える手です。",
        ],
      },
    ],
    refs: [
      { label: "Define tools（説明の書き方の指針）", url: `${API}/agents-and-tools/tool-use/define-tools` },
      {
        label: "Writing tools for agents（Anthropic）",
        url: "https://www.anthropic.com/research/writing-tools-for-agents",
      },
    ],
  },

  "2.2": {
    lead: "ツールが失敗したとき、Claude が次の手を正しく選べるように、エラーを構造化して返す方法を学びます。",
    sections: [
      {
        h: "失敗を「失敗」として返す",
        body: [
          "Messages API では `tool_result` に `is_error: true` を付けます。MCP のツールでは、ツールの結果（`CallToolResult`）に `isError: true` を付けます。どちらも「ツールは動いたが、うまくいかなかった」を Claude に伝える印です。",
          "印だけでは足りません。「Operation failed」としか書かれていなければ、Claude は再試行すべきか、別の手を探すべきか、顧客に説明すべきかを判断できません。",
        ],
      },
      {
        h: "エラーの種類を分ける",
        body: [
          {
            list: [
              "一時的な失敗（タイムアウト、相手のサービスの停止）：時間をおけば直る。再試行してよい",
              "入力の誤り（形式の違う注文番号）：入力を直せば通る",
              "業務ルール違反（返金の期限切れ、上限超え）：何度やっても通らない。再試行は無駄で、顧客に伝えられる説明が要る",
              "権限の問題：この経路では解決できない。人への引き継ぎなどへ",
            ],
          },
          "結果の本文に、種類・再試行してよいか・人が読める説明を入れておくと、Claude が分岐できます。項目名はプロトコルで決まっていないので、チームで決めて全ツールで揃えます。",
          {
            lang: "json",
            code: `{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "{\\"errorCategory\\": \\"business_rule\\", \\"isRetryable\\": false, \\"message\\": \\"購入から 30 日を過ぎているため返金できません（購入日 2026-09-20）\\"}"
  }]
}`,
          },
        ],
      },
      {
        h: "「0 件」と「調べられなかった」は別物",
        body: [
          "検索が正しく動いて該当が無かったのは、成功した結果です（「該当なし」と返す）。検索の相手に繋がらなかったのは失敗です（`isError`）。両方を空の配列で返すと、Claude は「無かった」と思い込んで先に進みます。",
        ],
      },
      {
        h: "どこで直すか",
        body: [
          "一時的な失敗は、失敗したサブエージェントの中で再試行して片付けます。それでも解決できないものだけを、試したことと途中までの結果を添えてコーディネーターに上げます。何でもすぐ上に投げると、コーディネーターがエラー処理で埋まります。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "「エラーを構造化して返す（種類・再試行の可否・説明）」が正解の芯です。一律に再試行する、例外を握りつぶして空の成功を返す、1 つの失敗で全体を止める、はどれも誤りです。",
        ],
      },
    ],
    refs: [
      { label: "Handle tool calls（is_error）", url: `${API}/agents-and-tools/tool-use/handle-tool-calls` },
      {
        label: "MCP の仕様：Tools（isError）",
        url: "https://modelcontextprotocol.io/specification/2026-07-28/server/tools",
      },
    ],
  },

  "2.3": {
    lead: "エージェントごとに渡すツールの絞り方と、`tool_choice` でツールの呼び方を決める方法を学びます。",
    sections: [
      {
        h: "ツールは役割に合わせて絞る",
        body: [
          "1 つのエージェントにツールを 18 個も渡すと、選ぶ精度が落ちます。役割に要るものだけ（目安は数個）にします。",
          {
            list: [
              "専門外のツールを持たせない。まとめ役にウェブ検索を渡すと、まとめずに検索を始める",
              "他の役割の機能で、頻繁に要るものだけは範囲を絞って渡す（まとめ役に、事実を 1 つ確かめるだけの `verify_fact`）。それ以外はコーディネーター経由で頼む",
              "汎用のツールは、制約つきのものに置き換える（どんな URL でも取れる `fetch_url` ではなく、社内文書の URL だけを受け付ける `load_document`）",
            ],
          },
          "Agent SDK のサブエージェントなら `tools` に許可するツールを並べます。書かなかったツールは、そのサブエージェントからは存在しないのと同じです。",
        ],
      },
      {
        h: "tool_choice",
        body: [
          {
            list: [
              '`{"type": "auto"}`：ツールを呼ぶかどうかを Claude が決める。文章だけで答えることもある（ツールがあるときの既定）',
              '`{"type": "any"}`：どれかのツールを必ず呼ぶ。どれを呼ぶかは Claude が選ぶ',
              '`{"type": "tool", "name": "extract_metadata"}`：そのツールを必ず呼ぶ',
              '`{"type": "none"}`：ツールを呼ばない（ツールが無いときの既定）',
            ],
          },
          "`any` と `tool` では API が応答の頭を埋めてツールを呼ばせるので、ツールの前に説明の文章は出ません。強制した呼び出しでは思考（thinking）も飛ばされます。",
          "使いどころ：最初に必ず `extract_metadata` を呼ばせてから中身の処理に進みたいなら、1 回目の呼び出しだけ名前を指定して強制し、2 回目からは `auto` に戻します。",
        ],
      },
      {
        h: "新しいモデルでの注意",
        body: [
          '2026-11 時点の公式ドキュメントでは、Claude Opus 5.5・Sonnet 5.5・Fable 5.1 などの一部のモデルは `any` と `tool` を受け付けず、400 エラーを返します。また手動の拡張思考（`thinking: {type: "enabled"}`）とも併用できません。そうしたモデルでは、`auto` に strict tool use（ツール定義に `strict: true`）を組み合わせるか、structured outputs で応答の形を固定します。',
          "試験は「`tool_choice` で強制できる」という前提の問題を出します。考え方（必ずツールを呼ばせたいなら強制、文章も許すなら auto）として覚え、実装するときはモデルの対応を確かめます。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "「auto だとツールを呼ばずに文章で返すことがある」→ `any` か名前の指定。「どの種類の文書か分からず、スキーマが複数ある」→ `any`（どれかを必ず呼ばせ、どれかは Claude が選ぶ）。",
        ],
      },
    ],
    refs: [
      {
        label: "Define tools（Forcing tool use と各モデルの制限）",
        url: `${API}/agents-and-tools/tool-use/define-tools`,
      },
      { label: "Strict tool use", url: `${API}/agents-and-tools/tool-use/strict-tool-use` },
      { label: "Subagents in the SDK（tools の許可リスト）", url: `${CC}/agent-sdk/subagents` },
    ],
  },

  "2.4": {
    lead: "MCP サーバーを Claude Code やエージェントに組み込む方法（置き場所・共有・秘密の扱い）を学びます。",
    sections: [
      {
        h: "3 つのスコープ",
        body: [
          {
            list: [
              "ローカル（既定）：`~/.claude.json` の、そのプロジェクトの欄に入る。自分だけ・このプロジェクトだけ",
              "プロジェクト：リポジトリ直下の `.mcp.json`。リポジトリに入れてチームで共有する",
              "ユーザー：`~/.claude.json`。自分だけ・全プロジェクト",
            ],
          },
          "チームの全員に同じツールを使わせたいならプロジェクト、個人で試すだけならローカルかユーザーです。同じ名前のサーバーが複数の場所にあれば、ローカル → プロジェクト → ユーザーの順で優先されます（中身は混ざらず、勝った方の定義だけが使われる）。",
          {
            lang: "bash",
            code: `# チームで共有（.mcp.json に書かれる）
claude mcp add --transport http shared-server --scope project https://example.com/mcp
# ローカルで動かすサーバー（-- の後ろがサーバーのコマンド）
claude mcp add --transport stdio airtable --env AIRTABLE_API_KEY=xxx -- npx -y airtable-mcp-server`,
          },
        ],
      },
      {
        h: "秘密は環境変数で",
        body: [
          "`.mcp.json` はリポジトリに入るので、トークンを直接書きません。`${VAR}` と `${VAR:-既定値}` で環境変数を展開できます（`command`・`args`・`env`・`url`・`headers` の中）。",
          {
            lang: "json",
            code: `{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer \${GITHUB_TOKEN}" }
    }
  }
}`,
          },
          "対話のセッションでは、`.mcp.json` のサーバーを初めて使う前に承認を求められます（他人がコミットしたサーバーから守るため）。",
        ],
      },
      {
        h: "ツールの見え方",
        body: [
          "設定したサーバーのツールは、接続したときに見つかり、すべて同時に使えます。名前は `mcp__<サーバー名>__<ツール名>` の形になり、フックの `matcher` や権限の規則でもこの名前を使います。",
          "MCP ツールの説明が薄いと、Claude は組み込みの `Grep` などで済ませようとします。MCP ツールにしかできないこと（社内のチケットを横断して探せる、など）と、返す内容を説明に書きます。",
          "MCP のリソースで「中身の一覧」（課題の要約、文書の階層、データベースのスキーマ）を見せると、Claude が手探りでツールを呼ぶ回数が減ります。",
        ],
      },
      {
        h: "自作するか、既存を使うか",
        body: [
          "Jira や GitHub のような定番の連携には、既存のサーバー（公式やコミュニティのもの）を使います。自作するのは、チーム固有の作業に限ります。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "「新しく入った人にサーバーが見えない」→ ユーザー／ローカルのスコープに置いていた。プロジェクトの `.mcp.json` に移す。「トークンをどう共有するか」→ `.mcp.json` には `${VAR}` と書き、各自が環境変数で渡す。",
        ],
      },
    ],
    refs: [
      { label: "Connect Claude Code to tools via MCP", url: `${CC}/mcp` },
      { label: "MCP in the SDK", url: `${CC}/agent-sdk/mcp` },
    ],
  },

  "2.5": {
    lead: "Claude Code の組み込みツール（Read・Write・Edit・Grep・Glob・Bash）の使い分けと、大きなコードを読み進める順番を学びます。",
    sections: [
      {
        h: "道具の使い分け",
        body: [
          {
            list: [
              "Grep：ファイルの中身を探す。関数の呼び出し元、エラーメッセージ、import 文",
              "Glob：ファイル名やパスの形で探す（`**/*.test.tsx`、`src/**/config.*`）",
              "Read：ファイルを読む",
              "Write：ファイル全体を書く（新しく作る、まるごと置き換える）",
              "Edit：ファイルの中の一意な文字列を目印にして、そこだけ書き換える",
              "Bash：テストやビルドなど、コマンドを動かす",
            ],
          },
          "「中身で探すなら Grep、名前で探すなら Glob」が一番よく問われます。",
        ],
      },
      {
        h: "Edit が失敗したら",
        body: [
          "Edit は、置き換える前の文字列（目印）がファイルの中に 1 つだけあることを求めます。同じ行が何か所もあると、どこを書き換えるか決まらず失敗します。",
          {
            list: [
              "まず、目印を長くする：前後の行（見出し、関数名など、その場所にしか無いもの）まで含めて一意にする",
              "全部を同じに直したいなら、すべて置き換える指定（`replace_all`）を使う",
              "それでも無理なら、最後の手として Read で全体を読み、Write で書き直す",
            ],
          },
          "Write での書き直しは、関係ない所まで書き換えてしまう危険があるので、先に目印を長くするほうを試します。",
        ],
      },
      {
        h: "大きなコードを読む順番",
        body: [
          "最初に全ファイルを読み込むと、文脈がすぐに埋まります。入口を探して、流れをたどります。",
          {
            list: [
              "Grep で入口を見つける（関数の定義、ルートの登録）",
              "Read でそのファイルを読み、import をたどって呼び出しの流れを追う",
              "必要になったファイルだけを読む",
            ],
          },
          "ラッパー（別名で再公開している関数）経由の呼び出しを追うときは、まずラッパーが公開している名前を洗い出し、名前ごとに Grep します。元の関数名だけで探すと、ラッパー経由の呼び出しを取りこぼします。",
        ],
      },
      {
        h: "試験での考え方",
        body: [
          "「全ファイルを最初に読む」は誤りです。目的（中身か名前か、部分か全体か）に合った道具を選び、少しずつ読み進める答えを選びます。",
        ],
      },
    ],
    refs: [{ label: "Tools reference（Claude Code）", url: `${CC}/tools-reference` }],
  },
};
