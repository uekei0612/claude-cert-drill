/* シナリオ 2：Claude Code での開発（自作問題） */
import type { Question } from "../../types";

export const s2: Question[] = [
  {
    id: "s2-01",
    scenario: "s2",
    tasks: ["3.1"],
    stem: "A senior engineer wrote the team's API conventions into Claude Code instructions months ago, and Claude follows them in that engineer's sessions. A developer who joined last week reports that Claude ignores the conventions in their sessions on the same repository. What is the most likely cause?",
    options: [
      {
        text: "The new developer's Claude Code version is older and does not support CLAUDE.md files.",
        why: "版の違いを疑うより先に、指示の置き場所を疑うべき。同じリポジトリで人によって効き方が違うのは、階層の問題の典型。",
      },
      {
        text: "The conventions live in the senior engineer's ~/.claude/CLAUDE.md, which applies only to that user.",
        why: "正解。ユーザーの階層の CLAUDE.md は本人にしか効かない。チームに効かせたい規約はプロジェクトの CLAUDE.md に置いてリポジトリに入れる。",
      },
      {
        text: "CLAUDE.md is only read at the start of a new repository clone, so the new developer needs to re-clone.",
        why: "CLAUDE.md はセッションの開始時に読まれる。複製し直す必要は無い。",
      },
      {
        text: "The new developer needs to run /compact first, because their session history is too long for CLAUDE.md to fit into the context window.",
        why: "/compact は会話を縮める機能で、指示ファイルが読まれない問題とは関係が無い。",
      },
    ],
    answer: 1,
    point:
      "人によって指示が効かない → 指示がユーザーの ~/.claude/CLAUDE.md にしか無い。チームの規約はプロジェクトに置く",
  },
  {
    id: "s2-02",
    scenario: "s2",
    tasks: ["3.1"],
    stem: "Your monorepo's root CLAUDE.md has grown to 1,800 lines covering frontend, backend, data pipelines, and deployment. Each package's maintainers know which standards matter for their package. How should you restructure the configuration?",
    options: [
      {
        text: "Keep everything in the root CLAUDE.md but add a table of contents at the top so Claude can find the relevant section.",
        why: "目次を付けても全文は毎回読み込まれ、関係の無い規約で文脈を使い続ける。",
      },
      {
        text: "Move each standard into its own skill so that Claude loads a standard only when someone invokes the matching slash command for that area.",
        why: "いつも守るべき規約を、呼ばれたときだけ効くスキルにすると、呼び忘れたときに効かない。スキルは作業手順向き。",
      },
      {
        text: "Split the standards into focused files and have each package's CLAUDE.md @import only the ones it needs.",
        why: "正解。@import で別ファイルを読み込み、パッケージごとに必要な規約だけを含める。保守する人の知識で選べる。",
      },
      {
        text: "Delete the root CLAUDE.md and ask developers to paste the relevant standards into each prompt.",
        why: "人の手に頼ると抜けが出る。設定で決定的に読み込ませる仕組みを捨てている。",
      },
    ],
    answer: 2,
    point: "大きな CLAUDE.md は話題別ファイルに分け、各パッケージの CLAUDE.md から @import で必要なものだけ読む",
  },
  {
    id: "s2-03",
    scenario: "s2",
    tasks: ["3.2"],
    stem: "Your team wants a /review command that applies the team's review checklist. Every developer should get the same command automatically after cloning the repository. Where should it be defined?",
    options: [
      {
        text: "In .claude/commands/ in the repository, so it is shared through version control.",
        why: "正解。プロジェクトのコマンドは .claude/commands/ に置くと、リポジトリと一緒に全員に配られる。",
      },
      {
        text: "In each developer's ~/.claude/commands/ directory, distributed by a setup script.",
        why: "ユーザーの階層は個人用。配布の手間が増え、内容がずれていく。",
      },
      {
        text: "In the root CLAUDE.md, as a paragraph describing what a review should check.",
        why: "CLAUDE.md は常に読み込まれる規約の置き場で、名前を付けて呼び出すコマンドにはならない。",
      },
      {
        text: "In ~/.claude.json, alongside the user's MCP server configuration.",
        why: "~/.claude.json はユーザー単位の設定。チームでの共有にならない。",
      },
    ],
    answer: 0,
    point: "チームで共有するコマンドは .claude/commands/（リポジトリに入れる）。個人用は ~/.claude/commands/",
  },
  {
    id: "s2-04",
    scenario: "s2",
    tasks: ["3.2", "5.4"],
    stem: "A team skill analyzes the whole codebase and produces several thousand lines of intermediate output before its final recommendations. After running it, developers find the main session sluggish and Claude losing track of earlier decisions. Which frontmatter change best addresses this?",
    options: [
      {
        text: "Add allowed-tools: Read so the skill cannot produce as much output.",
        why: "allowed-tools は使えるツールを絞る設定で、出力の量の問題は解決しない。分析に必要なツールまで奪う。",
      },
      {
        text: "Add argument-hint so that developers are prompted to pass a narrower directory each time they run the skill.",
        why: "argument-hint は引数の案内を出すだけ。範囲を絞る運用に頼ることになり、出力が本体の会話に溜まる問題は残る。",
      },
      {
        text: "Add disable-model-invocation so only developers can trigger the skill.",
        why: "誰が呼ぶかの問題ではない。呼ばれたときに本体の文脈が汚れることが問題。",
      },
      {
        text: "Add context: fork so the skill runs in an isolated sub-agent context.",
        why: "正解。context: fork はスキルを別の文脈で動かし、長い途中経過で本体の会話を埋めない。",
      },
    ],
    answer: 3,
    point: "出力の多いスキルは context: fork で別の文脈で動かし、結果だけを本体に戻す",
  },
  {
    id: "s2-05",
    scenario: "s2",
    tasks: ["3.3"],
    stem: "Test files live next to the code they test throughout the repository (for example src/billing/invoice.test.ts and src/auth/session.test.ts). You want testing conventions to apply whenever Claude edits any test file, without loading them for other work. What is the best approach?",
    options: [
      {
        text: "Put a CLAUDE.md with the testing conventions in every directory that contains tests.",
        why: "ディレクトリの CLAUDE.md はそのディレクトリ全体に効き、テスト以外の作業でも読み込まれる。しかも何十か所にも同じ内容を置くことになる。",
      },
      {
        text: 'Add a .claude/rules/ file whose YAML paths field is a glob such as "**/*.test.ts".',
        why: "正解。paths に glob を書いたルールは、合うファイルを触るときだけ読み込まれる。ディレクトリをまたいで散らばるファイルに向く。",
      },
      {
        text: 'Add the testing conventions to the root CLAUDE.md under a heading named "Tests".',
        why: "常に読み込まれるので、テストを触らない作業でも文脈を使う。",
      },
      {
        text: "Create a /test-conventions skill and ask developers to run it at the start of any session in which they plan to edit tests.",
        why: "人が呼び忘れると効かない。ファイルの種類で自動的に効かせる仕組みがある。",
      },
    ],
    answer: 1,
    point: "散らばったファイルの種類ごとの規約は .claude/rules/ の paths（glob）で、合うファイルを触るときだけ読む",
  },
  {
    id: "s2-06",
    scenario: "s2",
    tasks: ["3.4"],
    stem: "A developer asks Claude Code to migrate the project from one HTTP client library to another. The old library is used in roughly 50 files, two wrapper modules hide some of the usages, and there are two viable migration strategies with different trade-offs. How should the developer proceed?",
    options: [
      {
        text: "Use direct execution and let Claude migrate files one at a time, fixing errors as they appear.",
        why: "影響範囲と方針が決まらないまま手を付けると、途中で方針を変えるときに大きなやり直しになる。",
      },
      {
        text: "Ask Claude to migrate the two wrapper modules first and then decide the strategy based on whether the tests pass.",
        why: "テストが通るかで戦略を選ぶのは順序が逆。どちらの戦略かを先に決めないと、ラッパーの書き直し方も決まらない。",
      },
      {
        text: "Use plan mode to explore the usages and compare the two strategies, agree on a plan, then execute the plan.",
        why: "正解。多数のファイル、複数の妥当なやり方、設計の判断が要る作業はプランモードで調べてから実行する。計画と実行の組み合わせが基本形。",
      },
      {
        text: "Split the migration into 50 separate sessions, one per file, to keep each context small.",
        why: "全体の方針を決める段階が抜けている。ファイルごとにばらばらの判断になり、一貫性が崩れる。",
      },
    ],
    answer: 2,
    point: "多数のファイル・複数のやり方・設計判断がある作業はプランモードで調べて計画し、それから実行する",
  },
  {
    id: "s2-07",
    scenario: "s2",
    tasks: ["3.4"],
    stem: "A production error log shows a clear stack trace pointing to a missing null check in a single function. The fix is a two-line change in one file. What is the most appropriate way to use Claude Code?",
    options: [
      {
        text: "Use direct execution: ask Claude to add the null check and run the relevant tests.",
        why: "正解。範囲がはっきりした 1 ファイルの小さな修正は直接実行でよい。プランモードは手間に見合わない。",
      },
      {
        text: "Enter plan mode to explore the whole codebase for related null-handling patterns before changing anything.",
        why: "小さく範囲の明確な修正に全体の調査は過剰。関連の調査が要るなら修正の後で別の作業にする。",
      },
      {
        text: "Use the interview pattern so Claude asks clarifying questions about the expected behavior first.",
        why: "期待する動きはスタックトレースから明らか。インタビューは慣れない分野で考え漏れを洗い出すためのもの。",
      },
      {
        text: "Run a skill with context: fork so the fix does not pollute the main session.",
        why: "2 行の修正で文脈が汚れることは無い。仕組みを持ち出す必要が無い。",
      },
    ],
    answer: 0,
    point: "スタックトレースのはっきりした 1 ファイルの小さな修正は直接実行でよい",
  },
  {
    id: "s2-08",
    scenario: "s2",
    tasks: ["3.5"],
    stem: "You ask Claude to write a function that converts legacy product codes into the new format. After three rounds of describing the rules in prose, each attempt handles the rules differently. What is the most effective next step?",
    options: [
      {
        text: "Rewrite the description again, more formally, using bullet points for each rule.",
        why: "文章の説明が毎回違う解釈をされている状況で、文章を書き直しても同じことが起きやすい。",
      },
      {
        text: "Ask Claude to explain its understanding of the rules before writing code.",
        why: "理解の確認にはなるが、正しい変換の形を伝える手段としては具体例のほうが確実。",
      },
      {
        text: "Switch to plan mode so Claude can explore the codebase for existing conversion logic.",
        why: "問題は探索不足ではなく、期待する変換が伝わっていないこと。",
      },
      {
        text: "Show two or three concrete input and expected output pairs.",
        why: "正解。文章が一貫して解釈されないときは、具体的な入力と出力の例を 2〜3 個見せるのが最も効く。",
      },
    ],
    answer: 3,
    point: "文章の説明が毎回違う解釈をされるなら、具体的な入力と期待する出力の例を 2〜3 個見せる",
  },
  {
    id: "s2-09",
    scenario: "s2",
    tasks: ["5.4"],
    stem: 'During a multi-hour session exploring an unfamiliar legacy codebase, Claude\'s answers become inconsistent and it starts describing "typical" repository patterns instead of the specific classes it found earlier. What should you do to keep the investigation reliable?',
    options: [
      {
        text: "Ask Claude to re-read every file it has opened so far before answering each new question, so its answers are always based on the source.",
        why: "読み直しで文脈がさらに埋まり、劣化を早める。",
      },
      {
        text: "Have Claude keep key findings in a scratchpad file to consult later, and run /compact when exploration output piles up.",
        why: "正解。長いセッションでは文脈が劣化する。要点をファイルに書き残して読み直し、長い探索の出力は /compact で縮める。",
      },
      {
        text: "Lower the temperature so that Claude's answers become more consistent.",
        why: "温度は文脈の劣化の原因に触れない。一貫性の問題は情報が文脈から押し出されていること。",
      },
      {
        text: "Start a new session and ask the same questions again without any prior context.",
        why: "せっかく見つけた事実を捨てて最初からやり直すことになる。新しく始めるなら要約を入れて始める。",
      },
    ],
    answer: 1,
    point: "長い探索では要点をスクラッチパッドに書き残して参照し、/compact で文脈を縮める",
  },
  {
    id: "s2-10",
    scenario: "s2",
    tasks: ["1.7"],
    stem: "Yesterday you ran a named Claude Code session that analyzed the payment module. Overnight a teammate merged changes to three files in that module. Today you want to continue the analysis. Most of yesterday's findings are still valid. What is the best approach?",
    options: [
      {
        text: "Start a brand-new session and ask Claude to analyze the payment module again from scratch.",
        why: "大半の分析がまだ有効なのに捨てるのはもったいない。新しく始めるのは、以前の結果の多くが古くなったとき。",
      },
      {
        text: "Resume the session with --resume and continue as if nothing changed, since the changes are small.",
        why: "変更を知らせないと、古い読み取り結果のまま判断して誤る。",
      },
      {
        text: "Resume with --resume <session-name> and tell Claude which three files changed.",
        why: "正解。以前の文脈がほぼ有効なら再開し、変わったファイルを具体的に伝えて、その部分だけ調べ直させる。",
      },
      {
        text: "Use fork_session to create a branch, then compare the forked session's analysis with the original.",
        why: "fork_session は共通の分析から別々の方針を試すためのもの。変更されたファイルの再確認という目的に合わない。",
      },
    ],
    answer: 2,
    point: "以前の文脈がほぼ有効なら --resume で再開し、変わったファイルを伝えてそこだけ調べ直させる",
  },
];
