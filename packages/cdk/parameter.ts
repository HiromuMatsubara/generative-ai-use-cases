import * as cdk from 'aws-cdk-lib';
import {
  StackInput,
  stackInputSchema,
  ProcessedStackInput,
} from './lib/stack-input';
import { ModelConfiguration } from 'generative-ai-use-cases';
import { loadBrandingConfig } from './branding';

// Get parameters from CDK Context
const getContext = (app: cdk.App): StackInput => {
  const params = stackInputSchema.parse(app.node.getAllContext());
  return params;
};

// If you want to define parameters directly
const envs: Record<string, Partial<StackInput>> = {
  // 開発環境の設定
  dev2: {
    env: 'dev2',
    tagKey: null,
    tagValue: null,
    ragEnabled: false,
    kendraIndexArn: null,
    kendraIndexLanguage: 'ja',
    kendraDataSourceBucketName: null,
    kendraIndexScheduleEnabled: false,
    kendraIndexScheduleCreateCron: null,
    kendraIndexScheduleDeleteCron: null,
    ragKnowledgeBaseEnabled: false,
    ragKnowledgeBaseId: null,
    ragKnowledgeBaseStandbyReplicas: false,
    ragKnowledgeBaseAdvancedParsing: false,
    ragKnowledgeBaseAdvancedParsingModelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    ragKnowledgeBaseBinaryVector: false,
    embeddingModelId: 'amazon.titan-embed-text-v2:0',
    rerankingModelId: null,
    queryDecompositionEnabled: false,
    selfSignUpEnabled: false,
    allowedSignUpEmailDomains: ['toyoda-gosei.co.jp', 'ts.toyoda-gosei.co.jp', 'tgtc.toyoda-gosei.co.jp'],
    samlAuthEnabled: true,
    samlCognitoDomainName: 'genu-dev2.auth.ap-northeast-1.amazoncognito.com',
    samlCognitoFederatedIdentityProviderName: 'TGADSSO-GenU-Sandbox',
    sharepointRedirectUrl: 'https://toyodagoseicorp.sharepoint.com/sites/TG-AI',
    cloudfrontHostname: '',
    hiddenUseCases: {
      generate: true,
      summarize: true,
      writer: true,
      translate: true,
      webContent: true,
      image: true,
      video: true,
      videoAnalyzer: true,
      diagram: true,
      meetingMinutes: true,
      transcribe: true,
    },
    modelRegion: 'us-east-1',
    modelIds: [
      'global.anthropic.claude-sonnet-4-6',
      "global.anthropic.claude-haiku-4-5-20251001-v1:0",
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      'us.anthropic.claude-3-5-haiku-20241022-v1:0',
    ],
    imageGenerationModelIds: [],
    videoGenerationModelIds: [],
    speechToSpeechModelIds: [],
    endpointNames: [],
    agentEnabled: false,
    searchAgentEnabled: false,
    searchEngine: 'Brave',
    searchApiKey: '',
    agents: [],
    inlineAgents: false,
    mcpEnabled: false,
    flows: [],
    agentBuilderEnabled: false,
    createGenericAgentCoreRuntime: false,
    agentCoreRegion: null,
    agentCoreExternalRuntimes: [],
    agentCoreGatewayArns: [],
    researchAgentEnabled: false,
    researchAgentBraveApiKey: '',
    researchAgentTavilyApiKey: '',
    allowedIpV4AddressRanges: null,
    allowedIpV6AddressRanges: null,
    allowedCountryCodes: ['JP'],
    hostName: null,
    domainName: null,
    hostedZoneId: null,
    certificateArn: null,
    dashboard: false,
    anonymousUsageTracking: true,
    guardrailEnabled: false,
    crossAccountBedrockRoleArn: '',
    useCaseBuilderEnabled: true,
    closedNetworkMode: false,
    closedNetworkVpcIpv4Cidr: '10.0.0.0/16',
    closedNetworkVpcId: null,
    closedNetworkSubnetIds: null,
    closedNetworkCertificateArn: null,
    closedNetworkDomainName: null,
    closedNetworkCreateTestEnvironment: true,
    closedNetworkCreateResolverEndpoint: true,
  },
  // 本番環境の設定
  prod: {
    env: 'prod',
    tagKey: null,
    tagValue: null,
    ragEnabled: false,
    kendraIndexArn: null,
    kendraIndexLanguage: 'ja',
    kendraDataSourceBucketName: null,
    kendraIndexScheduleEnabled: false,
    kendraIndexScheduleCreateCron: null,
    kendraIndexScheduleDeleteCron: null,
    ragKnowledgeBaseEnabled: false,
    ragKnowledgeBaseId: null,
    ragKnowledgeBaseStandbyReplicas: false,
    ragKnowledgeBaseAdvancedParsing: false,
    ragKnowledgeBaseAdvancedParsingModelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    ragKnowledgeBaseBinaryVector: false,
    embeddingModelId: 'amazon.titan-embed-text-v2:0',
    rerankingModelId: null,
    queryDecompositionEnabled: false,
    selfSignUpEnabled: false,
    allowedSignUpEmailDomains: ['toyoda-gosei.co.jp', 'ts.toyoda-gosei.co.jp', 'tgtc.toyoda-gosei.co.jp'],
    samlAuthEnabled: true,
    samlCognitoDomainName: 'tgrag-sandbox.auth.ap-northeast-1.amazoncognito.com',
    samlCognitoFederatedIdentityProviderName: 'TGADSSO-GenU-Sandbox',
    sharepointRedirectUrl: 'https://toyodagoseicorp.sharepoint.com/sites/TG-AI',
    cloudfrontHostname: 'dev-use-case.toyoda-gosei.cloud',
    hiddenUseCases: {
      generate: true,
      summarize: true,
      writer: true,
      translate: true,
      webContent: true,
      image: true,
      video: true,
      videoAnalyzer: true,
      diagram: true,
      meetingMinutes: true,
      transcribe: true,
    },
    modelRegion: 'us-east-1',
    modelIds: [
      'global.anthropic.claude-sonnet-4-6',
      "global.anthropic.claude-haiku-4-5-20251001-v1:0",
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      'us.anthropic.claude-3-5-haiku-20241022-v1:0',
    ],
    imageGenerationModelIds: [],
    videoGenerationModelIds: [],
    speechToSpeechModelIds: [],
    endpointNames: [],
    agentEnabled: false,
    searchAgentEnabled: false,
    searchEngine: 'Brave',
    searchApiKey: '',
    agents: [],
    inlineAgents: false,
    mcpEnabled: false,
    flows: [],
    agentBuilderEnabled: false,
    createGenericAgentCoreRuntime: false,
    agentCoreRegion: null,
    agentCoreExternalRuntimes: [],
    agentCoreGatewayArns: [],
    researchAgentEnabled: false,
    researchAgentBraveApiKey: '',
    researchAgentTavilyApiKey: '',
    allowedIpV4AddressRanges: null,
    allowedIpV6AddressRanges: null,
    allowedCountryCodes: ['JP'],
    hostName: 'dev-use-case',
    domainName: 'toyoda-gosei.cloud',
    hostedZoneId: 'Z06981541W689JS4J4YWU',
    certificateArn: 'arn:aws:acm:us-east-1:014852200397:certificate/cb5c3877-3483-4b18-b54c-ac1e90100a4c',
    dashboard: false,
    anonymousUsageTracking: true,
    guardrailEnabled: false,
    crossAccountBedrockRoleArn: '',
    useCaseBuilderEnabled: true,
    closedNetworkMode: false,
    closedNetworkVpcIpv4Cidr: '10.0.0.0/16',
    closedNetworkVpcId: null,
    closedNetworkSubnetIds: null,
    closedNetworkCertificateArn: null,
    closedNetworkDomainName: null,
    closedNetworkCreateTestEnvironment: true,
    closedNetworkCreateResolverEndpoint: true,
  },
};

