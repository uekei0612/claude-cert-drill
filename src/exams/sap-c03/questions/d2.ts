/* 分野 2：セキュリティ・コンプライアンス・ガバナンス（自作問題） */
import type { Question } from "../../../core/exam/types";

export const d2: Question[] = [
  {
    id: "d2-01",
    tasks: ["2.3"],
    stem: "A company uses AWS Organizations with all features enabled. The security team requires that no one in any member account, including users with AdministratorAccess, can stop or delete AWS CloudTrail trails or leave the organization. What is the MOST effective way to enforce this?",
    options: [
      {
        text: "Attach a permissions boundary to every IAM role and user in each member account that removes the CloudTrail and Organizations actions, and require the same boundary on any new role.",
        why: "管理者は境界を外したり、境界の付いていない新しいロールを作ったりできる。アカウントごとの設定も漏れやすい。",
      },
      {
        text: "Create an AWS Config rule that detects stopped trails and notifies the security team through Amazon SNS.",
        why: "検出であって予防ではない。止められたあとに気付くだけで、組織から抜けることも防げない。",
      },
      {
        text: "Attach a service control policy to the root that denies cloudtrail:StopLogging, cloudtrail:DeleteTrail, and organizations:LeaveOrganization.",
        why: "正解。SCP はメンバーアカウントのすべてのプリンシパル（アカウントのルートユーザーも含む）が使える権限の上限を決め、アカウントの中からは外せない。",
      },
      {
        text: "Remove AdministratorAccess from all users and grant only the specific permissions each team needs.",
        why: "最小権限は大切だが、IAM を編集できる人が残る限り強制にならない。組織全体の不変のガードレールは SCP で置く。",
      },
    ],
    answer: 2,
    point:
      "メンバーアカウントの管理者にもできなくさせる組織全体のガードレールは SCP（拒否）。Config は検出、境界は外せる",
  },
  {
    id: "d2-02",
    tasks: ["2.3"],
    stem: "A company operates 120 accounts in multiple Regions. The security team wants a single place to view and prioritize findings from Amazon GuardDuty, Amazon Inspector, and AWS Config across all accounts and Regions, and new accounts must be included automatically. What should the solutions architect recommend?",
    options: [
      {
        text: "Designate a security account as the delegated administrator for AWS Security Hub and GuardDuty, enable auto-enable for new accounts, and configure cross-Region aggregation.",
        why: "正解。委任管理者は組織の全アカウントの検出結果を集め、新しいアカウントを自動で有効にできる。リージョン間の集約で 1 つのリージョンから全体を見られる。",
      },
      {
        text: "Enable each service separately in every account and Region, and deploy a Lambda function in every account that collects the findings and emails a daily summary to the security team.",
        why: "1 か所で優先度を付けられず、新しいアカウントへの展開も自前になる。メールでは重大な検出結果が埋もれる。",
      },
      {
        text: "Build an Amazon CloudWatch dashboard in the management account that shows metrics from every account.",
        why: "ダッシュボードはメトリクスを見るもので、検出結果の集約や優先度付けの機能は無い。管理アカウントに運用の仕事を置くのも避ける。",
      },
      {
        text: "Turn on AWS Trusted Advisor in every account and review the security checks during monthly meetings.",
        why: "Trusted Advisor は設定のベストプラクティスの点検で、GuardDuty などの検出結果を集めない。月 1 回では遅い。",
      },
    ],
    answer: 0,
    point:
      "組織全体の検出結果の集約は Security Hub（委任管理者＋自動有効化＋リージョン間の集約）。管理アカウントには置かない",
  },
  {
    id: "d2-03",
    tasks: ["2.1"],
    stem: "A third-party monitoring vendor needs read-only access to resources in a company's AWS account. The vendor serves many customers from its own AWS account. The company wants to avoid sharing long-term credentials and to prevent the confused deputy problem. What should the company do?",
    options: [
      {
        text: "Create an IAM user with the ReadOnlyAccess policy, enforce MFA on it, and send the access key to the vendor through an encrypted channel, rotating it every 90 days.",
        why: "長期のアクセスキーを渡すことになり、ローテーションと失効の管理が会社に残る。要件に反する。",
      },
      {
        text: "Create an IAM role that trusts the vendor's account, requires a unique external ID in the trust policy condition, and grants read-only permissions.",
        why: "正解。ロールなら一時的な認証情報で済む。外部 ID は、ベンダーが別の顧客の依頼でこのロールを引き受けさせられる confused deputy を防ぐ。",
      },
      {
        text: "Add a resource-based policy to every resource that allows the vendor's account ID to perform read actions.",
        why: "リソースベースのポリシーを持たないサービスも多く、リソースごとの管理になる。confused deputy への対策にもならない。",
      },
      {
        text: "Create an IAM role that trusts any principal in the vendor's account and rely on the vendor to restrict who uses it.",
        why: "外部 ID が無いと、ベンダーのサービスが他の顧客の依頼でこのロールを使わされる confused deputy を防げない。",
      },
    ],
    answer: 1,
    point: "第三者のアクセスはクロスアカウントのロール＋外部 ID（confused deputy 対策）。長期のアクセスキーは渡さない",
  },
  {
    id: "d2-04",
    tasks: ["2.2", "2.1"],
    stem: "Objects in an S3 bucket in a data account are encrypted with SSE-KMS using the AWS managed key aws/s3. An analytics account now needs to read these objects. Cross-account bucket access has been granted, but reads fail with AccessDenied on the KMS decrypt call. What should the solutions architect do?",
    options: [
      {
        text: "Edit the key policy of the aws/s3 key to allow kms:Decrypt for the analytics account.",
        why: "AWS マネージドキーのキーポリシーは利用者が変更できない。そのためアカウント間で使えない。",
      },
      {
        text: "Grant the analytics account's role kms:Decrypt and kms:GenerateDataKey on all keys with an IAM policy in the analytics account, and add the role to the bucket policy.",
        why: "キーを持つ側のキーポリシーが相手のアカウントを許していなければ、相手側の IAM ポリシーだけでは使えない。",
      },
      {
        text: "Disable default encryption on the bucket so that the analytics account can read the existing objects.",
        why: "既存のオブジェクトは暗号化されたまま変わらない。暗号化をやめるのはセキュリティの後退でもある。",
      },
      {
        text: "Re-encrypt the objects with a customer managed key whose key policy allows the analytics account, and grant kms:Decrypt to the reader role in that account.",
        why: "正解。アカウント間で使うには、キーポリシーを編集できるカスタマーマネージドキーが要る。キーポリシーと相手側の IAM ポリシーの両方で許す。",
      },
    ],
    answer: 3,
    point:
      "アカウント間で使う KMS キーはカスタマーマネージドキー。キーポリシー（持ち主）と IAM ポリシー（使う側）の両方で許す",
  },
  {
    id: "d2-05",
    tasks: ["2.3"],
    stem: "A company is starting its AWS adoption and expects to create dozens of accounts for different teams. It wants a governed multi-account environment with preventive and detective guardrails, centralized logging, and a self-service way to create new accounts with a standard baseline, and it wants to set this up quickly using AWS best practices. What should it use?",
    options: [
      {
        text: "AWS Control Tower to set up the landing zone, apply controls, and provision accounts through Account Factory",
        why: "正解。Control Tower は Organizations・ログアーカイブ／監査アカウント・ガードレール（コントロール）・アカウントの払い出しをベストプラクティスの形でまとめて用意する。",
      },
      {
        text: "A single AWS account with a separate VPC and IAM group for each team",
        why: "アカウントは最も強い分離の境界で、1 つにまとめると権限・上限・請求の分離が効かない。マルチアカウントの要件にも合わない。",
      },
      {
        text: "Standalone accounts created by each team with their own credit cards and joined later with consolidated billing",
        why: "作る時点でガードレールも基本設定も無く、統制されていない。あとから揃えるのは手間が大きい。",
      },
      {
        text: "AWS Organizations with custom scripts that create accounts, attach SCPs, and configure CloudTrail in each new account",
        why: "同じことは作れるが、ランディングゾーンを一から組んで保守することになる。「素早く・ベストプラクティスで」なら Control Tower。",
      },
    ],
    answer: 0,
    point: "統制されたマルチアカウント環境を素早く＝Control Tower（ランディングゾーン・コントロール・Account Factory）",
  },
  {
    id: "d2-06",
    tasks: ["2.4", "2.3"],
    stem: "An organization with 200 accounts must keep an immutable record of all API activity in every account and Region for seven years. Account administrators must not be able to modify or delete the logs, and new accounts must be covered automatically. Which solution meets these requirements?",
    options: [
      {
        text: "Create a trail in each account and Region that delivers logs to an S3 bucket in the same account with versioning and MFA Delete enabled, and have each account owner review the trail settings monthly.",
        why: "ログが同じアカウントにあると、そのアカウントの管理者が消せる。新しいアカウントへの設定も漏れやすい。",
      },
      {
        text: "Enable CloudTrail Event history in every account and export it to a spreadsheet every quarter.",
        why: "イベント履歴は 90 日分しか残らない。手作業の書き出しは改ざん防止にもならない。",
      },
      {
        text: "Send VPC Flow Logs from every account to a central Amazon CloudWatch Logs log group with a seven-year retention.",
        why: "フローログはネットワークの通信の記録で、API の操作は記録しない。",
      },
      {
        text: "Create an organization trail that delivers to an S3 bucket in a dedicated log archive account, protected with S3 Object Lock and a bucket policy that denies deletion.",
        why: "正解。組織の証跡は新しいアカウントも含めて全アカウントを記録し、メンバーアカウントからは変更できない。別アカウント＋Object Lock で改ざんと削除を防ぐ。",
      },
    ],
    answer: 3,
    point: "全アカウントの API 操作の改ざん不能な保管＝組織の証跡→ログアーカイブアカウントの S3（Object Lock）",
  },
  {
    id: "d2-07",
    tasks: ["2.1"],
    stem: "Employees authenticate with the company's existing SAML 2.0 identity provider. They need access to many AWS accounts with different permission levels per account, and access must be removed immediately when an employee leaves. Which approach requires the LEAST ongoing administration?",
    options: [
      {
        text: "Create IAM users for every employee in every account and disable them when the employee leaves.",
        why: "アカウント × 社員の数だけユーザーができ、退職時に消し漏れが起きやすい。長期の認証情報も増える。",
      },
      {
        text: "Create one shared IAM user per team and rotate the password whenever someone leaves.",
        why: "共有の認証情報は誰が操作したかを追えない。辞めるたびの変更も運用として重い。",
      },
      {
        text: "Connect the IdP to AWS IAM Identity Center with SCIM provisioning and assign permission sets to groups for each account.",
        why: "正解。ID は既存の IdP で一元管理し、SCIM でユーザーとグループを同期する。IdP で無効にすればすべてのアカウントへのアクセスが止まる。",
      },
      {
        text: "Configure a separate SAML federation with the IdP in each account, and maintain the role mappings and trust policies in each account's IAM configuration.",
        why: "動くが、アカウントの数だけ IdP の設定とロールの対応を保守することになる。Identity Center なら 1 か所で済む。",
      },
    ],
    answer: 2,
    point: "社員の複数アカウントへのアクセスは IAM Identity Center（外部 IdP＋SCIM＋許可セット）",
  },
  {
    id: "d2-08",
    tasks: ["2.4", "5.1"],
    stem: "A new application stores Amazon RDS for MySQL credentials. Security policy requires that the database password be rotated every 30 days without changing application code or causing downtime, and that every access to the secret be logged. Which solution meets these requirements?",
    options: [
      {
        text: "Store the password in AWS Secrets Manager with automatic rotation every 30 days, and have the application retrieve the secret at runtime.",
        why: "正解。Secrets Manager は RDS のパスワードの交換を組み込みで持ち、データベースとシークレットを一緒に更新する。取得は CloudTrail に記録される。",
      },
      {
        text: "Store the password as an environment variable in the application's launch template and update the template monthly.",
        why: "平文で残り、変えるたびにインスタンスの入れ替えが要る。アクセスの記録も取れない。",
      },
      {
        text: "Hardcode the password in the AMI and build a new AMI every 30 days.",
        why: "AMI を見られる人は誰でも読め、変えるたびに作り直しと入れ替えが要る。",
      },
      {
        text: "Store the password as a SecureString parameter in Systems Manager Parameter Store and let Parameter Store rotate it automatically every 30 days.",
        why: "Parameter Store には自動の交換の機能が無い。暗号化して置けても、交換は自前で作る必要がある。",
      },
    ],
    answer: 0,
    point: "DB の認証情報の自動交換＝Secrets Manager（自動ローテーション）。Parameter Store には自動交換が無い",
  },
  {
    id: "d2-09",
    tasks: ["2.4", "1.1"],
    stem: "A company serves private images from an Amazon S3 bucket through Amazon CloudFront. Users must not be able to bypass CloudFront by requesting objects directly from the S3 bucket. The bucket uses SSE-KMS encryption. What should the solutions architect do?",
    options: [
      {
        text: "Make the bucket public but give it a long random name so that it cannot be guessed.",
        why: "名前を隠すだけで、知られれば誰でも直接読める。アクセス制御になっていない。",
      },
      {
        text: "Configure an origin access control (OAC) on the distribution and a bucket policy that allows only the CloudFront service principal for that distribution.",
        why: "正解。OAC は CloudFront からの要求に署名し、バケットポリシーはそのディストリビューションだけを許す。OAC は SSE-KMS のオブジェクトにも対応する（キーポリシーで CloudFront に復号を許す）。",
      },
      {
        text: "Use the S3 static website endpoint as the origin and restrict access with a Referer header check.",
        why: "ウェブサイトのエンドポイントは公開が前提で、Referer は誰でも偽装できる。",
      },
      {
        text: "Generate presigned S3 URLs for every image and embed them in the web pages.",
        why: "署名付き URL は S3 に直接取りに行くので、CloudFront を経由させるという要件と逆になる。",
      },
    ],
    answer: 1,
    point: "S3 を CloudFront 経由だけにする＝OAC＋バケットポリシー（SSE-KMS も可）。旧来の OAI より OAC",
  },
  {
    id: "d2-10",
    tasks: ["2.1"],
    stem: "Administrators currently connect to Linux EC2 instances in private subnets through a bastion host that allows SSH from the internet. The security team wants to remove inbound SSH entirely, avoid managing SSH keys, and record every session for auditing. What should the solutions architect recommend?",
    options: [
      {
        text: "Restrict the bastion's security group to the corporate IP range and rotate the SSH keys monthly.",
        why: "入ってくる SSH もキーの管理も残る。セッションの記録も無い。",
      },
      {
        text: "Use AWS Systems Manager Session Manager with the SSM Agent and an instance profile, and send session logs to Amazon S3 or CloudWatch Logs.",
        why: "正解。Session Manager は入ってくるポートを開けずにシェルを使え、SSH キーが要らない。アクセスは IAM で制御し、操作の記録を残せる。",
      },
      {
        text: "Move the instances to public subnets and allow SSH only from administrators' home IP addresses.",
        why: "インスタンスを直接さらすことになり、要件と逆。キーの管理も残る。",
      },
      {
        text: "Replace the bastion with an AWS Client VPN endpoint and continue to use SSH keys.",
        why: "経路は守れるが、キーの管理も SSH も残り、セッションの記録も無い。",
      },
    ],
    answer: 1,
    point: "入ってくるポートもキーも無しでシェル＋記録＝Systems Manager Session Manager",
  },
  {
    id: "d2-11",
    tasks: ["2.4"],
    stem: "After an audit, a company must find which of its 3,000 S3 buckets across 40 accounts contain personally identifiable information such as passport numbers and credit card numbers, and it must keep monitoring new data. Which service should be used?",
    options: [
      {
        text: "Amazon GuardDuty with S3 Protection",
        why: "GuardDuty は S3 への怪しい操作（脅威）を見つけるもので、オブジェクトの中に個人情報があるかは調べない。",
      },
      {
        text: "Amazon Inspector",
        why: "Inspector は EC2・コンテナイメージ・Lambda の脆弱性を調べるもので、S3 のデータは見ない。",
      },
      {
        text: "AWS Config with the s3-bucket-public-read-prohibited and s3-bucket-ssl-requests-only managed rules",
        why: "公開の設定は確かめられるが、中身の個人情報は分からない。",
      },
      {
        text: "Amazon Macie with a delegated administrator account and automated sensitive data discovery",
        why: "正解。Macie は機械学習とパターンで S3 の中の個人情報などを見つける。組織の全アカウントをまとめ、自動の検出で見張り続けられる。",
      },
    ],
    answer: 3,
    point: "S3 の中の個人情報の発見＝Macie。GuardDuty は脅威、Inspector は脆弱性",
  },
  {
    id: "d2-12",
    tasks: ["2.1"],
    stem: "Over the years, teams have added resource-based policies to S3 buckets, KMS keys, IAM roles, and Lambda functions. The security team needs to find every resource that grants access to principals outside the organization and to be alerted when new external access is created. What should it use?",
    options: [
      {
        text: "IAM Access Analyzer with the organization as the zone of trust",
        why: "正解。外部アクセスのアナライザーは、リソースベースのポリシーを論理的に解析して、信頼ゾーン（組織）の外へのアクセスを検出結果として出し、変更があれば新しく見つける。",
      },
      {
        text: "IAM credential reports downloaded from every account",
        why: "認証情報レポートはユーザーのパスワードやキーの状態の一覧で、リソースのポリシーは見ない。",
      },
      {
        text: "AWS CloudTrail Insights on the organization trail",
        why: "Insights は API の呼び出しの量の異常を見つけるもので、ポリシーが外部に開いているかは見ない。",
      },
      {
        text: "A weekly manual review of all bucket policies by the security team",
        why: "S3 以外が漏れ、規模的にも続かない。変更にすぐ気付けない。",
      },
    ],
    answer: 0,
    point: "組織の外へ開いているリソースの発見＝IAM Access Analyzer（信頼ゾーン＝組織）",
  },
  {
    id: "d2-13",
    tasks: ["2.3", "5.2"],
    stem: "A company deploys container images from Amazon ECR to Amazon ECS and also runs a fleet of EC2 instances. It wants continuous scanning for software vulnerabilities in both the images and the instances, with findings re-evaluated automatically when new CVEs are published. What should it enable?",
    options: [
      {
        text: "Amazon GuardDuty Runtime Monitoring",
        why: "動いているワークロードの怪しい振る舞いを見つけるもので、ソフトウェアの脆弱性の一覧は出さない。",
      },
      {
        text: "AWS Security Hub only, without any other service",
        why: "Security Hub は検出結果を集めて点検するもので、自分でイメージの脆弱性は調べない。",
      },
      {
        text: "Amazon Inspector with EC2 scanning and ECR enhanced scanning",
        why: "正解。Inspector は EC2・ECR のイメージ・Lambda を継続的に調べ、新しい CVE が出ると自動で評価し直す。",
      },
      {
        text: "AWS Config rules that check whether instances use the latest AMI",
        why: "AMI の新しさは脆弱性の有無を表さず、コンテナイメージも見ない。",
      },
    ],
    answer: 2,
    point: "EC2・ECR のイメージ・Lambda の継続的な脆弱性の検査＝Amazon Inspector",
  },
  {
    id: "d2-14",
    tasks: ["2.1"],
    stem: "A legacy application on EC2 reads an IAM user's access key and secret key from a configuration file to call Amazon S3 and Amazon SQS. The same key has not been rotated in three years. What is the BEST way to improve security?",
    options: [
      {
        text: "Rotate the access key every 90 days with a script that updates the configuration file.",
        why: "良くはなるが、長期の認証情報をファイルに置くことは変わらず、漏れる危険が残る。",
      },
      {
        text: "Encrypt the configuration file with a KMS key.",
        why: "復号のための権限がまた要り、長期のキーを持つことは変わらない。",
      },
      {
        text: "Store the access key in Secrets Manager and retrieve it at startup.",
        why: "置き場所は良くなるが、EC2 にはもっと良い方法（ロール）がある。長期のキーを使い続ける理由が無い。",
      },
      {
        text: "Attach an IAM role with least-privilege permissions to the instance through an instance profile, remove the key from the file, and deactivate the IAM user's key.",
        why: "正解。インスタンスのロールは、自動で替わる一時的な認証情報を SDK に渡す。長期のキーを持たないことが一番の対策。",
      },
    ],
    answer: 3,
    point:
      "EC2 の上のアプリケーションはロール（インスタンスプロファイル）で一時的な認証情報。長期のアクセスキーは使わない",
  },
  {
    id: "d2-15",
    tasks: ["2.2"],
    stem: "A compliance policy requires that the encryption key protecting customer data in several AWS services be rotated every year. The applications must keep decrypting data that was encrypted before each rotation, without any code changes or re-encryption jobs. The company uses symmetric AWS KMS customer managed keys whose key material was generated by AWS KMS. What should the solutions architect do?",
    options: [
      {
        text: "Enable automatic key rotation on the customer managed keys.",
        why: "正解。自動のローテーションは毎年（既定は 365 日）新しい鍵の素材を作り、古い素材も残すので、以前の暗号文も同じキー ID で復号できる。アプリケーションの変更は要らない。",
      },
      {
        text: "Create a new KMS key every year, update every application to use the new key ID, and re-encrypt all existing data with it.",
        why: "手で替えることはできるが、コードの変更と暗号化し直しが要り、要件に反する。",
      },
      {
        text: "Switch to keys with imported key material and rely on automatic rotation of the imported material every 365 days.",
        why: "取り込んだ素材のキーは自動のローテーションに対応していない（手での即時のローテーションはできる）。素材の管理の手間も増える。",
      },
      {
        text: "Replace the keys with asymmetric RSA keys, which AWS KMS rotates automatically every year.",
        why: "非対称のキーは自動のローテーションに対応していない。多くの AWS のサービスのデータの暗号化には対称のキーを使う。",
      },
    ],
    answer: 0,
    point: "KMS の自動ローテーションは対称・KMS が作った素材のキーだけ。古い素材も残るので以前の暗号文も復号できる",
  },
  {
    id: "d2-16",
    tasks: ["2.2"],
    stem: "A device manufacturer signs firmware images that devices will verify for the next 15 years. The security team is concerned that future quantum computers could forge classical signatures, so it wants to sign new firmware with a post-quantum digital signature algorithm while keeping the private key in AWS KMS. Which KMS key should be used?",
    options: [
      {
        text: "An RSA_4096 asymmetric key, because a longer key length makes signatures resistant to quantum attacks",
        why: "RSA は鍵を長くしても量子のアルゴリズムで破られうる方式で、耐量子にはならない。",
      },
      {
        text: "An ML-KEM key, which is the post-quantum algorithm in AWS KMS for creating and verifying signatures",
        why: "ML-KEM は鍵の確立（カプセル化）のための方式で、署名には使えない。",
      },
      {
        text: "An asymmetric key with an ML-DSA key spec (for example ML_DSA_65) used for signing and verification",
        why: "正解。AWS KMS は耐量子の電子署名の方式 ML-DSA（ML_DSA_44／65／87）の非対称キーを提供し、秘密鍵を KMS の外に出さずに署名できる。",
      },
      {
        text: "An HMAC key, because symmetric algorithms are not affected by quantum computers",
        why: "HMAC は同じ鍵を持つ相手しか検証できず、機器に秘密を配ることになる。公開鍵で検証する署名の代わりにならない。",
      },
    ],
    answer: 2,
    point: "耐量子の署名＝KMS の ML-DSA キー。ML-KEM は鍵の確立用で署名には使えない",
  },
  {
    id: "d2-17",
    tasks: ["2.2", "2.4"],
    stem: "A payment processor must store its encryption keys in hardware security modules that are dedicated to the company (single-tenant) and over which it has exclusive control. Its applications use the PKCS #11 and JCE interfaces. Which service meets these requirements?",
    options: [
      {
        text: "AWS KMS customer managed keys with a key policy that allows only the payment application's role",
        why: "KMS の HSM は AWS が管理する共用のもので、自社専用・自社だけが制御する HSM という要件を満たさない。",
      },
      {
        text: "AWS Secrets Manager with a resource policy and automatic rotation",
        why: "Secrets Manager は認証情報などの秘密を保管するもので、HSM ではない。",
      },
      {
        text: "AWS CloudHSM",
        why: "正解。CloudHSM はシングルテナントの HSM を提供し、鍵は利用者だけが制御する。PKCS #11・JCE などの標準のインターフェイスを使える。",
      },
      {
        text: "Amazon S3 with SSE-S3 encryption and S3 Object Lock in compliance mode",
        why: "鍵は S3 が管理し、利用者は HSM も鍵も制御しない。",
      },
    ],
    answer: 2,
    point: "自社専用で自社だけが制御する HSM（PKCS #11・JCE）＝CloudHSM。KMS の HSM は AWS が管理する共用",
  },
  {
    id: "d2-18",
    tasks: ["2.4", "2.5"],
    stem: "A regulated insurer uses Amazon Bedrock models in a claims application. Auditors require a record of the full prompts and model responses for every model invocation, retained for seven years. What should the solutions architect do?",
    options: [
      {
        text: "Rely on AWS CloudTrail management events, which record each invocation together with the full prompt and response text.",
        why: "CloudTrail は API の呼び出しの記録で、プロンプトと応答の全文の記録にはモデルの呼び出しのログを使う。",
      },
      {
        text: "Turn on Amazon Bedrock model invocation logging (it is off by default) to an S3 bucket in the same Region, and protect the bucket with S3 Object Lock and a seven-year retention.",
        why: "正解。モデル呼び出しのログは要求と応答の全文を CloudWatch Logs や S3 に残す。既定では無効なので有効にする。改ざんを防ぎ保持するには Object Lock を使う。",
      },
      {
        text: "Ask users to export their chat history from the application every month and email it to the compliance team.",
        why: "漏れが出て、改ざんも防げない。",
      },
      {
        text: "Enable VPC Flow Logs on the subnets that call the Bedrock endpoint.",
        why: "フローログは IP とポートの通信の記録で、プロンプトや応答の中身は残らない。",
      },
    ],
    answer: 1,
    point:
      "生成 AI のプロンプトと応答の監査証跡＝Bedrock のモデル呼び出しのログ（既定で無効）。CloudTrail は API の呼び出しの記録",
  },
  {
    id: "d2-19",
    tasks: ["2.5"],
    stem: "A bank's customer-facing chatbot built on Amazon Bedrock must refuse to give investment advice, must block hateful or violent content in both user inputs and model outputs, and must mask customer account numbers and other PII in responses. The rules must be applied consistently across several models. What should the solutions architect use?",
    options: [
      {
        text: "Add the rules to each model's system prompt and ask the model to follow them strictly.",
        why: "プロンプトの指示は確率的にしか守られず、モデルごとに振る舞いもそろわない。",
      },
      {
        text: "Write a Lambda function with a list of banned words that scans responses before they are returned.",
        why: "単語の一覧では言い換えや文脈を捉えられず、入力側も個人情報の伏せ字も扱いにくい。",
      },
      {
        text: "Fine-tune each model on examples of refusals and masked responses so that it learns the rules.",
        why: "学習は範囲外の重い作業で、守られる保証も無い。モデルごとに作り直しになる。",
      },
      {
        text: "Create an Amazon Bedrock guardrail with a denied topic for investment advice, content filters, and a sensitive information filter that masks PII, and apply it to every model invocation.",
        why: "正解。Bedrock Guardrails は拒否するトピック・有害な内容のフィルター・個人情報を止めたり伏せたりするフィルターを、入力と出力の両方にモデルによらず同じに適用できる。",
      },
    ],
    answer: 3,
    point: "生成 AI の入力と出力の統制（拒否するトピック・有害な内容・個人情報の伏せ字）＝Bedrock Guardrails",
  },
  {
    id: "d2-20",
    tasks: ["2.5", "1.2"],
    stem: "A RAG application sometimes returns answers that are not supported by the retrieved documents. The business wants responses that are not grounded in the source content, or that are not relevant to the user's question, to be detected and blocked automatically before they reach users. What should the solutions architect add?",
    options: [
      {
        text: "A contextual grounding check in an Amazon Bedrock guardrail with grounding and relevance thresholds",
        why: "正解。contextual grounding check は、応答が参照の内容に基づいているか（根拠）と質問に関係するか（関連性）を点数にし、しきい値を下回る応答を止める。",
      },
      {
        text: "A higher temperature setting so that the model explores more possible answers",
        why: "temperature を上げると出力のばらつきが増え、根拠の無い答えはむしろ増えうる。",
      },
      {
        text: "A larger number of retrieved chunks for every query, with all top results included in the prompt so that the model always has enough supporting evidence",
        why: "関係の薄い内容も混ざりうり、根拠の無い答えを見つけて止める仕組みにはならない。",
      },
      {
        text: "A CloudWatch alarm on the model's invocation latency",
        why: "遅延は答えの正しさを表さない。",
      },
    ],
    answer: 0,
    point: "RAG の根拠の無い・関係の無い応答を止める＝Guardrails の contextual grounding check",
  },
  {
    id: "d2-21",
    tasks: ["2.5", "1.1"],
    stem: "An AI agent proposes refunds for customer complaints. Company policy requires that any refund over $500 be approved by a human supervisor before it is issued, and the process may wait for up to two days for the approval. Which design meets this requirement?",
    options: [
      {
        text: "Instruct the agent in its system prompt to issue refunds over $500 only when it is confident that they are justified.",
        why: "モデルの判断に任せるのは人の承認ではない。方針は決定的に守らせる必要がある。",
      },
      {
        text: "Have the agent call the refund API directly and send the supervisor an email notification after each large refund is issued.",
        why: "出したあとの通知で、事前の承認になっていない。",
      },
      {
        text: "Orchestrate the refund with an AWS Step Functions Standard workflow that, for amounts over $500, pauses on a task with .waitForTaskToken until the supervisor's approval returns the token.",
        why: "正解。タスクトークンのコールバックで人の承認を待てる（Standard ワークフローは長く待てる）。承認されたときだけ返金の手順に進む。",
      },
      {
        text: "Run the agent in a Lambda function with a 2-day timeout that waits for a reply to the approval email.",
        why: "Lambda の 1 回の実行は最大 15 分で、2 日は待てない。",
      },
    ],
    answer: 2,
    point:
      "AI の操作の人による承認＝Step Functions の .waitForTaskToken（コールバック）。プロンプトの指示や事後の通知では足りない",
  },
];
