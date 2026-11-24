/* シナリオ 3：マルチエージェントの調査システム（自作問題） */
import type { Question } from "../../../core/exam/types";

export const s3: Question[] = [
  {
    id: "s3-01",
    scenario: "s3",
    tasks: ["1.2"],
    stem: 'For the topic "renewable energy adoption in Southeast Asia," the final report covers only solar power in Vietnam and Thailand. Logs show every subagent did its assigned task correctly and thoroughly. Where is the root cause most likely to be?',
    options: [
      {
        text: "The web search subagent's search tool returns too few results per query.",
        why: "各サブエージェントは割り当てを正しくこなしている。検索の件数ではなく、何を割り当てたかが問題。",
      },
      {
        text: "The synthesis subagent dropped findings about other countries and energy sources.",
        why: "統合が落としたなら、他国や他の電源の調査結果がログにあるはず。そもそも調べていない。",
      },
      {
        text: "The report subagent hit its output length limit and silently truncated the sections about other countries and energy sources.",
        why: "切れたのなら他の部分の材料が途中まであるはず。範囲そのものが狭い。",
      },
      {
        text: "The coordinator split the topic too narrowly.",
        why: "正解。全員が正しく働いても範囲が足りないなら、原因はコーディネーターの分解の段階にある。狭すぎる分解は広いテーマの典型的な失敗。",
      },
    ],
    answer: 3,
    point: "全員が正しく働いたのに範囲が足りない → コーディネーターの分解が狭すぎる",
  },
  {
    id: "s3-02",
    scenario: "s3",
    tasks: ["1.2", "5.3"],
    stem: "To reduce latency, a teammate proposes letting the search subagent send its results directly to the synthesis subagent, bypassing the coordinator. What is the strongest argument for keeping all communication routed through the coordinator?",
    options: [
      {
        text: "Subagents cannot technically send messages to each other in the Agent SDK.",
        why: "技術的にできるかどうかではなく、設計としてなぜ通すかが問われている。",
      },
      {
        text: "It gives one place for observability, consistent error handling, and control of information flow.",
        why: "正解。ハブ＆スポークでは、情報の流れ・エラー処理・観測をコーディネーターに集める。直接やり取りさせると、失敗や抜けが見えなくなる。",
      },
      {
        text: "The coordinator compresses the search results before forwarding them, which always improves the quality of the synthesis step.",
        why: "圧縮は出典や数字を落とす危険もあり、「常に良くなる」わけではない。",
      },
      {
        text: "Direct communication would cause the subagents to share a single context window.",
        why: "サブエージェントは独立した文脈で動く。直接やり取りしても文脈は共有されない。",
      },
    ],
    answer: 1,
    point: "サブエージェント間の情報はコーディネーターを通す：観測・一貫したエラー処理・情報の流れの制御のため",
  },
  {
    id: "s3-03",
    scenario: "s3",
    tasks: ["1.3"],
    stem: "The synthesis subagent's output often ignores findings from the document analysis subagent, even though the coordinator has those findings in its own conversation history. How should you fix this?",
    options: [
      {
        text: "Put the document analysis findings directly into the synthesis subagent's prompt.",
        why: "正解。サブエージェントはコーディネーターの会話を引き継がない。必要な結果はすべて、起動するときのプロンプトに明示して渡す。",
      },
      {
        text: "Give the synthesis subagent access to the document analysis tools so it can redo any analysis it needs and check the findings itself.",
        why: "専門外のツールを持たせると誤用や重複作業の元になる。結果を渡せば済む。",
      },
      {
        text: "Tell the synthesis subagent in its prompt to review the coordinator's history before writing.",
        why: "サブエージェントは親の履歴を読めない。見えないものは指示しても見えない。",
      },
      {
        text: "Run the document analysis subagent and the synthesis subagent in the same session so they share memory.",
        why: "サブエージェントは呼び出しごとに独立した文脈で動き、共有メモリは無い。",
      },
    ],
    answer: 0,
    point: "サブエージェントは親の文脈を引き継がない。前の工程の結果はプロンプトに明示して渡す",
  },
  {
    id: "s3-04",
    scenario: "s3",
    tasks: ["1.3"],
    stem: "The coordinator needs results from four independent web searches on different subtopics. Currently it invokes the search subagent once, waits for the result, and then invokes it again for the next subtopic. How can you reduce total latency?",
    options: [
      {
        text: "Ask the search subagent to handle all four subtopics in one invocation, one after another.",
        why: "1 つの呼び出しの中で順に処理するだけで、並列にはならない。",
      },
      {
        text: "Start four separate coordinator sessions, one per subtopic, and merge their four reports with a final script at the end.",
        why: "コーディネーターを分けると、全体の分解・統合を担う役がいなくなる。",
      },
      {
        text: "Have the coordinator emit four Agent (formerly Task) tool calls in one response.",
        why: "正解。並列に動かすには、1 回の応答の中で Agent ツール（旧名 Task）の呼び出しを複数出す。別々のターンに分けると順番になる。",
      },
      {
        text: 'Set tool_choice to "any" so the coordinator calls tools more aggressively.',
        why: "tool_choice はツールを呼ぶかどうかの指定で、並列化の手段ではない。",
      },
    ],
    answer: 2,
    point: "サブエージェントを並列に動かすには、1 回の応答で Agent（旧 Task）の呼び出しを複数出す",
  },
  {
    id: "s3-05",
    scenario: "s3",
    tasks: ["2.1"],
    stem: "The document analysis subagent has two tools, analyze_content and analyze_document, whose descriptions are nearly identical. The agent frequently uses analyze_document on web search snippets, which produces poor results. What is the best fix?",
    options: [
      {
        text: 'Add a sentence to the system prompt saying "Always prefer analyze_content for short text such as search snippets."',
        why: "名前と説明の重なりという根本が残る。システムプロンプトの一文に頼る選び分けは崩れやすい。",
      },
      {
        text: "Rename the tools and rewrite descriptions so purposes do not overlap, e.g. extract_web_results for snippets.",
        why: "正解。ツール選択の主な手がかりは説明。重なりを無くすように名前と説明を変え、使う場面・入力・似たツールとの違いを書く。",
      },
      {
        text: "Remove analyze_content so that only one analysis tool remains.",
        why: "取り違えは止まるが、別の用途の機能まで失う。役割を分け直すのが筋。",
      },
      {
        text: "Make analyze_document reject inputs shorter than a page, so snippets fail and get retried.",
        why: "誤った選択を後で弾くだけで、選ぶ段階の曖昧さは残る。失敗と再試行が増える。",
      },
    ],
    answer: 1,
    point: "似たツールの取り違えは、名前と説明を変えて役割の重なりを無くす（使う場面・入力・違いを書く）",
  },
  {
    id: "s3-06",
    scenario: "s3",
    tasks: ["2.3"],
    stem: "The synthesis subagent was given all 18 tools available in the system. It sometimes starts its own web searches instead of synthesizing, and it picks the wrong tool more often than the other subagents. It does legitimately need to double-check a specific fact now and then. What is the best tool configuration?",
    options: [
      {
        text: "Keep all 18 tools but add a system prompt rule that forbids starting any web search while the synthesis step is in progress.",
        why: "ツールが多いこと自体が選択の精度を落とす。禁止の指示も確率的にしか守られない。",
      },
      {
        text: "Remove every tool except the report-writing tool so the subagent cannot misuse anything.",
        why: "事実の確認という正当な必要まで奪う。確認のたびにコーディネーターを経由することになる。",
      },
      {
        text: "Give the synthesis subagent the full web search toolset but limit it to three searches per run.",
        why: "回数を絞っても、専門外の調査を始める問題はそのまま。",
      },
      {
        text: "Limit it to its synthesis tools plus a narrow verify_fact tool; route complex lookups via the coordinator.",
        why: "正解。役割に要るツールだけに絞り、頻繁に要る他の役割の機能は範囲を絞ったツールとして渡す。複雑な調べものはコーディネーター経由。",
      },
    ],
    answer: 3,
    point: "ツールは役割に要るものだけに絞り、頻繁に要る機能は範囲を絞った専用ツール（verify_fact 等）で渡す",
  },
  {
    id: "s3-07",
    scenario: "s3",
    tasks: ["5.3"],
    stem: "The web search subagent hits a timeout on one of its three queries. Currently it returns an empty result list marked as success, and the final report presents the topic as having no relevant sources. What should the subagent do instead?",
    options: [
      {
        text: "Retry locally; if that fails, report the failure type, the query, partial results, and alternatives.",
        why: "正解。一時的な失敗はまず手元で再試行し、解決できなければ種類・試したこと・途中の結果・代わりの手段を添えて伝える。コーディネーターが立て直せる。",
      },
      {
        text: 'Return "search unavailable" so the coordinator knows something went wrong.',
        why: "一般的な状態だけでは、何を試し何が取れたかが消え、コーディネーターは判断できない。",
      },
      {
        text: "Raise an exception that terminates the whole research workflow so that a human can investigate the failing query before anything is published.",
        why: "1 つの失敗で全体を止めるのは過剰。他の 2 つのクエリの結果まで捨てることになる。",
      },
      {
        text: "Keep returning an empty list, but add a footnote to the final report that some searches may have failed.",
        why: "空の成功として返す握りつぶしは残ったまま。どこが欠けたか分からない注記では意味が無い。",
      },
    ],
    answer: 0,
    point: "失敗を空の成功にしない。手元で再試行し、だめなら種類・試したこと・途中結果・代替を添えて上に伝える",
  },
  {
    id: "s3-08",
    scenario: "s3",
    tasks: ["5.6"],
    stem: "Two credible sources report different figures for the same statistic: one says 34% of firms adopted a practice, the other says 41%. The report must be accurate and fully cited. How should the system handle this?",
    options: [
      {
        text: "Use the more recent source's figure and cite only that source, since newer data supersedes older data.",
        why: "新しさだけで一方を選ぶと、食い違いがあった事実が消える。理由が時期の違いなら、そう書くべき。",
      },
      {
        text: "Average the two values and report 37.5%, citing both sources.",
        why: "どちらの出典にも無い数字を作っている。出典の主張を勝手に変えるのは誤り。",
      },
      {
        text: "Report both figures with sources and dates, and flag the conflict explicitly.",
        why: "正解。信頼できる出典どうしの食い違いは、両方を出典つきで示して注記する。日付があれば、時期の違いを矛盾と取り違えない。",
      },
      {
        text: "Drop the statistic from the report because the sources disagree.",
        why: "重要な情報を捨てている。食い違いがあることもまた情報。",
      },
    ],
    answer: 2,
    point: "出典どうしの数字の食い違いは、両方を出典と日付つきで示して注記する（勝手に選ばない・混ぜない）",
  },
  {
    id: "s3-09",
    scenario: "s3",
    tasks: ["5.6", "1.3"],
    stem: "Final reports often contain claims without citations, even though the search and analysis subagents found the sources. The analysis subagent passes its findings to synthesis as a prose summary. What change best preserves attribution?",
    options: [
      {
        text: 'Tell the synthesis subagent to "always cite your sources" in its system prompt.',
        why: "統合に届いた時点で、主張と出典の対応が既に失われている。指示では取り戻せない。",
      },
      {
        text: "Have analysis output structured claim-to-source mappings that synthesis must preserve.",
        why: "正解。出典は要約の段階で落ちる。主張と出典の対応を構造化して渡し、統合でもそれを保たせる。本文とメタデータを分けるのがコツ。",
      },
      {
        text: "Have the report subagent search the web again to find a supporting source for each uncited claim before it writes the final report.",
        why: "後から出典を探すと、元の根拠と違う出典を付けかねない。対応を最初から保つべき。",
      },
      {
        text: "Pass the full raw documents to the synthesis subagent instead of summaries.",
        why: "文脈を大量に使い、真ん中の情報が落ちやすくなる。構造化した対応表のほうが確実で軽い。",
      },
    ],
    answer: 1,
    point: "出典を保つには、主張と出典（URL・文書名・該当箇所）の対応を構造化して渡し、統合でも保たせる",
  },
  {
    id: "s3-10",
    scenario: "s3",
    tasks: ["1.6", "1.2"],
    stem: "Users submit open-ended research questions where the relevant subtopics only become clear after the first round of searching. Currently the coordinator runs the same fixed sequence of subagents for every question. What decomposition strategy fits better?",
    options: [
      {
        text: "Keep the fixed pipeline but add more specialist subagents so that every possible subtopic is always covered for every question.",
        why: "すべての問いに全工程を通すのは無駄が多く、それでも想定外のテーマは拾えない。",
      },
      {
        text: "Let each subagent decide on its own which other subagents to call next.",
        why: "流れの制御と観測がコーディネーターから失われる。ハブ＆スポークに反する。",
      },
      {
        text: "Ask users to break their question into subtopics before submitting it.",
        why: "分解はシステムの仕事。利用者に押し付けても、調べる前に分かる範囲しか出ない。",
      },
      {
        text: "Decompose dynamically: generate follow-up subtasks from what the first round finds.",
        why: "正解。調べてみないと分からない作業は、途中の発見に応じて分解し直す。穴があれば的を絞って再委任する。",
      },
    ],
    answer: 3,
    point: "途中で範囲が分かる調査は、発見に応じて分解し直す動的な分解（固定のパイプラインではなく）",
  },
  {
    id: "s3-11",
    scenario: "s3",
    tasks: ["1.2"],
    stem: "The synthesis agent reports that the draft has no data on adoption in Asia, one of the topic's main angles. Currently the coordinator passes the draft straight to the report writing agent anyway. What should the coordinator do?",
    options: [
      {
        text: "Send targeted follow-up searches for the gap, then re-run synthesis before writing the report.",
        why: "正解。コーディネーターは結果を評価し、足りない所を狙って再度振る。埋まってから次の工程へ進める。",
      },
      {
        text: "Tell the report writing agent to fill in the missing section from its own general knowledge, marking it as a draft.",
        why: "出典の無い主張が入る。すべての主張に出典を付けるという要件に反する。",
      },
      {
        text: "Restart the whole research run from scratch with a longer and more detailed topic prompt.",
        why: "うまくいった部分まで捨てることになる。抜けた所だけを補えばよい。",
      },
      {
        text: "Publish the report without that section and rely on readers to notice what is missing.",
        why: "抜けを読み手に気づかせる設計は不親切で、少なくとも抜けていることを明記すべき。補えるなら補う。",
      },
    ],
    answer: 0,
    point: "コーディネーターは結果を評価し、抜けを狙って再度振ってから次の工程へ（そのまま流さない）",
  },
  {
    id: "s3-12",
    scenario: "s3",
    tasks: ["1.3"],
    stem: "You defined four subagents in the agents option of the Agent SDK, each with a description, prompt, and tools. In testing, the coordinator never delegates. It does all the searching and writing itself. What is the most likely cause?",
    options: [
      {
        text: "The subagent prompts are too long, so the coordinator cannot read their definitions.",
        why: "コーディネーターが判断に使うのは主に description。プロンプトの長さは振らない理由にならない。",
      },
      {
        text: "Subagents can only be started by the user, not by another agent, in the Agent SDK.",
        why: "誤り。コーディネーターがサブエージェントを起動するのが基本の使い方。",
      },
      {
        text: "The coordinator's allowed tools do not include the tool that spawns subagents (Agent, formerly Task).",
        why: "正解。サブエージェントは Agent ツール（旧名 Task）で起動する。コーディネーターの allowedTools に入っていなければ振れない。",
      },
      {
        text: "All four subagents share the same model, so the coordinator sees no benefit in delegating.",
        why: "モデルが同じでも、文脈を分け、役割に絞れる利点がある。振らない理由にならない。",
      },
    ],
    answer: 2,
    point:
      "コーディネーターが振らない → allowedTools に Agent（旧 Task）が無い（サブエージェントは Agent ツールで起動する）",
  },
  {
    id: "s3-13",
    scenario: "s3",
    tasks: ["2.1"],
    stem: "The document analysis agent has a single tool, analyze_document(document, instructions). It is used for summarizing, pulling out statistics, and checking specific claims, and the results vary widely in shape and quality. How should you redesign it?",
    options: [
      {
        text: "Keep the one tool and add a long list of example instruction strings to its description.",
        why: "何でもできる 1 つのツールのままでは、目的ごとの入出力が定まらない。",
      },
      {
        text: "Split it into purpose-specific tools such as extract_statistics and verify_claim.",
        why: "正解。目的ごとのツールにし、それぞれの入力・出力・使う場面を説明に書く。結果の形もそろう。",
      },
      {
        text: "Replace it with a general-purpose Bash tool so the agent can process documents however it likes.",
        why: "さらに汎用になり、結果のばらつきも危険も増える。",
      },
      {
        text: "Add a mode parameter with free-text values so the agent can describe the kind of analysis it wants.",
        why: "自由な文字列では選び方も結果の形も定まらない。分けるなら、はっきり分ける。",
      },
    ],
    answer: 1,
    point: "何でもする汎用ツールは、目的ごとのツールに分け、それぞれの入出力と使う場面を説明に書く",
  },
  {
    id: "s3-14",
    scenario: "s3",
    tasks: ["2.3", "4.3"],
    stem: "The synthesis agent should always finish by calling one of two tools: submit_findings or report_insufficient_evidence. Sometimes it replies in plain prose instead, and the coordinator cannot parse the result. What should you configure?",
    options: [
      {
        text: 'Set tool_choice to "auto" and add both tools to the end of the system prompt.',
        why: "auto はツールを使うかどうかをモデルに任せる。文章で答えることを防げない。",
      },
      {
        text: "Set tool_choice to submit_findings by name so that the agent always produces structured output.",
        why: "名指しすると、証拠が足りないときも submit_findings を強いられる。2 つのうちどちらかを選ばせたい。",
      },
      {
        text: "Parse the prose with a regular expression whenever no tool call is found in the response.",
        why: "後始末としては壊れやすい。出させ方の側で決める。",
      },
      {
        text: 'Set tool_choice to "any" so the agent must call one of the tools but may choose which one.',
        why: '正解。"any" はいずれかのツールの呼び出しを強制し、どれを呼ぶかはモデルが選ぶ。',
      },
    ],
    answer: 3,
    point: "「どれかのツールを必ず、どれかは任せる」は tool_choice: any。特定の 1 つなら名指し",
  },
  {
    id: "s3-15",
    scenario: "s3",
    tasks: ["5.3"],
    stem: "The web search subagent fails permanently on one of five subtopics because the main source for it is behind a paywall. The coordinator currently aborts the whole run when any subagent fails. What is the better strategy?",
    options: [
      {
        text: "Continue with the other subtopics and state the coverage gap and its reason in the report.",
        why: "正解。1 つの失敗で全体を止めない。分かったことは使い、抜けとその理由をレポートに明記する。",
      },
      {
        text: "Retry the failing subtopic in a loop until it succeeds, however long that takes.",
        why: "ペイウォールは再試行で越えられない。恒久的な失敗に繰り返しは無意味。",
      },
      {
        text: "Drop the failing subtopic silently so that the report looks complete to the reader.",
        why: "抜けを隠すと、読み手は網羅されていると誤解する。",
      },
      {
        text: "Ask the synthesis agent to estimate the missing subtopic from the other four results so that the report stays complete.",
        why: "出典の無い推定が主張として混ざる。",
      },
    ],
    answer: 0,
    point: "一部の失敗で全体を止めず、分かったことで進め、抜けと理由をはっきり書く（隠さない・作らない）",
  },
  {
    id: "s3-16",
    scenario: "s3",
    tasks: ["5.6"],
    stem: "One source says a market is worth $4.2B and another says $6.8B. The synthesis agent flagged this as a contradiction, but the first figure is from 2021 and the second from 2024. What change would let the system handle cases like this correctly?",
    options: [
      {
        text: "Have the synthesis agent search for a third source and go with the majority.",
        why: "3 つ目を探しても、時点の違いという本当の理由が見えないまま多数決になる。",
      },
      {
        text: "Average the two figures and cite both sources for the resulting number.",
        why: "時点の違う数字を混ぜると、どちらの事実でもない数字になる。",
      },
      {
        text: "Have subagents return the publication or data date with every finding they pass on.",
        why: "正解。時点を所見と一緒に渡せば、統合は変化として扱える。日付が無いと矛盾に見える。",
      },
      {
        text: "Discard any source older than one year so that only current figures reach synthesis.",
        why: "推移を示す古いデータも価値がある。捨てずに時点を付ける。",
      },
    ],
    answer: 2,
    point: "所見には公開日・データの時点を付けて渡す。時点の違いを矛盾と誤解させない",
  },
  {
    id: "s3-17",
    scenario: "s3",
    tasks: ["5.1", "1.3"],
    stem: "Each subagent returns its full transcript, including every page it fetched, to the coordinator. After three or four delegations the coordinator's context is nearly full and its later decisions get worse. What should subagents return instead?",
    options: [
      {
        text: "The full transcript, but compressed with a general-purpose text summarizer first.",
        why: "汎用の要約は、主張と出典の対応のような大事な構造を落としうる。何を返すかを決めて構造化する。",
      },
      {
        text: "A structured result with the key findings, their sources, and anything left unresolved.",
        why: "正解。コーディネーターの判断に要るのは結論・出典・残った問題。構造化して返せば文脈も小さく済む。",
      },
      {
        text: "Only a yes or no on whether the task succeeded, so the coordinator's context stays small.",
        why: "少なすぎて、次に何をすべきかをコーディネーターが判断できない。",
      },
      {
        text: "Nothing at all; subagents should write results to shared files that the coordinator never reads.",
        why: "コーディネーターが結果を見られなければ、評価も次の振り分けもできない。",
      },
    ],
    answer: 1,
    point: "サブエージェントは全文でなく、所見・出典・未解決点を構造化して返す（コーディネーターの文脈を守る）",
  },
  {
    id: "s3-18",
    scenario: "s3",
    tasks: ["1.6"],
    stem: "A separate weekly job produces the same competitor brief every Monday: fetch five known sources, extract pricing changes, compare with last week, and write a summary. The steps never change. How should this task be decomposed?",
    options: [
      {
        text: "Let a coordinator agent plan the steps from scratch every week based on what it finds.",
        why: "毎回計画させると、決まった手順がぶれ、費用も増える。動的な分解は範囲が読めないとき向け。",
      },
      {
        text: "Give one agent all the instructions in a single prompt and let it decide the order of the steps itself each week.",
        why: "順序が決まっているのに任せると、工程を飛ばしたりぶれたりする。",
      },
      {
        text: "Spawn a separate subagent for every source and every comparison, then let them coordinate.",
        why: "サブエージェントどうしで調整させると流れが見えにくくなる。固定の手順には大げさ。",
      },
      {
        text: "Use a fixed sequence of prompts, each step feeding its output to the next, with checks between.",
        why: "正解。手順が決まっていて毎回同じなら、固定の連鎖（プロンプトチェーン）にして間で確かめるのが確実。",
      },
    ],
    answer: 3,
    point: "手順が決まっている繰り返しの作業は、固定のプロンプトチェーン。動的な分解は範囲が読めないとき",
  },
  {
    id: "s3-19",
    scenario: "s3",
    tasks: ["5.6"],
    stem: "Readers of the final reports cannot tell which conclusions are backed by several independent studies and which rest on a single blog post. Every claim is already cited. What should change in how the report presents findings?",
    options: [
      {
        text: "Separate well-supported findings from contested or single-source ones, and say which is which.",
        why: "正解。出典があるだけでは足りない。裏付けの強さで分け、確かなこと・争いのあること・1 つの出典だけのことを区別して示す。",
      },
      {
        text: "Remove every claim that is supported by only one source, so the report contains only strong ones.",
        why: "価値のある新しい知見まで消える。消すのではなく、強さを示す。",
      },
      {
        text: "Add more citations to each claim by searching for additional sources that say the same thing.",
        why: "同じ内容の出典を増やしても、独立しているとは限らない。強さを示すことが要る。",
      },
      {
        text: "Write the whole report in a more cautious tone so that no single claim sounds too certain.",
        why: "一律に弱めると、確かなことと不確かなことの区別がかえって消える。",
      },
    ],
    answer: 0,
    point: "出典の有無だけでなく、裏付けの強さ（確立・争いあり・単一出典）を区別して示す",
  },
  {
    id: "s3-20",
    scenario: "s3",
    tasks: ["1.2"],
    stem: 'Logs show the web search subagent and the document analysis subagent often cover the same reports, while some angles of the topic are covered by neither. The coordinator delegates with prompts like "research the topic". What should change?',
    options: [
      {
        text: "Let the two subagents message each other directly so they can agree on who covers what.",
        why: "サブエージェントどうしを直接つなぐと流れが追えなくなる。分担はコーディネーターが決める。",
      },
      {
        text: "Merge the two subagents into one, so that duplication between them becomes impossible.",
        why: "重複は消えても、抜けは残る。専門を分けた利点も失う。",
      },
      {
        text: "Have the coordinator give each subagent an explicit scope: which angles and sources it owns.",
        why: "正解。重複と抜けは、振るときの範囲があいまいなせい。コーディネーターが切り口と情報源の分担をはっきり渡す。",
      },
      {
        text: "Run the subagents one after another so that the second can see what the first already did.",
        why: "直列にすると遅くなり、範囲の抜けも直らない。",
      },
    ],
    answer: 2,
    point: "サブエージェントの重複と抜けは、コーディネーターが範囲（切り口・情報源）をはっきり分けて渡して防ぐ",
  },
  {
    id: "s3-21",
    scenario: "s3",
    tasks: ["1.2"],
    stem: 'The coordinator evaluates each synthesized draft and sends any gaps back for more research. On broad topics it keeps finding "possible gaps," and on one request it has run 14 rounds without ever producing a report. What is the best fix?',
    options: [
      {
        text: "Remove the evaluation step, so that the coordinator passes the first synthesis straight to the report writing agent.",
        why: "評価をやめると、抜けがそのままレポートに出る。問題は評価することではなく、止める基準が無いこと。",
      },
      {
        text: "Allow the synthesis agent to call the web search agent directly whenever it finds a gap, without involving the coordinator.",
        why: "サブエージェント同士を直接話させると、流れが見えなくなる。しかも止める基準が無いのは同じで、ループは止まらない。",
      },
      {
        text: "Switch the coordinator to a larger model, which can judge more reliably when a report is thorough enough to publish.",
        why: "「十分」の基準が書かれていないことは、モデルを大きくしても解けない。判断の材料が無いまま。",
      },
      {
        text: "Give the coordinator explicit completion criteria and a round limit, and have it list the remaining gaps when it stops.",
        why: "正解。評価して差し戻す仕組みには、何をもって十分とするかの基準と、安全装置としての上限が要る。止めたときは残った抜けを隠さず報告に書く。",
      },
    ],
    answer: 3,
    point: "評価と差し戻しのループには、終わりの基準（何を満たせば十分か）と回数の上限を置き、残った抜けは報告に書く",
  },
  {
    id: "s3-22",
    scenario: "s3",
    tasks: ["1.2"],
    stem: 'Every request runs through all four subagents in a fixed order, even a narrow question such as "What year was this standard first published?" Such questions take minutes and come back as multi-page reports. How should the coordinator be changed?',
    options: [
      {
        text: "Keep the fixed order for consistency, but instruct each subagent to keep its output short when the request is simple.",
        why: "出力が短くなっても、要らない工程を全部通る時間はそのまま。どの工程が要るかを決める所が無いのが問題。",
      },
      {
        text: "Have the coordinator analyze each request and invoke only the subagents that the request actually needs.",
        why: "正解。どの専門役を使うかを依頼に応じて決めるのが、コーディネーターの役目。狭い質問なら検索だけで答えられる。",
      },
      {
        text: 'Route requests with a keyword list in code, so that questions starting with "what year" or "who" go only to search.',
        why: "言い回しのリストは、少し違う聞き方ですぐ外れる。依頼の中身で判断するのはコーディネーターのモデルに任せる。",
      },
      {
        text: "Let each subagent decide by itself whether to skip its own step, based on the output handed over by the previous one.",
        why: "各サブエージェントは依頼全体を見ていない。どの工程が要るかの判断は、全体を見ているコーディネーターがする。",
      },
    ],
    answer: 1,
    point: "コーディネーターは依頼ごとに要るサブエージェントだけを選んで呼ぶ（毎回すべてを固定順で通さない）",
  },
  {
    id: "s3-23",
    scenario: "s3",
    tasks: ["1.3"],
    stem: "You defined the four subagents in the agents option of the Agent SDK, each with a clear description, prompt, and tool list. Yet the coordinator never delegates: it answers from its own knowledge, and the logs show no subagent invocations at all. The coordinator's allowedTools lists only Read and Write. What is most likely missing?",
    options: [
      {
        text: "The Agent tool is not in the coordinator's allowedTools, so it has no way of invoking any of the subagents.",
        why: "正解。Claude はサブエージェントを Agent ツール（旧名 Task）で起動する。コーディネーターの allowedTools に Agent を入れないと、定義があっても呼べない。",
      },
      {
        text: "Each subagent definition must also include the coordinator's full system prompt, so that it knows it may be called.",
        why: "サブエージェントが呼ばれるかどうかは、コーディネーターの側の問題。サブエージェントの定義に親のプロンプトは要らない。",
      },
      {
        text: "Subagents have to be started by your application code; the coordinator model cannot start them on its own.",
        why: "誤り。agents に定義したサブエージェントは、モデルが Agent ツールを呼んで起動する。コードで呼ぶ仕組みではない。",
      },
      {
        text: "The descriptions must be moved into the coordinator's system prompt, because the model never reads agent descriptions.",
        why: "モデルは description を見てどのサブエージェントに振るかを決める。説明はそのままでよく、足りないのは起動の手段。",
      },
    ],
    answer: 0,
    point: "サブエージェントを起動させるには、コーディネーターの allowedTools に Agent（旧 Task）を入れる",
  },
  {
    id: "s3-24",
    scenario: "s3",
    tasks: ["1.6"],
    stem: "A request asks for a comparison of the five largest vendors in a market. The coordinator immediately launches five parallel search subagents, guessing the vendor names, and two of its guesses turn out to be wrong. How should this work be decomposed?",
    options: [
      {
        text: "Keep launching all five in parallel, but tell each subagent to swap its vendor if it finds that vendor is not in the top five.",
        why: "各サブエージェントは全体の順位も、ほかの担当も知らない。替えた先が重なったり、抜けたりする。",
      },
      {
        text: "Hand the whole comparison to a single search subagent, so that it can find the vendors and research each one in turn.",
        why: "依存関係は解けるが、独立して並列にできる部分まで 1 つの文脈に詰め込み、遅く、文脈も埋まる。",
      },
      {
        text: "First run one step that identifies the five vendors, and only then fan out one subagent per vendor in parallel.",
        why: "正解。後の作業が前の結果に依存するなら、その部分は順に、独立した部分は並列にする。先に対象を確定させてから広げる。",
      },
      {
        text: "Let the five subagents message each other to agree on which vendors to cover before any of them starts the research.",
        why: "サブエージェントどうしは直接話さない。担当を決めるのはコーディネーターの役目。",
      },
    ],
    answer: 2,
    point: "前の結果に依存する部分は順に（対象の特定）、独立した部分は並列に（対象ごとの調査）分解する",
  },
  {
    id: "s3-25",
    scenario: "s3",
    tasks: ["2.2"],
    stem: 'The document analysis agent\'s fetch_document tool returns the same generic error, "Fetch failed," for every problem. When a source is behind a paywall, the agent retries it again and again; when a server is briefly overloaded, it gives up at once. How should fetch_document report errors?',
    options: [
      {
        text: "Return a successful result with empty content for every failure, so the agent never gets caught in a loop of retries.",
        why: "失敗を空の成功に見せる典型的な誤り。エージェントは「その文書には何も書かれていない」と受け取る。",
      },
      {
        text: "Retry inside the tool until the fetch succeeds, so that the agent never sees any error from fetch_document at all.",
        why: "有料の壁のような権限の失敗は、何度やっても直らない。ツールが止まらなくなる。",
      },
      {
        text: 'Add a rule to the agent\'s prompt: "If a fetch fails, try it at most twice more before moving on to other sources."',
        why: "種類が分からないまま一律に扱うだけ。権限の失敗には無駄な再試行が残り、一時的な失敗には足りないこともある。",
      },
      {
        text: "Return isError with a category such as access_denied or transient, and say whether retrying could help.",
        why: "正解。種類と再試行の可否が分かれば、エージェントは一時的な失敗は再試行し、権限の失敗はほかの情報源に切り替えられる。",
      },
    ],
    answer: 3,
    point: "失敗は種類（権限・一時的など）と再試行の可否を付けて返す。一律の「失敗しました」では次の手を選べない",
  },
  {
    id: "s3-26",
    scenario: "s3",
    tasks: ["2.3"],
    stem: "The web search agent sometimes answers from its own knowledge without searching, which produces claims with no sources. You want it to always search at least once, but after that to decide freely whether to search more or to finish. How should tool_choice be set?",
    options: [
      {
        text: "Force the search tool by name on the first request only, then switch to auto for all of the turns that follow.",
        why: "正解。必ずやらせたい最初の 1 回だけを tool で強制し、その後は auto で任せる。強制し続けると終われない。",
      },
      {
        text: "Force the search tool by name on every request, so that the agent is never able to respond without searching first.",
        why: "毎回強制すると、毎回検索を呼ぶしかなく、答えを返して終えることができない。",
      },
      {
        text: "Set tool_choice to any on every request, so the agent must call some tool but can still choose which one it uses.",
        why: "毎回何かのツールを呼ぶので、やはり終えられない。最初の回にも検索以外のツールを選べてしまう。",
      },
      {
        text: 'Leave tool_choice on auto, and add a system prompt line saying "Always search before answering, without exception."',
        why: "指示は確率的で、今の失敗（ときどき検索しない）がそのまま残る。確実に呼ばせたい回は tool_choice で強制する。",
      },
    ],
    answer: 0,
    point:
      "必ず呼ばせたいのが最初の 1 回なら、その回だけ tool_choice で名指しし、以降は auto に戻す（強制し続けると終われない）",
  },
  {
    id: "s3-27",
    scenario: "s3",
    tasks: ["5.3"],
    stem: "The web search agent forwards every failed request to the coordinator as soon as it happens, including brief timeouts that would succeed on a second try. The coordinator's context fills up with error reports, and it spends turns re-delegating trivial retries. What is the best change?",
    options: [
      {
        text: "Have the web search agent drop failed requests silently and report only the results that it did manage to retrieve.",
        why: "失敗を握りつぶすと、コーディネーターは抜けに気づけない。レポートが穴に気づかないまま書かれる。",
      },
      {
        text: "Have the coordinator ignore every error report from its subagents, and treat the missing results as simply not found.",
        why: "「調べられなかった」と「調べて無かった」を混同する。解決できない失敗まで消える。",
      },
      {
        text: "Retry transient failures inside the subagent, and escalate only unresolved ones with what was tried and any partial results.",
        why: "正解。一時的な失敗は下で再試行して片付け、上には解決できなかったものだけを、判断に要る情報と一緒に上げる。",
      },
      {
        text: "Stop the whole research run whenever any subagent reports an error, so that the final report never rests on partial data.",
        why: "一部の失敗で全体を止めるのも誤り。分かったことで進め、穴は報告に明記する。",
      },
    ],
    answer: 2,
    point: "一時的な失敗は下（サブエージェント）で再試行し、解決できないものだけを試したこと・途中の結果を添えて上へ",
  },
  {
    id: "s3-28",
    scenario: "s3",
    tasks: ["5.3"],
    stem: "The document analysis agent could not access any of the academic papers on a topic, and it said so in its report to the coordinator. Yet the final report reads as if the literature had been fully reviewed: the gap was lost somewhere between the stages. What is the best fix?",
    options: [
      {
        text: "Have the report writing agent search for the academic papers itself whenever it suspects that something might be missing.",
        why: "役割の外の仕事をさせ、しかも「感じたら」という推測に頼る。分かっている抜けを確実に伝える仕組みにならない。",
      },
      {
        text: "Carry known gaps as a structured field through every stage, and have the final report state them in a limitations section.",
        why: "正解。抜けの情報も結果の一部として、構造化して次の段階へ渡し続ける。最後に読者に見える形で書く。",
      },
      {
        text: "Have the coordinator retry the document analysis agent until it gets the papers, and hold back the report until then.",
        why: "アクセスできない論文は再試行しても取れない。レポートがいつまでも出ない。",
      },
      {
        text: "Ask the synthesis agent to write more cautiously in general, so that readers do not assume the coverage was complete.",
        why: "全体を控えめにしても、何が抜けたのかは伝わらない。具体的な抜けを運ぶ必要がある。",
      },
    ],
    answer: 1,
    point: "分かっている抜けは構造化した欄として全段階に運び、最終の出力で明記する（途中で落とさない）",
  },
  {
    id: "s3-29",
    scenario: "s3",
    tasks: ["5.5"],
    stem: "Editors can fact-check only about 10% of the claims in each report. The team plans to send them the claims for which the synthesis agent reports a confidence below 0.7. In a pilot, however, many claims rated 0.9 turned out to be wrong. How should claims be selected for review?",
    options: [
      {
        text: "Lower the threshold to 0.5 so that fewer claims are sent, since editors have very limited time for each report.",
        why: "当てにならない数字の閾値を動かしても、0.9 の誤りは捕まらない。むしろ見逃しが増える。",
      },
      {
        text: "Ask the synthesis agent to think harder before rating its confidence, so that the 0.7 threshold becomes trustworthy.",
        why: "自己申告の確信度は、考えさせても較正されない。正解つきのデータで確かめない限り、閾値の根拠にならない。",
      },
      {
        text: "Choose the claims for review purely at random, since no available signal can tell which claims are more likely to be wrong.",
        why: "無作為の抜き取りは監視には役立つが、それだけでは誤りやすい主張を優先できない。手がかりは確かめられる形で存在する。",
      },
      {
        text: "Prioritize by observable signals such as single-source or conflicting claims, calibrated on a fact-checked sample.",
        why: "正解。自己申告の確信度ではなく、確かめられる手がかりで優先順位を付け、それが本当に誤りを捕まえるかを正解つきの見本で確かめる。",
      },
    ],
    answer: 3,
    point:
      "人の確認に回すものは、自己申告の確信度でなく、確かめられる手がかり（単一出典・食い違い）で選び、正解つきの見本で較正する",
  },
  {
    id: "s3-30",
    scenario: "s3",
    tasks: ["5.6"],
    stem: 'A source says a new regulation "may take effect as early as 2027, pending review." The final report states, "The regulation takes effect in 2027," citing that source. Spot checks find many similar cases. What is the best fix?',
    options: [
      {
        text: "Pass each claim along with the source's exact qualifying wording, and require the report to keep that level of certainty.",
        why: "正解。出典を保つとは、出典の URL だけでなく、出典がどこまで言っているか（可能性・条件付き）も保つこと。主張と一緒に運ぶ。",
      },
      {
        text: "Drop citations from statements about future events, since such statements are uncertain by nature and cannot be sourced.",
        why: "出典を外すと、読者は確かめる手段を失う。問題は出典ではなく、言い切りに変わったこと。",
      },
      {
        text: "Add a general disclaimer at the end of every report saying that some statements may be less certain than they appear.",
        why: "どの文が言い過ぎなのか分からない。具体的な主張ごとに確かさを保つ必要がある。",
      },
      {
        text: "Have the report writing agent leave out every mention of dates, so that no timing claim can ever be overstated.",
        why: "読者に要る情報を捨てるだけ。日付は出典の確かさのまま書けばよい。",
      },
    ],
    answer: 0,
    point: "出典の保持には確かさの度合いも含む。「可能性がある」「審査しだい」を言い切りに変えず、主張と一緒に運ぶ",
  },
];
