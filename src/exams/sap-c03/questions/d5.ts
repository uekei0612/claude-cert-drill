/* 分野 5：運用上の優秀性と自動化（自作問題） */
import type { Question } from "../../../core/exam/types";

export const d5: Question[] = [
  {
    id: "d5-01",
    tasks: ["5.2"],
    stem: "A containerized service runs on Amazon ECS behind an Application Load Balancer. The business requires that a new version can be tested with production-like traffic before release and that rollback takes less than a minute if errors appear. Which deployment approach should be used?",
    options: [
      {
        text: "An ECS rolling update that replaces 10% of the tasks at a time, with the deployment circuit breaker enabled to stop the rollout and roll back automatically when new tasks fail to reach a steady state",
        why: "サーキットブレーカーはタスクの起動に失敗したときに止めて戻すだけで、公開前に新バージョンだけを試す手段は無い。戻すのも入れ替え直しなので 1 分では済まない。",
      },
      {
        text: "Stopping all tasks and starting the new task definition during a maintenance window",
        why: "止まる時間がある上に、戻すのも同じ手間がかかる。",
      },
      {
        text: "Deploying the new version to a separate cluster and asking users to switch to a new URL",
        why: "切り替えを利用者に頼むので制御できず、戻すときも同じ問題が起きる。",
      },
      {
        text: "A blue/green deployment (Amazon ECS native blue/green, or AWS CodeDeploy) that validates the new revision with test traffic and keeps the old revision for rollback",
        why: "正解。新しいリビジョン（green）をテスト用のリスナーやルールで確かめてから本番の通信を移す。古いリビジョン（blue）は残っているので、戻すのは通信の向きを戻すだけで済む。今の AWS の案内では、CodeDeploy を使う方式より ECS 自体の blue/green を勧めている。",
      },
    ],
    answer: 3,
    point:
      "公開前の確認と即時の切り戻し＝blue/green（テスト用の通信で確かめ、旧環境を残す。ECS は ECS 自体の blue/green が推奨）",
  },
  {
    id: "d5-02",
    tasks: ["5.1"],
    stem: "A security team maintains a CloudFormation template that creates IAM roles and AWS Config rules. The resources must exist in every account in the organization and in four Regions, including accounts that will be created in the future. What is the MOST operationally efficient approach?",
    options: [
      {
        text: "Create a CloudFormation StackSet with service-managed permissions targeting the organization's OUs, with automatic deployment enabled.",
        why: "正解。サービスマネージドの StackSets は Organizations と連携し、OU に加わった新しいアカウントにも自動で展開する。複数リージョンにも一度に出せる。",
      },
      {
        text: "Ask each account owner to deploy the template in each of the four Regions and confirm by email.",
        why: "人に頼むと漏れと遅れが出る。新しいアカウントも自動で入らない。",
      },
      {
        text: "Run a script from a CI server that assumes a role in every account and creates or updates a stack in each of the four Regions, and rerun it whenever accounts are added.",
        why: "動くが、新しいアカウントのたびに流し直す必要があり、失敗の追跡も自前になる。",
      },
      {
        text: "Create the resources once in the management account; SCPs will apply them to all member accounts.",
        why: "SCP は権限の上限を決めるだけで、リソースを作ったり写したりしない。",
      },
    ],
    answer: 0,
    point: "全アカウント・複数リージョンへの展開（新アカウントも自動）＝StackSets のサービスマネージド＋自動デプロイ",
  },
  {
    id: "d5-03",
    tasks: ["5.2"],
    stem: "A team releases new versions of a critical AWS Lambda function several times a day. They want 10% of invocations to go to the new version for 10 minutes, and the release must roll back automatically if an Amazon CloudWatch error alarm fires. What should they implement?",
    options: [
      {
        text: "Create a new function for each release, test it in a staging stage, and then update the API Gateway integration so that the production stage points to the new function.",
        why: "全通信が一度に切り替わり、10% だけ流すことも自動で戻すこともできない。",
      },
      {
        text: "Publish versions, point an alias at them, and use AWS CodeDeploy with the CodeDeployDefault.LambdaCanary10Percent10Minutes configuration and the alarm attached.",
        why: "正解。CodeDeploy はエイリアスの重み付けで 10% を新バージョンに流し、10 分後に残りを移す。その間にアラームが鳴れば自動で戻す。",
      },
      {
        text: "Use $LATEST in production and redeploy the previous code from source control if errors increase.",
        why: "$LATEST は常に最新のコードを指すので、段階的に流せない。戻すのも手作業になる。",
      },
      {
        text: "Set reserved concurrency to 10% of the account limit on the new version so that it receives less traffic.",
        why: "同時実行数は通信の割合を決めるものではない。上限を超えた呼び出しはスロットリングされるだけ。",
      },
    ],
    answer: 1,
    point: "Lambda の段階的リリース＝エイリアスの重み付け＋CodeDeploy（Canary/Linear）＋アラームで自動ロールバック",
  },
  {
    id: "d5-04",
    tasks: ["5.2", "5.1"],
    stem: "An Auto Scaling group launches instances from an AMI and then runs a long user data script that installs OS patches and agents. Instances take 15 minutes to become ready, and some instances end up with different package versions. The company wants consistent, quickly launching instances. What should it do?",
    options: [
      {
        text: "Increase the instance size so that the user data script runs faster.",
        why: "多少速くなっても起動のたびに入れる点は変わらず、バージョンのずれも直らない。",
      },
      {
        text: "Use EC2 Image Builder to build patched golden AMIs on a schedule and update the launch template to each new AMI.",
        why: "正解。必要なものを焼き込んだ AMI から起動すれば速く、どのインスタンスも同じ中身になる。Image Builder は作成とテストを自動化する。",
      },
      {
        text: "Take a snapshot of a correctly configured running instance each month, register it manually as the new AMI, and update the launch template to use it.",
        why: "手作業で、動いていたインスタンスの余計な状態も写り込む。テストもされない。",
      },
      {
        text: "Lengthen the Auto Scaling health check grace period to 30 minutes.",
        why: "起動の遅さとずれを隠すだけで、スケールアウトはさらに遅く見える。",
      },
    ],
    answer: 1,
    point:
      "起動を速くそろえる＝ゴールデン AMI（EC2 Image Builder）。起動のたびのユーザーデータのインストールは遅くずれる",
  },
  {
    id: "d5-05",
    tasks: ["5.4"],
    stem: "A web application's traffic jumps sharply every weekday at 9:00 AM. New instances take 10 minutes to initialize, and target tracking scaling reacts too late, so users see errors for the first 15 minutes. What should the solutions architect do?",
    options: [
      {
        text: "Lower the target value of the target tracking policy from 60% to 40% CPU and shorten the instance warm-up time so that scaling starts earlier.",
        why: "普段から余計に台数を抱えるが、急な立ち上がりには相変わらず 10 分の遅れが出る。",
      },
      {
        text: "Use predictive scaling or a scheduled action to raise capacity before 9:00 AM, optionally with a warm pool of pre-initialized instances.",
        why: "正解。決まった時刻の増加は、事前に台数を増やせば間に合う。ウォームプールは初期化を済ませたインスタンスを待たせておき、起動の時間を縮める。",
      },
      {
        text: "Switch the Auto Scaling group to larger instance types so that fewer instances are needed.",
        why: "1 台ずつの初期化の遅さは変わらず、普段の費用が上がる。",
      },
      {
        text: "Replace the Application Load Balancer with a Network Load Balancer.",
        why: "ロードバランサーの種類は、台数が足りないことと関係ない。",
      },
    ],
    answer: 1,
    point: "決まった時刻の急増と遅い起動＝予測スケーリング／スケジュール＋ウォームプール",
  },
  {
    id: "d5-06",
    tasks: ["5.4", "2.3"],
    stem: "A company manages 2,000 EC2 instances running Windows and Linux. Patching is done by administrators connecting to instances over RDP and SSH, and the company cannot prove which instances are missing critical patches. What should the solutions architect recommend?",
    options: [
      {
        text: "Write a script that connects to each instance over SSH and RDP and runs the OS update command every night.",
        why: "つなぐための経路と認証情報が要り、失敗の追跡やどのパッチが当たったかの報告も自前になる。",
      },
      {
        text: "Replace all instances every month with new instances launched from the latest Amazon-provided AMIs.",
        why: "状態を持つサーバーも多く、すべてを入れ替えるのは現実的でない。パッチの準拠状況の報告も無い。",
      },
      {
        text: "Use AWS Systems Manager Patch Manager with patch baselines, apply patches through a patch policy (Quick Setup) or maintenance windows, and review patch compliance.",
        why: "正解。Patch Manager は OS をまたいでパッチの当て方を決めて自動で当て、どのインスタンスがどのパッチを欠いているかを準拠状況として示す。",
      },
      {
        text: "Enable Amazon Inspector and ask administrators to patch the instances it reports.",
        why: "Inspector は脆弱性を見つけるが、当てるのは手作業のまま。当てる仕組みも合わせて要る。",
      },
    ],
    answer: 2,
    point:
      "大量のインスタンスのパッチと準拠状況＝Systems Manager Patch Manager（ベースライン＋メンテナンスウィンドウ）",
  },
  {
    id: "d5-07",
    tasks: ["5.3"],
    stem: "A microservices application built with API Gateway, Lambda, and ECS services occasionally has requests that take more than 5 seconds. Each service logs to CloudWatch Logs, but the team cannot tell which downstream call causes the delay. What should the team implement?",
    options: [
      {
        text: "Increase the log level of every service to DEBUG and search the logs for slow requests.",
        why: "ログが増えるだけで、要求ごとにサービスをまたいだつながりは見えない。費用も増える。",
      },
      {
        text: "Instrument API Gateway, Lambda, and the ECS services for distributed tracing with AWS Distro for OpenTelemetry, send the traces to AWS X-Ray, and analyze the trace map.",
        why: "正解。分散トレースは 1 つの要求がたどったサービスと各区間の時間を示すので、遅い下流の呼び出しを特定できる。",
      },
      {
        text: "Create a CloudWatch alarm on the API Gateway Latency metric.",
        why: "遅いことには気付けるが、どこが遅いかは分からない。",
      },
      {
        text: "Turn on VPC Flow Logs for the subnets that host the ECS services.",
        why: "フローログは IP とポートの通信の記録で、アプリケーションの要求ごとの遅れは分からない。",
      },
    ],
    answer: 1,
    point: "サービスをまたいだ遅れの特定＝分散トレース（X-Ray／OpenTelemetry）",
  },
  {
    id: "d5-08",
    tasks: ["5.4"],
    stem: "When an EC2 instance's root volume reaches 90% full, an operator currently receives an email and then manually runs a cleanup procedure that takes 20 minutes. The company wants to remediate this automatically and consistently. What should the solutions architect do?",
    options: [
      {
        text: "Have the CloudWatch alarm (fed by the CloudWatch agent's disk metric) trigger an Amazon EventBridge rule that runs a Systems Manager Automation runbook to perform the cleanup.",
        why: "正解。手順をランブックにすれば毎回同じに流れ、アラームとイベントから自動で起動できる。誰がいつ何をしたかも残る。",
      },
      {
        text: "Double the size of every root volume so that the alarm fires less often.",
        why: "先送りで、費用が増えるだけ。埋まる原因も直らない。",
      },
      {
        text: "Ask the operator to document the procedure in a wiki so that others can run it.",
        why: "文書化は大切だが、自動化にはならず、手作業のずれも残る。",
      },
      {
        text: "Use AWS Trusted Advisor to monitor disk usage and remediate automatically.",
        why: "Trusted Advisor はインスタンスの中のディスクの使用量を見ず、自動で直す機能も無い。",
      },
    ],
    answer: 0,
    point: "繰り返す手作業の復旧＝アラーム→EventBridge→SSM Automation のランブック",
  },
  {
    id: "d5-09",
    tasks: ["5.1"],
    stem: "Infrastructure is defined in CloudFormation, but engineers sometimes change security groups and instance settings directly in the console during incidents. Later stack updates fail or silently revert the fixes. What should the solutions architect recommend?",
    options: [
      {
        text: "Stop using CloudFormation and manage all resources through the console.",
        why: "再現性と変更の履歴を失う。ずれの問題を消す代わりに、もっと大きな問題を抱える。",
      },
      {
        text: "Detect drift with CloudFormation drift detection, make changes only through template updates, and restrict console write access to the stack resources with IAM.",
        why: "正解。ドリフト検出でテンプレートと実物の差を見つけ、変更の入口をテンプレートに一本化する。障害時の緊急の手順もテンプレートで流せるようにする。",
      },
      {
        text: "Delete and recreate each stack weekly so that all manual changes are removed.",
        why: "データを持つリソースも消え、止まる時間も出る。必要だった修正も消える。",
      },
      {
        text: "Enable termination protection on all stacks.",
        why: "削除を防ぐだけで、手での設定の変更やずれは防がない。",
      },
    ],
    answer: 1,
    point: "IaC のずれ＝ドリフト検出＋変更の入口をテンプレートに一本化（コンソールの書き込みを絞る）",
  },
  {
    id: "d5-10",
    tasks: ["5.4"],
    stem: "Worker instances in an Auto Scaling group process messages from an Amazon SQS queue. They scale on average CPU utilization, but during bursts the queue backlog grows to hours while CPU stays moderate because each job waits on I/O. How should scaling be improved?",
    options: [
      {
        text: "Lower the CPU target from 60% to 20%.",
        why: "CPU は滞留と結び付いていないので、急増に追いつくとは限らず、普段は台数が多すぎる。",
      },
      {
        text: "Increase the SQS visibility timeout.",
        why: "処理中のメッセージの重複を防ぐ設定で、処理の速さや台数は変わらない。",
      },
      {
        text: "Switch to compute-optimized instances.",
        why: "CPU が律速ではないので、速くならない。",
      },
      {
        text: "Use target tracking on a custom metric for backlog per instance (ApproximateNumberOfMessagesVisible divided by the number of running instances).",
        why: "正解。キューで処理するワーカーは、1 台あたりが抱えるメッセージの数でスケールするのが AWS の勧める形。許せる遅れから目標値を決める。",
      },
    ],
    answer: 3,
    point: "SQS のワーカーは「インスタンスあたりの滞留」でスケールする（CPU は滞留を表さない）",
  },
  {
    id: "d5-11",
    tasks: ["5.4"],
    stem: "An Auto Scaling group behind an Application Load Balancer uses the default EC2 status checks. Some instances have a hung application process: the ALB marks them unhealthy and stops routing to them, but they are never replaced, so capacity slowly shrinks. What should the solutions architect change?",
    options: [
      {
        text: "Increase the ALB health check interval to 5 minutes.",
        why: "固まったインスタンスに気付くのが遅くなるだけで、入れ替えはやはり起きない。",
      },
      {
        text: "Turn on Elastic Load Balancing health checks for the Auto Scaling group.",
        why: "正解。ELB のヘルスチェックを Auto Scaling に使わせると、ALB が不健全と見たインスタンスを Auto Scaling が終了して入れ替える。EC2 のステータスチェックは OS やハードの不調しか見ない。",
      },
      {
        text: "Enable detailed monitoring on the instances.",
        why: "メトリクスの粒度が上がるだけで、入れ替えの判断は変わらない。",
      },
      {
        text: "Raise the desired capacity so that a few unhealthy instances do not affect users.",
        why: "固まったインスタンスが溜まり続け、費用だけが増える。",
      },
    ],
    answer: 1,
    point: "ALB で不健全なインスタンスを入れ替えるには Auto Scaling で ELB のヘルスチェックを有効にする",
  },
  {
    id: "d5-12",
    tasks: ["5.1"],
    stem: "A platform team maintains 200 nearly identical CloudFormation templates written in YAML for different microservices. Small changes must be copied by hand into every template, and mistakes are common. The team writes its applications in TypeScript and wants reusable, testable infrastructure components while still deploying through CloudFormation. What should it adopt?",
    options: [
      {
        text: "Merge all 200 templates into a single large nested template and deploy every microservice in one stack with shared parameters.",
        why: "1 つの変更がすべてのサービスに影響し、スタックの上限にも当たる。使い回せる部品にもならない。",
      },
      {
        text: "The AWS Cloud Development Kit (AWS CDK) with shared constructs in TypeScript, synthesized to CloudFormation templates",
        why: "正解。CDK は TypeScript などのプログラミング言語でインフラを部品（construct）として書いて使い回し、テストでき、CloudFormation のテンプレートに合成して展開する。",
      },
      {
        text: "Manage the resources through the console and document the settings in a wiki.",
        why: "コードによる管理をやめることになり、再現性も変更の履歴も失う。",
      },
      {
        text: "Use AWS Config conformance packs to create the resources for each microservice.",
        why: "適合パックは設定の準拠を評価するもので、アプリケーションのリソースを作る道具ではない。",
      },
    ],
    answer: 1,
    point: "IaC を部品化して使い回す＝AWS CDK（プログラミング言語の construct → CloudFormation に合成）",
  },
  {
    id: "d5-13",
    tasks: ["5.1", "2.3"],
    stem: "A security team wants to stop any CloudFormation stack in the organization from creating an S3 bucket without default encryption or with public access allowed. Noncompliant resources must be rejected before they are provisioned, not detected afterward. What should the solutions architect implement?",
    options: [
      {
        text: "An AWS Config rule with automatic remediation that encrypts buckets and blocks public access after they are created",
        why: "作られたあとの検出と修復で、作られる前に拒否するという要件を満たさない。",
      },
      {
        text: "A weekly script that lists all buckets and deletes noncompliant ones",
        why: "最大 1 週間さらされ、データも失いうる。",
      },
      {
        text: "CloudFormation Hooks that evaluate S3 bucket resources with AWS CloudFormation Guard rules before create and update operations and fail noncompliant operations",
        why: "正解。Hooks はリソースが作られる前に設定を調べ、準拠しなければ操作を失敗させる（警告だけにもできる）。Guard のルールや Lambda で書ける。",
      },
      {
        text: "A CloudWatch alarm on the number of S3 buckets",
        why: "数は設定の準拠を表さない。",
      },
    ],
    answer: 2,
    point:
      "作られる前に拒否する IaC の統制＝CloudFormation Hooks（Guard／Lambda）。Config ルールは主に作られたあとの評価",
  },
  {
    id: "d5-14",
    tasks: ["5.3"],
    stem: "An organization has 60 accounts, and the security team needs application logs from CloudWatch Logs in all of them delivered to a central log archive account, where they will be stored in Amazon S3 with lifecycle rules to cheaper storage classes. Application teams must not be able to stop the delivery. What should the solutions architect do?",
    options: [
      {
        text: "Ask each team to export its log groups to S3 manually every week.",
        why: "漏れと遅れが出て、チームが止めることもできる。書き出しは継続的な保管のためのものでもない。",
      },
      {
        text: "Create cross-account subscription filters (account-level where possible) that send logs to an Amazon Data Firehose destination in the log archive account, which delivers to S3; deploy them centrally and protect them with SCPs.",
        why: "正解。サブスクリプションフィルターは別のアカウント・リージョンの Kinesis Data Streams や Firehose へログを流せる。中央から展開し、SCP で変更を禁じれば止められない（組織向けのログの集約の機能を使う手もある）。",
      },
      {
        text: "Increase the retention of every log group to 10 years.",
        why: "各アカウントに置いたままで集約にならず、チームが消せる。費用も高い。",
      },
      {
        text: "Enable VPC Flow Logs in every account and send them to the central account.",
        why: "フローログは通信の記録で、アプリケーションのログではない。",
      },
    ],
    answer: 1,
    point: "全アカウントのログの集約＝アカウント間のサブスクリプションフィルター→中央の Firehose→S3（SCP で守る）",
  },
  {
    id: "d5-15",
    tasks: ["5.3"],
    stem: "An online store's checkout sometimes breaks after third-party changes, and the company learns about it only when customers complain. The operations team wants to detect a broken checkout flow within five minutes, 24 hours a day, even when there is little real traffic at night. What should the solutions architect recommend?",
    options: [
      {
        text: "Amazon CloudWatch Synthetics canaries that run a scripted checkout flow every few minutes and raise an alarm on failure",
        why: "正解。カナリアは決めた予定で利用者の操作を模した台本を流すので、実際のアクセスが無いときも壊れたことに気付ける。",
      },
      {
        text: "Amazon CloudWatch RUM to collect page load times and JavaScript errors from real users' browsers, with an alarm on the error rate",
        why: "実際の利用者の体験を見るには向くが、夜に利用者がいなければデータが来ず、5 分以内に気付けない。",
      },
      {
        text: "An alarm on the average CPU utilization of the web servers",
        why: "決済の流れが壊れても CPU は変わらないことが多い。",
      },
      {
        text: "A weekly manual test of the checkout by the QA team, recorded in a spreadsheet",
        why: "週 1 回では 5 分以内に気付けない。",
      },
    ],
    answer: 0,
    point: "アクセスが無くても壊れたことに気付く＝CloudWatch Synthetics のカナリア。実際の利用者の体験は RUM",
  },
  {
    id: "d5-16",
    tasks: ["5.3"],
    stem: "A media website wants to understand how page load times and JavaScript errors differ by browser, device, and country for its actual visitors, so that it can prioritize front-end fixes. Which service should it use?",
    options: [
      {
        text: "AWS X-Ray traces of the back-end services",
        why: "サーバーの側の要求のつながりを見るもので、ブラウザでの表示時間やエラーは分からない。",
      },
      {
        text: "Amazon CloudWatch Synthetics canaries running from a single Region",
        why: "台本の操作を模すもので、実際の訪問者のブラウザ・端末・国による違いは分からない。",
      },
      {
        text: "VPC Flow Logs analyzed with Amazon Athena by source IP country",
        why: "通信の記録で、ページの表示時間や JavaScript のエラーは含まれない。",
      },
      {
        text: "Amazon CloudWatch RUM",
        why: "正解。RUM（リアルユーザーモニタリング）は実際の利用者のブラウザからページの表示時間やエラーを集め、ブラウザ・端末・地域ごとに分けて見られる。",
      },
    ],
    answer: 3,
    point: "実際の利用者のブラウザでの体験（表示時間・エラー・ブラウザや国の違い）＝CloudWatch RUM",
  },
];
