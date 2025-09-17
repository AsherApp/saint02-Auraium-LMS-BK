const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting fresh build...');

// Clean dist directory
if (fs.existsSync('dist')) {
  console.log('Cleaning dist directory...');
  fs.rmSync('dist', { recursive: true, force: true });
}

// Create dist directory
fs.mkdirSync('dist', { recursive: true });

// Copy package.json to dist
fs.copyFileSync('package.json', 'dist/package.json');

// Use tsc with minimal configuration
console.log('Compiling TypeScript...');
try {
  execSync('npx tsc --outDir dist --rootDir src --target ES2022 --module CommonJS --moduleResolution Node --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck --noImplicitAny false --strict false src/**/*.ts', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
