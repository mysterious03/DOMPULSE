import { build } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

async function runBuild() {
  console.log('--- 1. Building Extension UI, Background & Testbench ---');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 1. Build Popup, Background, and Testbench
  await build({
    configFile: resolve('vite.config.ts'),
  });

  console.log('--- 2. Building Self-Contained Content Script (IIFE) ---');
  // 2. Build Content script as a self-contained IIFE without module imports
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve('src/extension/content.ts'),
        name: 'DOMPulseContentScript',
        formats: ['iife'],
        fileName: () => 'content.js'
      }
    }
  });

  // Verify manifest and output paths
  if (fs.existsSync('dist/src/extension/popup/index.html')) {
    // Also copy popup.html to dist/popup.html for direct accessibility if preferred
    fs.copyFileSync('dist/src/extension/popup/index.html', 'dist/popup.html');
  }

  console.log('--- Build complete! dist/ is ready for Chrome "Load unpacked" ---');
}

runBuild().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
