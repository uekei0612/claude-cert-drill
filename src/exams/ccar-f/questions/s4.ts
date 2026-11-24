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
  {
    id: "s4-21",
    scenario: "s4",
    tasks: ["1.1"],
    stem: 'The developer assistant runs chores through the Agent SDK with maxTurns set to 30. On large repositories, users are sometimes told "Done!" even though the chore is only half finished. The wrapper treats the arrival of the final result message as success. What should the wrapper do?',
    options: [
      {
        text: "Raise maxTurns to 300, so that even the largest chores always finish well before the limit is ever reached.",
        why: "上限は安全装置で、いずれ当たる。当たったかを確かめない限り、同じ誤報が起きる。",
      },
      {
        text: "Check the result message's subtype, and report error_max_turns as an unfinished run rather than a success.",
        why: "正解。result の subtype は終わり方を示す。success と、上限で止まった error_max_turns などを区別して扱う。",
      },
      {
        text: "Ask the model to end every final message with the word DONE, and count the run as successful only when that word appears.",
        why: "言い回しで終わりを判定するのは典型的な誤り。上限で止まったかは、SDK が返す終わり方で分かる。",
      },
      {
        text: "Count the tool calls in the transcript, and treat the run as successful if more than half of them returned no error.",
        why: "ツールが失敗しなかったことと、雑務が終わったことは別。途中で止まっても、それまでの呼び出しは成功している。",
      },
    ],
    answer: 1,
    point: "SDK の実行の終わり方は result の subtype で見る。error_max_turns を成功と扱わない",
  },
  {
    id: "s4-22",
    scenario: "s4",
    tasks: ["1.3"],
    stem: 'You added a custom subagent, test-runner, in .claude/agents/ with the description "Test helper." It works well when invoked by name, but Claude never delegates to it on its own, even right after making code changes. What is the most effective fix?',
    options: [
      {
        text: "Also copy the test-runner into every engineer's ~/.claude/agents, so that it is registered in two places at once.",
        why: "置き場所を増やしても、いつ使うべきかの手がかりは増えない。同じ定義が 2 つになり、管理が面倒になるだけ。",
      },
      {
        text: "Give the test-runner access to every available tool, so that Claude sees it as able to handle more kinds of tasks.",
        why: "ツールを増やしても、振るかどうかの判断材料にはならない。役割に要らないツールを与えるのは危険でもある。",
      },
      {
        text: "Add a line to CLAUDE.md telling Claude to remember that a subagent called test-runner exists in this project.",
        why: "存在を知らせても、いつ使うべきかは分からない。Claude が振る先を選ぶ手がかりは description。",
      },
      {
        text: "Rewrite the description to say what it does and when to use it, for example to run the tests after code changes.",
        why: "正解。Claude は description を見て、どのサブエージェントに振るかを決める。何をするかと、使う場面を具体的に書く。",
      },
    ],
    answer: 3,
    point: "サブエージェントに自動で振らせるには、description に何をするか・いつ使うかを具体的に書く",
  },
  {
    id: "s4-23",
    scenario: "s4",
    tasks: ["1.5"],
    stem: "Claude often leaves lint errors in the files it edits, and they are discovered only later in CI. You want every edit to be checked right away and any errors shown to Claude, so that it fixes them in the same session. What should you add?",
    options: [
      {
        text: "A PostToolUse hook on Edit|Write that runs the linter on the changed file and returns any errors to Claude.",
        why: "正解。PostToolUse は実行の後に動き、結果に情報を足せる。編集の直後に確かめ、エラーをその場で Claude に見せられる。",
      },
      {
        text: "A PreToolUse hook on Edit|Write that runs the linter on the file before Claude's change is applied to it.",
        why: "変更前のファイルを調べても、これから入る変更の誤りは分からない。確かめるのは編集の後。",
      },
      {
        text: "A line in CLAUDE.md that tells Claude to run the linter after every edit and to fix anything that it reports.",
        why: "CLAUDE.md の指示は確率的で、今まさに守られていない。毎回確実に走らせるならフック。",
      },
      {
        text: "A stricter lint step in CI that blocks merging, so that Claude's lint errors can never reach the main branch.",
        why: "main は守れるが、見つかるのは後になってから。同じセッションですぐ直させる目的に合わない。",
      },
    ],
    answer: 0,
    point: "編集の直後の確認と結果の返却は PostToolUse フック（Edit|Write）。確実に毎回走る",
  },
  {
    id: "s4-24",
    scenario: "s4",
    tasks: ["1.7"],
    stem: "An engineer ran a long onboarding analysis of a repository on their laptop. They now want a CI job to continue from that analysis, so the job runs claude -p with --resume and the laptop's session ID, but it fails because the session cannot be found. What should they do?",
    options: [
      {
        text: "Use --continue instead of --resume, since --continue picks up the most recent session no matter which machine created it.",
        why: "--continue は、その端末の今のディレクトリの一番新しいセッションを続ける。別の端末のセッションは見えない。",
      },
      {
        text: "Add --fork-session to the --resume call, since a forked copy of a session can be opened from any machine.",
        why: "分岐も、手元にある履歴をコピーするだけ。元のセッションが無ければ分岐もできない。",
      },
      {
        text: "Save the analysis results that the job needs, and pass them into a new session's prompt on the CI machine.",
        why: "正解。セッションのファイルは作った端末にしか無い。別の環境で続けるなら、要る結果をアプリの側で持っておき、新しいセッションに渡す。",
      },
      {
        text: "Retry --resume with a longer timeout, since the session is probably still being uploaded from the laptop.",
        why: "セッションはどこにも送られない。作った端末のディスクに保存されるだけなので、待っても見つからない。",
      },
    ],
    answer: 2,
    point:
      "セッションは作った端末にしか無い。別の環境で続けるなら、要る結果を持ち出して新しいセッションのプロンプトに入れる",
  },
  {
    id: "s4-25",
    scenario: "s4",
    tasks: ["2.1"],
    stem: 'An MCP tool, run_tests, is described simply as "Runs the tests." It always runs the full suite, which takes about 20 minutes, and Claude calls it after almost every small edit. What is the best fix?',
    options: [
      {
        text: "Make run_tests return an error whenever it is called less than 20 minutes after its previous call has finished.",
        why: "理由の分からない拒否になり、本当に全部のテストが要るときにも走らない。Claude には使い分けの手がかりが無いまま。",
      },
      {
        text: "Describe its cost and when to use it, and add another tool that runs only the tests for a single file.",
        why: "正解。説明には、何をするかだけでなく、重さと使う場面・使わない場面を書く。小さな確認のための軽い手段も用意する。",
      },
      {
        text: "Remove run_tests from the assistant entirely, and ask engineers to run the test suite themselves before committing.",
        why: "テストで確かめる手段そのものを失う。問題は使い方の手がかりが無いことで、ツールがあることではない。",
      },
      {
        text: "Speed up the suite by stripping out most of its assertions, so that frequent calls to run_tests become much cheaper.",
        why: "テストを弱めて速さを買う、本末転倒の手。何をいつ使うかを伝えれば済む。",
      },
    ],
    answer: 1,
    point: "ツールの説明には重さ（時間・費用）と使う場面・使わない場面を書き、軽い用途には別の手段を用意する",
  },
  {
    id: "s4-26",
    scenario: "s4",
    tasks: ["2.3"],
    stem: "A docs-summarizer subagent was defined with a description and a prompt but no tools field. During one run it executed a Bash command that rewrote a configuration file. The subagent only needs to read code and documentation. What is the best fix?",
    options: [
      {
        text: "Give it a tools allowlist of Read, Grep, and Glob, because leaving out tools means it inherits every tool.",
        why: "正解。tools を書かないと、サブエージェントは使えるツールをすべて引き継ぐ。読む役なら、読むツールだけを許可リストで渡す。",
      },
      {
        text: "Add disallowedTools: Bash to the definition, which removes the only tool that is able to change files.",
        why: "ファイルを変えられるのは Bash だけではない。Write や Edit、MCP のツールも引き継いだまま残る。",
      },
      {
        text: 'Add "You are read-only. Never modify files." to its prompt, and keep the rest of the definition unchanged.',
        why: "指示は確率的。使わせたくないツールは、そもそも渡さない。",
      },
      {
        text: "Add a PreToolUse hook that blocks Bash for every agent in the project, including the main agent.",
        why: "本体の作業に要る Bash まで止まる。原因は、このサブエージェントにツールを渡しすぎていること。",
      },
    ],
    answer: 0,
    point: "サブエージェントの tools を書かないと全ツールを引き継ぐ。役割に要るツールを許可リストで渡す",
  },
  {
    id: "s4-27",
    scenario: "s4",
    tasks: ["2.4"],
    stem: 'You want the assistant to ask for approval before it creates GitHub issues through the github MCP server. You added a PreToolUse hook with the matcher "create_issue", but it never fires, even though the logs show issues being created. What is wrong?',
    options: [
      {
        text: "PreToolUse hooks never apply to MCP tools; approval for MCP tools can only be configured inside each MCP server.",
        why: "誤り。フックは MCP のツールにもかかる。名前の形を合わせれば止めたり確認したりできる。",
      },
      {
        text: 'Change the matcher to "mcp__github", so that the hook catches every tool that the github server provides.',
        why: '記号の無い matcher は名前の完全一致として扱われ、"mcp__github" という名前のツールは無いので何にも合わない。サーバーの全ツールなら mcp__github__.* と書く。',
      },
      {
        text: "The hook must be registered inside the github MCP server's own configuration, not in the client's settings.",
        why: "フックはクライアント（Claude Code や Agent SDK）の側の仕組み。サーバーの設定に書くものではない。",
      },
      {
        text: "MCP tools are named mcp__<server>__<tool>, so the matcher has to be the full name, mcp__github__create_issue.",
        why: "正解。MCP のツールは mcp__<サーバー名>__<ツール名> という名前になり、フックの matcher や権限の規則もこの名前で書く。",
      },
    ],
    answer: 3,
    point:
      "MCP のツール名は mcp__<サーバー>__<ツール>。フックの matcher もこの名前で書く（サーバー全体なら mcp__github__.*）",
  },
  {
    id: "s4-28",
    scenario: "s4",
    tasks: ["2.5"],
    stem: "Logs show the assistant using Bash for routine lookups: cat to view files, find to locate files by name, and grep -r to search their contents. Engineers have to approve each Bash command, and the large outputs flood the context. What should the assistant do instead?",
    options: [
      {
        text: "Approve Bash permanently for all commands, so that these lookups can run without interrupting the engineers.",
        why: "何でも実行できる状態になり危険。大きな出力で文脈が埋まる問題も残る。",
      },
      {
        text: "Pipe every Bash command through head -n 50, so that no single command is able to flood the context with output.",
        why: "一律に切ると、要る結果まで落とす。承認の手間も残る。",
      },
      {
        text: "Use the dedicated tools instead: Read to view files, Glob to find them by name, and Grep to search contents.",
        why: "正解。読む・名前で探す・中身で探すには専用の組み込みツールがある。読むだけなので承認も要らず、出力の量も絞れる。",
      },
      {
        text: "Use Write to save each command's output to a temporary file, and then read only the parts that are needed later.",
        why: "Write は書くための道具で、回り道になる。専用の検索と読み込みのツールを使えば済む。",
      },
    ],
    answer: 2,
    point: "見る・名前で探す・中身で探すは Read・Glob・Grep。Bash の cat・find・grep で代用しない",
  },
  {
    id: "s4-29",
    scenario: "s4",
    tasks: ["3.2"],
    stem: "The team updated its project skill, .claude/skills/review/SKILL.md, with a new checklist. One engineer keeps getting the old behavior when running /review, while everyone else gets the new checklist. That engineer once copied the skill to ~/.claude/skills/review/ to experiment with it. What explains this?",
    options: [
      {
        text: "Project skills are cached on each machine, and the engineer must clear that cache before the update takes effect.",
        why: "そういう仕組みではない。原因は同じ名前のスキルの優先順位。",
      },
      {
        text: "A personal skill with the same name takes precedence over the project skill, so the old copy is used.",
        why: "正解。同じ名前のスキルは、個人がプロジェクトより優先される。試した写しを消すか、名前を変える。",
      },
      {
        text: "Skills are merged by name, so the engineer's copy and the team's version are combined into a single checklist.",
        why: "混ざらない。優先されたほうがまるごと使われる。",
      },
      {
        text: "The project skill is overridden by an older .claude/commands/review.md in the repository, which always runs first.",
        why: "同じ名前ならスキルがコマンドより優先される。それにリポジトリのものなら全員に同じことが起きるはず。",
      },
    ],
    answer: 1,
    point: "同じ名前のスキルは個人 ＞ プロジェクト（まるごと）。スキル ＞ 同名のコマンド",
  },
  {
    id: "s4-30",
    scenario: "s4",
    tasks: ["5.4"],
    stem: "An engineer asks the assistant to inventory how 400 files use a deprecated API. Midway through, the session crashes, and the restarted run begins again from the first file. Even before the crash, findings from the early files were fading as the context filled up. What is the best way to structure this task?",
    options: [
      {
        text: "Have the agent record its findings and progress in a file as it goes, and read that file to resume after any interruption.",
        why: "正解。状態をファイルに書き出しておけば、文脈が埋まっても事実は読み直せ、落ちても続きから再開できる。",
      },
      {
        text: "Switch to a model with a larger context window, so that all 400 files fit and every finding stays in view to the end.",
        why: "大きい文脈でも埋もれる問題は残り、落ちたときに最初からになる問題も解けない。",
      },
      {
        text: "Ask the agent to work faster by skimming the files, so that the whole inventory is finished before the context fills.",
        why: "流し読みは見落としを増やす。棚卸しの正確さを落とすだけ。",
      },
      {
        text: "Give the agent the whole list of 400 files up front, and tell it to keep all of its findings in mind until it finishes.",
        why: "「覚えておいて」では、文脈が埋まって薄れることも、落ちて消えることも防げない。",
      },
    ],
    answer: 0,
    point: "長い作業は見つけたことと進み具合をファイルに書き出す。文脈が埋まっても読み直せ、落ちても続きから再開できる",
  },
];
