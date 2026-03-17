# カスタムドメイン設定ガイド（クロスアカウント構成）

このドキュメントでは、クロスアカウント構成でカスタムドメインを設定する手順を説明します。

## 前提条件

### ドメイン管理アカウント側
- Route 53でドメインのホストゾーンを管理
- クロスアカウントアクセス用IAMロールを作成済み（CloudFormation: `CrossAccountRoleStackgenu-devdev`）

### ターゲットアカウント側（アプリケーション側）
- SSL証明書を作成済み（CloudFormation: `CrossAccountCertificateStackgenu-devdev`）
- CloudFrontディストリビューションの作成権限
- 外部証明書の参照権限

## 設定パラメータ

以下のパラメータが `packages/cdk/parameter.ts` の `Dev` 環境に設定されています：

```typescript
hostName: 'dev-use-case',
domainName: 'toyoda-gosei.cloud',
hostedZoneId: 'Z06981541W689JS4J4YWU',
certificateArn: 'arn:aws:acm:us-east-1:014852200397:certificate/cb5c3877-3483-4b18-b54c-ac1e90100a4c',
```

### パラメータの説明

- `hostName`: ホスト名部分（例: `dev-use-case`）
- `domainName`: ドメイン名（例: `toyoda-gosei.cloud`）
- `hostedZoneId`: ドメイン管理アカウントのRoute 53ホストゾーンID
- `certificateArn`: ターゲットアカウントで作成済みのACM証明書ARN（us-east-1リージョン）

完全なURL: `https://dev-use-case.toyoda-gosei.cloud`

## デプロイ手順

### 1. CDKデプロイの実行

```bash
npm run cdk:deploy
```

### 2. CloudFrontドメイン名の取得

デプロイ完了後、以下の出力から CloudFront のドメイン名を確認します：

```
Outputs:
GenerativeAiUseCasesStackDev.CloudFrontDomainName = d1234567890abc.cloudfront.net
GenerativeAiUseCasesStackDev.WebUrl = https://dev-use-case.toyoda-gosei.cloud
```

### 3. CNAMEレコードの作成（手動）

ドメイン管理アカウント側で、Route 53に以下のCNAMEレコードを作成します：

- **レコード名**: `dev-use-case`
- **レコードタイプ**: CNAME
- **値**: `d1234567890abc.cloudfront.net`（手順2で取得したCloudFrontドメイン名）
- **TTL**: 300秒（推奨）

## 実装の詳細

### CloudFrontWafStack

`packages/cdk/lib/cloud-front-waf-stack.ts` では、以下のロジックで証明書を処理します：

1. `certificateArn` が指定されている場合：既存の証明書を参照
2. `certificateArn` が指定されていない場合：新規に証明書を作成（DNS検証付き）

```typescript
if (params.certificateArn) {
  this.cert = Certificate.fromCertificateArn(
    this,
    'Cert',
    params.certificateArn
  );
} else {
  // 新規証明書の作成
}
```

### Web Construct

`packages/cdk/lib/construct/web.ts` では、クロスアカウント構成のため、Route 53のAレコード作成をスキップし、代わりにCloudFrontドメイン名を出力します。

```typescript
// Note: In cross-account setup, DNS records must be created manually in the domain management account
// The CloudFront distribution domain name is output for CNAME record creation
this.webUrl = `https://${props.hostName}.${props.domainName}`;
this.cloudFrontDomainName = cloudFrontWebDistribution.domainName;
```

## トラブルシューティング

### 証明書のリージョン

CloudFrontで使用する証明書は、必ず **us-east-1** リージョンで作成する必要があります。

### CNAMEレコードの伝播

DNSレコードの伝播には最大48時間かかる場合がありますが、通常は数分から数時間で完了します。

### 証明書の検証

カスタムドメインにアクセスする前に、証明書が有効であることを確認してください：

```bash
openssl s_client -connect dev-use-case.toyoda-gosei.cloud:443 -servername dev-use-case.toyoda-gosei.cloud
```

## 参考情報

- [AWS CloudFront カスタムドメイン設定](https://docs.aws.amazon.com/ja_jp/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)
- [クロスアカウント証明書の使用](https://docs.aws.amazon.com/ja_jp/acm/latest/userguide/acm-certificate-sharing.html)
- [Route 53 CNAMEレコード](https://docs.aws.amazon.com/ja_jp/Route53/latest/DeveloperGuide/resource-record-sets-values-alias.html)
