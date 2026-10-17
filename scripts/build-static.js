const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();
const apiDir = path.join(rootDir, 'src', 'app', 'api');
const apiBackup = path.join(rootDir, 'src', 'api_temp_backup');
const nextConfigPath = path.join(rootDir, 'next.config.js');

console.log('🚀 Preparing Next.js static export for Google Firebase Hosting...');

// 1. Move api folder temporarily so Next.js static export doesn't block on dynamic API routes
let movedApi = false;
if (fs.existsSync(apiDir)) {
  fs.renameSync(apiDir, apiBackup);
  movedApi = true;
  console.log('📦 Archived API routes for static export generation.');
}

// Read .env if available
const envFile = path.join(rootDir, '.env');
const envVars = {};
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        envVars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  }
}

const fbKey = envVars.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
const fbAuth = envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'sustainability-hackathon-1a68e.firebaseapp.com';
const fbProj = envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'sustainability-hackathon-1a68e';
const fbBucket = envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'sustainability-hackathon-1a68e.firebasestorage.app';
const fbAppId = envVars.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '';
const geminiKey = envVars.NEXT_PUBLIC_GEMINI_API_KEY || envVars.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

// 2. Write temporary next.config.js with output: 'export'
const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: ${JSON.stringify(fbKey)},
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${JSON.stringify(fbAuth)},
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${JSON.stringify(fbProj)},
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${JSON.stringify(fbBucket)},
    NEXT_PUBLIC_FIREBASE_APP_ID: ${JSON.stringify(fbAppId)},
    NEXT_PUBLIC_GEMINI_API_KEY: ${JSON.stringify(geminiKey)},
    GEMINI_API_KEY: ${JSON.stringify(geminiKey)},
  },
};
module.exports = nextConfig;
`;

fs.writeFileSync(nextConfigPath, nextConfigContent, 'utf-8');

try {
  console.log('⚙️ Building production static package (next build)...');
  execSync('npx next build', { stdio: 'inherit', cwd: rootDir });
  console.log('✅ Static export build succeeded! Exported to "out" directory.');
} catch (buildErr) {
  console.error('❌ Build failed:', buildErr);
  throw buildErr;
} finally {
  // 3. Restore API directory and clean up temporary next.config.js
  if (movedApi && fs.existsSync(apiBackup)) {
    fs.renameSync(apiBackup, apiDir);
    console.log('🔄 Restored dynamic API routes for local development.');
  }
  if (fs.existsSync(nextConfigPath)) {
    fs.unlinkSync(nextConfigPath);
  }
}

// 4. Verify out folder
const outDir = path.join(rootDir, 'out');
if (fs.existsSync(outDir) && fs.existsSync(path.join(outDir, 'index.html'))) {
  console.log('🎉 "out/index.html" is ready for "firebase deploy"!');
} else {
  console.warn('⚠️ Warning: "out/index.html" was not found.');
}
