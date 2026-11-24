/* シナリオ 1：サポート対応エージェント（自作問題） */
import type { Question } from "../../../core/exam/types";

export const s1: Question[] = [
  {
    id: "s1-01",
    scenario: "s1",
    tasks: ["1.1"],
    stem: 'Your agent loop occasionally stops early: the model writes "Let me check your order status" and the loop exits before lookup_order is ever called. The loop currently ends whenever the response contains any text block. What is the most reliable fix?',
    options: [
      {
        text: 'Loop while stop_reason is "tool_use", appending each tool result, and exit only when it is "end_turn".',
        why: "正解。ループの継続と終了は stop_reason で決める。文章と tool_use は同じ応答に並んで出ることがあるので、文章の有無は終了の合図にならない。",
      },
      {
        text: "Add an instruction to the system prompt telling the model to never include text in a response that also requests a tool.",
        why: "指示で応答の形を縛っても確率的にしか守られない。根本はループの判定方法の誤り。",
      },
      {
        text: 'Search the response text for phrases such as "I\'m done" or "Is there anything else" and stop only when one is found.',
        why: "自然言語の合図を探して終わりを判定するのは典型的な誤り。言い回しが変われば壊れる。",
      },
      {
        text: "Always run exactly five iterations so the model has enough turns to finish any request.",
        why: "回数の固定は終了条件にならない。早く終わる用件では無駄に回り、長い用件は途中で切れる。上限は安全装置としてだけ置く。",
      },
    ],
    answer: 0,
    point: "ループは stop_reason（tool_use なら続け、end_turn で終える）で回す。文章の有無や言い回しで判定しない",
  },
  {
    id: "s1-02",
    scenario: "s1",
    tasks: ["1.4", "1.5"],
    stem: "Policy requires that a customer's identity be verified with get_customer before any refund is issued. Despite clear instructions in the system prompt, audit logs show process_refund was occasionally called without a prior verified get_customer result. What should you do?",
    options: [
      {
        text: "Move the verification instruction to the end of the system prompt, where recent instructions carry more weight, and repeat it in capitals.",
        why: "強調や位置の工夫でも確率的なまま。監査で問題になるような手順の順序は、プログラムで保証する必要がある。",
      },
      {
        text: "Add a programmatic gate that blocks process_refund until get_customer has returned a verified customer ID.",
        why: "正解。必ず守らせたい順序は、前提が満たされるまで後続のツール呼び出しを止める仕組みで強制する。プロンプトの指示は失敗率がゼロにならない。",
      },
      {
        text: "Add few-shot examples showing the agent calling get_customer before process_refund.",
        why: "例は守る率を上げるが、保証はしない。金銭の操作の前提条件には決定的な強制が要る。",
      },
      {
        text: "Set tool_choice to force get_customer on the first turn of every conversation.",
        why: "最初に呼ばせても、確認が成功したか、返金する顧客と同じ人かは保証されない。返金の直前に前提を確かめるゲートが要る。",
      },
    ],
    answer: 1,
    point: "金銭の操作の前の本人確認のような順序は、プロンプトではなく前提ゲート（フック等）で強制する",
  },
  {
    id: "s1-03",
    scenario: "s1",
    tasks: ["1.5"],
    stem: "Different backend MCP tools return dates as Unix timestamps, ISO 8601 strings, and locale-formatted strings, and order statuses as numeric codes. The agent sometimes misreads which order is the most recent. What is the most effective approach?",
    options: [
      {
        text: "Add a table to the system prompt explaining every date format and status code so the model can convert them itself.",
        why: "モデルに毎回変換させると、誤りの余地が残り、文脈も食う。決定的にできる変換はコードでやる。",
      },
      {
        text: "Ask each backend team to change their APIs to return ISO 8601 dates and string statuses.",
        why: "長期的には望ましくても、エージェント側で今すぐ確実に解決できる手段がある。他チームの変更待ちは答えにならない。",
      },
      {
        text: "Add a PostToolUse hook that converts dates and status codes to one format before the model reads them.",
        why: "正解。PostToolUse フックはツールの結果をモデルが読む前に加工できる。形式の揃わないデータの正規化はこの用途の典型。",
      },
      {
        text: "Have the agent call each tool twice and compare the outputs to detect formatting inconsistencies.",
        why: "2 回呼んでも同じ形式が返るだけで、正規化にならない。費用だけ増える。",
      },
    ],
    answer: 2,
    point: "ツール結果の形式の揺れは PostToolUse フックで、モデルが読む前に正規化する",
  },
  {
    id: "s1-04",
    scenario: "s1",
    tasks: ["1.5", "5.2"],
    stem: "A new business rule says refunds above $500 must never be issued automatically; they must go to a human. The rule must hold even if the model misjudges an amount or is persuaded by the customer. Which implementation fits best?",
    options: [
      {
        text: "State the $500 limit in the system prompt and instruct the agent to call escalate_to_human for larger amounts.",
        why: "指示は大半の場合に効くが、説得や見積もり違いで破られうる。「絶対に」と言える要件にはならない。",
      },
      {
        text: "Remove process_refund from the agent entirely and route every refund through a human.",
        why: "要件を満たすが、$500 以下の返金まで人に回し、目標の一次解決率を大きく下げる。過剰な対応。",
      },
      {
        text: "Have the agent report its confidence that the amount is under $500, and allow automatic refunds only when that confidence exceeds 90%.",
        why: "モデルの自己申告の確信度は当てにならない。金額という確定値で判定できるのに、確率的な指標を使う理由が無い。",
      },
      {
        text: "Add a hook that intercepts process_refund calls over $500, blocks them, and routes the case to escalate_to_human.",
        why: "正解。ツールを呼ぶ前に介入するフックは決定的に効く。方針違反の呼び出しを止め、別の流れ（人への引き継ぎ）に回すのはこの用途そのもの。",
      },
    ],
    answer: 3,
    point: "業務ルールを保証したいときは、ツール呼び出しを止めて別の流れに回すフックを使う",
  },
  {
    id: "s1-05",
    scenario: "s1",
    tasks: ["1.4"],
    stem: "When the agent escalates mid-conversation, human agents complain that they must re-read long transcripts and often ask customers to repeat themselves. Human agents cannot see the model's tool results. What should the escalation include?",
    options: [
      {
        text: "A structured summary: customer ID, issue, root cause found so far, amounts involved, and a recommended next action.",
        why: "正解。会話を読めない相手への引き継ぎは、要点を構造化して渡す。顧客に同じ説明を繰り返させずに済む。",
      },
      {
        text: "A link to the complete raw conversation transcript, including every tool call and result, so the human sees exactly what happened.",
        why: "全文を渡しても、人が長い記録を読み直す負担は変わらない。今回の不満そのもの。",
      },
      {
        text: "The customer's sentiment score so the human agent can prioritize the most frustrated customers.",
        why: "感情の情報だけでは何が起きたかが分からない。引き継ぎに要るのは事実と推奨の対応。",
      },
      {
        text: "A one-line message telling the human that the agent could not resolve the issue.",
        why: "情報が少なすぎて、人は最初から調べ直すことになる。",
      },
    ],
    answer: 0,
    point: "人への引き継ぎは、顧客 ID・原因・金額・推奨の対応を構造化した要約で渡す",
  },
  {
    id: "s1-06",
    scenario: "s1",
    tasks: ["2.2"],
    stem: 'When lookup_order fails, the MCP tool currently returns the text "Operation failed". The agent responds by retrying the same call repeatedly, even when the order belongs to a different account and the customer is not allowed to see it. How should the tool\'s error responses change?',
    options: [
      {
        text: "Return an empty result instead of an error so the agent moves on rather than retrying.",
        why: "失敗を空の成功に見せると、エージェントは「注文が無い」と誤解して顧客に誤った説明をする。握りつぶしは誤り。",
      },
      {
        text: "Return isError plus an error category, an isRetryable flag, and a human-readable explanation.",
        why: "正解。種類と再試行の可否が分かれば、エージェントは一時的な失敗だけを再試行し、権限の問題は再試行せずに適切に説明できる。",
      },
      {
        text: "Add a system prompt instruction telling the agent to retry at most twice on any error, then apologize and offer escalation.",
        why: "回数を絞っても、再試行すべきでない権限エラーで無駄な再試行をする点は変わらない。判断の材料が無いことが問題。",
      },
      {
        text: "Make the tool raise an exception so the agent loop terminates and the case is escalated.",
        why: "1 つの失敗で全体を止めるのは過剰。一時的な失敗なら再試行で解決できる。",
      },
    ],
    answer: 1,
    point: "MCP のエラーは isError ＋種類（一時的・入力・権限・業務）＋再試行の可否＋説明で返す",
  },
  {
    id: "s1-07",
    scenario: "s1",
    tasks: ["5.1"],
    stem: 'In long conversations, the agent summarizes earlier turns to save context. Customers increasingly report that the agent "forgot" the exact refund amount and the delivery date it promised earlier. What change addresses this most directly?',
    options: [
      {
        text: "Summarize less often, for example every 30 turns instead of every 10, so that the full history stays in context longer.",
        why: "問題の発生を遅らせるだけで、要約したときには同じように数字が落ちる。",
      },
      {
        text: "Instruct the summarizer to be more detailed and to always keep any important numbers and dates it encounters.",
        why: "「重要な数字を残せ」は曖昧で、要約のたびに少しずつ落ちる危険は残る。",
      },
      {
        text: "Have the summarizer produce a structured summary with dedicated fields for amounts and dates.",
        why: "形を整えても、要約し直すたびに前の要約から写し直すので、値が崩れる危険は残る。事実は要約の対象から外して持つ。",
      },
      {
        text: "Keep amounts, dates, order numbers, and promises in a case-facts block sent with every prompt, outside the summary.",
        why: "正解。要約を重ねるとぼやける取引の事実は、要約の外の「事実のブロック」として毎回のプロンプトに入れる。",
      },
    ],
    answer: 3,
    point: "金額・日付・約束などの事実は、要約の外の事実ブロックとして毎回のプロンプトに入れる",
  },
  {
    id: "s1-08",
    scenario: "s1",
    tasks: ["5.2"],
    stem: 'A customer\'s first message is: "I want to talk to a real person right now." Their issue looks like a simple address change the agent could complete. What should the agent do?',
    options: [
      {
        text: "Escalate to a human immediately, without first investigating the account.",
        why: "正解。顧客がはっきり人を求めたら、調べる前にすぐ引き継ぐ。用件が簡単でも、その希望を優先する。",
      },
      {
        text: "Explain that the issue is simple, complete the address change, and then offer a human if the customer is still unhappy.",
        why: "はっきり人を求めた顧客に自動対応を押し付けている。解決を申し出てよいのは、不満を述べているだけで人を求めていない場合。",
      },
      {
        text: "Look up the account first so the human agent receives full context, then escalate.",
        why: "親切に見えるが、はっきりした希望を受けてから調べ始めるのは、すぐ引き継ぐという原則に反する。",
      },
      {
        text: "Ask the customer to rate how frustrated they are, and escalate if the rating is high.",
        why: "人を求めているのに感情を聞くのは的外れ。感情の強さはエスカレーションの指標として当てにならない。",
      },
    ],
    answer: 0,
    point: "顧客がはっきり人を求めたら、用件が簡単でも、調べる前にすぐ引き継ぐ",
  },
  {
    id: "s1-09",
    scenario: "s1",
    tasks: ["5.2"],
    stem: "A customer asks the agent to match a lower price they found on a competitor's website. Your refund policy describes price adjustments only for price drops on your own site and says nothing about competitors. What should the agent do?",
    options: [
      {
        text: "Deny the request, because the policy does not list competitor price matching as allowed.",
        why: "方針に書いていないことを「不可」と決めるのも推測。方針が触れていない場面は、エージェントが決めるべきでない。",
      },
      {
        text: "Apply the own-site price-adjustment rule by analogy and issue the difference as a refund.",
        why: "似た規則を当てはめて金銭を動かすのは、方針の拡大解釈。誤れば会社に損害が出る。",
      },
      {
        text: "Escalate to a human, because the policy is silent on this specific request.",
        why: "正解。方針に無い・方針が沈黙している場面は、エスカレーションすべき典型。複雑さではなく方針の穴が理由。",
      },
      {
        text: "Ask the customer for a screenshot of the competitor price, then decide based on how large the difference is.",
        why: "証拠を集めても、決めてよいかという方針の問題は解決しない。",
      },
    ],
    answer: 2,
    point: "方針が沈黙している求め（他社の価格に合わせる等）は、推測で可否を決めず人へ引き継ぐ",
  },
  {
    id: "s1-10",
    scenario: "s1",
    tasks: ["5.2"],
    stem: 'get_customer is called with the name "Alex Chen" and returns three matching customer records with different email addresses. What should the agent do next?',
    options: [
      {
        text: "Choose the record with the most recent order, since a customer with a recent purchase is the one most likely to be contacting support.",
        why: "もっともらしい推測で選ぶと、別人の口座を操作する危険がある。複数が当たったら確かめる。",
      },
      {
        text: "Ask the customer for another identifier, such as an email address or order number, to find the right record.",
        why: "正解。複数の候補が当たったら、推測で選ばず、追加の識別情報を聞いて絞り込む。",
      },
      {
        text: "Escalate to a human, because ambiguous identity is too risky for the agent to handle.",
        why: "追加の情報を聞けば普通に解決できる。進められないわけではないので、引き継ぐ理由にならない。",
      },
      {
        text: "Proceed with all three records and ask the customer which order they mean.",
        why: "他人の記録や注文を顧客に見せることになり、情報の漏えいにつながる。",
      },
    ],
    answer: 1,
    point: "検索で複数の顧客が当たったら、推測で選ばず追加の識別情報を聞く",
  },
  {
    id: "s1-11",
    scenario: "s1",
    tasks: ["1.1"],
    stem: 'A customer pastes a long complaint and the agent starts a lookup_order call, but the response ends with stop_reason "max_tokens" and the tool_use block is cut off. Your loop treats any stop_reason other than "tool_use" as finished, so the customer gets a half-written reply. What should the loop do?',
    options: [
      {
        text: "Treat the truncated tool_use block as complete and pass whatever arguments were generated to lookup_order.",
        why: "切れたブロックの引数は不完全で、壊れた入力でツールを呼ぶことになる。",
      },
      {
        text: "Shorten the system prompt so that the model has more of its context window left for the reply.",
        why: "max_tokens は出力の上限で、コンテキストウィンドウの空きとは別物。プロンプトを削っても出力の上限は増えない。",
      },
      {
        text: 'Handle "max_tokens" as its own case: retry the turn with a higher max_tokens instead of ending.',
        why: "正解。stop_reason ごとに扱いを分ける。max_tokens は「途中で切れた」合図で、終わりではない。上限を上げてやり直す。",
      },
      {
        text: "Tell the model in the system prompt to keep every reply short so that it never reaches the limit.",
        why: "指示で長さを縛っても確率的にしか守られず、切れたときの扱いが無いままになる。",
      },
    ],
    answer: 2,
    point: "stop_reason は場合ごとに扱う。max_tokens は「切れた」なので終わりにせず、上限を上げてやり直す",
  },
  {
    id: "s1-12",
    scenario: "s1",
    tasks: ["1.1", "2.3"],
    stem: "In one response the model asks for two things at once: a get_customer call and a lookup_order call. Your loop runs both tools, returns the get_customer result, and holds the lookup_order result for the following turn. The API rejects the request. How should the results be returned?",
    options: [
      {
        text: "Put both tool_result blocks, each with its matching tool_use_id, in the one next user message.",
        why: "正解。1 回の応答に複数の tool_use があれば、すべての tool_result を次の 1 つのユーザーメッセージにまとめ、tool_use_id で対応させる。",
      },
      {
        text: "Put each tool_result in an assistant message right after the tool_use it answers.",
        why: "tool_result はユーザーメッセージで返す。アシスタントのメッセージには入れられない。",
      },
      {
        text: "Disable parallel tool use for the whole agent so the model can only ever request one tool per turn.",
        why: "並列の呼び出しを止めれば形は崩れないが、正しく返せば済むことのために応答が遅くなる。原因は返し方の誤り。",
      },
      {
        text: "Merge the two results into one text block and attach it to whichever tool_use_id came first.",
        why: "結果と呼び出しの対応が崩れる。どちらの結果かをモデルが取り違える元になる。",
      },
    ],
    answer: 0,
    point:
      "1 回の応答で複数の tool_use が来たら、全部の tool_result を次の 1 つのユーザーメッセージに、tool_use_id を付けて返す",
  },
  {
    id: "s1-13",
    scenario: "s1",
    tasks: ["2.1"],
    stem: 'lookup_order expects an order number such as ORD-2024-118273, but logs show the agent often passes the customer\'s email address or a tracking number instead, which returns nothing. The tool description currently reads "Looks up an order." What is the most effective fix?',
    options: [
      {
        text: "Add a line to the system prompt reminding the agent that lookup_order requires an order number.",
        why: "ツールの使い方の情報は、ツールの説明と入力スキーマに置くのが本筋。システムプロンプトの注意書きは選ぶ時点で効きにくい。",
      },
      {
        text: "Make lookup_order accept any string and try each kind of identifier in turn on the backend.",
        why: "境界のあいまいな万能ツールになり、誤った当たりも返しうる。入力の取り違えという原因が残る。",
      },
      {
        text: "Return an error that lists the accepted format whenever the input does not match, and rely on retries.",
        why: "エラーで正すのは後始末としては良いが、毎回の失敗と再試行を前提にした設計になる。先に説明で防ぐ。",
      },
      {
        text: "Describe the order_id format with an example and say how to get it when only an email is known.",
        why: "正解。モデルはツールの説明と入力スキーマを見て引数を作る。形式・例・手元に無いときの入手方法（先に get_customer）を書く。",
      },
    ],
    answer: 3,
    point: "引数の取り違えは、入力の形式・例・手に入れ方をツールの説明とスキーマに書いて防ぐ",
  },
  {
    id: "s1-14",
    scenario: "s1",
    tasks: ["2.2", "5.2"],
    stem: 'process_refund rejects refunds above $500 because they need manager approval. When this happens the tool returns "Error: request failed", and the agent retries the same refund several times before apologizing vaguely to the customer. What should the tool return instead?',
    options: [
      {
        text: "A success response with refunded: false, so that the agent does not treat it as a failure.",
        why: "失敗を成功の形で返すと、エージェントは何が起きたかを判断できない。断られたことは失敗として伝える。",
      },
      {
        text: "isError with a business-rule category, not retryable, and a note that it needs manager approval.",
        why: "正解。業務ルールによる拒否は再試行しても通らない。種類・再試行の可否・次の手（人への引き継ぎ）が分かれば、エージェントは正しく動ける。",
      },
      {
        text: "A generic error with an HTTP status code of 403, which the model will recognize as a permission problem.",
        why: "数字だけでは、権限の問題なのか業務ルールなのか、次に何をすべきかが分からない。",
      },
      {
        text: "The full stack trace from the payment service, so the agent has every detail it might need to explain.",
        why: "内部の詳細はモデルの判断に役立たず、顧客に漏れる恐れもある。必要なのは種類と次の手。",
      },
    ],
    answer: 1,
    point: "業務ルールでの拒否は、isError ＋種類＋再試行不可＋次の手（承認・引き継ぎ）で返す。再試行させない",
  },
  {
    id: "s1-15",
    scenario: "s1",
    tasks: ["1.6"],
    stem: "A customer writes in one message: their last order arrived damaged, they were charged twice for it, and they want to update their shipping address. Today the agent handles only the first issue, then closes the case. How should the agent approach messages like this?",
    options: [
      {
        text: "List the separate concerns, investigate each with the tools it needs, then reply covering all of them.",
        why: "正解。複数の用件を含む依頼は、まず用件に分け、それぞれを調べてから、全部に答える 1 つの返事にまとめる。",
      },
      {
        text: "Ask the customer to open a separate case for each issue so that every case has a single topic and a clear owner.",
        why: "手間を顧客に回すだけで、初回解決の目標にも反する。分けるのはエージェントの仕事。",
      },
      {
        text: "Escalate any message that contains more than one issue to a human, since it is more complex.",
        why: "用件が複数あることは引き継ぎの理由にならない。それぞれは自分で解決できる用件。",
      },
      {
        text: "Handle only the issue with the highest dollar value, since it matters most to the business.",
        why: "残りの用件が放置され、顧客はまた問い合わせることになる。",
      },
    ],
    answer: 0,
    point: "複数の用件を含む依頼は、用件に分けてそれぞれ調べ、全部に答える 1 つの返事にまとめる",
  },
  {
    id: "s1-16",
    scenario: "s1",
    tasks: ["5.1"],
    stem: "A support conversation runs for more than 40 turns across three separate issues. Near the end, the agent forgets that the second issue, a missing item, was never resolved and tells the customer everything is done. What change best prevents this?",
    options: [
      {
        text: "Have the agent restate all open issues from the conversation at the start of each reply.",
        why: "毎回モデルが会話から拾い直すので、見落としは同じように起こりうる。用件の状態はコードの側で持つ。",
      },
      {
        text: "Summarize the conversation every ten turns and replace the older turns with the summary.",
        why: "要約は細部を落としやすく、「未解決」のような状態が消える恐れがある。",
      },
      {
        text: "Keep a structured list of open issues and their status, and include it in every turn's prompt.",
        why: "正解。用件と状態の一覧を会話の外で持ち、毎回の入力に入れる。長い会話の途中に埋もれさせない。",
      },
      {
        text: "Ask the customer at the end to confirm whether all of their issues have been resolved.",
        why: "確認は良い習慣だが、エージェント自身が状態を見失う原因は残る。顧客が気づかなければ漏れる。",
      },
    ],
    answer: 2,
    point: "長い会話の用件と状態は、構造化した一覧として会話の外に持ち、毎回の入力に入れる",
  },
  {
    id: "s1-17",
    scenario: "s1",
    tasks: ["5.2", "4.1"],
    stem: 'After launch, 38% of contacts are escalated to humans, far above target. Reviewing them shows most were routine returns the agent could have handled. The system prompt says "Escalate when the case is complex or you are unsure." What is the best fix?',
    options: [
      {
        text: "Have the model rate its confidence from 1 to 10 for each contact and escalate only when the rating is below 4.",
        why: "モデルの自己申告の確信度は較正されておらず、閾値を決めても判断のずれは直らない。",
      },
      {
        text: "Remove the escalation instruction so the agent always tries to resolve the contact itself.",
        why: "人に渡すべき案件まで抱え込むことになる。極端に振るのではなく、基準をはっきりさせる。",
      },
      {
        text: "Add a hard daily cap on escalations and queue any further ones until the next day.",
        why: "本当に人が要る案件まで待たせることになる。判断の基準が誤っているという原因に触れていない。",
      },
      {
        text: "Spell out which situations require a human, with examples of cases to resolve and to escalate.",
        why: "正解。「複雑」「確信がない」はあいまい。引き継ぐ条件を具体的に書き、解決すべき例と引き継ぐべき例を見せる。",
      },
    ],
    answer: 3,
    point:
      "引き継ぎすぎは、あいまいな基準が原因。条件を具体的に書き、解決する例・引き継ぐ例を見せる（自己申告の確信度に頼らない）",
  },
  {
    id: "s1-18",
    scenario: "s1",
    tasks: ["1.7"],
    stem: 'A customer returns the next day about the same refund. You could resume yesterday\'s session, but its tool results show the order as "processing", and the order has since shipped. What is the best way to continue?',
    options: [
      {
        text: "Resume the session as is, since the model will notice on its own that the data is a day old.",
        why: "モデルは古い結果を今の事実として扱いやすい。古いと自分で気づくことは期待できない。",
      },
      {
        text: "Start a new session with a summary of the case so far, and have the agent re-check the order.",
        why: "正解。前の結果の多くが古くなっているなら、要約を渡して新しく始め、今の状態を調べ直させる。",
      },
      {
        text: "Start from scratch with no history so that nothing from yesterday can mislead the agent.",
        why: "古い結果は避けられるが、顧客に同じ説明を繰り返させることになる。要約で必要な経緯は渡す。",
      },
      {
        text: "Resume the session and delete every earlier tool result from it before continuing.",
        why: "結果を消すと、どの呼び出しに何が返ったかの流れが崩れ、経緯も失われる。要約して新しく始めるほうが確実。",
      },
    ],
    answer: 1,
    point: "前のツール結果が古くなっているなら、再開せず、要約を渡して新しいセッションで今の状態を調べ直す",
  },
  {
    id: "s1-19",
    scenario: "s1",
    tasks: ["1.5"],
    stem: "Customers sometimes paste full credit card numbers into chat, and the agent copies them into the notes field of escalate_to_human, where they end up in the ticketing system. A system prompt instruction not to do this has reduced but not eliminated it. What should you do?",
    options: [
      {
        text: "Add a PreToolUse hook that detects card numbers in tool input and masks them or blocks the call.",
        why: "正解。必ず防ぎたいことは、ツールが呼ばれる前に入力を調べるフックで決定的に止める。プロンプトは確率的にしか効かない。",
      },
      {
        text: "Repeat the instruction in the description of escalate_to_human as well as in the system prompt, so it is seen at the moment of use.",
        why: "書く場所を増やしても確率的なまま。漏れてはならない情報には決定的な仕組みが要る。",
      },
      {
        text: "Clean up the ticketing system with a nightly job that removes card numbers from stored notes.",
        why: "それまでの間は番号が保存されたままになる。保存される前に止める。",
      },
      {
        text: "Remove the notes field from escalate_to_human so that free text can never be passed through.",
        why: "引き継ぎに要る経緯まで渡せなくなる。危ない値だけを狙って止める。",
      },
    ],
    answer: 0,
    point: "漏れてはならない値は、PreToolUse フックでツールの入力を調べて伏せる・止める（プロンプトでは確率的）",
  },
  {
    id: "s1-20",
    scenario: "s1",
    tasks: ["2.3"],
    stem: "Every conversation should start by identifying the customer, but the agent sometimes answers general questions first and never calls get_customer, so later refunds fail the verification gate. You want the first model call to always call get_customer. What is the most direct way?",
    options: [
      {
        text: 'Set tool_choice to "any" on every request so that the model is always required to use some tool.',
        why: '"any" は何かのツールを強制するだけで、get_customer とは限らない。毎回だと普通の返事もできなくなる。',
      },
      {
        text: "Put get_customer first in the tools list, because the model tends to pick the first tool it sees.",
        why: "並び順に頼るのは保証にならない。",
      },
      {
        text: 'On the first request, set tool_choice to that tool by name, then return to "auto" afterwards.',
        why: "正解。特定のツールを確実に呼ばせたい回は、tool_choice でそのツールを名指しする。その後は auto に戻す。",
      },
      {
        text: 'Describe get_customer as "ALWAYS call this tool first" in capitals in its tool description.',
        why: "強調は守る率を上げるだけで保証しない。",
      },
    ],
    answer: 2,
    point: "特定のツールを確実に呼ばせる回は tool_choice で名指し（{type: tool, name}）。any は「何かのツール」",
  },
  {
    id: "s1-21",
    scenario: "s1",
    tasks: ["1.1"],
    stem: "A customer asks about two orders, and the model's response contains two tool_use blocks for lookup_order. Your loop runs only the first block and sends back its result, and the API rejects the next request. How should the loop handle such a response?",
    options: [
      {
        text: "Run only the first tool_use block in each turn, and let the model request the second one again on the next iteration of the loop.",
        why: "応答に含まれる tool_use には、すべて結果を返す決まり。片方だけ返すとリクエストが拒否され、往復も無駄に増える。",
      },
      {
        text: "Run every tool_use block, then return all of the results together in one user message, each matched to its block by tool_use_id.",
        why: "正解。1 回の応答に複数の tool_use があれば、すべて実行し、結果は直後の 1 つの user メッセージに tool_use_id 付きで並べる。並列の呼び出しは無駄な往復を減らす正しい振る舞い。",
      },
      {
        text: "Add a system prompt rule that the model must request at most one lookup_order call per response, so the loop never receives two blocks.",
        why: "並列の呼び出しはモデルの正しい振る舞いで、止める理由が無い。しかも指示は確率的なので、ループ側の扱いの誤りはいずれまた表に出る。",
      },
      {
        text: "Send each tool_result back in its own separate user message, one after another, in the same order as the tool_use blocks appeared.",
        why: "結果は 1 つの user メッセージにまとめて返す。別々のメッセージで返すと並列の呼び出しが減る、と公式に注意されている。",
      },
    ],
    answer: 1,
    point: "1 回の応答の tool_use はすべて実行し、結果は tool_use_id 付きで 1 つの user メッセージにまとめて返す",
  },
  {
    id: "s1-22",
    scenario: "s1",
    tasks: ["1.4"],
    stem: "To enforce identity verification, the team added an identity_verified field to process_refund's input, and a gate rejects any call where it is false. Audits still find refunds issued to unverified customers: in those calls the model set identity_verified to true without ever calling get_customer. What should change?",
    options: [
      {
        text: "Make identity_verified a required boolean in the process_refund input schema, so that the model can never leave it out of a call.",
        why: "必須にしても、モデルが true と書けば通る。値を決めるのがモデルである限り、前提の保証にならない。",
      },
      {
        text: "State in the process_refund tool description that identity_verified may be set to true only after get_customer has succeeded.",
        why: "説明はモデルへのお願いで、確率的にしか守られない。今まさに守られていないものを、文で重ねても保証にならない。",
      },
      {
        text: "Require the model to copy the get_customer result into the process_refund input as evidence, and let the gate accept only calls that include it.",
        why: "写した「証拠」もモデルが書く文字列なので、作り出せてしまう。ゲートはモデルの申告ではなく、実際の呼び出しの記録を見る必要がある。",
      },
      {
        text: "Have the gate check your own code's record of which get_customer calls actually succeeded, instead of trusting the flag the model fills in.",
        why: "正解。前提のゲートは、モデルが書いた値ではなく、コードが見た事実（その会話で get_customer が成功し、同じ顧客 ID を返したこと）で判定する。",
      },
    ],
    answer: 3,
    point: "前提のゲートはモデルが書く値（verified: true）ではなく、コードが記録した実際のツールの結果で判定する",
  },
  {
    id: "s1-23",
    scenario: "s1",
    tasks: ["1.4"],
    stem: "After escalate_to_human returns successfully, the agent sometimes keeps working the case: it calls process_refund while the human agent is already handling it, and the customer receives two refunds. What is the most reliable way to prevent this?",
    options: [
      {
        text: "Once escalate_to_human succeeds, have your code end the agent loop for that case and block any further process_refund calls on it.",
        why: "正解。引き継いだ後に手を出さないことは必ず守らせたい手順なので、プログラムで強制する。ループを終え、同じ案件の返金をゲートで止める。",
      },
      {
        text: "Add to the system prompt that, after escalating, the agent should only tell the customer that a human will follow up and must take no other action.",
        why: "指示は確率的。お金が二重に動くような失敗は、ゼロにできる仕組みで防ぐ。",
      },
      {
        text: 'Make escalate_to_human return a message reading "A human now owns this case. Do not call any more tools." so the model sees it.',
        why: "ツールの結果の文も、モデルへのお願いにすぎない。読まれやすくはなるが、呼び出しを止める仕組みにはならない。",
      },
      {
        text: "Ask human agents to check the refund history before acting on any escalated case, so that duplicate refunds are caught and reversed by hand.",
        why: "起きた後の手当てで、二重の返金そのものは防げない。担当者が確かめる前にエージェントが返金することもある。",
      },
    ],
    answer: 0,
    point: "引き継いだ後に手を出させないのも、プロンプトでなくコード（ループを終える・ゲートで止める）で強制する",
  },
  {
    id: "s1-24",
    scenario: "s1",
    tasks: ["1.5"],
    stem: 'lookup_order accepts only IDs in the form ORD-004512. Customers type them in many ways ("ord 4512", "#4512"), and the model often passes them through as typed, so lookups fail and the agent tells customers the order does not exist. Which fix is most reliable?',
    options: [
      {
        text: 'Add a PostToolUse hook that detects "not found" results and rewrites them into a request asking the customer to re-enter the ID.',
        why: "PostToolUse は実行の後。誤った ID で調べた結果を言い換えるだけで、正しい ID で調べ直すことにはならず、顧客の手間も増える。",
      },
      {
        text: "Explain the ID format in the system prompt and include several examples of converting what customers type into it.",
        why: "守る率は上がるが確率的。決まった規則で直せる変換は、コードで確実にやる。",
      },
      {
        text: "Add a PreToolUse hook that rewrites the order ID into the canonical form via updatedInput before the call runs.",
        why: "正解。PreToolUse フックは実行の前に入力を書き換えられる（updatedInput）。決まった形への正規化を、モデルに頼らず確実にできる。",
      },
      {
        text: "Make lookup_order fall back to a fuzzy search across all orders whenever an exact match fails, returning the closest match it finds.",
        why: "一番近いものを返すと、別の顧客の注文を見せる危険がある。形の揺れは正規化で直し、あいまいな一致で埋めない。",
      },
    ],
    answer: 2,
    point:
      "ツールの入力の決まった形への直しは、PreToolUse フックの updatedInput で実行前に行う（PostToolUse では遅い）",
  },
  {
    id: "s1-25",
    scenario: "s1",
    tasks: ["1.6"],
    stem: "For billing disputes the agent always follows the same steps: classify the dispute, gather the relevant orders and charges, apply the refund policy, and draft a reply. All of this happens in one long prompt, and when a reply is wrong the team cannot tell which step failed. What is the best restructuring?",
    options: [
      {
        text: "Switch to a model with a larger context window, so the single prompt has room for more detailed instructions on each step.",
        why: "大きい文脈は注意が散る問題を解かない。どの段階で誤ったかも分からないまま。",
      },
      {
        text: "Split the work into a fixed chain of steps, each with its own focused prompt and an intermediate output that can be checked.",
        why: "正解。手順が毎回同じなら固定のプロンプトチェーンにする。段階ごとに出力を確かめられるので、誤りの場所が分かり、そこだけ直せる。",
      },
      {
        text: "Have a coordinator agent decide dynamically, for each dispute, which subagents to create and in which order to run them.",
        why: "動的な分解は、調べないと手順が分からない作業のためのもの。毎回同じ手順の作業では、予測しにくく検証もしにくくなるだけ。",
      },
      {
        text: "Keep the single prompt, but ask the model to explain its reasoning for each step at the end of the reply it drafts.",
        why: "顧客への返事に内部の考えが混ざる。自分で書いた説明は、どの段階で誤ったかの確かな手がかりにもならない。",
      },
    ],
    answer: 1,
    point:
      "手順が毎回同じ作業は、段階ごとのプロンプトに分けた固定のチェーンにし、段階ごとの出力を確かめられるようにする",
  },
  {
    id: "s1-26",
    scenario: "s1",
    tasks: ["2.1"],
    stem: "Customers ask whether their refund has gone through. The agent calls lookup_order, finds no refund information in the result, and tells them no refund exists, even when one was issued. Refund status lives in a separate billing system that lookup_order does not query. What should you change first?",
    options: [
      {
        text: "Instruct the agent to tell customers to wait five to seven business days whenever it cannot see a refund in the order data.",
        why: "事実を確かめないまま定型文で答えるだけ。済んでいる返金も、本当に無い返金も区別できない。",
      },
      {
        text: "Add few-shot examples in which the agent replies that it cannot see refund status and suggests the customer check their bank.",
        why: "誤答は減るが、確かめる手段が無いままで、顧客の用件は解決しない。",
      },
      {
        text: "Tell the model in the system prompt that missing data in any tool result never means that the thing being asked about does not exist.",
        why: "一般的な注意は確率的で、どこを調べればよいかも示さない。原因はツールの説明と、手段が無いこと。",
      },
      {
        text: "Add a tool that returns refund status from billing, and state in lookup_order's description that it does not return any refund data.",
        why: "正解。モデルはツールの説明でしか中身を知れない。返さないものを説明に書き、必要な情報を返すツールを用意する。",
      },
    ],
    answer: 3,
    point:
      "ツールの説明には「返さないもの」も書き、その情報は別のツールで取れるようにする（無いことと見えないことを混同させない）",
  },
  {
    id: "s1-27",
    scenario: "s1",
    tasks: ["2.2"],
    stem: "When the order database times out, lookup_order returns the raw exception text, including a stack trace and internal hostnames. The agent sometimes repeats parts of it to customers and never retries, even though these timeouts usually clear within seconds. How should lookup_order report this failure?",
    options: [
      {
        text: "Return isError with a transient category, a flag saying it can be retried, and a short safe description; keep the stack trace in logs.",
        why: "正解。モデルに要るのは、失敗の種類と、再試行してよいかと、短い説明。内部の詳細はモデルにも顧客にも要らないので、ログに残す。",
      },
      {
        text: "Keep returning the full exception text, so that the model has as much information as possible for diagnosing the problem.",
        why: "モデルはデータベースを直せない。生の例外は次の手（再試行か、待つか）を示さず、内部の情報が顧客に漏れる。",
      },
      {
        text: "Return an empty order list, so that the agent can continue the conversation without exposing any internal details to the customer.",
        why: "失敗を空の成功に見せる典型的な誤り。エージェントは「注文はありません」と答えてしまう。",
      },
      {
        text: "Throw the exception at the protocol level, so that the MCP client aborts the call and the agent loop stops cleanly.",
        why: "ツールの実行の失敗は、結果の isError でモデルに見える形で返す。ループを止めると、数秒で直る失敗のために会話全体が失われる。",
      },
    ],
    answer: 0,
    point:
      "一時的な失敗は isError ＋種類（一時的）＋再試行の可否＋短い説明で返す。生の例外やスタックトレースはモデルに渡さずログへ",
  },
  {
    id: "s1-28",
    scenario: "s1",
    tasks: ["5.1"],
    stem: "The full 60-page returns policy is pasted into the system prompt of every conversation. The agent handles common cases well but often misses rules buried in the middle sections, such as the exception for opened electronics. What is the most effective improvement?",
    options: [
      {
        text: "Move to a model with a larger context window, so that the entire policy fits into the prompt with plenty of room to spare.",
        why: "全文はすでに入っている。文脈を大きくしても、長い入力の真ん中が落ちやすい問題は解けない。",
      },
      {
        text: "Repeat the full policy a second time at the end of the system prompt, so that each of the rules appears in two positions.",
        why: "文脈が倍になり、注意はさらに散る。埋もれる場所が変わるだけ。",
      },
      {
        text: "Supply only the sections relevant to the request, with the key rules summarized at the top under clear headings.",
        why: "正解。長い入力の真ん中は落ちやすい。渡す量を絞り、大事な規則を先頭に、区切りをはっきり付けて置く。",
      },
      {
        text: "Instruct the agent to reread the whole policy carefully before it answers any question that is related to a return.",
        why: "「注意深く」は効かない。モデルは同じ長い入力を同じように読むだけ。",
      },
    ],
    answer: 2,
    point: "長い資料を全部貼ると真ん中が落ちる。関係する部分だけを渡し、要点は見出し付きで先頭に置く",
  },
  {
    id: "s1-29",
    scenario: "s1",
    tasks: ["5.2"],
    stem: "A customer sends an angry, all-caps message about a late delivery. The case itself is simple: under policy the order qualifies for a standard shipping refund. The agent currently escalates any message it rates as highly negative. What should the agent do here?",
    options: [
      {
        text: "Escalate immediately, since strong negative sentiment is a reliable sign that a human is needed.",
        why: "感情の強さは引き継ぎの基準にならない。方針の範囲で解決できる用件を人に回すと、最初の対応での解決率が下がる。",
      },
      {
        text: "Ask the customer to rate their frustration on a scale from 1 to 10, and escalate only if the score they give is above 7.",
        why: "怒っている顧客に採点を頼むのは逆効果で、点数も引き継ぎの基準として意味が無い。",
      },
      {
        text: "Apologize, then offer the customer a choice between the refund and a human agent before taking any action on the case.",
        why: "丁寧に見えるが、解決できる用件で毎回人を勧めると引き継ぎが増える。人を求められたら、そのとき引き継げばよい。",
      },
      {
        text: "Acknowledge the frustration and resolve the case under policy, escalating only if the customer asks for a human.",
        why: "正解。引き継ぐのは、人をはっきり求めたとき・方針の外のとき・先に進めないとき。怒っていても、方針で解決できるなら解決する。",
      },
    ],
    answer: 3,
    point: "感情の強さでは引き継がない。方針で解決できるなら解決し、人をはっきり求められたら引き継ぐ",
  },
  {
    id: "s1-30",
    scenario: "s1",
    tasks: ["5.2"],
    stem: 'A customer writes, "I want to return the shoes." lookup_order shows two shoe orders in the past month: running shoes delivered last week and boots delivered three weeks ago. Both are eligible for return. What should the agent do?',
    options: [
      {
        text: "Start a return for the most recent order, because customers usually mean the item that they received most recently.",
        why: "推測で選ぶと、違う品物の返品を始めてしまう。1 問聞けば確実に分かる。",
      },
      {
        text: "Ask which order they mean, listing both of them with the item name and the delivery date so they can pick quickly.",
        why: "正解。対象があいまいなら推測せずに聞く。候補を具体的に示すと、顧客はすぐ答えられる。",
      },
      {
        text: "Start returns for both orders, since both are eligible, and let the customer cancel the one they actually want to keep.",
        why: "望まれていない操作をして、取り消しを顧客に押しつける。",
      },
      {
        text: "Escalate to a human, because the request is ambiguous and a wrong return could upset an already unhappy customer.",
        why: "あいまいさは 1 問聞けば解ける。人に回すほどのことではなく、解決率を下げるだけ。",
      },
    ],
    answer: 1,
    point: "依頼の対象があいまいなら推測で選ばず、候補を具体的に（品物・日付）示して聞く",
  },
];
