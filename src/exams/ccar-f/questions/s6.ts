/* シナリオ 6：構造化データの抽出（自作問題）。正解の文は短く言い切り、誤答の長さと揃える */
import type { Question } from "../../types";

export const s6: Question[] = [
  {
    id: "s6-01",
    scenario: "s6",
    tasks: ["4.3"],
    stem: 'The pipeline asks Claude to "respond only with JSON matching this schema." About 3% of responses fail to parse because of trailing commas, missing brackets, or explanatory text around the JSON. What is the most reliable fix?',
    options: [
      {
        text: "Add a retry that resends the same request whenever the response fails to parse as JSON.",
        why: "同じ方法で頼み直すだけで、壊れた JSON がまた出る。再試行の費用も増える。",
      },
      {
        text: "Define an extraction tool whose input_schema is the target schema, and read the tool_use input.",
        why: "正解。JSON スキーマ付きのツールを定義し、tool_use の入力として受け取るのが、構文の正しい構造化出力の最も確実な方法。",
      },
      {
        text: 'Add "Do not include any text outside the JSON object" in capital letters to the prompt.',
        why: "強調した指示も確率的。構文の誤りを無くす仕組みがある。",
      },
      {
        text: "Write a lenient parser that strips surrounding text and repairs common JSON syntax mistakes.",
        why: "修復の規則が追いつかない誤りが残り、修復が内容を壊すこともある。",
      },
    ],
    answer: 1,
    point: "構文の正しい構造化出力は、JSON スキーマ付きツールを定義して tool_use の入力で受け取る",
  },
  {
    id: "s6-02",
    scenario: "s6",
    tasks: ["4.3"],
    stem: "Incoming documents can be invoices, purchase orders, or receipts, and you have a separate extraction tool for each. The document type is not known in advance. Occasionally Claude replies with a text summary instead of calling any tool. How should you set tool_choice?",
    options: [
      {
        text: '"auto", so Claude can decide which extraction tool to use for each document.',
        why: '"auto" はツールを呼ばずに文章で返すことを許す。今起きている問題そのもの。',
      },
      {
        text: "Force the invoice tool, then fall back to the others if the extraction comes back mostly empty.",
        why: "種類が分からないのに 1 つを強制すると、合わない文書で無理に抜き出し、値を作り出しかねない。",
      },
      {
        text: '"any".',
        why: '正解。"any" ならどれかのツールを必ず呼ぶ。どのツールかはモデルが文書を見て選べる。',
      },
      {
        text: '"none", and parse the text summaries with a separate extraction step.',
        why: "ツールを使わせない設定。構造化出力の確実さを自分から捨てている。",
      },
    ],
    answer: 2,
    point: '抽出スキーマが複数で種類が分からないときは tool_choice: "any"（必ずどれかを呼ぶ）',
  },
  {
    id: "s6-03",
    scenario: "s6",
    tasks: ["4.3"],
    stem: "Your contract schema marks renewal_date as required. Many contracts have no renewal clause, and reviewers find that for those contracts Claude fills in plausible but invented dates. How should you change the schema?",
    options: [
      {
        text: "Keep the field required, and add an instruction not to invent dates.",
        why: "必須の欄はモデルに「何か入れる」圧力をかける。指示だけでは作り話を止めきれない。",
      },
      {
        text: "Remove renewal_date from the schema and extract it in a separate request.",
        why: "別の依頼にしても、無い情報を必須で求めれば同じことが起きる。",
      },
      {
        text: 'Change the field to a free-form string so Claude can write "no renewal clause" when needed.',
        why: "日付の型を失い、下流の検証や処理が難しくなる。null で表せば済む。",
      },
      {
        text: "Make renewal_date optional and nullable.",
        why: "正解。原文に無いかもしれない項目は任意（null 可）にする。必須にすると、要求を満たすために値を作り出す。",
      },
    ],
    answer: 3,
    point: "原文に無いかもしれない項目は任意・null 可にする（必須だと値を作り出す）",
  },
  {
    id: "s6-04",
    scenario: "s6",
    tasks: ["4.4"],
    stem: "Since moving to tool use, every extraction parses, but validation shows about 4% of invoices have line items that do not add up to the stated total. What is the best way to handle these?",
    options: [
      {
        text: "Retry with the original document, the failed extraction, and the specific validation error.",
        why: "正解。スキーマは構文を保証するが意味の誤りは防げない。再試行には元の文書・失敗した結果・具体的なエラーを渡して直させる。",
      },
      {
        text: "Retry the original request unchanged, since the model will often get it right on a second try.",
        why: "何が誤りかを伝えない再試行は、同じ誤りを繰り返しやすい。",
      },
      {
        text: "Make the schema stricter by adding minimum and maximum values to every numeric field.",
        why: "合計が合わないのは値どうしの関係の誤り。各項目の範囲を絞っても見つからない。",
      },
      {
        text: "Automatically overwrite the stated total with the sum of the line items before saving the record.",
        why: "どちらが誤りか分からないまま一方に合わせている。記載の合計が正しく、明細の抜き出しが誤っている場合もある。",
      },
    ],
    answer: 0,
    point: "スキーマは意味の誤りを防がない。再試行は元の文書・失敗した結果・具体的な検証エラーを渡す",
  },
  {
    id: "s6-05",
    scenario: "s6",
    tasks: ["4.4"],
    stem: 'Some purchase orders say "Payment terms: see master agreement." The extraction keeps failing validation because payment_terms is empty, and the retry loop runs five times on each of these documents. What should you do?',
    options: [
      {
        text: "Increase the retry limit, since a few more attempts may eventually extract the terms.",
        why: "情報が文書の中に無いので、何度試しても出てこない。",
      },
      {
        text: "Add few-shot examples showing payment terms extracted from purchase orders.",
        why: "例があっても、文書に無い情報は抜き出せない。作り話を誘う危険もある。",
      },
      {
        text: "Stop retrying these; the data is in another document, so flag or route them instead.",
        why: "正解。再試行が効くのは形式や構造の誤り。情報が別の文書にしか無いときは、何度試しても直らない。",
      },
      {
        text: "Add an instruction to infer the most common payment terms when they are not stated in the document.",
        why: "推測の値を事実として記録することになる。下流の判断を誤らせる。",
      },
    ],
    answer: 2,
    point: "情報が原文に無い（別の文書にある）ときは再試行しても直らない。検出して回す",
  },
  {
    id: "s6-06",
    scenario: "s6",
    tasks: ["4.5"],
    stem: "You submit 20,000 archived documents to the Message Batches API. When the batch completes, 300 requests have failed because their documents exceeded the context limit. What should you do?",
    options: [
      {
        text: "Resubmit the entire batch of 20,000 documents with a shorter prompt.",
        why: "成功した 19,700 件まで出し直すことになり、費用と時間が無駄になる。",
      },
      {
        text: "Split the 300 failed documents and resubmit only them, matched by custom_id.",
        why: "正解。custom_id で失敗した依頼を特定し、原因に合わせて直して（文書の分割）、それだけを出し直す。",
      },
      {
        text: "Process the 300 failed documents interactively using multi-turn tool calls within each batch request.",
        why: "バッチの 1 つの依頼の中で、ツールを実行して結果を返す往復はできない。",
      },
      {
        text: "Drop the 300 documents, because a 1.5% failure rate is acceptable for an archival job.",
        why: "原因が分かっていて直せるのに、データを捨てている。",
      },
    ],
    answer: 1,
    point: "バッチの失敗は custom_id で特定し、直して（分割など）失敗分だけを出し直す",
  },
  {
    id: "s6-07",
    scenario: "s6",
    tasks: ["4.2"],
    stem: "Research papers in your corpus cite sources in very different ways: some use inline citations, others put everything in a bibliography at the end, and some mention sample sizes only inside the methodology section. Extraction often returns null for required fields. What will help most?",
    options: [
      {
        text: "Make all fields optional so the extraction never fails on missing data.",
        why: "原文にある情報まで null で済ませるようになり、取りこぼしが見えなくなる。",
      },
      {
        text: "Add a longer description of every field to the schema explaining what it means.",
        why: "項目の意味は分かっていても、形式の違う文書のどこから取るかが分からないことが問題。",
      },
      {
        text: "Preprocess every paper into one standard layout before extraction using regular expressions.",
        why: "書き方の幅が広すぎて、正規表現での整形は追いつかない。",
      },
      {
        text: "Add few-shot examples of correct extraction from papers with these different structures.",
        why: "正解。形式の違う文書から正しく抜き出す例を見せると、必須項目が空になる問題が減り、新しい形式にも判断を広げられる。",
      },
    ],
    answer: 3,
    point: "形式の違う文書からの抜き出しは、違う構造ごとの正しい抽出例（few-shot）を見せる",
  },
  {
    id: "s6-08",
    scenario: "s6",
    tasks: ["5.5"],
    stem: "Overall extraction accuracy on a validation set is 97%, and the team proposes removing human review for all documents. What should you check before doing that?",
    options: [
      {
        text: "Accuracy broken down by document type and by field.",
        why: "正解。全体の 97% が、特定の文書の種類や項目での低さを隠していることがある。人の確認を減らす前に区分ごとに確かめる。",
      },
      {
        text: "Whether 97% is higher than the accuracy of the human reviewers on the same validation set.",
        why: "比べる意味はあるが、全体の数字どうしの比較では、区分ごとの弱さが見えないままになる。",
      },
      {
        text: "Whether the accuracy stays at 97% when the same validation set is run a second time.",
        why: "同じデータでの再現性は、どこで間違えているかを教えてくれない。",
      },
      {
        text: "The average confidence score the model reports across all of the extractions in the validation set.",
        why: "平均の確信度も全体の数字で、区分ごとの弱さを隠す。しかも較正していない確信度は当てにならない。",
      },
    ],
    answer: 0,
    point: "全体の正答率は区分ごとの弱さを隠す。人の確認を減らす前に文書の種類別・項目別に確かめる",
  },
  {
    id: "s6-09",
    scenario: "s6",
    tasks: ["5.5"],
    stem: "You want to send only uncertain extractions to your small human review team. The model can output a confidence score per field. How should you set up the routing?",
    options: [
      {
        text: "Route any extraction with a confidence below 0.9 to review, since 0.9 is a standard threshold.",
        why: "較正していない確信度に決め打ちの閾値を当てても、実際の誤りの率と対応しない。",
      },
      {
        text: "Ask the model to self-check its extraction, and route to review only when it changes its answer.",
        why: "同じ文脈での自己点検は弱い。人に回す基準としても不安定。",
      },
      {
        text: "Calibrate field-level thresholds on a labeled set, and keep spot-checking high-confidence items.",
        why: "正解。項目ごとの確信度を正解つきの検証データで較正して閾値を決め、確信度の高いものも層別に抜き取って誤りの率を見続ける。",
      },
      {
        text: "Route a fixed 10% of extractions to review at random so the reviewers' workload stays predictable.",
        why: "無作為だけでは、確信度の低いもの・曖昧な原文を優先できない。限られた人手が活きない。",
      },
    ],
    answer: 2,
    point: "項目ごとの確信度は正解つきデータで較正して閾値を決め、高確信のものも層別に抜き取り検査する",
  },
  {
    id: "s6-10",
    scenario: "s6",
    tasks: ["5.1"],
    stem: "Each extraction request includes the full output of a lookup_vendor tool, which returns about 45 fields per vendor, although the extraction only uses vendor name, tax ID, and country. Long multi-document jobs are slowing down and starting to miss details. What should you do?",
    options: [
      {
        text: "Move the vendor data to the end of the prompt, where the model pays more attention to it.",
        why: "置き場所を変えても、要らない 42 項目が文脈を食う問題は残る。",
      },
      {
        text: "Trim the tool output to the fields the extraction uses before adding it to the context.",
        why: "正解。ツールの結果は関係ない項目まで溜まる。文脈に入れる前に必要な項目だけに絞る。",
      },
      {
        text: "Summarize the vendor data in prose before passing it to the extraction step.",
        why: "文章にすると税番号のような正確な値がぼやける。必要な項目を構造のまま残すべき。",
      },
      {
        text: "Split every job into single-document requests so the vendor data is repeated less often in context.",
        why: "要らない項目を毎回入れていることは変わらない。根本はツールの出力の絞り込み。",
      },
    ],
    answer: 1,
    point: "ツールの出力は、文脈に溜まる前に必要な項目だけに絞る",
  },
];
