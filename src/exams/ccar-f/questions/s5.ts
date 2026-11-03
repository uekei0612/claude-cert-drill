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
        text: "Lower the temperature so the second review produces the same comments as the first one.",
        why: "同じ指摘を同じように出すだけで、重複そのものは無くならない。",
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
        text: "Keep the single pass but use a model with a larger context window so all files fit comfortably.",
        why: "入るかどうかではなく、一度に見る量が多いと注意が分散することが問題。",
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
];
