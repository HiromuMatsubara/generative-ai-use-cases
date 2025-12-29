import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lambdaDir = path.join(__dirname, '../lambda');
const outDir = path.join(__dirname, '../lambda-dist');

// Lambda functions - nodeModules are in Lambda Layer
const lambdaConfigs = [
  { entry: 'predict.ts' },
  { entry: 'predictStream.ts' },
  { entry: 'invokeFlow.ts' },
  { entry: 'predictTitle.ts' },
  { entry: 'generateImage.ts' },
  { entry: 'generateVideo.ts' },
  { entry: 'copyVideoJob.ts' },
  { entry: 'listVideoJobs.ts' },
  { entry: 'deleteVideoJob.ts' },
  { entry: 'optimizePrompt.ts' },
  { entry: 'getFileUploadSignedUrl.ts' },
  { entry: 'getFileDownloadSignedUrl.ts' },
  { entry: 'queryKendra.ts' },
  { entry: 'retrieveKendra.ts' },
  { entry: 'retrieveKnowledgeBase.ts' },
  { entry: 'getTranscription.ts' },
  { entry: 'startTranscription.ts' },
  { entry: 'checkEmailDomain.ts' },
  { entry: 'agent.ts' },
  { entry: 'speechToSpeechTask.ts' },
  { entry: 'startSpeechToSpeechSession.ts' },
  { entry: 'agentBuilder.ts' },
  { entry: 'useCaseBuilder/listUseCases.ts' },
  { entry: 'useCaseBuilder/listFavoriteUseCases.ts' },
  { entry: 'useCaseBuilder/getUseCase.ts' },
  { entry: 'useCaseBuilder/createUseCase.ts' },
  { entry: 'useCaseBuilder/updateUseCase.ts' },
  { entry: 'useCaseBuilder/deleteUseCase.ts' },
  { entry: 'useCaseBuilder/toggleFavorite.ts' },
  { entry: 'useCaseBuilder/toggleShared.ts' },
  { entry: 'useCaseBuilder/listRecentlyUsedUseCases.ts' },
  { entry: 'useCaseBuilder/updateRecentlyUsedUseCase.ts' },
];

// Clean output directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true });
}

// Build all Lambda functions in parallel with ESM format
const buildPromises = lambdaConfigs.map(async (config) => {
  const functionName = path.basename(config.entry, '.ts');
  const functionOutDir = path.join(outDir, functionName);

  // External: AWS SDK (in Lambda runtime) + Bedrock SDK (in Layer)
  const external = ['@aws-sdk/*'];

  await esbuild.build({
    entryPoints: [path.join(lambdaDir, config.entry)],
    bundle: true,
    platform: 'node',
    target: 'esnext',
    format: 'esm',
    outfile: path.join(functionOutDir, 'index.mjs'),
    external,
    sourcemap: false,
    minify: false,
    mainFields: ['module', 'main'],
    banner: {
      js: "import { fileURLToPath } from 'url'; import { createRequire } from 'module'; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); import path from 'path'; const __dirname = path.dirname(__filename);",
    },
  });

  console.log(`✓ Built ${functionName}`);
});

try {
  await Promise.all(buildPromises);
  console.log('\n✓ All Lambda functions built successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
