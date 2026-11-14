/* 基本情報技術者試験 科目B（#64）。
   分野と細目は IPA の試験要綱の科目B の出題範囲に合わせる（問1〜問16 がアルゴリズムとプログラミング、
   問17〜問20 が情報セキュリティ）。問題は IPA の公開問題を出典付きで載せ、解説と要点は自作 */
import type { Domain, Exam } from "../../core/exam/types";
import { meta } from "./meta";
import { notes } from "./notes";
import { questions } from "./questions";

const domains: Domain[] = [
  {
    id: "d1",
    title: "アルゴリズムとプログラミング",
    ja: "アルゴリズムとプログラミング",
    weight: 0.8,
    tasks: [
      { id: "1.1", title: "プログラムの処理の基本要素", ja: "プログラムの処理の基本要素" },
      { id: "1.2", title: "データ構造及びアルゴリズム", ja: "データ構造及びアルゴリズム" },
      { id: "1.3", title: "プログラミングの諸分野への適用", ja: "プログラミングの諸分野への適用" },
    ],
  },
  {
    id: "d2",
    title: "情報セキュリティ",
    ja: "情報セキュリティ",
    weight: 0.2,
    tasks: [{ id: "2.1", title: "情報セキュリティの確保", ja: "情報セキュリティの確保" }],
  },
];

export const feB: Exam = {
  ...meta,
  domains,
  scenarios: [],
  questions,
  notes,
  outOfScope: [
    "科目A（知識を問う 60 問の小問）はまだ載せていない",
    "公開されていない年度（令和4年度以前の新形式前の問題など）は載せていない",
  ],
  sources: [
    {
      label: "IPA 基本情報技術者試験 公開問題（令和5〜8年度 科目B）",
      note: "問題と解答例。https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/index.html 。各年度とも本番 20 問のうち 6 問が公開されている",
    },
    {
      label: "IPA よくある質問（過去問題の使用）",
      note: "公表している過去問題は許諾・使用料なしで使える。年度・試験区分・問番号などの出典を明記し、改変したときはその旨も明記する",
    },
    {
      label: "試験の形式",
      note: "科目B は 20 問・100 分。問1〜問16 がアルゴリズムとプログラミング、問17〜問20 が情報セキュリティ。評価点は IRT で 1000 点満点、600 点以上で基準を満たす",
    },
  ],
};
