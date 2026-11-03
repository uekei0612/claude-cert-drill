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
];
