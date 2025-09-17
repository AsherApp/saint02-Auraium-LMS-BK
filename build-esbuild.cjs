const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting esbuild compilation...');

// Clean dist directory
if (fs.existsSync('dist')) {
  console.log('Cleaning dist directory...');
  fs.rmSync('dist', { recursive: true, force: true });
}

// Create dist directory
fs.mkdirSync('dist', { recursive: true });

// Copy package.json to dist
fs.copyFileSync('package.json', 'dist/package.json');

// Use esbuild to compile the main server file
console.log('Compiling with esbuild...');
try {
  execSync('npx esbuild src/server.ts --bundle --platform=node --target=node18 --format=cjs --outfile=dist/server.js --loader:.ts=ts --external:@supabase/supabase-js --external:express --external:cors --external:helmet --external:bcrypt --external:jose --external:multer --external:nodemailer --external:pdf-lib --external:stripe --external:zod --external:ajv --external:csv-parser --external:xlsx --external:livekit-server-sdk --external:express-rate-limit --external:dotenv', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
