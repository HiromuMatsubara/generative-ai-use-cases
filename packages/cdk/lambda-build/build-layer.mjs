import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const layerDir = path.join(__dirname, '../lambda-layer/nodejs');

// Bedrock SDK modules to include in layer
const layerModules = [
  '@aws-sdk/client-bedrock-runtime',
  '@aws-sdk/client-bedrock-agent-runtime',
  '@aws-sdk/client-sagemaker-runtime',
];

// Clean and create layer directory
if (fs.existsSync(layerDir)) {
  fs.rmSync(layerDir, { recursive: true });
}
fs.mkdirSync(layerDir, { recursive: true });

// Create package.json in layer directory
const packageJson = {
  name: 'bedrock-sdk-layer',
  version: '1.0.0',
  type: 'module',
  dependencies: {},
};

// Get versions from parent package.json
const parentPackageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

layerModules.forEach((mod) => {
  packageJson.dependencies[mod] =
    parentPackageJson.dependencies[mod] || 'latest';
});

fs.writeFileSync(
  path.join(layerDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('Installing layer dependencies...');
execSync('npm install --omit=dev', { cwd: layerDir, stdio: 'inherit' });

console.log('\n✓ Lambda Layer built successfully');
