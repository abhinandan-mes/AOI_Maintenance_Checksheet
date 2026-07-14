import * as chromeLauncher from 'chrome-launcher';
const lighthouse = require('lighthouse');
import * as fs from 'fs';
import * as path from 'path';

/**
 * Automates Lighthouse Audits for the FE SMT AOI Maintenance Checksheet application.
 * Verifies key metric scores and First Contentful Paint.
 */
async function runLighthouseAudit() {
  console.log('⚡ Starting programmatic Google Lighthouse performance and UX audit...');
  
  const targetUrl = 'http://localhost:3010/login';
  
  // Launch headless chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(targetUrl, options);
    const reportHtml = runnerResult.report;
    const reportJson = runnerResult.lhr;

    // Save report artifacts
    const outputDir = path.join(__dirname, '../lighthouse-reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputDir, 'report.html'), reportHtml);
    console.log(`✓ Saved HTML Report to: ${path.join(outputDir, 'report.html')}`);

    // Retrieve categories
    const perfScore = reportJson.categories.performance.score * 100;
    const a11yScore = reportJson.categories.accessibility.score * 100;
    const bpScore = reportJson.categories['best-practices'].score * 100;
    const seoScore = reportJson.categories.seo.score * 100;

    // Retrieve metrics
    const fcp = reportJson.audits['first-contentful-paint'].numericValue / 1000; // seconds

    console.log('\n=================== LIGHTHOUSE AUDIT SUMMARY ===================');
    console.log(`Target URL:            ${targetUrl}`);
    console.log(`Performance Score:     ${perfScore.toFixed(0)} / 100  (Target >= 85)`);
    console.log(`Accessibility Score:   ${a11yScore.toFixed(0)} / 100  (Target = 100)`);
    console.log(`Best Practices Score:  ${bpScore.toFixed(0)} / 100  (Target >= 90)`);
    console.log(`SEO Score:             ${seoScore.toFixed(0)} / 100  (Target >= 90)`);
    console.log(`First Contentful Paint: ${fcp.toFixed(2)}s       (Target < 2.0s)`);
    console.log('================================================================\n');

    // Assertions validation
    const failures: string[] = [];

    if (perfScore < 85) {
      failures.push(`Performance score (${perfScore.toFixed(0)}) is below the required 85 threshold.`);
    }
    if (a11yScore < 100) {
      failures.push(`Accessibility score (${a11yScore.toFixed(0)}) is below the required 100 (Full WCAG AA) threshold.`);
    }
    if (bpScore < 90) {
      failures.push(`Best Practices score (${bpScore.toFixed(0)}) is below the required 90 threshold.`);
    }
    if (seoScore < 90) {
      failures.push(`SEO score (${seoScore.toFixed(0)}) is below the required 90 threshold.`);
    }
    if (fcp > 2.0) {
      failures.push(`First Contentful Paint (${fcp.toFixed(2)}s) exceeds the limit of 2.0s.`);
    }

    if (failures.length > 0) {
      console.error('❌ Lighthouse Audit Failed! Threshold boundaries breached:');
      failures.forEach(f => console.error(`  - ${f}`));
      process.exit(1);
    } else {
      console.log('✅ Lighthouse Audit Passed! All quality gate thresholds met successfully.');
      process.exit(0);
    }

  } catch (err) {
    console.error('❌ Failed running Lighthouse audit script:', err);
    process.exit(1);
  } finally {
    await chrome.kill();
  }
}

runLighthouseAudit();
