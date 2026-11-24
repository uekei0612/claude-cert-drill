/* 分野 3：コストを最適化したアーキテクチャの設計（自作問題） */
import type { Question } from "../../../core/exam/types";

export const d3: Question[] = [
  {
    id: "d3-01",
    tasks: ["3.3"],
    stem: "Finance wants monthly costs broken down by cost center across all accounts in the organization. Today, many resources are created without a CostCenter tag. The company wants accurate reports going forward. What should the solutions architect do?",
    options: [
      {
        text: "Ask each team to add tags manually and review the bill at the end of each month for untagged resources.",
        why: "強制が無いので漏れは続く。月末の見直しでは過去のコストを正しく分けられない。",
      },
      {
        text: "Define a tag policy for CostCenter values, require the tag at creation with SCP conditions, and activate CostCenter as a cost allocation tag in the management account.",
        why: "正解。タグポリシーで値をそろえ、SCP で付け忘れを防ぎ、コスト配分タグを有効にすると請求データにタグごとの列が出る（有効にした時点から。管理アカウントは 12 か月までさかのぼるバックフィルも頼める）。タグポリシーだけではタグの無いリソースは止められない。",
      },
      {
        text: "Create one Amazon CloudWatch dashboard per cost center that sums the EstimatedCharges metric.",
        why: "EstimatedCharges はアカウントやサービス単位の見積もりで、コストセンター別には分けられない。",
      },
      {
        text: "Move each cost center's resources into separate AWS Regions so that the bill can be split by Region.",
        why: "リージョンは遅延や規制で選ぶもので、コストの分け方のために使うと設計が歪む。",
      },
    ],
    answer: 1,
    point: "コスト配分はタグポリシー（値）＋SCP（必須化）＋コスト配分タグの有効化（管理アカウント）",
  },
  {
    id: "d3-02",
    tasks: ["3.3"],
    stem: "A company was surprised by a large bill after a developer accidentally left a fleet of GPU instances running. Spending patterns differ widely between services and accounts, so setting a fixed threshold for each one is impractical. The company wants to be alerted within a day of unusual spending. What should it use?",
    options: [
      {
        text: "An AWS Budgets budget with a single fixed amount for the whole organization and an email alert when actual spend reaches 100% of the budget",
        why: "全体の予算を超えるまで気付かず、1 つのアカウントの異常は全体に埋もれる。固定額の運用を避けたいという要件にも合わない。",
      },
      {
        text: "A monthly review of the Cost and Usage Report by the finance team",
        why: "月 1 回では「1 日以内に気付く」に間に合わない。",
      },
      {
        text: "AWS Cost Anomaly Detection with monitors for services and linked accounts and a daily alert subscription",
        why: "正解。Cost Anomaly Detection は機械学習で普段の傾向を学び、しきい値を決めずに異常な支出を見つけて知らせる。",
      },
      {
        text: "Amazon CloudWatch alarms on the CPUUtilization metric of every instance",
        why: "使用率はコストの異常を表さない。動かしっぱなしで使用率が高くても、正当な処理と区別できない。",
      },
    ],
    answer: 2,
    point: "しきい値を決めずに異常な支出を見つける＝Cost Anomaly Detection。Budgets は決めた額との比較",
  },
  {
    id: "d3-03",
    tasks: ["3.3"],
    stem: "A FinOps team needs to run detailed SQL queries over hourly, resource-level cost and usage data for all accounts, joined with the company's own tag and project data. Which solution should the solutions architect recommend?",
    options: [
      {
        text: "Download the monthly invoice PDF from the Billing console and load it into a spreadsheet.",
        why: "請求書は月とサービスの粒度で、リソース単位・時間単位のデータは無い。SQL で結合もできない。",
      },
      {
        text: "Use the Cost Explorer filters and save a report for each project.",
        why: "Cost Explorer は手早く見るには向くが、自社のデータとの結合や自由な SQL はできない。",
      },
      {
        text: "Turn on AWS Trusted Advisor cost optimization checks in every account.",
        why: "Trusted Advisor は節約の候補を挙げるもので、コストと使用量の明細を分析する道具ではない。",
      },
      {
        text: "Create a CUR 2.0 data export with resource IDs and hourly granularity in the management account, deliver it to S3 in Parquet format, and query it with Amazon Athena.",
        why: "正解。CUR は最も細かいコストと使用量のデータ（リソース ID・時間単位・タグ列）。S3 に置けば Athena で他のデータと結合して SQL を流せる。",
      },
    ],
    answer: 3,
    point: "最も細かいコスト分析＝CUR（データエクスポート）を S3 に置き Athena で SQL",
  },
  {
    id: "d3-04",
    tasks: ["3.1"],
    stem: "A company with 400 EC2 instances across 30 accounts suspects that many instances are oversized. It wants recommendations for each instance that are based on observed CPU and memory utilization, gathered centrally for the whole organization. What should it do?",
    options: [
      {
        text: "Opt in to AWS Compute Optimizer for the organization and install the CloudWatch agent to publish memory metrics.",
        why: "正解。Compute Optimizer は使用率の履歴から適正なサイズを推奨し、組織全体をまとめて見られる。メモリは CloudWatch エージェントで送ると推奨に使われる。",
      },
      {
        text: "Review two weeks of the CPUUtilization metric for each instance in the CloudWatch console and downsize instances that average under 10%.",
        why: "400 台を手で見るのは重く、メモリも見ていない。CPU だけで小さくするとメモリ不足を起こしうる。",
      },
      {
        text: "Purchase Savings Plans for the current usage so that oversized instances cost less.",
        why: "大きすぎるまま割引を約束すると、無駄を固定してしまう。先にサイズを合わせてから買う。",
      },
      {
        text: "Enable detailed monitoring on every instance to get one-minute metrics.",
        why: "メトリクスの粒度が上がるだけで推奨は出ない。メモリも取れない。",
      },
    ],
    answer: 0,
    point: "使用率に基づく適正サイズの推奨＝Compute Optimizer（組織でオプトイン、メモリは CloudWatch エージェント）",
  },
  {
    id: "d3-05",
    tasks: ["3.1"],
    stem: "A media company transcodes video files in a batch process that can be interrupted and restarted from checkpoints. Jobs must finish within 24 hours, and the company wants the lowest compute cost. Which approach should be used?",
    options: [
      {
        text: "Purchase Standard Reserved Instances for the peak number of instances.",
        why: "常に使うわけではないバッチに 1〜3 年の約束をすると、使わない時間も払うことになる。",
      },
      {
        text: "Use On-Demand Instances and stop them when the queue is empty.",
        why: "無駄は出ないが、中断に強い処理ならスポットのほうがずっと安い。",
      },
      {
        text: "Use Spot Instances across multiple instance types and Availability Zones with the price-capacity-optimized allocation strategy.",
        why: "正解。中断から再開でき、締め切りに余裕のある処理はスポットに向く。種類と AZ を広げ、空きの多いプールから取ると中断が減る。",
      },
      {
        text: "Use Dedicated Hosts so that capacity is always available.",
        why: "ライセンスや規制のための選択で、最も高い部類になる。",
      },
    ],
    answer: 2,
    point: "中断に強いバッチ＝スポット（タイプと AZ を広げ、price-capacity-optimized）",
  },
  {
    id: "d3-06",
    tasks: ["3.4"],
    stem: "A company stores millions of objects in S3. Some objects are read frequently for months, others are never read again after upload, and the access pattern cannot be predicted per object. The company wants to reduce storage costs without paying retrieval fees or managing lifecycle rules per prefix. Which storage class should it use?",
    options: [
      {
        text: "S3 Intelligent-Tiering",
        why: "正解。アクセスの傾向を見てオブジェクトごとに自動で階層を移し、取り出しの料金がかからない（小さな監視料金はある）。傾向が読めないデータ向け。",
      },
      {
        text: "S3 Standard-Infrequent Access for all objects",
        why: "頻繁に読まれるオブジェクトに取り出しの料金がかかり、かえって高くなりうる。",
      },
      {
        text: "S3 Glacier Deep Archive for all objects",
        why: "取り出しに何時間もかかり料金もかかる。頻繁に読まれるオブジェクトには使えない。",
      },
      {
        text: "S3 One Zone-Infrequent Access with a lifecycle rule after 30 days",
        why: "1 つの AZ にしか保存されず、取り出しの料金もかかる。ルールの管理も残る。",
      },
    ],
    answer: 0,
    point: "アクセスの傾向が読めない S3 のデータ＝Intelligent-Tiering（自動で階層を移し、取り出し料金なし）",
  },
  {
    id: "d3-07",
    tasks: ["3.1"],
    stem: "A company's steady baseline compute usage is spread across Amazon EC2 instances of several families, AWS Fargate tasks, and AWS Lambda functions, and teams change instance families and Regions frequently. The company wants to commit to a usage level for three years to get the largest discount that still covers all of these services. What should it buy?",
    options: [
      {
        text: "EC2 Instance Savings Plans for each instance family",
        why: "割引は大きいが、1 つのリージョンの 1 つのファミリーに固定され、Fargate と Lambda には効かない。",
      },
      {
        text: "Standard Reserved Instances in each Region",
        why: "EC2 の特定の条件だけに効く。Fargate と Lambda には使えず、ファミリーやリージョンの変更にも弱い。",
      },
      {
        text: "Spot Instances for the baseline workload",
        why: "スポットは中断されうるので、安定した基本の使用量には向かない。Fargate と Lambda の約束にもならない。",
      },
      {
        text: "Compute Savings Plans",
        why: "正解。Compute Savings Plans はファミリー・サイズ・リージョン・OS を問わず EC2 に効き、Fargate と Lambda にもかかる。",
      },
    ],
    answer: 3,
    point: "EC2・Fargate・Lambda にまたがる約束＝Compute Savings Plans（柔軟）。EC2 Instance SP は割引大だが固定",
  },
  {
    id: "d3-08",
    tasks: ["3.2"],
    stem: "EC2 instances in private subnets read and write several terabytes per day to Amazon S3 in the same Region through a NAT gateway. NAT gateway data processing charges have become a large part of the bill. What is the MOST cost-effective change?",
    options: [
      {
        text: "Replace the NAT gateway with a larger NAT instance.",
        why: "処理料金は減るが、インスタンスの費用と運用が増え、単一障害点にもなる。もっと安く確実な方法がある。",
      },
      {
        text: "Create a gateway VPC endpoint for Amazon S3 and add it to the private subnets' route tables.",
        why: "正解。S3 のゲートウェイエンドポイントは追加の料金がかからず、S3 への通信が NAT ゲートウェイを通らなくなる。",
      },
      {
        text: "Create an interface VPC endpoint for Amazon S3 in every Availability Zone and enable private DNS for it.",
        why: "NAT は通らなくなるが、エンドポイントの時間料金とデータ処理料金がかかる。同じリージョンの VPC からならゲートウェイ型のほうが安い。",
      },
      {
        text: "Move the instances to public subnets with public IP addresses.",
        why: "NAT は要らなくなるが、インスタンスをインターネットにさらすことになる。",
      },
    ],
    answer: 1,
    point: "VPC から同じリージョンの S3／DynamoDB へ＝無料のゲートウェイエンドポイントで NAT を通さない",
  },
  {
    id: "d3-09",
    tasks: ["3.4"],
    stem: "A database on EC2 uses a 500 GiB gp2 volume and is limited by its 1,500 baseline IOPS. The workload needs 6,000 IOPS but does not need more storage. What is the MOST cost-effective way to improve performance?",
    options: [
      {
        text: "Increase the gp2 volume to 2,000 GiB to get 6,000 baseline IOPS.",
        why: "gp2 の IOPS は容量に比例する（1 GiB あたり 3）。使わない容量に払うことになる。",
      },
      {
        text: "Migrate the volume to an io2 Block Express volume with 6,000 provisioned IOPS.",
        why: "性能は満たすが、io2 は IOPS ごとの料金が高い。この規模なら gp3 で足りる。",
      },
      {
        text: "Modify the volume to gp3 and provision 6,000 IOPS while keeping 500 GiB.",
        why: "正解。gp3 は容量と別に IOPS とスループットを決められ、基本の 3,000 IOPS から足した分だけ払う。ボリュームの変更は止めずに行える。",
      },
      {
        text: "Use an instance store volume and copy the data to it at boot.",
        why: "止めると消えるので、データベースの永続的な保存先にならない。",
      },
    ],
    answer: 2,
    point: "IOPS だけ増やしたい＝gp3（容量と別に IOPS とスループットを決める）。gp2 は容量に比例",
  },
  {
    id: "d3-10",
    tasks: ["3.2", "1.1"],
    stem: "A website serves product images, JavaScript, and CSS directly from a fleet of EC2 web servers in one Region. Users on other continents report slow page loads, and the web servers spend most of their CPU on serving static files. What should the solutions architect do?",
    options: [
      {
        text: "Add more EC2 web servers in the same Region.",
        why: "サーバーの負荷は分けられるが、遠い利用者までの距離の遅れは減らない。",
      },
      {
        text: "Move the static files to Amazon S3 and serve them through Amazon CloudFront, keeping dynamic requests on the web servers.",
        why: "正解。CloudFront は利用者に近いエッジでキャッシュして返すので遠くの利用者も速くなり、Web サーバーの負荷も下がる。",
      },
      {
        text: "Use larger instances with enhanced networking.",
        why: "サーバーの中は速くなっても、遠い利用者までの往復の遅れは変わらない。",
      },
      {
        text: "Copy the full application stack to every Region where users are located, route users with Route 53 latency records, and synchronize the static files hourly.",
        why: "静的ファイルのためだけにすべてのリージョンで動かすのは費用と運用が大きすぎる。",
      },
    ],
    answer: 1,
    point: "遠い利用者への静的ファイル＝S3＋CloudFront（エッジでキャッシュし、サーバーの負荷も下げる）",
  },
  {
    id: "d3-11",
    tasks: ["3.1"],
    stem: "Development and test environments in several accounts run EC2 instances and RDS databases 24 hours a day, but they are used only from 8 AM to 8 PM on weekdays. What is the simplest way to reduce their cost significantly?",
    options: [
      {
        text: "Buy three-year Reserved Instances for the development environments.",
        why: "使わない時間にも払う約束になる。止められるものは止めるほうが安い。",
      },
      {
        text: "Move the development environments to a cheaper Region.",
        why: "差は小さく、移す手間と遅延が増える。使わない時間に動いている無駄は残る。",
      },
      {
        text: "Stop the instances and databases outside working hours with a scheduler such as Instance Scheduler on AWS or EventBridge Scheduler.",
        why: "正解。週 168 時間のうち使うのは 60 時間なので、止めるだけで計算の費用を半分以上減らせる。",
      },
      {
        text: "Convert all development instances to Spot Instances.",
        why: "安くはなるが中断があり、データベースには使えない。使わない時間の無駄も残る。",
      },
    ],
    answer: 2,
    point: "使わない時間に動いている開発環境は、まず予定で止める（Instance Scheduler／EventBridge Scheduler）",
  },
  {
    id: "d3-12",
    tasks: ["3.4", "4.3"],
    stem: "An account has accumulated more than 50,000 EBS snapshots over several years because a script takes daily snapshots but never deletes them. The company needs to keep daily snapshots for 14 days and monthly snapshots for one year. What should the solutions architect do?",
    options: [
      {
        text: "Replace the script with Amazon Data Lifecycle Manager policies (or AWS Backup plans) that create and expire snapshots according to the retention rules, then delete the old snapshots outside the rules.",
        why: "正解。DLM や AWS Backup は保持期間を過ぎたスナップショットを自動で消す。溜まった分はルールの外のものを一度消す。",
      },
      {
        text: "Move all snapshots to the EBS Snapshots Archive tier and keep them forever.",
        why: "1 つあたりは安くなるが、要らないものを残し続ける。アーカイブは最低 90 日分の料金がかかり、戻すのにも時間がかかる。",
      },
      {
        text: "Delete all snapshots older than 14 days, including monthly ones.",
        why: "1 年残すべき毎月のスナップショットまで消してしまう。",
      },
      {
        text: "Copy the snapshots to Amazon S3 Glacier Deep Archive with a custom script.",
        why: "スナップショットは S3 のストレージクラスに直接写せない。自作の仕組みの保守も増える。",
      },
    ],
    answer: 0,
    point: "スナップショットの作成と期限切れの削除＝Data Lifecycle Manager／AWS Backup の保持ルール",
  },
  {
    id: "d3-13",
    tasks: ["3.1"],
    stem: "A company runs a large fleet of x86-based EC2 instances for stateless Java and Python services that are built in a CI pipeline. It wants to improve price performance by about 20% without changing the application architecture. What should the solutions architect recommend first?",
    options: [
      {
        text: "Move the services to Dedicated Instances.",
        why: "専有にする分だけ高くなり、価格性能は下がる。",
      },
      {
        text: "Rewrite the services in C++ for better performance.",
        why: "構成を変えないという条件に反し、手間と危険が大きい。",
      },
      {
        text: "Increase instance sizes so that fewer instances are needed.",
        why: "大きいインスタンスは台数あたりの料金も比例して上がり、価格性能はほぼ変わらない。",
      },
      {
        text: "Build arm64 images in the CI pipeline and move the services to AWS Graviton-based instances.",
        why: "正解。Java や Python などの多くの言語はそのまま arm64 で動き、Graviton は同等の x86 より価格性能が良い（AWS の案内では、同等の x86 のインスタンスより最大 20% 安い）。",
      },
    ],
    answer: 3,
    point: "構成を変えずに価格性能を上げる＝Graviton（arm64）への移行。インタープリタ型や JVM の言語は移しやすい",
  },
  {
    id: "d3-14",
    tasks: ["3.4"],
    stem: "CloudWatch Logs storage costs have grown sharply. Most log groups have the default retention setting, and logs older than 30 days are needed only for an annual compliance audit, where a retrieval time of several hours is acceptable. What should the solutions architect do?",
    options: [
      {
        text: "Delete all log groups older than 30 days.",
        why: "監査に要るログを失う。",
      },
      {
        text: "Disable logging in all applications.",
        why: "運用と監査に要る情報がなくなる。",
      },
      {
        text: "Set a 30-day retention on the log groups and export or stream older logs to Amazon S3 with a lifecycle rule to S3 Glacier Flexible Retrieval or Deep Archive.",
        why: "正解。既定の保持は「無期限」なので溜まり続ける。直近だけ CloudWatch Logs に残し、監査用は S3 の安い階層に置けば、数時間の取り出しで足りる。",
      },
      {
        text: "Move all logs to a larger CloudWatch Logs log group.",
        why: "ロググループに「大きさ」の区別は無く、保管の料金は変わらない。",
      },
    ],
    answer: 2,
    point: "CloudWatch Logs の既定の保持は無期限。保持を決め、古いものは S3（Glacier）へ",
  },
  {
    id: "d3-15",
    tasks: ["3.1", "1.2"],
    stem: "Every night, a company summarizes about two million support tickets with a foundation model on Amazon Bedrock. Results are needed by the next morning, and no user waits for an individual response. The company wants to reduce the inference cost as much as possible without changing the model. What should the solutions architect recommend?",
    options: [
      {
        text: "Buy provisioned throughput sized for the nightly peak and keep it for a month.",
        why: "常に使うほどの量でなければ、昼間の使わない時間にも払うことになる。",
      },
      {
        text: "Submit the tickets as Amazon Bedrock batch inference jobs.",
        why: "正解。急がない大量の処理はバッチ推論に向き、対応するモデルではオンデマンド（Standard）より 50% 安い。結果は S3 に書かれる。",
      },
      {
        text: "Send all two million requests to the on-demand API in parallel as fast as possible from a large fleet of EC2 instances.",
        why: "単価は変わらず、上限にも当たりやすい。送る側のインスタンスの費用も増える。",
      },
      {
        text: "Translate each ticket into English first so that the model processes fewer tokens.",
        why: "訳すための処理が増え、意味も変わりうる。費用を下げる確かな方法ではない。",
      },
    ],
    answer: 1,
    point: "急がない大量の生成 AI の処理＝Bedrock のバッチ推論（対応モデルでオンデマンドより 50% 安い）",
  },
  {
    id: "d3-16",
    tasks: ["3.2", "1.4"],
    stem: "Two VPCs in the same Region exchange about 400 TB of data per month between application servers in the same Availability Zone. Both VPCs are attached to a transit gateway, and transit gateway data processing charges are now a large part of the bill. The VPCs do not need transitive routing to each other's other networks. What is the MOST cost-effective change?",
    options: [
      {
        text: "Add a second transit gateway to split the traffic.",
        why: "どちらのトランジットゲートウェイを通ってもデータ処理料金がかかる。",
      },
      {
        text: "Route the traffic through a NAT gateway in each VPC.",
        why: "NAT ゲートウェイにもデータ処理料金がかかり、私的な VPC 間の通信の道でもない。",
      },
      {
        text: "Expose every application server through its own PrivateLink endpoint service and create interface endpoints for each one in the other VPC.",
        why: "インターフェイスエンドポイントには時間料金とデータ処理料金がかかり、大量の双方向の通信には向かない。",
      },
      {
        text: "Create a VPC peering connection between the two VPCs for this traffic and keep the transit gateway for other connectivity.",
        why: "正解。VPC ピアリングにはデータ処理料金が無く、同じ AZ の中のピアリングの通信は無料。推移的な経路が要らない大量の 2 点間の通信に向く。",
      },
    ],
    answer: 3,
    point:
      "大量の 2 VPC 間の通信はピアリング（データ処理料金なし・同じ AZ は無料）。トランジットゲートウェイは GB ごとに処理料金",
  },
];
