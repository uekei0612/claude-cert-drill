/* 分野 1：クラウド向けのアーキテクチャの設計と実装（自作問題） */
import type { Question } from "../../../core/exam/types";

export const d1: Question[] = [
  {
    id: "d1-01",
    tasks: ["1.3", "1.4"],
    stem: "A company has 60 VPCs spread across 15 AWS accounts in two Regions. Every VPC must reach the on-premises data center over an existing AWS Direct Connect connection, and many VPCs must also reach each other. The network team wants to stop managing a growing mesh of peering connections. Which design meets these requirements with the LEAST operational overhead?",
    options: [
      {
        text: "Create a full mesh of VPC peering connections between all VPCs in both Regions, and add a separate private virtual interface on the Direct Connect connection for each VPC so that every VPC has its own path on premises.",
        why: "ピアリングは推移的にルーティングできないので総当たりが要り、60 VPC では接続が約 1,800 本になる。仮想インターフェイスの数にも上限があり、まさにやめたい運用そのもの。",
      },
      {
        text: "Attach every VPC to a transit gateway in each Region, share the transit gateways through AWS RAM, peer them, and connect them to a Direct Connect gateway with a transit virtual interface.",
        why: "正解。トランジットゲートウェイはハブとして VPC 間とオンプレミスへの経路をまとめる。RAM で他のアカウントに共有でき、DX ゲートウェイとはトランジット VIF でつなぐ。",
      },
      {
        text: "Create an AWS Site-to-Site VPN connection from every VPC to the on-premises router and route VPC-to-VPC traffic through the data center.",
        why: "VPN の本数が VPC の数だけ増え、VPC 間の通信がわざわざデータセンターを往復する。帯域も遅延も悪くなる。",
      },
      {
        text: "Expose each VPC's services through AWS PrivateLink endpoint services and create interface endpoints in every consuming VPC.",
        why: "PrivateLink はサービス単位の一方向の公開で、ネットワーク全体をつなぐものではない。オンプレミスへの経路の問題も解けない。",
      },
    ],
    answer: 1,
    point:
      "多数の VPC とオンプレミスをつなぐハブはトランジットゲートウェイ。DX とはトランジット VIF＋DX ゲートウェイ、アカウント間は RAM で共有",
  },
  {
    id: "d1-02",
    tasks: ["1.3"],
    stem: "Applications in several VPCs must resolve hostnames in the on-premises domain corp.example.com, and on-premises servers must resolve records in a Route 53 private hosted zone associated with those VPCs. Connectivity over Direct Connect is already in place. What should a solutions architect do?",
    options: [
      {
        text: "Copy the private hosted zone records into a public hosted zone so that on-premises DNS servers can resolve them over the internet.",
        why: "社内の名前を公開 DNS にさらすことになり、プライベートな名前空間の意味がなくなる。オンプレミスのドメインを VPC から引く側の問題も解けない。",
      },
      {
        text: "Run BIND on a pair of EC2 instances in each VPC, configure conditional forwarding between them and the on-premises DNS servers, and use a DHCP options set in every VPC to point every instance to them.",
        why: "動かすことはできるが、DNS サーバーの冗長化・パッチ・監視を自分で抱える。マネージドの Resolver エンドポイントがあるので運用の手間が大きい。",
      },
      {
        text: "Create Route 53 VPC Resolver (formerly Route 53 Resolver) inbound and outbound endpoints, add a forwarding rule for corp.example.com, and share the rule with the other VPCs through AWS RAM.",
        why: "正解。オンプレミスからの問い合わせはインバウンドエンドポイントで受け、VPC からオンプレミスのドメインへはアウトバウンドエンドポイントと転送ルールで送る。ルールは RAM で共有できる。",
      },
      {
        text: "Enable the DNS hostnames and DNS resolution attributes on every VPC; Route 53 then forwards unknown domains to on-premises automatically.",
        why: "これらの属性は VPC 内の名前解決を有効にするだけ。転送ルールが無ければオンプレミスのドメインは引けず、オンプレミスからの問い合わせも受けられない。",
      },
    ],
    answer: 2,
    point:
      "ハイブリッド DNS は Route 53 VPC Resolver（旧称 Route 53 Resolver）：オンプレ→AWS はインバウンド、AWS→オンプレはアウトバウンド＋転送ルール（RAM で共有）",
  },
  {
    id: "d1-03",
    tasks: ["1.4", "2.1"],
    stem: "A SaaS provider must offer its API privately to more than 300 customer VPCs. Many customers use the same CIDR ranges as the provider and as each other. Customers must not be able to reach any other resources in the provider's VPC. Which solution meets these requirements?",
    options: [
      {
        text: "Place the API behind a Network Load Balancer, publish it as an AWS PrivateLink endpoint service, and have each customer create an interface VPC endpoint.",
        why: "正解。PrivateLink は顧客の VPC 内の ENI からサービスへ一方向に届くだけなので、CIDR が重なっても使え、事業者の他のリソースには届かない。",
      },
      {
        text: "Create a VPC peering connection with each customer VPC and restrict access with security groups on the API instances.",
        why: "CIDR が重なる VPC 同士はピアリングできない。つながっても VPC 全体がルーティング可能になり、セキュリティグループ頼みになる。",
      },
      {
        text: "Attach all customer VPCs to a shared transit gateway in the provider's account, and use separate transit gateway route tables and attachments to isolate customers from each other and from the provider's other subnets.",
        why: "CIDR が重なると経路が衝突する。300 の外部組織をネットワークに直接つなぐのは境界の管理として重い。",
      },
      {
        text: "Expose the API through a public Application Load Balancer and allow only the customers' NAT gateway IP addresses in the security group.",
        why: "通信がインターネットを通るので「プライベートに提供」を満たさない。顧客の出口 IP の管理も続く。",
      },
    ],
    answer: 0,
    point:
      "CIDR が重なる多数の利用者へのサービス公開は PrivateLink（NLB＋エンドポイントサービス）。一方向で他のリソースに届かない",
  },
  {
    id: "d1-04",
    tasks: ["1.3", "4.3"],
    stem: "A financial company runs a critical trading workload that depends on a 10 Gbps AWS Direct Connect link. Business requirements state that connectivity must survive the failure of a single device, a single connection, and an entire Direct Connect location, with no reduction in bandwidth during a failure. Which design meets these requirements?",
    options: [
      {
        text: "Two 10 Gbps connections at one Direct Connect location, terminating on separate devices and bundled in a link aggregation group.",
        why: "機器と接続の故障には耐えるが、ロケーションごと止まると全滅する。要件の「ロケーション 1 か所の故障」を満たさない。",
      },
      {
        text: "One 10 Gbps connection with an AWS Site-to-Site VPN connection over the internet as a backup path.",
        why: "費用を抑えたいときの構成。VPN は 1 トンネルあたり約 1.25 Gbps で、故障中に帯域を保てない。",
      },
      {
        text: "Two 1 Gbps hosted connections from different partners at a single location, plus a 10 Gbps connection at another location.",
        why: "10 Gbps 側のロケーションが落ちると 2 Gbps しか残らず、帯域の要件を満たさない。",
      },
      {
        text: "Two 10 Gbps connections at each of two Direct Connect locations, each connection terminating on a separate device.",
        why: "正解。AWS の「最大の回復性」の構成。どの 1 か所・1 台・1 本が落ちても 10 Gbps 以上が残る。",
      },
    ],
    answer: 3,
    point:
      "DX の最大の回復性＝2 ロケーション × 各 2 本（別機器）。帯域を保つ必要があるなら VPN バックアップでは足りない",
  },
  {
    id: "d1-05",
    tasks: ["1.1", "4.3"],
    stem: "During sales events, an order-taking web tier receives 20 times its normal traffic, and the back-end order processing service cannot scale fast enough. Orders are lost when the processing service returns errors. The business requires that every accepted order is eventually processed. What should the solutions architect do?",
    options: [
      {
        text: "Move the processing service to larger instance types so that it can absorb the peak traffic.",
        why: "ピークの大きさが読めないと足りなくなり、普段は無駄になる。受け付けた注文を必ず処理する保証にはならない。",
      },
      {
        text: "Have the web tier write orders to an Amazon SQS queue with a dead-letter queue, and let the processing service consume from the queue at its own pace.",
        why: "正解。キューが急増を受け止め（バッファ）、処理側は追いつける速さで処理する。何度も失敗する注文は DLQ に残るので失われない。",
      },
      {
        text: "Publish each order to an Amazon SNS topic that invokes the processing service over HTTPS.",
        why: "SNS は押し出し型で、処理側の速さに合わせて溜めておくキューにならない。再試行を使い切った配信は失われうる。",
      },
      {
        text: "Add retry logic with exponential backoff and jitter to the web tier's calls to the processing service, and return an error to the user after five failed attempts.",
        why: "急増の間は再試行も失敗しやすく、最後は注文を断ることになる。受け付けた注文を確実に残す仕組みではない。",
      },
    ],
    answer: 1,
    point: "急増を受け止めて取りこぼさないのは SQS で疎結合にすること（バッファ＋DLQ）",
  },
  {
    id: "d1-06",
    tasks: ["1.4"],
    stem: "A multiplayer game uses a custom UDP protocol and runs in three Regions. Players' clients have the server addresses hardcoded, so the company wants a small set of static IP addresses. Traffic must be routed to the nearest healthy Region and fail over in seconds rather than waiting for DNS caches to expire. Which service should be used?",
    options: [
      {
        text: "Amazon CloudFront with the game servers configured as custom origins",
        why: "CloudFront は HTTP 系（WebSocket・gRPC・HTTP/3 を含む）の配信のためのもので、独自の UDP プロトコルは扱えない。固定 IP も提供しない。",
      },
      {
        text: "Route 53 latency-based routing with health checks and a 60-second TTL",
        why: "DNS の切り替えはクライアントやリゾルバーのキャッシュに左右される。アドレスが書き込まれたクライアントでは DNS 自体を使えない。",
      },
      {
        text: "AWS Global Accelerator with an endpoint group in each Region",
        why: "正解。Global Accelerator は 2 つの固定エニーキャスト IP を提供し、TCP と UDP を AWS のネットワークで最も近い健全なエンドポイントへ送る。切り替えは DNS に頼らず数秒。",
      },
      {
        text: "A Network Load Balancer in one Region with cross-zone load balancing enabled",
        why: "NLB はリージョンの中だけを分散する。他のリージョンへの振り分けや切り替えはできない。",
      },
    ],
    answer: 2,
    point: "固定 IP・TCP/UDP・DNS に頼らない数秒の切り替え＝Global Accelerator。CloudFront は HTTP 系",
  },
  {
    id: "d1-07",
    tasks: ["1.5"],
    stem: "A global retail application must let customers in North America, Europe, and Asia write shopping cart data with single-digit millisecond latency in their own Region. If one Region fails, the other Regions must continue to accept writes. Which database design meets these requirements?",
    options: [
      {
        text: "An Amazon Aurora global database with the primary cluster in North America and secondary clusters in Europe and Asia",
        why: "書き込みを受ける主クラスターは 1 つのリージョンだけ。他のリージョンからの書き込みは主へ送られて遅延が増え、主の故障中は切り替えまで書けない。",
      },
      {
        text: "Amazon RDS for MySQL in North America with cross-Region read replicas in Europe and Asia",
        why: "書けるのは北米の 1 か所だけ。リードレプリカは読み取りにしか使えない。",
      },
      {
        text: "An Amazon DynamoDB global table with replicas in all three Regions",
        why: "正解。グローバルテーブルはどのリージョンのレプリカにも書けるマルチアクティブ構成で、変更は他のリージョンに非同期で複製される。1 つが落ちても他で書き続けられる。",
      },
      {
        text: "An Amazon S3 bucket in each Region linked with S3 Cross-Region Replication in both directions",
        why: "S3 はオブジェクトストレージで、カートのような細かい更新を 1 桁ミリ秒で読み書きするデータベースの代わりにならない。",
      },
    ],
    answer: 2,
    point:
      "複数リージョンで書き込むマルチアクティブ＝DynamoDB グローバルテーブル。Aurora グローバルは書き込みが 1 リージョン",
  },
  {
    id: "d1-08",
    tasks: ["1.4", "2.3"],
    stem: "A central networking team manages VPCs in a network account. Application teams in other accounts in the same organization must launch EC2 instances and databases directly into subnets that the networking team controls, without managing their own VPCs, route tables, or gateways. What should the solutions architect do?",
    options: [
      {
        text: "Create a VPC peering connection from each application account's VPC to the network account's VPC.",
        why: "各チームが自分の VPC とルートテーブルを持つことになり、「自分で管理しない」に反する。",
      },
      {
        text: "Share the subnets with the application accounts by using AWS Resource Access Manager (VPC sharing).",
        why: "正解。VPC 共有では、所有者がサブネットを共有し、参加者のアカウントはそこにリソースを立てられる。VPC・ルート・ゲートウェイは所有者が管理する。",
      },
      {
        text: "Create IAM users for application developers in the network account so they launch resources there.",
        why: "全チームのリソースが 1 つのアカウントに混ざり、アカウントで分けた請求・権限・上限の分離が失われる。",
      },
      {
        text: "Copy the networking team's CloudFormation templates into each account so every team deploys an identical VPC.",
        why: "結局各チームが VPC を持ち、ゲートウェイやルートも各アカウントで管理することになる。",
      },
    ],
    answer: 1,
    point: "他アカウントに自分のネットワークを持たせずサブネットを使わせる＝RAM による VPC 共有（所有者と参加者）",
  },
  {
    id: "d1-09",
    tasks: ["1.4"],
    stem: "A public web application behind an Application Load Balancer is being targeted by SQL injection attempts and by bots that send thousands of login requests per minute from a small set of IP addresses. What should the solutions architect add?",
    options: [
      {
        text: "Security group rules that block the attacking IP addresses as they are discovered",
        why: "セキュリティグループは許可のルールしか書けず、拒否のルールは作れない。L4 なので SQL インジェクションも見分けられない。",
      },
      {
        text: "Network ACL rules on the ALB subnets that deny traffic on port 443",
        why: "正当な利用者の通信も止まる。L4 の規則では攻撃の中身を見分けられない。",
      },
      {
        text: "An AWS WAF web ACL on the ALB with the AWS managed SQL injection rule group and a rate-based rule",
        why: "正解。WAF は HTTP の中身を見て SQL インジェクションを止め、レートベースのルールで IP ごとの要求の多すぎる送り元を一時的に止める。",
      },
      {
        text: "AWS Shield Standard, which is enabled automatically at no cost and blocks application-layer attacks such as SQL injection",
        why: "Shield Standard はネットワーク層・トランスポート層の DDoS への備えで、SQL インジェクションのようなアプリケーション層の攻撃は止めない。",
      },
    ],
    answer: 2,
    point: "SQL インジェクションと IP ごとの過剰な要求＝AWS WAF（マネージドルール＋レートベースのルール）",
  },
  {
    id: "d1-10",
    tasks: ["1.1", "5.4"],
    stem: "An order fulfillment process has five steps implemented as Lambda functions. Some steps call external APIs that fail intermittently and need retries with exponential backoff. If the payment step fails permanently, a compensating step must cancel the reservation made earlier. Which design is MOST reliable and maintainable?",
    options: [
      {
        text: "Have each Lambda function invoke the next one synchronously and implement retries in each function's code.",
        why: "流れがコードに散らばり、待つ間も料金がかかる。失敗時の取り消しの流れも追いにくい。",
      },
      {
        text: "Run all five steps in a single Lambda function with a 15-minute timeout.",
        why: "15 分を超える待ちに耐えられず、途中で失敗すると最初からやり直しになる。",
      },
      {
        text: "Use an AWS Step Functions Standard workflow with Retry fields using exponential backoff and Catch fields that route payment failures to a compensation state.",
        why: "正解。Step Functions は再試行・エラー処理・補償（saga）を定義で書け、各手順の状態と履歴を残す。",
      },
      {
        text: "Schedule a cron job on an EC2 instance that runs the steps in sequence and writes progress to a log file.",
        why: "インスタンスが単一障害点になり、再試行や取り消しも自前で作ることになる。",
      },
    ],
    answer: 2,
    point: "再試行・エラー処理・補償を持つ複数手順の流れ＝Step Functions（Retry／Catch、saga）",
  },
  {
    id: "d1-11",
    tasks: ["1.5"],
    stem: "A content management system runs on Linux EC2 instances in an Auto Scaling group across three Availability Zones. All instances must read and write the same set of files, and the files must remain available if an Availability Zone fails. Which storage should be used?",
    options: [
      {
        text: "An Amazon EBS io2 volume with Multi-Attach enabled",
        why: "Multi-Attach は同じ AZ のインスタンスにしかつなげず、クラスター対応のファイルシステムも要る。AZ の故障にも耐えない。",
      },
      {
        text: "Instance store volumes synchronized with rsync every minute",
        why: "インスタンスを止めると消え、同期の遅れで食い違う。共有のファイルシステムにならない。",
      },
      {
        text: "An Amazon EFS file system with mount targets in each Availability Zone",
        why: "正解。EFS（リージョン）は複数の AZ にデータを保存する NFS の共有ファイルシステムで、どの AZ のインスタンスからも同時に読み書きできる。",
      },
      {
        text: "An Amazon S3 bucket accessed by the application as if it were a local POSIX file system",
        why: "S3 はオブジェクトストレージで、ロックや部分書き込みなど POSIX の動きをそのまま期待するアプリケーションには向かない。",
      },
    ],
    answer: 2,
    point: "複数 AZ の Linux インスタンスで共有するファイル＝EFS。EBS Multi-Attach は同じ AZ だけ",
  },
  {
    id: "d1-12",
    tasks: ["1.5"],
    stem: "A gaming leaderboard stores data in Amazon DynamoDB. Reads have grown to millions per second on a small number of hot items, and the team wants microsecond read latency with minimal changes to application code, which already uses the DynamoDB SDK. What should the solutions architect recommend?",
    options: [
      {
        text: "Add a global secondary index on the leaderboard table.",
        why: "インデックスは別の検索の仕方を足すもので、同じ項目への大量の読み取りを速くしない。",
      },
      {
        text: "Switch the table to provisioned capacity and increase the read capacity units.",
        why: "容量を増やしても遅延は 1 桁ミリ秒のまま。少数の項目に集中する読み取りはパーティションの限界にも当たる。",
      },
      {
        text: "Place Amazon DynamoDB Accelerator (DAX) in front of the table and point the application at the DAX client.",
        why: "正解。DAX は DynamoDB の API と互換のインメモリキャッシュで、読み取りをマイクロ秒にする。クライアントを差し替えるだけでコードの変更は少ない。",
      },
      {
        text: "Export the table to Amazon S3 every minute and serve reads from S3.",
        why: "S3 の遅延はミリ秒台で、データも最大 1 分古くなる。アプリケーションの大きな変更も要る。",
      },
    ],
    answer: 2,
    point: "DynamoDB の読み取りをマイクロ秒に、コードの変更少なく＝DAX",
  },
  {
    id: "d1-13",
    tasks: ["1.5"],
    stem: "Users around the world upload video files of 2–10 GB each to a single S3 bucket in us-east-1. Uploads from Asia and South America are slow and often fail partway through. Which combination of changes will improve upload speed and reliability?",
    options: [
      {
        text: "Enable S3 Transfer Acceleration on the bucket and upload with multipart upload so that failed parts can be retried individually.",
        why: "正解。Transfer Acceleration は最寄りのエッジから AWS のネットワークでバケットまで運ぶ。マルチパートは並列に送れ、失敗した部分だけを送り直せる。",
      },
      {
        text: "Ask users in Asia and South America to establish AWS Direct Connect connections.",
        why: "一般の利用者に専用線を求めるのは現実的でない。",
      },
      {
        text: "Enable S3 Cross-Region Replication to buckets in Asia and South America.",
        why: "複製は上げたあとの写しで、利用者からの上げを速くしない。",
      },
      {
        text: "Put an Application Load Balancer in front of the bucket.",
        why: "ALB は S3 をターゲットにできず、遠い利用者からの経路も変わらない。",
      },
    ],
    answer: 0,
    point: "遠くからの大きなファイルの上げ＝Transfer Acceleration＋マルチパートアップロード",
  },
  {
    id: "d1-14",
    tasks: ["1.1"],
    stem: "A computational fluid dynamics application runs tightly coupled MPI jobs across 64 EC2 instances. Performance is limited by network latency between nodes. Which configuration will provide the lowest inter-node latency?",
    options: [
      {
        text: "A spread placement group across three Availability Zones",
        why: "スプレッドは故障を分けるためにインスタンスを離して置くもので、遅延は大きくなる（AZ ごとに 7 台までの制限もある）。",
      },
      {
        text: "A partition placement group with each partition in a different rack",
        why: "HDFS や Cassandra など、故障の範囲を分けたい大きな分散システム向け。最小の遅延を狙うものではない。",
      },
      {
        text: "Instances spread across multiple Regions for higher aggregate bandwidth",
        why: "リージョンをまたぐと遅延は桁違いに大きくなる。",
      },
      {
        text: "A cluster placement group in a single Availability Zone with instances that support Elastic Fabric Adapter (EFA)",
        why: "正解。クラスターは近くにまとめて置き、低遅延・高帯域にする。EFA は MPI のノード間通信で OS を迂回して遅延を下げる。",
      },
    ],
    answer: 3,
    point: "密結合の HPC＝クラスタープレイスメントグループ＋EFA。スプレッド／パーティションは故障の分離のため",
  },
  {
    id: "d1-15",
    tasks: ["1.5", "3.4"],
    stem: "Analysts run ad hoc SQL queries with Amazon Athena on several terabytes of CSV log files in S3. Queries that filter on a single day are slow and expensive because they scan the entire dataset. What should the solutions architect do to improve performance and reduce cost?",
    options: [
      {
        text: "Load the logs into a large Amazon RDS instance and query them there.",
        why: "数 TB の分析には向かず、常に動かすインスタンスの費用と読み込みの手間が増える。",
      },
      {
        text: "Convert the data to a columnar format such as Apache Parquet and partition it by date in S3.",
        why: "正解。Athena は読んだデータ量で課金される。パーティションで読む範囲を 1 日に絞り、列指向で必要な列だけを読めば、速く安くなる。",
      },
      {
        text: "Enable S3 Transfer Acceleration on the bucket.",
        why: "遠い場所からの上げ下ろしを速くするもので、Athena が読む量は変わらない。",
      },
      {
        text: "Run the same queries with Spark SQL on a permanently running Amazon EMR cluster with more core nodes.",
        why: "全体を読むことは変わらず、常に動かすクラスターの費用が増える。",
      },
    ],
    answer: 1,
    point: "Athena の速さと費用＝読む量を減らす（パーティション＋Parquet などの列指向・圧縮）",
  },
  {
    id: "d1-16",
    tasks: ["1.5"],
    stem: 'After moving an API to AWS Lambda, an Amazon RDS for PostgreSQL database begins to fail with "too many connections" errors during traffic spikes, even though its CPU usage is low. What should the solutions architect do with the LEAST application change?',
    options: [
      {
        text: "Put Amazon RDS Proxy between the Lambda functions and the database, and point the functions at the proxy endpoint.",
        why: "正解。RDS Proxy は接続をプールして使い回すので、Lambda が大量に同時実行しても DB の接続数が増えすぎない。接続先を替えるだけで済む。",
      },
      {
        text: "Scale the DB instance up to the largest instance class in its family and raise the max_connections parameter in the DB parameter group.",
        why: "CPU は余っているので無駄が大きく、同時実行がもっと増えればまた尽きる。",
      },
      {
        text: "Add read replicas and spread connections across them.",
        why: "書き込みの接続は散らせず、レプリカへの振り分けにアプリケーションの変更も要る。",
      },
      {
        text: "Set reserved concurrency on the functions to 1.",
        why: "接続数は減るが、API がほとんど処理できなくなる。",
      },
    ],
    answer: 0,
    point: "Lambda から RDS への接続の嵐＝RDS Proxy（接続のプール）",
  },
  {
    id: "d1-17",
    tasks: ["1.1"],
    stem: "A web application stores user session data in memory on each EC2 instance. Users are logged out whenever the Auto Scaling group scales in or replaces an unhealthy instance. What should the solutions architect do to fix this while keeping the application horizontally scalable?",
    options: [
      {
        text: "Enable sticky sessions on the load balancer with a 24-hour duration.",
        why: "同じインスタンスに送り続けるだけで、そのインスタンスが消えればセッションも消える。負荷の偏りも生む。",
      },
      {
        text: "Disable scale-in on the Auto Scaling group.",
        why: "入れ替えのときの問題は残り、使わない台数の費用も増える。",
      },
      {
        text: "Store session data in Amazon ElastiCache or Amazon DynamoDB so that any instance can serve any user.",
        why: "正解。状態をインスタンスの外に出せば（ステートレス化）、インスタンスが消えてもセッションは残り、自由に増減できる。",
      },
      {
        text: "Save sessions to the instance's EBS root volume.",
        why: "インスタンスが終了すればルートボリュームも消える（既定）。他のインスタンスからも読めない。",
      },
    ],
    answer: 2,
    point: "セッションはインスタンスの外（ElastiCache／DynamoDB）に出してステートレスにする",
  },
  {
    id: "d1-18",
    tasks: ["1.5"],
    stem: "A company is migrating Windows-based applications that use SMB file shares with NTFS permissions integrated with Microsoft Active Directory. The file shares must remain accessible with the same permissions after migration, with minimal management. What should the solutions architect use?",
    options: [
      {
        text: "Amazon EFS mounted on Windows instances",
        why: "EFS は NFS で、Windows のインスタンスからは使えない。NTFS の権限も無い。",
      },
      {
        text: "Amazon FSx for Windows File Server joined to the Active Directory domain",
        why: "正解。FSx for Windows File Server は SMB・NTFS の権限・AD との連携を備えたマネージドの Windows のファイルサーバー。",
      },
      {
        text: "Amazon S3 with bucket policies that mirror the NTFS permissions",
        why: "S3 は SMB の共有ではなく、アプリケーションの変更が要る。権限の作り直しも重い。",
      },
      {
        text: "A Windows file server on EC2 with EBS volumes, joined to the Active Directory domain",
        why: "動くが、OS・冗長化・バックアップを自分で管理する。最小限の管理という要件に合わない。",
      },
    ],
    answer: 1,
    point: "SMB・NTFS・AD のファイル共有＝FSx for Windows File Server。EFS は NFS（Linux）",
  },
  {
    id: "d1-19",
    tasks: ["1.3", "4.1"],
    stem: "An on-premises application uses Apache ActiveMQ with JMS and the OpenWire protocol for messaging between components. The company wants a managed message broker on AWS without rewriting the messaging code. Which service should it use?",
    options: [
      {
        text: "Amazon MQ for ActiveMQ",
        why: "正解。Amazon MQ は ActiveMQ と RabbitMQ のマネージドのブローカーで、JMS や OpenWire などの標準のプロトコルをそのまま使える。",
      },
      {
        text: "Amazon SQS",
        why: "SQS は独自の API で、JMS や OpenWire のブローカーの代わりにするにはコードの書き換えが要る。新しく作るならこちらが向く。",
      },
      {
        text: "Amazon Kinesis Data Streams",
        why: "大量のデータのストリームのためのもので、JMS のブローカーではない。コードも作り直しになる。",
      },
      {
        text: "Amazon SNS with HTTP subscriptions",
        why: "発行・購読の通知のサービスで、JMS のキューの意味や OpenWire に対応しない。",
      },
    ],
    answer: 0,
    point: "既存の JMS／AMQP／MQTT などのブローカーを書き換えずに移す＝Amazon MQ。新規なら SQS／SNS",
  },
  {
    id: "d1-20",
    tasks: ["1.1"],
    stem: "When an order is placed, the order service synchronously calls the inventory, shipping, email, and analytics services. A slowdown in the analytics service now causes order placement to time out. The company wants each downstream service to process orders independently and to add new consumers without changing the order service. What should the solutions architect recommend?",
    options: [
      {
        text: "Increase the timeout of the order service to 60 seconds.",
        why: "利用者を待たせるだけで、1 つのサービスの遅れが全体に広がる構造は変わらない。",
      },
      {
        text: "Call the downstream services in parallel threads instead of sequentially.",
        why: "合計の時間は減っても、一番遅いサービスに引きずられ、新しい受け手のたびに変更も要る。",
      },
      {
        text: "Merge all the services into the order service so that no network calls are needed.",
        why: "一枚岩に戻り、独立に処理する・受け手を足すという要件と逆になる。",
      },
      {
        text: "Publish an OrderPlaced event to an Amazon SNS topic (or EventBridge event bus) and have each service consume it from its own SQS queue.",
        why: "正解。ファンアウトで発行側と受け手を切り離す。各サービスは自分のキューの速さで処理し、新しい受け手は購読を足すだけで済む。",
      },
    ],
    answer: 3,
    point: "同期の呼び出しの連鎖を切り離す＝イベントのファンアウト（SNS／EventBridge→各サービスの SQS）",
  },
  {
    id: "d1-21",
    tasks: ["1.2"],
    stem: "A company wants an internal assistant that answers employee questions from 40,000 policy documents stored in Amazon S3. Answers must cite the source documents, the documents change weekly, and the team wants to avoid building its own chunking, embedding, and retrieval pipeline. Which approach should the solutions architect recommend?",
    options: [
      {
        text: "Fine-tune a foundation model on all of the policy documents every week on a schedule, and query the tuned model directly so that no retrieval step is needed.",
        why: "学習は範囲外の重い作業で、毎週の変更に追いつかない。答えの元の文書も示せない。",
      },
      {
        text: "Use Amazon Bedrock Knowledge Bases with the S3 bucket as the data source, sync it when documents change, and generate answers with citations.",
        why: "正解。Knowledge Bases はデータソースの文書を分割・埋め込みして検索できるようにし、検索した部分をもとに出典付きで答える（RAG）。同期すれば変更も取り込める。",
      },
      {
        text: "Concatenate all 40,000 documents into the system prompt of every request so that the model always has the full context.",
        why: "コンテキストの長さに収まらず、収まる量でも毎回の費用と遅延が大きすぎる。どこから答えたかも示しにくい。",
      },
      {
        text: "Train a custom model on SageMaker AI from scratch so that the company owns the model weights.",
        why: "モデルの学習は範囲外の大きな作業で、文書の変更のたびに学習し直すことになる。",
      },
    ],
    answer: 1,
    point: "社内の文書に基づいて出典付きで答える＝RAG（Bedrock Knowledge Bases）。ファインチューニングで知識を入れない",
  },
  {
    id: "d1-22",
    tasks: ["1.2", "1.3"],
    stem: "A company is building an AI agent that must call a dozen existing internal REST APIs and AWS Lambda functions as tools. The team wants the agent hosted with per-session isolation and wants the existing APIs exposed to the agent as MCP-compatible tools without rewriting them. Which solution meets these requirements with the LEAST custom code?",
    options: [
      {
        text: "Run an open source agent framework on a fleet of EC2 instances behind a load balancer, write a custom MCP server for each API, and isolate sessions in application code.",
        why: "動くが、実行環境・分離・各 API の MCP サーバーをすべて自分で作り、運用することになる。",
      },
      {
        text: "Chain the Lambda functions with hardcoded if-else logic that decides which API to call based on keywords in the user's message.",
        why: "決め打ちの分岐はエージェントではなく、言い回しが変わると壊れる。",
      },
      {
        text: "Host the agent on Amazon Bedrock AgentCore Runtime and use AgentCore Gateway to turn the existing APIs and Lambda functions into MCP-compatible tools.",
        why: "正解。AgentCore Runtime はセッションを分離してエージェントを動かし、AgentCore Gateway は既存の API や Lambda 関数を MCP 対応のツールに変える。",
      },
      {
        text: "Fine-tune a model on examples of API responses so that it can answer without calling the APIs at all, and refresh the training data monthly.",
        why: "今のデータを取りに行けず、答えが古くなる。学習も範囲外の重い作業。",
      },
    ],
    answer: 2,
    point:
      "エージェントの実行は AgentCore Runtime（セッション分離）、既存の API をツールにするのは AgentCore Gateway（MCP 対応）",
  },
  {
    id: "d1-23",
    tasks: ["1.2"],
    stem: "A media company runs a custom computer vision model on Amazon SageMaker AI. Requests arrive in unpredictable bursts with payloads of up to 800 MB, and each request can take up to 20 minutes to process. Clients can poll for results later. The company wants to pay nothing for instances when there are no requests. Which inference option should be used?",
    options: [
      {
        text: "A real-time inference endpoint with a fixed number of large instances",
        why: "リアルタイムの推論はペイロードと処理時間の上限が小さく、要求が無いときも払い続ける。",
      },
      {
        text: "Asynchronous Inference, with the endpoint's instance count auto scaled to zero when the queue is empty",
        why: "正解。非同期推論は要求をキューに入れ、最大 1 GB のペイロードと最大 1 時間の処理を扱える。インスタンス数は 0 まで減らせる。",
      },
      {
        text: "Serverless Inference, which processes each request synchronously for as long as the model needs, with no limits on payload size or processing time",
        why: "サーバーレス推論は間欠的で軽い要求向けで、ペイロードと処理時間に小さな上限がある。800 MB・20 分には使えない。",
      },
      {
        text: "Run the model on AWS Lambda with the maximum memory setting",
        why: "Lambda は 1 回の実行が最大 15 分で、20 分の処理に足りない。大きなモデルの読み込みにも向かない。",
      },
    ],
    answer: 1,
    point: "大きなペイロード・長い処理・あとで受け取る・要求が無ければ 0 台＝SageMaker AI の非同期推論",
  },
  {
    id: "d1-24",
    tasks: ["1.2", "3.1"],
    stem: "A product team wants to add text summarization to an application by calling a high-quality foundation model. The team has no ML engineers and does not want to provision or manage any model hosting infrastructure. It wants to pay only for what it uses. What should the solutions architect recommend?",
    options: [
      {
        text: "Download open model weights and host them on a GPU EC2 instance that runs 24 hours a day.",
        why: "基盤の用意と管理を自分で抱え、使わない時間も払い続ける。",
      },
      {
        text: "Train a summarization model with SageMaker AI and deploy it to a real-time endpoint.",
        why: "学習とエンドポイントの管理が要り、ML のエンジニアのいないチームの要件に合わない。",
      },
      {
        text: "Build a rules-based summarizer in a Lambda function that keeps the first sentence of each paragraph and drops the rest of the text.",
        why: "安く作れるが、高品質の要約にはならない。",
      },
      {
        text: "Call a foundation model through Amazon Bedrock's API with on-demand pricing.",
        why: "正解。Bedrock はモデルを動かす基盤を利用者が管理せずに API で使え、オンデマンドなら使った分だけ払う。",
      },
    ],
    answer: 3,
    point: "基盤を管理せずに基盤モデルを使う＝Amazon Bedrock（オンデマンド）。独自のモデルを動かすなら SageMaker AI",
  },
];
