/* シナリオ 4：開発生産性ツール（自作問題）。正解の文は短く言い切り、誤答の長さと揃える */
import type { Question } from "../../types";

export const s4: Question[] = [
  {
    id: "s4-01",
    scenario: "s4",
    tasks: ["2.5"],
    stem: 'An engineer asks the assistant: "Where is calculateTax called across this repository?" The repository has about 4,000 files. Which built-in tool should the agent start with?',
    options: [
      {
        text: "Glob with a pattern such as **/*tax*, then Read every file it returns to look for calls.",
        why: "Glob はファイル名で探す道具。関数の呼び出しはファイル名とは無関係なので、呼び出し元の多くを見落とす。",
      },
      {
        text: "Grep for calculateTax.",
        why: "正解。ファイルの中身から関数名・エラーメッセージ・import を探すのは Grep の役目。",
      },
      {
        text: "Read the main entry point and follow every import until all callers have been found.",
        why: "入口からたどるのは流れを追うときの手順。全体の呼び出し元を探すなら、まず中身を検索する。",
      },
      {
        text: 'Bash with a script that loads every source file and prints each line containing "Tax".',
        why: 'Grep で済むことを自作の仕組みでやっている。しかも "Tax" では関係の無い行まで大量に拾う。',
      },
    ],
    answer: 1,
    point: "中身（関数名・エラーメッセージ・import）を探すのは Grep、ファイル名のパターンで探すのは Glob",
  },
  {
    id: "s4-02",
    scenario: "s4",
    tasks: ["2.5"],
    stem: 'The agent tries to change a default value in a config file with Edit, but the call fails because the anchor text it chose ("timeout: 30") appears four times in the file. What is the most reliable way to complete the change?',
    options: [
      {
        text: "Retry Edit with the same anchor text several times until it applies to the right occurrence.",
        why: "目印が一意でない限り Edit は同じ理由で失敗する。繰り返しても結果は変わらない。",
      },
      {
        text: 'Use Bash to run a sed command that replaces every occurrence of "timeout: 30" in the file.',
        why: "4 か所すべてを書き換えてしまい、変えるべきでない設定まで変わる。",
      },
      {
        text: "Read the whole file, then Write it back with the one intended value changed.",
        why: "正解。Edit が一意な目印を見つけられないときは、Read で全体を読み、意図した 1 か所だけ直して Write で書く。",
      },
      {
        text: "Delete the config file and ask the engineer to recreate it with the new default value.",
        why: "道具の使い方の問題を人に押し付けている。確実に直す手段がある。",
      },
    ],
    answer: 2,
    point: "Edit の目印が一意でなく失敗したら、Read で全体を読み Write で書き直す",
  },
  {
    id: "s4-03",
    scenario: "s4",
    tasks: ["2.4"],
    stem: "Your team wants every engineer to have the same GitHub MCP server available in Claude Code for this repository. The server needs a personal access token. How should you configure it?",
    options: [
      {
        text: "Add it to the project's .mcp.json and reference the token as ${GITHUB_TOKEN}.",
        why: "正解。チームで共有するサーバーはプロジェクトの .mcp.json に置き、秘密は環境変数の展開で渡す。トークンをコミットしない。",
      },
      {
        text: "Add it to the project's .mcp.json with the token value written directly into the file so it works out of the box.",
        why: "秘密をリポジトリにコミットすることになる。環境変数の展開で避けられる。",
      },
      {
        text: "Ask each engineer to add the server to their own ~/.claude.json with their personal token.",
        why: "ユーザーの階層は個人用・試験用。全員に同じ設定を配る目的には合わず、設定がずれていく。",
      },
      {
        text: "Write the server's connection details into CLAUDE.md so Claude can connect to it when needed.",
        why: "CLAUDE.md は指示の置き場で、MCP サーバーの設定にはならない。",
      },
    ],
    answer: 0,
    point: "共有の MCP サーバーはプロジェクトの .mcp.json に、秘密は ${ENV} の展開で（コミットしない）",
  },
  {
    id: "s4-04",
    scenario: "s4",
    tasks: ["2.4", "2.1"],
    stem: "You added an internal MCP server whose search_code tool understands your monorepo's symbol index and returns precise definitions and references. Yet the agent keeps using the built-in Grep instead, and its answers miss cross-package references. What should you change first?",
    options: [
      {
        text: "Remove Grep from the agent's allowed tools so it is forced to use search_code for every search.",
        why: "Grep が適している場面（文字列の検索）まで奪う。選ばれない原因は説明の薄さにある。",
      },
      {
        text: "Add a CLAUDE.md line telling the agent that search_code exists and is generally better than Grep.",
        why: "一文の指示は確率的にしか効かない。ツールの選び分けの主な手がかりは、ツール自身の説明。",
      },
      {
        text: "Expand search_code's description: what it can find, what it returns, and when to use it over Grep.",
        why: "正解。MCP ツールの説明が薄いと、モデルは慣れた組み込みツールを選ぶ。できること・出力・使い分けを詳しく書く。",
      },
      {
        text: "Rename search_code to grep_plus so the model associates it with the familiar Grep tool.",
        why: "名前を似せると、かえって取り違えが増える。名前ではなく説明で違いを伝える。",
      },
    ],
    answer: 2,
    point: "MCP ツールの説明が薄いと組み込みツールが優先される。できること・出力・使い分けを説明に書く",
  },
  {
    id: "s4-05",
    scenario: "s4",
    tasks: ["2.4"],
    stem: 'Engineers often ask "Which open issues touch the billing service?" The agent currently answers by calling list_issues repeatedly with different filters and reading each result. Your MCP server already has all issue summaries. How can you cut down the exploratory calls?',
    options: [
      {
        text: "Raise the page size of list_issues so the agent can fetch every issue in a single call.",
        why: "1 回で全件を返すと、関係の無い課題まで文脈に積み上がる。中身の一覧を見せる別の手段がある。",
      },
      {
        text: "Expose the issue summaries as an MCP resource so the agent can see what exists without probing.",
        why: "正解。MCP のリソースで中身の一覧（課題の要約、文書の階層、DB のスキーマ）を見せると、探るためのツール呼び出しが減る。",
      },
      {
        text: "Add a system prompt instruction that limits the agent to three list_issues calls per question.",
        why: "回数を絞ると、答えに必要な課題を見落とすだけ。探らずに済むようにするのが筋。",
      },
      {
        text: "Build a custom MCP server that duplicates the issue tracker's data into a local database.",
        why: "既存のサーバーで済むところに、自作の仕組みと保守を増やしている。",
      },
    ],
    answer: 1,
    point: "中身の一覧（課題の要約・文書の階層・スキーマ）は MCP リソースで見せ、探索のツール呼び出しを減らす",
  },
  {
    id: "s4-06",
    scenario: "s4",
    tasks: ["2.2", "5.3"],
    stem: "The assistant's find_owner tool queries the internal service catalog. When a service has no registered owner, the tool returns the same error shape it uses when the catalog is unreachable. The agent then retries unowned services over and over. What should the tool do?",
    options: [
      {
        text: "Return an empty result as a successful query for an unowned service, and a retryable transient error only when the catalog is unreachable.",
        why: "正解。「正しく調べて該当なし」と「アクセスできなかった」は別物。前者は空の成功、後者は再試行できる一時的なエラーとして返す。",
      },
      {
        text: "Return a retryable error in both cases, but cap the number of retries at three.",
        why: "該当なしを再試行しても結果は変わらない。回数を絞っても無駄な再試行が残る。",
      },
      {
        text: "Return a non-retryable error in both cases so the agent never wastes calls on retries.",
        why: "カタログが一時的に落ちているだけのときも諦めてしまう。一時的な失敗は再試行で解決する。",
      },
      {
        text: 'Return the text "No owner or catalog error" so the agent can ask the engineer which one it was.',
        why: "道具が分かっていることを人に聞かせている。区別して返せば済む。",
      },
    ],
    answer: 0,
    point: "「正しく調べて 0 件」は空の成功、「アクセスできない」は再試行できるエラー。同じ形で返さない",
  },
  {
    id: "s4-07",
    scenario: "s4",
    tasks: ["1.7"],
    stem: "An engineer has spent an hour with the agent building a detailed analysis of a legacy module. They now want to compare two refactoring approaches, each of which will involve a lot of exploration, without either one polluting the other. What should they do?",
    options: [
      {
        text: 'Try the first approach in the current session, then type "forget that" and try the second approach.',
        why: "「忘れて」と言っても文脈から消えはしない。一つ目の試行が二つ目の判断に混ざる。",
      },
      {
        text: "Start two new sessions from scratch and re-run the hour-long analysis in each.",
        why: "共通の分析をやり直す無駄が大きい。共通の土台から分岐する手段がある。",
      },
      {
        text: "Use fork_session to create two branches from the current analysis.",
        why: "正解。fork_session で共通の分析から独立した分岐を作り、別々の方針を互いに干渉させずに試せる。",
      },
      {
        text: "Ask the agent to explore both approaches at once in the current session and summarize which is better.",
        why: "二つの探索の出力が同じ文脈に積み上がり、互いに影響する。分けたいという要件に反する。",
      },
    ],
    answer: 2,
    point: "共通の分析から別々の方針を試すときは fork_session で分岐する",
  },
  {
    id: "s4-08",
    scenario: "s4",
    tasks: ["5.4", "1.3"],
    stem: "To understand an unfamiliar repository, the agent first runs dozens of Grep and Read calls, and the context fills with raw search output before it answers the engineer's real question about the refund flow. How should you restructure the work?",
    options: [
      {
        text: "Tell the agent to read only the first 50 lines of each file so the raw output stays small.",
        why: "ファイルの頭だけでは肝心の処理を見落とす。量を削っても、探索の出力が本体の文脈に溜まる構造は同じ。",
      },
      {
        text: "Delegate the exploration to subagents and keep only their summaries in the main context.",
        why: "正解。長い探索はサブエージェントに任せ、本体は全体の把握と調整に専念する。要点だけが本体に戻る。",
      },
      {
        text: "Run /compact before every tool call so the context never grows beyond a small size.",
        why: "毎回縮めると、まだ要る情報まで要約で落ちる。探索の出力を本体に入れない設計のほうが筋が良い。",
      },
      {
        text: "Switch to a model with a larger context window so the raw output fits alongside the question.",
        why: "溢れるのを遅らせるだけで、長い文脈の真ん中が落ちやすい問題は残る。",
      },
    ],
    answer: 1,
    point: "長い探索はサブエージェントに任せ、要約だけを本体の文脈に戻す",
  },
  {
    id: "s4-09",
    scenario: "s4",
    tasks: ["1.6"],
    stem: 'An engineer asks the agent to "add solid test coverage to this 10-year-old service." The service has no tests, unclear module boundaries, and hidden dependencies. What decomposition approach should the agent take?',
    options: [
      {
        text: "Write tests file by file in alphabetical order until every file has at least one test.",
        why: "影響の大きさを無視した順番。重要な部分が後回しになり、依存の発見も計画に反映されない。",
      },
      {
        text: "Generate a complete test plan for every function up front, then execute the plan without changes.",
        why: "隠れた依存は進めながら見つかる。最初の計画を固定すると、発見に合わせて直せない。",
      },
      {
        text: "Ask the engineer to list which functions need tests before doing any analysis of the codebase.",
        why: "構造の把握はエージェントがやるべき仕事。利用者も境界が分からないから頼んでいる。",
      },
      {
        text: "Map the structure, pick high-impact areas, then follow a prioritized plan that adapts as dependencies surface.",
        why: "正解。広い作業は、構造の把握 → 影響の大きい所の特定 → 優先順位つきの計画の順に進め、見つかった依存に合わせて計画を直す。",
      },
    ],
    answer: 3,
    point: "広く曖昧な作業は、構造の把握 → 影響の大きい所 → 優先順位つきで、発見に応じて直す計画",
  },
  {
    id: "s4-10",
    scenario: "s4",
    tasks: ["3.2"],
    stem: "Your team's /scaffold skill generates boilerplate files. You want it to create and write files but never run shell commands or delete anything, and to prompt developers for a component name when they invoke it without one. Which frontmatter fits?",
    options: [
      {
        text: "context: fork so it runs in a separate context, plus a CLAUDE.md note asking developers to pass a name.",
        why: "context: fork は文脈を分けるだけで、使えるツールは絞らない。引数の案内も CLAUDE.md では出ない。",
      },
      {
        text: "allowed-tools limited to file reading and writing tools, and argument-hint describing the component name.",
        why: "正解。allowed-tools でスキルの間に使えるツールを絞り（壊す操作をさせない）、argument-hint で必要な引数を示す。",
      },
      {
        text: "disable-model-invocation, so that the skill cannot run any tool except the ones a developer approves manually.",
        why: "disable-model-invocation はモデルが自分からスキルを呼ぶのを止める設定。ツールの制限にはならない。",
      },
      {
        text: 'A system prompt instruction inside SKILL.md saying "Never use Bash and always ask for a name."',
        why: "本文の指示は確率的にしか守られない。frontmatter で決定的に制限できる。",
      },
    ],
    answer: 1,
    point: "スキルのツールは allowed-tools で絞り、必要な引数は argument-hint で示す",
  },
];
