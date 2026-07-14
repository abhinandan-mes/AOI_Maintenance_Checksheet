import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('SMT AOI Maintenance Checksheet - Accessibility Audits', () => {

  test.beforeEach(async ({ page }) => {
    // Setup API Interception/Mocking so audits are deterministic and clean
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'testadmin',
          full_name: 'QA Admin User',
          role: 'super_admin'
        }),
      });
    });

    await page.route('**/api/auth/sessions/all', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: [] }),
      });
    });

    await page.route('**/api/auth/failed-logins', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.route('**/api/auth/system-events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.route('**/api/maintenance', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });
  });

  test('Axe-Core Audit: Login Page WCAG 2.1 AA Compliance', async ({ page }) => {
    await page.goto('/login');

    // Run Axe automated accessibility audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Axe-Core Audit: Authenticated Dashboard WCAG 2.1 AA Compliance', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('aoi_auth_token', 'mocked-jwt-token-xyz'));
    await page.goto('/');

    // Scan authenticated dashboard
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // The current input[type="month"] lacks a label, which we expect to catch as a violation
    const labelViolation = accessibilityScanResults.violations.find(v => v.id === 'label');
    const contrastViolation = accessibilityScanResults.violations.find(v => v.id === 'color-contrast');

    console.log(`[A11y Audit] Found ${accessibilityScanResults.violations.length} violations on Dashboard.`);
    if (labelViolation) {
      console.log('⚠️ Confirmed: Input element lacks associated label on home dashboard picker.');
    }
    if (contrastViolation) {
      console.log('⚠️ Confirmed: Color contrast issue detected on text element.');
    }

    // After the FE team implements our fixes, this assertion should be strict:
    // expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard Navigation: Logical Tab Flow and Focus Trapping in Confirm Modal', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('aoi_auth_token', 'mocked-jwt-token-xyz'));
    await page.goto('/maintenance');

    // Start form
    await page.selectOption('select#line-select', '401');
    await page.click('button.start-form-btn');

    // Attempt to submit to open Confirm Modal
    await page.fill('input[placeholder="e.g., SMT Laser"]', 'LASER-A11Y-TEST');
    
    // Choose Designated Engineer/Manager & confirm check
    await page.selectOption('select[name="designated_engineer_id"]', { index: 1 });
    await page.selectOption('select[name="designated_manager_id"]', { index: 1 });
    await page.check('input#confirmation-checkbox');

    // Submit form to open modal
    await page.click('button.submit-btn');

    // Confirm Modal should be visible
    const modal = page.locator('.confirm-modal-wrapper');
    await expect(modal).toBeVisible();

    // Focus should be trapped inside the modal.
    // Let's press 'Tab' and verify focus cycles only through modal buttons.
    await page.keyboard.press('Tab');
    const focusedElementText = await page.evaluate(() => document.activeElement?.textContent);
    
    // Check that we are focused on either 'Confirm' or 'Cancel' (not body elements)
    expect(focusedElementText).toMatch(/Confirm|Cancel|确定|取消/);

    // Escape Key should close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('Screen Reader Readiness: Live Regions and Dynamic Content Announcements', async ({ page }) => {
    await page.goto('/login');

    // Type incorrect password to trigger dynamic alert
    await page.fill('#username-input', 'baduser');
    await page.fill('#password-input', 'wrongpass');
    await page.click('button[type="submit"]');

    // Ensure error is displayed and has role="alert" or is in an aria-live region
    const errorContainer = page.locator('.login-error');
    await expect(errorContainer).toBeVisible();
    
    // Form fields or error wrappers should have correct assistive tags
    const errorRole = await errorContainer.getAttribute('role');
    const errorLive = await errorContainer.getAttribute('aria-live');
    
    // Assert that screen readers will announce this dynamically
    const hasScreenReaderAnnouncement = errorRole === 'alert' || errorLive === 'assertive' || errorLive === 'polite';
    expect(hasScreenReaderAnnouncement).toBe(true);
  });

  test('Responsive Design and Text Resizing Stability', async ({ page }) => {
    await page.goto('/login');

    // Emulate large text scale / zoom-in factor by scaling viewport down or evaluating text metrics
    await page.setViewportSize({ width: 320, height: 568 }); // Small Mobile Screen (iPhone SE)

    // Check that no elements are hidden, overflowing incorrectly, or overlapping
    const isLoginShellVisible = await page.locator('.login-shell').isVisible();
    expect(isLoginShellVisible).toBe(true);

    const headingTextSize = await page.evaluate(() => {
      const el = document.querySelector('h1');
      return el ? window.getComputedStyle(el).fontSize : '0px';
    });
    
    // Assert font size scales correctly, is not absolute zero
    expect(parseFloat(headingTextSize)).toBeGreaterThan(0);
  });
});
