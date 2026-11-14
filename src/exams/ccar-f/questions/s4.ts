/* シナリオ 4：開発生産性ツール（自作問題）。正解の文は短く言い切り、誤答の長さと揃える */
import type { Question } from "../../../core/exam/types";

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
        why: "Edit で直せないときの最後の手段。ファイル全体を書き直すと関係ない行まで変える危険があるので、先に目印を一意にする。",
      },
      {
        text: "Retry Edit with a longer anchor that adds nearby lines unique to that spot, such as its section header.",
        why: "正解。目印が一意でないなら、その場所にしか無い前後の行（節の見出しなど）まで含めて目印を広げ、Edit をやり直す。",
      },
    ],
    answer: 3,
    point: "Edit の目印が一意でないなら、前後の行まで含めて一意にしてやり直す。Read＋Write での書き直しは最後の手段",
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
        text: "Have the agent jot a summary of each file into a notes file as it reads, still in the main session.",
        why: "書き残すのは良い習慣だが、生の出力はそれでも本体の文脈に溜まる。探索そのものを外に出す。",
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
    stem: "Your team's /scaffold skill generates boilerplate files. You want it to create and write files but never run shell commands or delete anything, and to show developers, as they type the command, that it expects a component name. Which frontmatter fits?",
    options: [
      {
        text: "context: fork so it runs in a separate context, plus a CLAUDE.md note asking developers to pass a name.",
        why: "context: fork は文脈を分けるだけで、使えるツールは絞らない。引数の案内も CLAUDE.md では出ない。",
      },
      {
        text: "disallowed-tools listing Bash and other destructive tools, plus argument-hint naming the component argument.",
        why: "正解。disallowed-tools はスキルの間、書いたツールを使えなくする。argument-hint は打つときに必要な引数を示す。",
      },
      {
        text: "allowed-tools listing only the file read and write tools, plus argument-hint naming the component argument.",
        why: "allowed-tools は書いたツールを承認なしで使えるようにするだけで、ほかのツールは禁止しない。Bash も呼べるまま。",
      },
      {
        text: 'A system prompt instruction inside SKILL.md saying "Never use Bash and always ask for a name."',
        why: "本文の指示は確率的にしか守られない。frontmatter で決定的に制限できる。",
      },
    ],
    answer: 1,
    point:
      "スキルの間に使わせないツールは disallowed-tools で外す（allowed-tools は承認なしで使えるようにするだけ）。引数は argument-hint で示す",
  },
  {
    id: "s4-11",
    scenario: "s4",
    tasks: ["2.5", "5.4"],
    stem: "An engineer asks where a deprecated config key is still used. The agent runs Grep for the key across the whole monorepo and gets 4,000 matching lines, most of them in generated files and vendored code, which floods its context. What is a better approach?",
    options: [
      {
        text: "Read every matching file in full so that no usage is missed.",
        why: "4,000 件を読み込むのは、文脈の問題をさらに悪くする。",
      },
      {
        text: "Switch to Glob, since it is the right tool for finding where things are used.",
        why: "Glob はファイル名のパターンで探す道具。中身の文字列を探すのは Grep。",
      },
      {
        text: "Use Bash to run grep with the same pattern instead, since its raw output is more compact than the Grep tool's results.",
        why: "道具を替えても、当たる量は同じ。絞り方の問題。",
      },
      {
        text: "List only matching file paths first, excluding generated and vendored code, then read the relevant files.",
        why: "正解。まず一致したファイルの一覧だけを、要らないパスを除いて出し、必要な所だけを読む。",
      },
    ],
    answer: 3,
    point: "大きな検索は、まず範囲を絞ってファイルの一覧だけを出し、必要な所だけ読む（全部を文脈に入れない）",
  },
  {
    id: "s4-12",
    scenario: "s4",
    tasks: ["2.5"],
    stem: "The agent needs to change one constant in a 1,800-line file. It reads the file, then uses Write to output all 1,800 lines with the one change. Occasionally unrelated lines come back subtly altered. What should it do instead?",
    options: [
      {
        text: "Use Edit to replace just the line containing the constant, using text that is unique in the file.",
        why: "正解。小さな変更は Edit で、ファイル内で一意な目印の所だけを置き換える。ほかの行に触れない。",
      },
      {
        text: "Keep using Write, but ask the model to double-check the whole file before writing it.",
        why: "全体を書き直す限り、関係ない行を変える危険は残る。",
      },
      {
        text: "Use Bash with sed so that the change happens without the model ever seeing the file.",
        why: "置き換え自体はできるが、確認しにくく、意図しない所に当たる恐れもある。専用の Edit がある。",
      },
      {
        text: "Split the file into several smaller modules first so that rewriting any one of them with Write is less risky.",
        why: "定数 1 つのためにファイルの構成を変えるのは大きすぎる。",
      },
    ],
    answer: 0,
    point: "小さな変更は Edit（一意な目印で置き換え）。Write で全体を書き直すのは新規や全面の書き換えのとき",
  },
  {
    id: "s4-13",
    scenario: "s4",
    tasks: ["2.4"],
    stem: "You want to try an experimental MCP server for your own use on a project before deciding whether the team should adopt it. Teammates should not see it or be prompted about it. Where should you configure it?",
    options: [
      {
        text: "In the project's .mcp.json, with a comment telling teammates to ignore it for now.",
        why: ".mcp.json はリポジトリに入り、チーム全員に共有される。",
      },
      {
        text: "In the project's CLAUDE.md, describing the server's URL so Claude can connect when needed.",
        why: "CLAUDE.md は指示を書く所で、MCP サーバーの接続は設定しない。",
      },
      {
        text: "With claude mcp add at local scope, which applies only to you in this project.",
        why: "正解。local スコープは自分だけ・そのプロジェクトだけ。共有するなら project スコープ（.mcp.json）、全プロジェクトなら user。",
      },
      {
        text: "In a branch of the repository that only you check out, with the server added to .mcp.json there.",
        why: "ブランチを分けるのは運用が重く、マージで混ざる恐れもある。スコープで分けられる。",
      },
    ],
    answer: 2,
    point:
      "MCP サーバーのスコープ：local＝自分×このプロジェクト／project＝.mcp.json で共有／user＝自分の全プロジェクト",
  },
  {
    id: "s4-14",
    scenario: "s4",
    tasks: ["2.1", "2.4"],
    stem: 'Two MCP servers are connected: one exposes search for the internal wiki, the other exposes search for the issue tracker. Both tool descriptions just say "Search for content." The agent often searches the wrong system. What is the best fix?',
    options: [
      {
        text: "Disconnect one of the servers, since two search tools will always confuse the model.",
        why: "両方とも要る機能。説明で区別できる。",
      },
      {
        text: "Rewrite each description to say what it holds, what it is for, and when to use the other one.",
        why: "正解。モデルは説明で選ぶ。中身・向いている問い・もう一方との使い分けを書けば取り違えが減る。",
      },
      {
        text: 'Add a system prompt rule: "Try the wiki first, then the issue tracker if nothing is found."',
        why: "決まった順に試すと無駄な呼び出しが増え、問いに合う方を選ぶことにもならない。",
      },
      {
        text: "Merge both into one search tool that queries both systems at once and returns all of the results together in one list.",
        why: "毎回両方を引くと結果が混ざり、文脈も増える。選べるように説明を直すほうがよい。",
      },
    ],
    answer: 1,
    point: "似たツールの取り違えは、説明に中身・使う場面・もう一方との使い分けを書いて防ぐ",
  },
  {
    id: "s4-15",
    scenario: "s4",
    tasks: ["2.2"],
    stem: "An MCP tool that queries the build server throws an exception when the server is down. The client receives a protocol-level error, and the agent never sees a message it can reason about, so it stops. How should the tool report this failure?",
    options: [
      {
        text: "Let the exception propagate, because a protocol error makes the failure most visible.",
        why: "プロトコルのエラーはモデルに届かず、エージェントは対処を考えられない。",
      },
      {
        text: "Return an empty result so that the agent simply continues as if the build server had no data for this request.",
        why: "失敗を空の成功に見せると、誤った結論につながる。",
      },
      {
        text: 'Log the error on the server and return the text "OK" to keep the session alive.',
        why: "失敗を隠す。エージェントは誤った前提で進む。",
      },
      {
        text: "Catch it and return a tool result with isError set, saying the server is down and retryable.",
        why: "正解。ツールの実行の失敗は、結果の中で isError として返す。モデルはそれを読んで、再試行や代わりの手を選べる。",
      },
    ],
    answer: 3,
    point: "ツールの実行の失敗は、例外（プロトコルのエラー）でなく、結果の isError でモデルに見える形で返す",
  },
  {
    id: "s4-16",
    scenario: "s4",
    tasks: ["1.1"],
    stem: "Asked to fix a flaky test, the agent ran for 90 minutes and over 200 tool calls, repeatedly re-running the test and making small changes. Nothing in the loop limits how long it can go on. What should you add?",
    options: [
      {
        text: "A max_turns limit as a safety net, plus clear criteria for when to stop and report back.",
        why: "正解。上限（max_turns）は暴走を止める安全装置として置き、いつ止めて報告するかの基準も渡す。",
      },
      {
        text: "An instruction to finish within ten tool calls, so that the loop ends naturally.",
        why: "指示は確率的にしか守られない。上限は仕組みで置く。",
      },
      {
        text: 'A rule that the loop ends whenever the response contains the word "done".',
        why: "言い回しでの終了判定は壊れやすい。終わりは stop_reason で判断し、上限は別に置く。",
      },
      {
        text: "An instruction to post a progress summary to the engineer every 20 tool calls.",
        why: "進み具合は見えるが、止まる仕組みにはならない。誰も見ていなければ回り続ける。",
      },
    ],
    answer: 0,
    point: "ループには max_turns などの上限を安全装置として置き、止めて報告する基準も渡す",
  },
  {
    id: "s4-17",
    scenario: "s4",
    tasks: ["1.5"],
    stem: "The assistant has Bash so it can run builds and tests. Security requires that it never runs destructive commands such as rm -rf on directories outside the workspace or git push --force. What is the most reliable control?",
    options: [
      {
        text: "A strongly worded list of forbidden commands at the top of the system prompt.",
        why: "指示は確率的にしか守られない。決して起きてはならないことには向かない。",
      },
      {
        text: "A review of the Bash history after each session, reverting any destructive change found.",
        why: "起きた後では取り返しがつかないこともある。実行の前に止める。",
      },
      {
        text: "A PreToolUse hook that checks each Bash command against rules and blocks dangerous ones.",
        why: "正解。実行の前にコマンドを調べて止めるフックは決定的に効く。止めた理由を返せばモデルも別の手を選べる。",
      },
      {
        text: "Remove Bash entirely and give the agent no way to run builds or tests.",
        why: "必要な仕事までできなくなる。危ないものだけを止める。",
      },
    ],
    answer: 2,
    point: "決して実行させてはならないコマンドは、PreToolUse フックで実行前に調べて止める",
  },
  {
    id: "s4-18",
    scenario: "s4",
    tasks: ["3.1"],
    stem: "A team wants to start using the assistant's Claude Code integration on a large legacy repository that has no CLAUDE.md. They want a useful first version quickly and to improve it over time. What is the best way to start?",
    options: [
      {
        text: "Write a comprehensive CLAUDE.md by hand that documents every module before anyone uses it.",
        why: "時間がかかり、使う前から全部を書くと、要らないことまで毎回読まれる。",
      },
      {
        text: "Run /init to generate a starting CLAUDE.md, then edit it and add to it as issues come up.",
        why: "正解。/init で土台を作り、チームで見直してから、つまずいたことを足して育てる。",
      },
      {
        text: "Copy the CLAUDE.md from another team's repository, since the conventions are probably similar.",
        why: "別のリポジトリの規約は合わないことが多い。このリポジトリから作る。",
      },
      {
        text: "Skip CLAUDE.md for now and have each developer explain the conventions at the start of every session.",
        why: "毎回の説明は人によってばらつき、忘れやすい。",
      },
    ],
    answer: 1,
    point: "CLAUDE.md の無いリポジトリは /init で土台を作り、見直して、つまずくたびに書き足して育てる",
  },
  {
    id: "s4-19",
    scenario: "s4",
    tasks: ["1.6", "1.3"],
    stem: "You need to add the same health-check endpoint to 30 microservices. Each service is independent, but each has its own framework quirks. A single agent working through all 30 in one session runs out of context around service 12. How should you structure the job?",
    options: [
      {
        text: "Hand all 30 services to one subagent so that the main session's context stays clean.",
        why: "文脈が尽きる場所がサブエージェントに移るだけ。独立した単位ごとに分ける。",
      },
      {
        text: "Ask the agent to summarize its progress every five services and continue in the same session.",
        why: "要約しても文脈は少しずつ溜まり、細部が失われる。独立した作業を同じ文脈に詰める必要がない。",
      },
      {
        text: "Write a single generic patch and apply it to all 30 services without per-service checks.",
        why: "サービスごとのくせを無視することになり、壊れるサービスが出る。",
      },
      {
        text: "Run one subagent or session per service, each verifying its own change, and collect results.",
        why: "正解。独立した単位はそれぞれ別の文脈で扱い、各自で確かめさせ、結果を集める。",
      },
    ],
    answer: 3,
    point: "独立した同種の作業は、単位ごとに別の文脈（サブエージェントやセッション）で進め、各自で確かめて結果を集める",
  },
  {
    id: "s4-20",
    scenario: "s4",
    tasks: ["2.3"],
    stem: 'You add an "explain this code" subagent that only needs to read the repository. Right now it inherits every tool the main agent has, including Write, Edit, Bash, and all MCP tools, and once it started editing files it was only meant to explain. What should you do?',
    options: [
      {
        text: "Limit the subagent's tools to Read, Grep, and Glob, the ones its role actually needs.",
        why: "正解。ツールは役割に要るものだけに絞る。誤用を防ぎ、選ぶ迷いも減る。",
      },
      {
        text: 'Add "never edit files" to the subagent\'s prompt and keep the full tool set for flexibility.',
        why: "道具が残っていれば使われうる。役割に要らない道具は渡さない。",
      },
      {
        text: "Make the subagent ask the user for approval before every tool call it makes.",
        why: "読むだけの呼び出しにまで承認を求めると使いものにならない。道具を絞れば済む。",
      },
      {
        text: "Run the subagent on a copy of the repository so that its edits cannot do any harm.",
        why: "被害は防げても、説明役が編集するという誤用は残る。",
      },
    ],
    answer: 0,
    point: "サブエージェントのツールは役割に要るものだけに絞る（読む役なら Read・Grep・Glob）",
  },
];
