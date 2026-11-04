/* シナリオ 5：CI/CD での Claude Code（自作問題）。正解の文は短く言い切り、誤答の長さと揃える */
import type { Question } from "../../types";

export const s5: Question[] = [
  {
    id: "s5-01",
    scenario: "s5",
    tasks: ["3.6"],
    stem: 'Your CI job runs claude "Review the changes in this pull request" as a pipeline step. The job never finishes and is killed by the CI timeout after 60 minutes, with no output. What is the most likely fix?',
    options: [
      {
        text: "Run it with the -p flag so Claude Code runs non-interactively.",
        why: "正解。-p（--print）を付けないと対話モードで入力を待ち続ける。CI では非対話モードで動かす。",
      },
      {
        text: "Increase the CI timeout to several hours, because large pull requests take a long time to review.",
        why: "入力待ちで止まっているので、いくら待っても終わらない。",
      },
      {
        text: "Add a CLAUDE.md file to the repository root so that Claude Code knows it is running inside a CI environment.",
        why: "CLAUDE.md は文脈を与えるもので、対話か非対話かの動作は変えない。",
      },
      {
        text: "Pipe an empty string into the command's standard input so it does not wait for keyboard input.",
        why: "その場しのぎで、非対話モードの正しい指定になっていない。用意されたフラグを使う。",
      },
    ],
    answer: 0,
    point: "CI では -p（--print）で非対話モードにする。付けないと入力待ちで止まる",
  },
  {
    id: "s5-02",
    scenario: "s5",
    tasks: ["3.6", "4.3"],
    stem: "You want each review finding to be posted automatically as an inline comment on the exact file and line. The review text is currently free-form prose that a regex script tries to parse, and the script breaks often. What should you change?",
    options: [
      {
        text: 'Ask Claude in the prompt to always format findings as "FILE:LINE - message" so the regex keeps working.',
        why: "書式の指示は確率的にしか守られず、正規表現での解析はまた壊れる。",
      },
      {
        text: "Post the whole review as a single pull request comment instead of splitting it into inline comments.",
        why: "要件（行ごとのコメント）を捨てている。機械が読める出力にすれば満たせる。",
      },
      {
        text: "Use --output-format json with --json-schema defining file, line, severity, and message.",
        why: "正解。--output-format json と --json-schema で機械が読める構造化した結果を出させ、そのまま行コメントに載せる。",
      },
      {
        text: "Run a second Claude call that converts the prose review into JSON before the script posts it.",
        why: "変換の工程が増え、そこでも誤りが入る。最初から構造化した出力を求められる。",
      },
    ],
    answer: 2,
    point: "CI の結果を機械で扱うなら --output-format json と --json-schema で構造化して出させる",
  },
  {
    id: "s5-03",
    scenario: "s5",
    tasks: ["3.6"],
    stem: "After a developer pushes new commits to a pull request, the CI review runs again and re-posts many comments that were already made on earlier commits, including some the developer already fixed. How should you change the re-review?",
    options: [
      {
        text: "Only review the diff of the newest commit and ignore the rest of the pull request.",
        why: "前の変更との組み合わせで生じる問題を見落とす。重複を減らす目的なら、前回の指摘を渡せばよい。",
      },
      {
        text: "Include the prior findings in context and ask for only new or still-unaddressed issues.",
        why: "正解。レビューし直すときは前回の指摘を文脈に入れ、新しいものと未対応のものだけを報告させる。",
      },
      {
        text: "Delete all previous review comments on the pull request before posting the new review.",
        why: "議論の履歴まで消える。直した指摘の再掲という問題も解決しない。",
      },
      {
        text: "Mark all of the bot's earlier comments as resolved, then post a complete new review.",
        why: "直していない指摘まで解決済みに見え、同じ指摘が付け直される問題も残る。",
      },
    ],
    answer: 1,
    point: "再レビューでは前回の指摘を渡し、新しいもの・未対応のものだけを出させる",
  },
  {
    id: "s5-04",
    scenario: "s5",
    tasks: ["4.1"],
    stem: 'The review prompt says "Check that code comments are accurate." Developers say most comment-related findings are nitpicks about wording, and they have started ignoring the bot. What prompt change most improves precision?',
    options: [
      {
        text: 'Add "Be conservative and only report findings you are highly confident about."',
        why: "「控えめに」「確信の高いものだけ」のような一般的な指示は精度を上げない。何を報告するかの基準が曖昧なまま。",
      },
      {
        text: "Ask Claude to rate each finding from 1 to 10 and post only findings rated 8 or higher.",
        why: "自己申告の点数での足切りは、基準の曖昧さを解消しない。",
      },
      {
        text: "Remove comment checking entirely, because comments do not affect how the code behaves.",
        why: "動きと食い違うコメントは本物の不具合の元になる。基準を決めれば価値のある指摘になる。",
      },
      {
        text: "Flag a comment only when its described behavior contradicts what the code does.",
        why: "正解。曖昧な指示より、報告する条件を具体的に決める。「説明が実際の動きと矛盾するときだけ」は明確な基準。",
      },
    ],
    answer: 3,
    point: "「正確か確認」ではなく「説明が実際の動きと矛盾するときだけ指摘」のような明確な基準を書く",
  },
  {
    id: "s5-05",
    scenario: "s5",
    tasks: ["4.1"],
    stem: "Your review bot reports four categories: security, correctness, performance, and style. Style findings have a very high false positive rate, and developers now dismiss even the accurate security findings. What should you do right away?",
    options: [
      {
        text: "Temporarily turn off the style category while you rework its prompt, keeping the others on.",
        why: "正解。誤検出の多い種類は正しい指摘への信頼まで下げる。その種類を一時的に止めて信頼を戻し、その間にプロンプトを直す。",
      },
      {
        text: 'Keep all four categories but add "only report style issues you are sure about" to the prompt.',
        why: "確信度を求める一般的な指示では誤検出は減らない。信頼が落ち続ける。",
      },
      {
        text: "Turn off the bot completely until the false positive rate of every category is below 5%.",
        why: "役に立っている種類（セキュリティなど）まで止めてしまう。問題の種類だけを止めればよい。",
      },
      {
        text: 'Label every style finding as "low priority" so developers know which ones they can ignore.',
        why: "無視してよい指摘を出し続けると、ボット全体が読み飛ばされる状況は変わらない。",
      },
    ],
    answer: 0,
    point: "誤検出の多い種類は一時的に止めて信頼を戻し、その間にその種類のプロンプトを直す",
  },
  {
    id: "s5-06",
    scenario: "s5",
    tasks: ["4.2"],
    stem: "Findings from the review bot vary in format: some include a suggested fix, some omit the severity, and some point to a function rather than a line. Detailed formatting instructions have not fixed this. What is the most effective next step?",
    options: [
      {
        text: "Write the formatting instructions again in more detail and move them to the top of the prompt.",
        why: "詳しい指示だけで揃わない状況で、指示を足しても同じことになりやすい。",
      },
      {
        text: "Add a post-processing script that drops any finding missing a field.",
        why: "揃っていない出力を捨てるだけで、本物の指摘まで失う。出力そのものを揃えるべき。",
      },
      {
        text: "Add 2–4 example findings that show the exact format: location, issue, severity, and suggested fix.",
        why: "正解。詳しい指示で揃わないときに最も効くのは few-shot の例。出力の形を例で見せる。",
      },
      {
        text: "Switch to a larger model, since formatting consistency improves with model size.",
        why: "形を揃える効果の確かな手段（例を見せる）を試さずに、費用の高い手段に飛んでいる。",
      },
    ],
    answer: 2,
    point: "指示だけで出力の形が揃わないなら、形を示す few-shot の例を 2〜4 個入れる",
  },
  {
    id: "s5-07",
    scenario: "s5",
    tasks: ["4.6"],
    stem: "In CI, the same Claude Code session generates new tests and then reviews them. The review almost never finds problems, but humans later find several weak or incorrect tests. What change will most improve the review?",
    options: [
      {
        text: 'Tell the generating session to "critically re-examine your own work as if a stranger wrote it."',
        why: "作ったときの理由づけが文脈に残っているので、自分の判断を疑いにくい。指示では外せない。",
      },
      {
        text: "Enable extended thinking during the review step so the model reasons more carefully.",
        why: "長く考えても、作ったときの文脈を持ったままでは同じ見落としをしやすい。",
      },
      {
        text: "Run the review step twice in the same session and merge the findings from both runs.",
        why: "同じ文脈のままなので、同じ盲点が二回出るだけ。",
      },
      {
        text: "Review with a separate Claude instance that has none of the generation context.",
        why: "正解。作った文脈を持たない別のインスタンスでレビューする。自己レビューの指示や長い思考より見落としを見つける。",
      },
    ],
    answer: 3,
    point: "生成した文脈を持たない別のインスタンスでレビューする（自己レビューは弱い）",
  },
  {
    id: "s5-08",
    scenario: "s5",
    tasks: ["4.6", "1.6"],
    stem: "A pull request touches 22 files across three services. The single-pass review misses obvious bugs in individual files and sometimes contradicts itself about the same function. How should you restructure the review?",
    options: [
      {
        text: "Run per-file passes for local issues, then a separate cross-file pass for data flow.",
        why: "正解。大きなレビューは、ファイルごとの局所的な確認と、ファイルをまたぐ統合の確認に分ける。注意の分散と自己矛盾を防ぐ。",
      },
      {
        text: "Ask the developer to split the pull request into 22 single-file pull requests before review.",
        why: "サービスをまたぐ変更の整合性を見られなくなる。レビューの仕組み側で分ければよい。",
      },
      {
        text: "Run the single pass twice and post only the findings that appear in both runs.",
        why: "同じ注意の分散が 2 回起きるだけ。一致を取ると、片方だけが見つけた本物の指摘も落ちる。",
      },
      {
        text: "Review only the files with the most changed lines, since they are where most bugs are found.",
        why: "小さな変更のファイルや、ファイルをまたぐ問題を見落とす。",
      },
    ],
    answer: 0,
    point: "大きなレビューはファイルごとのパスと、ファイルをまたぐ統合のパスに分ける",
  },
  {
    id: "s5-09",
    scenario: "s5",
    tasks: ["4.5"],
    stem: "You run two Claude workloads: a blocking review that must finish before a pull request can merge, and a nightly report that analyzes every commit merged that day. You want to reduce costs. Which approach fits?",
    options: [
      {
        text: "Move both workloads to the Message Batches API to get the 50% discount on everything.",
        why: "バッチは最大 24 時間かかり、待ち時間の保証が無い。マージを待たせるレビューには使えない。",
      },
      {
        text: "Keep the pre-merge review synchronous and move only the nightly report to the Message Batches API.",
        why: "正解。待たせる処理は同期の API、待てる処理（夜間のレポート）はバッチ。バッチは費用が半分。",
      },
      {
        text: "Move the pre-merge review to the batch API and keep the nightly report synchronous.",
        why: "逆。待てない処理をバッチに回すと、マージが最大 24 時間止まる。",
      },
      {
        text: "Keep both synchronous, since the Message Batches API cannot be used for code analysis at all.",
        why: "バッチでもコードの分析はできる。待てる処理なら費用を下げられる。",
      },
    ],
    answer: 1,
    point: "待たせる処理（マージ前のチェック）は同期 API、待てる処理（夜間・週次）は Message Batches API",
  },
  {
    id: "s5-10",
    scenario: "s5",
    tasks: ["3.6", "4.2"],
    stem: "The CI test-generation step keeps proposing tests that duplicate scenarios already covered, and many of its new tests check trivial getters. Your team has clear standards for what makes a test valuable and a set of shared fixtures. What should you do?",
    options: [
      {
        text: 'Add "do not write duplicate or trivial tests" to the command-line prompt used by the CI job.',
        why: "何が重複で何が価値のあるテストかの材料が無いまま禁止しても、判断できない。",
      },
      {
        text: "Generate many tests and let developers delete the ones they do not want during review.",
        why: "価値の低い出力を人に選別させると、すぐ読まれなくなる。",
      },
      {
        text: "Put the testing standards and fixtures in CLAUDE.md, and give existing tests as context.",
        why: "正解。CI で動く Claude Code も CLAUDE.md を読む。テストの基準とフィクスチャを書き、既存のテストを渡せば重複も避けられる。",
      },
      {
        text: "Limit test generation to files with no existing tests so duplicates become impossible.",
        why: "テストのあるファイルでも足りない観点はある。重複は既存のテストを見せれば避けられる。",
      },
    ],
    answer: 2,
    point: "テストの基準・フィクスチャは CLAUDE.md に書き、既存のテストを文脈に渡して重複を避ける",
  },
  {
    id: "s5-11",
    scenario: "s5",
    tasks: ["3.6"],
    stem: "Your CI job runs claude -p to review a pull request and run the test suite. It fails because Claude tries to run npm test and there is no one to approve the command. You do not want to allow arbitrary shell commands. What should you do?",
    options: [
      {
        text: "Run Claude Code with all permission checks skipped so that nothing in the job ever waits for an approval.",
        why: "承認待ちは消えるが、何でも実行できる状態になる。必要なものだけ許す。",
      },
      {
        text: "Pass --allowedTools with only the specific commands the job needs, such as Bash(npm test:*).",
        why: "正解。CI では要るツールとコマンドだけを --allowedTools（または設定の許可）で前もって許す。",
      },
      {
        text: "Tell Claude in the prompt not to run any commands and to describe the tests instead.",
        why: "テストを実際に動かすという目的が果たせない。",
      },
      {
        text: "Remove -p so that the job runs in interactive mode and can wait for the approval prompt.",
        why: "CI には承認する人がいない。対話モードでは入力待ちで止まる。",
      },
    ],
    answer: 1,
    point: "CI では要るコマンドだけを --allowedTools（例：Bash(npm test:*)）で前もって許す。全部を許さない",
  },
  {
    id: "s5-12",
    scenario: "s5",
    tasks: ["3.6"],
    stem: "On a few very large pull requests, the CI review ran for a long time and made far more turns than usual, which drove up cost. You want a hard bound on how much work a single review can do. What should you add?",
    options: [
      {
        text: "A sentence in the prompt asking Claude to keep the review brief on large pull requests.",
        why: "指示は確率的。確かな上限にならない。",
      },
      {
        text: "A step that skips the review for any pull request with more than a set number of changed lines.",
        why: "大きな変更ほどレビューの価値がある。止めるのではなく上限を設ける。",
      },
      {
        text: "A smaller model for every review so that each turn costs less.",
        why: "1 回あたりは安くなっても、往復の数に上限が無いままで、レビューの質も落ちうる。",
      },
      {
        text: "A --max-turns limit on the claude -p invocation, together with a CI job timeout.",
        why: "正解。--max-turns で往復の数を、CI のタイムアウトで時間を確かに縛る。",
      },
    ],
    answer: 3,
    point: "CI のレビューの量は --max-turns（と CI のタイムアウト）で確かに縛る",
  },
  {
    id: "s5-13",
    scenario: "s5",
    tasks: ["4.1", "4.2"],
    stem: "The review labels findings as critical, major, or minor, but the labels are inconsistent: a missing null check is critical in one PR and minor in another. Developers no longer trust the severity. What is the best fix?",
    options: [
      {
        text: "Define each level with explicit criteria and give concrete example findings for each level.",
        why: "正解。各段階の基準をはっきり書き、段階ごとの具体例を見せる。あいまいな言葉だけでは判断がぶれる。",
      },
      {
        text: "Drop severity entirely and post every finding without any label.",
        why: "優先度の手がかりが消える。基準を直せば役に立つ。",
      },
      {
        text: "Base severity on the code's area, so that anything in payment or auth code is critical.",
        why: "場所だけで決めると、同じ種類の問題の扱いがそろわず、軽い指摘まで critical になる。",
      },
      {
        text: "Ask the model to explain its reasoning for each label in the comment it posts.",
        why: "理由を書かせても、基準が無ければ判断はそろわない。",
      },
    ],
    answer: 0,
    point: "重大度のばらつきは、段階ごとのはっきりした基準と具体例で直す",
  },
  {
    id: "s5-14",
    scenario: "s5",
    tasks: ["4.1"],
    stem: 'To cut false positives, you added "Only report issues you are highly confident about" to the review prompt. The number of comments barely changed, and style nitpicks and remarks about untouched code still appear. What should you do instead?',
    options: [
      {
        text: "Repeat the confidence instruction several times throughout the prompt.",
        why: "あいまいな指示を繰り返しても、何を出すかの基準ははっきりしない。",
      },
      {
        text: "Ask for a numeric confidence score and drop any finding below 0.8.",
        why: "自己申告の確信度は較正されていない。閾値で切っても狙った種類が消えるとは限らない。",
      },
      {
        text: "List which categories to report and which to skip, such as style or lines the PR did not change.",
        why: "正解。「確信が高い」はあいまい。報告する種類と、出さない種類（書き方・変更していない行など）をはっきり書く。",
      },
      {
        text: "Cap the review at three comments per pull request, whatever the size of the change, so only the top issues are posted.",
        why: "本当の問題が 4 つ目にあれば落ちる。数ではなく基準で絞る。",
      },
    ],
    answer: 2,
    point: "「確信の高いものだけ」はあいまい。報告する種類・出さない種類をはっきり書く",
  },
  {
    id: "s5-15",
    scenario: "s5",
    tasks: ["4.3"],
    stem: "Your CI review returns findings as JSON whose schema makes file and line required. Some real findings concern the pull request as a whole, such as a new module with no tests. The model now attaches them to an arbitrary line, and developers find those comments confusing. What should you change?",
    options: [
      {
        text: "Keep line required and instruct the model to use line 1 for findings that do not belong to a specific line.",
        why: "決め打ちの行も作り話の値。読み手には誤った場所を指すコメントに見える。",
      },
      {
        text: "Make line nullable, and have the posting script put findings without a line in a general PR comment.",
        why: "正解。当てはまらないことがある項目は null 可にし、null のときの扱いを下流で決める。必須にすると値を作り出す。",
      },
      {
        text: "Drop any finding that has no specific line, since inline comments are the only output the team reads.",
        why: "テストの無いモジュールのような大事な指摘を捨てている。",
      },
      {
        text: "Change line to a free-text string so the model can write whole PR there when needed.",
        why: "行番号の型を失い、投稿のスクリプトが文章を読み解く必要が戻ってくる。null で表せば済む。",
      },
    ],
    answer: 1,
    point:
      "当てはまらないことがある項目（行番号など）は null 可にし、null の扱いを下流で決める（必須だと値を作り出す）",
  },
  {
    id: "s5-16",
    scenario: "s5",
    tasks: ["4.5"],
    stem: "A colleague proposes moving the pull request review onto the Message Batches API to save 50%. The review is agentic: it reads files and runs tests through tools during a multi-turn session, and developers expect feedback within minutes. What is the best response?",
    options: [
      {
        text: "Agree, because batches usually return results within minutes for small requests such as a single review.",
        why: "誤り。バッチは最長 24 時間の処理で、すぐの返事は保証されない。",
      },
      {
        text: "Agree, but split each review into one batch request per file to keep latency down.",
        why: "分けても返る時間は保証されず、ファイルをまたぐ確認や途中でのツール実行もできない。",
      },
      {
        text: "Agree, and run the tools on your side after the batch returns its final answer.",
        why: "ツールの結果を見て次を判断するのがエージェントの流れ。最後にまとめて動かすのでは成り立たない。",
      },
      {
        text: "Decline: batches suit work that can wait, and one request cannot run a multi-turn tool loop.",
        why: "正解。バッチは待てる大量の処理向けで、1 つのリクエストの中で何往復ものツールのやり取りはできない。",
      },
    ],
    answer: 3,
    point:
      "Message Batches API は待てる大量の処理向け（最長 24 時間）。即時の返事や、途中でツールを回す何往復のやり取りには使えない",
  },
  {
    id: "s5-17",
    scenario: "s5",
    tasks: ["4.6", "4.1"],
    stem: "About a quarter of the review's findings turn out to be wrong when developers check them. You want to filter out bad findings before they are posted, without losing real ones. Which design fits best?",
    options: [
      {
        text: "Have a separate instance check each finding against the code and keep only those it confirms.",
        why: "正解。生成した文脈を持たない別のインスタンスに、所見ごとにコードと照らして確かめさせる。自己レビューより偏りが少ない。",
      },
      {
        text: "Ask the same session that produced the findings to reread each of them and remove any that it now doubts.",
        why: "同じ文脈は自分の推論に引きずられやすい。別のインスタンスで確かめる。",
      },
      {
        text: "Run the same review prompt three times and post the findings that appear at least once.",
        why: "1 回でも出たものを残すと、誤りはむしろ増える。",
      },
      {
        text: "Post only the first five findings in the order the model produced them.",
        why: "出た順は正しさと関係ない。",
      },
    ],
    answer: 0,
    point: "所見の誤りは、生成の文脈を持たない別のインスタンスで 1 件ずつ確かめて落とす",
  },
  {
    id: "s5-18",
    scenario: "s5",
    tasks: ["4.4"],
    stem: "Developers can dismiss review comments, and they dismiss a lot of them. You want to improve the review prompt over time based on this signal. What is the most useful thing to set up?",
    options: [
      {
        text: "A weekly count of dismissed comments, shown on a dashboard for the team.",
        why: "数だけでは、どの種類の所見が外れているのかが分からない。",
      },
      {
        text: "An automatic rule that stops posting any new comment that closely resembles one that was dismissed before.",
        why: "似ているだけで本物まで止める恐れがある。まず傾向を分析してプロンプトを直す。",
      },
      {
        text: "Record each finding's category and pattern with whether it was dismissed, and review by category.",
        why: "正解。所見ごとに種類や型を記録して却下と結びつければ、どの種類が外れているかが分かり、その種類を直せる。",
      },
      {
        text: "A request that developers write a paragraph explaining each dismissal in detail.",
        why: "手間が大きく続かない。種類を構造化して記録すれば集計できる。",
      },
    ],
    answer: 2,
    point: "改善の手がかりは、所見の種類・型と却下を結びつけて記録し、種類ごとに分析する",
  },
  {
    id: "s5-19",
    scenario: "s5",
    tasks: ["4.2"],
    stem: 'The review keeps flagging intentional patterns, such as an empty catch block with a comment explaining why it is safe, as bugs. The prompt already says "Do not flag intentional code." What is the most effective addition?',
    options: [
      {
        text: 'Make the instruction stronger: "NEVER flag intentional code under any circumstances."',
        why: "強調しても、何が意図的かの判断はあいまいなまま。",
      },
      {
        text: "A few examples contrasting an acceptable intentional pattern with a real bug, with the reasoning.",
        why: "正解。境目の判断は、許される書き方と本物の不具合を並べた例と理由で見せると効く。",
      },
      {
        text: "A list of every file in the repository where intentional patterns are known to exist.",
        why: "一覧は保守できず、新しいコードにも効かない。判断の仕方を見せる。",
      },
      {
        text: "A rule to skip all catch blocks during review, since that is where most of these false positives have occurred.",
        why: "本当に危ない catch まで見逃す。",
      },
    ],
    answer: 1,
    point: "境目の判断（意図的な書き方か不具合か）は、両方を並べた few-shot の例と理由で教える",
  },
  {
    id: "s5-20",
    scenario: "s5",
    tasks: ["4.6"],
    stem: "Each finding now comes with a confidence level from a separate verification pass. You want developers to see the most reliable feedback first, without throwing away less certain findings entirely. How should findings be routed?",
    options: [
      {
        text: "Post every finding inline, ordered by confidence, so that nothing at all is hidden from the developers.",
        why: "全部を行ごとに出すと、低い確信の所見が誤検出として信頼を下げる。",
      },
      {
        text: "Post only the high-confidence findings and delete the rest so they do not add noise.",
        why: "本物が混ざっている低い確信の所見を失う。",
      },
      {
        text: "Ask the model to merge low-confidence findings into a single vague warning at the top.",
        why: "あいまいな警告は誰も読まず、具体的な手がかりも失われる。",
      },
      {
        text: "Post high-confidence findings inline and list lower-confidence ones in a collapsed summary.",
        why: "正解。確かなものは目立つ場所に、確かさの低いものは控えめな場所にまとめて残す。信頼を守りつつ情報も失わない。",
      },
    ],
    answer: 3,
    point: "確信度で出し先を分ける：確かなものは行ごとのコメント、低いものは控えめな要約に残す",
  },
];
