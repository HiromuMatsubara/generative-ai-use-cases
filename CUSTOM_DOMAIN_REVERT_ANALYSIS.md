# カスタムドメイン設定の変更箇所分析

## 調査結果サマリー

CUSTOM_DOMAIN_SETUP.mdに記載されている変更箇所は**不完全**です。実際には以下の追加変更が含まれています：

1. カスタムドメイン関連の変更（元に戻す対象）
2. Cognito既存リソース参照への変更（カスタムドメインとは無関係）
3. RAG機能のコメントアウト（カスタムドメインとは無関係）
4. その他の機能追加（SharePoint、transcribe非表示など）

---

## 1. カスタムドメイン関連の変更（元に戻す対象）

### 1.1 `packages/cdk/parameter.ts`

**変更内容:**
- `hostName: 'dev-use-case'` の追加
- `domainName: 'toyoda-gosei.cloud'` の追加
- `hostedZoneId: 'Z06981541W689JS4J4YWU'` の追加
- `certificateArn: 'arn:aws:acm:us-east-1:014852200397:certificate/...'` の追加

**元に戻す方法:**
これらの4つのパラメータを削除またはnullに設定

---

### 1.2 `packages/cdk/lib/stack-input.ts`

**変更内容:**
```typescript
certificateArn: z.string().nullish(), // 追加
```

**元に戻す方法:**
この行を削除

---

### 1.3 `packages/cdk/lib/cloud-front-waf-stack.ts`

**変更内容:**
- 既存証明書ARNを参照する分岐処理を追加
- `params.certificateArn` が指定されている場合は既存証明書を使用

**元に戻す方法:**
```typescript
// 変更後（現在）
if (params.certificateArn) {
  this.cert = Certificate.fromCertificateArn(
    this,
    'Cert',
    params.certificateArn
  );
} else {
  // Create new certificate with DNS validation
  const hostedZone = HostedZone.fromHostedZoneAttributes(...);
  const cert = new Certificate(this, 'Cert', {...});
  this.cert = cert;
}

// 元のコード
const hostedZone = HostedZone.fromHostedZoneAttributes(
  this,
  'HostedZone',
  {
    hostedZoneId: params.hostedZoneId,
    zoneName: params.domainName,
  }
);
const cert = new Certificate(this, 'Cert', {
  domainName: `${params.hostName}.${params.domainName}`,
  validation: CertificateValidation.fromDns(hostedZone),
});
this.cert = cert;
```

---

### 1.4 `packages/cdk/lib/construct/web.ts`

**変更内容:**
1. Route 53関連のインポートをコメントアウト
2. `cloudFrontDomainName` プロパティを追加
3. Route 53のAレコード作成処理をコメントアウト
4. CloudFrontドメイン名を出力に追加