// For backward compatibility, get parameters from CDK Context > parameter.ts
export const getParams = (app: cdk.App): ProcessedStackInput => {
  // By default, get parameters from CDK Context
  let params = getContext(app);

  // If the env matches the ones defined in envs, use the parameters in envs instead of the ones in context
  if (envs[params.env]) {
    params = stackInputSchema.parse({
      ...envs[params.env],
      env: params.env,
    });
  }
  // Make the format of modelIds, imageGenerationModelIds consistent
  const convertToModelConfiguration = (
    models: (string | ModelConfiguration)[],
    defaultRegion: string
  ): ModelConfiguration[] => {
    return models.map((model) =>
      typeof model === 'string'
        ? { modelId: model, region: defaultRegion }
        : model
    );
  };

  return {
    ...params,
    modelIds: convertToModelConfiguration(params.modelIds, params.modelRegion),
    imageGenerationModelIds: convertToModelConfiguration(
      params.imageGenerationModelIds,
      params.modelRegion
    ),
    videoGenerationModelIds: convertToModelConfiguration(
      params.videoGenerationModelIds,
      params.modelRegion
    ),
    speechToSpeechModelIds: convertToModelConfiguration(
      params.speechToSpeechModelIds,
      params.modelRegion
    ),
    endpointNames: convertToModelConfiguration(
      params.endpointNames,
      params.modelRegion
    ),
    // Process agentCoreRegion: null -> modelRegion
    agentCoreRegion: params.agentCoreRegion || params.modelRegion,
    // Load branding configuration
    brandingConfig: loadBrandingConfig(),
  };
};
