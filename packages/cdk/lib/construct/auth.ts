import { Duration, CfnOutput } from 'aws-cdk-lib'; // CfnOutputを追加インポート
import {
  UserPool,
  UserPoolClient,
  // UserPoolOperation, // 既存リソース参照時は不要なためコメントアウト
  IUserPool, // 既存UserPoolを参照するためのインターフェース型を追加
  IUserPoolClient // 既存UserPoolClientを参照するためのインターフェース型を追加
} from 'aws-cdk-lib/aws-cognito';
import {
  IdentityPool,
  UserPoolAuthenticationProvider,
} from 'aws-cdk-lib/aws-cognito-identitypool';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LAMBDA_RUNTIME_NODEJS } from '../../consts';
import * as iam from 'aws-cdk-lib/aws-iam'; // Lambda関数に権限を追加するために必要

export interface AuthProps {
  readonly selfSignUpEnabled: boolean;
  readonly allowedIpV4AddressRanges?: string[] | null;
  readonly allowedIpV6AddressRanges?: string[] | null;
  readonly allowedSignUpEmailDomains?: string[] | null;
  readonly samlAuthEnabled: boolean;
}

export class Auth extends Construct {
  // 具象クラスからインターフェース型に変更（既存リソース参照のため）
  readonly userPool: IUserPool; // UserPool → IUserPool
  readonly client: IUserPoolClient; // UserPoolClient → IUserPoolClient
  readonly idPool: IdentityPool;

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id);

    // 既存のCognitoリソースを参照するためのIDをコンテキストから取得
    const cognitoUserPoolId = this.node.tryGetContext('cognitoUserPoolId');
    const cognitoAppClientId = this.node.tryGetContext('cognitoAppClientId');
    const cognitoIdpoolId = this.node.tryGetContext('cognitoIdpoolId');
    
    // 既存のUserPoolとUserPoolClientを参照
    const userPool = UserPool.fromUserPoolId(this, 'UserPool', cognitoUserPoolId);
    const client = UserPoolClient.fromUserPoolClientId(this, 'client', cognitoAppClientId);

    // 以下の新規作成コードはコメントアウト（既存リソースを使用するため）
    /*
    const userPool = new UserPool(this, 'UserPool', {
      // If SAML authentication is enabled, do not use self-sign-up with UserPool. Be aware of security.
      selfSignUpEnabled: props.samlAuthEnabled
        ? false
        : props.selfSignUpEnabled,
      signInAliases: {
        username: false,
        email: true,
      },
      passwordPolicy: {
        requireUppercase: true,
        requireSymbols: true,
        requireDigits: true,
        minLength: 8,
      },
    });

    const client = userPool.addClient('client', {
      idTokenValidity: Duration.days(1),
    });
    */

    // Identity Poolは新規作成するが、名前は既存のIDを使用
    const idPool = new IdentityPool(this, 'IdentityPool', {
      identityPoolName: cognitoIdpoolId, // 新規作成するIdentity Poolの名前として既存IDを指定
      authenticationProviders: {
        userPools: [
          new UserPoolAuthenticationProvider({
            userPool,
            userPoolClient: client,
          }),
        ],
      },
    });

    if (props.allowedIpV4AddressRanges || props.allowedIpV6AddressRanges) {
      const ipRanges = [
        ...(props.allowedIpV4AddressRanges
          ? props.allowedIpV4AddressRanges
          : []),
        ...(props.allowedIpV6AddressRanges
          ? props.allowedIpV6AddressRanges
          : []),
      ];

      idPool.authenticatedRole.attachInlinePolicy(
        new Policy(this, 'SourceIpPolicy', {
          statements: [
            new PolicyStatement({
              effect: Effect.DENY,
              resources: ['*'],
              actions: ['*'],
              conditions: {
                NotIpAddress: {
                  'aws:SourceIp': ipRanges,
                },
              },
            }),
          ],
        })
      );
    }

    idPool.authenticatedRole.attachInlinePolicy(
      new Policy(this, 'PollyPolicy', {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            resources: ['*'],
            actions: ['polly:SynthesizeSpeech'],
          }),
        ],
      })
    );

    // Lambda
    if (props.allowedSignUpEmailDomains) {
      const checkEmailDomainFunction = new NodejsFunction(
        this,
        'CheckEmailDomain',
        {
          runtime: LAMBDA_RUNTIME_NODEJS,
          entry: './lambda/checkEmailDomain.ts',
          timeout: Duration.minutes(15),
          environment: {
            ALLOWED_SIGN_UP_EMAIL_DOMAINS_STR: JSON.stringify(
              props.allowedSignUpEmailDomains
            ),
          },
        }
      );

      // 既存UserPoolではaddTriggerメソッドが使えないためコメントアウト
      /*
      userPool.addTrigger(
        UserPoolOperation.PRE_SIGN_UP,
        checkEmailDomainFunction
      );
      */

      // Lambda関数に必要な権限を追加（Cognitoサービスからの呼び出しを許可）
      // これはaddTriggerメソッドの代わりに必要な設定
      checkEmailDomainFunction.addPermission('InvokePreSignUpHandlerPermission', {
        principal: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
        sourceArn: userPool.userPoolArn
      });
      
      // Lambda関数名を出力（AWSコンソールでトリガー設定を手動で行うための情報提供）
      new CfnOutput(this, 'required.UserPoolAddTrigger.PRE_SIGN_UP', {
        value: checkEmailDomainFunction.functionName,
      });
    }

    this.client = client;
    this.userPool = userPool;
    this.idPool = idPool;
  }
}
