/* AWS Certified Solutions Architect – Professional（SAP-C03）（#101）。
   分野・細目の名前と配点は AWS の試験ガイド（SAP-C03。2026-11-17 から。それまでは SAP-C02）に合わせる。
   シナリオは無い（問題 ID は d1-01 の形）。問題・解説・要点はすべて自分の言葉で書く（ガイドやサンプル問題の文は載せない）。
   本番の複数選択（正解が 2 つ以上）の問題は、このアプリでは択一で作る */
import type { Domain, Exam } from "../../core/exam/types";
import { ja } from "./ja";
import { meta } from "./meta";
import { notes } from "./notes";
import { questions } from "./questions";

const t = (id: string, title: string, ja: string) => ({ id, title, ja });

const domains: Domain[] = [
  {
    id: "d1",
    title: "Architecture Design and Implementation Built for the Cloud",
    ja: "クラウド向けのアーキテクチャの設計と実装",
    weight: 0.25,
    tasks: [
      t("1.1", "Design architectures built for the cloud", "クラウド向けのアーキテクチャ"),
      t("1.2", "Integrate AI and ML services into architectures", "AI・ML のサービスの組み込み"),
      t("1.3", "Design hybrid cloud integration patterns", "ハイブリッドクラウドの連携"),
      t("1.4", "Design network architectures", "ネットワークの設計"),
      t("1.5", "Design data, storage, and database architectures", "データ・ストレージ・データベースの設計"),
    ],
  },
  {
    id: "d2",
    title: "Security, Compliance, and Governance",
    ja: "セキュリティ・コンプライアンス・ガバナンス",
    weight: 0.25,
    tasks: [
      t("2.1", "Design identity security architectures", "ID のセキュリティ"),
      t("2.2", "Design solutions to implement encryption and key management strategies", "暗号化と鍵の管理"),
      t("2.3", "Design multi-account governance and compliance solutions", "マルチアカウントのガバナンスと準拠"),
      t("2.4", "Design architectures to meet compliance requirements", "コンプライアンスの要件を満たす設計"),
      t("2.5", "Design security and responsible AI controls", "AI のセキュリティと責任ある利用の統制"),
    ],
  },
  {
    id: "d3",
    title: "Cost-Optimized Architecture Design",
    ja: "コストを最適化したアーキテクチャの設計",
    weight: 0.15,
    tasks: [
      t("3.1", "Design architectures based on AWS pricing models", "料金モデルに基づく設計"),
      t("3.2", "Optimize data transfer and network costs", "データ転送とネットワークのコスト"),
      t("3.3", "Design cost allocation and visibility solutions", "コストの配分と可視化"),
      t("3.4", "Optimize storage and database costs", "ストレージとデータベースのコスト"),
    ],
  },
  {
    id: "d4",
    title: "Resilience, Migration, and Business Continuity",
    ja: "回復性・移行・事業継続",
    weight: 0.15,
    tasks: [
      t("4.1", "Design migration strategies by using AWS frameworks", "AWS の枠組みを使った移行戦略"),
      t("4.2", "Design disaster recovery architectures", "災害対策の設計"),
      t("4.3", "Design solutions to meet business continuity and resiliency requirements", "事業継続と回復性"),
    ],
  },
  {
    id: "d5",
    title: "Operational Excellence and Automation",
    ja: "運用上の優秀性と自動化",
    weight: 0.2,
    tasks: [
      t("5.1", "Design infrastructure as code", "コードによるインフラ（IaC）"),
      t("5.2", "Design CI/CD and DevSecOps pipelines", "CI/CD と DevSecOps のパイプライン"),
      t("5.3", "Design observability and monitoring solutions", "可観測性と監視"),
      t("5.4", "Design operational automation and resilient systems", "運用の自動化と回復性のあるシステム"),
    ],
  },
];

export const sapC03: Exam = {
  ...meta,
  domains,
  scenarios: [],
  questions,
  notes,
  translations: { ja },
  outOfScope: [
    "OS の深い知識",
    "AI・ML のモデルの学習・ファインチューニング、データサイエンスの作業",
    "セキュリティインシデントのフォレンジックと詳しい脅威の調査",
    "アプリケーションのコードの開発とデバッグ",
    "範囲外のサービス：Amazon Lightsail、Amazon GameLift、Amazon Braket、AWS Ground Station、AWS Device Farm、Amazon IVS、AWS Elemental MediaConvert／MediaLive など",
  ],
  sources: [
    {
      label: "分野・配点・細目・範囲外",
      note: "AWS の試験ガイド（SAP-C03）による。SAP-C02 は 2026-11-16 まで、SAP-C03 は 2026-11-17 から",
    },
    {
      label: "75 問（採点される 65 問と、採点されない 10 問）・180 分・合格点 750",
      note: "AWS の試験ガイドと資格のページによる。本番には複数選択の問題もあるが、このアプリは択一だけ",
    },
    {
      label: "合格の目安 75%",
      note: "このアプリの独自の目安。公式の換算式は非公開で、750 / 1000 は正答率 75% という意味ではない",
    },
    {
      label: "問題・解説・要点",
      note: "このアプリで自作したもの。AWS の公式の問題ではない。サービスの名前と機能は 2026-11 時点の AWS のドキュメントで確かめた",
    },
  ],
};
