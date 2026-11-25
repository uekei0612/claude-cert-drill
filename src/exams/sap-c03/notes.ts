/* 細目ごとの要点（#101）。試験ガイド（SAP-C03）の細目の範囲を、自分の言葉でまとめたもの。
   サービスの名前と機能は 2026-11 時点の AWS のドキュメントで確かめた */
import type { Note } from "../../core/exam/types";

export const notes: Record<string, Note> = {
  "1.1": {
    points: [
      "急増を受け止めて取りこぼさないのは SQS による疎結合（バッファ＋デッドレターキュー）",
      "同期の呼び出しの連鎖は、イベントのファンアウト（SNS／EventBridge→各サービスの SQS）で切り離す",
      "再試行・エラー処理・補償を持つ複数の手順は Step Functions（Retry／Catch）",
      "セッションなどの状態はインスタンスの外（ElastiCache／DynamoDB）に出してステートレスにする",
      "密結合の HPC はクラスタープレイスメントグループ＋EFA（スプレッド／パーティションは故障を分けるため）",
    ],
    traps: ["スティッキーセッションで状態の問題が解けると思う", "Lambda 同士を同期でつないで流れを作る"],
  },
  "1.2": {
    points: [
      "社内の文書に基づいて出典付きで答えるのは RAG：Amazon Bedrock Knowledge Bases（文書が変わったら同期）",
      "エージェントの実行は Bedrock AgentCore Runtime（セッションの分離）、既存の API や Lambda をツールにするのは AgentCore Gateway（MCP 対応）",
      "基盤を管理せずに基盤モデルを使うなら Bedrock。独自のモデルを動かすなら SageMaker AI",
      "SageMaker AI の推論：大きなペイロード（最大 1 GB）・長い処理（最大 1 時間）・0 台まで減らすなら非同期推論",
    ],
    traps: [
      "ファインチューニングで社内の知識を入れようとする（古くなり、出典も示せない）",
      "全文書をプロンプトに入れる",
    ],
  },
  "1.3": {
    points: [
      "多数の VPC とオンプレミスのハブはトランジットゲートウェイ。Direct Connect とはトランジット VIF と Direct Connect ゲートウェイでつなぐ",
      "ハイブリッド DNS は Route 53 VPC Resolver（旧称 Route 53 Resolver）：オンプレミス→AWS はインバウンド、AWS→オンプレミスはアウトバウンドと転送ルール",
      "Direct Connect の最大の回復性は 2 ロケーション × 各 2 本（別の機器）。VPN のバックアップは安いが 1 トンネル約 1.25 Gbps",
      "既存の JMS／AMQP／MQTT のブローカーを書き換えずに移すのは Amazon MQ",
    ],
    traps: ["VPC ピアリングで推移的に通れると思う"],
  },
  "1.4": {
    points: [
      "CIDR が重なる相手や、サービスだけを一方向に見せたい相手には PrivateLink（ロードバランサー＋エンドポイントサービス）",
      "サブネットを他のアカウントに使わせるのは RAM による VPC 共有。VPC・ルート・ゲートウェイは所有者が管理する",
      "固定のエニーキャスト IP・TCP/UDP・数秒の切り替えは Global Accelerator",
      "SQL インジェクションや IP ごとの過剰な要求は AWS WAF（マネージドルール＋レートベースのルール）",
    ],
    traps: [
      "CIDR が重なる VPC をピアリングでつなごうとする（作れない）",
      "CloudFront で独自の UDP を扱えると思う（HTTP 系：WebSocket・gRPC・HTTP/3 まで）",
      "セキュリティグループで拒否のルールを書けると思う（許可だけ）",
    ],
  },
  "1.5": {
    points: [
      "複数リージョンで書き込むのは DynamoDB グローバルテーブル。Aurora グローバルデータベースは書き込みが 1 リージョン",
      "DynamoDB の読み取りをマイクロ秒にするのは DAX。Lambda から RDS への接続の嵐は RDS Proxy",
      "複数 AZ の Linux で共有するファイルは EFS、Windows の SMB 共有は FSx for Windows File Server（EBS Multi-Attach は同じ AZ だけ）",
      "Athena は読んだ量で払う：パーティション＋列指向（Parquet）",
      "遠くからの大きなファイルの上げは S3 Transfer Acceleration＋マルチパートアップロード",
    ],
    traps: ["EFS を Windows から使えると思う（NFS で、Windows は非対応）"],
  },
  "2.1": {
    points: [
      "第三者のアクセスはクロスアカウントのロール＋外部 ID（confused deputy の対策）",
      "社員の複数アカウントへのアクセスは IAM Identity Center（外部 IdP＋SCIM＋許可セット）",
      "EC2 の上のアプリケーションはロール（インスタンスプロファイル）の一時的な認証情報。長期のアクセスキーは置かない",
      "組織の外へ開いているリソースの発見は IAM Access Analyzer（信頼ゾーン＝組織）",
      "入ってくるポートもキーも無しでシェルを使うのは Systems Manager Session Manager",
    ],
    traps: ["長期のキーの置き場所を良くするだけで済ませる"],
  },
  "2.2": {
    points: [
      "アカウント間で使う KMS キーはカスタマーマネージドキー。キーポリシー（持ち主）と IAM ポリシー（使う側）の両方で許す",
      "自動のキーのローテーション（既定 365 日）は、対称で KMS が素材を作ったカスタマーマネージドキーだけ。古い素材も残る",
      "耐量子の署名は KMS の ML-DSA キー。ML-KEM は鍵の確立用",
      "自社専用で自社だけが制御する HSM（PKCS #11・JCE）は CloudHSM",
    ],
    traps: [
      "AWS マネージドキーをアカウント間で使おうとする（キーポリシーを変えられない）",
      "非対称のキーや取り込んだ素材のキーを自動でローテーションできると思う",
    ],
  },
  "2.3": {
    points: [
      "メンバーアカウントの管理者にもできなくさせる組織全体のガードレールは SCP（管理アカウントには効かない）",
      "統制されたマルチアカウント環境を素早く作るなら Control Tower（ランディングゾーン・コントロール・Account Factory）",
      "組織全体の検出結果は Security Hub と GuardDuty の委任管理者で集める",
      "EC2・ECR のイメージ・Lambda の継続的な脆弱性の検査は Inspector",
    ],
    traps: ["AWS Config で「防げる」と思う（評価と検出）"],
  },
  "2.4": {
    points: [
      "全アカウントの API の記録は組織の証跡を、ログアーカイブアカウントの S3（Object Lock）へ",
      "生成 AI のプロンプトと応答の記録は Bedrock のモデル呼び出しのログ（既定で無効）。CloudTrail は API の呼び出しの記録",
      "S3 の中の個人情報の発見は Macie",
      "DB の認証情報の自動の交換は Secrets Manager。S3 を CloudFront 経由だけにするのは OAC",
    ],
    traps: ["ログを同じアカウントに置く（そのアカウントの管理者が消せる）"],
  },
  "2.5": {
    points: [
      "生成 AI の入力と出力の統制（拒否するトピック・有害な内容・個人情報の伏せ字）は Bedrock Guardrails",
      "RAG の根拠の無い・関係の無い応答を止めるのは Guardrails の contextual grounding check",
      "AI の操作の人による承認は Step Functions の .waitForTaskToken（コールバック）",
    ],
    traps: ["システムプロンプトの指示で守らせようとする（確率的）", "出したあとの通知を承認の代わりにする"],
  },
  "3.1": {
    points: [
      "中断に強いバッチはスポット（タイプと AZ を広げ、price-capacity-optimized）",
      "EC2・Fargate・Lambda にまたがる約束は Compute Savings Plans",
      "使用率に基づく適正なサイズは Compute Optimizer（メモリは CloudWatch エージェント）",
      "使わない時間に動いている開発環境は予定で止める。Graviton で価格性能を上げる",
      "急がない大量の生成 AI の処理は Bedrock のバッチ推論",
    ],
    traps: ["大きすぎるままのインスタンスに Savings Plans を買う"],
  },
  "3.2": {
    points: [
      "VPC から同じリージョンの S3／DynamoDB へは、無料のゲートウェイエンドポイントで NAT を通さない",
      "遠い利用者への静的ファイルは S3＋CloudFront（エッジでキャッシュ）",
      "大量の 2 VPC 間の通信はピアリング（データ処理料金なし）。トランジットゲートウェイは GB ごとに処理料金",
    ],
    traps: ["インターフェイスエンドポイントのほうが安いと思う"],
  },
  "3.3": {
    points: [
      "コストの配分はタグ：タグポリシーで値をそろえ、SCP で付け忘れを防ぎ、管理アカウントでコスト配分タグを有効にする",
      "しきい値を決めずに異常な支出を見つけるのは Cost Anomaly Detection。Budgets は決めた額との比較",
      "最も細かいコストの分析は CUR 2.0 のデータエクスポート（リソース ID・1 時間単位）を S3 に置き Athena で SQL",
    ],
    traps: ["タグポリシーだけでタグの無いリソースを止められると思う"],
  },
  "3.4": {
    points: [
      "アクセスの傾向が読めない S3 のデータは Intelligent-Tiering（取り出しの料金なし）",
      "IOPS だけ増やしたいなら gp3（容量と別に IOPS とスループット）。gp2 は 1 GiB あたり 3 IOPS",
      "スナップショットの作成と期限切れの削除は Data Lifecycle Manager か AWS Backup の保持ルール",
      "CloudWatch Logs の既定の保持は無期限。保持を決め、古いものは S3（Glacier）へ",
    ],
    traps: ["要らないものまでアーカイブして残し続ける"],
  },
  "4.1": {
    points: [
      "7 つの R：リホスト・リプラットフォーム・リファクタ・リパーチェス（既製品へ）・リタイア・リテイン・リロケート",
      "多数のサーバーのリホストは AWS Transform MGN（旧称 AWS Application Migration Service）。継続的な複製・テスト起動・短い切り替え",
      "異なるエンジンへの移行は スキーマ変換（DMS Schema Conversion／SCT）＋DMS（全件＋変更分）",
      "オンラインでのファイルの移行は DataSync。一枚岩を少しずつ分けるのはストラングラーフィグ",
      "移行の根拠（実測に基づく費用とライセンス）は Migration Evaluator。最初のウェーブは依存関係が少なく危険の小さいもの",
    ],
    traps: ["エンジンの違うデータベースのリードレプリカを作れると思う", "一度に全部書き直して切り替える"],
  },
  "4.2": {
    points: [
      "災害対策の 4 方式は費用と RTO／RPO の交換：バックアップと復元＜パイロットライト＜ウォームスタンバイ＜マルチサイト",
      "サーバーの RPO 秒・RTO 分を安く：Elastic Disaster Recovery",
      "Aurora のリージョン間の災害対策は Aurora グローバルデータベース（複製の遅延は通常 1 秒未満、切り替えは通常数分）",
      "リージョン間の自動切り替えは Route 53 のフェイルオーバールーティング＋ヘルスチェック",
    ],
    traps: ["マルチ AZ をリージョンの障害への備えと取り違える"],
  },
  "4.3": {
    points: [
      "組織全体のバックアップは AWS Backup ポリシー＋リージョン間コピー＋Vault Lock（compliance モードは誰も消せない）",
      "RDS の自動切り替えでデータを失わないのはマルチ AZ（同期の複製）。リードレプリカは非同期",
      "障害の注入の実験は AWS Fault Injection Service（停止条件にアラーム）",
      "NAT ゲートウェイを 1 つの AZ に頼らない：リージョン NAT ゲートウェイか、ゾーンのものを AZ ごとに",
    ],
    traps: ["本番で停止条件も無く手で障害を起こす"],
  },
  "5.1": {
    points: [
      "全アカウント・複数リージョンへの展開は StackSets のサービスマネージドの権限＋自動デプロイ",
      "IaC を部品化して使い回すのは AWS CDK（construct → CloudFormation に合成）",
      "作られる前に拒否する統制は CloudFormation Hooks（Guard／Lambda）",
      "IaC のずれはドリフト検出で見つけ、変更の入口をテンプレートに一本化する",
    ],
    traps: ["SCP でリソースを配れると思う"],
  },
  "5.2": {
    points: [
      "公開前の確認と即時の切り戻しは blue/green（ECS は ECS 自体の blue/green が推奨）",
      "Lambda の段階的なリリースは CodeDeploy（CodeDeployDefault.LambdaCanary10Percent10Minutes など）＋アラームで自動ロールバック",
      "起動を速くそろえるのはゴールデン AMI（EC2 Image Builder）",
    ],
    traps: ["ローリング更新で即時に戻せると思う"],
  },
  "5.3": {
    points: [
      "サービスをまたいだ遅れの特定は分散トレース（AWS Distro for OpenTelemetry → X-Ray）",
      "全アカウントのログの集約は、アカウント間のサブスクリプションフィルター → 中央の Firehose → S3",
      "アクセスが無くても壊れたことに気付くのは CloudWatch Synthetics のカナリア。実際の利用者の体験は CloudWatch RUM",
    ],
    traps: ["ログを増やせば原因が分かると思う"],
  },
  "5.4": {
    points: [
      "繰り返す手作業の復旧は、アラーム → EventBridge → Systems Manager Automation のランブック",
      "大量のインスタンスのパッチは Patch Manager（パッチポリシーかメンテナンスウィンドウ）",
      "決まった時刻の急増と遅い起動は予測スケーリングかスケジュール＋ウォームプール。SQS のワーカーはインスタンスあたりの滞留でスケール",
      "ALB で不健全なインスタンスを入れ替えるには、Auto Scaling で ELB のヘルスチェックを有効にする",
    ],
    traps: ["CPU の使用率で SQS のワーカーをスケールする"],
  },
};
