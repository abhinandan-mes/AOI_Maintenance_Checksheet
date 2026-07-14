import { test, expect } from '@playwright/test';

test.describe('SMT AOI Maintenance Checksheet - E2E Flows', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Setup API Interception/Mocking to decouple tests from the backend DB/network
    await page.route('**/api/auth/login', async (route) => {
      const requestBody = route.request().postDataJSON();
      if (requestBody.username === 'testadmin' && requestBody.password === 'Password123!') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mocked-jwt-token-xyz',
            user: { username: 'testadmin', full_name: 'QA Admin User', role: 'super_admin' }
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' }),
        });
      }
    });

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

    await page.route('**/api/auth/active-assignees', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            { id: '1', username: 'eng1', full_name: 'Engineer One', role: 'engineer' },
            { id: '2', username: 'mgr1', full_name: 'Manager One', role: 'manager' }
          ]
        }),
      });
    });

    await page.route('**/api/auth/sessions/all', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              username: 'testadmin',
              full_name: 'QA Admin User',
              role: 'super_admin',
              last_login: new Date().toISOString(),
              public_ip: '127.0.0.1',
              active_sessions_count: 1
            }
          ]
        }),
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
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, id: 'm-999' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }
    });
  });

  test('Flow 1: User Login - Authentication Validation & Error Handling', async ({ page }) => {
    // Navigate to Login Page
    await page.goto('/login');

    // Assert form visibility
    await expect(page.locator('form.login-form')).toBeVisible();

    // 1. Invalid Login Attempt
    await page.fill('#username-input', 'baduser');
    await page.fill('#password-input', 'wrongpass');
    await page.click('button[type="submit"]');

    // Assert error message
    const errorContainer = page.locator('.login-error');
    await expect(errorContainer).toBeVisible();

    // Visual Regression: Capture login error state
    await expect(page).toHaveScreenshot('login-error-state.png', { maxDiffPixels: 50 });

    // 2. Successful Login Attempt
    await page.fill('#username-input', 'testadmin');
    await page.fill('#password-input', 'Password123!');
    
    // Toggle password visibility and assert type change
    await page.click('.password-toggle-btn');
    await expect(page.locator('#password-input')).toHaveAttribute('type', 'text');
    await page.click('.password-toggle-btn');
    await expect(page.locator('#password-input')).toHaveAttribute('type', 'password');

    await page.click('button[type="submit"]');

    // Assert successful redirection and landing state
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('QA Admin User');
    await expect(page.locator('.role-pill-badge')).toContainText('Super Admin');

    // Visual Regression: Captured logged-in Dashboard
    await expect(page).toHaveScreenshot('dashboard-loaded-state.png', { maxDiffPixels: 100 });
  });

  test('Flow 2: Maintenance Form - Create, Step Validation, and Mocked Submission', async ({ page }) => {
    // Go directly to authenticated route (mocked auth token set in localStorage first)
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('aoi_auth_token', 'mocked-jwt-token-xyz'));
    await page.goto('/maintenance');

    // Ensure form container loaded
    await expect(page.locator('.maintenance-form-container')).toBeVisible();

    // Select SMT Production Line (e.g. Line 401)
    await page.selectOption('select#line-select', '401');
    await page.click('button.start-form-btn');

    // Form steps should expand. Assert visibility of specific machine blocks
    await expect(page.locator('.machine-type-banner').first()).toBeVisible();

    // Perform validation checking: Leave laser machine asset empty and attempt submission
    await page.fill('input[placeholder="e.g., SMT Laser"]', ''); // Asset empty
    
    // Check all checkboxes of the first block (LASER)
    const checkboxes = page.locator('.checkbox-input input[type="checkbox"]');
    const laserCount = 10; // First 10 checkboxes are LASER
    for (let i = 0; i < laserCount; i++) {
      await checkboxes.nth(i).check();
    }

    // Try to click Submit. Check that validation alerts prevent submission
    await page.locator('.submit-btn').click();

    // Assert validation popup/alert shows up or confirmation error
    await expect(page.locator('.confirm-modal-wrapper')).not.toBeVisible(); // Lacks signature confirmation

    // Fill the mandatory asset text field to pass the validation check
    await page.fill('input[placeholder="e.g., SMT Laser"]', 'LASER-ASSET-001');

    // Choose Designated Engineer and Designated Manager
    await page.selectOption('select[name="designated_engineer_id"]', { index: 1 });
    await page.selectOption('select[name="designated_manager_id"]', { index: 1 });

    // Confirm form compliance
    await page.check('input#confirmation-checkbox');

    // Perform Mocked Submission
    await page.click('button.submit-btn');

    // Verify confirmation modal shows up
    await expect(page.locator('.confirm-modal-wrapper')).toBeVisible();
    await page.click('.modal-btn-confirm');

    // Success banner or redirect to pending / home should happen
    await expect(page).toHaveURL('/');
  });
});
