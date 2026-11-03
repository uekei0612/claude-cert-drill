/* シナリオ 1：サポート対応エージェント（自作問題） */
import type { Question } from "../../types";

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
        text: "Lower the temperature so the model follows the system prompt more consistently.",
        why: "温度は出力のばらつきを変えるだけで、手順の順序を保証しない。",
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
        text: "Switch to a model with a larger context window so summarization is never needed.",
        why: "長い会話では結局溢れる。また長い入力の真ん中は落ちやすく、記憶の確実さは保証されない。",
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
];
