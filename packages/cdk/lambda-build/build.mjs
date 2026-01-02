import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lambdaDir = path.join(__dirname, '../lambda');
const outDir = path.join(__dirname, '../lambda-dist');

// Lambda functions - nodeModules are in Lambda Layer
// Only functions that are directly invoked (not via API Gateway)
const lambdaConfigs = [
  // Predict
  { entry: 'predictStream.ts' },

  // Flow
  { entry: 'invokeFlow.ts' },
  { entry: 'optimizePrompt.ts' },

  // Speech
  { entry: 'speechToSpeechTask.ts' },

  // Agent
  { entry: 'agent.ts' },

  // Helper functions
  { entry: 'checkEmailDomain.ts' },

  // Video job processing (async)
  { entry: 'copyVideoJob.ts' },
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