**元に戻す方法:**
```typescript
// インポートのコメントアウトを解除
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';

// cloudFrontDomainNameプロパティを削除
export class Web extends Construct {
  public readonly webUrl: string;
  // public readonly cloudFrontDomainName?: string; // この行を削除
}

// Route 53のAレコード作成処理のコメントアウトを解除
if (
  props.cert &&
  props.hostName &&
  props.domainName &&
  props.hostedZoneId
) {
  // DNS record for custom domain
  const hostedZone = HostedZone.fromHostedZoneAttributes(
    this,
    'HostedZone',
    {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    }
  );
  new ARecord(this, 'ARecord', {
    zone: hostedZone,
    recordName: props.hostName,
    target: RecordTarget.fromAlias(
      new CloudFrontTarget(cloudFrontWebDistribution)
    ),
  });
  this.webUrl = `https://${props.hostName}.${props.domainName}`;
  // this.cloudFrontDomainName = cloudFrontWebDistribution.domainName; // この行を削除
} else {
  this.webUrl = `https://${cloudFrontWebDistribution.domainName}`;
}
```

---

### 1.5 `packages/cdk/lib/generative-ai-use-cases-stack.ts`

**変更内容:**
- CloudFrontドメイン名の出力を追加

**元に戻す方法:**
以下のコードブロックを削除：
```typescript
// CloudFrontドメイン名を出力に追加し、CNAMEレコード作成時に参照できるように
if (web.cloudFrontDomainName) {
  new CfnOutput(this, 'CloudFrontDomainName', {
    value: web.cloudFrontDomainName,
    description: 'CloudFront domain name for CNAME record creation in domain management account',
  });
}
```

---

## 2. カスタムドメインとは無関係の変更（今回は元に戻さない）

### 2.1 Cognito既存リソース参照への変更

**影響ファイル:**
- `packages/cdk/lib/construct/auth.ts`
- `packages/cdk/lib/generative-ai-use-cases-stack.ts`
- `packages/cdk/lib/stack-input.ts`
- `packages/cdk/parameter.ts`

**変更内容:**
- 新規Cognito作成から既存Cognito参照に変更
- `cognitoUserPoolId`, `cognitoAppClientId`, `cognitoIdpoolName` パラメータの追加
- `UserPool` → `IUserPool`, `UserPoolClient` → `IUserPoolClient` への型変更

**判断:** これはカスタムドメインとは無関係の変更

---

### 2.2 RAG機能のコメントアウト

**影響ファイル:**
- `packages/cdk/lib/generative-ai-use-cases-stack.ts`

**変更内容:**
- Rag, RagKnowledgeBaseのインポートとコードをコメントアウト

**判断:** これはカスタムドメインとは無関係の変更

---

### 2.3 その他の機能追加

**影響ファイル:**
- `packages/cdk/lib/stack-input.ts`
- `packages/cdk/lib/construct/web.ts`
- `packages/cdk/parameter.ts`

**変更内容:**
- `sharepointRedirectUrl` の追加
- `cloudfrontHostname` の追加（これはカスタムドメイン関連かもしれないが、フロントエンド用の設定）
- `transcribe` 非表示オプションの追加

**判断:** これらはカスタムドメインとは無関係の機能追加

---

## 3. 元のコード（カスタムドメインなし）に戻す手順

### ステップ1: parameter.tsの修正
以下の4行を削除：
```typescript
hostName: 'dev-use-case',
domainName: 'toyoda-gosei.cloud',
hostedZoneId: 'Z06981541W689JS4J4YWU',
certificateArn: 'arn:aws:acm:us-east-1:014852200397:certificate/cb5c3877-3483-4b18-b54c-ac1e90100a4c',
```

### ステップ2: stack-input.tsの修正
`certificateArn: z.string().nullish(),` の行を削除

### ステップ3: cloud-front-waf-stack.tsの修正
証明書参照の分岐処理を元のシンプルな実装に戻す

**変更前（現在のカスタムドメイン対応コード）:**
```typescript
if (params.hostName && params.domainName && params.hostedZoneId) {
  // 既存の証明書を参照する
  if (params.certificateArn) {
    this.cert = Certificate.fromCertificateArn(
      this,
      'Cert',
      params.certificateArn
    );
  } else {
    // Create new certificate with DNS validation
    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: params.hostedZoneId,
        zoneName: params.domainName,
      }
    );
    const cert = new Certificate(this, 'Cert', {
      domainName: `${params.hostName}.${params.domainName}`,
      validation: CertificateValidation.fromDns(hostedZone),
    });
    this.cert = cert;
  }
}
```

**変更後（元のコード）:**
```typescript
if (params.hostName && params.domainName && params.hostedZoneId) {
  const hostedZone = HostedZone.fromHostedZoneAttributes(
    this,
    'HostedZone',
    {
      hostedZoneId: params.hostedZoneId,
      zoneName: params.domainName,
    }
  );
  const cert = new Certificate(this, 'Cert', {
    domainName: `${params.hostName}.${params.domainName}`,
    validation: CertificateValidation.fromDns(hostedZone),
  });
  this.cert = cert;
}
```

### ステップ4: web.tsの修正

**4-1. インポート部分の修正**

変更前（現在）:
```typescript
//import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'; // Route53関連のインポートが不要なのでコメントアウト
//import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'; // Route53関連のインポートが不要なのでコメントアウト
```

変更後（元のコード）:
```typescript
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
```

**4-2. クラスプロパティの修正**

変更前（現在）:
```typescript
export class Web extends Construct {
  public readonly webUrl: string;
  public readonly cloudFrontDomainName?: string;
```

変更後（元のコード）:
```typescript
export class Web extends Construct {
  public readonly webUrl: string;
```

**4-3. Route 53レコード作成処理の修正**

変更前（現在）:
```typescript
if (
  props.cert &&
  props.hostName &&
  props.domainName &&
  props.hostedZoneId
) {
  // Note: In cross-account setup, DNS records must be created manually in the domain management account
  // The CloudFront distribution domain name is output for CNAME record creation
  /*const hostedZone = HostedZone.fromHostedZoneAttributes(
    this,
    'HostedZone',
    {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    }
  );
  new ARecord(this, 'ARecord', {
    zone: hostedZone,
    recordName: props.hostName,
    target: RecordTarget.fromAlias(
      new CloudFrontTarget(cloudFrontWebDistribution)
    ),
  });*/
  this.webUrl = `https://${props.hostName}.${props.domainName}`;
  this.cloudFrontDomainName = cloudFrontWebDistribution.domainName;
} else {
  this.webUrl = `https://${cloudFrontWebDistribution.domainName}`;
}
```

変更後（元のコード）:
```typescript
if (
  props.cert &&
  props.hostName &&
  props.domainName &&
  props.hostedZoneId
) {
  // DNS record for custom domain
  const hostedZone = HostedZone.fromHostedZoneAttributes(
    this,
    'HostedZone',
    {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    }
  );
  new ARecord(this, 'ARecord', {
    zone: hostedZone,
    recordName: props.hostName,
    target: RecordTarget.fromAlias(
      new CloudFrontTarget(cloudFrontWebDistribution)
    ),
  });
  this.webUrl = `https://${props.hostName}.${props.domainName}`;
} else {
  this.webUrl = `https://${cloudFrontWebDistribution.domainName}`;
}
```

### ステップ5: generative-ai-use-cases-stack.tsの修正

以下のコードブロックを削除：
```typescript
// CloudFrontドメイン名を出力に追加し、CNAMEレコード作成時に参照できるように
if (web.cloudFrontDomainName) {
  new CfnOutput(this, 'CloudFrontDomainName', {
    value: web.cloudFrontDomainName,
    description: 'CloudFront domain name for CNAME record creation in domain management account',
  });
}
```

---

## 4. 現在の状態（カスタムドメイン対応）に戻す手順

将来、再度カスタムドメイン設定が必要になった場合の手順です。

### ステップ1: parameter.tsの修正
`Dev` 環境設定に以下の4行を追加：
```typescript
hostName: 'dev-use-case',
domainName: 'toyoda-gosei.cloud',
hostedZoneId: 'Z06981541W689JS4J4YWU',
certificateArn: 'arn:aws:acm:us-east-1:014852200397:certificate/cb5c3877-3483-4b18-b54c-ac1e90100a4c',
```

### ステップ2: stack-input.tsの修正
`baseStackInputSchema` に以下を追加（197行目付近、`hostedZoneId` の後）：
```typescript
certificateArn: z.string().nullish(), // 追加
```

### ステップ3: cloud-front-waf-stack.tsの修正

**変更前（元のコード）:**
```typescript
if (params.hostName && params.domainName && params.hostedZoneId) {
  const hostedZone = HostedZone.fromHostedZoneAttributes(
    this,
    'HostedZone',
    {
      hostedZoneId: params.hostedZoneId,
      zoneName: params.domainName,
    }
  );
  const cert = new Certificate(this, 'Cert', {
    domainName: `${params.hostName}.${params.domainName}`,
    validation: CertificateValidation.fromDns(hostedZone),
  });
  this.cert = cert;
}
```

**変更後（カスタムドメイン対応コード）:**
```typescript
if (params.hostName && params.domainName && params.hostedZoneId) {
  // 既存の証明書を参照する
  if (params.certificateArn) {
    this.cert = Certificate.fromCertificateArn(
      this,
      'Cert',
      params.certificateArn
    );
  } else {
    // Create new certificate with DNS validation
    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: params.hostedZoneId,
        zoneName: params.domainName,
      }
    );
    const cert = new Certificate(this, 'Cert', {
      domainName: `${params.hostName}.${params.domainName}`,
      validation: CertificateValidation.fromDns(hostedZone),
    });
    this.cert = cert;
  }
}
```

### ステップ4: web.tsの修正

**4-1. インポート部分の修正**

変更前（元のコード）:
```typescript
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
```

変更後（カスタムドメイン対応）:
```typescript
//import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'; // Route53関連のインポートが不要なのでコメントアウト
//import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'; // Route53関連のインポートが不要なのでコメントアウト
```

**4-2. クラスプロパティの修正**

変更前（元のコード）:
```typescript
export class Web extends Construct {
  public readonly webUrl: string;
```

変更後（カスタムドメイン対応）:
```typescript
export class Web extends Construct {
  public readonly webUrl: string;
  public readonly cloudFrontDomainName?: string;
```

**4-3. Route 53レコード作成処理の修正**

変更前（元のコード）:
```typescript
if (
  props.cert &&
  props.hostName &&
  props.domainName &&
  props.hostedZoneId
) {
  // DNS record for custom domain
  const hostedZone = HostedZone.fromHostedZoneAttributes(
    this,
    'HostedZone',
    {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    }
  );
  new ARecord(this, 'ARecord', {
    zone: hostedZone,
    recordName: props.hostName,
    target: RecordTarget.fromAlias(
      new CloudFrontTarget(cloudFrontWebDistribution)
    ),
  });
  this.webUrl = `https://${props.hostName}.${props.domainName}`;
} else {
  this.webUrl = `https://${cloudFrontWebDistribution.domainName}`;
}
```

変更後（カスタムドメイン対応）:
```typescript
if (
  props.cert &&
  props.hostName &&
  props.domainName &&
  props.hostedZoneId
) {
  // Note: In cross-account setup, DNS records must be created manually in the domain management account
  // The CloudFront distribution domain name is output for CNAME record creation
  /*const hostedZone = HostedZone.fromHostedZoneAttributes(
    this,
    'HostedZone',
    {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    }
  );
  new ARecord(this, 'ARecord', {
    zone: hostedZone,
    recordName: props.hostName,
    target: RecordTarget.fromAlias(
      new CloudFrontTarget(cloudFrontWebDistribution)
    ),
  });*/
  this.webUrl = `https://${props.hostName}.${props.domainName}`;
  this.cloudFrontDomainName = cloudFrontWebDistribution.domainName;
} else {
  this.webUrl = `https://${cloudFrontWebDistribution.domainName}`;
}
```

### ステップ5: generative-ai-use-cases-stack.tsの修正

`new CfnOutput(this, 'WebUrl', {...});` の後に以下を追加：
```typescript
// CloudFrontドメイン名を出力に追加し、CNAMEレコード作成時に参照できるように
if (web.cloudFrontDomainName) {
  new CfnOutput(this, 'CloudFrontDomainName', {
    value: web.cloudFrontDomainName,
    description: 'CloudFront domain name for CNAME record creation in domain management account',
  });
}
```

### ステップ6: デプロイ後の手動作業

1. デプロイを実行：
```bash
npm run cdk:deploy
```

2. 出力から CloudFront ドメイン名を取得：
```
Outputs:
GenerativeAiUseCasesStackDev.CloudFrontDomainName = d1234567890abc.cloudfront.net
```

3. ドメイン管理アカウント（Route 53）で手動でCNAMEレコードを作成：
   - レコード名: `dev-use-case`
   - レコードタイプ: CNAME
   - 値: `d1234567890abc.cloudfront.net`（手順2で取得した値）
   - TTL: 300秒

---

## 5. 注意事項

1. **Cognito関連の変更は残す**: 既存Cognito参照の変更はカスタムドメインとは無関係なので、元に戻さない
2. **RAG機能のコメントアウトは残す**: これもカスタムドメインとは無関係
3. **SharePoint/transcribe関連は残す**: これらも独立した機能追加
4. **cloudfrontHostname パラメータ**: これはフロントエンド用の設定なので、カスタムドメイン設定とは別に判断が必要

---

## 6. CUSTOM_DOMAIN_SETUP.mdの不足点

ドキュメントには以下が記載されていません：

1. `stack-input.ts` での `certificateArn` 型定義の追加
2. `generative-ai-use-cases-stack.ts` での CloudFrontドメイン名出力の追加
3. `parameter.ts` での具体的なパラメータ値（hostName, domainName等）の追加

**結論:** CUSTOM_DOMAIN_SETUP.mdの内容だけでは不十分で、上記の追加変更箇所も元に戻す必要があります。
