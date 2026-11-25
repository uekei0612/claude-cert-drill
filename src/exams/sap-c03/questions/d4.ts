/* 分野 4：回復性・移行・事業継続（自作問題） */
import type { Question } from "../../../core/exam/types";

export const d4: Question[] = [
  {
    id: "d4-01",
    tasks: ["4.2", "1.4"],
    stem: "A company runs a web application behind an Application Load Balancer in us-east-1 and keeps a scaled-down copy in us-west-2. When the primary Region becomes unhealthy, users must be sent to us-west-2 automatically within a few minutes. Which approach meets this requirement?",
    options: [
      {
        text: "Create Route 53 failover records with the primary ALB as primary and the us-west-2 ALB as secondary, and attach a health check to the primary record.",
        why: "正解。フェイルオーバールーティングは、ヘルスチェックが失敗したときだけセカンダリを返す。TTL を短くしておけば数分で切り替わる。",
      },
      {
        text: "Register the instances from both Regions as IP targets of the primary ALB so that its own health checks detect the failure and it sends traffic only to the healthy Region.",
        why: "ALB はリージョンのサービスで、主のリージョンが落ちれば ALB ごと使えない。リージョンをまたぐ切り替えには使えない。",
      },
      {
        text: "Use Route 53 latency-based routing for both ALBs without health checks so that users reach the closest Region.",
        why: "ヘルスチェックが無いと、不健全なリージョンにも送り続ける。切り替えの仕組みになっていない。",
      },
      {
        text: "Enable Multi-AZ on the ALB in us-east-1 and add instances in a third Availability Zone.",
        why: "AZ の故障には強くなるが、リージョン全体の問題には効かない。要件はリージョン間の切り替え。",
      },
    ],
    answer: 0,
    point:
      "リージョン間の自動切り替えは Route 53 フェイルオーバールーティング＋ヘルスチェック。ALB はリージョンの中で閉じる",
  },
  {
    id: "d4-02",
    tasks: ["4.2"],
    stem: "A company runs 80 critical servers on premises. It needs a disaster recovery site on AWS with an RPO of seconds and an RTO of minutes, while keeping the cost of the standby environment low. What should the solutions architect recommend?",
    options: [
      {
        text: "Take nightly backups to Amazon S3 and rebuild the servers from the backups when a disaster occurs.",
        why: "RPO が最大 1 日になり、作り直しに何時間もかかる。秒と分の要件を満たさない。",
      },
      {
        text: "Run a full copy of all 80 servers on EC2 at all times and keep them continuously synchronized with application-level replication so that only DNS needs to change.",
        why: "マルチサイト構成で RTO は短いが、待機環境の費用が本番と同じになる。",
      },
      {
        text: "Use AWS Elastic Disaster Recovery to replicate the servers continuously to a low-cost staging area and launch recovery instances during a disaster.",
        why: "正解。DRS はブロックレベルで継続的に複製するので RPO は秒単位。普段は軽いステージングだけで、起動は分単位。",
      },
      {
        text: "Use AWS Storage Gateway in cached volume mode so that data is stored in AWS.",
        why: "データは AWS に置けても、サーバーを起動する仕組みが無く、RTO の要件を満たさない。",
      },
    ],
    answer: 2,
    point: "RPO 秒・RTO 分・待機は安く＝Elastic Disaster Recovery（継続的なブロック複製＋ステージング）",
  },
  {
    id: "d4-03",
    tasks: ["4.2"],
    stem: "An internal reporting application has an RTO of 24 hours and an RPO of 12 hours. Management wants protection against a Regional outage at the lowest possible cost. Which disaster recovery strategy is MOST appropriate?",
    options: [
      {
        text: "Warm standby with a scaled-down copy of the application always running in a second Region",
        why: "RTO を分単位にしたいときの方式で、常に動かす費用がかかる。24 時間の RTO には過剰。",
      },
      {
        text: "Backup and restore, using AWS Backup to copy backups to a second Region at least every 12 hours",
        why: "正解。最も安い方式で、RTO が時間単位・RPO がバックアップの間隔で足りるときに選ぶ。12 時間ごとの写しで RPO を満たす。",
      },
      {
        text: "Multi-site active/active deployments in two Regions behind Route 53",
        why: "最も高価な方式で、ほぼゼロの RTO が必要なときのもの。",
      },
      {
        text: "Pilot light with a continuously replicated database and stopped application servers in a second Region",
        why: "バックアップと復元より RTO・RPO は短いが、複製したデータベースを常に動かす費用がかかる。要件に対して最安ではない。",
      },
    ],
    answer: 1,
    point: "DR の 4 方式は費用と RTO/RPO の交換：バックアップ復元＜パイロットライト＜ウォームスタンバイ＜マルチサイト",
  },
  {
    id: "d4-04",
    tasks: ["4.3", "2.3"],
    stem: "Auditors require that backups of Amazon EBS, Amazon RDS, and Amazon DynamoDB in all 50 accounts follow a consistent schedule, are copied to another Region, and cannot be deleted by anyone, including account administrators, before the retention period ends. What should the solutions architect implement?",
    options: [
      {
        text: "A Lambda function in each account that creates snapshots on a schedule and tags them with an expiry date",
        why: "アカウントの管理者は関数もスナップショットも消せる。50 アカウントでの保守も重い。",
      },
      {
        text: "Enabling S3 Versioning on all buckets and relying on it for database recovery",
        why: "バージョニングは S3 のオブジェクトのもので、EBS・RDS・DynamoDB は守れない。",
      },
      {
        text: "Manual snapshots taken by each team before each release",
        why: "予定がそろわず、削除も防げない。",
      },
      {
        text: "AWS Backup policies in AWS Organizations with cross-Region copy rules, and backup vaults protected by AWS Backup Vault Lock in compliance mode",
        why: "正解。バックアップポリシーで全アカウントの予定をそろえ、コピーのルールで別のリージョンに写す。compliance モードの Vault Lock は、管理者やルートユーザーでも保持期間中の削除ができない。",
      },
    ],
    answer: 3,
    point:
      "組織全体のバックアップ＝AWS Backup ポリシー（Organizations）＋リージョン間コピー＋Vault Lock（compliance で削除不可）",
  },
  {
    id: "d4-05",
    tasks: ["4.2", "1.5"],
    stem: "A payment application uses Amazon Aurora PostgreSQL. The business requires that if the primary Region fails, the database can be recovered in another Region with an RPO measured in seconds and an RTO of a few minutes. Which solution meets these requirements?",
    options: [
      {
        text: "Copy automated snapshots to the second Region every hour.",
        why: "RPO が最大 1 時間になり、スナップショットからの復元には分ではなく長い時間がかかる。",
      },
      {
        text: "Enable Multi-AZ for the Aurora cluster by adding a replica in another Availability Zone.",
        why: "AZ の故障には強いが、同じリージョンの中だけ。リージョンの故障には効かない。",
      },
      {
        text: "Use an Amazon Aurora global database with a secondary cluster in the second Region and fail over to it when needed.",
        why: "正解。グローバルデータベースはストレージの層の専用の仕組みで複製し、遅延は通常 1 秒未満なので RPO は秒単位。副クラスターへの管理された切り替えは通常数分で済む。",
      },
      {
        text: "Export the database to Amazon S3 with pg_dump every 15 minutes and replicate the bucket to the second Region with S3 Replication Time Control.",
        why: "RPO が 15 分になり、ダンプからの復元は 1 分では終わらない。",
      },
    ],
    answer: 2,
    point:
      "Aurora のリージョン間 DR で RPO 秒単位・RTO 数分＝Aurora グローバルデータベース（複製の遅延は通常 1 秒未満）",
  },
  {
    id: "d4-06",
    tasks: ["4.3", "3.2"],
    stem: "Instances in private subnets in three Availability Zones reach the internet through a single NAT gateway in one Availability Zone. During an outage of that Availability Zone, instances in the healthy zones also lost internet access. How should the design be changed?",
    options: [
      {
        text: "Replace the NAT gateway with a NAT instance in an Auto Scaling group of one instance, with a custom script that updates the route tables whenever it is replaced.",
        why: "やはり 1 つの AZ に頼り、作り直しの間は止まる。運用の手間も増える。",
      },
      {
        text: "Attach an internet gateway directly to the private subnets.",
        why: "インターネットゲートウェイは VPC に付けるもので、プライベートなインスタンスは公開 IP が無いので出られない。プライベートの意味もなくなる。",
      },
      {
        text: "Increase the bandwidth of the existing NAT gateway.",
        why: "帯域は自動で伸びる。問題は AZ を 1 つに頼っていることで、帯域では直らない。",
      },
      {
        text: "Use a regional NAT gateway, which expands across Availability Zones automatically, or create a zonal NAT gateway in each zone with a route table per zone.",
        why: "正解。ゾーンの NAT ゲートウェイは 1 つの AZ の中で冗長なだけ。リージョン NAT ゲートウェイは AZ をまたいで自動で広がる。ゾーンのものを使うなら AZ ごとに置いて同じ AZ のものへ向ければ、1 つの AZ の障害が他に広がらない（AZ 間の通信料も減る）。",
      },
    ],
    answer: 3,
    point:
      "NAT ゲートウェイを 1 つの AZ に頼らない：リージョン NAT ゲートウェイか、ゾーンの NAT ゲートウェイを AZ ごとに置いて同じ AZ のものへ向ける",
  },
  {
    id: "d4-07",
    tasks: ["4.3"],
    stem: "A production application uses a Single-AZ Amazon RDS for MySQL instance. During a recent hardware failure, the database was unavailable for 40 minutes. The company wants automatic failover to a standby within minutes and no data loss, with minimal application changes. What should it do?",
    options: [
      {
        text: "Create a read replica in another Availability Zone and promote it manually when the primary fails.",
        why: "非同期の複製なので直近のデータを失いうる上に、手で昇格させ接続先を変えるので時間もかかる。",
      },
      {
        text: "Take automated snapshots every five minutes and restore from the latest one.",
        why: "復元は新しいインスタンスを作るので時間がかかり、直近の数分のデータも失いうる。自動の切り替えにならない。",
      },
      {
        text: "Run a second RDS instance and use a script to copy data every minute.",
        why: "最大 1 分のデータを失いうる上に、自作の同期と切り替えは壊れやすい。",
      },
      {
        text: "Convert the instance to a Multi-AZ deployment.",
        why: "正解。マルチ AZ は別の AZ の待機系へ同期で複製し、故障時は DNS の名前を待機系に向けて自動で切り替える（通常 1〜2 分）。接続先の名前は変わらない。",
      },
    ],
    answer: 3,
    point: "RDS の自動切り替え・データを失わない＝マルチ AZ（同期の複製・DNS の切り替え）。リードレプリカは非同期",
  },
  {
    id: "d4-08",
    tasks: ["4.3"],
    stem: "A company believes its application can survive the loss of an Availability Zone and the failure of its database primary, but it has never tested this. It wants to run controlled experiments in a pre-production environment, with automatic stop conditions if alarms fire. Which service should be used?",
    options: [
      {
        text: "AWS Fault Injection Service with experiment templates and CloudWatch alarm stop conditions",
        why: "正解。FIS はインスタンスの停止・AZ の電源喪失の模擬・RDS の切り替えなどの障害を制御して注入し、アラームを停止条件にして実験を自動で止められる。",
      },
      {
        text: "AWS Trusted Advisor fault tolerance checks",
        why: "設定を点検するだけで、実際に障害を起こして振る舞いを確かめることはできない。",
      },
      {
        text: "Amazon CloudWatch Synthetics canaries",
        why: "外から利用者の操作を模して見張るもので、障害を注入する道具ではない（実験中の観測には使える）。",
      },
      {
        text: "Manually terminating random instances and failing over the database in production during business hours",
        why: "停止条件も範囲の制御も無く、利用者に影響が出る。まず本番前の環境で制御された実験をする。",
      },
    ],
    answer: 0,
    point: "障害の注入の実験（停止条件付き）＝AWS Fault Injection Service",
  },
  {
    id: "d4-09",
    tasks: ["4.1"],
    stem: "Executives want a data-driven business case for moving a data center to AWS within four weeks, including projected AWS costs based on actual server utilization and the effect of bringing existing Microsoft licenses. What should the solutions architect use?",
    options: [
      {
        text: "The AWS Pricing Calculator, with each of the servers entered at its current on-premises CPU and memory size and with license-included pricing for Windows",
        why: "今の大きさのままでは過大な見積もりになり、使用率に合わせた適正化もライセンスの分析も無い。",
      },
      {
        text: "AWS Cost Explorer forecasts",
        why: "すでに AWS で使っている費用の予測で、まだ移していないサーバーの見積もりはできない。",
      },
      {
        text: "Migration Evaluator, which collects on-premises utilization data and produces a business case with right-sized recommendations and licensing options",
        why: "正解。Migration Evaluator は実測に基づいて適正なサイズの費用を見積もり、ライセンスの持ち込みの効果も含めた移行の根拠を作る。",
      },
      {
        text: "AWS Compute Optimizer recommendations for the on-premises servers",
        why: "Compute Optimizer は AWS の上で動いているリソースのためのもの。",
      },
    ],
    answer: 2,
    point: "移行の根拠（実測に基づく費用・ライセンス）＝Migration Evaluator",
  },
  {
    id: "d4-10",
    tasks: ["4.1"],
    stem: "During portfolio assessment, a company finds an on-premises HR application that it customized heavily years ago. A commercial SaaS HR product now covers all of its required features, and the company wants to stop maintaining the application. Which migration strategy applies?",
    options: [
      {
        text: "Rehost: move the application unchanged to EC2",
        why: "保守の負担はそのまま残る。やめたいという方針に合わない。",
      },
      {
        text: "Repurchase: replace the application with the SaaS product",
        why: "正解。既製の製品（多くは SaaS）に乗り換えるのがリパーチェス。自社で保守するものがなくなる。",
      },
      {
        text: "Retain: keep the application on premises for now",
        why: "移さない理由（依存関係や最近の投資など）があるときの選択で、この状況には合わない。",
      },
      {
        text: "Refactor: rewrite the application as cloud-native microservices on AWS",
        why: "既製の製品で足りるのに、作り直しと保守を抱えることになる。",
      },
    ],
    answer: 1,
    point: "7 つの R：既製品（SaaS）に乗り換える＝リパーチェス。要らないものはリタイア、残すのはリテイン",
  },
  {
    id: "d4-11",
    tasks: ["4.1"],
    stem: "A company is choosing the first application to migrate to AWS in order to build team experience and prove the migration process. Which candidate is the BEST choice for the first wave?",
    options: [
      {
        text: "The core ERP system, because it will deliver the largest savings",
        why: "依存関係が多く、失敗したときの影響も大きい。経験の無い最初の移行には向かない。",
      },
      {
        text: "The application with the most dependencies, so that all problems are found early",
        why: "問題が一度に出すぎて、進め方を確かめるどころではなくなる。",
      },
      {
        text: "A mainframe batch system that has no documentation",
        why: "最も難しい部類で、最初に選ぶと経験を積む前に行き詰まる。",
      },
      {
        text: "An internal application with few dependencies and low business risk that still exercises the standard migration tooling",
        why: "正解。最初は小さく安全な対象で道具と手順を確かめ、学んだことを次のウェーブに生かす。",
      },
    ],
    answer: 3,
    point: "最初のウェーブは依存関係が少なく危険の小さいもの。進め方を確かめて次に生かす",
  },
  {
    id: "d4-12",
    tasks: ["4.1"],
    stem: "A company wants to migrate a 5 TB on-premises Oracle database to Amazon Aurora PostgreSQL. The application can tolerate only a few minutes of downtime during cutover. Which approach should the solutions architect recommend?",
    options: [
      {
        text: "Export the database with Oracle Data Pump, copy the files to S3, and import them into Aurora PostgreSQL over a weekend.",
        why: "Data Pump の形式は PostgreSQL に読み込めない。書き出しから読み込みまで止めるので、数分では済まない。",
      },
      {
        text: "Use AWS Transform MGN to replicate the database server to EC2.",
        why: "サーバーをそのまま移すだけで、Oracle から PostgreSQL への変換にはならない。",
      },
      {
        text: "Create Aurora PostgreSQL read replicas of the on-premises Oracle database.",
        why: "エンジンの違うデータベースのリードレプリカは作れない。",
      },
      {
        text: "Convert the schema and code with AWS Schema Conversion Tool (or DMS Schema Conversion), then use AWS DMS for a full load followed by ongoing change data capture until cutover.",
        why: "正解。エンジンが変わる移行は、スキーマを変換してから DMS で全件と変更分（CDC）を移す。追いついたところで短時間で切り替えられる。",
      },
    ],
    answer: 3,
    point: "異なるエンジンへの短時間停止の移行＝SCT（スキーマ変換）＋DMS（全件＋CDC）",
  },
  {
    id: "d4-13",
    tasks: ["4.1"],
    stem: "A company needs to rehost 300 Windows and Linux servers from its data center to AWS as quickly as possible, with minimal changes and a cutover window of under one hour per application. Which service should be used?",
    options: [
      {
        text: "AWS Transform MGN (previously AWS Application Migration Service)",
        why: "正解。MGN はサーバーをブロックレベルで継続的に複製し、テスト用の起動と短い切り替え（通常数分）ができる。リホストの主な道具。",
      },
      {
        text: "AWS Database Migration Service",
        why: "データベースのデータを移すためのもので、サーバーそのものは移さない。",
      },
      {
        text: "Importing each server's disk with VM Import/Export after shutting it down",
        why: "止めて丸ごと写すので、大きなディスクでは 1 時間の切り替えに収まらない。300 台を回す仕組みも無い。",
      },
      {
        text: "AWS DataSync for each server's file system",
        why: "ファイルを写すだけで、OS やアプリケーションごと起動できるサーバーにはならない。",
      },
    ],
    answer: 0,
    point: "多数のサーバーのリホスト＝AWS Transform MGN（継続的な複製・テスト起動・短い切り替え）",
  },
  {
    id: "d4-14",
    tasks: ["4.1", "1.3"],
    stem: "A company must move 200 TB from an on-premises NFS file server to Amazon EFS over a 10 Gbps Direct Connect link. It wants scheduled transfers, automatic integrity verification, bandwidth throttling during business hours, and incremental syncs until cutover. Which service meets these requirements?",
    options: [
      {
        text: "rsync run from a cron job on a Linux server that mounts both file systems",
        why: "動くが、並列化・整合性の確認・失敗時の再試行・帯域の制御をすべて自前で作り込むことになる。",
      },
      {
        text: "AWS Transfer Family with an SFTP endpoint",
        why: "Transfer Family は SFTP・FTPS などで外部の相手とファイルをやり取りする入口で、NFS のファイルサーバーから EFS へ予定・確認・差分の同期をしながら移す道具ではない。",
      },
      {
        text: "AWS DataSync with an agent on premises and a scheduled task",
        why: "正解。DataSync は NFS・SMB と S3・EFS・FSx の間で、並列の転送・整合性の確認・帯域の制限・予定・差分の転送を備える。",
      },
      {
        text: "AWS Storage Gateway Volume Gateway",
        why: "ブロックのボリュームを AWS に置くためのもので、NFS から EFS への移行の道具ではない。",
      },
    ],
    answer: 2,
    point: "オンラインでのファイルの移行（予定・確認・帯域制限・差分）＝DataSync",
  },
  {
    id: "d4-15",
    tasks: ["4.1"],
    stem: "A company is moving a monolithic Java application from on-premises VMs to AWS. It has already containerized the application and wants to stop managing servers, operating system patches, and cluster capacity. Which platform should it use?",
    options: [
      {
        text: "Self-managed Kubernetes on EC2 instances",
        why: "コントロールプレーンもノードも自分で管理し、要件と逆になる。",
      },
      {
        text: "Amazon ECS with the EC2 launch type",
        why: "コンテナインスタンスのパッチと容量の管理が残る。",
      },
      {
        text: "Amazon ECS on AWS Fargate",
        why: "正解。Fargate はサーバーを持たずにコンテナを動かす。OS のパッチやクラスターの容量は AWS が管理し、タスクごとに CPU とメモリを決めるだけ。",
      },
      {
        text: "A single large EC2 instance running Docker",
        why: "サーバーの管理がそのまま残り、単一障害点にもなる。",
      },
    ],
    answer: 2,
    point: "サーバー・パッチ・容量を管理せずにコンテナ＝ECS（または EKS）on Fargate",
  },
  {
    id: "d4-16",
    tasks: ["4.1", "1.5"],
    stem: "A company runs an on-premises Hadoop cluster whose storage and compute must be scaled together, so the cluster is sized for peak storage and is idle most nights. The company wants to move to AWS and pay for compute only while jobs run. Which architecture should be used?",
    options: [
      {
        text: "A persistent Amazon EMR cluster with HDFS on large EBS volumes sized for all data, with managed scaling for the task nodes",
        why: "タスクノードは増減しても、HDFS を持つコアノードは全データ分を常に動かすので、保存と計算が結び付いたまま遊んでいる時間にも払い続ける。",
      },
      {
        text: "Self-managed Hadoop on EC2 instances that mirror the on-premises cluster",
        why: "同じ問題をそのまま持ち込み、管理の手間も残る。",
      },
      {
        text: "An Amazon Redshift cluster sized for peak storage",
        why: "Hadoop のジョブ（Spark・Hive など）をそのまま動かす基盤ではなく、やはり常に動かすことになる。",
      },
      {
        text: "Store the data in Amazon S3 and run transient Amazon EMR clusters (or EMR Serverless) that read from S3 for each job",
        why: "正解。S3 に置けば保存と計算を切り離せる。計算はジョブの間だけ立ち上げ、終われば消すので、遊んでいる時間に払わない。",
      },
    ],
    answer: 3,
    point: "Hadoop の移行は保存（S3）と計算（一時的な EMR／EMR Serverless）を切り離す",
  },
  {
    id: "d4-17",
    tasks: ["4.1"],
    stem: "A company wants to break a large monolithic web application into microservices incrementally. Users must keep using a single endpoint, and each new microservice should take over specific URL paths from the monolith one at a time, with the ability to roll back. Which approach should be used?",
    options: [
      {
        text: "Rewrite the entire application as microservices and switch over in a single release.",
        why: "大きな一度の切り替えは危険が大きく、少しずつ・戻せるという要件に合わない。",
      },
      {
        text: "Apply the strangler fig pattern: put a routing layer (for example Amazon API Gateway or an Application Load Balancer) in front of the monolith and route paths to new services as they are ready.",
        why: "正解。入口は変えずに、振り分けの規則でパスを 1 つずつ新しいサービスに移す。問題があれば規則を戻せる。",
      },
      {
        text: "Give each microservice its own domain name and update the client to call each one directly.",
        why: "入口が 1 つでなくなり、クライアントの変更と、戻すときの手間が増える。",
      },
      {
        text: "Run the monolith in containers and call it microservices.",
        why: "動かす場所が変わるだけで、分割にはなっていない。",
      },
    ],
    answer: 1,
    point: "一枚岩を少しずつ分ける＝ストラングラーフィグ（入口の前の振り分けでパスごとに移す）",
  },
  {
    id: "d4-18",
    tasks: ["4.1", "1.1"],
    stem: "Dozens of scheduled scripts (each running for less than five minutes) run from cron on two always-on EC2 instances. If an instance fails, jobs are silently skipped. The company wants to reduce cost and operational effort and get retries and visibility for failed runs. What should the solutions architect recommend?",
    options: [
      {
        text: "Move the scripts to AWS Lambda functions invoked by Amazon EventBridge Scheduler schedules, with retry policies and a dead-letter queue.",
        why: "正解。サーバーを持たずに予定どおり動かせ、動いた時間だけ払う。失敗は再試行され、それでも失敗したものは DLQ とメトリクスで分かる。",
      },
      {
        text: "Add a third EC2 instance and run cron on all of them.",
        why: "ジョブが重複して動き、費用も増える。失敗の見える化にもならない。",
      },
      {
        text: "Move the instances to larger instance types.",
        why: "故障の問題は変わらず、費用だけが増える。",
      },
      {
        text: "Convert the instances to Spot Instances to reduce cost.",
        why: "中断のたびにジョブが飛ばされ、信頼性がさらに下がる。",
      },
    ],
    answer: 0,
    point: "短い定期ジョブ＝EventBridge Scheduler＋Lambda（再試行・DLQ）。常時稼働の cron サーバーをやめる",
  },
  {
    id: "d4-19",
    tasks: ["4.1", "3.4"],
    stem: "A company runs a self-managed MySQL database on EC2. Load is unpredictable: near zero overnight and spiking to 20 times normal during campaigns. The DBA team spends much of its time on patching, backups, and resizing. Which option modernizes the database with the LEAST operational effort while matching capacity to the load?",
    options: [
      {
        text: "Move to a larger EC2 instance sized for the campaign peak.",
        why: "ほとんどの時間を遊ばせて払い続け、パッチやバックアップの手間も残る。",
      },
      {
        text: "Migrate to Amazon RDS for MySQL with a fixed instance size and manually resize before each campaign.",
        why: "パッチとバックアップは楽になるが、読めない急増には手で追いつけず、変更のたびに短く止まる。",
      },
      {
        text: "Migrate to Amazon Aurora Serverless v2 (MySQL-compatible).",
        why: "正解。Aurora Serverless v2 は負荷に合わせて容量を細かく自動で増減し、パッチ・バックアップ・複製は AWS が管理する。",
      },
      {
        text: "Rewrite the application to use Amazon DynamoDB.",
        why: "リレーショナルなアプリケーションの大きな作り直しになり、手間が最も大きい。",
      },
    ],
    answer: 2,
    point: "読めない負荷の MySQL を手間なく＝Aurora Serverless v2（容量の自動増減＋マネージド）",
  },
];
