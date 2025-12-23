import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const layerDir = path.join(__dirname, '../lambda-layer/nodejs');
const checksumFile = path.join(__dirname, '../lambda-layer/.checksum');

// Bedrock SDK modules to include in layer
const layerModules = [
  '@aws-sdk/client-bedrock-runtime',
  '@aws-sdk/client-bedrock-agent-runtime',
  '@aws-sdk/client-sagemaker-runtime',
];

// Get versions from parent package.json
const parentPackageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

// Create package.json content
const packageJson = {
  name: 'bedrock-sdk-layer',
  version: '1.0.0',
  type: 'module',
  dependencies: {},
};

layerModules.forEach((mod) => {
  packageJson.dependencies[mod] =
    parentPackageJson.dependencies[mod] || 'latest';
});

// Calculate checksum
const currentChecksum = crypto
  .createHash('md5')
  .update(JSON.stringify(packageJson.dependencies))
  .digest('hex');

// Check if rebuild is needed
if (fs.existsSync(checksumFile) && fs.existsSync(layerDir)) {
  const previousChecksum = fs.readFileSync(checksumFile, 'utf-8').trim();
  if (previousChecksum === currentChecksum) {
    console.log('✓ Lambda Layer is up to date (skipped)');
    process.exit(0);
  }
}

// Clean and create layer directory
if (fs.existsSync(layerDir)) {
  fs.rmSync(layerDir, { recursive: true });
}
fs.mkdirSync(layerDir, { recursive: true });

fs.writeFileSync(
  path.join(layerDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('Installing layer dependencies...');
execSync('npm install --omit=dev', { cwd: layerDir, stdio: 'inherit' });

// Save checksum
fs.writeFileSync(checksumFile, currentChecksum);

console.log('\n✓ Lambda Layer built successfully');
