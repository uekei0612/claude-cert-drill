/* シナリオ 3：マルチエージェントの調査システム（自作問題） */
import type { Question } from "../../types";

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
        text: "Increase the synthesis subagent's context window so it can see more of the coordinator's history.",
        why: "文脈の大きさの問題ではない。そもそもコーディネーターの履歴は自動では見えない。",
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
        text: "Have the coordinator emit four Task tool calls in one response.",
        why: "正解。並列に動かすには、1 回の応答の中で Task 呼び出しを複数出す。別々のターンに分けると順番になる。",
      },
      {
        text: 'Set tool_choice to "any" so the coordinator calls tools more aggressively.',
        why: "tool_choice はツールを呼ぶかどうかの指定で、並列化の手段ではない。",
      },
    ],
    answer: 2,
    point: "サブエージェントを並列に動かすには、1 回の応答で Task 呼び出しを複数出す",
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
        text: "Rename and redescribe the tools so their purposes do not overlap, e.g. extract_web_results for snippets.",
        why: "正解。ツール選択の主な手がかりは説明。重なりを無くすように名前と説明を変え、使う場面・入力・似たツールとの違いを書く。",
      },
      {
        text: "Remove analyze_content so that only one analysis tool remains.",
        why: "取り違えは止まるが、別の用途の機能まで失う。役割を分け直すのが筋。",
      },
      {
        text: "Lower the temperature so tool selection becomes deterministic.",
        why: "似た説明のどちらを選ぶかという曖昧さは、温度では解消しない。",
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
        text: "The coordinator's allowed tools do not include the tool used to spawn subagents (Task).",
        why: "正解。サブエージェントは Task ツールで起動する。コーディネーターの allowedTools に入っていなければ振れない。",
      },
      {
        text: "All four subagents share the same model, so the coordinator sees no benefit in delegating.",
        why: "モデルが同じでも、文脈を分け、役割に絞れる利点がある。振らない理由にならない。",
      },
    ],
    answer: 2,
    point: "コーディネーターが振らない → allowedTools に Task が無い（サブエージェントは Task で起動する）",
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
        why: "有料の壁は再試行で越えられない。恒久的な失敗に繰り返しは無意味。",
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
        text: "Tell the synthesis agent to always prefer the larger figure when two sources disagree.",
        why: "根拠の無い選び方。時点の違いという本当の理由が見えないまま。",
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
];
