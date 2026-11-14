/* 基本情報技術者試験 科目A（#65）。
   分野と細目は IPA の出題範囲（テクノロジ系・マネジメント系・ストラテジ系と、その大分類）に合わせる。
   問題は IPA の公開問題を出典付きで載せ、解説と要点は自作 */
import type { Domain, Exam } from "../../core/exam/types";
import { meta } from "./meta";
import { notes } from "./notes";
import { questions } from "./questions";

/* 配点（weight）は公式には公表されていないので、公開問題 80 問の分野の比（48・10・22）から置いた目安。
   模擬試験はこの比で 60 問を選ぶ */
const domains: Domain[] = [
  {
    id: "d1",
    title: "テクノロジ系",
    ja: "テクノロジ系",
    weight: 0.6,
    tasks: [
      { id: "1.1", title: "基礎理論", ja: "基礎理論" },
      { id: "1.2", title: "コンピュータシステム", ja: "コンピュータシステム" },
      { id: "1.3", title: "技術要素", ja: "技術要素" },
      { id: "1.4", title: "開発技術", ja: "開発技術" },
    ],
  },
  {
    id: "d2",
    title: "マネジメント系",
    ja: "マネジメント系",
    weight: 0.125,
    tasks: [
      { id: "2.1", title: "プロジェクトマネジメント", ja: "プロジェクトマネジメント" },
      { id: "2.2", title: "サービスマネジメント", ja: "サービスマネジメント（システム監査を含む）" },
    ],
  },
  {
    id: "d3",
    title: "ストラテジ系",
    ja: "ストラテジ系",
    weight: 0.275,
    tasks: [
      { id: "3.1", title: "システム戦略", ja: "システム戦略" },
      { id: "3.2", title: "経営戦略", ja: "経営戦略" },
      { id: "3.3", title: "企業と法務", ja: "企業と法務" },
    ],
  },
];

export const feA: Exam = {
  ...meta,
  domains,
  scenarios: [],
  questions,
  notes,
  outOfScope: ["公開されていない問題（各年度とも本番 60 問のうち 40 問）は載せていない"],
  sources: [
    {
      label: "IPA 基本情報技術者試験 公開問題（令和5〜8年度 科目A）",
      note: "問題と解答例。https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/index.html 。各年度とも本番 60 問のうち 20 問が公開されている",
    },
    {
      label: "IPA よくある質問（過去問題の使用）",
      note: "公表している過去問題は許諾・使用料なしで使える。年度・試験区分・問番号などの出典を明記し、改変したときはその旨も明記する",
    },
    {
      label: "分野の配点",
      note: "分野ごとの出題数は公表されていないので、公開問題の分野の比（テクノロジ系 48・マネジメント系 10・ストラテジ系 22）から置いた目安",
    },
  ],
};
