import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const chromePath = path.resolve(
  rootDir,
  'chrome/win64-155.0.8059.79/chrome-win64/chrome.exe'
);

async function runAudit() {
  console.log('Starting Vite preview server via Vite API on port 4173...');
  const previewServer = await preview({
    root: rootDir,
    preview: {
      port: 4173,
      strictPort: true,
    },
  });

  const serverUrl = previewServer.resolvedUrls.local[0] || 'http://localhost:4173/';
  console.log(`Vite preview running at: ${serverUrl}`);

  console.log(`Launching Chrome from ${chromePath}...`);
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['accessibility', 'performance'],
    port: chrome.port,
  };

  const results = {};

  try {
    const staffUrl = new URL('/', serverUrl).href;
    console.log(`Running Lighthouse audit on Staff Page (${staffUrl})...`);
    const runnerResultStaff = await lighthouse(staffUrl, options);
    const staffCategories = runnerResultStaff.lhr.categories;
    results.staff = {
      accessibility: Math.round((staffCategories.accessibility?.score || 0) * 100),
      performance: Math.round((staffCategories.performance?.score || 0) * 100),
    };

    const managerUrl = new URL('/manager', serverUrl).href;
    console.log(`Running Lighthouse audit on Manager Page (${managerUrl})...`);
    const runnerResultManager = await lighthouse(managerUrl, options);
    const managerCategories = runnerResultManager.lhr.categories;
    results.manager = {
      accessibility: Math.round((managerCategories.accessibility?.score || 0) * 100),
      performance: Math.round((managerCategories.performance?.score || 0) * 100),
    };

    console.log('\n================ LIGHTHOUSE AUDIT REPORT ================');
    console.log(`Staff Page ( / ):`);
    console.log(`  Accessibility Score: ${results.staff.accessibility}/100`);
    console.log(`  Performance Score:   ${results.staff.performance}/100`);
    console.log(`Manager Page ( /manager ):`);
    console.log(`  Accessibility Score: ${results.manager.accessibility}/100`);
    console.log(`  Performance Score:   ${results.manager.performance}/100`);
    console.log('=========================================================\n');
  } finally {
    await chrome.kill();
    previewServer.httpServer.close();
  }
}

runAudit().catch((err) => {
  console.error('Lighthouse audit failed:', err);
  process.exit(1);
});
